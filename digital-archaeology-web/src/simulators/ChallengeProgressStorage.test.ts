// src/simulators/ChallengeProgressStorage.test.ts
// Story 26.3: Tests for ChallengeProgressStorage

import { describe, it, expect, beforeEach } from 'vitest';
import { ChallengeProgressStorage } from './ChallengeProgressStorage';

describe('ChallengeProgressStorage', () => {
  const TEST_KEY = 'test-challenge-progress';
  let storage: ChallengeProgressStorage;

  beforeEach(() => {
    localStorage.removeItem(TEST_KEY);
    storage = new ChallengeProgressStorage(TEST_KEY);
  });

  describe('getCompleted', () => {
    it('should return empty array for unknown scene', () => {
      expect(storage.getCompleted('scene-1')).toEqual([]);
    });

    it('should return saved objectives for a scene', () => {
      storage.markCompleted('scene-1', 'obj-1');
      storage.markCompleted('scene-1', 'obj-2');
      expect(storage.getCompleted('scene-1')).toEqual(['obj-1', 'obj-2']);
    });

    it('should isolate progress between scenes', () => {
      storage.markCompleted('scene-1', 'obj-1');
      storage.markCompleted('scene-2', 'obj-a');
      expect(storage.getCompleted('scene-1')).toEqual(['obj-1']);
      expect(storage.getCompleted('scene-2')).toEqual(['obj-a']);
    });
  });

  describe('markCompleted', () => {
    it('should add objective to scene progress', () => {
      storage.markCompleted('scene-1', 'obj-1');
      expect(storage.getCompleted('scene-1')).toContain('obj-1');
    });

    it('should be idempotent — no duplicates', () => {
      storage.markCompleted('scene-1', 'obj-1');
      storage.markCompleted('scene-1', 'obj-1');
      expect(storage.getCompleted('scene-1')).toEqual(['obj-1']);
    });

    it('should persist across instances', () => {
      storage.markCompleted('scene-1', 'obj-1');
      const storage2 = new ChallengeProgressStorage(TEST_KEY);
      expect(storage2.getCompleted('scene-1')).toEqual(['obj-1']);
    });
  });

  describe('clearScene', () => {
    it('should clear progress for a specific scene', () => {
      storage.markCompleted('scene-1', 'obj-1');
      storage.markCompleted('scene-2', 'obj-a');
      storage.clearScene('scene-1');
      expect(storage.getCompleted('scene-1')).toEqual([]);
      expect(storage.getCompleted('scene-2')).toEqual(['obj-a']);
    });

    it('should be safe to call on non-existent scene', () => {
      expect(() => storage.clearScene('nonexistent')).not.toThrow();
    });
  });

  describe('clearAll', () => {
    it('should clear all progress', () => {
      storage.markCompleted('scene-1', 'obj-1');
      storage.markCompleted('scene-2', 'obj-a');
      storage.clearAll();
      expect(storage.getCompleted('scene-1')).toEqual([]);
      expect(storage.getCompleted('scene-2')).toEqual([]);
    });
  });

  describe('hasProgress', () => {
    it('should return false for scene with no progress', () => {
      expect(storage.hasProgress('scene-1')).toBe(false);
    });

    it('should return true for scene with saved progress', () => {
      storage.markCompleted('scene-1', 'obj-1');
      expect(storage.hasProgress('scene-1')).toBe(true);
    });

    it('should return false after clearing scene', () => {
      storage.markCompleted('scene-1', 'obj-1');
      storage.clearScene('scene-1');
      expect(storage.hasProgress('scene-1')).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should return empty array on corrupted data', () => {
      localStorage.setItem(TEST_KEY, 'not-valid-json!!!');
      expect(storage.getCompleted('scene-1')).toEqual([]);
    });

    it('should return empty array on non-object data', () => {
      localStorage.setItem(TEST_KEY, '"just a string"');
      expect(storage.getCompleted('scene-1')).toEqual([]);
    });

    it('should return empty array on array data', () => {
      localStorage.setItem(TEST_KEY, '[1, 2, 3]');
      expect(storage.getCompleted('scene-1')).toEqual([]);
    });
  });
});
