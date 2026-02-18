// src/progress/DiscoveryNotification.ts
// Toast notification UI component for discovery announcements
// Story 19.1: Track First-Time Discoveries

import type { Discovery } from './types';
import { DISCOVERY_METADATA } from './types';

/** Auto-dismiss delay in milliseconds */
const DISMISS_DELAY_MS = 4000;

/** Gap between consecutive toasts in milliseconds */
const QUEUE_GAP_MS = 500;

/** Exit animation duration in milliseconds */
const EXIT_DURATION_MS = 200;

/**
 * Toast notification component for announcing first-time discoveries.
 * Displays non-blocking notifications with queuing support.
 */
export class DiscoveryNotification {
  private container: HTMLElement | null = null;
  private queue: Discovery[] = [];
  private isShowing = false;
  private dismissTimeout: ReturnType<typeof setTimeout> | null = null;
  private exitTimeout: ReturnType<typeof setTimeout> | null = null;
  private queueTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Mount the notification container to a parent element.
   * Safe to call multiple times — destroys previous container first.
   */
  mount(parent: HTMLElement): void {
    if (this.container) {
      this.destroy();
    }
    this.container = document.createElement('div');
    this.container.className = 'da-discovery-toast-container';
    this.container.setAttribute('role', 'status');
    this.container.setAttribute('aria-live', 'polite');
    parent.appendChild(this.container);
  }

  /**
   * Show a discovery notification toast.
   * If a toast is already showing, queues the discovery for display after current toast dismisses.
   */
  show(discovery: Discovery): void {
    if (!this.container) return;

    if (this.isShowing) {
      this.queue.push(discovery);
      return;
    }

    this.displayToast(discovery);
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

  private displayToast(discovery: Discovery): void {
    if (!this.container) return;

    this.isShowing = true;
    const metadata = DISCOVERY_METADATA[discovery.type];

    const toast = document.createElement('div');
    toast.className = 'da-discovery-toast da-discovery-toast--entering';

    const iconEl = document.createElement('span');
    iconEl.className = 'da-discovery-toast__icon';
    iconEl.textContent = metadata.icon;

    const contentEl = document.createElement('div');
    contentEl.className = 'da-discovery-toast__content';

    const titleEl = document.createElement('div');
    titleEl.className = 'da-discovery-toast__title';
    titleEl.textContent = metadata.title;

    const descEl = document.createElement('div');
    descEl.className = 'da-discovery-toast__description';
    descEl.textContent = metadata.description;

    contentEl.appendChild(titleEl);
    contentEl.appendChild(descEl);
    toast.appendChild(iconEl);
    toast.appendChild(contentEl);

    this.container.appendChild(toast);

    // Remove entering class after animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.classList.remove('da-discovery-toast--entering');
      });
    });

    // Schedule auto-dismiss
    this.dismissTimeout = setTimeout(() => {
      this.dismissToast(toast);
    }, DISMISS_DELAY_MS);
  }

  private dismissToast(toast: HTMLElement): void {
    toast.classList.add('da-discovery-toast--exiting');

    this.exitTimeout = setTimeout(() => {
      toast.remove();
      this.isShowing = false;

      // Process next queued discovery after a gap
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
