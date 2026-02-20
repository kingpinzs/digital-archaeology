// src/progress/ActCelebration.ts
// Celebration overlay UI component for act completion announcements
// Story 19.2: Track Act Completion

import type { ActCompletion } from './types';

/** Auto-dismiss delay in milliseconds */
const DISMISS_DELAY_MS = 6000;

/** Exit animation duration in milliseconds */
const EXIT_DURATION_MS = 300;

/**
 * Celebration overlay component for announcing act completions.
 * Displays a non-blocking modal overlay that auto-dismisses after 6 seconds
 * or when the user clicks "Continue" or presses Escape.
 */
export class ActCelebration {
  private container: HTMLElement | null = null;
  private overlay: HTMLElement | null = null;
  private dismissTimeout: ReturnType<typeof setTimeout> | null = null;
  private exitTimeout: ReturnType<typeof setTimeout> | null = null;
  private previouslyFocusedElement: Element | null = null;

  // Bound handlers for cleanup
  private boundHandleKeydown: (e: KeyboardEvent) => void;

  constructor() {
    this.boundHandleKeydown = this.handleKeydown.bind(this);
  }

  /**
   * Mount the celebration component to a parent element.
   * Safe to call multiple times — destroys previous instance first.
   */
  mount(parent: HTMLElement): void {
    if (this.container) {
      this.destroy();
    }
    this.container = parent;
  }

  /**
   * Show a celebration overlay for a completed act.
   */
  show(completion: ActCompletion): void {
    if (!this.container) return;

    // Save currently focused element for restoration after dismiss
    this.previouslyFocusedElement = document.activeElement;

    // Clean up any existing overlay
    this.removeOverlay();

    this.overlay = document.createElement('div');
    this.overlay.className = 'da-act-celebration da-act-celebration--entering';
    this.overlay.setAttribute('role', 'dialog');
    this.overlay.setAttribute('aria-modal', 'true');

    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'da-act-celebration__backdrop';

    // Card
    const card = document.createElement('div');
    card.className = 'da-act-celebration__card';

    // Icon
    const iconEl = document.createElement('div');
    iconEl.className = 'da-act-celebration__icon';
    iconEl.textContent = '\u{1F389}'; // Party popper

    // Title (used for aria-labelledby)
    const titleEl = document.createElement('h2');
    titleEl.className = 'da-act-celebration__title';
    titleEl.id = 'da-act-celebration-title';
    titleEl.textContent = `Act Complete: ${completion.actTitle}`;
    this.overlay.setAttribute('aria-labelledby', titleEl.id);

    // Era badge
    const eraEl = document.createElement('span');
    eraEl.className = 'da-act-celebration__era';
    eraEl.textContent = completion.era;

    // Message
    const messageEl = document.createElement('p');
    messageEl.className = 'da-act-celebration__message';
    messageEl.textContent = `You've completed the ${completion.actTitle} era! Your journey through computing history continues.`;

    // Continue button
    const continueBtn = document.createElement('button');
    continueBtn.className = 'da-act-celebration__continue';
    continueBtn.textContent = 'Continue';
    continueBtn.type = 'button';
    continueBtn.addEventListener('click', () => {
      this.dismiss();
    });

    // Assemble card
    card.appendChild(iconEl);
    card.appendChild(titleEl);
    card.appendChild(eraEl);
    card.appendChild(messageEl);
    card.appendChild(continueBtn);

    // Assemble overlay
    this.overlay.appendChild(backdrop);
    this.overlay.appendChild(card);

    this.container.appendChild(this.overlay);

    // Add keyboard listener
    document.addEventListener('keydown', this.boundHandleKeydown);

    // Auto-focus the continue button for keyboard users
    requestAnimationFrame(() => {
      continueBtn.focus();
    });

    // Remove entering class after animation triggers
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (this.overlay) {
          this.overlay.classList.remove('da-act-celebration--entering');
        }
      });
    });

    // Schedule auto-dismiss
    this.dismissTimeout = setTimeout(() => {
      this.dismiss();
    }, DISMISS_DELAY_MS);
  }

  /**
   * Clean up all resources: pending timeouts, DOM elements, event listeners.
   */
  destroy(): void {
    this.clearAllTimeouts();
    this.removeOverlay();
    document.removeEventListener('keydown', this.boundHandleKeydown);
    this.container = null;
  }

  private dismiss(): void {
    if (!this.overlay) return;

    // Guard against double-invocation race (F2 fix)
    if (this.exitTimeout !== null) return;

    // Clear auto-dismiss timer
    if (this.dismissTimeout !== null) {
      clearTimeout(this.dismissTimeout);
      this.dismissTimeout = null;
    }

    this.overlay.classList.add('da-act-celebration--exiting');

    this.exitTimeout = setTimeout(() => {
      this.removeOverlay();
      this.restoreFocus();
    }, EXIT_DURATION_MS);
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
      this.dismiss();
    } else if (e.key === 'Tab' && this.overlay) {
      // Focus trap: keep focus within the modal
      const continueBtn = this.overlay.querySelector('.da-act-celebration__continue') as HTMLElement | null;
      if (continueBtn) {
        e.preventDefault();
        continueBtn.focus();
      }
    }
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
  }
}
