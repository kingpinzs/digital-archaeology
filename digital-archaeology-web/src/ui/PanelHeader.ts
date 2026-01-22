// src/ui/PanelHeader.ts
// Panel header component with title and close button

/**
 * Panel identifier type.
 */
export type PanelId = 'code' | 'circuit' | 'state';

/**
 * Configuration options for PanelHeader component.
 */
export interface PanelHeaderOptions {
  /** Panel title to display (e.g., "CODE", "CIRCUIT", "STATE") */
  title: string;
  /** Panel identifier */
  panelId: PanelId;
  /** Callback when close button is clicked */
  onClose: () => void;
}

/**
 * PanelHeader component displays a panel title with a close button.
 * Allows users to identify panels and optionally hide them.
 */
export class PanelHeader {
  private element: HTMLElement | null = null;
  private closeButton: HTMLButtonElement | null = null;
  private options: PanelHeaderOptions;

  // Bound event handlers for cleanup
  private boundHandleClick: () => void;
  private boundHandleKeydown: (e: KeyboardEvent) => void;

  constructor(options: PanelHeaderOptions) {
    this.options = options;
    this.boundHandleClick = this.handleClick.bind(this);
    this.boundHandleKeydown = this.handleKeydown.bind(this);
  }

  /**
   * Mount the panel header to a container element.
   * @param container - The element to mount the header into
   */
  mount(container: HTMLElement): void {
    this.element = this.render();
    container.appendChild(this.element);
    this.cacheElements();
    this.attachEventListeners();
  }

  /**
   * Get the panel header element.
   * @returns The header element or null if not mounted
   */
  getElement(): HTMLElement | null {
    return this.element;
  }

  /**
   * Destroy the panel header and clean up resources.
   */
  destroy(): void {
    this.removeEventListeners();

    // Clear cached references
    this.closeButton = null;

    // Remove element from DOM
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }

  /**
   * Render the panel header HTML structure.
   * Uses DOM methods instead of innerHTML for XSS prevention.
   * @returns The header element
   */
  private render(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'da-panel-header';

    // Create title span using textContent (safe from XSS)
    const title = document.createElement('span');
    title.className = 'da-panel-title';
    title.textContent = this.options.title;

    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'da-panel-close-btn';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', `Close ${this.options.title} panel`);
    closeBtn.title = 'Close panel';
    closeBtn.textContent = '×';

    header.appendChild(title);
    header.appendChild(closeBtn);

    return header;
  }

  /**
   * Cache element references for event handling.
   */
  private cacheElements(): void {
    if (!this.element) return;
    this.closeButton = this.element.querySelector<HTMLButtonElement>('.da-panel-close-btn');
  }

  /**
   * Attach event listeners to the close button.
   */
  private attachEventListeners(): void {
    if (!this.closeButton) return;

    this.closeButton.addEventListener('click', this.boundHandleClick);
    this.closeButton.addEventListener('keydown', this.boundHandleKeydown);
  }

  /**
   * Remove event listeners from the close button.
   */
  private removeEventListeners(): void {
    if (!this.closeButton) return;

    this.closeButton.removeEventListener('click', this.boundHandleClick);
    this.closeButton.removeEventListener('keydown', this.boundHandleKeydown);
  }

  /**
   * Handle close button click.
   */
  private handleClick(): void {
    this.options.onClose();
  }

  /**
   * Handle keydown on close button for accessibility.
   * @param e - Keyboard event
   */
  private handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.options.onClose();
    }
  }
}
