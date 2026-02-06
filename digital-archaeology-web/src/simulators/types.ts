// src/simulators/types.ts
// Shared types for interactive simulators

import type { ChallengeData } from '@story/types';

/**
 * Callbacks from a simulator back to the orchestrator.
 */
export interface SimulatorCallbacks {
  /** Called when a challenge objective is completed */
  onObjectiveComplete: (objectiveId: string) => void;
  /** Called when all objectives are complete */
  onAllObjectivesComplete?: () => void;
}

/**
 * Common interface all simulators implement.
 */
export interface Simulator {
  /** Mount the simulator into a container element */
  mount(container: HTMLElement): void;
  /** Set the challenge data (objectives) for this simulator */
  setChallengeData(data: ChallengeData): void;
  /** Set callbacks for objective completion events */
  setCallbacks(callbacks: SimulatorCallbacks): void;
  /** Reset simulator to initial state */
  reset(): void;
  /** Destroy the simulator and clean up DOM/listeners */
  destroy(): void;
}
