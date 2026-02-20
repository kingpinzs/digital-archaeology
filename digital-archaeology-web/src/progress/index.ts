// src/progress/index.ts
// Barrel exports for the progress module (Epic 19 foundation)
// Story 19.1: Track First-Time Discoveries
// Story 19.2: Track Act Completion
// Story 19.3: Create Milestone Achievements
// Story 19.4: Create Progress Visualization
// Story 19.5: Implement Stage Unlock System

export type {
  DiscoveryType,
  Discovery,
  DiscoveryProfile,
  DiscoveryMetadataEntry,
  ActCompletionType,
  ActCompletion,
  ActCompletionProfile,
  ActCompletionMetadataEntry,
  StoryActSummary,
  AchievementType,
  AchievementTier,
  Achievement,
  AchievementProfile,
  AchievementMetadataEntry,
  JourneyNodeStatus,
  JourneyNode,
  JourneyMapData,
  StageUnlockRule,
} from './types';

export {
  DEFAULT_DISCOVERY_PROFILE,
  DISCOVERY_METADATA,
  isValidDiscovery,
  isValidDiscoveryProfile,
  DEFAULT_ACT_COMPLETION_PROFILE,
  ACT_COMPLETION_METADATA,
  isValidActCompletion,
  isValidActCompletionProfile,
  DEFAULT_ACHIEVEMENT_PROFILE,
  ACHIEVEMENT_METADATA,
  isValidAchievement,
  isValidAchievementProfile,
  STAGE_UNLOCK_RULES,
} from './types';

export { DiscoveryStorage } from './DiscoveryStorage';
export { DiscoveryDetector } from './DiscoveryDetector';
export { DiscoveryNotification } from './DiscoveryNotification';
export { ActCompletionStorage } from './ActCompletionStorage';
export { ActCompletionDetector } from './ActCompletionDetector';
export { ActCelebration } from './ActCelebration';
export { AchievementStorage } from './AchievementStorage';
export { AchievementDetector } from './AchievementDetector';
export { AchievementToast } from './AchievementToast';
export { AchievementGallery } from './AchievementGallery';
export { JourneyMapBuilder } from './JourneyMapBuilder';
export { JourneyMap } from './JourneyMap';
export { StageUnlockManager } from './StageUnlockManager';
export { StageUnlockToast } from './StageUnlockToast';
