// src/exercises/ExerciseBrowser.test.ts
// Tests for ExerciseBrowser component — Story 21.1

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ExerciseBrowser } from './ExerciseBrowser';
import { EXERCISES, STAGES_WITH_EXERCISES, getExerciseCountByStage } from './exerciseMetadata';
import type { ExerciseBrowserCallbacks } from './types';
import { DIFFICULTY_ORDER } from './types';

describe('ExerciseBrowser', () => {
  let browser: ExerciseBrowser;
  let container: HTMLElement;
  let callbacks: ExerciseBrowserCallbacks;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);
    browser = new ExerciseBrowser();
    browser.mount(container);
    callbacks = {
      onExerciseSelect: vi.fn(),
      onClose: vi.fn(),
    };
  });

  afterEach(() => {
    browser.destroy();
    container.remove();
    vi.useRealTimers();
  });

  describe('mount and lifecycle', () => {
    it('should not be open after mount', () => {
      expect(browser.isOpen()).toBe(false);
    });

    it('should open with exercise data', () => {
      browser.open({ exercises: EXERCISES }, callbacks);
      expect(browser.isOpen()).toBe(true);
    });

    it('should render dialog with correct role', () => {
      browser.open({ exercises: EXERCISES }, callbacks);
      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).not.toBeNull();
      expect(dialog!.getAttribute('aria-modal')).toBe('true');
      expect(dialog!.getAttribute('aria-labelledby')).toBe('da-exercise-browser-title');
    });

    it('double-invocation guard: second open does nothing', () => {
      browser.open({ exercises: EXERCISES }, callbacks);
      const overlay1 = container.querySelector('.da-exercise-browser');
      browser.open({ exercises: EXERCISES }, callbacks);
      const overlay2 = container.querySelector('.da-exercise-browser');
      expect(overlay1).toBe(overlay2);
    });

    it('should close with exit animation', () => {
      browser.open({ exercises: EXERCISES }, callbacks);
      browser.close();
      vi.advanceTimersByTime(300);
      expect(browser.isOpen()).toBe(false);
      expect(callbacks.onClose).toHaveBeenCalledOnce();
    });

    it('destroy removes overlay without firing onClose', () => {
      browser.open({ exercises: EXERCISES }, callbacks);
      browser.destroy();
      expect(browser.isOpen()).toBe(false);
      expect(callbacks.onClose).not.toHaveBeenCalled();
    });
  });

  describe('header', () => {
    it('renders title', () => {
      browser.open({ exercises: EXERCISES }, callbacks);
      const title = container.querySelector('.da-exercise-browser__title');
      expect(title?.textContent).toBe('Exercises');
    });

    it('renders completion stats', () => {
      browser.open({ exercises: EXERCISES }, callbacks);
      const stats = container.querySelector('.da-exercise-browser__stats');
      expect(stats?.textContent).toContain(`of ${EXERCISES.length} completed`);
    });

    it('renders search input', () => {
      browser.open({ exercises: EXERCISES }, callbacks);
      const search = container.querySelector('.da-exercise-browser__search');
      expect(search).not.toBeNull();
      expect((search as HTMLInputElement).type).toBe('text');
    });

    it('close button closes browser', () => {
      browser.open({ exercises: EXERCISES }, callbacks);
      const closeBtn = container.querySelector('.da-exercise-browser__close');
      (closeBtn as HTMLElement).click();
      vi.advanceTimersByTime(300);
      expect(browser.isOpen()).toBe(false);
    });
  });

  describe('filters', () => {
    it('renders All chip + stage chips + difficulty chips', () => {
      browser.open({ exercises: EXERCISES }, callbacks);
      const chips = container.querySelectorAll('.da-exercise-browser__filter-chip');
      // All + stage chips + difficulty chips (divider is not a chip)
      const expectedChips = 1 + STAGES_WITH_EXERCISES.length + DIFFICULTY_ORDER.length;
      expect(chips.length).toBe(expectedChips);
    });

    it('All chip is active by default when no currentStage', () => {
      browser.open({ exercises: EXERCISES }, callbacks);
      const allChip = container.querySelector('[data-stage="all"]');
      expect(allChip?.classList.contains('da-exercise-browser__filter-chip--active')).toBe(true);
    });

    it('stage chip is active when currentStage is set', () => {
      browser.open({ exercises: EXERCISES, currentStage: 'micro4' }, callbacks);
      const m4Chip = container.querySelector('[data-stage="micro4"]');
      expect(m4Chip?.classList.contains('da-exercise-browser__filter-chip--active')).toBe(true);
    });

    it('clicking stage chip filters to that stage', () => {
      browser.open({ exercises: EXERCISES }, callbacks);
      const m8Chip = container.querySelector('[data-stage="micro8"]');
      (m8Chip as HTMLElement).click();
      const cards = container.querySelectorAll('.da-exercise-card');
      // Should show only micro8 exercises
      expect(cards.length).toBe(getExerciseCountByStage('micro8'));
    });

    it('clicking All chip shows all exercises', () => {
      browser.open({ exercises: EXERCISES, currentStage: 'micro4' }, callbacks);
      const allChip = container.querySelector('[data-stage="all"]');
      (allChip as HTMLElement).click();
      const cards = container.querySelectorAll('.da-exercise-card');
      expect(cards.length).toBe(EXERCISES.length);
    });

    it('clicking difficulty chip filters by difficulty', () => {
      browser.open({ exercises: EXERCISES }, callbacks);
      const beginnerChip = container.querySelector('[data-difficulty="beginner"]');
      (beginnerChip as HTMLElement).click();
      const cards = container.querySelectorAll('.da-exercise-card');
      const beginnerCount = EXERCISES.filter(e => e.difficulty === 'beginner').length;
      expect(cards.length).toBe(beginnerCount);
    });

    it('clicking active difficulty chip clears the filter', () => {
      browser.open({ exercises: EXERCISES }, callbacks);
      const beginnerChip = container.querySelector('[data-difficulty="beginner"]');
      (beginnerChip as HTMLElement).click();
      (beginnerChip as HTMLElement).click(); // click again to deselect
      const cards = container.querySelectorAll('.da-exercise-card');
      expect(cards.length).toBe(EXERCISES.length);
    });
  });

  describe('search', () => {
    it('filters exercises by title', () => {
      browser.open({ exercises: EXERCISES }, callbacks);
      const search = container.querySelector('.da-exercise-browser__search') as HTMLInputElement;
      search.value = 'Fibonacci';
      search.dispatchEvent(new Event('input'));
      const cards = container.querySelectorAll('.da-exercise-card');
      expect(cards.length).toBe(1);
    });

    it('filters exercises by description', () => {
      browser.open({ exercises: EXERCISES }, callbacks);
      const search = container.querySelector('.da-exercise-browser__search') as HTMLInputElement;
      search.value = 'accumulator';
      search.dispatchEvent(new Event('input'));
      const cards = container.querySelectorAll('.da-exercise-card');
      expect(cards.length).toBeGreaterThanOrEqual(1);
    });

    it('filters exercises by concept', () => {
      browser.open({ exercises: EXERCISES }, callbacks);
      const search = container.querySelector('.da-exercise-browser__search') as HTMLInputElement;
      search.value = 'subroutines';
      search.dispatchEvent(new Event('input'));
      const cards = container.querySelectorAll('.da-exercise-card');
      expect(cards.length).toBeGreaterThanOrEqual(1);
    });

    it('shows empty message when no results', () => {
      browser.open({ exercises: EXERCISES }, callbacks);
      const search = container.querySelector('.da-exercise-browser__search') as HTMLInputElement;
      search.value = 'zzzzzznotfound';
      search.dispatchEvent(new Event('input'));
      const empty = container.querySelector('.da-exercise-browser__empty');
      expect(empty?.textContent).toContain('No exercises match your search');
    });
  });

  describe('grid and cards', () => {
    it('renders section headers per stage', () => {
      browser.open({ exercises: EXERCISES }, callbacks);
      const headers = container.querySelectorAll('.da-exercise-browser__section-header');
      expect(headers.length).toBe(3); // micro4, micro8, micro16
    });

    it('section headers show completion count', () => {
      browser.open({ exercises: EXERCISES }, callbacks);
      const counts = container.querySelectorAll('.da-exercise-browser__section-count');
      expect(counts.length).toBe(3);
      // All should show 0/N completed
      for (const count of counts) {
        expect(count.textContent).toMatch(/0\/\d+ completed/);
      }
    });

    it('renders exercise cards with title', () => {
      browser.open({ exercises: EXERCISES }, callbacks);
      const titles = container.querySelectorAll('.da-exercise-card__title');
      expect(titles.length).toBe(EXERCISES.length);
    });

    it('renders difficulty badges', () => {
      browser.open({ exercises: EXERCISES }, callbacks);
      const badges = container.querySelectorAll('.da-exercise-card__difficulty');
      expect(badges.length).toBe(EXERCISES.length);
    });

    it('renders descriptions', () => {
      browser.open({ exercises: EXERCISES }, callbacks);
      const descs = container.querySelectorAll('.da-exercise-card__description');
      expect(descs.length).toBe(EXERCISES.length);
    });

    it('renders time estimates', () => {
      browser.open({ exercises: EXERCISES }, callbacks);
      const times = container.querySelectorAll('.da-exercise-card__time');
      expect(times.length).toBe(EXERCISES.length);
      expect(times[0].textContent).toContain('min');
    });
  });

  describe('completion tracking', () => {
    it('shows completed badge when exercise is in completedIds', () => {
      browser.open({
        exercises: EXERCISES,
        completedIds: new Set(['ex-m4-hello-nibble']),
      }, callbacks);
      const badges = container.querySelectorAll('.da-exercise-card__completed-badge');
      expect(badges.length).toBe(1);
    });

    it('completed card has --completed modifier class', () => {
      browser.open({
        exercises: EXERCISES,
        completedIds: new Set(['ex-m4-hello-nibble']),
      }, callbacks);
      const completedCards = container.querySelectorAll('.da-exercise-card--completed');
      expect(completedCards.length).toBe(1);
    });

    it('stats reflect completed count', () => {
      browser.open({
        exercises: EXERCISES,
        completedIds: new Set(['ex-m4-hello-nibble', 'ex-m4-simple-addition']),
      }, callbacks);
      const stats = container.querySelector('.da-exercise-browser__stats');
      expect(stats?.textContent).toContain(`2 of ${EXERCISES.length} completed`);
    });

    it('markExerciseCompleted updates UI', () => {
      browser.open({ exercises: EXERCISES }, callbacks);
      browser.markExerciseCompleted('ex-m4-hello-nibble');
      const completedCards = container.querySelectorAll('.da-exercise-card--completed');
      expect(completedCards.length).toBe(1);
    });
  });

  describe('exercise selection', () => {
    it('clicking a card fires onExerciseSelect', () => {
      browser.open({ exercises: EXERCISES }, callbacks);
      const card = container.querySelector('.da-exercise-card') as HTMLElement;
      card.click();
      expect(callbacks.onExerciseSelect).toHaveBeenCalledOnce();
      expect(callbacks.onExerciseSelect).toHaveBeenCalledWith(EXERCISES[0]);
    });

    it('pressing Enter on a card fires onExerciseSelect', () => {
      browser.open({ exercises: EXERCISES }, callbacks);
      const card = container.querySelector('.da-exercise-card') as HTMLElement;
      card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(callbacks.onExerciseSelect).toHaveBeenCalledOnce();
    });

    it('pressing Space on a card fires onExerciseSelect', () => {
      browser.open({ exercises: EXERCISES }, callbacks);
      const card = container.querySelector('.da-exercise-card') as HTMLElement;
      card.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      expect(callbacks.onExerciseSelect).toHaveBeenCalledOnce();
    });
  });

  describe('keyboard navigation', () => {
    it('Escape key closes browser', () => {
      browser.open({ exercises: EXERCISES }, callbacks);
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      vi.advanceTimersByTime(300);
      expect(browser.isOpen()).toBe(false);
    });

    it('cards are focusable via tabindex', () => {
      browser.open({ exercises: EXERCISES }, callbacks);
      const card = container.querySelector('.da-exercise-card');
      expect(card?.getAttribute('tabindex')).toBe('0');
    });
  });

  describe('accessibility', () => {
    it('cards have aria-label with title and difficulty', () => {
      browser.open({ exercises: EXERCISES }, callbacks);
      const card = container.querySelector('.da-exercise-card');
      const label = card?.getAttribute('aria-label');
      expect(label).toContain(EXERCISES[0].title);
      expect(label).toContain('Beginner');
    });

    it('completed cards include "completed" in aria-label', () => {
      browser.open({
        exercises: EXERCISES,
        completedIds: new Set(['ex-m4-hello-nibble']),
      }, callbacks);
      const completedCard = container.querySelector('.da-exercise-card--completed');
      expect(completedCard?.getAttribute('aria-label')).toContain('completed');
    });

    it('completed badge has aria-hidden', () => {
      browser.open({
        exercises: EXERCISES,
        completedIds: new Set(['ex-m4-hello-nibble']),
      }, callbacks);
      const badge = container.querySelector('.da-exercise-card__completed-badge');
      expect(badge?.getAttribute('aria-hidden')).toBe('true');
    });

    it('search input has aria-label', () => {
      browser.open({ exercises: EXERCISES }, callbacks);
      const search = container.querySelector('.da-exercise-browser__search');
      expect(search?.getAttribute('aria-label')).toBe('Search exercises');
    });

    it('filter toolbar has aria-label', () => {
      browser.open({ exercises: EXERCISES }, callbacks);
      const toolbar = container.querySelector('[role="toolbar"]');
      expect(toolbar?.getAttribute('aria-label')).toBe('Exercise filters');
    });

    it('grid has list role', () => {
      browser.open({ exercises: EXERCISES }, callbacks);
      const grid = container.querySelector('.da-exercise-browser__grid');
      expect(grid?.getAttribute('role')).toBe('list');
    });
  });
});
