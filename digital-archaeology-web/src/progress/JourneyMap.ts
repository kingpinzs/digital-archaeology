// src/progress/JourneyMap.ts
// Journey map modal UI component
// Story 19.4: Create Progress Visualization

import type { JourneyMapData, JourneyNode } from './types';

/** Exit animation duration in milliseconds */
const EXIT_DURATION_MS = 300;

/**
 * Journey map modal component.
 * Displays a full-screen modal with a horizontal timeline of all 11 acts,
 * highlighting completed, current, upcoming, and locked stages.
 */
export class JourneyMap {
  private container: HTMLElement | null = null;
  private overlay: HTMLElement | null = null;
  private exitTimeout: ReturnType<typeof setTimeout> | null = null;
  private previouslyFocusedElement: Element | null = null;
  private onNavigate: ((actNumber: number) => void) | null = null;

  // Bound handlers for cleanup
  private boundHandleKeydown: (e: KeyboardEvent) => void;

  constructor() {
    this.boundHandleKeydown = this.handleKeydown.bind(this);
  }

  /**
   * Mount the journey map component to a parent element.
   * Safe to call multiple times — destroys previous instance first.
   */
  mount(parent: HTMLElement): void {
    if (this.container) {
      this.destroy();
    }
    this.container = parent;
  }

  /**
   * Show the journey map modal with current data.
   * @param data - JourneyMapData with all 11 act nodes
   * @param onNavigate - Callback invoked when user clicks a navigable node
   */
  show(data: JourneyMapData, onNavigate: (actNumber: number) => void): void {
    if (!this.container) return;

    // Save currently focused element for restoration after close
    this.previouslyFocusedElement = document.activeElement;
    this.onNavigate = onNavigate;

    // Clean up any existing overlay
    this.removeOverlay();

    this.overlay = document.createElement('div');
    this.overlay.className = 'da-journey-map da-journey-map--entering';
    this.overlay.setAttribute('role', 'dialog');
    this.overlay.setAttribute('aria-modal', 'true');

    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'da-journey-map__backdrop';
    backdrop.addEventListener('click', () => {
      this.hide();
    });

    // Content area
    const content = document.createElement('div');
    content.className = 'da-journey-map__content';

    // Header
    const header = document.createElement('div');
    header.className = 'da-journey-map__header';

    const titleEl = document.createElement('h2');
    titleEl.className = 'da-journey-map__title';
    titleEl.id = 'da-journey-map-title';
    titleEl.textContent = 'Journey Map';
    this.overlay.setAttribute('aria-labelledby', titleEl.id);

    const counterEl = document.createElement('span');
    counterEl.className = 'da-journey-map__counter';
    counterEl.textContent = `${data.completedCount} / ${data.totalActs} Complete`;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'da-journey-map__close';
    closeBtn.textContent = '\u{2715}';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close journey map');
    closeBtn.addEventListener('click', () => {
      this.hide();
    });

    header.appendChild(titleEl);
    header.appendChild(counterEl);
    header.appendChild(closeBtn);

    // Timeline
    const timeline = document.createElement('div');
    timeline.className = 'da-journey-map__timeline';

    for (let i = 0; i < data.nodes.length; i++) {
      const node = data.nodes[i];

      // Add connector before each node except the first
      if (i > 0) {
        const prevNode = data.nodes[i - 1];
        const connector = this.createConnector(prevNode, node);
        timeline.appendChild(connector);
      }

      const nodeEl = this.createNode(node);
      timeline.appendChild(nodeEl);
    }

    content.appendChild(header);
    content.appendChild(timeline);

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
          this.overlay.classList.remove('da-journey-map--entering');
        }
      });
    });

    // Scroll timeline to show current node (scrollIntoView not available in jsdom)
    requestAnimationFrame(() => {
      const currentNode = timeline.querySelector('.da-journey-map__node--current');
      if (currentNode && typeof (currentNode as HTMLElement).scrollIntoView === 'function') {
        (currentNode as HTMLElement).scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    });
  }

  /**
   * Dismiss the journey map with exit animation.
   */
  hide(): void {
    if (!this.overlay) return;

    // Guard against double-invocation race
    if (this.exitTimeout !== null) return;

    this.overlay.classList.add('da-journey-map--exiting');

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
    this.onNavigate = null;
  }

  private createNode(node: JourneyNode): HTMLElement {
    const el = document.createElement('div');
    el.dataset.actNumber = String(node.actNumber);
    el.className = `da-journey-map__node da-journey-map__node--${node.status}`;

    const isNavigable = node.status === 'completed' || node.status === 'current';

    if (isNavigable) {
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-label', `Navigate to ${node.title} (${node.era})`);
      el.addEventListener('click', () => {
        this.onNavigate?.(node.actNumber);
        this.hide();
      });
      el.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.onNavigate?.(node.actNumber);
          this.hide();
        }
      });
    } else {
      el.setAttribute('aria-disabled', 'true');
    }

    // Icon
    const iconEl = document.createElement('div');
    iconEl.className = 'da-journey-map__node-icon';
    iconEl.textContent = node.icon;

    // Checkmark overlay for completed
    if (node.status === 'completed') {
      const checkEl = document.createElement('span');
      checkEl.className = 'da-journey-map__node-check';
      checkEl.textContent = '\u{2713}';
      iconEl.appendChild(checkEl);
    }

    // Title
    const titleEl = document.createElement('div');
    titleEl.className = 'da-journey-map__node-title';
    titleEl.textContent = node.title;

    // Era
    const eraEl = document.createElement('div');
    eraEl.className = 'da-journey-map__node-era';
    eraEl.textContent = node.era;

    el.appendChild(iconEl);
    el.appendChild(titleEl);
    el.appendChild(eraEl);

    return el;
  }

  private createConnector(prev: JourneyNode, next: JourneyNode): HTMLElement {
    const connector = document.createElement('div');
    connector.className = 'da-journey-map__connector';

    // Connector style based on the relationship between adjacent nodes
    if (prev.status === 'completed' && (next.status === 'completed' || next.status === 'current')) {
      connector.classList.add('da-journey-map__connector--solid');
    } else if (next.status === 'upcoming') {
      connector.classList.add('da-journey-map__connector--dashed');
    } else {
      connector.classList.add('da-journey-map__connector--dotted');
    }

    return connector;
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
    if (this.exitTimeout !== null) {
      clearTimeout(this.exitTimeout);
      this.exitTimeout = null;
    }
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }

  private handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      this.hide();
    } else if (e.key === 'Tab' && this.overlay) {
      // Focus trap: keep focus within the journey map
      const focusableElements = this.overlay.querySelectorAll(
        'button, [role="button"][tabindex="0"]',
      );
      if (focusableElements.length === 0) return;

      const first = focusableElements[0] as HTMLElement;
      const last = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }
}
