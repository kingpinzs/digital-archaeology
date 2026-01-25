// src/builder/CircuitBuilder.ts
// Main orchestrator for the Circuit Builder feature
// Coordinates model, renderer, interactions, and simulation

import type {
  BuilderCircuit,
  BuilderTool,
  Position,
  SignalValue,
  Era,
  ComponentDefinition,
} from './types';
import { BuilderModel } from './BuilderModel';
import { RelayRenderer, DEFAULT_COMPONENT_COLORS } from './RelayRenderer';
import type { ComponentColors } from './RelayRenderer';
import { RelaySimulator } from './RelaySimulator';
import type { SimulationResult } from './RelaySimulator';
import { CanvasInteraction } from './CanvasInteraction';
import { WireDrawingTool } from './WireDrawingTool';
import { getComponentDefinition, getAvailableComponents } from './ComponentDefinitions';

/**
 * Circuit Builder configuration options.
 */
export interface CircuitBuilderOptions {
  /** Initial circuit to load */
  initialCircuit?: BuilderCircuit;
  /** Enable simulation auto-run on changes */
  autoSimulate?: boolean;
  /** Grid size in pixels */
  gridSize?: number;
  /** Snap components to grid */
  snapToGrid?: boolean;
  /** Custom component colors */
  colors?: Partial<ComponentColors>;
  /** Callback when circuit changes */
  onChange?: (circuit: BuilderCircuit) => void;
  /** Callback when simulation runs */
  onSimulationStep?: (result: SimulationResult) => void;
  /** Callback when a gate is unlocked */
  onGateUnlocked?: (gateId: string) => void;
  /** Callback to request re-render */
  onNeedsRender?: () => void;
}

/**
 * Default configuration.
 */
const DEFAULT_OPTIONS: Required<Omit<CircuitBuilderOptions, 'initialCircuit' | 'colors' | 'onChange' | 'onSimulationStep' | 'onGateUnlocked' | 'onNeedsRender'>> = {
  autoSimulate: true,
  gridSize: 20,
  snapToGrid: true,
};

/**
 * CircuitBuilder is the main entry point for the builder feature.
 * It orchestrates all the components: model, renderer, interactions, simulation.
 */
export class CircuitBuilder {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private resizeObserver: ResizeObserver | null = null;

  private model: BuilderModel;
  private renderer: RelayRenderer;
  private simulator: RelaySimulator;
  private interaction: CanvasInteraction;
  private wireDrawing: WireDrawingTool;

  private options: Required<Omit<CircuitBuilderOptions, 'initialCircuit' | 'colors' | 'onChange' | 'onSimulationStep' | 'onGateUnlocked' | 'onNeedsRender'>> & CircuitBuilderOptions;

  private displayWidth: number = 0;
  private displayHeight: number = 0;
  private devicePixelRatio: number = 1;
  private zoom: number = 1;
  private panOffset: Position = { x: 0, y: 0 };
  private currentTool: BuilderTool = 'select';

  private unlockedComponents: string[] = [];
  private simulationRunning: boolean = false;
  private simulationInterval: number | null = null;

  // Hover state
  private hoveredPortComponent: string | null = null;

  // Animation frame request
  private renderRequested: boolean = false;

  constructor(options: CircuitBuilderOptions = {}) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };

    // Initialize model
    this.model = new BuilderModel(options.initialCircuit);

    // Initialize renderer with colors
    this.renderer = new RelayRenderer(
      options.colors ? { colors: { ...DEFAULT_COMPONENT_COLORS, ...options.colors } } : {}
    );

    // Initialize simulator
    this.simulator = new RelaySimulator();

    // Initialize wire drawing tool
    this.wireDrawing = new WireDrawingTool({
      gridSize: this.options.gridSize,
      snapToGrid: this.options.snapToGrid,
    });

    // Initialize interaction handler
    this.interaction = new CanvasInteraction(this.model, {
      onComponentClick: this.handleComponentClick.bind(this),
      onComponentDoubleClick: this.handleComponentDoubleClick.bind(this),
      onBackgroundClick: this.handleBackgroundClick.bind(this),
      onComponentDragStart: this.handleComponentDragStart.bind(this),
      onComponentDragMove: this.handleComponentDragMove.bind(this),
      onComponentDragEnd: this.handleComponentDragEnd.bind(this),
      onPan: this.handlePan.bind(this),
      onWireDrawStart: this.handleWireDrawStart.bind(this),
      onWireDrawMove: this.handleWireDrawMove.bind(this),
      onWireDrawEnd: this.handleWireDrawEnd.bind(this),
      onSelectionBox: this.handleSelectionBox.bind(this),
      onSelectionBoxEnd: this.handleSelectionBoxEnd.bind(this),
      onPortHover: this.handlePortHover.bind(this),
      onPortUnhover: this.handlePortUnhover.bind(this),
      onNeedsRender: this.requestRender.bind(this),
    });

    // Set up model event listeners
    this.setupModelListeners();
  }

  /**
   * Set up listeners for model events.
   */
  private setupModelListeners(): void {
    this.model.on('componentAdded', () => {
      this.handleCircuitChange();
    });

    this.model.on('componentRemoved', () => {
      this.handleCircuitChange();
    });

    this.model.on('componentMoved', () => {
      this.requestRender();
    });

    this.model.on('wireAdded', () => {
      this.handleCircuitChange();
    });

    this.model.on('wireRemoved', () => {
      this.handleCircuitChange();
    });

    this.model.on('selectionChanged', () => {
      this.requestRender();
    });

    this.model.on('circuitLoaded', () => {
      this.handleCircuitChange();
    });
  }

  /**
   * Handle circuit changes (auto-simulate, notify).
   */
  private handleCircuitChange(): void {
    // Reload circuit in simulator
    this.simulator.loadCircuit(this.model.getCircuit() as BuilderCircuit);

    // Auto-simulate if enabled
    if (this.options.autoSimulate) {
      this.runSimulation();
    }

    // Notify callback
    this.options.onChange?.(this.model.getCircuit() as BuilderCircuit);

    this.requestRender();
  }

  // ============================================================================
  // Mount/Unmount
  // ============================================================================

  /**
   * Mount the builder to a container element.
   */
  mount(container: HTMLElement): void {
    if (this.canvas) {
      throw new Error('CircuitBuilder is already mounted. Call destroy() before remounting.');
    }

    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'da-builder-canvas';
    this.canvas.setAttribute('role', 'application');
    this.canvas.setAttribute('aria-label', 'Circuit Builder Canvas');

    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) {
      throw new Error('Failed to get 2D canvas context');
    }

    container.appendChild(this.canvas);

    // Set up resize observer
    this.resizeObserver = new ResizeObserver(this.handleResize.bind(this));
    this.resizeObserver.observe(container);

    // Initial sizing
    const rect = container.getBoundingClientRect();
    this.updateDimensions(rect.width, rect.height);

    // Attach interaction handlers
    this.interaction.attach(this.canvas);

    // Load circuit into simulator
    this.simulator.loadCircuit(this.model.getCircuit() as BuilderCircuit);

    // Initial simulation and render
    if (this.options.autoSimulate) {
      this.runSimulation();
    }
    this.render();
  }

  /**
   * Destroy and clean up the builder.
   */
  destroy(): void {
    // Stop simulation
    this.stopContinuousSimulation();

    // Clean up interaction
    this.interaction.detach();

    // Clean up resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Remove canvas
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }

    // Clear references
    this.canvas = null;
    this.ctx = null;

    // Clear model listeners
    this.model.clearListeners();
  }

  /**
   * Handle container resize.
   */
  private handleResize(entries: ResizeObserverEntry[]): void {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      this.updateDimensions(width, height);
      this.render();
    }
  }

  /**
   * Update canvas dimensions.
   */
  private updateDimensions(width: number, height: number): void {
    if (!this.canvas || !this.ctx) return;

    this.displayWidth = width;
    this.displayHeight = height;
    this.devicePixelRatio = window.devicePixelRatio || 1;

    // Set canvas size for HiDPI
    this.canvas.width = width * this.devicePixelRatio;
    this.canvas.height = height * this.devicePixelRatio;

    // Set display size
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
  }

  // ============================================================================
  // Rendering
  // ============================================================================

  /**
   * Request a render on the next animation frame.
   */
  private requestRender(): void {
    if (this.renderRequested) return;
    this.renderRequested = true;

    requestAnimationFrame(() => {
      this.renderRequested = false;
      this.render();
    });

    this.options.onNeedsRender?.();
  }

  /**
   * Render the circuit to the canvas.
   */
  render(): void {
    if (!this.ctx || !this.canvas) return;

    const ctx = this.ctx;

    // Apply transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(this.devicePixelRatio, this.devicePixelRatio);

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.displayWidth, this.displayHeight);

    // Apply zoom and pan
    ctx.save();
    ctx.translate(this.panOffset.x, this.panOffset.y);
    ctx.scale(this.zoom, this.zoom);

    // Draw grid
    this.drawGrid(ctx);

    // Get selection and connected ports
    const selection = this.model.getSelection();
    const selectedComponents = new Set(selection.components);
    const selectedWires = new Set(selection.wires);

    // Draw wires
    for (const wire of this.model.getWires()) {
      const startPos = this.model.getPortPosition(wire.sourceComponent, wire.sourcePort);
      const endPos = this.model.getPortPosition(wire.targetComponent, wire.targetPort);

      if (startPos && endPos) {
        this.renderer.renderWire(
          ctx,
          startPos,
          endPos,
          wire.waypoints,
          wire.signal ?? 2,
          selectedWires.has(wire.id)
        );
      }
    }

    // Draw components
    for (const component of this.model.getComponents()) {
      const connectedPorts = new Set<string>();
      for (const wire of this.model.getWiresForComponent(component.id)) {
        if (wire.sourceComponent === component.id) {
          connectedPorts.add(wire.sourcePort);
        }
        if (wire.targetComponent === component.id) {
          connectedPorts.add(wire.targetPort);
        }
      }

      const isSelected = selectedComponents.has(component.id);
      const isHovered =
        this.hoveredPortComponent === component.id ||
        this.model.getComponentAtPosition(
          this.interaction.getState().currentPosition ?? { x: -1000, y: -1000 }
        ) === component.id;

      // Update component state from simulator
      const simState = this.simulator.getComponentState(component.id);
      const componentWithState = { ...component, state: simState };

      this.renderer.renderComponent(
        ctx,
        componentWithState,
        isSelected,
        isHovered,
        connectedPorts
      );
    }

    // Draw wire preview if drawing
    if (this.wireDrawing.isDrawing()) {
      this.wireDrawing.renderPreview(ctx);
    }

    // Draw selection box if active
    const interactionState = this.interaction.getState();
    if (
      interactionState.dragType === 'selectionBox' &&
      interactionState.startPosition &&
      interactionState.currentPosition
    ) {
      this.renderer.renderSelectionBox(
        ctx,
        interactionState.startPosition,
        interactionState.currentPosition
      );
    }

    // Draw ghost component if dropping from palette
    if (interactionState.dropComponent && interactionState.currentPosition) {
      this.renderer.renderGhost(
        ctx,
        interactionState.dropComponent.id,
        this.interaction.snapPosition(interactionState.currentPosition)
      );
    }

    ctx.restore();
  }

  /**
   * Draw background grid.
   */
  private drawGrid(ctx: CanvasRenderingContext2D): void {
    const gridSize = this.options.gridSize;
    const startX = Math.floor(-this.panOffset.x / this.zoom / gridSize) * gridSize - gridSize;
    const startY = Math.floor(-this.panOffset.y / this.zoom / gridSize) * gridSize - gridSize;
    const endX = startX + this.displayWidth / this.zoom + gridSize * 2;
    const endY = startY + this.displayHeight / this.zoom + gridSize * 2;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    ctx.beginPath();
    for (let x = startX; x <= endX; x += gridSize) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += gridSize) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();
  }

  // ============================================================================
  // Interaction Handlers
  // ============================================================================

  private handleComponentClick(_id: string, _event: MouseEvent): void {
    // Already handled by interaction - selection updated
  }

  private handleComponentDoubleClick(id: string, _event: MouseEvent): void {
    // Could open edit dialog for the component
    const component = this.model.getComponent(id);
    if (component) {
      const def = getComponentDefinition(component.definitionId);
      if (def?.type === 'input') {
        // Toggle input value
        this.simulator.toggleInput(component.id);
        this.runSimulation();
      }
    }
  }

  private handleBackgroundClick(_position: Position, event: MouseEvent): void {
    if (!event.shiftKey) {
      this.model.clearSelection();
    }
  }

  private handleComponentDragStart(_id: string, _position: Position): void {
    // Drag started
  }

  private handleComponentDragMove(_id: string, _position: Position, _delta: Position): void {
    // Component moving
    this.requestRender();
  }

  private handleComponentDragEnd(_id: string, _position: Position): void {
    // Drag ended
    this.requestRender();
  }

  private handlePan(delta: Position): void {
    this.panOffset.x += delta.x * this.zoom;
    this.panOffset.y += delta.y * this.zoom;
    this.interaction.setPanOffset(this.panOffset);
    this.requestRender();
  }

  private handleWireDrawStart(componentId: string, portId: string): void {
    const pos = this.model.getPortPosition(componentId, portId);
    if (pos) {
      this.wireDrawing.startDrawing(pos, componentId, portId);
    }
  }

  private handleWireDrawMove(position: Position): void {
    this.wireDrawing.updateEndpoint(position);

    // Check if over a valid port
    const port = this.model.getPortAtPosition(position, 15);
    if (port) {
      const state = this.wireDrawing.getState();
      const isValid =
        port.componentId !== state.startPort?.componentId ||
        port.portId !== state.startPort?.portId;
      this.wireDrawing.setTargetPort(port.componentId, port.portId, isValid);
    } else {
      this.wireDrawing.setTargetPort(null, null, false);
    }

    this.requestRender();
  }

  private handleWireDrawEnd(_componentId: string | null, _portId: string | null): void {
    const result = this.wireDrawing.finishDrawing();
    if (result) {
      this.model.addWire(
        result.sourceComponent,
        result.sourcePort,
        result.targetComponent,
        result.targetPort,
        result.waypoints
      );
    }
    this.requestRender();
  }

  private handleSelectionBox(_start: Position, _end: Position): void {
    this.requestRender();
  }

  private handleSelectionBoxEnd(_start: Position, _end: Position): void {
    this.requestRender();
  }

  private handlePortHover(componentId: string, _portId: string): void {
    this.hoveredPortComponent = componentId;
    this.requestRender();
  }

  private handlePortUnhover(): void {
    this.hoveredPortComponent = null;
    this.requestRender();
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Get the circuit model.
   */
  getModel(): BuilderModel {
    return this.model;
  }

  /**
   * Get the simulator.
   */
  getSimulator(): RelaySimulator {
    return this.simulator;
  }

  /**
   * Set the current tool.
   */
  setTool(tool: BuilderTool): void {
    this.currentTool = tool;
    this.interaction.setTool(tool);
  }

  /**
   * Get the current tool.
   */
  getTool(): BuilderTool {
    return this.currentTool;
  }

  /**
   * Add a component to the circuit.
   */
  addComponent(definitionId: string, position: Position): void {
    const snappedPos = this.options.snapToGrid
      ? {
          x: Math.round(position.x / this.options.gridSize) * this.options.gridSize,
          y: Math.round(position.y / this.options.gridSize) * this.options.gridSize,
        }
      : position;
    this.model.addComponent(definitionId, snappedPos);
  }

  /**
   * Start dragging a component from the palette.
   */
  startComponentDrop(definition: ComponentDefinition): void {
    this.interaction.startComponentDrop(definition);
  }

  /**
   * Delete selected items.
   */
  deleteSelection(): void {
    this.model.deleteSelection();
  }

  /**
   * Undo last action.
   */
  undo(): void {
    this.model.undo();
  }

  /**
   * Redo last undone action.
   */
  redo(): void {
    this.model.redo();
  }

  /**
   * Check if undo is available.
   */
  canUndo(): boolean {
    return this.model.canUndo();
  }

  /**
   * Check if redo is available.
   */
  canRedo(): boolean {
    return this.model.canRedo();
  }

  /**
   * Clear the circuit.
   */
  clear(): void {
    this.model.clear();
  }

  /**
   * Load a circuit.
   */
  loadCircuit(circuit: BuilderCircuit): void {
    this.model.loadCircuit(circuit);
  }

  /**
   * Create a new circuit.
   */
  newCircuit(name?: string, era?: Era): void {
    this.model.newCircuit(name, era);
  }

  /**
   * Export circuit as JSON.
   */
  exportCircuit(): string {
    return this.model.exportCircuit();
  }

  /**
   * Import circuit from JSON.
   */
  importCircuit(json: string): boolean {
    return this.model.importCircuit(json);
  }

  // ============================================================================
  // Simulation
  // ============================================================================

  /**
   * Run one simulation step.
   */
  runSimulation(): SimulationResult {
    const result = this.simulator.step();

    // Update wire signals in model
    for (const wire of this.model.getWires()) {
      const signal = result.wireSignals.get(wire.id);
      if (signal !== undefined) {
        (wire as { signal?: SignalValue }).signal = signal;
      }
    }

    this.options.onSimulationStep?.(result);
    this.requestRender();

    return result;
  }

  /**
   * Start continuous simulation.
   */
  startContinuousSimulation(speed: number = 10): void {
    this.stopContinuousSimulation();
    this.simulationRunning = true;

    const interval = Math.max(10, 1000 / speed);
    this.simulationInterval = window.setInterval(() => {
      this.runSimulation();
    }, interval);
  }

  /**
   * Stop continuous simulation.
   */
  stopContinuousSimulation(): void {
    this.simulationRunning = false;
    if (this.simulationInterval !== null) {
      window.clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  /**
   * Check if simulation is running.
   */
  isSimulationRunning(): boolean {
    return this.simulationRunning;
  }

  /**
   * Reset simulation to initial state.
   */
  resetSimulation(): void {
    this.simulator.reset();
    this.runSimulation();
  }

  /**
   * Set an input value.
   */
  setInput(inputId: string, value: SignalValue): void {
    this.simulator.setInput(inputId, value);
    if (this.options.autoSimulate) {
      this.runSimulation();
    }
  }

  /**
   * Toggle an input value.
   */
  toggleInput(inputId: string): void {
    this.simulator.toggleInput(inputId);
    if (this.options.autoSimulate) {
      this.runSimulation();
    }
  }

  // ============================================================================
  // Zoom and Pan
  // ============================================================================

  /**
   * Set zoom level.
   */
  setZoom(zoom: number): void {
    this.zoom = Math.max(0.25, Math.min(4, zoom));
    this.interaction.setZoom(this.zoom);
    this.requestRender();
  }

  /**
   * Get zoom level.
   */
  getZoom(): number {
    return this.zoom;
  }

  /**
   * Zoom in.
   */
  zoomIn(): void {
    this.setZoom(this.zoom * 1.2);
  }

  /**
   * Zoom out.
   */
  zoomOut(): void {
    this.setZoom(this.zoom / 1.2);
  }

  /**
   * Reset zoom to 100%.
   */
  resetZoom(): void {
    this.zoom = 1;
    this.panOffset = { x: 0, y: 0 };
    this.interaction.setZoom(this.zoom);
    this.interaction.setPanOffset(this.panOffset);
    this.requestRender();
  }

  /**
   * Zoom to fit all components.
   */
  zoomToFit(): void {
    const components = this.model.getComponents();
    if (components.length === 0) {
      this.resetZoom();
      return;
    }

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const component of components) {
      const def = getComponentDefinition(component.definitionId);
      if (!def) continue;

      minX = Math.min(minX, component.position.x);
      minY = Math.min(minY, component.position.y);
      maxX = Math.max(maxX, component.position.x + def.width);
      maxY = Math.max(maxY, component.position.y + def.height);
    }

    const contentWidth = maxX - minX + 100; // Add padding
    const contentHeight = maxY - minY + 100;

    const scaleX = this.displayWidth / contentWidth;
    const scaleY = this.displayHeight / contentHeight;
    const scale = Math.min(scaleX, scaleY, 1); // Don't zoom in past 100%

    this.zoom = scale;
    this.panOffset = {
      x: (this.displayWidth - contentWidth * scale) / 2 - minX * scale + 50,
      y: (this.displayHeight - contentHeight * scale) / 2 - minY * scale + 50,
    };

    this.interaction.setZoom(this.zoom);
    this.interaction.setPanOffset(this.panOffset);
    this.requestRender();
  }

  // ============================================================================
  // Component Palette
  // ============================================================================

  /**
   * Get available components for the current era.
   */
  getAvailableComponents(): ComponentDefinition[] {
    const era = this.model.getEra();
    return getAvailableComponents(era, this.unlockedComponents);
  }

  /**
   * Unlock a component.
   */
  unlockComponent(componentId: string): void {
    if (!this.unlockedComponents.includes(componentId)) {
      this.unlockedComponents.push(componentId);
      this.options.onGateUnlocked?.(componentId);
    }
  }

  /**
   * Get unlocked components.
   */
  getUnlockedComponents(): string[] {
    return [...this.unlockedComponents];
  }

  /**
   * Set unlocked components.
   */
  setUnlockedComponents(componentIds: string[]): void {
    this.unlockedComponents = [...componentIds];
  }
}
