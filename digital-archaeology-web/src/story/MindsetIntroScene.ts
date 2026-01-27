// src/story/MindsetIntroScene.ts
// Scene that establishes the historical mindset when entering a new era
// Story 10.21: Historical Mindset Time-Travel
//
// XSS Protection: This component uses innerHTML ONLY with content that has been
// sanitized through escapeHtml() which converts special characters to HTML entities
// using the browser's built-in textContent encoding. All user-provided content
// (mindset.historicalPerspective) passes through escapeHtml() before DOM insertion.

import { MindsetProvider } from './MindsetProvider';
import { EraContextPanel } from './EraContextPanel';
import type { MindsetContext } from './types';

/**
 * Options for the MindsetIntroScene.
 */
export interface MindsetIntroSceneOptions {
  /** Skip the intro animation */
  skipAnimation?: boolean;
  /** Auto-dismiss after this many milliseconds (0 = manual) */
  autoDismissMs?: number;
}

/**
 * Scene that introduces the user to a new historical era.
 * Establishes the "you are THERE" mindset before gameplay begins.
 */
export class MindsetIntroScene {
  private element: HTMLElement | null = null;
  private contextPanel: EraContextPanel | null = null;
  private provider: MindsetProvider;
  private mindset: MindsetContext | null = null;
  private options: MindsetIntroSceneOptions;
  private autoDismissTimer: ReturnType<typeof setTimeout> | null = null;
  private onDismiss: (() => void) | null = null;

  // Bound event handlers
  private boundHandleDismiss: (e: Event) => void;
  private boundHandleKeydown: (e: KeyboardEvent) => void;

  constructor(options: MindsetIntroSceneOptions = {}) {
    this.provider = MindsetProvider.getInstance();
    this.options = {
      skipAnimation: false,
      autoDismissMs: 0,
      ...options,
    };
    this.boundHandleDismiss = this.handleDismiss.bind(this);
    this.boundHandleKeydown = this.handleKeydown.bind(this);
  }

  /**
   * Mount the scene to the DOM.
   */
  mount(container: HTMLElement): void {
    this.element = document.createElement('div');
    this.element.className = 'da-mindset-intro';
    this.element.setAttribute('role', 'dialog');
    this.element.setAttribute('aria-modal', 'true');
    this.element.setAttribute('aria-labelledby', 'mindset-intro-title');
    container.appendChild(this.element);

    // Add keyboard listener for Escape key
    document.addEventListener('keydown', this.boundHandleKeydown);

    this.render();
  }

  /**
   * Set the mindset context and render the intro.
   */
  setMindset(mindset: MindsetContext): void {
    this.mindset = mindset;

    // Also set it in the provider
    this.provider.setMindset(mindset);

    this.render();

    // Start auto-dismiss timer if configured
    if (this.options.autoDismissMs && this.options.autoDismissMs > 0) {
      this.autoDismissTimer = setTimeout(() => {
        this.dismiss();
      }, this.options.autoDismissMs);
    }

    // Dispatch event
    this.dispatchEvent('mindset-intro-shown', { mindset });
  }

  /**
   * Set callback for when the intro is dismissed.
   */
  onDismissed(callback: () => void): void {
    this.onDismiss = callback;
  }

  /**
   * Get the current mindset.
   */
  getMindset(): MindsetContext | null {
    return this.mindset;
  }

  /**
   * Dismiss the intro scene.
   */
  dismiss(): void {
    if (this.autoDismissTimer) {
      clearTimeout(this.autoDismissTimer);
      this.autoDismissTimer = null;
    }

    if (this.element) {
      this.element.classList.add('da-mindset-intro--dismissing');

      // Allow animation to complete before removing
      setTimeout(() => {
        if (this.onDismiss) {
          this.onDismiss();
        }
        this.dispatchEvent('mindset-intro-dismissed', { mindset: this.mindset });
      }, this.options.skipAnimation ? 0 : 300);
    }
  }

  /**
   * Render the intro scene.
   * All dynamic content from mindset is escaped via escapeHtml().
   */
  private render(): void {
    if (!this.element) return;

    if (!this.mindset) {
      this.element.textContent = '';
      return;
    }

    const yearDisplay = this.formatYear(this.mindset.year);
    const perspective = this.escapeHtml(this.mindset.historicalPerspective.currentKnowledge);
    const futureBlind = this.escapeHtml(this.mindset.historicalPerspective.futureBlind);

    // Render the intro with animation classes
    const animClass = this.options.skipAnimation ? '' : 'da-mindset-intro--animated';

    // Safe: all dynamic content is escaped via escapeHtml()
    this.element.innerHTML = `
      <div class="da-mindset-intro-backdrop"></div>
      <div class="da-mindset-intro-content ${animClass}">
        <div class="da-mindset-intro-header">
          <h2 class="da-mindset-intro-title" id="mindset-intro-title">
            Entering Year ${yearDisplay}
          </h2>
          <p class="da-mindset-intro-subtitle">${perspective}</p>
        </div>

        <div class="da-mindset-intro-body">
          <div class="da-mindset-intro-context" id="mindset-context-container"></div>
        </div>

        <div class="da-mindset-intro-footer">
          <p class="da-mindset-intro-reminder">${futureBlind}</p>
          <button class="da-mindset-intro-continue" type="button">
            I Understand - Enter ${yearDisplay}
          </button>
        </div>
      </div>
    `;

    // Mount the EraContextPanel inside the context container
    const contextContainer = this.element.querySelector('#mindset-context-container');
    if (contextContainer) {
      this.contextPanel = new EraContextPanel();
      this.contextPanel.mount(contextContainer as HTMLElement);
      this.contextPanel.setMindset(this.mindset);
    }

    // Attach event listeners
    const continueButton = this.element.querySelector('.da-mindset-intro-continue');
    if (continueButton) {
      continueButton.addEventListener('click', this.boundHandleDismiss);
    }

    const backdrop = this.element.querySelector('.da-mindset-intro-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', this.boundHandleDismiss);
    }
  }

  /**
   * Format year for display.
   */
  private formatYear(year: number): string {
    if (year < 0) {
      return `${Math.abs(year)} BC`;
    }
    if (year < 1000) {
      return `~${year} AD`;
    }
    return year.toString();
  }

  /**
   * Handle dismiss button click.
   */
  private handleDismiss(e: Event): void {
    e.preventDefault();
    this.dismiss();
  }

  /**
   * Handle keyboard events.
   */
  private handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      this.dismiss();
    }
    if (e.key === 'Enter') {
      this.dismiss();
    }
  }

  /**
   * Dispatch a custom event.
   */
  private dispatchEvent(eventName: string, detail: unknown): void {
    if (!this.element) return;
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: true,
    });
    this.element.dispatchEvent(event);
  }

  /**
   * Escape HTML to prevent XSS.
   * Uses browser's built-in textContent encoding.
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Clean up the component.
   */
  destroy(): void {
    if (this.autoDismissTimer) {
      clearTimeout(this.autoDismissTimer);
    }

    document.removeEventListener('keydown', this.boundHandleKeydown);

    if (this.contextPanel) {
      this.contextPanel.destroy();
      this.contextPanel = null;
    }

    if (this.element) {
      const continueButton = this.element.querySelector('.da-mindset-intro-continue');
      if (continueButton) {
        continueButton.removeEventListener('click', this.boundHandleDismiss);
      }

      const backdrop = this.element.querySelector('.da-mindset-intro-backdrop');
      if (backdrop) {
        backdrop.removeEventListener('click', this.boundHandleDismiss);
      }

      this.element.remove();
    }

    this.element = null;
    this.mindset = null;
    this.onDismiss = null;
  }
}
