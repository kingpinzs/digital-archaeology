/**
 * BreakpointsView Tests (Story 5.8)
 *
 * Tests for the BreakpointsView component that displays
 * and manages active breakpoints in the State Panel.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BreakpointsView } from './BreakpointsView';

describe('BreakpointsView (Story 5.8)', () => {
  let container: HTMLDivElement;
  let view: BreakpointsView;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    view?.destroy();
    document.body.removeChild(container);
  });

  describe('mount()', () => {
    it('should mount to container', () => {
      view = new BreakpointsView();
      view.mount(container);

      expect(container.querySelector('.da-breakpoints-view')).not.toBeNull();
    });

    it('should render title', () => {
      view = new BreakpointsView();
      view.mount(container);

      const title = container.querySelector('.da-breakpoints-view__title');
      expect(title?.textContent).toBe('Breakpoints');
    });

    it('should have ARIA region role', () => {
      view = new BreakpointsView();
      view.mount(container);

      const element = container.querySelector('.da-breakpoints-view');
      expect(element?.getAttribute('role')).toBe('region');
      expect(element?.getAttribute('aria-label')).toBe('Breakpoints');
    });

    it('should show empty message when no breakpoints', () => {
      view = new BreakpointsView();
      view.mount(container);

      const emptyMsg = container.querySelector('.da-breakpoints-view__empty');
      expect(emptyMsg?.textContent).toBe('No breakpoints set');
    });
  });

  describe('updateState()', () => {
    it('should render breakpoint list', () => {
      view = new BreakpointsView();
      view.mount(container);

      view.updateState({
        breakpoints: [
          { address: 0x10, line: 5 },
          { address: 0x20, line: 10 },
        ],
      });

      const items = container.querySelectorAll('.da-breakpoints-view__item');
      expect(items.length).toBe(2);
    });

    it('should display address in hex format', () => {
      view = new BreakpointsView();
      view.mount(container);

      view.updateState({
        breakpoints: [{ address: 0x0a, line: 3 }],
      });

      const address = container.querySelector('.da-breakpoints-view__address');
      expect(address?.textContent).toBe('0x0A');
    });

    it('should display line number', () => {
      view = new BreakpointsView();
      view.mount(container);

      view.updateState({
        breakpoints: [{ address: 0x10, line: 7 }],
      });

      const line = container.querySelector('.da-breakpoints-view__line');
      expect(line?.textContent).toBe('Line 7');
    });

    it('should render remove button for each breakpoint', () => {
      view = new BreakpointsView();
      view.mount(container);

      view.updateState({
        breakpoints: [
          { address: 0x10, line: 5 },
          { address: 0x20, line: 10 },
        ],
      });

      const removeButtons = container.querySelectorAll('.da-breakpoints-view__remove');
      expect(removeButtons.length).toBe(2);
    });

    it('should set data-address attribute on remove button', () => {
      view = new BreakpointsView();
      view.mount(container);

      view.updateState({
        breakpoints: [{ address: 42, line: 5 }],
      });

      const removeButton = container.querySelector('.da-breakpoints-view__remove');
      expect(removeButton?.getAttribute('data-address')).toBe('42');
    });

    it('should hide empty message when breakpoints exist', () => {
      view = new BreakpointsView();
      view.mount(container);

      view.updateState({
        breakpoints: [{ address: 0x10, line: 5 }],
      });

      const emptyMsg = container.querySelector('.da-breakpoints-view__empty');
      expect(emptyMsg).toBeNull();
    });

    it('should show empty message when breakpoints cleared', () => {
      view = new BreakpointsView();
      view.mount(container);

      view.updateState({
        breakpoints: [{ address: 0x10, line: 5 }],
      });
      view.updateState({ breakpoints: [] });

      const emptyMsg = container.querySelector('.da-breakpoints-view__empty');
      expect(emptyMsg?.textContent).toBe('No breakpoints set');
    });
  });

  describe('onRemoveBreakpoint callback', () => {
    it('should call callback when remove button clicked', () => {
      const onRemove = vi.fn();
      view = new BreakpointsView({ onRemoveBreakpoint: onRemove });
      view.mount(container);

      view.updateState({
        breakpoints: [{ address: 0x10, line: 5 }],
      });

      const removeButton = container.querySelector('.da-breakpoints-view__remove');
      removeButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(onRemove).toHaveBeenCalledWith(0x10);
    });

    it('should call callback with correct address for multiple breakpoints', () => {
      const onRemove = vi.fn();
      view = new BreakpointsView({ onRemoveBreakpoint: onRemove });
      view.mount(container);

      view.updateState({
        breakpoints: [
          { address: 0x10, line: 5 },
          { address: 0x20, line: 10 },
        ],
      });

      const removeButtons = container.querySelectorAll('.da-breakpoints-view__remove');
      // Click second button
      removeButtons[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(onRemove).toHaveBeenCalledWith(0x20);
    });

    it('should not call callback when clicking non-remove element', () => {
      const onRemove = vi.fn();
      view = new BreakpointsView({ onRemoveBreakpoint: onRemove });
      view.mount(container);

      view.updateState({
        breakpoints: [{ address: 0x10, line: 5 }],
      });

      const address = container.querySelector('.da-breakpoints-view__address');
      address?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(onRemove).not.toHaveBeenCalled();
    });

    it('should not throw when no callback provided', () => {
      view = new BreakpointsView();
      view.mount(container);

      view.updateState({
        breakpoints: [{ address: 0x10, line: 5 }],
      });

      const removeButton = container.querySelector('.da-breakpoints-view__remove');
      expect(() => {
        removeButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }).not.toThrow();
    });
  });

  describe('destroy()', () => {
    it('should remove element from DOM', () => {
      view = new BreakpointsView();
      view.mount(container);

      view.destroy();

      expect(container.querySelector('.da-breakpoints-view')).toBeNull();
    });

    it('should handle multiple destroy calls gracefully', () => {
      view = new BreakpointsView();
      view.mount(container);

      expect(() => {
        view.destroy();
        view.destroy();
      }).not.toThrow();
    });

    it('should handle destroy without mount gracefully', () => {
      view = new BreakpointsView();

      expect(() => view.destroy()).not.toThrow();
    });
  });

  describe('accessibility', () => {
    it('should have aria-label on remove buttons', () => {
      view = new BreakpointsView();
      view.mount(container);

      view.updateState({
        breakpoints: [{ address: 0x10, line: 5 }],
      });

      const removeButton = container.querySelector('.da-breakpoints-view__remove');
      expect(removeButton?.getAttribute('aria-label')).toBe('Remove breakpoint at address 0x10');
    });

    it('should use list role for breakpoint list', () => {
      view = new BreakpointsView();
      view.mount(container);

      view.updateState({
        breakpoints: [{ address: 0x10, line: 5 }],
      });

      const list = container.querySelector('.da-breakpoints-view__list');
      expect(list?.getAttribute('role')).toBe('list');
    });

    it('should use listitem role for breakpoint items', () => {
      view = new BreakpointsView();
      view.mount(container);

      view.updateState({
        breakpoints: [{ address: 0x10, line: 5 }],
      });

      const item = container.querySelector('.da-breakpoints-view__item');
      expect(item?.getAttribute('role')).toBe('listitem');
    });
  });

  describe('hex formatting', () => {
    it('should pad single digit addresses', () => {
      view = new BreakpointsView();
      view.mount(container);

      view.updateState({
        breakpoints: [{ address: 0x05, line: 1 }],
      });

      const address = container.querySelector('.da-breakpoints-view__address');
      expect(address?.textContent).toBe('0x05');
    });

    it('should uppercase hex characters', () => {
      view = new BreakpointsView();
      view.mount(container);

      view.updateState({
        breakpoints: [{ address: 0xff, line: 1 }],
      });

      const address = container.querySelector('.da-breakpoints-view__address');
      expect(address?.textContent).toBe('0xFF');
    });

    it('should display 0x00 for address zero', () => {
      view = new BreakpointsView();
      view.mount(container);

      view.updateState({
        breakpoints: [{ address: 0, line: 1 }],
      });

      const address = container.querySelector('.da-breakpoints-view__address');
      expect(address?.textContent).toBe('0x00');
    });
  });
});
