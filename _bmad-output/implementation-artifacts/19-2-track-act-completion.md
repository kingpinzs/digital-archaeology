# Story 19.2: Track Act Completion

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want act completion tracked,
so that I see journey progress.

## Acceptance Criteria

1. **Given** I complete an act's final scene **When** the story engine navigates me to the next act **Then** a completion celebration appears (non-blocking overlay, auto-dismisses after ~6 seconds, includes act title and era)
2. **Given** an act is completed **When** the celebration appears **Then** the act completion is persisted in localStorage (separate from discoveries)
3. **Given** I have completed acts **When** the ProgressDisplay renders **Then** it uses actual completion data instead of the naive "everything before current is completed" assumption
4. **Given** I have completed acts **When** I close and reopen the browser **Then** act completions persist across sessions (localStorage)
5. **Given** I complete the last scene in an act **When** the next act begins **Then** the next act is shown as unlocked in the progress dots

## Tasks / Subtasks

- [x] Task 1: Define act completion data model in `progress/types.ts` (AC: #2, #4)
  - [x] 1.1: Add `ActCompletionType` string literal union: `'act-0'` | `'act-1'` | ... | `'act-10'` (11 acts total, numbered 0-10)
  - [x] 1.2: Define `ActCompletion` interface with `readonly` fields: `actNumber: number`, `actId: ActCompletionType`, `timestamp: number` (ms since epoch), `actTitle: string`, `era: string`
  - [x] 1.3: Define `ActCompletionProfile` interface: `completions: readonly ActCompletion[]`, `version: number`
  - [x] 1.4: Define `DEFAULT_ACT_COMPLETION_PROFILE: ActCompletionProfile` with empty completions array and `version: 1`
  - [x] 1.5: Define `isValidActCompletion()` and `isValidActCompletionProfile()` type guards (same validation pattern as `isValidDiscovery()` and `isValidDiscoveryProfile()`)
  - [x] 1.6: Define `ACT_COMPLETION_METADATA: Record<ActCompletionType, { readonly title: string; readonly era: string; readonly icon: string }>` — human-readable display data for each act completion, using the act titles and eras from `content-types.ts` CpuStage mapping
  - [x] 1.7: Update `progress/index.ts` barrel exports with all new types, guards, constants

- [x] Task 2: Create `ActCompletionStorage` service in `progress/ActCompletionStorage.ts` (AC: #2, #4)
  - [x] 2.1: Create `ActCompletionStorage` class following `DiscoveryStorage` pattern exactly (localStorage, JSON serialization, type guards, error handling)
  - [x] 2.2: Storage key: `'digital-archaeology-act-completions'`
  - [x] 2.3: Implement `loadProfile(): ActCompletionProfile | null` — parse, validate, return or null
  - [x] 2.4: Implement `saveProfile(profile: ActCompletionProfile): void` — serialize and persist
  - [x] 2.5: Implement `getProfileOrDefault(): ActCompletionProfile` — convenience method (never returns null)
  - [x] 2.6: Implement `addCompletion(completion: ActCompletion): ActCompletionProfile` — loads profile, appends completion (with duplicate protection on actId), saves, returns updated
  - [x] 2.7: Implement `hasCompletion(actId: ActCompletionType): boolean` — checks if an act has been completed
  - [x] 2.8: Implement `getCompletedActNumbers(): number[]` — returns sorted array of completed act numbers (useful for ProgressDisplay)
  - [x] 2.9: Implement `clearProfile(): void` — for testing/reset
  - [x] 2.10: Support constructor parameter for custom storage key (testability, same as `DiscoveryStorage`)

- [x] Task 3: Create `ActCompletionDetector` service in `progress/ActCompletionDetector.ts` (AC: #1)
  - [x] 3.1: Create `ActCompletionDetector` class that detects act boundary transitions
  - [x] 3.2: Constructor takes `ActCompletionStorage` dependency (for checking what's already completed)
  - [x] 3.3: Implement `detect(previousActNumber: number, currentActNumber: number, acts: readonly StoryActSummary[]): ActCompletion | null` — returns an `ActCompletion` if the transition represents a completed act (i.e., `currentActNumber > previousActNumber`), or `null` if no completion occurred
  - [x] 3.4: Define `StoryActSummary` interface: `{ number: number; title: string; era: string }` — minimal act info needed by the detector, decoupled from the full `StoryAct` type in `story/content-types.ts`
  - [x] 3.5: Detection logic: if `currentActNumber > previousActNumber` AND `previousActNumber >= 0` AND act not already completed → create `ActCompletion` for the previous act
  - [x] 3.6: Load profile once into a `Set` for O(1) lookup (following 19.1 code review fix H1)
  - [x] 3.7: Build `ActCompletion` with current timestamp, act title and era from the `acts` summary array

- [x] Task 4: Create `ActCelebration` UI component in `progress/ActCelebration.ts` (AC: #1)
  - [x] 4.1: Create `ActCelebration` class with `mount(container: HTMLElement): void` and `destroy(): void` lifecycle methods
  - [x] 4.2: Implement `show(completion: ActCompletion): void` — displays a full celebration overlay with act title, era, and congratulatory message
  - [x] 4.3: Overlay structure: semi-transparent backdrop + centered card with act title, era badge, icon, congratulatory text, and "Continue" button
  - [x] 4.4: CSS class: `da-act-celebration` (container), `da-act-celebration__backdrop`, `da-act-celebration__card`, `da-act-celebration__icon`, `da-act-celebration__title`, `da-act-celebration__era`, `da-act-celebration__message`, `da-act-celebration__continue`
  - [x] 4.5: Entrance animation: fade in + scale up (CSS transition, `da-act-celebration--entering`)
  - [x] 4.6: Auto-dismiss after 6000ms OR on "Continue" button click, whichever comes first
  - [x] 4.7: Exit animation: fade out (`da-act-celebration--exiting`, 300ms), remove from DOM after animation
  - [x] 4.8: Use `textContent` for all user-facing strings (no innerHTML XSS risk)
  - [x] 4.9: Accessibility: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to title element. "Continue" button gets auto-focus for keyboard users
  - [x] 4.10: Proper cleanup in `destroy()`: clear pending timeouts, remove element from DOM, remove keyboard listener
  - [x] 4.11: Keyboard support: Enter/Space on "Continue" button dismisses, Escape key dismisses

- [x] Task 5: Add CSS styles for act celebration in `styles/main.css` (AC: #1)
  - [x] 5.1: Add `.da-act-celebration` base styles — fixed position, full viewport, z-index using `var(--da-z-modal-backdrop, 1000)` for backdrop, `var(--da-z-modal, 1001)` for card
  - [x] 5.2: Use existing CSS variables: `--da-bg-primary`, `--da-bg-secondary`, `--da-text-primary`, `--da-text-secondary`, `--da-border-color`, `--da-accent` for theming
  - [x] 5.3: Backdrop: `background: rgba(0, 0, 0, 0.6)`, centered flexbox layout
  - [x] 5.4: Card: `max-width: 480px`, padding 32px, rounded corners, subtle glow border using `--da-accent`
  - [x] 5.5: Add `.da-act-celebration--entering` animation: `opacity: 0 → 1` + `scale(0.9) → scale(1)` (400ms ease-out)
  - [x] 5.6: Add `.da-act-celebration--exiting` animation: `opacity: 1 → 0` + `scale(1) → scale(0.95)` (300ms ease-in)
  - [x] 5.7: Icon: large centered emoji (3rem font-size)
  - [x] 5.8: Title: bold, large text, `--da-text-primary`
  - [x] 5.9: Era badge: small inline badge with `--da-accent` background
  - [x] 5.10: "Continue" button: solid `--da-accent` background, white text, hover state, focus ring for keyboard nav
  - [x] 5.11: Ensure styles work in both `lab-mode` and `story-mode` themes
  - [x] 5.12: **CSS Variable Validation** (Epic 18 retro action item): verify ALL CSS variables used actually exist in the theme

- [x] Task 6: Wire act completion system into StoryController.ts (AC: #1, #2, #3, #5)
  - [x] 6.1: Add imports for `ActCompletionStorage`, `ActCompletionDetector`, `ActCelebration` from `'../progress'`
  - [x] 6.2: Add `private actCompletionStorage: ActCompletionStorage` and `private actCompletionDetector: ActCompletionDetector` as class properties, initialized inline
  - [x] 6.3: Add `private actCelebration: ActCelebration` as class property, initialized inline
  - [x] 6.4: In the `story-state-changed` event listener (the `subscribeToStateChanges()` method): compare previous act number with new act number. If transition detected, call `actCompletionDetector.detect()` with minimal act summaries extracted from `this.acts`
  - [x] 6.5: When `detect()` returns a non-null `ActCompletion`: call `this.actCompletionStorage.addCompletion(completion)` then `this.actCelebration.show(completion)`
  - [x] 6.6: Mount `actCelebration` in `setRenderContainer()` (same parent as scene rendering)
  - [x] 6.7: Destroy `actCelebration` in the controller's cleanup path
  - [x] 6.8: Add a `getCompletedActNumbers(): number[]` method to `StoryController` that delegates to `actCompletionStorage.getCompletedActNumbers()` — this exposes completion data for external consumers like ProgressDisplay

- [x] Task 7: Update ProgressDisplay to use real completion data (AC: #3, #5)
  - [x] 7.1: Modify `createProgressDisplayData()` in `ProgressDisplay.ts` to accept an optional `completedActNumbers: number[]` parameter
  - [x] 7.2: When `completedActNumbers` is provided, use it for `isCompleted` instead of the naive `i < currentActNumber` assumption
  - [x] 7.3: An act is completed if `completedActNumbers.includes(actNumber)`
  - [x] 7.4: The current act (`isCurrent`) logic stays the same: `i === currentActNumber`
  - [x] 7.5: Update callers of `createProgressDisplayData()` — pass completed act numbers from `StoryController.getCompletedActNumbers()` where available
  - [x] 7.6: Backward compatible: if `completedActNumbers` is not provided, fall back to existing naive logic

- [x] Task 8: Write comprehensive tests (AC: #1, #2, #3, #4, #5)
  - [x] 8.1: **progress/types.test.ts** — Add tests for `isValidActCompletion()` accepts valid completions
  - [x] 8.2: Test `isValidActCompletion()` rejects invalid completions (missing fields, wrong types)
  - [x] 8.3: Test `isValidActCompletionProfile()` accepts valid profiles
  - [x] 8.4: Test `isValidActCompletionProfile()` rejects invalid profiles (including version validation: NaN, 0, negative, non-integer)
  - [x] 8.5: Test `DEFAULT_ACT_COMPLETION_PROFILE` has empty completions and version 1
  - [x] 8.6: Test `ACT_COMPLETION_METADATA` has entries for all 11 acts
  - [x] 8.7: **progress/ActCompletionStorage.test.ts** — Test `loadProfile()` returns null when no data
  - [x] 8.8: Test `saveProfile()` + `loadProfile()` round-trip
  - [x] 8.9: Test `getProfileOrDefault()` returns default when no data
  - [x] 8.10: Test `addCompletion()` appends to existing profile
  - [x] 8.11: Test `addCompletion()` duplicate protection (same actId is silently skipped)
  - [x] 8.12: Test `hasCompletion()` returns true for existing, false for missing
  - [x] 8.13: Test `getCompletedActNumbers()` returns sorted array
  - [x] 8.14: Test `clearProfile()` removes data
  - [x] 8.15: Test localStorage error handling (graceful failure)
  - [x] 8.16: **progress/ActCompletionDetector.test.ts** — Test detects completion when act number increases
  - [x] 8.17: Test does NOT detect completion when act number stays same
  - [x] 8.18: Test does NOT detect completion when act number decreases (going back)
  - [x] 8.19: Test does NOT re-detect if act already completed
  - [x] 8.20: Test includes correct act title and era from act summaries
  - [x] 8.21: Test includes correct timestamp
  - [x] 8.22: **progress/ActCelebration.test.ts** — Test mount creates container with correct ARIA attributes
  - [x] 8.23: Test `show()` creates overlay with act title, era, and icon
  - [x] 8.24: Test overlay has entering CSS class initially
  - [x] 8.25: Test "Continue" button dismisses overlay
  - [x] 8.26: Test auto-dismiss after timeout (use `vi.useFakeTimers()`)
  - [x] 8.27: Test Escape key dismisses overlay
  - [x] 8.28: Test `destroy()` cleans up pending timeouts and DOM elements
  - [x] 8.29: **story/ProgressDisplay.test.ts** — Test `createProgressDisplayData()` with explicit completedActNumbers
  - [x] 8.30: Test backward compatibility without completedActNumbers (falls back to naive logic)
  - [x] 8.31: Test completed acts marked correctly even if not contiguous

## Dev Notes

### Architecture Context

**This story extends the `progress/` module foundation created in Story 19.1.** It follows the exact same patterns (types → storage → detector → UI → wiring) but for act-level completion rather than individual discoveries. The new act completion types and services live alongside the discovery types in `progress/`.

**Key difference from 19.1:** Discovery detection is triggered by assembly events (in App.ts). Act completion detection is triggered by story navigation events (in StoryController.ts). The detector integrates with `StoryEngine`'s `story-state-changed` custom event, not the assembler flow.

### Story Navigation Flow — Where Detection Fits

```
StoryEngine.goToScene(sceneId)
  → Updates StoryProgress.position (actNumber, chapterNumber, sceneId)
  → Dispatches CustomEvent 'story-state-changed' with detail: { progress, previousSceneId }
    → StoryController.subscribeToStateChanges() handler fires
      → ★ NEW: Compare previous actNumber with current actNumber
      → ★ NEW: If actNumber increased → actCompletionDetector.detect(prevAct, currAct, actSummaries)
      → ★ NEW: If completion returned → storage.addCompletion() + celebration.show()
```

Detection happens in the `story-state-changed` event handler inside `StoryController`. The handler already receives the current progress via `event.detail.progress`. To get the previous act number, track it as a private field in `StoryController` that updates after each state change.

### Act Structure Reference

Acts are numbered 0-10 (11 total), corresponding to CpuStage values:
| Act | CpuStage | Era | Title (from content) |
|-----|----------|-----|----------------------|
| 0 | mechanical | 3000 BC - 1840s | Pre-history |
| 1 | relay | 1890s - 1945 | Electromechanical |
| 2 | vacuum | 1945 - 1955 | Vacuum Tubes |
| 3 | transistor | 1955 - 1970 | Transistors |
| 4 | micro4 | 1971 | First Microprocessor |
| 5 | micro8 | 1974-1978 | 8-bit Era |
| 6 | micro16 | 1978-1985 | 16-bit Era |
| 7 | micro32 | 1985-1995 | 32-bit Era |
| 8 | micro32p | 1989-1995 | Pipelined |
| 9 | micro32s | 1995+ | Superscalar |
| 10 | future | 2015+ | Future Computing |

**Critical:** Use the act metadata from `ACT_COMPLETION_METADATA` constant, NOT from runtime story content. The metadata must be hardcoded so it works even when story content isn't loaded (e.g., in Lab Mode checking progress).

### Existing ProgressDisplay Architecture

`ProgressDisplay.ts` exports:
- `ActProgress` interface: `{ actNumber, isCompleted, isCurrent }`
- `ProgressDisplayData` interface: `{ acts: ActProgress[], currentActNumber, totalActs }`
- `createProgressDisplayData(currentActNumber, totalActs)` — currently uses naive `i < currentActNumber` for completion

`ProgressDots.ts` renders the progress dots UI using `ProgressDisplayData`. It does NOT need changes — only the data function needs updating.

### Celebration vs Toast Design Decision

**Discovery notifications (19.1) use small toasts** because discoveries are frequent, lightweight milestones.

**Act completions use a celebration overlay** because acts are major story milestones (only 11 possible in the entire game). The overlay uses the modal z-index layer (`--da-z-modal-backdrop: 1000`, `--da-z-modal: 1001`) since it's a dialog-like component, NOT the toast layer (`--da-z-toast: 900`).

### StoryActSummary — Decoupling from Story Content Types

The detector needs act title and era, but should NOT depend directly on `StoryAct` from `story/content-types.ts` (which is a large interface with chapters, scenes, personas, etc.). Instead, define a minimal `StoryActSummary` interface in `progress/types.ts`:

```typescript
interface StoryActSummary {
  readonly number: number;
  readonly title: string;
  readonly era: string;
}
```

The `StoryController` extracts these from `this.acts` before passing to the detector. This keeps the `progress/` module decoupled from `story/` module internals.

### Persistence Strategy

Same as 19.1: localStorage with a separate key `'digital-archaeology-act-completions'`. Separate from discovery tracking to keep concerns isolated and avoid migration complexity.

### Previous Story Intelligence (Story 19.1)

Patterns to follow from Story 19.1 implementation:
- **Readonly interfaces:** All fields should be `readonly`
- **Type guards:** Follow `isValidDiscovery()` pattern — check type of every field
- **Storage pattern:** Constructor with optional key parameter for testability
- **Duplicate protection:** `addCompletion()` must check for existing actId before appending (defense in depth)
- **Detection:** Load profile once into a `Set` for O(1) lookups (H1 fix from 19.1 review)
- **CSS variables:** Only use variables that actually exist in the theme (verify against main.css)
- **Test helper hoisting:** Define test helpers at the parent `describe` scope
- **Version validation:** Use `Number.isInteger()` && `>= 1` (M4 fix from 19.1 review)

### CSS Variables Available (Verified)

From existing `styles/main.css` theme definitions:
- `--da-bg-primary`, `--da-bg-secondary`, `--da-bg-tertiary`
- `--da-text-primary`, `--da-text-secondary`
- `--da-border-color`
- `--da-accent`
- `--da-font-mono`
- Z-index: `--da-z-toast: 900`, `--da-z-modal-backdrop: 1000`, `--da-z-modal: 1001`

Do NOT invent new CSS variables.

### Project Structure Notes

```
digital-archaeology-web/src/
  progress/                      ← Extends Epic 19 foundation
    types.ts                     ← ADD ActCompletion types, guards, metadata
    types.test.ts                ← ADD ActCompletion type guard tests
    ActCompletionStorage.ts      ← NEW localStorage persistence
    ActCompletionStorage.test.ts ← NEW storage tests
    ActCompletionDetector.ts     ← NEW act transition detection
    ActCompletionDetector.test.ts← NEW detection tests
    ActCelebration.ts            ← NEW celebration overlay UI
    ActCelebration.test.ts       ← NEW celebration tests
    index.ts                     ← MODIFY: add barrel exports
  story/
    StoryController.ts           ← MODIFY: wire act completion system
    ProgressDisplay.ts           ← MODIFY: accept real completion data
    ProgressDisplay.test.ts      ← MODIFY: add tests for new parameter (if exists, create if not)
  styles/
    main.css                     ← ADD celebration overlay styles (append)
```

**Naming conventions followed:**
- Service classes: PascalCase files (`ActCompletionStorage.ts`)
- Test files: co-located `*.test.ts`
- CSS classes: `da-` prefix, kebab-case (`da-act-celebration`)

### References

- [Source: digital-archaeology-web/src/progress/types.ts] — Discovery type model to extend
- [Source: digital-archaeology-web/src/progress/DiscoveryStorage.ts] — Storage pattern to follow
- [Source: digital-archaeology-web/src/progress/DiscoveryDetector.ts] — Detection pattern to follow
- [Source: digital-archaeology-web/src/progress/DiscoveryNotification.ts] — UI notification pattern (toast variant)
- [Source: digital-archaeology-web/src/story/StoryController.ts] — Integration point for act transition detection
- [Source: digital-archaeology-web/src/story/StoryEngine.ts] — Dispatches 'story-state-changed' events
- [Source: digital-archaeology-web/src/story/StoryState.ts] — StoryProgress with position.actNumber
- [Source: digital-archaeology-web/src/story/ProgressDisplay.ts] — createProgressDisplayData() to modify
- [Source: digital-archaeology-web/src/story/content-types.ts] — StoryAct, CpuStage type definitions
- [Source: _bmad-output/implementation-artifacts/19-1-track-first-time-discoveries.md] — Previous story patterns and code review learnings
- [Source: _bmad-output/implementation-artifacts/epic-18-retro-2026-02-17.md] — CSS validation, test helper mandates
- [Source: _bmad-output/project-context.md] — TypeScript rules, naming conventions, testing rules

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No issues encountered during implementation.

### Completion Notes List

- **Task 1 (Types):** Added `ActCompletionType`, `ActCompletion`, `ActCompletionProfile`, `StoryActSummary` interfaces to `progress/types.ts`. Added `DEFAULT_ACT_COMPLETION_PROFILE` constant, `isValidActCompletion()` and `isValidActCompletionProfile()` type guards following 19.1 patterns. Added `ACT_COMPLETION_METADATA` with hardcoded display data for all 11 acts. Updated barrel exports in `index.ts`.
- **Task 2 (Storage):** Created `ActCompletionStorage` class following `DiscoveryStorage` pattern exactly. Includes `loadProfile()`, `saveProfile()`, `getProfileOrDefault()`, `addCompletion()` with duplicate protection, `hasCompletion()`, `getCompletedActNumbers()` (sorted), `clearProfile()`, and configurable storage key for testability.
- **Task 3 (Detector):** Created `ActCompletionDetector` class that detects act boundary transitions. Uses Set for O(1) lookup (H1 fix from 19.1 review). Returns `ActCompletion` only when `currentActNumber > previousActNumber`, previous act is valid, and not already completed.
- **Task 4 (Celebration UI):** Created `ActCelebration` class with modal overlay pattern (not toast). Includes backdrop + card with icon, title, era badge, message, and "Continue" button. Auto-dismisses after 6000ms. ARIA attributes (`role="dialog"`, `aria-modal`, `aria-labelledby`). Keyboard support (Escape to dismiss). Bound handler pattern for proper cleanup.
- **Task 5 (CSS):** Added celebration overlay styles to `main.css`. Uses only verified CSS variables (`--da-bg-primary`, `--da-text-primary`, `--da-accent`, `--da-border-color`, `--da-z-modal-backdrop`, `--da-z-modal`). Entering animation (fade+scale 0.9→1), exiting animation (fade+scale 1→0.95). Focus ring on Continue button. Works across themes (only uses CSS variables, no hardcoded colors).
- **Task 6 (Wiring):** Integrated act completion system into `StoryController`. Added `previousActNumber` tracking field. Detection fires in `subscribeToStateChanges()` handler when act number changes. Celebration mounted in `setRenderContainer()`. Cleanup in `destroy()`. Added `getCompletedActNumbers()` public method and `getActSummaries()` private helper.
- **Task 7 (ProgressDisplay):** Updated `createProgressDisplayData()` to accept optional `completedActNumbers` parameter. When provided, uses `includes()` check instead of naive `i < currentActNumber`. Fully backward compatible — existing callers without the parameter get unchanged behavior.
- **Task 8 (Tests):** 92 new tests across 5 test files: types.test.ts (35 new), ActCompletionStorage.test.ts (19), ActCompletionDetector.test.ts (10), ActCelebration.test.ts (13), ProgressDisplay.test.ts (15 new file). All 4,689 tests pass with 0 regressions.

### File List

- `digital-archaeology-web/src/progress/types.ts` — MODIFIED: Added ActCompletion types, guards, metadata, StoryActSummary interface
- `digital-archaeology-web/src/progress/types.test.ts` — MODIFIED: Added 35 tests for act completion types, guards, metadata
- `digital-archaeology-web/src/progress/index.ts` — MODIFIED: Added barrel exports for all new act completion types and classes
- `digital-archaeology-web/src/progress/ActCompletionStorage.ts` — NEW: localStorage persistence service
- `digital-archaeology-web/src/progress/ActCompletionStorage.test.ts` — NEW: 19 tests for storage service
- `digital-archaeology-web/src/progress/ActCompletionDetector.ts` — NEW: Act transition detection service
- `digital-archaeology-web/src/progress/ActCompletionDetector.test.ts` — NEW: 10 tests for detection service
- `digital-archaeology-web/src/progress/ActCelebration.ts` — NEW: Celebration overlay UI component
- `digital-archaeology-web/src/progress/ActCelebration.test.ts` — NEW: 13 tests for celebration UI
- `digital-archaeology-web/src/story/StoryController.ts` — MODIFIED: Wired act completion system (detection, storage, celebration)
- `digital-archaeology-web/src/story/ProgressDisplay.ts` — MODIFIED: Added optional completedActNumbers parameter
- `digital-archaeology-web/src/story/ProgressDisplay.test.ts` — NEW: 15 tests for progress display with real completion data
- `digital-archaeology-web/src/styles/main.css` — MODIFIED: Added act celebration overlay styles

## Code Review Record

### Review Date
2026-02-20

### Reviewer
Claude Opus 4.6 (adversarial code review workflow)

### Findings and Fixes

| ID | Severity | Issue | Resolution |
|----|----------|-------|------------|
| F1 | HIGH | `--da-border-color` CSS variable undefined; should be `--da-border` | Fixed in main.css (also fixed pre-existing bug in discovery toast) |
| F2 | HIGH | `dismiss()` double-invocation race — `exitTimeout` overwritten without guard | Added `if (this.exitTimeout !== null) return;` guard |
| F3 | HIGH | `startNewGame()` doesn't reset `previousActNumber` before engine fires state-changed | Added `this.previousActNumber = -1;` at start of `startNewGame()` |
| F4 | MEDIUM | `.da-act-celebration` overlay lacks z-index | Added `z-index: var(--da-z-modal-backdrop, 1000);` |
| F5 | MEDIUM | Missing focus trap and focus restoration for modal dialog | Added Tab key focus trap + `previouslyFocusedElement` save/restore |
| F6 | MEDIUM | Type guard `isValidActCompletion` accepts empty strings; no actId/actNumber cross-validation | Added `.length > 0` checks and `actId === act-${actNumber}` cross-validation |
| F7 | MEDIUM | Multi-act jumps lose intermediate completions | Changed `detect()` to return `ActCompletion[]`, loops through all acts in range |

### Test Results After Review Fixes
- 4,696 tests pass (7 new tests added for review fixes)
- 0 failures, 0 regressions

## Change Log

- 2026-02-20: Implemented Story 19.2 — Act completion tracking system with types, storage, detection, celebration UI, StoryController wiring, and ProgressDisplay update. 92 new tests, 4,689 total tests passing.
- 2026-02-20: Code review fixes — 7 issues (3 HIGH, 4 MEDIUM) resolved. CSS variable fix, dismiss race guard, startNewGame reset, z-index, focus trap/restoration, stricter type guards, multi-act jump support. 7 new tests added, 4,696 total tests passing.
