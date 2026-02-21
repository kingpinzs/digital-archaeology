// src/literature/literatureMetadata.test.ts
// Tests for literature article metadata validation
// Story 20.1: Create Literature Browser — Task 8.2

import { describe, it, expect } from 'vitest';
import {
  LITERATURE_ARTICLES,
  CATEGORY_METADATA,
  getArticlesByCategory,
  getArticlesWithMetadata,
  findArticleById,
  getCategoryArticleCount,
  getCategoryTotalReadTime,
  getCategoryStages,
} from './literatureMetadata';
import { CATEGORY_LABELS, CATEGORY_ORDER } from './types';
import type { LiteratureCategory } from './types';
import type { LabStage } from '@ui/StageSelector';

describe('literatureMetadata', () => {
  describe('LITERATURE_ARTICLES', () => {
    it('should contain all 20 articles (Story 20.1 AC 1)', () => {
      expect(LITERATURE_ARTICLES).toHaveLength(20);
    });

    it('should have 6 Basic articles (articles 1-6, AC 2)', () => {
      expect(LITERATURE_ARTICLES.filter(a => a.category === 'basic')).toHaveLength(6);
    });

    it('should have 6 Intermediate articles (articles 7-12, AC 2)', () => {
      expect(LITERATURE_ARTICLES.filter(a => a.category === 'intermediate')).toHaveLength(6);
    });

    it('should have 8 Advanced articles (articles 13-20, AC 2)', () => {
      expect(LITERATURE_ARTICLES.filter(a => a.category === 'advanced')).toHaveLength(8);
    });

    it('should have unique IDs across all articles', () => {
      const ids = LITERATURE_ARTICLES.map(a => a.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have IDs matching the lit-NN pattern', () => {
      for (const article of LITERATURE_ARTICLES) {
        expect(article.id).toMatch(/^lit-\d{2}$/);
      }
    });

    it('should have all required properties for each article', () => {
      for (const article of LITERATURE_ARTICLES) {
        expect(article.id).toBeTruthy();
        expect(article.title).toBeTruthy();
        expect(article.category).toBeTruthy();
        expect(article.description).toBeTruthy();
        expect(article.tags).toBeDefined();
        expect(Array.isArray(article.tags)).toBe(true);
        expect(article.estimatedReadTime).toBeGreaterThan(0);
        expect(article.relatedStages).toBeDefined();
        expect(Array.isArray(article.relatedStages)).toBe(true);
      }
    });

    it('should have at least one tag for each article', () => {
      for (const article of LITERATURE_ARTICLES) {
        expect(article.tags.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('should have at least one related stage for each article', () => {
      for (const article of LITERATURE_ARTICLES) {
        expect(article.relatedStages.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('should only use valid categories', () => {
      const validCategories: LiteratureCategory[] = ['basic', 'intermediate', 'advanced'];
      for (const article of LITERATURE_ARTICLES) {
        expect(validCategories).toContain(article.category);
        expect(CATEGORY_LABELS[article.category]).toBeDefined();
      }
    });

    it('should only use valid lab stages in relatedStages', () => {
      const validStages: LabStage[] = ['micro4', 'micro8', 'micro16', 'micro32', 'micro32p', 'micro32s'];
      for (const article of LITERATURE_ARTICLES) {
        for (const stage of article.relatedStages) {
          expect(validStages).toContain(stage);
        }
      }
    });

    it('should have positive estimated read times (in minutes)', () => {
      for (const article of LITERATURE_ARTICLES) {
        expect(article.estimatedReadTime).toBeGreaterThanOrEqual(1);
        expect(article.estimatedReadTime).toBeLessThanOrEqual(60);
      }
    });

    it('should have articles ordered by ID (lit-01 through lit-20)', () => {
      for (let i = 0; i < LITERATURE_ARTICLES.length; i++) {
        const expectedId = `lit-${String(i + 1).padStart(2, '0')}`;
        expect(LITERATURE_ARTICLES[i].id).toBe(expectedId);
      }
    });

    it('should have Basic articles first, then Intermediate, then Advanced', () => {
      const categories = LITERATURE_ARTICLES.map(a => a.category);
      const basicEnd = categories.lastIndexOf('basic');
      const intermediateStart = categories.indexOf('intermediate');
      const intermediateEnd = categories.lastIndexOf('intermediate');
      const advancedStart = categories.indexOf('advanced');

      expect(basicEnd).toBeLessThan(intermediateStart);
      expect(intermediateEnd).toBeLessThan(advancedStart);
    });
  });

  describe('getArticlesByCategory', () => {
    it('should return a Map with all 3 categories', () => {
      const grouped = getArticlesByCategory();
      expect(grouped.size).toBe(CATEGORY_ORDER.length);

      for (const category of CATEGORY_ORDER) {
        expect(grouped.has(category)).toBe(true);
        expect(grouped.get(category)!.length).toBeGreaterThan(0);
      }
    });

    it('should group Basic articles correctly (6 articles)', () => {
      const grouped = getArticlesByCategory();
      const basicArticles = grouped.get('basic')!;
      expect(basicArticles).toHaveLength(6);
      for (const a of basicArticles) {
        expect(a.category).toBe('basic');
      }
    });

    it('should group Intermediate articles correctly (6 articles)', () => {
      const grouped = getArticlesByCategory();
      const intermediateArticles = grouped.get('intermediate')!;
      expect(intermediateArticles).toHaveLength(6);
      for (const a of intermediateArticles) {
        expect(a.category).toBe('intermediate');
      }
    });

    it('should group Advanced articles correctly (8 articles)', () => {
      const grouped = getArticlesByCategory();
      const advancedArticles = grouped.get('advanced')!;
      expect(advancedArticles).toHaveLength(8);
      for (const a of advancedArticles) {
        expect(a.category).toBe('advanced');
      }
    });

    it('should include all articles when summed across categories', () => {
      const grouped = getArticlesByCategory();
      let total = 0;
      for (const articles of grouped.values()) {
        total += articles.length;
      }
      expect(total).toBe(LITERATURE_ARTICLES.length);
    });
  });

  describe('findArticleById', () => {
    it('should find existing article by ID', () => {
      const article = findArticleById('lit-01');
      expect(article).not.toBeUndefined();
      expect(article!.title).toBe('Binary Numbers & Digital Representation');
      expect(article!.category).toBe('basic');
    });

    it('should find last article by ID', () => {
      const article = findArticleById('lit-20');
      expect(article).not.toBeUndefined();
      expect(article!.title).toBe('Modern Processor Design');
      expect(article!.category).toBe('advanced');
    });

    it('should return undefined for non-existent ID', () => {
      const article = findArticleById('lit-99');
      expect(article).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      const article = findArticleById('');
      expect(article).toBeUndefined();
    });

    it('should be case-sensitive', () => {
      const article = findArticleById('LIT-01');
      expect(article).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Story 20.2: CategoryMetadata & helper functions
  // ---------------------------------------------------------------------------

  describe('CATEGORY_METADATA (Story 20.2, AC 3)', () => {
    it('should contain all 3 categories', () => {
      expect(Object.keys(CATEGORY_METADATA)).toHaveLength(3);
      expect(CATEGORY_METADATA.basic).toBeDefined();
      expect(CATEGORY_METADATA.intermediate).toBeDefined();
      expect(CATEGORY_METADATA.advanced).toBeDefined();
    });

    it('should have matching key and label for each category', () => {
      for (const category of CATEGORY_ORDER) {
        const meta = CATEGORY_METADATA[category];
        expect(meta.key).toBe(category);
        expect(meta.label).toBe(CATEGORY_LABELS[category]);
      }
    });

    it('should have non-empty descriptions for each category', () => {
      for (const category of CATEGORY_ORDER) {
        expect(CATEGORY_METADATA[category].description).toBeTruthy();
        expect(CATEGORY_METADATA[category].description.length).toBeGreaterThan(10);
      }
    });

    it('should have non-empty icons for each category', () => {
      for (const category of CATEGORY_ORDER) {
        expect(CATEGORY_METADATA[category].icon).toBeTruthy();
      }
    });

    it('should have valid relatedStages for each category', () => {
      const validStages: LabStage[] = ['micro4', 'micro8', 'micro16', 'micro32', 'micro32p', 'micro32s'];
      for (const category of CATEGORY_ORDER) {
        const meta = CATEGORY_METADATA[category];
        expect(meta.relatedStages.length).toBeGreaterThanOrEqual(1);
        for (const stage of meta.relatedStages) {
          expect(validStages).toContain(stage);
        }
      }
    });

    it('should have basic category related to micro4', () => {
      expect(CATEGORY_METADATA.basic.relatedStages).toContain('micro4');
    });

    it('should have intermediate category related to micro4, micro8, micro16', () => {
      expect(CATEGORY_METADATA.intermediate.relatedStages).toContain('micro4');
      expect(CATEGORY_METADATA.intermediate.relatedStages).toContain('micro8');
      expect(CATEGORY_METADATA.intermediate.relatedStages).toContain('micro16');
    });

    it('should have advanced category related to micro32, micro32p, micro32s', () => {
      expect(CATEGORY_METADATA.advanced.relatedStages).toContain('micro32');
      expect(CATEGORY_METADATA.advanced.relatedStages).toContain('micro32p');
      expect(CATEGORY_METADATA.advanced.relatedStages).toContain('micro32s');
    });
  });

  describe('getCategoryArticleCount (Story 20.2, AC 6)', () => {
    it('should return 6 for basic category', () => {
      expect(getCategoryArticleCount('basic')).toBe(6);
    });

    it('should return 6 for intermediate category', () => {
      expect(getCategoryArticleCount('intermediate')).toBe(6);
    });

    it('should return 8 for advanced category', () => {
      expect(getCategoryArticleCount('advanced')).toBe(8);
    });

    it('should sum to total article count', () => {
      const total = getCategoryArticleCount('basic')
        + getCategoryArticleCount('intermediate')
        + getCategoryArticleCount('advanced');
      expect(total).toBe(LITERATURE_ARTICLES.length);
    });
  });

  describe('getCategoryTotalReadTime (Story 20.2, AC 6)', () => {
    it('should return positive sum for basic category', () => {
      const time = getCategoryTotalReadTime('basic');
      expect(time).toBeGreaterThan(0);
    });

    it('should return correct sum for basic (8+10+12+10+9+7 = 56)', () => {
      expect(getCategoryTotalReadTime('basic')).toBe(56);
    });

    it('should return correct sum for intermediate (12+14+11+10+11+13 = 71)', () => {
      expect(getCategoryTotalReadTime('intermediate')).toBe(71);
    });

    it('should return correct sum for advanced (15+14+14+12+13+15+12+16 = 111)', () => {
      expect(getCategoryTotalReadTime('advanced')).toBe(111);
    });

    it('should sum across all categories to total read time', () => {
      const total = getCategoryTotalReadTime('basic')
        + getCategoryTotalReadTime('intermediate')
        + getCategoryTotalReadTime('advanced');
      const expected = LITERATURE_ARTICLES.reduce((sum, a) => sum + a.estimatedReadTime, 0);
      expect(total).toBe(expected);
    });
  });

  describe('getCategoryStages (Story 20.2, AC 6)', () => {
    it('should return [micro4] for basic category', () => {
      const stages = getCategoryStages('basic');
      expect(stages).toContain('micro4');
      expect(stages).toHaveLength(1);
    });

    it('should return stages for intermediate category', () => {
      const stages = getCategoryStages('intermediate');
      expect(stages).toContain('micro4');
      expect(stages).toContain('micro8');
      expect(stages).toContain('micro16');
    });

    it('should return stages for advanced category', () => {
      const stages = getCategoryStages('advanced');
      expect(stages).toContain('micro32');
      expect(stages).toContain('micro32p');
      expect(stages).toContain('micro32s');
    });

    it('should return unique stages (no duplicates)', () => {
      for (const category of CATEGORY_ORDER) {
        const stages = getCategoryStages(category);
        const unique = new Set(stages);
        expect(unique.size).toBe(stages.length);
      }
    });

    it('should match CATEGORY_METADATA.relatedStages for each category (L7 guard)', () => {
      for (const category of CATEGORY_ORDER) {
        const fromArticles = new Set(getCategoryStages(category));
        const fromMetadata = new Set(CATEGORY_METADATA[category].relatedStages);
        expect(fromArticles).toEqual(fromMetadata);
      }
    });
  });

  describe('getArticlesWithMetadata (Story 20.2, AC 7)', () => {
    it('should return a Map with all 3 categories', () => {
      const result = getArticlesWithMetadata();
      expect(result.size).toBe(3);
      for (const category of CATEGORY_ORDER) {
        expect(result.has(category)).toBe(true);
      }
    });

    it('should include CategoryMetadata for each category', () => {
      const result = getArticlesWithMetadata();
      for (const category of CATEGORY_ORDER) {
        const entry = result.get(category)!;
        expect(entry.metadata).toBeDefined();
        expect(entry.metadata.key).toBe(category);
        expect(entry.metadata.label).toBe(CATEGORY_LABELS[category]);
        expect(entry.metadata.description).toBeTruthy();
      }
    });

    it('should include articles for each category', () => {
      const result = getArticlesWithMetadata();
      expect(result.get('basic')!.articles).toHaveLength(6);
      expect(result.get('intermediate')!.articles).toHaveLength(6);
      expect(result.get('advanced')!.articles).toHaveLength(8);
    });

    it('should group articles by their category', () => {
      const result = getArticlesWithMetadata();
      for (const category of CATEGORY_ORDER) {
        const entry = result.get(category)!;
        for (const article of entry.articles) {
          expect(article.category).toBe(category);
        }
      }
    });
  });
});
