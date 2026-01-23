/**
 * EmulatorBridge
 *
 * Promise-based API for interacting with the Emulator Web Worker.
 * Handles worker lifecycle, message passing, event subscriptions, and state management.
 *
 * This is the main interface for UI code to interact with the CPU emulator.
 * All WASM execution happens in a Web Worker to avoid blocking the main thread.
 */

import type { EmulatorCommand, EmulatorEvent, CPUState } from './types';

/**
 * Default timeout for emulator operations in milliseconds.
 * 10 seconds allows for complex programs while preventing indefinite hangs.
 */
const DEFAULT_TIMEOUT_MS = 10000;

/**
 * Timeout for worker initialization in milliseconds.
 * 30 seconds accounts for WASM module download and compilation on slow networks.
 */
const INIT_TIMEOUT_MS = 30000;

/**
 * Callback type for CPU state updates.
 * Called during RUN mode with each state update from the worker.
 * Also called after loadProgram, step, stop, reset, and getState operations.
 *
 * @param state - Complete CPU state snapshot including PC, accumulator, flags, and memory
 */
export type StateUpdateCallback = (state: CPUState) => void;

/**
 * Callback type for HALTED events.
 * Called when the CPU executes a HLT instruction during RUN or STEP.
 * The isRunning flag is automatically cleared when this fires.
 */
export type HaltedCallback = () => void;

/**
 * Callback type for ERROR events.
 * Called when a runtime error occurs during execution (e.g., invalid instruction).
 * The isRunning flag is automatically cleared when this fires.
 *
 * @param error - Error details with message and optional address where error occurred
 */
export type ErrorCallback = (error: { message: string; address?: number }) => void;

/**
 * Bridge between main thread and Emulator Web Worker.
 *
 * Provides a Promise-based API for:
 * - Loading programs into the CPU
 * - Single-stepping execution
 * - Continuous execution with speed control
 * - Stopping and resetting the CPU
 * - Subscribing to state updates and events
 *
 * @example
 * ```typescript
 * const bridge = new EmulatorBridge();
 * await bridge.init();
 *
 * // Load a program
 * const state = await bridge.loadProgram(binary);
 * console.log('Initial PC:', state.pc);
 *
 * // Subscribe to state updates
 * const unsubscribe = bridge.onStateUpdate((state) => {
 *   console.log('PC:', state.pc, 'ACC:', state.accumulator);
 * });
 *
 * // Run at 60 IPS
 * bridge.run(60);
 *
 * // Later...
 * await bridge.stop();
 * unsubscribe();
 * bridge.terminate();
 * ```
 */
export class EmulatorBridge {
  private worker: Worker | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private isRunning = false;

  // Subscriber sets for events
  private stateUpdateSubscribers = new Set<StateUpdateCallback>();
  private haltedSubscribers = new Set<HaltedCallback>();
  private errorSubscribers = new Set<ErrorCallback>();

  // Bound handler for cleanup
  private boundMessageHandler: ((e: MessageEvent) => void) | null = null;

  /**
   * Whether the bridge is initialized and ready for use.
   */
  get isReady(): boolean {
    return this.initialized && this.worker !== null;
  }

  /**
   * Initialize the bridge by creating the worker and waiting for EMULATOR_READY.
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
        new URL('./emulator.worker.ts', import.meta.url),
        { type: 'module' }
      );

      const timeout = setTimeout(() => {
        this.worker?.terminate();
        this.worker = null;
        reject(new Error('Emulator initialization timed out'));
      }, INIT_TIMEOUT_MS);

      const handleInit = (event: MessageEvent<EmulatorEvent>) => {
        const data = event.data;

        if (data.type === 'EMULATOR_READY') {
          clearTimeout(timeout);
          this.worker?.removeEventListener('message', handleInit);
          this.worker?.removeEventListener('error', handleError);
          this.initialized = true;
          this.setupPermanentListener();
          resolve();
        } else if (data.type === 'ERROR' && !this.initialized) {
          // Error during initialization
          clearTimeout(timeout);
          this.worker?.terminate();
          this.worker = null;
          reject(new Error(data.payload.message));
        }
      };

      const handleError = (event: ErrorEvent) => {
        clearTimeout(timeout);
        this.worker?.removeEventListener('message', handleInit);
        this.worker?.removeEventListener('error', handleError);
        this.worker?.terminate();
        this.worker = null;
        reject(new Error(`Worker error: ${event.message}`));
      };

      this.worker.addEventListener('message', handleInit);
      this.worker.addEventListener('error', handleError);
    });
  }

  /**
   * Set up permanent listener for ongoing events (STATE_UPDATE, HALTED, ERROR).
   * Called after successful initialization.
   */
  private setupPermanentListener(): void {
    if (!this.worker) return;

    this.boundMessageHandler = (event: MessageEvent<EmulatorEvent>) => {
      this.handleWorkerEvent(event.data);
    };
    this.worker.addEventListener('message', this.boundMessageHandler);
  }

  /**
   * Handle worker events and dispatch to subscribers.
   */
  private handleWorkerEvent(event: EmulatorEvent): void {
    switch (event.type) {
      case 'STATE_UPDATE':
        this.stateUpdateSubscribers.forEach((cb) => cb(event.payload));
        break;
      case 'HALTED':
        this.isRunning = false;
        this.haltedSubscribers.forEach((cb) => cb());
        break;
      case 'ERROR':
        this.isRunning = false;
        this.errorSubscribers.forEach((cb) => cb(event.payload));
        break;
      // EMULATOR_READY handled in init, BREAKPOINT_HIT for future use
    }
  }

  /**
   * Load a program into the emulator.
   *
   * @param binary - The assembled program bytes (nibbles)
   * @param startAddr - Starting address in CPU memory (default: 0)
   * @returns Promise resolving to initial CPU state after load
   * @throws Error if bridge is not initialized or operation times out
   */
  async loadProgram(
    binary: Uint8Array,
    startAddr: number = 0
  ): Promise<CPUState> {
    this.ensureInitialized();
    const worker = this.worker!;

    return this.sendCommandAndWaitForState(worker, {
      type: 'LOAD_PROGRAM',
      payload: { binary, startAddr },
    });
  }

  /**
   * Execute one instruction.
   *
   * @returns Promise resolving to CPU state after execution
   * @throws Error if bridge is not initialized or operation times out
   */
  async step(): Promise<CPUState> {
    this.ensureInitialized();
    const worker = this.worker!;

    return this.sendCommandAndWaitForState(worker, { type: 'STEP' });
  }

  /**
   * Start continuous execution.
   *
   * @param speed - Execution speed (0 = max speed, >0 = instructions per ~16ms tick)
   */
  run(speed: number): void {
    this.ensureInitialized();
    if (this.isRunning) return; // Already running

    this.isRunning = true;
    this.worker!.postMessage({
      type: 'RUN',
      payload: { speed },
    } satisfies EmulatorCommand);
  }

  /**
   * Change execution speed while running.
   * Only affects execution if currently running.
   *
   * @param speed - New execution speed (0 = max speed, >0 = instructions per ~16ms tick)
   */
  setSpeed(speed: number): void {
    this.ensureInitialized();
    if (!this.isRunning || !this.worker) return;

    this.worker.postMessage({
      type: 'SET_SPEED',
      payload: { speed },
    } satisfies EmulatorCommand);
  }

  /**
   * Stop continuous execution.
   *
   * @returns Promise resolving to current CPU state when stopped
   * @throws Error if bridge is not initialized or operation times out
   */
  async stop(): Promise<CPUState> {
    this.ensureInitialized();
    const worker = this.worker!;

    this.isRunning = false;
    return this.sendCommandAndWaitForState(worker, { type: 'STOP' });
  }

  /**
   * Reset CPU to initial state.
   * Stops any running execution first and waits for it to complete.
   *
   * @returns Promise resolving to reset CPU state
   * @throws Error if bridge is not initialized or operation times out
   */
  async reset(): Promise<CPUState> {
    this.ensureInitialized();
    const worker = this.worker!;

    if (this.isRunning) {
      this.isRunning = false;
      // Wait for STOP to complete before sending RESET to avoid race condition
      await this.sendCommandAndWaitForState(worker, { type: 'STOP' });
    }

    return this.sendCommandAndWaitForState(worker, { type: 'RESET' });
  }

  /**
   * Get current CPU state without modifying it.
   *
   * @returns Promise resolving to current CPU state
   * @throws Error if bridge is not initialized or operation times out
   */
  async getState(): Promise<CPUState> {
    this.ensureInitialized();
    const worker = this.worker!;

    return this.sendCommandAndWaitForState(worker, { type: 'GET_STATE' });
  }

  /**
   * Subscribe to CPU state updates during RUN.
   *
   * @param callback - Function called with new state on each update
   * @returns Unsubscribe function
   */
  onStateUpdate(callback: StateUpdateCallback): () => void {
    this.stateUpdateSubscribers.add(callback);
    return () => this.stateUpdateSubscribers.delete(callback);
  }

  /**
   * Subscribe to HALTED events.
   * Called when CPU executes a HLT instruction.
   *
   * @param callback - Function called when CPU halts
   * @returns Unsubscribe function
   */
  onHalted(callback: HaltedCallback): () => void {
    this.haltedSubscribers.add(callback);
    return () => this.haltedSubscribers.delete(callback);
  }

  /**
   * Subscribe to ERROR events.
   * Called when a runtime error occurs during execution.
   *
   * @param callback - Function called with error details
   * @returns Unsubscribe function
   */
  onError(callback: ErrorCallback): () => void {
    this.errorSubscribers.add(callback);
    return () => this.errorSubscribers.delete(callback);
  }

  /**
   * Terminate the worker and clean up all resources.
   * After calling this, the bridge cannot be reused.
   */
  terminate(): void {
    if (this.worker) {
      if (this.boundMessageHandler) {
        this.worker.removeEventListener('message', this.boundMessageHandler);
        this.boundMessageHandler = null;
      }
      this.worker.terminate();
      this.worker = null;
    }
    this.initialized = false;
    this.initPromise = null;
    this.isRunning = false;
    this.stateUpdateSubscribers.clear();
    this.haltedSubscribers.clear();
    this.errorSubscribers.clear();
  }

  /**
   * Ensure the bridge is initialized before operations.
   * @throws Error if not initialized
   */
  private ensureInitialized(): void {
    if (!this.worker || !this.initialized) {
      throw new Error('EmulatorBridge not initialized. Call init() first.');
    }
  }

  /**
   * Send a command and wait for STATE_UPDATE response.
   * Handles timeout, HALTED, and ERROR events.
   */
  private sendCommandAndWaitForState(
    worker: Worker,
    command: EmulatorCommand
  ): Promise<CPUState> {
    return new Promise<CPUState>((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error(`${command.type} operation timed out`));
      }, DEFAULT_TIMEOUT_MS);

      const cleanup = () => {
        clearTimeout(timeout);
        worker.removeEventListener('message', handleMessage);
        worker.removeEventListener('error', handleError);
      };

      const handleMessage = (event: MessageEvent<EmulatorEvent>) => {
        const data = event.data;

        if (data.type === 'STATE_UPDATE') {
          cleanup();
          resolve(data.payload);
        } else if (data.type === 'HALTED') {
          // STEP can result in HALTED - get state afterwards
          cleanup();
          // Request final state
          this.getState().then(resolve).catch(reject);
        } else if (data.type === 'ERROR') {
          cleanup();
          reject(new Error(data.payload.message));
        }
      };

      const handleError = (event: ErrorEvent) => {
        cleanup();
        reject(new Error(`Worker error: ${event.message}`));
      };

      worker.addEventListener('message', handleMessage);
      worker.addEventListener('error', handleError);
      worker.postMessage(command);
    });
  }
}
