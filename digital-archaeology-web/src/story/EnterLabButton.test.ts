// src/story/EnterLabButton.test.ts
// Tests for EnterLabButton component
// Story 10.11: Create "Enter the Lab" Button

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EnterLabButton } from './EnterLabButton';

describe('EnterLabButton', () => {
  let container: HTMLElement;
  let enterLabButton: EnterLabButton;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    enterLabButton = new EnterLabButton();
  });

  afterEach(() => {
    enterLabButton.destroy();
    container.remove();
  });

  // Task 1: Component Class
  describe('Task 1: Component Class', () => {
    it('should mount correctly', () => {
      enterLabButton.mount(container);
      expect(container.children.length).toBe(1);
    });

    it('should have getElement() accessor', () => {
      expect(enterLabButton.getElement()).toBeNull();
      enterLabButton.mount(container);
      expect(enterLabButton.getElement()).not.toBeNull();
    });

    it('should have show/hide visibility methods', () => {
      enterLabButton.mount(container);
      expect(enterLabButton.isVisible()).toBe(true);
      enterLabButton.hide();
      expect(enterLabButton.isVisible()).toBe(false);
      enterLabButton.show();
      expect(enterLabButton.isVisible()).toBe(true);
    });

    it('should return false for isVisible() before mount', () => {
      expect(enterLabButton.isVisible()).toBe(false);
    });

    it('should destroy and cleanup', () => {
      enterLabButton.mount(container);
      expect(container.children.length).toBe(1);
      enterLabButton.destroy();
      expect(container.children.length).toBe(0);
      expect(enterLabButton.getElement()).toBeNull();
    });
  });

  // Task 2: render() Method
  describe('Task 2: render() Method', () => {
    it('should render <button> element with correct class', () => {
      enterLabButton.mount(container);
      const element = enterLabButton.getElement();
      expect(element?.tagName).toBe('BUTTON');
      expect(element?.classList.contains('da-enter-lab-button')).toBe(true);
    });

    it('should have type="button" attribute', () => {
      enterLabButton.mount(container);
      const element = enterLabButton.getElement();
      expect(element?.getAttribute('type')).toBe('button');
    });

    it('should render icon element with lightning bolt', () => {
      enterLabButton.mount(container);
      const icon = container.querySelector('.da-enter-lab-button-icon');
      expect(icon).not.toBeNull();
      expect(icon?.tagName).toBe('SPAN');
      expect(icon?.textContent).toBe('⚡');
    });

    it('should have icon with aria-hidden="true"', () => {
      enterLabButton.mount(container);
      const icon = container.querySelector('.da-enter-lab-button-icon');
      expect(icon?.getAttribute('aria-hidden')).toBe('true');
    });

    it('should render "Enter the Lab" text', () => {
      enterLabButton.mount(container);
      const text = container.querySelector('.da-enter-lab-button-text');
      expect(text).not.toBeNull();
      expect(text?.tagName).toBe('SPAN');
      expect(text?.textContent).toBe('Enter the Lab');
    });

    it('should have aria-label for accessibility', () => {
      enterLabButton.mount(container);
      const element = enterLabButton.getElement();
      expect(element?.getAttribute('aria-label')).toBe('Enter the Lab - switch to Lab Mode');
    });
  });

  // Task 3: Click Handling
  describe('Task 3: Click Handling', () => {
    it('should trigger onClick callback when clicked', () => {
      const callback = vi.fn();
      enterLabButton.onClick(callback);
      enterLabButton.mount(container);

      const element = enterLabButton.getElement();
      element?.click();

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should not throw when clicked without callback', () => {
      enterLabButton.mount(container);

      expect(() => {
        enterLabButton.getElement()?.click();
      }).not.toThrow();
    });

    it('should remove click handler on destroy', () => {
      const callback = vi.fn();
      enterLabButton.onClick(callback);
      enterLabButton.mount(container);

      // Verify element exists before destroy
      expect(enterLabButton.getElement()).not.toBeNull();
      enterLabButton.destroy();

      // Element should be removed and handler cleaned up
      expect(enterLabButton.getElement()).toBeNull();
    });

    it('should allow setting callback before mount', () => {
      const callback = vi.fn();
      enterLabButton.onClick(callback);
      enterLabButton.mount(container);

      enterLabButton.getElement()?.click();
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should allow setting callback after mount', () => {
      enterLabButton.mount(container);
      const callback = vi.fn();
      enterLabButton.onClick(callback);

      enterLabButton.getElement()?.click();
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  // Task 4: CSS Classes
  describe('Task 4: CSS Classes', () => {
    it('should have hidden class when hide() is called', () => {
      enterLabButton.mount(container);
      enterLabButton.hide();
      const element = enterLabButton.getElement();
      expect(element?.classList.contains('da-enter-lab-button--hidden')).toBe(true);
    });

    it('should remove hidden class when show() is called', () => {
      enterLabButton.mount(container);
      enterLabButton.hide();
      enterLabButton.show();
      const element = enterLabButton.getElement();
      expect(element?.classList.contains('da-enter-lab-button--hidden')).toBe(false);
    });
  });

  // Task 5: Additional Tests
  describe('Task 5: Additional Tests', () => {
    it('should handle destroy() called multiple times', () => {
      enterLabButton.mount(container);
      enterLabButton.destroy();
      expect(() => enterLabButton.destroy()).not.toThrow();
    });

    it('should support keyboard via native button behavior', () => {
      // Native <button> elements automatically trigger click on Enter/Space.
      // jsdom doesn't simulate this, so we verify:
      // 1. Element is a focusable button (guarantees keyboard support)
      // 2. Click handler works (tested above)
      enterLabButton.mount(container);
      const element = enterLabButton.getElement();

      // Verify it's a button element (native keyboard support)
      expect(element?.tagName).toBe('BUTTON');
      expect(element?.getAttribute('type')).toBe('button');

      // Verify button is focusable (no tabindex=-1)
      expect(element?.getAttribute('tabindex')).not.toBe('-1');
    });

    it('should be focusable for keyboard accessibility', () => {
      enterLabButton.mount(container);
      const element = enterLabButton.getElement() as HTMLButtonElement;

      // Button should be focusable (not disabled, no negative tabindex)
      expect(element.disabled).toBe(false);
      expect(element.getAttribute('tabindex')).not.toBe('-1');

      // Should be able to receive focus
      element.focus();
      expect(document.activeElement).toBe(element);
    });
  });
});
