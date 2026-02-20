// src/story/ProgressDisplay.test.ts
// Tests for createProgressDisplayData with real completion data support
// Story 19.2: Track Act Completion

import { describe, it, expect } from 'vitest';
import { createProgressDisplayData } from './ProgressDisplay';

describe('createProgressDisplayData', () => {
  describe('with explicit completedActNumbers (Story 19.2)', () => {
    it('marks specified acts as completed', () => {
      const result = createProgressDisplayData(5, 11, [0, 1, 2, 3, 4]);
      expect(result.acts[0].isCompleted).toBe(true);
      expect(result.acts[4].isCompleted).toBe(true);
      expect(result.acts[5].isCompleted).toBe(false);
    });

    it('marks non-contiguous completions correctly', () => {
      // Completed acts 0, 2, 4 but not 1, 3
      const result = createProgressDisplayData(5, 11, [0, 2, 4]);
      expect(result.acts[0].isCompleted).toBe(true);
      expect(result.acts[1].isCompleted).toBe(false);
      expect(result.acts[2].isCompleted).toBe(true);
      expect(result.acts[3].isCompleted).toBe(false);
      expect(result.acts[4].isCompleted).toBe(true);
    });

    it('current act logic stays the same', () => {
      const result = createProgressDisplayData(3, 11, [0, 1, 2]);
      expect(result.acts[3].isCurrent).toBe(true);
      expect(result.acts[3].isCompleted).toBe(false);
    });

    it('handles empty completedActNumbers', () => {
      const result = createProgressDisplayData(2, 11, []);
      for (const act of result.acts) {
        expect(act.isCompleted).toBe(false);
      }
    });

    it('current act can also be completed', () => {
      const result = createProgressDisplayData(3, 11, [0, 1, 2, 3]);
      expect(result.acts[3].isCompleted).toBe(true);
      expect(result.acts[3].isCurrent).toBe(true);
    });
  });

  describe('backward compatibility without completedActNumbers', () => {
    it('falls back to naive logic when completedActNumbers is not provided', () => {
      const result = createProgressDisplayData(3, 11);
      expect(result.acts[0].isCompleted).toBe(true);
      expect(result.acts[1].isCompleted).toBe(true);
      expect(result.acts[2].isCompleted).toBe(true);
      expect(result.acts[3].isCompleted).toBe(false);
      expect(result.acts[3].isCurrent).toBe(true);
    });

    it('falls back to naive logic when completedActNumbers is undefined', () => {
      const result = createProgressDisplayData(2, 11, undefined);
      expect(result.acts[0].isCompleted).toBe(true);
      expect(result.acts[1].isCompleted).toBe(true);
      expect(result.acts[2].isCompleted).toBe(false);
    });

    it('preserves existing behavior for act 0', () => {
      const result = createProgressDisplayData(0, 11);
      for (const act of result.acts) {
        expect(act.isCompleted).toBe(false);
      }
      expect(result.acts[0].isCurrent).toBe(true);
    });
  });

  describe('general properties', () => {
    it('returns correct totalActs', () => {
      const result = createProgressDisplayData(3, 11, [0, 1, 2]);
      expect(result.totalActs).toBe(11);
      expect(result.acts).toHaveLength(11);
    });

    it('returns correct currentActNumber', () => {
      const result = createProgressDisplayData(5, 11, [0, 1, 2, 3, 4]);
      expect(result.currentActNumber).toBe(5);
    });

    it('each act has correct actNumber', () => {
      const result = createProgressDisplayData(0, 11, []);
      for (let i = 0; i < 11; i++) {
        expect(result.acts[i].actNumber).toBe(i);
      }
    });
  });
});
