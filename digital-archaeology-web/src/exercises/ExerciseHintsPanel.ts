// src/exercises/ExerciseHintsPanel.ts
// UI panel for progressive exercise hints
// Story 21.5: Implement Progressive Hints

import type { ExerciseMetadata } from './types';

/** Tracks how many hints have been revealed per exercise */
export class ExerciseHintStorage {
  private readonly storageKey: string;

  constructor(key: string = 'digital-archaeology-exercise-hints') {
    this.storageKey = key;
  }

  /** Get the number of hints revealed for an exercise */
  getRevealedCount(exerciseId: string): number {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return 0;
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed !== 'object' || parsed === null) return 0;
      const record = parsed as Record<string, unknown>;
      const count = record[exerciseId];
      return typeof count === 'number' && count >= 0 ? count : 0;
    } catch {
      return 0;
    }
  }

  /** Reveal one more hint for an exercise. Returns new count. */
  revealNext(exerciseId: string, maxHints: number): number {
    try {
      const raw = localStorage.getItem(this.storageKey);
      const parsed: unknown = raw ? JSON.parse(raw) : {};
      const record: Record<string, number> =
        typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, number>) : {};
      const current = typeof record[exerciseId] === 'number' ? record[exerciseId] : 0;
      const next = Math.min(current + 1, maxHints);
      record[exerciseId] = next;
      localStorage.setItem(this.storageKey, JSON.stringify(record));
      return next;
    } catch {
      return 0;
    }
  }

  /** Clear all hint progress */
  clearAll(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      // Ignore
    }
  }
}

/**
 * A collapsible panel showing progressive hints for an exercise.
 * Reveals one hint at a time; each reveal is persisted.
 */
export class ExerciseHintsPanel {
  private panel: HTMLElement | null = null;
  private hostElement: HTMLElement | null = null;
  private hintStorage: ExerciseHintStorage;
  private currentExerciseId: string | null = null;
  private revealedCount = 0;
  private totalHints = 0;

  constructor(storage?: ExerciseHintStorage) {
    this.hintStorage = storage ?? new ExerciseHintStorage();
  }

  /**
   * Show the hints panel for an exercise.
   */
  show(exercise: ExerciseMetadata, host: HTMLElement): void {
    this.dismiss();
    this.hostElement = host;
    this.currentExerciseId = exercise.id;
    this.totalHints = exercise.hints.length;
    this.revealedCount = Math.min(
      this.hintStorage.getRevealedCount(exercise.id),
      this.totalHints,
    );

    if (this.totalHints === 0) return;

    const panel = document.createElement('div');
    panel.className = 'da-exercise-hints';
    panel.setAttribute('role', 'complementary');
    panel.setAttribute('aria-label', 'Exercise hints');

    // Header
    const header = document.createElement('div');
    header.className = 'da-exercise-hints__header';

    const title = document.createElement('span');
    title.className = 'da-exercise-hints__title';
    title.textContent = 'Hints';
    header.appendChild(title);

    const counter = document.createElement('span');
    counter.className = 'da-exercise-hints__counter';
    counter.textContent = `${this.revealedCount}/${this.totalHints}`;
    header.appendChild(counter);

    // Dismiss button
    const dismissBtn = document.createElement('button');
    dismissBtn.className = 'da-exercise-hints__dismiss';
    dismissBtn.textContent = '\u00d7';
    dismissBtn.setAttribute('aria-label', 'Dismiss hints');
    dismissBtn.addEventListener('click', () => this.dismiss());
    header.appendChild(dismissBtn);

    panel.appendChild(header);

    // Hint list
    const list = document.createElement('ol');
    list.className = 'da-exercise-hints__list';

    for (let i = 0; i < this.totalHints; i++) {
      const item = document.createElement('li');
      item.className = 'da-exercise-hints__item';
      if (i < this.revealedCount) {
        item.classList.add('da-exercise-hints__item--revealed');
        item.textContent = exercise.hints[i];
      } else {
        item.classList.add('da-exercise-hints__item--hidden');
        item.textContent = `Hint ${i + 1} (click "Show Next Hint" to reveal)`;
        item.setAttribute('aria-hidden', 'true');
      }
      list.appendChild(item);
    }
    panel.appendChild(list);

    // "Show Next Hint" button (only if there are unrevealed hints)
    if (this.revealedCount < this.totalHints) {
      const revealBtn = document.createElement('button');
      revealBtn.className = 'da-exercise-hints__reveal';
      revealBtn.textContent = this.revealedCount === 0
        ? 'Show First Hint'
        : 'Show Next Hint';
      revealBtn.addEventListener('click', () => {
        this.revealNextHint(exercise);
      });
      panel.appendChild(revealBtn);
    } else {
      const allRevealed = document.createElement('div');
      allRevealed.className = 'da-exercise-hints__all-revealed';
      allRevealed.textContent = 'All hints revealed';
      panel.appendChild(allRevealed);
    }

    this.panel = panel;
    host.appendChild(panel);
  }

  /**
   * Reveal the next hint and re-render.
   */
  private revealNextHint(exercise: ExerciseMetadata): void {
    if (!this.currentExerciseId || !this.hostElement) return;
    this.hintStorage.revealNext(this.currentExerciseId, this.totalHints);
    this.show(exercise, this.hostElement);
  }

  /**
   * Remove the hints panel from the DOM.
   */
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
    this.currentExerciseId = null;
  }
}
