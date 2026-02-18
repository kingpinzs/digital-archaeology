# Story 18.5: Implement Experimentation Mode

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to bypass constraints sometimes,
so that I can explore freely.

## Acceptance Criteria

1. **Given** I want unrestricted access **When** I enable Experimentation Mode **Then** all constraints are relaxed (memory limit and instruction set checks are bypassed)
2. **Given** I am in Experimentation Mode **When** I look at the UI **Then** an indicator shows I'm in experimentation mode (visually distinct, always visible while active)
3. **Given** I am in Experimentation Mode **When** I want to return to constrained mode **Then** I can switch back to constrained mode via the same toggle
4. **Given** I am in Experimentation Mode **When** I successfully assemble a program **Then** the assembly result tracks that it was assembled in experimentation mode (for future achievement system in Epic 19)

## Tasks / Subtasks

- [x] Task 1: Add `experimentationMode` to AppSettings (AC: #1, #3)
  - [x]1.1: Add `experimentationMode: boolean` field to `AppSettings` interface in `state/types.ts`
  - [x]1.2: Set default to `false` in `DEFAULT_SETTINGS`
  - [x]1.3: Add `experimentationMode` validation to `isValidSettings()` type guard (typeof boolean check)
  - [x]1.4: Bump `version` in DEFAULT_SETTINGS to `3` (migration: missing field defaults to `false`)

- [x] Task 2: Add `assembledInExperimentationMode` flag to AssembleResult (AC: #4)
  - [x]2.1: Add `assembledInExperimentationMode?: boolean` field to `AssembleResult` interface in `emulator/types.ts`
  - [x]2.2: This is backwards-compatible (optional field, existing code unaffected)

- [x] Task 3: Add experimentation mode bypass to AssemblerBridge (AC: #1)
  - [x]3.1: Add `experimentationMode: boolean = false` property to `AssemblerBridge` class
  - [x]3.2: Add `setExperimentationMode(enabled: boolean): void` method
  - [x]3.3: In `assemble()`, when `this.experimentationMode` is `true`: skip the memory limit check (line ~373, the `binary.length > memoryLimit` guard) — let oversized binaries through
  - [x]3.4: In `assemble()`, when `this.experimentationMode` is `true`: skip the instruction set constraint check (line ~392, the `findEarliestStageForInstruction` guard) — let all "unknown instruction" errors pass through as normal SYNTAX_ERRORs (the WASM assembler may still reject truly invalid mnemonics)
  - [x]3.5: When experimentation mode is ON and assembly succeeds, set `assembledInExperimentationMode: true` on the AssembleResult
  - [x]3.6: When experimentation mode is OFF, set `assembledInExperimentationMode: false` (or omit)

- [x] Task 4: Add experimentation mode toggle to Toolbar (AC: #2, #3)
  - [x]4.1: Add `isExperimentationMode: boolean` to `ToolbarState` interface
  - [x]4.2: Add `onExperimentationModeToggle: () => void` to `ToolbarCallbacks` interface
  - [x]4.3: Create an experimentation mode toggle button in the Toolbar's render method — position it in the right section of the toolbar, near settings/help
  - [x]4.4: Use a beaker/flask icon (Unicode: U+2697 or text "EXP") with `da-experimentation-toggle` CSS class
  - [x]4.5: Apply active state CSS class `da-experimentation-toggle--active` when mode is ON
  - [x]4.6: Add `aria-pressed` attribute for accessibility (true/false based on state)
  - [x]4.7: Add `title` attribute: "Experimentation Mode: Bypass stage constraints" (off) / "Experimentation Mode: Active — constraints bypassed" (on)
  - [x]4.8: Wire click handler to `onExperimentationModeToggle` callback
  - [x]4.9: Add button to `updateState()` so it reflects current `isExperimentationMode`

- [x] Task 5: Wire experimentation mode in App.ts (AC: #1, #2, #3, #4)
  - [x]5.1: Add `isExperimentationMode: boolean = false` property to App class
  - [x]5.2: Load experimentation mode from `SettingsStorage` on initialization (default false)
  - [x]5.3: Add `toggleExperimentationMode()` method: flips `isExperimentationMode`, saves to SettingsStorage, calls `assemblerBridge.setExperimentationMode()`, updates Toolbar state
  - [x]5.4: Pass `onExperimentationModeToggle: () => this.toggleExperimentationMode()` in ToolbarCallbacks
  - [x]5.5: Include `isExperimentationMode` in Toolbar state updates
  - [x]5.6: After assembly succeeds, if result has `assembledInExperimentationMode: true`, include that info in status bar message (e.g., "Assembled (Experimentation Mode)")

- [x] Task 6: Add CSS styles for experimentation mode indicator (AC: #2)
  - [x]6.1: Add `.da-experimentation-toggle` base styles in `main.css` — button styling consistent with existing toolbar buttons
  - [x]6.2: Add `.da-experimentation-toggle--active` styles — visually distinct active state (e.g., amber/gold background, glow effect) to make it obvious constraints are bypassed
  - [x]6.3: Use existing CSS variables for colors where possible (`--da-accent`, `--da-bg-secondary`, `--da-text-primary`)
  - [x]6.4: Ensure styles work in both lab-mode and story-mode themes

- [x] Task 7: Write comprehensive tests (AC: #1, #2, #3, #4)
  - [x]7.1: Test `DEFAULT_SETTINGS.experimentationMode` is `false`
  - [x]7.2: Test `isValidSettings()` accepts settings with `experimentationMode: true`
  - [x]7.3: Test `isValidSettings()` accepts settings with `experimentationMode: false`
  - [x]7.4: Test `isValidSettings()` rejects settings with non-boolean `experimentationMode`
  - [x]7.5: Test `AssemblerBridge.setExperimentationMode(true)` enables bypass
  - [x]7.6: Test memory limit check is SKIPPED when experimentation mode is ON (binary > memoryLimit still succeeds)
  - [x]7.7: Test memory limit check is ENFORCED when experimentation mode is OFF (existing behavior unchanged)
  - [x]7.8: Test instruction set constraint check is SKIPPED when experimentation mode is ON
  - [x]7.9: Test instruction set constraint check is ENFORCED when experimentation mode is OFF (existing behavior unchanged)
  - [x]7.10: Test `assembledInExperimentationMode` is `true` on successful result when mode is ON
  - [x]7.11: Test `assembledInExperimentationMode` is not set (or false) on successful result when mode is OFF
  - [x]7.12: Test Toolbar renders experimentation mode toggle button
  - [x]7.13: Test toggle button has `aria-pressed="false"` when mode is OFF
  - [x]7.14: Test toggle button has `aria-pressed="true"` and active CSS class when mode is ON
  - [x]7.15: Test toggle button click calls `onExperimentationModeToggle` callback
  - [x]7.16: Test existing SYNTAX_ERROR and VALUE_ERROR behavior is unchanged (no regressions)

## Dev Notes

### Architecture Context

**This story completes Epic 18 (Period-Accurate Constraints System) by adding an escape hatch.** Stories 18-1 through 18-4 built a constraint system that enforces period-accurate limitations and teaches users WHY those limits exist. Story 18-5 gives users the freedom to bypass those constraints when they want to explore freely — because the best learning happens when constraints are a choice, not a prison.

**The key insight:** Experimentation mode is a BYPASS layer that sits between the WASM assembler and the constraint checks. The WASM assembler itself doesn't know about constraints — it just assembles code for whatever stage it's configured for. The constraint checks (memory limit, instruction set) are applied AFTER successful assembly in `AssemblerBridge.assemble()`. Experimentation mode simply skips those post-assembly constraint checks.

### Constraint Enforcement Points — Where Bypass Happens

```
AssemblerBridge.assemble(source)
  → Worker assembles (WASM) — unchanged, always runs
  → ASSEMBLE_SUCCESS received:
    ★ IF experimentationMode → SKIP memory check, return success
    → Check binary.length > memoryLimit → buildMemoryConstraintError() (Story 18.2)
  → ASSEMBLE_ERROR received:
    ★ IF experimentationMode → SKIP instruction set check, let error pass through normally
    → Check if "Unknown instruction" is actually a later-stage instruction → buildInstructionSetError() (Story 18.3)
    → Otherwise: normal error handling
```

**Important edge case:** When experimentation mode is ON and an instruction truly doesn't exist in ANY stage (e.g., typo "PSUH" instead of "PUSH"), the WASM assembler will still reject it as a SYNTAX_ERROR. Experimentation mode only bypasses the constraint layer — it doesn't make the assembler accept invalid instructions.

### Key Implementation Details

**1. AppSettings Extension (`state/types.ts`):**

```typescript
export interface AppSettings {
  // ... existing fields ...
  /** Whether experimentation mode is active — bypasses stage constraints (Story 18.5) */
  experimentationMode: boolean;
  version: number; // Bump to 3
}
```

The `isValidSettings()` type guard needs a `typeof obj.experimentationMode === 'boolean'` check. For migration, if the field is missing (version < 3), default to `false`.

**2. AssemblerBridge Bypass (`emulator/AssemblerBridge.ts`):**

```typescript
export class AssemblerBridge {
  private experimentationMode: boolean = false;
  // ... existing fields ...

  setExperimentationMode(enabled: boolean): void {
    this.experimentationMode = enabled;
  }
}
```

In `assemble()`, the two bypass points:
```typescript
// Story 18.2 memory check — line ~371-376
if (!this.experimentationMode && binary.length > memoryLimit) {
  resolve(buildMemoryConstraintError(...));
  return;
}

// Story 18.3 instruction check — line ~389-396
if (!this.experimentationMode && unknownMnemonic) {
  // ... existing constraint logic ...
}
```

When mode is ON and assembly succeeds:
```typescript
resolve({
  success: true,
  binary,
  error: null,
  assembledInExperimentationMode: this.experimentationMode || undefined,
});
```

**3. Toolbar Toggle Button (`ui/Toolbar.ts`):**

Follow the existing button pattern. Add the toggle in the right group of the toolbar, after the speed slider and before settings/help. Use the `updateState()` method to sync visual state.

```typescript
// In ToolbarState:
isExperimentationMode: boolean;

// In ToolbarCallbacks:
onExperimentationModeToggle: () => void;
```

The button should be visually distinct when active — amber/gold background to signal "constraints are off." Use `aria-pressed` for accessibility.

**4. App.ts Wiring:**

```typescript
private isExperimentationMode: boolean = false;

// In initialization:
this.isExperimentationMode = this.settingsStorage?.getSetting('experimentationMode') ?? false;
this.assemblerBridge?.setExperimentationMode(this.isExperimentationMode);

// Toggle handler:
private toggleExperimentationMode(): void {
  this.isExperimentationMode = !this.isExperimentationMode;
  this.settingsStorage?.setSetting('experimentationMode', this.isExperimentationMode);
  this.assemblerBridge?.setExperimentationMode(this.isExperimentationMode);
  // Update toolbar to reflect new state
}
```

### Existing Patterns to Follow

**From `ToolbarState` toggle pattern (isRunning):**
- Boolean state field on `ToolbarState` interface
- Button visual state controlled by `updateState()`
- Click handler in `ToolbarCallbacks`

**From `SettingsStorage.setSetting()` / `.getSetting()`:**
- Persists individual settings to localStorage
- Merges with existing settings
- Returns defaults when not found

**From `AppSettings` version migration:**
- Increment version when adding fields
- Missing fields default via `DEFAULT_SETTINGS` spread
- `isValidSettings()` validates all fields

### Anti-Patterns to AVOID

- **DO NOT** modify the WASM assembler itself — experimentation mode is a JS-layer bypass, not a WASM change
- **DO NOT** remove or weaken existing constraint error builders — they still run when experimentation mode is OFF
- **DO NOT** create a separate component file for the toggle — add to existing `Toolbar.ts`
- **DO NOT** use `innerHTML` for the toggle button — use `document.createElement` and `textContent`
- **DO NOT** hardcode CSS colors — use CSS variables
- **DO NOT** make the toggle a dropdown or modal — keep it as a simple toggle button
- **DO NOT** implement a full achievements system — just add the `assembledInExperimentationMode` tracking flag for Epic 19 to consume later
- **DO NOT** change constraint error types or messages — those are established by Stories 18-2/18-3/18-4

### Boundary Conditions to Handle

1. **Mode toggle during assembly:** If user toggles mode while assembly is in progress, the current assembly should use whatever mode was set when `assemble()` was called. The `experimentationMode` property is read at check time, so toggling mid-assembly could theoretically change behavior — but assembly is fast enough this is unlikely to matter in practice.
2. **Settings migration:** Users with `version: 2` settings (no `experimentationMode` field) should gracefully default to `false` on next load. The `isValidSettings()` check must handle missing field → default.
3. **Stage switching with experimentation mode ON:** When switching stages, experimentation mode should persist. It's a global setting, not per-stage.
4. **Experimentation mode + story mode:** Experimentation mode applies to lab mode only (story mode doesn't use the assembler directly). But the setting persists across mode switches.
5. **Binary too large for emulator:** Even with experimentation mode bypassing the memory limit CHECK, the emulator may still reject a binary that's too large for its WASM memory. This is OK — the emulator has its own limits. Experimentation mode only bypasses the ASSEMBLER constraint check.

### Project Structure Notes

- MODIFIED: `digital-archaeology-web/src/state/types.ts` (~5 lines: experimentationMode field, DEFAULT_SETTINGS, isValidSettings, version bump)
- MODIFIED: `digital-archaeology-web/src/state/types.test.ts` (~10-15 lines: validation tests)
- MODIFIED: `digital-archaeology-web/src/emulator/types.ts` (~2 lines: assembledInExperimentationMode on AssembleResult)
- MODIFIED: `digital-archaeology-web/src/emulator/AssemblerBridge.ts` (~15-20 lines: experimentationMode property, setter, bypass conditions)
- MODIFIED: `digital-archaeology-web/src/emulator/AssemblerBridge.test.ts` (~30-40 lines: experimentation mode bypass tests)
- MODIFIED: `digital-archaeology-web/src/ui/Toolbar.ts` (~25-35 lines: toggle button, state, callback)
- MODIFIED: `digital-archaeology-web/src/ui/Toolbar.test.ts` (~15-20 lines: toggle button tests)
- MODIFIED: `digital-archaeology-web/src/ui/App.ts` (~15-20 lines: wiring, toggle handler, toolbar state)
- MODIFIED: `digital-archaeology-web/src/ui/App.test.ts` (~5-10 lines: experimentation mode integration)
- MODIFIED: `digital-archaeology-web/src/styles/main.css` (~15-20 lines: toggle button styles)

### Naming Conventions

- Setting field: `experimentationMode` (camelCase, boolean, on AppSettings)
- Result field: `assembledInExperimentationMode` (camelCase, optional boolean, on AssembleResult)
- Class property: `experimentationMode` (camelCase, private on AssemblerBridge)
- Method: `setExperimentationMode(enabled)` (camelCase, public on AssemblerBridge)
- Method: `toggleExperimentationMode()` (camelCase, private on App)
- State field: `isExperimentationMode` (camelCase with `is` prefix, boolean on ToolbarState)
- Callback: `onExperimentationModeToggle` (camelCase with `on` prefix, on ToolbarCallbacks)
- CSS class: `da-experimentation-toggle` (kebab-case with `da-` prefix)
- CSS active class: `da-experimentation-toggle--active` (BEM modifier)

### Testing Requirements

- **Framework:** Vitest with jsdom environment
- **Coverage:** Add to existing test files (types.test.ts, AssemblerBridge.test.ts, Toolbar.test.ts, App.test.ts)
- **Minimum:** 16+ tests covering each AC
- **Zero regressions:** All existing tests must continue passing (current count: ~4479)
- **Mock pattern:** Follow existing Worker mock pattern in AssemblerBridge.test.ts
- **Backwards compatibility:** Verify existing constraint errors still fire when mode is OFF

### Previous Story Intelligence (18-4 Create Educational Error Messages)

**Patterns established that MUST be followed:**
1. Named exports only (no default exports)
2. Add to existing files rather than creating new ones
3. Follow existing interface extension patterns (optional fields for backwards compatibility)
4. `textContent` for safe text rendering
5. CSS variables for theming
6. Comprehensive test coverage with explicit assertions
7. Test both the ON and OFF paths to prevent regression

**Code review lessons from 18-1 through 18-4:**
- Don't introduce undefined CSS variables (2M in 18-4)
- Don't duplicate test helpers — hoist shared helpers (3L in 18-4)
- Ensure interface field consistency (readonly vs mutable) (4L in 18-4)
- Include instruction-specific content in error messages (1M in 18-4)
- Use actual data counts in error messages (2M in 18-3)

### Git Intelligence

**Commit pattern:** `feat: implement Story 18-5 Implement Experimentation Mode with code review fixes`
**Recent test count:** 4479 (growing by ~15-40 per story)
**Previous story (18-4):** Added 20 tests. This story should add ~16+ tests.
**Files per story:** Usually 4-8 modified files + sprint-status.yaml

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-18, Story 18.5]
- [Source: digital-archaeology-web/src/emulator/AssemblerBridge.ts — buildMemoryConstraintError (~L137), buildInstructionSetError (~L177), assemble() constraint checks (~L371-396)]
- [Source: digital-archaeology-web/src/emulator/types.ts — AssembleResult interface, AssemblerError interface]
- [Source: digital-archaeology-web/src/config/stageConfig.ts — getStageMemorySize(), findEarliestStageForInstruction()]
- [Source: digital-archaeology-web/src/state/types.ts — AppSettings interface, DEFAULT_SETTINGS, isValidSettings()]
- [Source: digital-archaeology-web/src/state/SettingsStorage.ts — getSetting(), setSetting(), loadSettings()]
- [Source: digital-archaeology-web/src/ui/Toolbar.ts — ToolbarState, ToolbarCallbacks, button creation pattern]
- [Source: digital-archaeology-web/src/ui/App.ts — assemblerBridge wiring (~L2485), stage switching (~L792)]
- [Source: digital-archaeology-web/src/styles/main.css — toolbar button styles, theme CSS variables]
- [Source: _bmad-output/implementation-artifacts/18-4-create-educational-error-messages.md — Previous story patterns and code review lessons]
- [Source: _bmad-output/project-context.md — Naming conventions, XSS rules, testing standards, CSS/theming rules]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- All 4,503 tests pass across 106 test files (zero regressions)

### Completion Notes List

- Tasks 1-3 implemented in prior session; Tasks 4-7 implemented in continuation session
- v2→v3 settings migration chains correctly from v1→v2→v3
- Toggle button uses createElement per anti-pattern guidance (not innerHTML)
- CSS uses color-mix with --da-accent for theme compatibility

### File List

- `digital-archaeology-web/src/state/types.ts` — Added experimentationMode to AppSettings, DEFAULT_SETTINGS v3, isValidSettings check
- `digital-archaeology-web/src/state/SettingsStorage.ts` — Added v2→v3 migration chain for experimentationMode
- `digital-archaeology-web/src/state/SettingsStorage.test.ts` — 6 new tests: default value, valid/invalid, migration v2→v3, persistence
- `digital-archaeology-web/src/emulator/types.ts` — Added assembledInExperimentationMode to AssembleResult
- `digital-archaeology-web/src/emulator/AssemblerBridge.ts` — Added experimentationMode property, setExperimentationMode(), bypass guards
- `digital-archaeology-web/src/emulator/AssemblerBridge.test.ts` — 8 new tests: memory bypass ON/OFF, instruction bypass ON/OFF, result flag, toggle
- `digital-archaeology-web/src/ui/Toolbar.ts` — Added isExperimentationMode to ToolbarState, toggle button via createElement, state updates
- `digital-archaeology-web/src/ui/Toolbar.test.ts` — 11 new tests: render, CSS classes, aria-pressed, tooltips, click callback, default state
- `digital-archaeology-web/src/ui/App.ts` — Wired toggle handler, settings persistence, bridge sync, status bar annotation, saveSettings v3
- `digital-archaeology-web/src/ui/App.test.ts` — Added setExperimentationMode mock to MockAssemblerBridge
- `digital-archaeology-web/src/styles/main.css` — Added .da-experimentation-toggle base and --active styles
