// src/visualizer/WireRenderer.test.ts
// Unit tests for WireRenderer (Story 6.4)

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WireRenderer, DEFAULT_WIRE_CONFIG } from './WireRenderer';

describe('WireRenderer', () => {
  let renderer: WireRenderer;
  let mockCtx: {
    strokeStyle: string;
    lineWidth: number;
    lineCap: CanvasLineCap;
    beginPath: ReturnType<typeof vi.fn>;
    moveTo: ReturnType<typeof vi.fn>;
    lineTo: ReturnType<typeof vi.fn>;
    stroke: ReturnType<typeof vi.fn>;
  };
  let strokeStyleHistory: string[];

  beforeEach(() => {
    renderer = new WireRenderer();
    strokeStyleHistory = [];

    mockCtx = {
      strokeStyle: '',
      lineWidth: 0,
      lineCap: 'butt',
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
    };

    // Track strokeStyle assignments
    Object.defineProperty(mockCtx, 'strokeStyle', {
      get: () => strokeStyleHistory[strokeStyleHistory.length - 1] || '',
      set: (value: string) => strokeStyleHistory.push(value),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('DEFAULT_WIRE_CONFIG', () => {
    it('should have correct default single bit width', () => {
      expect(DEFAULT_WIRE_CONFIG.singleBitWidth).toBe(1);
    });

    it('should have correct default multi bit width', () => {
      expect(DEFAULT_WIRE_CONFIG.multiBitWidth).toBe(2);
    });

    it('should have round line cap by default', () => {
      expect(DEFAULT_WIRE_CONFIG.lineCap).toBe('round');
    });
  });

  describe('constructor', () => {
    it('should create renderer with default config', () => {
      const config = renderer.getConfig();
      expect(config.singleBitWidth).toBe(1);
      expect(config.multiBitWidth).toBe(2);
      expect(config.lineCap).toBe('round');
    });

    it('should accept custom config', () => {
      const customRenderer = new WireRenderer({
        singleBitWidth: 2,
        multiBitWidth: 4,
      });
      const config = customRenderer.getConfig();
      expect(config.singleBitWidth).toBe(2);
      expect(config.multiBitWidth).toBe(4);
    });
  });

  describe('renderWire()', () => {
    it('should draw line with correct color for signal=1 (high - bright green)', () => {
      renderer.renderWire(
        mockCtx as unknown as CanvasRenderingContext2D,
        1,
        10,
        20,
        100,
        80
      );

      expect(strokeStyleHistory[0]).toBe('#00ff88');
      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.moveTo).toHaveBeenCalledWith(10, 20);
      expect(mockCtx.lineTo).toHaveBeenCalledWith(100, 80);
      expect(mockCtx.stroke).toHaveBeenCalled();
    });

    it('should draw line with correct color for signal=0 (low - dim gray)', () => {
      renderer.renderWire(
        mockCtx as unknown as CanvasRenderingContext2D,
        0,
        0,
        0,
        50,
        50
      );

      expect(strokeStyleHistory[0]).toBe('#3a3a3a');
    });

    it('should draw line with correct color for signal=2 (unknown - orange)', () => {
      renderer.renderWire(
        mockCtx as unknown as CanvasRenderingContext2D,
        2,
        0,
        0,
        50,
        50
      );

      expect(strokeStyleHistory[0]).toBe('#ffaa00');
    });

    it('should use single bit width by default', () => {
      renderer.renderWire(
        mockCtx as unknown as CanvasRenderingContext2D,
        1,
        0,
        0,
        50,
        50,
        false
      );

      expect(mockCtx.lineWidth).toBe(1);
    });

    it('should use multi bit width when isMultiBit is true', () => {
      renderer.renderWire(
        mockCtx as unknown as CanvasRenderingContext2D,
        1,
        0,
        0,
        50,
        50,
        true
      );

      expect(mockCtx.lineWidth).toBe(2);
    });

    it('should set line cap to configured value', () => {
      renderer.renderWire(
        mockCtx as unknown as CanvasRenderingContext2D,
        1,
        0,
        0,
        50,
        50
      );

      expect(mockCtx.lineCap).toBe('round');
    });
  });

  describe('getConfig()', () => {
    it('should return a copy of the config', () => {
      const config = renderer.getConfig();
      config.singleBitWidth = 999;
      expect(renderer.getConfig().singleBitWidth).toBe(1);
    });
  });

  describe('updateConfig()', () => {
    it('should update config partially', () => {
      renderer.updateConfig({ singleBitWidth: 3 });
      const config = renderer.getConfig();
      expect(config.singleBitWidth).toBe(3);
      expect(config.multiBitWidth).toBe(2); // Unchanged
    });
  });
});
