// src/visualizer/GateRenderer.ts
// Gate rendering utility for circuit visualization (Story 6.3, 6.5, 6.8)

import type { CircuitGate } from './types';
import { getGateColor, getGateBorderColor, getGateTextColor } from './gateColors';

/**
 * Default hover highlight color (--da-accent fallback).
 * Used when CSS variable is not available.
 */
const DEFAULT_HOVER_COLOR = '#00b4d8';

/**
 * Get the hover highlight color from CSS variables.
 * @returns The hover color string
 */
function getHoverColor(): string {
  if (typeof document === 'undefined') return DEFAULT_HOVER_COLOR;
  const style = getComputedStyle(document.documentElement);
  const color = style.getPropertyValue('--da-accent').trim();
  return color || DEFAULT_HOVER_COLOR;
}

/**
 * Default pulse scale for gate animation.
 * Gates scale up to this value and back during pulse effect.
 */
export const DEFAULT_PULSE_SCALE = 1.1;

/**
 * Gate rendering dimensions and styling configuration.
 */
export interface GateRenderConfig {
  /** Gate width in pixels */
  width: number;
  /** Gate height in pixels */
  height: number;
  /** Corner radius for rounded rectangle */
  cornerRadius: number;
  /** Font size for gate type label */
  fontSize: number;
  /** Font family for gate type label */
  fontFamily: string;
  /** Border width */
  borderWidth: number;
  /** Border color */
  borderColor: string;
  /** Text color for gate type label */
  textColor: string;
}

/**
 * Default gate rendering configuration.
 * Note: borderColor and textColor are legacy fallbacks.
 * Actual colors are read from CSS variables via getGateBorderColor/getGateTextColor.
 */
export const DEFAULT_GATE_CONFIG: GateRenderConfig = {
  width: 60,
  height: 40,
  cornerRadius: 4,
  fontSize: 10,
  fontFamily: 'JetBrains Mono, monospace',
  borderWidth: 1,
  borderColor: '#ffffff', // Fallback - prefer CSS var --da-gate-border
  textColor: '#ffffff', // Fallback - prefer CSS var --da-gate-text
};

/**
 * GateRenderer is a stateless utility class for rendering logic gates on a canvas.
 * Gates are rendered as rounded rectangles with type-specific fill colors
 * and centered type labels.
 */
export class GateRenderer {
  private config: GateRenderConfig;

  /**
   * Create a new GateRenderer.
   * @param config - Optional custom rendering configuration
   */
  constructor(config?: Partial<GateRenderConfig>) {
    this.config = { ...DEFAULT_GATE_CONFIG, ...config };
  }

  /**
   * Render a gate on the canvas.
   * @param ctx - The canvas 2D rendering context
   * @param gate - The gate data to render
   * @param x - X coordinate of top-left corner
   * @param y - Y coordinate of top-left corner
   * @param width - Optional width override (defaults to config.width)
   * @param height - Optional height override (defaults to config.height)
   * @param pulseScale - Optional scale factor for pulse animation (1.0 = normal, 1.1 = pulsed)
   * @param isHovered - Optional flag to render hover highlight (Story 6.8)
   */
  renderGate(
    ctx: CanvasRenderingContext2D,
    gate: CircuitGate,
    x: number,
    y: number,
    width?: number,
    height?: number,
    pulseScale: number = 1.0,
    isHovered: boolean = false
  ): void {
    const baseW = width ?? this.config.width;
    const baseH = height ?? this.config.height;

    // Apply pulse scale
    const w = baseW * pulseScale;
    const h = baseH * pulseScale;

    // Adjust position to keep gate centered during pulse
    const adjustedX = x - (w - baseW) / 2;
    const adjustedY = y - (h - baseH) / 2;

    // Round corner radius to avoid sub-pixel rendering artifacts
    const cornerRadius = Math.round(this.config.cornerRadius * pulseScale);

    // Draw hover highlight glow effect (Story 6.8)
    if (isHovered) {
      ctx.save();
      ctx.shadowColor = getHoverColor();
      ctx.shadowBlur = 8;
      ctx.strokeStyle = getHoverColor();
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(adjustedX, adjustedY, w, h, cornerRadius);
      ctx.stroke();
      ctx.restore();
    }

    // Fill with gate type color
    ctx.fillStyle = getGateColor(gate.type);
    ctx.beginPath();
    ctx.roundRect(adjustedX, adjustedY, w, h, cornerRadius);
    ctx.fill();

    // Draw border (read from CSS variables, fallback to config)
    ctx.strokeStyle = isHovered ? getHoverColor() : getGateBorderColor();
    ctx.lineWidth = isHovered ? 2 : this.config.borderWidth;
    ctx.stroke();

    // Draw type label centered in gate (read from CSS variables, fallback to config)
    ctx.fillStyle = getGateTextColor();
    ctx.font = `${this.config.fontSize * pulseScale}px ${this.config.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(gate.type, adjustedX + w / 2, adjustedY + h / 2);
  }

  /**
   * Get the current rendering configuration.
   * @returns The current GateRenderConfig
   */
  getConfig(): GateRenderConfig {
    return { ...this.config };
  }

  /**
   * Update the rendering configuration.
   * @param config - Partial configuration to merge
   */
  updateConfig(config: Partial<GateRenderConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
