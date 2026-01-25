# Story 6.6: Implement Zoom Controls

## Status: done

## Story

As a user,
I want to zoom the circuit view,
So that I can see details or overview.

## Acceptance Criteria

**Given** the circuit is displayed
**When** I use zoom controls
**Then** scrolling the mouse wheel zooms in/out
**And** Fit button fits the entire circuit in view
**And** 100% button shows actual size
**And** zoom level is displayed (e.g., "75%")
**And** zoom range is 25% to 400%

## Tasks

### Task 1: Create ZoomController Class

Create `src/visualizer/ZoomController.ts` that manages zoom state and calculations.

**Subtasks:**
- [x] 1.1 Define `ZoomControllerConfig` interface with min (0.25), max (4.0), step (0.1)
- [x] 1.2 Define `ZoomState` interface with current scale, offsetX, offsetY
- [x] 1.3 Implement `ZoomController` class with:
  - `getScale()`: Returns current zoom scale (1.0 = 100%)
  - `setScale(scale: number)`: Clamp to min/max range
  - `zoomIn(step?: number)`: Increase zoom by step
  - `zoomOut(step?: number)`: Decrease zoom by step
  - `zoomToFit(contentWidth: number, contentHeight: number, viewportWidth: number, viewportHeight: number)`: Calculate scale to fit content
  - `reset()`: Return to 100% (scale = 1.0)
  - `getDisplayPercent()`: Returns formatted string like "75%"
- [x] 1.4 Implement zoom-around-point calculation for mouse wheel zoom (zoom toward cursor position)
- [x] 1.5 Add CSS variable `--da-zoom-transition` for optional smooth zoom transitions
- [x] 1.6 Export `DEFAULT_ZOOM_CONFIG` constant

**Test coverage:**
- Unit tests for scale clamping at min/max boundaries
- Unit tests for zoomToFit calculation with various aspect ratios
- Unit tests for zoom-around-point calculation
- Unit tests for getDisplayPercent formatting

---

### Task 2: Integrate ZoomController with CircuitRenderer

Extend `src/visualizer/CircuitRenderer.ts` to use ZoomController for canvas transforms.

**Subtasks:**
- [x] 2.1 Add `zoomController: ZoomController` private property
- [x] 2.2 Update `CircuitRendererOptions` to include optional `zoom?: ZoomOptions`
- [x] 2.3 Modify `updateDimensions()` to apply zoom scale to canvas transform:
  ```typescript
  // Current:
  this.ctx.scale(this.devicePixelRatio, this.devicePixelRatio);
  // New:
  const zoom = this.zoomController.getScale();
  this.ctx.scale(this.devicePixelRatio * zoom, this.devicePixelRatio * zoom);
  ```
- [x] 2.4 Add `setZoom(scale: number)` public method
- [x] 2.5 Add `getZoom()` public method returning current scale
- [x] 2.6 Add `zoomToFit()` public method that calculates optimal scale for current circuit
- [x] 2.7 Add `resetZoom()` public method (sets to 1.0)
- [x] 2.8 Add `onZoomChange` callback to options for external UI sync
- [x] 2.9 Ensure layout calculations account for zoom (positions must be scaled)
- [x] 2.10 Update `destroy()` to clean up ZoomController

**Test coverage:**
- Integration tests for zoom affecting rendered gate positions
- Tests for zoom scale persisting across renders
- Tests for zoomToFit calculating correct scale

---

### Task 3: Add Mouse Wheel Zoom Handler

Add wheel event handling for zoom in/out with mouse.

**Subtasks:**
- [x] 3.1 Add `boundWheelHandler` private property for cleanup
- [x] 3.2 In `mount()`, attach wheel event listener to canvas
- [x] 3.3 Implement `handleWheel(e: WheelEvent)`:
  - `e.preventDefault()` to stop page scroll
  - Calculate zoom direction from `e.deltaY` (negative = zoom in)
  - Get cursor position relative to canvas: `e.offsetX`, `e.offsetY`
  - Call `zoomController.zoomAtPoint(cursorX, cursorY, zoomIn)`
  - Call `render()` to update display
- [x] 3.4 Use `{ passive: false }` option for wheel listener to allow preventDefault
- [x] 3.5 Add configurable `wheelZoomEnabled: boolean` option (default: true)
- [x] 3.6 Remove wheel listener in `destroy()`

**Test coverage:**
- Tests for wheel up/down changing zoom scale
- Tests for zoom centering on cursor position
- Tests for zoom not exceeding min/max bounds
- Tests for wheelZoomEnabled: false disabling wheel zoom

---

### Task 4: Create ZoomControlsToolbar Component

Create `src/visualizer/ZoomControlsToolbar.ts` for zoom UI buttons.

**Subtasks:**
- [x] 4.1 Define `ZoomControlsCallbacks` interface:
  - `onZoomIn: () => void`
  - `onZoomOut: () => void`
  - `onZoomFit: () => void`
  - `onZoomReset: () => void`
- [x] 4.2 Define `ZoomControlsState` interface with `zoomPercent: string`
- [x] 4.3 Implement `ZoomControlsToolbar` class following existing Toolbar pattern:
  - `mount(container: HTMLElement)`: Create and append UI
  - `updateState(state: ZoomControlsState)`: Update display
  - `destroy()`: Clean up
- [x] 4.4 Render HTML structure:
  ```html
  <div class="da-zoom-controls" role="group" aria-label="Zoom controls">
    <button class="da-zoom-btn" data-action="zoom-out" aria-label="Zoom out" title="Zoom out (-)">-</button>
    <span class="da-zoom-level" aria-live="polite">100%</span>
    <button class="da-zoom-btn" data-action="zoom-in" aria-label="Zoom in" title="Zoom in (+)">+</button>
    <button class="da-zoom-btn" data-action="fit" aria-label="Fit to view" title="Fit to view">Fit</button>
    <button class="da-zoom-btn" data-action="reset" aria-label="Reset zoom" title="Reset to 100%">100%</button>
  </div>
  ```
- [x] 4.5 Add button event handlers calling appropriate callbacks
- [x] 4.6 Style with CSS matching existing toolbar (use `--da-bg-secondary`, `--da-text-primary`, etc.)

**Test coverage:**
- Tests for mount creating correct DOM structure
- Tests for button clicks calling appropriate callbacks
- Tests for updateState updating zoom level display
- Tests for destroy cleaning up event listeners

---

### Task 5: Add CSS Styling for Zoom Controls

Add styles to `src/styles/main.css` for zoom controls.

**Subtasks:**
- [x] 5.1 Add `.da-zoom-controls` container styles (flex, gap, alignment)
- [x] 5.2 Add `.da-zoom-btn` button styles matching `.da-toolbar-btn--icon`
- [x] 5.3 Add `.da-zoom-level` display styles (min-width for consistent sizing, centered text)
- [x] 5.4 Add CSS variable `--da-zoom-min: 0.25` and `--da-zoom-max: 4.0` (already added in Task 1)
- [x] 5.5 Add hover/focus states for buttons
- [x] 5.6 Ensure styles work in both Story Mode and Lab Mode themes

**Test coverage:**
- Visual inspection of zoom controls appearance
- Verify CSS variables are applied

---

### Task 6: Wire Up Integration

Connect all components in the application.

**Subtasks:**
- [x] 6.1 Update `src/visualizer/index.ts` barrel exports:
  - Export `ZoomController`, `DEFAULT_ZOOM_CONFIG`
  - Export `ZoomControlsToolbar`, `ZoomControlsState`, `ZoomControlsCallbacks`
- [x] 6.2 Position ZoomControlsToolbar in circuit panel (in panel header, before close button)
- [x] 6.3 Wire CircuitRenderer zoom changes to ZoomControlsToolbar display updates
- [x] 6.4 Wire ZoomControlsToolbar callbacks to CircuitRenderer methods
- [x] 6.5 Test full interaction flow: wheel zoom updates display, buttons update view

**Test coverage:**
- End-to-end tests for zoom interactions
- Tests for UI staying in sync with actual zoom level

---

## Dev Notes

### Technical Context

**Previous Story Learnings (Story 6.5):**
- Animation system uses `requestAnimationFrame` with frame throttling
- CSS variables should be read via `getComputedStyle()` for theming
- Prefer accessor methods (`getConfig()`, `updateConfig()`) over direct property access
- All components follow mount/updateState/destroy lifecycle

**Current CircuitRenderer Transform Handling (lines 192-193):**
```typescript
this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
this.ctx.scale(this.devicePixelRatio, this.devicePixelRatio);
```

This must be extended to include zoom:
```typescript
this.ctx.setTransform(1, 0, 0, 1, 0, 0);
const zoom = this.zoomController.getScale();
this.ctx.scale(this.devicePixelRatio * zoom, this.devicePixelRatio * zoom);
// Note: offset translation needed for pan (Story 6.7)
```

### Architectural Patterns to Follow

1. **Component Lifecycle:** All UI components use `mount(container)`, `updateState(state)`, `destroy()` pattern (see `Toolbar.ts` for reference)

2. **CSS Variables for Configuration:** Use CSS custom properties for configurable values:
   - `--da-zoom-min: 0.25`
   - `--da-zoom-max: 4.0`
   - `--da-zoom-transition: 150ms` (optional smooth transitions)

3. **Event Handler Cleanup:** Store bound handlers for cleanup in destroy():
   ```typescript
   private boundWheelHandler: ((e: WheelEvent) => void) | null = null;
   ```

4. **Accessibility Requirements:**
   - Zoom controls need `role="group"` and `aria-label`
   - Zoom level display needs `aria-live="polite"` for screen reader announcements
   - Buttons need `aria-label` and keyboard support

### Zoom Calculation Reference

**Zoom to Fit Formula:**
```typescript
zoomToFit(contentW: number, contentH: number, viewportW: number, viewportH: number): number {
  const scaleX = viewportW / contentW;
  const scaleY = viewportH / contentH;
  const scale = Math.min(scaleX, scaleY) * 0.9; // 90% to add padding
  return Math.max(this.config.min, Math.min(this.config.max, scale));
}
```

**Zoom Around Point (for mouse wheel):**
```typescript
zoomAtPoint(x: number, y: number, zoomIn: boolean): void {
  const oldScale = this.scale;
  const newScale = zoomIn
    ? Math.min(this.config.max, oldScale + this.config.step)
    : Math.max(this.config.min, oldScale - this.config.step);

  // Adjust offset to keep point under cursor stationary
  // (This calculation prepares for Story 6.7 pan integration)
  this.scale = newScale;
}
```

### File Structure

```
src/visualizer/
├── ZoomController.ts        # NEW - Zoom state and calculations
├── ZoomController.test.ts   # NEW - Unit tests
├── ZoomControlsToolbar.ts   # NEW - UI component
├── ZoomControlsToolbar.test.ts # NEW - Component tests
├── CircuitRenderer.ts       # MODIFY - Integrate ZoomController
├── CircuitRenderer.test.ts  # MODIFY - Add zoom tests
└── index.ts                 # MODIFY - Export new components

src/styles/
└── visualizer.css           # MODIFY - Add zoom control styles
```

### Testing Strategy

1. **Unit Tests (ZoomController):**
   - Scale clamping at boundaries
   - zoomToFit calculations for various aspect ratios
   - getDisplayPercent formatting (25%, 100%, 400%)

2. **Component Tests (ZoomControlsToolbar):**
   - DOM structure on mount
   - Button click callbacks
   - State updates to display

3. **Integration Tests (CircuitRenderer + Zoom):**
   - Zoom affecting canvas transform
   - Wheel events changing zoom
   - Callback triggering on zoom change

### Dependencies

- **Depends on:** Stories 6.1-6.5 (CircuitRenderer, gates, wires, animation)
- **Blocks:** Story 6.7 (Pan Navigation - shares coordinate transform system)
- **Related:** Story 6.8 (Tooltips - needs zoom-adjusted hit detection)

### Out of Scope

- Pan/scroll navigation (Story 6.7)
- Keyboard shortcuts for zoom (+/-/0 keys)
- Pinch-to-zoom for touch devices
- Smooth animated zoom transitions (can be added later via CSS variable)

---

## Implementation Notes

### Files Created
- `src/visualizer/ZoomController.ts` - Core zoom state management class
- `src/visualizer/ZoomController.test.ts` - 59 unit tests for ZoomController
- `src/visualizer/ZoomControlsToolbar.ts` - UI component for zoom buttons and display
- `src/visualizer/ZoomControlsToolbar.test.ts` - 24 unit tests for ZoomControlsToolbar

### Files Modified
- `src/visualizer/CircuitRenderer.ts` - Added zoom integration (ZoomOptions, setZoom, getZoom, resetZoom, zoomToFit, wheel handler)
- `src/visualizer/CircuitRenderer.test.ts` - Added 17 zoom-related tests
- `src/visualizer/CircuitLayout.ts` - Added getBounds() method for zoomToFit calculation
- `src/visualizer/index.ts` - Added barrel exports for zoom components
- `src/styles/main.css` - Added CSS variables (--da-zoom-min, --da-zoom-max, --da-zoom-transition), zoom control styles, and circuit panel header styles
- `src/ui/App.ts` - Added CircuitRenderer and ZoomControlsToolbar integration with proper wiring

### Bug Fixes During Implementation
- **NaN zoom bug**: Fixed issue where `ZoomController` received `undefined` config values when spreading `{ min: zoomOpts?.min }` style options. The fix ensures only defined values are passed to ZoomController.
- **Wheel listener cleanup order**: Fixed destroy() method to remove wheel event listener before clearing canvas reference.

### Test Coverage
- **ZoomController**: 59 tests covering scale clamping, zoomToFit, zoomAtPoint, display percent formatting, CSS variable reading, onChange callbacks
- **ZoomControlsToolbar**: 24 tests covering mount, button clicks, updateState, destroy
- **CircuitRenderer zoom**: 17 tests covering setZoom, getZoom, resetZoom, zoomToFit, wheel events, onZoomChange callback

### Integration Notes
- CircuitRenderer and ZoomControlsToolbar are initialized in `App.initializeCircuitRenderer()`
- Zoom controls are positioned in the circuit panel header, before the close button
- onZoomChange callback wires CircuitRenderer zoom changes to ZoomControlsToolbar display updates
- ZoomControlsToolbar callbacks (onZoomIn, onZoomOut, onZoomFit, onZoomReset) are wired to CircuitRenderer methods
- Graceful error handling: if canvas context is unavailable (e.g., in jsdom tests), the circuit renderer is not mounted but the app continues to function
