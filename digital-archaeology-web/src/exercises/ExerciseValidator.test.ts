// src/exercises/ExerciseValidator.test.ts
// Tests for ExerciseValidator — Story 21.4

import { describe, it, expect } from 'vitest';
import { ExerciseValidator } from './ExerciseValidator';
import type { ExerciseMetadata } from './types';

/** Helper to create a minimal exercise metadata object */
function makeExercise(
  overrides: Partial<ExerciseMetadata> & Pick<ExerciseMetadata, 'id' | 'stage' | 'testCases'>,
): ExerciseMetadata {
  return {
    title: 'Test Exercise',
    difficulty: 'beginner',
    description: 'A test exercise for unit testing validation logic.',
    concepts: ['test'],
    estimatedMinutes: 5,
    prerequisites: [],
    starterCode: '; TODO: test\nHLT\n',
    ...overrides,
  };
}

describe('ExerciseValidator', () => {
  describe('validate', () => {
    it('should pass when memory matches expected values', () => {
      const memory = new Uint8Array(256);
      memory[0xF1] = 7;

      const exercise = makeExercise({
        id: 'test-pass',
        stage: 'micro4',
        testCases: [{ label: 'RESULT', address: 0xF1, expected: 7 }],
      });

      const result = ExerciseValidator.validate(exercise, memory);
      expect(result.passed).toBe(true);
      expect(result.exerciseId).toBe('test-pass');
      expect(result.results).toHaveLength(1);
      expect(result.results[0].passed).toBe(true);
      expect(result.results[0].actual).toBe(7);
    });

    it('should fail when memory does not match expected values', () => {
      const memory = new Uint8Array(256);
      memory[0xF1] = 3; // Wrong value

      const exercise = makeExercise({
        id: 'test-fail',
        stage: 'micro4',
        testCases: [{ label: 'RESULT', address: 0xF1, expected: 7 }],
      });

      const result = ExerciseValidator.validate(exercise, memory);
      expect(result.passed).toBe(false);
      expect(result.results[0].passed).toBe(false);
      expect(result.results[0].expected).toBe(7);
      expect(result.results[0].actual).toBe(3);
    });

    it('should handle multiple test cases (mix pass/fail)', () => {
      const memory = new Uint8Array(512);
      memory[0x100] = 0xAB;
      memory[0x101] = 0x42;

      const exercise = makeExercise({
        id: 'test-mixed',
        stage: 'micro8',
        testCases: [
          { label: 'SWAP_A', address: 0x100, expected: 0xAB },
          { label: 'SWAP_B', address: 0x101, expected: 0xFF }, // Will fail
        ],
      });

      const result = ExerciseValidator.validate(exercise, memory);
      expect(result.passed).toBe(false);
      expect(result.results).toHaveLength(2);
      expect(result.results[0].passed).toBe(true);
      expect(result.results[1].passed).toBe(false);
      expect(result.results[1].actual).toBe(0x42);
    });

    it('should handle all tests passing with multiple cases', () => {
      const memory = new Uint8Array(512);
      memory[0x100] = 11;
      memory[0x101] = 12;
      memory[0x102] = 22;

      const exercise = makeExercise({
        id: 'test-all-pass',
        stage: 'micro8',
        testCases: [
          { label: 'ARRAY[0]', address: 0x100, expected: 11 },
          { label: 'ARRAY[1]', address: 0x101, expected: 12 },
          { label: 'ARRAY[2]', address: 0x102, expected: 22 },
        ],
      });

      const result = ExerciseValidator.validate(exercise, memory);
      expect(result.passed).toBe(true);
      expect(result.results).toHaveLength(3);
      expect(result.results.every((r) => r.passed)).toBe(true);
    });

    it('should return passed=false with error for exercises with no test cases', () => {
      const memory = new Uint8Array(256);
      const exercise = makeExercise({
        id: 'test-no-cases',
        stage: 'micro4',
        testCases: [],
      });

      const result = ExerciseValidator.validate(exercise, memory);
      expect(result.passed).toBe(false);
      expect(result.results).toHaveLength(0);
      expect(result.error).toBe('Exercise has no test cases configured.');
    });

    it('should read 16-bit little-endian values for micro16 stage', () => {
      const memory = new Uint8Array(1024);
      // 0xBEEF in little-endian: 0xEF at low byte, 0xBE at high byte
      memory[0x200] = 0xEF;
      memory[0x201] = 0xBE;

      const exercise = makeExercise({
        id: 'test-16bit',
        stage: 'micro16',
        testCases: [{ label: 'RESULT', address: 0x200, expected: 0xBEEF }],
      });

      const result = ExerciseValidator.validate(exercise, memory);
      expect(result.passed).toBe(true);
      expect(result.results[0].actual).toBe(0xBEEF);
    });

    it('should read 8-bit values for micro8 stage (not 16-bit)', () => {
      const memory = new Uint8Array(512);
      memory[0x100] = 150;
      memory[0x101] = 0xFF; // This should NOT be included in the read

      const exercise = makeExercise({
        id: 'test-8bit',
        stage: 'micro8',
        testCases: [{ label: 'RESULT', address: 0x100, expected: 150 }],
      });

      const result = ExerciseValidator.validate(exercise, memory);
      expect(result.passed).toBe(true);
      expect(result.results[0].actual).toBe(150);
    });

    it('should read single-nibble values for micro4 stage', () => {
      const memory = new Uint8Array(256);
      memory[0xF2] = 0;

      const exercise = makeExercise({
        id: 'test-4bit',
        stage: 'micro4',
        testCases: [{ label: 'RESULT', address: 0xF2, expected: 0 }],
      });

      const result = ExerciseValidator.validate(exercise, memory);
      expect(result.passed).toBe(true);
      expect(result.results[0].actual).toBe(0);
    });

    it('should return -1 for out-of-bounds address', () => {
      const memory = new Uint8Array(256);

      const exercise = makeExercise({
        id: 'test-oob',
        stage: 'micro4',
        testCases: [{ label: 'OOB', address: 300, expected: 0 }],
      });

      const result = ExerciseValidator.validate(exercise, memory);
      expect(result.passed).toBe(false);
      expect(result.results[0].actual).toBe(-1);
    });

    it('should include correct label, address, expected in results', () => {
      const memory = new Uint8Array(256);
      memory[0xF0] = 5;

      const exercise = makeExercise({
        id: 'test-fields',
        stage: 'micro4',
        testCases: [{ label: 'MY_LABEL', address: 0xF0, expected: 5 }],
      });

      const result = ExerciseValidator.validate(exercise, memory);
      expect(result.results[0]).toEqual({
        label: 'MY_LABEL',
        address: 0xF0,
        expected: 5,
        actual: 5,
        passed: true,
      });
    });

    it('should handle 16-bit value at edge of memory', () => {
      // When address is last byte in memory, high byte should read 0
      const memory = new Uint8Array(513);
      memory[512] = 0x34;

      const exercise = makeExercise({
        id: 'test-16bit-edge',
        stage: 'micro16',
        testCases: [{ label: 'EDGE', address: 512, expected: 0x34 }],
      });

      const result = ExerciseValidator.validate(exercise, memory);
      expect(result.passed).toBe(true);
      expect(result.results[0].actual).toBe(0x34); // hi byte is 0
    });
  });
});
