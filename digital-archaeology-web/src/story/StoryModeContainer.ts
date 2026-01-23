// src/story/StoryModeContainer.ts
// Stub container for Story Mode - displays placeholder until full implementation (Story 10.2+)

/**
 * StoryModeContainer is a placeholder component for Story Mode.
 * It will be fully implemented in Stories 10.2 through 10.16.
 * Currently displays a "Coming Soon" message with story-mode styling.
 */
export class StoryModeContainer {
  private element: HTMLElement | null = null;
  private container: HTMLElement | null = null;

  /**
   * Mount the story mode container to a DOM element.
   * @param container - The HTML element to mount to
   */
  mount(container: HTMLElement): void {
    this.container = container;
    this.element = this.render();
    this.container.appendChild(this.element);
  }

  /**
   * Render the story mode placeholder content.
   * @returns The rendered HTML element
   */
  private render(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'da-story-mode-container';

    // Note: innerHTML with static template - no user input, safe from XSS
    wrapper.innerHTML = `
      <div class="da-story-placeholder">
        <div class="da-story-placeholder-icon">📜</div>
        <h2 class="da-story-placeholder-title">Story Mode</h2>
        <p class="da-story-placeholder-subtitle">Coming Soon</p>
        <p class="da-story-placeholder-description">
          Experience the narrative journey of CPU development through the ages.
          Follow characters, make choices, and learn by building.
        </p>
      </div>
    `;

    return wrapper;
  }

  /**
   * Show the story mode container.
   */
  show(): void {
    this.element?.classList.remove('da-story-mode-container--hidden');
  }

  /**
   * Hide the story mode container.
   */
  hide(): void {
    this.element?.classList.add('da-story-mode-container--hidden');
  }

  /**
   * Check if the container is currently visible.
   * @returns true if visible, false otherwise
   */
  isVisible(): boolean {
    return !this.element?.classList.contains('da-story-mode-container--hidden');
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
