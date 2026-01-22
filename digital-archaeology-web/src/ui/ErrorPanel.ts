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
  /** Callback when the Fix button is clicked for an auto-fixable error */
  onFix?: (error: AssemblerError) => void;
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
      const target = e.target as HTMLElement;

      // Check if Fix button was clicked
      const fixBtn = target.closest('.da-error-fix-btn');
      if (fixBtn) {
        e.stopPropagation(); // Prevent item click handler from firing
        this.handleFixButtonClick(fixBtn as HTMLElement);
        return;
      }

      // Otherwise handle item click
      const item = target.closest('.da-error-panel-item');
      if (item) {
        this.handleItemClickFromElement(item as HTMLElement);
      }
    };

    this.boundKeydownHandler = (e: KeyboardEvent) => {
      // Support both Enter and Space for WCAG 2.1 accessibility
      if (e.key === 'Enter' || e.key === ' ') {
        const target = e.target as HTMLElement;

        // Check if Fix button has focus
        const fixBtn = target.closest('.da-error-fix-btn');
        if (fixBtn) {
          e.preventDefault();
          e.stopPropagation();
          this.handleFixButtonClick(fixBtn as HTMLElement);
          return;
        }

        // Otherwise handle item keydown
        const item = target.closest('.da-error-panel-item');
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
   * Handle Fix button click.
   * Finds the corresponding error and calls onFix callback with full error object.
   * @param fixBtn - The Fix button element that was clicked
   */
  private handleFixButtonClick(fixBtn: HTMLElement): void {
    if (!this.options.onFix) return;

    const errorIndex = parseInt(fixBtn.getAttribute('data-error-index') ?? '-1', 10);
    if (errorIndex < 0 || errorIndex >= this.errors.length) return;

    // Use error index for reliable identification (handles multiple errors on same line)
    const error = this.errors[errorIndex];
    if (error) {
      this.options.onFix(error);
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

    // Render error items with index for unique identification
    for (let index = 0; index < this.errors.length; index++) {
      const error = this.errors[index];
      const item = this.createErrorItem(error, index);
      this.listElement.appendChild(item);
    }
  }

  /**
   * Create a single error item element.
   * @param error - The error to render
   * @param index - The index of this error in the errors array (for unique identification)
   */
  private createErrorItem(error: AssemblerError, index: number): HTMLElement {
    const item = document.createElement('div');
    item.className = 'da-error-panel-item';
    item.setAttribute('role', 'listitem');
    item.setAttribute('tabindex', '0');
    item.setAttribute('data-line', String(error.line));
    item.setAttribute('data-error-index', String(index));
    if (error.column !== undefined) {
      item.setAttribute('data-column', String(error.column));
    }

    // Set aria-label for accessibility - announce if fixable
    const ariaLabel = error.fixable
      ? `Error on line ${error.line}: ${error.message} - fixable`
      : `Error on line ${error.line}: ${error.message}`;
    item.setAttribute('aria-label', ariaLabel);

    // Error type badge (if type is provided)
    if (error.type) {
      const badge = this.createTypeBadge(error.type);
      item.appendChild(badge);
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

    // Code snippet (if provided)
    if (error.codeSnippet) {
      const snippet = this.createCodeSnippet(error.codeSnippet);
      item.appendChild(snippet);
    }

    // Suggestion (if provided)
    if (error.suggestion) {
      const suggestion = this.createSuggestion(error.suggestion);
      item.appendChild(suggestion);
    }

    // Fix button (if fixable)
    if (error.fixable === true) {
      const fixBtn = this.createFixButton(error, index);
      item.appendChild(fixBtn);
    }

    // Note: Click and keyboard handlers use event delegation on the list element
    // This avoids per-item listeners and potential memory leaks

    return item;
  }

  /**
   * Create an error type badge element.
   * @param type - The error type
   */
  private createTypeBadge(
    type: 'SYNTAX_ERROR' | 'VALUE_ERROR' | 'CONSTRAINT_ERROR'
  ): HTMLElement {
    const badge = document.createElement('span');
    badge.className = 'da-error-type-badge';

    // Map type to display text and CSS modifier
    const typeMap: Record<
      string,
      { text: string; modifier: string }
    > = {
      SYNTAX_ERROR: { text: 'SYNTAX', modifier: 'syntax' },
      VALUE_ERROR: { text: 'VALUE', modifier: 'value' },
      CONSTRAINT_ERROR: { text: 'CONSTRAINT', modifier: 'constraint' },
    };

    const typeInfo = typeMap[type];
    badge.textContent = typeInfo.text;
    badge.classList.add(`da-error-type-badge--${typeInfo.modifier}`);

    return badge;
  }

  /**
   * Create a code snippet element with context.
   * @param snippet - The code snippet data
   */
  private createCodeSnippet(snippet: {
    line: string;
    lineNumber: number;
    contextBefore?: string[];
    contextAfter?: string[];
  }): HTMLElement {
    const container = document.createElement('pre');
    container.className = 'da-error-snippet';
    container.setAttribute('aria-label', `Code snippet showing error on line ${snippet.lineNumber}`);

    // Context before
    if (snippet.contextBefore) {
      snippet.contextBefore.forEach((line, index) => {
        const lineNum = snippet.lineNumber - snippet.contextBefore!.length + index;
        const lineEl = this.createSnippetLine(lineNum, line, false);
        container.appendChild(lineEl);
      });
    }

    // Error line (highlighted)
    const errorLine = this.createSnippetLine(snippet.lineNumber, snippet.line, true);
    container.appendChild(errorLine);

    // Context after
    if (snippet.contextAfter) {
      snippet.contextAfter.forEach((line, index) => {
        const lineNum = snippet.lineNumber + index + 1;
        const lineEl = this.createSnippetLine(lineNum, line, false);
        container.appendChild(lineEl);
      });
    }

    return container;
  }

  /**
   * Create a single line in the code snippet.
   * @param lineNumber - The line number to display
   * @param content - The line content
   * @param isError - Whether this is the error line (highlighted)
   */
  private createSnippetLine(
    lineNumber: number,
    content: string,
    isError: boolean
  ): HTMLElement {
    const line = document.createElement('div');
    line.className = isError
      ? 'da-error-snippet-line da-error-snippet-line--error'
      : 'da-error-snippet-line';

    const lineNum = document.createElement('span');
    lineNum.className = 'da-error-snippet-linenum';
    lineNum.textContent = String(lineNumber);
    line.appendChild(lineNum);

    const code = document.createElement('code');
    code.className = 'da-error-snippet-code';
    code.textContent = content;
    line.appendChild(code);

    return line;
  }

  /**
   * Create a suggestion element.
   * @param suggestion - The suggestion text
   */
  private createSuggestion(suggestion: string): HTMLElement {
    const el = document.createElement('div');
    el.className = 'da-error-suggestion';

    const prefix = document.createElement('span');
    prefix.textContent = 'Did you mean: ';
    el.appendChild(prefix);

    const suggestionText = document.createElement('code');
    suggestionText.textContent = suggestion;
    el.appendChild(suggestionText);

    return el;
  }

  /**
   * Create a Fix button for auto-fixable errors.
   * @param error - The error with suggestion
   */
  private createFixButton(error: AssemblerError, index: number): HTMLElement {
    const btn = document.createElement('button');
    btn.className = 'da-error-fix-btn';
    btn.textContent = 'Fix';
    btn.type = 'button';
    btn.setAttribute('data-line', String(error.line));
    btn.setAttribute('data-error-index', String(index));
    btn.setAttribute('aria-label', `Fix error on line ${error.line}: replace with ${error.suggestion}`);
    if (error.suggestion) {
      btn.setAttribute('data-suggestion', error.suggestion);
    }
    return btn;
  }
}
