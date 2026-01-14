/**
 * Core Simulation Engine - Main Entry Point
 *
 * This module re-exports all engine components for convenient use.
 * Can be loaded via ES6 modules or as a browser script.
 *
 * Usage (browser):
 *   <script src="engine/types.js"></script>
 *   <script src="engine/wire.js"></script>
 *   <script src="engine/gate.js"></script>
 *   <script src="engine/circuit.js"></script>
 *   <script src="engine/io.js"></script>
 *   <script src="engine/animation.js"></script>
 *   <script src="engine/index.js"></script>
 *
 *   const { Circuit, Wire, Gate, WireState, AnimationController } = window.SimEngine;
 *
 * Usage (Node.js):
 *   const SimEngine = require('./engine');
 *   const { Circuit, Wire, Gate, WireState } = SimEngine;
 */

(function(exports) {
    'use strict';

    // In browser, SimEngine should already be populated by previous scripts
    const SimEngine = exports.SimEngine || {};

    // Convenience function to create pre-built circuits
    SimEngine.Circuits = {
        /**
         * Create a half adder circuit.
         * @returns {Circuit} Half adder circuit with inputs a, b and outputs sum, carry
         */
        halfAdder() {
            const c = new SimEngine.Circuit();

            // Inputs
            const a = c.addWire('a', 1);
            const b = c.addWire('b', 1);
            c.wires[a].isInput = true;
            c.wires[b].isInput = true;

            // Outputs
            const sum = c.addWire('sum', 1);
            const carry = c.addWire('carry', 1);
            c.wires[sum].isOutput = true;
            c.wires[carry].isOutput = true;

            // Gates
            c.addXor('X1', a, b, sum);
            c.addAnd('A1', a, b, carry);

            return c;
        },

        /**
         * Create a full adder circuit.
         * @returns {Circuit} Full adder with inputs a, b, cin and outputs sum, cout
         */
        fullAdder() {
            const c = new SimEngine.Circuit();

            // Inputs
            const a = c.addWire('a', 1);
            const b = c.addWire('b', 1);
            const cin = c.addWire('cin', 1);
            c.wires[a].isInput = true;
            c.wires[b].isInput = true;
            c.wires[cin].isInput = true;

            // Outputs
            const sum = c.addWire('sum', 1);
            const cout = c.addWire('cout', 1);
            c.wires[sum].isOutput = true;
            c.wires[cout].isOutput = true;

            // Internal wires
            const s1 = c.addWire('s1', 1);
            const c1 = c.addWire('c1', 1);
            const c2 = c.addWire('c2', 1);

            // Half adder 1: a + b
            c.addXor('X1', a, b, s1);
            c.addAnd('A1', a, b, c1);

            // Half adder 2: s1 + cin
            c.addXor('X2', s1, cin, sum);
            c.addAnd('A2', s1, cin, c2);

            // OR for carry out
            c.addOr('O1', c1, c2, cout);

            return c;
        },

        /**
         * Create an SR latch using NAND gates.
         * @returns {Circuit} SR latch with inputs S, R and outputs Q, Qn
         */
        srLatch() {
            const c = new SimEngine.Circuit();

            // Inputs (active low)
            const s = c.addWire('S', 1);
            const r = c.addWire('R', 1);
            c.wires[s].isInput = true;
            c.wires[r].isInput = true;

            // Outputs
            const q = c.addWire('Q', 1);
            const qn = c.addWire('Qn', 1);
            c.wires[q].isOutput = true;
            c.wires[qn].isOutput = true;

            // Cross-coupled NAND gates
            c.addNand('N1', s, qn, q);
            c.addNand('N2', r, q, qn);

            return c;
        },

        /**
         * Create a 4-bit ripple carry adder.
         * @returns {Circuit} 4-bit adder with inputs a[4], b[4], cin and outputs sum[4], cout
         */
        adder4() {
            const c = new SimEngine.Circuit();

            // Inputs (4-bit buses)
            const a = c.addWire('a', 4);
            const b = c.addWire('b', 4);
            const cin = c.addWire('cin', 1);
            c.wires[a].isInput = true;
            c.wires[b].isInput = true;
            c.wires[cin].isInput = true;

            // Outputs
            const sum = c.addWire('sum', 4);
            const cout = c.addWire('cout', 1);
            c.wires[sum].isOutput = true;
            c.wires[cout].isOutput = true;

            // Internal carry chain
            const carry = [cin];
            for (let i = 0; i < 4; i++) {
                const ci = carry[i];
                const co = i < 3 ? c.addWire(`c${i}`, 1) : cout;
                carry.push(co);

                // Full adder for bit i
                const s1 = c.addWire(`s${i}_t`, 1);
                const c1 = c.addWire(`c${i}_t1`, 1);
                const c2 = c.addWire(`c${i}_t2`, 1);

                // XOR for first half-add
                const g1 = c.addGate(SimEngine.GateType.XOR, `FA${i}_X1`);
                c.addGateInput(g1, a, i);
                c.addGateInput(g1, b, i);
                c.addGateOutput(g1, s1, 0);

                // AND for first carry
                const g2 = c.addGate(SimEngine.GateType.AND, `FA${i}_A1`);
                c.addGateInput(g2, a, i);
                c.addGateInput(g2, b, i);
                c.addGateOutput(g2, c1, 0);

                // XOR for second half-add (sum)
                const g3 = c.addGate(SimEngine.GateType.XOR, `FA${i}_X2`);
                c.addGateInput(g3, s1, 0);
                c.addGateInput(g3, ci, i === 0 ? 0 : 0);
                c.addGateOutput(g3, sum, i);

                // AND for second carry
                const g4 = c.addGate(SimEngine.GateType.AND, `FA${i}_A2`);
                c.addGateInput(g4, s1, 0);
                c.addGateInput(g4, ci, i === 0 ? 0 : 0);
                c.addGateOutput(g4, c2, 0);

                // OR for carry out
                const g5 = c.addGate(SimEngine.GateType.OR, `FA${i}_O1`);
                c.addGateInput(g5, c1, 0);
                c.addGateInput(g5, c2, 0);
                c.addGateOutput(g5, co, i < 3 ? 0 : 0);
            }

            return c;
        },

        /**
         * Create a D flip-flop.
         * @returns {Circuit} D flip-flop with inputs D, CLK and outputs Q, Qn
         */
        dFlipFlop() {
            const c = new SimEngine.Circuit();

            // Inputs
            const d = c.addWire('D', 1);
            const clk = c.addWire('CLK', 1);
            c.wires[d].isInput = true;
            c.wires[clk].isInput = true;

            // Outputs
            const q = c.addWire('Q', 1);
            const qn = c.addWire('Qn', 1);
            c.wires[q].isOutput = true;
            c.wires[qn].isOutput = true;

            // DFF gate
            const dff = c.addGate(SimEngine.GateType.DFF, 'DFF1');
            c.addGateInput(dff, d, 0);
            c.addGateInput(dff, clk, 0);
            c.addGateOutput(dff, q, 0);

            // NOT for Qn
            c.addNot('NOT1', q, qn);

            return c;
        }
    };

    /**
     * Version information.
     */
    SimEngine.VERSION = '1.1.0';  // Updated for animation support

    /**
     * Quick test to verify engine is working.
     */
    SimEngine.selfTest = function() {
        console.log(`SimEngine v${SimEngine.VERSION} self-test...`);

        // Test half adder
        const ha = SimEngine.Circuits.halfAdder();
        const a = ha.findWire('a');
        const b = ha.findWire('b');
        const sum = ha.findWire('sum');
        const carry = ha.findWire('carry');

        // Test 1+1=10 (sum=0, carry=1)
        ha.setWire(a, 0, SimEngine.WireState.HIGH);
        ha.setWire(b, 0, SimEngine.WireState.HIGH);
        ha.propagate();

        const s = ha.getWire(sum, 0);
        const c = ha.getWire(carry, 0);

        if (s === SimEngine.WireState.LOW && c === SimEngine.WireState.HIGH) {
            console.log('  Half adder test: PASSED (1+1=10)');
            return true;
        } else {
            console.error('  Half adder test: FAILED');
            console.error(`    Expected sum=0, carry=1`);
            console.error(`    Got sum=${s}, carry=${c}`);
            return false;
        }
    };

    // Export for Node.js
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = SimEngine;
    }

})(typeof window !== 'undefined' ? window : global);
