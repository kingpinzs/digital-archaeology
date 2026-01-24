# Story 6.1: Create Canvas Circuit Renderer

Status: done

## Story

As a user,
I want to see the CPU circuit diagram,
so that I can understand the hardware.

## Acceptance Criteria

1. **Given** the application is loaded **When** I view the Circuit panel **Then** I see a canvas element filling the panel
2. **And** the canvas has a dark background matching the theme (uses `--da-bg-primary` CSS variable)
3. **And** the canvas resizes when the panel resizes
4. **And** the canvas is ready for rendering (accessible canvas context)

## Tasks / Subtasks

- [x] Task 1: Create CircuitRenderer class skeleton (AC: #1, #4)
  - [x] 1.1 Create `src/visualizer/CircuitRenderer.ts` with class structure
  - [x] 1.2 Implement constructor accepting container element reference
  - [x] 1.3 Implement `mount(container: HTMLElement): void` method
  - [x] 1.4 Implement `destroy(): void` method for cleanup
  - [x] 1.5 Store canvas 2D context reference for future rendering

- [x] Task 2: Create responsive canvas element (AC: #1, #3)
  - [x] 2.1 Create canvas element in mount() with `da-circuit-canvas` class
  - [x] 2.2 Set canvas to fill parent container (100% width/height)
  - [x] 2.3 Handle device pixel ratio for crisp rendering on HiDPI displays
  - [x] 2.4 Store internal dimensions vs display dimensions correctly

- [x] Task 3: Implement resize handling (AC: #3)
  - [x] 3.1 Create ResizeObserver to detect container size changes
  - [x] 3.2 Update canvas dimensions on resize (both display and internal)
  - [x] 3.3 Recalculate device pixel ratio on resize
  - [x] 3.4 Trigger redraw after resize (call render method if exists)
  - [x] 3.5 Clean up ResizeObserver in destroy()

- [x] Task 4: Apply theme-matching background (AC: #2)
  - [x] 4.1 Clear canvas with theme background color on each render
  - [x] 4.2 Read `--da-bg-primary` from CSS computed style
  - [x] 4.3 Use fallback color `#1a1a2e` if CSS variable unavailable
  - [x] 4.4 Implement `render(): void` method that clears and prepares canvas

- [x] Task 5: Add CSS styles for canvas (AC: #1)
  - [x] 5.1 Add `.da-circuit-canvas` styles to main.css
  - [x] 5.2 Set `display: block` to prevent extra space below canvas
  - [x] 5.3 Set `width: 100%; height: 100%` for responsive sizing
  - [x] 5.4 Set `background: var(--da-bg-primary)` for CSS-based background

- [x] Task 6: Export from visualizer module (AC: #4)
  - [x] 6.1 Export CircuitRenderer from `src/visualizer/index.ts`
  - [x] 6.2 Add types export if any interfaces are created

- [x] Task 7: Write unit tests (AC: all)
  - [x] 7.1 Create `src/visualizer/CircuitRenderer.test.ts`
  - [x] 7.2 Test: Canvas element is created in mount()
  - [x] 7.3 Test: Canvas has correct CSS class
  - [x] 7.4 Test: 2D context is obtainable
  - [x] 7.5 Test: Resize updates canvas dimensions
  - [x] 7.6 Test: destroy() removes canvas and cleans up observer
  - [x] 7.7 Test: render() clears canvas with theme background

## Dev Notes

### Architecture Compliance

**Module Location:** `src/visualizer/` - This is the first actual component in this module. The index.ts currently exports nothing.

**Component Pattern:** Follow the established mount/updateState/destroy lifecycle pattern used by other components (see MemoryView.ts, PanelHeader.ts).

**Canvas Rendering Rules (from architecture.md):**
- **NEVER use setInterval** - Always use `requestAnimationFrame` for animation (future stories)
- **Coordinates:** Origin top-left, y increases downward
- **Gate IDs format:** `g-{type}-{index}` (e.g., `g-and-017`)
- **Wire IDs format:** `w-{source}-{target}`
- **Colors via CSS variables** - Never hardcode hex values in canvas code

### Technical Implementation Details

**Device Pixel Ratio Handling:**
```typescript
// Canvas must handle HiDPI displays for crisp rendering
const dpr = window.devicePixelRatio || 1;
canvas.width = containerWidth * dpr;
canvas.height = containerHeight * dpr;
canvas.style.width = `${containerWidth}px`;
canvas.style.height = `${containerHeight}px`;
ctx.scale(dpr, dpr);
```

**ResizeObserver Pattern:**
```typescript
private resizeObserver: ResizeObserver | null = null;

mount(container: HTMLElement): void {
  // ... create canvas ...

  this.resizeObserver = new ResizeObserver(entries => {
    for (const entry of entries) {
      this.handleResize(entry.contentRect);
    }
  });
  this.resizeObserver.observe(container);
}

destroy(): void {
  this.resizeObserver?.disconnect();
  this.resizeObserver = null;
}
```

**Theme Background Reading:**
```typescript
private getThemeBackground(): string {
  const style = getComputedStyle(document.documentElement);
  return style.getPropertyValue('--da-bg-primary').trim() || '#1a1a2e';
}
```

### Event Listener Cleanup Pattern

Per project-context.md, use bound handlers for proper cleanup:

```typescript
class CircuitRenderer {
  private boundHandleResize: (entries: ResizeObserverEntry[]) => void;

  constructor() {
    this.boundHandleResize = this.handleResize.bind(this);
  }
}
```

### Related Files

| File | Relationship |
|------|--------------|
| `src/visualizer/index.ts` | Export CircuitRenderer |
| `src/styles/main.css` | Add .da-circuit-canvas styles |
| `src/ui/PanelHeader.ts` | Reference for component pattern |
| `src/debugger/MemoryView.ts` | Reference for mount/destroy pattern |

### Future Integration Points

- **Story 6.2:** Will load circuit data from `public/circuits/micro4-circuit.json`
- **Story 6.3-6.4:** Will render gates and wires using this canvas
- **Story 6.5:** Will animate signals using requestAnimationFrame
- **Story 6.6-6.7:** Will add zoom/pan transforms to the canvas

### CSS Variables Reference

```css
/* From src/styles/main.css */
--da-bg-primary: #1a1a2e;        /* Main background (Lab Mode) */
--da-bg-primary: #0a0a12;        /* Story Mode background */
--da-signal-high: #00ff88;       /* Wire high signal (future) */
--da-signal-low: #3a3a3a;        /* Wire low signal (future) */
```

### Accessibility Checklist

- [ ] **Keyboard Navigation** - N/A for canvas (will be handled in interaction story)
- [x] **ARIA Attributes** - Add `role="img"` and `aria-label="CPU circuit diagram"` to canvas
- [ ] **Focus Management** - N/A for this story
- [ ] **Color Contrast** - Background established, gate colors in future story
- [x] **XSS Prevention** - No user content rendered in this story
- [ ] **Screen Reader Announcements** - N/A for this story

### Project Structure Notes

**Correct location:** `src/visualizer/CircuitRenderer.ts`

**Naming conventions:**
- Class file: PascalCase (`CircuitRenderer.ts`)
- Test file: Co-located (`CircuitRenderer.test.ts`)
- CSS class: `da-` prefix, kebab-case (`da-circuit-canvas`)

### References

- [Source: architecture.md#Visualization Patterns] - Canvas rendering conventions
- [Source: architecture.md#Canvas Rendering] - Coordinate system, ID formats
- [Source: project-context.md#Canvas/Animation Rules] - RAF, CSS variables
- [Source: project-context.md#Event Listener Cleanup Pattern] - Bound handler pattern
- [Source: epics.md#Story 6.1] - User story and acceptance criteria
- [Source: hdl/04_micro4_cpu.m4hdl] - Circuit structure reference

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None

### Completion Notes List

1. Created CircuitRenderer class with mount/destroy lifecycle pattern
2. Implemented HiDPI canvas rendering with devicePixelRatio scaling
3. ResizeObserver handles responsive resizing with proper cleanup
4. Theme background via CSS variable with DEFAULT_BG_PRIMARY constant fallback
5. Added accessibility attributes (role="img", aria-label)
6. Added updateState() method for component lifecycle pattern consistency
7. Added double-mount protection with error throw
8. 32 comprehensive unit tests covering all acceptance criteria
9. All 2027 tests pass (no regressions)

### Code Review Fixes Applied

- HIGH-1: Replaced hardcoded hex value with DEFAULT_BG_PRIMARY constant
- MED-1: Added updateState() method and CircuitRendererState interface
- MED-2: Added double-mount protection with error throw and test
- MED-3: Added zero-dimension container handling tests (3 tests)
- LOW-1: Updated file line counts in this document
- LOW-2: Verified CSS comment style matches project conventions

### File List

| File | Action | Description |
|------|--------|-------------|
| `src/visualizer/CircuitRenderer.ts` | CREATE | Canvas circuit renderer component (242 lines) |
| `src/visualizer/CircuitRenderer.test.ts` | CREATE | Unit tests (479 lines, 32 tests) |
| `src/visualizer/index.ts` | MODIFY | Export CircuitRenderer and types |
| `src/styles/main.css` | MODIFY | Add .da-circuit-canvas CSS styles |
