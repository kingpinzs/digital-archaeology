// src/literature/DepthPreferenceStorage.ts
// Persists user depth layer expansion preferences — Story 20.13
// Follows the same localStorage pattern as ReadingProgressStorage and HintProgressStorage.

import type { DepthLayerName } from './depthLayerData';

interface DepthPreferences {
  /** Layers the user has expanded at least once (auto-expand on future views) */
  expandedLayers: DepthLayerName[];
}

function isValidDepthPreferences(data: unknown): data is DepthPreferences {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  if (!Array.isArray(obj.expandedLayers)) return false;
  const validLayers: string[] = ['coreConcept', 'deepDive', 'academic', 'media', 'interactive'];
  return obj.expandedLayers.every((l: unknown) => typeof l === 'string' && validLayers.includes(l));
}

export class DepthPreferenceStorage {
  private readonly storageKey: string;

  constructor(key = 'da-depth-preferences') {
    this.storageKey = key;
  }

  /** Load preferences from localStorage */
  load(): DepthPreferences {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return { expandedLayers: [] };
      const parsed: unknown = JSON.parse(raw);
      if (isValidDepthPreferences(parsed)) return parsed;
      return { expandedLayers: [] };
    } catch {
      console.error('Failed to load depth preferences');
      return { expandedLayers: [] };
    }
  }

  /** Get the set of layers the user prefers expanded */
  getExpandedLayers(): ReadonlySet<DepthLayerName> {
    return new Set(this.load().expandedLayers);
  }

  /** Mark a layer as preferred-expanded */
  markExpanded(layer: DepthLayerName): void {
    const prefs = this.load();
    if (!prefs.expandedLayers.includes(layer)) {
      prefs.expandedLayers.push(layer);
      this.save(prefs);
    }
  }

  /** Clear all preferences */
  clearAll(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      console.error('Failed to clear depth preferences');
    }
  }

  private save(prefs: DepthPreferences): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(prefs));
    } catch {
      console.error('Failed to save depth preferences');
    }
  }
}
