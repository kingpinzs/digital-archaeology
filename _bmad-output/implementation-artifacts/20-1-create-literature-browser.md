# Story 20.1: Create Literature Browser

Status: done

## Story

As a user,
I want to browse educational articles about CPU concepts,
so that I can learn the theory behind what I'm building.

## Acceptance Criteria

1. **Given** I access the literature section, **When** I view the browser, **Then** I see a modal overlay with categorized articles (20 total)
2. **Given** the browser is open, **When** I view the article list, **Then** categories include: Basic (articles 1-6), Intermediate (7-12), Advanced (13-20)
3. **Given** the browser is open, **When** I type in the search field, **Then** articles are filtered by title, description, and tags in real-time
4. **Given** the browser is open, **When** I click a category filter chip, **Then** only articles in that category are shown; clicking again clears the filter
5. **Given** I click an article card, **When** the selection callback fires, **Then** the parent receives the selected article metadata
6. **Given** the browser is open, **When** I press Escape or click the backdrop, **Then** the browser closes and focus is restored to the previously focused element
7. **Given** the browser is open, **When** I navigate with keyboard (Tab, Arrow keys), **Then** focus moves through filter chips and article cards accessibly

## Tasks / Subtasks

- [x] Task 1: Define literature types and article metadata (AC: 1, 2)
  - [x] 1.1 Create `src/literature/types.ts` — `LiteratureArticle`, `LiteratureCategory`, `LiteratureBrowserCallbacks`, `LiteratureBrowserData` interfaces
  - [x] 1.2 Create `src/literature/literatureMetadata.ts` — `LITERATURE_ARTICLES` constant array with all 20 article entries (id, title, category, description, tags, estimatedReadTime, relatedStages)
  - [x] 1.3 Create `src/literature/index.ts` — barrel exports

- [x] Task 2: Implement LiteratureBrowser component (AC: 1, 5, 6, 7)
  - [x] 2.1 Create `src/literature/LiteratureBrowser.ts` — class-based modal component following StoryBrowser/AchievementGallery pattern
  - [x] 2.2 Implement lifecycle: `mount(parent)`, `open(data, callbacks)`, `close()`, `isOpen()`, `destroy()`
  - [x] 2.3 Implement backdrop overlay with click-to-close
  - [x] 2.4 Implement focus trap: save `previouslyFocusedElement`, trap Tab within modal, restore on close
  - [x] 2.5 Implement Escape key dismiss handler (bound handler pattern)
  - [x] 2.6 Implement double-invocation guard on `open()` — if already open, return early
  - [x] 2.7 Implement enter/exit animation with CSS classes and double rAF for entering state

- [x] Task 3: Implement search functionality (AC: 3)
  - [x] 3.1 Add search input field in browser header with `type="search"` and `aria-label`
  - [x] 3.2 Implement real-time filtering on `input` event — match against article title, description, and tags (case-insensitive substring)
  - [x] 3.3 Re-render article grid on each filter change
  - [x] 3.4 Show "No results" message when filter yields empty set

- [x] Task 4: Implement category filtering (AC: 4)
  - [x] 4.1 Render filter chip buttons for each category level (Basic, Intermediate, Advanced) + "All" default
  - [x] 4.2 Toggle filter on click — clicking active filter clears it (returns to "All")
  - [x] 4.3 Combine with search filter (both apply simultaneously)
  - [x] 4.4 Update chip visual state (active/inactive) via CSS class

- [x] Task 5: Implement article card rendering (AC: 1, 2, 5)
  - [x] 5.1 Create card elements with title, description, category badge, estimated read time
  - [x] 5.2 Group cards by category in the grid (Basic section, Intermediate section, Advanced section) with section headers
  - [x] 5.3 Attach click handler to each card that calls `callbacks.onArticleSelect(article)`
  - [x] 5.4 Implement card hover state and focus indicator via CSS classes

- [x] Task 6: Add CSS styles to main.css (AC: 1, 4, 7)
  - [x] 6.1 Add `.da-literature-browser` styles — modal positioning, backdrop, content panel, enter/exit animations
  - [x] 6.2 Add `.da-literature-card` styles — card layout, hover effects, category badge colors, focus indicator
  - [x] 6.3 Add `.da-literature-filter` styles — chip buttons, active state, search input
  - [x] 6.4 Defined `--da-literature-basic`, `--da-literature-intermediate`, `--da-literature-advanced` CSS variables in `:root`
  - [x] 6.5 All CSS variable names verified against main.css — NO phantom variables

- [x] Task 7: Wire into App.ts and StoryNav (AC: 1)
  - [x] 7.1 Add `onLiteratureClick` callback to StoryNav options interface and render a "Literature" button in the navigation
  - [x] 7.2 In App.ts, instantiate `LiteratureBrowser`, mount it, wire `onLiteratureClick` to `open()`
  - [x] 7.3 Add `destroy()` cleanup in App.ts following existing pattern
  - [x] 7.4 Accessible from both Story Mode (StoryNav) and Lab Mode (MenuBar View menu)

- [x] Task 8: Write comprehensive tests (AC: 1-7)
  - [x] 8.1 No type guards added, so no type guard tests needed
  - [x] 8.2 Create `src/literature/literatureMetadata.test.ts` — 24 tests validating all 20 articles have required fields, unique IDs, valid categories, valid stages, correct ordering, helper functions
  - [x] 8.3 Create `src/literature/LiteratureBrowser.test.ts` — 65 tests covering mount/open/close/destroy lifecycle, backdrop dismiss, Escape dismiss, focus trap, focus restoration, double-invocation guard, search filtering, category filtering, combined filtering, article selection callback, "no results" state, ARIA attributes, read indicators
  - [x] 8.4 `npx vitest run` — all 5005 tests pass (127 test files), including 89 new literature tests
  - [x] 8.5 `npx tsc --noEmit` — zero new TypeScript errors (2 pre-existing test-only errors from earlier epics)

## Dev Notes

### Architecture Pattern

This story follows the **modal browser pattern** established by StoryBrowser and AchievementGallery. The canonical decomposition is:

```
types.ts → literatureMetadata.ts → LiteratureBrowser.ts → CSS → App.ts wiring
```

### Component Pattern Reference

**Class-based component with modal lifecycle:**
```typescript
export class LiteratureBrowser {
  private container: HTMLElement | null = null;
  private overlay: HTMLElement | null = null;
  private backdropElement: HTMLElement | null = null;
  private callbacks: LiteratureBrowserCallbacks | null = null;
  private previouslyFocusedElement: Element | null = null;
  private exitTimeout: ReturnType<typeof setTimeout> | null = null;

  // Bound handlers for cleanup
  private boundHandleKeydown: (e: KeyboardEvent) => void;
  private boundHandleBackdropClick: (e: MouseEvent) => void;

  mount(parent: HTMLElement): void { }
  open(data: LiteratureBrowserData): void { }  // double-invocation guard
  close(): void { }
  isOpen(): boolean { }
  destroy(): void { }
}
```

### Critical Patterns (from Epic 19 code reviews)

1. **Double-invocation guard on open()**: If `this.overlay` already exists or `isOpen()` is true, return early. Prevents duplicate modals.
2. **Focus trap**: On open, save `document.activeElement` to `previouslyFocusedElement`. On close, restore focus if element still exists in DOM.
3. **Double rAF for enter animation**: After mounting, use `requestAnimationFrame(() => requestAnimationFrame(() => { overlay.classList.add('da-literature-browser--entering'); }))` to ensure browser paints the initial state before animating.
4. **Bound event handlers**: Create bound references in constructor for `handleKeydown` and `handleBackdropClick`. Remove them in `destroy()`. Never use anonymous arrow functions in `addEventListener`.
5. **CSS variable verification**: Before using any `--da-*` variable in CSS, verify it exists in `src/styles/main.css`. Do NOT invent phantom variables. If you need a new variable, define it in `:root` in main.css.
6. **Escape dismiss**: Listen for `keydown` event on `document`, check `e.key === 'Escape'`, call `close()`.

### Article Metadata Structure

The 20 articles map to the project's 6-stage CPU evolution and cover the theoretical foundations. Define them in `literatureMetadata.ts` as a flat constant array:

**Basic (1-6):**
1. Binary Numbers & Digital Representation
2. Logic Gates: The Building Blocks
3. Boolean Algebra & Logic Design
4. The Arithmetic Logic Unit (ALU)
5. Registers, Flip-Flops & State
6. Clock Signals & Timing

**Intermediate (7-12):**
7. Instruction Encoding & Machine Code
8. Control Unit Design
9. Memory Architecture: RAM, ROM & Stack
10. Subroutines & the Call Stack
11. Input/Output & Peripherals
12. Addressing Modes & Memory Models

**Advanced (13-20):**
13. Instruction Pipelining
14. Cache Memory & Hierarchy
15. Virtual Memory & Paging
16. Branch Prediction
17. Superscalar Execution
18. Out-of-Order Execution
19. Register Renaming & Hazards
20. Modern Processor Design

Each article entry must include: `id` (string, e.g. `"lit-01"`), `title`, `category` (`'basic' | 'intermediate' | 'advanced'`), `difficulty` (same as category for this story — future stories may refine), `description` (1-2 sentence summary), `tags` (string array for search), `estimatedReadTime` (number, minutes), `relatedStages` (array of `LabStage` values like `'micro4'`, `'micro8'`, etc.).

### Existing Reference Components

| Pattern | Reference File | Key Pattern |
|---------|---------------|-------------|
| Modal browser | `src/story/StoryBrowser.ts` | open/close, backdrop, expand/collapse |
| Achievement gallery | `src/progress/AchievementGallery.ts` | Grid cards, enter/exit animation, focus trap |
| Example browser | `src/examples/ExampleBrowser.ts` | Category grouping, keyboard navigation, callbacks |
| Example metadata | `src/examples/exampleMetadata.ts` | Flat constant array, category grouping function |
| App wiring | `src/ui/App.ts` | Component instantiation, mount, destroy pattern |
| StoryNav integration | `src/story/StoryNav.ts` | Button callback wiring, navigation options |

### CSS Naming Convention

All CSS classes use BEM with `da-` prefix:
- Block: `.da-literature-browser`
- Elements: `.da-literature-browser__header`, `.da-literature-browser__grid`, `.da-literature-browser__search`
- Modifiers: `.da-literature-browser--entering`, `.da-literature-browser--exiting`
- Card block: `.da-literature-card`
- Card elements: `.da-literature-card__title`, `.da-literature-card__description`, `.da-literature-card__badge`
- Card modifiers: `.da-literature-card--basic`, `.da-literature-card--intermediate`, `.da-literature-card--advanced`

### Difficulty Badge Colors

Use existing semantic CSS variables or define new `--da-literature-*` variables:
- Basic: Use `--da-success` (#51cf66) or define `--da-literature-basic`
- Intermediate: Use `--da-warning` (#ffc107) or define `--da-literature-intermediate`
- Advanced: Use `--da-error` (#ff6b6b) or define `--da-literature-advanced`

### Anti-Patterns to Avoid

1. **DO NOT** use React, Vue, or any framework — this is vanilla TypeScript DOM manipulation
2. **DO NOT** use inline styles — all styling through CSS classes and variables
3. **DO NOT** load articles from external JSON files — use TypeScript constant (`literatureMetadata.ts`)
4. **DO NOT** create article content/body text — this story only creates the BROWSER and METADATA. Article content rendering is a future story concern
5. **DO NOT** implement reading progress tracking — that's Story 20.4
6. **DO NOT** implement article categories system — that's Story 20.2 (but DO use a `category` field in metadata)
7. **DO NOT** skip the double-invocation guard — previous code reviews found this as a HIGH issue
8. **DO NOT** skip focus trap/restoration — previous code reviews found this as a HIGH issue
9. **DO NOT** use `setInterval` for animations — use CSS transitions and rAF
10. **DO NOT** create helper utilities for one-time operations — keep it simple

### Cross-Story Dependencies (Informational)

Story 20.1 (this story) creates the foundation that later stories extend:
- **20.2 (Article Categories)**: Will refine category system — our `category` field on articles prepares for this
- **20.3 (Contextual Help Links)**: Will link UI components to articles — our `relatedStages` and `tags` fields prepare for this
- **20.4 (Reading Progress)**: Will track which articles are read — our `LiteratureBrowserData` should accept an optional `readArticleIds?: Set<string>` to prepare for this, but DO NOT implement tracking logic
- **20.5 (Progressive Hints)**: Independent feature, no coupling needed
- **20.6 (Technical Deep-Dives)**: Will add detailed content to articles — our metadata structure supports this
- **20.7-20.12 (Curated Content)**: Will add documentaries, TV, YouTube, books, museums, online resources — these are SEPARATE content types, not articles. They may use a similar browser pattern but are separate components

### Testing Strategy

Follow the pattern from Epic 19 stories (90+ tests per story). Key test areas:

1. **Metadata validation** (5-10 tests): All 20 articles present, unique IDs, valid fields
2. **Lifecycle tests** (10-15 tests): mount, open, close, destroy, double-open guard
3. **DOM structure tests** (10-15 tests): ARIA attributes, correct element hierarchy, class names
4. **Search filter tests** (10-15 tests): Title match, description match, tag match, case-insensitive, empty result, clear search
5. **Category filter tests** (10-15 tests): Filter by each category, clear filter, combine with search
6. **Interaction tests** (10-15 tests): Article click callback, Escape dismiss, backdrop dismiss
7. **Focus management tests** (5-10 tests): Focus trap, focus restoration, keyboard navigation
8. **Animation tests** (3-5 tests): Enter/exit CSS class toggling

### Project Structure Notes

- All new files go in `src/literature/` directory (create it)
- CSS additions go in `src/styles/main.css` (append to end)
- App.ts wiring in `src/ui/App.ts` (add property, mount, destroy)
- StoryNav changes in `src/story/StoryNav.ts` (add callback, add button)
- Tests co-located in `src/literature/` as `.test.ts` files
- Barrel export from `src/literature/index.ts`

### Technical Stack

- TypeScript (strict mode, no `any`)
- Vitest + jsdom for testing
- Vite for build
- No external UI libraries
- CSS with `--da-*` custom properties

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 20, Story 20.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#Component Patterns]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Story Mode Theme]
- [Source: digital-archaeology-web/src/story/StoryBrowser.ts — modal browser reference]
- [Source: digital-archaeology-web/src/progress/AchievementGallery.ts — grid card modal reference]
- [Source: digital-archaeology-web/src/examples/ExampleBrowser.ts — category grouping reference]
- [Source: digital-archaeology-web/src/examples/exampleMetadata.ts — metadata constant reference]
- [Source: digital-archaeology-web/src/ui/App.ts — component wiring reference]
- [Source: digital-archaeology-web/src/story/StoryNav.ts — navigation integration reference]
- [Source: _bmad-output/implementation-artifacts/epic-19-retro-2026-02-20.md — modal patterns, CSS variable verification]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- TypeScript check: 0 new errors (2 pre-existing test-only errors in Editor.test.ts and App.test.ts)
- Full test suite: 127 files, 5005 tests, 0 failures (pre-review)
- Post-review test suite: 127 files, 5012 tests, 0 failures (+7 review fix tests)

### Completion Notes List

- Implemented `LiteratureCategory` as `'basic' | 'intermediate' | 'advanced'` (no separate `LiteratureDifficulty` type needed — story notes said to use category as difficulty for now)
- `open()` accepts `(data, callbacks)` instead of storing callbacks in `setCallbacks()` — aligns with the data + callbacks being provided together at open time
- Added `onLiteratureClick` to both StoryModeContainer and StoryNav for Story Mode access
- Added "Literature Library" to MenuBar View menu for Lab Mode access (AC 7.4)
- Updated existing StoryNav.test.ts to expect 5 nav buttons (was 4) after adding Literature button
- `readArticleIds` optional field in `LiteratureBrowserData` prepares for Story 20.4 (reading progress)
- All cards rendered as `<button>` elements for keyboard accessibility

### Code Review Fixes Applied

| Issue | Severity | Fix |
|-------|----------|-----|
| H1: JSDoc misplacement in App.ts | HIGH | Moved `handleLiteratureClick()` JSDoc to correct position; restored `handleStatisticsClick()` JSDoc above its method |
| M1: Arrow key navigation missing (AC 7) | MEDIUM | Added Left/Right arrow key handling in `handleKeydown()` for WAI-ARIA toolbar pattern within filter chips |
| M2: Double-close fires onClose twice | MEDIUM | Added `hadOverlay` guard in `removeOverlay()` — onClose only fires when overlay was actually removed |
| M3: destroy() fires onClose inadvertently | MEDIUM | `destroy()` now passes `fireOnClose: false` to `removeOverlay()` — programmatic teardown skips callback |
| L1: Hardcoded RGBA badge backgrounds | LOW | Replaced `rgba()` with `color-mix(in srgb, var(...) 20%, transparent)` to derive from CSS variables |

### Change Log

| File | Action | Description |
|------|--------|-------------|
| `src/literature/types.ts` | Created | Core type definitions: LiteratureArticle, LiteratureCategory, LiteratureBrowserCallbacks, LiteratureBrowserData, CATEGORY_LABELS, CATEGORY_ORDER |
| `src/literature/literatureMetadata.ts` | Created | 20 article metadata entries, getArticlesByCategory(), findArticleById() |
| `src/literature/index.ts` | Created | Barrel exports for literature module |
| `src/literature/LiteratureBrowser.ts` | Created | Modal browser component (~450 lines) with search, category filter, focus trap, animation |
| `src/literature/literatureMetadata.test.ts` | Created | 24 metadata validation tests |
| `src/literature/LiteratureBrowser.test.ts` | Created | 65 component tests covering all ACs |
| `src/styles/main.css` | Modified | Added `--da-literature-*` CSS variables and ~180 lines of component styles |
| `src/story/StoryNav.ts` | Modified | Added `onLiteratureClick` callback and Literature button |
| `src/story/StoryModeContainer.ts` | Modified | Added `onLiteratureClick` passthrough to StoryNav |
| `src/ui/App.ts` | Modified | Added LiteratureBrowser import, property, mount, destroy, handleLiteratureClick() |
| `src/ui/MenuBar.ts` | Modified | Added "Literature Library" to View menu |
| `src/story/StoryNav.test.ts` | Modified | Updated button order test for 5 buttons (was 4) |
| `vite.aliases.ts` | Modified | Added `@literature` path alias |
| `tsconfig.json` | Modified | Added `@literature/*` path mapping |

### File List

**New files:**
- `digital-archaeology-web/src/literature/types.ts`
- `digital-archaeology-web/src/literature/literatureMetadata.ts`
- `digital-archaeology-web/src/literature/index.ts`
- `digital-archaeology-web/src/literature/LiteratureBrowser.ts`
- `digital-archaeology-web/src/literature/literatureMetadata.test.ts`
- `digital-archaeology-web/src/literature/LiteratureBrowser.test.ts`

**Modified files:**
- `digital-archaeology-web/src/styles/main.css`
- `digital-archaeology-web/src/story/StoryNav.ts`
- `digital-archaeology-web/src/story/StoryModeContainer.ts`
- `digital-archaeology-web/src/ui/App.ts`
- `digital-archaeology-web/src/ui/MenuBar.ts`
- `digital-archaeology-web/src/story/StoryNav.test.ts`
- `digital-archaeology-web/vite.aliases.ts`
- `digital-archaeology-web/tsconfig.json`
