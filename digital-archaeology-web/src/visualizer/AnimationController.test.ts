// src/visualizer/AnimationController.test.ts
// Unit tests for AnimationController (Story 6.5)

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AnimationController,
  DEFAULT_ANIMATION_CONFIG,
  getAnimationDurationFromCSS,
} from './AnimationController';

describe('AnimationController', () => {
  let controller: AnimationController;
  let rafCallbacks: Array<{ id: number; callback: FrameRequestCallback }>;
  let nextRafId: number;
  let currentTime: number;

  beforeEach(() => {
    controller = new AnimationController();
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper to advance animation by executing pending callbacks
  function advanceFrame(deltaMs: number): void {
    currentTime += deltaMs;
    const callbacks = [...rafCallbacks];
    rafCallbacks = [];
    callbacks.forEach(({ callback }) => callback(currentTime));
  }

  describe('DEFAULT_ANIMATION_CONFIG', () => {
    it('should have 500ms default duration', () => {
      expect(DEFAULT_ANIMATION_CONFIG.duration).toBe(500);
    });

    it('should have 30 target fps', () => {
      expect(DEFAULT_ANIMATION_CONFIG.targetFps).toBe(30);
    });
  });

  describe('constructor', () => {
    it('should create controller with default config', () => {
      const config = controller.getConfig();
      expect(config.duration).toBe(500);
      expect(config.targetFps).toBe(30);
    });

    it('should accept custom config', () => {
      const customController = new AnimationController({ duration: 1000, targetFps: 60 });
      const config = customController.getConfig();
      expect(config.duration).toBe(1000);
      expect(config.targetFps).toBe(60);
    });
  });

  describe('startAnimation()', () => {
    it('should start animation and set isAnimating to true', () => {
      expect(controller.isAnimating).toBe(false);
      controller.startAnimation();
      expect(controller.isAnimating).toBe(true);
    });

    it('should request animation frame', () => {
      controller.startAnimation();
      expect(window.requestAnimationFrame).toHaveBeenCalled();
    });

    it('should use provided duration', () => {
      const frameCallback = vi.fn();
      controller.onFrame(frameCallback);
      controller.startAnimation(1000);

      // At 500ms, should be at 50% progress for 1000ms duration
      advanceFrame(500);
      expect(frameCallback).toHaveBeenCalledWith(0.5);
    });

    it('should stop previous animation when starting new one', () => {
      controller.startAnimation();
      const firstRafId = rafCallbacks[0]?.id;

      controller.startAnimation();
      expect(window.cancelAnimationFrame).toHaveBeenCalledWith(firstRafId);
    });
  });

  describe('stopAnimation()', () => {
    it('should cancel pending animation frame', () => {
      controller.startAnimation();
      const rafId = rafCallbacks[0]?.id;

      controller.stopAnimation();
      expect(window.cancelAnimationFrame).toHaveBeenCalledWith(rafId);
    });

    it('should set isAnimating to false', () => {
      controller.startAnimation();
      expect(controller.isAnimating).toBe(true);

      controller.stopAnimation();
      expect(controller.isAnimating).toBe(false);
    });

    it('should be safe to call when not animating', () => {
      expect(() => controller.stopAnimation()).not.toThrow();
    });
  });

  describe('isAnimating', () => {
    it('should return false before starting', () => {
      expect(controller.isAnimating).toBe(false);
    });

    it('should return true while animating', () => {
      controller.startAnimation();
      expect(controller.isAnimating).toBe(true);
    });

    it('should return false after animation completes', () => {
      controller.startAnimation(500);
      advanceFrame(600); // Past completion
      expect(controller.isAnimating).toBe(false);
    });
  });

  describe('onFrame()', () => {
    it('should call callback with progress on each frame', () => {
      const frameCallback = vi.fn();
      controller.onFrame(frameCallback);
      controller.startAnimation(500);

      advanceFrame(250); // 50%
      expect(frameCallback).toHaveBeenCalledWith(0.5);
    });

    it('should call callback multiple times during animation', () => {
      const frameCallback = vi.fn();
      controller.onFrame(frameCallback);
      controller.startAnimation(500);

      advanceFrame(100); // 20%
      advanceFrame(100); // 40%
      advanceFrame(100); // 60%

      expect(frameCallback).toHaveBeenCalledTimes(3);
    });

    it('should clamp progress to 1.0 at completion', () => {
      const frameCallback = vi.fn();
      controller.onFrame(frameCallback);
      controller.startAnimation(500);

      advanceFrame(600); // Past 100%
      expect(frameCallback).toHaveBeenCalledWith(1.0);
    });

    it('should return controller for chaining', () => {
      const result = controller.onFrame(() => {});
      expect(result).toBe(controller);
    });
  });

  describe('onComplete()', () => {
    it('should call callback when animation completes', () => {
      const completeCallback = vi.fn();
      controller.onComplete(completeCallback);
      controller.startAnimation(500);

      advanceFrame(600); // Past completion
      expect(completeCallback).toHaveBeenCalled();
    });

    it('should call callback only once', () => {
      const completeCallback = vi.fn();
      controller.onComplete(completeCallback);
      controller.startAnimation(500);

      advanceFrame(600);
      advanceFrame(100); // Additional frame after completion

      expect(completeCallback).toHaveBeenCalledTimes(1);
    });

    it('should not call callback if stopped early', () => {
      const completeCallback = vi.fn();
      controller.onComplete(completeCallback);
      controller.startAnimation(500);

      advanceFrame(250);
      controller.stopAnimation();

      expect(completeCallback).not.toHaveBeenCalled();
    });

    it('should return controller for chaining', () => {
      const result = controller.onComplete(() => {});
      expect(result).toBe(controller);
    });
  });

  describe('animation timing', () => {
    it('should complete within duration limit', () => {
      const completeCallback = vi.fn();
      controller.onComplete(completeCallback);
      controller.startAnimation(500);

      advanceFrame(500); // Exactly at duration
      expect(completeCallback).toHaveBeenCalled();
    });

    it('should animate at approximately 30fps (33ms intervals)', () => {
      const frameCallback = vi.fn();
      controller.onFrame(frameCallback);
      controller.startAnimation(500);

      // Simulate 30fps timing - use 34ms to exceed the 33.33ms threshold
      // At 30fps, frameInterval = 1000/30 = 33.33ms
      for (let i = 0; i < 15; i++) {
        advanceFrame(34);
      }

      // Should have received frames at ~30fps rate
      // With 34ms intervals exceeding 33.33ms threshold, each advance fires
      expect(frameCallback.mock.calls.length).toBe(15);
    });

    it('should progress linearly over duration', () => {
      const progressValues: number[] = [];
      controller.onFrame((progress) => progressValues.push(progress));
      controller.startAnimation(500);

      advanceFrame(100); // 20%
      advanceFrame(100); // 40%
      advanceFrame(100); // 60%
      advanceFrame(100); // 80%
      advanceFrame(100); // 100%

      expect(progressValues).toEqual([0.2, 0.4, 0.6, 0.8, 1.0]);
    });
  });

  describe('getConfig()', () => {
    it('should return current configuration', () => {
      const config = controller.getConfig();
      expect(config).toEqual(DEFAULT_ANIMATION_CONFIG);
    });

    it('should return a copy of config', () => {
      const config1 = controller.getConfig();
      config1.duration = 9999;
      const config2 = controller.getConfig();
      expect(config2.duration).toBe(500);
    });
  });

  describe('updateConfig()', () => {
    it('should update configuration partially', () => {
      controller.updateConfig({ duration: 1000 });
      const config = controller.getConfig();
      expect(config.duration).toBe(1000);
      expect(config.targetFps).toBe(30); // Unchanged
    });

    it('should recalculate frame interval when targetFps changes', () => {
      controller.updateConfig({ targetFps: 60 });
      const frameCallback = vi.fn();
      controller.onFrame(frameCallback);
      controller.startAnimation(500);

      // At 60fps, frame interval is ~16.67ms
      // With 17ms intervals, each frame should fire
      advanceFrame(17);
      advanceFrame(17);
      advanceFrame(17);

      // Should get more frames at 60fps vs 30fps
      expect(frameCallback.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('frame throttling', () => {
    it('should throttle frames based on targetFps', () => {
      const frameCallback = vi.fn();
      controller.onFrame(frameCallback);
      controller.startAnimation(500);

      // At 30fps, frame interval is ~33ms
      // Rapid 10ms frames should be throttled
      advanceFrame(10);
      advanceFrame(10);
      advanceFrame(10);
      advanceFrame(10);

      // Only ~1-2 frames should have fired (33ms threshold)
      expect(frameCallback.mock.calls.length).toBeLessThanOrEqual(2);
    });

    it('should always fire frame at completion regardless of throttle', () => {
      const frameCallback = vi.fn();
      controller.onFrame(frameCallback);
      controller.startAnimation(500);

      // Jump straight to completion
      advanceFrame(500);

      // Should have fired at least the completion frame
      expect(frameCallback).toHaveBeenCalledWith(1.0);
    });
  });

  describe('stopAnimation() callback clearing', () => {
    it('should clear callbacks when stopped to prevent memory leaks', () => {
      const frameCallback = vi.fn();
      const completeCallback = vi.fn();

      controller.onFrame(frameCallback);
      controller.onComplete(completeCallback);
      controller.startAnimation(500);

      advanceFrame(100);
      controller.stopAnimation();

      // Start a new animation - old callbacks should be gone
      controller.startAnimation(500);
      advanceFrame(600);

      // Frame callback should not have been called after stop
      // (only the initial call before stop)
      expect(frameCallback).toHaveBeenCalledTimes(1);
    });
  });
});

describe('getAnimationDurationFromCSS()', () => {
  afterEach(() => {
    vi.spyOn(window, 'getComputedStyle').mockRestore?.();
  });

  it('should return default when CSS variable is not set', () => {
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: () => '',
    } as CSSStyleDeclaration);

    expect(getAnimationDurationFromCSS()).toBe(DEFAULT_ANIMATION_CONFIG.duration);
  });

  it('should parse milliseconds format', () => {
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: () => '750ms',
    } as CSSStyleDeclaration);

    expect(getAnimationDurationFromCSS()).toBe(750);
  });

  it('should parse seconds format', () => {
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: () => '0.5s',
    } as CSSStyleDeclaration);

    expect(getAnimationDurationFromCSS()).toBe(500);
  });

  it('should parse plain number', () => {
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: () => '300',
    } as CSSStyleDeclaration);

    expect(getAnimationDurationFromCSS()).toBe(300);
  });

  it('should return default for invalid value', () => {
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: () => 'invalid',
    } as CSSStyleDeclaration);

    expect(getAnimationDurationFromCSS()).toBe(DEFAULT_ANIMATION_CONFIG.duration);
  });
});
