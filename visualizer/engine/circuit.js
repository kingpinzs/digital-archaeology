/**
 * Core Simulation Engine - Circuit Class
 *
 * The main simulation container that holds wires, gates, and modules.
 * Provides signal propagation, clock handling, and state management.
 */

(function(exports) {
    'use strict';

    // Get dependencies
    const { WireState, GateType, Limits } = exports.SimEngine || exports;
    const { Wire } = exports.SimEngine || exports;
    const { Gate } = exports.SimEngine || exports;

    /**
     * Module definition for hierarchical circuits.
     */
    class Module {
        constructor(name) {
            this.name = name;
            this.inputs = [];    // Array of { name, width }
            this.outputs = [];   // Array of { name, width }
            this.wireStart = 0;
            this.wireCount = 0;
            this.gateStart = 0;
            this.gateCount = 0;
        }
    }

    /**
     * Circuit is the main container for digital circuit simulation.
     */
    class Circuit {
        constructor() {
            this.wires = [];
            this.gates = [];
            this.modules = [];

            // Current module being built (-1 for top level)
            this.currentModule = -1;

            // Simulation state
            this.cycleCount = 0;
            this.stable = false;

            // Error handling
            this.error = false;
            this.errorMsg = '';

            // Initialize with GND and VDD wires
            this._initPowerRails();
        }

        /**
         * Initialize GND and VDD constant wires.
         */
        _initPowerRails() {
            const gnd = this.addWire('gnd', 1);
            const vdd = this.addWire('vdd', 1);
            this.setWire(gnd, 0, WireState.LOW);
            this.setWire(vdd, 0, WireState.HIGH);
        }

        /**
         * Reset circuit to initial state.
         */
        reset() {
            // Reset all wires to unknown (except GND/VDD)
            for (let i = 2; i < this.wires.length; i++) {
                this.wires[i].reset();
            }
            // Reset all gates
            for (const gate of this.gates) {
                gate.reset();
            }
            this.cycleCount = 0;
            this.stable = false;
            this.error = false;
            this.errorMsg = '';
        }

        /**
         * Add a wire to the circuit.
         * @param {string} name - Wire name
         * @param {number} width - Bit width (default 1)
         * @returns {number} Wire index, or existing wire index if name exists
         */
        addWire(name, width = 1) {
            // Check for existing wire
            const existing = this.findWire(name);
            if (existing >= 0) {
                return existing;
            }

            if (this.wires.length >= Limits.MAX_WIRES) {
                this._setError(`Too many wires (max ${Limits.MAX_WIRES})`);
                return -1;
            }

            const wire = new Wire(name, width);
            const idx = this.wires.length;
            this.wires.push(wire);
            return idx;
        }

        /**
         * Find a wire by name.
         * @param {string} name - Wire name
         * @returns {number} Wire index or -1 if not found
         */
        findWire(name) {
            for (let i = 0; i < this.wires.length; i++) {
                if (this.wires[i].name === name) {
                    return i;
                }
            }
            return -1;
        }

        /**
         * Get wire state.
         * @param {number} wireIndex - Wire index
         * @param {number} bit - Bit index
         * @returns {number} WireState value
         */
        getWire(wireIndex, bit = 0) {
            if (wireIndex < 0 || wireIndex >= this.wires.length) {
                return WireState.UNKNOWN;
            }
            return this.wires[wireIndex].getState(bit);
        }

        /**
         * Set wire state.
         * @param {number} wireIndex - Wire index
         * @param {number} bit - Bit index
         * @param {number} state - WireState value
         */
        setWire(wireIndex, bit, state) {
            if (wireIndex < 0 || wireIndex >= this.wires.length) {
                return;
            }
            this.wires[wireIndex].setState(bit, state);
        }

        /**
         * Add a gate to the circuit.
         * @param {string} type - Gate type (from GateType)
         * @param {string} name - Instance name
         * @returns {number} Gate index
         */
        addGate(type, name) {
            if (this.gates.length >= Limits.MAX_GATES) {
                this._setError(`Too many gates (max ${Limits.MAX_GATES})`);
                return -1;
            }

            const gate = new Gate(name, type);
            const idx = this.gates.length;
            this.gates.push(gate);
            return idx;
        }

        /**
         * Add input to a gate.
         * @param {number} gateIndex - Gate index
         * @param {number} wireIndex - Wire index
         * @param {number} bit - Bit of wire
         */
        addGateInput(gateIndex, wireIndex, bit = 0) {
            if (gateIndex < 0 || gateIndex >= this.gates.length) return;
            this.gates[gateIndex].addInput(wireIndex, bit);
        }

        /**
         * Add output to a gate.
         * @param {number} gateIndex - Gate index
         * @param {number} wireIndex - Wire index
         * @param {number} bit - Bit of wire
         */
        addGateOutput(gateIndex, wireIndex, bit = 0) {
            if (gateIndex < 0 || gateIndex >= this.gates.length) return;
            this.gates[gateIndex].addOutput(wireIndex, bit);
        }

        // === High-level gate creation helpers ===

        addNot(name, inWire, outWire) {
            const g = this.addGate(GateType.NOT, name);
            this.addGateInput(g, inWire, 0);
            this.addGateOutput(g, outWire, 0);
            return g;
        }

        addAnd(name, in1, in2, out) {
            const g = this.addGate(GateType.AND, name);
            this.addGateInput(g, in1, 0);
            this.addGateInput(g, in2, 0);
            this.addGateOutput(g, out, 0);
            return g;
        }

        addOr(name, in1, in2, out) {
            const g = this.addGate(GateType.OR, name);
            this.addGateInput(g, in1, 0);
            this.addGateInput(g, in2, 0);
            this.addGateOutput(g, out, 0);
            return g;
        }

        addNand(name, in1, in2, out) {
            const g = this.addGate(GateType.NAND, name);
            this.addGateInput(g, in1, 0);
            this.addGateInput(g, in2, 0);
            this.addGateOutput(g, out, 0);
            return g;
        }

        addNor(name, in1, in2, out) {
            const g = this.addGate(GateType.NOR, name);
            this.addGateInput(g, in1, 0);
            this.addGateInput(g, in2, 0);
            this.addGateOutput(g, out, 0);
            return g;
        }

        addXor(name, in1, in2, out) {
            const g = this.addGate(GateType.XOR, name);
            this.addGateInput(g, in1, 0);
            this.addGateInput(g, in2, 0);
            this.addGateOutput(g, out, 0);
            return g;
        }

        addDff(name, d, clk, q) {
            const g = this.addGate(GateType.DFF, name);
            this.addGateInput(g, d, 0);    // D input
            this.addGateInput(g, clk, 0);  // Clock (for reference)
            this.addGateOutput(g, q, 0);   // Q output
            return g;
        }

        // === Simulation ===

        /**
         * Propagate combinational logic until stable.
         * Uses iterative evaluation with convergence detection.
         */
        propagate() {
            let iteration = 0;

            do {
                this.stable = true;

                // Evaluate all gates
                for (const gate of this.gates) {
                    const result = gate.evaluate((inputIndex) => {
                        const conn = gate.inputs[inputIndex];
                        if (!conn) return WireState.UNKNOWN;
                        return this.wires[conn.wireIndex].getState(conn.bit);
                    });

                    // Set output wire next state
                    if (gate.outputs.length >= 1) {
                        const outConn = gate.outputs[0];
                        const changed = this.wires[outConn.wireIndex].setNextState(outConn.bit, result);
                        if (changed) {
                            this.stable = false;
                        }
                    }
                }

                // Apply next states to current states
                for (const wire of this.wires) {
                    if (wire.applyNextState()) {
                        this.stable = false;
                    }
                }

                iteration++;
            } while (!this.stable && iteration < Limits.MAX_PROPAGATION_ITERATIONS);

            if (iteration >= Limits.MAX_PROPAGATION_ITERATIONS) {
                this._setError(`Circuit did not stabilize after ${Limits.MAX_PROPAGATION_ITERATIONS} iterations`);
            }
        }

        /**
         * Clock all flip-flops (capture inputs on rising edge).
         */
        clock() {
            for (const gate of this.gates) {
                if (gate.type === GateType.DFF) {
                    gate.clock((inputIndex) => {
                        const conn = gate.inputs[inputIndex];
                        if (!conn) return WireState.UNKNOWN;
                        return this.wires[conn.wireIndex].getState(conn.bit);
                    });
                }
            }
            this.cycleCount++;
        }

        /**
         * One full simulation step (propagate + clock + propagate).
         */
        step() {
            this.propagate();
            this.clock();
            this.propagate();
        }

        /**
         * Run for multiple cycles.
         * @param {number} cycles - Number of cycles to run
         */
        run(cycles) {
            for (let i = 0; i < cycles && !this.error; i++) {
                this.step();
            }
        }

        // === Error handling ===

        _setError(msg) {
            this.error = true;
            this.errorMsg = msg;
        }

        // === Debugging ===

        /**
         * Dump all wire states to console.
         */
        dumpWires() {
            console.log(`=== Wires (${this.wires.length}) ===`);
            for (let i = 0; i < this.wires.length; i++) {
                const w = this.wires[i];
                console.log(`  [${i}] ${w.toString()}${w.isInput ? ' (input)' : ''}${w.isOutput ? ' (output)' : ''}`);
            }
        }

        /**
         * Dump all gates to console.
         */
        dumpGates() {
            console.log(`=== Gates (${this.gates.length}) ===`);
            for (let i = 0; i < this.gates.length; i++) {
                const g = this.gates[i];
                const ins = g.inputs.map(p => `${this.wires[p.wireIndex]?.name || '?'}[${p.bit}]`).join(', ');
                const outs = g.outputs.map(p => `${this.wires[p.wireIndex]?.name || '?'}[${p.bit}]`).join(', ');
                console.log(`  [${i}] ${g.name} (${g.type}) in:[${ins}] out:[${outs}]`);
            }
        }

        /**
         * Dump circuit state.
         */
        dumpState() {
            console.log('=== Circuit State ===');
            console.log(`Cycle: ${this.cycleCount}`);
            console.log(`Stable: ${this.stable ? 'YES' : 'NO'}`);
            if (this.error) {
                console.log(`Error: ${this.errorMsg}`);
            }
            this.dumpWires();
        }

        // === JSON Export/Import ===

        /**
         * Export circuit to JSON object (compatible with C simulator).
         * @returns {Object} JSON-serializable object
         */
        toJSON() {
            return {
                cycle: this.cycleCount,
                stable: this.stable,
                wires: this.wires.map((w, i) => ({
                    id: i,
                    ...w.toJSON()
                })),
                gates: this.gates.map((g, i) => ({
                    id: i,
                    ...g.toJSON()
                }))
            };
        }

        /**
         * Import circuit from JSON object.
         * @param {Object} json - JSON object from toJSON or C simulator
         * @returns {Circuit} New circuit instance
         */
        static fromJSON(json) {
            const circuit = new Circuit();

            // Clear default wires (we'll load from JSON)
            circuit.wires = [];
            circuit.gates = [];

            // Load wires
            if (json.wires) {
                for (const wireJson of json.wires) {
                    const wire = Wire.fromJSON(wireJson);
                    circuit.wires.push(wire);
                }
            }

            // Load gates
            if (json.gates) {
                for (const gateJson of json.gates) {
                    const gate = Gate.fromJSON(gateJson);
                    circuit.gates.push(gate);
                }
            }

            // Load state
            circuit.cycleCount = json.cycle || 0;
            circuit.stable = json.stable || false;

            return circuit;
        }

        /**
         * Export just the current state (for animation updates).
         * @returns {Object} Minimal state object
         */
        exportState() {
            return {
                cycle: this.cycleCount,
                stable: this.stable,
                wire_states: this.wires.map(w => Array.from(w.state)),
                dff_states: this.gates
                    .map((g, i) => g.type === GateType.DFF ? { id: i, stored: g.storedValue } : null)
                    .filter(x => x !== null)
            };
        }
    }

    // Export
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { Circuit, Module };
    } else {
        exports.SimEngine = exports.SimEngine || {};
        exports.SimEngine.Circuit = Circuit;
        exports.SimEngine.Module = Module;
    }

})(typeof window !== 'undefined' ? window : global);
