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
  if (obj.type !== 'ASSEMBLE' || typeof obj.payload !== 'object' || !obj.payload) {
    return false;
  }
  const payload = obj.payload as Record<string, unknown>;
  return typeof payload.source === 'string';
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
 * Initialize the WASM module.
 * Returns true on success, false on failure (sets initError).
 */
async function initializeWasm(): Promise<boolean> {
  try {
    // Dynamic import for WASM module using absolute path from origin.
    // The @vite-ignore comment prevents Vite from statically analyzing this import,
    // which is necessary since the WASM is served from /public at runtime.
    const wasmUrl = new URL(`${import.meta.env.BASE_URL}wasm/micro4-asm.js`, self.location.origin).href;
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
      // Type system ensures this is exhaustive, but log just in case
      console.warn('[AssemblerWorker] Unhandled message type:', data);
    }
  }
}

/**
 * Worker initialization.
 * Load WASM and notify main thread when ready.
 */
async function init(): Promise<void> {
  const success = await initializeWasm();

  if (success) {
    self.postMessage({ type: 'WORKER_READY' } satisfies WorkerReadyEvent);
  } else {
    // Send error event so main thread knows initialization failed
    self.postMessage({
      type: 'ASSEMBLE_ERROR',
      payload: {
        line: 0,
        message: `Worker initialization failed: ${initError}`,
      },
    } satisfies AssembleErrorEvent);
  }
}

// Only run initialization when in a real Web Worker context (not during testing)
// Check for DedicatedWorkerGlobalScope by verifying importScripts exists (only in workers)
const isWorkerContext =
  typeof self !== 'undefined' &&
  typeof self.postMessage === 'function' &&
  typeof importScripts === 'function';

if (isWorkerContext) {
  self.onmessage = handleMessage;
  init();
}
