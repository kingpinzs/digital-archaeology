/**
 * Emulator Module Type Definitions
 *
 * TypeScript interfaces for the Micro4 assembler WASM module
 * and related emulator types.
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
  | 'CONSTRAINT_ERROR';

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
