// src/progress/index.ts
// Barrel exports for the progress module (Epic 19 foundation)
// Story 19.1: Track First-Time Discoveries

export type {
  DiscoveryType,
  Discovery,
  DiscoveryProfile,
  DiscoveryMetadataEntry,
} from './types';

export {
  DEFAULT_DISCOVERY_PROFILE,
  DISCOVERY_METADATA,
  isValidDiscovery,
  isValidDiscoveryProfile,
} from './types';

export { DiscoveryStorage } from './DiscoveryStorage';
export { DiscoveryDetector } from './DiscoveryDetector';
export { DiscoveryNotification } from './DiscoveryNotification';
