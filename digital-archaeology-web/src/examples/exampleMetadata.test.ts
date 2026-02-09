// src/examples/exampleMetadata.test.ts
import { describe, it, expect } from 'vitest';
import {
  EXAMPLE_PROGRAMS,
  getProgramsByCategory,
  getProgramsByStage,
  findProgramByFilename,
} from './exampleMetadata';
import { CATEGORY_ORDER, DIFFICULTY_LABELS } from './types';
import type { ExampleCategory, ExampleDifficulty } from './types';
import type { LabStage } from '../config/stageConfig';

describe('exampleMetadata', () => {
  describe('EXAMPLE_PROGRAMS', () => {
    it('should contain all 40 example programs (Story 11.6)', () => {
      expect(EXAMPLE_PROGRAMS).toHaveLength(40);
    });

    it('should have 12 Micro4 programs (Story 11.6)', () => {
      expect(EXAMPLE_PROGRAMS.filter((p) => p.stage === 'micro4')).toHaveLength(12);
    });

    it('should have 15 Micro8 programs (Story 11.6)', () => {
      expect(EXAMPLE_PROGRAMS.filter((p) => p.stage === 'micro8')).toHaveLength(15);
    });

    it('should have 13 Micro16 programs (Story 11.6)', () => {
      expect(EXAMPLE_PROGRAMS.filter((p) => p.stage === 'micro16')).toHaveLength(13);
    });

    it('should have unique filenames within each stage (Story 11.6)', () => {
      const stages: LabStage[] = ['micro4', 'micro8', 'micro16'];
      for (const stage of stages) {
        const stagePrograms = EXAMPLE_PROGRAMS.filter((p) => p.stage === stage);
        const filenames = stagePrograms.map((p) => p.filename);
        const uniqueFilenames = new Set(filenames);
        expect(uniqueFilenames.size).toBe(filenames.length);
      }
    });

    it('should have all required properties for each program', () => {
      for (const program of EXAMPLE_PROGRAMS) {
        expect(program.filename).toBeTruthy();
        expect(program.name).toBeTruthy();
        expect(program.category).toBeTruthy();
        expect(program.description).toBeTruthy();
        expect(program.concepts).toBeDefined();
        expect(Array.isArray(program.concepts)).toBe(true);
        expect(program.difficulty).toBeTruthy();
        expect(program.stage).toBeTruthy();
      }
    });

    it('should have at least one concept for each program (Story 8.3)', () => {
      for (const program of EXAMPLE_PROGRAMS) {
        expect(program.concepts.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('should only use valid difficulty levels (Story 8.3)', () => {
      const validDifficulties: ExampleDifficulty[] = ['beginner', 'intermediate', 'advanced'];
      for (const program of EXAMPLE_PROGRAMS) {
        expect(validDifficulties).toContain(program.difficulty);
        expect(DIFFICULTY_LABELS[program.difficulty]).toBeDefined();
      }
    });

    it('should have a mix of difficulty levels (Story 8.3)', () => {
      const difficulties = new Set(EXAMPLE_PROGRAMS.map((p) => p.difficulty));
      expect(difficulties.size).toBeGreaterThanOrEqual(2);
    });

    it('should only use valid categories', () => {
      const validCategories: ExampleCategory[] = [
        'arithmetic',
        'loops',
        'algorithms',
        'bitwise',
        'reference',
      ];
      for (const program of EXAMPLE_PROGRAMS) {
        expect(validCategories).toContain(program.category);
      }
    });

    it('should only use valid stages (Story 11.6)', () => {
      const validStages: LabStage[] = ['micro4', 'micro8', 'micro16'];
      for (const program of EXAMPLE_PROGRAMS) {
        expect(validStages).toContain(program.stage);
      }
    });
  });

  describe('getProgramsByStage (Story 11.6)', () => {
    it('should return 12 programs for micro4', () => {
      expect(getProgramsByStage('micro4')).toHaveLength(12);
    });

    it('should return 15 programs for micro8', () => {
      expect(getProgramsByStage('micro8')).toHaveLength(15);
    });

    it('should return 13 programs for micro16', () => {
      expect(getProgramsByStage('micro16')).toHaveLength(13);
    });

    it('should return 0 programs for micro32 (no examples yet)', () => {
      expect(getProgramsByStage('micro32')).toHaveLength(0);
    });

    it('should return 0 programs for micro32p (no examples yet)', () => {
      expect(getProgramsByStage('micro32p')).toHaveLength(0);
    });

    it('should return 0 programs for micro32s (no examples yet)', () => {
      expect(getProgramsByStage('micro32s')).toHaveLength(0);
    });

    it('should only return programs matching the requested stage', () => {
      const micro8Programs = getProgramsByStage('micro8');
      for (const program of micro8Programs) {
        expect(program.stage).toBe('micro8');
      }
    });
  });

  describe('getProgramsByCategory', () => {
    it('should return a Map with all categories when called without stage (backward compatible, Code Review M1)', () => {
      const grouped = getProgramsByCategory();
      // Without stage filter, all 5 categories have at least one program across all stages
      expect(grouped.size).toBe(CATEGORY_ORDER.length);

      for (const category of CATEGORY_ORDER) {
        expect(grouped.has(category)).toBe(true);
        expect(grouped.get(category)!.length).toBeGreaterThan(0);
      }
    });

    it('should group Micro4 programs correctly when filtered by stage (Story 11.6)', () => {
      const grouped = getProgramsByCategory('micro4');
      const micro4Programs = getProgramsByStage('micro4');

      // Verify all categories with programs are present and totals match (Code Review L2: self-validating)
      let total = 0;
      for (const programs of grouped.values()) {
        expect(programs.length).toBeGreaterThan(0);
        for (const p of programs) {
          expect(p.stage).toBe('micro4');
        }
        total += programs.length;
      }
      expect(total).toBe(micro4Programs.length);

      // Micro4 has programs in all 5 categories
      expect(grouped.size).toBe(5);
      expect(grouped.has('arithmetic')).toBe(true);
      expect(grouped.has('loops')).toBe(true);
      expect(grouped.has('algorithms')).toBe(true);
      expect(grouped.has('bitwise')).toBe(true);
      expect(grouped.has('reference')).toBe(true);
    });

    it('should group Micro8 programs correctly when filtered by stage (Story 11.6)', () => {
      const grouped = getProgramsByCategory('micro8');
      const micro8Programs = getProgramsByStage('micro8');

      // Verify totals match and all programs belong to micro8
      let total = 0;
      for (const programs of grouped.values()) {
        expect(programs.length).toBeGreaterThan(0);
        for (const p of programs) {
          expect(p.stage).toBe('micro8');
        }
        total += programs.length;
      }
      expect(total).toBe(micro8Programs.length);

      // Micro8 has no loop programs
      expect(grouped.has('loops')).toBe(false);
      expect(grouped.has('arithmetic')).toBe(true);
      expect(grouped.has('algorithms')).toBe(true);
    });

    it('should group Micro16 programs correctly when filtered by stage (Story 11.6)', () => {
      const grouped = getProgramsByCategory('micro16');
      const micro16Programs = getProgramsByStage('micro16');

      // Verify totals match and all programs belong to micro16
      let total = 0;
      for (const programs of grouped.values()) {
        expect(programs.length).toBeGreaterThan(0);
        for (const p of programs) {
          expect(p.stage).toBe('micro16');
        }
        total += programs.length;
      }
      expect(total).toBe(micro16Programs.length);

      // Micro16 has no loop or algorithm programs
      expect(grouped.has('loops')).toBe(false);
      expect(grouped.has('algorithms')).toBe(false);
      expect(grouped.has('arithmetic')).toBe(true);
    });

    it('should return empty map for stages with no programs (Story 11.6)', () => {
      const grouped = getProgramsByCategory('micro32');
      expect(grouped.size).toBe(0);
    });

    it('should return all programs when no stage is specified (backward compatible)', () => {
      const grouped = getProgramsByCategory();
      let total = 0;
      for (const programs of grouped.values()) {
        total += programs.length;
      }
      expect(total).toBe(EXAMPLE_PROGRAMS.length);
    });

    it('should include all programs when summed across categories', () => {
      const grouped = getProgramsByCategory();
      let total = 0;
      for (const programs of grouped.values()) {
        total += programs.length;
      }
      expect(total).toBe(EXAMPLE_PROGRAMS.length);
    });
  });

  describe('findProgramByFilename', () => {
    it('should find existing program by filename', () => {
      const program = findProgramByFilename('add.asm');
      expect(program).not.toBeNull();
      expect(program!.name).toBe('Add Two Numbers');
      expect(program!.category).toBe('arithmetic');
    });

    it('should return null for non-existent filename', () => {
      const program = findProgramByFilename('nonexistent.asm');
      expect(program).toBeNull();
    });

    it('should be case-sensitive', () => {
      const program = findProgramByFilename('ADD.asm');
      expect(program).toBeNull();
    });

    it('should disambiguate duplicate filenames when stage is provided (Code Review H1)', () => {
      // arithmetic.asm exists in micro4, micro8, and micro16
      const micro8Version = findProgramByFilename('arithmetic.asm', 'micro8');
      expect(micro8Version).not.toBeNull();
      expect(micro8Version!.stage).toBe('micro8');
      expect(micro8Version!.description).toContain('16-bit arithmetic');

      const micro16Version = findProgramByFilename('arithmetic.asm', 'micro16');
      expect(micro16Version).not.toBeNull();
      expect(micro16Version!.stage).toBe('micro16');
    });

    it('should return first match when stage is not provided (backward compatible)', () => {
      // Without stage, returns first match (micro8 comes before micro16 in array)
      const program = findProgramByFilename('basic_mov.asm');
      expect(program).not.toBeNull();
      expect(program!.stage).toBe('micro8');
    });

    it('should return null when filename exists in other stages but not the specified one (Code Review H2)', () => {
      // add.asm only exists in micro4
      const program = findProgramByFilename('add.asm', 'micro8');
      expect(program).toBeNull();
    });
  });
});
