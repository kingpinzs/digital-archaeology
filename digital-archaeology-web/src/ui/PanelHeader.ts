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
  /** Optional callback when help button is clicked (Story 20.3) */
  onHelp?: () => void;
}

/**
 * PanelHeader component displays a panel title with a close button.
 * Allows users to identify panels and optionally hide them.
 */
export class PanelHeader {
  private element: HTMLElement | null = null;
  private closeButton: HTMLButtonElement | null = null;
  private helpButton: HTMLButtonElement | null = null;
  private options: PanelHeaderOptions;

  // Bound event handlers for cleanup
  private boundHandleClick: () => void;
  private boundHandleKeydown: (e: KeyboardEvent) => void;
  private boundHandleHelpClick: (() => void) | null = null;
  private boundHandleHelpKeydown: ((e: KeyboardEvent) => void) | null = null;

  constructor(options: PanelHeaderOptions) {
    this.options = options;
    this.boundHandleClick = this.handleClick.bind(this);
    this.boundHandleKeydown = this.handleKeydown.bind(this);
    if (options.onHelp) {
      this.boundHandleHelpClick = this.handleHelpClick.bind(this);
      this.boundHandleHelpKeydown = this.handleHelpKeydown.bind(this);
    }
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
    this.helpButton = null;

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

    // Optional help button (Story 20.3)
    if (this.options.onHelp) {
      const helpBtn = document.createElement('button');
      helpBtn.className = 'da-panel-help-btn';
      helpBtn.type = 'button';
      helpBtn.setAttribute('aria-label', `Help for ${this.options.title} panel`);
      helpBtn.title = 'Help';
      helpBtn.textContent = '?';
      header.appendChild(helpBtn);
    }

    header.appendChild(closeBtn);

    return header;
  }

  /**
   * Cache element references for event handling.
   */
  private cacheElements(): void {
    if (!this.element) return;
    this.closeButton = this.element.querySelector<HTMLButtonElement>('.da-panel-close-btn');
    this.helpButton = this.element.querySelector<HTMLButtonElement>('.da-panel-help-btn');
  }

  /**
   * Attach event listeners to the close button.
   */
  private attachEventListeners(): void {
    if (this.closeButton) {
      this.closeButton.addEventListener('click', this.boundHandleClick);
      this.closeButton.addEventListener('keydown', this.boundHandleKeydown);
    }
    if (this.helpButton && this.boundHandleHelpClick && this.boundHandleHelpKeydown) {
      this.helpButton.addEventListener('click', this.boundHandleHelpClick);
      this.helpButton.addEventListener('keydown', this.boundHandleHelpKeydown);
    }
  }

  /**
   * Remove event listeners from the close button.
   */
  private removeEventListeners(): void {
    if (this.closeButton) {
      this.closeButton.removeEventListener('click', this.boundHandleClick);
      this.closeButton.removeEventListener('keydown', this.boundHandleKeydown);
    }
    if (this.helpButton && this.boundHandleHelpClick && this.boundHandleHelpKeydown) {
      this.helpButton.removeEventListener('click', this.boundHandleHelpClick);
      this.helpButton.removeEventListener('keydown', this.boundHandleHelpKeydown);
    }
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

  private handleHelpClick(): void {
    this.options.onHelp?.();
  }

  private handleHelpKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.options.onHelp?.();
    }
  }
}
