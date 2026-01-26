# Story 7.4: Implement HDL Validation

Status: review

---

## Story

As a user,
I want HDL syntax validated,
So that I know if my changes are valid.

## Acceptance Criteria

1. **Given** I am editing HDL
   **When** I save or click Validate
   **Then** the HDL is parsed and validated
   **And** syntax errors are shown with line numbers
   **And** valid HDL shows success message

2. **Given** HDL contains syntax errors
   **When** validation completes
   **Then** errors are highlighted in the editor
   **And** I can click errors to jump to the line

## Tasks / Subtasks

- [x] Task 1: Create HdlValidator Class (AC: #1)
  - [x] 1.1 Create `src/hdl/HdlValidator.ts` with validation logic
  - [x] 1.2 Define `HdlValidationResult` interface with `valid`, `errors`, `warnings`
  - [x] 1.3 Define `HdlValidationError` interface with `line`, `column`, `message`, `severity`
  - [x] 1.4 Implement `validate(content: string): HdlValidationResult` method
  - [x] 1.5 Export from `src/hdl/index.ts`

- [x] Task 2: Implement HDL Parsing Rules (AC: #1)
  - [x] 2.1 Parse wire declarations: `wire name[bits]` or `wire name`
  - [x] 2.2 Parse gate instantiations: `gatetype name (input: wire1, wire2; output: wire3)`
  - [x] 2.3 Validate wire names are defined before use
  - [x] 2.4 Validate gate input/output port counts match gate type
  - [x] 2.5 Check for duplicate wire/gate names
  - [x] 2.6 Check for missing semicolons (via unrecognized statement detection)
  - [x] 2.7 Check for unmatched parentheses/brackets

- [x] Task 3: Add Validate Button to HdlViewerPanel (AC: #1)
  - [x] 3.1 Create "Validate" button in header (only visible in edit mode)
  - [x] 3.2 Style with `da-hdl-viewer-validate` class
  - [x] 3.3 Add click handler calling `validateContent()`
  - [x] 3.4 Add keyboard shortcut Ctrl+Shift+V for validation
  - [x] 3.5 Disable button during validation (show loading state)

- [x] Task 4: Display Validation Results (AC: #1, #2)
  - [x] 4.1 Create validation results container below editor
  - [x] 4.2 Show success message with checkmark when valid
  - [x] 4.3 Show error list with line numbers and messages
  - [x] 4.4 Style errors with `da-hdl-viewer-error` class (red)
  - [x] 4.5 Style warnings with `da-hdl-viewer-warning` class (yellow)
  - [x] 4.6 Add click handler on errors to jump to line

- [x] Task 5: Integrate Monaco Editor Markers (AC: #2)
  - [x] 5.1 Convert validation errors to Monaco `IMarkerData` format
  - [x] 5.2 Use `monaco.editor.setModelMarkers()` to show inline errors
  - [x] 5.3 Clear markers when content changes
  - [x] 5.4 Use `MarkerSeverity.Error` and `MarkerSeverity.Warning` appropriately

- [x] Task 6: Auto-validate on Save (AC: #1)
  - [x] 6.1 Call validation before `onSave` callback
  - [x] 6.2 Show validation results after save
  - [x] 6.3 Add `onValidate?: (result: HdlValidationResult) => void` callback option
  - [x] 6.4 Announce validation result to screen readers

- [x] Task 7: Add CSS Styles (AC: #1, #2)
  - [x] 7.1 Style `.da-hdl-viewer-validate` button
  - [x] 7.2 Style `.da-hdl-viewer-validation-results` container
  - [x] 7.3 Style `.da-hdl-viewer-validation-success` (green checkmark)
  - [x] 7.4 Style `.da-hdl-viewer-validation-error` (red)
  - [x] 7.5 Style `.da-hdl-viewer-validation-warning` (yellow)
  - [x] 7.6 Style error list items as clickable

- [x] Task 8: Create Unit Tests (AC: #1, #2)
  - [x] 8.1 Test HdlValidator with valid HDL content
  - [x] 8.2 Test HdlValidator detects missing wire declarations
  - [x] 8.3 Test HdlValidator detects duplicate names
  - [x] 8.4 Test HdlValidator detects syntax errors (missing semicolons, unmatched parens)
  - [x] 8.5 Test HdlValidator returns line numbers for errors
  - [x] 8.6 Test validate button triggers validation
  - [x] 8.7 Test save triggers validation
  - [x] 8.8 Test Monaco markers are set on validation errors
  - [x] 8.9 Test clicking error jumps to line

---

## Dev Notes

### Previous Story Intelligence (Story 7.3)

**Critical Patterns Established:**
- HdlViewerPanel is at `src/hdl/HdlViewerPanel.ts` (620+ lines)
- Monaco editor with `m4hdlLanguageId` language
- Edit mode toggle with `toggleEditMode()` method
- Save functionality with `saveContent()` method and `onSave` callback
- Screen reader announcements via `announce()` method
- Dirty indicator pattern for state changes
- Button styling patterns: `da-hdl-viewer-*` CSS classes
- Header button container: `.da-hdl-viewer-buttons`

**Monaco Editor Integration Patterns:**
```typescript
// Set editor markers for errors
monaco.editor.setModelMarkers(
  this.editor.getModel()!,
  'hdl-validation',
  markers.map(error => ({
    startLineNumber: error.line,
    startColumn: error.column,
    endLineNumber: error.line,
    endColumn: error.column + 10,
    message: error.message,
    severity: monaco.MarkerSeverity.Error,
  }))
);

// Clear markers
monaco.editor.setModelMarkers(this.editor.getModel()!, 'hdl-validation', []);

// Jump to line
this.editor.revealLineInCenter(lineNumber);
this.editor.setPosition({ lineNumber, column: 1 });
```

### HDL Syntax Reference (from m4hdl-language.ts)

**Valid M4HDL Constructs:**
```
# Comments start with #
wire myWire              # Simple wire
wire databus[7:0]        # 8-bit wire

# Gate instantiation
and myAndGate (input: a, b; output: result)
or myOrGate (input: x, y; output: z)
not myInverter (input: in1; output: out1)
mux myMux (input: sel, a, b; output: result)
dff myFlipFlop (input: d, clk; output: q)
```

**Gate Types and Expected Ports:**
| Gate Type | Min Inputs | Max Inputs | Outputs |
|-----------|------------|------------|---------|
| and       | 2          | N          | 1       |
| or        | 2          | N          | 1       |
| xor       | 2          | N          | 1       |
| not       | 1          | 1          | 1       |
| buf       | 1          | 1          | 1       |
| nand      | 2          | N          | 1       |
| nor       | 2          | N          | 1       |
| mux       | 3          | 3          | 1       |
| dff       | 2          | 2          | 1       |
| latch     | 2          | 2          | 1       |

### Architecture Compliance

**Required Locations:**
- Create: `src/hdl/HdlValidator.ts` - Validation logic
- Create: `src/hdl/HdlValidator.test.ts` - Unit tests
- Modify: `src/hdl/HdlViewerPanel.ts` - Add validate button and results display
- Modify: `src/hdl/HdlViewerPanel.test.ts` - Add validation tests
- Modify: `src/styles/main.css` - Add validation styles
- Modify: `src/hdl/index.ts` - Export validator

### File Structure

```
src/hdl/
├── index.ts                 # Add HdlValidator, HdlValidationResult exports
├── HdlLoader.ts             # (unchanged)
├── HdlLoader.test.ts        # (unchanged)
├── HdlValidator.ts          # NEW: Validation logic
├── HdlValidator.test.ts     # NEW: Validation tests
├── HdlViewerPanel.ts        # ADD: validate button, results display, Monaco markers
├── HdlViewerPanel.test.ts   # ADD: validation tests
├── m4hdl-language.ts        # Reference for syntax rules
└── m4hdl-language.test.ts   # (unchanged)
```

### UI Layout with Validation

```
+--------------------------------------------------+
| HDL Editor*          [Validate] [Edit] [Save] [×] |
+--------------------------------------------------+
|                                                  |
|  Monaco Editor (with inline error markers)       |
|                                                  |
+--------------------------------------------------+
| ✓ HDL is valid (no errors)                       |
| OR                                               |
| ✗ 3 errors found:                                |
|   Line 5: Undefined wire 'foo'                   |
|   Line 8: Missing semicolon                      |
|   Line 12: Duplicate gate name 'myGate'          |
+--------------------------------------------------+
```

### Validation Error Types

| Error Type | Severity | Example |
|------------|----------|---------|
| UNDEFINED_WIRE | Error | Using wire before declaration |
| DUPLICATE_NAME | Error | Same name for wire and gate |
| INVALID_GATE_INPUTS | Error | Wrong number of inputs for gate |
| MISSING_SEMICOLON | Error | Statement without semicolon |
| UNMATCHED_PAREN | Error | Unclosed parenthesis |
| UNMATCHED_BRACKET | Error | Unclosed bracket |
| UNUSED_WIRE | Warning | Declared wire never used |

### Testing Requirements

**HdlValidator Tests:**
```typescript
describe('HdlValidator', () => {
  it('should return valid for correct HDL', () => {
    const hdl = 'wire a\nwire b\nwire c\nand g1 (input: a, b; output: c)';
    const result = validate(hdl);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect undefined wire', () => {
    const hdl = 'wire a\nand g1 (input: a, undefined_wire; output: c)';
    const result = validate(hdl);
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain('undefined_wire');
  });
});
```

### Accessibility Checklist

- [x] **Keyboard Navigation** - Validate button accessible, Ctrl+Shift+V shortcut
- [x] **ARIA Attributes**
  - [x] `aria-live="polite"` on validation results container
  - [x] `role="status"` for validation success/error message
  - [x] `role="button"` with proper labels on error items
- [x] **Focus Management** - Focus moves to first error when clicking
- [x] **Color Contrast** - Error red and warning yellow visible against dark theme
- [x] **XSS Prevention** - Error messages are text content, not innerHTML
- [x] **Screen Reader Announcements** - Validation result announced

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 7.4] - Story requirements
- [Source: src/hdl/HdlViewerPanel.ts] - Current panel implementation
- [Source: src/hdl/m4hdl-language.ts] - HDL syntax reference
- [Source: _bmad-output/implementation-artifacts/7-3-enable-hdl-editing.md] - Previous story patterns

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None

### Completion Notes List

- Created HdlValidator class with comprehensive parsing and validation logic
- Validates wire declarations with optional bit ranges (e.g., `wire data[7:0]`)
- Validates gate instantiations with proper input/output port counts
- Detects undefined wires, duplicate names, and syntax errors
- Added Validate button to HdlViewerPanel (visible only in edit mode)
- Integrated Monaco Editor markers for inline error highlighting
- Created validation results container with clickable errors that jump to line
- Added Ctrl+Shift+V keyboard shortcut for validation
- Auto-validates on save
- Full accessibility support with ARIA attributes and screen reader announcements
- 26 unit tests for HdlValidator, 14 integration tests for HdlViewerPanel validation

### File List

- `src/hdl/HdlValidator.ts` - NEW: Validation logic class
- `src/hdl/HdlValidator.test.ts` - NEW: 26 unit tests
- `src/hdl/HdlViewerPanel.ts` - MODIFIED: Added validate button, results display, Monaco markers
- `src/hdl/HdlViewerPanel.test.ts` - MODIFIED: Added 14 validation tests
- `src/hdl/index.ts` - MODIFIED: Export HdlValidator and types
- `src/styles/main.css` - MODIFIED: Added ~100 lines of validation CSS styles

