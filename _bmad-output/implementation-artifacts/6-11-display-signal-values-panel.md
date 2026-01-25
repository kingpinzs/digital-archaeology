# Story 6.11: Display Signal Values Panel

Status: complete

## Story

As a user,
I want to see key signal values,
So that I can understand bus states.

## Acceptance Criteria

1. **Given** a program is loaded **When** I view the circuit panel **Then** I see a Signals section showing key registers
2. **And** MDR (Memory Data Register) value is displayed
3. **And** MAR (Memory Address Register) value is displayed
4. **And** opcode value is displayed
5. **And** control signals are displayed
6. **And** values update after each step

## Tasks / Subtasks

### Task 1: Create SignalValuesPanel Component (AC: #1)

Create a new panel component to display key circuit signals.

- [x] 1.1 Create `src/visualizer/SignalValuesPanel.ts`:
  - Create `SignalValuesPanel` class with `mount()`, `destroy()`, `update()` methods
  - Accept `CircuitModel` reference for signal access
  - Use `getWireByName()` to access specific wires
- [x] 1.2 Define key signals to display based on circuit.json wire names:
  - `pc` (8-bit) - Program Counter
  - `acc` (4-bit) - Accumulator
  - `mar` (8-bit) - Memory Address Register
  - `mdr` (4-bit) - Memory Data Register
  - `ir` (8-bit) - Instruction Register
  - `opcode` (4-bit) - Current Opcode
  - `z_flag` (1-bit) - Zero Flag
- [x] 1.3 Create `SignalValuesPanelOptions` interface with optional signal list override
- [x] 1.4 Export from `src/visualizer/index.ts`

### Task 2: Implement Signal Display Formatting (AC: #2, #3, #4)

Format wire values for human-readable display.

- [x] 2.1 Add `formatWireValue(wire: CircuitWire): string` utility:
  - Convert state array to binary string
  - Convert to hex value for multi-bit wires
  - Handle undefined states (2) as "X"
- [x] 2.2 Add `formatSignalLabel(name: string): string` for human-readable labels:
  - `pc` → "PC"
  - `acc` → "ACC"
  - `mar` → "MAR"
  - `mdr` → "MDR"
  - `ir` → "IR"
  - `opcode` → "OP"
  - `z_flag` → "ZF"
- [x] 2.3 Display both binary and hex for multi-bit values (e.g., "0101 (5)")

### Task 3: Render Signal Values UI (AC: #1, #5)

Create the visual panel structure.

- [x] 3.1 Create panel HTML structure:
  ```html
  <div class="da-signal-values-panel">
    <div class="da-signal-row">
      <span class="da-signal-label">PC</span>
      <span class="da-signal-value">00000000 (0x00)</span>
    </div>
    <!-- more rows... -->
  </div>
  ```
- [x] 3.2 Style with CSS in main.css:
  - Use `--da-bg-secondary` for panel background
  - Use monospace font for values
  - Compact row layout (label: value)
  - Highlight changed values with `--da-accent` color
- [x] 3.3 Add control signals section:
  - `pc_load`, `pc_inc`, `acc_load`, `z_load`, `ir_load`, `mar_load`, `mdr_load` control signals

### Task 4: Wire Up Panel Updates (AC: #6)

Connect panel to emulator state changes.

- [x] 4.1 Add `update(model: CircuitModel)` method to SignalValuesPanel
- [x] 4.2 Track previous values to highlight changes
- [x] 4.3 In App.ts, mount SignalValuesPanel in circuit panel content area
- [x] 4.4 Call `signalValuesPanel.update()` after each emulator step
- [x] 4.5 Clear highlights after brief delay (use animation or timeout)

### Task 5: Position Panel Within Circuit Panel (AC: #1)

Integrate into existing circuit visualization layout.

- [x] 5.1 Position panel as overlay in circuit panel (top-right corner)
- [x] 5.2 Use collapse/expand toggle with arrow icon for control signals
- [x] 5.3 Control signals default to collapsed
- [ ] 5.4 Persist collapse state in local storage (optional - deferred)
- [x] 5.5 Update CSS to accommodate panel overlay

### Task 6: Write Unit Tests

- [x] 6.1 Test `formatWireValue()`:
  - Single bit wire: "0" or "1"
  - Multi-bit wire: binary + hex
  - Undefined bits: "X" in output
- [x] 6.2 Test `formatSignalLabel()`:
  - All known wire names map correctly
  - Unknown names return uppercase
- [x] 6.3 Test SignalValuesPanel:
  - Mount creates DOM structure
  - Update changes displayed values
  - Changed values get highlight class
  - Destroy cleans up DOM
- [x] 6.4 Test integration:
  - Panel updates after emulator step
  - Values match CircuitModel state

---

## Dev Notes

### CRITICAL: Reuse Existing Infrastructure

**From Story 6.5 (Animation):**
```typescript
// SignalAnimator.ts already has state tracking
interface SignalSnapshot {
  wireStates: Map<number, number[]>;  // Wire ID → bit values
  gateOutputs: Map<number, number[]>;
}
```

**From Story 6.2 (Circuit Data Loading):**
```typescript
// CircuitModel.ts provides wire access
class CircuitModel {
  getWireByName(name: string): CircuitWire | undefined;
  wires: Map<number, CircuitWire>;
}

// CircuitWire has state array
interface CircuitWire {
  id: number;
  name: string;
  width: number;
  state: number[];  // 0=low, 1=high, 2=undefined
}
```

### Available Wires from circuit.json

Based on analysis of `/visualizer/circuit.json`:

| Wire Name | Width | Description |
|-----------|-------|-------------|
| `pc` | 8-bit | Program Counter |
| `acc` | 4-bit | Accumulator |
| `mar` | 8-bit | Memory Address Register |
| `mdr` | 4-bit | Memory Data Register |
| `ir` | 8-bit | Instruction Register |
| `opcode` | 4-bit | Decoded opcode (from IR) |
| `z_flag` | 1-bit | Zero flag |
| `pc_load` | 1-bit | PC load control |
| `pc_inc` | 1-bit | PC increment control |
| `acc_load` | 1-bit | ACC load control |
| `z_load` | 1-bit | Zero flag load control |
| `ir_load` | 1-bit | IR load control |
| `mar_load` | 1-bit | MAR load control |
| `mdr_load` | 1-bit | MDR load control |
| `is_hlt` | 1-bit | Halt instruction decode |
| `is_lda` | 1-bit | LDA instruction decode |
| `is_sta` | 1-bit | STA instruction decode |

### Signal Categories for Display

**Registers (always show):**
- PC, ACC, MAR, MDR, IR, ZF

**Control Signals (collapsible section):**
- pc_load, pc_inc, acc_load, z_load, ir_load, mar_load, mdr_load

**Instruction Decode (optional):**
- is_hlt, is_lda, is_sta, etc.

### Value Formatting Examples

```typescript
// Single bit
formatWireValue({ state: [0] }) // "0"
formatWireValue({ state: [1] }) // "1"
formatWireValue({ state: [2] }) // "X"

// 4-bit (accumulator)
formatWireValue({ state: [1, 0, 1, 0], width: 4 }) // "1010 (0xA)"
formatWireValue({ state: [0, 0, 0, 0], width: 4 }) // "0000 (0x0)"
formatWireValue({ state: [2, 0, 1, 0], width: 4 }) // "X010 (0x?)"

// 8-bit (program counter)
formatWireValue({ state: [0,0,0,0,0,0,1,0], width: 8 }) // "00000010 (0x02)"
```

### CSS Classes

```css
.da-signal-values-panel {
  background: var(--da-bg-secondary);
  border-top: 1px solid var(--da-border);
  padding: var(--da-spacing-sm);
  font-family: var(--da-font-mono);
  font-size: var(--da-font-size-sm);
}

.da-signal-row {
  display: flex;
  justify-content: space-between;
  padding: 2px 0;
}

.da-signal-label {
  color: var(--da-text-secondary);
  min-width: 3em;
}

.da-signal-value {
  color: var(--da-text-primary);
}

.da-signal-value.da-signal-changed {
  color: var(--da-accent);
  font-weight: bold;
}

.da-signal-section-header {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--da-spacing-xs);
}

.da-signal-section-header::before {
  content: '▼';
  font-size: 0.7em;
  transition: transform 0.2s;
}

.da-signal-section.collapsed .da-signal-section-header::before {
  transform: rotate(-90deg);
}
```

### Integration with App.ts

```typescript
// In initializeCircuitRenderer() or separate method
private initializeSignalValuesPanel(): void {
  const circuitPanel = this.container?.querySelector('.da-circuit-panel .da-panel-content');
  if (!circuitPanel || !this.circuitRenderer) return;

  // Create container for signal values
  const signalContainer = document.createElement('div');
  signalContainer.className = 'da-signal-values-container';
  circuitPanel.appendChild(signalContainer);

  this.signalValuesPanel = new SignalValuesPanel();
  this.signalValuesPanel.mount(signalContainer);
}

// After emulator step
private async handleStep(): Promise<void> {
  // ... existing step logic ...

  // Update signal values panel
  if (this.signalValuesPanel && this.circuitRenderer) {
    const model = this.circuitRenderer.getModel();
    if (model) {
      this.signalValuesPanel.update(model);
    }
  }
}
```

### File Structure

```
src/visualizer/
├── SignalValuesPanel.ts          # NEW - Main component
├── SignalValuesPanel.test.ts     # NEW - Unit tests
├── signalFormatters.ts           # NEW - Value formatting utilities
├── signalFormatters.test.ts      # NEW - Formatter tests
└── index.ts                      # MODIFY - Export new component

src/styles/
└── main.css                      # MODIFY - Add signal panel styles

src/ui/
└── App.ts                        # MODIFY - Mount and update panel
```

### Testing Strategy

1. **Unit Tests (signalFormatters):**
   - Binary formatting for all widths
   - Hex conversion accuracy
   - Undefined bit handling
   - Label mapping

2. **Unit Tests (SignalValuesPanel):**
   - DOM structure creation
   - Value updates reflected
   - Change highlighting applied/cleared
   - Section collapse/expand

3. **Integration Tests:**
   - Panel visible in circuit panel
   - Values update on step
   - Values match emulator state

### Dependencies

- **Depends on:** Story 6.2 (Circuit Data Loading - CircuitModel, wire access)
- **Depends on:** Story 6.5 (Animation - SignalAnimator pattern)
- **Relates to:** Story 6.9/6.10 (Code-Circuit Linking - wire highlighting)

### Out of Scope

- Editable signal values (read-only display)
- Signal waveform history (future epic)
- Custom signal selection UI (future enhancement)
- Signal search/filter (future enhancement)

---

### Accessibility Checklist

- [x] **Keyboard Navigation** - Collapse/expand via Enter/Space key
- [x] **ARIA Attributes** - `aria-expanded` on collapsible sections, `role="button"`, `tabindex="0"`
- [x] **Focus Management** - Focus visible on section headers
- [x] **Color Contrast** - Values use sufficient contrast with theme variables
- [x] **XSS Prevention** - N/A (no user content)
- [ ] **Screen Reader Announcements** - `aria-live` for value changes (optional - deferred)

### Project Structure Notes

- New SignalValuesPanel follows existing panel component patterns
- Formatters as separate module for reusability
- CSS uses existing theme variables
- Positioned within circuit panel (not new panel)

### References

- [Source: visualizer/circuit.json] - Wire names and structure
- [Source: src/visualizer/CircuitModel.ts] - Wire access API
- [Source: src/visualizer/SignalAnimator.ts] - State tracking pattern
- [Source: src/visualizer/types.ts#CircuitWire] - Wire interface
- [Source: epics.md#Story 6.11] - Original acceptance criteria

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Initial implementation completed in a single session

### Completion Notes List

- Created SignalValuesPanel component with mount/destroy/update lifecycle
- Implemented formatters: formatSignalLabel, stateToBinary, stateToDecimal, decimalToHex, formatWireValue, statesEqual
- CSS styling with collapsible control signals section
- Change highlighting with 500ms timeout
- Full keyboard accessibility (Enter/Space for collapse toggle)
- ARIA attributes for screen reader support
- Integrated with App.ts - panel updates on step, run, reset, load
- All tests pass (52 new tests: 27 signalFormatters + 25 SignalValuesPanel)

### Code Review Fixes Applied

- **[HIGH]** Updated ACs to reflect actual circuit wire names (MDR, MAR, opcode)
- **[MEDIUM]** Fixed event listener memory leak - now properly removed in destroy()
- **[MEDIUM]** Added `aria-controls` attribute for accessibility
- **[MEDIUM]** Added `position: relative` to circuit panel content for proper overlay positioning
- **[MEDIUM]** Added 5 integration tests for SignalValuesPanel in App.test.ts
- **[LOW]** Corrected test count in completion notes

### File List

| Action | File |
|--------|------|
| ADD | `src/visualizer/SignalValuesPanel.ts` |
| ADD | `src/visualizer/SignalValuesPanel.test.ts` |
| ADD | `src/visualizer/signalFormatters.ts` |
| ADD | `src/visualizer/signalFormatters.test.ts` |
| MODIFY | `src/visualizer/index.ts` |
| MODIFY | `src/styles/main.css` |
| MODIFY | `src/ui/App.ts` |
| MODIFY | `src/ui/App.test.ts` |
