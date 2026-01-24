// src/story/ChoiceCard.ts
// Choice card component for Story Mode
// Story 10.9: Create Choice Card Component

import type { ChoiceData } from './types';

/**
 * ChoiceCard displays an interactive story choice in Story Mode.
 * Features hover effects with gold border and slide animation.
 *
 * Layout specification (from UX design):
 * - Container: Full-width button with flex layout
 * - Icon: Emoji on left (gold color)
 * - Content: Title (gold, bold) + Description (secondary)
 * - Arrow: Right arrow indicator
 * - Hover: translateX(8px), gold border, background tint
 */
export class ChoiceCard {
  private element: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private choiceData: ChoiceData | null = null;
  private onSelectCallback: ((choiceId: string) => void) | null = null;

  // Element references for dynamic updates
  private iconElement: HTMLElement | null = null;
  private titleElement: HTMLElement | null = null;
  private descriptionElement: HTMLElement | null = null;

  // Bound handler for proper cleanup
  private boundHandleClick: (e: MouseEvent) => void;

  constructor() {
    this.boundHandleClick = this.handleClick.bind(this);
  }

  /**
   * Mount the choice card to a DOM element.
   * @param container - The HTML element to mount to
   */
  mount(container: HTMLElement): void {
    this.container = container;
    this.element = this.render();
    this.element.addEventListener('click', this.boundHandleClick);
    this.container.appendChild(this.element);

    // Apply any data that was set before mount
    if (this.choiceData) {
      this.updateDisplay();
    }
  }

  /**
   * Register a callback for when the choice is selected.
   * @param callback - Function called with choice id when clicked
   */
  onSelect(callback: (choiceId: string) => void): void {
    this.onSelectCallback = callback;
  }

  /**
   * Handle click events on the card.
   */
  private handleClick(_e: MouseEvent): void {
    if (this.choiceData && this.onSelectCallback) {
      this.onSelectCallback(this.choiceData.id);
    }
  }

  /**
   * Set the choice data and update the display.
   * @param data - The choice data to display
   */
  setChoiceData(data: ChoiceData): void {
    this.choiceData = data;
    this.updateDisplay();
  }

  /**
   * Update all displayed values based on current choiceData.
   */
  private updateDisplay(): void {
    if (!this.choiceData) return;

    if (this.iconElement) {
      this.iconElement.textContent = this.choiceData.icon;
    }
    if (this.titleElement) {
      this.titleElement.textContent = this.choiceData.title;
    }
    if (this.descriptionElement) {
      this.descriptionElement.textContent = this.choiceData.description;
    }
    if (this.element) {
      this.element.setAttribute('aria-label', `Choice: ${this.choiceData.title}`);
    }
  }

  /**
   * Render the choice card structure.
   * @returns The rendered button element
   */
  private render(): HTMLElement {
    const button = document.createElement('button');
    button.className = 'da-choice-card';
    button.setAttribute('type', 'button');
    button.setAttribute('aria-label', 'Story choice');

    // Icon
    const icon = document.createElement('span');
    icon.className = 'da-choice-card-icon';
    icon.textContent = '';
    this.iconElement = icon;

    // Content wrapper
    const content = document.createElement('div');
    content.className = 'da-choice-card-content';

    const title = document.createElement('span');
    title.className = 'da-choice-card-title';
    title.textContent = '';
    this.titleElement = title;

    const description = document.createElement('p');
    description.className = 'da-choice-card-description';
    description.textContent = '';
    this.descriptionElement = description;

    content.appendChild(title);
    content.appendChild(description);

    // Arrow indicator
    const arrow = document.createElement('span');
    arrow.className = 'da-choice-card-arrow';
    arrow.textContent = '→';
    arrow.setAttribute('aria-hidden', 'true');

    // Assemble
    button.appendChild(icon);
    button.appendChild(content);
    button.appendChild(arrow);

    return button;
  }

  /**
   * Show the choice card.
   */
  show(): void {
    this.element?.classList.remove('da-choice-card--hidden');
  }

  /**
   * Hide the choice card.
   */
  hide(): void {
    this.element?.classList.add('da-choice-card--hidden');
  }

  /**
   * Check if the choice card is currently visible.
   * @returns true if visible and mounted, false otherwise
   */
  isVisible(): boolean {
    if (!this.element) return false;
    return !this.element.classList.contains('da-choice-card--hidden');
  }

  /**
   * Get the root element.
   * @returns The button element or null if not mounted
   */
  getElement(): HTMLElement | null {
    return this.element;
  }

  /**
   * Destroy the component and clean up resources.
   */
  destroy(): void {
    if (this.element) {
      this.element.removeEventListener('click', this.boundHandleClick);
      this.element.remove();
      this.element = null;
    }
    this.container = null;
    this.choiceData = null;
    this.onSelectCallback = null;
    this.iconElement = null;
    this.titleElement = null;
    this.descriptionElement = null;
  }
}
