// src/progress/types.ts
// Discovery tracking data model, type guards, and metadata for Epic 19
// Story 19.1: Track First-Time Discoveries

import type { LabStage } from '../config/stageConfig';
import { LAB_STAGES } from '../config/stageConfig';

/**
 * Discovery types that can be earned by the user.
 * Each represents a first-time milestone in the learning journey.
 */
export type DiscoveryType =
  | 'first-assembly'
  | 'first-subroutine'
  | 'first-interrupt'
  | 'first-stack'
  | 'first-stage-micro4'
  | 'first-stage-micro8'
  | 'first-stage-micro16';

/** All valid discovery type values for type guard validation */
const VALID_DISCOVERY_TYPES: readonly string[] = [
  'first-assembly',
  'first-subroutine',
  'first-interrupt',
  'first-stack',
  'first-stage-micro4',
  'first-stage-micro8',
  'first-stage-micro16',
];

/**
 * A single discovery earned by the user.
 * All fields are readonly to enforce immutability.
 */
export interface Discovery {
  /** The type of discovery earned */
  readonly type: DiscoveryType;
  /** Timestamp when the discovery was earned (ms since epoch) */
  readonly timestamp: number;
  /** CPU stage where the discovery was earned */
  readonly stage: LabStage;
  /** Whether the discovery was earned with experimentation mode active */
  readonly experimentationMode: boolean;
}

/**
 * User's complete discovery profile.
 * Contains all discoveries earned across sessions.
 */
export interface DiscoveryProfile {
  /** All discoveries earned by the user */
  readonly discoveries: readonly Discovery[];
  /** Schema version for future migrations */
  readonly version: number;
}

/**
 * Default discovery profile for first-run and fallback.
 */
export const DEFAULT_DISCOVERY_PROFILE: DiscoveryProfile = {
  discoveries: [],
  version: 1,
};

/** Valid lab stages for type guard validation — derived from single source of truth */
const VALID_LAB_STAGES: readonly string[] = LAB_STAGES;

/**
 * Type guard for Discovery.
 * Validates structure and all field types.
 */
export function isValidDiscovery(value: unknown): value is Discovery {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.type === 'string' &&
    VALID_DISCOVERY_TYPES.includes(obj.type) &&
    typeof obj.timestamp === 'number' &&
    obj.timestamp >= 0 &&
    typeof obj.stage === 'string' &&
    VALID_LAB_STAGES.includes(obj.stage) &&
    typeof obj.experimentationMode === 'boolean'
  );
}

/**
 * Type guard for DiscoveryProfile.
 * Validates complete profile structure and all nested discoveries.
 */
export function isValidDiscoveryProfile(value: unknown): value is DiscoveryProfile {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    Array.isArray(obj.discoveries) &&
    obj.discoveries.every(isValidDiscovery) &&
    typeof obj.version === 'number' &&
    Number.isInteger(obj.version) &&
    obj.version >= 1
  );
}

/**
 * Display metadata for each discovery type.
 * Used by DiscoveryNotification to show human-readable information.
 */
export interface DiscoveryMetadataEntry {
  readonly title: string;
  readonly description: string;
  readonly icon: string;
}

/**
 * Human-readable display data for each discovery type.
 */
export const DISCOVERY_METADATA: Record<DiscoveryType, DiscoveryMetadataEntry> = {
  'first-assembly': {
    title: 'First Program!',
    description: 'You assembled your first program successfully.',
    icon: '\u{1F680}',
  },
  'first-subroutine': {
    title: 'Subroutine Pioneer',
    description: 'You used subroutine calls for the first time.',
    icon: '\u{1F504}',
  },
  'first-interrupt': {
    title: 'Interrupt Handler',
    description: 'You wrote your first interrupt handler.',
    icon: '\u{26A1}',
  },
  'first-stack': {
    title: 'Stack Explorer',
    description: 'You used stack operations for the first time.',
    icon: '\u{1F4DA}',
  },
  'first-stage-micro4': {
    title: 'Micro4 Initiate',
    description: 'You assembled your first Micro4 program.',
    icon: '\u{1F31F}',
  },
  'first-stage-micro8': {
    title: 'Micro8 Explorer',
    description: 'You assembled your first Micro8 program.',
    icon: '\u{2B50}',
  },
  'first-stage-micro16': {
    title: 'Micro16 Pioneer',
    description: 'You assembled your first Micro16 program.',
    icon: '\u{1F4AB}',
  },
};
