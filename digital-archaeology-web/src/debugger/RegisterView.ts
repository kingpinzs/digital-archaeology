// src/debugger/RegisterView.ts
// RegisterView component for displaying CPU register values (Story 5.3)

/**
 * State interface for RegisterView component.
 * Contains only the values that can be updated from outside.
 */
export interface RegisterViewState {
  /** Program Counter (0-255) - 8-bit */
  pc: number;
  /** Accumulator (0-15) - 4-bit */
  accumulator: number;
}

/**
 * Options for RegisterView component.
 * Reserved for future callbacks (e.g., register click events).
 */
export interface RegisterViewOptions {
  // Future: onRegisterClick callback
}

/**
 * RegisterView component displays CPU register values in the State panel.
 * Shows PC and Accumulator in hex and decimal format.
 * Values flash briefly with accent color when they change.
 */
export class RegisterView {
  private container: HTMLElement | null = null;
  private element: HTMLElement | null = null;
  private state: RegisterViewState = { pc: 0, accumulator: 0 };
  private previousState: RegisterViewState | null = null;
  private isFirstRender: boolean = true;

  // Bound event handlers for cleanup
  private boundAnimationEndHandler: (e: Event) => void;

  /**
   * Create a new RegisterView component.
   * @param _options - Optional configuration (reserved for future use)
   */
  constructor(_options?: RegisterViewOptions) {
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
    this.element.className = 'da-register-view';

    // Add animationend listener to the element
    this.element.addEventListener('animationend', this.boundAnimationEndHandler);

    this.render();
    this.container.appendChild(this.element);
  }

  /**
   * Update the displayed register values.
   * Only updates values that are provided (partial updates supported).
   * Values are clamped to valid ranges: PC (0-255), Accumulator (0-15).
   * @param state - Partial state with values to update
   */
  updateState(state: Partial<RegisterViewState>): void {
    // Store previous state for change detection (after first render)
    if (!this.isFirstRender) {
      this.previousState = { ...this.state };
    }

    // Update state with provided values, clamped to valid ranges
    // PC is 8-bit (0-255), Accumulator is 4-bit (0-15)
    if (state.pc !== undefined) {
      const pc = Number.isFinite(state.pc) ? state.pc : 0;
      this.state.pc = Math.max(0, Math.min(255, Math.floor(pc)));
    }
    if (state.accumulator !== undefined) {
      const acc = Number.isFinite(state.accumulator) ? state.accumulator : 0;
      this.state.accumulator = Math.max(0, Math.min(15, Math.floor(acc)));
    }

    // Re-render with new values
    this.render();

    // Clear first render flag after first updateState call
    if (this.isFirstRender) {
      this.isFirstRender = false;
    }
  }

  /**
   * Render the component HTML.
   * XSS NOTE: This innerHTML is SAFE - it contains only:
   * - Hardcoded class names and structure
   * - Number values formatted via toString(16) - no user input
   * @private
   */
  private render(): void {
    if (!this.element) return;

    // Format values - these are numbers, not user input
    // PC: 2 hex digits (8-bit, 0-255), Accumulator: 1 hex digit (4-bit, 0-15)
    const pcHex = this.state.pc.toString(16).toUpperCase().padStart(2, '0');
    const accHex = this.state.accumulator.toString(16).toUpperCase().padStart(1, '0');

    // Detect changes for flash animation
    const pcChanged = this.previousState !== null && this.previousState.pc !== this.state.pc;
    const accChanged = this.previousState !== null && this.previousState.accumulator !== this.state.accumulator;

    // Build HTML using safe, controlled values (numbers only)
    this.element.innerHTML = `
      <h3 class="da-register-view__title">Registers</h3>
      <div class="da-register-view__list">
        <div class="da-register-row${pcChanged ? ' da-register-changed' : ''}" data-register="pc">
          <span class="da-register-label">PC</span>
          <span class="da-register-value" aria-live="polite">0x${pcHex} (${this.state.pc})</span>
        </div>
        <div class="da-register-row${accChanged ? ' da-register-changed' : ''}" data-register="accumulator">
          <span class="da-register-label">ACC</span>
          <span class="da-register-value" aria-live="polite">0x${accHex} (${this.state.accumulator})</span>
        </div>
      </div>
    `;
  }

  /**
   * Handle animationend event to remove flash class.
   * @param e - The animation event
   * @private
   */
  private handleAnimationEnd(e: AnimationEvent): void {
    const target = e.target as HTMLElement;
    if (target.classList.contains('da-register-changed')) {
      target.classList.remove('da-register-changed');
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
