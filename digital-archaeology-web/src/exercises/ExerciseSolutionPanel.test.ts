// src/exercises/ExerciseSolutionPanel.test.ts
// Tests for ExerciseSolutionPanel and SolutionViewStorage — Story 21.6

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ExerciseSolutionPanel, SolutionViewStorage } from './ExerciseSolutionPanel';
import type { ExerciseMetadata } from './types';

function makeExercise(overrides: Partial<ExerciseMetadata> = {}): ExerciseMetadata {
  return {
    id: 'test-ex',
    title: 'Test Exercise',
    stage: 'micro4',
    difficulty: 'beginner',
    description: 'A test exercise for unit testing solution reveal functionality.',
    concepts: ['test'],
    estimatedMinutes: 5,
    prerequisites: [],
    starterCode: '; TODO: test\nHLT\n',
    testCases: [{ label: 'R', address: 0xF1, expected: 7 }],
    hints: [],
    solution: 'LDA VALUE\nSTA RESULT\nHLT\n',
    solutionExplanation: 'Load VALUE and store it at RESULT.',
    ...overrides,
  };
}

describe('SolutionViewStorage', () => {
  let storage: SolutionViewStorage;

  beforeEach(() => {
    localStorage.clear();
    storage = new SolutionViewStorage('test-solution-views');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should return false for unviewed exercise', () => {
    expect(storage.hasViewed('unknown')).toBe(false);
  });

  it('should mark exercise solution as viewed', () => {
    storage.markViewed('ex1');
    expect(storage.hasViewed('ex1')).toBe(true);
  });

  it('should not duplicate views', () => {
    storage.markViewed('ex1');
    storage.markViewed('ex1');
    const viewed = storage.getViewedIds();
    // Should only have 1 entry, not 2
    expect(viewed.size).toBe(1);
  });

  it('should track multiple exercises independently', () => {
    storage.markViewed('ex1');
    storage.markViewed('ex2');
    expect(storage.hasViewed('ex1')).toBe(true);
    expect(storage.hasViewed('ex2')).toBe(true);
    expect(storage.hasViewed('ex3')).toBe(false);
  });

  it('should return all viewed IDs', () => {
    storage.markViewed('ex1');
    storage.markViewed('ex2');
    const ids = storage.getViewedIds();
    expect(ids.size).toBe(2);
    expect(ids.has('ex1')).toBe(true);
    expect(ids.has('ex2')).toBe(true);
  });

  it('should clear all viewed records', () => {
    storage.markViewed('ex1');
    storage.markViewed('ex2');
    storage.clearAll();
    expect(storage.hasViewed('ex1')).toBe(false);
    expect(storage.hasViewed('ex2')).toBe(false);
    expect(storage.getViewedIds().size).toBe(0);
  });

  it('should handle corrupt localStorage gracefully', () => {
    localStorage.setItem('test-solution-views', 'not-json');
    expect(storage.hasViewed('ex1')).toBe(false);
    expect(storage.getViewedIds().size).toBe(0);
  });

  it('should handle non-array localStorage gracefully', () => {
    localStorage.setItem('test-solution-views', '{"key": "value"}');
    expect(storage.hasViewed('ex1')).toBe(false);
  });

  it('should recover from non-array on markViewed', () => {
    localStorage.setItem('test-solution-views', '"string"');
    storage.markViewed('ex1');
    expect(storage.hasViewed('ex1')).toBe(true);
  });
});

describe('ExerciseSolutionPanel', () => {
  let panel: ExerciseSolutionPanel;
  let storage: SolutionViewStorage;
  let host: HTMLElement;

  beforeEach(() => {
    localStorage.clear();
    storage = new SolutionViewStorage('test-solution-panel');
    panel = new ExerciseSolutionPanel(storage);
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    panel.destroy();
    document.body.removeChild(host);
    localStorage.clear();
  });

  describe('show', () => {
    it('should render the solution panel', () => {
      const exercise = makeExercise();
      panel.show(exercise, '; my attempt', { onDismiss: () => {} }, host);
      expect(host.querySelector('.da-exercise-solution')).not.toBeNull();
    });

    it('should not render panel for exercise with no solution', () => {
      const exercise = makeExercise({ solution: '' });
      panel.show(exercise, '', { onDismiss: () => {} }, host);
      expect(host.querySelector('.da-exercise-solution')).toBeNull();
    });

    it('should show confirmation step for first view', () => {
      const exercise = makeExercise();
      panel.show(exercise, '', { onDismiss: () => {} }, host);
      expect(host.querySelector('.da-exercise-solution__warning')).not.toBeNull();
      expect(host.querySelector('.da-exercise-solution__confirm')).not.toBeNull();
      // Solution code should NOT be visible yet
      expect(host.querySelector('.da-exercise-solution__code')).toBeNull();
    });

    it('should show solution directly if already viewed', () => {
      storage.markViewed('test-ex');
      const exercise = makeExercise();
      panel.show(exercise, '', { onDismiss: () => {} }, host);
      // Should see code, not confirmation
      expect(host.querySelector('.da-exercise-solution__code')).not.toBeNull();
      expect(host.querySelector('.da-exercise-solution__confirm')).toBeNull();
    });

    it('should reveal solution after clicking confirm button', () => {
      const exercise = makeExercise();
      panel.show(exercise, '', { onDismiss: () => {} }, host);

      const btn = host.querySelector('.da-exercise-solution__confirm') as HTMLButtonElement;
      btn.click();

      // After confirmation, solution should be visible
      expect(host.querySelector('.da-exercise-solution__code')).not.toBeNull();
      expect(host.querySelector('.da-exercise-solution__confirm')).toBeNull();
      expect(storage.hasViewed('test-ex')).toBe(true);
    });

    it('should show explanation text', () => {
      storage.markViewed('test-ex');
      const exercise = makeExercise();
      panel.show(exercise, '', { onDismiss: () => {} }, host);
      const explanation = host.querySelector('.da-exercise-solution__explanation');
      expect(explanation).not.toBeNull();
      expect(explanation!.textContent).toBe('Load VALUE and store it at RESULT.');
    });

    it('should show solution code', () => {
      storage.markViewed('test-ex');
      const exercise = makeExercise();
      panel.show(exercise, '', { onDismiss: () => {} }, host);
      const code = host.querySelector('.da-exercise-solution__code code');
      expect(code).not.toBeNull();
      expect(code!.textContent).toContain('LDA VALUE');
    });

    it('should show user attempt when different from starter code', () => {
      storage.markViewed('test-ex');
      const exercise = makeExercise();
      panel.show(exercise, 'LDA VALUE\nADD NUM2\nHLT', { onDismiss: () => {} }, host);
      const codeBlocks = host.querySelectorAll('.da-exercise-solution__code');
      expect(codeBlocks.length).toBe(2); // solution + user attempt
    });

    it('should not show user attempt when same as starter code', () => {
      storage.markViewed('test-ex');
      const exercise = makeExercise();
      panel.show(exercise, exercise.starterCode, { onDismiss: () => {} }, host);
      const codeBlocks = host.querySelectorAll('.da-exercise-solution__code');
      expect(codeBlocks.length).toBe(1); // only solution
    });

    it('should not show user attempt when empty', () => {
      storage.markViewed('test-ex');
      const exercise = makeExercise();
      panel.show(exercise, '', { onDismiss: () => {} }, host);
      const codeBlocks = host.querySelectorAll('.da-exercise-solution__code');
      expect(codeBlocks.length).toBe(1);
    });
  });

  describe('dismiss', () => {
    it('should remove the panel from DOM', () => {
      const exercise = makeExercise();
      panel.show(exercise, '', { onDismiss: () => {} }, host);
      panel.dismiss();
      expect(host.querySelector('.da-exercise-solution')).toBeNull();
    });

    it('should be safe to call when no panel shown', () => {
      expect(() => panel.dismiss()).not.toThrow();
    });

    it('should dismiss when X button clicked', () => {
      let dismissed = false;
      const exercise = makeExercise();
      panel.show(exercise, '', { onDismiss: () => { dismissed = true; } }, host);
      const btn = host.querySelector('.da-exercise-solution__dismiss') as HTMLButtonElement;
      btn.click();
      expect(panel.isVisible()).toBe(false);
      expect(dismissed).toBe(true);
    });
  });

  describe('isVisible', () => {
    it('should return false before show', () => {
      expect(panel.isVisible()).toBe(false);
    });

    it('should return true after show', () => {
      panel.show(makeExercise(), '', { onDismiss: () => {} }, host);
      expect(panel.isVisible()).toBe(true);
    });

    it('should return false after dismiss', () => {
      panel.show(makeExercise(), '', { onDismiss: () => {} }, host);
      panel.dismiss();
      expect(panel.isVisible()).toBe(false);
    });
  });

  describe('show replaces previous', () => {
    it('should remove old panel when show called again', () => {
      panel.show(makeExercise(), '', { onDismiss: () => {} }, host);
      panel.show(makeExercise({ id: 'test-ex-2' }), '', { onDismiss: () => {} }, host);
      const panels = host.querySelectorAll('.da-exercise-solution');
      expect(panels.length).toBe(1);
    });
  });

  describe('accessibility', () => {
    it('should have role="complementary"', () => {
      panel.show(makeExercise(), '', { onDismiss: () => {} }, host);
      const el = host.querySelector('.da-exercise-solution');
      expect(el!.getAttribute('role')).toBe('complementary');
    });

    it('should have aria-label', () => {
      panel.show(makeExercise(), '', { onDismiss: () => {} }, host);
      const el = host.querySelector('.da-exercise-solution');
      expect(el!.getAttribute('aria-label')).toBe('Exercise solution');
    });

    it('should have aria-label on dismiss button', () => {
      panel.show(makeExercise(), '', { onDismiss: () => {} }, host);
      const btn = host.querySelector('.da-exercise-solution__dismiss');
      expect(btn!.getAttribute('aria-label')).toBe('Dismiss solution');
    });

    it('should have role="alert" on warning message', () => {
      const exercise = makeExercise();
      panel.show(exercise, '', { onDismiss: () => {} }, host);
      const warning = host.querySelector('.da-exercise-solution__warning');
      expect(warning!.getAttribute('role')).toBe('alert');
    });
  });

  describe('destroy', () => {
    it('should remove panel and clean up', () => {
      panel.show(makeExercise(), '', { onDismiss: () => {} }, host);
      panel.destroy();
      expect(host.querySelector('.da-exercise-solution')).toBeNull();
      expect(panel.isVisible()).toBe(false);
    });
  });
});
