// src/story/MindsetProvider.test.ts
// Tests for MindsetProvider singleton
// Story 10.21: Historical Mindset Time-Travel

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MindsetProvider } from './MindsetProvider';
import type { MindsetContext, EraTechnology } from './types';

describe('MindsetProvider', () => {
  let provider: MindsetProvider;

  beforeEach(() => {
    // Reset singleton before each test
    MindsetProvider.resetInstance();
    provider = MindsetProvider.getInstance();
  });

  afterEach(() => {
    MindsetProvider.resetInstance();
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = MindsetProvider.getInstance();
      const instance2 = MindsetProvider.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should create new instance after reset', () => {
      const instance1 = MindsetProvider.getInstance();
      MindsetProvider.resetInstance();
      const instance2 = MindsetProvider.getInstance();
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('setMindset', () => {
    const mockMindset: MindsetContext = {
      year: 1971,
      knownTechnology: ['transistor', 'integrated circuit'],
      unknownTechnology: ['internet', 'smartphone'],
      activeProblems: [
        {
          statement: 'How to put a computer on a chip?',
          motivation: 'Reduce cost and size',
          currentApproaches: ['MSI chips', 'custom LSI'],
        },
      ],
      constraints: [
        {
          type: 'technical',
          description: 'Only 2300 transistors fit on a chip',
          limitation: '2300 transistors',
        },
      ],
      impossibilities: ['1GB RAM', 'GHz clock speeds'],
      historicalPerspective: {
        currentKnowledge: 'LSI is cutting edge',
        futureBlind: 'You do not know what will happen next',
      },
    };

    it('should set and get mindset context', () => {
      expect(provider.getCurrentMindset()).toBeNull();
      provider.setMindset(mockMindset);
      expect(provider.getCurrentMindset()).toEqual(mockMindset);
    });

    it('should dispatch mindset-established event on first set', () => {
      const handler = vi.fn();
      document.addEventListener('mindset-mindset-established', handler);

      provider.setMindset(mockMindset);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].detail).toEqual({ mindset: mockMindset });

      document.removeEventListener('mindset-mindset-established', handler);
    });

    it('should dispatch mindset-changed event on subsequent sets', () => {
      const establishedHandler = vi.fn();
      const changedHandler = vi.fn();
      document.addEventListener('mindset-mindset-established', establishedHandler);
      document.addEventListener('mindset-mindset-changed', changedHandler);

      provider.setMindset(mockMindset);

      const newMindset: MindsetContext = {
        ...mockMindset,
        year: 1978,
      };
      provider.setMindset(newMindset);

      expect(establishedHandler).toHaveBeenCalledTimes(1);
      expect(changedHandler).toHaveBeenCalledTimes(1);
      expect(changedHandler.mock.calls[0][0].detail).toEqual({
        previous: mockMindset,
        current: newMindset,
      });

      document.removeEventListener('mindset-mindset-established', establishedHandler);
      document.removeEventListener('mindset-mindset-changed', changedHandler);
    });
  });

  describe('getCurrentYear', () => {
    it('should return 2026 when no mindset is set', () => {
      expect(provider.getCurrentYear()).toBe(2026);
    });

    it('should return mindset year when set', () => {
      provider.setMindset({
        year: 1955,
        knownTechnology: [],
        unknownTechnology: [],
        activeProblems: [],
        constraints: [],
        impossibilities: [],
        historicalPerspective: {
          currentKnowledge: '',
          futureBlind: '',
        },
      });
      expect(provider.getCurrentYear()).toBe(1955);
    });
  });

  describe('isAnachronism', () => {
    const mockTechnologies: EraTechnology[] = [
      {
        name: 'transistor',
        yearInvented: 1947,
        yearCommon: 1955,
        predecessors: ['vacuum tube'],
      },
      {
        name: 'microprocessor',
        yearInvented: 1971,
        yearCommon: 1975,
        predecessors: ['integrated circuit'],
      },
      {
        name: 'internet',
        yearInvented: 1969,
        yearCommon: 1995,
        predecessors: ['ARPANET'],
      },
    ];

    beforeEach(() => {
      provider.setTechnologyTimeline(mockTechnologies);
    });

    it('should return true for technology not yet common', () => {
      provider.setMindset({
        year: 1950,
        knownTechnology: [],
        unknownTechnology: [],
        activeProblems: [],
        constraints: [],
        impossibilities: [],
        historicalPerspective: { currentKnowledge: '', futureBlind: '' },
      });

      expect(provider.isAnachronism('transistor')).toBe(true); // Not common until 1955
    });

    it('should return false for technology that is common', () => {
      provider.setMindset({
        year: 1960,
        knownTechnology: [],
        unknownTechnology: [],
        activeProblems: [],
        constraints: [],
        impossibilities: [],
        historicalPerspective: { currentKnowledge: '', futureBlind: '' },
      });

      expect(provider.isAnachronism('transistor')).toBe(false); // Common by 1955
    });

    it('should check against unknownTechnology list', () => {
      provider.setMindset({
        year: 1971,
        knownTechnology: [],
        unknownTechnology: ['internet', 'smartphone'],
        activeProblems: [],
        constraints: [],
        impossibilities: [],
        historicalPerspective: { currentKnowledge: '', futureBlind: '' },
      });

      expect(provider.isAnachronism('internet')).toBe(true);
      expect(provider.isAnachronism('smartphone')).toBe(true);
    });

    it('should accept year override', () => {
      provider.setMindset({
        year: 2020,
        knownTechnology: [],
        unknownTechnology: [],
        activeProblems: [],
        constraints: [],
        impossibilities: [],
        historicalPerspective: { currentKnowledge: '', futureBlind: '' },
      });

      // Even though mindset is 2020, check for 1950
      expect(provider.isAnachronism('microprocessor', 1950)).toBe(true);
      expect(provider.isAnachronism('microprocessor', 1980)).toBe(false);
    });

    it('should return false for unknown concepts', () => {
      expect(provider.isAnachronism('unknown-thing')).toBe(false);
    });
  });

  describe('getPeriodTerm', () => {
    const mockTechnologies: EraTechnology[] = [
      {
        name: 'transistor',
        yearInvented: 1947,
        yearCommon: 1955,
        periodTerms: [
          { year: 1947, term: 'transfer resistor' },
          { year: 1950, term: 'transistor' },
        ],
      },
      {
        name: 'microprocessor',
        yearInvented: 1971,
        yearCommon: 1975,
        periodTerms: [
          { year: 1971, term: 'computer on a chip' },
          { year: 1974, term: 'microprocessor' },
        ],
      },
    ];

    const mockTerminology = [
      { modern: 'personal computer', earliest: 1975, before: 'minicomputer' },
      { modern: 'internet', earliest: 1990, before: 'ARPANET' },
    ];

    beforeEach(() => {
      provider.setTechnologyTimeline(mockTechnologies);
      provider.setTerminology(mockTerminology);
    });

    it('should return period-accurate term from technology timeline', () => {
      provider.setMindset({
        year: 1948,
        knownTechnology: [],
        unknownTechnology: [],
        activeProblems: [],
        constraints: [],
        impossibilities: [],
        historicalPerspective: { currentKnowledge: '', futureBlind: '' },
      });

      expect(provider.getPeriodTerm('transistor')).toBe('transfer resistor');
    });

    it('should return most recent applicable term', () => {
      provider.setMindset({
        year: 1972,
        knownTechnology: [],
        unknownTechnology: [],
        activeProblems: [],
        constraints: [],
        impossibilities: [],
        historicalPerspective: { currentKnowledge: '', futureBlind: '' },
      });

      expect(provider.getPeriodTerm('microprocessor')).toBe('computer on a chip');
    });

    it('should return original concept if no period term exists', () => {
      provider.setMindset({
        year: 1960,
        knownTechnology: [],
        unknownTechnology: [],
        activeProblems: [],
        constraints: [],
        impossibilities: [],
        historicalPerspective: { currentKnowledge: '', futureBlind: '' },
      });

      expect(provider.getPeriodTerm('unknown-thing')).toBe('unknown-thing');
    });

    it('should use terminology mapping as fallback', () => {
      provider.setMindset({
        year: 1970,
        knownTechnology: [],
        unknownTechnology: [],
        activeProblems: [],
        constraints: [],
        impossibilities: [],
        historicalPerspective: { currentKnowledge: '', futureBlind: '' },
      });

      expect(provider.getPeriodTerm('personal computer')).toBe('minicomputer');
    });
  });

  describe('clearMindset', () => {
    it('should clear the current mindset', () => {
      provider.setMindset({
        year: 1971,
        knownTechnology: [],
        unknownTechnology: [],
        activeProblems: [],
        constraints: [],
        impossibilities: [],
        historicalPerspective: { currentKnowledge: '', futureBlind: '' },
      });

      expect(provider.getCurrentMindset()).not.toBeNull();
      provider.clearMindset();
      expect(provider.getCurrentMindset()).toBeNull();
    });

    it('should dispatch mindset-cleared event', () => {
      const handler = vi.fn();
      document.addEventListener('mindset-mindset-cleared', handler);

      const mindset = {
        year: 1971,
        knownTechnology: [],
        unknownTechnology: [],
        activeProblems: [],
        constraints: [],
        impossibilities: [],
        historicalPerspective: { currentKnowledge: '', futureBlind: '' },
      };
      provider.setMindset(mindset);
      provider.clearMindset();

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].detail).toEqual({ previous: mindset });

      document.removeEventListener('mindset-mindset-cleared', handler);
    });

    it('should not dispatch event if no mindset was set', () => {
      const handler = vi.fn();
      document.addEventListener('mindset-mindset-cleared', handler);

      provider.clearMindset();

      expect(handler).not.toHaveBeenCalled();

      document.removeEventListener('mindset-mindset-cleared', handler);
    });
  });

  describe('destroy', () => {
    it('should reset all state', () => {
      provider.setTechnologyTimeline([
        { name: 'test', yearInvented: 1900, yearCommon: 1910 },
      ]);
      provider.setMindset({
        year: 1971,
        knownTechnology: [],
        unknownTechnology: [],
        activeProblems: [],
        constraints: [],
        impossibilities: [],
        historicalPerspective: { currentKnowledge: '', futureBlind: '' },
      });

      expect(provider.getCurrentMindset()).not.toBeNull();
      expect(provider.isLoaded()).toBe(true);

      provider.destroy();

      expect(provider.getCurrentMindset()).toBeNull();
      expect(provider.isLoaded()).toBe(false);
    });
  });
});
