/**
 * Emulator Module
 *
 * WASM-based Micro4 assembler and CPU emulator.
 * Runs in Web Workers for non-blocking execution.
 */

// Type exports
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

// Runtime exports (validation helpers)
export {
  validateAssemblerModule,
  REQUIRED_WASM_EXPORTS,
  REQUIRED_RUNTIME_METHODS,
} from './types';

// Bridge exports
export { AssemblerBridge } from './AssemblerBridge';
