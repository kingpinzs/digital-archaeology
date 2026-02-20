// src/progress/ActCompletionStorage.test.ts
// Tests for ActCompletionStorage localStorage persistence service
// Story 19.2: Track Act Completion

import { describe, it, expect, beforeEach } from 'vitest';
import { ActCompletionStorage } from './ActCompletionStorage';
import type { ActCompletion, ActCompletionProfile } from './types';

const TEST_STORAGE_KEY = 'test-act-completions';

/** Helper: create a valid act completion for testing */
function createValidCompletion(overrides: Partial<ActCompletion> = {}): ActCompletion {
  return {
    actNumber: 0,
    actId: 'act-0',
    timestamp: 1700000000000,
    actTitle: 'Pre-history',
    era: '3000 BC - 1840s',
    ...overrides,
  };
}

describe('ActCompletionStorage', () => {
  let storage: ActCompletionStorage;

  beforeEach(() => {
    localStorage.clear();
    storage = new ActCompletionStorage(TEST_STORAGE_KEY);
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
      const profile: ActCompletionProfile = {
        completions: [createValidCompletion()],
        version: 1,
      };
      localStorage.setItem(TEST_STORAGE_KEY, JSON.stringify(profile));
      expect(storage.loadProfile()).toEqual(profile);
    });
  });

  describe('saveProfile and loadProfile round-trip', () => {
    it('saves and loads a profile correctly', () => {
      const profile: ActCompletionProfile = {
        completions: [
          createValidCompletion({ actNumber: 0, actId: 'act-0' }),
          createValidCompletion({ actNumber: 1, actId: 'act-1', actTitle: 'Electromechanical', era: '1890s - 1945' }),
        ],
        version: 1,
      };
      storage.saveProfile(profile);
      expect(storage.loadProfile()).toEqual(profile);
    });
  });

  describe('getProfileOrDefault', () => {
    it('returns default profile when no data exists', () => {
      const profile = storage.getProfileOrDefault();
      expect(profile.completions).toEqual([]);
      expect(profile.version).toBe(1);
    });

    it('returns stored profile when data exists', () => {
      const stored: ActCompletionProfile = {
        completions: [createValidCompletion()],
        version: 1,
      };
      storage.saveProfile(stored);
      expect(storage.getProfileOrDefault()).toEqual(stored);
    });
  });

  describe('addCompletion', () => {
    it('adds a completion to an empty profile', () => {
      const completion = createValidCompletion();
      const result = storage.addCompletion(completion);
      expect(result.completions).toHaveLength(1);
      expect(result.completions[0]).toEqual(completion);
    });

    it('appends to existing profile', () => {
      const first = createValidCompletion({ actNumber: 0, actId: 'act-0' });
      storage.addCompletion(first);

      const second = createValidCompletion({ actNumber: 1, actId: 'act-1', actTitle: 'Electromechanical', era: '1890s - 1945' });
      const result = storage.addCompletion(second);

      expect(result.completions).toHaveLength(2);
      expect(result.completions[0]).toEqual(first);
      expect(result.completions[1]).toEqual(second);
    });

    it('skips duplicate actId silently (duplicate protection)', () => {
      const completion = createValidCompletion();
      storage.addCompletion(completion);

      const duplicate = createValidCompletion({ timestamp: 9999999999999 });
      const result = storage.addCompletion(duplicate);

      expect(result.completions).toHaveLength(1);
      expect(result.completions[0].timestamp).toBe(1700000000000); // Original preserved
    });

    it('persists to localStorage', () => {
      const completion = createValidCompletion();
      storage.addCompletion(completion);

      // Create a new storage instance to verify persistence
      const freshStorage = new ActCompletionStorage(TEST_STORAGE_KEY);
      const loaded = freshStorage.loadProfile();
      expect(loaded).not.toBeNull();
      expect(loaded!.completions).toHaveLength(1);
    });
  });

  describe('hasCompletion', () => {
    it('returns false when no profile exists', () => {
      expect(storage.hasCompletion('act-0')).toBe(false);
    });

    it('returns true for existing completion', () => {
      storage.addCompletion(createValidCompletion({ actId: 'act-0' }));
      expect(storage.hasCompletion('act-0')).toBe(true);
    });

    it('returns false for missing completion', () => {
      storage.addCompletion(createValidCompletion({ actId: 'act-0' }));
      expect(storage.hasCompletion('act-1')).toBe(false);
    });
  });

  describe('getCompletedActNumbers', () => {
    it('returns empty array when no profile exists', () => {
      expect(storage.getCompletedActNumbers()).toEqual([]);
    });

    it('returns sorted array of completed act numbers', () => {
      storage.addCompletion(createValidCompletion({ actNumber: 3, actId: 'act-3' }));
      storage.addCompletion(createValidCompletion({ actNumber: 1, actId: 'act-1' }));
      storage.addCompletion(createValidCompletion({ actNumber: 5, actId: 'act-5' }));

      expect(storage.getCompletedActNumbers()).toEqual([1, 3, 5]);
    });
  });

  describe('clearProfile', () => {
    it('removes data from localStorage', () => {
      storage.addCompletion(createValidCompletion());
      expect(storage.loadProfile()).not.toBeNull();

      storage.clearProfile();
      expect(storage.loadProfile()).toBeNull();
    });
  });

  describe('localStorage error handling', () => {
    it('loadProfile returns null on localStorage error', () => {
      // Simulate localStorage error by setting a getter that throws
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = () => { throw new Error('Storage full'); };

      expect(storage.loadProfile()).toBeNull();

      localStorage.getItem = originalGetItem;
    });

    it('saveProfile fails silently on localStorage error', () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = () => { throw new Error('Storage full'); };

      const profile = { completions: [createValidCompletion()], version: 1 };
      expect(() => storage.saveProfile(profile)).not.toThrow();

      localStorage.setItem = originalSetItem;
    });
  });
});
