// src/story/ChapterHeader.ts
// Chapter header component for Story Mode
// Story 10.5: Create Chapter Header Component

import type { ChapterData } from './types';

/**
 * ChapterHeader displays chapter information at the top of story content.
 * Shows the act number (Roman numerals), year, title, and subtitle.
 *
 * Layout specification (from UX design):
 * - Text-align: center
 * - Era badge: 12px, uppercase, letter-spacing 0.1em, gold accent
 * - Title: 36px, bold, serif font (Crimson Text)
 * - Subtitle: 18px, italic, serif font, secondary color
 * - Bottom border separator
 */
export class ChapterHeader {
  private element: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private chapterData: ChapterData | null = null;

  // Element references for dynamic updates
  private eraElement: HTMLElement | null = null;
  private titleElement: HTMLElement | null = null;
  private subtitleElement: HTMLElement | null = null;

  /**
   * Mount the header to a DOM element.
   * @param container - The HTML element to mount to
   */
  mount(container: HTMLElement): void {
    this.container = container;
    this.element = this.render();
    this.container.appendChild(this.element);
  }

  /**
   * Set the chapter data and update the display.
   * @param data - The chapter data to display
   */
  setChapterData(data: ChapterData): void {
    this.chapterData = data;
    this.updateDisplay();
  }

  /**
   * Update all displayed values based on current chapterData.
   */
  private updateDisplay(): void {
    if (!this.chapterData) return;

    if (this.eraElement) {
      // Format: "ACT I — 1971" using Roman numerals
      this.eraElement.textContent = `ACT ${this.toRoman(this.chapterData.actNumber)} — ${this.chapterData.year}`;
    }
    if (this.titleElement) {
      this.titleElement.textContent = this.chapterData.title;
    }
    if (this.subtitleElement) {
      this.subtitleElement.textContent = this.chapterData.subtitle;
    }
  }

  /**
   * Convert a number to Roman numerals.
   * @param num - The number to convert (positive integers supported)
   * @returns Roman numeral string, or empty string if num <= 0
   */
  private toRoman(num: number): string {
    if (num <= 0) return '';
    const romanNumerals: [number, string][] = [
      [10, 'X'],
      [9, 'IX'],
      [5, 'V'],
      [4, 'IV'],
      [1, 'I'],
    ];
    let result = '';
    for (const [value, numeral] of romanNumerals) {
      while (num >= value) {
        result += numeral;
        num -= value;
      }
    }
    return result;
  }

  /**
   * Render the chapter header structure.
   * @returns The rendered header element
   */
  private render(): HTMLElement {
    const header = document.createElement('header');
    header.className = 'da-chapter-header';
    header.setAttribute('aria-label', 'Chapter information');

    // Era badge (e.g., "ACT I — 1971")
    const era = document.createElement('div');
    era.className = 'da-chapter-header-era';
    era.textContent = 'ACT I — 1971'; // Default value
    this.eraElement = era;

    // Chapter title
    const title = document.createElement('h1');
    title.className = 'da-chapter-header-title';
    title.textContent = 'The Humbling Beginning'; // Default value
    this.titleElement = title;

    // Chapter subtitle
    const subtitle = document.createElement('p');
    subtitle.className = 'da-chapter-header-subtitle';
    subtitle.textContent = 'In which you discover that computation begins with the simplest gates';
    this.subtitleElement = subtitle;

    header.appendChild(era);
    header.appendChild(title);
    header.appendChild(subtitle);

    return header;
  }

  /**
   * Show the header.
   */
  show(): void {
    this.element?.classList.remove('da-chapter-header--hidden');
  }

  /**
   * Hide the header.
   */
  hide(): void {
    this.element?.classList.add('da-chapter-header--hidden');
  }

  /**
   * Check if the header is currently visible.
   * @returns true if visible and mounted, false otherwise
   */
  isVisible(): boolean {
    if (!this.element) return false;
    return !this.element.classList.contains('da-chapter-header--hidden');
  }

  /**
   * Get the root element.
   * @returns The header element or null if not mounted
   */
  getElement(): HTMLElement | null {
    return this.element;
  }

  /**
   * Destroy the component and clean up resources.
   */
  destroy(): void {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    this.container = null;
    this.chapterData = null;
    this.eraElement = null;
    this.titleElement = null;
    this.subtitleElement = null;
  }
}
