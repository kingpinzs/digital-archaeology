// src/story/StoryStorage.ts
// localStorage persistence service for story progress
// Story 10.15: Create Story Progression Engine

import type { StoryProgress, StoryPosition, StoryChoice } from './StoryState';

/** Storage key for story progress in localStorage */
export const STORY_STORAGE_KEY = 'digital-archaeology-story-progress';

/**
 * Type guard to check if a value is a valid StoryPosition.
 */
function isStoryPosition(value: unknown): value is StoryPosition {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;

  return (
    typeof obj.actNumber === 'number' &&
    typeof obj.chapterNumber === 'number' &&
    typeof obj.sceneId === 'string'
  );
}

/**
 * Type guard to check if a value is a valid StoryChoice.
 */
function isStoryChoice(value: unknown): value is StoryChoice {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;

  return (
    typeof obj.sceneId === 'string' &&
    typeof obj.choiceId === 'string' &&
    typeof obj.timestamp === 'number'
  );
}

/**
 * Type guard to check if a value is a valid StoryProgress.
 */
function isStoryProgress(value: unknown): value is StoryProgress {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;

  if (!isStoryPosition(obj.position)) return false;
  if (!Array.isArray(obj.choices)) return false;
  if (!obj.choices.every(isStoryChoice)) return false;
  if (!Array.isArray(obj.discoveredItems)) return false;
  if (!obj.discoveredItems.every((item) => typeof item === 'string')) return false;
  if (typeof obj.startedAt !== 'number') return false;
  if (typeof obj.lastPlayedAt !== 'number') return false;

  return true;
}

/**
 * Service for persisting story progress to localStorage.
 */
export class StoryStorage {
  private storageKey: string;

  constructor(storageKey: string = STORY_STORAGE_KEY) {
    this.storageKey = storageKey;
  }

  /**
   * Save progress to localStorage.
   */
  saveProgress(progress: StoryProgress): void {
    try {
      const serialized = JSON.stringify(progress);
      localStorage.setItem(this.storageKey, serialized);
    } catch (error) {
      // Handle localStorage errors (quota exceeded, private browsing, etc.)
      console.error('Failed to save story progress:', error);
    }
  }

  /**
   * Load progress from localStorage.
   * Returns null if no valid progress is found.
   */
  loadProgress(): StoryProgress | null {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) {
        return null;
      }

      const parsed = JSON.parse(data);

      // Validate the loaded data
      if (!isStoryProgress(parsed)) {
        console.warn('Invalid story progress data in localStorage, clearing...');
        this.clearProgress();
        return null;
      }

      return parsed;
    } catch (error) {
      // Handle JSON parse errors
      console.error('Failed to load story progress:', error);
      return null;
    }
  }

  /**
   * Clear progress from localStorage.
   */
  clearProgress(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to clear story progress:', error);
    }
  }

  /**
   * Check if progress exists in localStorage.
   */
  hasProgress(): boolean {
    try {
      return localStorage.getItem(this.storageKey) !== null;
    } catch {
      return false;
    }
  }
}
