// src/story/ReplayPanel.test.ts
// Tests for ReplayPanel component
// Story 26.8: Time-Travel Replay

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ReplayPanel } from './ReplayPanel';
import type { ReplayPanelCallbacks, ReplayPanelData } from './ReplayPanel';
import type { TimelineEntry } from './StoryState';

describe('ReplayPanel', () => {
  let panel: ReplayPanel;
  let callbacks: ReplayPanelCallbacks;

  const createTimelineEntry = (overrides?: Partial<TimelineEntry>): TimelineEntry => ({
    sceneId: 'scene-1-1-1',
    actNumber: 1,
    chapterNumber: 1,
    sceneType: 'narrative',
    actTitle: 'The Dawn of Counting',
    chapterTitle: 'Before Numbers Had Names',
    visitedAt: Date.now(),
    ...overrides,
  });

  const createData = (overrides?: Partial<ReplayPanelData>): ReplayPanelData => ({
    timeline: [
      createTimelineEntry(),
      createTimelineEntry({
        sceneId: 'scene-1-1-2',
        sceneType: 'dialogue',
        chapterTitle: 'First Words',
      }),
    ],
    currentSceneId: 'scene-1-1-2',
    replaySceneId: null,
    ...overrides,
  });

  beforeEach(() => {
    callbacks = {
      onClose: vi.fn(),
      onReplayScene: vi.fn(),
      onReturnToPresent: vi.fn(),
    };
    panel = new ReplayPanel();
    panel.setCallbacks(callbacks);
  });

  afterEach(() => {
    panel.destroy();
  });

  describe('open and close', () => {
    it('should open the panel with backdrop', () => {
      panel.open(createData());
      expect(panel.isOpen()).toBe(true);
      expect(document.querySelector('.da-replay-panel__backdrop')).not.toBeNull();
    });

    it('should render the panel as a dialog', () => {
      panel.open(createData());
      const el = document.querySelector('.da-replay-panel');
      expect(el?.getAttribute('role')).toBe('dialog');
      expect(el?.getAttribute('aria-modal')).toBe('true');
    });

    it('should close and remove from DOM', () => {
      panel.open(createData());
      panel.close();
      expect(panel.isOpen()).toBe(false);
      expect(document.querySelector('.da-replay-panel__backdrop')).toBeNull();
    });

    it('should call onClose when close button is clicked', () => {
      panel.open(createData());
      const closeBtn = document.querySelector('.da-replay-panel__close') as HTMLElement;
      closeBtn?.click();
      expect(callbacks.onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when backdrop is clicked', () => {
      panel.open(createData());
      const backdrop = document.querySelector('.da-replay-panel__backdrop') as HTMLElement;
      backdrop?.click();
      expect(callbacks.onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Escape key is pressed', () => {
      panel.open(createData());
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(callbacks.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('header', () => {
    it('should render title with time icon', () => {
      panel.open(createData());
      const title = document.querySelector('.da-replay-panel__title');
      expect(title?.textContent).toContain('Time-Travel Replay');
    });

    it('should show "Return to Present" button when in replay mode', () => {
      panel.open(createData({ replaySceneId: 'scene-1-1-1' }));
      const returnBtn = document.querySelector('.da-replay-panel__return');
      expect(returnBtn).not.toBeNull();
      expect(returnBtn?.textContent).toContain('Return to Present');
    });

    it('should not show "Return to Present" button when not in replay mode', () => {
      panel.open(createData({ replaySceneId: null }));
      expect(document.querySelector('.da-replay-panel__return')).toBeNull();
    });

    it('should call onReturnToPresent when return button is clicked', () => {
      panel.open(createData({ replaySceneId: 'scene-1-1-1' }));
      const returnBtn = document.querySelector('.da-replay-panel__return') as HTMLElement;
      returnBtn?.click();
      expect(callbacks.onReturnToPresent).toHaveBeenCalledTimes(1);
    });
  });

  describe('status line', () => {
    it('should show visited count when not in replay mode', () => {
      panel.open(createData());
      const status = document.querySelector('.da-replay-panel__status');
      expect(status?.textContent).toContain('2 scenes visited');
    });

    it('should show replay message when in replay mode', () => {
      panel.open(createData({ replaySceneId: 'scene-1-1-1' }));
      const status = document.querySelector('.da-replay-panel__status');
      expect(status?.textContent).toContain('Replaying past scene');
    });
  });

  describe('timeline grouping', () => {
    it('should group entries by act', () => {
      const data = createData({
        timeline: [
          createTimelineEntry({ actNumber: 1, actTitle: 'Act One' }),
          createTimelineEntry({ sceneId: 'scene-2-1-1', actNumber: 2, actTitle: 'Act Two' }),
        ],
      });
      panel.open(data);

      const actHeaders = document.querySelectorAll('.da-replay-panel__act-header');
      expect(actHeaders.length).toBe(2);
      expect(actHeaders[0].textContent).toContain('Act 1');
      expect(actHeaders[1].textContent).toContain('Act 2');
    });

    it('should show empty message when no scenes visited', () => {
      panel.open(createData({ timeline: [] }));
      const empty = document.querySelector('.da-replay-panel__empty');
      expect(empty).not.toBeNull();
      expect(empty?.textContent).toContain('No scenes visited');
    });
  });

  describe('timeline items', () => {
    it('should render items as buttons', () => {
      panel.open(createData());
      const items = document.querySelectorAll('.da-replay-panel__item');
      expect(items.length).toBe(2);
      expect(items[0].tagName).toBe('BUTTON');
    });

    it('should call onReplayScene when an item is clicked', () => {
      panel.open(createData());
      const items = document.querySelectorAll('.da-replay-panel__item');
      (items[0] as HTMLElement).click();
      expect(callbacks.onReplayScene).toHaveBeenCalledWith('scene-1-1-1');
    });

    it('should highlight current scene with NOW badge', () => {
      panel.open(createData({ currentSceneId: 'scene-1-1-2' }));
      const currentItem = document.querySelector('.da-replay-panel__item--current');
      expect(currentItem).not.toBeNull();
      const badge = currentItem?.querySelector('.da-replay-panel__badge--current');
      expect(badge?.textContent).toBe('NOW');
    });

    it('should highlight replaying scene with REPLAYING badge', () => {
      panel.open(createData({ replaySceneId: 'scene-1-1-1' }));
      const replayingItem = document.querySelector('.da-replay-panel__item--replaying');
      expect(replayingItem).not.toBeNull();
      const badge = replayingItem?.querySelector('.da-replay-panel__badge--replaying');
      expect(badge?.textContent).toBe('REPLAYING');
    });

    it('should show choice indicator for scenes with choices made', () => {
      panel.open(createData({
        timeline: [
          createTimelineEntry({ choiceMade: 'choice-a' }),
        ],
      }));
      const choiceIcon = document.querySelector('.da-replay-panel__choice-icon');
      expect(choiceIcon).not.toBeNull();
    });

    it('should display scene type label', () => {
      panel.open(createData({
        timeline: [
          createTimelineEntry({ sceneType: 'dialogue' }),
        ],
      }));
      const label = document.querySelector('.da-replay-panel__item-label');
      expect(label?.textContent).toBe('Dialogue');
    });

    it('should display chapter context', () => {
      panel.open(createData({
        timeline: [
          createTimelineEntry({ chapterNumber: 3, chapterTitle: 'The Abacus Age' }),
        ],
      }));
      const context = document.querySelector('.da-replay-panel__item-context');
      expect(context?.textContent).toContain('Ch 3');
      expect(context?.textContent).toContain('The Abacus Age');
    });
  });

  describe('cleanup', () => {
    it('should clean up event listeners on close', () => {
      panel.open(createData());
      panel.close();
      // After close, Escape should not trigger onClose again
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(callbacks.onClose).not.toHaveBeenCalled();
    });

    it('should clean up on destroy', () => {
      panel.open(createData());
      panel.destroy();
      expect(document.querySelector('.da-replay-panel__backdrop')).toBeNull();
      expect(panel.isOpen()).toBe(false);
    });
  });
});
