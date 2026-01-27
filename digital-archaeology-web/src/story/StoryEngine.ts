// src/story/StoryEngine.ts
// Story progression engine with state management
// Story 10.15: Create Story Progression Engine
// Story 10.18: Create Historical Personas System
// Story 10.21: Historical Mindset Time-Travel

import type { StoryScene, StoryAct } from './content-types';
import type { StoryProgress, StoryPosition, StoryChoice, StoryEngineState } from './StoryState';
import type { PersonaData, MindsetContext } from './types';
import { createDefaultProgress, createDefaultEngineState } from './StoryState';
import { StoryStorage } from './StoryStorage';
import { MindsetProvider } from './MindsetProvider';

/** Custom event type for story state changes */
export interface StoryStateChangedEvent extends CustomEvent {
  detail: {
    /** Current progress, or null if cleared */
    progress: StoryProgress | null;
    previousSceneId: string | null;
  };
}

/** Custom event type for persona changes (Story 10.18) */
export interface PersonaChangedEvent extends CustomEvent {
  detail: {
    /** The new persona, or null if cleared */
    persona: PersonaData | null;
    /** The previous persona, or null if none */
    previousPersona: PersonaData | null;
  };
}

/** Custom event type for mindset changes (Story 10.21) */
export interface MindsetChangedEvent extends CustomEvent {
  detail: {
    /** The new mindset context, or null if cleared */
    mindset: MindsetContext | null;
    /** The previous mindset context, or null if none */
    previousMindset: MindsetContext | null;
    /** Act number for the new mindset */
    actNumber: number;
  };
}

/**
 * Story progression engine that manages user state and navigation.
 * Dispatches 'story-state-changed' events when state changes.
 */
export class StoryEngine {
  private state: StoryEngineState;
  private storage: StoryStorage;
  private sceneHistory: string[] = [];
  private content: {
    acts: StoryAct[];
    sceneIndex: Map<string, { scene: StoryScene; actNumber: number; chapterNumber: number }>;
  } | null = null;

  constructor(storage?: StoryStorage) {
    this.state = createDefaultEngineState();
    this.storage = storage ?? new StoryStorage();
  }

  /**
   * Initialize the engine with story content.
   * Must be called before navigation methods.
   */
  initialize(acts: StoryAct[]): void {
    // Build scene index for O(1) lookups
    const sceneIndex = new Map<string, { scene: StoryScene; actNumber: number; chapterNumber: number }>();

    for (const act of acts) {
      for (const chapter of act.chapters) {
        for (const scene of chapter.scenes) {
          sceneIndex.set(scene.id, {
            scene,
            actNumber: act.number,
            chapterNumber: chapter.number,
          });
        }
      }
    }

    this.content = { acts, sceneIndex };
  }

  /**
   * Get the current scene.
   */
  getCurrentScene(): StoryScene | null {
    if (!this.state.progress || !this.content) {
      return null;
    }

    const entry = this.content.sceneIndex.get(this.state.progress.position.sceneId);
    return entry?.scene ?? null;
  }

  /**
   * Navigate to a specific scene by ID.
   */
  goToScene(sceneId: string): void {
    if (!this.content) {
      throw new Error('Engine not initialized. Call initialize() first.');
    }

    const entry = this.content.sceneIndex.get(sceneId);
    if (!entry) {
      throw new Error(`Scene not found: ${sceneId}`);
    }

    const previousSceneId = this.state.progress?.position.sceneId ?? null;
    const previousActNumber = this.state.progress?.position.actNumber ?? null;

    // Track history for previousScene
    if (previousSceneId) {
      this.sceneHistory.push(previousSceneId);
    }

    // Update position
    const newPosition: StoryPosition = {
      actNumber: entry.actNumber,
      chapterNumber: entry.chapterNumber,
      sceneId,
    };

    if (this.state.progress) {
      this.state.progress = {
        ...this.state.progress,
        position: newPosition,
        lastPlayedAt: Date.now(),
      };
    } else {
      this.state.progress = createDefaultProgress(sceneId);
      this.state.progress.position = newPosition;
    }

    // Story 10.18: Check for act change and update persona
    if (previousActNumber !== entry.actNumber) {
      const actPersona = this.getActPersona(entry.actNumber);
      if (actPersona) {
        const previousPersona = this.state.progress.currentPersona ?? null;
        this.state.progress = {
          ...this.state.progress,
          currentPersona: actPersona,
        };
        this.dispatchPersonaChanged(actPersona, previousPersona);
      }

      // Story 10.21: Update mindset context on act change
      const actMindset = this.getActMindset(entry.actNumber);
      const previousMindset = MindsetProvider.getInstance().getCurrentMindset();
      if (actMindset) {
        MindsetProvider.getInstance().setMindset(actMindset);
        this.dispatchMindsetChanged(actMindset, previousMindset, entry.actNumber);
      }
    }

    this.dispatchStateChanged(previousSceneId);
    this.saveProgress();
  }

  /**
   * Navigate to the next scene using scene.nextScene property.
   */
  nextScene(): void {
    const currentScene = this.getCurrentScene();
    if (!currentScene) {
      throw new Error('No current scene. Navigate to a scene first.');
    }

    if (!currentScene.nextScene) {
      throw new Error('No next scene defined for current scene.');
    }

    this.goToScene(currentScene.nextScene);
  }

  /**
   * Navigate to the previous scene using history.
   */
  previousScene(): void {
    if (this.sceneHistory.length === 0) {
      throw new Error('No previous scene in history.');
    }

    const previousSceneId = this.sceneHistory.pop()!;

    // Navigate without adding to history (to avoid infinite loops)
    if (!this.content) {
      throw new Error('Engine not initialized.');
    }

    const entry = this.content.sceneIndex.get(previousSceneId);
    if (!entry) {
      throw new Error(`Previous scene not found: ${previousSceneId}`);
    }

    const currentSceneId = this.state.progress?.position.sceneId ?? null;

    const newPosition: StoryPosition = {
      actNumber: entry.actNumber,
      chapterNumber: entry.chapterNumber,
      sceneId: previousSceneId,
    };

    if (this.state.progress) {
      this.state.progress = {
        ...this.state.progress,
        position: newPosition,
        lastPlayedAt: Date.now(),
      };
    }

    this.dispatchStateChanged(currentSceneId);
    this.saveProgress();
  }

  /**
   * Record a choice made by the user.
   */
  recordChoice(choiceId: string): void {
    if (!this.state.progress) {
      throw new Error('No active progress. Navigate to a scene first.');
    }

    const choice: StoryChoice = {
      sceneId: this.state.progress.position.sceneId,
      choiceId,
      timestamp: Date.now(),
    };

    this.state.progress = {
      ...this.state.progress,
      choices: [...this.state.progress.choices, choice],
      lastPlayedAt: Date.now(),
    };

    this.dispatchStateChanged(null);
    this.saveProgress();
  }

  /**
   * Get the current progress.
   */
  getProgress(): StoryProgress | null {
    return this.state.progress;
  }

  /**
   * Get the complete engine state.
   */
  getState(): StoryEngineState {
    return { ...this.state };
  }

  /**
   * Get the scene history (visited scenes for back navigation).
   */
  getSceneHistory(): string[] {
    return [...this.sceneHistory];
  }

  /**
   * Get the current persona.
   * Story 10.18: Create Historical Personas System
   */
  getCurrentPersona(): PersonaData | null {
    return this.state.progress?.currentPersona ?? null;
  }

  /**
   * Set the current persona and dispatch persona-changed event.
   * Story 10.18: Create Historical Personas System
   */
  setCurrentPersona(persona: PersonaData | null): void {
    if (!this.state.progress) {
      throw new Error('No active progress. Navigate to a scene first.');
    }

    const previousPersona = this.state.progress.currentPersona ?? null;

    // Don't dispatch if persona is the same
    if (previousPersona?.id === persona?.id) {
      return;
    }

    this.state.progress = {
      ...this.state.progress,
      currentPersona: persona,
      lastPlayedAt: Date.now(),
    };

    this.dispatchPersonaChanged(persona, previousPersona);
    this.saveProgress();
  }

  /**
   * Get the persona for a specific act.
   * Story 10.18: Create Historical Personas System
   */
  getActPersona(actNumber: number): PersonaData | null {
    if (!this.content) {
      return null;
    }

    const act = this.content.acts.find(a => a.number === actNumber);
    return act?.persona ?? null;
  }

  /**
   * Get the mindset context for a specific act.
   * Story 10.21: Historical Mindset Time-Travel
   */
  getActMindset(actNumber: number): MindsetContext | null {
    if (!this.content) {
      return null;
    }

    const act = this.content.acts.find(a => a.number === actNumber);
    return act?.mindset ?? null;
  }

  /**
   * Get the current mindset context from the MindsetProvider.
   * Story 10.21: Historical Mindset Time-Travel
   */
  getCurrentMindset(): MindsetContext | null {
    return MindsetProvider.getInstance().getCurrentMindset();
  }

  /**
   * Start a new game from the first scene.
   */
  startNewGame(): void {
    if (!this.content || this.content.acts.length === 0) {
      throw new Error('Engine not initialized or no content loaded.');
    }

    const firstAct = this.content.acts[0];
    if (!firstAct.chapters.length || !firstAct.chapters[0].scenes.length) {
      throw new Error('No scenes found in first act.');
    }

    const firstScene = firstAct.chapters[0].scenes[0];
    this.sceneHistory = [];

    // Story 10.18: Initialize with first act's persona
    const actPersona = firstAct.persona ?? null;
    this.state.progress = createDefaultProgress(firstScene.id, actPersona);
    this.state.error = null;

    // Dispatch persona-changed if persona exists
    if (actPersona) {
      this.dispatchPersonaChanged(actPersona, null);
    }

    // Story 10.21: Initialize with first act's mindset
    const actMindset = firstAct.mindset ?? null;
    if (actMindset) {
      MindsetProvider.getInstance().setMindset(actMindset);
      this.dispatchMindsetChanged(actMindset, null, firstAct.number);
    }

    this.dispatchStateChanged(null);
    this.saveProgress();
  }

  /**
   * Resume from saved progress.
   * Returns true if progress was restored, false if starting fresh.
   */
  resume(): boolean {
    const savedProgress = this.storage.loadProgress();

    if (savedProgress && this.content) {
      // Verify the saved scene still exists
      const entry = this.content.sceneIndex.get(savedProgress.position.sceneId);
      if (entry) {
        this.state.progress = savedProgress;

        // Story 10.21: Initialize mindset from current act when resuming
        const actMindset = this.getActMindset(entry.actNumber);
        if (actMindset) {
          MindsetProvider.getInstance().setMindset(actMindset);
        }

        this.dispatchStateChanged(null);
        return true;
      }
    }

    // No valid saved progress, start new game
    this.startNewGame();
    return false;
  }

  /**
   * Clear all progress and start fresh.
   */
  clearProgress(): void {
    this.storage.clearProgress();
    this.state.progress = null;
    this.sceneHistory = [];
    this.dispatchStateChanged(null);
  }

  /**
   * Add a discovered item to the progress.
   */
  addDiscoveredItem(itemId: string): void {
    if (!this.state.progress) {
      throw new Error('No active progress.');
    }

    if (this.state.progress.discoveredItems.includes(itemId)) {
      return; // Already discovered
    }

    this.state.progress = {
      ...this.state.progress,
      discoveredItems: [...this.state.progress.discoveredItems, itemId],
      lastPlayedAt: Date.now(),
    };

    this.dispatchStateChanged(null);
    this.saveProgress();
  }

  /**
   * Get a scene by ID.
   */
  getSceneById(sceneId: string): StoryScene | null {
    if (!this.content) {
      return null;
    }
    const entry = this.content.sceneIndex.get(sceneId);
    return entry?.scene ?? null;
  }

  /**
   * Get the first scene in the story.
   */
  getFirstScene(): StoryScene | null {
    if (!this.content || this.content.acts.length === 0) {
      return null;
    }

    const firstAct = this.content.acts[0];
    if (!firstAct.chapters.length || !firstAct.chapters[0].scenes.length) {
      return null;
    }

    return firstAct.chapters[0].scenes[0];
  }

  private saveProgress(): void {
    if (this.state.progress) {
      this.storage.saveProgress(this.state.progress);
    }
  }

  private dispatchStateChanged(previousSceneId: string | null): void {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('story-state-changed', {
        detail: {
          progress: this.state.progress,
          previousSceneId,
        },
      });
      window.dispatchEvent(event);
    }
  }

  /**
   * Dispatch persona-changed event.
   * Story 10.18: Create Historical Personas System
   */
  private dispatchPersonaChanged(persona: PersonaData | null, previousPersona: PersonaData | null): void {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('persona-changed', {
        detail: {
          persona,
          previousPersona,
        },
      });
      window.dispatchEvent(event);
    }
  }

  /**
   * Dispatch mindset-changed event.
   * Story 10.21: Historical Mindset Time-Travel
   */
  private dispatchMindsetChanged(
    mindset: MindsetContext | null,
    previousMindset: MindsetContext | null,
    actNumber: number
  ): void {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('mindset-changed', {
        detail: {
          mindset,
          previousMindset,
          actNumber,
        },
      });
      window.dispatchEvent(event);
    }
  }
}
