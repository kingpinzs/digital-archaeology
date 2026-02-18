// src/debugger/StackView.ts
// StackView component for displaying CPU stack contents (Story 12.5)

/** Default stack base address — Micro8 SP initializes to 0xFFFF */
const DEFAULT_STACK_BASE = 0xFFFF;

/** Maximum number of stack entries to display */
const MAX_STACK_ENTRIES = 16;

/** Threshold for return address heuristic — values below this are likely code addresses */
const RETURN_ADDR_THRESHOLD = 0x8000;

/** SP delta for CALL instruction (pushes 2-byte return address) */
const CALL_SP_DELTA = -2;

/** SP delta for RET instruction (pops 2-byte return address) */
const RET_SP_DELTA = 2;

/**
 * State interface for StackView component.
 * Contains only the values that can be updated from outside.
 */
export interface StackViewState {
  /** Stack Pointer (0-65535) — 16-bit */
  sp: number;
  /** Full memory array for reading stack contents */
  memory: Uint8Array;
  /** Optional stack base address (defaults to 0xFFFF) */
  stackBaseAddr?: number;
}

/**
 * StackView component displays CPU stack contents in the State panel.
 * Shows stack entries from SP+1 upward (most recent pushes first).
 * Entries flash briefly with accent color when their values change.
 * Detects potential return address pairs using a heuristic.
 */
export class StackView {
  private container: HTMLElement | null = null;
  private element: HTMLElement | null = null;
  private state: StackViewState = { sp: DEFAULT_STACK_BASE, memory: new Uint8Array(0) };
  private previousValues: Map<number, number> | null = null;
  private previousSp: number | null = null;
  private isFirstRender: boolean = true;

  // Bound event handlers for cleanup
  private boundAnimationEndHandler: (e: Event) => void;

  constructor() {
    this.boundAnimationEndHandler = (e: Event) => this.handleAnimationEnd(e as AnimationEvent);
  }

  /**
   * Mount the component to a container element.
   * @param container - The HTML element to mount into
   */
  mount(container: HTMLElement): void {
    this.container = container;
    this.element = document.createElement('div');
    this.element.className = 'da-stack-view';
    this.element.addEventListener('animationend', this.boundAnimationEndHandler);
    this.render();
    this.container.appendChild(this.element);
  }

  /**
   * Update the displayed stack state.
   * Only updates values that are provided (partial updates supported).
   * @param state - Partial state with values to update
   */
  updateState(state: Partial<StackViewState>): void {
    // Store previous values for change detection (after first render)
    if (!this.isFirstRender) {
      this.previousValues = this.captureCurrentValues();
      this.previousSp = this.state.sp;
    }

    if (state.sp !== undefined) {
      const sp = Number.isFinite(state.sp) ? state.sp : DEFAULT_STACK_BASE;
      this.state.sp = Math.max(0, Math.min(65535, Math.floor(sp)));
    }

    if (state.memory !== undefined) {
      this.state.memory = state.memory;
    }

    if (state.stackBaseAddr !== undefined) {
      this.state.stackBaseAddr = state.stackBaseAddr;
    }

    this.render();

    if (this.isFirstRender) {
      this.isFirstRender = false;
    }
  }

  /**
   * Capture current stack values keyed by address for change detection.
   * Only captures the visible entries (~16 bytes) near SP, NOT the full 64KB.
   * @private
   */
  private captureCurrentValues(): Map<number, number> {
    const values = new Map<number, number>();
    const depth = this.getStackDepth();
    const count = Math.min(depth, MAX_STACK_ENTRIES);
    for (let i = 0; i < count; i++) {
      const addr = this.state.sp + 1 + i;
      values.set(addr, this.state.memory[addr] ?? 0);
    }
    return values;
  }

  /**
   * Get the stack base address.
   * @private
   */
  private getStackBase(): number {
    return this.state.stackBaseAddr ?? DEFAULT_STACK_BASE;
  }

  /**
   * Get the current stack depth in bytes.
   * @private
   */
  private getStackDepth(): number {
    const base = this.getStackBase();
    return Math.max(0, base - this.state.sp);
  }

  /**
   * Check if the stack is empty (SP at or above stack base).
   * @private
   */
  private isStackEmpty(): boolean {
    return this.state.sp >= this.getStackBase();
  }

  /**
   * Heuristic: check if a pair of bytes looks like a return address.
   * CALL pushes a 16-bit return address as high byte then low byte.
   * Return addresses point to code space (lower memory), while the stack
   * lives at high memory (near 0xFFFF).
   * @private
   */
  private isLikelyReturnAddress(lowByte: number, highByte: number): boolean {
    const addr = (highByte << 8) | lowByte;
    return addr > 0 && addr < RETURN_ADDR_THRESHOLD;
  }

  /**
   * Detect CALL/RET operation by comparing SP delta.
   * CALL: SP decreased by exactly 2 (pushed 2-byte return address)
   * RET: SP increased by exactly 2 (popped 2-byte return address)
   *
   * Note: Constants CALL_SP_DELTA/RET_SP_DELTA are intentionally duplicated from
   * CallRetVisualizer.ts to keep modules decoupled (see CR L-1).
   *
   * Known limitation: During throttled RUN mode, multiple instructions execute
   * between state snapshots. An SP delta of ±2 could result from two consecutive
   * single-byte PUSH/POP operations rather than an actual CALL/RET (see CR M-1).
   * @private
   */
  private detectOperation(): 'call' | 'ret' | null {
    if (this.previousSp === null) return null;

    const spDelta = this.state.sp - this.previousSp;

    if (spDelta === CALL_SP_DELTA) return 'call';
    if (spDelta === RET_SP_DELTA) return 'ret';

    return null;
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

    const sp = this.state.sp;
    const depth = this.getStackDepth();
    const isEmpty = this.isStackEmpty();

    // Title
    const title = document.createElement('h3');
    title.className = 'da-stack-view__title';
    title.textContent = 'Stack';
    this.element.appendChild(title);

    // CALL/RET operation label (Story 12.6, Task 5)
    const operation = this.detectOperation();
    if (operation === 'call') {
      const opLabel = document.createElement('span');
      opLabel.className = 'da-stack-view__operation da-stack-view__operation--call';
      opLabel.textContent = 'CALL pushed';
      this.element.appendChild(opLabel);
    } else if (operation === 'ret') {
      const opLabel = document.createElement('span');
      opLabel.className = 'da-stack-view__operation da-stack-view__operation--ret';
      opLabel.textContent = 'RET popped';
      this.element.appendChild(opLabel);
    }

    if (isEmpty) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'da-stack-view__empty';
      emptyMsg.textContent = 'Stack Empty';
      this.element.appendChild(emptyMsg);
      return;
    }

    // Info bar: SP value and depth
    const info = document.createElement('div');
    info.className = 'da-stack-view__info';
    const spHex = sp.toString(16).toUpperCase().padStart(4, '0');
    info.textContent = `SP: 0x${spHex} | Depth: ${depth} byte${depth !== 1 ? 's' : ''}`;
    this.element.appendChild(info);

    // Stack entries list
    const list = document.createElement('div');
    list.className = 'da-stack-view__list';
    this.element.appendChild(list);

    const count = Math.min(depth, MAX_STACK_ENTRIES);

    // Pre-compute return address pairs at even offsets from SP+1
    // CALL pushes 2 bytes: high byte first (at higher addr), low byte second (at lower addr)
    // After CALL: memory[SP+1] = low byte, memory[SP+2] = high byte
    const returnAddrFlags = new Set<number>();
    for (let i = 0; i + 1 < count; i += 2) {
      const lowAddr = sp + 1 + i;
      const highAddr = sp + 2 + i;
      const lowByte = this.state.memory[lowAddr] ?? 0;
      const highByte = this.state.memory[highAddr] ?? 0;
      if (this.isLikelyReturnAddress(lowByte, highByte)) {
        returnAddrFlags.add(lowAddr);
        returnAddrFlags.add(highAddr);
      }
    }

    // Render each stack entry from SP+1 upward (most recent first)
    for (let i = 0; i < count; i++) {
      const addr = sp + 1 + i;
      const value = this.state.memory[addr] ?? 0;
      const addrHex = addr.toString(16).toUpperCase().padStart(4, '0');
      const valHex = value.toString(16).toUpperCase().padStart(2, '0');

      const row = document.createElement('div');
      row.className = 'da-stack-row';
      row.setAttribute('data-addr', `0x${addrHex}`);

      // Highlight first row (SP+1) as the stack pointer boundary
      if (i === 0) {
        row.classList.add('da-stack-row--sp');
      }

      // Mark return address pairs
      if (returnAddrFlags.has(addr)) {
        row.classList.add('da-stack-row--return-addr');
      }

      // Change detection: compare with previous values at same address
      if (this.previousValues !== null) {
        if (this.previousValues.has(addr)) {
          if (this.previousValues.get(addr) !== value) {
            row.classList.add('da-stack-changed');
          }
        } else {
          // New entry (wasn't visible before) → flash it
          row.classList.add('da-stack-changed');
        }
      }

      // Address label
      const addrLabel = document.createElement('span');
      addrLabel.className = 'da-stack-addr';
      addrLabel.textContent = addrHex;
      row.appendChild(addrLabel);

      // Value display
      const valSpan = document.createElement('span');
      valSpan.className = 'da-stack-value';
      valSpan.textContent = `0x${valHex} (${value})`;
      row.appendChild(valSpan);

      list.appendChild(row);
    }
  }

  /**
   * Handle animationend event to remove flash class.
   * @param e - The animation event
   * @private
   */
  private handleAnimationEnd(e: AnimationEvent): void {
    const target = e.target as HTMLElement;
    if (target.classList.contains('da-stack-changed')) {
      target.classList.remove('da-stack-changed');
    }
  }

  /**
   * Clean up and remove the component from DOM.
   */
  destroy(): void {
    if (this.element) {
      this.element.removeEventListener('animationend', this.boundAnimationEndHandler);
      this.element.remove();
      this.element = null;
    }

    this.container = null;
    this.previousValues = null;
    this.previousSp = null;
    this.isFirstRender = true;
  }
}
