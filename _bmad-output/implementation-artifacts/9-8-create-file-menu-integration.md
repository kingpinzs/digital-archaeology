# Story 9.8: Create File Menu Integration

Status: done

## Story

As a user,
I want file operations in the menu,
So that I can access them easily.

## Acceptance Criteria

1. **Given** I click the File menu
   **When** the menu opens
   **Then** I see New, Open, Save, Save As options
   **And** I see Export submenu (Assembly, Binary)
   **And** I see Import option
   **And** keyboard shortcuts are shown (Ctrl+N, Ctrl+O, Ctrl+S, Ctrl+Shift+S)
   **And** options are enabled appropriately

2. **Given** I have editor content
   **When** I click File > Save (or press Ctrl+S)
   **Then** the project is saved to IndexedDB
   **And** `originalContent` is updated to match current content (no longer dirty)
   **And** the status bar shows "Saved" confirmation

3. **Given** I have editor content
   **When** I click File > Save As (or press Ctrl+Shift+S)
   **Then** the project is saved to IndexedDB (same as Save for MVP)
   **And** `originalContent` is updated
   **And** the status bar shows "Saved" confirmation

4. **Given** I have unsaved changes
   **When** I click File > Open (or press Ctrl+O)
   **Then** a confirmation dialog appears before loading
   **And** if confirmed, the saved project loads from IndexedDB
   **And** `originalContent` is set to the loaded content
   **And** the status bar shows "Loaded: Project"

5. **Given** no saved project exists
   **When** I click File > Open
   **Then** the status bar shows "No saved project found"
   **And** the editor content is unchanged

6. **Given** I press Ctrl+N
   **Then** File > New behavior is triggered (from Story 9.7)

7. **Given** I press Ctrl+S
   **Then** File > Save behavior is triggered

8. **Given** I press Ctrl+Shift+S
   **Then** File > Save As behavior is triggered

9. **Given** I press Ctrl+O
   **Then** File > Open behavior is triggered

## Tasks / Subtasks

- [x] Task 1: Implement handleFileSave() (AC: #2, #7)
  - [x] 1.1: Create `private async handleFileSave(): Promise<void>` method in App.ts
  - [x] 1.2: Get current content from `this.editor?.getValue() ?? ''`
  - [x] 1.3: Get current breakpoints from `this.getBreakpointsForSave()` (reuses existing helper)
  - [x] 1.4: Get cursor position from `this.getEditorCursorPosition()` (reuses existing helper)
  - [x] 1.5: Create ProjectData object with code, breakpoints, cursorPosition, version
  - [x] 1.6: Call `this.projectStorage.saveProject(projectData)`
  - [x] 1.7: On success: update `this.originalContent = currentContent` (no longer dirty)
  - [x] 1.8: On success: update status bar `this.statusBar?.updateState({ loadStatus: 'Saved' })`
  - [x] 1.9: On failure: update status bar `this.statusBar?.updateState({ loadStatus: 'Save failed' })`
  - [x] 1.10: Wire callback: `onFileSave: () => this.handleFileSave()`

- [x] Task 2: Implement handleFileSaveAs() (AC: #3, #8)
  - [x] 2.1: Create `private async handleFileSaveAs(): Promise<void>` method
  - [x] 2.2: For MVP, call `this.handleFileSave()` (same behavior, no filename dialog)
  - [x] 2.3: Wire callback: `onFileSaveAs: () => this.handleFileSaveAs()`

- [x] Task 3: Implement handleFileOpen() (AC: #4, #5, #9)
  - [x] 3.1: Create `private async handleFileOpen(): Promise<void>` method
  - [x] 3.2: Check for unsaved changes: `if (!this.confirmUnsavedChanges('Opening a project'))` return early
  - [x] 3.3: Call `this.projectStorage.loadProject()` to get saved data
  - [x] 3.4: If null: update status bar `'No saved project found'` and return
  - [x] 3.5: If found: set editor content `this.editor?.setValue(project.code ?? '')`
  - [x] 3.6: Restore breakpoints using `this.breakpoints` Map and `updateBreakpointDecorations()`
  - [x] 3.7: Restore cursor position if available using Monaco setPosition
  - [x] 3.8: Update `this.originalContent = project.code ?? ''`
  - [x] 3.9: Update status bar: `'Loaded: Project'`
  - [x] 3.10: Wire callback: `onFileOpen: () => this.handleFileOpen()`

- [x] Task 4: Implement keyboard shortcuts (AC: #6, #7, #8, #9)
  - [x] 4.1: Add keyboard handler property `private boundKeyboardHandler = (e: KeyboardEvent) => this.handleKeyboardShortcuts(e)`
  - [x] 4.2: Create `private handleKeyboardShortcuts(e: KeyboardEvent): void` method
  - [x] 4.3: Check Ctrl+N: `if (e.ctrlKey && !e.shiftKey && e.key === 'n')` → call `handleFileNew()`, `e.preventDefault()`
  - [x] 4.4: Check Ctrl+O: `if (e.ctrlKey && !e.shiftKey && e.key === 'o')` → call `handleFileOpen()`, `e.preventDefault()`
  - [x] 4.5: Check Ctrl+S: `if (e.ctrlKey && !e.shiftKey && e.key === 's')` → call `handleFileSave()`, `e.preventDefault()`
  - [x] 4.6: Check Ctrl+Shift+S: `if (e.ctrlKey && e.shiftKey && e.key === 'S')` → call `handleFileSaveAs()`, `e.preventDefault()`
  - [x] 4.7: Register listener in `mount()`: `document.addEventListener('keydown', this.boundKeyboardHandler)`
  - [x] 4.8: Remove listener in `destroy()`: `document.removeEventListener('keydown', this.boundKeyboardHandler)`

- [x] Task 5: Write tests (AC: all)
  - [x] 5.1: Test handleFileSave() saves to IndexedDB with correct structure
  - [x] 5.2: Test handleFileSave() updates originalContent on success
  - [x] 5.3: Test handleFileSave() updates status bar on success
  - [x] 5.4: Test handleFileSave() updates status bar on failure
  - [x] 5.5: Test handleFileSaveAs() calls handleFileSave()
  - [x] 5.6: Test handleFileOpen() confirms unsaved changes when dirty
  - [x] 5.7: Test handleFileOpen() skips confirm when not dirty
  - [x] 5.8: Test handleFileOpen() loads project and sets editor content
  - [x] 5.9: Test handleFileOpen() handles no saved project
  - [x] 5.10: Test handleFileOpen() updates originalContent after load
  - [x] 5.11: Test Ctrl+N triggers handleFileNew
  - [x] 5.12: Test Ctrl+O triggers handleFileOpen
  - [x] 5.13: Test Ctrl+S triggers handleFileSave
  - [x] 5.14: Test Ctrl+Shift+S triggers handleFileSaveAs
  - [x] 5.15: Test keyboard listener removed in destroy()
  - [x] 5.16: Test MenuBar onFileSave callback fires
  - [x] 5.17: Test MenuBar onFileSaveAs callback fires
  - [x] 5.18: Test MenuBar onFileOpen callback fires

## Dev Notes

### Architecture Context

**From architecture.md:** Tiered persistence strategy with NFR15-17 compliance:
- NFR15: Unsaved work protection (Story 9.7 ✅)
- NFR16: Persistence (Stories 9.1-9.3 ✅) - localStorage + IndexedDB
- NFR17: Valid exports (Stories 9.4-9.6 ✅)

This story completes Epic 9 by wiring existing persistence infrastructure to user-facing File menu operations.

### What's Already Implemented (DO NOT DUPLICATE)

**ProjectStorage class (Story 9.2):**
```typescript
// src/state/ProjectStorage.ts
export class ProjectStorage {
  async saveProject(project: ProjectData): Promise<boolean>
  async loadProject(): Promise<ProjectData | null>
  async clearProject(): Promise<void>
  async hasProject(): Promise<boolean>
}
```

**App already has projectStorage instance:**
```typescript
// src/ui/App.ts ~line 165
private projectStorage = new ProjectStorage();
```

**handleFileNew() implemented (Story 9.7):**
```typescript
// src/ui/App.ts ~line 3195-3208
private handleFileNew(): void {
  if (!this.confirmUnsavedChanges('Creating a new file')) {
    return;
  }
  if (this.editor) {
    this.editor.setValue('');
  }
  this.originalContent = '';
  this.statusBar?.updateState({ loadStatus: 'New file' });
}
```

**confirmUnsavedChanges() helper (Story 9.7):**
```typescript
// src/ui/App.ts ~line 266-273
private confirmUnsavedChanges(actionDescription: string): boolean {
  if (!this.hasUnsavedChanges()) {
    return true;
  }
  return window.confirm(
    `${actionDescription} will replace your current code.\n\nAre you sure you want to continue?`
  );
}
```

**Menu structure already defined:**
```typescript
// src/ui/MenuBar.ts lines 87-98
file: [
  { id: 'new', label: 'New', shortcut: 'Ctrl+N' },
  { id: 'open', label: 'Open...', shortcut: 'Ctrl+O' },
  { id: 'save', label: 'Save', shortcut: 'Ctrl+S' },
  { id: 'saveAs', label: 'Save As...', shortcut: 'Ctrl+Shift+S' },
  // ... other items
]
```

**Placeholder callbacks in App.ts:**
```typescript
// src/ui/App.ts lines 532-534
onFileOpen: () => { /* Epic 9: File Operations */ },
onFileSave: () => { /* Epic 9: File Operations */ },
onFileSaveAs: () => { /* Epic 9: File Operations */ },
```

### Keyboard Shortcut Pattern

**Browser Conflict Note:** `Ctrl+N` and `Ctrl+O` are browser shortcuts (new window/open file). Must call `e.preventDefault()` to override.

```typescript
private handleKeyboardShortcuts(e: KeyboardEvent): void {
  // Ignore if typing in input/textarea (other than Monaco which handles its own)
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
    return;
  }

  // Ctrl+N: New
  if (e.ctrlKey && !e.shiftKey && e.key === 'n') {
    e.preventDefault();
    this.handleFileNew();
    return;
  }

  // Ctrl+O: Open
  if (e.ctrlKey && !e.shiftKey && e.key === 'o') {
    e.preventDefault();
    this.handleFileOpen();
    return;
  }

  // Ctrl+S: Save
  if (e.ctrlKey && !e.shiftKey && e.key === 's') {
    e.preventDefault();
    this.handleFileSave();
    return;
  }

  // Ctrl+Shift+S: Save As
  if (e.ctrlKey && e.shiftKey && e.key === 'S') {
    e.preventDefault();
    this.handleFileSaveAs();
    return;
  }
}
```

### ProjectData Structure (from types.ts)

```typescript
// src/state/types.ts - ACTUAL interface (corrected from code review)
export interface Breakpoint {
  address: number;
  lineNumber: number;
}

export interface ProjectCursorPosition {
  lineNumber: number;
  column: number;
}

export interface ProjectData {
  code: string;
  breakpoints: Breakpoint[];  // Required, with address+lineNumber
  cursorPosition: ProjectCursorPosition;  // Required
  savedAt: number;
  version: number;
}
```

### Edge Cases to Handle

1. **Empty editor save:** Valid - save empty string as code
2. **Save with no breakpoints:** Valid - breakpoints array can be empty or undefined
3. **Open with no cursor position:** Valid - don't restore cursor
4. **Failed IndexedDB save:** Show error in status bar, don't update originalContent
5. **Restore cursor after open:** Monaco's `setPosition()` may need `setTimeout` for DOM readiness

### Previous Story Learnings (from Story 9.7)

**DO follow these patterns:**
- Use `vi.hoisted()` for mock functions in `vi.mock()` factories
- Test error scenarios and edge cases
- Bound handler pattern for event listeners
- Clean up event listeners in destroy()
- Update `originalContent` ONLY on success

**DON'T repeat these mistakes:**
- Missing callback tests in MenuBar (added tests for 9.7)
- Missing negative assertions
- Forgetting to update originalContent after successful operation

### Testing Keyboard Shortcuts

```typescript
// Test pattern from project-context.md
describe('keyboard shortcuts', () => {
  it('should trigger handleFileSave on Ctrl+S', () => {
    const saveSpy = vi.spyOn(app as any, 'handleFileSave');

    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(saveSpy).toHaveBeenCalled();
  });

  it('should trigger handleFileSaveAs on Ctrl+Shift+S', () => {
    const saveAsSpy = vi.spyOn(app as any, 'handleFileSaveAs');

    const event = new KeyboardEvent('keydown', {
      key: 'S',  // Capital S for shift modifier
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);

    expect(saveAsSpy).toHaveBeenCalled();
  });
});
```

### Accessibility Checklist

- [x] **Keyboard Navigation** — All File menu operations accessible via keyboard shortcuts
- [x] **ARIA Attributes** — Menu items already have proper roles (from MenuBar.ts)
- [x] **Focus Management** — Menu behavior unchanged
- [x] **Color Contrast** — N/A (no UI changes)
- [x] **XSS Prevention** — N/A (no user content in messages)
- [x] **Screen Reader Announcements** — Status bar updates are accessible

### Project Structure Notes

**Modified Files:**
- `src/ui/App.ts` — Add handleFileSave(), handleFileSaveAs(), handleFileOpen(), keyboard shortcuts
- `src/ui/App.test.ts` — Add tests for file operations and keyboard shortcuts

**No New Files:** All changes are within existing App class.

### References

- [Source: epics.md#Story-9.8] — User story and acceptance criteria
- [Source: architecture.md#Persistence] — NFR15-17 requirements
- [Source: project-context.md#State-Management-Rules] — `hasUnsavedChanges` boolean prefix
- [Source: project-context.md#Event-Listener-Cleanup-Pattern] — Bound handler cleanup
- [Source: ProjectStorage.ts:79-103] — saveProject() implementation
- [Source: ProjectStorage.ts:110-139] — loadProject() implementation
- [Source: types.ts] — ProjectData interface
- [Source: App.ts:532-534] — Placeholder callbacks to implement
- [Source: App.ts:266-273] — confirmUnsavedChanges() helper
- [Source: App.ts:3195-3208] — handleFileNew() reference
- [Source: MenuBar.ts:87-98] — Menu structure with shortcuts

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

1. **Task 1 - handleFileSave():**
   - Implemented async method using existing helpers `getBreakpointsForSave()` and `getEditorCursorPosition()`
   - Creates `ProjectData` object matching the interface with `version: 1`
   - Calls `projectStorage.saveProject()` with proper error handling
   - Updates `originalContent` and status bar on success/failure
   - Wired `onFileSave` callback in MenuBar initialization

2. **Task 2 - handleFileSaveAs():**
   - Implemented as thin wrapper calling `handleFileSave()` for MVP
   - Wired `onFileSaveAs` callback

3. **Task 3 - handleFileOpen():**
   - Uses `confirmUnsavedChanges('Opening a project')` for dirty state check
   - Calls `projectStorage.loadProject()` and handles null case
   - Restores breakpoints using `this.breakpoints.set()` + `updateBreakpointDecorations()` (matching loadSavedProject pattern)
   - Restores cursor position with setTimeout for Monaco DOM readiness
   - Calls `autoSaveManager.cancel()` to prevent unnecessary auto-save
   - Updates `originalContent` and status bar

4. **Task 4 - Keyboard shortcuts:**
   - Added `boundKeyboardHandler` property using arrow function binding
   - Implemented `handleKeyboardShortcuts()` with Ctrl+N/O/S and Ctrl+Shift+S
   - Uses `e.preventDefault()` to override browser defaults (Ctrl+N, Ctrl+O)
   - Registered on `document` in `mount()`, removed in `destroy()`
   - Ignores input/textarea targets to avoid interfering with form fields

5. **Task 5 - Tests:**
   - Added 21 tests covering all acceptance criteria
   - Tests verify save/load ProjectStorage interactions
   - Tests verify status bar updates ("Saved", "Save failed", "No saved project found", "Loaded: Project")
   - Tests verify originalContent updates on success only
   - Tests verify keyboard shortcuts trigger correct handlers
   - Tests verify listener cleanup in destroy()
   - Tests verify MenuBar callbacks fire correctly
   - All 3,718 tests pass

### File List

- `digital-archaeology-web/src/ui/App.ts` (MODIFIED) - Added handleFileSave, handleFileSaveAs, handleFileOpen, keyboard shortcuts
- `digital-archaeology-web/src/ui/App.test.ts` (MODIFIED) - Added 25 tests for Story 9.8 (21 original + 4 from code review), fixed `.da-statusbar` class name, added getPosition mock
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (MODIFIED) - Updated story status to "review"
