// src/progress/collectible-types.ts
// Type definitions for clickable locations (world map) and collectible artifact cards
// Extends the progress tracking system with geographic and artifact collection data

/**
 * Rarity tier for collectible artifacts.
 * Determines border glow color and display treatment.
 */
export type ArtifactRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

/** All valid artifact rarity values for type guard validation */
const VALID_ARTIFACT_RARITIES: readonly string[] = [
  'common', 'uncommon', 'rare', 'legendary',
];

/**
 * A location entry in the world map registry.
 * Coordinates are percentages of the SVG viewBox (0-100).
 */
export interface LocationEntry {
  /** Unique identifier (e.g., 'lebombo') */
  readonly id: string;
  /** Display name (e.g., 'Lebombo Mountains, Swaziland') */
  readonly name: string;
  /** X coordinate as percentage of SVG width */
  readonly x: number;
  /** Y coordinate as percentage of SVG height */
  readonly y: number;
  /** Act number where this location appears (0-10) */
  readonly actNumber: number;
  /** Historical era string */
  readonly era: string;
  /** Short description of what happened here */
  readonly description: string;
  /** Emoji icon for the map pin */
  readonly icon: string;
}

/**
 * An artifact entry in the collectible registry.
 * Images use Wikimedia Commons thumbnail URLs.
 */
export interface ArtifactEntry {
  /** Unique identifier (e.g., 'lebombo-bone') */
  readonly id: string;
  /** Display name (e.g., 'Lebombo Bone') */
  readonly name: string;
  /** Wikimedia Commons thumbnail URL for the artifact image */
  readonly imageUrl: string;
  /** Attribution text for the image */
  readonly attribution: string;
  /** Act number where this artifact appears (0-10) */
  readonly actNumber: number;
  /** Historical era string */
  readonly era: string;
  /** Short description of the artifact */
  readonly description: string;
  /** Emoji icon for the artifact */
  readonly icon: string;
  /** Rarity tier */
  readonly rarity: ArtifactRarity;
}

/**
 * A location pinned by the user on the world map.
 */
export interface PinnedLocation {
  /** Location ID from the registry */
  readonly locationId: string;
  /** Timestamp when the location was pinned (ms since epoch) */
  readonly timestamp: number;
}

/**
 * An artifact collected by the user.
 */
export interface CollectedArtifact {
  /** Artifact ID from the registry */
  readonly artifactId: string;
  /** Timestamp when the artifact was collected (ms since epoch) */
  readonly timestamp: number;
}

/**
 * User's complete collectible profile.
 * Persisted to localStorage.
 */
export interface CollectibleProfile {
  /** Locations pinned by the user */
  readonly pinnedLocations: readonly PinnedLocation[];
  /** Artifacts collected by the user */
  readonly collectedArtifacts: readonly CollectedArtifact[];
  /** Schema version for future migrations */
  readonly version: number;
}

/**
 * Default collectible profile for first-run and fallback.
 */
export const DEFAULT_COLLECTIBLE_PROFILE: CollectibleProfile = {
  pinnedLocations: [],
  collectedArtifacts: [],
  version: 1,
};

/**
 * Type guard for PinnedLocation.
 */
export function isValidPinnedLocation(value: unknown): value is PinnedLocation {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.locationId === 'string' &&
    (obj.locationId as string).length > 0 &&
    typeof obj.timestamp === 'number' &&
    obj.timestamp >= 0
  );
}

/**
 * Type guard for CollectedArtifact.
 */
export function isValidCollectedArtifact(value: unknown): value is CollectedArtifact {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.artifactId === 'string' &&
    (obj.artifactId as string).length > 0 &&
    typeof obj.timestamp === 'number' &&
    obj.timestamp >= 0
  );
}

/**
 * Type guard for CollectibleProfile.
 * Validates complete profile structure and all nested entries.
 */
export function isValidCollectibleProfile(value: unknown): value is CollectibleProfile {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    Array.isArray(obj.pinnedLocations) &&
    obj.pinnedLocations.every(isValidPinnedLocation) &&
    Array.isArray(obj.collectedArtifacts) &&
    obj.collectedArtifacts.every(isValidCollectedArtifact) &&
    typeof obj.version === 'number' &&
    Number.isInteger(obj.version) &&
    obj.version >= 1
  );
}

// Re-export ArtifactRarity validation for use in registry
export { VALID_ARTIFACT_RARITIES };
