// src/visualizer/CircuitLayout.ts
// Gate positioning and layout calculation for circuit visualization (Story 6.3, 6.4)

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
 * A single wire segment connecting two points.
 */
export interface WireSegment {
  /** X coordinate of segment start */
  startX: number;
  /** Y coordinate of segment start */
  startY: number;
  /** X coordinate of segment end */
  endX: number;
  /** Y coordinate of segment end */
  endY: number;
  /** Bit index for multi-bit wires */
  bitIndex: number;
}

/**
 * Position data for a wire, including all segments.
 */
export interface WirePosition {
  /** Wire ID */
  wireId: number;
  /** Wire bit width */
  width: number;
  /** Array of wire segments (one per connection) */
  segments: WireSegment[];
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
 * CircuitLayout calculates positions for all gates and wires in a circuit.
 * Uses a simple grid layout where gates are arranged in columns by type.
 * Wire positions are calculated based on gate port connections.
 */
export class CircuitLayout {
  private positions: Map<number, GatePosition> = new Map();
  private wirePositions: Map<number, WirePosition> = new Map();
  private config: CircuitLayoutConfig;

  /**
   * Create a new CircuitLayout.
   * @param config - Optional custom layout configuration
   */
  constructor(config?: Partial<CircuitLayoutConfig>) {
    this.config = { ...DEFAULT_LAYOUT_CONFIG, ...config };
  }

  /**
   * Calculate positions for all gates and wires in the circuit model.
   * Gates are arranged in columns by type.
   * Wires are calculated based on gate port connections.
   * @param model - The circuit model containing gate data
   * @param canvasWidth - Width of the canvas in pixels
   * @param canvasHeight - Height of the canvas in pixels
   */
  calculate(model: CircuitModel, canvasWidth: number, canvasHeight: number): void {
    this.positions.clear();
    this.wirePositions.clear();

    const { padding, gapX, gapY } = this.config;
    const maxRows = Math.floor((canvasHeight - padding * 2) / gapY);

    let col = 0;

    // First pass: calculate gate positions
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

    // Second pass: calculate wire positions based on gate connections
    this.calculateWirePositions(model);
  }

  /**
   * Calculate wire positions based on gate input/output port connections.
   * For each gate output, traces the wire to all connected gate inputs.
   * @param model - The circuit model
   * @private
   */
  private calculateWirePositions(model: CircuitModel): void {
    const { gateWidth, gateHeight } = this.config;

    // Build a map of wire ID to connected gate ports
    // Key: wireId, Value: { outputs: [{gateId, portIndex}], inputs: [{gateId, portIndex}] }
    const wireConnections = new Map<
      number,
      {
        outputs: Array<{ gateId: number; portIndex: number; bit: number }>;
        inputs: Array<{ gateId: number; portIndex: number; bit: number }>;
      }
    >();

    // Iterate through all gates to find wire connections
    for (const gate of model.gates.values()) {
      // Process outputs (sources)
      gate.outputs.forEach((port, portIndex) => {
        if (!wireConnections.has(port.wire)) {
          wireConnections.set(port.wire, { outputs: [], inputs: [] });
        }
        wireConnections.get(port.wire)!.outputs.push({
          gateId: gate.id,
          portIndex,
          bit: port.bit,
        });
      });

      // Process inputs (destinations)
      gate.inputs.forEach((port, portIndex) => {
        if (!wireConnections.has(port.wire)) {
          wireConnections.set(port.wire, { outputs: [], inputs: [] });
        }
        wireConnections.get(port.wire)!.inputs.push({
          gateId: gate.id,
          portIndex,
          bit: port.bit,
        });
      });
    }

    // Create wire segments for each connection
    for (const [wireId, connections] of wireConnections) {
      const wire = model.getWire(wireId);
      if (!wire) continue;

      const segments: WireSegment[] = [];

      // For each output (source), connect to all inputs (destinations)
      for (const output of connections.outputs) {
        const sourceGate = this.positions.get(output.gateId);
        if (!sourceGate) continue;

        // Output port is on the right side of the gate
        const sourceX = sourceGate.x + gateWidth;
        const sourceY =
          sourceGate.y + gateHeight / 2 + (output.portIndex - 0.5) * 8;

        for (const input of connections.inputs) {
          const destGate = this.positions.get(input.gateId);
          if (!destGate) continue;

          // Input port is on the left side of the gate
          const destX = destGate.x;
          const destY =
            destGate.y + gateHeight / 2 + (input.portIndex - 0.5) * 8;

          segments.push({
            startX: sourceX,
            startY: sourceY,
            endX: destX,
            endY: destY,
            bitIndex: output.bit,
          });
        }
      }

      if (segments.length > 0) {
        this.wirePositions.set(wireId, {
          wireId,
          width: wire.width,
          segments,
        });
      }
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
   * Get all calculated gate positions.
   * @returns A new Map of gate ID to position
   */
  getAllPositions(): Map<number, GatePosition> {
    return new Map(this.positions);
  }

  /**
   * Get the calculated position for a wire.
   * @param wireId - The wire ID
   * @returns The wire position or undefined if not calculated
   */
  getWirePosition(wireId: number): WirePosition | undefined {
    return this.wirePositions.get(wireId);
  }

  /**
   * Get all calculated wire positions.
   * @returns A new Map of wire ID to position
   */
  getAllWirePositions(): Map<number, WirePosition> {
    return new Map(this.wirePositions);
  }

  /**
   * Get the number of gates with calculated positions.
   * @returns The count of positioned gates
   */
  get positionCount(): number {
    return this.positions.size;
  }

  /**
   * Get the number of wires with calculated positions.
   * @returns The count of positioned wires
   */
  get wirePositionCount(): number {
    return this.wirePositions.size;
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
    this.wirePositions.clear();
  }
}
