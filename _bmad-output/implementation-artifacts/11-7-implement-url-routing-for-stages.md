# Story 11.7: Implement URL Routing for Stages

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want URLs to reflect the current stage and mode,
so that I can bookmark and share specific views of the Digital Archaeology application.

## Acceptance Criteria

1. **Given** I am using a stage **When** I look at the URL **Then** the URL includes the stage (e.g., `#/lab/micro4`, `#/lab/micro8`)
2. **Given** I navigate to a URL like `#/lab/micro8` **When** the page loads **Then** the app initializes with that stage selected
3. **Given** I switch stages via the Stage Selector **When** the stage changes **Then** the URL updates to reflect the new stage without a full page reload
4. **Given** I navigate to an invalid stage URL like `#/lab/invalid` **When** the page loads **Then** the app falls back to the default stage (micro4) and the URL is corrected
5. **Given** I am in Story Mode **When** I look at the URL **Then** the URL shows `#/story`
6. **Given** I switch between Story Mode and Lab Mode **When** the mode changes **Then** the URL updates accordingly
7. **Given** I use the browser Back/Forward buttons **When** navigating between previously visited stages **Then** the app correctly switches to the corresponding stage/mode
8. **Given** I load the app with no hash in the URL **When** the page loads **Then** the app loads with default settings from localStorage (backward compatible) and the URL is updated to reflect the current state

## Tasks / Subtasks

- [ ] Task 0: Create lightweight hash router module (AC: #1, #2, #4, #8)
  - [ ] 0.1: Create `src/router/hashRouter.ts` with `HashRouter` class
  - [ ] 0.2: Implement `parseHash()` — parse `#/mode/stage` format into `{ mode: ThemeMode, stage?: LabStage }`
  - [ ] 0.3: Implement `buildHash()` — construct hash from mode and stage
  - [ ] 0.4: Implement `start()` — listen to `hashchange` event, call route change callback
  - [ ] 0.5: Implement `stop()` — remove event listener (for cleanup/testing)
  - [ ] 0.6: Implement `navigate(mode, stage?)` — update hash via `window.location.hash` (pushes to history)
  - [ ] 0.7: Implement `replace(mode, stage?)` — update hash via `history.replaceState` (no history entry)
  - [ ] 0.8: Validate stage against `LAB_STAGES` array, fallback to `'micro4'` for invalid stages
  - [ ] 0.9: Validate mode against `'lab' | 'story'`, fallback to `'lab'` for invalid modes
  - [ ] 0.10: Export `RouteState` interface: `{ mode: ThemeMode; stage: LabStage }`

- [ ] Task 1: Create hash router unit tests (AC: #1, #2, #4)
  - [ ] 1.1: Create `src/router/hashRouter.test.ts`
  - [ ] 1.2: Test `parseHash()` with valid hashes: `#/lab/micro4`, `#/lab/micro8`, `#/story`
  - [ ] 1.3: Test `parseHash()` with invalid hashes: `#/lab/invalid`, `#/invalid`, `#/`, ``, `#/lab/MICRO4` (case sensitivity)
  - [ ] 1.4: Test `buildHash()` produces correct format
  - [ ] 1.5: Test `navigate()` updates `window.location.hash`
  - [ ] 1.6: Test `replace()` does NOT push history entry
  - [ ] 1.7: Test `start()`/`stop()` add/remove hashchange listener
  - [ ] 1.8: Test route change callback fires on hashchange
  - [ ] 1.9: Test fallback behavior for invalid stages/modes

- [ ] Task 2: Integrate router into App.ts initialization (AC: #2, #8)
  - [ ] 2.1: Import `HashRouter` in App.ts
  - [ ] 2.2: Create router instance in `mount()`, before `initializeSettings()`
  - [ ] 2.3: On mount, check if URL has a hash — if so, parse and use route state to override localStorage settings for mode and stage
  - [ ] 2.4: If no hash present (backward compat), use localStorage settings as before, then call `router.replace()` to set initial URL
  - [ ] 2.5: Register route change handler: `router.onRouteChange((route) => this.handleRouteChange(route))`

- [ ] Task 3: Implement `handleRouteChange()` in App.ts (AC: #3, #5, #6, #7)
  - [ ] 3.1: Add `private handleRouteChange(route: RouteState): void` method
  - [ ] 3.2: If `route.mode !== this.currentMode`, trigger mode switch via existing `handleModeChange()`
  - [ ] 3.3: If `route.stage !== this.currentStage` and mode is `'lab'`, trigger stage switch via existing `handleStageChange()`
  - [ ] 3.4: Guard against re-entrant URL updates (set `isRouteUpdating` flag to prevent navigate→hashchange→handleRouteChange loop)

- [ ] Task 4: Update existing stage/mode change handlers to push URL (AC: #3, #5, #6)
  - [ ] 4.1: In `handleStageChange()` (after successful stage switch), call `router.navigate('lab', newStage)` — but only if NOT triggered by router (check `isRouteUpdating` flag)
  - [ ] 4.2: In `handleModeChange()`, call `router.navigate(newMode, this.currentStage)` — but only if NOT triggered by router
  - [ ] 4.3: Ensure `performStageSwitch()` error revert also reverts URL (call `router.replace()` with previous stage)

- [ ] Task 5: Handle invalid URLs and edge cases (AC: #4, #8)
  - [ ] 5.1: If URL contains invalid stage, replace URL with fallback (`#/lab/micro4`) and show status bar message
  - [ ] 5.2: If URL contains locked stage (not in `unlockedStages`), replace URL with current stage and show "Coming Soon" status
  - [ ] 5.3: Handle `#/story` route — no stage in URL for story mode, set mode to story
  - [ ] 5.4: Handle empty hash `#/` or `#` — treat as no hash (backward compat)

- [ ] Task 6: Update Vite config for hash routing compatibility (AC: #1)
  - [ ] 6.1: Verify Vite dev server works with hash routes (should work out of the box — hash is client-side only)
  - [ ] 6.2: Verify GitHub Pages deployment works (hash routes don't hit server — no 404.html needed)
  - [ ] 6.3: No changes expected, but verify and document

- [ ] Task 7: Write E2E tests for URL routing (AC: #1, #2, #3, #4, #7)
  - [ ] 7.1: Add tests to `tests/e2e/epic-11-stage-switching.spec.ts` in new `Story 11.7` describe block
  - [ ] 7.2: Test: navigating to `#/lab/micro4` shows Micro4 stage in selector
  - [ ] 7.3: Test: URL updates when stage selector is used (re-select micro4)
  - [ ] 7.4: Test: navigating to invalid hash falls back to micro4
  - [ ] 7.5: Test: URL shows `#/story` when switching to Story Mode
  - [ ] 7.6: Test: browser back button navigates between previously visited URL states

- [ ] Task 8: Update App.test.ts with router integration tests (AC: #2, #3, #7)
  - [ ] 8.1: Test: App reads route from URL hash on mount
  - [ ] 8.2: Test: App falls back to localStorage when no hash present
  - [ ] 8.3: Test: Stage switch updates URL hash
  - [ ] 8.4: Test: Mode switch updates URL hash
  - [ ] 8.5: Test: Route change from hashchange triggers stage/mode switch
  - [ ] 8.6: Test: No re-entrant loop (stage change → URL update → hashchange → stage change)
  - [ ] 8.7: Test: Error revert during stage switch also reverts URL

## Dev Notes

### Architecture Decision: Hash-Based Routing

**Why hash routing (`#/lab/micro4`) over History API (`/lab/micro4`):**

1. **GitHub Pages compatibility** — The app deploys to GitHub Pages at `/digital-archaeology/`. GitHub Pages returns 404 for any path that doesn't match a real file. Hash routes are purely client-side — the server never sees them.
2. **No 404.html hack needed** — History API on GitHub Pages requires a [hacky 404.html redirect](https://github.com/rafgraph/spa-github-pages) that has SEO implications and browser inconsistencies.
3. **Zero server configuration** — Hash changes don't trigger server requests. Works identically in dev (`localhost:5173`) and production (`/digital-archaeology/`).
4. **Vite base path compatibility** — The existing `base: process.env.GITHUB_ACTIONS ? '/digital-archaeology/' : '/'` config works unchanged with hash routes.
5. **Vanilla JS simplicity** — No need for a routing library. A lightweight `HashRouter` class (~50 lines) handles everything.

**URL Format:**
- Lab Mode: `#/lab/micro4`, `#/lab/micro8`, `#/lab/micro16`, etc.
- Story Mode: `#/story`
- Default/empty: No hash → backward compatible, reads from localStorage, then sets hash

### Critical "What NOT to Do"

- **DO NOT use History API** (`pushState`/`replaceState` for path changes) — breaks GitHub Pages without server-side fallback
- **DO NOT install a routing library** (e.g., `navigo`, `page.js`) — overkill for hash-based stage/mode routing
- **DO NOT add `historyApiFallback` to Vite config** — hash routes don't need it
- **DO NOT modify `index.html`** or create `404.html` — hash routing avoids this entirely
- **DO NOT store route state redundantly** — URL hash IS the route state; localStorage is the persistence fallback for bookmarkless loads
- **DO NOT break existing `handleStageChange()` or `handleModeChange()`** — add URL updates as a side effect, not a replacement
- **DO NOT trigger stage/mode changes from both URL and user action simultaneously** — use an `isRouteUpdating` guard flag to prevent re-entrant loops
- **DO NOT encode lab station (explore/build/challenge) in URL yet** — keep scope focused on mode + stage only

### Re-entrancy Prevention Pattern

The biggest footgun with URL routing is the re-entrant loop:

```
User clicks stage → handleStageChange() → router.navigate() → hashchange event
→ handleRouteChange() → handleStageChange() → router.navigate() → ...
```

**Solution:** Use an `isRouteUpdating` boolean flag:
```typescript
private isRouteUpdating = false;

private handleRouteChange(route: RouteState): void {
  this.isRouteUpdating = true;
  try {
    // Apply mode/stage changes
  } finally {
    this.isRouteUpdating = false;
  }
}

// In handleStageChange / handleModeChange:
if (!this.isRouteUpdating) {
  this.router.navigate(mode, stage);
}
```

### Integration Points in App.ts

Current flow (no router):
```
mount() → initializeSettings() → loadFromLocalStorage → set mode/stage
```

New flow (with router):
```
mount() → initializeSettings() → checkUrlHash()
  → If hash exists: parse route, override mode/stage from URL
  → If no hash: use localStorage, then router.replace() to set URL
  → Start listening for hashchange events
```

Stage switch flow update:
```
handleStageChange(stage) →
  performStageSwitch(stage) →
    success: router.navigate('lab', stage)
    failure: router.replace('lab', previousStage)  // revert URL too
```

Mode switch flow update:
```
handleModeChange(mode) →
  applyModeVisibility() →
  router.navigate(mode, this.currentStage)
```

### Existing Patterns to Follow

- **File naming**: `src/router/hashRouter.ts` + `src/router/hashRouter.test.ts` (new directory)
- **Export pattern**: Named exports from module, re-export via `src/router/index.ts`
- **Test pattern**: Vitest with describe/it blocks, `beforeEach`/`afterEach` cleanup
- **Type imports**: `import type { LabStage } from '../config/stageConfig'` and `import type { ThemeMode } from '../ui/theme'`
- **DOM cleanup**: Always remove event listeners in `stop()` / `destroy()`
- **E2E test pattern**: Follow existing `epic-11-stage-switching.spec.ts` structure with `[11.7]` prefixed test names

### Project Structure Notes

New files to create:
```
src/router/
  hashRouter.ts       # HashRouter class + RouteState type
  hashRouter.test.ts  # Unit tests
  index.ts            # Re-exports
```

Files to modify:
```
src/ui/App.ts              # Router integration (mount, handleRouteChange, handleStageChange, handleModeChange)
src/ui/App.test.ts         # Router integration tests
tests/e2e/epic-11-stage-switching.spec.ts  # E2E tests for URL routing
```

Files that should NOT be modified:
```
vite.config.ts             # Hash routing needs no server config
index.html                 # No changes needed
src/config/stageConfig.ts  # Already has LAB_STAGES for validation
src/ui/StageSelector.ts    # URL routing is App-level, not selector-level
src/state/SettingsStorage.ts # localStorage remains as persistence fallback
```

### Testing Requirements

- **Unit tests**: `hashRouter.test.ts` — parse, build, navigate, replace, start/stop, fallback (~15-20 tests)
- **Integration tests**: `App.test.ts` additions — router init, route-driven stage/mode changes, re-entrancy guard, error revert (~8-10 tests)
- **E2E tests**: `epic-11-stage-switching.spec.ts` — URL navigation, back button, invalid URL, mode URLs (~5-6 tests)
- **Regression**: All existing 4,193 tests must pass (URL routing must not break any existing behavior)

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 11, Story 11.7]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — State Management: Simple Store Pattern, Persistence: localStorage + IndexedDB]
- [Source: `_bmad-output/implementation-artifacts/11-6-implement-stage-specific-examples.md` — Dev Notes, Code Review Fixes]
- [Source: `_bmad-output/implementation-artifacts/11-5-implement-stage-specific-circuit-loading.md` — Stage-aware bridge pattern, error revert pattern]
- [Source: `_bmad-output/implementation-artifacts/11-4-implement-stage-specific-syntax-highlighting.md` — Language registry pattern, performStageSwitch integration]
- [Source: `digital-archaeology-web/src/config/stageConfig.ts` — LabStage type, LAB_STAGES array, STAGE_CONFIGS registry]
- [Source: `digital-archaeology-web/src/ui/App.ts` — handleStageChange, handleModeChange, performStageSwitch, mount, initializeSettings]
- [Source: `digital-archaeology-web/src/ui/theme.ts` — ThemeMode type, setTheme, getTheme]
- [Source: `digital-archaeology-web/vite.config.ts` — base path config for GitHub Pages]
- [Source: GitHub Pages SPA routing limitations — https://github.com/orgs/community/discussions/64096]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

### Completion Notes List

- All 8 tasks completed: hash router module, unit tests, App.ts integration, handleRouteChange, URL pushing, edge cases, Vite verification, E2E tests, integration tests
- 4,229 unit tests pass (24 router + 12 integration + 4,193 existing), 0 regressions
- 12/12 E2E tests pass (6 Chromium + 6 Firefox)
- Hash routing works correctly with GitHub Pages (no server config needed)
- Re-entrancy prevention via `isRouteUpdating` flag works correctly
- URL normalization: invalid stages/modes corrected via replaceState
- Browser back/forward navigation works between mode changes
- Backward compatible: no-hash URLs fall back to localStorage settings

### Code Review Fixes

- **CR H-1**: `initializeFromRoute()` now checks `isStageReady()` and `unlockedStages.includes()` before setting stage from URL — prevents bypassing stage locking via URL
- **CR H-2**: `handleRouteChange()` now returns early if `isStageSwitching` is true — prevents race condition with async stage switches
- **CR H-3**: `HashRouter.start()` cleans up existing listener before attaching new one — prevents memory leak on double-call
- **CR M-1**: `HashRouter.stop()` now clears `this.callback` reference — prevents stale closures after destroy
- **CR M-3**: Added 3 missing unit tests: stage switch updates URL (Task 8.3), hashchange triggers stage handling (Task 8.5), error revert reverts URL (Task 8.7)
- **CR H-3/M-1 interaction**: `start()` preserves callback when cleaning up listener (does NOT call `stop()` which would clear callback)
- Added 2 new hashRouter tests: double-start protection, callback cleared on stop

### File List

**New files:**
- `src/router/hashRouter.ts` — HashRouter class, parseHash(), buildHash(), RouteState interface
- `src/router/hashRouter.test.ts` — 24 unit tests for router (22 original + 2 CR fixes)
- `src/router/index.ts` — Re-exports for router module

**Modified files:**
- `src/ui/App.ts` — Router integration: initializeFromRoute(), handleRouteChange(), URL push in handlers, router cleanup
- `src/ui/App.test.ts` — 12 new integration tests for URL routing (9 original + 3 CR fixes), hash cleanup in afterEach
- `tests/e2e/epic-11-stage-switching.spec.ts` — 6 new E2E tests for Story 11.7
