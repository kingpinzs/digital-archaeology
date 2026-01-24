// src/visualizer/wireColors.ts
// Wire color constants and lookup function (Story 6.4)

/**
 * Default wire colors matching CSS variables.
 * Used as fallback when CSS variables are not available (e.g., in tests).
 * These constants mirror the CSS variables to maintain single source of truth in CSS.
 */
export const DEFAULT_WIRE_COLORS = {
  high: '#00ff88', // Signal = 1 (bright green)
  low: '#3a3a3a', // Signal = 0 (dim gray)
  unknown: '#ffaa00', // Signal = 2 (orange)
};

/**
 * CSS variable names for wire colors.
 */
export const WIRE_COLOR_VARS = {
  high: '--da-wire-high',
  low: '--da-wire-low',
  unknown: '--da-wire-unknown',
};

/**
 * Get the color for a wire based on its signal value.
 * First attempts to read from CSS variables, then falls back to default constants.
 * @param signalValue - The signal value (0=low, 1=high, 2=unknown)
 * @returns The color string (hex format)
 */
export function getWireColor(signalValue: number): string {
  let varName: string;
  let defaultColor: string;

  if (signalValue === 1) {
    varName = WIRE_COLOR_VARS.high;
    defaultColor = DEFAULT_WIRE_COLORS.high;
  } else if (signalValue === 0) {
    varName = WIRE_COLOR_VARS.low;
    defaultColor = DEFAULT_WIRE_COLORS.low;
  } else {
    // Treat any other value (including 2/undefined) as unknown
    varName = WIRE_COLOR_VARS.unknown;
    defaultColor = DEFAULT_WIRE_COLORS.unknown;
  }

  // Try to get color from CSS variables
  if (typeof document !== 'undefined') {
    const style = getComputedStyle(document.documentElement);
    const color = style.getPropertyValue(varName).trim();
    if (color) {
      return color;
    }
  }

  return defaultColor;
}
