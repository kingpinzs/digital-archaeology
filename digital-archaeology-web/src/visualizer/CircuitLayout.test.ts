// src/visualizer/CircuitLayout.test.ts
// Unit tests for CircuitLayout (Story 6.3)

import { describe, it, expect, beforeEach } from 'vitest';
import { CircuitLayout, DEFAULT_LAYOUT_CONFIG } from './CircuitLayout';
import { CircuitModel } from './CircuitModel';
import type { CircuitData } from './types';

describe('CircuitLayout', () => {
  let layout: CircuitLayout;

  beforeEach(() => {
    layout = new CircuitLayout();
  });

  // Helper to create mock circuit data
  const createMockCircuitData = (gates: { id: number; type: string }[]): CircuitData => ({
    cycle: 0,
    stable: true,
    wires: [],
    gates: gates.map((g) => ({
      id: g.id,
      name: `${g.type}${g.id}`,
      type: g.type,
      inputs: [],
      outputs: [],
    })),
  });

  describe('calculate()', () => {
    it('should calculate positions for all gates', () => {
      const data = createMockCircuitData([
        { id: 0, type: 'AND' },
        { id: 1, type: 'OR' },
        { id: 2, type: 'NOT' },
      ]);
      const model = new CircuitModel(data);

      layout.calculate(model, 800, 600);

      expect(layout.positionCount).toBe(3);
      expect(layout.getPosition(0)).toBeDefined();
      expect(layout.getPosition(1)).toBeDefined();
      expect(layout.getPosition(2)).toBeDefined();
    });

    it('should position gates in different columns by type', () => {
      const data = createMockCircuitData([
        { id: 0, type: 'AND' },
        { id: 1, type: 'OR' },
      ]);
      const model = new CircuitModel(data);

      layout.calculate(model, 800, 600);

      const andPos = layout.getPosition(0);
      const orPos = layout.getPosition(1);

      // AND and OR should be in different columns (different X)
      expect(andPos?.x).not.toBe(orPos?.x);
    });

    it('should position multiple gates of same type in same column', () => {
      const data = createMockCircuitData([
        { id: 0, type: 'AND' },
        { id: 1, type: 'AND' },
        { id: 2, type: 'AND' },
      ]);
      const model = new CircuitModel(data);

      layout.calculate(model, 800, 600);

      const pos0 = layout.getPosition(0);
      const pos1 = layout.getPosition(1);
      const pos2 = layout.getPosition(2);

      // All AND gates should have same X
      expect(pos0?.x).toBe(pos1?.x);
      expect(pos1?.x).toBe(pos2?.x);

      // Different Y positions (stacked vertically)
      expect(pos0?.y).not.toBe(pos1?.y);
      expect(pos1?.y).not.toBe(pos2?.y);
    });

    it('should use padding from config', () => {
      const data = createMockCircuitData([{ id: 0, type: 'AND' }]);
      const model = new CircuitModel(data);

      layout.calculate(model, 800, 600);

      const pos = layout.getPosition(0);
      expect(pos?.x).toBe(DEFAULT_LAYOUT_CONFIG.padding);
      expect(pos?.y).toBe(DEFAULT_LAYOUT_CONFIG.padding);
    });

    it('should use gapY for vertical spacing', () => {
      const data = createMockCircuitData([
        { id: 0, type: 'AND' },
        { id: 1, type: 'AND' },
      ]);
      const model = new CircuitModel(data);

      layout.calculate(model, 800, 600);

      const pos0 = layout.getPosition(0);
      const pos1 = layout.getPosition(1);

      expect(pos1!.y - pos0!.y).toBe(DEFAULT_LAYOUT_CONFIG.gapY);
    });

    it('should use gapX for horizontal spacing between gate types', () => {
      const data = createMockCircuitData([
        { id: 0, type: 'AND' },
        { id: 1, type: 'OR' },
      ]);
      const model = new CircuitModel(data);

      layout.calculate(model, 800, 600);

      const andPos = layout.getPosition(0);
      const orPos = layout.getPosition(1);

      // OR comes after AND in column order
      expect(orPos!.x - andPos!.x).toBe(DEFAULT_LAYOUT_CONFIG.gapX);
    });

    it('should wrap to next column when exceeding canvas height', () => {
      // Create many AND gates to force wrapping
      const gates = Array.from({ length: 20 }, (_, i) => ({ id: i, type: 'AND' }));
      const data = createMockCircuitData(gates);
      const model = new CircuitModel(data);

      // Use small canvas height to force wrapping
      layout.calculate(model, 800, 200);

      const positions = layout.getAllPositions();

      // Find gates with different X values (indicating multiple columns)
      const xValues = new Set([...positions.values()].map((p) => p.x));
      expect(xValues.size).toBeGreaterThan(1);
    });

    it('should clear previous positions on recalculate', () => {
      const data1 = createMockCircuitData([{ id: 0, type: 'AND' }]);
      const data2 = createMockCircuitData([{ id: 1, type: 'OR' }]);

      layout.calculate(new CircuitModel(data1), 800, 600);
      expect(layout.getPosition(0)).toBeDefined();

      layout.calculate(new CircuitModel(data2), 800, 600);
      expect(layout.getPosition(0)).toBeUndefined();
      expect(layout.getPosition(1)).toBeDefined();
    });

    it('should handle empty circuit', () => {
      const data = createMockCircuitData([]);
      const model = new CircuitModel(data);

      layout.calculate(model, 800, 600);

      expect(layout.positionCount).toBe(0);
    });

    it('should handle all gate types', () => {
      const data = createMockCircuitData([
        { id: 0, type: 'AND' },
        { id: 1, type: 'OR' },
        { id: 2, type: 'NOT' },
        { id: 3, type: 'BUF' },
        { id: 4, type: 'DFF' },
        { id: 5, type: 'XOR' },
      ]);
      const model = new CircuitModel(data);

      layout.calculate(model, 800, 600);

      expect(layout.positionCount).toBe(6);
      for (let i = 0; i < 6; i++) {
        expect(layout.getPosition(i)).toBeDefined();
      }
    });
  });

  describe('getPosition()', () => {
    it('should return undefined for unknown gate ID', () => {
      expect(layout.getPosition(999)).toBeUndefined();
    });

    it('should return position with x and y', () => {
      const data = createMockCircuitData([{ id: 0, type: 'AND' }]);
      const model = new CircuitModel(data);

      layout.calculate(model, 800, 600);

      const pos = layout.getPosition(0);
      expect(pos).toHaveProperty('x');
      expect(pos).toHaveProperty('y');
      expect(typeof pos?.x).toBe('number');
      expect(typeof pos?.y).toBe('number');
    });
  });

  describe('getAllPositions()', () => {
    it('should return a Map of all positions', () => {
      const data = createMockCircuitData([
        { id: 0, type: 'AND' },
        { id: 1, type: 'OR' },
      ]);
      const model = new CircuitModel(data);

      layout.calculate(model, 800, 600);

      const positions = layout.getAllPositions();
      expect(positions).toBeInstanceOf(Map);
      expect(positions.size).toBe(2);
    });

    it('should return a copy, not the original', () => {
      const data = createMockCircuitData([{ id: 0, type: 'AND' }]);
      const model = new CircuitModel(data);

      layout.calculate(model, 800, 600);

      const positions1 = layout.getAllPositions();
      const positions2 = layout.getAllPositions();

      expect(positions1).not.toBe(positions2);
    });
  });

  describe('positionCount', () => {
    it('should return 0 before calculation', () => {
      expect(layout.positionCount).toBe(0);
    });

    it('should return correct count after calculation', () => {
      const data = createMockCircuitData([
        { id: 0, type: 'AND' },
        { id: 1, type: 'OR' },
        { id: 2, type: 'NOT' },
      ]);
      const model = new CircuitModel(data);

      layout.calculate(model, 800, 600);

      expect(layout.positionCount).toBe(3);
    });
  });

  describe('getConfig()', () => {
    it('should return current configuration', () => {
      const config = layout.getConfig();

      expect(config.gateWidth).toBe(DEFAULT_LAYOUT_CONFIG.gateWidth);
      expect(config.gateHeight).toBe(DEFAULT_LAYOUT_CONFIG.gateHeight);
      expect(config.padding).toBe(DEFAULT_LAYOUT_CONFIG.padding);
      expect(config.gapX).toBe(DEFAULT_LAYOUT_CONFIG.gapX);
      expect(config.gapY).toBe(DEFAULT_LAYOUT_CONFIG.gapY);
    });

    it('should return a copy', () => {
      const config1 = layout.getConfig();
      const config2 = layout.getConfig();

      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });

  describe('updateConfig()', () => {
    it('should update configuration partially', () => {
      layout.updateConfig({ padding: 40, gapX: 100 });

      const config = layout.getConfig();
      expect(config.padding).toBe(40);
      expect(config.gapX).toBe(100);
      // Other values should remain default
      expect(config.gapY).toBe(DEFAULT_LAYOUT_CONFIG.gapY);
    });
  });

  describe('clear()', () => {
    it('should clear all positions', () => {
      const data = createMockCircuitData([{ id: 0, type: 'AND' }]);
      const model = new CircuitModel(data);

      layout.calculate(model, 800, 600);
      expect(layout.positionCount).toBe(1);

      layout.clear();
      expect(layout.positionCount).toBe(0);
    });
  });

  describe('constructor with custom config', () => {
    it('should accept custom configuration', () => {
      const customLayout = new CircuitLayout({
        padding: 30,
        gapX: 100,
        gapY: 60,
      });

      const config = customLayout.getConfig();
      expect(config.padding).toBe(30);
      expect(config.gapX).toBe(100);
      expect(config.gapY).toBe(60);
    });
  });
});
