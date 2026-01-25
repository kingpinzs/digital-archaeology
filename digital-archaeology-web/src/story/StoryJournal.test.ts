// src/story/StoryJournal.test.ts
// Tests for StoryJournal modal component

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StoryJournal } from './StoryJournal';
import type { StoryJournalData, StoryJournalCallbacks } from './StoryJournal';
import type { StoryAct } from './content-types';
import type { StoryProgress } from './StoryState';

describe('StoryJournal', () => {
  let journal: StoryJournal;
  let callbacks: StoryJournalCallbacks;
  let mockData: StoryJournalData;

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
          { id: `scene-${number}-1-1`, type: 'narrative' },
        ],
      },
    ],
  });

  const createMockProgress = (): StoryProgress => ({
    position: { actNumber: 1, chapterNumber: 1, sceneId: 'scene-1-1-2' },
    choices: [
      { sceneId: 'scene-0-1-1', choiceId: 'learn-more', timestamp: Date.now() - 60000 },
      { sceneId: 'scene-1-1-1', choiceId: 'be-cautious', timestamp: Date.now() },
    ],
    discoveredItems: ['vacuum-tube', 'transistor', 'integrated-circuit'],
    startedAt: Date.now() - 3600000,
    lastPlayedAt: Date.now(),
  });

  beforeEach(() => {
    callbacks = {
      onClose: vi.fn(),
    };

    mockData = {
      acts: [createMockAct(0), createMockAct(1), createMockAct(2)],
      progress: createMockProgress(),
      sceneHistory: ['scene-0-1-1', 'scene-1-1-1', 'scene-1-1-2'],
    };

    journal = new StoryJournal();
    journal.setCallbacks(callbacks);
  });

  afterEach(() => {
    journal.destroy();
    document.querySelectorAll('.da-story-journal-backdrop').forEach(el => el.remove());
  });

  describe('open', () => {
    it('should create backdrop and modal when opened', () => {
      journal.open(mockData);

      expect(document.querySelector('.da-story-journal-backdrop')).not.toBeNull();
      expect(document.querySelector('.da-story-journal')).not.toBeNull();
    });

    it('should show title "Journey Log"', () => {
      journal.open(mockData);

      const title = document.querySelector('.da-story-journal-title');
      expect(title?.textContent).toBe('Journey Log');
    });

    it('should render tabs', () => {
      journal.open(mockData);

      const tabs = document.querySelectorAll('.da-story-journal-tab');
      expect(tabs.length).toBe(3);
      expect(tabs[0].textContent).toBe('Progress');
      expect(tabs[1].textContent).toBe('Choices');
      expect(tabs[2].textContent).toBe('Discoveries');
    });

    it('should default to Progress tab', () => {
      journal.open(mockData);

      const activeTab = document.querySelector('.da-story-journal-tab--active');
      expect(activeTab?.textContent).toBe('Progress');
    });

    it('should report isOpen as true', () => {
      expect(journal.isOpen()).toBe(false);
      journal.open(mockData);
      expect(journal.isOpen()).toBe(true);
    });
  });

  describe('close', () => {
    it('should remove backdrop when closed', () => {
      journal.open(mockData);
      expect(document.querySelector('.da-story-journal-backdrop')).not.toBeNull();

      journal.close();
      expect(document.querySelector('.da-story-journal-backdrop')).toBeNull();
    });

    it('should call onClose callback', () => {
      journal.open(mockData);
      journal.close();
      expect(callbacks.onClose).toHaveBeenCalled();
    });

    it('should report isOpen as false after close', () => {
      journal.open(mockData);
      journal.close();
      expect(journal.isOpen()).toBe(false);
    });
  });

  describe('tabs', () => {
    it('should switch to Choices tab on click', () => {
      journal.open(mockData);

      const tabs = document.querySelectorAll('.da-story-journal-tab');
      (tabs[1] as HTMLElement).click();

      expect(tabs[1].classList.contains('da-story-journal-tab--active')).toBe(true);
      expect(tabs[0].classList.contains('da-story-journal-tab--active')).toBe(false);
    });

    it('should switch to Discoveries tab on click', () => {
      journal.open(mockData);

      const tabs = document.querySelectorAll('.da-story-journal-tab');
      (tabs[2] as HTMLElement).click();

      expect(tabs[2].classList.contains('da-story-journal-tab--active')).toBe(true);
      expect(tabs[0].classList.contains('da-story-journal-tab--active')).toBe(false);
    });

    it('should update aria-selected attribute on tab change', () => {
      journal.open(mockData);

      const tabs = document.querySelectorAll('.da-story-journal-tab');
      expect(tabs[0].getAttribute('aria-selected')).toBe('true');
      expect(tabs[1].getAttribute('aria-selected')).toBe('false');

      (tabs[1] as HTMLElement).click();

      expect(tabs[0].getAttribute('aria-selected')).toBe('false');
      expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    });
  });

  describe('Progress tab', () => {
    it('should show current position', () => {
      journal.open(mockData);

      const content = document.querySelector('.da-story-journal-content');
      expect(content?.textContent).toContain('Act 1');
      expect(content?.textContent).toContain('Chapter 1');
    });

    it('should show journey stats', () => {
      journal.open(mockData);

      const content = document.querySelector('.da-story-journal-content');
      expect(content?.textContent).toContain('Scenes Visited');
      expect(content?.textContent).toContain('Choices Made');
      expect(content?.textContent).toContain('Discoveries');
    });

    it('should show empty state when no progress', () => {
      mockData.progress = null;
      journal.open(mockData);

      const empty = document.querySelector('.da-story-journal-empty');
      expect(empty).not.toBeNull();
      expect(empty?.textContent).toContain('No progress recorded');
    });
  });

  describe('Choices tab', () => {
    it('should display choices made', () => {
      journal.open(mockData);

      const tabs = document.querySelectorAll('.da-story-journal-tab');
      (tabs[1] as HTMLElement).click();

      const choices = document.querySelectorAll('.da-story-journal-choice-item');
      expect(choices.length).toBe(2);
    });

    it('should show empty state when no choices', () => {
      mockData.progress!.choices = [];
      journal.open(mockData);

      const tabs = document.querySelectorAll('.da-story-journal-tab');
      (tabs[1] as HTMLElement).click();

      const empty = document.querySelector('.da-story-journal-empty');
      expect(empty?.textContent).toContain('No choices made');
    });
  });

  describe('Discoveries tab', () => {
    it('should display discovered items', () => {
      journal.open(mockData);

      const tabs = document.querySelectorAll('.da-story-journal-tab');
      (tabs[2] as HTMLElement).click();

      const discoveries = document.querySelectorAll('.da-story-journal-discovery-card');
      expect(discoveries.length).toBe(3);
    });

    it('should show empty state when no discoveries', () => {
      mockData.progress!.discoveredItems = [];
      journal.open(mockData);

      const tabs = document.querySelectorAll('.da-story-journal-tab');
      (tabs[2] as HTMLElement).click();

      const empty = document.querySelector('.da-story-journal-empty');
      expect(empty?.textContent).toContain('No discoveries');
    });
  });

  describe('keyboard navigation', () => {
    it('should close on Escape key', () => {
      journal.open(mockData);

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);

      expect(journal.isOpen()).toBe(false);
      expect(callbacks.onClose).toHaveBeenCalled();
    });
  });

  describe('backdrop click', () => {
    it('should close when clicking backdrop', () => {
      journal.open(mockData);

      const backdrop = document.querySelector('.da-story-journal-backdrop') as HTMLElement;
      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', { value: backdrop });
      backdrop.dispatchEvent(event);

      expect(journal.isOpen()).toBe(false);
    });

    it('should not close when clicking modal content', () => {
      journal.open(mockData);

      const modal = document.querySelector('.da-story-journal') as HTMLElement;
      modal.click();

      expect(journal.isOpen()).toBe(true);
    });
  });

  describe('close button', () => {
    it('should close when close button clicked', () => {
      journal.open(mockData);

      const closeBtn = document.querySelector('.da-story-journal-close') as HTMLElement;
      closeBtn.click();

      expect(journal.isOpen()).toBe(false);
    });
  });

  describe('destroy', () => {
    it('should clean up resources', () => {
      journal.open(mockData);
      expect(document.querySelector('.da-story-journal-backdrop')).not.toBeNull();

      journal.destroy();
      expect(document.querySelector('.da-story-journal-backdrop')).toBeNull();
    });
  });
});
