// src/progress/StageUnlockManager.ts
// Pure data service for computing stage unlock state from act completions
// Story 19.5: Implement Stage Unlock System

import type { LabStage } from '../config/stageConfig';
import { LAB_STAGES } from '../config/stageConfig';
import { STAGE_UNLOCK_RULES } from './types';
import type { ActCompletionStorage } from './ActCompletionStorage';

/**
 * Computes which lab stages are unlocked based on act completion state.
 * Pure data service — no DOM, no side effects.
 * Callers handle persistence and UI updates.
 */
export class StageUnlockManager {
  private readonly storage: ActCompletionStorage;

  constructor(storage: ActCompletionStorage) {
    this.storage = storage;
  }

  /**
   * Compute the full list of unlocked stages from current act completion state.
   * Always includes 'micro4' (default). Each unlock rule evaluates independently.
   * Returns stages in LAB_STAGES order.
   */
  computeUnlockedStages(): LabStage[] {
    const completedActNumbers = new Set(this.storage.getCompletedActNumbers());
    const unlockedSet = new Set<LabStage>(['micro4']);

    for (const rule of STAGE_UNLOCK_RULES) {
      if (completedActNumbers.has(rule.requiredActNumber)) {
        unlockedSet.add(rule.stage);
      }
    }

    // Return in LAB_STAGES order
    return LAB_STAGES.filter(stage => unlockedSet.has(stage));
  }

  /**
   * Get the human-readable unlock requirement for a stage.
   * Returns null for micro4 (always unlocked) or already-unlocked stages.
   */
  getRequirementForStage(stage: LabStage): string | null {
    if (stage === 'micro4') return null;

    const rule = STAGE_UNLOCK_RULES.find(r => r.stage === stage);
    if (!rule) return null;

    // Check if already unlocked
    const completedActNumbers = new Set(this.storage.getCompletedActNumbers());
    if (completedActNumbers.has(rule.requiredActNumber)) return null;

    return `Complete Act ${rule.requiredActNumber}: ${rule.requiredActTitle}`;
  }

  /**
   * Compare current computed unlocks against previous state.
   * Returns only newly unlocked stages (for notification triggering).
   */
  evaluateNewUnlocks(previousUnlocked: LabStage[]): LabStage[] {
    const currentUnlocked = this.computeUnlockedStages();
    const previousSet = new Set(previousUnlocked);
    return currentUnlocked.filter(stage => !previousSet.has(stage));
  }
}
