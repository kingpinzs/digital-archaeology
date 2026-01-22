/**
 * AssemblerBridge
 *
 * Promise-based API for interacting with the Assembler Web Worker.
 * Handles worker lifecycle, message passing, and result transformation.
 */

import type {
  AssembleResult,
  AssemblerEvent,
  AssembleCommand,
  AssemblerError,
} from './types';

/**
 * Default timeout for assembly operations in milliseconds.
 * 10 seconds allows for complex programs while preventing indefinite hangs.
 * Can be overridden per-call via the timeoutMs parameter.
 */
const DEFAULT_TIMEOUT_MS = 10000;

/**
 * Timeout for worker initialization in milliseconds.
 * 30 seconds accounts for WASM module download and compilation on slow networks.
 * This is longer than assembly timeout because WASM loading is a one-time cost.
 */
const INIT_TIMEOUT_MS = 30000;

/**
 * Bridge between main thread and Assembler Web Worker.
 *
 * @example
 * ```typescript
 * const bridge = new AssemblerBridge();
 * await bridge.init();
 *
 * const result = await bridge.assemble('LDA 5\nHLT');
 * if (result.success) {
 *   console.log('Binary:', result.binary);
 * } else {
 *   console.error('Error:', result.error?.message);
 * }
 *
 * bridge.terminate();
 * ```
 */
export class AssemblerBridge {
  private worker: Worker | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  /**
   * Whether the bridge is initialized and ready for use.
   */
  get isReady(): boolean {
    return this.initialized && this.worker !== null;
  }

  /**
   * Initialize the bridge by creating the worker and waiting for WORKER_READY.
   *
   * @throws Error if worker creation fails or initialization times out
   */
  init(): Promise<void> {
    if (this.initialized) {
      return Promise.resolve();
    }

    // Reuse existing init promise if already initializing
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.doInit();
    return this.initPromise;
  }

  private async doInit(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // Create worker using Vite's URL syntax
      this.worker = new Worker(
        new URL('./assembler.worker.ts', import.meta.url),
        { type: 'module' }
      );

      const timeout = setTimeout(() => {
        this.worker?.terminate();
        this.worker = null;
        reject(new Error('Worker initialization timed out'));
      }, INIT_TIMEOUT_MS);

      const handleMessage = (event: MessageEvent<AssemblerEvent>) => {
        const data = event.data;

        if (data.type === 'WORKER_READY') {
          clearTimeout(timeout);
          this.worker?.removeEventListener('message', handleMessage);
          this.worker?.removeEventListener('error', handleError);
          this.initialized = true;
          resolve();
        } else if (data.type === 'ASSEMBLE_ERROR' && !this.initialized) {
          // Error during initialization
          clearTimeout(timeout);
          this.worker?.terminate();
          this.worker = null;
          reject(new Error(data.payload.message));
        }
      };

      const handleError = (event: ErrorEvent) => {
        clearTimeout(timeout);
        this.worker?.removeEventListener('message', handleMessage);
        this.worker?.removeEventListener('error', handleError);
        this.worker?.terminate();
        this.worker = null;
        reject(new Error(`Worker error: ${event.message}`));
      };

      this.worker.addEventListener('message', handleMessage);
      this.worker.addEventListener('error', handleError);
    });
  }

  /**
   * Assemble source code.
   *
   * @param source - Assembly source code to compile
   * @param timeoutMs - Timeout in milliseconds (default: 10000)
   * @returns Promise resolving to assembly result
   * @throws Error if bridge is not initialized or operation times out
   */
  async assemble(
    source: string,
    timeoutMs: number = DEFAULT_TIMEOUT_MS
  ): Promise<AssembleResult> {
    if (!this.worker || !this.initialized) {
      throw new Error('AssemblerBridge not initialized. Call init() first.');
    }

    // Capture worker reference for use in closures (TypeScript narrowing)
    const worker = this.worker;

    return new Promise<AssembleResult>((resolve, reject) => {
      const cleanup = () => {
        clearTimeout(timeout);
        worker.removeEventListener('message', handleMessage);
        worker.removeEventListener('error', handleError);
      };

      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('Assembly operation timed out'));
      }, timeoutMs);

      const handleMessage = (event: MessageEvent<AssemblerEvent>) => {
        const data = event.data;

        if (data.type === 'ASSEMBLE_SUCCESS') {
          cleanup();
          resolve({
            success: true,
            binary: new Uint8Array(data.payload.binary),
            error: null,
          });
        } else if (data.type === 'ASSEMBLE_ERROR') {
          cleanup();
          const error: AssemblerError = {
            line: data.payload.line,
            message: data.payload.message,
          };
          if (data.payload.column !== undefined) {
            error.column = data.payload.column;
          }
          if (data.payload.suggestion !== undefined) {
            error.suggestion = data.payload.suggestion;
          }
          resolve({
            success: false,
            binary: null,
            error,
          });
        }
        // Ignore other message types (e.g., WORKER_READY after init)
      };

      const handleError = (event: ErrorEvent) => {
        cleanup();
        reject(new Error(`Worker error during assembly: ${event.message}`));
      };

      worker.addEventListener('message', handleMessage);
      worker.addEventListener('error', handleError);

      // Send assemble command
      const command: AssembleCommand = {
        type: 'ASSEMBLE',
        payload: { source },
      };
      worker.postMessage(command);
    });
  }

  /**
   * Terminate the worker and clean up resources.
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.initialized = false;
    this.initPromise = null;
  }
}
