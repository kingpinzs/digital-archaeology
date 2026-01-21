# Technology Stack

> Generated: 2026-01-20 | Scan Level: Exhaustive

## Overview

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Core Language** | C | C99 | CPU emulators, assemblers, disassemblers, debuggers |
| **Build System** | Make | GNU Make | Build automation |
| **Compiler** | GCC | System default | C compilation |
| **Frontend** | HTML5 + Vanilla JS | ES6+ | Circuit visualization web platform |
| **HDL** | M4HDL (custom) | 1.0 | Hardware description language for gate-level design |

---

## Backend: CPU Emulators (C)

### Compiler Configuration

| Setting | Value | Purpose |
|---------|-------|---------|
| Standard | `-std=c99` | Modern C with inline comments, mixed declarations |
| Warnings | `-Wall -Wextra` | Strict warning levels |
| Debug | `-g` | Debug symbols for GDB |
| Optimization | `-O2` | Balanced optimization |

### Build Artifacts

| Component | Binary | Source Files | Lines |
|-----------|--------|--------------|-------|
| **Micro4** | | | |
| Emulator | `micro4` | main.c, cpu.c, assembler.c | ~1,100 |
| Disassembler | `disasm` | disasm.c | ~419 |
| Debugger | `micro4-dbg` | debugger.c, cpu.c, assembler.c | ~1,200 |
| **Micro8** | | | |
| Emulator | `micro8` | main.c, cpu.c, debugger.c | ~1,700 |
| Assembler | `micro8-asm` | asm_main.c, assembler.c | ~1,700 |
| Disassembler | `micro8-disasm` | disasm.c | ~1,258 |
| Debugger | `micro8-dbg` | debugger.c, cpu.c | ~1,500 |
| **Micro16** | | | |
| Emulator | `micro16` | main.c, cpu.c | ~1,900 |
| Assembler | `micro16-asm` | asm_main.c, assembler.c | ~1,700 |
| **Simulator** | | | |
| HDL Simulator | `m4sim` | main.c, circuit.c, parser.c | ~1,960 |

### Dependencies

**External:** None - pure C standard library only
- `<stdio.h>` - I/O operations
- `<stdlib.h>` - Memory allocation
- `<string.h>` - String manipulation
- `<stdint.h>` - Fixed-width integers (uint8_t, uint16_t)
- `<stdbool.h>` - Boolean type

**Internal:** Header files define module interfaces
- `cpu.h` - CPU emulator interface
- `assembler.h` - Assembler interface
- `debugger.h` - Debugger interface
- `circuit.h` - HDL simulator interface

### Build Commands

```bash
# Build a specific component
cd src/micro4 && make          # Builds micro4, disasm, micro4-dbg
cd src/micro8 && make          # Builds micro8, micro8-asm, micro8-disasm, micro8-dbg
cd src/micro16 && make         # Builds micro16, micro16-asm
cd src/simulator && make       # Builds m4sim

# Install to bin/
make install

# Run tests
make test         # Quick sanity test
make test-all     # All test programs (Micro8)

# Clean build artifacts
make clean
```

---

## Frontend: Circuit Visualizer (JavaScript)

### Technology Choices

| Technology | Rationale |
|------------|-----------|
| **Vanilla JS** | No framework overhead, educational transparency, fast loading |
| **HTML5 Canvas** | High-performance 2D rendering for circuit animations |
| **ES6 Modules** | Clean code organization without build step |
| **CSS3** | Modern styling with dark theme |

### Architecture

```
visualizer/
├── index.html              # Main entry point (~1,900 lines)
├── engine/                 # Core simulation engine
│   ├── types.js            # Wire states, gate types
│   ├── wire.js             # Wire class
│   ├── gate.js             # Gate class
│   ├── circuit.js          # Circuit class
│   ├── io.js               # Input/output handling
│   ├── animation.js        # Electron flow animation
│   └── index.js            # Main entry, pre-built circuits
├── modules/                # View components
│   ├── gate-view.js        # Gate visualization
│   ├── cpu-state-view.js   # Register/memory display
│   └── debugger-view.js    # Step/run/breakpoint controls
└── themes/                 # Visual themes
```

### Features

| Feature | Implementation |
|---------|---------------|
| Gate Simulation | NOT, AND, OR, NAND, NOR, XOR |
| Wire Propagation | Signal propagation with timing |
| Animation | Electron flow visualization |
| X-Ray Mode | Internal transistor structure |
| Pre-built Circuits | Half adder, full adder, SR latch, D flip-flop |
| JSON Import | Load circuits from HDL simulator exports |

---

## HDL: M4HDL (Custom Language)

### Purpose

Custom hardware description language for educational gate-level design, simulated by `m4sim`.

### File Format

| Extension | Purpose |
|-----------|---------|
| `.m4hdl` | Hardware description source files |

### Language Features

| Feature | Syntax Example |
|---------|----------------|
| Module Definition | `module half_adder(a, b : sum, carry)` |
| Wire Declaration | `wire [7:0] data;` (bus notation) |
| Gate Instantiation | `and g1(a, b, out);` |
| Module Instantiation | `full_adder fa0(a[0], b[0], cin, s[0], c0);` |
| Comments | `// single line` or `/* multi-line */` |

### Library Hierarchy

```
hdl/
├── 00_primitives.m4hdl     # Basic gates (AND, OR, NOT, etc.)
├── 01_adders.m4hdl         # Half/full adder, ripple-carry
├── 02_flipflops.m4hdl      # D flip-flop, SR latch
├── 03_alu.m4hdl            # 4-bit ALU
├── 04_micro4_cpu.m4hdl     # Complete Micro4 CPU
├── 05_micro8_cpu.m4hdl     # Complete Micro8 CPU
├── 06_micro16_cpu.m4hdl    # Complete Micro16 CPU
└── history/                # Historical implementations
    ├── 00_relay_logic.m4hdl    # 1940s relay logic
    ├── 01_rtl_gates.m4hdl      # 1950s RTL
    ├── 02_ttl_gates.m4hdl      # 1960s TTL
    └── 03_mos_gates.m4hdl      # 1970s CMOS
```

---

## Architecture Patterns

### CPU Emulator Pattern

All CPU emulators follow the same pattern:

```c
// cpu.h - Interface
typedef struct {
    uint8_t accumulator;    // Register file
    uint8_t pc;             // Program counter
    uint8_t memory[256];    // Memory array
    uint8_t flags;          // Status flags
    bool halted;            // Halt flag
} CPU;

void cpu_init(CPU *cpu);
void cpu_reset(CPU *cpu);
int cpu_step(CPU *cpu);     // Execute one instruction
int cpu_run(CPU *cpu);      // Run until halt
```

### Assembler Pattern

```c
// assembler.h - Interface
typedef struct {
    char *label;
    int address;
} Label;

int assemble(const char *source, uint8_t *output, int max_size);
int assemble_file(const char *filename, uint8_t *output, int max_size);
```

### Debugger Pattern

```c
// debugger.h - Interface
void debugger_init(CPU *cpu);
void debugger_run(CPU *cpu);       // Interactive REPL
void debugger_step(CPU *cpu);      // Single step
void debugger_set_breakpoint(CPU *cpu, uint8_t addr);
```

---

## Development Environment

### Prerequisites

| Requirement | Purpose |
|-------------|---------|
| GCC (any recent version) | C compilation |
| GNU Make | Build automation |
| Modern browser | Visualizer (Chrome/Firefox/Safari) |
| Text editor | Source editing |

### Recommended Tools

| Tool | Purpose |
|------|---------|
| VS Code | Primary editor (project has .vscode/ config) |
| GDB | C debugging |
| Python 3 | Local web server for visualizer (`python -m http.server`) |

### No External Dependencies

This project intentionally has **zero external dependencies**:
- No npm packages
- No package managers
- No frameworks
- Pure C standard library
- Pure vanilla JavaScript

This design choice ensures:
- Easy setup on any system with a C compiler
- Educational transparency (all code is readable)
- Long-term stability (no dependency rot)
- Fast build times

---

## Future Technology Plans

Per the vision documents:

| Feature | Technology | Status |
|---------|------------|--------|
| Web Platform SPA | Vanilla JS + Canvas | Visualizer exists, needs integration |
| Code Editor | Custom (era-constrained) | Planned |
| Progress Tracking | LocalStorage | Planned |
| Hardware Track | Verilog synthesis (optional) | Planned |
