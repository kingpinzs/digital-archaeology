// src/builder/index.ts
// Barrel export for the Circuit Builder module

// Types
export type {
  Era,
  ComponentType,
  PortDirection,
  Position,
  PortDefinition,
  ComponentDefinition,
  ComponentInstance,
  ComponentState,
  SignalValue,
  WireConnection,
  ExternalPort,
  BuilderCircuit,
  UserProgress,
  ProgressStats,
  TruthTable,
  VerificationResult,
  UnlockRequirement,
  SelectionState,
  BuilderTool,
  BuilderEditorState,
  SimulationState,
  BuilderEventType,
  BuilderEvent,
  BuilderEventCallback,
} from './types';

// Component Definitions
export {
  RELAY_NO,
  RELAY_NC,
  POWER,
  GROUND,
  INPUT,
  OUTPUT,
  NOT_GATE,
  AND_GATE,
  OR_GATE,
  NAND_GATE,
  NOR_GATE,
  XOR_GATE,
  BASE_COMPONENTS,
  UNLOCKABLE_GATES,
  ALL_COMPONENTS,
  COMPONENT_REGISTRY,
  COMPONENT_SIZES,
  getComponentDefinition,
  getAvailableComponents,
  getUnlockableComponents,
  NOT_TRUTH_TABLE,
  AND_TRUTH_TABLE,
  OR_TRUTH_TABLE,
  NAND_TRUTH_TABLE,
  NOR_TRUTH_TABLE,
  XOR_TRUTH_TABLE,
  TRUTH_TABLE_REGISTRY,
  getTruthTable,
  UNLOCK_REQUIREMENTS,
  getUnlockRequirement,
} from './ComponentDefinitions';

// Builder Model
export { BuilderModel } from './BuilderModel';

// Relay Renderer
export { RelayRenderer, DEFAULT_COMPONENT_COLORS, DEFAULT_RENDER_CONFIG } from './RelayRenderer';
export type { ComponentColors, RenderConfig } from './RelayRenderer';

// Relay Simulator
export { RelaySimulator } from './RelaySimulator';
export type { SimulationResult } from './RelaySimulator';

// Canvas Interaction
export { CanvasInteraction } from './CanvasInteraction';
export type { InteractionState, InteractionCallbacks } from './CanvasInteraction';

// Wire Drawing Tool
export { WireDrawingTool, DEFAULT_WIRE_CONFIG } from './WireDrawingTool';
export type { WireDrawingState, WireDrawingConfig, WireRoutingStyle, Direction } from './WireDrawingTool';

// Main Circuit Builder
export { CircuitBuilder } from './CircuitBuilder';
export type { CircuitBuilderOptions } from './CircuitBuilder';

// UI Components
export { ComponentPalette } from './ComponentPalette';
export type { ComponentPaletteCallbacks, ComponentPaletteState } from './ComponentPalette';

export { PropertiesPanel } from './PropertiesPanel';
export type { PropertiesPanelCallbacks, PropertiesPanelState } from './PropertiesPanel';

// Progress Tracking
export { ProgressTracker, UnlockChecker, ACHIEVEMENTS } from './ProgressTracker';

// Storage
export { BuilderStorage } from './BuilderStorage';
export type { CircuitMetadata, BuilderSettings } from './BuilderStorage';
