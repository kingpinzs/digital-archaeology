// src/story/types.ts
// Type definitions for Story Mode components
// Story 10.4: Create "Your Role" Panel
// Story 10.5: Create Chapter Header Component
// Story 10.6: Create Scene Setting Component
// Story 10.7: Create Character Card Component
// Story 10.8: Create Dialogue Block Component
// Story 10.9: Create Choice Card Component
// Story 10.10: Create Technical Note Component
// Story 10.13: Create Challenge Objectives in Lab Mode

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

/**
 * A key-value stat displayed on a character card.
 */
export interface CharacterStat {
  /** The stat label (e.g., "Expertise", "Years at Fairchild") */
  label: string;
  /** The stat value (e.g., "Digital Logic, ALU Design", "6") */
  value: string;
}

/**
 * Represents a character/NPC in the story.
 */
export interface CharacterData {
  /** Avatar display - emoji string for MVP (e.g., "👩‍🔬") */
  avatar: string;
  /** Character's full name (e.g., "Dr. Sarah Chen") */
  name: string;
  /** Character's title/role (e.g., "Senior Design Engineer") */
  title: string;
  /** Character's background/bio (2-3 sentences) */
  bio: string;
  /** Key stats displayed at bottom of card */
  stats: CharacterStat[];
}

/**
 * Represents a line of dialogue from a character.
 */
export interface DialogueData {
  /** The name of the speaker (e.g., "Dr. Chen") */
  speaker: string;
  /** The dialogue text spoken by the character */
  text: string;
}

/**
 * Represents a choice option in the story.
 */
export interface ChoiceData {
  /** Unique identifier for this choice */
  id: string;
  /** Emoji or icon character for the choice */
  icon: string;
  /** Short title for the choice (e.g., "Investigate Carry Look-Ahead") */
  title: string;
  /** Longer description explaining the choice */
  description: string;
}

/**
 * Represents a technical note that bridges narrative and technical content.
 * Displayed with blue accent styling matching Lab Mode.
 */
export interface TechnicalNoteData {
  /** The explanatory text content */
  content: string;
  /** Optional inline code snippet to display in monospace font */
  codeSnippet?: string;
}

/**
 * Represents a single objective in a challenge.
 */
export interface ChallengeObjective {
  /** Unique identifier for this objective */
  id: string;
  /** Description of the objective */
  text: string;
  /** Whether the objective is completed */
  completed: boolean;
}

/**
 * Represents challenge data displayed in Lab Mode.
 * Shows story-driven objectives with completion tracking.
 */
export interface ChallengeData {
  /** Challenge title (e.g., "CARRY LOOK-AHEAD") */
  title: string;
  /** List of objectives to complete */
  objectives: ChallengeObjective[];
}
