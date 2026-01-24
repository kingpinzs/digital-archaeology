/**
 * RuntimeErrorPanel Tests (Story 5.10)
 *
 * Tests for the RuntimeErrorPanel component that displays
 * rich runtime error information in the State Panel.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RuntimeErrorPanel } from './RuntimeErrorPanel';
// RuntimeErrorContext is used for typing the error object in setError calls

describe('RuntimeErrorPanel (Story 5.10)', () => {
  let container: HTMLDivElement;
  let panel: RuntimeErrorPanel;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    panel?.destroy();
    document.body.removeChild(container);
  });

  describe('mount()', () => {
    it('should not render when no error is set', () => {
      panel = new RuntimeErrorPanel();
      panel.mount(container);

      expect(container.querySelector('.da-runtime-error-panel')).toBeNull();
    });

    it('should render after setting an error', () => {
      panel = new RuntimeErrorPanel();
      panel.mount(container);

      panel.setError({
        errorType: 'MEMORY_ERROR',
        pc: 0x05,
        instruction: 'STO',
        opcode: 0x6,
      });

      expect(container.querySelector('.da-runtime-error-panel')).not.toBeNull();
    });
  });

  describe('error type badge', () => {
    it('should render error type badge with correct modifier class for MEMORY_ERROR', () => {
      panel = new RuntimeErrorPanel();
      panel.mount(container);

      panel.setError({
        errorType: 'MEMORY_ERROR',
        pc: 0x05,
        instruction: 'STO',
        opcode: 0x6,
      });

      const badge = container.querySelector('.da-runtime-error-panel__type-badge');
      expect(badge?.textContent).toBe('MEMORY_ERROR');
      expect(badge?.classList.contains('da-runtime-error-panel__type-badge--error')).toBe(true);
    });

    it('should render ARITHMETIC_WARNING with warning modifier', () => {
      panel = new RuntimeErrorPanel();
      panel.mount(container);

      panel.setError({
        errorType: 'ARITHMETIC_WARNING',
        pc: 0x02,
        instruction: 'ADD',
        opcode: 0x1,
      });

      const badge = container.querySelector('.da-runtime-error-panel__type-badge');
      expect(badge?.textContent).toBe('ARITHMETIC_WARNING');
      expect(badge?.classList.contains('da-runtime-error-panel__type-badge--warning')).toBe(true);
    });

    it('should render INVALID_OPCODE with error modifier', () => {
      panel = new RuntimeErrorPanel();
      panel.mount(container);

      panel.setError({
        errorType: 'INVALID_OPCODE',
        pc: 0x00,
        instruction: 'UNK',
        opcode: 0xf,
      });

      const badge = container.querySelector('.da-runtime-error-panel__type-badge');
      expect(badge?.textContent).toBe('INVALID_OPCODE');
      expect(badge?.classList.contains('da-runtime-error-panel__type-badge--error')).toBe(true);
    });

    it('should render STACK_OVERFLOW with error modifier', () => {
      panel = new RuntimeErrorPanel();
      panel.mount(container);

      panel.setError({
        errorType: 'STACK_OVERFLOW',
        pc: 0x10,
        instruction: 'PUSH',
        opcode: 0x0,
      });

      const badge = container.querySelector('.da-runtime-error-panel__type-badge');
      expect(badge?.textContent).toBe('STACK_OVERFLOW');
      expect(badge?.classList.contains('da-runtime-error-panel__type-badge--error')).toBe(true);
    });

    it('should render UNKNOWN_ERROR with error modifier', () => {
      panel = new RuntimeErrorPanel();
      panel.mount(container);

      panel.setError({
        errorType: 'UNKNOWN_ERROR',
        pc: 0x00,
        instruction: 'NOP',
        opcode: 0x0,
      });

      const badge = container.querySelector('.da-runtime-error-panel__type-badge');
      expect(badge?.textContent).toBe('UNKNOWN_ERROR');
      expect(badge?.classList.contains('da-runtime-error-panel__type-badge--error')).toBe(true);
    });
  });

  describe('instruction context section', () => {
    it('should display PC in hex format', () => {
      panel = new RuntimeErrorPanel();
      panel.mount(container);

      panel.setError({
        errorType: 'MEMORY_ERROR',
        pc: 0x0a,
        instruction: 'LDA',
        opcode: 0x4,
      });

      const contextList = container.querySelector('.da-runtime-error-panel__context-list');
      expect(contextList).not.toBeNull();
      const pcValue = contextList?.querySelector('li:nth-child(1) code');
      expect(pcValue?.textContent).toBe('0x0A');
    });

    it('should display instruction mnemonic', () => {
      panel = new RuntimeErrorPanel();
      panel.mount(container);

      panel.setError({
        errorType: 'MEMORY_ERROR',
        pc: 0x05,
        instruction: 'STO',
        opcode: 0x6,
      });

      const contextList = container.querySelector('.da-runtime-error-panel__context-list');
      const instrValue = contextList?.querySelector('li:nth-child(2) code');
      expect(instrValue?.textContent).toBe('STO');
    });

    it('should display opcode in hex format', () => {
      panel = new RuntimeErrorPanel();
      panel.mount(container);

      panel.setError({
        errorType: 'INVALID_OPCODE',
        pc: 0x00,
        instruction: 'UNK',
        opcode: 0xc,
      });

      const contextList = container.querySelector('.da-runtime-error-panel__context-list');
      const opcodeValue = contextList?.querySelector('li:nth-child(3) code');
      expect(opcodeValue?.textContent).toBe('0xC');
    });

    it('should have context section title', () => {
      panel = new RuntimeErrorPanel();
      panel.mount(container);

      panel.setError({
        errorType: 'MEMORY_ERROR',
        pc: 0x05,
        instruction: 'STO',
        opcode: 0x6,
      });

      const title = container.querySelector('.da-runtime-error-panel__context-title');
      expect(title?.textContent).toBe('Instruction Context');
    });
  });

  describe('component section', () => {
    it('should display component name when provided', () => {
      panel = new RuntimeErrorPanel();
      panel.mount(container);

      panel.setError({
        errorType: 'MEMORY_ERROR',
        pc: 0x05,
        instruction: 'STO',
        opcode: 0x6,
        componentName: 'Memory Controller',
      });

      const componentName = container.querySelector('.da-runtime-error-panel__component-name');
      expect(componentName?.textContent).toBe('Memory Controller');
    });

    it('should not render component section when no component name', () => {
      panel = new RuntimeErrorPanel();
      panel.mount(container);

      panel.setError({
        errorType: 'UNKNOWN_ERROR',
        pc: 0x00,
        instruction: 'NOP',
        opcode: 0x0,
      });

      const componentSection = container.querySelector('.da-runtime-error-panel__component');
      expect(componentSection).toBeNull();
    });
  });

  describe('signal values section', () => {
    it('should display signal values when provided', () => {
      panel = new RuntimeErrorPanel();
      panel.mount(container);

      panel.setError({
        errorType: 'MEMORY_ERROR',
        pc: 0x05,
        instruction: 'STO',
        opcode: 0x6,
        signalValues: [
          { name: 'MAR', value: 0xff },
          { name: 'MDR', value: 0x42 },
        ],
      });

      const signalsList = container.querySelector('.da-runtime-error-panel__signals-list');
      expect(signalsList).not.toBeNull();
      const items = signalsList?.querySelectorAll('li');
      expect(items?.length).toBe(2);
    });

    it('should format signal values in hex', () => {
      panel = new RuntimeErrorPanel();
      panel.mount(container);

      panel.setError({
        errorType: 'MEMORY_ERROR',
        pc: 0x05,
        instruction: 'STO',
        opcode: 0x6,
        signalValues: [{ name: 'ACC', value: 0xab }],
      });

      const signalValue = container.querySelector('.da-runtime-error-panel__signal-value');
      expect(signalValue?.textContent).toBe('0xAB');
    });

    it('should show placeholder when no signal values', () => {
      panel = new RuntimeErrorPanel();
      panel.mount(container);

      panel.setError({
        errorType: 'MEMORY_ERROR',
        pc: 0x05,
        instruction: 'STO',
        opcode: 0x6,
      });

      const placeholder = container.querySelector('.da-runtime-error-panel__signals-placeholder');
      expect(placeholder?.textContent).toContain('circuit visualization');
    });
  });

  describe('action buttons', () => {
    it('should render View in Circuit button (disabled)', () => {
      panel = new RuntimeErrorPanel();
      panel.mount(container);

      panel.setError({
        errorType: 'MEMORY_ERROR',
        pc: 0x05,
        instruction: 'STO',
        opcode: 0x6,
      });

      const circuitBtn = container.querySelector('[data-action="view-in-circuit"]') as HTMLButtonElement;
      expect(circuitBtn).not.toBeNull();
      expect(circuitBtn.disabled).toBe(true);
      expect(circuitBtn.getAttribute('title')).toContain('Epic 6');
    });

    it('should render View in Code button', () => {
      panel = new RuntimeErrorPanel();
      panel.mount(container);

      panel.setError({
        errorType: 'MEMORY_ERROR',
        pc: 0x05,
        instruction: 'STO',
        opcode: 0x6,
      });

      const codeBtn = container.querySelector('[data-action="view-in-code"]');
      expect(codeBtn?.textContent).toBe('View in Code');
    });

    it('should render Reset button', () => {
      panel = new RuntimeErrorPanel();
      panel.mount(container);

      panel.setError({
        errorType: 'MEMORY_ERROR',
        pc: 0x05,
        instruction: 'STO',
        opcode: 0x6,
      });

      const resetBtn = container.querySelector('[data-action="reset"]');
      expect(resetBtn?.textContent).toBe('Reset');
    });

    it('should call onViewInCode callback when View in Code button is clicked', () => {
      const onViewInCode = vi.fn();
      panel = new RuntimeErrorPanel({ onViewInCode });
      panel.mount(container);

      panel.setError({
        errorType: 'MEMORY_ERROR',
        pc: 0x05,
        instruction: 'STO',
        opcode: 0x6,
      });

      const codeBtn = container.querySelector('[data-action="view-in-code"]') as HTMLButtonElement;
      codeBtn.click();

      expect(onViewInCode).toHaveBeenCalledTimes(1);
    });

    it('should call onReset callback when Reset button is clicked', () => {
      const onReset = vi.fn();
      panel = new RuntimeErrorPanel({ onReset });
      panel.mount(container);

      panel.setError({
        errorType: 'MEMORY_ERROR',
        pc: 0x05,
        instruction: 'STO',
        opcode: 0x6,
      });

      const resetBtn = container.querySelector('[data-action="reset"]') as HTMLButtonElement;
      resetBtn.click();

      expect(onReset).toHaveBeenCalledTimes(1);
    });

    it('should not call onViewInCircuit when disabled button is clicked', () => {
      const onViewInCircuit = vi.fn();
      panel = new RuntimeErrorPanel({ onViewInCircuit });
      panel.mount(container);

      panel.setError({
        errorType: 'MEMORY_ERROR',
        pc: 0x05,
        instruction: 'STO',
        opcode: 0x6,
      });

      const circuitBtn = container.querySelector('[data-action="view-in-circuit"]') as HTMLButtonElement;
      circuitBtn.click();

      expect(onViewInCircuit).not.toHaveBeenCalled();
    });
  });

  describe('clearError()', () => {
    it('should hide panel when clearError is called', () => {
      panel = new RuntimeErrorPanel();
      panel.mount(container);

      panel.setError({
        errorType: 'MEMORY_ERROR',
        pc: 0x05,
        instruction: 'STO',
        opcode: 0x6,
      });

      expect(container.querySelector('.da-runtime-error-panel')).not.toBeNull();

      panel.clearError();

      expect(container.querySelector('.da-runtime-error-panel')).toBeNull();
    });
  });

  describe('destroy()', () => {
    it('should clean up event listeners and remove element', () => {
      const onReset = vi.fn();
      panel = new RuntimeErrorPanel({ onReset });
      panel.mount(container);

      panel.setError({
        errorType: 'MEMORY_ERROR',
        pc: 0x05,
        instruction: 'STO',
        opcode: 0x6,
      });

      panel.destroy();

      // Element should be removed
      expect(container.querySelector('.da-runtime-error-panel')).toBeNull();

      // Re-mounting and clicking should not trigger old callback
      panel = new RuntimeErrorPanel({ onReset: vi.fn() });
      panel.mount(container);
      panel.setError({
        errorType: 'MEMORY_ERROR',
        pc: 0x05,
        instruction: 'STO',
        opcode: 0x6,
      });

      // Original callback should not be called
      expect(onReset).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have role="alert" for screen reader announcement', () => {
      panel = new RuntimeErrorPanel();
      panel.mount(container);

      panel.setError({
        errorType: 'MEMORY_ERROR',
        pc: 0x05,
        instruction: 'STO',
        opcode: 0x6,
      });

      const element = container.querySelector('.da-runtime-error-panel');
      expect(element?.getAttribute('role')).toBe('alert');
    });

    it('should have aria-live="assertive" for immediate announcement', () => {
      panel = new RuntimeErrorPanel();
      panel.mount(container);

      panel.setError({
        errorType: 'MEMORY_ERROR',
        pc: 0x05,
        instruction: 'STO',
        opcode: 0x6,
      });

      const element = container.querySelector('.da-runtime-error-panel');
      expect(element?.getAttribute('aria-live')).toBe('assertive');
    });

    it('should have aria-label with error type', () => {
      panel = new RuntimeErrorPanel();
      panel.mount(container);

      panel.setError({
        errorType: 'STACK_OVERFLOW',
        pc: 0x10,
        instruction: 'PUSH',
        opcode: 0x0,
      });

      const element = container.querySelector('.da-runtime-error-panel');
      expect(element?.getAttribute('aria-label')).toContain('STACK_OVERFLOW');
    });

    it('should support keyboard activation of buttons with Enter', () => {
      const onReset = vi.fn();
      panel = new RuntimeErrorPanel({ onReset });
      panel.mount(container);

      panel.setError({
        errorType: 'MEMORY_ERROR',
        pc: 0x05,
        instruction: 'STO',
        opcode: 0x6,
      });

      const resetBtn = container.querySelector('[data-action="reset"]') as HTMLButtonElement;
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      resetBtn.dispatchEvent(event);

      expect(onReset).toHaveBeenCalledTimes(1);
    });

    it('should support keyboard activation of buttons with Space', () => {
      const onViewInCode = vi.fn();
      panel = new RuntimeErrorPanel({ onViewInCode });
      panel.mount(container);

      panel.setError({
        errorType: 'MEMORY_ERROR',
        pc: 0x05,
        instruction: 'STO',
        opcode: 0x6,
      });

      const codeBtn = container.querySelector('[data-action="view-in-code"]') as HTMLButtonElement;
      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
      codeBtn.dispatchEvent(event);

      expect(onViewInCode).toHaveBeenCalledTimes(1);
    });
  });

  describe('error message display', () => {
    it('should display error message when provided', () => {
      panel = new RuntimeErrorPanel();
      panel.mount(container);

      panel.setError(
        {
          errorType: 'MEMORY_ERROR',
          pc: 0x05,
          instruction: 'STO',
          opcode: 0x6,
        },
        'Invalid memory address: 0xFF'
      );

      const messageEl = container.querySelector('.da-runtime-error-panel__message');
      expect(messageEl?.textContent).toBe('Invalid memory address: 0xFF');
    });

    it('should not render message element when no message provided', () => {
      panel = new RuntimeErrorPanel();
      panel.mount(container);

      panel.setError({
        errorType: 'MEMORY_ERROR',
        pc: 0x05,
        instruction: 'STO',
        opcode: 0x6,
      });

      const messageEl = container.querySelector('.da-runtime-error-panel__message');
      expect(messageEl).toBeNull();
    });
  });

  // Code Review Fix #3: Test for new currentError getter
  describe('currentError getter', () => {
    it('should return null when no error is set', () => {
      panel = new RuntimeErrorPanel();
      panel.mount(container);

      expect(panel.currentError).toBeNull();
    });

    it('should return current error context when error is set', () => {
      panel = new RuntimeErrorPanel();
      panel.mount(container);

      const errorContext = {
        errorType: 'MEMORY_ERROR' as const,
        pc: 0x05,
        instruction: 'STO',
        opcode: 0x6,
        componentName: 'Memory Controller',
      };
      panel.setError(errorContext);

      expect(panel.currentError).toEqual(errorContext);
    });

    it('should return current message when error is set', () => {
      panel = new RuntimeErrorPanel();
      panel.mount(container);

      panel.setError(
        {
          errorType: 'MEMORY_ERROR',
          pc: 0x05,
          instruction: 'STO',
          opcode: 0x6,
        },
        'Test error message'
      );

      expect(panel.currentMessage).toBe('Test error message');
    });

    it('should return null after clearError is called', () => {
      panel = new RuntimeErrorPanel();
      panel.mount(container);

      panel.setError({
        errorType: 'MEMORY_ERROR',
        pc: 0x05,
        instruction: 'STO',
        opcode: 0x6,
      });

      expect(panel.currentError).not.toBeNull();

      panel.clearError();

      expect(panel.currentError).toBeNull();
    });
  });

  describe('error replacement', () => {
    it('should replace previous error with new error', () => {
      panel = new RuntimeErrorPanel();
      panel.mount(container);

      panel.setError({
        errorType: 'MEMORY_ERROR',
        pc: 0x05,
        instruction: 'STO',
        opcode: 0x6,
      });

      let badge = container.querySelector('.da-runtime-error-panel__type-badge');
      expect(badge?.textContent).toBe('MEMORY_ERROR');

      panel.setError({
        errorType: 'ARITHMETIC_WARNING',
        pc: 0x10,
        instruction: 'ADD',
        opcode: 0x1,
      });

      badge = container.querySelector('.da-runtime-error-panel__type-badge');
      expect(badge?.textContent).toBe('ARITHMETIC_WARNING');

      // Should only have one panel
      const panels = container.querySelectorAll('.da-runtime-error-panel');
      expect(panels.length).toBe(1);
    });
  });
});
