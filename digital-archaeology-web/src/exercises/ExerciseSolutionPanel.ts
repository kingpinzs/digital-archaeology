// src/exercises/ExerciseSolutionPanel.ts
// UI panel for revealing exercise solutions with explanation
// Story 21.6: Implement Solution Reveal

import type { ExerciseMetadata } from './types';

/** Callbacks from the solution panel */
export interface ExerciseSolutionPanelCallbacks {
  /** Called when the user dismisses the panel */
  readonly onDismiss: () => void;
}

/**
 * Tracks which exercises the user has viewed the solution for.
 * Uses localStorage with a separate key from hint/progress tracking.
 */
export class SolutionViewStorage {
  private readonly storageKey: string;

  constructor(key: string = 'digital-archaeology-solution-views') {
    this.storageKey = key;
  }

  /** Check if user has viewed solution for an exercise */
  hasViewed(exerciseId: string): boolean {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return false;
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return false;
      return parsed.includes(exerciseId);
    } catch {
      return false;
    }
  }

  /** Mark an exercise's solution as viewed */
  markViewed(exerciseId: string): void {
    try {
      const raw = localStorage.getItem(this.storageKey);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      const viewed: string[] = Array.isArray(parsed) ? [...parsed] : [];
      if (!viewed.includes(exerciseId)) {
        viewed.push(exerciseId);
        localStorage.setItem(this.storageKey, JSON.stringify(viewed));
      }
    } catch {
      // Ignore write failures
    }
  }

  /** Get set of all viewed exercise IDs */
  getViewedIds(): ReadonlySet<string> {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return new Set();
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return new Set();
      return new Set(parsed.filter((v): v is string => typeof v === 'string'));
    } catch {
      return new Set();
    }
  }

  /** Clear all solution view records */
  clearAll(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      // Ignore
    }
  }
}

/**
 * Panel that reveals an exercise's solution and explanation.
 * Shows a confirmation step before revealing to encourage effort.
 */
export class ExerciseSolutionPanel {
  private panel: HTMLElement | null = null;
  private hostElement: HTMLElement | null = null;
  private solutionViewStorage: SolutionViewStorage;

  constructor(storage?: SolutionViewStorage) {
    this.solutionViewStorage = storage ?? new SolutionViewStorage();
  }

  /**
   * Show the solution panel for an exercise.
   * If the user hasn't previously viewed the solution, shows a confirmation first.
   */
  show(
    exercise: ExerciseMetadata,
    userCode: string,
    callbacks: ExerciseSolutionPanelCallbacks,
    host: HTMLElement,
  ): void {
    this.dismiss();
    this.hostElement = host;

    if (!exercise.solution) return;

    const alreadyViewed = this.solutionViewStorage.hasViewed(exercise.id);

    const panel = document.createElement('div');
    panel.className = 'da-exercise-solution';
    panel.setAttribute('role', 'complementary');
    panel.setAttribute('aria-label', 'Exercise solution');

    // Header
    const header = document.createElement('div');
    header.className = 'da-exercise-solution__header';

    const title = document.createElement('span');
    title.className = 'da-exercise-solution__title';
    title.textContent = 'Solution';
    header.appendChild(title);

    const dismissBtn = document.createElement('button');
    dismissBtn.className = 'da-exercise-solution__dismiss';
    dismissBtn.textContent = '\u00d7';
    dismissBtn.setAttribute('aria-label', 'Dismiss solution');
    dismissBtn.addEventListener('click', () => {
      this.dismiss();
      callbacks.onDismiss();
    });
    header.appendChild(dismissBtn);

    panel.appendChild(header);

    if (alreadyViewed) {
      this.renderSolutionContent(panel, exercise, userCode);
    } else {
      this.renderConfirmation(panel, exercise, userCode, callbacks);
    }

    this.panel = panel;
    host.appendChild(panel);
  }

  /** Render the "are you sure?" confirmation step */
  private renderConfirmation(
    panel: HTMLElement,
    exercise: ExerciseMetadata,
    userCode: string,
    callbacks: ExerciseSolutionPanelCallbacks,
  ): void {
    const warning = document.createElement('div');
    warning.className = 'da-exercise-solution__warning';
    warning.setAttribute('role', 'alert');
    warning.textContent =
      'Viewing the solution will be recorded in your progress. Try using the hints first!';
    panel.appendChild(warning);

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'da-exercise-solution__confirm';
    confirmBtn.textContent = 'Show Solution Anyway';
    confirmBtn.addEventListener('click', () => {
      this.solutionViewStorage.markViewed(exercise.id);
      // Re-render with solution visible
      if (this.hostElement) {
        this.show(exercise, userCode, callbacks, this.hostElement);
      }
    });
    panel.appendChild(confirmBtn);
  }

  /** Render the actual solution code and explanation */
  private renderSolutionContent(
    panel: HTMLElement,
    exercise: ExerciseMetadata,
    userCode: string,
  ): void {
    // Explanation
    const explanation = document.createElement('div');
    explanation.className = 'da-exercise-solution__explanation';
    explanation.textContent = exercise.solutionExplanation;
    panel.appendChild(explanation);

    // Solution code
    const codeLabel = document.createElement('div');
    codeLabel.className = 'da-exercise-solution__code-label';
    codeLabel.textContent = 'Solution Code:';
    panel.appendChild(codeLabel);

    const codeBlock = document.createElement('pre');
    codeBlock.className = 'da-exercise-solution__code';
    const codeContent = document.createElement('code');
    codeContent.textContent = exercise.solution;
    codeBlock.appendChild(codeContent);
    panel.appendChild(codeBlock);

    // User's attempt (for comparison)
    const trimmedUserCode = userCode.trim();
    if (trimmedUserCode && trimmedUserCode !== exercise.starterCode.trim()) {
      const userLabel = document.createElement('div');
      userLabel.className = 'da-exercise-solution__code-label';
      userLabel.textContent = 'Your Attempt:';
      panel.appendChild(userLabel);

      const userBlock = document.createElement('pre');
      userBlock.className = 'da-exercise-solution__code da-exercise-solution__code--user';
      const userContent = document.createElement('code');
      userContent.textContent = trimmedUserCode;
      userBlock.appendChild(userContent);
      panel.appendChild(userBlock);
    }
  }

  /** Dismiss the solution panel */
  dismiss(): void {
    if (this.panel && this.hostElement && this.hostElement.contains(this.panel)) {
      this.hostElement.removeChild(this.panel);
    }
    this.panel = null;
    this.hostElement = null;
  }

  /** Whether the panel is currently visible */
  isVisible(): boolean {
    return this.panel !== null;
  }

  /** Clean up */
  destroy(): void {
    this.dismiss();
  }
}
