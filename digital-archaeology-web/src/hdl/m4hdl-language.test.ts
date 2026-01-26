// src/hdl/m4hdl-language.test.ts
// Tests for M4HDL language definition
// Story 7.2: Implement HDL Syntax Highlighting

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as monaco from 'monaco-editor';
import {
  m4hdlLanguageId,
  m4hdlLanguageConfiguration,
  m4hdlMonarchLanguage,
  registerM4hdlLanguage,
  resetM4hdlLanguageRegistration,
} from './m4hdl-language';

// Mock monaco-editor
vi.mock('monaco-editor', () => ({
  languages: {
    register: vi.fn(),
    setLanguageConfiguration: vi.fn(),
    setMonarchTokensProvider: vi.fn(),
  },
}));

describe('m4hdl-language', () => {
  beforeEach(() => {
    resetM4hdlLanguageRegistration();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('m4hdlLanguageId', () => {
    it('should be defined as "m4hdl"', () => {
      expect(m4hdlLanguageId).toBe('m4hdl');
    });
  });

  describe('m4hdlLanguageConfiguration', () => {
    it('should define # as line comment', () => {
      expect(m4hdlLanguageConfiguration.comments?.lineComment).toBe('#');
    });

    it('should define brackets for parentheses and square brackets', () => {
      expect(m4hdlLanguageConfiguration.brackets).toContainEqual(['(', ')']);
      expect(m4hdlLanguageConfiguration.brackets).toContainEqual(['[', ']']);
    });

    it('should define auto-closing pairs', () => {
      expect(m4hdlLanguageConfiguration.autoClosingPairs).toContainEqual({
        open: '(',
        close: ')',
      });
      expect(m4hdlLanguageConfiguration.autoClosingPairs).toContainEqual({
        open: '[',
        close: ']',
      });
    });
  });

  describe('m4hdlMonarchLanguage', () => {
    it('should be case insensitive', () => {
      expect(m4hdlMonarchLanguage.ignoreCase).toBe(true);
    });

    it('should define keywords array with wire', () => {
      expect(m4hdlMonarchLanguage.keywords).toContain('wire');
    });

    it('should define gateTypes array with all gate types', () => {
      const gateTypes = m4hdlMonarchLanguage.gateTypes as string[];
      expect(gateTypes).toContain('and');
      expect(gateTypes).toContain('or');
      expect(gateTypes).toContain('xor');
      expect(gateTypes).toContain('not');
      expect(gateTypes).toContain('buf');
      expect(gateTypes).toContain('nand');
      expect(gateTypes).toContain('nor');
      expect(gateTypes).toContain('mux');
    });

    it('should define portLabels array with input and output', () => {
      const portLabels = m4hdlMonarchLanguage.portLabels as string[];
      expect(portLabels).toContain('input');
      expect(portLabels).toContain('output');
    });

    it('should document that portLabels is for reference only (regex is hardcoded)', () => {
      // The portLabels array is NOT used by the tokenizer - the regex is hardcoded.
      // This test documents this design decision. If portLabels should be dynamic,
      // the tokenizer regex would need to be updated to use @portLabels reference.
      const portLabels = m4hdlMonarchLanguage.portLabels as string[];
      const tokenizer = m4hdlMonarchLanguage.tokenizer;
      const portLabelRule = tokenizer.root.find(
        (rule) =>
          Array.isArray(rule) &&
          rule[1] === 'directive' &&
          rule[0] instanceof RegExp &&
          rule[0].source.includes('input|output')
      );
      // Verify regex is hardcoded, not using @portLabels
      expect(portLabelRule).toBeDefined();
      const regex = (portLabelRule as any)?.[0] as RegExp;
      expect(regex.source).toBe('\\b(input|output):');
      // portLabels array exists for documentation purposes
      expect(portLabels.length).toBe(2);
    });

    it('should define directives for future module support', () => {
      const directives = m4hdlMonarchLanguage.directives as string[];
      expect(directives).toContain('module');
      expect(directives).toContain('chip');
    });

    describe('tokenizer', () => {
      const tokenizer = m4hdlMonarchLanguage.tokenizer;

      it('should have root state', () => {
        expect(tokenizer.root).toBeDefined();
        expect(Array.isArray(tokenizer.root)).toBe(true);
      });

      it('should define comment token rule for # comments', () => {
        const commentRule = tokenizer.root.find(
          (rule) => Array.isArray(rule) && rule[1] === 'comment'
        );
        expect(commentRule).toBeDefined();
        // Verify the regex pattern exists for # comments
        const regex = (commentRule as any)?.[0] as RegExp;
        expect(regex).toBeInstanceOf(RegExp);
        expect(regex.source).toContain('#');
        // The tokenizer handles whitespace separately, so # comments work inline
        expect(regex.test('# this is a comment')).toBe(true);
      });

      it('should define bit-width token rule for [N:M] syntax', () => {
        const bitWidthRule = tokenizer.root.find(
          (rule) =>
            Array.isArray(rule) &&
            rule[1] === 'number' &&
            rule[0] instanceof RegExp &&
            rule[0].source.includes(':')
        );
        expect(bitWidthRule).toBeDefined();
        const regex = (bitWidthRule as any)?.[0] as RegExp;
        expect(regex.test('[7:0]')).toBe(true);
        expect(regex.test('[3:0]')).toBe(true);
        expect(regex.test('[15:8]')).toBe(true);
      });

      it('should define single bit index token rule for [N] syntax', () => {
        const bitIndexRule = tokenizer.root.find(
          (rule) =>
            Array.isArray(rule) &&
            rule[1] === 'number' &&
            rule[0] instanceof RegExp &&
            rule[0].source === '\\[\\d+\\]'
        );
        expect(bitIndexRule).toBeDefined();
        const regex = (bitIndexRule as any)?.[0] as RegExp;
        expect(regex.test('[0]')).toBe(true);
        expect(regex.test('[7]')).toBe(true);
      });

      it('should define hex number token rule', () => {
        const hexRule = tokenizer.root.find(
          (rule) =>
            Array.isArray(rule) &&
            rule[1] === 'number.hex' &&
            rule[0] instanceof RegExp
        );
        expect(hexRule).toBeDefined();
        const regex = (hexRule as any)?.[0] as RegExp;
        expect(regex.test('0xFF')).toBe(true);
        expect(regex.test('0x00')).toBe(true);
        expect(regex.test('0xABCD')).toBe(true);
      });

      it('should define decimal number token rule', () => {
        const decimalRule = tokenizer.root.find(
          (rule) =>
            Array.isArray(rule) &&
            rule[1] === 'number' &&
            rule[0] instanceof RegExp &&
            rule[0].source === '\\d+'
        );
        expect(decimalRule).toBeDefined();
        const regex = (decimalRule as any)?.[0] as RegExp;
        expect(regex.test('123')).toBe(true);
        expect(regex.test('0')).toBe(true);
      });

      it('should define port label token rule for input:/output:', () => {
        const portLabelRule = tokenizer.root.find(
          (rule) =>
            Array.isArray(rule) &&
            rule[1] === 'directive' &&
            rule[0] instanceof RegExp &&
            rule[0].source.includes('input|output')
        );
        expect(portLabelRule).toBeDefined();
        const regex = (portLabelRule as any)?.[0] as RegExp;
        expect(regex.test('input:')).toBe(true);
        expect(regex.test('output:')).toBe(true);
      });

      it('should define identifier token rule with keyword cases', () => {
        const identifierRule = tokenizer.root.find(
          (rule) =>
            Array.isArray(rule) &&
            rule[0] instanceof RegExp &&
            rule[0].source.includes('[a-zA-Z_]') &&
            typeof rule[1] === 'object' &&
            'cases' in rule[1]
        );
        expect(identifierRule).toBeDefined();
        const cases = ((identifierRule as any)?.[1] as { cases: Record<string, string> }).cases;
        expect(cases['@keywords']).toBe('keyword');
        expect(cases['@gateTypes']).toBe('keyword.control');
        expect(cases['@directives']).toBe('directive');
        expect(cases['@default']).toBe('identifier');
      });

      it('should define delimiter token rule', () => {
        const delimiterRule = tokenizer.root.find(
          (rule) => Array.isArray(rule) && rule[1] === 'delimiter'
        );
        expect(delimiterRule).toBeDefined();
        const regex = (delimiterRule as any)?.[0] as RegExp;
        expect(regex.test(';')).toBe(true);
        expect(regex.test(',')).toBe(true);
        expect(regex.test('(')).toBe(true);
        expect(regex.test(')')).toBe(true);
      });
    });
  });

  describe('registerM4hdlLanguage', () => {
    it('should register language with Monaco', () => {
      registerM4hdlLanguage();

      expect(monaco.languages.register).toHaveBeenCalledWith({ id: 'm4hdl' });
    });

    it('should set language configuration', () => {
      registerM4hdlLanguage();

      expect(monaco.languages.setLanguageConfiguration).toHaveBeenCalledWith(
        'm4hdl',
        m4hdlLanguageConfiguration
      );
    });

    it('should set Monarch tokens provider', () => {
      registerM4hdlLanguage();

      expect(monaco.languages.setMonarchTokensProvider).toHaveBeenCalledWith(
        'm4hdl',
        m4hdlMonarchLanguage
      );
    });

    it('should only register once (idempotent)', () => {
      registerM4hdlLanguage();
      registerM4hdlLanguage();
      registerM4hdlLanguage();

      expect(monaco.languages.register).toHaveBeenCalledTimes(1);
      expect(monaco.languages.setLanguageConfiguration).toHaveBeenCalledTimes(1);
      expect(monaco.languages.setMonarchTokensProvider).toHaveBeenCalledTimes(1);
    });
  });

  describe('resetM4hdlLanguageRegistration', () => {
    it('should allow re-registration after reset', () => {
      registerM4hdlLanguage();
      expect(monaco.languages.register).toHaveBeenCalledTimes(1);

      resetM4hdlLanguageRegistration();
      registerM4hdlLanguage();

      expect(monaco.languages.register).toHaveBeenCalledTimes(2);
    });
  });
});
