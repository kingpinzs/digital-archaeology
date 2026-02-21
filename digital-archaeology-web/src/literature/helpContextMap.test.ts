// src/literature/helpContextMap.test.ts
// Tests for help context mapping (Story 20.3)

import { describe, it, expect } from 'vitest';
import {
  HELP_CONTEXT_MAP,
  getContextualArticles,
  getContextFilter,
} from './helpContextMap';
import { LITERATURE_ARTICLES } from './literatureMetadata';
import type { HelpContext } from './types';

const ALL_CONTEXTS: HelpContext[] = ['circuit', 'registers', 'flags', 'memory', 'stack', 'code-editor'];

describe('helpContextMap', () => {
  describe('HELP_CONTEXT_MAP', () => {
    it('should have all 6 help contexts', () => {
      expect(Object.keys(HELP_CONTEXT_MAP)).toHaveLength(6);
      for (const ctx of ALL_CONTEXTS) {
        expect(HELP_CONTEXT_MAP[ctx]).toBeDefined();
      }
    });

    it('should have non-empty tags for each context', () => {
      for (const ctx of ALL_CONTEXTS) {
        const filter = HELP_CONTEXT_MAP[ctx];
        expect(filter.tags).toBeDefined();
        expect(filter.tags!.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('should have a contextLabel for each context', () => {
      for (const ctx of ALL_CONTEXTS) {
        expect(HELP_CONTEXT_MAP[ctx].contextLabel).toBeTruthy();
      }
    });

    it('should have circuit context with gate/ALU related tags', () => {
      const tags = HELP_CONTEXT_MAP['circuit'].tags!;
      expect(tags).toContain('gates');
      expect(tags).toContain('alu');
    });

    it('should have registers context with register related tags', () => {
      const tags = HELP_CONTEXT_MAP['registers'].tags!;
      expect(tags).toContain('registers');
    });

    it('should have code-editor context with encoding related tags', () => {
      const tags = HELP_CONTEXT_MAP['code-editor'].tags!;
      expect(tags).toContain('encoding');
      expect(tags).toContain('opcode');
    });
  });

  describe('getContextualArticles', () => {
    it('should return articles matching circuit context tags', () => {
      const articles = getContextualArticles('circuit');
      expect(articles.length).toBeGreaterThanOrEqual(3);
      // Should include Logic Gates (lit-02), Boolean Algebra (lit-03), ALU (lit-04)
      const ids = articles.map(a => a.id);
      expect(ids).toContain('lit-02');
      expect(ids).toContain('lit-03');
      expect(ids).toContain('lit-04');
    });

    it('should return articles matching registers context tags', () => {
      const articles = getContextualArticles('registers');
      expect(articles.length).toBeGreaterThanOrEqual(1);
      const ids = articles.map(a => a.id);
      expect(ids).toContain('lit-05'); // Registers & Flip-Flops
    });

    it('should return articles matching memory context tags', () => {
      const articles = getContextualArticles('memory');
      expect(articles.length).toBeGreaterThanOrEqual(1);
      const ids = articles.map(a => a.id);
      expect(ids).toContain('lit-09'); // Memory Architecture
    });

    it('should return articles matching stack context tags', () => {
      const articles = getContextualArticles('stack');
      expect(articles.length).toBeGreaterThanOrEqual(1);
      const ids = articles.map(a => a.id);
      expect(ids).toContain('lit-10'); // Subroutines & Call Stack
    });

    it('should return articles matching code-editor context tags', () => {
      const articles = getContextualArticles('code-editor');
      expect(articles.length).toBeGreaterThanOrEqual(1);
      const ids = articles.map(a => a.id);
      expect(ids).toContain('lit-07'); // Instruction Encoding
    });

    it('should never return an empty array for any context', () => {
      for (const ctx of ALL_CONTEXTS) {
        const articles = getContextualArticles(ctx);
        expect(articles.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('should return a subset of all articles', () => {
      for (const ctx of ALL_CONTEXTS) {
        const articles = getContextualArticles(ctx);
        expect(articles.length).toBeLessThanOrEqual(LITERATURE_ARTICLES.length);
      }
    });

    it('should return only articles from LITERATURE_ARTICLES', () => {
      const allIds = new Set(LITERATURE_ARTICLES.map(a => a.id));
      for (const ctx of ALL_CONTEXTS) {
        const articles = getContextualArticles(ctx);
        for (const article of articles) {
          expect(allIds).toContain(article.id);
        }
      }
    });

    it('should filter by stage when provided (micro4)', () => {
      const withStage = getContextualArticles('circuit', 'micro4');
      const withoutStage = getContextualArticles('circuit');
      // Stage-filtered should be subset (or equal if all match)
      expect(withStage.length).toBeLessThanOrEqual(withoutStage.length);
      expect(withStage.length).toBeGreaterThanOrEqual(1);
    });

    it('should fall back to tag-only when stage yields no results', () => {
      // 'circuit' context has basic articles (micro4), filtering by micro32s
      // should fall back to tag-only since no circuit articles are micro32s-related
      const articles = getContextualArticles('circuit', 'micro32s');
      expect(articles.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getContextFilter', () => {
    it('should return a ContextFilter for each context', () => {
      for (const ctx of ALL_CONTEXTS) {
        const filter = getContextFilter(ctx);
        expect(filter).toBeDefined();
        expect(filter.tags).toBeDefined();
        expect(filter.contextLabel).toBeTruthy();
      }
    });

    it('should return the base filter when no stage provided', () => {
      const filter = getContextFilter('circuit');
      expect(filter.tags).toEqual(HELP_CONTEXT_MAP['circuit'].tags);
      expect(filter.contextLabel).toBe(HELP_CONTEXT_MAP['circuit'].contextLabel);
    });

    it('should include stage in filter when provided', () => {
      const filter = getContextFilter('circuit', 'micro4');
      expect(filter.stages).toBeDefined();
      expect(filter.stages).toContain('micro4');
    });

    it('should preserve contextLabel regardless of stage', () => {
      const filter = getContextFilter('registers', 'micro8');
      expect(filter.contextLabel).toBe('Registers');
    });
  });
});
