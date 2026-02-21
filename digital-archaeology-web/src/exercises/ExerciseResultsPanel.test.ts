// src/exercises/ExerciseResultsPanel.test.ts
// Tests for ExerciseResultsPanel UI component — Story 21.4

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExerciseResultsPanel } from './ExerciseResultsPanel';
import type { ExerciseValidationResult } from './types';

function makePassResult(): ExerciseValidationResult {
  return {
    exerciseId: 'test-ex',
    passed: true,
    results: [
      { label: 'RESULT', address: 0xF1, expected: 7, actual: 7, passed: true },
    ],
  };
}

function makeFailResult(): ExerciseValidationResult {
  return {
    exerciseId: 'test-ex',
    passed: false,
    results: [
      { label: 'SWAP_A', address: 0x100, expected: 0xAB, actual: 0xAB, passed: true },
      { label: 'SWAP_B', address: 0x101, expected: 0x42, actual: 0xFF, passed: false },
    ],
  };
}

function makeMixedResult(): ExerciseValidationResult {
  return {
    exerciseId: 'test-mixed',
    passed: false,
    results: [
      { label: 'A', address: 0x100, expected: 11, actual: 11, passed: true },
      { label: 'B', address: 0x101, expected: 12, actual: 99, passed: false },
      { label: 'C', address: 0x102, expected: 22, actual: 22, passed: true },
    ],
  };
}

describe('ExerciseResultsPanel', () => {
  let panel: ExerciseResultsPanel;
  let host: HTMLElement;

  beforeEach(() => {
    panel = new ExerciseResultsPanel();
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    panel.destroy();
    document.body.removeChild(host);
  });

  describe('show (all pass)', () => {
    it('should render a results panel in the host', () => {
      panel.show(makePassResult(), { onDismiss: vi.fn() }, host);
      expect(host.querySelector('.da-exercise-results')).not.toBeNull();
    });

    it('should show pass header with checkmark', () => {
      panel.show(makePassResult(), { onDismiss: vi.fn() }, host);
      const header = host.querySelector('.da-exercise-results__header--pass');
      expect(header).not.toBeNull();
      expect(header!.textContent).toContain('1 test passed');
    });

    it('should show "All N tests passed!" for pass result', () => {
      panel.show(makePassResult(), { onDismiss: vi.fn() }, host);
      const title = host.querySelector('.da-exercise-results__title');
      expect(title!.textContent).toBe('All 1 test passed!');
    });

    it('should show the test case item as passed', () => {
      panel.show(makePassResult(), { onDismiss: vi.fn() }, host);
      const item = host.querySelector('.da-exercise-results__item--pass');
      expect(item).not.toBeNull();
      const label = item!.querySelector('.da-exercise-results__item-label');
      expect(label!.textContent).toBe('RESULT');
    });

    it('should not show expected/actual detail for passing tests', () => {
      panel.show(makePassResult(), { onDismiss: vi.fn() }, host);
      const detail = host.querySelector('.da-exercise-results__item-detail');
      expect(detail).toBeNull();
    });

    it('should show address for each test case', () => {
      panel.show(makePassResult(), { onDismiss: vi.fn() }, host);
      const addr = host.querySelector('.da-exercise-results__item-address');
      expect(addr!.textContent).toBe('@0xF1');
    });
  });

  describe('show (fail)', () => {
    it('should show fail header', () => {
      panel.show(makeFailResult(), { onDismiss: vi.fn() }, host);
      const header = host.querySelector('.da-exercise-results__header--fail');
      expect(header).not.toBeNull();
    });

    it('should show pass count in title', () => {
      panel.show(makeFailResult(), { onDismiss: vi.fn() }, host);
      const title = host.querySelector('.da-exercise-results__title');
      expect(title!.textContent).toBe('1/2 tests passed');
    });

    it('should show expected vs actual for failing test', () => {
      panel.show(makeFailResult(), { onDismiss: vi.fn() }, host);
      const detail = host.querySelector('.da-exercise-results__item-detail');
      expect(detail).not.toBeNull();
      expect(detail!.textContent).toContain('expected 0x42');
      expect(detail!.textContent).toContain('got 0xFF');
    });

    it('should render both pass and fail items', () => {
      panel.show(makeFailResult(), { onDismiss: vi.fn() }, host);
      const passItems = host.querySelectorAll('.da-exercise-results__item--pass');
      const failItems = host.querySelectorAll('.da-exercise-results__item--fail');
      expect(passItems.length).toBe(1);
      expect(failItems.length).toBe(1);
    });

    it('should not show Mark Complete button on failure', () => {
      panel.show(makeFailResult(), { onDismiss: vi.fn(), onMarkCompleted: vi.fn() }, host);
      const btn = host.querySelector('.da-exercise-results__complete');
      expect(btn).toBeNull();
    });

    it('should show "out of bounds" for negative actual values', () => {
      const result: ExerciseValidationResult = {
        exerciseId: 'test-oob',
        passed: false,
        results: [
          { label: 'OOB', address: 300, expected: 0, actual: -1, passed: false },
        ],
      };
      panel.show(result, { onDismiss: vi.fn() }, host);
      const detail = host.querySelector('.da-exercise-results__item-detail');
      expect(detail!.textContent).toContain('out of bounds');
      expect(detail!.textContent).not.toContain('0x-1');
    });
  });

  describe('show (mixed)', () => {
    it('should show correct counts for mixed results', () => {
      panel.show(makeMixedResult(), { onDismiss: vi.fn() }, host);
      const title = host.querySelector('.da-exercise-results__title');
      expect(title!.textContent).toBe('2/3 tests passed');
    });

    it('should render correct number of list items', () => {
      panel.show(makeMixedResult(), { onDismiss: vi.fn() }, host);
      const items = host.querySelectorAll('.da-exercise-results__item');
      expect(items.length).toBe(3);
    });
  });

  describe('Mark Complete button', () => {
    it('should show when all tests pass and callback provided', () => {
      panel.show(makePassResult(), { onDismiss: vi.fn(), onMarkCompleted: vi.fn() }, host);
      const btn = host.querySelector('.da-exercise-results__complete');
      expect(btn).not.toBeNull();
      expect(btn!.textContent).toBe('Mark Exercise Complete');
    });

    it('should call onMarkCompleted with exercise ID when clicked', () => {
      const onMarkCompleted = vi.fn();
      const onDismiss = vi.fn();
      panel.show(makePassResult(), { onDismiss, onMarkCompleted }, host);
      const btn = host.querySelector('.da-exercise-results__complete') as HTMLButtonElement;
      btn.click();
      expect(onMarkCompleted).toHaveBeenCalledWith('test-ex');
    });

    it('should dismiss panel after marking complete', () => {
      const onMarkCompleted = vi.fn();
      const onDismiss = vi.fn();
      panel.show(makePassResult(), { onDismiss, onMarkCompleted }, host);
      const btn = host.querySelector('.da-exercise-results__complete') as HTMLButtonElement;
      btn.click();
      expect(panel.isVisible()).toBe(false);
      expect(onDismiss).toHaveBeenCalled();
    });

    it('should not show when onMarkCompleted callback is missing', () => {
      panel.show(makePassResult(), { onDismiss: vi.fn() }, host);
      const btn = host.querySelector('.da-exercise-results__complete');
      expect(btn).toBeNull();
    });
  });

  describe('dismiss', () => {
    it('should remove the panel from the DOM', () => {
      panel.show(makePassResult(), { onDismiss: vi.fn() }, host);
      expect(host.querySelector('.da-exercise-results')).not.toBeNull();
      panel.dismiss();
      expect(host.querySelector('.da-exercise-results')).toBeNull();
    });

    it('should call onDismiss callback when dismiss button clicked', () => {
      const onDismiss = vi.fn();
      panel.show(makePassResult(), { onDismiss }, host);
      const dismissBtn = host.querySelector('.da-exercise-results__dismiss') as HTMLButtonElement;
      dismissBtn.click();
      expect(onDismiss).toHaveBeenCalled();
    });

    it('should be safe to call dismiss when no panel shown', () => {
      expect(() => panel.dismiss()).not.toThrow();
    });
  });

  describe('isVisible', () => {
    it('should return false before show', () => {
      expect(panel.isVisible()).toBe(false);
    });

    it('should return true after show', () => {
      panel.show(makePassResult(), { onDismiss: vi.fn() }, host);
      expect(panel.isVisible()).toBe(true);
    });

    it('should return false after dismiss', () => {
      panel.show(makePassResult(), { onDismiss: vi.fn() }, host);
      panel.dismiss();
      expect(panel.isVisible()).toBe(false);
    });
  });

  describe('show replaces previous', () => {
    it('should remove old panel when show is called again', () => {
      panel.show(makePassResult(), { onDismiss: vi.fn() }, host);
      panel.show(makeFailResult(), { onDismiss: vi.fn() }, host);
      const panels = host.querySelectorAll('.da-exercise-results');
      expect(panels.length).toBe(1);
      // Should be fail result
      const header = host.querySelector('.da-exercise-results__header--fail');
      expect(header).not.toBeNull();
    });
  });

  describe('error message', () => {
    it('should display error message when present', () => {
      const result: ExerciseValidationResult = {
        exerciseId: 'test-error',
        passed: false,
        results: [],
        error: 'CPU did not halt within timeout',
      };
      panel.show(result, { onDismiss: vi.fn() }, host);
      const errorEl = host.querySelector('.da-exercise-results__error');
      expect(errorEl).not.toBeNull();
      expect(errorEl!.textContent).toBe('CPU did not halt within timeout');
    });

    it('should not show error element when no error', () => {
      panel.show(makePassResult(), { onDismiss: vi.fn() }, host);
      const errorEl = host.querySelector('.da-exercise-results__error');
      expect(errorEl).toBeNull();
    });
  });

  describe('accessibility', () => {
    it('should have role="status" on the panel', () => {
      panel.show(makePassResult(), { onDismiss: vi.fn() }, host);
      const el = host.querySelector('.da-exercise-results');
      expect(el!.getAttribute('role')).toBe('status');
    });

    it('should have aria-live="polite"', () => {
      panel.show(makePassResult(), { onDismiss: vi.fn() }, host);
      const el = host.querySelector('.da-exercise-results');
      expect(el!.getAttribute('aria-live')).toBe('polite');
    });

    it('should have aria-label on dismiss button', () => {
      panel.show(makePassResult(), { onDismiss: vi.fn() }, host);
      const btn = host.querySelector('.da-exercise-results__dismiss');
      expect(btn!.getAttribute('aria-label')).toBe('Dismiss results');
    });
  });

  describe('destroy', () => {
    it('should remove panel and clean up', () => {
      panel.show(makePassResult(), { onDismiss: vi.fn() }, host);
      panel.destroy();
      expect(host.querySelector('.da-exercise-results')).toBeNull();
      expect(panel.isVisible()).toBe(false);
    });
  });
});
