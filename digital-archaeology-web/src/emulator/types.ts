/**
 * Emulator Module Type Definitions
 *
 * TypeScript interfaces for the Micro4 assembler and CPU emulator WASM modules
 * and related types for worker communication.
 */

/**
 * Emscripten module interface for the Micro4 assembler.
 *
 * This interface describes the WASM module loaded via the
 * Emscripten-generated JavaScript glue code.
 *
 * @example
 * ```typescript
 * // In a Web Worker:
 * const createModule = await import('/wasm/micro4-asm.js');
 * const Module: AssemblerModule = await createModule.default();
 *
 * // Assemble source code
 * const success = Module.ccall('assemble_source', 'number', ['string'], [source]);
 * ```
 */
export interface AssemblerModule {
  /**
   * Call a C function by name.
   *
   * @param name - The C function name (without leading underscore)
   * @param returnType - The return type ('number', 'string', 'null')
   * @param argTypes - Array of argument types ('number', 'string', 'array')
   * @param args - Array of argument values
   * @returns The function's return value
   */
  ccall: (
    name: string,
    returnType: 'number' | 'string' | null,
    argTypes: Array<'number' | 'string' | 'array'>,
    args: unknown[]
  ) => number | string | null;

  /**
   * Create a wrapped JavaScript function for calling C code.
   *
   * @param name - The C function name (without leading underscore)
   * @param returnType - The return type
   * @param argTypes - Array of argument types
   * @returns A JavaScript function that calls the C function
   */
  cwrap: (
    name: string,
    returnType: 'number' | 'string' | null,
    argTypes: Array<'number' | 'string'>
  ) => (...args: unknown[]) => number | string | null;

  /**
   * Direct access to the WASM heap as a Uint8Array.
   * Used for reading binary output from the assembler.
   */
  HEAPU8: Uint8Array;

  /**
   * Convert a pointer to a null-terminated UTF8 string.
   *
   * @param ptr - Pointer to the string in WASM memory
   * @param maxLength - Optional maximum length to read
   * @returns The JavaScript string
   */
  UTF8ToString: (ptr: number, maxLength?: number) => string;

  /**
   * Write a JavaScript string to WASM memory as UTF8.
   *
   * @param str - The string to write
   * @param outPtr - Pointer to the destination buffer
   * @param maxBytes - Maximum bytes to write (including null terminator)
   */
  stringToUTF8: (str: string, outPtr: number, maxBytes: number) => void;

  /**
   * Calculate the number of bytes needed to store a string as UTF8.
   *
   * @param str - The string to measure
   * @returns Number of bytes (not including null terminator)
   */
  lengthBytesUTF8: (str: string) => number;

  /**
   * Allocate memory in the WASM heap.
   *
   * @param size - Number of bytes to allocate
   * @returns Pointer to allocated memory
   */
  _malloc: (size: number) => number;

  /**
   * Free previously allocated memory.
   *
   * @param ptr - Pointer to memory to free
   */
  _free: (ptr: number) => void;

  /**
   * Assemble source code.
   *
   * IMPORTANT: This function takes a POINTER to a null-terminated string
   * in WASM memory, not a JavaScript string directly. Use stringToUTF8
   * to write the source string to WASM memory first, then pass the pointer.
   *
   * Usage pattern:
   * ```typescript
   * const bytes = Module.lengthBytesUTF8(source) + 1;
   * const ptr = Module._malloc(bytes);
   * Module.stringToUTF8(source, ptr, bytes);
   * const success = Module._assemble_source(ptr);
   * Module._free(ptr);
   * ```
   *
   * Alternatively, use ccall with 'string' type for automatic conversion:
   * ```typescript
   * const success = Module.ccall('assemble_source', 'number', ['string'], [source]);
   * ```
   *
   * @param sourcePtr - Pointer to null-terminated source string in WASM memory
   * @returns 1 on success, 0 on failure
   */
  _assemble_source: (sourcePtr: number) => number;

  /**
   * Get pointer to assembled binary output.
   *
   * @returns Pointer to output array in WASM memory
   */
  _get_output: () => number;

  /**
   * Get size of assembled binary output.
   *
   * @returns Number of bytes in output
   */
  _get_output_size: () => number;

  /**
   * Get pointer to error message string.
   *
   * @returns Pointer to null-terminated error string
   */
  _get_error: () => number;

  /**
   * Get line number where error occurred.
   *
   * @returns Line number (1-based) or 0 if no error
   */
  _get_error_line: () => number;
}

/**
 * Factory function type for creating the AssemblerModule.
 * This is the default export of the Emscripten-generated JS file.
 */
export type AssemblerModuleFactory = () => Promise<AssemblerModule>;

/**
 * Result of an assembly operation.
 */
export interface AssembleResult {
  /** Whether assembly succeeded */
  success: boolean;
  /** Assembled binary (nibbles) if successful, null otherwise */
  binary: Uint8Array | null;
  /** Error details if assembly failed, null otherwise */
  error: AssemblerError | null;
}

/**
 * Error type classification for assembly errors.
 * Used for visual categorization and error-specific handling.
 */
export type AssemblerErrorType =
  | 'SYNTAX_ERROR'
  | 'VALUE_ERROR'
  | 'CONSTRAINT_ERROR'
  | 'RUNTIME_ERROR';

/**
 * Code snippet context for displaying errors with surrounding code.
 */
export interface CodeSnippet {
  /** The actual error line content */
  line: string;
  /** The line number (1-based) */
  lineNumber: number;
  /** Lines before the error (for context) */
  contextBefore?: string[];
  /** Lines after the error (for context) */
  contextAfter?: string[];
}

/**
 * Assembly error details.
 */
export interface AssemblerError {
  /** Line number where error occurred (1-based) */
  line: number;
  /** Column number where error occurred (1-based), if available */
  column?: number;
  /** Human-readable error message */
  message: string;
  /** Suggested fix, if available */
  suggestion?: string;
  /** Error type classification for visual categorization */
  type?: AssemblerErrorType;
  /** Code snippet with context for display */
  codeSnippet?: CodeSnippet;
  /** Whether this error can be auto-fixed */
  fixable?: boolean;
}

/**
 * Message types for Worker communication.
 *
 * Commands are sent from main thread to worker.
 * Events are sent from worker to main thread.
 */

/**
 * Command to assemble source code.
 */
export interface AssembleCommand {
  type: 'ASSEMBLE';
  payload: {
    /** Assembly source code */
    source: string;
  };
}

/**
 * Event indicating assembly completed successfully.
 */
export interface AssembleSuccessEvent {
  type: 'ASSEMBLE_SUCCESS';
  payload: {
    /** Assembled binary as array of nibble values */
    binary: number[];
    /** Number of bytes generated */
    size: number;
  };
}

/**
 * Event indicating assembly failed.
 */
export interface AssembleErrorEvent {
  type: 'ASSEMBLE_ERROR';
  payload: AssemblerError;
}

/**
 * Event indicating the worker is ready (WASM loaded).
 */
export interface WorkerReadyEvent {
  type: 'WORKER_READY';
}

/**
 * Union of all assembler commands (main → worker).
 */
export type AssemblerCommand = AssembleCommand;

/**
 * Union of all assembler events (worker → main).
 */
export type AssemblerEvent =
  | AssembleSuccessEvent
  | AssembleErrorEvent
  | WorkerReadyEvent;

/**
 * Required exports from the WASM assembler module.
 * Used for runtime validation that the module loaded correctly.
 */
export const REQUIRED_WASM_EXPORTS = [
  '_assemble_source',
  '_get_output',
  '_get_output_size',
  '_get_error',
  '_get_error_line',
  '_malloc',
  '_free',
] as const;

/**
 * Required Emscripten runtime methods.
 * Used for runtime validation that the module loaded correctly.
 */
export const REQUIRED_RUNTIME_METHODS = [
  'ccall',
  'cwrap',
  'HEAPU8',
  'UTF8ToString',
  'stringToUTF8',
  'lengthBytesUTF8',
] as const;

/**
 * Validation error for missing WASM exports.
 */
export interface WasmValidationError {
  missingExports: string[];
  missingRuntimeMethods: string[];
}

/**
 * Validates that a loaded module has all required exports.
 *
 * @param module - The loaded Emscripten module to validate
 * @returns null if valid, or a WasmValidationError describing missing exports
 *
 * @example
 * ```typescript
 * const Module = await createModule();
 * const error = validateAssemblerModule(Module);
 * if (error) {
 *   throw new Error(`WASM validation failed: missing ${error.missingExports.join(', ')}`);
 * }
 * ```
 */
export function validateAssemblerModule(
  module: unknown
): WasmValidationError | null {
  if (!module || typeof module !== 'object') {
    return {
      missingExports: [...REQUIRED_WASM_EXPORTS],
      missingRuntimeMethods: [...REQUIRED_RUNTIME_METHODS],
    };
  }

  const mod = module as Record<string, unknown>;

  const missingExports = REQUIRED_WASM_EXPORTS.filter(
    (name) => typeof mod[name] !== 'function'
  );

  const missingRuntimeMethods = REQUIRED_RUNTIME_METHODS.filter((name) => {
    if (name === 'HEAPU8') {
      return !(mod[name] instanceof Uint8Array);
    }
    return typeof mod[name] !== 'function';
  });

  if (missingExports.length === 0 && missingRuntimeMethods.length === 0) {
    return null;
  }

  return { missingExports, missingRuntimeMethods };
}

/* ============================================================================
 * CPU Emulator Module Types
 * ============================================================================ */

/**
 * Emscripten module interface for the Micro4 CPU emulator.
 *
 * This interface describes the WASM module loaded via the
 * Emscripten-generated JavaScript glue code (micro4-cpu.js).
 *
 * @example
 * ```typescript
 * // In a Web Worker:
 * const createModule = await import('/wasm/micro4-cpu.js');
 * const Module: EmulatorModule = await createModule.default();
 *
 * // Initialize and run CPU
 * Module._cpu_init_instance();
 * const cycles = Module._cpu_step_instance();
 * ```
 */
export interface EmulatorModule {
  /**
   * Call a C function by name.
   */
  ccall: (
    name: string,
    returnType: 'number' | 'string' | null,
    argTypes: Array<'number' | 'string' | 'array'>,
    args: unknown[]
  ) => number | string | null;

  /**
   * Create a wrapped JavaScript function for calling C code.
   */
  cwrap: (
    name: string,
    returnType: 'number' | 'string' | null,
    argTypes: Array<'number' | 'string'>
  ) => (...args: unknown[]) => number | string | null;

  /**
   * Direct access to the WASM heap as a Uint8Array.
   * Used for reading CPU memory and loading programs.
   */
  HEAPU8: Uint8Array;

  /**
   * Convert a pointer to a null-terminated UTF8 string.
   */
  UTF8ToString: (ptr: number, maxLength?: number) => string;

  /**
   * Allocate memory in the WASM heap.
   */
  _malloc: (size: number) => number;

  /**
   * Free previously allocated memory.
   */
  _free: (ptr: number) => void;

  /* CPU Lifecycle Functions */

  /**
   * Initialize the CPU to its default state.
   * Must be called before any other CPU operations.
   */
  _cpu_init_instance: () => void;

  /**
   * Reset the CPU state while preserving memory contents.
   */
  _cpu_reset_instance: () => void;

  /**
   * Execute one instruction.
   * @returns Number of cycles consumed (0 if halted or error)
   */
  _cpu_step_instance: () => number;

  /**
   * Load a program into CPU memory.
   *
   * @param ptr - Pointer to program data in WASM memory (use _malloc)
   * @param size - Number of nibbles to load
   * @param addr - Starting address in CPU memory (0-255)
   */
  _cpu_load_program_instance: (ptr: number, size: number, addr: number) => void;

  /* State Accessors */

  /**
   * Get the current Program Counter value.
   * @returns 8-bit PC value (0-255)
   */
  _get_pc: () => number;

  /**
   * Get the current Accumulator value.
   * @returns 4-bit value (0-15)
   */
  _get_accumulator: () => number;

  /**
   * Get the Zero flag status.
   * @returns 1 if zero flag is set, 0 otherwise
   */
  _get_zero_flag: () => number;

  /**
   * Check if the CPU has halted.
   * @returns 1 if halted, 0 if still running
   */
  _is_halted: () => number;

  /**
   * Check if the CPU has encountered an error.
   * @returns 1 if error occurred, 0 otherwise
   */
  _has_error: () => number;

  /**
   * Get pointer to the error message string.
   *
   * IMPORTANT: The returned pointer is valid only until the next CPU operation.
   * Copy the string immediately using UTF8ToString() before calling any other
   * CPU functions (init, reset, step, load_program).
   *
   * @returns Pointer to null-terminated error string, use UTF8ToString() to convert
   */
  _get_error_message: () => number;

  /**
   * Get pointer to the CPU memory array.
   *
   * Usage: Create a fresh Uint8Array view each time you read memory:
   *   new Uint8Array(Module.HEAPU8.buffer, Module._get_memory_ptr(), 256)
   *
   * IMPORTANT: Do NOT cache this view. With ALLOW_MEMORY_GROWTH=1, the
   * underlying ArrayBuffer can be replaced when WASM memory grows,
   * invalidating any previously created views.
   *
   * @returns Pointer to the 256-nibble memory array
   */
  _get_memory_ptr: () => number;

  /* Internal Registers (for debugging/visualization) */

  /**
   * Get the Instruction Register value.
   * @returns 8-bit IR value
   */
  _get_ir: () => number;

  /**
   * Get the Memory Address Register value.
   * @returns 8-bit MAR value
   */
  _get_mar: () => number;

  /**
   * Get the Memory Data Register value.
   * @returns 4-bit MDR value
   */
  _get_mdr: () => number;

  /* Statistics */

  /**
   * Get total CPU cycles executed.
   *
   * Note: The C function returns uint64_t, but JavaScript numbers safely
   * represent integers only up to 2^53-1 (~9 quadrillion). For typical
   * Micro4 programs this is not a concern, but very long-running programs
   * may experience precision loss.
   *
   * @returns Cycle count as JavaScript number
   */
  _get_cycles: () => number;

  /**
   * Get total instructions executed.
   *
   * Note: The C function returns uint64_t, but JavaScript numbers safely
   * represent integers only up to 2^53-1 (~9 quadrillion). For typical
   * Micro4 programs this is not a concern, but very long-running programs
   * may experience precision loss.
   *
   * @returns Instruction count as JavaScript number
   */
  _get_instructions: () => number;
}

/**
 * Factory function type for creating the EmulatorModule.
 * This is the default export of the Emscripten-generated JS file.
 */
export type EmulatorModuleFactory = () => Promise<EmulatorModule>;

/**
 * CPU state snapshot for UI updates.
 * Contains all visible CPU state for rendering.
 */
export interface CPUState {
  /** Program Counter (0-255) */
  pc: number;
  /** Accumulator (0-15) */
  accumulator: number;
  /** Zero flag */
  zeroFlag: boolean;
  /** CPU has halted (HLT or error) */
  halted: boolean;
  /** Error occurred during execution */
  error: boolean;
  /** Error message if error is true */
  errorMessage: string | null;
  /** Copy of CPU memory (256 nibbles) */
  memory: Uint8Array;
  /** Instruction Register - last fetched instruction */
  ir: number;
  /** Memory Address Register - last memory address accessed */
  mar: number;
  /** Memory Data Register - last data read/written */
  mdr: number;
  /** Total CPU cycles executed */
  cycles: number;
  /** Total instructions executed */
  instructions: number;
}

/* ============================================================================
 * Emulator Worker Message Protocol
 * ============================================================================ */

/**
 * Command to load a program into CPU memory.
 */
export interface LoadProgramCommand {
  type: 'LOAD_PROGRAM';
  payload: {
    /** Assembled binary (nibbles) */
    binary: Uint8Array;
    /** Starting address (default: 0) */
    startAddr?: number;
  };
}

/**
 * Command to execute a single instruction.
 */
export interface StepCommand {
  type: 'STEP';
}

/**
 * Command to run continuously at specified speed.
 */
export interface RunCommand {
  type: 'RUN';
  payload: {
    /** Instructions per second (0 = max speed) */
    speed: number;
  };
}

/**
 * Command to stop continuous execution.
 */
export interface StopCommand {
  type: 'STOP';
}

/**
 * Command to reset the CPU (keep memory).
 */
export interface ResetCommand {
  type: 'RESET';
}

/**
 * Command to request current CPU state.
 */
export interface GetStateCommand {
  type: 'GET_STATE';
}

/**
 * Command to restore CPU to a specific state (Story 5.2).
 * Used for step-back functionality to revert to a previous state snapshot.
 */
export interface RestoreStateCommand {
  type: 'RESTORE_STATE';
  payload: CPUState;
}

/**
 * Command to change execution speed while running.
 * Only takes effect if the emulator is currently running.
 */
export interface SetSpeedCommand {
  type: 'SET_SPEED';
  payload: {
    /** New execution speed (0 = max speed, >0 = instructions per ~16ms tick) */
    speed: number;
  };
}

/**
 * Command to set a breakpoint at a specific address (Story 5.8).
 */
export interface SetBreakpointCommand {
  type: 'SET_BREAKPOINT';
  payload: {
    /** Memory address to set breakpoint at (0-255 for Micro4) */
    address: number;
  };
}

/**
 * Command to clear a breakpoint at a specific address (Story 5.8).
 */
export interface ClearBreakpointCommand {
  type: 'CLEAR_BREAKPOINT';
  payload: {
    /** Memory address to clear breakpoint from (0-255 for Micro4) */
    address: number;
  };
}

/**
 * Command to get all current breakpoints (Story 5.8).
 */
export interface GetBreakpointsCommand {
  type: 'GET_BREAKPOINTS';
}

/**
 * Union of all emulator commands (main → worker).
 */
export type EmulatorCommand =
  | LoadProgramCommand
  | StepCommand
  | RunCommand
  | StopCommand
  | ResetCommand
  | GetStateCommand
  | RestoreStateCommand
  | SetSpeedCommand
  | SetBreakpointCommand
  | ClearBreakpointCommand
  | GetBreakpointsCommand;

/**
 * Event with updated CPU state.
 */
export interface StateUpdateEvent {
  type: 'STATE_UPDATE';
  payload: CPUState;
}

/**
 * Event indicating CPU has halted.
 */
export interface HaltedEvent {
  type: 'HALTED';
}

/**
 * Runtime error type classification (Story 5.10).
 * Used to categorize errors for visual display and circuit component linking.
 */
export type RuntimeErrorType =
  | 'MEMORY_ERROR'
  | 'ARITHMETIC_WARNING'
  | 'INVALID_OPCODE'
  | 'STACK_OVERFLOW'
  | 'UNKNOWN_ERROR';

/**
 * Signal value for circuit visualization (Story 5.10).
 * Represents a signal name and its current value.
 */
export interface SignalValue {
  /** Signal name (e.g., "ALU_OUT", "MEM_ADDR") */
  name: string;
  /** Signal value (typically 0 or 1, or a numeric value) */
  value: number;
}

/**
 * Rich context for runtime errors (Story 5.10).
 * Provides detailed information for debugging and circuit visualization.
 */
export interface RuntimeErrorContext {
  /** Classified error type for visual display */
  errorType: RuntimeErrorType;
  /** Program counter at error */
  pc: number;
  /** Instruction mnemonic (e.g., "LDA", "STO", "ADD") */
  instruction: string;
  /** Raw opcode value */
  opcode: number;
  /** Circuit component name (e.g., "ALU", "Memory Controller") */
  componentName?: string;
  /** Relevant signal values at time of error */
  signalValues?: SignalValue[];
}

/**
 * Event indicating a runtime error occurred.
 */
export interface EmulatorErrorEvent {
  type: 'ERROR';
  payload: {
    /** Error message */
    message: string;
    /** Address where error occurred */
    address?: number;
    /** Rich error context for debugging (Story 5.10) */
    context?: RuntimeErrorContext;
  };
}

/**
 * Event indicating a breakpoint was hit.
 */
export interface BreakpointHitEvent {
  type: 'BREAKPOINT_HIT';
  payload: {
    /** Address of the breakpoint */
    address: number;
  };
}

/**
 * Event indicating the emulator worker is ready.
 */
export interface EmulatorReadyEvent {
  type: 'EMULATOR_READY';
}

/**
 * Event containing the current list of breakpoints (Story 5.8).
 * Sent in response to GET_BREAKPOINTS or after SET/CLEAR_BREAKPOINT.
 */
export interface BreakpointsListEvent {
  type: 'BREAKPOINTS_LIST';
  payload: {
    /** Array of breakpoint addresses */
    addresses: number[];
  };
}

/**
 * Union of all emulator events (worker → main).
 */
export type EmulatorEvent =
  | StateUpdateEvent
  | HaltedEvent
  | EmulatorErrorEvent
  | BreakpointHitEvent
  | EmulatorReadyEvent
  | BreakpointsListEvent;

/* ============================================================================
 * Emulator Module Validation
 * ============================================================================ */

/**
 * Required exports from the WASM emulator module.
 * Used for runtime validation that the module loaded correctly.
 */
export const REQUIRED_EMULATOR_EXPORTS = [
  '_cpu_init_instance',
  '_cpu_reset_instance',
  '_cpu_step_instance',
  '_cpu_load_program_instance',
  '_get_pc',
  '_get_accumulator',
  '_get_zero_flag',
  '_is_halted',
  '_has_error',
  '_get_error_message',
  '_get_memory_ptr',
  '_get_ir',
  '_get_mar',
  '_get_mdr',
  '_get_cycles',
  '_get_instructions',
  '_malloc',
  '_free',
] as const;

/**
 * Required Emscripten runtime methods for the emulator module.
 */
export const REQUIRED_EMULATOR_RUNTIME_METHODS = [
  'ccall',
  'cwrap',
  'HEAPU8',
  'UTF8ToString',
] as const;

/**
 * Validation error for missing emulator WASM exports.
 */
export interface EmulatorValidationError {
  missingExports: string[];
  missingRuntimeMethods: string[];
}

/**
 * Validates that a loaded emulator module has all required exports.
 *
 * @param module - The loaded Emscripten module to validate
 * @returns null if valid, or an EmulatorValidationError describing missing exports
 *
 * @example
 * ```typescript
 * const Module = await createModule();
 * const error = validateEmulatorModule(Module);
 * if (error) {
 *   throw new Error(`WASM validation failed: missing ${error.missingExports.join(', ')}`);
 * }
 * ```
 */
export function validateEmulatorModule(
  module: unknown
): EmulatorValidationError | null {
  if (!module || typeof module !== 'object') {
    return {
      missingExports: [...REQUIRED_EMULATOR_EXPORTS],
      missingRuntimeMethods: [...REQUIRED_EMULATOR_RUNTIME_METHODS],
    };
  }

  const mod = module as Record<string, unknown>;

  const missingExports = REQUIRED_EMULATOR_EXPORTS.filter(
    (name) => typeof mod[name] !== 'function'
  );

  const missingRuntimeMethods = REQUIRED_EMULATOR_RUNTIME_METHODS.filter(
    (name) => {
      if (name === 'HEAPU8') {
        return !(mod[name] instanceof Uint8Array);
      }
      return typeof mod[name] !== 'function';
    }
  );

  if (missingExports.length === 0 && missingRuntimeMethods.length === 0) {
    return null;
  }

  return { missingExports, missingRuntimeMethods };
}
