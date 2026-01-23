/**
 * Emulator Module
 *
 * WASM-based Micro4 assembler and CPU emulator.
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
} from './types';

// Runtime exports (validation helpers)
export {
  validateAssemblerModule,
  REQUIRED_WASM_EXPORTS,
  REQUIRED_RUNTIME_METHODS,
  validateEmulatorModule,
  REQUIRED_EMULATOR_EXPORTS,
  REQUIRED_EMULATOR_RUNTIME_METHODS,
} from './types';

// Bridge exports
export { AssemblerBridge } from './AssemblerBridge';
export { EmulatorBridge } from './EmulatorBridge';
export type {
  StateUpdateCallback,
  HaltedCallback,
  ErrorCallback,
} from './EmulatorBridge';
