# Story 7.3: Enable HDL Editing

Status: done

---

## Story

As a user,
I want to edit HDL files,
So that I can modify circuit definitions.

## Acceptance Criteria

1. **Given** the HDL viewer is open
   **When** I click an "Edit" toggle
   **Then** the viewer becomes editable
   **And** I can modify the HDL content

2. **Given** I am editing HDL
   **When** I make changes
   **Then** unsaved changes are indicated

3. **Given** I have unsaved changes
   **When** I click "Save"
   **Then** changes are saved
   **And** the indicator clears

## Tasks / Subtasks

- [x] Task 1: Add Edit Mode State Management (AC: #1)
  - [x] 1.1 Add `editMode: boolean` private field to HdlViewerPanel (default: false)
  - [x] 1.2 Add `originalContent: string` to track loaded content for dirty detection
  - [x] 1.3 Add `hasUnsavedChanges: boolean` getter comparing current vs original
  - [x] 1.4 Add `onSave?: (content: string) => void` callback to HdlViewerPanelOptions
  - [x] 1.5 Add `onEditModeChange?: (editing: boolean) => void` callback to options

- [x] Task 2: Create Edit Toggle Button in Header (AC: #1)
  - [x] 2.1 Create edit toggle button element with "Edit" / "View" text
  - [x] 2.2 Style button with `da-hdl-viewer-edit-toggle` class
  - [x] 2.3 Add `aria-pressed` attribute reflecting edit state
  - [x] 2.4 Add click handler calling `toggleEditMode()`
  - [x] 2.5 Position button in header between title and close button

- [x] Task 3: Implement Edit Mode Toggle (AC: #1)
  - [x] 3.1 Create `toggleEditMode()` method
  - [x] 3.2 Update Monaco editor `readOnly` option via `editor.updateOptions({ readOnly: !editMode })`
  - [x] 3.3 Update button text and aria-pressed state
  - [x] 3.4 Update panel title to "HDL Viewer" / "HDL Editor"
  - [x] 3.5 Update aria-label on editor container
  - [x] 3.6 Call `onEditModeChange` callback
  - [x] 3.7 Announce mode change to screen readers

- [x] Task 4: Implement Unsaved Changes Indicator (AC: #2)
  - [x] 4.1 Create indicator element with `da-hdl-viewer-dirty` class
  - [x] 4.2 Show dot or asterisk (*) next to title when dirty
  - [x] 4.3 Listen to Monaco `onDidChangeModelContent` event
  - [x] 4.4 Update dirty indicator on content change
  - [x] 4.5 Add `aria-label` describing unsaved state

- [x] Task 5: Create Save Button (AC: #3)
  - [x] 5.1 Create save button element with "Save" text
  - [x] 5.2 Style with `da-hdl-viewer-save` class
  - [x] 5.3 Disable button when no unsaved changes (aria-disabled)
  - [x] 5.4 Add click handler calling `saveContent()`
  - [x] 5.5 Show button only in edit mode
  - [x] 5.6 Add keyboard shortcut Ctrl+S / Cmd+S when in edit mode

- [x] Task 6: Implement Save Functionality (AC: #3)
  - [x] 6.1 Create `saveContent()` method
  - [x] 6.2 Get current content from Monaco editor
  - [x] 6.3 Update `originalContent` to match saved content
  - [x] 6.4 Clear dirty indicator
  - [x] 6.5 Call `onSave` callback with content
  - [x] 6.6 Announce "Changes saved" to screen readers
  - [x] 6.7 Note: Actual persistence is handled by parent component via callback

- [x] Task 7: Handle Unsaved Changes on Close (AC: #2, #3)
  - [x] 7.1 Check for unsaved changes in `hide()` method
  - [x] 7.2 If dirty, show confirmation dialog or prevent close
  - [x] 7.3 Add `forceClose()` method to close without saving
  - [x] 7.4 Update Escape key handler to respect dirty state

- [x] Task 8: Add CSS Styles (AC: #1, #2, #3)
  - [x] 8.1 Style `.da-hdl-viewer-edit-toggle` button
  - [x] 8.2 Style `.da-hdl-viewer-save` button (enabled/disabled states)
  - [x] 8.3 Style `.da-hdl-viewer-dirty` indicator (pulsing dot or asterisk)
  - [x] 8.4 Style edit mode header state (subtle background change)

- [x] Task 9: Create Unit Tests (AC: #1, #2, #3)
  - [x] 9.1 Test `toggleEditMode()` updates readOnly state
  - [x] 9.2 Test edit button toggles between Edit/View text
  - [x] 9.3 Test dirty indicator appears on content change
  - [x] 9.4 Test dirty indicator clears after save
  - [x] 9.5 Test `saveContent()` calls onSave callback
  - [x] 9.6 Test Ctrl+S triggers save in edit mode
  - [x] 9.7 Test close confirmation when dirty

- [x] Task 10: Update Exports (AC: #1)
  - [x] 10.1 Update HdlViewerPanelOptions type in index.ts
  - [x] 10.2 Document new callback options

---

## Dev Notes

### Previous Story Intelligence (Story 7.2)

**Critical Patterns Established:**
- HdlViewerPanel is at `src/hdl/HdlViewerPanel.ts`
- Monaco editor created with `readOnly: true` at line 224
- Theme is `'da-dark-hdl'` with syntax highlighting
- Uses `m4hdlLanguageId` for language
- Has `setContent()` and `getContent()` methods already
- Screen reader announcements via `announce()` method
- Panel header structure at lines 175-191

**Monaco Editor readOnly Toggle Pattern:**
```typescript
// To toggle readOnly mode at runtime:
this.editor?.updateOptions({ readOnly: false });

// To check current state:
const isReadOnly = this.editor?.getOption(monaco.editor.EditorOption.readOnly);
```

**Monaco Content Change Listener:**
```typescript
this.editor?.onDidChangeModelContent((event) => {
  // Called whenever content changes
  this.updateDirtyIndicator();
});
```

### Architecture Compliance

**Required Locations:**
- Modify: `src/hdl/HdlViewerPanel.ts` - Add edit mode functionality
- Modify: `src/hdl/HdlViewerPanel.test.ts` - Add edit mode tests
- Modify: `src/styles/main.css` - Add edit mode styles
- Modify: `src/hdl/index.ts` - Update type exports

**No new dependencies required** - uses existing Monaco Editor API

### File Structure

```
src/hdl/
├── index.ts                 # Update HdlViewerPanelOptions export
├── HdlLoader.ts             # (unchanged)
├── HdlLoader.test.ts        # (unchanged)
├── HdlViewerPanel.ts        # ADD: edit mode, save, dirty indicator
├── HdlViewerPanel.test.ts   # ADD: edit mode tests
├── m4hdl-language.ts        # (unchanged)
└── m4hdl-language.test.ts   # (unchanged)
```

### UI Layout for Edit Mode

```
+--------------------------------------------------+
| HDL Viewer*                    [Edit] [Save] [×] |
+--------------------------------------------------+
|                                                  |
|  Monaco Editor (readOnly: false when editing)    |
|                                                  |
+--------------------------------------------------+

* = dirty indicator (shows when unsaved changes exist)
[Edit] = toggles to [View] when in edit mode
[Save] = disabled when no changes, enabled when dirty
```

### Keyboard Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| Escape | Close panel (with confirmation if dirty) | Always |
| Ctrl+S / Cmd+S | Save changes | Edit mode only |
| Ctrl+E / Cmd+E | Toggle edit mode (optional) | Always |

### Testing Requirements

**Test Pattern (from HdlViewerPanel.test.ts):**
```typescript
describe('edit mode', () => {
  it('should toggle readOnly when edit button clicked', async () => {
    panel = new HdlViewerPanel();
    panel.mount(container);

    const editButton = container.querySelector('.da-hdl-viewer-edit-toggle');
    editButton?.click();

    // Verify Monaco updateOptions was called with readOnly: false
    expect(monaco.editor.create).toHaveBeenCalled();
  });

  it('should show dirty indicator when content changes', () => {
    // ...
  });
});
```

### Accessibility Checklist

- [x] **Keyboard Navigation** - Edit/Save buttons keyboard accessible, Ctrl+S shortcut
- [x] **ARIA Attributes**
  - [x] `aria-pressed` on edit toggle button
  - [x] `aria-disabled` on save button when no changes
  - [x] `aria-label` updates for edit mode state
- [x] **Focus Management** - Focus stays in editor during mode toggle
- [x] **Color Contrast** - Dirty indicator visible against dark theme
- [x] **XSS Prevention** - Content handled by Monaco (already secure)
- [x] **Screen Reader Announcements** - Mode change and save announced

### Project Structure Notes

- Follows established HdlViewerPanel patterns
- Edit mode is opt-in (view mode is default)
- Parent component handles actual persistence via `onSave` callback
- Dirty state is local to panel (not persisted)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 7.3] - Story requirements
- [Source: src/hdl/HdlViewerPanel.ts:214-248] - Monaco editor creation
- [Source: src/hdl/HdlViewerPanel.ts:175-191] - Panel header structure
- [Source: _bmad-output/implementation-artifacts/7-2-implement-hdl-syntax-highlighting.md] - Previous story patterns

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - All tests pass

### Completion Notes List

1. Added edit mode state management with `editMode`, `originalContent`, and new callbacks
2. Created edit toggle button with proper ARIA attributes
3. Implemented `toggleEditMode()` method that updates Monaco's readOnly option
4. Added dirty indicator with asterisk (*) next to title
5. Created save button with proper enabled/disabled states
6. Implemented `saveContent()` with callback and screen reader announcement
7. Added unsaved changes confirmation on close via `hide()` and `forceClose()`
8. Added CSS styles for edit toggle, save button, and dirty indicator
9. Created comprehensive unit tests (25+ new tests for edit mode)
10. Updated exports documentation in index.ts

**Code Review Fixes (2026-01-25):**
- M1: Fixed save button click handler to check `hasUnsavedChanges()` before calling `saveContent()`
- M2: Added test for save button click when disabled (no changes)
- M3: Added `.da-hdl-viewer-panel--editing` CSS class for edit mode header styling (Task 8.4)
- M4: Added edit mode state reset in `forceClose()` to ensure clean state on next show
- L1: Updated class comment to mention optional edit mode
- L2: Improved JSDoc for `saveContent()` method
- Added test for edit mode panel styling class toggle
- Added test for forceClose resetting edit mode state

### File List

- `src/hdl/HdlViewerPanel.ts` - Added edit mode functionality (150+ lines) + code review fixes
- `src/hdl/HdlViewerPanel.test.ts` - Added 28 edit mode tests (25 original + 3 from code review)
- `src/styles/main.css` - Added 65+ lines of edit mode styles (including edit mode header)
- `src/hdl/index.ts` - Updated documentation for new callbacks
