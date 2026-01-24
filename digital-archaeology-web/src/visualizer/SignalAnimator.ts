// src/visualizer/SignalAnimator.ts
// Signal state interpolation for circuit animation (Story 6.5)

import type { CircuitModel } from './CircuitModel';

/**
 * Snapshot of wire signal states at a point in time.
 */
export interface SignalSnapshot {
  /** Map of wire ID to bit values array */
  wireStates: Map<number, number[]>;
  /** Map of gate ID to output wire IDs (for tracking changes) */
  gateOutputs: Map<number, number[]>;
}

/**
 * SignalAnimator manages signal state interpolation for smooth transitions.
 * Captures before/after states and provides interpolated values for animation.
 */
export class SignalAnimator {
  private startState: SignalSnapshot | null = null;
  private endState: SignalSnapshot | null = null;
  private changedGates: Set<number> = new Set();

  /**
   * Capture the current circuit state as the animation start point.
   * @param model - The circuit model to snapshot
   */
  captureState(model: CircuitModel): void {
    this.startState = this.createSnapshot(model);
    this.changedGates.clear();
  }

  /**
   * Set the target circuit state as the animation end point.
   * Also calculates which gates have changed outputs.
   * @param model - The circuit model with target state
   */
  setTargetState(model: CircuitModel): void {
    this.endState = this.createSnapshot(model);
    this.calculateChangedGates();
  }

  /**
   * Create a deep snapshot of the circuit model state.
   * @param model - The circuit model to snapshot
   * @returns A SignalSnapshot with copied wire states
   * @private
   */
  private createSnapshot(model: CircuitModel): SignalSnapshot {
    const wireStates = new Map<number, number[]>();
    const gateOutputs = new Map<number, number[]>();

    // Copy wire states
    for (const [id, wire] of model.wires) {
      wireStates.set(id, [...wire.state]);
    }

    // Track gate outputs for change detection
    for (const [id, gate] of model.gates) {
      const outputWires = gate.outputs.map((port) => port.wire);
      gateOutputs.set(id, outputWires);
    }

    return { wireStates, gateOutputs };
  }

  /**
   * Calculate which gates have changed output signals.
   * @private
   */
  private calculateChangedGates(): void {
    this.changedGates.clear();

    if (!this.startState || !this.endState) return;

    // For each gate, check if any of its output wires changed
    for (const [gateId, outputWires] of this.endState.gateOutputs) {
      for (const wireId of outputWires) {
        const startValues = this.startState.wireStates.get(wireId);
        const endValues = this.endState.wireStates.get(wireId);

        if (!startValues || !endValues) continue;

        // Check if any bit changed
        const hasChange = endValues.some((val, i) => val !== startValues[i]);
        if (hasChange) {
          this.changedGates.add(gateId);
          break; // Gate already marked as changed
        }
      }
    }
  }

  /**
   * Interpolate wire states between start and end based on progress.
   * Uses step interpolation (transition at midpoint) for discrete signal values.
   * @param progress - Animation progress from 0.0 to 1.0
   * @returns Map of wire ID to interpolated bit values
   */
  interpolate(progress: number): Map<number, number[]> {
    const result = new Map<number, number[]>();

    if (!this.startState || !this.endState) {
      return result;
    }

    // For discrete values (0/1/2), use step interpolation at midpoint
    for (const [wireId, endValues] of this.endState.wireStates) {
      const startValues = this.startState.wireStates.get(wireId) || [];

      const interpolated = endValues.map((endVal, i) => {
        const startVal = startValues[i] ?? 2; // Default to unknown
        // Flip at midpoint for visual effect
        return progress < 0.5 ? startVal : endVal;
      });

      result.set(wireId, interpolated);
    }

    return result;
  }

  /**
   * Get the set of gate IDs that have changed outputs.
   * Used for determining which gates should pulse during animation.
   * @returns Set of gate IDs with changed outputs
   */
  getChangedGates(): Set<number> {
    return new Set(this.changedGates);
  }

  /**
   * Check if there are any signal changes between start and end states.
   * @returns True if any wire states differ
   */
  hasChanges(): boolean {
    if (!this.startState || !this.endState) return false;

    for (const [wireId, endValues] of this.endState.wireStates) {
      const startValues = this.startState.wireStates.get(wireId);
      if (!startValues) return true;

      if (endValues.some((val, i) => val !== startValues[i])) {
        return true;
      }
    }

    return false;
  }

  /**
   * Clear all captured states.
   */
  clear(): void {
    this.startState = null;
    this.endState = null;
    this.changedGates.clear();
  }
}
