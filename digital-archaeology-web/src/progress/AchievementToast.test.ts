// src/progress/AchievementToast.test.ts
// Tests for AchievementToast notification UI component
// Story 19.3: Create Milestone Achievements

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AchievementToast } from './AchievementToast';
import type { Achievement } from './types';

/** Helper: create a test achievement */
function createTestAchievement(overrides: Partial<Achievement> = {}): Achievement {
  return {
    type: 'first-discovery',
    timestamp: 1700000000000,
    tier: 'common',
    ...overrides,
  };
}

describe('AchievementToast', () => {
  let toast: AchievementToast;
  let container: HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers();
    toast = new AchievementToast();
    container = document.createElement('div');
    document.body.appendChild(container);
    toast.mount(container);
  });

  afterEach(() => {
    toast.destroy();
    container.remove();
    vi.useRealTimers();
  });

  describe('mount', () => {
    it('creates a toast container with ARIA attributes', () => {
      const toastContainer = container.querySelector('.da-achievement-toast-container');
      expect(toastContainer).not.toBeNull();
      expect(toastContainer!.getAttribute('role')).toBe('status');
      expect(toastContainer!.getAttribute('aria-live')).toBe('polite');
    });

    it('does not show any toasts until show() is called', () => {
      expect(container.querySelector('.da-achievement-toast')).toBeNull();
    });
  });

  describe('show', () => {
    it('creates toast element with correct classes', () => {
      toast.show(createTestAchievement());
      const toastEl = container.querySelector('.da-achievement-toast');
      expect(toastEl).not.toBeNull();
      expect(toastEl!.classList.contains('da-achievement-toast--entering')).toBe(true);
    });

    it('displays achievement title from metadata', () => {
      toast.show(createTestAchievement({ type: 'first-discovery' }));
      const title = container.querySelector('.da-achievement-toast__title');
      expect(title).not.toBeNull();
      expect(title!.textContent).toBe('First Discovery');
    });

    it('displays achievement description from metadata', () => {
      toast.show(createTestAchievement({ type: 'first-discovery' }));
      const desc = container.querySelector('.da-achievement-toast__description');
      expect(desc).not.toBeNull();
      expect(desc!.textContent).toBe('Earned your first discovery.');
    });

    it('displays achievement icon from metadata', () => {
      toast.show(createTestAchievement({ type: 'first-discovery' }));
      const icon = container.querySelector('.da-achievement-toast__icon');
      expect(icon).not.toBeNull();
      expect(icon!.textContent!.length).toBeGreaterThan(0);
    });

    it('displays tier badge', () => {
      toast.show(createTestAchievement({ tier: 'rare' }));
      const tierEl = container.querySelector('.da-achievement-toast__tier');
      expect(tierEl).not.toBeNull();
      expect(tierEl!.textContent).toBe('rare');
    });

    it('sets tier color on toast border', () => {
      toast.show(createTestAchievement({ tier: 'legendary' }));
      const toastEl = container.querySelector('.da-achievement-toast') as HTMLElement;
      // Browser normalizes hex to rgb
      expect(toastEl.style.borderLeftColor).toBe('rgb(255, 215, 0)');
    });

    it('auto-dismisses after 5000ms', () => {
      toast.show(createTestAchievement());
      expect(container.querySelector('.da-achievement-toast')).not.toBeNull();

      vi.advanceTimersByTime(5000);
      const toastEl = container.querySelector('.da-achievement-toast');
      expect(toastEl!.classList.contains('da-achievement-toast--exiting')).toBe(true);

      vi.advanceTimersByTime(200);
      expect(container.querySelector('.da-achievement-toast')).toBeNull();
    });
  });

  describe('queuing', () => {
    it('queues second toast while first is showing', () => {
      toast.show(createTestAchievement({ type: 'first-discovery' }));
      toast.show(createTestAchievement({ type: 'code-pioneer' }));

      // Only one toast visible at a time
      const toasts = container.querySelectorAll('.da-achievement-toast');
      expect(toasts).toHaveLength(1);
    });

    it('shows queued toast after first dismisses', () => {
      toast.show(createTestAchievement({ type: 'first-discovery' }));
      toast.show(createTestAchievement({ type: 'code-pioneer' }));

      // Dismiss first toast
      vi.advanceTimersByTime(5000); // auto-dismiss
      vi.advanceTimersByTime(200);  // exit animation
      vi.advanceTimersByTime(600);  // queue gap

      const title = container.querySelector('.da-achievement-toast__title');
      expect(title).not.toBeNull();
      expect(title!.textContent).toBe('Code Pioneer');
    });
  });

  describe('onGalleryOpen callback', () => {
    it('shows View button when callback is set', () => {
      toast.onGalleryOpen = vi.fn();
      toast.show(createTestAchievement());

      const viewBtn = container.querySelector('.da-achievement-toast__view');
      expect(viewBtn).not.toBeNull();
      expect(viewBtn!.textContent).toBe('View');
    });

    it('does not show View button when callback is null', () => {
      toast.onGalleryOpen = null;
      toast.show(createTestAchievement());

      const viewBtn = container.querySelector('.da-achievement-toast__view');
      expect(viewBtn).toBeNull();
    });

    it('triggers callback on View click', () => {
      const callback = vi.fn();
      toast.onGalleryOpen = callback;
      toast.show(createTestAchievement());

      const viewBtn = container.querySelector('.da-achievement-toast__view') as HTMLButtonElement;
      viewBtn.click();
      expect(callback).toHaveBeenCalledOnce();
    });
  });

  describe('destroy', () => {
    it('cleans up DOM elements', () => {
      toast.show(createTestAchievement());
      expect(container.querySelector('.da-achievement-toast-container')).not.toBeNull();

      toast.destroy();
      expect(container.querySelector('.da-achievement-toast-container')).toBeNull();
    });

    it('clears pending timeouts', () => {
      toast.show(createTestAchievement());
      toast.destroy();

      // Advancing timers should not cause errors
      vi.advanceTimersByTime(10000);
    });

    it('handles being called when nothing is showing', () => {
      expect(() => toast.destroy()).not.toThrow();
    });

    it('clears queue', () => {
      toast.show(createTestAchievement({ type: 'first-discovery' }));
      toast.show(createTestAchievement({ type: 'code-pioneer' }));
      toast.destroy();

      // Re-mount and verify no queued items appear
      toast.mount(container);
      vi.advanceTimersByTime(10000);
      expect(container.querySelector('.da-achievement-toast')).toBeNull();
    });
  });
});
