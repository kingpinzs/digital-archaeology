// src/examples/ExampleBrowser.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ExampleBrowser } from './ExampleBrowser';
import type { ExampleProgram, ExampleBrowserCallbacks } from './types';
import { CATEGORY_LABELS } from './types';

describe('ExampleBrowser', () => {
  let container: HTMLElement;
  let callbacks: ExampleBrowserCallbacks;
  let browser: ExampleBrowser;
  let selectedProgram: ExampleProgram | null;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    selectedProgram = null;
    callbacks = {
      onSelect: vi.fn((program: ExampleProgram) => {
        selectedProgram = program;
      }),
      onClose: vi.fn(),
    };

    browser = new ExampleBrowser(callbacks);
  });

  afterEach(() => {
    browser.destroy();
    container.remove();
  });

  describe('render', () => {
    it('should create a menu element with proper ARIA attributes', () => {
      const element = browser.render();

      expect(element.getAttribute('role')).toBe('menu');
      expect(element.getAttribute('aria-label')).toBe('Example programs');
      expect(element.classList.contains('da-example-browser')).toBe(true);
      expect(element.classList.contains('da-menu-dropdown')).toBe(true);
    });

    it('should render category headers for non-empty categories', () => {
      const element = browser.render();
      const headers = element.querySelectorAll('.da-example-category-header');

      // Should have headers for categories with programs
      expect(headers.length).toBeGreaterThan(0);

      // Check that headers have correct text
      const headerTexts = Array.from(headers).map((h) => h.textContent?.trim());
      expect(headerTexts).toContain(CATEGORY_LABELS.arithmetic);
      expect(headerTexts).toContain(CATEGORY_LABELS.algorithms);
    });

    it('should render program items with proper attributes', () => {
      const element = browser.render();
      const items = element.querySelectorAll('.da-example-item');

      expect(items.length).toBe(12); // All 12 example programs

      // Check first item
      const firstItem = items[0] as HTMLElement;
      expect(firstItem.getAttribute('role')).toBe('menuitem');
      expect(firstItem.dataset.filename).toBeTruthy();
      expect(firstItem.getAttribute('title')).toBeTruthy();
    });

    it('should render programs with their names', () => {
      const element = browser.render();
      const items = element.querySelectorAll('.da-example-item');

      const names = Array.from(items).map((item) =>
        item.querySelector('.da-menu-item-label')?.textContent?.trim()
      );

      expect(names).toContain('Add Two Numbers');
      expect(names).toContain('Fibonacci');
      expect(names).toContain('Bubble Sort');
    });
  });

  describe('mount', () => {
    it('should append element to container', () => {
      browser.mount(container);

      expect(container.querySelector('.da-example-browser')).not.toBeNull();
    });

    it('should focus first item on mount', () => {
      browser.mount(container);

      const firstItem = container.querySelector('.da-example-item');
      expect(document.activeElement).toBe(firstItem);
    });
  });

  describe('keyboard navigation', () => {
    beforeEach(() => {
      browser.mount(container);
    });

    it('should move focus down on ArrowDown', () => {
      const items = container.querySelectorAll<HTMLElement>('.da-example-item');

      const event = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
      });
      document.dispatchEvent(event);

      expect(document.activeElement).toBe(items[1]);
    });

    it('should move focus up on ArrowUp', () => {
      const items = container.querySelectorAll<HTMLElement>('.da-example-item');

      // First move down
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      expect(document.activeElement).toBe(items[1]);

      // Then move up
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      expect(document.activeElement).toBe(items[0]);
    });

    it('should wrap from last to first on ArrowDown', () => {
      const items = container.querySelectorAll<HTMLElement>('.da-example-item');
      const lastIndex = items.length - 1;

      // Navigate to last item
      for (let i = 0; i < lastIndex; i++) {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      }
      expect(document.activeElement).toBe(items[lastIndex]);

      // One more should wrap to first
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      expect(document.activeElement).toBe(items[0]);
    });

    it('should wrap from first to last on ArrowUp', () => {
      const items = container.querySelectorAll<HTMLElement>('.da-example-item');

      // ArrowUp from first should go to last
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      expect(document.activeElement).toBe(items[items.length - 1]);
    });

    it('should jump to first on Home', () => {
      const items = container.querySelectorAll<HTMLElement>('.da-example-item');

      // Navigate away from first
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));

      // Home should go back to first
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      expect(document.activeElement).toBe(items[0]);
    });

    it('should jump to last on End', () => {
      const items = container.querySelectorAll<HTMLElement>('.da-example-item');

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      expect(document.activeElement).toBe(items[items.length - 1]);
    });

    it('should select item on Enter', () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

      expect(callbacks.onSelect).toHaveBeenCalled();
      expect(selectedProgram).not.toBeNull();
    });

    it('should select item on Space', () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));

      expect(callbacks.onSelect).toHaveBeenCalled();
      expect(selectedProgram).not.toBeNull();
    });

    it('should close on Escape', () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

      expect(callbacks.onClose).toHaveBeenCalled();
    });
  });

  describe('program selection', () => {
    beforeEach(() => {
      browser.mount(container);
    });

    it('should call onSelect with correct program when item is clicked', () => {
      const items = container.querySelectorAll<HTMLElement>('.da-example-item');
      const addItem = Array.from(items).find(
        (item) => item.dataset.filename === 'add.asm'
      );

      addItem?.click();

      expect(callbacks.onSelect).toHaveBeenCalledTimes(1);
      expect(selectedProgram?.filename).toBe('add.asm');
      expect(selectedProgram?.name).toBe('Add Two Numbers');
    });

    it('should call onSelect with correct program on keyboard select', () => {
      // Navigate to second item (multiply.asm in arithmetic category)
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));

      // Select it
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

      expect(callbacks.onSelect).toHaveBeenCalledTimes(1);
      expect(selectedProgram).not.toBeNull();
    });
  });

  describe('getPrograms', () => {
    it('should return all programs in category order', () => {
      const programs = browser.getPrograms();

      expect(programs.length).toBe(12);

      // First should be from arithmetic
      expect(programs[0].category).toBe('arithmetic');

      // Last should be from reference
      expect(programs[programs.length - 1].category).toBe('reference');
    });
  });

  describe('destroy', () => {
    it('should remove element from DOM', () => {
      browser.mount(container);
      expect(container.querySelector('.da-example-browser')).not.toBeNull();

      browser.destroy();
      expect(container.querySelector('.da-example-browser')).toBeNull();
    });

    it('should stop listening to keyboard events', () => {
      browser.mount(container);
      browser.destroy();

      // This should not call onClose since browser is destroyed
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

      expect(callbacks.onClose).not.toHaveBeenCalled();
    });
  });

  describe('isVisible', () => {
    it('should return false before mount', () => {
      expect(browser.isVisible()).toBe(false);
    });

    it('should return true after mount', () => {
      browser.mount(container);
      expect(browser.isVisible()).toBe(true);
    });

    it('should return false after destroy', () => {
      browser.mount(container);
      browser.destroy();
      expect(browser.isVisible()).toBe(false);
    });
  });

  describe('document click close behavior', () => {
    beforeEach(() => {
      browser.mount(container);
    });

    it('should close when clicking outside the browser', async () => {
      // Create an external element
      const external = document.createElement('div');
      document.body.appendChild(external);

      // Wait for setTimeout in attachEventListeners
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Click external element
      external.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(callbacks.onClose).toHaveBeenCalled();

      external.remove();
    });

    it('should NOT close when clicking inside the browser', async () => {
      // Wait for setTimeout in attachEventListeners
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Click inside the browser
      const browserElement = container.querySelector('.da-example-browser');
      browserElement?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(callbacks.onClose).not.toHaveBeenCalled();
    });
  });

  describe('focus management', () => {
    it('should restore focus to previous element on destroy', () => {
      // Create and focus a trigger button
      const trigger = document.createElement('button');
      trigger.textContent = 'Examples';
      document.body.appendChild(trigger);
      trigger.focus();
      expect(document.activeElement).toBe(trigger);

      // Mount browser (saves focus)
      browser.mount(container);

      // Focus moves to first item
      const firstItem = container.querySelector('.da-example-item');
      expect(document.activeElement).toBe(firstItem);

      // Destroy browser
      browser.destroy();

      // Focus should return to trigger
      expect(document.activeElement).toBe(trigger);

      trigger.remove();
    });

    it('should not crash if previous element is removed from DOM', () => {
      // Create and focus a trigger button
      const trigger = document.createElement('button');
      document.body.appendChild(trigger);
      trigger.focus();

      // Mount browser
      browser.mount(container);

      // Remove trigger from DOM
      trigger.remove();

      // Destroy browser - should not crash
      expect(() => browser.destroy()).not.toThrow();
    });
  });
});
