# Story 20.2: Implement Article Categories

Status: done

## Story

As a user,
I want to see rich category information with descriptions, article counts, and stage relevance,
so that I can understand what each category covers and choose where to start learning.

## Acceptance Criteria

1. **Given** the literature browser is open, **When** I view the filter chips, **Then** each category chip shows the article count (e.g. "Basic (6)", "Intermediate (6)", "Advanced (8)") and the "All" chip shows the total count "(20)"
2. **Given** the literature browser is open, **When** I view a category section header, **Then** it displays the category description, total estimated read time, and associated lab stages
3. **Given** a `CategoryMetadata` constant exists, **When** I inspect it, **Then** each of the 3 categories has: `key`, `label`, `description`, `relatedStages`, and `icon` (emoji string)
4. **Given** the browser shows category sections, **When** I view a section header, **Then** the header shows the category icon, label, article count, total read time, and a one-line description
5. **Given** the browser is filtered to a single category, **When** I view the category header, **Then** it shows an expanded description with the full category metadata including related lab stage badges
6. **Given** the category metadata exists, **When** helper functions are called, **Then** `getCategoryArticleCount(category)`, `getCategoryTotalReadTime(category)`, and `getCategoryStages(category)` return correct computed values
7. **Given** the category metadata and articles exist, **When** I call `getArticlesWithMetadata()`, **Then** it uses `CATEGORY_METADATA` for ordering and includes metadata alongside grouped articles (Option A: backward-compatible new function, original `getArticlesByCategory()` unchanged)

## Tasks / Subtasks

- [x] Task 1: Define CategoryMetadata type and constant (AC: 3, 6)
  - [x] 1.1 Add `CategoryMetadata` interface to `src/literature/types.ts`
  - [x] 1.2 Add `CATEGORY_METADATA` constant to `src/literature/literatureMetadata.ts`
  - [x] 1.3 Add helper functions: `getCategoryArticleCount()`, `getCategoryTotalReadTime()`, `getCategoryStages()`, `getArticlesWithMetadata()`
  - [x] 1.4 Export new types and constants from `src/literature/index.ts`

- [x] Task 2: Enhance filter chips with article counts (AC: 1)
  - [x] 2.1 "All" chip shows `All (20)` using `this.articles.length`
  - [x] 2.2 Category chips show count — `Basic (6)` using `this.articles.filter()` (instance-aware, not static)
  - [x] 2.3 Dynamic chip counts during search — `Basic (3/6)` via `getSearchFilteredArticles()` + `updateFilters()`

- [x] Task 3: Enhance category section headers (AC: 2, 4)
  - [x] 3.1 Replaced simple `<h3>` with `renderSectionHeader()` — rich header with icon, label, meta
  - [x] 3.2 Rich header includes: category icon (emoji), label, article count, total estimated read time
  - [x] 3.3 CSS `.da-literature-browser__section-meta` added
  - [x] 3.4 CSS `.da-literature-browser__section-icon` added

- [x] Task 4: Implement expanded category header for filtered view (AC: 5)
  - [x] 4.1 `renderCategoryHero()` renders expanded header when `activeCategory` is set
  - [x] 4.2 Shows: icon, label, full description, related stage badges
  - [x] 4.3 CSS `.da-literature-browser__category-hero` added
  - [x] 4.4 CSS `.da-literature-browser__stage-badge` added
  - [x] 4.5 Stage badges use `style.setProperty('--da-stage-color', ...)` for category tinting

- [x] Task 5: Add CSS styles for new elements (AC: 2, 4, 5)
  - [x] 5.1 `.da-literature-browser__section-meta` — muted text, small font
  - [x] 5.2 `.da-literature-browser__section-icon` — inline emoji sizing
  - [x] 5.3 `.da-literature-browser__category-hero` — padded box with left border, description, stage badges
  - [x] 5.4 `.da-literature-browser__stage-badge` — small pills with color-mix tinted background
  - [x] 5.5 Verified: reuses `--da-literature-*`, `--da-text-*`, `--da-bg-tertiary`, `--da-accent` — no phantom variables

- [x] Task 6: Update getArticlesByCategory to include metadata (AC: 7)
  - [x] 6.1 Created `getArticlesWithMetadata()` (Option A — backward compatible) returning `Map<LiteratureCategory, { metadata: CategoryMetadata; articles: LiteratureArticle[] }>`
  - [x] 6.2 Original `getArticlesByCategory()` unchanged — no callers broken
  - [x] 6.3 Verified: all 5 existing `getArticlesByCategory()` tests still pass

- [x] Task 7: Write comprehensive tests (AC: 1-7)
  - [x] 7.1 `CATEGORY_METADATA` validation — 9 tests (3 categories, fields, stages, icons)
  - [x] 7.2 `getCategoryArticleCount()` — 4 tests (6, 6, 8, sum=20)
  - [x] 7.3 `getCategoryTotalReadTime()` — 5 tests (56, 71, 111, sum)
  - [x] 7.4 `getCategoryStages()` — 4 tests (unique stages per category)
  - [x] 7.5 `getArticlesWithMetadata()` — 4 tests (map size, metadata, articles, grouping)
  - [x] 7.6 Chip counts — 7 tests ("All (20)", "Basic (6)", etc., filtered format, restore)
  - [x] 7.7 Rich section headers — 6 tests (icon, label, meta, correct values per category)
  - [x] 7.8 Category hero — 9 tests (hero renders, description, stage badges, remove, switch)
  - [x] 7.9 Dynamic search chip counts tested in 7.6
  - [x] 7.10 `npx vitest run` — 5059 tests pass, 127 test files
  - [x] 7.11 `npx tsc --noEmit` — 0 new errors (2 pre-existing)

## Dev Notes

### Architecture Pattern

This story **extends** the existing literature module created in Story 20.1. The core pattern is:

```
types.ts (add CategoryMetadata) → literatureMetadata.ts (add CATEGORY_METADATA + helpers) → LiteratureBrowser.ts (enhance rendering) → CSS (new section/hero styles)
```

No new files are created. All changes go into existing literature module files.

### What Story 20.1 Already Built

**Existing types (`types.ts`):**
- `LiteratureCategory = 'basic' | 'intermediate' | 'advanced'`
- `CATEGORY_LABELS: Record<LiteratureCategory, string>` — `{ basic: 'Basic', intermediate: 'Intermediate', advanced: 'Advanced' }`
- `CATEGORY_ORDER: readonly LiteratureCategory[]` — `['basic', 'intermediate', 'advanced']`
- `LiteratureArticle` interface with `category`, `tags`, `estimatedReadTime`, `relatedStages`

**Existing metadata (`literatureMetadata.ts`):**
- `LITERATURE_ARTICLES` — 20 articles with full metadata
- `getArticlesByCategory()` — returns `Map<LiteratureCategory, LiteratureArticle[]>`
- `findArticleById()` — finds article by ID

**Existing browser (`LiteratureBrowser.ts`):**
- `renderFilters()` — creates filter chips with plain text labels ("All", "Basic", "Intermediate", "Advanced")
- `renderGrid()` — creates category sections with simple `<h3>` headers showing only the category label
- `renderCard()` — creates article cards with title, description, badge, time
- `getFilteredArticles()` — combines `activeCategory` and `searchQuery` filters
- `updateGrid()` / `updateFilters()` — DOM update methods

**Existing CSS (`main.css`):**
- `--da-literature-basic: #4caf50`
- `--da-literature-intermediate: #ff9800`
- `--da-literature-advanced: #f44336`
- All `.da-literature-browser*`, `.da-literature-card*`, `.da-literature-filter*` styles

### CategoryMetadata Specification

```typescript
export interface CategoryMetadata {
  readonly key: LiteratureCategory;
  readonly label: string;
  readonly description: string;
  readonly relatedStages: readonly LabStage[];
  readonly icon: string;  // emoji, e.g. '🔧'
}
```

**Category values:**
```typescript
export const CATEGORY_METADATA: Record<LiteratureCategory, CategoryMetadata> = {
  basic: {
    key: 'basic',
    label: 'Basic',
    description: 'Foundational digital concepts — binary numbers, logic gates, ALU, registers, and timing. Essential knowledge for understanding the Micro4 CPU.',
    relatedStages: ['micro4'],
    icon: '🔧',
  },
  intermediate: {
    key: 'intermediate',
    label: 'Intermediate',
    description: 'Instruction encoding, control units, memory architecture, and I/O. The building blocks needed for Micro8 and Micro16 development.',
    relatedStages: ['micro4', 'micro8', 'micro16'],
    icon: '⚙️',
  },
  advanced: {
    key: 'advanced',
    label: 'Advanced',
    description: 'Pipelining, caching, virtual memory, branch prediction, and superscalar design. Deep knowledge for Micro32 and beyond.',
    relatedStages: ['micro32', 'micro32p', 'micro32s'],
    icon: '🚀',
  },
};
```

### Helper Function Specifications

```typescript
/** Count articles in a given category */
export function getCategoryArticleCount(category: LiteratureCategory): number {
  return LITERATURE_ARTICLES.filter(a => a.category === category).length;
}

/** Sum estimated read time for all articles in a category */
export function getCategoryTotalReadTime(category: LiteratureCategory): number {
  return LITERATURE_ARTICLES
    .filter(a => a.category === category)
    .reduce((sum, a) => sum + a.estimatedReadTime, 0);
}

/** Get the union of all relatedStages for articles in a category */
export function getCategoryStages(category: LiteratureCategory): readonly LabStage[] {
  const stageSet = new Set<LabStage>();
  for (const article of LITERATURE_ARTICLES) {
    if (article.category === category) {
      for (const stage of article.relatedStages) {
        stageSet.add(stage);
      }
    }
  }
  return Array.from(stageSet);
}
```

### Enhanced Filter Chip Rendering

Current chip text: `Basic`
New chip text: `Basic (6)` — or `Basic (3/6)` when search is active

Implementation in `renderFilters()`:
```typescript
// "All" chip
allChip.textContent = `All (${this.articles.length})`;

// Category chips
chip.textContent = `${CATEGORY_LABELS[category]} (${getCategoryArticleCount(category)})`;
```

When search is active (this.searchQuery is non-empty), update chips to show filtered count:
```typescript
// In updateFilters(), after search changes:
const filteredCount = filteredArticles.filter(a => a.category === category).length;
const totalCount = getCategoryArticleCount(category);
chip.textContent = this.searchQuery.trim()
  ? `${CATEGORY_LABELS[category]} (${filteredCount}/${totalCount})`
  : `${CATEGORY_LABELS[category]} (${totalCount})`;
```

### Enhanced Section Header Rendering

Current section header: `<h3>Basic</h3>`
New section header:
```html
<div class="da-literature-browser__section-header">
  <span class="da-literature-browser__section-icon">🔧</span>
  <h3 class="da-literature-browser__section-label">Basic</h3>
  <span class="da-literature-browser__section-meta">6 articles · ~56 min</span>
</div>
```

With category description as subtitle when in filtered view:
```html
<div class="da-literature-browser__section-header da-literature-browser__section-header--expanded">
  <span class="da-literature-browser__section-icon">🔧</span>
  <h3 class="da-literature-browser__section-label">Basic</h3>
  <span class="da-literature-browser__section-meta">6 articles · ~56 min</span>
  <p class="da-literature-browser__section-description">Foundational digital concepts...</p>
</div>
```

### Expanded Category Hero (Filtered View)

When `activeCategory` is set and user is viewing a single category, render a hero element BEFORE the grid:

```html
<div class="da-literature-browser__category-hero">
  <div class="da-literature-browser__category-hero-header">
    <span class="da-literature-browser__section-icon">🔧</span>
    <h3>Basic</h3>
    <span>6 articles · ~56 min</span>
  </div>
  <p class="da-literature-browser__category-hero-description">
    Foundational digital concepts — binary numbers, logic gates...
  </p>
  <div class="da-literature-browser__category-hero-stages">
    <span class="da-literature-browser__stage-badge">micro4</span>
  </div>
</div>
```

### CSS Additions

All new CSS goes at the end of the existing Literature Browser section in `main.css`. New classes:

- `.da-literature-browser__section-header` — **refactored** from `<h3>` to flex container with icon, label, meta
- `.da-literature-browser__section-icon` — inline emoji with consistent sizing
- `.da-literature-browser__section-meta` — muted secondary text with article count and read time
- `.da-literature-browser__section-label` — the `<h3>` text itself
- `.da-literature-browser__section-description` — paragraph below header in expanded view
- `.da-literature-browser__category-hero` — padded box with left border in category color
- `.da-literature-browser__category-hero-header` — flex row with icon, title, meta
- `.da-literature-browser__category-hero-description` — description paragraph
- `.da-literature-browser__category-hero-stages` — flex row of stage badges
- `.da-literature-browser__stage-badge` — small pill for lab stage name

**Reuse existing CSS variables only:**
- `--da-literature-basic`, `--da-literature-intermediate`, `--da-literature-advanced` (already defined in `:root`)
- `--da-text-primary`, `--da-text-secondary`, `--da-bg-tertiary`, `--da-border` (existing global variables)

Do NOT define any new CSS custom properties — everything needed already exists.

### Critical Patterns (from Story 20.1 Code Review)

1. **CSS variable verification**: Before using any `--da-*` variable in CSS, verify it exists in `:root` in `main.css`. Do NOT invent phantom variables.
2. **color-mix for backgrounds**: Use `color-mix(in srgb, var(--da-literature-*) 20%, transparent)` instead of hardcoded `rgba()` values (L1 fix from 20.1 review).
3. **Double-invocation guard**: Already implemented — do NOT modify `open()` guard logic.
4. **Focus trap**: Already implemented — do NOT modify focus trap or arrow key handling.
5. **Bound event handlers**: Already bound in constructor — do NOT add new document-level event listeners.
6. **`removeOverlay(fireOnClose)` pattern**: `destroy()` passes `false`, `close()` uses default `true`. Do NOT change this pattern.

### Anti-Patterns to Avoid

1. **DO NOT** create new files — all changes go into existing `types.ts`, `literatureMetadata.ts`, `LiteratureBrowser.ts`, `index.ts`, `main.css`
2. **DO NOT** modify the `LiteratureArticle` interface — categories are metadata about the grouping, not about individual articles
3. **DO NOT** add a `difficulty` field — the story notes in 20.1 explicitly decided against this
4. **DO NOT** break existing filter behavior — category chips must still toggle on/off and combine with search
5. **DO NOT** modify `handleKeydown()` — arrow key navigation already works from 20.1 review fix
6. **DO NOT** use `setInterval` or inline styles
7. **DO NOT** break the existing 96 literature tests — refactoring must be backward-compatible
8. **DO NOT** add `aria-live` regions — screen readers will pick up DOM changes naturally from the existing dialog structure
9. **DO NOT** create computed CSS class names with string concatenation like `da-category-hero--${category}` — use data attributes instead for category-specific coloring, or use existing `--da-literature-*` variable in a CSS property set via `style.setProperty()`

### Backward Compatibility Warning

**`getArticlesByCategory()` return type change:**
The current return type is `Map<LiteratureCategory, LiteratureArticle[]>`. Changing it to include metadata will break existing test assertions. Options:
- **Option A (recommended):** Create a NEW function `getArticlesWithMetadata()` and keep the old one unchanged
- **Option B:** Update the return type and fix all callers/tests

Choose **Option A** to avoid breaking the 5 existing tests for `getArticlesByCategory()`. The LiteratureBrowser doesn't call `getArticlesByCategory()` anyway — it uses `CATEGORY_ORDER` + `filter()` directly.

### Existing Reference Components

| Pattern | Reference File | Key Pattern |
|---------|---------------|-------------|
| Category metadata | `src/examples/exampleMetadata.ts` | Flat constant, category grouping |
| Section headers | `src/progress/AchievementGallery.ts` | Tier section headers with metadata |
| Stage badges | `src/ui/StageSelector.ts` | Stage display labels and metadata |
| Hero/detail view | `src/story/StoryBrowser.ts` | Expanded view with metadata |

### Testing Strategy

**Metadata tests (~15 new tests in `literatureMetadata.test.ts`):**
- `CATEGORY_METADATA` has all 3 categories
- Each category has non-empty description, label, icon, relatedStages
- `getCategoryArticleCount()` returns correct counts (6, 6, 8)
- `getCategoryTotalReadTime()` returns correct sums
- `getCategoryStages()` returns correct stage unions
- `getArticlesWithMetadata()` returns metadata + articles for all categories

**Browser tests (~20 new tests in `LiteratureBrowser.test.ts`):**
- Filter chips show counts: "All (20)", "Basic (6)", "Intermediate (6)", "Advanced (8)"
- Chip counts update with search: "Basic (3/6)" when search narrows results
- All chip shows filtered total when search is active
- Section headers contain icon element
- Section headers contain article count and read time
- Category hero appears when filtering to single category
- Category hero shows full description
- Category hero shows stage badges
- Category hero disappears when filter is cleared (back to "All")
- Category hero changes when switching categories

### Project Structure Notes

- **Modified files only** — no new files created
- CSS additions go at END of the Literature Browser section in `main.css`
- Tests are appended to existing test files
- Barrel exports updated in `index.ts` for new public APIs

### Technical Stack

- TypeScript (strict mode, no `any`)
- Vitest + jsdom for testing
- Vite for build
- No external UI libraries
- CSS with `--da-*` custom properties

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 20, Story 20.2]
- [Source: _bmad-output/implementation-artifacts/20-1-create-literature-browser.md — previous story, architecture patterns, code review fixes]
- [Source: digital-archaeology-web/src/literature/types.ts — existing type definitions]
- [Source: digital-archaeology-web/src/literature/literatureMetadata.ts — existing metadata and helpers]
- [Source: digital-archaeology-web/src/literature/LiteratureBrowser.ts — existing modal browser component]
- [Source: digital-archaeology-web/src/styles/main.css — existing CSS variables and literature styles]
- [Source: digital-archaeology-web/src/ui/StageSelector.ts:9 — LabStage type definition]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- TypeScript check: 0 new errors (2 pre-existing in Editor.test.ts and App.test.ts)
- Literature tests: 150 pass (50 metadata + 100 browser) — up from 144 after adversarial review fixes
- Full suite: 5066 tests pass, 127 test files

### Completion Notes List

- Used Option A (backward compatible) for Task 6: created `getArticlesWithMetadata()` instead of modifying `getArticlesByCategory()` return type
- Added `getSearchFilteredArticles()` private method for search-only filtering to support dynamic chip counts
- Updated 1 existing test (`should render section headers matching category labels`) to check `.da-literature-browser__section-label` instead of `.da-literature-browser__section-header` textContent
- CSS uses `color-mix()` for badge backgrounds per L1 fix pattern from Story 20.1

### Code Review Fixes Applied (Self-Review)

| # | Severity | Finding | Fix |
|---|----------|---------|-----|
| H1 | HIGH | Section header showed full-category read time during search (e.g. "1 articles · ~56 min") | `renderSectionHeader` now takes optional `totalTime` param; `renderGrid` computes filtered time via `reduce()` |
| M3 | MEDIUM | `--da-stage-color` dynamically constructed from category string template | Added typed `CATEGORY_COLOR_VARS` map for compile-time safety |
| M4 | MEDIUM | Hero `<h3>` and `<span>` had no CSS class, relied on ancestry selectors | Added `.da-literature-browser__section-label` and `__section-meta` classes to hero elements; removed ancestry selectors from CSS |
| M5 | MEDIUM | Category chip counts used static `getCategoryArticleCount()` instead of `this.articles` | Changed to `this.articles.filter()` in both `renderFilters()` and `updateFilters()` |
| L6 | LOW | Test strings used literal U+00B7 instead of `\u00B7` escape | Replaced all `·` in test assertions with `\u00B7` via replace_all |

### Code Review Fixes Applied (Adversarial Review)

| # | Severity | Finding | Fix |
|---|----------|---------|-----|
| H1 | HIGH | Category hero showed STATIC counts during search, contradicting filtered section headers | `renderCategoryHero()` now accepts optional `filteredCount`/`filteredTime` params; `renderGrid()` passes filtered data |
| H2 | HIGH | ACs 2/4 require description in section headers — only hero had it | Added `__section-description` paragraph to `renderSectionHeader()` (shown in "all categories" view, hidden when hero active) |
| M3 | MEDIUM | "1 articles" — no singular/plural handling | Added `articleWord` logic in both `renderSectionHeader()` and `renderCategoryHero()` |
| M4 | MEDIUM | Duplicated search filter logic in `getSearchFilteredArticles()` and `getFilteredArticles()` | Extracted shared `matchesSearch()` predicate |
| M5 | MEDIUM | H1 regression test hardcoded magic number 56 as threshold | Replaced with per-category lookup using `categoryTotals` map |
| M6 | MEDIUM | AC 7 text says `getArticlesByCategory()` but Option A chose `getArticlesWithMetadata()` | Updated AC 7 text in story file to reflect actual design decision |
| L7 | LOW | `CATEGORY_METADATA.relatedStages` and `getCategoryStages()` could diverge | Added guard test asserting they match |
| L8 | LOW | `dataset.category` cast to `LiteratureCategory` without runtime guard | Added `cat in CATEGORY_LABELS` guard before cast |
| L9 | LOW | Task 2.2 description outdated after M5 fix | Updated task description |

### Change Log

| File | Change |
|------|--------|
| `src/literature/types.ts` | Added `CategoryMetadata` interface |
| `src/literature/literatureMetadata.ts` | Added `CATEGORY_METADATA`, `getCategoryArticleCount()`, `getCategoryTotalReadTime()`, `getCategoryStages()`, `getArticlesWithMetadata()` |
| `src/literature/index.ts` | Exported new types, constants, and functions |
| `src/literature/LiteratureBrowser.ts` | Enhanced `renderFilters()` with counts, added `renderSectionHeader()` with description, `renderCategoryHero()` with filtered counts, `matchesSearch()` shared predicate, `getSearchFilteredArticles()`, runtime guard in `updateFilters()`, singular/plural article word |
| `src/styles/main.css` | Refactored `.da-literature-browser__section-header` to flex layout with `__section-header-row` wrapper, added `__section-description`, `__section-icon`, `__section-label`, `__section-meta`, `__category-hero*`, `__stage-badge` |
| `src/literature/literatureMetadata.test.ts` | Added 26 tests for CATEGORY_METADATA, helpers, getArticlesWithMetadata, stage metadata guard |
| `src/literature/LiteratureBrowser.test.ts` | Updated tests, added 28 new tests for chip counts, section headers, descriptions, hero, pluralization, filtered hero counts |

### File List

- `digital-archaeology-web/src/literature/types.ts`
- `digital-archaeology-web/src/literature/literatureMetadata.ts`
- `digital-archaeology-web/src/literature/index.ts`
- `digital-archaeology-web/src/literature/LiteratureBrowser.ts`
- `digital-archaeology-web/src/styles/main.css`
- `digital-archaeology-web/src/literature/literatureMetadata.test.ts`
- `digital-archaeology-web/src/literature/LiteratureBrowser.test.ts`
