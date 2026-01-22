# Story 1.9: Create Status Bar Component

Status: done

---

## Story

As a user,
I want a status bar showing current state,
So that I can see assembly status, PC value, and other info at a glance.

## Acceptance Criteria

1. **Given** the application is loaded
   **When** I view the status bar
   **Then** I see placeholder sections for: assembly status, PC value, instruction, cycle count, speed
   **And** the status bar is 24px height
   **And** text uses monospace font for values
   **And** the bar is styled according to the design system

## Tasks / Subtasks

- [x] Task 1: Create StatusBar Component Structure (AC: #1)
  - [x] 1.1 Create `src/ui/StatusBar.ts` as a new component
  - [x] 1.2 Define `StatusBar` class with `mount(container: HTMLElement)` method
  - [x] 1.3 Implement `render()` method that returns status bar HTML
  - [x] 1.4 Implement `destroy()` method for cleanup
  - [x] 1.5 Export `StatusBar` class from `src/ui/index.ts`

- [x] Task 2: Define StatusBar State Interface (AC: #1)
  - [x] 2.1 Create `StatusBarState` interface with fields:
    - `assemblyStatus: 'none' | 'assembling' | 'success' | 'error'`
    - `assemblyMessage: string | null` (e.g., "12 bytes" or "2 errors")
    - `pcValue: number | null`
    - `nextInstruction: string | null`
    - `cycleCount: number`
    - `speed: number | null` (Hz, null when not running)
    - `cursorPosition: { line: number; column: number } | null`
  - [x] 2.2 Implement `updateState(state: Partial<StatusBarState>)` method
  - [x] 2.3 Implement `getState()` method returning copy of state

- [x] Task 3: Create Status Bar Layout Sections (AC: #1)
  - [x] 3.1 Create assembly status section (left) - shows "Ready", "Assembling...", "✓ Assembled: 12 bytes", or "✗ 2 errors"
  - [x] 3.2 Create PC value section - shows "PC: 0x04" with hex format
  - [x] 3.3 Create next instruction section - shows "Next: ADD 0x11"
  - [x] 3.4 Create cycle count section - shows "Cycle: 4"
  - [x] 3.5 Create speed section (right) - shows "Speed: 1Hz" or empty when paused
  - [x] 3.6 Use visual separators (│) between sections

- [x] Task 4: Apply Styling for Status Bar (AC: #1)
  - [x] 4.1 Verify existing `.da-statusbar` class uses 24px height
  - [x] 4.2 Add `.da-statusbar-section` for individual sections
  - [x] 4.3 Add `.da-statusbar-separator` for visual dividers
  - [x] 4.4 Add `.da-statusbar-value` with monospace font (font-family: monospace)
  - [x] 4.5 Add `.da-statusbar-label` for section labels
  - [x] 4.6 Add `.da-statusbar-status--success` (green accent) for successful assembly
  - [x] 4.7 Add `.da-statusbar-status--error` (red accent) for errors
  - [x] 4.8 Use CSS custom properties for all colors

- [x] Task 5: Integrate StatusBar into App.ts (AC: #1)
  - [x] 5.1 Replace static status bar HTML with StatusBar component
  - [x] 5.2 Add `initializeStatusBar()` method in App.ts
  - [x] 5.3 Add `destroyStatusBar()` method in App.ts
  - [x] 5.4 Add `getStatusBar()` method to expose instance
  - [x] 5.5 Store StatusBar instance for state updates
  - [x] 5.6 Initialize with placeholder/default values

- [x] Task 6: Add Accessibility Attributes (AC: #1)
  - [x] 6.1 Keep `role="status"` on status bar container (already exists)
  - [x] 6.2 Keep `aria-live="polite"` for screen reader updates (already exists)
  - [x] 6.3 Add `aria-label` to each section for context
  - [x] 6.4 Use semantic structure for values

- [x] Task 7: Write Unit Tests for StatusBar (AC: #1)
  - [x] 7.1 Test StatusBar renders all sections
  - [x] 7.2 Test initial state shows "Ready" for assembly status
  - [x] 7.3 Test updateState updates displayed values
  - [x] 7.4 Test PC value displays in hex format
  - [x] 7.5 Test cycle count displays correctly
  - [x] 7.6 Test speed section shows/hides based on state
  - [x] 7.7 Test accessibility attributes are present
  - [x] 7.8 Test getState returns current state
  - [x] 7.9 Test destroy removes element from DOM
  - [x] 7.10 Test monospace font applied to values

- [x] Task 8: Validate StatusBar Implementation (AC: #1)
  - [x] 8.1 Verify all sections render correctly
  - [x] 8.2 Verify 24px height constraint
  - [x] 8.3 Verify monospace font on values
  - [x] 8.4 Run `npm run build` - must complete without errors
  - [x] 8.5 Run `npx tsc --noEmit` - must pass with no TypeScript errors

---

## Dev Notes

### Previous Story Intelligence (Story 1.8)

**Key Learnings from Story 1.8:**
- Components follow mount/destroy pattern with proper cleanup
- **CRITICAL: Store bound event handlers and remove them in destroy()** to prevent memory leaks
- CSS uses `--da-*` custom properties for theming
- Accessibility attributes (role, aria-label, aria-live) required on interactive elements
- Tests use Vitest with jsdom for DOM testing
- All TypeScript strict mode - no `any`, use `null` not `undefined`
- Named exports only (no default exports except config files)
- No console.log in production code - use no-op placeholder comments
- MenuBar pattern established - integrate components into App.ts with get/destroy methods

**Code Review Fixes from 1.8:**
- Track event listeners in Maps and clean up in destroy()
- Save state before calling methods that modify it (e.g., Escape key focus bug)
- Add integration tests in App.test.ts for new components
- Add `will-change` CSS property for animations

### Current Status Bar State

The status bar already exists in App.ts as static HTML:
```html
<footer class="da-statusbar" role="status" aria-live="polite">
  <span class="da-statusbar-text">Ready</span>
</footer>
```

And basic CSS in main.css:
```css
.da-statusbar {
  grid-area: statusbar;
  display: flex;
  align-items: center;
  height: 24px;
  background-color: var(--da-panel-header);
  border-top: 1px solid var(--da-border);
  padding: 0 12px;
}

.da-statusbar-text {
  font-size: 11px;
  color: var(--da-text-secondary);
}
```

### Status Bar Layout from UX Specification

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ✓ Assembled: 12 bytes │ PC: 0x04 │ Next: ADD 0x11 │ Cycle: 4 │ Speed: 1Hz  │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Sections (left to right):**
1. **Assembly Status** - "Ready", "Assembling...", "✓ Assembled: X bytes", "✗ X errors"
2. **PC Value** - "PC: 0xNN" (hex format)
3. **Next Instruction** - "Next: OPCODE OPERAND"
4. **Cycle Count** - "Cycle: N"
5. **Speed** - "Speed: NHz" (shown during execution)

**Additional from Story 2.5:** Cursor position "Ln X, Col Y" will be added later.

### Component Interface

```typescript
// src/ui/StatusBar.ts

export type AssemblyStatus = 'none' | 'assembling' | 'success' | 'error';

export interface StatusBarState {
  assemblyStatus: AssemblyStatus;
  assemblyMessage: string | null;  // "12 bytes" or "2 errors"
  pcValue: number | null;
  nextInstruction: string | null;
  cycleCount: number;
  speed: number | null;  // Hz, null when not running
  cursorPosition: { line: number; column: number } | null;  // For Story 2.5
}

export class StatusBar {
  private element: HTMLElement | null = null;
  private state: StatusBarState;

  constructor() {
    this.state = {
      assemblyStatus: 'none',
      assemblyMessage: null,
      pcValue: null,
      nextInstruction: null,
      cycleCount: 0,
      speed: null,
      cursorPosition: null,
    };
  }

  mount(container: HTMLElement): void {
    this.element = this.render();
    container.appendChild(this.element);
  }

  updateState(newState: Partial<StatusBarState>): void {
    this.state = { ...this.state, ...newState };
    this.updateUI();
  }

  getState(): StatusBarState {
    return { ...this.state };
  }

  destroy(): void {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }

  private render(): HTMLElement {
    const statusBar = document.createElement('div');
    statusBar.className = 'da-statusbar';
    statusBar.setAttribute('role', 'status');
    statusBar.setAttribute('aria-live', 'polite');
    statusBar.setAttribute('aria-label', 'Application status bar');
    // ... render sections
    return statusBar;
  }

  private updateUI(): void {
    // Update each section based on state
  }
}
```

### CSS Class Structure

```css
/* Status bar sections */
.da-statusbar-section {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 8px;
}

.da-statusbar-separator {
  color: var(--da-border);
  margin: 0 4px;
}

.da-statusbar-label {
  font-size: 11px;
  color: var(--da-text-secondary);
}

.da-statusbar-value {
  font-size: 11px;
  font-family: 'SF Mono', 'Consolas', 'Monaco', monospace;
  color: var(--da-text-primary);
}

/* Assembly status variants */
.da-statusbar-status--none {
  color: var(--da-text-secondary);
}

.da-statusbar-status--assembling {
  color: var(--da-warning);
}

.da-statusbar-status--success {
  color: var(--da-success);
}

.da-statusbar-status--error {
  color: var(--da-error);
}
```

### Testing Considerations

**Unit Tests (Vitest + jsdom):**
- Test status bar renders with all sections
- Test initial state is "Ready"
- Test updateState changes displayed values
- Test PC value formatted as hex
- Test monospace font on value elements
- Test accessibility attributes

**Example Test:**
```typescript
it('should display PC value in hex format', () => {
  const statusBar = new StatusBar();
  statusBar.mount(container);

  statusBar.updateState({ pcValue: 4 });

  const pcSection = container.querySelector('[data-section="pc"]');
  expect(pcSection?.textContent).toContain('0x04');
});
```

### Files to Create

- `src/ui/StatusBar.ts` - StatusBar component
- `src/ui/StatusBar.test.ts` - Unit tests

### Files to Modify

- `src/ui/App.ts` - Replace static HTML with StatusBar component, add get/destroy methods
- `src/ui/App.test.ts` - Add StatusBar integration tests
- `src/ui/index.ts` - Export StatusBar and related types
- `src/styles/main.css` - Add new status bar CSS classes

### Integration Approach

1. Keep the `<footer class="da-statusbar">` element in App.ts render
2. StatusBar component will be mounted inside this container
3. App.ts will initialize StatusBar with default state
4. Future epics will call `app.getStatusBar().updateState()` to update values

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.9]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Status Bar]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Layout Foundation]
- [Source: _bmad-output/implementation-artifacts/1-8-create-menu-bar-component.md]
- [Source: _bmad-output/project-context.md]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

1. **StatusBar Component Created** - Implemented `src/ui/StatusBar.ts` with full `StatusBarState` interface, mount/destroy pattern, and efficient DOM updates via cached element references
2. **State Interface Defined** - `AssemblyStatus` type ('none' | 'assembling' | 'success' | 'error'), `StatusBarState` interface with all required fields, `CursorPosition` interface for Story 2.5
3. **All Layout Sections Implemented** - Assembly status, PC value (hex format), Next instruction, Cycle count, Speed (Hz) with visual separators (│)
4. **CSS Styling Complete** - Added `.da-statusbar-content`, `.da-statusbar-section`, `.da-statusbar-separator`, `.da-statusbar-label`, `.da-statusbar-value` with monospace font, status color variants (success/error/assembling/none)
5. **App.ts Integration** - StatusBar mounted in footer container, `initializeStatusBar()`, `destroyStatusBar()`, `getStatusBar()` methods added
6. **Accessibility Attributes** - `aria-label` on each section, `aria-hidden="true"` on separators, container keeps `role="status"` and `aria-live="polite"`
7. **Comprehensive Tests** - 46 unit tests for StatusBar component + 8 App.ts integration tests
8. **Build Verification** - TypeScript compilation passes, production build succeeds in 688ms
9. **Total Tests** - 250 tests passing

### Code Review Fixes Applied

10. **XSS Prevention** - Added `escapeHtml()` helper function to sanitize `assemblyMessage` and `nextInstruction` values before inserting into innerHTML
11. **JSDoc Clarification** - Added `@remarks` to `CursorPosition` interface documenting it's for Story 2.5
12. **Multi-Architecture PC Support** - PC value now uses `>>> 0` to convert to unsigned 32-bit, displays dynamically (minimum 2 digits, but allows larger values like 0xDEADBEEF)
13. **Edge Case Tests Added** - Tests for PC value 0, large 16-bit values, large 32-bit values, negative values converting to unsigned
14. **Deep Clone Fix** - `getState()` now deep clones `cursorPosition` to prevent mutation of internal state
15. **Dead CSS Removed** - Removed legacy `.da-statusbar-text` class that was no longer used
16. **XSS Tests Added** - Tests verifying HTML in `assemblyMessage` and `nextInstruction` is properly escaped

### File List

**Created:**
- `src/ui/StatusBar.ts` - StatusBar component (~280 lines)
- `src/ui/StatusBar.test.ts` - Unit tests (46 tests, ~550 lines)

**Modified:**
- `src/ui/App.ts` - Added StatusBar import, private field, initialize/destroy/get methods
- `src/ui/App.test.ts` - Added StatusBar integration tests (8 tests), updated legacy test
- `src/ui/index.ts` - Added StatusBar and type exports
- `src/styles/main.css` - Added status bar CSS classes (~45 lines, removed legacy class)
