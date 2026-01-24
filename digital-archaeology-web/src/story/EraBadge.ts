// src/story/EraBadge.ts
// Era badge component displaying current era year
// Story 10.16: Display Era Badge and Progress

/**
 * EraBadge displays the current historical era (e.g., "1971").
 * Updates dynamically based on story progression.
 *
 * CSS class: da-story-nav-era-badge (already exists)
 */
export class EraBadge {
  private element: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private currentEra: string = '';
  private currentTitle: string | undefined = undefined;

  /**
   * Mount the era badge to a DOM element.
   * @param container - The HTML element to mount to
   */
  mount(container: HTMLElement): void {
    this.container = container;
    this.element = this.render();
    this.container.appendChild(this.element);
  }

  /**
   * Render the era badge element.
   */
  private render(): HTMLElement {
    const badge = document.createElement('span');
    badge.className = 'da-story-nav-era-badge';
    this.updateContent(badge);
    return badge;
  }

  /**
   * Update the badge content based on current era and title.
   */
  private updateContent(element: HTMLElement): void {
    // Use textContent for XSS safety
    if (this.currentTitle) {
      element.textContent = `${this.currentEra} - ${this.currentTitle}`;
    } else {
      element.textContent = this.currentEra;
    }
  }

  /**
   * Set the current era year and optional title.
   * @param year - Era year string (e.g., "1971")
   * @param title - Optional era title (e.g., "Dawn of the Microprocessor")
   */
  setEra(year: string, title?: string): void {
    this.currentEra = year;
    this.currentTitle = title;

    if (this.element) {
      this.updateContent(this.element);
    }
  }

  /**
   * Get the current era year.
   */
  getEra(): string {
    return this.currentEra;
  }

  /**
   * Get the current era title.
   */
  getTitle(): string | undefined {
    return this.currentTitle;
  }

  /**
   * Get the root element.
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
