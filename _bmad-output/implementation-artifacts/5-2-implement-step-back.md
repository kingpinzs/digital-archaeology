# Story 5.2: Implement Step Back

Status: ready-for-dev

---

## Story

As a user,
I want to step backward through execution,
So that I can review what just happened.

## Acceptance Criteria

1. **Given** I have stepped through several instructions
   **When** I click Step Back
   **Then** the CPU state reverts to the previous instruction
   **And** the editor highlights the previous instruction
   **And** I can step back multiple times (up to history limit)
   **And** stepping forward after stepping back continues from that point

## Tasks / Subtasks

- [ ] Task 1: Define State History Interface and Constants (AC: #1)
  - [ ] 1.1 Create `StateHistoryEntry` interface in App.ts (CPUState + sourceCode snapshot reference)
  - [ ] 1.2 Define `MAX_HISTORY_SIZE` constant (50 states recommended for memory efficiency)
  - [ ] 1.3 Create `stateHistory: StateHistoryEntry[]` array in App class
  - [ ] 1.4 Create `historyPointer: number` to track current position (-1 = latest, no history)

- [ ] Task 2: Implement State History Recording (AC: #1)
  - [ ] 2.1 Create `pushStateToHistory(state: CPUState)` private method in App.ts
  - [ ] 2.2 Push current state BEFORE each step execution (captures "before" state)
  - [ ] 2.3 If stepping back then forward, truncate future history (fork from current point)
  - [ ] 2.4 Enforce MAX_HISTORY_SIZE by shifting oldest entries
  - [ ] 2.5 Clear history on program load, reset, or code change

- [ ] Task 3: Add Step Back Button to Toolbar (AC: #1)
  - [ ] 3.1 Add "Step Back" button in Toolbar.ts after Step button
  - [ ] 3.2 Button shows left-arrow or rewind icon (←) with "Step Back" text
  - [ ] 3.3 Add `canStepBack: boolean` to ToolbarState interface
  - [ ] 3.4 Add `onStepBackClick` callback to ToolbarCallbacks interface
  - [ ] 3.5 Button disabled when: no history, running, or no valid assembly
  - [ ] 3.6 Button enabled when: history exists and not running

- [ ] Task 4: Implement handleStepBack() in App.ts (AC: #1)
  - [ ] 4.1 Add `handleStepBack()` private method to App class
  - [ ] 4.2 Guard: Return early if no history, running, or no valid assembly
  - [ ] 4.3 Decrement historyPointer (if at -1, set to length-1 first)
  - [ ] 4.4 Retrieve CPUState from history at pointer position
  - [ ] 4.5 Restore CPU state to emulator via `loadProgram()` + state restore approach
  - [ ] 4.6 Update all UI components with restored state
  - [ ] 4.7 Highlight the instruction at restored PC

- [ ] Task 5: Implement Emulator State Restoration (AC: #1)
  - [ ] 5.1 Create `restoreState(state: CPUState)` method in EmulatorBridge
  - [ ] 5.2 Add `RESTORE_STATE` command to EmulatorCommand type in types.ts
  - [ ] 5.3 Implement `handleRestoreState()` in emulator.worker.ts
  - [ ] 5.4 Worker restores PC, accumulator, flags, memory from CPUState
  - [ ] 5.5 Return STATE_UPDATE event with restored state

- [ ] Task 6: Implement F9 Keyboard Shortcut (AC: #1)
  - [ ] 6.1 Add keydown handler in App.ts for F9
  - [ ] 6.2 Handler calls handleStepBack() when F9 pressed
  - [ ] 6.3 Prevent default browser behavior for F9
  - [ ] 6.4 Only active when: history exists, not running, valid assembly
  - [ ] 6.5 Add F9 to KeyboardShortcutsDialog debugging category

- [ ] Task 7: Handle Forward Step After Step Back (AC: #1)
  - [ ] 7.1 When stepping forward (F10/Step button) with historyPointer < history.length-1
  - [ ] 7.2 Truncate history beyond current pointer (discard future states)
  - [ ] 7.3 Reset historyPointer to -1 (back to latest tracking mode)
  - [ ] 7.4 Continue normal step execution from current state

- [ ] Task 8: Update Toolbar Button States (AC: #1)
  - [ ] 8.1 Add `aria-keyshortcuts="F9"` to Step Back button
  - [ ] 8.2 Add title tooltip: "Step back one instruction (F9)"
  - [ ] 8.3 Update Toolbar.updateState() to handle canStepBack
  - [ ] 8.4 Disable Step Back when history is empty or at beginning

- [ ] Task 9: Add Comprehensive Tests
  - [ ] 9.1 App tests: State history recording on step
  - [ ] 9.2 App tests: History truncation at MAX_HISTORY_SIZE
  - [ ] 9.3 App tests: handleStepBack restores previous state
  - [ ] 9.4 App tests: Multiple step-back operations
  - [ ] 9.5 App tests: Step forward after step back truncates history
  - [ ] 9.6 App tests: History cleared on load/reset/code change
  - [ ] 9.7 App tests: F9 triggers handleStepBack
  - [ ] 9.8 Toolbar tests: Step Back button enabled/disabled states
  - [ ] 9.9 EmulatorBridge tests: restoreState command
  - [ ] 9.10 Worker tests: handleRestoreState implementation
  - [ ] 9.11 KeyboardShortcutsDialog tests: F9 shortcut in debugging category

- [ ] Task 10: Integration Verification
  - [ ] 10.1 Run `npm test` - all tests pass
  - [ ] 10.2 Run `npm run build` - build succeeds
  - [ ] 10.3 TypeScript compilation - no type errors

---

## Dev Notes

### Architecture Context

**CRITICAL:** This is Story 5.2 in Epic 5 (Debugging & State Inspection). It depends on Story 5.1's step execution infrastructure (handleStep, highlightCurrentInstruction, sourceMap) and adds the ability to navigate backward through execution history.

### Design Decision: Client-Side State History

**Approach:** Maintain state history in the App.ts class on the main thread, NOT in the worker.

**Rationale:**
1. History is UI-centric (for user navigation, not emulation)
2. Keeps worker stateless and focused on execution
3. Avoids complex bidirectional state sync
4. Simplifies memory management (can cap history size easily)

**Alternative considered (rejected):** Store history in worker with GET_HISTORY command. Rejected because it complicates the worker API and doesn't provide benefits for this use case.

### State History Data Structure

```typescript
// In App.ts

interface StateHistoryEntry {
  state: CPUState;        // Complete CPU state snapshot
  timestamp: number;      // For debugging/display (optional)
}

private stateHistory: StateHistoryEntry[] = [];
private historyPointer: number = -1;  // -1 = at latest, tracking new states
private readonly MAX_HISTORY_SIZE = 50;
```

**Memory estimation:** Each CPUState is ~300 bytes (256 byte memory + flags/registers). 50 entries = ~15KB - acceptable.

### State Recording Flow

```
User clicks Step (F10)
         │
         ▼
┌─────────────────────────────────┐
│ Before executing step:          │
│ 1. Get current state            │
│ 2. Push to history (if needed)  │
│ 3. If stepping from history,    │
│    truncate future entries      │
└───────────┬─────────────────────┘
            │
            ▼
┌─────────────────────────────────┐
│ emulatorBridge.step()           │
│ - Execute one instruction       │
│ - Return new CPUState           │
└───────────┬─────────────────────┘
            │
            ▼
┌─────────────────────────────────┐
│ Update UI with new state        │
│ - historyPointer = -1           │
│ - Enable Step Back button       │
└─────────────────────────────────┘
```

### State Restoration Flow

```
User clicks Step Back (F9)
         │
         ▼
┌─────────────────────────────────┐
│ Guard: history.length > 0?      │
│ Guard: not running?             │
│ Guard: valid assembly?          │
└───────────┬─────────────────────┘
            │ Yes
            ▼
┌─────────────────────────────────┐
│ Calculate target index:         │
│ - If pointer == -1:             │
│     pointer = history.length-1  │
│ - Else: pointer--               │
│ Guard: pointer >= 0             │
└───────────┬─────────────────────┘
            │
            ▼
┌─────────────────────────────────┐
│ Restore state to emulator       │
│ emulatorBridge.restoreState()   │
└───────────┬─────────────────────┘
            │
            ▼
┌─────────────────────────────────┐
│ Update UI:                      │
│ - Status: "Stepped back to PC"  │
│ - Highlight restored line       │
│ - Update canStepBack state      │
└─────────────────────────────────┘
```

### EmulatorBridge API Addition

```typescript
// In EmulatorBridge.ts
async restoreState(state: CPUState): Promise<CPUState> {
  this.ensureInitialized();
  const worker = this.worker!;

  return this.sendCommandAndWaitForState(worker, {
    type: 'RESTORE_STATE',
    payload: state
  });
}
```

### Worker Command Addition

```typescript
// In types.ts - add to EmulatorCommand union
| { type: 'RESTORE_STATE'; payload: CPUState }

// In emulator.worker.ts
export function handleRestoreState(module: EmulatorModule, state: CPUState): void {
  // Reset CPU first
  module._cpu_reset_instance();

  // Restore memory
  const memPtr = module._get_memory_ptr();
  module.HEAPU8.set(state.memory, memPtr);

  // Restore registers via setter functions (need to add to WASM exports)
  module._set_pc(state.pc);
  module._set_accumulator(state.accumulator);
  module._set_zero_flag(state.zeroFlag ? 1 : 0);
  module._set_ir(state.ir);
  module._set_mar(state.mar);
  module._set_mdr(state.mdr);
  module._set_cycles(state.cycles);
  module._set_instructions(state.instructions);

  // Send state update
  self.postMessage({
    type: 'STATE_UPDATE',
    payload: readCPUState(module),
  } satisfies StateUpdateEvent);
}
```

### WASM Setter Functions Required

**NOTE:** The C emulator currently only has getter functions. Story 5.2 requires adding setter functions:

```c
// In cpu.c - add these EMSCRIPTEN_KEEPALIVE exports
void cpu_set_pc_instance(int pc) { cpu_instance.pc = pc; }
void cpu_set_accumulator_instance(int acc) { cpu_instance.accumulator = acc; }
void cpu_set_zero_flag_instance(int flag) { cpu_instance.zero_flag = flag; }
void cpu_set_ir_instance(int ir) { cpu_instance.ir = ir; }
void cpu_set_mar_instance(int mar) { cpu_instance.mar = mar; }
void cpu_set_mdr_instance(int mdr) { cpu_instance.mdr = mdr; }
void cpu_set_cycles_instance(int cycles) { cpu_instance.cycles = cycles; }
void cpu_set_instructions_instance(int instr) { cpu_instance.instructions = instr; }
```

Then rebuild WASM:
```bash
cd src/micro4 && make wasm
cp micro4-cpu.js micro4-cpu.wasm ../../../digital-archaeology-web/public/wasm/
```

### Toolbar Button Pattern (from Story 5.1)

```typescript
// In Toolbar.ts createControls()
const stepBackButton = this.createButton('step-back', '← Back', () => {
  this.options.onStepBackClick?.();
});
stepBackButton.title = 'Step back one instruction (F9)';
stepBackButton.setAttribute('aria-keyshortcuts', 'F9');
stepBackButton.setAttribute('aria-label', 'Step back one instruction');
```

### Keyboard Shortcut Addition

```typescript
// In keyboardShortcuts.ts - add to debugging category
{ keys: ['F9'], description: 'Step back one instruction' },
```

### History Clear Conditions

Clear `stateHistory` and reset `historyPointer` to -1 when:
1. Program is loaded (`handleLoad`)
2. CPU is reset (`handleReset`)
3. Code changes (assembly invalidated in editor onChange)
4. New program is assembled (fresh start)

### Edge Cases to Handle

1. **Step back at beginning:** historyPointer = 0, disable Step Back button
2. **Step forward from middle:** Truncate future, reset to tracking mode
3. **Load program while in history:** Clear history, start fresh
4. **Reset while in history:** Clear history, start fresh
5. **Code change while in history:** Clear history, invalidate assembly

### Accessibility Checklist

- [x] **Keyboard Navigation** - F9 shortcut, Tab to Step Back button
- [x] **ARIA Attributes** - `aria-keyshortcuts="F9"` on Step Back button
- [N/A] **Focus Management** - No focus changes on step back
- [N/A] **Color Contrast** - Uses existing theme variables
- [N/A] **XSS Prevention** - No user input displayed
- [x] **Screen Reader Announcements** - Status bar has `role="status"` (from 5.1)

### Project Structure Notes

**Files to modify:**
```
digital-archaeology-web/
├── src/
│   ├── ui/
│   │   ├── Toolbar.ts           # Add Step Back button
│   │   ├── Toolbar.test.ts      # Step Back button tests
│   │   ├── App.ts               # State history, handleStepBack()
│   │   ├── App.test.ts          # History and step-back tests
│   │   └── keyboardShortcuts.ts # Add F9 entry
│   └── emulator/
│       ├── EmulatorBridge.ts    # Add restoreState()
│       ├── EmulatorBridge.test.ts # restoreState tests
│       ├── emulator.worker.ts   # Add handleRestoreState()
│       ├── emulator.worker.test.ts # Worker restore tests
│       └── types.ts             # Add RESTORE_STATE command
├── src/micro4/
│   └── cpu.c                    # Add setter functions (WASM build)
└── public/wasm/
    ├── micro4-cpu.js            # Rebuilt WASM
    └── micro4-cpu.wasm          # Rebuilt WASM
```

### Previous Story Intelligence (Story 5.1)

Key patterns from Story 5.1 to apply:
1. **Guard patterns** - Check isRunning, hasValidAssembly before actions
2. **Status bar updates** - "Stepped back to 0xNN" format
3. **Highlight after state change** - Call highlightCurrentInstruction(pc)
4. **Button state pattern** - canStepBack similar to canStep
5. **Keyboard shortcut pattern** - F9 similar to F10 implementation
6. **Test patterns** - Mock emulatorBridge, test button states

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.2]
- [Source: digital-archaeology-web/src/emulator/EmulatorBridge.ts#step]
- [Source: digital-archaeology-web/src/ui/Toolbar.ts]
- [Source: digital-archaeology-web/src/ui/App.ts#handleStep]
- [Source: _bmad-output/implementation-artifacts/5-1-implement-step-execution.md]

---

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

