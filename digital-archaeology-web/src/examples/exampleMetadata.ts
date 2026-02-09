// src/examples/exampleMetadata.ts
// Static metadata for all example programs

import type { ExampleProgram, ExampleCategory } from './types';
import { CATEGORY_ORDER } from './types';
import type { LabStage } from '../config/stageConfig';

/**
 * Complete list of example programs with metadata.
 * Programs are defined here and grouped by category for display.
 */
export const EXAMPLE_PROGRAMS: ExampleProgram[] = [
  // ── Micro4 Programs (12) ──────────────────────────────────────────────

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

  // ── Micro8 Programs (15) ──────────────────────────────────────────────

  {
    filename: 'basic_mov.asm',
    name: 'Basic Data Movement',
    category: 'reference',
    description: 'Register-to-register moves and immediate loads across all 8 registers',
    concepts: ['LDI', 'MOV', 'registers', 'immediate values'],
    difficulty: 'beginner',
    stage: 'micro8',
  },
  {
    filename: 'arithmetic.asm',
    name: 'Arithmetic Operations',
    category: 'arithmetic',
    description: 'Addition, subtraction, carry, increment, decrement, and 16-bit arithmetic',
    concepts: ['ADD', 'SUB', 'ADC', 'SBC', 'INC', 'DEC', 'CMP', 'NEG'],
    difficulty: 'beginner',
    stage: 'micro8',
  },
  {
    filename: 'logic.asm',
    name: 'Logic Operations',
    category: 'bitwise',
    description: 'Bitwise logic and shift/rotate operations',
    concepts: ['AND', 'OR', 'XOR', 'NOT', 'SHL', 'SHR', 'ROL', 'ROR', 'SWAP'],
    difficulty: 'beginner',
    stage: 'micro8',
  },
  {
    filename: 'flags.asm',
    name: 'Flag Operations',
    category: 'reference',
    description: 'Test Zero, Carry, Sign, and Overflow flag behavior',
    concepts: ['Zero flag', 'Carry flag', 'Sign flag', 'Overflow flag', 'SCF', 'CCF'],
    difficulty: 'intermediate',
    stage: 'micro8',
  },
  {
    filename: 'jumps.asm',
    name: 'Jump Instructions',
    category: 'reference',
    description: 'Unconditional and conditional jumps with absolute and relative addressing',
    concepts: ['JMP', 'JR', 'JZ', 'JNZ', 'JC', 'JNC', 'JS', 'JNS', 'JP HL'],
    difficulty: 'beginner',
    stage: 'micro8',
  },
  {
    filename: 'memory.asm',
    name: 'Memory Access',
    category: 'reference',
    description: 'Direct, zero-page, indirect, and indexed memory addressing modes',
    concepts: ['LD', 'ST', 'LDZ', 'STZ', 'indirect addressing', 'indexed addressing'],
    difficulty: 'intermediate',
    stage: 'micro8',
  },
  {
    filename: 'stack.asm',
    name: 'Stack Operations',
    category: 'reference',
    description: 'Push, pop, 16-bit stack operations, and LIFO order verification',
    concepts: ['PUSH', 'POP', 'PUSH16', 'POP16', 'PUSHF', 'POPF', 'stack pointer'],
    difficulty: 'intermediate',
    stage: 'micro8',
  },
  {
    filename: 'calls.asm',
    name: 'Subroutine Calls',
    category: 'reference',
    description: 'Call and return with nested calls and register-based parameter passing',
    concepts: ['CALL', 'RET', 'nested calls', 'parameter passing', 'return addresses'],
    difficulty: 'intermediate',
    stage: 'micro8',
  },
  {
    filename: 'multiply.asm',
    name: '8-bit Multiplication',
    category: 'arithmetic',
    description: 'Multiple multiplication algorithms including shift-and-add and 8x8 to 16-bit',
    concepts: ['shift-and-add', 'repeated addition', 'extended precision', 'subroutines'],
    difficulty: 'intermediate',
    stage: 'micro8',
  },
  {
    filename: 'divide.asm',
    name: '8-bit Division',
    category: 'arithmetic',
    description: 'Division algorithms: repeated subtraction, shift-and-subtract, and modulo',
    concepts: ['division algorithms', 'shift operations', 'remainder', 'modulo'],
    difficulty: 'advanced',
    stage: 'micro8',
  },
  {
    filename: 'fibonacci.asm',
    name: 'Fibonacci Sequence',
    category: 'algorithms',
    description: 'Calculate Fibonacci with subroutines, indirect addressing, and overflow detection',
    concepts: ['subroutine calls', 'indirect addressing', 'loop constructs', 'overflow detection'],
    difficulty: 'intermediate',
    stage: 'micro8',
  },
  {
    filename: 'bubble_sort.asm',
    name: 'Bubble Sort',
    category: 'algorithms',
    description: 'Sort byte array using bubble sort with indirect addressing and swapping',
    concepts: ['array traversal', 'comparison', 'swapping', 'nested loops', 'indirect addressing'],
    difficulty: 'advanced',
    stage: 'micro8',
  },
  {
    filename: 'all_instructions.asm',
    name: 'All Instructions',
    category: 'reference',
    description: 'Comprehensive test of the complete Micro8 instruction set',
    concepts: ['complete ISA reference', 'all opcodes', 'instruction verification'],
    difficulty: 'advanced',
    stage: 'micro8',
  },
  {
    filename: 'interrupts.asm',
    name: 'Interrupt Handling',
    category: 'reference',
    description: 'Interrupt enable/disable, vector setup, and interrupt service routines',
    concepts: ['EI', 'DI', 'RETI', 'interrupt vectors', 'interrupt service routines'],
    difficulty: 'advanced',
    stage: 'micro8',
  },
  {
    filename: 'string_ops.asm',
    name: 'String Operations',
    category: 'reference',
    description: 'String copy, compare, length, concatenation, and memory fill',
    concepts: ['strcpy', 'strcmp', 'strlen', 'memcpy', 'null-terminated strings', 'indexed addressing'],
    difficulty: 'intermediate',
    stage: 'micro8',
  },

  // ── Micro16 Programs (13) ─────────────────────────────────────────────

  {
    filename: 'basic_mov.asm',
    name: 'Basic Data Movement',
    category: 'reference',
    description: 'Register-to-register moves, immediate loads, and segment register access',
    concepts: ['MOV', 'XCHG', 'segment registers', '16-bit registers'],
    difficulty: 'beginner',
    stage: 'micro16',
  },
  {
    filename: 'arithmetic.asm',
    name: 'Arithmetic Operations',
    category: 'arithmetic',
    description: '16-bit arithmetic with full flag updates',
    concepts: ['ADD', 'ADC', 'SUB', 'SBC', 'CMP', 'NEG', 'INC', 'DEC'],
    difficulty: 'beginner',
    stage: 'micro16',
  },
  {
    filename: 'logic.asm',
    name: 'Logic Operations',
    category: 'bitwise',
    description: '16-bit logic and shift/rotate instructions',
    concepts: ['AND', 'OR', 'XOR', 'NOT', 'TEST', 'SHL', 'SHR', 'SAR', 'ROL', 'ROR'],
    difficulty: 'beginner',
    stage: 'micro16',
  },
  {
    filename: 'flags.asm',
    name: 'Flag Operations',
    category: 'reference',
    description: 'CPU flags behavior and flag manipulation instructions',
    concepts: ['Carry', 'Zero', 'Sign', 'Overflow', 'Direction', 'Interrupt', 'CLC', 'STC', 'CLI', 'STI'],
    difficulty: 'intermediate',
    stage: 'micro16',
  },
  {
    filename: 'jumps.asm',
    name: 'Jump Instructions',
    category: 'reference',
    description: 'Unconditional, conditional, signed/unsigned comparisons, and loop instructions',
    concepts: ['JMP', 'JR', 'JZ', 'JNZ', 'JL', 'JGE', 'JA', 'JBE', 'LOOP', 'LOOPZ'],
    difficulty: 'beginner',
    stage: 'micro16',
  },
  {
    filename: 'memory.asm',
    name: 'Memory Operations',
    category: 'reference',
    description: 'Direct, indexed, and indirect addressing with 20-bit physical addresses',
    concepts: ['LD', 'ST', 'LDB', 'STB', 'LEA', 'segment:offset', '20-bit addressing'],
    difficulty: 'intermediate',
    stage: 'micro16',
  },
  {
    filename: 'stack.asm',
    name: 'Stack Operations',
    category: 'reference',
    description: 'Push, pop, register saves, and stack frame setup with ENTER/LEAVE',
    concepts: ['PUSH', 'POP', 'PUSHA', 'POPA', 'PUSHF', 'POPF', 'ENTER', 'LEAVE'],
    difficulty: 'intermediate',
    stage: 'micro16',
  },
  {
    filename: 'calls.asm',
    name: 'Subroutine Calls',
    category: 'reference',
    description: 'Near calls, far calls, indirect calls, and calling conventions',
    concepts: ['CALL', 'CALL FAR', 'RET', 'RETF', 'indirect call', 'calling conventions'],
    difficulty: 'intermediate',
    stage: 'micro16',
  },
  {
    filename: 'multiply.asm',
    name: '16-bit Multiplication',
    category: 'arithmetic',
    description: 'Hardware MUL and IMUL with 16x16 to 32-bit results',
    concepts: ['MUL', 'IMUL', 'unsigned multiply', 'signed multiply', 'DX:AX result'],
    difficulty: 'intermediate',
    stage: 'micro16',
  },
  {
    filename: 'divide.asm',
    name: '16-bit Division',
    category: 'arithmetic',
    description: 'Hardware DIV and IDIV with 32/16-bit quotient and remainder',
    concepts: ['DIV', 'IDIV', 'unsigned divide', 'signed divide', 'quotient', 'remainder'],
    difficulty: 'advanced',
    stage: 'micro16',
  },
  {
    filename: 'segments.asm',
    name: 'Memory Segmentation',
    category: 'reference',
    description: 'Segment registers, overrides, and physical address calculation',
    concepts: ['CS', 'DS', 'SS', 'ES', 'segment overrides', 'LDS', 'LES', 'physical addressing'],
    difficulty: 'advanced',
    stage: 'micro16',
  },
  {
    filename: 'interrupts.asm',
    name: 'Interrupt Handling',
    category: 'reference',
    description: 'Software interrupts, interrupt vector table, and interrupt control',
    concepts: ['INT', 'IRET', 'CLI', 'STI', 'interrupt vectors', 'interrupt service routines'],
    difficulty: 'advanced',
    stage: 'micro16',
  },
  {
    filename: 'strings.asm',
    name: 'String Instructions',
    category: 'reference',
    description: 'Repeated string move, compare, store, and load operations',
    concepts: ['MOVSB', 'MOVSW', 'CMPSB', 'STOSB', 'LODSB', 'REP', 'Direction flag', 'SI/DI'],
    difficulty: 'intermediate',
    stage: 'micro16',
  },
];

/**
 * Get programs filtered by stage.
 * @param stage - The CPU stage to filter by
 * @returns Array of programs for the given stage
 */
export function getProgramsByStage(stage: LabStage): ExampleProgram[] {
  return EXAMPLE_PROGRAMS.filter((p) => p.stage === stage);
}

/**
 * Get programs grouped by category in display order.
 * When stage is provided, only programs for that stage are included.
 * Categories with no programs are omitted when filtering by stage.
 * @param stage - Optional stage to filter by
 * @returns Map of category to programs in that category
 */
export function getProgramsByCategory(stage?: LabStage): Map<ExampleCategory, ExampleProgram[]> {
  const programs = stage ? getProgramsByStage(stage) : EXAMPLE_PROGRAMS;
  const grouped = new Map<ExampleCategory, ExampleProgram[]>();

  for (const category of CATEGORY_ORDER) {
    const categoryPrograms = programs.filter((p) => p.category === category);
    if (categoryPrograms.length > 0) {
      grouped.set(category, categoryPrograms);
    }
  }

  return grouped;
}

/**
 * Find a program by filename.
 * When stage is provided, only matches within that stage (recommended for
 * disambiguation since filenames like arithmetic.asm exist in multiple stages).
 * @param filename - The filename to search for
 * @param stage - Optional stage to restrict the search to
 * @returns The program or null if not found
 */
export function findProgramByFilename(
  filename: string,
  stage?: LabStage,
): ExampleProgram | null {
  const programs = stage ? getProgramsByStage(stage) : EXAMPLE_PROGRAMS;
  return programs.find((p) => p.filename === filename) ?? null;
}
