// src/story/StoryContent.ts
// Main scrollable content area for Story Mode
// Story 10.2: Create Story Mode Layout
// Story 10.17: Wire Story Mode Integration - Add dynamic scene rendering

/**
 * StoryContent is the main scrollable content area for Story Mode.
 * Contains dynamically rendered story content via SceneRenderer.
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
  private sceneMount: HTMLElement | null = null;

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
   * Get the scene mount point for SceneRenderer.
   * @returns The mount element for scene rendering
   */
  getSceneMount(): HTMLElement | null {
    return this.sceneMount;
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
    content.setAttribute('aria-live', 'polite');

    // Inner wrapper for max-width and centering
    const wrapper = document.createElement('div');
    wrapper.className = 'da-story-content-wrapper';

    // Scene mount point for dynamic content
    const sceneMount = document.createElement('div');
    sceneMount.className = 'da-story-scene-mount';
    sceneMount.setAttribute('data-story-component', 'scene');
    this.sceneMount = sceneMount;

    wrapper.appendChild(sceneMount);
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
    this.sceneMount = null;
  }
}
