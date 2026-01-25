// Barrel export for visualizer module
// Canvas circuit rendering, animation, interaction

// Story 6.1: Canvas Circuit Renderer
export { CircuitRenderer } from './CircuitRenderer';
export type { CircuitRendererOptions, CircuitRendererState, AnimationOptions } from './CircuitRenderer';

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

// Story 6.5: Animation
export { AnimationController, DEFAULT_ANIMATION_CONFIG, getAnimationDurationFromCSS } from './AnimationController';
export type { AnimationConfig, FrameCallback, CompleteCallback } from './AnimationController';
export { SignalAnimator } from './SignalAnimator';
export type { SignalSnapshot } from './SignalAnimator';
export { DEFAULT_PULSE_SCALE } from './GateRenderer';
export {
  easeOutQuad,
  calculatePulseScale,
  prefersReducedMotion,
  getPulseScaleFromCSS,
  DEFAULT_PULSE_MAX_SCALE,
  DEFAULT_PULSE_DURATION,
} from './animationUtils';

// Story 6.6: Zoom Controls
export { ZoomController, DEFAULT_ZOOM_CONFIG } from './ZoomController';
export type { ZoomControllerConfig, ZoomOffset, ZoomChangeCallback } from './ZoomController';
export { ZoomControlsToolbar } from './ZoomControlsToolbar';
export type { ZoomControlsCallbacks, ZoomControlsState } from './ZoomControlsToolbar';
export type { ZoomOptions } from './CircuitRenderer';
