// src/progress/AchievementDetector.ts
// Milestone evaluation service for detecting new achievements
// Story 19.3: Create Milestone Achievements

import type { Achievement, AchievementType } from './types';
import { ACHIEVEMENT_METADATA } from './types';
import type { AchievementStorage } from './AchievementStorage';
import type { DiscoveryStorage } from './DiscoveryStorage';
import type { ActCompletionStorage } from './ActCompletionStorage';

/**
 * Service that evaluates milestone conditions and detects new achievements.
 * Reads from all three storage profiles (discoveries, act completions, achievements)
 * to determine which composite milestones have been reached.
 */
export class AchievementDetector {
  private achievementStorage: AchievementStorage;
  private discoveryStorage: DiscoveryStorage;
  private actCompletionStorage: ActCompletionStorage;

  constructor(
    achievementStorage: AchievementStorage,
    discoveryStorage: DiscoveryStorage,
    actCompletionStorage: ActCompletionStorage,
  ) {
    this.achievementStorage = achievementStorage;
    this.discoveryStorage = discoveryStorage;
    this.actCompletionStorage = actCompletionStorage;
  }

  /**
   * Evaluate all milestone conditions and return newly earned achievements.
   * Returns only achievements that have NOT been previously earned.
   */
  evaluate(): Achievement[] {
    // Load all three profiles once for efficiency
    const achievementProfile = this.achievementStorage.getProfileOrDefault();
    const discoveryProfile = this.discoveryStorage.getProfileOrDefault();
    const actCompletionProfile = this.actCompletionStorage.getProfileOrDefault();

    // Build Set of already-earned achievement types for O(1) lookup
    const earnedTypes = new Set<string>(
      achievementProfile.completions.map(a => a.type),
    );

    // Pre-compute state from profiles
    const discoveryCount = discoveryProfile.discoveries.length;
    const discoveryTypes = new Set(discoveryProfile.discoveries.map(d => d.type));
    const actCompletionCount = actCompletionProfile.completions.length;
    const completedActIds = new Set(actCompletionProfile.completions.map(c => c.actId));
    const stageDiscoveryCount = discoveryProfile.discoveries.filter(
      d => d.type.startsWith('first-stage-'),
    ).length;

    const now = Date.now();
    const newAchievements: Achievement[] = [];

    // Check each milestone condition
    const conditions: [AchievementType, boolean][] = [
      // Discovery-count milestones
      ['first-discovery', discoveryCount >= 1],
      ['discovery-collector', discoveryCount >= 3],
      ['discovery-master', discoveryCount >= 7],

      // Act completion-count milestones
      ['first-act-complete', actCompletionCount >= 1],
      ['acts-explorer', actCompletionCount >= 3],
      ['halfway-there', actCompletionCount >= 5],
      ['story-completionist', actCompletionCount >= 11],

      // Specific act milestones
      ['micro4-graduate', completedActIds.has('act-4')],
      ['micro8-graduate', completedActIds.has('act-5')],
      ['micro16-graduate', completedActIds.has('act-6')],

      // Discovery-type milestones
      ['code-pioneer', discoveryTypes.has('first-assembly')],
      ['subroutine-architect', discoveryTypes.has('first-subroutine')],
      ['interrupt-expert', discoveryTypes.has('first-interrupt')],
      ['stack-wizard', discoveryTypes.has('first-stack')],

      // Stage-based milestones
      ['multi-stage-explorer', stageDiscoveryCount >= 2],
      ['all-stages-master', stageDiscoveryCount >= 3],
    ];

    for (const [type, conditionMet] of conditions) {
      if (conditionMet && !earnedTypes.has(type)) {
        newAchievements.push({
          type,
          timestamp: now,
          tier: ACHIEVEMENT_METADATA[type].tier,
        });
      }
    }

    return newAchievements;
  }
}
