# Story 4.8: Implement Speed Control

Status: completed

---

## Story

As a user,
I want to control execution speed,
So that I can watch slowly or run fast.

## Acceptance Criteria

1. **Given** a program is running
   **When** I adjust the speed slider
   **Then** execution speed changes in real-time

2. **And** speed range is 1Hz to 1000Hz

3. **And** current speed is shown (e.g., "10 Hz")

4. **And** speed persists across runs

## Tasks / Subtasks

- [x] Task 1: Add SET_SPEED Command to Worker (AC: #1)
  - [x] 1.1 Add `SET_SPEED` to `EmulatorCommand` type in types.ts
  - [x] 1.2 Add type guard for `SET_SPEED` in `isEmulatorCommand()` (emulator.worker.ts)
  - [x] 1.3 Implement `handleSetSpeed()` function to update running interval
  - [x] 1.4 Extract shared `startRunInterval()` function for speed-based interval creation
  - [x] 1.5 Add message handler case for `SET_SPEED` command

- [x] Task 2: Add setSpeed() to EmulatorBridge (AC: #1)
  - [x] 2.1 Add `setSpeed(speed: number): void` method to EmulatorBridge
  - [x] 2.2 Method sends `SET_SPEED` command to worker if running
  - [x] 2.3 Update internal speed tracking if needed

- [x] Task 3: Wire handleSpeedChange to Update Running Execution (AC: #1)
  - [x] 3.1 Modify `handleSpeedChange()` in App.ts to call `emulatorBridge.setSpeed()`
  - [x] 3.2 Only call setSpeed if program is currently running
  - [x] 3.3 Status bar already updates via existing code

- [x] Task 4: Verify Existing Functionality (AC: #2, #3, #4)
  - [x] 4.1 Verify speed range is 1-1000Hz (already in Toolbar.ts)
  - [x] 4.2 Verify speed label shows "X Hz" format (already in Toolbar.ts)
  - [x] 4.3 Verify speed persists across runs (already via executionSpeed state)
  - [x] 4.4 Verify status bar shows speed while running (already implemented)

- [x] Task 5: Add Tests for Real-Time Speed Change
  - [x] 5.1 Test setSpeed() sends SET_SPEED command to worker
  - [x] 5.2 Test handleSpeedChange() calls setSpeed() when running
  - [x] 5.3 Test handleSpeedChange() does NOT call setSpeed() when not running
  - [x] 5.4 Test worker SET_SPEED handler updates running interval
  - [x] 5.5 Test speed change takes effect immediately during execution

- [x] Task 6: Integration Verification
  - [x] 6.1 Run `npm test` - all tests pass
  - [x] 6.2 Run `npm run build` - build succeeds

---

## Dev Notes

### Current Implementation Status

**PARTIALLY IMPLEMENTED in Story 4.5:**
- ✅ Speed slider exists in Toolbar (1-1000Hz range)
- ✅ Speed label shows "X Hz" format
- ✅ `handleSpeedChange()` exists in App.ts
- ✅ Status bar displays speed while running
- ✅ Speed persists in `executionSpeed` state
- ❌ **MISSING: Real-time speed change during execution**

### Gap Analysis

The current implementation sets speed when `run()` is called, but changing the slider while running does NOT affect the running execution. The worker needs a `SET_SPEED` command to update the interval dynamically.

**Current handleSpeedChange (App.ts:982-988):**
```typescript
private handleSpeedChange(speed: number): void {
  this.executionSpeed = speed;
  // Update status bar if currently running
  if (this.isRunning) {
    this.statusBar?.updateState({ speed: this.executionSpeed });
  }
  // MISSING: emulatorBridge.setSpeed(speed) to affect running execution!
}
```

### Worker Architecture (emulator.worker.ts)

**Current run loop (lines 225-250):**
```typescript
export function handleRun(module: EmulatorModule, speed: number): void {
  if (runIntervalId !== null) return;

  const instructionsPerTick = speed === 0 ? 1000 : Math.max(1, Math.floor(speed));
  const intervalMs = speed === 0 ? 0 : 16; // ~60fps

  runIntervalId = self.setInterval(() => {
    // Execute instructionsPerTick instructions per tick
  }, intervalMs);
}
```

**New handleSetSpeed function needed:**
```typescript
let currentSpeed: number = 1; // Worker-level speed tracking

export function handleSetSpeed(module: EmulatorModule, speed: number): void {
  // Only update if currently running
  if (runIntervalId === null) return;

  currentSpeed = speed;

  // Clear existing interval
  self.clearInterval(runIntervalId);

  // Restart with new speed
  const instructionsPerTick = speed === 0 ? 1000 : Math.max(1, Math.floor(speed));
  const intervalMs = speed === 0 ? 0 : 16;

  runIntervalId = self.setInterval(() => {
    // Same execution logic as handleRun
  }, intervalMs);
}
```

### EmulatorBridge Extension

**Add to EmulatorBridge.ts:**
```typescript
/**
 * Change execution speed while running.
 * Only affects execution if currently running.
 *
 * @param speed - New speed (0 = max speed, >0 = instructions per ~16ms tick)
 */
setSpeed(speed: number): void {
  if (!this.isRunning || !this.worker) return;

  this.worker.postMessage({
    type: 'SET_SPEED',
    payload: { speed },
  } satisfies EmulatorCommand);
}
```

### Types Extension (types.ts)

**Add to EmulatorCommand type:**
```typescript
| { type: 'SET_SPEED'; payload: { speed: number } }
```

### Previous Story Intelligence (Story 4.5/4.6/4.7)

Stories 4.5-4.7 established patterns for:
- Worker command/response architecture
- EmulatorBridge methods pattern
- App.ts handler methods
- Test mocking with `mockEmulatorBridge`
- Speed calculation: `speed = Hz / 60` (instructions per ~16ms tick)

### Speed Calculation Reference

```typescript
// Hz to worker speed parameter conversion
const workerSpeed = Math.max(1, Math.round(this.executionSpeed / 60));
// Example: 60Hz → 1 instruction per tick
// Example: 1000Hz → ~17 instructions per tick
// Example: 1Hz → 1 instruction per tick (minimum)
```

### Accessibility Checklist

- [x] **Keyboard Navigation** - Speed slider accessible via Tab and Arrow keys (inherited from Toolbar)
- [x] **ARIA Attributes** - `aria-label`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-valuetext` (already implemented)
- [N/A] **Focus Management** - No focus changes
- [N/A] **Color Contrast** - Uses existing theme
- [N/A] **XSS Prevention** - No user input displayed
- [x] **Screen Reader Announcements** - `aria-valuetext` provides "X Hz" announcement

### Project Structure Notes

**Files to modify:**
```
digital-archaeology-web/
└── src/
    ├── emulator/
    │   ├── types.ts              # Add SET_SPEED to EmulatorCommand
    │   ├── emulator.worker.ts    # Add handleSetSpeed(), isEmulatorCommand case
    │   ├── emulator.worker.test.ts # Add SET_SPEED tests
    │   ├── EmulatorBridge.ts     # Add setSpeed() method
    │   └── EmulatorBridge.test.ts # Add setSpeed tests
    └── ui/
        ├── App.ts                # Wire handleSpeedChange to setSpeed
        └── App.test.ts           # Add speed change integration tests
```

### Architecture Compliance

- Uses existing worker command/response pattern
- Follows EmulatorBridge method conventions
- No new dependencies required
- Backward compatible (SET_SPEED is optional)

### Anti-Patterns to Avoid

| Don't | Do |
|-------|-----|
| Restart entire run loop on speed change | Update interval in-place |
| Call setSpeed when not running | Guard with `if (!this.isRunning)` |
| Skip validation in isEmulatorCommand | Add proper type guard |
| Duplicate run loop logic | Extract shared execution logic |

### Critical Technical Requirements

1. **Real-time update:** Speed changes must take effect immediately
2. **No interruption:** Changing speed should not stop/restart execution
3. **Validation:** SET_SPEED payload must validate speed >= 0 and finite
4. **Thread safety:** Worker interval clear/set must be atomic

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.8]
- [Source: digital-archaeology-web/src/emulator/EmulatorBridge.ts#run]
- [Source: digital-archaeology-web/src/emulator/emulator.worker.ts#handleRun]
- [Source: digital-archaeology-web/src/ui/App.ts#handleSpeedChange]
- [Source: digital-archaeology-web/src/ui/Toolbar.ts#speedSlider]
- [Source: _bmad-output/implementation-artifacts/4-7-implement-reset-button.md]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

1. **Task 1 (Worker SET_SPEED):** Added `SetSpeedCommand` interface to types.ts, type guard case in `isEmulatorCommand()`, extracted shared `startRunInterval()` helper to avoid code duplication, and `handleSetSpeed()` function that clears existing interval and restarts with new speed.

2. **Task 2 (EmulatorBridge.setSpeed):** Added `setSpeed(speed: number): void` method that sends SET_SPEED command to worker when running.

3. **Task 3 (App.ts wiring):** Modified `handleSpeedChange()` to call `emulatorBridge.setSpeed()` when running. Speed conversion: `workerSpeed = Math.max(1, Math.round(Hz / 60))`.

4. **Task 4 (Verification):** Confirmed existing functionality:
   - Speed slider range 1-1000Hz (Toolbar.ts)
   - Speed label shows "X Hz" format
   - Speed persists in executionSpeed state
   - Status bar displays speed while running

5. **Task 5 (Tests):** Added comprehensive tests:
   - EmulatorBridge.test.ts: 4 tests for setSpeed method
   - emulator.worker.test.ts: Tests for isEmulatorCommand SET_SPEED case and handleSetSpeed function
   - App.test.ts: 4 tests in "Speed control (Story 4.8)" describe block

6. **Task 6 (Integration):** All 1011 tests pass, build succeeds.

### File List

- `src/emulator/types.ts` - Added SetSpeedCommand interface
- `src/emulator/emulator.worker.ts` - Added isEmulatorCommand case, handleSetSpeed function, shared startRunInterval helper, message handler
- `src/emulator/emulator.worker.test.ts` - Added SET_SPEED tests
- `src/emulator/EmulatorBridge.ts` - Added setSpeed() method
- `src/emulator/EmulatorBridge.test.ts` - Added setSpeed tests
- `src/ui/App.ts` - Modified handleSpeedChange to call setSpeed when running
- `src/ui/App.test.ts` - Added Speed control test suite
- `_bmad-output/implementation-artifacts/sprint-status.yaml` - Updated story status to done

### Code Review Record

**Reviewer:** Claude Opus 4.5 (adversarial code review)
**Date:** 2026-01-23
**Outcome:** All issues fixed

**Issues Found & Fixed:**
1. **MEDIUM - Code Duplication:** Extracted shared `startRunInterval()` function from duplicated run loop logic in `handleRun()` and `handleSetSpeed()` (emulator.worker.ts)
2. **MEDIUM - Missing File in File List:** Added `sprint-status.yaml` to File List
3. **LOW - Task Description Mismatch:** Updated Task 1.4 description to reflect actual implementation (shared function vs worker-level variable)
4. **LOW - Misleading Test Name:** Fixed test name from "(already implemented)" to "(AC: #3)"

**Verification:**
- All 1011 tests pass
- Build succeeds
- TypeScript compiles without errors

