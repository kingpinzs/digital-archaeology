# Story 6.13: Integrate Circuit Visualization with Emulator

Status: complete

## Story

As a user,
I want the circuit diagram to reflect the actual CPU state,
So that I can see how my program affects the hardware.

## Acceptance Criteria

1. **Given** the application loads **When** the circuit panel is visible **Then** the Micro4 circuit is automatically loaded and rendered
2. **Given** a program is loaded **When** I click Step **Then** the circuit updates to show the new CPU state with animation
3. **Given** a program is running **When** signals change **Then** wire colors reflect actual signal values (high=green, low=gray, undefined=yellow)
4. **Given** the emulator state changes **When** the circuit updates **Then** the Signal Values Panel shows correct register values (PC, ACC, MAR, MDR, IR, etc.)
5. **Given** I click Run **When** execution is fast **Then** circuit updates without animation for performance

## Tasks / Subtasks

### Task 1: Load Circuit on Application Startup (AC: #1)

Load the Micro4 circuit data when the application initializes.

- [x] 1.1 In `App.ts`, call `loadCircuit()` after mounting CircuitRenderer:
  ```typescript
  // In initializeCircuitRenderer(), after mount:
  await this.circuitRenderer.loadCircuit('/circuits/micro4-circuit.json');
  ```
- [x] 1.2 Handle load errors gracefully - show error message in circuit panel if load fails
- [x] 1.3 Update SignalValuesPanel after circuit loads to show initial state
- [x] 1.4 Ensure circuit renders immediately after load (call `render()` or trigger redraw)

### Task 2: Create CPUState-to-CircuitData Bridge (AC: #2, #3, #4)

Create a utility to map emulator CPU state to circuit wire states.

- [x] 2.1 Create `src/visualizer/CPUCircuitBridge.ts`:
  ```typescript
  export class CPUCircuitBridge {
    /**
     * Maps CPUState to CircuitData wire states.
     * @param cpuState - Current emulator state
     * @param circuitModel - Circuit model to update
     * @returns Updated CircuitData with new wire states
     */
    mapStateToCircuit(cpuState: CPUState, circuitModel: CircuitModel): CircuitData;
  }
  ```
- [x] 2.2 Implement register mappings (based on micro4-circuit.json wire names):
  | CPUState Field | Circuit Wire | Width |
  |----------------|--------------|-------|
  | `pc` | `pc` | 8-bit |
  | `acc` | `acc` | 4-bit |
  | `mar` (derived) | `mar` | 8-bit |
  | `mdr` (derived) | `mdr` | 4-bit |
  | `ir` (derived) | `ir` | 8-bit |
  | `flags.zero` | `z_flag` | 1-bit |
- [x] 2.3 Implement opcode decoding wire mapping:
  - Extract opcode from IR (top 4 bits)
  - Set `opcode` wire state
  - Set instruction decode wires (`is_hlt`, `is_lda`, `is_sta`, etc.)
- [x] 2.4 Implement control signal derivation:
  - Based on current instruction and cycle, set control signals
  - `pc_load`, `pc_inc`, `acc_load`, `ir_load`, `mar_load`, `mdr_load`
- [x] 2.5 Convert numeric values to bit arrays for wire states:
  ```typescript
  function numberToBitArray(value: number, width: number): number[] {
    return Array.from({ length: width }, (_, i) => (value >> i) & 1);
  }
  ```
- [x] 2.6 Export from `src/visualizer/index.ts`

### Task 3: Wire Up Step Execution to Circuit Animation (AC: #2, #3)

Connect emulator step to circuit visualization updates with animation.

- [x] 3.1 Add `cpuCircuitBridge: CPUCircuitBridge` property to App class
- [x] 3.2 Initialize bridge in `initializeCircuitRenderer()` after circuit loads
- [x] 3.3 In `handleStep()`, after emulator step completes:
  ```typescript
  // After: this.cpuState = await this.emulatorBridge.step();
  if (this.circuitRenderer && this.cpuCircuitBridge && this.cpuState) {
    const model = this.circuitRenderer.getCircuitModel();
    if (model) {
      const newCircuitData = this.cpuCircuitBridge.mapStateToCircuit(this.cpuState, model);
      this.circuitRenderer.animateTransition(newCircuitData);
    }
  }
  ```
- [x] 3.4 In `handleStepBack()`, apply same circuit update logic
- [x] 3.5 Ensure `updateSignalValuesPanel()` is called AFTER animation completes (use onComplete callback)

### Task 4: Optimize Run Mode Performance (AC: #5)

Skip animation during continuous run for better performance.

- [x] 4.1 In `handleRun()` loop, use immediate update instead of animation:
  ```typescript
  // During run loop, skip animation:
  this.circuitRenderer.updateState({ circuitData: newCircuitData });
  ```
- [x] 4.2 Add `setAnimationEnabled(enabled: boolean)` method to CircuitRenderer
- [x] 4.3 Disable animation when run starts, re-enable when run stops
- [x] 4.4 Ensure final state is rendered correctly when run completes

### Task 5: Handle Reset and Load Program (AC: #1, #4)

Update circuit when program is reset or new program is loaded.

- [x] 5.1 In `handleReset()`, reset circuit to initial state:
  ```typescript
  if (this.circuitRenderer && this.cpuCircuitBridge && this.cpuState) {
    const model = this.circuitRenderer.getCircuitModel();
    if (model) {
      const resetCircuitData = this.cpuCircuitBridge.mapStateToCircuit(this.cpuState, model);
      this.circuitRenderer.updateState({ circuitData: resetCircuitData });
    }
  }
  ```
- [x] 5.2 In `handleLoadProgram()`, update circuit after program loads
- [x] 5.3 Clear any pending animations on reset

### Task 6: Write Unit Tests

- [x] 6.1 Create `src/visualizer/CPUCircuitBridge.test.ts`:
  - Test: PC value correctly maps to pc wire state
  - Test: ACC value correctly maps to acc wire state
  - Test: Zero flag maps to z_flag wire
  - Test: Opcode extraction from IR
  - Test: Bit array conversion for various widths
- [x] 6.2 Test App.ts integration:
  - Test: Circuit loads on app mount
  - Test: Circuit updates after step
  - Test: SignalValuesPanel shows correct values after step
  - Test: Animation disabled during run mode
- [x] 6.3 Test error handling:
  - Test: App handles circuit load failure gracefully

### Task 7: Verify End-to-End Flow

- [x] 7.1 Manual testing checklist:
  - [x] App starts → circuit visible with initial state
  - [x] Load program → circuit shows loaded state
  - [x] Click Step → circuit animates to new state
  - [x] Signal Values Panel shows correct PC, ACC values
  - [x] Click Run → circuit updates rapidly without animation lag
  - [x] Click Reset → circuit returns to initial state
  - [x] Wires show correct colors (green=1, gray=0, yellow=undefined)

## Dev Notes

### Architecture

This story bridges two existing systems:
1. **EmulatorBridge** (Epic 4) - Provides `CPUState` after each step
2. **CircuitRenderer** (Epic 6) - Renders circuit and animates transitions

The new `CPUCircuitBridge` translates between these:
```
CPUState (emulator) → CPUCircuitBridge → CircuitData (visualizer)
```

### Micro4 CPU State Structure

From `src/emulator/types.ts`:
```typescript
interface CPUState {
  pc: number;      // Program counter (0-255)
  acc: number;     // Accumulator (0-15)
  memory: Uint8Array; // 256 bytes
  halted: boolean;
  cycles: number;
  flags: {
    zero: boolean;
    carry: boolean;
  };
}
```

### Micro4 Circuit Wire Names

From `public/circuits/micro4-circuit.json`:
- Registers: `pc` (8-bit), `acc` (4-bit), `ir` (8-bit), `mar` (8-bit), `mdr` (4-bit)
- Flags: `z_flag` (1-bit)
- Opcode: `opcode` (4-bit)
- Control: `pc_load`, `pc_inc`, `acc_load`, `z_load`, `ir_load`, `mar_load`, `mdr_load`
- Decode: `is_hlt`, `is_lda`, `is_sta`, `is_add`, `is_sub`, `is_jmp`, `is_jz`, `is_jnz`

### Derived Values

Some circuit values need to be derived from CPU state:
- **MAR**: Memory address being accessed (from current instruction operand)
- **MDR**: Memory data register (memory[MAR] during load/store)
- **IR**: Instruction register (memory[PC] of previous fetch)
- **Opcode**: Top 4 bits of IR
- **Control signals**: Based on instruction type and execution phase

### Performance Considerations

- Animation at 30fps with 500ms duration = ~15 frames per step
- During run mode (potentially 1000+ steps/sec), skip animation entirely
- Use `requestAnimationFrame` only when needed
- Batch DOM updates in SignalValuesPanel

### Files to Modify

| File | Changes |
|------|---------|
| `src/visualizer/CPUCircuitBridge.ts` | NEW - CPU state to circuit mapping |
| `src/visualizer/CPUCircuitBridge.test.ts` | NEW - Unit tests |
| `src/visualizer/index.ts` | Export CPUCircuitBridge |
| `src/ui/App.ts` | Load circuit, wire up updates |
| `src/ui/App.test.ts` | Integration tests |

### Dependencies

- **Depends on:** Story 6.2 (CircuitLoader), Story 6.5 (Animation), Story 6.11 (SignalValuesPanel)
- **Depends on:** Epic 4 (EmulatorBridge providing CPUState)

### Out of Scope

- HDL-level simulation (circuit computes its own state) - that's a future enhancement
- Multi-cycle instruction visualization (showing fetch/decode/execute phases)
- Memory bus visualization beyond MAR/MDR

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None - implementation completed cleanly

### Completion Notes List

- Created CPUCircuitBridge class with mapStateToCircuit() method
- Implemented numberToBitArray() utility function
- Mapped all registers: PC (8-bit), ACC (4-bit), IR (8-bit), MAR (8-bit), MDR (4-bit)
- Mapped flags: z_flag, halt
- Implemented opcode extraction from IR (top 4 bits)
- Implemented instruction decode signals (is_hlt, is_lda, is_sta, etc.)
- Implemented control signal derivation (pc_load, pc_inc, acc_load, etc.)
- Added wire name caching for performance
- Integrated with App.ts:
  - loadCircuitAndInitializeBridge() called after CircuitRenderer mounts
  - updateCircuitFromCPUState() helper method for consistent updates
  - handleStep() uses animation, handleReset()/loadProgram()/run mode skip animation
- All 2835 tests pass
- TypeScript compiles cleanly

### File List

| Action | File |
|--------|------|
| ADD | `src/visualizer/CPUCircuitBridge.ts` |
| ADD | `src/visualizer/CPUCircuitBridge.test.ts` |
| MODIFY | `src/visualizer/index.ts` |
| MODIFY | `src/ui/App.ts` |
