// src/progress/StatisticsCollector.test.ts
// Tests for StatisticsCollector data aggregation service
// Story 19.6: Create Statistics Dashboard

import { describe, it, expect, beforeEach } from 'vitest';
import { StatisticsCollector } from './StatisticsCollector';
import { DiscoveryStorage } from './DiscoveryStorage';
import { ActCompletionStorage } from './ActCompletionStorage';
import { AchievementStorage } from './AchievementStorage';
import { StatisticsStorage } from './StatisticsStorage';
import { StageUnlockManager } from './StageUnlockManager';

describe('StatisticsCollector', () => {
  let collector: StatisticsCollector;
  let discoveryStorage: DiscoveryStorage;
  let actCompletionStorage: ActCompletionStorage;
  let achievementStorage: AchievementStorage;
  let statisticsStorage: StatisticsStorage;
  let stageUnlockManager: StageUnlockManager;

  beforeEach(() => {
    localStorage.clear();
    discoveryStorage = new DiscoveryStorage('test-disc');
    actCompletionStorage = new ActCompletionStorage('test-act');
    achievementStorage = new AchievementStorage('test-ach');
    statisticsStorage = new StatisticsStorage('test-stats');
    stageUnlockManager = new StageUnlockManager(actCompletionStorage);
    collector = new StatisticsCollector(
      discoveryStorage,
      actCompletionStorage,
      achievementStorage,
      statisticsStorage,
      stageUnlockManager,
    );
  });

  // Task 10.1: collect() with empty storage returns all zeroes
  it('should return all zeroes with empty storage', () => {
    const data = collector.collect();
    expect(data.programsAssembled).toBe(0);
    expect(data.instructionsExecuted).toBe(0);
    expect(data.errorsEncountered).toBe(0);
    expect(data.discoveriesEarned).toBe(0);
    expect(data.discoveriesTotal).toBe(7);
    expect(data.actsCompleted).toBe(0);
    expect(data.actsTotal).toBe(11);
    expect(data.achievementsEarned).toBe(0);
    expect(data.achievementsTotal).toBe(16);
    expect(data.stagesUnlocked).toBe(1); // micro4 always unlocked
    expect(data.stagesTotal).toBe(6);
    expect(data.totalSessionTime).toBe(0);
  });

  // Task 10.2: collect() aggregates discovery count correctly
  it('should aggregate discovery count correctly', () => {
    discoveryStorage.addDiscovery({
      type: 'first-assembly',
      timestamp: Date.now(),
      stage: 'micro4',
      experimentationMode: false,
    });
    discoveryStorage.addDiscovery({
      type: 'first-stack',
      timestamp: Date.now(),
      stage: 'micro8',
      experimentationMode: false,
    });

    const data = collector.collect();
    expect(data.discoveriesEarned).toBe(2);
    expect(data.discoveriesTotal).toBe(7);
  });

  // Task 10.3: collect() aggregates act completion count correctly
  it('should aggregate act completion count correctly', () => {
    actCompletionStorage.addCompletion({
      actNumber: 0,
      actId: 'act-0',
      timestamp: Date.now(),
      actTitle: 'Pre-history',
      era: '3000 BC',
    });
    actCompletionStorage.addCompletion({
      actNumber: 1,
      actId: 'act-1',
      timestamp: Date.now(),
      actTitle: 'Electromechanical',
      era: '1890s',
    });
    actCompletionStorage.addCompletion({
      actNumber: 4,
      actId: 'act-4',
      timestamp: Date.now(),
      actTitle: 'First Microprocessor',
      era: '1971',
    });

    const data = collector.collect();
    expect(data.actsCompleted).toBe(3);
    expect(data.actsTotal).toBe(11);
    // Act 4 unlocks micro8
    expect(data.stagesUnlocked).toBe(2);
  });

  // Task 10.4: collect() aggregates achievement count with tier breakdown
  it('should aggregate achievement count with tier breakdown', () => {
    achievementStorage.addAchievement({
      type: 'first-discovery',
      timestamp: Date.now(),
      tier: 'common',
    });
    achievementStorage.addAchievement({
      type: 'discovery-master',
      timestamp: Date.now(),
      tier: 'rare',
    });

    const data = collector.collect();
    expect(data.achievementsEarned).toBe(2);
    expect(data.achievementsTotal).toBe(16);
    expect(data.achievementsByTier.common.earned).toBe(1);
    expect(data.achievementsByTier.common.total).toBe(3); // 3 common achievements
    expect(data.achievementsByTier.rare.earned).toBe(1);
    expect(data.achievementsByTier.uncommon.earned).toBe(0);
  });

  // Task 10.5: collect() includes runtime stats
  it('should include runtime stats (programs, instructions, errors, time)', () => {
    statisticsStorage.incrementPrograms();
    statisticsStorage.incrementPrograms();
    statisticsStorage.addInstructionsExecuted(500);
    statisticsStorage.incrementErrors();
    statisticsStorage.addStageTime('micro4', 30000);
    statisticsStorage.addSessionTime(120000);

    const data = collector.collect();
    expect(data.programsAssembled).toBe(2);
    expect(data.instructionsExecuted).toBe(500);
    expect(data.errorsEncountered).toBe(1);
    expect(data.timePerStage.micro4).toBe(30000);
    expect(data.totalSessionTime).toBe(120000);
  });
});
