// src/ui/ErrorPanel.ts
// Error panel component for displaying assembly errors with line numbers

import type { AssemblerError } from '@emulator/index';

/**
 * Error click handler callback type.
 * Called when user clicks an error to jump to that location.
 */
export interface ErrorClickInfo {
  line: number;
  column?: number;
}

/**
 * Configuration options for the ErrorPanel component.
 */
export interface ErrorPanelOptions {
  /** Callback when an error item is clicked */
  onErrorClick?: (error: ErrorClickInfo) => void;
}

/**
 * ErrorPanel component displays assembly errors with clickable items.
 * Shows line number, column (if available), and error message.
 * Clicking an error triggers the onErrorClick callback.
 */
export class ErrorPanel {
  private element: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private listElement: HTMLElement | null = null;
  private countElement: HTMLElement | null = null;
  private options: ErrorPanelOptions;
  private errors: AssemblerError[] = [];
  // Bound handlers for event delegation (enables proper cleanup)
  private boundClickHandler: ((e: Event) => void) | null = null;
  private boundKeydownHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(options?: ErrorPanelOptions) {
    this.options = options ?? {};
  }

  /**
   * Mount the error panel to a container element.
   * @param container - The HTML element to mount to
   */
  mount(container: HTMLElement): void {
    this.container = container;
    this.element = this.render();
    this.container.appendChild(this.element);
    this.cacheElements();
  }

  /**
   * Set the errors to display.
   * @param errors - Array of assembler errors
   */
  setErrors(errors: AssemblerError[]): void {
    this.errors = errors;
    this.updateUI();
  }

  /**
   * Clear all errors and hide the panel.
   */
  clearErrors(): void {
    this.errors = [];
    this.updateUI();
  }

  /**
   * Destroy the component and clean up resources.
   */
  destroy(): void {
    // Remove event listeners before removing DOM elements
    this.removeEventDelegation();

    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    this.listElement = null;
    this.countElement = null;
    this.container = null;
    this.errors = [];
  }

  /**
   * Render the error panel HTML structure.
   */
  private render(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'da-error-panel da-error-panel--hidden';
    panel.setAttribute('aria-label', 'Assembly Errors');
    panel.setAttribute('aria-live', 'polite');

    // Header
    const header = document.createElement('div');
    header.className = 'da-error-panel-header';

    const title = document.createElement('span');
    title.className = 'da-error-panel-title';
    title.textContent = 'Assembly Errors';
    header.appendChild(title);

    const count = document.createElement('span');
    count.className = 'da-error-panel-count';
    count.textContent = '0 errors';
    header.appendChild(count);

    panel.appendChild(header);

    // Error list
    const list = document.createElement('div');
    list.className = 'da-error-panel-list';
    list.setAttribute('role', 'list');
    panel.appendChild(list);

    return panel;
  }

  /**
   * Cache element references and set up event delegation.
   */
  private cacheElements(): void {
    if (!this.element) return;
    this.listElement = this.element.querySelector('.da-error-panel-list');
    this.countElement = this.element.querySelector('.da-error-panel-count');

    // Set up event delegation on the list element for better memory management
    this.setupEventDelegation();
  }

  /**
   * Set up event delegation on the list element.
   * Uses delegation pattern to avoid per-item listeners and memory leaks.
   */
  private setupEventDelegation(): void {
    if (!this.listElement) return;

    // Create bound handlers that can be removed later
    this.boundClickHandler = (e: Event) => {
      const item = (e.target as HTMLElement).closest('.da-error-panel-item');
      if (item) {
        this.handleItemClickFromElement(item as HTMLElement);
      }
    };

    this.boundKeydownHandler = (e: KeyboardEvent) => {
      // Support both Enter and Space for WCAG 2.1 accessibility
      if (e.key === 'Enter' || e.key === ' ') {
        const item = (e.target as HTMLElement).closest('.da-error-panel-item');
        if (item) {
          e.preventDefault(); // Prevent Space from scrolling
          this.handleItemClickFromElement(item as HTMLElement);
        }
      }
    };

    this.listElement.addEventListener('click', this.boundClickHandler);
    this.listElement.addEventListener('keydown', this.boundKeydownHandler);
  }

  /**
   * Remove event delegation listeners.
   */
  private removeEventDelegation(): void {
    if (this.listElement) {
      if (this.boundClickHandler) {
        this.listElement.removeEventListener('click', this.boundClickHandler);
      }
      if (this.boundKeydownHandler) {
        this.listElement.removeEventListener('keydown', this.boundKeydownHandler);
      }
    }
    this.boundClickHandler = null;
    this.boundKeydownHandler = null;
  }

  /**
   * Handle click from a delegated event on an error item element.
   * @param item - The error item element that was clicked
   */
  private handleItemClickFromElement(item: HTMLElement): void {
    const line = parseInt(item.getAttribute('data-line') ?? '0', 10);
    const columnAttr = item.getAttribute('data-column');
    const column = columnAttr ? parseInt(columnAttr, 10) : undefined;

    if (line > 0 && this.options.onErrorClick) {
      const info: ErrorClickInfo = { line };
      if (column !== undefined) {
        info.column = column;
      }
      this.options.onErrorClick(info);
    }
  }

  /**
   * Update the UI based on current errors.
   */
  private updateUI(): void {
    if (!this.element || !this.listElement || !this.countElement) return;

    // Update visibility
    if (this.errors.length === 0) {
      this.element.classList.add('da-error-panel--hidden');
    } else {
      this.element.classList.remove('da-error-panel--hidden');
    }

    // Update count using textContent (safe)
    const errorWord = this.errors.length === 1 ? 'error' : 'errors';
    this.countElement.textContent = `${this.errors.length} ${errorWord}`;

    // Clear existing items by removing children
    while (this.listElement.firstChild) {
      this.listElement.removeChild(this.listElement.firstChild);
    }

    // Render error items
    for (const error of this.errors) {
      const item = this.createErrorItem(error);
      this.listElement.appendChild(item);
    }
  }

  /**
   * Create a single error item element.
   * @param error - The error to render
   */
  private createErrorItem(error: AssemblerError): HTMLElement {
    const item = document.createElement('div');
    item.className = 'da-error-panel-item';
    item.setAttribute('role', 'listitem');
    item.setAttribute('tabindex', '0');
    item.setAttribute('data-line', String(error.line));
    if (error.column !== undefined) {
      item.setAttribute('data-column', String(error.column));
    }

    // Location text
    const location = document.createElement('span');
    location.className = 'da-error-panel-location';
    if (error.column !== undefined) {
      location.textContent = `Line ${error.line}, Col ${error.column}`;
    } else {
      location.textContent = `Line ${error.line}`;
    }
    item.appendChild(location);

    // Message text - using textContent which auto-escapes to prevent XSS
    const message = document.createElement('span');
    message.className = 'da-error-panel-message';
    message.textContent = error.message;
    item.appendChild(message);

    // Note: Click and keyboard handlers use event delegation on the list element
    // This avoids per-item listeners and potential memory leaks

    return item;
  }
}
