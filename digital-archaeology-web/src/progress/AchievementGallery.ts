// src/progress/AchievementGallery.ts
// Achievement gallery modal UI component
// Story 19.3: Create Milestone Achievements

import type { AchievementType } from './types';
import { ACHIEVEMENT_METADATA } from './types';

/** Exit animation duration in milliseconds */
const EXIT_DURATION_MS = 300;

/** Tier color mapping for card glow borders */
const TIER_COLORS: Record<string, string> = {
  common: '#9e9e9e',
  uncommon: '#4caf50',
  rare: '#2196f3',
  epic: '#9c27b0',
  legendary: '#ffd700',
};

/** All achievement types in display order */
const ALL_ACHIEVEMENT_TYPES: readonly AchievementType[] = [
  'first-discovery',
  'discovery-collector',
  'discovery-master',
  'first-act-complete',
  'acts-explorer',
  'halfway-there',
  'story-completionist',
  'micro4-graduate',
  'micro8-graduate',
  'micro16-graduate',
  'code-pioneer',
  'subroutine-architect',
  'interrupt-expert',
  'stack-wizard',
  'multi-stage-explorer',
  'all-stages-master',
];

/**
 * Achievement gallery modal component.
 * Displays a full-screen modal with a grid of all achievements,
 * highlighting earned ones and graying out locked ones.
 */
export class AchievementGallery {
  private container: HTMLElement | null = null;
  private overlay: HTMLElement | null = null;
  private exitTimeout: ReturnType<typeof setTimeout> | null = null;
  private previouslyFocusedElement: Element | null = null;

  // Bound handlers for cleanup
  private boundHandleKeydown: (e: KeyboardEvent) => void;

  constructor() {
    this.boundHandleKeydown = this.handleKeydown.bind(this);
  }

  /**
   * Mount the gallery component to a parent element.
   * Safe to call multiple times — destroys previous instance first.
   */
  mount(parent: HTMLElement): void {
    if (this.container) {
      this.destroy();
    }
    this.container = parent;
  }

  /**
   * Show the gallery modal with current achievement state.
   * @param earnedTypes - Array of earned achievement type IDs
   * @param earnedTimestamps - Optional map of type -> timestamp for display
   */
  show(earnedTypes: AchievementType[], earnedTimestamps?: Map<AchievementType, number>): void {
    if (!this.container) return;

    // Save currently focused element for restoration after close
    this.previouslyFocusedElement = document.activeElement;

    // Clean up any existing overlay
    this.removeOverlay();

    const earnedSet = new Set(earnedTypes);

    this.overlay = document.createElement('div');
    this.overlay.className = 'da-achievement-gallery da-achievement-gallery--entering';
    this.overlay.setAttribute('role', 'dialog');
    this.overlay.setAttribute('aria-modal', 'true');

    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'da-achievement-gallery__backdrop';
    backdrop.addEventListener('click', () => {
      this.hide();
    });

    // Content area
    const content = document.createElement('div');
    content.className = 'da-achievement-gallery__content';

    // Header
    const header = document.createElement('div');
    header.className = 'da-achievement-gallery__header';

    const titleEl = document.createElement('h2');
    titleEl.className = 'da-achievement-gallery__title';
    titleEl.id = 'da-achievement-gallery-title';
    titleEl.textContent = 'Achievements';
    this.overlay.setAttribute('aria-labelledby', titleEl.id);

    const counterEl = document.createElement('span');
    counterEl.className = 'da-achievement-gallery__counter';
    counterEl.textContent = `${earnedTypes.length} / ${ALL_ACHIEVEMENT_TYPES.length} Earned`;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'da-achievement-gallery__close';
    closeBtn.textContent = '\u{2715}';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close achievements gallery');
    closeBtn.addEventListener('click', () => {
      this.hide();
    });

    header.appendChild(titleEl);
    header.appendChild(counterEl);
    header.appendChild(closeBtn);

    // Grid
    const grid = document.createElement('div');
    grid.className = 'da-achievement-gallery__grid';

    for (const type of ALL_ACHIEVEMENT_TYPES) {
      const isEarned = earnedSet.has(type);
      const metadata = ACHIEVEMENT_METADATA[type];
      const card = this.createCard(type, metadata, isEarned, earnedTimestamps?.get(type));
      grid.appendChild(card);
    }

    content.appendChild(header);
    content.appendChild(grid);

    this.overlay.appendChild(backdrop);
    this.overlay.appendChild(content);

    this.container.appendChild(this.overlay);

    // Add keyboard listener
    document.addEventListener('keydown', this.boundHandleKeydown);

    // Focus the close button
    requestAnimationFrame(() => {
      closeBtn.focus();
    });

    // Remove entering class after animation triggers
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (this.overlay) {
          this.overlay.classList.remove('da-achievement-gallery--entering');
        }
      });
    });

    // Scroll to top
    content.scrollTop = 0;
  }

  /**
   * Dismiss the gallery with exit animation.
   */
  hide(): void {
    if (!this.overlay) return;

    // Guard against double-invocation race
    if (this.exitTimeout !== null) return;

    this.overlay.classList.add('da-achievement-gallery--exiting');

    this.exitTimeout = setTimeout(() => {
      this.removeOverlay();
      this.restoreFocus();
    }, EXIT_DURATION_MS);
  }

  /**
   * Clean up all resources: pending timeouts, DOM elements, event listeners.
   */
  destroy(): void {
    if (this.exitTimeout !== null) {
      clearTimeout(this.exitTimeout);
      this.exitTimeout = null;
    }
    this.removeOverlay();
    document.removeEventListener('keydown', this.boundHandleKeydown);
    this.container = null;
  }

  private createCard(
    type: AchievementType,
    metadata: { title: string; description: string; icon: string; tier: string },
    isEarned: boolean,
    earnedTimestamp?: number,
  ): HTMLElement {
    const card = document.createElement('div');
    card.dataset.achievementType = type;
    const tierClass = `da-achievement-card--${metadata.tier}`;

    if (isEarned) {
      card.className = `da-achievement-card ${tierClass}`;
      card.style.borderColor = TIER_COLORS[metadata.tier] ?? TIER_COLORS.common;
    } else {
      card.className = 'da-achievement-card da-achievement-card--locked';
    }

    const iconEl = document.createElement('div');
    iconEl.className = 'da-achievement-card__icon';
    iconEl.textContent = metadata.icon;

    const titleEl = document.createElement('div');
    titleEl.className = 'da-achievement-card__title';
    titleEl.textContent = metadata.title;

    const descEl = document.createElement('div');
    descEl.className = 'da-achievement-card__description';
    descEl.textContent = isEarned ? metadata.description : '???';

    const tierEl = document.createElement('span');
    tierEl.className = 'da-achievement-card__tier';
    tierEl.textContent = metadata.tier;
    tierEl.style.color = TIER_COLORS[metadata.tier] ?? TIER_COLORS.common;

    const statusEl = document.createElement('div');
    statusEl.className = 'da-achievement-card__status';
    if (isEarned && earnedTimestamp) {
      statusEl.textContent = `Earned: ${new Date(earnedTimestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })}`;
    } else if (!isEarned) {
      statusEl.textContent = 'Locked';
    }

    card.appendChild(iconEl);
    card.appendChild(titleEl);
    card.appendChild(descEl);
    card.appendChild(tierEl);
    card.appendChild(statusEl);

    return card;
  }

  private restoreFocus(): void {
    if (
      this.previouslyFocusedElement &&
      this.previouslyFocusedElement instanceof HTMLElement
    ) {
      this.previouslyFocusedElement.focus();
    }
    this.previouslyFocusedElement = null;
  }

  private removeOverlay(): void {
    document.removeEventListener('keydown', this.boundHandleKeydown);
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }

  private handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      this.hide();
    } else if (e.key === 'Tab' && this.overlay) {
      // Focus trap: keep focus within the gallery
      const closeBtn = this.overlay.querySelector('.da-achievement-gallery__close') as HTMLElement | null;
      if (closeBtn) {
        e.preventDefault();
        closeBtn.focus();
      }
    }
  }
}
