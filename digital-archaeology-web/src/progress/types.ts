// src/progress/types.ts
// Progress tracking data model, type guards, and metadata for Epic 19
// Story 19.1: Track First-Time Discoveries
// Story 19.2: Track Act Completion

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

// =============================================================================
// Act Completion Tracking (Story 19.2)
// =============================================================================

/**
 * Act completion type identifiers.
 * Acts are numbered 0-10 (11 total), corresponding to CpuStage values.
 */
export type ActCompletionType =
  | 'act-0'
  | 'act-1'
  | 'act-2'
  | 'act-3'
  | 'act-4'
  | 'act-5'
  | 'act-6'
  | 'act-7'
  | 'act-8'
  | 'act-9'
  | 'act-10';

/** All valid act completion type values for type guard validation */
const VALID_ACT_COMPLETION_TYPES: readonly string[] = [
  'act-0', 'act-1', 'act-2', 'act-3', 'act-4',
  'act-5', 'act-6', 'act-7', 'act-8', 'act-9', 'act-10',
];

/**
 * A single act completion event.
 * All fields are readonly to enforce immutability.
 */
export interface ActCompletion {
  /** The act number (0-10) */
  readonly actNumber: number;
  /** The act completion type identifier */
  readonly actId: ActCompletionType;
  /** Timestamp when the act was completed (ms since epoch) */
  readonly timestamp: number;
  /** Human-readable act title */
  readonly actTitle: string;
  /** Historical era string */
  readonly era: string;
}

/**
 * User's complete act completion profile.
 * Contains all act completions across sessions.
 */
export interface ActCompletionProfile {
  /** All act completions earned by the user */
  readonly completions: readonly ActCompletion[];
  /** Schema version for future migrations */
  readonly version: number;
}

/**
 * Default act completion profile for first-run and fallback.
 */
export const DEFAULT_ACT_COMPLETION_PROFILE: ActCompletionProfile = {
  completions: [],
  version: 1,
};

/**
 * Type guard for ActCompletion.
 * Validates structure and all field types.
 */
export function isValidActCompletion(value: unknown): value is ActCompletion {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.actNumber === 'number' &&
    Number.isInteger(obj.actNumber) &&
    obj.actNumber >= 0 &&
    obj.actNumber <= 10 &&
    typeof obj.actId === 'string' &&
    VALID_ACT_COMPLETION_TYPES.includes(obj.actId) &&
    typeof obj.timestamp === 'number' &&
    obj.timestamp >= 0 &&
    typeof obj.actTitle === 'string' &&
    (obj.actTitle as string).length > 0 &&
    typeof obj.era === 'string' &&
    (obj.era as string).length > 0 &&
    obj.actId === `act-${obj.actNumber}`
  );
}

/**
 * Type guard for ActCompletionProfile.
 * Validates complete profile structure and all nested completions.
 */
export function isValidActCompletionProfile(value: unknown): value is ActCompletionProfile {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    Array.isArray(obj.completions) &&
    obj.completions.every(isValidActCompletion) &&
    typeof obj.version === 'number' &&
    Number.isInteger(obj.version) &&
    obj.version >= 1
  );
}

/**
 * Display metadata entry for act completions.
 */
export interface ActCompletionMetadataEntry {
  readonly title: string;
  readonly era: string;
  readonly icon: string;
}

/**
 * Human-readable display data for each act completion.
 * Hardcoded so it works even when story content isn't loaded.
 */
export const ACT_COMPLETION_METADATA: Record<ActCompletionType, ActCompletionMetadataEntry> = {
  'act-0': { title: 'Pre-history', era: '3000 BC - 1840s', icon: '\u{1F3DB}' },
  'act-1': { title: 'Electromechanical', era: '1890s - 1945', icon: '\u{26A1}' },
  'act-2': { title: 'Vacuum Tubes', era: '1945 - 1955', icon: '\u{1F4A1}' },
  'act-3': { title: 'Transistors', era: '1955 - 1970', icon: '\u{1F50C}' },
  'act-4': { title: 'First Microprocessor', era: '1971', icon: '\u{1F4BB}' },
  'act-5': { title: '8-bit Era', era: '1974-1978', icon: '\u{1F3AE}' },
  'act-6': { title: '16-bit Era', era: '1978-1985', icon: '\u{1F4CA}' },
  'act-7': { title: '32-bit Era', era: '1985-1995', icon: '\u{1F5A5}' },
  'act-8': { title: 'Pipelined', era: '1989-1995', icon: '\u{2699}' },
  'act-9': { title: 'Superscalar', era: '1995+', icon: '\u{1F680}' },
  'act-10': { title: 'Future Computing', era: '2015+', icon: '\u{1F52E}' },
};

/**
 * Minimal act summary for use by ActCompletionDetector.
 * Decoupled from the full StoryAct type in story/content-types.ts.
 */
export interface StoryActSummary {
  readonly number: number;
  readonly title: string;
  readonly era: string;
}
