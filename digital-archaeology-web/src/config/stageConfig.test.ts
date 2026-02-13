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
      // micro8 has emulatorJs (Story 12.1) but no assemblerJs yet
      // micro16+ have no WASM assets at all
      const fullyNullWasmStages: LabStage[] = ['micro16', 'micro32', 'micro32p', 'micro32s'];
      for (const stage of fullyNullWasmStages) {
        const config = getStageConfig(stage);
        expect(config.wasm.emulatorJs).toBeNull();
        expect(config.wasm.assemblerJs).toBeNull();
      }
    });

    it('should have micro8 emulatorJs path but null assemblerJs (Story 12.1)', () => {
      const config = getStageConfig('micro8');
      expect(config.wasm.emulatorJs).toBe('wasm/micro8-cpu.js');
      expect(config.wasm.assemblerJs).toBeNull();
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
});
