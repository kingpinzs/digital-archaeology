// src/progress/ActCelebration.test.ts
// Tests for ActCelebration overlay UI component
// Story 19.2: Track Act Completion

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ActCelebration } from './ActCelebration';
import type { ActCompletion } from './types';

/** Helper: create a valid act completion for testing */
function createTestCompletion(overrides: Partial<ActCompletion> = {}): ActCompletion {
  return {
    actNumber: 0,
    actId: 'act-0',
    timestamp: 1700000000000,
    actTitle: 'Pre-history',
    era: '3000 BC - 1840s',
    ...overrides,
  };
}

describe('ActCelebration', () => {
  let celebration: ActCelebration;
  let container: HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers();
    celebration = new ActCelebration();
    container = document.createElement('div');
    document.body.appendChild(container);
    celebration.mount(container);
  });

  afterEach(() => {
    celebration.destroy();
    container.remove();
    vi.useRealTimers();
  });

  describe('mount', () => {
    it('does not create any DOM elements until show() is called', () => {
      expect(container.children).toHaveLength(0);
    });
  });

  describe('show', () => {
    it('creates overlay with correct ARIA attributes', () => {
      celebration.show(createTestCompletion());

      const overlay = container.querySelector('.da-act-celebration');
      expect(overlay).not.toBeNull();
      expect(overlay!.getAttribute('role')).toBe('dialog');
      expect(overlay!.getAttribute('aria-modal')).toBe('true');
      expect(overlay!.getAttribute('aria-labelledby')).toBe('da-act-celebration-title');
    });

    it('displays act title in the overlay', () => {
      celebration.show(createTestCompletion({ actTitle: 'Vacuum Tubes' }));

      const title = container.querySelector('.da-act-celebration__title');
      expect(title).not.toBeNull();
      expect(title!.textContent).toContain('Vacuum Tubes');
    });

    it('displays era badge', () => {
      celebration.show(createTestCompletion({ era: '1945 - 1955' }));

      const era = container.querySelector('.da-act-celebration__era');
      expect(era).not.toBeNull();
      expect(era!.textContent).toBe('1945 - 1955');
    });

    it('displays icon', () => {
      celebration.show(createTestCompletion());

      const icon = container.querySelector('.da-act-celebration__icon');
      expect(icon).not.toBeNull();
      expect(icon!.textContent).toBe('\u{1F389}');
    });

    it('has entering CSS class initially', () => {
      celebration.show(createTestCompletion());

      const overlay = container.querySelector('.da-act-celebration');
      expect(overlay!.classList.contains('da-act-celebration--entering')).toBe(true);
    });

    it('has Continue button', () => {
      celebration.show(createTestCompletion());

      const button = container.querySelector('.da-act-celebration__continue');
      expect(button).not.toBeNull();
      expect(button!.textContent).toBe('Continue');
    });
  });

  describe('dismissal', () => {
    it('Continue button dismisses overlay', () => {
      celebration.show(createTestCompletion());

      const button = container.querySelector('.da-act-celebration__continue') as HTMLButtonElement;
      button.click();

      // Exit animation should add exiting class
      const overlay = container.querySelector('.da-act-celebration');
      expect(overlay!.classList.contains('da-act-celebration--exiting')).toBe(true);

      // After exit animation duration (300ms), overlay should be removed
      vi.advanceTimersByTime(300);
      expect(container.querySelector('.da-act-celebration')).toBeNull();
    });

    it('auto-dismisses after 6000ms', () => {
      celebration.show(createTestCompletion());

      expect(container.querySelector('.da-act-celebration')).not.toBeNull();

      // Advance to auto-dismiss time
      vi.advanceTimersByTime(6000);

      // Should have exiting class
      const overlay = container.querySelector('.da-act-celebration');
      expect(overlay!.classList.contains('da-act-celebration--exiting')).toBe(true);

      // After exit animation
      vi.advanceTimersByTime(300);
      expect(container.querySelector('.da-act-celebration')).toBeNull();
    });

    it('Escape key dismisses overlay', () => {
      celebration.show(createTestCompletion());

      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      document.dispatchEvent(event);

      const overlay = container.querySelector('.da-act-celebration');
      expect(overlay!.classList.contains('da-act-celebration--exiting')).toBe(true);

      vi.advanceTimersByTime(300);
      expect(container.querySelector('.da-act-celebration')).toBeNull();
    });

    it('double-dismiss does not cause errors (F2 race guard)', () => {
      celebration.show(createTestCompletion());

      const button = container.querySelector('.da-act-celebration__continue') as HTMLButtonElement;

      // Click twice rapidly
      button.click();
      button.click();

      const overlay = container.querySelector('.da-act-celebration');
      expect(overlay!.classList.contains('da-act-celebration--exiting')).toBe(true);

      // Only one exit animation should occur
      vi.advanceTimersByTime(300);
      expect(container.querySelector('.da-act-celebration')).toBeNull();
    });

    it('Tab key traps focus within the overlay (F5 focus trap)', () => {
      celebration.show(createTestCompletion());

      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      document.dispatchEvent(tabEvent);

      const continueBtn = container.querySelector('.da-act-celebration__continue');
      expect(document.activeElement).toBe(continueBtn);
    });

    it('restores focus after dismiss (F5 focus restoration)', () => {
      // Create an external button that has focus before the overlay shows
      const externalBtn = document.createElement('button');
      externalBtn.textContent = 'External';
      document.body.appendChild(externalBtn);
      externalBtn.focus();
      expect(document.activeElement).toBe(externalBtn);

      celebration.show(createTestCompletion());

      // Dismiss the overlay
      const continueBtn = container.querySelector('.da-act-celebration__continue') as HTMLButtonElement;
      continueBtn.click();
      vi.advanceTimersByTime(300);

      // Focus should be restored to the external button
      expect(document.activeElement).toBe(externalBtn);

      externalBtn.remove();
    });
  });

  describe('destroy', () => {
    it('cleans up pending timeouts and DOM elements', () => {
      celebration.show(createTestCompletion());
      expect(container.querySelector('.da-act-celebration')).not.toBeNull();

      celebration.destroy();
      expect(container.querySelector('.da-act-celebration')).toBeNull();
    });

    it('handles being called when no overlay is showing', () => {
      expect(() => celebration.destroy()).not.toThrow();
    });

    it('removes keyboard listener', () => {
      celebration.show(createTestCompletion());
      celebration.destroy();

      // Re-mount with new celebration to verify old listener is gone
      const newCelebration = new ActCelebration();
      const newContainer = document.createElement('div');
      document.body.appendChild(newContainer);
      newCelebration.mount(newContainer);
      newCelebration.show(createTestCompletion());

      // Escape should only affect the new one
      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      document.dispatchEvent(event);

      const overlay = newContainer.querySelector('.da-act-celebration');
      expect(overlay!.classList.contains('da-act-celebration--exiting')).toBe(true);

      newCelebration.destroy();
      newContainer.remove();
    });
  });
});
