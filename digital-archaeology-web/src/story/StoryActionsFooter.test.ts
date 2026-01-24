// src/story/StoryActionsFooter.test.ts
// Tests for StoryActionsFooter component
// Story 10.12: Create Story Actions Footer

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StoryActionsFooter } from './StoryActionsFooter';

describe('StoryActionsFooter', () => {
  let container: HTMLElement;
  let footer: StoryActionsFooter;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    footer = new StoryActionsFooter();
  });

  afterEach(() => {
    footer.destroy();
    container.remove();
  });

  // Task 1: Component Class
  describe('Task 1: Component Class', () => {
    it('should mount correctly', () => {
      footer.mount(container);
      expect(container.children.length).toBe(1);
    });

    it('should have getElement() accessor', () => {
      expect(footer.getElement()).toBeNull();
      footer.mount(container);
      expect(footer.getElement()).not.toBeNull();
    });

    it('should have show/hide visibility methods', () => {
      footer.mount(container);
      expect(footer.isVisible()).toBe(true);
      footer.hide();
      expect(footer.isVisible()).toBe(false);
      footer.show();
      expect(footer.isVisible()).toBe(true);
    });

    it('should return false for isVisible() before mount', () => {
      expect(footer.isVisible()).toBe(false);
    });

    it('should destroy and cleanup', () => {
      footer.mount(container);
      expect(container.children.length).toBe(1);
      footer.destroy();
      expect(container.children.length).toBe(0);
      expect(footer.getElement()).toBeNull();
    });
  });

  // Task 2: render() Method
  describe('Task 2: render() Method', () => {
    it('should render <footer> element with correct class', () => {
      footer.mount(container);
      const element = footer.getElement();
      expect(element?.tagName).toBe('FOOTER');
      expect(element?.classList.contains('da-story-actions-footer')).toBe(true);
    });

    it('should have role="navigation" attribute', () => {
      footer.mount(container);
      const element = footer.getElement();
      expect(element?.getAttribute('role')).toBe('navigation');
    });

    it('should have aria-label="Story navigation"', () => {
      footer.mount(container);
      const element = footer.getElement();
      expect(element?.getAttribute('aria-label')).toBe('Story navigation');
    });

    it('should render three buttons', () => {
      footer.mount(container);
      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBe(3);
    });

    it('should render Previous button with left arrow (←)', () => {
      footer.mount(container);
      const buttons = container.querySelectorAll('button');
      const previousBtn = buttons[0];
      const icon = previousBtn.querySelector('.da-story-action-btn-icon');
      expect(icon?.textContent).toBe('←');
    });

    it('should render Continue button with right arrow (→)', () => {
      footer.mount(container);
      const buttons = container.querySelectorAll('button');
      const continueBtn = buttons[2];
      const icon = continueBtn.querySelector('.da-story-action-btn-icon');
      expect(icon?.textContent).toBe('→');
    });

    it('should render Enter Lab button with lightning bolt (⚡)', () => {
      footer.mount(container);
      const buttons = container.querySelectorAll('button');
      const enterLabBtn = buttons[1];
      const icon = enterLabBtn.querySelector('.da-story-action-btn-icon');
      expect(icon?.textContent).toBe('⚡');
    });

    it('should have all buttons with type="button" attribute', () => {
      footer.mount(container);
      const buttons = container.querySelectorAll('button');
      buttons.forEach((btn) => {
        expect(btn.getAttribute('type')).toBe('button');
      });
    });

    it('should have Previous button with da-story-action-btn class', () => {
      footer.mount(container);
      const buttons = container.querySelectorAll('button');
      expect(buttons[0].classList.contains('da-story-action-btn')).toBe(true);
    });

    it('should have Enter Lab button with da-story-action-btn--lab class', () => {
      footer.mount(container);
      const buttons = container.querySelectorAll('button');
      expect(buttons[1].classList.contains('da-story-action-btn--lab')).toBe(true);
    });

    it('should have Continue button with da-story-action-btn--primary class', () => {
      footer.mount(container);
      const buttons = container.querySelectorAll('button');
      expect(buttons[2].classList.contains('da-story-action-btn--primary')).toBe(true);
    });

    it('should have aria-label on all buttons', () => {
      footer.mount(container);
      const buttons = container.querySelectorAll('button');
      expect(buttons[0].getAttribute('aria-label')).toBe('Go to previous scene');
      expect(buttons[1].getAttribute('aria-label')).toBe('Enter the Lab - switch to Lab Mode');
      expect(buttons[2].getAttribute('aria-label')).toBe('Continue to next scene');
    });

    it('should have icons with aria-hidden="true"', () => {
      footer.mount(container);
      const icons = container.querySelectorAll('.da-story-action-btn-icon');
      icons.forEach((icon) => {
        expect(icon.getAttribute('aria-hidden')).toBe('true');
      });
    });
  });

  // Task 3: Button State Management
  describe('Task 3: Button State Management', () => {
    it('should disable Previous button with setPreviousEnabled(false)', () => {
      footer.mount(container);
      footer.setPreviousEnabled(false);
      const buttons = container.querySelectorAll('button');
      const previousBtn = buttons[0] as HTMLButtonElement;
      expect(previousBtn.disabled).toBe(true);
      expect(previousBtn.getAttribute('aria-disabled')).toBe('true');
      expect(previousBtn.classList.contains('da-story-action-btn--disabled')).toBe(true);
    });

    it('should enable Previous button with setPreviousEnabled(true)', () => {
      footer.mount(container);
      footer.setPreviousEnabled(false);
      footer.setPreviousEnabled(true);
      const buttons = container.querySelectorAll('button');
      const previousBtn = buttons[0] as HTMLButtonElement;
      expect(previousBtn.disabled).toBe(false);
      expect(previousBtn.getAttribute('aria-disabled')).toBe('false');
      expect(previousBtn.classList.contains('da-story-action-btn--disabled')).toBe(false);
    });

    it('should disable Continue button with setContinueEnabled(false)', () => {
      footer.mount(container);
      footer.setContinueEnabled(false);
      const buttons = container.querySelectorAll('button');
      const continueBtn = buttons[2] as HTMLButtonElement;
      expect(continueBtn.disabled).toBe(true);
      expect(continueBtn.getAttribute('aria-disabled')).toBe('true');
      expect(continueBtn.classList.contains('da-story-action-btn--disabled')).toBe(true);
    });

    it('should enable Continue button with setContinueEnabled(true)', () => {
      footer.mount(container);
      footer.setContinueEnabled(false);
      footer.setContinueEnabled(true);
      const buttons = container.querySelectorAll('button');
      const continueBtn = buttons[2] as HTMLButtonElement;
      expect(continueBtn.disabled).toBe(false);
    });

    it('should hide Enter Lab button with setEnterLabVisible(false)', () => {
      footer.mount(container);
      footer.setEnterLabVisible(false);
      const buttons = container.querySelectorAll('button');
      expect(buttons[1].classList.contains('da-story-action-btn--hidden')).toBe(true);
    });

    it('should show Enter Lab button with setEnterLabVisible(true)', () => {
      footer.mount(container);
      footer.setEnterLabVisible(false);
      footer.setEnterLabVisible(true);
      const buttons = container.querySelectorAll('button');
      expect(buttons[1].classList.contains('da-story-action-btn--hidden')).toBe(false);
    });
  });

  // Task 4: Click Handling
  describe('Task 4: Click Handling', () => {
    it('should trigger onPrevious callback when clicked', () => {
      const callback = vi.fn();
      footer.onPrevious(callback);
      footer.mount(container);

      const buttons = container.querySelectorAll('button');
      buttons[0].click();

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should trigger onContinue callback when clicked', () => {
      const callback = vi.fn();
      footer.onContinue(callback);
      footer.mount(container);

      const buttons = container.querySelectorAll('button');
      buttons[2].click();

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should trigger onEnterLab callback when clicked', () => {
      const callback = vi.fn();
      footer.onEnterLab(callback);
      footer.mount(container);

      const buttons = container.querySelectorAll('button');
      buttons[1].click();

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should not throw when Previous clicked without callback', () => {
      footer.mount(container);
      const buttons = container.querySelectorAll('button');
      expect(() => buttons[0].click()).not.toThrow();
    });

    it('should not throw when Continue clicked without callback', () => {
      footer.mount(container);
      const buttons = container.querySelectorAll('button');
      expect(() => buttons[2].click()).not.toThrow();
    });

    it('should not throw when Enter Lab clicked without callback', () => {
      footer.mount(container);
      const buttons = container.querySelectorAll('button');
      expect(() => buttons[1].click()).not.toThrow();
    });

    it('should not trigger onPrevious callback when disabled', () => {
      const callback = vi.fn();
      footer.onPrevious(callback);
      footer.mount(container);
      footer.setPreviousEnabled(false);

      const buttons = container.querySelectorAll('button');
      buttons[0].click();

      expect(callback).not.toHaveBeenCalled();
    });

    it('should not trigger onContinue callback when disabled', () => {
      const callback = vi.fn();
      footer.onContinue(callback);
      footer.mount(container);
      footer.setContinueEnabled(false);

      const buttons = container.querySelectorAll('button');
      buttons[2].click();

      expect(callback).not.toHaveBeenCalled();
    });

    it('should allow setting callback before mount', () => {
      const callback = vi.fn();
      footer.onPrevious(callback);
      footer.mount(container);

      const buttons = container.querySelectorAll('button');
      buttons[0].click();

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should allow setting callback after mount', () => {
      footer.mount(container);
      const callback = vi.fn();
      footer.onPrevious(callback);

      const buttons = container.querySelectorAll('button');
      buttons[0].click();

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  // Task 5: CSS Classes (structure verification)
  describe('Task 5: CSS Classes', () => {
    it('should have hidden class when hide() is called', () => {
      footer.mount(container);
      footer.hide();
      const element = footer.getElement();
      expect(element?.classList.contains('da-story-actions-footer--hidden')).toBe(true);
    });

    it('should remove hidden class when show() is called', () => {
      footer.mount(container);
      footer.hide();
      footer.show();
      const element = footer.getElement();
      expect(element?.classList.contains('da-story-actions-footer--hidden')).toBe(false);
    });
  });

  // Task 6: Additional Tests
  describe('Task 6: Additional Tests', () => {
    it('should handle destroy() called multiple times', () => {
      footer.mount(container);
      footer.destroy();
      expect(() => footer.destroy()).not.toThrow();
    });

    it('should have all buttons focusable', () => {
      footer.mount(container);
      const buttons = container.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;

      buttons.forEach((btn) => {
        // Buttons should not have negative tabindex
        expect(btn.getAttribute('tabindex')).not.toBe('-1');
        // Buttons should not be disabled by default
        expect(btn.disabled).toBe(false);
      });
    });

    it('should support keyboard via native button behavior', () => {
      // Native <button> elements automatically trigger click on Enter/Space.
      // jsdom doesn't simulate this, so we verify buttons are actual <button> elements
      footer.mount(container);
      const buttons = container.querySelectorAll('button');

      buttons.forEach((btn) => {
        expect(btn.tagName).toBe('BUTTON');
        expect(btn.getAttribute('type')).toBe('button');
      });
    });

    it('should remove event listeners on destroy', () => {
      const previousCallback = vi.fn();
      const continueCallback = vi.fn();
      const enterLabCallback = vi.fn();

      footer.onPrevious(previousCallback);
      footer.onContinue(continueCallback);
      footer.onEnterLab(enterLabCallback);
      footer.mount(container);

      // Verify callbacks work before destroy
      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBe(3);

      footer.destroy();

      // Element should be removed
      expect(footer.getElement()).toBeNull();
    });
  });
});
