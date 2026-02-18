// src/debugger/CallRetVisualizer.ts
// CallRetVisualizer component for visualizing CALL/RET operations (Story 12.6)

/** SP delta for CALL instruction (pushes 2-byte return address) */
const CALL_SP_DELTA = -2;

/** SP delta for RET instruction (pops 2-byte return address) */
const RET_SP_DELTA = 2;

/** Default SP value when stack is empty */
const DEFAULT_SP = 0xFFFF;

/**
 * Detected subroutine operation type.
 * 'call' = CALL instruction (SP decreased by 2, return address pushed)
 * 'ret' = RET/RETI instruction (SP increased by 2, return address popped)
 * null = no subroutine operation detected
 */
type StackOperation = 'call' | 'ret' | null;

/**
 * State interface for CallRetVisualizer component.
 * Contains only the values needed for CALL/RET detection and display.
 */
export interface CallRetVisualizerState {
  /** Program Counter (0-65535) — 16-bit */
  pc: number;
  /** Stack Pointer (0-65535) — 16-bit */
  sp: number;
  /** Full memory array for reading return addresses */
  memory: Uint8Array;
}

/**
 * CallRetVisualizer component displays CALL/RET operation flow in the State panel.
 * Detects subroutine calls and returns by comparing SP/PC changes between updates.
 * Shows animated flow diagram with return address, PC change, and SP change.
 */
export class CallRetVisualizer {
  private container: HTMLElement | null = null;
  private element: HTMLElement | null = null;
  private state: CallRetVisualizerState = { pc: 0, sp: DEFAULT_SP, memory: new Uint8Array(0) };
  private previousPc: number | null = null;
  private previousSp: number | null = null;
  private isFirstRender: boolean = true;

  /**
   * Mount the component to a container element.
   * @param container - The HTML element to mount into
   */
  mount(container: HTMLElement): void {
    this.container = container;
    this.element = document.createElement('div');
    this.element.className = 'da-callret';
    this.render();
    this.container.appendChild(this.element);
  }

  /**
   * Update the displayed state and detect CALL/RET operations.
   * @param state - Partial state with values to update
   */
  updateState(state: Partial<CallRetVisualizerState>): void {
    // Store previous values for operation detection (after first render)
    if (!this.isFirstRender) {
      this.previousPc = this.state.pc;
      this.previousSp = this.state.sp;
    }

    if (state.pc !== undefined) {
      this.state.pc = state.pc;
    }

    if (state.sp !== undefined) {
      this.state.sp = state.sp;
    }

    if (state.memory !== undefined) {
      this.state.memory = state.memory;
    }

    this.render();

    if (this.isFirstRender) {
      this.isFirstRender = false;
    }
  }

  /**
   * Detect CALL/RET operation by comparing SP delta.
   * CALL: SP decreased by exactly 2 (pushed 2-byte return address)
   * RET: SP increased by exactly 2 (popped 2-byte return address)
   *
   * Known limitation: During throttled RUN mode, multiple instructions execute
   * between state snapshots. An SP delta of ±2 could result from two consecutive
   * single-byte PUSH/POP operations rather than an actual CALL/RET. This heuristic
   * is reliable in single-step mode but may produce false positives during fast execution.
   * @private
   */
  private detectOperation(): StackOperation {
    if (this.previousSp === null) return null;

    const spDelta = this.state.sp - this.previousSp;

    if (spDelta === CALL_SP_DELTA) {
      return 'call';
    }

    if (spDelta === RET_SP_DELTA) {
      return 'ret';
    }

    return null;
  }

  /**
   * Get the return address from stack after a CALL.
   * Reads low byte from memory[SP+1] and high byte from memory[SP+2].
   * @private
   */
  private getReturnAddressFromStack(): number {
    const sp = this.state.sp;
    const lowByte = this.state.memory[sp + 1] ?? 0;
    const highByte = this.state.memory[sp + 2] ?? 0;
    return (highByte << 8) | lowByte;
  }

  /**
   * Format a 16-bit address as 4-digit uppercase hex.
   * @private
   */
  private formatAddr(addr: number): string {
    return addr.toString(16).toUpperCase().padStart(4, '0');
  }

  /**
   * Render the component using safe DOM methods.
   * XSS-SAFE: Uses textContent for all dynamic values.
   * @private
   */
  private render(): void {
    if (!this.element) return;

    // Clear existing content
    this.element.textContent = '';

    // Don't render anything when uninitialized (e.g., Micro4 stage has no stack).
    // A zero-length memory array signals that no Micro8 state has been provided.
    if (this.state.memory.length === 0) return;

    // Title
    const title = document.createElement('h3');
    title.className = 'da-callret__title';
    title.textContent = 'CALL/RET Monitor';
    this.element.appendChild(title);

    const operation = this.detectOperation();

    if (operation === 'call') {
      this.renderCall();
    } else if (operation === 'ret') {
      this.renderRet();
    } else {
      this.renderIdle();
    }
  }

  /**
   * Render CALL operation visualization.
   * Shows: badge, PC flow, return address pushed, SP change.
   * @private
   */
  private renderCall(): void {
    if (!this.element || this.previousPc === null || this.previousSp === null) return;

    const content = document.createElement('div');
    content.className = 'da-callret__content da-callret__content--active';

    // CALL badge
    const badge = document.createElement('span');
    badge.className = 'da-callret__badge da-callret__badge--call';
    badge.textContent = 'CALL';
    content.appendChild(badge);

    // PC flow: oldPC → newPC
    const pcFlow = document.createElement('div');
    pcFlow.className = 'da-callret__pc';
    const arrow = document.createElement('span');
    arrow.className = 'da-callret__arrow';
    arrow.textContent = '\u2192'; // →
    pcFlow.appendChild(this.createLabel('PC:'));
    pcFlow.appendChild(this.createValue(this.formatAddr(this.previousPc)));
    pcFlow.appendChild(arrow);
    pcFlow.appendChild(this.createValue(this.formatAddr(this.state.pc)));
    content.appendChild(pcFlow);

    // Return address pushed
    const retAddr = this.getReturnAddressFromStack();
    const stackInfo = document.createElement('div');
    stackInfo.className = 'da-callret__stack';
    stackInfo.appendChild(this.createLabel('PUSH:'));
    stackInfo.appendChild(this.createValue(`0x${this.formatAddr(retAddr)}`));
    content.appendChild(stackInfo);

    // SP change
    const spInfo = document.createElement('div');
    spInfo.className = 'da-callret__sp';
    spInfo.appendChild(this.createLabel('SP:'));
    spInfo.appendChild(this.createValue(this.formatAddr(this.previousSp)));
    const spArrow = document.createElement('span');
    spArrow.className = 'da-callret__arrow';
    spArrow.textContent = '\u2192';
    spInfo.appendChild(spArrow);
    spInfo.appendChild(this.createValue(this.formatAddr(this.state.sp)));
    content.appendChild(spInfo);

    this.element.appendChild(content);
  }

  /**
   * Render RET operation visualization.
   * Shows: badge, PC flow, return address popped, SP change.
   * @private
   */
  private renderRet(): void {
    if (!this.element || this.previousPc === null || this.previousSp === null) return;

    const content = document.createElement('div');
    content.className = 'da-callret__content da-callret__content--active';

    // RET badge
    const badge = document.createElement('span');
    badge.className = 'da-callret__badge da-callret__badge--ret';
    badge.textContent = 'RET';
    content.appendChild(badge);

    // PC flow: oldPC → newPC (returning to caller)
    const pcFlow = document.createElement('div');
    pcFlow.className = 'da-callret__pc';
    const arrow = document.createElement('span');
    arrow.className = 'da-callret__arrow';
    arrow.textContent = '\u2192';
    pcFlow.appendChild(this.createLabel('PC:'));
    pcFlow.appendChild(this.createValue(this.formatAddr(this.previousPc)));
    pcFlow.appendChild(arrow);
    pcFlow.appendChild(this.createValue(this.formatAddr(this.state.pc)));
    content.appendChild(pcFlow);

    // Return address popped (current PC = popped address)
    const stackInfo = document.createElement('div');
    stackInfo.className = 'da-callret__stack';
    stackInfo.appendChild(this.createLabel('POP:'));
    stackInfo.appendChild(this.createValue(`0x${this.formatAddr(this.state.pc)}`));
    content.appendChild(stackInfo);

    // SP change
    const spInfo = document.createElement('div');
    spInfo.className = 'da-callret__sp';
    spInfo.appendChild(this.createLabel('SP:'));
    spInfo.appendChild(this.createValue(this.formatAddr(this.previousSp)));
    const spArrow = document.createElement('span');
    spArrow.className = 'da-callret__arrow';
    spArrow.textContent = '\u2192';
    spInfo.appendChild(spArrow);
    spInfo.appendChild(this.createValue(this.formatAddr(this.state.sp)));
    content.appendChild(spInfo);

    this.element.appendChild(content);
  }

  /**
   * Render idle state (no CALL/RET operation).
   * @private
   */
  private renderIdle(): void {
    if (!this.element) return;

    const content = document.createElement('div');
    content.className = 'da-callret__content';

    const badge = document.createElement('span');
    badge.className = 'da-callret__badge da-callret__badge--idle';
    badge.textContent = '\u2014'; // em dash
    content.appendChild(badge);

    const msg = document.createElement('span');
    msg.className = 'da-callret__idle-msg';
    msg.textContent = 'No subroutine operation';
    content.appendChild(msg);

    this.element.appendChild(content);
  }

  /**
   * Create a label span element.
   * @private
   */
  private createLabel(text: string): HTMLSpanElement {
    const label = document.createElement('span');
    label.className = 'da-callret__label';
    label.textContent = text;
    return label;
  }

  /**
   * Create a value span element.
   * @private
   */
  private createValue(text: string): HTMLSpanElement {
    const value = document.createElement('span');
    value.className = 'da-callret__value';
    value.textContent = text;
    return value;
  }

  /**
   * Clean up and remove the component from DOM.
   */
  destroy(): void {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }

    this.container = null;
    this.previousPc = null;
    this.previousSp = null;
    this.isFirstRender = true;
  }
}
