// src/story/StoryNav.ts
// Fixed navigation bar for Story Mode (48px height, position: fixed)
// Story 10.2: Create Story Mode Layout
// Story 10.3: Add ModeToggle integration and Journal button
// Story 10.16: Integrate EraBadge and ProgressDots with StoryEngine

import { ModeToggle } from '@ui/ModeToggle';
import type { ThemeMode } from '@ui/theme';
import { EraBadge } from './EraBadge';
import { ProgressDots } from './ProgressDots';
import { createProgressDisplayData } from './ProgressDisplay';
import type { StoryProgress } from './StoryState';
import type { StoryStateChangedEvent } from './StoryEngine';

/**
 * Configuration options for the StoryNav component.
 */
export interface StoryNavOptions {
  /** Current active mode */
  currentMode: ThemeMode;
  /** Callback when mode changes */
  onModeChange: (mode: ThemeMode) => void;
  /** Optional initial era to display */
  initialEra?: string;
  /** Optional callback to get era for an act number */
  getEraForAct?: (actNumber: number) => string;
  /** Total number of acts (default 11) */
  totalActs?: number;
  /** Callback when progress dots are clicked (opens story browser) */
  onProgressClick?: () => void;
  /** Callback when journal button is clicked */
  onJournalClick?: () => void;
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
  private eraBadge: EraBadge | null = null;
  private progressDots: ProgressDots | null = null;
  private currentMode: ThemeMode;
  private onModeChange: (mode: ThemeMode) => void;
  private getEraForAct: ((actNumber: number) => string) | undefined;
  private initialEra: string;
  private totalActs: number;
  private stateChangedListener: ((event: Event) => void) | null = null;
  private onProgressClick: (() => void) | undefined;
  private onJournalClick: (() => void) | undefined;

  constructor(options: StoryNavOptions) {
    this.currentMode = options.currentMode;
    this.onModeChange = options.onModeChange;
    this.initialEra = options.initialEra ?? '1971';
    this.getEraForAct = options.getEraForAct;
    this.totalActs = options.totalActs ?? 11; // Default to 11 acts (0-10)
    this.onProgressClick = options.onProgressClick;
    this.onJournalClick = options.onJournalClick;
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
    this.mountEraBadge();
    this.mountProgressDots();
    this.subscribeToStateChanges();
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

    // Center section: progress dots (clickable to open story browser)
    const center = document.createElement('div');
    center.className = 'da-story-nav-center';

    const progress = document.createElement('button');
    progress.type = 'button';
    progress.className = 'da-story-nav-progress';
    progress.setAttribute('aria-label', 'Open story browser');
    progress.addEventListener('click', () => {
      this.onProgressClick?.();
    });

    const progressLabel = document.createElement('span');
    progressLabel.className = 'da-story-nav-progress-label';
    progressLabel.textContent = 'Act:';

    // Create container for ProgressDots component
    const progressDotsContainer = document.createElement('span');
    progressDotsContainer.className = 'da-story-nav-progress-dots-container';

    progress.appendChild(progressLabel);
    progress.appendChild(progressDotsContainer);
    center.appendChild(progress);

    // Right section: era badge, journal button, and save button
    const right = document.createElement('div');
    right.className = 'da-story-nav-right';

    // Create container for EraBadge component
    const eraBadgeContainer = document.createElement('span');
    eraBadgeContainer.className = 'da-story-nav-era-badge-container';

    const journalButton = document.createElement('button');
    journalButton.type = 'button';
    journalButton.className = 'da-story-nav-action';
    journalButton.setAttribute('aria-label', 'Open journal');
    journalButton.textContent = 'Journal';
    journalButton.addEventListener('click', () => {
      this.onJournalClick?.();
    });

    const saveButton = document.createElement('button');
    saveButton.type = 'button';
    saveButton.className = 'da-story-nav-action';
    saveButton.setAttribute('aria-label', 'Save progress');
    saveButton.textContent = 'Save';

    right.appendChild(eraBadgeContainer);
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
   * Mount the EraBadge component.
   */
  private mountEraBadge(): void {
    if (!this.element) return;

    const container = this.element.querySelector('.da-story-nav-era-badge-container');
    if (container) {
      this.eraBadge = new EraBadge();
      this.eraBadge.mount(container as HTMLElement);
      this.eraBadge.setEra(this.initialEra);
    }
  }

  /**
   * Mount the ProgressDots component.
   */
  private mountProgressDots(): void {
    if (!this.element) return;

    const container = this.element.querySelector('.da-story-nav-progress-dots-container');
    if (container) {
      this.progressDots = new ProgressDots();
      this.progressDots.mount(container as HTMLElement);
      // Initialize with act 0 as current (acts are 0-indexed starting at 0)
      this.progressDots.setProgress(createProgressDisplayData(0, this.totalActs));
    }
  }

  /**
   * Subscribe to story-state-changed events.
   */
  private subscribeToStateChanges(): void {
    this.stateChangedListener = (event: Event) => {
      const customEvent = event as StoryStateChangedEvent;
      const { progress } = customEvent.detail;
      this.updateFromProgress(progress);
    };

    window.addEventListener('story-state-changed', this.stateChangedListener);
  }

  /**
   * Unsubscribe from story-state-changed events.
   */
  private unsubscribeFromStateChanges(): void {
    if (this.stateChangedListener) {
      window.removeEventListener('story-state-changed', this.stateChangedListener);
      this.stateChangedListener = null;
    }
  }

  /**
   * Update the era badge and progress dots from story progress.
   * @param progress - Current story progress, or null if cleared
   */
  updateFromProgress(progress: StoryProgress | null): void {
    if (!progress) {
      // Reset to initial state when progress is cleared
      this.eraBadge?.setEra(this.initialEra);
      this.progressDots?.setProgress(createProgressDisplayData(0, this.totalActs));
      return;
    }

    const currentAct = progress.position.actNumber;

    // Update progress dots
    this.progressDots?.setProgress(createProgressDisplayData(currentAct, this.totalActs));

    // Update era badge if we have a lookup function
    if (this.getEraForAct) {
      const era = this.getEraForAct(currentAct);
      this.eraBadge?.setEra(era);
    }
  }

  /**
   * Set the era directly (for external updates).
   * @param year - Era year string
   * @param title - Optional era title
   */
  setEra(year: string, title?: string): void {
    this.eraBadge?.setEra(year, title);
  }

  /**
   * Set the progress directly (for external updates).
   * @param currentActNumber - Current act number (0-10)
   * @param totalActsOverride - Optional override for total acts
   */
  setProgressAct(currentActNumber: number, totalActsOverride?: number): void {
    this.progressDots?.setProgress(createProgressDisplayData(currentActNumber, totalActsOverride ?? this.totalActs));
  }

  /**
   * Update the total acts count (e.g., after story content loads).
   * @param totalActs - The new total number of acts
   */
  setTotalActs(totalActs: number): void {
    this.totalActs = totalActs;
    // Re-render progress dots with new total
    const progress = this.progressDots?.getProgress();
    if (progress) {
      this.progressDots?.setProgress(createProgressDisplayData(progress.currentActNumber, this.totalActs));
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
   * Get the EraBadge component (for testing).
   */
  getEraBadge(): EraBadge | null {
    return this.eraBadge;
  }

  /**
   * Get the ProgressDots component (for testing).
   */
  getProgressDots(): ProgressDots | null {
    return this.progressDots;
  }

  /**
   * Destroy the component and clean up resources.
   */
  destroy(): void {
    // Unsubscribe from events first
    this.unsubscribeFromStateChanges();

    // Destroy ModeToggle
    if (this.modeToggle) {
      this.modeToggle.destroy();
      this.modeToggle = null;
    }

    // Destroy EraBadge
    if (this.eraBadge) {
      this.eraBadge.destroy();
      this.eraBadge = null;
    }

    // Destroy ProgressDots
    if (this.progressDots) {
      this.progressDots.destroy();
      this.progressDots = null;
    }

    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    this.container = null;
  }
}
