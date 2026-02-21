// src/exercises/ExerciseProgressPanel.ts
// Panel showing exercise completion progress per stage
// Story 21.7: Track Exercise Completion

import { STAGES_WITH_EXERCISES, STAGE_EXERCISE_LABELS, getExercisesByStage } from './exerciseMetadata';
import type { ExerciseProgressStorage } from './ExerciseProgressStorage';
import type { SolutionViewStorage } from './ExerciseSolutionPanel';

/**
 * A panel that displays exercise completion progress per stage,
 * including attempt counts, improvement indicators, and completion percentages.
 */
export class ExerciseProgressPanel {
  private panel: HTMLElement | null = null;
  private hostElement: HTMLElement | null = null;

  /**
   * Show the progress panel.
   */
  show(
    progressStorage: ExerciseProgressStorage,
    solutionViewStorage: SolutionViewStorage,
    host: HTMLElement,
  ): void {
    this.dismiss();
    this.hostElement = host;

    const panel = document.createElement('div');
    panel.className = 'da-exercise-progress';
    panel.setAttribute('role', 'complementary');
    panel.setAttribute('aria-label', 'Exercise progress');

    // Header
    const header = document.createElement('div');
    header.className = 'da-exercise-progress__header';

    const title = document.createElement('span');
    title.className = 'da-exercise-progress__title';
    title.textContent = 'Exercise Progress';
    header.appendChild(title);

    const dismissBtn = document.createElement('button');
    dismissBtn.className = 'da-exercise-progress__dismiss';
    dismissBtn.textContent = '\u00d7';
    dismissBtn.setAttribute('aria-label', 'Dismiss progress');
    dismissBtn.addEventListener('click', () => this.dismiss());
    header.appendChild(dismissBtn);

    panel.appendChild(header);

    // Load all data once to minimise localStorage reads
    const completedIds = progressStorage.load();
    const solutionViewedIds = solutionViewStorage.getViewedIds();
    let totalExercises = 0;
    let totalCompleted = 0;

    // Per-stage sections
    for (const stage of STAGES_WITH_EXERCISES) {
      const stageExercises = getExercisesByStage(stage);
      const stageIds = stageExercises.map(e => e.id);
      const summary = progressStorage.getStageSummary(stageIds);
      totalExercises += summary.total;
      totalCompleted += summary.completed;

      const section = document.createElement('div');
      section.className = 'da-exercise-progress__stage';

      const stageHeader = document.createElement('div');
      stageHeader.className = 'da-exercise-progress__stage-header';

      const stageName = document.createElement('span');
      stageName.className = 'da-exercise-progress__stage-name';
      stageName.textContent = STAGE_EXERCISE_LABELS[stage] ?? stage;
      stageHeader.appendChild(stageName);

      const stageCount = document.createElement('span');
      stageCount.className = 'da-exercise-progress__stage-count';
      stageCount.textContent = `${summary.completed}/${summary.total}`;
      stageHeader.appendChild(stageCount);

      section.appendChild(stageHeader);

      // Progress bar
      const progressBar = document.createElement('div');
      progressBar.className = 'da-exercise-progress__bar';
      const fill = document.createElement('div');
      fill.className = 'da-exercise-progress__bar-fill';
      const pct = summary.total > 0 ? (summary.completed / summary.total) * 100 : 0;
      fill.style.width = `${pct}%`;
      progressBar.appendChild(fill);
      section.appendChild(progressBar);

      // Per-exercise details
      const exerciseList = document.createElement('div');
      exerciseList.className = 'da-exercise-progress__exercises';

      for (const ex of stageExercises) {
        const row = document.createElement('div');
        row.className = 'da-exercise-progress__exercise';

        const isComplete = completedIds.has(ex.id);
        const viewedSolution = solutionViewedIds.has(ex.id);
        const attemptCount = progressStorage.getAttemptCount(ex.id);
        const firstSuccess = progressStorage.getFirstSuccess(ex.id);

        const icon = document.createElement('span');
        icon.className = 'da-exercise-progress__exercise-icon';
        icon.textContent = isComplete ? '\u2713' : '\u2022';
        if (isComplete) icon.classList.add('da-exercise-progress__exercise-icon--complete');
        row.appendChild(icon);

        const name = document.createElement('span');
        name.className = 'da-exercise-progress__exercise-name';
        name.textContent = ex.title;
        row.appendChild(name);

        const stats = document.createElement('span');
        stats.className = 'da-exercise-progress__exercise-stats';
        const parts: string[] = [];
        if (attemptCount > 0) parts.push(`${attemptCount} attempt${attemptCount !== 1 ? 's' : ''}`);
        // Improvement indicator: show which attempt was the first success
        if (firstSuccess && attemptCount > 1) {
          const attempts = progressStorage.getAttempts(ex.id);
          const successIndex = attempts.findIndex(a => a.passed);
          if (successIndex >= 0) {
            parts.push(`passed on attempt ${successIndex + 1}`);
          }
        }
        if (viewedSolution) parts.push('solution viewed');
        stats.textContent = parts.join(' \u00b7 ');
        row.appendChild(stats);

        exerciseList.appendChild(row);
      }

      section.appendChild(exerciseList);
      panel.appendChild(section);
    }

    // Overall summary
    const overall = document.createElement('div');
    overall.className = 'da-exercise-progress__overall';
    overall.textContent = `Overall: ${totalCompleted}/${totalExercises} exercises completed`;
    panel.appendChild(overall);

    this.panel = panel;
    host.appendChild(panel);
  }

  /** Dismiss the progress panel */
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
