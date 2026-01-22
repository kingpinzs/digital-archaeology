# Story 3.4: Display Assembly Errors with Line Numbers

Status: done

---

## Story

As a user,
I want to see detailed error information,
So that I can fix problems in my code.

## Acceptance Criteria

1. **Given** my code has syntax errors
   **When** I click Assemble
   **Then** an error panel appears below the editor

2. **And** each error shows the line number and column
   **When** viewing the error panel
   **Then** I see "Line X, Column Y" format for each error

3. **And** each error shows a descriptive message
   **When** viewing the error panel
   **Then** the error message explains what went wrong

4. **And** the editor highlights the error line with a red marker
   **When** assembly fails
   **Then** Monaco displays red decorations on error lines (gutter icon + line highlight)

5. **And** clicking an error jumps to that line in the editor
   **When** I click an error in the error panel
   **Then** the editor cursor moves to that line and column, and the editor focuses

## Tasks / Subtasks

- [x] Task 1: Create ErrorPanel Component (AC: #1, #2, #3)
  - [x] 1.1 Create `src/ui/ErrorPanel.ts` with ErrorPanel class
  - [x] 1.2 Implement `mount(container)` and `destroy()` lifecycle
  - [x] 1.3 Create HTML structure: `.da-error-panel` with error list container
  - [x] 1.4 Implement `setErrors(errors: AssemblerError[])` method
  - [x] 1.5 Render each error with line number, column, and message
  - [x] 1.6 Style with existing CSS variables (--da-error, --da-bg-secondary, etc.)
  - [x] 1.7 Implement `clearErrors()` method to hide panel and clear content
  - [x] 1.8 Add show/hide logic based on error count

- [x] Task 2: Add Monaco Editor Decorations (AC: #4)
  - [x] 2.1 Add `setErrorDecorations(errors: AssemblerError[])` method to Editor.ts
  - [x] 2.2 Store decoration IDs for cleanup: `private errorDecorationIds: string[] = []`
  - [x] 2.3 Use `deltaDecorations()` to add/replace decorations
  - [x] 2.4 Configure decoration options: red gutter marker, line highlight, inline message
  - [x] 2.5 Add `clearErrorDecorations()` method
  - [x] 2.6 Write tests for decoration application and cleanup

- [x] Task 3: Implement Click-to-Jump (AC: #5)
  - [x] 3.1 Add `onErrorClick` callback prop to ErrorPanel
  - [x] 3.2 Make each error row clickable with cursor:pointer
  - [x] 3.3 On click, call callback with `{ line: number, column: number }`
  - [x] 3.4 Add `revealLine(line, column)` method to Editor.ts
  - [x] 3.5 Use Monaco's `revealLineInCenter()` and `setPosition()` APIs
  - [x] 3.6 Focus editor after revealing line

- [x] Task 4: Integrate ErrorPanel into App (AC: all)
  - [x] 4.1 Import ErrorPanel in App.ts
  - [x] 4.2 Create ErrorPanel instance as class member
  - [x] 4.3 Mount ErrorPanel below code panel content area
  - [x] 4.4 Update `handleAssemble()` to call `errorPanel.setErrors()` on failure
  - [x] 4.5 Update `handleAssemble()` to call `editor.setErrorDecorations()` on failure
  - [x] 4.6 Clear errors and decorations on successful assembly
  - [x] 4.7 Wire `onErrorClick` callback to `editor.revealLine()`
  - [x] 4.8 Cleanup ErrorPanel in App.destroy()

- [x] Task 5: Write Comprehensive Tests (AC: all)
  - [x] 5.1 ErrorPanel.test.ts: rendering, setErrors, clearErrors, click handling
  - [x] 5.2 Editor.test.ts: decoration application, clearDecorations, revealLine
  - [x] 5.3 App.test.ts: error panel integration, click-to-jump flow

- [x] Task 6: Verify Build and Tests
  - [x] 6.1 Run `npm test` - all tests pass (648 tests)
  - [x] 6.2 Run `npm run build` - no errors
  - [x] 6.3 Manual verification in browser with syntax errors

---

## Dev Notes

### Previous Story Intelligence (Story 3.3)

**Critical Assets Available:**
- `src/emulator/AssemblerBridge.ts` - Already returns `AssemblerError` in `result.error`
- `src/emulator/types.ts` - Has `AssemblerError` interface
- `src/ui/App.ts` - Has `handleAssemble()` method and `lastAssembleResult`
- `src/editor/Editor.ts` - Monaco wrapper with `getMonacoEditor()` accessor

**AssemblerError Type (from types.ts):**
```typescript
interface AssemblerError {
  line: number;        // 1-based line number
  message: string;     // Error description
  column?: number;     // 1-based column (optional)
  suggestion?: string; // Fix suggestion (optional, Story 3.5)
}
```

**Current Assembly Error Flow:**
```typescript
// In App.handleAssemble() - currently only displays message in status bar
if (!result.success && result.error) {
  const errorMsg = result.error.message ?? 'Assembly failed';
  this.statusBar?.updateState({
    assemblyStatus: 'error',
    assemblyMessage: errorMsg,
  });
}
```

### Architecture Requirements

**File Locations (per architecture.md):**
```
src/ui/
├── App.ts              # MODIFY: Add ErrorPanel integration
├── ErrorPanel.ts       # CREATE: New error display component
├── ErrorPanel.test.ts  # CREATE: Tests for ErrorPanel
└── index.ts            # MODIFY: Export ErrorPanel
src/editor/
├── Editor.ts           # MODIFY: Add decoration methods
└── Editor.test.ts      # MODIFY: Add decoration tests
```

**ErrorPanel DOM Structure:**
```html
<div class="da-error-panel da-error-panel--hidden">
  <div class="da-error-panel-header">
    <span class="da-error-panel-title">Assembly Errors</span>
    <span class="da-error-panel-count">2 errors</span>
  </div>
  <div class="da-error-panel-list">
    <div class="da-error-panel-item" data-line="3" data-column="1">
      <span class="da-error-panel-location">Line 3, Col 1</span>
      <span class="da-error-panel-message">Unknown instruction: LDAX</span>
    </div>
    <!-- more errors -->
  </div>
</div>
```

### Monaco Editor Decoration API

**Setting Decorations:**
```typescript
// Store decoration IDs for cleanup
private errorDecorationIds: string[] = [];

setErrorDecorations(errors: AssemblerError[]): void {
  const model = this.editor?.getModel();
  if (!model || !this.editor) return;

  // Create decorations array
  const decorations: monaco.editor.IModelDeltaDecoration[] = errors.map(error => ({
    range: new monaco.Range(error.line, 1, error.line, 1),
    options: {
      isWholeLine: true,
      className: 'da-error-line',           // Line highlight
      glyphMarginClassName: 'da-error-glyph', // Gutter icon
      glyphMarginHoverMessage: { value: error.message },
      hoverMessage: { value: `**Error:** ${error.message}` },
    },
  }));

  // Replace existing decorations
  this.errorDecorationIds = this.editor.deltaDecorations(
    this.errorDecorationIds,
    decorations
  );
}

clearErrorDecorations(): void {
  if (this.editor) {
    this.errorDecorationIds = this.editor.deltaDecorations(
      this.errorDecorationIds,
      []
    );
  }
}
```

**Revealing Line:**
```typescript
revealLine(line: number, column: number = 1): void {
  if (!this.editor) return;

  // Move cursor to position
  this.editor.setPosition({ lineNumber: line, column: column });

  // Center the line in view
  this.editor.revealLineInCenter(line);

  // Focus editor
  this.editor.focus();
}
```

### CSS Requirements

**Add to main.css or new error-panel.css:**
```css
/* Error Panel Container */
.da-error-panel {
  background: var(--da-bg-secondary);
  border-top: 1px solid var(--da-error);
  max-height: 150px;
  overflow-y: auto;
}

.da-error-panel--hidden {
  display: none;
}

.da-error-panel-header {
  display: flex;
  justify-content: space-between;
  padding: var(--da-space-2) var(--da-space-3);
  background: rgba(255, 107, 107, 0.1);
  border-bottom: 1px solid rgba(255, 107, 107, 0.2);
}

.da-error-panel-title {
  color: var(--da-error);
  font-weight: var(--da-font-semibold);
  font-size: 12px;
  text-transform: uppercase;
}

.da-error-panel-count {
  color: var(--da-text-muted);
  font-size: 12px;
}

.da-error-panel-item {
  display: flex;
  gap: var(--da-space-3);
  padding: var(--da-space-2) var(--da-space-3);
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.da-error-panel-item:hover {
  background: rgba(255, 107, 107, 0.1);
}

.da-error-panel-location {
  color: var(--da-error);
  font-family: var(--da-font-mono);
  font-size: 12px;
  white-space: nowrap;
}

.da-error-panel-message {
  color: var(--da-text-primary);
  font-size: 13px;
}

/* Monaco Error Decorations */
.da-error-line {
  background: rgba(255, 107, 107, 0.15) !important;
}

.da-error-glyph {
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ccircle cx='8' cy='8' r='6' fill='%23ff6b6b'/%3E%3Ctext x='8' y='11' text-anchor='middle' fill='white' font-size='10' font-weight='bold'%3E!%3C/text%3E%3C/svg%3E") center center no-repeat;
  background-size: 14px;
}
```

### Accessibility Checklist

- [x] **Keyboard Navigation** - Error items focusable with Tab, Enter AND Space to jump (WCAG 2.1)
- [x] **ARIA Attributes** - `role="list"`, `role="listitem"`, `aria-label` on panel
- [x] **Focus Management** - Focus moves to editor after clicking error
- [x] **Color Contrast** - Error red (#ff4444) meets 4.5:1 against dark background
- [x] **XSS Prevention** - Error messages use `textContent` which auto-escapes HTML
- [x] **Screen Reader Announcements** - `aria-live="polite"` on error panel for dynamic updates

### Project Structure Notes

**Integration Point in App.ts:**
```typescript
// After editor panel content, before panel footer (if any)
private initializeErrorPanel(): void {
  const codePanelContent = this.container?.querySelector('.da-code-panel .da-panel-content');
  if (!codePanelContent) return;

  // Create container for error panel below editor
  const errorContainer = document.createElement('div');
  errorContainer.className = 'da-error-panel-container';
  codePanelContent.appendChild(errorContainer);

  this.errorPanel = new ErrorPanel({
    onErrorClick: (error) => this.handleErrorClick(error),
  });
  this.errorPanel.mount(errorContainer);
}

private handleErrorClick(error: { line: number; column?: number }): void {
  this.editor?.revealLine(error.line, error.column ?? 1);
}
```

### Testing Strategy

**ErrorPanel.test.ts:**
```typescript
describe('ErrorPanel', () => {
  it('renders error list with line numbers and messages', () => {
    errorPanel.setErrors([
      { line: 3, message: 'Unknown instruction' },
      { line: 5, message: 'Invalid address', column: 8 },
    ]);

    const items = container.querySelectorAll('.da-error-panel-item');
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain('Line 3');
    expect(items[0].textContent).toContain('Unknown instruction');
  });

  it('calls onErrorClick when error item clicked', () => {
    const onErrorClick = vi.fn();
    // ... test click handler
  });

  it('hides panel when errors cleared', () => {
    errorPanel.setErrors([{ line: 1, message: 'Error' }]);
    errorPanel.clearErrors();

    expect(container.querySelector('.da-error-panel--hidden')).not.toBeNull();
  });
});
```

**Editor.test.ts additions:**
```typescript
describe('error decorations', () => {
  it('applies decorations for assembly errors', () => {
    editor.setErrorDecorations([
      { line: 3, message: 'Error on line 3' },
    ]);

    expect(mockEditorInstance.deltaDecorations).toHaveBeenCalled();
  });

  it('clears decorations on clearErrorDecorations()', () => {
    editor.setErrorDecorations([{ line: 1, message: 'Error' }]);
    editor.clearErrorDecorations();

    // Second call should pass empty array
    const calls = mockEditorInstance.deltaDecorations.mock.calls;
    expect(calls[calls.length - 1][1]).toEqual([]);
  });

  it('reveals line and sets cursor position', () => {
    editor.revealLine(5, 10);

    expect(mockEditorInstance.setPosition).toHaveBeenCalledWith({ lineNumber: 5, column: 10 });
    expect(mockEditorInstance.revealLineInCenter).toHaveBeenCalledWith(5);
    expect(mockEditorInstance.focus).toHaveBeenCalled();
  });
});
```

### Anti-Patterns to Avoid

| Don't | Do |
|-------|-----|
| Parse error messages for line numbers | Use structured `AssemblerError.line` property |
| Create new error types | Use existing `AssemblerError` from types.ts |
| Use alert() or console.log for errors | Display in ErrorPanel component |
| Directly manipulate Monaco internals | Use public decoration API |
| Store decorations in DOM | Store IDs in Editor class member |
| Create multiple error panels | Single ErrorPanel instance per App |

### Critical Technical Requirements

1. **Error Data Source:** Always use `result.error` from AssemblerBridge, not status bar message
2. **Decoration Cleanup:** Always clear previous decorations before adding new ones
3. **Panel Lifecycle:** ErrorPanel must be destroyed when App is destroyed
4. **Single Source of Truth:** Error state lives in App, propagated to ErrorPanel and Editor
5. **Column Handling:** Column is optional - default to 1 if not provided

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.4]
- [Source: _bmad-output/planning-artifacts/architecture.md#Error Structures]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Error States]
- [Source: digital-archaeology-web/src/emulator/types.ts#AssemblerError]
- [Source: digital-archaeology-web/src/emulator/AssemblerBridge.ts]
- [Source: digital-archaeology-web/src/ui/App.ts#handleAssemble]
- [Source: digital-archaeology-web/src/editor/Editor.ts]
- [Monaco Editor Decorations API: https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor.IStandaloneCodeEditor.html#deltaDecorations]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Initial implementation completed with 642 tests passing
- Code review identified 7 issues (1 HIGH, 4 MEDIUM, 2 LOW)
- All issues fixed, tests increased to 648 passing

### Completion Notes List

1. **ErrorPanel Component** - Created with mount/destroy lifecycle, event delegation pattern for memory-safe click handling, Space key support for WCAG 2.1 compliance
2. **Monaco Decorations** - Implemented setErrorDecorations/clearErrorDecorations using deltaDecorations API with gutter icons and line highlighting
3. **Click-to-Jump** - revealLine method using setPosition, revealLineInCenter, and focus
4. **App Integration** - ErrorPanel initialized in code panel, wired to handleAssemble error flow
5. **Code Review Fixes** - Refactored to use event delegation, added Space key support, added tests for overflow and nested clicks

### File List

**Created:**
- `src/ui/ErrorPanel.ts` (238 lines) - Error panel component with event delegation
- `src/ui/ErrorPanel.test.ts` (34 tests) - Comprehensive tests including accessibility

**Modified:**
- `src/editor/Editor.ts` - Added setErrorDecorations, clearErrorDecorations, revealLine methods
- `src/editor/Editor.test.ts` - Added decoration and revealLine tests
- `src/ui/App.ts` - Integrated ErrorPanel, wired to assembly error flow
- `src/ui/App.test.ts` - Added ErrorPanel integration tests (14 tests)
- `src/ui/index.ts` - Added ErrorPanel exports
- `src/styles/main.css` - Added error panel and Monaco decoration styles
