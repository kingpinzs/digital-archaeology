// src/exercises/ExerciseValidator.ts
// Validates exercise solutions by comparing CPU memory against expected test cases
// Story 21.4: Implement Output Validation

import type {
  ExerciseMetadata,
  ExerciseTestCase,
  ExerciseTestResult,
  ExerciseValidationResult,
} from './types';

/**
 * Read a value from CPU memory at a given address.
 * For 16-bit stages, reads a little-endian 16-bit word (2 bytes).
 * For 8-bit and 4-bit stages, reads a single byte/nibble.
 */
function readMemoryValue(memory: Uint8Array, address: number, stage: string): number {
  if (address < 0 || address >= memory.length) {
    return -1; // Out of bounds sentinel
  }
  if (stage === 'micro16') {
    // 16-bit little-endian word read
    const lo = memory[address] ?? 0;
    const hi = (address + 1 < memory.length) ? (memory[address + 1] ?? 0) : 0;
    return (hi << 8) | lo;
  }
  return memory[address] ?? 0;
}

/**
 * Validates an exercise solution by checking CPU memory against test cases.
 *
 * Usage:
 * ```ts
 * const result = ExerciseValidator.validate(exercise, cpuMemory);
 * if (result.passed) { ... }
 * ```
 */
export class ExerciseValidator {
  /**
   * Validate an exercise's test cases against the current CPU memory state.
   *
   * @param exercise - The exercise being validated
   * @param memory - CPU memory snapshot (Uint8Array from CPUState.memory)
   * @returns Full validation result with per-test-case pass/fail details
   */
  static validate(exercise: ExerciseMetadata, memory: Uint8Array): ExerciseValidationResult {
    if (exercise.testCases.length === 0) {
      return {
        exerciseId: exercise.id,
        passed: false,
        results: [],
        error: 'Exercise has no test cases configured.',
      };
    }

    const results: ExerciseTestResult[] = exercise.testCases.map(
      (tc: ExerciseTestCase): ExerciseTestResult => {
        const actual = readMemoryValue(memory, tc.address, exercise.stage);
        return {
          label: tc.label,
          address: tc.address,
          expected: tc.expected,
          actual,
          passed: actual === tc.expected,
        };
      },
    );

    const allPassed = results.every((r) => r.passed);

    return {
      exerciseId: exercise.id,
      passed: allPassed,
      results,
    };
  }
}
