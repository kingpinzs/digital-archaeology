// src/exercises/ExerciseProgressStorage.test.ts
// Tests for exercise progress persistence — Story 21.1

import { describe, it, expect, beforeEach } from 'vitest';
import { ExerciseProgressStorage } from './ExerciseProgressStorage';

describe('ExerciseProgressStorage', () => {
  let storage: ExerciseProgressStorage;

  beforeEach(() => {
    localStorage.clear();
    storage = new ExerciseProgressStorage('test-exercise-progress');
  });

  describe('load', () => {
    it('returns empty set when no data stored', () => {
      const result = storage.load();
      expect(result.size).toBe(0);
    });

    it('returns stored completed IDs', () => {
      localStorage.setItem('test-exercise-progress', JSON.stringify({
        completedIds: ['ex-m4-hello-nibble', 'ex-m4-simple-addition'],
      }));
      const result = storage.load();
      expect(result.size).toBe(2);
      expect(result.has('ex-m4-hello-nibble')).toBe(true);
      expect(result.has('ex-m4-simple-addition')).toBe(true);
    });

    it('returns empty for corrupted data', () => {
      localStorage.setItem('test-exercise-progress', 'not-json');
      const result = storage.load();
      expect(result.size).toBe(0);
    });

    it('returns empty for invalid structure', () => {
      localStorage.setItem('test-exercise-progress', JSON.stringify({ completedIds: [42] }));
      const result = storage.load();
      expect(result.size).toBe(0);
    });

    it('returns empty for invalid exercise IDs', () => {
      localStorage.setItem('test-exercise-progress', JSON.stringify({ completedIds: ['invalid-id'] }));
      const result = storage.load();
      expect(result.size).toBe(0);
    });
  });

  describe('markCompleted', () => {
    it('persists a completed exercise', () => {
      storage.markCompleted('ex-m4-hello-nibble');
      const result = storage.load();
      expect(result.has('ex-m4-hello-nibble')).toBe(true);
    });

    it('does not duplicate IDs', () => {
      storage.markCompleted('ex-m4-hello-nibble');
      storage.markCompleted('ex-m4-hello-nibble');
      const raw = JSON.parse(localStorage.getItem('test-exercise-progress')!);
      expect(raw.completedIds.filter((id: string) => id === 'ex-m4-hello-nibble').length).toBe(1);
    });

    it('accumulates multiple completions', () => {
      storage.markCompleted('ex-m4-hello-nibble');
      storage.markCompleted('ex-m4-simple-addition');
      storage.markCompleted('ex-m4-countdown-loop');
      const result = storage.load();
      expect(result.size).toBe(3);
    });

    it('ignores invalid exercise IDs', () => {
      storage.markCompleted('non-existent-id');
      const result = storage.load();
      expect(result.size).toBe(0);
    });
  });

  describe('getCompletedCount', () => {
    it('returns 0 when no completions', () => {
      expect(storage.getCompletedCount()).toBe(0);
    });

    it('returns correct count after completions', () => {
      storage.markCompleted('ex-m4-hello-nibble');
      storage.markCompleted('ex-m4-simple-addition');
      expect(storage.getCompletedCount()).toBe(2);
    });
  });

  describe('clearAll', () => {
    it('removes all stored progress', () => {
      storage.markCompleted('ex-m4-hello-nibble');
      storage.markCompleted('ex-m4-simple-addition');
      storage.clearAll();
      const result = storage.load();
      expect(result.size).toBe(0);
    });
  });
});
