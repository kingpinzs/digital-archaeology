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

// Story 6.3: Gate Rendering
export { GateRenderer, DEFAULT_GATE_CONFIG } from './GateRenderer';
export type { GateRenderConfig } from './GateRenderer';
export { CircuitLayout, DEFAULT_LAYOUT_CONFIG } from './CircuitLayout';
export type { GatePosition, CircuitLayoutConfig } from './CircuitLayout';
export {
  getGateColor,
  getGateBorderColor,
  getGateTextColor,
  isValidGateType,
  DEFAULT_GATE_COLORS,
  DEFAULT_GATE_STYLE,
  GATE_COLOR_VARS,
  GATE_STYLE_VARS,
} from './gateColors';

// Story 6.4: Wire Rendering
export { WireRenderer, DEFAULT_WIRE_CONFIG } from './WireRenderer';
export type { WireRenderConfig } from './WireRenderer';
export { getWireColor, DEFAULT_WIRE_COLORS, WIRE_COLOR_VARS } from './wireColors';
export type { WirePosition, WireSegment } from './CircuitLayout';
