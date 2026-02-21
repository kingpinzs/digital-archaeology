# Story 20.5: Create Progressive Hint System

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want hints when I'm stuck,
so that I can make progress without full solutions.

## Acceptance Criteria

1. **Given** I am viewing a literature article, **When** hints are available for that topic, **Then** I see a "Need a hint?" button on the article card
2. **Given** I click the hint button, **When** the first hint is shown, **Then** I see the vaguest hint and a "Next hint" button
3. **Given** I have viewed some hints, **When** I request the next hint, **Then** each successive hint is more specific (3-5 per topic)
4. **Given** I have viewed hints, **When** I view the hint panel, **Then** I see which hint I'm on (e.g., "Hint 2 of 4")
5. **Given** I close and reopen the literature browser, **When** hints were previously viewed, **Then** my hint progress is persisted (tracked per article)
6. **Given** I want to reset, **When** I use "Reset hints", **Then** all hint progress is cleared

## Tasks / Subtasks

- [x] Task 1: Define hint data model and content (AC: 1, 3)
  - [x] 1.1 Create `src/literature/hintData.ts` with `ProgressiveHint` interface
  - [x] 1.2 Interface: `{ articleId: string; hints: readonly string[] }` (ordered vague → specific)
  - [x] 1.3 Created hint content for 8 articles across all 3 categories
  - [x] 1.4 Export `ARTICLES_WITH_HINTS` set, `getHintsForArticle()`, `getHintCount()`

- [x] Task 2: Create HintProgressStorage service (AC: 5, 6)
  - [x] 2.1 Create `src/literature/HintProgressStorage.ts` following ReadingProgressStorage pattern
  - [x] 2.2 Storage key: `digital-archaeology-hint-progress`
  - [x] 2.3 Interface: `HintProgress { revealedHints: Record<string, number> }` (articleId → count)
  - [x] 2.4 Methods: `getRevealedCount()`, `revealNext()`, `clearAll()`, `load()`
  - [x] 2.5 Type guard `isValidHintProgress()` and graceful fallback

- [x] Task 3: Add hint button to article cards (AC: 1)
  - [x] 3.1 In `renderCard()`, check `ARTICLES_WITH_HINTS.has(article.id)`
  - [x] 3.2 Add `.da-literature-card__hint-btn` to cards with hints, stopPropagation
  - [x] 3.3 CSS for hint button with hover/focus-visible states

- [x] Task 4: Create hint panel overlay (AC: 2, 3, 4)
  - [x] 4.1 `renderHintPanel()` — full hint panel sub-view
  - [x] 4.2 Progressive disclosure: only revealed hints shown
  - [x] 4.3 "Next hint" button reveals one more + fires callback
  - [x] 4.4 Progress: "Hint X of Y" + "All hints revealed!" end state
  - [x] 4.5 Back button closes panel, restores grid

- [x] Task 5: Wire storage into App.ts (AC: 5)
  - [x] 5.1 Instantiate `HintProgressStorage` in App
  - [x] 5.2 Pass `hintProgress` from storage to browser open
  - [x] 5.3 `onHintReveal` calls `revealNext(articleId, getHintCount(articleId))`

- [x] Task 6: Add reset hints action (AC: 6)
  - [x] 6.1 "Reset hints" button in header (conditional, only when progress exists)
  - [x] 6.2 Fires `onResetHints` callback → `HintProgressStorage.clearAll()`

- [x] Task 7: Write comprehensive tests (AC: 1-6)
  - [x] 7.1 `HintProgressStorage.test.ts` — 17 tests
  - [x] 7.2 `hintData.test.ts` — 11 tests (content integrity)
  - [x] 7.3 `LiteratureBrowser.test.ts` — 12 new hint tests
  - [x] 7.4 `npx vitest run` — 131 files, 5185 tests pass (46 new)
  - [x] 7.5 `npx tsc --noEmit` — 0 TypeScript errors

## Dev Notes

### Architecture Pattern

```
hintData.ts (content) → HintProgressStorage (persistence) → App.ts (wire) → LiteratureBrowser (display)
```

### Design Decisions

- Hints are stored as ordered string arrays per article — simplest model
- Not all articles need hints — only articles with practical/conceptual challenges
- Hint panel is a sub-view within the existing literature browser modal (not a separate modal)
- Storage follows the same pattern as ReadingProgressStorage and DiscoveryStorage

### Critical Patterns

1. **No inline styles** — use CSS classes only
2. **BEM naming** — `.da-literature-card__hint-btn`, `.da-hint-panel`, `.da-hint-panel__hint`
3. **CSS variables only** — `--da-text-secondary`, `--da-accent`, `--da-border`
4. **Immutable data** — readonly arrays, ReadonlySet where applicable

### References

- [Source: src/literature/ReadingProgressStorage.ts — storage pattern]
- [Source: src/literature/LiteratureBrowser.ts — card rendering, modal pattern]
- [Source: src/literature/types.ts — LiteratureBrowserCallbacks]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- 0 TypeScript errors, 131 test files, 5185 tests passing

### Completion Notes List

- Code review: 1C 3I — 3 findings fixed (F1 maxHints, F2 reset order, F4 focus management), 1 noted (F3 mutable internal state is intentional)
- 8 articles with hints across all 3 categories (basic: 4, intermediate: 2, advanced: 2)
- Hint panel is a sub-view within the existing modal — hides grid/filters, shows progressive hints
- First hint auto-reveals on click, subsequent hints via "Next hint" button

### Change Log

- F1 fix: Import getHintCount and use actual hint count instead of hardcoded 10
- F2 fix: Call onResetHints callback before clearing local state
- F4 fix: Focus back button when hint panel opens for keyboard nav continuity
- NEW: `src/literature/hintData.ts` — hint content for 8 articles
- NEW: `src/literature/hintData.test.ts` — 11 hint content tests
- NEW: `src/literature/HintProgressStorage.ts` — localStorage persistence
- NEW: `src/literature/HintProgressStorage.test.ts` — 17 storage tests
- MOD: `src/literature/types.ts` — added onHintReveal, onResetHints, hintProgress
- MOD: `src/literature/LiteratureBrowser.ts` — hint button, hint panel, reset button, focus management
- MOD: `src/literature/LiteratureBrowser.test.ts` — 12 new hint system tests
- MOD: `src/literature/index.ts` — added HintProgressStorage, hintData exports
- MOD: `src/ui/App.ts` — imported HintProgressStorage, wired hint callbacks
- MOD: `src/styles/main.css` — hint button, reset button, hint panel CSS

### File List

- src/literature/hintData.ts (NEW)
- src/literature/hintData.test.ts (NEW)
- src/literature/HintProgressStorage.ts (NEW)
- src/literature/HintProgressStorage.test.ts (NEW)
- src/literature/types.ts
- src/literature/LiteratureBrowser.ts
- src/literature/LiteratureBrowser.test.ts
- src/literature/index.ts
- src/ui/App.ts
- src/styles/main.css
