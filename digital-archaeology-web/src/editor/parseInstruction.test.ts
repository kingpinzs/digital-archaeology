// src/editor/parseInstruction.test.ts
// Unit tests for parseInstruction utility (Story 6.9)

import { describe, it, expect } from 'vitest';
import { parseInstruction, findLinesWithOpcodes } from './parseInstruction';

describe('parseInstruction', () => {
  it('should parse simple instruction', () => {
    expect(parseInstruction('LDA 5')).toBe('LDA');
  });

  it('should parse labeled instruction', () => {
    expect(parseInstruction('START: LDA 5')).toBe('LDA');
  });

  it('should return null for comment-only line', () => {
    expect(parseInstruction('; comment')).toBeNull();
  });

  it('should parse instruction with comment', () => {
    expect(parseInstruction('ADD ; add value')).toBe('ADD');
  });

  it('should return null for ORG directive', () => {
    expect(parseInstruction('ORG $10')).toBeNull();
  });

  it('should return null for DB directive', () => {
    expect(parseInstruction('DB $FF')).toBeNull();
  });

  it('should return null for empty line', () => {
    expect(parseInstruction('')).toBeNull();
  });

  it('should return null for whitespace-only line', () => {
    expect(parseInstruction('   ')).toBeNull();
  });

  it('should handle lowercase opcodes', () => {
    expect(parseInstruction('lda 5')).toBe('LDA');
  });

  it('should handle mixed case opcodes', () => {
    expect(parseInstruction('Lda 5')).toBe('LDA');
  });

  it('should parse instruction with hex operand', () => {
    expect(parseInstruction('LDA $FF')).toBe('LDA');
  });

  it('should parse instruction with label operand', () => {
    expect(parseInstruction('JMP LOOP')).toBe('JMP');
  });

  it('should handle multiple colons in line', () => {
    expect(parseInstruction('LABEL: LDA 5 ; note: important')).toBe('LDA');
  });

  it('should parse JZ instruction', () => {
    expect(parseInstruction('JZ END')).toBe('JZ');
  });

  it('should parse HLT instruction', () => {
    expect(parseInstruction('HLT')).toBe('HLT');
  });

  it('should parse LDI instruction', () => {
    expect(parseInstruction('LDI $0F')).toBe('LDI');
  });

  it('should parse SUB instruction', () => {
    expect(parseInstruction('SUB TEMP')).toBe('SUB');
  });

  it('should parse STA instruction', () => {
    expect(parseInstruction('STA $20')).toBe('STA');
  });

  it('should parse AND instruction', () => {
    expect(parseInstruction('AND $FF')).toBe('AND');
  });

  it('should parse OR instruction', () => {
    expect(parseInstruction('OR $F0')).toBe('OR');
  });

  it('should parse XOR instruction', () => {
    expect(parseInstruction('XOR MASK')).toBe('XOR');
  });

  it('should parse NOT instruction', () => {
    expect(parseInstruction('NOT')).toBe('NOT');
  });

  it('should parse SHL instruction', () => {
    expect(parseInstruction('SHL')).toBe('SHL');
  });

  it('should parse SHR instruction', () => {
    expect(parseInstruction('SHR')).toBe('SHR');
  });

  it('should parse INC instruction', () => {
    expect(parseInstruction('INC')).toBe('INC');
  });

  it('should parse DEC instruction', () => {
    expect(parseInstruction('DEC')).toBe('DEC');
  });

  it('should return null for label-only line', () => {
    expect(parseInstruction('LABEL:')).toBeNull();
  });

  it('should return null for label with only whitespace after', () => {
    expect(parseInstruction('LABEL:   ')).toBeNull();
  });

  it('should return null for label with comment', () => {
    expect(parseInstruction('LABEL: ; just a label')).toBeNull();
  });

  it('should handle tabs as whitespace', () => {
    expect(parseInstruction('\tLDA\t5')).toBe('LDA');
  });

  it('should handle leading and trailing whitespace', () => {
    expect(parseInstruction('  LDA 5  ')).toBe('LDA');
  });
});

describe('findLinesWithOpcodes (Story 6.10)', () => {
  it('should find lines with single opcode', () => {
    const content = 'LDA 5\nADD 3\nSTA 6';
    expect(findLinesWithOpcodes(content, ['LDA'])).toEqual([1]);
  });

  it('should find lines with multiple opcodes', () => {
    const content = 'LDA 5\nADD 3\nSTA 6';
    expect(findLinesWithOpcodes(content, ['LDA', 'STA'])).toEqual([1, 3]);
  });

  it('should be case insensitive for opcodes in search', () => {
    const content = 'LDA 5\nADD 3';
    expect(findLinesWithOpcodes(content, ['lda'])).toEqual([1]);
  });

  it('should be case insensitive for opcodes in content', () => {
    const content = 'lda 5\nadd 3';
    expect(findLinesWithOpcodes(content, ['LDA'])).toEqual([1]);
  });

  it('should return empty array when no matches', () => {
    const content = 'LDA 5\nADD 3';
    expect(findLinesWithOpcodes(content, ['JMP'])).toEqual([]);
  });

  it('should return empty array for empty content', () => {
    expect(findLinesWithOpcodes('', ['LDA'])).toEqual([]);
  });

  it('should return empty array for empty opcodes list', () => {
    expect(findLinesWithOpcodes('LDA 5', [])).toEqual([]);
  });

  it('should ignore comments when finding instructions', () => {
    const content = '; LDA 5\nADD 3';
    expect(findLinesWithOpcodes(content, ['LDA'])).toEqual([]);
  });

  it('should find instruction after label', () => {
    const content = 'START: LDA 5\nADD 3';
    expect(findLinesWithOpcodes(content, ['LDA'])).toEqual([1]);
  });

  it('should skip label-only lines', () => {
    const content = 'LOOP:\nLDA 5';
    expect(findLinesWithOpcodes(content, ['LDA'])).toEqual([2]);
  });

  it('should skip directive lines', () => {
    const content = 'ORG $10\nLDA 5';
    expect(findLinesWithOpcodes(content, ['LDA'])).toEqual([2]);
  });

  it('should find multiple occurrences of same opcode', () => {
    const content = 'LDA 5\nADD 3\nLDA 6';
    expect(findLinesWithOpcodes(content, ['LDA'])).toEqual([1, 3]);
  });

  it('should handle mixed line types', () => {
    const content = '; Header\nORG $10\nSTART:\nLDA 5\nADD 3\n; End\nHLT';
    expect(findLinesWithOpcodes(content, ['LDA', 'HLT'])).toEqual([4, 7]);
  });

  it('should handle Windows line endings', () => {
    const content = 'LDA 5\r\nADD 3\r\nSTA 6';
    // Note: split('\n') leaves \r attached, but parseInstruction trims it
    expect(findLinesWithOpcodes(content, ['LDA', 'STA'])).toEqual([1, 3]);
  });

  it('should return correct 1-based line numbers', () => {
    const content = '\n\nLDA 5';
    expect(findLinesWithOpcodes(content, ['LDA'])).toEqual([3]);
  });
});
