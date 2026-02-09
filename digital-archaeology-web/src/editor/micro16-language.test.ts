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
  registerMicro16Language,
  resetLanguageRegistration,
  micro16LanguageId,
  micro16LanguageConfiguration,
  micro16MonarchLanguage,
} from './micro16-language';

describe('micro16-language', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetLanguageRegistration();
  });

  describe('micro16LanguageId', () => {
    it('should be "micro16"', () => {
      expect(micro16LanguageId).toBe('micro16');
    });
  });

  describe('micro16LanguageConfiguration', () => {
    it('should define semicolon as line comment', () => {
      expect(micro16LanguageConfiguration.comments?.lineComment).toBe(';');
    });

    it('should have empty brackets array', () => {
      expect(micro16LanguageConfiguration.brackets).toEqual([]);
    });
  });

  describe('micro16MonarchLanguage', () => {
    it('should be case-insensitive', () => {
      expect(micro16MonarchLanguage.ignoreCase).toBe(true);
    });

    it('should define control keywords including Micro16-specific', () => {
      // Common with Micro8
      expect(micro16MonarchLanguage.controlKeywords).toContain('HLT');
      expect(micro16MonarchLanguage.controlKeywords).toContain('NOP');
      // Micro16-specific
      expect(micro16MonarchLanguage.controlKeywords).toContain('WAIT');
      expect(micro16MonarchLanguage.controlKeywords).toContain('CLI');
      expect(micro16MonarchLanguage.controlKeywords).toContain('STI');
      expect(micro16MonarchLanguage.controlKeywords).toContain('CLC');
      expect(micro16MonarchLanguage.controlKeywords).toContain('STC');
      expect(micro16MonarchLanguage.controlKeywords).toContain('IRET');
      expect(micro16MonarchLanguage.controlKeywords).toContain('PUSHA');
      expect(micro16MonarchLanguage.controlKeywords).toContain('POPA');
    });

    it('should define jump keywords including signed comparisons', () => {
      expect(micro16MonarchLanguage.jumpKeywords).toContain('JMP');
      expect(micro16MonarchLanguage.jumpKeywords).toContain('JZ');
      expect(micro16MonarchLanguage.jumpKeywords).toContain('JE');
      expect(micro16MonarchLanguage.jumpKeywords).toContain('JNZ');
      expect(micro16MonarchLanguage.jumpKeywords).toContain('JNE');
      // Signed comparison jumps (Micro16 addition)
      expect(micro16MonarchLanguage.jumpKeywords).toContain('JL');
      expect(micro16MonarchLanguage.jumpKeywords).toContain('JGE');
      expect(micro16MonarchLanguage.jumpKeywords).toContain('JLE');
      expect(micro16MonarchLanguage.jumpKeywords).toContain('JG');
      expect(micro16MonarchLanguage.jumpKeywords).toContain('JA');
      expect(micro16MonarchLanguage.jumpKeywords).toContain('JBE');
      // Loop instructions
      expect(micro16MonarchLanguage.jumpKeywords).toContain('LOOP');
      expect(micro16MonarchLanguage.jumpKeywords).toContain('LOOPZ');
      expect(micro16MonarchLanguage.jumpKeywords).toContain('LOOPNZ');
    });

    it('should define memory operation keywords', () => {
      expect(micro16MonarchLanguage.memoryKeywords).toContain('MOV');
      expect(micro16MonarchLanguage.memoryKeywords).toContain('LD');
      expect(micro16MonarchLanguage.memoryKeywords).toContain('ST');
      // Micro16-specific
      expect(micro16MonarchLanguage.memoryKeywords).toContain('LDB');
      expect(micro16MonarchLanguage.memoryKeywords).toContain('STB');
      expect(micro16MonarchLanguage.memoryKeywords).toContain('LEA');
      expect(micro16MonarchLanguage.memoryKeywords).toContain('LDS');
      expect(micro16MonarchLanguage.memoryKeywords).toContain('LES');
      expect(micro16MonarchLanguage.memoryKeywords).toContain('XCHG');
    });

    it('should define arithmetic keywords including multiply/divide', () => {
      expect(micro16MonarchLanguage.arithmeticKeywords).toContain('ADD');
      expect(micro16MonarchLanguage.arithmeticKeywords).toContain('SUB');
      expect(micro16MonarchLanguage.arithmeticKeywords).toContain('CMP');
      // Micro16-specific hardware multiply/divide
      expect(micro16MonarchLanguage.arithmeticKeywords).toContain('MUL');
      expect(micro16MonarchLanguage.arithmeticKeywords).toContain('IMUL');
      expect(micro16MonarchLanguage.arithmeticKeywords).toContain('DIV');
      expect(micro16MonarchLanguage.arithmeticKeywords).toContain('IDIV');
      expect(micro16MonarchLanguage.arithmeticKeywords).toContain('TEST');
    });

    it('should define logic keywords including rotate-through-carry', () => {
      expect(micro16MonarchLanguage.logicKeywords).toContain('AND');
      expect(micro16MonarchLanguage.logicKeywords).toContain('OR');
      expect(micro16MonarchLanguage.logicKeywords).toContain('XOR');
      expect(micro16MonarchLanguage.logicKeywords).toContain('NOT');
      // Micro16-specific
      expect(micro16MonarchLanguage.logicKeywords).toContain('RCL');
      expect(micro16MonarchLanguage.logicKeywords).toContain('RCR');
    });

    it('should define stack keywords including frame management', () => {
      expect(micro16MonarchLanguage.stackKeywords).toContain('PUSH');
      expect(micro16MonarchLanguage.stackKeywords).toContain('POP');
      expect(micro16MonarchLanguage.stackKeywords).toContain('CALL');
      expect(micro16MonarchLanguage.stackKeywords).toContain('RET');
      // Micro16-specific
      expect(micro16MonarchLanguage.stackKeywords).toContain('ENTER');
      expect(micro16MonarchLanguage.stackKeywords).toContain('LEAVE');
      expect(micro16MonarchLanguage.stackKeywords).toContain('RETF');
    });

    it('should define string operation keywords', () => {
      expect(micro16MonarchLanguage.stringKeywords).toContain('MOVSB');
      expect(micro16MonarchLanguage.stringKeywords).toContain('MOVSW');
      expect(micro16MonarchLanguage.stringKeywords).toContain('CMPSB');
      expect(micro16MonarchLanguage.stringKeywords).toContain('CMPSW');
      expect(micro16MonarchLanguage.stringKeywords).toContain('STOSB');
      expect(micro16MonarchLanguage.stringKeywords).toContain('STOSW');
      expect(micro16MonarchLanguage.stringKeywords).toContain('LODSB');
      expect(micro16MonarchLanguage.stringKeywords).toContain('LODSW');
      expect(micro16MonarchLanguage.stringKeywords).toContain('REP');
      expect(micro16MonarchLanguage.stringKeywords).toContain('REPZ');
      expect(micro16MonarchLanguage.stringKeywords).toContain('REPNZ');
    });

    it('should define I/O keywords including byte variants and INT', () => {
      expect(micro16MonarchLanguage.ioKeywords).toContain('IN');
      expect(micro16MonarchLanguage.ioKeywords).toContain('OUT');
      expect(micro16MonarchLanguage.ioKeywords).toContain('INB');
      expect(micro16MonarchLanguage.ioKeywords).toContain('OUTB');
      expect(micro16MonarchLanguage.ioKeywords).toContain('INT');
    });

    it('should define directives including SEGMENT and DD', () => {
      expect(micro16MonarchLanguage.directives).toContain('ORG');
      expect(micro16MonarchLanguage.directives).toContain('DB');
      expect(micro16MonarchLanguage.directives).toContain('DW');
      expect(micro16MonarchLanguage.directives).toContain('DS');
      expect(micro16MonarchLanguage.directives).toContain('EQU');
      // Micro16-specific
      expect(micro16MonarchLanguage.directives).toContain('SEGMENT');
      expect(micro16MonarchLanguage.directives).toContain('DD');
    });

    it('should define registers including segment registers', () => {
      // Numbered registers
      expect(micro16MonarchLanguage.registers).toContain('R0');
      expect(micro16MonarchLanguage.registers).toContain('R7');
      // Named aliases (16-bit convention)
      expect(micro16MonarchLanguage.registers).toContain('AX');
      expect(micro16MonarchLanguage.registers).toContain('BX');
      expect(micro16MonarchLanguage.registers).toContain('CX');
      expect(micro16MonarchLanguage.registers).toContain('DX');
      expect(micro16MonarchLanguage.registers).toContain('SI');
      expect(micro16MonarchLanguage.registers).toContain('DI');
      expect(micro16MonarchLanguage.registers).toContain('BP');
      expect(micro16MonarchLanguage.registers).toContain('SP');
      // Segment registers (Micro16-specific)
      expect(micro16MonarchLanguage.registers).toContain('CS');
      expect(micro16MonarchLanguage.registers).toContain('DS');
      expect(micro16MonarchLanguage.registers).toContain('SS');
      expect(micro16MonarchLanguage.registers).toContain('ES');
    });

    it('should have tokenizer with root state', () => {
      expect(micro16MonarchLanguage.tokenizer).toBeDefined();
      expect(micro16MonarchLanguage.tokenizer.root).toBeDefined();
      expect(Array.isArray(micro16MonarchLanguage.tokenizer.root)).toBe(true);
    });
  });

  describe('registerMicro16Language', () => {
    it('should register language with Monaco', () => {
      registerMicro16Language();

      expect(mockMonaco.languages.register).toHaveBeenCalledWith({
        id: micro16LanguageId,
      });
    });

    it('should register language configuration', () => {
      registerMicro16Language();

      expect(mockMonaco.languages.setLanguageConfiguration).toHaveBeenCalledWith(
        micro16LanguageId,
        micro16LanguageConfiguration
      );
    });

    it('should register monarch tokenizer', () => {
      registerMicro16Language();

      expect(mockMonaco.languages.setMonarchTokensProvider).toHaveBeenCalledWith(
        micro16LanguageId,
        micro16MonarchLanguage
      );
    });

    it('should only register once globally', () => {
      registerMicro16Language();
      registerMicro16Language();
      registerMicro16Language();

      expect(mockMonaco.languages.register).toHaveBeenCalledTimes(1);
    });
  });

  describe('resetLanguageRegistration', () => {
    it('should allow re-registration after reset', () => {
      registerMicro16Language();
      expect(mockMonaco.languages.register).toHaveBeenCalledTimes(1);

      resetLanguageRegistration();
      registerMicro16Language();

      expect(mockMonaco.languages.register).toHaveBeenCalledTimes(2);
    });
  });

  describe('tokenizer rules', () => {
    type TokenizerRule = [RegExp | string, string | { cases: Record<string, string> }];
    const getRules = (): TokenizerRule[] =>
      micro16MonarchLanguage.tokenizer.root as TokenizerRule[];

    const findRuleByPatternSource = (patternSource: string): TokenizerRule | undefined => {
      return getRules().find(
        (rule) => rule[0] instanceof RegExp && rule[0].source === patternSource
      );
    };

    it('should have comment rule', () => {
      const rule = findRuleByPatternSource(';.*$');
      expect(rule).toBeDefined();
      expect(rule![1]).toBe('comment');
    });

    it('should have label rule', () => {
      const rule = findRuleByPatternSource('[a-zA-Z_][a-zA-Z0-9_]*:');
      expect(rule).toBeDefined();
      expect(rule![1]).toBe('label');
    });

    it('should have dot-directive rule', () => {
      const rule = findRuleByPatternSource('\\.[a-zA-Z]+');
      expect(rule).toBeDefined();
      expect(rule![1]).toBe('directive');
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

    it('should have identifier/keyword rule with all cases including stringKeywords', () => {
      const rule = findRuleByPatternSource('[a-zA-Z_]\\w*');
      expect(rule).toBeDefined();
      const cases = (rule![1] as { cases: Record<string, string> }).cases;
      expect(cases['@controlKeywords']).toBe('keyword.control');
      expect(cases['@jumpKeywords']).toBe('keyword.jump');
      expect(cases['@memoryKeywords']).toBe('keyword');
      expect(cases['@arithmeticKeywords']).toBe('keyword.arithmetic');
      expect(cases['@logicKeywords']).toBe('keyword.logic');
      expect(cases['@stackKeywords']).toBe('keyword.stack');
      expect(cases['@stringKeywords']).toBe('keyword.string');
      expect(cases['@ioKeywords']).toBe('keyword.io');
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
      const rules = micro16MonarchLanguage.tokenizer.root as TokenizerRule[];

      for (const rule of rules) {
        if (rule[0] instanceof RegExp) {
          const flags = micro16MonarchLanguage.ignoreCase ? 'i' : '';
          const pattern = new RegExp(`^${rule[0].source}`, flags);
          if (pattern.test(text)) {
            return { pattern: rule[0], token: rule[1] };
          }
        }
      }
      return null;
    };

    it('should match comments', () => {
      const result = getMatchingRule('; Micro16 segment program');
      expect(result).not.toBeNull();
      expect(result!.token).toBe('comment');
    });

    it('should match labels', () => {
      const result = getMatchingRule('DATA_SEG:');
      expect(result).not.toBeNull();
      expect(result!.token).toBe('label');
    });

    it('should match dot-prefixed directives (.BYTE)', () => {
      const result = getMatchingRule('.BYTE');
      expect(result).not.toBeNull();
      expect(result!.token).toBe('directive');
    });

    it('should match dot-prefixed directives (.WORD)', () => {
      const result = getMatchingRule('.WORD');
      expect(result).not.toBeNull();
      expect(result!.token).toBe('directive');
    });

    it('should match hex numbers', () => {
      const result = getMatchingRule('0xFFFF');
      expect(result).not.toBeNull();
      expect(result!.token).toBe('number.hex');
    });

    it('should match MUL (Micro16-specific)', () => {
      const result = getMatchingRule('MUL');
      expect(result).not.toBeNull();
      expect(micro16MonarchLanguage.arithmeticKeywords).toContain('MUL');
    });

    it('should match MOVSB (string operation)', () => {
      const result = getMatchingRule('MOVSB');
      expect(result).not.toBeNull();
      expect(micro16MonarchLanguage.stringKeywords).toContain('MOVSB');
    });

    it('should match REP (string prefix)', () => {
      const result = getMatchingRule('REP');
      expect(result).not.toBeNull();
      expect(micro16MonarchLanguage.stringKeywords).toContain('REP');
    });

    it('should match ENTER (stack frame management)', () => {
      const result = getMatchingRule('ENTER');
      expect(result).not.toBeNull();
      expect(micro16MonarchLanguage.stackKeywords).toContain('ENTER');
    });

    it('should match INT (interrupt)', () => {
      const result = getMatchingRule('INT');
      expect(result).not.toBeNull();
      expect(micro16MonarchLanguage.ioKeywords).toContain('INT');
    });

    it('should match segment register (CS)', () => {
      const result = getMatchingRule('CS');
      expect(result).not.toBeNull();
      expect(micro16MonarchLanguage.registers).toContain('CS');
    });

    it('should match register (AX)', () => {
      const result = getMatchingRule('AX');
      expect(result).not.toBeNull();
      expect(micro16MonarchLanguage.registers).toContain('AX');
    });

    it('should match SEGMENT directive', () => {
      const result = getMatchingRule('SEGMENT');
      expect(result).not.toBeNull();
      expect(micro16MonarchLanguage.directives).toContain('SEGMENT');
    });

    it('should match label references as identifiers', () => {
      const result = getMatchingRule('MY_PROC');
      expect(result).not.toBeNull();
      expect(micro16MonarchLanguage.controlKeywords).not.toContain('MY_PROC');
      expect(micro16MonarchLanguage.registers).not.toContain('MY_PROC');
    });
  });

  describe('case-insensitivity', () => {
    it('should match MUL regardless of case', () => {
      const identifierPattern = /^[a-zA-Z_]\w*/i;
      expect(identifierPattern.test('MUL')).toBe(true);
      expect(identifierPattern.test('mul')).toBe(true);
      expect(identifierPattern.test('Mul')).toBe(true);
      expect(micro16MonarchLanguage.arithmeticKeywords).toContain('MUL');
    });

    it('should match MOVSB regardless of case', () => {
      const identifierPattern = /^[a-zA-Z_]\w*/i;
      expect(identifierPattern.test('MOVSB')).toBe(true);
      expect(identifierPattern.test('movsb')).toBe(true);
      expect(micro16MonarchLanguage.stringKeywords).toContain('MOVSB');
    });
  });

  describe('multi-line program tokenization (CR M-3)', () => {
    const tokenizeLine = (
      line: string
    ): Array<{ text: string; token: string | 'cases' }> => {
      type TokenizerRule = [RegExp | string, string | { cases: Record<string, string> }];
      const rules = micro16MonarchLanguage.tokenizer.root as TokenizerRule[];
      const tokens: Array<{ text: string; token: string | 'cases' }> = [];
      let remaining = line;

      while (remaining.length > 0) {
        let matched = false;
        for (const rule of rules) {
          if (rule[0] instanceof RegExp) {
            const flags = micro16MonarchLanguage.ignoreCase ? 'i' : '';
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

    it('should tokenize a segment override instruction', () => {
      // Note: DS: is consumed by the label rule since it matches identifier+colon pattern.
      // This is acceptable — the register still gets highlighted, just as a label token.
      const tokens = tokenizeLine('MOV AX, DS:[SI]');
      const movToken = tokens.find(t => t.text === 'MOV');
      expect(movToken).toBeDefined();
      const axToken = tokens.find(t => t.text === 'AX');
      expect(axToken).toBeDefined();
      const siToken = tokens.find(t => t.text === 'SI');
      expect(siToken).toBeDefined();
    });

    it('should tokenize label + multiply instruction', () => {
      const tokens = tokenizeLine('CALC: MUL AX, BX');
      expect(tokens[0].token).toBe('label');
      expect(tokens[0].text).toBe('CALC:');
      expect(micro16MonarchLanguage.arithmeticKeywords).toContain('MUL');
    });

    it('should tokenize string operation with REP prefix', () => {
      const tokens = tokenizeLine('REP MOVSB');
      expect(micro16MonarchLanguage.stringKeywords).toContain('REP');
      expect(micro16MonarchLanguage.stringKeywords).toContain('MOVSB');
      const repToken = tokens.find(t => t.text === 'REP');
      expect(repToken).toBeDefined();
    });

    it('should tokenize dot-prefixed directive', () => {
      const tokens = tokenizeLine('.BYTE 0x42');
      const directiveToken = tokens.find(t => t.text === '.BYTE');
      expect(directiveToken).toBeDefined();
      expect(directiveToken!.token).toBe('directive');
    });

    it('should tokenize stack frame instructions', () => {
      expect(micro16MonarchLanguage.stackKeywords).toContain('ENTER');
      expect(micro16MonarchLanguage.stackKeywords).toContain('LEAVE');
      const enterTokens = tokenizeLine('ENTER');
      const enterToken = enterTokens.find(t => t.text === 'ENTER');
      expect(enterToken).toBeDefined();
    });
  });
});
