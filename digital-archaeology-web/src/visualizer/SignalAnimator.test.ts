// src/visualizer/SignalAnimator.test.ts
// Unit tests for SignalAnimator (Story 6.5)

import { describe, it, expect, beforeEach } from 'vitest';
import { SignalAnimator } from './SignalAnimator';
import { CircuitModel } from './CircuitModel';
import type { CircuitData } from './types';

describe('SignalAnimator', () => {
  let animator: SignalAnimator;

  beforeEach(() => {
    animator = new SignalAnimator();
  });

  // Helper to create mock circuit data
  const createMockCircuitData = (
    wires: Array<{ id: number; name: string; width: number; state: number[] }>
  ): CircuitData => ({
    cycle: 0,
    stable: true,
    wires: wires.map((w) => ({
      id: w.id,
      name: w.name,
      width: w.width,
      is_input: false,
      is_output: false,
      state: w.state,
    })),
    gates: [],
  });

  describe('captureState()', () => {
    it('should snapshot current wire states', () => {
      const data = createMockCircuitData([
        { id: 0, name: 'wire0', width: 1, state: [1] },
        { id: 1, name: 'wire1', width: 4, state: [0, 1, 0, 1] },
      ]);
      const model = new CircuitModel(data);

      animator.captureState(model);

      // Verify state was captured (interpolate at 0 should return start state)
      animator.setTargetState(model);
      const result = animator.interpolate(0);

      expect(result.get(0)).toEqual([1]);
      expect(result.get(1)).toEqual([0, 1, 0, 1]);
    });

    it('should create a deep copy of wire states', () => {
      const data = createMockCircuitData([{ id: 0, name: 'wire0', width: 1, state: [1] }]);
      const model = new CircuitModel(data);

      animator.captureState(model);

      // Modify original data
      model.wires.get(0)!.state[0] = 0;

      // Set target and check that captured state is unchanged
      animator.setTargetState(model);
      const result = animator.interpolate(0);
      expect(result.get(0)).toEqual([1]); // Should be original captured value
    });
  });

  describe('setTargetState()', () => {
    it('should set target wire states', () => {
      const startData = createMockCircuitData([{ id: 0, name: 'wire0', width: 1, state: [0] }]);
      const endData = createMockCircuitData([{ id: 0, name: 'wire0', width: 1, state: [1] }]);

      animator.captureState(new CircuitModel(startData));
      animator.setTargetState(new CircuitModel(endData));

      // At progress 1.0, should return end state
      const result = animator.interpolate(1.0);
      expect(result.get(0)).toEqual([1]);
    });

    it('should create a deep copy of target states', () => {
      const startData = createMockCircuitData([{ id: 0, name: 'wire0', width: 1, state: [0] }]);
      const endData = createMockCircuitData([{ id: 0, name: 'wire0', width: 1, state: [1] }]);
      const endModel = new CircuitModel(endData);

      animator.captureState(new CircuitModel(startData));
      animator.setTargetState(endModel);

      // Modify target model
      endModel.wires.get(0)!.state[0] = 0;

      // Target state should be unchanged
      const result = animator.interpolate(1.0);
      expect(result.get(0)).toEqual([1]); // Should be original target value
    });
  });

  describe('interpolate()', () => {
    it('should return start state at progress 0', () => {
      const startData = createMockCircuitData([{ id: 0, name: 'wire0', width: 1, state: [0] }]);
      const endData = createMockCircuitData([{ id: 0, name: 'wire0', width: 1, state: [1] }]);

      animator.captureState(new CircuitModel(startData));
      animator.setTargetState(new CircuitModel(endData));

      const result = animator.interpolate(0);
      expect(result.get(0)).toEqual([0]);
    });

    it('should return end state at progress 1', () => {
      const startData = createMockCircuitData([{ id: 0, name: 'wire0', width: 1, state: [0] }]);
      const endData = createMockCircuitData([{ id: 0, name: 'wire0', width: 1, state: [1] }]);

      animator.captureState(new CircuitModel(startData));
      animator.setTargetState(new CircuitModel(endData));

      const result = animator.interpolate(1.0);
      expect(result.get(0)).toEqual([1]);
    });

    it('should transition at midpoint (0.5) for step interpolation', () => {
      const startData = createMockCircuitData([{ id: 0, name: 'wire0', width: 1, state: [0] }]);
      const endData = createMockCircuitData([{ id: 0, name: 'wire0', width: 1, state: [1] }]);

      animator.captureState(new CircuitModel(startData));
      animator.setTargetState(new CircuitModel(endData));

      // Before midpoint - should be start state
      expect(animator.interpolate(0.4).get(0)).toEqual([0]);
      // After midpoint - should be end state
      expect(animator.interpolate(0.6).get(0)).toEqual([1]);
    });

    it('should handle multi-bit wires correctly', () => {
      const startData = createMockCircuitData([
        { id: 0, name: 'wire0', width: 4, state: [0, 0, 0, 0] },
      ]);
      const endData = createMockCircuitData([{ id: 0, name: 'wire0', width: 4, state: [1, 1, 1, 1] }]);

      animator.captureState(new CircuitModel(startData));
      animator.setTargetState(new CircuitModel(endData));

      expect(animator.interpolate(0.4).get(0)).toEqual([0, 0, 0, 0]);
      expect(animator.interpolate(0.6).get(0)).toEqual([1, 1, 1, 1]);
    });

    it('should handle multiple wires', () => {
      const startData = createMockCircuitData([
        { id: 0, name: 'wire0', width: 1, state: [0] },
        { id: 1, name: 'wire1', width: 1, state: [1] },
        { id: 2, name: 'wire2', width: 1, state: [0] },
      ]);
      const endData = createMockCircuitData([
        { id: 0, name: 'wire0', width: 1, state: [1] },
        { id: 1, name: 'wire1', width: 1, state: [0] },
        { id: 2, name: 'wire2', width: 1, state: [1] },
      ]);

      animator.captureState(new CircuitModel(startData));
      animator.setTargetState(new CircuitModel(endData));

      const result = animator.interpolate(0.6);
      expect(result.get(0)).toEqual([1]);
      expect(result.get(1)).toEqual([0]);
      expect(result.get(2)).toEqual([1]);
    });

    it('should return empty map if no states captured', () => {
      const result = animator.interpolate(0.5);
      expect(result.size).toBe(0);
    });

    it('should handle unknown signal values (2)', () => {
      const startData = createMockCircuitData([{ id: 0, name: 'wire0', width: 1, state: [2] }]);
      const endData = createMockCircuitData([{ id: 0, name: 'wire0', width: 1, state: [1] }]);

      animator.captureState(new CircuitModel(startData));
      animator.setTargetState(new CircuitModel(endData));

      expect(animator.interpolate(0.4).get(0)).toEqual([2]);
      expect(animator.interpolate(0.6).get(0)).toEqual([1]);
    });
  });

  describe('getChangedGates()', () => {
    it('should return empty set when no states captured', () => {
      const result = animator.getChangedGates();
      expect(result.size).toBe(0);
    });

    it('should return gate IDs with changed outputs', () => {
      const startData: CircuitData = {
        cycle: 0,
        stable: true,
        wires: [
          { id: 0, name: 'wire0', width: 1, is_input: false, is_output: false, state: [0] },
          { id: 1, name: 'wire1', width: 1, is_input: false, is_output: false, state: [0] },
        ],
        gates: [
          { id: 0, name: 'AND0', type: 'AND', inputs: [], outputs: [{ wire: 0, bit: 0 }] },
          { id: 1, name: 'OR0', type: 'OR', inputs: [], outputs: [{ wire: 1, bit: 0 }] },
        ],
      };
      const endData: CircuitData = {
        cycle: 1,
        stable: true,
        wires: [
          { id: 0, name: 'wire0', width: 1, is_input: false, is_output: false, state: [1] }, // Changed
          { id: 1, name: 'wire1', width: 1, is_input: false, is_output: false, state: [0] }, // Unchanged
        ],
        gates: [
          { id: 0, name: 'AND0', type: 'AND', inputs: [], outputs: [{ wire: 0, bit: 0 }] },
          { id: 1, name: 'OR0', type: 'OR', inputs: [], outputs: [{ wire: 1, bit: 0 }] },
        ],
      };

      animator.captureState(new CircuitModel(startData));
      animator.setTargetState(new CircuitModel(endData));

      const changedGates = animator.getChangedGates();
      expect(changedGates.has(0)).toBe(true); // AND0 output changed
      expect(changedGates.has(1)).toBe(false); // OR0 output unchanged
    });
  });

  describe('hasChanges()', () => {
    it('should return false when no states captured', () => {
      expect(animator.hasChanges()).toBe(false);
    });

    it('should return true when wire states differ', () => {
      const startData = createMockCircuitData([{ id: 0, name: 'wire0', width: 1, state: [0] }]);
      const endData = createMockCircuitData([{ id: 0, name: 'wire0', width: 1, state: [1] }]);

      animator.captureState(new CircuitModel(startData));
      animator.setTargetState(new CircuitModel(endData));

      expect(animator.hasChanges()).toBe(true);
    });

    it('should return false when wire states are identical', () => {
      const data = createMockCircuitData([{ id: 0, name: 'wire0', width: 1, state: [1] }]);

      animator.captureState(new CircuitModel(data));
      animator.setTargetState(new CircuitModel(data));

      expect(animator.hasChanges()).toBe(false);
    });
  });

  describe('clear()', () => {
    it('should clear captured states', () => {
      const data = createMockCircuitData([{ id: 0, name: 'wire0', width: 1, state: [1] }]);
      animator.captureState(new CircuitModel(data));
      animator.setTargetState(new CircuitModel(data));

      animator.clear();

      expect(animator.interpolate(0.5).size).toBe(0);
      expect(animator.hasChanges()).toBe(false);
    });
  });
});
