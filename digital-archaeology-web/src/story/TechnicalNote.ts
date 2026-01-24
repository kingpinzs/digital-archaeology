// src/story/TechnicalNote.ts
// Technical note component for Story Mode
// Story 10.10: Create Technical Note Component

import type { TechnicalNoteData } from './types';

/**
 * TechnicalNote displays technical explanations in Story Mode.
 * Features blue accent styling matching Lab Mode.
 *
 * Layout specification (from UX design):
 * - Container: Blue left border (4px), subtle background tint
 * - Label: "Technical Note" uppercase, blue color
 * - Content: Secondary color text
 * - Code: Monospace font, darker background (optional)
 */
export class TechnicalNote {
  private element: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private noteData: TechnicalNoteData | null = null;

  // Element references for dynamic updates
  private contentElement: HTMLElement | null = null;
  private codeElement: HTMLElement | null = null;

  /**
   * Mount the technical note to a DOM element.
   * @param container - The HTML element to mount to
   */
  mount(container: HTMLElement): void {
    this.container = container;
    this.element = this.render();
    this.container.appendChild(this.element);

    // Apply any data that was set before mount
    if (this.noteData) {
      this.updateDisplay();
    }
  }

  /**
   * Set the note data and update the display.
   * @param data - The technical note data to display
   */
  setNoteData(data: TechnicalNoteData): void {
    this.noteData = data;
    this.updateDisplay();
  }

  /**
   * Update all displayed values based on current noteData.
   */
  private updateDisplay(): void {
    if (!this.noteData) return;

    if (this.contentElement) {
      this.contentElement.textContent = this.noteData.content;
    }

    if (this.codeElement) {
      if (this.noteData.codeSnippet) {
        this.codeElement.textContent = this.noteData.codeSnippet;
        this.codeElement.style.display = '';
      } else {
        this.codeElement.textContent = '';
        this.codeElement.style.display = 'none';
      }
    }
  }

  /**
   * Render the technical note structure.
   * @returns The rendered aside element
   */
  private render(): HTMLElement {
    const aside = document.createElement('aside');
    aside.className = 'da-technical-note';
    aside.setAttribute('role', 'note');
    aside.setAttribute('aria-label', 'Technical note');

    // Label (static content, no reference needed)
    const label = document.createElement('span');
    label.className = 'da-technical-note-label';
    label.textContent = 'Technical Note';

    // Content
    const content = document.createElement('p');
    content.className = 'da-technical-note-content';
    content.textContent = '';
    this.contentElement = content;

    // Code (optional, hidden by default)
    const code = document.createElement('code');
    code.className = 'da-technical-note-code';
    code.textContent = '';
    code.style.display = 'none';
    this.codeElement = code;

    // Assemble
    aside.appendChild(label);
    aside.appendChild(content);
    aside.appendChild(code);

    return aside;
  }

  /**
   * Show the technical note.
   */
  show(): void {
    this.element?.classList.remove('da-technical-note--hidden');
  }

  /**
   * Hide the technical note.
   */
  hide(): void {
    this.element?.classList.add('da-technical-note--hidden');
  }

  /**
   * Check if the technical note is currently visible.
   * @returns true if visible and mounted, false otherwise
   */
  isVisible(): boolean {
    if (!this.element) return false;
    return !this.element.classList.contains('da-technical-note--hidden');
  }

  /**
   * Get the root element.
   * @returns The aside element or null if not mounted
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
    this.noteData = null;
    this.contentElement = null;
    this.codeElement = null;
  }
}
