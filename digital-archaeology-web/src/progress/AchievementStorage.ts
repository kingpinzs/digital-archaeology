// src/progress/AchievementStorage.ts
// localStorage persistence service for achievement profiles
// Story 19.3: Create Milestone Achievements

import type { Achievement, AchievementProfile, AchievementType } from './types';
import { DEFAULT_ACHIEVEMENT_PROFILE, isValidAchievementProfile } from './types';

/** Storage key for achievement profiles in localStorage */
export const ACHIEVEMENT_STORAGE_KEY = 'digital-archaeology-achievements';

/**
 * Service for persisting achievement profiles to localStorage.
 * Follows the DiscoveryStorage pattern with type guards and error handling.
 */
export class AchievementStorage {
  private storageKey: string;

  constructor(storageKey: string = ACHIEVEMENT_STORAGE_KEY) {
    this.storageKey = storageKey;
  }

  /**
   * Load achievement profile from localStorage.
   * Returns null if no valid profile is found.
   */
  loadProfile(): AchievementProfile | null {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return null;

      const parsed = JSON.parse(data);
      if (isValidAchievementProfile(parsed)) {
        return parsed;
      }
      // Invalid profile data — clear and return null
      console.warn('Invalid achievement profile in localStorage, clearing...');
      this.clearProfile();
      return null;
    } catch (error) {
      console.error('Failed to load achievement profile:', error);
      return null;
    }
  }

  /**
   * Save achievement profile to localStorage.
   * Silently fails if localStorage is unavailable.
   */
  saveProfile(profile: AchievementProfile): void {
    try {
      const serialized = JSON.stringify(profile);
      localStorage.setItem(this.storageKey, serialized);
    } catch (error) {
      console.error('Failed to save achievement profile:', error);
    }
  }

  /**
   * Get profile or defaults.
   * Convenience method that never returns null.
   */
  getProfileOrDefault(): AchievementProfile {
    return this.loadProfile() ?? { ...DEFAULT_ACHIEVEMENT_PROFILE };
  }

  /**
   * Add an achievement to the profile.
   * Loads existing profile, appends achievement, saves, and returns the updated profile.
   * Silently skips if achievement type already exists (duplicate protection).
   */
  addAchievement(achievement: Achievement): AchievementProfile {
    const current = this.getProfileOrDefault();
    if (current.completions.some(a => a.type === achievement.type)) {
      return current;
    }
    const updated: AchievementProfile = {
      ...current,
      completions: [...current.completions, achievement],
    };
    this.saveProfile(updated);
    return updated;
  }

  /**
   * Check if an achievement type has already been earned.
   */
  hasAchievement(type: AchievementType): boolean {
    const profile = this.loadProfile();
    if (!profile) return false;
    return profile.completions.some(a => a.type === type);
  }

  /**
   * Get earned achievement types sorted by timestamp.
   */
  getEarnedAchievementTypes(): AchievementType[] {
    const profile = this.loadProfile();
    if (!profile) return [];
    return [...profile.completions]
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(a => a.type);
  }

  /**
   * Clear achievement profile from localStorage.
   */
  clearProfile(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to clear achievement profile:', error);
    }
  }
}
