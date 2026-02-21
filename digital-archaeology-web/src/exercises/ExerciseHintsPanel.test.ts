// src/exercises/ExerciseHintsPanel.test.ts
// Tests for ExerciseHintsPanel and ExerciseHintStorage — Story 21.5

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ExerciseHintsPanel, ExerciseHintStorage } from './ExerciseHintsPanel';
import type { ExerciseMetadata } from './types';

function makeExercise(hints: string[]): ExerciseMetadata {
  return {
    id: 'test-ex',
    title: 'Test Exercise',
    stage: 'micro4',
    difficulty: 'beginner',
    description: 'A test exercise for unit testing hint functionality across all difficulty levels.',
    concepts: ['test'],
    estimatedMinutes: 5,
    prerequisites: [],
    starterCode: '; TODO: test\nHLT\n',
    testCases: [{ label: 'R', address: 0xF1, expected: 7 }],
    hints,
    solution: '',
    solutionExplanation: '',
  };
}

describe('ExerciseHintStorage', () => {
  let storage: ExerciseHintStorage;

  beforeEach(() => {
    localStorage.clear();
    storage = new ExerciseHintStorage('test-hints-storage');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should return 0 for unknown exercise', () => {
    expect(storage.getRevealedCount('unknown')).toBe(0);
  });

  it('should reveal one hint and return new count', () => {
    const count = storage.revealNext('ex1', 3);
    expect(count).toBe(1);
    expect(storage.getRevealedCount('ex1')).toBe(1);
  });

  it('should reveal hints progressively', () => {
    storage.revealNext('ex1', 3);
    storage.revealNext('ex1', 3);
    expect(storage.getRevealedCount('ex1')).toBe(2);
  });

  it('should not exceed maxHints', () => {
    storage.revealNext('ex1', 2);
    storage.revealNext('ex1', 2);
    storage.revealNext('ex1', 2); // Should cap at 2
    expect(storage.getRevealedCount('ex1')).toBe(2);
  });

  it('should track multiple exercises independently', () => {
    storage.revealNext('ex1', 3);
    storage.revealNext('ex2', 5);
    storage.revealNext('ex2', 5);
    expect(storage.getRevealedCount('ex1')).toBe(1);
    expect(storage.getRevealedCount('ex2')).toBe(2);
  });

  it('should clear all hint progress', () => {
    storage.revealNext('ex1', 3);
    storage.revealNext('ex2', 3);
    storage.clearAll();
    expect(storage.getRevealedCount('ex1')).toBe(0);
    expect(storage.getRevealedCount('ex2')).toBe(0);
  });

  it('should handle corrupt localStorage gracefully', () => {
    localStorage.setItem('test-hints-storage', 'not-json');
    expect(storage.getRevealedCount('ex1')).toBe(0);
  });

  it('should handle non-object localStorage gracefully', () => {
    localStorage.setItem('test-hints-storage', '"string"');
    expect(storage.getRevealedCount('ex1')).toBe(0);
  });

  it('should handle revealNext with non-object localStorage gracefully', () => {
    localStorage.setItem('test-hints-storage', '"string"');
    const count = storage.revealNext('ex1', 3);
    expect(count).toBe(1);
    // Should have recovered to a valid object
    expect(storage.getRevealedCount('ex1')).toBe(1);
  });
});

describe('ExerciseHintsPanel', () => {
  let panel: ExerciseHintsPanel;
  let storage: ExerciseHintStorage;
  let host: HTMLElement;

  beforeEach(() => {
    localStorage.clear();
    storage = new ExerciseHintStorage('test-hints-panel');
    panel = new ExerciseHintsPanel(storage);
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    panel.destroy();
    document.body.removeChild(host);
    localStorage.clear();
  });

  describe('show', () => {
    it('should render the hints panel', () => {
      const exercise = makeExercise(['Hint 1', 'Hint 2', 'Hint 3']);
      panel.show(exercise, host);
      expect(host.querySelector('.da-exercise-hints')).not.toBeNull();
    });

    it('should show correct counter (0/3)', () => {
      const exercise = makeExercise(['Hint 1', 'Hint 2', 'Hint 3']);
      panel.show(exercise, host);
      const counter = host.querySelector('.da-exercise-hints__counter');
      expect(counter!.textContent).toBe('0/3');
    });

    it('should show all hints as hidden initially', () => {
      const exercise = makeExercise(['Hint 1', 'Hint 2', 'Hint 3']);
      panel.show(exercise, host);
      const hidden = host.querySelectorAll('.da-exercise-hints__item--hidden');
      expect(hidden.length).toBe(3);
    });

    it('should show "Show First Hint" button when no hints revealed', () => {
      const exercise = makeExercise(['Hint 1', 'Hint 2']);
      panel.show(exercise, host);
      const btn = host.querySelector('.da-exercise-hints__reveal');
      expect(btn!.textContent).toBe('Show First Hint');
    });

    it('should show previously revealed hints from storage', () => {
      storage.revealNext('test-ex', 3);
      storage.revealNext('test-ex', 3);
      const exercise = makeExercise(['Hint 1', 'Hint 2', 'Hint 3']);
      panel.show(exercise, host);
      const revealed = host.querySelectorAll('.da-exercise-hints__item--revealed');
      expect(revealed.length).toBe(2);
      expect(revealed[0].textContent).toBe('Hint 1');
      expect(revealed[1].textContent).toBe('Hint 2');
    });

    it('should show "Show Next Hint" when some hints already revealed', () => {
      storage.revealNext('test-ex', 3);
      const exercise = makeExercise(['Hint 1', 'Hint 2', 'Hint 3']);
      panel.show(exercise, host);
      const btn = host.querySelector('.da-exercise-hints__reveal');
      expect(btn!.textContent).toBe('Show Next Hint');
    });

    it('should show "All hints revealed" when all are shown', () => {
      storage.revealNext('test-ex', 2);
      storage.revealNext('test-ex', 2);
      const exercise = makeExercise(['Hint 1', 'Hint 2']);
      panel.show(exercise, host);
      const allRevealed = host.querySelector('.da-exercise-hints__all-revealed');
      expect(allRevealed).not.toBeNull();
      expect(allRevealed!.textContent).toBe('All hints revealed');
    });

    it('should not render panel for exercise with no hints', () => {
      const exercise = makeExercise([]);
      panel.show(exercise, host);
      expect(host.querySelector('.da-exercise-hints')).toBeNull();
    });

    it('should clamp revealedCount when storage exceeds actual hints', () => {
      // Simulate storage having more reveals than hints available
      storage.revealNext('test-ex', 10);
      storage.revealNext('test-ex', 10);
      storage.revealNext('test-ex', 10);
      storage.revealNext('test-ex', 10);
      storage.revealNext('test-ex', 10);
      // Storage says 5, but exercise only has 2 hints
      const exercise = makeExercise(['Hint 1', 'Hint 2']);
      panel.show(exercise, host);
      const revealed = host.querySelectorAll('.da-exercise-hints__item--revealed');
      expect(revealed.length).toBe(2);
      const allRevealedMsg = host.querySelector('.da-exercise-hints__all-revealed');
      expect(allRevealedMsg).not.toBeNull();
    });

    it('should set aria-hidden on unrevealed hint items', () => {
      const exercise = makeExercise(['Hint 1', 'Hint 2', 'Hint 3']);
      panel.show(exercise, host);
      const hidden = host.querySelectorAll('.da-exercise-hints__item--hidden');
      for (const item of hidden) {
        expect(item.getAttribute('aria-hidden')).toBe('true');
      }
    });
  });

  describe('reveal interaction', () => {
    it('should reveal next hint on button click', () => {
      const exercise = makeExercise(['Hint 1', 'Hint 2', 'Hint 3']);
      panel.show(exercise, host);

      const btn = host.querySelector('.da-exercise-hints__reveal') as HTMLButtonElement;
      btn.click();

      // After click, panel re-renders with 1 revealed
      const revealed = host.querySelectorAll('.da-exercise-hints__item--revealed');
      expect(revealed.length).toBe(1);
      expect(revealed[0].textContent).toBe('Hint 1');
      expect(storage.getRevealedCount('test-ex')).toBe(1);
    });

    it('should persist hint reveals across panel re-opens', () => {
      const exercise = makeExercise(['Hint 1', 'Hint 2', 'Hint 3']);
      panel.show(exercise, host);
      const btn = host.querySelector('.da-exercise-hints__reveal') as HTMLButtonElement;
      btn.click();

      // Dismiss and re-show
      panel.dismiss();
      panel.show(exercise, host);

      const revealed = host.querySelectorAll('.da-exercise-hints__item--revealed');
      expect(revealed.length).toBe(1);
    });

    it('should update counter after revealing', () => {
      const exercise = makeExercise(['Hint 1', 'Hint 2', 'Hint 3']);
      panel.show(exercise, host);
      const btn = host.querySelector('.da-exercise-hints__reveal') as HTMLButtonElement;
      btn.click();

      const counter = host.querySelector('.da-exercise-hints__counter');
      expect(counter!.textContent).toBe('1/3');
    });
  });

  describe('dismiss', () => {
    it('should remove the panel from DOM', () => {
      const exercise = makeExercise(['Hint 1', 'Hint 2']);
      panel.show(exercise, host);
      panel.dismiss();
      expect(host.querySelector('.da-exercise-hints')).toBeNull();
    });

    it('should be safe to call when no panel shown', () => {
      expect(() => panel.dismiss()).not.toThrow();
    });

    it('should dismiss when X button clicked', () => {
      const exercise = makeExercise(['Hint 1']);
      panel.show(exercise, host);
      const btn = host.querySelector('.da-exercise-hints__dismiss') as HTMLButtonElement;
      btn.click();
      expect(panel.isVisible()).toBe(false);
    });
  });

  describe('isVisible', () => {
    it('should return false before show', () => {
      expect(panel.isVisible()).toBe(false);
    });

    it('should return true after show', () => {
      panel.show(makeExercise(['Hint 1']), host);
      expect(panel.isVisible()).toBe(true);
    });

    it('should return false after dismiss', () => {
      panel.show(makeExercise(['Hint 1']), host);
      panel.dismiss();
      expect(panel.isVisible()).toBe(false);
    });
  });

  describe('show replaces previous', () => {
    it('should remove old panel when show called again', () => {
      panel.show(makeExercise(['Hint 1']), host);
      panel.show(makeExercise(['Hint A', 'Hint B']), host);
      const panels = host.querySelectorAll('.da-exercise-hints');
      expect(panels.length).toBe(1);
    });
  });

  describe('accessibility', () => {
    it('should have role="complementary"', () => {
      panel.show(makeExercise(['Hint 1']), host);
      const el = host.querySelector('.da-exercise-hints');
      expect(el!.getAttribute('role')).toBe('complementary');
    });

    it('should have aria-label', () => {
      panel.show(makeExercise(['Hint 1']), host);
      const el = host.querySelector('.da-exercise-hints');
      expect(el!.getAttribute('aria-label')).toBe('Exercise hints');
    });

    it('should have aria-label on dismiss button', () => {
      panel.show(makeExercise(['Hint 1']), host);
      const btn = host.querySelector('.da-exercise-hints__dismiss');
      expect(btn!.getAttribute('aria-label')).toBe('Dismiss hints');
    });
  });

  describe('destroy', () => {
    it('should remove panel and clean up', () => {
      panel.show(makeExercise(['Hint 1']), host);
      panel.destroy();
      expect(host.querySelector('.da-exercise-hints')).toBeNull();
      expect(panel.isVisible()).toBe(false);
    });
  });
});
