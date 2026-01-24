// src/story/DialogueBlock.ts
// Dialogue block component for Story Mode
// Story 10.8: Create Dialogue Block Component

import type { DialogueData } from './types';

/**
 * DialogueBlock displays character dialogue in Story Mode.
 * Features a copper left border, uppercase speaker name, and serif dialogue text.
 *
 * Layout specification (from UX design):
 * - Container: Left border in copper accent (4px)
 * - Speaker: Uppercase, small font, copper color
 * - Text: Serif font, secondary color, line-height 1.7
 */
export class DialogueBlock {
  private element: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private dialogueData: DialogueData | null = null;

  // Element references for dynamic updates
  private speakerElement: HTMLElement | null = null;
  private textElement: HTMLElement | null = null;

  /**
   * Mount the dialogue block to a DOM element.
   * @param container - The HTML element to mount to
   */
  mount(container: HTMLElement): void {
    this.container = container;
    this.element = this.render();
    this.container.appendChild(this.element);

    // Apply any data that was set before mount
    if (this.dialogueData) {
      this.updateDisplay();
    }
  }

  /**
   * Set the dialogue data and update the display.
   * @param data - The dialogue data to display
   */
  setDialogueData(data: DialogueData): void {
    this.dialogueData = data;
    this.updateDisplay();
  }

  /**
   * Update all displayed values based on current dialogueData.
   */
  private updateDisplay(): void {
    if (!this.dialogueData) return;

    if (this.speakerElement) {
      this.speakerElement.textContent = this.dialogueData.speaker;
    }
    if (this.textElement) {
      this.textElement.textContent = this.dialogueData.text;
    }
  }

  /**
   * Render the dialogue block structure.
   * @returns The rendered blockquote element
   */
  private render(): HTMLElement {
    const blockquote = document.createElement('blockquote');
    blockquote.className = 'da-dialogue-block';
    blockquote.setAttribute('aria-label', 'Character dialogue');

    // Speaker name (using cite for semantic attribution)
    const speaker = document.createElement('cite');
    speaker.className = 'da-dialogue-block-speaker';
    speaker.textContent = ''; // Empty until data is set
    this.speakerElement = speaker;

    // Dialogue text
    const text = document.createElement('p');
    text.className = 'da-dialogue-block-text';
    text.textContent = ''; // Empty until data is set
    this.textElement = text;

    // Assemble
    blockquote.appendChild(speaker);
    blockquote.appendChild(text);

    return blockquote;
  }

  /**
   * Show the dialogue block.
   */
  show(): void {
    this.element?.classList.remove('da-dialogue-block--hidden');
  }

  /**
   * Hide the dialogue block.
   */
  hide(): void {
    this.element?.classList.add('da-dialogue-block--hidden');
  }

  /**
   * Check if the dialogue block is currently visible.
   * @returns true if visible and mounted, false otherwise
   */
  isVisible(): boolean {
    if (!this.element) return false;
    return !this.element.classList.contains('da-dialogue-block--hidden');
  }

  /**
   * Get the root element.
   * @returns The blockquote element or null if not mounted
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
    this.dialogueData = null;
    this.speakerElement = null;
    this.textElement = null;
  }
}
