// src/exercises/index.ts
// Barrel exports for the Exercise/Homework module
// Story 21.1: Create Exercise Browser

export { ExerciseBrowser } from './ExerciseBrowser';
export { ExerciseDetailPanel } from './ExerciseDetailPanel';
export { ExerciseProgressStorage } from './ExerciseProgressStorage';
export { ExerciseValidator } from './ExerciseValidator';
export { ExerciseResultsPanel } from './ExerciseResultsPanel';
export type { ExerciseResultsPanelCallbacks } from './ExerciseResultsPanel';
export { ExerciseHintsPanel, ExerciseHintStorage } from './ExerciseHintsPanel';
export {
  EXERCISES,
  EXERCISE_IDS,
  STAGES_WITH_EXERCISES,
  STAGE_EXERCISE_LABELS,
  getExercisesByStage,
  getExerciseCountByStage,
  findExerciseById,
  getExercisesByDifficulty,
} from './exerciseMetadata';
export type {
  ExerciseDifficulty,
  ExerciseCategory,
  ExerciseMetadata,
  ExerciseTestCase,
  ExerciseTestResult,
  ExerciseValidationResult,
  ExerciseBrowserData,
  ExerciseBrowserCallbacks,
} from './types';
export { DIFFICULTY_LABELS, DIFFICULTY_ORDER, DIFFICULTY_COLOR_VARS } from './types';
