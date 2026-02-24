// src/story/ConnectionPanel.test.ts
// Tests for the "IT WORKS!" Connection Panel
// Story 26.14: IT WORKS Connection System

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConnectionPanel } from './ConnectionPanel';
import type { ItWorksData } from './content-types';

describe('ConnectionPanel', () => {
  let panel: ConnectionPanel;
  let container: HTMLElement;

  const mockData: ItWorksData = {
    headline: 'IT WORKS! You built a working ALU!',
    connections: [
      { type: 'idea', text: 'This relates to Boolean algebra, which you explored in logic gates' },
      { type: 'thinker', text: 'This is similar to what John von Neumann designed in 1945' },
      { type: 'future', text: 'This enables the full CPU pipeline you will see in Act 8', targetActNumber: 8 },
      { type: 'next-step', text: 'Now try building a register file to store your ALU results' },
    ],
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    panel = new ConnectionPanel();
    panel.mount(container);
  });

  afterEach(() => {
    panel.destroy();
    container.remove();
  });

  describe('show', () => {
    it('should create overlay when shown', () => {
      panel.show(mockData);
      expect(container.querySelector('.da-connection-panel')).not.toBeNull();
    });

    it('should display the headline', () => {
      panel.show(mockData);
      const headline = container.querySelector('.da-connection-panel__headline');
      expect(headline?.textContent).toBe('IT WORKS! You built a working ALU!');
    });

    it('should render all connection links', () => {
      panel.show(mockData);
      const links = container.querySelectorAll('.da-connection-panel__link');
      expect(links.length).toBe(4);
    });

    it('should show correct icons for each link type', () => {
      panel.show(mockData);
      const icons = container.querySelectorAll('.da-connection-panel__link-icon');
      expect(icons[0].textContent).toBe('\u{1F4A1}'); // 💡
      expect(icons[1].textContent).toBe('\u{1F9D1}'); // 🧑
      expect(icons[2].textContent).toBe('\u{1F680}'); // 🚀
      expect(icons[3].textContent).toBe('\u{27A1}');  // ➡️
    });

    it('should show correct labels for each link type', () => {
      panel.show(mockData);
      const labels = container.querySelectorAll('.da-connection-panel__link-label');
      expect(labels[0].textContent).toBe('Related Idea');
      expect(labels[1].textContent).toBe('Historical Connection');
      expect(labels[2].textContent).toBe('Future Path');
      expect(labels[3].textContent).toBe('Your Next Step');
    });

    it('should show link text content', () => {
      panel.show(mockData);
      const texts = container.querySelectorAll('.da-connection-panel__link-text');
      expect(texts[0].textContent).toContain('Boolean algebra');
      expect(texts[1].textContent).toContain('von Neumann');
    });

    it('should report isVisible as true', () => {
      expect(panel.isVisible()).toBe(false);
      panel.show(mockData);
      expect(panel.isVisible()).toBe(true);
    });

    it('should set ARIA attributes on overlay', () => {
      panel.show(mockData);
      const overlay = container.querySelector('.da-connection-panel');
      expect(overlay?.getAttribute('role')).toBe('dialog');
      expect(overlay?.getAttribute('aria-modal')).toBe('true');
      expect(overlay?.getAttribute('aria-labelledby')).toBe('da-connection-panel-title');
    });

    it('should render continue button', () => {
      panel.show(mockData);
      const btn = container.querySelector('.da-connection-panel__continue');
      expect(btn).not.toBeNull();
      expect(btn?.textContent).toBe('Continue');
    });
  });

  describe('navigable links', () => {
    it('should make links with targetActNumber navigable', () => {
      panel.show(mockData);
      const links = container.querySelectorAll('.da-connection-panel__link');
      // The "future" link has targetActNumber: 8
      const futureLink = links[2];
      expect(futureLink.classList.contains('da-connection-panel__link--navigable')).toBe(true);
      expect(futureLink.getAttribute('role')).toBe('button');
      expect(futureLink.getAttribute('tabindex')).toBe('0');
    });

    it('should NOT make links without targetActNumber navigable', () => {
      panel.show(mockData);
      const links = container.querySelectorAll('.da-connection-panel__link');
      // The "idea" link has no targetActNumber
      const ideaLink = links[0];
      expect(ideaLink.classList.contains('da-connection-panel__link--navigable')).toBe(false);
      expect(ideaLink.getAttribute('role')).toBeNull();
    });

    it('should call onNavigateToAct when a navigable link is clicked', () => {
      const onNavigateToAct = vi.fn();
      panel.setCallbacks({ onNavigateToAct });
      panel.show(mockData);

      const links = container.querySelectorAll('.da-connection-panel__link');
      (links[2] as HTMLElement).click();

      expect(onNavigateToAct).toHaveBeenCalledWith(8);
    });

    it('should navigate when Enter is pressed on a navigable link', () => {
      const onNavigateToAct = vi.fn();
      panel.setCallbacks({ onNavigateToAct });
      panel.show(mockData);

      const links = container.querySelectorAll('.da-connection-panel__link');
      const futureLink = links[2] as HTMLElement;
      futureLink.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

      expect(onNavigateToAct).toHaveBeenCalledWith(8);
    });

    it('should navigate when Space is pressed on a navigable link', () => {
      const onNavigateToAct = vi.fn();
      panel.setCallbacks({ onNavigateToAct });
      panel.show(mockData);

      const links = container.querySelectorAll('.da-connection-panel__link');
      const futureLink = links[2] as HTMLElement;
      futureLink.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));

      expect(onNavigateToAct).toHaveBeenCalledWith(8);
    });

    it('should dismiss panel after navigation click', () => {
      vi.useFakeTimers();
      const onNavigateToAct = vi.fn();
      panel.setCallbacks({ onNavigateToAct });
      panel.show(mockData);

      const links = container.querySelectorAll('.da-connection-panel__link');
      (links[2] as HTMLElement).click();

      // After exit animation
      vi.advanceTimersByTime(300);
      expect(panel.isVisible()).toBe(false);
      vi.useRealTimers();
    });
  });

  describe('dismiss', () => {
    it('should dismiss when continue button is clicked', () => {
      vi.useFakeTimers();
      panel.show(mockData);

      const btn = container.querySelector('.da-connection-panel__continue') as HTMLElement;
      btn.click();

      vi.advanceTimersByTime(300);
      expect(panel.isVisible()).toBe(false);
      vi.useRealTimers();
    });

    it('should dismiss on Escape key', () => {
      vi.useFakeTimers();
      panel.show(mockData);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      vi.advanceTimersByTime(300);
      expect(panel.isVisible()).toBe(false);
      vi.useRealTimers();
    });

    it('should call onDismiss callback when dismissed', () => {
      vi.useFakeTimers();
      const onDismiss = vi.fn();
      panel.setCallbacks({ onDismiss });
      panel.show(mockData);

      const btn = container.querySelector('.da-connection-panel__continue') as HTMLElement;
      btn.click();

      vi.advanceTimersByTime(300);
      expect(onDismiss).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('should auto-dismiss after 12 seconds', () => {
      vi.useFakeTimers();
      panel.show(mockData);
      expect(panel.isVisible()).toBe(true);

      vi.advanceTimersByTime(12000);
      vi.advanceTimersByTime(300); // exit animation
      expect(panel.isVisible()).toBe(false);
      vi.useRealTimers();
    });

    it('should add exiting class during dismiss animation', () => {
      vi.useFakeTimers();
      panel.show(mockData);

      const btn = container.querySelector('.da-connection-panel__continue') as HTMLElement;
      btn.click();

      const overlay = container.querySelector('.da-connection-panel');
      expect(overlay?.classList.contains('da-connection-panel--exiting')).toBe(true);

      vi.advanceTimersByTime(300);
      vi.useRealTimers();
    });
  });

  describe('destroy', () => {
    it('should clean up overlay on destroy', () => {
      panel.show(mockData);
      expect(container.querySelector('.da-connection-panel')).not.toBeNull();

      panel.destroy();
      expect(container.querySelector('.da-connection-panel')).toBeNull();
    });

    it('should report isVisible as false after destroy', () => {
      panel.show(mockData);
      panel.destroy();
      expect(panel.isVisible()).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle empty connections array', () => {
      const emptyData: ItWorksData = {
        headline: 'IT WORKS!',
        connections: [],
      };
      panel.show(emptyData);
      const links = container.querySelectorAll('.da-connection-panel__link');
      expect(links.length).toBe(0);
    });

    it('should handle single connection', () => {
      const singleData: ItWorksData = {
        headline: 'IT WORKS!',
        connections: [
          { type: 'next-step', text: 'Keep going!' },
        ],
      };
      panel.show(singleData);
      const links = container.querySelectorAll('.da-connection-panel__link');
      expect(links.length).toBe(1);
    });

    it('should not show if not mounted', () => {
      const unmounted = new ConnectionPanel();
      unmounted.show(mockData);
      expect(unmounted.isVisible()).toBe(false);
    });

    it('should remove previous overlay on repeated show', () => {
      panel.show(mockData);
      panel.show({ headline: 'Second!', connections: [] });

      const overlays = container.querySelectorAll('.da-connection-panel');
      expect(overlays.length).toBe(1);
      const headline = container.querySelector('.da-connection-panel__headline');
      expect(headline?.textContent).toBe('Second!');
    });

    it('should save and restore focus on show/dismiss', () => {
      vi.useFakeTimers();

      // Create a button that has focus before the panel opens
      const outerBtn = document.createElement('button');
      outerBtn.textContent = 'Outside';
      document.body.appendChild(outerBtn);
      outerBtn.focus();
      expect(document.activeElement).toBe(outerBtn);

      panel.show(mockData);

      // Dismiss via continue button
      const continueBtn = container.querySelector('.da-connection-panel__continue') as HTMLElement;
      continueBtn.click();
      vi.advanceTimersByTime(300);

      // Focus should be restored to the previously focused element
      expect(document.activeElement).toBe(outerBtn);

      outerBtn.remove();
      vi.useRealTimers();
    });

    it('should trap Tab focus within the panel', () => {
      panel.show(mockData);

      const overlay = container.querySelector('.da-connection-panel')!;
      const focusable = overlay.querySelectorAll<HTMLElement>(
        'button:not([disabled]):not([aria-hidden="true"]), [tabindex="0"]:not([disabled]):not([aria-hidden="true"])'
      );
      expect(focusable.length).toBeGreaterThan(0);

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      // Simulate Tab at last element — should wrap to first
      (last as HTMLElement).focus();
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      Object.defineProperty(tabEvent, 'shiftKey', { value: false });
      document.dispatchEvent(tabEvent);

      // Focus should wrap to first element
      expect(document.activeElement).toBe(first);
    });

    it('should trap Shift+Tab focus within the panel', () => {
      panel.show(mockData);

      const overlay = container.querySelector('.da-connection-panel')!;
      const focusable = overlay.querySelectorAll<HTMLElement>(
        'button:not([disabled]):not([aria-hidden="true"]), [tabindex="0"]:not([disabled]):not([aria-hidden="true"])'
      );
      expect(focusable.length).toBeGreaterThan(0);

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      // Simulate Shift+Tab at first element — should wrap to last
      (first as HTMLElement).focus();
      const shiftTabEvent = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true });
      document.dispatchEvent(shiftTabEvent);

      // Focus should wrap to last element
      expect(document.activeElement).toBe(last);
    });

    it('should allow dismiss on second show after first was dismissed', () => {
      vi.useFakeTimers();

      // First show + dismiss cycle
      panel.show(mockData);
      const btn1 = container.querySelector('.da-connection-panel__continue') as HTMLElement;
      btn1.click();
      vi.advanceTimersByTime(300); // exit animation
      expect(panel.isVisible()).toBe(false);

      // Second show + dismiss cycle (should NOT be blocked by stale exitTimeout)
      panel.show({ headline: 'Second!', connections: [] });
      expect(panel.isVisible()).toBe(true);
      const btn2 = container.querySelector('.da-connection-panel__continue') as HTMLElement;
      btn2.click();
      vi.advanceTimersByTime(300);
      expect(panel.isVisible()).toBe(false);

      vi.useRealTimers();
    });
  });
});
