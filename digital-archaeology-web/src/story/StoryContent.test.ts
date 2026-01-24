// src/story/StoryContent.test.ts
// Tests for StoryContent component
// Story 10.2: Create Story Mode Layout

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

  describe('Task 4: Component Rendering', () => {
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

    it('should render content wrapper for max-width', () => {
      content = new StoryContent();
      content.mount(container);

      const wrapper = container.querySelector('.da-story-content-wrapper');
      expect(wrapper).not.toBeNull();
    });

    it('should render chapter header placeholder', () => {
      content = new StoryContent();
      content.mount(container);

      const chapterHeader = container.querySelector('.da-story-chapter-header-placeholder');
      expect(chapterHeader).not.toBeNull();
    });

    it('should render chapter era text', () => {
      content = new StoryContent();
      content.mount(container);

      const era = container.querySelector('.da-story-chapter-era');
      expect(era?.textContent).toContain('1971');
    });

    it('should render chapter title "Chapter 1: First Day"', () => {
      content = new StoryContent();
      content.mount(container);

      const title = container.querySelector('.da-story-chapter-title');
      expect(title?.textContent).toBe('Chapter 1: First Day');
    });

    it('should render chapter subtitle', () => {
      content = new StoryContent();
      content.mount(container);

      const subtitle = container.querySelector('.da-story-chapter-subtitle');
      expect(subtitle?.textContent).toContain('Fairchild Semiconductor');
    });

    it('should render scene setting section', () => {
      content = new StoryContent();
      content.mount(container);

      const sceneSetting = container.querySelector('.da-story-scene-setting');
      expect(sceneSetting).not.toBeNull();

      const sceneText = container.querySelector('.da-story-scene-text');
      expect(sceneText?.textContent).toContain('fluorescent lights');
    });

    it('should render narrative section', () => {
      content = new StoryContent();
      content.mount(container);

      const narrative = container.querySelector('.da-story-narrative');
      expect(narrative).not.toBeNull();
    });

    it('should render "Enter the Lab" button', () => {
      content = new StoryContent();
      content.mount(container);

      const labButton = container.querySelector('.da-story-enter-lab-btn');
      expect(labButton).not.toBeNull();
      expect(labButton?.textContent).toBe('Enter the Lab');
      expect(labButton?.getAttribute('aria-label')).toBe('Switch to Lab Mode');
    });
  });

  describe('Task 4: Visibility Control', () => {
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

  describe('Task 4: Element Access', () => {
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

  describe('Task 4: Cleanup', () => {
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
