# Story 19.3: Create Milestone Achievements

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want milestone achievements,
so that I feel accomplished.

## Acceptance Criteria

1. **Given** I reach a significant milestone (e.g., earn my first discovery, complete multiple acts, use all CPU stages) **When** an achievement triggers **Then** I see an achievement toast notification with icon, title, and description
2. **Given** achievements exist **When** I view the achievement gallery **Then** I see a grid of all possible achievements with earned ones highlighted and locked ones grayed out
3. **Given** I have earned achievements **When** I view the gallery **Then** each achievement shows its icon, title, description, and when it was earned
4. **Given** achievements are earned **When** I close and reopen the browser **Then** achievements persist across sessions (localStorage)
5. **Given** the achievement gallery is open **When** I press Escape or click a close button **Then** the gallery dismisses with animation and focus is restored

## Tasks / Subtasks

- [x] Task 1: Define achievement data model in `progress/types.ts` (AC: #2, #3, #4)
  - [x] 1.1: Add `AchievementType` string literal union with all achievement IDs (see Achievement Catalog below)
  - [x] 1.2: Add `AchievementTier` type: `'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'`
  - [x] 1.3: Define `Achievement` interface with `readonly` fields: `type: AchievementType`, `timestamp: number` (ms since epoch), `tier: AchievementTier`
  - [x] 1.4: Define `AchievementProfile` interface: `completions: readonly Achievement[]`, `version: number`
  - [x] 1.5: Define `DEFAULT_ACHIEVEMENT_PROFILE: AchievementProfile` with empty completions and `version: 1`
  - [x] 1.6: Define `isValidAchievement()` and `isValidAchievementProfile()` type guards (follow `isValidDiscovery()` pattern exactly — validate type of every field, non-empty strings, tier membership)
  - [x] 1.7: Define `AchievementMetadataEntry` interface: `{ readonly title: string; readonly description: string; readonly icon: string; readonly tier: AchievementTier }`
  - [x] 1.8: Define `ACHIEVEMENT_METADATA: Record<AchievementType, AchievementMetadataEntry>` — hardcoded display data for every achievement (see Achievement Catalog)
  - [x] 1.9: Update `progress/index.ts` barrel exports with all new types, guards, constants

- [x] Task 2: Create `AchievementStorage` service in `progress/AchievementStorage.ts` (AC: #4)
  - [x] 2.1: Create `AchievementStorage` class following `DiscoveryStorage` pattern exactly
  - [x] 2.2: Storage key: `'digital-archaeology-achievements'`
  - [x] 2.3: Implement `loadProfile(): AchievementProfile | null` — parse, validate, return or null
  - [x] 2.4: Implement `saveProfile(profile: AchievementProfile): void` — serialize and persist
  - [x] 2.5: Implement `getProfileOrDefault(): AchievementProfile` — convenience method (never returns null)
  - [x] 2.6: Implement `addAchievement(achievement: Achievement): AchievementProfile` — with duplicate protection on `type` field
  - [x] 2.7: Implement `hasAchievement(type: AchievementType): boolean` — quick lookup
  - [x] 2.8: Implement `getEarnedAchievementTypes(): AchievementType[]` — sorted by timestamp
  - [x] 2.9: Implement `clearProfile(): void` — for testing/reset
  - [x] 2.10: Support constructor parameter for custom storage key (testability)

- [x] Task 3: Create `AchievementDetector` service in `progress/AchievementDetector.ts` (AC: #1)
  - [x] 3.1: Create `AchievementDetector` class with dependencies: `AchievementStorage`, `DiscoveryStorage`, `ActCompletionStorage`
  - [x] 3.2: Implement `evaluate(): Achievement[]` — checks all milestone conditions against current state of all three profiles, returns only NEW achievements not yet earned
  - [x] 3.3: Load all three profiles into local variables at start of `evaluate()` for efficiency
  - [x] 3.4: Build Set of already-earned achievement types for O(1) lookup
  - [x] 3.5: Check each achievement condition (see Achievement Conditions table) — create `Achievement` with `Date.now()` timestamp for each newly triggered milestone
  - [x] 3.6: Return empty array if no new achievements (common case)

- [x] Task 4: Create `AchievementToast` notification UI in `progress/AchievementToast.ts` (AC: #1)
  - [x] 4.1: Create `AchievementToast` class following `DiscoveryNotification` pattern (toast at bottom-right)
  - [x] 4.2: Implement `mount(container: HTMLElement): void` — creates toast container with correct z-index
  - [x] 4.3: Implement `show(achievement: Achievement): void` — displays toast with icon, title, description from `ACHIEVEMENT_METADATA`
  - [x] 4.4: Include a small "View Achievements" link/button in the toast that triggers gallery open callback
  - [x] 4.5: Auto-dismiss after 5000ms
  - [x] 4.6: Support queuing (if multiple achievements earned at once, show one at a time with 600ms gap)
  - [x] 4.7: ARIA: `role="status"`, `aria-live="polite"`
  - [x] 4.8: CSS class: `da-achievement-toast` with `--entering` and `--exiting` animation classes
  - [x] 4.9: Use `textContent` for all user-facing strings (XSS safe)
  - [x] 4.10: Implement `destroy(): void` — clean up timeouts, DOM elements, event listeners
  - [x] 4.11: Optional `onGalleryOpen` callback for toast "View Achievements" action

- [x] Task 5: Create `AchievementGallery` UI component in `progress/AchievementGallery.ts` (AC: #2, #3, #5)
  - [x] 5.1: Create `AchievementGallery` class with `mount(container: HTMLElement): void` and `destroy(): void` lifecycle
  - [x] 5.2: Implement `show(earnedTypes: AchievementType[]): void` — opens the gallery modal with current achievement state
  - [x] 5.3: Implement `hide(): void` — dismisses gallery with exit animation
  - [x] 5.4: Gallery structure: full-screen modal overlay (same backdrop pattern as ActCelebration) with scrollable content area
  - [x] 5.5: Header: "Achievements" title with close button (X icon)
  - [x] 5.6: Grid layout of achievement cards (CSS Grid, 3 columns desktop, 2 tablet, 1 mobile via media queries)
  - [x] 5.7: Each card shows: icon (large), title, description, tier badge, earned timestamp ("Earned: Feb 20, 2026") or "Locked" state
  - [x] 5.8: Locked achievements: grayed out icon, "???" description, visible title (so users know what to aim for)
  - [x] 5.9: Earned achievements: full color, glow border using tier color (common=gray, uncommon=green, rare=blue, epic=purple, legendary=gold — mapped to existing CSS variables or inline)
  - [x] 5.10: ARIA: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to header
  - [x] 5.11: Escape key closes gallery
  - [x] 5.12: Focus trap within gallery (Tab cycles through close button and cards)
  - [x] 5.13: Focus restoration after close (save `document.activeElement` before open)
  - [x] 5.14: Scroll to top when opened
  - [x] 5.15: Use `textContent` for all user-facing strings
  - [x] 5.16: Counter in header: "X / Y Earned" showing progress

- [x] Task 6: Add CSS styles in `styles/main.css` (AC: #1, #2, #3)
  - [x] 6.1: Achievement toast styles (`.da-achievement-toast`, `--entering`, `--exiting`) — follow discovery toast pattern but with tier-colored left border
  - [x] 6.2: Achievement gallery overlay (`.da-achievement-gallery`) — full viewport, z-index `var(--da-z-modal-backdrop, 1000)` / `var(--da-z-modal, 1001)`
  - [x] 6.3: Gallery content area (`.da-achievement-gallery__content`) — scrollable, max-height 80vh, padding
  - [x] 6.4: Achievement card grid (`.da-achievement-gallery__grid`) — CSS Grid, responsive columns
  - [x] 6.5: Achievement card (`.da-achievement-card`) — border, padding, icon, title, description layout
  - [x] 6.6: Card locked state (`.da-achievement-card--locked`) — `opacity: 0.5`, grayscale filter on icon
  - [x] 6.7: Card earned state with tier glow (`.da-achievement-card--common`, `--uncommon`, `--rare`, `--epic`, `--legendary`)
  - [x] 6.8: Tier badge (`.da-achievement-card__tier`) — small colored badge
  - [x] 6.9: Entering/exiting animations for gallery (fade + scale, same as ActCelebration)
  - [x] 6.10: Close button styles (`.da-achievement-gallery__close`)
  - [x] 6.11: **CSS Variable Validation**: verify ALL CSS variables used actually exist (the actual variable is `--da-border`, NOT `--da-border-color`)
  - [x] 6.12: Use only existing CSS variables — do NOT invent new ones. For tier colors, use inline styles or data-attributes mapped to the 5 tier colors

- [x] Task 7: Wire achievement system into StoryController.ts and App.ts (AC: #1)
  - [x] 7.1: Add `AchievementStorage` import and class property in StoryController
  - [x] 7.2: Add `AchievementDetector` (with all 3 storage dependencies) in StoryController
  - [x] 7.3: Add `AchievementToast` and `AchievementGallery` UI components in StoryController
  - [x] 7.4: In `subscribeToStateChanges()`: after act completion detection, call `achievementDetector.evaluate()` and show toasts for new achievements
  - [x] 7.5: Wire `AchievementToast.onGalleryOpen` to open `AchievementGallery`
  - [x] 7.6: Mount toast and gallery in `setRenderContainer()`
  - [x] 7.7: Cleanup in `destroy()`
  - [x] 7.8: Add `getEarnedAchievements(): AchievementType[]` public method
  - [x] 7.9: In App.ts: after discovery detection in `handleAssemble()`, also evaluate achievements
  - [x] 7.10: App.ts: add `AchievementStorage` and `AchievementDetector` properties (share storage instance so both App and StoryController read the same data)

- [x] Task 8: Write comprehensive tests (AC: #1, #2, #3, #4, #5)
  - [x] 8.1: **progress/types.test.ts** — Test `isValidAchievement()` accepts valid achievements for all types and tiers
  - [x] 8.2: Test `isValidAchievement()` rejects invalid data (missing fields, wrong types, invalid tier, empty strings)
  - [x] 8.3: Test `isValidAchievementProfile()` accepts valid profiles, rejects invalid (version checks)
  - [x] 8.4: Test `DEFAULT_ACHIEVEMENT_PROFILE` has empty completions and version 1
  - [x] 8.5: Test `ACHIEVEMENT_METADATA` has entries for all achievement types with non-empty title, description, icon, tier
  - [x] 8.6: **progress/AchievementStorage.test.ts** — Test full CRUD: load/save/getOrDefault/add/has/getEarned/clear
  - [x] 8.7: Test duplicate protection (same type silently skipped)
  - [x] 8.8: Test localStorage error handling
  - [x] 8.9: **progress/AchievementDetector.test.ts** — Test each achievement condition triggers correctly
  - [x] 8.10: Test already-earned achievements are not re-triggered
  - [x] 8.11: Test returns empty array when no new achievements
  - [x] 8.12: Test multiple achievements earned simultaneously
  - [x] 8.13: **progress/AchievementToast.test.ts** — Test mount, show, auto-dismiss, queue, destroy, ARIA
  - [x] 8.14: **progress/AchievementGallery.test.ts** — Test show/hide, grid rendering, earned vs locked states, Escape close, focus trap, counter
  - [x] 8.15: Test gallery accessibility (role, aria-modal, aria-labelledby)

## Dev Notes

### Architecture Context

**This is the third and final "tracking" story in Epic 19's foundation trilogy.** Stories 19.1 (discoveries) and 19.2 (act completions) established patterns for types → storage → detection → notification → wiring. Story 19.3 follows the same pattern but adds a **gallery view** for browsing all achievements.

**Key difference from 19.1/19.2:** Achievements are **composite milestones** — they're triggered by combinations of discoveries, act completions, and user actions, not by a single event. The `AchievementDetector` needs to read from all three storage profiles (Discovery, ActCompletion, Achievement) to evaluate whether milestone conditions are met.

### Achievement Catalog

| AchievementType | Title | Description | Tier | Condition |
|-----------------|-------|-------------|------|-----------|
| `first-discovery` | First Discovery | Earned your first discovery | common | `discoveryProfile.discoveries.length >= 1` |
| `discovery-collector` | Discovery Collector | Earned 3 discoveries | uncommon | `discoveryProfile.discoveries.length >= 3` |
| `discovery-master` | Discovery Master | Earned all 7 discovery types | rare | `discoveryProfile.discoveries.length >= 7` |
| `first-act-complete` | Chapter One | Completed your first act | common | `actCompletionProfile.completions.length >= 1` |
| `acts-explorer` | Acts Explorer | Completed 3 acts | uncommon | `actCompletionProfile.completions.length >= 3` |
| `halfway-there` | Halfway There | Completed 5 acts | rare | `actCompletionProfile.completions.length >= 5` |
| `story-completionist` | Story Completionist | Completed all 11 acts | legendary | `actCompletionProfile.completions.length >= 11` |
| `micro4-graduate` | Micro4 Graduate | Completed the Micro4 era (Act 4) | uncommon | Has `act-4` in completions |
| `micro8-graduate` | Micro8 Graduate | Completed the Micro8 era (Act 5) | uncommon | Has `act-5` in completions |
| `micro16-graduate` | Micro16 Graduate | Completed the Micro16 era (Act 6) | rare | Has `act-6` in completions |
| `code-pioneer` | Code Pioneer | Assembled your first program | common | Has `first-assembly` discovery |
| `subroutine-architect` | Subroutine Architect | Used subroutines for the first time | uncommon | Has `first-subroutine` discovery |
| `interrupt-expert` | Interrupt Expert | Wrote your first interrupt handler | rare | Has `first-interrupt` discovery |
| `stack-wizard` | Stack Wizard | Used stack operations | uncommon | Has `first-stack` discovery |
| `multi-stage-explorer` | Multi-Stage Explorer | Assembled in 2+ CPU stages | rare | Has 2+ `first-stage-*` discoveries |
| `all-stages-master` | All Stages Master | Assembled in all 3 CPU stages | epic | Has all 3 `first-stage-*` discoveries |

**Total: 16 achievements** (3 common, 6 uncommon, 5 rare, 1 epic, 1 legendary)

### Achievement Conditions Table

Each condition is evaluated by `AchievementDetector.evaluate()`:

```typescript
// Pseudocode for condition evaluation
const discoveryCount = discoveryProfile.discoveries.length;
const actCompletionCount = actCompletionProfile.completions.length;
const discoveryTypes = new Set(discoveryProfile.discoveries.map(d => d.type));
const completedActIds = new Set(actCompletionProfile.completions.map(c => c.actId));
const stageDiscoveries = discoveryProfile.discoveries.filter(d => d.type.startsWith('first-stage-'));

// Check each condition, create Achievement if not already earned
```

### Previous Story Intelligence (Story 19.2)

**Critical patterns and code review learnings to carry forward:**

- **CSS variable `--da-border`** — The actual variable name. DO NOT use `--da-border-color` (was a bug fixed in 19.2 code review F1)
- **Focus trap pattern** — Modal dialogs need: save `document.activeElement` before open, trap Tab key, restore focus on close (19.2 F5 fix)
- **Dismiss race guard** — Any dismissable UI with exit animation needs: `if (this.exitTimeout !== null) return;` at start of dismiss method (19.2 F2 fix)
- **Type guard strictness** — Validate non-empty strings with `.length > 0`, cross-validate related fields (19.2 F6 fix)
- **Multi-event handling** — When detector returns array, store all then show notification for latest only (19.2 F7 fix)
- **startNewGame reset** — Reset tracking state before engine fires state-changed events (19.2 F3 fix)
- **Readonly interfaces** — All fields `readonly`
- **Type guards** — Validate every field type, use `Number.isInteger()` for version, `>= 1` check
- **Storage pattern** — Constructor with custom key, duplicate protection, silent error handling
- **Detection** — Load profile once into Set for O(1) lookup (H1 fix from 19.1 review)
- **Version validation** — `Number.isInteger(version) && version >= 1` (M4 fix from 19.1)

### CSS Variables Available (Verified from main.css)

**DO NOT INVENT NEW VARIABLES. DO NOT USE `--da-border-color`.**

From existing `styles/main.css` theme definitions:
- `--da-bg-primary`, `--da-bg-secondary`, `--da-bg-tertiary`, `--da-bg-hover`
- `--da-text-primary`, `--da-text-secondary`
- `--da-border` (defined as `#3a3a52` in lab/story themes, `#2a2a38` in dark variant)
- `--da-accent`, `--da-accent-hover`
- `--da-error`, `--da-warning`, `--da-success`, `--da-constraint`
- `--da-font-mono`
- Z-index: `--da-z-tooltip: 200`, `--da-z-toast: 900`, `--da-z-modal-backdrop: 1000`, `--da-z-modal: 1001`

**For tier colors** (not existing CSS variables): Use inline styles or data-tier attributes. Suggested tier colors:
- Common: `#9e9e9e` (gray)
- Uncommon: `#4caf50` (green) — close to `--da-success`
- Rare: `#2196f3` (blue) — close to `--da-accent`
- Epic: `#9c27b0` (purple) — close to `--da-constraint`
- Legendary: `#ffd700` (gold)

### Dual Integration Points

**This story has TWO integration points, unlike 19.2 (StoryController only):**

1. **StoryController.ts** — After act completion detection, evaluate achievements (detects act-based and discovery-based milestones on story state changes)
2. **App.ts** — After discovery detection in `handleAssemble()`, evaluate achievements (detects lab-mode milestones immediately when discoveries are earned)

**Shared storage:** Both integration points read/write the same `AchievementStorage` instance. Recommended approach: create a single `AchievementStorage` instance and pass it to both contexts. If this is complex, both can instantiate their own — localStorage is the shared state.

### Project Structure Notes

```
digital-archaeology-web/src/
  progress/                          ← Extends Epic 19 foundation
    types.ts                         ← ADD Achievement types, guards, metadata
    types.test.ts                    ← ADD Achievement type guard tests
    AchievementStorage.ts            ← NEW localStorage persistence
    AchievementStorage.test.ts       ← NEW storage tests
    AchievementDetector.ts           ← NEW milestone evaluation service
    AchievementDetector.test.ts      ← NEW detection tests
    AchievementToast.ts              ← NEW toast notification UI
    AchievementToast.test.ts         ← NEW toast tests
    AchievementGallery.ts            ← NEW gallery modal UI
    AchievementGallery.test.ts       ← NEW gallery tests
    index.ts                         ← MODIFY: add barrel exports
  story/
    StoryController.ts               ← MODIFY: wire achievement detection + gallery
  ui/
    App.ts                           ← MODIFY: wire achievement detection after assembly
  styles/
    main.css                         ← ADD achievement toast + gallery styles (append)
```

**Naming conventions followed:**
- Service classes: PascalCase files (`AchievementStorage.ts`)
- Test files: co-located `*.test.ts`
- CSS classes: `da-` prefix, kebab-case (`da-achievement-toast`, `da-achievement-gallery`)

### References

- [Source: digital-archaeology-web/src/progress/types.ts] — Discovery + ActCompletion type models to extend
- [Source: digital-archaeology-web/src/progress/DiscoveryStorage.ts] — Storage pattern to follow
- [Source: digital-archaeology-web/src/progress/DiscoveryDetector.ts] — Detection pattern (source code analysis)
- [Source: digital-archaeology-web/src/progress/ActCompletionDetector.ts] — Detection pattern (state transition)
- [Source: digital-archaeology-web/src/progress/DiscoveryNotification.ts] — Toast UI pattern to follow
- [Source: digital-archaeology-web/src/progress/ActCelebration.ts] — Modal overlay pattern (gallery reference)
- [Source: digital-archaeology-web/src/progress/index.ts] — Barrel exports to extend
- [Source: digital-archaeology-web/src/story/StoryController.ts] — Story mode integration point
- [Source: digital-archaeology-web/src/ui/App.ts] — Lab mode integration point (discovery wiring at handleAssemble)
- [Source: digital-archaeology-web/src/styles/main.css] — CSS variables and theme definitions
- [Source: digital-archaeology-web/src/story/content-types.ts] — StoryAct, CpuStage definitions
- [Source: _bmad-output/implementation-artifacts/19-2-track-act-completion.md] — Previous story patterns and ALL code review learnings
- [Source: _bmad-output/implementation-artifacts/19-1-track-first-time-discoveries.md] — Original pattern foundation
- [Source: _bmad-output/project-context.md] — TypeScript rules, naming conventions, testing rules

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — clean implementation, no issues encountered.

### Completion Notes List

- All 8 tasks implemented following red-green-refactor cycle
- 121 new tests added (4,696 → 4,817 total)
- TypeScript compilation clean (no new errors)
- Full test suite passes: 4,817 tests, 118 test files
- Achievement catalog: 16 achievements across 5 tiers (3 common, 6 uncommon, 5 rare, 1 epic, 1 legendary)
- Note: Story description said "(5 common, 5 uncommon, 4 rare, 1 epic, 1 legendary)" but actual catalog table specified different distribution — followed catalog table as source of truth
- Dual integration points wired: StoryController (state changes) + App.ts (assembly events)
- Both integration points share localStorage keys (not instances) for cross-context state

### File List

**New files:**
- `digital-archaeology-web/src/progress/AchievementStorage.ts` — localStorage persistence service
- `digital-archaeology-web/src/progress/AchievementStorage.test.ts` — 23 tests
- `digital-archaeology-web/src/progress/AchievementDetector.ts` — Milestone evaluation service
- `digital-archaeology-web/src/progress/AchievementDetector.test.ts` — 23 tests
- `digital-archaeology-web/src/progress/AchievementToast.ts` — Toast notification UI
- `digital-archaeology-web/src/progress/AchievementToast.test.ts` — 18 tests
- `digital-archaeology-web/src/progress/AchievementGallery.ts` — Gallery modal UI
- `digital-archaeology-web/src/progress/AchievementGallery.test.ts` — 25 tests

**Modified files:**
- `digital-archaeology-web/src/progress/types.ts` — Added achievement types, guards, metadata (16 achievements)
- `digital-archaeology-web/src/progress/types.test.ts` — Added 32 achievement type tests
- `digital-archaeology-web/src/progress/index.ts` — Added barrel exports for all achievement modules
- `digital-archaeology-web/src/styles/main.css` — Added achievement toast + gallery CSS styles
- `digital-archaeology-web/src/story/StoryController.ts` — Wired achievement detection, toast, gallery
- `digital-archaeology-web/src/ui/App.ts` — Wired achievement detection after assembly

## Change Log

- 2026-02-20: Story created by create-story workflow — comprehensive developer guide with achievement catalog, detection conditions, dual integration points, gallery UI, and all code review learnings from 19.1 + 19.2.
- 2026-02-20: Implementation complete — all 8 tasks done, 121 new tests, 4817 total tests passing. Ready for code review.
- 2026-02-20: Code review complete — 5 findings (2 HIGH, 2 MEDIUM, 1 LOW). Fixed F1 (added tier-specific CSS glow classes), F2 (wired achievement queuing in both integration points), F3 (corrected tier distribution text), F4 (removed unused optional constructor parameter). F5 (LOW - type-tier cross-validation) deferred.
