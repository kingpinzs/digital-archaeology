// src/literature/depthLayerData.test.ts
// Tests for depth layer content integrity — Story 20.13

import { describe, it, expect } from 'vitest';
import {
  getDepthLayersForArticle,
  ARTICLES_WITH_DEPTH_LAYERS,
  DEPTH_LAYER_LABELS,
  DEPTH_LAYER_ORDER,
} from './depthLayerData';
import { LITERATURE_ARTICLES } from './literatureMetadata';
import { ARTICLES_WITH_DEEP_DIVES } from './deepDiveData';
import { CURATED_RESOURCES } from './curatedResources';

describe('depthLayerData', () => {
  describe('ARTICLES_WITH_DEPTH_LAYERS', () => {
    it('should be a non-empty set', () => {
      expect(ARTICLES_WITH_DEPTH_LAYERS.size).toBeGreaterThanOrEqual(6);
    });

    it('should contain only valid article IDs', () => {
      const validIds = new Set(LITERATURE_ARTICLES.map(a => a.id));
      for (const id of ARTICLES_WITH_DEPTH_LAYERS) {
        expect(validIds.has(id)).toBe(true);
      }
    });

    it('should be a subset of articles with deep-dives', () => {
      for (const id of ARTICLES_WITH_DEPTH_LAYERS) {
        expect(ARTICLES_WITH_DEEP_DIVES.has(id)).toBe(true);
      }
    });
  });

  describe('getDepthLayersForArticle', () => {
    it('returns DepthLayers for articles with depth content', () => {
      const firstId = Array.from(ARTICLES_WITH_DEPTH_LAYERS)[0];
      const result = getDepthLayersForArticle(firstId);
      expect(result).not.toBeNull();
      expect(result!.articleId).toBe(firstId);
    });

    it('returns null for articles without depth content', () => {
      const noDepth = LITERATURE_ARTICLES.find(a => !ARTICLES_WITH_DEPTH_LAYERS.has(a.id));
      expect(noDepth).toBeDefined();
      expect(getDepthLayersForArticle(noDepth!.id)).toBeNull();
    });

    it('returns null for non-existent IDs', () => {
      expect(getDepthLayersForArticle('non-existent')).toBeNull();
    });
  });

  describe('content quality', () => {
    it('each article should have substantive coreConcept (100+ chars)', () => {
      for (const id of ARTICLES_WITH_DEPTH_LAYERS) {
        const layers = getDepthLayersForArticle(id)!;
        expect(layers.coreConcept.length).toBeGreaterThanOrEqual(100);
      }
    });

    it('each article should have at least 1 academic reference', () => {
      for (const id of ARTICLES_WITH_DEPTH_LAYERS) {
        const layers = getDepthLayersForArticle(id)!;
        expect(layers.academic.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('each article should have at least 1 media link', () => {
      for (const id of ARTICLES_WITH_DEPTH_LAYERS) {
        const layers = getDepthLayersForArticle(id)!;
        expect(layers.media.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('each article should have at least 1 interactive link', () => {
      for (const id of ARTICLES_WITH_DEPTH_LAYERS) {
        const layers = getDepthLayersForArticle(id)!;
        expect(layers.interactive.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('media resource IDs should reference valid curated resources', () => {
      const validIds = new Set(CURATED_RESOURCES.map(r => r.id));
      for (const id of ARTICLES_WITH_DEPTH_LAYERS) {
        const layers = getDepthLayersForArticle(id)!;
        for (const link of layers.media) {
          expect(validIds.has(link.resourceId)).toBe(true);
        }
      }
    });

    it('interactive resource IDs should reference valid curated resources', () => {
      const validIds = new Set(CURATED_RESOURCES.map(r => r.id));
      for (const id of ARTICLES_WITH_DEPTH_LAYERS) {
        const layers = getDepthLayersForArticle(id)!;
        for (const link of layers.interactive) {
          expect(validIds.has(link.resourceId)).toBe(true);
        }
      }
    });
  });

  describe('DEPTH_LAYER_LABELS and ORDER', () => {
    it('should have labels for all layers in order', () => {
      for (const layer of DEPTH_LAYER_ORDER) {
        expect(DEPTH_LAYER_LABELS[layer]).toBeDefined();
        expect(DEPTH_LAYER_LABELS[layer].length).toBeGreaterThan(0);
      }
    });

    it('should have 5 layers', () => {
      expect(DEPTH_LAYER_ORDER.length).toBe(5);
    });
  });
});
