// src/visualizer/GateRenderer.test.ts
// Unit tests for GateRenderer (Story 6.3)

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GateRenderer, DEFAULT_GATE_CONFIG } from './GateRenderer';
import type { CircuitGate } from './types';

describe('GateRenderer', () => {
  let renderer: GateRenderer;
  let mockCtx: CanvasRenderingContext2D;
  let fillStyleHistory: string[];

  // Create mock canvas context that tracks fillStyle changes
  const createMockContext = () => {
    fillStyleHistory = [];
    const ctx = {
      fillRect: vi.fn(),
      strokeStyle: '',
      lineWidth: 0,
      beginPath: vi.fn(),
      roundRect: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillText: vi.fn(),
      font: '',
      textAlign: '' as CanvasTextAlign,
      textBaseline: '' as CanvasTextBaseline,
    };

    // Track fillStyle assignments
    let _fillStyle = '';
    Object.defineProperty(ctx, 'fillStyle', {
      get: () => _fillStyle,
      set: (value: string) => {
        _fillStyle = value;
        fillStyleHistory.push(value);
      },
    });

    return ctx as unknown as CanvasRenderingContext2D;
  };

  // Mock getComputedStyle for CSS variable lookup
  beforeEach(() => {
    renderer = new GateRenderer();
    mockCtx = createMockContext();

    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (prop: string) => {
        const colors: Record<string, string> = {
          '--da-gate-and': '#4ecdc4',
          '--da-gate-or': '#ff6b6b',
          '--da-gate-xor': '#c44dff',
          '--da-gate-not': '#ffd93d',
          '--da-gate-buf': '#888888',
          '--da-gate-dff': '#4d96ff',
        };
        return colors[prop] || '';
      },
    } as CSSStyleDeclaration);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('renderGate()', () => {
    it('should draw rounded rectangle with correct fill color for AND gate', () => {
      const gate: CircuitGate = {
        id: 0,
        name: 'AND1',
        type: 'AND',
        inputs: [],
        outputs: [],
      };

      renderer.renderGate(mockCtx, gate, 10, 20, 60, 40);

      // First fillStyle is the gate color, second is text color
      expect(fillStyleHistory[0]).toBe('#4ecdc4');
      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.roundRect).toHaveBeenCalledWith(10, 20, 60, 40, 4);
      expect(mockCtx.fill).toHaveBeenCalled();
    });

    it('should draw rounded rectangle with correct fill color for OR gate', () => {
      const gate: CircuitGate = {
        id: 1,
        name: 'OR1',
        type: 'OR',
        inputs: [],
        outputs: [],
      };

      renderer.renderGate(mockCtx, gate, 0, 0, 60, 40);

      expect(fillStyleHistory[0]).toBe('#ff6b6b');
    });

    it('should draw rounded rectangle with correct fill color for XOR gate', () => {
      const gate: CircuitGate = {
        id: 2,
        name: 'XOR1',
        type: 'XOR',
        inputs: [],
        outputs: [],
      };

      renderer.renderGate(mockCtx, gate, 0, 0, 60, 40);

      expect(fillStyleHistory[0]).toBe('#c44dff');
    });

    it('should draw rounded rectangle with correct fill color for NOT gate', () => {
      const gate: CircuitGate = {
        id: 3,
        name: 'NOT1',
        type: 'NOT',
        inputs: [],
        outputs: [],
      };

      renderer.renderGate(mockCtx, gate, 0, 0, 60, 40);

      expect(fillStyleHistory[0]).toBe('#ffd93d');
    });

    it('should draw rounded rectangle with correct fill color for BUF gate', () => {
      const gate: CircuitGate = {
        id: 4,
        name: 'BUF1',
        type: 'BUF',
        inputs: [],
        outputs: [],
      };

      renderer.renderGate(mockCtx, gate, 0, 0, 60, 40);

      expect(fillStyleHistory[0]).toBe('#888888');
    });

    it('should draw rounded rectangle with correct fill color for DFF gate', () => {
      const gate: CircuitGate = {
        id: 5,
        name: 'DFF1',
        type: 'DFF',
        inputs: [],
        outputs: [],
        stored: 1,
      };

      renderer.renderGate(mockCtx, gate, 0, 0, 60, 40);

      expect(fillStyleHistory[0]).toBe('#4d96ff');
    });

    it('should draw gate type label centered in gate', () => {
      const gate: CircuitGate = {
        id: 0,
        name: 'AND1',
        type: 'AND',
        inputs: [],
        outputs: [],
      };

      renderer.renderGate(mockCtx, gate, 10, 20, 60, 40);

      // After drawing the fill, the fillStyle is changed to white for text
      expect(fillStyleHistory[1]).toBe('#ffffff');
      expect(mockCtx.textAlign).toBe('center');
      expect(mockCtx.textBaseline).toBe('middle');
      expect(mockCtx.fillText).toHaveBeenCalledWith('AND', 40, 40); // 10 + 60/2, 20 + 40/2
    });

    it('should draw border with correct stroke style', () => {
      const gate: CircuitGate = {
        id: 0,
        name: 'AND1',
        type: 'AND',
        inputs: [],
        outputs: [],
      };

      renderer.renderGate(mockCtx, gate, 0, 0, 60, 40);

      expect(mockCtx.strokeStyle).toBe('#ffffff');
      expect(mockCtx.lineWidth).toBe(1);
      expect(mockCtx.stroke).toHaveBeenCalled();
    });

    it('should use default dimensions from config when not specified', () => {
      const gate: CircuitGate = {
        id: 0,
        name: 'AND1',
        type: 'AND',
        inputs: [],
        outputs: [],
      };

      renderer.renderGate(mockCtx, gate, 10, 20);

      expect(mockCtx.roundRect).toHaveBeenCalledWith(
        10,
        20,
        DEFAULT_GATE_CONFIG.width,
        DEFAULT_GATE_CONFIG.height,
        DEFAULT_GATE_CONFIG.cornerRadius
      );
    });
  });

  describe('getConfig()', () => {
    it('should return current configuration', () => {
      const config = renderer.getConfig();

      expect(config.width).toBe(DEFAULT_GATE_CONFIG.width);
      expect(config.height).toBe(DEFAULT_GATE_CONFIG.height);
      expect(config.cornerRadius).toBe(DEFAULT_GATE_CONFIG.cornerRadius);
    });

    it('should return a copy, not the original', () => {
      const config1 = renderer.getConfig();
      const config2 = renderer.getConfig();

      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });

  describe('updateConfig()', () => {
    it('should update configuration partially', () => {
      renderer.updateConfig({ width: 100, height: 60 });

      const config = renderer.getConfig();
      expect(config.width).toBe(100);
      expect(config.height).toBe(60);
      // Other values should remain default
      expect(config.cornerRadius).toBe(DEFAULT_GATE_CONFIG.cornerRadius);
    });
  });

  describe('constructor with custom config', () => {
    it('should accept custom configuration', () => {
      const customRenderer = new GateRenderer({
        width: 80,
        height: 50,
        cornerRadius: 8,
      });

      const config = customRenderer.getConfig();
      expect(config.width).toBe(80);
      expect(config.height).toBe(50);
      expect(config.cornerRadius).toBe(8);
    });
  });
});
