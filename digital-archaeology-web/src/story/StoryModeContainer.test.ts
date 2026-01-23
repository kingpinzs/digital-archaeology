// src/story/StoryModeContainer.test.ts
// Tests for StoryModeContainer component

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StoryModeContainer } from './StoryModeContainer';

describe('StoryModeContainer', () => {
  let container: HTMLElement;
  let storyContainer: StoryModeContainer;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    storyContainer?.destroy();
    container.remove();
  });

  describe('Task 3: Component Rendering', () => {
    it('should render placeholder content', () => {
      storyContainer = new StoryModeContainer();
      storyContainer.mount(container);

      const placeholder = container.querySelector('.da-story-placeholder');
      expect(placeholder).not.toBeNull();
    });

    it('should render icon with scroll emoji', () => {
      storyContainer = new StoryModeContainer();
      storyContainer.mount(container);

      const icon = container.querySelector('.da-story-placeholder-icon');
      expect(icon?.textContent).toContain('📜');
    });

    it('should render "Story Mode" title', () => {
      storyContainer = new StoryModeContainer();
      storyContainer.mount(container);

      const title = container.querySelector('.da-story-placeholder-title');
      expect(title?.textContent).toBe('Story Mode');
    });

    it('should render "Coming Soon" subtitle', () => {
      storyContainer = new StoryModeContainer();
      storyContainer.mount(container);

      const subtitle = container.querySelector('.da-story-placeholder-subtitle');
      expect(subtitle?.textContent).toBe('Coming Soon');
    });

    it('should render description text', () => {
      storyContainer = new StoryModeContainer();
      storyContainer.mount(container);

      const description = container.querySelector('.da-story-placeholder-description');
      expect(description?.textContent).toContain('narrative journey');
    });
  });

  describe('Task 3: Visibility Control', () => {
    it('should be visible by default', () => {
      storyContainer = new StoryModeContainer();
      storyContainer.mount(container);

      expect(storyContainer.isVisible()).toBe(true);
    });

    it('should hide when hide() is called', () => {
      storyContainer = new StoryModeContainer();
      storyContainer.mount(container);

      storyContainer.hide();

      expect(storyContainer.isVisible()).toBe(false);
      const element = container.querySelector('.da-story-mode-container');
      expect(element?.classList.contains('da-story-mode-container--hidden')).toBe(true);
    });

    it('should show when show() is called', () => {
      storyContainer = new StoryModeContainer();
      storyContainer.mount(container);
      storyContainer.hide();

      storyContainer.show();

      expect(storyContainer.isVisible()).toBe(true);
      const element = container.querySelector('.da-story-mode-container');
      expect(element?.classList.contains('da-story-mode-container--hidden')).toBe(false);
    });
  });

  describe('Task 3: Cleanup', () => {
    it('should remove element from DOM on destroy', () => {
      storyContainer = new StoryModeContainer();
      storyContainer.mount(container);

      expect(container.querySelector('.da-story-mode-container')).not.toBeNull();

      storyContainer.destroy();

      expect(container.querySelector('.da-story-mode-container')).toBeNull();
    });
  });
});
