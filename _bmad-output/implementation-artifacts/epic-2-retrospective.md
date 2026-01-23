# Epic 2 Retrospective: Assembly Code Editor

**Facilitated by:** Bob (Scrum Master)
**Date:** 2026-01-22
**Epic Status:** Done
**Stories Delivered:** 6/6 (100%)

---

## Epic Summary

Epic 2 delivered a full-featured Monaco-based assembly code editor for Micro4. All 6 stories were completed successfully with comprehensive test coverage.

### Stories Completed

| Story | Title | Tests Added | Key Deliverable |
|-------|-------|-------------|-----------------|
| 2.1 | Integrate Monaco Editor | 46 | Monaco wrapper with da-dark theme |
| 2.2 | Implement Micro4 Syntax Highlighting | 21 | Monarch tokenizer, Dracula colors |
| 2.3 | Display Line Numbers | 6 | Verification + WCAG contrast tests |
| 2.4 | Enable Undo/Redo Functionality | ~15 | Menu integration, history simulation |
| 2.5 | Display Cursor Position in Status Bar | 18 | Event wiring, real-time updates |
| 2.6 | Implement Editor Keyboard Shortcuts | 40 | KeyboardShortcutsDialog component |

---

## What Went Well

### 1. Monaco Simplifies Everything
Most Epic 2 stories discovered that Monaco Editor provides features by default:
- **Line numbers** - Already enabled (Story 2.3)
- **Undo/Redo** - Built-in keyboard shortcuts Ctrl+Z, Ctrl+Y (Story 2.4)
- **Keyboard shortcuts** - Full set included, find/replace dialogs (Story 2.6)

This allowed us to focus on integration, testing, and UI polish rather than reimplementation.

### 2. Clean Architecture Pattern Established
The callback wiring pattern through App.ts (established in Story 2.4, refined in 2.5) provides:
- Component decoupling (Editor ↔ StatusBar communicate via App)
- Clear unidirectional data flow
- Testable interfaces at each boundary

**Example pattern:**
```typescript
// App.ts wires Editor events to StatusBar updates
this.editor = new Editor({
  onCursorPositionChange: (position) => {
    this.statusBar.setState({ cursorPosition: position });
  }
});
```

### 3. Module-Level Registration Pattern
For one-time operations (theme registration, language registration), the pattern:
```typescript
let registered = false;
export function resetRegistration() { registered = false; }
```
Enables test isolation while preventing duplicate Monaco registrations in production.

### 4. Code Review Catching Issues
Every story review found and fixed issues:
- Story 2.3: Removed tautological tests, fixed test count overcounting
- Story 2.6: Removed unused 'navigation' category (dead code)
- Story 2.5: Consolidated duplicate CursorPosition interface

### 5. Comprehensive Test Coverage
Started Epic with ~288 tests from Epic 1, ended with ~430+ tests. Each story added both unit tests and App-level integration tests.

---

## Challenges Faced

### 1. Epic 1 Action Items Not Addressed
5 action items from Epic 1 retrospective - **0 completed**:

| Action Item | Status |
|-------------|--------|
| Add accessibility checklist to story template | ❌ Not done |
| Document escapeHtml() pattern | ❌ Not done |
| Create keyboard navigation testing guide | ❌ Not done |
| Document event listener cleanup pattern | ⚠️ Partially (in stories, not formalized) |
| Review Monaco bundle optimization | ⚠️ Partially (using but not optimized) |

**Root cause:** No dedicated time allocated for process improvements. Action items were noted but never scheduled.

**Lesson:** Must allocate explicit time/story slots for technical debt and process improvements.

### 2. Duplicate Type Definitions
Story 2.5 discovered `CursorPosition` interface was needed in both StatusBar.ts and Editor.ts, leading to:
- Initially defined in StatusBar.ts
- Needed import in Editor.ts
- Created circular dependency risk

**Fix:** Moved `CursorPosition` to Editor module as single source of truth, re-exported through index.ts.

### 3. Documentation Gaps in File Lists
Multiple code reviews caught files that were modified but not listed in story documentation's File List section.

**Lesson:** Update File List during implementation, not just at review time.

### 4. Monaco Mock Complexity
Testing Monaco editor features required increasingly complex mocks:
- Undo/redo stack simulation
- Cursor position event callbacks
- Action trigger method support

The mock in Editor.test.ts grew substantially across stories.

---

## Key Discoveries

### Monaco Features Built-In (No Implementation Needed)
| Feature | Discovered In | Default Behavior |
|---------|---------------|------------------|
| Line numbers | Story 2.3 | `lineNumbers: 'on'` is default |
| Undo/Redo | Story 2.4 | Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z |
| Select All | Story 2.6 | Ctrl+A |
| Find/Replace | Story 2.6 | Ctrl+F, Ctrl+H with widgets |
| Tab indent | Story 2.6 | Tab, Shift+Tab |
| Copy/Cut/Paste | Story 2.6 | Browser native |

### Patterns Established

| Pattern | Stories | Description |
|---------|---------|-------------|
| Module-level global flag + reset | 2.1, 2.2 | One-time registration with test isolation |
| Callback wiring through App.ts | 2.4, 2.5, 2.6 | Component communication without coupling |
| Event listener disposal | 2.4, 2.5 | Store IDisposable, call dispose() in destroy() |
| WCAG contrast verification | 2.3 | Calculate actual contrast ratios in tests |
| Dialog component pattern | 2.6 | Backdrop + dialog, Escape to close, ARIA attrs |

---

## Code Review Issue Summary

| Story | HIGH | MEDIUM | LOW | Key Issues |
|-------|------|--------|-----|------------|
| 2.1 | - | - | - | Clean implementation |
| 2.2 | - | - | - | Clean implementation |
| 2.3 | - | 1 | 1 | Tautological test, test count mismatch |
| 2.4 | - | 2 | 2 | Missing redo clear test, shortcut docs |
| 2.5 | - | 1 | 2 | File List incomplete, duplicate interface |
| 2.6 | - | 1 | 1 | Unused category, tautological test |

**Common Patterns:**
1. File List documentation gaps - 2 stories
2. Dead/unused code to remove - 2 stories
3. Test quality issues - 2 stories

---

## Action Items for Epic 3

### Carried Forward from Epic 1 (Must Address)

| # | Action Item | Priority | Status |
|---|-------------|----------|--------|
| 1 | Add accessibility checklist to story template | HIGH | DONE (Epic 3) |
| 2 | Document escapeHtml() pattern | MEDIUM | DONE (Epic 4 retro) - `docs/patterns/xss-prevention.md` |
| 3 | Document event listener cleanup pattern | MEDIUM | DONE (Epic 4 retro) - `docs/patterns/event-listener-cleanup.md` |

### New from Epic 2

| # | Action Item | Priority | Status |
|---|-------------|----------|--------|
| 4 | Allocate time for process debt in sprint planning | HIGH | DONE (Epic 4 retro addressed all debt) |
| 5 | Add WASM compilation step to CI/CD | HIGH | DONE (Epic 4 retro) - `.github/workflows/ci.yml` |
| 6 | Create Web Worker messaging pattern guide | MEDIUM | DONE (Epic 4 retro) - `docs/patterns/web-worker-bridge.md` |
| 7 | Document Monaco error marker integration | MEDIUM | DONE (Epic 3 via implementation) |
| 8 | Consolidate Monaco mock into shared test utility | LOW | DONE (Epic 4 retro) - `src/test-utils/monaco-mock.ts` |

---

## Epic 3 Preview

**Goal:** Users can assemble Micro4 code and see errors or binary output

**Stories:**
- 3.1: Compile Assembler to WASM
- 3.2: Create Assembler Web Worker
- 3.3: Implement Assemble Button
- 3.4: Display Assembly Errors with Line Numbers
- 3.5: Implement Rich Error Display
- 3.6: Show Binary Output View
- 3.7: Validate Syntax Before Execution

**Key Risks:**
1. **WASM compilation** - First use of Emscripten toolchain
2. **Web Worker messaging** - New communication pattern
3. **Monaco error markers** - Integration with editor for inline errors

**Preparation Needed:**
- Review Emscripten documentation
- Understand postMessage/onmessage patterns
- Research Monaco setModelMarkers API

---

## Retrospective Metrics

| Metric | Value |
|--------|-------|
| Stories Planned | 6 |
| Stories Completed | 6 |
| Completion Rate | 100% |
| Code Review Issues Fixed | ~12 |
| New Tests Added | ~140 |
| Final Test Count | ~430 |
| Epic 1 Action Items Addressed | 0/5 |
| Monaco Features Found Built-in | 6 |

---

## Team Feedback

### What to Keep Doing
- Adversarial code review process
- Module-level registration pattern with reset functions
- Callback wiring through App.ts for component communication
- Researching framework capabilities before implementing

### What to Start Doing
- Schedule dedicated time for process improvements
- Update File List during implementation (not just review)
- Consolidate duplicate types immediately when discovered
- Create shared test utilities for common mocks

### What to Stop Doing
- Deferring action items indefinitely
- Duplicating type definitions across modules
- Assuming features need custom implementation (check Monaco first)

---

## Conclusion

Epic 2 successfully delivered a full-featured assembly code editor with Monaco integration. The key insight was that Monaco provides most editor features by default, allowing the team to focus on integration, theming, and user experience rather than reimplementation.

The main improvement area is **process discipline** - action items from Epic 1 were not addressed, and this pattern must not continue. Allocating explicit time for process improvements is critical.

The team is ready to proceed to Epic 3: Code Assembly & Error Handling, which introduces new challenges with WASM compilation and Web Workers.

---

*Generated: 2026-01-22*
*Agent: Claude Opus 4.5 (claude-opus-4-5-20251101)*
