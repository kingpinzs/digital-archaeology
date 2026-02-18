// src/progress/DiscoveryNotification.test.ts
// Tests for DiscoveryNotification toast UI component
// Story 19.1: Track First-Time Discoveries

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DiscoveryNotification } from './DiscoveryNotification';
import { DISCOVERY_METADATA } from './types';
import type { Discovery } from './types';

/** Helper: create a valid discovery for testing */
function createDiscovery(overrides: Partial<Discovery> = {}): Discovery {
  return {
    type: 'first-assembly',
    timestamp: 1700000000000,
    stage: 'micro4',
    experimentationMode: false,
    ...overrides,
  };
}

describe('DiscoveryNotification', () => {
  let notification: DiscoveryNotification;
  let parent: HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers();
    parent = document.createElement('div');
    document.body.appendChild(parent);
    notification = new DiscoveryNotification();
  });

  afterEach(() => {
    notification.destroy();
    parent.remove();
    vi.useRealTimers();
  });

  describe('mount', () => {
    it('creates container with role="status"', () => {
      notification.mount(parent);
      const container = parent.querySelector('.da-discovery-toast-container');
      expect(container).not.toBeNull();
      expect(container?.getAttribute('role')).toBe('status');
    });

    it('creates container with aria-live="polite"', () => {
      notification.mount(parent);
      const container = parent.querySelector('.da-discovery-toast-container');
      expect(container?.getAttribute('aria-live')).toBe('polite');
    });
  });

  describe('show', () => {
    it('creates toast element with discovery title', () => {
      notification.mount(parent);
      notification.show(createDiscovery());
      const title = parent.querySelector('.da-discovery-toast__title');
      expect(title?.textContent).toBe(DISCOVERY_METADATA['first-assembly'].title);
    });

    it('creates toast element with discovery icon', () => {
      notification.mount(parent);
      notification.show(createDiscovery());
      const icon = parent.querySelector('.da-discovery-toast__icon');
      expect(icon?.textContent).toBe(DISCOVERY_METADATA['first-assembly'].icon);
    });

    it('creates toast element with discovery description', () => {
      notification.mount(parent);
      notification.show(createDiscovery());
      const desc = parent.querySelector('.da-discovery-toast__description');
      expect(desc?.textContent).toBe(DISCOVERY_METADATA['first-assembly'].description);
    });

    it('toast has entering CSS class initially', () => {
      notification.mount(parent);
      notification.show(createDiscovery());
      const toast = parent.querySelector('.da-discovery-toast');
      expect(toast?.classList.contains('da-discovery-toast--entering')).toBe(true);
    });

    it('does nothing when not mounted', () => {
      // Should not throw
      notification.show(createDiscovery());
    });
  });

  describe('auto-dismiss', () => {
    it('removes toast after dismiss timeout', () => {
      notification.mount(parent);
      notification.show(createDiscovery());
      expect(parent.querySelector('.da-discovery-toast')).not.toBeNull();

      // Advance past dismiss delay (4000ms) + exit animation (200ms)
      vi.advanceTimersByTime(4000);
      // Toast should have exiting class
      const toast = parent.querySelector('.da-discovery-toast');
      expect(toast?.classList.contains('da-discovery-toast--exiting')).toBe(true);

      // Advance past exit animation
      vi.advanceTimersByTime(200);
      expect(parent.querySelector('.da-discovery-toast')).toBeNull();
    });
  });

  describe('queue behavior', () => {
    it('queues second discovery when first is showing', () => {
      notification.mount(parent);
      notification.show(createDiscovery({ type: 'first-assembly' }));
      notification.show(createDiscovery({ type: 'first-subroutine' }));

      // Only one toast should be visible
      const toasts = parent.querySelectorAll('.da-discovery-toast');
      expect(toasts).toHaveLength(1);
      const title = parent.querySelector('.da-discovery-toast__title');
      expect(title?.textContent).toBe(DISCOVERY_METADATA['first-assembly'].title);
    });

    it('shows queued discovery after first dismisses', () => {
      notification.mount(parent);
      notification.show(createDiscovery({ type: 'first-assembly' }));
      notification.show(createDiscovery({ type: 'first-subroutine' }));

      // Dismiss first toast: 4000ms dismiss + 200ms exit + 500ms gap
      vi.advanceTimersByTime(4000 + 200 + 500);

      const title = parent.querySelector('.da-discovery-toast__title');
      expect(title?.textContent).toBe(DISCOVERY_METADATA['first-subroutine'].title);
    });
  });

  describe('destroy', () => {
    it('removes container from DOM', () => {
      notification.mount(parent);
      notification.destroy();
      expect(parent.querySelector('.da-discovery-toast-container')).toBeNull();
    });

    it('cleans up pending timeouts', () => {
      notification.mount(parent);
      notification.show(createDiscovery());
      notification.destroy();
      // Advancing timers should not cause errors
      vi.advanceTimersByTime(10000);
    });

    it('clears the queue', () => {
      notification.mount(parent);
      notification.show(createDiscovery({ type: 'first-assembly' }));
      notification.show(createDiscovery({ type: 'first-subroutine' }));
      notification.destroy();

      // Re-mount and verify no queued items are displayed
      notification = new DiscoveryNotification();
      notification.mount(parent);
      vi.advanceTimersByTime(10000);
      expect(parent.querySelectorAll('.da-discovery-toast')).toHaveLength(0);
    });
  });
});
