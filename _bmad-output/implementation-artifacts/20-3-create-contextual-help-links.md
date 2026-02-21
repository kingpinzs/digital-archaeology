# Story 20.3: Create Contextual Help Links

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want help links from the UI,
so that I can learn about what I'm seeing.

## Acceptance Criteria

1. **Given** I am viewing the circuit panel, **When** I click a help icon on the panel header, **Then** the literature browser opens pre-filtered to articles relevant to circuit concepts (gates, ALU, Boolean algebra)
2. **Given** I am viewing the state panel, **When** I click a help icon on the panel header, **Then** the literature browser opens pre-filtered to articles relevant to CPU state (registers, flags, memory, stack)
3. **Given** I am viewing the code editor panel, **When** I click a help icon on the panel header, **Then** the literature browser opens pre-filtered to articles relevant to instruction encoding and machine code
4. **Given** the literature browser was opened via a help icon, **When** I view the browser, **Then** articles are pre-filtered to contextually relevant articles **And** a "Show all articles" button allows viewing the full library
5. **Given** the literature browser was opened via a help icon, **When** I close the browser, **Then** focus is restored to the help icon that opened it (existing focus-restoration behavior)
6. **Given** a help context mapping exists, **When** the current lab stage changes, **Then** the contextual filter includes stage-appropriate articles (e.g. Micro4 stage shows basic articles, Micro32 stage shows advanced articles)

## Tasks / Subtasks

- [x] Task 1: Extend LiteratureBrowserData with context filter support (AC: 4, 6)
  - [x] 1.1 Add `HelpContext` type to `src/literature/types.ts` — string union: `'circuit' | 'registers' | 'flags' | 'memory' | 'stack' | 'code-editor'`
  - [x] 1.2 Add `ContextFilter` interface to `src/literature/types.ts` — `{ tags?: readonly string[]; category?: LiteratureCategory; stages?: readonly LabStage[]; contextLabel?: string }`
  - [x] 1.3 Add optional `contextFilter?: ContextFilter` field to `LiteratureBrowserData`
  - [x] 1.4 Export new types from `src/literature/index.ts`

- [x] Task 2: Create help context mapping module (AC: 1, 2, 3, 6)
  - [x] 2.1 Create `src/literature/helpContextMap.ts` — defines `HELP_CONTEXT_MAP: Record<HelpContext, ContextFilter>`
  - [x] 2.2 Circuit context maps to tags: `['gates', 'logic', 'alu', 'boolean', 'transistors']`
  - [x] 2.3 Registers context maps to tags: `['registers', 'flip-flop', 'state', 'latch']`
  - [x] 2.4 Flags context maps to tags: `['registers', 'flip-flop', 'state']`
  - [x] 2.5 Memory context maps to tags: `['memory', 'ram', 'rom', 'hierarchy']`
  - [x] 2.6 Stack context maps to tags: `['subroutines', 'call stack', 'stack frame']`
  - [x] 2.7 Code-editor context maps to tags: `['encoding', 'machine code', 'opcode', 'instruction format']`
  - [x] 2.8 Implement `getContextualArticles(context: HelpContext, stage?: LabStage): LiteratureArticle[]` — filters `LITERATURE_ARTICLES` by matching tags and optionally by stage relevance
  - [x] 2.9 Implement `getContextFilter(context: HelpContext, stage?: LabStage): ContextFilter` — returns the resolved filter for a given context
  - [x] 2.10 Export from `src/literature/index.ts`

- [x] Task 3: Extend LiteratureBrowser to support contextual filtering (AC: 4, 5)
  - [x] 3.1 In `open(data, callbacks)`, detect `data.contextFilter` and store it as `this.contextFilter`
  - [x] 3.2 When `contextFilter` is set, `getFilteredArticles()` additionally filters by matching tags (article must have at least one matching tag)
  - [x] 3.3 Render a "Show all articles" button in the browser header when context filter is active
  - [x] 3.4 Clicking "Show all articles" clears `this.contextFilter` and calls `updateGrid()` / `updateFilters()`
  - [x] 3.5 Show a contextual banner/label at the top of the content area indicating what context triggered the help (e.g., "Showing articles for: Circuit Panel")
  - [x] 3.6 On `close()`, clear `this.contextFilter` so next non-contextual open works normally

- [x] Task 4: Add help icon to PanelHeader (AC: 1, 2, 3)
  - [x] 4.1 Add optional `onHelp?: () => void` callback to `PanelHeaderOptions`
  - [x] 4.2 When `onHelp` is provided, render a help button (`?` icon) before the close button in `render()`
  - [x] 4.3 Help button uses CSS class `.da-panel-help-btn` with appropriate sizing and hover state
  - [x] 4.4 Bind click handler to call `options.onHelp()` with proper cleanup in `destroy()`
  - [x] 4.5 Help button has `aria-label="Help for {title} panel"` for accessibility

- [x] Task 5: Add CSS styles for help icon and contextual banner (AC: 1, 4)
  - [x] 5.1 `.da-panel-help-btn` — small icon button in panel header, subtle styling, hover highlights
  - [x] 5.2 `.da-literature-browser__context-banner` — subtle banner at top of content showing context label
  - [x] 5.3 `.da-literature-browser__show-all-btn` — button to clear context filter, positioned near the banner
  - [x] 5.4 Reuse existing CSS variables only (`--da-text-secondary`, `--da-bg-tertiary`, `--da-accent`, `--da-border`)

- [x] Task 6: Wire help icons into App.ts (AC: 1, 2, 3, 6)
  - [x] 6.1 Create `handleContextualHelp(context: HelpContext)` method in App.ts
  - [x] 6.2 Method calls `getContextFilter(context, this.currentStage)` and passes result to `literatureBrowser.open()`
  - [x] 6.3 Pass `onHelp` callback to circuit panel PanelHeader with `'circuit'` context
  - [x] 6.4 Pass `onHelp` callback to state panel PanelHeader with `'registers'` context (primary state panel context)
  - [x] 6.5 Pass `onHelp` callback to code editor panel PanelHeader with `'code-editor'` context

- [x] Task 7: Write comprehensive tests (AC: 1-6)
  - [x] 7.1 Create `src/literature/helpContextMap.test.ts` — 20 tests for `HELP_CONTEXT_MAP`, `getContextualArticles()`, `getContextFilter()`
  - [x] 7.2 Add tests in `LiteratureBrowser.test.ts` — 8 new tests: context filter opens with filtered articles, "Show all" clears filter, context banner renders, filter cleared on close, combines with category and search
  - [x] 7.3 Add tests in `PanelHeader.test.ts` — 6 new tests: help button renders when onHelp provided, not rendered without it, click fires callback, aria-label set, cleanup, keyboard Enter/Space
  - [x] 7.4 `npx vitest run` — 5100 tests pass, 128 test files
  - [x] 7.5 `npx tsc --noEmit` — 0 TypeScript errors

## Dev Notes

### Architecture Pattern

This story adds a **contextual help layer** connecting existing UI panels to the literature browser. The pattern is:

```
types.ts (add HelpContext, ContextFilter) → helpContextMap.ts (NEW: mapping module) → LiteratureBrowser.ts (extend filtering) → PanelHeader.ts (add help icon) → CSS → App.ts (wire contexts)
```

One new file is created: `helpContextMap.ts`. All other changes extend existing files.

### What Stories 20.1 + 20.2 Already Built

**Existing literature infrastructure:**
- `LiteratureBrowser` modal component with `open(data, callbacks)` / `close()` lifecycle
- `LiteratureBrowserData` interface with `articles` and optional `readArticleIds`
- `LITERATURE_ARTICLES` — 20 articles each with `tags: readonly string[]` and `relatedStages: readonly LabStage[]`
- `getFilteredArticles()` — combines `activeCategory` and `searchQuery` filters
- Focus restoration on close via `previouslyFocusedElement`
- `handleLiteratureClick()` in App.ts — opens browser with all articles
- Category filtering with chips, search, section headers, category hero

**Existing PanelHeader:**
- `PanelHeaderOptions` with `title`, `panelId`, `onClose`
- Renders `.da-panel-header` with title span and close button
- Bound event handlers with proper cleanup
- Used for CODE, CIRCUIT, STATE panels

### Help Context Mapping Design

The mapping is intentionally simple — a flat lookup from UI context to filter criteria:

```typescript
export type HelpContext = 'circuit' | 'registers' | 'flags' | 'memory' | 'stack' | 'code-editor';

export interface ContextFilter {
  readonly tags?: readonly string[];
  readonly category?: LiteratureCategory;
  readonly stages?: readonly LabStage[];
  readonly contextLabel?: string; // e.g., "Circuit Panel"
}

export const HELP_CONTEXT_MAP: Record<HelpContext, ContextFilter> = {
  'circuit': {
    tags: ['gates', 'logic', 'alu', 'boolean', 'transistors'],
    contextLabel: 'Circuit Panel',
  },
  'registers': {
    tags: ['registers', 'flip-flop', 'state', 'latch'],
    contextLabel: 'Registers',
  },
  'flags': {
    tags: ['registers', 'flip-flop', 'state'],
    contextLabel: 'Flags',
  },
  'memory': {
    tags: ['memory', 'ram', 'rom', 'hierarchy'],
    contextLabel: 'Memory',
  },
  'stack': {
    tags: ['subroutines', 'call stack', 'stack frame'],
    contextLabel: 'Call Stack',
  },
  'code-editor': {
    tags: ['encoding', 'machine code', 'opcode', 'instruction format'],
    contextLabel: 'Code Editor',
  },
};
```

**Article matching algorithm:**
```typescript
export function getContextualArticles(context: HelpContext, stage?: LabStage): LiteratureArticle[] {
  const filter = HELP_CONTEXT_MAP[context];
  return LITERATURE_ARTICLES.filter(article => {
    // Must match at least one tag
    const tagMatch = filter.tags
      ? article.tags.some(tag => filter.tags!.some(ft => tag.includes(ft) || ft.includes(tag)))
      : true;
    // Optional stage filter
    const stageMatch = stage
      ? article.relatedStages.includes(stage)
      : true;
    return tagMatch && (stageMatch || !stage);
  });
}
```

Note: When stage filtering would result in zero matches (e.g., 'circuit' context on micro32 stage), fall back to tag-only matching to ensure the user always sees relevant articles.

### LiteratureBrowser Context Filter Integration

When `data.contextFilter` is provided:
1. Store as `this.contextFilter: ContextFilter | null`
2. `getFilteredArticles()` applies context tag matching BEFORE category/search filters
3. A context banner renders at the top: `"Showing articles for: Circuit Panel"` with a "Show all" button
4. Clicking "Show all" sets `this.contextFilter = null` and re-renders
5. On `close()`, `this.contextFilter` is cleared

```typescript
// In getFilteredArticles():
private getFilteredArticles(): LiteratureArticle[] {
  let articles = [...this.articles];

  // Context filter (from help icon)
  if (this.contextFilter?.tags) {
    articles = articles.filter(a =>
      a.tags.some(tag =>
        this.contextFilter!.tags!.some(ft => tag.includes(ft) || ft.includes(tag))
      )
    );
  }

  // Existing category filter
  if (this.activeCategory !== null) {
    articles = articles.filter(a => a.category === this.activeCategory);
  }

  // Existing search filter
  if (this.searchQuery.trim()) {
    const query = this.searchQuery.trim().toLowerCase();
    articles = articles.filter(a => this.matchesSearch(a, query));
  }

  return articles;
}
```

### PanelHeader Help Button Design

The help button is rendered between the title and the close button:

```typescript
// In render():
if (this.options.onHelp) {
  const helpBtn = document.createElement('button');
  helpBtn.className = 'da-panel-help-btn';
  helpBtn.type = 'button';
  helpBtn.setAttribute('aria-label', `Help for ${this.options.title} panel`);
  helpBtn.title = 'Help';
  helpBtn.textContent = '?';
  header.appendChild(helpBtn);
}
```

Layout: `[TITLE] ··· [?] [×]` — title takes `flex: 1`, help and close buttons are fixed-width.

### CSS Additions

All new CSS appended to existing sections:

```css
/* Help button in panel header */
.da-panel-help-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: 1px solid var(--da-border);
  border-radius: 50%;
  background: transparent;
  color: var(--da-text-secondary);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  margin-right: 4px;
  transition: color 0.15s, border-color 0.15s;
}
.da-panel-help-btn:hover {
  color: var(--da-accent);
  border-color: var(--da-accent);
}

/* Context banner in literature browser */
.da-literature-browser__context-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: var(--da-bg-tertiary);
  border-bottom: 1px solid var(--da-border);
  font-size: 12px;
  color: var(--da-text-secondary);
}
.da-literature-browser__show-all-btn {
  background: transparent;
  border: 1px solid var(--da-border);
  border-radius: 4px;
  color: var(--da-accent);
  font-size: 11px;
  padding: 2px 8px;
  cursor: pointer;
}
.da-literature-browser__show-all-btn:hover {
  background: var(--da-bg-tertiary);
}
```

**Reuse existing CSS variables only:**
- `--da-text-secondary`, `--da-bg-tertiary`, `--da-accent`, `--da-border` (all verified in `:root`)

Do NOT define any new CSS custom properties.

### App.ts Wiring

```typescript
// New method
private handleContextualHelp(context: HelpContext): void {
  const contextFilter = getContextFilter(context, this.currentStage);
  this.literatureBrowser.open(
    { articles: LITERATURE_ARTICLES, contextFilter },
    {
      onArticleSelect: () => { /* future: open article reader */ },
      onClose: () => {},
    }
  );
}

// Wire into panel headers
new PanelHeader({
  title: 'CIRCUIT',
  panelId: 'circuit',
  onClose: () => this.togglePanel('circuit'),
  onHelp: () => this.handleContextualHelp('circuit'),
});
```

### Expected Tag → Article Mapping

| Context | Tags Matched | Expected Articles |
|---------|-------------|------------------|
| circuit | gates, logic, alu, boolean, transistors | lit-02 (Logic Gates), lit-03 (Boolean Algebra), lit-04 (ALU) |
| registers | registers, flip-flop, state, latch | lit-05 (Registers & Flip-Flops) |
| flags | registers, flip-flop, state | lit-05 (Registers & Flip-Flops) |
| memory | memory, ram, rom, hierarchy | lit-09 (Memory Architecture), lit-14 (Cache Hierarchy) |
| stack | subroutines, call stack, stack frame | lit-10 (Subroutines & Call Stack) |
| code-editor | encoding, machine code, opcode, instruction format | lit-07 (Instruction Encoding) |

### Critical Patterns (from Story 20.1/20.2)

1. **CSS variable verification**: Before using any `--da-*` variable in CSS, verify it exists in `:root` in `main.css`. Do NOT invent phantom variables.
2. **color-mix for backgrounds**: Use `color-mix(in srgb, var(--da-*) 20%, transparent)` if colored backgrounds needed.
3. **Bound event handlers**: New handlers in PanelHeader must follow the existing `boundHandleClick` / `boundHandleKeydown` pattern with cleanup in `destroy()`.
4. **Focus restoration**: Already implemented — the browser restores focus to `previouslyFocusedElement` on close. This means focus naturally returns to the help icon that triggered the open.
5. **`removeOverlay(fireOnClose)` pattern**: Do NOT modify existing close behavior.
6. **Double-invocation guard**: Already implemented in `open()` — do NOT modify.

### Anti-Patterns to Avoid

1. **DO NOT** create a separate HelpIcon component class — keep help button inline within PanelHeader
2. **DO NOT** use `innerHTML` — use `document.createElement()` and `textContent` per existing pattern
3. **DO NOT** add help icons to sub-components (RegisterView, FlagsView, etc.) in this story — only panel headers. Sub-component help icons are a future enhancement.
4. **DO NOT** break existing `handleLiteratureClick()` behavior — non-contextual opens must still work with no `contextFilter`
5. **DO NOT** pre-select a category when opening contextually — the context filter is orthogonal to category filters
6. **DO NOT** modify the `LiteratureArticle` interface — contextual mapping uses existing `tags` and `relatedStages` fields
7. **DO NOT** use `setInterval`, inline styles, or dynamically constructed CSS class names

### Backward Compatibility

- `LiteratureBrowserData.contextFilter` is optional — all existing callers pass no filter and behavior is unchanged
- `PanelHeaderOptions.onHelp` is optional — existing PanelHeader usage without `onHelp` renders identically to before
- `getFilteredArticles()` returns all articles when `contextFilter` is null — no behavior change for non-contextual opens

### Existing Reference Components

| Pattern | Reference File | Key Pattern |
|---------|---------------|-------------|
| Panel header | `src/ui/PanelHeader.ts` | Optional callback pattern, bound handlers |
| Literature browser | `src/literature/LiteratureBrowser.ts` | Modal lifecycle, data-driven open |
| Article tags | `src/literature/literatureMetadata.ts` | Tag arrays on each article |
| Stage context | `src/ui/App.ts` | `this.currentStage` for current lab stage |
| Help button styling | `src/ui/PanelHeader.ts` close button | Small button pattern in panel header |

### Testing Strategy

**Help context map tests (`helpContextMap.test.ts`, ~15 tests):**
- `HELP_CONTEXT_MAP` has all 6 contexts
- Each context has non-empty tags array
- Each context has a contextLabel
- `getContextualArticles('circuit')` returns articles matching gate/ALU tags
- `getContextualArticles('registers')` returns articles matching register tags
- `getContextualArticles('code-editor')` returns articles matching encoding tags
- Stage-filtered results are subset of unfiltered results
- No context returns empty array (all contexts match at least 1 article)
- `getContextFilter()` returns valid ContextFilter for each context

**LiteratureBrowser context tests (~10 new tests in `LiteratureBrowser.test.ts`):**
- Opens with context filter and shows only matching articles
- Context banner renders with correct label text
- "Show all articles" button visible when context active
- Clicking "Show all" clears filter and shows all articles
- Context banner not visible after clearing filter
- Context filter cleared on close
- Non-contextual open still shows all articles (backward compat)
- Context filter combines with category filter
- Context filter combines with search filter

**PanelHeader help tests (~6 new tests in `PanelHeader.test.ts`):**
- Help button renders when `onHelp` is provided
- Help button NOT rendered when `onHelp` is omitted
- Help button click fires `onHelp` callback
- Help button has correct aria-label
- Help button cleaned up on destroy
- Keyboard Enter/Space on help button fires callback

### Project Structure Notes

- **1 new file:** `src/literature/helpContextMap.ts`
- **Modified files:** `types.ts`, `LiteratureBrowser.ts`, `index.ts`, `PanelHeader.ts`, `main.css`, `App.ts`
- **New test file:** `src/literature/helpContextMap.test.ts`
- **Modified test files:** `LiteratureBrowser.test.ts`, `PanelHeader.test.ts`
- CSS additions go at END of the Panel Header section and Literature Browser section in `main.css`
- Tests appended to existing test files (except new `helpContextMap.test.ts`)

### Technical Stack

- TypeScript (strict mode, no `any`)
- Vitest + jsdom for testing
- Vite for build
- No external UI libraries
- CSS with `--da-*` custom properties
- BEM naming: `.da-panel-help-btn`, `.da-literature-browser__context-banner`, etc.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 20, Story 20.3]
- [Source: _bmad-output/implementation-artifacts/20-1-create-literature-browser.md — modal browser patterns, component reference, code review fixes]
- [Source: _bmad-output/implementation-artifacts/20-2-implement-article-categories.md — CategoryMetadata, enhanced filtering, helper functions]
- [Source: digital-archaeology-web/src/literature/types.ts — LiteratureBrowserData, LiteratureArticle, CategoryMetadata]
- [Source: digital-archaeology-web/src/literature/literatureMetadata.ts — LITERATURE_ARTICLES with tags and relatedStages]
- [Source: digital-archaeology-web/src/literature/LiteratureBrowser.ts — open(), getFilteredArticles(), matchesSearch()]
- [Source: digital-archaeology-web/src/ui/PanelHeader.ts — PanelHeaderOptions, render(), bound handler pattern]
- [Source: digital-archaeology-web/src/ui/App.ts — handleLiteratureClick(), currentStage, PanelHeader instantiation]
- [Source: digital-archaeology-web/src/styles/main.css — --da-text-secondary, --da-bg-tertiary, --da-accent, --da-border verified in :root]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Fixed 6 LiteratureBrowser context test failures caused by detached DOM containers — removed explicit `browser.mount(container)` in context tests, letting browser fall back to `document.body`
- Fixed close/reopen test timing issue with `vi.useFakeTimers()` and `vi.advanceTimersByTime(300)` for exit animation
- Removed unused `LabStage` import in `helpContextMap.test.ts` to fix TypeScript lint error

### Completion Notes List

- All 7 tasks (41 subtasks) implemented and verified
- 37 new tests: 20 helpContextMap + 11 LiteratureBrowser context + 6 PanelHeader help button
- Total test count: 5103 tests, 128 test files, 0 failures
- TypeScript: 0 errors (strict mode, no `any`)
- All additions are backward-compatible (optional fields only)
- Bidirectional substring matching provides flexible article discovery
- Stage fallback ensures users always see relevant articles even when stage filtering yields zero
- Code review: 0H 3M 3L — all 6 findings fixed

### File List

**New files:**
- `digital-archaeology-web/src/literature/helpContextMap.ts` — Help context mapping module (HELP_CONTEXT_MAP, getContextualArticles, getContextFilter)
- `digital-archaeology-web/src/literature/helpContextMap.test.ts` — 20 tests for help context mapping

**Modified files:**
- `digital-archaeology-web/src/literature/types.ts` — Added HelpContext type, ContextFilter interface, contextFilter to LiteratureBrowserData
- `digital-archaeology-web/src/literature/index.ts` — Added exports for new types and functions
- `digital-archaeology-web/src/literature/LiteratureBrowser.ts` — Added contextFilter state, context tag filtering in getFilteredArticles(), renderContextBanner(), removeContextBanner()
- `digital-archaeology-web/src/literature/LiteratureBrowser.test.ts` — 8 new tests for contextual filtering
- `digital-archaeology-web/src/ui/PanelHeader.ts` — Added onHelp option, help button rendering, bound handlers, cleanup
- `digital-archaeology-web/src/ui/PanelHeader.test.ts` — 6 new tests for help button
- `digital-archaeology-web/src/ui/App.ts` — Added handleContextualHelp method, wired onHelp into 3 panel headers
- `digital-archaeology-web/src/styles/main.css` — Added .da-panel-help-btn, .da-literature-browser__context-banner, .da-literature-browser__show-all-btn styles

### Change Log

| Change | File | Reason |
|--------|------|--------|
| Added HelpContext type (6 union values) | types.ts | AC 1-3: Map UI panels to help contexts |
| Added ContextFilter interface | types.ts | AC 4, 6: Structured filter criteria for contextual help |
| Added contextFilter to LiteratureBrowserData | types.ts | AC 4: Pass filter through data interface |
| Created HELP_CONTEXT_MAP | helpContextMap.ts | AC 1-3: Maps 6 contexts to tag-based filters |
| Created getContextualArticles() | helpContextMap.ts | AC 6: Filters articles by context tags and optional stage |
| Created getContextFilter() | helpContextMap.ts | AC 6: Resolves filter for given context/stage |
| Added contextFilter state + tag filtering | LiteratureBrowser.ts | AC 4: Filters displayed articles by context |
| Added renderContextBanner() | LiteratureBrowser.ts | AC 4: Shows "Showing articles for: X" banner |
| Added "Show all articles" button | LiteratureBrowser.ts | AC 4: Escape hatch to clear context filter |
| Added onHelp option to PanelHeaderOptions | PanelHeader.ts | AC 1-3: Optional help button callback |
| Added help button (?) to render() | PanelHeader.ts | AC 1-3: Visual help trigger with aria-label |
| Added handleContextualHelp() to App | App.ts | AC 1-3, 6: Wires contexts to literature browser |
| Wired onHelp for CODE, CIRCUIT, STATE panels | App.ts | AC 1-3: Each panel triggers correct context |
| Added .da-panel-help-btn CSS | main.css | AC 1: Styled help button in panel header |
| Added .da-literature-browser__context-banner CSS | main.css | AC 4: Styled context banner |
| **Code Review Fixes** | | |
| F1: Exported matchesTags, imported in LiteratureBrowser | helpContextMap.ts, LiteratureBrowser.ts | DRY: eliminate duplicated tag-matching logic |
| F2: Added stage filtering in getFilteredArticles() | LiteratureBrowser.ts | AC 6: contextFilter.stages now consumed with fallback |
| F3: Chip counts use context-filtered base via getContextFilteredArticles() | LiteratureBrowser.ts | UX: chips show correct counts when context active |
| F4: Added padding:0, line-height:1, font-family, :focus rules to help btn | main.css | Consistency: match close button pattern |
| F5: Added :focus-visible to show-all-btn | main.css | A11y: keyboard focus visible on show-all button |
| F6: Removed getContextualArticles from barrel export | index.ts | Cleanup: unused by app, tests import directly |
