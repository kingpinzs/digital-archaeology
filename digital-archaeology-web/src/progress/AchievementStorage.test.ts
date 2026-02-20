// src/progress/AchievementStorage.test.ts
// Tests for AchievementStorage localStorage persistence service
// Story 19.3: Create Milestone Achievements

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AchievementStorage, ACHIEVEMENT_STORAGE_KEY } from './AchievementStorage';
import type { Achievement, AchievementProfile } from './types';

/** Helper: create a valid achievement for testing */
function createTestAchievement(overrides: Partial<Achievement> = {}): Achievement {
  return {
    type: 'first-discovery',
    timestamp: 1700000000000,
    tier: 'common',
    ...overrides,
  };
}

describe('AchievementStorage', () => {
  let storage: AchievementStorage;
  const TEST_KEY = 'test-achievements';

  beforeEach(() => {
    localStorage.clear();
    storage = new AchievementStorage(TEST_KEY);
  });

  describe('constructor', () => {
    it('uses default storage key when none provided', () => {
      const defaultStorage = new AchievementStorage();
      defaultStorage.saveProfile({ completions: [createTestAchievement()], version: 1 });
      expect(localStorage.getItem(ACHIEVEMENT_STORAGE_KEY)).not.toBeNull();
    });

    it('uses custom storage key when provided', () => {
      storage.saveProfile({ completions: [], version: 1 });
      expect(localStorage.getItem(TEST_KEY)).not.toBeNull();
      expect(localStorage.getItem(ACHIEVEMENT_STORAGE_KEY)).toBeNull();
    });
  });

  describe('loadProfile', () => {
    it('returns null when nothing is stored', () => {
      expect(storage.loadProfile()).toBeNull();
    });

    it('returns valid stored profile', () => {
      const profile: AchievementProfile = {
        completions: [createTestAchievement()],
        version: 1,
      };
      localStorage.setItem(TEST_KEY, JSON.stringify(profile));
      expect(storage.loadProfile()).toEqual(profile);
    });

    it('returns null and clears invalid data', () => {
      localStorage.setItem(TEST_KEY, JSON.stringify({ invalid: true }));
      expect(storage.loadProfile()).toBeNull();
      expect(localStorage.getItem(TEST_KEY)).toBeNull();
    });

    it('returns null for unparseable JSON', () => {
      localStorage.setItem(TEST_KEY, 'not-json');
      expect(storage.loadProfile()).toBeNull();
    });

    it('returns null when localStorage throws', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('storage unavailable');
      });
      expect(storage.loadProfile()).toBeNull();
      vi.restoreAllMocks();
    });
  });

  describe('saveProfile', () => {
    it('persists profile to localStorage', () => {
      const profile: AchievementProfile = {
        completions: [createTestAchievement()],
        version: 1,
      };
      storage.saveProfile(profile);
      const stored = JSON.parse(localStorage.getItem(TEST_KEY)!);
      expect(stored).toEqual(profile);
    });

    it('silently fails when localStorage throws', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('quota exceeded');
      });
      expect(() => storage.saveProfile({ completions: [], version: 1 })).not.toThrow();
      vi.restoreAllMocks();
    });
  });

  describe('getProfileOrDefault', () => {
    it('returns stored profile when available', () => {
      const profile: AchievementProfile = {
        completions: [createTestAchievement()],
        version: 1,
      };
      storage.saveProfile(profile);
      expect(storage.getProfileOrDefault()).toEqual(profile);
    });

    it('returns default profile when nothing stored', () => {
      const result = storage.getProfileOrDefault();
      expect(result.completions).toEqual([]);
      expect(result.version).toBe(1);
    });
  });

  describe('addAchievement', () => {
    it('adds achievement to empty profile', () => {
      const achievement = createTestAchievement();
      const result = storage.addAchievement(achievement);
      expect(result.completions).toHaveLength(1);
      expect(result.completions[0]).toEqual(achievement);
    });

    it('appends achievement to existing profile', () => {
      storage.addAchievement(createTestAchievement({ type: 'first-discovery', tier: 'common' }));
      const result = storage.addAchievement(createTestAchievement({ type: 'code-pioneer', tier: 'common' }));
      expect(result.completions).toHaveLength(2);
    });

    it('silently skips duplicate achievement type', () => {
      storage.addAchievement(createTestAchievement({ type: 'first-discovery' }));
      const result = storage.addAchievement(createTestAchievement({ type: 'first-discovery', timestamp: 9999 }));
      expect(result.completions).toHaveLength(1);
    });

    it('persists to localStorage', () => {
      storage.addAchievement(createTestAchievement());
      const stored = JSON.parse(localStorage.getItem(TEST_KEY)!);
      expect(stored.completions).toHaveLength(1);
    });
  });

  describe('hasAchievement', () => {
    it('returns false when profile is empty', () => {
      expect(storage.hasAchievement('first-discovery')).toBe(false);
    });

    it('returns true for earned achievement', () => {
      storage.addAchievement(createTestAchievement({ type: 'first-discovery' }));
      expect(storage.hasAchievement('first-discovery')).toBe(true);
    });

    it('returns false for unearned achievement', () => {
      storage.addAchievement(createTestAchievement({ type: 'first-discovery' }));
      expect(storage.hasAchievement('code-pioneer')).toBe(false);
    });
  });

  describe('getEarnedAchievementTypes', () => {
    it('returns empty array when no profile', () => {
      expect(storage.getEarnedAchievementTypes()).toEqual([]);
    });

    it('returns types sorted by timestamp', () => {
      storage.addAchievement(createTestAchievement({ type: 'code-pioneer', tier: 'common', timestamp: 2000 }));
      storage.addAchievement(createTestAchievement({ type: 'first-discovery', tier: 'common', timestamp: 1000 }));
      const result = storage.getEarnedAchievementTypes();
      expect(result).toEqual(['first-discovery', 'code-pioneer']);
    });
  });

  describe('clearProfile', () => {
    it('removes profile from localStorage', () => {
      storage.addAchievement(createTestAchievement());
      storage.clearProfile();
      expect(localStorage.getItem(TEST_KEY)).toBeNull();
    });

    it('handles clearing when nothing exists', () => {
      expect(() => storage.clearProfile()).not.toThrow();
    });

    it('silently fails when localStorage throws', () => {
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('storage unavailable');
      });
      expect(() => storage.clearProfile()).not.toThrow();
      vi.restoreAllMocks();
    });
  });
});
