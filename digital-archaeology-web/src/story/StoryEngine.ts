// src/story/StoryEngine.ts
// Story progression engine with state management
// Story 10.15: Create Story Progression Engine
// Story 10.18: Create Historical Personas System
// Story 10.21: Historical Mindset Time-Travel

import type { StoryScene, StoryAct, BranchContent } from './content-types';
import type { StoryProgress, StoryPosition, StoryChoice, StoryEngineState, TimelineEntry } from './StoryState';
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
/** Custom event type for decision-builder cycle completion (Story 10.22) */
export interface DecisionBuilderCycleEvent extends CustomEvent {
  detail: {
    decisionId: string;
    chosenOptionId: string;
  };
}

export class StoryEngine {
  private state: StoryEngineState;
  private storage: StoryStorage;
  private sceneHistory: string[] = [];
  private content: {
    acts: StoryAct[];
    sceneIndex: Map<string, { scene: StoryScene; actNumber: number; chapterNumber: number; branchId?: string }>;
  } | null = null;

  // Story 10.22: Decision-builder state tracking
  private pendingDecision: { decisionId: string; chosenOptionId: string } | null = null;

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
    const sceneIndex = new Map<string, { scene: StoryScene; actNumber: number; chapterNumber: number; branchId?: string }>();

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

      // Story 26.9: Index branch scenes alongside golden-path scenes
      if (act.branches) {
        for (const branch of act.branches) {
          for (const scene of branch.scenes) {
            if (sceneIndex.has(scene.id)) {
              console.warn(
                `StoryEngine: duplicate scene ID "${scene.id}" in branch "${branch.id}" ` +
                `(already indexed from golden path or earlier branch)`
              );
            }
            sceneIndex.set(scene.id, {
              scene,
              actNumber: act.number,
              chapterNumber: 0, // branch scenes don't belong to a numbered chapter
              branchId: branch.id,
            });
          }
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
   * Story 26.7: Also detects branch points and tracks alternate timelines.
   */
  recordChoice(choiceId: string): void {
    if (!this.state.progress) {
      throw new Error('No active progress. Navigate to a scene first.');
    }

    // Story 26.7: Check if this choice creates a timeline branch
    const currentScene = this.getCurrentScene();
    const choiceData = currentScene?.choices?.find(c => c.id === choiceId);
    const isBranchPoint = choiceData?.isBranchPoint ?? false;
    const branchLabel = choiceData?.branchLabel;

    const choice: StoryChoice = {
      sceneId: this.state.progress.position.sceneId,
      choiceId,
      timestamp: Date.now(),
      ...(isBranchPoint && { isBranchPoint: true }),
      ...(branchLabel && { branchLabel }),
    };

    // Story 26.7: If entering a branch, set currentBranchId (scoped to scene for global uniqueness)
    const currentBranchId = isBranchPoint
      ? `branch-${this.state.progress.position.sceneId}-${choiceId}`
      : this.state.progress.currentBranchId;

    this.state.progress = {
      ...this.state.progress,
      choices: [...this.state.progress.choices, choice],
      lastPlayedAt: Date.now(),
      currentBranchId,
    };

    this.dispatchStateChanged(null);
    this.saveProgress();
  }

  /**
   * Story 26.7: Rejoin the golden path from an alternate timeline.
   * Called when the story converges back to the main timeline.
   */
  rejoinGoldenPath(): void {
    if (!this.state.progress) return;
    this.state.progress = {
      ...this.state.progress,
      currentBranchId: null,
      lastPlayedAt: Date.now(),
    };
    this.dispatchStateChanged(null);
    this.saveProgress();
  }

  /**
   * Story 26.7: Get the current branch ID (null = golden path).
   */
  getCurrentBranchId(): string | null {
    return this.state.progress?.currentBranchId ?? null;
  }

  /**
   * Story 26.7: Check if the player is on an alternate timeline.
   */
  isOnAlternateBranch(): boolean {
    return this.state.progress?.currentBranchId != null;
  }

  // =========================================================================
  // Story 26.8: Time-Travel Replay
  // =========================================================================

  /**
   * Enter replay mode to revisit a past scene without affecting progress.
   * The scene must exist in the content and the player must have visited it.
   */
  enterReplayMode(sceneId: string): void {
    if (!this.content) return;
    const entry = this.content.sceneIndex.get(sceneId);
    if (!entry) return;

    this.state = { ...this.state, replaySceneId: sceneId };
    this.dispatchReplayChanged(sceneId);
  }

  /**
   * Exit replay mode and return to live play.
   */
  exitReplayMode(): void {
    if (!this.state.replaySceneId) return;
    this.state = { ...this.state, replaySceneId: null };
    this.dispatchReplayChanged(null);
  }

  /**
   * Check if the engine is in replay mode.
   */
  isInReplayMode(): boolean {
    return this.state.replaySceneId !== null;
  }

  /**
   * Get the scene being replayed (null if not replaying).
   */
  getReplayScene(): StoryScene | null {
    if (!this.state.replaySceneId || !this.content) return null;
    const entry = this.content.sceneIndex.get(this.state.replaySceneId);
    return entry?.scene ?? null;
  }

  /**
   * Get the replay scene ID (null if not replaying).
   */
  getReplaySceneId(): string | null {
    return this.state.replaySceneId;
  }

  // =========================================================================
  // Story 26.9: Branch Content Queries
  // =========================================================================

  /**
   * Get the branch ID for a scene (null = golden path).
   * Story 26.9: Alternate Timeline Story Content
   */
  getBranchForScene(sceneId: string): string | null {
    return this.content?.sceneIndex.get(sceneId)?.branchId ?? null;
  }

  /**
   * Get all branches for a specific act.
   * Story 26.9: Alternate Timeline Story Content
   */
  getActBranches(actNumber: number): BranchContent[] {
    if (!this.content) return [];
    const act = this.content.acts.find(a => a.number === actNumber);
    return act?.branches ?? [];
  }

  // =========================================================================
  // Story 26.10: Challenge Completion Tracking
  // =========================================================================

  /**
   * Mark a challenge scene as completed.
   * Story 26.10: Seamless Story-Lab-Story Loop
   */
  markChallengeCompleted(sceneId: string): void {
    if (!this.state.progress) return;
    const existing = this.state.progress.completedChallenges ?? [];
    if (existing.includes(sceneId)) return;
    this.state.progress = {
      ...this.state.progress,
      completedChallenges: [...existing, sceneId],
      lastPlayedAt: Date.now(),
    };
    this.saveProgress();
  }

  /**
   * Check if a specific challenge was completed.
   * Story 26.10: Seamless Story-Lab-Story Loop
   */
  isChallengeCompleted(sceneId: string): boolean {
    return this.state.progress?.completedChallenges?.includes(sceneId) ?? false;
  }

  /**
   * Get all completed challenge scene IDs.
   * Story 26.10: Seamless Story-Lab-Story Loop
   */
  getCompletedChallenges(): string[] {
    return this.state.progress?.completedChallenges ?? [];
  }

  // =========================================================================
  // Story 26.12: Navigation Bookmark
  // =========================================================================

  /**
   * Save the current position as a navigation bookmark.
   * Used before timeline jumps so the user can "return" later.
   */
  setNavigationBookmark(): void {
    if (!this.state.progress) return;
    this.state.progress = {
      ...this.state.progress,
      navigationBookmark: { ...this.state.progress.position },
      lastPlayedAt: Date.now(),
    };
    this.saveProgress();
  }

  /**
   * Get the current navigation bookmark (null if none set).
   */
  getNavigationBookmark(): StoryPosition | null {
    return this.state.progress?.navigationBookmark ?? null;
  }

  /**
   * Clear the navigation bookmark.
   */
  clearNavigationBookmark(): void {
    if (!this.state.progress?.navigationBookmark) return;
    this.state.progress = {
      ...this.state.progress,
      navigationBookmark: undefined,
      lastPlayedAt: Date.now(),
    };
    this.saveProgress();
  }

  /**
   * Return to the bookmarked position (clears bookmark and navigates).
   */
  returnToBookmark(): void {
    const bookmark = this.getNavigationBookmark();
    if (!bookmark) return;
    this.clearNavigationBookmark();
    this.goToScene(bookmark.sceneId);
  }

  /**
   * Build a chronological timeline of visited scenes with context.
   * Uses scene history + choices to reconstruct the journey.
   */
  getVisitedSceneTimeline(): TimelineEntry[] {
    if (!this.content || !this.state.progress) return [];

    // Build a set of scenes where choices were made (for "choiceMade" field)
    const choicesByScene = new Map<string, string>();
    for (const choice of this.state.progress.choices) {
      choicesByScene.set(choice.sceneId, choice.choiceId);
    }

    // Use scene history as the primary ordering
    const timeline: TimelineEntry[] = [];
    const seen = new Set<string>();

    // Story 26.9: Helper to resolve chapter title — uses branch label for branch scenes
    const resolveChapterTitle = (entry: { actNumber: number; chapterNumber: number; branchId?: string }): string => {
      const act = this.content!.acts.find(a => a.number === entry.actNumber);
      if (entry.branchId) {
        const branch = act?.branches?.find(b => b.id === entry.branchId);
        return branch?.label ?? 'Alternate Timeline';
      }
      const chapter = act?.chapters.find(c => c.number === entry.chapterNumber);
      return chapter?.title ?? `Chapter ${entry.chapterNumber}`;
    };

    for (const sceneId of this.sceneHistory) {
      if (seen.has(sceneId)) continue;
      seen.add(sceneId);

      const entry = this.content.sceneIndex.get(sceneId);
      if (!entry) continue;

      const act = this.content.acts.find(a => a.number === entry.actNumber);

      timeline.push({
        sceneId,
        actNumber: entry.actNumber,
        chapterNumber: entry.chapterNumber,
        sceneType: entry.scene.type,
        actTitle: act?.title ?? `Act ${entry.actNumber}`,
        chapterTitle: resolveChapterTitle(entry),
        visitedAt: this.state.progress!.startedAt + timeline.length * 1000,
        choiceMade: choicesByScene.get(sceneId),
      });
    }

    // Include current scene if not already in history
    const currentSceneId = this.state.progress.position.sceneId;
    if (!seen.has(currentSceneId)) {
      const entry = this.content.sceneIndex.get(currentSceneId);
      if (entry) {
        const act = this.content.acts.find(a => a.number === entry.actNumber);
        timeline.push({
          sceneId: currentSceneId,
          actNumber: entry.actNumber,
          chapterNumber: entry.chapterNumber,
          sceneType: entry.scene.type,
          actTitle: act?.title ?? `Act ${entry.actNumber}`,
          chapterTitle: resolveChapterTitle(entry),
          visitedAt: this.state.progress!.lastPlayedAt,
          choiceMade: choicesByScene.get(currentSceneId),
        });
      }
    }

    return timeline;
  }

  /**
   * Dispatch replay mode change event.
   */
  private dispatchReplayChanged(replaySceneId: string | null): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('story-replay-changed', {
        detail: { replaySceneId, progress: this.state.progress },
      }));
    }
  }

  /**
   * Record a historical decision made by the user.
   * Stores the decision context for the next builder scene.
   * Story 10.22: Decision-Maker + Builder Mode
   */
  recordDecision(decisionId: string, optionId: string): void {
    this.pendingDecision = { decisionId, chosenOptionId: optionId };
  }

  /**
   * Get the pending decision context (if any).
   * Used by builder scenes to know what decision led here.
   * Story 10.22: Decision-Maker + Builder Mode
   */
  getPendingDecision(): { decisionId: string; chosenOptionId: string } | null {
    return this.pendingDecision;
  }

  /**
   * Clear the pending decision and dispatch cycle-complete event.
   * Called when a builder scene completes.
   * Story 10.22: Decision-Maker + Builder Mode
   */
  completeDecisionBuilderCycle(): void {
    if (!this.pendingDecision) return;

    const { decisionId, chosenOptionId } = this.pendingDecision;
    this.pendingDecision = null;

    this.dispatchDecisionBuilderCycle(decisionId, chosenOptionId);
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

        // Story 10.22: Restore pendingDecision from saved progress
        if (savedProgress.pendingDecision) {
          this.pendingDecision = savedProgress.pendingDecision;
        }

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
      // Story 10.22: Persist pendingDecision in progress
      this.state.progress.pendingDecision = this.pendingDecision;
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

  /**
   * Dispatch decision-builder-cycle event.
   * Story 10.22: Decision-Maker + Builder Mode
   */
  private dispatchDecisionBuilderCycle(decisionId: string, chosenOptionId: string): void {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('decision-builder-cycle', {
        detail: {
          decisionId,
          chosenOptionId,
        },
      });
      window.dispatchEvent(event);
    }
  }
}
