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

    // Mock getComputedStyle for theme background
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (prop: string) => {
        if (prop === '--da-bg-primary') {
          return '#1a1a2e';
        }
        return '';
      },
    } as CSSStyleDeclaration);

    // Create mock canvas context
    mockFillRect = vi.fn();
    mockScale = vi.fn();
    mockSetTransform = vi.fn();

    mockCtx = {
      fillRect: mockFillRect,
      scale: mockScale,
      setTransform: mockSetTransform,
      fillStyle: '',
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
      } as CSSStyleDeclaration);

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
});
