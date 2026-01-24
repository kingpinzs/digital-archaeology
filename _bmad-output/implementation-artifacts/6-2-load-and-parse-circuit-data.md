# Story 6.2: Load and Parse Circuit Data

Status: done

## Story

As a developer,
I want circuit data loaded from JSON,
So that the renderer knows what to draw.

## Acceptance Criteria

1. **Given** micro4-circuit.json exists in public/circuits/ **When** the application initializes **Then** the circuit data is loaded and parsed
2. **And** gates are stored in a Map with their properties
3. **And** wires are stored with their connections
4. **And** the circuit is ready for rendering

## Tasks / Subtasks

- [x] Task 1: Copy existing circuit.json to web app (AC: #1)
  - [x] 1.1 Copy `visualizer/circuit.json` to `digital-archaeology-web/public/circuits/micro4-circuit.json`
  - [x] 1.2 Verify JSON structure matches expected format (wires array, gates array)

- [x] Task 2: Create TypeScript interfaces for circuit data (AC: #2, #3)
  - [x] 2.1 Create `src/visualizer/types.ts` with circuit data types
  - [x] 2.2 Define `CircuitWire` interface: id, name, width, is_input, is_output, state array
  - [x] 2.3 Define `CircuitGate` interface: id, name, type, inputs, outputs, stored (for DFF)
  - [x] 2.4 Define `CircuitData` interface: cycle, stable, wires array, gates array
  - [x] 2.5 Define `GateInput/GateOutput` interface: wire id, bit index

- [x] Task 3: Create CircuitLoader class (AC: #1, #4)
  - [x] 3.1 Create `src/visualizer/CircuitLoader.ts`
  - [x] 3.2 Implement `loadCircuit(path: string): Promise<CircuitData>` method
  - [x] 3.3 Use fetch API to load JSON from public/circuits/
  - [x] 3.4 Validate JSON structure matches CircuitData interface
  - [x] 3.5 Throw typed `CircuitLoadError` on failure with descriptive message

- [x] Task 4: Create CircuitModel class for indexed access (AC: #2, #3, #4)
  - [x] 4.1 Create `src/visualizer/CircuitModel.ts`
  - [x] 4.2 Implement `gates: Map<number, CircuitGate>` for O(1) gate lookup
  - [x] 4.3 Implement `wires: Map<number, CircuitWire>` for O(1) wire lookup
  - [x] 4.4 Implement `wiresByName: Map<string, CircuitWire>` for name-based lookup
  - [x] 4.5 Implement `getGate(id: number)` method
  - [x] 4.6 Implement `getWire(id: number)` and `getWireByName(name: string)` methods
  - [x] 4.7 Implement `getGatesByType(type: string): CircuitGate[]` for filtering by type

- [x] Task 5: Integrate with CircuitRenderer (AC: #4)
  - [x] 5.1 Add `CircuitRendererState.circuitData?: CircuitData` to state interface
  - [x] 5.2 Update `updateState()` to accept circuit data
  - [x] 5.3 Create optional `loadCircuit(path: string)` convenience method on renderer
  - [x] 5.4 Store CircuitModel reference in renderer for future rendering

- [x] Task 6: Export from visualizer module (AC: #4)
  - [x] 6.1 Export CircuitLoader, CircuitModel from `src/visualizer/index.ts`
  - [x] 6.2 Export all circuit type interfaces

- [x] Task 7: Write unit tests (AC: all)
  - [x] 7.1 Create `src/visualizer/CircuitLoader.test.ts`
  - [x] 7.2 Test: loadCircuit returns parsed CircuitData
  - [x] 7.3 Test: loadCircuit throws CircuitLoadError on 404
  - [x] 7.4 Test: loadCircuit throws CircuitLoadError on invalid JSON
  - [x] 7.5 Create `src/visualizer/CircuitModel.test.ts`
  - [x] 7.6 Test: gates Map contains all gates from data
  - [x] 7.7 Test: wires Map contains all wires from data
  - [x] 7.8 Test: getGate returns correct gate by id
  - [x] 7.9 Test: getWireByName returns correct wire
  - [x] 7.10 Test: getGatesByType returns filtered array

## Dev Notes

### Architecture Compliance

**Module Location:** `src/visualizer/` - Extends the visualizer module started in Story 6.1.

**Component Pattern:** CircuitLoader is a stateless utility class. CircuitModel is a data container with indexed access methods.

**Existing Circuit Data:** The complete Micro4 CPU circuit already exists at `visualizer/circuit.json` with:
- **138 wires** (registers, signals, control lines)
- **167 gates** (AND, OR, NOT, BUF, DFF, XOR)
- Full state machine and ALU logic

### Circuit JSON Structure (from existing circuit.json)

```typescript
interface CircuitData {
  cycle: number;          // Current simulation cycle
  stable: boolean;        // Circuit in stable state
  wires: CircuitWire[];   // Array of all wires
  gates: CircuitGate[];   // Array of all gates
}

interface CircuitWire {
  id: number;             // Unique wire identifier
  name: string;           // Human-readable name (e.g., "pc", "acc", "z_flag")
  width: number;          // Bit width (1, 4, or 8 for Micro4)
  is_input: boolean;      // External input flag
  is_output: boolean;     // External output flag
  state: number[];        // Current bit values (0, 1, or 2 for undefined)
}

interface CircuitGate {
  id: number;             // Unique gate identifier
  name: string;           // Gate instance name (e.g., "DEC_HLT1", "ACC0")
  type: string;           // Gate type: AND, OR, NOT, BUF, DFF, XOR
  inputs: GatePort[];     // Input connections
  outputs: GatePort[];    // Output connections
  stored?: number;        // For DFF: stored value
}

interface GatePort {
  wire: number;           // Wire ID
  bit: number;            // Bit index on wire
}
```

### Gate Types in Micro4 Circuit

| Type | Count | Description |
|------|-------|-------------|
| AND | 52 | Logic AND gates |
| OR | 37 | Logic OR gates |
| NOT | 13 | Inverters |
| BUF | 23 | Buffers (wire connections) |
| DFF | 42 | D Flip-Flops (registers) |

### Key Wires (from circuit.json)

| Wire Name | Width | Purpose |
|-----------|-------|---------|
| pc | 8 | Program Counter |
| acc | 4 | Accumulator register |
| z_flag | 1 | Zero flag |
| ir | 8 | Instruction Register |
| mar | 8 | Memory Address Register |
| state | 3 | State machine state |
| opcode | 4 | Decoded opcode |
| alu_result | 4 | ALU output |

### Error Handling Pattern

```typescript
export class CircuitLoadError extends Error {
  constructor(
    message: string,
    public readonly path: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'CircuitLoadError';
  }
}

// Usage in CircuitLoader
async loadCircuit(path: string): Promise<CircuitData> {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new CircuitLoadError(
        `Failed to load circuit: ${response.status} ${response.statusText}`,
        path
      );
    }
    const data = await response.json();
    // Validate structure...
    return data as CircuitData;
  } catch (error) {
    if (error instanceof CircuitLoadError) throw error;
    throw new CircuitLoadError(
      'Failed to parse circuit JSON',
      path,
      error as Error
    );
  }
}
```

### Testing with Mock Fetch

```typescript
import { vi } from 'vitest';

describe('CircuitLoader', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('should parse valid circuit JSON', async () => {
    const mockData: CircuitData = {
      cycle: 0,
      stable: true,
      wires: [{ id: 0, name: 'test', width: 1, is_input: false, is_output: false, state: [0] }],
      gates: []
    };

    (global.fetch as vi.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData)
    });

    const loader = new CircuitLoader();
    const result = await loader.loadCircuit('/circuits/test.json');

    expect(result.wires).toHaveLength(1);
    expect(result.wires[0].name).toBe('test');
  });
});
```

### Related Files

| File | Relationship |
|------|--------------|
| `visualizer/circuit.json` | Source circuit data (copy to public/circuits/) |
| `src/visualizer/CircuitRenderer.ts` | Will consume CircuitModel for rendering |
| `src/visualizer/index.ts` | Export new classes |
| `hdl/04_micro4_cpu.m4hdl` | HDL source that generated the circuit |

### Previous Story Learnings (Story 6.1)

1. Use mount/updateState/destroy lifecycle pattern
2. Store bound handlers as class properties for cleanup
3. Use DEFAULT_BG_PRIMARY constant pattern for fallbacks
4. Add double-mount protection
5. Test zero-dimension edge cases
6. Follow CSS variable patterns for colors

### Future Integration Points

- **Story 6.3:** CircuitModel.getGatesByType() used to render gates by color
- **Story 6.4:** CircuitModel.getWire() used to determine wire signal states
- **Story 6.5:** CircuitData.cycle and gate states drive animation
- **Story 6.9-6.10:** CircuitModel enables code-to-circuit linking

### Accessibility Checklist

- [ ] **Keyboard Navigation** - N/A for data loading
- [ ] **ARIA Attributes** - N/A for data loading
- [ ] **Focus Management** - N/A for data loading
- [ ] **Color Contrast** - N/A for data loading
- [x] **XSS Prevention** - JSON.parse is safe; no user content
- [ ] **Screen Reader Announcements** - N/A for data loading

### Project Structure Notes

**Correct locations:**
- `src/visualizer/CircuitLoader.ts` - Fetch and validate circuit JSON
- `src/visualizer/CircuitModel.ts` - Indexed access to circuit data
- `src/visualizer/types.ts` - TypeScript interfaces
- `public/circuits/micro4-circuit.json` - Circuit data file

**Naming conventions:**
- Class files: PascalCase (`CircuitLoader.ts`, `CircuitModel.ts`)
- Type files: camelCase (`types.ts`)
- JSON files: kebab-case (`micro4-circuit.json`)

### References

- [Source: architecture.md#Visualization Patterns] - Canvas rendering conventions
- [Source: project-context.md#Error Handling Rules] - Error context requirements
- [Source: visualizer/circuit.json] - Existing circuit data structure
- [Source: hdl/04_micro4_cpu.m4hdl] - HDL source reference
- [Source: 6-1-create-canvas-circuit-renderer.md] - Previous story patterns

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None required - all tests pass.

### Completion Notes List

- All 2076 tests pass (81 visualizer tests: 40 CircuitRenderer, 26 CircuitModel, 15 CircuitLoader)
- CircuitLoader validates JSON structure for required fields
- CircuitModel provides O(1) lookups via Map data structures
- CircuitRenderer integrates loadCircuit() convenience method
- Existing circuit.json has 138 wires and 167 gates

### File List

- `public/circuits/micro4-circuit.json` - NEW - Copy of circuit data (138 wires, 167 gates)
- `src/visualizer/types.ts` - NEW - TypeScript interfaces (CircuitData, CircuitWire, CircuitGate, GatePort, GateType)
- `src/visualizer/CircuitLoader.ts` - NEW - Async circuit loading with validation and CircuitLoadError
- `src/visualizer/CircuitModel.ts` - NEW - Indexed data access with Maps for O(1) lookups
- `src/visualizer/CircuitRenderer.ts` - MODIFIED - Added circuitData state, loadCircuit(), getCircuitModel()
- `src/visualizer/index.ts` - MODIFIED - Exported new classes and types
- `src/visualizer/CircuitLoader.test.ts` - NEW - 15 tests for loading, errors, validation
- `src/visualizer/CircuitModel.test.ts` - NEW - 26 tests for maps and accessor methods
- `src/visualizer/CircuitRenderer.test.ts` - MODIFIED - Added 8 tests for circuit integration
