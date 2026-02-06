// src/story/BuilderModeScene.test.ts
// Tests for BuilderModeScene component
// Story 10.22: Decision-Maker + Builder Mode

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BuilderModeScene } from './BuilderModeScene';
import type { BuilderChallengeData } from './content-types';

describe('BuilderModeScene', () => {
  let scene: BuilderModeScene;
  let container: HTMLElement;

  function createMockChallenge(): BuilderChallengeData {
    return {
      title: 'Segment Registers',
      description: 'Implement the segment register addressing scheme.',
      decisionId: 'memory-addressing-1978',
      objectives: [
        { id: 'obj-1', text: 'Create segment register structure', completed: false },
        { id: 'obj-2', text: 'Implement 20-bit address calculation', completed: false },
        { id: 'obj-3', text: 'Test with 1MB memory map', completed: false },
      ],
    };
  }

  let mockChallenge: BuilderChallengeData;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    scene = new BuilderModeScene();
    mockChallenge = createMockChallenge();
  });

  afterEach(() => {
    scene.destroy();
    container.remove();
  });

  describe('mount', () => {
    it('should create scene element in container', () => {
      scene.mount(container);
      expect(container.querySelector('.da-builder-mode-scene')).not.toBeNull();
    });

    it('should have region role', () => {
      scene.mount(container);
      const el = container.querySelector('.da-builder-mode-scene');
      expect(el?.getAttribute('role')).toBe('region');
    });

    it('should have aria-label', () => {
      scene.mount(container);
      const el = container.querySelector('.da-builder-mode-scene');
      expect(el?.getAttribute('aria-label')).toBe('Builder Challenge');
    });
  });

  describe('setChallengeData', () => {
    it('should render challenge title', () => {
      scene.mount(container);
      scene.setChallengeData(mockChallenge);
      const title = container.querySelector('.da-builder-challenge-title');
      expect(title?.textContent).toBe('BUILD: Segment Registers');
    });

    it('should render challenge description', () => {
      scene.mount(container);
      scene.setChallengeData(mockChallenge);
      const desc = container.querySelector('.da-builder-challenge-description');
      expect(desc?.textContent).toBe('Implement the segment register addressing scheme.');
    });

    it('should render all objectives', () => {
      scene.mount(container);
      scene.setChallengeData(mockChallenge);
      const items = container.querySelectorAll('.da-builder-objective-item');
      expect(items.length).toBe(3);
    });

    it('should render objectives as unchecked initially', () => {
      scene.mount(container);
      scene.setChallengeData(mockChallenge);
      const checkboxes = container.querySelectorAll('.da-builder-objective-checkbox');
      checkboxes.forEach((cb) => {
        expect(cb.textContent).toBe('[ ]');
      });
    });

    it('should render Enter Lab button', () => {
      scene.mount(container);
      scene.setChallengeData(mockChallenge);
      expect(container.querySelector('.da-enter-lab-button')).not.toBeNull();
    });

    it('should render hidden completion message', () => {
      scene.mount(container);
      scene.setChallengeData(mockChallenge);
      const completion = container.querySelector('.da-builder-complete');
      expect(completion?.classList.contains('da-builder-complete--hidden')).toBe(true);
    });
  });

  describe('setDecisionContext', () => {
    it('should render decision context text', () => {
      scene.mount(container);
      scene.setDecisionContext('You decided to use segment registers. Now build it.');
      scene.setChallengeData(mockChallenge);
      const context = container.querySelector('.da-builder-decision-context-text');
      expect(context?.textContent).toBe('You decided to use segment registers. Now build it.');
    });
  });

  describe('setObjectiveComplete', () => {
    it('should update objective checkbox to complete', () => {
      scene.mount(container);
      scene.setChallengeData(mockChallenge);
      scene.setObjectiveComplete('obj-1', true);
      const item = container.querySelectorAll('.da-builder-objective-item')[0];
      const checkbox = item.querySelector('.da-builder-objective-checkbox');
      expect(checkbox?.textContent).toBe('[✓]');
    });

    it('should add complete class to objective item', () => {
      scene.mount(container);
      scene.setChallengeData(mockChallenge);
      scene.setObjectiveComplete('obj-1', true);
      const item = container.querySelectorAll('.da-builder-objective-item')[0];
      expect(item.classList.contains('da-builder-objective-item--complete')).toBe(true);
    });

    it('should update aria-checked attribute', () => {
      scene.mount(container);
      scene.setChallengeData(mockChallenge);
      scene.setObjectiveComplete('obj-2', true);
      const items = container.querySelectorAll('.da-builder-objective-item');
      expect(items[1].getAttribute('aria-checked')).toBe('true');
    });

    it('should handle unknown objective ID gracefully', () => {
      scene.mount(container);
      scene.setChallengeData(mockChallenge);
      expect(() => scene.setObjectiveComplete('nonexistent', true)).not.toThrow();
    });

    it('should not update if completed state unchanged', () => {
      scene.mount(container);
      scene.setChallengeData(mockChallenge);
      scene.setObjectiveComplete('obj-1', false); // Already false
      const item = container.querySelectorAll('.da-builder-objective-item')[0];
      expect(item.classList.contains('da-builder-objective-item--complete')).toBe(false);
    });
  });

  describe('getProgress', () => {
    it('should return 0/0 with no challenge data', () => {
      scene.mount(container);
      expect(scene.getProgress()).toEqual({ completed: 0, total: 0 });
    });

    it('should return correct progress counts', () => {
      scene.mount(container);
      scene.setChallengeData(mockChallenge);
      scene.setObjectiveComplete('obj-1', true);
      expect(scene.getProgress()).toEqual({ completed: 1, total: 3 });
    });
  });

  describe('isComplete', () => {
    it('should return false initially', () => {
      scene.mount(container);
      scene.setChallengeData(mockChallenge);
      expect(scene.isComplete()).toBe(false);
    });

    it('should return false with no challenge data', () => {
      scene.mount(container);
      expect(scene.isComplete()).toBe(false);
    });

    it('should return true when all objectives are complete', () => {
      scene.mount(container);
      scene.setChallengeData(mockChallenge);
      scene.setObjectiveComplete('obj-1', true);
      scene.setObjectiveComplete('obj-2', true);
      scene.setObjectiveComplete('obj-3', true);
      expect(scene.isComplete()).toBe(true);
    });
  });

  describe('completion', () => {
    it('should show completion message when all objectives done', () => {
      scene.mount(container);
      scene.setChallengeData(mockChallenge);
      scene.setObjectiveComplete('obj-1', true);
      scene.setObjectiveComplete('obj-2', true);
      scene.setObjectiveComplete('obj-3', true);
      const completion = container.querySelector('.da-builder-complete');
      expect(completion?.classList.contains('da-builder-complete--hidden')).toBe(false);
    });

    it('should show "You built it!" text', () => {
      scene.mount(container);
      scene.setChallengeData(mockChallenge);
      scene.setObjectiveComplete('obj-1', true);
      scene.setObjectiveComplete('obj-2', true);
      scene.setObjectiveComplete('obj-3', true);
      const text = container.querySelector('.da-builder-complete-text');
      expect(text?.textContent).toBe('You built it!');
    });

    it('should fire onComplete callback when continue is clicked', () => {
      const callback = vi.fn();
      scene.mount(container);
      scene.setChallengeData(mockChallenge);
      scene.onComplete(callback);
      scene.setObjectiveComplete('obj-1', true);
      scene.setObjectiveComplete('obj-2', true);
      scene.setObjectiveComplete('obj-3', true);
      const continueBtn = container.querySelector('.da-builder-complete-btn') as HTMLElement;
      continueBtn.click();
      expect(callback).toHaveBeenCalled();
    });

    it('should dispatch builder-challenge-complete event', () => {
      const handler = vi.fn();
      scene.mount(container);
      scene.setChallengeData(mockChallenge);
      container.addEventListener('builder-challenge-complete', handler);
      scene.setObjectiveComplete('obj-1', true);
      scene.setObjectiveComplete('obj-2', true);
      scene.setObjectiveComplete('obj-3', true);
      expect(handler).toHaveBeenCalled();
      container.removeEventListener('builder-challenge-complete', handler);
    });
  });

  describe('onEnterLab', () => {
    it('should fire callback when Enter Lab button is clicked', () => {
      const callback = vi.fn();
      scene.mount(container);
      scene.setChallengeData(mockChallenge);
      scene.onEnterLab(callback);
      const labBtn = container.querySelector('.da-enter-lab-button') as HTMLElement;
      labBtn.click();
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('should remove element from DOM', () => {
      scene.mount(container);
      scene.setChallengeData(mockChallenge);
      scene.destroy();
      expect(container.querySelector('.da-builder-mode-scene')).toBeNull();
    });

    it('should handle destroy before mount gracefully', () => {
      expect(() => scene.destroy()).not.toThrow();
    });
  });
});
