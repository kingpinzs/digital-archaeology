# Story 5.10: Display Rich Runtime Errors

Status: completed

---

## Story

As a user,
I want detailed error information for runtime errors,
So that I can understand and fix problems.

## Acceptance Criteria

1. **Given** a runtime error occurs (e.g., invalid memory access)
   **When** I view the error
   **Then** I see the error type (MEMORY_ERROR, ARITHMETIC_WARNING)
   **And** I see the instruction context (PC, instruction, opcode)
   **And** I see component context (which circuit component)
   **And** I see relevant signal values
   **And** I see buttons: View in Circuit, View in Code, Reset

## Tasks / Subtasks

- [x] Task 1: Extend EmulatorErrorEvent with Rich Error Details (AC: #1)
  - [x] 1.1 Add `RuntimeErrorType` type to `types.ts`: `'MEMORY_ERROR' | 'ARITHMETIC_WARNING' | 'INVALID_OPCODE' | 'STACK_OVERFLOW' | 'UNKNOWN_ERROR'`
  - [x] 1.2 Add `RuntimeErrorContext` interface with: `errorType`, `pc`, `instruction`, `opcode`, `componentName?`, `signalValues?`
  - [x] 1.3 Extend `EmulatorErrorEvent.payload` with optional `context?: RuntimeErrorContext`
  - [x] 1.4 Add unit tests for new type definitions

- [x] Task 2: Enhance Emulator Worker Error Reporting (AC: #1)
  - [x] 2.1 Modify ERROR event posting to include `context` payload
  - [x] 2.2 Parse error message to extract error type (pattern matching on message content)
  - [x] 2.3 Include current PC, IR (instruction register), and opcode in context
  - [x] 2.4 Add placeholder `componentName` based on opcode category (ALU ops, memory ops, control flow)
  - [x] 2.5 Add unit tests for enhanced error event generation

- [x] Task 3: Update EmulatorBridge Error Callback (AC: #1)
  - [x] 3.1 Extend `ErrorCallback` type to include `context?: RuntimeErrorContext`
  - [x] 3.2 Update `onError` subscription to pass full context to callbacks
  - [x] 3.3 Add unit tests for context propagation

- [x] Task 4: Create RuntimeErrorPanel Component (AC: #1)
  - [x] 4.1 Create `src/debugger/RuntimeErrorPanel.ts` following ErrorPanel pattern
  - [x] 4.2 Define `RuntimeErrorPanelOptions` interface with callbacks: `onViewInCircuit`, `onViewInCode`, `onReset`
  - [x] 4.3 Define `RuntimeErrorPanelState` interface with error context
  - [x] 4.4 Implement `mount(container: HTMLElement): void` method
  - [x] 4.5 Implement `setError(error: RuntimeErrorContext | null): void` method
  - [x] 4.6 Implement `clearError(): void` method
  - [x] 4.7 Implement `destroy(): void` method

- [x] Task 5: Implement RuntimeErrorPanel UI Sections (AC: #1)
  - [x] 5.1 Create error type badge with color coding (red for errors, amber for warnings)
  - [x] 5.2 Create instruction context section: PC display (hex), instruction mnemonic, opcode (hex)
  - [x] 5.3 Create component context section: circuit component name with icon
  - [x] 5.4 Create signal values section: list of relevant signal name/value pairs
  - [x] 5.5 Create action buttons row: "View in Circuit", "View in Code", "Reset"
  - [x] 5.6 Use safe DOM methods (createElement, textContent) for XSS prevention

- [x] Task 6: Add CSS for RuntimeErrorPanel (AC: #1)
  - [x] 6.1 Add `.da-runtime-error-panel` container styles (modal/overlay or inline)
  - [x] 6.2 Add `.da-runtime-error-panel__type-badge` with modifiers for error types
  - [x] 6.3 Add `.da-runtime-error-panel__context` section styles
  - [x] 6.4 Add `.da-runtime-error-panel__signals` list styles
  - [x] 6.5 Add `.da-runtime-error-panel__actions` button row styles
  - [x] 6.6 Use design system colors: `--da-error-color`, `--da-warning-color`

- [x] Task 7: Integrate RuntimeErrorPanel in App.ts (AC: #1)
  - [x] 7.1 Add `private runtimeErrorPanel: RuntimeErrorPanel | null` property
  - [x] 7.2 Initialize RuntimeErrorPanel in State Panel (after BreakpointsView)
  - [x] 7.3 Update `handleExecutionError()` to show RuntimeErrorPanel with full context
  - [x] 7.4 Implement `onViewInCircuit` callback (placeholder - circuit panel not yet implemented)
  - [x] 7.5 Implement `onViewInCode` callback - highlight error line in editor
  - [x] 7.6 Implement `onReset` callback - call emulator reset and clear error
  - [x] 7.7 Clear RuntimeErrorPanel on successful Run/Step

- [x] Task 8: Export RuntimeErrorPanel from Debugger Module (AC: #1)
  - [x] 8.1 Add export to `src/debugger/index.ts`
  - [x] 8.2 Export types: `RuntimeErrorPanelOptions`, `RuntimeErrorPanelState`, `RuntimeErrorContext`

- [x] Task 9: Add Unit Tests for RuntimeErrorPanel (AC: #1)
  - [x] 9.1 Create `src/debugger/RuntimeErrorPanel.test.ts`
  - [x] 9.2 Test: Renders error type badge with correct modifier class
  - [x] 9.3 Test: Displays PC, instruction, and opcode in context section
  - [x] 9.4 Test: Displays component name when provided
  - [x] 9.5 Test: Displays signal values when provided
  - [x] 9.6 Test: View in Circuit button calls callback
  - [x] 9.7 Test: View in Code button calls callback
  - [x] 9.8 Test: Reset button calls callback
  - [x] 9.9 Test: clearError() hides panel
  - [x] 9.10 Test: destroy() cleans up event listeners

- [x] Task 10: Add Integration Tests in App.test.ts (AC: #1)
  - [x] 10.1 Test: Runtime error shows RuntimeErrorPanel with error type
  - [x] 10.2 Test: RuntimeErrorPanel shows instruction context (PC, instruction)
  - [x] 10.3 Test: View in Code button highlights error line in editor
  - [x] 10.4 Test: Reset button resets emulator and clears error panel
  - [x] 10.5 Test: Successful Run/Step clears any visible runtime error
  - [x] 10.6 Test: Multiple errors - new error replaces previous

- [x] Task 11: Verification (AC: #1)
  - [x] 11.1 Run `npm test` - all tests pass
  - [x] 11.2 Run `npm run build` - build succeeds
  - [x] 11.3 TypeScript compilation - no type errors

---

## Dev Notes

### Architecture Context

**CRITICAL:** This is Story 5.10, the FINAL story in Epic 5 (Debugging & State Inspection). It completes the debugging experience by providing rich, contextual error information when runtime errors occur.

**Key Insight:** The basic error handling infrastructure already exists! Story 4.5 implemented `handleExecutionError()` and the `onError` subscription. This story ENHANCES that with rich context and a dedicated UI component.

### Existing Error Infrastructure

1. **EmulatorErrorEvent** - Already defined in `types.ts:729-737`:
```typescript
export interface EmulatorErrorEvent {
  type: 'ERROR';
  payload: {
    message: string;
    address?: number;
  };
}
```

2. **Worker error posting** - Already in `emulator.worker.ts:245-250`:
```typescript
self.postMessage({
  type: 'ERROR',
  payload: {
    message: module.UTF8ToString(module._get_error_message()),
    address: module._get_pc(),
  },
} satisfies EmulatorErrorEvent);
```

3. **EmulatorBridge.onError()** - Already exists at `EmulatorBridge.ts`:
```typescript
onError(callback: ErrorCallback): Unsubscribe
```

4. **App.handleExecutionError()** - Already at `App.ts:1754`:
```typescript
private handleExecutionError(error: { message: string; address?: number }): void {
  this.isRunning = false;
  this.cleanupEmulatorSubscriptions();
  // ... basic toolbar update
}
```

### What's Missing (This Story)

1. **Rich error context** - Error type classification, instruction details, component mapping
2. **RuntimeErrorPanel** - Dedicated UI component for displaying rich error info
3. **Action buttons** - View in Circuit, View in Code, Reset
4. **Signal values** - (Placeholder - will require circuit integration in Epic 6)

### Error Type Classification

Parse the error message from the WASM emulator to determine error type:

```typescript
function classifyError(message: string): RuntimeErrorType {
  if (message.includes('memory') || message.includes('address')) {
    return 'MEMORY_ERROR';
  }
  if (message.includes('overflow') || message.includes('divide')) {
    return 'ARITHMETIC_WARNING';
  }
  if (message.includes('opcode') || message.includes('instruction')) {
    return 'INVALID_OPCODE';
  }
  if (message.includes('stack')) {
    return 'STACK_OVERFLOW';
  }
  return 'UNKNOWN_ERROR';
}
```

### Component Name Mapping

Map opcode categories to circuit component names (for circuit linking in Epic 6):

| Opcode Range | Component Name |
|--------------|----------------|
| 0x0-0x3 | ALU |
| 0x4-0x7 | Memory Controller |
| 0x8-0xB | Control Unit |
| 0xC-0xF | I/O Controller |

### Signal Values (Deferred)

The acceptance criteria mentions signal values. Since Epic 6 (Circuit Visualization) is not yet implemented, this story will:
1. Define the interface for signal values
2. Include placeholder UI section
3. Leave actual signal population for Epic 6 integration

### UI Design Pattern

Follow the existing ErrorPanel design but with richer sections:

```
┌─────────────────────────────────────────────┐
│  🔴 MEMORY_ERROR                            │
├─────────────────────────────────────────────┤
│  Instruction Context                        │
│  ├─ PC: 0x0A                               │
│  ├─ Instruction: STO                       │
│  └─ Opcode: 0x6                            │
├─────────────────────────────────────────────┤
│  Component: Memory Controller               │
├─────────────────────────────────────────────┤
│  Signal Values: (available when circuit    │
│  visualization is enabled)                  │
├─────────────────────────────────────────────┤
│  [View in Circuit] [View in Code] [Reset]   │
└─────────────────────────────────────────────┘
```

### File Modifications

```
digital-archaeology-web/
├── src/
│   ├── debugger/
│   │   ├── RuntimeErrorPanel.ts        # NEW - Rich error display component
│   │   ├── RuntimeErrorPanel.test.ts   # NEW - Unit tests
│   │   └── index.ts                    # MODIFY - Export new component
│   ├── emulator/
│   │   ├── types.ts                    # MODIFY - Add RuntimeErrorContext
│   │   ├── types.test.ts               # MODIFY - Add type tests
│   │   ├── emulator.worker.ts          # MODIFY - Enhance error context
│   │   ├── emulator.worker.test.ts     # MODIFY - Test error context
│   │   ├── EmulatorBridge.ts           # MODIFY - Extend error callback
│   │   └── EmulatorBridge.test.ts      # MODIFY - Test context propagation
│   ├── ui/
│   │   ├── App.ts                      # MODIFY - Integrate RuntimeErrorPanel
│   │   └── App.test.ts                 # MODIFY - Integration tests
│   └── styles/
│       └── main.css                    # MODIFY - Add RuntimeErrorPanel CSS
```

### Accessibility Checklist

- [ ] **Keyboard Navigation** - Tab through action buttons
- [ ] **ARIA Attributes** - `role="alert"` on error panel, `aria-describedby` for context
- [ ] **Color Contrast** - Error red (#ef4444) meets 4.5:1 contrast
- [ ] **Screen Reader** - Announce error with type and message
- [ ] **XSS Prevention** - Safe DOM methods (createElement, textContent)

### Testing Strategy

1. **Unit Tests** - RuntimeErrorPanel component in isolation
2. **Integration Tests** - Full flow from error event to panel display
3. **Type Tests** - RuntimeErrorContext interface validation

### Edge Cases

1. **Error without address** - Display "Unknown" for PC
2. **Unknown error type** - Fall back to "UNKNOWN_ERROR" badge
3. **Empty error message** - Display generic "Runtime error occurred"
4. **Error while error panel visible** - Replace with new error
5. **View in Circuit before Epic 6** - Disable button with tooltip

### Git Commit Pattern

Follow established pattern: `feat(web): display rich runtime errors (Story 5.10)`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.10] - Acceptance criteria
- [Source: digital-archaeology-web/src/emulator/types.ts:729-737] - EmulatorErrorEvent
- [Source: digital-archaeology-web/src/emulator/emulator.worker.ts:245-250] - Error event posting
- [Source: digital-archaeology-web/src/ui/App.ts:1754] - handleExecutionError
- [Source: digital-archaeology-web/src/ui/ErrorPanel.ts] - Component pattern reference
- [Source: digital-archaeology-web/src/debugger/BreakpointsView.ts] - Component pattern reference

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None required - all tests pass

### Completion Notes List

1. **Task 1**: Extended `EmulatorErrorEvent` with `RuntimeErrorType`, `RuntimeErrorContext`, and `SignalValue` types in `types.ts`
2. **Task 2**: Enhanced emulator worker to classify errors, build context with PC/instruction/opcode, and include context in ERROR events
3. **Task 3**: Extended `ErrorCallback` type in EmulatorBridge to include optional context
4. **Tasks 4-5**: Created `RuntimeErrorPanel` component with error badge, instruction context, component section, signal values placeholder, and action buttons
5. **Task 6**: Added CSS styles with color-coded badges (error=red, warning=amber)
6. **Task 7**: Integrated RuntimeErrorPanel in App.ts with View in Circuit (placeholder), View in Code, and Reset handlers
7. **Task 8**: Exported RuntimeErrorPanel and types from debugger module
8. **Tasks 9-10**: Added 32 unit tests and 5 integration tests
9. **Task 11**: All 1408 tests pass, build succeeds

### Code Review Fixes Applied

All 10 issues from code review have been fixed:

1. **HIGH #1**: N/A - exports from worker file work fine via direct import
2. **HIGH #2**: Fixed - App.ts now uses `runtimeErrorPanel.currentError` getter instead of DOM parsing
3. **HIGH #3**: Fixed - Added `currentError` and `currentMessage` getters to RuntimeErrorPanel
4. **MEDIUM #4**: Fixed - Reserved opcodes (0xC-0xE) now display as 'RES' instead of 'NOP'
5. **MEDIUM #5**: Fixed - Added `src/emulator/index.ts` to File List
6. **MEDIUM #6**: Fixed - Added test for `classifyError` with standalone "unknown" keyword
7. **MEDIUM #7**: Fixed - `handleViewInCode` now shows status message when source map unavailable
8. **LOW #8**: Fixed - Removed `console.log` placeholder in `handleViewInCircuit`
9. **LOW #9**: N/A - Design decision, both fields remain optional
10. **LOW #10**: Fixed - Added CSS fallback colors for `color-mix()` in older browsers

**Tests after code review:** 1413 passed (5 new tests added)

### File List

**Files to Create:**
- `src/debugger/RuntimeErrorPanel.ts`
- `src/debugger/RuntimeErrorPanel.test.ts`

**Files to Modify:**
- `src/emulator/types.ts`
- `src/emulator/types.test.ts`
- `src/emulator/emulator.worker.ts`
- `src/emulator/emulator.worker.test.ts`
- `src/emulator/EmulatorBridge.ts`
- `src/emulator/EmulatorBridge.test.ts`
- `src/emulator/index.ts` (Code Review Fix #5: Added missing file)
- `src/debugger/index.ts`
- `src/ui/App.ts`
- `src/ui/App.test.ts`
- `src/styles/main.css`
