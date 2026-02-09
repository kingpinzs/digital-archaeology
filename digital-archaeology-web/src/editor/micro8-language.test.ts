import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Monaco languages API using vi.hoisted for proper hoisting
const mockMonaco = vi.hoisted(() => ({
  languages: {
    register: vi.fn(),
    setLanguageConfiguration: vi.fn(),
    setMonarchTokensProvider: vi.fn(),
  },
}));

vi.mock('monaco-editor', () => mockMonaco);

import {
  registerMicro8Language,
  resetLanguageRegistration,
  micro8LanguageId,
  micro8LanguageConfiguration,
  micro8MonarchLanguage,
} from './micro8-language';

describe('micro8-language', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetLanguageRegistration();
  });

  describe('micro8LanguageId', () => {
    it('should be "micro8"', () => {
      expect(micro8LanguageId).toBe('micro8');
    });
  });

  describe('micro8LanguageConfiguration', () => {
    it('should define semicolon as line comment', () => {
      expect(micro8LanguageConfiguration.comments?.lineComment).toBe(';');
    });

    it('should have empty brackets array', () => {
      expect(micro8LanguageConfiguration.brackets).toEqual([]);
    });
  });

  describe('micro8MonarchLanguage', () => {
    it('should be case-insensitive', () => {
      expect(micro8MonarchLanguage.ignoreCase).toBe(true);
    });

    it('should define control keywords', () => {
      expect(micro8MonarchLanguage.controlKeywords).toContain('HLT');
      expect(micro8MonarchLanguage.controlKeywords).toContain('NOP');
      expect(micro8MonarchLanguage.controlKeywords).toContain('EI');
      expect(micro8MonarchLanguage.controlKeywords).toContain('DI');
    });

    it('should define jump keywords', () => {
      expect(micro8MonarchLanguage.jumpKeywords).toContain('JMP');
      expect(micro8MonarchLanguage.jumpKeywords).toContain('JZ');
      expect(micro8MonarchLanguage.jumpKeywords).toContain('JNZ');
      expect(micro8MonarchLanguage.jumpKeywords).toContain('JC');
      expect(micro8MonarchLanguage.jumpKeywords).toContain('JNC');
      expect(micro8MonarchLanguage.jumpKeywords).toContain('JR');
      expect(micro8MonarchLanguage.jumpKeywords).toContain('JP');
    });

    it('should have CALL in stackKeywords not jumpKeywords', () => {
      // CALL is a stack/subroutine operation, not a jump
      expect(micro8MonarchLanguage.jumpKeywords).not.toContain('CALL');
      expect(micro8MonarchLanguage.stackKeywords).toContain('CALL');
    });

    it('should define memory operation keywords', () => {
      expect(micro8MonarchLanguage.memoryKeywords).toContain('LDI');
      expect(micro8MonarchLanguage.memoryKeywords).toContain('LD');
      expect(micro8MonarchLanguage.memoryKeywords).toContain('ST');
      expect(micro8MonarchLanguage.memoryKeywords).toContain('MOV');
      expect(micro8MonarchLanguage.memoryKeywords).toContain('LDZ');
      expect(micro8MonarchLanguage.memoryKeywords).toContain('STZ');
      expect(micro8MonarchLanguage.memoryKeywords).toContain('LDI16');
      expect(micro8MonarchLanguage.memoryKeywords).toContain('MOV16');
    });

    it('should define arithmetic keywords', () => {
      expect(micro8MonarchLanguage.arithmeticKeywords).toContain('ADD');
      expect(micro8MonarchLanguage.arithmeticKeywords).toContain('SUB');
      expect(micro8MonarchLanguage.arithmeticKeywords).toContain('ADC');
      expect(micro8MonarchLanguage.arithmeticKeywords).toContain('SBC');
      expect(micro8MonarchLanguage.arithmeticKeywords).toContain('INC');
      expect(micro8MonarchLanguage.arithmeticKeywords).toContain('DEC');
      expect(micro8MonarchLanguage.arithmeticKeywords).toContain('CMP');
      expect(micro8MonarchLanguage.arithmeticKeywords).toContain('NEG');
    });

    it('should define logic keywords', () => {
      expect(micro8MonarchLanguage.logicKeywords).toContain('AND');
      expect(micro8MonarchLanguage.logicKeywords).toContain('OR');
      expect(micro8MonarchLanguage.logicKeywords).toContain('XOR');
      expect(micro8MonarchLanguage.logicKeywords).toContain('NOT');
      expect(micro8MonarchLanguage.logicKeywords).toContain('SHL');
      expect(micro8MonarchLanguage.logicKeywords).toContain('SHR');
      expect(micro8MonarchLanguage.logicKeywords).toContain('SWAP');
    });

    it('should define stack keywords', () => {
      expect(micro8MonarchLanguage.stackKeywords).toContain('PUSH');
      expect(micro8MonarchLanguage.stackKeywords).toContain('POP');
      expect(micro8MonarchLanguage.stackKeywords).toContain('CALL');
      expect(micro8MonarchLanguage.stackKeywords).toContain('RET');
      expect(micro8MonarchLanguage.stackKeywords).toContain('RETI');
      expect(micro8MonarchLanguage.stackKeywords).toContain('PUSHF');
      expect(micro8MonarchLanguage.stackKeywords).toContain('POPF');
    });

    it('should define I/O keywords', () => {
      expect(micro8MonarchLanguage.ioKeywords).toContain('IN');
      expect(micro8MonarchLanguage.ioKeywords).toContain('OUT');
    });

    it('should define flag keywords', () => {
      expect(micro8MonarchLanguage.flagKeywords).toContain('SCF');
      expect(micro8MonarchLanguage.flagKeywords).toContain('CCF');
      expect(micro8MonarchLanguage.flagKeywords).toContain('CMF');
    });

    it('should define directives', () => {
      expect(micro8MonarchLanguage.directives).toContain('ORG');
      expect(micro8MonarchLanguage.directives).toContain('DB');
      expect(micro8MonarchLanguage.directives).toContain('DW');
      expect(micro8MonarchLanguage.directives).toContain('DS');
      expect(micro8MonarchLanguage.directives).toContain('EQU');
    });

    it('should define registers', () => {
      // Numbered registers
      expect(micro8MonarchLanguage.registers).toContain('R0');
      expect(micro8MonarchLanguage.registers).toContain('R7');
      // Named aliases
      expect(micro8MonarchLanguage.registers).toContain('A');
      expect(micro8MonarchLanguage.registers).toContain('B');
      expect(micro8MonarchLanguage.registers).toContain('H');
      expect(micro8MonarchLanguage.registers).toContain('L');
      // Stack pointer and register pairs
      expect(micro8MonarchLanguage.registers).toContain('SP');
      expect(micro8MonarchLanguage.registers).toContain('HL');
      expect(micro8MonarchLanguage.registers).toContain('BC');
      expect(micro8MonarchLanguage.registers).toContain('DE');
    });

    it('should have tokenizer with root state', () => {
      expect(micro8MonarchLanguage.tokenizer).toBeDefined();
      expect(micro8MonarchLanguage.tokenizer.root).toBeDefined();
      expect(Array.isArray(micro8MonarchLanguage.tokenizer.root)).toBe(true);
    });
  });

  describe('registerMicro8Language', () => {
    it('should register language with Monaco', () => {
      registerMicro8Language();

      expect(mockMonaco.languages.register).toHaveBeenCalledWith({
        id: micro8LanguageId,
      });
    });

    it('should register language configuration', () => {
      registerMicro8Language();

      expect(mockMonaco.languages.setLanguageConfiguration).toHaveBeenCalledWith(
        micro8LanguageId,
        micro8LanguageConfiguration
      );
    });

    it('should register monarch tokenizer', () => {
      registerMicro8Language();

      expect(mockMonaco.languages.setMonarchTokensProvider).toHaveBeenCalledWith(
        micro8LanguageId,
        micro8MonarchLanguage
      );
    });

    it('should only register once globally', () => {
      registerMicro8Language();
      registerMicro8Language();
      registerMicro8Language();

      expect(mockMonaco.languages.register).toHaveBeenCalledTimes(1);
      expect(mockMonaco.languages.setLanguageConfiguration).toHaveBeenCalledTimes(1);
      expect(mockMonaco.languages.setMonarchTokensProvider).toHaveBeenCalledTimes(1);
    });
  });

  describe('resetLanguageRegistration', () => {
    it('should allow re-registration after reset', () => {
      registerMicro8Language();
      expect(mockMonaco.languages.register).toHaveBeenCalledTimes(1);

      resetLanguageRegistration();
      registerMicro8Language();

      expect(mockMonaco.languages.register).toHaveBeenCalledTimes(2);
    });
  });

  describe('tokenizer rules', () => {
    type TokenizerRule = [RegExp | string, string | { cases: Record<string, string> }];
    const getRules = (): TokenizerRule[] =>
      micro8MonarchLanguage.tokenizer.root as TokenizerRule[];

    const findRuleByPatternSource = (patternSource: string): TokenizerRule | undefined => {
      return getRules().find(
        (rule) => rule[0] instanceof RegExp && rule[0].source === patternSource
      );
    };

    it('should have comment rule matching semicolon to end of line', () => {
      const rule = findRuleByPatternSource(';.*$');
      expect(rule).toBeDefined();
      expect(rule![1]).toBe('comment');
    });

    it('should have label rule matching identifier followed by colon', () => {
      const rule = findRuleByPatternSource('[a-zA-Z_][a-zA-Z0-9_]*:');
      expect(rule).toBeDefined();
      expect(rule![1]).toBe('label');
    });

    it('should have hex number rule', () => {
      const rule = findRuleByPatternSource('0[xX][0-9a-fA-F]+');
      expect(rule).toBeDefined();
      expect(rule![1]).toBe('number.hex');
    });

    it('should have binary number rule', () => {
      const rule = findRuleByPatternSource('0[bB][01]+');
      expect(rule).toBeDefined();
      expect(rule![1]).toBe('number.binary');
    });

    it('should have decimal number rule', () => {
      const rule = findRuleByPatternSource('\\d+');
      expect(rule).toBeDefined();
      expect(rule![1]).toBe('number');
    });

    it('should have hash prefix rule for immediates', () => {
      const rule = findRuleByPatternSource('#');
      expect(rule).toBeDefined();
      expect(rule![1]).toBe('operator');
    });

    it('should have identifier/keyword rule with all cases', () => {
      const rule = findRuleByPatternSource('[a-zA-Z_]\\w*');
      expect(rule).toBeDefined();
      expect(typeof rule![1]).toBe('object');
      const cases = (rule![1] as { cases: Record<string, string> }).cases;
      expect(cases['@controlKeywords']).toBe('keyword.control');
      expect(cases['@jumpKeywords']).toBe('keyword.jump');
      expect(cases['@memoryKeywords']).toBe('keyword');
      expect(cases['@arithmeticKeywords']).toBe('keyword.arithmetic');
      expect(cases['@logicKeywords']).toBe('keyword.logic');
      expect(cases['@stackKeywords']).toBe('keyword.stack');
      expect(cases['@ioKeywords']).toBe('keyword.io');
      expect(cases['@flagKeywords']).toBe('keyword.flag');
      expect(cases['@directives']).toBe('directive');
      expect(cases['@registers']).toBe('register');
      expect(cases['@default']).toBe('identifier');
    });
  });

  describe('syntax highlighting on sample code', () => {
    const getMatchingRule = (
      text: string
    ): { pattern: RegExp; token: string | { cases: Record<string, string> } } | null => {
      type TokenizerRule = [RegExp | string, string | { cases: Record<string, string> }];
      const rules = micro8MonarchLanguage.tokenizer.root as TokenizerRule[];

      for (const rule of rules) {
        if (rule[0] instanceof RegExp) {
          const flags = micro8MonarchLanguage.ignoreCase ? 'i' : '';
          const pattern = new RegExp(`^${rule[0].source}`, flags);
          if (pattern.test(text)) {
            return { pattern: rule[0], token: rule[1] };
          }
        }
      }
      return null;
    };

    it('should match comments starting with semicolon', () => {
      const result = getMatchingRule('; Micro8 program');
      expect(result).not.toBeNull();
      expect(result!.token).toBe('comment');
    });

    it('should match labels ending with colon', () => {
      const result = getMatchingRule('LOOP:');
      expect(result).not.toBeNull();
      expect(result!.token).toBe('label');
    });

    it('should match hex numbers', () => {
      const result = getMatchingRule('0xFF00');
      expect(result).not.toBeNull();
      expect(result!.token).toBe('number.hex');
    });

    it('should match binary numbers', () => {
      const result = getMatchingRule('0b10101010');
      expect(result).not.toBeNull();
      expect(result!.token).toBe('number.binary');
    });

    it('should match decimal numbers', () => {
      const result = getMatchingRule('255');
      expect(result).not.toBeNull();
      expect(result!.token).toBe('number');
    });

    it('should match hash prefix for immediates', () => {
      const result = getMatchingRule('#');
      expect(result).not.toBeNull();
      expect(result!.token).toBe('operator');
    });

    it('should match control keywords (HLT)', () => {
      const result = getMatchingRule('HLT');
      expect(result).not.toBeNull();
      expect(micro8MonarchLanguage.controlKeywords).toContain('HLT');
    });

    it('should match jump keywords (JMP)', () => {
      const result = getMatchingRule('JMP');
      expect(result).not.toBeNull();
      expect(micro8MonarchLanguage.jumpKeywords).toContain('JMP');
    });

    it('should match memory keywords (MOV)', () => {
      const result = getMatchingRule('MOV');
      expect(result).not.toBeNull();
      expect(micro8MonarchLanguage.memoryKeywords).toContain('MOV');
    });

    it('should match arithmetic keywords (ADD)', () => {
      const result = getMatchingRule('ADD');
      expect(result).not.toBeNull();
      expect(micro8MonarchLanguage.arithmeticKeywords).toContain('ADD');
    });

    it('should match logic keywords (XOR)', () => {
      const result = getMatchingRule('XOR');
      expect(result).not.toBeNull();
      expect(micro8MonarchLanguage.logicKeywords).toContain('XOR');
    });

    it('should match stack keywords (PUSH)', () => {
      const result = getMatchingRule('PUSH');
      expect(result).not.toBeNull();
      expect(micro8MonarchLanguage.stackKeywords).toContain('PUSH');
    });

    it('should match I/O keywords (OUT)', () => {
      const result = getMatchingRule('OUT');
      expect(result).not.toBeNull();
      expect(micro8MonarchLanguage.ioKeywords).toContain('OUT');
    });

    it('should match flag keywords (SCF)', () => {
      const result = getMatchingRule('SCF');
      expect(result).not.toBeNull();
      expect(micro8MonarchLanguage.flagKeywords).toContain('SCF');
    });

    it('should match directives (EQU)', () => {
      const result = getMatchingRule('EQU');
      expect(result).not.toBeNull();
      expect(micro8MonarchLanguage.directives).toContain('EQU');
    });

    it('should match registers (R0)', () => {
      const result = getMatchingRule('R0');
      expect(result).not.toBeNull();
      expect(micro8MonarchLanguage.registers).toContain('R0');
    });

    it('should match register pair (HL)', () => {
      const result = getMatchingRule('HL');
      expect(result).not.toBeNull();
      expect(micro8MonarchLanguage.registers).toContain('HL');
    });

    it('should match label references as identifiers', () => {
      const result = getMatchingRule('MY_LABEL');
      expect(result).not.toBeNull();
      // MY_LABEL is not in any keyword or register array
      expect(micro8MonarchLanguage.controlKeywords).not.toContain('MY_LABEL');
      expect(micro8MonarchLanguage.registers).not.toContain('MY_LABEL');
    });
  });

  describe('case-insensitivity', () => {
    it('should have ignoreCase flag set to true', () => {
      expect(micro8MonarchLanguage.ignoreCase).toBe(true);
    });

    it('should match MOV regardless of case', () => {
      const patterns = ['MOV', 'mov', 'Mov', 'mOv'];
      const identifierPattern = /^[a-zA-Z_]\w*/i;

      for (const pattern of patterns) {
        expect(identifierPattern.test(pattern)).toBe(true);
      }
      expect(micro8MonarchLanguage.memoryKeywords).toContain('MOV');
    });

    it('should match PUSH regardless of case', () => {
      const patterns = ['PUSH', 'push', 'Push'];
      const identifierPattern = /^[a-zA-Z_]\w*/i;

      for (const pattern of patterns) {
        expect(identifierPattern.test(pattern)).toBe(true);
      }
      expect(micro8MonarchLanguage.stackKeywords).toContain('PUSH');
    });
  });

  describe('multi-line program tokenization (CR M-3)', () => {
    // Helper: tokenize a line using the root tokenizer rules
    const tokenizeLine = (
      line: string
    ): Array<{ text: string; token: string | 'cases' }> => {
      type TokenizerRule = [RegExp | string, string | { cases: Record<string, string> }];
      const rules = micro8MonarchLanguage.tokenizer.root as TokenizerRule[];
      const tokens: Array<{ text: string; token: string | 'cases' }> = [];
      let remaining = line;

      while (remaining.length > 0) {
        let matched = false;
        for (const rule of rules) {
          if (rule[0] instanceof RegExp) {
            const flags = micro8MonarchLanguage.ignoreCase ? 'i' : '';
            const pattern = new RegExp(`^${rule[0].source}`, flags);
            const match = remaining.match(pattern);
            if (match) {
              const tokenType = typeof rule[1] === 'string' ? rule[1] : 'cases';
              tokens.push({ text: match[0], token: tokenType });
              remaining = remaining.slice(match[0].length);
              matched = true;
              break;
            }
          }
        }
        if (!matched) {
          remaining = remaining.slice(1);
        }
      }
      return tokens;
    };

    it('should tokenize a complete assembly instruction line', () => {
      const tokens = tokenizeLine('  LD A, [HL]');
      const tokenTypes = tokens.map(t => t.token);
      expect(tokenTypes).toContain('white');     // leading whitespace
      expect(tokenTypes).toContain('cases');     // LD keyword
      expect(tokenTypes).toContain('delimiter'); // comma
    });

    it('should tokenize label + instruction line', () => {
      const tokens = tokenizeLine('LOOP: DEC A');
      expect(tokens[0].token).toBe('label');
      expect(tokens[0].text).toBe('LOOP:');
    });

    it('should tokenize comment-only line', () => {
      const tokens = tokenizeLine('; Fibonacci generator');
      expect(tokens[0].token).toBe('comment');
      expect(tokens[0].text).toContain('Fibonacci');
    });

    it('should tokenize immediate value with hash prefix', () => {
      const tokens = tokenizeLine('LDI A, #0xFF');
      const hashToken = tokens.find(t => t.text === '#');
      expect(hashToken).toBeDefined();
      expect(hashToken!.token).toBe('operator');
      const hexToken = tokens.find(t => t.text === '0xFF');
      expect(hexToken).toBeDefined();
      expect(hexToken!.token).toBe('number.hex');
    });

    it('should tokenize 16-bit instructions', () => {
      const tokens = tokenizeLine('LDI16 HL, #0x8000');
      // LDI16 should match identifier/cases rule (it's in memoryKeywords)
      expect(micro8MonarchLanguage.memoryKeywords).toContain('LDI16');
      const ldi16Token = tokens.find(t => t.text === 'LDI16');
      expect(ldi16Token).toBeDefined();
    });
  });
});
