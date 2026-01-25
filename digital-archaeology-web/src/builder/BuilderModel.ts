// src/builder/BuilderModel.ts
// Mutable circuit model for the Circuit Builder
// Manages components, wires, and circuit state

import type {
  BuilderCircuit,
  ComponentInstance,
  WireConnection,
  ExternalPort,
  Position,
  SelectionState,
  BuilderEvent,
  BuilderEventCallback,
  BuilderEventType,
  Era,
} from './types';
import { getComponentDefinition } from './ComponentDefinitions';

/**
 * Generates a unique ID for components and wires.
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Default empty circuit.
 */
function createEmptyCircuit(name: string = 'Untitled', era: Era = 'relay'): BuilderCircuit {
  return {
    id: generateId(),
    name,
    era,
    components: [],
    wires: [],
    inputs: [],
    outputs: [],
    createdAt: Date.now(),
    modifiedAt: Date.now(),
  };
}

/**
 * BuilderModel manages the state of a circuit being built.
 * Provides methods to add/remove components and wires,
 * and emits events for UI updates.
 */
export class BuilderModel {
  private circuit: BuilderCircuit;
  private listeners: Map<BuilderEventType, Set<BuilderEventCallback>> = new Map();
  private selection: SelectionState = { components: [], wires: [] };
  private undoStack: BuilderCircuit[] = [];
  private redoStack: BuilderCircuit[] = [];
  private maxUndoLevels = 50;

  constructor(circuit?: BuilderCircuit) {
    this.circuit = circuit ?? createEmptyCircuit();
  }

  // ============================================================================
  // Circuit Accessors
  // ============================================================================

  /**
   * Get the current circuit data (immutable snapshot).
   */
  getCircuit(): Readonly<BuilderCircuit> {
    return this.circuit;
  }

  /**
   * Get circuit ID.
   */
  getId(): string {
    return this.circuit.id;
  }

  /**
   * Get circuit name.
   */
  getName(): string {
    return this.circuit.name;
  }

  /**
   * Set circuit name.
   */
  setName(name: string): void {
    this.saveUndoState();
    this.circuit.name = name;
    this.circuit.modifiedAt = Date.now();
  }

  /**
   * Get circuit era.
   */
  getEra(): Era {
    return this.circuit.era;
  }

  /**
   * Get all components.
   */
  getComponents(): ReadonlyArray<ComponentInstance> {
    return this.circuit.components;
  }

  /**
   * Get a component by ID.
   */
  getComponent(id: string): ComponentInstance | undefined {
    return this.circuit.components.find((c) => c.id === id);
  }

  /**
   * Get all wires.
   */
  getWires(): ReadonlyArray<WireConnection> {
    return this.circuit.wires;
  }

  /**
   * Get a wire by ID.
   */
  getWire(id: string): WireConnection | undefined {
    return this.circuit.wires.find((w) => w.id === id);
  }

  /**
   * Get external inputs.
   */
  getInputs(): ReadonlyArray<ExternalPort> {
    return this.circuit.inputs;
  }

  /**
   * Get external outputs.
   */
  getOutputs(): ReadonlyArray<ExternalPort> {
    return this.circuit.outputs;
  }

  // ============================================================================
  // Component Operations
  // ============================================================================

  /**
   * Add a component to the circuit.
   * @param definitionId Component definition ID
   * @param position Position on canvas
   * @param rotation Rotation (default 0)
   * @param label Optional label
   * @returns The created component instance
   */
  addComponent(
    definitionId: string,
    position: Position,
    rotation: 0 | 90 | 180 | 270 = 0,
    label?: string
  ): ComponentInstance | null {
    const definition = getComponentDefinition(definitionId);
    if (!definition) {
      console.warn(`Unknown component definition: ${definitionId}`);
      return null;
    }

    if (definition.locked) {
      console.warn(`Component ${definitionId} is locked`);
      return null;
    }

    this.saveUndoState();

    const component: ComponentInstance = {
      id: generateId(),
      definitionId,
      position: { ...position },
      rotation,
      label,
    };

    this.circuit.components.push(component);
    this.circuit.modifiedAt = Date.now();

    // If this is an input/output component, add to external ports
    if (definition.type === 'input') {
      this.circuit.inputs.push({
        id: component.id,
        name: label ?? `Input ${this.circuit.inputs.length + 1}`,
        direction: 'input',
        componentId: component.id,
      });
    } else if (definition.type === 'output') {
      this.circuit.outputs.push({
        id: component.id,
        name: label ?? `Output ${this.circuit.outputs.length + 1}`,
        direction: 'output',
        componentId: component.id,
      });
    }

    this.emit('componentAdded', component);
    return component;
  }

  /**
   * Remove a component from the circuit.
   * Also removes any connected wires.
   * @param id Component instance ID
   * @returns True if component was removed
   */
  removeComponent(id: string): boolean {
    const index = this.circuit.components.findIndex((c) => c.id === id);
    if (index === -1) return false;

    this.saveUndoState();

    const component = this.circuit.components[index];

    // Remove connected wires
    const wiresToRemove = this.circuit.wires.filter(
      (w) => w.sourceComponent === id || w.targetComponent === id
    );
    for (const wire of wiresToRemove) {
      this.removeWireInternal(wire.id);
    }

    // Remove from components
    this.circuit.components.splice(index, 1);

    // Remove from external ports if applicable
    this.circuit.inputs = this.circuit.inputs.filter((p) => p.componentId !== id);
    this.circuit.outputs = this.circuit.outputs.filter((p) => p.componentId !== id);

    // Remove from selection
    this.selection.components = this.selection.components.filter((cid) => cid !== id);

    this.circuit.modifiedAt = Date.now();
    this.emit('componentRemoved', component);
    return true;
  }

  /**
   * Move a component to a new position.
   * @param id Component instance ID
   * @param position New position
   * @returns True if component was moved
   */
  moveComponent(id: string, position: Position): boolean {
    const component = this.circuit.components.find((c) => c.id === id);
    if (!component) return false;

    this.saveUndoState();

    component.position = { ...position };
    this.circuit.modifiedAt = Date.now();

    this.emit('componentMoved', { id, position });
    return true;
  }

  /**
   * Rotate a component.
   * @param id Component instance ID
   * @param rotation New rotation
   * @returns True if component was rotated
   */
  rotateComponent(id: string, rotation: 0 | 90 | 180 | 270): boolean {
    const component = this.circuit.components.find((c) => c.id === id);
    if (!component) return false;

    this.saveUndoState();

    component.rotation = rotation;
    this.circuit.modifiedAt = Date.now();

    this.emit('componentMoved', { id, rotation });
    return true;
  }

  /**
   * Set component label.
   * @param id Component instance ID
   * @param label New label
   * @returns True if label was set
   */
  setComponentLabel(id: string, label: string): boolean {
    const component = this.circuit.components.find((c) => c.id === id);
    if (!component) return false;

    this.saveUndoState();

    component.label = label;
    this.circuit.modifiedAt = Date.now();

    return true;
  }

  // ============================================================================
  // Wire Operations
  // ============================================================================

  /**
   * Add a wire connecting two ports.
   * @param sourceComponent Source component ID
   * @param sourcePort Source port ID
   * @param targetComponent Target component ID
   * @param targetPort Target port ID
   * @param waypoints Optional waypoints for routing
   * @returns The created wire connection or null if invalid
   */
  addWire(
    sourceComponent: string,
    sourcePort: string,
    targetComponent: string,
    targetPort: string,
    waypoints: Position[] = []
  ): WireConnection | null {
    // Validate source
    const source = this.getComponent(sourceComponent);
    if (!source) {
      console.warn(`Invalid source component: ${sourceComponent}`);
      return null;
    }

    const sourceDef = getComponentDefinition(source.definitionId);
    if (!sourceDef?.ports.some((p) => p.id === sourcePort)) {
      console.warn(`Invalid source port: ${sourcePort}`);
      return null;
    }

    // Validate target
    const target = this.getComponent(targetComponent);
    if (!target) {
      console.warn(`Invalid target component: ${targetComponent}`);
      return null;
    }

    const targetDef = getComponentDefinition(target.definitionId);
    if (!targetDef?.ports.some((p) => p.id === targetPort)) {
      console.warn(`Invalid target port: ${targetPort}`);
      return null;
    }

    // Check for duplicate wire
    const existing = this.circuit.wires.find(
      (w) =>
        (w.sourceComponent === sourceComponent &&
          w.sourcePort === sourcePort &&
          w.targetComponent === targetComponent &&
          w.targetPort === targetPort) ||
        (w.sourceComponent === targetComponent &&
          w.sourcePort === targetPort &&
          w.targetComponent === sourceComponent &&
          w.targetPort === sourcePort)
    );

    if (existing) {
      console.warn('Wire already exists');
      return null;
    }

    // Don't allow self-connections
    if (sourceComponent === targetComponent && sourcePort === targetPort) {
      console.warn('Cannot connect a port to itself');
      return null;
    }

    this.saveUndoState();

    const wire: WireConnection = {
      id: generateId(),
      sourceComponent,
      sourcePort,
      targetComponent,
      targetPort,
      waypoints: waypoints.map((p) => ({ ...p })),
    };

    this.circuit.wires.push(wire);
    this.circuit.modifiedAt = Date.now();

    this.emit('wireAdded', wire);
    return wire;
  }

  /**
   * Remove a wire from the circuit.
   * @param id Wire ID
   * @returns True if wire was removed
   */
  removeWire(id: string): boolean {
    this.saveUndoState();
    return this.removeWireInternal(id);
  }

  /**
   * Internal wire removal without undo state.
   */
  private removeWireInternal(id: string): boolean {
    const index = this.circuit.wires.findIndex((w) => w.id === id);
    if (index === -1) return false;

    const wire = this.circuit.wires[index];
    this.circuit.wires.splice(index, 1);

    // Remove from selection
    this.selection.wires = this.selection.wires.filter((wid) => wid !== id);

    this.circuit.modifiedAt = Date.now();
    this.emit('wireRemoved', wire);
    return true;
  }

  /**
   * Update wire waypoints.
   * @param id Wire ID
   * @param waypoints New waypoints
   * @returns True if wire was updated
   */
  updateWireWaypoints(id: string, waypoints: Position[]): boolean {
    const wire = this.circuit.wires.find((w) => w.id === id);
    if (!wire) return false;

    this.saveUndoState();

    wire.waypoints = waypoints.map((p) => ({ ...p }));
    this.circuit.modifiedAt = Date.now();

    return true;
  }

  /**
   * Get wires connected to a component.
   * @param componentId Component ID
   * @returns Array of connected wires
   */
  getWiresForComponent(componentId: string): WireConnection[] {
    return this.circuit.wires.filter(
      (w) => w.sourceComponent === componentId || w.targetComponent === componentId
    );
  }

  /**
   * Get wires connected to a specific port.
   * @param componentId Component ID
   * @param portId Port ID
   * @returns Array of connected wires
   */
  getWiresForPort(componentId: string, portId: string): WireConnection[] {
    return this.circuit.wires.filter(
      (w) =>
        (w.sourceComponent === componentId && w.sourcePort === portId) ||
        (w.targetComponent === componentId && w.targetPort === portId)
    );
  }

  // ============================================================================
  // Selection Operations
  // ============================================================================

  /**
   * Get current selection.
   */
  getSelection(): Readonly<SelectionState> {
    return this.selection;
  }

  /**
   * Select a component.
   * @param id Component ID
   * @param addToSelection Add to existing selection (default: replace)
   */
  selectComponent(id: string, addToSelection: boolean = false): void {
    if (!addToSelection) {
      this.selection = { components: [], wires: [] };
    }

    if (!this.selection.components.includes(id)) {
      this.selection.components.push(id);
    }

    this.emit('selectionChanged', this.selection);
  }

  /**
   * Select a wire.
   * @param id Wire ID
   * @param addToSelection Add to existing selection (default: replace)
   */
  selectWire(id: string, addToSelection: boolean = false): void {
    if (!addToSelection) {
      this.selection = { components: [], wires: [] };
    }

    if (!this.selection.wires.includes(id)) {
      this.selection.wires.push(id);
    }

    this.emit('selectionChanged', this.selection);
  }

  /**
   * Select multiple items.
   * @param componentIds Component IDs
   * @param wireIds Wire IDs
   */
  selectMultiple(componentIds: string[], wireIds: string[]): void {
    this.selection = {
      components: [...componentIds],
      wires: [...wireIds],
    };
    this.emit('selectionChanged', this.selection);
  }

  /**
   * Clear selection.
   */
  clearSelection(): void {
    if (this.selection.components.length > 0 || this.selection.wires.length > 0) {
      this.selection = { components: [], wires: [] };
      this.emit('selectionChanged', this.selection);
    }
  }

  /**
   * Delete selected items.
   */
  deleteSelection(): void {
    if (this.selection.components.length === 0 && this.selection.wires.length === 0) {
      return;
    }

    this.saveUndoState();

    // Delete wires first
    for (const wireId of [...this.selection.wires]) {
      this.removeWireInternal(wireId);
    }

    // Delete components (this also removes their wires)
    for (const componentId of [...this.selection.components]) {
      const index = this.circuit.components.findIndex((c) => c.id === componentId);
      if (index !== -1) {
        const wiresToRemove = this.circuit.wires.filter(
          (w) => w.sourceComponent === componentId || w.targetComponent === componentId
        );
        for (const wire of wiresToRemove) {
          this.removeWireInternal(wire.id);
        }
        const component = this.circuit.components[index];
        this.circuit.components.splice(index, 1);
        this.circuit.inputs = this.circuit.inputs.filter((p) => p.componentId !== componentId);
        this.circuit.outputs = this.circuit.outputs.filter((p) => p.componentId !== componentId);
        this.emit('componentRemoved', component);
      }
    }

    this.selection = { components: [], wires: [] };
    this.circuit.modifiedAt = Date.now();
    this.emit('selectionChanged', this.selection);
  }

  // ============================================================================
  // Undo/Redo
  // ============================================================================

  /**
   * Save current state to undo stack.
   */
  private saveUndoState(): void {
    // Deep clone the circuit
    const snapshot = JSON.parse(JSON.stringify(this.circuit)) as BuilderCircuit;
    this.undoStack.push(snapshot);

    // Limit undo stack size
    if (this.undoStack.length > this.maxUndoLevels) {
      this.undoStack.shift();
    }

    // Clear redo stack on new action
    this.redoStack = [];
  }

  /**
   * Check if undo is available.
   */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * Check if redo is available.
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Undo the last action.
   */
  undo(): boolean {
    if (!this.canUndo()) return false;

    // Save current state to redo stack
    const currentSnapshot = JSON.parse(JSON.stringify(this.circuit)) as BuilderCircuit;
    this.redoStack.push(currentSnapshot);

    // Restore previous state
    this.circuit = this.undoStack.pop()!;
    this.selection = { components: [], wires: [] };

    this.emit('circuitLoaded', this.circuit);
    this.emit('selectionChanged', this.selection);
    return true;
  }

  /**
   * Redo the last undone action.
   */
  redo(): boolean {
    if (!this.canRedo()) return false;

    // Save current state to undo stack
    const currentSnapshot = JSON.parse(JSON.stringify(this.circuit)) as BuilderCircuit;
    this.undoStack.push(currentSnapshot);

    // Restore next state
    this.circuit = this.redoStack.pop()!;
    this.selection = { components: [], wires: [] };

    this.emit('circuitLoaded', this.circuit);
    this.emit('selectionChanged', this.selection);
    return true;
  }

  // ============================================================================
  // Circuit Operations
  // ============================================================================

  /**
   * Clear the circuit (remove all components and wires).
   */
  clear(): void {
    this.saveUndoState();

    this.circuit.components = [];
    this.circuit.wires = [];
    this.circuit.inputs = [];
    this.circuit.outputs = [];
    this.circuit.modifiedAt = Date.now();

    this.selection = { components: [], wires: [] };

    this.emit('circuitLoaded', this.circuit);
    this.emit('selectionChanged', this.selection);
  }

  /**
   * Load a circuit from data.
   * @param circuit Circuit data to load
   */
  loadCircuit(circuit: BuilderCircuit): void {
    this.saveUndoState();

    this.circuit = JSON.parse(JSON.stringify(circuit)) as BuilderCircuit;
    this.selection = { components: [], wires: [] };

    this.emit('circuitLoaded', this.circuit);
    this.emit('selectionChanged', this.selection);
  }

  /**
   * Create a new empty circuit.
   * @param name Circuit name
   * @param era Technology era
   */
  newCircuit(name: string = 'Untitled', era: Era = 'relay'): void {
    this.saveUndoState();

    this.circuit = createEmptyCircuit(name, era);
    this.selection = { components: [], wires: [] };

    this.emit('circuitLoaded', this.circuit);
    this.emit('selectionChanged', this.selection);
  }

  /**
   * Export circuit as JSON.
   */
  exportCircuit(): string {
    return JSON.stringify(this.circuit, null, 2);
  }

  /**
   * Import circuit from JSON.
   * @param json JSON string
   * @returns True if import was successful
   */
  importCircuit(json: string): boolean {
    try {
      const circuit = JSON.parse(json) as BuilderCircuit;

      // Basic validation
      if (!circuit.id || !circuit.name || !Array.isArray(circuit.components)) {
        console.warn('Invalid circuit format');
        return false;
      }

      this.loadCircuit(circuit);
      return true;
    } catch {
      console.warn('Failed to parse circuit JSON');
      return false;
    }
  }

  // ============================================================================
  // Event System
  // ============================================================================

  /**
   * Subscribe to builder events.
   * @param eventType Event type to listen for
   * @param callback Callback function
   * @returns Unsubscribe function
   */
  on(eventType: BuilderEventType, callback: BuilderEventCallback): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType)!.add(callback);

    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }

  /**
   * Emit an event to all listeners.
   * @param type Event type
   * @param data Event data
   */
  private emit(type: BuilderEventType, data?: unknown): void {
    const event: BuilderEvent = {
      type,
      data,
      timestamp: Date.now(),
    };

    const callbacks = this.listeners.get(type);
    if (callbacks) {
      for (const callback of callbacks) {
        try {
          callback(event);
        } catch (err) {
          console.error(`Error in builder event handler for ${type}:`, err);
        }
      }
    }
  }

  /**
   * Remove all event listeners.
   */
  clearListeners(): void {
    this.listeners.clear();
  }

  // ============================================================================
  // Validation and Analysis
  // ============================================================================

  /**
   * Check if a port has a connection.
   * @param componentId Component ID
   * @param portId Port ID
   * @returns True if port is connected
   */
  isPortConnected(componentId: string, portId: string): boolean {
    return this.circuit.wires.some(
      (w) =>
        (w.sourceComponent === componentId && w.sourcePort === portId) ||
        (w.targetComponent === componentId && w.targetPort === portId)
    );
  }

  /**
   * Get port position in canvas coordinates.
   * @param componentId Component ID
   * @param portId Port ID
   * @returns Position or null if not found
   */
  getPortPosition(componentId: string, portId: string): Position | null {
    const component = this.getComponent(componentId);
    if (!component) return null;

    const definition = getComponentDefinition(component.definitionId);
    if (!definition) return null;

    const port = definition.ports.find((p) => p.id === portId);
    if (!port) return null;

    // Calculate position accounting for rotation
    const { x: px, y: py } = port.position;
    const { x: cx, y: cy } = component.position;
    const { width, height } = definition;

    let rotatedX = px;
    let rotatedY = py;

    switch (component.rotation) {
      case 90:
        rotatedX = height - py;
        rotatedY = px;
        break;
      case 180:
        rotatedX = width - px;
        rotatedY = height - py;
        break;
      case 270:
        rotatedX = py;
        rotatedY = width - px;
        break;
    }

    return {
      x: cx + rotatedX,
      y: cy + rotatedY,
    };
  }

  /**
   * Get component at a position (hit test).
   * @param position Position to test
   * @returns Component ID or null
   */
  getComponentAtPosition(position: Position): string | null {
    for (const component of this.circuit.components) {
      const definition = getComponentDefinition(component.definitionId);
      if (!definition) continue;

      const { x, y } = component.position;
      const { width, height } = definition;

      // Account for rotation
      let effectiveWidth = width;
      let effectiveHeight = height;
      if (component.rotation === 90 || component.rotation === 270) {
        effectiveWidth = height;
        effectiveHeight = width;
      }

      if (
        position.x >= x &&
        position.x <= x + effectiveWidth &&
        position.y >= y &&
        position.y <= y + effectiveHeight
      ) {
        return component.id;
      }
    }

    return null;
  }

  /**
   * Get port at a position (for wire connections).
   * @param position Position to test
   * @param tolerance Hit tolerance in pixels
   * @returns {componentId, portId} or null
   */
  getPortAtPosition(
    position: Position,
    tolerance: number = 10
  ): { componentId: string; portId: string } | null {
    for (const component of this.circuit.components) {
      const definition = getComponentDefinition(component.definitionId);
      if (!definition) continue;

      for (const port of definition.ports) {
        const portPos = this.getPortPosition(component.id, port.id);
        if (!portPos) continue;

        const dx = position.x - portPos.x;
        const dy = position.y - portPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= tolerance) {
          return { componentId: component.id, portId: port.id };
        }
      }
    }

    return null;
  }
}
