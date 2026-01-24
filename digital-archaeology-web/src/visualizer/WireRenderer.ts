// src/visualizer/WireRenderer.ts
// Wire rendering utility for circuit visualization (Story 6.4)

import { getWireColor } from './wireColors';

/**
 * Wire rendering configuration.
 */
export interface WireRenderConfig {
  /** Default line width for single-bit wires */
  singleBitWidth: number;
  /** Line width for multi-bit wires (width > 1) */
  multiBitWidth: number;
  /** Line cap style */
  lineCap: CanvasLineCap;
}

/**
 * Default wire rendering configuration.
 */
export const DEFAULT_WIRE_CONFIG: WireRenderConfig = {
  singleBitWidth: 1,
  multiBitWidth: 2,
  lineCap: 'round',
};

/**
 * WireRenderer is a stateless utility class for rendering wires on a canvas.
 * Wires are rendered as lines with colors based on their signal state.
 */
export class WireRenderer {
  private config: WireRenderConfig;

  /**
   * Create a new WireRenderer.
   * @param config - Optional custom rendering configuration
   */
  constructor(config?: Partial<WireRenderConfig>) {
    this.config = { ...DEFAULT_WIRE_CONFIG, ...config };
  }

  /**
   * Render a wire segment on the canvas.
   * @param ctx - The canvas 2D rendering context
   * @param signalValue - The signal value (0=low, 1=high, 2=unknown)
   * @param startX - X coordinate of wire start
   * @param startY - Y coordinate of wire start
   * @param endX - X coordinate of wire end
   * @param endY - Y coordinate of wire end
   * @param isMultiBit - Whether this is a multi-bit wire (default: false)
   */
  renderWire(
    ctx: CanvasRenderingContext2D,
    signalValue: number,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    isMultiBit: boolean = false
  ): void {
    ctx.strokeStyle = getWireColor(signalValue);
    ctx.lineWidth = isMultiBit ? this.config.multiBitWidth : this.config.singleBitWidth;
    ctx.lineCap = this.config.lineCap;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  /**
   * Get the current rendering configuration.
   * @returns The current WireRenderConfig
   */
  getConfig(): WireRenderConfig {
    return { ...this.config };
  }

  /**
   * Update the rendering configuration.
   * @param config - Partial configuration to merge
   */
  updateConfig(config: Partial<WireRenderConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
