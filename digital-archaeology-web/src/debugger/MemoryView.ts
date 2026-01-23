// src/debugger/MemoryView.ts
// MemoryView component for displaying CPU memory contents (Story 5.5, 5.6)

/**
 * State interface for MemoryView component.
 * Contains the CPU memory and PC for highlighting.
 */
export interface MemoryViewState {
  /** CPU memory (256 nibbles, 4-bit values 0-15) */
  memory: Uint8Array;
  /** Program Counter for highlighting (0-255) */
  pc: number;
}

/**
 * Options for MemoryView component.
 */
export interface MemoryViewOptions {
  /** Bytes per row (default: 16) */
  bytesPerRow?: number;
  /** Optional callback when address is clicked */
  onAddressClick?: (address: number) => void;
}

/**
 * MemoryView component displays CPU memory contents in the State panel.
 * Shows a scrollable hex dump with 16 nibbles per row.
 * The current PC address is highlighted.
 * Changed cells flash briefly after each step.
 * Includes jump-to-address functionality (Story 5.6).
 */
export class MemoryView {
  private container: HTMLElement | null = null;
  private element: HTMLElement | null = null;
  private state: MemoryViewState = { memory: new Uint8Array(256), pc: 0 };
  private previousState: MemoryViewState | null = null;
  private isFirstRender: boolean = true;
  private bytesPerRow: number;

  // Jump UI elements (Story 5.6)
  private jumpInput: HTMLInputElement | null = null;
  private jumpButton: HTMLButtonElement | null = null;
  private jumpError: HTMLSpanElement | null = null;

  // Bound event handlers for cleanup
  private boundAnimationEndHandler: (e: Event) => void;
  private boundJumpHandler: () => void;
  private boundKeydownHandler: (e: Event) => void;
  private boundInputHandler: () => void;

  // Timeout ID for jump highlight cleanup (Story 5.6)
  private jumpHighlightTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Create a new MemoryView component.
   * @param options - Optional configuration
   */
  constructor(options?: MemoryViewOptions) {
    this.bytesPerRow = options?.bytesPerRow ?? 16;
    // Bind handlers in constructor for proper add/remove listener pairing
    this.boundAnimationEndHandler = (e: Event) => this.handleAnimationEnd(e as AnimationEvent);
    this.boundJumpHandler = () => this.handleJump();
    this.boundKeydownHandler = (e: Event) => this.handleKeydown(e as KeyboardEvent);
    this.boundInputHandler = () => this.handleInputChange();
  }

  /**
   * Mount the component to a container element.
   * @param container - The HTML element to mount into
   */
  mount(container: HTMLElement): void {
    this.container = container;
    this.element = document.createElement('div');
    this.element.className = 'da-memory-view';

    // Add animationend listener to the element
    this.element.addEventListener('animationend', this.boundAnimationEndHandler);

    this.render();
    this.container.appendChild(this.element);

    // Setup jump UI event listeners after render (Story 5.6)
    this.setupJumpListeners();
  }

  /**
   * Setup event listeners for jump UI.
   * @private
   */
  private setupJumpListeners(): void {
    if (this.jumpButton) {
      this.jumpButton.addEventListener('click', this.boundJumpHandler);
    }
    if (this.jumpInput) {
      this.jumpInput.addEventListener('keydown', this.boundKeydownHandler);
      this.jumpInput.addEventListener('input', this.boundInputHandler);
    }
  }

  /**
   * Remove event listeners for jump UI.
   * @private
   */
  private removeJumpListeners(): void {
    if (this.jumpButton) {
      this.jumpButton.removeEventListener('click', this.boundJumpHandler);
    }
    if (this.jumpInput) {
      this.jumpInput.removeEventListener('keydown', this.boundKeydownHandler);
      this.jumpInput.removeEventListener('input', this.boundInputHandler);
    }
  }

  /**
   * Update the displayed memory values.
   * Only updates values that are provided (partial updates supported).
   * @param state - Partial state with values to update
   */
  updateState(state: Partial<MemoryViewState>): void {
    // Store previous state for change detection (after first render)
    if (!this.isFirstRender) {
      this.previousState = {
        memory: new Uint8Array(this.state.memory),
        pc: this.state.pc,
      };
    }

    // Update state with provided values
    if (state.memory !== undefined) {
      this.state.memory = new Uint8Array(state.memory);
    }
    if (state.pc !== undefined) {
      // Clamp PC to valid range
      const pc = Number.isFinite(state.pc) ? state.pc : 0;
      this.state.pc = Math.max(0, Math.min(255, Math.floor(pc)));
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
   * XSS-SAFE: Uses textContent for all dynamic values (nibbles rendered as hex).
   * @private
   */
  private render(): void {
    if (!this.element) return;

    // Remove old jump listeners before clearing
    this.removeJumpListeners();

    // Clear existing content
    this.element.textContent = '';

    // Create title
    const title = document.createElement('h3');
    title.className = 'da-memory-view__title';
    title.textContent = 'Memory';
    this.element.appendChild(title);

    // Create jump to address UI (Story 5.6)
    const jumpContainer = document.createElement('div');
    jumpContainer.className = 'da-memory-jump';

    const jumpLabel = document.createElement('label');
    jumpLabel.className = 'da-memory-jump__label';
    jumpLabel.textContent = 'Jump to:';
    jumpContainer.appendChild(jumpLabel);

    this.jumpInput = document.createElement('input');
    this.jumpInput.type = 'text';
    this.jumpInput.className = 'da-memory-jump__input';
    this.jumpInput.placeholder = '0x00 or 0';
    this.jumpInput.setAttribute('aria-label', 'Memory address to jump to');
    jumpContainer.appendChild(this.jumpInput);

    this.jumpButton = document.createElement('button');
    this.jumpButton.type = 'button';
    this.jumpButton.className = 'da-memory-jump__button';
    this.jumpButton.textContent = 'Go';
    this.jumpButton.setAttribute('aria-label', 'Jump to address');
    jumpContainer.appendChild(this.jumpButton);

    this.jumpError = document.createElement('span');
    this.jumpError.className = 'da-memory-jump__error';
    this.jumpError.setAttribute('role', 'alert');
    this.jumpError.setAttribute('aria-live', 'polite');
    jumpContainer.appendChild(this.jumpError);

    this.element.appendChild(jumpContainer);

    // Setup jump listeners after creating elements
    this.setupJumpListeners();

    // Create scrollable container
    const scroll = document.createElement('div');
    scroll.className = 'da-memory-view__scroll';
    this.element.appendChild(scroll);

    // Create table container
    const table = document.createElement('div');
    table.className = 'da-memory-view__table';
    table.setAttribute('aria-live', 'polite');
    scroll.appendChild(table);

    // Create header row
    const headerRow = document.createElement('div');
    headerRow.className = 'da-memory-row da-memory-header';

    // Address header
    const addrHeader = document.createElement('span');
    addrHeader.className = 'da-memory-addr';
    addrHeader.textContent = 'Addr';
    headerRow.appendChild(addrHeader);

    // Column headers (0-F)
    for (let i = 0; i < this.bytesPerRow; i++) {
      const colHeader = document.createElement('span');
      colHeader.className = 'da-memory-hex';
      colHeader.textContent = i.toString(16).toUpperCase();
      headerRow.appendChild(colHeader);
    }

    table.appendChild(headerRow);

    // Calculate which row contains PC
    const pcRow = Math.floor(this.state.pc / this.bytesPerRow);
    const pcCol = this.state.pc % this.bytesPerRow;

    // Create data rows
    const numRows = Math.ceil(256 / this.bytesPerRow);
    for (let row = 0; row < numRows; row++) {
      const rowElement = document.createElement('div');
      rowElement.className = 'da-memory-row';
      const baseAddr = row * this.bytesPerRow;
      rowElement.setAttribute('data-address', baseAddr.toString());

      // Highlight row containing PC
      if (row === pcRow) {
        rowElement.classList.add('da-memory-pc');
      }

      // Address column
      const addrCell = document.createElement('span');
      addrCell.className = 'da-memory-addr';
      addrCell.textContent = '0x' + baseAddr.toString(16).toUpperCase().padStart(2, '0');
      rowElement.appendChild(addrCell);

      // Memory cells
      for (let col = 0; col < this.bytesPerRow; col++) {
        const addr = baseAddr + col;
        if (addr >= 256) break;

        const cell = document.createElement('span');
        cell.className = 'da-memory-cell';
        cell.setAttribute('data-offset', col.toString());

        // Get nibble value (0-15)
        const value = this.state.memory[addr] ?? 0;
        cell.textContent = value.toString(16).toUpperCase();

        // Highlight PC cell
        if (row === pcRow && col === pcCol) {
          cell.classList.add('da-memory-pc-cell');
        }

        // Check if cell changed (not on first render)
        if (this.previousState !== null) {
          const prevValue = this.previousState.memory[addr] ?? 0;
          if (prevValue !== value) {
            cell.classList.add('da-memory-changed');
          }
        }

        rowElement.appendChild(cell);
      }

      table.appendChild(rowElement);
    }
  }

  /**
   * Handle animationend event to remove flash class.
   * @param e - The animation event
   * @private
   */
  private handleAnimationEnd(e: AnimationEvent): void {
    const target = e.target as HTMLElement;
    if (target.classList.contains('da-memory-changed')) {
      target.classList.remove('da-memory-changed');
    }
  }

  /**
   * Validate address input and return result with error message (Story 5.6).
   * @param input - User input string
   * @returns Object with address (number or null) and error (string or null)
   * @private
   */
  private validateAddress(input: string): { address: number | null; error: string | null } {
    const trimmed = input.trim();
    if (!trimmed) {
      return { address: null, error: 'Invalid address' };
    }

    let value: number;

    // Hex format: 0x00 to 0xFF
    if (trimmed.toLowerCase().startsWith('0x')) {
      value = parseInt(trimmed.slice(2), 16);
    } else {
      value = parseInt(trimmed, 10);
    }

    // Check if parseable
    if (!Number.isFinite(value)) {
      return { address: null, error: 'Invalid address' };
    }

    // Validate range
    if (value < 0 || value > 255) {
      return { address: null, error: 'Address out of range (0-255)' };
    }

    return { address: Math.floor(value), error: null };
  }

  /**
   * Parse address input string to number (Story 5.6).
   * Supports hex (0x10, 0X10) and decimal (16) formats.
   * @param input - User input string
   * @returns Parsed address 0-255, or null if invalid
   */
  parseAddress(input: string): number | null {
    return this.validateAddress(input).address;
  }

  /**
   * Scroll the memory view to show the specified address (Story 5.6).
   * @param address - Memory address (0-255)
   * @private
   */
  private jumpToAddress(address: number): void {
    const rowAddress = Math.floor(address / this.bytesPerRow) * this.bytesPerRow;
    const scroll = this.element?.querySelector('.da-memory-view__scroll');
    const row = this.element?.querySelector(`[data-address="${rowAddress}"]`) as HTMLElement | null;

    if (row && scroll) {
      // scrollIntoView may not exist in JSDOM, check before calling
      if (typeof row.scrollIntoView === 'function') {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      // Clear any previous highlight and timeout
      if (this.jumpHighlightTimeout !== null) {
        clearTimeout(this.jumpHighlightTimeout);
        this.jumpHighlightTimeout = null;
      }
      const previousTarget = this.element?.querySelector('.da-memory-jump-target');
      if (previousTarget) {
        previousTarget.classList.remove('da-memory-jump-target');
      }

      // Highlight target row briefly
      row.classList.add('da-memory-jump-target');
      this.jumpHighlightTimeout = setTimeout(() => {
        row.classList.remove('da-memory-jump-target');
        this.jumpHighlightTimeout = null;
      }, 1000);
    }
  }

  /**
   * Show error message in jump UI (Story 5.6).
   * @param message - Error message to display, or empty to clear
   * @private
   */
  private showJumpError(message: string): void {
    if (this.jumpError) {
      this.jumpError.textContent = message;
    }
  }

  /**
   * Handle jump button click or Enter key (Story 5.6).
   * @private
   */
  private handleJump(): void {
    if (!this.jumpInput) return;

    const { address, error } = this.validateAddress(this.jumpInput.value);

    if (address === null) {
      this.showJumpError(error ?? 'Invalid address');
      return;
    }

    // Clear error and jump
    this.showJumpError('');
    this.jumpToAddress(address);
  }

  /**
   * Handle keydown event on jump input (Story 5.6).
   * @param e - Keyboard event
   * @private
   */
  private handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      this.handleJump();
    }
  }

  /**
   * Handle input change event to clear error (Story 5.6, Task 5.3).
   * @private
   */
  private handleInputChange(): void {
    // Clear error when user starts typing
    this.showJumpError('');
  }

  /**
   * Public API: Scroll to a specific address (Story 5.6).
   * Can be called by App.ts or other components.
   * @param address - Memory address (0-255), can be hex string or number
   * @returns true if jump successful, false if address invalid
   */
  scrollToAddress(address: number | string): boolean {
    const parsed = typeof address === 'string'
      ? this.parseAddress(address)
      : (Number.isFinite(address) && address >= 0 && address <= 255 ? Math.floor(address) : null);

    if (parsed === null) {
      return false;
    }

    this.jumpToAddress(parsed);
    return true;
  }

  /**
   * Clean up and remove the component from DOM.
   */
  destroy(): void {
    // Clear jump highlight timeout (Story 5.6)
    if (this.jumpHighlightTimeout !== null) {
      clearTimeout(this.jumpHighlightTimeout);
      this.jumpHighlightTimeout = null;
    }

    // Remove jump UI event listeners (Story 5.6)
    this.removeJumpListeners();

    // Remove animationend event listener
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
    this.jumpInput = null;
    this.jumpButton = null;
    this.jumpError = null;
  }
}
