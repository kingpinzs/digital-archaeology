// src/simulators/BaseSimulator.ts
// Abstract base class for Act 0 interactive simulators

import type { ChallengeData } from '@story/types';
import type { SimulatorCallbacks } from './types';

/**
 * BaseSimulator provides the mount/destroy lifecycle pattern
 * shared by all Act 0 interactive simulators.
 *
 * Subclasses implement:
 * - renderSimulator(): build the DOM
 * - resetState(): return to initial state
 * - destroySimulator(): clean up simulator-specific resources
 */
export abstract class BaseSimulator {
  protected container: HTMLElement | null = null;
  protected element: HTMLElement | null = null;
  protected challengeData: ChallengeData | null = null;
  protected callbacks: SimulatorCallbacks | null = null;
  protected completedObjectives: Set<string> = new Set();

  /**
   * Mount the simulator into a container element.
   */
  mount(container: HTMLElement): void {
    this.container = container;
    this.element = this.renderSimulator();
    this.container.appendChild(this.element);

    if (this.challengeData) {
      this.onChallengeDataReady();
    }
  }

  /**
   * Set the challenge data for this simulator.
   */
  setChallengeData(data: ChallengeData): void {
    this.challengeData = data;
    this.completedObjectives.clear();
    if (this.element) {
      this.onChallengeDataReady();
    }
  }

  /**
   * Set callbacks for objective completion events.
   */
  setCallbacks(callbacks: SimulatorCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Reset to initial state.
   */
  reset(): void {
    this.completedObjectives.clear();
    this.resetState();
  }

  /**
   * Destroy the simulator and clean up.
   */
  destroy(): void {
    this.destroySimulator();
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    this.container = null;
    this.challengeData = null;
    this.callbacks = null;
    this.completedObjectives.clear();
  }

  /**
   * Mark an objective as complete. Notifies callbacks and checks for all-complete.
   */
  protected markObjectiveComplete(objectiveId: string): void {
    if (this.completedObjectives.has(objectiveId)) return;
    this.completedObjectives.add(objectiveId);

    this.callbacks?.onObjectiveComplete(objectiveId);

    // Check if all objectives complete
    if (this.challengeData) {
      const allDone = this.challengeData.objectives.every(
        (obj) => this.completedObjectives.has(obj.id)
      );
      if (allDone) {
        this.callbacks?.onAllObjectivesComplete?.();
      }
    }
  }

  /** Build the simulator DOM. Called once during mount(). */
  protected abstract renderSimulator(): HTMLElement;

  /** Reset simulator-specific state to initial values. */
  protected abstract resetState(): void;

  /** Clean up simulator-specific resources (listeners, intervals, etc.) */
  protected abstract destroySimulator(): void;

  /** Called when both element and challengeData are available. */
  protected onChallengeDataReady(): void {
    // Default: no-op. Subclasses can override for data-dependent setup.
  }
}
