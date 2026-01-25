// src/visualizer/highlightColors.ts
// Shared highlight color utilities for circuit visualization (Story 6.9)

/**
 * Default link highlight color (--da-link-highlight fallback).
 * Orange color distinct from hover for code-to-circuit linking.
 */
export const DEFAULT_LINK_HIGHLIGHT_COLOR = '#ff9f43';

/**
 * Get the link highlight color from CSS variables (Story 6.9).
 * Used by both GateRenderer and WireRenderer for consistent highlighting.
 * @returns The link highlight color string
 */
export function getLinkHighlightColor(): string {
  if (typeof document === 'undefined') return DEFAULT_LINK_HIGHLIGHT_COLOR;
  const style = getComputedStyle(document.documentElement);
  const color = style.getPropertyValue('--da-link-highlight').trim();
  return color || DEFAULT_LINK_HIGHLIGHT_COLOR;
}
