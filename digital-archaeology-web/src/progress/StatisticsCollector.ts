// src/progress/StatisticsCollector.ts
// Data aggregation service for the statistics dashboard
// Story 19.6: Create Statistics Dashboard

import type { AchievementTier, DashboardData } from './types';
import { ACHIEVEMENT_METADATA } from './types';
import type { DiscoveryStorage } from './DiscoveryStorage';
import type { ActCompletionStorage } from './ActCompletionStorage';
import type { AchievementStorage } from './AchievementStorage';
import type { StatisticsStorage } from './StatisticsStorage';
import type { StageUnlockManager } from './StageUnlockManager';

/**
 * Pure data aggregation service (no DOM).
 * Reads from all storage classes and returns a single DashboardData object.
 * The collector does NOT store state — it computes fresh each time the dashboard opens.
 * Follows JourneyMapBuilder pattern.
 */
export class StatisticsCollector {
  private readonly discoveryStorage: DiscoveryStorage;
  private readonly actCompletionStorage: ActCompletionStorage;
  private readonly achievementStorage: AchievementStorage;
  private readonly statisticsStorage: StatisticsStorage;
  private readonly stageUnlockManager: StageUnlockManager;

  constructor(
    discoveryStorage: DiscoveryStorage,
    actCompletionStorage: ActCompletionStorage,
    achievementStorage: AchievementStorage,
    statisticsStorage: StatisticsStorage,
    stageUnlockManager: StageUnlockManager,
  ) {
    this.discoveryStorage = discoveryStorage;
    this.actCompletionStorage = actCompletionStorage;
    this.achievementStorage = achievementStorage;
    this.statisticsStorage = statisticsStorage;
    this.stageUnlockManager = stageUnlockManager;
  }

  /**
   * Collect all statistics from storage and return aggregated data.
   */
  collect(): DashboardData {
    const stats = this.statisticsStorage.getStatisticsOrDefault();
    const discoveryProfile = this.discoveryStorage.getProfileOrDefault();
    const completedActs = this.actCompletionStorage.getCompletedActNumbers();
    const earnedTypes = this.achievementStorage.getEarnedAchievementTypes();
    const unlockedStages = this.stageUnlockManager.computeUnlockedStages();

    // Build tier breakdown
    const achievementsByTier = this.buildTierBreakdown(new Set(earnedTypes));

    return {
      programsAssembled: stats.programsAssembled,
      instructionsExecuted: stats.instructionsExecuted,
      errorsEncountered: stats.errorsEncountered,
      discoveriesEarned: discoveryProfile.discoveries.length,
      discoveriesTotal: 7,
      actsCompleted: completedActs.length,
      actsTotal: 11,
      achievementsEarned: earnedTypes.length,
      achievementsTotal: 16,
      achievementsByTier,
      stagesUnlocked: unlockedStages.length,
      stagesTotal: 6,
      timePerStage: { ...stats.timePerStage },
      totalSessionTime: stats.totalSessionTime,
    };
  }

  private buildTierBreakdown(earnedSet: Set<string>): Record<AchievementTier, { earned: number; total: number }> {
    const result: Record<AchievementTier, { earned: number; total: number }> = {
      common: { earned: 0, total: 0 },
      uncommon: { earned: 0, total: 0 },
      rare: { earned: 0, total: 0 },
      epic: { earned: 0, total: 0 },
      legendary: { earned: 0, total: 0 },
    };

    for (const [type, meta] of Object.entries(ACHIEVEMENT_METADATA)) {
      const tier = meta.tier as AchievementTier;
      result[tier].total++;
      if (earnedSet.has(type)) {
        result[tier].earned++;
      }
    }

    return result;
  }
}
