# Story 19.6: Create Statistics Dashboard

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to see my statistics,
so that I can reflect on my journey.

## Acceptance Criteria

1. **Given** I access the statistics dashboard **When** I view the summary section **Then** I see total programs assembled count, total instructions executed count, and total errors encountered count — all derived from a new `StatisticsStorage` that persists counters across sessions
2. **Given** I access the statistics dashboard **When** I view the progress section **Then** I see discoveries earned (X / 7), acts completed (X / 11), achievements earned (X / 16 with tier breakdown), and stages unlocked (X / 6)
3. **Given** I access the statistics dashboard **When** I view the time section **Then** I see total session time and time spent per stage (accumulated from stage-change events)
4. **Given** a stage is active in Lab Mode **When** I assemble, execute, or encounter errors **Then** the corresponding counters in `StatisticsStorage` are incremented and persisted
5. **Given** I am in Story Mode **When** I click a "Statistics" button in StoryNav **Then** the statistics dashboard opens as a full-screen modal following the AchievementGallery/JourneyMap pattern
6. **Given** the dashboard is open **When** I press Escape, click the backdrop, or click the close button **Then** the modal closes with an exit animation and focus is restored

## Tasks / Subtasks

- [x] Task 1: Define statistics types in `progress/types.ts` (AC: #1, #3)
  - [x] 1.1: Add `RuntimeStatistics` interface: `{ readonly programsAssembled: number; readonly instructionsExecuted: number; readonly errorsEncountered: number; readonly timePerStage: Readonly<Record<LabStage, number>>; readonly totalSessionTime: number; readonly version: number }`
  - [x] 1.2: Add `DEFAULT_RUNTIME_STATISTICS` constant with all zeroes
  - [x] 1.3: Add `isValidRuntimeStatistics(value: unknown)` type guard
  - [x] 1.4: Update barrel exports in `progress/index.ts`

- [x] Task 2: Create `StatisticsStorage` in `progress/StatisticsStorage.ts` (AC: #1, #3, #4)
  - [x] 2.1: Create `StatisticsStorage` class following `DiscoveryStorage` pattern — constructor with optional storage key (`'digital-archaeology-statistics'`), `loadStatistics()`, `saveStatistics()`, `getStatisticsOrDefault()`
  - [x] 2.2: Implement `incrementPrograms(): void` — loads, increments `programsAssembled`, saves
  - [x] 2.3: Implement `addInstructionsExecuted(count: number): void` — loads, adds to `instructionsExecuted`, saves
  - [x] 2.4: Implement `incrementErrors(): void` — loads, increments `errorsEncountered`, saves
  - [x] 2.5: Implement `addStageTime(stage: LabStage, milliseconds: number): void` — loads, adds to `timePerStage[stage]`, saves
  - [x] 2.6: Implement `addSessionTime(milliseconds: number): void` — loads, adds to `totalSessionTime`, saves

- [x] Task 3: Create `StatisticsCollector` in `progress/StatisticsCollector.ts` (AC: #2)
  - [x] 3.1: Create `StatisticsCollector` class — pure data aggregation service (no DOM), constructor takes `DiscoveryStorage`, `ActCompletionStorage`, `AchievementStorage`, `StatisticsStorage`, and `StageUnlockManager`
  - [x] 3.2: Implement `collect(): DashboardData` — reads from ALL storage classes and returns a single object:
    ```
    DashboardData {
      programsAssembled: number;
      instructionsExecuted: number;
      errorsEncountered: number;
      discoveriesEarned: number;
      discoveriesTotal: 7;
      actsCompleted: number;
      actsTotal: 11;
      achievementsEarned: number;
      achievementsTotal: 16;
      achievementsByTier: Record<AchievementTier, { earned: number; total: number }>;
      stagesUnlocked: number;
      stagesTotal: 6;
      timePerStage: Record<LabStage, number>;
      totalSessionTime: number;
    }
    ```
  - [x] 3.3: Add `DashboardData` interface to `progress/types.ts`

- [x] Task 4: Create `StatisticsDashboard` in `progress/StatisticsDashboard.ts` (AC: #5, #6)
  - [x] 4.1: Create `StatisticsDashboard` class following `AchievementGallery` modal pattern exactly:
    - `mount(parent: HTMLElement): void` — creates overlay element with `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
    - `show(data: DashboardData): void` — renders dashboard content and opens with enter animation
    - `hide(): void` — closes with exit animation (double-invocation guard)
    - `destroy(): void` — cleans up timeouts, event listeners, DOM
  - [x] 4.2: **Header section:** Title "Statistics", close button (X)
  - [x] 4.3: **Summary cards row:** Three cards — "Programs Assembled" (count), "Instructions Executed" (count), "Errors Encountered" (count) — each card has icon + number + label
  - [x] 4.4: **Progress section:** Four items — Discoveries (X / 7 with progress bar), Acts (X / 11), Achievements (X / 16 with tier breakdown chips), Stages (X / 6)
  - [x] 4.5: **Time section:** Total time (formatted as hours:minutes), per-stage time bars (proportional width bars for each stage with time label)
  - [x] 4.6: Keyboard support: Escape closes, Tab focus trap, focus restoration
  - [x] 4.7: Enter/exit animation: `--entering` / `--exiting` classes with double `requestAnimationFrame` for entering removal
  - [x] 4.8: All dynamic text via `textContent` (XSS safe)

- [x] Task 5: Add CSS styles to `styles/main.css` (AC: #5, #6)
  - [x] 5.1: Add `.da-statistics` overlay styles (fixed position, flex centered, z-index `var(--da-z-modal, 1001)`)
  - [x] 5.2: Add `.da-statistics--entering` / `--exiting` animation classes
  - [x] 5.3: Add `.da-statistics__backdrop` semi-transparent overlay (`z-index: var(--da-z-modal-backdrop, 1000)`)
  - [x] 5.4: Add `.da-statistics__content` scrollable container (max-width 700px, max-height 80vh)
  - [x] 5.5: Add `.da-statistics__header` with title and close button
  - [x] 5.6: Add `.da-statistics__summary-cards` flex row with `.da-statistics__card` items (icon, number, label)
  - [x] 5.7: Add `.da-statistics__progress` section with progress bars (`.da-statistics__progress-bar`, `.da-statistics__progress-fill`)
  - [x] 5.8: Add `.da-statistics__time` section with per-stage time bars
  - [x] 5.9: Add responsive breakpoints (768px → 2 col summary, 480px → 1 col)

- [x] Task 6: Add "Statistics" button to StoryNav (AC: #5)
  - [x] 6.1: Add `onStatisticsClick?: () => void` to `StoryNavOptions` interface
  - [x] 6.2: Store callback as private property, assign from options in constructor
  - [x] 6.3: Create button element with class `da-story-nav-action`, text "Stats", click listener calling `this.onStatisticsClick?.()`
  - [x] 6.4: Append button to the right-side action group alongside Journal and Journey buttons

- [x] Task 7: Wire statistics tracking in App.ts (AC: #1, #3, #4)
  - [x] 7.1: Import `StatisticsStorage` and `StatisticsCollector` in App.ts
  - [x] 7.2: Add `statisticsStorage` as private field (instantiate alongside other progress services)
  - [x] 7.3: In `handleAssemble()` success path: call `statisticsStorage.incrementPrograms()`
  - [x] 7.4: In emulator execution completion path (after run completes): call `statisticsStorage.addInstructionsExecuted(count)` with the number of instructions from the execution
  - [x] 7.5: In error handling paths (assembly errors, runtime errors): call `statisticsStorage.incrementErrors()`
  - [x] 7.6: Track stage time: on stage change, calculate elapsed time since last stage-change timestamp and call `statisticsStorage.addStageTime(previousStage, elapsed)`; store `stageChangeTimestamp` and `previousStageForTiming` fields
  - [x] 7.7: Track session time: on `destroy()` or `beforeunload`, calculate session duration and call `statisticsStorage.addSessionTime(elapsed)`; store `sessionStartTimestamp` field initialized in `mount()`

- [x] Task 8: Wire dashboard modal in StoryModeContainer and App.ts (AC: #5)
  - [x] 8.1: Import `StatisticsDashboard` and `StatisticsCollector` in StoryModeContainer
  - [x] 8.2: Add `onStatisticsClick?: () => void` to `StoryModeContainerOptions`
  - [x] 8.3: Pass `onStatisticsClick` to StoryNav options in `mountChildren()`
  - [x] 8.4: Create `StatisticsDashboard` instance, mount to `this.element`, destroy in `destroy()`
  - [x] 8.5: In App.ts, add `handleStatisticsClick()` method — creates `StatisticsCollector` from existing storage instances, calls `collector.collect()`, passes data to dashboard's `show()`
  - [x] 8.6: Pass `onStatisticsClick: () => this.handleStatisticsClick()` to StoryModeContainer options

- [x] Task 9: Write tests for `StatisticsStorage` in `progress/StatisticsStorage.test.ts` (AC: #1, #4)
  - [x] 9.1: Test `getStatisticsOrDefault()` returns zeroes initially
  - [x] 9.2: Test `incrementPrograms()` increments counter
  - [x] 9.3: Test `addInstructionsExecuted()` accumulates
  - [x] 9.4: Test `incrementErrors()` increments counter
  - [x] 9.5: Test `addStageTime()` accumulates per-stage time
  - [x] 9.6: Test `addSessionTime()` accumulates
  - [x] 9.7: Test persistence round-trip (save + reload in fresh instance)
  - [x] 9.8: Test graceful handling of corrupted localStorage data

- [x] Task 10: Write tests for `StatisticsCollector` in `progress/StatisticsCollector.test.ts` (AC: #2)
  - [x] 10.1: Test `collect()` with empty storage returns all zeroes
  - [x] 10.2: Test `collect()` aggregates discovery count correctly
  - [x] 10.3: Test `collect()` aggregates act completion count correctly
  - [x] 10.4: Test `collect()` aggregates achievement count with tier breakdown
  - [x] 10.5: Test `collect()` includes runtime stats (programs, instructions, errors, time)

- [x] Task 11: Write tests for `StatisticsDashboard` in `progress/StatisticsDashboard.test.ts` (AC: #5, #6)
  - [x] 11.1: Test `mount()` creates overlay with dialog ARIA attributes
  - [x] 11.2: Test `show()` renders summary cards with correct counts
  - [x] 11.3: Test `show()` renders progress section with correct fractions
  - [x] 11.4: Test `show()` renders time section with formatted durations
  - [x] 11.5: Test Escape key closes modal
  - [x] 11.6: Test backdrop click closes modal
  - [x] 11.7: Test close button click closes modal
  - [x] 11.8: Test enter/exit animation classes (including `requestAnimationFrame` removal)
  - [x] 11.9: Test focus trap (Tab cycles through interactive elements)
  - [x] 11.10: Test focus restoration after close
  - [x] 11.11: Test `destroy()` cleans up all event listeners and DOM

- [x] Task 12: Update barrel exports in `progress/index.ts` (AC: all)
  - [x] 12.1: Export `StatisticsStorage` class
  - [x] 12.2: Export `StatisticsCollector` class
  - [x] 12.3: Export `StatisticsDashboard` class
  - [x] 12.4: Export types: `RuntimeStatistics`, `DashboardData`
  - [x] 12.5: Export constant: `DEFAULT_RUNTIME_STATISTICS`

## Dev Notes

### Architecture Patterns (MUST FOLLOW)

**StatisticsStorage pattern** — Follows `DiscoveryStorage` exactly: constructor with optional storage key (`'digital-archaeology-statistics'`), silent error handling via try-catch, `loadStatistics()` / `saveStatistics()` / `getStatisticsOrDefault()`. Each increment method loads, mutates, saves in a single call. No caching — always reads fresh from localStorage.

**StatisticsCollector pattern** — Pure data aggregation service (no DOM), same pattern as `JourneyMapBuilder`. Constructor takes all storage dependencies. Single `collect()` method reads from all sources, returns a flat `DashboardData` object. The collector does NOT store state — it computes fresh each time the dashboard is opened.

**StatisticsDashboard pattern** — Full-screen modal following `AchievementGallery` exactly:
- `mount(parent)` / `show(data)` / `hide()` / `destroy()` lifecycle
- Overlay with backdrop + content container
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- Enter animation: `--entering` class removed via double `requestAnimationFrame` (19.5 F1 lesson)
- Exit animation: `--exiting` class with 300ms fade
- Double-invocation guard on `hide()` (19.2 F2 lesson)
- Escape key closes, backdrop click closes, close button closes
- Tab focus trap + focus restoration (19.2 F5 lesson)

**Runtime statistics tracking** — Counters are incremented at the point of action in App.ts:
- `programsAssembled` → incremented in `handleAssemble()` success path (after assembler returns success)
- `instructionsExecuted` → accumulated after emulator run completes (use instruction count from emulator)
- `errorsEncountered` → incremented when assembly errors or runtime errors are displayed
- `timePerStage` → elapsed ms between stage changes, accumulated per-stage
- `totalSessionTime` → elapsed ms from `mount()` to `destroy()`/`beforeunload`

**Time formatting** — Display total time as `Xh Ym` (hours and minutes), per-stage time as proportional bars. Use `Math.floor(ms / 3600000)` for hours, `Math.floor((ms % 3600000) / 60000)` for minutes. If under 1 hour, show `Xm` only.

**Wiring flow** (event chain for opening dashboard):
1. User clicks "Stats" button in StoryNav
2. StoryNav calls `onStatisticsClick()` callback
3. StoryModeContainer passes to `options.onStatisticsClick()`
4. App.ts `handleStatisticsClick()` → creates `StatisticsCollector`, calls `collect()`, passes data to `StatisticsDashboard.show()`

**StoryNav button** — Add to the right-side action group alongside existing Journal and Journey buttons. Use same class `da-story-nav-action`. Button text: "Stats" (short to fit nav bar).

### Previous Story Intelligence (19.5)

**Code review findings that apply to 19.6:**
- F1 (19.5, HIGH): Missing `requestAnimationFrame` for `--entering` removal — **Always include double rAF** in `displayToast()`/`show()` methods that use `--entering` class
- F2 (19.2, HIGH): Double-invocation guard on modal `hide()` — **Check `if (this.exitTimeout !== null) return;`** at start of `hide()`
- F5 (19.2, MEDIUM): Focus trap and restoration required for all modals
- F1 (19.2, HIGH): CSS variable `--da-border-color` does NOT exist — use `--da-border`
- F4 (19.4, LOW): Use tuple types for fixed-length arrays when appropriate

**Patterns from 19.1-19.5 that worked well:**
- Separation: pure data services vs UI components vs wiring code
- Metadata-driven rendering from `*_METADATA` constants
- Type guards with strict validation (Number.isInteger, .length > 0, cross-validation)
- Co-located test files with comprehensive DOM structure assertions
- `vi.useFakeTimers()` for animation and timeout tests
- Mock `requestAnimationFrame` for enter animation removal tests

**Established test patterns:**
- Mock localStorage with unique test storage keys (e.g., `'test-statistics'`)
- `vi.useFakeTimers()` / `vi.advanceTimersByTime()` for animations
- DOM structure testing with `container.querySelector()` assertions
- Keyboard event simulation with `new KeyboardEvent('keydown', { key: 'Escape' })`
- Focus trap testing with `document.activeElement` assertions

### Project Structure Notes

**New files to create:**
- `digital-archaeology-web/src/progress/StatisticsStorage.ts` — Runtime statistics persistence
- `digital-archaeology-web/src/progress/StatisticsStorage.test.ts` — Storage tests
- `digital-archaeology-web/src/progress/StatisticsCollector.ts` — Data aggregation service
- `digital-archaeology-web/src/progress/StatisticsCollector.test.ts` — Collector tests
- `digital-archaeology-web/src/progress/StatisticsDashboard.ts` — Modal UI component
- `digital-archaeology-web/src/progress/StatisticsDashboard.test.ts` — Dashboard tests

**Files to modify:**
- `digital-archaeology-web/src/progress/types.ts` — Add `RuntimeStatistics`, `DashboardData` interfaces and type guard
- `digital-archaeology-web/src/progress/index.ts` — Add barrel exports
- `digital-archaeology-web/src/story/StoryNav.ts` — Add `onStatisticsClick` callback and "Stats" button
- `digital-archaeology-web/src/story/StoryModeContainer.ts` — Add `onStatisticsClick` to options and wire through
- `digital-archaeology-web/src/ui/App.ts` — Add `StatisticsStorage` field, tracking instrumentation, `handleStatisticsClick()`, wire to StoryModeContainer
- `digital-archaeology-web/src/styles/main.css` — Add `.da-statistics*` CSS classes

### References

- [Source: progress/types.ts — All existing type definitions, metadata constants, type guards]
- [Source: progress/DiscoveryStorage.ts — Storage pattern to follow for StatisticsStorage]
- [Source: progress/AchievementGallery.ts — Modal UI pattern to follow for StatisticsDashboard]
- [Source: progress/JourneyMap.ts — Alternative modal pattern reference]
- [Source: progress/JourneyMapBuilder.ts — Pure collector pattern to follow for StatisticsCollector]
- [Source: progress/StageUnlockManager.ts — Pure data service pattern]
- [Source: story/StoryNav.ts — Button wiring pattern (lines 18-35 options, 150-177 buttons)]
- [Source: story/StoryModeContainer.ts — Callback wiring pattern]
- [Source: ui/App.ts — Integration point for tracking instrumentation]
- [Source: styles/main.css — CSS conventions, modal styling at lines 9027-9483]
- [Source: config/stageConfig.ts — Stage metadata for dashboard display]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Fixed StatisticsCollector test: expected 4 common achievements but actual count is 3 (corrected assertion)
- Fixed unused `ALL_TIERS` constant in StatisticsCollector.ts (removed dead code)
- Fixed StoryNav.test.ts: updated button count from 3 to 4 and button order to include "Stats" button

### Completion Notes List

- All 12 tasks implemented following red-green-refactor TDD cycle
- Applied all previous code review lessons: double rAF (19.5 F1), double-invocation guard (19.2 F2), focus trap (19.2 F5), `--da-border` not `--da-border-color` (19.2 F1)
- Instruction tracking uses `cpuState.instructions` delta approach: record `runStartInstructions` at run start, compute delta at pause/halt
- Time tracking uses timestamp deltas: `stageChangeTimestamp` for per-stage time, `sessionStartTimestamp` for total session time
- `persistTimingStatistics()` helper called at both `beforeunload` and `destroy()` for reliable persistence
- StatisticsDashboard wired through App.ts (not StoryModeContainer) to access all storage instances

### Code Review (1H 3M 2L)

**Findings fixed:**
- F1 (HIGH): Tracked `cpuState.cycles` instead of `cpuState.instructions` — fixed to use `instructions` field and renamed `runStartCycles` → `runStartInstructions` in App.ts
- F2 (MEDIUM): `handleStatisticsClick` created throwaway `new ActCompletionStorage()` — fixed to reuse `this.stageUnlockActCompletionStorage` in App.ts
- F3 (MEDIUM): `isValidRuntimeStatistics` missing `Number.isFinite()` for time fields — added for `totalSessionTime` and each `timePerStage[*]` in types.ts
- F4 (MEDIUM): CSS hardcoded hex tier colors — extracted to `--da-tier-*` CSS variables in `:root`, updated both statistics chips and achievement card borders

**Findings not fixed (LOW, accepted):**
- F5 (LOW): Storage mutation methods lack input validation — callers guard properly, accepted risk
- F6 (LOW): `formatDuration` shows "0m" for sub-minute sessions — spec-compliant, accepted

### File List

**New files created:**
- `digital-archaeology-web/src/progress/StatisticsStorage.ts` — Runtime statistics localStorage persistence (10 tests)
- `digital-archaeology-web/src/progress/StatisticsStorage.test.ts` — StatisticsStorage unit tests
- `digital-archaeology-web/src/progress/StatisticsCollector.ts` — Pure data aggregation service (5 tests)
- `digital-archaeology-web/src/progress/StatisticsCollector.test.ts` — StatisticsCollector unit tests
- `digital-archaeology-web/src/progress/StatisticsDashboard.ts` — Full-screen modal UI component (18 tests)
- `digital-archaeology-web/src/progress/StatisticsDashboard.test.ts` — StatisticsDashboard unit tests

**Files modified:**
- `digital-archaeology-web/src/progress/types.ts` — Added `RuntimeStatistics`, `DashboardData` interfaces, `DEFAULT_RUNTIME_STATISTICS`, `isValidRuntimeStatistics()`
- `digital-archaeology-web/src/progress/index.ts` — Added barrel exports for all new types, constants, and classes
- `digital-archaeology-web/src/story/StoryNav.ts` — Added `onStatisticsClick` callback and "Stats" button
- `digital-archaeology-web/src/story/StoryNav.test.ts` — Updated button count and order assertions for Stats button
- `digital-archaeology-web/src/story/StoryModeContainer.ts` — Added `onStatisticsClick` to options, wired to StoryNav
- `digital-archaeology-web/src/ui/App.ts` — Added StatisticsStorage, tracking instrumentation, handleStatisticsClick(), dashboard lifecycle
- `digital-archaeology-web/src/styles/main.css` — Added `.da-statistics*` CSS classes (~200 lines)

### Change Log

| Change | File(s) | Reason |
|--------|---------|--------|
| Added RuntimeStatistics + DashboardData types | types.ts | AC #1, #2, #3 — define data structures |
| Created StatisticsStorage | StatisticsStorage.ts | AC #1, #4 — persist counters across sessions |
| Created StatisticsCollector | StatisticsCollector.ts | AC #2 — aggregate data from all storage |
| Created StatisticsDashboard modal | StatisticsDashboard.ts | AC #5, #6 — full-screen modal UI |
| Added CSS styles | main.css | AC #5, #6 — visual styling |
| Added Stats button to StoryNav | StoryNav.ts | AC #5 — entry point for dashboard |
| Wired tracking in App.ts | App.ts | AC #1, #3, #4 — increment counters at action points |
| Wired dashboard modal | App.ts, StoryModeContainer.ts | AC #5 — open dashboard on button click |
| Updated barrel exports | index.ts | All ACs — public API |
| Fixed StoryNav test | StoryNav.test.ts | Test regression from new Stats button |
