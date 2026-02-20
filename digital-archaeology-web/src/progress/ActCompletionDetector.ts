// src/progress/ActCompletionDetector.ts
// Act transition detection service for tracking act completions
// Story 19.2: Track Act Completion

import type { ActCompletion, ActCompletionType, StoryActSummary } from './types';
import type { ActCompletionStorage } from './ActCompletionStorage';

/**
 * Service that detects act boundary transitions.
 * When the user moves from one act to the next, this detects the completion
 * of the previous act.
 */
export class ActCompletionDetector {
  private storage: ActCompletionStorage;

  constructor(storage: ActCompletionStorage) {
    this.storage = storage;
  }

  /**
   * Detect act completions based on act number transition.
   * Returns all newly completed acts for the range [previousActNumber, currentActNumber).
   * Handles multi-act jumps by recording all intermediate completions.
   *
   * @param previousActNumber - The act number before the transition
   * @param currentActNumber - The act number after the transition
   * @param acts - Minimal act summaries for looking up title/era
   * @returns Array of ActCompletion entries (empty if no new completions)
   */
  detect(
    previousActNumber: number,
    currentActNumber: number,
    acts: readonly StoryActSummary[],
  ): ActCompletion[] {
    // Only detect completion when act number increases
    if (currentActNumber <= previousActNumber) return [];

    // Previous act must be valid (>= 0)
    if (previousActNumber < 0) return [];

    // Load completed acts once into a Set for O(1) lookup
    const completedIds = new Set(
      (this.storage.loadProfile()?.completions ?? []).map(c => c.actId),
    );

    const completions: ActCompletion[] = [];
    const now = Date.now();

    // Record all acts in range [previousActNumber, currentActNumber)
    for (let actNum = previousActNumber; actNum < currentActNumber; actNum++) {
      const actId = `act-${actNum}` as ActCompletionType;

      // Skip if already completed
      if (completedIds.has(actId)) continue;

      const actSummary = acts.find(a => a.number === actNum);
      const actTitle = actSummary?.title ?? `Act ${actNum}`;
      const era = actSummary?.era ?? 'Unknown';

      completions.push({
        actNumber: actNum,
        actId,
        timestamp: now,
        actTitle,
        era,
      });
    }

    return completions;
  }
}
