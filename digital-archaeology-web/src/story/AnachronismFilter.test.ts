// src/story/AnachronismFilter.test.ts
// Tests for AnachronismFilter utility
// Story 10.21: Historical Mindset Time-Travel

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AnachronismFilter, createEraFilter } from './AnachronismFilter';
import { MindsetProvider } from './MindsetProvider';
import type { MindsetContext } from './types';

describe('AnachronismFilter', () => {
  let filter: AnachronismFilter;
  let provider: MindsetProvider;

  const mockMindset: MindsetContext = {
    year: 1971,
    knownTechnology: ['transistor', 'integrated circuit'],
    unknownTechnology: ['internet', 'smartphone', 'cloud computing'],
    activeProblems: [],
    constraints: [],
    impossibilities: [],
    historicalPerspective: {
      currentKnowledge: 'You are at Intel',
      futureBlind: 'You do not know the future',
    },
  };

  beforeEach(() => {
    MindsetProvider.resetInstance();
    provider = MindsetProvider.getInstance();
    filter = new AnachronismFilter();
  });

  afterEach(() => {
    MindsetProvider.resetInstance();
  });

  describe('isAnachronism', () => {
    beforeEach(() => {
      provider.setMindset(mockMindset);
    });

    it('should detect term from unknownTechnology list', () => {
      expect(filter.isAnachronism('internet')).toBe(true);
      expect(filter.isAnachronism('smartphone')).toBe(true);
    });

    it('should not flag known technology', () => {
      expect(filter.isAnachronism('transistor')).toBe(false);
    });

    it('should allow year override', () => {
      filter.addCustomTerm('microprocessor', 1971);
      expect(filter.isAnachronism('microprocessor', 1970)).toBe(true);
      expect(filter.isAnachronism('microprocessor', 1975)).toBe(false);
    });

    it('should check custom terms', () => {
      filter.addCustomTerm('laser disc', 1978);
      expect(filter.isAnachronism('laser disc')).toBe(true);
    });
  });

  describe('addCustomTerm', () => {
    beforeEach(() => {
      provider.setMindset(mockMindset);
    });

    it('should add term with year', () => {
      filter.addCustomTerm('USB', 1996);
      expect(filter.isAnachronism('USB')).toBe(true);
    });

    it('should add term with replacement', () => {
      filter.addCustomTerm('laptop', 1981, 'portable computer');
      expect(filter.getPeriodTerm('laptop')).toBe('portable computer');
    });

    it('should be case insensitive', () => {
      filter.addCustomTerm('GPS', 1993);
      expect(filter.isAnachronism('gps')).toBe(true);
      expect(filter.isAnachronism('GPS')).toBe(true);
    });
  });

  describe('clearCustomTerms', () => {
    beforeEach(() => {
      provider.setMindset(mockMindset);
    });

    it('should remove all custom terms', () => {
      filter.addCustomTerm('USB', 1996);
      filter.addCustomTerm('GPS', 1993);
      expect(filter.isAnachronism('USB')).toBe(true);

      filter.clearCustomTerms();

      // Now should fall back to provider (which doesn't know about USB)
      expect(filter.isAnachronism('USB')).toBe(false);
    });
  });

  describe('getPeriodTerm', () => {
    beforeEach(() => {
      provider.setMindset(mockMindset);
    });

    it('should return custom replacement', () => {
      filter.addCustomTerm('internet', 1990, 'ARPANET');
      expect(filter.getPeriodTerm('internet')).toBe('ARPANET');
    });

    it('should fall back to provider', () => {
      // Without custom term, returns the term itself
      expect(filter.getPeriodTerm('unknown-thing')).toBe('unknown-thing');
    });
  });

  describe('analyze', () => {
    beforeEach(() => {
      provider.setMindset(mockMindset);
    });

    it('should find anachronisms in text', () => {
      const result = filter.analyze('We could use the internet to share data.');
      expect(result.hasAnachronisms).toBe(true);
      expect(result.anachronisms.length).toBe(1);
      expect(result.anachronisms[0].term).toBe('internet');
    });

    it('should find multiple anachronisms', () => {
      const result = filter.analyze(
        'With a smartphone connected to cloud computing, we could do anything.'
      );
      expect(result.anachronisms.length).toBe(2);
    });

    it('should report position correctly', () => {
      const text = 'The internet is great.';
      const result = filter.analyze(text);
      expect(result.anachronisms[0].position).toBe(4); // 'The ' is 4 chars
    });

    it('should return original text when no anachronisms', () => {
      const text = 'The transistor changed everything.';
      const result = filter.analyze(text);
      expect(result.hasAnachronisms).toBe(false);
      expect(result.filtered).toBe(text);
    });

    it('should be case insensitive by default', () => {
      const result = filter.analyze('The INTERNET is here.');
      expect(result.hasAnachronisms).toBe(true);
      expect(result.anachronisms[0].term).toBe('INTERNET');
    });

    it('should respect case sensitivity option', () => {
      const result = filter.analyze('The INTERNET is here.', { caseInsensitive: false });
      // 'INTERNET' won't match 'internet' in unknownTechnology
      expect(result.hasAnachronisms).toBe(false);
    });
  });

  describe('analyze with flag mode', () => {
    beforeEach(() => {
      provider.setMindset(mockMindset);
    });

    it('should flag anachronisms', () => {
      const result = filter.analyze('Use the internet.', { mode: 'flag' });
      expect(result.filtered).toBe('Use the [ANACHRONISM: internet].');
    });

    it('should flag multiple anachronisms', () => {
      const result = filter.analyze('Get a smartphone with cloud computing.', {
        mode: 'flag',
      });
      expect(result.filtered).toContain('[ANACHRONISM: smartphone]');
      expect(result.filtered).toContain('[ANACHRONISM: cloud computing]');
    });
  });

  describe('analyze with replace mode', () => {
    beforeEach(() => {
      provider.setMindset(mockMindset);
      filter.addCustomTerm('internet', 1990, 'ARPANET');
    });

    it('should replace anachronisms with period terms', () => {
      const result = filter.analyze('Use the internet.', { mode: 'replace' });
      expect(result.filtered).toBe('Use the ARPANET.');
    });

    it('should not replace if no replacement available', () => {
      // 'smartphone' from unknownTechnology has no replacement
      const result = filter.analyze('Get a smartphone.', { mode: 'replace' });
      // Without replacement, text unchanged for that term
      expect(result.filtered).toBe('Get a smartphone.');
    });
  });

  describe('analyze with remove mode', () => {
    beforeEach(() => {
      provider.setMindset(mockMindset);
    });

    it('should remove anachronisms', () => {
      const result = filter.analyze('Use the internet.', { mode: 'remove' });
      expect(result.filtered).toBe('Use the [...].');
    });
  });

  describe('analyze with highlight mode', () => {
    beforeEach(() => {
      provider.setMindset(mockMindset);
    });

    it('should highlight anachronisms', () => {
      const result = filter.analyze('Use the internet.', { mode: 'highlight' });
      expect(result.filtered).toBe('Use the **internet**.');
    });
  });

  describe('analyze with year override', () => {
    beforeEach(() => {
      filter.addCustomTerm('microprocessor', 1971);
      filter.addCustomTerm('internet', 1990);
    });

    it('should check against specified year', () => {
      const result1970 = filter.analyze('The microprocessor changed computing.', {
        year: 1970,
      });
      expect(result1970.hasAnachronisms).toBe(true);

      const result1980 = filter.analyze('The microprocessor changed computing.', {
        year: 1980,
      });
      expect(result1980.hasAnachronisms).toBe(false);
    });
  });

  describe('anachronism reasons', () => {
    beforeEach(() => {
      provider.setMindset(mockMindset);
    });

    it('should provide reason for anachronism', () => {
      filter.addCustomTerm('USB', 1996);
      const result = filter.analyze('Connect via USB.');
      expect(result.anachronisms[0].reason).toContain('1996');
    });
  });

  describe('createEraFilter', () => {
    it('should create filter with era-appropriate terms', () => {
      const filter1970 = createEraFilter(1970);
      // Must pass year explicitly since no mindset is set
      expect(filter1970.isAnachronism('internet', 1970)).toBe(true);
      expect(filter1970.isAnachronism('smartphone', 1970)).toBe(true);
      expect(filter1970.isAnachronism('USB', 1970)).toBe(true);
    });

    it('should not flag terms from before the era', () => {
      const filter2000 = createEraFilter(2000);
      // These terms were introduced before 2000
      expect(filter2000.isAnachronism('internet', 2000)).toBe(false);
      expect(filter2000.isAnachronism('email', 2000)).toBe(false);
    });

    it('should include appropriate replacements', () => {
      const filter1970 = createEraFilter(1970);
      expect(filter1970.getPeriodTerm('internet')).toBe('ARPANET');
      expect(filter1970.getPeriodTerm('personal computer')).toBe('minicomputer');
    });
  });

  describe('edge cases', () => {
    beforeEach(() => {
      provider.setMindset(mockMindset);
    });

    it('should handle empty text', () => {
      const result = filter.analyze('');
      expect(result.hasAnachronisms).toBe(false);
      expect(result.filtered).toBe('');
    });

    it('should handle text with no matches', () => {
      const result = filter.analyze('The quick brown fox jumps over the lazy dog.');
      expect(result.hasAnachronisms).toBe(false);
    });

    it('should handle terms with special characters as substrings', () => {
      // Note: Word boundary \b doesn't work with non-word chars like +
      // So C++ won't match as a whole word. This tests that regex escaping works.
      filter.addCustomTerm('Wi-Fi', 1999);
      const result = filter.analyze('Connect via Wi-Fi network.', { year: 1990 });
      expect(result.hasAnachronisms).toBe(true);
      expect(result.anachronisms[0].term.toLowerCase()).toBe('wi-fi');
    });

    it('should match whole words only', () => {
      provider.setMindset({
        ...mockMindset,
        unknownTechnology: ['net'],
      });
      const result = filter.analyze('The internet is a network.');
      // Should only match 'net' as whole word, not inside 'internet' or 'network'
      expect(result.anachronisms.length).toBe(0);
    });
  });
});
