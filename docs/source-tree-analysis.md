# Source Tree Analysis

> Generated: 2026-01-20 | Scan Level: Exhaustive | Mode: Initial Scan

## Directory Structure Overview

```
cpu_ideas/
├── bin/                          # Compiled executables
├── docs/                         # Documentation (generated + authored)
├── hdl/                          # Hardware Description Language files
│   └── history/                  # Historical logic implementations
├── homework/                     # Educational exercises by CPU stage
│   ├── micro4/                   # 4-bit CPU exercises (5 files)
│   ├── micro8/                   # 8-bit CPU exercises (planned)
│   ├── micro16/                  # 16-bit CPU exercises (planned)
│   ├── micro32/                  # 32-bit CPU exercises (planned)
│   ├── micro32p/                 # Pipelined CPU exercises (planned)
│   └── micro32s/                 # Superscalar CPU exercises (planned)
├── literature/                   # Historical literature (planned)
├── logs/                         # Parallel development logs
├── programs/                     # Assembly test programs
│   ├── *.asm                     # Micro4 programs (12 files)
│   ├── micro8/                   # Micro8 programs (15 files)
│   └── micro16/                  # Micro16 programs (13 files)
├── reference/                    # Reference implementations
│   ├── micro4/                   # Micro4 reference
│   ├── micro8/                   # Micro8 reference
│   ├── micro16/                  # Micro16 reference
│   ├── micro32/                  # Micro32 reference (planned)
│   ├── micro32p/                 # Pipelined reference (planned)
│   └── micro32s/                 # Superscalar reference (planned)
├── src/                          # Source code
│   ├── micro4/                   # 4-bit CPU implementation
│   ├── micro8/                   # 8-bit CPU implementation
│   ├── micro16/                  # 16-bit CPU implementation
│   └── simulator/                # HDL circuit simulator
├── templates/                    # Educational starter templates
│   ├── micro4/                   # Micro4 templates + hints
│   ├── micro8/                   # Micro8 templates (planned)
│   ├── micro16/                  # Micro16 templates (planned)
│   ├── micro32/                  # Micro32 templates (planned)
│   ├── micro32p/                 # Pipelined templates (planned)
│   └── micro32s/                 # Superscalar templates (planned)
└── visualizer/                   # Web-based circuit visualization
    ├── engine/                   # Core simulation engine
    ├── modules/                  # UI view modules
    └── themes/                   # Visual themes
```

---

## Critical Directories

### `/src/` - CPU Emulator Source Code

The heart of the project. Each subdirectory contains a complete CPU toolchain.

#### `/src/micro4/` - 4-bit CPU (Complete)

| File | Lines | Purpose |
|------|-------|---------|
| `cpu.c` | ~400 | CPU emulator core (fetch-decode-execute) |
| `cpu.h` | ~80 | CPU state structure, API declarations |
| `assembler.c` | ~350 | Two-pass assembler |
| `assembler.h` | ~30 | Assembler API |
| `disasm.c` | ~419 | Standalone disassembler |
| `debugger.c` | ~350 | Interactive debugger (REPL) |
| `main.c` | ~180 | CLI entry point |
| `Makefile` | ~50 | Build configuration |

**Entry Point:** `main.c:main()` → parses args → loads program → runs CPU

#### `/src/micro8/` - 8-bit CPU (Functional)

| File | Lines | Purpose |
|------|-------|---------|
| `cpu.c` | ~924 | CPU emulator (~80 instructions) |
| `cpu.h` | ~150 | 8 registers, flags, 64KB memory |
| `assembler.c` | ~1,687 | Full assembler with macros |
| `assembler.h` | ~50 | Assembler API |
| `asm_main.c` | ~100 | Standalone assembler CLI |
| `disasm.c` | ~1,258 | Disassembler with address tracking |
| `debugger.c` | ~582 | Debugger with breakpoints |
| `main.c` | ~200 | CLI entry point |
| `Makefile` | ~60 | Build configuration |

**Entry Point:** `main.c:main()` → loads binary/asm → runs emulator

#### `/src/micro16/` - 16-bit CPU (Functional)

| File | Lines | Purpose |
|------|-------|---------|
| `cpu.c` | ~1,611 | CPU emulator (~120 instructions) |
| `cpu.h` | ~180 | Segments, 1MB addressing |
| `assembler.c` | ~1,443 | Assembler with segment support |
| `assembler.h` | ~60 | Assembler API |
| `asm_main.c` | ~100 | Standalone assembler CLI |
| `main.c` | ~200 | CLI entry point |
| `Makefile` | ~60 | Build configuration |

**Missing:** `disasm.c`, `debugger.c` (planned)

#### `/src/simulator/` - HDL Circuit Simulator

| File | Lines | Purpose |
|------|-------|---------|
| `circuit.c` | ~800 | Circuit graph, signal propagation |
| `circuit.h` | ~100 | Circuit data structures |
| `parser.c` | ~600 | M4HDL parser |
| `parser.h` | ~50 | Parser API |
| `main.c` | ~200 | CLI entry, JSON export |
| `Makefile` | ~40 | Build configuration |

**Entry Point:** `main.c:main()` → parses M4HDL → simulates → exports JSON

---

### `/hdl/` - Hardware Description Files

M4HDL files for gate-level CPU implementations.

| File | Lines | Purpose |
|------|-------|---------|
| `00_primitives.m4hdl` | ~100 | AND, OR, NOT, NAND, NOR, XOR |
| `01_adders.m4hdl` | ~150 | Half adder, full adder, ripple-carry |
| `02_flipflops.m4hdl` | ~200 | D flip-flop, SR latch, JK flip-flop |
| `03_alu.m4hdl` | ~300 | 4-bit ALU with all operations |
| `04_micro4_cpu.m4hdl` | ~400 | Complete Micro4 CPU |
| `05_micro8_cpu.m4hdl` | ~600 | Complete Micro8 CPU |
| `06_micro16_cpu.m4hdl` | ~750 | Complete Micro16 CPU |

#### `/hdl/history/` - Historical Implementations

| File | Era | Technology |
|------|-----|------------|
| `00_relay_logic.m4hdl` | 1940s | Electromagnetic relays (10-50 ops/sec) |
| `01_rtl_gates.m4hdl` | 1950s | Resistor-Transistor Logic |
| `02_ttl_gates.m4hdl` | 1960s | TTL 7400 series |
| `03_mos_gates.m4hdl` | 1970s | CMOS gates |

---

### `/programs/` - Assembly Test Programs

#### Root: Micro4 Programs (12 files)

| Program | Purpose |
|---------|---------|
| `add.asm` | Basic addition |
| `countdown.asm` | Loop with decrement |
| `fibonacci.asm` | Fibonacci sequence |
| `multiply.asm` | Software multiplication |
| `bubble_sort.asm` | Array sorting |
| `echo.asm` | I/O demonstration |
| ... | (6 more test programs) |

#### `/programs/micro8/` - 8-bit Programs (15 files)

| Program | Purpose |
|---------|---------|
| `basic_mov.asm` | Data movement instructions |
| `arithmetic.asm` | ADD, SUB, INC, DEC |
| `fibonacci.asm` | Fibonacci with registers |
| `calls.asm` | Subroutine calls/returns |
| `interrupts.asm` | Interrupt handling |
| `string_ops.asm` | String manipulation |
| ... | (9 more test programs) |

#### `/programs/micro16/` - 16-bit Programs (13 files)

| Program | Purpose |
|---------|---------|
| `basic_mov.asm` | MOV with segments |
| `arithmetic.asm` | 16-bit arithmetic |
| `segments.asm` | Segment switching |
| `multiply.asm` | Hardware MUL/DIV |
| `interrupts.asm` | Protected interrupts |
| ... | (8 more test programs) |

---

### `/visualizer/` - Web Visualization Platform

Single-page application for circuit visualization and CPU state display.

| File/Dir | Purpose |
|----------|---------|
| `index.html` | Main entry (~1,900 lines) |
| `engine/` | Core simulation engine |
| `engine/types.js` | Wire states, gate types |
| `engine/wire.js` | Wire class |
| `engine/gate.js` | Gate class |
| `engine/circuit.js` | Circuit class |
| `engine/io.js` | Input/output handling |
| `engine/animation.js` | Electron flow animation |
| `engine/index.js` | Main entry, pre-built circuits |
| `modules/` | View components |
| `modules/gate-view.js` | Gate visualization |
| `modules/cpu-state-view.js` | Register/memory display |
| `modules/debugger-view.js` | Step/run/breakpoint controls |
| `themes/` | Visual themes (dark mode) |

**Features:**
- Gate simulation (NOT, AND, OR, NAND, NOR, XOR)
- Wire signal propagation with timing
- Electron flow animation
- X-Ray mode (internal transistor structure)
- Pre-built circuits (half adder, full adder, SR latch, D flip-flop)
- JSON import from HDL simulator

---

### `/templates/` - Educational Starter Templates

Scaffolding for students to implement CPUs incrementally.

#### `/templates/micro4/`

| Directory | Purpose |
|-----------|---------|
| `hdl/starter.m4hdl` | Minimal working ALU, rest as TODO |
| `hints/hint1_alu_concept.md` | ALU conceptual guide |
| `hints/hint2_alu_structure.md` | ALU structure guide |
| `hints/hint3_alu_implementation.md` | ALU implementation guide |
| `hints/hint4_control_concept.md` | Control unit concept |
| `hints/hint5_control_implementation.md` | Control unit implementation |
| `expected/` | Expected test outputs |

#### Other Stages (Planned)

| Directory | Status |
|-----------|--------|
| `templates/micro8/` | Empty (planned) |
| `templates/micro16/` | Empty (planned) |
| `templates/micro32/` | Empty (planned) |
| `templates/micro32p/` | Empty (planned) |
| `templates/micro32s/` | Empty (planned) |

---

### `/homework/` - Optimization Exercises

Progressive exercises teaching CPU optimization concepts.

#### `/homework/micro4/` - 5 Exercises

| Exercise | Focus |
|----------|-------|
| `01_add_inc_dec.md` | Add INC/DEC instructions |
| `02_add_zero_flag.md` | Add zero flag and JNZ |
| `03_add_carry_flag.md` | Add carry flag for multi-precision |
| `04_add_shift_rotate.md` | Add shift and rotate |
| `05_add_multiply.md` | Add hardware multiply |

#### Other Stages (Planned)

| Directory | Count | Status |
|-----------|-------|--------|
| `homework/micro8/` | 8 | Planned |
| `homework/micro16/` | 10 | Planned |
| `homework/micro32/` | 12 | Planned |
| `homework/micro32p/` | 10 | Planned |
| `homework/micro32s/` | 8 | Planned |

---

### `/docs/` - Documentation

| File | Purpose |
|------|---------|
| `PROJECT_STATUS.md` | Complete project status (479 lines) |
| `development_plan.md` | High-level development roadmap |
| `incremental_cpu_design.md` | CPU architecture evolution |
| `micro4_minimal_architecture.md` | Micro4 specification |
| `micro8_isa.md` | Micro8 ISA specification (~1,024 lines) |
| `optimization_homework.md` | 90 optimization exercises |
| `historical_homework.md` | 80 historical computing exercises |
| `cpu_history_timeline.md` | CPU evolution 1971-2004 |
| `hardware_description_format.md` | M4HDL reference |
| `tutorial_logic_block.md` | Logic block tutorial |

---

## Integration Points

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Assembler     │────▶│    Emulator     │────▶│    Debugger     │
│  (src/*/asm*.c) │     │  (src/*/cpu.c)  │     │ (src/*/debug.c) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Test Programs  │     │   HDL Simulator │────▶│   Visualizer    │
│   (programs/)   │     │ (src/simulator/)│     │  (visualizer/)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │   HDL Files     │
                        │    (hdl/)       │
                        └─────────────────┘
```

### Data Flow

1. **Assembly → Binary:** `assembler.c` reads `.asm` → produces binary
2. **Binary → Execution:** `cpu.c` loads binary → fetch-decode-execute
3. **HDL → Simulation:** `parser.c` reads `.m4hdl` → `circuit.c` simulates
4. **Simulation → Visualization:** `main.c` exports JSON → `visualizer/` renders

---

## File Statistics

| Category | Count | Lines |
|----------|-------|-------|
| C Source Files | 18 | ~12,160 |
| C Header Files | 9 | ~1,200 |
| HDL Files | 11 | ~2,500 |
| Assembly Programs | 40 | ~2,000 |
| Documentation (MD) | 23 | ~4,500 |
| JavaScript (Visualizer) | 8 | ~1,900 |
| HTML | 1 | ~1,900 |
| **Total** | **~110** | **~26,000** |

---

## Build Artifacts

| Directory | Contents |
|-----------|----------|
| `bin/` | Compiled executables (micro4, micro8, micro16, m4sim) |
| `logs/` | Parallel development session logs |
| `*.o` (in src/*/) | Object files (not committed) |
