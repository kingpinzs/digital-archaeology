// src/exercises/ExerciseProgressStorage.ts
// Persistence for exercise completion state and attempt tracking
// Story 21.1: Create Exercise Browser
// Story 21.7: Track Exercise Completion (attempt tracking)

import { EXERCISE_IDS } from './exerciseMetadata';

/** Maximum number of stored attempts before oldest are evicted */
const MAX_ATTEMPTS = 500;

/** A single exercise attempt record */
export interface ExerciseAttempt {
  readonly exerciseId: string;
  readonly timestamp: number;
  readonly passed: boolean;
  readonly solutionViewed: boolean;
}

/** Persisted exercise progress structure */
interface ExerciseProgress {
  readonly completedIds: readonly string[];
  readonly attempts?: readonly ExerciseAttempt[];
}

/** Type guard for a single attempt record */
function isValidAttempt(item: unknown): item is ExerciseAttempt {
  if (typeof item !== 'object' || item === null) return false;
  const obj = item as Record<string, unknown>;
  return (
    typeof obj.exerciseId === 'string' &&
    typeof obj.timestamp === 'number' &&
    typeof obj.passed === 'boolean' &&
    typeof obj.solutionViewed === 'boolean'
  );
}

/** Type guard for valid progress data */
function isValidExerciseProgress(data: unknown): data is ExerciseProgress {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  if (!Array.isArray(obj.completedIds)) return false;
  if (!obj.completedIds.every(
    (id: unknown) => typeof id === 'string' && EXERCISE_IDS.has(id),
  )) return false;
  // Validate attempts if present
  if (obj.attempts !== undefined) {
    if (!Array.isArray(obj.attempts)) return false;
  }
  return true;
}

/**
 * Manages exercise completion state and attempt history in localStorage.
 * Follows the project storage pattern: type guard, try/catch, configurable key.
 */
export class ExerciseProgressStorage {
  private readonly storageKey: string;

  constructor(key: string = 'digital-archaeology-exercise-progress') {
    this.storageKey = key;
  }

  /** Load the full progress record (internal) */
  private loadProgress(): ExerciseProgress {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return { completedIds: [], attempts: [] };
      const parsed: unknown = JSON.parse(raw);
      if (!isValidExerciseProgress(parsed)) return { completedIds: [], attempts: [] };
      // Sanitize attempts: filter out any malformed entries
      const rawAttempts = (parsed as ExerciseProgress).attempts ?? [];
      const validAttempts = rawAttempts.filter(isValidAttempt);
      return {
        completedIds: (parsed as ExerciseProgress).completedIds,
        attempts: validAttempts,
      };
    } catch {
      return { completedIds: [], attempts: [] };
    }
  }

  /** Load completed exercise IDs as a Set */
  load(): ReadonlySet<string> {
    return new Set(this.loadProgress().completedIds);
  }

  /** Mark an exercise as completed */
  markCompleted(exerciseId: string): void {
    if (!EXERCISE_IDS.has(exerciseId)) return;
    try {
      const progress = this.loadProgress();
      if (progress.completedIds.includes(exerciseId)) return;
      const updated: ExerciseProgress = {
        ...progress,
        completedIds: [...progress.completedIds, exerciseId],
      };
      localStorage.setItem(this.storageKey, JSON.stringify(updated));
    } catch (e) {
      console.error('ExerciseProgressStorage: failed to save', e);
    }
  }

  /** Record an exercise attempt (Story 21.7) */
  recordAttempt(exerciseId: string, passed: boolean, solutionViewed: boolean = false): void {
    if (!EXERCISE_IDS.has(exerciseId)) return;
    try {
      const progress = this.loadProgress();
      const attempt: ExerciseAttempt = {
        exerciseId,
        timestamp: Date.now(),
        passed,
        solutionViewed,
      };
      let attempts = [...(progress.attempts ?? []), attempt];
      // Evict oldest attempts if over cap
      if (attempts.length > MAX_ATTEMPTS) {
        attempts = attempts.slice(attempts.length - MAX_ATTEMPTS);
      }
      const updated: ExerciseProgress = {
        ...progress,
        attempts,
      };
      localStorage.setItem(this.storageKey, JSON.stringify(updated));
    } catch (e) {
      console.error('ExerciseProgressStorage: failed to record attempt', e);
    }
  }

  /** Get all attempts for an exercise (Story 21.7) */
  getAttempts(exerciseId: string): readonly ExerciseAttempt[] {
    const progress = this.loadProgress();
    return (progress.attempts ?? []).filter(a => a.exerciseId === exerciseId);
  }

  /** Get attempt count for an exercise */
  getAttemptCount(exerciseId: string): number {
    return this.getAttempts(exerciseId).length;
  }

  /** Get the first successful attempt for an exercise, or undefined */
  getFirstSuccess(exerciseId: string): ExerciseAttempt | undefined {
    return this.getAttempts(exerciseId).find(a => a.passed);
  }

  /** Get count of completed exercises */
  getCompletedCount(): number {
    return this.load().size;
  }

  /** Get per-stage completion summary */
  getStageSummary(
    stageExerciseIds: readonly string[],
  ): { completed: number; total: number; attemptCount: number } {
    const progress = this.loadProgress();
    const completedSet = new Set(progress.completedIds);
    const allAttempts = progress.attempts ?? [];
    const stageSet = new Set(stageExerciseIds);
    return {
      completed: stageExerciseIds.filter(id => completedSet.has(id)).length,
      total: stageExerciseIds.length,
      attemptCount: allAttempts.filter(a => stageSet.has(a.exerciseId)).length,
    };
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
