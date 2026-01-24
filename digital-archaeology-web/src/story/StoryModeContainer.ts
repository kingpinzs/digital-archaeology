// src/story/StoryModeContainer.ts
// Container component for Story Mode - composes layout components
// Story 10.1: Initial stub, Story 10.2: Full layout integration
// Story 10.3: Add options pattern for mode change callbacks

import { StoryNav } from './StoryNav';
import { YourRolePanel } from './YourRolePanel';
import { StoryContent } from './StoryContent';
import type { ThemeMode } from '@ui/theme';

/**
 * Configuration options for the StoryModeContainer component.
 */
export interface StoryModeContainerOptions {
  /** Current active mode */
  currentMode: ThemeMode;
  /** Callback when mode changes */
  onModeChange: (mode: ThemeMode) => void;
}

/**
 * StoryModeContainer is the root component for Story Mode.
 * It composes and manages the Story Mode layout:
 * - StoryNav: Fixed 48px navigation bar at top
 * - YourRolePanel: Fixed 220px panel on left (desktop only)
 * - StoryContent: Main scrollable content area
 *
 * Layout specification (from UX design):
 * - Background: warm dark (#0a0a12)
 * - Typography: Crimson Text for narrative elements
 * - Responsive: YourRolePanel hidden < 1200px
 */
export class StoryModeContainer {
  private element: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private options: StoryModeContainerOptions;

  // Child components
  private storyNav: StoryNav | null = null;
  private yourRolePanel: YourRolePanel | null = null;
  private storyContent: StoryContent | null = null;

  constructor(options: StoryModeContainerOptions) {
    this.options = options;
  }

  /**
   * Mount the story mode container to a DOM element.
   * @param container - The HTML element to mount to
   */
  mount(container: HTMLElement): void {
    this.container = container;
    this.element = this.render();
    this.container.appendChild(this.element);

    // Mount child components
    this.mountChildren();
  }

  /**
   * Render the story mode container structure.
   * @returns The rendered HTML element
   */
  private render(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'da-story-mode-container';

    // Create mount points for child components
    const navMount = document.createElement('div');
    navMount.className = 'da-story-nav-mount';
    navMount.setAttribute('data-story-component', 'nav');

    const panelMount = document.createElement('div');
    panelMount.className = 'da-story-panel-mount';
    panelMount.setAttribute('data-story-component', 'panel');

    const contentMount = document.createElement('div');
    contentMount.className = 'da-story-content-mount';
    contentMount.setAttribute('data-story-component', 'content');

    wrapper.appendChild(navMount);
    wrapper.appendChild(panelMount);
    wrapper.appendChild(contentMount);

    return wrapper;
  }

  /**
   * Mount all child components to their respective mount points.
   */
  private mountChildren(): void {
    if (!this.element) return;

    const navMount = this.element.querySelector('[data-story-component="nav"]');
    const panelMount = this.element.querySelector('[data-story-component="panel"]');
    const contentMount = this.element.querySelector('[data-story-component="content"]');

    if (navMount) {
      this.storyNav = new StoryNav({
        currentMode: this.options.currentMode,
        onModeChange: this.options.onModeChange,
      });
      this.storyNav.mount(navMount as HTMLElement);
    }

    if (panelMount) {
      this.yourRolePanel = new YourRolePanel();
      this.yourRolePanel.mount(panelMount as HTMLElement);
    }

    if (contentMount) {
      this.storyContent = new StoryContent();
      this.storyContent.mount(contentMount as HTMLElement);
    }
  }

  /**
   * Show the story mode container and all child components.
   */
  show(): void {
    this.element?.classList.remove('da-story-mode-container--hidden');
    this.storyNav?.show();
    this.yourRolePanel?.show();
    this.storyContent?.show();
  }

  /**
   * Hide the story mode container and all child components.
   */
  hide(): void {
    this.element?.classList.add('da-story-mode-container--hidden');
    this.storyNav?.hide();
    this.yourRolePanel?.hide();
    this.storyContent?.hide();
  }

  /**
   * Check if the container is currently visible.
   * @returns true if visible, false otherwise
   */
  isVisible(): boolean {
    return !this.element?.classList.contains('da-story-mode-container--hidden');
  }

  /**
   * Get the StoryNav component instance.
   * @returns The StoryNav component or null if not mounted
   */
  getStoryNav(): StoryNav | null {
    return this.storyNav;
  }

  /**
   * Get the YourRolePanel component instance.
   * @returns The YourRolePanel component or null if not mounted
   */
  getYourRolePanel(): YourRolePanel | null {
    return this.yourRolePanel;
  }

  /**
   * Get the StoryContent component instance.
   * @returns The StoryContent component or null if not mounted
   */
  getStoryContent(): StoryContent | null {
    return this.storyContent;
  }

  /**
   * Update the current mode and sync StoryNav's ModeToggle state.
   * @param mode - The new active mode
   */
  setMode(mode: ThemeMode): void {
    this.storyNav?.setMode(mode);
  }

  /**
   * Destroy the component and clean up resources.
   */
  destroy(): void {
    // Destroy child components first
    this.storyNav?.destroy();
    this.storyNav = null;

    this.yourRolePanel?.destroy();
    this.yourRolePanel = null;

    this.storyContent?.destroy();
    this.storyContent = null;

    // Remove element from DOM
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    this.container = null;
  }
}
