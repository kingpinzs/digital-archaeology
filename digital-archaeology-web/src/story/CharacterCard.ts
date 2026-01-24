// src/story/CharacterCard.ts
// Character card component for Story Mode
// Story 10.7: Create Character Card Component

import type { CharacterData } from './types';

/**
 * CharacterCard displays NPC information in Story Mode.
 * Shows avatar, name (gold), title (uppercase), bio, and stats.
 *
 * Layout specification (from UX design):
 * - Avatar: Large emoji display (48px)
 * - Name: Gold accent color, serif font, 24px
 * - Title: Uppercase, letter-spacing 0.1em, secondary color
 * - Bio: Serif font, 16px, readable line-height
 * - Stats: Horizontal layout with pipe separators
 */
export class CharacterCard {
  private element: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private characterData: CharacterData | null = null;

  // Element references for dynamic updates
  private avatarElement: HTMLElement | null = null;
  private nameElement: HTMLElement | null = null;
  private titleElement: HTMLElement | null = null;
  private bioElement: HTMLElement | null = null;
  private statsContainer: HTMLElement | null = null;

  /**
   * Mount the character card to a DOM element.
   * @param container - The HTML element to mount to
   */
  mount(container: HTMLElement): void {
    this.container = container;
    this.element = this.render();
    this.container.appendChild(this.element);

    // Apply any data that was set before mount
    if (this.characterData) {
      this.updateDisplay();
    }
  }

  /**
   * Set the character data and update the display.
   * @param data - The character data to display
   */
  setCharacterData(data: CharacterData): void {
    this.characterData = data;
    this.updateDisplay();
  }

  /**
   * Update all displayed values based on current characterData.
   */
  private updateDisplay(): void {
    if (!this.characterData) return;

    if (this.avatarElement) {
      this.avatarElement.textContent = this.characterData.avatar;
    }
    if (this.nameElement) {
      this.nameElement.textContent = this.characterData.name;
    }
    if (this.titleElement) {
      this.titleElement.textContent = this.characterData.title;
    }
    if (this.bioElement) {
      this.bioElement.textContent = this.characterData.bio;
    }
    if (this.statsContainer) {
      this.renderStats();
    }
  }

  /**
   * Render the stats section with dynamic content.
   */
  private renderStats(): void {
    if (!this.statsContainer || !this.characterData) return;

    // Clear existing stats
    this.statsContainer.innerHTML = '';

    this.characterData.stats.forEach((stat, index) => {
      if (index > 0) {
        // Add separator between stats
        const separator = document.createElement('span');
        separator.className = 'da-character-card-stat-separator';
        separator.textContent = '│';
        this.statsContainer!.appendChild(separator);
      }

      const statItem = document.createElement('div');
      statItem.className = 'da-character-card-stat';

      const label = document.createElement('span');
      label.className = 'da-character-card-stat-label';
      label.textContent = stat.label + ': ';

      const value = document.createElement('span');
      value.className = 'da-character-card-stat-value';
      value.textContent = stat.value;

      statItem.appendChild(label);
      statItem.appendChild(value);
      this.statsContainer!.appendChild(statItem);
    });
  }

  /**
   * Render the character card structure.
   * @returns The rendered article element
   */
  private render(): HTMLElement {
    const article = document.createElement('article');
    article.className = 'da-character-card';
    article.setAttribute('aria-label', 'Character information');

    // Avatar section
    const avatarWrapper = document.createElement('div');
    avatarWrapper.className = 'da-character-card-avatar';

    const avatarEmoji = document.createElement('span');
    avatarEmoji.className = 'da-character-card-avatar-emoji';
    avatarEmoji.textContent = '👤'; // Default
    this.avatarElement = avatarEmoji;
    avatarWrapper.appendChild(avatarEmoji);

    // Header section (name + title)
    const header = document.createElement('div');
    header.className = 'da-character-card-header';

    const name = document.createElement('h3');
    name.className = 'da-character-card-name';
    name.textContent = 'Character Name';
    this.nameElement = name;

    const title = document.createElement('span');
    title.className = 'da-character-card-title';
    title.textContent = 'CHARACTER TITLE';
    this.titleElement = title;

    header.appendChild(name);
    header.appendChild(title);

    // First separator
    const separator1 = document.createElement('div');
    separator1.className = 'da-character-card-separator';

    // Bio section
    const bio = document.createElement('p');
    bio.className = 'da-character-card-bio';
    bio.textContent = 'Character bio will appear here...';
    this.bioElement = bio;

    // Second separator
    const separator2 = document.createElement('div');
    separator2.className = 'da-character-card-separator';

    // Stats section
    const stats = document.createElement('div');
    stats.className = 'da-character-card-stats';
    this.statsContainer = stats;

    // Assemble
    article.appendChild(avatarWrapper);
    article.appendChild(header);
    article.appendChild(separator1);
    article.appendChild(bio);
    article.appendChild(separator2);
    article.appendChild(stats);

    return article;
  }

  /**
   * Show the character card.
   */
  show(): void {
    this.element?.classList.remove('da-character-card--hidden');
  }

  /**
   * Hide the character card.
   */
  hide(): void {
    this.element?.classList.add('da-character-card--hidden');
  }

  /**
   * Check if the character card is currently visible.
   * @returns true if visible and mounted, false otherwise
   */
  isVisible(): boolean {
    if (!this.element) return false;
    return !this.element.classList.contains('da-character-card--hidden');
  }

  /**
   * Get the root element.
   * @returns The article element or null if not mounted
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
    this.characterData = null;
    this.avatarElement = null;
    this.nameElement = null;
    this.titleElement = null;
    this.bioElement = null;
    this.statsContainer = null;
  }
}
