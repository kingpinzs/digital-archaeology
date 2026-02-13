/**
 * Emulator Module
 *
 * WASM-based assembler and CPU emulator (Micro4/Micro8).
 * Runs in Web Workers for non-blocking execution.
 */

// Assembler type exports
export type {
  AssemblerModule,
  AssemblerModuleFactory,
  AssembleResult,
  AssemblerError,
  AssemblerErrorType,
  CodeSnippet,
  AssembleCommand,
  AssembleSuccessEvent,
  AssembleErrorEvent,
  WorkerReadyEvent,
  AssemblerCommand,
  AssemblerEvent,
  WasmValidationError,
} from './types';

// Emulator type exports
export type {
  EmulatorModule,
  EmulatorModuleFactory,
  CPUState,
  // Story 12.1: Micro8 emulator types
  Micro8EmulatorModule,
  Micro8EmulatorModuleFactory,
  Micro8CPUState,
  LoadProgramCommand,
  StepCommand,
  RunCommand,
  StopCommand,
  ResetCommand,
  GetStateCommand,
  EmulatorCommand,
  StateUpdateEvent,
  HaltedEvent,
  EmulatorErrorEvent,
  BreakpointHitEvent,
  EmulatorReadyEvent,
  EmulatorEvent,
  EmulatorValidationError,
  // Story 5.10: Rich runtime error types
  RuntimeErrorType,
  RuntimeErrorContext,
  SignalValue,
} from './types';

// Runtime exports (validation helpers)
export {
  validateAssemblerModule,
  REQUIRED_WASM_EXPORTS,
  REQUIRED_RUNTIME_METHODS,
  validateEmulatorModule,
  REQUIRED_EMULATOR_EXPORTS,
  REQUIRED_EMULATOR_RUNTIME_METHODS,
  // Story 12.1: Micro8 validation
  validateMicro8EmulatorModule,
  REQUIRED_MICRO8_EMULATOR_EXPORTS,
  REQUIRED_MICRO8_EMULATOR_RUNTIME_METHODS,
  isMicro8CPUState,
} from './types';

// Bridge exports
export { AssemblerBridge } from './AssemblerBridge';
export { EmulatorBridge } from './EmulatorBridge';
export type {
  StateUpdateCallback,
  HaltedCallback,
  ErrorCallback,
} from './EmulatorBridge';
