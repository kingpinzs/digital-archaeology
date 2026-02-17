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
