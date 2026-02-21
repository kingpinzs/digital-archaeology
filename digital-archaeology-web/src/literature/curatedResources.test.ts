// src/literature/curatedResources.test.ts
// Tests for curated resource data integrity
// Stories 20-7 through 20-12: Curated Content

import { describe, it, expect } from 'vitest';
import {
  CURATED_RESOURCES,
  RESOURCE_TYPE_LABELS,
  RESOURCE_TYPE_ORDER,
  getResourcesByType,
  getResourceCount,
  getAllEras,
} from './curatedResources';

describe('curatedResources', () => {
  describe('CURATED_RESOURCES', () => {
    it('should contain resources for all 6 types', () => {
      const types = new Set(CURATED_RESOURCES.map(r => r.type));
      expect(types.size).toBe(6);
      for (const type of RESOURCE_TYPE_ORDER) {
        expect(types.has(type)).toBe(true);
      }
    });

    it('should have unique IDs', () => {
      const ids = CURATED_RESOURCES.map(r => r.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('every resource should have required fields', () => {
      for (const resource of CURATED_RESOURCES) {
        expect(resource.id.length).toBeGreaterThan(0);
        expect(resource.title.length).toBeGreaterThan(0);
        expect(resource.era.length).toBeGreaterThan(0);
        expect(resource.description.length).toBeGreaterThanOrEqual(50);
        expect(resource.whereToAccess.length).toBeGreaterThan(0);
        expect(resource.tags.length).toBeGreaterThan(0);
      }
    });
  });

  describe('getResourcesByType', () => {
    it('returns documentaries for documentary type', () => {
      const docs = getResourcesByType('documentary');
      expect(docs.length).toBeGreaterThanOrEqual(10);
      expect(docs.every(r => r.type === 'documentary')).toBe(true);
    });

    it('returns TV shows for tv type', () => {
      const shows = getResourcesByType('tv');
      expect(shows.length).toBeGreaterThanOrEqual(4);
      expect(shows.every(r => r.type === 'tv')).toBe(true);
    });

    it('returns YouTube channels for youtube type', () => {
      const channels = getResourcesByType('youtube');
      expect(channels.length).toBeGreaterThanOrEqual(8);
      expect(channels.every(r => r.type === 'youtube')).toBe(true);
    });

    it('returns books for book type', () => {
      const books = getResourcesByType('book');
      expect(books.length).toBeGreaterThanOrEqual(7);
      expect(books.every(r => r.type === 'book')).toBe(true);
    });

    it('returns museums for museum type', () => {
      const museums = getResourcesByType('museum');
      expect(museums.length).toBeGreaterThanOrEqual(6);
      expect(museums.every(r => r.type === 'museum')).toBe(true);
    });

    it('returns simulators for simulator type', () => {
      const sims = getResourcesByType('simulator');
      expect(sims.length).toBeGreaterThanOrEqual(6);
      expect(sims.every(r => r.type === 'simulator')).toBe(true);
    });
  });

  describe('getResourceCount', () => {
    it('returns correct count for each type', () => {
      for (const type of RESOURCE_TYPE_ORDER) {
        expect(getResourceCount(type)).toBe(getResourcesByType(type).length);
      }
    });
  });

  describe('getAllEras', () => {
    it('returns unique sorted eras', () => {
      const eras = getAllEras();
      expect(eras.length).toBeGreaterThan(0);
      // Check sorted
      const sorted = [...eras].sort();
      expect(eras).toEqual(sorted);
      // Check unique
      expect(new Set(eras).size).toBe(eras.length);
    });
  });

  describe('RESOURCE_TYPE_LABELS', () => {
    it('has labels for all types in RESOURCE_TYPE_ORDER', () => {
      for (const type of RESOURCE_TYPE_ORDER) {
        expect(RESOURCE_TYPE_LABELS[type]).toBeDefined();
        expect(RESOURCE_TYPE_LABELS[type].length).toBeGreaterThan(0);
      }
    });
  });

  describe('content quality', () => {
    it('documentaries should have year and creator', () => {
      for (const doc of getResourcesByType('documentary')) {
        expect(doc.year).toBeDefined();
        expect(doc.creator).toBeDefined();
      }
    });

    it('books should have creator (author)', () => {
      for (const book of getResourcesByType('book')) {
        expect(book.creator).toBeDefined();
        expect(book.creator!.length).toBeGreaterThan(0);
      }
    });

    it('museums should have location in creator field', () => {
      for (const museum of getResourcesByType('museum')) {
        expect(museum.creator).toBeDefined();
        expect(museum.creator!.length).toBeGreaterThan(0);
      }
    });
  });
});
