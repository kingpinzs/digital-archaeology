/**
 * Core Simulation Engine - Unit Tests
 *
 * Comprehensive test suite for the simulation engine.
 */

(function() {
    'use strict';

    const output = document.getElementById('output');
    const {
        WireState, WireStateStr, GateType, Limits,
        Wire, Gate, GateLogic, Circuit, CircuitIO, Circuits
    } = window.SimEngine;

    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    function log(msg, className = '') {
        const div = document.createElement('div');
        div.textContent = msg;
        if (className) div.className = className;
        output.appendChild(div);
    }

    function suite(name) {
        const h = document.createElement('h2');
        h.textContent = name;
        output.appendChild(h);
    }

    function test(name, fn) {
        totalTests++;
        try {
            fn();
            passedTests++;
            log(name, 'test-case pass');
        } catch (e) {
            failedTests++;
            log(name + ': ' + e.message, 'test-case fail');
            console.error(e);
        }
    }

    function assert(condition, message) {
        if (!condition) throw new Error(message || 'Assertion failed');
    }

    function assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error((message || '') + ' Expected ' + expected + ', got ' + actual);
        }
    }

    // ========================================
    // Wire Tests
    // ========================================
    suite('Wire Class');

    test('Wire creation with default width', function() {
        const wire = new Wire('test');
        assertEqual(wire.name, 'test');
        assertEqual(wire.width, 1);
        assertEqual(wire.getState(0), WireState.UNKNOWN);
    });

    test('Wire creation with bus width', function() {
        const wire = new Wire('bus', 8);
        assertEqual(wire.width, 8);
        for (let i = 0; i < 8; i++) {
            assertEqual(wire.getState(i), WireState.UNKNOWN);
        }
    });

    test('Wire setState and getState', function() {
        const wire = new Wire('test');
        wire.setState(0, WireState.HIGH);
        assertEqual(wire.getState(0), WireState.HIGH);
        wire.setState(0, WireState.LOW);
        assertEqual(wire.getState(0), WireState.LOW);
    });

    test('Wire setValueInt and getValueInt', function() {
        const wire = new Wire('data', 8);
        wire.setValueInt(0x42);
        assertEqual(wire.getValueInt(), 0x42);
    });

    test('Wire getValueInt returns -1 for unknown', function() {
        const wire = new Wire('data', 8);
        assertEqual(wire.getValueInt(), -1);
    });

    test('Wire reset', function() {
        const wire = new Wire('test');
        wire.setState(0, WireState.HIGH);
        wire.reset();
        assertEqual(wire.getState(0), WireState.UNKNOWN);
    });

    test('Wire JSON serialization', function() {
        const wire = new Wire('test', 4);
        wire.setValueInt(5);
        wire.isInput = true;
        const json = wire.toJSON();
        const restored = Wire.fromJSON(json);
        assertEqual(restored.name, 'test');
        assertEqual(restored.width, 4);
        assertEqual(restored.getValueInt(), 5);
        assertEqual(restored.isInput, true);
    });

    // ========================================
    // Gate Logic Tests
    // ========================================
    suite('Gate Logic');

    test('NOT gate truth table', function() {
        assertEqual(GateLogic.evalNot(WireState.LOW), WireState.HIGH);
        assertEqual(GateLogic.evalNot(WireState.HIGH), WireState.LOW);
        assertEqual(GateLogic.evalNot(WireState.UNKNOWN), WireState.UNKNOWN);
    });

    test('AND gate truth table', function() {
        assertEqual(GateLogic.evalAnd(WireState.LOW, WireState.LOW), WireState.LOW);
        assertEqual(GateLogic.evalAnd(WireState.LOW, WireState.HIGH), WireState.LOW);
        assertEqual(GateLogic.evalAnd(WireState.HIGH, WireState.LOW), WireState.LOW);
        assertEqual(GateLogic.evalAnd(WireState.HIGH, WireState.HIGH), WireState.HIGH);
    });

    test('AND gate dominant-0', function() {
        assertEqual(GateLogic.evalAnd(WireState.LOW, WireState.UNKNOWN), WireState.LOW);
        assertEqual(GateLogic.evalAnd(WireState.UNKNOWN, WireState.LOW), WireState.LOW);
    });

    test('OR gate truth table', function() {
        assertEqual(GateLogic.evalOr(WireState.LOW, WireState.LOW), WireState.LOW);
        assertEqual(GateLogic.evalOr(WireState.LOW, WireState.HIGH), WireState.HIGH);
        assertEqual(GateLogic.evalOr(WireState.HIGH, WireState.LOW), WireState.HIGH);
        assertEqual(GateLogic.evalOr(WireState.HIGH, WireState.HIGH), WireState.HIGH);
    });

    test('OR gate dominant-1', function() {
        assertEqual(GateLogic.evalOr(WireState.HIGH, WireState.UNKNOWN), WireState.HIGH);
        assertEqual(GateLogic.evalOr(WireState.UNKNOWN, WireState.HIGH), WireState.HIGH);
    });

    test('XOR gate truth table', function() {
        assertEqual(GateLogic.evalXor(WireState.LOW, WireState.LOW), WireState.LOW);
        assertEqual(GateLogic.evalXor(WireState.LOW, WireState.HIGH), WireState.HIGH);
        assertEqual(GateLogic.evalXor(WireState.HIGH, WireState.LOW), WireState.HIGH);
        assertEqual(GateLogic.evalXor(WireState.HIGH, WireState.HIGH), WireState.LOW);
    });

    test('NAND gate truth table', function() {
        assertEqual(GateLogic.evalNand(WireState.LOW, WireState.LOW), WireState.HIGH);
        assertEqual(GateLogic.evalNand(WireState.LOW, WireState.HIGH), WireState.HIGH);
        assertEqual(GateLogic.evalNand(WireState.HIGH, WireState.LOW), WireState.HIGH);
        assertEqual(GateLogic.evalNand(WireState.HIGH, WireState.HIGH), WireState.LOW);
    });

    test('NOR gate truth table', function() {
        assertEqual(GateLogic.evalNor(WireState.LOW, WireState.LOW), WireState.HIGH);
        assertEqual(GateLogic.evalNor(WireState.LOW, WireState.HIGH), WireState.LOW);
        assertEqual(GateLogic.evalNor(WireState.HIGH, WireState.LOW), WireState.LOW);
        assertEqual(GateLogic.evalNor(WireState.HIGH, WireState.HIGH), WireState.LOW);
    });

    test('MUX2 with select=0', function() {
        assertEqual(GateLogic.evalMux2(WireState.HIGH, WireState.LOW, WireState.LOW), WireState.HIGH);
    });

    test('MUX2 with select=1', function() {
        assertEqual(GateLogic.evalMux2(WireState.HIGH, WireState.LOW, WireState.HIGH), WireState.LOW);
    });

    test('NMOS transistor', function() {
        assertEqual(GateLogic.evalNmos(WireState.HIGH, WireState.HIGH), WireState.HIGH);
        assertEqual(GateLogic.evalNmos(WireState.HIGH, WireState.LOW), WireState.HIGHZ);
    });

    test('PMOS transistor', function() {
        assertEqual(GateLogic.evalPmos(WireState.HIGH, WireState.LOW), WireState.HIGH);
        assertEqual(GateLogic.evalPmos(WireState.HIGH, WireState.HIGH), WireState.HIGHZ);
    });

    // ========================================
    // Gate Class Tests
    // ========================================
    suite('Gate Class');

    test('Gate creation', function() {
        const gate = new Gate('not1', GateType.NOT);
        assertEqual(gate.name, 'not1');
        assertEqual(gate.type, GateType.NOT);
    });

    test('Gate input/output connections', function() {
        const gate = new Gate('and1', GateType.AND);
        gate.addInput(0, 0);
        gate.addInput(1, 0);
        gate.addOutput(2, 0);
        assertEqual(gate.inputs.length, 2);
        assertEqual(gate.outputs.length, 1);
    });

    test('Gate JSON serialization', function() {
        const gate = new Gate('xor1', GateType.XOR);
        gate.addInput(0, 0);
        gate.addInput(1, 0);
        gate.addOutput(2, 0);
        const json = gate.toJSON();
        const restored = Gate.fromJSON(json);
        assertEqual(restored.name, 'xor1');
        assertEqual(restored.type, GateType.XOR);
        assertEqual(restored.inputs.length, 2);
    });

    // ========================================
    // Circuit Tests
    // ========================================
    suite('Circuit Class');

    test('Circuit initialization with GND and VDD', function() {
        const c = new Circuit();
        const gnd = c.findWire('gnd');
        const vdd = c.findWire('vdd');
        assert(gnd >= 0, 'GND wire should exist');
        assert(vdd >= 0, 'VDD wire should exist');
        assertEqual(c.getWire(gnd, 0), WireState.LOW);
        assertEqual(c.getWire(vdd, 0), WireState.HIGH);
    });

    test('Circuit addWire and findWire', function() {
        const c = new Circuit();
        const idx = c.addWire('test_wire', 4);
        assertEqual(c.findWire('test_wire'), idx);
        assertEqual(c.wires[idx].width, 4);
    });

    test('Circuit NOT gate evaluation', function() {
        const c = new Circuit();
        const a = c.addWire('a', 1);
        const y = c.addWire('y', 1);
        c.addNot('not1', a, y);

        c.setWire(a, 0, WireState.LOW);
        c.propagate();
        assertEqual(c.getWire(y, 0), WireState.HIGH);

        c.setWire(a, 0, WireState.HIGH);
        c.propagate();
        assertEqual(c.getWire(y, 0), WireState.LOW);
    });

    test('Circuit AND gate evaluation', function() {
        const c = new Circuit();
        const a = c.addWire('a', 1);
        const b = c.addWire('b', 1);
        const y = c.addWire('y', 1);
        c.addAnd('and1', a, b, y);

        c.setWire(a, 0, WireState.HIGH);
        c.setWire(b, 0, WireState.HIGH);
        c.propagate();
        assertEqual(c.getWire(y, 0), WireState.HIGH);

        c.setWire(a, 0, WireState.LOW);
        c.propagate();
        assertEqual(c.getWire(y, 0), WireState.LOW);
    });

    test('Circuit JSON export/import', function() {
        const c = new Circuit();
        const a = c.addWire('a', 1);
        const b = c.addWire('b', 1);
        const y = c.addWire('y', 1);
        c.addXor('xor1', a, b, y);

        const json = c.toJSON();
        const c2 = Circuit.fromJSON(json);

        assertEqual(c2.wires.length, c.wires.length);
        assertEqual(c2.gates.length, c.gates.length);
    });

    // ========================================
    // Pre-built Circuit Tests
    // ========================================
    suite('Pre-built Circuits');

    test('Half adder: 0+0=00', function() {
        const c = Circuits.halfAdder();
        const a = c.findWire('a');
        const b = c.findWire('b');
        const sum = c.findWire('sum');
        const carry = c.findWire('carry');

        c.setWire(a, 0, WireState.LOW);
        c.setWire(b, 0, WireState.LOW);
        c.propagate();

        assertEqual(c.getWire(sum, 0), WireState.LOW);
        assertEqual(c.getWire(carry, 0), WireState.LOW);
    });

    test('Half adder: 0+1=01', function() {
        const c = Circuits.halfAdder();
        const a = c.findWire('a');
        const b = c.findWire('b');
        const sum = c.findWire('sum');
        const carry = c.findWire('carry');

        c.setWire(a, 0, WireState.LOW);
        c.setWire(b, 0, WireState.HIGH);
        c.propagate();

        assertEqual(c.getWire(sum, 0), WireState.HIGH);
        assertEqual(c.getWire(carry, 0), WireState.LOW);
    });

    test('Half adder: 1+1=10', function() {
        const c = Circuits.halfAdder();
        const a = c.findWire('a');
        const b = c.findWire('b');
        const sum = c.findWire('sum');
        const carry = c.findWire('carry');

        c.setWire(a, 0, WireState.HIGH);
        c.setWire(b, 0, WireState.HIGH);
        c.propagate();

        assertEqual(c.getWire(sum, 0), WireState.LOW);
        assertEqual(c.getWire(carry, 0), WireState.HIGH);
    });

    test('Full adder: 1+1+1=11', function() {
        const c = Circuits.fullAdder();
        const a = c.findWire('a');
        const b = c.findWire('b');
        const cin = c.findWire('cin');
        const sum = c.findWire('sum');
        const cout = c.findWire('cout');

        c.setWire(a, 0, WireState.HIGH);
        c.setWire(b, 0, WireState.HIGH);
        c.setWire(cin, 0, WireState.HIGH);
        c.propagate();

        assertEqual(c.getWire(sum, 0), WireState.HIGH);
        assertEqual(c.getWire(cout, 0), WireState.HIGH);
    });

    test('SR latch set', function() {
        const c = Circuits.srLatch();
        const s = c.findWire('S');
        const r = c.findWire('R');
        const q = c.findWire('Q');

        // Set: S=0 (active low), R=1
        c.setWire(s, 0, WireState.LOW);
        c.setWire(r, 0, WireState.HIGH);
        c.propagate();

        assertEqual(c.getWire(q, 0), WireState.HIGH);
    });

    // ========================================
    // CircuitIO Tests
    // ========================================
    suite('CircuitIO');

    test('JSON string export/import', function() {
        const c = Circuits.halfAdder();
        const jsonStr = CircuitIO.toJSONString(c);
        assert(jsonStr.includes('sum'), 'JSON should contain circuit data');
        const c2 = CircuitIO.fromJSONString(jsonStr);
        assertEqual(c2.gates.length, c.gates.length);
    });

    test('Text table export', function() {
        const c = Circuits.halfAdder();
        c.propagate();
        const table = CircuitIO.toTextTable(c);
        assert(table.includes('Circuit State'), 'Table should have header');
        assert(table.includes('sum'), 'Table should include sum wire');
    });

    // ========================================
    // Integration Tests
    // ========================================
    suite('Integration Tests');

    test('4-bit adder: 5+3=8', function() {
        const c = Circuits.adder4();
        const a = c.findWire('a');
        const b = c.findWire('b');
        const cin = c.findWire('cin');
        const sum = c.findWire('sum');
        const cout = c.findWire('cout');

        // Set a = 5 (0101)
        c.wires[a].setValueInt(5);
        // Set b = 3 (0011)
        c.wires[b].setValueInt(3);
        // Set cin = 0
        c.setWire(cin, 0, WireState.LOW);

        c.propagate();

        assertEqual(c.wires[sum].getValueInt(), 8);
        assertEqual(c.getWire(cout, 0), WireState.LOW);
    });

    test('4-bit adder overflow: 15+1=16', function() {
        const c = Circuits.adder4();
        const a = c.findWire('a');
        const b = c.findWire('b');
        const cin = c.findWire('cin');
        const sum = c.findWire('sum');
        const cout = c.findWire('cout');

        c.wires[a].setValueInt(15);
        c.wires[b].setValueInt(1);
        c.setWire(cin, 0, WireState.LOW);

        c.propagate();

        assertEqual(c.wires[sum].getValueInt(), 0);  // 16 mod 16 = 0
        assertEqual(c.getWire(cout, 0), WireState.HIGH);  // Carry out
    });

    test('Self-test passes', function() {
        assert(SimEngine.selfTest(), 'SimEngine.selfTest() should pass');
    });

    // ========================================
    // Summary
    // ========================================
    const summary = document.createElement('div');
    summary.className = failedTests === 0 ? 'summary all-pass' : 'summary has-fail';

    const strong = document.createElement('strong');
    strong.textContent = 'Test Summary';
    summary.appendChild(strong);

    const br1 = document.createElement('br');
    summary.appendChild(br1);
    summary.appendChild(document.createTextNode('Total: ' + totalTests));

    const br2 = document.createElement('br');
    summary.appendChild(br2);
    summary.appendChild(document.createTextNode('Passed: ' + passedTests));

    const br3 = document.createElement('br');
    summary.appendChild(br3);
    summary.appendChild(document.createTextNode('Failed: ' + failedTests));

    output.appendChild(summary);

    console.log('Tests complete: ' + passedTests + '/' + totalTests + ' passed');

})();
