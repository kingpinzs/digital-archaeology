// src/progress/CollectibleStorage.ts
// localStorage persistence service for collectible profiles
// Follows the ActCompletionStorage pattern for pinned locations and collected artifacts

import type { CollectibleProfile, PinnedLocation, CollectedArtifact } from './collectible-types';
import { DEFAULT_COLLECTIBLE_PROFILE, isValidCollectibleProfile } from './collectible-types';

/** Storage key for collectible profiles in localStorage */
export const COLLECTIBLE_STORAGE_KEY = 'digital-archaeology-collectibles';

/**
 * Service for persisting collectible profiles (pinned locations, collected artifacts)
 * to localStorage. Follows the ActCompletionStorage pattern with type guards and error handling.
 */
export class CollectibleStorage {
  private storageKey: string;

  constructor(storageKey: string = COLLECTIBLE_STORAGE_KEY) {
    this.storageKey = storageKey;
  }

  /**
   * Load collectible profile from localStorage.
   * Returns null if no valid profile is found.
   */
  loadProfile(): CollectibleProfile | null {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return null;

      const parsed = JSON.parse(data);
      if (isValidCollectibleProfile(parsed)) {
        return parsed;
      }
      // Invalid profile data — clear and return null
      console.warn('Invalid collectible profile in localStorage, clearing...');
      this.clearProfile();
      return null;
    } catch (error) {
      console.error('Failed to load collectible profile:', error);
      return null;
    }
  }

  /**
   * Save collectible profile to localStorage.
   * Silently fails if localStorage is unavailable.
   */
  saveProfile(profile: CollectibleProfile): void {
    try {
      const serialized = JSON.stringify(profile);
      localStorage.setItem(this.storageKey, serialized);
    } catch (error) {
      console.error('Failed to save collectible profile:', error);
    }
  }

  /**
   * Get profile or defaults.
   * Convenience method that never returns null.
   */
  getProfileOrDefault(): CollectibleProfile {
    return this.loadProfile() ?? { ...DEFAULT_COLLECTIBLE_PROFILE };
  }

  /**
   * Pin a location on the world map.
   * Silently skips if location is already pinned (duplicate protection).
   */
  pinLocation(locationId: string): CollectibleProfile {
    const current = this.getProfileOrDefault();
    if (current.pinnedLocations.some(p => p.locationId === locationId)) {
      return current;
    }
    const pin: PinnedLocation = {
      locationId,
      timestamp: Date.now(),
    };
    const updated: CollectibleProfile = {
      ...current,
      pinnedLocations: [...current.pinnedLocations, pin],
    };
    this.saveProfile(updated);
    return updated;
  }

  /**
   * Unpin a location from the world map.
   */
  unpinLocation(locationId: string): CollectibleProfile {
    const current = this.getProfileOrDefault();
    const updated: CollectibleProfile = {
      ...current,
      pinnedLocations: current.pinnedLocations.filter(p => p.locationId !== locationId),
    };
    this.saveProfile(updated);
    return updated;
  }

  /**
   * Check if a location is currently pinned.
   */
  isLocationPinned(locationId: string): boolean {
    const profile = this.loadProfile();
    if (!profile) return false;
    return profile.pinnedLocations.some(p => p.locationId === locationId);
  }

  /**
   * Collect an artifact.
   * Silently skips if artifact is already collected (duplicate protection).
   */
  collectArtifact(artifactId: string): CollectibleProfile {
    const current = this.getProfileOrDefault();
    if (current.collectedArtifacts.some(a => a.artifactId === artifactId)) {
      return current;
    }
    const artifact: CollectedArtifact = {
      artifactId,
      timestamp: Date.now(),
    };
    const updated: CollectibleProfile = {
      ...current,
      collectedArtifacts: [...current.collectedArtifacts, artifact],
    };
    this.saveProfile(updated);
    return updated;
  }

  /**
   * Check if an artifact has been collected.
   */
  isArtifactCollected(artifactId: string): boolean {
    const profile = this.loadProfile();
    if (!profile) return false;
    return profile.collectedArtifacts.some(a => a.artifactId === artifactId);
  }

  /**
   * Clear collectible profile from localStorage.
   */
  clearProfile(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to clear collectible profile:', error);
    }
  }
}
