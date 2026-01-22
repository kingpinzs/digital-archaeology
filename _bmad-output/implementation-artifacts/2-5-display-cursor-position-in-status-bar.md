# Story 2.5: Display Cursor Position in Status Bar

Status: done

---

## Story

As a user,
I want to see my cursor position,
So that I know where I am in the code.

## Acceptance Criteria

1. **Given** I am editing code
   **When** I move the cursor
   **Then** the status bar shows "Ln X, Col Y" with current position

2. **And** the position updates in real-time as I type or navigate

3. **And** the display uses monospace font

## Tasks / Subtasks

- [x] Task 1: Add Cursor Position UI Section to StatusBar (AC: #1, #3)
  - [x] 1.1 Add `cursorSection` element reference to StatusBar class
  - [x] 1.2 Create cursor position section in `render()` method (after speed section)
  - [x] 1.3 Add `updateCursorSection()` method to display "Ln X, Col Y" format
  - [x] 1.4 Call `updateCursorSection()` in `updateUI()` method
  - [x] 1.5 Cache cursor section element in `cacheElements()`
  - [x] 1.6 Clear cursor section reference in `destroy()`

- [x] Task 2: Add Monaco Cursor Position Change Listener to Editor (AC: #2)
  - [x] 2.1 Add `onCursorPositionChange` callback option to EditorOptions
  - [x] 2.2 Subscribe to Monaco's `onDidChangeCursorPosition` event in `createEditor()`
  - [x] 2.3 Extract line and column from event and call callback
  - [x] 2.4 Dispose listener in `destroy()` method
  - [x] 2.5 Export CursorPosition type from Editor module (re-export from StatusBar or define separately)

- [x] Task 3: Wire Editor Cursor Events to StatusBar in App (AC: #1, #2)
  - [x] 3.1 Add `onCursorPositionChange` callback when creating Editor in App
  - [x] 3.2 Update StatusBar state with new cursor position from callback
  - [x] 3.3 Ensure initial cursor position is set on mount

- [x] Task 4: Write Unit Tests for StatusBar Cursor Display (AC: #1, #3)
  - [x] 4.1 Test cursor section renders with "Ln 1, Col 1" format
  - [x] 4.2 Test cursor position updates when state changes
  - [x] 4.3 Test cursor section shows "--" when cursorPosition is null
  - [x] 4.4 Test cursor section uses monospace font class

- [x] Task 5: Write Unit Tests for Editor Cursor Listener (AC: #2)
  - [x] 5.1 Test `onCursorPositionChange` callback is called when cursor moves
  - [x] 5.2 Test callback receives correct line and column values
  - [x] 5.3 Test listener is disposed when editor is destroyed

- [x] Task 6: Write Integration Tests in App (AC: #1, #2)
  - [x] 6.1 Test that moving cursor in editor updates status bar display
  - [x] 6.2 Test initial cursor position is displayed on mount

- [x] Task 7: Run Test Suite and Build (AC: all)
  - [x] 7.1 Run `npm test` - all tests must pass
  - [x] 7.2 Run `npx tsc --noEmit` - no TypeScript errors
  - [x] 7.3 Run `npm run build` - build succeeds

---

## Dev Notes

### StatusBar Already Has Data Structure Ready

The `StatusBar.ts` already has the data infrastructure prepared:
- `CursorPosition` interface defined (lines 14-17)
- `cursorPosition` in `StatusBarState` (line 29)
- Initial value set to `null` (line 66)
- `getState()` already deep-copies cursor position (lines 94-96)

**What's missing:** The UI section rendering and the `updateCursorSection()` method.

### Monaco Cursor Position API Reference

```typescript
// Subscribe to cursor position changes
const disposable = editor.onDidChangeCursorPosition((e) => {
  const position = e.position; // IPosition { lineNumber: number, column: number }
  const line = position.lineNumber;  // 1-based
  const column = position.column;    // 1-based
});

// Get current cursor position
const position = editor.getPosition(); // IPosition | null

// Dispose listener on cleanup
disposable.dispose();
```

**Note:** Monaco uses 1-based line and column numbers, which matches our "Ln X, Col Y" display format.

### StatusBar Section Pattern (from existing code)

Use the existing `createSection()` helper and follow the pattern of other sections like `updatePCSection()` and `updateSpeedSection()`.

The cursor section should use `textContent` for the values (line and column are numbers) to ensure XSS safety, following the existing pattern that uses `escapeHtml()` for user-provided strings.

### Editor Callback Pattern (from App.ts wiring)

The callback should be optional in EditorOptions. Store the IDisposable from Monaco's event subscription and call `.dispose()` in the Editor's destroy method.

### App.ts Integration Pattern

Wire the callback when creating the Editor, similar to how undo/redo was wired in Story 2.4.

### Previous Story Intelligence (Story 2.4)

**Key Learnings from Story 2.4:**
- Wire callbacks through App.ts for clean architecture
- Monaco events need proper disposal in `destroy()` method
- Test both the component API and the App-level integration
- Mock Monaco events in tests using `vi.fn()` pattern

**Code Review Feedback Applied:**
- Add proper cleanup for event listeners
- Test edge cases (null position, initial state)
- Verify monospace font styling

### CSS Considerations

The status bar already uses monospace font via CSS. Verify the cursor position section inherits this styling, or add explicit class.

Check if `da-statusbar-value` already has monospace styling.

### Files to Modify

| File | Changes |
|------|---------|
| `src/ui/StatusBar.ts` | Add cursorSection, updateCursorSection() |
| `src/ui/StatusBar.test.ts` | Add cursor position tests |
| `src/editor/Editor.ts` | Add onCursorPositionChange callback |
| `src/editor/Editor.test.ts` | Add cursor listener tests |
| `src/ui/App.ts` | Wire cursor callback to StatusBar |
| `src/ui/App.test.ts` | Add integration tests |

### Files Already Correct (No Changes Needed)

| File | Reason |
|------|--------|
| `src/ui/StatusBar.ts` (types) | CursorPosition interface already exists |

### Architecture Compliance

| Requirement | Status |
|-------------|--------|
| Named exports only | Use named exports |
| Co-located tests | Add tests to StatusBar.test.ts, Editor.test.ts |
| camelCase functions | `updateCursorSection()`, `onCursorPositionChange` |
| No default exports | Named exports only |
| Callback wiring through App | Follow App.ts pattern from Story 2.4 |

### Anti-Patterns to Avoid

| Don't | Do |
|-------|-----|
| Poll for cursor position | Use Monaco's `onDidChangeCursorPosition` event |
| Direct StatusBar ↔ Editor coupling | Wire through App.ts |
| Forget to dispose listener | Store IDisposable and call `.dispose()` |
| Use setTimeout for "real-time" | Monaco events are already real-time |

### Project Structure Reference

```
digital-archaeology-web/
├── src/
│   ├── editor/
│   │   ├── Editor.ts              # ADD: cursor position callback
│   │   ├── Editor.test.ts         # ADD: cursor listener tests
│   │   └── index.ts
│   └── ui/
│       ├── StatusBar.ts           # ADD: cursor section UI
│       ├── StatusBar.test.ts      # ADD: cursor display tests
│       ├── App.ts                 # ADD: wire cursor callback
│       ├── App.test.ts            # ADD: integration tests
│       └── ...
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.5: Display Cursor Position in Status Bar]
- [Source: digital-archaeology-web/src/ui/StatusBar.ts#CursorPosition interface]
- [Source: digital-archaeology-web/src/editor/Editor.ts]
- [Source: _bmad-output/implementation-artifacts/2-4-enable-undo-redo-functionality.md]
- [Web: Monaco Editor onDidChangeCursorPosition](https://microsoft.github.io/monaco-editor/docs.html#interfaces/editor.IStandaloneCodeEditor.html#onDidChangeCursorPosition)

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

- All acceptance criteria verified and met
- Implementation uses safe DOM construction (textContent for numeric values)
- Proper Monaco event disposal pattern implemented
- Clean architecture with callback wiring through App.ts

### Change Log

- StatusBar.ts: Added cursorSection, updateCursorSection() method; refactored to import CursorPosition from Editor module (removing duplicate interface)
- Editor.ts: Added onCursorPositionChange callback option, cursor event listener, CursorPosition interface
- App.ts: Wired cursor position callback from Editor to StatusBar
- StatusBar.test.ts: Added 7 cursor position tests
- Editor.test.ts: Added 5 cursor callback tests
- App.test.ts: Added 6 cursor position integration tests
- index.ts: Added CursorPosition type export from Editor module
- MenuBar.test.ts: Added test for onEditRedo callback (Story 2.4 completion)

### File List

- digital-archaeology-web/src/ui/StatusBar.ts
- digital-archaeology-web/src/ui/StatusBar.test.ts
- digital-archaeology-web/src/editor/Editor.ts
- digital-archaeology-web/src/editor/Editor.test.ts
- digital-archaeology-web/src/ui/App.ts
- digital-archaeology-web/src/ui/App.test.ts
- digital-archaeology-web/src/editor/index.ts
- digital-archaeology-web/src/ui/MenuBar.test.ts

### Code Review

**Date:** 2026-01-22
**Verdict:** PASS (after fixes)
**Issues Found:** 3 (0 High, 1 Medium, 2 Low)
**Issues Fixed:** 3

**Fixes Applied:**
1. ✅ MEDIUM: Added MenuBar.test.ts to File List (was changed but not documented)
2. ✅ LOW: Updated Change Log to detail index.ts CursorPosition export
3. ✅ LOW: Refactored StatusBar.ts to import CursorPosition from Editor module (removed duplicate interface)

