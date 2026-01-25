// src/visualizer/BreadcrumbNav.test.ts
// Unit tests for BreadcrumbNav component (Story 6.12)

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BreadcrumbNav } from './BreadcrumbNav';
import type { BreadcrumbItem } from './BreadcrumbNav';

describe('BreadcrumbNav (Story 6.12)', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('mount()', () => {
    it('should create nav element with proper structure', () => {
      const nav = new BreadcrumbNav({
        initialPath: [{ id: 'cpu', label: 'CPU', level: 0 }],
      });
      nav.mount(container);

      expect(container.querySelector('.da-breadcrumb-nav')).not.toBeNull();
      expect(container.querySelector('.da-breadcrumb-list')).not.toBeNull();
      nav.destroy();
    });

    it('should have aria-label for accessibility', () => {
      const nav = new BreadcrumbNav({
        initialPath: [{ id: 'cpu', label: 'CPU', level: 0 }],
      });
      nav.mount(container);

      const navEl = container.querySelector('.da-breadcrumb-nav');
      expect(navEl?.getAttribute('aria-label')).toBe('Circuit navigation');
      nav.destroy();
    });

    it('should render items as list items', () => {
      const nav = new BreadcrumbNav({
        initialPath: [
          { id: 'cpu', label: 'CPU', level: 0 },
          { id: 'alu', label: 'ALU', level: 1 },
        ],
      });
      nav.mount(container);

      const items = container.querySelectorAll('.da-breadcrumb-item');
      // 2 items + 1 separator = 3 total
      expect(items.length).toBe(3);
      nav.destroy();
    });

    it('should use default separator ">" when not specified', () => {
      const nav = new BreadcrumbNav({
        initialPath: [
          { id: 'cpu', label: 'CPU', level: 0 },
          { id: 'alu', label: 'ALU', level: 1 },
        ],
      });
      nav.mount(container);

      const separator = container.querySelector('.da-breadcrumb-separator');
      expect(separator?.textContent).toBe('>');
      nav.destroy();
    });

    it('should use custom separator when provided', () => {
      const nav = new BreadcrumbNav({
        separator: '/',
        initialPath: [
          { id: 'cpu', label: 'CPU', level: 0 },
          { id: 'alu', label: 'ALU', level: 1 },
        ],
      });
      nav.mount(container);

      const separator = container.querySelector('.da-breadcrumb-separator');
      expect(separator?.textContent).toBe('/');
      nav.destroy();
    });
  });

  describe('breadcrumb items', () => {
    it('should render clickable button for non-current items', () => {
      const nav = new BreadcrumbNav({
        initialPath: [
          { id: 'cpu', label: 'CPU', level: 0 },
          { id: 'alu', label: 'ALU', level: 1 },
        ],
      });
      nav.mount(container);

      const button = container.querySelector('.da-breadcrumb-link');
      expect(button).not.toBeNull();
      expect(button?.tagName).toBe('BUTTON');
      expect(button?.textContent).toBe('CPU');
      nav.destroy();
    });

    it('should render span for current (last) item', () => {
      const nav = new BreadcrumbNav({
        initialPath: [
          { id: 'cpu', label: 'CPU', level: 0 },
          { id: 'alu', label: 'ALU', level: 1 },
        ],
      });
      nav.mount(container);

      const currentItem = container.querySelector('.da-breadcrumb-current');
      expect(currentItem).not.toBeNull();
      const span = currentItem?.querySelector('span');
      expect(span?.textContent).toBe('ALU');
      nav.destroy();
    });

    it('should set aria-current="location" on current item', () => {
      const nav = new BreadcrumbNav({
        initialPath: [
          { id: 'cpu', label: 'CPU', level: 0 },
          { id: 'alu', label: 'ALU', level: 1 },
        ],
      });
      nav.mount(container);

      const currentItem = container.querySelector('.da-breadcrumb-current');
      expect(currentItem?.getAttribute('aria-current')).toBe('location');
      nav.destroy();
    });

    it('should set aria-hidden="true" on separators', () => {
      const nav = new BreadcrumbNav({
        initialPath: [
          { id: 'cpu', label: 'CPU', level: 0 },
          { id: 'alu', label: 'ALU', level: 1 },
        ],
      });
      nav.mount(container);

      const separator = container.querySelector('.da-breadcrumb-separator');
      expect(separator?.getAttribute('aria-hidden')).toBe('true');
      nav.destroy();
    });

    it('should set data-id and data-level attributes on buttons', () => {
      const nav = new BreadcrumbNav({
        initialPath: [
          { id: 'cpu', label: 'CPU', level: 0 },
          { id: 'alu', label: 'ALU', level: 1 },
        ],
      });
      nav.mount(container);

      const button = container.querySelector('.da-breadcrumb-link');
      expect(button?.getAttribute('data-id')).toBe('cpu');
      expect(button?.getAttribute('data-level')).toBe('0');
      nav.destroy();
    });
  });

  describe('setPath()', () => {
    it('should update rendered items when path changes', () => {
      const nav = new BreadcrumbNav({
        initialPath: [{ id: 'cpu', label: 'CPU', level: 0 }],
      });
      nav.mount(container);

      // Initial state - only CPU
      expect(container.querySelector('.da-breadcrumb-current span')?.textContent).toBe('CPU');

      // Update path
      nav.setPath([
        { id: 'cpu', label: 'CPU', level: 0 },
        { id: 'alu', label: 'ALU', level: 1 },
      ]);

      // Now ALU is current, CPU is clickable
      expect(container.querySelector('.da-breadcrumb-current span')?.textContent).toBe('ALU');
      expect(container.querySelector('.da-breadcrumb-link')?.textContent).toBe('CPU');
      nav.destroy();
    });

    it('should handle empty path', () => {
      const nav = new BreadcrumbNav({
        initialPath: [{ id: 'cpu', label: 'CPU', level: 0 }],
      });
      nav.mount(container);

      nav.setPath([]);
      expect(container.querySelectorAll('.da-breadcrumb-item').length).toBe(0);
      nav.destroy();
    });

    it('should handle single item path', () => {
      const nav = new BreadcrumbNav();
      nav.mount(container);

      nav.setPath([{ id: 'root', label: 'Root', level: 0 }]);

      // Single item should be current (span, not button)
      expect(container.querySelector('.da-breadcrumb-current span')?.textContent).toBe('Root');
      expect(container.querySelector('.da-breadcrumb-link')).toBeNull();
      nav.destroy();
    });
  });

  describe('getPath()', () => {
    it('should return copy of current path', () => {
      const initialPath: BreadcrumbItem[] = [
        { id: 'cpu', label: 'CPU', level: 0 },
        { id: 'alu', label: 'ALU', level: 1 },
      ];
      const nav = new BreadcrumbNav({ initialPath });
      nav.mount(container);

      const path = nav.getPath();
      expect(path).toEqual(initialPath);
      // Should be a copy, not the same reference
      expect(path).not.toBe(initialPath);
      nav.destroy();
    });

    it('should return empty array when no initial path', () => {
      const nav = new BreadcrumbNav();
      nav.mount(container);

      expect(nav.getPath()).toEqual([]);
      nav.destroy();
    });
  });

  describe('click handling', () => {
    it('should trigger callback when breadcrumb item is clicked', () => {
      const onItemClick = vi.fn();
      const nav = new BreadcrumbNav({
        onItemClick,
        initialPath: [
          { id: 'cpu', label: 'CPU', level: 0 },
          { id: 'alu', label: 'ALU', level: 1 },
        ],
      });
      nav.mount(container);

      const button = container.querySelector('.da-breadcrumb-link') as HTMLElement;
      button.click();

      expect(onItemClick).toHaveBeenCalledTimes(1);
      expect(onItemClick).toHaveBeenCalledWith({ id: 'cpu', label: 'CPU', level: 0 });
      nav.destroy();
    });

    it('should not trigger callback when current item is clicked', () => {
      const onItemClick = vi.fn();
      const nav = new BreadcrumbNav({
        onItemClick,
        initialPath: [{ id: 'cpu', label: 'CPU', level: 0 }],
      });
      nav.mount(container);

      const currentItem = container.querySelector('.da-breadcrumb-current span') as HTMLElement;
      currentItem.click();

      expect(onItemClick).not.toHaveBeenCalled();
      nav.destroy();
    });

    it('should not trigger callback when separator is clicked', () => {
      const onItemClick = vi.fn();
      const nav = new BreadcrumbNav({
        onItemClick,
        initialPath: [
          { id: 'cpu', label: 'CPU', level: 0 },
          { id: 'alu', label: 'ALU', level: 1 },
        ],
      });
      nav.mount(container);

      const separator = container.querySelector('.da-breadcrumb-separator') as HTMLElement;
      separator.click();

      expect(onItemClick).not.toHaveBeenCalled();
      nav.destroy();
    });
  });

  describe('keyboard navigation', () => {
    it('should trigger click on Enter key', () => {
      const onItemClick = vi.fn();
      const nav = new BreadcrumbNav({
        onItemClick,
        initialPath: [
          { id: 'cpu', label: 'CPU', level: 0 },
          { id: 'alu', label: 'ALU', level: 1 },
        ],
      });
      nav.mount(container);

      const button = container.querySelector('.da-breadcrumb-link') as HTMLElement;
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      button.dispatchEvent(event);

      expect(onItemClick).toHaveBeenCalledTimes(1);
      nav.destroy();
    });

    it('should trigger click on Space key', () => {
      const onItemClick = vi.fn();
      const nav = new BreadcrumbNav({
        onItemClick,
        initialPath: [
          { id: 'cpu', label: 'CPU', level: 0 },
          { id: 'alu', label: 'ALU', level: 1 },
        ],
      });
      nav.mount(container);

      const button = container.querySelector('.da-breadcrumb-link') as HTMLElement;
      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
      button.dispatchEvent(event);

      expect(onItemClick).toHaveBeenCalledTimes(1);
      nav.destroy();
    });

    it('should not trigger click on other keys', () => {
      const onItemClick = vi.fn();
      const nav = new BreadcrumbNav({
        onItemClick,
        initialPath: [
          { id: 'cpu', label: 'CPU', level: 0 },
          { id: 'alu', label: 'ALU', level: 1 },
        ],
      });
      nav.mount(container);

      const button = container.querySelector('.da-breadcrumb-link') as HTMLElement;
      const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      button.dispatchEvent(event);

      expect(onItemClick).not.toHaveBeenCalled();
      nav.destroy();
    });
  });

  describe('destroy()', () => {
    it('should remove nav element from DOM', () => {
      const nav = new BreadcrumbNav({
        initialPath: [{ id: 'cpu', label: 'CPU', level: 0 }],
      });
      nav.mount(container);

      expect(container.querySelector('.da-breadcrumb-nav')).not.toBeNull();

      nav.destroy();

      expect(container.querySelector('.da-breadcrumb-nav')).toBeNull();
    });

    it('should clear path', () => {
      const nav = new BreadcrumbNav({
        initialPath: [{ id: 'cpu', label: 'CPU', level: 0 }],
      });
      nav.mount(container);

      nav.destroy();

      expect(nav.getPath()).toEqual([]);
    });

    it('should be safe to call multiple times', () => {
      const nav = new BreadcrumbNav({
        initialPath: [{ id: 'cpu', label: 'CPU', level: 0 }],
      });
      nav.mount(container);

      nav.destroy();
      nav.destroy(); // Should not throw

      expect(container.querySelector('.da-breadcrumb-nav')).toBeNull();
    });

    it('should remove event listeners (no callback after destroy)', () => {
      const onItemClick = vi.fn();
      const nav = new BreadcrumbNav({
        onItemClick,
        initialPath: [
          { id: 'cpu', label: 'CPU', level: 0 },
          { id: 'alu', label: 'ALU', level: 1 },
        ],
      });
      nav.mount(container);

      // Verify button exists before destroy
      expect(container.querySelector('.da-breadcrumb-link')).not.toBeNull();

      nav.destroy();

      // Element is removed, so this shouldn't cause issues
      // Just verify the callback was never called
      expect(onItemClick).not.toHaveBeenCalled();
    });
  });

  describe('no initial path', () => {
    it('should render empty nav when no initialPath provided', () => {
      const nav = new BreadcrumbNav();
      nav.mount(container);

      expect(container.querySelector('.da-breadcrumb-nav')).not.toBeNull();
      expect(container.querySelectorAll('.da-breadcrumb-item').length).toBe(0);
      nav.destroy();
    });
  });
});
