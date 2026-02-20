// src/progress/StatisticsStorage.test.ts
// Tests for StatisticsStorage persistence service
// Story 19.6: Create Statistics Dashboard

import { describe, it, expect, beforeEach } from 'vitest';
import { StatisticsStorage } from './StatisticsStorage';

describe('StatisticsStorage', () => {
  let storage: StatisticsStorage;
  const TEST_KEY = 'test-statistics';

  beforeEach(() => {
    localStorage.clear();
    storage = new StatisticsStorage(TEST_KEY);
  });

  // Task 9.1: getStatisticsOrDefault() returns zeroes initially
  it('should return default zeroes when no data exists', () => {
    const stats = storage.getStatisticsOrDefault();
    expect(stats.programsAssembled).toBe(0);
    expect(stats.instructionsExecuted).toBe(0);
    expect(stats.errorsEncountered).toBe(0);
    expect(stats.totalSessionTime).toBe(0);
    expect(stats.timePerStage.micro4).toBe(0);
    expect(stats.timePerStage.micro8).toBe(0);
    expect(stats.timePerStage.micro16).toBe(0);
    expect(stats.timePerStage.micro32).toBe(0);
    expect(stats.timePerStage.micro32p).toBe(0);
    expect(stats.timePerStage.micro32s).toBe(0);
    expect(stats.version).toBe(1);
  });

  // Task 9.2: incrementPrograms() increments counter
  it('should increment programs assembled counter', () => {
    storage.incrementPrograms();
    expect(storage.getStatisticsOrDefault().programsAssembled).toBe(1);

    storage.incrementPrograms();
    expect(storage.getStatisticsOrDefault().programsAssembled).toBe(2);
  });

  // Task 9.3: addInstructionsExecuted() accumulates
  it('should accumulate instructions executed', () => {
    storage.addInstructionsExecuted(100);
    expect(storage.getStatisticsOrDefault().instructionsExecuted).toBe(100);

    storage.addInstructionsExecuted(50);
    expect(storage.getStatisticsOrDefault().instructionsExecuted).toBe(150);
  });

  // Task 9.4: incrementErrors() increments counter
  it('should increment errors encountered counter', () => {
    storage.incrementErrors();
    expect(storage.getStatisticsOrDefault().errorsEncountered).toBe(1);

    storage.incrementErrors();
    storage.incrementErrors();
    expect(storage.getStatisticsOrDefault().errorsEncountered).toBe(3);
  });

  // Task 9.5: addStageTime() accumulates per-stage time
  it('should accumulate per-stage time', () => {
    storage.addStageTime('micro4', 5000);
    expect(storage.getStatisticsOrDefault().timePerStage.micro4).toBe(5000);

    storage.addStageTime('micro4', 3000);
    expect(storage.getStatisticsOrDefault().timePerStage.micro4).toBe(8000);

    storage.addStageTime('micro8', 2000);
    expect(storage.getStatisticsOrDefault().timePerStage.micro8).toBe(2000);
    // micro4 unchanged
    expect(storage.getStatisticsOrDefault().timePerStage.micro4).toBe(8000);
  });

  // Task 9.6: addSessionTime() accumulates
  it('should accumulate total session time', () => {
    storage.addSessionTime(60000);
    expect(storage.getStatisticsOrDefault().totalSessionTime).toBe(60000);

    storage.addSessionTime(30000);
    expect(storage.getStatisticsOrDefault().totalSessionTime).toBe(90000);
  });

  // Task 9.7: persistence round-trip
  it('should persist data across fresh instances', () => {
    storage.incrementPrograms();
    storage.addInstructionsExecuted(42);
    storage.incrementErrors();
    storage.addStageTime('micro16', 7000);
    storage.addSessionTime(120000);

    // Create fresh instance with same key
    const fresh = new StatisticsStorage(TEST_KEY);
    const stats = fresh.getStatisticsOrDefault();
    expect(stats.programsAssembled).toBe(1);
    expect(stats.instructionsExecuted).toBe(42);
    expect(stats.errorsEncountered).toBe(1);
    expect(stats.timePerStage.micro16).toBe(7000);
    expect(stats.totalSessionTime).toBe(120000);
  });

  // Task 9.8: graceful handling of corrupted localStorage data
  it('should return defaults for corrupted localStorage data', () => {
    localStorage.setItem(TEST_KEY, '{"not":"valid"}');
    const stats = storage.getStatisticsOrDefault();
    expect(stats.programsAssembled).toBe(0);
    expect(stats.instructionsExecuted).toBe(0);
  });

  it('should return defaults for invalid JSON', () => {
    localStorage.setItem(TEST_KEY, 'not json at all');
    const stats = storage.getStatisticsOrDefault();
    expect(stats.programsAssembled).toBe(0);
  });

  it('should clear corrupted data on load', () => {
    localStorage.setItem(TEST_KEY, '{"corrupted":true}');
    storage.loadStatistics();
    expect(localStorage.getItem(TEST_KEY)).toBeNull();
  });
});
