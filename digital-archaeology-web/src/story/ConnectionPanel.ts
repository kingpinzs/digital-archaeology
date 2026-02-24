// src/story/ConnectionPanel.ts
// "IT WORKS!" Connection Panel — shows how discoveries connect to the web of computing knowledge
// Story 26.14: IT WORKS Connection System

import type { ItWorksData, ConnectionLink, ConnectionLinkType } from './content-types';

/** Auto-dismiss delay in milliseconds */
const DISMISS_DELAY_MS = 12000;

/** Exit animation duration in milliseconds */
const EXIT_DURATION_MS = 300;

/** Icon mapping for connection link types */
const LINK_TYPE_ICONS: Record<ConnectionLinkType, string> = {
  idea: '\u{1F4A1}',      // 💡 Light bulb
  thinker: '\u{1F9D1}',   // 🧑 Person
  future: '\u{1F680}',    // 🚀 Rocket
  'next-step': '\u{27A1}', // ➡️ Arrow
};

/** Label mapping for connection link types */
const LINK_TYPE_LABELS: Record<ConnectionLinkType, string> = {
  idea: 'Related Idea',
  thinker: 'Historical Connection',
  future: 'Future Path',
  'next-step': 'Your Next Step',
};

/** Callbacks for the ConnectionPanel */
export interface ConnectionPanelCallbacks {
  /** Called when the user clicks a connection link with a target act */
  onNavigateToAct?: (actNumber: number) => void;
  /** Called when the panel is dismissed */
  onDismiss?: () => void;
}

/**
 * "IT WORKS!" Connection Panel component.
 * Displays a celebration overlay after successful challenge completion,
 * showing how the discovery connects to other ideas, historical figures,
 * future technologies, and the player's next steps.
 *
 * Follows the same lifecycle pattern as ActCelebration:
 * mount() → show() → dismiss/destroy()
 */
export class ConnectionPanel {
  private container: HTMLElement | null = null;
  private overlay: HTMLElement | null = null;
  private dismissTimeout: ReturnType<typeof setTimeout> | null = null;
  private exitTimeout: ReturnType<typeof setTimeout> | null = null;
  private previouslyFocusedElement: Element | null = null;
  private callbacks: ConnectionPanelCallbacks = {};

  // Bound handlers for cleanup
  private boundHandleKeydown: (e: KeyboardEvent) => void;

  constructor() {
    this.boundHandleKeydown = this.handleKeydown.bind(this);
  }

  /**
   * Set callbacks for navigation and dismiss events.
   */
  setCallbacks(callbacks: ConnectionPanelCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Mount the panel to a parent element.
   */
  mount(parent: HTMLElement): void {
    if (this.container) {
      this.destroy();
    }
    this.container = parent;
  }

  /**
   * Show the "IT WORKS!" connection panel.
   */
  show(data: ItWorksData): void {
    if (!this.container) return;

    this.previouslyFocusedElement = document.activeElement;
    // Code Review Fix H3: Clear pending timeouts before re-show to prevent stale dismiss/exit
    this.clearAllTimeouts();
    this.removeOverlay();

    this.overlay = document.createElement('div');
    this.overlay.className = 'da-connection-panel da-connection-panel--entering';
    this.overlay.setAttribute('role', 'dialog');
    this.overlay.setAttribute('aria-modal', 'true');

    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'da-connection-panel__backdrop';

    // Card
    const card = document.createElement('div');
    card.className = 'da-connection-panel__card';

    // Headline
    const headlineEl = document.createElement('h2');
    headlineEl.className = 'da-connection-panel__headline';
    headlineEl.id = 'da-connection-panel-title';
    headlineEl.textContent = data.headline;
    this.overlay.setAttribute('aria-labelledby', headlineEl.id);

    card.appendChild(headlineEl);

    // Connection links
    const linksContainer = document.createElement('div');
    linksContainer.className = 'da-connection-panel__links';

    for (const link of data.connections) {
      const linkEl = this.createLinkElement(link);
      linksContainer.appendChild(linkEl);
    }
    card.appendChild(linksContainer);

    // Continue button
    const continueBtn = document.createElement('button');
    continueBtn.className = 'da-connection-panel__continue';
    continueBtn.textContent = 'Continue';
    continueBtn.type = 'button';
    continueBtn.addEventListener('click', () => {
      this.dismiss();
    });
    card.appendChild(continueBtn);

    // Assemble overlay
    this.overlay.appendChild(backdrop);
    this.overlay.appendChild(card);
    this.container.appendChild(this.overlay);

    // Keyboard listener
    document.addEventListener('keydown', this.boundHandleKeydown);

    // Auto-focus continue button
    requestAnimationFrame(() => {
      continueBtn.focus();
    });

    // Remove entering class after animation triggers
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (this.overlay) {
          this.overlay.classList.remove('da-connection-panel--entering');
        }
      });
    });

    // Schedule auto-dismiss
    this.dismissTimeout = setTimeout(() => {
      this.dismiss();
    }, DISMISS_DELAY_MS);
  }

  /**
   * Whether the panel is currently visible.
   */
  isVisible(): boolean {
    return this.overlay !== null;
  }

  /**
   * Clean up all resources.
   */
  destroy(): void {
    this.clearAllTimeouts();
    this.removeOverlay();
    document.removeEventListener('keydown', this.boundHandleKeydown);
    this.container = null;
  }

  private createLinkElement(link: ConnectionLink): HTMLElement {
    const el = document.createElement('div');
    el.className = `da-connection-panel__link da-connection-panel__link--${link.type}`;

    const icon = document.createElement('span');
    icon.className = 'da-connection-panel__link-icon';
    icon.textContent = LINK_TYPE_ICONS[link.type];
    icon.setAttribute('aria-hidden', 'true');

    const content = document.createElement('div');
    content.className = 'da-connection-panel__link-content';

    const label = document.createElement('span');
    label.className = 'da-connection-panel__link-label';
    label.textContent = LINK_TYPE_LABELS[link.type];

    const text = document.createElement('span');
    text.className = 'da-connection-panel__link-text';
    text.textContent = link.text;

    content.appendChild(label);
    content.appendChild(text);

    el.appendChild(icon);
    el.appendChild(content);

    // If there's a target act, make it a navigable button
    if (link.targetActNumber !== undefined) {
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.classList.add('da-connection-panel__link--navigable');
      const handleNav = () => {
        this.callbacks.onNavigateToAct?.(link.targetActNumber!);
        this.dismiss();
      };
      el.addEventListener('click', handleNav);
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleNav();
        }
      });
    }

    return el;
  }

  private dismiss(): void {
    if (!this.overlay) return;
    if (this.exitTimeout !== null) return;

    if (this.dismissTimeout !== null) {
      clearTimeout(this.dismissTimeout);
      this.dismissTimeout = null;
    }

    this.overlay.classList.add('da-connection-panel--exiting');

    this.exitTimeout = setTimeout(() => {
      this.exitTimeout = null;
      this.removeOverlay();
      this.restoreFocus();
      this.callbacks.onDismiss?.();
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
      // Focus trap within modal
      // Code Review Fix M2: Exclude disabled/hidden elements from focus trap
      const focusable = this.overlay.querySelectorAll<HTMLElement>(
        'button:not([disabled]):not([aria-hidden="true"]), [tabindex="0"]:not([disabled]):not([aria-hidden="true"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
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
