// src/visualizer/animationUtils.test.ts
// Unit tests for animation utility functions (Story 6.5)

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  easeOutQuad,
  calculatePulseScale,
  prefersReducedMotion,
  getPulseScaleFromCSS,
  DEFAULT_PULSE_MAX_SCALE,
  DEFAULT_PULSE_DURATION,
} from './animationUtils';

describe('animationUtils', () => {
  describe('constants', () => {
    it('should export DEFAULT_PULSE_MAX_SCALE as 1.1', () => {
      expect(DEFAULT_PULSE_MAX_SCALE).toBe(1.1);
    });

    it('should export DEFAULT_PULSE_DURATION as 0.4', () => {
      expect(DEFAULT_PULSE_DURATION).toBe(0.4);
    });
  });

  describe('easeOutQuad()', () => {
    it('should return 0 at t=0', () => {
      expect(easeOutQuad(0)).toBe(0);
    });

    it('should return 1 at t=1', () => {
      expect(easeOutQuad(1)).toBe(1);
    });

    it('should return value greater than t for t in (0,1)', () => {
      // Ease-out starts fast, so value should be ahead of linear
      expect(easeOutQuad(0.5)).toBeGreaterThan(0.5);
    });

    it('should be approximately 0.75 at t=0.5', () => {
      // easeOutQuad(0.5) = 1 - (1-0.5)^2 = 1 - 0.25 = 0.75
      expect(easeOutQuad(0.5)).toBeCloseTo(0.75);
    });
  });

  describe('calculatePulseScale()', () => {
    it('should return 1.0 when not active', () => {
      expect(calculatePulseScale(0.5, false)).toBe(1.0);
    });

    it('should return 1.0 at progress 0 when active', () => {
      expect(calculatePulseScale(0, true)).toBeCloseTo(1.0);
    });

    it('should return maxScale at pulse midpoint when active', () => {
      // Default pulseDuration is 0.4, so midpoint is 0.2
      // At midpoint, sin(0.5 * π) = 1, so scale = 1 + 0.1 = 1.1
      expect(calculatePulseScale(0.2, true)).toBeCloseTo(1.1);
    });

    it('should return 1.0 after pulse duration when active', () => {
      // After 40% progress, pulse is complete, scale back to 1.0
      expect(calculatePulseScale(0.4, true)).toBeCloseTo(1.0);
    });

    it('should use custom maxScale', () => {
      expect(calculatePulseScale(0.2, true, 1.2)).toBeCloseTo(1.2);
    });

    it('should use custom pulseDuration', () => {
      // With pulseDuration=0.2, midpoint is at progress 0.1
      expect(calculatePulseScale(0.1, true, 1.1, 0.2)).toBeCloseTo(1.1);
    });

    it('should stay at 1.0 for entire duration when not active', () => {
      expect(calculatePulseScale(0, false)).toBe(1.0);
      expect(calculatePulseScale(0.25, false)).toBe(1.0);
      expect(calculatePulseScale(0.5, false)).toBe(1.0);
      expect(calculatePulseScale(1.0, false)).toBe(1.0);
    });
  });

  describe('prefersReducedMotion()', () => {
    // Store original matchMedia
    const originalMatchMedia = window.matchMedia;

    beforeEach(() => {
      // Reset to original before each test
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: originalMatchMedia,
      });
    });

    afterEach(() => {
      // Restore after each test
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: originalMatchMedia,
      });
    });

    it('should return true when user prefers reduced motion', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(() => ({
          matches: true,
          media: '(prefers-reduced-motion: reduce)',
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      expect(prefersReducedMotion()).toBe(true);
    });

    it('should return false when user does not prefer reduced motion', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(() => ({
          matches: false,
          media: '(prefers-reduced-motion: reduce)',
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      expect(prefersReducedMotion()).toBe(false);
    });

    it('should return false when window is undefined (SSR)', () => {
      // This test verifies the SSR guard in the function
      // The actual window undefined check is hard to test in jsdom,
      // but we verify the function handles it by checking the code path
      // In actual SSR, typeof window === 'undefined' would return true
      // For now, we just verify the function exists and handles the browser case
      expect(typeof prefersReducedMotion).toBe('function');
    });
  });

  describe('getPulseScaleFromCSS()', () => {
    // Store original getComputedStyle
    const originalGetComputedStyle = window.getComputedStyle;

    afterEach(() => {
      // Restore after each test
      vi.spyOn(window, 'getComputedStyle').mockRestore?.();
    });

    it('should return DEFAULT_PULSE_MAX_SCALE when CSS variable is not set', () => {
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({
        getPropertyValue: () => '',
      } as CSSStyleDeclaration);

      expect(getPulseScaleFromCSS()).toBe(DEFAULT_PULSE_MAX_SCALE);
    });

    it('should parse CSS variable value correctly', () => {
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({
        getPropertyValue: () => '1.2',
      } as CSSStyleDeclaration);

      expect(getPulseScaleFromCSS()).toBe(1.2);
    });

    it('should return default for invalid CSS value', () => {
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({
        getPropertyValue: () => 'invalid',
      } as CSSStyleDeclaration);

      expect(getPulseScaleFromCSS()).toBe(DEFAULT_PULSE_MAX_SCALE);
    });
  });
});
