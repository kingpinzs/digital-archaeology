// src/visualizer/GateTooltip.ts
// Tooltip component for displaying gate information on hover (Story 6.8)

import type { CircuitGate } from './types';
import { escapeHtml } from '../utils';

/**
 * Format gate type for display.
 * @param type - Internal gate type
 * @returns Human-readable gate type
 */
export function formatGateType(type: string): string {
  return type.toUpperCase();
}

/**
 * Format gate output value for display.
 * @param gate - The gate to format
 * @param wireStates - Optional map of wire IDs to state arrays
 * @returns Formatted output string
 */
export function formatGateOutput(
  gate: CircuitGate,
  wireStates?: Map<number, number[]>
): string {
  // Get output wire state
  const output = gate.outputs[0];
  if (!output) {
    return 'Output: -';
  }

  // Try to get state from wire states map
  const wireState = wireStates?.get(output.wire);
  if (wireState) {
    // Explicit undefined check for out-of-bounds bit index
    const value = wireState[output.bit] ?? 2; // Default to unknown (2) if undefined
    const displayValue = value === 0 ? '0' : value === 1 ? '1' : 'X';
    return `Output: ${displayValue}`;
  }

  return 'Output: -';
}

/**
 * Configuration for GateTooltip positioning.
 */
export interface TooltipConfig {
  /** Offset from cursor in pixels */
  offsetX: number;
  offsetY: number;
  /** Minimum distance from viewport edges */
  edgePadding: number;
}

/**
 * Default tooltip configuration.
 */
export const DEFAULT_TOOLTIP_CONFIG: TooltipConfig = {
  offsetX: 12,
  offsetY: 12,
  edgePadding: 8,
};

/**
 * GateTooltip displays information about a gate when hovering.
 * Follows the mount/show/hide/destroy lifecycle pattern.
 */
export class GateTooltip {
  private element: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private config: TooltipConfig;

  /**
   * Create a new GateTooltip.
   * @param config - Optional custom configuration
   */
  constructor(config?: Partial<TooltipConfig>) {
    this.config = { ...DEFAULT_TOOLTIP_CONFIG, ...config };
  }

  /**
   * Mount the tooltip to a container element.
   * Creates the tooltip DOM element but keeps it hidden.
   * @param container - The HTML element to mount into
   */
  mount(container: HTMLElement): void {
    this.container = container;

    // Create tooltip element
    this.element = document.createElement('div');
    this.element.className = 'da-gate-tooltip';
    this.element.style.display = 'none';
    this.element.style.position = 'absolute';
    this.element.style.pointerEvents = 'none';
    this.element.setAttribute('role', 'tooltip');
    this.element.setAttribute('aria-hidden', 'true');

    // Append to container
    this.container.appendChild(this.element);
  }

  /**
   * Show the tooltip at the specified position with gate information.
   * @param clientX - X coordinate in viewport (screen) pixels
   * @param clientY - Y coordinate in viewport (screen) pixels
   * @param gate - The gate to display information about
   * @param wireStates - Optional map of wire IDs to state arrays for output display
   */
  show(
    clientX: number,
    clientY: number,
    gate: CircuitGate,
    wireStates?: Map<number, number[]>
  ): void {
    if (!this.element || !this.container) return;

    // Format content with XSS protection
    const typeDisplay = formatGateType(gate.type);
    const nameDisplay = escapeHtml(gate.name);
    const outputDisplay = formatGateOutput(gate, wireStates);

    // Build tooltip content
    let content = `<div class="da-gate-tooltip-header">${typeDisplay} ${nameDisplay}</div>`;
    content += `<div class="da-gate-tooltip-output">${outputDisplay}</div>`;

    // Add stored value for DFF gates
    if (gate.type === 'DFF' && gate.stored !== undefined) {
      content += `<div class="da-gate-tooltip-stored">Stored: ${gate.stored}</div>`;
    }

    this.element.innerHTML = content;
    this.element.style.display = 'block';
    this.element.setAttribute('aria-hidden', 'false');

    // Position with edge detection
    this.positionTooltip(clientX, clientY);
  }

  /**
   * Position the tooltip near the cursor, keeping it within viewport.
   * @param clientX - X coordinate
   * @param clientY - Y coordinate
   * @private
   */
  private positionTooltip(clientX: number, clientY: number): void {
    if (!this.element || !this.container) return;

    const { offsetX, offsetY, edgePadding } = this.config;

    // Get container bounds for relative positioning
    const containerRect = this.container.getBoundingClientRect();

    // Calculate initial position relative to container
    let x = clientX - containerRect.left + offsetX;
    let y = clientY - containerRect.top + offsetY;

    // Get tooltip dimensions (need to read after content is set)
    const tooltipRect = this.element.getBoundingClientRect();
    const tooltipWidth = tooltipRect.width;
    const tooltipHeight = tooltipRect.height;

    // Check right edge - flip to left of cursor if needed
    if (clientX + offsetX + tooltipWidth > window.innerWidth - edgePadding) {
      x = clientX - containerRect.left - tooltipWidth - offsetX;
    }

    // Check bottom edge - flip above cursor if needed
    if (clientY + offsetY + tooltipHeight > window.innerHeight - edgePadding) {
      y = clientY - containerRect.top - tooltipHeight - offsetY;
    }

    // Ensure minimum position (don't go negative)
    x = Math.max(edgePadding, x);
    y = Math.max(edgePadding, y);

    this.element.style.left = `${x}px`;
    this.element.style.top = `${y}px`;
  }

  /**
   * Hide the tooltip.
   */
  hide(): void {
    if (!this.element) return;

    this.element.style.display = 'none';
    this.element.setAttribute('aria-hidden', 'true');
  }

  /**
   * Check if the tooltip is currently visible.
   * @returns True if visible
   */
  isVisible(): boolean {
    return this.element?.style.display === 'block';
  }

  /**
   * Destroy the tooltip and clean up resources.
   */
  destroy(): void {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
    this.container = null;
  }

  /**
   * Get the tooltip DOM element.
   * @returns The tooltip element or null if not mounted
   */
  getElement(): HTMLElement | null {
    return this.element;
  }
}
