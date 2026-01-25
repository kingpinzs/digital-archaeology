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
          // Hover highlight (Story 6.8)
          '--da-accent': '#00b4d8',
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
      translate: vi.fn(), // Story 6.7: pan offset
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
      // Hover highlight methods (Story 6.8)
      save: vi.fn(),
      restore: vi.fn(),
      shadowBlur: 0,
      shadowColor: '',
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
        translate: vi.fn(), // Story 6.7: pan offset
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
        translate: vi.fn(), // Story 6.7: pan offset
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
        translate: vi.fn(), // Story 6.7: pan offset
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

  // Story 6.6: Zoom Controls
  describe('zoom controls (Story 6.6)', () => {
    it('should have default zoom of 1.0', () => {
      const zoomRenderer = new CircuitRenderer();
      zoomRenderer.mount(container);
      expect(zoomRenderer.getZoom()).toBe(1.0);
      zoomRenderer.destroy();
    });

    it('should set zoom scale', () => {
      const zoomRenderer = new CircuitRenderer();
      zoomRenderer.mount(container);
      zoomRenderer.setZoom(1.5);
      expect(zoomRenderer.getZoom()).toBe(1.5);
      zoomRenderer.destroy();
    });

    it('should clamp zoom to minimum', () => {
      const zoomRenderer = new CircuitRenderer();
      zoomRenderer.mount(container);
      zoomRenderer.setZoom(0.1);
      expect(zoomRenderer.getZoom()).toBe(0.25);
      zoomRenderer.destroy();
    });

    it('should clamp zoom to maximum', () => {
      const zoomRenderer = new CircuitRenderer();
      zoomRenderer.mount(container);
      zoomRenderer.setZoom(5.0);
      expect(zoomRenderer.getZoom()).toBe(4.0);
      zoomRenderer.destroy();
    });

    it('should reset zoom to 1.0', () => {
      const zoomRenderer = new CircuitRenderer();
      zoomRenderer.mount(container);
      zoomRenderer.setZoom(2.5);
      zoomRenderer.resetZoom();
      expect(zoomRenderer.getZoom()).toBe(1.0);
      zoomRenderer.destroy();
    });

    it('should apply zoom scale to canvas transform', () => {
      const zoomRenderer = new CircuitRenderer();
      zoomRenderer.mount(container);
      mockScale.mockClear();

      zoomRenderer.setZoom(2.0);
      zoomRenderer.render();

      // Scale should be devicePixelRatio * zoom = 2 * 2 = 4
      expect(mockScale).toHaveBeenCalledWith(4, 4);
      zoomRenderer.destroy();
    });

    it('should call onZoomChange callback when zoom changes', () => {
      const onZoomChange = vi.fn();
      const zoomRenderer = new CircuitRenderer({
        zoom: { onZoomChange },
      });
      zoomRenderer.mount(container);

      zoomRenderer.setZoom(1.5);

      expect(onZoomChange).toHaveBeenCalledWith(1.5, '150%');

      zoomRenderer.destroy();
    });

    it('should not call onZoomChange if zoom did not change', () => {
      const onZoomChange = vi.fn();
      const zoomRenderer = new CircuitRenderer({
        zoom: { onZoomChange },
      });
      zoomRenderer.mount(container);

      zoomRenderer.setZoom(1.0); // Same as default

      expect(onZoomChange).not.toHaveBeenCalled();

      zoomRenderer.destroy();
    });

    it('should accept zoom configuration options', () => {
      const zoomRenderer = new CircuitRenderer({
        zoom: {
          initialScale: 1.5,
          min: 0.5,
          max: 3.0,
        },
      });
      zoomRenderer.mount(container);

      expect(zoomRenderer.getZoom()).toBe(1.5);

      // Test new bounds
      zoomRenderer.setZoom(0.3);
      expect(zoomRenderer.getZoom()).toBe(0.5);

      zoomRenderer.setZoom(4.0);
      expect(zoomRenderer.getZoom()).toBe(3.0);

      zoomRenderer.destroy();
    });

    it('should calculate zoomToFit for circuit content', () => {
      const zoomRenderer = new CircuitRenderer();
      zoomRenderer.mount(container);

      // Load a circuit first
      const mockCircuit: CircuitData = {
        gates: [
          { id: 0, name: 'G1', type: 'AND', inputs: [], outputs: [] },
          { id: 1, name: 'G2', type: 'OR', inputs: [], outputs: [] },
        ],
        wires: [],
        cycle: 0,
        stable: true,
      };
      zoomRenderer.updateState({ circuitData: mockCircuit });

      const scale = zoomRenderer.zoomToFit();

      // Should return a scale value
      expect(typeof scale).toBe('number');
      expect(scale).toBeGreaterThan(0);
      expect(zoomRenderer.getZoom()).toBe(scale);
      zoomRenderer.destroy();
    });

    it('should return 1.0 from zoomToFit when no circuit loaded', () => {
      const zoomRenderer = new CircuitRenderer();
      zoomRenderer.mount(container);
      const scale = zoomRenderer.zoomToFit();
      expect(scale).toBe(1.0);
      zoomRenderer.destroy();
    });

    it('should get zoom display percentage', () => {
      const zoomRenderer = new CircuitRenderer();
      zoomRenderer.mount(container);

      zoomRenderer.setZoom(1.0);
      expect(zoomRenderer.getZoomDisplayPercent()).toBe('100%');

      zoomRenderer.setZoom(0.5);
      expect(zoomRenderer.getZoomDisplayPercent()).toBe('50%');

      zoomRenderer.setZoom(2.0);
      expect(zoomRenderer.getZoomDisplayPercent()).toBe('200%');
      zoomRenderer.destroy();
    });
  });

  describe('wheel zoom handler (Story 6.6)', () => {
    it('should attach wheel event listener on mount', () => {
      let wheelEventListener: ((e: WheelEvent) => void) | null = null;
      const addSpy = vi.spyOn(HTMLCanvasElement.prototype, 'addEventListener').mockImplementation(
        function(this: HTMLCanvasElement, type: string, listener: EventListenerOrEventListenerObject) {
          if (type === 'wheel') {
            wheelEventListener = listener as (e: WheelEvent) => void;
          }
        }
      );

      const wheelRenderer = new CircuitRenderer();
      wheelRenderer.mount(container);
      expect(wheelEventListener).not.toBeNull();

      wheelRenderer.destroy();
      addSpy.mockRestore();
    });

    it('should zoom in on wheel up (negative deltaY)', () => {
      let wheelEventListener: ((e: WheelEvent) => void) | null = null;
      const addSpy = vi.spyOn(HTMLCanvasElement.prototype, 'addEventListener').mockImplementation(
        function(this: HTMLCanvasElement, type: string, listener: EventListenerOrEventListenerObject) {
          if (type === 'wheel') {
            wheelEventListener = listener as (e: WheelEvent) => void;
          }
        }
      );

      const wheelRenderer = new CircuitRenderer();
      wheelRenderer.mount(container);

      const wheelEvent = new WheelEvent('wheel', {
        deltaY: -100,
        clientX: 400,
        clientY: 300,
      });
      Object.defineProperty(wheelEvent, 'offsetX', { value: 400 });
      Object.defineProperty(wheelEvent, 'offsetY', { value: 300 });

      wheelEventListener!(wheelEvent);

      expect(wheelRenderer.getZoom()).toBeGreaterThan(1.0);

      wheelRenderer.destroy();
      addSpy.mockRestore();
    });

    it('should zoom out on wheel down (positive deltaY)', () => {
      let wheelEventListener: ((e: WheelEvent) => void) | null = null;
      const addSpy = vi.spyOn(HTMLCanvasElement.prototype, 'addEventListener').mockImplementation(
        function(this: HTMLCanvasElement, type: string, listener: EventListenerOrEventListenerObject) {
          if (type === 'wheel') {
            wheelEventListener = listener as (e: WheelEvent) => void;
          }
        }
      );

      const wheelRenderer = new CircuitRenderer();
      wheelRenderer.mount(container);

      const wheelEvent = new WheelEvent('wheel', {
        deltaY: 100,
        clientX: 400,
        clientY: 300,
      });
      Object.defineProperty(wheelEvent, 'offsetX', { value: 400 });
      Object.defineProperty(wheelEvent, 'offsetY', { value: 300 });

      wheelEventListener!(wheelEvent);

      expect(wheelRenderer.getZoom()).toBeLessThan(1.0);

      wheelRenderer.destroy();
      addSpy.mockRestore();
    });

    it('should disable wheel zoom when wheelZoomEnabled is false', () => {
      let wheelEventListener: ((e: WheelEvent) => void) | null = null;
      const addSpy = vi.spyOn(HTMLCanvasElement.prototype, 'addEventListener').mockImplementation(
        function(this: HTMLCanvasElement, type: string, listener: EventListenerOrEventListenerObject) {
          if (type === 'wheel') {
            wheelEventListener = listener as (e: WheelEvent) => void;
          }
        }
      );

      const noWheelRenderer = new CircuitRenderer({
        zoom: { wheelZoomEnabled: false },
      });
      noWheelRenderer.mount(container);

      const wheelEvent = new WheelEvent('wheel', {
        deltaY: -100,
        clientX: 400,
        clientY: 300,
      });
      Object.defineProperty(wheelEvent, 'offsetX', { value: 400 });
      Object.defineProperty(wheelEvent, 'offsetY', { value: 300 });

      // Should still attach listener but not change zoom
      // TypeScript can't track assignment through mock callback, so cast is needed
      if (wheelEventListener) {
        (wheelEventListener as (e: WheelEvent) => void)(wheelEvent);
      }

      expect(noWheelRenderer.getZoom()).toBe(1.0);

      noWheelRenderer.destroy();
      addSpy.mockRestore();
    });

    it('should remove wheel listener on destroy', () => {
      const addSpy = vi.spyOn(HTMLCanvasElement.prototype, 'addEventListener').mockImplementation(() => {});
      const removeSpy = vi.spyOn(HTMLCanvasElement.prototype, 'removeEventListener');

      const wheelRenderer = new CircuitRenderer();
      wheelRenderer.mount(container);
      wheelRenderer.destroy();

      expect(removeSpy).toHaveBeenCalledWith(
        'wheel',
        expect.any(Function),
        expect.any(Object)
      );

      addSpy.mockRestore();
      removeSpy.mockRestore();
    });
  });

  // Story 6.7: Pan Navigation
  describe('pan navigation (Story 6.7)', () => {
    let mockTranslate: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockTranslate = vi.fn();
      mockCtx = {
        ...mockCtx,
        translate: mockTranslate,
      } as unknown as CanvasRenderingContext2D;

      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
        (contextId: string) => {
          if (contextId === '2d') {
            return mockCtx;
          }
          return null;
        }
      );
    });

    describe('pan offset integration', () => {
      it('should have default offset of (0, 0)', () => {
        const panRenderer = new CircuitRenderer();
        panRenderer.mount(container);
        const offset = panRenderer.getOffset();
        expect(offset.x).toBe(0);
        expect(offset.y).toBe(0);
        panRenderer.destroy();
      });

      it('should set offset via setOffset()', () => {
        const panRenderer = new CircuitRenderer();
        panRenderer.mount(container);
        panRenderer.setOffset(50, 30);
        const offset = panRenderer.getOffset();
        expect(offset.x).toBe(50);
        expect(offset.y).toBe(30);
        panRenderer.destroy();
      });

      it('should apply pan offset to canvas transform', () => {
        const panRenderer = new CircuitRenderer();
        panRenderer.mount(container);
        mockTranslate.mockClear();
        mockScale.mockClear();

        panRenderer.setOffset(100, 50);
        panRenderer.render();

        // Translate should be called with offset * devicePixelRatio
        expect(mockTranslate).toHaveBeenCalledWith(200, 100); // 100*2, 50*2
        panRenderer.destroy();
      });

      it('should reset offset on resetZoom()', () => {
        const panRenderer = new CircuitRenderer();
        panRenderer.mount(container);
        panRenderer.setOffset(100, 50);
        panRenderer.setZoom(2.0);

        panRenderer.resetZoom();

        expect(panRenderer.getZoom()).toBe(1.0);
        const offset = panRenderer.getOffset();
        expect(offset.x).toBe(0);
        expect(offset.y).toBe(0);
        panRenderer.destroy();
      });
    });

    describe('mouse drag pan handler', () => {
      let mouseDownListener: ((e: MouseEvent) => void) | null = null;
      let documentMouseMoveListener: ((e: MouseEvent) => void) | null = null;
      let documentMouseUpListener: ((e: MouseEvent) => void) | null = null;
      let addSpy: ReturnType<typeof vi.spyOn>;
      let documentAddSpy: ReturnType<typeof vi.spyOn>;

      beforeEach(() => {
        mouseDownListener = null;
        documentMouseMoveListener = null;
        documentMouseUpListener = null;

        addSpy = vi.spyOn(HTMLCanvasElement.prototype, 'addEventListener').mockImplementation(
          function(this: HTMLCanvasElement, type: string, listener: EventListenerOrEventListenerObject) {
            if (type === 'mousedown') {
              mouseDownListener = listener as (e: MouseEvent) => void;
            }
          }
        );

        documentAddSpy = vi.spyOn(document, 'addEventListener').mockImplementation(
          function(type: string, listener: EventListenerOrEventListenerObject) {
            if (type === 'mousemove') {
              documentMouseMoveListener = listener as (e: MouseEvent) => void;
            } else if (type === 'mouseup') {
              documentMouseUpListener = listener as (e: MouseEvent) => void;
            }
          }
        );
      });

      afterEach(() => {
        addSpy.mockRestore();
        documentAddSpy.mockRestore();
      });

      it('should attach mousedown listener on mount', () => {
        const panRenderer = new CircuitRenderer();
        panRenderer.mount(container);
        expect(mouseDownListener).not.toBeNull();
        panRenderer.destroy();
      });

      it('should attach mousemove and mouseup to document on mount', () => {
        const panRenderer = new CircuitRenderer();
        panRenderer.mount(container);
        expect(documentMouseMoveListener).not.toBeNull();
        expect(documentMouseUpListener).not.toBeNull();
        panRenderer.destroy();
      });

      it('should start dragging on left mouse button down when pan allowed', () => {
        const panRenderer = new CircuitRenderer();
        panRenderer.mount(container);

        // Zoom in to enable panning
        panRenderer.setZoom(2.0);

        const mouseEvent = new MouseEvent('mousedown', {
          button: 0,
          clientX: 100,
          clientY: 100,
        });

        mouseDownListener!(mouseEvent);

        // Check that dragging is active by attempting a mousemove
        const moveEvent = new MouseEvent('mousemove', {
          clientX: 150,
          clientY: 120,
        });
        documentMouseMoveListener!(moveEvent);

        // Offset should have changed
        const offset = panRenderer.getOffset();
        expect(offset.x).not.toBe(0);
        expect(offset.y).not.toBe(0);

        panRenderer.destroy();
      });

      it('should not start dragging when pan is not allowed (zoom <= 1.0)', () => {
        const panRenderer = new CircuitRenderer();
        panRenderer.mount(container);

        // At default zoom 1.0, pan is not allowed (unless content exceeds viewport)
        const mouseEvent = new MouseEvent('mousedown', {
          button: 0,
          clientX: 100,
          clientY: 100,
        });

        mouseDownListener!(mouseEvent);

        const moveEvent = new MouseEvent('mousemove', {
          clientX: 150,
          clientY: 120,
        });
        documentMouseMoveListener!(moveEvent);

        // Offset should NOT have changed
        const offset = panRenderer.getOffset();
        expect(offset.x).toBe(0);
        expect(offset.y).toBe(0);

        panRenderer.destroy();
      });

      it('should not start dragging on right mouse button', () => {
        const panRenderer = new CircuitRenderer();
        panRenderer.mount(container);
        panRenderer.setZoom(2.0);

        const mouseEvent = new MouseEvent('mousedown', {
          button: 2, // Right click
          clientX: 100,
          clientY: 100,
        });

        mouseDownListener!(mouseEvent);

        const moveEvent = new MouseEvent('mousemove', {
          clientX: 150,
          clientY: 120,
        });
        documentMouseMoveListener!(moveEvent);

        // Offset should NOT have changed
        const offset = panRenderer.getOffset();
        expect(offset.x).toBe(0);
        expect(offset.y).toBe(0);

        panRenderer.destroy();
      });

      it('should stop dragging on mouseup', () => {
        const panRenderer = new CircuitRenderer();
        panRenderer.mount(container);
        panRenderer.setZoom(2.0);

        // Start drag
        mouseDownListener!(new MouseEvent('mousedown', {
          button: 0,
          clientX: 100,
          clientY: 100,
        }));

        // End drag
        documentMouseUpListener!(new MouseEvent('mouseup', {
          clientX: 150,
          clientY: 120,
        }));

        // Get current offset
        const offsetBefore = panRenderer.getOffset();

        // Move mouse after mouseup
        documentMouseMoveListener!(new MouseEvent('mousemove', {
          clientX: 200,
          clientY: 150,
        }));

        // Offset should NOT change after mouseup
        const offsetAfter = panRenderer.getOffset();
        expect(offsetAfter.x).toBe(offsetBefore.x);
        expect(offsetAfter.y).toBe(offsetBefore.y);

        panRenderer.destroy();
      });

      it('should update offset correctly during drag', () => {
        const panRenderer = new CircuitRenderer();
        panRenderer.mount(container);
        panRenderer.setZoom(2.0);

        // Start drag at (100, 100)
        mouseDownListener!(new MouseEvent('mousedown', {
          button: 0,
          clientX: 100,
          clientY: 100,
        }));

        // Move to (150, 120) - delta (50, 20)
        documentMouseMoveListener!(new MouseEvent('mousemove', {
          clientX: 150,
          clientY: 120,
        }));

        const offset = panRenderer.getOffset();
        // Pan delta should be applied
        // Note: exact values depend on clamping, but should be non-zero
        expect(offset.x).not.toBe(0);
        expect(offset.y).not.toBe(0);

        panRenderer.destroy();
      });

      it('should remove event listeners on destroy', () => {
        const removeSpy = vi.spyOn(HTMLCanvasElement.prototype, 'removeEventListener');
        const docRemoveSpy = vi.spyOn(document, 'removeEventListener');

        const panRenderer = new CircuitRenderer();
        panRenderer.mount(container);
        panRenderer.destroy();

        expect(removeSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
        expect(docRemoveSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
        expect(docRemoveSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));

        removeSpy.mockRestore();
        docRemoveSpy.mockRestore();
      });
    });

    describe('cursor state management', () => {
      it('should set cursor to grab when zoomed in', () => {
        const panRenderer = new CircuitRenderer();
        panRenderer.mount(container);
        const canvas = panRenderer.getCanvas();

        panRenderer.setZoom(2.0);

        expect(canvas?.dataset.pan).toBe('allowed');
        panRenderer.destroy();
      });

      it('should set cursor to default when not zoomed in', () => {
        const panRenderer = new CircuitRenderer();
        panRenderer.mount(container);
        const canvas = panRenderer.getCanvas();

        panRenderer.setZoom(1.0);

        expect(canvas?.dataset.pan).toBeUndefined();
        panRenderer.destroy();
      });

      it('should update cursor on zoom change', () => {
        const panRenderer = new CircuitRenderer();
        panRenderer.mount(container);
        const canvas = panRenderer.getCanvas();

        // Initially at 1.0, no pan cursor
        expect(canvas?.dataset.pan).toBeUndefined();

        // Zoom in - should enable pan cursor
        panRenderer.setZoom(2.0);
        expect(canvas?.dataset.pan).toBe('allowed');

        // Zoom back out - should disable pan cursor
        panRenderer.setZoom(1.0);
        expect(canvas?.dataset.pan).toBeUndefined();

        panRenderer.destroy();
      });
    });
  });

  // Story 6.8: Tooltip and Hover Detection
  describe('Story 6.8: Tooltip and Hover Detection', () => {
    // Sample circuit data for hit testing
    const sampleCircuitData: CircuitData = {
      cycle: 0,
      stable: true,
      wires: [
        { id: 1, name: 'w1', width: 1, is_input: true, is_output: false, state: [0] },
        { id: 2, name: 'w2', width: 1, is_input: false, is_output: true, state: [0] },
      ],
      gates: [
        { id: 1, name: 'AND1', type: 'AND', inputs: [{ wire: 1, bit: 0 }], outputs: [{ wire: 2, bit: 0 }] },
        { id: 2, name: 'OR1', type: 'OR', inputs: [{ wire: 2, bit: 0 }], outputs: [{ wire: 2, bit: 0 }] },
      ],
    };

    // Mock DOMRect at origin for all Story 6.8 tests (jsdom doesn't have real layout)
    const originRect: DOMRect = {
      left: 0, top: 0, width: 800, height: 600,
      right: 800, bottom: 600, x: 0, y: 0,
      toJSON: () => ({}),
    } as DOMRect;

    // Helper to get the canvas bounding rect for calculations
    function getCanvasRect(_r: CircuitRenderer): DOMRect {
      return originRect;
    }

    describe('screenToCanvas()', () => {
      it('should convert screen coordinates to canvas coordinates at zoom 1.0', () => {
        renderer.mount(container);
        renderer.updateState({ circuitData: sampleCircuitData });
        // Reset auto-centering offset so screen coords match canvas coords
        renderer.setOffset(0, 0);

        // Get actual canvas rect
        const canvas = renderer.getCanvas()!;
        const rect = canvas.getBoundingClientRect();

        // At zoom 1.0 and offset 0,0, a point 100px right and 50px down from canvas origin
        // should map to canvas coords (100, 50)
        const clientX = rect.left + 100;
        const clientY = rect.top + 50;
        const result = renderer.screenToCanvas(clientX, clientY);
        expect(result.x).toBe(100);
        expect(result.y).toBe(50);
      });

      it('should account for zoom scale in coordinate transformation', () => {
        renderer.mount(container);
        renderer.updateState({ circuitData: sampleCircuitData });
        renderer.setZoom(2.0);
        // Reset auto-centering offset so we can test zoom alone
        renderer.setOffset(0, 0);

        // Get actual canvas rect
        const canvas = renderer.getCanvas()!;
        const rect = canvas.getBoundingClientRect();

        // At zoom 2.0, 200px from canvas edge should map to 100px in canvas space
        const clientX = rect.left + 200;
        const clientY = rect.top + 100;
        const result = renderer.screenToCanvas(clientX, clientY);
        expect(result.x).toBe(100);
        expect(result.y).toBe(50);
      });

      it('should account for pan offset in coordinate transformation', () => {
        renderer.mount(container);
        renderer.updateState({ circuitData: sampleCircuitData });
        renderer.setZoom(2.0);
        renderer.setOffset(50, 25);

        // Get actual canvas rect
        const canvas = renderer.getCanvas()!;
        const rect = canvas.getBoundingClientRect();

        // With zoom 2 and offset (50, 25):
        // For clientX = rect.left + 200: (200 - 50) / 2 = 75
        // For clientY = rect.top + 100: (100 - 25) / 2 = 37.5
        const clientX = rect.left + 200;
        const clientY = rect.top + 100;
        const result = renderer.screenToCanvas(clientX, clientY);
        expect(result.x).toBe(75);
        expect(result.y).toBe(37.5);
      });

      it('should return 0,0 if not mounted', () => {
        const unmounted = new CircuitRenderer();
        const result = unmounted.screenToCanvas(100, 50);
        expect(result.x).toBe(0);
        expect(result.y).toBe(0);
      });
    });

    describe('hitTestGate()', () => {
      it('should return gate when point is inside gate bounds', () => {
        renderer.mount(container);
        renderer.updateState({ circuitData: sampleCircuitData });

        // Get first gate's position from layout
        // Default layout: padding=20, gateWidth=60, gateHeight=40
        // First AND gate at x=20, y=20
        const gate = renderer.hitTestGate(30, 30);
        expect(gate).not.toBeNull();
        expect(gate?.id).toBe(1);
        expect(gate?.type).toBe('AND');
      });

      it('should return null when point is outside all gates', () => {
        renderer.mount(container);
        renderer.updateState({ circuitData: sampleCircuitData });

        // Point far from any gate
        const gate = renderer.hitTestGate(500, 500);
        expect(gate).toBeNull();
      });

      it('should return null when no circuit data loaded', () => {
        renderer.mount(container);

        const gate = renderer.hitTestGate(30, 30);
        expect(gate).toBeNull();
      });

      it('should return null if not mounted', () => {
        const unmounted = new CircuitRenderer();
        const gate = unmounted.hitTestGate(30, 30);
        expect(gate).toBeNull();
      });
    });

    describe('hover state tracking', () => {
      // Helper to dispatch mouse events after mocking canvas rect
      function mockCanvasAndDispatch(
        canvas: HTMLCanvasElement,
        eventType: string,
        canvasX: number,
        canvasY: number,
        extraOptions: MouseEventInit = {}
      ): void {
        // Mock getBoundingClientRect on this canvas instance
        vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue(originRect);

        canvas.dispatchEvent(new MouseEvent(eventType, {
          clientX: canvasX,
          clientY: canvasY,
          bubbles: true,
          ...extraOptions,
        }));
      }

      it('should initialize with hoveredGateId as null', () => {
        renderer.mount(container);
        expect(renderer.getHoveredGateId()).toBeNull();
      });

      it('should update hoveredGateId when mouse moves over gate', () => {
        renderer.mount(container);
        renderer.updateState({ circuitData: sampleCircuitData });
        // Reset auto-centering offset so screen coords match canvas coords
        renderer.setOffset(0, 0);

        const canvas = renderer.getCanvas()!;

        // Simulate mousemove over first gate
        // Layout: padding=20, first AND gate at x=20, y=20, size 60x40
        // Point (40, 40) in canvas coords should be inside gate
        mockCanvasAndDispatch(canvas, 'mousemove', 40, 40);

        expect(renderer.getHoveredGateId()).toBe(1);
      });

      it('should clear hoveredGateId when mouse moves away from gates', () => {
        renderer.mount(container);
        renderer.updateState({ circuitData: sampleCircuitData });
        // Reset auto-centering offset so screen coords match canvas coords
        renderer.setOffset(0, 0);

        const canvas = renderer.getCanvas()!;

        // First hover over gate
        mockCanvasAndDispatch(canvas, 'mousemove', 40, 40);
        expect(renderer.getHoveredGateId()).toBe(1);

        // Then move away (far from any gates)
        mockCanvasAndDispatch(canvas, 'mousemove', 500, 500);
        expect(renderer.getHoveredGateId()).toBeNull();
      });

      it('should not update hover state during drag operation', () => {
        renderer.mount(container);
        renderer.updateState({ circuitData: sampleCircuitData });
        renderer.setZoom(2.0); // Enable panning
        // Note: We don't reset offset here because we want to test drag behavior
        // which doesn't depend on specific coordinates

        const canvas = renderer.getCanvas()!;

        // Start drag - at any position over the canvas
        mockCanvasAndDispatch(canvas, 'mousedown', 400, 300, { button: 0 });

        // Move during drag - the hover handler should skip processing due to isDragging
        mockCanvasAndDispatch(canvas, 'mousemove', 500, 400);

        // Hover state should not change during drag
        expect(renderer.getHoveredGateId()).toBeNull();

        // End drag
        document.dispatchEvent(new MouseEvent('mouseup', {
          clientX: 500,
          clientY: 400,
          bubbles: true,
        }));
      });

      it('should clear hover state on mouseleave', () => {
        renderer.mount(container);
        renderer.updateState({ circuitData: sampleCircuitData });
        // Reset auto-centering offset so screen coords match canvas coords
        renderer.setOffset(0, 0);

        const canvas = renderer.getCanvas()!;

        // First hover over gate
        mockCanvasAndDispatch(canvas, 'mousemove', 40, 40);
        expect(renderer.getHoveredGateId()).toBe(1);

        // Mouse leaves canvas
        vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue(originRect);
        canvas.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
        expect(renderer.getHoveredGateId()).toBeNull();
      });
    });

    describe('tooltip integration', () => {
      // Helper to dispatch mouse events after mocking canvas rect
      function mockCanvasAndDispatch(
        canvas: HTMLCanvasElement,
        eventType: string,
        canvasX: number,
        canvasY: number
      ): void {
        vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue(originRect);
        canvas.dispatchEvent(new MouseEvent(eventType, {
          clientX: canvasX,
          clientY: canvasY,
          bubbles: true,
        }));
      }

      it('should create tooltip element when mounted', () => {
        renderer.mount(container);

        const tooltip = container.querySelector('.da-gate-tooltip');
        expect(tooltip).not.toBeNull();
      });

      it('should show tooltip when hovering over gate', () => {
        renderer.mount(container);
        renderer.updateState({ circuitData: sampleCircuitData });
        // Reset auto-centering offset so screen coords match canvas coords
        renderer.setOffset(0, 0);

        const canvas = renderer.getCanvas()!;
        const tooltip = container.querySelector('.da-gate-tooltip') as HTMLElement;

        // Hover over gate (point inside first gate at x=20, y=20, size 60x40)
        mockCanvasAndDispatch(canvas, 'mousemove', 40, 40);

        expect(tooltip?.style.display).toBe('block');
      });

      it('should hide tooltip when mouse leaves gate', () => {
        renderer.mount(container);
        renderer.updateState({ circuitData: sampleCircuitData });
        // Reset auto-centering offset so screen coords match canvas coords
        renderer.setOffset(0, 0);

        const canvas = renderer.getCanvas()!;
        const tooltip = container.querySelector('.da-gate-tooltip') as HTMLElement;

        // Hover over gate first
        mockCanvasAndDispatch(canvas, 'mousemove', 40, 40);

        // Move away from gate
        mockCanvasAndDispatch(canvas, 'mousemove', 500, 500);

        expect(tooltip?.style.display).toBe('none');
      });

      it('should display gate type and name in tooltip', () => {
        renderer.mount(container);
        renderer.updateState({ circuitData: sampleCircuitData });
        // Reset auto-centering offset so screen coords match canvas coords
        renderer.setOffset(0, 0);

        const canvas = renderer.getCanvas()!;
        const tooltip = container.querySelector('.da-gate-tooltip') as HTMLElement;

        // Hover over first gate (AND1)
        mockCanvasAndDispatch(canvas, 'mousemove', 40, 40);

        expect(tooltip?.textContent).toContain('AND');
        expect(tooltip?.textContent).toContain('AND1');
      });

      it('should remove tooltip element on destroy', () => {
        renderer.mount(container);
        renderer.destroy();

        const tooltip = container.querySelector('.da-gate-tooltip');
        expect(tooltip).toBeNull();
      });
    });

    describe('hover highlight rendering', () => {
      // Helper to dispatch mouse events after mocking canvas rect
      function mockCanvasAndDispatch(
        canvas: HTMLCanvasElement,
        eventType: string,
        canvasX: number,
        canvasY: number
      ): void {
        vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue(originRect);
        canvas.dispatchEvent(new MouseEvent(eventType, {
          clientX: canvasX,
          clientY: canvasY,
          bubbles: true,
        }));
      }

      it('should request re-render when hover state changes', () => {
        renderer.mount(container);
        renderer.updateState({ circuitData: sampleCircuitData });
        // Reset auto-centering offset so screen coords match canvas coords
        renderer.setOffset(0, 0);

        const canvas = renderer.getCanvas()!;

        // Clear any mocks from setup
        mockFillRect.mockClear();

        // Hover over gate - this should trigger a render
        mockCanvasAndDispatch(canvas, 'mousemove', 40, 40);

        // Verify render was called (fillRect is used in render for background)
        expect(mockFillRect).toHaveBeenCalled();
      });

      it('should draw highlight glow when gate is hovered (AC #4)', () => {
        renderer.mount(container);
        renderer.updateState({ circuitData: sampleCircuitData });
        // Reset auto-centering offset so screen coords match canvas coords
        renderer.setOffset(0, 0);

        const canvas = renderer.getCanvas()!;
        const ctx = renderer.getContext()!;

        // Hover over gate
        mockCanvasAndDispatch(canvas, 'mousemove', 40, 40);
        expect(renderer.getHoveredGateId()).toBe(1);

        // Verify shadow (glow) was applied during render
        // The GateRenderer sets shadowBlur=8 and shadowColor for hover highlight
        expect(ctx.shadowBlur).toBeDefined();
      });

      it('should not show tooltip during drag even when over gate (AC validation)', () => {
        renderer.mount(container);
        renderer.updateState({ circuitData: sampleCircuitData });
        renderer.setZoom(2.0); // Enable panning
        renderer.setOffset(0, 0); // Reset offset for predictable coords

        const canvas = renderer.getCanvas()!;
        const tooltip = container.querySelector('.da-gate-tooltip') as HTMLElement;

        // Start drag on the canvas
        mockCanvasAndDispatch(canvas, 'mousedown', 40, 40);

        // Tooltip should remain hidden during drag
        expect(tooltip?.style.display).toBe('none');

        // Mouse move during drag should NOT show tooltip
        mockCanvasAndDispatch(canvas, 'mousemove', 40, 40);
        expect(tooltip?.style.display).toBe('none');

        // End drag
        document.dispatchEvent(new MouseEvent('mouseup', {
          clientX: 40,
          clientY: 40,
          bubbles: true,
        }));
      });
    });

    describe('event handler cleanup', () => {
      it('should remove hover event handlers on destroy', () => {
        renderer.mount(container);
        const canvas = renderer.getCanvas();

        const removeEventListenerSpy = vi.spyOn(canvas!, 'removeEventListener');
        renderer.destroy();

        // Verify mousemove handler was removed
        expect(removeEventListenerSpy).toHaveBeenCalledWith(
          'mousemove',
          expect.any(Function)
        );
      });

      it('should remove mouseleave handler on destroy', () => {
        renderer.mount(container);
        const canvas = renderer.getCanvas();

        const removeEventListenerSpy = vi.spyOn(canvas!, 'removeEventListener');
        renderer.destroy();

        expect(removeEventListenerSpy).toHaveBeenCalledWith(
          'mouseleave',
          expect.any(Function)
        );
      });
    });
  });

  // ============================================================================
  // Story 6.9: Code-to-Circuit Linking Tests
  // ============================================================================
  describe('Code-to-Circuit Linking (Story 6.9)', () => {
    describe('setHighlightedGates', () => {
      it('should store highlighted gate IDs', () => {
        renderer = new CircuitRenderer();
        renderer.mount(container);

        renderer.setHighlightedGates([1, 2, 3]);

        const highlighted = renderer.getHighlightedGateIds();
        expect(highlighted.has(1)).toBe(true);
        expect(highlighted.has(2)).toBe(true);
        expect(highlighted.has(3)).toBe(true);
        expect(highlighted.size).toBe(3);

        renderer.destroy();
      });

      it('should clear previous highlights when setting new ones', () => {
        renderer = new CircuitRenderer();
        renderer.mount(container);

        renderer.setHighlightedGates([1, 2]);
        renderer.setHighlightedGates([3, 4]);

        const highlighted = renderer.getHighlightedGateIds();
        expect(highlighted.has(1)).toBe(false);
        expect(highlighted.has(2)).toBe(false);
        expect(highlighted.has(3)).toBe(true);
        expect(highlighted.has(4)).toBe(true);

        renderer.destroy();
      });

      it('should clear all highlights when passed empty array', () => {
        renderer = new CircuitRenderer();
        renderer.mount(container);

        renderer.setHighlightedGates([1, 2, 3]);
        renderer.setHighlightedGates([]);

        expect(renderer.getHighlightedGateIds().size).toBe(0);

        renderer.destroy();
      });

      it('should request re-render when highlights change', () => {
        renderer = new CircuitRenderer();
        renderer.mount(container);
        mockFillRect.mockClear();

        renderer.setHighlightedGates([1, 2]);

        // render() is called which clears and redraws
        expect(mockFillRect).toHaveBeenCalled();

        renderer.destroy();
      });

      it('should validate gate IDs against circuit model and filter invalid ones', () => {
        renderer = new CircuitRenderer();
        renderer.mount(container);

        // Load circuit with gates 0 and 1
        const circuitWithGates: CircuitData = {
          cycle: 0,
          stable: true,
          wires: [],
          gates: [
            { id: 0, name: 'AND1', type: 'AND', inputs: [], outputs: [] },
            { id: 1, name: 'OR1', type: 'OR', inputs: [], outputs: [] },
          ],
        };
        renderer.updateState({ circuitData: circuitWithGates });

        // Try to highlight gates 0, 1, 2, 99 - only 0 and 1 exist
        renderer.setHighlightedGates([0, 1, 2, 99]);

        const highlighted = renderer.getHighlightedGateIds();
        expect(highlighted.has(0)).toBe(true);
        expect(highlighted.has(1)).toBe(true);
        expect(highlighted.has(2)).toBe(false); // Invalid - filtered out
        expect(highlighted.has(99)).toBe(false); // Invalid - filtered out
        expect(highlighted.size).toBe(2);

        renderer.destroy();
      });

      it('should accept all gate IDs when no circuit model is loaded', () => {
        renderer = new CircuitRenderer();
        renderer.mount(container);

        // No circuit loaded - all IDs should be accepted
        renderer.setHighlightedGates([0, 1, 99, 999]);

        const highlighted = renderer.getHighlightedGateIds();
        expect(highlighted.size).toBe(4);
        expect(highlighted.has(0)).toBe(true);
        expect(highlighted.has(999)).toBe(true);

        renderer.destroy();
      });
    });

    describe('setHighlightedGates wire segment validation', () => {
      it('should validate wire segments against circuit model and filter invalid ones', () => {
        renderer = new CircuitRenderer();
        renderer.mount(container);

        // Load circuit with specific wires
        const circuitWithWires: CircuitData = {
          cycle: 0,
          stable: true,
          wires: [
            { id: 0, name: 'w0', width: 1, is_input: false, is_output: false, state: [0] },
            { id: 1, name: 'w1', width: 4, is_input: false, is_output: false, state: [0, 0, 0, 0] }, // 4-bit wire
          ],
          gates: [{ id: 0, name: 'AND1', type: 'AND', inputs: [], outputs: [] }],
        };
        renderer.updateState({ circuitData: circuitWithWires });

        // Try to highlight wire segments - mix of valid and invalid
        // Valid: [0, 0] (wire 0, bit 0), [1, 0], [1, 3] (wire 1, bits 0-3)
        // Invalid: [1, 5] (bit 5 exceeds width 4), [99, 0] (wire 99 doesn't exist)
        renderer.setHighlightedGates([0], [[0, 0], [1, 0], [1, 3], [1, 5], [99, 0]]);

        expect(renderer.isWireSegmentHighlighted(0, 0)).toBe(true);
        expect(renderer.isWireSegmentHighlighted(1, 0)).toBe(true);
        expect(renderer.isWireSegmentHighlighted(1, 3)).toBe(true);
        expect(renderer.isWireSegmentHighlighted(1, 5)).toBe(false); // Invalid bit index
        expect(renderer.isWireSegmentHighlighted(99, 0)).toBe(false); // Invalid wire ID

        renderer.destroy();
      });

      it('should filter out malformed wire segment entries', () => {
        renderer = new CircuitRenderer();
        renderer.mount(container);

        const circuitWithWires: CircuitData = {
          cycle: 0,
          stable: true,
          wires: [{ id: 0, name: 'w0', width: 1, is_input: false, is_output: false, state: [0] }],
          gates: [{ id: 0, name: 'AND1', type: 'AND', inputs: [], outputs: [] }],
        };
        renderer.updateState({ circuitData: circuitWithWires });

        // Include malformed entries (wrong length arrays)
        renderer.setHighlightedGates([0], [[0, 0], [1], [0, 0, 0], []]);

        // Only [0, 0] should be valid
        expect(renderer.isWireSegmentHighlighted(0, 0)).toBe(true);

        renderer.destroy();
      });

      it('should set highlightedWireSegments to null when all segments are invalid', () => {
        renderer = new CircuitRenderer();
        renderer.mount(container);

        const circuitWithWires: CircuitData = {
          cycle: 0,
          stable: true,
          wires: [{ id: 0, name: 'w0', width: 1, is_input: false, is_output: false, state: [0] }],
          gates: [{ id: 0, name: 'AND1', type: 'AND', inputs: [], outputs: [] }],
        };
        renderer.updateState({ circuitData: circuitWithWires });

        // All invalid wire segments
        renderer.setHighlightedGates([0], [[99, 0], [0, 5]]);

        // No segments should be highlighted
        expect(renderer.isWireSegmentHighlighted(99, 0)).toBe(false);
        expect(renderer.isWireSegmentHighlighted(0, 5)).toBe(false);
        expect(renderer.isWireSegmentHighlighted(0, 0)).toBe(false);

        renderer.destroy();
      });
    });

    describe('clearHighlightedGates', () => {
      it('should clear all highlighted gates', () => {
        renderer = new CircuitRenderer();
        renderer.mount(container);

        renderer.setHighlightedGates([1, 2, 3]);
        renderer.clearHighlightedGates();

        expect(renderer.getHighlightedGateIds().size).toBe(0);

        renderer.destroy();
      });

      it('should not re-render if already empty', () => {
        renderer = new CircuitRenderer();
        renderer.mount(container);
        mockFillRect.mockClear();

        // Clear when already empty
        renderer.clearHighlightedGates();
        const callCount = mockFillRect.mock.calls.length;

        // Clear again - should not call render
        renderer.clearHighlightedGates();
        expect(mockFillRect.mock.calls.length).toBe(callCount);

        renderer.destroy();
      });
    });

    describe('isWireSegmentHighlighted', () => {
      it('should return true for highlighted wire segments', () => {
        renderer = new CircuitRenderer();
        renderer.mount(container);

        renderer.setHighlightedGates([1], [[5, 0], [6, 1]]);

        expect(renderer.isWireSegmentHighlighted(5, 0)).toBe(true);
        expect(renderer.isWireSegmentHighlighted(6, 1)).toBe(true);

        renderer.destroy();
      });

      it('should return false for non-highlighted wire segments', () => {
        renderer = new CircuitRenderer();
        renderer.mount(container);

        renderer.setHighlightedGates([1], [[5, 0]]);

        expect(renderer.isWireSegmentHighlighted(5, 1)).toBe(false);
        expect(renderer.isWireSegmentHighlighted(7, 0)).toBe(false);

        renderer.destroy();
      });

      it('should return false when no wire segments are highlighted', () => {
        renderer = new CircuitRenderer();
        renderer.mount(container);

        renderer.setHighlightedGates([1, 2]);

        expect(renderer.isWireSegmentHighlighted(5, 0)).toBe(false);

        renderer.destroy();
      });
    });

    describe('getHighlightedGateIds', () => {
      it('should return empty set when no gates highlighted', () => {
        renderer = new CircuitRenderer();
        renderer.mount(container);

        expect(renderer.getHighlightedGateIds().size).toBe(0);

        renderer.destroy();
      });
    });

    describe('click handler for clearing highlights', () => {
      it('should clear highlights when clicking on empty canvas space', () => {
        renderer = new CircuitRenderer();
        renderer.mount(container);

        // Set some highlights
        renderer.setHighlightedGates([1, 2, 3]);
        expect(renderer.getHighlightedGateIds().size).toBe(3);

        // Simulate click on empty space (no circuit loaded, so hitTest returns null)
        const canvas = container.querySelector('canvas')!;
        const clickEvent = new MouseEvent('click', {
          clientX: 100,
          clientY: 100,
          bubbles: true,
        });
        canvas.dispatchEvent(clickEvent);

        // Highlights should be cleared
        expect(renderer.getHighlightedGateIds().size).toBe(0);

        renderer.destroy();
      });

      it('should not clear highlights after a drag operation', () => {
        // Create renderer with zoom set to allow panning
        renderer = new CircuitRenderer({
          zoom: {
            initialScale: 2.0, // Zoom in to allow panning
          },
        });
        renderer.mount(container);

        // Set some highlights
        renderer.setHighlightedGates([1, 2, 3]);
        expect(renderer.getHighlightedGateIds().size).toBe(3);

        const canvas = container.querySelector('canvas')!;

        // Simulate mousedown
        const mousedownEvent = new MouseEvent('mousedown', {
          clientX: 100,
          clientY: 100,
          button: 0,
          bubbles: true,
        });
        canvas.dispatchEvent(mousedownEvent);

        // Simulate mousemove with significant movement (drag)
        const mousemoveEvent = new MouseEvent('mousemove', {
          clientX: 150, // 50px movement
          clientY: 150,
          bubbles: true,
        });
        document.dispatchEvent(mousemoveEvent);

        // Simulate mouseup
        const mouseupEvent = new MouseEvent('mouseup', {
          clientX: 150,
          clientY: 150,
          bubbles: true,
        });
        document.dispatchEvent(mouseupEvent);

        // Simulate click (which fires after mouseup on canvas)
        const clickEvent = new MouseEvent('click', {
          clientX: 150,
          clientY: 150,
          bubbles: true,
        });
        canvas.dispatchEvent(clickEvent);

        // Highlights should NOT be cleared because this was a drag
        expect(renderer.getHighlightedGateIds().size).toBe(3);

        renderer.destroy();
      });
    });
  });
});
