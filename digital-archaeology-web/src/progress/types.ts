// src/progress/types.ts
// Progress tracking data model, type guards, and metadata for Epic 19
// Story 19.1: Track First-Time Discoveries
// Story 19.2: Track Act Completion
// Story 19.3: Create Milestone Achievements

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

// =============================================================================
// Achievement Tracking (Story 19.3)
// =============================================================================

/**
 * Achievement type identifiers — 16 milestone achievements across 5 tiers.
 */
export type AchievementType =
  | 'first-discovery'
  | 'discovery-collector'
  | 'discovery-master'
  | 'first-act-complete'
  | 'acts-explorer'
  | 'halfway-there'
  | 'story-completionist'
  | 'micro4-graduate'
  | 'micro8-graduate'
  | 'micro16-graduate'
  | 'code-pioneer'
  | 'subroutine-architect'
  | 'interrupt-expert'
  | 'stack-wizard'
  | 'multi-stage-explorer'
  | 'all-stages-master';

/** All valid achievement type values for type guard validation */
const VALID_ACHIEVEMENT_TYPES: readonly string[] = [
  'first-discovery',
  'discovery-collector',
  'discovery-master',
  'first-act-complete',
  'acts-explorer',
  'halfway-there',
  'story-completionist',
  'micro4-graduate',
  'micro8-graduate',
  'micro16-graduate',
  'code-pioneer',
  'subroutine-architect',
  'interrupt-expert',
  'stack-wizard',
  'multi-stage-explorer',
  'all-stages-master',
];

/**
 * Achievement tier — determines display color and rarity.
 */
export type AchievementTier = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

/** All valid achievement tiers for type guard validation */
const VALID_ACHIEVEMENT_TIERS: readonly string[] = [
  'common', 'uncommon', 'rare', 'epic', 'legendary',
];

/**
 * A single achievement earned by the user.
 * All fields are readonly to enforce immutability.
 */
export interface Achievement {
  /** The type of achievement earned */
  readonly type: AchievementType;
  /** Timestamp when the achievement was earned (ms since epoch) */
  readonly timestamp: number;
  /** The tier of the achievement */
  readonly tier: AchievementTier;
}

/**
 * User's complete achievement profile.
 * Contains all achievements earned across sessions.
 */
export interface AchievementProfile {
  /** All achievements earned by the user */
  readonly completions: readonly Achievement[];
  /** Schema version for future migrations */
  readonly version: number;
}

/**
 * Default achievement profile for first-run and fallback.
 */
export const DEFAULT_ACHIEVEMENT_PROFILE: AchievementProfile = {
  completions: [],
  version: 1,
};

/**
 * Type guard for Achievement.
 * Validates structure and all field types.
 */
export function isValidAchievement(value: unknown): value is Achievement {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.type === 'string' &&
    VALID_ACHIEVEMENT_TYPES.includes(obj.type) &&
    typeof obj.timestamp === 'number' &&
    obj.timestamp >= 0 &&
    typeof obj.tier === 'string' &&
    VALID_ACHIEVEMENT_TIERS.includes(obj.tier)
  );
}

/**
 * Type guard for AchievementProfile.
 * Validates complete profile structure and all nested achievements.
 */
export function isValidAchievementProfile(value: unknown): value is AchievementProfile {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    Array.isArray(obj.completions) &&
    obj.completions.every(isValidAchievement) &&
    typeof obj.version === 'number' &&
    Number.isInteger(obj.version) &&
    obj.version >= 1
  );
}

/**
 * Display metadata for each achievement type.
 * Used by AchievementToast and AchievementGallery to show human-readable information.
 */
export interface AchievementMetadataEntry {
  readonly title: string;
  readonly description: string;
  readonly icon: string;
  readonly tier: AchievementTier;
}

/**
 * Human-readable display data for all 16 achievements.
 */
export const ACHIEVEMENT_METADATA: Record<AchievementType, AchievementMetadataEntry> = {
  'first-discovery': {
    title: 'First Discovery',
    description: 'Earned your first discovery.',
    icon: '\u{1F50D}',
    tier: 'common',
  },
  'discovery-collector': {
    title: 'Discovery Collector',
    description: 'Earned 3 discoveries.',
    icon: '\u{1F4E6}',
    tier: 'uncommon',
  },
  'discovery-master': {
    title: 'Discovery Master',
    description: 'Earned all 7 discovery types.',
    icon: '\u{1F451}',
    tier: 'rare',
  },
  'first-act-complete': {
    title: 'Chapter One',
    description: 'Completed your first act.',
    icon: '\u{1F4D6}',
    tier: 'common',
  },
  'acts-explorer': {
    title: 'Acts Explorer',
    description: 'Completed 3 acts.',
    icon: '\u{1F5FA}',
    tier: 'uncommon',
  },
  'halfway-there': {
    title: 'Halfway There',
    description: 'Completed 5 acts.',
    icon: '\u{23F3}',
    tier: 'rare',
  },
  'story-completionist': {
    title: 'Story Completionist',
    description: 'Completed all 11 acts.',
    icon: '\u{1F3C6}',
    tier: 'legendary',
  },
  'micro4-graduate': {
    title: 'Micro4 Graduate',
    description: 'Completed the Micro4 era (Act 4).',
    icon: '\u{1F393}',
    tier: 'uncommon',
  },
  'micro8-graduate': {
    title: 'Micro8 Graduate',
    description: 'Completed the Micro8 era (Act 5).',
    icon: '\u{1F393}',
    tier: 'uncommon',
  },
  'micro16-graduate': {
    title: 'Micro16 Graduate',
    description: 'Completed the Micro16 era (Act 6).',
    icon: '\u{1F393}',
    tier: 'rare',
  },
  'code-pioneer': {
    title: 'Code Pioneer',
    description: 'Assembled your first program.',
    icon: '\u{1F4DD}',
    tier: 'common',
  },
  'subroutine-architect': {
    title: 'Subroutine Architect',
    description: 'Used subroutines for the first time.',
    icon: '\u{1F3D7}',
    tier: 'uncommon',
  },
  'interrupt-expert': {
    title: 'Interrupt Expert',
    description: 'Wrote your first interrupt handler.',
    icon: '\u{26A1}',
    tier: 'rare',
  },
  'stack-wizard': {
    title: 'Stack Wizard',
    description: 'Used stack operations.',
    icon: '\u{1FA84}',
    tier: 'uncommon',
  },
  'multi-stage-explorer': {
    title: 'Multi-Stage Explorer',
    description: 'Assembled in 2+ CPU stages.',
    icon: '\u{1F30D}',
    tier: 'rare',
  },
  'all-stages-master': {
    title: 'All Stages Master',
    description: 'Assembled in all 3 CPU stages.',
    icon: '\u{2728}',
    tier: 'epic',
  },
};

// =============================================================================
// Journey Map Visualization (Story 19.4)
// =============================================================================

/**
 * Status of a journey map node (act) in the visualization.
 */
export type JourneyNodeStatus = 'completed' | 'current' | 'upcoming' | 'locked';

/**
 * A single node in the journey map, representing one act.
 * All fields are readonly to enforce immutability.
 */
export interface JourneyNode {
  /** Act number (0-10) */
  readonly actNumber: number;
  /** Display title for the act */
  readonly title: string;
  /** Historical era string */
  readonly era: string;
  /** Emoji icon for the act */
  readonly icon: string;
  /** CPU stage name (e.g., 'mechanical', 'micro4') */
  readonly cpuStage: string;
  /** Visual status of this node */
  readonly status: JourneyNodeStatus;
}

/**
 * Complete data for rendering the journey map visualization.
 */
export interface JourneyMapData {
  /** All 11 act nodes in order */
  readonly nodes: readonly JourneyNode[];
  /** Total number of acts */
  readonly totalActs: number;
  /** Number of completed acts */
  readonly completedCount: number;
  /** Current act number (0-10) */
  readonly currentActNumber: number;
}

// =============================================================================
// Stage Unlock System (Story 19.5)
// =============================================================================

/**
 * Defines the act completion required to unlock a specific lab stage.
 * Each rule is independent — completing the required act unlocks the stage
 * regardless of whether other acts are completed.
 */
export interface StageUnlockRule {
  /** The lab stage that gets unlocked */
  readonly stage: LabStage;
  /** The act number that must be completed to unlock this stage */
  readonly requiredActNumber: number;
  /** Human-readable title of the required act (for display in requirements) */
  readonly requiredActTitle: string;
}

/**
 * Ordered list of stage unlock rules.
 * micro4 is always unlocked (not in this list).
 * Each entry maps a completed act to the lab stage it unlocks.
 * Tuple type enforces exactly 5 entries at compile time.
 */
export const STAGE_UNLOCK_RULES: readonly [StageUnlockRule, StageUnlockRule, StageUnlockRule, StageUnlockRule, StageUnlockRule] = [
  { stage: 'micro8', requiredActNumber: 4, requiredActTitle: 'First Microprocessor' },
  { stage: 'micro16', requiredActNumber: 5, requiredActTitle: '8-bit Era' },
  { stage: 'micro32', requiredActNumber: 6, requiredActTitle: '16-bit Era' },
  { stage: 'micro32p', requiredActNumber: 7, requiredActTitle: '32-bit Era' },
  { stage: 'micro32s', requiredActNumber: 8, requiredActTitle: 'Pipelined' },
];
