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
import { ReplayPanel } from './ReplayPanel';
import { JourneyMap } from '../progress/JourneyMap';
import type { JourneyMapTab } from '../progress/JourneyMap';
import { JourneyMapBuilder } from '../progress/JourneyMapBuilder';
import { ActCompletionStorage } from '../progress/ActCompletionStorage';
import { CollectibleStorage } from '../progress/CollectibleStorage';
import type { ThemeMode } from '@ui/theme';
import type { RoleData, ChallengeContext } from './types';

/**
 * Configuration options for the StoryModeContainer component.
 */
export interface StoryModeContainerOptions {
  /** Current active mode */
  currentMode: ThemeMode;
  /** Callback when mode changes, optionally with challenge context */
  onModeChange: (mode: ThemeMode, challengeContext?: ChallengeContext) => void;
  /** Callback to trigger stage unlock check after act completion (Story 19.5) */
  onStageUnlockCheck?: () => void;
  /** Callback when statistics button is clicked (Story 19.6) */
  onStatisticsClick?: () => void;
  /** Callback when literature button is clicked (Story 20.1) */
  onLiteratureClick?: () => void;
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

  // Story 19.4: Journey Map
  private journeyMap: JourneyMap | null = null;
  private journeyMapBuilder: JourneyMapBuilder | null = null;

  // Story 26.8: Replay panel
  private replayPanel: ReplayPanel | null = null;

  // Collectible locations & artifacts
  private collectibleStorage: CollectibleStorage | null = null;

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
        onJourneyMapClick: () => {
          this.openJourneyMap();
        },
        onStatisticsClick: () => {
          this.options.onStatisticsClick?.();
        },
        onLiteratureClick: () => {
          this.options.onLiteratureClick?.();
        },
        onReplayClick: () => {
          this.openReplayPanel();
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

    // Story 26.8: Create ReplayPanel
    this.replayPanel = new ReplayPanel();
    this.replayPanel.setCallbacks({
      onClose: () => {
        this.replayPanel?.close();
      },
      onReplayScene: (sceneId: string) => {
        this.replayPanel?.close();
        this.storyController?.startReplay(sceneId);
      },
      onReturnToPresent: () => {
        this.replayPanel?.close();
        this.storyController?.stopReplay();
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
      onEnterLab: (context?: ChallengeContext) => {
        // Switch to lab mode, passing challenge context if available
        this.options.onModeChange('lab', context);
      },
      onEraChange: (_era: string) => {
        // StoryNav updates via story-state-changed event
        // This callback is for additional handling if needed
      },
      onRoleUpdate: (roleData: RoleData) => {
        this.yourRolePanel?.setRoleData(roleData);
      },
      onStageUnlock: () => {
        this.options.onStageUnlockCheck?.();
      },
      onCollectibleClick: (id: string, type: 'location' | 'artifact') => {
        this.openJourneyMapToCollectible(id, type);
      },
    });

    // Set the render container
    const sceneMount = this.storyContent?.getSceneMount();
    if (sceneMount) {
      this.storyController.setRenderContainer(sceneMount);
    }

    // Story 19.4: Initialize journey map components
    this.journeyMapBuilder = new JourneyMapBuilder(new ActCompletionStorage());
    this.journeyMap = new JourneyMap();
    if (this.element) {
      this.journeyMap.mount(this.element);
    }

    // Initialize collectible storage
    this.collectibleStorage = new CollectibleStorage();

    // Initialize asynchronously
    this.initializationPromise = this.storyController.initialize()
      .then(() => {
        // Check if first-time user needs discoverer experience
        if (this.storyController?.isFirstTimeUser()) {
          const sceneMount = this.storyContent?.getSceneMount();
          if (sceneMount) {
            this.storyController.showDiscovererExperience(sceneMount);
          }
          return;
        }

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

    // Story 26.5: Pass completed act numbers for lock enforcement
    const completedActNumbers = new Set(
      this.storyController.getCompletedActNumbers()
    );

    this.storyBrowser.open({
      acts,
      progress,
      visitedScenes,
      completedActNumbers,
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
   * Open the journey map modal (Story 19.4).
   */
  private openJourneyMap(initialTab?: JourneyMapTab, highlightedLocationId?: string, highlightedArtifactId?: string): void {
    if (!this.storyController || !this.journeyMap || !this.journeyMapBuilder || !this.collectibleStorage) return;

    const currentActNumber = this.storyController.getProgress()?.position.actNumber ?? 0;
    const journeyData = this.journeyMapBuilder.build(currentActNumber);
    const collectibleProfile = this.collectibleStorage.getProfileOrDefault();

    // Story 26.6: Gather scene-level data for timeline preview
    const acts = this.storyController.getActs();
    const progress = this.storyController.getProgress();
    const engine = this.storyController.getEngine();
    const visitedScenes = new Set<string>();
    if (progress) {
      for (const sceneId of engine.getSceneHistory()) {
        visitedScenes.add(sceneId);
      }
      visitedScenes.add(progress.position.sceneId);
    }

    // Story 26.7: Gather branch data for timeline visualization
    let activeBranchLabel: string | null = null;
    let branchActNumbers: Set<number> | undefined;
    let takenBranches: Map<string, string> | undefined;
    if (progress) {
      // Find the branch label for the current branch
      const branchChoices = progress.choices.filter(c => c.isBranchPoint);
      if (engine.isOnAlternateBranch() && branchChoices.length > 0) {
        const lastBranch = branchChoices[branchChoices.length - 1];
        activeBranchLabel = lastBranch.branchLabel ?? 'Alternate Timeline';
      }

      // Compute which acts have branch points and which scenes were branched from
      if (branchChoices.length > 0) {
        branchActNumbers = new Set<number>();
        takenBranches = new Map<string, string>();
        for (const choice of branchChoices) {
          // Find which act this scene belongs to
          for (const act of acts) {
            for (const chapter of act.chapters) {
              if (chapter.scenes.some(s => s.id === choice.sceneId)) {
                branchActNumbers.add(act.number);
              }
            }
          }
          takenBranches.set(choice.sceneId, choice.branchLabel ?? 'Alternate');
        }
      }
    }

    this.journeyMap.show({
      journeyData,
      collectibleProfile,
      currentActNumber,
      onNavigate: (actNumber: number) => {
        this.navigateToAct(actNumber);
      },
      onPinLocation: (locationId: string) => {
        this.collectibleStorage?.pinLocation(locationId);
      },
      onUnpinLocation: (locationId: string) => {
        this.collectibleStorage?.unpinLocation(locationId);
      },
      onCollectArtifact: (artifactId: string) => {
        this.collectibleStorage?.collectArtifact(artifactId);
      },
      initialTab,
      highlightedLocationId,
      highlightedArtifactId,
      // Story 26.6: Timeline preview data
      storyActs: acts,
      visitedScenes,
      currentSceneId: progress?.position.sceneId,
      onSceneNavigate: (sceneId: string) => {
        this.navigateToScene(sceneId);
      },
      // Story 26.7: Branch visualization data
      activeBranchLabel,
      branchActNumbers,
      takenBranches,
    });
  }

  /**
   * Open the journey map to a specific collectible (location or artifact).
   * Called when a clickable stat value in a CharacterCard is clicked.
   */
  private openJourneyMapToCollectible(id: string, type: 'location' | 'artifact'): void {
    if (type === 'location') {
      this.openJourneyMap('world-map', id);
    } else {
      this.openJourneyMap('artifacts', undefined, id);
    }
  }

  /**
   * Navigate to the first scene of a specific act (Story 19.4).
   */
  private navigateToAct(actNumber: number): void {
    if (!this.storyController) return;

    const acts = this.storyController.getActs();
    const targetAct = acts.find(act => act.number === actNumber);
    if (!targetAct || targetAct.chapters.length === 0 || targetAct.chapters[0].scenes.length === 0) {
      console.warn('Cannot navigate to act:', actNumber);
      return;
    }

    const firstSceneId = targetAct.chapters[0].scenes[0].id;
    const engine = this.storyController.getEngine();
    try {
      engine.goToScene(firstSceneId);
    } catch (error) {
      console.warn('Failed to navigate to act scene:', firstSceneId, error);
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
   * Open the replay panel modal (Story 26.8).
   */
  private openReplayPanel(): void {
    if (!this.storyController || !this.replayPanel) return;

    const progress = this.storyController.getProgress();
    if (!progress) return;

    const timeline = this.storyController.getVisitedSceneTimeline();
    const replaySceneId = this.storyController.isInReplayMode()
      ? this.storyController.getEngine().getReplaySceneId()
      : null;

    this.replayPanel.open({
      timeline,
      currentSceneId: progress.position.sceneId,
      replaySceneId,
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
   * Advance story to next scene after a completed challenge.
   * Called by App when user returns from lab with all objectives complete.
   * Shows a completion banner (AC #3) then advances to the next scene.
   */
  advanceAfterChallenge(): void {
    try {
      this.storyController?.nextScene();
      // Show completion acknowledgment after scene renders (AC #3)
      this.showChallengeCompletionBanner();
    } catch (error) {
      console.warn('Cannot advance story after challenge:', error);
    }
  }

  /**
   * Show a brief verification banner after returning from a completed challenge.
   * Story 26.4: Upgraded text to "Solution Verified — Production Ready!"
   */
  private showChallengeCompletionBanner(): void {
    if (!this.element) return;

    // Remove any existing banner from a previous cycle
    this.element.querySelector('.da-challenge-complete-banner')?.remove();

    const banner = document.createElement('div');
    banner.className = 'da-challenge-complete-banner';
    banner.setAttribute('role', 'status');
    banner.setAttribute('aria-live', 'polite');
    banner.textContent = 'Solution Verified \u2014 Production Ready!';
    this.element.prepend(banner);

    // Remove after CSS animation completes
    banner.addEventListener('animationend', () => banner.remove());
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

    // Story 26.8: Destroy replay panel
    this.replayPanel?.destroy();
    this.replayPanel = null;

    // Story 19.4: Destroy journey map
    this.journeyMap?.destroy();
    this.journeyMap = null;
    this.journeyMapBuilder = null;
    this.collectibleStorage = null;

    // Remove element from DOM
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    this.container = null;
  }
}
