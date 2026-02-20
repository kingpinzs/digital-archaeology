// src/progress/StageUnlockManager.test.ts
// Tests for StageUnlockManager stage unlock computation service
// Story 19.5: Implement Stage Unlock System

import { describe, it, expect, beforeEach } from 'vitest';
import { StageUnlockManager } from './StageUnlockManager';
import { ActCompletionStorage } from './ActCompletionStorage';
import type { ActCompletionType } from './types';
import { ACT_COMPLETION_METADATA } from './types';

const TEST_STORAGE_KEY = 'test-stage-unlock-manager';

/** Helper to add a completion for a given act number */
function addCompletion(storage: ActCompletionStorage, actNumber: number): void {
  const actId = `act-${actNumber}` as ActCompletionType;
  const meta = ACT_COMPLETION_METADATA[actId];
  storage.addCompletion({
    actNumber,
    actId,
    timestamp: Date.now(),
    actTitle: meta.title,
    era: meta.era,
  });
}

describe('StageUnlockManager', () => {
  let storage: ActCompletionStorage;
  let manager: StageUnlockManager;

  beforeEach(() => {
    localStorage.clear();
    storage = new ActCompletionStorage(TEST_STORAGE_KEY);
    manager = new StageUnlockManager(storage);
  });

  // Task 8.1: No completions → only micro4
  it('should return only micro4 when no acts are completed', () => {
    const unlocked = manager.computeUnlockedStages();
    expect(unlocked).toEqual(['micro4']);
  });

  // Task 8.2: act-4 completed → micro4 + micro8
  it('should unlock micro8 when act-4 is completed', () => {
    addCompletion(storage, 4);
    const unlocked = manager.computeUnlockedStages();
    expect(unlocked).toEqual(['micro4', 'micro8']);
  });

  // Task 8.3: acts 4-8 completed → all 6 stages
  it('should unlock all stages when acts 4-8 are completed', () => {
    for (let i = 4; i <= 8; i++) {
      addCompletion(storage, i);
    }
    const unlocked = manager.computeUnlockedStages();
    expect(unlocked).toEqual(['micro4', 'micro8', 'micro16', 'micro32', 'micro32p', 'micro32s']);
  });

  // Task 8.4: Non-sequential completions — each rule evaluates independently
  it('should unlock stages independently for non-sequential completions', () => {
    addCompletion(storage, 4); // unlocks micro8
    addCompletion(storage, 6); // unlocks micro32 (act-5 NOT completed, so micro16 NOT unlocked)
    const unlocked = manager.computeUnlockedStages();
    expect(unlocked).toEqual(['micro4', 'micro8', 'micro32']);
  });

  // Task 8.5: Returns stages in LAB_STAGES order
  it('should return stages in LAB_STAGES order', () => {
    // Add completions in reverse order
    addCompletion(storage, 8);
    addCompletion(storage, 4);
    const unlocked = manager.computeUnlockedStages();
    // Should still be in LAB_STAGES order, not insertion order
    expect(unlocked).toEqual(['micro4', 'micro8', 'micro32s']);
  });

  // Task 8.6: getRequirementForStage('micro4') → null
  it('should return null requirement for micro4 (always unlocked)', () => {
    expect(manager.getRequirementForStage('micro4')).toBeNull();
  });

  // Task 8.7: getRequirementForStage('micro8') when act-4 NOT completed → requirement string
  it('should return requirement string for locked stage', () => {
    const req = manager.getRequirementForStage('micro8');
    expect(req).toBe('Complete Act 4: First Microprocessor');
  });

  // Task 8.8: getRequirementForStage('micro8') when act-4 IS completed → null
  it('should return null for already-unlocked stage', () => {
    addCompletion(storage, 4);
    expect(manager.getRequirementForStage('micro8')).toBeNull();
  });

  // Test all requirement strings
  it('should return correct requirement strings for all locked stages', () => {
    expect(manager.getRequirementForStage('micro16')).toBe('Complete Act 5: 8-bit Era');
    expect(manager.getRequirementForStage('micro32')).toBe('Complete Act 6: 16-bit Era');
    expect(manager.getRequirementForStage('micro32p')).toBe('Complete Act 7: 32-bit Era');
    expect(manager.getRequirementForStage('micro32s')).toBe('Complete Act 8: Pipelined');
  });

  // Task 8.9: evaluateNewUnlocks returns only newly unlocked stages
  it('should return only newly unlocked stages', () => {
    addCompletion(storage, 4); // unlocks micro8
    addCompletion(storage, 5); // unlocks micro16
    const newUnlocks = manager.evaluateNewUnlocks(['micro4']);
    expect(newUnlocks).toEqual(['micro8', 'micro16']);
  });

  // Task 8.10: evaluateNewUnlocks returns empty when no new unlocks
  it('should return empty array when no new unlocks', () => {
    addCompletion(storage, 4);
    const newUnlocks = manager.evaluateNewUnlocks(['micro4', 'micro8']);
    expect(newUnlocks).toEqual([]);
  });

  it('should return empty array when previous already has all current', () => {
    const newUnlocks = manager.evaluateNewUnlocks(['micro4']);
    expect(newUnlocks).toEqual([]);
  });

  // Edge case: completing story-only acts (0-3, 9, 10) unlocks nothing
  it('should not unlock any stage for story-only act completions', () => {
    addCompletion(storage, 0);
    addCompletion(storage, 1);
    addCompletion(storage, 2);
    addCompletion(storage, 3);
    addCompletion(storage, 9);
    addCompletion(storage, 10);
    const unlocked = manager.computeUnlockedStages();
    expect(unlocked).toEqual(['micro4']);
  });
});
