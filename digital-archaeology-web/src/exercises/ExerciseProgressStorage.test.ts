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

  // Story 21.7: Attempt tracking tests
  describe('recordAttempt', () => {
    it('records a passing attempt', () => {
      storage.recordAttempt('ex-m4-hello-nibble', true);
      const attempts = storage.getAttempts('ex-m4-hello-nibble');
      expect(attempts.length).toBe(1);
      expect(attempts[0].passed).toBe(true);
      expect(attempts[0].exerciseId).toBe('ex-m4-hello-nibble');
    });

    it('records a failing attempt', () => {
      storage.recordAttempt('ex-m4-hello-nibble', false);
      const attempts = storage.getAttempts('ex-m4-hello-nibble');
      expect(attempts.length).toBe(1);
      expect(attempts[0].passed).toBe(false);
    });

    it('accumulates multiple attempts', () => {
      storage.recordAttempt('ex-m4-hello-nibble', false);
      storage.recordAttempt('ex-m4-hello-nibble', false);
      storage.recordAttempt('ex-m4-hello-nibble', true);
      expect(storage.getAttemptCount('ex-m4-hello-nibble')).toBe(3);
    });

    it('records solutionViewed flag', () => {
      storage.recordAttempt('ex-m4-hello-nibble', true, true);
      const attempts = storage.getAttempts('ex-m4-hello-nibble');
      expect(attempts[0].solutionViewed).toBe(true);
    });

    it('defaults solutionViewed to false', () => {
      storage.recordAttempt('ex-m4-hello-nibble', true);
      const attempts = storage.getAttempts('ex-m4-hello-nibble');
      expect(attempts[0].solutionViewed).toBe(false);
    });

    it('ignores invalid exercise IDs', () => {
      storage.recordAttempt('non-existent-id', true);
      const raw = localStorage.getItem('test-exercise-progress');
      // Should not create any record for invalid IDs
      if (raw) {
        const parsed = JSON.parse(raw);
        expect((parsed.attempts ?? []).length).toBe(0);
      }
    });

    it('includes timestamp on each attempt', () => {
      const before = Date.now();
      storage.recordAttempt('ex-m4-hello-nibble', true);
      const after = Date.now();
      const attempts = storage.getAttempts('ex-m4-hello-nibble');
      expect(attempts[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(attempts[0].timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('getAttempts', () => {
    it('returns empty array when no attempts', () => {
      expect(storage.getAttempts('ex-m4-hello-nibble')).toEqual([]);
    });

    it('returns only attempts for the specified exercise', () => {
      storage.recordAttempt('ex-m4-hello-nibble', true);
      storage.recordAttempt('ex-m4-simple-addition', false);
      const attempts = storage.getAttempts('ex-m4-hello-nibble');
      expect(attempts.length).toBe(1);
      expect(attempts[0].exerciseId).toBe('ex-m4-hello-nibble');
    });
  });

  describe('getAttemptCount', () => {
    it('returns 0 when no attempts', () => {
      expect(storage.getAttemptCount('ex-m4-hello-nibble')).toBe(0);
    });

    it('returns correct count', () => {
      storage.recordAttempt('ex-m4-hello-nibble', false);
      storage.recordAttempt('ex-m4-hello-nibble', true);
      expect(storage.getAttemptCount('ex-m4-hello-nibble')).toBe(2);
    });
  });

  describe('getFirstSuccess', () => {
    it('returns undefined when no attempts', () => {
      expect(storage.getFirstSuccess('ex-m4-hello-nibble')).toBeUndefined();
    });

    it('returns undefined when all attempts failed', () => {
      storage.recordAttempt('ex-m4-hello-nibble', false);
      storage.recordAttempt('ex-m4-hello-nibble', false);
      expect(storage.getFirstSuccess('ex-m4-hello-nibble')).toBeUndefined();
    });

    it('returns the first passing attempt', () => {
      storage.recordAttempt('ex-m4-hello-nibble', false);
      storage.recordAttempt('ex-m4-hello-nibble', true);
      storage.recordAttempt('ex-m4-hello-nibble', true);
      const first = storage.getFirstSuccess('ex-m4-hello-nibble');
      expect(first).toBeDefined();
      expect(first!.passed).toBe(true);
    });
  });

  describe('getStageSummary', () => {
    it('returns zeros when no data', () => {
      const summary = storage.getStageSummary(['ex-m4-hello-nibble', 'ex-m4-simple-addition']);
      expect(summary.completed).toBe(0);
      expect(summary.total).toBe(2);
      expect(summary.attemptCount).toBe(0);
    });

    it('returns correct completed count', () => {
      storage.markCompleted('ex-m4-hello-nibble');
      const summary = storage.getStageSummary(['ex-m4-hello-nibble', 'ex-m4-simple-addition']);
      expect(summary.completed).toBe(1);
      expect(summary.total).toBe(2);
    });

    it('returns correct attempt count', () => {
      storage.recordAttempt('ex-m4-hello-nibble', false);
      storage.recordAttempt('ex-m4-hello-nibble', true);
      storage.recordAttempt('ex-m4-simple-addition', false);
      const summary = storage.getStageSummary(['ex-m4-hello-nibble', 'ex-m4-simple-addition']);
      expect(summary.attemptCount).toBe(3);
    });

    it('does not count attempts from other stages', () => {
      storage.recordAttempt('ex-m4-hello-nibble', true);
      storage.recordAttempt('ex-m8-register-swap', false);
      const summary = storage.getStageSummary(['ex-m4-hello-nibble']);
      expect(summary.attemptCount).toBe(1);
    });
  });

  describe('backward compatibility', () => {
    it('works with data that has no attempts field', () => {
      localStorage.setItem('test-exercise-progress', JSON.stringify({
        completedIds: ['ex-m4-hello-nibble'],
      }));
      const loaded = storage.load();
      expect(loaded.has('ex-m4-hello-nibble')).toBe(true);
      expect(storage.getAttempts('ex-m4-hello-nibble')).toEqual([]);
      expect(storage.getAttemptCount('ex-m4-hello-nibble')).toBe(0);
    });
  });

  describe('attempt validation', () => {
    it('filters out malformed attempt records from localStorage', () => {
      localStorage.setItem('test-exercise-progress', JSON.stringify({
        completedIds: ['ex-m4-hello-nibble'],
        attempts: [
          { exerciseId: 'ex-m4-hello-nibble', timestamp: 1000, passed: true, solutionViewed: false },
          42,
          { exerciseId: null },
          'garbage',
          { exerciseId: 'ex-m4-hello-nibble', timestamp: 2000, passed: false, solutionViewed: true },
        ],
      }));
      const attempts = storage.getAttempts('ex-m4-hello-nibble');
      expect(attempts.length).toBe(2);
      expect(attempts[0].timestamp).toBe(1000);
      expect(attempts[1].timestamp).toBe(2000);
    });

    it('returns empty for non-array attempts field', () => {
      localStorage.setItem('test-exercise-progress', JSON.stringify({
        completedIds: ['ex-m4-hello-nibble'],
        attempts: 'not-an-array',
      }));
      // Type guard rejects non-array attempts, so falls back to empty
      expect(storage.getAttempts('ex-m4-hello-nibble')).toEqual([]);
    });

    it('evicts oldest attempts when over cap', () => {
      // Record many attempts to fill up storage
      for (let i = 0; i < 505; i++) {
        storage.recordAttempt('ex-m4-hello-nibble', i % 2 === 0);
      }
      // Total attempts should be capped at 500
      const raw = JSON.parse(localStorage.getItem('test-exercise-progress')!);
      expect(raw.attempts.length).toBe(500);
    });
  });
});
