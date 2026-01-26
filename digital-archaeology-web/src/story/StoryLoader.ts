// src/story/StoryLoader.ts
// Story content loader service with caching and validation
// Story 10.14: Implement Story Content Data Structure

import type {
  StoryContent,
  StoryAct,
  StoryChapter,
  StoryScene,
  StoryMetadata,
  ValidationResult,
} from './content-types';
import { StoryLoadError, StoryValidationError } from './content-types';

/** Valid CPU stages for type guard validation (must match CpuStage type) */
const VALID_CPU_STAGES: readonly string[] = [
  'mechanical',
  'relay',
  'vacuum',
  'transistor',
  'micro4',
  'micro8',
  'micro16',
  'micro32',
  'micro32p',
  'micro32s',
  'future',
];

/** Valid scene types for type guard validation (must match SceneType type) */
const VALID_SCENE_TYPES: readonly string[] = ['narrative', 'dialogue', 'choice', 'challenge', 'persona', 'transition'];

/**
 * Type guard to check if a value is valid TransitionData.
 * Issue 4 fix: validates optional transition field structure.
 */
function isTransitionData(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;

  return (
    typeof obj.outgoingPersonaId === 'string' &&
    typeof obj.incomingPersonaId === 'string' &&
    typeof obj.yearsElapsed === 'number' &&
    Array.isArray(obj.narrative) &&
    typeof obj.outgoingEra === 'string' &&
    typeof obj.incomingEra === 'string'
  );
}

/**
 * Type guard to check if a value is a valid StoryScene.
 */
export function isStoryScene(value: unknown): value is StoryScene {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;

  if (typeof obj.id !== 'string') return false;
  if (typeof obj.type !== 'string') return false;
  if (!VALID_SCENE_TYPES.includes(obj.type)) return false;

  return true;
}

/**
 * Type guard to check if a value is a valid StoryChapter.
 */
export function isStoryChapter(value: unknown): value is StoryChapter {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;

  if (typeof obj.id !== 'string') return false;
  if (typeof obj.number !== 'number') return false;
  if (typeof obj.title !== 'string') return false;
  if (typeof obj.subtitle !== 'string') return false;
  if (typeof obj.year !== 'string') return false;
  if (!Array.isArray(obj.scenes)) return false;
  if (obj.scenes.length === 0) return false;

  // Validate all scenes
  for (const scene of obj.scenes) {
    if (!isStoryScene(scene)) return false;
  }

  return true;
}

/**
 * Type guard to check if a value is a valid StoryAct.
 */
export function isStoryAct(value: unknown): value is StoryAct {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;

  if (typeof obj.id !== 'string') return false;
  if (typeof obj.number !== 'number') return false;
  if (typeof obj.title !== 'string') return false;
  if (typeof obj.description !== 'string') return false;
  if (typeof obj.era !== 'string') return false;
  if (typeof obj.cpuStage !== 'string') return false;
  if (!VALID_CPU_STAGES.includes(obj.cpuStage)) return false;
  if (!Array.isArray(obj.chapters)) return false;
  if (obj.chapters.length === 0) return false;

  // Validate all chapters
  for (const chapter of obj.chapters) {
    if (!isStoryChapter(chapter)) return false;
  }

  // Validate optional transition field if present (Issue 4 fix)
  if (obj.transition !== undefined && !isTransitionData(obj.transition)) return false;

  return true;
}

/**
 * Type guard to check if a value is valid StoryMetadata.
 */
function isStoryMetadata(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;

  return (
    typeof obj.title === 'string' &&
    typeof obj.author === 'string' &&
    typeof obj.lastUpdated === 'string'
  );
}

/**
 * Type guard to check if a value is valid StoryContent.
 */
export function isStoryContent(value: unknown): value is StoryContent {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;

  if (typeof obj.version !== 'string') return false;
  if (!isStoryMetadata(obj.metadata)) return false;
  if (!Array.isArray(obj.acts)) return false;
  if (obj.acts.length === 0) return false;

  // Validate all acts
  for (const act of obj.acts) {
    if (!isStoryAct(act)) return false;
  }

  return true;
}

/**
 * Validate story content and return detailed errors.
 */
export function validateStoryContent(value: unknown): ValidationResult {
  const errors: string[] = [];

  if (!value || typeof value !== 'object') {
    return { valid: false, errors: ['Content must be an object'] };
  }

  const obj = value as Record<string, unknown>;

  // Check version
  if (typeof obj.version !== 'string') {
    errors.push('Missing or invalid version');
  }

  // Check metadata
  if (!isStoryMetadata(obj.metadata)) {
    errors.push('Missing or invalid metadata');
  }

  // Check acts
  if (!Array.isArray(obj.acts)) {
    errors.push('Missing or invalid acts array');
  } else if (obj.acts.length === 0) {
    errors.push('Acts array must not be empty');
  } else {
    // Validate each act
    for (let i = 0; i < obj.acts.length; i++) {
      const act = obj.acts[i] as Record<string, unknown>;
      if (!act || typeof act !== 'object') {
        errors.push(`Act ${i} is invalid`);
        continue;
      }

      if (!Array.isArray(act.chapters) || act.chapters.length === 0) {
        errors.push(`Act ${i} must have at least one chapter in chapters array`);
      } else {
        // Validate chapters
        for (let j = 0; j < act.chapters.length; j++) {
          const chapter = act.chapters[j] as Record<string, unknown>;
          if (!chapter || typeof chapter !== 'object') {
            errors.push(`Act ${i}, Chapter ${j} is invalid`);
            continue;
          }

          if (!Array.isArray(chapter.scenes) || chapter.scenes.length === 0) {
            errors.push(`Act ${i}, Chapter ${j} must have at least one scene in scenes array`);
          }
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Service for loading and caching story content from JSON files.
 */
export class StoryLoader {
  private actCache: Map<number, StoryAct> = new Map();
  private storyContentCache: StoryContent | null = null;

  /**
   * Load a single act by number.
   * @param actNumber - The act number to load (1-5)
   * @returns Promise resolving to the loaded act
   * @throws StoryLoadError if loading fails
   * @throws StoryValidationError if content is invalid
   */
  async loadAct(actNumber: number): Promise<StoryAct> {
    // Check cache first
    const cached = this.actCache.get(actNumber);
    if (cached) {
      return cached;
    }

    const url = `${import.meta.env.BASE_URL}story/act-${actNumber}.json`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new StoryLoadError(
          `Failed to load act ${actNumber}: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      // Validate the loaded content
      if (!isStoryAct(data)) {
        throw new StoryValidationError('Invalid act content', [
          `Act ${actNumber} failed type validation`,
        ]);
      }

      // Cache the result
      this.actCache.set(actNumber, data);

      return data;
    } catch (error) {
      if (error instanceof StoryLoadError || error instanceof StoryValidationError) {
        throw error;
      }
      throw new StoryLoadError(`Failed to load act ${actNumber}`, error);
    }
  }

  /**
   * Load complete story content (all acts).
   * Loads the index file and then dynamically loads each act file.
   * @returns Promise resolving to the complete story content
   * @throws StoryLoadError if loading fails
   * @throws StoryValidationError if content is invalid
   */
  async loadAllActs(): Promise<StoryContent> {
    // Check cache first
    if (this.storyContentCache) {
      return this.storyContentCache;
    }

    const indexUrl = `${import.meta.env.BASE_URL}story/story-content.json`;

    try {
      // Load the index file
      const indexResponse = await fetch(indexUrl);

      if (!indexResponse.ok) {
        throw new StoryLoadError(`Failed to load story index: ${indexResponse.status} ${indexResponse.statusText}`);
      }

      const indexData = await indexResponse.json();

      // Extract metadata and act index
      const metadata = indexData.metadata as StoryMetadata;
      const actIndex = indexData.actIndex as Array<{ number: number; file: string }>;
      const version = indexData.version as string || '1.0.0';

      if (!metadata || !actIndex || !Array.isArray(actIndex)) {
        throw new StoryValidationError('Invalid story index structure', ['Missing metadata or actIndex']);
      }

      // Load all acts in parallel
      const actPromises = actIndex.map(async (entry) => {
        const actUrl = `${import.meta.env.BASE_URL}story/${entry.file}`;
        const actResponse = await fetch(actUrl);

        if (!actResponse.ok) {
          throw new StoryLoadError(`Failed to load act ${entry.number}: ${actResponse.status}`);
        }

        const actData = await actResponse.json();

        // Handle both formats: raw act or wrapped in {version, metadata, acts} structure
        let act: unknown = actData;
        if (actData && typeof actData === 'object' && Array.isArray(actData.acts) && actData.acts.length > 0) {
          // Wrapped format: extract the act from the acts array
          act = actData.acts[0];
        }

        // Validate act structure
        if (!isStoryAct(act)) {
          throw new StoryValidationError(`Invalid act structure for act ${entry.number}`, [`Act ${entry.number} failed validation`]);
        }

        return act as StoryAct;
      });

      const acts = await Promise.all(actPromises);

      // Sort acts by number
      acts.sort((a, b) => a.number - b.number);

      // Build complete story content
      const content: StoryContent = {
        version,
        metadata,
        acts,
      };

      // Validate the combined content
      const validation = validateStoryContent(content);
      if (!validation.valid) {
        throw new StoryValidationError('Invalid story content', validation.errors);
      }

      // Cache the result
      this.storyContentCache = content;

      // Also cache individual acts
      for (const act of content.acts) {
        this.actCache.set(act.number, act);
      }

      return content;
    } catch (error) {
      if (error instanceof StoryLoadError || error instanceof StoryValidationError) {
        throw error;
      }
      throw new StoryLoadError('Failed to load story content', error);
    }
  }

  /**
   * Clear all cached content.
   */
  clearCache(): void {
    this.actCache.clear();
    this.storyContentCache = null;
  }

  /**
   * Get a scene by ID from cached content.
   * @param sceneId - The scene ID to find
   * @returns The scene if found, null otherwise
   */
  getSceneById(sceneId: string): StoryScene | null {
    // Search in cached acts
    for (const act of this.actCache.values()) {
      for (const chapter of act.chapters) {
        for (const scene of chapter.scenes) {
          if (scene.id === sceneId) {
            return scene;
          }
        }
      }
    }

    // Also search in full content cache if available
    if (this.storyContentCache) {
      for (const act of this.storyContentCache.acts) {
        for (const chapter of act.chapters) {
          for (const scene of chapter.scenes) {
            if (scene.id === sceneId) {
              return scene;
            }
          }
        }
      }
    }

    return null;
  }

  /**
   * Get the first scene from cached content.
   * @returns The first scene if content is cached, null otherwise
   */
  getFirstScene(): StoryScene | null {
    // Try full content cache first
    if (this.storyContentCache && this.storyContentCache.acts.length > 0) {
      const firstAct = this.storyContentCache.acts[0];
      if (firstAct.chapters.length > 0 && firstAct.chapters[0].scenes.length > 0) {
        return firstAct.chapters[0].scenes[0];
      }
    }

    // Try act 1 from act cache
    const act1 = this.actCache.get(1);
    if (act1 && act1.chapters.length > 0 && act1.chapters[0].scenes.length > 0) {
      return act1.chapters[0].scenes[0];
    }

    return null;
  }

  /**
   * Get all cached acts as an array.
   * @returns Array of cached acts
   */
  getCachedActs(): StoryAct[] {
    if (this.storyContentCache) {
      return this.storyContentCache.acts;
    }
    return Array.from(this.actCache.values()).sort((a, b) => a.number - b.number);
  }
}
