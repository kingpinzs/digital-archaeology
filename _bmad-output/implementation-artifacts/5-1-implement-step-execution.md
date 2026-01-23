# Story 5.1: Implement Step Execution

Status: done

---

## Story

As a user,
I want to execute one instruction at a time,
So that I can understand program flow.

## Acceptance Criteria

1. **Given** a program is loaded and not running
   **When** I click Step
   **Then** exactly one instruction executes
   **And** the CPU state updates
   **And** the current instruction is highlighted in the editor
   **And** F10 keyboard shortcut also triggers step

## Tasks / Subtasks

- [x] Task 1: Add Step Button to Toolbar (AC: #1) - PRE-EXISTING from Epic 4
  - [x] 1.1 Create Step button next to Run/Stop/Reset buttons
  - [x] 1.2 Button shows step icon (or "Step" text)
  - [x] 1.3 Button disabled when running or no program loaded
  - [x] 1.4 Button enabled when program loaded and stopped/paused
  - [x] 1.5 Wire button click to `handleStep()` in App.ts

- [x] Task 2: Implement handleStep() in App.ts (AC: #1)
  - [x] 2.1 Add `handleStep()` method to App class
  - [x] 2.2 Method calls `emulatorBridge.step()` and awaits result
  - [x] 2.3 Update UI with returned CPUState
  - [x] 2.4 Handle HALTED case (show "Program halted" in status)
  - [x] 2.5 Handle error case (display error, update status)
  - [x] 2.6 Guard: Do nothing if already running or no program loaded

- [x] Task 3: Highlight Current Instruction in Editor (AC: #1)
  - [x] 3.1 Create `highlightLine(lineNumber: number)` method in Editor
  - [x] 3.2 Use Monaco decorations API for line highlighting
  - [x] 3.3 Store previous decoration ID to remove old highlight
  - [x] 3.4 Highlight color uses `--da-accent` CSS variable (cyan #00b4d8)
  - [x] 3.5 Call `editor.revealLineInCenter()` to scroll if needed
  - [x] 3.6 Wire handleStep to call highlightLine after step

- [x] Task 4: Map PC to Source Line (AC: #1)
  - [x] 4.1 Create `buildSourceMap()` as private method in App class
  - [x] 4.2 Parse assembly to build address→line number mapping
  - [x] 4.3 Store mapping after successful assembly
  - [x] 4.4 Lookup current PC in map to get line number via `highlightCurrentInstruction()`
  - [x] 4.5 Handle case where PC doesn't map to source (skips highlight if no mapping)

- [x] Task 5: Implement F10 Keyboard Shortcut (AC: #1)
  - [x] 5.1 Add keydown handler in App.ts for F10
  - [x] 5.2 Handler calls handleStep() when F10 pressed
  - [x] 5.3 Prevent default browser behavior for F10
  - [x] 5.4 Only active when program loaded and not running
  - [x] 5.5 Add F10 to KeyboardShortcutsDialog list (new 'debugging' category)

- [x] Task 6: Update State Displays (AC: #1)
  - [x] 6.1 StatusBar shows "Stepped to 0xNN" after step
  - [x] 6.2 Cycle count updates from CPUState.cycles
  - [x] 6.3 PC value updates in status bar
  - [x] 6.4 Highlight cleared when code changes (assembly invalidated)

- [x] Task 7: Add Comprehensive Tests
  - [x] 7.1 App tests: Step button enabled/disabled states (16 tests added)
  - [x] 7.2 App tests: handleStep calls emulatorBridge.step()
  - [x] 7.3 App tests: handleStep updates status bar
  - [x] 7.4 App tests: handleStep handles HALTED
  - [x] 7.5 App tests: F10 triggers handleStep
  - [x] 7.6 Editor tests: highlightLine applies decoration (11 tests added)
  - [x] 7.7 Editor tests: highlightLine removes previous decoration
  - [x] 7.8 App tests: Editor highlighting integration (6 tests added)
  - [x] 7.9 KeyboardShortcutsDialog tests: F10 shortcut and debugging category (3 tests added)

- [x] Task 8: Integration Verification
  - [x] 8.1 Run `npm test` - all 1064 tests pass (19 added in code review)
  - [x] 8.2 Run `npm run build` - build succeeds
  - [x] 8.3 TypeScript compilation - no type errors

---

## Dev Notes

### Architecture Context

**CRITICAL:** This is the first story in Epic 5 (Debugging & State Inspection). It establishes the foundation for single-step debugging that subsequent stories (5.2-5.10) will build upon.

### Existing Infrastructure (From Epic 4)

The emulator infrastructure is already complete from Epic 4:

**EmulatorBridge.ts** (already has step method):
```typescript
// Line 230-235 - step() already implemented!
async step(): Promise<CPUState> {
  this.ensureInitialized();
  const worker = this.worker!;
  return this.sendCommandAndWaitForState(worker, { type: 'STEP' });
}
```

**emulator.worker.ts** already handles STEP command:
```typescript
case 'STEP':
  handleStep(emulatorModule!);
  break;
```

**What's Missing (This Story's Focus):**
1. UI button to trigger step
2. F10 keyboard shortcut
3. Editor line highlighting
4. PC-to-line mapping for source correlation
5. Status bar updates for step mode

### PC-to-Line Mapping Strategy

**Option 1: Parse Assembly Output (Implemented)**
After assembly, create a map of memory addresses to source line numbers:
```typescript
interface SourceMap {
  addressToLine: Map<number, number>;  // PC address → source line
  lineToAddress: Map<number, number>;  // source line → PC address
}

function buildSourceMap(source: string): SourceMap {
  const lines = source.split('\n');
  const addressToLine = new Map<number, number>();
  const lineToAddress = new Map<number, number>();
  let address = 0;

  for (let lineNum = 1; lineNum <= lines.length; lineNum++) {
    const line = lines[lineNum - 1].trim();
    if (!line || line.startsWith(';')) continue;

    const codePart = line.split(';')[0].trim();
    if (!codePart) continue;

    // Check for ORG directive (supports decimal, 0x hex, and $ hex prefix)
    const orgMatch = codePart.match(/^ORG\s+(?:0x|\$)?([0-9A-Fa-f]+)/i);
    if (orgMatch) {
      const hasHexPrefix = /^ORG\s+(?:0x|\$)/i.test(codePart);
      const hasHexDigits = /[A-Fa-f]/.test(orgMatch[1]);
      address = parseInt(orgMatch[1], (hasHexPrefix || hasHexDigits) ? 16 : 10);
      continue;
    }

    // Handle label-only lines
    const labelMatch = codePart.match(/^([A-Za-z_][A-Za-z0-9_]*):(.*)$/);
    if (labelMatch && !labelMatch[2].trim()) continue;

    // Handle DB/DW directives (advance address but don't map)
    const dbMatch = codePart.match(/^(?:[A-Za-z_][A-Za-z0-9_]*:\s*)?(DB)\s+(.+)/i);
    if (dbMatch) { address += dbMatch[2].split(',').length * 2; continue; }
    const dwMatch = codePart.match(/^(?:[A-Za-z_][A-Za-z0-9_]*:\s*)?(DW)\s+(.+)/i);
    if (dwMatch) { address += dwMatch[2].split(',').length * 4; continue; }

    // This line has an instruction at current address
    addressToLine.set(address, lineNum);
    lineToAddress.set(lineNum, address);
    address += 2;  // Micro4 instructions are 2 nibbles
  }

  return { addressToLine, lineToAddress };
}
```

**Storage Location:** Store in App.ts after successful assembly:
```typescript
private sourceMap: SourceMap | null = null;

handleAssemblySuccess(result: AssembleResult) {
  this.sourceMap = buildSourceMap(this.editor.getValue());
  // ... existing code
}
```

### Monaco Editor Highlighting

**Decoration API Pattern:**
```typescript
class Editor {
  private currentLineDecoration: string[] = [];

  highlightLine(lineNumber: number): void {
    if (!this.editor) return;

    this.currentLineDecoration = this.editor.deltaDecorations(
      this.currentLineDecoration,
      [{
        range: new monaco.Range(lineNumber, 1, lineNumber, 1),
        options: {
          isWholeLine: true,
          className: 'da-current-instruction-highlight',
          glyphMarginClassName: 'da-current-instruction-glyph',
        },
      }]
    );

    // Ensure line is visible
    this.editor.revealLineInCenter(lineNumber);
  }

  clearHighlight(): void {
    if (!this.editor) return;
    this.currentLineDecoration = this.editor.deltaDecorations(
      this.currentLineDecoration,
      []
    );
  }
}
```

**CSS for Highlight (main.css):**
```css
.da-current-instruction-highlight {
  background-color: var(--da-accent-muted);
}
.da-current-instruction-glyph {
  background-color: var(--da-accent);
  width: 4px !important;
  margin-left: 3px;
}
```

### Toolbar Button Integration

**Button Order in Toolbar (established pattern):**
Run | Stop | **Step** | Reset | Speed Slider

**Toolbar.ts additions:**
```typescript
// In createControls()
const stepButton = this.createButton('step', 'Step', () => {
  this.options.onStep?.();
});
stepButton.title = 'Execute one instruction (F10)';
stepButton.setAttribute('aria-keyshortcuts', 'F10');

// Update button states
updateButtonStates() {
  const canStep = this.state.hasValidAssembly && !this.state.isRunning;
  this.stepButton?.setDisabled(!canStep);
}
```

### F10 Keyboard Shortcut

**App.ts keydown handler:**
```typescript
private handleKeyDown = (event: KeyboardEvent): void => {
  // ... existing shortcuts

  if (event.key === 'F10') {
    event.preventDefault();  // Prevent browser menu
    if (this.hasValidAssembly && !this.isRunning) {
      this.handleStep();
    }
  }
};
```

**Add to KeyboardShortcutsDialog:**
```typescript
{ keys: ['F10'], description: 'Step one instruction' },
```

### State Flow Diagram

```
User clicks Step (or F10)
         │
         ▼
┌─────────────────────────┐
│ App.handleStep()        │
│ - Guard: loaded & !run  │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ emulatorBridge.step()   │
│ - Sends STEP to worker  │
│ - Awaits STATE_UPDATE   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Worker executes 1 instr │
│ - Returns CPUState      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ App updates UI          │
│ - Status: "Stepped"     │
│ - Editor: highlight PC  │
│ - State displays update │
└─────────────────────────┘
```

### Error Handling

**HALTED during step:**
```typescript
async handleStep(): Promise<void> {
  if (this.isRunning || !this.hasValidAssembly) return;

  try {
    const state = await this.emulatorBridge.step();
    this.updateUIFromState(state);
    this.highlightCurrentInstruction(state.pc);

    if (state.halted) {
      this.statusBar?.updateState({
        assemblyMessage: 'Program halted',
        loadStatus: 'halted'
      });
    } else {
      this.statusBar?.updateState({
        assemblyMessage: `Stepped to 0x${state.pc.toString(16).toUpperCase().padStart(2, '0')}`
      });
    }
  } catch (error) {
    this.handleEmulatorError(error);
  }
}
```

### Accessibility Checklist

- [x] **Keyboard Navigation** - F10 shortcut, Tab to Step button
- [x] **ARIA Attributes** - `aria-keyshortcuts="F10"` on Step button (added in code review fix)
- [N/A] **Focus Management** - No focus changes on step
- [N/A] **Color Contrast** - Uses existing theme variables
- [N/A] **XSS Prevention** - No user input displayed
- [x] **Screen Reader Announcements** - Status bar has `role="status"` for live region announcements

### Project Structure Notes

**Files to modify:**
```
digital-archaeology-web/
├── src/
│   ├── ui/
│   │   ├── Toolbar.ts           # Add Step button
│   │   ├── Toolbar.test.ts      # Step button tests
│   │   ├── App.ts               # handleStep(), F10 handler, sourceMap
│   │   ├── App.test.ts          # Step tests
│   │   └── KeyboardShortcutsDialog.ts  # Add F10 entry
│   └── editor/
│       ├── Editor.ts            # highlightLine(), clearHighlight()
│       └── Editor.test.ts       # Highlight tests
├── src/
│   └── main.css                 # Highlight CSS classes
```

**No new files needed** - All functionality integrates into existing components.

### Previous Story Intelligence (Story 4.8)

Key patterns from Story 4.8 to apply:
1. **Worker command pattern** - step() already follows this
2. **Button state management** - Use same pattern as Run/Stop buttons
3. **Status bar updates** - Follow existing message patterns
4. **Test patterns** - Mock emulatorBridge, test button states

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.1]
- [Source: digital-archaeology-web/src/emulator/EmulatorBridge.ts#step]
- [Source: digital-archaeology-web/src/ui/Toolbar.ts]
- [Source: digital-archaeology-web/src/ui/App.ts]
- [Source: digital-archaeology-web/src/editor/Editor.ts]
- [Source: _bmad-output/implementation-artifacts/4-8-implement-speed-control.md]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None - implementation proceeded smoothly.

### Completion Notes List

1. **Task 1 Pre-existing**: Step button was already implemented in Toolbar.ts from Epic 4 with proper state management (canStep, onStepClick).

2. **Source Map Implementation**: Created SourceMap interface and buildSourceMap() method in App.ts to map PC addresses to source line numbers. Handles ORG directives, skips comments, labels, and data directives.

3. **Editor Highlighting**: Added highlightLine() and clearHighlight() methods to Editor.ts using Monaco deltaDecorations API. Uses distinct CSS classes (da-current-instruction-highlight, da-current-instruction-glyph) with cyan accent color.

4. **Keyboard Shortcut Category**: Added new 'debugging' category to KeyboardShortcutsDialog to group debugging-related shortcuts (F10 for step).

5. **Highlight Lifecycle**: Highlight is cleared when code changes (assembly invalidated) and applied after:
   - Program load (initial instruction)
   - Step execution (current instruction)
   - Reset (back to first instruction)

6. **Tests Added**: 36 new tests total:
   - 16 Step execution tests in App.test.ts
   - 11 highlightLine/clearHighlight tests in Editor.test.ts
   - 6 highlighting integration tests in App.test.ts
   - 3 F10/debugging category tests in KeyboardShortcutsDialog.test.ts

7. **Code Review Fixes** (19 additional tests added):
   - Added `aria-keyshortcuts="F10"` to Step button in Toolbar.ts
   - Fixed ORG directive to handle hex prefixes (0x and $)
   - Fixed DB/DW directives to properly advance address in source map
   - Added 15 buildSourceMap unit tests covering edge cases
   - Added 1 highlight-during-run test
   - Added 1 aria-keyshortcuts test for Toolbar
   - Added role="status", aria-live="polite", aria-atomic="false" to StatusBar for screen readers
   - Added 3 StatusBar ARIA tests

### File List

**Modified:**
- `src/ui/App.ts` - handleStep(), buildSourceMap(), highlightCurrentInstruction(), SourceMap interface; CODE REVIEW FIX: ORG hex support, DB/DW address advancement
- `src/ui/App.test.ts` - 22 new Step tests + 6 highlighting tests; CODE REVIEW FIX: 16 buildSourceMap unit tests
- `src/editor/Editor.ts` - highlightLine(), clearHighlight(), currentInstructionDecorationIds
- `src/editor/Editor.test.ts` - 11 new highlight tests
- `src/ui/keyboardShortcuts.ts` - Added 'debugging' category and F10 shortcut
- `src/ui/KeyboardShortcutsDialog.test.ts` - 3 new tests for F10/debugging category
- `src/styles/main.css` - Added da-current-instruction-highlight and da-current-instruction-glyph CSS
- `src/ui/Toolbar.ts` - CODE REVIEW FIX: Added aria-keyshortcuts="F10" to Step button
- `src/ui/Toolbar.test.ts` - CODE REVIEW FIX: Added aria-keyshortcuts test
- `src/ui/StatusBar.ts` - CODE REVIEW FIX: Added role="status", aria-live="polite", aria-atomic="false"
- `src/ui/StatusBar.test.ts` - CODE REVIEW FIX: Added 3 ARIA live region tests

**No new files created.**
