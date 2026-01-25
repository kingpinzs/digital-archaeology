// src/visualizer/CircuitRenderer.ts
// Canvas circuit renderer component for visualizing CPU circuits (Story 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8)

import type { CircuitData, CircuitGate } from './types';
import { CircuitModel } from './CircuitModel';
import { CircuitLoader, CircuitLoadError } from './CircuitLoader';
import { GateRenderer } from './GateRenderer';
import { CircuitLayout } from './CircuitLayout';
import { WireRenderer } from './WireRenderer';
import { AnimationController } from './AnimationController';
import { SignalAnimator } from './SignalAnimator';
import { calculatePulseScale, prefersReducedMotion } from './animationUtils';
import { ZoomController } from './ZoomController';
import type { ZoomChangeCallback } from './ZoomController';
import { GateTooltip } from './GateTooltip';

/**
 * Default background color matching --da-bg-primary in Lab Mode.
 * Used as fallback when CSS variable is not available (e.g., in tests).
 * This constant mirrors the CSS variable to maintain single source of truth in CSS.
 */
const DEFAULT_BG_PRIMARY = '#1a1a2e';

/**
 * Animation configuration for CircuitRenderer.
 */
export interface AnimationOptions {
  /** Animation duration in milliseconds (default: 500) */
  animationDuration?: number;
  /** Target frames per second (default: 30) */
  targetFps?: number;
  /** Enable gate pulse effect (default: true) */
  enableGatePulse?: boolean;
  /** Enable animation (false for immediate updates, default: true) */
  enableAnimation?: boolean;
}

/**
 * Zoom configuration for CircuitRenderer (Story 6.6).
 */
export interface ZoomOptions {
  /** Initial zoom scale (default: 1.0) */
  initialScale?: number;
  /** Minimum zoom scale (default: 0.25) */
  min?: number;
  /** Maximum zoom scale (default: 4.0) */
  max?: number;
  /** Zoom step increment (default: 0.1) */
  step?: number;
  /** Enable mouse wheel zoom (default: true) */
  wheelZoomEnabled?: boolean;
  /** Callback when zoom changes */
  onZoomChange?: ZoomChangeCallback;
}

/**
 * Options for CircuitRenderer component.
 */
export interface CircuitRendererOptions {
  /** Optional callback when render completes */
  onRenderComplete?: () => void;
  /** Animation configuration (Story 6.5) */
  animation?: AnimationOptions;
  /** Zoom configuration (Story 6.6) */
  zoom?: ZoomOptions;
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

  // Wire rendering (Story 6.4)
  private wireRenderer: WireRenderer | null = null;

  // Animation (Story 6.5)
  private animationController: AnimationController | null = null;
  private signalAnimator: SignalAnimator | null = null;
  private animationProgress: number = 1.0; // 1.0 = no animation in progress
  private changedGates: Set<number> = new Set();
  private interpolatedWireStates: Map<number, number[]> | null = null;

  // Zoom (Story 6.6)
  private zoomController: ZoomController;
  private boundWheelHandler: ((e: WheelEvent) => void) | null = null;

  // Pan navigation (Story 6.7)
  private isDragging: boolean = false;
  private lastDragX: number = 0;
  private lastDragY: number = 0;
  private boundMouseDownHandler: ((e: MouseEvent) => void) | null = null;
  private boundMouseMoveHandler: ((e: MouseEvent) => void) | null = null;
  private boundMouseUpHandler: ((e: MouseEvent) => void) | null = null;

  // Tooltip and hover detection (Story 6.8)
  private tooltip: GateTooltip | null = null;
  private hoveredGateId: number | null = null;
  private boundMouseMoveHoverHandler: ((e: MouseEvent) => void) | null = null;
  private boundMouseLeaveHandler: ((e: MouseEvent) => void) | null = null;

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

    // Initialize zoom controller with options (Story 6.6)
    // Only pass defined values to avoid overwriting defaults with undefined
    const zoomOpts = this.options.zoom;
    const zoomConfig: Partial<{ min: number; max: number; step: number }> = {};
    if (zoomOpts?.min !== undefined) zoomConfig.min = zoomOpts.min;
    if (zoomOpts?.max !== undefined) zoomConfig.max = zoomOpts.max;
    if (zoomOpts?.step !== undefined) zoomConfig.step = zoomOpts.step;
    this.zoomController = new ZoomController(zoomConfig);

    // Set initial scale if provided
    if (zoomOpts?.initialScale !== undefined) {
      this.zoomController.setScale(zoomOpts.initialScale);
    }

    // Set up zoom change callback
    if (zoomOpts?.onZoomChange) {
      this.zoomController.setOnChange(zoomOpts.onZoomChange);
    }
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

    // Set up wheel zoom handler (Story 6.6)
    this.setupWheelZoom();

    // Set up pan handlers (Story 6.7)
    this.setupPanHandlers();

    // Set up tooltip and hover handlers (Story 6.8)
    this.setupTooltip();
    this.setupHoverHandlers();

    // Update viewport size for pan bounds (Story 6.7)
    this.zoomController.setViewportSize(this.displayWidth, this.displayHeight);

    // Initial render
    this.render();
  }

  /**
   * Set up mouse wheel zoom handler.
   * @private
   */
  private setupWheelZoom(): void {
    if (!this.canvas) return;

    // Check if wheel zoom is enabled (default: true)
    const wheelZoomEnabled = this.options.zoom?.wheelZoomEnabled !== false;

    this.boundWheelHandler = (e: WheelEvent) => {
      // Skip if wheel zoom is disabled
      if (!wheelZoomEnabled) return;

      e.preventDefault();

      // Determine zoom direction (negative deltaY = zoom in)
      const zoomIn = e.deltaY < 0;

      // Get cursor position relative to canvas
      const x = e.offsetX;
      const y = e.offsetY;

      // Zoom at cursor position
      this.zoomController.zoomAtPoint(x, y, zoomIn);

      // Re-render with new zoom
      this.render();
    };

    // Use passive: false to allow preventDefault
    this.canvas.addEventListener('wheel', this.boundWheelHandler, { passive: false });
  }

  /**
   * Set up mouse drag pan handlers (Story 6.7).
   * Handlers are bound here and stored as class properties to ensure the same
   * reference is used for both addEventListener and removeEventListener.
   * @private
   */
  private setupPanHandlers(): void {
    if (!this.canvas) return;

    // Bind handlers once and store references for cleanup in destroy()
    this.boundMouseDownHandler = this.handleMouseDown.bind(this);
    this.boundMouseMoveHandler = this.handleMouseMove.bind(this);
    this.boundMouseUpHandler = this.handleMouseUp.bind(this);

    this.canvas.addEventListener('mousedown', this.boundMouseDownHandler);
    document.addEventListener('mousemove', this.boundMouseMoveHandler);
    document.addEventListener('mouseup', this.boundMouseUpHandler);
  }

  /**
   * Handle mouse down event for pan start (Story 6.7).
   * @private
   */
  private handleMouseDown(e: MouseEvent): void {
    // Only handle left mouse button
    if (e.button !== 0) return;

    // Only allow panning when panning is allowed
    if (!this.zoomController.isPanningAllowed()) return;

    this.isDragging = true;
    this.lastDragX = e.clientX;
    this.lastDragY = e.clientY;

    // Update cursor state
    this.updatePanCursor();

    e.preventDefault();
  }

  /**
   * Handle mouse move event for panning (Story 6.7).
   * @private
   */
  private handleMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;

    const deltaX = e.clientX - this.lastDragX;
    const deltaY = e.clientY - this.lastDragY;

    this.zoomController.pan(deltaX, deltaY);

    this.lastDragX = e.clientX;
    this.lastDragY = e.clientY;

    this.render();
  }

  /**
   * Handle mouse up event for pan end (Story 6.7).
   * @private
   */
  private handleMouseUp(_e: MouseEvent): void {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.updatePanCursor();
  }

  /**
   * Update cursor state based on pan availability (Story 6.7).
   * Sets data-pan attribute on canvas for CSS cursor styling:
   * - 'allowed': Shows grab cursor when pan is available
   * - 'active': Shows grabbing cursor during drag
   * - removed: Default cursor when pan is not available
   * @private
   */
  private updatePanCursor(): void {
    if (!this.canvas) return;

    if (this.isDragging) {
      this.canvas.dataset.pan = 'active';
    } else if (this.zoomController.isPanningAllowed()) {
      this.canvas.dataset.pan = 'allowed';
    } else {
      delete this.canvas.dataset.pan;
    }
  }

  // ============================================================================
  // Tooltip and Hover Detection (Story 6.8)
  // ============================================================================

  /**
   * Set up the tooltip component (Story 6.8).
   * @private
   */
  private setupTooltip(): void {
    if (!this.container) return;

    this.tooltip = new GateTooltip();
    this.tooltip.mount(this.container);
  }

  /**
   * Set up hover detection handlers (Story 6.8).
   * @private
   */
  private setupHoverHandlers(): void {
    if (!this.canvas) return;

    // Bind handlers once and store references for cleanup in destroy()
    this.boundMouseMoveHoverHandler = this.handleMouseMoveHover.bind(this);
    this.boundMouseLeaveHandler = this.handleMouseLeave.bind(this);

    this.canvas.addEventListener('mousemove', this.boundMouseMoveHoverHandler);
    this.canvas.addEventListener('mouseleave', this.boundMouseLeaveHandler);
  }

  /**
   * Handle mouse move for hover detection (Story 6.8).
   * Detects when mouse hovers over gates and shows/hides tooltip.
   * Skipped during drag operations to avoid interfering with pan.
   * @private
   */
  private handleMouseMoveHover(e: MouseEvent): void {
    // Don't process hover during drag
    if (this.isDragging) return;

    // Convert screen to canvas coordinates
    const canvasCoords = this.screenToCanvas(e.clientX, e.clientY);

    // Hit test against gates
    const gate = this.hitTestGate(canvasCoords.x, canvasCoords.y);

    // Check if hover state changed
    const newGateId = gate?.id ?? null;
    if (newGateId !== this.hoveredGateId) {
      this.hoveredGateId = newGateId;

      // Update tooltip
      if (gate && this.tooltip) {
        // Get wire states from circuit model for output display
        const wireStates = this.getWireStates();
        this.tooltip.show(e.clientX, e.clientY, gate, wireStates);
      } else if (this.tooltip) {
        this.tooltip.hide();
      }

      // Re-render to update hover highlight
      this.render();
    } else if (gate && this.tooltip?.isVisible()) {
      // Update tooltip position if still hovering same gate
      const wireStates = this.getWireStates();
      this.tooltip.show(e.clientX, e.clientY, gate, wireStates);
    }
  }

  /**
   * Handle mouse leaving the canvas (Story 6.8).
   * Hides tooltip and clears hover state.
   * @private
   */
  private handleMouseLeave(_e: MouseEvent): void {
    if (this.hoveredGateId !== null) {
      this.hoveredGateId = null;
      this.tooltip?.hide();
      this.render();
    }
  }

  /**
   * Convert screen coordinates to canvas coordinates (Story 6.8).
   * Accounts for zoom scale and pan offset.
   * @param clientX - X coordinate in viewport (screen) pixels
   * @param clientY - Y coordinate in viewport (screen) pixels
   * @returns Canvas coordinates
   */
  screenToCanvas(clientX: number, clientY: number): { x: number; y: number } {
    if (!this.canvas) return { x: 0, y: 0 };

    const rect = this.canvas.getBoundingClientRect();
    const zoom = this.zoomController.getScale();
    const offset = this.zoomController.getOffset();

    // Convert screen to canvas coordinates
    // First get position relative to canvas element
    // Then subtract pan offset and divide by zoom
    const canvasX = (clientX - rect.left - offset.x) / zoom;
    const canvasY = (clientY - rect.top - offset.y) / zoom;

    return { x: canvasX, y: canvasY };
  }

  /**
   * Hit test against all gates to find one at the given canvas coordinates (Story 6.8).
   * @param canvasX - X coordinate in canvas space
   * @param canvasY - Y coordinate in canvas space
   * @returns The gate at the coordinates, or null if none
   */
  hitTestGate(canvasX: number, canvasY: number): CircuitGate | null {
    if (!this.circuitModel || !this.layout) return null;

    const config = this.layout.getConfig();
    const { gateWidth, gateHeight } = config;

    for (const gate of this.circuitModel.gates.values()) {
      const pos = this.layout.getPosition(gate.id);
      if (!pos) continue;

      // Check if point is within gate bounds
      if (
        canvasX >= pos.x &&
        canvasX <= pos.x + gateWidth &&
        canvasY >= pos.y &&
        canvasY <= pos.y + gateHeight
      ) {
        return gate;
      }
    }

    return null;
  }

  /**
   * Get the ID of the currently hovered gate (Story 6.8).
   * @returns The hovered gate ID, or null if not hovering
   */
  getHoveredGateId(): number | null {
    return this.hoveredGateId;
  }

  /**
   * Get wire states from circuit model for tooltip display (Story 6.8).
   * @returns Map of wire IDs to state arrays
   * @private
   */
  private getWireStates(): Map<number, number[]> {
    const states = new Map<number, number[]>();
    if (!this.circuitModel) return states;

    for (const wire of this.circuitModel.wires.values()) {
      states.set(wire.id, wire.state);
    }
    return states;
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
   * Applies zoom scale to the canvas transform.
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

    // Update viewport size for pan bounds (Story 6.7)
    this.zoomController.setViewportSize(width, height);

    // Apply transform with device pixel ratio and zoom scale (Story 6.6)
    this.applyCanvasTransform();
  }

  /**
   * Apply canvas transform with device pixel ratio, zoom scale, and pan offset.
   * @private
   */
  private applyCanvasTransform(): void {
    if (!this.ctx) return;

    const zoom = this.zoomController.getScale();
    const offset = this.zoomController.getOffset();
    const combinedScale = this.devicePixelRatio * zoom;

    this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    // Apply offset BEFORE scaling so it's in screen coordinates (Story 6.7)
    this.ctx.translate(offset.x * this.devicePixelRatio, offset.y * this.devicePixelRatio);
    this.ctx.scale(combinedScale, combinedScale);
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

    // Apply canvas transform with current zoom (Story 6.6)
    this.applyCanvasTransform();

    // Clear canvas with theme background
    // Note: fillRect coordinates are in transformed space, so we need to account for
    // both zoom and pan offset to ensure the entire visible area is filled (Story 6.7)
    const bgColor = this.getThemeBackground();
    this.ctx.fillStyle = bgColor;
    const zoom = this.zoomController.getScale();
    const offset = this.zoomController.getOffset();
    // Calculate fill area to cover entire viewport in transformed coordinates
    // Use (0 - x) instead of -x to avoid JavaScript's -0 edge case
    const fillX = (0 - offset.x) / zoom;
    const fillY = (0 - offset.y) / zoom;
    const fillWidth = this.displayWidth / zoom;
    const fillHeight = this.displayHeight / zoom;
    this.ctx.fillRect(fillX, fillY, fillWidth, fillHeight);

    // Ensure layout is calculated before rendering (Story 6.4)
    this.ensureLayoutCalculated();

    // Render wires BEFORE gates so gates appear on top (Story 6.4)
    this.renderWires();

    // Render gates if circuit data is loaded (Story 6.3)
    this.renderGates();

    // Call render complete callback if provided
    this.options.onRenderComplete?.();
  }

  /**
   * Ensure layout is calculated and up-to-date.
   * Shared by both wire and gate rendering.
   * Updates content bounds for pan clamping when layout changes (Story 6.7).
   * @private
   */
  private ensureLayoutCalculated(): void {
    if (!this.circuitModel) return;

    // Lazily create layout on first use
    if (!this.layout) {
      this.layout = new CircuitLayout();
    }

    // Only recalculate layout when circuit or dimensions change
    const needsLayoutRecalc =
      this.displayWidth !== this.lastLayoutWidth ||
      this.displayHeight !== this.lastLayoutHeight ||
      this.lastLayoutModelId !== this.circuitModel.gates.size;

    if (needsLayoutRecalc && this.displayWidth > 0 && this.displayHeight > 0) {
      this.layout.calculate(this.circuitModel, this.displayWidth, this.displayHeight);
      this.lastLayoutWidth = this.displayWidth;
      this.lastLayoutHeight = this.displayHeight;
      this.lastLayoutModelId = this.circuitModel.gates.size;

      // Update content bounds for pan clamping (Story 6.7)
      const bounds = this.layout.getBounds();
      if (bounds && bounds.width > 0 && bounds.height > 0) {
        this.zoomController.setContentBounds(bounds.width, bounds.height);
      }
    }
  }

  /**
   * Render all wires in the circuit.
   * Wires are rendered before gates so gates appear on top.
   * Uses interpolated wire states during animation.
   * @private
   */
  private renderWires(): void {
    if (!this.ctx || !this.circuitModel || !this.layout) return;

    // Lazily create wire renderer on first use
    if (!this.wireRenderer) {
      this.wireRenderer = new WireRenderer();
    }

    // Render each wire at its calculated positions
    for (const wire of this.circuitModel.wires.values()) {
      const wirePosition = this.layout.getWirePosition(wire.id);
      if (!wirePosition) continue;

      const isMultiBit = wire.width > 1;

      // Use interpolated states during animation, otherwise use actual wire state
      const wireState =
        this.interpolatedWireStates?.get(wire.id) ?? wire.state;

      // Render each segment of the wire
      for (const segment of wirePosition.segments) {
        // Get the signal value for this bit
        const signalValue = wireState[segment.bitIndex] ?? 2; // Default to unknown

        this.wireRenderer.renderWire(
          this.ctx,
          signalValue,
          segment.startX,
          segment.startY,
          segment.endX,
          segment.endY,
          isMultiBit
        );
      }
    }
  }

  /**
   * Render all gates in the circuit.
   * Gates are positioned by CircuitLayout and drawn by GateRenderer.
   * Layout calculation is handled by ensureLayoutCalculated().
   * Applies pulse effect during animation for gates with changed outputs.
   * Applies hover highlight for the currently hovered gate (Story 6.8).
   * @private
   */
  private renderGates(): void {
    if (!this.ctx || !this.circuitModel || !this.layout) return;

    // Lazily create gate renderer on first use
    if (!this.gateRenderer) {
      this.gateRenderer = new GateRenderer();
    }

    // Get gate dimensions from layout config
    const layoutConfig = this.layout.getConfig();

    // Check if gate pulse is enabled
    const enablePulse = this.options.animation?.enableGatePulse !== false;

    // Render each gate at its calculated position
    for (const gate of this.circuitModel.gates.values()) {
      const position = this.layout.getPosition(gate.id);
      if (position) {
        // Calculate pulse scale for animation
        const isActive = enablePulse && this.changedGates.has(gate.id);
        const pulseScale = calculatePulseScale(this.animationProgress, isActive);

        // Check if this gate is hovered (Story 6.8)
        const isHovered = this.hoveredGateId === gate.id;

        this.gateRenderer.renderGate(
          this.ctx,
          gate,
          position.x,
          position.y,
          layoutConfig.gateWidth,
          layoutConfig.gateHeight,
          pulseScale,
          isHovered
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

    // Clear animation state for immediate update
    this.animationProgress = 1.0;
    this.changedGates.clear();
    this.interpolatedWireStates = null;

    // Re-render with updated state
    this.render();
  }

  /**
   * Animate transition from current state to new circuit data.
   * Provides smooth visual transition with wire color interpolation and gate pulse effects.
   * Respects user's reduced motion preference.
   * @param newData - The new circuit data to transition to
   */
  animateTransition(newData: CircuitData): void {
    // Check if animation is enabled
    const enableAnimation = this.options.animation?.enableAnimation !== false;

    // Skip animation if disabled or user prefers reduced motion
    if (!enableAnimation || prefersReducedMotion()) {
      this.updateState({ circuitData: newData });
      return;
    }

    // Lazily create animation components
    if (!this.animationController) {
      this.animationController = new AnimationController({
        duration: this.options.animation?.animationDuration ?? 500,
        targetFps: this.options.animation?.targetFps ?? 30,
      });
    }
    if (!this.signalAnimator) {
      this.signalAnimator = new SignalAnimator();
    }

    // Stop any in-progress animation and clear previous animation state
    // to prevent race conditions when animations are triggered rapidly
    this.animationController.stopAnimation();
    this.changedGates.clear();
    this.interpolatedWireStates = null;
    this.animationProgress = 1.0;

    // Capture current state before updating model
    if (this.circuitModel) {
      this.signalAnimator.captureState(this.circuitModel);
    }

    // Update to new circuit model
    this.circuitModel = new CircuitModel(newData);
    this.lastLayoutModelId = 0; // Invalidate layout cache

    // Set target state and get changed gates
    this.signalAnimator.setTargetState(this.circuitModel);
    this.changedGates = this.signalAnimator.getChangedGates();

    // If no changes, skip animation
    if (!this.signalAnimator.hasChanges()) {
      this.animationProgress = 1.0;
      this.interpolatedWireStates = null;
      this.render();
      return;
    }

    // Set up animation callbacks
    this.animationController
      .onFrame((progress) => {
        this.animationProgress = progress;
        this.interpolatedWireStates = this.signalAnimator!.interpolate(progress);
        this.render();
      })
      .onComplete(() => {
        // Animation complete - clear animation state
        this.animationProgress = 1.0;
        this.changedGates.clear();
        this.interpolatedWireStates = null;
        this.render();
      });

    // Start animation
    const duration = this.options.animation?.animationDuration ?? 500;
    this.animationController.startAnimation(duration);
  }

  /**
   * Check if an animation is currently running.
   * @returns True if animation is in progress
   */
  get isAnimating(): boolean {
    return this.animationController?.isAnimating ?? false;
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

  // ============================================================================
  // Zoom Methods (Story 6.6)
  // ============================================================================

  /**
   * Get the current zoom scale.
   * @returns Current zoom scale (1.0 = 100%)
   */
  getZoom(): number {
    return this.zoomController.getScale();
  }

  /**
   * Set the zoom scale and re-render.
   * @param scale - New zoom scale (clamped to min/max)
   */
  setZoom(scale: number): void {
    const oldScale = this.zoomController.getScale();
    this.zoomController.setScale(scale);
    // Only re-render if zoom actually changed and we're mounted
    if (this.ctx && this.zoomController.getScale() !== oldScale) {
      // Update cursor state since pan availability may change (Story 6.7)
      this.updatePanCursor();
      this.render();
    }
  }

  /**
   * Reset zoom to 100% (scale = 1.0) and pan offset to (0, 0).
   */
  resetZoom(): void {
    this.zoomController.reset();
    // Update cursor state since pan availability may change (Story 6.7)
    this.updatePanCursor();
    this.render();
  }

  /**
   * Calculate and set zoom to fit the entire circuit in view.
   * @returns The calculated zoom scale
   */
  zoomToFit(): number {
    if (!this.circuitModel || !this.layout) {
      return 1.0;
    }

    // Calculate circuit bounds from layout
    const bounds = this.layout.getBounds();
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) {
      return 1.0;
    }

    const scale = this.zoomController.zoomToFit(
      bounds.width,
      bounds.height,
      this.displayWidth,
      this.displayHeight
    );

    // Update cursor state since pan availability may change (Story 6.7)
    this.updatePanCursor();
    this.render();

    return scale;
  }

  /**
   * Get the zoom level as a display percentage string.
   * @returns Formatted string like "100%"
   */
  getZoomDisplayPercent(): string {
    return this.zoomController.getDisplayPercent();
  }

  // ============================================================================
  // Pan Methods (Story 6.7)
  // ============================================================================

  /**
   * Get the current pan offset.
   * @returns Object with x and y offset values
   */
  getOffset(): { x: number; y: number } {
    return this.zoomController.getOffset();
  }

  /**
   * Set the pan offset and re-render.
   * @param x - X offset
   * @param y - Y offset
   */
  setOffset(x: number, y: number): void {
    this.zoomController.setOffset(x, y);
    this.render();
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

    // Clean up zoom wheel listener BEFORE clearing canvas reference (Story 6.6)
    if (this.canvas && this.boundWheelHandler) {
      this.canvas.removeEventListener('wheel', this.boundWheelHandler, { passive: false } as EventListenerOptions);
      this.boundWheelHandler = null;
    }

    // Clean up pan handlers BEFORE clearing canvas reference (Story 6.7)
    if (this.canvas && this.boundMouseDownHandler) {
      this.canvas.removeEventListener('mousedown', this.boundMouseDownHandler);
    }
    if (this.boundMouseMoveHandler) {
      document.removeEventListener('mousemove', this.boundMouseMoveHandler);
    }
    if (this.boundMouseUpHandler) {
      document.removeEventListener('mouseup', this.boundMouseUpHandler);
    }
    this.boundMouseDownHandler = null;
    this.boundMouseMoveHandler = null;
    this.boundMouseUpHandler = null;
    this.isDragging = false;

    // Clean up tooltip and hover handlers BEFORE clearing canvas reference (Story 6.8)
    if (this.canvas && this.boundMouseMoveHoverHandler) {
      this.canvas.removeEventListener('mousemove', this.boundMouseMoveHoverHandler);
    }
    if (this.canvas && this.boundMouseLeaveHandler) {
      this.canvas.removeEventListener('mouseleave', this.boundMouseLeaveHandler);
    }
    this.boundMouseMoveHoverHandler = null;
    this.boundMouseLeaveHandler = null;
    this.hoveredGateId = null;

    // Clean up tooltip (Story 6.8)
    if (this.tooltip) {
      this.tooltip.destroy();
      this.tooltip = null;
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

    // Clean up wire rendering (Story 6.4)
    this.wireRenderer = null;

    // Clean up animation (Story 6.5)
    if (this.animationController) {
      this.animationController.stopAnimation();
      this.animationController = null;
    }
    if (this.signalAnimator) {
      this.signalAnimator.clear();
      this.signalAnimator = null;
    }
    this.changedGates.clear();
    this.interpolatedWireStates = null;
  }
}

// Re-export CircuitLoadError for convenience
export { CircuitLoadError };
