// src/visualizer/CircuitModel.test.ts
// Unit tests for CircuitModel (Story 6.2)

import { describe, it, expect, beforeEach } from 'vitest';
import { CircuitModel } from './CircuitModel';
import type { CircuitData } from './types';

describe('CircuitModel', () => {
  let model: CircuitModel;
  let testData: CircuitData;

  beforeEach(() => {
    testData = {
      cycle: 5,
      stable: true,
      wires: [
        {
          id: 0,
          name: 'gnd',
          width: 1,
          is_input: false,
          is_output: false,
          state: [0],
        },
        {
          id: 1,
          name: 'vdd',
          width: 1,
          is_input: false,
          is_output: false,
          state: [1],
        },
        {
          id: 2,
          name: 'pc',
          width: 8,
          is_input: false,
          is_output: false,
          state: [0, 0, 0, 0, 0, 0, 0, 0],
        },
        {
          id: 3,
          name: 'acc',
          width: 4,
          is_input: false,
          is_output: false,
          state: [1, 0, 1, 0],
        },
        {
          id: 4,
          name: 'z_flag',
          width: 1,
          is_input: false,
          is_output: false,
          state: [0],
        },
      ],
      gates: [
        {
          id: 0,
          name: 'AND1',
          type: 'AND',
          inputs: [
            { wire: 0, bit: 0 },
            { wire: 1, bit: 0 },
          ],
          outputs: [{ wire: 2, bit: 0 }],
        },
        {
          id: 1,
          name: 'AND2',
          type: 'AND',
          inputs: [
            { wire: 1, bit: 0 },
            { wire: 2, bit: 0 },
          ],
          outputs: [{ wire: 3, bit: 0 }],
        },
        {
          id: 2,
          name: 'OR1',
          type: 'OR',
          inputs: [
            { wire: 0, bit: 0 },
            { wire: 1, bit: 0 },
          ],
          outputs: [{ wire: 4, bit: 0 }],
        },
        {
          id: 3,
          name: 'NOT1',
          type: 'NOT',
          inputs: [{ wire: 0, bit: 0 }],
          outputs: [{ wire: 1, bit: 0 }],
        },
        {
          id: 4,
          name: 'DFF1',
          type: 'DFF',
          inputs: [
            { wire: 3, bit: 0 },
            { wire: 0, bit: 0 },
          ],
          outputs: [{ wire: 2, bit: 0 }],
          stored: 1,
        },
        {
          id: 5,
          name: 'DFF2',
          type: 'DFF',
          inputs: [
            { wire: 2, bit: 0 },
            { wire: 0, bit: 0 },
          ],
          outputs: [{ wire: 3, bit: 0 }],
          stored: 0,
        },
      ],
    };

    model = new CircuitModel(testData);
  });

  describe('constructor', () => {
    it('should store original data reference', () => {
      expect(model.data).toBe(testData);
    });
  });

  describe('gates Map', () => {
    it('should contain all gates from data', () => {
      expect(model.gates.size).toBe(6);
    });

    it('should map gate IDs correctly', () => {
      expect(model.gates.has(0)).toBe(true);
      expect(model.gates.has(1)).toBe(true);
      expect(model.gates.has(5)).toBe(true);
      expect(model.gates.has(99)).toBe(false);
    });
  });

  describe('wires Map', () => {
    it('should contain all wires from data', () => {
      expect(model.wires.size).toBe(5);
    });

    it('should map wire IDs correctly', () => {
      expect(model.wires.has(0)).toBe(true);
      expect(model.wires.has(4)).toBe(true);
      expect(model.wires.has(99)).toBe(false);
    });
  });

  describe('wiresByName Map', () => {
    it('should contain all wires by name', () => {
      expect(model.wiresByName.size).toBe(5);
    });

    it('should map wire names correctly', () => {
      expect(model.wiresByName.has('gnd')).toBe(true);
      expect(model.wiresByName.has('vdd')).toBe(true);
      expect(model.wiresByName.has('pc')).toBe(true);
      expect(model.wiresByName.has('acc')).toBe(true);
      expect(model.wiresByName.has('z_flag')).toBe(true);
      expect(model.wiresByName.has('nonexistent')).toBe(false);
    });
  });

  describe('getGate()', () => {
    it('should return correct gate by id', () => {
      const gate = model.getGate(0);
      expect(gate).toBeDefined();
      expect(gate?.name).toBe('AND1');
      expect(gate?.type).toBe('AND');
    });

    it('should return gate with stored value for DFF', () => {
      const gate = model.getGate(4);
      expect(gate).toBeDefined();
      expect(gate?.type).toBe('DFF');
      expect(gate?.stored).toBe(1);
    });

    it('should return undefined for non-existent gate', () => {
      expect(model.getGate(99)).toBeUndefined();
    });
  });

  describe('getWire()', () => {
    it('should return correct wire by id', () => {
      const wire = model.getWire(2);
      expect(wire).toBeDefined();
      expect(wire?.name).toBe('pc');
      expect(wire?.width).toBe(8);
    });

    it('should return undefined for non-existent wire', () => {
      expect(model.getWire(99)).toBeUndefined();
    });
  });

  describe('getWireByName()', () => {
    it('should return correct wire by name', () => {
      const wire = model.getWireByName('acc');
      expect(wire).toBeDefined();
      expect(wire?.id).toBe(3);
      expect(wire?.width).toBe(4);
      expect(wire?.state).toEqual([1, 0, 1, 0]);
    });

    it('should return wire with input/output flags', () => {
      const gnd = model.getWireByName('gnd');
      expect(gnd?.is_input).toBe(false);
      expect(gnd?.is_output).toBe(false);
    });

    it('should return undefined for non-existent wire name', () => {
      expect(model.getWireByName('nonexistent')).toBeUndefined();
    });
  });

  describe('getGatesByType()', () => {
    it('should return filtered array of AND gates', () => {
      const andGates = model.getGatesByType('AND');
      expect(andGates).toHaveLength(2);
      expect(andGates.every((g) => g.type === 'AND')).toBe(true);
    });

    it('should return filtered array of OR gates', () => {
      const orGates = model.getGatesByType('OR');
      expect(orGates).toHaveLength(1);
      expect(orGates[0].name).toBe('OR1');
    });

    it('should return filtered array of DFF gates', () => {
      const dffGates = model.getGatesByType('DFF');
      expect(dffGates).toHaveLength(2);
      expect(dffGates.every((g) => g.type === 'DFF')).toBe(true);
    });

    it('should return empty array for non-existent gate type', () => {
      const xorGates = model.getGatesByType('XOR');
      expect(xorGates).toHaveLength(0);
    });

    it('should return single gate for type with one instance', () => {
      const notGates = model.getGatesByType('NOT');
      expect(notGates).toHaveLength(1);
      expect(notGates[0].name).toBe('NOT1');
    });
  });

  describe('gateCount', () => {
    it('should return total number of gates', () => {
      expect(model.gateCount).toBe(6);
    });
  });

  describe('wireCount', () => {
    it('should return total number of wires', () => {
      expect(model.wireCount).toBe(5);
    });
  });

  describe('cycle', () => {
    it('should return current simulation cycle', () => {
      expect(model.cycle).toBe(5);
    });
  });

  describe('isStable', () => {
    it('should return circuit stability status', () => {
      expect(model.isStable).toBe(true);
    });

    it('should reflect unstable circuit', () => {
      const unstableData: CircuitData = {
        cycle: 0,
        stable: false,
        wires: [],
        gates: [],
      };
      const unstableModel = new CircuitModel(unstableData);
      expect(unstableModel.isStable).toBe(false);
    });
  });

  describe('empty circuit', () => {
    it('should handle empty circuit data', () => {
      const emptyData: CircuitData = {
        cycle: 0,
        stable: true,
        wires: [],
        gates: [],
      };
      const emptyModel = new CircuitModel(emptyData);

      expect(emptyModel.gateCount).toBe(0);
      expect(emptyModel.wireCount).toBe(0);
      expect(emptyModel.getGatesByType('AND')).toHaveLength(0);
    });
  });
});
