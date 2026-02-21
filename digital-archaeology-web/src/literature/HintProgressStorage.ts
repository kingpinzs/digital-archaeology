// src/literature/HintProgressStorage.ts
// localStorage persistence for hint reveal progress
// Story 20.5: Create Progressive Hint System

/** Storage key for hint progress in localStorage */
export const HINT_PROGRESS_KEY = 'digital-archaeology-hint-progress';

/** Serialized hint progress data */
export interface HintProgress {
  /** Maps article ID to number of hints revealed */
  readonly revealedHints: Readonly<Record<string, number>>;
}

/** Type guard for safe deserialization */
export function isValidHintProgress(value: unknown): value is HintProgress {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (typeof obj.revealedHints !== 'object' || obj.revealedHints === null) return false;
  if (Array.isArray(obj.revealedHints)) return false;
  const hints = obj.revealedHints as Record<string, unknown>;
  for (const key of Object.keys(hints)) {
    if (typeof hints[key] !== 'number') return false;
  }
  return true;
}

/**
 * Service for persisting hint reveal progress to localStorage.
 * Follows the ReadingProgressStorage/DiscoveryStorage pattern.
 */
export class HintProgressStorage {
  private readonly storageKey: string;

  constructor(storageKey: string = HINT_PROGRESS_KEY) {
    this.storageKey = storageKey;
  }

  /**
   * Load the full hint progress from localStorage.
   * Returns an empty record if no valid data is found.
   */
  load(): Readonly<Record<string, number>> {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return {};

      const parsed = JSON.parse(data);
      if (isValidHintProgress(parsed)) {
        return parsed.revealedHints;
      }
      console.warn('Invalid hint progress in localStorage, clearing...');
      this.clearAll();
      return {};
    } catch (error) {
      console.error('Failed to load hint progress:', error);
      return {};
    }
  }

  /**
   * Get the number of hints revealed for a specific article.
   */
  getRevealedCount(articleId: string): number {
    const progress = this.load();
    return progress[articleId] ?? 0;
  }

  /**
   * Reveal the next hint for an article. Returns the new revealed count.
   * Will not exceed maxHints.
   */
  revealNext(articleId: string, maxHints: number): number {
    const progress = this.load();
    const current = progress[articleId] ?? 0;
    if (current >= maxHints) return current;

    const updated = { ...progress, [articleId]: current + 1 };
    this.save(updated);
    return current + 1;
  }

  /**
   * Clear all hint progress.
   */
  clearAll(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to clear hint progress:', error);
    }
  }

  /**
   * Persist hint progress to localStorage.
   */
  private save(revealedHints: Readonly<Record<string, number>>): void {
    try {
      const progress: HintProgress = { revealedHints };
      localStorage.setItem(this.storageKey, JSON.stringify(progress));
    } catch (error) {
      console.error('Failed to save hint progress:', error);
    }
  }
}
