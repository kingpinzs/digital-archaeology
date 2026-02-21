// src/exercises/ExerciseBrowser.ts
// Modal browser for browsing and selecting exercises
// Story 21.1: Create Exercise Browser

import type {
  ExerciseMetadata,
  ExerciseDifficulty,
  ExerciseBrowserData,
  ExerciseBrowserCallbacks,
} from './types';
import { DIFFICULTY_LABELS, DIFFICULTY_ORDER, DIFFICULTY_COLOR_VARS } from './types';
import {
  STAGES_WITH_EXERCISES,
  STAGE_EXERCISE_LABELS,
  getExerciseCountByStage,
  findExerciseById,
} from './exerciseMetadata';
import { ExerciseDetailPanel } from './ExerciseDetailPanel';
import type { LabStage } from '@ui/StageSelector';

const EXIT_DURATION_MS = 300;

/**
 * Modal browser for browsing and filtering exercises by stage and difficulty.
 * Follows LiteratureBrowser modal pattern:
 * - Double-invocation guard on open()
 * - Focus trap and focus restoration
 * - Double rAF for enter animation
 * - Escape/backdrop dismiss
 * - Stage grouping with difficulty filter chips
 */
export class ExerciseBrowser {
  private container: HTMLElement | null = null;
  private overlay: HTMLElement | null = null;
  private exitTimeout: ReturnType<typeof setTimeout> | null = null;
  private previouslyFocusedElement: Element | null = null;

  private callbacks: ExerciseBrowserCallbacks | null = null;
  private exercises: readonly ExerciseMetadata[] = [];
  private completedIds: ReadonlySet<string> = new Set();
  private currentStage: LabStage | null = null;

  private activeDifficulty: ExerciseDifficulty | null = null;
  private activeStageFilter: LabStage | null = null;
  private searchQuery: string = '';
  private readonly detailPanel: ExerciseDetailPanel = new ExerciseDetailPanel();

  // Bound handlers for cleanup
  private readonly boundHandleKeydown: (e: KeyboardEvent) => void;
  private readonly boundHandleBackdropClick: (e: MouseEvent) => void;

  constructor() {
    this.boundHandleKeydown = this.handleKeydown.bind(this);
    this.boundHandleBackdropClick = this.handleBackdropClick.bind(this);
  }

  /** Mount the browser to a parent element. Does not show the modal. */
  mount(parent: HTMLElement): void {
    this.container = parent;
  }

  /** Open the modal. Double-invocation guard: returns early if already open. */
  open(data: ExerciseBrowserData, callbacks: ExerciseBrowserCallbacks): void {
    if (this.overlay) return;

    this.callbacks = callbacks;
    this.exercises = data.exercises;
    this.completedIds = data.completedIds ?? new Set();
    this.currentStage = data.currentStage ?? null;
    this.activeDifficulty = null;
    this.activeStageFilter = this.currentStage;
    this.searchQuery = '';

    this.previouslyFocusedElement = document.activeElement;
    this.buildOverlay();
    const parent = this.container ?? document.body;
    parent.appendChild(this.overlay!);

    document.addEventListener('keydown', this.boundHandleKeydown);

    // Double rAF for enter animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.overlay?.classList.add('da-exercise-browser--entering');
        this.overlay?.querySelector<HTMLElement>('.da-exercise-browser__search')?.focus();
      });
    });
  }

  /** Close the modal with exit animation */
  close(): void {
    if (!this.overlay) return;

    this.overlay.classList.remove('da-exercise-browser--entering');
    this.overlay.classList.add('da-exercise-browser--exiting');

    this.exitTimeout = setTimeout(() => {
      this.removeOverlay();
      this.callbacks?.onClose();
    }, EXIT_DURATION_MS);
  }

  /** Destroy the modal immediately without firing onClose */
  destroy(): void {
    this.removeOverlay();
    this.container = null;
    this.callbacks = null;
  }

  /** Check if the modal is currently open */
  isOpen(): boolean {
    return this.overlay !== null;
  }

  /** Mark an exercise as completed and update UI */
  markExerciseCompleted(exerciseId: string): void {
    if (this.completedIds.has(exerciseId)) return;
    this.completedIds = new Set([...this.completedIds, exerciseId]);
    this.updateGrid();
  }

  // ── Private ────────────────────────────────────────────────

  private removeOverlay(): void {
    if (this.exitTimeout) {
      clearTimeout(this.exitTimeout);
      this.exitTimeout = null;
    }
    this.detailPanel.destroy();
    document.removeEventListener('keydown', this.boundHandleKeydown);
    this.overlay?.remove();
    this.overlay = null;

    // Restore focus
    if (this.previouslyFocusedElement instanceof HTMLElement) {
      this.previouslyFocusedElement.focus();
    }
    this.previouslyFocusedElement = null;
  }

  private buildOverlay(): void {
    this.overlay = document.createElement('div');
    this.overlay.className = 'da-exercise-browser';
    this.overlay.setAttribute('role', 'dialog');
    this.overlay.setAttribute('aria-modal', 'true');
    this.overlay.setAttribute('aria-labelledby', 'da-exercise-browser-title');

    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'da-exercise-browser__backdrop';
    backdrop.addEventListener('click', this.boundHandleBackdropClick);
    this.overlay.appendChild(backdrop);

    // Content container
    const content = document.createElement('div');
    content.className = 'da-exercise-browser__content';

    content.appendChild(this.buildHeader());
    content.appendChild(this.buildFilters());
    content.appendChild(this.buildGrid());

    this.overlay.appendChild(content);
  }

  private buildHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'da-exercise-browser__header';

    const titleRow = document.createElement('div');
    titleRow.className = 'da-exercise-browser__title-row';

    const title = document.createElement('h2');
    title.className = 'da-exercise-browser__title';
    title.id = 'da-exercise-browser-title';
    title.textContent = 'Exercises';
    titleRow.appendChild(title);

    // Completion stats
    const stats = document.createElement('span');
    stats.className = 'da-exercise-browser__stats';
    stats.setAttribute('aria-live', 'polite');
    this.updateStatsElement(stats);
    titleRow.appendChild(stats);

    // View Progress button (Story 21.7)
    if (this.callbacks?.onViewProgress) {
      const progressBtn = document.createElement('button');
      progressBtn.className = 'da-exercise-browser__progress-btn';
      progressBtn.textContent = 'View Progress';
      progressBtn.setAttribute('aria-label', 'View exercise progress');
      progressBtn.addEventListener('click', () => {
        this.callbacks?.onViewProgress?.();
      });
      titleRow.appendChild(progressBtn);
    }

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'da-exercise-browser__close';
    closeBtn.textContent = '\u00D7';
    closeBtn.setAttribute('aria-label', 'Close exercise browser');
    closeBtn.addEventListener('click', () => this.close());
    titleRow.appendChild(closeBtn);

    header.appendChild(titleRow);

    // Search input
    const search = document.createElement('input');
    search.className = 'da-exercise-browser__search';
    search.type = 'text';
    search.placeholder = 'Search exercises...';
    search.setAttribute('aria-label', 'Search exercises');
    search.addEventListener('input', () => {
      this.searchQuery = search.value.trim().toLowerCase();
      this.updateGrid();
    });
    header.appendChild(search);

    return header;
  }

  private buildFilters(): HTMLElement {
    const filters = document.createElement('div');
    filters.className = 'da-exercise-browser__filters';
    filters.setAttribute('role', 'toolbar');
    filters.setAttribute('aria-label', 'Exercise filters');

    // "All" chip
    const allChip = document.createElement('button');
    allChip.className = 'da-exercise-browser__filter-chip da-exercise-browser__filter-chip--active';
    allChip.setAttribute('data-stage', 'all');
    allChip.textContent = `All (${this.exercises.length})`;
    allChip.addEventListener('click', () => {
      this.activeStageFilter = null;
      this.updateFilters();
      this.updateGrid();
    });
    filters.appendChild(allChip);

    // Stage chips
    for (const stage of STAGES_WITH_EXERCISES) {
      const count = getExerciseCountByStage(stage);
      const chip = document.createElement('button');
      chip.className = 'da-exercise-browser__filter-chip';
      chip.setAttribute('data-stage', stage);
      const label = STAGE_EXERCISE_LABELS[stage] ?? stage;
      chip.textContent = `${label} (${count})`;
      if (this.activeStageFilter === stage) {
        chip.classList.add('da-exercise-browser__filter-chip--active');
        allChip.classList.remove('da-exercise-browser__filter-chip--active');
      }
      chip.addEventListener('click', () => {
        this.activeStageFilter = stage;
        this.updateFilters();
        this.updateGrid();
      });
      filters.appendChild(chip);
    }

    // Divider
    const divider = document.createElement('div');
    divider.className = 'da-exercise-browser__filter-divider';
    filters.appendChild(divider);

    // Difficulty chips
    for (const diff of DIFFICULTY_ORDER) {
      const chip = document.createElement('button');
      chip.className = 'da-exercise-browser__filter-chip da-exercise-browser__filter-chip--difficulty';
      chip.setAttribute('data-difficulty', diff);
      chip.textContent = DIFFICULTY_LABELS[diff];
      chip.addEventListener('click', () => {
        this.activeDifficulty = this.activeDifficulty === diff ? null : diff;
        this.updateFilters();
        this.updateGrid();
      });
      filters.appendChild(chip);
    }

    return filters;
  }

  private buildGrid(): HTMLElement {
    const grid = document.createElement('div');
    grid.className = 'da-exercise-browser__grid';
    grid.setAttribute('role', 'list');
    this.populateGrid(grid);
    return grid;
  }

  private getFilteredExercises(): readonly ExerciseMetadata[] {
    let result = [...this.exercises];

    if (this.activeStageFilter) {
      result = result.filter(e => e.stage === this.activeStageFilter);
    }

    if (this.activeDifficulty) {
      result = result.filter(e => e.difficulty === this.activeDifficulty);
    }

    if (this.searchQuery) {
      const q = this.searchQuery;
      result = result.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.concepts.some(c => c.toLowerCase().includes(q)),
      );
    }

    return result;
  }

  private clearChildren(el: HTMLElement): void {
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
  }

  private populateGrid(grid: HTMLElement): void {
    this.clearChildren(grid);
    const filtered = this.getFilteredExercises();

    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'da-exercise-browser__empty';
      empty.textContent = this.searchQuery
        ? 'No exercises match your search.'
        : 'No exercises available for the selected filters.';
      grid.appendChild(empty);
      return;
    }

    // Group by stage
    const grouped = new Map<LabStage, ExerciseMetadata[]>();
    for (const ex of filtered) {
      const list = grouped.get(ex.stage) ?? [];
      list.push(ex);
      grouped.set(ex.stage, list);
    }

    for (const stage of STAGES_WITH_EXERCISES) {
      const stageExercises = grouped.get(stage);
      if (!stageExercises || stageExercises.length === 0) continue;

      const completedInStage = stageExercises.filter(e => this.completedIds.has(e.id)).length;
      const totalInStage = stageExercises.length;

      // Section header
      const sectionHeader = document.createElement('div');
      sectionHeader.className = 'da-exercise-browser__section-header';

      const sectionTitle = document.createElement('span');
      sectionTitle.className = 'da-exercise-browser__section-title';
      sectionTitle.textContent = STAGE_EXERCISE_LABELS[stage] ?? stage;
      sectionHeader.appendChild(sectionTitle);

      const sectionCount = document.createElement('span');
      sectionCount.className = 'da-exercise-browser__section-count';
      sectionCount.textContent = `${completedInStage}/${totalInStage} completed`;
      sectionHeader.appendChild(sectionCount);

      grid.appendChild(sectionHeader);

      // Exercise cards
      for (const exercise of stageExercises) {
        grid.appendChild(this.buildCard(exercise));
      }
    }
  }

  private buildCard(exercise: ExerciseMetadata): HTMLElement {
    const card = document.createElement('div');
    card.className = 'da-exercise-card';
    card.setAttribute('role', 'listitem');
    card.setAttribute('tabindex', '0');

    const isCompleted = this.completedIds.has(exercise.id);
    if (isCompleted) {
      card.classList.add('da-exercise-card--completed');
    }

    const ariaLabel = `${exercise.title}, ${DIFFICULTY_LABELS[exercise.difficulty]}${isCompleted ? ', completed' : ''}`;
    card.setAttribute('aria-label', ariaLabel);

    // Title row
    const titleRow = document.createElement('div');
    titleRow.className = 'da-exercise-card__title-row';

    const title = document.createElement('span');
    title.className = 'da-exercise-card__title';
    title.textContent = exercise.title;
    titleRow.appendChild(title);

    // Completed badge
    if (isCompleted) {
      const badge = document.createElement('span');
      badge.className = 'da-exercise-card__completed-badge';
      badge.textContent = '\u2713';
      badge.setAttribute('aria-hidden', 'true');
      titleRow.appendChild(badge);
    }

    card.appendChild(titleRow);

    // Difficulty badge
    const diffBadge = document.createElement('span');
    diffBadge.className = `da-exercise-card__difficulty da-exercise-card__difficulty--${exercise.difficulty}`;
    diffBadge.textContent = DIFFICULTY_LABELS[exercise.difficulty];
    diffBadge.style.setProperty('--badge-color', DIFFICULTY_COLOR_VARS[exercise.difficulty]);
    card.appendChild(diffBadge);

    // Description
    const desc = document.createElement('p');
    desc.className = 'da-exercise-card__description';
    desc.textContent = exercise.description;
    card.appendChild(desc);

    // Metadata row: time + concepts
    const meta = document.createElement('div');
    meta.className = 'da-exercise-card__meta';

    const time = document.createElement('span');
    time.className = 'da-exercise-card__time';
    time.textContent = `${exercise.estimatedMinutes} min`;
    meta.appendChild(time);

    if (exercise.concepts.length > 0) {
      const concepts = document.createElement('span');
      concepts.className = 'da-exercise-card__concepts';
      concepts.textContent = exercise.concepts.join(', ');
      meta.appendChild(concepts);
    }

    card.appendChild(meta);

    // Prerequisites row
    if (exercise.prerequisites.length > 0) {
      const prereqRow = document.createElement('div');
      prereqRow.className = 'da-exercise-card__prereqs';
      const prereqTitles = exercise.prerequisites
        .map(id => findExerciseById(id)?.title ?? id)
        .join(', ');
      prereqRow.textContent = `Requires: ${prereqTitles}`;
      card.appendChild(prereqRow);
    }

    // Detail view button (info icon)
    const detailBtn = document.createElement('button');
    detailBtn.className = 'da-exercise-card__detail-btn';
    detailBtn.textContent = '\u2139';
    detailBtn.setAttribute('aria-label', `View details for ${exercise.title}`);
    detailBtn.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
      this.showDetail(exercise);
    });
    card.appendChild(detailBtn);

    // Click handler — start exercise
    card.addEventListener('click', () => {
      this.callbacks?.onExerciseSelect(exercise);
    });
    card.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.callbacks?.onExerciseSelect(exercise);
      }
    });

    return card;
  }

  private updateGrid(): void {
    const grid = this.overlay?.querySelector('.da-exercise-browser__grid');
    if (grid) {
      this.populateGrid(grid as HTMLElement);
    }
    this.updateCompletionStats();
  }

  private updateFilters(): void {
    if (!this.overlay) return;
    const chips = this.overlay.querySelectorAll('.da-exercise-browser__filter-chip');
    chips.forEach(chip => {
      const stageAttr = chip.getAttribute('data-stage');
      const diffAttr = chip.getAttribute('data-difficulty');

      chip.classList.remove('da-exercise-browser__filter-chip--active');

      if (stageAttr === 'all' && !this.activeStageFilter) {
        chip.classList.add('da-exercise-browser__filter-chip--active');
      } else if (stageAttr && stageAttr !== 'all' && this.activeStageFilter === stageAttr) {
        chip.classList.add('da-exercise-browser__filter-chip--active');
      }

      if (diffAttr && this.activeDifficulty === diffAttr) {
        chip.classList.add('da-exercise-browser__filter-chip--active');
      }
    });
  }

  private updateCompletionStats(): void {
    const stats = this.overlay?.querySelector('.da-exercise-browser__stats');
    if (stats) {
      this.updateStatsElement(stats as HTMLElement);
    }
  }

  private updateStatsElement(el: HTMLElement): void {
    const filtered = this.getFilteredExercises();
    const completedInView = filtered.filter(e => this.completedIds.has(e.id)).length;
    el.textContent = `${completedInView} of ${filtered.length} completed`;
  }

  private showDetail(exercise: ExerciseMetadata): void {
    const content = this.overlay?.querySelector('.da-exercise-browser__content');
    if (!content) return;
    this.detailPanel.show(exercise, this.completedIds, this.callbacks, content as HTMLElement);
  }

  private handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (this.detailPanel.isVisible()) {
        this.detailPanel.dismiss();
        return;
      }
      this.close();
      return;
    }

    // Focus trap: Tab/Shift+Tab stays within overlay
    if (e.key === 'Tab') {
      // When detail panel is open, restrict focus trap to the panel
      const focusRoot = this.detailPanel.isVisible()
        ? this.overlay?.querySelector<HTMLElement>('.da-exercise-detail')
        : this.overlay;
      const focusable = focusRoot?.querySelectorAll<HTMLElement>(
        'button, [href], input, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  private handleBackdropClick(e: MouseEvent): void {
    if ((e.target as HTMLElement)?.classList.contains('da-exercise-browser__backdrop')) {
      this.close();
    }
  }
}
