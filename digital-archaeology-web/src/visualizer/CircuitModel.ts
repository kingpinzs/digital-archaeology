// src/visualizer/CircuitModel.ts
// Indexed access to circuit data (Story 6.2)

import type { CircuitData, CircuitWire, CircuitGate } from './types';

/**
 * Provides indexed access to circuit data for efficient lookups.
 * Creates Maps for O(1) access to gates and wires by ID or name.
 */
export class CircuitModel {
  /** Map of gate ID to gate data for O(1) lookup */
  public readonly gates: Map<number, CircuitGate>;

  /** Map of wire ID to wire data for O(1) lookup */
  public readonly wires: Map<number, CircuitWire>;

  /** Map of wire name to wire data for name-based lookup */
  public readonly wiresByName: Map<string, CircuitWire>;

  /** Original circuit data reference */
  public readonly data: CircuitData;

  /**
   * Create a CircuitModel from circuit data.
   * Builds indexed Maps for efficient access.
   * @param data - The circuit data to index
   */
  constructor(data: CircuitData) {
    this.data = data;

    // Build gates Map
    this.gates = new Map();
    for (const gate of data.gates) {
      this.gates.set(gate.id, gate);
    }

    // Build wires Map and wiresByName Map
    this.wires = new Map();
    this.wiresByName = new Map();
    for (const wire of data.wires) {
      this.wires.set(wire.id, wire);
      this.wiresByName.set(wire.name, wire);
    }
  }

  /**
   * Get a gate by its ID.
   * @param id - The gate ID
   * @returns The gate or undefined if not found
   */
  getGate(id: number): CircuitGate | undefined {
    return this.gates.get(id);
  }

  /**
   * Get a wire by its ID.
   * @param id - The wire ID
   * @returns The wire or undefined if not found
   */
  getWire(id: number): CircuitWire | undefined {
    return this.wires.get(id);
  }

  /**
   * Get a wire by its name.
   * @param name - The wire name (e.g., "pc", "acc", "z_flag")
   * @returns The wire or undefined if not found
   */
  getWireByName(name: string): CircuitWire | undefined {
    return this.wiresByName.get(name);
  }

  /**
   * Get all gates of a specific type.
   * @param type - The gate type (e.g., "AND", "OR", "DFF")
   * @returns Array of gates matching the type
   */
  getGatesByType(type: string): CircuitGate[] {
    const result: CircuitGate[] = [];
    for (const gate of this.gates.values()) {
      if (gate.type === type) {
        result.push(gate);
      }
    }
    return result;
  }

  /**
   * Get the total number of gates.
   */
  get gateCount(): number {
    return this.gates.size;
  }

  /**
   * Get the total number of wires.
   */
  get wireCount(): number {
    return this.wires.size;
  }

  /**
   * Get the current simulation cycle.
   */
  get cycle(): number {
    return this.data.cycle;
  }

  /**
   * Check if the circuit is stable.
   */
  get isStable(): boolean {
    return this.data.stable;
  }
}
