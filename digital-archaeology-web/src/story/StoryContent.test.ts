// src/story/StoryContent.test.ts
// Tests for StoryContent component
// Story 10.2: Create Story Mode Layout
// Story 10.17: Wire Story Mode Integration - Updated for dynamic content

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StoryContent } from './StoryContent';

describe('StoryContent', () => {
  let container: HTMLElement;
  let content: StoryContent;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    content?.destroy();
    container.remove();
  });

  describe('Task 3: Component Rendering', () => {
    it('should render content area with correct class', () => {
      content = new StoryContent();
      content.mount(container);

      const contentElement = container.querySelector('.da-story-content');
      expect(contentElement).not.toBeNull();
    });

    it('should render as a main element', () => {
      content = new StoryContent();
      content.mount(container);

      const main = container.querySelector('main.da-story-content');
      expect(main).not.toBeNull();
    });

    it('should use semantic <main> element (implicit role="main")', () => {
      content = new StoryContent();
      content.mount(container);

      const contentElement = container.querySelector('.da-story-content');
      expect(contentElement?.tagName).toBe('MAIN');
      // Note: <main> has implicit role="main" per ARIA spec
    });

    it('should have aria-label for accessibility', () => {
      content = new StoryContent();
      content.mount(container);

      const contentElement = container.querySelector('.da-story-content');
      expect(contentElement?.getAttribute('aria-label')).toBe('Story content');
    });

    it('should have aria-live for screen reader announcements', () => {
      content = new StoryContent();
      content.mount(container);

      const contentElement = container.querySelector('.da-story-content');
      expect(contentElement?.getAttribute('aria-live')).toBe('polite');
    });

    it('should render content wrapper for max-width', () => {
      content = new StoryContent();
      content.mount(container);

      const wrapper = container.querySelector('.da-story-content-wrapper');
      expect(wrapper).not.toBeNull();
    });

    it('should render scene mount point for dynamic content', () => {
      content = new StoryContent();
      content.mount(container);

      const sceneMount = container.querySelector('.da-story-scene-mount');
      expect(sceneMount).not.toBeNull();
    });

    it('should have data attribute on scene mount', () => {
      content = new StoryContent();
      content.mount(container);

      const sceneMount = container.querySelector('[data-story-component="scene"]');
      expect(sceneMount).not.toBeNull();
    });
  });

  describe('Task 3: Scene Mount Point', () => {
    it('should return scene mount via getSceneMount()', () => {
      content = new StoryContent();
      content.mount(container);

      const sceneMount = content.getSceneMount();
      expect(sceneMount).not.toBeNull();
      expect(sceneMount?.classList.contains('da-story-scene-mount')).toBe(true);
    });

    it('should return null from getSceneMount() before mounting', () => {
      content = new StoryContent();
      expect(content.getSceneMount()).toBeNull();
    });

    it('should return null from getSceneMount() after destroy', () => {
      content = new StoryContent();
      content.mount(container);
      content.destroy();

      expect(content.getSceneMount()).toBeNull();
    });
  });

  describe('Task 3: Visibility Control', () => {
    it('should be visible by default', () => {
      content = new StoryContent();
      content.mount(container);

      expect(content.isVisible()).toBe(true);
    });

    it('should hide when hide() is called', () => {
      content = new StoryContent();
      content.mount(container);

      content.hide();

      expect(content.isVisible()).toBe(false);
      const contentElement = container.querySelector('.da-story-content');
      expect(contentElement?.classList.contains('da-story-content--hidden')).toBe(true);
    });

    it('should show when show() is called', () => {
      content = new StoryContent();
      content.mount(container);
      content.hide();

      content.show();

      expect(content.isVisible()).toBe(true);
      const contentElement = container.querySelector('.da-story-content');
      expect(contentElement?.classList.contains('da-story-content--hidden')).toBe(false);
    });
  });

  describe('Task 3: Element Access', () => {
    it('should return element via getElement()', () => {
      content = new StoryContent();
      content.mount(container);

      const element = content.getElement();
      expect(element).not.toBeNull();
      expect(element?.classList.contains('da-story-content')).toBe(true);
    });

    it('should return null before mounting', () => {
      content = new StoryContent();
      expect(content.getElement()).toBeNull();
    });

    it('should return false from isVisible() before mounting', () => {
      content = new StoryContent();
      expect(content.isVisible()).toBe(false);
    });
  });

  describe('Task 3: Cleanup', () => {
    it('should remove element from DOM on destroy', () => {
      content = new StoryContent();
      content.mount(container);

      expect(container.querySelector('.da-story-content')).not.toBeNull();

      content.destroy();

      expect(container.querySelector('.da-story-content')).toBeNull();
    });

    it('should return null from getElement() after destroy', () => {
      content = new StoryContent();
      content.mount(container);
      content.destroy();

      expect(content.getElement()).toBeNull();
    });
  });
});
