// src/visualizer/ZoomController.test.ts
// Unit tests for ZoomController (Story 6.6)

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ZoomController, DEFAULT_ZOOM_CONFIG } from './ZoomController';
import type { ZoomControllerConfig } from './ZoomController';

describe('ZoomController', () => {
  let controller: ZoomController;

  beforeEach(() => {
    controller = new ZoomController();
  });

  describe('DEFAULT_ZOOM_CONFIG', () => {
    it('should have min scale of 0.25 (25%)', () => {
      expect(DEFAULT_ZOOM_CONFIG.min).toBe(0.25);
    });

    it('should have max scale of 4.0 (400%)', () => {
      expect(DEFAULT_ZOOM_CONFIG.max).toBe(4.0);
    });

    it('should have step of 0.1 (10%)', () => {
      expect(DEFAULT_ZOOM_CONFIG.step).toBe(0.1);
    });
  });

  describe('constructor', () => {
    it('should initialize with default scale of 1.0', () => {
      expect(controller.getScale()).toBe(1.0);
    });

    it('should accept custom configuration', () => {
      const customConfig: Partial<ZoomControllerConfig> = {
        min: 0.5,
        max: 2.0,
        step: 0.25,
      };
      const customController = new ZoomController(customConfig);
      const config = customController.getConfig();

      expect(config.min).toBe(0.5);
      expect(config.max).toBe(2.0);
      expect(config.step).toBe(0.25);
    });

    it('should merge partial config with defaults', () => {
      const partialConfig: Partial<ZoomControllerConfig> = { min: 0.5 };
      const customController = new ZoomController(partialConfig);
      const config = customController.getConfig();

      expect(config.min).toBe(0.5);
      expect(config.max).toBe(DEFAULT_ZOOM_CONFIG.max);
      expect(config.step).toBe(DEFAULT_ZOOM_CONFIG.step);
    });
  });

  describe('getScale()', () => {
    it('should return current zoom scale', () => {
      expect(controller.getScale()).toBe(1.0);
    });
  });

  describe('setScale()', () => {
    it('should set the zoom scale', () => {
      controller.setScale(1.5);
      expect(controller.getScale()).toBe(1.5);
    });

    it('should clamp scale to minimum', () => {
      controller.setScale(0.1); // Below min of 0.25
      expect(controller.getScale()).toBe(0.25);
    });

    it('should clamp scale to maximum', () => {
      controller.setScale(5.0); // Above max of 4.0
      expect(controller.getScale()).toBe(4.0);
    });

    it('should accept scale at exact minimum', () => {
      controller.setScale(0.25);
      expect(controller.getScale()).toBe(0.25);
    });

    it('should accept scale at exact maximum', () => {
      controller.setScale(4.0);
      expect(controller.getScale()).toBe(4.0);
    });
  });

  describe('zoomIn()', () => {
    it('should increase scale by default step', () => {
      controller.zoomIn();
      expect(controller.getScale()).toBeCloseTo(1.1, 5);
    });

    it('should increase scale by custom step', () => {
      controller.zoomIn(0.5);
      expect(controller.getScale()).toBe(1.5);
    });

    it('should not exceed maximum scale', () => {
      controller.setScale(3.95);
      controller.zoomIn();
      expect(controller.getScale()).toBe(4.0);
    });

    it('should clamp at maximum when step would exceed', () => {
      controller.setScale(3.9);
      controller.zoomIn(0.5);
      expect(controller.getScale()).toBe(4.0);
    });
  });

  describe('zoomOut()', () => {
    it('should decrease scale by default step', () => {
      controller.zoomOut();
      expect(controller.getScale()).toBeCloseTo(0.9, 5);
    });

    it('should decrease scale by custom step', () => {
      controller.zoomOut(0.5);
      expect(controller.getScale()).toBe(0.5);
    });

    it('should not go below minimum scale', () => {
      controller.setScale(0.3);
      controller.zoomOut();
      expect(controller.getScale()).toBe(0.25);
    });

    it('should clamp at minimum when step would exceed', () => {
      controller.setScale(0.4);
      controller.zoomOut(0.5);
      expect(controller.getScale()).toBe(0.25);
    });
  });

  describe('zoomToFit()', () => {
    it('should calculate scale to fit content in viewport', () => {
      // Content: 200x100, Viewport: 400x400
      // ScaleX = 400/200 = 2.0, ScaleY = 400/100 = 4.0
      // Min(2.0, 4.0) * 0.9 = 1.8
      const scale = controller.zoomToFit(200, 100, 400, 400);
      expect(scale).toBeCloseTo(1.8, 5);
      expect(controller.getScale()).toBeCloseTo(1.8, 5);
    });

    it('should handle landscape content in square viewport', () => {
      // Content: 400x100, Viewport: 200x200
      // ScaleX = 200/400 = 0.5, ScaleY = 200/100 = 2.0
      // Min(0.5, 2.0) * 0.9 = 0.45
      const scale = controller.zoomToFit(400, 100, 200, 200);
      expect(scale).toBeCloseTo(0.45, 5);
    });

    it('should handle portrait content in square viewport', () => {
      // Content: 100x400, Viewport: 200x200
      // ScaleX = 200/100 = 2.0, ScaleY = 200/400 = 0.5
      // Min(2.0, 0.5) * 0.9 = 0.45
      const scale = controller.zoomToFit(100, 400, 200, 200);
      expect(scale).toBeCloseTo(0.45, 5);
    });

    it('should clamp to minimum scale', () => {
      // Very large content that would require < 0.25 scale
      // Content: 10000x10000, Viewport: 100x100
      // Scale = 100/10000 * 0.9 = 0.009 -> clamps to 0.25
      const scale = controller.zoomToFit(10000, 10000, 100, 100);
      expect(scale).toBe(0.25);
    });

    it('should clamp to maximum scale', () => {
      // Very small content that would require > 4.0 scale
      // Content: 10x10, Viewport: 1000x1000
      // Scale = 1000/10 * 0.9 = 90 -> clamps to 4.0
      const scale = controller.zoomToFit(10, 10, 1000, 1000);
      expect(scale).toBe(4.0);
    });

    it('should handle zero content dimensions gracefully', () => {
      const scale = controller.zoomToFit(0, 0, 400, 400);
      expect(scale).toBe(1.0); // Should return default scale
    });

    it('should handle zero viewport dimensions gracefully', () => {
      const scale = controller.zoomToFit(200, 200, 0, 0);
      expect(scale).toBe(1.0); // Should return default scale
    });
  });

  describe('reset()', () => {
    it('should reset scale to 1.0', () => {
      controller.setScale(2.5);
      controller.reset();
      expect(controller.getScale()).toBe(1.0);
    });

    it('should reset from minimum scale', () => {
      controller.setScale(0.25);
      controller.reset();
      expect(controller.getScale()).toBe(1.0);
    });

    it('should reset from maximum scale', () => {
      controller.setScale(4.0);
      controller.reset();
      expect(controller.getScale()).toBe(1.0);
    });
  });

  describe('getDisplayPercent()', () => {
    it('should format 1.0 as "100%"', () => {
      expect(controller.getDisplayPercent()).toBe('100%');
    });

    it('should format 0.25 as "25%"', () => {
      controller.setScale(0.25);
      expect(controller.getDisplayPercent()).toBe('25%');
    });

    it('should format 4.0 as "400%"', () => {
      controller.setScale(4.0);
      expect(controller.getDisplayPercent()).toBe('400%');
    });

    it('should format 0.5 as "50%"', () => {
      controller.setScale(0.5);
      expect(controller.getDisplayPercent()).toBe('50%');
    });

    it('should format 1.5 as "150%"', () => {
      controller.setScale(1.5);
      expect(controller.getDisplayPercent()).toBe('150%');
    });

    it('should round to nearest integer', () => {
      controller.setScale(0.333);
      expect(controller.getDisplayPercent()).toBe('33%');
    });

    it('should round 0.335 to 34%', () => {
      controller.setScale(0.335);
      expect(controller.getDisplayPercent()).toBe('34%');
    });
  });

  describe('getConfig()', () => {
    it('should return current configuration', () => {
      const config = controller.getConfig();
      expect(config.min).toBe(DEFAULT_ZOOM_CONFIG.min);
      expect(config.max).toBe(DEFAULT_ZOOM_CONFIG.max);
      expect(config.step).toBe(DEFAULT_ZOOM_CONFIG.step);
    });

    it('should return a copy, not the original', () => {
      const config1 = controller.getConfig();
      const config2 = controller.getConfig();
      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });

  describe('updateConfig()', () => {
    it('should update configuration partially', () => {
      controller.updateConfig({ min: 0.5, max: 3.0 });
      const config = controller.getConfig();
      expect(config.min).toBe(0.5);
      expect(config.max).toBe(3.0);
      expect(config.step).toBe(DEFAULT_ZOOM_CONFIG.step); // Unchanged
    });

    it('should clamp current scale to new bounds after config update', () => {
      controller.setScale(4.0);
      controller.updateConfig({ max: 2.0 });
      expect(controller.getScale()).toBe(2.0);
    });
  });

  describe('zoomAtPoint()', () => {
    it('should zoom in when zoomIn is true', () => {
      controller.zoomAtPoint(100, 100, true);
      expect(controller.getScale()).toBeCloseTo(1.1, 5);
    });

    it('should zoom out when zoomIn is false', () => {
      controller.zoomAtPoint(100, 100, false);
      expect(controller.getScale()).toBeCloseTo(0.9, 5);
    });

    it('should accept custom step', () => {
      controller.zoomAtPoint(100, 100, true, 0.5);
      expect(controller.getScale()).toBe(1.5);
    });

    it('should clamp at maximum when zooming in', () => {
      controller.setScale(3.95);
      controller.zoomAtPoint(100, 100, true);
      expect(controller.getScale()).toBe(4.0);
    });

    it('should clamp at minimum when zooming out', () => {
      controller.setScale(0.3);
      controller.zoomAtPoint(100, 100, false);
      expect(controller.getScale()).toBe(0.25);
    });

    it('should update offset to maintain point position (basic test)', () => {
      // This tests that offset is updated - full pan behavior is Story 6.7
      const initialOffset = controller.getOffset();
      controller.zoomAtPoint(200, 150, true);
      const newOffset = controller.getOffset();

      // After zoom, offset should change to keep cursor point stable
      // For zoom in at point (200,150), offset shifts to compensate
      expect(newOffset.x).not.toBe(initialOffset.x);
      expect(newOffset.y).not.toBe(initialOffset.y);
    });
  });

  describe('getOffset()', () => {
    it('should return initial offset of (0, 0)', () => {
      const offset = controller.getOffset();
      expect(offset.x).toBe(0);
      expect(offset.y).toBe(0);
    });

    it('should return a copy, not the original', () => {
      const offset1 = controller.getOffset();
      const offset2 = controller.getOffset();
      expect(offset1).not.toBe(offset2);
      expect(offset1).toEqual(offset2);
    });
  });

  describe('setOffset()', () => {
    it('should set the offset', () => {
      controller.setOffset(50, 100);
      const offset = controller.getOffset();
      expect(offset.x).toBe(50);
      expect(offset.y).toBe(100);
    });
  });

  describe('CSS variable reading', () => {
    beforeEach(() => {
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({
        getPropertyValue: (prop: string) => {
          const values: Record<string, string> = {
            '--da-zoom-min': '0.5',
            '--da-zoom-max': '3.0',
          };
          return values[prop] || '';
        },
      } as CSSStyleDeclaration);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should read min from CSS variable when available', () => {
      const ctrl = ZoomController.fromCSSVariables();
      const config = ctrl.getConfig();
      expect(config.min).toBe(0.5);
    });

    it('should read max from CSS variable when available', () => {
      const ctrl = ZoomController.fromCSSVariables();
      const config = ctrl.getConfig();
      expect(config.max).toBe(3.0);
    });

    it('should use defaults when CSS variables are empty', () => {
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({
        getPropertyValue: () => '',
      } as unknown as CSSStyleDeclaration);

      const ctrl = ZoomController.fromCSSVariables();
      const config = ctrl.getConfig();
      expect(config.min).toBe(DEFAULT_ZOOM_CONFIG.min);
      expect(config.max).toBe(DEFAULT_ZOOM_CONFIG.max);
    });
  });

  // Story 6.7: Pan navigation tests
  describe('pan state management (Story 6.7)', () => {
    describe('setContentBounds()', () => {
      it('should set content bounds', () => {
        controller.setContentBounds(800, 600);
        // Content bounds affect offset clamping - tested via pan()
        expect(true).toBe(true); // Bounds are internal, test via behavior
      });
    });

    describe('setViewportSize()', () => {
      it('should set viewport size', () => {
        controller.setViewportSize(400, 300);
        // Viewport size affects offset clamping - tested via pan()
        expect(true).toBe(true); // Size is internal, test via behavior
      });
    });

    describe('pan()', () => {
      it('should add delta to offset', () => {
        controller.pan(50, 30);
        const offset = controller.getOffset();
        expect(offset.x).toBe(50);
        expect(offset.y).toBe(30);
      });

      it('should accumulate multiple pan calls', () => {
        controller.pan(20, 10);
        controller.pan(30, 20);
        const offset = controller.getOffset();
        expect(offset.x).toBe(50);
        expect(offset.y).toBe(30);
      });

      it('should handle negative deltas', () => {
        controller.pan(-25, -15);
        const offset = controller.getOffset();
        expect(offset.x).toBe(-25);
        expect(offset.y).toBe(-15);
      });

      it('should not clamp offset when no content bounds set', () => {
        // Without bounds, panning is unlimited
        controller.pan(10000, 10000);
        const offset = controller.getOffset();
        expect(offset.x).toBe(10000);
        expect(offset.y).toBe(10000);
      });
    });

    describe('offset clamping with bounds', () => {
      beforeEach(() => {
        // Set up: content 800x600, viewport 400x300, scale 1.0
        controller.setContentBounds(800, 600);
        controller.setViewportSize(400, 300);
      });

      it('should clamp offset so content does not move past right edge', () => {
        // Content wider than viewport: can pan left (negative offset) but not past 0
        // Min offset X = viewport - content = 400 - 800 = -400
        // Max offset X = 0 (content left edge at viewport left)
        controller.pan(100, 0); // Try to pan right (positive offset)
        const offset = controller.getOffset();
        expect(offset.x).toBe(0); // Clamped to 0
      });

      it('should clamp offset so content does not move past left edge', () => {
        // Can pan left up to content edge meeting viewport right
        controller.pan(-500, 0); // Try to pan too far left
        const offset = controller.getOffset();
        expect(offset.x).toBe(-400); // Clamped to minX = 400 - 800 = -400
      });

      it('should clamp offset so content does not move past bottom edge', () => {
        controller.pan(0, 100); // Try to pan down (positive offset)
        const offset = controller.getOffset();
        expect(offset.y).toBe(0); // Clamped to 0
      });

      it('should clamp offset so content does not move past top edge', () => {
        // Min offset Y = viewport - content = 300 - 600 = -300
        controller.pan(0, -400); // Try to pan too far up
        const offset = controller.getOffset();
        expect(offset.y).toBe(-300); // Clamped to minY
      });

      it('should allow valid pan within bounds', () => {
        controller.pan(-200, -150); // Valid pan
        const offset = controller.getOffset();
        expect(offset.x).toBe(-200);
        expect(offset.y).toBe(-150);
      });
    });

    describe('offset clamping with zoom', () => {
      beforeEach(() => {
        controller.setContentBounds(400, 300);
        controller.setViewportSize(400, 300);
      });

      it('should adjust clamping based on zoom scale', () => {
        // At 2x zoom: scaled content = 800x600, viewport = 400x300
        // Min offset X = 400 - 800 = -400
        controller.setScale(2.0);
        controller.pan(-500, 0);
        const offset = controller.getOffset();
        expect(offset.x).toBe(-400); // Clamped based on scaled content
      });

      it('should center content when content smaller than viewport at current zoom', () => {
        // At 0.5x zoom: scaled content = 200x150, viewport = 400x300
        // Content fits with room to spare, should center
        controller.setScale(0.5);
        controller.pan(100, 100); // Any pan attempt
        const offset = controller.getOffset();
        // Center X = (400 - 200) / 2 = 100
        // Center Y = (300 - 150) / 2 = 75
        expect(offset.x).toBe(100);
        expect(offset.y).toBe(75);
      });

      it('should re-clamp offset when scale changes', () => {
        controller.setScale(2.0);
        controller.pan(-400, -300);
        expect(controller.getOffset().x).toBe(-400);

        // Now reduce zoom - offset should re-clamp
        controller.setScale(1.0);
        // At 1x: content = viewport, so offset should be 0 (centered/no pan needed)
        const offset = controller.getOffset();
        expect(offset.x).toBe(0);
        expect(offset.y).toBe(0);
      });
    });

    describe('isPanningAllowed()', () => {
      it('should return true when zoomed in beyond 1.0', () => {
        controller.setScale(1.5);
        expect(controller.isPanningAllowed()).toBe(true);
      });

      it('should return false at default zoom with no content bounds', () => {
        expect(controller.isPanningAllowed()).toBe(false);
      });

      it('should return true when content exceeds viewport at current zoom', () => {
        controller.setContentBounds(800, 600);
        controller.setViewportSize(400, 300);
        // Content (800x600) > viewport (400x300) at scale 1.0
        expect(controller.isPanningAllowed()).toBe(true);
      });

      it('should return false when content fits in viewport at current zoom', () => {
        controller.setContentBounds(200, 150);
        controller.setViewportSize(400, 300);
        // Content (200x150) < viewport (400x300) at scale 1.0
        expect(controller.isPanningAllowed()).toBe(false);
      });

      it('should return true when zoom makes content exceed viewport', () => {
        controller.setContentBounds(300, 200);
        controller.setViewportSize(400, 300);
        // At 1.0: content fits (300x200 < 400x300)
        expect(controller.isPanningAllowed()).toBe(false);
        // At 2.0: scaled content (600x400) > viewport (400x300)
        controller.setScale(2.0);
        expect(controller.isPanningAllowed()).toBe(true);
      });
    });

    describe('reset() clears offset', () => {
      it('should reset offset to (0, 0) when reset is called', () => {
        controller.setContentBounds(800, 600);
        controller.setViewportSize(400, 300);
        controller.pan(-200, -150);
        expect(controller.getOffset().x).toBe(-200);

        controller.reset();
        const offset = controller.getOffset();
        expect(offset.x).toBe(0);
        expect(offset.y).toBe(0);
      });
    });

    describe('pan() notifyChange behavior', () => {
      it('should call onChange callback when pan changes offset', () => {
        const callback = vi.fn();
        controller.setOnChange(callback);

        controller.pan(50, 30);

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith(1.0, '100%');
      });

      it('should not call onChange if offset does not change (clamped to same value)', () => {
        const callback = vi.fn();
        controller.setContentBounds(400, 300);
        controller.setViewportSize(400, 300);
        // At scale 1.0, content = viewport, so offset is always centered at 0,0
        controller.setOnChange(callback);
        callback.mockClear();

        controller.pan(100, 100); // Will be clamped back to 0,0

        // Should not call because offset didn't actually change
        expect(callback).not.toHaveBeenCalled();
      });

      it('should call onChange multiple times for multiple pan operations', () => {
        const callback = vi.fn();
        controller.setOnChange(callback);

        controller.pan(10, 10);
        controller.pan(20, 20);
        controller.pan(30, 30);

        expect(callback).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('onChange callback', () => {
    it('should call onChange when scale changes via setScale', () => {
      const onChange = vi.fn();
      controller.setOnChange(onChange);
      controller.setScale(1.5);
      expect(onChange).toHaveBeenCalledWith(1.5, '150%');
    });

    it('should call onChange when scale changes via zoomIn', () => {
      const onChange = vi.fn();
      controller.setOnChange(onChange);
      controller.zoomIn();
      expect(onChange).toHaveBeenCalledWith(expect.closeTo(1.1, 5), '110%');
    });

    it('should call onChange when scale changes via zoomOut', () => {
      const onChange = vi.fn();
      controller.setOnChange(onChange);
      controller.zoomOut();
      expect(onChange).toHaveBeenCalledWith(expect.closeTo(0.9, 5), '90%');
    });

    it('should call onChange when scale changes via reset', () => {
      const onChange = vi.fn();
      controller.setScale(2.0);
      controller.setOnChange(onChange);
      controller.reset();
      expect(onChange).toHaveBeenCalledWith(1.0, '100%');
    });

    it('should not call onChange if scale did not change', () => {
      const onChange = vi.fn();
      controller.setOnChange(onChange);
      controller.setScale(1.0); // Same as current
      expect(onChange).not.toHaveBeenCalled();
    });

    it('should allow removing onChange callback', () => {
      const onChange = vi.fn();
      controller.setOnChange(onChange);
      controller.setOnChange(null);
      controller.setScale(1.5);
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
