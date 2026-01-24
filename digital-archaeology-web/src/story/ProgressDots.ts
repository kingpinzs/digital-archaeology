// src/story/ProgressDots.ts
// Progress dots component displaying act progression
// Story 10.16: Display Era Badge and Progress

import type { ProgressDisplayData, ActProgress } from './ProgressDisplay';

/**
 * ProgressDots displays act progression as a series of dots.
 * - Pending acts: empty circle (da-progress-dot)
 * - Current act: filled, highlighted (da-progress-dot da-progress-dot--active)
 * - Completed acts: filled (da-progress-dot da-progress-dot--completed)
 *
 * Visual format: ● ● ● ○ ○ (3 completed, on act 3, 2 pending)
 */
export class ProgressDots {
  private element: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private dots: HTMLElement[] = [];
  private progressData: ProgressDisplayData | null = null;

  /**
   * Mount the progress dots to a DOM element.
   * @param container - The HTML element to mount to
   */
  mount(container: HTMLElement): void {
    this.container = container;
    this.element = this.render();
    this.container.appendChild(this.element);
  }

  /**
   * Render the progress dots container.
   */
  private render(): HTMLElement {
    const wrapper = document.createElement('span');
    wrapper.className = 'da-story-nav-progress-dots';
    return wrapper;
  }

  /**
   * Update the progress display.
   * @param data - Progress display data with acts array
   */
  setProgress(data: ProgressDisplayData): void {
    this.progressData = data;
    this.renderDots();
  }

  /**
   * Render or update the dots based on current progress data.
   */
  private renderDots(): void {
    if (!this.element || !this.progressData) {
      return;
    }

    // Clear existing dots
    this.element.textContent = '';
    this.dots = [];

    // Create dots for each act
    for (const act of this.progressData.acts) {
      const dot = this.createDot(act);
      this.dots.push(dot);
      this.element.appendChild(dot);
    }
  }

  /**
   * Create a single dot element with appropriate state.
   */
  private createDot(act: ActProgress): HTMLElement {
    const dot = document.createElement('span');

    // Build class list based on state
    const classes = ['da-progress-dot'];
    if (act.isCurrent) {
      classes.push('da-progress-dot--active');
    } else if (act.isCompleted) {
      classes.push('da-progress-dot--completed');
    }
    dot.className = classes.join(' ');

    // Set aria-label for accessibility
    dot.setAttribute('aria-label', this.getAriaLabel(act));

    return dot;
  }

  /**
   * Generate aria-label for a dot based on its state.
   */
  private getAriaLabel(act: ActProgress): string {
    const totalActs = this.progressData?.totalActs ?? 5;
    const baseLabel = `Act ${act.actNumber} of ${totalActs}`;

    if (act.isCurrent) {
      return `Current act, ${baseLabel}`;
    } else if (act.isCompleted) {
      return `Completed, ${baseLabel}`;
    }
    return baseLabel;
  }

  /**
   * Get the current progress data.
   */
  getProgress(): ProgressDisplayData | null {
    return this.progressData;
  }

  /**
   * Get the root element.
   */
  getElement(): HTMLElement | null {
    return this.element;
  }

  /**
   * Get all dot elements (for testing).
   */
  getDots(): HTMLElement[] {
    return [...this.dots];
  }

  /**
   * Destroy the component and clean up resources.
   */
  destroy(): void {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    this.dots = [];
    this.container = null;
    this.progressData = null;
  }
}
