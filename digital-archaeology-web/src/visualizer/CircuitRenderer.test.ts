// src/visualizer/CircuitRenderer.test.ts
// Unit tests for CircuitRenderer component (Story 6.1)

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CircuitRenderer, CircuitLoadError } from './CircuitRenderer';
import type { CircuitData } from './types';

// Type declaration for global fetch mock in Node.js test environment
declare const global: { fetch: typeof fetch };

describe('CircuitRenderer', () => {
  let container: HTMLDivElement;
  let renderer: CircuitRenderer;

  // Mock ResizeObserver
  const mockResizeObserver = vi.fn();
  const mockDisconnect = vi.fn();
  const mockObserve = vi.fn();

  // Mock canvas context
  let mockCtx: CanvasRenderingContext2D;
  let mockFillRect: ReturnType<typeof vi.fn>;
  let mockScale: ReturnType<typeof vi.fn>;
  let mockSetTransform: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Create container element
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);

    // Mock getBoundingClientRect
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      bottom: 600,
      right: 800,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    // Mock ResizeObserver
    mockDisconnect.mockClear();
    mockObserve.mockClear();
    mockResizeObserver.mockClear();

    // Create a proper class mock for ResizeObserver
    class MockResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        mockResizeObserver(callback);
      }
      observe = mockObserve;
      disconnect = mockDisconnect;
      unobserve = vi.fn();
    }

    vi.stubGlobal('ResizeObserver', MockResizeObserver);

    // Mock devicePixelRatio
    vi.stubGlobal('devicePixelRatio', 2);

    // Mock getComputedStyle for theme background, gate colors, and wire colors
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (prop: string) => {
        const cssVars: Record<string, string> = {
          '--da-bg-primary': '#1a1a2e',
          '--da-gate-and': '#4ecdc4',
          '--da-gate-or': '#ff6b6b',
          '--da-gate-xor': '#c44dff',
          '--da-gate-not': '#ffd93d',
          '--da-gate-buf': '#888888',
          '--da-gate-dff': '#4d96ff',
          // Wire colors (Story 6.4)
          '--da-wire-high': '#00ff88',
          '--da-wire-low': '#3a3a3a',
          '--da-wire-unknown': '#ffaa00',
        };
        return cssVars[prop] || '';
      },
    } as CSSStyleDeclaration);

    // Create mock canvas context with all methods needed for gate and wire rendering (Story 6.3, 6.4)
    mockFillRect = vi.fn();
    mockScale = vi.fn();
    mockSetTransform = vi.fn();

    mockCtx = {
      fillRect: mockFillRect,
      scale: mockScale,
      setTransform: mockSetTransform,
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      lineCap: 'butt' as CanvasLineCap,
      beginPath: vi.fn(),
      roundRect: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillText: vi.fn(),
      font: '',
      textAlign: '' as CanvasTextAlign,
      textBaseline: '' as CanvasTextBaseline,
      // Wire rendering methods (Story 6.4)
      moveTo: vi.fn(),
      lineTo: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    // Mock HTMLCanvasElement.prototype.getContext
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      (contextId: string) => {
        if (contextId === '2d') {
          return mockCtx;
        }
        return null;
      }
    );

    // Create renderer instance
    renderer = new CircuitRenderer();
  });

  afterEach(() => {
    // Clean up
    renderer.destroy();
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
    vi.restoreAllMocks();
  });

  describe('mount()', () => {
    it('should create a canvas element in the container', () => {
      renderer.mount(container);

      const canvas = container.querySelector('canvas');
      expect(canvas).not.toBeNull();
      expect(canvas).toBeInstanceOf(HTMLCanvasElement);
    });

    it('should throw error if already mounted (double-mount protection)', () => {
      renderer.mount(container);

      expect(() => renderer.mount(container)).toThrow(
        'CircuitRenderer is already mounted. Call destroy() before remounting.'
      );
    });

    it('should apply da-circuit-canvas CSS class to canvas', () => {
      renderer.mount(container);

      const canvas = container.querySelector('canvas');
      expect(canvas?.className).toBe('da-circuit-canvas');
    });

    it('should set accessibility attributes on canvas', () => {
      renderer.mount(container);

      const canvas = container.querySelector('canvas');
      expect(canvas?.getAttribute('role')).toBe('img');
      expect(canvas?.getAttribute('aria-label')).toBe('CPU circuit diagram');
    });

    it('should obtain a 2D rendering context', () => {
      renderer.mount(container);

      const ctx = renderer.getContext();
      expect(ctx).not.toBeNull();
      expect(ctx).toBe(mockCtx);
    });

    it('should set up ResizeObserver on container', () => {
      renderer.mount(container);

      expect(mockObserve).toHaveBeenCalledWith(container);
    });

    it('should set canvas dimensions based on container size', () => {
      renderer.mount(container);

      const canvas = renderer.getCanvas();
      // Internal size is scaled by devicePixelRatio (2)
      expect(canvas?.width).toBe(1600); // 800 * 2
      expect(canvas?.height).toBe(1200); // 600 * 2
      // Display size matches container
      expect(canvas?.style.width).toBe('800px');
      expect(canvas?.style.height).toBe('600px');
    });

    it('should throw error if canvas context cannot be obtained', () => {
      // Mock getContext to return null
      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

      const testRenderer = new CircuitRenderer();
      expect(() => testRenderer.mount(container)).toThrow(
        'Failed to get 2D canvas context'
      );
    });
  });

  describe('getCanvas()', () => {
    it('should return null before mount', () => {
      expect(renderer.getCanvas()).toBeNull();
    });

    it('should return the canvas element after mount', () => {
      renderer.mount(container);

      const canvas = renderer.getCanvas();
      expect(canvas).toBeInstanceOf(HTMLCanvasElement);
    });
  });

  describe('getContext()', () => {
    it('should return null before mount', () => {
      expect(renderer.getContext()).toBeNull();
    });

    it('should return the 2D context after mount', () => {
      renderer.mount(container);

      const ctx = renderer.getContext();
      expect(ctx).toBe(mockCtx);
    });
  });

  describe('getDimensions()', () => {
    it('should return current display dimensions', () => {
      renderer.mount(container);

      const dims = renderer.getDimensions();
      expect(dims.width).toBe(800);
      expect(dims.height).toBe(600);
    });
  });

  describe('getDevicePixelRatio()', () => {
    it('should return the device pixel ratio', () => {
      renderer.mount(container);

      expect(renderer.getDevicePixelRatio()).toBe(2);
    });
  });

  describe('resize handling', () => {
    it('should update dimensions when container resizes', () => {
      renderer.mount(container);

      // Get the resize callback that was passed to ResizeObserver
      const resizeCallback = mockResizeObserver.mock.calls[0][0];

      // Simulate resize
      resizeCallback([
        {
          contentRect: { width: 1024, height: 768 },
        },
      ]);

      const dims = renderer.getDimensions();
      expect(dims.width).toBe(1024);
      expect(dims.height).toBe(768);

      const canvas = renderer.getCanvas();
      expect(canvas?.width).toBe(2048); // 1024 * 2
      expect(canvas?.height).toBe(1536); // 768 * 2
    });

    it('should trigger render after resize', () => {
      const onRenderComplete = vi.fn();
      const testRenderer = new CircuitRenderer({ onRenderComplete });
      testRenderer.mount(container);

      // Clear the initial render call
      onRenderComplete.mockClear();

      // Get the resize callback
      const resizeCallback = mockResizeObserver.mock.calls[0][0];

      // Simulate resize
      resizeCallback([
        {
          contentRect: { width: 1024, height: 768 },
        },
      ]);

      expect(onRenderComplete).toHaveBeenCalled();

      testRenderer.destroy();
    });
  });

  describe('updateState()', () => {
    it('should trigger a re-render when called', () => {
      const onRenderComplete = vi.fn();
      const testRenderer = new CircuitRenderer({ onRenderComplete });
      testRenderer.mount(container);

      // Clear initial render call
      onRenderComplete.mockClear();

      testRenderer.updateState({ isAnimating: true });

      expect(onRenderComplete).toHaveBeenCalled();

      testRenderer.destroy();
    });

    it('should handle updateState when not mounted gracefully', () => {
      // Should not throw
      expect(() => renderer.updateState({ isAnimating: false })).not.toThrow();
    });
  });

  describe('render()', () => {
    it('should clear canvas with theme background color', () => {
      renderer.mount(container);

      // Clear mocks after initial render
      mockFillRect.mockClear();

      renderer.render();

      expect(mockCtx.fillStyle).toBe('#1a1a2e');
      expect(mockFillRect).toHaveBeenCalledWith(0, 0, 800, 600);
    });

    it('should use fallback color when CSS variable is unavailable', () => {
      // Mock getComputedStyle to return empty string
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({
        getPropertyValue: () => '',
      } as unknown as CSSStyleDeclaration);

      renderer.mount(container);
      mockFillRect.mockClear();

      renderer.render();

      expect(mockCtx.fillStyle).toBe('#1a1a2e');
    });

    it('should call onRenderComplete callback if provided', () => {
      const onRenderComplete = vi.fn();
      const testRenderer = new CircuitRenderer({ onRenderComplete });
      testRenderer.mount(container);

      // Clear initial render call
      onRenderComplete.mockClear();

      testRenderer.render();

      expect(onRenderComplete).toHaveBeenCalled();

      testRenderer.destroy();
    });

    it('should handle render when not mounted gracefully', () => {
      // Should not throw
      expect(() => renderer.render()).not.toThrow();
    });
  });

  describe('destroy()', () => {
    it('should disconnect ResizeObserver', () => {
      renderer.mount(container);
      renderer.destroy();

      expect(mockDisconnect).toHaveBeenCalled();
    });

    it('should remove canvas from container', () => {
      renderer.mount(container);

      expect(container.querySelector('canvas')).not.toBeNull();

      renderer.destroy();

      expect(container.querySelector('canvas')).toBeNull();
    });

    it('should clear internal references', () => {
      renderer.mount(container);
      renderer.destroy();

      expect(renderer.getCanvas()).toBeNull();
      expect(renderer.getContext()).toBeNull();
    });

    it('should handle destroy when not mounted gracefully', () => {
      // Should not throw
      expect(() => renderer.destroy()).not.toThrow();
    });
  });

  describe('updateState() with circuitData', () => {
    const mockCircuitData: CircuitData = {
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
          outputs: [{ wire: 0, bit: 0 }],
        },
      ],
    };

    it('should create CircuitModel from circuitData', () => {
      renderer.mount(container);
      renderer.updateState({ circuitData: mockCircuitData });

      const model = renderer.getCircuitModel();
      expect(model).not.toBeNull();
      expect(model?.gateCount).toBe(1);
      expect(model?.wireCount).toBe(2);
    });

    it('should allow access to circuit data through model', () => {
      renderer.mount(container);
      renderer.updateState({ circuitData: mockCircuitData });

      const model = renderer.getCircuitModel();
      expect(model?.getWireByName('gnd')).toBeDefined();
      expect(model?.getWireByName('vdd')).toBeDefined();
      expect(model?.getGate(0)?.name).toBe('AND1');
    });

    it('should replace previous circuit model on new circuitData', () => {
      renderer.mount(container);
      renderer.updateState({ circuitData: mockCircuitData });

      const firstModel = renderer.getCircuitModel();

      const newData: CircuitData = {
        cycle: 10,
        stable: false,
        wires: [],
        gates: [],
      };
      renderer.updateState({ circuitData: newData });

      const secondModel = renderer.getCircuitModel();
      expect(secondModel).not.toBe(firstModel);
      expect(secondModel?.cycle).toBe(10);
      expect(secondModel?.isStable).toBe(false);
    });
  });

  describe('getCircuitModel()', () => {
    it('should return null when no circuit data loaded', () => {
      renderer.mount(container);
      expect(renderer.getCircuitModel()).toBeNull();
    });

    it('should return null before mount', () => {
      expect(renderer.getCircuitModel()).toBeNull();
    });
  });

  describe('loadCircuit()', () => {
    const mockCircuitData: CircuitData = {
      cycle: 0,
      stable: true,
      wires: [
        {
          id: 0,
          name: 'test',
          width: 1,
          is_input: false,
          is_output: false,
          state: [0],
        },
      ],
      gates: [],
    };

    it('should load circuit data and create model', async () => {
      // Mock fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockCircuitData),
      });

      renderer.mount(container);
      await renderer.loadCircuit('/circuits/test.json');

      const model = renderer.getCircuitModel();
      expect(model).not.toBeNull();
      expect(model?.wireCount).toBe(1);
    });

    it('should throw CircuitLoadError on fetch failure', async () => {
      // Mock fetch to fail
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      renderer.mount(container);

      await expect(renderer.loadCircuit('/circuits/missing.json')).rejects.toThrow(
        CircuitLoadError
      );
    });

    it('should trigger re-render after loading', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockCircuitData),
      });

      const onRenderComplete = vi.fn();
      const testRenderer = new CircuitRenderer({ onRenderComplete });
      testRenderer.mount(container);

      // Clear initial render call
      onRenderComplete.mockClear();

      await testRenderer.loadCircuit('/circuits/test.json');

      expect(onRenderComplete).toHaveBeenCalled();

      testRenderer.destroy();
    });

    it('should work when not mounted (creates model but no render)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockCircuitData),
      });

      // Don't mount the renderer
      await renderer.loadCircuit('/circuits/test.json');

      // Model should still be created
      const model = renderer.getCircuitModel();
      expect(model).not.toBeNull();
      expect(model?.wireCount).toBe(1);
    });
  });

  describe('zero-dimension container', () => {
    it('should handle container with zero width gracefully', () => {
      vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
        width: 0,
        height: 600,
        top: 0,
        left: 0,
        bottom: 600,
        right: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      const testRenderer = new CircuitRenderer();
      expect(() => testRenderer.mount(container)).not.toThrow();

      const dims = testRenderer.getDimensions();
      expect(dims.width).toBe(0);
      expect(dims.height).toBe(600);

      testRenderer.destroy();
    });

    it('should handle container with zero height gracefully', () => {
      vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
        width: 800,
        height: 0,
        top: 0,
        left: 0,
        bottom: 0,
        right: 800,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      const testRenderer = new CircuitRenderer();
      expect(() => testRenderer.mount(container)).not.toThrow();

      const dims = testRenderer.getDimensions();
      expect(dims.width).toBe(800);
      expect(dims.height).toBe(0);

      testRenderer.destroy();
    });

    it('should handle completely zero-dimension container', () => {
      vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
        width: 0,
        height: 0,
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      const testRenderer = new CircuitRenderer();
      expect(() => testRenderer.mount(container)).not.toThrow();

      const dims = testRenderer.getDimensions();
      expect(dims.width).toBe(0);
      expect(dims.height).toBe(0);

      testRenderer.destroy();
    });
  });

  describe('HiDPI support', () => {
    it('should scale canvas for HiDPI displays', () => {
      vi.stubGlobal('devicePixelRatio', 3);

      const testRenderer = new CircuitRenderer();
      testRenderer.mount(container);

      const canvas = testRenderer.getCanvas();
      expect(canvas?.width).toBe(2400); // 800 * 3
      expect(canvas?.height).toBe(1800); // 600 * 3
      expect(testRenderer.getDevicePixelRatio()).toBe(3);

      testRenderer.destroy();
    });

    it('should handle devicePixelRatio of 1', () => {
      vi.stubGlobal('devicePixelRatio', 1);

      const testRenderer = new CircuitRenderer();
      testRenderer.mount(container);

      const canvas = testRenderer.getCanvas();
      expect(canvas?.width).toBe(800);
      expect(canvas?.height).toBe(600);

      testRenderer.destroy();
    });

    it('should fallback to 1 when devicePixelRatio is undefined', () => {
      vi.stubGlobal('devicePixelRatio', undefined);

      const testRenderer = new CircuitRenderer();
      testRenderer.mount(container);

      expect(testRenderer.getDevicePixelRatio()).toBe(1);

      testRenderer.destroy();
    });
  });

  describe('gate rendering (Story 6.3)', () => {
    const mockCircuitDataWithGates: CircuitData = {
      cycle: 0,
      stable: true,
      wires: [],
      gates: [
        { id: 0, name: 'AND1', type: 'AND', inputs: [], outputs: [] },
        { id: 1, name: 'OR1', type: 'OR', inputs: [], outputs: [] },
        { id: 2, name: 'NOT1', type: 'NOT', inputs: [], outputs: [] },
        { id: 3, name: 'BUF1', type: 'BUF', inputs: [], outputs: [] },
        { id: 4, name: 'DFF1', type: 'DFF', inputs: [], outputs: [], stored: 0 },
        { id: 5, name: 'XOR1', type: 'XOR', inputs: [], outputs: [] },
      ],
    };

    let mockRoundRect: ReturnType<typeof vi.fn>;
    let mockFill: ReturnType<typeof vi.fn>;
    let mockStroke: ReturnType<typeof vi.fn>;
    let mockBeginPath: ReturnType<typeof vi.fn>;
    let mockFillText: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockRoundRect = vi.fn();
      mockFill = vi.fn();
      mockStroke = vi.fn();
      mockBeginPath = vi.fn();
      mockFillText = vi.fn();

      // Enhanced mock context for gate rendering
      mockCtx = {
        fillRect: mockFillRect,
        scale: mockScale,
        setTransform: mockSetTransform,
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 0,
        beginPath: mockBeginPath,
        roundRect: mockRoundRect,
        fill: mockFill,
        stroke: mockStroke,
        fillText: mockFillText,
        font: '',
        textAlign: '' as CanvasTextAlign,
        textBaseline: '' as CanvasTextBaseline,
      } as unknown as CanvasRenderingContext2D;

      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
        (contextId: string) => {
          if (contextId === '2d') {
            return mockCtx;
          }
          return null;
        }
      );

      // Mock CSS variables for gate colors
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({
        getPropertyValue: (prop: string) => {
          const colors: Record<string, string> = {
            '--da-bg-primary': '#1a1a2e',
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

    it('should render gates when circuit data is loaded', () => {
      renderer.mount(container);
      renderer.updateState({ circuitData: mockCircuitDataWithGates });

      // Should have drawn background + 6 gates (each gate has roundRect call)
      expect(mockRoundRect).toHaveBeenCalled();
      expect(mockFill).toHaveBeenCalled();
      expect(mockStroke).toHaveBeenCalled();
    });

    it('should render all gate types with different colors', () => {
      renderer.mount(container);

      // Clear mocks from initial render
      mockRoundRect.mockClear();
      mockFill.mockClear();

      renderer.updateState({ circuitData: mockCircuitDataWithGates });

      // 6 gates should be rendered
      expect(mockRoundRect).toHaveBeenCalledTimes(6);
      expect(mockFill).toHaveBeenCalledTimes(6);
    });

    it('should draw gate type labels', () => {
      renderer.mount(container);
      mockFillText.mockClear();

      renderer.updateState({ circuitData: mockCircuitDataWithGates });

      // Each gate should have its type label drawn
      expect(mockFillText).toHaveBeenCalled();
      const calls = mockFillText.mock.calls;
      const labels = calls.map((call) => call[0]);
      expect(labels).toContain('AND');
      expect(labels).toContain('OR');
      expect(labels).toContain('NOT');
      expect(labels).toContain('BUF');
      expect(labels).toContain('DFF');
      expect(labels).toContain('XOR');
    });

    it('should not render gates when no circuit data loaded', () => {
      renderer.mount(container);

      // Clear mocks from initial render
      mockRoundRect.mockClear();

      renderer.render();

      // No gates should be rendered
      expect(mockRoundRect).not.toHaveBeenCalled();
    });

    it('should clean up gate renderer on destroy', () => {
      renderer.mount(container);
      renderer.updateState({ circuitData: mockCircuitDataWithGates });

      expect(() => renderer.destroy()).not.toThrow();
      expect(renderer.getCircuitModel()).toBeNull();
    });

    it('should handle large circuits (100+ gates) efficiently', () => {
      // Create mock circuit with 150 gates (similar to micro4-circuit.json which has ~167 gates)
      const gateTypes = ['AND', 'OR', 'NOT', 'BUF', 'DFF', 'XOR'] as const;
      const largeCircuitData: CircuitData = {
        cycle: 0,
        stable: true,
        wires: [],
        gates: Array.from({ length: 150 }, (_, i) => ({
          id: i,
          name: `GATE${i}`,
          type: gateTypes[i % gateTypes.length],
          inputs: [],
          outputs: [],
        })),
      };

      renderer.mount(container);

      // Should not throw and should render all gates
      expect(() => renderer.updateState({ circuitData: largeCircuitData })).not.toThrow();

      const model = renderer.getCircuitModel();
      expect(model?.gateCount).toBe(150);

      // Verify gates were rendered (at least roundRect was called for each)
      expect(mockRoundRect).toHaveBeenCalled();
      // Should have rendered all 150 gates (called once per gate)
      expect(mockRoundRect.mock.calls.length).toBeGreaterThanOrEqual(150);
    });

    it('should cache layout and only recalculate when circuit or dimensions change', () => {
      renderer.mount(container);
      renderer.updateState({ circuitData: mockCircuitDataWithGates });

      // Clear mocks after initial render
      mockRoundRect.mockClear();
      mockFill.mockClear();

      // Multiple renders with same state should reuse cached layout
      renderer.render();
      renderer.render();
      renderer.render();

      // Gates should still be rendered each time, but layout should be cached
      // (6 gates * 3 renders = 18 calls)
      expect(mockRoundRect.mock.calls.length).toBe(18);
    });
  });

  describe('wire rendering (Story 6.4)', () => {
    const mockCircuitDataWithWires: CircuitData = {
      cycle: 0,
      stable: true,
      wires: [
        { id: 0, name: 'wire0', width: 1, is_input: false, is_output: false, state: [1] },
        { id: 1, name: 'wire1', width: 4, is_input: false, is_output: false, state: [0, 1, 0, 1] },
      ],
      gates: [
        {
          id: 0,
          name: 'AND1',
          type: 'AND',
          inputs: [{ wire: 0, bit: 0 }],
          outputs: [{ wire: 1, bit: 0 }],
        },
        {
          id: 1,
          name: 'OR1',
          type: 'OR',
          inputs: [{ wire: 1, bit: 0 }],
          outputs: [],
        },
      ],
    };

    let mockMoveTo: ReturnType<typeof vi.fn>;
    let mockLineTo: ReturnType<typeof vi.fn>;
    let mockStroke: ReturnType<typeof vi.fn>;
    let mockBeginPath: ReturnType<typeof vi.fn>;
    let mockRoundRect: ReturnType<typeof vi.fn>;
    let mockFill: ReturnType<typeof vi.fn>;
    let mockFillText: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockMoveTo = vi.fn();
      mockLineTo = vi.fn();
      mockStroke = vi.fn();
      mockBeginPath = vi.fn();
      mockRoundRect = vi.fn();
      mockFill = vi.fn();
      mockFillText = vi.fn();

      // Enhanced mock context for wire rendering
      mockCtx = {
        fillRect: mockFillRect,
        scale: mockScale,
        setTransform: mockSetTransform,
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 0,
        lineCap: 'butt' as CanvasLineCap,
        beginPath: mockBeginPath,
        moveTo: mockMoveTo,
        lineTo: mockLineTo,
        stroke: mockStroke,
        roundRect: mockRoundRect,
        fill: mockFill,
        fillText: mockFillText,
        font: '',
        textAlign: '' as CanvasTextAlign,
        textBaseline: '' as CanvasTextBaseline,
      } as unknown as CanvasRenderingContext2D;

      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
        (contextId: string) => {
          if (contextId === '2d') {
            return mockCtx;
          }
          return null;
        }
      );

      // Mock CSS variables for wire and gate colors
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({
        getPropertyValue: (prop: string) => {
          const colors: Record<string, string> = {
            '--da-bg-primary': '#1a1a2e',
            '--da-wire-high': '#00ff88',
            '--da-wire-low': '#3a3a3a',
            '--da-wire-unknown': '#ffaa00',
            '--da-gate-and': '#4ecdc4',
            '--da-gate-or': '#ff6b6b',
          };
          return colors[prop] || '';
        },
      } as CSSStyleDeclaration);
    });

    it('should render wires when circuit data is loaded', () => {
      renderer.mount(container);
      renderer.updateState({ circuitData: mockCircuitDataWithWires });

      // Wire rendering should call moveTo, lineTo, stroke
      expect(mockMoveTo).toHaveBeenCalled();
      expect(mockLineTo).toHaveBeenCalled();
      expect(mockStroke).toHaveBeenCalled();
    });

    it('should render wires BEFORE gates (z-order)', () => {
      const callOrder: string[] = [];

      mockMoveTo.mockImplementation(() => callOrder.push('moveTo'));
      mockRoundRect.mockImplementation(() => callOrder.push('roundRect'));

      renderer.mount(container);
      renderer.updateState({ circuitData: mockCircuitDataWithWires });

      // Find first moveTo (wire) and first roundRect (gate)
      const firstWireCall = callOrder.indexOf('moveTo');
      const firstGateCall = callOrder.indexOf('roundRect');

      // Wires should be drawn before gates
      expect(firstWireCall).toBeLessThan(firstGateCall);
    });

    it('should not render wires when no circuit data loaded', () => {
      renderer.mount(container);

      // Clear mocks from initial render
      mockMoveTo.mockClear();

      renderer.render();

      // No wires should be rendered
      expect(mockMoveTo).not.toHaveBeenCalled();
    });

    it('should clean up wire renderer on destroy', () => {
      renderer.mount(container);
      renderer.updateState({ circuitData: mockCircuitDataWithWires });

      expect(() => renderer.destroy()).not.toThrow();
      expect(renderer.getCircuitModel()).toBeNull();
    });
  });

  describe('animation (Story 6.5)', () => {
    const mockCircuitDataStart: CircuitData = {
      cycle: 0,
      stable: true,
      wires: [
        { id: 0, name: 'wire0', width: 1, is_input: false, is_output: false, state: [0] },
      ],
      gates: [
        { id: 0, name: 'AND1', type: 'AND', inputs: [], outputs: [{ wire: 0, bit: 0 }] },
      ],
    };

    const mockCircuitDataEnd: CircuitData = {
      cycle: 1,
      stable: true,
      wires: [
        { id: 0, name: 'wire0', width: 1, is_input: false, is_output: false, state: [1] },
      ],
      gates: [
        { id: 0, name: 'AND1', type: 'AND', inputs: [], outputs: [{ wire: 0, bit: 0 }] },
      ],
    };

    let mockMoveTo: ReturnType<typeof vi.fn>;
    let mockLineTo: ReturnType<typeof vi.fn>;
    let mockStroke: ReturnType<typeof vi.fn>;
    let mockBeginPath: ReturnType<typeof vi.fn>;
    let mockRoundRect: ReturnType<typeof vi.fn>;
    let mockFill: ReturnType<typeof vi.fn>;
    let mockFillText: ReturnType<typeof vi.fn>;
    let rafCallbacks: Array<{ id: number; callback: FrameRequestCallback }>;
    let nextRafId: number;
    let currentTime: number;

    beforeEach(() => {
      mockMoveTo = vi.fn();
      mockLineTo = vi.fn();
      mockStroke = vi.fn();
      mockBeginPath = vi.fn();
      mockRoundRect = vi.fn();
      mockFill = vi.fn();
      mockFillText = vi.fn();
      rafCallbacks = [];
      nextRafId = 1;
      currentTime = 0;

      // Mock requestAnimationFrame
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
        const id = nextRafId++;
        rafCallbacks.push({ id, callback });
        return id;
      });

      // Mock cancelAnimationFrame
      vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
        rafCallbacks = rafCallbacks.filter((item) => item.id !== id);
      });

      // Mock performance.now()
      vi.spyOn(performance, 'now').mockImplementation(() => currentTime);

      // Enhanced mock context
      mockCtx = {
        fillRect: mockFillRect,
        scale: mockScale,
        setTransform: mockSetTransform,
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 0,
        lineCap: 'butt' as CanvasLineCap,
        beginPath: mockBeginPath,
        moveTo: mockMoveTo,
        lineTo: mockLineTo,
        stroke: mockStroke,
        roundRect: mockRoundRect,
        fill: mockFill,
        fillText: mockFillText,
        font: '',
        textAlign: '' as CanvasTextAlign,
        textBaseline: '' as CanvasTextBaseline,
      } as unknown as CanvasRenderingContext2D;

      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
        (contextId: string) => {
          if (contextId === '2d') {
            return mockCtx;
          }
          return null;
        }
      );

      // Mock CSS variables
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({
        getPropertyValue: (prop: string) => {
          const colors: Record<string, string> = {
            '--da-bg-primary': '#1a1a2e',
            '--da-wire-high': '#00ff88',
            '--da-wire-low': '#3a3a3a',
            '--da-wire-unknown': '#ffaa00',
            '--da-gate-and': '#4ecdc4',
          };
          return colors[prop] || '';
        },
      } as CSSStyleDeclaration);

      // Mock matchMedia for reduced motion check
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(() => ({
          matches: false, // User does NOT prefer reduced motion
          media: '(prefers-reduced-motion: reduce)',
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });
    });

    // Helper to advance animation
    function advanceFrame(deltaMs: number): void {
      currentTime += deltaMs;
      const callbacks = [...rafCallbacks];
      rafCallbacks = [];
      callbacks.forEach(({ callback }) => callback(currentTime));
    }

    it('should set isAnimating to true during animation', () => {
      renderer.mount(container);
      renderer.updateState({ circuitData: mockCircuitDataStart });

      expect(renderer.isAnimating).toBe(false);

      renderer.animateTransition(mockCircuitDataEnd);

      expect(renderer.isAnimating).toBe(true);
    });

    it('should set isAnimating to false after animation completes', () => {
      renderer.mount(container);
      renderer.updateState({ circuitData: mockCircuitDataStart });

      renderer.animateTransition(mockCircuitDataEnd);
      expect(renderer.isAnimating).toBe(true);

      // Advance past animation duration
      advanceFrame(600);

      expect(renderer.isAnimating).toBe(false);
    });

    it('should render multiple frames during animation', () => {
      renderer.mount(container);
      renderer.updateState({ circuitData: mockCircuitDataStart });

      // Clear mocks
      mockRoundRect.mockClear();

      renderer.animateTransition(mockCircuitDataEnd);

      // Advance through animation
      advanceFrame(100);
      advanceFrame(100);
      advanceFrame(100);

      // Should have rendered at least 3 times (one per frame)
      // Each render draws 1 gate = 1 roundRect call per frame
      expect(mockRoundRect.mock.calls.length).toBeGreaterThanOrEqual(3);
    });

    it('should skip animation when no changes detected', () => {
      renderer.mount(container);
      renderer.updateState({ circuitData: mockCircuitDataStart });

      // Animate to same state
      renderer.animateTransition(mockCircuitDataStart);

      // Should not start animation
      expect(renderer.isAnimating).toBe(false);
    });

    it('should update circuit model after animation', () => {
      renderer.mount(container);
      renderer.updateState({ circuitData: mockCircuitDataStart });

      renderer.animateTransition(mockCircuitDataEnd);
      advanceFrame(600);

      const model = renderer.getCircuitModel();
      expect(model?.wires.get(0)?.state[0]).toBe(1);
    });

    it('should clean up animation on destroy', () => {
      renderer.mount(container);
      renderer.updateState({ circuitData: mockCircuitDataStart });
      renderer.animateTransition(mockCircuitDataEnd);

      expect(renderer.isAnimating).toBe(true);

      renderer.destroy();

      expect(renderer.isAnimating).toBe(false);
    });

    it('should use immediate update when animation is disabled', () => {
      const noAnimRenderer = new CircuitRenderer({
        animation: { enableAnimation: false },
      });
      noAnimRenderer.mount(container);
      noAnimRenderer.updateState({ circuitData: mockCircuitDataStart });

      noAnimRenderer.animateTransition(mockCircuitDataEnd);

      // Should not be animating - immediate update
      expect(noAnimRenderer.isAnimating).toBe(false);

      // Model should be updated immediately
      const model = noAnimRenderer.getCircuitModel();
      expect(model?.wires.get(0)?.state[0]).toBe(1);

      noAnimRenderer.destroy();
    });
  });
});
