// src/story/StoryBrowser.test.ts
// Tests for StoryBrowser modal component

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StoryBrowser } from './StoryBrowser';
import type { StoryBrowserData, StoryBrowserCallbacks } from './StoryBrowser';
import type { StoryAct } from './content-types';
import type { StoryProgress } from './StoryState';

describe('StoryBrowser', () => {
  let browser: StoryBrowser;
  let callbacks: StoryBrowserCallbacks;
  let mockData: StoryBrowserData;

  const createMockAct = (number: number): StoryAct => ({
    id: `act-${number}`,
    number,
    title: `Act ${number} Title`,
    description: `Description for act ${number}`,
    era: `19${70 + number}`,
    cpuStage: 'micro4',
    chapters: [
      {
        id: `chapter-${number}-1`,
        number: 1,
        title: 'Chapter 1',
        subtitle: 'Subtitle',
        year: `19${70 + number}`,
        scenes: [
          { id: `scene-${number}-1-1`, type: 'narrative', nextScene: `scene-${number}-1-2` },
          { id: `scene-${number}-1-2`, type: 'dialogue', nextScene: `scene-${number}-1-3` },
          { id: `scene-${number}-1-3`, type: 'choice' },
        ],
      },
      {
        id: `chapter-${number}-2`,
        number: 2,
        title: 'Chapter 2',
        subtitle: 'Subtitle 2',
        year: `19${70 + number}`,
        scenes: [
          { id: `scene-${number}-2-1`, type: 'narrative' },
        ],
      },
    ],
  });

  const createMockProgress = (actNumber: number, chapterNumber: number, sceneId: string): StoryProgress => ({
    position: { actNumber, chapterNumber, sceneId },
    choices: [],
    discoveredItems: [],
    startedAt: Date.now(),
    lastPlayedAt: Date.now(),
  });

  beforeEach(() => {
    callbacks = {
      onSceneSelect: vi.fn(),
      onClose: vi.fn(),
    };

    mockData = {
      acts: [createMockAct(0), createMockAct(1), createMockAct(2)],
      progress: createMockProgress(1, 1, 'scene-1-1-2'),
      visitedScenes: new Set(['scene-0-1-1', 'scene-0-1-2', 'scene-1-1-1', 'scene-1-1-2']),
    };

    browser = new StoryBrowser();
    browser.setCallbacks(callbacks);
  });

  afterEach(() => {
    browser.destroy();
    // Clean up any lingering DOM elements
    document.querySelectorAll('.da-story-browser-backdrop').forEach(el => el.remove());
  });

  describe('open', () => {
    it('should create backdrop and modal when opened', () => {
      browser.open(mockData);

      expect(document.querySelector('.da-story-browser-backdrop')).not.toBeNull();
      expect(document.querySelector('.da-story-browser')).not.toBeNull();
    });

    it('should render all acts', () => {
      browser.open(mockData);

      const actHeaders = document.querySelectorAll('.da-story-browser-act-header');
      expect(actHeaders.length).toBe(3);
    });

    it('should expand current act by default', () => {
      browser.open(mockData);

      // Act 1 should be expanded (current act)
      const acts = document.querySelectorAll('.da-story-browser-act');
      const act1 = acts[1];
      const chaptersContainer = act1.querySelector('.da-story-browser-chapters');
      expect(chaptersContainer?.classList.contains('da-story-browser-chapters--collapsed')).toBe(false);
    });

    it('should collapse non-current acts by default', () => {
      browser.open(mockData);

      // Act 0 should be collapsed (not current)
      const acts = document.querySelectorAll('.da-story-browser-act');
      const act0 = acts[0];
      const chaptersContainer = act0.querySelector('.da-story-browser-chapters');
      expect(chaptersContainer?.classList.contains('da-story-browser-chapters--collapsed')).toBe(true);
    });

    it('should highlight current act header', () => {
      browser.open(mockData);

      const actHeaders = document.querySelectorAll('.da-story-browser-act-header');
      expect(actHeaders[1].classList.contains('da-story-browser-act-header--current')).toBe(true);
      expect(actHeaders[0].classList.contains('da-story-browser-act-header--current')).toBe(false);
    });

    it('should show "Current" badge on current act', () => {
      browser.open(mockData);

      const currentBadge = document.querySelector('.da-story-browser-current-badge');
      expect(currentBadge).not.toBeNull();
      expect(currentBadge?.textContent).toBe('Current');
    });

    it('should report isOpen as true', () => {
      expect(browser.isOpen()).toBe(false);
      browser.open(mockData);
      expect(browser.isOpen()).toBe(true);
    });
  });

  describe('close', () => {
    it('should remove backdrop when closed', () => {
      browser.open(mockData);
      expect(document.querySelector('.da-story-browser-backdrop')).not.toBeNull();

      browser.close();
      expect(document.querySelector('.da-story-browser-backdrop')).toBeNull();
    });

    it('should call onClose callback', () => {
      browser.open(mockData);
      browser.close();
      expect(callbacks.onClose).toHaveBeenCalled();
    });

    it('should report isOpen as false after close', () => {
      browser.open(mockData);
      browser.close();
      expect(browser.isOpen()).toBe(false);
    });
  });

  describe('scene selection', () => {
    it('should call onSceneSelect when a scene is clicked', () => {
      browser.open(mockData);

      // First expand act 0
      const actHeaders = document.querySelectorAll('.da-story-browser-act-header');
      (actHeaders[0] as HTMLElement).click();

      // Then expand chapter 1
      const chapterHeaders = document.querySelectorAll('.da-story-browser-chapter-header');
      (chapterHeaders[0] as HTMLElement).click();

      // Click on first scene
      const sceneItems = document.querySelectorAll('.da-story-browser-scene');
      (sceneItems[0] as HTMLElement).click();

      expect(callbacks.onSceneSelect).toHaveBeenCalledWith('scene-0-1-1');
    });

    it('should close browser after scene selection', () => {
      browser.open(mockData);

      // First expand act 0
      const actHeaders = document.querySelectorAll('.da-story-browser-act-header');
      (actHeaders[0] as HTMLElement).click();

      // Then expand chapter 1
      const chapterHeaders = document.querySelectorAll('.da-story-browser-chapter-header');
      (chapterHeaders[0] as HTMLElement).click();

      // Click on first scene
      const sceneItems = document.querySelectorAll('.da-story-browser-scene');
      (sceneItems[0] as HTMLElement).click();

      expect(browser.isOpen()).toBe(false);
    });
  });

  describe('act expansion', () => {
    it('should expand collapsed act on click', () => {
      browser.open(mockData);

      const acts = document.querySelectorAll('.da-story-browser-act');
      const act0Header = acts[0].querySelector('.da-story-browser-act-header') as HTMLElement;
      const chaptersContainer = acts[0].querySelector('.da-story-browser-chapters');

      // Initially collapsed
      expect(chaptersContainer?.classList.contains('da-story-browser-chapters--collapsed')).toBe(true);

      // Click to expand
      act0Header.click();
      expect(chaptersContainer?.classList.contains('da-story-browser-chapters--collapsed')).toBe(false);
    });

    it('should collapse expanded act on click', () => {
      browser.open(mockData);

      const acts = document.querySelectorAll('.da-story-browser-act');
      const act1Header = acts[1].querySelector('.da-story-browser-act-header') as HTMLElement;
      const chaptersContainer = acts[1].querySelector('.da-story-browser-chapters');

      // Initially expanded (current act)
      expect(chaptersContainer?.classList.contains('da-story-browser-chapters--collapsed')).toBe(false);

      // Click to collapse
      act1Header.click();
      expect(chaptersContainer?.classList.contains('da-story-browser-chapters--collapsed')).toBe(true);
    });

    it('should toggle aria-expanded attribute', () => {
      browser.open(mockData);

      const acts = document.querySelectorAll('.da-story-browser-act');
      const act0Header = acts[0].querySelector('.da-story-browser-act-header') as HTMLElement;

      // Initially collapsed
      expect(act0Header.getAttribute('aria-expanded')).toBe('false');

      // Click to expand
      act0Header.click();
      expect(act0Header.getAttribute('aria-expanded')).toBe('true');
    });
  });

  describe('keyboard navigation', () => {
    it('should close on Escape key', () => {
      browser.open(mockData);

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);

      expect(browser.isOpen()).toBe(false);
      expect(callbacks.onClose).toHaveBeenCalled();
    });
  });

  describe('backdrop click', () => {
    it('should close when clicking backdrop', () => {
      browser.open(mockData);

      const backdrop = document.querySelector('.da-story-browser-backdrop') as HTMLElement;
      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', { value: backdrop });
      backdrop.dispatchEvent(event);

      expect(browser.isOpen()).toBe(false);
    });

    it('should not close when clicking modal content', () => {
      browser.open(mockData);

      const modal = document.querySelector('.da-story-browser') as HTMLElement;
      modal.click();

      expect(browser.isOpen()).toBe(true);
    });
  });

  describe('close button', () => {
    it('should close when close button clicked', () => {
      browser.open(mockData);

      const closeBtn = document.querySelector('.da-story-browser-close') as HTMLElement;
      closeBtn.click();

      expect(browser.isOpen()).toBe(false);
    });
  });

  describe('scene indicators', () => {
    it('should mark current scene with current class', () => {
      browser.open(mockData);

      // Expand act 1 and chapter 1 (already expanded by default)
      const chapterHeaders = document.querySelectorAll('.da-story-browser-chapter-header');
      // Find the chapter in act 1
      let act1ChapterHeader: HTMLElement | null = null;
      const acts = document.querySelectorAll('.da-story-browser-act');
      const act1Chapters = acts[1].querySelectorAll('.da-story-browser-chapter-header');
      if (act1Chapters.length > 0) {
        act1ChapterHeader = act1Chapters[0] as HTMLElement;
        act1ChapterHeader.click(); // Expand chapter
      }

      const currentScenes = document.querySelectorAll('.da-story-browser-scene--current');
      expect(currentScenes.length).toBe(1);
    });

    it('should mark visited scenes with visited class', () => {
      browser.open(mockData);

      // Expand act 0 and its first chapter
      const acts = document.querySelectorAll('.da-story-browser-act');
      const act0Header = acts[0].querySelector('.da-story-browser-act-header') as HTMLElement;
      act0Header.click();

      const act0Chapters = acts[0].querySelectorAll('.da-story-browser-chapter-header');
      if (act0Chapters.length > 0) {
        (act0Chapters[0] as HTMLElement).click();
      }

      const visitedScenes = document.querySelectorAll('.da-story-browser-scene--visited');
      expect(visitedScenes.length).toBeGreaterThan(0);
    });
  });

  describe('destroy', () => {
    it('should clean up resources', () => {
      browser.open(mockData);
      expect(document.querySelector('.da-story-browser-backdrop')).not.toBeNull();

      browser.destroy();
      expect(document.querySelector('.da-story-browser-backdrop')).toBeNull();
    });
  });

  describe('scene type display', () => {
    it('should show scene type badge', () => {
      browser.open(mockData);

      // Expand act 0
      const acts = document.querySelectorAll('.da-story-browser-act');
      const act0Header = acts[0].querySelector('.da-story-browser-act-header') as HTMLElement;
      act0Header.click();

      // Expand first chapter
      const act0Chapters = acts[0].querySelectorAll('.da-story-browser-chapter-header');
      (act0Chapters[0] as HTMLElement).click();

      const sceneTypes = document.querySelectorAll('.da-story-browser-scene-type');
      expect(sceneTypes.length).toBeGreaterThan(0);
      // First scene is narrative type
      expect(sceneTypes[0].textContent).toBe('Story');
    });
  });
});
