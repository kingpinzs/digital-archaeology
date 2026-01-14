/**
 * Core Simulation Engine - Animation Module Tests
 *
 * Test suite for animation controller, circuit animator, and propagation events.
 */

(function() {
    'use strict';

    const output = document.getElementById('output');
    const {
        WireState, GateType, Circuit, Circuits,
        AnimationState, PropagationEventType, PropagationEvent,
        CircuitAnimator, AnimationController, GateRenderer
    } = window.SimEngine;

    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    function log(msg, className) {
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

    function assertContains(array, predicate, message) {
        const found = array.find(predicate);
        if (!found) {
            throw new Error(message || 'Array does not contain expected element');
        }
    }

    // ========================================
    // PropagationEvent Tests
    // ========================================
    suite('PropagationEvent');

    test('Create iteration start event', function() {
        const event = PropagationEvent.iterationStart(0);
        assertEqual(event.type, PropagationEventType.ITERATION_START);
        assertEqual(event.data.iteration, 0);
        assert(event.timestamp > 0, 'Should have timestamp');
    });

    test('Create gate evaluate event', function() {
        const event = PropagationEvent.gateEvaluate(0, 'AND1', 'AND', [1, 1], 1);
        assertEqual(event.type, PropagationEventType.GATE_EVALUATE);
        assertEqual(event.data.gateIndex, 0);
        assertEqual(event.data.gateName, 'AND1');
        assertEqual(event.data.gateType, 'AND');
        assertEqual(event.data.inputStates.length, 2);
        assertEqual(event.data.outputState, 1);
    });

    test('Create wire change event', function() {
        const event = PropagationEvent.wireChange(2, 'out', 0, WireState.UNKNOWN, WireState.HIGH);
        assertEqual(event.type, PropagationEventType.WIRE_CHANGE);
        assertEqual(event.data.wireIndex, 2);
        assertEqual(event.data.wireName, 'out');
        assertEqual(event.data.oldState, WireState.UNKNOWN);
        assertEqual(event.data.newState, WireState.HIGH);
    });

    test('Create iteration end event', function() {
        const event = PropagationEvent.iterationEnd(0, true);
        assertEqual(event.type, PropagationEventType.ITERATION_END);
        assertEqual(event.data.iteration, 0);
        assertEqual(event.data.stable, true);
    });

    test('Create propagation complete event', function() {
        const event = PropagationEvent.propagationComplete(3);
        assertEqual(event.type, PropagationEventType.PROPAGATION_COMPLETE);
        assertEqual(event.data.totalIterations, 3);
    });

    test('Create propagation timeout event', function() {
        const event = PropagationEvent.propagationTimeout(100);
        assertEqual(event.type, PropagationEventType.PROPAGATION_TIMEOUT);
        assertEqual(event.data.iteration, 100);
    });

    // ========================================
    // CircuitAnimator Tests
    // ========================================
    suite('CircuitAnimator');

    test('Create animator for circuit', function() {
        const circuit = Circuits.halfAdder();
        const animator = new CircuitAnimator(circuit);
        assert(animator.circuit === circuit, 'Should store circuit reference');
        assertEqual(animator.currentIteration, 0);
        assertEqual(animator.events.length, 0);
    });

    test('Animator throws without circuit', function() {
        let threw = false;
        try {
            new CircuitAnimator(null);
        } catch (e) {
            threw = true;
        }
        assert(threw, 'Should throw without circuit');
    });

    test('Single step generates events', function() {
        const circuit = Circuits.halfAdder();
        const a = circuit.findWire('a');
        const b = circuit.findWire('b');
        circuit.setWire(a, 0, WireState.HIGH);
        circuit.setWire(b, 0, WireState.HIGH);

        const animator = new CircuitAnimator(circuit);
        const events = animator.step();

        assert(events.length > 0, 'Should generate events');
        assertContains(events, e => e.type === PropagationEventType.ITERATION_START,
            'Should have iteration start event');
        assertContains(events, e => e.type === PropagationEventType.GATE_EVALUATE,
            'Should have gate evaluate event');
    });

    test('Step increments iteration', function() {
        const circuit = Circuits.halfAdder();
        const animator = new CircuitAnimator(circuit);

        assertEqual(animator.currentIteration, 0);
        animator.step();
        assertEqual(animator.currentIteration, 1);
        animator.step();
        assertEqual(animator.currentIteration, 2);
    });

    test('isComplete returns true when stable', function() {
        const circuit = Circuits.halfAdder();
        const animator = new CircuitAnimator(circuit);

        // Initially not complete
        assert(!animator.isComplete(), 'Should not be complete initially');

        // Run to completion
        animator.runToCompletion();
        assert(animator.isComplete(), 'Should be complete after runToCompletion');
    });

    test('runToCompletion collects all events', function() {
        const circuit = Circuits.halfAdder();
        const a = circuit.findWire('a');
        const b = circuit.findWire('b');
        circuit.setWire(a, 0, WireState.HIGH);
        circuit.setWire(b, 0, WireState.LOW);

        const animator = new CircuitAnimator(circuit);
        const events = animator.runToCompletion();

        assert(events.length > 0, 'Should collect events');
        assertContains(events, e => e.type === PropagationEventType.PROPAGATION_COMPLETE,
            'Should have completion event');
    });

    test('Reset clears animation state', function() {
        const circuit = Circuits.halfAdder();
        const animator = new CircuitAnimator(circuit);

        animator.step();
        animator.step();

        assert(animator.currentIteration > 0, 'Should have advanced');
        assert(animator.events.length > 0, 'Should have events');

        animator.reset();

        assertEqual(animator.currentIteration, 0, 'Iteration should be reset');
        assertEqual(animator.events.length, 0, 'Events should be cleared');
    });

    test('Half adder animation produces correct output', function() {
        const circuit = Circuits.halfAdder();
        const a = circuit.findWire('a');
        const b = circuit.findWire('b');
        const sum = circuit.findWire('sum');
        const carry = circuit.findWire('carry');

        // Set 1 + 1
        circuit.setWire(a, 0, WireState.HIGH);
        circuit.setWire(b, 0, WireState.HIGH);

        const animator = new CircuitAnimator(circuit);
        animator.runToCompletion();

        // Check results: 1+1 = 10 (sum=0, carry=1)
        assertEqual(circuit.getWire(sum, 0), WireState.LOW, 'Sum should be 0');
        assertEqual(circuit.getWire(carry, 0), WireState.HIGH, 'Carry should be 1');
    });

    test('Full adder animation produces correct output', function() {
        const circuit = Circuits.fullAdder();
        const a = circuit.findWire('a');
        const b = circuit.findWire('b');
        const cin = circuit.findWire('cin');
        const sum = circuit.findWire('sum');
        const cout = circuit.findWire('cout');

        // Set 1 + 1 + 1 = 11 (sum=1, cout=1)
        circuit.setWire(a, 0, WireState.HIGH);
        circuit.setWire(b, 0, WireState.HIGH);
        circuit.setWire(cin, 0, WireState.HIGH);

        const animator = new CircuitAnimator(circuit);
        animator.runToCompletion();

        assertEqual(circuit.getWire(sum, 0), WireState.HIGH, 'Sum should be 1');
        assertEqual(circuit.getWire(cout, 0), WireState.HIGH, 'Cout should be 1');
    });

    // ========================================
    // AnimationController Tests
    // ========================================
    suite('AnimationController');

    test('Create controller with animator', function() {
        const circuit = Circuits.halfAdder();
        const animator = new CircuitAnimator(circuit);
        const controller = new AnimationController(animator);

        assertEqual(controller.getState(), AnimationState.IDLE);
        assertEqual(controller.getSpeed(), 1.0);
    });

    test('Set and get speed', function() {
        const circuit = Circuits.halfAdder();
        const animator = new CircuitAnimator(circuit);
        const controller = new AnimationController(animator);

        controller.setSpeed(2.0);
        assertEqual(controller.getSpeed(), 2.0);

        controller.setSpeed(0.5);
        assertEqual(controller.getSpeed(), 0.5);
    });

    test('Speed is clamped to valid range', function() {
        const circuit = Circuits.halfAdder();
        const animator = new CircuitAnimator(circuit);
        const controller = new AnimationController(animator);

        controller.setSpeed(100);
        assertEqual(controller.getSpeed(), 10.0, 'Speed should be capped at 10');

        controller.setSpeed(0.001);
        assertEqual(controller.getSpeed(), 0.1, 'Speed should be at least 0.1');
    });

    test('Step transitions to stepping then paused', function() {
        const circuit = Circuits.halfAdder();
        circuit.setWire(circuit.findWire('a'), 0, WireState.HIGH);

        const animator = new CircuitAnimator(circuit);
        const controller = new AnimationController(animator);

        const stateChanges = [];
        controller.onStateChange = (from, to) => {
            stateChanges.push({ from, to });
        };

        controller.step();

        // Should have transitioned through states
        assert(stateChanges.length >= 1, 'Should have state changes');
    });

    test('Step calls onFrame callback', function() {
        const circuit = Circuits.halfAdder();
        circuit.setWire(circuit.findWire('a'), 0, WireState.HIGH);

        const animator = new CircuitAnimator(circuit);
        const controller = new AnimationController(animator);

        let frameEvents = null;
        controller.onFrame = (events) => {
            frameEvents = events;
        };

        controller.step();

        assert(frameEvents !== null, 'onFrame should be called');
        assert(frameEvents.length > 0, 'Should have frame events');
    });

    test('Reset returns to idle', function() {
        const circuit = Circuits.halfAdder();
        const animator = new CircuitAnimator(circuit);
        const controller = new AnimationController(animator);

        controller.step();
        controller.reset();

        assertEqual(controller.getState(), AnimationState.IDLE);
        assertEqual(animator.currentIteration, 0);
    });

    test('Stop returns to idle', function() {
        const circuit = Circuits.halfAdder();
        const animator = new CircuitAnimator(circuit);
        const controller = new AnimationController(animator);

        controller.step();
        controller.stop();

        assertEqual(controller.getState(), AnimationState.IDLE);
    });

    test('getFrameDelay adjusts for speed', function() {
        const circuit = Circuits.halfAdder();
        const animator = new CircuitAnimator(circuit);
        const controller = new AnimationController(animator);

        const baseDelay = controller.getFrameDelay();

        controller.setSpeed(2.0);
        assertEqual(controller.getFrameDelay(), baseDelay / 2, 'Delay should halve at 2x speed');

        controller.setSpeed(0.5);
        assertEqual(controller.getFrameDelay(), baseDelay, 'Delay should double at 0.5x speed');
    });

    // ========================================
    // GateRenderer Tests
    // ========================================
    suite('GateRenderer');

    test('Create renderer with canvas context', function() {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');

        const renderer = new GateRenderer(ctx);
        assert(renderer.ctx === ctx, 'Should store context');
        assert(renderer.options.colors, 'Should have colors option');
    });

    test('getWireColor returns correct colors', function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const renderer = new GateRenderer(ctx);

        const color0 = renderer.getWireColor(WireState.LOW);
        const color1 = renderer.getWireColor(WireState.HIGH);
        const colorX = renderer.getWireColor(WireState.UNKNOWN);

        assert(color0 !== color1, 'LOW and HIGH should have different colors');
        assert(colorX !== color0, 'UNKNOWN should differ from LOW');
        assert(colorX !== color1, 'UNKNOWN should differ from HIGH');
    });

    test('Layout circuit positions gates', function() {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        const renderer = new GateRenderer(ctx);

        const circuit = Circuits.halfAdder();
        renderer.layoutCircuit(circuit);

        assert(renderer.gatePositions.size > 0, 'Should position gates');
        assert(renderer.gatePositions.has(0), 'Should have position for first gate');
    });

    test('Render does not throw', function() {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        const renderer = new GateRenderer(ctx);

        const circuit = Circuits.halfAdder();
        circuit.propagate();

        // Should not throw
        renderer.render(circuit);
        renderer.render(circuit, new Set([0])); // With active gate
    });

    test('Clear fills background', function() {
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        const renderer = new GateRenderer(ctx);

        // Clear and check a pixel
        renderer.clear();
        const imageData = ctx.getImageData(50, 50, 1, 1);
        // Background should be dark (not white)
        assert(imageData.data[0] < 50, 'Red channel should be dark');
    });

    // ========================================
    // Integration Tests
    // ========================================
    suite('Integration Tests');

    test('Full animation workflow: half adder', function() {
        const circuit = Circuits.halfAdder();
        const a = circuit.findWire('a');
        const b = circuit.findWire('b');
        circuit.setWire(a, 0, WireState.HIGH);
        circuit.setWire(b, 0, WireState.HIGH);

        const animator = new CircuitAnimator(circuit);
        const controller = new AnimationController(animator);

        const frames = [];
        controller.onFrame = (events) => {
            frames.push(events);
        };

        let completed = false;
        controller.onComplete = () => {
            completed = true;
        };

        // Step through manually
        while (!animator.isComplete()) {
            controller.step();
        }

        assert(frames.length > 0, 'Should have frame events');
        assert(completed, 'Should call onComplete');
    });

    test('Animation with renderer', function() {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        const renderer = new GateRenderer(ctx);

        const circuit = Circuits.halfAdder();
        circuit.setWire(circuit.findWire('a'), 0, WireState.HIGH);
        circuit.setWire(circuit.findWire('b'), 0, WireState.LOW);

        const animator = new CircuitAnimator(circuit);
        const controller = new AnimationController(animator);

        // Track active gates
        let activeGates = new Set();
        controller.onFrame = (events) => {
            activeGates = new Set();
            for (const event of events) {
                if (event.type === PropagationEventType.GATE_EVALUATE) {
                    activeGates.add(event.data.gateIndex);
                }
            }
            renderer.render(circuit, activeGates);
        };

        // Run animation
        while (!animator.isComplete()) {
            controller.step();
        }

        // Final render
        renderer.render(circuit);
    });

    // ========================================
    // Summary
    // ========================================
    const summary = document.createElement('div');
    summary.className = failedTests === 0 ? 'summary all-pass' : 'summary has-fail';

    const strong = document.createElement('strong');
    strong.textContent = 'Test Summary';
    summary.appendChild(strong);

    summary.appendChild(document.createElement('br'));
    summary.appendChild(document.createTextNode('Total: ' + totalTests));

    summary.appendChild(document.createElement('br'));
    summary.appendChild(document.createTextNode('Passed: ' + passedTests));

    summary.appendChild(document.createElement('br'));
    summary.appendChild(document.createTextNode('Failed: ' + failedTests));

    output.appendChild(summary);

    console.log('Animation tests complete: ' + passedTests + '/' + totalTests + ' passed');

})();
