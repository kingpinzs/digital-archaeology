// src/progress/DiscoveryStorage.ts
// localStorage persistence service for discovery profiles
// Story 19.1: Track First-Time Discoveries

import type { Discovery, DiscoveryProfile, DiscoveryType } from './types';
import { DEFAULT_DISCOVERY_PROFILE, isValidDiscoveryProfile } from './types';

/** Storage key for discovery profiles in localStorage */
export const DISCOVERY_STORAGE_KEY = 'digital-archaeology-discoveries';

/**
 * Service for persisting discovery profiles to localStorage.
 * Follows the SettingsStorage.ts pattern with type guards and error handling.
 */
export class DiscoveryStorage {
  private storageKey: string;

  constructor(storageKey: string = DISCOVERY_STORAGE_KEY) {
    this.storageKey = storageKey;
  }

  /**
   * Load discovery profile from localStorage.
   * Returns null if no valid profile is found.
   */
  loadProfile(): DiscoveryProfile | null {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return null;

      const parsed = JSON.parse(data);
      if (isValidDiscoveryProfile(parsed)) {
        return parsed;
      }
      // Invalid profile data — clear and return null
      console.warn('Invalid discovery profile in localStorage, clearing...');
      this.clearProfile();
      return null;
    } catch (error) {
      console.error('Failed to load discovery profile:', error);
      return null;
    }
  }

  /**
   * Save discovery profile to localStorage.
   * Silently fails if localStorage is unavailable.
   */
  saveProfile(profile: DiscoveryProfile): void {
    try {
      const serialized = JSON.stringify(profile);
      localStorage.setItem(this.storageKey, serialized);
    } catch (error) {
      console.error('Failed to save discovery profile:', error);
    }
  }

  /**
   * Get profile or defaults.
   * Convenience method that never returns null.
   */
  getProfileOrDefault(): DiscoveryProfile {
    return this.loadProfile() ?? { ...DEFAULT_DISCOVERY_PROFILE };
  }

  /**
   * Add a discovery to the profile.
   * Loads existing profile, appends discovery, saves, and returns the updated profile.
   * Silently skips if discovery type already exists (duplicate protection).
   */
  addDiscovery(discovery: Discovery): DiscoveryProfile {
    const current = this.getProfileOrDefault();
    if (current.discoveries.some(d => d.type === discovery.type)) {
      return current;
    }
    const updated: DiscoveryProfile = {
      ...current,
      discoveries: [...current.discoveries, discovery],
    };
    this.saveProfile(updated);
    return updated;
  }

  /**
   * Check if a discovery type has already been earned.
   */
  hasDiscovery(type: DiscoveryType): boolean {
    const profile = this.loadProfile();
    if (!profile) return false;
    return profile.discoveries.some(d => d.type === type);
  }

  /**
   * Clear discovery profile from localStorage.
   */
  clearProfile(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to clear discovery profile:', error);
    }
  }
}
