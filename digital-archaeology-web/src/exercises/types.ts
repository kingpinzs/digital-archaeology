// src/exercises/types.ts
// Type definitions for the Exercise/Homework module
// Story 21.1: Create Exercise Browser

import type { LabStage } from '@ui/StageSelector';

/** Exercise difficulty levels */
export type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'capstone';

/** Display labels for each difficulty */
export const DIFFICULTY_LABELS: Record<ExerciseDifficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  capstone: 'Capstone',
};

/** Ordered list for rendering difficulty filters */
export const DIFFICULTY_ORDER: readonly ExerciseDifficulty[] = [
  'beginner', 'intermediate', 'advanced', 'capstone',
] as const;

/** CSS color variable for each difficulty */
export const DIFFICULTY_COLOR_VARS: Record<ExerciseDifficulty, string> = {
  beginner: 'var(--da-exercise-beginner)',
  intermediate: 'var(--da-exercise-intermediate)',
  advanced: 'var(--da-exercise-advanced)',
  capstone: 'var(--da-exercise-capstone)',
};

/** Exercise concept categories */
export type ExerciseCategory =
  | 'arithmetic'
  | 'logic'
  | 'control-flow'
  | 'memory'
  | 'io'
  | 'data-structures'
  | 'string-handling'
  | 'hardware';

/** A single exercise entry with metadata */
export interface ExerciseMetadata {
  readonly id: string;
  readonly title: string;
  readonly stage: LabStage;
  readonly difficulty: ExerciseDifficulty;
  readonly description: string;
  readonly concepts: readonly string[];
  readonly estimatedMinutes: number;
  readonly prerequisites: readonly string[];
}

/** Data passed to the browser when opening */
export interface ExerciseBrowserData {
  readonly exercises: readonly ExerciseMetadata[];
  readonly completedIds?: ReadonlySet<string>;
  readonly currentStage?: LabStage;
}

/** Callbacks provided by the parent component */
export interface ExerciseBrowserCallbacks {
  readonly onExerciseSelect: (exercise: ExerciseMetadata) => void;
  readonly onClose: () => void;
}
