// src/ui/PanelResizer.ts
// Reusable resize handle component for panel resizing

/** Panel width constraints in pixels */
export const PANEL_CONSTRAINTS = {
  CODE_MIN: 250,
  CODE_DEFAULT: 350,
  CIRCUIT_MIN: 400,
  STATE_MIN: 200,
  STATE_DEFAULT: 280,
} as const;

/** Keyboard resize step size in pixels */
const KEYBOARD_STEP = 10;
const KEYBOARD_LARGE_STEP = 50;

/** Configuration options for PanelResizer */
export interface PanelResizerOptions {
  /** Which panel this resizer controls */
  panel: 'code' | 'state';
  /** Callback when resize occurs with new width in pixels */
  onResize: (newWidth: number) => void;
  /** Function to get current width of this panel */
  getCurrentWidth: () => number;
  /** Function to get current width of the other side panel */
  getOtherPanelWidth: () => number;
}

/**
 * Resize handle component for adjusting panel widths.
 * Handles mouse events, enforces constraints, and provides visual feedback.
 */
export class PanelResizer {
  private element: HTMLElement | null = null;
  private isDragging: boolean = false;
  private startX: number = 0;
  private startWidth: number = 0;
  private options: PanelResizerOptions;

  // Bound event handlers for cleanup
  private boundMouseDown: (e: MouseEvent) => void;
  private boundMouseMove: (e: MouseEvent) => void;
  private boundMouseUp: () => void;
  private boundKeyDown: (e: KeyboardEvent) => void;

  constructor(options: PanelResizerOptions) {
    this.options = options;
    this.boundMouseDown = this.handleMouseDown.bind(this);
    this.boundMouseMove = this.handleMouseMove.bind(this);
    this.boundMouseUp = this.handleMouseUp.bind(this);
    this.boundKeyDown = this.handleKeyDown.bind(this);
  }

  /**
   * Mount the resize handle to a container element.
   * @param container - The panel element to attach the resizer to
   * @returns void
   */
  mount(container: HTMLElement): void {
    // Create resize handle element
    this.element = document.createElement('div');
    this.element.className = `da-resizer da-resizer--${this.options.panel === 'code' ? 'right' : 'left'}`;
    this.element.setAttribute('role', 'separator');
    this.element.setAttribute('aria-orientation', 'vertical');
    this.element.setAttribute('aria-label', `Resize ${this.options.panel} panel`);
    this.element.setAttribute('tabindex', '0');

    // Set ARIA value attributes for screen readers
    this.updateAriaValues();

    container.appendChild(this.element);
    this.attachEventListeners();
  }

  /**
   * Attach event listeners to the resize handle.
   * @returns void
   */
  private attachEventListeners(): void {
    if (!this.element) return;
    this.element.addEventListener('mousedown', this.boundMouseDown);
    this.element.addEventListener('keydown', this.boundKeyDown);
  }

  /**
   * Handle mousedown - start drag operation.
   * @param e - Mouse event
   * @returns void
   */
  private handleMouseDown(e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();

    this.isDragging = true;
    this.startX = e.clientX;
    this.startWidth = this.options.getCurrentWidth();

    // Add visual feedback
    document.body.classList.add('da-resizing');
    this.element?.classList.add('da-resizer--active');

    // Attach document-level listeners for drag
    document.addEventListener('mousemove', this.boundMouseMove);
    document.addEventListener('mouseup', this.boundMouseUp);
  }

  /**
   * Handle mousemove - update panel width during drag.
   * @param e - Mouse event
   * @returns void
   */
  private handleMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;

    const delta = e.clientX - this.startX;

    // Calculate new width based on which panel we're resizing
    // Code panel: dragging right increases width
    // State panel: dragging left increases width (delta is inverted)
    const newWidth = this.options.panel === 'code'
      ? this.startWidth + delta
      : this.startWidth - delta;

    // Apply constraints
    const constrainedWidth = this.constrainWidth(newWidth);

    // Notify callback and update ARIA values
    this.options.onResize(constrainedWidth);
    this.updateAriaValues();
  }

  /**
   * Handle mouseup - end drag operation.
   * @returns void
   */
  private handleMouseUp(): void {
    if (!this.isDragging) return;

    this.isDragging = false;

    // Remove visual feedback
    document.body.classList.remove('da-resizing');
    this.element?.classList.remove('da-resizer--active');

    // Remove document-level listeners
    document.removeEventListener('mousemove', this.boundMouseMove);
    document.removeEventListener('mouseup', this.boundMouseUp);
  }

  /**
   * Handle keyboard events for accessibility.
   * Arrow keys resize the panel, Shift+Arrow for larger steps.
   * @param e - Keyboard event
   * @returns void
   */
  private handleKeyDown(e: KeyboardEvent): void {
    const step = e.shiftKey ? KEYBOARD_LARGE_STEP : KEYBOARD_STEP;
    let delta = 0;

    switch (e.key) {
      case 'ArrowLeft':
        delta = this.options.panel === 'code' ? -step : step;
        break;
      case 'ArrowRight':
        delta = this.options.panel === 'code' ? step : -step;
        break;
      case 'Home':
        // Set to minimum width
        const minWidth = this.options.panel === 'code'
          ? PANEL_CONSTRAINTS.CODE_MIN
          : PANEL_CONSTRAINTS.STATE_MIN;
        this.options.onResize(minWidth);
        this.updateAriaValues();
        e.preventDefault();
        return;
      case 'End':
        // Set to maximum width
        const maxWidth = this.getMaxWidth();
        this.options.onResize(maxWidth);
        this.updateAriaValues();
        e.preventDefault();
        return;
      default:
        return; // Don't handle other keys
    }

    e.preventDefault();
    const currentWidth = this.options.getCurrentWidth();
    const newWidth = this.constrainWidth(currentWidth + delta);
    this.options.onResize(newWidth);
    this.updateAriaValues();
  }

  /**
   * Get maximum width for this panel.
   * @returns Maximum width in pixels
   */
  private getMaxWidth(): number {
    const viewportWidth = window.innerWidth;
    const otherPanelWidth = this.options.getOtherPanelWidth();
    return viewportWidth - PANEL_CONSTRAINTS.CIRCUIT_MIN - otherPanelWidth;
  }

  /**
   * Update ARIA value attributes for screen readers.
   * @returns void
   */
  private updateAriaValues(): void {
    if (!this.element) return;

    const currentWidth = this.options.getCurrentWidth();
    const minWidth = this.options.panel === 'code'
      ? PANEL_CONSTRAINTS.CODE_MIN
      : PANEL_CONSTRAINTS.STATE_MIN;
    const maxWidth = this.getMaxWidth();

    this.element.setAttribute('aria-valuenow', String(currentWidth));
    this.element.setAttribute('aria-valuemin', String(minWidth));
    this.element.setAttribute('aria-valuemax', String(maxWidth));
  }

  /**
   * Constrain width to valid range based on panel minimums.
   * @param width - Proposed width in pixels
   * @returns Constrained width in pixels
   */
  private constrainWidth(width: number): number {
    // Get minimum for this panel
    const minWidth = this.options.panel === 'code'
      ? PANEL_CONSTRAINTS.CODE_MIN
      : PANEL_CONSTRAINTS.STATE_MIN;

    // Calculate maximum width leaving room for circuit panel minimum and other panel
    const maxWidth = this.getMaxWidth();

    return Math.max(minWidth, Math.min(width, maxWidth));
  }

  /**
   * Check if currently dragging.
   * @returns true if drag is in progress
   */
  isDraggingActive(): boolean {
    return this.isDragging;
  }

  /**
   * Get the resize handle element.
   * @returns The DOM element or null if not mounted
   */
  getElement(): HTMLElement | null {
    return this.element;
  }

  /**
   * Destroy and clean up resources.
   * @returns void
   */
  destroy(): void {
    // End any active drag
    if (this.isDragging) {
      this.handleMouseUp();
    }

    // Remove element event listeners
    if (this.element) {
      this.element.removeEventListener('mousedown', this.boundMouseDown);
      this.element.removeEventListener('keydown', this.boundKeyDown);
      this.element.remove();
      this.element = null;
    }
  }
}
