// src/exercises/ExerciseProgressStorage.ts
// Persistence for exercise completion state
// Story 21.1: Create Exercise Browser

import { EXERCISE_IDS } from './exerciseMetadata';

/** Persisted exercise progress structure */
interface ExerciseProgress {
  readonly completedIds: readonly string[];
}

/** Type guard for valid progress data */
function isValidExerciseProgress(data: unknown): data is ExerciseProgress {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  if (!Array.isArray(obj.completedIds)) return false;
  return obj.completedIds.every(
    (id: unknown) => typeof id === 'string' && EXERCISE_IDS.has(id),
  );
}

/**
 * Manages exercise completion state in localStorage.
 * Follows the project storage pattern: type guard, try/catch, configurable key.
 */
export class ExerciseProgressStorage {
  private readonly storageKey: string;

  constructor(key: string = 'digital-archaeology-exercise-progress') {
    this.storageKey = key;
  }

  /** Load completed exercise IDs as a Set */
  load(): ReadonlySet<string> {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return new Set();
      const parsed: unknown = JSON.parse(raw);
      if (!isValidExerciseProgress(parsed)) return new Set();
      return new Set(parsed.completedIds);
    } catch {
      return new Set();
    }
  }

  /** Mark an exercise as completed */
  markCompleted(exerciseId: string): void {
    if (!EXERCISE_IDS.has(exerciseId)) return;
    try {
      const current = this.load();
      if (current.has(exerciseId)) return;
      const updated: ExerciseProgress = {
        completedIds: [...current, exerciseId],
      };
      localStorage.setItem(this.storageKey, JSON.stringify(updated));
    } catch (e) {
      console.error('ExerciseProgressStorage: failed to save', e);
    }
  }

  /** Get count of completed exercises */
  getCompletedCount(): number {
    return this.load().size;
  }

  /** Clear all progress */
  clearAll(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (e) {
      console.error('ExerciseProgressStorage: failed to clear', e);
    }
  }
}
