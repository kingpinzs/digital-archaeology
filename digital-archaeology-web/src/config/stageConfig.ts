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
}

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
  },
  micro8: {
    meta: STAGE_METADATA.micro8,
    ready: false,
    wasm: { emulatorJs: null, assemblerJs: null },
    circuit: { path: null },
    hdl: { path: null },
    programs: { directory: 'programs/micro8/' },
    syntax: { languageId: LANGUAGE_IDS.micro8 },
  },
  micro16: {
    meta: STAGE_METADATA.micro16,
    ready: false,
    wasm: { emulatorJs: null, assemblerJs: null },
    circuit: { path: null },
    hdl: { path: null },
    programs: { directory: 'programs/micro16/' },
    syntax: { languageId: LANGUAGE_IDS.micro16 },
  },
  micro32: {
    meta: STAGE_METADATA.micro32,
    ready: false,
    wasm: { emulatorJs: null, assemblerJs: null },
    circuit: { path: null },
    hdl: { path: null },
    programs: { directory: null },
    syntax: { languageId: null },
  },
  micro32p: {
    meta: STAGE_METADATA.micro32p,
    ready: false,
    wasm: { emulatorJs: null, assemblerJs: null },
    circuit: { path: null },
    hdl: { path: null },
    programs: { directory: null },
    syntax: { languageId: null },
  },
  micro32s: {
    meta: STAGE_METADATA.micro32s,
    ready: false,
    wasm: { emulatorJs: null, assemblerJs: null },
    circuit: { path: null },
    hdl: { path: null },
    programs: { directory: null },
    syntax: { languageId: null },
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
