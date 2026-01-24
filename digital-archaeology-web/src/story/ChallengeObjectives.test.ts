// src/story/ChallengeObjectives.test.ts
// Tests for ChallengeObjectives component
// Story 10.13: Create Challenge Objectives in Lab Mode

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ChallengeObjectives } from './ChallengeObjectives';
import type { ChallengeData } from './types';

describe('ChallengeObjectives', () => {
  let container: HTMLElement;
  let component: ChallengeObjectives;

  // Helper function to create fresh mock data (avoids mutation issues between tests)
  const createMockChallengeData = (): ChallengeData => ({
    title: 'CARRY LOOK-AHEAD',
    objectives: [
      { id: 'obj-1', text: 'Implement Generate (G) logic', completed: true },
      { id: 'obj-2', text: 'Implement Propagate (P) logic', completed: true },
      { id: 'obj-3', text: 'Build carry look-ahead unit', completed: false },
      { id: 'obj-4', text: 'Connect to sum generators', completed: false },
    ],
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    component = new ChallengeObjectives();
  });

  afterEach(() => {
    component.destroy();
    container.remove();
  });

  // Task 1: Component Class
  describe('Task 1: Component Class', () => {
    it('should mount correctly', () => {
      component.mount(container);
      expect(container.children.length).toBe(1);
    });

    it('should have getElement() accessor', () => {
      expect(component.getElement()).toBeNull();
      component.mount(container);
      expect(component.getElement()).not.toBeNull();
    });

    it('should have show/hide visibility methods', () => {
      component.mount(container);
      expect(component.isVisible()).toBe(true);
      component.hide();
      expect(component.isVisible()).toBe(false);
      component.show();
      expect(component.isVisible()).toBe(true);
    });

    it('should return false for isVisible() before mount', () => {
      expect(component.isVisible()).toBe(false);
    });

    it('should destroy and cleanup', () => {
      component.mount(container);
      expect(container.children.length).toBe(1);
      component.destroy();
      expect(container.children.length).toBe(0);
      expect(component.getElement()).toBeNull();
    });
  });

  // Task 3: render() Method
  describe('Task 3: render() Method', () => {
    it('should render <section> element with correct class', () => {
      component.mount(container);
      const element = component.getElement();
      expect(element?.tagName).toBe('SECTION');
      expect(element?.classList.contains('da-challenge-objectives')).toBe(true);
    });

    it('should have role="region" attribute', () => {
      component.mount(container);
      const element = component.getElement();
      expect(element?.getAttribute('role')).toBe('region');
    });

    it('should have aria-label="Challenge objectives"', () => {
      component.mount(container);
      const element = component.getElement();
      expect(element?.getAttribute('aria-label')).toBe('Challenge objectives');
    });

    it('should render header with lightbulb icon', () => {
      component.mount(container);
      const icon = container.querySelector('.da-challenge-objectives-icon');
      expect(icon?.textContent).toBe('💡');
    });

    it('should have icon with aria-hidden="true"', () => {
      component.mount(container);
      const icon = container.querySelector('.da-challenge-objectives-icon');
      expect(icon?.getAttribute('aria-hidden')).toBe('true');
    });

    it('should render title element', () => {
      component.mount(container);
      const title = container.querySelector('.da-challenge-objectives-title');
      expect(title).not.toBeNull();
    });

    it('should render objectives list', () => {
      component.mount(container);
      const list = container.querySelector('.da-challenge-objectives-list');
      expect(list).not.toBeNull();
      expect(list?.tagName).toBe('UL');
    });
  });

  // Task 4: Objective Checkboxes
  describe('Task 4: Objective Checkboxes', () => {
    it('should render objectives with unchecked state [ ]', () => {
      component.mount(container);
      component.setChallengeData({
        title: 'TEST',
        objectives: [{ id: 'test-1', text: 'Test objective', completed: false }],
      });

      const checkbox = container.querySelector('.da-challenge-objective-checkbox');
      expect(checkbox?.textContent).toBe('[ ]');
    });

    it('should render completed objectives with checked state [✓]', () => {
      component.mount(container);
      component.setChallengeData({
        title: 'TEST',
        objectives: [{ id: 'test-1', text: 'Test objective', completed: true }],
      });

      const checkbox = container.querySelector('.da-challenge-objective-checkbox');
      expect(checkbox?.textContent).toBe('[✓]');
    });

    it('should have aria-checked attribute on objectives', () => {
      component.mount(container);
      component.setChallengeData(createMockChallengeData());

      const items = container.querySelectorAll('.da-challenge-objective-item');
      expect(items[0].getAttribute('aria-checked')).toBe('true');
      expect(items[2].getAttribute('aria-checked')).toBe('false');
    });

    it('should style completed items with complete class', () => {
      component.mount(container);
      component.setChallengeData(createMockChallengeData());

      const items = container.querySelectorAll('.da-challenge-objective-item');
      expect(items[0].classList.contains('da-challenge-objective-item--complete')).toBe(true);
      expect(items[2].classList.contains('da-challenge-objective-item--complete')).toBe(false);
    });
  });

  // Task 5: Data Management
  describe('Task 5: Data Management', () => {
    it('should setChallengeData and render title', () => {
      component.mount(container);
      component.setChallengeData(createMockChallengeData());

      const title = container.querySelector('.da-challenge-objectives-title');
      expect(title?.textContent).toBe('CHALLENGE: CARRY LOOK-AHEAD');
    });

    it('should setChallengeData and render objectives', () => {
      component.mount(container);
      component.setChallengeData(createMockChallengeData());

      const items = container.querySelectorAll('.da-challenge-objective-item');
      expect(items.length).toBe(4);
    });

    it('should setObjectiveComplete(id, true) mark objective complete', () => {
      component.mount(container);
      component.setChallengeData(createMockChallengeData());
      component.setObjectiveComplete('obj-3', true);

      const items = container.querySelectorAll('.da-challenge-objective-item');
      const thirdItem = items[2];
      expect(thirdItem.classList.contains('da-challenge-objective-item--complete')).toBe(true);
      expect(thirdItem.getAttribute('aria-checked')).toBe('true');
      const checkbox = thirdItem.querySelector('.da-challenge-objective-checkbox');
      expect(checkbox?.textContent).toBe('[✓]');
    });

    it('should setObjectiveComplete(id, false) mark objective incomplete', () => {
      component.mount(container);
      component.setChallengeData(createMockChallengeData());
      component.setObjectiveComplete('obj-1', false);

      const items = container.querySelectorAll('.da-challenge-objective-item');
      const firstItem = items[0];
      expect(firstItem.classList.contains('da-challenge-objective-item--complete')).toBe(false);
      expect(firstItem.getAttribute('aria-checked')).toBe('false');
      const checkbox = firstItem.querySelector('.da-challenge-objective-checkbox');
      expect(checkbox?.textContent).toBe('[ ]');
    });

    it('should getProgress return correct counts', () => {
      component.mount(container);
      component.setChallengeData(createMockChallengeData());

      const progress = component.getProgress();
      expect(progress.completed).toBe(2);
      expect(progress.total).toBe(4);
    });

    it('should getProgress return zeros before data is set', () => {
      component.mount(container);
      const progress = component.getProgress();
      expect(progress.completed).toBe(0);
      expect(progress.total).toBe(0);
    });

    it('should dispatch challenge-progress-changed event on objective change', () => {
      component.mount(container);
      component.setChallengeData(createMockChallengeData());

      const eventHandler = vi.fn();
      component.getElement()?.addEventListener('challenge-progress-changed', eventHandler);

      component.setObjectiveComplete('obj-3', true);

      expect(eventHandler).toHaveBeenCalledTimes(1);
      expect(eventHandler.mock.calls[0][0].detail).toEqual({ completed: 3, total: 4 });
    });

    it('should not dispatch event if objective state unchanged', () => {
      component.mount(container);
      component.setChallengeData(createMockChallengeData());

      const eventHandler = vi.fn();
      component.getElement()?.addEventListener('challenge-progress-changed', eventHandler);

      // obj-1 is already completed
      component.setObjectiveComplete('obj-1', true);

      expect(eventHandler).not.toHaveBeenCalled();
    });

    it('should not throw when setObjectiveComplete called with invalid id', () => {
      component.mount(container);
      component.setChallengeData(createMockChallengeData());

      expect(() => component.setObjectiveComplete('invalid-id', true)).not.toThrow();
    });

    it('should not throw when setObjectiveComplete called before data set', () => {
      component.mount(container);
      expect(() => component.setObjectiveComplete('obj-1', true)).not.toThrow();
    });
  });

  // Task 6: CSS Classes (structure verification)
  describe('Task 6: CSS Classes', () => {
    it('should have hidden class when hide() is called', () => {
      component.mount(container);
      component.hide();
      const element = component.getElement();
      expect(element?.classList.contains('da-challenge-objectives--hidden')).toBe(true);
    });

    it('should remove hidden class when show() is called', () => {
      component.mount(container);
      component.hide();
      component.show();
      const element = component.getElement();
      expect(element?.classList.contains('da-challenge-objectives--hidden')).toBe(false);
    });

    it('should have gold border class (da-challenge-objectives)', () => {
      component.mount(container);
      const element = component.getElement();
      expect(element?.classList.contains('da-challenge-objectives')).toBe(true);
    });
  });

  // Task 7: Additional Tests
  describe('Task 7: Additional Tests', () => {
    it('should handle destroy() called multiple times', () => {
      component.mount(container);
      component.destroy();
      expect(() => component.destroy()).not.toThrow();
    });

    it('should apply data set before mount', () => {
      component.setChallengeData(createMockChallengeData());
      component.mount(container);

      const title = container.querySelector('.da-challenge-objectives-title');
      expect(title?.textContent).toBe('CHALLENGE: CARRY LOOK-AHEAD');

      const items = container.querySelectorAll('.da-challenge-objective-item');
      expect(items.length).toBe(4);
    });

    it('should have list with role="list"', () => {
      component.mount(container);
      const list = container.querySelector('.da-challenge-objectives-list');
      expect(list?.getAttribute('role')).toBe('list');
    });

    it('should have objective items with role="listitem"', () => {
      component.mount(container);
      component.setChallengeData(createMockChallengeData());

      const items = container.querySelectorAll('.da-challenge-objective-item');
      items.forEach((item) => {
        expect(item.getAttribute('role')).toBe('listitem');
      });
    });

    it('should have checkbox with aria-hidden="true"', () => {
      component.mount(container);
      component.setChallengeData(createMockChallengeData());

      const checkboxes = container.querySelectorAll('.da-challenge-objective-checkbox');
      checkboxes.forEach((checkbox) => {
        expect(checkbox.getAttribute('aria-hidden')).toBe('true');
      });
    });

    it('should render objective text correctly', () => {
      component.mount(container);
      component.setChallengeData(createMockChallengeData());

      const texts = container.querySelectorAll('.da-challenge-objective-text');
      expect(texts[0].textContent).toBe('Implement Generate (G) logic');
      expect(texts[2].textContent).toBe('Build carry look-ahead unit');
    });
  });
});
