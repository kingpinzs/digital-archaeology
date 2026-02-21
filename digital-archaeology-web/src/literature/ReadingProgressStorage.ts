// src/literature/ReadingProgressStorage.ts
// localStorage persistence for article reading progress
// Story 20.4: Implement Reading Progress

/** Storage key for reading progress in localStorage */
export const READING_PROGRESS_KEY = 'digital-archaeology-reading-progress';

/** Serialized reading progress data */
export interface ReadingProgress {
  readonly readArticleIds: readonly string[];
  readonly lastReadAt?: string;
}

/** Type guard for safe deserialization */
export function isValidReadingProgress(value: unknown): value is ReadingProgress {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (!Array.isArray(obj.readArticleIds)) return false;
  if (!obj.readArticleIds.every((id: unknown) => typeof id === 'string')) return false;
  if (obj.lastReadAt !== undefined && typeof obj.lastReadAt !== 'string') return false;
  return true;
}

/**
 * Service for persisting article reading progress to localStorage.
 * Follows the DiscoveryStorage pattern with type guards and error handling.
 */
export class ReadingProgressStorage {
  private readonly storageKey: string;

  constructor(storageKey: string = READING_PROGRESS_KEY) {
    this.storageKey = storageKey;
  }

  /**
   * Load read article IDs from localStorage.
   * Returns an empty Set if no valid data is found.
   */
  load(): ReadonlySet<string> {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return new Set();

      const parsed = JSON.parse(data);
      if (isValidReadingProgress(parsed)) {
        return new Set(parsed.readArticleIds);
      }
      console.warn('Invalid reading progress in localStorage, clearing...');
      this.clearAll();
      return new Set();
    } catch (error) {
      console.error('Failed to load reading progress:', error);
      return new Set();
    }
  }

  /**
   * Mark an article as read and persist.
   * Returns the updated set of read article IDs.
   */
  markRead(articleId: string): ReadonlySet<string> {
    const current = this.load();
    if (current.has(articleId)) return current;

    const updated = new Set(current);
    updated.add(articleId);
    this.save(updated);
    return updated;
  }

  /**
   * Get the count of read articles.
   */
  getReadCount(): number {
    return this.load().size;
  }

  /**
   * Clear all reading progress.
   */
  clearAll(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to clear reading progress:', error);
    }
  }

  /**
   * Persist a set of read article IDs to localStorage.
   */
  private save(ids: ReadonlySet<string>): void {
    try {
      const progress: ReadingProgress = {
        readArticleIds: [...ids],
        lastReadAt: new Date().toISOString(),
      };
      localStorage.setItem(this.storageKey, JSON.stringify(progress));
    } catch (error) {
      console.error('Failed to save reading progress:', error);
    }
  }
}
