// src/progress/DiscoveryStorage.test.ts
// Tests for DiscoveryStorage localStorage persistence
// Story 19.1: Track First-Time Discoveries

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DiscoveryStorage, DISCOVERY_STORAGE_KEY } from './DiscoveryStorage';
import { DEFAULT_DISCOVERY_PROFILE } from './types';
import type { Discovery, DiscoveryProfile } from './types';

/** Helper: create a valid discovery for testing */
function createValidDiscovery(overrides: Partial<Discovery> = {}): Discovery {
  return {
    type: 'first-assembly',
    timestamp: 1700000000000,
    stage: 'micro4',
    experimentationMode: false,
    ...overrides,
  };
}

describe('DiscoveryStorage', () => {
  const TEST_KEY = 'test-discovery-storage';
  let storage: DiscoveryStorage;

  beforeEach(() => {
    localStorage.clear();
    storage = new DiscoveryStorage(TEST_KEY);
  });

  describe('constructor', () => {
    it('uses default key when none provided', () => {
      const defaultStorage = new DiscoveryStorage();
      const discovery = createValidDiscovery();
      defaultStorage.addDiscovery(discovery);
      expect(localStorage.getItem(DISCOVERY_STORAGE_KEY)).not.toBeNull();
    });

    it('uses custom key when provided', () => {
      const discovery = createValidDiscovery();
      storage.addDiscovery(discovery);
      expect(localStorage.getItem(TEST_KEY)).not.toBeNull();
      expect(localStorage.getItem(DISCOVERY_STORAGE_KEY)).toBeNull();
    });
  });

  describe('loadProfile', () => {
    it('returns null when no data exists', () => {
      expect(storage.loadProfile()).toBeNull();
    });

    it('returns valid profile when data exists', () => {
      const profile: DiscoveryProfile = {
        discoveries: [createValidDiscovery()],
        version: 1,
      };
      localStorage.setItem(TEST_KEY, JSON.stringify(profile));
      expect(storage.loadProfile()).toEqual(profile);
    });

    it('returns null and clears on invalid data', () => {
      localStorage.setItem(TEST_KEY, JSON.stringify({ invalid: true }));
      expect(storage.loadProfile()).toBeNull();
      expect(localStorage.getItem(TEST_KEY)).toBeNull();
    });

    it('returns null on malformed JSON', () => {
      localStorage.setItem(TEST_KEY, 'not-json');
      expect(storage.loadProfile()).toBeNull();
    });
  });

  describe('saveProfile + loadProfile round-trip', () => {
    it('persists and retrieves a profile', () => {
      const profile: DiscoveryProfile = {
        discoveries: [
          createValidDiscovery({ type: 'first-assembly' }),
          createValidDiscovery({ type: 'first-subroutine', stage: 'micro8' }),
        ],
        version: 1,
      };
      storage.saveProfile(profile);
      expect(storage.loadProfile()).toEqual(profile);
    });
  });

  describe('getProfileOrDefault', () => {
    it('returns default when no data exists', () => {
      const result = storage.getProfileOrDefault();
      expect(result.discoveries).toEqual([]);
      expect(result.version).toBe(DEFAULT_DISCOVERY_PROFILE.version);
    });

    it('returns existing profile when data exists', () => {
      const profile: DiscoveryProfile = {
        discoveries: [createValidDiscovery()],
        version: 1,
      };
      storage.saveProfile(profile);
      expect(storage.getProfileOrDefault()).toEqual(profile);
    });
  });

  describe('addDiscovery', () => {
    it('adds discovery to empty profile', () => {
      const discovery = createValidDiscovery();
      const result = storage.addDiscovery(discovery);
      expect(result.discoveries).toHaveLength(1);
      expect(result.discoveries[0]).toEqual(discovery);
    });

    it('appends discovery to existing profile', () => {
      const first = createValidDiscovery({ type: 'first-assembly' });
      storage.addDiscovery(first);
      const second = createValidDiscovery({ type: 'first-subroutine', timestamp: 1700000001000 });
      const result = storage.addDiscovery(second);
      expect(result.discoveries).toHaveLength(2);
      expect(result.discoveries[0]).toEqual(first);
      expect(result.discoveries[1]).toEqual(second);
    });

    it('persists after adding', () => {
      const discovery = createValidDiscovery();
      storage.addDiscovery(discovery);
      // Reload from fresh instance
      const fresh = new DiscoveryStorage(TEST_KEY);
      const loaded = fresh.loadProfile();
      expect(loaded?.discoveries).toHaveLength(1);
      expect(loaded?.discoveries[0]).toEqual(discovery);
    });

    it('skips duplicate discovery type (duplicate protection)', () => {
      const first = createValidDiscovery({ type: 'first-assembly', timestamp: 1000 });
      storage.addDiscovery(first);
      const duplicate = createValidDiscovery({ type: 'first-assembly', timestamp: 2000 });
      const result = storage.addDiscovery(duplicate);
      expect(result.discoveries).toHaveLength(1);
      expect(result.discoveries[0].timestamp).toBe(1000);
    });
  });

  describe('hasDiscovery', () => {
    it('returns false when no profile exists', () => {
      expect(storage.hasDiscovery('first-assembly')).toBe(false);
    });

    it('returns false for unearned discovery type', () => {
      storage.addDiscovery(createValidDiscovery({ type: 'first-assembly' }));
      expect(storage.hasDiscovery('first-subroutine')).toBe(false);
    });

    it('returns true for earned discovery type', () => {
      storage.addDiscovery(createValidDiscovery({ type: 'first-assembly' }));
      expect(storage.hasDiscovery('first-assembly')).toBe(true);
    });
  });

  describe('clearProfile', () => {
    it('removes data from localStorage', () => {
      storage.addDiscovery(createValidDiscovery());
      storage.clearProfile();
      expect(storage.loadProfile()).toBeNull();
      expect(localStorage.getItem(TEST_KEY)).toBeNull();
    });
  });

  describe('localStorage error handling', () => {
    it('saveProfile handles localStorage error gracefully', () => {
      const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceeded');
      });
      // Should not throw
      expect(() => storage.saveProfile({ discoveries: [], version: 1 })).not.toThrow();
      spy.mockRestore();
    });

    it('loadProfile handles localStorage error gracefully', () => {
      const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });
      expect(storage.loadProfile()).toBeNull();
      spy.mockRestore();
    });
  });
});
