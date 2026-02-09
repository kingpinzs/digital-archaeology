# Story 11.3: Implement Stage-Specific WASM Loading

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want stage-specific WASM modules loaded when switching CPU stages,
So that each CPU stage uses its own emulator and assembler.

## Acceptance Criteria

1. **Given** I switch to a different stage **When** the stage loads **Then** the correct WASM emulator module is loaded for that stage
2. **Given** I switch to a different stage **When** the stage loads **Then** the correct WASM assembler module is loaded for that stage
3. **Given** I switch to a different stage **When** the stage loads **Then** the workers are reinitialized with the new stage's WASM modules
4. **Given** I switch stages **When** the previous stage's workers are terminated **Then** the previous WASM modules are cleaned up (browser handles via GC after worker termination)
5. **Given** I switch to a stage marked `ready: false` **When** the switch is attempted **Then** a user-friendly message is shown ("Coming Soon" or equivalent) and the switch is blocked
6. **Given** I am switching stages **When** the WASM modules are loading **Then** a loading indicator is shown and UI remains responsive
7. **Given** a WASM module fails to load **When** an error occurs during initialization **Then** a clear error message is shown and the app recovers gracefully (remains on current stage or shows error state)
8. **Given** I switch stages **When** the new stage loads **Then** CPU state (registers, memory, breakpoints) is reset for the new stage
9. **Given** I switch stages successfully **When** the new emulator and assembler are ready **Then** the app is fully functional for the new stage (assemble, run, step, debug all work)

## Tasks / Subtasks

- [x] Task 1: Add `reinit(stage)` method to `EmulatorBridge` (AC: #1, #3, #4)
  - [x] 1.1: Stop any running execution
  - [x] 1.2: Remove permanent message listener
  - [x] 1.3: Terminate existing worker
  - [x] 1.4: Reset `initialized`, `initPromise`, `isRunning` flags
  - [x] 1.5: Preserve subscriber sets (event subscriptions survive stage switch)
  - [x] 1.6: Call `init(stage)` to create new worker with new WASM
  - [x] 1.7: Unit tests for reinit lifecycle (7 tests)
- [x] Task 2: Add `reinit(stage)` method to `AssemblerBridge` (AC: #2, #3, #4)
  - [x] 2.1: Terminate existing worker
  - [x] 2.2: Reset `initialized`, `initPromise` flags
  - [x] 2.3: Call `init(stage)` to create new worker with new WASM
  - [x] 2.4: Unit tests for reinit lifecycle (5 tests)
- [x] Task 3: Update `App.handleStageChange()` to trigger WASM reloading (AC: #1-#9)
  - [x] 3.1: Check `isStageReady(stage)` — if false, show "Coming Soon" message and return
  - [x] 3.2: Show loading indicator
  - [x] 3.3: Call `emulatorBridge.reinit(stage)` and `assemblerBridge.reinit(stage)` (parallel)
  - [x] 3.4: Reset CPU state display (registers, flags, memory views)
  - [x] 3.5: Clear breakpoints
  - [x] 3.6: Clear state history (step-back history)
  - [x] 3.7: Update status bar with new stage info
  - [x] 3.8: Hide loading indicator (via statusBar.updateState)
  - [x] 3.9: Handle errors gracefully — catch failures, show error, revert to previous stage
- [x] Task 4: Add loading indicator UI for stage transitions (AC: #6)
  - [x] 4.1: Create inline loading state (via statusBar — not modal)
  - [x] 4.2: Double-click guard via isStageSwitching flag
  - [x] 4.3: Show stage name being loaded ("Loading {label}...")
  - [x] 4.4: Re-enable controls when loading completes or fails (finally block)
- [x] Task 5: Add "Coming Soon" handling for unready stages (AC: #5)
  - [x] 5.1: Check `isStageReady(stage)` in handleStageChange before proceeding
  - [x] 5.2: Show informative message with stage name (inline via statusBar)
  - [x] 5.3: Revert StageSelector display to current stage
- [x] Task 6: Unit tests (AC: all)
  - [x] 6.1: EmulatorBridge.reinit() — happy path, error path, concurrent calls (7 tests)
  - [x] 6.2: AssemblerBridge.reinit() — happy path, error path (5 tests)
  - [x] 6.3: App.handleStageChange() — Coming Soon, same-stage guard, double-click guard, loading indicator, error recovery, state reset, parallel reinit, isStageSwitching flag (13 tests)
  - [x] 6.4: Loading state management (tested in App tests)
  - [x] 6.5: Subscriber preservation across reinit (tested in EmulatorBridge tests)
- [x] Task 7: E2E tests (AC: #1-#9)
  - [x] 7.1: Stage selector UI renders with all stages (6 tests)
  - [x] 7.2: Locked stages show lock icon, cannot be selected (2 tests)
  - [x] 7.3: No JavaScript errors during stage selector interactions (2 tests)
  - Note: Full WASM reload E2E only testable when additional stages become ready

## Dev Notes

### Architecture: Bridge Reinit Pattern

The key architectural decision is **adding `reinit(stage)` to both bridges** rather than creating new bridge instances. This preserves event subscriptions (UI components that subscribe to `onStateUpdate`, `onHalted`, etc.) across stage switches.

**Pattern:**
```typescript
// EmulatorBridge.reinit(stage)
async reinit(stage: LabStage): Promise<void> {
  // 1. Stop execution if running
  if (this.isRunning && this.worker) {
    this.isRunning = false;
    this.worker.postMessage({ type: 'STOP' });
  }
  // 2. Remove permanent listener
  if (this.worker && this.boundMessageHandler) {
    this.worker.removeEventListener('message', this.boundMessageHandler);
    this.boundMessageHandler = null;
  }
  // 3. Terminate worker (cleans up WASM via GC)
  this.worker?.terminate();
  this.worker = null;
  // 4. Reset flags (but NOT subscriber sets)
  this.initialized = false;
  this.initPromise = null;
  this.isRunning = false;
  // 5. Init with new stage
  await this.init(stage);
}
```

### CRITICAL: What NOT to do

- **DO NOT** create new EmulatorBridge/AssemblerBridge instances on stage switch. This would lose all event subscriptions from UI components (RegisterView, FlagsView, MemoryView, etc.).
- **DO NOT** try to reuse the existing worker with a new WASM module. Workers must be terminated and recreated because the WASM module is loaded once per worker lifecycle.
- **DO NOT** use `innerHTML` for any loading state UI — always `document.createElement` + `textContent`.
- **DO NOT** block the main thread during WASM loading — the bridge pattern already handles this via Web Workers.
- **DO NOT** hardcode WASM paths — always use `getStageConfig(stage).wasm.*` from `src/config/stageConfig.ts`.

### Integration Points in App.ts

**Current `handleStageChange()` at line 649:**
```typescript
private handleStageChange(stage: LabStage): void {
  this.currentStage = stage;
  const config = getStageConfig(stage);
  console.log(`Stage changed to ${config.meta.label} (${stage}), ready: ${config.ready}`);
  this.menuBar?.getStageSelector()?.setStage(stage);
  this.saveSettings();
}
```

**Must become async and add:**
1. `isStageReady()` guard with "Coming Soon" handling
2. Loading indicator show/hide
3. `this.emulatorBridge.reinit(stage)` + `this.assemblerBridge.reinit(stage)` (parallel via `Promise.all`)
4. State reset (CPU display, breakpoints, history)
5. Error handling with revert to previous stage

### State Reset on Stage Switch

When switching stages, clear:
- CPU state display (registers, flags, memory) — reset views
- Breakpoints — clear all (new stage has different address space)
- State history (`stateHistory` array for step-back) — clear
- Error panel — clear any displayed errors
- Binary output panel — clear
- Editor content — preserve (user may want to keep code) but warn if incompatible

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/emulator/EmulatorBridge.ts` | Modify | Add `reinit(stage)` method |
| `src/emulator/AssemblerBridge.ts` | Modify | Add `reinit(stage)` method |
| `src/ui/App.ts` | Modify | Update `handleStageChange()` to async with WASM reload |
| `src/emulator/EmulatorBridge.test.ts` | Modify | Add reinit tests |
| `src/emulator/AssemblerBridge.test.ts` | Modify | Add reinit tests |
| `src/ui/App.test.ts` | Modify | Add stage switch integration tests |

### Project Structure Notes

- All changes within existing feature folders (`src/emulator/`, `src/ui/`)
- No new files needed — this story extends existing bridges and App
- Tests co-located as `*.test.ts` per project convention
- CSS for loading indicator can go in existing `src/styles/main.css` if needed

### Performance Requirements

- WASM init timeout: 30 seconds (existing `INIT_TIMEOUT_MS`)
- Stage switch perceived time: < 2 seconds for cached WASM, < 5 seconds cold
- UI must remain responsive during switch (non-blocking — already handled by worker pattern)
- Parallel bridge init: `Promise.all([emulatorBridge.reinit(), assemblerBridge.reinit()])` for faster switch

### Testing Strategy

**Unit Tests (Vitest):**
- Mock workers using Vitest's module mocking
- Test reinit lifecycle: terminate → reset → init flow
- Test subscriber preservation across reinit
- Test error paths: WASM load failure, timeout, unready stage
- Test concurrent reinit calls (should await, not create race conditions)

**E2E Tests (Playwright):**
- Only testable with Micro4 (only ready stage currently)
- Test: switch away and back to Micro4, verify full functionality
- Test: attempt switch to unready stage (Micro8), verify "Coming Soon"
- Test: loading indicator appears during switch

### References

- [Source: src/config/stageConfig.ts] — Stage configuration registry, `getStageConfig()`, `isStageReady()`
- [Source: src/emulator/EmulatorBridge.ts] — Current bridge with `init()`, `terminate()`, `ensureInitialized()`
- [Source: src/emulator/AssemblerBridge.ts] — Current bridge with `init()`, `terminate()`
- [Source: src/emulator/types.ts] — `InitWasmCommand`, `InitAssemblerWasmCommand`, `EmulatorCommand`, `EmulatorEvent`
- [Source: src/emulator/emulator.worker.ts] — Worker INIT_WASM handler
- [Source: src/emulator/assembler.worker.ts] — Worker INIT_WASM handler
- [Source: src/ui/App.ts:649] — Current `handleStageChange()` method
- [Source: _bmad-output/implementation-artifacts/11-2-implement-stage-configuration-system.md] — Story 11.2 patterns and learnings
- [Source: _bmad-output/implementation-artifacts/11-1-create-stage-selector-ui.md] — Story 11.1 patterns and learnings
- [Source: _bmad-output/planning-artifacts/architecture.md] — Architecture constraints

### Previous Story Intelligence

**From Story 11.2 (Stage Configuration System):**
- **INIT_WASM protocol** is already implemented in both workers — bridges send `{ type: 'INIT_WASM', payload: { wasmJsPath } }` and workers respond with `EMULATOR_READY` / `WORKER_READY`
- **Config validation** pattern: check `config.wasm.emulatorJs` is not null before sending to worker
- **Retry support**: `initPromise` is cleared on failure so `init()` can be called again
- **Code review fix M-4**: Clear `initPromise` on rejection — already implemented, reinit must follow same pattern
- Worker creation uses Vite URL syntax: `new Worker(new URL('./emulator.worker.ts', import.meta.url), { type: 'module' })`

**From Story 11.1 (Stage Selector UI):**
- **Handler binding pattern**: Bind handlers in constructor, not in render methods
- **Settings migration**: v1→v2 already adds `currentStage` and `unlockedStages` to AppSettings
- `App.handleStageChange()` callback is wired via `MenuBar` → `StageSelector` → `onStageChange`
- StageSelector has `setStage()` for programmatic state sync

### Coding Standards Checklist

- [x] Named exports only (no default exports)
- [x] Handler binding in constructor where applicable
- [x] Safe DOM: `createElement` + `textContent`, never `innerHTML`
- [x] CSS variables: `--da-*` prefix only
- [x] `null` over `undefined` for nullable values
- [x] `SCREAMING_SNAKE_CASE` for constants
- [x] `camelCase` for functions and variables
- [x] `PascalCase` for types and interfaces
- [x] Tests co-located as `*.test.ts`
- [x] All worker message types in `SCREAMING_SNAKE_CASE`

### Code Review Fixes Applied

| ID | Severity | Fix | File |
|----|----------|-----|------|
| CR H-1 | High | Bridge revert on partial reinit failure | `src/ui/App.ts:772-785` |
| CR H-2 | High | Move `isStageSwitching` before async call | `src/ui/App.ts:669-676` |
| CR H-3 | High | Reset toolbar state after stage switch | `src/ui/App.ts:738-747` |
| CR H-4 | High | Clear editor highlight on stage switch | `src/ui/App.ts:717` |
| CR M-1 | Medium | TODO comment for hardcoded memory size | `src/ui/App.ts:730-732` |
| CR M-2 | Medium | (Fixed with H-1) Bridge revert in catch block | `src/ui/App.ts:772-785` |
| CR M-3 | Medium | Reload circuit on stage switch | `src/ui/App.ts:749-757` |
| CR M-4 | Medium | Added tests for all review fixes | `src/ui/App.test.ts` |

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- Story 11.3 implementation complete with all 7 tasks
- Code review found 4 High, 4 Medium issues — all fixed
- 4034 unit tests passing across 100 files (4 new tests for CR fixes)
- TypeScript compilation clean
- E2E tests limited to UI-level (full WASM reload E2E requires additional ready stages)

### File List

| File | Action | Purpose |
|------|--------|---------|
| `src/emulator/EmulatorBridge.ts` | Modified | Added `reinit(stage)` method |
| `src/emulator/AssemblerBridge.ts` | Modified | Added `reinit(stage)` method |
| `src/ui/App.ts` | Modified | Updated `handleStageChange()` and new `performStageSwitch()` with CR fixes |
| `src/emulator/EmulatorBridge.test.ts` | Modified | Added reinit tests (7 tests) |
| `src/emulator/AssemblerBridge.test.ts` | Modified | Added reinit tests (5 tests) |
| `src/ui/App.test.ts` | Modified | Added stage switch tests (17 tests) |
| `tests/e2e/epic-11-stage-switching.spec.ts` | Created | E2E tests for Epic 11 (10 tests) |
