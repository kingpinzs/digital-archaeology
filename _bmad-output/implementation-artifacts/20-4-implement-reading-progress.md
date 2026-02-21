# Story 20.4: Implement Reading Progress

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want my reading tracked,
so that I know what I've learned.

## Acceptance Criteria

1. **Given** I click an article card in the literature browser, **When** the article is selected, **Then** it is marked as "read" and persisted to localStorage
2. **Given** I reopen the literature browser, **When** I view the article grid, **Then** previously read articles show a visual "read" indicator (checkmark badge and reduced opacity)
3. **Given** I have read some articles, **When** I view the literature browser header, **Then** I see reading stats showing "X of Y articles read"
4. **Given** I have read articles in a category, **When** I view category section headers, **Then** the section header shows "X/Y read" count for that category
5. **Given** I want to clear my reading history, **When** I use a "Clear progress" action, **Then** all read markers are removed and stats reset to zero
6. **Given** the browser loads, **When** reading data is corrupted or missing, **Then** it gracefully falls back to empty state (no articles read)

## Tasks / Subtasks

- [x] Task 1: Create ReadingProgressStorage service (AC: 1, 6)
  - [x] 1.1 Create `src/literature/ReadingProgressStorage.ts` following DiscoveryStorage pattern
  - [x] 1.2 Storage key: `digital-archaeology-reading-progress`
  - [x] 1.3 Interface `ReadingProgress { readArticleIds: string[]; lastReadAt?: string }`
  - [x] 1.4 Methods: `load(): ReadonlySet<string>`, `markRead(articleId: string): ReadonlySet<string>`, `clearAll(): void`, `getReadCount(): number`
  - [x] 1.5 Type guard `isValidReadingProgress()` for safe deserialization
  - [x] 1.6 Graceful fallback on corrupted data (return empty Set)

- [x] Task 2: Wire storage into App.ts literature flow (AC: 1, 2)
  - [x] 2.1 Instantiate `ReadingProgressStorage` in App constructor
  - [x] 2.2 Pass `readArticleIds` from storage to `literatureBrowser.open()` data
  - [x] 2.3 In `onArticleSelect` callback, call `storage.markRead(article.id)` and `browser.markArticleRead()`
  - [x] 2.4 Also wire into `handleContextualHelp()` (Story 20.3 path)

- [x] Task 3: Add reading stats to browser header (AC: 3)
  - [x] 3.1 Add `renderReadingStats()` method to LiteratureBrowser — shows "X of Y read" after title
  - [x] 3.2 CSS class `.da-literature-browser__reading-stats` — small, secondary text
  - [x] 3.3 Stats update when article is marked as read (via `updateReadingStats()`)

- [x] Task 4: Add per-category read counts to section headers (AC: 4)
  - [x] 4.1 In `renderSectionHeader()`, compute read count for that category
  - [x] 4.2 Append "X/Y read" text to section meta span
  - [x] 4.3 Update counts when grid re-renders (grid is re-rendered on every state change)

- [x] Task 5: Add read indicator to article cards (AC: 2)
  - [x] 5.1 Existing: `.da-literature-card--read` class already applied — verified opacity: 0.7
  - [x] 5.2 Add checkmark badge `.da-literature-card__read-badge` — "✓" indicator
  - [x] 5.3 CSS for read badge positioning (absolute, top-right corner of card)

- [x] Task 6: Add "Clear progress" button (AC: 5)
  - [x] 6.1 Add "Clear progress" button to browser header (conditionally, only when articles read)
  - [x] 6.2 CSS class `.da-literature-browser__clear-progress-btn` with hover/focus-visible states
  - [x] 6.3 Click handler: call `onClearProgress`, reset `readArticleIds`, re-render grid + stats
  - [x] 6.4 Add `onClearProgress?: () => void` to `LiteratureBrowserCallbacks` for App integration

- [x] Task 7: Write comprehensive tests (AC: 1-6)
  - [x] 7.1 Create `ReadingProgressStorage.test.ts` — 22 tests: load, save, markRead, clearAll, corrupted data, type guard
  - [x] 7.2 Add LiteratureBrowser tests — 10 tests: reading stats, per-category counts, read badge, clear progress, markArticleRead
  - [x] 7.3 `npx vitest run` — 129 files, 5137 tests pass (34 new)
  - [x] 7.4 `npx tsc --noEmit` — 0 TypeScript errors

## Dev Notes

### Architecture Pattern

```
ReadingProgressStorage (NEW) → App.ts (wire storage) → LiteratureBrowser (display stats/badges)
```

### Existing Infrastructure

- `LiteratureBrowserData.readArticleIds?: ReadonlySet<string>` — already in types.ts
- `renderCard()` already checks `readArticleIds.has(article.id)` and adds `.da-literature-card--read`
- `.da-literature-card--read` CSS already exists with `opacity: 0.7`
- App.ts `handleLiteratureClick()` and `handleContextualHelp()` both open the browser

### Storage Pattern (from DiscoveryStorage)

- Constructor takes optional storage key for testing
- try/catch around all localStorage operations
- Type guard for safe deserialization
- `console.error` for failures, never throw

### Critical Patterns

1. **No inline styles** — use CSS classes only
2. **BEM naming** — `.da-literature-browser__reading-stats`, `.da-literature-card__read-badge`
3. **Bound handlers** — follow existing boundHandle* pattern for cleanup
4. **CSS variables only** — `--da-text-secondary`, `--da-accent`, `--da-border`

### References

- [Source: src/progress/DiscoveryStorage.ts — storage pattern]
- [Source: src/literature/types.ts — LiteratureBrowserData.readArticleIds]
- [Source: src/literature/LiteratureBrowser.ts — renderCard read check]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- 0 TypeScript errors, 129 test files, 5137 tests passing

### Completion Notes List

- Code review: 0C 3I 2L — 4 findings fixed (F1, F2, F4, F5), 1 noted (F3 matches existing pattern)
- Task 1: Created ReadingProgressStorage service following DiscoveryStorage pattern
- Task 2: Wired storage into App.ts — both handleLiteratureClick and handleContextualHelp now pass readArticleIds, markRead on select, and onClearProgress callback
- Task 3: Added renderReadingStats() + updateReadingStats() — "X of Y read" in header
- Task 4: Per-category read counts appended to section meta — "X/Y read" suffix
- Task 5: Read badge (✓) rendered in top-right of read cards with position:absolute
- Task 6: Conditional "Clear progress" button with full callback chain
- Task 7: 34 new tests across 2 test files

### Change Log

- F1 fix: Import ReadingProgressStorage via barrel (@literature/index) instead of deep path
- F2 fix: Extract buildClearProgressButton(), re-add button in updateReadingStats() when count rises above zero
- F4 fix: Badge uses aria-hidden="true", card aria-label includes ", read" suffix when read
- F5 fix: storageKey field marked readonly
- NEW: `src/literature/ReadingProgressStorage.ts` — localStorage persistence service
- NEW: `src/literature/ReadingProgressStorage.test.ts` — 22 tests for storage
- MOD: `src/literature/types.ts` — added `onClearProgress?` to LiteratureBrowserCallbacks
- MOD: `src/literature/LiteratureBrowser.ts` — added reading stats, per-category counts, read badge, clear button, markArticleRead()
- MOD: `src/literature/LiteratureBrowser.test.ts` — 10 new reading progress tests
- MOD: `src/literature/index.ts` — added ReadingProgressStorage barrel export
- MOD: `src/ui/App.ts` — imported ReadingProgressStorage, wired into literature flow
- MOD: `src/styles/main.css` — added reading-stats, clear-progress-btn, read-badge CSS; added position:relative to card

### File List

- src/literature/ReadingProgressStorage.ts (NEW)
- src/literature/ReadingProgressStorage.test.ts (NEW)
- src/literature/types.ts
- src/literature/LiteratureBrowser.ts
- src/literature/LiteratureBrowser.test.ts
- src/literature/index.ts
- src/ui/App.ts
- src/styles/main.css
