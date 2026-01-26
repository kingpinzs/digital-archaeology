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
  PersonaData,
  TransitionData,
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
export type SceneType = 'narrative' | 'dialogue' | 'choice' | 'challenge' | 'persona' | 'transition';

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
  /** Persona data for persona introduction scenes (Story 10.18) */
  persona?: PersonaData;
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

/**
 * Valid CPU stages corresponding to the 11-act computing evolution.
 * Pre-microprocessor era (Acts 0-3):
 *   - mechanical: Act 0 - Abacus through Babbage (3000 BC - 1840s)
 *   - relay: Act 1 - Electromechanical era (1890s - 1945)
 *   - vacuum: Act 2 - Vacuum tube computers (1945 - 1955)
 *   - transistor: Act 3 - Semiconductor revolution (1955 - 1970)
 * Microprocessor era (Acts 4-9):
 *   - micro4: Act 4 - First microprocessor (1971)
 *   - micro8: Act 5 - 8-bit era (1974-1978)
 *   - micro16: Act 6 - 16-bit era (1978-1985)
 *   - micro32: Act 7 - 32-bit era (1985-1995)
 *   - micro32p: Act 8 - Pipelined (1989-1995)
 *   - micro32s: Act 9 - Superscalar (1995+)
 * Future computing era (Act 10):
 *   - future: Act 10 - Chiplets, Quantum, Neuromorphic, TPUs, RISC-V (2015+)
 */
export type CpuStage =
  | 'mechanical'
  | 'relay'
  | 'vacuum'
  | 'transistor'
  | 'micro4'
  | 'micro8'
  | 'micro16'
  | 'micro32'
  | 'micro32p'
  | 'micro32s'
  | 'future';

/**
 * Represents an act in the story.
 * Acts are major story divisions corresponding to computing eras.
 * The story spans 10 acts from 3000 BC (abacus) to modern superscalar CPUs.
 */
export interface StoryAct {
  /** Unique identifier (e.g., "act-0", "act-4") */
  id: string;
  /** Act number (0-9) */
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
  /** Historical persona the user adopts for this act (Story 10.18) */
  persona?: PersonaData;
  /** Transition narrative from previous era to this one (Story 10.20) */
  transition?: TransitionData;
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
