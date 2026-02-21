// src/literature/deepDiveData.test.ts
// Tests for deep-dive content integrity
// Story 20.6: Create Technical Deep-Dives — Task 4.1

import { describe, it, expect } from 'vitest';
import { getDeepDiveForArticle, ARTICLES_WITH_DEEP_DIVES } from './deepDiveData';
import { LITERATURE_ARTICLES } from './literatureMetadata';

describe('deepDiveData', () => {
  describe('ARTICLES_WITH_DEEP_DIVES', () => {
    it('should be a non-empty set', () => {
      expect(ARTICLES_WITH_DEEP_DIVES.size).toBeGreaterThanOrEqual(6);
    });

    it('should contain only valid article IDs', () => {
      const validIds = new Set(LITERATURE_ARTICLES.map(a => a.id));
      for (const id of ARTICLES_WITH_DEEP_DIVES) {
        expect(validIds.has(id)).toBe(true);
      }
    });
  });

  describe('getDeepDiveForArticle', () => {
    it('returns DeepDive for articles with deep-dives', () => {
      const firstArticle = Array.from(ARTICLES_WITH_DEEP_DIVES)[0];
      const result = getDeepDiveForArticle(firstArticle);
      expect(result).not.toBeNull();
      expect(result!.articleId).toBe(firstArticle);
    });

    it('returns null for articles without deep-dives', () => {
      const noDeepDive = LITERATURE_ARTICLES.find(a => !ARTICLES_WITH_DEEP_DIVES.has(a.id));
      expect(noDeepDive).toBeDefined();
      expect(getDeepDiveForArticle(noDeepDive!.id)).toBeNull();
    });

    it('returns null for non-existent article IDs', () => {
      expect(getDeepDiveForArticle('non-existent')).toBeNull();
    });
  });

  describe('deep-dive content quality', () => {
    it('each deep-dive should have all 4 sections', () => {
      for (const id of ARTICLES_WITH_DEEP_DIVES) {
        const dd = getDeepDiveForArticle(id)!;
        expect(dd.explanation.trim().length).toBeGreaterThan(0);
        expect(dd.historicalContext.trim().length).toBeGreaterThan(0);
        expect(dd.tradeOffs.trim().length).toBeGreaterThan(0);
        expect(dd.realWorldExamples.trim().length).toBeGreaterThan(0);
      }
    });

    it('each section should be substantive (100+ characters)', () => {
      for (const id of ARTICLES_WITH_DEEP_DIVES) {
        const dd = getDeepDiveForArticle(id)!;
        expect(dd.explanation.length).toBeGreaterThanOrEqual(100);
        expect(dd.historicalContext.length).toBeGreaterThanOrEqual(100);
        expect(dd.tradeOffs.length).toBeGreaterThanOrEqual(100);
        expect(dd.realWorldExamples.length).toBeGreaterThanOrEqual(100);
      }
    });

    it('should cover multiple categories', () => {
      const categoryCoverage = new Set<string>();
      for (const id of ARTICLES_WITH_DEEP_DIVES) {
        const article = LITERATURE_ARTICLES.find(a => a.id === id);
        if (article) categoryCoverage.add(article.category);
      }
      expect(categoryCoverage.size).toBeGreaterThanOrEqual(2);
    });
  });
});
