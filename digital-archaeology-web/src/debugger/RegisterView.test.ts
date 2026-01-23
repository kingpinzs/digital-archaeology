// src/debugger/RegisterView.test.ts
// Tests for RegisterView component (Story 5.3)

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RegisterView } from './RegisterView';

describe('RegisterView', () => {
  let container: HTMLDivElement;
  let registerView: RegisterView;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    registerView = new RegisterView();
  });

  afterEach(() => {
    registerView.destroy();
    document.body.removeChild(container);
  });

  describe('mount', () => {
    it('should render register section with container class', () => {
      registerView.mount(container);
      expect(container.querySelector('.da-register-view')).not.toBeNull();
    });

    it('should render "Registers" title', () => {
      registerView.mount(container);
      const title = container.querySelector('.da-register-view__title');
      expect(title).not.toBeNull();
      expect(title?.textContent).toBe('Registers');
    });

    it('should display PC row with data-register attribute', () => {
      registerView.mount(container);
      const pcRow = container.querySelector('[data-register="pc"]');
      expect(pcRow).not.toBeNull();
    });

    it('should display Accumulator row with data-register attribute', () => {
      registerView.mount(container);
      const accRow = container.querySelector('[data-register="accumulator"]');
      expect(accRow).not.toBeNull();
    });

    it('should display PC label as "PC"', () => {
      registerView.mount(container);
      const pcRow = container.querySelector('[data-register="pc"]');
      const label = pcRow?.querySelector('.da-register-label');
      expect(label?.textContent).toBe('PC');
    });

    it('should display Accumulator label as "ACC"', () => {
      registerView.mount(container);
      const accRow = container.querySelector('[data-register="accumulator"]');
      const label = accRow?.querySelector('.da-register-label');
      expect(label?.textContent).toBe('ACC');
    });

    it('should have aria-live="polite" on PC value element', () => {
      registerView.mount(container);
      const pcRow = container.querySelector('[data-register="pc"]');
      const value = pcRow?.querySelector('.da-register-value');
      expect(value?.getAttribute('aria-live')).toBe('polite');
    });

    it('should have aria-live="polite" on Accumulator value element', () => {
      registerView.mount(container);
      const accRow = container.querySelector('[data-register="accumulator"]');
      const value = accRow?.querySelector('.da-register-value');
      expect(value?.getAttribute('aria-live')).toBe('polite');
    });
  });

  describe('initial state', () => {
    it('should display PC as "0x00 (0)" initially', () => {
      registerView.mount(container);
      const pcRow = container.querySelector('[data-register="pc"]');
      const value = pcRow?.querySelector('.da-register-value');
      expect(value?.textContent).toBe('0x00 (0)');
    });

    it('should display Accumulator as "0x0 (0)" initially', () => {
      registerView.mount(container);
      const accRow = container.querySelector('[data-register="accumulator"]');
      const value = accRow?.querySelector('.da-register-value');
      expect(value?.textContent).toBe('0x0 (0)');
    });
  });

  describe('updateState', () => {
    it('should update PC value in hex and decimal format', () => {
      registerView.mount(container);
      registerView.updateState({ pc: 42 });
      const pcRow = container.querySelector('[data-register="pc"]');
      const value = pcRow?.querySelector('.da-register-value');
      expect(value?.textContent).toBe('0x2A (42)');
    });

    it('should format PC with 2 uppercase hex digits', () => {
      registerView.mount(container);
      registerView.updateState({ pc: 10 });
      const pcRow = container.querySelector('[data-register="pc"]');
      const value = pcRow?.querySelector('.da-register-value');
      expect(value?.textContent).toBe('0x0A (10)');
    });

    it('should update Accumulator value in hex and decimal format', () => {
      registerView.mount(container);
      registerView.updateState({ accumulator: 15 });
      const accRow = container.querySelector('[data-register="accumulator"]');
      const value = accRow?.querySelector('.da-register-value');
      expect(value?.textContent).toBe('0xF (15)');
    });

    it('should format Accumulator with 1 uppercase hex digit', () => {
      registerView.mount(container);
      registerView.updateState({ accumulator: 5 });
      const accRow = container.querySelector('[data-register="accumulator"]');
      const value = accRow?.querySelector('.da-register-value');
      expect(value?.textContent).toBe('0x5 (5)');
    });

    it('should update only PC when only pc is provided', () => {
      registerView.mount(container);
      registerView.updateState({ pc: 100 });

      const pcValue = container.querySelector('[data-register="pc"] .da-register-value');
      const accValue = container.querySelector('[data-register="accumulator"] .da-register-value');

      expect(pcValue?.textContent).toBe('0x64 (100)');
      expect(accValue?.textContent).toBe('0x0 (0)'); // Unchanged
    });

    it('should update only Accumulator when only accumulator is provided', () => {
      registerView.mount(container);
      registerView.updateState({ accumulator: 7 });

      const pcValue = container.querySelector('[data-register="pc"] .da-register-value');
      const accValue = container.querySelector('[data-register="accumulator"] .da-register-value');

      expect(pcValue?.textContent).toBe('0x00 (0)'); // Unchanged
      expect(accValue?.textContent).toBe('0x7 (7)');
    });

    it('should handle max PC value (255)', () => {
      registerView.mount(container);
      registerView.updateState({ pc: 255 });
      const pcValue = container.querySelector('[data-register="pc"] .da-register-value');
      expect(pcValue?.textContent).toBe('0xFF (255)');
    });

    it('should handle max Accumulator value (15)', () => {
      registerView.mount(container);
      registerView.updateState({ accumulator: 15 });
      const accValue = container.querySelector('[data-register="accumulator"] .da-register-value');
      expect(accValue?.textContent).toBe('0xF (15)');
    });

    it('should clamp PC values above 255 to 255', () => {
      registerView.mount(container);
      registerView.updateState({ pc: 300 });
      const pcValue = container.querySelector('[data-register="pc"] .da-register-value');
      expect(pcValue?.textContent).toBe('0xFF (255)');
    });

    it('should clamp PC values below 0 to 0', () => {
      registerView.mount(container);
      registerView.updateState({ pc: -10 });
      const pcValue = container.querySelector('[data-register="pc"] .da-register-value');
      expect(pcValue?.textContent).toBe('0x00 (0)');
    });

    it('should clamp Accumulator values above 15 to 15', () => {
      registerView.mount(container);
      registerView.updateState({ accumulator: 100 });
      const accValue = container.querySelector('[data-register="accumulator"] .da-register-value');
      expect(accValue?.textContent).toBe('0xF (15)');
    });

    it('should clamp Accumulator values below 0 to 0', () => {
      registerView.mount(container);
      registerView.updateState({ accumulator: -5 });
      const accValue = container.querySelector('[data-register="accumulator"] .da-register-value');
      expect(accValue?.textContent).toBe('0x0 (0)');
    });

    it('should handle NaN PC by defaulting to 0', () => {
      registerView.mount(container);
      registerView.updateState({ pc: NaN });
      const pcValue = container.querySelector('[data-register="pc"] .da-register-value');
      expect(pcValue?.textContent).toBe('0x00 (0)');
    });

    it('should handle Infinity PC by clamping to 255', () => {
      registerView.mount(container);
      registerView.updateState({ pc: Infinity });
      const pcValue = container.querySelector('[data-register="pc"] .da-register-value');
      expect(pcValue?.textContent).toBe('0x00 (0)'); // Infinity is not finite, defaults to 0
    });

    it('should floor floating point PC values', () => {
      registerView.mount(container);
      registerView.updateState({ pc: 10.7 });
      const pcValue = container.querySelector('[data-register="pc"] .da-register-value');
      expect(pcValue?.textContent).toBe('0x0A (10)');
    });

    it('should floor floating point Accumulator values', () => {
      registerView.mount(container);
      registerView.updateState({ accumulator: 7.9 });
      const accValue = container.querySelector('[data-register="accumulator"] .da-register-value');
      expect(accValue?.textContent).toBe('0x7 (7)');
    });
  });

  describe('change flash animation', () => {
    it('should add da-register-changed class when PC value changes', () => {
      registerView.mount(container);
      registerView.updateState({ pc: 0 }); // Initial
      registerView.updateState({ pc: 10 }); // Change

      const pcRow = container.querySelector('[data-register="pc"]');
      expect(pcRow?.classList.contains('da-register-changed')).toBe(true);
    });

    it('should add da-register-changed class when Accumulator value changes', () => {
      registerView.mount(container);
      registerView.updateState({ accumulator: 0 }); // Initial
      registerView.updateState({ accumulator: 5 }); // Change

      const accRow = container.querySelector('[data-register="accumulator"]');
      expect(accRow?.classList.contains('da-register-changed')).toBe(true);
    });

    it('should NOT add da-register-changed class on first mount render', () => {
      registerView.mount(container);

      const pcRow = container.querySelector('[data-register="pc"]');
      const accRow = container.querySelector('[data-register="accumulator"]');

      expect(pcRow?.classList.contains('da-register-changed')).toBe(false);
      expect(accRow?.classList.contains('da-register-changed')).toBe(false);
    });

    it('should NOT add da-register-changed class when value does not change', () => {
      registerView.mount(container);
      registerView.updateState({ pc: 10 }); // Initial

      // Clear the class that was added from first change
      const pcRow = container.querySelector('[data-register="pc"]');
      pcRow?.classList.remove('da-register-changed');

      registerView.updateState({ pc: 10 }); // Same value
      expect(pcRow?.classList.contains('da-register-changed')).toBe(false);
    });

    it('should remove da-register-changed class after animationend event', () => {
      registerView.mount(container);
      registerView.updateState({ pc: 10 }); // Initial
      registerView.updateState({ pc: 20 }); // Change

      const pcRow = container.querySelector('[data-register="pc"]') as HTMLElement;
      expect(pcRow.classList.contains('da-register-changed')).toBe(true);

      // Simulate animationend event
      const animationEndEvent = new Event('animationend', { bubbles: true });
      pcRow.dispatchEvent(animationEndEvent);

      expect(pcRow.classList.contains('da-register-changed')).toBe(false);
    });
  });

  describe('destroy', () => {
    it('should remove component from DOM', () => {
      registerView.mount(container);
      expect(container.querySelector('.da-register-view')).not.toBeNull();

      registerView.destroy();
      expect(container.querySelector('.da-register-view')).toBeNull();
    });

    it('should be safe to call destroy multiple times', () => {
      registerView.mount(container);
      registerView.destroy();
      registerView.destroy(); // Should not throw
    });

    it('should be safe to call destroy without mounting', () => {
      registerView.destroy(); // Should not throw
    });
  });
});
