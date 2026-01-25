// src/builder/RelaySimulator.test.ts
// Unit tests for RelaySimulator

import { describe, it, expect, beforeEach } from 'vitest';
import { RelaySimulator } from './RelaySimulator';
import type { BuilderCircuit, SignalValue } from './types';

describe('RelaySimulator', () => {
  let simulator: RelaySimulator;

  beforeEach(() => {
    simulator = new RelaySimulator();
  });

  /**
   * Helper to create a simple NOT gate circuit using NC relay.
   * Input -> NC relay coil -> Output from contact
   */
  function createNOTCircuit(): BuilderCircuit {
    return {
      id: 'not-circuit',
      name: 'NOT Gate',
      era: 'relay',
      components: [
        { id: 'input1', definitionId: 'input', position: { x: 0, y: 0 }, rotation: 0 },
        { id: 'power1', definitionId: 'power', position: { x: 0, y: 100 }, rotation: 0 },
        { id: 'relay1', definitionId: 'relay_nc', position: { x: 100, y: 0 }, rotation: 0 },
        { id: 'ground1', definitionId: 'ground', position: { x: 100, y: 100 }, rotation: 0 },
        { id: 'output1', definitionId: 'output', position: { x: 200, y: 0 }, rotation: 0 },
      ],
      wires: [
        { id: 'w1', sourceComponent: 'input1', sourcePort: 'out', targetComponent: 'relay1', targetPort: 'coil_in', waypoints: [] },
        { id: 'w2', sourceComponent: 'relay1', sourcePort: 'coil_out', targetComponent: 'ground1', targetPort: 'in', waypoints: [] },
        { id: 'w3', sourceComponent: 'power1', sourcePort: 'out', targetComponent: 'relay1', targetPort: 'contact_in', waypoints: [] },
        { id: 'w4', sourceComponent: 'relay1', sourcePort: 'contact_out', targetComponent: 'output1', targetPort: 'in', waypoints: [] },
      ],
      inputs: [{ id: 'input1', name: 'A', direction: 'input', componentId: 'input1' }],
      outputs: [{ id: 'output1', name: 'Q', direction: 'output', componentId: 'output1' }],
    };
  }

  /**
   * Helper to create an AND gate circuit using two NO relays in series.
   */
  function createANDCircuit(): BuilderCircuit {
    return {
      id: 'and-circuit',
      name: 'AND Gate',
      era: 'relay',
      components: [
        { id: 'inputA', definitionId: 'input', position: { x: 0, y: 0 }, rotation: 0 },
        { id: 'inputB', definitionId: 'input', position: { x: 0, y: 100 }, rotation: 0 },
        { id: 'power1', definitionId: 'power', position: { x: 50, y: 0 }, rotation: 0 },
        { id: 'relay1', definitionId: 'relay_no', position: { x: 100, y: 0 }, rotation: 0 },
        { id: 'relay2', definitionId: 'relay_no', position: { x: 100, y: 100 }, rotation: 0 },
        { id: 'ground1', definitionId: 'ground', position: { x: 200, y: 100 }, rotation: 0 },
        { id: 'ground2', definitionId: 'ground', position: { x: 200, y: 200 }, rotation: 0 },
        { id: 'output1', definitionId: 'output', position: { x: 200, y: 0 }, rotation: 0 },
      ],
      wires: [
        // Input A to relay1 coil
        { id: 'w1', sourceComponent: 'inputA', sourcePort: 'out', targetComponent: 'relay1', targetPort: 'coil_in', waypoints: [] },
        { id: 'w2', sourceComponent: 'relay1', sourcePort: 'coil_out', targetComponent: 'ground1', targetPort: 'in', waypoints: [] },
        // Input B to relay2 coil
        { id: 'w3', sourceComponent: 'inputB', sourcePort: 'out', targetComponent: 'relay2', targetPort: 'coil_in', waypoints: [] },
        { id: 'w4', sourceComponent: 'relay2', sourcePort: 'coil_out', targetComponent: 'ground2', targetPort: 'in', waypoints: [] },
        // Series connection: power -> relay1 contacts -> relay2 contacts -> output
        { id: 'w5', sourceComponent: 'power1', sourcePort: 'out', targetComponent: 'relay1', targetPort: 'contact_in', waypoints: [] },
        { id: 'w6', sourceComponent: 'relay1', sourcePort: 'contact_out', targetComponent: 'relay2', targetPort: 'contact_in', waypoints: [] },
        { id: 'w7', sourceComponent: 'relay2', sourcePort: 'contact_out', targetComponent: 'output1', targetPort: 'in', waypoints: [] },
      ],
      inputs: [
        { id: 'inputA', name: 'A', direction: 'input', componentId: 'inputA' },
        { id: 'inputB', name: 'B', direction: 'input', componentId: 'inputB' },
      ],
      outputs: [{ id: 'output1', name: 'Q', direction: 'output', componentId: 'output1' }],
    };
  }

  describe('loadCircuit', () => {
    it('loads a circuit for simulation', () => {
      const circuit = createNOTCircuit();
      simulator.loadCircuit(circuit);

      // Should not throw, state should be initialized
      const state = simulator.getSimulationState();
      expect(state.cycle).toBe(0);
    });

    it('initializes component states', () => {
      const circuit = createNOTCircuit();
      simulator.loadCircuit(circuit);

      const relayState = simulator.getComponentState('relay1');
      expect(relayState).not.toBeUndefined();
      // NC relay starts with switch closed
      expect(relayState?.switchClosed).toBe(true);
    });
  });

  describe('setInput / getInput', () => {
    it('sets and gets input values', () => {
      const circuit = createNOTCircuit();
      simulator.loadCircuit(circuit);

      simulator.setInput('input1', 1);
      expect(simulator.getInput('input1')).toBe(1);

      simulator.setInput('input1', 0);
      expect(simulator.getInput('input1')).toBe(0);
    });

    it('toggles input value', () => {
      const circuit = createNOTCircuit();
      simulator.loadCircuit(circuit);

      expect(simulator.getInput('input1')).toBe(0);
      simulator.toggleInput('input1');
      expect(simulator.getInput('input1')).toBe(1);
      simulator.toggleInput('input1');
      expect(simulator.getInput('input1')).toBe(0);
    });
  });

  describe('step', () => {
    it('runs one simulation step', () => {
      const circuit = createNOTCircuit();
      simulator.loadCircuit(circuit);

      const result = simulator.step();
      expect(result.converged).toBe(true);
      expect(result.iterations).toBeGreaterThan(0);
    });

    it('returns error if no circuit loaded', () => {
      const result = simulator.step();
      expect(result.converged).toBe(false);
      expect(result.error).toBe('No circuit loaded');
    });
  });

  describe('NOT gate simulation', () => {
    beforeEach(() => {
      const circuit = createNOTCircuit();
      simulator.loadCircuit(circuit);
    });

    it('outputs HIGH when input is LOW', () => {
      simulator.setInput('input1', 0);
      simulator.step();

      // NC relay: when input is LOW (coil not energized), switch is CLOSED
      // So power flows through to output
      const output = simulator.getOutput('output1');
      expect(output).toBe(1);
    });

    it('outputs LOW when input is HIGH', () => {
      simulator.setInput('input1', 1);
      simulator.step();

      // NC relay: when input is HIGH (coil energized), switch is OPEN
      // So power is blocked, output is LOW
      const output = simulator.getOutput('output1');
      expect(output).toBe(0);
    });
  });

  describe('AND gate simulation', () => {
    beforeEach(() => {
      const circuit = createANDCircuit();
      simulator.loadCircuit(circuit);
    });

    it('outputs LOW when both inputs are LOW', () => {
      simulator.setInput('inputA', 0);
      simulator.setInput('inputB', 0);
      simulator.step();

      const output = simulator.getOutput('output1');
      expect(output).toBe(0);
    });

    it('outputs LOW when A=1, B=0', () => {
      simulator.setInput('inputA', 1);
      simulator.setInput('inputB', 0);
      simulator.step();

      const output = simulator.getOutput('output1');
      expect(output).toBe(0);
    });

    it('outputs LOW when A=0, B=1', () => {
      simulator.setInput('inputA', 0);
      simulator.setInput('inputB', 1);
      simulator.step();

      const output = simulator.getOutput('output1');
      expect(output).toBe(0);
    });

    it('outputs HIGH when both inputs are HIGH', () => {
      simulator.setInput('inputA', 1);
      simulator.setInput('inputB', 1);
      simulator.step();

      const output = simulator.getOutput('output1');
      expect(output).toBe(1);
    });
  });

  describe('runWithInputs', () => {
    it('runs simulation with given inputs and returns outputs', () => {
      const circuit = createNOTCircuit();
      simulator.loadCircuit(circuit);

      const inputs = new Map<string, SignalValue>([['input1', 0]]);
      const outputs = simulator.runWithInputs(inputs);

      expect(outputs.get('output1')).toBe(1);
    });
  });

  describe('verifyTruthTable', () => {
    it('verifies NOT gate truth table', () => {
      const circuit = createNOTCircuit();
      simulator.loadCircuit(circuit);

      const result = simulator.verifyTruthTable(
        ['input1'],
        ['output1'],
        [
          [0, 1], // IN=0 -> OUT=1
          [1, 0], // IN=1 -> OUT=0
        ]
      );

      expect(result.passed).toBe(true);
      expect(result.failedRows).toHaveLength(0);
    });

    it('verifies AND gate truth table', () => {
      const circuit = createANDCircuit();
      simulator.loadCircuit(circuit);

      const result = simulator.verifyTruthTable(
        ['inputA', 'inputB'],
        ['output1'],
        [
          [0, 0, 0],
          [0, 1, 0],
          [1, 0, 0],
          [1, 1, 1],
        ]
      );

      expect(result.passed).toBe(true);
      expect(result.failedRows).toHaveLength(0);
    });
  });

  describe('reset', () => {
    it('resets simulation to initial state', () => {
      const circuit = createNOTCircuit();
      simulator.loadCircuit(circuit);

      simulator.setInput('input1', 1);
      simulator.step();
      simulator.reset();

      expect(simulator.getInput('input1')).toBe(0);
    });
  });

  describe('getComponentState', () => {
    it('returns relay coil state', () => {
      const circuit = createNOTCircuit();
      simulator.loadCircuit(circuit);

      simulator.setInput('input1', 1);
      simulator.step();

      const state = simulator.getComponentState('relay1');
      expect(state?.coilEnergized).toBe(true);
    });

    it('returns undefined for non-existent component', () => {
      const circuit = createNOTCircuit();
      simulator.loadCircuit(circuit);

      const state = simulator.getComponentState('non-existent');
      expect(state).toBeUndefined();
    });
  });
});
