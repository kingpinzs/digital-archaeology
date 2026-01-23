# Story 4.3: Implement EmulatorBridge Class

Status: done

---

## Story

As a developer,
I want a Promise-based API for the emulator,
So that UI code can easily interact with the worker.

## Acceptance Criteria

1. **Given** the emulator worker is running
   **When** I use EmulatorBridge
   **Then** `bridge.loadProgram(binary)` returns a Promise that resolves with initial CPU state

2. **And** `bridge.step()` returns a Promise that resolves with new CPU state after executing one instruction

3. **And** `bridge.run(speed)` starts continuous execution at the specified speed

4. **And** `bridge.stop()` pauses execution and returns current CPU state

5. **And** `bridge.reset()` resets CPU to initial state and returns the reset state

6. **And** `bridge.onStateUpdate(callback)` subscribes to state changes during RUN
   **And** returns an unsubscribe function

7. **And** `bridge.onHalted(callback)` subscribes to HALTED events
   **And** `bridge.onError(callback)` subscribes to ERROR events

---

## Tasks / Subtasks

- [x] Task 1: Create EmulatorBridge Class Structure (AC: #1-7)
  - [x] 1.1 Create `src/emulator/EmulatorBridge.ts` following AssemblerBridge pattern
  - [x] 1.2 Add private worker, initialized, initPromise properties
  - [x] 1.3 Add `isReady` getter for initialization state
  - [x] 1.4 Add callback storage: Set<> for onStateUpdate, onHalted, onError subscribers
  - [x] 1.5 Define DEFAULT_TIMEOUT_MS (10000ms) and INIT_TIMEOUT_MS (30000ms)

- [x] Task 2: Implement Initialization (AC: #1)
  - [x] 2.1 Create `init()` method returning Promise<void> (same pattern as AssemblerBridge)
  - [x] 2.2 Create worker using Vite's URL syntax: `new URL('./emulator.worker.ts', import.meta.url)`
  - [x] 2.3 Wait for EMULATOR_READY event before resolving
  - [x] 2.4 Handle ERROR event during initialization
  - [x] 2.5 Implement timeout for init (30 seconds)
  - [x] 2.6 Reuse existing init promise if called multiple times

- [x] Task 3: Implement loadProgram() (AC: #1)
  - [x] 3.1 Send LOAD_PROGRAM command with binary Uint8Array
  - [x] 3.2 Accept optional startAddr parameter (default: 0)
  - [x] 3.3 Wait for STATE_UPDATE response with initial CPU state
  - [x] 3.4 Return Promise<CPUState> resolving with loaded state
  - [x] 3.5 Throw if bridge not initialized

- [x] Task 4: Implement step() (AC: #2)
  - [x] 4.1 Send STEP command to worker
  - [x] 4.2 Wait for STATE_UPDATE response
  - [x] 4.3 Return Promise<CPUState> with new state after one instruction
  - [x] 4.4 Handle HALTED event (resolve with halted state)
  - [x] 4.5 Handle ERROR event (reject with error message)

- [x] Task 5: Implement run() and stop() (AC: #3, #4)
  - [x] 5.1 Create `run(speed: number)` sending RUN command with speed payload
  - [x] 5.2 Create `stop()` sending STOP command, returning Promise<CPUState>
  - [x] 5.3 Track isRunning state internally
  - [x] 5.4 Prevent multiple run() calls without stop()
  - [x] 5.5 Wait for STATE_UPDATE after STOP to get current state

- [x] Task 6: Implement reset() (AC: #5)
  - [x] 6.1 Send RESET command to worker
  - [x] 6.2 Wait for STATE_UPDATE response with reset state
  - [x] 6.3 Return Promise<CPUState> with initial state
  - [x] 6.4 Clear isRunning flag if running

- [x] Task 7: Implement Event Subscription (AC: #6, #7)
  - [x] 7.1 Create `onStateUpdate(callback)` adding to subscribers Set, return unsubscribe function
  - [x] 7.2 Create `onHalted(callback)` for HALTED events
  - [x] 7.3 Create `onError(callback)` for ERROR events
  - [x] 7.4 Set up permanent message listener for worker events
  - [x] 7.5 Dispatch events to all registered callbacks
  - [x] 7.6 Clean up subscriptions in terminate()

- [x] Task 8: Implement terminate() (AC: all)
  - [x] 8.1 Terminate worker
  - [x] 8.2 Clear all callback subscriptions
  - [x] 8.3 Reset initialized flag
  - [x] 8.4 Clear initPromise

- [x] Task 9: Write Comprehensive Tests (AC: #1-7)
  - [x] 9.1 Create `EmulatorBridge.test.ts` with mocked Worker
  - [x] 9.2 Test init() creates worker and waits for EMULATOR_READY
  - [x] 9.3 Test loadProgram() sends correct command and returns state
  - [x] 9.4 Test step() returns state after one instruction
  - [x] 9.5 Test run() sends command with speed
  - [x] 9.6 Test stop() sends command and returns current state
  - [x] 9.7 Test reset() returns initial state
  - [x] 9.8 Test onStateUpdate subscription and unsubscribe
  - [x] 9.9 Test onHalted callback fires on HALTED event
  - [x] 9.10 Test onError callback fires on ERROR event
  - [x] 9.11 Test terminate() cleans up resources

- [x] Task 10: Verify Integration (AC: all)
  - [x] 10.1 Run `npm test` - all tests pass (893 tests)
  - [x] 10.2 Run `npm run build` - Vite builds correctly
  - [x] 10.3 TypeScript compilation passes
  - [x] 10.4 Export EmulatorBridge from src/emulator/index.ts

---

## Dev Notes

### Previous Story Intelligence (Story 4.2)

**Critical Assets Created:**
- `src/emulator/emulator.worker.ts` - Complete Web Worker with all 6 handlers
- `src/emulator/types.ts` - EmulatorCommand, EmulatorEvent, CPUState types
- All message types defined and tested (LOAD_PROGRAM, STEP, RUN, STOP, RESET, GET_STATE)
- All event types defined (STATE_UPDATE, HALTED, ERROR, BREAKPOINT_HIT, EMULATOR_READY)

**Key Patterns from Story 4.2:**
- Worker responds to LOAD_PROGRAM with STATE_UPDATE
- Worker responds to STEP with STATE_UPDATE (or HALTED/ERROR)
- Worker responds to RESET with STATE_UPDATE
- Worker responds to STOP with STATE_UPDATE (code review fix applied)
- RUN sends periodic STATE_UPDATE events until HALTED/ERROR

**Code Review Learnings (Story 4.2):**
1. STOP command now sends STATE_UPDATE for UI sync
2. Speed validation rejects NaN, Infinity, negative values
3. Memory copied via `.slice()` to avoid detached buffer issues

### AssemblerBridge Pattern to Mirror

**From `src/emulator/AssemblerBridge.ts` (325 lines):**

```typescript
export class AssemblerBridge {
  private worker: Worker | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  get isReady(): boolean {
    return this.initialized && this.worker !== null;
  }

  init(): Promise<void> {
    if (this.initialized) return Promise.resolve();
    if (this.initPromise) return this.initPromise;
    this.initPromise = this.doInit();
    return this.initPromise;
  }

  private async doInit(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.worker = new Worker(
        new URL('./assembler.worker.ts', import.meta.url),
        { type: 'module' }
      );
      // ... timeout and event handling
    });
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.initialized = false;
    this.initPromise = null;
  }
}
```

### EmulatorBridge Implementation Pattern

```typescript
// src/emulator/EmulatorBridge.ts
import type {
  EmulatorCommand,
  EmulatorEvent,
  CPUState,
} from './types';

const DEFAULT_TIMEOUT_MS = 10000;
const INIT_TIMEOUT_MS = 30000;

type StateUpdateCallback = (state: CPUState) => void;
type HaltedCallback = () => void;
type ErrorCallback = (error: { message: string; address?: number }) => void;

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

  get isReady(): boolean {
    return this.initialized && this.worker !== null;
  }

  init(): Promise<void> {
    if (this.initialized) return Promise.resolve();
    if (this.initPromise) return this.initPromise;
    this.initPromise = this.doInit();
    return this.initPromise;
  }

  private async doInit(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
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
          clearTimeout(timeout);
          this.worker?.terminate();
          this.worker = null;
          reject(new Error(data.payload.message));
        }
      };

      const handleError = (event: ErrorEvent) => {
        clearTimeout(timeout);
        this.worker?.terminate();
        this.worker = null;
        reject(new Error(`Worker error: ${event.message}`));
      };

      this.worker.addEventListener('message', handleInit);
      this.worker.addEventListener('error', handleError);
    });
  }

  /**
   * Set up permanent listener for ongoing events (STATE_UPDATE, HALTED, ERROR)
   */
  private setupPermanentListener(): void {
    if (!this.worker) return;

    this.boundMessageHandler = (event: MessageEvent<EmulatorEvent>) => {
      this.handleWorkerEvent(event.data);
    };
    this.worker.addEventListener('message', this.boundMessageHandler);
  }

  private handleWorkerEvent(event: EmulatorEvent): void {
    switch (event.type) {
      case 'STATE_UPDATE':
        this.stateUpdateSubscribers.forEach(cb => cb(event.payload));
        break;
      case 'HALTED':
        this.isRunning = false;
        this.haltedSubscribers.forEach(cb => cb());
        break;
      case 'ERROR':
        this.isRunning = false;
        this.errorSubscribers.forEach(cb => cb(event.payload));
        break;
      // EMULATOR_READY and BREAKPOINT_HIT handled elsewhere or future
    }
  }

  /**
   * Load a program into the emulator.
   * @param binary - The assembled program bytes
   * @param startAddr - Starting address (default: 0)
   * @returns Promise<CPUState> - Initial CPU state after load
   */
  async loadProgram(binary: Uint8Array, startAddr: number = 0): Promise<CPUState> {
    this.ensureInitialized();
    const worker = this.worker!;

    return this.sendCommandAndWaitForState(worker, {
      type: 'LOAD_PROGRAM',
      payload: { binary, startAddr },
    });
  }

  /**
   * Execute one instruction.
   * @returns Promise<CPUState> - CPU state after execution
   */
  async step(): Promise<CPUState> {
    this.ensureInitialized();
    const worker = this.worker!;

    return this.sendCommandAndWaitForState(worker, { type: 'STEP' });
  }

  /**
   * Start continuous execution.
   * @param speed - Execution speed (0 = max, >0 = instructions per 16ms tick)
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
   * Stop continuous execution.
   * @returns Promise<CPUState> - Current CPU state when stopped
   */
  async stop(): Promise<CPUState> {
    this.ensureInitialized();
    const worker = this.worker!;

    this.isRunning = false;
    return this.sendCommandAndWaitForState(worker, { type: 'STOP' });
  }

  /**
   * Reset CPU to initial state.
   * @returns Promise<CPUState> - Reset CPU state
   */
  async reset(): Promise<CPUState> {
    this.ensureInitialized();
    const worker = this.worker!;

    if (this.isRunning) {
      this.isRunning = false;
      // Send STOP first to ensure clean state
      worker.postMessage({ type: 'STOP' } satisfies EmulatorCommand);
    }

    return this.sendCommandAndWaitForState(worker, { type: 'RESET' });
  }

  /**
   * Get current CPU state.
   * @returns Promise<CPUState> - Current CPU state
   */
  async getState(): Promise<CPUState> {
    this.ensureInitialized();
    const worker = this.worker!;

    return this.sendCommandAndWaitForState(worker, { type: 'GET_STATE' });
  }

  /**
   * Subscribe to CPU state updates during RUN.
   * @returns Unsubscribe function
   */
  onStateUpdate(callback: StateUpdateCallback): () => void {
    this.stateUpdateSubscribers.add(callback);
    return () => this.stateUpdateSubscribers.delete(callback);
  }

  /**
   * Subscribe to HALTED events.
   * @returns Unsubscribe function
   */
  onHalted(callback: HaltedCallback): () => void {
    this.haltedSubscribers.add(callback);
    return () => this.haltedSubscribers.delete(callback);
  }

  /**
   * Subscribe to ERROR events.
   * @returns Unsubscribe function
   */
  onError(callback: ErrorCallback): () => void {
    this.errorSubscribers.add(callback);
    return () => this.errorSubscribers.delete(callback);
  }

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

  private ensureInitialized(): void {
    if (!this.worker || !this.initialized) {
      throw new Error('EmulatorBridge not initialized. Call init() first.');
    }
  }

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
```

### Key Differences from AssemblerBridge

| AssemblerBridge | EmulatorBridge |
|-----------------|----------------|
| Single assemble() method | Multiple methods (step, run, stop, reset, loadProgram) |
| Request-response only | Event subscription pattern for RUN |
| No persistent state | Tracks isRunning state |
| No event callbacks | onStateUpdate, onHalted, onError callbacks |
| WORKER_READY event | EMULATOR_READY event |

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
        ├── EmulatorBridge.ts        # NEW: Promise-based emulator API
        └── EmulatorBridge.test.ts   # NEW: Bridge tests
```

**Files to modify:**
```
digital-archaeology-web/
└── src/
    └── emulator/
        └── index.ts                  # ADD: Export EmulatorBridge
```

### Architecture Compliance

- Bridge class in `src/emulator/` per feature folder pattern
- Uses types from `./types.ts` (same module)
- Named exports only, no default exports
- camelCase for method names and parameters
- Follows established AssemblerBridge patterns exactly
- Event listener cleanup in terminate() per project-context.md

### Anti-Patterns to Avoid

| Don't | Do |
|-------|-----|
| Create new Worker per operation | Reuse single worker after init() |
| Forget to unsubscribe callbacks | Always return unsubscribe function |
| Allow multiple run() calls | Track isRunning state, ignore if already running |
| Leave listeners on terminated worker | Remove permanent listener in terminate() |
| Use default exports | Named exports only |
| Hardcode timeout values | Use constants (DEFAULT_TIMEOUT_MS, INIT_TIMEOUT_MS) |

### Critical Technical Requirements

1. **Worker Reuse:** Single worker instance for entire bridge lifecycle, not per-operation

2. **Callback Cleanup:** All subscriptions must be clearable via terminate()

3. **Type Safety:** Use `satisfies` operator for all postMessage calls

4. **Bound Handlers:** Store bound message handler for cleanup (per project-context.md pattern)

5. **isRunning State:** Prevent multiple simultaneous run() calls

6. **Promise Identity:** init() returns same promise if called multiple times

### Testing Strategy

**Mock Worker Pattern:**
```typescript
// Create mock worker
const mockWorker = {
  postMessage: vi.fn(),
  terminate: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

// Mock Worker constructor
vi.stubGlobal('Worker', vi.fn(() => mockWorker));

// Simulate EMULATOR_READY
const messageHandler = mockWorker.addEventListener.mock.calls
  .find(call => call[0] === 'message')?.[1];
messageHandler({ data: { type: 'EMULATOR_READY' } });
```

**Test Cases:**
```typescript
describe('EmulatorBridge', () => {
  describe('init()', () => {
    it('creates worker and waits for EMULATOR_READY');
    it('returns same promise if called multiple times');
    it('rejects on timeout');
    it('rejects on worker error');
  });

  describe('loadProgram()', () => {
    it('sends LOAD_PROGRAM command with binary');
    it('returns CPUState from STATE_UPDATE');
    it('throws if not initialized');
  });

  describe('step()', () => {
    it('sends STEP command');
    it('returns new CPUState');
    it('handles HALTED event');
  });

  describe('run()', () => {
    it('sends RUN command with speed');
    it('sets isRunning flag');
    it('ignores if already running');
  });

  describe('stop()', () => {
    it('sends STOP command');
    it('returns current CPUState');
    it('clears isRunning flag');
  });

  describe('reset()', () => {
    it('sends RESET command');
    it('returns initial CPUState');
    it('stops running execution first');
  });

  describe('event subscriptions', () => {
    it('onStateUpdate fires for STATE_UPDATE events');
    it('onHalted fires for HALTED events');
    it('onError fires for ERROR events');
    it('unsubscribe removes callback');
  });

  describe('terminate()', () => {
    it('terminates worker');
    it('clears all subscriptions');
    it('removes permanent message listener');
  });
});
```

### Learnings from Epic 3 to Apply

**From Epic 3 Retrospective (Action Items):**
1. **Plan state reset points upfront** - terminate() clears isRunning, all subscriptions
2. **Document patterns as established** - Following AssemblerBridge exactly
3. **Code review found missing resets** - terminate() must clear ALL state

**From Story 4.1/4.2:**
1. **Worker already initializes CPU** - emulator.worker.ts calls `_cpu_init_instance()` on WASM load
2. **STOP sends STATE_UPDATE** - Fixed in 4.2 code review, bridge can rely on this
3. **Speed validation in worker** - Bridge doesn't need to re-validate speed

### Git Intelligence (Recent Commits)

```
1ede3c8 feat(web): create emulator web worker (Story 4.2)
ba86ba7 feat(web): compile emulator to WASM (Story 4.1)
21e63d2 docs: complete Epic 3 retrospective
dab83ca feat(web): validate syntax before execution (Story 3.7)
```

**Pattern from Stories 4.1-4.2:** Commit message format: `feat(web): <action> (Story X.Y)`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.3]
- [Source: _bmad-output/planning-artifacts/architecture.md#State Management]
- [Source: _bmad-output/implementation-artifacts/4-2-create-emulator-web-worker.md]
- [Source: _bmad-output/implementation-artifacts/4-1-compile-emulator-to-wasm.md]
- [Source: _bmad-output/project-context.md#Event Listener Cleanup Pattern]
- [Source: digital-archaeology-web/src/emulator/AssemblerBridge.ts]
- [Source: digital-archaeology-web/src/emulator/emulator.worker.ts]
- [Source: digital-archaeology-web/src/emulator/types.ts]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None - Implementation proceeded without errors.

### Completion Notes List

1. Created `EmulatorBridge.ts` (336 lines) following AssemblerBridge pattern exactly
2. Implemented all 8 public methods: init, loadProgram, step, run, stop, reset, getState, terminate
3. Implemented event subscription system with unsubscribe functions: onStateUpdate, onHalted, onError
4. Created comprehensive test suite with 49 tests covering all acceptance criteria
5. Tests use mock Worker class pattern for isolated testing
6. All 893 project tests pass (49 new tests added)
7. Build successful - TypeScript compilation passes
8. Exported EmulatorBridge and callback types from index.ts

### Implementation Notes

- Mirrored AssemblerBridge's init promise reuse pattern
- Used `satisfies` operator for type-safe postMessage calls
- Implemented bound handler pattern for event listener cleanup per project-context.md
- Added getState() method for convenience (not in original AC but useful)
- HALTED handling in sendCommandAndWaitForState calls getState() to get final state

### File List

**New Files:**
- `digital-archaeology-web/src/emulator/EmulatorBridge.ts` - Promise-based emulator API (336 lines)
- `digital-archaeology-web/src/emulator/EmulatorBridge.test.ts` - Comprehensive tests (862 lines, 49 tests)

**Modified Files:**
- `digital-archaeology-web/src/emulator/index.ts` - Added EmulatorBridge export + callback types

### Change Log

| Date | Change | Details |
|------|--------|---------|
| 2026-01-22 | Story completed | Implemented EmulatorBridge class with full test coverage |
| 2026-01-22 | Code review fixes | Fixed 6 issues: JSDoc for callback types, race condition in reset(), added worker error test, improved test robustness |

### Code Review Fixes Applied

1. **JSDoc for callback types** - Added comprehensive documentation to StateUpdateCallback, HaltedCallback, ErrorCallback
2. **Race condition in reset()** - Now awaits STOP completion before sending RESET
3. **Worker error test** - Added test for worker crash during step() operation
4. **Test robustness** - Replaced setTimeout(0) with vi.waitFor() for HALTED test
5. **Test update** - Updated reset() test to handle sequential STOP→RESET with responses

894 tests passing after fixes.
