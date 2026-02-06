# Story TD-1: Implement Choice Branching

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a learner,
I want my choices in the story to lead to different scenes and outcomes,
so that the narrative feels responsive to my decisions and I'm motivated to explore different paths.

## Origin

**Source:** Epic 10 Retrospective (2026-02-06), Gap #4
**Root Cause:** `StoryController.selectChoice()` at lines 208-216 records the choice for telemetry but calls `engine.nextScene()` which reads `scene.nextScene` — ignoring `choice.nextScene` entirely. Every choice leads to the same scene. The code has an explicit TODO comment: *"For now, choices advance to nextScene. Future: implement branching based on choice."*
**Impact:** CRITICAL — The core narrative promise (your choices matter) is broken. Story JSON files already contain branching data (`choice.nextScene` pointing to different scenes) that the engine never reads.

## Acceptance Criteria

1. **Given** a scene with 2+ choices where each choice has a different `nextScene` value, **When** the user selects Choice A, **Then** the engine navigates to Choice A's `nextScene` (NOT the scene-level `nextScene`)

2. **Given** the same scene, **When** the user selects Choice B instead, **Then** the engine navigates to Choice B's `nextScene` (different destination from Choice A)

3. **Given** a choice that has NO `nextScene` property defined, **When** the user selects it, **Then** the engine gracefully falls back to the scene-level `nextScene` property, **And** a console warning is logged indicating the choice is missing a `nextScene` (content authoring issue)

4. **Given** all story JSON files in `public/story/`, **When** the CI validation script runs, **Then** every `choice.nextScene` value references a scene ID that exists in the same act file, **And** the CI job fails if any broken reference is found

5. **Given** the user makes different choices across multiple playthroughs, **When** they reach the same choice point, **Then** the `StoryEngine` state correctly reflects the chosen branch, **And** previous/back navigation works correctly within branches

6. **Given** a branched scene that eventually converges back to the main narrative, **When** the user reaches the convergence point, **Then** navigation continues normally regardless of which branch led there

## Tasks / Subtasks

- [x] Task 1: Add `nextScene` to `ChoiceData` TypeScript Type (AC: #1, #4)
  - [x] 1.1 Add `nextScene?: string` to `ChoiceData` in `src/story/types.ts:107-116`
  - [x] 1.2 Verify `content-types.ts` imports ChoiceData from types.ts (it does — line 10)
  - [x] 1.3 Run `npm run typecheck` to ensure no regressions

- [x] Task 2: Modify StoryController to Support Branching (AC: #1, #2, #3)
  - [x] 2.1 Update `selectChoice(choiceId)` in `StoryController.ts:208-216`:
    - Look up the selected choice from `getCurrentScene().choices`
    - If `choice.nextScene` exists → call `engine.goToScene(choice.nextScene)`
    - If `choice.nextScene` is undefined → fall back to `engine.nextScene()` + log warning
  - [x] 2.2 Remove the TODO comment: "Future: implement branching based on choice"
  - [x] 2.3 Verify `engine.goToScene()` already handles history, persona, mindset updates (it does)

- [x] Task 3: Validate Branch Navigation (AC: #5, #6)
  - [x] 3.1 Verify `previousScene()` / back navigation works within branches (goToScene pushes to history)
  - [x] 3.2 Verify branch convergence — scenes from different branches can share the same `nextScene`
  - [x] 3.3 Verify `StoryState` correctly tracks the current position within a branch
  - [x] 3.4 Verify `recordChoice()` data is preserved and accessible

- [x] Task 4: CI Validation — Already Done by TD-3 (AC: #4)
  - [x] 4.1 Verify `validate-story-content.ts` already checks `choice.nextScene` references (it does — lines 144-151)
  - [x] 4.2 Verify the npm script `validate:content` exists (it does — package.json line 23). Note: CI workflow step not yet added but validation script works locally.
  - [x] 4.3 No new validation work needed — TD-3 completed this

- [x] Task 5: Unit Tests (AC: #1, #2, #3, #5, #6)
  - [x] 5.1 Test: `selectChoice()` with `choice.nextScene` navigates to that specific scene
  - [x] 5.2 Test: `selectChoice()` with different choice navigates to different scene
  - [x] 5.3 Test: `selectChoice()` without `choice.nextScene` falls back to `scene.nextScene`
  - [x] 5.4 Test: `selectChoice()` without `choice.nextScene` logs console warning
  - [x] 5.5 Test: `previousScene()` after branching returns to the choice scene
  - [x] 5.6 Test: Branch convergence — two branches leading to same scene
  - [x] 5.7 Test: `recordChoice()` stores the selected choice ID correctly (existing test — verify still passes)

- [x] Task 6: E2E Tests (AC: #1, #2)
  - [x] 6.1 E2E test: Navigate to a choice scene, select Choice A, verify resulting scene matches Choice A's target
  - [x] 6.2 E2E test: Navigate to same choice scene, select Choice B, verify DIFFERENT scene content
  - [x] 6.3 E2E test: Make a choice, use back navigation, verify return to choice scene

## Dev Notes

### Critical Context: ChoiceData Type Mismatch

**The TypeScript `ChoiceData` interface does NOT have a `nextScene` property**, but the JSON files already use it:

**TypeScript type (`src/story/types.ts:107-116`):**
```typescript
export interface ChoiceData {
  id: string;
  icon: string;
  title: string;
  description: string;
  // ← MISSING: nextScene?: string
}
```

**JSON data already has it (`act-4-micro4.json` example):**
```json
{
  "id": "choice-explore-concept",
  "icon": "🔍",
  "title": "Explore the Concept",
  "description": "...",
  "nextScene": "scene-4-1-4a"
}
```

**Impact:** When the app loads JSON data, `nextScene` is present on the runtime object but invisible to TypeScript. Adding it to the type is a required first step.

### Current Broken Code (The Fix Target)

**File:** `digital-archaeology-web/src/story/StoryController.ts:208-216`
```typescript
selectChoice(choiceId: string): void {
  try {
    this.engine.recordChoice(choiceId);
    // For now, choices advance to nextScene
    // Future: implement branching based on choice
    this.engine.nextScene();
  } catch (error) {
    console.warn('Cannot process choice:', error);
  }
}
```

### Exact Fix (Minimal Change)

```typescript
selectChoice(choiceId: string): void {
  try {
    this.engine.recordChoice(choiceId);
    const scene = this.engine.getCurrentScene();
    const choice = scene?.choices?.find(c => c.id === choiceId);
    if (choice?.nextScene) {
      this.engine.goToScene(choice.nextScene);
    } else {
      console.warn(`Choice "${choiceId}" has no nextScene — falling back to scene.nextScene`);
      this.engine.nextScene();
    }
  } catch (error) {
    console.warn('Cannot process choice:', error);
  }
}
```

### Existing Infrastructure (DO NOT Recreate)

**`StoryEngine.goToScene()` (lines 112-171)** — Already handles:
- Scene index lookup (O(1) via `sceneIndex.Map`)
- History tracking (pushes to history stack)
- Act/chapter boundary detection
- Persona updates on era change
- Mindset updates on act change
- State change event dispatch
- Progress save to localStorage

**`StoryEngine.recordChoice()` (lines 232-251)** — Already handles:
- Choice persistence in `StoryProgress.choices[]`
- State change dispatch
- Progress saving

**`StoryEngine.previousScene()` (lines 188-230)** — Already handles:
- History stack pop
- Backward navigation across act/chapter boundaries
- State restoration

### Branching Data Status Across Acts

| Acts | Choice Scenes | Choices | With nextScene | Status |
|------|--------------|---------|----------------|--------|
| 0-7 | 24 | 73 | 73 (100%) | Ready |
| 8 | 3 | 12 | 4 (33%) | Partial |
| 9 | 3 | 12 | 0 (0%) | Needs fallback |
| 10 | 3 | 9 | 0 (0%) | Needs fallback |
| **Total** | **33** | **106** | **77 (73%)** | |

**Acts 0-7:** All 73 choices have valid `nextScene` targets. Branching will work immediately.

**Acts 8-10:** 29 choices lack `nextScene`. The fallback behavior (AC #3) handles this: when `choice.nextScene` is undefined, the engine falls back to `scene.nextScene` and logs a warning. This is the correct behavior — branch scenes for acts 8-10 haven't been authored yet. No content authoring is needed for this story.

### Schema Already Updated

TD-3 already added `nextScene` to the ChoiceData definition in `story-schema.json:284-287`:
```json
"nextScene": {
  "type": "string",
  "description": "ID of the next scene for this choice"
}
```

### Testing Patterns to Follow

**Unit tests (`StoryController.test.ts`):**
- Uses `createMockAct()` helper for test data
- Mocks `fetch` for content loading
- Clears localStorage between tests
- Uses `vi.fn()` for callback spying
- Existing test at line ~249: "should record choice and navigate" — extend this pattern

**Mock data structure:**
```typescript
{
  id: 'scene-1-1-3',
  type: 'choice',
  choices: [
    { id: 'choice-1', icon: '🔧', title: 'A', description: 'Do A' },
    { id: 'choice-2', icon: '⚙️', title: 'B', description: 'Do B' },
  ],
  nextScene: 'scene-1-1-4',  // Scene-level fallback
}
```

**For TD-1 tests, add `nextScene` to mock choices:**
```typescript
{
  id: 'scene-1-1-3',
  type: 'choice',
  choices: [
    { id: 'choice-1', icon: '🔧', title: 'A', description: 'Do A', nextScene: 'scene-1-1-4a' },
    { id: 'choice-2', icon: '⚙️', title: 'B', description: 'Do B', nextScene: 'scene-1-1-4b' },
  ],
  nextScene: 'scene-1-1-4',  // Fallback for choices without nextScene
}
```

**E2E tests (`story-navigation.spec.ts:304-441`):**
- Already has "Story Branching Paths" describe block
- Tests expect different choices → different content
- Currently failing because branching isn't implemented — these should pass after TD-1

### CI Validation — Already Complete

TD-3 created the full validation pipeline:
- Script: `scripts/validate-story-content.ts` (validates `choice.nextScene` refs at lines 128-136)
- npm script: `validate:content`
- CI step in `.github/workflows/ci.yml` (after lint, before tests)
- 34 unit tests for the validation script
- **Task 3 in the original story (CI validation) is already done. No new validation work needed.**

### Project Coding Standards

- **TypeScript:** Strict mode, no `any`, explicit `null`, named exports
- **CSS:** `da-*` prefix for classes, `--da-*` for CSS variables
- **XSS Safety:** Always use `textContent` not `innerHTML`
- **Component Pattern:** `mount()`, `destroy()`, `getElement()`, `isVisible()`
- **Testing:** Vitest for unit, Playwright for E2E. Co-located `.test.ts` files.
- **Minimum test count enforced:** 1000+ unit tests in CI

### Dependencies

- **Depends on TD-3** (DONE) — content fixes and validation script
- **Blocks TD-2** (close story-lab-story loop) — needs branching for meaningful choices
- **Blocks TD-4** (journey E2E tests) — branching E2E tests need this

### Anti-Patterns to Avoid

1. DO NOT change `StoryEngine.nextScene()` — it's the correct fallback for non-choice navigation
2. DO NOT add branching logic to `SceneRenderer` or `ChoiceCard` — keep navigation in StoryController
3. DO NOT require all choices to have `nextScene` — graceful fallback is essential for incremental content authoring
4. DO NOT modify `StoryEngine.goToScene()` — it already handles everything needed
5. DO NOT create new content/scenes for acts 8-10 — the fallback behavior handles missing branches
6. DO NOT add a new CI validation step — TD-3 already created it
7. DO NOT recreate choice recording logic — `recordChoice()` already works correctly

### Accessibility Checklist

- N/A — ChoiceCard already has proper `<button>` elements with `aria-label` attributes. No new UI components created.

### References

- [Source: digital-archaeology-web/src/story/StoryController.ts:208-216] — Broken selectChoice()
- [Source: digital-archaeology-web/src/story/StoryEngine.ts:112-171] — goToScene() (already works)
- [Source: digital-archaeology-web/src/story/StoryEngine.ts:176-187] — nextScene() (fallback)
- [Source: digital-archaeology-web/src/story/StoryEngine.ts:188-230] — previousScene() (history-based)
- [Source: digital-archaeology-web/src/story/StoryEngine.ts:232-251] — recordChoice() (already works)
- [Source: digital-archaeology-web/src/story/types.ts:107-116] — ChoiceData (missing nextScene)
- [Source: digital-archaeology-web/src/story/content-types.ts:10] — ChoiceData import
- [Source: digital-archaeology-web/src/story/StoryState.ts:23-30] — StoryChoice tracking
- [Source: digital-archaeology-web/scripts/validate-story-content.ts:128-136] — Choice ref validation (TD-3)
- [Source: digital-archaeology-web/public/story/schema/story-schema.json:284-287] — ChoiceData.nextScene schema (TD-3)
- [Source: digital-archaeology-web/tests/e2e/story-navigation.spec.ts:304-441] — Branch E2E tests
- [Source: digital-archaeology-web/src/story/StoryController.test.ts:249-263] — Choice recording test
- [Source: _bmad-output/implementation-artifacts/epic-10-retro-2026-02-06.md] — Gap #4 analysis
- [Source: _bmad-output/implementation-artifacts/td-3-content-audit-schema-enforcement.md] — Prior story

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- Typecheck: Clean (0 errors) after Task 1 and Task 2
- Unit tests: 3,917 passed (0 failures) — 7 new TD-1 tests added
- E2E tests: 44/44 passed (8 branching tests across 2 browsers) — 1 new back-nav test added
- Content validation: All checks passed (11 acts, 6 personas)

### Completion Notes List

- Task 1: Added `nextScene?: string` to `ChoiceData` interface in types.ts. Typecheck clean.
- Task 2: Updated `selectChoice()` in StoryController.ts — 10-line change. Uses `choice.nextScene` when available, falls back to `scene.nextScene` with console warning. Removed TODO comment.
- Task 3: Verified `goToScene()` pushes to history (back-nav works), `previousScene()` pops from history, branch convergence works via shared scene IDs, `recordChoice()` persists to `progress.choices[]`.
- Task 4: Confirmed `validate-story-content.ts` already validates `choice.nextScene` references (lines 144-151). npm script `validate:content` exists. Note: CI workflow step not yet added to ci.yml but validation script works locally.
- Task 5: 7 unit tests covering: branch A navigation, branch B navigation, fallback to scene.nextScene, console warning, back navigation after branch, convergence from two branches, recordChoice preservation. All pass.
- Task 6: 4 E2E tests (3 pre-existing + 1 new back-nav test). All pass in Chromium and Firefox.
- Core fix: ~10 lines in `StoryController.selectChoice()`. 73% of choices (acts 0-7) now branch correctly. 27% (acts 8-10) gracefully fall back.

### File List

- `digital-archaeology-web/src/story/types.ts` — Added `nextScene?: string` to ChoiceData interface
- `digital-archaeology-web/src/story/StoryController.ts` — Updated `selectChoice()` with branching logic
- `digital-archaeology-web/src/story/StoryController.test.ts` — Added 7 branching unit tests + mock branching act data
- `digital-archaeology-web/tests/e2e/story-navigation.spec.ts` — Added back-navigation-after-choice E2E test
