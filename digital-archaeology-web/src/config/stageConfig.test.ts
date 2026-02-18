// src/config/stageConfig.test.ts
// Unit tests for the Stage Configuration System (Story 11.2)

import { describe, it, expect } from 'vitest';
import {
  getStageConfig,
  isStageReady,
  STAGE_CONFIGS,
  type LabStage,
  LAB_STAGES,
  STAGE_METADATA,
  getStageConstraints,
  getStageMemorySize,
  getNextStage,
  getStageInstructions,
  isInstructionAvailable,
  findEarliestStageForInstruction,
  getStageEducationalContent,
  type StageConstraints,
  type StageEducationalContent,
  type InstructionCategory,
} from './stageConfig';

describe('stageConfig', () => {
  describe('STAGE_CONFIGS registry', () => {
    it('should have a config entry for every LabStage', () => {
      for (const stage of LAB_STAGES) {
        expect(STAGE_CONFIGS[stage]).toBeDefined();
      }
    });

    it('should have exactly 6 stage configs', () => {
      expect(Object.keys(STAGE_CONFIGS)).toHaveLength(6);
    });
  });

  describe('getStageConfig', () => {
    it('should return a complete config for micro4 with all paths populated', () => {
      const config = getStageConfig('micro4');
      expect(config.meta).toBeDefined();
      expect(config.meta.label).toBe('Micro4');
      expect(config.meta.icon).toBe('4');
      expect(config.meta.dataWidth).toBe('4-bit');
      expect(config.meta.addressSpace).toBe('256 B');
      expect(config.meta.instructionCount).toBe(16);
      expect(config.ready).toBe(true);
      expect(config.wasm.emulatorJs).toBe('wasm/micro4-cpu.js');
      expect(config.wasm.assemblerJs).toBe('wasm/micro4-asm.js');
      expect(config.circuit.path).toBe('circuits/micro4-circuit.json');
      expect(config.hdl.path).toBe('hdl/04_micro4_cpu.m4hdl');
      expect(config.programs.directory).toBe('programs/');
      expect(config.syntax.languageId).toBe('micro4');
    });

    it('should return valid StageConfig for each LabStage (no missing keys)', () => {
      for (const stage of LAB_STAGES) {
        const config = getStageConfig(stage);
        // Check all required top-level keys exist
        expect(config).toHaveProperty('meta');
        expect(config).toHaveProperty('ready');
        expect(config).toHaveProperty('wasm');
        expect(config).toHaveProperty('circuit');
        expect(config).toHaveProperty('hdl');
        expect(config).toHaveProperty('programs');
        expect(config).toHaveProperty('syntax');
        // Check sub-object keys
        expect(config.meta).toHaveProperty('label');
        expect(config.meta).toHaveProperty('icon');
        expect(config.meta).toHaveProperty('dataWidth');
        expect(config.meta).toHaveProperty('addressSpace');
        expect(config.meta).toHaveProperty('instructionCount');
        expect(config.wasm).toHaveProperty('emulatorJs');
        expect(config.wasm).toHaveProperty('assemblerJs');
        expect(config.circuit).toHaveProperty('path');
        expect(config.hdl).toHaveProperty('path');
        expect(config.programs).toHaveProperty('directory');
        expect(config.syntax).toHaveProperty('languageId');
      }
    });

    it('should return micro4 config with paths matching previously hardcoded values', () => {
      const config = getStageConfig('micro4');
      // These MUST match the hardcoded values that were in the codebase
      expect(config.wasm.emulatorJs).toBe('wasm/micro4-cpu.js');
      expect(config.wasm.assemblerJs).toBe('wasm/micro4-asm.js');
      expect(config.circuit.path).toBe('circuits/micro4-circuit.json');
      expect(config.hdl.path).toBe('hdl/04_micro4_cpu.m4hdl');
      expect(config.programs.directory).toBe('programs/');
      expect(config.syntax.languageId).toBe('micro4');
    });

    it('should return config with meta matching STAGE_METADATA for each stage', () => {
      for (const stage of LAB_STAGES) {
        const config = getStageConfig(stage);
        expect(config.meta).toEqual(STAGE_METADATA[stage]);
      }
    });
  });

  describe('isStageReady', () => {
    it('should return true for micro4', () => {
      expect(isStageReady('micro4')).toBe(true);
    });

    it('should return false for micro8', () => {
      expect(isStageReady('micro8')).toBe(false);
    });

    it('should return false for micro16', () => {
      expect(isStageReady('micro16')).toBe(false);
    });

    it('should return false for micro32', () => {
      expect(isStageReady('micro32')).toBe(false);
    });

    it('should return false for micro32p', () => {
      expect(isStageReady('micro32p')).toBe(false);
    });

    it('should return false for micro32s', () => {
      expect(isStageReady('micro32s')).toBe(false);
    });
  });

  describe('placeholder configs', () => {
    it('should have ready: false for non-micro4 stages', () => {
      const placeholderStages: LabStage[] = ['micro8', 'micro16', 'micro32', 'micro32p', 'micro32s'];
      for (const stage of placeholderStages) {
        const config = getStageConfig(stage);
        expect(config.ready).toBe(false);
      }
    });

    it('should have null WASM paths for stages without WASM assets', () => {
      // micro8 has both emulatorJs (Story 12.1) and assemblerJs (Story 12.2)
      // micro16+ have no WASM assets at all
      const fullyNullWasmStages: LabStage[] = ['micro16', 'micro32', 'micro32p', 'micro32s'];
      for (const stage of fullyNullWasmStages) {
        const config = getStageConfig(stage);
        expect(config.wasm.emulatorJs).toBeNull();
        expect(config.wasm.assemblerJs).toBeNull();
      }
    });

    it('should have micro8 emulatorJs and assemblerJs paths (Stories 12.1, 12.2)', () => {
      const config = getStageConfig('micro8');
      expect(config.wasm.emulatorJs).toBe('wasm/micro8-cpu.js');
      expect(config.wasm.assemblerJs).toBe('wasm/micro8-asm.js');
    });

    it('should have programs directory for micro8 and micro16', () => {
      expect(getStageConfig('micro8').programs.directory).toBe('programs/micro8/');
      expect(getStageConfig('micro16').programs.directory).toBe('programs/micro16/');
    });

    it('should have null programs directory for micro32/32p/32s', () => {
      expect(getStageConfig('micro32').programs.directory).toBeNull();
      expect(getStageConfig('micro32p').programs.directory).toBeNull();
      expect(getStageConfig('micro32s').programs.directory).toBeNull();
    });

    it('should have null circuit and hdl for all non-micro4 stages', () => {
      const placeholderStages: LabStage[] = ['micro8', 'micro16', 'micro32', 'micro32p', 'micro32s'];
      for (const stage of placeholderStages) {
        const config = getStageConfig(stage);
        expect(config.circuit.path).toBeNull();
        expect(config.hdl.path).toBeNull();
      }
    });

    it('should have stage-specific language IDs for micro8 and micro16 (Story 11.4)', () => {
      expect(getStageConfig('micro8').syntax.languageId).toBe('micro8');
      expect(getStageConfig('micro16').syntax.languageId).toBe('micro16');
    });

    it('should have null syntax languageId for micro32/32p/32s', () => {
      expect(getStageConfig('micro32').syntax.languageId).toBeNull();
      expect(getStageConfig('micro32p').syntax.languageId).toBeNull();
      expect(getStageConfig('micro32s').syntax.languageId).toBeNull();
    });
  });

  // Story 18.1: Stage Constraints
  describe('StageConstraints (Story 18.1)', () => {
    it('should have constraints field on every StageConfig', () => {
      for (const stage of LAB_STAGES) {
        const config = getStageConfig(stage);
        expect(config).toHaveProperty('constraints');
        expect(config.constraints).toBeDefined();
      }
    });

    it('should have correct StageConstraints shape for every stage', () => {
      for (const stage of LAB_STAGES) {
        const c = getStageConfig(stage).constraints;
        expect(c).toHaveProperty('memorySize');
        expect(c).toHaveProperty('registerCount');
        expect(c).toHaveProperty('instructionSet');
        expect(c).toHaveProperty('stackSupported');
        expect(c).toHaveProperty('defaultPc');
        expect(c).toHaveProperty('defaultSp');
        expect(c.instructionSet).toHaveProperty('opcodeCount');
        expect(c.instructionSet).toHaveProperty('categories');
        expect(Array.isArray(c.instructionSet.categories)).toBe(true);
      }
    });

    // AC #1: Micro4 has 256-byte memory limit
    it('should define Micro4 memory size as exactly 256 bytes', () => {
      const c = getStageConstraints('micro4');
      expect(c.memorySize).toBe(256);
    });

    // AC #2: Micro8 has 64KB memory limit
    it('should define Micro8 memory size as exactly 65536 bytes', () => {
      const c = getStageConstraints('micro8');
      expect(c.memorySize).toBe(65536);
    });

    it('should define Micro16 memory size as exactly 1048576 bytes (1MB)', () => {
      const c = getStageConstraints('micro16');
      expect(c.memorySize).toBe(1048576);
    });

    it('should define Micro32 memory size as 4GB (4294967296)', () => {
      const c = getStageConstraints('micro32');
      expect(c.memorySize).toBe(4294967296);
    });

    it('should define Micro32-P memory size same as Micro32', () => {
      expect(getStageConstraints('micro32p').memorySize)
        .toBe(getStageConstraints('micro32').memorySize);
    });

    it('should define Micro32-S memory size same as Micro32', () => {
      expect(getStageConstraints('micro32s').memorySize)
        .toBe(getStageConstraints('micro32').memorySize);
    });

    // AC #4: Register count limits
    it('should define Micro4 register count as 0 (accumulator-only)', () => {
      expect(getStageConstraints('micro4').registerCount).toBe(0);
    });

    it('should define Micro8 register count as 8 (R0-R7)', () => {
      expect(getStageConstraints('micro8').registerCount).toBe(8);
    });

    it('should define Micro16 register count as 12 (8 general + 4 segment)', () => {
      expect(getStageConstraints('micro16').registerCount).toBe(12);
    });

    it('should define Micro32/P/S register count as 16', () => {
      expect(getStageConstraints('micro32').registerCount).toBe(16);
      expect(getStageConstraints('micro32p').registerCount).toBe(16);
      expect(getStageConstraints('micro32s').registerCount).toBe(16);
    });

    // AC #3: Instruction set limits
    it('should have instruction set opcode count matching STAGE_METADATA.instructionCount', () => {
      for (const stage of LAB_STAGES) {
        const c = getStageConstraints(stage);
        expect(c.instructionSet.opcodeCount).toBe(STAGE_METADATA[stage].instructionCount);
      }
    });

    it('should have Micro4 with exactly 4 categories: arithmetic, logic, data-transfer, control-flow', () => {
      const cats: readonly InstructionCategory[] = getStageConstraints('micro4').instructionSet.categories;
      expect(cats).toHaveLength(4);
      expect(cats).toContain('arithmetic');
      expect(cats).toContain('logic');
      expect(cats).toContain('data-transfer');
      expect(cats).toContain('control-flow');
      expect(cats).not.toContain('stack');
      expect(cats).not.toContain('subroutine');
      expect(cats).not.toContain('interrupt');
      expect(cats).not.toContain('multiply');
    });

    it('should have Micro8 with exactly 9 categories including stack, subroutine, interrupt, io, comparison', () => {
      const cats = getStageConstraints('micro8').instructionSet.categories;
      expect(cats).toHaveLength(9);
      expect(cats).toContain('stack');
      expect(cats).toContain('subroutine');
      expect(cats).toContain('interrupt');
      expect(cats).toContain('io');
      expect(cats).toContain('comparison');
      expect(cats).not.toContain('multiply');
      expect(cats).not.toContain('segment');
    });

    it('should have Micro16 with exactly 11 categories including multiply and segment', () => {
      const cats = getStageConstraints('micro16').instructionSet.categories;
      expect(cats).toHaveLength(11);
      expect(cats).toContain('multiply');
      expect(cats).toContain('segment');
      expect(cats).not.toContain('protection');
      expect(cats).not.toContain('paging');
    });

    it('should have Micro32+ with exactly 13 categories including protection and paging', () => {
      for (const stage of ['micro32', 'micro32p', 'micro32s'] as LabStage[]) {
        const cats = getStageConstraints(stage).instructionSet.categories;
        expect(cats).toHaveLength(13);
        expect(cats).toContain('protection');
        expect(cats).toContain('paging');
      }
    });

    // Stack support
    it('should have stackSupported false for Micro4', () => {
      expect(getStageConstraints('micro4').stackSupported).toBe(false);
    });

    it('should have stackSupported true for Micro8+', () => {
      for (const stage of ['micro8', 'micro16', 'micro32', 'micro32p', 'micro32s'] as LabStage[]) {
        expect(getStageConstraints(stage).stackSupported).toBe(true);
      }
    });

    // Default PC/SP
    it('should have Micro4 defaultPc as 0', () => {
      expect(getStageConstraints('micro4').defaultPc).toBe(0);
    });

    it('should have Micro8 defaultPc as 0x0200 and defaultSp as 0xFFFF', () => {
      const c = getStageConstraints('micro8');
      expect(c.defaultPc).toBe(0x0200);
      expect(c.defaultSp).toBe(0xFFFF);
    });

    it('should have Micro16 defaultPc as 0x0100 and defaultSp as 0xFFFE', () => {
      const c = getStageConstraints('micro16');
      expect(c.defaultPc).toBe(0x0100);
      expect(c.defaultSp).toBe(0xFFFE);
    });

    it('should have Micro4 defaultSp as null (no stack)', () => {
      expect(getStageConstraints('micro4').defaultSp).toBeNull();
    });
  });

  // Story 18.1: Accessor functions
  describe('getStageConstraints (Story 18.1)', () => {
    it('should return valid StageConstraints for every LabStage', () => {
      for (const stage of LAB_STAGES) {
        const c: StageConstraints = getStageConstraints(stage);
        expect(c).toBeDefined();
        expect(typeof c.memorySize).toBe('number');
        expect(typeof c.registerCount).toBe('number');
        expect(typeof c.stackSupported).toBe('boolean');
        expect(typeof c.defaultPc).toBe('number');
      }
    });

    it('should return same constraints as getStageConfig(stage).constraints', () => {
      for (const stage of LAB_STAGES) {
        expect(getStageConstraints(stage)).toBe(getStageConfig(stage).constraints);
      }
    });
  });

  describe('getStageMemorySize (Story 18.1)', () => {
    it('should return 256 for micro4', () => {
      expect(getStageMemorySize('micro4')).toBe(256);
    });

    it('should return 65536 for micro8', () => {
      expect(getStageMemorySize('micro8')).toBe(65536);
    });

    it('should return 1048576 for micro16', () => {
      expect(getStageMemorySize('micro16')).toBe(1048576);
    });

    it('should return 4294967296 for micro32', () => {
      expect(getStageMemorySize('micro32')).toBe(4294967296);
    });

    it('should return correct memory size for every stage', () => {
      for (const stage of LAB_STAGES) {
        expect(getStageMemorySize(stage)).toBe(getStageConstraints(stage).memorySize);
      }
    });
  });

  // Story 18.2: getNextStage helper
  describe('getNextStage (Story 18.2)', () => {
    it('should return micro8 as next stage after micro4', () => {
      expect(getNextStage('micro4')).toBe('micro8');
    });

    it('should return micro16 as next stage after micro8', () => {
      expect(getNextStage('micro8')).toBe('micro16');
    });

    it('should return micro32 as next stage after micro16', () => {
      expect(getNextStage('micro16')).toBe('micro32');
    });

    it('should return micro32p as next stage after micro32', () => {
      expect(getNextStage('micro32')).toBe('micro32p');
    });

    it('should return micro32s as next stage after micro32p', () => {
      expect(getNextStage('micro32p')).toBe('micro32s');
    });

    it('should return null for last stage (micro32s)', () => {
      expect(getNextStage('micro32s')).toBeNull();
    });

    it('should follow LAB_STAGES order for all stages', () => {
      for (let i = 0; i < LAB_STAGES.length - 1; i++) {
        expect(getNextStage(LAB_STAGES[i])).toBe(LAB_STAGES[i + 1]);
      }
      expect(getNextStage(LAB_STAGES[LAB_STAGES.length - 1])).toBeNull();
    });
  });

  describe('re-exports', () => {
    it('should re-export LAB_STAGES from StageSelector', () => {
      expect(LAB_STAGES).toBeDefined();
      expect(LAB_STAGES).toHaveLength(6);
      expect(LAB_STAGES[0]).toBe('micro4');
    });

    it('should re-export STAGE_METADATA from StageSelector', () => {
      expect(STAGE_METADATA).toBeDefined();
      expect(STAGE_METADATA.micro4).toBeDefined();
      expect(STAGE_METADATA.micro4.label).toBe('Micro4');
    });
  });

  // Story 18.3: Instruction metadata registry
  describe('getStageInstructions (Story 18.3)', () => {
    it('should return exactly 16 instructions for micro4', () => {
      const instructions = getStageInstructions('micro4');
      expect(instructions.size).toBe(16);
    });

    it('should return exactly 68 instructions for micro8', () => {
      const instructions = getStageInstructions('micro8');
      expect(instructions.size).toBe(68);
    });

    it('should return exactly 99 instructions for micro16', () => {
      const instructions = getStageInstructions('micro16');
      expect(instructions.size).toBe(99);
    });

    it('should return more instructions for micro16 than micro8', () => {
      const micro8Count = getStageInstructions('micro8').size;
      const micro16Count = getStageInstructions('micro16').size;
      expect(micro16Count).toBeGreaterThan(micro8Count);
    });

    it('should return a ReadonlySet of uppercase strings', () => {
      const instructions = getStageInstructions('micro4');
      expect(instructions).toBeInstanceOf(Set);
      for (const instr of instructions) {
        expect(instr).toBe(instr.toUpperCase());
      }
    });

    it('should return same set on repeated calls (cached)', () => {
      const first = getStageInstructions('micro4');
      const second = getStageInstructions('micro4');
      expect(first).toBe(second); // Same reference = cached
    });
  });

  describe('isInstructionAvailable (Story 18.3)', () => {
    it('should return true for LDA in micro4', () => {
      expect(isInstructionAvailable('micro4', 'LDA')).toBe(true);
    });

    it('should return false for PUSH in micro4', () => {
      expect(isInstructionAvailable('micro4', 'PUSH')).toBe(false);
    });

    it('should return true for PUSH in micro8', () => {
      expect(isInstructionAvailable('micro8', 'PUSH')).toBe(true);
    });

    it('should return false for MUL in micro8', () => {
      expect(isInstructionAvailable('micro8', 'MUL')).toBe(false);
    });

    it('should return true for MUL in micro16', () => {
      expect(isInstructionAvailable('micro16', 'MUL')).toBe(true);
    });

    it('should be case-insensitive (lowercase)', () => {
      expect(isInstructionAvailable('micro4', 'lda')).toBe(true);
    });

    it('should be case-insensitive (mixed case)', () => {
      expect(isInstructionAvailable('micro8', 'Push')).toBe(true);
    });

    it('should return false for truly unknown instruction in any stage', () => {
      for (const stage of LAB_STAGES) {
        expect(isInstructionAvailable(stage, 'XYZZYSPOON')).toBe(false);
      }
    });
  });

  describe('findEarliestStageForInstruction (Story 18.3)', () => {
    it('should return micro8 for PUSH', () => {
      expect(findEarliestStageForInstruction('PUSH')).toBe('micro8');
    });

    it('should return micro16 for MUL', () => {
      expect(findEarliestStageForInstruction('MUL')).toBe('micro16');
    });

    it('should return micro4 for LDA', () => {
      expect(findEarliestStageForInstruction('LDA')).toBe('micro4');
    });

    it('should return null for truly unknown instruction', () => {
      expect(findEarliestStageForInstruction('TOTALLYINVALID')).toBeNull();
    });

    it('should be case-insensitive', () => {
      expect(findEarliestStageForInstruction('push')).toBe('micro8');
    });

    it('should handle instructions that exist in multiple stages', () => {
      // HLT exists in micro4, micro8, AND micro16 — earliest should be micro4
      expect(findEarliestStageForInstruction('HLT')).toBe('micro4');
    });

    it('should verify non-cumulative ISAs — LDA exists in micro4 but not micro8', () => {
      expect(isInstructionAvailable('micro4', 'LDA')).toBe(true);
      expect(isInstructionAvailable('micro8', 'LDA')).toBe(false);
    });

    it('should verify micro32/32p/32s share same instruction set as micro16 (placeholder)', () => {
      const micro16Set = getStageInstructions('micro16');
      const micro32Set = getStageInstructions('micro32');
      const micro32pSet = getStageInstructions('micro32p');
      const micro32sSet = getStageInstructions('micro32s');
      // Verify identical content, not just size
      for (const instr of micro16Set) {
        expect(micro32Set.has(instr)).toBe(true);
        expect(micro32pSet.has(instr)).toBe(true);
        expect(micro32sSet.has(instr)).toBe(true);
      }
      expect(micro32Set.size).toBe(micro16Set.size);
      expect(micro32pSet.size).toBe(micro16Set.size);
      expect(micro32sSet.size).toBe(micro16Set.size);
    });
  });

  // Story 18.4: Educational content
  describe('getStageEducationalContent (Story 18.4)', () => {
    it('should return non-empty memoryContext, instructionContext, journeyTeaser for micro4', () => {
      const edu: StageEducationalContent = getStageEducationalContent('micro4');
      expect(edu.memoryContext.length).toBeGreaterThan(0);
      expect(edu.instructionContext.length).toBeGreaterThan(0);
      expect(edu.journeyTeaser.length).toBeGreaterThan(0);
    });

    it('should return non-empty content for micro8', () => {
      const edu = getStageEducationalContent('micro8');
      expect(edu.memoryContext.length).toBeGreaterThan(0);
      expect(edu.instructionContext.length).toBeGreaterThan(0);
      expect(edu.journeyTeaser.length).toBeGreaterThan(0);
    });

    it('should return non-empty content for micro16', () => {
      const edu = getStageEducationalContent('micro16');
      expect(edu.memoryContext.length).toBeGreaterThan(0);
      expect(edu.instructionContext.length).toBeGreaterThan(0);
      expect(edu.journeyTeaser.length).toBeGreaterThan(0);
    });

    it('should return valid content for all stages', () => {
      for (const stage of LAB_STAGES) {
        const edu = getStageEducationalContent(stage);
        expect(edu).toBeDefined();
        expect(typeof edu.memoryContext).toBe('string');
        expect(typeof edu.instructionContext).toBe('string');
        expect(typeof edu.journeyTeaser).toBe('string');
        expect(edu.memoryContext.length).toBeGreaterThan(0);
        expect(edu.instructionContext.length).toBeGreaterThan(0);
        expect(edu.journeyTeaser.length).toBeGreaterThan(0);
      }
    });

    it('should reference Intel 4004 in micro4 memoryContext', () => {
      const edu = getStageEducationalContent('micro4');
      expect(edu.memoryContext).toContain('4004');
    });

    it('should reference Z80 or 8080 in micro8 memoryContext', () => {
      const edu = getStageEducationalContent('micro8');
      expect(edu.memoryContext).toMatch(/Z80|8080/);
    });

    it('should reference 8086 in micro16 memoryContext', () => {
      const edu = getStageEducationalContent('micro16');
      expect(edu.memoryContext).toContain('8086');
    });

    it('should have micro32s journeyTeaser acknowledge it is the most advanced stage', () => {
      const edu = getStageEducationalContent('micro32s');
      expect(edu.journeyTeaser).toContain('most advanced');
    });
  });
});
