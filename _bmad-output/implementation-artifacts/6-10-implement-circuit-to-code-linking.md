# Story 6.10: Implement Circuit-to-Code Linking

Status: done

## Story

As a user,
I want clicking gates to highlight related code,
So that I understand what code uses them.

## Acceptance Criteria

1. **Given** the circuit is displayed **When** I click on a gate **Then** instructions that use that gate highlight in the editor
2. **And** the gate remains highlighted
3. **And** clicking elsewhere clears the highlight

## Tasks / Subtasks

### Task 1: Create Gate-to-Instruction Reverse Mapping (AC: #1) ✅

Build the reverse lookup from gate IDs to opcodes that activate them.

- [x] 1.1 Extend `src/visualizer/InstructionGateMapping.ts`:
  - Add `getInstructionsForGate(gateId: number): string[]` function
  - Build reverse index from existing OPCODE_GATE_MAP on first call (lazy init)
  - Return array of opcodes that include this gate ID
- [x] 1.2 Add `GATE_INSTRUCTION_MAP: Map<number, string[]>` private cache
- [x] 1.3 Write unit tests for `getInstructionsForGate()`:
  - Returns opcodes for decoder gates (should include LDA, STA, JMP, etc.)
  - Returns opcodes for ALU gates (should include ADD, SUB, AND, etc.)
  - Returns empty array for gates not in any mapping
  - Returns opcodes for accumulator gates (most instructions)

### Task 2: Add Gate Click Detection to CircuitRenderer (AC: #1, #2) ✅

Extend existing click handler to detect gate clicks and report them.

- [x] 2.1 Add `onGateClick?: (gateId: number, gateName: string) => void` to `CircuitRendererOptions`
- [x] 2.2 Modify `handleClick()` in CircuitRenderer.ts:
  - Use existing `hitTestGate(canvasX, canvasY)` to detect clicked gate
  - If gate is clicked, call `onGateClick` callback with gate ID and name
  - If no gate clicked, existing behavior (clear highlights) continues
- [x] 2.3 Track `clickedGateId: number | null` for persistent gate highlight (AC #2)
- [x] 2.4 Ensure gate highlight persists until user clicks elsewhere (AC #2, #3)

### Task 3: Highlight Instructions in Editor (AC: #1) ✅

Add instruction line highlighting to the editor.

- [x] 3.1 Add `highlightInstructionLines(lines: number[]): void` method to Editor.ts
  - Create decorations for matching lines with background highlight
  - Use `--da-link-highlight` color for consistency
- [x] 3.2 Add `clearInstructionHighlights(): void` method
  - Remove all instruction highlight decorations
- [x] 3.3 Add `instructionHighlightDecorationIds: string[]` property to track active decorations
- [x] 3.4 Create CSS class `.da-instruction-highlight` in main.css:
  - Background: rgba(255, 159, 67, 0.2) - semi-transparent link color
- [x] 3.5 Export methods from editor/index.ts

### Task 4: Parse Assembly to Find Matching Lines (AC: #1) ✅

Scan the editor content to find lines containing specific opcodes.

- [x] 4.1 Create `findLinesWithOpcodes(content: string, opcodes: string[]): number[]` utility in parseInstruction.ts
  - Split content by lines
  - For each line, use `parseInstruction()` to extract opcode
  - Return line numbers (1-based) where opcode matches any in the list
- [x] 4.2 Handle case sensitivity (opcodes should match regardless of case)
- [x] 4.3 Write unit tests:
  - Finds all LDA instructions in multi-line content
  - Finds lines matching multiple opcodes (e.g., ["ADD", "SUB"])
  - Returns empty array when no matches
  - Ignores comments and labels, finds the actual instruction

### Task 5: Wire Up Circuit-to-Code in App.ts (AC: #1, #2, #3) ✅

Connect gate clicks to editor highlighting.

- [x] 5.1 Add `handleGateClick(gateId: number, gateName: string): void` method to App.ts:
  - Look up opcodes via `getInstructionsForGate(gateId)`
  - Find matching lines using `findLinesWithOpcodes()`
  - Highlight lines in editor via `editor.highlightInstructionLines()`
  - Update circuitRenderer gate highlight state
- [x] 5.2 Pass `onGateClick: handleGateClick` to CircuitRenderer options
- [x] 5.3 Clear editor instruction highlights when:
  - User clicks elsewhere in circuit (no gate hit)
  - User clicks on editor content area
  - User modifies editor content
- [x] 5.4 Add `handleCircuitBackgroundClick(): void` for clearing both highlights

### Task 6: Update CircuitRenderer Click Handler (AC: #3) ✅

Distinguish between gate clicks and background clicks.

- [x] 6.1 Modify existing `handleClick()`:
  - If gate hit → call `onGateClick` callback, set `clickedGateId`
  - If no gate hit → call `onBackgroundClick` callback, clear `clickedGateId`
- [x] 6.2 Add `onBackgroundClick?: () => void` to CircuitRendererOptions
- [x] 6.3 Modify `renderGates()` to include clicked gate in highlight set:
  - If `clickedGateId` is set, render that gate with link highlight
  - This ensures clicked gate stays highlighted (AC #2)

### Task 7: Integrate with Existing Code-to-Circuit Linking ✅

Ensure bidirectional linking works correctly together.

- [x] 7.1 When clicking code (Story 6.9 flow):
  - Clear any circuit-to-code highlights (clickedGateId, editor instruction highlights)
  - Then apply code-to-circuit highlights as before
- [x] 7.2 When clicking gate (Story 6.10 flow):
  - Clear any code-to-circuit highlights
  - Then apply circuit-to-code highlights
- [x] 7.3 Clicking elsewhere clears all bidirectional highlights
- [x] 7.4 Add `clearAllLinkHighlights(): void` method to App.ts for unified clearing

### Task 8: Write Unit Tests ✅

- [x] 8.1 Test `getInstructionsForGate()`:
  - Decoder gate returns multiple opcodes
  - ALU gate returns arithmetic opcodes
  - Unknown gate returns empty array
- [x] 8.2 Test `findLinesWithOpcodes()`:
  - Finds correct line numbers
  - Case insensitive matching
  - Handles empty content
- [x] 8.3 Test Editor instruction highlighting:
  - Decorations applied to correct lines
  - Clear removes all decorations
  - Multiple opcodes highlight multiple lines
- [x] 8.4 Test CircuitRenderer gate click:
  - Callback fires with correct gate info
  - clickedGateId persists until background click
  - Background click fires onBackgroundClick
- [x] 8.5 Component tests verify integration behavior:
  - CircuitRenderer: onGateClick fires with correct gate info
  - CircuitRenderer: onBackgroundClick fires when no gate hit
  - Editor: highlightInstructionLines applies decorations correctly
  - App.ts wiring verified via callback integration in CircuitRenderer options

---

## Dev Notes

### CRITICAL: Reuse from Story 6.9

**This story is the REVERSE direction of Story 6.9.** Many patterns and infrastructure already exist:

| Component | Story 6.9 (Code→Circuit) | Story 6.10 (Circuit→Code) |
|-----------|--------------------------|---------------------------|
| Gate mapping | `getGatesForInstruction(opcode)` | `getInstructionsForGate(gateId)` - NEW reverse |
| Click detection | `Editor.onLineClick` | `CircuitRenderer.onGateClick` - Extend existing |
| Highlight state | `highlightedGateIds` in CircuitRenderer | `instructionHighlightDecorations` in Editor - NEW |
| Visual style | `--da-link-highlight` orange | **REUSE** same color |
| Clear behavior | `clearHighlightedGates()` | `clearInstructionHighlights()` - NEW |

### Existing Infrastructure to Reuse

**From Story 6.9 (`6-9-implement-code-to-circuit-linking.md`):**

```typescript
// InstructionGateMapping.ts - EXTEND with reverse lookup
export const OPCODE_GATE_MAP: { [opcode: string]: { gates: number[], signalPath: number[][] } }

// CircuitRenderer.ts - Already has:
- handleClick(e: MouseEvent) - Modify to call onGateClick
- hitTestGate(canvasX, canvasY) - Reuse for gate detection
- setHighlightedGates(gateIds, wireSegments) - Reuse for clicked gate
- clearHighlightedGates() - Reuse

// parseInstruction.ts - Reuse for line scanning
- parseInstruction(lineContent): string | null
```

**From Story 6.8 (Tooltips):**

```typescript
// hitTestGate returns CircuitGate with id and name
interface CircuitGate {
  id: number;
  name: string;
  type: GateType;
  // ...
}
```

### Building the Reverse Mapping

Create lazy-initialized reverse index from existing OPCODE_GATE_MAP:

```typescript
// InstructionGateMapping.ts
let GATE_INSTRUCTION_MAP: Map<number, string[]> | null = null;

function buildReverseMap(): Map<number, string[]> {
  const map = new Map<number, string[]>();
  for (const [opcode, { gates }] of Object.entries(OPCODE_GATE_MAP)) {
    for (const gateId of gates) {
      const existing = map.get(gateId) || [];
      if (!existing.includes(opcode)) {
        existing.push(opcode);
      }
      map.set(gateId, existing);
    }
  }
  return map;
}

export function getInstructionsForGate(gateId: number): string[] {
  if (!GATE_INSTRUCTION_MAP) {
    GATE_INSTRUCTION_MAP = buildReverseMap();
  }
  return GATE_INSTRUCTION_MAP.get(gateId) || [];
}
```

### Editor Decoration Pattern

Monaco decorations for line highlighting:

```typescript
// Editor.ts
private instructionHighlightDecorations: string[] = [];

highlightInstructionLines(lineNumbers: number[]): void {
  if (!this.editor) return;

  const decorations = lineNumbers.map(lineNumber => ({
    range: new monaco.Range(lineNumber, 1, lineNumber, 1),
    options: {
      isWholeLine: true,
      className: 'da-instruction-highlight',
      glyphMarginClassName: 'da-instruction-glyph',
    },
  }));

  this.instructionHighlightDecorations = this.editor.deltaDecorations(
    this.instructionHighlightDecorations,
    decorations
  );
}

clearInstructionHighlights(): void {
  if (!this.editor) return;
  this.instructionHighlightDecorations = this.editor.deltaDecorations(
    this.instructionHighlightDecorations,
    []
  );
}
```

### Integration Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           App.ts                                         │
│                                                                          │
│  CircuitRenderer.onGateClick ──> handleGateClick() ──> getInstructionsFor│
│                                        │                                 │
│                                        ▼                                 │
│                    findLinesWithOpcodes(content, opcodes)                │
│                                        │                                 │
│                                        ▼                                 │
│                    editor.highlightInstructionLines(lines)               │
│                                                                          │
│  CircuitRenderer.onBackgroundClick ──> clearAllLinkHighlights()          │
│                                                                          │
│  Editor.onLineClick ──> (Story 6.9) ──> also clears circuit-to-code      │
└─────────────────────────────────────────────────────────────────────────┘
```

### CSS for Editor Highlighting

```css
/* main.css - add alongside existing link highlight vars */
.da-instruction-highlight {
  background-color: rgba(255, 159, 67, 0.15);
  border-left: 3px solid var(--da-link-highlight);
}

/* Optional: glyph margin indicator */
.da-instruction-glyph {
  background-color: var(--da-link-highlight);
  width: 4px !important;
  margin-left: 3px;
}
```

### Gate Categories for Testing

From circuit.json analysis in Story 6.9:

| Gate ID Range | Category | Expected Opcodes |
|---------------|----------|------------------|
| 4-7 | Decoder inverters | LDA, STA, ADD, SUB, JMP, JZ, LDI, HLT, AND, OR, XOR, NOT, SHL, SHR, INC, DEC |
| 27-34 | ALU A/B inputs | ADD, SUB, AND, OR, XOR, NOT, SHL, SHR, INC, DEC |
| 142-145 | Accumulator | LDA, ADD, SUB, LDI, AND, OR, XOR, NOT, SHL, SHR, INC, DEC |
| 159-166 | Program Counter | JMP, JZ |
| 111 | CTRL_HALT | HLT |
| 146 | Zero Flag | ADD, SUB, JZ, AND, OR, XOR, NOT, SHL, SHR, INC, DEC |

### Bidirectional State Management

Key insight: Only ONE link direction should be active at a time.

```typescript
// App.ts state
private currentLinkDirection: 'code-to-circuit' | 'circuit-to-code' | null = null;

handleEditorLineClick(lineNumber: number, lineContent: string): void {
  this.clearCircuitToCodeHighlights();  // Clear reverse direction
  this.currentLinkDirection = 'code-to-circuit';
  // ... existing Story 6.9 logic
}

handleGateClick(gateId: number, gateName: string): void {
  this.clearCodeToCircuitHighlights();  // Clear forward direction
  this.currentLinkDirection = 'circuit-to-code';
  // ... new Story 6.10 logic
}

clearAllLinkHighlights(): void {
  this.clearCodeToCircuitHighlights();
  this.clearCircuitToCodeHighlights();
  this.currentLinkDirection = null;
}
```

### File Structure

```
src/visualizer/
├── InstructionGateMapping.ts      # MODIFY - Add getInstructionsForGate
├── InstructionGateMapping.test.ts # MODIFY - Add reverse lookup tests
├── CircuitRenderer.ts             # MODIFY - Add onGateClick, onBackgroundClick
├── CircuitRenderer.test.ts        # MODIFY - Add gate click tests
└── index.ts                       # MODIFY - Export new function

src/editor/
├── parseInstruction.ts            # MODIFY - Add findLinesWithOpcodes
├── parseInstruction.test.ts       # MODIFY - Add line finding tests
├── Editor.ts                      # MODIFY - Add highlightInstructionLines
├── Editor.test.ts                 # MODIFY - Add highlight tests
└── index.ts                       # MODIFY - Export new methods

src/ui/
├── App.ts                         # MODIFY - Wire up bidirectional linking
└── App.test.ts                    # MODIFY - Add integration tests

src/styles/
└── main.css                       # MODIFY - Add .da-instruction-highlight
```

### Testing Strategy

1. **Unit Tests (InstructionGateMapping):**
   - Reverse lookup returns correct opcodes
   - All decoder gates return many opcodes
   - Unknown gates return empty array

2. **Unit Tests (findLinesWithOpcodes):**
   - Correct line numbers for single opcode
   - Multiple opcodes find multiple lines
   - Case insensitive

3. **Unit Tests (Editor):**
   - Decorations applied correctly
   - Clear removes decorations
   - Works with no matching lines

4. **Unit Tests (CircuitRenderer):**
   - onGateClick fires with correct gate
   - onBackgroundClick fires on empty space
   - clickedGateId persists

5. **Integration Tests:**
   - End-to-end gate click → editor highlight
   - Bidirectional switching
   - Clear on background click

### Dependencies

- **Depends on:** Story 6.9 (Code-to-Circuit Linking - reuse mapping, colors, patterns)
- **Depends on:** Story 6.8 (Tooltips - hitTestGate, coordinate transformation)
- **Relates to:** Story 6.11 (Signal Values Panel - may need similar gate interaction)

### Out of Scope

- Multi-gate selection (single gate at a time for MVP)
- Scrolling editor to highlighted line (future enhancement)
- Keyboard navigation for gate selection
- Animation of reverse signal flow

---

### Accessibility Checklist

- [x] **Keyboard Navigation** - N/A for MVP (click-based; keyboard alt could be future)
- [x] **ARIA Attributes** - N/A (visual highlighting only)
- [x] **Focus Management** - N/A (no new focusable elements)
- [x] **Color Contrast** - Reuses existing --da-link-highlight with AA contrast
- [x] **XSS Prevention** - N/A (no user content in HTML)
- [x] **Screen Reader Announcements** - N/A (visual feature)

### Project Structure Notes

- Extends InstructionGateMapping with reverse lookup pattern
- Follows Editor decoration pattern from Monaco docs
- Builds on CircuitRenderer click handling from Story 6.9
- CSS classes follow `da-` prefix convention

### References

- [Source: 6-9-implement-code-to-circuit-linking.md] - Forward linking implementation
- [Source: project-context.md#Canvas/Animation Rules] - Coordinate handling
- [Source: project-context.md#Event Listener Cleanup Pattern] - Handler patterns
- [Source: epics.md#Story 6.10] - Original acceptance criteria

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

- All 8 tasks completed successfully
- 2693 tests pass (all existing + 49 new tests for Story 6.10)
- TypeScript strict mode check passes
- Bidirectional linking working: code→circuit (6.9) and circuit→code (6.10)

### File List

| File | Change Type | Description |
|------|-------------|-------------|
| `src/visualizer/InstructionGateMapping.ts` | Modified | Added `getInstructionsForGate()` reverse lookup function and lazy-initialized `GATE_INSTRUCTION_MAP` cache |
| `src/visualizer/InstructionGateMapping.test.ts` | Modified | Added 11 tests for `getInstructionsForGate()` |
| `src/visualizer/CircuitRenderer.ts` | Modified | Added `onGateClick`, `onBackgroundClick` callbacks, `clickedGateId` tracking, `getClickedGateId()`, `clearClickedGate()` |
| `src/visualizer/CircuitRenderer.test.ts` | Modified | Added 10 tests for gate click handling |
| `src/visualizer/index.ts` | Modified | Added export for `getInstructionsForGate` |
| `src/editor/Editor.ts` | Modified | Added `highlightInstructionLines()`, `clearInstructionHighlights()`, `instructionHighlightDecorationIds` |
| `src/editor/Editor.test.ts` | Modified | Added 12 tests for instruction highlighting |
| `src/editor/parseInstruction.ts` | Modified | Added `findLinesWithOpcodes()` utility function |
| `src/editor/parseInstruction.test.ts` | Modified | Added 16 tests for `findLinesWithOpcodes()` |
| `src/editor/index.ts` | Modified | Added export for `findLinesWithOpcodes` |
| `src/ui/App.ts` | Modified | Added `handleGateClick()`, `handleCircuitBackgroundClick()`, `clearAllLinkHighlights()`, wired up callbacks |
| `src/styles/main.css` | Modified | Added `.da-instruction-highlight` and `.da-instruction-glyph` CSS classes |
