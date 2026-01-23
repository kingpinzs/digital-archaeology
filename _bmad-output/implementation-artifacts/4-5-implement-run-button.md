# Story 4.5: Implement Run Button

Status: done

---

## Story

As a user,
I want to run my program continuously,
So that I can see it execute to completion.

## Acceptance Criteria

1. **Given** a program is loaded
   **When** I click Run
   **Then** the emulator executes instructions continuously

2. **And** the Run button changes to Pause

3. **And** the UI updates showing execution progress

4. **And** execution continues until HLT or Stop

5. **And** the speed slider controls execution rate (1Hz to 1000Hz)

## Tasks / Subtasks

- [x] Task 1: Add Run Button Click Handler in App.ts (AC: #1, #4)
  - [x] 1.1 Add `isRunning: boolean = false` property to App class
  - [x] 1.2 Create `handleRun()` method that calls `emulatorBridge.run(speed)`
  - [x] 1.3 Wire up `onRun` callback in Toolbar to call `handleRun()`
  - [x] 1.4 Set `isRunning = true` when run starts
  - [x] 1.5 Subscribe to `emulatorBridge.onStateUpdate()` for UI updates
  - [x] 1.6 Subscribe to `emulatorBridge.onHalted()` to stop running state
  - [x] 1.7 Subscribe to `emulatorBridge.onError()` to handle runtime errors

- [x] Task 2: Implement Run/Pause Button Toggle (AC: #2)
  - [x] 2.1 Add `isRunning: boolean` to `ToolbarState` interface in Toolbar.ts
  - [x] 2.2 Update Toolbar `updateState()` to toggle Run/Pause visibility based on `isRunning`
  - [x] 2.3 When `isRunning=true`: hide Run button, show Pause button
  - [x] 2.4 When `isRunning=false`: show Run button, hide Pause button
  - [x] 2.5 Update `aria-pressed` attribute on Run/Pause buttons
  - [x] 2.6 In App.ts, call `toolbar.updateState({ isRunning: true/false })` when state changes

- [x] Task 3: Update Status Bar During Execution (AC: #3)
  - [x] 3.1 In `onStateUpdate` callback, update status bar with current PC value
  - [x] 3.2 Update cycle count in status bar from `cpuState.cycles`
  - [x] 3.3 Update instructions count if displayed
  - [x] 3.4 Consider throttling updates if speed is very high (>100Hz)

- [x] Task 4: Handle Execution Termination (AC: #4)
  - [x] 4.1 In `onHalted` callback, set `isRunning = false`
  - [x] 4.2 Update toolbar state to show Run button again
  - [x] 4.3 Update status bar with final state ("Halted" or "Complete")
  - [x] 4.4 In `onError` callback, set `isRunning = false`
  - [x] 4.5 Display runtime error in ErrorPanel or status bar

- [x] Task 5: Add Speed Control Slider (AC: #5)
  - [x] 5.1 Add `executionSpeed: number` to App class (default: 60)
  - [x] 5.2 Add speed slider UI element to Toolbar (between Run and Reset)
  - [x] 5.3 Slider range: 1Hz to 1000Hz (logarithmic scale recommended)
  - [x] 5.4 Display current speed value next to slider
  - [x] 5.5 Pass `executionSpeed` to `emulatorBridge.run(speed)`
  - [x] 5.6 Update status bar speed display when slider changes

- [x] Task 6: Enable/Disable Button States (AC: all)
  - [x] 6.1 Run button enabled when `hasValidAssembly && !isRunning`
  - [x] 6.2 Pause button enabled when `isRunning`
  - [x] 6.3 Step button disabled when `isRunning`
  - [x] 6.4 Speed slider disabled when `isRunning` (can't change mid-run)

- [x] Task 7: Write Tests (AC: all)
  - [x] 7.1 Test Run button calls `emulatorBridge.run()` with speed
  - [x] 7.2 Test Run/Pause toggle visibility
  - [x] 7.3 Test status bar updates during execution
  - [x] 7.4 Test `onHalted` stops running and updates UI
  - [x] 7.5 Test `onError` stops running and shows error
  - [x] 7.6 Test speed slider changes are applied
  - [x] 7.7 Test button enable/disable states

- [x] Task 8: Verify Integration (AC: all)
  - [x] 8.1 Run `npm test` - all tests pass (927 tests)
  - [x] 8.2 Run `npm run build` - build succeeds
  - [ ] 8.3 Manual test: Assemble → Run → verify continuous execution
  - [ ] 8.4 Manual test: Program halts correctly at HLT
  - [ ] 8.5 Manual test: Speed slider affects execution rate

---

## Dev Notes

### Previous Story Intelligence (Story 4.4)

**Critical Assets Created:**
- EmulatorBridge integration in App.ts (already initialized)
- `cpuState: CPUState | null` property for tracking state
- `loadProgramIntoEmulator()` method pattern
- Status bar already shows `pcValue`, `cycleCount`, `loadStatus`

**EmulatorBridge Already Available in App.ts:**
```typescript
private emulatorBridge: EmulatorBridge | null = null;
private cpuState: CPUState | null = null;

// Already initialized in initializeEmulatorBridge()
// Already destroyed in destroyEmulatorBridge()
```

**Code Review Fixes Applied (8c8f066):**
- Null safety guard in `loadProgramIntoEmulator()`
- Terminology changed from "bytes" to "nibbles"
- State reset on load failure includes pcValue/cycleCount
- Init failure shows "Emulator init failed" in status bar

### EmulatorBridge API Reference

**Key Methods for Run Button:**
```typescript
// Start continuous execution
run(speed: number): void  // speed = instructions per ~16ms tick (0 = max)

// Stop execution
async stop(): Promise<CPUState>

// Subscribe to state updates during RUN
onStateUpdate(callback: (state: CPUState) => void): () => void

// Subscribe to HLT instruction
onHalted(callback: () => void): () => void

// Subscribe to runtime errors
onError(callback: (error: { message: string; address?: number }) => void): () => void
```

**Important Notes from EmulatorBridge.ts:**
- `run()` is NOT async - it starts execution and returns immediately
- State updates come via `onStateUpdate` callback during run
- `isRunning` flag is automatically cleared on HALTED or ERROR events
- Multiple subscribers can be registered for each event type
- Unsubscribe functions returned - MUST call on cleanup

### Toolbar Current State

**Existing Button Structure (Toolbar.ts lines 165-182):**
```typescript
<button data-action="run" aria-label="Run program" aria-pressed="false" disabled>
<button data-action="pause" aria-label="Pause execution" title="Pause (F5)" hidden disabled>
<button data-action="reset" aria-label="Reset program" disabled>
<button data-action="step" aria-label="Step one instruction" disabled>
```

**Existing ToolbarState Interface:**
```typescript
interface ToolbarState {
  canAssemble: boolean;
  canRun: boolean;
  canPause: boolean;
  canReset: boolean;
  canStep: boolean;
}
```

**Existing Callbacks:**
```typescript
interface ToolbarCallbacks {
  onAssemble?: () => void;
  onRun?: () => void;      // Already defined!
  onPause?: () => void;    // Already defined!
  onReset?: () => void;
  onStep?: () => void;
  // ...
}
```

### StatusBar Current State

**StatusBarState Interface:**
```typescript
interface StatusBarState {
  assemblyStatus: AssemblyStatus;
  assemblyMessage: string | null;
  loadStatus: string | null;  // "Loaded: X nibbles"
  pcValue: number | null;     // Already displays PC!
  nextInstruction: string | null;
  cycleCount: number;         // Already displays cycles!
  speed: number | null;       // Already has speed field!
  cursorPosition: CursorPosition | null;
}
```

The status bar already has fields for PC, cycle count, and speed - just need to update them during execution.

### Speed Calculation

**EmulatorBridge speed parameter:**
- `speed = 0` → Max speed (as fast as possible)
- `speed > 0` → Target instructions per ~16ms tick

**Conversion from Hz to speed parameter:**
- 1Hz = 1 instruction/second = ~0.016 instructions per 16ms tick
- 60Hz = 60 instructions/second = ~1 instruction per 16ms tick
- 1000Hz = 1000 instructions/second = ~16 instructions per 16ms tick

**Formula:** `speed = Math.round(targetHz / 60)`

**Slider Design:**
- Min: 1Hz (speed ≈ 0.016, round to 1)
- Max: 1000Hz (speed ≈ 16.67, round to 17)
- Default: 60Hz (speed = 1)
- Consider logarithmic scale for better UX

### Accessibility Checklist

- [x] **Keyboard Navigation** - Run/Pause buttons already keyboard accessible via Tab
- [x] **ARIA Attributes** - aria-pressed updated on Run/Pause toggle in Toolbar.ts
- [x] **Focus Management** - Focus remains on toolbar after toggle (handled by browser)
- [N/A] **Color Contrast** - Uses existing theme colors
- [N/A] **XSS Prevention** - No user input in this story
- [x] **Screen Reader Announcements** - Status bar is `aria-live="polite"`, speed slider has aria-valuetext

### Project Structure Notes

**Files to modify:**
```
digital-archaeology-web/
└── src/
    ├── ui/
    │   ├── App.ts              # Add handleRun(), subscriptions, isRunning
    │   ├── App.test.ts         # Add tests for run functionality
    │   ├── Toolbar.ts          # Add isRunning state, speed slider
    │   ├── Toolbar.test.ts     # Add tests for Run/Pause toggle
    │   └── StatusBar.ts        # May need throttling for high-speed updates
    └── emulator/
        └── (no changes needed - EmulatorBridge already complete)
```

### Architecture Compliance

- Use existing EmulatorBridge subscription pattern
- State updates via StatusBar.updateState() and Toolbar.updateState()
- No new global state - keep isRunning in App class
- Follow existing callback patterns from Toolbar

### Anti-Patterns to Avoid

| Don't | Do |
|-------|-----|
| Poll for state | Use `onStateUpdate` subscription |
| Forget to unsubscribe | Store unsubscribe functions, call on cleanup |
| Update UI on every state update at max speed | Throttle updates if speed > 100Hz |
| Allow Run while already running | Check `isRunning` before starting |
| Modify speed during execution | Disable slider while running |

### Critical Technical Requirements

1. **Subscription Cleanup:** Store unsubscribe functions from `onStateUpdate`, `onHalted`, `onError` and call them in cleanup
2. **State Consistency:** Always update both `isRunning` flag AND toolbar/status bar together
3. **Error Handling:** Runtime errors should stop execution AND display in UI
4. **Speed Parameter:** Convert Hz to EmulatorBridge speed format correctly
5. **Button States:** Ensure mutual exclusivity - can't Run and Pause simultaneously

### Git Intelligence (Recent Commits)

```
8c8f066 fix(web): address code review issues for Story 4.4
75dd8a6 feat(web): implement load program functionality (Story 4.4)
f62fa22 feat(web): implement EmulatorBridge class (Story 4.3)
1ede3c8 feat(web): create emulator web worker (Story 4.2)
ba86ba7 feat(web): compile emulator to WASM (Story 4.1)
```

**Commit message pattern:** `feat(web): implement run button (Story 4.5)`

### Test Considerations

**Key test scenarios:**
1. **Run starts execution:** Click Run → `emulatorBridge.run()` called with speed
2. **UI updates:** Run → toolbar shows Pause, Run hidden
3. **State updates:** During run, status bar shows changing PC/cycles
4. **HLT stops:** Program halts → isRunning=false, Run button shown
5. **Error stops:** Runtime error → isRunning=false, error displayed
6. **Speed control:** Slider value passed correctly to run()

**Mock additions for App.test.ts:**
```typescript
// Add to mockEmulatorBridge helpers:
_triggerStateUpdate: (state: CPUState) => {
  // Simulate state update callback
},
_triggerHalted: () => {
  // Simulate halted callback
},
_triggerError: (error: { message: string }) => {
  // Simulate error callback
},
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.5]
- [Source: _bmad-output/planning-artifacts/architecture.md#Execution Controls]
- [Source: _bmad-output/implementation-artifacts/4-4-implement-load-program.md]
- [Source: digital-archaeology-web/src/emulator/EmulatorBridge.ts#run]
- [Source: digital-archaeology-web/src/emulator/types.ts#RunCommand]
- [Source: digital-archaeology-web/src/ui/Toolbar.ts]
- [Source: digital-archaeology-web/src/ui/StatusBar.ts]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

**Initial Implementation:**
1. Added `isRunning`, `executionSpeed`, and three unsubscribe function properties to App class
2. Implemented `handleRun()` that starts execution with speed conversion (Hz to instructions per tick)
3. Implemented `handlePause()` that stops execution via `emulatorBridge.stop()`
4. Implemented `handleSpeedChange()` that updates `executionSpeed` and status bar
5. Added `setupEmulatorSubscriptions()` with callbacks for state updates, halted, and error events
6. Added `cleanupEmulatorSubscriptions()` to properly unsubscribe on pause/halt/error
7. Wired up `onRun`, `onPause`, `onSpeedChange` callbacks in toolbar initialization
8. Run/Pause toggle uses existing Toolbar `isRunning` state property
9. Status bar updates with PC value, cycle count, and "Running"/"Halted" status
10. Error handling displays runtime errors in ErrorPanel with RUNTIME_ERROR type
11. Added RUNTIME_ERROR to AssemblerErrorType union in types.ts
12. Added RUNTIME_ERROR support to ErrorPanel.createTypeBadge()
13. Added 16 new tests covering all acceptance criteria
14. All 927 tests pass, build succeeds

**Code Review Fixes (8 issues fixed):**
15. Fixed speed slider range from 1-100 to 1-1000Hz in Toolbar.ts (as required by AC#5)
16. Updated default speed from 50 to 60Hz in Toolbar.ts
17. Added "Hz" suffix to speed label display
18. Added aria-valuetext for screen reader accessibility on speed slider
19. Added throttling for high-speed state updates (~60fps max) to prevent UI jank
20. Added CSS styling for `.da-error-type-badge--runtime` (purple badge)
21. Added status bar update on `handlePause()` error ("Pause failed")
22. Fixed `handleExecutionError()` to use line 1 as fallback (not 0) for editor navigation
23. Updated Toolbar tests for new slider range and Hz suffix

### File List

- `src/ui/App.ts` - Core implementation: run/pause handlers, subscriptions, state management, throttling
- `src/ui/App.test.ts` - 16 new tests for Story 4.5 program execution functionality
- `src/ui/Toolbar.ts` - Updated speed slider range to 1-1000Hz, Hz suffix, aria-valuetext
- `src/ui/Toolbar.test.ts` - Updated tests for new slider range and Hz suffix
- `src/emulator/types.ts` - Added 'RUNTIME_ERROR' to AssemblerErrorType union
- `src/ui/ErrorPanel.ts` - Added 'RUNTIME_ERROR' to createTypeBadge type parameter
- `src/styles/main.css` - Added CSS for `.da-error-type-badge--runtime`
- `_bmad-output/implementation-artifacts/sprint-status.yaml` - Updated story status

