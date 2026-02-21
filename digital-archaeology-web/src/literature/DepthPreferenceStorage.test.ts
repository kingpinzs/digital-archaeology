// src/literature/DepthPreferenceStorage.test.ts
// Tests for depth preference persistence — Story 20.13

import { describe, it, expect, beforeEach } from 'vitest';
import { DepthPreferenceStorage } from './DepthPreferenceStorage';

describe('DepthPreferenceStorage', () => {
  let storage: DepthPreferenceStorage;

  beforeEach(() => {
    localStorage.clear();
    storage = new DepthPreferenceStorage('test-depth-prefs');
  });

  describe('load', () => {
    it('returns empty array when no data stored', () => {
      const prefs = storage.load();
      expect(prefs.expandedLayers).toEqual([]);
    });

    it('returns stored preferences', () => {
      localStorage.setItem('test-depth-prefs', JSON.stringify({
        expandedLayers: ['coreConcept', 'academic'],
      }));
      const prefs = storage.load();
      expect(prefs.expandedLayers).toEqual(['coreConcept', 'academic']);
    });

    it('returns empty for corrupted data', () => {
      localStorage.setItem('test-depth-prefs', 'not-json');
      const prefs = storage.load();
      expect(prefs.expandedLayers).toEqual([]);
    });

    it('returns empty for invalid structure', () => {
      localStorage.setItem('test-depth-prefs', JSON.stringify({ expandedLayers: [42] }));
      const prefs = storage.load();
      expect(prefs.expandedLayers).toEqual([]);
    });

    it('returns empty for invalid layer names', () => {
      localStorage.setItem('test-depth-prefs', JSON.stringify({ expandedLayers: ['invalidLayer'] }));
      const prefs = storage.load();
      expect(prefs.expandedLayers).toEqual([]);
    });
  });

  describe('getExpandedLayers', () => {
    it('returns a set of expanded layers', () => {
      storage.markExpanded('coreConcept');
      storage.markExpanded('deepDive');
      const layers = storage.getExpandedLayers();
      expect(layers.has('coreConcept')).toBe(true);
      expect(layers.has('deepDive')).toBe(true);
      expect(layers.has('academic')).toBe(false);
    });
  });

  describe('markExpanded', () => {
    it('persists a layer preference', () => {
      storage.markExpanded('coreConcept');
      const prefs = storage.load();
      expect(prefs.expandedLayers).toContain('coreConcept');
    });

    it('does not duplicate layers', () => {
      storage.markExpanded('coreConcept');
      storage.markExpanded('coreConcept');
      const prefs = storage.load();
      expect(prefs.expandedLayers.filter(l => l === 'coreConcept').length).toBe(1);
    });

    it('accumulates multiple layers', () => {
      storage.markExpanded('coreConcept');
      storage.markExpanded('academic');
      storage.markExpanded('media');
      const prefs = storage.load();
      expect(prefs.expandedLayers.length).toBe(3);
    });
  });

  describe('clearAll', () => {
    it('removes all stored preferences', () => {
      storage.markExpanded('coreConcept');
      storage.markExpanded('deepDive');
      storage.clearAll();
      const prefs = storage.load();
      expect(prefs.expandedLayers).toEqual([]);
    });
  });
});
