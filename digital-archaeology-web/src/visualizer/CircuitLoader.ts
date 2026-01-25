// src/visualizer/CircuitLoader.ts
// Circuit data loader with validation (Story 6.2)

import type { CircuitData, CircuitWire, CircuitGate, GatePort, GateType } from './types';

/** Valid gate types for runtime validation */
const VALID_GATE_TYPES: readonly GateType[] = ['AND', 'OR', 'NOT', 'BUF', 'DFF', 'XOR'];

/**
 * Error thrown when circuit loading or validation fails.
 */
export class CircuitLoadError extends Error {
  /** Path that was attempted to load */
  public readonly path: string;
  /** Original error that caused this error */
  public readonly cause?: Error;

  constructor(message: string, path: string, cause?: Error) {
    super(message);
    this.name = 'CircuitLoadError';
    this.path = path;
    this.cause = cause;
  }
}

/**
 * Validates that a value is a valid GatePort.
 */
function isValidGatePort(port: unknown): port is GatePort {
  if (typeof port !== 'object' || port === null) return false;
  const p = port as Record<string, unknown>;
  return typeof p.wire === 'number' && typeof p.bit === 'number';
}

/**
 * Validates that a value is a valid CircuitWire.
 */
function isValidWire(wire: unknown): wire is CircuitWire {
  if (typeof wire !== 'object' || wire === null) return false;
  const w = wire as Record<string, unknown>;
  return (
    typeof w.id === 'number' &&
    typeof w.name === 'string' &&
    typeof w.width === 'number' &&
    typeof w.is_input === 'boolean' &&
    typeof w.is_output === 'boolean' &&
    Array.isArray(w.state) &&
    w.state.every((s: unknown) => typeof s === 'number') &&
    w.state.length === w.width // Ensure state array matches declared width
  );
}

/**
 * Validates that a value is a valid CircuitGate.
 */
function isValidGate(gate: unknown): gate is CircuitGate {
  if (typeof gate !== 'object' || gate === null) return false;
  const g = gate as Record<string, unknown>;
  return (
    typeof g.id === 'number' &&
    typeof g.name === 'string' &&
    typeof g.type === 'string' &&
    VALID_GATE_TYPES.includes(g.type as GateType) && // Validate gate type
    Array.isArray(g.inputs) &&
    g.inputs.every(isValidGatePort) &&
    Array.isArray(g.outputs) &&
    g.outputs.every(isValidGatePort) &&
    (g.stored === undefined || typeof g.stored === 'number')
  );
}

/**
 * Validates that a value is valid CircuitData.
 */
function isValidCircuitData(data: unknown): data is CircuitData {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.cycle === 'number' &&
    typeof d.stable === 'boolean' &&
    Array.isArray(d.wires) &&
    d.wires.every(isValidWire) &&
    Array.isArray(d.gates) &&
    d.gates.every(isValidGate)
  );
}

/**
 * Loads and validates circuit data from JSON files.
 * Provides async loading with comprehensive error handling.
 */
export class CircuitLoader {
  /**
   * Load circuit data from a JSON file.
   * @param path - Path to the circuit JSON file (relative to public/)
   * @returns Promise resolving to validated CircuitData
   * @throws CircuitLoadError on fetch failure, invalid JSON, or validation failure
   */
  async loadCircuit(path: string): Promise<CircuitData> {
    // Prepend base URL for paths starting with /
    const resolvedPath = path.startsWith('/')
      ? `${import.meta.env.BASE_URL}${path.slice(1)}`
      : path;
    let response: Response;

    try {
      response = await fetch(resolvedPath);
    } catch (error) {
      throw new CircuitLoadError(
        `Failed to fetch circuit: ${(error as Error).message}`,
        path,
        error as Error
      );
    }

    if (!response.ok) {
      throw new CircuitLoadError(
        `Failed to load circuit: ${response.status} ${response.statusText}`,
        path
      );
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch (error) {
      throw new CircuitLoadError(
        'Failed to parse circuit JSON: Invalid JSON format',
        path,
        error as Error
      );
    }

    if (!isValidCircuitData(data)) {
      throw new CircuitLoadError(
        'Invalid circuit data: JSON structure does not match expected format',
        path
      );
    }

    return data;
  }
}
