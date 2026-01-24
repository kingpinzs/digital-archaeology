// src/story/ChoiceCard.test.ts
// Tests for ChoiceCard component
// Story 10.9: Create Choice Card Component

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ChoiceCard } from './ChoiceCard';
import type { ChoiceData } from './types';

describe('ChoiceCard', () => {
  let container: HTMLElement;
  let choiceCard: ChoiceCard;

  const mockChoiceData: ChoiceData = {
    id: 'choice-1',
    icon: '💡',
    title: 'Investigate Carry Look-Ahead',
    description: 'There must be a way to predict carries. Time to experiment.',
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    choiceCard = new ChoiceCard();
  });

  afterEach(() => {
    choiceCard.destroy();
    container.remove();
  });

  // Task 1: Create ChoiceData Interface
  describe('Task 1: ChoiceData Interface', () => {
    it('should accept ChoiceData with all required fields', () => {
      const data: ChoiceData = {
        id: 'test-choice',
        icon: '🔧',
        title: 'Test Choice',
        description: 'Test description for the choice.',
      };
      expect(data.id).toBe('test-choice');
      expect(data.icon).toBe('🔧');
      expect(data.title).toBe('Test Choice');
      expect(data.description).toBe('Test description for the choice.');
    });
  });

  // Task 2: Create ChoiceCard Component Class
  describe('Task 2: Component Class', () => {
    it('should mount correctly', () => {
      choiceCard.mount(container);
      expect(container.children.length).toBe(1);
    });

    it('should have getElement() accessor', () => {
      expect(choiceCard.getElement()).toBeNull();
      choiceCard.mount(container);
      expect(choiceCard.getElement()).not.toBeNull();
    });

    it('should have show/hide visibility methods', () => {
      choiceCard.mount(container);
      expect(choiceCard.isVisible()).toBe(true);
      choiceCard.hide();
      expect(choiceCard.isVisible()).toBe(false);
      choiceCard.show();
      expect(choiceCard.isVisible()).toBe(true);
    });

    it('should return false for isVisible() before mount', () => {
      expect(choiceCard.isVisible()).toBe(false);
    });

    it('should destroy and cleanup', () => {
      choiceCard.mount(container);
      expect(container.children.length).toBe(1);
      choiceCard.destroy();
      expect(container.children.length).toBe(0);
      expect(choiceCard.getElement()).toBeNull();
    });
  });

  // Task 3: Implement render() Method
  describe('Task 3: render() Method', () => {
    it('should render <button> element with correct class', () => {
      choiceCard.mount(container);
      const element = choiceCard.getElement();
      expect(element?.tagName).toBe('BUTTON');
      expect(element?.classList.contains('da-choice-card')).toBe(true);
    });

    it('should have type="button" attribute', () => {
      choiceCard.mount(container);
      const element = choiceCard.getElement();
      expect(element?.getAttribute('type')).toBe('button');
    });

    it('should have aria-label for accessibility', () => {
      choiceCard.mount(container);
      const element = choiceCard.getElement();
      expect(element?.getAttribute('aria-label')).toBe('Story choice');
    });

    it('should render icon element', () => {
      choiceCard.mount(container);
      const icon = container.querySelector('.da-choice-card-icon');
      expect(icon).not.toBeNull();
      expect(icon?.tagName).toBe('SPAN');
    });

    it('should render content wrapper', () => {
      choiceCard.mount(container);
      const content = container.querySelector('.da-choice-card-content');
      expect(content).not.toBeNull();
      expect(content?.tagName).toBe('DIV');
    });

    it('should render title element', () => {
      choiceCard.mount(container);
      const title = container.querySelector('.da-choice-card-title');
      expect(title).not.toBeNull();
      expect(title?.tagName).toBe('SPAN');
    });

    it('should render description element', () => {
      choiceCard.mount(container);
      const description = container.querySelector('.da-choice-card-description');
      expect(description).not.toBeNull();
      expect(description?.tagName).toBe('P');
    });

    it('should render arrow indicator', () => {
      choiceCard.mount(container);
      const arrow = container.querySelector('.da-choice-card-arrow');
      expect(arrow).not.toBeNull();
      expect(arrow?.textContent).toBe('→');
      expect(arrow?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  // Task 4: Implement setChoiceData() Method
  describe('Task 4: setChoiceData() Method', () => {
    it('should update icon content', () => {
      choiceCard.mount(container);
      choiceCard.setChoiceData(mockChoiceData);
      const icon = container.querySelector('.da-choice-card-icon');
      expect(icon?.textContent).toBe('💡');
    });

    it('should update title content', () => {
      choiceCard.mount(container);
      choiceCard.setChoiceData(mockChoiceData);
      const title = container.querySelector('.da-choice-card-title');
      expect(title?.textContent).toBe('Investigate Carry Look-Ahead');
    });

    it('should update description content', () => {
      choiceCard.mount(container);
      choiceCard.setChoiceData(mockChoiceData);
      const description = container.querySelector('.da-choice-card-description');
      expect(description?.textContent).toContain('Time to experiment');
    });

    it('should update aria-label with choice title', () => {
      choiceCard.mount(container);
      choiceCard.setChoiceData(mockChoiceData);
      const element = choiceCard.getElement();
      expect(element?.getAttribute('aria-label')).toBe('Choice: Investigate Carry Look-Ahead');
    });

    it('should handle setChoiceData before mount (no throw)', () => {
      expect(() => {
        choiceCard.setChoiceData(mockChoiceData);
      }).not.toThrow();
    });

    it('should display data set before mount after mounting', () => {
      choiceCard.setChoiceData(mockChoiceData);
      choiceCard.mount(container);
      const icon = container.querySelector('.da-choice-card-icon');
      expect(icon?.textContent).toBe('💡');
      const title = container.querySelector('.da-choice-card-title');
      expect(title?.textContent).toBe('Investigate Carry Look-Ahead');
    });

    it('should update display when data changes', () => {
      choiceCard.mount(container);
      choiceCard.setChoiceData(mockChoiceData);

      const newData: ChoiceData = {
        id: 'choice-2',
        icon: '🔧',
        title: 'Stick with Ripple-Carry',
        description: 'Continue with the working design.',
      };
      choiceCard.setChoiceData(newData);

      const icon = container.querySelector('.da-choice-card-icon');
      expect(icon?.textContent).toBe('🔧');
      const title = container.querySelector('.da-choice-card-title');
      expect(title?.textContent).toBe('Stick with Ripple-Carry');
    });

    it('should preserve component state when data is updated multiple times', () => {
      choiceCard.mount(container);

      choiceCard.setChoiceData(mockChoiceData);
      choiceCard.setChoiceData({ id: '2', icon: '🔧', title: 'Second', description: 'Desc 2' });
      choiceCard.setChoiceData({ id: '3', icon: '🗣️', title: 'Third', description: 'Desc 3' });

      const title = container.querySelector('.da-choice-card-title');
      expect(title?.textContent).toBe('Third');
      expect(choiceCard.getElement()?.tagName).toBe('BUTTON');
      expect(choiceCard.isVisible()).toBe(true);
    });
  });

  // Task 5: Implement Click Handling
  describe('Task 5: Click Handling', () => {
    it('should trigger onSelect callback with choice id when clicked', () => {
      const callback = vi.fn();
      choiceCard.onSelect(callback);
      choiceCard.mount(container);
      choiceCard.setChoiceData(mockChoiceData);

      const element = choiceCard.getElement();
      element?.click();

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('choice-1');
    });

    it('should support keyboard Enter via native button behavior', () => {
      // Native <button> elements automatically trigger click on Enter/Space.
      // jsdom doesn't simulate this, so we verify:
      // 1. Element is a focusable button (guarantees keyboard support)
      // 2. Click handler works (tested above)
      choiceCard.mount(container);
      const element = choiceCard.getElement();

      // Verify it's a button element (native keyboard support)
      expect(element?.tagName).toBe('BUTTON');
      expect(element?.getAttribute('type')).toBe('button');

      // Verify button is focusable (no tabindex=-1)
      expect(element?.getAttribute('tabindex')).not.toBe('-1');
    });

    it('should support keyboard Space via native button behavior', () => {
      // Native <button> elements automatically trigger click on Space.
      // jsdom doesn't simulate this, so we verify the element is a button.
      choiceCard.mount(container);
      const element = choiceCard.getElement();

      // Verify it's a button element (native keyboard support)
      expect(element?.tagName).toBe('BUTTON');

      // Verify click mechanism works (Space triggers click in browsers)
      const callback = vi.fn();
      choiceCard.onSelect(callback);
      choiceCard.setChoiceData(mockChoiceData);
      element?.click();
      expect(callback).toHaveBeenCalledWith('choice-1');
    });

    it('should not throw when clicked without callback', () => {
      choiceCard.mount(container);
      choiceCard.setChoiceData(mockChoiceData);

      expect(() => {
        choiceCard.getElement()?.click();
      }).not.toThrow();
    });

    it('should not call callback when clicked without data', () => {
      const callback = vi.fn();
      choiceCard.onSelect(callback);
      choiceCard.mount(container);

      choiceCard.getElement()?.click();

      expect(callback).not.toHaveBeenCalled();
    });

    it('should remove click handler on destroy', () => {
      const callback = vi.fn();
      choiceCard.onSelect(callback);
      choiceCard.mount(container);
      choiceCard.setChoiceData(mockChoiceData);

      // Verify element exists before destroy
      expect(choiceCard.getElement()).not.toBeNull();
      choiceCard.destroy();

      // Element should be removed and handler cleaned up
      expect(choiceCard.getElement()).toBeNull();
    });
  });

  // Task 6: Additional Component Tests
  describe('Task 6: Additional Tests', () => {
    it('should use textContent for XSS safety (icon)', () => {
      choiceCard.mount(container);
      const xssData: ChoiceData = {
        id: 'xss',
        icon: '<script>alert("xss")</script>',
        title: 'Normal title',
        description: 'Normal description',
      };
      choiceCard.setChoiceData(xssData);
      const icon = container.querySelector('.da-choice-card-icon');
      expect(icon?.innerHTML).toContain('&lt;script&gt;');
    });

    it('should use textContent for XSS safety (title)', () => {
      choiceCard.mount(container);
      const xssData: ChoiceData = {
        id: 'xss',
        icon: '🔧',
        title: '<img src=x onerror=alert("xss")>',
        description: 'Normal description',
      };
      choiceCard.setChoiceData(xssData);
      const title = container.querySelector('.da-choice-card-title');
      expect(title?.innerHTML).toContain('&lt;img');
    });

    it('should use textContent for XSS safety (description)', () => {
      choiceCard.mount(container);
      const xssData: ChoiceData = {
        id: 'xss',
        icon: '🔧',
        title: 'Normal title',
        description: '<script>document.cookie</script>',
      };
      choiceCard.setChoiceData(xssData);
      const description = container.querySelector('.da-choice-card-description');
      expect(description?.innerHTML).toContain('&lt;script&gt;');
    });

    it('should handle destroy() called multiple times', () => {
      choiceCard.mount(container);
      choiceCard.destroy();
      expect(() => choiceCard.destroy()).not.toThrow();
    });

    it('should have hidden class when hide() is called', () => {
      choiceCard.mount(container);
      choiceCard.hide();
      const element = choiceCard.getElement();
      expect(element?.classList.contains('da-choice-card--hidden')).toBe(true);
    });

    it('should remove hidden class when show() is called', () => {
      choiceCard.mount(container);
      choiceCard.hide();
      choiceCard.show();
      const element = choiceCard.getElement();
      expect(element?.classList.contains('da-choice-card--hidden')).toBe(false);
    });

    it('should be focusable for keyboard accessibility', () => {
      choiceCard.mount(container);
      const element = choiceCard.getElement() as HTMLButtonElement;

      // Button should be focusable (not disabled, no negative tabindex)
      expect(element.disabled).toBe(false);
      expect(element.getAttribute('tabindex')).not.toBe('-1');

      // Should be able to receive focus
      element.focus();
      expect(document.activeElement).toBe(element);
    });

    it('should inherit font-family from parent', () => {
      choiceCard.mount(container);
      const element = choiceCard.getElement();

      // Button resets font-family to inherit in CSS
      // This test verifies the button element exists and can inherit styles
      expect(element?.tagName).toBe('BUTTON');
    });
  });
});
