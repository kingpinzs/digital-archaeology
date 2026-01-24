// src/visualizer/types.ts
// TypeScript interfaces for circuit data (Story 6.2)

/**
 * Represents a connection port on a gate (input or output).
 * Links to a specific bit on a wire.
 */
export interface GatePort {
  /** Wire ID this port connects to */
  wire: number;
  /** Bit index on the wire (0-indexed) */
  bit: number;
}

/**
 * Represents a wire in the circuit.
 * Wires carry signals between gates and can be multi-bit.
 */
export interface CircuitWire {
  /** Unique wire identifier */
  id: number;
  /** Human-readable name (e.g., "pc", "acc", "z_flag") */
  name: string;
  /** Bit width (1, 4, or 8 for Micro4) */
  width: number;
  /** Whether this wire is an external input */
  is_input: boolean;
  /** Whether this wire is an external output */
  is_output: boolean;
  /** Current bit values (0 = low, 1 = high, 2 = undefined/X) */
  state: number[];
}

/**
 * Represents a logic gate in the circuit.
 * Gates perform logic operations on input signals.
 */
export interface CircuitGate {
  /** Unique gate identifier */
  id: number;
  /** Gate instance name (e.g., "DEC_HLT1", "ACC0") */
  name: string;
  /** Gate type: AND, OR, NOT, BUF, DFF, XOR */
  type: string;
  /** Input port connections */
  inputs: GatePort[];
  /** Output port connections */
  outputs: GatePort[];
  /** For DFF gates: stored value (0 or 1) */
  stored?: number;
}

/**
 * Represents the complete circuit data loaded from JSON.
 * Contains all wires and gates needed for visualization.
 */
export interface CircuitData {
  /** Current simulation cycle number */
  cycle: number;
  /** Whether the circuit is in a stable state */
  stable: boolean;
  /** Array of all wires in the circuit */
  wires: CircuitWire[];
  /** Array of all gates in the circuit */
  gates: CircuitGate[];
}

/**
 * Known gate types in the Micro4 circuit.
 * Used for type-safe gate type filtering.
 */
export type GateType = 'AND' | 'OR' | 'NOT' | 'BUF' | 'DFF' | 'XOR';
