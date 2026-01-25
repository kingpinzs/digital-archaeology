// src/story/StoryController.ts
// Integration orchestrator for Story Mode
// Story 10.17: Wire Story Mode Integration

import type { StoryAct, StoryScene } from './content-types';
import type { StoryProgress } from './StoryState';
import type { RoleData } from './types';
import type { StoryStateChangedEvent } from './StoryEngine';
import type { SceneRenderContext, SceneRendererCallbacks } from './SceneRenderer';
import { StoryLoader } from './StoryLoader';
import { StoryEngine } from './StoryEngine';
import { StoryStorage } from './StoryStorage';
import { SceneRenderer } from './SceneRenderer';

/**
 * Callbacks for story controller events.
 */
export interface StoryControllerCallbacks {
  /** Called when mode should change to Lab */
  onEnterLab?: () => void;
  /** Called when era changes (for nav updates) */
  onEraChange?: (era: string) => void;
  /** Called when role data updates */
  onRoleUpdate?: (roleData: RoleData) => void;
}

/**
 * StoryController orchestrates the integration between:
 * - StoryLoader (content loading)
 * - StoryEngine (state management)
 * - SceneRenderer (UI rendering)
 *
 * It's the single point of coordination for Story Mode functionality.
 */
export class StoryController {
  private loader: StoryLoader;
  private engine: StoryEngine;
  private renderer: SceneRenderer;
  private callbacks: StoryControllerCallbacks = {};

  private acts: StoryAct[] = [];
  private renderContainer: HTMLElement | null = null;
  private initialized: boolean = false;

  // Event listener reference for cleanup
  private stateChangedListener: ((event: Event) => void) | null = null;

  constructor() {
    this.loader = new StoryLoader();
    this.engine = new StoryEngine(new StoryStorage());
    this.renderer = new SceneRenderer();

    // Wire renderer callbacks
    this.renderer.setCallbacks(this.createRendererCallbacks());
  }

  /**
   * Set callbacks for controller events.
   */
  setCallbacks(callbacks: StoryControllerCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Initialize the story controller.
   * Loads content and resumes or starts a new game.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load story content
      const content = await this.loader.loadAllActs();
      this.acts = content.acts;

      // Initialize engine with content
      this.engine.initialize(this.acts);

      // Subscribe to state changes
      this.subscribeToStateChanges();

      // Resume or start new game
      this.engine.resume();

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize story controller:', error);
      throw error;
    }
  }

  /**
   * Set the render container for scene rendering.
   */
  setRenderContainer(container: HTMLElement): void {
    this.renderContainer = container;
    // Render current scene if we have one
    if (this.initialized && this.engine.getCurrentScene()) {
      this.renderCurrentScene();
    }
  }

  /**
   * Get the current scene data.
   */
  getCurrentScene(): StoryScene | null {
    return this.engine.getCurrentScene();
  }

  /**
   * Get the current progress.
   */
  getProgress(): StoryProgress | null {
    return this.engine.getProgress();
  }

  /**
   * Get the era for a specific act number.
   */
  getEraForAct(actNumber: number): string {
    const act = this.acts.find(a => a.number === actNumber);
    return act?.era ?? 'Unknown';
  }

  /**
   * Get the total number of acts.
   */
  getTotalActs(): number {
    return this.acts.length;
  }

  /**
   * Get all acts (for story browser).
   */
  getActs(): StoryAct[] {
    return [...this.acts];
  }

  /**
   * Get role data based on current progress.
   */
  getRoleData(): RoleData | null {
    const progress = this.engine.getProgress();
    if (!progress) return null;

    const act = this.acts.find(a => a.number === progress.position.actNumber);
    if (!act) return null;

    // Calculate experience level based on progress
    const experience = this.calculateExperience(progress);

    // Map discovered items to badges
    const discoveries = progress.discoveredItems.map(item => ({
      id: item,
      name: item,
      icon: '🔬', // Default icon
    }));

    return {
      name: 'Junior Engineer',
      era: act.era,
      location: this.getLocationForAct(act),
      progress: `Act ${progress.position.actNumber} / Chapter ${progress.position.chapterNumber}`,
      experience,
      discoveries,
    };
  }

  /**
   * Navigate to the next scene.
   */
  nextScene(): void {
    try {
      this.engine.nextScene();
    } catch (error) {
      console.warn('Cannot navigate to next scene:', error);
    }
  }

  /**
   * Navigate to the previous scene.
   */
  previousScene(): void {
    try {
      this.engine.previousScene();
    } catch (error) {
      console.warn('Cannot navigate to previous scene:', error);
    }
  }

  /**
   * Record a choice and navigate to the appropriate next scene.
   */
  selectChoice(choiceId: string): void {
    try {
      this.engine.recordChoice(choiceId);
      // For now, choices advance to nextScene
      // Future: implement branching based on choice
      this.engine.nextScene();
    } catch (error) {
      console.warn('Cannot process choice:', error);
    }
  }

  /**
   * Start a new game, resetting progress.
   */
  startNewGame(): void {
    this.engine.clearProgress();
    this.engine.startNewGame();
  }

  /**
   * Check if there's a previous scene in history.
   */
  hasPreviousScene(): boolean {
    // Check if we have history by attempting to get progress
    // and checking if we're not at the first scene
    const progress = this.engine.getProgress();
    if (!progress) return false;

    const firstScene = this.engine.getFirstScene();
    return firstScene ? progress.position.sceneId !== firstScene.id : false;
  }

  /**
   * Check if there's a next scene defined.
   */
  hasNextScene(): boolean {
    const scene = this.engine.getCurrentScene();
    return !!scene?.nextScene;
  }

  /**
   * Get the StoryEngine instance (for advanced operations).
   */
  getEngine(): StoryEngine {
    return this.engine;
  }

  /**
   * Get the StoryLoader instance (for advanced operations).
   */
  getLoader(): StoryLoader {
    return this.loader;
  }

  /**
   * Subscribe to story state changes.
   */
  private subscribeToStateChanges(): void {
    this.stateChangedListener = (event: Event) => {
      const customEvent = event as StoryStateChangedEvent;
      const { progress } = customEvent.detail;

      // Render the new scene
      this.renderCurrentScene();

      // Notify callbacks
      if (progress && this.callbacks.onEraChange) {
        const era = this.getEraForAct(progress.position.actNumber);
        this.callbacks.onEraChange(era);
      }

      if (this.callbacks.onRoleUpdate) {
        const roleData = this.getRoleData();
        if (roleData) {
          this.callbacks.onRoleUpdate(roleData);
        }
      }
    };

    window.addEventListener('story-state-changed', this.stateChangedListener);
  }

  /**
   * Render the current scene.
   */
  private renderCurrentScene(): void {
    if (!this.renderContainer) return;

    const context = this.getCurrentSceneContext();
    if (!context) return;

    this.renderer.renderScene(context, this.renderContainer);

    // Update footer state
    this.renderer.updateFooterState(
      this.hasPreviousScene(),
      this.hasNextScene() && !this.hasChoices()
    );
  }

  /**
   * Check if current scene has choices.
   */
  private hasChoices(): boolean {
    const scene = this.engine.getCurrentScene();
    return !!(scene?.choices && scene.choices.length > 0);
  }

  /**
   * Get the full context for the current scene.
   */
  private getCurrentSceneContext(): SceneRenderContext | null {
    const progress = this.engine.getProgress();
    const scene = this.engine.getCurrentScene();

    if (!progress || !scene) return null;

    const act = this.acts.find(a => a.number === progress.position.actNumber);
    if (!act) return null;

    const chapter = act.chapters.find(c => c.number === progress.position.chapterNumber);
    if (!chapter) return null;

    // Check if this is the first scene in the chapter
    const isFirstSceneInChapter = chapter.scenes.length > 0 &&
      chapter.scenes[0].id === scene.id;

    return {
      act,
      chapter,
      scene,
      isFirstSceneInChapter,
    };
  }

  /**
   * Create callbacks for the scene renderer.
   */
  private createRendererCallbacks(): SceneRendererCallbacks {
    return {
      onChoiceSelect: (choiceId: string) => {
        this.selectChoice(choiceId);
      },
      onContinue: () => {
        this.nextScene();
      },
      onPrevious: () => {
        this.previousScene();
      },
      onEnterLab: () => {
        if (this.callbacks.onEnterLab) {
          this.callbacks.onEnterLab();
        }
      },
    };
  }

  /**
   * Calculate experience level based on progress.
   */
  private calculateExperience(progress: StoryProgress): string {
    const actNumber = progress.position.actNumber;
    const choiceCount = progress.choices.length;
    const discoveryCount = progress.discoveredItems.length;

    const score = actNumber * 10 + choiceCount * 2 + discoveryCount * 5;

    if (score >= 50) return 'Expert';
    if (score >= 30) return 'Journeyman';
    if (score >= 15) return 'Apprentice';
    return 'Novice';
  }

  /**
   * Get location name for an act.
   */
  private getLocationForAct(act: StoryAct): string {
    // Map CPU stages to locations
    const locationMap: Record<string, string> = {
      mechanical: 'Ancient Counting House',
      relay: 'Electromechanical Workshop',
      vacuum: 'ENIAC Computing Center',
      transistor: 'Bell Labs',
      micro4: 'Intel 4004 Design Lab',
      micro8: 'Intel 8080 Development',
      micro16: '16-bit Architecture Lab',
      micro32: '32-bit Systems Lab',
      micro32p: 'Pipeline Research Center',
      micro32s: 'Superscalar Design Lab',
    };
    return locationMap[act.cpuStage] || 'Digital Archaeology Lab';
  }

  /**
   * Destroy the controller and clean up resources.
   */
  destroy(): void {
    // Unsubscribe from state changes
    if (this.stateChangedListener) {
      window.removeEventListener('story-state-changed', this.stateChangedListener);
      this.stateChangedListener = null;
    }

    // Clean up renderer
    this.renderer.destroy();

    // Clear references
    this.renderContainer = null;
    this.acts = [];
    this.callbacks = {};
    this.initialized = false;
  }
}
