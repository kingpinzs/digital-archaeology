// src/story/StoryNav.test.ts
// Tests for StoryNav component
// Story 10.2: Create Story Mode Layout
// Story 10.3: Add ModeToggle integration and Journal button tests
// Story 10.16: Add EraBadge and ProgressDots integration tests

import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { StoryNav } from './StoryNav';
import type { ThemeMode } from '@ui/theme';
import type { StoryProgress } from './StoryState';

describe('StoryNav', () => {
  let container: HTMLElement;
  let storyNav: StoryNav;
  let mockOnModeChange: Mock<(mode: ThemeMode) => void>;

  const createStoryNav = (currentMode: ThemeMode = 'story', options?: {
    initialEra?: string;
    getEraForAct?: (actNumber: number) => string;
  }) => {
    mockOnModeChange = vi.fn<(mode: ThemeMode) => void>();
    return new StoryNav({
      currentMode,
      onModeChange: mockOnModeChange,
      ...options,
    });
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    storyNav?.destroy();
    container.remove();
  });

  describe('Task 2: Component Rendering', () => {
    it('should render navigation bar with correct class', () => {
      storyNav = createStoryNav();
      storyNav.mount(container);

      const nav = container.querySelector('.da-story-nav');
      expect(nav).not.toBeNull();
    });

    it('should render as a header element', () => {
      storyNav = createStoryNav();
      storyNav.mount(container);

      const header = container.querySelector('header.da-story-nav');
      expect(header).not.toBeNull();
    });

    it('should use semantic <header> element (implicit role="banner")', () => {
      storyNav = createStoryNav();
      storyNav.mount(container);

      const nav = container.querySelector('.da-story-nav');
      expect(nav?.tagName).toBe('HEADER');
      // Note: <header> has implicit role="banner" per ARIA spec
    });

    it('should have aria-label for accessibility', () => {
      storyNav = createStoryNav();
      storyNav.mount(container);

      const nav = container.querySelector('.da-story-nav');
      expect(nav?.getAttribute('aria-label')).toBe('Story mode navigation');
    });

    it('should render logo text "Digital Archaeology"', () => {
      storyNav = createStoryNav();
      storyNav.mount(container);

      const logo = container.querySelector('.da-story-nav-logo');
      expect(logo?.textContent).toBe('Digital Archaeology');
    });

    it('should render progress dots section', () => {
      storyNav = createStoryNav();
      storyNav.mount(container);

      const progressDots = container.querySelector('.da-story-nav-progress-dots');
      expect(progressDots).not.toBeNull();

      const dots = container.querySelectorAll('.da-progress-dot');
      expect(dots.length).toBe(5);
    });

    it('should have first progress dot marked as active', () => {
      storyNav = createStoryNav();
      storyNav.mount(container);

      const activeDot = container.querySelector('.da-progress-dot--active');
      expect(activeDot).not.toBeNull();
    });

    it('should render era badge with year "1971"', () => {
      storyNav = createStoryNav();
      storyNav.mount(container);

      const eraBadge = container.querySelector('.da-story-nav-era-badge');
      expect(eraBadge?.textContent).toBe('1971');
    });

    it('should render Save button', () => {
      storyNav = createStoryNav();
      storyNav.mount(container);

      const buttons = container.querySelectorAll('.da-story-nav-action');
      const saveButton = buttons[buttons.length - 1]; // Save is the last button
      expect(saveButton?.textContent).toBe('Save');
      expect(saveButton?.getAttribute('aria-label')).toBe('Save progress');
    });
  });

  describe('Task 2: Visibility Control', () => {
    it('should be visible by default', () => {
      storyNav = createStoryNav();
      storyNav.mount(container);

      expect(storyNav.isVisible()).toBe(true);
    });

    it('should hide when hide() is called', () => {
      storyNav = createStoryNav();
      storyNav.mount(container);

      storyNav.hide();

      expect(storyNav.isVisible()).toBe(false);
      const nav = container.querySelector('.da-story-nav');
      expect(nav?.classList.contains('da-story-nav--hidden')).toBe(true);
    });

    it('should show when show() is called', () => {
      storyNav = createStoryNav();
      storyNav.mount(container);
      storyNav.hide();

      storyNav.show();

      expect(storyNav.isVisible()).toBe(true);
      const nav = container.querySelector('.da-story-nav');
      expect(nav?.classList.contains('da-story-nav--hidden')).toBe(false);
    });
  });

  describe('Task 2: Element Access', () => {
    it('should return element via getElement()', () => {
      storyNav = createStoryNav();
      storyNav.mount(container);

      const element = storyNav.getElement();
      expect(element).not.toBeNull();
      expect(element?.classList.contains('da-story-nav')).toBe(true);
    });

    it('should return null before mounting', () => {
      storyNav = createStoryNav();
      expect(storyNav.getElement()).toBeNull();
    });

    it('should return false from isVisible() before mounting', () => {
      storyNav = createStoryNav();
      expect(storyNav.isVisible()).toBe(false);
    });
  });

  describe('Task 2: Cleanup', () => {
    it('should remove element from DOM on destroy', () => {
      storyNav = createStoryNav();
      storyNav.mount(container);

      expect(container.querySelector('.da-story-nav')).not.toBeNull();

      storyNav.destroy();

      expect(container.querySelector('.da-story-nav')).toBeNull();
    });

    it('should return null from getElement() after destroy', () => {
      storyNav = createStoryNav();
      storyNav.mount(container);
      storyNav.destroy();

      expect(storyNav.getElement()).toBeNull();
    });
  });

  // Story 10.3: ModeToggle Integration Tests
  describe('Task 1: ModeToggle Integration (Story 10.3)', () => {
    it('should accept currentMode and onModeChange options', () => {
      storyNav = createStoryNav('story');
      storyNav.mount(container);

      // Should mount without error
      expect(container.querySelector('.da-story-nav')).not.toBeNull();
    });

    it('should mount ModeToggle in toggle area', () => {
      storyNav = createStoryNav();
      storyNav.mount(container);

      const modeToggle = container.querySelector('.da-mode-toggle');
      expect(modeToggle).not.toBeNull();
    });

    it('should render ModeToggle with tablist role', () => {
      storyNav = createStoryNav();
      storyNav.mount(container);

      const modeToggle = container.querySelector('.da-mode-toggle');
      expect(modeToggle?.getAttribute('role')).toBe('tablist');
    });

    it('should render Story and Lab toggle buttons', () => {
      storyNav = createStoryNav();
      storyNav.mount(container);

      const storyBtn = container.querySelector('[data-mode="story"]');
      const labBtn = container.querySelector('[data-mode="lab"]');

      expect(storyBtn).not.toBeNull();
      expect(labBtn).not.toBeNull();
    });

    it('should call onModeChange when clicking toggle button', () => {
      storyNav = createStoryNav('story');
      storyNav.mount(container);

      const labBtn = container.querySelector('[data-mode="lab"]') as HTMLButtonElement;
      labBtn.click();

      expect(mockOnModeChange).toHaveBeenCalledWith('lab');
    });

    it('should update toggle state via setMode()', () => {
      storyNav = createStoryNav('story');
      storyNav.mount(container);

      storyNav.setMode('lab');

      const labBtn = container.querySelector('[data-mode="lab"]');
      expect(labBtn?.getAttribute('aria-selected')).toBe('true');
    });

    it('should clean up ModeToggle on destroy', () => {
      storyNav = createStoryNav();
      storyNav.mount(container);

      expect(container.querySelector('.da-mode-toggle')).not.toBeNull();

      storyNav.destroy();

      expect(container.querySelector('.da-mode-toggle')).toBeNull();
    });
  });

  // Story 10.3: Keyboard Navigation Tests
  describe('Task 1: Keyboard Navigation (Story 10.3)', () => {
    it('should navigate between toggle buttons with Arrow keys', () => {
      storyNav = createStoryNav('story');
      storyNav.mount(container);

      const storyBtn = container.querySelector('[data-mode="story"]') as HTMLButtonElement;
      storyBtn.focus();

      // Simulate ArrowRight to switch to lab
      const event = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
      });
      storyBtn.dispatchEvent(event);

      expect(mockOnModeChange).toHaveBeenCalledWith('lab');
    });

    it('should have correct tabindex on active button', () => {
      storyNav = createStoryNav('story');
      storyNav.mount(container);

      const storyBtn = container.querySelector('[data-mode="story"]');
      const labBtn = container.querySelector('[data-mode="lab"]');

      expect(storyBtn?.getAttribute('tabindex')).toBe('0');
      expect(labBtn?.getAttribute('tabindex')).toBe('-1');
    });

    it('should activate toggle button with Enter key', () => {
      storyNav = createStoryNav('story');
      storyNav.mount(container);

      const labBtn = container.querySelector('[data-mode="lab"]') as HTMLButtonElement;
      labBtn.focus();

      // Simulate Enter key to activate
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
      });
      labBtn.dispatchEvent(event);

      expect(mockOnModeChange).toHaveBeenCalledWith('lab');
    });

    it('should activate toggle button with Space key', () => {
      storyNav = createStoryNav('story');
      storyNav.mount(container);

      const labBtn = container.querySelector('[data-mode="lab"]') as HTMLButtonElement;
      labBtn.focus();

      // Simulate Space key to activate
      const event = new KeyboardEvent('keydown', {
        key: ' ',
        bubbles: true,
      });
      labBtn.dispatchEvent(event);

      expect(mockOnModeChange).toHaveBeenCalledWith('lab');
    });
  });

  // Story 10.3: Journal Button Tests
  describe('Task 2: Journal Button (Story 10.3)', () => {
    it('should render Journal button', () => {
      storyNav = createStoryNav();
      storyNav.mount(container);

      const buttons = container.querySelectorAll('.da-story-nav-action');
      const journalButton = Array.from(buttons).find(
        (btn) => btn.textContent === 'Journal'
      );

      expect(journalButton).not.toBeNull();
    });

    it('should have type="button" on Journal button', () => {
      storyNav = createStoryNav();
      storyNav.mount(container);

      const buttons = container.querySelectorAll('.da-story-nav-action');
      const journalButton = Array.from(buttons).find(
        (btn) => btn.textContent === 'Journal'
      ) as HTMLButtonElement;

      expect(journalButton?.type).toBe('button');
    });

    it('should have aria-label on Journal button', () => {
      storyNav = createStoryNav();
      storyNav.mount(container);

      const buttons = container.querySelectorAll('.da-story-nav-action');
      const journalButton = Array.from(buttons).find(
        (btn) => btn.textContent === 'Journal'
      );

      expect(journalButton?.getAttribute('aria-label')).toBe('Open journal');
    });

    it('should position Journal button before Save button', () => {
      storyNav = createStoryNav();
      storyNav.mount(container);

      const buttons = container.querySelectorAll('.da-story-nav-action');
      expect(buttons.length).toBe(2);
      expect(buttons[0].textContent).toBe('Journal');
      expect(buttons[1].textContent).toBe('Save');
    });
  });

  // Story 10.16: EraBadge and ProgressDots Integration Tests
  describe('Task 4: EraBadge Integration (Story 10.16)', () => {
    it('should render EraBadge component', () => {
      storyNav = createStoryNav();
      storyNav.mount(container);

      const eraBadge = storyNav.getEraBadge();
      expect(eraBadge).not.toBeNull();
    });

    it('should use initialEra option', () => {
      storyNav = createStoryNav('story', { initialEra: '1985' });
      storyNav.mount(container);

      const eraBadge = container.querySelector('.da-story-nav-era-badge');
      expect(eraBadge?.textContent).toBe('1985');
    });

    it('should update era via setEra()', () => {
      storyNav = createStoryNav();
      storyNav.mount(container);

      storyNav.setEra('2000', 'New Millennium');

      const eraBadge = container.querySelector('.da-story-nav-era-badge');
      expect(eraBadge?.textContent).toBe('2000 - New Millennium');
    });

    it('should clean up EraBadge on destroy', () => {
      storyNav = createStoryNav();
      storyNav.mount(container);

      expect(storyNav.getEraBadge()).not.toBeNull();

      storyNav.destroy();

      expect(storyNav.getEraBadge()).toBeNull();
    });
  });

  describe('Task 4: ProgressDots Integration (Story 10.16)', () => {
    it('should render ProgressDots component', () => {
      storyNav = createStoryNav();
      storyNav.mount(container);

      const progressDots = storyNav.getProgressDots();
      expect(progressDots).not.toBeNull();
    });

    it('should initialize with act 1 as current', () => {
      storyNav = createStoryNav();
      storyNav.mount(container);

      const dots = container.querySelectorAll('.da-progress-dot');
      expect(dots[0].classList.contains('da-progress-dot--active')).toBe(true);
    });

    it('should update progress via setProgressAct()', () => {
      storyNav = createStoryNav();
      storyNav.mount(container);

      storyNav.setProgressAct(3, 5);

      const dots = container.querySelectorAll('.da-progress-dot');
      // Acts 1 and 2 should be completed
      expect(dots[0].classList.contains('da-progress-dot--completed')).toBe(true);
      expect(dots[1].classList.contains('da-progress-dot--completed')).toBe(true);
      // Act 3 should be active
      expect(dots[2].classList.contains('da-progress-dot--active')).toBe(true);
    });

    it('should clean up ProgressDots on destroy', () => {
      storyNav = createStoryNav();
      storyNav.mount(container);

      expect(storyNav.getProgressDots()).not.toBeNull();

      storyNav.destroy();

      expect(storyNav.getProgressDots()).toBeNull();
    });
  });

  describe('Task 4: updateFromProgress Method (Story 10.16)', () => {
    it('should update progress dots when updateFromProgress called', () => {
      storyNav = createStoryNav();
      storyNav.mount(container);

      const progress: StoryProgress = {
        position: {
          actNumber: 4,
          chapterNumber: 1,
          sceneId: 'test-scene',
        },
        choices: [],
        discoveredItems: [],
        startedAt: Date.now(),
        lastPlayedAt: Date.now(),
      };

      storyNav.updateFromProgress(progress);

      const dots = container.querySelectorAll('.da-progress-dot');
      // Acts 1, 2, 3 should be completed
      expect(dots[0].classList.contains('da-progress-dot--completed')).toBe(true);
      expect(dots[1].classList.contains('da-progress-dot--completed')).toBe(true);
      expect(dots[2].classList.contains('da-progress-dot--completed')).toBe(true);
      // Act 4 should be active
      expect(dots[3].classList.contains('da-progress-dot--active')).toBe(true);
    });

    it('should reset to initial state when progress is null', () => {
      storyNav = createStoryNav('story', { initialEra: '1971' });
      storyNav.mount(container);

      // First advance to act 3
      storyNav.setProgressAct(3);

      // Then clear progress
      storyNav.updateFromProgress(null);

      // Should reset to act 1
      const dots = container.querySelectorAll('.da-progress-dot');
      expect(dots[0].classList.contains('da-progress-dot--active')).toBe(true);
      expect(dots[1].classList.contains('da-progress-dot--completed')).toBe(false);
    });

    it('should update era via getEraForAct callback', () => {
      const getEraForAct = vi.fn((act: number) => {
        const eras: Record<number, string> = { 1: '1971', 2: '1978', 3: '1985' };
        return eras[act] ?? '????';
      });

      storyNav = createStoryNav('story', { getEraForAct });
      storyNav.mount(container);

      const progress: StoryProgress = {
        position: {
          actNumber: 2,
          chapterNumber: 1,
          sceneId: 'test-scene',
        },
        choices: [],
        discoveredItems: [],
        startedAt: Date.now(),
        lastPlayedAt: Date.now(),
      };

      storyNav.updateFromProgress(progress);

      expect(getEraForAct).toHaveBeenCalledWith(2);
      const eraBadge = container.querySelector('.da-story-nav-era-badge');
      expect(eraBadge?.textContent).toBe('1978');
    });
  });

  describe('Task 4: Event Subscription (Story 10.16)', () => {
    it('should update when story-state-changed event fires', () => {
      storyNav = createStoryNav();
      storyNav.mount(container);

      const progress: StoryProgress = {
        position: {
          actNumber: 5,
          chapterNumber: 1,
          sceneId: 'final-scene',
        },
        choices: [],
        discoveredItems: [],
        startedAt: Date.now(),
        lastPlayedAt: Date.now(),
      };

      // Dispatch event
      const event = new CustomEvent('story-state-changed', {
        detail: { progress, previousSceneId: null },
      });
      window.dispatchEvent(event);

      const dots = container.querySelectorAll('.da-progress-dot');
      // All previous acts should be completed
      expect(dots[0].classList.contains('da-progress-dot--completed')).toBe(true);
      expect(dots[1].classList.contains('da-progress-dot--completed')).toBe(true);
      expect(dots[2].classList.contains('da-progress-dot--completed')).toBe(true);
      expect(dots[3].classList.contains('da-progress-dot--completed')).toBe(true);
      // Act 5 should be active
      expect(dots[4].classList.contains('da-progress-dot--active')).toBe(true);
    });

    it('should unsubscribe from events on destroy', () => {
      storyNav = createStoryNav();
      storyNav.mount(container);
      storyNav.destroy();

      const progress: StoryProgress = {
        position: {
          actNumber: 3,
          chapterNumber: 1,
          sceneId: 'test-scene',
        },
        choices: [],
        discoveredItems: [],
        startedAt: Date.now(),
        lastPlayedAt: Date.now(),
      };

      // This should not throw or update anything since nav is destroyed
      const event = new CustomEvent('story-state-changed', {
        detail: { progress, previousSceneId: null },
      });
      window.dispatchEvent(event);

      // No error means unsubscribe worked
      expect(storyNav.getElement()).toBeNull();
    });
  });

  describe('Task 7: Accessibility - Progress Dots (Story 10.16)', () => {
    it('should have correct aria-labels on progress dots', () => {
      storyNav = createStoryNav();
      storyNav.mount(container);
      storyNav.setProgressAct(3, 5);

      const dots = container.querySelectorAll('.da-progress-dot');

      // Completed acts
      expect(dots[0].getAttribute('aria-label')).toBe('Completed, Act 1 of 5');
      expect(dots[1].getAttribute('aria-label')).toBe('Completed, Act 2 of 5');

      // Current act
      expect(dots[2].getAttribute('aria-label')).toBe('Current act, Act 3 of 5');

      // Pending acts
      expect(dots[3].getAttribute('aria-label')).toBe('Act 4 of 5');
      expect(dots[4].getAttribute('aria-label')).toBe('Act 5 of 5');
    });
  });
});
