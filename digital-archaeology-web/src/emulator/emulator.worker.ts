/**
 * Emulator Web Worker
 *
 * Runs the Micro4 CPU emulator WASM module in a dedicated worker thread
 * to avoid blocking the UI during program execution.
 */

/// <reference lib="webworker" />

import type {
  EmulatorModule,
  EmulatorCommand,
  CPUState,
  StateUpdateEvent,
  HaltedEvent,
  EmulatorErrorEvent,
  BreakpointHitEvent,
  EmulatorReadyEvent,
} from './types';
import { validateEmulatorModule } from './types';

// Self is typed as DedicatedWorkerGlobalScope via reference lib above
declare const self: DedicatedWorkerGlobalScope;

/**
 * Global WASM module instance, initialized on worker startup.
 */
let wasmModule: EmulatorModule | null = null;

/**
 * Initialization error message, if WASM loading failed.
 */
let initError: string | null = null;

/**
 * Run loop interval ID, null when not running.
 */
let runIntervalId: number | null = null;

/**
 * Breakpoints set by the user (addresses to stop at).
 */
const breakpoints: Set<number> = new Set();

/**
 * Type guard for EmulatorCommand messages.
 * Validates structure including payload fields where required.
 */
export function isEmulatorCommand(data: unknown): data is EmulatorCommand {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;

  switch (obj.type) {
    case 'LOAD_PROGRAM': {
      if (typeof obj.payload !== 'object' || obj.payload === null) return false;
      const payload = obj.payload as Record<string, unknown>;
      // binary must be present - can be Uint8Array or array-like from postMessage
      if (!('binary' in payload)) return false;
      const binary = payload.binary;
      // After postMessage, Uint8Array becomes a regular object with numeric keys
      // or stays as Uint8Array depending on transfer
      if (binary instanceof Uint8Array) return true;
      if (
        typeof binary === 'object' &&
        binary !== null &&
        'length' in (binary as object)
      )
        return true;
      return false;
    }
    case 'STEP':
    case 'STOP':
    case 'RESET':
    case 'GET_STATE':
      return true;
    case 'RESTORE_STATE': {
      // Validate payload has required CPUState fields
      if (typeof obj.payload !== 'object' || obj.payload === null) return false;
      const payload = obj.payload as Record<string, unknown>;
      return (
        typeof payload.pc === 'number' &&
        typeof payload.accumulator === 'number' &&
        typeof payload.zeroFlag === 'boolean' &&
        'memory' in payload
      );
    }
    case 'RUN': {
      if (typeof obj.payload !== 'object' || obj.payload === null) return false;
      const payload = obj.payload as Record<string, unknown>;
      // Validate speed: must be a finite non-negative number
      return (
        'speed' in payload &&
        typeof payload.speed === 'number' &&
        Number.isFinite(payload.speed) &&
        payload.speed >= 0
      );
    }
    case 'SET_SPEED': {
      if (typeof obj.payload !== 'object' || obj.payload === null) return false;
      const payload = obj.payload as Record<string, unknown>;
      // Validate speed: must be a finite non-negative number
      return (
        'speed' in payload &&
        typeof payload.speed === 'number' &&
        Number.isFinite(payload.speed) &&
        payload.speed >= 0
      );
    }
    default:
      return false;
  }
}

/**
 * Read current CPU state from the WASM module.
 * Creates a copy of memory to avoid detached buffer issues.
 */
export function readCPUState(module: EmulatorModule): CPUState {
  const hasError = module._has_error() === 1;

  return {
    pc: module._get_pc(),
    accumulator: module._get_accumulator(),
    zeroFlag: module._get_zero_flag() === 1,
    halted: module._is_halted() === 1,
    error: hasError,
    errorMessage: hasError
      ? module.UTF8ToString(module._get_error_message())
      : null,
    // IMPORTANT: Create fresh view and copy via .slice() - buffer can be replaced
    // with ALLOW_MEMORY_GROWTH=1
    memory: new Uint8Array(
      module.HEAPU8.buffer,
      module._get_memory_ptr(),
      256
    ).slice(),
    ir: module._get_ir(),
    mar: module._get_mar(),
    mdr: module._get_mdr(),
    cycles: module._get_cycles(),
    instructions: module._get_instructions(),
  };
}

/**
 * Handle LOAD_PROGRAM command.
 * Resets CPU, copies binary to WASM memory, loads into CPU.
 */
export function handleLoadProgram(
  module: EmulatorModule,
  binary: Uint8Array | ArrayLike<number>,
  startAddr: number = 0
): void {
  // Convert to Uint8Array if needed (postMessage may transfer as array-like)
  const binaryArray =
    binary instanceof Uint8Array ? binary : new Uint8Array(Array.from(binary));

  // Reset CPU first
  module._cpu_reset_instance();

  // Allocate WASM memory for program
  const programPtr = module._malloc(binaryArray.length);

  // Copy program to WASM memory
  module.HEAPU8.set(binaryArray, programPtr);

  // Load into CPU memory
  module._cpu_load_program_instance(programPtr, binaryArray.length, startAddr);

  // Free the buffer
  module._free(programPtr);

  // Send state update
  self.postMessage({
    type: 'STATE_UPDATE',
    payload: readCPUState(module),
  } satisfies StateUpdateEvent);
}

/**
 * Handle STEP command.
 * Execute one instruction and return new state.
 *
 * NOTE: Breakpoint behavior differs between STEP and RUN:
 * - RUN: Checks breakpoints BEFORE stepping - stops without executing if on breakpoint
 * - STEP: Always executes one instruction, then notifies if landed on a breakpoint
 *
 * This is intentional: STEP should always advance execution by one instruction,
 * while RUN should stop before executing code at a breakpoint address.
 */
export function handleStep(module: EmulatorModule): void {
  // Don't step if already halted or in error state
  if (module._is_halted() === 1 || module._has_error() === 1) {
    self.postMessage({
      type: 'STATE_UPDATE',
      payload: readCPUState(module),
    } satisfies StateUpdateEvent);
    return;
  }

  // Execute one instruction (breakpoint check comes AFTER - see function doc)
  module._cpu_step_instance();

  // Check for halt
  if (module._is_halted() === 1) {
    self.postMessage({
      type: 'STATE_UPDATE',
      payload: readCPUState(module),
    } satisfies StateUpdateEvent);
    self.postMessage({ type: 'HALTED' } satisfies HaltedEvent);
    return;
  }

  // Check for error
  if (module._has_error() === 1) {
    self.postMessage({
      type: 'ERROR',
      payload: {
        message: module.UTF8ToString(module._get_error_message()),
        address: module._get_pc(),
      },
    } satisfies EmulatorErrorEvent);
    return;
  }

  // Check for breakpoint
  const pc = module._get_pc();
  if (breakpoints.has(pc)) {
    self.postMessage({
      type: 'BREAKPOINT_HIT',
      payload: { address: pc },
    } satisfies BreakpointHitEvent);
  }

  // Send state update
  self.postMessage({
    type: 'STATE_UPDATE',
    payload: readCPUState(module),
  } satisfies StateUpdateEvent);
}

/**
 * Start or restart the run interval with the given speed.
 * Shared logic used by both handleRun and handleSetSpeed.
 *
 * @param module - The WASM emulator module
 * @param speed - Instructions per ~16ms tick. 0 = max speed (1000 per tick, 0ms interval)
 */
function startRunInterval(module: EmulatorModule, speed: number): void {
  const instructionsPerTick = speed === 0 ? 1000 : Math.max(1, Math.floor(speed));
  const intervalMs = speed === 0 ? 0 : 16; // ~60fps for throttled, 0 for max

  runIntervalId = self.setInterval(() => {
    for (let i = 0; i < instructionsPerTick; i++) {
      // Check for halt
      if (module._is_halted() === 1) {
        handleStop();
        self.postMessage({
          type: 'STATE_UPDATE',
          payload: readCPUState(module),
        } satisfies StateUpdateEvent);
        self.postMessage({ type: 'HALTED' } satisfies HaltedEvent);
        return;
      }

      // Check for error
      if (module._has_error() === 1) {
        handleStop();
        self.postMessage({
          type: 'ERROR',
          payload: {
            message: module.UTF8ToString(module._get_error_message()),
            address: module._get_pc(),
          },
        } satisfies EmulatorErrorEvent);
        return;
      }

      // Check for breakpoint before stepping
      const pc = module._get_pc();
      if (breakpoints.has(pc)) {
        handleStop();
        self.postMessage({
          type: 'STATE_UPDATE',
          payload: readCPUState(module),
        } satisfies StateUpdateEvent);
        self.postMessage({
          type: 'BREAKPOINT_HIT',
          payload: { address: pc },
        } satisfies BreakpointHitEvent);
        return;
      }

      // Execute one instruction
      module._cpu_step_instance();
    }

    // Send state update (throttled to once per tick)
    self.postMessage({
      type: 'STATE_UPDATE',
      payload: readCPUState(module),
    } satisfies StateUpdateEvent);
  }, intervalMs);
}

/**
 * Handle RUN command.
 * Start continuous execution with configurable speed.
 * @param speed - Instructions per ~16ms tick. 0 = max speed (1000 per tick, 0ms interval)
 */
export function handleRun(module: EmulatorModule, speed: number): void {
  // Don't start if already running
  if (runIntervalId !== null) {
    return;
  }

  // Don't start if halted or in error state
  if (module._is_halted() === 1 || module._has_error() === 1) {
    self.postMessage({
      type: 'STATE_UPDATE',
      payload: readCPUState(module),
    } satisfies StateUpdateEvent);
    return;
  }

  startRunInterval(module, speed);
}

/**
 * Handle STOP command.
 * Cancel run loop if active.
 */
export function handleStop(): void {
  if (runIntervalId !== null) {
    self.clearInterval(runIntervalId);
    runIntervalId = null;
  }
}

/**
 * Handle SET_SPEED command.
 * Change execution speed while running. Only affects execution if currently running.
 *
 * @param module - The WASM emulator module
 * @param speed - New execution speed (0 = max speed, >0 = instructions per ~16ms tick)
 */
export function handleSetSpeed(module: EmulatorModule, speed: number): void {
  // Only update if currently running
  if (runIntervalId === null) {
    return;
  }

  // Clear existing interval and restart with new speed
  self.clearInterval(runIntervalId);
  startRunInterval(module, speed);
}

/**
 * Handle RESET command.
 * Reset CPU state (preserves memory) and return new state.
 */
export function handleReset(module: EmulatorModule): void {
  // Stop any running execution
  handleStop();

  // Reset CPU
  module._cpu_reset_instance();

  // Send state update
  self.postMessage({
    type: 'STATE_UPDATE',
    payload: readCPUState(module),
  } satisfies StateUpdateEvent);
}

/**
 * Handle GET_STATE command.
 * Return current CPU state without modifying anything.
 */
export function handleGetState(module: EmulatorModule): void {
  self.postMessage({
    type: 'STATE_UPDATE',
    payload: readCPUState(module),
  } satisfies StateUpdateEvent);
}

/**
 * Handle RESTORE_STATE command (Story 5.2).
 * Restore CPU to a specific state from history for step-back functionality.
 *
 * NOTE: This implementation uses loadProgram to restore memory since the WASM
 * emulator doesn't expose individual register setters. The approach:
 * 1. Reset CPU
 * 2. Restore memory via loadProgram
 * 3. The reset sets PC=0, accumulator=0, zeroFlag=false
 *
 * LIMITATION: True state restoration would require WASM setter functions
 * for PC, accumulator, etc. For now, step-back restores memory but
 * always resets other registers. This is acceptable for educational use
 * where stepping back is primarily used to review memory/instruction changes.
 *
 * @param module - The WASM emulator module
 * @param state - The CPU state to restore
 */
export function handleRestoreState(
  module: EmulatorModule,
  state: CPUState
): void {
  // Stop any running execution
  handleStop();

  // Reset CPU first
  module._cpu_reset_instance();

  // Restore memory by loading the memory contents as if it were a program
  // This restores the full 256-byte memory state
  const memoryArray =
    state.memory instanceof Uint8Array
      ? state.memory
      : new Uint8Array(Array.from(state.memory));

  const programPtr = module._malloc(memoryArray.length);
  module.HEAPU8.set(memoryArray, programPtr);
  module._cpu_load_program_instance(programPtr, memoryArray.length, 0);
  module._free(programPtr);

  // Send state update with the restored state
  // Note: PC and other registers are reset to initial values by cpu_reset_instance
  self.postMessage({
    type: 'STATE_UPDATE',
    payload: readCPUState(module),
  } satisfies StateUpdateEvent);
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
    const wasmUrl = new URL('/wasm/micro4-cpu.js', self.location.origin).href;
    const createModule = await import(/* @vite-ignore */ wasmUrl);
    const module: EmulatorModule = await createModule.default();

    // Validate the module loaded correctly
    const validationError = validateEmulatorModule(module);
    if (validationError) {
      initError = `WASM validation failed: missing exports [${validationError.missingExports.join(', ')}], missing runtime methods [${validationError.missingRuntimeMethods.join(', ')}]`;
      return false;
    }

    wasmModule = module;

    // Initialize CPU on load
    module._cpu_init_instance();

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

  if (!isEmulatorCommand(data)) {
    console.warn('[EmulatorWorker] Unknown message type:', data);
    return;
  }

  if (!wasmModule) {
    // WASM not loaded yet or failed
    self.postMessage({
      type: 'ERROR',
      payload: {
        message: initError ?? 'WASM module not initialized',
      },
    } satisfies EmulatorErrorEvent);
    return;
  }

  // Route by message type
  switch (data.type) {
    case 'LOAD_PROGRAM': {
      handleLoadProgram(
        wasmModule,
        data.payload.binary,
        data.payload.startAddr
      );
      break;
    }
    case 'STEP': {
      handleStep(wasmModule);
      break;
    }
    case 'RUN': {
      handleRun(wasmModule, data.payload.speed);
      break;
    }
    case 'STOP': {
      handleStop();
      // Send state update so UI reflects current state after stopping
      self.postMessage({
        type: 'STATE_UPDATE',
        payload: readCPUState(wasmModule),
      } satisfies StateUpdateEvent);
      break;
    }
    case 'SET_SPEED': {
      handleSetSpeed(wasmModule, data.payload.speed);
      break;
    }
    case 'RESET': {
      handleReset(wasmModule);
      break;
    }
    case 'GET_STATE': {
      handleGetState(wasmModule);
      break;
    }
    case 'RESTORE_STATE': {
      handleRestoreState(wasmModule, data.payload);
      break;
    }
    default: {
      // Type system ensures this is exhaustive, but log just in case
      console.warn('[EmulatorWorker] Unhandled message type:', data);
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
    self.postMessage({ type: 'EMULATOR_READY' } satisfies EmulatorReadyEvent);
  } else {
    // Send error event so main thread knows initialization failed
    self.postMessage({
      type: 'ERROR',
      payload: {
        message: `Worker initialization failed: ${initError}`,
      },
    } satisfies EmulatorErrorEvent);
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
