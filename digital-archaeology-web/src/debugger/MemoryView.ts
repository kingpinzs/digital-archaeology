// src/debugger/MemoryView.ts
// MemoryView component for displaying CPU memory contents (Story 5.5)

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
 */
export class MemoryView {
  private container: HTMLElement | null = null;
  private element: HTMLElement | null = null;
  private state: MemoryViewState = { memory: new Uint8Array(256), pc: 0 };
  private previousState: MemoryViewState | null = null;
  private isFirstRender: boolean = true;
  private bytesPerRow: number;

  // Bound event handlers for cleanup
  private boundAnimationEndHandler: (e: Event) => void;

  /**
   * Create a new MemoryView component.
   * @param options - Optional configuration
   */
  constructor(options?: MemoryViewOptions) {
    this.bytesPerRow = options?.bytesPerRow ?? 16;
    // Note: onAddressClick will be used in Story 5.6 (Jump to Address)
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
    this.element.className = 'da-memory-view';

    // Add animationend listener to the element
    this.element.addEventListener('animationend', this.boundAnimationEndHandler);

    this.render();
    this.container.appendChild(this.element);
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

    // Clear existing content
    this.element.textContent = '';

    // Create title
    const title = document.createElement('h3');
    title.className = 'da-memory-view__title';
    title.textContent = 'Memory';
    this.element.appendChild(title);

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
