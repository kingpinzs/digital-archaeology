// src/examples/exampleMetadata.ts
// Static metadata for all example programs

import type { ExampleProgram, ExampleCategory } from './types';
import { CATEGORY_ORDER } from './types';

/**
 * Complete list of example programs with metadata.
 * Programs are defined here and grouped by category for display.
 */
export const EXAMPLE_PROGRAMS: ExampleProgram[] = [
  // Arithmetic programs
  {
    filename: 'add.asm',
    name: 'Add Two Numbers',
    category: 'arithmetic',
    description: 'Add two numbers (5+3=8)',
    concepts: ['LDA', 'ADD', 'STA', 'memory'],
    difficulty: 'beginner',
    stage: 'micro4',
  },
  {
    filename: 'multiply.asm',
    name: 'Multiply',
    category: 'arithmetic',
    description: 'Multiply via repeated addition',
    concepts: ['loops', 'repeated addition', 'accumulator'],
    difficulty: 'intermediate',
    stage: 'micro4',
  },
  {
    filename: 'divide.asm',
    name: 'Integer Division',
    category: 'arithmetic',
    description: 'Divide two numbers with remainder',
    concepts: ['loops', 'subtraction', 'remainder'],
    difficulty: 'intermediate',
    stage: 'micro4',
  },
  {
    filename: 'negative.asm',
    name: 'Negation',
    category: 'arithmetic',
    description: "Two's complement negation",
    concepts: ["two's complement", 'NOT', 'increment'],
    difficulty: 'intermediate',
    stage: 'micro4',
  },

  // Loop programs
  {
    filename: 'countdown.asm',
    name: 'Countdown',
    category: 'loops',
    description: 'Count down from N to 0',
    concepts: ['loops', 'JNZ', 'decrement'],
    difficulty: 'beginner',
    stage: 'micro4',
  },

  // Algorithm programs
  {
    filename: 'fibonacci.asm',
    name: 'Fibonacci',
    category: 'algorithms',
    description: 'Generate Fibonacci sequence',
    concepts: ['sequences', 'multiple variables', 'loops'],
    difficulty: 'intermediate',
    stage: 'micro4',
  },
  {
    filename: 'max.asm',
    name: 'Find Maximum',
    category: 'algorithms',
    description: 'Find maximum of two numbers',
    concepts: ['comparison', 'conditional jumps', 'branching'],
    difficulty: 'beginner',
    stage: 'micro4',
  },
  {
    filename: 'factorial.asm',
    name: 'Factorial',
    category: 'algorithms',
    description: 'Calculate factorial of N',
    concepts: ['recursion simulation', 'multiplication'],
    difficulty: 'advanced',
    stage: 'micro4',
  },
  {
    filename: 'bubble_sort.asm',
    name: 'Bubble Sort',
    category: 'algorithms',
    description: 'Sort array using bubble sort',
    concepts: ['arrays', 'nested loops', 'swapping'],
    difficulty: 'advanced',
    stage: 'micro4',
  },
  {
    filename: 'gcd.asm',
    name: 'GCD',
    category: 'algorithms',
    description: 'Greatest common divisor',
    concepts: ['Euclidean algorithm', 'modulo'],
    difficulty: 'advanced',
    stage: 'micro4',
  },

  // Bitwise programs
  {
    filename: 'bitwise_test.asm',
    name: 'Bitwise Operations',
    category: 'bitwise',
    description: 'Test AND, OR, XOR, NOT',
    concepts: ['AND', 'OR', 'XOR', 'NOT', 'bit manipulation'],
    difficulty: 'intermediate',
    stage: 'micro4',
  },

  // Reference programs
  {
    filename: 'all_instructions.asm',
    name: 'All Instructions',
    category: 'reference',
    description: 'Demo of all Micro4 instructions',
    concepts: ['complete ISA reference'],
    difficulty: 'beginner',
    stage: 'micro4',
  },
];

/**
 * Get programs grouped by category in display order.
 * @returns Map of category to programs in that category
 */
export function getProgramsByCategory(): Map<ExampleCategory, ExampleProgram[]> {
  const grouped = new Map<ExampleCategory, ExampleProgram[]>();

  // Initialize all categories in order (ensures empty categories still appear)
  for (const category of CATEGORY_ORDER) {
    grouped.set(category, []);
  }

  // Group programs
  for (const program of EXAMPLE_PROGRAMS) {
    const list = grouped.get(program.category);
    if (list) {
      list.push(program);
    }
  }

  return grouped;
}

/**
 * Find a program by filename.
 * @param filename - The filename to search for
 * @returns The program or null if not found
 */
export function findProgramByFilename(filename: string): ExampleProgram | null {
  return EXAMPLE_PROGRAMS.find((p) => p.filename === filename) ?? null;
}
