# Story 1.6: Implement Resizable Panel System

Status: done

---

## Story

As a user,
I want to resize the panels by dragging dividers,
So that I can customize my workspace layout.

## Acceptance Criteria

1. **Given** the 3-panel layout is displayed
   **When** I drag the divider between panels
   **Then** the panels resize smoothly
   **And** minimum panel widths are enforced (250px code, 400px circuit, 200px state)
   **And** the cursor changes to resize cursor on hover
   **And** panel sizes persist visually during resize
   **And** resize stops when I release the mouse

## Tasks / Subtasks

- [x] Task 1: Create PanelResizer Component (AC: #1)
  - [x] 1.1 Create `src/ui/PanelResizer.ts` as reusable resize handle component
  - [x] 1.2 Define `PanelResizer` class with `mount(container: HTMLElement)` method
  - [x] 1.3 Implement resize handle element (vertical bar, ~6px wide hit area)
  - [x] 1.4 Export `PanelResizer` class from `src/ui/index.ts`

- [x] Task 2: Implement Mouse Event Handling (AC: #1)
  - [x] 2.1 Add `mousedown` listener on resize handle to start drag
  - [x] 2.2 Add `mousemove` listener on document during drag
  - [x] 2.3 Add `mouseup` listener on document to end drag
  - [x] 2.4 Track `isDragging` state to prevent unintended resizes
  - [x] 2.5 Calculate delta from initial mouse position

- [x] Task 3: Implement Cursor Feedback (AC: #1)
  - [x] 3.1 Change cursor to `col-resize` on hover over resize handle
  - [x] 3.2 Change cursor to `col-resize` on body during drag (prevents flicker)
  - [x] 3.3 Add `user-select: none` during drag to prevent text selection
  - [x] 3.4 Restore original cursor and selection on drag end

- [x] Task 4: Implement Panel Width Constraints (AC: #1)
  - [x] 4.1 Define minimum widths as constants: CODE_MIN=250, CIRCUIT_MIN=400, STATE_MIN=200
  - [x] 4.2 Define default widths as constants: CODE_DEFAULT=350, STATE_DEFAULT=280
  - [x] 4.3 Enforce minimum widths during resize calculation
  - [x] 4.4 Ensure circuit panel always gets remaining space (1fr behavior)
  - [x] 4.5 Prevent total panel widths from exceeding viewport

- [x] Task 5: Update App.ts to Use Dynamic Grid Columns (AC: #1)
  - [x] 5.1 Replace fixed `grid-template-columns: 350px 1fr 280px` with CSS custom properties
  - [x] 5.2 Add `--da-code-panel-width` and `--da-state-panel-width` CSS variables
  - [x] 5.3 Initialize variables with default values (350px, 280px)
  - [x] 5.4 Update grid to use: `grid-template-columns: var(--da-code-panel-width) 1fr var(--da-state-panel-width)`

- [x] Task 6: Add Resize Handles to App Layout (AC: #1)
  - [x] 6.1 Add left resize handle between code panel and circuit panel
  - [x] 6.2 Add right resize handle between circuit panel and state panel
  - [x] 6.3 Position handles absolutely over panel borders
  - [x] 6.4 Ensure handles have proper z-index to be clickable

- [x] Task 7: Implement Resize Callback System (AC: #1)
  - [x] 7.1 Define callback type: `(newWidth: number) => void`
  - [x] 7.2 Accept `onResize` callback in PanelResizer constructor
  - [x] 7.3 Call callback with constrained width during drag
  - [x] 7.4 App updates CSS custom properties when callback fires

- [x] Task 8: Add Resizer CSS Classes (AC: #1)
  - [x] 8.1 Add `.da-resizer` class for resize handle styling
  - [x] 8.2 Add `.da-resizer:hover` state with accent color highlight
  - [x] 8.3 Add `.da-resizer--active` class for during-drag state
  - [x] 8.4 Add `.da-resizing` body class to manage cursor during drag

- [x] Task 9: Write Unit Tests for PanelResizer (AC: #1)
  - [x] 9.1 Test resize handle renders correctly
  - [x] 9.2 Test mousedown starts drag mode
  - [x] 9.3 Test mousemove during drag calls callback with delta
  - [x] 9.4 Test mouseup ends drag mode
  - [x] 9.5 Test minimum width constraints are enforced
  - [x] 9.6 Test cursor changes on hover

- [x] Task 10: Validate Resize Implementation (AC: #1)
  - [x] 10.1 Verify left resizer changes code panel width
  - [x] 10.2 Verify right resizer changes state panel width
  - [x] 10.3 Verify circuit panel fills remaining space
  - [x] 10.4 Verify minimum widths cannot be violated
  - [x] 10.5 Verify resize is smooth (no jank/flicker)
  - [x] 10.6 Verify cursor feedback works correctly
  - [x] 10.7 Run `npm run build` - must complete without errors
  - [x] 10.8 Run `npx tsc --noEmit` - must pass with no TypeScript errors

---

## Dev Notes

### Previous Story Intelligence (Story 1.5)

**Key Learnings from Story 1.5:**
- App.ts renders 3-panel layout with CSS Grid
- Grid uses fixed column widths: `350px 1fr 280px`
- Panels have `aria-label` attributes for accessibility
- All CSS uses CSS custom properties (`--da-*`)
- Panel borders exist between panels (code has right border, state has left border)
- Layout uses `grid-template-areas` for semantic placement

**Current CSS Grid Structure:**
```css
.da-app-layout {
  display: grid;
  grid-template-rows: 48px 1fr 24px;
  grid-template-columns: 350px 1fr 280px;
  grid-template-areas:
    "toolbar toolbar toolbar"
    "code circuit state"
    "statusbar statusbar statusbar";
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}
```

**Current Panel Structure (from App.ts):**
- Code panel: `<aside class="da-panel da-code-panel">`
- Circuit panel: `<main class="da-circuit-panel">`
- State panel: `<aside class="da-panel da-state-panel">`

### Panel Width Specifications

**From UX Design Specification:**
| Panel | Minimum | Default |
|-------|---------|---------|
| Code (left) | 250px | 350px |
| Circuit (center) | 400px | fills remaining |
| State (right) | 200px | 280px |

**Constraint Logic:**
- When resizing code panel: `newWidth = clamp(250, mouseX, viewportWidth - 400 - stateWidth)`
- When resizing state panel: `newWidth = clamp(200, viewportWidth - mouseX, viewportWidth - 400 - codeWidth)`
- Circuit panel always gets: `calc(100vw - codeWidth - stateWidth)`

### Implementation Approach

**Recommended Pattern: CSS Custom Properties**

Instead of inline styles, use CSS custom properties for clean separation:

```css
:root {
  --da-code-panel-width: 350px;
  --da-state-panel-width: 280px;
}

.da-app-layout {
  grid-template-columns: var(--da-code-panel-width) 1fr var(--da-state-panel-width);
}
```

Update via JavaScript:
```typescript
document.documentElement.style.setProperty('--da-code-panel-width', `${newWidth}px`);
```

### PanelResizer Component Pattern

**Recommended Structure:**

```typescript
// src/ui/PanelResizer.ts

export interface PanelResizerOptions {
  /** Which panel this resizer controls */
  panel: 'code' | 'state';
  /** Callback when resize occurs */
  onResize: (newWidth: number) => void;
  /** Minimum width constraint */
  minWidth: number;
  /** Maximum width constraint */
  maxWidth: number;
}

export class PanelResizer {
  private element: HTMLElement | null = null;
  private isDragging: boolean = false;
  private startX: number = 0;
  private startWidth: number = 0;
  private options: PanelResizerOptions;

  constructor(options: PanelResizerOptions) {
    this.options = options;
  }

  mount(container: HTMLElement): void {
    this.element = document.createElement('div');
    this.element.className = 'da-resizer';
    this.element.setAttribute('role', 'separator');
    this.element.setAttribute('aria-orientation', 'vertical');
    container.appendChild(this.element);
    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    // mousedown, mousemove, mouseup handlers
  }

  destroy(): void {
    // Cleanup
  }
}
```

### Resize Handle Positioning

**Challenge:** Resize handles need to be positioned over the border between panels.

**Solution 1: Absolute positioning within grid cell**
```html
<aside class="da-code-panel" style="position: relative;">
  <!-- content -->
  <div class="da-resizer da-resizer--right"></div>
</aside>
```

**Solution 2: Separate grid area for resizers**
```css
grid-template-columns: 350px 6px 1fr 6px 280px;
grid-template-areas:
  "toolbar toolbar toolbar toolbar toolbar"
  "code resize1 circuit resize2 state"
  "statusbar statusbar statusbar statusbar statusbar";
```

**Recommended:** Solution 1 (simpler, no grid changes)

### CSS for Resize Handles

```css
.da-resizer {
  position: absolute;
  top: 0;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  background: transparent;
  z-index: 10;
  transition: background-color 0.15s ease;
}

.da-resizer--right {
  right: -3px; /* Half overlap on each side of border */
}

.da-resizer--left {
  left: -3px;
}

.da-resizer:hover,
.da-resizer--active {
  background-color: var(--da-accent);
}

/* Prevent text selection during drag */
body.da-resizing {
  cursor: col-resize !important;
  user-select: none;
}

body.da-resizing * {
  cursor: col-resize !important;
}
```

### Mouse Event Handling Pattern

```typescript
private handleMouseDown = (e: MouseEvent): void => {
  e.preventDefault();
  this.isDragging = true;
  this.startX = e.clientX;
  this.startWidth = this.getCurrentPanelWidth();

  document.body.classList.add('da-resizing');
  this.element?.classList.add('da-resizer--active');

  document.addEventListener('mousemove', this.handleMouseMove);
  document.addEventListener('mouseup', this.handleMouseUp);
};

private handleMouseMove = (e: MouseEvent): void => {
  if (!this.isDragging) return;

  const delta = e.clientX - this.startX;
  const newWidth = this.options.panel === 'code'
    ? this.startWidth + delta
    : this.startWidth - delta;

  const constrained = Math.max(this.options.minWidth,
    Math.min(newWidth, this.options.maxWidth));

  this.options.onResize(constrained);
};

private handleMouseUp = (): void => {
  this.isDragging = false;
  document.body.classList.remove('da-resizing');
  this.element?.classList.remove('da-resizer--active');

  document.removeEventListener('mousemove', this.handleMouseMove);
  document.removeEventListener('mouseup', this.handleMouseUp);
};
```

### Calculating Max Width

The max width for each panel depends on the other panel's current width:

```typescript
private getMaxWidth(): number {
  const viewportWidth = window.innerWidth;
  const otherPanelWidth = this.options.panel === 'code'
    ? this.getStatePanelWidth()
    : this.getCodePanelWidth();

  // Leave room for circuit panel minimum (400px)
  return viewportWidth - CIRCUIT_MIN - otherPanelWidth;
}
```

### Potential Issues to Watch

1. **Event Listener Cleanup:** Must remove document listeners on mouseup AND component destroy
2. **Pointer Events:** May need `pointer-events: none` on panel content during drag to prevent iframe/canvas capture
3. **Touch Support:** Not required for MVP, but structure code to add later
4. **Window Resize:** Panel widths may need adjustment if window shrinks below minimums
5. **Performance:** Use CSS custom properties (single DOM update) vs inline styles (multiple)
6. **Accessibility:** Add `role="separator"` and `aria-orientation="vertical"` to resize handles

### Testing Considerations

**Unit Tests (Vitest + jsdom):**
- Mock `getBoundingClientRect` for width calculations
- Simulate mouse events with `dispatchEvent`
- Test constraint logic with edge cases

**Manual Testing:**
- Verify smooth resize in Firefox
- Verify no text selection during drag
- Verify cursor stays correct even when moving fast
- Test with DevTools open (affects viewport width)

### Files to Create

- `src/ui/PanelResizer.ts` - Resize handle component
- `src/ui/PanelResizer.test.ts` - Unit tests

### Files to Modify

- `src/ui/App.ts` - Add resize handles, update grid columns dynamically
- `src/ui/index.ts` - Export PanelResizer
- `src/styles/main.css` - Add resizer CSS classes

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.6]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Panel Structure]
- [Source: _bmad-output/implementation-artifacts/1-5-create-basic-app-shell-with-3-panel-layout.md]
- [Source: _bmad-output/project-context.md]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

1. **PanelResizer Component Created** - Implemented reusable resize handle component in `src/ui/PanelResizer.ts` with full mouse event handling, accessibility attributes (`role="separator"`, `aria-orientation="vertical"`), and proper cleanup
2. **Dynamic Grid Columns** - Updated `App.ts` to use CSS custom properties (`--da-code-panel-width`, `--da-state-panel-width`) instead of fixed column widths
3. **Panel Constraints Enforced** - Implemented `PANEL_CONSTRAINTS` constant with CODE_MIN=250, CIRCUIT_MIN=400, STATE_MIN=200, CODE_DEFAULT=350, STATE_DEFAULT=280
4. **CSS Classes Added** - Added `.da-resizer`, `.da-resizer--right`, `.da-resizer--left`, `.da-resizer--active`, and `body.da-resizing` classes to `main.css`
5. **Comprehensive Test Coverage** - 35 tests for PanelResizer + 34 tests for App = 90 total tests
6. **Build Verification** - TypeScript compilation passes, production build succeeds in 545ms

### Code Review Fixes Applied (2026-01-21)

**Issues Fixed:**
1. **[HIGH] Keyboard Accessibility** - Added ArrowLeft/ArrowRight/Home/End keyboard handlers for resize (Shift for large steps)
2. **[MEDIUM] ARIA Value Attributes** - Added `aria-valuenow`, `aria-valuemin`, `aria-valuemax` for screen readers
3. **[MEDIUM] Memory Leak on Re-mount** - Added `destroyResizers()` call before re-mounting to prevent event listener leaks
4. **[MEDIUM] Window Resize Handler** - Added handler to constrain panel widths when viewport shrinks
5. **[MEDIUM] Keyboard Tests** - Added 13 new tests for keyboard accessibility
6. **[LOW] Empty Line** - Removed unnecessary blank line in mount method
7. **[LOW] CSS Comment** - Updated outdated comment to reflect dynamic widths
8. **[LOW] Story File List** - Added missing sprint-status.yaml to file list
9. **[LOW] Remount Test** - Added test for cleanup during active drag remount

### File List

**Created:**
- `src/ui/PanelResizer.ts` - Resize handle component with keyboard accessibility
- `src/ui/PanelResizer.test.ts` - Unit tests (keyboard, mouse, ARIA)

**Modified:**
- `src/ui/App.ts` - Added resize functionality, dynamic grid columns, CSS variable updates, window resize handler
- `src/ui/App.test.ts` - Tests for resizable panels, window resize, remount cleanup
- `src/ui/index.ts` - Added PanelResizer exports
- `src/styles/main.css` - Added CSS custom properties and resizer styles
- `_bmad-output/implementation-artifacts/sprint-status.yaml` - Updated story status

---
