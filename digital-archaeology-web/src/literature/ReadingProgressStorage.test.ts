// src/literature/ReadingProgressStorage.test.ts
// Tests for ReadingProgressStorage localStorage persistence
// Story 20.4: Implement Reading Progress — Task 7.1

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ReadingProgressStorage,
  READING_PROGRESS_KEY,
  isValidReadingProgress,
} from './ReadingProgressStorage';

describe('ReadingProgressStorage', () => {
  const TEST_KEY = 'test-reading-progress';
  let storage: ReadingProgressStorage;

  beforeEach(() => {
    localStorage.clear();
    storage = new ReadingProgressStorage(TEST_KEY);
  });

  describe('constructor', () => {
    it('uses default key when none provided', () => {
      const defaultStorage = new ReadingProgressStorage();
      defaultStorage.markRead('art-1');
      expect(localStorage.getItem(READING_PROGRESS_KEY)).not.toBeNull();
    });

    it('uses custom key when provided', () => {
      storage.markRead('art-1');
      expect(localStorage.getItem(TEST_KEY)).not.toBeNull();
      expect(localStorage.getItem(READING_PROGRESS_KEY)).toBeNull();
    });
  });

  describe('load', () => {
    it('returns empty Set when no data exists', () => {
      const result = storage.load();
      expect(result.size).toBe(0);
    });

    it('returns stored article IDs as a Set', () => {
      localStorage.setItem(
        TEST_KEY,
        JSON.stringify({
          readArticleIds: ['art-1', 'art-2', 'art-3'],
          lastReadAt: '2026-01-01T00:00:00.000Z',
        }),
      );
      const result = storage.load();
      expect(result.size).toBe(3);
      expect(result.has('art-1')).toBe(true);
      expect(result.has('art-2')).toBe(true);
      expect(result.has('art-3')).toBe(true);
    });

    it('returns empty Set on corrupted JSON', () => {
      localStorage.setItem(TEST_KEY, 'not-valid-json');
      const result = storage.load();
      expect(result.size).toBe(0);
    });

    it('returns empty Set and clears on invalid shape', () => {
      localStorage.setItem(TEST_KEY, JSON.stringify({ foo: 'bar' }));
      const result = storage.load();
      expect(result.size).toBe(0);
      expect(localStorage.getItem(TEST_KEY)).toBeNull();
    });

    it('returns empty Set and clears when readArticleIds contains non-strings', () => {
      localStorage.setItem(
        TEST_KEY,
        JSON.stringify({ readArticleIds: [1, 2, 3] }),
      );
      const result = storage.load();
      expect(result.size).toBe(0);
      expect(localStorage.getItem(TEST_KEY)).toBeNull();
    });

    it('handles localStorage getItem throwing', () => {
      const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('quota exceeded');
      });
      const result = storage.load();
      expect(result.size).toBe(0);
      spy.mockRestore();
    });
  });

  describe('markRead', () => {
    it('adds a new article ID and persists', () => {
      const result = storage.markRead('art-1');
      expect(result.has('art-1')).toBe(true);

      // Verify persistence
      const reloaded = storage.load();
      expect(reloaded.has('art-1')).toBe(true);
    });

    it('is idempotent — marking already-read article returns same set', () => {
      storage.markRead('art-1');
      const result = storage.markRead('art-1');
      expect(result.size).toBe(1);
    });

    it('accumulates multiple article IDs', () => {
      storage.markRead('art-1');
      storage.markRead('art-2');
      const result = storage.markRead('art-3');
      expect(result.size).toBe(3);
    });

    it('persists lastReadAt timestamp', () => {
      storage.markRead('art-1');
      const raw = localStorage.getItem(TEST_KEY);
      const parsed = JSON.parse(raw!);
      expect(parsed.lastReadAt).toBeDefined();
      expect(typeof parsed.lastReadAt).toBe('string');
    });
  });

  describe('getReadCount', () => {
    it('returns 0 when no articles read', () => {
      expect(storage.getReadCount()).toBe(0);
    });

    it('returns correct count after marking articles', () => {
      storage.markRead('art-1');
      storage.markRead('art-2');
      expect(storage.getReadCount()).toBe(2);
    });
  });

  describe('clearAll', () => {
    it('removes all reading progress', () => {
      storage.markRead('art-1');
      storage.markRead('art-2');
      storage.clearAll();

      expect(storage.load().size).toBe(0);
      expect(localStorage.getItem(TEST_KEY)).toBeNull();
    });

    it('handles localStorage removeItem throwing', () => {
      const spy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('storage error');
      });
      // Should not throw
      expect(() => storage.clearAll()).not.toThrow();
      spy.mockRestore();
    });
  });

  describe('save error handling', () => {
    it('handles localStorage setItem throwing', () => {
      const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('quota exceeded');
      });
      // markRead calls save internally — should not throw
      expect(() => storage.markRead('art-1')).not.toThrow();
      spy.mockRestore();
    });
  });
});

describe('isValidReadingProgress', () => {
  it('returns false for null', () => {
    expect(isValidReadingProgress(null)).toBe(false);
  });

  it('returns false for non-object', () => {
    expect(isValidReadingProgress('string')).toBe(false);
    expect(isValidReadingProgress(42)).toBe(false);
  });

  it('returns false when readArticleIds is missing', () => {
    expect(isValidReadingProgress({})).toBe(false);
  });

  it('returns false when readArticleIds is not an array', () => {
    expect(isValidReadingProgress({ readArticleIds: 'not-array' })).toBe(false);
  });

  it('returns false when readArticleIds contains non-strings', () => {
    expect(isValidReadingProgress({ readArticleIds: [1, 2] })).toBe(false);
  });

  it('returns false when lastReadAt is not a string', () => {
    expect(isValidReadingProgress({ readArticleIds: [], lastReadAt: 123 })).toBe(false);
  });

  it('returns true for valid minimal shape', () => {
    expect(isValidReadingProgress({ readArticleIds: [] })).toBe(true);
  });

  it('returns true for valid full shape', () => {
    expect(
      isValidReadingProgress({
        readArticleIds: ['a', 'b'],
        lastReadAt: '2026-01-01T00:00:00.000Z',
      }),
    ).toBe(true);
  });
});
