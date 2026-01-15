/**
 * Core Simulation Engine Module
 *
 * Provides the core simulation logic for digital circuits.
 * Extracted from index.html for modularity.
 *
 * Features:
 * - Load circuit definitions from JSON
 * - Step-by-step or continuous simulation
 * - Signal propagation through gates
 * - State management (save, load, reset)
 * - Event system for module communication
 *
 * Usage:
 *   import { SimulationEngine } from './core-engine.js';
 *   const engine = new SimulationEngine();
 *   engine.load(circuitJson);
 *   engine.on('step', () => console.log('Stepped'));
 *   engine.step();
 */

// Signal states
const SignalState = Object.freeze({
    LOW: 0,      // GND / Logic 0
    HIGH: 1,     // VDD / Logic 1
    UNKNOWN: 2   // Floating / Undefined
});

// Gate types supported
const GateType = Object.freeze({
    VDD: 'vdd',
    GND: 'gnd',
    SWITCH: 'switch',
    LED: 'led',
    NOT: 'NOT',
    AND: 'AND',
    OR: 'OR',
    NAND: 'NAND',
    NOR: 'NOR',
    XOR: 'XOR',
    XNOR: 'XNOR',
    BUF: 'BUF'
});

/**
 * Wire class - represents a connection that carries a signal
 */
class Wire {
    constructor(id, name, width = 1) {
        this.id = id;
        this.name = name;
        this.width = width;
        this.states = new Array(width).fill(SignalState.UNKNOWN);
        this.isInput = false;
        this.isOutput = false;
    }

    getState(bit = 0) {
        return this.states[bit] ?? SignalState.UNKNOWN;
    }

    setState(bit, value) {
        if (bit >= 0 && bit < this.width) {
            this.states[bit] = value;
        }
    }

    setAllBits(value) {
        for (let i = 0; i < this.width; i++) {
            this.states[i] = value;
        }
    }

    clone() {
        const w = new Wire(this.id, this.name, this.width);
        w.states = [...this.states];
        w.isInput = this.isInput;
        w.isOutput = this.isOutput;
        return w;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            width: this.width,
            state: [...this.states],
            is_input: this.isInput,
            is_output: this.isOutput
        };
    }
}

/**
 * Component class - represents a gate or circuit element
 */
class Component {
    constructor(id, type, x = 0, y = 0) {
        this.id = id;
        this.type = type;
        this.x = x;
        this.y = y;
        this.name = '';

        // Port definitions based on type
        this.inputs = [];
        this.outputs = [];
        this.inputStates = [];
        this.outputStates = [];

        // For switches
        this.state = 0;

        // For DFFs/registers
        this.storedValue = 0;

        this._initializePorts();
    }

    _initializePorts() {
        switch (this.type) {
            case GateType.VDD:
                this.outputs = [{ x: 40, y: 15 }];
                this.outputStates = [SignalState.HIGH];
                this.state = 1;
                break;

            case GateType.GND:
                this.inputs = [{ x: 0, y: 15 }];
                this.outputs = [{ x: 40, y: 15 }];
                this.inputStates = [SignalState.UNKNOWN];
                this.outputStates = [SignalState.LOW];
                this.state = 0;
                break;

            case GateType.SWITCH:
                this.inputs = [{ x: 0, y: 15 }];  // Power input
                this.outputs = [{ x: 50, y: 15 }];
                this.inputStates = [SignalState.UNKNOWN];
                this.outputStates = [SignalState.LOW];
                break;

            case GateType.LED:
                this.inputs = [{ x: 0, y: 25 }];
                this.outputs = [{ x: 40, y: 25 }];
                this.inputStates = [SignalState.UNKNOWN];
                this.outputStates = [SignalState.UNKNOWN];
                break;

            case GateType.NOT:
            case GateType.BUF:
                // VDD (top), control (left), GND (bottom)
                this.inputs = [
                    { x: 50, y: 0 },   // VDD
                    { x: 0, y: 40 },   // Control
                    { x: 50, y: 80 }   // GND
                ];
                this.outputs = [{ x: 100, y: 40 }];
                this.inputStates = [SignalState.UNKNOWN, SignalState.UNKNOWN, SignalState.UNKNOWN];
                this.outputStates = [SignalState.UNKNOWN];
                break;

            default:
                // 2-input gates: AND, OR, NAND, NOR, XOR, XNOR
                // VDD (top), A (left-top), B (left-bottom), GND (bottom)
                this.inputs = [
                    { x: 50, y: 0 },    // VDD
                    { x: 0, y: 24 },    // A
                    { x: 0, y: 56 },    // B
                    { x: 50, y: 80 }    // GND
                ];
                this.outputs = [{ x: 100, y: 40 }];
                this.inputStates = [SignalState.UNKNOWN, SignalState.UNKNOWN, SignalState.UNKNOWN, SignalState.UNKNOWN];
                this.outputStates = [SignalState.UNKNOWN];
                break;
        }
    }

    /**
     * Evaluate the component and compute output based on inputs
     * @returns {boolean} True if output changed
     */
    evaluate() {
        const oldOutput = this.outputStates[0];
        let newOutput = SignalState.UNKNOWN;

        switch (this.type) {
            case GateType.VDD:
                newOutput = SignalState.HIGH;
                break;

            case GateType.GND:
                newOutput = SignalState.LOW;
                break;

            case GateType.SWITCH: {
                const powerIn = this.inputStates[0];
                if (this.state === 1 && powerIn === SignalState.HIGH) {
                    newOutput = SignalState.HIGH;
                } else {
                    newOutput = SignalState.LOW;
                }
                break;
            }

            case GateType.LED: {
                const input = this.inputStates[0];
                newOutput = input === SignalState.HIGH ? SignalState.LOW : input;
                break;
            }

            case GateType.NOT: {
                const vdd = this.inputStates[0];
                const ctrl = this.inputStates[1];
                const gnd = this.inputStates[2];

                if (vdd === SignalState.HIGH && gnd === SignalState.LOW && ctrl !== SignalState.UNKNOWN) {
                    newOutput = ctrl === SignalState.LOW ? SignalState.HIGH : SignalState.LOW;
                }
                break;
            }

            case GateType.BUF: {
                const vdd = this.inputStates[0];
                const ctrl = this.inputStates[1];
                const gnd = this.inputStates[2];

                if (vdd === SignalState.HIGH && gnd === SignalState.LOW && ctrl !== SignalState.UNKNOWN) {
                    newOutput = ctrl;
                }
                break;
            }

            case GateType.AND: {
                const vdd = this.inputStates[0];
                const a = this.inputStates[1];
                const b = this.inputStates[2];
                const gnd = this.inputStates[3];

                if (vdd === SignalState.HIGH && gnd === SignalState.LOW &&
                    a !== SignalState.UNKNOWN && b !== SignalState.UNKNOWN) {
                    newOutput = (a === SignalState.HIGH && b === SignalState.HIGH) ?
                        SignalState.HIGH : SignalState.LOW;
                }
                break;
            }

            case GateType.OR: {
                const vdd = this.inputStates[0];
                const a = this.inputStates[1];
                const b = this.inputStates[2];
                const gnd = this.inputStates[3];

                if (vdd === SignalState.HIGH && gnd === SignalState.LOW &&
                    a !== SignalState.UNKNOWN && b !== SignalState.UNKNOWN) {
                    newOutput = (a === SignalState.HIGH || b === SignalState.HIGH) ?
                        SignalState.HIGH : SignalState.LOW;
                }
                break;
            }

            case GateType.NAND: {
                const vdd = this.inputStates[0];
                const a = this.inputStates[1];
                const b = this.inputStates[2];
                const gnd = this.inputStates[3];

                if (vdd === SignalState.HIGH && gnd === SignalState.LOW &&
                    a !== SignalState.UNKNOWN && b !== SignalState.UNKNOWN) {
                    newOutput = !(a === SignalState.HIGH && b === SignalState.HIGH) ?
                        SignalState.HIGH : SignalState.LOW;
                }
                break;
            }

            case GateType.NOR: {
                const vdd = this.inputStates[0];
                const a = this.inputStates[1];
                const b = this.inputStates[2];
                const gnd = this.inputStates[3];

                if (vdd === SignalState.HIGH && gnd === SignalState.LOW &&
                    a !== SignalState.UNKNOWN && b !== SignalState.UNKNOWN) {
                    newOutput = !(a === SignalState.HIGH || b === SignalState.HIGH) ?
                        SignalState.HIGH : SignalState.LOW;
                }
                break;
            }

            case GateType.XOR: {
                const vdd = this.inputStates[0];
                const a = this.inputStates[1];
                const b = this.inputStates[2];
                const gnd = this.inputStates[3];

                if (vdd === SignalState.HIGH && gnd === SignalState.LOW &&
                    a !== SignalState.UNKNOWN && b !== SignalState.UNKNOWN) {
                    newOutput = (a !== b) ? SignalState.HIGH : SignalState.LOW;
                }
                break;
            }

            case GateType.XNOR: {
                const vdd = this.inputStates[0];
                const a = this.inputStates[1];
                const b = this.inputStates[2];
                const gnd = this.inputStates[3];

                if (vdd === SignalState.HIGH && gnd === SignalState.LOW &&
                    a !== SignalState.UNKNOWN && b !== SignalState.UNKNOWN) {
                    newOutput = (a === b) ? SignalState.HIGH : SignalState.LOW;
                }
                break;
            }
        }

        this.outputStates[0] = newOutput;
        return oldOutput !== newOutput;
    }

    /**
     * Toggle switch state
     */
    toggle() {
        if (this.type === GateType.SWITCH) {
            this.state = this.state === 1 ? 0 : 1;
        }
    }

    clone() {
        const c = new Component(this.id, this.type, this.x, this.y);
        c.name = this.name;
        c.state = this.state;
        c.storedValue = this.storedValue;
        c.inputStates = [...this.inputStates];
        c.outputStates = [...this.outputStates];
        return c;
    }

    toJSON() {
        return {
            id: this.id,
            type: this.type,
            name: this.name,
            x: this.x,
            y: this.y,
            state: this.state,
            inputStates: [...this.inputStates],
            outputStates: [...this.outputStates]
        };
    }
}

/**
 * Connection class - represents a wire connecting two components
 */
class Connection {
    constructor(fromComp, fromPort, toComp, toPort) {
        this.from = { comp: fromComp, index: fromPort };
        this.to = { comp: toComp, index: toPort };
    }

    clone() {
        return new Connection(this.from.comp, this.from.index, this.to.comp, this.to.index);
    }
}

/**
 * Circuit class - holds all components and connections
 */
class Circuit {
    constructor() {
        this.components = [];
        this.connections = [];
        this.wires = [];
        this.gates = [];  // Alias for compatibility with debugger-view
        this.cycle = 0;
        this.stable = false;
        this.error = false;
        this.errorMsg = '';
        this.metadata = {};
    }

    /**
     * Add a component to the circuit
     */
    addComponent(component) {
        this.components.push(component);
        return component;
    }

    /**
     * Add a connection between components
     */
    addConnection(connection) {
        this.connections.push(connection);
        return connection;
    }

    /**
     * Find component by ID
     */
    getComponent(id) {
        return this.components.find(c => c.id === id);
    }

    /**
     * Reset all components to initial state
     */
    reset() {
        for (const comp of this.components) {
            if (comp.type !== GateType.VDD && comp.type !== GateType.GND) {
                comp.inputStates = comp.inputStates.map(() => SignalState.UNKNOWN);
                comp.outputStates = comp.outputStates.map(() => SignalState.UNKNOWN);
            }
            if (comp.type === GateType.SWITCH) {
                comp.state = 0;
            }
        }
        for (const wire of this.wires) {
            wire.setAllBits(SignalState.UNKNOWN);
        }
        this.cycle = 0;
        this.stable = false;
        this.error = false;
        this.errorMsg = '';
    }

    /**
     * Execute one simulation step
     * Propagates signals through all connections and evaluates gates
     * @returns {boolean} True if any signal changed
     */
    step() {
        let changed = true;
        let iterations = 0;
        const maxIterations = 100;

        // Reset non-power states
        for (const comp of this.components) {
            if (comp.type !== GateType.VDD && comp.type !== GateType.GND && comp.type !== GateType.SWITCH) {
                comp.inputStates = comp.inputStates.map(() => SignalState.UNKNOWN);
                comp.outputStates = comp.outputStates.map(() => SignalState.UNKNOWN);
            }
        }

        // Propagate until stable or max iterations
        while (changed && iterations < maxIterations) {
            changed = false;
            iterations++;

            // Propagate wire values through connections
            for (const conn of this.connections) {
                const fromComp = conn.from.comp;
                const toComp = conn.to.comp;

                if (!fromComp || !toComp) continue;

                const value = fromComp.outputStates[conn.from.index];
                if (toComp.inputStates[conn.to.index] !== value) {
                    toComp.inputStates[conn.to.index] = value;
                    changed = true;
                }
            }

            // Evaluate all components
            for (const comp of this.components) {
                if (comp.evaluate()) {
                    changed = true;
                }
            }
        }

        this.cycle++;
        this.stable = !changed;

        if (iterations >= maxIterations) {
            this.error = true;
            this.errorMsg = 'Simulation did not stabilize - possible oscillation';
        }

        return changed;
    }

    /**
     * Export current state for saving/history
     */
    exportState() {
        return {
            cycle: this.cycle,
            stable: this.stable,
            wire_states: this.wires.map(w => [...w.states]),
            component_states: this.components.map(c => ({
                id: c.id,
                type: c.type,
                state: c.state,
                inputStates: [...c.inputStates],
                outputStates: [...c.outputStates],
                storedValue: c.storedValue
            })),
            dff_states: this.components
                .filter(c => c.storedValue !== undefined)
                .map(c => ({ id: c.id, stored: c.storedValue }))
        };
    }

    /**
     * Import state from saved data
     */
    importState(state) {
        if (state.cycle !== undefined) {
            this.cycle = state.cycle;
        }
        if (state.stable !== undefined) {
            this.stable = state.stable;
        }
        if (state.wire_states) {
            for (let i = 0; i < state.wire_states.length && i < this.wires.length; i++) {
                const states = state.wire_states[i];
                for (let b = 0; b < states.length; b++) {
                    this.wires[i].setState(b, states[b]);
                }
            }
        }
        if (state.component_states) {
            for (const cs of state.component_states) {
                const comp = this.getComponent(cs.id);
                if (comp) {
                    comp.state = cs.state;
                    comp.inputStates = cs.inputStates;
                    comp.outputStates = cs.outputStates;
                    if (cs.storedValue !== undefined) {
                        comp.storedValue = cs.storedValue;
                    }
                }
            }
        }
    }

    toJSON() {
        return {
            cycle: this.cycle,
            stable: this.stable,
            metadata: this.metadata,
            wires: this.wires.map(w => w.toJSON()),
            gates: this.components.map(c => c.toJSON())
        };
    }
}

/**
 * SimulationEngine - Main engine class for running circuit simulations
 *
 * Events emitted:
 * - 'loaded' - Circuit loaded successfully
 * - 'step' - After each simulation step
 * - 'stateChange' - When any signal changes
 * - 'reset' - Circuit reset to initial state
 * - 'error' - Simulation error occurred
 * - 'running' - Continuous simulation started
 * - 'paused' - Continuous simulation paused
 */
class SimulationEngine {
    constructor() {
        this.circuit = null;
        this._eventListeners = {
            loaded: [],
            step: [],
            stateChange: [],
            reset: [],
            error: [],
            running: [],
            paused: []
        };

        // Animation state
        this._running = false;
        this._animationId = null;
        this._speed = 10;  // Steps per second
        this._lastFrameTime = 0;
        this._accumulator = 0;
    }

    /**
     * Load a circuit from JSON definition
     * @param {Object} circuitJson - Circuit definition
     */
    load(circuitJson) {
        try {
            this.circuit = new Circuit();

            // Parse metadata
            if (circuitJson.metadata) {
                this.circuit.metadata = circuitJson.metadata;
            }
            if (circuitJson.cycle !== undefined) {
                this.circuit.cycle = circuitJson.cycle;
            }
            if (circuitJson.stable !== undefined) {
                this.circuit.stable = circuitJson.stable;
            }

            // Parse wires
            const jsonWires = circuitJson.wires || [];
            const wireMap = new Map();

            for (const w of jsonWires) {
                const wire = new Wire(w.id, w.name, w.width || 1);
                wire.isInput = w.is_input || false;
                wire.isOutput = w.is_output || false;
                if (w.state) {
                    for (let i = 0; i < w.state.length; i++) {
                        wire.setState(i, w.state[i]);
                    }
                }
                this.circuit.wires.push(wire);
                wireMap.set(w.id, wire);
            }

            // Parse gates and create components
            const jsonGates = circuitJson.gates || [];
            const compMap = new Map();

            // Create power sources if not present
            let hasVdd = jsonWires.some(w => w.name === 'vdd');
            let hasGnd = jsonWires.some(w => w.name === 'gnd');

            if (!hasVdd && jsonGates.length > 0) {
                const vdd = new Component(this.circuit.components.length, GateType.VDD);
                vdd.name = 'VDD';
                this.circuit.addComponent(vdd);
            }
            if (!hasGnd && jsonGates.length > 0) {
                const gnd = new Component(this.circuit.components.length, GateType.GND);
                gnd.name = 'GND';
                this.circuit.addComponent(gnd);
            }

            // Create gate components
            for (const g of jsonGates) {
                const type = g.type.toUpperCase();
                const actualType = type === 'BUF' ? GateType.BUF :
                    (type === 'XNOR' ? GateType.XNOR : type);

                if (!Object.values(GateType).includes(actualType) &&
                    !Object.values(GateType).map(t => t.toUpperCase()).includes(actualType)) {
                    console.warn(`Unknown gate type: ${type}`);
                    continue;
                }

                const comp = new Component(g.id, actualType);
                comp.name = g.name;
                this.circuit.addComponent(comp);
                compMap.set(g.id, comp);

                // Store gate input/output wire references for later
                comp._jsonInputs = g.inputs || [];
                comp._jsonOutputs = g.outputs || [];
            }

            // Alias gates array for debugger-view compatibility
            this.circuit.gates = this.circuit.components;

            this._emit('loaded', { circuit: this.circuit });
            return true;
        } catch (err) {
            this._emit('error', { message: 'Failed to load circuit: ' + err.message });
            return false;
        }
    }

    /**
     * Load circuit from visualizer format (index.html compatible)
     * @param {Object} visualizerData - Data from loadFromJSON in index.html
     */
    loadFromVisualizer(visualizerData) {
        this.circuit = new Circuit();

        const { components, wires } = visualizerData;

        // Import components
        for (const c of components) {
            const comp = new Component(c.id, c.type, c.x, c.y);
            comp.name = c.label || '';
            comp.state = c.state || 0;
            comp.inputStates = c.inputStates || [];
            comp.outputStates = c.outputStates || [];
            this.circuit.addComponent(comp);
        }

        // Import connections
        for (const w of wires) {
            const fromComp = this.circuit.getComponent(w.from.comp.id);
            const toComp = this.circuit.getComponent(w.to.comp.id);
            if (fromComp && toComp) {
                const conn = new Connection(fromComp, w.from.index, toComp, w.to.index);
                this.circuit.addConnection(conn);
            }
        }

        this.circuit.gates = this.circuit.components;
        this._emit('loaded', { circuit: this.circuit });
    }

    /**
     * Execute one simulation step
     */
    step() {
        if (!this.circuit) {
            this._emit('error', { message: 'No circuit loaded' });
            return false;
        }

        const changed = this.circuit.step();
        this._emit('step', {
            cycle: this.circuit.cycle,
            stable: this.circuit.stable,
            changed
        });

        if (changed) {
            this._emit('stateChange', this.getState());
        }

        if (this.circuit.error) {
            this._emit('error', { message: this.circuit.errorMsg });
        }

        return changed;
    }

    /**
     * Start continuous simulation
     * @param {number} speed - Steps per second (default: 10)
     */
    run(speed = null) {
        if (!this.circuit) {
            this._emit('error', { message: 'No circuit loaded' });
            return;
        }

        if (speed !== null) {
            this._speed = Math.max(1, Math.min(1000, speed));
        }

        if (this._running) return;

        this._running = true;
        this._lastFrameTime = performance.now();
        this._accumulator = 0;
        this._runLoop();
        this._emit('running', { speed: this._speed });
    }

    /**
     * Internal run loop
     */
    _runLoop() {
        if (!this._running) return;

        const now = performance.now();
        const deltaTime = now - this._lastFrameTime;
        this._lastFrameTime = now;

        const stepTime = 1000 / this._speed;
        this._accumulator += deltaTime;

        let stepsThisFrame = 0;
        const maxStepsPerFrame = Math.max(1, this._speed / 30);

        while (this._accumulator >= stepTime && stepsThisFrame < maxStepsPerFrame) {
            if (this.circuit.error) {
                this.pause();
                return;
            }

            this.step();
            this._accumulator -= stepTime;
            stepsThisFrame++;
        }

        // Cap accumulator
        if (this._accumulator > stepTime * 10) {
            this._accumulator = stepTime * 10;
        }

        this._animationId = requestAnimationFrame(() => this._runLoop());
    }

    /**
     * Pause continuous simulation
     */
    pause() {
        if (!this._running) return;

        this._running = false;
        if (this._animationId) {
            cancelAnimationFrame(this._animationId);
            this._animationId = null;
        }
        this._emit('paused', { cycle: this.circuit?.cycle });
    }

    /**
     * Reset circuit to initial state
     */
    reset() {
        this.pause();

        if (this.circuit) {
            this.circuit.reset();
            this._emit('reset', {});
            this._emit('stateChange', this.getState());
        }
    }

    /**
     * Get current state of all wires and gates
     * @returns {Object} Current state
     */
    getState() {
        if (!this.circuit) {
            return {
                cycle: 0,
                stable: false,
                components: [],
                wires: []
            };
        }

        return {
            cycle: this.circuit.cycle,
            stable: this.circuit.stable,
            components: this.circuit.components.map(c => ({
                id: c.id,
                type: c.type,
                name: c.name,
                state: c.state,
                inputStates: [...c.inputStates],
                outputStates: [...c.outputStates]
            })),
            wires: this.circuit.wires.map(w => ({
                id: w.id,
                name: w.name,
                states: [...w.states]
            }))
        };
    }

    /**
     * Export state for saving/history
     * @returns {Object} Exportable state
     */
    exportState() {
        if (!this.circuit) {
            return { cycle: 0, stable: false };
        }
        return this.circuit.exportState();
    }

    /**
     * Import state from saved data
     * @param {Object} state - Previously exported state
     */
    importState(state) {
        if (this.circuit) {
            this.circuit.importState(state);
            this._emit('stateChange', this.getState());
        }
    }

    /**
     * Get/set simulation speed
     */
    get speed() {
        return this._speed;
    }

    set speed(value) {
        this._speed = Math.max(1, Math.min(1000, value));
    }

    /**
     * Check if simulation is running
     */
    get isRunning() {
        return this._running;
    }

    /**
     * Toggle a switch component
     * @param {number} componentId - Component ID to toggle
     */
    toggleSwitch(componentId) {
        if (!this.circuit) return;

        const comp = this.circuit.getComponent(componentId);
        if (comp && comp.type === GateType.SWITCH) {
            comp.toggle();
            this.step();  // Propagate the change
        }
    }

    /**
     * Set switch state
     * @param {number} componentId - Component ID
     * @param {boolean} on - True for ON, false for OFF
     */
    setSwitch(componentId, on) {
        if (!this.circuit) return;

        const comp = this.circuit.getComponent(componentId);
        if (comp && comp.type === GateType.SWITCH) {
            comp.state = on ? 1 : 0;
            this.step();
        }
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Event handler
     * @returns {SimulationEngine} this for chaining
     */
    on(event, callback) {
        if (this._eventListeners[event]) {
            this._eventListeners[event].push(callback);
        }
        return this;
    }

    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} callback - Event handler to remove
     * @returns {SimulationEngine} this for chaining
     */
    off(event, callback) {
        if (this._eventListeners[event]) {
            const idx = this._eventListeners[event].indexOf(callback);
            if (idx >= 0) {
                this._eventListeners[event].splice(idx, 1);
            }
        }
        return this;
    }

    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {Object} data - Event data
     */
    _emit(event, data) {
        if (this._eventListeners[event]) {
            for (const callback of this._eventListeners[event]) {
                try {
                    callback(data);
                } catch (err) {
                    console.error(`Error in ${event} handler:`, err);
                }
            }
        }
    }

    /**
     * Dispose of the engine
     */
    dispose() {
        this.pause();
        this.circuit = null;
        this._eventListeners = {
            loaded: [],
            step: [],
            stateChange: [],
            reset: [],
            error: [],
            running: [],
            paused: []
        };
    }
}

// Export for ES6 modules
export {
    SimulationEngine,
    Circuit,
    Component,
    Connection,
    Wire,
    SignalState,
    GateType
};

// Also export for CommonJS and browser global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SimulationEngine,
        Circuit,
        Component,
        Connection,
        Wire,
        SignalState,
        GateType
    };
} else if (typeof window !== 'undefined') {
    window.SimEngine = window.SimEngine || {};
    window.SimEngine.SimulationEngine = SimulationEngine;
    window.SimEngine.Circuit = Circuit;
    window.SimEngine.Component = Component;
    window.SimEngine.Connection = Connection;
    window.SimEngine.Wire = Wire;
    window.SimEngine.SignalState = SignalState;
    window.SimEngine.GateType = GateType;
}
