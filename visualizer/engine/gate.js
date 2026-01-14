/**
 * Core Simulation Engine - Gate Class
 *
 * Represents a logic gate in the circuit. Supports all gate types
 * from the C simulator with proper 4-state logic evaluation.
 */

(function(exports) {
    'use strict';

    // Get dependencies
    const { WireState, GateType, Limits } = exports.SimEngine || exports;

    /**
     * Input/output connection to a wire.
     */
    class PortConnection {
        constructor(wireIndex, bit = 0) {
            this.wireIndex = wireIndex;
            this.bit = bit;
        }
    }

    /**
     * Gate logic evaluation functions.
     * These implement 4-state logic (0, 1, X, Z).
     */
    const GateLogic = {
        /**
         * NOT gate: inverter
         */
        evalNot(a) {
            if (a === WireState.LOW) return WireState.HIGH;
            if (a === WireState.HIGH) return WireState.LOW;
            return WireState.UNKNOWN;
        },

        /**
         * AND gate with dominant-0 behavior
         */
        evalAnd(a, b) {
            // Dominant-0: if either is 0, result is 0
            if (a === WireState.LOW || b === WireState.LOW) return WireState.LOW;
            // Both must be 1 for output 1
            if (a === WireState.HIGH && b === WireState.HIGH) return WireState.HIGH;
            return WireState.UNKNOWN;
        },

        /**
         * OR gate with dominant-1 behavior
         */
        evalOr(a, b) {
            // Dominant-1: if either is 1, result is 1
            if (a === WireState.HIGH || b === WireState.HIGH) return WireState.HIGH;
            // Both must be 0 for output 0
            if (a === WireState.LOW && b === WireState.LOW) return WireState.LOW;
            return WireState.UNKNOWN;
        },

        /**
         * XOR gate
         */
        evalXor(a, b) {
            if (a === WireState.UNKNOWN || b === WireState.UNKNOWN) return WireState.UNKNOWN;
            if (a === WireState.HIGHZ || b === WireState.HIGHZ) return WireState.UNKNOWN;
            return (a !== b) ? WireState.HIGH : WireState.LOW;
        },

        /**
         * NAND gate
         */
        evalNand(a, b) {
            return this.evalNot(this.evalAnd(a, b));
        },

        /**
         * NOR gate
         */
        evalNor(a, b) {
            return this.evalNot(this.evalOr(a, b));
        },

        /**
         * XNOR gate
         */
        evalXnor(a, b) {
            return this.evalNot(this.evalXor(a, b));
        },

        /**
         * 2:1 MUX: sel=0 -> a, sel=1 -> b
         */
        evalMux2(a, b, sel) {
            if (sel === WireState.LOW) return a;
            if (sel === WireState.HIGH) return b;
            // Unknown select: output is unknown unless both inputs are the same
            if (a === b) return a;
            return WireState.UNKNOWN;
        },

        /**
         * NMOS transistor: when gate=1, connects source to drain
         * Returns output state or HIGHZ when off
         */
        evalNmos(source, gate) {
            if (gate === WireState.HIGH) return source;
            if (gate === WireState.LOW) return WireState.HIGHZ;
            return WireState.UNKNOWN;
        },

        /**
         * PMOS transistor: when gate=0, connects source to drain
         * Returns output state or HIGHZ when off
         */
        evalPmos(source, gate) {
            if (gate === WireState.LOW) return source;
            if (gate === WireState.HIGH) return WireState.HIGHZ;
            return WireState.UNKNOWN;
        }
    };

    /**
     * Gate represents a logic gate in the circuit.
     */
    class Gate {
        /**
         * Create a new gate.
         * @param {string} name - Gate instance name
         * @param {string} type - Gate type (from GateType enum)
         */
        constructor(name, type) {
            if (!name || typeof name !== 'string') {
                throw new Error('Gate name must be a non-empty string');
            }
            if (!Object.values(GateType).includes(type)) {
                throw new Error(`Invalid gate type: ${type}`);
            }

            this.name = name.substring(0, Limits.MAX_NAME_LEN - 1);
            this.type = type;

            // Input and output connections
            this.inputs = [];  // Array of PortConnection
            this.outputs = []; // Array of PortConnection

            // For DFF: stored value
            this.storedValue = WireState.LOW;

            // For CONST: constant value
            this.constValue = WireState.LOW;

            // For MODULE: reference to module definition
            this.moduleRef = -1;
        }

        /**
         * Add an input connection.
         * @param {number} wireIndex - Index of wire in circuit
         * @param {number} bit - Bit of wire to connect to
         */
        addInput(wireIndex, bit = 0) {
            if (this.inputs.length >= Limits.MAX_INPUTS) {
                throw new Error(`Gate ${this.name} exceeds maximum inputs (${Limits.MAX_INPUTS})`);
            }
            this.inputs.push(new PortConnection(wireIndex, bit));
        }

        /**
         * Add an output connection.
         * @param {number} wireIndex - Index of wire in circuit
         * @param {number} bit - Bit of wire to connect to
         */
        addOutput(wireIndex, bit = 0) {
            if (this.outputs.length >= Limits.MAX_OUTPUTS) {
                throw new Error(`Gate ${this.name} exceeds maximum outputs (${Limits.MAX_OUTPUTS})`);
            }
            this.outputs.push(new PortConnection(wireIndex, bit));
        }

        /**
         * Evaluate the gate and return the output value.
         * Does NOT modify wire states - that's done by Circuit.
         * @param {Function} getInput - Function to get input wire state: (inputIndex) => WireState
         * @returns {number} The computed output WireState
         */
        evaluate(getInput) {
            const in0 = this.inputs.length >= 1 ? getInput(0) : WireState.UNKNOWN;
            const in1 = this.inputs.length >= 2 ? getInput(1) : WireState.UNKNOWN;
            const in2 = this.inputs.length >= 3 ? getInput(2) : WireState.UNKNOWN;

            switch (this.type) {
                case GateType.NOT:
                    return GateLogic.evalNot(in0);

                case GateType.BUF:
                    return in0;

                case GateType.AND: {
                    let result = in0;
                    for (let i = 1; i < this.inputs.length; i++) {
                        result = GateLogic.evalAnd(result, getInput(i));
                    }
                    return result;
                }

                case GateType.OR: {
                    let result = in0;
                    for (let i = 1; i < this.inputs.length; i++) {
                        result = GateLogic.evalOr(result, getInput(i));
                    }
                    return result;
                }

                case GateType.NAND: {
                    let result = in0;
                    for (let i = 1; i < this.inputs.length; i++) {
                        result = GateLogic.evalAnd(result, getInput(i));
                    }
                    return GateLogic.evalNot(result);
                }

                case GateType.NOR: {
                    let result = in0;
                    for (let i = 1; i < this.inputs.length; i++) {
                        result = GateLogic.evalOr(result, getInput(i));
                    }
                    return GateLogic.evalNot(result);
                }

                case GateType.XOR:
                    return GateLogic.evalXor(in0, in1);

                case GateType.XNOR:
                    return GateLogic.evalXnor(in0, in1);

                case GateType.MUX2:
                    // inputs: [A, B, SEL]
                    return GateLogic.evalMux2(in0, in1, in2);

                case GateType.DFF:
                    // D flip-flop outputs stored value (not input!)
                    // The stored value is updated on clock edge
                    return this.storedValue;

                case GateType.DLATCH:
                    // D latch: when enable (in1) is high, output follows input
                    if (in1 === WireState.HIGH) {
                        this.storedValue = in0;
                    }
                    return this.storedValue;

                case GateType.NMOS:
                    return GateLogic.evalNmos(in0, in1);

                case GateType.PMOS:
                    return GateLogic.evalPmos(in0, in1);

                case GateType.CONST:
                    return this.constValue;

                case GateType.MODULE:
                    // Module instances need special handling by Circuit
                    return WireState.UNKNOWN;

                default:
                    return WireState.UNKNOWN;
            }
        }

        /**
         * Clock the gate (for sequential elements like DFF).
         * Called during clock edge.
         * @param {Function} getInput - Function to get input wire state
         */
        clock(getInput) {
            if (this.type === GateType.DFF && this.inputs.length >= 1) {
                // Capture D input on clock edge
                this.storedValue = getInput(0);
            }
        }

        /**
         * Reset gate state.
         */
        reset() {
            this.storedValue = WireState.LOW;
        }

        /**
         * Export gate to JSON object.
         * @returns {Object} JSON-serializable object
         */
        toJSON() {
            const json = {
                name: this.name,
                type: this.type,
                inputs: this.inputs.map(p => ({ wire: p.wireIndex, bit: p.bit })),
                outputs: this.outputs.map(p => ({ wire: p.wireIndex, bit: p.bit }))
            };
            if (this.type === GateType.DFF || this.type === GateType.DLATCH) {
                json.stored = this.storedValue;
            }
            if (this.type === GateType.CONST) {
                json.const_value = this.constValue;
            }
            if (this.moduleRef >= 0) {
                json.module_ref = this.moduleRef;
            }
            return json;
        }

        /**
         * Create a gate from a JSON object.
         * @param {Object} json - JSON object
         * @returns {Gate} New gate instance
         */
        static fromJSON(json) {
            const gate = new Gate(json.name, json.type);
            if (json.inputs) {
                for (const inp of json.inputs) {
                    gate.addInput(inp.wire, inp.bit || 0);
                }
            }
            if (json.outputs) {
                for (const out of json.outputs) {
                    gate.addOutput(out.wire, out.bit || 0);
                }
            }
            if (json.stored !== undefined) {
                gate.storedValue = json.stored;
            }
            if (json.const_value !== undefined) {
                gate.constValue = json.const_value;
            }
            if (json.module_ref !== undefined) {
                gate.moduleRef = json.module_ref;
            }
            return gate;
        }
    }

    // Export
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { Gate, GateLogic, PortConnection };
    } else {
        exports.SimEngine = exports.SimEngine || {};
        exports.SimEngine.Gate = Gate;
        exports.SimEngine.GateLogic = GateLogic;
        exports.SimEngine.PortConnection = PortConnection;
    }

})(typeof window !== 'undefined' ? window : global);
