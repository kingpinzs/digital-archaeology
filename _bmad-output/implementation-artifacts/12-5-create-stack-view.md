# Story 12.5: Create Stack View

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to see the stack contents,
So that I can debug subroutine calls.

## Acceptance Criteria

1. **Given** I am in Micro8 stage **When** I view the State panel **Then** I see a Stack section showing stack contents from SP upward (most recent pushes first)
2. **Given** I am in Micro8 stage **When** values are pushed to the stack **Then** the stack display shows the pushed values with their memory addresses
3. **Given** I am in Micro8 stage **When** a CALL instruction executes **Then** the return address entries on the stack are visually distinguished from data values
4. **Given** I am in Micro8 stage **When** the stack grows or shrinks (PUSH/POP/CALL/RET) **Then** the display updates to reflect the current stack depth
5. **Given** I am in Micro4 stage **When** I view the State panel **Then** the Stack section is NOT shown (Micro4 has no stack)
6. **Given** the existing test suite **When** all tests pass including new Stack View tests **Then** the implementation is verified complete

## Tasks / Subtasks

- [x] Task 1: Create StackView component (AC: #1, #2, #4)
  - [x] 1.1 Create `StackViewState` interface: `sp: number`, `memory: Uint8Array`, `stackBaseAddr?: number`
  - [x] 1.2 Create `StackView` class following the mount/updateState/render/destroy pattern from RegisterView
  - [x] 1.3 Render stack entries from SP+1 upward to stack base (default 0xFFFF), showing up to 16 entries
  - [x] 1.4 Each entry shows: address (4 hex digits), value (2 hex digits + decimal), with current SP row highlighted
  - [x] 1.5 Show "Stack Empty" message when SP equals stack base (0xFFFF)
  - [x] 1.6 Show stack depth indicator (e.g., "Depth: 5 bytes")
  - [x] 1.7 Implement change detection: flash entries whose memory values changed since last update

- [x] Task 2: Add CSS styles for Stack View (AC: #1, #4)
  - [x] 2.1 Add `.da-stack-view` container style (padding 12px, monospace font, border-top)
  - [x] 2.2 Add `.da-stack-view__title` style (same as `.da-register-view__title`)
  - [x] 2.3 Add `.da-stack-view__info` style for SP indicator and depth display
  - [x] 2.4 Add `.da-stack-row` style (flex layout, same pattern as `.da-register-row`)
  - [x] 2.5 Add `.da-stack-row--sp` modifier for highlighting the SP boundary
  - [x] 2.6 Add `.da-stack-changed` class using same `da-register-flash` keyframe animation (reuse, don't duplicate)
  - [x] 2.7 Add `.da-stack-view__empty` style for the "Stack Empty" message

- [x] Task 3: Distinguish CALL return addresses (AC: #3)
  - [x] 3.1 Detect 16-bit return address pairs on stack: consecutive bytes that form a valid address (high byte at addr, low byte at addr-1)
  - [x] 3.2 Add `.da-stack-row--return-addr` modifier with subtle visual distinction (italic or muted label "ret addr")
  - [x] 3.3 Note: Perfect detection is impossible without execution trace — use heuristic: 16-bit value pairs pushed by CALL are word-aligned from SP

- [x] Task 4: Integrate StackView into App.ts (AC: #1, #4, #5)
  - [x] 4.1 Import `StackView` in App.ts
  - [x] 4.2 Add `private stackView: StackView | null = null` field
  - [x] 4.3 Create `initializeStackView()` method — mount after BreakpointsView in state panel
  - [x] 4.4 Create `destroyStackView()` method
  - [x] 4.5 Create `getStackView()` accessor
  - [x] 4.6 Create `updateStackView(state: CPUState)` helper — only update if `isMicro8CPUState(state)`, pass `{ sp: state.sp, memory: state.memory }`
  - [x] 4.7 Call `updateStackView` at all 8 state update sites (same pattern as `updateRegisterView`)
  - [x] 4.8 Handle reset case: when stage is micro8, call `stackView?.updateState({ sp: 0xFFFF, memory: new Uint8Array(65536) })`
  - [x] 4.9 Stage-aware visibility: only mount StackView when `this.currentStage === 'micro8'` (or hide/show on stage switch)

- [x] Task 5: Add tests (AC: #6)
  - [x] 5.1 Create `StackView.test.ts` with jsdom environment
  - [x] 5.2 Test mounting: renders `.da-stack-view` container and title
  - [x] 5.3 Test empty stack: shows "Stack Empty" when SP = 0xFFFF
  - [x] 5.4 Test stack with data: pushing bytes shows them in the display with correct hex formatting
  - [x] 5.5 Test stack depth display: shows correct byte count
  - [x] 5.6 Test change detection: flash animation on changed entries
  - [x] 5.7 Test destroy: removes from DOM cleanly
  - [x] 5.8 Add `isMicro8CPUState` guard test for stack view updates in App.test.ts mock
  - [x] 5.9 Run full test suite `npx vitest run` — no regressions

## Dev Notes

### Micro8 Stack Architecture (from `src/micro8/cpu.c`)

```
Stack grows DOWNWARD (pre-decrement on PUSH):
  push_byte: write to memory[SP], then SP--
  pop_byte:  SP++, then read from memory[SP]

Stack grows from 0xFFFF downward.
DEFAULT_SP = 0xFFFF (cpu.h:25)

Word operations (CALL, PUSH16):
  push_word: push high byte first, then low byte
  pop_word:  pop low byte first, then high byte
  → Return addresses are stored as: [low @ SP+1] [high @ SP+2]
```

### Stack Display Layout

```
Stack (Depth: 5)
─────────────────────────
 FFFF │ -- │ ← SP (empty)
 FFFE │ 0x42 (66)  │ data
 FFFD │ 0x00 (0)   │ ← ret addr (H)
 FFFC │ 0x10 (16)  │ ← ret addr (L)
 FFFB │ 0xAA (170) │ data
 FFFA │ 0x55 (85)  │ data
```

Show entries from SP+1 (first pushed value) up to SP+16 (or stack base). The SP row itself is shown as the boundary marker. Values below SP+1 are not yet on the stack.

### Component Pattern (from RegisterView, FlagsView)

```typescript
export interface StackViewState {
  sp: number;
  memory: Uint8Array;
}

export class StackView {
  mount(container: HTMLElement): void { ... }
  updateState(state: Partial<StackViewState>): void { ... }
  private render(): void { ... }
  destroy(): void { ... }
}
```

Key implementation details:
- `previousState` stores a copy of the relevant memory slice for change detection
- Only store/compare the ~16 bytes near SP, NOT the full 64KB memory
- Use `boundAnimationEndHandler` pattern for `da-stack-changed` class removal
- Reuse `da-register-flash` keyframe animation (don't create new one)

### App.ts Integration Pattern

**8 state update call sites** (same pattern as `updateRegisterView` from Story 12-4):

| Site | Context | State Variable |
|------|---------|---------------|
| Reset (line ~821) | Stage switch/reset | Hardcoded defaults |
| Load (line ~2484) | After loadProgram | `this.cpuState` |
| Reset (line ~2646) | After reset button | `this.cpuState` |
| Step (line ~2747) | After step forward | `this.cpuState` |
| Step-back (line ~2831) | After step back | `historicalState` |
| RUN throttled (line ~3006) | During execution | `state` (callback arg) |
| Halt (line ~3087) | After HLT | `this.cpuState` |
| Breakpoint (line ~3180) | At breakpoint | `this.cpuState` |

**Recommended approach**: Create `updateStackView(state: CPUState)` that checks `isMicro8CPUState(state)` and only updates if true. Call from all 8 sites.

### Stage-Aware Visibility

The StackView should only be visible in Micro8 stage. Two approaches:
1. **Mount/unmount on stage switch** — cleanest but requires `performStageSwitch` integration
2. **Always mount, hide via CSS/conditional render** — simpler initial approach

Recommended: **Option 2** — always mount but render nothing when not in Micro8 mode. The `updateStackView` helper already guards with `isMicro8CPUState()`. The render method simply shows nothing when `sp` and `memory` haven't been set.

### CSS: Reuse Existing Animation

```css
/* REUSE — do NOT duplicate this keyframe */
@keyframes da-register-flash { ... }

/* Stack-specific styles following BEM pattern */
.da-stack-view { ... }
.da-stack-view__title { ... }
.da-stack-view__info { ... }
.da-stack-row { ... }
.da-stack-row--sp { ... }
.da-stack-changed { animation: da-register-flash 300ms ease-out; }
```

### Return Address Detection Heuristic (Task 3)

Perfect CALL/RET detection requires execution trace data not available in CPUState. Use a simple heuristic:
- CALL pushes a 16-bit return address as two consecutive bytes (high then low)
- After a CALL, the two bytes at SP+1 and SP+2 form the return address
- We can label these if they look like valid code addresses (within program range)
- **Keep it simple**: Mark any word-aligned pair that falls within reasonable code space as a potential return address. If this proves too noisy, it can be refined in a future story.

### Hex Formatting Rules

| Element | Hex Digits | Range | Format Example |
|---------|-----------|-------|----------------|
| Stack Address | 4 | 0-65535 | `0xFFFE` |
| Stack Value | 2 | 0-255 | `0xFF (255)` |
| SP Display | 4 | 0-65535 | `SP: 0xFFFD` |

### Project Structure Notes

- All debugger view files in `src/debugger/` — do NOT create files elsewhere
- Test files co-located as `*.test.ts`
- Named exports only (no default exports)
- Constants in `SCREAMING_SNAKE_CASE`
- BEM CSS naming: `.da-component__element--modifier`

### Previous Story Intelligence

**Story 12-4** (commit `0d10075`): Created stage-aware RegisterView with Micro8 R0-R7 display. Key patterns:
- Extended `RegisterViewState` with optional fields for Micro8 (`registers?: number[]`, `sp?: number`)
- Used `isMicro8()` detection method based on presence of `registers` array
- Created `updateRegisterView(state: CPUState)` helper in App.ts using `isMicro8CPUState()` type guard
- Replaced all 8 call sites with helper — same approach needed for StackView
- Code review found: corrupted JSDoc from insertion, duplicate imports, stale comments, missing dispatch test
- All 4294 tests passing after review fixes

**Story 12-1** (commits `b5feef4`, `3a7d63a`): Created `Micro8CPUState` interface with `sp: number` and `memory: Uint8Array` — the data sources StackView needs.

### References

- [Source: digital-archaeology-web/src/debugger/RegisterView.ts] — Component pattern reference (269 lines)
- [Source: digital-archaeology-web/src/debugger/MemoryView.ts] — Memory display pattern (480 lines)
- [Source: digital-archaeology-web/src/debugger/FlagsView.ts] — Simple view pattern (179 lines)
- [Source: digital-archaeology-web/src/emulator/types.ts:775-805] — Micro8CPUState interface with sp and memory
- [Source: digital-archaeology-web/src/ui/App.ts:1481-1509] — MemoryView init/destroy/accessor pattern
- [Source: digital-archaeology-web/src/ui/App.ts:2990-3013] — State update subscription (RUN mode)
- [Source: digital-archaeology-web/src/styles/main.css:2102-2156] — Register/Flags CSS patterns
- [Source: src/micro8/cpu.c:188-207] — Stack operations (push_byte, pop_byte, push_word, pop_word)
- [Source: src/micro8/cpu.h:25] — DEFAULT_SP = 0xFFFF
- [Source: _bmad-output/planning-artifacts/epics.md:2363-2377] — Epic 12 Story 12.5 ACs
- [Source: _bmad-output/implementation-artifacts/12-4-create-8-register-display.md] — Previous story patterns

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- RED: 24 StackView tests written → FAIL (StackView.ts doesn't exist)
- GREEN: StackView.ts implemented (Tasks 1, 3) → 24/24 pass
- GREEN: CSS styles added (Task 2) → no test impact
- GREEN: App.ts integration (Task 4) → 497/497 App tests pass
- GREEN: App.test.ts StackView integration tests added (Task 5.8) → 9 new App tests pass
- Full suite: 105 files, 4327 tests, all passing, zero regressions
- CODE REVIEW: 5 issues found (1 HIGH, 3 MEDIUM, 1 LOW) — all fixed
- POST-REVIEW: 105 files, 4331 tests (+4 new), all passing, zero regressions

### Code Review Findings

| ID | Severity | Description | Fix |
|----|----------|-------------|-----|
| CR H-1 | HIGH | AC #5 violation: Stack section visible in Micro4 stage (title + "Stack Empty" rendered for uninitialized state; stale data persists on stage switch) | Added `memory.length === 0` guard in `render()` to skip rendering for uninitialized state; added StackView clear in non-Micro8 stage switch branch |
| CR M-1 | MEDIUM | `aria-live="polite"` on every `.da-stack-value` span causes screen reader spam on re-render | Removed `aria-live` from individual value spans |
| CR M-2 | MEDIUM | Duplicate `if (this.element)` blocks in `destroy()` | Merged into single block |
| CR M-3 | MEDIUM | No test for `stackBaseAddr` override property | Added 2 tests for custom stack base (depth calc + empty detection) |
| CR L-1 | LOW | CSS comment says "below FlagsView" but position is after BreakpointsView | Corrected to "after BreakpointsView" |

### Completion Notes List

- Created `StackView` component with `StackViewState` interface (`sp`, `memory`, optional `stackBaseAddr`)
- DOM-based rendering (no innerHTML) following FlagsView safety pattern
- Stack entries displayed from SP+1 upward (most recent push first), up to 16 entries max
- Each entry: 4-digit hex address, 2-digit hex value with decimal
- First row (SP+1) highlighted with `da-stack-row--sp` class (accent-color left border)
- "Stack Empty" shown when SP >= stack base (0xFFFF)
- Info bar displays "SP: 0xFFFE | Depth: N byte(s)" with proper singular/plural
- Change detection: address-keyed Map stores previous values, flashes changed entries and new entries
- Return address heuristic: checks pairs at even offsets from SP+1, marks both bytes if combined 16-bit value < 0x8000 (code space)
- CSS: 12 new classes following BEM pattern, reuses `da-register-flash` keyframe (no duplication)
- App.ts: `updateStackView(state: CPUState)` helper using `isMicro8CPUState()` guard
- App.ts: Called at all 8 state update sites (7 via helper + 1 reset with stage-aware defaults)
- Stage-aware: always mounted but only renders data when Micro8 state is provided
- Exported from `@debugger/index` barrel file

### Change Log

- 2026-02-13: Created StackView.ts with StackViewState interface, DOM-based rendering, change detection, return address heuristic (Tasks 1, 3)
- 2026-02-13: Created StackView.test.ts with 24 tests covering mount, empty stack, data display, depth, change detection, return addresses, destroy (Task 5)
- 2026-02-13: Added StackView CSS styles to main.css between FlagsView and MemoryView sections (Task 2)
- 2026-02-13: Integrated StackView into App.ts — import, field, init/destroy/accessor, updateStackView helper, 8 call sites, reset case (Task 4)
- 2026-02-13: Added 9 StackView integration tests to App.test.ts (Task 5.8)
- 2026-02-13: Added StackView and StackViewState exports to debugger/index.ts barrel file
- 2026-02-13: Full suite: 105 files, 4327 tests passing, zero regressions
- 2026-02-13: CODE REVIEW — 5 issues found and fixed:
  - CR H-1: Added `memory.length === 0` guard in render() for AC #5 compliance; added stage switch clear
  - CR M-1: Removed `aria-live="polite"` from individual `.da-stack-value` spans
  - CR M-2: Merged duplicate `if (this.element)` blocks in destroy()
  - CR M-3: Added 2 tests for `stackBaseAddr` override (depth calc + empty detection)
  - CR L-1: Fixed CSS comment from "below FlagsView" to "after BreakpointsView"
  - Updated mount test to provide Micro8 state before checking title (adapts to H-1 fix)
  - Added 2 uninitialized/Micro4 regression tests (CR H-1)
- 2026-02-13: Post-review full suite: 105 files, 4331 tests passing, zero regressions

### File List

- `digital-archaeology-web/src/debugger/StackView.ts` — New: StackView component (228 lines)
- `digital-archaeology-web/src/debugger/StackView.test.ts` — New: 28 StackView tests
- `digital-archaeology-web/src/debugger/index.ts` — Modified: added StackView and StackViewState exports
- `digital-archaeology-web/src/styles/main.css` — Modified: added StackView CSS styles (12 new classes)
- `digital-archaeology-web/src/ui/App.ts` — Modified: import, field, init/destroy/accessor, updateStackView helper, 8 call sites, reset case
- `digital-archaeology-web/src/ui/App.test.ts` — Modified: 9 new StackView integration tests
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Modified: 12-5 status updated
- `_bmad-output/implementation-artifacts/12-5-create-stack-view.md` — Modified: task checkboxes, dev agent record, status
