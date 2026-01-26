// src/story/StoryState.ts
// State type definitions for the story progression engine
// Story 10.15: Create Story Progression Engine
// Story 10.18: Create Historical Personas System

import type { PersonaData } from './types';

/**
 * Represents the current position in the story.
 */
export interface StoryPosition {
  /** Act number (1-5) */
  actNumber: number;
  /** Chapter number within the act */
  chapterNumber: number;
  /** Current scene ID */
  sceneId: string;
}

/**
 * Represents a choice made by the user.
 */
export interface StoryChoice {
  /** Scene ID where the choice was made */
  sceneId: string;
  /** ID of the selected choice */
  choiceId: string;
  /** Unix timestamp when the choice was made */
  timestamp: number;
}

/**
 * Represents the user's progress through the story.
 */
export interface StoryProgress {
  /** Current position in the story */
  position: StoryPosition;
  /** Array of choices made by the user */
  choices: StoryChoice[];
  /** IDs of discovered concepts/items */
  discoveredItems: string[];
  /** Unix timestamp when the user first started */
  startedAt: number;
  /** Unix timestamp of last activity */
  lastPlayedAt: number;
  /** Current persona the user has adopted (Story 10.18) */
  currentPersona?: PersonaData | null;
}

/**
 * Represents the complete state of the story engine.
 */
export interface StoryEngineState {
  /** User's progress data */
  progress: StoryProgress | null;
  /** Whether content is currently loading */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
}

/**
 * Creates a default StoryProgress for a new user.
 * @param sceneId - The starting scene ID
 * @param persona - Optional initial persona (Story 10.18)
 */
export function createDefaultProgress(sceneId: string, persona?: PersonaData | null): StoryProgress {
  const now = Date.now();
  return {
    position: {
      actNumber: 1,
      chapterNumber: 1,
      sceneId,
    },
    choices: [],
    discoveredItems: [],
    startedAt: now,
    lastPlayedAt: now,
    currentPersona: persona ?? null,
  };
}

/**
 * Creates a default StoryEngineState.
 */
export function createDefaultEngineState(): StoryEngineState {
  return {
    progress: null,
    isLoading: false,
    error: null,
  };
}
