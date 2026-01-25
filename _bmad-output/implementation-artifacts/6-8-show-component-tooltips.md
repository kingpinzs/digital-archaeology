# Story 6.8: Show Component Tooltips

Status: done

## Story

As a user,
I want tooltips on hover,
So that I can identify components.

## Acceptance Criteria

1. **Given** the circuit is displayed **When** I hover over a gate **Then** a tooltip appears showing gate type and ID
2. **And** the tooltip shows current output value
3. **And** the tooltip disappears when I move away
4. **And** hover also slightly highlights the gate

## Tasks / Subtasks

### Task 1: Add Hit Detection for Gates (AC: #1)

Implement mouse position to gate detection that accounts for zoom and pan transforms.

- [x] 1.1 Create `screenToCanvas(clientX: number, clientY: number): { x: number; y: number }` method in CircuitRenderer
  - Transform screen coordinates to canvas coordinates accounting for zoom scale and pan offset
  - Use formula: `canvasX = (clientX - canvasRect.left - offset.x) / zoom`
- [x] 1.2 Create `hitTestGate(canvasX: number, canvasY: number): CircuitGate | null` method in CircuitRenderer
  - Iterate through gates and check if point is within gate bounds using layout positions
  - Return the gate if hit, null otherwise
- [x] 1.3 Store `hoveredGateId: number | null` private property to track currently hovered gate

### Task 2: Implement Mouse Move Handler for Hover Detection (AC: #1, #3)

Add mousemove listener to detect gate hover without conflicting with pan.

- [x] 2.1 Add `boundMouseMoveHoverHandler: ((e: MouseEvent) => void) | null` private property
- [x] 2.2 Create `handleMouseMoveHover(e: MouseEvent): void` handler
  - Skip if `isDragging` is true (don't interfere with pan)
  - Call `screenToCanvas()` then `hitTestGate()`
  - Update `hoveredGateId` if changed
  - Show/hide/update tooltip accordingly
  - Request re-render if hover state changed (for highlight)
- [x] 2.3 Add mousemove listener in `setupPanHandlers()` for hover detection
- [x] 2.4 Add mouseleave listener to hide tooltip when mouse leaves canvas
- [x] 2.5 Clean up hover handlers in `destroy()`

### Task 3: Create Tooltip Component (AC: #1, #2, #3)

Implement a tooltip that displays gate information.

- [x] 3.1 Create `src/visualizer/GateTooltip.ts` class with mount/updateState/destroy lifecycle
- [x] 3.2 Implement `mount(container: HTMLElement)` to create tooltip DOM element
  - Position: absolute, z-index: var(--da-z-tooltip)
  - Initially hidden via `display: none`
- [x] 3.3 Implement `show(x: number, y: number, gate: CircuitGate)` method
  - Format tooltip content: gate type, gate name/ID, output value
  - Position near cursor with smart edge detection (don't overflow viewport)
  - Set `display: block`
- [x] 3.4 Implement `hide()` method to hide tooltip
- [x] 3.5 Implement `destroy()` to remove DOM element
- [x] 3.6 Style tooltip in `src/styles/main.css`:
  - Background: var(--da-bg-elevated)
  - Border: 1px solid var(--da-text-muted)
  - Border-radius: 4px
  - Padding: var(--da-space-2)
  - Font: var(--da-font-mono)
  - Max-width: 200px
  - Pointer-events: none (prevent tooltip from capturing mouse)

### Task 4: Format Gate Information for Tooltip (AC: #2)

Extract and format meaningful gate data for display.

- [x] 4.1 Create `formatGateOutput(gate: CircuitGate): string` helper function
  - Get output wire state from gate.outputs[0]
  - Format as: "Output: 0" or "Output: 1" or "Output: X" (for unknown)
  - For DFF gates, also show stored value: "Stored: 0"
- [x] 4.2 Create `formatGateType(type: string): string` helper function
  - Map internal types to human-readable: AND, OR, NOT, XOR, BUF, DFF
- [x] 4.3 Tooltip content format:
  ```
  [Type] Name
  Output: [value]
  ```
  Example:
  ```
  AND ACC_AND
  Output: 1
  ```

### Task 5: Implement Gate Hover Highlight (AC: #4)

Add visual highlight effect when hovering over a gate.

- [x] 5.1 Add `hoveredGateId` parameter support to `renderGates()` method
- [x] 5.2 Modify `GateRenderer.renderGate()` to accept optional `isHovered: boolean` parameter
- [x] 5.3 When `isHovered` is true:
  - Draw a subtle glow effect around the gate
  - Use strokeStyle with var(--da-accent) color
  - Line width: 2px
  - Optionally increase gate brightness slightly
- [x] 5.4 Ensure highlight renders correctly at all zoom levels

### Task 6: Integrate Tooltip with CircuitRenderer (AC: #1, #2, #3)

Wire up all tooltip components in CircuitRenderer.

- [x] 6.1 Add `tooltip: GateTooltip | null` private property
- [x] 6.2 Create tooltip instance in `mount()` and attach to container
- [x] 6.3 Update `handleMouseMoveHover()` to call `tooltip.show()` or `tooltip.hide()`
- [x] 6.4 Pass client coordinates (not canvas coordinates) to tooltip positioning
- [x] 6.5 Clean up tooltip in `destroy()` by calling `tooltip.destroy()`
- [x] 6.6 Export GateTooltip from `src/visualizer/index.ts`

### Task 7: Write Unit Tests

- [x] 7.1 Test `screenToCanvas()` coordinate transformation at various zoom/pan levels
- [x] 7.2 Test `hitTestGate()` returns correct gate or null
- [x] 7.3 Test hover state changes trigger tooltip show/hide
- [x] 7.4 Test tooltip is not shown during drag (pan operation)
- [x] 7.5 Test tooltip positions correctly near viewport edges
- [x] 7.6 Test GateTooltip lifecycle (mount, show, hide, destroy)
- [x] 7.7 Test hover highlight renders on hovered gate only
- [x] 7.8 Test event handlers are cleaned up in destroy()

---

## Dev Notes

### Technical Context from Previous Story (6.7 - Pan Navigation)

**Critical Integration Points:**
- Pan state uses `isDragging` flag - tooltip hover MUST check this to avoid showing tooltips during drag
- Coordinate transformation requires accounting for both zoom scale AND pan offset
- Bound handler pattern: Store handlers as class properties for proper cleanup
- Mouse handlers on document level (mousemove, mouseup) persist beyond canvas - must be cleaned up
- `zoomController.getOffset()` returns `{ x: number; y: number }` for pan offset
- `zoomController.getScale()` returns current zoom level

**Existing CircuitRenderer Properties (from Story 6.7):**
```typescript
private isDragging: boolean = false;
private zoomController: ZoomController;
private layout: CircuitLayout | null = null;
private circuitModel: CircuitModel | null = null;
```

**Coordinate Transformation Formula:**
```typescript
screenToCanvas(clientX: number, clientY: number): { x: number; y: number } {
  if (!this.canvas) return { x: 0, y: 0 };

  const rect = this.canvas.getBoundingClientRect();
  const zoom = this.zoomController.getScale();
  const offset = this.zoomController.getOffset();

  // Convert screen to canvas coordinates
  const canvasX = (clientX - rect.left - offset.x) / zoom;
  const canvasY = (clientY - rect.top - offset.y) / zoom;

  return { x: canvasX, y: canvasY };
}
```

**Hit Testing Formula:**
```typescript
hitTestGate(canvasX: number, canvasY: number): CircuitGate | null {
  if (!this.circuitModel || !this.layout) return null;

  const config = this.layout.getConfig();
  const { gateWidth, gateHeight } = config;

  for (const gate of this.circuitModel.gates.values()) {
    const pos = this.layout.getPosition(gate.id);
    if (!pos) continue;

    // Check if point is within gate bounds
    if (canvasX >= pos.x && canvasX <= pos.x + gateWidth &&
        canvasY >= pos.y && canvasY <= pos.y + gateHeight) {
      return gate;
    }
  }

  return null;
}
```

### Architecture Patterns to Follow

1. **Component Lifecycle:** mount(container), updateState(state), destroy()
   - [Source: project-context.md#Event Listener Cleanup Pattern]

2. **Bound Handler Pattern:** Store bound handlers as class properties for cleanup:
   ```typescript
   private boundMouseMoveHoverHandler: ((e: MouseEvent) => void) | null = null;
   // In setup:
   this.boundMouseMoveHoverHandler = this.handleMouseMoveHover.bind(this);
   // In destroy():
   this.canvas?.removeEventListener('mousemove', this.boundMouseMoveHoverHandler);
   ```
   - [Source: project-context.md#Event Listener Cleanup Pattern]

3. **CSS Variables for Colors:** Never hardcode hex values
   - [Source: project-context.md#CSS/Theming Rules]

4. **XSS Prevention:** Use `escapeHtml()` for any gate names displayed in tooltip
   - [Source: project-context.md#XSS Prevention Rules]

### Existing File References

**CircuitLayout API (for gate positions):**
- `getPosition(gateId: number): { x: number; y: number } | null`
- `getConfig(): { gateWidth: number; gateHeight: number; ... }`
- [Source: src/visualizer/CircuitLayout.ts]

**CircuitModel API (for gate data):**
- `gates: Map<number, CircuitGate>` - All gates by ID
- `wires: Map<number, CircuitWire>` - All wires by ID
- [Source: src/visualizer/CircuitModel.ts]

**GateRenderer API (for rendering):**
- `renderGate(ctx, gate, x, y, width, height, pulseScale)` - Render single gate
- May need to add `isHovered` parameter
- [Source: src/visualizer/GateRenderer.ts]

### CSS Variables Reference

```css
/* Relevant tokens for tooltip styling */
--da-bg-elevated: #1f2847;     /* Floating elements */
--da-text-primary: #e4e4e4;    /* Main text */
--da-text-muted: #8a8a8a;      /* Border, secondary */
--da-accent: #00b4d8;          /* Highlight color */
--da-z-tooltip: 200;           /* Tooltip z-index */
--da-font-mono: 'JetBrains Mono', monospace;
--da-space-2: 8px;             /* Tooltip padding */
```

### File Structure

```
src/visualizer/
├── GateTooltip.ts           # NEW - Tooltip component
├── GateTooltip.test.ts      # NEW - Tooltip tests
├── CircuitRenderer.ts       # MODIFY - Add hover/tooltip integration
├── CircuitRenderer.test.ts  # MODIFY - Add hover/tooltip tests
├── GateRenderer.ts          # MODIFY - Add hover highlight support
├── GateRenderer.test.ts     # MODIFY - Add highlight tests
└── index.ts                 # MODIFY - Export GateTooltip

src/styles/
└── main.css                 # MODIFY - Add tooltip styles
```

### Testing Strategy

1. **Unit Tests (GateTooltip):**
   - mount() creates DOM element
   - show() positions and displays tooltip with correct content
   - hide() hides tooltip
   - destroy() removes DOM element
   - Edge detection keeps tooltip within viewport

2. **Unit Tests (CircuitRenderer):**
   - screenToCanvas() transforms coordinates correctly at various zoom/pan levels
   - hitTestGate() returns correct gate or null
   - Hover does not trigger during drag (isDragging = true)
   - Event handlers are properly cleaned up

3. **Integration Tests:**
   - Hover over gate shows tooltip with correct info
   - Move away hides tooltip
   - Dragging does not show tooltips
   - Tooltip follows mouse near edges

### Dependencies

- **Depends on:** Story 6.7 (Pan Navigation - coordinate transformation foundation, isDragging state)
- **Blocks:** Story 6.9 (Code-to-Circuit Linking - will use similar hit detection)
- **Related:** Story 6.10 (Circuit-to-Code Linking - similar click/hover patterns)

### Out of Scope

- Wire tooltips (may be added in future story)
- Tooltip delay/debounce (show immediately for now)
- Keyboard-triggered tooltips (accessibility - future consideration)
- Customizable tooltip content (fixed format for MVP)

---

### Accessibility Checklist

- [x] **Keyboard Navigation** - N/A for this story (tooltips are hover-only; keyboard accessibility for tooltips is out of scope)
- [x] **ARIA Attributes** - Tooltip has role="tooltip" and aria-hidden attributes
- [x] **Focus Management** - N/A (no focusable elements added)
- [x] **Color Contrast** - Tooltip uses CSS variables with proper contrast
- [x] **XSS Prevention** - Uses `escapeHtml()` for gate name display in tooltip
- [x] **Screen Reader Announcements** - N/A (visual-only tooltip; canvas already has aria-label)

### Project Structure Notes

- GateTooltip follows established component pattern (mount/updateState/destroy)
- Hover detection integrates with existing pan handlers in CircuitRenderer
- Coordinate transformation builds on Story 6.7's pan offset foundation
- CSS styling follows `--da-` prefix convention

### References

- [Source: project-context.md#Canvas/Animation Rules] - Coordinate system, never use setInterval
- [Source: project-context.md#Event Listener Cleanup Pattern] - Bound handler pattern
- [Source: project-context.md#XSS Prevention Rules] - Escape user content
- [Source: architecture.md#Visualization Patterns] - Canvas rendering, Gate/Wire interfaces
- [Source: ux-design-specification.md#Circuit Visualizer] - Tooltip UX expectations
- [Source: 6-7-implement-pan-navigation.md] - Previous story learnings
- [Source: epics.md#Story 6.8] - Original acceptance criteria

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- jsdom's getBoundingClientRect() returns zeros by default; required per-canvas mocking
- ZoomController auto-centers content when smaller than viewport, changing offset from (0,0)
- Solution: Call renderer.setOffset(0, 0) after updateState() in tests requiring predictable coordinates

### Completion Notes List

- Created GateTooltip.ts with mount/show/hide/destroy lifecycle, XSS protection via escapeHtml()
- Implemented screenToCanvas() for coordinate transformation accounting for zoom and pan offset
- Implemented hitTestGate() for gate detection at canvas coordinates
- Added hover state tracking with hoveredGateId property
- Integrated tooltip with CircuitRenderer: shows on hover, hides on mouseleave or when moving away
- Tooltip skips showing during drag operations (isDragging check)
- Implemented hover highlight in GateRenderer with glow effect and accent-colored border
- CSS uses story-specified variables: --da-bg-elevated, --da-text-muted, --da-z-tooltip, --da-space-2, --da-font-mono
- All 4 acceptance criteria validated: tooltip shows type/ID, shows output, disappears on move away, hover highlights gate
- 2548 tests passing across 60 test files

**Code Review Fixes Applied:**
- Moved escapeHtml() to shared utility at src/utils/escapeHtml.ts (DRY improvement)
- Added escapeHtml.test.ts with 9 comprehensive XSS prevention tests
- Added explicit undefined check in formatGateOutput() for out-of-bounds bit index

### File List

**Created:**
- src/visualizer/GateTooltip.ts - Tooltip component with XSS-safe content rendering
- src/visualizer/GateTooltip.test.ts - 43 comprehensive tests for tooltip
- src/utils/escapeHtml.ts - Shared XSS prevention utility (review fix)
- src/utils/escapeHtml.test.ts - 9 tests for escapeHtml (review fix)

**Modified:**
- src/visualizer/CircuitRenderer.ts - Added screenToCanvas(), hitTestGate(), hover handlers, tooltip integration
- src/visualizer/CircuitRenderer.test.ts - Added Story 6.8 tests for coordinate transformation, hit testing, hover, tooltip
- src/visualizer/GateRenderer.ts - Added isHovered parameter for hover highlight with glow effect
- src/visualizer/GateRenderer.test.ts - Added hover highlight tests
- src/visualizer/index.ts - Exported GateTooltip and related types
- src/styles/main.css - Added .da-gate-tooltip styles with CSS variables
- src/utils/index.ts - Exported escapeHtml utility (review fix)

