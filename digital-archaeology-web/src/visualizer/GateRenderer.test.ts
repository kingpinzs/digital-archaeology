// src/visualizer/GateRenderer.test.ts
// Unit tests for GateRenderer (Story 6.3)

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GateRenderer, DEFAULT_GATE_CONFIG, DEFAULT_PULSE_SCALE } from './GateRenderer';
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

  describe('DEFAULT_PULSE_SCALE', () => {
    it('should be 1.1', () => {
      expect(DEFAULT_PULSE_SCALE).toBe(1.1);
    });
  });

  describe('pulse effect (Story 6.5)', () => {
    it('should render at normal size when pulseScale is 1.0', () => {
      const gate: CircuitGate = {
        id: 0,
        name: 'AND1',
        type: 'AND',
        inputs: [],
        outputs: [],
      };

      renderer.renderGate(mockCtx, gate, 10, 20, 60, 40, 1.0);

      // Should use exact dimensions (no scaling)
      expect(mockCtx.roundRect).toHaveBeenCalledWith(10, 20, 60, 40, 4);
    });

    it('should scale gate dimensions when pulseScale is 1.1', () => {
      const gate: CircuitGate = {
        id: 0,
        name: 'AND1',
        type: 'AND',
        inputs: [],
        outputs: [],
      };

      renderer.renderGate(mockCtx, gate, 10, 20, 60, 40, 1.1);

      // Scaled dimensions: 60 * 1.1 = 66, 40 * 1.1 = 44
      // Position adjusted to keep centered: x - (66-60)/2 = 7, y - (44-40)/2 = 18
      // Corner radius: round(4 * 1.1) = round(4.4) = 4 (rounded to avoid sub-pixel artifacts)
      expect(mockCtx.roundRect).toHaveBeenCalledWith(7, 18, 66, 44, 4);
    });

    it('should center scaled gate around original position', () => {
      const gate: CircuitGate = {
        id: 0,
        name: 'AND1',
        type: 'AND',
        inputs: [],
        outputs: [],
      };

      renderer.renderGate(mockCtx, gate, 100, 100, 60, 40, 1.2);

      // Scaled: 60 * 1.2 = 72, 40 * 1.2 = 48
      // Adjustment: x - (72-60)/2 = 94, y - (48-40)/2 = 96
      // Corner radius: round(4 * 1.2) = round(4.8) = 5 (rounded to avoid sub-pixel artifacts)
      expect(mockCtx.roundRect).toHaveBeenCalledWith(94, 96, 72, 48, 5);
    });

    it('should center text in scaled gate', () => {
      const gate: CircuitGate = {
        id: 0,
        name: 'AND1',
        type: 'AND',
        inputs: [],
        outputs: [],
      };

      renderer.renderGate(mockCtx, gate, 10, 20, 60, 40, 1.1);

      // Adjusted position: 7, 18, size: 66, 44
      // Text center: 7 + 66/2 = 40, 18 + 44/2 = 40
      expect(mockCtx.fillText).toHaveBeenCalledWith('AND', 40, 40);
    });

    it('should scale font size with pulse', () => {
      const gate: CircuitGate = {
        id: 0,
        name: 'AND1',
        type: 'AND',
        inputs: [],
        outputs: [],
      };

      renderer.renderGate(mockCtx, gate, 10, 20, 60, 40, 1.2);

      // Font size: 10 * 1.2 = 12
      expect(mockCtx.font).toBe('12px JetBrains Mono, monospace');
    });
  });

  describe('hover highlight (Story 6.8)', () => {
    // Need to track shadow and stroke properties for hover tests
    let shadowBlur: number;
    let shadowColor: string;
    let strokeStyleHistory: string[];
    let lineWidthHistory: number[];
    let saveCalled: boolean;
    let restoreCalled: boolean;

    const createHoverMockContext = () => {
      fillStyleHistory = [];
      strokeStyleHistory = [];
      lineWidthHistory = [];
      shadowBlur = 0;
      shadowColor = '';
      saveCalled = false;
      restoreCalled = false;

      const ctx = {
        fillRect: vi.fn(),
        beginPath: vi.fn(),
        roundRect: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        fillText: vi.fn(),
        font: '',
        textAlign: '' as CanvasTextAlign,
        textBaseline: '' as CanvasTextBaseline,
        save: vi.fn(() => { saveCalled = true; }),
        restore: vi.fn(() => { restoreCalled = true; }),
      };

      // Track fillStyle
      let _fillStyle = '';
      Object.defineProperty(ctx, 'fillStyle', {
        get: () => _fillStyle,
        set: (value: string) => {
          _fillStyle = value;
          fillStyleHistory.push(value);
        },
      });

      // Track strokeStyle
      let _strokeStyle = '';
      Object.defineProperty(ctx, 'strokeStyle', {
        get: () => _strokeStyle,
        set: (value: string) => {
          _strokeStyle = value;
          strokeStyleHistory.push(value);
        },
      });

      // Track lineWidth
      let _lineWidth = 0;
      Object.defineProperty(ctx, 'lineWidth', {
        get: () => _lineWidth,
        set: (value: number) => {
          _lineWidth = value;
          lineWidthHistory.push(value);
        },
      });

      // Track shadow properties
      Object.defineProperty(ctx, 'shadowBlur', {
        get: () => shadowBlur,
        set: (value: number) => { shadowBlur = value; },
      });

      Object.defineProperty(ctx, 'shadowColor', {
        get: () => shadowColor,
        set: (value: string) => { shadowColor = value; },
      });

      return ctx as unknown as CanvasRenderingContext2D;
    };

    beforeEach(() => {
      mockCtx = createHoverMockContext();
      // Mock CSS variable for accent color
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({
        getPropertyValue: (prop: string) => {
          const colors: Record<string, string> = {
            '--da-gate-and': '#4ecdc4',
            '--da-accent': '#00b4d8',
          };
          return colors[prop] || '';
        },
      } as CSSStyleDeclaration);
    });

    it('should render normally when isHovered is false', () => {
      const gate: CircuitGate = {
        id: 0,
        name: 'AND1',
        type: 'AND',
        inputs: [],
        outputs: [],
      };

      renderer.renderGate(mockCtx, gate, 10, 20, 60, 40, 1.0, false);

      // Should NOT call save/restore for glow effect
      expect(saveCalled).toBe(false);
      expect(restoreCalled).toBe(false);
      // Should use default border width (1)
      expect(lineWidthHistory).toContain(1);
    });

    it('should draw glow effect when isHovered is true', () => {
      const gate: CircuitGate = {
        id: 0,
        name: 'AND1',
        type: 'AND',
        inputs: [],
        outputs: [],
      };

      renderer.renderGate(mockCtx, gate, 10, 20, 60, 40, 1.0, true);

      // Should call save/restore for glow effect
      expect(saveCalled).toBe(true);
      expect(restoreCalled).toBe(true);
      // Shadow should be set for glow
      expect(shadowBlur).toBe(8);
    });

    it('should use accent color for hover border', () => {
      const gate: CircuitGate = {
        id: 0,
        name: 'AND1',
        type: 'AND',
        inputs: [],
        outputs: [],
      };

      renderer.renderGate(mockCtx, gate, 10, 20, 60, 40, 1.0, true);

      // Border should use accent color when hovered
      expect(strokeStyleHistory).toContain('#00b4d8');
    });

    it('should use thicker border when hovered', () => {
      const gate: CircuitGate = {
        id: 0,
        name: 'AND1',
        type: 'AND',
        inputs: [],
        outputs: [],
      };

      renderer.renderGate(mockCtx, gate, 10, 20, 60, 40, 1.0, true);

      // Should use lineWidth 2 for hover highlight
      expect(lineWidthHistory).toContain(2);
    });

    it('should work with both pulse and hover together', () => {
      const gate: CircuitGate = {
        id: 0,
        name: 'AND1',
        type: 'AND',
        inputs: [],
        outputs: [],
      };

      renderer.renderGate(mockCtx, gate, 10, 20, 60, 40, 1.1, true);

      // Should have both glow effect and scaled dimensions
      expect(saveCalled).toBe(true);
      // Scaled: 60 * 1.1 = 66, 40 * 1.1 = 44
      expect(mockCtx.roundRect).toHaveBeenCalledWith(7, 18, 66, 44, 4);
    });
  });

  // ============================================================================
  // Story 6.9: Code-to-Circuit Link Highlight Tests
  // ============================================================================
  describe('isLinkedHighlight rendering (Story 6.9)', () => {
    let mockCtx: CanvasRenderingContext2D;
    let renderer: GateRenderer;
    let saveCalled: boolean;
    let restoreCalled: boolean;
    let shadowBlur: number;
    let lineWidthHistory: number[];
    let strokeStyleHistory: string[];

    const createLinkMockContext = (): CanvasRenderingContext2D => {
      saveCalled = false;
      restoreCalled = false;
      shadowBlur = 0;
      lineWidthHistory = [];
      strokeStyleHistory = [];

      let _lineWidth = 1;

      const ctx = {
        fillStyle: '',
        beginPath: vi.fn(),
        roundRect: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        fillText: vi.fn(),
        save: vi.fn(() => { saveCalled = true; }),
        restore: vi.fn(() => { restoreCalled = true; }),
        font: '',
        textAlign: 'center',
        textBaseline: 'middle',
        shadowColor: '',
      };

      // Track strokeStyle
      Object.defineProperty(ctx, 'strokeStyle', {
        get: () => ctx.shadowColor,
        set: (value: string) => {
          strokeStyleHistory.push(value);
        },
      });

      // Track lineWidth
      Object.defineProperty(ctx, 'lineWidth', {
        get: () => _lineWidth,
        set: (value: number) => {
          _lineWidth = value;
          lineWidthHistory.push(value);
        },
      });

      // Track shadow properties
      Object.defineProperty(ctx, 'shadowBlur', {
        get: () => shadowBlur,
        set: (value: number) => { shadowBlur = value; },
      });

      return ctx as unknown as CanvasRenderingContext2D;
    };

    beforeEach(() => {
      mockCtx = createLinkMockContext();
      renderer = new GateRenderer();
      // Mock CSS variable for accent and link highlight colors
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({
        getPropertyValue: (prop: string) => {
          const colors: Record<string, string> = {
            '--da-gate-and': '#4ecdc4',
            '--da-accent': '#00b4d8',
            '--da-link-highlight': '#ff9f43',
          };
          return colors[prop] || '';
        },
      } as CSSStyleDeclaration);
    });

    it('should draw larger glow effect when isLinkedHighlight is true', () => {
      const gate: CircuitGate = {
        id: 0,
        name: 'AND1',
        type: 'AND',
        inputs: [],
        outputs: [],
      };

      renderer.renderGate(mockCtx, gate, 10, 20, 60, 40, 1.0, false, true);

      // Should call save/restore for glow effect
      expect(saveCalled).toBe(true);
      expect(restoreCalled).toBe(true);
      // Shadow should be set for glow - larger than hover (12 vs 8)
      expect(shadowBlur).toBe(12);
    });

    it('should use link highlight color (orange) instead of accent', () => {
      const gate: CircuitGate = {
        id: 0,
        name: 'AND1',
        type: 'AND',
        inputs: [],
        outputs: [],
      };

      renderer.renderGate(mockCtx, gate, 10, 20, 60, 40, 1.0, false, true);

      // Border should use link highlight color
      expect(strokeStyleHistory).toContain('#ff9f43');
    });

    it('should use thicker border (3px) when linked highlight is active', () => {
      const gate: CircuitGate = {
        id: 0,
        name: 'AND1',
        type: 'AND',
        inputs: [],
        outputs: [],
      };

      renderer.renderGate(mockCtx, gate, 10, 20, 60, 40, 1.0, false, true);

      // Should use lineWidth 3 for link highlight
      expect(lineWidthHistory).toContain(3);
    });

    it('should prioritize link highlight over hover when both are true', () => {
      const gate: CircuitGate = {
        id: 0,
        name: 'AND1',
        type: 'AND',
        inputs: [],
        outputs: [],
      };

      // Both isHovered and isLinkedHighlight are true
      renderer.renderGate(mockCtx, gate, 10, 20, 60, 40, 1.0, true, true);

      // Link highlight should take priority
      expect(shadowBlur).toBe(12); // Link highlight blur, not hover blur (8)
      expect(strokeStyleHistory).toContain('#ff9f43'); // Link highlight color
      expect(lineWidthHistory).toContain(3); // Link highlight width
    });

    it('should not apply link highlight when isLinkedHighlight is false', () => {
      const gate: CircuitGate = {
        id: 0,
        name: 'AND1',
        type: 'AND',
        inputs: [],
        outputs: [],
      };

      renderer.renderGate(mockCtx, gate, 10, 20, 60, 40, 1.0, false, false);

      // No glow effect
      expect(saveCalled).toBe(false);
      expect(restoreCalled).toBe(false);
      // Default border width
      expect(lineWidthHistory).toContain(1);
    });
  });
});
