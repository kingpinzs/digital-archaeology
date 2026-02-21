// src/exercises/ExerciseProgressPanel.test.ts
// Tests for ExerciseProgressPanel — Story 21.7

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ExerciseProgressPanel } from './ExerciseProgressPanel';
import { ExerciseProgressStorage } from './ExerciseProgressStorage';
import { SolutionViewStorage } from './ExerciseSolutionPanel';

describe('ExerciseProgressPanel', () => {
  let panel: ExerciseProgressPanel;
  let progressStorage: ExerciseProgressStorage;
  let solutionViewStorage: SolutionViewStorage;
  let host: HTMLElement;

  beforeEach(() => {
    localStorage.clear();
    panel = new ExerciseProgressPanel();
    progressStorage = new ExerciseProgressStorage('test-progress');
    solutionViewStorage = new SolutionViewStorage('test-solution-views');
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    panel.destroy();
    host.remove();
  });

  describe('show', () => {
    it('renders the progress panel into the host', () => {
      panel.show(progressStorage, solutionViewStorage, host);
      const el = host.querySelector('.da-exercise-progress');
      expect(el).not.toBeNull();
    });

    it('shows the title "Exercise Progress"', () => {
      panel.show(progressStorage, solutionViewStorage, host);
      const title = host.querySelector('.da-exercise-progress__title');
      expect(title?.textContent).toBe('Exercise Progress');
    });

    it('has role="complementary" and aria-label', () => {
      panel.show(progressStorage, solutionViewStorage, host);
      const el = host.querySelector('.da-exercise-progress');
      expect(el?.getAttribute('role')).toBe('complementary');
      expect(el?.getAttribute('aria-label')).toBe('Exercise progress');
    });

    it('renders stage sections', () => {
      panel.show(progressStorage, solutionViewStorage, host);
      const sections = host.querySelectorAll('.da-exercise-progress__stage');
      expect(sections.length).toBeGreaterThan(0);
    });

    it('renders progress bars per stage', () => {
      panel.show(progressStorage, solutionViewStorage, host);
      const bars = host.querySelectorAll('.da-exercise-progress__bar');
      expect(bars.length).toBeGreaterThan(0);
    });

    it('shows overall completion summary', () => {
      panel.show(progressStorage, solutionViewStorage, host);
      const overall = host.querySelector('.da-exercise-progress__overall');
      expect(overall?.textContent).toMatch(/Overall:.*exercises completed/);
    });

    it('shows exercise rows with icons', () => {
      panel.show(progressStorage, solutionViewStorage, host);
      const exercises = host.querySelectorAll('.da-exercise-progress__exercise');
      expect(exercises.length).toBeGreaterThan(0);
    });

    it('shows checkmark for completed exercises', () => {
      progressStorage.markCompleted('ex-m4-hello-nibble');
      panel.show(progressStorage, solutionViewStorage, host);
      const icons = host.querySelectorAll('.da-exercise-progress__exercise-icon--complete');
      expect(icons.length).toBeGreaterThanOrEqual(1);
      expect(icons[0]?.textContent).toBe('\u2713');
    });

    it('shows bullet for incomplete exercises', () => {
      panel.show(progressStorage, solutionViewStorage, host);
      const icons = host.querySelectorAll('.da-exercise-progress__exercise-icon:not(.da-exercise-progress__exercise-icon--complete)');
      expect(icons.length).toBeGreaterThan(0);
      expect(icons[0]?.textContent).toBe('\u2022');
    });

    it('shows attempt count for exercises with attempts', () => {
      progressStorage.recordAttempt('ex-m4-hello-nibble', false);
      progressStorage.recordAttempt('ex-m4-hello-nibble', true);
      panel.show(progressStorage, solutionViewStorage, host);
      const stats = host.querySelectorAll('.da-exercise-progress__exercise-stats');
      const statsTexts = Array.from(stats).map(s => s.textContent);
      expect(statsTexts.some(t => t?.includes('2 attempts'))).toBe(true);
    });

    it('shows "1 attempt" (singular) for single attempt', () => {
      progressStorage.recordAttempt('ex-m4-hello-nibble', true);
      panel.show(progressStorage, solutionViewStorage, host);
      const stats = host.querySelectorAll('.da-exercise-progress__exercise-stats');
      const statsTexts = Array.from(stats).map(s => s.textContent);
      expect(statsTexts.some(t => t?.includes('1 attempt') && !t?.includes('attempts'))).toBe(true);
    });

    it('shows improvement indicator "passed on attempt N" for multi-attempt exercises', () => {
      progressStorage.recordAttempt('ex-m4-hello-nibble', false);
      progressStorage.recordAttempt('ex-m4-hello-nibble', false);
      progressStorage.recordAttempt('ex-m4-hello-nibble', true);
      panel.show(progressStorage, solutionViewStorage, host);
      const stats = host.querySelectorAll('.da-exercise-progress__exercise-stats');
      const statsTexts = Array.from(stats).map(s => s.textContent);
      expect(statsTexts.some(t => t?.includes('passed on attempt 3'))).toBe(true);
    });

    it('does not show improvement indicator for single-attempt pass', () => {
      progressStorage.recordAttempt('ex-m4-hello-nibble', true);
      panel.show(progressStorage, solutionViewStorage, host);
      const stats = host.querySelectorAll('.da-exercise-progress__exercise-stats');
      const statsTexts = Array.from(stats).map(s => s.textContent);
      expect(statsTexts.some(t => t?.includes('passed on attempt'))).toBe(false);
    });

    it('shows "solution viewed" for exercises with solution viewed', () => {
      solutionViewStorage.markViewed('ex-m4-hello-nibble');
      panel.show(progressStorage, solutionViewStorage, host);
      const stats = host.querySelectorAll('.da-exercise-progress__exercise-stats');
      const statsTexts = Array.from(stats).map(s => s.textContent);
      expect(statsTexts.some(t => t?.includes('solution viewed'))).toBe(true);
    });

    it('shows stage counts in the header', () => {
      panel.show(progressStorage, solutionViewStorage, host);
      const counts = host.querySelectorAll('.da-exercise-progress__stage-count');
      expect(counts.length).toBeGreaterThan(0);
      // All should show 0/N pattern when no completions
      expect(counts[0]?.textContent).toMatch(/^0\/\d+$/);
    });

    it('updates stage count when exercise is completed', () => {
      progressStorage.markCompleted('ex-m4-hello-nibble');
      panel.show(progressStorage, solutionViewStorage, host);
      const counts = host.querySelectorAll('.da-exercise-progress__stage-count');
      // First stage (micro4) should show 1/N
      expect(counts[0]?.textContent).toMatch(/^1\/\d+$/);
    });

    it('dismisses previous panel before showing new one', () => {
      panel.show(progressStorage, solutionViewStorage, host);
      panel.show(progressStorage, solutionViewStorage, host);
      const panels = host.querySelectorAll('.da-exercise-progress');
      expect(panels.length).toBe(1);
    });
  });

  describe('dismiss', () => {
    it('removes the panel from the host', () => {
      panel.show(progressStorage, solutionViewStorage, host);
      expect(host.querySelector('.da-exercise-progress')).not.toBeNull();
      panel.dismiss();
      expect(host.querySelector('.da-exercise-progress')).toBeNull();
    });

    it('does nothing if panel is not visible', () => {
      // Should not throw
      panel.dismiss();
      expect(panel.isVisible()).toBe(false);
    });

    it('is triggered by the dismiss button', () => {
      panel.show(progressStorage, solutionViewStorage, host);
      const btn = host.querySelector('.da-exercise-progress__dismiss') as HTMLButtonElement;
      expect(btn).not.toBeNull();
      btn.click();
      expect(panel.isVisible()).toBe(false);
    });
  });

  describe('isVisible', () => {
    it('returns false when panel is not shown', () => {
      expect(panel.isVisible()).toBe(false);
    });

    it('returns true when panel is shown', () => {
      panel.show(progressStorage, solutionViewStorage, host);
      expect(panel.isVisible()).toBe(true);
    });

    it('returns false after dismiss', () => {
      panel.show(progressStorage, solutionViewStorage, host);
      panel.dismiss();
      expect(panel.isVisible()).toBe(false);
    });
  });

  describe('destroy', () => {
    it('removes the panel and cleans up', () => {
      panel.show(progressStorage, solutionViewStorage, host);
      panel.destroy();
      expect(host.querySelector('.da-exercise-progress')).toBeNull();
      expect(panel.isVisible()).toBe(false);
    });
  });
});
