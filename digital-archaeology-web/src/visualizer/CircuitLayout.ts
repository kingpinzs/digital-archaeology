// src/visualizer/CircuitLayout.ts
// Gate positioning and layout calculation for circuit visualization (Story 6.3)

import type { CircuitModel } from './CircuitModel';
import type { GateType } from './types';

/**
 * Position of a gate in the layout.
 */
export interface GatePosition {
  /** X coordinate of top-left corner */
  x: number;
  /** Y coordinate of top-left corner */
  y: number;
}

/**
 * Layout configuration options.
 */
export interface CircuitLayoutConfig {
  /** Width of each gate in pixels */
  gateWidth: number;
  /** Height of each gate in pixels */
  gateHeight: number;
  /** Padding around the entire circuit */
  padding: number;
  /** Horizontal gap between columns */
  gapX: number;
  /** Vertical gap between rows */
  gapY: number;
}

/**
 * Default layout configuration.
 */
export const DEFAULT_LAYOUT_CONFIG: CircuitLayoutConfig = {
  gateWidth: 60,
  gateHeight: 40,
  padding: 20,
  gapX: 80,
  gapY: 50,
};

/**
 * Order of gate types for column layout.
 * Gates are arranged in columns by type.
 */
const GATE_TYPE_ORDER: GateType[] = ['AND', 'OR', 'NOT', 'BUF', 'DFF', 'XOR'];

/**
 * CircuitLayout calculates positions for all gates in a circuit.
 * Uses a simple grid layout where gates are arranged in columns by type.
 */
export class CircuitLayout {
  private positions: Map<number, GatePosition> = new Map();
  private config: CircuitLayoutConfig;

  /**
   * Create a new CircuitLayout.
   * @param config - Optional custom layout configuration
   */
  constructor(config?: Partial<CircuitLayoutConfig>) {
    this.config = { ...DEFAULT_LAYOUT_CONFIG, ...config };
  }

  /**
   * Calculate positions for all gates in the circuit model.
   * Gates are arranged in columns by type.
   * @param model - The circuit model containing gate data
   * @param canvasWidth - Width of the canvas in pixels
   * @param canvasHeight - Height of the canvas in pixels
   */
  calculate(model: CircuitModel, canvasWidth: number, canvasHeight: number): void {
    this.positions.clear();

    const { padding, gapX, gapY } = this.config;
    const maxRows = Math.floor((canvasHeight - padding * 2) / gapY);

    let col = 0;

    for (const type of GATE_TYPE_ORDER) {
      const gates = model.getGatesByType(type);
      if (gates.length === 0) continue;

      let row = 0;
      for (const gate of gates) {
        const x = padding + col * gapX;
        const y = padding + row * gapY;
        this.positions.set(gate.id, { x, y });

        row++;
        // Move to next column if we exceed canvas height
        if (maxRows > 0 && row >= maxRows) {
          row = 0;
          col++;
        }
      }
      // Move to next column for next gate type
      col++;
    }
  }

  /**
   * Get the calculated position for a gate.
   * @param gateId - The gate ID
   * @returns The gate position or undefined if not calculated
   */
  getPosition(gateId: number): GatePosition | undefined {
    return this.positions.get(gateId);
  }

  /**
   * Get all calculated positions.
   * @returns A new Map of gate ID to position
   */
  getAllPositions(): Map<number, GatePosition> {
    return new Map(this.positions);
  }

  /**
   * Get the number of gates with calculated positions.
   * @returns The count of positioned gates
   */
  get positionCount(): number {
    return this.positions.size;
  }

  /**
   * Get the current layout configuration.
   * @returns The current CircuitLayoutConfig
   */
  getConfig(): CircuitLayoutConfig {
    return { ...this.config };
  }

  /**
   * Update the layout configuration.
   * Note: This does not automatically recalculate positions.
   * Call calculate() after updating config.
   * @param config - Partial configuration to merge
   */
  updateConfig(config: Partial<CircuitLayoutConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Clear all calculated positions.
   */
  clear(): void {
    this.positions.clear();
  }
}
