/**
 * BreakpointsView Component (Story 5.8)
 *
 * Displays a list of active breakpoints in the State Panel.
 * Allows users to click to remove individual breakpoints.
 *
 * Follows the same pattern as RegisterView, FlagsView, and MemoryView.
 */

/**
 * Configuration options for the BreakpointsView component.
 */
export interface BreakpointsViewOptions {
  /** Callback when user clicks to remove a breakpoint */
  onRemoveBreakpoint?: (address: number) => void;
}

/**
 * Breakpoint entry with address and line mapping.
 */
export interface BreakpointEntry {
  /** Memory address of the breakpoint (0-255 for Micro4) */
  address: number;
  /** Line number in the source code (1-based) */
  line: number;
}

/**
 * State for the BreakpointsView component.
 */
export interface BreakpointsViewState {
  /** Array of active breakpoints */
  breakpoints: BreakpointEntry[];
}

/**
 * BreakpointsView - displays and manages breakpoints in the State Panel.
 *
 * @example
 * ```typescript
 * const view = new BreakpointsView({
 *   onRemoveBreakpoint: (address) => console.log('Remove:', address)
 * });
 * view.mount(container);
 * view.updateState({ breakpoints: [{ address: 0x10, line: 5 }] });
 * ```
 */
export class BreakpointsView {
  private container: HTMLElement | null = null;
  private element: HTMLElement | null = null;
  private options: BreakpointsViewOptions;
  private state: BreakpointsViewState = { breakpoints: [] };
  private boundRemoveHandler: (e: Event) => void;

  constructor(options: BreakpointsViewOptions = {}) {
    this.options = options;
    this.boundRemoveHandler = (e: Event) => this.handleRemoveClick(e);
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
   * Update the component state and re-render.
   * @param state - Partial state to merge with current state
   */
  updateState(state: Partial<BreakpointsViewState>): void {
    this.state = { ...this.state, ...state };
    this.render();
  }

  /**
   * Render the component DOM structure.
   * Uses safe DOM methods (createElement, textContent) for XSS prevention.
   */
  private render(): void {
    if (!this.container) return;

    // Remove existing element if present
    if (this.element) {
      this.element.removeEventListener('click', this.boundRemoveHandler);
      this.element.remove();
    }

    // Create main container
    this.element = document.createElement('div');
    this.element.className = 'da-breakpoints-view';
    this.element.setAttribute('role', 'region');
    this.element.setAttribute('aria-label', 'Breakpoints');

    // Create title
    const title = document.createElement('h4');
    title.className = 'da-breakpoints-view__title';
    title.textContent = 'Breakpoints';
    this.element.appendChild(title);

    // Create list or empty message
    if (this.state.breakpoints.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'da-breakpoints-view__empty';
      emptyMsg.textContent = 'No breakpoints set';
      this.element.appendChild(emptyMsg);
    } else {
      const list = document.createElement('ul');
      list.className = 'da-breakpoints-view__list';
      list.setAttribute('role', 'list');
      list.setAttribute('aria-live', 'polite');
      list.setAttribute('aria-relevant', 'additions removals');

      for (const bp of this.state.breakpoints) {
        const item = document.createElement('li');
        item.className = 'da-breakpoints-view__item';
        item.setAttribute('role', 'listitem');

        // Address display
        const addressSpan = document.createElement('span');
        addressSpan.className = 'da-breakpoints-view__address';
        addressSpan.textContent = `0x${bp.address.toString(16).padStart(2, '0').toUpperCase()}`;
        item.appendChild(addressSpan);

        // Line display
        const lineSpan = document.createElement('span');
        lineSpan.className = 'da-breakpoints-view__line';
        lineSpan.textContent = `Line ${bp.line}`;
        item.appendChild(lineSpan);

        // Remove button
        const removeBtn = document.createElement('button');
        removeBtn.className = 'da-breakpoints-view__remove';
        removeBtn.type = 'button';
        removeBtn.setAttribute('aria-label', `Remove breakpoint at address 0x${bp.address.toString(16).toUpperCase()}`);
        removeBtn.setAttribute('data-address', bp.address.toString());
        removeBtn.textContent = '\u00D7'; // × symbol
        item.appendChild(removeBtn);

        list.appendChild(item);
      }

      this.element.appendChild(list);
    }

    // Add click handler for remove buttons (event delegation)
    this.element.addEventListener('click', this.boundRemoveHandler);

    this.container.appendChild(this.element);
  }

  /**
   * Handle click on remove button using event delegation.
   * @param e - Click event
   */
  private handleRemoveClick(e: Event): void {
    const target = e.target as HTMLElement;
    if (target.classList.contains('da-breakpoints-view__remove')) {
      const addressStr = target.getAttribute('data-address');
      if (addressStr !== null && this.options.onRemoveBreakpoint) {
        const address = parseInt(addressStr, 10);
        if (!isNaN(address)) {
          this.options.onRemoveBreakpoint(address);
        }
      }
    }
  }

  /**
   * Clean up the component and remove from DOM.
   */
  destroy(): void {
    if (this.element) {
      this.element.removeEventListener('click', this.boundRemoveHandler);
      this.element.remove();
      this.element = null;
    }
    this.container = null;
  }
}
