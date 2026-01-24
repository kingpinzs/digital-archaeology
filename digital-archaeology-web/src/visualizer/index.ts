// Barrel export for visualizer module
// Canvas circuit rendering, animation, interaction

// Story 6.1: Canvas Circuit Renderer
export { CircuitRenderer } from './CircuitRenderer';
export type { CircuitRendererOptions, CircuitRendererState } from './CircuitRenderer';

// Story 6.2: Circuit Data Loading
export { CircuitLoader, CircuitLoadError } from './CircuitLoader';
export { CircuitModel } from './CircuitModel';
export type {
  CircuitData,
  CircuitWire,
  CircuitGate,
  GatePort,
  GateType,
} from './types';
