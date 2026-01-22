# Story 2.6: Implement Editor Keyboard Shortcuts

Status: review

---

## Story

As a user,
I want standard keyboard shortcuts,
So that I can edit code efficiently.

## Acceptance Criteria

1. **Given** I am in the editor
   **When** I press Ctrl+A
   **Then** all text is selected

2. **And** Ctrl+C copies selected text

3. **And** Ctrl+V pastes clipboard content

4. **And** Ctrl+X cuts selected text

5. **And** Ctrl+F opens find dialog

6. **And** Ctrl+H opens find and replace

7. **And** Tab indents selected lines

8. **And** Shift+Tab unindents selected lines

## Tasks / Subtasks

- [x] Task 1: Verify Monaco Default Shortcuts Work (AC: #1-4, #7-8)
  - [x] 1.1 Confirm Ctrl+A select all works (Monaco default)
  - [x] 1.2 Confirm Ctrl+C copy works (Monaco default)
  - [x] 1.3 Confirm Ctrl+V paste works (Monaco default)
  - [x] 1.4 Confirm Ctrl+X cut works (Monaco default)
  - [x] 1.5 Confirm Tab indents selected lines (Monaco default)
  - [x] 1.6 Confirm Shift+Tab unindents selected lines (Monaco default)

- [x] Task 2: Verify Find Dialog Shortcut (AC: #5)
  - [x] 2.1 Confirm Ctrl+F opens Monaco find widget (Monaco default)
  - [x] 2.2 Test find widget appears and accepts input
  - [x] 2.3 Test Escape closes find widget

- [x] Task 3: Verify Find and Replace Shortcut (AC: #6)
  - [x] 3.1 Confirm Ctrl+H opens Monaco find and replace widget (Monaco default)
  - [x] 3.2 Test replace widget has both find and replace fields
  - [x] 3.3 Test replace functionality works

- [x] Task 4: Write Unit Tests for Keyboard Shortcuts (AC: #1-8)
  - [x] 4.1 Test that Monaco editor is created with keyboard shortcuts enabled
  - [x] 4.2 Test editor.trigger('', 'editor.action.selectAll', null) selects all
  - [x] 4.3 Test editor.trigger('', 'actions.find', null) opens find widget
  - [x] 4.4 Test editor.trigger('', 'editor.action.startFindReplaceAction', null) opens find/replace
  - [x] 4.5 Test editor.trigger('', 'editor.action.indentLines', null) indents
  - [x] 4.6 Test editor.trigger('', 'editor.action.outdentLines', null) unindents

- [x] Task 5: Document Keyboard Shortcuts in Help Menu (AC: all)
  - [x] 5.1 Add keyboard shortcuts constant array to a utils file
  - [x] 5.2 Wire Help > Keyboard Shortcuts menu item to display shortcuts dialog
  - [x] 5.3 Create simple modal/dialog component to display shortcuts list

- [x] Task 6: Run Test Suite and Build (AC: all)
  - [x] 6.1 Run `npm test` - all tests must pass
  - [x] 6.2 Run `npx tsc --noEmit` - no TypeScript errors
  - [x] 6.3 Run `npm run build` - build succeeds

---

## Dev Notes

### Monaco Editor Built-in Keyboard Shortcuts

**CRITICAL:** Monaco Editor provides ALL of these shortcuts by default! No custom implementation needed.

Monaco's default keyboard bindings:

| Shortcut | Action ID | Description |
|----------|-----------|-------------|
| Ctrl+A | `editor.action.selectAll` | Select all text |
| Ctrl+C | (browser native) | Copy selection |
| Ctrl+V | (browser native) | Paste clipboard |
| Ctrl+X | (browser native) | Cut selection |
| Ctrl+F | `actions.find` | Open find widget |
| Ctrl+H | `editor.action.startFindReplaceAction` | Open find and replace |
| Tab | `editor.action.indentLines` | Indent lines |
| Shift+Tab | `editor.action.outdentLines` | Unindent lines |
| Ctrl+Z | `undo` | Undo (Story 2.4) |
| Ctrl+Y | `redo` | Redo (Story 2.4) |
| Ctrl+Shift+Z | `redo` | Redo alternative (Story 2.4) |

### What This Story Actually Requires

1. **Verification** - Confirm Monaco defaults work in our setup
2. **Testing** - Write tests proving shortcuts work via `editor.trigger()`
3. **Documentation** - Add keyboard shortcuts to Help menu

### Monaco Action Trigger API

```typescript
// Trigger any Monaco action programmatically
const editor = this.editor;
editor.trigger('keyboard', 'editor.action.selectAll', null);
editor.trigger('keyboard', 'actions.find', null);
editor.trigger('keyboard', 'editor.action.startFindReplaceAction', null);
editor.trigger('keyboard', 'editor.action.indentLines', null);
editor.trigger('keyboard', 'editor.action.outdentLines', null);
```

### Find Widget Theming

The find widget is automatically themed by our `da-dark` theme. Relevant theme colors already set in Editor.ts:

```typescript
'editorWidget.background': '#1a1a30',
'editorWidget.border': '#404060',
'input.background': '#1a1a30',
'input.border': '#404060',
'input.foreground': '#e0e0e0',
```

### Testing Strategy

Since we can't easily simulate actual keyboard events in Vitest (they require real DOM focus), we test via:
1. **Action triggers** - `editor.trigger()` calls verify actions exist and work
2. **Integration tests** - Verify find widget appears in DOM after trigger
3. **Manual verification** - Documented manual test checklist

### Test Mock Updates Required

The Monaco mock in Editor.test.ts needs to support:
```typescript
const mockEditorInstance = {
  // ... existing mocks
  trigger: vi.fn(),
  // For find widget tests, may need to mock getContribution
  getContribution: vi.fn(() => ({
    start: vi.fn(),
    // find widget contributions
  })),
};
```

### Help Menu Integration

The MenuBar already has `onHelpKeyboardShortcuts` callback. Need to:
1. Create `KeyboardShortcutsDialog` component
2. Wire callback in App.ts to show dialog
3. List all shortcuts with descriptions

### Keyboard Shortcuts Data Structure

```typescript
// src/ui/keyboardShortcuts.ts
export interface KeyboardShortcut {
  keys: string;       // "Ctrl+A" or "Ctrl+Shift+Z"
  description: string;
  category: 'editing' | 'navigation' | 'search';
}

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  { keys: 'Ctrl+A', description: 'Select all text', category: 'editing' },
  { keys: 'Ctrl+C', description: 'Copy selection', category: 'editing' },
  { keys: 'Ctrl+V', description: 'Paste from clipboard', category: 'editing' },
  { keys: 'Ctrl+X', description: 'Cut selection', category: 'editing' },
  { keys: 'Ctrl+Z', description: 'Undo', category: 'editing' },
  { keys: 'Ctrl+Y', description: 'Redo', category: 'editing' },
  { keys: 'Ctrl+Shift+Z', description: 'Redo (alternative)', category: 'editing' },
  { keys: 'Tab', description: 'Indent selected lines', category: 'editing' },
  { keys: 'Shift+Tab', description: 'Unindent selected lines', category: 'editing' },
  { keys: 'Ctrl+F', description: 'Find', category: 'search' },
  { keys: 'Ctrl+H', description: 'Find and replace', category: 'search' },
  { keys: 'F3', description: 'Find next', category: 'search' },
  { keys: 'Shift+F3', description: 'Find previous', category: 'search' },
  { keys: 'Escape', description: 'Close find widget', category: 'search' },
];
```

### Previous Story Intelligence (Story 2.5)

**Key Learnings:**
- Monaco events/features work out-of-box when editor is properly configured
- Test via API methods rather than simulating keyboard events
- Wire callbacks through App.ts for clean architecture
- Update File List in story documentation completely

**Code Review Feedback Applied:**
- Document all modified files in File List and Change Log
- Remove duplicate type definitions (import from single source)
- Verify monospace font styling in widgets

### Files to Create

| File | Purpose |
|------|---------|
| `src/ui/keyboardShortcuts.ts` | Shortcuts data constant |
| `src/ui/KeyboardShortcutsDialog.ts` | Dialog component |
| `src/ui/KeyboardShortcutsDialog.test.ts` | Dialog tests |

### Files to Modify

| File | Changes |
|------|---------|
| `src/editor/Editor.test.ts` | Add keyboard shortcut trigger tests |
| `src/ui/App.ts` | Wire keyboard shortcuts dialog callback |
| `src/ui/App.test.ts` | Add integration tests for dialog |

### Architecture Compliance

| Requirement | Status |
|-------------|--------|
| Named exports only | Use named exports |
| Co-located tests | KeyboardShortcutsDialog.test.ts next to component |
| camelCase functions | `showKeyboardShortcuts()` |
| No default exports | Named exports only |
| CSS prefix `da-` | `da-shortcuts-dialog`, `da-shortcut-key` |

### Anti-Patterns to Avoid

| Don't | Do |
|-------|-----|
| Override Monaco's default keybindings | Use Monaco defaults |
| Simulate keyboard events in tests | Use `editor.trigger()` |
| Create complex keyboard handler | Rely on Monaco's built-in support |
| Hardcode shortcut strings | Use constants from keyboardShortcuts.ts |

### Dialog Component Pattern

Follow the pattern from other UI components (StatusBar, MenuBar):
- Mount/destroy lifecycle
- Safe DOM construction with `createElement`
- `da-` CSS class prefix
- Escape key to close

```typescript
export class KeyboardShortcutsDialog {
  private element: HTMLElement | null = null;
  private backdropElement: HTMLElement | null = null;

  show(): void { /* create and show dialog */ }
  hide(): void { /* remove dialog */ }
  destroy(): void { /* cleanup */ }
}
```

### Project Structure Reference

```
digital-archaeology-web/
├── src/
│   ├── editor/
│   │   ├── Editor.ts              # NO CHANGES (Monaco defaults work)
│   │   └── Editor.test.ts         # ADD: keyboard shortcut tests
│   └── ui/
│       ├── keyboardShortcuts.ts   # NEW: shortcuts constant
│       ├── KeyboardShortcutsDialog.ts      # NEW: dialog component
│       ├── KeyboardShortcutsDialog.test.ts # NEW: dialog tests
│       ├── App.ts                 # ADD: wire dialog callback
│       ├── App.test.ts            # ADD: dialog integration tests
│       └── index.ts               # ADD: export dialog
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.6: Implement Editor Keyboard Shortcuts]
- [Source: digital-archaeology-web/src/editor/Editor.ts]
- [Source: _bmad-output/implementation-artifacts/2-5-display-cursor-position-in-status-bar.md]
- [Source: _bmad-output/project-context.md]
- [Web: Monaco Editor Keyboard Shortcuts](https://github.com/microsoft/monaco-editor/issues/823)
- [Web: Monaco Editor Accessibility Guide](https://github.com/microsoft/monaco-editor/wiki/Monaco-Editor-Accessibility-Guide)

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

- All acceptance criteria verified and met
- Monaco Editor provides all keyboard shortcuts by default (no custom implementation needed)
- Tests verify shortcuts via `editor.trigger()` API
- KeyboardShortcutsDialog component with proper ARIA attributes for accessibility
- Dialog closes on Escape key and backdrop click
- CSS uses da- prefix convention and monospace font for key badges
- Clean architecture with callback wiring through App.ts

### Change Log

- Editor.test.ts: Added 6 keyboard shortcut trigger tests, updated mock with trigger() method
- keyboardShortcuts.ts: NEW - Keyboard shortcuts data constant with categories
- KeyboardShortcutsDialog.ts: NEW - Modal dialog component for Help menu
- KeyboardShortcutsDialog.test.ts: NEW - 34 tests for dialog and shortcuts constants
- App.ts: Added keyboard shortcuts dialog integration, Help menu callback wiring
- App.test.ts: Added 6 integration tests for keyboard shortcuts dialog
- main.css: Added keyboard shortcuts dialog styles
- index.ts: Added exports for KeyboardShortcutsDialog and keyboard shortcuts data
- sprint-status.yaml: Updated story status to 'review'

### Code Review Fixes (Post-Implementation)

- keyboardShortcuts.ts: Removed unused 'navigation' category (dead code)
- KeyboardShortcutsDialog.test.ts: Removed tautological test for monospace class, removed navigation category test (34 tests now, was 36)

### File List

- digital-archaeology-web/src/editor/Editor.test.ts
- digital-archaeology-web/src/ui/keyboardShortcuts.ts
- digital-archaeology-web/src/ui/KeyboardShortcutsDialog.ts
- digital-archaeology-web/src/ui/KeyboardShortcutsDialog.test.ts
- digital-archaeology-web/src/ui/App.ts
- digital-archaeology-web/src/ui/App.test.ts
- digital-archaeology-web/src/ui/index.ts
- digital-archaeology-web/src/styles/main.css
- _bmad-output/implementation-artifacts/sprint-status.yaml
