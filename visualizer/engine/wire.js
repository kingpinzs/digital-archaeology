/**
 * Core Simulation Engine - Wire Class
 *
 * Represents a wire (signal) in the circuit, supporting both
 * single-bit and multi-bit (bus) configurations.
 */

(function(exports) {
    'use strict';

    // Get dependencies
    const { WireState, WireStateStr, Limits } = exports.SimEngine || exports;

    /**
     * Wire represents a single wire or bus in the circuit.
     * Each bit has a current state and a next state (for sequential logic).
     */
    class Wire {
        /**
         * Create a new wire.
         * @param {string} name - Wire name (must be unique in circuit)
         * @param {number} width - Number of bits (1 for single wire, >1 for bus)
         */
        constructor(name, width = 1) {
            if (!name || typeof name !== 'string') {
                throw new Error('Wire name must be a non-empty string');
            }
            if (width < 1 || width > 64) {
                throw new Error(`Wire width must be between 1 and 64, got ${width}`);
            }

            this.name = name.substring(0, Limits.MAX_NAME_LEN - 1);
            this.width = width;

            // State arrays
            this.state = new Array(width).fill(WireState.UNKNOWN);
            this.nextState = new Array(width).fill(WireState.UNKNOWN);

            // Port flags
            this.isInput = false;
            this.isOutput = false;

            // For visualization - optional position
            this.x = 0;
            this.y = 0;
        }

        /**
         * Get the state of a specific bit.
         * @param {number} bit - Bit index (0-indexed)
         * @returns {number} The wire state at that bit
         */
        getState(bit = 0) {
            if (bit < 0 || bit >= this.width) {
                return WireState.UNKNOWN;
            }
            return this.state[bit];
        }

        /**
         * Set the current state of a specific bit.
         * Also sets nextState to prevent immediate overwrite during propagation.
         * @param {number} bit - Bit index
         * @param {number} value - WireState value
         */
        setState(bit, value) {
            if (bit < 0 || bit >= this.width) {
                return;
            }
            this.state[bit] = value;
            this.nextState[bit] = value;
        }

        /**
         * Set the next state of a specific bit (used during propagation).
         * @param {number} bit - Bit index
         * @param {number} value - WireState value
         * @returns {boolean} True if the value changed
         */
        setNextState(bit, value) {
            if (bit < 0 || bit >= this.width) {
                return false;
            }
            const changed = this.nextState[bit] !== value;
            this.nextState[bit] = value;
            return changed;
        }

        /**
         * Apply nextState to state (at end of propagation cycle).
         * @returns {boolean} True if any bit changed
         */
        applyNextState() {
            let changed = false;
            for (let i = 0; i < this.width; i++) {
                if (this.state[i] !== this.nextState[i]) {
                    this.state[i] = this.nextState[i];
                    changed = true;
                }
            }
            return changed;
        }

        /**
         * Set the entire wire value from an integer.
         * @param {number} value - Integer value to set
         */
        setValueInt(value) {
            for (let i = 0; i < this.width; i++) {
                this.state[i] = (value >> i) & 1 ? WireState.HIGH : WireState.LOW;
                this.nextState[i] = this.state[i];
            }
        }

        /**
         * Get the entire wire value as an integer.
         * Returns -1 if any bit is unknown or high-Z.
         * @returns {number} Integer value or -1
         */
        getValueInt() {
            let value = 0;
            for (let i = 0; i < this.width; i++) {
                if (this.state[i] === WireState.UNKNOWN || this.state[i] === WireState.HIGHZ) {
                    return -1;
                }
                if (this.state[i] === WireState.HIGH) {
                    value |= (1 << i);
                }
            }
            return value;
        }

        /**
         * Reset wire to unknown state.
         */
        reset() {
            this.state.fill(WireState.UNKNOWN);
            this.nextState.fill(WireState.UNKNOWN);
        }

        /**
         * Get string representation for debugging.
         * @returns {string} Wire state string
         */
        toString() {
            let str = '';
            // MSB first for readability
            for (let i = this.width - 1; i >= 0; i--) {
                str += WireStateStr[this.state[i]] || '?';
            }
            return `${this.name}[${this.width}]=${str}`;
        }

        /**
         * Export wire to JSON object.
         * @returns {Object} JSON-serializable object
         */
        toJSON() {
            return {
                name: this.name,
                width: this.width,
                is_input: this.isInput,
                is_output: this.isOutput,
                state: Array.from(this.state)
            };
        }

        /**
         * Create a wire from a JSON object.
         * @param {Object} json - JSON object from toJSON or C simulator
         * @returns {Wire} New wire instance
         */
        static fromJSON(json) {
            const wire = new Wire(json.name, json.width || 1);
            wire.isInput = json.is_input || false;
            wire.isOutput = json.is_output || false;
            if (json.state && Array.isArray(json.state)) {
                for (let i = 0; i < Math.min(json.state.length, wire.width); i++) {
                    wire.state[i] = json.state[i];
                    wire.nextState[i] = json.state[i];
                }
            }
            return wire;
        }
    }

    // Export
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { Wire };
    } else {
        exports.SimEngine = exports.SimEngine || {};
        exports.SimEngine.Wire = Wire;
    }

})(typeof window !== 'undefined' ? window : global);
