// src/literature/hintData.test.ts
// Tests for hint data content integrity
// Story 20.5: Create Progressive Hint System — Task 7.2

import { describe, it, expect } from 'vitest';
import {
  getHintsForArticle,
  getHintCount,
  ARTICLES_WITH_HINTS,
} from './hintData';
import { LITERATURE_ARTICLES } from './literatureMetadata';

describe('hintData', () => {
  describe('ARTICLES_WITH_HINTS', () => {
    it('should be a non-empty set', () => {
      expect(ARTICLES_WITH_HINTS.size).toBeGreaterThanOrEqual(6);
    });

    it('should contain only valid article IDs', () => {
      const validIds = new Set(LITERATURE_ARTICLES.map(a => a.id));
      for (const id of ARTICLES_WITH_HINTS) {
        expect(validIds.has(id)).toBe(true);
      }
    });
  });

  describe('getHintsForArticle', () => {
    it('returns ProgressiveHint for articles with hints', () => {
      const firstHintArticle = Array.from(ARTICLES_WITH_HINTS)[0];
      const result = getHintsForArticle(firstHintArticle);
      expect(result).not.toBeNull();
      expect(result!.articleId).toBe(firstHintArticle);
      expect(result!.hints.length).toBeGreaterThanOrEqual(3);
    });

    it('returns null for articles without hints', () => {
      // Find an article without hints
      const noHintArticle = LITERATURE_ARTICLES.find(a => !ARTICLES_WITH_HINTS.has(a.id));
      expect(noHintArticle).toBeDefined();
      expect(getHintsForArticle(noHintArticle!.id)).toBeNull();
    });

    it('returns null for non-existent article IDs', () => {
      expect(getHintsForArticle('non-existent-id')).toBeNull();
    });
  });

  describe('getHintCount', () => {
    it('returns correct count for articles with hints', () => {
      for (const id of ARTICLES_WITH_HINTS) {
        const hints = getHintsForArticle(id)!;
        expect(getHintCount(id)).toBe(hints.hints.length);
      }
    });

    it('returns 0 for articles without hints', () => {
      expect(getHintCount('non-existent-id')).toBe(0);
    });
  });

  describe('hint content quality', () => {
    it('each article should have 3-5 hints', () => {
      for (const id of ARTICLES_WITH_HINTS) {
        const hints = getHintsForArticle(id)!;
        expect(hints.hints.length).toBeGreaterThanOrEqual(3);
        expect(hints.hints.length).toBeLessThanOrEqual(5);
      }
    });

    it('no hint should be empty', () => {
      for (const id of ARTICLES_WITH_HINTS) {
        const hints = getHintsForArticle(id)!;
        for (const hint of hints.hints) {
          expect(hint.trim().length).toBeGreaterThan(0);
        }
      }
    });

    it('no duplicate hints within an article', () => {
      for (const id of ARTICLES_WITH_HINTS) {
        const hints = getHintsForArticle(id)!;
        const uniqueHints = new Set(hints.hints);
        expect(uniqueHints.size).toBe(hints.hints.length);
      }
    });

    it('should cover all three categories', () => {
      const categoryCoverage = new Set<string>();
      for (const id of ARTICLES_WITH_HINTS) {
        const article = LITERATURE_ARTICLES.find(a => a.id === id);
        if (article) categoryCoverage.add(article.category);
      }
      expect(categoryCoverage.has('basic')).toBe(true);
      expect(categoryCoverage.has('intermediate')).toBe(true);
      expect(categoryCoverage.has('advanced')).toBe(true);
    });
  });
});
