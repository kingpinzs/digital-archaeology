# Story 5.8: Implement Breakpoint Toggle

Status: completed

---

## Story

As a user,
I want to set breakpoints on lines,
So that I can stop at specific points.

## Acceptance Criteria

1. **Given** I am viewing the editor
   **When** I click in the gutter next to a line number
   **Then** a breakpoint marker (red dot) appears
   **And** clicking again removes the breakpoint
   **And** breakpoints are stored for the session
   **And** breakpoint lines are listed in a Breakpoints section

## Tasks / Subtasks

- [x] Task 1: Add Breakpoint Command Types (AC: #1)
  - [x] 1.1 Add `SetBreakpointCommand` interface to `src/emulator/types.ts`
  - [x] 1.2 Add `ClearBreakpointCommand` interface to `src/emulator/types.ts`
  - [x] 1.3 Add `GetBreakpointsCommand` interface to `src/emulator/types.ts`
  - [x] 1.4 Add `BreakpointsListEvent` interface for returning current breakpoints
  - [x] 1.5 Update `EmulatorCommand` union type to include new commands
  - [x] 1.6 Update `EmulatorEvent` union type to include `BreakpointsListEvent`

- [x] Task 2: Implement Breakpoint Commands in Worker (AC: #1)
  - [x] 2.1 Handle `SET_BREAKPOINT` command in `emulator.worker.ts` message handler
  - [x] 2.2 Handle `CLEAR_BREAKPOINT` command in `emulator.worker.ts` message handler
  - [x] 2.3 Handle `GET_BREAKPOINTS` command to return current breakpoint set
  - [x] 2.4 Post `BREAKPOINTS_LIST` event when breakpoints change
  - [x] 2.5 Clear breakpoints on `RESET` command (optional behavior)

- [x] Task 3: Add EmulatorBridge Breakpoint API (AC: #1)
  - [x] 3.1 Add `setBreakpoint(address: number): Promise<void>` method
  - [x] 3.2 Add `clearBreakpoint(address: number): Promise<void>` method
  - [x] 3.3 Add `getBreakpoints(): Promise<number[]>` method
  - [x] 3.4 Add `onBreakpointsChange(callback): Unsubscribe` subscription
  - [x] 3.5 Add unit tests for new EmulatorBridge methods

- [x] Task 4: Add Editor Gutter Click Handler (AC: #1)
  - [x] 4.1 Add `onMouseDown` event listener to Monaco editor
  - [x] 4.2 Detect clicks on glyph margin using `MouseTargetType.GUTTER_GLYPH_MARGIN`
  - [x] 4.3 Extract line number from mouse target
  - [x] 4.4 Add `onBreakpointToggle?: (lineNumber: number) => void` callback to EditorOptions
  - [x] 4.5 Call callback when gutter is clicked
  - [x] 4.6 Add unit tests for gutter click detection

- [x] Task 5: Add Breakpoint Decorations to Editor (AC: #1)
  - [x] 5.1 Add `private breakpointDecorationIds: string[]` property
  - [x] 5.2 Add `setBreakpointDecorations(lines: number[]): void` method
  - [x] 5.3 Create `da-breakpoint-glyph` decoration (red dot in gutter)
  - [x] 5.4 Create `da-breakpoint-line` decoration (optional subtle line highlight)
  - [x] 5.5 Add `clearBreakpointDecorations(): void` method
  - [x] 5.6 Add unit tests for breakpoint decorations

- [x] Task 6: Add CSS for Breakpoint Markers (AC: #1)
  - [x] 6.1 Add `.da-breakpoint-glyph` CSS class (red dot SVG similar to error glyph pattern)
  - [x] 6.2 Add `.da-breakpoint-line` CSS class (subtle red background, optional)
  - [x] 6.3 Use `--da-error-color` or `#ef4444` for breakpoint red
  - [x] 6.4 Ensure glyph is visible when combined with current-instruction glyph

- [x] Task 7: Create BreakpointsView Component (AC: #1)
  - [x] 7.1 Create `src/debugger/BreakpointsView.ts` following RegisterView pattern
  - [x] 7.2 Define `BreakpointsViewState` interface with `breakpoints: Array<{address: number, line: number}>`
  - [x] 7.3 Create `mount(container: HTMLElement): void` method
  - [x] 7.4 Create `updateState(state: Partial<BreakpointsViewState>): void` method
  - [x] 7.5 Create `destroy(): void` method
  - [x] 7.6 Render breakpoint list with address and line number
  - [x] 7.7 Add click-to-remove functionality on each breakpoint item
  - [x] 7.8 Add `onRemoveBreakpoint?: (address: number) => void` callback

- [x] Task 8: Add CSS for BreakpointsView (AC: #1)
  - [x] 8.1 Add `.da-breakpoints-view` container styles (collapsible section)
  - [x] 8.2 Add `.da-breakpoints-view__title` styles
  - [x] 8.3 Add `.da-breakpoints-view__list` styles
  - [x] 8.4 Add `.da-breakpoints-view__item` styles (flex row with address, line, remove button)
  - [x] 8.5 Add `.da-breakpoints-view__empty` styles for "No breakpoints set" message
  - [x] 8.6 Add hover and focus states for remove button

- [x] Task 9: Integrate Breakpoints in App.ts (AC: #1)
  - [x] 9.1 Add `private breakpoints: Map<number, number>` (address → line)
  - [x] 9.2 Add `private breakpointsView: BreakpointsView | null`
  - [x] 9.3 Initialize BreakpointsView in State Panel (after MemoryView)
  - [x] 9.4 Handle `onBreakpointToggle` callback from Editor
  - [x] 9.5 Convert line number to address using `lineToAddress` from source map
  - [x] 9.6 Toggle breakpoint: if exists, remove; if not, add
  - [x] 9.7 Update Editor decorations when breakpoints change
  - [x] 9.8 Update BreakpointsView when breakpoints change
  - [x] 9.9 Send SET_BREAKPOINT/CLEAR_BREAKPOINT to emulator
  - [x] 9.10 Clear breakpoints when code changes (source map invalidated)

- [x] Task 10: Export BreakpointsView from Debugger Module (AC: #1)
  - [x] 10.1 Add export to `src/debugger/index.ts`
  - [x] 10.2 Export types: `BreakpointsViewState`, `BreakpointsViewOptions`

- [x] Task 11: Add Comprehensive Unit Tests (AC: #1)
  - [x] 11.1 Test: Gutter click triggers onBreakpointToggle callback
  - [x] 11.2 Test: Breakpoint decoration appears after setBreakpointDecorations
  - [x] 11.3 Test: Breakpoint decoration removed after clearBreakpointDecorations
  - [x] 11.4 Test: BreakpointsView renders breakpoint list
  - [x] 11.5 Test: BreakpointsView remove button calls callback
  - [x] 11.6 Test: BreakpointsView shows empty message when no breakpoints
  - [x] 11.7 Test: EmulatorBridge setBreakpoint sends correct command
  - [x] 11.8 Test: EmulatorBridge clearBreakpoint sends correct command

- [x] Task 12: Add App.test.ts Integration Tests (AC: #1)
  - [x] 12.1 Test: Clicking gutter toggles breakpoint
  - [x] 12.2 Test: Breakpoint decoration visible after toggle
  - [x] 12.3 Test: BreakpointsView shows added breakpoint
  - [x] 12.4 Test: Clicking breakpoint again removes it
  - [x] 12.5 Test: Breakpoints cleared when code changes
  - [x] 12.6 Test: Breakpoint sent to emulator worker

- [x] Task 13: Integration Verification (AC: #1)
  - [x] 13.1 Run `npm test` - all tests pass (1315 tests)
  - [x] 13.2 Run `npm run build` - build succeeds
  - [x] 13.3 TypeScript compilation - no type errors

---

## Dev Notes

### Architecture Context

**CRITICAL:** This is Story 5.8 in Epic 5 (Debugging & State Inspection). It adds breakpoint toggle functionality to the editor and creates a BreakpointsView component in the State Panel.

**Key Integration Points:**
1. **Editor.ts** - Gutter click handling and breakpoint decorations
2. **EmulatorBridge.ts** - API for setting/clearing breakpoints
3. **emulator.worker.ts** - Already has internal breakpoint Set (line 43)
4. **App.ts** - Coordinates between Editor, EmulatorBridge, and BreakpointsView
5. **SourceMap** - Converts line numbers to addresses

### Previous Story Intelligence (Story 5.7)

Story 5.7 was already implemented as part of Story 5.1. Key patterns:
1. Monaco decorations API for line/gutter markers
2. `deltaDecorations()` for adding/removing decorations
3. CSS classes like `da-current-instruction-glyph` for gutter icons
4. Source map for PC ↔ line number conversion

### Existing Breakpoint Infrastructure

The emulator worker already has breakpoint support:
```typescript
// emulator.worker.ts:43
const breakpoints: Set<number> = new Set();

// emulator.worker.ts:226-228
if (breakpoints.has(pc)) {
  postMessage({ type: 'BREAKPOINT_HIT', payload: { address: pc } });
}
```

**Missing:** Command interface to set/clear breakpoints from main thread.

### Monaco Editor Gutter Click Detection

Monaco provides mouse events with target type information:
```typescript
editor.onMouseDown((e) => {
  if (e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
    const lineNumber = e.target.position?.lineNumber;
    // Toggle breakpoint
  }
});
```

### CSS Pattern for Glyph Markers

Follow the existing pattern from error and current-instruction glyphs:
```css
.da-breakpoint-glyph {
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ccircle cx='8' cy='8' r='5' fill='%23ef4444'/%3E%3C/svg%3E") center center no-repeat;
  background-size: 12px;
}
```

### Component Pattern for BreakpointsView

Follow RegisterView/FlagsView/MemoryView pattern:
- BEM CSS naming: `da-breakpoints-view__*`
- Safe DOM methods (createElement, textContent) for XSS prevention
- Bound handler pattern for event listener cleanup
- `mount()`, `updateState()`, `destroy()` lifecycle

### File Structure

```
digital-archaeology-web/
├── src/
│   ├── debugger/
│   │   ├── BreakpointsView.ts        # NEW - Breakpoints list component
│   │   ├── BreakpointsView.test.ts   # NEW - Unit tests
│   │   └── index.ts                  # MODIFY - Export BreakpointsView
│   ├── editor/
│   │   ├── Editor.ts                 # MODIFY - Gutter click, decorations
│   │   └── Editor.test.ts            # MODIFY - Add breakpoint tests
│   ├── emulator/
│   │   ├── types.ts                  # MODIFY - Add command/event types
│   │   ├── emulator.worker.ts        # MODIFY - Handle breakpoint commands
│   │   ├── EmulatorBridge.ts         # MODIFY - Add breakpoint API
│   │   └── EmulatorBridge.test.ts    # MODIFY - Add breakpoint tests
│   ├── ui/
│   │   ├── App.ts                    # MODIFY - Integrate breakpoints
│   │   └── App.test.ts               # MODIFY - Integration tests
│   └── styles/
│       └── main.css                  # MODIFY - Add breakpoint CSS
```

### Accessibility Checklist

- [x] **Keyboard Navigation** - Breakpoint toggle via F9 key (Code Review Fix L1)
- [x] **ARIA Attributes** - `aria-label` on breakpoint items, `aria-live="polite"` on list (Code Review Fix M2)
- [ ] **Focus Management** - Focus on remove button after breakpoint added (Not critical for MVP)
- [x] **Color Contrast** - Red dot (#ef4444) meets 3:1 minimum contrast for UI elements
- [x] **XSS Prevention** - Safe DOM methods (createElement, textContent) used in BreakpointsView
- [ ] **Screen Reader Announcements** - Announce "Breakpoint set on line X" (Not critical for MVP)

### Testing Strategy

1. **Unit Tests** - Test each component in isolation with mocks
2. **Integration Tests** - Test full flow from gutter click to emulator
3. **JSDOM Considerations** - Monaco mouse events may need simulation

### Git Commit Pattern

Follow established pattern: `feat(web): implement breakpoint toggle (Story 5.8)`

### Edge Cases to Handle

1. **Invalid line** - Don't allow breakpoints on empty lines, comments, or labels-only
2. **Code change** - Clear all breakpoints when source code changes (source map invalidated)
3. **Multiple glyphs** - Breakpoint + current instruction on same line
4. **No source map** - Disable breakpoint toggle if no program loaded

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.8]
- [Source: digital-archaeology-web/src/editor/Editor.ts] - Decoration pattern
- [Source: digital-archaeology-web/src/emulator/emulator.worker.ts:43] - Existing breakpoint Set
- [Source: digital-archaeology-web/src/emulator/types.ts] - Command/Event patterns
- [Source: digital-archaeology-web/src/debugger/RegisterView.ts] - Component pattern

---

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

**Modified Files:**
- `src/emulator/types.ts` - Added SET_BREAKPOINT, CLEAR_BREAKPOINT, GET_BREAKPOINTS commands and BREAKPOINTS_LIST event
- `src/emulator/emulator.worker.ts` - Implemented breakpoint command handlers, clear breakpoints on RESET
- `src/emulator/EmulatorBridge.ts` - Added setBreakpoint, clearBreakpoint, getBreakpoints API methods
- `src/emulator/EmulatorBridge.test.ts` - Added breakpoint API tests
- `src/editor/Editor.ts` - Added gutter click handler, F9 keyboard shortcut, breakpoint decorations
- `src/editor/Editor.test.ts` - Added breakpoint gutter click and F9 keyboard tests
- `src/debugger/BreakpointsView.ts` - NEW: Breakpoints list component with remove functionality
- `src/debugger/BreakpointsView.test.ts` - NEW: Unit tests for BreakpointsView
- `src/debugger/index.ts` - Export BreakpointsView and types
- `src/ui/App.ts` - Integrated breakpoints with Editor, EmulatorBridge, and BreakpointsView
- `src/ui/App.test.ts` - Added breakpoint integration tests
- `src/styles/main.css` - Added breakpoint glyph and line CSS styles

**Code Review Fixes Applied:**
- M1: Added breakpoints.clear() in handleReset (emulator.worker.ts)
- M2: Added aria-live="polite" on BreakpointsView list
- L1: Added F9 keyboard shortcut for breakpoint toggle (Editor.ts)
