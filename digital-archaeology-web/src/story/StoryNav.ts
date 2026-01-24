// src/story/StoryNav.ts
// Fixed navigation bar for Story Mode (48px height, position: fixed)
// Story 10.2: Create Story Mode Layout
// Story 10.3: Add ModeToggle integration and Journal button

import { ModeToggle } from '@ui/ModeToggle';
import type { ThemeMode } from '@ui/theme';

/**
 * Configuration options for the StoryNav component.
 */
export interface StoryNavOptions {
  /** Current active mode */
  currentMode: ThemeMode;
  /** Callback when mode changes */
  onModeChange: (mode: ThemeMode) => void;
}

/**
 * StoryNav is the fixed navigation bar component for Story Mode.
 * Contains: logo, Story/Lab toggle, progress dots, era badge, and action buttons.
 *
 * Layout specification (from UX design):
 * - Height: 48px
 * - Position: fixed at top
 * - z-index: 100 (above content)
 * - Background: warm gold-tinted dark
 */
export class StoryNav {
  private element: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private modeToggle: ModeToggle | null = null;
  private currentMode: ThemeMode;
  private onModeChange: (mode: ThemeMode) => void;

  constructor(options: StoryNavOptions) {
    this.currentMode = options.currentMode;
    this.onModeChange = options.onModeChange;
  }

  /**
   * Mount the navigation bar to a DOM element.
   * @param container - The HTML element to mount to
   */
  mount(container: HTMLElement): void {
    this.container = container;
    this.element = this.render();
    this.container.appendChild(this.element);
    this.mountModeToggle();
  }

  /**
   * Render the navigation bar structure.
   * @returns The rendered header element
   */
  private render(): HTMLElement {
    const nav = document.createElement('header');
    nav.className = 'da-story-nav';
    // Note: <header> has implicit role="banner" - no need to set explicitly
    nav.setAttribute('aria-label', 'Story mode navigation');

    // Build DOM structure programmatically for safety
    const content = document.createElement('div');
    content.className = 'da-story-nav-content';

    // Left section: logo and toggle area
    const left = document.createElement('div');
    left.className = 'da-story-nav-left';

    const logo = document.createElement('span');
    logo.className = 'da-story-nav-logo';
    logo.textContent = 'Digital Archaeology';

    const toggleArea = document.createElement('div');
    toggleArea.className = 'da-story-nav-toggle-area';
    // ModeToggle will be mounted here by mountModeToggle()

    left.appendChild(logo);
    left.appendChild(toggleArea);

    // Center section: progress dots
    const center = document.createElement('div');
    center.className = 'da-story-nav-center';

    const progress = document.createElement('div');
    progress.className = 'da-story-nav-progress';
    progress.setAttribute('aria-label', 'Story progress');

    const progressLabel = document.createElement('span');
    progressLabel.className = 'da-story-nav-progress-label';
    progressLabel.textContent = 'Act:';

    const progressDots = document.createElement('span');
    progressDots.className = 'da-story-nav-progress-dots';

    // Create 5 progress dots
    for (let i = 0; i < 5; i++) {
      const dot = document.createElement('span');
      dot.className = i === 0 ? 'da-progress-dot da-progress-dot--active' : 'da-progress-dot';
      dot.setAttribute('aria-label', i === 0 ? 'Current act' : `Act ${i + 1}`);
      progressDots.appendChild(dot);
    }

    progress.appendChild(progressLabel);
    progress.appendChild(progressDots);
    center.appendChild(progress);

    // Right section: era badge, journal button, and save button
    const right = document.createElement('div');
    right.className = 'da-story-nav-right';

    const eraBadge = document.createElement('span');
    eraBadge.className = 'da-story-nav-era-badge';
    eraBadge.textContent = '1971';

    const journalButton = document.createElement('button');
    journalButton.type = 'button';
    journalButton.className = 'da-story-nav-action';
    journalButton.setAttribute('aria-label', 'Open journal');
    journalButton.textContent = 'Journal';

    const saveButton = document.createElement('button');
    saveButton.type = 'button';
    saveButton.className = 'da-story-nav-action';
    saveButton.setAttribute('aria-label', 'Save progress');
    saveButton.textContent = 'Save';

    right.appendChild(eraBadge);
    right.appendChild(journalButton);
    right.appendChild(saveButton);

    // Assemble the nav
    content.appendChild(left);
    content.appendChild(center);
    content.appendChild(right);
    nav.appendChild(content);

    return nav;
  }

  /**
   * Mount the ModeToggle component into the toggle area.
   */
  private mountModeToggle(): void {
    if (!this.element) return;

    const toggleArea = this.element.querySelector('.da-story-nav-toggle-area');
    if (toggleArea) {
      this.modeToggle = new ModeToggle({
        currentMode: this.currentMode,
        onModeChange: this.onModeChange,
      });
      this.modeToggle.mount(toggleArea as HTMLElement);
    }
  }

  /**
   * Update the current mode and sync ModeToggle state.
   * @param mode - The new active mode
   */
  setMode(mode: ThemeMode): void {
    this.currentMode = mode;
    this.modeToggle?.setMode(mode);
  }

  /**
   * Show the navigation bar.
   */
  show(): void {
    this.element?.classList.remove('da-story-nav--hidden');
  }

  /**
   * Hide the navigation bar.
   */
  hide(): void {
    this.element?.classList.add('da-story-nav--hidden');
  }

  /**
   * Check if the navigation bar is currently visible.
   * @returns true if visible and mounted, false otherwise
   */
  isVisible(): boolean {
    if (!this.element) return false;
    return !this.element.classList.contains('da-story-nav--hidden');
  }

  /**
   * Get the root element.
   * @returns The navigation element or null if not mounted
   */
  getElement(): HTMLElement | null {
    return this.element;
  }

  /**
   * Destroy the component and clean up resources.
   */
  destroy(): void {
    // Destroy ModeToggle first
    if (this.modeToggle) {
      this.modeToggle.destroy();
      this.modeToggle = null;
    }

    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    this.container = null;
  }
}
