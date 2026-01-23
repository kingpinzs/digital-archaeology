# Story 4.2: Create Emulator Web Worker

Status: done

---

## Story

As a developer,
I want the emulator to run in a Web Worker,
So that execution doesn't block the UI.

## Acceptance Criteria

1. **Given** the WASM emulator module is built
   **When** the application initializes
   **Then** a Web Worker is created for the emulator

2. **And** the worker loads the WASM module (micro4-cpu.js/wasm)

3. **And** the worker responds to LOAD_PROGRAM, STEP, RUN, STOP, RESET, GET_STATE messages

4. **And** the worker sends STATE_UPDATE, HALTED, ERROR, BREAKPOINT_HIT, EMULATOR_READY events

## Tasks / Subtasks

- [x] Task 1: Create Emulator Worker File Structure (AC: #1, #2)
  - [x] 1.1 Create `src/emulator/emulator.worker.ts` following assembler.worker.ts pattern
  - [x] 1.2 Add `/// <reference lib="webworker" />` directive for TypeScript
  - [x] 1.3 Implement `initializeWasm()` to load `/wasm/micro4-cpu.js` module
  - [x] 1.4 Use `validateEmulatorModule()` to verify WASM exports
  - [x] 1.5 Send `EMULATOR_READY` event after successful initialization

- [x] Task 2: Implement Message Handlers (AC: #3)
  - [x] 2.1 Create `isEmulatorCommand()` type guard for all command types
  - [x] 2.2 Implement `handleLoadProgram(binary, startAddr?)` - copy to WASM memory, reset CPU
  - [x] 2.3 Implement `handleStep()` - execute one instruction, return state
  - [x] 2.4 Implement `handleRun(speed)` - start run loop with requestAnimationFrame or setInterval
  - [x] 2.5 Implement `handleStop()` - cancel run loop
  - [x] 2.6 Implement `handleReset()` - call cpu_reset_instance(), return state
  - [x] 2.7 Implement `handleGetState()` - read all CPU state, return snapshot

- [x] Task 3: Implement State Reading Helper (AC: #4)
  - [x] 3.1 Create `readCPUState(module: EmulatorModule): CPUState` function
  - [x] 3.2 Read all register values (pc, accumulator, zeroFlag)
  - [x] 3.3 Read halted/error status and error message
  - [x] 3.4 Read memory via `get_memory_ptr()` - create fresh Uint8Array view each call
  - [x] 3.5 Read internal registers (ir, mar, mdr) for debugging
  - [x] 3.6 Read statistics (cycles, instructions)

- [x] Task 4: Implement Run Loop (AC: #3, #4)
  - [x] 4.1 Create `runLoop()` function with configurable speed (instructions per tick)
  - [x] 4.2 Use `setInterval` for speed control (speed=0 means max speed)
  - [x] 4.3 Send STATE_UPDATE events periodically during run (throttled)
  - [x] 4.4 Send HALTED event when `is_halted()` returns true
  - [x] 4.5 Send ERROR event when `has_error()` returns true
  - [x] 4.6 Support stopping run loop via `handleStop()`

- [x] Task 5: Write Worker Tests (AC: #1-4)
  - [x] 5.1 Create `emulator.worker.test.ts` following assembler.worker.test.ts pattern
  - [x] 5.2 Test `isEmulatorCommand()` type guard for all command types
  - [x] 5.3 Test `handleLoadProgram()` with mocked WASM module
  - [x] 5.4 Test `handleStep()` with mocked module returning state
  - [x] 5.5 Test `handleReset()` resets state correctly
  - [x] 5.6 Test `handleGetState()` returns full CPUState
  - [x] 5.7 Test error handling when WASM module not loaded

- [x] Task 6: Verify Integration (AC: #1-4)
  - [x] 6.1 Run `npm test` - all tests pass (833 tests)
  - [x] 6.2 Run `npm run build` - Vite bundles correctly
  - [x] 6.3 Verify worker file ready (will be bundled when EmulatorBridge imports it in Story 4.3)
  - [x] 6.4 TypeScript compilation passes

---

## Dev Notes

### Pattern from Story 3.2 (assembler.worker.ts)

The emulator worker follows the **exact same architecture** as the assembler worker:

1. **File structure**: `src/emulator/emulator.worker.ts`
2. **Reference directive**: `/// <reference lib="webworker" />`
3. **Global module**: `let wasmModule: EmulatorModule | null = null`
4. **Init error tracking**: `let initError: string | null = null`
5. **Type guard**: `isEmulatorCommand()` validates incoming messages
6. **WASM loading**: Dynamic import with `@vite-ignore` comment
7. **Validation**: `validateEmulatorModule()` checks exports
8. **Ready event**: Send `EMULATOR_READY` when initialized
9. **Context check**: Only auto-init in real worker context

### Emulator-Specific Differences from Assembler

| Assembler Worker | Emulator Worker |
|------------------|-----------------|
| Single request-response (ASSEMBLE) | Multiple commands (LOAD, STEP, RUN, STOP, RESET, GET_STATE) |
| No persistent state | Persistent CPU state across commands |
| One message type | Six command types |
| One response pattern | Multiple event types + run loop |
| No continuous operation | RUN command runs continuously |

### WASM Module Loading Pattern

```typescript
// In emulator.worker.ts
async function initializeWasm(): Promise<boolean> {
  try {
    const wasmUrl = new URL('/wasm/micro4-cpu.js', self.location.origin).href;
    const createModule = await import(/* @vite-ignore */ wasmUrl);
    const module: EmulatorModule = await createModule.default();

    const validationError = validateEmulatorModule(module);
    if (validationError) {
      initError = `WASM validation failed: missing exports [${validationError.missingExports.join(', ')}]`;
      return false;
    }

    wasmModule = module;

    // Initialize CPU on load
    module._cpu_init_instance();

    return true;
  } catch (error) {
    initError = error instanceof Error ? error.message : 'Unknown error';
    return false;
  }
}
```

### State Reading Pattern (from Story 4.1 dev notes)

```typescript
function readCPUState(module: EmulatorModule): CPUState {
  return {
    pc: module._get_pc(),
    accumulator: module._get_accumulator(),
    zeroFlag: module._get_zero_flag() === 1,
    halted: module._is_halted() === 1,
    error: module._has_error() === 1,
    errorMessage: module._has_error()
      ? module.UTF8ToString(module._get_error_message())
      : null,
    // IMPORTANT: Create fresh view each time - buffer can be replaced
    memory: new Uint8Array(
      module.HEAPU8.buffer,
      module._get_memory_ptr(),
      256
    ).slice(), // .slice() creates a copy, safe from buffer changes
    ir: module._get_ir(),
    mar: module._get_mar(),
    mdr: module._get_mdr(),
    cycles: module._get_cycles(),
    instructions: module._get_instructions(),
  };
}
```

### Message Handling Pattern

```typescript
function handleMessage(event: MessageEvent): void {
  const data = event.data;

  if (!isEmulatorCommand(data)) {
    console.warn('[EmulatorWorker] Unknown message:', data);
    return;
  }

  if (!wasmModule) {
    self.postMessage({
      type: 'ERROR',
      payload: { message: initError ?? 'WASM not initialized' },
    } satisfies EmulatorErrorEvent);
    return;
  }

  switch (data.type) {
    case 'LOAD_PROGRAM':
      handleLoadProgram(wasmModule, data.payload.binary, data.payload.startAddr);
      break;
    case 'STEP':
      handleStep(wasmModule);
      break;
    case 'RUN':
      handleRun(wasmModule, data.payload.speed);
      break;
    case 'STOP':
      handleStop();
      break;
    case 'RESET':
      handleReset(wasmModule);
      break;
    case 'GET_STATE':
      handleGetState(wasmModule);
      break;
  }
}
```

### Load Program Handler

```typescript
function handleLoadProgram(
  module: EmulatorModule,
  binary: Uint8Array,
  startAddr: number = 0
): void {
  // Reset CPU first
  module._cpu_reset_instance();

  // Allocate WASM memory for program
  const programPtr = module._malloc(binary.length);

  // Copy program to WASM memory
  module.HEAPU8.set(binary, programPtr);

  // Load into CPU memory
  module._cpu_load_program_instance(programPtr, binary.length, startAddr);

  // Free the buffer
  module._free(programPtr);

  // Send state update
  self.postMessage({
    type: 'STATE_UPDATE',
    payload: readCPUState(module),
  } satisfies StateUpdateEvent);
}
```

### Run Loop Implementation

```typescript
let runIntervalId: number | null = null;

function handleRun(module: EmulatorModule, speed: number): void {
  if (runIntervalId !== null) {
    return; // Already running
  }

  const instructionsPerTick = speed === 0 ? 1000 : Math.max(1, speed);
  const intervalMs = speed === 0 ? 0 : 16; // ~60fps for throttled, 0 for max

  runIntervalId = self.setInterval(() => {
    for (let i = 0; i < instructionsPerTick; i++) {
      if (module._is_halted() === 1) {
        handleStop();
        self.postMessage({ type: 'HALTED' } satisfies HaltedEvent);
        return;
      }

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

      module._cpu_step_instance();
    }

    // Send state update (throttled to once per tick)
    self.postMessage({
      type: 'STATE_UPDATE',
      payload: readCPUState(module),
    } satisfies StateUpdateEvent);
  }, intervalMs);
}

function handleStop(): void {
  if (runIntervalId !== null) {
    self.clearInterval(runIntervalId);
    runIntervalId = null;
  }
}
```

### Type Guard Pattern

```typescript
export function isEmulatorCommand(data: unknown): data is EmulatorCommand {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;

  switch (obj.type) {
    case 'LOAD_PROGRAM':
      return (
        typeof obj.payload === 'object' &&
        obj.payload !== null &&
        'binary' in obj.payload &&
        obj.payload.binary instanceof Uint8Array
      );
    case 'STEP':
    case 'STOP':
    case 'RESET':
    case 'GET_STATE':
      return true;
    case 'RUN':
      return (
        typeof obj.payload === 'object' &&
        obj.payload !== null &&
        'speed' in obj.payload &&
        typeof (obj.payload as Record<string, unknown>).speed === 'number'
      );
    default:
      return false;
  }
}
```

### Accessibility Checklist

<!-- This story is infrastructure-only (no UI). Mark N/A for all. -->

- [N/A] **Keyboard Navigation** - No UI components
- [N/A] **ARIA Attributes** - No UI components
- [N/A] **Focus Management** - No UI components
- [N/A] **Color Contrast** - No UI components
- [N/A] **XSS Prevention** - No user-visible content
- [N/A] **Screen Reader Announcements** - No UI components

### Project Structure Notes

**New files to create:**
```
digital-archaeology-web/
└── src/
    └── emulator/
        ├── emulator.worker.ts        # NEW: Emulator Web Worker
        └── emulator.worker.test.ts   # NEW: Worker tests
```

**Files to modify:**
```
digital-archaeology-web/
└── src/
    └── emulator/
        └── index.ts                  # ADD: Export worker types if needed
```

### Architecture Compliance

- Worker file in `src/emulator/` per feature folder pattern
- Uses types from `./types` (same module)
- Named exports only, no default exports
- SCREAMING_SNAKE_CASE for command/event types
- camelCase for function names and payload keys
- Worker context detection before auto-init

### Anti-Patterns to Avoid

| Don't | Do |
|-------|-----|
| Cache HEAPU8 views | Create fresh view each readCPUState() call |
| Send state every instruction | Throttle STATE_UPDATE during RUN |
| Block on RUN forever | Use setInterval, check halted/error each tick |
| Forget to call _cpu_init_instance | Initialize CPU on WASM load |
| Use postMessage without type assertion | Use `satisfies` for type safety |
| Hardcode interval timing | Make speed configurable via RUN payload |

### Critical Technical Requirements

1. **Copy memory on read**: Use `.slice()` when reading memory to avoid detached buffer issues

2. **Initialize CPU on load**: Call `_cpu_init_instance()` immediately after WASM validation

3. **Run loop cleanup**: Always clear interval in handleStop() and on halt/error

4. **Type safety**: Use `satisfies` operator for all postMessage calls

5. **Worker context check**: Only auto-initialize when `importScripts` exists

6. **Error state check**: Always check `_has_error()` before continuing execution

### Learnings from Story 4.1 to Apply

1. **Memory view warning**: Always create fresh Uint8Array view - buffer can be replaced with ALLOW_MEMORY_GROWTH=1

2. **Error message lifetime**: Copy error string immediately via UTF8ToString() before other CPU operations

3. **64-bit precision**: cycles/instructions safe for typical programs, may lose precision after 2^53 cycles

4. **Input validation**: cpu_load_program_instance rejects negative size (returns early)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.2]
- [Source: _bmad-output/planning-artifacts/architecture.md#WASM Integration]
- [Source: _bmad-output/implementation-artifacts/4-1-compile-emulator-to-wasm.md]
- [Source: digital-archaeology-web/src/emulator/assembler.worker.ts]
- [Source: digital-archaeology-web/src/emulator/types.ts]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - No errors encountered during implementation.

### Completion Notes List

1. **emulator.worker.ts Created**: Complete Web Worker implementation with:
   - WASM module loading via dynamic import with `@vite-ignore`
   - Module validation using `validateEmulatorModule()`
   - CPU initialization on WASM load
   - All 6 command handlers (LOAD_PROGRAM, STEP, RUN, STOP, RESET, GET_STATE)
   - All 5 event types (STATE_UPDATE, HALTED, ERROR, BREAKPOINT_HIT, EMULATOR_READY)
   - Run loop with configurable speed (setInterval)
   - Breakpoint support infrastructure
   - Worker context detection for testing

2. **readCPUState() Helper**: Reads all CPU state fields with:
   - Memory copied via `.slice()` to avoid detached buffer issues
   - Error message read via UTF8ToString before other operations
   - All register, flag, and statistic values

3. **isEmulatorCommand() Type Guard**: Validates all command types including:
   - LOAD_PROGRAM with binary (Uint8Array or array-like from postMessage)
   - RUN with speed parameter
   - Payload-less commands (STEP, STOP, RESET, GET_STATE)

4. **Run Loop Implementation**: Configurable execution speed:
   - speed=0: Max speed (1000 instructions/tick, 0ms interval)
   - speed>0: Throttled (~60fps, instructions per tick = speed)
   - Checks halt/error state each instruction
   - Breakpoint support with BREAKPOINT_HIT event

5. **Test Suite**: 50 new tests covering:
   - All type guard validations
   - All handler functions with mocked WASM module
   - State reading and memory safety
   - Run loop start/stop mechanics
   - Error handling scenarios

6. **Build Verification**:
   - TypeScript compilation: PASS
   - npm test: PASS (844 tests, +61 new including code review additions)
   - npm run build: PASS
   - Worker will be bundled when EmulatorBridge imports it (Story 4.3)

7. **Code Review Fixes Applied**:
   - STOP command now sends STATE_UPDATE for UI sync
   - Breakpoint behavior documented (STEP vs RUN difference is intentional)
   - Speed validation rejects NaN, Infinity, and negative values
   - Run loop callback execution fully tested (11 new tests)

### File List

**New Files:**
- `digital-archaeology-web/src/emulator/emulator.worker.ts` - Emulator Web Worker
- `digital-archaeology-web/src/emulator/emulator.worker.test.ts` - Worker tests (50 tests)

### Change Log

- **2026-01-22**: Story 4.2 implementation complete
  - Created emulator.worker.ts with full message handling
  - Implemented all 6 command handlers and 5 event types
  - Added readCPUState() with memory safety (buffer copy via slice)
  - Implemented run loop with configurable speed
  - Added 50 comprehensive tests
  - All 833 tests pass, TypeScript and Vite builds succeed

- **2026-01-22**: Code review fixes applied
  - **Issue 1**: Added STATE_UPDATE event after STOP command so UI reflects current state
  - **Issue 2**: Documented intentional breakpoint behavior difference between STEP (executes then notifies) and RUN (stops before executing)
  - **Issue 3**: Added validation in isEmulatorCommand() to reject NaN, Infinity, and negative speed values
  - **Issue 4**: Added 11 new tests for run loop callback execution (halt detection, error detection, instructions per tick, etc.)
  - All 844 tests pass (+11 new tests), TypeScript and Vite builds succeed

