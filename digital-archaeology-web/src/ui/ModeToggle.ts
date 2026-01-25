// src/ui/ModeToggle.ts
// Toggle component for switching between Story and Lab modes

import type { ThemeMode } from './theme';

/**
 * Configuration options for the ModeToggle component.
 */
export interface ModeToggleOptions {
  /** Current active mode */
  currentMode: ThemeMode;
  /** Callback when mode changes */
  onModeChange: (mode: ThemeMode) => void;
}

/**
 * ModeToggle component provides buttons to switch between Story and Lab modes.
 * Renders as a tablist with two tab buttons for accessibility.
 */
export class ModeToggle {
  private element: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private currentMode: ThemeMode;
  private onModeChange: (mode: ThemeMode) => void;
  private storyButton: HTMLButtonElement | null = null;
  private labButton: HTMLButtonElement | null = null;

  // Bound event handlers for cleanup
  private boundStoryClickHandler: (() => void) | null = null;
  private boundLabClickHandler: (() => void) | null = null;
  private boundKeydownHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(options: ModeToggleOptions) {
    this.currentMode = options.currentMode;
    this.onModeChange = options.onModeChange;
  }

  /**
   * Mount the toggle to a container element.
   * @param container - The HTML element to mount to
   */
  mount(container: HTMLElement): void {
    this.container = container;
    this.element = this.render();
    this.container.appendChild(this.element);
    this.cacheElements();
    this.attachEventListeners();
    this.updateActiveState();
  }

  /**
   * Update the current mode and refresh button states.
   * @param mode - The new active mode
   */
  setMode(mode: ThemeMode): void {
    this.currentMode = mode;
    this.updateActiveState();
  }

  /**
   * Get the current mode.
   * @returns The current theme mode
   */
  getMode(): ThemeMode {
    return this.currentMode;
  }

  /**
   * Destroy the component and clean up resources.
   */
  destroy(): void {
    this.removeEventListeners();

    if (this.element) {
      this.element.remove();
      this.element = null;
    }

    this.storyButton = null;
    this.labButton = null;
    this.container = null;
  }

  /**
   * Render the toggle HTML structure.
   */
  private render(): HTMLElement {
    const toggle = document.createElement('div');
    toggle.className = 'da-mode-toggle';
    toggle.setAttribute('role', 'tablist');
    toggle.setAttribute('aria-label', 'View mode');

    // Story mode button
    const storyBtn = document.createElement('button');
    storyBtn.className = 'da-mode-toggle-btn';
    storyBtn.setAttribute('role', 'tab');
    storyBtn.setAttribute('data-mode', 'story');
    storyBtn.setAttribute('aria-selected', 'false');
    storyBtn.setAttribute('tabindex', '-1');
    storyBtn.innerHTML = '<span class="da-mode-toggle-icon">📜</span><span class="da-mode-toggle-label">Story</span>';
    toggle.appendChild(storyBtn);

    // Lab mode button
    const labBtn = document.createElement('button');
    labBtn.className = 'da-mode-toggle-btn';
    labBtn.setAttribute('role', 'tab');
    labBtn.setAttribute('data-mode', 'lab');
    labBtn.setAttribute('aria-selected', 'false');
    labBtn.setAttribute('tabindex', '-1');
    labBtn.innerHTML = '<span class="da-mode-toggle-icon">⚡</span><span class="da-mode-toggle-label">Lab</span>';
    toggle.appendChild(labBtn);

    return toggle;
  }

  /**
   * Cache element references.
   */
  private cacheElements(): void {
    if (!this.element) return;
    this.storyButton = this.element.querySelector('[data-mode="story"]');
    this.labButton = this.element.querySelector('[data-mode="lab"]');
  }

  /**
   * Attach event listeners.
   */
  private attachEventListeners(): void {
    if (this.storyButton) {
      this.boundStoryClickHandler = () => this.handleModeClick('story');
      this.storyButton.addEventListener('click', this.boundStoryClickHandler);
    }

    if (this.labButton) {
      this.boundLabClickHandler = () => this.handleModeClick('lab');
      this.labButton.addEventListener('click', this.boundLabClickHandler);
    }

    // Keyboard navigation for arrow keys within tablist
    if (this.element) {
      this.boundKeydownHandler = (e: KeyboardEvent) => this.handleKeydown(e);
      this.element.addEventListener('keydown', this.boundKeydownHandler);
    }
  }

  /**
   * Remove event listeners.
   */
  private removeEventListeners(): void {
    if (this.storyButton && this.boundStoryClickHandler) {
      this.storyButton.removeEventListener('click', this.boundStoryClickHandler);
    }
    if (this.labButton && this.boundLabClickHandler) {
      this.labButton.removeEventListener('click', this.boundLabClickHandler);
    }
    if (this.element && this.boundKeydownHandler) {
      this.element.removeEventListener('keydown', this.boundKeydownHandler);
    }

    this.boundStoryClickHandler = null;
    this.boundLabClickHandler = null;
    this.boundKeydownHandler = null;
  }

  /**
   * Handle mode button click.
   * @param mode - The mode that was clicked
   */
  private handleModeClick(mode: ThemeMode): void {
    if (mode !== this.currentMode) {
      this.currentMode = mode;
      this.updateActiveState();
      this.onModeChange(mode);
    }
  }

  /**
   * Handle keyboard navigation within tablist.
   * @param e - Keyboard event
   */
  private handleKeydown(e: KeyboardEvent): void {
    const target = e.target as HTMLElement;
    if (!target.hasAttribute('data-mode')) return;

    const modes: ThemeMode[] = ['story', 'lab'];
    const currentIndex = modes.indexOf(this.currentMode);

    switch (e.key) {
      case 'ArrowLeft': {
        e.preventDefault();
        // Move to previous mode (wrap around)
        const prevIndex = currentIndex === 0 ? modes.length - 1 : currentIndex - 1;
        const prevMode = modes[prevIndex];
        this.getButtonForMode(prevMode)?.focus();
        this.handleModeClick(prevMode);
        break;
      }
      case 'ArrowRight': {
        e.preventDefault();
        // Move to next mode (wrap around)
        const nextIndex = (currentIndex + 1) % modes.length;
        const nextMode = modes[nextIndex];
        this.getButtonForMode(nextMode)?.focus();
        this.handleModeClick(nextMode);
        break;
      }
      case 'Home': {
        e.preventDefault();
        this.storyButton?.focus();
        if (this.currentMode !== 'story') {
          this.handleModeClick('story');
        }
        break;
      }
      case 'End': {
        e.preventDefault();
        this.labButton?.focus();
        if (this.currentMode !== 'lab') {
          this.handleModeClick('lab');
        }
        break;
      }
      case 'Enter':
      case ' ': {
        // Activate the focused button (Space key is ' ')
        e.preventDefault();
        const mode = target.getAttribute('data-mode') as ThemeMode;
        if (mode) {
          this.handleModeClick(mode);
        }
        break;
      }
    }
  }

  /**
   * Get the button element for a given mode.
   */
  private getButtonForMode(mode: ThemeMode): HTMLButtonElement | null {
    switch (mode) {
      case 'story': return this.storyButton;
      case 'lab': return this.labButton;
    }
  }

  /**
   * Update active state styling on buttons.
   */
  private updateActiveState(): void {
    if (!this.storyButton || !this.labButton) return;

    const isStoryActive = this.currentMode === 'story';
    const isLabActive = this.currentMode === 'lab';

    // Update Story button
    this.storyButton.classList.toggle('da-mode-toggle-btn--active', isStoryActive);
    this.storyButton.setAttribute('aria-selected', String(isStoryActive));
    this.storyButton.setAttribute('tabindex', isStoryActive ? '0' : '-1');

    // Update Lab button
    this.labButton.classList.toggle('da-mode-toggle-btn--active', isLabActive);
    this.labButton.setAttribute('aria-selected', String(isLabActive));
    this.labButton.setAttribute('tabindex', isLabActive ? '0' : '-1');
  }
}
