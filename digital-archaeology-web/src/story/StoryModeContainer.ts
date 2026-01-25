// src/story/StoryModeContainer.ts
// Container component for Story Mode - composes layout components
// Story 10.1: Initial stub, Story 10.2: Full layout integration
// Story 10.3: Add options pattern for mode change callbacks
// Story 10.17: Wire Story Mode Integration - Add StoryController

import { StoryNav } from './StoryNav';
import { YourRolePanel } from './YourRolePanel';
import { StoryContent } from './StoryContent';
import { StoryController } from './StoryController';
import { StoryBrowser } from './StoryBrowser';
import { StoryJournal } from './StoryJournal';
import type { ThemeMode } from '@ui/theme';
import type { RoleData } from './types';

/**
 * Configuration options for the StoryModeContainer component.
 */
export interface StoryModeContainerOptions {
  /** Current active mode */
  currentMode: ThemeMode;
  /** Callback when mode changes */
  onModeChange: (mode: ThemeMode) => void;
}

/**
 * StoryModeContainer is the root component for Story Mode.
 * It composes and manages the Story Mode layout:
 * - StoryNav: Fixed 48px navigation bar at top
 * - YourRolePanel: Fixed 220px panel on left (desktop only)
 * - StoryContent: Main scrollable content area
 * - StoryController: Integration orchestrator
 *
 * Layout specification (from UX design):
 * - Background: warm dark (#0a0a12)
 * - Typography: Crimson Text for narrative elements
 * - Responsive: YourRolePanel hidden < 1200px
 */
export class StoryModeContainer {
  private element: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private options: StoryModeContainerOptions;

  // Child components
  private storyNav: StoryNav | null = null;
  private yourRolePanel: YourRolePanel | null = null;
  private storyContent: StoryContent | null = null;
  private storyBrowser: StoryBrowser | null = null;
  private storyJournal: StoryJournal | null = null;

  // Story integration
  private storyController: StoryController | null = null;
  private initializationPromise: Promise<void> | null = null;

  constructor(options: StoryModeContainerOptions) {
    this.options = options;
  }

  /**
   * Mount the story mode container to a DOM element.
   * @param container - The HTML element to mount to
   */
  mount(container: HTMLElement): void {
    this.container = container;
    this.element = this.render();
    this.container.appendChild(this.element);

    // Mount child components
    this.mountChildren();

    // Initialize story controller
    this.initializeStoryController();
  }

  /**
   * Render the story mode container structure.
   * @returns The rendered HTML element
   */
  private render(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'da-story-mode-container';

    // Create mount points for child components
    const navMount = document.createElement('div');
    navMount.className = 'da-story-nav-mount';
    navMount.setAttribute('data-story-component', 'nav');

    const panelMount = document.createElement('div');
    panelMount.className = 'da-story-panel-mount';
    panelMount.setAttribute('data-story-component', 'panel');

    const contentMount = document.createElement('div');
    contentMount.className = 'da-story-content-mount';
    contentMount.setAttribute('data-story-component', 'content');

    wrapper.appendChild(navMount);
    wrapper.appendChild(panelMount);
    wrapper.appendChild(contentMount);

    return wrapper;
  }

  /**
   * Mount all child components to their respective mount points.
   */
  private mountChildren(): void {
    if (!this.element) return;

    const navMount = this.element.querySelector('[data-story-component="nav"]');
    const panelMount = this.element.querySelector('[data-story-component="panel"]');
    const contentMount = this.element.querySelector('[data-story-component="content"]');

    if (navMount) {
      this.storyNav = new StoryNav({
        currentMode: this.options.currentMode,
        onModeChange: this.options.onModeChange,
        getEraForAct: (actNumber: number) => {
          return this.storyController?.getEraForAct(actNumber) ?? 'Unknown';
        },
        onProgressClick: () => {
          this.openStoryBrowser();
        },
        onJournalClick: () => {
          this.openStoryJournal();
        },
      });
      this.storyNav.mount(navMount as HTMLElement);
    }

    // Create StoryBrowser (mounted on demand when opened)
    this.storyBrowser = new StoryBrowser();
    this.storyBrowser.setCallbacks({
      onSceneSelect: (sceneId: string) => {
        this.navigateToScene(sceneId);
      },
      onClose: () => {
        // Browser closed - no additional action needed
      },
    });

    // Create StoryJournal (mounted on demand when opened)
    this.storyJournal = new StoryJournal();
    this.storyJournal.setCallbacks({
      onClose: () => {
        // Journal closed - no additional action needed
      },
    });

    if (panelMount) {
      this.yourRolePanel = new YourRolePanel();
      this.yourRolePanel.mount(panelMount as HTMLElement);
    }

    if (contentMount) {
      this.storyContent = new StoryContent();
      this.storyContent.mount(contentMount as HTMLElement);
    }
  }

  /**
   * Initialize the story controller and wire up components.
   */
  private initializeStoryController(): void {
    this.storyController = new StoryController();

    // Set up controller callbacks
    this.storyController.setCallbacks({
      onEnterLab: () => {
        // Switch to lab mode
        this.options.onModeChange('lab');
      },
      onEraChange: (_era: string) => {
        // StoryNav updates via story-state-changed event
        // This callback is for additional handling if needed
      },
      onRoleUpdate: (roleData: RoleData) => {
        this.yourRolePanel?.setRoleData(roleData);
      },
    });

    // Set the render container
    const sceneMount = this.storyContent?.getSceneMount();
    if (sceneMount) {
      this.storyController.setRenderContainer(sceneMount);
    }

    // Initialize asynchronously
    this.initializationPromise = this.storyController.initialize()
      .then(() => {
        // Update YourRolePanel with initial role data
        const roleData = this.storyController?.getRoleData();
        if (roleData) {
          this.yourRolePanel?.setRoleData(roleData);
        }

        // Update StoryNav with actual total acts count from loaded content
        const totalActs = this.storyController?.getTotalActs() ?? 11;
        this.storyNav?.setTotalActs(totalActs);
      })
      .catch((error) => {
        console.error('Failed to initialize story:', error);
        this.showErrorState(error);
      });
  }

  /**
   * Show error state when story fails to load.
   */
  private showErrorState(error: unknown): void {
    const sceneMount = this.storyContent?.getSceneMount();
    if (!sceneMount) return;

    const errorContainer = document.createElement('div');
    errorContainer.className = 'da-story-error';
    errorContainer.setAttribute('role', 'alert');

    const errorTitle = document.createElement('h2');
    errorTitle.textContent = 'Failed to Load Story';

    const errorMessage = document.createElement('p');
    errorMessage.textContent = error instanceof Error
      ? error.message
      : 'An unexpected error occurred.';

    const retryButton = document.createElement('button');
    retryButton.type = 'button';
    retryButton.className = 'da-story-error-retry';
    retryButton.textContent = 'Retry';
    retryButton.addEventListener('click', () => {
      errorContainer.remove();
      this.initializeStoryController();
    });

    errorContainer.appendChild(errorTitle);
    errorContainer.appendChild(errorMessage);
    errorContainer.appendChild(retryButton);
    sceneMount.appendChild(errorContainer);
  }

  /**
   * Wait for story controller to be fully initialized.
   */
  async waitForInitialization(): Promise<void> {
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
  }

  /**
   * Open the story browser modal.
   */
  private openStoryBrowser(): void {
    if (!this.storyController || !this.storyBrowser) return;

    // Get data for the browser
    const acts = this.storyController.getActs();
    const progress = this.storyController.getProgress();

    // Get visited scenes from navigation history
    const engine = this.storyController.getEngine();
    const visitedScenes = new Set<string>();
    if (progress) {
      // Add scenes from navigation history
      const history = engine.getSceneHistory();
      for (const sceneId of history) {
        visitedScenes.add(sceneId);
      }
      // Also add current scene
      visitedScenes.add(progress.position.sceneId);
    }

    this.storyBrowser.open({
      acts,
      progress,
      visitedScenes,
    });
  }

  /**
   * Navigate to a specific scene by ID.
   */
  private navigateToScene(sceneId: string): void {
    if (!this.storyController) return;

    const engine = this.storyController.getEngine();
    try {
      engine.goToScene(sceneId);
    } catch (error) {
      console.warn('Failed to navigate to scene:', sceneId, error);
    }
  }

  /**
   * Open the story journal modal.
   */
  private openStoryJournal(): void {
    if (!this.storyController || !this.storyJournal) return;

    // Get data for the journal
    const acts = this.storyController.getActs();
    const progress = this.storyController.getProgress();
    const engine = this.storyController.getEngine();
    const sceneHistory = engine.getSceneHistory();

    this.storyJournal.open({
      progress,
      acts,
      sceneHistory,
    });
  }

  /**
   * Show the story mode container and all child components.
   */
  show(): void {
    this.element?.classList.remove('da-story-mode-container--hidden');
    this.storyNav?.show();
    this.yourRolePanel?.show();
    this.storyContent?.show();
  }

  /**
   * Hide the story mode container and all child components.
   */
  hide(): void {
    this.element?.classList.add('da-story-mode-container--hidden');
    this.storyNav?.hide();
    this.yourRolePanel?.hide();
    this.storyContent?.hide();
  }

  /**
   * Check if the container is currently visible.
   * @returns true if visible, false otherwise
   */
  isVisible(): boolean {
    return !this.element?.classList.contains('da-story-mode-container--hidden');
  }

  /**
   * Get the StoryNav component instance.
   * @returns The StoryNav component or null if not mounted
   */
  getStoryNav(): StoryNav | null {
    return this.storyNav;
  }

  /**
   * Get the YourRolePanel component instance.
   * @returns The YourRolePanel component or null if not mounted
   */
  getYourRolePanel(): YourRolePanel | null {
    return this.yourRolePanel;
  }

  /**
   * Get the StoryContent component instance.
   * @returns The StoryContent component or null if not mounted
   */
  getStoryContent(): StoryContent | null {
    return this.storyContent;
  }

  /**
   * Get the StoryController instance.
   * @returns The StoryController or null if not initialized
   */
  getStoryController(): StoryController | null {
    return this.storyController;
  }

  /**
   * Update the current mode and sync StoryNav's ModeToggle state.
   * @param mode - The new active mode
   */
  setMode(mode: ThemeMode): void {
    this.storyNav?.setMode(mode);
  }

  /**
   * Destroy the component and clean up resources.
   */
  destroy(): void {
    // Destroy story controller first
    this.storyController?.destroy();
    this.storyController = null;
    this.initializationPromise = null;

    // Destroy child components
    this.storyNav?.destroy();
    this.storyNav = null;

    this.yourRolePanel?.destroy();
    this.yourRolePanel = null;

    this.storyContent?.destroy();
    this.storyContent = null;

    this.storyBrowser?.destroy();
    this.storyBrowser = null;

    this.storyJournal?.destroy();
    this.storyJournal = null;

    // Remove element from DOM
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    this.container = null;
  }
}
