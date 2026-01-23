// src/debugger/FlagsView.ts
// FlagsView component for displaying CPU flag states (Story 5.4)

/**
 * State interface for FlagsView component.
 * Contains only the values that can be updated from outside.
 */
export interface FlagsViewState {
  /** Zero flag - set when result is 0 */
  zeroFlag: boolean;
}

/**
 * Options for FlagsView component.
 * Reserved for future callbacks (e.g., flag click events).
 */
export interface FlagsViewOptions {
  // Future: onFlagClick callback
}

/**
 * FlagsView component displays CPU flag states in the State panel.
 * Shows flags with 0/1 value and clear/SET label.
 * SET flags are visually distinct with accent color highlighting.
 * Values flash briefly when they change.
 */
export class FlagsView {
  private container: HTMLElement | null = null;
  private element: HTMLElement | null = null;
  private state: FlagsViewState = { zeroFlag: false };
  private previousState: FlagsViewState | null = null;
  private isFirstRender: boolean = true;

  // Bound event handlers for cleanup
  private boundAnimationEndHandler: (e: Event) => void;

  /**
   * Create a new FlagsView component.
   * @param _options - Optional configuration (reserved for future use)
   */
  constructor(_options?: FlagsViewOptions) {
    // Bind handler in constructor for proper add/remove listener pairing
    this.boundAnimationEndHandler = (e: Event) => this.handleAnimationEnd(e as AnimationEvent);
  }

  /**
   * Mount the component to a container element.
   * @param container - The HTML element to mount into
   */
  mount(container: HTMLElement): void {
    this.container = container;
    this.element = document.createElement('div');
    this.element.className = 'da-flags-view';

    // Add animationend listener to the element
    this.element.addEventListener('animationend', this.boundAnimationEndHandler);

    this.render();
    this.container.appendChild(this.element);
  }

  /**
   * Update the displayed flag values.
   * Only updates values that are provided (partial updates supported).
   * @param state - Partial state with values to update
   */
  updateState(state: Partial<FlagsViewState>): void {
    // Store previous state for change detection (after first render)
    if (!this.isFirstRender) {
      this.previousState = { ...this.state };
    }

    // Update state with provided values
    if (state.zeroFlag !== undefined) {
      this.state.zeroFlag = Boolean(state.zeroFlag);
    }

    // Re-render with new values
    this.render();

    // Clear first render flag after first updateState call
    if (this.isFirstRender) {
      this.isFirstRender = false;
    }
  }

  /**
   * Render the component using safe DOM methods.
   * XSS-SAFE: Uses textContent for all dynamic values (booleans rendered as 0/1).
   * @private
   */
  private render(): void {
    if (!this.element) return;

    // Clear existing content
    this.element.textContent = '';

    // Create title
    const title = document.createElement('h3');
    title.className = 'da-flags-view__title';
    title.textContent = 'Flags';
    this.element.appendChild(title);

    // Create list container
    const list = document.createElement('div');
    list.className = 'da-flags-view__list';
    this.element.appendChild(list);

    // Create Zero flag row
    const zeroRow = document.createElement('div');
    zeroRow.className = 'da-flag-row';
    zeroRow.setAttribute('data-flag', 'zero');

    // Add SET class if flag is set
    if (this.state.zeroFlag) {
      zeroRow.classList.add('da-flag-set');
    }

    // Add changed class if value changed (not on first render)
    const zeroChanged = this.previousState !== null && this.previousState.zeroFlag !== this.state.zeroFlag;
    if (zeroChanged) {
      zeroRow.classList.add('da-flag-changed');
    }

    // Create label
    const label = document.createElement('span');
    label.className = 'da-flag-label';
    label.textContent = 'Z';
    zeroRow.appendChild(label);

    // Create value (0 or 1)
    const value = document.createElement('span');
    value.className = 'da-flag-value';
    value.setAttribute('aria-live', 'polite');
    value.textContent = this.state.zeroFlag ? '1' : '0';
    zeroRow.appendChild(value);

    // Create status label (clear or SET)
    const status = document.createElement('span');
    status.className = 'da-flag-status';
    status.textContent = this.state.zeroFlag ? 'SET' : 'clear';
    zeroRow.appendChild(status);

    list.appendChild(zeroRow);
  }

  /**
   * Handle animationend event to remove flash class.
   * @param e - The animation event
   * @private
   */
  private handleAnimationEnd(e: AnimationEvent): void {
    const target = e.target as HTMLElement;
    if (target.classList.contains('da-flag-changed')) {
      target.classList.remove('da-flag-changed');
    }
  }

  /**
   * Clean up and remove the component from DOM.
   */
  destroy(): void {
    // Remove event listener
    if (this.element) {
      this.element.removeEventListener('animationend', this.boundAnimationEndHandler);
    }

    // Remove from DOM
    if (this.element) {
      this.element.remove();
      this.element = null;
    }

    this.container = null;
    this.previousState = null;
    this.isFirstRender = true;
  }
}
