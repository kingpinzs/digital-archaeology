// src/story/ChapterTransitionPanel.test.ts
// Tests for ChapterTransitionPanel component

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ChapterTransitionPanel } from './ChapterTransitionPanel';
import type { SceneTransitionData } from './content-types';

describe('ChapterTransitionPanel', () => {
  let container: HTMLElement;
  let panel: ChapterTransitionPanel;

  const mockTransitionData: SceneTransitionData = {
    outgoingEra: 'Mesopotamia, 3000 BC',
    incomingEra: 'Egypt, 1500 BC',
    yearsElapsed: 1500,
    narrative: [
      'The counting board would spread across the ancient world.',
      'Fifteen centuries pass. You emerge in the shade of an Egyptian temple.',
    ],
    summary: {
      chapterTitle: 'Before Numbers Had Names',
      concepts: ['Tally marks', 'Positional counting', 'Borrowing/carrying'],
    },
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    panel?.destroy();
    container.remove();
    vi.clearAllMocks();
  });

  describe('Component Structure', () => {
    it('should render panel as modal when mounted', () => {
      panel = new ChapterTransitionPanel();
      panel.mount(container);

      const panelElement = container.querySelector('.da-chapter-transition-panel');
      expect(panelElement).not.toBeNull();
    });

    it('should have role="dialog" and aria-modal', () => {
      panel = new ChapterTransitionPanel();
      panel.mount(container);

      const panelElement = container.querySelector('.da-chapter-transition-panel');
      expect(panelElement?.getAttribute('role')).toBe('dialog');
      expect(panelElement?.getAttribute('aria-modal')).toBe('true');
    });

    it('should render backdrop overlay', () => {
      panel = new ChapterTransitionPanel();
      panel.mount(container);

      const backdrop = container.querySelector('.da-chapter-transition-backdrop');
      expect(backdrop).not.toBeNull();
    });

    it('should have aria-labelledby pointing to heading', () => {
      panel = new ChapterTransitionPanel();
      panel.mount(container);

      const panelElement = container.querySelector('.da-chapter-transition-panel');
      const headingId = container.querySelector('.da-chapter-transition-heading')?.getAttribute('id');
      expect(panelElement?.getAttribute('aria-labelledby')).toBe(headingId);
    });

    it('should have aria-live region for announcements', () => {
      panel = new ChapterTransitionPanel();
      panel.mount(container);

      const liveRegion = container.querySelector('[aria-live="polite"]');
      expect(liveRegion).not.toBeNull();
    });
  });

  describe('Timeline Display', () => {
    it('should display era labels', () => {
      panel = new ChapterTransitionPanel();
      panel.mount(container);
      panel.setTransitionData(mockTransitionData);

      const outgoing = container.querySelector('.da-chapter-transition-era-outgoing');
      const incoming = container.querySelector('.da-chapter-transition-era-incoming');
      expect(outgoing?.textContent).toContain('Mesopotamia');
      expect(incoming?.textContent).toContain('Egypt');
    });

    it('should display years elapsed with thousands formatting', () => {
      panel = new ChapterTransitionPanel();
      panel.mount(container);
      panel.setTransitionData(mockTransitionData);

      const years = container.querySelector('.da-chapter-transition-years');
      expect(years?.textContent).toContain('1.5k years pass');
    });

    it('should display years without k-suffix for small values', () => {
      panel = new ChapterTransitionPanel();
      panel.mount(container);
      panel.setTransitionData({
        ...mockTransitionData,
        yearsElapsed: 500,
      });

      const years = container.querySelector('.da-chapter-transition-years');
      expect(years?.textContent).toContain('500 years pass');
    });
  });

  describe('Narrative Bridge', () => {
    it('should render all narrative paragraphs', () => {
      panel = new ChapterTransitionPanel();
      panel.mount(container);
      panel.setTransitionData(mockTransitionData);

      const paragraphs = container.querySelectorAll('.da-chapter-transition-narrative-text');
      expect(paragraphs.length).toBe(2);
    });

    it('should display narrative content correctly', () => {
      panel = new ChapterTransitionPanel();
      panel.mount(container);
      panel.setTransitionData(mockTransitionData);

      const narrativeContainer = container.querySelector('.da-chapter-transition-narrative');
      expect(narrativeContainer?.textContent).toContain('counting board');
      expect(narrativeContainer?.textContent).toContain('Egyptian temple');
    });
  });

  describe('Chapter Summary', () => {
    it('should display chapter title', () => {
      panel = new ChapterTransitionPanel();
      panel.mount(container);
      panel.setTransitionData(mockTransitionData);

      const title = container.querySelector('.da-chapter-transition-summary-title');
      expect(title?.textContent).toContain('Before Numbers Had Names');
    });

    it('should display concepts learned', () => {
      panel = new ChapterTransitionPanel();
      panel.mount(container);
      panel.setTransitionData(mockTransitionData);

      const concepts = container.querySelectorAll('.da-chapter-transition-concept');
      expect(concepts.length).toBe(3);
      expect(concepts[0].textContent).toBe('Tally marks');
    });

    it('should hide summary when not provided', () => {
      panel = new ChapterTransitionPanel();
      panel.mount(container);
      panel.setTransitionData({
        ...mockTransitionData,
        summary: undefined,
      });

      const summary = container.querySelector('.da-chapter-transition-summary');
      expect(summary?.classList.contains('da-hidden')).toBe(true);
    });
  });

  describe('Continue Button', () => {
    it('should have "Travel Forward in Time" button', () => {
      panel = new ChapterTransitionPanel();
      panel.mount(container);

      const btn = container.querySelector('.da-chapter-transition-continue');
      expect(btn).not.toBeNull();
      expect(btn?.textContent).toContain('Travel Forward in Time');
    });

    it('should call onContinue callback when clicked', () => {
      panel = new ChapterTransitionPanel();
      panel.mount(container);
      panel.setTransitionData(mockTransitionData);

      const callback = vi.fn();
      panel.onContinue(callback);

      const btn = container.querySelector('.da-chapter-transition-continue') as HTMLElement;
      btn?.click();

      expect(callback).toHaveBeenCalled();
    });

    it('should have proper aria-label', () => {
      panel = new ChapterTransitionPanel();
      panel.mount(container);

      const btn = container.querySelector('.da-chapter-transition-continue');
      expect(btn?.getAttribute('aria-label')).toBe('Travel forward in time to next chapter');
    });

    it('should hide panel after continue is clicked', () => {
      panel = new ChapterTransitionPanel();
      panel.mount(container);
      panel.show();

      expect(panel.isVisible()).toBe(true);

      const btn = container.querySelector('.da-chapter-transition-continue') as HTMLElement;
      btn?.click();

      expect(panel.isVisible()).toBe(false);
    });
  });

  describe('Show/Hide', () => {
    it('should not be visible by default after mount', () => {
      panel = new ChapterTransitionPanel();
      panel.mount(container);

      expect(panel.isVisible()).toBe(false);
    });

    it('should show panel when show() is called', () => {
      panel = new ChapterTransitionPanel();
      panel.mount(container);
      panel.show();

      expect(panel.isVisible()).toBe(true);
    });

    it('should hide panel when hide() is called', () => {
      panel = new ChapterTransitionPanel();
      panel.mount(container);
      panel.show();
      panel.hide();

      expect(panel.isVisible()).toBe(false);
    });

    it('should focus continue button on show', async () => {
      panel = new ChapterTransitionPanel();
      panel.mount(container);
      panel.show();

      await new Promise(resolve => requestAnimationFrame(resolve));

      const btn = container.querySelector('.da-chapter-transition-continue') as HTMLElement;
      expect(document.activeElement).toBe(btn);
    });
  });

  describe('Cleanup', () => {
    it('should remove event listeners on destroy', () => {
      panel = new ChapterTransitionPanel();
      panel.mount(container);
      panel.show();
      panel.destroy();

      const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      expect(() => document.dispatchEvent(event)).not.toThrow();
    });

    it('should remove DOM elements on destroy', () => {
      panel = new ChapterTransitionPanel();
      panel.mount(container);
      panel.destroy();

      expect(container.querySelector('.da-chapter-transition-panel')).toBeNull();
      expect(container.querySelector('.da-chapter-transition-backdrop')).toBeNull();
    });
  });

  describe('Data before mount', () => {
    it('should apply data set before mount', () => {
      panel = new ChapterTransitionPanel();
      panel.setTransitionData(mockTransitionData);
      panel.mount(container);

      const outgoing = container.querySelector('.da-chapter-transition-era-outgoing');
      expect(outgoing?.textContent).toContain('Mesopotamia');
    });
  });
});
