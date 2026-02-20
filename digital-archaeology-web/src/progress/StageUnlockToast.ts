// src/progress/StageUnlockToast.ts
// Toast notification UI for stage unlock announcements
// Story 19.5: Implement Stage Unlock System

import type { LabStage } from '../config/stageConfig';
import { STAGE_METADATA } from '../config/stageConfig';

/** Auto-dismiss delay in milliseconds */
const DISMISS_DELAY_MS = 4000;

/** Gap between consecutive toasts in milliseconds */
const QUEUE_GAP_MS = 500;

/** Exit animation duration in milliseconds */
const EXIT_DURATION_MS = 200;

/**
 * Toast notification component for announcing stage unlocks.
 * Follows DiscoveryNotification pattern: mount/show/destroy, auto-dismiss, queuing.
 */
export class StageUnlockToast {
  private container: HTMLElement | null = null;
  private queue: LabStage[] = [];
  private isShowing = false;
  private dismissTimeout: ReturnType<typeof setTimeout> | null = null;
  private exitTimeout: ReturnType<typeof setTimeout> | null = null;
  private queueTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Mount the toast container to a parent element.
   * Safe to call multiple times — destroys previous container first.
   */
  mount(parent: HTMLElement): void {
    if (this.container) {
      this.destroy();
    }
    this.container = document.createElement('div');
    this.container.className = 'da-stage-unlock-toast-container';
    this.container.setAttribute('role', 'status');
    this.container.setAttribute('aria-live', 'polite');
    parent.appendChild(this.container);
  }

  /**
   * Show an unlock toast for a stage.
   * If a toast is already showing, queues the stage for display after current toast dismisses.
   */
  show(stage: LabStage): void {
    if (!this.container) return;

    if (this.isShowing) {
      this.queue.push(stage);
      return;
    }

    this.displayToast(stage);
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

  private displayToast(stage: LabStage): void {
    if (!this.container) return;

    this.isShowing = true;
    const meta = STAGE_METADATA[stage];

    const toast = document.createElement('div');
    toast.className = 'da-stage-unlock-toast da-stage-unlock-toast--entering';

    const iconEl = document.createElement('span');
    iconEl.className = 'da-stage-unlock-toast__icon';
    iconEl.textContent = meta.icon;

    const contentEl = document.createElement('div');
    contentEl.className = 'da-stage-unlock-toast__content';

    const labelEl = document.createElement('div');
    labelEl.className = 'da-stage-unlock-toast__label';
    labelEl.textContent = meta.label;

    const messageEl = document.createElement('div');
    messageEl.className = 'da-stage-unlock-toast__message';
    messageEl.textContent = 'Stage Unlocked!';

    contentEl.appendChild(labelEl);
    contentEl.appendChild(messageEl);
    toast.appendChild(iconEl);
    toast.appendChild(contentEl);

    this.container.appendChild(toast);

    // Remove entering class after animation (double rAF ensures browser has painted)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.classList.remove('da-stage-unlock-toast--entering');
      });
    });

    // Schedule auto-dismiss
    this.dismissTimeout = setTimeout(() => {
      this.dismissToast(toast);
    }, DISMISS_DELAY_MS);
  }

  private dismissToast(toast: HTMLElement): void {
    toast.classList.add('da-stage-unlock-toast--exiting');

    this.exitTimeout = setTimeout(() => {
      toast.remove();
      this.isShowing = false;

      // Process next queued stage after a gap
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
