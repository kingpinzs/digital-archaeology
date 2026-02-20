// src/progress/index.ts
// Barrel exports for the progress module (Epic 19 foundation)
// Story 19.1: Track First-Time Discoveries
// Story 19.2: Track Act Completion

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
} from './types';

export { DiscoveryStorage } from './DiscoveryStorage';
export { DiscoveryDetector } from './DiscoveryDetector';
export { DiscoveryNotification } from './DiscoveryNotification';
export { ActCompletionStorage } from './ActCompletionStorage';
export { ActCompletionDetector } from './ActCompletionDetector';
export { ActCelebration } from './ActCelebration';
