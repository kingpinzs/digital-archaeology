// src/story/ChapterHeader.test.ts
// Tests for ChapterHeader component
// Story 10.5: Create Chapter Header Component

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ChapterHeader } from './ChapterHeader';
import type { ChapterData } from './types';

describe('ChapterHeader', () => {
  let container: HTMLElement;
  let header: ChapterHeader;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    header?.destroy();
    container.remove();
  });

  describe('Task 1: Component Class and Lifecycle', () => {
    it('should mount to a container element', () => {
      header = new ChapterHeader();
      header.mount(container);

      const headerElement = container.querySelector('.da-chapter-header');
      expect(headerElement).not.toBeNull();
    });

    it('should use semantic <header> element', () => {
      header = new ChapterHeader();
      header.mount(container);

      const headerElement = container.querySelector('header.da-chapter-header');
      expect(headerElement).not.toBeNull();
      expect(headerElement?.tagName).toBe('HEADER');
    });

    it('should have aria-label for accessibility', () => {
      header = new ChapterHeader();
      header.mount(container);

      const headerElement = container.querySelector('.da-chapter-header');
      expect(headerElement?.getAttribute('aria-label')).toBe('Chapter information');
    });

    it('should be visible by default', () => {
      header = new ChapterHeader();
      header.mount(container);

      expect(header.isVisible()).toBe(true);
    });

    it('should hide when hide() is called', () => {
      header = new ChapterHeader();
      header.mount(container);
      header.hide();

      expect(header.isVisible()).toBe(false);
      const headerElement = container.querySelector('.da-chapter-header');
      expect(headerElement?.classList.contains('da-chapter-header--hidden')).toBe(true);
    });

    it('should show when show() is called', () => {
      header = new ChapterHeader();
      header.mount(container);
      header.hide();
      header.show();

      expect(header.isVisible()).toBe(true);
      const headerElement = container.querySelector('.da-chapter-header');
      expect(headerElement?.classList.contains('da-chapter-header--hidden')).toBe(false);
    });

    it('should return element via getElement()', () => {
      header = new ChapterHeader();
      header.mount(container);

      const element = header.getElement();
      expect(element).not.toBeNull();
      expect(element?.classList.contains('da-chapter-header')).toBe(true);
    });

    it('should return null from getElement() before mounting', () => {
      header = new ChapterHeader();
      expect(header.getElement()).toBeNull();
    });

    it('should return false from isVisible() before mounting', () => {
      header = new ChapterHeader();
      expect(header.isVisible()).toBe(false);
    });

    it('should remove element from DOM on destroy', () => {
      header = new ChapterHeader();
      header.mount(container);
      expect(container.querySelector('.da-chapter-header')).not.toBeNull();

      header.destroy();
      expect(container.querySelector('.da-chapter-header')).toBeNull();
    });

    it('should return null from getElement() after destroy', () => {
      header = new ChapterHeader();
      header.mount(container);
      header.destroy();

      expect(header.getElement()).toBeNull();
    });
  });

  describe('Task 2: Render Method', () => {
    it('should render era badge element', () => {
      header = new ChapterHeader();
      header.mount(container);

      const eraBadge = container.querySelector('.da-chapter-header-era');
      expect(eraBadge).not.toBeNull();
    });

    it('should render era badge with default "ACT I — 1971"', () => {
      header = new ChapterHeader();
      header.mount(container);

      const eraBadge = container.querySelector('.da-chapter-header-era');
      expect(eraBadge?.textContent).toBe('ACT I — 1971');
    });

    it('should render title element as h1', () => {
      header = new ChapterHeader();
      header.mount(container);

      const title = container.querySelector('h1.da-chapter-header-title');
      expect(title).not.toBeNull();
    });

    it('should render title with default value', () => {
      header = new ChapterHeader();
      header.mount(container);

      const title = container.querySelector('.da-chapter-header-title');
      expect(title?.textContent).toBe('The Humbling Beginning');
    });

    it('should render subtitle element', () => {
      header = new ChapterHeader();
      header.mount(container);

      const subtitle = container.querySelector('.da-chapter-header-subtitle');
      expect(subtitle).not.toBeNull();
    });

    it('should render subtitle with default value', () => {
      header = new ChapterHeader();
      header.mount(container);

      const subtitle = container.querySelector('.da-chapter-header-subtitle');
      expect(subtitle?.textContent).toBe(
        'In which you discover that computation begins with the simplest gates'
      );
    });
  });

  describe('Task 4: setChapterData() Method', () => {
    it('should update era badge when setChapterData is called', () => {
      header = new ChapterHeader();
      header.mount(container);

      const chapterData: ChapterData = {
        actNumber: 2,
        year: '1975',
        title: 'The Next Step',
        subtitle: 'Building on foundations',
      };

      header.setChapterData(chapterData);

      const eraBadge = container.querySelector('.da-chapter-header-era');
      expect(eraBadge?.textContent).toBe('ACT II — 1975');
    });

    it('should update title when setChapterData is called', () => {
      header = new ChapterHeader();
      header.mount(container);

      const chapterData: ChapterData = {
        actNumber: 3,
        year: '1980',
        title: 'Advanced Concepts',
        subtitle: 'Going deeper',
      };

      header.setChapterData(chapterData);

      const title = container.querySelector('.da-chapter-header-title');
      expect(title?.textContent).toBe('Advanced Concepts');
    });

    it('should update subtitle when setChapterData is called', () => {
      header = new ChapterHeader();
      header.mount(container);

      const chapterData: ChapterData = {
        actNumber: 4,
        year: '1985',
        title: 'Final Chapter',
        subtitle: 'The culmination of our journey',
      };

      header.setChapterData(chapterData);

      const subtitle = container.querySelector('.da-chapter-header-subtitle');
      expect(subtitle?.textContent).toBe('The culmination of our journey');
    });

    it('should convert act numbers to Roman numerals correctly', () => {
      header = new ChapterHeader();
      header.mount(container);

      const testCases: [number, string][] = [
        [1, 'I'],
        [2, 'II'],
        [3, 'III'],
        [4, 'IV'],
        [5, 'V'],
        [6, 'VI'],
        [7, 'VII'],
        [8, 'VIII'],
        [9, 'IX'],
        [10, 'X'],
      ];

      for (const [actNumber, roman] of testCases) {
        header.setChapterData({
          actNumber,
          year: '2000',
          title: 'Test',
          subtitle: 'Test subtitle',
        });

        const eraBadge = container.querySelector('.da-chapter-header-era');
        expect(eraBadge?.textContent).toBe(`ACT ${roman} — 2000`);
      }
    });

    it('should handle consecutive setChapterData calls', () => {
      header = new ChapterHeader();
      header.mount(container);

      // First update
      header.setChapterData({
        actNumber: 1,
        year: '1970',
        title: 'First Title',
        subtitle: 'First subtitle',
      });

      // Second update (should replace first)
      header.setChapterData({
        actNumber: 5,
        year: '1990',
        title: 'Second Title',
        subtitle: 'Second subtitle',
      });

      const eraBadge = container.querySelector('.da-chapter-header-era');
      const title = container.querySelector('.da-chapter-header-title');
      const subtitle = container.querySelector('.da-chapter-header-subtitle');

      expect(eraBadge?.textContent).toBe('ACT V — 1990');
      expect(title?.textContent).toBe('Second Title');
      expect(subtitle?.textContent).toBe('Second subtitle');
    });

    it('should handle actNumber = 0 gracefully', () => {
      header = new ChapterHeader();
      header.mount(container);

      header.setChapterData({
        actNumber: 0,
        year: '1970',
        title: 'Zero Act',
        subtitle: 'Edge case',
      });

      const eraBadge = container.querySelector('.da-chapter-header-era');
      // When actNumber is 0, toRoman returns empty string
      expect(eraBadge?.textContent).toBe('ACT  — 1970');
    });

    it('should handle negative actNumber gracefully', () => {
      header = new ChapterHeader();
      header.mount(container);

      header.setChapterData({
        actNumber: -1,
        year: '1970',
        title: 'Negative Act',
        subtitle: 'Edge case',
      });

      const eraBadge = container.querySelector('.da-chapter-header-era');
      // When actNumber is negative, toRoman returns empty string
      expect(eraBadge?.textContent).toBe('ACT  — 1970');
    });

    it('should handle setChapterData called before mount', () => {
      header = new ChapterHeader();

      // Call setChapterData before mount - should not throw
      header.setChapterData({
        actNumber: 2,
        year: '1980',
        title: 'Pre-mount Data',
        subtitle: 'Set before mount',
      });

      // Now mount - should show default values since elements weren't cached yet
      header.mount(container);

      const eraBadge = container.querySelector('.da-chapter-header-era');
      const title = container.querySelector('.da-chapter-header-title');

      // Default values are shown because setChapterData was called before mount
      expect(eraBadge?.textContent).toBe('ACT I — 1971');
      expect(title?.textContent).toBe('The Humbling Beginning');
    });
  });
});
