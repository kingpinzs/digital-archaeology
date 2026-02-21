// src/literature/HintProgressStorage.test.ts
// Tests for HintProgressStorage localStorage persistence
// Story 20.5: Create Progressive Hint System — Task 7.1

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  HintProgressStorage,
  HINT_PROGRESS_KEY,
  isValidHintProgress,
} from './HintProgressStorage';

describe('HintProgressStorage', () => {
  const TEST_KEY = 'test-hint-progress';
  let storage: HintProgressStorage;

  beforeEach(() => {
    localStorage.clear();
    storage = new HintProgressStorage(TEST_KEY);
  });

  describe('constructor', () => {
    it('uses default key when none provided', () => {
      const defaultStorage = new HintProgressStorage();
      defaultStorage.revealNext('art-1', 5);
      expect(localStorage.getItem(HINT_PROGRESS_KEY)).not.toBeNull();
    });

    it('uses custom key when provided', () => {
      storage.revealNext('art-1', 5);
      expect(localStorage.getItem(TEST_KEY)).not.toBeNull();
      expect(localStorage.getItem(HINT_PROGRESS_KEY)).toBeNull();
    });
  });

  describe('load', () => {
    it('returns empty record when no data exists', () => {
      const result = storage.load();
      expect(Object.keys(result).length).toBe(0);
    });

    it('returns stored hint progress', () => {
      localStorage.setItem(
        TEST_KEY,
        JSON.stringify({ revealedHints: { 'art-1': 2, 'art-3': 4 } }),
      );
      const result = storage.load();
      expect(result['art-1']).toBe(2);
      expect(result['art-3']).toBe(4);
    });

    it('returns empty record on corrupted JSON', () => {
      localStorage.setItem(TEST_KEY, 'not-valid-json');
      const result = storage.load();
      expect(Object.keys(result).length).toBe(0);
    });

    it('returns empty record and clears on invalid shape', () => {
      localStorage.setItem(TEST_KEY, JSON.stringify({ foo: 'bar' }));
      const result = storage.load();
      expect(Object.keys(result).length).toBe(0);
      expect(localStorage.getItem(TEST_KEY)).toBeNull();
    });

    it('handles localStorage getItem throwing', () => {
      const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('quota exceeded');
      });
      const result = storage.load();
      expect(Object.keys(result).length).toBe(0);
      spy.mockRestore();
    });
  });

  describe('getRevealedCount', () => {
    it('returns 0 when no hints revealed', () => {
      expect(storage.getRevealedCount('art-1')).toBe(0);
    });

    it('returns correct count for article', () => {
      storage.revealNext('art-1', 5);
      storage.revealNext('art-1', 5);
      expect(storage.getRevealedCount('art-1')).toBe(2);
    });
  });

  describe('revealNext', () => {
    it('increments count and persists', () => {
      const count = storage.revealNext('art-1', 5);
      expect(count).toBe(1);
      expect(storage.getRevealedCount('art-1')).toBe(1);
    });

    it('increments progressively', () => {
      storage.revealNext('art-1', 5);
      storage.revealNext('art-1', 5);
      const count = storage.revealNext('art-1', 5);
      expect(count).toBe(3);
    });

    it('does not exceed maxHints', () => {
      storage.revealNext('art-1', 2);
      storage.revealNext('art-1', 2);
      const count = storage.revealNext('art-1', 2);
      expect(count).toBe(2); // Capped at max
    });

    it('tracks multiple articles independently', () => {
      storage.revealNext('art-1', 5);
      storage.revealNext('art-2', 5);
      storage.revealNext('art-2', 5);
      expect(storage.getRevealedCount('art-1')).toBe(1);
      expect(storage.getRevealedCount('art-2')).toBe(2);
    });
  });

  describe('clearAll', () => {
    it('removes all hint progress', () => {
      storage.revealNext('art-1', 5);
      storage.revealNext('art-2', 5);
      storage.clearAll();

      expect(Object.keys(storage.load()).length).toBe(0);
      expect(localStorage.getItem(TEST_KEY)).toBeNull();
    });

    it('handles localStorage removeItem throwing', () => {
      const spy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('storage error');
      });
      expect(() => storage.clearAll()).not.toThrow();
      spy.mockRestore();
    });
  });

  describe('save error handling', () => {
    it('handles localStorage setItem throwing', () => {
      const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('quota exceeded');
      });
      expect(() => storage.revealNext('art-1', 5)).not.toThrow();
      spy.mockRestore();
    });
  });
});

describe('isValidHintProgress', () => {
  it('returns false for null', () => {
    expect(isValidHintProgress(null)).toBe(false);
  });

  it('returns false for non-object', () => {
    expect(isValidHintProgress('string')).toBe(false);
  });

  it('returns false when revealedHints is missing', () => {
    expect(isValidHintProgress({})).toBe(false);
  });

  it('returns false when revealedHints is an array', () => {
    expect(isValidHintProgress({ revealedHints: [] })).toBe(false);
  });

  it('returns false when revealedHints values are not numbers', () => {
    expect(isValidHintProgress({ revealedHints: { a: 'string' } })).toBe(false);
  });

  it('returns true for valid empty shape', () => {
    expect(isValidHintProgress({ revealedHints: {} })).toBe(true);
  });

  it('returns true for valid populated shape', () => {
    expect(isValidHintProgress({ revealedHints: { 'art-1': 2, 'art-2': 4 } })).toBe(true);
  });
});
