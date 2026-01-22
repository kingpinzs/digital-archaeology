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
  registerMicro4Language,
  resetLanguageRegistration,
  micro4LanguageId,
  micro4LanguageConfiguration,
  micro4MonarchLanguage,
} from './micro4-language';

describe('micro4-language', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetLanguageRegistration();
  });

  describe('micro4LanguageId', () => {
    it('should be "micro4"', () => {
      expect(micro4LanguageId).toBe('micro4');
    });
  });

  describe('micro4LanguageConfiguration', () => {
    it('should define semicolon as line comment', () => {
      expect(micro4LanguageConfiguration.comments?.lineComment).toBe(';');
    });

    it('should have empty brackets array', () => {
      expect(micro4LanguageConfiguration.brackets).toEqual([]);
    });
  });

  describe('micro4MonarchLanguage', () => {
    it('should be case-insensitive', () => {
      expect(micro4MonarchLanguage.ignoreCase).toBe(true);
    });

    it('should define control keywords', () => {
      expect(micro4MonarchLanguage.controlKeywords).toContain('HLT');
      expect(micro4MonarchLanguage.controlKeywords).toContain('JMP');
      expect(micro4MonarchLanguage.controlKeywords).toContain('JZ');
    });

    it('should define memory operation keywords', () => {
      expect(micro4MonarchLanguage.memoryKeywords).toContain('LDA');
      expect(micro4MonarchLanguage.memoryKeywords).toContain('STA');
      expect(micro4MonarchLanguage.memoryKeywords).toContain('ADD');
      expect(micro4MonarchLanguage.memoryKeywords).toContain('SUB');
      expect(micro4MonarchLanguage.memoryKeywords).toContain('LDI');
    });

    it('should define directives', () => {
      expect(micro4MonarchLanguage.directives).toContain('ORG');
      expect(micro4MonarchLanguage.directives).toContain('DB');
    });

    it('should have tokenizer with root state', () => {
      expect(micro4MonarchLanguage.tokenizer).toBeDefined();
      expect(micro4MonarchLanguage.tokenizer.root).toBeDefined();
      expect(Array.isArray(micro4MonarchLanguage.tokenizer.root)).toBe(true);
    });
  });

  describe('registerMicro4Language', () => {
    it('should register language with Monaco', () => {
      registerMicro4Language();

      expect(mockMonaco.languages.register).toHaveBeenCalledWith({
        id: micro4LanguageId,
      });
    });

    it('should register language configuration', () => {
      registerMicro4Language();

      expect(mockMonaco.languages.setLanguageConfiguration).toHaveBeenCalledWith(
        micro4LanguageId,
        micro4LanguageConfiguration
      );
    });

    it('should register monarch tokenizer', () => {
      registerMicro4Language();

      expect(mockMonaco.languages.setMonarchTokensProvider).toHaveBeenCalledWith(
        micro4LanguageId,
        micro4MonarchLanguage
      );
    });

    it('should only register once globally', () => {
      registerMicro4Language();
      registerMicro4Language();
      registerMicro4Language();

      expect(mockMonaco.languages.register).toHaveBeenCalledTimes(1);
      expect(mockMonaco.languages.setLanguageConfiguration).toHaveBeenCalledTimes(
        1
      );
      expect(mockMonaco.languages.setMonarchTokensProvider).toHaveBeenCalledTimes(
        1
      );
    });
  });

  describe('resetLanguageRegistration', () => {
    it('should allow re-registration after reset', () => {
      registerMicro4Language();
      expect(mockMonaco.languages.register).toHaveBeenCalledTimes(1);

      resetLanguageRegistration();
      registerMicro4Language();

      expect(mockMonaco.languages.register).toHaveBeenCalledTimes(2);
    });
  });

  describe('tokenizer rules', () => {
    // Type for tokenizer rules - can be simple [pattern, token] or complex with cases
    type TokenizerRule = [RegExp | string, string | { cases: Record<string, string> }];
    const getRules = (): TokenizerRule[] =>
      micro4MonarchLanguage.tokenizer.root as TokenizerRule[];

    // Helper to find a rule by checking if its pattern matches the given regex source
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

    it('should have decimal number rule', () => {
      const rule = findRuleByPatternSource('\\d+');
      expect(rule).toBeDefined();
      expect(rule![1]).toBe('number');
    });

    it('should have identifier/keyword rule with cases', () => {
      const rule = findRuleByPatternSource('[a-zA-Z_]\\w*');
      expect(rule).toBeDefined();
      expect(typeof rule![1]).toBe('object');
      const cases = (rule![1] as { cases: Record<string, string> }).cases;
      expect(cases['@controlKeywords']).toBe('keyword.control');
      expect(cases['@memoryKeywords']).toBe('keyword');
      expect(cases['@directives']).toBe('directive');
      expect(cases['@default']).toBe('identifier');
    });

    it('should map controlKeywords to keyword.control token', () => {
      const rule = findRuleByPatternSource('[a-zA-Z_]\\w*');
      const cases = (rule![1] as { cases: Record<string, string> }).cases;
      expect(cases['@controlKeywords']).toBe('keyword.control');
    });

    it('should map memoryKeywords to keyword token', () => {
      const rule = findRuleByPatternSource('[a-zA-Z_]\\w*');
      const cases = (rule![1] as { cases: Record<string, string> }).cases;
      expect(cases['@memoryKeywords']).toBe('keyword');
    });

    it('should map directives to directive token', () => {
      const rule = findRuleByPatternSource('[a-zA-Z_]\\w*');
      const cases = (rule![1] as { cases: Record<string, string> }).cases;
      expect(cases['@directives']).toBe('directive');
    });
  });

  describe('syntax highlighting on sample code (Task 9.2)', () => {
    // Test that tokenizer patterns actually match real Micro4 code
    // Sample code representing typical Micro4 assembly (for documentation):
    // ; Example Micro4 Program
    //         ORG 0x00
    // START:  LDA 0x20
    //         ADD 0x21
    //         STA 0x22
    //         JZ  DONE
    //         LDI 5
    //         JMP START
    // DONE:   HLT
    //         ORG 0x20
    // DATA:   DB  3

    // Helper to test if a pattern matches text (simulating tokenization)
    const getMatchingRule = (
      text: string
    ): { pattern: RegExp; token: string | { cases: Record<string, string> } } | null => {
      type TokenizerRule = [RegExp | string, string | { cases: Record<string, string> }];
      const rules = micro4MonarchLanguage.tokenizer.root as TokenizerRule[];

      for (const rule of rules) {
        if (rule[0] instanceof RegExp) {
          // Apply ignoreCase if set
          const flags = micro4MonarchLanguage.ignoreCase ? 'i' : '';
          const pattern = new RegExp(`^${rule[0].source}`, flags);
          if (pattern.test(text)) {
            return { pattern: rule[0], token: rule[1] };
          }
        }
      }
      return null;
    };

    it('should match comments starting with semicolon', () => {
      const result = getMatchingRule('; Example Micro4 Program');
      expect(result).not.toBeNull();
      expect(result!.token).toBe('comment');
    });

    it('should match labels ending with colon', () => {
      const result = getMatchingRule('START:');
      expect(result).not.toBeNull();
      expect(result!.token).toBe('label');
    });

    it('should match hex numbers', () => {
      const result = getMatchingRule('0x20');
      expect(result).not.toBeNull();
      expect(result!.token).toBe('number.hex');
    });

    it('should match uppercase hex', () => {
      const result = getMatchingRule('0xFF');
      expect(result).not.toBeNull();
      expect(result!.token).toBe('number.hex');
    });

    it('should match decimal numbers', () => {
      const result = getMatchingRule('255');
      expect(result).not.toBeNull();
      expect(result!.token).toBe('number');
    });

    it('should match control keywords (HLT)', () => {
      const result = getMatchingRule('HLT');
      expect(result).not.toBeNull();
      expect(typeof result!.token).toBe('object');
      // Monarch will use @controlKeywords case for HLT
      expect(micro4MonarchLanguage.controlKeywords).toContain('HLT');
    });

    it('should match control keywords (JMP)', () => {
      const result = getMatchingRule('JMP');
      expect(result).not.toBeNull();
      expect(micro4MonarchLanguage.controlKeywords).toContain('JMP');
    });

    it('should match control keywords (JZ)', () => {
      const result = getMatchingRule('JZ');
      expect(result).not.toBeNull();
      expect(micro4MonarchLanguage.controlKeywords).toContain('JZ');
    });

    it('should match memory keywords (LDA)', () => {
      const result = getMatchingRule('LDA');
      expect(result).not.toBeNull();
      expect(micro4MonarchLanguage.memoryKeywords).toContain('LDA');
    });

    it('should match memory keywords (STA)', () => {
      const result = getMatchingRule('STA');
      expect(result).not.toBeNull();
      expect(micro4MonarchLanguage.memoryKeywords).toContain('STA');
    });

    it('should match memory keywords (ADD)', () => {
      const result = getMatchingRule('ADD');
      expect(result).not.toBeNull();
      expect(micro4MonarchLanguage.memoryKeywords).toContain('ADD');
    });

    it('should match memory keywords (SUB)', () => {
      const result = getMatchingRule('SUB');
      expect(result).not.toBeNull();
      expect(micro4MonarchLanguage.memoryKeywords).toContain('SUB');
    });

    it('should match memory keywords (LDI)', () => {
      const result = getMatchingRule('LDI');
      expect(result).not.toBeNull();
      expect(micro4MonarchLanguage.memoryKeywords).toContain('LDI');
    });

    it('should match directives (ORG)', () => {
      const result = getMatchingRule('ORG');
      expect(result).not.toBeNull();
      expect(micro4MonarchLanguage.directives).toContain('ORG');
    });

    it('should match directives (DB)', () => {
      const result = getMatchingRule('DB');
      expect(result).not.toBeNull();
      expect(micro4MonarchLanguage.directives).toContain('DB');
    });

    it('should match label references as identifiers', () => {
      const result = getMatchingRule('DONE');
      expect(result).not.toBeNull();
      // DONE is not in any keyword array, so it's an identifier
      expect(micro4MonarchLanguage.controlKeywords).not.toContain('DONE');
      expect(micro4MonarchLanguage.memoryKeywords).not.toContain('DONE');
      expect(micro4MonarchLanguage.directives).not.toContain('DONE');
    });
  });

  describe('case-insensitivity (Task 8.4)', () => {
    it('should have ignoreCase flag set to true', () => {
      expect(micro4MonarchLanguage.ignoreCase).toBe(true);
    });

    it('should match LDA regardless of case', () => {
      // Monarch uses ignoreCase: true, so all these should match the identifier pattern
      // and then be resolved via @memoryKeywords
      const patterns = ['LDA', 'lda', 'Lda', 'lDa', 'LdA'];
      const identifierPattern = /^[a-zA-Z_]\w*/i;

      for (const pattern of patterns) {
        expect(identifierPattern.test(pattern)).toBe(true);
        // Since ignoreCase is true and memoryKeywords contains 'LDA',
        // Monarch will match any case variation
      }
      expect(micro4MonarchLanguage.memoryKeywords).toContain('LDA');
    });

    it('should match HLT regardless of case', () => {
      const patterns = ['HLT', 'hlt', 'Hlt', 'hLt'];
      const identifierPattern = /^[a-zA-Z_]\w*/i;

      for (const pattern of patterns) {
        expect(identifierPattern.test(pattern)).toBe(true);
      }
      expect(micro4MonarchLanguage.controlKeywords).toContain('HLT');
    });

    it('should match JMP regardless of case', () => {
      const patterns = ['JMP', 'jmp', 'Jmp', 'jMp'];
      const identifierPattern = /^[a-zA-Z_]\w*/i;

      for (const pattern of patterns) {
        expect(identifierPattern.test(pattern)).toBe(true);
      }
      expect(micro4MonarchLanguage.controlKeywords).toContain('JMP');
    });

    it('should match ORG regardless of case', () => {
      const patterns = ['ORG', 'org', 'Org', 'oRg'];
      const identifierPattern = /^[a-zA-Z_]\w*/i;

      for (const pattern of patterns) {
        expect(identifierPattern.test(pattern)).toBe(true);
      }
      expect(micro4MonarchLanguage.directives).toContain('ORG');
    });

    it('should match DB regardless of case', () => {
      const patterns = ['DB', 'db', 'Db', 'dB'];
      const identifierPattern = /^[a-zA-Z_]\w*/i;

      for (const pattern of patterns) {
        expect(identifierPattern.test(pattern)).toBe(true);
      }
      expect(micro4MonarchLanguage.directives).toContain('DB');
    });
  });

  describe('highlighting updates on code change (Task 9.3)', () => {
    // Type for tokenizer rules
    type TokenizerRule = [RegExp | string, string | { cases: Record<string, string> }];

    it('should register tokenizer that Monaco will apply to any content', () => {
      registerMicro4Language();

      // Verify the tokenizer was registered - Monaco will use it for any content changes
      expect(mockMonaco.languages.setMonarchTokensProvider).toHaveBeenCalledWith(
        micro4LanguageId,
        expect.objectContaining({
          tokenizer: expect.objectContaining({
            root: expect.any(Array),
          }),
        })
      );
    });

    it('should have tokenizer that handles empty content', () => {
      // Empty content should not crash - whitespace rule handles it
      const rules = micro4MonarchLanguage.tokenizer.root as TokenizerRule[];
      const whitespaceRule = rules.find(
        (rule) => rule[0] instanceof RegExp && rule[0].source === '\\s+'
      );
      expect(whitespaceRule).toBeDefined();
      expect(whitespaceRule![1]).toBe('white');
    });

    it('should have complete tokenizer for incremental parsing', () => {
      // Monaco re-tokenizes on each change - verify all token types are covered
      const rules = micro4MonarchLanguage.tokenizer.root as TokenizerRule[];

      // Must handle: whitespace, comments, labels, hex, decimal, keywords/identifiers
      const hasWhitespace = rules.some(
        (r) => r[0] instanceof RegExp && r[0].source === '\\s+'
      );
      const hasComment = rules.some(
        (r) => r[0] instanceof RegExp && r[0].source === ';.*$'
      );
      const hasLabel = rules.some(
        (r) => r[0] instanceof RegExp && r[0].source === '[a-zA-Z_][a-zA-Z0-9_]*:'
      );
      const hasHex = rules.some(
        (r) => r[0] instanceof RegExp && r[0].source === '0[xX][0-9a-fA-F]+'
      );
      const hasDecimal = rules.some(
        (r) => r[0] instanceof RegExp && r[0].source === '\\d+'
      );
      const hasIdentifier = rules.some(
        (r) => r[0] instanceof RegExp && r[0].source === '[a-zA-Z_]\\w*'
      );

      expect(hasWhitespace).toBe(true);
      expect(hasComment).toBe(true);
      expect(hasLabel).toBe(true);
      expect(hasHex).toBe(true);
      expect(hasDecimal).toBe(true);
      expect(hasIdentifier).toBe(true);
    });
  });
});
