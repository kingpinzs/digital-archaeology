// src/story/types.ts
// Type definitions for Story Mode components
// Story 10.4: Create "Your Role" Panel
// Story 10.5: Create Chapter Header Component
// Story 10.6: Create Scene Setting Component

/**
 * Represents a discovery badge earned by the player.
 */
export interface DiscoveryBadge {
  /** Unique identifier for the discovery */
  id: string;
  /** Display name of the discovery */
  name: string;
  /** Emoji or icon class for the badge */
  icon: string;
  /** When the discovery was earned (optional) */
  earnedAt?: Date;
}

/**
 * Represents the player's role/character data in the story.
 */
export interface RoleData {
  /** Character name (e.g., "Junior Engineer") */
  name: string;
  /** Historical era (e.g., "1971") */
  era: string;
  /** Company/location (e.g., "Fairchild Semiconductor") */
  location: string;
  /** Current story progress (e.g., "Act 1 / Chapter 1") */
  progress: string;
  /** Experience level (e.g., "Novice", "Apprentice", "Journeyman") */
  experience: string;
  /** List of earned discoveries */
  discoveries: DiscoveryBadge[];
}

/**
 * Represents chapter information for the story header.
 */
export interface ChapterData {
  /** Act number (displayed as Roman numerals) */
  actNumber: number;
  /** Year for historical context (e.g., "1971") */
  year: string;
  /** Chapter title (e.g., "The Humbling Beginning") */
  title: string;
  /** Subtitle describing the chapter theme */
  subtitle: string;
}

/**
 * Data for a scene setting description.
 */
export interface SceneSettingData {
  /** The scene description text (atmospheric/setting details) */
  text: string;
}
