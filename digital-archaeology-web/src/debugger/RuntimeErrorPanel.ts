/**
 * RuntimeErrorPanel Component (Story 5.10)
 *
 * Displays rich runtime error information in the State Panel.
 * Shows error type, instruction context, component name, and signal values.
 * Provides action buttons: View in Circuit, View in Code, Reset.
 *
 * Follows the same pattern as RegisterView, FlagsView, MemoryView, and BreakpointsView.
 */

import type { RuntimeErrorContext } from '@emulator/index';

/**
 * Configuration options for the RuntimeErrorPanel component.
 */
export interface RuntimeErrorPanelOptions {
  /** Callback when "View in Circuit" button is clicked (Epic 6 placeholder) */
  onViewInCircuit?: () => void;
  /** Callback when "View in Code" button is clicked */
  onViewInCode?: () => void;
  /** Callback when "Reset" button is clicked */
  onReset?: () => void;
}

/**
 * State for the RuntimeErrorPanel component.
 */
export interface RuntimeErrorPanelState {
  /** Current error context, or null if no error */
  error: RuntimeErrorContext | null;
  /** Original error message */
  message?: string;
}

/**
 * RuntimeErrorPanel - displays rich runtime error information in the State Panel.
 *
 * @example
 * ```typescript
 * const panel = new RuntimeErrorPanel({
 *   onViewInCode: () => editor.highlightLine(panel.state.error?.pc),
 *   onReset: () => emulator.reset()
 * });
 * panel.mount(container);
 * panel.setError({
 *   errorType: 'MEMORY_ERROR',
 *   pc: 0x05,
 *   instruction: 'STO',
 *   opcode: 0x6,
 *   componentName: 'Memory Controller'
 * }, 'Invalid memory address');
 * ```
 */
export class RuntimeErrorPanel {
  private container: HTMLElement | null = null;
  private element: HTMLElement | null = null;
  private options: RuntimeErrorPanelOptions;
  private _state: RuntimeErrorPanelState = { error: null };
  private boundButtonHandler: (e: Event) => void;
  private boundKeydownHandler: (e: KeyboardEvent) => void;

  /**
   * Get the current error context (Story 5.10 - Code Review Fix #3).
   * Provides clean access to error state without DOM parsing.
   */
  get currentError(): RuntimeErrorContext | null {
    return this._state.error;
  }

  /**
   * Get the current error message (Story 5.10 - Code Review Fix #3).
   */
  get currentMessage(): string | undefined {
    return this._state.message;
  }

  constructor(options: RuntimeErrorPanelOptions = {}) {
    this.options = options;
    this.boundButtonHandler = (e: Event) => this.handleButtonClick(e);
    this.boundKeydownHandler = (e: KeyboardEvent) => this.handleKeydown(e);
  }

  /**
   * Mount the component to a container element.
   * Creates the DOM structure and renders initial state.
   * @param container - The HTML element to mount to
   */
  mount(container: HTMLElement): void {
    this.container = container;
    this.render();
  }

  /**
   * Set the error to display.
   * @param error - Runtime error context, or null to clear
   * @param message - Original error message
   */
  setError(error: RuntimeErrorContext | null, message?: string): void {
    this._state = { error, message };
    this.render();
  }

  /**
   * Clear the current error and hide the panel.
   */
  clearError(): void {
    this._state = { error: null };
    this.render();
  }

  /**
   * Destroy the component and clean up resources.
   */
  destroy(): void {
    if (this.element) {
      this.element.removeEventListener('click', this.boundButtonHandler);
      this.element.removeEventListener('keydown', this.boundKeydownHandler);
      this.element.remove();
    }
    this.element = null;
    this.container = null;
    this._state = { error: null };
  }

  /**
   * Render the component DOM structure.
   * Uses safe DOM methods (createElement, textContent) for XSS prevention.
   */
  private render(): void {
    if (!this.container) return;

    // Remove existing element if present
    if (this.element) {
      this.element.removeEventListener('click', this.boundButtonHandler);
      this.element.removeEventListener('keydown', this.boundKeydownHandler);
      this.element.remove();
    }

    // Don't render if no error
    if (!this._state.error) {
      this.element = null;
      return;
    }

    // Create main container
    this.element = document.createElement('div');
    this.element.className = 'da-runtime-error-panel';
    this.element.setAttribute('role', 'alert');
    this.element.setAttribute('aria-live', 'assertive');
    this.element.setAttribute(
      'aria-label',
      `Runtime error: ${this._state.error.errorType}`
    );

    // Error type badge
    const badge = this.createTypeBadge(this._state.error.errorType);
    this.element.appendChild(badge);

    // Error message (if provided)
    if (this._state.message) {
      const messageEl = document.createElement('div');
      messageEl.className = 'da-runtime-error-panel__message';
      messageEl.textContent = this._state.message;
      this.element.appendChild(messageEl);
    }

    // Instruction context section
    const contextSection = this.createContextSection(this._state.error);
    this.element.appendChild(contextSection);

    // Component section (if component name provided)
    if (this._state.error.componentName) {
      const componentSection = this.createComponentSection(
        this._state.error.componentName
      );
      this.element.appendChild(componentSection);
    }

    // Signal values section (placeholder for Epic 6)
    if (this._state.error.signalValues && this._state.error.signalValues.length > 0) {
      const signalsSection = this.createSignalsSection(
        this._state.error.signalValues
      );
      this.element.appendChild(signalsSection);
    } else {
      // Show placeholder message
      const placeholder = document.createElement('div');
      placeholder.className = 'da-runtime-error-panel__signals-placeholder';
      placeholder.textContent =
        'Signal values: (available when circuit visualization is enabled)';
      this.element.appendChild(placeholder);
    }

    // Action buttons row
    const actionsRow = this.createActionsRow();
    this.element.appendChild(actionsRow);

    // Set up event listeners
    this.element.addEventListener('click', this.boundButtonHandler);
    this.element.addEventListener('keydown', this.boundKeydownHandler);

    // Append to container
    this.container.appendChild(this.element);
  }

  /**
   * Create an error type badge element with color coding.
   * @param errorType - The runtime error type
   */
  private createTypeBadge(errorType: string): HTMLElement {
    const badge = document.createElement('span');
    badge.className = 'da-runtime-error-panel__type-badge';

    // Map error type to display text and modifier
    const typeMap: Record<string, { text: string; modifier: string }> = {
      MEMORY_ERROR: { text: 'MEMORY_ERROR', modifier: 'error' },
      ARITHMETIC_WARNING: { text: 'ARITHMETIC_WARNING', modifier: 'warning' },
      INVALID_OPCODE: { text: 'INVALID_OPCODE', modifier: 'error' },
      STACK_OVERFLOW: { text: 'STACK_OVERFLOW', modifier: 'error' },
      UNKNOWN_ERROR: { text: 'UNKNOWN_ERROR', modifier: 'error' },
    };

    const typeInfo = typeMap[errorType] ?? {
      text: errorType,
      modifier: 'error',
    };
    badge.textContent = typeInfo.text;
    badge.classList.add(`da-runtime-error-panel__type-badge--${typeInfo.modifier}`);

    return badge;
  }

  /**
   * Create the instruction context section.
   * Displays PC, instruction mnemonic, and opcode.
   * @param error - The runtime error context
   */
  private createContextSection(error: RuntimeErrorContext): HTMLElement {
    const section = document.createElement('div');
    section.className = 'da-runtime-error-panel__context';

    const title = document.createElement('h4');
    title.className = 'da-runtime-error-panel__context-title';
    title.textContent = 'Instruction Context';
    section.appendChild(title);

    const list = document.createElement('ul');
    list.className = 'da-runtime-error-panel__context-list';

    // PC
    const pcItem = document.createElement('li');
    const pcLabel = document.createElement('span');
    pcLabel.className = 'da-runtime-error-panel__context-label';
    pcLabel.textContent = 'PC:';
    pcItem.appendChild(pcLabel);
    const pcValue = document.createElement('code');
    pcValue.className = 'da-runtime-error-panel__context-value';
    pcValue.textContent = `0x${error.pc.toString(16).toUpperCase().padStart(2, '0')}`;
    pcItem.appendChild(pcValue);
    list.appendChild(pcItem);

    // Instruction
    const instrItem = document.createElement('li');
    const instrLabel = document.createElement('span');
    instrLabel.className = 'da-runtime-error-panel__context-label';
    instrLabel.textContent = 'Instruction:';
    instrItem.appendChild(instrLabel);
    const instrValue = document.createElement('code');
    instrValue.className = 'da-runtime-error-panel__context-value';
    instrValue.textContent = error.instruction;
    instrItem.appendChild(instrValue);
    list.appendChild(instrItem);

    // Opcode
    const opcodeItem = document.createElement('li');
    const opcodeLabel = document.createElement('span');
    opcodeLabel.className = 'da-runtime-error-panel__context-label';
    opcodeLabel.textContent = 'Opcode:';
    opcodeItem.appendChild(opcodeLabel);
    const opcodeValue = document.createElement('code');
    opcodeValue.className = 'da-runtime-error-panel__context-value';
    opcodeValue.textContent = `0x${error.opcode.toString(16).toUpperCase()}`;
    opcodeItem.appendChild(opcodeValue);
    list.appendChild(opcodeItem);

    section.appendChild(list);
    return section;
  }

  /**
   * Create the component section.
   * Displays the circuit component name.
   * @param componentName - The circuit component name
   */
  private createComponentSection(componentName: string): HTMLElement {
    const section = document.createElement('div');
    section.className = 'da-runtime-error-panel__component';

    const title = document.createElement('h4');
    title.className = 'da-runtime-error-panel__component-title';
    title.textContent = 'Component:';
    section.appendChild(title);

    const name = document.createElement('span');
    name.className = 'da-runtime-error-panel__component-name';
    name.textContent = componentName;
    section.appendChild(name);

    return section;
  }

  /**
   * Create the signal values section.
   * Displays relevant signal name/value pairs.
   * @param signals - Array of signal name/value pairs
   */
  private createSignalsSection(
    signals: Array<{ name: string; value: number }>
  ): HTMLElement {
    const section = document.createElement('div');
    section.className = 'da-runtime-error-panel__signals';

    const title = document.createElement('h4');
    title.className = 'da-runtime-error-panel__signals-title';
    title.textContent = 'Signal Values';
    section.appendChild(title);

    const list = document.createElement('ul');
    list.className = 'da-runtime-error-panel__signals-list';

    for (const signal of signals) {
      const item = document.createElement('li');
      const nameSpan = document.createElement('span');
      nameSpan.className = 'da-runtime-error-panel__signal-name';
      nameSpan.textContent = `${signal.name}:`;
      item.appendChild(nameSpan);
      const valueSpan = document.createElement('code');
      valueSpan.className = 'da-runtime-error-panel__signal-value';
      valueSpan.textContent = `0x${signal.value.toString(16).toUpperCase()}`;
      item.appendChild(valueSpan);
      list.appendChild(item);
    }

    section.appendChild(list);
    return section;
  }

  /**
   * Create the action buttons row.
   * Contains: View in Circuit (disabled), View in Code, Reset
   */
  private createActionsRow(): HTMLElement {
    const row = document.createElement('div');
    row.className = 'da-runtime-error-panel__actions';

    // View in Circuit button (disabled - placeholder for Epic 6)
    const circuitBtn = document.createElement('button');
    circuitBtn.className = 'da-runtime-error-panel__action-btn';
    circuitBtn.type = 'button';
    circuitBtn.textContent = 'View in Circuit';
    circuitBtn.setAttribute('data-action', 'view-in-circuit');
    circuitBtn.disabled = true;
    circuitBtn.setAttribute('title', 'Coming in Epic 6: Circuit Visualization');
    circuitBtn.setAttribute(
      'aria-label',
      'View in Circuit (coming in Epic 6: Circuit Visualization)'
    );
    row.appendChild(circuitBtn);

    // View in Code button
    const codeBtn = document.createElement('button');
    codeBtn.className = 'da-runtime-error-panel__action-btn';
    codeBtn.type = 'button';
    codeBtn.textContent = 'View in Code';
    codeBtn.setAttribute('data-action', 'view-in-code');
    codeBtn.setAttribute('aria-label', 'View error location in code editor');
    row.appendChild(codeBtn);

    // Reset button
    const resetBtn = document.createElement('button');
    resetBtn.className =
      'da-runtime-error-panel__action-btn da-runtime-error-panel__action-btn--reset';
    resetBtn.type = 'button';
    resetBtn.textContent = 'Reset';
    resetBtn.setAttribute('data-action', 'reset');
    resetBtn.setAttribute('aria-label', 'Reset emulator and clear error');
    row.appendChild(resetBtn);

    return row;
  }

  /**
   * Handle button click events via delegation.
   * @param e - The click event
   */
  private handleButtonClick(e: Event): void {
    const target = e.target as HTMLElement;
    const button = target.closest('.da-runtime-error-panel__action-btn');
    if (!button || (button as HTMLButtonElement).disabled) return;

    const action = button.getAttribute('data-action');
    switch (action) {
      case 'view-in-circuit':
        this.options.onViewInCircuit?.();
        break;
      case 'view-in-code':
        this.options.onViewInCode?.();
        break;
      case 'reset':
        this.options.onReset?.();
        break;
    }
  }

  /**
   * Handle keydown events for keyboard accessibility.
   * @param e - The keyboard event
   */
  private handleKeydown(e: KeyboardEvent): void {
    // Support Enter and Space for button activation (WCAG 2.1)
    if (e.key === 'Enter' || e.key === ' ') {
      const target = e.target as HTMLElement;
      const button = target.closest('.da-runtime-error-panel__action-btn');
      if (button && !(button as HTMLButtonElement).disabled) {
        e.preventDefault();
        this.handleButtonClick(e);
      }
    }
  }
}
