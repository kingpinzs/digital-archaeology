# Epic 8 Retrospective: Example Programs

**Date:** 2026-01-27
**Facilitator:** Bob (Scrum Master)
**Attendees:** Sam (Tech Lead), Dev (Developer), Tessa (Test Engineer), Priya (Product Manager), Jeremy (Product Owner)

---

## Epic Summary

**Goal:** Users can browse and load example programs to learn

**Stories Delivered:** 4 (8.1 - 8.4)
**Original Scope:** 4 stories
**Stories Added Mid-Epic:** 0

**FRs Covered:** FR29 (Browse Examples), FR30 (Load Examples)

---

## What Went Well

### 1. Clean Feature Module Architecture
The entire epic was implemented as a self-contained `src/examples/` module with clear separation:
- `types.ts` - Type definitions and constants
- `exampleMetadata.ts` - Program catalog with metadata
- `ExampleBrowser.ts` - UI component
- `ExampleLoader.ts` - Fetch utilities
- `ExampleTooltip.ts` - Rich hover details

### 2. Comprehensive Accessibility
Every story included full keyboard navigation and ARIA attributes:
- `role="menu"` and `role="menuitem"` on browser
- `role="tooltip"` on description popups
- Arrow keys, Home/End, Enter/Space, Escape all work
- Focus management with previous element restoration
- Tooltip shows on keyboard focus (not just hover)

### 3. Leveraged Existing Work
Story 8.4 (Show Program Comments) discovered that the feature was **already implemented** by Story 2.2's syntax highlighting. This is a success - prior work anticipated future needs.

### 4. High Test Coverage
- Story 8.1: 44 new tests (ExampleBrowser, ExampleLoader, exampleMetadata)
- Story 8.3: 30+ new tests (ExampleTooltip, integration tests)
- Story 8.4: 3 new tests (comment preservation edge cases)
- **Total: ~77 new tests** for this epic

### 5. Memory Leak Prevention
Proactive code review caught and fixed memory leak patterns:
- `itemClickHandlers` Map for tracking and cleanup
- `itemHoverHandlers` Map for hover event cleanup
- `hoverTimeout` cleared on destroy
- `previousActiveElement` cleared after focus restoration

### 6. XSS Prevention
All dynamic content in tooltips uses `escapeHtml()` for:
- Program names
- Descriptions
- Concepts
- Tests verify HTML escaping works

---

## What Went Wrong

### 1. Story Overlap: 8.1 Did Most of 8.2's Work

Story 8.2 "Load Example Programs" was effectively completed within Story 8.1 "Create Example Browser". The implementation naturally included:
- AC #1: Click loads code (via `handleExampleSelect()`)
- AC #2: Unsaved work confirmation (via `window.confirm()`)
- AC #3: Status shows example (via `statusBar.updateState()`)
- AC #4: Can assemble/run (inherited from Epic 3/4)

**Impact:** Story 8.2 became a documentation/verification story with no new code.

**Root Cause:** Story decomposition was too granular. "Browse" naturally implies "select and load."

### 2. Story 8.4 Was Already Done

Story 8.4 "Show Program Comments" was fully satisfied by existing syntax highlighting from Story 2.2:
- Monaco tokenizer rule `[/;.*$/, 'comment']` already existed
- Comment styling `{ foreground: '6272a4', fontStyle: 'italic' }` already existed
- Example programs already contained rich comments

**Impact:** Story became verification + adding tests for edge cases.

**Lesson:** Cross-reference epic stories against existing implementation before planning.

### 3. Minor Documentation Drift

Code review found `exampleLoader.ts` (camelCase) in docs instead of `ExampleLoader.ts` (PascalCase). Small but shows importance of consistent naming.

---

## Lessons Learned

### Planning

1. **Stories can be too granular** - "Browse" and "Load" are the same user action
2. **Check existing implementation before writing stories** - Syntax highlighting had comments covered
3. **Verification stories are valuable** - 8.2 and 8.4 confirmed prior work, added tests

### Technical

4. **Hover delay prevents tooltip flicker** - 300ms delay before showing is good UX
5. **Keyboard and hover should show same info** - Focus triggers tooltip, not just mouseenter
6. **Cache lookups in loops** - `getPrograms()` was called O(n) times until code review fix

### Testing

7. **Edge cases matter** - Comment-only programs, empty concepts arrays, special characters
8. **XSS tests are essential** - Even with hardcoded data, demonstrate the pattern

---

## Action Items

| Action | Owner | Priority | Status |
|--------|-------|----------|--------|
| Review future epics for story overlap before starting | Priya | Medium | New Process |
| Cross-reference new stories against prior epic implementations | Tessa | Medium | New Process |
| Continue code review practice - caught 3 issues in 8.3, 3 in 8.4 | Dev | Ongoing | In Place |

---

## Code Quality Metrics

| Metric | Value |
|--------|-------|
| New tests added | ~77 |
| Code review issues found | 9 (6 HIGH/MEDIUM, 3 LOW) |
| Code review issues fixed | 9/9 (100%) |
| Memory leak patterns fixed | 3 |
| XSS prevention verified | Yes |
| Accessibility verified | Full keyboard + ARIA |

---

## Next Epic Preview: Epic 9 - Work Persistence

**Goal:** Users can save work, resume sessions, and share files

**Key Stories:**
- 9.1: Implement Local Storage for Settings
- 9.2: Implement IndexedDB for Projects
- 9.3: Restore Previous Session
- 9.4: Export Assembly Code
- 9.5: Export Binary File
- 9.6: Import Assembly Code
- 9.7: Implement Unsaved Work Warning
- 9.8: Create File Menu Integration

**Considerations from Epic 8:**
- Story 9.7 (Unsaved Work Warning) already has a basic `window.confirm()` in place from 8.1
- Story 9.8 (File Menu Integration) may overlap with 9.4/9.5/9.6
- localStorage vs IndexedDB split (9.1 vs 9.2) is appropriate - different data types

**Recommendation:** Review 9.7 against existing implementation before starting.

---

## Retrospective Status

- [x] Epic identified and reviewed
- [x] Team assembled and participated
- [x] What went well documented
- [x] What went wrong documented
- [x] Root causes identified
- [x] Lessons learned captured
- [x] Action items assigned
- [x] Process changes defined
- [x] Next epic previewed
