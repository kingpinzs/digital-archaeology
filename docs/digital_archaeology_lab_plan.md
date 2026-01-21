# Digital Archaeology Lab - Interactive Learning Platform

## Vision
A browser-based single-page application that takes you on a journey through computing history - from basic logic gates through integrated circuits to CPUs to complete systems. Like nand2tetris, but:
- **Goes further** - not stuck at 16-bit, progresses to 32-bit superscalar
- **Shows WHY** - historical context for each innovation
- **Lab-focused** - experiment, break things, understand through doing
- **Expandable** - architecture designed to grow

---

## Platform Architecture

### Layer Progression (Bottom-Up)
```
Layer 5: COMPUTER SYSTEM
         └─ Peripherals, I/O, Operating System concepts
              |
Layer 4: CPU ARCHITECTURE
         └─ Micro4 → Micro8 → Micro16 → Micro32 → Pipeline → Superscalar
              |
Layer 3: INTEGRATED CIRCUITS
         └─ ALU, Registers, Memory, Decoders, Multiplexers
              |
Layer 2: LOGIC GATES
         └─ AND, OR, NOT, NAND, NOR, XOR, Flip-Flops
              |
Layer 1: FUNDAMENTALS
         └─ Binary, Boolean Algebra, Truth Tables, Timing
```

### SPA Structure
```
┌──────────────────────────────────────────────────────────────────┐
│  DIGITAL ARCHAEOLOGY LAB                          [Progress] [?] │
├────────────┬─────────────────────────────────────────────────────┤
│            │                                                     │
│  JOURNEY   │              MAIN WORKSPACE                         │
│  ────────  │                                                     │
│  ▸ Binary  │   ┌─────────────────────────────────────────────┐   │
│  ▸ Gates   │   │                                             │   │
│    AND     │   │         INTERACTIVE CANVAS                  │   │
│    OR      │   │                                             │   │
│    ...     │   │   [Gate/Circuit/CPU Visualization]          │   │
│  ▸ ICs     │   │                                             │   │
│    ALU     │   │                                             │   │
│    ...     │   └─────────────────────────────────────────────┘   │
│  ▸ Micro4  │                                                     │
│    ★ BUILD │   ┌──────────────┐  ┌──────────────────────────┐   │
│    ★ TEST  │   │   LESSON     │  │   CONSOLE / OUTPUT       │   │
│  ▸ Micro8  │   │   PANEL      │  │                          │   │
│  ▸ Micro16 │   │              │  │   > Running add.asm      │   │
│  ▸ Micro32 │   │  "The ALU    │  │   > A = 0x7              │   │
│  ▸ Pipeline│   │   was born   │  │   > Cycles: 23           │   │
│  ▸ Super-  │   │   out of..." │  │   > HALTED               │   │
│    scalar  │   │              │  │                          │   │
│            │   └──────────────┘  └──────────────────────────┘   │
└────────────┴─────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Core Platform (Micro4 Focus)
**Deliverable:** Single-page app with navigation, lesson system, and lab workspace

#### 1.1 Create Platform Shell
**File:** `lab/index.html` (main SPA entry point)

```
lab/
├── index.html           # Main SPA shell
├── app.js               # Core application logic
├── styles.css           # Platform styling
├── components/
│   ├── navigation.js    # Left sidebar journey tree
│   ├── workspace.js     # Main interactive canvas
│   ├── lesson-panel.js  # Lesson content renderer
│   └── console.js       # Output/debug console
├── lessons/
│   ├── 01-binary/       # Binary fundamentals
│   ├── 02-gates/        # Logic gates
│   ├── 03-circuits/     # Integrated circuits
│   └── 04-micro4/       # Micro4 CPU
└── labs/
    ├── gate-builder.js  # Drag-and-drop gate canvas
    ├── circuit-sim.js   # IC simulation
    └── cpu-sim.js       # CPU emulation (wrap existing)
```

#### 1.2 Integrate Existing Tools
Reuse and wrap existing visualizer modules:
- `visualizer/engine/` → Core simulation engine
- `visualizer/modules/gate-view.js` → Gate animations
- `visualizer/modules/cpu-state-view.js` → CPU state display
- `visualizer/modules/debugger-view.js` → Step/run controls

#### 1.3 Lesson Content Structure
Each lesson follows: **CONTEXT → CONCEPT → LAB → CHALLENGE**

```json
{
  "id": "micro4-alu",
  "title": "Building the ALU",
  "era": "1960s",
  "context": "As programs grew more complex, manually computing with gates became impractical. Engineers needed a single unit that could perform multiple operations...",
  "concepts": [
    { "type": "text", "content": "The ALU (Arithmetic Logic Unit) combines..." },
    { "type": "diagram", "src": "alu-block.svg" },
    { "type": "interactive", "component": "alu-explorer" }
  ],
  "lab": {
    "type": "build",
    "starter": "templates/micro4/hdl/starter.m4hdl",
    "goal": "Complete the 4-bit adder",
    "tests": ["alu_tests.txt"]
  },
  "challenge": {
    "title": "Make it faster",
    "description": "Your ripple-carry adder works but is slow. Research 'carry-lookahead' and see if you can reduce the critical path."
  }
}
```

---

### Phase 2: Micro4 Journey Content

#### 2.1 Fundamentals Track (Lessons 1-10)
| # | Lesson | Era | Lab Activity |
|---|--------|-----|--------------|
| 1 | Binary: The Language of Machines | 1940s | Convert numbers, see bit patterns |
| 2 | Boolean Algebra: Math for Circuits | 1850s | Truth tables, simplification |
| 3 | The AND Gate | 1900s | Build from relays/transistors |
| 4 | OR, NOT, and Universality | 1900s | Derive all gates from NAND |
| 5 | Combining Gates: Half Adder | 1940s | Build your first arithmetic circuit |
| 6 | The Full Adder | 1940s | Handle carry propagation |
| 7 | Memory: The SR Latch | 1940s | Store a single bit |
| 8 | Registers: Groups of Latches | 1950s | Build a 4-bit register |
| 9 | The Clock: Synchronizing Everything | 1950s | Timing and edge-triggering |
| 10 | The Von Neumann Architecture | 1945 | Why fetch-decode-execute? |

#### 2.2 Micro4 Build Track (Lessons 11-20)
| # | Lesson | Focus | Lab Activity |
|---|--------|-------|--------------|
| 11 | Meet Micro4: The Simplest CPU | Overview | Tour the architecture |
| 12 | The Program Counter | Control | Build 8-bit counter |
| 13 | Instruction Register & Decoder | Control | Decode opcodes |
| 14 | Building the ALU | Datapath | Complete starter.m4hdl TODOs 1-3 |
| 15 | The Accumulator | Datapath | Connect ALU to register |
| 16 | Memory Interface | System | Read/write operations |
| 17 | The Control Unit | Integration | State machine for execution |
| 18 | Your First Program | Software | Write and run add.asm |
| 19 | The Debugger | Tools | Step through, set breakpoints |
| 20 | Testing Your CPU | Verification | Pass all test programs |

#### 2.3 Micro4 Optimize Track (Lessons 21-25) - YOUR EXERCISES
| # | Lesson | Challenge | Expected Output File |
|---|--------|-----------|---------------------|
| 21 | Add INC/DEC Instructions | Extend ISA | `ex01_inc_dec.txt` |
| 22 | Add Zero Flag Variations | JNZ instruction | `ex02_zero_flag.txt` |
| 23 | Add Carry Flag | Multi-precision math | `ex03_carry_flag.txt` |
| 24 | Add Shift/Rotate | Bit manipulation | `ex04_shift_rotate.txt` |
| 25 | Add Hardware Multiply | Complex operations | `ex05_multiply.txt` |

---

### Phase 3: Expected Outputs & Verification

**Directory:** `lab/expected/micro4/`

| File | Purpose |
|------|---------|
| `alu_tests.json` | ALU test vectors with expected results |
| `cpu_tests.json` | Full instruction set verification |
| `programs/*.expected` | Expected output for each test program |
| `ex01_inc_dec.json` | Exercise 01 verification |
| `ex02_zero_flag.json` | Exercise 02 verification |
| `ex03_carry_flag.json` | Exercise 03 verification |
| `ex04_shift_rotate.json` | Exercise 04 verification |
| `ex05_multiply.json` | Exercise 05 verification |

Format:
```json
{
  "test": "ADD 3 + 4",
  "inputs": { "a": "0011", "b": "0100", "op": "add" },
  "expected": { "result": "0111", "zero": false, "carry": false },
  "explanation": "3 + 4 = 7, no overflow"
}
```

---

### Phase 4: Future Expansion Hooks

The architecture supports adding:

```
lab/lessons/
├── 05-micro8/        # 8-bit: registers, stack, 80 ops
├── 06-micro16/       # 16-bit: segmentation, interrupts
├── 07-micro32/       # 32-bit: protected mode, paging
├── 08-pipeline/      # 5-stage pipeline, hazards
├── 09-superscalar/   # Multiple issue, branch prediction
└── 10-system/        # I/O, peripherals, OS concepts
```

Each stage answers a historical question:
- **Micro8**: "Why did we need more registers?"
- **Micro16**: "Why did we need memory segmentation?"
- **Micro32**: "Why did we need memory protection?"
- **Pipeline**: "Why did we need pipelining?"
- **Superscalar**: "Why did we need multiple execution units?"

---

### Phase 5: "Build It Real" Hardware Track (OPTIONAL)

At the end of each era, learners can optionally build physical hardware. This is completely optional - the software simulation path is always sufficient.

#### Hardware Progression by Era

| Era | Technology | What You Build | Estimated Cost |
|-----|------------|----------------|----------------|
| 1940s | Relays | 4-bit adder from SPDT relays | $30-50 |
| 1950s | Discrete Transistors | Logic gates, flip-flops | $20-40 |
| 1960s | TTL ICs (7400 series) | Full Micro4 CPU on breadboard | $50-80 |
| 1970s | CMOS ICs (4000 series) | Low-power Micro4 | $40-60 |
| Modern | FPGA | Micro4 → Micro32 on Lattice/Xilinx | $25-150 |

#### Build It Real Lesson Structure

```
lab/lessons/04-micro4/hardware/
├── 00-overview.json         # Which path to choose?
├── 01-relay-gates.json      # Build AND/OR/NOT from relays
├── 02-relay-adder.json      # 4-bit adder (educational, slow!)
├── 03-ttl-gates.json        # 7400 series basics
├── 04-ttl-alu.json          # 74181 ALU chip exploration
├── 05-ttl-micro4.json       # Full CPU on breadboard
├── 06-fpga-intro.json       # What is an FPGA?
├── 07-fpga-micro4.json      # Synthesize your HDL to real hardware
└── 08-fpga-testing.json     # Connect to PC, run real programs
```

#### Bill of Materials (BOM) System

Each hardware lesson includes:
```json
{
  "id": "ttl-micro4",
  "title": "Build Micro4 with TTL Chips",
  "optional": true,
  "difficulty": "intermediate",
  "time": "8-12 hours",
  "bom": [
    { "part": "74LS00", "qty": 4, "desc": "Quad NAND gate", "price": 0.50 },
    { "part": "74LS04", "qty": 2, "desc": "Hex inverter", "price": 0.40 },
    { "part": "74LS181", "qty": 1, "desc": "4-bit ALU", "price": 2.50 },
    { "part": "74LS173", "qty": 3, "desc": "4-bit register", "price": 1.00 },
    { "part": "74LS161", "qty": 2, "desc": "4-bit counter", "price": 0.80 },
    { "part": "Breadboard", "qty": 2, "desc": "830-point", "price": 5.00 },
    { "part": "Wire kit", "qty": 1, "desc": "Jumper wires", "price": 8.00 }
  ],
  "total_cost": "$45-60",
  "suppliers": ["DigiKey", "Mouser", "Amazon", "AliExpress"],
  "pcb_option": {
    "available": true,
    "gerbers": "hardware/micro4-ttl/gerbers.zip",
    "jlcpcb_cost": "$15 for 5 boards"
  }
}
```

#### FPGA Path (Recommended for Micro8+)

For larger CPUs, FPGA becomes practical:

| Board | Price | Suitable For |
|-------|-------|--------------|
| Lattice iCEstick | $25 | Micro4 |
| TinyFPGA BX | $38 | Micro4, Micro8 |
| iCEBreaker | $70 | Micro4-Micro16 |
| Arty A7-35T | $130 | Micro4-Micro32, Pipeline |
| DE10-Nano | $150 | Full superscalar |

#### Hardware Track UI

In the SPA, hardware lessons are marked with a 🔧 icon and clearly labeled optional:

```
├── Lesson 20: Testing Your CPU ✓
├── ─────────────────────────────
├── 🔧 BUILD IT REAL (Optional)
│   ├── Path A: Relay Logic ($30)
│   ├── Path B: TTL Breadboard ($50)
│   └── Path C: FPGA ($25-150)
├── ─────────────────────────────
└── Continue to Micro8 →
```

#### Integration with Software Simulation

The key insight: **HDL you write in simulation runs on real FPGA unchanged**

```
[Software Lab]                    [Hardware Lab]
     |                                  |
Write HDL in browser    ──────►   Download .m4hdl file
     |                                  |
Simulate in JavaScript  ──────►   Synthesize with Yosys
     |                                  |
See gates animate       ──────►   Program FPGA
     |                                  |
Run test programs       ──────►   Run same programs on real CPU!
```

#### Hardware Lesson Content Example

```json
{
  "id": "relay-and-gate",
  "title": "Build an AND Gate from Relays",
  "era": "1940s",
  "context": "Before transistors, computers like the Harvard Mark I used electromechanical relays. Let's build the same logic they used.",
  "materials": {
    "relays": "2x SPDT 5V relay",
    "power": "5V DC supply or 4xAA batteries",
    "led": "1x LED + 330Ω resistor",
    "misc": "Breadboard, wire"
  },
  "steps": [
    {
      "title": "Understanding the Relay",
      "content": "A relay is an electrically-controlled switch...",
      "diagram": "relay-anatomy.svg",
      "video": "relay-demo.mp4"
    },
    {
      "title": "Wiring the AND Gate",
      "content": "Connect the relays in SERIES so both must be energized...",
      "schematic": "relay-and-schematic.svg",
      "photo": "relay-and-breadboard.jpg"
    },
    {
      "title": "Test Your Gate",
      "content": "Apply inputs and verify the truth table...",
      "interactive": "truth-table-checker"
    }
  ],
  "reflection": "Notice the clicking sound? That's the speed limit of relay computers - about 10-50 operations per second. The ENIAC's designers chose vacuum tubes specifically to eliminate this bottleneck."
}

---

## Files to Create

### Core Platform
| File | Size | Description |
|------|------|-------------|
| `lab/index.html` | 3KB | SPA shell with layout |
| `lab/app.js` | 5KB | Core app logic, routing, state |
| `lab/styles.css` | 4KB | Platform styling |
| `lab/components/navigation.js` | 3KB | Journey tree sidebar |
| `lab/components/workspace.js` | 4KB | Main canvas area |
| `lab/components/lesson-panel.js` | 3KB | Lesson content renderer |
| `lab/components/console.js` | 2KB | Output console |

### Labs (Integrate Existing)
| File | Size | Description |
|------|------|-------------|
| `lab/labs/gate-builder.js` | 5KB | Wrap visualizer/engine |
| `lab/labs/circuit-sim.js` | 4KB | IC-level simulation |
| `lab/labs/cpu-sim.js` | 3KB | Wrap Micro4 emulator via WASM or JS port |

### Lessons (Content)
| File | Size | Description |
|------|------|-------------|
| `lab/lessons/01-binary/lesson.json` | 2KB | Binary fundamentals |
| `lab/lessons/02-gates/lesson.json` | 3KB | Logic gates |
| ... | ... | (10 more fundamentals) |
| `lab/lessons/04-micro4/01-overview.json` | 2KB | Micro4 introduction |
| ... | ... | (15 more Micro4 lessons) |

### Expected Outputs
| File | Size | Description |
|------|------|-------------|
| `lab/expected/micro4/alu_tests.json` | 2KB | ALU verification |
| `lab/expected/micro4/cpu_tests.json` | 3KB | CPU verification |
| `lab/expected/micro4/ex01-05.json` | 3KB | Exercise verification |

### Hardware Track (Optional)
| File | Size | Description |
|------|------|-------------|
| `lab/lessons/04-micro4/hardware/00-overview.json` | 2KB | Path selection guide |
| `lab/lessons/04-micro4/hardware/01-relay-gates.json` | 4KB | Relay logic basics |
| `lab/lessons/04-micro4/hardware/03-ttl-gates.json` | 4KB | 7400 series intro |
| `lab/lessons/04-micro4/hardware/05-ttl-micro4.json` | 6KB | Full TTL build guide |
| `lab/lessons/04-micro4/hardware/07-fpga-micro4.json` | 5KB | FPGA synthesis guide |
| `hardware/micro4-ttl/schematic.pdf` | - | TTL circuit schematic |
| `hardware/micro4-ttl/gerbers.zip` | - | PCB manufacturing files |
| `hardware/micro4-ttl/bom.csv` | 1KB | Bill of materials |
| `hardware/micro4-fpga/micro4.v` | 3KB | Verilog for synthesis |
| `hardware/micro4-fpga/constraints/*.pcf` | 1KB | Pin constraints per board |

---

## Verification

### 1. Platform Works
```bash
# Serve locally and verify navigation
cd lab && python -m http.server 8080
# Open http://localhost:8080
# - Sidebar navigation works
# - Lessons load and render
# - Labs are interactive
```

### 2. Gate Lab Works
- Build AND gate from transistors
- See truth table update live
- Combine gates to make XOR

### 3. Micro4 Lab Works
- Load a program (add.asm)
- Step through execution
- See registers/memory update
- Watch gate-level activity

### 4. Exercises Self-Check
- Complete exercise 01
- Run verification against expected output
- Get pass/fail feedback

### 5. Historical Context Present
- Each lesson shows era (1940s, 1950s, etc.)
- "Why was this invented?" is answered
- Progression makes sense

---

## Summary

**What you're getting:**
1. Browser-based single-page app (not markdown)
2. Journey from gates → ICs → CPU → system
3. Historical "why" at every step
4. Hands-on labs where YOU build and optimize
5. Self-checking exercises with expected outputs
6. Architecture ready to expand to 32-bit and beyond
7. **Optional "Build It Real" track** - relays, TTL, FPGA at each era

**Inspired by nand2tetris but:**
- Goes beyond 16-bit
- Shows historical progression
- More hands-on lab focus
- Expandable architecture
- **Can build physical hardware** (optional)
