// src/story/StoryContent.ts
// Main scrollable content area for Story Mode
// Story 10.2: Create Story Mode Layout

/**
 * StoryContent is the main scrollable content area for Story Mode.
 * Contains chapter headers, narrative text, character cards, dialogue, choices, etc.
 *
 * Layout specification (from UX design):
 * - padding-top: 72px (48px nav + 24px gap)
 * - margin-left: 280px on desktop (220px panel + 60px gap)
 * - max-width: 800px, centered for readability
 * - Responsive: full width on screens <1200px
 */
export class StoryContent {
  private element: HTMLElement | null = null;
  private container: HTMLElement | null = null;

  /**
   * Mount the content area to a DOM element.
   * @param container - The HTML element to mount to
   */
  mount(container: HTMLElement): void {
    this.container = container;
    this.element = this.render();
    this.container.appendChild(this.element);
  }

  /**
   * Render the story content area structure.
   * @returns The rendered main element
   */
  private render(): HTMLElement {
    const content = document.createElement('main');
    content.className = 'da-story-content';
    // Note: <main> has implicit role="main" - no need to set explicitly
    content.setAttribute('aria-label', 'Story content');

    // Inner wrapper for max-width and centering
    const wrapper = document.createElement('div');
    wrapper.className = 'da-story-content-wrapper';

    // Placeholder content showing future component areas
    const placeholder = document.createElement('div');
    placeholder.className = 'da-story-content-placeholder';

    // Chapter header placeholder
    const chapterHeader = document.createElement('div');
    chapterHeader.className = 'da-story-chapter-header-placeholder';

    const chapterEra = document.createElement('span');
    chapterEra.className = 'da-story-chapter-era';
    chapterEra.textContent = 'The Dawn of Silicon • 1971';

    const chapterTitle = document.createElement('h1');
    chapterTitle.className = 'da-story-chapter-title';
    chapterTitle.textContent = 'Chapter 1: First Day';

    const chapterSubtitle = document.createElement('p');
    chapterSubtitle.className = 'da-story-chapter-subtitle';
    chapterSubtitle.textContent = 'Your journey begins at Fairchild Semiconductor';

    chapterHeader.appendChild(chapterEra);
    chapterHeader.appendChild(chapterTitle);
    chapterHeader.appendChild(chapterSubtitle);

    // Scene setting placeholder
    const sceneSetting = document.createElement('div');
    sceneSetting.className = 'da-story-scene-setting';

    const sceneText = document.createElement('p');
    sceneText.className = 'da-story-scene-text';
    sceneText.textContent = 'The fluorescent lights hum overhead as you step onto the production floor. ' +
      'Rows of equipment stretch into the distance, each station a battlefield ' +
      'in the war against entropy and impurity. This is where the future is made.';

    sceneSetting.appendChild(sceneText);

    // Narrative placeholder
    const narrative = document.createElement('div');
    narrative.className = 'da-story-narrative';

    const narrativeText = document.createElement('p');
    narrativeText.className = 'da-story-narrative-text';
    narrativeText.textContent = 'Story content will appear here. Character cards, dialogue blocks, ' +
      'choice options, and technical notes will be rendered by future Story Mode components.';

    narrative.appendChild(narrativeText);

    // Enter the Lab placeholder
    const labButton = document.createElement('div');
    labButton.className = 'da-story-lab-button-area';

    const enterLabBtn = document.createElement('button');
    enterLabBtn.type = 'button';
    enterLabBtn.className = 'da-story-enter-lab-btn';
    enterLabBtn.textContent = 'Enter the Lab';
    enterLabBtn.setAttribute('aria-label', 'Switch to Lab Mode');

    labButton.appendChild(enterLabBtn);

    // Assemble the placeholder
    placeholder.appendChild(chapterHeader);
    placeholder.appendChild(sceneSetting);
    placeholder.appendChild(narrative);
    placeholder.appendChild(labButton);

    wrapper.appendChild(placeholder);
    content.appendChild(wrapper);

    return content;
  }

  /**
   * Show the content area.
   */
  show(): void {
    this.element?.classList.remove('da-story-content--hidden');
  }

  /**
   * Hide the content area.
   */
  hide(): void {
    this.element?.classList.add('da-story-content--hidden');
  }

  /**
   * Check if the content area is currently visible.
   * @returns true if visible and mounted, false otherwise
   */
  isVisible(): boolean {
    if (!this.element) return false;
    return !this.element.classList.contains('da-story-content--hidden');
  }

  /**
   * Get the root element.
   * @returns The content element or null if not mounted
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
  }
}
