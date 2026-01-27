// src/examples/exampleMetadata.test.ts
import { describe, it, expect } from 'vitest';
import {
  EXAMPLE_PROGRAMS,
  getProgramsByCategory,
  findProgramByFilename,
} from './exampleMetadata';
import { CATEGORY_ORDER } from './types';
import type { ExampleCategory } from './types';

describe('exampleMetadata', () => {
  describe('EXAMPLE_PROGRAMS', () => {
    it('should contain all 12 example programs', () => {
      expect(EXAMPLE_PROGRAMS).toHaveLength(12);
    });

    it('should have unique filenames', () => {
      const filenames = EXAMPLE_PROGRAMS.map((p) => p.filename);
      const uniqueFilenames = new Set(filenames);
      expect(uniqueFilenames.size).toBe(filenames.length);
    });

    it('should have all required properties for each program', () => {
      for (const program of EXAMPLE_PROGRAMS) {
        expect(program.filename).toBeTruthy();
        expect(program.name).toBeTruthy();
        expect(program.category).toBeTruthy();
        expect(program.description).toBeTruthy();
      }
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
  });

  describe('getProgramsByCategory', () => {
    it('should return a Map with all categories', () => {
      const grouped = getProgramsByCategory();
      expect(grouped.size).toBe(CATEGORY_ORDER.length);

      for (const category of CATEGORY_ORDER) {
        expect(grouped.has(category)).toBe(true);
      }
    });

    it('should group programs correctly', () => {
      const grouped = getProgramsByCategory();

      // Check arithmetic has expected programs
      const arithmetic = grouped.get('arithmetic');
      expect(arithmetic).toBeDefined();
      expect(arithmetic!.length).toBe(4); // add, multiply, divide, negative

      // Check algorithms has expected programs
      const algorithms = grouped.get('algorithms');
      expect(algorithms).toBeDefined();
      expect(algorithms!.length).toBe(5); // fibonacci, max, factorial, bubble_sort, gcd

      // Check loops
      const loops = grouped.get('loops');
      expect(loops).toBeDefined();
      expect(loops!.length).toBe(1); // countdown

      // Check bitwise
      const bitwise = grouped.get('bitwise');
      expect(bitwise).toBeDefined();
      expect(bitwise!.length).toBe(1); // bitwise_test

      // Check reference
      const reference = grouped.get('reference');
      expect(reference).toBeDefined();
      expect(reference!.length).toBe(1); // all_instructions
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
  });
});
