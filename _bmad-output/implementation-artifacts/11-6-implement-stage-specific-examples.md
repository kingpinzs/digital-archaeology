# Story 11.6: Implement Stage-Specific Examples

Status: complete

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want example programs filtered and loaded per CPU stage,
So that users see only examples relevant to their current stage and can learn stage-specific concepts.

## Acceptance Criteria

1. **Given** I switch stages **When** I access File > Examples **Then** I see examples for the current stage only (not examples from other stages)
2. **Given** I am on the Micro8 stage **When** I open Examples **Then** I see Micro8-specific programs (basic_mov, arithmetic, stack, calls, etc.) grouped by category with appropriate metadata
3. **Given** I am on the Micro16 stage **When** I open Examples **Then** I see Micro16-specific programs (segments, multiply, strings, etc.) grouped by category with appropriate metadata
4. **Given** I select an example on any stage **When** the program loads **Then** it is fetched from the correct stage's programs directory (e.g., `/programs/micro8/arithmetic.asm`)
5. **Given** I switch to a stage with `programs.directory: null` **When** I open Examples **Then** I see a "No examples available for {stage}" message instead of an empty list
6. **Given** I switch stages **When** the ExampleBrowser is NOT open **Then** no examples reload occurs (lazy — only filters when opened)
7. **Given** I am on the Micro4 stage **When** I open Examples **Then** I see exactly the same 12 programs as before this story (zero regression)

## Tasks / Subtasks

- [x] Task 0: Make `ExampleProgram.stage` required and typed (AC: #1, #7)
  - [x] 0.1: In `types.ts`, change `stage?: string` to `stage: LabStage` (import `LabStage` from `../config/stageConfig`)
  - [x] 0.2: All existing Micro4 entries already have `stage: 'micro4'` — no data changes needed
  - [x] 0.3: Update any tests that create `ExampleProgram` objects without `stage` field
  - [x] 0.4: This enables type-safe filtering in `getProgramsByStage()` and prevents bugs from missing/untyped stage fields

- [x] Task 1: Add Micro8 example program metadata to `exampleMetadata.ts` (AC: #2)
  - [x] 1.1: Add 15 Micro8 `ExampleProgram` entries with `stage: 'micro8'` matching files in `public/programs/micro8/`
  - [x] 1.2: Assign categories: arithmetic (arithmetic, multiply, divide), algorithms (fibonacci, bubble_sort), bitwise (logic), reference (basic_mov, flags, jumps, memory, stack, calls, all_instructions, interrupts, string_ops)
  - [x] 1.3: Assign difficulty levels based on program complexity
  - [x] 1.4: Add description and concepts arrays for each program
  - [x] 1.5: Unit tests: verify 15 Micro8 programs exist, unique filenames, valid categories/difficulties

- [x] Task 2: Add Micro16 example program metadata to `exampleMetadata.ts` (AC: #3)
  - [x] 2.1: Add 13 Micro16 `ExampleProgram` entries with `stage: 'micro16'` matching files in `public/programs/micro16/`
  - [x] 2.2: Assign categories: arithmetic (arithmetic, multiply, divide), bitwise (logic), reference (basic_mov, flags, jumps, memory, stack, calls, segments, interrupts, strings)
  - [x] 2.3: Assign difficulty levels
  - [x] 2.4: Add description and concepts arrays
  - [x] 2.5: Unit tests: verify 13 Micro16 programs exist, unique filenames within stage

- [x] Task 3: Add stage-filtering to `exampleMetadata.ts` helper functions (AC: #1, #7)
  - [x] 3.1: Add `getProgramsByStage(stage: LabStage): ExampleProgram[]` function that filters `EXAMPLE_PROGRAMS` by `program.stage === stage`
  - [x] 3.2: Update `getProgramsByCategory()` to accept optional `stage` parameter — when provided, filters first then groups
  - [x] 3.3: Unit tests: `getProgramsByStage('micro4')` returns 12, `getProgramsByStage('micro8')` returns 15, `getProgramsByStage('micro16')` returns 13, `getProgramsByStage('micro32')` returns 0
  - [x] 3.4: Unit test: `getProgramsByCategory('micro4')` returns same groups as before (backward compatible)

- [x] Task 4: Make ExampleBrowser stage-aware (AC: #1, #5, #6)
  - [x] 4.1: Add `stage: LabStage` parameter to ExampleBrowser constructor
  - [x] 4.2: In `render()`, call `getProgramsByCategory(this.stage)` instead of `getProgramsByCategory()`
  - [x] 4.3: When filtered programs are empty, render a "No examples available for {stageName}" message instead of categories (use `createElement` + `textContent`, data-testid `example-empty-state`)
  - [x] 4.4: Unit tests: ExampleBrowser with Micro4 stage shows 12 programs, Micro8 shows 15, micro32 shows empty state

- [x] Task 5: Pass current stage to ExampleBrowser from App.ts (AC: #1, #4, #6)
  - [x] 5.1: Update `App.showExampleBrowser()` to pass `this.currentStage` to ExampleBrowser
  - [x] 5.2: `handleExampleSelect()` already uses `getStageConfig(this.currentStage).programs.directory` — verify no changes needed
  - [x] 5.3: No reload on stage switch needed — ExampleBrowser is created fresh each time it's shown (lazy)
  - [x] 5.4: TypeScript compilation verifies correct stage parameter passing; App.test.ts 475 tests pass

- [x] Task 6: Update existing tests and add regression tests (AC: #7)
  - [x] 6.1: Update `exampleMetadata.test.ts` — adjusted `EXAMPLE_PROGRAMS.length` assertion from 12 to 40 (12+15+13)
  - [x] 6.2: Add stage-specific count assertions: `.filter(p => p.stage === 'micro4').length === 12`
  - [x] 6.3: Micro8 filenames match — 15 entries with unique filenames validated by unit tests
  - [x] 6.4: Micro16 filenames match — 13 entries with unique filenames validated by unit tests
  - [x] 6.5: Update ExampleBrowser tests to pass stage parameter
  - [x] 6.6: All existing tests continue passing (100 example tests + 475 App tests, 0 regressions)

- [x] Task 7: E2E tests for stage-specific examples (AC: #1, #2, #3)
  - [x] 7.1: Test that File > Examples menu item exists and is clickable
  - [x] 7.2: Test that example browser shows programs on initial Micro4 load (12 items)
  - [x] 7.3: Test that example browser closes on Escape
  - [x] 7.4: Note: Full stage-switch E2E for filtered examples only testable when additional stages have `ready: true`

- [x] Task 8: Update story file and sprint status (AC: all)
  - [x] 8.1: Mark all tasks complete
  - [x] 8.2: Update sprint-status.yaml: `11-6` → `in-progress` → `review`
  - [x] 8.3: Fill in Dev Agent Record section

## Dev Notes

### Architecture: Lazy Stage Filtering (No Reload Needed)

The ExampleBrowser is **created fresh** each time the user opens File > Examples (`showExampleBrowser()`) and **destroyed** when they close it (`hideExampleBrowser()`). This means:

1. **No reload on stage switch**: The browser picks up the current stage when created
2. **No cache invalidation**: Each instance reads metadata filtered by current stage
3. **No state to manage**: The browser is stateless between opens

This is the simplest possible architecture. Do NOT add a "refresh" or "reload" mechanism.

```
User flow:
  Stage = Micro4 → Opens Examples → sees 12 Micro4 programs
  Switches to Micro8
  Opens Examples again → sees 15 Micro8 programs (new ExampleBrowser instance)
```

### CRITICAL: What NOT to do

- **DO NOT** modify `ExampleLoader.ts`. It already accepts a configurable `programsPath` parameter and App.ts already passes the stage-specific path. Loading works correctly for all stages.
- **DO NOT** create separate metadata files per stage (e.g., `micro8Metadata.ts`). Keep all programs in a single `EXAMPLE_PROGRAMS` array — filtering is trivial and one source of truth is better.
- **DO NOT** add a "stage" dropdown or filter UI inside ExampleBrowser. The stage is determined by the app's current stage — the browser simply shows the correct programs.
- **DO NOT** use `innerHTML` for empty state — use `createElement` + `textContent`.
- **DO NOT** modify `ExampleTooltip.ts`. Tooltips work identically for all stages (same fields: name, difficulty, description, concepts).
- **DO NOT** change the `CATEGORY_ORDER` constant. Categories are shared across all stages. If a stage has no programs in a category, that category header simply doesn't appear.
- **DO NOT** try to dynamically discover example programs from the filesystem. All metadata is statically defined in `exampleMetadata.ts`.
- **DO NOT** hardcode 12 in existing test assertions — the total will change to 40. Use `.filter(p => p.stage === 'micro4').length` for stage-specific counts.

### Example Program Metadata Pattern

Follow the existing pattern exactly:

```typescript
// Existing Micro4 entry (for reference):
{
  filename: 'add.asm',
  name: 'Add Two Numbers',
  category: 'arithmetic',
  description: 'Adds two values and stores the result.',
  concepts: ['LDA', 'ADD', 'STA', 'memory addressing'],
  difficulty: 'beginner',
  stage: 'micro4',
},

// New Micro8 entry (same pattern):
{
  filename: 'arithmetic.asm',
  name: 'Arithmetic Operations',
  category: 'arithmetic',
  description: 'Demonstrates 8-bit arithmetic with multiple registers.',
  concepts: ['ADD', 'SUB', 'INC', 'DEC', 'CMP', 'registers'],
  difficulty: 'beginner',
  stage: 'micro8',
},
```

### Micro8 Programs to Add (15 files in `public/programs/micro8/`)

| Filename | Suggested Name | Category | Difficulty |
|----------|---------------|----------|------------|
| `basic_mov.asm` | Basic Data Movement | reference | beginner |
| `arithmetic.asm` | Arithmetic Operations | arithmetic | beginner |
| `logic.asm` | Logic Operations | bitwise | beginner |
| `flags.asm` | Flag Operations | reference | intermediate |
| `jumps.asm` | Jump Instructions | reference | beginner |
| `memory.asm` | Memory Access | reference | intermediate |
| `stack.asm` | Stack Operations | reference | intermediate |
| `calls.asm` | Subroutine Calls | reference | intermediate |
| `multiply.asm` | 8-bit Multiplication | arithmetic | intermediate |
| `divide.asm` | 8-bit Division | arithmetic | advanced |
| `fibonacci.asm` | Fibonacci Sequence | algorithms | intermediate |
| `bubble_sort.asm` | Bubble Sort | algorithms | advanced |
| `all_instructions.asm` | All Instructions | reference | advanced |
| `interrupts.asm` | Interrupt Handling | reference | advanced |
| `string_ops.asm` | String Operations | reference | intermediate |

### Micro16 Programs to Add (13 files in `public/programs/micro16/`)

| Filename | Suggested Name | Category | Difficulty |
|----------|---------------|----------|------------|
| `basic_mov.asm` | Basic Data Movement | reference | beginner |
| `arithmetic.asm` | Arithmetic Operations | arithmetic | beginner |
| `logic.asm` | Logic Operations | bitwise | beginner |
| `flags.asm` | Flag Operations | reference | intermediate |
| `jumps.asm` | Jump Instructions | reference | beginner |
| `memory.asm` | Memory Operations | reference | intermediate |
| `stack.asm` | Stack Operations | reference | intermediate |
| `calls.asm` | Subroutine Calls | reference | intermediate |
| `multiply.asm` | 16-bit Multiplication | arithmetic | intermediate |
| `divide.asm` | 16-bit Division | arithmetic | advanced |
| `segments.asm` | Memory Segmentation | reference | advanced |
| `interrupts.asm` | Interrupt Handling | reference | advanced |
| `strings.asm` | String Instructions | reference | intermediate |

### Stage Filtering Implementation

```typescript
// In exampleMetadata.ts — add:
import type { LabStage } from '../config/stageConfig';

export function getProgramsByStage(stage: LabStage): ExampleProgram[] {
  return EXAMPLE_PROGRAMS.filter(p => p.stage === stage);
}

// Update existing function signature (backward compatible):
export function getProgramsByCategory(stage?: LabStage): Map<ExampleCategory, ExampleProgram[]> {
  const programs = stage ? getProgramsByStage(stage) : EXAMPLE_PROGRAMS;
  const grouped = new Map<ExampleCategory, ExampleProgram[]>();
  for (const category of CATEGORY_ORDER) {
    const categoryPrograms = programs.filter(p => p.category === category);
    if (categoryPrograms.length > 0) {
      grouped.set(category, categoryPrograms);
    }
  }
  return grouped;
}
```

### ExampleBrowser Stage-Aware Changes

```typescript
// ExampleBrowser constructor — add stage parameter:
constructor(callbacks: ExampleBrowserCallbacks, stage: LabStage) {
  this.stage = stage;
  // ... existing code
}

// In render() — pass stage to getProgramsByCategory:
const programsByCategory = getProgramsByCategory(this.stage);

// If no programs, show empty state:
if (programsByCategory.size === 0) {
  const emptyState = document.createElement('div');
  emptyState.className = 'da-example-empty-state';
  emptyState.setAttribute('data-testid', 'example-empty-state');
  const message = document.createElement('p');
  const stageConfig = getStageConfig(this.stage);
  message.textContent = `No examples available for ${stageConfig.meta.label}`;
  emptyState.appendChild(message);
  this.element.appendChild(emptyState);
  return this.element;
}
```

### App.ts Integration (Minimal Change)

```typescript
// In showExampleBrowser() — pass current stage:
this.exampleBrowser = new ExampleBrowser(
  { onSelect: this.handleExampleSelect.bind(this), onClose: this.hideExampleBrowser.bind(this) },
  this.currentStage,  // NEW: pass current stage
);
```

No other App.ts changes needed. `handleExampleSelect()` already uses `getStageConfig(this.currentStage).programs.directory` for loading.

### Empty State CSS

```css
/* Add to main.css alongside existing .da-circuit-empty-state */
.da-example-empty-state {
  padding: 1rem;
  text-align: center;
}

.da-example-empty-state p {
  color: var(--da-text-muted);
  font-size: 0.85rem;
}
```

### Integration Points in App.ts

- **`showExampleBrowser()`** (line ~3527): Pass `this.currentStage` to ExampleBrowser constructor
- **`handleExampleSelect()`** (line ~3564): Already stage-aware — reads `getStageConfig(this.currentStage).programs.directory`
- **`performStageSwitch()`**: No changes needed — ExampleBrowser is created fresh each time

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/examples/types.ts` | Modify | Change `stage?: string` to `stage: LabStage` (required + typed) |
| `src/examples/exampleMetadata.ts` | Modify | Add 15 Micro8 + 13 Micro16 program entries, add `getProgramsByStage()`, update `getProgramsByCategory()` |
| `src/examples/exampleMetadata.test.ts` | Modify | Update total count, add stage-specific count tests, add filtering tests |
| `src/examples/ExampleBrowser.ts` | Modify | Accept `stage` parameter, pass to `getProgramsByCategory()`, add empty state |
| `src/examples/ExampleBrowser.test.ts` | Modify | Pass stage to constructor, add stage filtering tests, add empty state test |
| `src/ui/App.ts` | Modify | Pass `this.currentStage` to ExampleBrowser constructor |
| `src/ui/App.test.ts` | Modify | Verify ExampleBrowser created with current stage |
| `src/styles/main.css` | Modify | Add `.da-example-empty-state` styles |
| `tests/e2e/epic-11-stage-switching.spec.ts` | Modify | Add Story 11.6 E2E tests |

### Project Structure Notes

- All changes within existing feature folders (`src/examples/`, `src/ui/`, `src/styles/`)
- No new files needed — this story extends existing components
- Tests co-located as `*.test.ts` per project convention
- E2E tests in `tests/e2e/epic-11-stage-switching.spec.ts` Story 11.6 section

### Performance Requirements

- Metadata filtering: < 1ms (40 entries, simple `.filter()`)
- No network fetches until user selects a program
- ExampleBrowser render: < 10ms (DOM creation is fast)
- Empty state: synchronous DOM operations

### Testing Strategy

**Unit Tests (Vitest):**
- `exampleMetadata.test.ts`: Total count = 40, stage counts (12, 15, 13, 0), filtering, categories per stage
- `ExampleBrowser.test.ts`: Renders correct programs per stage, empty state for stages with no programs
- `App.test.ts`: `showExampleBrowser()` passes current stage to ExampleBrowser

**E2E Tests (Playwright):**
- File > Examples menu item exists
- Example browser shows programs on Micro4 initial load
- Note: Full stage-switch E2E only testable when additional stages have `ready: true`

### Previous Story Intelligence

**From Story 11.5 (Stage-Specific Circuit Loading):**
- **Empty state pattern**: `showCircuitEmptyState()` creates overlay div with `data-testid` and `textContent`. Follow the same pattern for example empty state.
- **Code review CR H-1**: Stage parameter was added to a method but never passed from App.ts — make sure to actually pass `this.currentStage` to ExampleBrowser.
- **Code review CR H-2**: Empty state leaked on destroy — make sure ExampleBrowser's `destroy()` properly cleans up DOM.
- **Code review CR M-2**: Wire name alias matching — similar "field name mismatch" pattern is unlikely here but worth checking filename consistency.
- **Test count**: 4,164 tests across 103 files — maintain 0 regressions.

**From Story 11.4 (Stage-Specific Syntax Highlighting):**
- **Centralized registry pattern**: `languageRegistry.ts` provides lookup by stage. For examples, `exampleMetadata.ts` serves the same role with `getProgramsByStage()`.
- **No reload on stage switch**: Language registration happens once at init. Similarly, example metadata is static — no reload needed.
- **Fallback pattern**: `getLanguageIdForStage()` falls back to Micro4. For examples, return empty array (no fallback — stages without examples show empty state).

**From Story 11.3 (Stage-Specific WASM Loading):**
- **`performStageSwitch()` integration**: Stories 11.3-11.5 all added code to this method. Story 11.6 does NOT need to — ExampleBrowser is created lazily when opened.
- **Error recovery**: Stage switch catch block reverts to previous stage. Example browser inherits this — it reads `this.currentStage` which is already reverted.

**From Story 8.1/8.3 (Example Browser / Tooltips):**
- **Event handler cleanup**: ExampleBrowser stores click handlers in a Map and removes them in `destroy()`. If adding empty state DOM, ensure it's cleaned up too.
- **Tooltip integration**: ExampleTooltip works on program items via `data-filename` attribute. Empty state has no items, so no tooltip issues.
- **Keyboard navigation**: ArrowDown/Up cycles through `.da-example-item` buttons. Empty state should be non-interactive.

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

- [Source: src/examples/exampleMetadata.ts] — Current 12 Micro4 program definitions + `getProgramsByCategory()`
- [Source: src/examples/exampleMetadata.test.ts] — Current metadata tests (12 programs, categories, etc.)
- [Source: src/examples/ExampleBrowser.ts] — Current browser component (render, mount, destroy, keyboard nav)
- [Source: src/examples/ExampleBrowser.test.ts] — Browser tests (render, accessibility, keyboard, tooltip)
- [Source: src/examples/ExampleLoader.ts] — Program loader with configurable `programsPath`
- [Source: src/examples/types.ts:17-32] — `ExampleProgram` interface with `stage?: string` field (to be changed to `stage: LabStage`)
- [Source: src/config/stageConfig.ts] — `StageProgramsConfig.directory` per stage
- [Source: src/ui/App.ts:3527-3544] — `showExampleBrowser()` method
- [Source: src/ui/App.ts:3564-3590] — `handleExampleSelect()` with stage-aware program loading
- [Source: public/programs/] — 12 Micro4 .asm files
- [Source: public/programs/micro8/] — 15 Micro8 .asm files
- [Source: public/programs/micro16/] — 13 Micro16 .asm files
- [Source: _bmad-output/implementation-artifacts/11-5-implement-stage-specific-circuit-loading.md] — Previous story patterns
- [Source: _bmad-output/implementation-artifacts/11-4-implement-stage-specific-syntax-highlighting.md] — Previous story patterns
- [Source: _bmad-output/planning-artifacts/epics.md:2255-2268] — Epic 11.6 acceptance criteria

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- TypeScript compilation: clean (0 errors from story changes)
- Unit tests: 4,193 tests across 103 files, 0 regressions (post code review)
- E2E tests: 6/6 Story 11.6 tests pass (3 tests × 2 browsers)
- Pre-existing E2E failures (6): Story 11.2/11.3 locked stage tests (not related)
- Code review: 9 issues found (3H, 4M, 2L), all fixed automatically

### Completion Notes List

- Task 0: Changed `stage?: string` to `stage: LabStage` (required + typed) in ExampleProgram interface. Fixed 2 test files (ExampleTooltip.test.ts) that created ExampleProgram objects without stage.
- Task 1-2: Added 15 Micro8 + 13 Micro16 program metadata entries with accurate descriptions and concepts extracted from actual .asm file headers. Categories: Micro8 has arithmetic(3), algorithms(2), bitwise(1), reference(9); Micro16 has arithmetic(3), bitwise(1), reference(9).
- Task 3: Added `getProgramsByStage()` and updated `getProgramsByCategory()` with optional stage parameter. Backward compatible — no stage = all programs.
- Task 4: ExampleBrowser constructor now accepts `stage: LabStage` parameter. Empty state rendered with `createElement` + `textContent` (no innerHTML). CSS added for `.da-example-empty-state`.
- Task 5: `App.showExampleBrowser()` passes `this.currentStage` to ExampleBrowser. handleExampleSelect already stage-aware (no changes needed).
- Task 6: Updated test counts (40 total, 12+15+13 per stage), added stage-specific filtering tests, empty state test, category filtering tests.
- Task 7: 3 E2E tests: File menu Examples item visible, browser shows 12 Micro4 programs, browser closes on Escape.
- Code Review Fixes: H1: `findProgramByFilename()` now accepts optional `stage` param for duplicate filename disambiguation. H2: 3 new tests for duplicate filename scenarios. H3: 2 new tests for Micro8/Micro16 program selection. M1: Strengthened backward-compat test for `getProgramsByCategory()`. M2: New test for Escape in empty state. M3: E2E now verifies program names (Add Two Numbers, Fibonacci), not just count. L1: New test verifying empty state uses textContent (XSS-safe). L2: Category count tests now self-validating (computed totals, not hardcoded counts).

### File List

| File | Action | Changes |
|------|--------|---------|
| `src/examples/types.ts` | Modified | `stage?: string` → `stage: LabStage` (required + typed), added LabStage import |
| `src/examples/exampleMetadata.ts` | Modified | Added 15 Micro8 + 13 Micro16 entries (40 total), added `getProgramsByStage()`, updated `getProgramsByCategory()` with optional stage param, `findProgramByFilename()` with optional stage param (CR H1) |
| `src/examples/exampleMetadata.test.ts` | Modified | Updated to 31 tests: total count 40, stage counts, filtering tests, category tests per stage, duplicate filename tests (CR H2), self-validating category counts (CR L2) |
| `src/examples/ExampleBrowser.ts` | Modified | Added `stage: LabStage` constructor param, stage-filtered rendering, empty state with `createElement` + `textContent` |
| `src/examples/ExampleBrowser.test.ts` | Modified | Updated to 44 tests: pass stage to constructor, stage-specific rendering (12/15/13), empty state, category filtering, Micro8/Micro16 selection (CR H3), empty state Escape (CR M2), XSS safety (CR L1) |
| `src/examples/ExampleTooltip.test.ts` | Modified | Added `stage: 'micro4'` to 2 test ExampleProgram objects |
| `src/ui/App.ts` | Modified | `showExampleBrowser()` passes `this.currentStage` to ExampleBrowser |
| `src/styles/main.css` | Modified | Added `.da-example-empty-state` styles |
| `tests/e2e/epic-11-stage-switching.spec.ts` | Modified | Added 3 Story 11.6 E2E tests |
