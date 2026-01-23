// src/ui/BinaryOutputPanel.ts
// Binary output panel component for displaying assembled binary as hex dump

/**
 * Configuration options for the BinaryOutputPanel component.
 */
export interface BinaryOutputPanelOptions {
  /** Callback when panel visibility is toggled */
  onToggle?: (visible: boolean) => void;
}

/**
 * BinaryOutputPanel displays assembled binary data as a hex dump.
 * Shows 16 bytes per row with address prefixes (0x0000:, 0x0010:, etc.).
 * Supports toggle visibility and scrollable content for large programs.
 */
export class BinaryOutputPanel {
  private element: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private contentElement: HTMLElement | null = null;
  private visible: boolean = false;
  private binary: Uint8Array | null = null;
  private options: BinaryOutputPanelOptions;

  /** Number of bytes to display per row */
  private static readonly BYTES_PER_ROW = 16;

  constructor(options?: BinaryOutputPanelOptions) {
    this.options = options ?? {};
  }

  /**
   * Mount the binary output panel to a container element.
   * @param container - The HTML element to mount to
   */
  mount(container: HTMLElement): void {
    this.container = container;
    this.element = this.render();
    this.container.appendChild(this.element);
    this.cacheElements();
    this.updateVisibility();
  }

  /**
   * Set the binary data to display.
   * @param data - The binary data as Uint8Array, or null to clear
   */
  setBinary(data: Uint8Array | null): void {
    this.binary = data;
    this.updateContent();
  }

  /**
   * Toggle the panel visibility.
   */
  toggle(): void {
    this.visible = !this.visible;
    this.updateVisibility();
    this.options.onToggle?.(this.visible);
  }

  /**
   * Show the panel.
   */
  show(): void {
    if (!this.visible) {
      this.visible = true;
      this.updateVisibility();
      this.options.onToggle?.(this.visible);
    }
  }

  /**
   * Hide the panel.
   */
  hide(): void {
    if (this.visible) {
      this.visible = false;
      this.updateVisibility();
      this.options.onToggle?.(this.visible);
    }
  }

  /**
   * Check if the panel is currently visible.
   * @returns true if visible, false otherwise
   */
  isVisible(): boolean {
    return this.visible;
  }

  /**
   * Destroy the component and clean up resources.
   */
  destroy(): void {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    this.contentElement = null;
    this.container = null;
    this.binary = null;
    this.visible = false;
  }

  /**
   * Render the binary output panel HTML structure.
   */
  private render(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'da-binary-panel da-binary-panel--hidden';
    panel.setAttribute('aria-label', 'Binary Output');
    panel.setAttribute('aria-expanded', 'false');

    // Scrollable content container
    const content = document.createElement('div');
    content.className = 'da-binary-content';
    panel.appendChild(content);

    return panel;
  }

  /**
   * Cache element references.
   */
  private cacheElements(): void {
    if (!this.element) return;
    this.contentElement = this.element.querySelector('.da-binary-content');
  }

  /**
   * Update visibility based on current state.
   */
  private updateVisibility(): void {
    if (!this.element) return;

    if (this.visible) {
      this.element.classList.remove('da-binary-panel--hidden');
      this.element.setAttribute('aria-expanded', 'true');
    } else {
      this.element.classList.add('da-binary-panel--hidden');
      this.element.setAttribute('aria-expanded', 'false');
    }
  }

  /**
   * Update the content based on current binary data.
   */
  private updateContent(): void {
    if (!this.contentElement) return;

    // Clear existing content
    while (this.contentElement.firstChild) {
      this.contentElement.removeChild(this.contentElement.firstChild);
    }

    // If no binary or empty, show nothing
    if (!this.binary || this.binary.length === 0) {
      return;
    }

    // Render rows of 16 bytes each
    const numRows = Math.ceil(this.binary.length / BinaryOutputPanel.BYTES_PER_ROW);

    for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
      const row = this.createRow(rowIndex);
      this.contentElement.appendChild(row);
    }
  }

  /**
   * Create a single row element for the hex dump.
   * @param rowIndex - The index of the row (0, 1, 2, ...)
   */
  private createRow(rowIndex: number): HTMLElement {
    const row = document.createElement('div');
    row.className = 'da-binary-row';

    // Address prefix (0x0000:, 0x0010:, 0x0020:, ...)
    const address = document.createElement('span');
    address.className = 'da-binary-address';
    const addressValue = rowIndex * BinaryOutputPanel.BYTES_PER_ROW;
    address.textContent = `0x${addressValue.toString(16).toUpperCase().padStart(4, '0')}:`;
    row.appendChild(address);

    // Bytes container
    const bytes = document.createElement('span');
    bytes.className = 'da-binary-bytes';

    // Calculate byte range for this row
    const startIndex = rowIndex * BinaryOutputPanel.BYTES_PER_ROW;
    const endIndex = Math.min(startIndex + BinaryOutputPanel.BYTES_PER_ROW, this.binary!.length);

    // Render bytes
    const byteStrings: string[] = [];
    for (let i = startIndex; i < endIndex; i++) {
      const byteValue = this.binary![i];
      byteStrings.push(byteValue.toString(16).toUpperCase().padStart(2, '0'));
    }
    bytes.textContent = byteStrings.join(' ');

    row.appendChild(bytes);

    return row;
  }
}
