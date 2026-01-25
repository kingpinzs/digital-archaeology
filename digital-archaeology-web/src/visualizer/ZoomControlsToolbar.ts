// src/visualizer/ZoomControlsToolbar.ts
// Zoom controls UI component for circuit visualization (Story 6.6)

/**
 * Callback functions for zoom control actions.
 */
export interface ZoomControlsCallbacks {
  /** Called when zoom in button is clicked */
  onZoomIn: () => void;
  /** Called when zoom out button is clicked */
  onZoomOut: () => void;
  /** Called when fit-to-view button is clicked */
  onZoomFit: () => void;
  /** Called when reset zoom button is clicked */
  onZoomReset: () => void;
}

/**
 * State for zoom controls display.
 */
export interface ZoomControlsState {
  /** Current zoom level as formatted percentage (e.g., "100%") */
  zoomPercent: string;
}

/**
 * ZoomControlsToolbar provides UI controls for zooming the circuit visualization.
 * Follows the mount/updateState/destroy lifecycle pattern.
 */
export class ZoomControlsToolbar {
  private callbacks: ZoomControlsCallbacks;
  private element: HTMLDivElement | null = null;
  private zoomLevelDisplay: HTMLSpanElement | null = null;

  /**
   * Create a new ZoomControlsToolbar.
   * @param callbacks - Callback functions for zoom actions
   */
  constructor(callbacks: ZoomControlsCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Mount the toolbar to a container element.
   * Creates the UI and attaches event listeners.
   * @param container - The HTML element to mount into
   * @throws Error if already mounted
   */
  mount(container: HTMLElement): void {
    if (this.element) {
      throw new Error('ZoomControlsToolbar is already mounted. Call destroy() before remounting.');
    }

    // Create container
    this.element = document.createElement('div');
    this.element.className = 'da-zoom-controls';
    this.element.setAttribute('role', 'group');
    this.element.setAttribute('aria-label', 'Zoom controls');

    // Create zoom out button
    const zoomOutBtn = this.createButton('-', 'zoom-out', 'Zoom out', 'Zoom out (-)');
    zoomOutBtn.addEventListener('click', () => this.callbacks.onZoomOut());
    this.element.appendChild(zoomOutBtn);

    // Create zoom level display
    this.zoomLevelDisplay = document.createElement('span');
    this.zoomLevelDisplay.className = 'da-zoom-level';
    this.zoomLevelDisplay.setAttribute('aria-live', 'polite');
    this.zoomLevelDisplay.textContent = '100%';
    this.element.appendChild(this.zoomLevelDisplay);

    // Create zoom in button
    const zoomInBtn = this.createButton('+', 'zoom-in', 'Zoom in', 'Zoom in (+)');
    zoomInBtn.addEventListener('click', () => this.callbacks.onZoomIn());
    this.element.appendChild(zoomInBtn);

    // Create fit button
    const fitBtn = this.createButton('Fit', 'fit', 'Fit to view', 'Fit to view');
    fitBtn.addEventListener('click', () => this.callbacks.onZoomFit());
    this.element.appendChild(fitBtn);

    // Create reset button
    const resetBtn = this.createButton('100%', 'reset', 'Reset zoom', 'Reset to 100%');
    resetBtn.addEventListener('click', () => this.callbacks.onZoomReset());
    this.element.appendChild(resetBtn);

    // Append to container
    container.appendChild(this.element);
  }

  /**
   * Create a zoom control button.
   * @param text - Button text content
   * @param action - Data-action attribute value
   * @param ariaLabel - Accessibility label
   * @param title - Tooltip title
   * @returns The created button element
   * @private
   */
  private createButton(
    text: string,
    action: string,
    ariaLabel: string,
    title: string
  ): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'da-zoom-btn';
    btn.setAttribute('data-action', action);
    btn.setAttribute('aria-label', ariaLabel);
    btn.setAttribute('title', title);
    btn.textContent = text;
    return btn;
  }

  /**
   * Update the state of the controls.
   * @param state - New state with zoom percentage
   */
  updateState(state: ZoomControlsState): void {
    if (this.zoomLevelDisplay) {
      this.zoomLevelDisplay.textContent = state.zoomPercent;
    }
  }

  /**
   * Get the root element of the toolbar.
   * @returns The controls element or null if not mounted
   */
  getElement(): HTMLDivElement | null {
    return this.element;
  }

  /**
   * Destroy the toolbar and clean up resources.
   * Removes the element from DOM and clears references.
   */
  destroy(): void {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
    this.zoomLevelDisplay = null;
  }
}
