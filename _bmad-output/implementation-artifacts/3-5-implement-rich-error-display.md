# Story 3.5: Implement Rich Error Display

Status: done

---

## Story

As a user,
I want errors to show type, context, and suggestions,
So that I understand what went wrong and how to fix it.

## Acceptance Criteria

1. **Given** an assembly error occurs
   **When** I view the error panel
   **Then** I see the error type badge (SYNTAX_ERROR, VALUE_ERROR, CONSTRAINT_ERROR)

2. **And** I see a code snippet showing the error location
   **When** viewing an error
   **Then** the problematic line is displayed with context lines above/below

3. **And** I see a suggestion if available (e.g., "Did you mean 'LDA'?")
   **When** the assembler provides a suggestion
   **Then** it appears below the error message

4. **And** I see a "Fix" button for auto-fixable errors
   **When** an error has a suggestion
   **Then** a "Fix" button appears next to it

5. **And** clicking "Fix" applies the suggestion and re-assembles
   **When** I click the Fix button
   **Then** the suggested fix is applied to the editor
   **And** assembly is automatically triggered

---

## Tasks / Subtasks

- [x] Task 1: Extend AssemblerError Type (AC: #1, #3)
  - [x] 1.1 Add `type?: 'SYNTAX_ERROR' | 'VALUE_ERROR' | 'CONSTRAINT_ERROR'` to AssemblerError interface
  - [x] 1.2 Add `codeSnippet?: { line: string; lineNumber: number; contextBefore?: string[]; contextAfter?: string[] }`
  - [x] 1.3 Add `fixable?: boolean` field to indicate auto-fixable errors
  - [x] 1.4 Update types.test.ts with new field tests

- [x] Task 2: Update AssemblerBridge to Parse Rich Errors (AC: #1, #3)
  - [x] 2.1 Parse error message to detect error type from message patterns
  - [x] 2.2 Generate code snippet from source code around error line
  - [x] 2.3 Detect "Did you mean" patterns in error messages to populate suggestion
  - [x] 2.4 Determine fixable status based on suggestion presence and type

- [x] Task 3: Create RichErrorItem Component (AC: #1, #2, #3, #4)
  - [x] 3.1 Create new component or extend ErrorPanel to render rich error items
  - [x] 3.2 Render error type badge with appropriate color (SYNTAX=red, VALUE=orange, CONSTRAINT=purple)
  - [x] 3.3 Render code snippet with syntax highlighting using same Monaco theme colors
  - [x] 3.4 Render suggestion text in italics with "Did you mean:" prefix
  - [x] 3.5 Render "Fix" button when `fixable === true`
  - [x] 3.6 Style Fix button with primary action color (--da-primary)

- [x] Task 4: Implement Auto-Fix Functionality (AC: #5)
  - [x] 4.1 Add `onFix?: (error: AssemblerError) => void` callback to ErrorPanel
  - [x] 4.2 Create `applyFix(error)` method in App.ts that:
        - Gets current editor content
        - Replaces the error at line/column with suggestion
        - Sets editor content
        - Triggers assembly
  - [x] 4.3 Wire onFix callback from ErrorPanel to App.applyFix
  - [x] 4.4 Add visual feedback during fix (brief highlight on fixed line)

- [x] Task 5: Add CSS Styles for Rich Errors (AC: all)
  - [x] 5.1 Add `.da-error-type-badge` styles for error type badges
  - [x] 5.2 Add `.da-error-snippet` styles for code snippet display
  - [x] 5.3 Add `.da-error-suggestion` styles for suggestion text
  - [x] 5.4 Add `.da-error-fix-btn` styles for Fix button
  - [x] 5.5 Ensure styles work in all themes (lab-mode, story-mode)

- [x] Task 6: Write Comprehensive Tests (AC: all)
  - [x] 6.1 types.test.ts: new AssemblerError fields
  - [x] 6.2 AssemblerBridge.test.ts: rich error parsing
  - [x] 6.3 ErrorPanel.test.ts: rich error rendering, Fix button click
  - [x] 6.4 App.test.ts: applyFix flow, auto-reassembly

- [x] Task 7: Verify Build and Tests
  - [x] 7.1 Run `npm test` - all tests pass (692 tests)
  - [x] 7.2 Run `npm run build` - no errors
  - [x] 7.3 Manual verification with different error types

---

## Dev Notes

### Previous Story Intelligence (Story 3.4)

**Critical Assets Created:**
- `src/ui/ErrorPanel.ts` - Error panel component with event delegation (238 lines)
- `src/editor/Editor.ts` - Has setErrorDecorations, clearErrorDecorations, revealLine methods
- `src/ui/App.ts` - ErrorPanel integrated, handleAssemble wired to error display
- `src/styles/main.css` - Error panel CSS at lines 950-1028

**Current AssemblerError Type (from types.ts:178-187):**
```typescript
export interface AssemblerError {
  line: number;
  column?: number;
  message: string;
  suggestion?: string;  // Already exists! Just needs to be populated
}
```

**Architecture Specifies Richer Error Type (architecture.md:436-442):**
```typescript
interface AssemblyError {
  type: 'SYNTAX_ERROR' | 'VALUE_ERROR' | 'CONSTRAINT_ERROR';
  line: number;
  column: number;
  message: string;
  suggestion?: string;
}
```

**Key Insight:** The architecture already specified the full error type structure. We need to:
1. Extend AssemblerError to match AssemblyError from architecture
2. The `suggestion` field already exists - just not being populated/displayed

### ErrorPanel Current Structure (from ErrorPanel.ts)

```typescript
// Current error item rendering (simplified)
private createErrorItem(error: AssemblerError): HTMLElement {
  const item = document.createElement('div');
  item.className = 'da-error-panel-item';

  // Location text
  const location = document.createElement('span');
  location.textContent = `Line ${error.line}${error.column ? `, Col ${error.column}` : ''}`;

  // Message text
  const message = document.createElement('span');
  message.textContent = error.message;

  return item;
}
```

**Extension Point:** Modify createErrorItem to:
1. Add type badge before location
2. Add code snippet after message
3. Add suggestion with Fix button

### WASM Assembler Error Format

The C assembler (src/micro4/assembler.c) produces error messages in these patterns:
- `Error at line %d: Unknown instruction '%s'` → SYNTAX_ERROR
- `Error at line %d: Invalid address %d` → VALUE_ERROR
- `Error at line %d: Value %d exceeds nibble range` → CONSTRAINT_ERROR

**Suggestion Detection:** Some errors include "Did you mean" hints that can be auto-fixed.

### Code Snippet Generation

To show code context around errors:
```typescript
function generateCodeSnippet(source: string, line: number): CodeSnippet {
  const lines = source.split('\n');
  const contextBefore = lines.slice(Math.max(0, line - 2), line - 1);
  const errorLine = lines[line - 1] || '';
  const contextAfter = lines.slice(line, line + 1);
  return {
    line: errorLine,
    lineNumber: line,
    contextBefore,
    contextAfter,
  };
}
```

### Fix Button Flow

```typescript
// In App.ts
private applyFix(error: AssemblerError): void {
  if (!error.suggestion || !this.editor) return;

  const content = this.editor.getValue();
  const lines = content.split('\n');

  // Replace the error content with suggestion
  // Note: This is simplified - real implementation needs to handle
  // specific replacement based on error type
  lines[error.line - 1] = error.suggestion;

  this.editor.setValue(lines.join('\n'));

  // Highlight the fixed line briefly
  this.editor.revealLine(error.line);

  // Re-assemble
  this.handleAssemble();
}
```

### CSS Variables Available (from main.css)

```css
--da-error: #ff4444;         /* Error red */
--da-warning: #ffaa00;       /* Warning orange */
--da-primary: #00b4d8;       /* Primary action blue */
--da-bg-secondary: #1a1a30;  /* Panel backgrounds */
--da-text-primary: #e0e0e0;  /* Primary text */
--da-text-muted: #a0a0b0;    /* Muted text */
```

### Error Type Badge Colors

```css
.da-error-type-badge--syntax { background: var(--da-error); }      /* Red */
.da-error-type-badge--value { background: var(--da-warning); }     /* Orange */
.da-error-type-badge--constraint { background: #bd93f9; }          /* Purple */
```

### Accessibility Requirements

- Error type badges must have sufficient contrast (WCAG AA)
- Fix button must be keyboard accessible (already via event delegation)
- Code snippet should use `<code>` or `<pre>` with appropriate ARIA
- Screen reader should announce "Fixable error" for auto-fixable errors

### Project Structure Notes

**File Locations (per architecture.md):**
```
src/emulator/
├── types.ts              # MODIFY: Extend AssemblerError interface
└── AssemblerBridge.ts    # MODIFY: Parse rich error information
src/ui/
├── ErrorPanel.ts         # MODIFY: Render rich error items
├── ErrorPanel.test.ts    # MODIFY: Add rich error tests
├── App.ts                # MODIFY: Add applyFix method
└── App.test.ts           # MODIFY: Add applyFix tests
src/styles/
└── main.css              # MODIFY: Add rich error styles
```

### Anti-Patterns to Avoid

| Don't | Do |
|-------|-----|
| Parse error messages with complex regex | Use simple pattern matching for type detection |
| Create separate component for rich errors | Extend existing ErrorPanel |
| Make Fix button always visible | Only show when error.fixable === true |
| Apply fix without confirmation | Apply immediately (this is the UX requirement) |
| Hard-code error type colors | Use CSS variables or classes |

### Testing Strategy

**Error Type Detection Tests:**
```typescript
describe('AssemblerBridge rich errors', () => {
  it('detects SYNTAX_ERROR from unknown instruction', () => {
    // Assemble "INVALID"
    // Expect error.type === 'SYNTAX_ERROR'
  });

  it('detects VALUE_ERROR from invalid address', () => {
    // Assemble "LDA 999"
    // Expect error.type === 'VALUE_ERROR'
  });

  it('generates code snippet with context', () => {
    // Assemble multi-line code with error on line 3
    // Expect error.codeSnippet.contextBefore.length === 1
    // Expect error.codeSnippet.line to be line 3 content
  });
});
```

**Fix Button Tests:**
```typescript
describe('ErrorPanel fix button', () => {
  it('shows Fix button for fixable errors', () => {
    errorPanel.setErrors([{
      line: 1,
      message: 'Unknown instruction: LDAA',
      suggestion: 'LDA',
      fixable: true
    }]);
    expect(container.querySelector('.da-error-fix-btn')).not.toBeNull();
  });

  it('hides Fix button for non-fixable errors', () => {
    errorPanel.setErrors([{
      line: 1,
      message: 'Error',
      fixable: false
    }]);
    expect(container.querySelector('.da-error-fix-btn')).toBeNull();
  });
});
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.5]
- [Source: _bmad-output/planning-artifacts/architecture.md#Error Structures]
- [Source: digital-archaeology-web/src/emulator/types.ts#AssemblerError]
- [Source: digital-archaeology-web/src/ui/ErrorPanel.ts]
- [Source: digital-archaeology-web/src/ui/App.ts#handleAssemble]
- [Source: Story 3.4 implementation - ErrorPanel, Editor decorations]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None - Implementation completed without issues.

### Completion Notes List

- Extended AssemblerError type with `type`, `codeSnippet`, and `fixable` fields
- Implemented error type detection from message patterns (SYNTAX_ERROR, VALUE_ERROR, CONSTRAINT_ERROR)
- Implemented code snippet generation with context lines before/after
- Implemented fixable determination (only SYNTAX_ERROR with suggestion is auto-fixable)
- Extended ErrorPanel with rich error display components (type badges, snippets, suggestions, Fix button)
- Implemented auto-fix functionality with onFix callback wired to App.applyFix
- Added comprehensive CSS styles for all rich error components
- All 692 tests pass, build succeeds

### Code Review Fixes (Post-Implementation)

**Issues Found and Fixed:**
1. **Hardcoded CSS colors** - Error type badges and hover states used hardcoded hex values instead of CSS variables; added theme-aware CSS variables
2. **Incorrect semantic markup** - Code snippet used `role="img"` instead of `<pre>` element; fixed to use proper semantic HTML
3. **Missing visual feedback** - `applyFix` didn't reveal the fixed line; added `editor.revealLine()` call for visual feedback
4. **Missing accessibility** - Fix button lacked `aria-label`; added descriptive accessible label
5. **Edge case bug** - Multiple errors on same line would all fix the first error; added `data-error-index` attribute for unique identification
6. **Test gaps** - Added tests for visual feedback, aria-label, semantic pre element, and multiple errors on same line

**Test Count After Fixes:** 697 tests (5 new tests added)

### Code Review Pass 2 (Documentation Cleanup)

**Issues Found and Fixed:**
1. **Incorrect theme documentation** - Story Task 5.5 referenced non-existent "retro-terminal" theme; corrected to "lab-mode, story-mode"
2. **Misleading CSS comment** - Comment in main.css referenced "retro theme"; corrected to "story-mode"

### File List

Modified:
- `src/emulator/types.ts` - Extended AssemblerError interface with type, codeSnippet, fixable fields
- `src/emulator/types.test.ts` - Added tests for new AssemblerError fields
- `src/emulator/index.ts` - Added exports for AssemblerErrorType and CodeSnippet
- `src/emulator/AssemblerBridge.ts` - Added detectErrorType, generateCodeSnippet, isFixable helpers
- `src/emulator/AssemblerBridge.test.ts` - Added rich error parsing tests
- `src/ui/ErrorPanel.ts` - Extended with rich error rendering (badges, snippets, suggestions, Fix button)
- `src/ui/ErrorPanel.test.ts` - Added rich error display and auto-fix tests
- `src/ui/App.ts` - Added applyFix method, wired onFix callback
- `src/ui/App.test.ts` - Added auto-fix functionality tests
- `src/styles/main.css` - Added CSS styles for rich error components, CSS variables for theme support
