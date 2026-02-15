// src/debugger/RegisterView.ts
// RegisterView component for displaying CPU register values (Stories 5.3, 12.4)

/**
 * Register alias labels for Micro8 (R0=A, R1=B, ..., R6=L, R7 has no alias).
 * Sourced from assembler.c parse_register().
 */
const MICRO8_REGISTER_ALIASES: ReadonlyArray<string | null> = [
  'A', 'B', 'C', 'D', 'E', 'H', 'L', null,
];

/**
 * State interface for RegisterView component.
 * Contains only the values that can be updated from outside.
 * Supports both Micro4 (PC+ACC) and Micro8 (PC+SP+R0-R7) modes.
 */
export interface RegisterViewState {
  /** Program Counter - 8-bit (0-255) for Micro4, 16-bit (0-65535) for Micro8 */
  pc: number;
  /** Accumulator (0-15) - 4-bit, Micro4 only */
  accumulator: number;
  /** General-purpose registers R0-R7 (0-255 each) - Micro8 only */
  registers?: number[];
  /** Stack Pointer (0-65535) - 16-bit, Micro8 only */
  sp?: number;
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
 * Micro4 mode: shows PC and Accumulator. Micro8 mode: shows PC, SP, and R0-R7.
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
   * Detect whether the current state represents Micro8 mode.
   * Micro8 mode is active when the registers array is defined and non-empty.
   */
  private isMicro8(): boolean {
    return this.state.registers !== undefined && this.state.registers.length > 0;
  }

  /**
   * Update the displayed register values.
   * Only updates values that are provided (partial updates supported).
   * Supports both Micro4 (PC+ACC) and Micro8 (PC+SP+R0-R7) modes.
   * Values are clamped to valid ranges per mode.
   * @param state - Partial state with values to update
   */
  updateState(state: Partial<RegisterViewState>): void {
    // Store previous state for change detection (after first render)
    // Deep copy registers array to prevent reference aliasing
    if (!this.isFirstRender) {
      this.previousState = {
        ...this.state,
        registers: this.state.registers ? [...this.state.registers] : undefined,
      };
    }

    // Handle mode switching: registers present → Micro8, accumulator without registers → Micro4
    if (state.registers !== undefined) {
      this.state.registers = state.registers.map(v => {
        const val = Number.isFinite(v) ? v : 0;
        return Math.max(0, Math.min(255, Math.floor(val)));
      });
    } else if (state.accumulator !== undefined && state.registers === undefined) {
      // Switching back to Micro4 mode
      this.state.registers = undefined;
      this.state.sp = undefined;
    }

    // PC range depends on mode: 0-65535 for Micro8, 0-255 for Micro4
    if (state.pc !== undefined) {
      const pc = Number.isFinite(state.pc) ? state.pc : 0;
      const maxPc = this.state.registers !== undefined ? 65535 : 255;
      this.state.pc = Math.max(0, Math.min(maxPc, Math.floor(pc)));
    }

    // Accumulator: 4-bit (0-15), Micro4 only
    if (state.accumulator !== undefined) {
      const acc = Number.isFinite(state.accumulator) ? state.accumulator : 0;
      this.state.accumulator = Math.max(0, Math.min(15, Math.floor(acc)));
    }

    // Stack Pointer: 16-bit (0-65535), Micro8 only
    if (state.sp !== undefined) {
      const sp = Number.isFinite(state.sp) ? state.sp : 0;
      this.state.sp = Math.max(0, Math.min(65535, Math.floor(sp)));
    }

    // Re-render with new values
    this.render();

    // Clear first render flag after first updateState call
    if (this.isFirstRender) {
      this.isFirstRender = false;
    }
  }

  /**
   * Render the component HTML — dispatches to mode-specific renderer.
   * @private
   */
  private render(): void {
    if (!this.element) return;
    if (this.isMicro8()) {
      this.renderMicro8();
    } else {
      this.renderMicro4();
    }
  }

  /**
   * Render Micro4 layout: PC (2 hex digits) + ACC (1 hex digit).
   * XSS NOTE: innerHTML is SAFE — only number values from toString(16).
   * @private
   */
  private renderMicro4(): void {
    if (!this.element) return;

    const pcHex = this.state.pc.toString(16).toUpperCase().padStart(2, '0');
    const accHex = this.state.accumulator.toString(16).toUpperCase().padStart(1, '0');

    const pcChanged = this.previousState !== null && this.previousState.pc !== this.state.pc;
    const accChanged = this.previousState !== null && this.previousState.accumulator !== this.state.accumulator;

    // Safe innerHTML: only hardcoded class names and number-derived hex strings
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
   * Render Micro8 layout: PC (4 hex digits) + SP (4 hex digits) + R0-R7 (2 hex digits each).
   * Includes register alias labels (R0=A, R1=B, ..., R6=L) for educational value.
   * XSS NOTE: innerHTML is SAFE — only number values from toString(16) and hardcoded alias strings.
   * @private
   */
  private renderMicro8(): void {
    if (!this.element) return;

    const registers = this.state.registers!;
    const sp = this.state.sp ?? 0;

    const pcHex = this.state.pc.toString(16).toUpperCase().padStart(4, '0');
    const spHex = sp.toString(16).toUpperCase().padStart(4, '0');

    const pcChanged = this.previousState !== null && this.previousState.pc !== this.state.pc;
    const spChanged = this.previousState !== null && this.previousState.sp !== sp;

    // Build register rows with per-register change detection
    let registerRows = '';
    for (let i = 0; i < registers.length; i++) {
      const val = registers[i];
      const hex = val.toString(16).toUpperCase().padStart(2, '0');
      const alias = MICRO8_REGISTER_ALIASES[i];
      const label = alias ? `R${i} (${alias})` : `R${i}`;
      const changed = this.previousState !== null
        && this.previousState.registers !== undefined
        && this.previousState.registers[i] !== val;

      registerRows += `
        <div class="da-register-row${changed ? ' da-register-changed' : ''}" data-register="r${i}">
          <span class="da-register-label">${label}</span>
          <span class="da-register-value" aria-live="polite">0x${hex} (${val})</span>
        </div>`;
    }

    // Safe innerHTML: only hardcoded class names, number-derived hex strings, and hardcoded alias strings
    this.element.innerHTML = `
      <h3 class="da-register-view__title">Registers</h3>
      <div class="da-register-view__list">
        <div class="da-register-row${pcChanged ? ' da-register-changed' : ''}" data-register="pc">
          <span class="da-register-label">PC</span>
          <span class="da-register-value" aria-live="polite">0x${pcHex} (${this.state.pc})</span>
        </div>
        <div class="da-register-row${spChanged ? ' da-register-changed' : ''}" data-register="sp">
          <span class="da-register-label">SP</span>
          <span class="da-register-value" aria-live="polite">0x${spHex} (${sp})</span>
        </div>
        ${registerRows}
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
