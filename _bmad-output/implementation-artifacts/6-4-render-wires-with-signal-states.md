# Story 6.4: Render Wires with Signal States

Status: review

## Story

As a user,
I want wires to show signal values,
so that I can trace data flow.

## Acceptance Criteria

1. **Given** the circuit is rendered **When** signals have values **Then** wires carrying 1 are bright green (#00ff88)
2. **And** wires carrying 0 are dim gray (#3a3a3a)
3. **And** wires with unknown values (state=2) are orange (#ffaa00)
4. **And** wire colors update when signal values change

## Tasks / Subtasks

- [x] Task 1: Define wire color constants and CSS variables (AC: #1-3)
  - [x] 1.1 Add wire color CSS variables to `src/styles/main.css` with `--da-wire-*` prefix
  - [x] 1.2 Create `src/visualizer/wireColors.ts` with color constants and lookup function
  - [x] 1.3 Export wire color utilities from `src/visualizer/index.ts`

- [x] Task 2: Create WireRenderer class (AC: #1-4)
  - [x] 2.1 Create `src/visualizer/WireRenderer.ts` with render method
  - [x] 2.2 Implement `renderWire(ctx, wire, startX, startY, endX, endY)` method
  - [x] 2.3 Draw wire as line with signal-state-specific color
  - [x] 2.4 Handle multi-bit wires (draw thicker line or multiple parallel lines)
  - [x] 2.5 Use CSS variable colors via `getComputedStyle` (follow gateColors pattern)

- [x] Task 3: Calculate wire routing/positions (AC: all)
  - [x] 3.1 Extend `CircuitLayout.ts` to calculate wire endpoints
  - [x] 3.2 Calculate wire start from gate output port position
  - [x] 3.3 Calculate wire end at gate input port position
  - [x] 3.4 Store wire positions in layout for rendering

- [x] Task 4: Integrate wire rendering into CircuitRenderer (AC: all)
  - [x] 4.1 Add WireRenderer instance to CircuitRenderer
  - [x] 4.2 Add `renderWires()` private method
  - [x] 4.3 Update `render()` to draw wires BEFORE gates (wires behind gates)
  - [x] 4.4 Iterate through circuitModel.wires and render each wire
  - [x] 4.5 Clean up WireRenderer in destroy()

- [x] Task 5: Export from visualizer module (AC: all)
  - [x] 5.1 Export WireRenderer from `src/visualizer/index.ts`
  - [x] 5.2 Export wire color types and constants

- [x] Task 6: Write unit tests (AC: all)
  - [x] 6.1 Create `src/visualizer/WireRenderer.test.ts`
  - [x] 6.2 Test: renderWire draws line with correct color for signal=1 (bright green)
  - [x] 6.3 Test: renderWire draws line with correct color for signal=0 (dim gray)
  - [x] 6.4 Test: renderWire draws line with correct color for signal=2/unknown (orange)
  - [x] 6.5 Test: getWireColor returns correct color for each state
  - [x] 6.6 Create `src/visualizer/wireColors.test.ts`
  - [x] 6.7 Test: CircuitRenderer renders wires when circuit data loaded
  - [x] 6.8 Test: Wires are drawn before gates (z-order)

## Dev Notes

### Architecture Compliance

**Module Location:** `src/visualizer/` - Extends the visualizer module from Stories 6.1, 6.2, and 6.3.

**Component Pattern:** WireRenderer is a stateless rendering utility following the same pattern as GateRenderer. Wire routing extends CircuitLayout.

### Previous Story Learnings (Story 6.3)

From the completed Story 6.3:
1. GateRenderer uses `getGateColor()`, `getGateBorderColor()`, `getGateTextColor()` from gateColors.ts
2. All colors read from CSS variables via `getComputedStyle` with fallback defaults
3. CircuitLayout calculates gate positions, caches layout to avoid recalculation
4. CircuitRenderer has lazy initialization pattern for renderers
5. Layout config has: gateWidth (60), gateHeight (40), padding (20), gapX (80), gapY (50)
6. 164 visualizer tests currently passing

**Files from Story 6.3 to build on:**
- `src/visualizer/gateColors.ts` - Pattern for CSS variable color lookup
- `src/visualizer/GateRenderer.ts` - Pattern for stateless renderer class
- `src/visualizer/CircuitLayout.ts` - Extend with wire positions
- `src/visualizer/CircuitRenderer.ts` - Add wire rendering integration

### Wire Signal States (from CircuitData)

Wire state values in `CircuitWire.state[]`:
- **0** = Low signal → dim gray (#3a3a3a)
- **1** = High signal → bright green (#00ff88)
- **2** = Unknown/undefined (X) → orange (#ffaa00)

### Wire Colors (from Acceptance Criteria)

| Signal State | Color | CSS Variable |
|--------------|-------|--------------|
| 1 (high) | Bright green #00ff88 | --da-wire-high |
| 0 (low) | Dim gray #3a3a3a | --da-wire-low |
| 2 (unknown) | Orange #ffaa00 | --da-wire-unknown |

### Wire Data Structure (from types.ts)

```typescript
interface CircuitWire {
  id: number;           // Unique wire identifier
  name: string;         // e.g., "pc", "acc", "z_flag"
  width: number;        // Bit width (1, 4, or 8 for Micro4)
  is_input: boolean;    // External input
  is_output: boolean;   // External output
  state: number[];      // Bit values: 0=low, 1=high, 2=unknown
}
```

### Wire Routing Approach

For this story, use simple straight-line wires connecting gate ports:

```typescript
interface WirePosition {
  wireId: number;
  segments: Array<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    bitIndex: number;  // For multi-bit wires
  }>;
}
```

**Gate Port Positions:**
- Input ports: Left edge of gate, evenly spaced vertically
- Output ports: Right edge of gate, evenly spaced vertically

### Canvas Rendering Pattern (from project-context.md)

**CRITICAL RULES:**
- **Colors via CSS variables** - Never hardcode hex values in rendering code
- **Z-order** - Draw wires BEFORE gates so gates appear on top
- **Coordinates** - Origin top-left, y increases downward
- **Wire thickness** - 1px for single-bit, 2px for multi-bit (>1 width)

### Wire Color Function Pattern

```typescript
// src/visualizer/wireColors.ts
export const DEFAULT_WIRE_COLORS = {
  high: '#00ff88',    // Signal = 1
  low: '#3a3a3a',     // Signal = 0
  unknown: '#ffaa00', // Signal = 2 (undefined/X)
};

export const WIRE_COLOR_VARS = {
  high: '--da-wire-high',
  low: '--da-wire-low',
  unknown: '--da-wire-unknown',
};

export function getWireColor(signalValue: number): string {
  const style = getComputedStyle(document.documentElement);

  let varName: string;
  let defaultColor: string;

  if (signalValue === 1) {
    varName = WIRE_COLOR_VARS.high;
    defaultColor = DEFAULT_WIRE_COLORS.high;
  } else if (signalValue === 0) {
    varName = WIRE_COLOR_VARS.low;
    defaultColor = DEFAULT_WIRE_COLORS.low;
  } else {
    varName = WIRE_COLOR_VARS.unknown;
    defaultColor = DEFAULT_WIRE_COLORS.unknown;
  }

  const color = style.getPropertyValue(varName).trim();
  return color || defaultColor;
}
```

### Wire Rendering Implementation

```typescript
// src/visualizer/WireRenderer.ts
export class WireRenderer {
  renderWire(
    ctx: CanvasRenderingContext2D,
    signalValue: number,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    lineWidth: number = 1
  ): void {
    ctx.strokeStyle = getWireColor(signalValue);
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }
}
```

### Testing with Mock Canvas

```typescript
// Add to existing mock context
const mockCtx = {
  // ... existing mocks from Story 6.3 ...
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  // strokeStyle and lineWidth already exist
};
```

### Accessibility Checklist

- [ ] **Keyboard Navigation** - N/A for canvas rendering
- [ ] **ARIA Attributes** - Canvas already has `role="img"` and `aria-label` from Story 6.1
- [ ] **Focus Management** - N/A for this story
- [ ] **Color Contrast** - Wire colors should be distinguishable (high contrast between high/low/unknown)
- [x] **XSS Prevention** - N/A for canvas rendering (no user content)
- [ ] **Screen Reader Announcements** - Future: announce wire values on hover

### Project Structure Notes

**New files:**
- `src/visualizer/WireRenderer.ts` - Wire drawing utility
- `src/visualizer/WireRenderer.test.ts` - Wire renderer tests
- `src/visualizer/wireColors.ts` - Wire color constants and lookup
- `src/visualizer/wireColors.test.ts` - Wire color tests

**Modified files:**
- `src/visualizer/CircuitRenderer.ts` - Add wire rendering integration
- `src/visualizer/CircuitRenderer.test.ts` - Add wire rendering tests
- `src/visualizer/CircuitLayout.ts` - Add wire position calculation
- `src/visualizer/CircuitLayout.test.ts` - Add wire layout tests
- `src/visualizer/index.ts` - Export new classes
- `src/styles/main.css` - Add wire color CSS variables

### Circuit Data Reference

From micro4-circuit.json:
- ~70+ wires with varying widths (1, 4, 8 bits)
- Wire names like: gnd, vdd, pc, acc, z_flag, clk, rst
- Each wire connects gate outputs to gate inputs via GatePort references

### References

- [Source: epics.md#Story 6.4] - Acceptance criteria and wire color requirements
- [Source: 6-3-render-gates-with-type-colors.md] - Previous story patterns and learnings
- [Source: visualizer/types.ts] - CircuitWire interface definition
- [Source: visualizer/gateColors.ts] - Pattern for CSS variable color lookup
- [Source: visualizer/CircuitLayout.ts] - Layout calculation patterns
- [Source: visualizer/CircuitRenderer.ts] - Renderer integration patterns

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None required - all tests pass.

### Completion Notes List

- All 2198 tests pass (203 visualizer tests: 52 CircuitRenderer, 26 CircuitModel, 17 CircuitLoader, 13 GateRenderer, 39 gateColors, 29 CircuitLayout, 13 WireRenderer, 14 wireColors)
- Added wire color CSS variables: --da-wire-high (#00ff88), --da-wire-low (#3a3a3a), --da-wire-unknown (#ffaa00)
- Created WireRenderer class with renderWire() method for drawing wires with signal-state colors
- Extended CircuitLayout to calculate wire positions based on gate port connections
- Wire rendering integrated into CircuitRenderer, drawing wires BEFORE gates (correct z-order)
- Wire positions calculated from gate output ports to gate input ports
- Multi-bit wires rendered with thicker line width (2px vs 1px)
- All colors read from CSS variables via getComputedStyle with fallback defaults

### File List

- `src/visualizer/wireColors.ts` - NEW - Wire color constants, CSS variable names, getWireColor() function
- `src/visualizer/wireColors.test.ts` - NEW - 14 tests for wire color utilities
- `src/visualizer/WireRenderer.ts` - NEW - Stateless wire rendering utility with renderWire() method
- `src/visualizer/WireRenderer.test.ts` - NEW - 13 tests for wire rendering
- `src/visualizer/CircuitLayout.ts` - MODIFIED - Added WirePosition, WireSegment interfaces, wire position calculation
- `src/visualizer/CircuitLayout.test.ts` - MODIFIED - Added 8 wire position tests
- `src/visualizer/CircuitRenderer.ts` - MODIFIED - Added wire rendering integration, renderWires() method, ensureLayoutCalculated()
- `src/visualizer/CircuitRenderer.test.ts` - MODIFIED - Added 4 wire rendering tests, updated mock context with wire methods
- `src/visualizer/index.ts` - MODIFIED - Exported WireRenderer, wire color utilities, WirePosition types
- `src/styles/main.css` - MODIFIED - Added wire color CSS variables in 3 sections (:root, .lab-mode, .story-mode)

