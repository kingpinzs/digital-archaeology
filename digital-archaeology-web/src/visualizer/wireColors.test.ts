// src/visualizer/wireColors.test.ts
// Unit tests for wire color utilities (Story 6.4)

import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  getWireColor,
  DEFAULT_WIRE_COLORS,
  WIRE_COLOR_VARS,
} from './wireColors';

describe('wireColors', () => {
  describe('DEFAULT_WIRE_COLORS', () => {
    it('should have bright green for high signal', () => {
      expect(DEFAULT_WIRE_COLORS.high).toBe('#00ff88');
    });

    it('should have dim gray for low signal', () => {
      expect(DEFAULT_WIRE_COLORS.low).toBe('#3a3a3a');
    });

    it('should have orange for unknown signal', () => {
      expect(DEFAULT_WIRE_COLORS.unknown).toBe('#ffaa00');
    });
  });

  describe('WIRE_COLOR_VARS', () => {
    it('should have correct CSS variable name for high', () => {
      expect(WIRE_COLOR_VARS.high).toBe('--da-wire-high');
    });

    it('should have correct CSS variable name for low', () => {
      expect(WIRE_COLOR_VARS.low).toBe('--da-wire-low');
    });

    it('should have correct CSS variable name for unknown', () => {
      expect(WIRE_COLOR_VARS.unknown).toBe('--da-wire-unknown');
    });
  });

  describe('getWireColor()', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should return high color for signal value 1', () => {
      expect(getWireColor(1)).toBe('#00ff88');
    });

    it('should return low color for signal value 0', () => {
      expect(getWireColor(0)).toBe('#3a3a3a');
    });

    it('should return unknown color for signal value 2', () => {
      expect(getWireColor(2)).toBe('#ffaa00');
    });

    it('should return unknown color for any other value', () => {
      expect(getWireColor(3)).toBe('#ffaa00');
      expect(getWireColor(-1)).toBe('#ffaa00');
      expect(getWireColor(999)).toBe('#ffaa00');
    });

    it('should read high color from CSS variable when available', () => {
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({
        getPropertyValue: (prop: string) => {
          if (prop === '--da-wire-high') return '#11ff99';
          return '';
        },
      } as CSSStyleDeclaration);

      expect(getWireColor(1)).toBe('#11ff99');
    });

    it('should read low color from CSS variable when available', () => {
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({
        getPropertyValue: (prop: string) => {
          if (prop === '--da-wire-low') return '#4a4a4a';
          return '';
        },
      } as CSSStyleDeclaration);

      expect(getWireColor(0)).toBe('#4a4a4a');
    });

    it('should read unknown color from CSS variable when available', () => {
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({
        getPropertyValue: (prop: string) => {
          if (prop === '--da-wire-unknown') return '#ffbb11';
          return '';
        },
      } as CSSStyleDeclaration);

      expect(getWireColor(2)).toBe('#ffbb11');
    });

    it('should fall back to default when CSS variable is empty', () => {
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({
        getPropertyValue: () => '',
      } as unknown as CSSStyleDeclaration);

      expect(getWireColor(1)).toBe('#00ff88');
      expect(getWireColor(0)).toBe('#3a3a3a');
      expect(getWireColor(2)).toBe('#ffaa00');
    });
  });
});
