# Story 4.4: Implement Load Program

Status: done

---

## Story

As a user,
I want to load my assembled program into the emulator,
So that I can run it.

## Acceptance Criteria

1. **Given** assembly succeeds
   **When** the program is assembled
   **Then** the binary is automatically loaded into the emulator

2. **And** the emulator is reset to initial state

3. **And** PC is set to 0

4. **And** memory contains the loaded program

5. **And** status bar shows "Loaded: X bytes"

## Tasks / Subtasks

- [x] Task 1: Add EmulatorBridge to App.ts (AC: #1-4)
  - [x] 1.1 Import `EmulatorBridge` and `CPUState` from `@emulator/index`
  - [x] 1.2 Add private `emulatorBridge: EmulatorBridge | null = null` property
  - [x] 1.3 Add private `cpuState: CPUState | null = null` for tracking current state
  - [x] 1.4 Create `initializeEmulatorBridge()` method following `initializeAssemblerBridge()` pattern
  - [x] 1.5 Create `destroyEmulatorBridge()` method with terminate() call
  - [x] 1.6 Call `initializeEmulatorBridge()` in `mount()`
  - [x] 1.7 Call `destroyEmulatorBridge()` in `unmount()` and at start of `mount()`

- [x] Task 2: Auto-Load on Assembly Success (AC: #1-4)
  - [x] 2.1 In `performAssembly()` success path, after `this.hasValidAssembly = true`
  - [x] 2.2 Check if `emulatorBridge?.isReady`, if not wait for init
  - [x] 2.3 Convert `result.binary` (number[]) to `Uint8Array` for EmulatorBridge
  - [x] 2.4 Call `emulatorBridge.loadProgram(binary)` which resets CPU and loads program
  - [x] 2.5 Store returned `CPUState` in `this.cpuState`
  - [x] 2.6 Verify PC is 0 and memory matches loaded binary (implicit from EmulatorBridge)

- [x] Task 3: Update Status Bar with Load Status (AC: #5)
  - [x] 3.1 Add `loadStatus: string | null` to `StatusBarState` interface
  - [x] 3.2 Add `loadSection` element reference in StatusBar class
  - [x] 3.3 Add load status section to StatusBar render template (after assembly section)
  - [x] 3.4 Implement `updateUI()` logic for load section
  - [x] 3.5 In App.ts after successful load, call `statusBar.updateState({ loadStatus: 'Loaded: X bytes' })`

- [x] Task 4: Handle Load Errors (AC: #1-4)
  - [x] 4.1 Wrap `emulatorBridge.loadProgram()` in try-catch
  - [x] 4.2 On error, update status bar with error message
  - [x] 4.3 Log error to console for debugging
  - [x] 4.4 Clear `cpuState` on load failure

- [x] Task 5: Write Tests (AC: #1-5)
  - [x] 5.1 Test that successful assembly triggers loadProgram()
  - [x] 5.2 Test that status bar shows "Loaded: X bytes" after load
  - [x] 5.3 Test binary conversion from number[] to Uint8Array
  - [x] 5.4 Test error handling when emulator not ready
  - [x] 5.5 Test error handling when loadProgram fails

- [x] Task 6: Verify Integration (AC: all)
  - [x] 6.1 Run `npm test` - all tests pass
  - [x] 6.2 Run `npm run build` - build succeeds
  - [x] 6.3 Manual test: Assemble program, verify status bar shows load message
  - [x] 6.4 Manual test: Check console for any errors during load

---

## Dev Notes

### Previous Story Intelligence (Story 4.3)

**Critical Assets Created:**
- `src/emulator/EmulatorBridge.ts` (413 lines) - Promise-based API for worker
- `src/emulator/EmulatorBridge.test.ts` (862 lines) - 49 tests

**Key EmulatorBridge Methods:**
```typescript
// Initialize worker - must call before other methods
await bridge.init(): Promise<void>

// Load program - resets CPU, copies binary to memory, returns initial state
await bridge.loadProgram(binary: Uint8Array, startAddr?: number): Promise<CPUState>

// Check if ready
bridge.isReady: boolean

// Clean up
bridge.terminate(): void
```

**CPUState Shape (from types.ts):**
```typescript
interface CPUState {
  pc: number;           // Program Counter (0-255)
  accumulator: number;  // Accumulator (0-15)
  zeroFlag: boolean;    // Zero flag
  halted: boolean;      // CPU has halted
  error: boolean;       // Error occurred
  errorMessage: string | null;
  memory: Uint8Array;   // 256 nibbles
  ir: number;           // Instruction Register
  mar: number;          // Memory Address Register
  mdr: number;          // Memory Data Register
  cycles: number;       // Total cycles
  instructions: number; // Total instructions executed
}
```

### AssemblerBridge Pattern to Follow

**From App.ts initialization pattern (lines 549-570):**
```typescript
private initializeAssemblerBridge(): void {
  this.assemblerBridge = new AssemblerBridge();

  // Initialize asynchronously - errors logged but don't block UI
  this.assemblerBridge.init().catch((error) => {
    console.error('Failed to initialize assembler worker:', error);
    // Could show error in status bar here
  });
}

private destroyAssemblerBridge(): void {
  if (this.assemblerBridge) {
    this.assemblerBridge.terminate();
    this.assemblerBridge = null;
  }
  this.lastAssembleResult = null;
}
```

### Assembly Result Shape

**From types.ts AssembleResult:**
```typescript
interface AssembleResult {
  success: boolean;
  binary: Uint8Array | null;  // Nibbles as Uint8Array
  error: AssemblerError | null;
}
```

**Note:** `result.binary` from AssemblerBridge is already a `Uint8Array` (converted from number[] internally), so no conversion needed for EmulatorBridge!

### Integration Point in performAssembly()

**Current success path (App.ts ~line 646):**
```typescript
if (result.success && result.binary) {
  this.hasValidAssembly = true;
  this.updateStatusBarAssembly('success', `Assembled: ${result.binary.length} bytes`);
  // ... error panel and binary view updates

  // ADD EMULATOR LOAD HERE
}
```

### StatusBar State Extension

**Current StatusBarState (StatusBar.ts):**
```typescript
interface StatusBarState {
  assemblyStatus: AssemblyStatus;
  assemblyMessage: string | null;
  pcValue: number | null;
  nextInstruction: string | null;
  cycleCount: number;
  speed: number | null;
  cursorPosition: CursorPosition | null;
}
```

**Add:**
```typescript
loadStatus: string | null;  // "Loaded: X bytes" or null
```

### Accessibility Checklist

- [N/A] **Keyboard Navigation** - No new interactive elements
- [N/A] **ARIA Attributes** - Status bar uses `aria-live` (already implemented)
- [N/A] **Focus Management** - No focus changes
- [N/A] **Color Contrast** - Uses existing theme colors
- [x] **XSS Prevention** - Use `escapeHtml()` for load status message (StatusBar already has this)
- [x] **Screen Reader Announcements** - Status bar is `aria-live="polite"` region

### Project Structure Notes

**Files to modify:**
```
digital-archaeology-web/
└── src/
    ├── ui/
    │   ├── App.ts              # Add EmulatorBridge, load on assembly success
    │   ├── App.test.ts         # Add tests for auto-load behavior
    │   ├── StatusBar.ts        # Add loadStatus state and section
    │   └── StatusBar.test.ts   # Add tests for load status display
    └── emulator/
        └── index.ts            # Already exports EmulatorBridge (verified)
```

### Architecture Compliance

- EmulatorBridge follows same pattern as AssemblerBridge (Promise-based, init/terminate lifecycle)
- Status bar updates via `updateState()` method
- No new global state - emulator state kept in App class
- Named imports only (`import { EmulatorBridge } from '@emulator/index'`)

### Anti-Patterns to Avoid

| Don't | Do |
|-------|-----|
| Block UI on emulator init | Initialize async with catch, allow assembly before ready |
| Show raw error objects | Use user-friendly load status messages |
| Forget to clean up on unmount | Call `emulatorBridge.terminate()` in destroy path |
| Skip null checks | Check `emulatorBridge?.isReady` before load |
| Hardcode byte count | Calculate from `binary.length` |

### Critical Technical Requirements

1. **Async Init Pattern:** EmulatorBridge.init() is async - same pattern as AssemblerBridge
2. **Binary Type:** AssemblerBridge returns `Uint8Array` for binary - no conversion needed
3. **Error Handling:** loadProgram() can throw - wrap in try-catch
4. **State Storage:** Store `CPUState` from loadProgram() for future use (Run button, etc.)
5. **Status Update:** Use existing `updateStatusBarAssembly()` pattern but for load status

### Git Intelligence (Recent Commits)

```
f62fa22 feat(web): implement EmulatorBridge class (Story 4.3)
54bea86 docs: create Story 4.3 - Implement EmulatorBridge Class
1ede3c8 feat(web): create emulator web worker (Story 4.2)
ba86ba7 feat(web): compile emulator to WASM (Story 4.1)
```

**Commit message pattern:** `feat(web): implement load program (Story 4.4)`

### Test Considerations

**Key test scenarios:**
1. **Happy path:** Assemble → auto-load → status shows "Loaded: X bytes"
2. **Emulator not ready:** Assembly succeeds but emulator still initializing
3. **Load failure:** loadProgram() throws, handle gracefully
4. **Re-assembly:** New assembly replaces old program in emulator

**Mock pattern from App.test.ts:**
```typescript
// Mock EmulatorBridge
vi.mock('@emulator/index', () => ({
  EmulatorBridge: vi.fn().mockImplementation(() => ({
    init: vi.fn().mockResolvedValue(undefined),
    isReady: true,
    loadProgram: vi.fn().mockResolvedValue({
      pc: 0,
      accumulator: 0,
      // ... mock CPUState
    }),
    terminate: vi.fn(),
  })),
  // ... keep AssemblerBridge mock
}));
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.4]
- [Source: _bmad-output/planning-artifacts/architecture.md#WASM Integration]
- [Source: _bmad-output/implementation-artifacts/4-3-implement-emulatorbridge-class.md]
- [Source: digital-archaeology-web/src/emulator/EmulatorBridge.ts]
- [Source: digital-archaeology-web/src/ui/App.ts#performAssembly]
- [Source: digital-archaeology-web/src/ui/StatusBar.ts]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

- Implemented EmulatorBridge integration in App.ts following the AssemblerBridge pattern
- Added `loadStatus` field to StatusBar state with new section between assembly and PC
- Auto-load triggers after successful assembly via `loadProgramIntoEmulator()`
- Error handling catches load failures and logs to console
- Load status clears when code changes (invalidation)
- Updated existing tests that sequence assembly operations to wait for load completion
- All 908 tests pass, build succeeds

### File List

- `digital-archaeology-web/src/ui/App.ts` - Added EmulatorBridge, cpuState, loadProgramIntoEmulator()
- `digital-archaeology-web/src/ui/StatusBar.ts` - Added loadStatus field and section
- `digital-archaeology-web/src/ui/App.test.ts` - Added EmulatorBridge mock and Story 4.4 tests
- `digital-archaeology-web/src/ui/StatusBar.test.ts` - Updated for new load section
