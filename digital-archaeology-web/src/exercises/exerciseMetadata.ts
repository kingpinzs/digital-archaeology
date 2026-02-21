// src/exercises/exerciseMetadata.ts
// Exercise definitions with metadata for the Exercise Browser
// Story 21.1: Create Exercise Browser

import type { ExerciseMetadata, ExerciseDifficulty } from './types';
import type { LabStage } from '@ui/StageSelector';

/**
 * All exercise definitions. Ordered by stage, then difficulty.
 * Capstone exercises (Stories 21-8 through 21-14) will be appended in later stories.
 */
export const EXERCISES: readonly ExerciseMetadata[] = [
  // ── Micro4 Exercises ──────────────────────────────────────
  {
    id: 'ex-m4-hello-nibble',
    title: 'Hello Nibble',
    stage: 'micro4',
    difficulty: 'beginner',
    description: 'Load a value into the accumulator and store it to memory. Your first program on the simplest CPU.',
    concepts: ['accumulator', 'load', 'store', 'memory'],
    estimatedMinutes: 5,
    prerequisites: [],
  },
  {
    id: 'ex-m4-simple-addition',
    title: 'Simple Addition',
    stage: 'micro4',
    difficulty: 'beginner',
    description: 'Add two values stored in memory and write the result back. Learn how a 4-bit ALU performs arithmetic.',
    concepts: ['arithmetic', 'add', 'memory', 'accumulator'],
    estimatedMinutes: 10,
    prerequisites: ['ex-m4-hello-nibble'],
  },
  {
    id: 'ex-m4-countdown-loop',
    title: 'Countdown Loop',
    stage: 'micro4',
    difficulty: 'intermediate',
    description: 'Count down from a starting value to zero using conditional jumps. Discover why loops need flags.',
    concepts: ['loops', 'conditional-jump', 'flags', 'decrement'],
    estimatedMinutes: 15,
    prerequisites: ['ex-m4-simple-addition'],
  },
  {
    id: 'ex-m4-max-of-two',
    title: 'Max of Two',
    stage: 'micro4',
    difficulty: 'intermediate',
    description: 'Compare two values and keep the larger one. Learn how comparison works with only subtraction and flags.',
    concepts: ['comparison', 'conditional-jump', 'flags', 'subtraction'],
    estimatedMinutes: 15,
    prerequisites: ['ex-m4-countdown-loop'],
  },
  {
    id: 'ex-m4-bit-shift-multiply',
    title: 'Bit Shift Multiply',
    stage: 'micro4',
    difficulty: 'advanced',
    description: 'Multiply a value by 2 using left shift. Understand why early CPUs had no multiply instruction.',
    concepts: ['bit-shift', 'multiplication', 'accumulator', 'carry-flag'],
    estimatedMinutes: 20,
    prerequisites: ['ex-m4-max-of-two'],
  },

  // ── Micro8 Exercises ──────────────────────────────────────
  {
    id: 'ex-m8-register-swap',
    title: 'Register Swap',
    stage: 'micro8',
    difficulty: 'beginner',
    description: 'Swap the values of two registers without losing data. Feel the luxury of having 8 registers.',
    concepts: ['registers', 'move', 'temporary-storage'],
    estimatedMinutes: 5,
    prerequisites: [],
  },
  {
    id: 'ex-m8-array-sum',
    title: 'Array Sum',
    stage: 'micro8',
    difficulty: 'beginner',
    description: 'Sum an array of values stored in memory using a loop and index register. Learn indirect addressing.',
    concepts: ['arrays', 'loops', 'indirect-addressing', 'accumulator'],
    estimatedMinutes: 15,
    prerequisites: ['ex-m8-register-swap'],
  },
  {
    id: 'ex-m8-string-length',
    title: 'String Length',
    stage: 'micro8',
    difficulty: 'intermediate',
    description: 'Count characters in a null-terminated string. Discover how early computers handled text.',
    concepts: ['strings', 'null-terminator', 'loops', 'indirect-addressing'],
    estimatedMinutes: 15,
    prerequisites: ['ex-m8-array-sum'],
  },
  {
    id: 'ex-m8-bubble-sort',
    title: 'Bubble Sort',
    stage: 'micro8',
    difficulty: 'intermediate',
    description: 'Sort an array of numbers in place. Implement the classic algorithm with nested loops and swaps.',
    concepts: ['sorting', 'nested-loops', 'comparison', 'arrays'],
    estimatedMinutes: 25,
    prerequisites: ['ex-m8-string-length'],
  },
  {
    id: 'ex-m8-fibonacci',
    title: 'Fibonacci Sequence',
    stage: 'micro8',
    difficulty: 'advanced',
    description: 'Generate the first N Fibonacci numbers using subroutines. Experience the power of CALL/RET.',
    concepts: ['subroutines', 'stack', 'recursion-alternative', 'registers'],
    estimatedMinutes: 25,
    prerequisites: ['ex-m8-bubble-sort'],
  },

  // ── Micro16 Exercises ──────────────────────────────────────
  {
    id: 'ex-m16-segment-basics',
    title: 'Segment Basics',
    stage: 'micro16',
    difficulty: 'beginner',
    description: 'Load and store values across different memory segments. Understand why 16-bit needed segmentation.',
    concepts: ['segments', 'addressing', '16-bit', 'memory-model'],
    estimatedMinutes: 10,
    prerequisites: [],
  },
  {
    id: 'ex-m16-hardware-multiply',
    title: 'Hardware Multiply',
    stage: 'micro16',
    difficulty: 'beginner',
    description: 'Use the hardware MUL instruction instead of shift-and-add. Feel the speed of dedicated circuitry.',
    concepts: ['multiplication', 'hardware-multiply', 'performance'],
    estimatedMinutes: 10,
    prerequisites: ['ex-m16-segment-basics'],
  },
  {
    id: 'ex-m16-memory-block-copy',
    title: 'Memory Block Copy',
    stage: 'micro16',
    difficulty: 'intermediate',
    description: 'Copy a block of memory between segments. Implement the operation that early OSes used constantly.',
    concepts: ['memory-copy', 'segments', 'loops', 'block-operations'],
    estimatedMinutes: 20,
    prerequisites: ['ex-m16-hardware-multiply'],
  },
  {
    id: 'ex-m16-string-reverse',
    title: 'String Reverse',
    stage: 'micro16',
    difficulty: 'intermediate',
    description: 'Reverse a string stored in memory using two pointers. Classic algorithm, 16-bit style.',
    concepts: ['strings', 'pointers', 'two-pointer-technique', 'memory'],
    estimatedMinutes: 20,
    prerequisites: ['ex-m16-memory-block-copy'],
  },
  {
    id: 'ex-m16-linked-list',
    title: 'Linked List Traversal',
    stage: 'micro16',
    difficulty: 'advanced',
    description: 'Walk a linked list stored in memory, counting nodes. Discover why dynamic data needs address space.',
    concepts: ['linked-list', 'pointers', 'dynamic-data', 'memory-management'],
    estimatedMinutes: 30,
    prerequisites: ['ex-m16-string-reverse'],
  },
] as const;

/** Set of all valid exercise IDs for quick lookup */
export const EXERCISE_IDS: ReadonlySet<string> = new Set(EXERCISES.map(e => e.id));

/** Stages that have exercises defined */
export const STAGES_WITH_EXERCISES: readonly LabStage[] = ['micro4', 'micro8', 'micro16'] as const;

/** Get exercises filtered by stage */
export function getExercisesByStage(stage: LabStage): readonly ExerciseMetadata[] {
  return EXERCISES.filter(e => e.stage === stage);
}

/** Get exercise count per stage */
export function getExerciseCountByStage(stage: LabStage): number {
  return EXERCISES.filter(e => e.stage === stage).length;
}

/** Find an exercise by ID */
export function findExerciseById(id: string): ExerciseMetadata | undefined {
  return EXERCISES.find(e => e.id === id);
}

/** Get exercises filtered by difficulty */
export function getExercisesByDifficulty(difficulty: ExerciseDifficulty): readonly ExerciseMetadata[] {
  return EXERCISES.filter(e => e.difficulty === difficulty);
}

/** Stage display labels for exercise sections */
export const STAGE_EXERCISE_LABELS: Record<string, string> = {
  micro4: 'Micro4 — 4-bit',
  micro8: 'Micro8 — 8-bit',
  micro16: 'Micro16 — 16-bit',
};
