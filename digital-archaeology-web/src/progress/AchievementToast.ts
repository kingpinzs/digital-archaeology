// src/progress/AchievementToast.ts
// Toast notification UI component for achievement announcements
// Story 19.3: Create Milestone Achievements

import type { Achievement } from './types';
import { ACHIEVEMENT_METADATA } from './types';

/** Auto-dismiss delay in milliseconds */
const DISMISS_DELAY_MS = 5000;

/** Gap between consecutive toasts in milliseconds */
const QUEUE_GAP_MS = 600;

/** Exit animation duration in milliseconds */
const EXIT_DURATION_MS = 200;

/** Tier color mapping for toast left border */
const TIER_COLORS: Record<string, string> = {
  common: '#9e9e9e',
  uncommon: '#4caf50',
  rare: '#2196f3',
  epic: '#9c27b0',
  legendary: '#ffd700',
};

/**
 * Toast notification component for announcing achievement milestones.
 * Displays non-blocking notifications with queuing support and tier-colored borders.
 */
export class AchievementToast {
  private container: HTMLElement | null = null;
  private queue: Achievement[] = [];
  private isShowing = false;
  private dismissTimeout: ReturnType<typeof setTimeout> | null = null;
  private exitTimeout: ReturnType<typeof setTimeout> | null = null;
  private queueTimeout: ReturnType<typeof setTimeout> | null = null;

  /** Optional callback when user clicks "View Achievements" in the toast */
  onGalleryOpen: (() => void) | null = null;

  /**
   * Mount the notification container to a parent element.
   * Safe to call multiple times — destroys previous container first.
   */
  mount(parent: HTMLElement): void {
    if (this.container) {
      this.destroy();
    }
    this.container = document.createElement('div');
    this.container.className = 'da-achievement-toast-container';
    this.container.setAttribute('role', 'status');
    this.container.setAttribute('aria-live', 'polite');
    parent.appendChild(this.container);
  }

  /**
   * Show an achievement notification toast.
   * If a toast is already showing, queues the achievement for display after current toast dismisses.
   */
  show(achievement: Achievement): void {
    if (!this.container) return;

    if (this.isShowing) {
      this.queue.push(achievement);
      return;
    }

    this.displayToast(achievement);
  }

  /**
   * Clean up all resources: pending timeouts, DOM elements.
   */
  destroy(): void {
    this.clearAllTimeouts();
    this.queue = [];
    this.isShowing = false;
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }

  private displayToast(achievement: Achievement): void {
    if (!this.container) return;

    this.isShowing = true;
    const metadata = ACHIEVEMENT_METADATA[achievement.type];
    const tierColor = TIER_COLORS[achievement.tier] ?? TIER_COLORS.common;

    const toast = document.createElement('div');
    toast.className = 'da-achievement-toast da-achievement-toast--entering';
    toast.style.borderLeftColor = tierColor;

    const iconEl = document.createElement('span');
    iconEl.className = 'da-achievement-toast__icon';
    iconEl.textContent = metadata.icon;

    const contentEl = document.createElement('div');
    contentEl.className = 'da-achievement-toast__content';

    const titleEl = document.createElement('div');
    titleEl.className = 'da-achievement-toast__title';
    titleEl.textContent = metadata.title;

    const descEl = document.createElement('div');
    descEl.className = 'da-achievement-toast__description';
    descEl.textContent = metadata.description;

    const tierEl = document.createElement('span');
    tierEl.className = 'da-achievement-toast__tier';
    tierEl.textContent = achievement.tier;
    tierEl.style.color = tierColor;

    contentEl.appendChild(titleEl);
    contentEl.appendChild(descEl);
    contentEl.appendChild(tierEl);

    toast.appendChild(iconEl);
    toast.appendChild(contentEl);

    // "View Achievements" link
    if (this.onGalleryOpen) {
      const viewBtn = document.createElement('button');
      viewBtn.className = 'da-achievement-toast__view';
      viewBtn.textContent = 'View';
      viewBtn.type = 'button';
      viewBtn.addEventListener('click', () => {
        if (this.onGalleryOpen) {
          this.onGalleryOpen();
        }
      });
      toast.appendChild(viewBtn);
    }

    this.container.appendChild(toast);

    // Remove entering class after animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.classList.remove('da-achievement-toast--entering');
      });
    });

    // Schedule auto-dismiss
    this.dismissTimeout = setTimeout(() => {
      this.dismissToast(toast);
    }, DISMISS_DELAY_MS);
  }

  private dismissToast(toast: HTMLElement): void {
    toast.classList.add('da-achievement-toast--exiting');

    this.exitTimeout = setTimeout(() => {
      toast.remove();
      this.isShowing = false;

      // Process next queued achievement after a gap
      if (this.queue.length > 0) {
        const next = this.queue.shift()!;
        this.queueTimeout = setTimeout(() => {
          this.displayToast(next);
        }, QUEUE_GAP_MS);
      }
    }, EXIT_DURATION_MS);
  }

  private clearAllTimeouts(): void {
    if (this.dismissTimeout !== null) {
      clearTimeout(this.dismissTimeout);
      this.dismissTimeout = null;
    }
    if (this.exitTimeout !== null) {
      clearTimeout(this.exitTimeout);
      this.exitTimeout = null;
    }
    if (this.queueTimeout !== null) {
      clearTimeout(this.queueTimeout);
      this.queueTimeout = null;
    }
  }
}
