# Story 10.25: Add E2E Test Infrastructure

Status: ready-for-dev

## Story

As a developer,
I want E2E tests running in CI and covering critical persistence/story workflows,
so that regressions in browser-level behavior (file API, IndexedDB, beforeunload, story navigation) are caught before deployment.

## Acceptance Criteria

1. **Given** a push to `main` or a pull request targeting `main`, **When** the CI pipeline runs, **Then** Playwright E2E tests execute after unit tests and before the production build, and a failure blocks deployment.

2. **Given** the existing 150 E2E tests across 10 spec files, **When** the `test-e2e` CI job runs, **Then** all existing tests pass in headless Chromium with 2 retries, and a minimum E2E test count check prevents silent test deletion.

3. **Given** the Epic 9 persistence gap (zero E2E coverage for save/restore/export/import/unsaved-work), **When** a new `epic-9-persistence.spec.ts` E2E test file is created, **Then** it covers these 5 P0 scenarios:
   - E2E-007: Save work → Refresh page → Restore session (IndexedDB round-trip)
   - E2E-008: Export .asm → Import → Verify identical content (File API round-trip)
   - E2E-009: Unsaved work → Navigate away → Confirm dialog blocks (beforeunload)
   - Auto-save triggers after code edit (2-second debounce)
   - File menu keyboard shortcuts (Ctrl+S, Ctrl+N, Ctrl+O) work

4. **Given** the Epic 10 story mode has 30 E2E tests but missing discoverer experience coverage, **When** a discoverer experience E2E test is added, **Then** it validates: first-time user sees discoverer intro, returning user skips to story, discoverer completes and transitions to story mode.

5. **Given** the current Playwright config only has Chromium, **When** a Firefox project is added to `playwright.config.ts`, **Then** E2E tests run against both Chromium and Firefox in CI.

## Tasks / Subtasks

- [ ] Task 1: Add E2E Job to CI Pipeline (AC: #1, #2)
  - [ ] 1.1 Add `test-e2e` job to `.github/workflows/ci.yml` after `test`, before `build`
    - Needs: `build-wasm` artifacts (WASM modules for emulator/assembler)
    - Needs: Node.js 20, `npm ci`, Playwright browser install
    - Run: `npx playwright test --retries=2`
    - Upload: `playwright-report/` and `test-results/` as CI artifacts on failure
  - [ ] 1.2 Add E2E test count verification step (minimum 150, matching unit test count check pattern)
  - [ ] 1.3 Wire `build` job dependency: `needs: [build-wasm, test, test-e2e]`
  - [ ] 1.4 Verify CI passes end-to-end on a test branch before merging

- [ ] Task 2: Add Firefox Browser Project (AC: #5)
  - [ ] 2.1 Add `firefox` project to `playwright.config.ts` projects array
  - [ ] 2.2 Ensure `npx playwright install --with-deps chromium firefox` in CI
  - [ ] 2.3 Verify all 150 existing tests pass in Firefox (fix any browser-specific failures)

- [ ] Task 3: Create Epic 9 Persistence E2E Tests (AC: #3)
  - [ ] 3.1 Create `tests/e2e/epic-9-persistence.spec.ts`
  - [ ] 3.2 E2E-007: Save/Restore round-trip
    - Edit code in Monaco → wait for auto-save (2s debounce) → reload page → verify code restored
    - Verify project name restored in title
  - [ ] 3.3 E2E-008: Export/Import round-trip
    - Write code → Assemble → Export .asm via File menu → Import .asm → verify content matches
    - Use Playwright's `page.on('download')` for file capture
  - [ ] 3.4 E2E-009: Unsaved work warning
    - Edit code → attempt navigation → verify `beforeunload` dialog appears
    - Use `page.on('dialog')` to capture and verify
  - [ ] 3.5 Auto-save debounce test
    - Edit code → verify no save before 2s → verify save after 2s elapsed
  - [ ] 3.6 File menu keyboard shortcuts
    - Test Ctrl+S (save), Ctrl+N (new), Ctrl+O (open) trigger correct actions

- [ ] Task 4: Add Discoverer Experience E2E Tests (AC: #4)
  - [ ] 4.1 Add discoverer tests to `tests/e2e/epic-10-story-mode.spec.ts` or create separate file
  - [ ] 4.2 First-time user flow: Clear localStorage → enter story mode → verify `.da-discoverer-experience` renders → progress through phases → verify story begins
  - [ ] 4.3 Returning user flow: Set `discoverer_intro_complete` in localStorage → enter story mode → verify story starts immediately (no discoverer)
  - [ ] 4.4 Discoverer-to-story transition: Complete discoverer → verify story mode loads with scene content

- [ ] Task 5: Verify and Document (AC: all)
  - [ ] 5.1 Run full E2E suite locally in both Chromium and Firefox
  - [ ] 5.2 Verify CI pipeline passes on test branch
  - [ ] 5.3 Update Playwright config comments for multi-browser support
  - [ ] 5.4 Verify E2E test count ≥ 160 (150 existing + ~10 new)

## Dev Notes

### Critical Context: Why This Story Exists

This story is a **HIGH PRIORITY action item from the Epic 9 retrospective** (2026-02-05). Key findings:
- 3,876 unit tests but E2E tests are NOT running in CI
- Epic 9 persistence features (save/restore/export/import/beforeunload) have ZERO E2E coverage
- JSDOM workarounds masked real browser behavior — unit tests passed but real File API, IndexedDB, and beforeunload behave differently
- Team agreement: "E2E testing is mandatory for all stories, effective immediately"

[Source: _bmad-output/implementation-artifacts/epic-9-retro-2026-02-05.md#Action Items]

### Existing E2E Infrastructure — DO NOT RECREATE

Playwright is already fully configured. The infrastructure exists and works locally:

| Component | Status | Location |
|-----------|--------|----------|
| Playwright config | Complete | `playwright.config.ts` |
| 10 E2E spec files | 150 tests | `tests/e2e/*.spec.ts` |
| Fixtures | Minimal but extensible | `tests/support/fixtures/index.ts` |
| Factories | Implemented (Faker) | `tests/support/factories/test-data.factory.ts` |
| Helpers | Implemented (waitFor/retry) | `tests/support/helpers/wait-for.ts` |
| npm scripts | Complete | `test:e2e`, `test:e2e:headed`, `test:e2e:debug`, `test:e2e:report` |

**What's MISSING:** CI integration job, Firefox browser, persistence E2E tests, discoverer E2E tests.

[Source: digital-archaeology-web/playwright.config.ts]
[Source: digital-archaeology-web/package.json]

### CI Pipeline Architecture

Current pipeline has 4 jobs: `build-wasm` → `test` → `build` → `deploy`

The new `test-e2e` job slots between `test` and `build`:

```
build-wasm → test (unit) → test-e2e (playwright) → build → deploy
                              ↑
                              NEW JOB
```

The `test-e2e` job MUST:
1. Download WASM artifacts (assembler + CPU emulator needed for code/run workflows)
2. Install Node.js 20 + `npm ci`
3. Install Playwright browsers: `npx playwright install --with-deps chromium firefox`
4. Run: `npx playwright test`
5. Upload failure artifacts (playwright-report/, test-results/) for debugging
6. Add E2E test count check (≥ 150), matching the unit test count pattern in the `test` job

The `build` job dependency changes from `needs: [build-wasm, test]` to `needs: [build-wasm, test, test-e2e]`.

[Source: .github/workflows/ci.yml]

### Playwright Config Changes

Current config: Chromium only, `@playwright/test@^1.57.0`

Add Firefox project:
```typescript
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
],
```

Config already has CI-optimized settings: `forbidOnly: !!process.env.CI`, `retries: CI ? 2 : 0`, `workers: CI ? 1 : undefined`, `reuseExistingServer: !process.env.CI`.

The `webServer` block starts `npm run dev` automatically — this works in CI because the Vite dev server starts against the built WASM artifacts.

[Source: digital-archaeology-web/playwright.config.ts]

### Persistence E2E Test Patterns

**IndexedDB round-trip (E2E-007):**
```typescript
// Write code → wait for auto-save → reload → verify restored
await page.locator('.da-monaco-editor').click();
await page.keyboard.type('LDI 5\nADD 3\nHLT');
await page.waitForTimeout(2500); // Auto-save debounce is 2s
await page.reload();
await page.waitForSelector('.da-monaco-editor');
// Verify code was restored
```

**File export/import (E2E-008):**
```typescript
// Use Playwright download capture
const [download] = await Promise.all([
  page.waitForEvent('download'),
  page.click('[data-action="export-asm"]'), // or File menu → Export
]);
const content = await download.suggestedFilename();
// Then import and verify
```

**beforeunload (E2E-009):**
```typescript
page.on('dialog', dialog => dialog.dismiss()); // Block navigation
await page.locator('.da-monaco-editor').click();
await page.keyboard.type('unsaved change');
// Attempt to navigate away — dialog should fire
```

**Important:** The existing `ProjectStorage` class (from Story 9.2) uses IndexedDB with a 2-second auto-save debounce. The `confirmUnsavedChanges()` helper (from Story 9.7) wraps `window.confirm()`. File export uses `URL.createObjectURL()` + `<a>` click pattern (Stories 9.4-9.6).

[Source: _bmad-output/implementation-artifacts/epic-9-retro-2026-02-05.md#What Went Wrong]

### Discoverer Experience E2E Test Patterns

The discoverer experience is controlled by `DISCOVERER_COMPLETE_KEY = 'discoverer_intro_complete'` in localStorage.

**First-time user:**
```typescript
await page.evaluate(() => localStorage.clear());
// Enter story mode → verify .da-discoverer-experience appears
```

**Returning user:**
```typescript
await page.evaluate(() => localStorage.setItem('discoverer_intro_complete', 'true'));
// Enter story mode → verify story starts directly (no discoverer)
```

The discoverer UI renders with class `.da-discoverer-experience` and has 6 phases: intro → constraint → decision → build → consequence → celebration. The celebration phase has a "Begin Your Journey" button that transitions to story mode.

[Source: digital-archaeology-web/src/story/DiscovererExperience.ts]
[Source: digital-archaeology-web/src/story/StoryStorage.ts]

### Selector Conventions for E2E Tests

Existing E2E tests use these patterns consistently:

- **Data attributes for actions:** `[data-action="assemble"]`, `[data-action="run"]`, `[data-action="step"]`
- **Data attributes for state sections:** `[data-section="cursor"]`, `[data-section="assembly"]`
- **Data attributes for registers/flags:** `[data-register="pc"]`, `[data-flag="zero"]`
- **Data attributes for modes:** `[data-mode="story"]`, `[data-mode="lab"]`
- **CSS classes for components:** `.da-toolbar`, `.da-menubar`, `.da-monaco-editor`, `.da-story-mode-container`

New tests MUST follow these same selector patterns. Never use fragile selectors like `div > span:nth-child(3)`.

[Source: tests/e2e/epic-1-foundation.spec.ts through epic-10-story-mode.spec.ts]

### Test Naming Convention

All E2E tests follow this naming pattern:
```typescript
describe('Epic N: Epic Title', () => {
  describe('Story N.M: Story Title', () => {
    test('[N.M] should do something specific', async ({ page }) => {
```

New tests for Epic 9 persistence should use: `[9.X]` prefix.
New tests for discoverer experience should use: `[10.23]` prefix.

### Previous Story Learnings (10-24)

Story 10-24 was a content-only fix (JSON data). Key learning: **Manual E2E story playthroughs found bugs that unit tests couldn't catch** — the Babbage-in-35000-BC anachronism was only visible when navigating the actual story UI. This reinforces why E2E tests for story mode are critical.

[Source: _bmad-output/implementation-artifacts/10-24-fix-act0-persona-timeline.md]

### P0 E2E Scenario Coverage Gap

From test-design-system.md, 12 P0 scenarios are defined. Current coverage: 5/12 (42%).

| ID | Scenario | Status |
|----|----------|--------|
| E2E-007 | Save → Refresh → Restore | **This story** |
| E2E-008 | Export → Import → Same content | **This story** |
| E2E-009 | Unsaved work blocks navigation | **This story** |
| E2E-005 | Circuit animates during step | Future |
| E2E-010 | Load example program | Future |
| E2E-011 | Zoom and pan circuit | Future |

[Source: _bmad-output/planning-artifacts/test-design-system.md]

### Anti-Patterns to Avoid

1. **DO NOT recreate Playwright infrastructure** — config, scripts, fixtures, factories, helpers all exist
2. **DO NOT modify existing E2E test files** unless fixing a browser-specific failure for Firefox
3. **DO NOT add Safari/WebKit** — too many Canvas API differences, not worth the CI time
4. **DO NOT add visual regression tests** (toHaveScreenshot) in this story — save for dedicated story
5. **DO NOT use `page.waitForTimeout()` as primary synchronization** — prefer `waitForSelector`, `waitForEvent`, or Playwright auto-waiting. Only use timeout for debounce verification.
6. **DO NOT hardcode `localhost:5173`** — the config already uses `process.env.BASE_URL || 'http://localhost:5173'`

### Project Structure Notes

- All E2E tests: `digital-archaeology-web/tests/e2e/*.spec.ts`
- All support files: `digital-archaeology-web/tests/support/`
- CI config: `.github/workflows/ci.yml`
- Playwright config: `digital-archaeology-web/playwright.config.ts`
- No new directories needed — all files go in existing locations

### References

- [Source: .github/workflows/ci.yml] — Current CI pipeline (4 jobs, no E2E)
- [Source: digital-archaeology-web/playwright.config.ts] — Playwright configuration
- [Source: digital-archaeology-web/package.json] — E2E npm scripts, Playwright ^1.57.0
- [Source: _bmad-output/implementation-artifacts/epic-9-retro-2026-02-05.md#Action Items] — E2E as HIGH priority action item
- [Source: _bmad-output/planning-artifacts/test-design-system.md] — P0 E2E scenarios, test pyramid
- [Source: digital-archaeology-web/tests/e2e/] — 10 existing E2E spec files, 150 tests
- [Source: digital-archaeology-web/tests/support/] — Fixtures, factories, helpers
- [Source: digital-archaeology-web/src/story/DiscovererExperience.ts] — Discoverer component for E2E testing
- [Source: digital-archaeology-web/src/story/StoryStorage.ts] — DISCOVERER_COMPLETE_KEY for localStorage control

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

### Completion Notes List

### File List

- `.github/workflows/ci.yml` (MODIFIED) — Add test-e2e job
- `digital-archaeology-web/playwright.config.ts` (MODIFIED) — Add Firefox project
- `digital-archaeology-web/tests/e2e/epic-9-persistence.spec.ts` (NEW) — Persistence E2E tests
- `digital-archaeology-web/tests/e2e/epic-10-story-mode.spec.ts` (MODIFIED) — Add discoverer E2E tests
