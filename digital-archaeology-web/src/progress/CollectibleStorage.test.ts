// src/progress/CollectibleStorage.test.ts
// Tests for CollectibleStorage localStorage persistence service
// Follows ActCompletionStorage.test.ts pattern exactly

import { describe, it, expect, beforeEach } from 'vitest';
import { CollectibleStorage } from './CollectibleStorage';
import type { CollectibleProfile } from './collectible-types';

const TEST_STORAGE_KEY = 'test-collectibles';

describe('CollectibleStorage', () => {
  let storage: CollectibleStorage;

  beforeEach(() => {
    localStorage.clear();
    storage = new CollectibleStorage(TEST_STORAGE_KEY);
  });

  describe('loadProfile', () => {
    it('returns null when no data exists', () => {
      expect(storage.loadProfile()).toBeNull();
    });

    it('returns null for invalid JSON', () => {
      localStorage.setItem(TEST_STORAGE_KEY, 'not-json');
      expect(storage.loadProfile()).toBeNull();
    });

    it('returns null and clears invalid profile data', () => {
      localStorage.setItem(TEST_STORAGE_KEY, JSON.stringify({ invalid: true }));
      expect(storage.loadProfile()).toBeNull();
      expect(localStorage.getItem(TEST_STORAGE_KEY)).toBeNull();
    });

    it('returns valid profile', () => {
      const profile: CollectibleProfile = {
        pinnedLocations: [{ locationId: 'lebombo', timestamp: 1700000000000 }],
        collectedArtifacts: [{ artifactId: 'lebombo-bone', timestamp: 1700000000000 }],
        version: 1,
      };
      localStorage.setItem(TEST_STORAGE_KEY, JSON.stringify(profile));
      expect(storage.loadProfile()).toEqual(profile);
    });
  });

  describe('saveProfile and loadProfile round-trip', () => {
    it('saves and loads a profile correctly', () => {
      const profile: CollectibleProfile = {
        pinnedLocations: [
          { locationId: 'lebombo', timestamp: 1700000000000 },
          { locationId: 'baghdad', timestamp: 1700000001000 },
        ],
        collectedArtifacts: [
          { artifactId: 'lebombo-bone', timestamp: 1700000000000 },
        ],
        version: 1,
      };
      storage.saveProfile(profile);
      expect(storage.loadProfile()).toEqual(profile);
    });
  });

  describe('getProfileOrDefault', () => {
    it('returns default when no profile exists', () => {
      const profile = storage.getProfileOrDefault();
      expect(profile.pinnedLocations).toEqual([]);
      expect(profile.collectedArtifacts).toEqual([]);
      expect(profile.version).toBe(1);
    });

    it('returns existing profile when one exists', () => {
      const profile: CollectibleProfile = {
        pinnedLocations: [{ locationId: 'pisa', timestamp: 1700000000000 }],
        collectedArtifacts: [],
        version: 1,
      };
      storage.saveProfile(profile);
      expect(storage.getProfileOrDefault()).toEqual(profile);
    });
  });

  describe('pinLocation', () => {
    it('pins a new location', () => {
      const result = storage.pinLocation('lebombo');
      expect(result.pinnedLocations).toHaveLength(1);
      expect(result.pinnedLocations[0].locationId).toBe('lebombo');
      expect(result.pinnedLocations[0].timestamp).toBeGreaterThan(0);
    });

    it('does not duplicate an already-pinned location', () => {
      storage.pinLocation('lebombo');
      const result = storage.pinLocation('lebombo');
      expect(result.pinnedLocations).toHaveLength(1);
    });

    it('pins multiple different locations', () => {
      storage.pinLocation('lebombo');
      const result = storage.pinLocation('baghdad');
      expect(result.pinnedLocations).toHaveLength(2);
    });

    it('persists to localStorage', () => {
      storage.pinLocation('lebombo');
      const fresh = new CollectibleStorage(TEST_STORAGE_KEY);
      expect(fresh.isLocationPinned('lebombo')).toBe(true);
    });
  });

  describe('unpinLocation', () => {
    it('unpins a pinned location', () => {
      storage.pinLocation('lebombo');
      const result = storage.unpinLocation('lebombo');
      expect(result.pinnedLocations).toHaveLength(0);
    });

    it('handles unpinning a non-existent location gracefully', () => {
      const result = storage.unpinLocation('non-existent');
      expect(result.pinnedLocations).toHaveLength(0);
    });
  });

  describe('isLocationPinned', () => {
    it('returns false when no profile exists', () => {
      expect(storage.isLocationPinned('lebombo')).toBe(false);
    });

    it('returns true for pinned location', () => {
      storage.pinLocation('lebombo');
      expect(storage.isLocationPinned('lebombo')).toBe(true);
    });

    it('returns false for unpinned location', () => {
      storage.pinLocation('lebombo');
      storage.unpinLocation('lebombo');
      expect(storage.isLocationPinned('lebombo')).toBe(false);
    });
  });

  describe('collectArtifact', () => {
    it('collects a new artifact', () => {
      const result = storage.collectArtifact('lebombo-bone');
      expect(result.collectedArtifacts).toHaveLength(1);
      expect(result.collectedArtifacts[0].artifactId).toBe('lebombo-bone');
    });

    it('does not duplicate an already-collected artifact', () => {
      storage.collectArtifact('lebombo-bone');
      const result = storage.collectArtifact('lebombo-bone');
      expect(result.collectedArtifacts).toHaveLength(1);
    });

    it('persists to localStorage', () => {
      storage.collectArtifact('eniac');
      const fresh = new CollectibleStorage(TEST_STORAGE_KEY);
      expect(fresh.isArtifactCollected('eniac')).toBe(true);
    });
  });

  describe('isArtifactCollected', () => {
    it('returns false when no profile exists', () => {
      expect(storage.isArtifactCollected('lebombo-bone')).toBe(false);
    });

    it('returns true for collected artifact', () => {
      storage.collectArtifact('lebombo-bone');
      expect(storage.isArtifactCollected('lebombo-bone')).toBe(true);
    });
  });

  describe('clearProfile', () => {
    it('removes profile from localStorage', () => {
      storage.pinLocation('lebombo');
      storage.collectArtifact('eniac');
      storage.clearProfile();
      expect(storage.loadProfile()).toBeNull();
    });
  });

  describe('localStorage error handling', () => {
    it('handles getItem errors gracefully', () => {
      const original = localStorage.getItem;
      localStorage.getItem = () => { throw new Error('Storage error'); };
      expect(storage.loadProfile()).toBeNull();
      localStorage.getItem = original;
    });

    it('handles setItem errors gracefully', () => {
      const original = localStorage.setItem;
      localStorage.setItem = () => { throw new Error('Storage full'); };
      // Should not throw
      storage.saveProfile({ pinnedLocations: [], collectedArtifacts: [], version: 1 });
      localStorage.setItem = original;
    });
  });
});
