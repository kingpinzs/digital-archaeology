// src/exercises/exerciseMetadata.test.ts
// Tests for exercise metadata integrity — Story 21.1

import { describe, it, expect } from 'vitest';
import {
  EXERCISES,
  EXERCISE_IDS,
  STAGES_WITH_EXERCISES,
  STAGE_EXERCISE_LABELS,
  getExercisesByStage,
  getExerciseCountByStage,
  findExerciseById,
  getExercisesByDifficulty,
} from './exerciseMetadata';
import { DIFFICULTY_ORDER } from './types';

describe('exerciseMetadata', () => {
  describe('EXERCISES', () => {
    it('should have at least 15 exercises', () => {
      expect(EXERCISES.length).toBeGreaterThanOrEqual(15);
    });

    it('should have unique IDs', () => {
      const ids = EXERCISES.map(e => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('should have non-empty titles', () => {
      for (const ex of EXERCISES) {
        expect(ex.title.length).toBeGreaterThan(0);
      }
    });

    it('should have non-empty descriptions (50+ chars)', () => {
      for (const ex of EXERCISES) {
        expect(ex.description.length).toBeGreaterThanOrEqual(50);
      }
    });

    it('should have valid stages', () => {
      const validStages = new Set(STAGES_WITH_EXERCISES);
      for (const ex of EXERCISES) {
        expect(validStages.has(ex.stage)).toBe(true);
      }
    });

    it('should have valid difficulties', () => {
      const validDifficulties = new Set(DIFFICULTY_ORDER);
      for (const ex of EXERCISES) {
        expect(validDifficulties.has(ex.difficulty)).toBe(true);
      }
    });

    it('should have at least 1 concept per exercise', () => {
      for (const ex of EXERCISES) {
        expect(ex.concepts.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('should have positive estimated minutes', () => {
      for (const ex of EXERCISES) {
        expect(ex.estimatedMinutes).toBeGreaterThan(0);
      }
    });

    it('should have valid prerequisite IDs (or empty)', () => {
      for (const ex of EXERCISES) {
        for (const prereqId of ex.prerequisites) {
          expect(EXERCISE_IDS.has(prereqId)).toBe(true);
        }
      }
    });

    it('prerequisites should not reference self', () => {
      for (const ex of EXERCISES) {
        expect(ex.prerequisites).not.toContain(ex.id);
      }
    });

    it('should have non-empty starterCode (30+ chars)', () => {
      for (const ex of EXERCISES) {
        expect(ex.starterCode.length).toBeGreaterThanOrEqual(30);
      }
    });

    it('starterCode should contain at least one TODO comment', () => {
      for (const ex of EXERCISES) {
        expect(ex.starterCode).toContain('TODO');
      }
    });

    it('starterCode should contain HLT instruction (non-capstone)', () => {
      const nonCapstone = EXERCISES.filter(e => e.difficulty !== 'capstone');
      for (const ex of nonCapstone) {
        expect(ex.starterCode).toContain('HLT');
      }
    });

    it('starterCode should use semicolon comments', () => {
      for (const ex of EXERCISES) {
        expect(ex.starterCode).toMatch(/^;/m);
      }
    });

    it('starterCode should include exercise title in header comment', () => {
      for (const ex of EXERCISES) {
        expect(ex.starterCode).toContain(ex.title);
      }
    });
  });

  describe('EXERCISE_IDS', () => {
    it('should contain all exercise IDs', () => {
      expect(EXERCISE_IDS.size).toBe(EXERCISES.length);
      for (const ex of EXERCISES) {
        expect(EXERCISE_IDS.has(ex.id)).toBe(true);
      }
    });
  });

  describe('STAGES_WITH_EXERCISES', () => {
    it('should include micro4, micro8, micro16', () => {
      expect(STAGES_WITH_EXERCISES).toContain('micro4');
      expect(STAGES_WITH_EXERCISES).toContain('micro8');
      expect(STAGES_WITH_EXERCISES).toContain('micro16');
    });

    it('should have labels for all stages', () => {
      for (const stage of STAGES_WITH_EXERCISES) {
        expect(STAGE_EXERCISE_LABELS[stage]).toBeDefined();
        expect(STAGE_EXERCISE_LABELS[stage].length).toBeGreaterThan(0);
      }
    });
  });

  describe('getExercisesByStage', () => {
    it('returns exercises for micro4', () => {
      const result = getExercisesByStage('micro4');
      expect(result.length).toBeGreaterThanOrEqual(5);
      for (const ex of result) {
        expect(ex.stage).toBe('micro4');
      }
    });

    it('returns exercises for micro8', () => {
      const result = getExercisesByStage('micro8');
      expect(result.length).toBeGreaterThanOrEqual(5);
      for (const ex of result) {
        expect(ex.stage).toBe('micro8');
      }
    });

    it('returns exercises for micro16', () => {
      const result = getExercisesByStage('micro16');
      expect(result.length).toBeGreaterThanOrEqual(5);
      for (const ex of result) {
        expect(ex.stage).toBe('micro16');
      }
    });

    it('returns empty for stage with no exercises', () => {
      const result = getExercisesByStage('micro32');
      expect(result.length).toBe(0);
    });
  });

  describe('getExerciseCountByStage', () => {
    it('returns correct count per stage', () => {
      for (const stage of STAGES_WITH_EXERCISES) {
        const exercises = getExercisesByStage(stage);
        expect(getExerciseCountByStage(stage)).toBe(exercises.length);
      }
    });
  });

  describe('findExerciseById', () => {
    it('finds existing exercises', () => {
      const first = EXERCISES[0];
      const found = findExerciseById(first.id);
      expect(found).toBeDefined();
      expect(found!.id).toBe(first.id);
      expect(found!.title).toBe(first.title);
    });

    it('returns undefined for non-existent ID', () => {
      expect(findExerciseById('non-existent')).toBeUndefined();
    });
  });

  describe('getExercisesByDifficulty', () => {
    it('returns exercises for beginner', () => {
      const result = getExercisesByDifficulty('beginner');
      expect(result.length).toBeGreaterThanOrEqual(1);
      for (const ex of result) {
        expect(ex.difficulty).toBe('beginner');
      }
    });

    it('returns exercises for advanced', () => {
      const result = getExercisesByDifficulty('advanced');
      expect(result.length).toBeGreaterThanOrEqual(1);
      for (const ex of result) {
        expect(ex.difficulty).toBe('advanced');
      }
    });
  });

  describe('exercise ordering', () => {
    it('exercises within each stage are ordered by difficulty', () => {
      const difficultyIndex: Record<string, number> = {
        beginner: 0, intermediate: 1, advanced: 2, capstone: 3,
      };
      for (const stage of STAGES_WITH_EXERCISES) {
        const stageExercises = getExercisesByStage(stage);
        for (let i = 1; i < stageExercises.length; i++) {
          expect(difficultyIndex[stageExercises[i].difficulty])
            .toBeGreaterThanOrEqual(difficultyIndex[stageExercises[i - 1].difficulty]);
        }
      }
    });
  });

  describe('testCases (Story 21.4)', () => {
    it('every exercise should have at least 1 test case', () => {
      for (const ex of EXERCISES) {
        expect(ex.testCases.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('each test case should have a non-empty label', () => {
      for (const ex of EXERCISES) {
        for (const tc of ex.testCases) {
          expect(tc.label.length).toBeGreaterThan(0);
        }
      }
    });

    it('each test case should have a non-negative address', () => {
      for (const ex of EXERCISES) {
        for (const tc of ex.testCases) {
          expect(tc.address).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('each test case should have a non-negative expected value', () => {
      for (const ex of EXERCISES) {
        for (const tc of ex.testCases) {
          expect(tc.expected).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('micro4 exercises should use addresses in 0xF0-0xFF range', () => {
      const micro4 = EXERCISES.filter(e => e.stage === 'micro4');
      for (const ex of micro4) {
        for (const tc of ex.testCases) {
          expect(tc.address).toBeGreaterThanOrEqual(0xF0);
          expect(tc.address).toBeLessThan(0x100);
        }
      }
    });

    it('micro8 exercises should use addresses in 0x100+ range', () => {
      const micro8 = EXERCISES.filter(e => e.stage === 'micro8');
      for (const ex of micro8) {
        for (const tc of ex.testCases) {
          expect(tc.address).toBeGreaterThanOrEqual(0x100);
        }
      }
    });

    it('micro16 exercises should use addresses in 0x200+ range', () => {
      const micro16 = EXERCISES.filter(e => e.stage === 'micro16');
      for (const ex of micro16) {
        for (const tc of ex.testCases) {
          expect(tc.address).toBeGreaterThanOrEqual(0x200);
        }
      }
    });

    it('starterCode should contain ORG directive for data placement', () => {
      for (const ex of EXERCISES) {
        const hasOrg = ex.starterCode.includes('ORG') || ex.starterCode.includes('.org');
        expect(hasOrg).toBe(true);
      }
    });
  });

  describe('hints (Story 21.5)', () => {
    it('every exercise should have at least 3 hints', () => {
      for (const ex of EXERCISES) {
        expect(ex.hints.length).toBeGreaterThanOrEqual(3);
      }
    });

    it('each hint should be a non-empty string', () => {
      for (const ex of EXERCISES) {
        for (const hint of ex.hints) {
          expect(typeof hint).toBe('string');
          expect(hint.length).toBeGreaterThan(0);
        }
      }
    });

    it('each hint should be at least 20 characters (meaningful content)', () => {
      for (const ex of EXERCISES) {
        for (const hint of ex.hints) {
          expect(hint.length).toBeGreaterThanOrEqual(20);
        }
      }
    });

    it('hints should be unique within each exercise', () => {
      for (const ex of EXERCISES) {
        const unique = new Set(ex.hints);
        expect(unique.size).toBe(ex.hints.length);
      }
    });

    it('no exercise should have more than 7 hints', () => {
      for (const ex of EXERCISES) {
        expect(ex.hints.length).toBeLessThanOrEqual(7);
      }
    });
  });
});
