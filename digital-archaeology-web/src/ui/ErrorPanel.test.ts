// src/ui/ErrorPanel.test.ts
// Tests for ErrorPanel component - displays assembly errors with line numbers

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ErrorPanel } from './ErrorPanel';
import type { AssemblerError } from '@emulator/index';

describe('ErrorPanel', () => {
  let errorPanel: ErrorPanel;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    errorPanel?.destroy();
    container?.remove();
  });

  describe('mount/destroy lifecycle', () => {
    it('should mount to container element', () => {
      errorPanel = new ErrorPanel();
      errorPanel.mount(container);

      expect(container.querySelector('.da-error-panel')).not.toBeNull();
    });

    it('should be hidden initially when no errors', () => {
      errorPanel = new ErrorPanel();
      errorPanel.mount(container);

      const panel = container.querySelector('.da-error-panel');
      expect(panel?.classList.contains('da-error-panel--hidden')).toBe(true);
    });

    it('should clean up on destroy', () => {
      errorPanel = new ErrorPanel();
      errorPanel.mount(container);
      errorPanel.destroy();

      expect(container.querySelector('.da-error-panel')).toBeNull();
    });

    it('should be safe to call destroy multiple times', () => {
      errorPanel = new ErrorPanel();
      errorPanel.mount(container);

      expect(() => {
        errorPanel.destroy();
        errorPanel.destroy();
      }).not.toThrow();
    });
  });

  describe('setErrors', () => {
    it('should display errors when setErrors is called with error array', () => {
      errorPanel = new ErrorPanel();
      errorPanel.mount(container);

      const errors: AssemblerError[] = [
        { line: 3, message: 'Unknown instruction: LDAX' },
        { line: 5, message: 'Invalid address', column: 8 },
      ];
      errorPanel.setErrors(errors);

      const items = container.querySelectorAll('.da-error-panel-item');
      expect(items.length).toBe(2);
    });

    it('should show panel when errors are set', () => {
      errorPanel = new ErrorPanel();
      errorPanel.mount(container);

      errorPanel.setErrors([{ line: 1, message: 'Error' }]);

      const panel = container.querySelector('.da-error-panel');
      expect(panel?.classList.contains('da-error-panel--hidden')).toBe(false);
    });

    it('should display line number for each error', () => {
      errorPanel = new ErrorPanel();
      errorPanel.mount(container);

      errorPanel.setErrors([{ line: 3, message: 'Error message' }]);

      const locationEl = container.querySelector('.da-error-panel-location');
      expect(locationEl?.textContent).toContain('Line 3');
    });

    it('should display column number when provided', () => {
      errorPanel = new ErrorPanel();
      errorPanel.mount(container);

      errorPanel.setErrors([{ line: 5, message: 'Error', column: 8 }]);

      const locationEl = container.querySelector('.da-error-panel-location');
      expect(locationEl?.textContent).toContain('Col 8');
    });

    it('should not display column when not provided', () => {
      errorPanel = new ErrorPanel();
      errorPanel.mount(container);

      errorPanel.setErrors([{ line: 5, message: 'Error' }]);

      const locationEl = container.querySelector('.da-error-panel-location');
      expect(locationEl?.textContent).not.toContain('Col');
    });

    it('should display error message for each error', () => {
      errorPanel = new ErrorPanel();
      errorPanel.mount(container);

      errorPanel.setErrors([{ line: 3, message: 'Unknown instruction: LDAX' }]);

      const messageEl = container.querySelector('.da-error-panel-message');
      expect(messageEl?.textContent).toBe('Unknown instruction: LDAX');
    });

    it('should display error count in header', () => {
      errorPanel = new ErrorPanel();
      errorPanel.mount(container);

      errorPanel.setErrors([
        { line: 1, message: 'Error 1' },
        { line: 2, message: 'Error 2' },
        { line: 3, message: 'Error 3' },
      ]);

      const countEl = container.querySelector('.da-error-panel-count');
      expect(countEl?.textContent).toContain('3');
    });

    it('should replace previous errors when called again', () => {
      errorPanel = new ErrorPanel();
      errorPanel.mount(container);

      errorPanel.setErrors([
        { line: 1, message: 'Error 1' },
        { line: 2, message: 'Error 2' },
      ]);
      errorPanel.setErrors([{ line: 5, message: 'New Error' }]);

      const items = container.querySelectorAll('.da-error-panel-item');
      expect(items.length).toBe(1);
      expect(container.querySelector('.da-error-panel-message')?.textContent).toBe('New Error');
    });

    it('should escape HTML in error messages to prevent XSS', () => {
      errorPanel = new ErrorPanel();
      errorPanel.mount(container);

      errorPanel.setErrors([{ line: 1, message: '<script>alert("xss")</script>' }]);

      const messageEl = container.querySelector('.da-error-panel-message');
      expect(messageEl?.innerHTML).not.toContain('<script>');
      expect(messageEl?.textContent).toBe('<script>alert("xss")</script>');
    });
  });

  describe('clearErrors', () => {
    it('should hide panel when clearErrors is called', () => {
      errorPanel = new ErrorPanel();
      errorPanel.mount(container);

      errorPanel.setErrors([{ line: 1, message: 'Error' }]);
      errorPanel.clearErrors();

      const panel = container.querySelector('.da-error-panel');
      expect(panel?.classList.contains('da-error-panel--hidden')).toBe(true);
    });

    it('should remove error items from list', () => {
      errorPanel = new ErrorPanel();
      errorPanel.mount(container);

      errorPanel.setErrors([{ line: 1, message: 'Error' }]);
      errorPanel.clearErrors();

      const items = container.querySelectorAll('.da-error-panel-item');
      expect(items.length).toBe(0);
    });

    it('should be safe to call when no errors are set', () => {
      errorPanel = new ErrorPanel();
      errorPanel.mount(container);

      expect(() => errorPanel.clearErrors()).not.toThrow();
    });
  });

  describe('onErrorClick callback', () => {
    it('should call onErrorClick when error item is clicked', () => {
      const onErrorClick = vi.fn();
      errorPanel = new ErrorPanel({ onErrorClick });
      errorPanel.mount(container);

      errorPanel.setErrors([{ line: 3, message: 'Error' }]);

      const errorItem = container.querySelector('.da-error-panel-item') as HTMLElement;
      errorItem?.click();

      expect(onErrorClick).toHaveBeenCalledWith({ line: 3 });
    });

    it('should include column in callback if provided', () => {
      const onErrorClick = vi.fn();
      errorPanel = new ErrorPanel({ onErrorClick });
      errorPanel.mount(container);

      errorPanel.setErrors([{ line: 5, message: 'Error', column: 10 }]);

      const errorItem = container.querySelector('.da-error-panel-item') as HTMLElement;
      errorItem?.click();

      expect(onErrorClick).toHaveBeenCalledWith({ line: 5, column: 10 });
    });

    it('should have clickable error items (CSS class for cursor:pointer)', () => {
      errorPanel = new ErrorPanel();
      errorPanel.mount(container);

      errorPanel.setErrors([{ line: 1, message: 'Error' }]);

      // Check that the item has the class that provides cursor:pointer in CSS
      const errorItem = container.querySelector('.da-error-panel-item') as HTMLElement;
      expect(errorItem).not.toBeNull();
      expect(errorItem.classList.contains('da-error-panel-item')).toBe(true);
    });
  });

  describe('accessibility', () => {
    it('should have role="list" on error list', () => {
      errorPanel = new ErrorPanel();
      errorPanel.mount(container);

      const list = container.querySelector('.da-error-panel-list');
      expect(list?.getAttribute('role')).toBe('list');
    });

    it('should have role="listitem" on error items', () => {
      errorPanel = new ErrorPanel();
      errorPanel.mount(container);

      errorPanel.setErrors([{ line: 1, message: 'Error' }]);

      const item = container.querySelector('.da-error-panel-item');
      expect(item?.getAttribute('role')).toBe('listitem');
    });

    it('should have aria-label on panel', () => {
      errorPanel = new ErrorPanel();
      errorPanel.mount(container);

      const panel = container.querySelector('.da-error-panel');
      expect(panel?.getAttribute('aria-label')).toBe('Assembly Errors');
    });

    it('should have aria-live for dynamic updates', () => {
      errorPanel = new ErrorPanel();
      errorPanel.mount(container);

      const panel = container.querySelector('.da-error-panel');
      expect(panel?.getAttribute('aria-live')).toBe('polite');
    });

    it('should make error items focusable with Tab', () => {
      errorPanel = new ErrorPanel();
      errorPanel.mount(container);

      errorPanel.setErrors([{ line: 1, message: 'Error' }]);

      const item = container.querySelector('.da-error-panel-item');
      expect(item?.getAttribute('tabindex')).toBe('0');
    });

    it('should trigger click on Enter key', () => {
      const onErrorClick = vi.fn();
      errorPanel = new ErrorPanel({ onErrorClick });
      errorPanel.mount(container);

      errorPanel.setErrors([{ line: 3, message: 'Error' }]);

      const errorItem = container.querySelector('.da-error-panel-item') as HTMLElement;
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      errorItem?.dispatchEvent(event);

      expect(onErrorClick).toHaveBeenCalledWith({ line: 3 });
    });

    it('should trigger click on Space key (WCAG 2.1 compliance)', () => {
      const onErrorClick = vi.fn();
      errorPanel = new ErrorPanel({ onErrorClick });
      errorPanel.mount(container);

      errorPanel.setErrors([{ line: 5, message: 'Error', column: 8 }]);

      const errorItem = container.querySelector('.da-error-panel-item') as HTMLElement;
      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
      errorItem?.dispatchEvent(event);

      expect(onErrorClick).toHaveBeenCalledWith({ line: 5, column: 8 });
    });

    it('should not trigger on other keys', () => {
      const onErrorClick = vi.fn();
      errorPanel = new ErrorPanel({ onErrorClick });
      errorPanel.mount(container);

      errorPanel.setErrors([{ line: 3, message: 'Error' }]);

      const errorItem = container.querySelector('.da-error-panel-item') as HTMLElement;
      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      errorItem?.dispatchEvent(event);

      expect(onErrorClick).not.toHaveBeenCalled();
    });
  });

  describe('styling', () => {
    it('should have header with title "Assembly Errors"', () => {
      errorPanel = new ErrorPanel();
      errorPanel.mount(container);

      const title = container.querySelector('.da-error-panel-title');
      expect(title?.textContent).toBe('Assembly Errors');
    });

    it('should have data-line attribute on error items', () => {
      errorPanel = new ErrorPanel();
      errorPanel.mount(container);

      errorPanel.setErrors([{ line: 7, message: 'Error' }]);

      const item = container.querySelector('.da-error-panel-item');
      expect(item?.getAttribute('data-line')).toBe('7');
    });

    it('should have data-column attribute when column provided', () => {
      errorPanel = new ErrorPanel();
      errorPanel.mount(container);

      errorPanel.setErrors([{ line: 7, message: 'Error', column: 12 }]);

      const item = container.querySelector('.da-error-panel-item');
      expect(item?.getAttribute('data-column')).toBe('12');
    });

    it('should handle many errors with scrollable list', () => {
      errorPanel = new ErrorPanel();
      errorPanel.mount(container);

      // Create 20 errors to test overflow handling
      const manyErrors: AssemblerError[] = Array.from({ length: 20 }, (_, i) => ({
        line: i + 1,
        message: `Error on line ${i + 1}: This is a test error message`,
      }));
      errorPanel.setErrors(manyErrors);

      const items = container.querySelectorAll('.da-error-panel-item');
      expect(items.length).toBe(20);

      // Verify error count displays correctly
      const countEl = container.querySelector('.da-error-panel-count');
      expect(countEl?.textContent).toBe('20 errors');
    });
  });

  describe('event delegation and cleanup', () => {
    it('should use event delegation for click handling', () => {
      const onErrorClick = vi.fn();
      errorPanel = new ErrorPanel({ onErrorClick });
      errorPanel.mount(container);

      errorPanel.setErrors([
        { line: 1, message: 'Error 1' },
        { line: 2, message: 'Error 2' },
      ]);

      // Click on different items should still trigger callbacks
      const items = container.querySelectorAll('.da-error-panel-item');
      (items[0] as HTMLElement).click();
      (items[1] as HTMLElement).click();

      expect(onErrorClick).toHaveBeenCalledTimes(2);
      expect(onErrorClick).toHaveBeenNthCalledWith(1, { line: 1 });
      expect(onErrorClick).toHaveBeenNthCalledWith(2, { line: 2 });
    });

    it('should not trigger callback after destroy', () => {
      const onErrorClick = vi.fn();
      errorPanel = new ErrorPanel({ onErrorClick });
      errorPanel.mount(container);

      errorPanel.setErrors([{ line: 1, message: 'Error' }]);

      // Destroy should clean up event listeners
      errorPanel.destroy();

      // After destroy, no element should exist to click
      const item = container.querySelector('.da-error-panel-item');
      expect(item).toBeNull();
    });

    it('should handle clicks on nested elements within error item', () => {
      const onErrorClick = vi.fn();
      errorPanel = new ErrorPanel({ onErrorClick });
      errorPanel.mount(container);

      errorPanel.setErrors([{ line: 3, message: 'Test error' }]);

      // Click on the message span (nested element)
      const messageEl = container.querySelector('.da-error-panel-message') as HTMLElement;
      messageEl?.click();

      // Should still trigger callback via event delegation
      expect(onErrorClick).toHaveBeenCalledWith({ line: 3 });
    });
  });

  describe('rich error display', () => {
    it('should render error type badge for SYNTAX_ERROR', () => {
      errorPanel = new ErrorPanel();
      errorPanel.mount(container);

      errorPanel.setErrors([{
        line: 1,
        message: 'Unknown instruction',
        type: 'SYNTAX_ERROR',
      }]);

      const badge = container.querySelector('.da-error-type-badge');
      expect(badge).not.toBeNull();
      expect(badge?.textContent).toBe('SYNTAX');
      expect(badge?.classList.contains('da-error-type-badge--syntax')).toBe(true);
    });

    it('should render error type badge for VALUE_ERROR', () => {
      errorPanel = new ErrorPanel();
      errorPanel.mount(container);

      errorPanel.setErrors([{
        line: 1,
        message: 'Invalid address',
        type: 'VALUE_ERROR',
      }]);

      const badge = container.querySelector('.da-error-type-badge');
      expect(badge?.textContent).toBe('VALUE');
      expect(badge?.classList.contains('da-error-type-badge--value')).toBe(true);
    });

    it('should render error type badge for CONSTRAINT_ERROR', () => {
      errorPanel = new ErrorPanel();
      errorPanel.mount(container);

      errorPanel.setErrors([{
        line: 1,
        message: 'Value exceeds range',
        type: 'CONSTRAINT_ERROR',
      }]);

      const badge = container.querySelector('.da-error-type-badge');
      expect(badge?.textContent).toBe('CONSTRAINT');
      expect(badge?.classList.contains('da-error-type-badge--constraint')).toBe(true);
    });

    it('should not render badge when type is not provided', () => {
      errorPanel = new ErrorPanel();
      errorPanel.mount(container);

      errorPanel.setErrors([{
        line: 1,
        message: 'Error without type',
      }]);

      const badge = container.querySelector('.da-error-type-badge');
      expect(badge).toBeNull();
    });

    it('should render code snippet with context', () => {
      errorPanel = new ErrorPanel();
      errorPanel.mount(container);

      errorPanel.setErrors([{
        line: 3,
        message: 'Unknown instruction',
        codeSnippet: {
          line: 'INVALID 0x10',
          lineNumber: 3,
          contextBefore: ['LDA 0x05'],
          contextAfter: ['HLT'],
        },
      }]);

      const snippet = container.querySelector('.da-error-snippet');
      expect(snippet).not.toBeNull();
      expect(snippet?.textContent).toContain('INVALID 0x10');
    });

    it('should render code snippet as pre element for semantic correctness', () => {
      errorPanel = new ErrorPanel();
      errorPanel.mount(container);

      errorPanel.setErrors([{
        line: 3,
        message: 'Unknown instruction',
        codeSnippet: {
          line: 'INVALID 0x10',
          lineNumber: 3,
        },
      }]);

      const snippet = container.querySelector('.da-error-snippet');
      expect(snippet?.tagName.toLowerCase()).toBe('pre');
      expect(snippet?.getAttribute('aria-label')).toContain('Code snippet showing error on line 3');
    });

    it('should render code snippet with line numbers', () => {
      errorPanel = new ErrorPanel();
      errorPanel.mount(container);

      errorPanel.setErrors([{
        line: 3,
        message: 'Unknown instruction',
        codeSnippet: {
          line: 'INVALID 0x10',
          lineNumber: 3,
          contextBefore: ['LDA 0x05'],
          contextAfter: ['HLT'],
        },
      }]);

      const errorLine = container.querySelector('.da-error-snippet-line--error');
      expect(errorLine).not.toBeNull();
      expect(errorLine?.textContent).toContain('3');
      expect(errorLine?.textContent).toContain('INVALID 0x10');
    });

    it('should highlight the error line in code snippet', () => {
      errorPanel = new ErrorPanel();
      errorPanel.mount(container);

      errorPanel.setErrors([{
        line: 3,
        message: 'Unknown instruction',
        codeSnippet: {
          line: 'INVALID 0x10',
          lineNumber: 3,
          contextBefore: ['LDA 0x05'],
          contextAfter: ['HLT'],
        },
      }]);

      const errorLine = container.querySelector('.da-error-snippet-line--error');
      expect(errorLine).not.toBeNull();
    });

    it('should render suggestion text when provided', () => {
      errorPanel = new ErrorPanel();
      errorPanel.mount(container);

      errorPanel.setErrors([{
        line: 1,
        message: 'Unknown instruction: LDAA',
        suggestion: 'LDA',
      }]);

      const suggestion = container.querySelector('.da-error-suggestion');
      expect(suggestion).not.toBeNull();
      expect(suggestion?.textContent).toContain('Did you mean');
      expect(suggestion?.textContent).toContain('LDA');
    });

    it('should not render suggestion when not provided', () => {
      errorPanel = new ErrorPanel();
      errorPanel.mount(container);

      errorPanel.setErrors([{
        line: 1,
        message: 'Error without suggestion',
      }]);

      const suggestion = container.querySelector('.da-error-suggestion');
      expect(suggestion).toBeNull();
    });

    it('should render Fix button when fixable is true', () => {
      errorPanel = new ErrorPanel();
      errorPanel.mount(container);

      errorPanel.setErrors([{
        line: 1,
        message: 'Unknown instruction: LDAA',
        suggestion: 'LDA',
        fixable: true,
      }]);

      const fixBtn = container.querySelector('.da-error-fix-btn');
      expect(fixBtn).not.toBeNull();
      expect(fixBtn?.textContent).toBe('Fix');
    });

    it('should not render Fix button when fixable is false', () => {
      errorPanel = new ErrorPanel();
      errorPanel.mount(container);

      errorPanel.setErrors([{
        line: 1,
        message: 'Error',
        fixable: false,
      }]);

      const fixBtn = container.querySelector('.da-error-fix-btn');
      expect(fixBtn).toBeNull();
    });

    it('should not render Fix button when fixable is not provided', () => {
      errorPanel = new ErrorPanel();
      errorPanel.mount(container);

      errorPanel.setErrors([{
        line: 1,
        message: 'Error without fixable field',
      }]);

      const fixBtn = container.querySelector('.da-error-fix-btn');
      expect(fixBtn).toBeNull();
    });

    it('should announce fixable errors for screen readers', () => {
      errorPanel = new ErrorPanel();
      errorPanel.mount(container);

      errorPanel.setErrors([{
        line: 1,
        message: 'Unknown instruction',
        suggestion: 'LDA',
        fixable: true,
      }]);

      const item = container.querySelector('.da-error-panel-item');
      expect(item?.getAttribute('aria-label')).toContain('fixable');
    });
  });

  describe('auto-fix functionality', () => {
    it('should call onFix callback when Fix button is clicked', () => {
      const onFix = vi.fn();
      errorPanel = new ErrorPanel({ onFix });
      errorPanel.mount(container);

      const error: AssemblerError = {
        line: 3,
        message: 'Unknown instruction: LDAA',
        suggestion: 'LDA',
        fixable: true,
      };
      errorPanel.setErrors([error]);

      const fixBtn = container.querySelector('.da-error-fix-btn') as HTMLElement;
      fixBtn?.click();

      expect(onFix).toHaveBeenCalledWith(error);
    });

    it('should not call onErrorClick when Fix button is clicked', () => {
      const onFix = vi.fn();
      const onErrorClick = vi.fn();
      errorPanel = new ErrorPanel({ onFix, onErrorClick });
      errorPanel.mount(container);

      errorPanel.setErrors([{
        line: 3,
        message: 'Unknown instruction: LDAA',
        suggestion: 'LDA',
        fixable: true,
      }]);

      const fixBtn = container.querySelector('.da-error-fix-btn') as HTMLElement;
      fixBtn?.click();

      expect(onFix).toHaveBeenCalled();
      expect(onErrorClick).not.toHaveBeenCalled();
    });

    it('should have data-line attribute on Fix button', () => {
      errorPanel = new ErrorPanel();
      errorPanel.mount(container);

      errorPanel.setErrors([{
        line: 5,
        message: 'Error',
        suggestion: 'FIX',
        fixable: true,
      }]);

      const fixBtn = container.querySelector('.da-error-fix-btn');
      expect(fixBtn?.getAttribute('data-line')).toBe('5');
    });

    it('should have data-suggestion attribute on Fix button', () => {
      errorPanel = new ErrorPanel();
      errorPanel.mount(container);

      errorPanel.setErrors([{
        line: 1,
        message: 'Error',
        suggestion: 'LDA',
        fixable: true,
      }]);

      const fixBtn = container.querySelector('.da-error-fix-btn');
      expect(fixBtn?.getAttribute('data-suggestion')).toBe('LDA');
    });

    it('should have accessible aria-label on Fix button', () => {
      errorPanel = new ErrorPanel();
      errorPanel.mount(container);

      errorPanel.setErrors([{
        line: 3,
        message: 'Unknown instruction: LDAA',
        suggestion: 'LDA 0x10',
        fixable: true,
      }]);

      const fixBtn = container.querySelector('.da-error-fix-btn');
      expect(fixBtn?.getAttribute('aria-label')).toBe('Fix error on line 3: replace with LDA 0x10');
    });

    it('should call onFix with full error object including codeSnippet', () => {
      const onFix = vi.fn();
      errorPanel = new ErrorPanel({ onFix });
      errorPanel.mount(container);

      const error: AssemblerError = {
        line: 3,
        message: 'Unknown instruction: LDAA',
        suggestion: 'LDA',
        fixable: true,
        type: 'SYNTAX_ERROR',
        codeSnippet: {
          line: 'LDAA 0x10',
          lineNumber: 3,
          contextBefore: ['LDA 0x05'],
          contextAfter: ['HLT'],
        },
      };
      errorPanel.setErrors([error]);

      const fixBtn = container.querySelector('.da-error-fix-btn') as HTMLElement;
      fixBtn?.click();

      expect(onFix).toHaveBeenCalledWith(error);
    });

    it('should trigger onFix via Enter key on Fix button', () => {
      const onFix = vi.fn();
      errorPanel = new ErrorPanel({ onFix });
      errorPanel.mount(container);

      const error: AssemblerError = {
        line: 3,
        message: 'Unknown instruction',
        suggestion: 'LDA',
        fixable: true,
      };
      errorPanel.setErrors([error]);

      const fixBtn = container.querySelector('.da-error-fix-btn') as HTMLElement;
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      fixBtn?.dispatchEvent(event);

      expect(onFix).toHaveBeenCalledWith(error);
    });

    it('should not call onFix when callback is not provided', () => {
      errorPanel = new ErrorPanel();
      errorPanel.mount(container);

      errorPanel.setErrors([{
        line: 1,
        message: 'Error',
        suggestion: 'FIX',
        fixable: true,
      }]);

      const fixBtn = container.querySelector('.da-error-fix-btn') as HTMLElement;

      // Should not throw when clicking without callback
      expect(() => fixBtn?.click()).not.toThrow();
    });

    it('should work with multiple errors - clicking correct Fix button', () => {
      const onFix = vi.fn();
      errorPanel = new ErrorPanel({ onFix });
      errorPanel.mount(container);

      const errors: AssemblerError[] = [
        { line: 1, message: 'Error 1', suggestion: 'FIX1', fixable: true },
        { line: 3, message: 'Error 2', suggestion: 'FIX2', fixable: true },
        { line: 5, message: 'Error 3', suggestion: 'FIX3', fixable: true },
      ];
      errorPanel.setErrors(errors);

      const fixBtns = container.querySelectorAll('.da-error-fix-btn');
      expect(fixBtns.length).toBe(3);

      // Click the second Fix button
      (fixBtns[1] as HTMLElement).click();

      expect(onFix).toHaveBeenCalledWith(errors[1]);
    });

    it('should correctly identify error when multiple errors on same line', () => {
      const onFix = vi.fn();
      errorPanel = new ErrorPanel({ onFix });
      errorPanel.mount(container);

      // Two errors on the same line (e.g., syntax error and constraint error)
      const errors: AssemblerError[] = [
        { line: 3, message: 'Error 1 on line 3', suggestion: 'FIX_FIRST', fixable: true },
        { line: 3, message: 'Error 2 on line 3', suggestion: 'FIX_SECOND', fixable: true },
      ];
      errorPanel.setErrors(errors);

      const fixBtns = container.querySelectorAll('.da-error-fix-btn');
      expect(fixBtns.length).toBe(2);

      // Click the SECOND Fix button (both have same line number)
      (fixBtns[1] as HTMLElement).click();

      // Should correctly identify the second error, not the first
      expect(onFix).toHaveBeenCalledWith(errors[1]);
      expect(onFix).not.toHaveBeenCalledWith(errors[0]);
    });

    it('should have data-error-index attribute on Fix button', () => {
      errorPanel = new ErrorPanel();
      errorPanel.mount(container);

      errorPanel.setErrors([
        { line: 1, message: 'First', suggestion: 'A', fixable: true },
        { line: 2, message: 'Second', suggestion: 'B', fixable: true },
      ]);

      const fixBtns = container.querySelectorAll('.da-error-fix-btn');
      expect(fixBtns[0]?.getAttribute('data-error-index')).toBe('0');
      expect(fixBtns[1]?.getAttribute('data-error-index')).toBe('1');
    });
  });
});
