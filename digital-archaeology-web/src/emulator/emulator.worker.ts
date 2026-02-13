/**
 * Emulator Web Worker
 *
 * Runs the CPU emulator WASM module (Micro4 or Micro8) in a dedicated worker thread
 * to avoid blocking the UI during program execution.
 */

/// <reference lib="webworker" />

import type {
  EmulatorModule,
  Micro8EmulatorModule,
  EmulatorCommand,
  CPUState,
  Micro8CPUState,
  StateUpdateEvent,
  HaltedEvent,
  EmulatorErrorEvent,
  BreakpointHitEvent,
  EmulatorReadyEvent,
  BreakpointsListEvent,
  RuntimeErrorType,
  RuntimeErrorContext,
} from './types';
import { validateEmulatorModule, validateMicro8EmulatorModule } from './types';

// Self is typed as DedicatedWorkerGlobalScope via reference lib above
declare const self: DedicatedWorkerGlobalScope;

/**
 * Global WASM module instance, initialized on worker startup.
 * Can be either Micro4 (EmulatorModule) or Micro8 (Micro8EmulatorModule).
 */
let wasmModule: EmulatorModule | Micro8EmulatorModule | null = null;

/**
 * Current stage identifier. Set during INIT_WASM, used to dispatch
 * stage-specific validation and state reading.
 */
let currentStage: string | null = null;

/**
 * Set the current stage (test-only). Exported for unit tests that need to
 * verify stage-aware dispatch in readStateFromModule and buildErrorContext.
 * @internal
 */
export function __testing_setCurrentStage(stage: string | null): void {
  currentStage = stage;
}

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
 * Micro4 instruction mnemonics by opcode (Story 5.10).
 * Used for rich error context display.
 */
const INSTRUCTION_MNEMONICS: Record<number, string> = {
  0x0: 'NOP',
  0x1: 'ADD',
  0x2: 'SUB',
  0x3: 'AND',
  0x4: 'LDA',
  0x5: 'LDI',
  0x6: 'STO',
  0x7: 'JMP',
  0x8: 'JZ',
  0x9: 'JC',
  0xa: 'OUT',
  0xb: 'IN',
  0xc: 'RES', // Reserved - Code Review Fix #4
  0xd: 'RES', // Reserved - Code Review Fix #4
  0xe: 'RES', // Reserved - Code Review Fix #4
  0xf: 'HLT',
};

/**
 * Map opcode to circuit component name (Story 5.10).
 * Used for linking errors to circuit visualization (Epic 6).
 */
function getComponentForOpcode(opcode: number): string {
  // ALU operations: ADD, SUB, AND
  if (opcode >= 0x1 && opcode <= 0x3) {
    return 'ALU';
  }
  // Memory operations: LDA, LDI, STO
  if (opcode >= 0x4 && opcode <= 0x6) {
    return 'Memory Controller';
  }
  // Control flow: JMP, JZ, JC
  if (opcode >= 0x7 && opcode <= 0x9) {
    return 'Control Unit';
  }
  // I/O operations: OUT, IN
  if (opcode >= 0xa && opcode <= 0xb) {
    return 'I/O Controller';
  }
  // Default for NOP, HLT, reserved
  return 'Control Unit';
}

/**
 * Classify error message into RuntimeErrorType (Story 5.10).
 * Parses error message content to determine error category.
 * Note: Order matters - check more specific patterns first.
 */
export function classifyError(message: string): RuntimeErrorType {
  const lowerMessage = message.toLowerCase();

  // Check stack first since "stack overflow" contains "overflow"
  if (lowerMessage.includes('stack')) {
    return 'STACK_OVERFLOW';
  }
  if (lowerMessage.includes('memory') || lowerMessage.includes('address')) {
    return 'MEMORY_ERROR';
  }
  if (
    lowerMessage.includes('overflow') ||
    lowerMessage.includes('divide') ||
    lowerMessage.includes('division') ||
    lowerMessage.includes('arithmetic')
  ) {
    return 'ARITHMETIC_WARNING';
  }
  if (
    lowerMessage.includes('opcode') ||
    lowerMessage.includes('instruction') ||
    lowerMessage.includes('unknown')
  ) {
    return 'INVALID_OPCODE';
  }
  return 'UNKNOWN_ERROR';
}

/**
 * Build rich error context from current CPU state (Story 5.10).
 * Extracts PC, instruction, opcode, and component name for error display.
 * Stage-aware: Micro4 extracts opcode from IR high nibble; Micro8 uses full IR byte.
 */
export function buildErrorContext(
  module: EmulatorModule | Micro8EmulatorModule,
  message: string
): RuntimeErrorContext {
  const pc = module._get_pc();
  const ir = module._get_ir();

  if (currentStage === 'micro8') {
    // Micro8: full-byte opcode, no mnemonic table yet (Story 12.4 scope)
    return {
      errorType: classifyError(message),
      pc,
      instruction: `OP_0x${ir.toString(16).toUpperCase().padStart(2, '0')}`,
      opcode: ir,
      componentName: 'Control Unit',
      signalValues: undefined,
    };
  }

  // Micro4: opcodes are the high nibble of the IR (upper 4 bits)
  const opcode = (ir >> 4) & 0xf;
  const instruction = INSTRUCTION_MNEMONICS[opcode] ?? 'UNK';
  const componentName = getComponentForOpcode(opcode);

  return {
    errorType: classifyError(message),
    pc,
    instruction,
    opcode,
    componentName,
    // Signal values will be populated when Epic 6 (Circuit Visualization) is implemented
    signalValues: undefined,
  };
}

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
    case 'SET_BREAKPOINT': {
      // Validate payload has address field (Story 5.8)
      if (typeof obj.payload !== 'object' || obj.payload === null) return false;
      const payload = obj.payload as Record<string, unknown>;
      return (
        'address' in payload &&
        typeof payload.address === 'number' &&
        Number.isFinite(payload.address) &&
        payload.address >= 0 &&
        payload.address <= 65535
      );
    }
    case 'CLEAR_BREAKPOINT': {
      // Validate payload has address field (Story 5.8)
      if (typeof obj.payload !== 'object' || obj.payload === null) return false;
      const payload = obj.payload as Record<string, unknown>;
      return (
        'address' in payload &&
        typeof payload.address === 'number' &&
        Number.isFinite(payload.address) &&
        payload.address >= 0 &&
        payload.address <= 65535
      );
    }
    case 'GET_BREAKPOINTS':
      // No payload required (Story 5.8)
      return true;
    case 'INIT_WASM': {
      // Story 11.2: Validate INIT_WASM payload
      if (typeof obj.payload !== 'object' || obj.payload === null) return false;
      const payload = obj.payload as Record<string, unknown>;
      return typeof payload.wasmJsPath === 'string';
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
 * Read current CPU state from a Micro8 WASM module.
 * Creates a copy of 64KB memory to avoid detached buffer issues.
 * Sets accumulator to 0 for CPUState compatibility with existing UI consumers.
 */
export function readMicro8CPUState(module: Micro8EmulatorModule): Micro8CPUState {
  const hasError = module._has_error() === 1;

  // Read all 8 registers
  const registers: number[] = [];
  for (let i = 0; i < 8; i++) {
    registers.push(module._get_reg(i));
  }

  return {
    pc: module._get_pc(),
    accumulator: 0, // Compatibility placeholder — Micro8 uses registers, not accumulator
    zeroFlag: module._get_zero_flag() === 1,
    halted: module._is_halted() === 1,
    error: hasError,
    errorMessage: hasError
      ? module.UTF8ToString(module._get_error_message())
      : null,
    // 64KB memory for Micro8
    memory: new Uint8Array(
      module.HEAPU8.buffer,
      module._get_memory_ptr(),
      65536
    ).slice(),
    ir: module._get_ir(),
    mar: module._get_mar(),
    mdr: module._get_mdr(),
    cycles: module._get_cycles(),
    instructions: module._get_instructions(),
    // Micro8-specific fields
    registers,
    sp: module._get_sp(),
    carryFlag: module._get_carry_flag() === 1,
    signFlag: module._get_sign_flag() === 1,
    overflowFlag: module._get_overflow_flag() === 1,
  };
}

/**
 * Read CPU state from the module, dispatching to the correct reader
 * based on the current stage.
 */
export function readStateFromModule(module: EmulatorModule | Micro8EmulatorModule): CPUState {
  if (currentStage === 'micro8') {
    return readMicro8CPUState(module as Micro8EmulatorModule);
  }
  return readCPUState(module as EmulatorModule);
}

/**
 * Handle LOAD_PROGRAM command.
 * Resets CPU, copies binary to WASM memory, loads into CPU.
 */
export function handleLoadProgram(
  module: EmulatorModule | Micro8EmulatorModule,
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
    payload: readStateFromModule(module),
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
export function handleStep(module: EmulatorModule | Micro8EmulatorModule): void {
  // Don't step if already halted or in error state
  if (module._is_halted() === 1 || module._has_error() === 1) {
    self.postMessage({
      type: 'STATE_UPDATE',
      payload: readStateFromModule(module),
    } satisfies StateUpdateEvent);
    return;
  }

  // Execute one instruction (breakpoint check comes AFTER - see function doc)
  module._cpu_step_instance();

  // Check for halt
  if (module._is_halted() === 1) {
    self.postMessage({
      type: 'STATE_UPDATE',
      payload: readStateFromModule(module),
    } satisfies StateUpdateEvent);
    self.postMessage({ type: 'HALTED' } satisfies HaltedEvent);
    return;
  }

  // Check for error
  if (module._has_error() === 1) {
    const errorMessage = module.UTF8ToString(module._get_error_message());
    self.postMessage({
      type: 'ERROR',
      payload: {
        message: errorMessage,
        address: module._get_pc(),
        context: buildErrorContext(module, errorMessage),
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
    payload: readStateFromModule(module),
  } satisfies StateUpdateEvent);
}

/**
 * Start or restart the run interval with the given speed.
 * Shared logic used by both handleRun and handleSetSpeed.
 *
 * @param module - The WASM emulator module
 * @param speed - Instructions per ~16ms tick. 0 = max speed (1000 per tick, 0ms interval)
 */
function startRunInterval(module: EmulatorModule | Micro8EmulatorModule, speed: number): void {
  const instructionsPerTick = speed === 0 ? 1000 : Math.max(1, Math.floor(speed));
  const intervalMs = speed === 0 ? 0 : 16; // ~60fps for throttled, 0 for max

  runIntervalId = self.setInterval(() => {
    for (let i = 0; i < instructionsPerTick; i++) {
      // Check for halt
      if (module._is_halted() === 1) {
        handleStop();
        self.postMessage({
          type: 'STATE_UPDATE',
          payload: readStateFromModule(module),
        } satisfies StateUpdateEvent);
        self.postMessage({ type: 'HALTED' } satisfies HaltedEvent);
        return;
      }

      // Check for error
      if (module._has_error() === 1) {
        handleStop();
        const errorMessage = module.UTF8ToString(module._get_error_message());
        self.postMessage({
          type: 'ERROR',
          payload: {
            message: errorMessage,
            address: module._get_pc(),
            context: buildErrorContext(module, errorMessage),
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
          payload: readStateFromModule(module),
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
      payload: readStateFromModule(module),
    } satisfies StateUpdateEvent);
  }, intervalMs);
}

/**
 * Handle RUN command.
 * Start continuous execution with configurable speed.
 * @param speed - Instructions per ~16ms tick. 0 = max speed (1000 per tick, 0ms interval)
 */
export function handleRun(module: EmulatorModule | Micro8EmulatorModule, speed: number): void {
  // Don't start if already running
  if (runIntervalId !== null) {
    return;
  }

  // Don't start if halted or in error state
  if (module._is_halted() === 1 || module._has_error() === 1) {
    self.postMessage({
      type: 'STATE_UPDATE',
      payload: readStateFromModule(module),
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
export function handleSetSpeed(module: EmulatorModule | Micro8EmulatorModule, speed: number): void {
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
 * Also clears all breakpoints (Task 2.5, Story 5.8).
 */
export function handleReset(module: EmulatorModule | Micro8EmulatorModule): void {
  // Stop any running execution
  handleStop();

  // Reset CPU
  module._cpu_reset_instance();

  // Clear all breakpoints (Story 5.8, Task 2.5)
  breakpoints.clear();

  // Send state update
  self.postMessage({
    type: 'STATE_UPDATE',
    payload: readStateFromModule(module),
  } satisfies StateUpdateEvent);

  // Notify main thread that breakpoints were cleared
  self.postMessage({
    type: 'BREAKPOINTS_LIST',
    payload: { addresses: [] },
  } satisfies BreakpointsListEvent);
}

/**
 * Handle GET_STATE command.
 * Return current CPU state without modifying anything.
 */
export function handleGetState(module: EmulatorModule | Micro8EmulatorModule): void {
  self.postMessage({
    type: 'STATE_UPDATE',
    payload: readStateFromModule(module),
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
  module: EmulatorModule | Micro8EmulatorModule,
  state: CPUState
): void {
  // Stop any running execution
  handleStop();

  // Reset CPU first
  module._cpu_reset_instance();

  // Restore memory by loading the memory contents as if it were a program
  // This restores the full memory state (256 bytes for Micro4, 64KB for Micro8)
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
    payload: readStateFromModule(module),
  } satisfies StateUpdateEvent);
}

/**
 * Handle SET_BREAKPOINT command (Story 5.8).
 * Add a breakpoint at the specified address.
 *
 * @param address - Memory address to set breakpoint at (0-65535)
 */
export function handleSetBreakpoint(address: number): void {
  breakpoints.add(address);

  // Notify main thread of updated breakpoint list
  self.postMessage({
    type: 'BREAKPOINTS_LIST',
    payload: { addresses: Array.from(breakpoints).sort((a, b) => a - b) },
  } satisfies BreakpointsListEvent);
}

/**
 * Handle CLEAR_BREAKPOINT command (Story 5.8).
 * Remove a breakpoint at the specified address.
 *
 * @param address - Memory address to clear breakpoint from (0-65535)
 */
export function handleClearBreakpoint(address: number): void {
  breakpoints.delete(address);

  // Notify main thread of updated breakpoint list
  self.postMessage({
    type: 'BREAKPOINTS_LIST',
    payload: { addresses: Array.from(breakpoints).sort((a, b) => a - b) },
  } satisfies BreakpointsListEvent);
}

/**
 * Handle GET_BREAKPOINTS command (Story 5.8).
 * Return the current list of breakpoints.
 */
export function handleGetBreakpoints(): void {
  self.postMessage({
    type: 'BREAKPOINTS_LIST',
    payload: { addresses: Array.from(breakpoints).sort((a, b) => a - b) },
  } satisfies BreakpointsListEvent);
}

/**
 * Initialize the WASM module from a given JS glue file path (Story 11.2).
 * Path is received via INIT_WASM message from the main thread.
 * Returns true on success, false on failure (sets initError).
 *
 * @param wasmJsPath - Path to WASM JS glue file relative to BASE_URL (e.g., 'wasm/micro4-cpu.js')
 */
async function initializeWasm(wasmJsPath: string, stage: string = 'micro4'): Promise<boolean> {
  try {
    // Dynamic import for WASM module using absolute path from origin.
    // The @vite-ignore comment prevents Vite from statically analyzing this import,
    // which is necessary since the WASM is served from /public at runtime.
    const wasmUrl = new URL(`${import.meta.env.BASE_URL}${wasmJsPath}`, self.location.origin).href;
    const createModule = await import(/* @vite-ignore */ wasmUrl);
    const module = await createModule.default();

    // Stage-aware validation
    if (stage === 'micro8') {
      const validationError = validateMicro8EmulatorModule(module);
      if (validationError) {
        initError = `WASM validation failed: missing exports [${validationError.missingExports.join(', ')}], missing runtime methods [${validationError.missingRuntimeMethods.join(', ')}]`;
        return false;
      }

      wasmModule = module as Micro8EmulatorModule;
      currentStage = stage;

      // Initialize CPU on load — Micro8 init returns 1 on success, 0 on failure
      const initResult = (module as Micro8EmulatorModule)._cpu_init_instance();
      if (initResult === 0) {
        initError = 'Micro8 CPU initialization failed (memory allocation error)';
        wasmModule = null;
        currentStage = null;
        return false;
      }
    } else {
      const validationError = validateEmulatorModule(module);
      if (validationError) {
        initError = `WASM validation failed: missing exports [${validationError.missingExports.join(', ')}], missing runtime methods [${validationError.missingRuntimeMethods.join(', ')}]`;
        return false;
      }

      wasmModule = module as EmulatorModule;
      currentStage = stage;

      // Initialize CPU on load
      (module as EmulatorModule)._cpu_init_instance();
    }

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
        type: 'ERROR',
        payload: { message: 'INIT_WASM: missing or invalid wasmJsPath in payload' },
      } satisfies EmulatorErrorEvent);
      return;
    }
    const wasmJsPath = (rawPayload as { wasmJsPath: string }).wasmJsPath;
    const stage = (rawPayload as { wasmJsPath: string; stage?: string }).stage ?? 'micro4';
    initializeWasm(wasmJsPath, stage).then((success) => {
      if (success) {
        self.postMessage({ type: 'EMULATOR_READY' } satisfies EmulatorReadyEvent);
      } else {
        self.postMessage({
          type: 'ERROR',
          payload: {
            message: `Worker initialization failed: ${initError}`,
          },
        } satisfies EmulatorErrorEvent);
      }
    }).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : 'Unknown INIT_WASM error';
      self.postMessage({
        type: 'ERROR',
        payload: { message: `Worker initialization error: ${message}` },
      } satisfies EmulatorErrorEvent);
    });
    return;
  }

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
        payload: readStateFromModule(wasmModule),
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
    case 'SET_BREAKPOINT': {
      handleSetBreakpoint(data.payload.address);
      break;
    }
    case 'CLEAR_BREAKPOINT': {
      handleClearBreakpoint(data.payload.address);
      break;
    }
    case 'GET_BREAKPOINTS': {
      handleGetBreakpoints();
      break;
    }
    default: {
      // Type system ensures this is exhaustive, but log just in case
      console.warn('[EmulatorWorker] Unhandled message type:', data);
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
