// src/exercises/ExerciseDetailPanel.ts
// Expanded detail panel showing full exercise metadata
// Story 21.2: Implement Exercise Metadata

import type { ExerciseMetadata, ExerciseBrowserCallbacks } from './types';
import { DIFFICULTY_LABELS, DIFFICULTY_COLOR_VARS } from './types';
import { findExerciseById } from './exerciseMetadata';

const EXIT_DURATION_MS = 200;

/**
 * Expanded detail panel that slides in to show full exercise metadata.
 * Designed to be hosted inside the ExerciseBrowser overlay.
 */
export class ExerciseDetailPanel {
  private panel: HTMLElement | null = null;
  private exitTimeout: ReturnType<typeof setTimeout> | null = null;
  private previouslyFocusedElement: Element | null = null;

  /**
   * Show the detail panel for an exercise.
   * @param exercise The exercise metadata to display
   * @param completedIds Set of completed exercise IDs (for prereq status)
   * @param callbacks Browser callbacks (used to wire the Start button)
   * @param hostElement The parent to append the panel to
   */
  show(
    exercise: ExerciseMetadata,
    completedIds: ReadonlySet<string>,
    callbacks: ExerciseBrowserCallbacks | null,
    hostElement: HTMLElement,
  ): void {
    this.dismiss();
    this.previouslyFocusedElement = document.activeElement;
    this.panel = this.buildPanel(exercise, completedIds, callbacks);
    hostElement.appendChild(this.panel);

    // Animate in via double rAF, then focus close button
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.panel?.classList.add('da-exercise-detail--entering');
        this.panel?.querySelector<HTMLElement>('.da-exercise-detail__close')?.focus();
      });
    });
  }

  /** Dismiss the detail panel with exit animation */
  dismiss(): void {
    if (!this.panel) return;

    if (this.exitTimeout) {
      clearTimeout(this.exitTimeout);
      this.exitTimeout = null;
    }

    const panel = this.panel;
    panel.classList.remove('da-exercise-detail--entering');
    panel.classList.add('da-exercise-detail--exiting');

    this.exitTimeout = setTimeout(() => {
      panel.remove();
      this.exitTimeout = null;
    }, EXIT_DURATION_MS);

    this.panel = null;

    // Restore focus
    if (this.previouslyFocusedElement instanceof HTMLElement) {
      this.previouslyFocusedElement.focus();
    }
    this.previouslyFocusedElement = null;
  }

  /** Immediately remove without animation */
  destroy(): void {
    if (this.exitTimeout) {
      clearTimeout(this.exitTimeout);
      this.exitTimeout = null;
    }
    this.panel?.remove();
    this.panel = null;
  }

  isVisible(): boolean {
    return this.panel !== null;
  }

  // ── Private ─────────────────────────────────────────────

  private buildPanel(
    exercise: ExerciseMetadata,
    completedIds: ReadonlySet<string>,
    callbacks: ExerciseBrowserCallbacks | null,
  ): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'da-exercise-detail';
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-label', `Details for ${exercise.title}`);

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'da-exercise-detail__close';
    closeBtn.textContent = '\u00D7';
    closeBtn.setAttribute('aria-label', 'Close details');
    closeBtn.addEventListener('click', () => this.dismiss());
    panel.appendChild(closeBtn);

    // Title
    const title = document.createElement('h3');
    title.className = 'da-exercise-detail__title';
    title.textContent = exercise.title;
    panel.appendChild(title);

    // Difficulty badge
    const diff = document.createElement('span');
    diff.className = `da-exercise-detail__difficulty da-exercise-detail__difficulty--${exercise.difficulty}`;
    diff.textContent = DIFFICULTY_LABELS[exercise.difficulty];
    diff.style.setProperty('--badge-color', DIFFICULTY_COLOR_VARS[exercise.difficulty]);
    panel.appendChild(diff);

    // Completed status
    if (completedIds.has(exercise.id)) {
      const completedBadge = document.createElement('span');
      completedBadge.className = 'da-exercise-detail__completed';
      completedBadge.textContent = '\u2713 Completed';
      panel.appendChild(completedBadge);
    }

    // Description
    const desc = document.createElement('p');
    desc.className = 'da-exercise-detail__description';
    desc.textContent = exercise.description;
    panel.appendChild(desc);

    // Estimated time
    const timeRow = this.buildMetadataRow('Estimated Time', `${exercise.estimatedMinutes} minutes`);
    panel.appendChild(timeRow);

    // Concepts (all of them)
    if (exercise.concepts.length > 0) {
      const conceptsRow = document.createElement('div');
      conceptsRow.className = 'da-exercise-detail__section';

      const conceptsLabel = document.createElement('span');
      conceptsLabel.className = 'da-exercise-detail__label';
      conceptsLabel.textContent = 'Concepts';
      conceptsRow.appendChild(conceptsLabel);

      const conceptsList = document.createElement('div');
      conceptsList.className = 'da-exercise-detail__concepts';
      for (const concept of exercise.concepts) {
        const chip = document.createElement('span');
        chip.className = 'da-exercise-detail__concept-chip';
        chip.textContent = concept;
        conceptsList.appendChild(chip);
      }
      conceptsRow.appendChild(conceptsList);
      panel.appendChild(conceptsRow);
    }

    // Prerequisites
    if (exercise.prerequisites.length > 0) {
      const prereqSection = document.createElement('div');
      prereqSection.className = 'da-exercise-detail__section';

      const prereqLabel = document.createElement('span');
      prereqLabel.className = 'da-exercise-detail__label';
      prereqLabel.textContent = 'Prerequisites';
      prereqSection.appendChild(prereqLabel);

      const prereqList = document.createElement('ul');
      prereqList.className = 'da-exercise-detail__prerequisites';
      for (const prereqId of exercise.prerequisites) {
        const prereqExercise = findExerciseById(prereqId);
        const li = document.createElement('li');
        li.className = 'da-exercise-detail__prereq-item';

        const isPrereqDone = completedIds.has(prereqId);
        if (isPrereqDone) {
          li.classList.add('da-exercise-detail__prereq-item--completed');
        }

        const statusIcon = document.createElement('span');
        statusIcon.className = 'da-exercise-detail__prereq-status';
        statusIcon.textContent = isPrereqDone ? '\u2713' : '\u25CB';
        statusIcon.setAttribute('aria-hidden', 'true');
        li.appendChild(statusIcon);

        const prereqTitle = document.createElement('span');
        prereqTitle.className = 'da-exercise-detail__prereq-title';
        prereqTitle.textContent = prereqExercise?.title ?? prereqId;
        li.appendChild(prereqTitle);

        prereqList.appendChild(li);
      }
      prereqSection.appendChild(prereqList);
      panel.appendChild(prereqSection);
    } else {
      const noPrereq = this.buildMetadataRow('Prerequisites', 'None');
      panel.appendChild(noPrereq);
    }

    // Start exercise button
    const startBtn = document.createElement('button');
    startBtn.className = 'da-exercise-detail__start';
    startBtn.textContent = completedIds.has(exercise.id) ? 'Retry Exercise' : 'Start Exercise';
    startBtn.addEventListener('click', () => {
      this.dismiss();
      callbacks?.onExerciseSelect(exercise);
    });
    panel.appendChild(startBtn);

    return panel;
  }

  private buildMetadataRow(label: string, value: string): HTMLElement {
    const row = document.createElement('div');
    row.className = 'da-exercise-detail__section';

    const labelEl = document.createElement('span');
    labelEl.className = 'da-exercise-detail__label';
    labelEl.textContent = label;
    row.appendChild(labelEl);

    const valueEl = document.createElement('span');
    valueEl.className = 'da-exercise-detail__value';
    valueEl.textContent = value;
    row.appendChild(valueEl);

    return row;
  }
}
