# Story 11.5: Implement Stage-Specific Circuit Loading

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want circuit data loaded per CPU stage when switching stages,
So that each stage shows its correct circuit visualization with appropriate zoom, layout, and state mapping.

## Acceptance Criteria

1. **Given** I switch stages **When** I view the circuit panel **Then** the circuit for the new stage is displayed (loaded from the stage's config path)
2. **Given** I switch stages **When** the circuit JSON is loaded **Then** the visualizer resets zoom to fit and resets pan to origin
3. **Given** I switch to a stage with `circuit.path: null` **When** the circuit panel is visible **Then** a "No circuit available" empty-state message is displayed instead of a blank canvas
4. **Given** a new circuit is loaded after stage switch **When** CPU state exists **Then** the CPUCircuitBridge maps state using the correct wire names for the current stage's circuit
5. **Given** I switch stages **When** the circuit loads successfully **Then** the SignalValuesPanel is updated and the BreadcrumbNav resets to root level
6. **Given** a circuit load fails (network error, invalid JSON) **When** the error occurs **Then** the error is handled gracefully — circuit panel shows empty state, app remains functional
7. **Given** I switch from a stage with a circuit to a stage without one **When** the switch completes **Then** the previous circuit is fully cleared (model, bridge cache, loaded flag)

## Tasks / Subtasks

- [x] Task 1: Add zoom/pan reset to `loadCircuitAndInitializeBridge()` (AC: #2, #5)
  - [x] 1.1: Call `this.circuitRenderer.resetZoom()` after successful `loadCircuit()` call
  - [x] 1.2: Reset BreadcrumbNav to root `[{ id: 'cpu', label: 'CPU', level: 0 }]` after circuit load
  - [x] 1.3: Unit tests for zoom reset on circuit reload (3 tests)

- [x] Task 2: Implement "No circuit available" empty state in circuit panel (AC: #3, #7)
  - [x] 2.1: Create `showCircuitEmptyState(stageName: string)` method in App.ts
  - [x] 2.2: Create/show overlay div with message "No circuit available for {stage}" in circuit panel content
  - [x] 2.3: Create `hideCircuitEmptyState()` method to remove overlay when circuit loads
  - [x] 2.4: Call `showCircuitEmptyState()` in `loadCircuitAndInitializeBridge()` when `circuitPath` is null
  - [x] 2.5: Call `hideCircuitEmptyState()` when circuit loads successfully
  - [x] 2.6: Style empty state with existing `--da-*` CSS variables
  - [x] 2.7: Unit tests for empty state show/hide lifecycle (4 tests)

- [x] Task 3: Add stage-aware CPUCircuitBridge mapping (AC: #4)
  - [x] 3.1: Refactor `CPUCircuitBridge` to accept a `stage` parameter in `mapStateToCircuit()` or constructor
  - [x] 3.2: Extract current Micro4 wire names and opcodes as stage-specific mapping config
  - [x] 3.3: For stages without a mapping (Micro8, Micro16, etc.), use a generic pass-through that sets wire states from `CircuitModel` wire names matching `CPUState` field names
  - [x] 3.4: Clear and rebuild wire name cache when stage changes
  - [x] 3.5: Unit tests for stage-aware bridge (5 tests): Micro4 mapping preserved, unknown stage falls back, cache cleared on stage change

- [x] Task 4: Harden `performStageSwitch()` circuit handling (AC: #1, #6, #7)
  - [x] 4.1: Add `circuitRenderer.resetZoom()` before loading new circuit in `performStageSwitch()` (via Task 1)
  - [x] 4.2: Clear highlighted gates and clicked gate state before circuit reload (via Task 1)
  - [x] 4.3: Add empty-state handling — show "No circuit" message when new stage has null circuit path (via Task 2)
  - [x] 4.4: Ensure `signalValuesPanel.update()` is called (or panel cleared) after circuit reload (already in loadCircuitAndInitializeBridge)
  - [x] 4.5: Unit tests for stage switch circuit lifecycle (7 tests): zoom reset, highlight clear, breadcrumb reset, null-path show/hide, no-renderer guard, error recovery

- [x] Task 5: Update unit tests for circuit loading changes (AC: all)
  - [x] 5.1: App.test.ts — test `loadCircuitAndInitializeBridge()` calls `resetZoom()` after load
  - [x] 5.2: App.test.ts — test empty state shown when stage has null circuit path
  - [x] 5.3: App.test.ts — test empty state hidden when circuit loads successfully
  - [x] 5.4: App.test.ts — test BreadcrumbNav reset on circuit reload
  - [x] 5.5: CPUCircuitBridge.test.ts — test stage-aware mapping (5 tests)
  - [x] 5.6: All existing circuit tests continue passing (4,162 total, 0 regressions)

- [x] Task 6: E2E tests for circuit loading on stage switch (AC: #1, #2, #3)
  - [x] 6.1: Test circuit panel has canvas element on initial load (Micro4)
  - [x] 6.2: Test that reselecting current stage retains circuit panel canvas
  - [x] 6.3: Tests added to `epic-11-stage-switching.spec.ts` Story 11.5 section (4/4 pass: 2 chromium + 2 firefox)
  - [x] 6.4: Note: Full circuit swap E2E only testable when additional stage circuits exist

- [x] Task 7: Update story file and sprint status (AC: all)
  - [x] 7.1: Mark all tasks complete
  - [x] 7.2: Update sprint-status.yaml: `11-5` → `in-progress` → `review`
  - [x] 7.3: Fill in Dev Agent Record section

## Dev Notes

### Architecture: Circuit Reload with Zoom Reset

The circuit loading flow already exists from Story 6.13 and was extended in Story 11.3 (CR M-3). The key gap is **zoom/pan reset** and **empty state** handling.

**Current flow in `performStageSwitch()` (App.ts:752-760):**
```typescript
if (this.circuitRenderer) {
  this.circuitLoaded = false;
  if (this.cpuCircuitBridge) {
    this.cpuCircuitBridge.clearCache();
    this.cpuCircuitBridge = null;
  }
  await this.loadCircuitAndInitializeBridge();
}
```

**Required additions:**
```typescript
// Before reloading: clear visual state
this.circuitRenderer.clearHighlightedGates();
this.circuitRenderer.clearClickedGate();

// After successful load: reset viewport
this.circuitRenderer.resetZoom(); // or zoomToFit() if preferred
this.breadcrumbNav?.resetPath([{ id: 'cpu', label: 'CPU', level: 0 }]);
```

### CRITICAL: What NOT to do

- **DO NOT** create a new `CircuitRenderer` instance on stage switch. The existing mount/updateState lifecycle handles circuit changes via `loadCircuit()`.
- **DO NOT** use `innerHTML` for the empty state message — use `createElement` + `textContent`.
- **DO NOT** break the existing `reloadCircuit()` or `reloadCircuitWithData()` methods (Story 7.5/7.6). These are separate pathways.
- **DO NOT** add Micro8/Micro16 wire mapping implementations yet — those stages don't have circuit JSON files. Use a generic fallback instead.
- **DO NOT** import Monaco or WASM-related modules into CPUCircuitBridge — it must remain a pure data mapper.

### Empty State Pattern

Follow the same `createElement` + `textContent` pattern used throughout the codebase:

```typescript
private showCircuitEmptyState(stageName: string): void {
  if (!this.circuitPanelContent) return;
  this.hideCircuitEmptyState(); // Remove any existing overlay

  const overlay = document.createElement('div');
  overlay.className = 'da-circuit-empty-state';
  overlay.setAttribute('data-testid', 'circuit-empty-state');

  const message = document.createElement('p');
  message.textContent = `No circuit available for ${stageName}`;
  overlay.appendChild(message);

  this.circuitPanelContent.appendChild(overlay);
  this.circuitEmptyStateElement = overlay;
}
```

### Stage-Aware Bridge Pattern

The `CPUCircuitBridge` currently hardcodes Micro4 wire names. For Story 11.5, make it stage-aware with a fallback:

```typescript
// In CPUCircuitBridge constructor or mapStateToCircuit:
// Use stage-specific mapping configs when available,
// fall back to generic name-matching for unknown stages.

const STAGE_WIRE_CONFIGS: Partial<Record<LabStage, WireMappingConfig>> = {
  micro4: { /* existing WIRE_NAMES and OPCODES */ },
  // micro8, micro16 etc. added when their circuits are created
};
```

The generic fallback matches `CPUState` field names (pc, accumulator, ir, etc.) to circuit wire names. This is safe because wire names in circuit JSON are standardized.

### Integration Points in App.ts

- **`loadCircuitAndInitializeBridge()`** (line 1593): Add `resetZoom()` after successful load, add empty state when path is null
- **`performStageSwitch()`** (line 752): Add highlight/click clear before reload, add empty state handling
- **`initializeCircuitRenderer()`** (line ~1515): Existing init — no changes needed
- **`destroyCircuitRenderer()`** (line ~1575): Existing cleanup — no changes needed

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/ui/App.ts` | Modify | Add zoom reset, empty state, highlight clear to circuit reload |
| `src/ui/App.test.ts` | Modify | Add circuit loading lifecycle tests |
| `src/visualizer/CPUCircuitBridge.ts` | Modify | Make stage-aware with generic fallback |
| `src/visualizer/CPUCircuitBridge.test.ts` | Modify | Add stage-aware bridge tests |
| `src/styles/main.css` | Modify | Add `.da-circuit-empty-state` styles |
| `tests/e2e/epic-11-stage-switching.spec.ts` | Modify | Add Story 11.5 E2E tests |

### Project Structure Notes

- All changes within existing feature folders (`src/ui/`, `src/visualizer/`, `src/styles/`)
- No new files needed — this story extends existing components
- Tests co-located as `*.test.ts` per project convention
- E2E tests in `tests/e2e/epic-11-stage-switching.spec.ts` Story 11.5 section

### Performance Requirements

- Circuit JSON fetch: < 2 seconds (already cached by browser for known files)
- Zoom reset: synchronous, < 1ms
- Circuit re-render after load: < 100ms (existing canvas render performance)
- Empty state show/hide: synchronous DOM operations

### Testing Strategy

**Unit Tests (Vitest):**
- Mock `CircuitRenderer` methods: `loadCircuit`, `resetZoom`, `clearHighlightedGates`, `clearClickedGate`, `getCircuitModel`
- Mock `BreadcrumbNav` methods: `resetPath` or equivalent
- Test zoom reset called after successful circuit load
- Test empty state DOM lifecycle (show/hide)
- Test CPUCircuitBridge stage-aware mapping
- Test cache clear on stage change

**E2E Tests (Playwright):**
- Test circuit panel canvas exists on initial Micro4 load
- Test circuit panel survives stage switch attempts (locked stages don't break it)
- Test circuit panel visible after story mode round-trip
- NOTE: Full circuit swap E2E only possible when Micro8/Micro16 circuits exist

### Previous Story Intelligence

**From Story 11.3 (Stage-Specific WASM Loading):**
- **Circuit reload already wired**: `performStageSwitch()` already calls `loadCircuitAndInitializeBridge()` at line 752-760 (CR M-3 fix)
- **Bridge cache clear**: `cpuCircuitBridge.clearCache()` already called before circuit reload
- **Error recovery pattern**: Stage switch catch block reverts `currentStage` and selector display on failure
- **Loading indicator**: Already shown via `statusBar.updateState({ loadStatus: ... })`

**From Story 11.4 (Stage-Specific Syntax Highlighting):**
- **`getLanguageIdForStage()` pattern**: Similar fallback-with-null pattern — use for circuit path lookup
- **LANGUAGE_IDS constant pattern**: Avoid circular imports by keeping stage-specific constants local
- **Monaco mock pattern**: `setModelLanguage: vi.fn()` added to mock — follow similar pattern for circuit renderer mock additions

**From Story 6.13 (Circuit-Emulator Integration):**
- **CPUCircuitBridge API**: `mapStateToCircuit(cpuState, circuitModel)` → `CircuitData`
- **Wire mapping**: `numberToBitArray(value, width)` utility for register values
- **`circuitLoaded` flag**: Guards all circuit operations — must be false during reload, true after success
- **`clearCache()`**: Clears wire name→ID map — must be called when switching circuits

**From Story 6.6/6.7 (Zoom/Pan Controls):**
- **`resetZoom()`**: Resets scale to 1.0 and pan offset to (0, 0)
- **`zoomToFit()`**: Auto-calculates scale to fit entire circuit in view — preferred for new circuit loads
- **Zoom display**: `getZoomDisplayPercent()` returns e.g. "100%" for status display

### Coding Standards Checklist

- [ ] Named exports only (no default exports)
- [ ] Handler binding in constructor where applicable
- [ ] Safe DOM: `createElement` + `textContent`, never `innerHTML`
- [ ] CSS variables: `--da-*` prefix only
- [ ] `null` over `undefined` for nullable values
- [ ] `SCREAMING_SNAKE_CASE` for constants
- [ ] `camelCase` for functions and variables
- [ ] `PascalCase` for types and interfaces
- [ ] Tests co-located as `*.test.ts`
- [ ] All worker message types in `SCREAMING_SNAKE_CASE`

### References

- [Source: src/ui/App.ts:752-760] — Current circuit reload in `performStageSwitch()`
- [Source: src/ui/App.ts:1593-1623] — `loadCircuitAndInitializeBridge()` method
- [Source: src/visualizer/CircuitRenderer.ts:944-951] — `loadCircuit()` method
- [Source: src/visualizer/CircuitRenderer.ts:1026-1031] — `resetZoom()` method
- [Source: src/visualizer/CircuitRenderer.ts:1037-1053] — `zoomToFit()` method
- [Source: src/visualizer/CPUCircuitBridge.ts] — Current Micro4-only bridge implementation
- [Source: src/config/stageConfig.ts:33-36] — `StageCircuitConfig` interface
- [Source: _bmad-output/implementation-artifacts/11-3-implement-stage-specific-wasm-loading.md] — Story 11.3 patterns (CR M-3 circuit reload)
- [Source: _bmad-output/implementation-artifacts/11-4-implement-stage-specific-syntax-highlighting.md] — Story 11.4 patterns
- [Source: _bmad-output/planning-artifacts/epics.md:2238-2252] — Epic 11.5 acceptance criteria

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- Story 11.5 implementation complete with all 7 tasks
- 14 new unit tests added (9 App.test.ts + 5 CPUCircuitBridge.test.ts)
- 2 new E2E tests added (circuit panel canvas on load, circuit retained on stage reselect)
- Fixed TypeScript error: removed unused `width` property from `GENERIC_STATE_FIELDS`
- 4,164 unit tests passing across 103 files (0 regressions)
- 4/4 Story 11.5 E2E tests pass (2 chromium + 2 firefox)
- 6 pre-existing E2E failures in Stories 11.2/11.3 (locked stage click tests, confirmed pre-existing)
- TypeScript compilation clean (1 pre-existing error in Editor.test.ts, not from Story 11.5)

### Code Review Fixes Applied

| ID | Severity | Fix | File |
|----|----------|-----|------|
| CR H-1 | High | Pass `this.currentStage` to `mapStateToCircuit()` — stage-aware bridge was dead code | `src/ui/App.ts:1692` |
| CR H-2 | High | Call `hideCircuitEmptyState()` in `destroyCircuitRenderer()` — prevent empty state overlay leak | `src/ui/App.ts:1580` |
| CR H-3 | High | Restore circuit for reverted stage in `performStageSwitch()` catch block | `src/ui/App.ts:797-808` |
| CR H-4 | High | Show empty state on load error; clear stale state when circuitPath is null | `src/ui/App.ts:1606-1612,1627-1631` |
| CR M-1 | Medium | Changed `stage?: string` to `stage?: LabStage` for type safety | `src/visualizer/CPUCircuitBridge.ts:119` |
| CR M-2 | Medium | Added alias support (`accumulator`→`acc`) via `GENERIC_STATE_MAPPINGS` | `src/visualizer/CPUCircuitBridge.ts:85-91` |
| CR M-3 | Medium | Updated stale JSDoc from "Micro4" to "stage-specific" | `src/ui/App.ts:1593` |
| CR L-1 | Low | Added `break` to prevent boolean double-write in generic mapping | `src/visualizer/CPUCircuitBridge.ts:195` |

### File List

| File | Action | Purpose |
|------|--------|---------|
| `src/ui/App.ts` | Modified | Added zoom reset, empty state, highlight clear, stage param pass, circuit restore on failure, empty state on error |
| `src/ui/App.test.ts` | Modified | Added 9 tests: circuit reload lifecycle (3) + empty state lifecycle (4) + CR H-3/H-4 fixes (2) |
| `src/visualizer/CPUCircuitBridge.ts` | Modified | Made stage-aware with `LabStage` type, alias mappings, boolean double-write fix |
| `src/visualizer/CPUCircuitBridge.test.ts` | Modified | Added 5 stage-aware bridge tests |
| `src/styles/main.css` | Modified | Added `.da-circuit-empty-state` styles |
| `tests/e2e/epic-11-stage-switching.spec.ts` | Modified | Added Story 11.5 section with 2 E2E tests |
| `_bmad-output/implementation-artifacts/sprint-status.yaml` | Modified | Updated 11-5 status to done |
