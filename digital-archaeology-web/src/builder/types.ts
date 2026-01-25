// src/builder/types.ts
// TypeScript interfaces for the Circuit Builder feature

/**
 * Technology era for circuit building progression.
 * Users start with relays and unlock later eras by building gates.
 */
export type Era = 'relay' | 'transistor' | 'cmos' | 'gate';

/**
 * Base component types available in the builder.
 * - relay_no: Normally Open relay - closes when coil is energized
 * - relay_nc: Normally Closed relay - opens when coil is energized
 * - power: Power source (VCC)
 * - ground: Ground connection
 * - input: External input signal
 * - output: External output signal
 * - user_gate: User-created custom gate
 */
export type ComponentType =
  | 'relay_no'
  | 'relay_nc'
  | 'power'
  | 'ground'
  | 'input'
  | 'output'
  | 'user_gate';

/**
 * Direction of a port (signal flow).
 */
export type PortDirection = 'input' | 'output' | 'bidirectional';

/**
 * Position in 2D canvas space.
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Definition of a connection port on a component.
 * Ports are where wires can connect.
 */
export interface PortDefinition {
  /** Unique identifier within the component */
  id: string;
  /** Human-readable name (e.g., "coil_in", "contact_out") */
  name: string;
  /** Signal flow direction */
  direction: PortDirection;
  /** Position relative to component origin (top-left) */
  position: Position;
}

/**
 * Definition of a component type (template).
 * Describes a component's ports and behavior.
 */
export interface ComponentDefinition {
  /** Unique identifier (e.g., "relay_no", "user_not") */
  id: string;
  /** Human-readable display name */
  name: string;
  /** Component type category */
  type: ComponentType;
  /** Technology era this component belongs to */
  era: Era;
  /** Port definitions for this component */
  ports: PortDefinition[];
  /** Whether this component is currently locked */
  locked: boolean;
  /** Description of what unlocks this component */
  unlockRequirement?: string;
  /** Symbol/icon for rendering (SVG path or key) */
  symbol?: string;
  /** Width in canvas units */
  width: number;
  /** Height in canvas units */
  height: number;
}

/**
 * Instance of a component placed on the canvas.
 * References a ComponentDefinition and has position/state.
 */
export interface ComponentInstance {
  /** Unique instance identifier */
  id: string;
  /** Reference to ComponentDefinition.id */
  definitionId: string;
  /** Position on the canvas */
  position: Position;
  /** Rotation in degrees (0, 90, 180, 270) */
  rotation: 0 | 90 | 180 | 270;
  /** User-defined label (optional) */
  label?: string;
  /** Runtime state (for simulation) */
  state?: ComponentState;
}

/**
 * Runtime state for a component during simulation.
 */
export interface ComponentState {
  /** For relays: whether the coil is energized */
  coilEnergized?: boolean;
  /** For relays: whether the switch is closed */
  switchClosed?: boolean;
  /** Port values (signal levels) */
  portValues: Map<string, SignalValue>;
}

/**
 * Signal value (logic level).
 * - 0: Low (false, ground)
 * - 1: High (true, power)
 * - 2: Unknown/undefined (X)
 */
export type SignalValue = 0 | 1 | 2;

/**
 * A wire connecting two ports.
 */
export interface WireConnection {
  /** Unique wire identifier */
  id: string;
  /** Source component instance ID */
  sourceComponent: string;
  /** Source port ID on the component */
  sourcePort: string;
  /** Target component instance ID */
  targetComponent: string;
  /** Target port ID on the component */
  targetPort: string;
  /** Waypoints for wire routing (optional) */
  waypoints: Position[];
  /** Current signal value */
  signal?: SignalValue;
}

/**
 * External port definition (circuit input/output).
 * Maps to input/output component types.
 */
export interface ExternalPort {
  /** Port identifier */
  id: string;
  /** Display name */
  name: string;
  /** Direction (input to circuit or output from circuit) */
  direction: 'input' | 'output';
  /** Connected component instance ID */
  componentId: string;
}

/**
 * Complete circuit definition.
 * Contains all components, wires, and metadata.
 */
export interface BuilderCircuit {
  /** Unique circuit identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Technology era */
  era: Era;
  /** All placed components */
  components: ComponentInstance[];
  /** All wire connections */
  wires: WireConnection[];
  /** External inputs (for testing/simulation) */
  inputs: ExternalPort[];
  /** External outputs (for verification) */
  outputs: ExternalPort[];
  /** Creation timestamp */
  createdAt?: number;
  /** Last modified timestamp */
  modifiedAt?: number;
  /** Optional description */
  description?: string;
}

/**
 * User's progress through the builder.
 * Tracks unlocked components and saved gates.
 */
export interface UserProgress {
  /** Current technology era */
  currentEra: Era;
  /** IDs of unlocked component definitions */
  unlockedComponents: string[];
  /** IDs of user-created saved gates */
  savedGates: string[];
  /** Earned achievements/badges */
  achievements: string[];
  /** Statistics */
  stats: ProgressStats;
}

/**
 * Progress statistics.
 */
export interface ProgressStats {
  /** Total circuits created */
  circuitsCreated: number;
  /** Total components placed */
  componentsPlaced: number;
  /** Total wires drawn */
  wiresDrawn: number;
  /** Successful gate unlocks */
  gatesUnlocked: number;
}

/**
 * Truth table for verifying gate behavior.
 * Used to check if a user-built circuit matches expected gate behavior.
 */
export interface TruthTable {
  /** Input names in order */
  inputs: string[];
  /** Output names in order */
  outputs: string[];
  /** Rows: each row is [input values..., expected output values...] */
  rows: SignalValue[][];
}

/**
 * Result of verifying a circuit against a truth table.
 */
export interface VerificationResult {
  /** Whether the circuit passes verification */
  passed: boolean;
  /** Which rows passed */
  passedRows: number[];
  /** Which rows failed */
  failedRows: number[];
  /** Error message if failed */
  errorMessage?: string;
}

/**
 * Unlock requirement definition.
 * Describes what a user must build to unlock a component.
 */
export interface UnlockRequirement {
  /** ID of the component to unlock */
  componentId: string;
  /** Display name for the requirement */
  name: string;
  /** Description of what to build */
  description: string;
  /** Expected truth table */
  truthTable: TruthTable;
  /** Hint text for users */
  hint?: string;
}

/**
 * Selection state in the builder.
 */
export interface SelectionState {
  /** Selected component IDs */
  components: string[];
  /** Selected wire IDs */
  wires: string[];
}

/**
 * Tool mode for the builder.
 */
export type BuilderTool = 'select' | 'wire' | 'pan' | 'delete';

/**
 * Builder editor state.
 */
export interface BuilderEditorState {
  /** Current tool mode */
  tool: BuilderTool;
  /** Current selection */
  selection: SelectionState;
  /** Component being dragged from palette (if any) */
  draggingComponent?: ComponentDefinition;
  /** Wire being drawn (if any) */
  drawingWire?: Partial<WireConnection>;
  /** Zoom level (1.0 = 100%) */
  zoom: number;
  /** Pan offset */
  panOffset: Position;
  /** Grid snapping enabled */
  snapToGrid: boolean;
  /** Grid size in canvas units */
  gridSize: number;
}

/**
 * Builder simulation state.
 */
export interface SimulationState {
  /** Whether simulation is running */
  isRunning: boolean;
  /** Simulation speed (steps per second) */
  speed: number;
  /** Current simulation cycle */
  cycle: number;
  /** Input values for simulation */
  inputValues: Map<string, SignalValue>;
}

/**
 * Event types emitted by the builder.
 */
export type BuilderEventType =
  | 'componentAdded'
  | 'componentRemoved'
  | 'componentMoved'
  | 'wireAdded'
  | 'wireRemoved'
  | 'selectionChanged'
  | 'toolChanged'
  | 'simulationStarted'
  | 'simulationStopped'
  | 'simulationStep'
  | 'gateUnlocked'
  | 'circuitSaved'
  | 'circuitLoaded';

/**
 * Event data for builder events.
 */
export interface BuilderEvent {
  type: BuilderEventType;
  data?: unknown;
  timestamp: number;
}

/**
 * Callback for builder events.
 */
export type BuilderEventCallback = (event: BuilderEvent) => void;
