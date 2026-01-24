// src/story/StoryLoader.test.ts
// Tests for StoryLoader service
// Story 10.14: Implement Story Content Data Structure
// Story 10.15: Added tests for getSceneById, getFirstScene, getCachedActs

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  StoryLoader,
  isStoryAct,
  isStoryChapter,
  isStoryScene,
  isStoryContent,
  validateStoryContent,
} from './StoryLoader';
import type {
  StoryContent,
  StoryAct,
  StoryChapter,
  StoryScene,
} from './content-types';

// Factory function for creating valid test data
const createValidStoryContent = (): StoryContent => ({
  version: '1.0.0',
  metadata: {
    title: 'Test Story',
    author: 'Test Author',
    lastUpdated: '2026-01-24',
  },
  acts: [
    {
      id: 'act-1',
      number: 1,
      title: 'Test Act',
      description: 'Test description',
      era: '1971',
      cpuStage: 'micro4',
      chapters: [
        {
          id: 'chapter-1-1',
          number: 1,
          title: 'Test Chapter',
          subtitle: 'Test Subtitle',
          year: '1971',
          scenes: [
            {
              id: 'scene-1-1-1',
              type: 'narrative',
              narrative: ['Test narrative'],
            },
          ],
        },
      ],
    },
  ],
});

// Factory function for creating index structure (for loadAllActs)
const createStoryIndex = () => ({
  version: '1.0.0',
  metadata: {
    title: 'Test Story',
    author: 'Test Author',
    lastUpdated: '2026-01-24',
  },
  actIndex: [
    { number: 1, file: 'act-1.json' },
  ],
});

const createValidStoryAct = (): StoryAct => ({
  id: 'act-1',
  number: 1,
  title: 'Test Act',
  description: 'Test description',
  era: '1971',
  cpuStage: 'micro4',
  chapters: [
    {
      id: 'chapter-1-1',
      number: 1,
      title: 'Test Chapter',
      subtitle: 'Test Subtitle',
      year: '1971',
      scenes: [
        {
          id: 'scene-1-1-1',
          type: 'narrative',
          narrative: ['Test narrative'],
        },
      ],
    },
  ],
});

const createValidStoryChapter = (): StoryChapter => ({
  id: 'chapter-1-1',
  number: 1,
  title: 'Test Chapter',
  subtitle: 'Test Subtitle',
  year: '1971',
  scenes: [
    {
      id: 'scene-1-1-1',
      type: 'narrative',
      narrative: ['Test narrative'],
    },
  ],
});

const createValidStoryScene = (): StoryScene => ({
  id: 'scene-1-1-1',
  type: 'narrative',
  narrative: ['Test narrative'],
});

describe('StoryLoader', () => {
  let loader: StoryLoader;
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    loader = new StoryLoader();
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('loadAct', () => {
    it('should load act JSON from public/story/', async () => {
      const mockAct = createValidStoryAct();
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAct),
      });

      const result = await loader.loadAct(1);

      expect(fetch).toHaveBeenCalledWith('/story/act-1.json');
      expect(result.id).toBe('act-1');
      expect(result.number).toBe(1);
    });

    it('should throw StoryLoadError for missing files', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(loader.loadAct(99)).rejects.toThrow('Failed to load act 99');
    });

    it('should throw StoryLoadError for network errors', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(loader.loadAct(1)).rejects.toThrow('Failed to load act 1');
    });

    it('should cache loaded acts', async () => {
      const mockAct = createValidStoryAct();
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAct),
      });

      // Load twice
      await loader.loadAct(1);
      await loader.loadAct(1);

      // Should only fetch once due to caching
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should validate loaded content', async () => {
      const invalidAct = { id: 'act-1' }; // Missing required fields
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(invalidAct),
      });

      await expect(loader.loadAct(1)).rejects.toThrow('Invalid act content');
    });
  });

  describe('loadAllActs', () => {
    it('should load complete story content from index', async () => {
      const mockIndex = createStoryIndex();
      const mockAct = createValidStoryAct();

      globalThis.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockIndex) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockAct) });

      const result = await loader.loadAllActs();

      expect(fetch).toHaveBeenCalledWith('/story/story-content.json');
      expect(fetch).toHaveBeenCalledWith('/story/act-1.json');
      expect(result.version).toBe('1.0.0');
      expect(result.acts.length).toBe(1);
    });

    it('should throw for invalid index structure', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ invalid: 'structure' }),
      });

      await expect(loader.loadAllActs()).rejects.toThrow('Invalid story index structure');
    });

    it('should throw for missing actIndex', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ metadata: {}, version: '1.0.0' }),
      });

      await expect(loader.loadAllActs()).rejects.toThrow('Invalid story index structure');
    });

    it('should load multiple acts in parallel', async () => {
      const mockIndex = {
        ...createStoryIndex(),
        actIndex: [
          { number: 1, file: 'act-1.json' },
          { number: 2, file: 'act-2.json' },
        ],
      };
      const mockAct1 = createValidStoryAct();
      const mockAct2 = { ...createValidStoryAct(), id: 'act-2', number: 2 };

      globalThis.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockIndex) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockAct1) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockAct2) });

      const result = await loader.loadAllActs();

      expect(result.acts.length).toBe(2);
      expect(result.acts[0].number).toBe(1);
      expect(result.acts[1].number).toBe(2);
    });

    it('should sort acts by number', async () => {
      const mockIndex = {
        ...createStoryIndex(),
        actIndex: [
          { number: 2, file: 'act-2.json' },
          { number: 1, file: 'act-1.json' },
        ],
      };
      const mockAct1 = createValidStoryAct();
      const mockAct2 = { ...createValidStoryAct(), id: 'act-2', number: 2 };

      globalThis.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockIndex) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockAct2) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockAct1) });

      const result = await loader.loadAllActs();

      // Should be sorted by number regardless of fetch order
      expect(result.acts[0].number).toBe(1);
      expect(result.acts[1].number).toBe(2);
    });
  });

  describe('clearCache', () => {
    it('should clear cached content', async () => {
      const mockAct = createValidStoryAct();
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAct),
      });

      await loader.loadAct(1);
      loader.clearCache();
      await loader.loadAct(1);

      // Should fetch twice after cache clear
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('getSceneById', () => {
    it('should return null when no content is cached', () => {
      const scene = loader.getSceneById('scene-1-1-1');
      expect(scene).toBeNull();
    });

    it('should return scene from cached act', async () => {
      const mockAct = createValidStoryAct();
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAct),
      });

      await loader.loadAct(1);
      const scene = loader.getSceneById('scene-1-1-1');

      expect(scene).not.toBeNull();
      expect(scene?.id).toBe('scene-1-1-1');
    });

    it('should return null for non-existent scene', async () => {
      const mockAct = createValidStoryAct();
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAct),
      });

      await loader.loadAct(1);
      const scene = loader.getSceneById('non-existent');

      expect(scene).toBeNull();
    });

    it('should search in storyContentCache if act cache misses', async () => {
      const mockIndex = createStoryIndex();
      const mockAct = createValidStoryAct();

      globalThis.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockIndex) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockAct) });

      await loader.loadAllActs();
      const scene = loader.getSceneById('scene-1-1-1');

      expect(scene).not.toBeNull();
      expect(scene?.id).toBe('scene-1-1-1');
    });
  });

  describe('getFirstScene', () => {
    it('should return null when no content is cached', () => {
      const scene = loader.getFirstScene();
      expect(scene).toBeNull();
    });

    it('should return first scene from storyContentCache', async () => {
      const mockIndex = createStoryIndex();
      const mockAct = createValidStoryAct();

      globalThis.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockIndex) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockAct) });

      await loader.loadAllActs();
      const scene = loader.getFirstScene();

      expect(scene).not.toBeNull();
      expect(scene?.id).toBe('scene-1-1-1');
    });

    it('should return first scene from act cache if no full content', async () => {
      const mockAct = createValidStoryAct();
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAct),
      });

      await loader.loadAct(1);
      const scene = loader.getFirstScene();

      expect(scene).not.toBeNull();
      expect(scene?.id).toBe('scene-1-1-1');
    });
  });

  describe('getCachedActs', () => {
    it('should return empty array when no content is cached', () => {
      const acts = loader.getCachedActs();
      expect(acts).toEqual([]);
    });

    it('should return acts from storyContentCache', async () => {
      const mockIndex = createStoryIndex();
      const mockAct = createValidStoryAct();

      globalThis.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockIndex) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockAct) });

      await loader.loadAllActs();
      const acts = loader.getCachedActs();

      expect(acts).toHaveLength(1);
      expect(acts[0].id).toBe('act-1');
    });

    it('should return sorted acts from act cache', async () => {
      const mockAct1 = { ...createValidStoryAct(), number: 1 };
      const mockAct2 = { ...createValidStoryAct(), id: 'act-2', number: 2 };

      globalThis.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockAct2) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockAct1) });

      // Load act 2 first, then act 1
      await loader.loadAct(2);
      await loader.loadAct(1);

      const acts = loader.getCachedActs();

      // Should be sorted by number
      expect(acts).toHaveLength(2);
      expect(acts[0].number).toBe(1);
      expect(acts[1].number).toBe(2);
    });
  });
});

describe('Type Guards', () => {
  describe('isStoryScene', () => {
    it('should return true for valid scene', () => {
      const scene = createValidStoryScene();
      expect(isStoryScene(scene)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isStoryScene(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isStoryScene(undefined)).toBe(false);
    });

    it('should return false for missing id', () => {
      const scene = { type: 'narrative' };
      expect(isStoryScene(scene)).toBe(false);
    });

    it('should return false for missing type', () => {
      const scene = { id: 'scene-1' };
      expect(isStoryScene(scene)).toBe(false);
    });

    it('should return false for invalid type value', () => {
      const scene = { id: 'scene-1', type: 'invalid' };
      expect(isStoryScene(scene)).toBe(false);
    });

    it('should accept all valid scene types', () => {
      const types = ['narrative', 'dialogue', 'choice', 'challenge'] as const;
      for (const type of types) {
        const scene = { id: 'scene-1', type };
        expect(isStoryScene(scene)).toBe(true);
      }
    });
  });

  describe('isStoryChapter', () => {
    it('should return true for valid chapter', () => {
      const chapter = createValidStoryChapter();
      expect(isStoryChapter(chapter)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isStoryChapter(null)).toBe(false);
    });

    it('should return false for missing required fields', () => {
      const chapter = { id: 'chapter-1' };
      expect(isStoryChapter(chapter)).toBe(false);
    });

    it('should return false for invalid scenes array', () => {
      const chapter = {
        id: 'chapter-1-1',
        number: 1,
        title: 'Test',
        subtitle: 'Test',
        year: '1971',
        scenes: 'not-an-array',
      };
      expect(isStoryChapter(chapter)).toBe(false);
    });

    it('should return false for empty scenes array', () => {
      const chapter = {
        id: 'chapter-1-1',
        number: 1,
        title: 'Test',
        subtitle: 'Test',
        year: '1971',
        scenes: [],
      };
      expect(isStoryChapter(chapter)).toBe(false);
    });
  });

  describe('isStoryAct', () => {
    it('should return true for valid act', () => {
      const act = createValidStoryAct();
      expect(isStoryAct(act)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isStoryAct(null)).toBe(false);
    });

    it('should return false for missing required fields', () => {
      const act = { id: 'act-1' };
      expect(isStoryAct(act)).toBe(false);
    });

    it('should return false for invalid cpuStage', () => {
      const act = {
        ...createValidStoryAct(),
        cpuStage: 'invalid-stage',
      };
      expect(isStoryAct(act)).toBe(false);
    });

    it('should accept all valid cpuStage values', () => {
      const stages = [
        'mechanical', 'relay', 'vacuum', 'transistor',
        'micro4', 'micro8', 'micro16', 'micro32', 'micro32p', 'micro32s',
      ];
      for (const stage of stages) {
        const act = { ...createValidStoryAct(), cpuStage: stage };
        expect(isStoryAct(act)).toBe(true);
      }
    });
  });

  describe('isStoryContent', () => {
    it('should return true for valid content', () => {
      const content = createValidStoryContent();
      expect(isStoryContent(content)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isStoryContent(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isStoryContent(undefined)).toBe(false);
    });

    it('should return false for missing version', () => {
      const content = { ...createValidStoryContent() };
      delete (content as Record<string, unknown>).version;
      expect(isStoryContent(content)).toBe(false);
    });

    it('should return false for missing metadata', () => {
      const content = { ...createValidStoryContent() };
      delete (content as Record<string, unknown>).metadata;
      expect(isStoryContent(content)).toBe(false);
    });

    it('should return false for empty acts array', () => {
      const content = { ...createValidStoryContent(), acts: [] };
      expect(isStoryContent(content)).toBe(false);
    });

    it('should return false for invalid act in acts array', () => {
      const content = createValidStoryContent();
      content.acts = [{ id: 'invalid' } as StoryAct];
      expect(isStoryContent(content)).toBe(false);
    });
  });
});

describe('validateStoryContent', () => {
  it('should return valid: true for valid content', () => {
    const content = createValidStoryContent();
    const result = validateStoryContent(content);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should return valid: false for null', () => {
    const result = validateStoryContent(null);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should return valid: false for missing version', () => {
    const content = { ...createValidStoryContent() };
    delete (content as Record<string, unknown>).version;
    const result = validateStoryContent(content);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing or invalid version');
  });

  it('should return valid: false for missing metadata', () => {
    const content = { ...createValidStoryContent() };
    delete (content as Record<string, unknown>).metadata;
    const result = validateStoryContent(content);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing or invalid metadata');
  });

  it('should return valid: false for missing acts', () => {
    const content = { ...createValidStoryContent() };
    delete (content as Record<string, unknown>).acts;
    const result = validateStoryContent(content);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing or invalid acts array');
  });

  it('should return valid: false for empty acts array', () => {
    const content = { ...createValidStoryContent(), acts: [] };
    const result = validateStoryContent(content);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Acts array must not be empty');
  });

  it('should return multiple errors for multiple issues', () => {
    const content = { invalid: 'content' };
    const result = validateStoryContent(content);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });

  it('should validate nested chapters', () => {
    const content = createValidStoryContent();
    content.acts[0].chapters = [];
    const result = validateStoryContent(content);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('chapters'))).toBe(true);
  });

  it('should validate nested scenes', () => {
    const content = createValidStoryContent();
    content.acts[0].chapters[0].scenes = [];
    const result = validateStoryContent(content);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('scenes'))).toBe(true);
  });
});
