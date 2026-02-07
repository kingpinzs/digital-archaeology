/**
 * Assembler Web Worker
 *
 * Runs the Micro4 assembler WASM module in a dedicated worker thread
 * to avoid blocking the UI during assembly operations.
 */

/// <reference lib="webworker" />

import type {
  AssemblerModule,
  AssemblerCommand,
  AssembleSuccessEvent,
  AssembleErrorEvent,
  WorkerReadyEvent,
} from './types';
import { validateAssemblerModule } from './types';

// Self is typed as DedicatedWorkerGlobalScope via reference lib above
declare const self: DedicatedWorkerGlobalScope;

/**
 * Global WASM module instance, initialized on worker startup.
 */
let wasmModule: AssemblerModule | null = null;

/**
 * Initialization error message, if WASM loading failed.
 */
let initError: string | null = null;

/**
 * Type guard for AssemblerCommand messages.
 * Validates structure including payload.source is a string.
 */
export function isAssemblerCommand(data: unknown): data is AssemblerCommand {
  if (!data || typeof data !== 'object') {
    return false;
  }
  const obj = data as Record<string, unknown>;
  if (typeof obj.payload !== 'object' || !obj.payload) {
    return false;
  }
  const payload = obj.payload as Record<string, unknown>;
  switch (obj.type) {
    case 'ASSEMBLE':
      return typeof payload.source === 'string';
    case 'INIT_WASM':
      return typeof payload.wasmJsPath === 'string';
    default:
      return false;
  }
}

/**
 * Handle assembly of source code.
 * Exported for testing purposes.
 */
export function handleAssemble(
  module: AssemblerModule,
  source: string
): AssembleSuccessEvent | AssembleErrorEvent {
  // Call the assembler
  const success = module.ccall(
    'assemble_source',
    'number',
    ['string'],
    [source]
  ) as number;

  if (success === 1) {
    // Get output pointer and size
    const outputPtr = module.ccall('get_output', 'number', [], []) as number;
    const outputSize = module.ccall(
      'get_output_size',
      'number',
      [],
      []
    ) as number;

    // Copy binary from WASM memory to JavaScript array
    const binary = Array.from(
      module.HEAPU8.slice(outputPtr, outputPtr + outputSize)
    );

    return {
      type: 'ASSEMBLE_SUCCESS',
      payload: { binary, size: outputSize },
    } satisfies AssembleSuccessEvent;
  } else {
    // Get error details
    const errorMessage = module.ccall('get_error', 'string', [], []) as string;
    const errorLine = module.ccall(
      'get_error_line',
      'number',
      [],
      []
    ) as number;

    return {
      type: 'ASSEMBLE_ERROR',
      payload: {
        line: errorLine,
        message: errorMessage,
      },
    } satisfies AssembleErrorEvent;
  }
}

/**
 * Initialize the WASM module from a given JS glue file path (Story 11.2).
 * Path is received via INIT_WASM message from the main thread.
 * Returns true on success, false on failure (sets initError).
 *
 * @param wasmJsPath - Path to WASM JS glue file relative to BASE_URL (e.g., 'wasm/micro4-asm.js')
 */
async function initializeWasm(wasmJsPath: string): Promise<boolean> {
  try {
    // Dynamic import for WASM module using absolute path from origin.
    // The @vite-ignore comment prevents Vite from statically analyzing this import,
    // which is necessary since the WASM is served from /public at runtime.
    const wasmUrl = new URL(`${import.meta.env.BASE_URL}${wasmJsPath}`, self.location.origin).href;
    const createModule = await import(/* @vite-ignore */ wasmUrl);
    const module: AssemblerModule = await createModule.default();

    // Validate the module loaded correctly
    const validationError = validateAssemblerModule(module);
    if (validationError) {
      initError = `WASM validation failed: missing exports [${validationError.missingExports.join(', ')}], missing runtime methods [${validationError.missingRuntimeMethods.join(', ')}]`;
      return false;
    }

    wasmModule = module;
    return true;
  } catch (error) {
    initError =
      error instanceof Error ? error.message : 'Unknown error loading WASM';
    return false;
  }
}

/**
 * Handle incoming messages from the main thread.
 */
function handleMessage(event: MessageEvent): void {
  const data = event.data;

  // Handle INIT_WASM before type guard check (Story 11.2)
  if (data && typeof data === 'object' && data.type === 'INIT_WASM') {
    const rawPayload = data.payload;
    if (!rawPayload || typeof rawPayload !== 'object' || typeof (rawPayload as Record<string, unknown>).wasmJsPath !== 'string') {
      self.postMessage({
        type: 'ASSEMBLE_ERROR',
        payload: { line: 0, message: 'INIT_WASM: missing or invalid wasmJsPath in payload' },
      } satisfies AssembleErrorEvent);
      return;
    }
    const wasmJsPath = (rawPayload as { wasmJsPath: string }).wasmJsPath;
    initializeWasm(wasmJsPath).then((success) => {
      if (success) {
        self.postMessage({ type: 'WORKER_READY' } satisfies WorkerReadyEvent);
      } else {
        self.postMessage({
          type: 'ASSEMBLE_ERROR',
          payload: {
            line: 0,
            message: `Worker initialization failed: ${initError}`,
          },
        } satisfies AssembleErrorEvent);
      }
    }).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : 'Unknown INIT_WASM error';
      self.postMessage({
        type: 'ASSEMBLE_ERROR',
        payload: { line: 0, message: `Worker initialization error: ${message}` },
      } satisfies AssembleErrorEvent);
    });
    return;
  }

  if (!isAssemblerCommand(data)) {
    console.warn('[AssemblerWorker] Unknown message type:', data);
    return;
  }

  if (!wasmModule) {
    // WASM not loaded yet or failed
    self.postMessage({
      type: 'ASSEMBLE_ERROR',
      payload: {
        line: 0,
        message: initError ?? 'WASM module not initialized',
      },
    } satisfies AssembleErrorEvent);
    return;
  }

  // Route by message type
  switch (data.type) {
    case 'ASSEMBLE': {
      const result = handleAssemble(wasmModule, data.payload.source);
      self.postMessage(result);
      break;
    }
    default: {
      // INIT_WASM is handled before the type guard, so this handles truly unknown types
      console.warn('[AssemblerWorker] Unhandled message type:', data);
    }
  }
}

// Only set up message handler when in a real Web Worker context (not during testing).
// Worker waits for INIT_WASM message from bridge before loading WASM (Story 11.2).
const isWorkerContext =
  typeof self !== 'undefined' &&
  typeof self.postMessage === 'function' &&
  typeof importScripts === 'function';

if (isWorkerContext) {
  self.onmessage = handleMessage;
}
