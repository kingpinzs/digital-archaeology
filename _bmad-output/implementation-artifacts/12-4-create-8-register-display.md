# Story 12.4: Create 8-Register Display

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to see all 8 registers,
So that I can track Micro8 state.

## Acceptance Criteria

1. **Given** I am in Micro8 stage **When** I view the State panel **Then** I see R0-R7 registers displayed with 8-bit hex and decimal values
2. **Given** I am in Micro8 stage **When** I view the State panel **Then** I see SP (stack pointer) displayed as a 16-bit value
3. **Given** I am in Micro8 stage **When** I view the State panel **Then** I see PC displayed as a 16-bit value (Micro8 has 64KB address space)
4. **Given** I step an instruction that changes a register value **When** the State panel updates **Then** the changed register row flashes with the accent color animation (300ms `da-register-flash`)
5. **Given** I am in Micro4 stage **When** I view the State panel **Then** I still see the original PC + ACC display (no regressions)
6. **Given** the existing test suite **When** all tests pass including new Micro8 register tests **Then** the implementation is verified complete

## Tasks / Subtasks

- [x] Task 1: Extend RegisterViewState interface for Micro8 (AC: #1, #2, #3, #5)
  - [x] 1.1 Add optional `registers?: number[]` field to `RegisterViewState` (R0-R7 for Micro8, undefined for Micro4)
  - [x] 1.2 Add optional `sp?: number` field to `RegisterViewState` (16-bit stack pointer)
  - [x] 1.3 Keep existing `pc` and `accumulator` fields for backward compatibility with Micro4
  - [x] 1.4 Update JSDoc on `pc` to document 8-bit (Micro4) vs 16-bit (Micro8) range

- [x] Task 2: Make RegisterView render stage-aware (AC: #1, #2, #3, #5)
  - [x] 2.1 Update `render()` to detect Micro8 mode: if `this.state.registers` is defined and non-empty, render 8-register layout
  - [x] 2.2 Micro8 layout: PC (4 hex digits), SP (4 hex digits), R0-R7 (2 hex digits each), all with decimal in parentheses
  - [x] 2.3 Micro4 layout: keep existing PC (2 hex digits) + ACC (1 hex digit) — NO CHANGES to Micro4 rendering
  - [x] 2.4 Update `updateState()` to handle new optional fields: `registers` array, `sp` value
  - [x] 2.5 Clamp values: PC to 0-65535 for Micro8, SP to 0-65535, R0-R7 to 0-255
  - [x] 2.6 Add register alias labels: show "R0 (A)", "R1 (B)", "R2 (C)", "R3 (D)", "R4 (E)", "R5 (H)", "R6 (L)", "R7" to aid learning

- [x] Task 3: Implement per-register change detection (AC: #4)
  - [x] 3.1 Extend `previousState` to track previous `registers` array and `sp` value
  - [x] 3.2 Compare each register individually: `this.previousState.registers[i] !== this.state.registers[i]`
  - [x] 3.3 Apply `da-register-changed` CSS class to each row that changed
  - [x] 3.4 Existing `handleAnimationEnd` already handles class removal — verified: works with multiple simultaneous animations

- [x] Task 4: Update App.ts to pass Micro8 register state (AC: #1, #2, #3, #5)
  - [x] 4.1 Import `isMicro8CPUState` from `../emulator` into App.ts
  - [x] 4.2 Create helper method `updateRegisterView(state: CPUState): void` that dispatches based on `isMicro8CPUState(state)`
  - [x] 4.3 For Micro8 state: call `registerView?.updateState({ pc: state.pc, sp: state.sp, registers: state.registers })`
  - [x] 4.4 For Micro4 state: call `registerView?.updateState({ pc: state.pc, accumulator: state.accumulator })`
  - [x] 4.5 Replace all 8 `registerView?.updateState(...)` call sites with `this.updateRegisterView(this.cpuState)` (7 via helper, 1 stage-aware reset)
  - [x] 4.6 Handle the reset case separately: when stage is micro8, reset to `{ pc: 0, sp: 0xFFFF, registers: [0,0,0,0,0,0,0,0] }`, else `{ pc: 0, accumulator: 0 }`

- [x] Task 5: Add/update tests (AC: #6)
  - [x] 5.1 Add Micro8 register display tests to `RegisterView.test.ts`: mount, render 8 registers, correct hex formatting
  - [x] 5.2 Add per-register change detection tests: flash only changed registers, not unchanged ones
  - [x] 5.3 Add SP display test: 16-bit hex format `0xFFFF (65535)`
  - [x] 5.4 Add PC 16-bit format test for Micro8 mode: `0x0100 (256)` vs Micro4's `0x00 (0)`
  - [x] 5.5 Add backward compatibility test: Micro4 state (no registers field) still renders PC + ACC
  - [x] 5.6 Run full test suite `npx vitest run` — 4293 tests passing, zero regressions

## Dev Notes

### Architecture: How State Flows from Worker → RegisterView

```
Worker (readMicro8CPUState)
  → postMessage({ type: STATE_UPDATE, payload: Micro8CPUState })
  → EmulatorBridge.onStateUpdate callback
  → App.ts handler (throttled at 16ms during RUN mode)
  → this.updateRegisterView(state)    ← NEW helper method
  → registerView.updateState({...})
  → RegisterView.render()             ← stage-aware rendering
```

### Key Types Already Defined (Story 12-1, DO NOT RECREATE)

**`Micro8CPUState` extends `CPUState`** (in `src/emulator/types.ts:775-786`):
- `registers: number[]` — R0-R7 (8 values, 0-255 each)
- `sp: number` — Stack Pointer (16-bit, 0-65535)
- `carryFlag: boolean`, `signFlag: boolean`, `overflowFlag: boolean`
- Inherits `pc`, `accumulator` (set to 0 as placeholder), `zeroFlag`, `halted`, etc.

**`isMicro8CPUState(state)` type guard** (in `src/emulator/types.ts:792-805`):
- Checks `'registers' in state && Array.isArray(...)` plus sp and flag fields
- Exported from `src/emulator/index.ts:66`

### RegisterView Current Implementation (162 lines)

Location: `src/debugger/RegisterView.ts`

**Interface** (lines 8-13):
```typescript
export interface RegisterViewState {
  pc: number;        // 0-255 (8-bit) — will need expansion
  accumulator: number; // 0-15 (4-bit)
}
```

**Key methods:** `mount(container)`, `updateState(Partial<RegisterViewState>)`, `render()`, `destroy()`

**Rendering pattern:** Sets `this.element.innerHTML` with template literal. Values formatted via `toString(16).toUpperCase().padStart(N, '0')`.

**Change detection:** Compares `this.previousState` vs `this.state` per field. Applies `da-register-changed` CSS class. Animation removed on `animationend` event.

**HTML structure:**
```html
<div class="da-register-view">
  <h3 class="da-register-view__title">Registers</h3>
  <div class="da-register-view__list">
    <div class="da-register-row" data-register="pc">...</div>
    <div class="da-register-row" data-register="accumulator">...</div>
  </div>
</div>
```

### App.ts Call Sites (8 total — ALL must be updated)

| Line | Context | Current Code |
|------|---------|-------------|
| 812 | Stage reset | `{ pc: 0, accumulator: 0 }` |
| 2452 | After loadProgram | `{ pc: cpuState.pc, accumulator: cpuState.accumulator }` |
| 2617 | After reset | `{ pc: cpuState.pc, accumulator: cpuState.accumulator }` |
| 2721 | After step | `{ pc: cpuState.pc, accumulator: cpuState.accumulator }` |
| 2808 | After step-back | `{ pc: cpuState.pc, accumulator: cpuState.accumulator }` |
| 2986 | During RUN (throttled) | `{ pc: state.pc, accumulator: state.accumulator }` |
| 3070 | Error path 1 | `{ pc: cpuState.pc, accumulator: cpuState.accumulator }` |
| 3166 | Error path 2 | `{ pc: cpuState.pc, accumulator: cpuState.accumulator }` |

**Recommended approach:** Extract a helper method `updateRegisterView(state: CPUState)` that uses `isMicro8CPUState()` type guard. Then replace all 8 call sites with `this.updateRegisterView(state)`. This avoids 8 duplicated `if/else` blocks.

### CSS Styling (Already Established)

All styles in `src/styles/main.css`:
- `.da-register-view` — padding 12px, monospace font (lines 2102-2105)
- `.da-register-row` — flex, space-between, border-bottom (lines 2121-2128)
- `.da-register-label` — font-weight 600, secondary color (lines 2133-2136)
- `.da-register-value` — text-align right, primary color (lines 2138-2143)
- `.da-register-changed` — 300ms flash animation with accent color (lines 2146-2156)

**No new CSS classes needed** — the existing layout handles variable numbers of rows. If the panel gets too tall with 10 rows (PC + SP + R0-R7), the existing scrollable panel container handles overflow.

### Register Alias Labels for Educational Value

Micro8 register aliases (from `assembler.c:parse_register()`):
- R0 = A (Accumulator)
- R1 = B
- R2 = C
- R3 = D
- R4 = E
- R5 = H
- R6 = L
- R7 (no alias)

Display format: `R0 (A)`, `R1 (B)`, etc. This teaches users which register corresponds to which alias — critical for the educational mission.

### Hex Formatting Rules

| Stage | Register | Hex Digits | Range | Format Example |
|-------|----------|-----------|-------|----------------|
| Micro4 | PC | 2 | 0-255 | `0x0A (10)` |
| Micro4 | ACC | 1 | 0-15 | `0xF (15)` |
| Micro8 | PC | 4 | 0-65535 | `0x0100 (256)` |
| Micro8 | SP | 4 | 0-65535 | `0xFFFE (65534)` |
| Micro8 | R0-R7 | 2 | 0-255 | `0xFF (255)` |

### FlagsView Pattern (for reference)

`src/debugger/FlagsView.ts` uses identical architecture: `mount()`, `updateState()`, `render()`, `destroy()`, same change detection pattern, same CSS animation. FlagsView currently shows only `zeroFlag`. Story 12-4 does NOT modify FlagsView — additional flags (carry, sign, overflow) will be a separate story or extension.

### Project Structure Notes

- All debugger view files in `src/debugger/` — do NOT create files elsewhere
- Test files co-located as `*.test.ts`
- Named exports only (no default exports)
- Constants in `SCREAMING_SNAKE_CASE`
- BEM CSS naming: `.da-component__element--modifier`

### Previous Story Intelligence

**Story 12-3** (commit `69437f3`): Verification story. Only change was adding PC to syntax highlighting registers. Confirmed 68/68 mnemonic coverage.

**Story 12-1** (commit `b5feef4`, fixes `3a7d63a`): Created the entire Micro8 WASM pipeline including `Micro8CPUState`, `isMicro8CPUState()`, stage-aware worker with `readMicro8CPUState()`, EmulatorBridge stage parameter. This is the foundation Story 12-4 builds upon.

**Story 5-3** (created RegisterView): Established the component architecture, CSS classes, change detection pattern, and animation framework.

### References

- [Source: digital-archaeology-web/src/debugger/RegisterView.ts] — Current RegisterView (162 lines, Micro4 only)
- [Source: digital-archaeology-web/src/debugger/RegisterView.test.ts] — Current tests
- [Source: digital-archaeology-web/src/emulator/types.ts:775-805] — Micro8CPUState interface and type guard
- [Source: digital-archaeology-web/src/emulator/index.ts:66] — isMicro8CPUState export
- [Source: digital-archaeology-web/src/ui/App.ts:812,2452,2617,2721,2808,2986,3070,3166] — 8 registerView update sites
- [Source: digital-archaeology-web/src/styles/main.css:2102-2156] — Register CSS styles
- [Source: _bmad-output/planning-artifacts/epics.md:2345-2360] — Epic 12 Story 12.4 ACs
- [Source: _bmad-output/implementation-artifacts/12-1-compile-micro8-emulator-to-wasm.md] — Micro8 worker architecture

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- RED: 13 Micro8 tests added to RegisterView.test.ts → 13 FAIL / 34 pass (expected)
- GREEN: RegisterView.ts updated with Micro8 support (Tasks 1-3) → 47/47 pass
- GREEN: App.ts updated with updateRegisterView helper and 8 call sites replaced (Task 4) → 487/487 App tests pass
- App.test.ts: Added isMicro8CPUState to @emulator/index mock (required for runtime import)
- Full suite: 104 files, 4293 tests, all passing, zero regressions
- TypeScript: 1 pre-existing error in Editor.test.ts:1621 (unrelated)
- Code review: 5 findings (2M, 3L), all fixed. M-1: corrupted JSDoc, M-2: duplicate import, L-1: test comment, L-2: class JSDoc, L-3: missing Micro8 App dispatch test
- Post-fix suite: 104 files, 4294 tests, all passing, zero regressions

### Completion Notes List

- Extended `RegisterViewState` with optional `registers?: number[]` and `sp?: number` fields for Micro8 support
- Split `render()` into `renderMicro4()` and `renderMicro8()` with `isMicro8()` detection method
- Micro8 layout: PC (4 hex digits) + SP (4 hex digits) + R0-R7 (2 hex digits each) with alias labels (R0=A through R6=L)
- Per-register change detection with deep-copy of registers array in previousState
- Value clamping: R0-R7 to 0-255, SP to 0-65535, PC to 0-65535 (Micro8) or 0-255 (Micro4)
- Created `updateRegisterView(state: CPUState)` helper in App.ts using `isMicro8CPUState` type guard
- Replaced 7 of 8 call sites with helper; 1 reset case uses stage-aware inline logic (micro8 → SP=0xFFFF + 8 zero registers)
- Added `MICRO8_REGISTER_ALIASES` constant for educational register labels
- No new CSS needed — existing `.da-register-row` and `.da-register-changed` styles handle variable row count
- Micro4 backward compatibility fully preserved — 34 original tests continue passing

### Change Log

- 2026-02-13: Extended RegisterViewState interface with `registers?: number[]` and `sp?: number`. Added `MICRO8_REGISTER_ALIASES` constant. Split render into `renderMicro4()` and `renderMicro8()`. Added `isMicro8()` detection. Updated `updateState()` with mode switching, deep-copy of registers, and per-field clamping.
- 2026-02-13: Created `updateRegisterView(state: CPUState)` helper in App.ts. Imported `isMicro8CPUState` from `@emulator/index`. Replaced 7 call sites with helper, 1 reset case with stage-aware logic.
- 2026-02-13: Added 13 Micro8 tests to RegisterView.test.ts. Added `isMicro8CPUState` to App.test.ts emulator mock. All 4293 tests passing.
- 2026-02-14: Code review fixes — M-1: separated corrupted JSDoc blocks for updateRegisterView/updateCircuitFromCPUState (App.ts). M-2: consolidated duplicate `@emulator/index` import. L-1: updated test file comment to include Story 12.4. L-2: updated class JSDoc to mention Micro8 mode. L-3: added Micro8 state dispatch test to App.test.ts. All 4294 tests passing.

### File List

- `digital-archaeology-web/src/debugger/RegisterView.ts` — Modified: extended interface, added Micro8 rendering, per-register change detection, alias labels
- `digital-archaeology-web/src/debugger/RegisterView.test.ts` — Modified: 13 new Micro8 register display tests
- `digital-archaeology-web/src/ui/App.ts` — Modified: imported isMicro8CPUState, added updateRegisterView helper, replaced 8 call sites
- `digital-archaeology-web/src/ui/App.test.ts` — Modified: added isMicro8CPUState to emulator mock
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Modified: 12-4 status updated
- `_bmad-output/implementation-artifacts/12-4-create-8-register-display.md` — Modified: task checkboxes, dev agent record, status
