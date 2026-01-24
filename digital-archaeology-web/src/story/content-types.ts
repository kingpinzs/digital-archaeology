// src/story/content-types.ts
// Type definitions for story content data structures
// Story 10.14: Implement Story Content Data Structure

import type {
  SceneSettingData,
  CharacterData,
  DialogueData,
  ChoiceData,
  TechnicalNoteData,
  ChallengeData,
} from './types';

/**
 * Metadata about the story content.
 */
export interface StoryMetadata {
  /** Title of the story (e.g., "Digital Archaeology") */
  title: string;
  /** Author or team name */
  author: string;
  /** ISO date string of last update */
  lastUpdated: string;
}

/** Valid scene types determining which content is primary */
export type SceneType = 'narrative' | 'dialogue' | 'choice' | 'challenge';

/**
 * Represents a scene within a chapter.
 * Scenes are the atomic units of story content.
 */
export interface StoryScene {
  /** Unique identifier (e.g., "scene-1-1-1") */
  id: string;
  /** Scene type determines which content is primary */
  type: SceneType;
  /** Optional scene setting description */
  setting?: SceneSettingData;
  /** Narrative paragraphs for story text */
  narrative?: string[];
  /** Characters appearing in this scene */
  characters?: CharacterData[];
  /** Dialogue blocks for character speech */
  dialogues?: DialogueData[];
  /** Player choice options */
  choices?: ChoiceData[];
  /** Technical explanations bridging narrative and concepts */
  technicalNotes?: TechnicalNoteData[];
  /** Challenge objectives for Lab Mode */
  challenge?: ChallengeData;
  /** ID of the next scene (for linear progression) */
  nextScene?: string;
}

/**
 * Represents a chapter within an act.
 * Chapters group related scenes together.
 */
export interface StoryChapter {
  /** Unique identifier (e.g., "chapter-1-1") */
  id: string;
  /** Chapter number within the act */
  number: number;
  /** Chapter title (e.g., "First Day") */
  title: string;
  /** Chapter subtitle (e.g., "Junior Engineer at Fairchild") */
  subtitle: string;
  /** Year for historical context (e.g., "1971") */
  year: string;
  /** Scenes within this chapter */
  scenes: StoryScene[];
}

/** Valid CPU stages corresponding to the 6-stage CPU evolution */
export type CpuStage = 'micro4' | 'micro8' | 'micro16' | 'micro32' | 'micro32p' | 'micro32s';

/**
 * Represents an act in the story.
 * Acts are major story divisions corresponding to CPU stages.
 */
export interface StoryAct {
  /** Unique identifier (e.g., "act-1") */
  id: string;
  /** Act number (1-5) */
  number: number;
  /** Act title (e.g., "The Humbling Beginning") */
  title: string;
  /** Act description/summary */
  description: string;
  /** Historical era (e.g., "1971") */
  era: string;
  /** CPU stage for this act */
  cpuStage: CpuStage;
  /** Chapters within this act */
  chapters: StoryChapter[];
}

/**
 * Root container for all story content.
 * Loaded from JSON files in public/story/.
 */
export interface StoryContent {
  /** Schema version for compatibility checking */
  version: string;
  /** Story metadata */
  metadata: StoryMetadata;
  /** All acts in the story */
  acts: StoryAct[];
}

/**
 * Result of content validation.
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Error messages if validation failed */
  errors: string[];
}

/**
 * Error thrown when story content loading fails.
 */
export class StoryLoadError extends Error {
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'StoryLoadError';
    this.cause = cause;
  }
}

/**
 * Error thrown when story content validation fails.
 */
export class StoryValidationError extends Error {
  readonly errors: string[];

  constructor(message: string, errors: string[]) {
    super(message);
    this.name = 'StoryValidationError';
    this.errors = errors;
  }
}
