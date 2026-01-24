# Story 6.3: Render Gates with Type Colors

Status: done

## Story

As a user,
I want gates rendered with distinct colors,
so that I can identify different gate types.

## Acceptance Criteria

1. **Given** circuit data is loaded **When** the circuit is rendered **Then** AND gates are rendered in teal (#4ecdc4)
2. **And** OR gates are rendered in red (#ff6b6b)
3. **And** XOR gates are rendered in purple (#c44dff)
4. **And** NOT gates are rendered in yellow (#ffd93d)
5. **And** BUF (buffer) gates are rendered in gray (#888888)
6. **And** DFF (flip-flops) are rendered in blue (#4d96ff)
7. **And** gates are drawn with recognizable shapes (rectangles with type labels for now)

## Tasks / Subtasks

- [x] Task 1: Define gate color constants and CSS variables (AC: #1-6)
  - [x] 1.1 Add gate color CSS variables to `src/styles/main.css` with `--da-gate-*` prefix
  - [x] 1.2 Create `src/visualizer/gateColors.ts` with color constants and lookup function
  - [x] 1.3 Export gate color types from `src/visualizer/index.ts`

- [x] Task 2: Create GateRenderer class (AC: #1-7)
  - [x] 2.1 Create `src/visualizer/GateRenderer.ts` with render method
  - [x] 2.2 Implement `renderGate(ctx, gate, x, y, width, height)` method
  - [x] 2.3 Draw gate as rounded rectangle with type-specific fill color
  - [x] 2.4 Draw gate type label (AND, OR, etc.) centered in gate
  - [x] 2.5 Use CSS variable colors via `getComputedStyle` (follow CircuitRenderer pattern)

- [x] Task 3: Create layout calculation system (AC: #7)
  - [x] 3.1 Create `src/visualizer/CircuitLayout.ts` for gate positioning
  - [x] 3.2 Implement simple grid layout: gates arranged by type in columns
  - [x] 3.3 Calculate gate positions based on circuit dimensions
  - [x] 3.4 Store calculated positions in layout object for rendering

- [x] Task 4: Integrate gate rendering into CircuitRenderer (AC: all)
  - [x] 4.1 Add GateRenderer instance to CircuitRenderer
  - [x] 4.2 Add CircuitLayout instance to CircuitRenderer
  - [x] 4.3 Update `render()` method to draw all gates after background
  - [x] 4.4 Iterate through circuitModel.gates and render each gate
  - [x] 4.5 Clean up GateRenderer and CircuitLayout in destroy()

- [x] Task 5: Export from visualizer module (AC: all)
  - [x] 5.1 Export GateRenderer, CircuitLayout from `src/visualizer/index.ts`
  - [x] 5.2 Export gate color types and constants

- [x] Task 6: Write unit tests (AC: all)
  - [x] 6.1 Create `src/visualizer/GateRenderer.test.ts`
  - [x] 6.2 Test: renderGate draws rectangle with correct fill color for each gate type
  - [x] 6.3 Test: renderGate draws gate type label
  - [x] 6.4 Test: getGateColor returns correct color for each type
  - [x] 6.5 Create `src/visualizer/CircuitLayout.test.ts`
  - [x] 6.6 Test: layout calculates positions for all gates
  - [x] 6.7 Test: CircuitRenderer renders gates when circuit data loaded

## Dev Notes

### Architecture Compliance

**Module Location:** `src/visualizer/` - Extends the visualizer module from Stories 6.1 and 6.2.

**Component Pattern:** GateRenderer is a stateless rendering utility. CircuitLayout is a data container for calculated positions. Both follow the established patterns from CircuitLoader and CircuitModel.

### Previous Story Learnings (Story 6.2)

From the completed Story 6.2:
1. CircuitModel provides O(1) access to gates via `gates` Map and `getGatesByType(type)`
2. CircuitRenderer has `circuitModel` property with loaded circuit data
3. Gate types in Micro4: AND (52), OR (37), NOT (13), BUF (23), DFF (42)
4. Each gate has: id, name, type, inputs[], outputs[], stored? (for DFF)
5. Use lazy initialization pattern (like loader in CircuitRenderer)
6. Follow bound handler cleanup pattern in destroy()

**Files from Story 6.2 to build on:**
- `src/visualizer/CircuitRenderer.ts` - Add gate rendering to render() method
- `src/visualizer/CircuitModel.ts` - Use gates Map and getGatesByType()
- `src/visualizer/types.ts` - GateType already defined: 'AND' | 'OR' | 'NOT' | 'BUF' | 'DFF' | 'XOR'

### Gate Colors (from UX Design)

| Gate Type | Color | CSS Variable |
|-----------|-------|--------------|
| AND | Teal #4ecdc4 | --da-gate-and |
| OR | Red #ff6b6b | --da-gate-or |
| XOR | Purple #c44dff | --da-gate-xor |
| NOT | Yellow #ffd93d | --da-gate-not |
| BUF | Gray #888888 | --da-gate-buf |
| DFF | Blue #4d96ff | --da-gate-dff |

### Canvas Rendering Pattern (from project-context.md)

**CRITICAL RULES:**
- **Colors via CSS variables** - Never hardcode hex values in rendering code
- **Coordinates** - Origin top-left, y increases downward
- **Gate IDs** - Format `g-{type}-{index}` (e.g., `g-and-017`)

**Get CSS variable pattern (from CircuitRenderer):**
```typescript
private getGateColor(type: string): string {
  const style = getComputedStyle(document.documentElement);
  const varName = `--da-gate-${type.toLowerCase()}`;
  const color = style.getPropertyValue(varName).trim();
  return color || DEFAULT_GATE_COLORS[type] || '#888888';
}
```

### Simple Gate Rendering Approach

For this story, use simple rectangular gates with type labels:
```typescript
renderGate(ctx: CanvasRenderingContext2D, gate: CircuitGate, x: number, y: number, width: number, height: number): void {
  // Fill with gate type color
  ctx.fillStyle = this.getGateColor(gate.type);
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 4);
  ctx.fill();

  // Draw border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Draw type label
  ctx.fillStyle = '#ffffff';
  ctx.font = '10px JetBrains Mono, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(gate.type, x + width / 2, y + height / 2);
}
```

### Simple Grid Layout

For initial implementation, arrange gates in columns by type:
```typescript
class CircuitLayout {
  private positions: Map<number, { x: number; y: number }> = new Map();

  calculate(model: CircuitModel, canvasWidth: number, canvasHeight: number): void {
    const gateWidth = 60;
    const gateHeight = 40;
    const padding = 20;
    const gapX = 80;
    const gapY = 50;

    const types = ['AND', 'OR', 'NOT', 'BUF', 'DFF', 'XOR'];
    let col = 0;

    for (const type of types) {
      const gates = model.getGatesByType(type);
      let row = 0;
      for (const gate of gates) {
        const x = padding + col * gapX;
        const y = padding + row * gapY;
        this.positions.set(gate.id, { x, y });
        row++;
        if (row * gapY > canvasHeight - padding * 2) {
          row = 0;
          col++;
        }
      }
      col++;
    }
  }

  getPosition(gateId: number): { x: number; y: number } | undefined {
    return this.positions.get(gateId);
  }
}
```

### Testing with Mock Canvas (from Story 6.1)

```typescript
// Create mock canvas context
const mockCtx = {
  fillRect: vi.fn(),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 0,
  beginPath: vi.fn(),
  roundRect: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  fillText: vi.fn(),
  font: '',
  textAlign: '',
  textBaseline: '',
} as unknown as CanvasRenderingContext2D;
```

### Accessibility Checklist

- [ ] **Keyboard Navigation** - N/A for canvas rendering (future: keyboard navigation of gates)
- [ ] **ARIA Attributes** - Canvas already has `role="img"` and `aria-label` from Story 6.1
- [ ] **Focus Management** - N/A for this story
- [ ] **Color Contrast** - Gate colors should have sufficient contrast against background
- [x] **XSS Prevention** - N/A for canvas rendering (no user content)
- [ ] **Screen Reader Announcements** - Future: announce selected gate

### Project Structure Notes

**New files:**
- `src/visualizer/GateRenderer.ts` - Gate drawing utility
- `src/visualizer/GateRenderer.test.ts` - Gate renderer tests
- `src/visualizer/CircuitLayout.ts` - Gate positioning
- `src/visualizer/CircuitLayout.test.ts` - Layout tests
- `src/visualizer/gateColors.ts` - Color constants and lookup

**Modified files:**
- `src/visualizer/CircuitRenderer.ts` - Integrate gate rendering
- `src/visualizer/CircuitRenderer.test.ts` - Add gate rendering tests
- `src/visualizer/index.ts` - Export new classes
- `src/styles/main.css` - Add gate color CSS variables

### References

- [Source: architecture.md#Visualization Patterns] - Canvas rendering conventions
- [Source: project-context.md#Canvas/Animation Rules] - Gate ID format, color rules
- [Source: ux-design-specification.md#Gate Colors] - Color definitions
- [Source: 6-2-load-and-parse-circuit-data.md] - CircuitModel API, gate types
- [Source: visualizer/types.ts] - GateType definition

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None required - all tests pass.

### Completion Notes List

- All 2159 tests pass (164 visualizer tests: 48 CircuitRenderer, 26 CircuitModel, 17 CircuitLoader, 13 GateRenderer, 21 CircuitLayout, 39 gateColors)
- Updated CSS variables to match story requirements (XOR=#c44dff purple, NOT=#ffd93d yellow, added BUF=#888888 gray, added DFF=#4d96ff blue)
- GateRenderer draws rounded rectangles with type-specific colors and centered type labels
- CircuitLayout arranges gates in columns by type using simple grid layout
- Gate colors read from CSS variables via getComputedStyle with fallback to defaults
- Updated existing CircuitRenderer tests to include mock methods for gate rendering

**Code Review Fixes Applied:**
- Added `--da-gate-border` and `--da-gate-text` CSS variables (replaced hardcoded #ffffff)
- Added `getGateBorderColor()` and `getGateTextColor()` functions to read from CSS variables
- GateRenderer now uses CSS variable functions instead of hardcoded config values
- Layout calculation is now cached - only recalculates when circuit data or dimensions change
- Added large circuit test (150 gates) to verify performance
- Added console.warn for unknown gate types in getGateColor()
- Added 8 new tests for border/text color functions

### File List

- `src/visualizer/gateColors.ts` - NEW - Gate color constants, CSS variable names, getGateColor(), getGateBorderColor(), getGateTextColor() functions
- `src/visualizer/gateColors.test.ts` - NEW - 39 tests for gate color utilities (incl. border/text colors)
- `src/visualizer/GateRenderer.ts` - NEW - Stateless gate rendering utility with renderGate() method, uses CSS variable functions
- `src/visualizer/GateRenderer.test.ts` - NEW - 13 tests for gate rendering
- `src/visualizer/CircuitLayout.ts` - NEW - Gate positioning with grid layout by type
- `src/visualizer/CircuitLayout.test.ts` - NEW - 21 tests for layout calculation
- `src/visualizer/CircuitRenderer.ts` - MODIFIED - Added gate rendering integration, renderGates() method, layout caching, cleanup
- `src/visualizer/CircuitRenderer.test.ts` - MODIFIED - Added 7 gate rendering tests (incl. large circuit, layout caching), updated mock context
- `src/visualizer/index.ts` - MODIFIED - Exported new classes, types, and functions (DEFAULT_GATE_STYLE, GATE_STYLE_VARS, getGateBorderColor, getGateTextColor)
- `src/styles/main.css` - MODIFIED - Updated gate color CSS variables (3 sections: :root, .lab-mode, .story-mode), added --da-gate-border and --da-gate-text

