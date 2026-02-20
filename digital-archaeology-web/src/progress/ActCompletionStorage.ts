// src/progress/ActCompletionStorage.ts
// localStorage persistence service for act completion profiles
// Story 19.2: Track Act Completion

import type { ActCompletion, ActCompletionProfile, ActCompletionType } from './types';
import { DEFAULT_ACT_COMPLETION_PROFILE, isValidActCompletionProfile } from './types';

/** Storage key for act completion profiles in localStorage */
export const ACT_COMPLETION_STORAGE_KEY = 'digital-archaeology-act-completions';

/**
 * Service for persisting act completion profiles to localStorage.
 * Follows the DiscoveryStorage pattern with type guards and error handling.
 */
export class ActCompletionStorage {
  private storageKey: string;

  constructor(storageKey: string = ACT_COMPLETION_STORAGE_KEY) {
    this.storageKey = storageKey;
  }

  /**
   * Load act completion profile from localStorage.
   * Returns null if no valid profile is found.
   */
  loadProfile(): ActCompletionProfile | null {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return null;

      const parsed = JSON.parse(data);
      if (isValidActCompletionProfile(parsed)) {
        return parsed;
      }
      // Invalid profile data — clear and return null
      console.warn('Invalid act completion profile in localStorage, clearing...');
      this.clearProfile();
      return null;
    } catch (error) {
      console.error('Failed to load act completion profile:', error);
      return null;
    }
  }

  /**
   * Save act completion profile to localStorage.
   * Silently fails if localStorage is unavailable.
   */
  saveProfile(profile: ActCompletionProfile): void {
    try {
      const serialized = JSON.stringify(profile);
      localStorage.setItem(this.storageKey, serialized);
    } catch (error) {
      console.error('Failed to save act completion profile:', error);
    }
  }

  /**
   * Get profile or defaults.
   * Convenience method that never returns null.
   */
  getProfileOrDefault(): ActCompletionProfile {
    return this.loadProfile() ?? { ...DEFAULT_ACT_COMPLETION_PROFILE };
  }

  /**
   * Add a completion to the profile.
   * Loads existing profile, appends completion, saves, and returns the updated profile.
   * Silently skips if actId already exists (duplicate protection).
   */
  addCompletion(completion: ActCompletion): ActCompletionProfile {
    const current = this.getProfileOrDefault();
    if (current.completions.some(c => c.actId === completion.actId)) {
      return current;
    }
    const updated: ActCompletionProfile = {
      ...current,
      completions: [...current.completions, completion],
    };
    this.saveProfile(updated);
    return updated;
  }

  /**
   * Check if an act has already been completed.
   */
  hasCompletion(actId: ActCompletionType): boolean {
    const profile = this.loadProfile();
    if (!profile) return false;
    return profile.completions.some(c => c.actId === actId);
  }

  /**
   * Get sorted array of completed act numbers.
   * Useful for ProgressDisplay to determine which acts are completed.
   */
  getCompletedActNumbers(): number[] {
    const profile = this.loadProfile();
    if (!profile) return [];
    return profile.completions
      .map(c => c.actNumber)
      .sort((a, b) => a - b);
  }

  /**
   * Clear act completion profile from localStorage.
   */
  clearProfile(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to clear act completion profile:', error);
    }
  }
}
