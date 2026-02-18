# Story 19.1: Track First-Time Discoveries

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want discoveries tracked,
so that I see my growth.

## Acceptance Criteria

1. **Given** I build something for the first time **When** the system detects a discovery **Then** a discovery notification appears (non-blocking toast, auto-dismisses after ~4 seconds)
2. **Given** a discovery is detected **When** the notification appears **Then** the discovery is added to my profile (persisted in localStorage)
3. **Given** I have been using the app **When** I check my discoveries **Then** discoveries include: first program assembled, first subroutine (CALL/JSR), first interrupt handler (INT/RTI), first use of stack (PUSH/POP), first program per stage (Micro4, Micro8, Micro16)
4. **Given** I have earned discoveries **When** I close and reopen the browser **Then** discoveries persist across sessions (localStorage)
5. **Given** I earn a discovery in experimentation mode **When** the discovery is recorded **Then** the discovery tracks `assembledInExperimentationMode: true` (for future Epic 19.3 achievement differentiation)

## Tasks / Subtasks

- [x] Task 1: Define discovery data model in `progress/types.ts` (AC: #2, #3, #5)
  - [x] 1.1: Create `progress/` directory under `src/` — this is the foundation module for all of Epic 19
  - [x] 1.2: Define `DiscoveryType` string literal union: `'first-assembly'` | `'first-subroutine'` | `'first-interrupt'` | `'first-stack'` | `'first-stage-micro4'` | `'first-stage-micro8'` | `'first-stage-micro16'`
  - [x] 1.3: Define `Discovery` interface with `readonly` fields: `type: DiscoveryType`, `timestamp: number` (ms since epoch), `stage: LabStage`, `experimentationMode: boolean`
  - [x] 1.4: Define `DiscoveryProfile` interface: `discoveries: readonly Discovery[]`, `version: number`
  - [x] 1.5: Define `DEFAULT_DISCOVERY_PROFILE: DiscoveryProfile` with empty discoveries array and `version: 1`
  - [x] 1.6: Define `isValidDiscovery()` and `isValidDiscoveryProfile()` type guards (same validation pattern as `isValidSettings()` in `state/types.ts`)
  - [x] 1.7: Define `DISCOVERY_METADATA: Record<DiscoveryType, { readonly title: string; readonly description: string; readonly icon: string }>` — human-readable display data for each discovery type
  - [x] 1.8: Create `progress/index.ts` barrel export

- [x] Task 2: Create `DiscoveryStorage` service in `progress/DiscoveryStorage.ts` (AC: #2, #4)
  - [x] 2.1: Create `DiscoveryStorage` class following `SettingsStorage` pattern exactly (localStorage, JSON serialization, type guards, error handling)
  - [x] 2.2: Storage key: `'digital-archaeology-discoveries'`
  - [x] 2.3: Implement `loadProfile(): DiscoveryProfile | null` — parse, validate, return or null
  - [x] 2.4: Implement `saveProfile(profile: DiscoveryProfile): void` — serialize and persist
  - [x] 2.5: Implement `getProfileOrDefault(): DiscoveryProfile` — convenience method (never returns null)
  - [x] 2.6: Implement `addDiscovery(discovery: Discovery): DiscoveryProfile` — loads profile, appends discovery, saves, returns updated profile
  - [x] 2.7: Implement `hasDiscovery(type: DiscoveryType): boolean` — checks if a discovery type already exists in profile
  - [x] 2.8: Implement `clearProfile(): void` — for testing/reset
  - [x] 2.9: Support constructor parameter for custom storage key (testability, same as `SettingsStorage`)

- [x] Task 3: Create `DiscoveryDetector` service in `progress/DiscoveryDetector.ts` (AC: #1, #3, #5)
  - [x] 3.1: Create `DiscoveryDetector` class that analyzes source code text after successful assembly to detect first-time discoveries
  - [x] 3.2: Constructor takes `DiscoveryStorage` dependency (for checking what's already discovered)
  - [x] 3.3: Implement `detect(source: string, stage: LabStage, experimentationMode: boolean): Discovery[]` — returns array of NEW discoveries (not previously earned)
  - [x] 3.4: Detection logic for `'first-assembly'`: always triggers if not yet earned (any successful assembly)
  - [x] 3.5: Detection logic for `'first-subroutine'`: scan source for subroutine-related mnemonics — `CALL`, `RET`, `JSR`, `RTS` (case-insensitive, match whole words using regex `\b(CALL|RET|JSR|RTS)\b` to avoid matching within comments or labels)
  - [x] 3.6: Detection logic for `'first-interrupt'`: scan for interrupt mnemonics — `INT`, `RTI`, `RETI`, `IRET` (same word-boundary regex)
  - [x] 3.7: Detection logic for `'first-stack'`: scan for stack mnemonics — `PUSH`, `POP`, `PUSHA`, `POPA` (same pattern)
  - [x] 3.8: Detection logic for `'first-stage-*'`: check stage parameter against `'first-stage-micro4'` / `'first-stage-micro8'` / `'first-stage-micro16'` — if this is the first successful assembly on that stage
  - [x] 3.9: For each detected discovery, construct `Discovery` object with current timestamp (`Date.now()`), stage, and experimentation mode flag
  - [x] 3.10: Filter out discoveries already in the profile (use `DiscoveryStorage.hasDiscovery()`)
  - [x] 3.11: **Important:** Strip comments from source before scanning for mnemonics — assembly comments start with `;` (everything after `;` on a line is a comment). Use regex: `source.replace(/;.*/g, '')` before mnemonic scanning

- [x] Task 4: Create `DiscoveryNotification` UI component in `progress/DiscoveryNotification.ts` (AC: #1)
  - [x] 4.1: Create `DiscoveryNotification` class with `mount(container: HTMLElement): void` and `destroy(): void` lifecycle methods
  - [x] 4.2: Implement `show(discovery: Discovery): void` — displays a toast notification with discovery title, description, and icon from `DISCOVERY_METADATA`
  - [x] 4.3: Toast structure: fixed-position overlay, bottom-right corner, `da-discovery-toast` CSS class
  - [x] 4.4: Toast entrance animation: slide up + fade in (CSS transition, `da-discovery-toast--entering`)
  - [x] 4.5: Auto-dismiss after 4000ms with fade-out animation (`da-discovery-toast--exiting`), remove from DOM after animation
  - [x] 4.6: If multiple discoveries fire simultaneously, queue them (show one at a time, 500ms gap between dismissal and next)
  - [x] 4.7: Use `textContent` for user-facing strings (no innerHTML XSS risk) — the icon and title come from hardcoded `DISCOVERY_METADATA`, not user input
  - [x] 4.8: Accessibility: `role="status"` and `aria-live="polite"` on toast container so screen readers announce discoveries
  - [x] 4.9: Proper cleanup in `destroy()`: clear any pending timeouts, remove element from DOM

- [x] Task 5: Add CSS styles for discovery notification in `styles/main.css` (AC: #1)
  - [x] 5.1: Add `.da-discovery-toast` base styles — fixed position, bottom-right, z-index above toolbar, rounded corners, padding, shadow
  - [x] 5.2: Use existing CSS variables: `--da-bg-secondary`, `--da-text-primary`, `--da-border-color`, `--da-accent` for theming
  - [x] 5.3: Add `.da-discovery-toast--entering` animation: `translateY(20px) → translateY(0)` + `opacity: 0 → 1` (300ms ease-out)
  - [x] 5.4: Add `.da-discovery-toast--exiting` animation: `opacity: 1 → 0` + `translateY(0) → translateY(10px)` (200ms ease-in)
  - [x] 5.5: Add `.da-discovery-toast__icon` styles — larger font size for emoji icon
  - [x] 5.6: Add `.da-discovery-toast__title` styles — bold, `--da-text-primary`
  - [x] 5.7: Add `.da-discovery-toast__description` styles — smaller font, `--da-text-secondary`
  - [x] 5.8: Ensure styles work in both `lab-mode` and `story-mode` themes
  - [x] 5.9: **CSS Variable Validation** (Epic 18 retro action item): verify ALL CSS variables used actually exist in the theme. Only use variables from the established theme. If a needed variable doesn't exist, use a hardcoded value matching existing patterns

- [x] Task 6: Wire discovery system into App.ts (AC: #1, #2, #3, #4, #5)
  - [x] 6.1: Add `private discoveryStorage: DiscoveryStorage` and `private discoveryDetector: DiscoveryDetector` properties to App class
  - [x] 6.2: Add `private discoveryNotification: DiscoveryNotification | null = null` property
  - [x] 6.3: In `App` constructor or `init()`: instantiate `DiscoveryStorage`, then `DiscoveryDetector(discoveryStorage)`
  - [x] 6.4: In `mountUI()` or equivalent: create `DiscoveryNotification`, mount to app container
  - [x] 6.5: In `handleAssemble()` success path (after `result.success` check, after `this.hasValidAssembly = true`): call `this.discoveryDetector.detect(source, this.currentStage, result.assembledInExperimentationMode ?? false)`
  - [x] 6.6: For each returned new discovery: call `this.discoveryStorage.addDiscovery(discovery)` then `this.discoveryNotification?.show(discovery)`
  - [x] 6.7: In `destroy()`: call `this.discoveryNotification?.destroy()`
  - [x] 6.8: Import `DiscoveryStorage`, `DiscoveryDetector`, `DiscoveryNotification` from `'../progress'`

- [x] Task 7: Write comprehensive tests (AC: #1, #2, #3, #4, #5)
  - [x] 7.1: **progress/types.test.ts** — Test `isValidDiscovery()` accepts valid discoveries
  - [x] 7.2: Test `isValidDiscovery()` rejects invalid discoveries (missing fields, wrong types)
  - [x] 7.3: Test `isValidDiscoveryProfile()` accepts valid profiles
  - [x] 7.4: Test `isValidDiscoveryProfile()` rejects invalid profiles
  - [x] 7.5: Test `DEFAULT_DISCOVERY_PROFILE` has empty discoveries and version 1
  - [x] 7.6: Test `DISCOVERY_METADATA` has entries for every `DiscoveryType`
  - [x] 7.7: **progress/DiscoveryStorage.test.ts** — Test `loadProfile()` returns null when no data
  - [x] 7.8: Test `saveProfile()` + `loadProfile()` round-trip
  - [x] 7.9: Test `getProfileOrDefault()` returns default when no data
  - [x] 7.10: Test `addDiscovery()` appends to existing profile
  - [x] 7.11: Test `hasDiscovery()` returns true for existing type, false for missing type
  - [x] 7.12: Test `clearProfile()` removes data
  - [x] 7.13: Test localStorage error handling (graceful failure)
  - [x] 7.14: **progress/DiscoveryDetector.test.ts** — Test detects `'first-assembly'` on first successful assembly
  - [x] 7.15: Test does NOT re-detect `'first-assembly'` if already earned
  - [x] 7.16: Test detects `'first-subroutine'` when source contains `CALL` instruction
  - [x] 7.17: Test detects `'first-subroutine'` when source contains `JSR` instruction
  - [x] 7.18: Test does NOT detect `'first-subroutine'` when CALL appears only in a comment (after `;`)
  - [x] 7.19: Test detects `'first-interrupt'` when source contains `INT` instruction
  - [x] 7.20: Test does NOT detect `'first-interrupt'` when INT appears inside a label name (e.g., `PRINT:`)
  - [x] 7.21: Test detects `'first-stack'` when source contains `PUSH`/`POP`
  - [x] 7.22: Test detects `'first-stage-micro4'` on first assembly in micro4 stage
  - [x] 7.23: Test detects `'first-stage-micro8'` on first assembly in micro8 stage
  - [x] 7.24: Test multiple discoveries can fire simultaneously (e.g., first assembly + first stage + first subroutine all at once)
  - [x] 7.25: Test experimentation mode flag is correctly set on discoveries
  - [x] 7.26: **progress/DiscoveryNotification.test.ts** — Test mount creates container with correct ARIA attributes
  - [x] 7.27: Test `show()` creates toast element with discovery title and icon
  - [x] 7.28: Test toast has entering CSS class initially
  - [x] 7.29: Test toast auto-dismisses after timeout (use `vi.useFakeTimers()`)
  - [x] 7.30: Test multiple show() calls queue properly (only one visible at a time)
  - [x] 7.31: Test `destroy()` cleans up pending timeouts and DOM elements

## Dev Notes

### Architecture Context

**This story is the foundation for Epic 19 (Progress & Journey Tracking).** It creates the `progress/` module that Stories 19.2-19.6 will build upon. The data model, storage, and detection patterns established here must be extensible for:
- Story 19.2: Act completion tracking (extends `DiscoveryProfile` or creates sibling `ActProgress`)
- Story 19.3: Milestone achievements (reads discoveries, adds achievement layer)
- Story 19.5: Stage unlock system (reads first-stage discoveries)
- Story 19.6: Statistics dashboard (reads all discoveries for summary)

### Assembly Flow — Where Detection Fits

```
App.handleAssemble()
  → assemblerBridge.assemble(source)
  → result.success === true
    → hasValidAssembly = true
    → ★ NEW: discoveryDetector.detect(source, currentStage, result.assembledInExperimentationMode)
    → ★ NEW: for each new discovery → storage.addDiscovery() + notification.show()
    → toolbar.updateState(canRun: true, ...)
    → loadProgramIntoEmulator(result.binary)
```

Discovery detection happens AFTER successful assembly but BEFORE program loading. This ensures we only track discoveries for valid programs. Detection is synchronous (source text scanning) — no async needed.

### Mnemonic Detection Strategy

Source code is plain text. Strip comments first (`source.replace(/;.*/g, '')`), then use word-boundary regex to find instruction mnemonics. This avoids false positives from comments and label names.

**Critical:** Do NOT use the `STAGE_INSTRUCTIONS` sets from stageConfig.ts for detection. Those track what's ALLOWED at a stage. Discovery detection needs to find what instructions the user ACTUALLY USED, regardless of stage constraints. Use explicit mnemonic lists per discovery type.

### Persistence Strategy

localStorage (same as SettingsStorage) because:
- Discovery profiles are small (~1KB even with many discoveries)
- Synchronous access is fine (only written on assembly success)
- Consistent with existing persistence patterns
- No need for IndexedDB complexity

Storage key: `'digital-archaeology-discoveries'` — separate from settings to keep concerns isolated and avoid settings migration complexity.

### Previous Story Intelligence (Story 18.5)

Patterns to follow from Epic 18:
- **Readonly interfaces:** All `Discovery` and `DiscoveryProfile` fields should be `readonly`
- **Type guards:** Follow `isValidSettings()` pattern exactly — check type of every field
- **SettingsStorage pattern:** Constructor with optional key parameter for testing
- **CSS variables:** Only use variables that actually exist in the theme (Epic 18 retro action item)
- **Test helper hoisting:** Define test helpers at the parent `describe` scope, not inside nested blocks (Epic 18 retro action item)

### CSS Variables Available (Verified)

From existing `styles/main.css` theme definitions:
- `--da-bg-primary`, `--da-bg-secondary`, `--da-bg-tertiary`
- `--da-text-primary`, `--da-text-secondary`
- `--da-border-color`
- `--da-accent`
- `--da-font-mono`

Do NOT invent new CSS variables. If a needed variable doesn't exist, use a hardcoded value matching existing patterns.

### Project Structure Notes

```
digital-archaeology-web/src/
  progress/                      ← NEW module (Epic 19 foundation)
    types.ts                     ← Discovery data model, type guards, metadata
    types.test.ts                ← Type guard tests
    DiscoveryStorage.ts          ← localStorage persistence
    DiscoveryStorage.test.ts     ← Storage tests
    DiscoveryDetector.ts         ← Source code analysis for discoveries
    DiscoveryDetector.test.ts    ← Detection logic tests
    DiscoveryNotification.ts     ← Toast notification UI
    DiscoveryNotification.test.ts← Notification tests
    index.ts                     ← Barrel exports
  styles/
    main.css                     ← ADD discovery toast styles (append to existing)
  ui/
    App.ts                       ← MODIFY: wire discovery system into handleAssemble
    App.test.ts                  ← MODIFY: add discovery integration tests
```

**Naming conventions followed:**
- Service classes: PascalCase files (`DiscoveryStorage.ts`)
- Type files: `types.ts` (per project convention)
- Test files: co-located `*.test.ts`
- CSS classes: `da-` prefix, kebab-case (`da-discovery-toast`)

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Persistence] — localStorage for settings-like data
- [Source: digital-archaeology-web/src/state/SettingsStorage.ts] — Persistence service pattern to follow
- [Source: digital-archaeology-web/src/state/types.ts] — Type guard pattern, AppSettings structure
- [Source: digital-archaeology-web/src/config/stageConfig.ts] — InstructionCategory, StageConstraints, LabStage types
- [Source: digital-archaeology-web/src/ui/App.ts:3395-3500] — handleAssemble() flow where detection integrates
- [Source: digital-archaeology-web/src/emulator/types.ts:166-175] — AssembleResult with assembledInExperimentationMode flag
- [Source: _bmad-output/implementation-artifacts/epic-18-retro-2026-02-17.md#Action Items] — CSS variable validation, test helper hoisting mandates
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 19] — Full epic context, all 6 stories

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- All 7 tasks implemented and tested
- 90 total tests: 32 (types) + 19 (storage) + 26 (detector) + 13 (notification) + 7 (App integration)
- All tests pass on first run (zero regressions)
- Removed unused `ENTER_DURATION_MS` constant to fix TS6133 lint error
- Pre-existing type errors in Editor.test.ts and App.test.ts are unrelated to this story
- **Code review fixes applied (1H 4M 2L):**
  - H1: DiscoveryDetector.detect() loads profile once into Set instead of 5 redundant localStorage reads
  - M1: DiscoveryStorage.addDiscovery() now guards against duplicate types
  - M2: DiscoveryNotification.mount() calls destroy() if already mounted (double-mount guard)
  - M3: Added RET-only and RTS-only test cases to DiscoveryDetector.test.ts
  - M4: isValidDiscoveryProfile() adds Number.isInteger() and >= 1 checks for version
  - L1: Discovery toast z-index uses centralized --da-z-toast CSS variable (900)
  - L2: Fixed subtask formatting in story file (missing space after [x])

### File List

**New files:**
- `digital-archaeology-web/src/progress/types.ts` — Discovery data model, type guards, metadata
- `digital-archaeology-web/src/progress/types.test.ts` — 28 tests for type guards and metadata
- `digital-archaeology-web/src/progress/DiscoveryStorage.ts` — localStorage persistence service
- `digital-archaeology-web/src/progress/DiscoveryStorage.test.ts` — 18 tests for storage operations
- `digital-archaeology-web/src/progress/DiscoveryDetector.ts` — Source code analysis for discoveries
- `digital-archaeology-web/src/progress/DiscoveryDetector.test.ts` — 24 tests for detection logic
- `digital-archaeology-web/src/progress/DiscoveryNotification.ts` — Toast notification UI component
- `digital-archaeology-web/src/progress/DiscoveryNotification.test.ts` — 13 tests for notification lifecycle
- `digital-archaeology-web/src/progress/index.ts` — Barrel exports

**Modified files:**
- `digital-archaeology-web/src/styles/main.css` — Added discovery toast CSS styles
- `digital-archaeology-web/src/ui/App.ts` — Wired discovery system into handleAssemble success path
- `digital-archaeology-web/src/ui/App.test.ts` — Added 7 discovery tracking integration tests
