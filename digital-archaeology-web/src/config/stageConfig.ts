// src/config/stageConfig.ts
// Centralized stage configuration registry (Story 11.2)
// Provides typed config for each CPU stage's resources: WASM, circuits, HDL, programs, syntax

import type { LabStage, StageInfo } from '../ui/StageSelector';
import { LAB_STAGES, STAGE_METADATA } from '../ui/StageSelector';

/**
 * Language ID constants for stage syntax configuration (Story 11.4).
 * These must match the exported languageId constants in each language file
 * (micro4-language.ts, micro8-language.ts, micro16-language.ts).
 * Defined here to avoid circular imports with Monaco-dependent language modules.
 */
const LANGUAGE_IDS = {
  micro4: 'micro4',
  micro8: 'micro8',
  micro16: 'micro16',
} as const;

// Re-export for single-import convenience
export type { LabStage, StageInfo };
export { LAB_STAGES, STAGE_METADATA };

/** WASM module paths for a stage's emulator and assembler */
export interface StageWasmConfig {
  /** Path to emulator WASM JS glue file, relative to BASE_URL. null = not yet built */
  emulatorJs: string | null;
  /** Path to assembler WASM JS glue file, relative to BASE_URL. null = not yet built */
  assemblerJs: string | null;
}

/** Circuit visualization data path */
export interface StageCircuitConfig {
  /** Path to circuit JSON file, relative to BASE_URL. null = not yet created */
  path: string | null;
}

/** HDL source file path */
export interface StageHdlConfig {
  /** Path to HDL file, relative to BASE_URL. null = not yet created */
  path: string | null;
}

/** Example programs directory */
export interface StageProgramsConfig {
  /** Directory path for example programs, relative to BASE_URL. null = no examples yet */
  directory: string | null;
}

/** Syntax highlighting language config */
export interface StageSyntaxConfig {
  /** Monaco language ID. null = language not yet defined */
  languageId: string | null;
}

/**
 * Instruction categories available at a CPU stage (Story 18.1).
 * Used to define what types of instructions a stage supports,
 * enabling constraint enforcement in Stories 18.2-18.3.
 */
export type InstructionCategory =
  | 'arithmetic'
  | 'logic'
  | 'data-transfer'
  | 'control-flow'
  | 'comparison'
  | 'stack'
  | 'subroutine'
  | 'interrupt'
  | 'io'
  | 'multiply'
  | 'segment'
  | 'protection'
  | 'paging';

/**
 * Instruction set capabilities for a CPU stage (Story 18.1).
 */
export interface StageInstructionSet {
  /** Total number of distinct opcodes (matches STAGE_METADATA.instructionCount) */
  readonly opcodeCount: number;
  /** Instruction categories available at this stage */
  readonly categories: readonly InstructionCategory[];
}

/**
 * Period-accurate constraints for a CPU stage (Story 18.1).
 * Defines the authentic limitations each stage has — memory size, register count,
 * instruction set capabilities, and stack support. These drive constraint
 * enforcement (Stories 18.2-18.3) and educational error messages (Story 18.4).
 *
 * Data sources: src/micro{4,8,16}/cpu.h for implemented stages;
 * Micro32+ use placeholder values pending Epic 14 ISA definition.
 */
export interface StageConstraints {
  /** Memory size in bytes (e.g., 256, 65536, 1048576) */
  readonly memorySize: number;
  /** Number of programmer-visible general-purpose registers (0 = accumulator-only) */
  readonly registerCount: number;
  /** Instruction set capabilities for this stage */
  readonly instructionSet: StageInstructionSet;
  /** Whether this stage has a hardware stack with PUSH/POP */
  readonly stackSupported: boolean;
  /** Default program counter value on reset */
  readonly defaultPc: number;
  /** Default stack pointer value on reset (null if no stack) */
  readonly defaultSp: number | null;
}

/** Complete configuration for a single CPU stage */
export interface StageConfig {
  /** Stage metadata (label, icon, dataWidth, addressSpace) */
  meta: StageInfo;
  /** Whether this stage has all required assets ready for use */
  ready: boolean;
  /** WASM module paths for emulator and assembler */
  wasm: StageWasmConfig;
  /** Circuit visualization data */
  circuit: StageCircuitConfig;
  /** HDL source file */
  hdl: StageHdlConfig;
  /** Example programs directory */
  programs: StageProgramsConfig;
  /** Syntax highlighting language */
  syntax: StageSyntaxConfig;
  /** Period-accurate constraints for this stage (Story 18.1) */
  constraints: StageConstraints;
}

/**
 * Shared constraints for all Micro32 variants (Story 18.1, CR fix).
 * Pipeline (32-P) and superscalar (32-S) are microarchitecture, not ISA —
 * all three share identical instruction sets, memory, and register constraints.
 * Placeholder values pending Epic 14 ISA definition.
 */
const MICRO32_CONSTRAINTS: StageConstraints = {
  memorySize: 4294967296,    // 4 GB (per STAGE_METADATA addressSpace)
  registerCount: 16,         // Placeholder — ISA defined in Epic 14
  instructionSet: {
    opcodeCount: 200,
    categories: [
      'arithmetic', 'logic', 'data-transfer', 'control-flow',
      'comparison', 'stack', 'subroutine', 'interrupt', 'io',
      'multiply', 'segment', 'protection', 'paging',
    ],
  },
  stackSupported: true,
  defaultPc: 0,              // Placeholder — ISA defined in Epic 14
  defaultSp: 0xFFFFFFFE,     // Placeholder — ISA defined in Epic 14
};

/**
 * Registry of all stage configurations.
 * Micro4 is fully populated with real asset paths.
 * Other stages use null paths with ready: false until their assets are built.
 */
export const STAGE_CONFIGS: Record<LabStage, StageConfig> = {
  micro4: {
    meta: STAGE_METADATA.micro4,
    ready: true,
    wasm: {
      emulatorJs: 'wasm/micro4-cpu.js',
      assemblerJs: 'wasm/micro4-asm.js',
    },
    circuit: { path: 'circuits/micro4-circuit.json' },
    hdl: { path: 'hdl/04_micro4_cpu.m4hdl' },
    programs: { directory: 'programs/' },
    syntax: { languageId: LANGUAGE_IDS.micro4 },
    constraints: {
      memorySize: 256,           // src/micro4/cpu.h: MEM_SIZE 256
      registerCount: 0,          // Accumulator-only architecture
      instructionSet: {
        opcodeCount: 16,
        categories: ['arithmetic', 'logic', 'data-transfer', 'control-flow'],
      },
      stackSupported: false,
      defaultPc: 0,
      defaultSp: null,
    },
  },
  micro8: {
    meta: STAGE_METADATA.micro8,
    ready: false,
    wasm: { emulatorJs: 'wasm/micro8-cpu.js', assemblerJs: 'wasm/micro8-asm.js' },
    circuit: { path: null },
    hdl: { path: null },
    programs: { directory: 'programs/micro8/' },
    syntax: { languageId: LANGUAGE_IDS.micro8 },
    constraints: {
      memorySize: 65536,         // src/micro8/cpu.h: MEM_SIZE 65536
      registerCount: 8,          // R0-R7
      instructionSet: {
        opcodeCount: 80,
        categories: [
          'arithmetic', 'logic', 'data-transfer', 'control-flow',
          'comparison', 'stack', 'subroutine', 'interrupt', 'io',
        ],
      },
      stackSupported: true,
      defaultPc: 0x0200,         // src/micro8/cpu.h: DEFAULT_PC
      defaultSp: 0xFFFF,         // src/micro8/cpu.h: DEFAULT_SP
    },
  },
  micro16: {
    meta: STAGE_METADATA.micro16,
    ready: false,
    wasm: { emulatorJs: null, assemblerJs: null },
    circuit: { path: null },
    hdl: { path: null },
    programs: { directory: 'programs/micro16/' },
    syntax: { languageId: LANGUAGE_IDS.micro16 },
    constraints: {
      memorySize: 1048576,       // src/micro16/cpu.h: MEM_SIZE 0x100000
      registerCount: 12,         // 8 general-purpose + 4 segment registers
      instructionSet: {
        opcodeCount: 100,
        categories: [
          'arithmetic', 'logic', 'data-transfer', 'control-flow',
          'comparison', 'stack', 'subroutine', 'interrupt', 'io',
          'multiply', 'segment',
        ],
      },
      stackSupported: true,
      defaultPc: 0x0100,         // src/micro16/cpu.h: DEFAULT_PC
      defaultSp: 0xFFFE,         // src/micro16/cpu.h: DEFAULT_SP
    },
  },
  micro32: {
    meta: STAGE_METADATA.micro32,
    ready: false,
    wasm: { emulatorJs: null, assemblerJs: null },
    circuit: { path: null },
    hdl: { path: null },
    programs: { directory: null },
    syntax: { languageId: null },
    constraints: MICRO32_CONSTRAINTS,
  },
  micro32p: {
    meta: STAGE_METADATA.micro32p,
    ready: false,
    wasm: { emulatorJs: null, assemblerJs: null },
    circuit: { path: null },
    hdl: { path: null },
    programs: { directory: null },
    syntax: { languageId: null },
    constraints: MICRO32_CONSTRAINTS,
  },
  micro32s: {
    meta: STAGE_METADATA.micro32s,
    ready: false,
    wasm: { emulatorJs: null, assemblerJs: null },
    circuit: { path: null },
    hdl: { path: null },
    programs: { directory: null },
    syntax: { languageId: null },
    constraints: MICRO32_CONSTRAINTS,
  },
};

/**
 * Get the configuration for a specific stage.
 * Always returns a valid StageConfig - never null for valid LabStage values.
 */
export function getStageConfig(stage: LabStage): StageConfig {
  return STAGE_CONFIGS[stage];
}

/**
 * Check if a stage has all required assets ready for use.
 * A stage is ready when its WASM, circuit, HDL, programs, and syntax are all available.
 */
export function isStageReady(stage: LabStage): boolean {
  return STAGE_CONFIGS[stage].ready;
}

/**
 * Get the period-accurate constraints for a specific stage (Story 18.1).
 * Returns memory size, register count, instruction set capabilities, and stack support.
 */
export function getStageConstraints(stage: LabStage): StageConstraints {
  return STAGE_CONFIGS[stage].constraints;
}

/**
 * Get the memory size in bytes for a specific stage (Story 18.1).
 * Convenience accessor — equivalent to getStageConstraints(stage).memorySize.
 */
export function getStageMemorySize(stage: LabStage): number {
  return STAGE_CONFIGS[stage].constraints.memorySize;
}

/** Returns the next stage in LAB_STAGES order, or null for the last stage (Story 18.2) */
export function getNextStage(stage: LabStage): LabStage | null {
  const index = LAB_STAGES.indexOf(stage);
  if (index === -1 || index === LAB_STAGES.length - 1) return null;
  return LAB_STAGES[index + 1];
}

/**
 * Instruction mnemonics recognized by each stage's assembler (Story 18.3).
 * Each stage has its own independent instruction set — later stages are NOT strict
 * supersets (e.g., Micro4's LDA/STA become LD/ST in Micro8).
 *
 * Data sources:
 * - micro4: src/micro4/assembler.c, process_line() — 16 mnemonics
 * - micro8: src/micro8/assembler.c, instructions[] table — 68 mnemonics
 * - micro16: src/micro16/assembler.c, instructions[] table + special-case parsing — 99 mnemonics
 * - micro32+: Placeholder (uses micro16 set pending Epic 14 ISA definition)
 */
const MICRO16_INSTRUCTIONS: readonly string[] = [
  // Source: src/micro16/assembler.c, instructions[] lookup table (no-operand and single-operand):
  'NOP', 'HLT', 'WAIT', 'CLI', 'STI', 'CLC', 'STC', 'CMC', 'CLD', 'STD',
  'PUSHF', 'POPF', 'IRET', 'PUSHA', 'POPA', 'LEAVE', 'RET', 'RETF',
  'INC', 'DEC', 'NEG', 'NOT', 'PUSH', 'POP',
  'JMP', 'CALL', 'JZ', 'JE', 'JNZ', 'JNE', 'JC', 'JB', 'JNC', 'JAE',
  'JS', 'JNS', 'JO', 'JNO', 'JL', 'JGE', 'JLE', 'JG', 'JA', 'JBE',
  'JR', 'LOOP', 'LOOPZ', 'LOOPE', 'LOOPNZ', 'LOOPNE',
  'MOVSB', 'MOVSW', 'CMPSB', 'CMPSW', 'STOSB', 'STOSW', 'LODSB', 'LODSW',
  // Source: src/micro16/assembler.c, special-case parsing (multi-operand):
  'INT', 'REP', 'REPZ', 'REPE', 'REPNZ', 'REPNE',
  'MOV', 'XCHG', 'ADD', 'ADC', 'SUB', 'SBC', 'AND', 'OR', 'XOR',
  'CMP', 'TEST', 'SHL', 'SHR', 'SAR', 'ROL', 'ROR', 'RCL', 'RCR',
  'MUL', 'IMUL', 'DIV', 'IDIV', 'ENTER', 'RETI',
  'LD', 'ST', 'LDB', 'STB', 'LEA', 'LDS', 'LES',
  'IN', 'OUT', 'INB', 'OUTB',
];

const STAGE_INSTRUCTIONS: Record<LabStage, readonly string[]> = {
  micro4: [
    // Source: src/micro4/assembler.c, process_line() — 16 mnemonics
    'HLT', 'LDA', 'STA', 'ADD', 'SUB', 'JMP', 'JZ', 'LDI',
    'AND', 'XOR', 'OR', 'NOT', 'SHL', 'SHR', 'INC', 'DEC',
  ],
  micro8: [
    // Source: src/micro8/assembler.c, instructions[] table — 68 mnemonics
    'NOP', 'HLT', 'LDI', 'LD', 'ST', 'LDZ', 'STZ', 'LDI16', 'MOV16', 'MOV',
    'ADD', 'ADC', 'SUB', 'SBC', 'ADDI', 'SUBI', 'INC', 'DEC', 'NEG',
    'CMP', 'CMPI', 'INC16', 'DEC16', 'ADD16',
    'AND', 'OR', 'XOR', 'NOT', 'ANDI', 'ORI', 'XORI',
    'SHL', 'SHR', 'SAR', 'ROL', 'ROR', 'SWAP',
    'JMP', 'JZ', 'JNZ', 'JC', 'JNC', 'JS', 'JNS', 'JO', 'JNO', 'CALL',
    'JR', 'JRZ', 'JRNZ', 'JRC', 'JRNC', 'JP',
    'RET', 'RETI',
    'PUSH', 'POP', 'PUSH16', 'POP16', 'PUSHF', 'POPF',
    'EI', 'DI', 'SCF', 'CCF', 'CMF', 'IN', 'OUT',
  ],
  micro16: MICRO16_INSTRUCTIONS,
  // Placeholder: Micro32 ISA not yet defined (Epic 14) — uses micro16 baseline
  micro32: MICRO16_INSTRUCTIONS,
  micro32p: MICRO16_INSTRUCTIONS,
  micro32s: MICRO16_INSTRUCTIONS,
};

/**
 * Educational content for a CPU stage (Story 18.4).
 * Provides historical and architectural context for constraint error messages,
 * explaining WHY limitations exist and what advancing to the next stage unlocks.
 */
export interface StageEducationalContent {
  /** Why the memory limit exists — architectural/historical reasoning */
  readonly memoryContext: string;
  /** Why the instruction set is limited — what's missing and why */
  readonly instructionContext: string;
  /** What advancing to the next stage unlocks — teaser for the learning journey */
  readonly journeyTeaser: string;
}

/**
 * Educational content keyed by CPU stage (Story 18.4).
 * Content is historically grounded and pedagogically framed.
 *
 * Data sources:
 * - docs/cpu_history_timeline.md
 * - docs/micro4_minimal_architecture.md
 * - docs/micro8_isa.md
 */
const STAGE_EDUCATIONAL_CONTENT: Record<LabStage, StageEducationalContent> = {
  micro4: {
    memoryContext: 'Micro4 uses a 4-bit data bus and 8-bit address bus, limiting memory to 256 bytes. This mirrors early 4-bit processors like the Intel 4004 (1971), where every byte of memory was precious and programmers had to carefully optimize their code to fit.',
    instructionContext: 'Micro4 has only 16 instructions — one for each possible 4-bit opcode. This is the fundamental trade-off of a 4-bit instruction encoding: simplicity and small program size, but very limited capabilities. There are no registers beyond the accumulator, no stack, and no subroutine support.',
    journeyTeaser: 'When you advance to Micro8, you\'ll gain 8 general-purpose registers, a hardware stack with PUSH/POP, subroutine support via CALL/RET, and 64 KB of memory — the capabilities that enabled real software development.',
  },
  micro8: {
    memoryContext: 'Micro8 uses an 8-bit data bus and 16-bit address bus, providing 64 KB of memory. This is the same address space as classic 8-bit processors like the Zilog Z80 (1976) and Intel 8080 (1974), which powered the first generation of personal computers.',
    instructionContext: 'Micro8 has 68 instructions across arithmetic, logic, data transfer, control flow, stack, subroutine, interrupt, and I/O categories. However, it lacks hardware multiply/divide, segmented memory, and string operations — all of which require wider data paths and more complex control logic.',
    journeyTeaser: 'Micro16 introduces hardware multiply/divide, a segmented memory model reaching 1 MB, and string operations — the features that enabled the IBM PC revolution.',
  },
  micro16: {
    memoryContext: 'Micro16 uses a 16-bit data bus and 20-bit address bus, providing 1 MB of memory through segment:offset addressing. This matches the Intel 8086 (1978) architecture, where the famous "640 KB ought to be enough" limit came from the segmented memory model.',
    instructionContext: 'Micro16 has 99 instructions including hardware multiply/divide, string operations with REP prefix, and segmented memory access. It lacks protected mode, paging, and the flat 32-bit address space that would come with 32-bit processors.',
    journeyTeaser: 'Micro32 introduces protected mode, virtual memory with paging, and a flat 4 GB address space — the architecture that powers modern computing.',
  },
  micro32: {
    memoryContext: 'Micro32 provides a full 32-bit flat address space with 4 GB of memory, protected mode, and virtual memory with paging. This stage is a placeholder pending Epic 14 ISA definition.',
    instructionContext: 'Micro32 instruction set is pending Epic 14 ISA definition. It will include protected mode instructions, paging control, and an expanded register set.',
    journeyTeaser: 'Micro32-P adds a 5-stage pipeline, enabling instruction-level parallelism and significantly higher throughput.',
  },
  micro32p: {
    memoryContext: 'Micro32-P shares the same 4 GB address space as Micro32. The pipeline microarchitecture does not change the memory model. This stage is a placeholder pending Epic 15 implementation.',
    instructionContext: 'Micro32-P shares the same instruction set as Micro32. The pipeline is a microarchitectural feature, not an ISA change.',
    journeyTeaser: 'Micro32-S adds superscalar execution with multiple execution units, out-of-order processing, and branch prediction — the frontier of CPU design.',
  },
  micro32s: {
    memoryContext: 'Micro32-S shares the same 4 GB address space as Micro32. The superscalar microarchitecture does not change the memory model. This stage is a placeholder pending Epic 16 implementation.',
    instructionContext: 'Micro32-S shares the same instruction set as Micro32. Superscalar execution is a microarchitectural feature, not an ISA change.',
    journeyTeaser: 'You\'ve reached the most advanced stage in the Digital Archaeology journey. You now understand the full evolution from 4-bit simplicity to superscalar complexity.',
  },
};

/**
 * Get the educational content for a specific stage (Story 18.4).
 * Returns historical context, instruction rationale, and journey teasers
 * for use in constraint error messages.
 */
export function getStageEducationalContent(stage: LabStage): StageEducationalContent {
  return STAGE_EDUCATIONAL_CONTENT[stage];
}

/** Cached instruction sets for O(1) lookup (Story 18.3) */
const stageInstructionSets = new Map<LabStage, ReadonlySet<string>>();

/**
 * Get the set of instruction mnemonics available in a specific stage (Story 18.3).
 * Returns a ReadonlySet of uppercase mnemonics for O(1) lookup.
 */
export function getStageInstructions(stage: LabStage): ReadonlySet<string> {
  let set = stageInstructionSets.get(stage);
  if (!set) {
    set = new Set(STAGE_INSTRUCTIONS[stage]);
    stageInstructionSets.set(stage, set);
  }
  return set;
}

/**
 * Check if an instruction mnemonic is available in a specific stage (Story 18.3).
 * Case-insensitive — C assemblers use strcasecmp() for matching.
 */
export function isInstructionAvailable(stage: LabStage, mnemonic: string): boolean {
  return getStageInstructions(stage).has(mnemonic.toUpperCase());
}

/**
 * Find the earliest (first) stage where an instruction becomes available (Story 18.3).
 * Returns null if the instruction doesn't exist in any stage.
 * Used to generate educational error messages about instruction availability.
 */
export function findEarliestStageForInstruction(mnemonic: string): LabStage | null {
  const upper = mnemonic.toUpperCase();
  for (const stage of LAB_STAGES) {
    if (getStageInstructions(stage).has(upper)) {
      return stage;
    }
  }
  return null;
}
