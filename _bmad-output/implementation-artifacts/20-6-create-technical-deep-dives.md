# Story 20.6: Create Technical Deep-Dives

Status: done

## Story

As a user,
I want detailed explanations available,
so that I can go deeper on topics.

## Acceptance Criteria

1. **Given** I am viewing a literature article card, **When** a deep-dive is available, **Then** I see a "Deep Dive" button on the card
2. **Given** I click the deep-dive button, **When** the deep-dive panel opens, **Then** I see a detailed technical explanation
3. **Given** I am viewing a deep-dive, **When** I read the content, **Then** I see historical context for the topic
4. **Given** I am viewing a deep-dive, **When** I read the content, **Then** I see design trade-offs discussed
5. **Given** I am viewing a deep-dive, **When** I read the content, **Then** I see real-world examples
6. **Given** I am viewing a deep-dive, **When** I click "Back", **Then** I return to the article grid

## Tasks / Subtasks

- [x] Task 1: Define deep-dive data model and content (AC: 1-5)
  - [x] 1.1 Created `deepDiveData.ts` with DeepDive and DeepDiveSection interfaces
  - [x] 1.2 4-section structure: explanation, historicalContext, tradeOffs, realWorldExamples
  - [x] 1.3 Deep-dive content for 6 articles (basic: 2, intermediate: 2, advanced: 2)
  - [x] 1.4 Exports: `getDeepDiveForArticle()`, `ARTICLES_WITH_DEEP_DIVES`

- [x] Task 2: Add deep-dive button to article cards (AC: 1)
  - [x] 2.1 `ARTICLES_WITH_DEEP_DIVES.has(article.id)` check in renderCard
  - [x] 2.2 `.da-literature-card__deep-dive-btn` with stopPropagation
  - [x] 2.3 CSS with hover/focus-visible states

- [x] Task 3: Create deep-dive panel (AC: 2-5, 6)
  - [x] 3.1 `showDeepDivePanel()`, `updateDeepDivePanel()`, `closeDeepDivePanel()`, `renderDeepDivePanel()`
  - [x] 3.2 4-section layout with headings and content
  - [x] 3.3 Back button with focus management
  - [x] 3.4 Full CSS: panel, header, sections, content

- [x] Task 4: Write comprehensive tests (AC: 1-6)
  - [x] 4.1 `deepDiveData.test.ts` — 8 tests (content quality, structure)
  - [x] 4.2 LiteratureBrowser tests — 7 new deep-dive tests
  - [x] 4.3 `npx vitest run` — 132 files, 5200 tests pass (15 new)
  - [x] 4.4 `npx tsc --noEmit` — 0 errors

## Dev Notes

### Architecture

```
deepDiveData.ts (content) → LiteratureBrowser (display panel)
```

No storage needed — deep-dives are read-only content with no state to persist.

### Critical Patterns

1. BEM naming with `da-` prefix
2. CSS variables only
3. Reuse hint panel pattern (sub-view that hides grid)
4. Focus back button on panel open

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- 0 TypeScript errors, 132 test files, 5200 tests passing

### Completion Notes List

- 6 deep-dives: lit-02 (gates), lit-04 (ALU), lit-07 (encoding), lit-09 (memory), lit-13 (pipeline), lit-16 (branch prediction)
- Panel reuses hint panel pattern (hide grid, show sub-view, back button with focus)
- No storage needed — deep-dives are read-only content

### File List

- src/literature/deepDiveData.ts (NEW)
- src/literature/deepDiveData.test.ts (NEW)
- src/literature/LiteratureBrowser.ts
- src/literature/LiteratureBrowser.test.ts
- src/literature/index.ts
- src/styles/main.css
