// src/visualizer/gateColors.test.ts
// Unit tests for gate color utilities (Story 6.3)

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  getGateColor,
  getGateBorderColor,
  getGateTextColor,
  isValidGateType,
  DEFAULT_GATE_COLORS,
  DEFAULT_GATE_STYLE,
  GATE_COLOR_VARS,
  GATE_STYLE_VARS,
} from './gateColors';

describe('gateColors', () => {
  describe('DEFAULT_GATE_COLORS', () => {
    it('should have correct color for AND gate', () => {
      expect(DEFAULT_GATE_COLORS.AND).toBe('#4ecdc4');
    });

    it('should have correct color for OR gate', () => {
      expect(DEFAULT_GATE_COLORS.OR).toBe('#ff6b6b');
    });

    it('should have correct color for XOR gate', () => {
      expect(DEFAULT_GATE_COLORS.XOR).toBe('#c44dff');
    });

    it('should have correct color for NOT gate', () => {
      expect(DEFAULT_GATE_COLORS.NOT).toBe('#ffd93d');
    });

    it('should have correct color for BUF gate', () => {
      expect(DEFAULT_GATE_COLORS.BUF).toBe('#888888');
    });

    it('should have correct color for DFF gate', () => {
      expect(DEFAULT_GATE_COLORS.DFF).toBe('#4d96ff');
    });
  });

  describe('GATE_COLOR_VARS', () => {
    it('should have correct CSS variable name for AND', () => {
      expect(GATE_COLOR_VARS.AND).toBe('--da-gate-and');
    });

    it('should have correct CSS variable name for OR', () => {
      expect(GATE_COLOR_VARS.OR).toBe('--da-gate-or');
    });

    it('should have correct CSS variable name for XOR', () => {
      expect(GATE_COLOR_VARS.XOR).toBe('--da-gate-xor');
    });

    it('should have correct CSS variable name for NOT', () => {
      expect(GATE_COLOR_VARS.NOT).toBe('--da-gate-not');
    });

    it('should have correct CSS variable name for BUF', () => {
      expect(GATE_COLOR_VARS.BUF).toBe('--da-gate-buf');
    });

    it('should have correct CSS variable name for DFF', () => {
      expect(GATE_COLOR_VARS.DFF).toBe('--da-gate-dff');
    });
  });

  describe('getGateColor()', () => {
    beforeEach(() => {
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

    it('should return correct color for AND gate', () => {
      expect(getGateColor('AND')).toBe('#4ecdc4');
    });

    it('should return correct color for OR gate', () => {
      expect(getGateColor('OR')).toBe('#ff6b6b');
    });

    it('should return correct color for XOR gate', () => {
      expect(getGateColor('XOR')).toBe('#c44dff');
    });

    it('should return correct color for NOT gate', () => {
      expect(getGateColor('NOT')).toBe('#ffd93d');
    });

    it('should return correct color for BUF gate', () => {
      expect(getGateColor('BUF')).toBe('#888888');
    });

    it('should return correct color for DFF gate', () => {
      expect(getGateColor('DFF')).toBe('#4d96ff');
    });

    it('should handle lowercase type', () => {
      expect(getGateColor('and')).toBe('#4ecdc4');
    });

    it('should handle mixed case type', () => {
      expect(getGateColor('And')).toBe('#4ecdc4');
    });

    it('should fall back to default when CSS variable is empty', () => {
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({
        getPropertyValue: () => '',
      } as unknown as CSSStyleDeclaration);

      expect(getGateColor('AND')).toBe('#4ecdc4');
    });

    it('should return BUF color for unknown type and log warning', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(getGateColor('UNKNOWN')).toBe('#888888');
      expect(warnSpy).toHaveBeenCalledWith('Unknown gate type: "UNKNOWN", using BUF color as fallback');
      warnSpy.mockRestore();
    });
  });

  describe('DEFAULT_GATE_STYLE', () => {
    it('should have correct border color', () => {
      expect(DEFAULT_GATE_STYLE.border).toBe('#ffffff');
    });

    it('should have correct text color', () => {
      expect(DEFAULT_GATE_STYLE.text).toBe('#ffffff');
    });
  });

  describe('GATE_STYLE_VARS', () => {
    it('should have correct CSS variable name for border', () => {
      expect(GATE_STYLE_VARS.border).toBe('--da-gate-border');
    });

    it('should have correct CSS variable name for text', () => {
      expect(GATE_STYLE_VARS.text).toBe('--da-gate-text');
    });
  });

  describe('getGateBorderColor()', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should return border color from CSS variable', () => {
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({
        getPropertyValue: (prop: string) => {
          if (prop === '--da-gate-border') return '#00ff00';
          return '';
        },
      } as CSSStyleDeclaration);

      expect(getGateBorderColor()).toBe('#00ff00');
    });

    it('should fall back to default when CSS variable is empty', () => {
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({
        getPropertyValue: () => '',
      } as unknown as CSSStyleDeclaration);

      expect(getGateBorderColor()).toBe('#ffffff');
    });
  });

  describe('getGateTextColor()', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should return text color from CSS variable', () => {
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({
        getPropertyValue: (prop: string) => {
          if (prop === '--da-gate-text') return '#ff0000';
          return '';
        },
      } as CSSStyleDeclaration);

      expect(getGateTextColor()).toBe('#ff0000');
    });

    it('should fall back to default when CSS variable is empty', () => {
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({
        getPropertyValue: () => '',
      } as unknown as CSSStyleDeclaration);

      expect(getGateTextColor()).toBe('#ffffff');
    });
  });

  describe('isValidGateType()', () => {
    it('should return true for AND', () => {
      expect(isValidGateType('AND')).toBe(true);
    });

    it('should return true for OR', () => {
      expect(isValidGateType('OR')).toBe(true);
    });

    it('should return true for XOR', () => {
      expect(isValidGateType('XOR')).toBe(true);
    });

    it('should return true for NOT', () => {
      expect(isValidGateType('NOT')).toBe(true);
    });

    it('should return true for BUF', () => {
      expect(isValidGateType('BUF')).toBe(true);
    });

    it('should return true for DFF', () => {
      expect(isValidGateType('DFF')).toBe(true);
    });

    it('should return true for lowercase types', () => {
      expect(isValidGateType('and')).toBe(true);
      expect(isValidGateType('or')).toBe(true);
    });

    it('should return false for unknown type', () => {
      expect(isValidGateType('NAND')).toBe(false);
      expect(isValidGateType('NOR')).toBe(false);
      expect(isValidGateType('UNKNOWN')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidGateType('')).toBe(false);
    });
  });
});
