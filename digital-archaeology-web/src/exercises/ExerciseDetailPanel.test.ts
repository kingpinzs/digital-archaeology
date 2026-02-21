// src/exercises/ExerciseDetailPanel.test.ts
// Tests for ExerciseDetailPanel — Story 21.2

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ExerciseDetailPanel } from './ExerciseDetailPanel';
import { EXERCISES, findExerciseById } from './exerciseMetadata';
import type { ExerciseBrowserCallbacks } from './types';

describe('ExerciseDetailPanel', () => {
  let panel: ExerciseDetailPanel;
  let host: HTMLElement;
  let callbacks: ExerciseBrowserCallbacks;

  // Pick exercises with and without prerequisites
  const exerciseNoPrereqs = EXERCISES.find(e => e.prerequisites.length === 0)!;
  const exerciseWithPrereqs = EXERCISES.find(e => e.prerequisites.length > 0)!;

  beforeEach(() => {
    vi.useFakeTimers();
    host = document.createElement('div');
    document.body.appendChild(host);
    panel = new ExerciseDetailPanel();
    callbacks = {
      onExerciseSelect: vi.fn(),
      onClose: vi.fn(),
    };
  });

  afterEach(() => {
    panel.destroy();
    host.remove();
    vi.useRealTimers();
  });

  describe('show and lifecycle', () => {
    it('should not be visible initially', () => {
      expect(panel.isVisible()).toBe(false);
    });

    it('should become visible after show', () => {
      panel.show(exerciseNoPrereqs, new Set(), callbacks, host);
      expect(panel.isVisible()).toBe(true);
    });

    it('should append panel to host', () => {
      panel.show(exerciseNoPrereqs, new Set(), callbacks, host);
      const panelEl = host.querySelector('.da-exercise-detail');
      expect(panelEl).not.toBeNull();
    });

    it('should dismiss with exit animation', () => {
      panel.show(exerciseNoPrereqs, new Set(), callbacks, host);
      panel.dismiss();
      // Panel reference is null immediately
      expect(panel.isVisible()).toBe(false);
      // DOM element still present during animation
      const panelEl = host.querySelector('.da-exercise-detail');
      expect(panelEl?.classList.contains('da-exercise-detail--exiting')).toBe(true);
      // After timeout, DOM element removed
      vi.advanceTimersByTime(200);
      expect(host.querySelector('.da-exercise-detail')).toBeNull();
    });

    it('destroy removes immediately without animation', () => {
      panel.show(exerciseNoPrereqs, new Set(), callbacks, host);
      panel.destroy();
      expect(panel.isVisible()).toBe(false);
      expect(host.querySelector('.da-exercise-detail')).toBeNull();
    });

    it('double show replaces previous panel', () => {
      panel.show(exerciseNoPrereqs, new Set(), callbacks, host);
      const exercise2 = EXERCISES.find(e => e.id !== exerciseNoPrereqs.id)!;
      panel.show(exercise2, new Set(), callbacks, host);
      // New panel + old one animating out = 2
      expect(host.querySelectorAll('.da-exercise-detail').length).toBe(2);
      // After exit animation completes, old panel is removed
      vi.advanceTimersByTime(200);
      expect(host.querySelectorAll('.da-exercise-detail').length).toBe(1);
      // Visible panel shows the second exercise's title
      const title = host.querySelector('.da-exercise-detail__title');
      expect(title?.textContent).toBe(exercise2.title);
    });
  });

  describe('content rendering', () => {
    it('renders exercise title', () => {
      panel.show(exerciseNoPrereqs, new Set(), callbacks, host);
      const title = host.querySelector('.da-exercise-detail__title');
      expect(title?.textContent).toBe(exerciseNoPrereqs.title);
    });

    it('renders difficulty badge', () => {
      panel.show(exerciseNoPrereqs, new Set(), callbacks, host);
      const diff = host.querySelector('.da-exercise-detail__difficulty');
      expect(diff).not.toBeNull();
      expect(diff?.textContent?.toLowerCase()).toContain(exerciseNoPrereqs.difficulty);
    });

    it('renders description', () => {
      panel.show(exerciseNoPrereqs, new Set(), callbacks, host);
      const desc = host.querySelector('.da-exercise-detail__description');
      expect(desc?.textContent).toBe(exerciseNoPrereqs.description);
    });

    it('renders estimated time', () => {
      panel.show(exerciseNoPrereqs, new Set(), callbacks, host);
      const values = host.querySelectorAll('.da-exercise-detail__value');
      const timeValue = Array.from(values).find(v =>
        v.textContent?.includes('minutes'),
      );
      expect(timeValue?.textContent).toContain(`${exerciseNoPrereqs.estimatedMinutes}`);
    });

    it('renders all concept chips', () => {
      panel.show(exerciseNoPrereqs, new Set(), callbacks, host);
      const chips = host.querySelectorAll('.da-exercise-detail__concept-chip');
      expect(chips.length).toBe(exerciseNoPrereqs.concepts.length);
    });

    it('renders aria-label on panel', () => {
      panel.show(exerciseNoPrereqs, new Set(), callbacks, host);
      const panelEl = host.querySelector('.da-exercise-detail');
      expect(panelEl?.getAttribute('aria-label')).toContain(exerciseNoPrereqs.title);
    });
  });

  describe('prerequisites display', () => {
    it('shows "None" when no prerequisites', () => {
      panel.show(exerciseNoPrereqs, new Set(), callbacks, host);
      const labels = host.querySelectorAll('.da-exercise-detail__label');
      const prereqLabel = Array.from(labels).find(l => l.textContent === 'Prerequisites');
      expect(prereqLabel).toBeDefined();
      const section = prereqLabel?.parentElement;
      const value = section?.querySelector('.da-exercise-detail__value');
      expect(value?.textContent).toBe('None');
    });

    it('shows prerequisite titles when present', () => {
      panel.show(exerciseWithPrereqs, new Set(), callbacks, host);
      const items = host.querySelectorAll('.da-exercise-detail__prereq-item');
      expect(items.length).toBe(exerciseWithPrereqs.prerequisites.length);

      // Verify titles, not IDs
      for (let i = 0; i < exerciseWithPrereqs.prerequisites.length; i++) {
        const expectedExercise = findExerciseById(exerciseWithPrereqs.prerequisites[i]);
        const titleEl = items[i].querySelector('.da-exercise-detail__prereq-title');
        expect(titleEl?.textContent).toBe(expectedExercise?.title);
      }
    });

    it('shows completed status for completed prerequisites', () => {
      const completedIds = new Set(exerciseWithPrereqs.prerequisites.slice(0, 1));
      panel.show(exerciseWithPrereqs, completedIds, callbacks, host);
      const completedItems = host.querySelectorAll('.da-exercise-detail__prereq-item--completed');
      expect(completedItems.length).toBe(1);
    });

    it('shows checkmark for completed, circle for incomplete', () => {
      const completedIds = new Set(exerciseWithPrereqs.prerequisites.slice(0, 1));
      panel.show(exerciseWithPrereqs, completedIds, callbacks, host);
      const statuses = host.querySelectorAll('.da-exercise-detail__prereq-status');
      // First should be checkmark
      expect(statuses[0].textContent).toBe('\u2713');
      // Others should be circle
      if (statuses.length > 1) {
        expect(statuses[1].textContent).toBe('\u25CB');
      }
    });
  });

  describe('completed state', () => {
    it('shows completed badge when exercise is completed', () => {
      panel.show(exerciseNoPrereqs, new Set([exerciseNoPrereqs.id]), callbacks, host);
      const badge = host.querySelector('.da-exercise-detail__completed');
      expect(badge?.textContent).toContain('Completed');
    });

    it('does not show completed badge when exercise is not completed', () => {
      panel.show(exerciseNoPrereqs, new Set(), callbacks, host);
      const badge = host.querySelector('.da-exercise-detail__completed');
      expect(badge).toBeNull();
    });

    it('shows "Retry Exercise" button when completed', () => {
      panel.show(exerciseNoPrereqs, new Set([exerciseNoPrereqs.id]), callbacks, host);
      const btn = host.querySelector('.da-exercise-detail__start');
      expect(btn?.textContent).toBe('Retry Exercise');
    });

    it('shows "Start Exercise" button when not completed', () => {
      panel.show(exerciseNoPrereqs, new Set(), callbacks, host);
      const btn = host.querySelector('.da-exercise-detail__start');
      expect(btn?.textContent).toBe('Start Exercise');
    });
  });

  describe('interactions', () => {
    it('start button fires onExerciseSelect', () => {
      panel.show(exerciseNoPrereqs, new Set(), callbacks, host);
      const btn = host.querySelector('.da-exercise-detail__start') as HTMLElement;
      btn.click();
      expect(callbacks.onExerciseSelect).toHaveBeenCalledWith(exerciseNoPrereqs);
    });

    it('start button dismisses panel before firing callback', () => {
      panel.show(exerciseNoPrereqs, new Set(), callbacks, host);
      const btn = host.querySelector('.da-exercise-detail__start') as HTMLElement;
      btn.click();
      expect(panel.isVisible()).toBe(false);
    });

    it('close button dismisses panel', () => {
      panel.show(exerciseNoPrereqs, new Set(), callbacks, host);
      const closeBtn = host.querySelector('.da-exercise-detail__close') as HTMLElement;
      closeBtn.click();
      expect(panel.isVisible()).toBe(false);
    });
  });
});
