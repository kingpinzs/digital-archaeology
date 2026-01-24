// src/visualizer/CircuitRenderer.ts
// Canvas circuit renderer component for visualizing CPU circuits (Story 6.1, 6.2, 6.3)

import type { CircuitData } from './types';
import { CircuitModel } from './CircuitModel';
import { CircuitLoader, CircuitLoadError } from './CircuitLoader';
import { GateRenderer } from './GateRenderer';
import { CircuitLayout } from './CircuitLayout';

/**
 * Default background color matching --da-bg-primary in Lab Mode.
 * Used as fallback when CSS variable is not available (e.g., in tests).
 * This constant mirrors the CSS variable to maintain single source of truth in CSS.
 */
const DEFAULT_BG_PRIMARY = '#1a1a2e';

/**
 * Options for CircuitRenderer component.
 */
export interface CircuitRendererOptions {
  /** Optional callback when render completes */
  onRenderComplete?: () => void;
}

/**
 * State interface for CircuitRenderer component.
 * Contains circuit data and animation state.
 */
export interface CircuitRendererState {
  /** Whether the renderer is currently animating */
  isAnimating?: boolean;
  /** Circuit data to render (Story 6.2) */
  circuitData?: CircuitData;
}

/**
 * CircuitRenderer component displays the CPU circuit diagram on a canvas.
 * Provides responsive sizing with HiDPI support and theme-matching background.
 *
 * This is the foundation for circuit visualization (Epic 6).
 * Future stories will add gate rendering, wire rendering, and animation.
 */
export class CircuitRenderer {
  private container: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private options: CircuitRendererOptions;

  // Display and internal dimensions
  private displayWidth: number = 0;
  private displayHeight: number = 0;
  private devicePixelRatio: number = 1;

  // Circuit data (Story 6.2)
  private circuitModel: CircuitModel | null = null;
  private loader: CircuitLoader | null = null;

  // Gate rendering (Story 6.3)
  private gateRenderer: GateRenderer | null = null;
  private layout: CircuitLayout | null = null;

  // Layout cache tracking - only recalculate when needed
  private lastLayoutWidth: number = 0;
  private lastLayoutHeight: number = 0;
  private lastLayoutModelId: number = 0; // Tracks which circuit model was used

  // Bound event handler for cleanup
  private boundHandleResize: (entries: ResizeObserverEntry[]) => void;

  /**
   * Create a new CircuitRenderer component.
   * @param options - Optional configuration
   */
  constructor(options?: CircuitRendererOptions) {
    this.options = options ?? {};
    this.boundHandleResize = this.handleResize.bind(this);
  }

  /**
   * Mount the component to a container element.
   * Creates the canvas and sets up resize handling.
   * @param container - The HTML element to mount into
   * @throws Error if already mounted (call destroy() first)
   */
  mount(container: HTMLElement): void {
    // Prevent double-mount - caller must destroy() first
    if (this.canvas) {
      throw new Error('CircuitRenderer is already mounted. Call destroy() before remounting.');
    }

    this.container = container;

    // Create canvas element
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'da-circuit-canvas';

    // Add accessibility attributes
    this.canvas.setAttribute('role', 'img');
    this.canvas.setAttribute('aria-label', 'CPU circuit diagram');

    // Get 2D rendering context
    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) {
      throw new Error('Failed to get 2D canvas context');
    }

    // Append canvas to container
    this.container.appendChild(this.canvas);

    // Set up resize observer
    this.resizeObserver = new ResizeObserver(this.boundHandleResize);
    this.resizeObserver.observe(this.container);

    // Initial sizing based on container
    const rect = this.container.getBoundingClientRect();
    this.updateDimensions(rect.width, rect.height);

    // Initial render
    this.render();
  }

  /**
   * Handle resize events from ResizeObserver.
   * @param entries - Resize observer entries
   * @private
   */
  private handleResize(entries: ResizeObserverEntry[]): void {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      this.updateDimensions(width, height);
      this.render();
    }
  }

  /**
   * Update canvas dimensions for display and internal rendering.
   * Handles HiDPI displays by scaling the internal canvas size.
   * @param width - Display width in CSS pixels
   * @param height - Display height in CSS pixels
   * @private
   */
  private updateDimensions(width: number, height: number): void {
    if (!this.canvas || !this.ctx) return;

    // Store display dimensions
    this.displayWidth = width;
    this.displayHeight = height;

    // Get device pixel ratio for HiDPI support
    this.devicePixelRatio = window.devicePixelRatio || 1;

    // Set internal canvas size (scaled for HiDPI)
    this.canvas.width = width * this.devicePixelRatio;
    this.canvas.height = height * this.devicePixelRatio;

    // Set display size via CSS
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    // Scale context to match device pixel ratio
    this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    this.ctx.scale(this.devicePixelRatio, this.devicePixelRatio);
  }

  /**
   * Get the theme background color from CSS custom properties.
   * Falls back to DEFAULT_BG_PRIMARY if variable is unavailable.
   * @returns The background color string
   * @private
   */
  private getThemeBackground(): string {
    const style = getComputedStyle(document.documentElement);
    const bgColor = style.getPropertyValue('--da-bg-primary').trim();
    return bgColor || DEFAULT_BG_PRIMARY;
  }

  /**
   * Render the canvas with theme background and circuit elements.
   * This is the main render method that clears the canvas and draws all elements.
   */
  render(): void {
    if (!this.ctx || !this.canvas) return;

    // Clear canvas with theme background
    const bgColor = this.getThemeBackground();
    this.ctx.fillStyle = bgColor;
    this.ctx.fillRect(0, 0, this.displayWidth, this.displayHeight);

    // Render gates if circuit data is loaded (Story 6.3)
    this.renderGates();

    // Call render complete callback if provided
    this.options.onRenderComplete?.();
  }

  /**
   * Render all gates in the circuit.
   * Gates are positioned by CircuitLayout and drawn by GateRenderer.
   * Layout is cached and only recalculated when circuit data or dimensions change.
   * @private
   */
  private renderGates(): void {
    if (!this.ctx || !this.circuitModel) return;

    // Lazily create gate renderer and layout on first use
    if (!this.gateRenderer) {
      this.gateRenderer = new GateRenderer();
    }
    if (!this.layout) {
      this.layout = new CircuitLayout();
    }

    // Only recalculate layout when circuit or dimensions change
    const needsLayoutRecalc =
      this.displayWidth !== this.lastLayoutWidth ||
      this.displayHeight !== this.lastLayoutHeight ||
      this.lastLayoutModelId !== this.circuitModel.gates.size; // Simple identity check

    if (needsLayoutRecalc && this.displayWidth > 0 && this.displayHeight > 0) {
      this.layout.calculate(this.circuitModel, this.displayWidth, this.displayHeight);
      this.lastLayoutWidth = this.displayWidth;
      this.lastLayoutHeight = this.displayHeight;
      this.lastLayoutModelId = this.circuitModel.gates.size;
    }

    // Get gate dimensions from layout config
    const layoutConfig = this.layout.getConfig();

    // Render each gate at its calculated position
    for (const gate of this.circuitModel.gates.values()) {
      const position = this.layout.getPosition(gate.id);
      if (position) {
        this.gateRenderer.renderGate(
          this.ctx,
          gate,
          position.x,
          position.y,
          layoutConfig.gateWidth,
          layoutConfig.gateHeight
        );
      }
    }
  }

  /**
   * Update the component state.
   * Follows the mount/updateState/destroy lifecycle pattern.
   * Handles circuit data and animation state.
   * @param state - The new state
   */
  updateState(state: CircuitRendererState): void {
    // Update circuit model if circuit data is provided
    if (state.circuitData) {
      this.circuitModel = new CircuitModel(state.circuitData);
      // Invalidate layout cache when circuit data changes
      this.lastLayoutModelId = 0;
    }

    // Re-render with updated state
    this.render();
  }

  /**
   * Load circuit data from a JSON file.
   * Convenience method that loads and sets circuit data.
   * @param path - Path to the circuit JSON file
   * @returns Promise resolving when circuit is loaded
   * @throws CircuitLoadError on load failure
   */
  async loadCircuit(path: string): Promise<void> {
    // Lazily create loader on first use
    if (!this.loader) {
      this.loader = new CircuitLoader();
    }
    const data = await this.loader.loadCircuit(path);
    this.updateState({ circuitData: data });
  }

  /**
   * Get the current circuit model.
   * @returns The CircuitModel or null if no circuit loaded
   */
  getCircuitModel(): CircuitModel | null {
    return this.circuitModel;
  }

  /**
   * Get the canvas element.
   * @returns The canvas element or null if not mounted
   */
  getCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }

  /**
   * Get the 2D rendering context.
   * @returns The canvas 2D context or null if not mounted
   */
  getContext(): CanvasRenderingContext2D | null {
    return this.ctx;
  }

  /**
   * Get the current display dimensions.
   * @returns Object with width and height in CSS pixels
   */
  getDimensions(): { width: number; height: number } {
    return {
      width: this.displayWidth,
      height: this.displayHeight,
    };
  }

  /**
   * Get the device pixel ratio being used.
   * @returns The device pixel ratio
   */
  getDevicePixelRatio(): number {
    return this.devicePixelRatio;
  }

  /**
   * Destroy the component and clean up resources.
   * Removes the canvas and disconnects the resize observer.
   */
  destroy(): void {
    // Disconnect resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Remove canvas from DOM
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }

    // Clear references
    this.canvas = null;
    this.ctx = null;
    this.container = null;
    this.circuitModel = null;
    this.loader = null;

    // Clean up gate rendering (Story 6.3)
    this.gateRenderer = null;
    if (this.layout) {
      this.layout.clear();
      this.layout = null;
    }
  }
}

// Re-export CircuitLoadError for convenience
export { CircuitLoadError };
