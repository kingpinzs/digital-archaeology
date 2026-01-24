// src/story/StoryModeContainer.test.ts
// Tests for StoryModeContainer component
// Story 10.1: Initial tests, Story 10.2: Updated for full layout
// Story 10.3: Add options pattern tests

import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { StoryModeContainer } from './StoryModeContainer';
import type { ThemeMode } from '@ui/theme';

describe('StoryModeContainer', () => {
  let container: HTMLElement;
  let storyContainer: StoryModeContainer;
  let mockOnModeChange: Mock<(mode: ThemeMode) => void>;

  const createStoryModeContainer = (currentMode: ThemeMode = 'story') => {
    mockOnModeChange = vi.fn<(mode: ThemeMode) => void>();
    return new StoryModeContainer({
      currentMode,
      onModeChange: mockOnModeChange,
    });
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    storyContainer?.destroy();
    container.remove();
  });

  describe('Task 1 & 6: Layout Structure', () => {
    it('should render container with correct class', () => {
      storyContainer = createStoryModeContainer();
      storyContainer.mount(container);

      const containerElement = container.querySelector('.da-story-mode-container');
      expect(containerElement).not.toBeNull();
    });

    it('should render nav mount point', () => {
      storyContainer = createStoryModeContainer();
      storyContainer.mount(container);

      const navMount = container.querySelector('[data-story-component="nav"]');
      expect(navMount).not.toBeNull();
    });

    it('should render panel mount point', () => {
      storyContainer = createStoryModeContainer();
      storyContainer.mount(container);

      const panelMount = container.querySelector('[data-story-component="panel"]');
      expect(panelMount).not.toBeNull();
    });

    it('should render content mount point', () => {
      storyContainer = createStoryModeContainer();
      storyContainer.mount(container);

      const contentMount = container.querySelector('[data-story-component="content"]');
      expect(contentMount).not.toBeNull();
    });

    it('should mount StoryNav component', () => {
      storyContainer = createStoryModeContainer();
      storyContainer.mount(container);

      const storyNav = container.querySelector('.da-story-nav');
      expect(storyNav).not.toBeNull();
    });

    it('should mount YourRolePanel component', () => {
      storyContainer = createStoryModeContainer();
      storyContainer.mount(container);

      const panel = container.querySelector('.da-your-role-panel');
      expect(panel).not.toBeNull();
    });

    it('should mount StoryContent component', () => {
      storyContainer = createStoryModeContainer();
      storyContainer.mount(container);

      const content = container.querySelector('.da-story-content');
      expect(content).not.toBeNull();
    });

    it('should use semantic HTML elements with implicit ARIA landmarks', () => {
      storyContainer = createStoryModeContainer();
      storyContainer.mount(container);

      // StoryNav uses <header> (implicit role="banner")
      const nav = container.querySelector('.da-story-nav');
      expect(nav?.tagName).toBe('HEADER');

      // YourRolePanel uses <aside> (implicit role="complementary")
      const panel = container.querySelector('.da-your-role-panel');
      expect(panel?.tagName).toBe('ASIDE');

      // StoryContent uses <main> (implicit role="main")
      const content = container.querySelector('.da-story-content');
      expect(content?.tagName).toBe('MAIN');
    });
  });

  describe('Task 6: Component Access', () => {
    it('should return StoryNav via getStoryNav()', () => {
      storyContainer = createStoryModeContainer();
      storyContainer.mount(container);

      const storyNav = storyContainer.getStoryNav();
      expect(storyNav).not.toBeNull();
      expect(storyNav?.getElement()?.classList.contains('da-story-nav')).toBe(true);
    });

    it('should return YourRolePanel via getYourRolePanel()', () => {
      storyContainer = createStoryModeContainer();
      storyContainer.mount(container);

      const panel = storyContainer.getYourRolePanel();
      expect(panel).not.toBeNull();
      expect(panel?.getElement()?.classList.contains('da-your-role-panel')).toBe(true);
    });

    it('should return StoryContent via getStoryContent()', () => {
      storyContainer = createStoryModeContainer();
      storyContainer.mount(container);

      const content = storyContainer.getStoryContent();
      expect(content).not.toBeNull();
      expect(content?.getElement()?.classList.contains('da-story-content')).toBe(true);
    });
  });

  describe('Task 6: Visibility Control', () => {
    it('should be visible by default', () => {
      storyContainer = createStoryModeContainer();
      storyContainer.mount(container);

      expect(storyContainer.isVisible()).toBe(true);
    });

    it('should hide when hide() is called', () => {
      storyContainer = createStoryModeContainer();
      storyContainer.mount(container);

      storyContainer.hide();

      expect(storyContainer.isVisible()).toBe(false);
      const element = container.querySelector('.da-story-mode-container');
      expect(element?.classList.contains('da-story-mode-container--hidden')).toBe(true);
    });

    it('should show when show() is called', () => {
      storyContainer = createStoryModeContainer();
      storyContainer.mount(container);
      storyContainer.hide();

      storyContainer.show();

      expect(storyContainer.isVisible()).toBe(true);
      const element = container.querySelector('.da-story-mode-container');
      expect(element?.classList.contains('da-story-mode-container--hidden')).toBe(false);
    });

    it('should propagate hide() to child components', () => {
      storyContainer = createStoryModeContainer();
      storyContainer.mount(container);

      storyContainer.hide();

      // Child components should also be hidden
      expect(storyContainer.getStoryNav()?.isVisible()).toBe(false);
      expect(storyContainer.getYourRolePanel()?.isVisible()).toBe(false);
      expect(storyContainer.getStoryContent()?.isVisible()).toBe(false);
    });

    it('should propagate show() to child components', () => {
      storyContainer = createStoryModeContainer();
      storyContainer.mount(container);
      storyContainer.hide();

      storyContainer.show();

      // Child components should also be shown
      expect(storyContainer.getStoryNav()?.isVisible()).toBe(true);
      expect(storyContainer.getYourRolePanel()?.isVisible()).toBe(true);
      expect(storyContainer.getStoryContent()?.isVisible()).toBe(true);
    });
  });

  describe('Task 6: Cleanup', () => {
    it('should remove element from DOM on destroy', () => {
      storyContainer = createStoryModeContainer();
      storyContainer.mount(container);

      expect(container.querySelector('.da-story-mode-container')).not.toBeNull();

      storyContainer.destroy();

      expect(container.querySelector('.da-story-mode-container')).toBeNull();
    });

    it('should destroy child components on destroy', () => {
      storyContainer = createStoryModeContainer();
      storyContainer.mount(container);

      storyContainer.destroy();

      // All child components should be removed from DOM
      expect(container.querySelector('.da-story-nav')).toBeNull();
      expect(container.querySelector('.da-your-role-panel')).toBeNull();
      expect(container.querySelector('.da-story-content')).toBeNull();
    });

    it('should return null from getters after destroy', () => {
      storyContainer = createStoryModeContainer();
      storyContainer.mount(container);
      storyContainer.destroy();

      expect(storyContainer.getStoryNav()).toBeNull();
      expect(storyContainer.getYourRolePanel()).toBeNull();
      expect(storyContainer.getStoryContent()).toBeNull();
    });
  });

  // Legacy tests from Story 10.1 (backward compatibility)
  describe('Legacy Story 10.1 Tests', () => {
    it('should render chapter title in content', () => {
      storyContainer = createStoryModeContainer();
      storyContainer.mount(container);

      const title = container.querySelector('.da-story-chapter-title');
      expect(title?.textContent).toContain('Chapter 1');
    });

    it('should render "Enter the Lab" button', () => {
      storyContainer = createStoryModeContainer();
      storyContainer.mount(container);

      const btn = container.querySelector('.da-story-enter-lab-btn');
      expect(btn).not.toBeNull();
    });
  });

  // Story 10.3: Options Pattern Tests
  describe('Story 10.3: Options Pattern', () => {
    it('should accept currentMode and onModeChange options', () => {
      storyContainer = createStoryModeContainer('story');
      storyContainer.mount(container);

      // Should mount without error
      expect(container.querySelector('.da-story-mode-container')).not.toBeNull();
    });

    it('should pass options to StoryNav', () => {
      storyContainer = createStoryModeContainer('story');
      storyContainer.mount(container);

      // StoryNav should have ModeToggle mounted
      const modeToggle = container.querySelector('.da-mode-toggle');
      expect(modeToggle).not.toBeNull();
    });

    it('should propagate mode change callback to StoryNav', () => {
      storyContainer = createStoryModeContainer('story');
      storyContainer.mount(container);

      const labBtn = container.querySelector('[data-mode="lab"]') as HTMLButtonElement;
      labBtn.click();

      expect(mockOnModeChange).toHaveBeenCalledWith('lab');
    });

    it('should update StoryNav toggle state via setMode()', () => {
      storyContainer = createStoryModeContainer('story');
      storyContainer.mount(container);

      storyContainer.setMode('lab');

      const labBtn = container.querySelector('[data-mode="lab"]');
      expect(labBtn?.getAttribute('aria-selected')).toBe('true');
    });
  });
});
