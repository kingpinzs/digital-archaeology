// src/debugger/FlagsView.test.ts
// Unit tests for FlagsView component (Story 5.4)

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FlagsView } from './FlagsView';

describe('FlagsView', () => {
  let container: HTMLDivElement;
  let flagsView: FlagsView;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    flagsView = new FlagsView();
  });

  afterEach(() => {
    flagsView.destroy();
    document.body.removeChild(container);
  });

  describe('mount', () => {
    it('should render flags section with title', () => {
      flagsView.mount(container);
      expect(container.querySelector('.da-flags-view')).not.toBeNull();
      expect(container.querySelector('.da-flags-view__title')?.textContent).toBe('Flags');
    });

    it('should render Zero flag row with correct structure', () => {
      flagsView.mount(container);
      const zeroRow = container.querySelector('[data-flag="zero"]');
      expect(zeroRow).not.toBeNull();
      expect(zeroRow?.querySelector('.da-flag-label')).not.toBeNull();
      expect(zeroRow?.querySelector('.da-flag-value')).not.toBeNull();
      expect(zeroRow?.querySelector('.da-flag-status')).not.toBeNull();
    });

    it('should display Z label for Zero flag', () => {
      flagsView.mount(container);
      const label = container.querySelector('[data-flag="zero"] .da-flag-label');
      expect(label?.textContent).toBe('Z');
    });

    it('should have aria-live="polite" on value element', () => {
      flagsView.mount(container);
      const value = container.querySelector('[data-flag="zero"] .da-flag-value');
      expect(value?.getAttribute('aria-live')).toBe('polite');
    });
  });

  describe('initial state', () => {
    it('should display 0 with "clear" label when zeroFlag is false', () => {
      flagsView.mount(container);
      const value = container.querySelector('[data-flag="zero"] .da-flag-value');
      const status = container.querySelector('[data-flag="zero"] .da-flag-status');
      expect(value?.textContent).toBe('0');
      expect(status?.textContent).toBe('clear');
    });

    it('should NOT have da-flag-set class when flag is clear', () => {
      flagsView.mount(container);
      const row = container.querySelector('[data-flag="zero"]');
      expect(row?.classList.contains('da-flag-set')).toBe(false);
    });
  });

  describe('updateState', () => {
    it('should display 1 with "SET" label when zeroFlag is true', () => {
      flagsView.mount(container);
      flagsView.updateState({ zeroFlag: true });
      const value = container.querySelector('[data-flag="zero"] .da-flag-value');
      const status = container.querySelector('[data-flag="zero"] .da-flag-status');
      expect(value?.textContent).toBe('1');
      expect(status?.textContent).toBe('SET');
    });

    it('should add da-flag-set class when flag is SET', () => {
      flagsView.mount(container);
      flagsView.updateState({ zeroFlag: true });
      const row = container.querySelector('[data-flag="zero"]');
      expect(row?.classList.contains('da-flag-set')).toBe(true);
    });

    it('should remove da-flag-set class when flag is cleared', () => {
      flagsView.mount(container);
      flagsView.updateState({ zeroFlag: true });
      flagsView.updateState({ zeroFlag: false });
      const row = container.querySelector('[data-flag="zero"]');
      expect(row?.classList.contains('da-flag-set')).toBe(false);
    });

    it('should update display from clear to SET', () => {
      flagsView.mount(container);
      flagsView.updateState({ zeroFlag: false });

      // Now update to SET
      flagsView.updateState({ zeroFlag: true });

      const value = container.querySelector('[data-flag="zero"] .da-flag-value');
      const status = container.querySelector('[data-flag="zero"] .da-flag-status');
      expect(value?.textContent).toBe('1');
      expect(status?.textContent).toBe('SET');
    });

    it('should coerce truthy values to boolean', () => {
      flagsView.mount(container);
      // @ts-expect-error Testing coercion of non-boolean value
      flagsView.updateState({ zeroFlag: 1 });
      const value = container.querySelector('[data-flag="zero"] .da-flag-value');
      expect(value?.textContent).toBe('1');
    });

    it('should coerce falsy values to boolean', () => {
      flagsView.mount(container);
      flagsView.updateState({ zeroFlag: true });
      // @ts-expect-error Testing coercion of non-boolean value
      flagsView.updateState({ zeroFlag: 0 });
      const value = container.querySelector('[data-flag="zero"] .da-flag-value');
      expect(value?.textContent).toBe('0');
    });
  });

  describe('change detection', () => {
    it('should NOT have da-flag-changed class on initial render', () => {
      flagsView.mount(container);
      const row = container.querySelector('[data-flag="zero"]');
      expect(row?.classList.contains('da-flag-changed')).toBe(false);
    });

    it('should NOT have da-flag-changed class on first updateState', () => {
      flagsView.mount(container);
      flagsView.updateState({ zeroFlag: true });
      const row = container.querySelector('[data-flag="zero"]');
      expect(row?.classList.contains('da-flag-changed')).toBe(false);
    });

    it('should add da-flag-changed class when value changes after first update', () => {
      flagsView.mount(container);
      flagsView.updateState({ zeroFlag: false }); // First update (establishes previous state)
      flagsView.updateState({ zeroFlag: true }); // Second update (change detected)
      const row = container.querySelector('[data-flag="zero"]');
      expect(row?.classList.contains('da-flag-changed')).toBe(true);
    });

    it('should NOT add da-flag-changed class when value stays the same', () => {
      flagsView.mount(container);
      flagsView.updateState({ zeroFlag: true }); // First update
      flagsView.updateState({ zeroFlag: true }); // Same value
      const row = container.querySelector('[data-flag="zero"]');
      expect(row?.classList.contains('da-flag-changed')).toBe(false);
    });

    it('should remove da-flag-changed class after animation ends', () => {
      flagsView.mount(container);
      flagsView.updateState({ zeroFlag: false });
      flagsView.updateState({ zeroFlag: true });

      const row = container.querySelector('[data-flag="zero"]') as HTMLElement;
      expect(row.classList.contains('da-flag-changed')).toBe(true);

      // Simulate animation end event (use Event instead of AnimationEvent for JSDOM compatibility)
      const event = new Event('animationend', { bubbles: true });
      row.dispatchEvent(event);

      expect(row.classList.contains('da-flag-changed')).toBe(false);
    });

    it('should preserve da-flag-set class after animation ends', () => {
      flagsView.mount(container);
      flagsView.updateState({ zeroFlag: false });
      flagsView.updateState({ zeroFlag: true });

      const row = container.querySelector('[data-flag="zero"]') as HTMLElement;

      // Simulate animation end event (use Event instead of AnimationEvent for JSDOM compatibility)
      const event = new Event('animationend', { bubbles: true });
      row.dispatchEvent(event);

      // da-flag-set should remain
      expect(row.classList.contains('da-flag-set')).toBe(true);
    });
  });

  describe('destroy', () => {
    it('should remove component from DOM', () => {
      flagsView.mount(container);
      expect(container.querySelector('.da-flags-view')).not.toBeNull();

      flagsView.destroy();
      expect(container.querySelector('.da-flags-view')).toBeNull();
    });

    it('should not throw when destroyed twice', () => {
      flagsView.mount(container);
      flagsView.destroy();
      expect(() => flagsView.destroy()).not.toThrow();
    });

    it('should not throw when destroyed without mounting', () => {
      const newFlagsView = new FlagsView();
      expect(() => newFlagsView.destroy()).not.toThrow();
    });

    it('should remove animationend event listener on destroy', () => {
      flagsView.mount(container);

      // Get the element before destroy
      const element = container.querySelector('.da-flags-view') as HTMLElement;
      const removeEventListenerSpy = vi.spyOn(element, 'removeEventListener');

      flagsView.destroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'animationend',
        expect.any(Function)
      );
    });
  });

  describe('multiple updates', () => {
    it('should handle rapid state changes correctly', () => {
      flagsView.mount(container);

      // Rapid toggle sequence
      flagsView.updateState({ zeroFlag: false });
      flagsView.updateState({ zeroFlag: true });
      flagsView.updateState({ zeroFlag: false });
      flagsView.updateState({ zeroFlag: true });

      const value = container.querySelector('[data-flag="zero"] .da-flag-value');
      const row = container.querySelector('[data-flag="zero"]');
      expect(value?.textContent).toBe('1');
      expect(row?.classList.contains('da-flag-set')).toBe(true);
    });
  });
});
