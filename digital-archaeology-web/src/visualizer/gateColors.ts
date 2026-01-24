// src/visualizer/gateColors.ts
// Gate color constants and lookup function (Story 6.3)

import type { GateType } from './types';

/**
 * Default gate colors matching CSS variables.
 * Used as fallback when CSS variables are not available (e.g., in tests).
 * These constants mirror the CSS variables to maintain single source of truth in CSS.
 */
export const DEFAULT_GATE_COLORS: Record<GateType, string> = {
  AND: '#4ecdc4', // Teal
  OR: '#ff6b6b', // Red
  XOR: '#c44dff', // Purple
  NOT: '#ffd93d', // Yellow
  BUF: '#888888', // Gray
  DFF: '#4d96ff', // Blue
};

/**
 * Default gate styling colors (border and text).
 */
export const DEFAULT_GATE_STYLE = {
  border: '#ffffff',
  text: '#ffffff',
};

/**
 * CSS variable names for gate colors.
 */
export const GATE_COLOR_VARS: Record<GateType, string> = {
  AND: '--da-gate-and',
  OR: '--da-gate-or',
  XOR: '--da-gate-xor',
  NOT: '--da-gate-not',
  BUF: '--da-gate-buf',
  DFF: '--da-gate-dff',
};

/**
 * CSS variable names for gate styling.
 */
export const GATE_STYLE_VARS = {
  border: '--da-gate-border',
  text: '--da-gate-text',
};

/**
 * Get the color for a gate type.
 * First attempts to read from CSS variables, then falls back to default constants.
 * @param type - The gate type (AND, OR, XOR, NOT, BUF, DFF)
 * @returns The color string (hex format)
 */
export function getGateColor(type: string): string {
  // Normalize type to uppercase
  const normalizedType = type.toUpperCase() as GateType;

  // Try to get color from CSS variables
  if (typeof document !== 'undefined') {
    const style = getComputedStyle(document.documentElement);
    const varName = GATE_COLOR_VARS[normalizedType];
    if (varName) {
      const color = style.getPropertyValue(varName).trim();
      if (color) {
        return color;
      }
    }
  }

  // Fall back to default color, warn if unknown type
  if (!(normalizedType in DEFAULT_GATE_COLORS)) {
    console.warn(`Unknown gate type: "${type}", using BUF color as fallback`);
    return DEFAULT_GATE_COLORS.BUF;
  }
  return DEFAULT_GATE_COLORS[normalizedType];
}

/**
 * Check if a gate type is valid.
 * @param type - The gate type to check
 * @returns True if the type is a valid GateType
 */
export function isValidGateType(type: string): type is GateType {
  const normalizedType = type.toUpperCase();
  return normalizedType in DEFAULT_GATE_COLORS;
}

/**
 * Get the gate border color from CSS variables.
 * @returns The border color string (hex format)
 */
export function getGateBorderColor(): string {
  if (typeof document !== 'undefined') {
    const style = getComputedStyle(document.documentElement);
    const color = style.getPropertyValue(GATE_STYLE_VARS.border).trim();
    if (color) {
      return color;
    }
  }
  return DEFAULT_GATE_STYLE.border;
}

/**
 * Get the gate text color from CSS variables.
 * @returns The text color string (hex format)
 */
export function getGateTextColor(): string {
  if (typeof document !== 'undefined') {
    const style = getComputedStyle(document.documentElement);
    const color = style.getPropertyValue(GATE_STYLE_VARS.text).trim();
    if (color) {
      return color;
    }
  }
  return DEFAULT_GATE_STYLE.text;
}
