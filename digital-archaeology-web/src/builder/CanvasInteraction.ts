// src/builder/CanvasInteraction.ts
// Handles mouse/touch interactions on the builder canvas

import type { Position, BuilderTool, ComponentDefinition } from './types';
import type { BuilderModel } from './BuilderModel';
import { getComponentDefinition } from './ComponentDefinitions';

/**
 * Interaction state for tracking drag operations.
 */
export interface InteractionState {
  /** Is the mouse/touch currently pressed */
  isDown: boolean;
  /** Start position of current drag */
  startPosition: Position | null;
  /** Current position during drag */
  currentPosition: Position | null;
  /** What's being dragged */
  dragType: 'none' | 'component' | 'selection' | 'pan' | 'wire' | 'selectionBox';
  /** ID of component being dragged (if any) */
  dragComponentId: string | null;
  /** Component definition being dropped from palette */
  dropComponent: ComponentDefinition | null;
  /** Wire start port (if drawing wire) */
  wireStart: { componentId: string; portId: string } | null;
}

/**
 * Callbacks for interaction events.
 */
export interface InteractionCallbacks {
  /** Component was clicked */
  onComponentClick?: (id: string, event: MouseEvent) => void;
  /** Component was double-clicked */
  onComponentDoubleClick?: (id: string, event: MouseEvent) => void;
  /** Wire was clicked */
  onWireClick?: (id: string, event: MouseEvent) => void;
  /** Background was clicked (no component/wire) */
  onBackgroundClick?: (position: Position, event: MouseEvent) => void;
  /** Component drag started */
  onComponentDragStart?: (id: string, position: Position) => void;
  /** Component drag moved */
  onComponentDragMove?: (id: string, position: Position, delta: Position) => void;
  /** Component drag ended */
  onComponentDragEnd?: (id: string, position: Position) => void;
  /** Pan drag moved */
  onPan?: (delta: Position) => void;
  /** Wire drawing started */
  onWireDrawStart?: (componentId: string, portId: string) => void;
  /** Wire drawing moved */
  onWireDrawMove?: (position: Position) => void;
  /** Wire drawing ended */
  onWireDrawEnd?: (componentId: string | null, portId: string | null) => void;
  /** Selection box being drawn */
  onSelectionBox?: (start: Position, end: Position) => void;
  /** Selection box completed */
  onSelectionBoxEnd?: (start: Position, end: Position) => void;
  /** Port hovered */
  onPortHover?: (componentId: string, portId: string) => void;
  /** Port unhovered */
  onPortUnhover?: () => void;
  /** Request re-render */
  onNeedsRender?: () => void;
}

/**
 * Handles mouse/touch interactions on the builder canvas.
 */
export class CanvasInteraction {
  private canvas: HTMLCanvasElement | null = null;
  private model: BuilderModel;
  private callbacks: InteractionCallbacks;
  private state: InteractionState;
  private currentTool: BuilderTool = 'select';
  private zoom: number = 1;
  private panOffset: Position = { x: 0, y: 0 };
  private gridSize: number = 20;
  private snapToGrid: boolean = true;
  private portHitTolerance: number = 15;

  // Bound event handlers for cleanup
  private boundMouseDown: (e: MouseEvent) => void;
  private boundMouseMove: (e: MouseEvent) => void;
  private boundMouseUp: (e: MouseEvent) => void;
  private boundClick: (e: MouseEvent) => void;
  private boundDoubleClick: (e: MouseEvent) => void;
  private boundContextMenu: (e: MouseEvent) => void;
  private boundWheel: (e: WheelEvent) => void;
  private boundDragOver: (e: DragEvent) => void;
  private boundDrop: (e: DragEvent) => void;

  constructor(model: BuilderModel, callbacks: InteractionCallbacks = {}) {
    this.model = model;
    this.callbacks = callbacks;
    this.state = this.createInitialState();

    // Bind event handlers
    this.boundMouseDown = this.handleMouseDown.bind(this);
    this.boundMouseMove = this.handleMouseMove.bind(this);
    this.boundMouseUp = this.handleMouseUp.bind(this);
    this.boundClick = this.handleClick.bind(this);
    this.boundDoubleClick = this.handleDoubleClick.bind(this);
    this.boundContextMenu = this.handleContextMenu.bind(this);
    this.boundWheel = this.handleWheel.bind(this);
    this.boundDragOver = this.handleDragOver.bind(this);
    this.boundDrop = this.handleDrop.bind(this);
  }

  /**
   * Create initial interaction state.
   */
  private createInitialState(): InteractionState {
    return {
      isDown: false,
      startPosition: null,
      currentPosition: null,
      dragType: 'none',
      dragComponentId: null,
      dropComponent: null,
      wireStart: null,
    };
  }

  /**
   * Attach event listeners to canvas.
   */
  attach(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;

    canvas.addEventListener('mousedown', this.boundMouseDown);
    canvas.addEventListener('mousemove', this.boundMouseMove);
    canvas.addEventListener('mouseup', this.boundMouseUp);
    canvas.addEventListener('click', this.boundClick);
    canvas.addEventListener('dblclick', this.boundDoubleClick);
    canvas.addEventListener('contextmenu', this.boundContextMenu);
    canvas.addEventListener('wheel', this.boundWheel, { passive: false });
    canvas.addEventListener('dragover', this.boundDragOver);
    canvas.addEventListener('drop', this.boundDrop);

    // Listen for mouseup on document to catch drag releases outside canvas
    document.addEventListener('mouseup', this.boundMouseUp);
    document.addEventListener('mousemove', this.boundMouseMove);
  }

  /**
   * Detach event listeners from canvas.
   */
  detach(): void {
    if (this.canvas) {
      this.canvas.removeEventListener('mousedown', this.boundMouseDown);
      this.canvas.removeEventListener('mousemove', this.boundMouseMove);
      this.canvas.removeEventListener('mouseup', this.boundMouseUp);
      this.canvas.removeEventListener('click', this.boundClick);
      this.canvas.removeEventListener('dblclick', this.boundDoubleClick);
      this.canvas.removeEventListener('contextmenu', this.boundContextMenu);
      this.canvas.removeEventListener('wheel', this.boundWheel);
      this.canvas.removeEventListener('dragover', this.boundDragOver);
      this.canvas.removeEventListener('drop', this.boundDrop);
    }

    document.removeEventListener('mouseup', this.boundMouseUp);
    document.removeEventListener('mousemove', this.boundMouseMove);

    this.canvas = null;
  }

  /**
   * Set the current tool mode.
   */
  setTool(tool: BuilderTool): void {
    this.currentTool = tool;
    this.resetState();
    this.updateCursor();
  }

  /**
   * Get the current tool mode.
   */
  getTool(): BuilderTool {
    return this.currentTool;
  }

  /**
   * Set zoom level.
   */
  setZoom(zoom: number): void {
    this.zoom = zoom;
  }

  /**
   * Set pan offset.
   */
  setPanOffset(offset: Position): void {
    this.panOffset = offset;
  }

  /**
   * Set grid size.
   */
  setGridSize(size: number): void {
    this.gridSize = size;
  }

  /**
   * Set snap to grid.
   */
  setSnapToGrid(enabled: boolean): void {
    this.snapToGrid = enabled;
  }

  /**
   * Start a component drop from palette.
   */
  startComponentDrop(definition: ComponentDefinition): void {
    this.state.dropComponent = definition;
    this.state.dragType = 'component';
  }

  /**
   * Cancel current operation.
   */
  cancel(): void {
    this.resetState();
    this.callbacks.onNeedsRender?.();
  }

  /**
   * Get current interaction state.
   */
  getState(): Readonly<InteractionState> {
    return this.state;
  }

  /**
   * Convert screen coordinates to canvas coordinates.
   */
  screenToCanvas(clientX: number, clientY: number): Position {
    if (!this.canvas) return { x: 0, y: 0 };

    const rect = this.canvas.getBoundingClientRect();
    const x = (clientX - rect.left - this.panOffset.x) / this.zoom;
    const y = (clientY - rect.top - this.panOffset.y) / this.zoom;

    return { x, y };
  }

  /**
   * Snap position to grid.
   */
  snapPosition(position: Position): Position {
    if (!this.snapToGrid) return position;

    return {
      x: Math.round(position.x / this.gridSize) * this.gridSize,
      y: Math.round(position.y / this.gridSize) * this.gridSize,
    };
  }

  /**
   * Handle mouse down event.
   */
  private handleMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return; // Only left button

    const position = this.screenToCanvas(e.clientX, e.clientY);
    this.state.isDown = true;
    this.state.startPosition = position;
    this.state.currentPosition = position;

    // If we're dropping a component from palette, don't change dragType
    if (this.state.dropComponent) {
      this.state.dragType = 'component';
      e.preventDefault();
      return;
    }

    // Check what we're clicking on
    const port = this.model.getPortAtPosition(position, this.portHitTolerance);
    const componentId = this.model.getComponentAtPosition(position);

    switch (this.currentTool) {
      case 'select':
        if (port && this.currentTool === 'select') {
          // Clicking on port starts wire drawing
          this.state.dragType = 'wire';
          this.state.wireStart = port;
          this.callbacks.onWireDrawStart?.(port.componentId, port.portId);
        } else if (componentId) {
          // Clicking on component
          const selection = this.model.getSelection();
          if (selection.components.includes(componentId)) {
            // Already selected - start dragging
            this.state.dragType = 'selection';
          } else {
            // Select and start dragging
            this.model.selectComponent(componentId, e.shiftKey);
            this.state.dragType = 'selection';
            this.state.dragComponentId = componentId;
          }
          this.callbacks.onComponentDragStart?.(componentId, position);
        } else {
          // Clicking on background - start selection box
          this.state.dragType = 'selectionBox';
          if (!e.shiftKey) {
            this.model.clearSelection();
          }
        }
        break;

      case 'wire':
        if (port) {
          this.state.dragType = 'wire';
          this.state.wireStart = port;
          this.callbacks.onWireDrawStart?.(port.componentId, port.portId);
        }
        break;

      case 'pan':
        this.state.dragType = 'pan';
        break;

      case 'delete':
        if (componentId) {
          this.model.removeComponent(componentId);
        }
        break;
    }

    e.preventDefault();
  }

  /**
   * Handle mouse move event.
   */
  private handleMouseMove(e: MouseEvent): void {
    const position = this.screenToCanvas(e.clientX, e.clientY);
    const prevPosition = this.state.currentPosition;
    this.state.currentPosition = position;

    // Check for port hover
    const port = this.model.getPortAtPosition(position, this.portHitTolerance);
    if (port) {
      this.callbacks.onPortHover?.(port.componentId, port.portId);
    } else {
      this.callbacks.onPortUnhover?.();
    }

    if (!this.state.isDown) {
      // Just hovering
      if (this.state.dropComponent) {
        // Moving component being dropped from palette
        this.callbacks.onNeedsRender?.();
      }
      return;
    }

    // Handle drag based on type
    const delta = prevPosition
      ? { x: position.x - prevPosition.x, y: position.y - prevPosition.y }
      : { x: 0, y: 0 };

    switch (this.state.dragType) {
      case 'selection':
        // Move selected components
        const selection = this.model.getSelection();
        for (const compId of selection.components) {
          const component = this.model.getComponent(compId);
          if (component) {
            const newPos = this.snapPosition({
              x: component.position.x + delta.x,
              y: component.position.y + delta.y,
            });
            this.model.moveComponent(compId, newPos);
          }
        }
        this.callbacks.onComponentDragMove?.(
          this.state.dragComponentId ?? '',
          position,
          delta
        );
        break;

      case 'pan':
        this.callbacks.onPan?.(delta);
        break;

      case 'wire':
        this.callbacks.onWireDrawMove?.(position);
        break;

      case 'selectionBox':
        if (this.state.startPosition) {
          this.callbacks.onSelectionBox?.(this.state.startPosition, position);
        }
        break;

      case 'component':
        // Component being dropped from palette
        this.callbacks.onNeedsRender?.();
        break;
    }
  }

  /**
   * Handle mouse up event.
   */
  private handleMouseUp(e: MouseEvent): void {
    if (!this.state.isDown) return;

    const position = this.screenToCanvas(e.clientX, e.clientY);

    switch (this.state.dragType) {
      case 'selection':
        if (this.state.dragComponentId) {
          this.callbacks.onComponentDragEnd?.(this.state.dragComponentId, position);
        }
        break;

      case 'wire':
        // Check if we're over a port
        const port = this.model.getPortAtPosition(position, this.portHitTolerance);
        if (port && this.state.wireStart) {
          // Don't connect to same port
          if (
            port.componentId !== this.state.wireStart.componentId ||
            port.portId !== this.state.wireStart.portId
          ) {
            // Create wire
            this.model.addWire(
              this.state.wireStart.componentId,
              this.state.wireStart.portId,
              port.componentId,
              port.portId
            );
          }
        }
        this.callbacks.onWireDrawEnd?.(port?.componentId ?? null, port?.portId ?? null);
        break;

      case 'selectionBox':
        if (this.state.startPosition) {
          this.callbacks.onSelectionBoxEnd?.(this.state.startPosition, position);
          // Select components in box
          this.selectComponentsInBox(this.state.startPosition, position);
        }
        break;

      case 'component':
        // Drop component from palette
        if (this.state.dropComponent) {
          const snappedPos = this.snapPosition(position);
          this.model.addComponent(this.state.dropComponent.id, snappedPos);
        }
        break;
    }

    this.resetState();
    this.callbacks.onNeedsRender?.();
  }

  /**
   * Handle click event.
   */
  private handleClick(e: MouseEvent): void {
    const position = this.screenToCanvas(e.clientX, e.clientY);

    // Skip if we were dragging
    if (this.state.startPosition) {
      const dx = Math.abs(position.x - this.state.startPosition.x);
      const dy = Math.abs(position.y - this.state.startPosition.y);
      if (dx > 5 || dy > 5) return;
    }

    // If we have a component to drop, place it here
    if (this.state.dropComponent) {
      const snappedPos = this.snapToGrid
        ? this.snapPosition(position)
        : position;
      this.model.addComponent(this.state.dropComponent.id, snappedPos);
      this.state.dropComponent = null;
      this.callbacks.onNeedsRender?.();
      return;
    }

    const componentId = this.model.getComponentAtPosition(position);

    if (componentId) {
      this.callbacks.onComponentClick?.(componentId, e);
    } else {
      // Check for wire click
      // For now, just trigger background click
      this.callbacks.onBackgroundClick?.(position, e);
    }
  }

  /**
   * Handle double click event.
   */
  private handleDoubleClick(e: MouseEvent): void {
    const position = this.screenToCanvas(e.clientX, e.clientY);
    const componentId = this.model.getComponentAtPosition(position);

    if (componentId) {
      this.callbacks.onComponentDoubleClick?.(componentId, e);
    }
  }

  /**
   * Handle context menu event.
   */
  private handleContextMenu(e: MouseEvent): void {
    e.preventDefault();
    // Could show context menu here
  }

  /**
   * Handle wheel event for zoom.
   */
  private handleWheel(e: WheelEvent): void {
    e.preventDefault();
    // Could handle zoom here
  }

  /**
   * Select components within a box.
   */
  private selectComponentsInBox(start: Position, end: Position): void {
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);

    const componentIds: string[] = [];

    for (const component of this.model.getComponents()) {
      if (
        component.position.x >= minX &&
        component.position.x <= maxX &&
        component.position.y >= minY &&
        component.position.y <= maxY
      ) {
        componentIds.push(component.id);
      }
    }

    if (componentIds.length > 0) {
      this.model.selectMultiple(componentIds, []);
    }
  }

  /**
   * Reset interaction state.
   */
  private resetState(): void {
    this.state = this.createInitialState();
  }

  /**
   * Update cursor based on current state.
   */
  private updateCursor(): void {
    if (!this.canvas) return;

    switch (this.currentTool) {
      case 'select':
        this.canvas.style.cursor = 'default';
        break;
      case 'wire':
        this.canvas.style.cursor = 'crosshair';
        break;
      case 'pan':
        this.canvas.style.cursor = 'grab';
        break;
      case 'delete':
        this.canvas.style.cursor = 'not-allowed';
        break;
    }
  }

  /**
   * Handle dragover event - required to allow drop.
   */
  private handleDragOver(e: DragEvent): void {
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'copy';

    // Update position for ghost rendering
    const position = this.screenToCanvas(e.clientX, e.clientY);
    this.state.currentPosition = position;
    this.callbacks.onNeedsRender?.();
  }

  /**
   * Handle drop event - place component from palette.
   */
  private handleDrop(e: DragEvent): void {
    e.preventDefault();

    const componentId = e.dataTransfer?.getData('text/plain');
    if (!componentId) return;

    const definition = getComponentDefinition(componentId);
    if (!definition) return;

    const position = this.screenToCanvas(e.clientX, e.clientY);
    const snappedPos = this.snapToGrid
      ? this.snapPosition(position)
      : position;

    // Add component to model
    this.model.addComponent(definition.id, snappedPos);

    // Clear drop state
    this.state.dropComponent = null;
    this.state.currentPosition = null;
    this.callbacks.onNeedsRender?.();
  }
}
