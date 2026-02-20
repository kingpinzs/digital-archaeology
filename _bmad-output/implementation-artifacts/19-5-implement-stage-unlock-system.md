# Story 19.5: Implement Stage Unlock System

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want stages unlocked progressively,
so that I build on prior knowledge.

## Acceptance Criteria

1. **Given** I complete a stage's corresponding story act **When** the act completion is recorded **Then** the next lab stage unlocks automatically (micro4 is always unlocked; completing act-4 unlocks micro8, act-5 unlocks micro16, act-6 unlocks micro32, act-7 unlocks micro32p, act-8 unlocks micro32s)
2. **Given** I view a locked stage in the StageSelector dropdown **When** locked items are displayed **Then** a visual indicator shows the unlock requirement text below the lock icon (e.g., "Complete Act 4: First Microprocessor")
3. **Given** a new stage is unlocked **When** I am in Story Mode and the act transition fires **Then** an unlock toast notification appears with the stage name, icon, and a brief message
4. **Given** I reload the application **When** unlocked stages are computed from persisted act completions **Then** unlocked stages match completion state (idempotent — re-derivable from ActCompletionStorage)
5. **Given** I view the StageSelector **When** some stages are locked **Then** I can see a visual indicator (lock icon + requirement text) showing what I need to do to unlock each one

## Tasks / Subtasks

- [x] Task 1: Define stage unlock rules in `progress/types.ts` (AC: #1, #4)
  - [x] 1.1: Add `StageUnlockRule` interface: `{ readonly stage: LabStage; readonly requiredActNumber: number; readonly requiredActTitle: string }`
  - [x] 1.2: Add `STAGE_UNLOCK_RULES: readonly StageUnlockRule[]` constant — ordered list mapping act completions to stage unlocks:
    - `{ stage: 'micro8', requiredActNumber: 4, requiredActTitle: 'First Microprocessor' }`
    - `{ stage: 'micro16', requiredActNumber: 5, requiredActTitle: '8-bit Era' }`
    - `{ stage: 'micro32', requiredActNumber: 6, requiredActTitle: '16-bit Era' }`
    - `{ stage: 'micro32p', requiredActNumber: 7, requiredActTitle: '32-bit Era' }`
    - `{ stage: 'micro32s', requiredActNumber: 8, requiredActTitle: 'Pipelined' }`
  - [x] 1.3: Update barrel exports in `progress/index.ts` with new types and constant

- [x] Task 2: Create `StageUnlockManager` in `progress/StageUnlockManager.ts` (AC: #1, #4)
  - [x] 2.1: Create `StageUnlockManager` class with `ActCompletionStorage` dependency (same constructor pattern as `JourneyMapBuilder`)
  - [x] 2.2: Implement `computeUnlockedStages(): LabStage[]` — reads completed act numbers from `ActCompletionStorage`, applies `STAGE_UNLOCK_RULES`, always includes `'micro4'`, returns sorted array matching `LAB_STAGES` order
  - [x] 2.3: Implement `getRequirementForStage(stage: LabStage): string | null` — returns human-readable requirement string for a locked stage (e.g., "Complete Act 4: First Microprocessor"), returns `null` for `micro4` (always unlocked) or already-unlocked stages
  - [x] 2.4: Implement `evaluateNewUnlocks(previousUnlocked: LabStage[]): LabStage[]` — compares current computed unlocks against previous, returns only newly unlocked stages (for notification triggering)

- [x] Task 3: Create `StageUnlockToast` in `progress/StageUnlockToast.ts` (AC: #3)
  - [x] 3.1: Create `StageUnlockToast` class following `DiscoveryNotification` toast pattern exactly:
    - `mount(parent: HTMLElement): void` — creates container with `role="status"` and `aria-live="polite"`
    - `show(stage: LabStage): void` — displays toast with stage icon, name, "Stage Unlocked!" message
    - `destroy(): void` — cleans up timeouts and DOM
  - [x] 3.2: Toast content: stage icon from `STAGE_METADATA[stage].icon`, stage label from `STAGE_METADATA[stage].label`, message "Stage Unlocked!"
  - [x] 3.3: Auto-dismiss after 4000ms (match `DISMISS_DELAY_MS` from DiscoveryNotification)
  - [x] 3.4: Enter/exit animation using `--entering` / `--exiting` classes
  - [x] 3.5: Queue support for multiple unlocks (same pattern as DiscoveryNotification)
  - [x] 3.6: CSS class prefix: `da-stage-unlock-toast`

- [x] Task 4: Add CSS styles to `styles/main.css` (AC: #2, #3, #5)
  - [x] 4.1: Add `.da-stage-unlock-toast-container` styles (fixed position, top-right, match `.da-discovery-toast-container`)
  - [x] 4.2: Add `.da-stage-unlock-toast` base styles (card with glow, border-left accent)
  - [x] 4.3: Add `.da-stage-unlock-toast--entering` / `--exiting` animation (slide-in, fade-out)
  - [x] 4.4: Add `.da-stage-unlock-toast__icon` / `__label` / `__message` styles
  - [x] 4.5: Add `.da-stage-selector-item-requirement` styles (tooltip text below lock icon, muted color, small font)

- [x] Task 5: Enhance StageSelector to show unlock requirements (AC: #2, #5)
  - [x] 5.1: Add optional `unlockRequirements?: Map<LabStage, string>` to `StageSelectorOptions`
  - [x] 5.2: Store `unlockRequirements` as class property, expose `setUnlockRequirements(reqs: Map<LabStage, string>): void` method
  - [x] 5.3: In `render()` and `updateLockedState()`, for locked items: append a `<span class="da-stage-selector-item-requirement">` with the requirement text below the lock icon (e.g., "Complete Act 4: First Microprocessor")
  - [x] 5.4: Ensure requirement text is set via `textContent` (XSS safe)

- [x] Task 6: Wire StageUnlockManager into App.ts (AC: #1, #3, #4)
  - [x] 6.1: Import `StageUnlockManager` and `StageUnlockToast` in App.ts
  - [x] 6.2: Add `stageUnlockManager` and `stageUnlockToast` as private fields (instantiate alongside other progress services)
  - [x] 6.3: In `initializeSettings()`, replace hardcoded `this.unlockedStages = settings.unlockedStages` with computed unlocks: `this.unlockedStages = this.stageUnlockManager.computeUnlockedStages()` — this ensures unlocks are always derived from act completion state, not stale persisted values
  - [x] 6.4: Mount `stageUnlockToast` to the app container (in `init()` method after container setup)
  - [x] 6.5: Destroy both in `destroy()` method
  - [x] 6.6: Add `handleStageUnlockCheck(): void` method that:
    - Calls `stageUnlockManager.evaluateNewUnlocks(this.unlockedStages)`
    - For each newly unlocked stage: calls `stageUnlockToast.show(stage)`
    - Updates `this.unlockedStages` via `stageUnlockManager.computeUnlockedStages()`
    - Calls `stageSelector.setUnlockedStages(this.unlockedStages)`
    - Persists settings via `saveSettings()`
  - [x] 6.7: Provide unlock requirements to StageSelector by calling `stageSelector.setUnlockRequirements()` with data from `stageUnlockManager.getRequirementForStage()` for each locked stage

- [x] Task 7: Wire unlock evaluation into StoryController act completion flow (AC: #1, #3)
  - [x] 7.1: Add `onStageUnlock?: () => void` callback to `StoryControllerCallbacks` interface (and `onStageUnlockCheck?: () => void` to StoryModeContainerOptions)
  - [x] 7.2: In `StoryController.subscribeToStateChanges()`, after act completion is persisted (after `actCompletionStorage.addCompletion()`), call the `onStageUnlock` callback
  - [x] 7.3: In `StoryModeContainer.initializeStoryController()`, wire the `onStageUnlock` callback to a new `options.onStageUnlockCheck` callback
  - [x] 7.4: In `App.ts`, pass `onStageUnlockCheck: () => this.handleStageUnlockCheck()` to StoryModeContainer options

- [x] Task 8: Write tests for `StageUnlockManager` in `progress/StageUnlockManager.test.ts` (AC: #1, #4)
  - [x] 8.1: Test `computeUnlockedStages()` with no completions → `['micro4']`
  - [x] 8.2: Test `computeUnlockedStages()` with act-4 completed → `['micro4', 'micro8']`
  - [x] 8.3: Test `computeUnlockedStages()` with acts 4-8 completed → all 6 stages unlocked
  - [x] 8.4: Test `computeUnlockedStages()` with non-sequential completions (e.g., act-4 and act-6 completed but not act-5) → `['micro4', 'micro8', 'micro32']` — each rule evaluates independently
  - [x] 8.5: Test `computeUnlockedStages()` returns stages in `LAB_STAGES` order
  - [x] 8.6: Test `getRequirementForStage('micro4')` → `null` (always unlocked)
  - [x] 8.7: Test `getRequirementForStage('micro8')` when act-4 NOT completed → requirement string
  - [x] 8.8: Test `getRequirementForStage('micro8')` when act-4 IS completed → `null` (already unlocked)
  - [x] 8.9: Test `evaluateNewUnlocks()` returns only newly unlocked stages
  - [x] 8.10: Test `evaluateNewUnlocks()` returns empty array when no new unlocks

- [x] Task 9: Write tests for `StageUnlockToast` in `progress/StageUnlockToast.test.ts` (AC: #3)
  - [x] 9.1: Test `mount()` creates container with `role="status"` and `aria-live="polite"`
  - [x] 9.2: Test `show()` displays toast with stage icon, label, and "Stage Unlocked!" message
  - [x] 9.3: Test auto-dismiss after 4000ms
  - [x] 9.4: Test enter/exit animation classes
  - [x] 9.5: Test queue support (show two stages, second displays after first dismisses)
  - [x] 9.6: Test `destroy()` cleans up DOM and timeouts

- [x] Task 10: Write tests for StageSelector requirement display in `ui/StageSelector.test.ts` (AC: #2, #5)
  - [x] 10.1: Test `setUnlockRequirements()` adds requirement text to locked items
  - [x] 10.2: Test requirement text is NOT shown for unlocked items
  - [x] 10.3: Test requirement text uses `textContent` (verify via checking element content, not innerHTML)
  - [x] 10.4: Test `setUnlockedStages()` + `setUnlockRequirements()` updates correctly together

- [x] Task 11: Update barrel exports in `progress/index.ts` (AC: all)
  - [x] 11.1: Export `StageUnlockManager` class
  - [x] 11.2: Export `StageUnlockToast` class
  - [x] 11.3: Export types: `StageUnlockRule`
  - [x] 11.4: Export constant: `STAGE_UNLOCK_RULES`

## Dev Notes

### Architecture Patterns (MUST FOLLOW)

**Act-to-Stage unlock mapping** — Each `LabStage` (except `micro4`) is unlocked by completing a specific story act. The mapping is: completing the act ABOUT a technology era unlocks the NEXT lab stage:
- micro4 → always unlocked (default in `DEFAULT_SETTINGS.unlockedStages`)
- micro8 → complete act-4 (First Microprocessor, the Micro4 act)
- micro16 → complete act-5 (8-bit Era, the Micro8 act)
- micro32 → complete act-6 (16-bit Era, the Micro16 act)
- micro32p → complete act-7 (32-bit Era, the Micro32 act)
- micro32s → complete act-8 (Pipelined, the Micro32-P act)

**Each rule evaluates independently** — If act-6 is completed but act-5 is not, micro32 IS unlocked but micro16 is NOT. This allows non-linear progression through the story.

**Toast UI pattern** — Copy `DiscoveryNotification.ts` verbatim for:
- `mount(parent)` / `show(data)` / `destroy()` lifecycle
- Auto-dismiss with `setTimeout` (4000ms)
- Enter/exit animation: `--entering` / `--exiting` classes
- Queue support for multiple concurrent notifications
- `clearAllTimeouts()` for cleanup
- Container has `role="status"` and `aria-live="polite"` for accessibility

**StageUnlockManager pattern** — Pure data service (no DOM), same pattern as `JourneyMapBuilder`:
- Constructor takes `ActCompletionStorage` dependency
- Pure computation methods that read storage and return data
- No side effects — callers handle persistence and UI updates

**Unlock computation is idempotent** — `computeUnlockedStages()` always derives the answer from `ActCompletionStorage`. Never trust persisted `unlockedStages` from `AppSettings` — always recompute on load. This prevents stale unlock state if localStorage was manually edited or a bug caused incorrect persistence.

**Wiring flow** (event chain):
1. User advances to next act in Story Mode → `StoryController.subscribeToStateChanges()`
2. `ActCompletionDetector.detect()` fires → completion persisted to `ActCompletionStorage`
3. `onStageUnlock` callback fires → bubbles to `StoryModeContainer` → `App.ts`
4. `App.ts.handleStageUnlockCheck()` → `StageUnlockManager.evaluateNewUnlocks()`
5. New unlocks → `StageUnlockToast.show()` + update `unlockedStages` + persist settings
6. `StageSelector.setUnlockedStages()` updates UI

**StageSelector enhancement** — Add requirement text to locked dropdown items. DO NOT add a tooltip component — instead, append a `<span>` element directly below the lock icon inside each locked item. This keeps the implementation simple and avoids tooltip positioning complexity. The requirement text comes from `StageUnlockManager.getRequirementForStage()`.

**CSS conventions:**
- All classes use `da-` prefix, kebab-case
- Toast animation classes: `--entering`, `--exiting`
- Colors via CSS variables where available, hardcoded hex only if consistent with existing patterns (e.g., `#4caf50` for success, matching AchievementGallery)
- XSS prevention: `textContent` for all dynamic text

**Event listener cleanup** — All DOM event listeners must use the bound handler pattern (bind in constructor, store as class property, remove in `destroy()`).

### Project Structure Notes

**New files to create:**
- `digital-archaeology-web/src/progress/StageUnlockManager.ts` — Pure data service (unlock rules + computation)
- `digital-archaeology-web/src/progress/StageUnlockManager.test.ts` — Manager tests
- `digital-archaeology-web/src/progress/StageUnlockToast.ts` — Toast notification UI
- `digital-archaeology-web/src/progress/StageUnlockToast.test.ts` — Toast tests

**Files to modify:**
- `digital-archaeology-web/src/progress/types.ts` — Add `StageUnlockRule` interface and `STAGE_UNLOCK_RULES` constant
- `digital-archaeology-web/src/progress/index.ts` — Add exports for new types, constant, and classes
- `digital-archaeology-web/src/ui/StageSelector.ts` — Add `unlockRequirements` support and requirement text display
- `digital-archaeology-web/src/ui/StageSelector.test.ts` — New tests for requirement display (if exists, else create)
- `digital-archaeology-web/src/story/StoryController.ts` — Add `onStageUnlock` callback after act completion
- `digital-archaeology-web/src/story/StoryModeContainer.ts` — Wire `onStageUnlockCheck` callback
- `digital-archaeology-web/src/ui/App.ts` — Add `StageUnlockManager`, `StageUnlockToast`, `handleStageUnlockCheck()`, wire everything
- `digital-archaeology-web/src/styles/main.css` — Add `.da-stage-unlock-toast*` and `.da-stage-selector-item-requirement` CSS

### Previous Story Intelligence (19.4)

**Code review findings that apply to 19.5:**
- F1 (19.3, HIGH): CSS classes referenced in JS but missing from main.css — **Cross-check every CSS class** used in `StageUnlockToast.ts` and `StageSelector.ts` modifications against main.css before marking CSS task complete.
- F4 (19.4, LOW): Compile-time length safety — If defining a fixed-length tuple/array for stage rules, use tuple types.
- F5 (19.4, LOW): Keyboard navigation tests — Ensure any new interactive elements have keyboard test coverage.

**Patterns from 19.1-19.4 that worked well:**
- `DiscoveryNotification` toast pattern: mount/show/destroy, auto-dismiss, queuing, enter/exit animation
- Metadata-driven rendering: `STAGE_METADATA[stage]` → icon, label
- Separation of data computation (StageUnlockManager) from UI (StageUnlockToast)
- Pure storage readers (JourneyMapBuilder, AchievementDetector) that compute from ActCompletionStorage

**Established test patterns:**
- Mock localStorage with unique test storage keys (e.g., `'test-stage-unlock'`)
- `vi.useFakeTimers()` / `vi.advanceTimersByTime()` for animation and auto-dismiss timeouts
- Test DOM structure with `container.querySelector()` assertions
- Test `textContent` for text rendering verification

### References

- [Source: progress/types.ts — ACT_COMPLETION_METADATA acts 0-10 and their titles/eras]
- [Source: progress/ActCompletionStorage.ts — getCompletedActNumbers() for reading completion state]
- [Source: progress/DiscoveryNotification.ts — Toast UI pattern with mount/show/destroy/queue]
- [Source: progress/JourneyMapBuilder.ts — ACT_CPU_STAGES mapping acts to CPU stages]
- [Source: ui/StageSelector.ts — LabStage type, LAB_STAGES, STAGE_METADATA, setUnlockedStages(), updateLockedState()]
- [Source: state/types.ts — AppSettings.unlockedStages, DEFAULT_SETTINGS]
- [Source: config/stageConfig.ts — StageConfig, getNextStage(), STAGE_EDUCATIONAL_CONTENT.journeyTeaser]
- [Source: story/StoryController.ts — subscribeToStateChanges() act completion detection, lines 420-441]
- [Source: story/StoryModeContainer.ts — initializeStoryController() wiring pattern, lines 193-202]
- [Source: ui/App.ts — handleStageChange(), unlockedStages usage, lines 105, 716, 758, 4074, 4095]
- [Source: styles/main.css — .da-discovery-toast* CSS for toast pattern, .da-stage-selector* for dropdown styles]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References
N/A — all tasks passed on first implementation attempt.

### Completion Notes List
- Tasks 1-4 and 8-9 implemented in prior session (types, StageUnlockManager with 13 tests, StageUnlockToast with 9 tests, CSS)
- Task 5 completed: StageSelector enhanced with `setUnlockRequirements()` method, `render()` and `updateLockedState()` updated to show requirement text on locked items
- Task 6 completed: App.ts wired with StageUnlockManager/StageUnlockToast — imports, fields, mount/destroy, `handleStageUnlockCheck()`, `updateStageSelectorRequirements()`, computed unlocks replace persisted values
- Task 7 completed: `onStageUnlock` callback added to StoryControllerCallbacks, wired through StoryModeContainer to App.ts
- Task 10 completed: 6 new tests for StageSelector requirement display (constructor, setUnlockRequirements, unlocked filtering, XSS safety, unlock removal, combined updates)
- Task 11 completed: Barrel exports updated with StageUnlockManager and StageUnlockToast classes
- Full regression: 122 test files, 4883 tests passing (72 new for Story 19.5)
- Used tuple type for STAGE_UNLOCK_RULES per F4 lesson from 19.4 code review
- Code review fixes applied: F1 (HIGH) added missing requestAnimationFrame for --entering removal in StageUnlockToast.displayToast(); F2 (MEDIUM) added test for --entering class removal; F3 (MEDIUM) updated AC #2 wording to match inline requirement text implementation

### File List
**New files:**
- `src/progress/StageUnlockManager.ts` — Pure data service for computing stage unlock state (67 lines)
- `src/progress/StageUnlockManager.test.ts` — 13 tests for StageUnlockManager
- `src/progress/StageUnlockToast.ts` — Toast notification UI for stage unlock announcements (148 lines)
- `src/progress/StageUnlockToast.test.ts` — 10 tests for StageUnlockToast

**Modified files:**
- `src/progress/types.ts` — Added StageUnlockRule interface and STAGE_UNLOCK_RULES constant
- `src/progress/index.ts` — Added barrel exports for StageUnlockManager, StageUnlockToast, StageUnlockRule, STAGE_UNLOCK_RULES
- `src/ui/StageSelector.ts` — Added unlockRequirements option, setUnlockRequirements() method, requirement text in render/updateLockedState
- `src/ui/StageSelector.test.ts` — Added 6 tests for requirement display (Task 10)
- `src/ui/App.ts` — Added StageUnlockManager/StageUnlockToast wiring, handleStageUnlockCheck(), updateStageSelectorRequirements(), computed unlocks
- `src/story/StoryController.ts` — Added onStageUnlock callback to interface and invocation after act completion
- `src/story/StoryModeContainer.ts` — Added onStageUnlockCheck to options interface and wiring to StoryController
- `src/styles/main.css` — Added stage-unlock-toast and stage-selector-item-requirement CSS
