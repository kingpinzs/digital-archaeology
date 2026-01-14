/**
 * Core Simulation Engine - Animation Module
 *
 * Provides animated visualization of gate-level signal propagation.
 * Includes step-through propagation, timing control, and event tracking.
 */

(function(exports) {
    'use strict';

    // Get dependencies
    const { WireState, GateType, WireStateStr } = exports.SimEngine || exports;
    const { Circuit } = exports.SimEngine || exports;

    /**
     * Animation states for the state machine.
     */
    const AnimationState = Object.freeze({
        IDLE: 'idle',
        RUNNING: 'running',
        PAUSED: 'paused',
        STEPPING: 'stepping'
    });

    /**
     * Event types for propagation tracking.
     */
    const PropagationEventType = Object.freeze({
        ITERATION_START: 'iteration_start',
        GATE_EVALUATE: 'gate_evaluate',
        WIRE_CHANGE: 'wire_change',
        ITERATION_END: 'iteration_end',
        PROPAGATION_COMPLETE: 'propagation_complete',
        PROPAGATION_TIMEOUT: 'propagation_timeout'
    });

    /**
     * Represents a single propagation event.
     */
    class PropagationEvent {
        /**
         * Create a propagation event.
         * @param {string} type - Event type from PropagationEventType
         * @param {Object} data - Event-specific data
         */
        constructor(type, data = {}) {
            this.type = type;
            this.data = data;
            this.timestamp = Date.now();
        }

        /**
         * Create an iteration start event.
         * @param {number} iteration - Iteration number (0-indexed)
         */
        static iterationStart(iteration) {
            return new PropagationEvent(PropagationEventType.ITERATION_START, {
                iteration
            });
        }

        /**
         * Create a gate evaluation event.
         * @param {number} gateIndex - Index of gate in circuit
         * @param {string} gateName - Gate instance name
         * @param {string} gateType - Gate type (AND, OR, etc.)
         * @param {number[]} inputStates - Input wire states
         * @param {number} outputState - Computed output state
         */
        static gateEvaluate(gateIndex, gateName, gateType, inputStates, outputState) {
            return new PropagationEvent(PropagationEventType.GATE_EVALUATE, {
                gateIndex,
                gateName,
                gateType,
                inputStates,
                outputState
            });
        }

        /**
         * Create a wire change event.
         * @param {number} wireIndex - Index of wire in circuit
         * @param {string} wireName - Wire name
         * @param {number} bit - Bit that changed
         * @param {number} oldState - Previous state
         * @param {number} newState - New state
         */
        static wireChange(wireIndex, wireName, bit, oldState, newState) {
            return new PropagationEvent(PropagationEventType.WIRE_CHANGE, {
                wireIndex,
                wireName,
                bit,
                oldState,
                newState
            });
        }

        /**
         * Create an iteration end event.
         * @param {number} iteration - Iteration number
         * @param {boolean} stable - Whether circuit is stable
         */
        static iterationEnd(iteration, stable) {
            return new PropagationEvent(PropagationEventType.ITERATION_END, {
                iteration,
                stable
            });
        }

        /**
         * Create a propagation complete event.
         * @param {number} totalIterations - Total iterations taken
         */
        static propagationComplete(totalIterations) {
            return new PropagationEvent(PropagationEventType.PROPAGATION_COMPLETE, {
                totalIterations
            });
        }

        /**
         * Create a propagation timeout event.
         * @param {number} iteration - Iteration where timeout occurred
         */
        static propagationTimeout(iteration) {
            return new PropagationEvent(PropagationEventType.PROPAGATION_TIMEOUT, {
                iteration
            });
        }
    }

    /**
     * CircuitAnimator provides step-by-step propagation with event tracking.
     */
    class CircuitAnimator {
        /**
         * Create an animator for a circuit.
         * @param {Circuit} circuit - Circuit to animate
         */
        constructor(circuit) {
            if (!circuit) {
                throw new Error('Circuit is required');
            }
            this.circuit = circuit;
            this.currentIteration = 0;
            this.events = [];
            this.maxIterations = 100;
        }

        /**
         * Reset animation state.
         */
        reset() {
            this.currentIteration = 0;
            this.events = [];
        }

        /**
         * Perform a single propagation step (one iteration).
         * @returns {PropagationEvent[]} Events from this iteration
         */
        step() {
            const events = [];
            const iteration = this.currentIteration;

            // Check for timeout
            if (iteration >= this.maxIterations) {
                const timeoutEvent = PropagationEvent.propagationTimeout(iteration);
                events.push(timeoutEvent);
                this.events.push(timeoutEvent);
                return events;
            }

            // Iteration start
            events.push(PropagationEvent.iterationStart(iteration));

            let stable = true;

            // Evaluate all gates
            for (let i = 0; i < this.circuit.gates.length; i++) {
                const gate = this.circuit.gates[i];

                // Get input states
                const inputStates = gate.inputs.map((conn) => {
                    return this.circuit.wires[conn.wireIndex].getState(conn.bit);
                });

                // Evaluate gate
                const result = gate.evaluate((inputIndex) => {
                    const conn = gate.inputs[inputIndex];
                    if (!conn) return WireState.UNKNOWN;
                    return this.circuit.wires[conn.wireIndex].getState(conn.bit);
                });

                // Record gate evaluation event
                events.push(PropagationEvent.gateEvaluate(
                    i,
                    gate.name,
                    gate.type,
                    inputStates,
                    result
                ));

                // Set output wire next state and track changes
                if (gate.outputs.length >= 1) {
                    const outConn = gate.outputs[0];
                    const wire = this.circuit.wires[outConn.wireIndex];
                    const oldState = wire.getState(outConn.bit);
                    const changed = wire.setNextState(outConn.bit, result);

                    if (changed) {
                        stable = false;
                        events.push(PropagationEvent.wireChange(
                            outConn.wireIndex,
                            wire.name,
                            outConn.bit,
                            oldState,
                            result
                        ));
                    }
                }
            }

            // Apply next states to current states
            for (const wire of this.circuit.wires) {
                if (wire.applyNextState()) {
                    stable = false;
                }
            }

            // Iteration end
            events.push(PropagationEvent.iterationEnd(iteration, stable));

            // Check if propagation is complete
            if (stable) {
                events.push(PropagationEvent.propagationComplete(iteration + 1));
            }

            // Store events and advance iteration
            this.events.push(...events);
            this.currentIteration++;
            this.circuit.stable = stable;

            return events;
        }

        /**
         * Check if propagation is complete.
         * @returns {boolean} True if stable or timed out
         */
        isComplete() {
            return this.circuit.stable || this.currentIteration >= this.maxIterations;
        }

        /**
         * Get all events from the animation.
         * @returns {PropagationEvent[]} All recorded events
         */
        getAllEvents() {
            return this.events.slice();
        }

        /**
         * Run full propagation and collect all events.
         * @returns {PropagationEvent[]} All events from propagation
         */
        runToCompletion() {
            this.reset();
            while (!this.isComplete()) {
                this.step();
            }
            return this.getAllEvents();
        }
    }

    /**
     * AnimationController manages playback state and timing.
     */
    class AnimationController {
        /**
         * Create an animation controller.
         * @param {CircuitAnimator} animator - Animator to control
         */
        constructor(animator) {
            this.animator = animator;
            this.state = AnimationState.IDLE;
            this.speed = 1.0;  // 1.0 = normal speed
            this.frameDelay = 500;  // ms between frames at speed 1.0
            this.animationFrame = null;
            this.lastFrameTime = 0;

            // Callbacks
            this.onStateChange = null;
            this.onFrame = null;
            this.onComplete = null;
        }

        /**
         * Get current animation state.
         * @returns {string} Current state
         */
        getState() {
            return this.state;
        }

        /**
         * Set animation speed.
         * @param {number} speed - Speed multiplier (0.1 to 10.0)
         */
        setSpeed(speed) {
            this.speed = Math.max(0.1, Math.min(10.0, speed));
        }

        /**
         * Get current speed.
         * @returns {number} Speed multiplier
         */
        getSpeed() {
            return this.speed;
        }

        /**
         * Calculate delay between frames based on speed.
         * @returns {number} Delay in milliseconds
         */
        getFrameDelay() {
            return this.frameDelay / this.speed;
        }

        /**
         * Start or resume animation playback.
         */
        play() {
            if (this.state === AnimationState.RUNNING) {
                return; // Already running
            }

            const previousState = this.state;
            this.state = AnimationState.RUNNING;
            this._notifyStateChange(previousState, this.state);

            this._scheduleNextFrame();
        }

        /**
         * Pause animation playback.
         */
        pause() {
            if (this.state !== AnimationState.RUNNING) {
                return; // Not running
            }

            const previousState = this.state;
            this.state = AnimationState.PAUSED;
            this._notifyStateChange(previousState, this.state);

            if (this.animationFrame) {
                cancelAnimationFrame(this.animationFrame);
                this.animationFrame = null;
            }
        }

        /**
         * Perform a single step (one propagation iteration).
         */
        step() {
            if (this.animator.isComplete()) {
                return; // Already complete
            }

            const previousState = this.state;
            this.state = AnimationState.STEPPING;
            this._notifyStateChange(previousState, this.state);

            const events = this.animator.step();
            this._notifyFrame(events);

            if (this.animator.isComplete()) {
                this.state = AnimationState.IDLE;
                this._notifyStateChange(AnimationState.STEPPING, AnimationState.IDLE);
                this._notifyComplete();
            } else {
                this.state = AnimationState.PAUSED;
                this._notifyStateChange(AnimationState.STEPPING, AnimationState.PAUSED);
            }
        }

        /**
         * Reset animation to beginning.
         */
        reset() {
            const previousState = this.state;

            if (this.animationFrame) {
                cancelAnimationFrame(this.animationFrame);
                this.animationFrame = null;
            }

            this.animator.reset();
            this.animator.circuit.reset();
            this.state = AnimationState.IDLE;

            if (previousState !== AnimationState.IDLE) {
                this._notifyStateChange(previousState, this.state);
            }
        }

        /**
         * Stop animation and return to idle.
         */
        stop() {
            const previousState = this.state;

            if (this.animationFrame) {
                cancelAnimationFrame(this.animationFrame);
                this.animationFrame = null;
            }

            this.state = AnimationState.IDLE;
            if (previousState !== AnimationState.IDLE) {
                this._notifyStateChange(previousState, this.state);
            }
        }

        /**
         * Schedule the next animation frame.
         * @private
         */
        _scheduleNextFrame() {
            if (this.state !== AnimationState.RUNNING) {
                return;
            }

            const delay = this.getFrameDelay();

            const tick = (timestamp) => {
                if (this.state !== AnimationState.RUNNING) {
                    return;
                }

                if (timestamp - this.lastFrameTime >= delay) {
                    this.lastFrameTime = timestamp;

                    if (!this.animator.isComplete()) {
                        const events = this.animator.step();
                        this._notifyFrame(events);
                    }

                    if (this.animator.isComplete()) {
                        this.state = AnimationState.IDLE;
                        this._notifyStateChange(AnimationState.RUNNING, AnimationState.IDLE);
                        this._notifyComplete();
                        return;
                    }
                }

                this.animationFrame = requestAnimationFrame(tick);
            };

            this.animationFrame = requestAnimationFrame(tick);
        }

        /**
         * Notify state change callback.
         * @private
         */
        _notifyStateChange(from, to) {
            if (this.onStateChange) {
                this.onStateChange(from, to);
            }
        }

        /**
         * Notify frame callback.
         * @private
         */
        _notifyFrame(events) {
            if (this.onFrame) {
                this.onFrame(events);
            }
        }

        /**
         * Notify completion callback.
         * @private
         */
        _notifyComplete() {
            if (this.onComplete) {
                this.onComplete(this.animator.getAllEvents());
            }
        }
    }

    /**
     * GateRenderer provides canvas rendering for animated circuits.
     */
    class GateRenderer {
        /**
         * Create a gate renderer.
         * @param {CanvasRenderingContext2D} ctx - Canvas context
         * @param {Object} options - Rendering options
         */
        constructor(ctx, options = {}) {
            this.ctx = ctx;
            this.options = Object.assign({
                gateWidth: 80,
                gateHeight: 50,
                wireThickness: 3,
                portRadius: 5,
                margin: 20,
                fontSize: 11,
                colors: {
                    background: '#0d0d1a',
                    gateBody: '#16213e',
                    gateBorder: '#0f3460',
                    gateActive: '#e94560',
                    wire0: '#0077b6',
                    wire1: '#00cc00',
                    wireX: '#888',
                    wireZ: '#4a4a8a',
                    text: '#eee',
                    textDim: '#888'
                }
            }, options);

            // Layout state
            this.gatePositions = new Map();  // gateIndex -> {x, y}
            this.wirePositions = new Map();  // wireIndex -> {x, y}
        }

        /**
         * Clear the canvas.
         */
        clear() {
            this.ctx.fillStyle = this.options.colors.background;
            this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        }

        /**
         * Layout gates in a grid pattern.
         * @param {Circuit} circuit - Circuit to layout
         */
        layoutCircuit(circuit) {
            const { gateWidth, gateHeight, margin } = this.options;
            const canvasWidth = this.ctx.canvas.width;

            // Calculate grid layout
            const gatesPerRow = Math.floor((canvasWidth - 2 * margin) / (gateWidth + margin));
            const spacingX = gateWidth + margin;
            const spacingY = gateHeight + margin * 2;

            this.gatePositions.clear();
            this.wirePositions.clear();

            // Position gates
            for (let i = 0; i < circuit.gates.length; i++) {
                const col = i % gatesPerRow;
                const row = Math.floor(i / gatesPerRow);
                const x = margin + col * spacingX;
                const y = margin + 50 + row * spacingY; // 50px for input wires

                this.gatePositions.set(i, { x, y });
            }

            // Position input wires at top
            let inputX = margin;
            for (let i = 0; i < circuit.wires.length; i++) {
                const wire = circuit.wires[i];
                if (wire.isInput) {
                    this.wirePositions.set(i, { x: inputX, y: margin });
                    inputX += 60;
                }
            }

            // Position output wires at bottom
            let outputX = margin;
            const outputY = this.ctx.canvas.height - margin - 30;
            for (let i = 0; i < circuit.wires.length; i++) {
                const wire = circuit.wires[i];
                if (wire.isOutput) {
                    this.wirePositions.set(i, { x: outputX, y: outputY });
                    outputX += 60;
                }
            }
        }

        /**
         * Get color for wire state.
         * @param {number} state - WireState value
         * @returns {string} Color string
         */
        getWireColor(state) {
            switch (state) {
                case WireState.LOW: return this.options.colors.wire0;
                case WireState.HIGH: return this.options.colors.wire1;
                case WireState.HIGHZ: return this.options.colors.wireZ;
                default: return this.options.colors.wireX;
            }
        }

        /**
         * Draw a gate.
         * @param {Gate} gate - Gate to draw
         * @param {number} index - Gate index
         * @param {boolean} active - Whether gate is currently being evaluated
         */
        drawGate(gate, index, active = false) {
            const pos = this.gatePositions.get(index);
            if (!pos) return;

            const { gateWidth, gateHeight, portRadius, fontSize, colors } = this.options;
            const { x, y } = pos;

            // Gate body
            this.ctx.fillStyle = colors.gateBody;
            this.ctx.strokeStyle = active ? colors.gateActive : colors.gateBorder;
            this.ctx.lineWidth = active ? 3 : 2;

            this.ctx.beginPath();
            this.ctx.roundRect(x, y, gateWidth, gateHeight, 5);
            this.ctx.fill();
            this.ctx.stroke();

            // Glow effect when active
            if (active) {
                this.ctx.shadowColor = colors.gateActive;
                this.ctx.shadowBlur = 10;
                this.ctx.stroke();
                this.ctx.shadowBlur = 0;
            }

            // Gate type label
            this.ctx.fillStyle = colors.text;
            this.ctx.font = `bold ${fontSize}px monospace`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(gate.type, x + gateWidth / 2, y + gateHeight / 2 - 8);

            // Gate name
            this.ctx.fillStyle = colors.textDim;
            this.ctx.font = `${fontSize - 2}px monospace`;
            this.ctx.fillText(gate.name, x + gateWidth / 2, y + gateHeight / 2 + 8);

            // Input ports (left side)
            const inputCount = gate.inputs.length;
            for (let i = 0; i < inputCount; i++) {
                const portY = y + (gateHeight / (inputCount + 1)) * (i + 1);
                this.ctx.beginPath();
                this.ctx.arc(x, portY, portRadius, 0, Math.PI * 2);
                this.ctx.fillStyle = colors.gateBorder;
                this.ctx.fill();
            }

            // Output port (right side)
            this.ctx.beginPath();
            this.ctx.arc(x + gateWidth, y + gateHeight / 2, portRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = colors.gateBorder;
            this.ctx.fill();
        }

        /**
         * Draw a wire connection between gates.
         * @param {Circuit} circuit - Circuit containing the wire
         * @param {number} fromGateIndex - Source gate index
         * @param {number} toGateIndex - Destination gate index
         * @param {number} toInputIndex - Input port index on destination
         * @param {number} state - Wire state
         */
        drawConnection(circuit, fromGateIndex, toGateIndex, toInputIndex, state) {
            const fromPos = this.gatePositions.get(fromGateIndex);
            const toPos = this.gatePositions.get(toGateIndex);
            if (!fromPos || !toPos) return;

            const { gateWidth, gateHeight, wireThickness } = this.options;
            const toGate = circuit.gates[toGateIndex];
            const inputCount = toGate.inputs.length;

            // Source point (right side of from gate)
            const fromX = fromPos.x + gateWidth;
            const fromY = fromPos.y + gateHeight / 2;

            // Destination point (left side of to gate)
            const toX = toPos.x;
            const toY = toPos.y + (gateHeight / (inputCount + 1)) * (toInputIndex + 1);

            // Draw wire
            this.ctx.strokeStyle = this.getWireColor(state);
            this.ctx.lineWidth = wireThickness;
            this.ctx.beginPath();
            this.ctx.moveTo(fromX, fromY);

            // Bezier curve for smooth connection
            const midX = (fromX + toX) / 2;
            this.ctx.bezierCurveTo(midX, fromY, midX, toY, toX, toY);
            this.ctx.stroke();
        }

        /**
         * Draw input/output wire indicator.
         * @param {Wire} wire - Wire to draw
         * @param {number} index - Wire index
         * @param {boolean} isInput - True for input, false for output
         */
        drawIOWire(wire, index, isInput) {
            const pos = this.wirePositions.get(index);
            if (!pos) return;

            const { portRadius, fontSize, colors } = this.options;
            const { x, y } = pos;
            const state = wire.getState(0);

            // Circle indicator
            this.ctx.beginPath();
            this.ctx.arc(x, y, portRadius + 3, 0, Math.PI * 2);
            this.ctx.fillStyle = this.getWireColor(state);
            this.ctx.fill();

            // Label
            this.ctx.fillStyle = colors.text;
            this.ctx.font = `${fontSize}px monospace`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(wire.name, x, isInput ? y - 15 : y + 20);

            // State value
            this.ctx.fillStyle = this.getWireColor(state);
            this.ctx.fillText(WireStateStr[state] || '?', x, isInput ? y - 30 : y + 35);
        }

        /**
         * Draw signal flow particle animation.
         * @param {number} fromX - Start X
         * @param {number} fromY - Start Y
         * @param {number} toX - End X
         * @param {number} toY - End Y
         * @param {number} progress - Animation progress (0-1)
         * @param {number} state - Wire state (for color)
         */
        drawSignalParticle(fromX, fromY, toX, toY, progress, state) {
            const x = fromX + (toX - fromX) * progress;
            const y = fromY + (toY - fromY) * progress;

            this.ctx.beginPath();
            this.ctx.arc(x, y, 6, 0, Math.PI * 2);
            this.ctx.fillStyle = this.getWireColor(state);
            this.ctx.shadowColor = this.getWireColor(state);
            this.ctx.shadowBlur = 10;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }

        /**
         * Render the entire circuit.
         * @param {Circuit} circuit - Circuit to render
         * @param {Set<number>} activeGates - Set of currently active gate indices
         */
        render(circuit, activeGates = new Set()) {
            this.clear();

            // Layout if needed
            if (this.gatePositions.size === 0) {
                this.layoutCircuit(circuit);
            }

            // Draw I/O wires
            for (let i = 0; i < circuit.wires.length; i++) {
                const wire = circuit.wires[i];
                if (wire.isInput) {
                    this.drawIOWire(wire, i, true);
                } else if (wire.isOutput) {
                    this.drawIOWire(wire, i, false);
                }
            }

            // Draw connections first (under gates)
            for (let toIdx = 0; toIdx < circuit.gates.length; toIdx++) {
                const toGate = circuit.gates[toIdx];
                for (let inpIdx = 0; inpIdx < toGate.inputs.length; inpIdx++) {
                    const conn = toGate.inputs[inpIdx];
                    const wire = circuit.wires[conn.wireIndex];

                    // Find source gate
                    for (let fromIdx = 0; fromIdx < circuit.gates.length; fromIdx++) {
                        const fromGate = circuit.gates[fromIdx];
                        for (const outConn of fromGate.outputs) {
                            if (outConn.wireIndex === conn.wireIndex) {
                                this.drawConnection(circuit, fromIdx, toIdx, inpIdx, wire.getState(conn.bit));
                            }
                        }
                    }
                }
            }

            // Draw gates
            for (let i = 0; i < circuit.gates.length; i++) {
                this.drawGate(circuit.gates[i], i, activeGates.has(i));
            }
        }
    }

    // Export
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            AnimationState,
            PropagationEventType,
            PropagationEvent,
            CircuitAnimator,
            AnimationController,
            GateRenderer
        };
    } else {
        exports.SimEngine = exports.SimEngine || {};
        exports.SimEngine.AnimationState = AnimationState;
        exports.SimEngine.PropagationEventType = PropagationEventType;
        exports.SimEngine.PropagationEvent = PropagationEvent;
        exports.SimEngine.CircuitAnimator = CircuitAnimator;
        exports.SimEngine.AnimationController = AnimationController;
        exports.SimEngine.GateRenderer = GateRenderer;
    }

})(typeof window !== 'undefined' ? window : global);
