// src/simulators/ChallengeProgressStorage.ts
// localStorage persistence for challenge objective completion
// Story 26.3: Cumulative Lab State Persistence

/** Storage key for challenge progress in localStorage */
export const CHALLENGE_PROGRESS_KEY = 'digital-archaeology-challenge-progress';

/** Stored progress: map of sceneId → array of completed objective IDs */
export interface ChallengeProgressData {
  [sceneId: string]: string[];
}

/**
 * Service for persisting completed challenge objectives per scene.
 * Uses localStorage for lightweight key-value storage.
 * Follows the StoryStorage.ts pattern.
 */
export class ChallengeProgressStorage {
  private storageKey: string;

  constructor(storageKey: string = CHALLENGE_PROGRESS_KEY) {
    this.storageKey = storageKey;
  }

  /**
   * Get completed objective IDs for a scene.
   * Returns empty array if no progress saved.
   */
  getCompleted(sceneId: string): string[] {
    const data = this.loadAll();
    return data[sceneId] ?? [];
  }

  /**
   * Mark an objective as completed for a scene.
   * Idempotent — won't add duplicates.
   */
  markCompleted(sceneId: string, objectiveId: string): void {
    const data = this.loadAll();
    if (!data[sceneId]) {
      data[sceneId] = [];
    }
    if (!data[sceneId].includes(objectiveId)) {
      data[sceneId].push(objectiveId);
    }
    this.saveAll(data);
  }

  /**
   * Clear all progress for a specific scene.
   */
  clearScene(sceneId: string): void {
    const data = this.loadAll();
    delete data[sceneId];
    this.saveAll(data);
  }

  /**
   * Clear all challenge progress.
   */
  clearAll(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      // localStorage not available
    }
  }

  /**
   * Check if a scene has any saved progress.
   */
  hasProgress(sceneId: string): boolean {
    const completed = this.getCompleted(sceneId);
    return completed.length > 0;
  }

  private loadAll(): ChallengeProgressData {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
      return parsed as ChallengeProgressData;
    } catch {
      return {};
    }
  }

  private saveAll(data: ChallengeProgressData): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch {
      // localStorage not available or quota exceeded
    }
  }
}
