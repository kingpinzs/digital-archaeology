# Story 9.7: Implement Unsaved Work Warning

Status: done

## Story

As a user,
I want to be warned before losing unsaved work,
So that I don't accidentally lose changes.

## Acceptance Criteria

1. **Given** I have unsaved changes in the editor
   **When** I try to close the browser tab or window
   **Then** a browser-native confirmation dialog appears (beforeunload)
   **And** I can choose to stay or leave

2. **Given** I have unsaved changes in the editor
   **When** I try to load a different file (example, import)
   **Then** a confirmation dialog appears before replacing content
   **And** I can choose to continue or cancel

3. **Given** I have unsaved changes in the editor
   **When** I click File > New
   **Then** a confirmation dialog appears before clearing content
   **And** I can choose to continue or cancel

4. **Given** the editor content matches the last saved/loaded state
   **When** I perform any action that would trigger unsaved work warning
   **Then** no warning dialog appears
   **And** the action proceeds immediately

5. **Given** the beforeunload handler is registered
   **When** the App component is destroyed
   **Then** the event listener is properly cleaned up

## Tasks / Subtasks

- [x] Task 1: Track original content for dirty state comparison (AC: #1, #4)
  - [x] 1.1: Add `private originalContent: string = ''` property to App class
  - [x] 1.2: Add `public hasUnsavedChanges(): boolean` method comparing `editor.getValue()` to `originalContent`
  - [x] 1.3: Update `originalContent` when editor is loaded (mount), example loaded, import completes
  - [x] 1.4: Update `originalContent` when File > New clears editor

- [x] Task 2: Implement beforeunload handler (AC: #1, #5)
  - [x] 2.1: Add `private boundBeforeUnload: (e: BeforeUnloadEvent) => void` property
  - [x] 2.2: Create `private handleBeforeUnload(e: BeforeUnloadEvent): void` method
  - [x] 2.3: In handler: if `hasUnsavedChanges()`, set `e.preventDefault()` and `e.returnValue = ''`
  - [x] 2.4: Register listener in `mount()`: `window.addEventListener('beforeunload', this.boundBeforeUnload)`
  - [x] 2.5: Remove listener in `destroy()`: `window.removeEventListener('beforeunload', this.boundBeforeUnload)`

- [x] Task 3: Centralize unsaved work confirmation helper (AC: #2, #3, #4)
  - [x] 3.1: Create `private confirmUnsavedChanges(actionDescription: string): boolean` helper method
  - [x] 3.2: Logic: `if (!this.hasUnsavedChanges()) return true;` (no warning needed)
  - [x] 3.3: Otherwise: `return window.confirm(\`${actionDescription} will replace your current code.\n\nAre you sure you want to continue?\`)`
  - [x] 3.4: Replace inline confirm in `handleExampleSelect` with `confirmUnsavedChanges('Loading "' + program.name + '"')`
  - [x] 3.5: Replace inline confirm in `handleImportAssembly` with `confirmUnsavedChanges('Importing a file')`

- [x] Task 4: Implement File > New handler (AC: #3)
  - [x] 4.1: Create `private handleFileNew(): void` method
  - [x] 4.2: Call `confirmUnsavedChanges('Creating a new file')` — return if false
  - [x] 4.3: Clear editor: `this.editor?.setValue('')`
  - [x] 4.4: Update `originalContent = ''`
  - [x] 4.5: Update status bar: `this.statusBar?.updateState({ loadStatus: 'New file' })`
  - [x] 4.6: Update callback wiring: `onFileNew: () => this.handleFileNew()`

- [x] Task 5: Write tests (AC: all)
  - [x] 5.1: Test `hasUnsavedChanges()` returns false when content matches original
  - [x] 5.2: Test `hasUnsavedChanges()` returns true when content differs from original
  - [x] 5.3: Test beforeunload handler sets `e.preventDefault()` when dirty
  - [x] 5.4: Test beforeunload handler does nothing when not dirty
  - [x] 5.5: Test beforeunload listener removed in destroy()
  - [x] 5.6: Test `confirmUnsavedChanges()` skips dialog when not dirty
  - [x] 5.7: Test `confirmUnsavedChanges()` shows dialog when dirty
  - [x] 5.8: Test handleFileNew confirms before clearing when dirty
  - [x] 5.9: Test handleFileNew clears immediately when not dirty
  - [x] 5.10: Test handleExampleSelect uses centralized confirm helper
  - [x] 5.11: Test handleImportAssembly uses centralized confirm helper
  - [x] 5.12: Test originalContent updated after successful example load
  - [x] 5.13: Test originalContent updated after successful import

## Dev Notes

### Architecture Context

**From architecture.md:** Tiered persistence strategy with NFR15-17 compliance:
- NFR15: Unsaved work protection (THIS STORY)
- NFR16: Persistence (Stories 9.1-9.3)
- NFR17: Valid exports (Stories 9.4-9.6)

This story implements FR31 unsaved work warning component and contributes to NFR15 (unsaved work protection).

### What's Already Implemented (DO NOT DUPLICATE)

**Existing confirm patterns in App.ts (HISTORICAL - these were refactored):**

> **Note:** The line numbers below are from BEFORE implementation. The code has been
> refactored to use the centralized `confirmUnsavedChanges()` helper. See Implementation
> section for current line numbers.

```typescript
// handleExampleSelect (LEGACY ~line 3075-3082 - now refactored at ~line 3135)
const currentContent = this.editor?.getValue() ?? '';
if (currentContent.trim().length > 0) {
  const confirmed = window.confirm(
    `Loading "${program.name}" will replace your current code.\n\nAre you sure you want to continue?`
  );
  if (!confirmed) return;
}

// handleImportAssembly (LEGACY ~line 3004-3011 - now refactored at ~line 3056)
const currentContent = this.editor?.getValue() ?? '';
if (currentContent.trim().length > 0) {
  const confirmed = window.confirm(
    'Importing a file will replace your current code.\n\nAre you sure you want to continue?',
  );
  if (!confirmed) return;
}
```
**Problem (now fixed):** These checked `currentContent.trim().length > 0` not actual dirty state. A loaded example file IS content but isn't "unsaved changes" — the user hasn't modified it.

**HdlViewerPanel pattern (good reference):**
```typescript
// src/hdl/HdlViewerPanel.ts lines 597-603
private originalContent: string = '';

hasUnsavedChanges(): boolean {
  const currentContent = this.editor?.getValue() ?? '';
  return currentContent !== this.originalContent;
}
```
**This is the correct pattern** — compare current to original, not just "has content".

**Callback placeholder in App.ts:**
```typescript
onFileNew: () => { /* Epic 9: File Operations */ },  // ~line 489
```

### beforeunload Event Pattern

**Browser requirement:** The `beforeunload` event has specific requirements:
```typescript
private handleBeforeUnload(e: BeforeUnloadEvent): void {
  if (this.hasUnsavedChanges()) {
    e.preventDefault();
    // Modern browsers ignore custom messages, but some require returnValue
    e.returnValue = '';
  }
}
```

**Critical:** Chrome/Firefox ignore custom messages and show generic "Changes you made may not be saved" dialog. This is expected browser security behavior.

### Event Listener Cleanup Pattern

**From project-context.md:** All event listeners must be removed in `destroy()` to prevent memory leaks.

```typescript
// In constructor or as class property
private boundBeforeUnload = this.handleBeforeUnload.bind(this);

// In mount()
window.addEventListener('beforeunload', this.boundBeforeUnload);

// In destroy()
window.removeEventListener('beforeunload', this.boundBeforeUnload);
```

### Centralized Helper Design

Replace duplicated confirm logic with:
```typescript
/**
 * Confirm with user before losing unsaved changes.
 * Returns true if action should proceed (no changes or user confirmed).
 */
private confirmUnsavedChanges(actionDescription: string): boolean {
  if (!this.hasUnsavedChanges()) {
    return true; // No unsaved changes, proceed immediately
  }
  return window.confirm(
    `${actionDescription} will replace your current code.\n\nAre you sure you want to continue?`
  );
}
```

### When to Update originalContent

Update `this.originalContent` when content is "saved" or "loaded":
1. **mount():** After editor is initialized (initial state is "clean")
2. **handleExampleSelect:** After successfully loading example content
3. **handleImportAssembly:** After successfully setting imported content
4. **handleFileNew:** After clearing editor (empty is the new "original")
5. **Future (Story 9.8):** After File > Save or Save As

### Testing beforeunload

**JSDOM limitation:** `beforeunload` events are tricky to test. Pattern:
```typescript
it('should set e.preventDefault when dirty', () => {
  // Setup: make editor dirty
  mockEditorInstance.getValue.mockReturnValue('modified content');

  // Create mock event
  const mockEvent = {
    preventDefault: vi.fn(),
    returnValue: '',
  } as unknown as BeforeUnloadEvent;

  // Call handler directly (can't dispatch real beforeunload in JSDOM)
  app['handleBeforeUnload'](mockEvent);

  expect(mockEvent.preventDefault).toHaveBeenCalled();
  expect(mockEvent.returnValue).toBe('');
});
```

### Edge Cases to Handle

1. **Empty editor on mount:** `originalContent = ''` initially — no dirty state
2. **Whitespace-only changes:** Should be considered dirty (differs from original)
3. **Reload example:** Loading same example twice — not dirty after first load
4. **Import same file twice:** After first import, content matches original — not dirty
5. **Multiple edit cycles:** Each save/load resets original, new edits create dirty state

### Previous Story Learnings (from Stories 9.4-9.6)

**DO follow these patterns:**
- Use `vi.hoisted()` for mock functions in `vi.mock()` factories
- Test error scenarios and edge cases
- Bound handler pattern for event listeners (constructor bind, stored as property)
- Clean up event listeners in destroy()

**DON'T repeat these mistakes:**
- Missing callback tests in MenuBar
- Missing negative assertions
- Incorrect type annotations for async handlers

### Accessibility Checklist

- [x] **Keyboard Navigation** — N/A (uses native browser dialogs)
- [x] **ARIA Attributes** — N/A (native dialogs are inherently accessible)
- [x] **Focus Management** — Native `window.confirm` and `beforeunload` handle focus correctly
- [x] **Color Contrast** — N/A (native browser UI)
- [x] **XSS Prevention** — No user content in dialog messages (action descriptions are hardcoded)
- [x] **Screen Reader Announcements** — Native dialogs are announced by screen readers

### Project Structure Notes

**Modified Files:**
- `src/ui/App.ts` — Add originalContent tracking, hasUnsavedChanges(), beforeunload handler, confirmUnsavedChanges(), handleFileNew(), update existing handlers
- `src/ui/App.test.ts` — Add tests for dirty state tracking, beforeunload, confirm helper, file new

**No New Files:** All changes are within existing App class.

### References

- [Source: epics.md#Story-9.7] — User story and acceptance criteria
- [Source: architecture.md#Persistence] — NFR15-17 requirements
- [Source: project-context.md#State-Management-Rules] — `hasUnsavedChanges` boolean prefix convention
- [Source: project-context.md#Event-Listener-Cleanup-Pattern] — Bound handler cleanup pattern
- [Source: HdlViewerPanel.ts:597-603] — Reference implementation of hasUnsavedChanges()
- [Source: HdlViewerPanel.ts:466-478] — Reference implementation of unsaved changes confirmation
- [Source: App.ts:3075-3082] — Existing handleExampleSelect confirm (to refactor)
- [Source: App.ts:3004-3011] — Existing handleImportAssembly confirm (to refactor)
- [Source: App.ts:489] — onFileNew placeholder callback

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

1. **Task 1 - Dirty state tracking:**
   - Added `originalContent: string = ''` property to App class
   - Added `boundBeforeUnload` property for event listener cleanup
   - Added `hasUnsavedChanges()` public method comparing editor content to originalContent
   - Updated `loadSavedProject()`, `handleExampleSelect()`, `handleImportAssembly()` to set originalContent

2. **Task 2 - beforeunload handler:**
   - Added `handleBeforeUnload(e)` method with `e.preventDefault()` and `e.returnValue = ''` when dirty
   - Registered listener in `mount()` with `window.addEventListener('beforeunload', ...)`
   - Removed listener in `destroy()` with `window.removeEventListener('beforeunload', ...)`

3. **Task 3 - Centralized confirmation helper:**
   - Added `confirmUnsavedChanges(actionDescription)` returning boolean
   - Skips dialog when `!hasUnsavedChanges()` returns true
   - Refactored `handleExampleSelect()` and `handleImportAssembly()` to use helper
   - Confirmation now based on dirty state (originalContent comparison), not just content length

4. **Task 4 - File > New handler:**
   - Added `handleFileNew()` method with confirmation, clear, originalContent reset, status bar update
   - Wired `onFileNew: () => this.handleFileNew()` callback in MenuBar initialization

5. **Task 5 - Tests:**
   - Added 21 new tests covering all acceptance criteria
   - Tests for hasUnsavedChanges(), beforeunload handler, confirmUnsavedChanges(), handleFileNew()
   - Tests verify dirty state based on originalContent comparison, not content length
   - All 3,696 tests pass

### File List

- `src/ui/App.ts` (MODIFIED) - Added dirty state tracking, beforeunload handler, confirmation helper, File > New
- `src/ui/App.test.ts` (MODIFIED) - Added 22 tests for Story 9.7 (21 initial + 1 from code review)

## Code Review Record

### Review Date
2026-02-05

### Reviewer
Claude Opus 4.5 (adversarial code review)

### Issues Found
- **M1** (MEDIUM): Missing test for example load error leaving originalContent unchanged
- **M2** (MEDIUM): Dev Notes had outdated line references (needed HISTORICAL annotation)
- **L3** (LOW): confirmUnsavedChanges JSDoc could be more explicit about return values
- **L4** (LOW): Minor documentation clarity issues

### Fixes Applied

1. **M1 Fixed**: Added test `should NOT update originalContent if example load fails` to verify error handling preserves original state
2. **M2 Fixed**: Updated Dev Notes section with HISTORICAL annotation clarifying line numbers are pre-refactoring
3. **L3 Fixed**: Enhanced JSDoc for `confirmUnsavedChanges()` with explicit @param and @returns documentation
4. **L4 Fixed**: Clarified problem statement in Dev Notes (added "now fixed" annotation)

### Post-Review Test Status
All tests pass (22 tests for Story 9.7)
