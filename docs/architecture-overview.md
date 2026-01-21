# Architecture Overview

> Generated: 2026-01-20 | Scan Level: Exhaustive | Mode: Initial Scan

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Digital Archaeology Platform                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│   │   Micro4    │    │   Micro8    │    │  Micro16    │    │  Micro32*   │ │
│   │   (4-bit)   │    │   (8-bit)   │    │  (16-bit)   │    │  (32-bit)   │ │
│   ├─────────────┤    ├─────────────┤    ├─────────────┤    ├─────────────┤ │
│   │ • Emulator  │    │ • Emulator  │    │ • Emulator  │    │ • Planned   │ │
│   │ • Assembler │    │ • Assembler │    │ • Assembler │    │             │ │
│   │ • Disasm    │    │ • Disasm    │    │ • Disasm*   │    │             │ │
│   │ • Debugger  │    │ • Debugger  │    │ • Debugger* │    │             │ │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └─────────────┘ │
│          │                  │                  │                           │
│          └────────────┬─────┴─────────────────┘                           │
│                       │                                                    │
│                       ▼                                                    │
│          ┌────────────────────────┐                                        │
│          │    HDL Simulator       │                                        │
│          │      (m4sim)           │                                        │
│          └───────────┬────────────┘                                        │
│                      │ JSON Export                                         │
│                      ▼                                                     │
│          ┌────────────────────────┐                                        │
│          │     Web Visualizer     │                                        │
│          │  (HTML5 Canvas + JS)   │                                        │
│          └────────────────────────┘                                        │
│                                                                             │
│   * = Planned/Incomplete                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### CPU Emulator Pattern

All CPU emulators follow a consistent architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                      CPU Component                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│   │   main.c    │───▶│   cpu.c     │◀───│ assembler.c │   │
│   │  (CLI/UI)   │    │  (Core)     │    │  (Parser)   │   │
│   └─────────────┘    └──────┬──────┘    └─────────────┘   │
│                             │                              │
│                             ▼                              │
│   ┌─────────────┐    ┌─────────────┐                      │
│   │  disasm.c   │◀───│ debugger.c  │                      │
│   │  (Decoder)  │    │   (REPL)    │                      │
│   └─────────────┘    └─────────────┘                      │
│                                                            │
└─────────────────────────────────────────────────────────────┘
```

### Core CPU State Structure

Each CPU maintains a consistent state structure:

```c
typedef struct {
    // Registers
    uint8_t  registers[N];      // General purpose registers
    uint16_t pc;                // Program counter
    uint16_t sp;                // Stack pointer (Micro8+)

    // Memory
    uint8_t  memory[SIZE];      // RAM

    // Flags
    uint8_t  flags;             // Status flags (Z, C, S, O)

    // Control
    bool     halted;            // Halt state
    bool     error;             // Error occurred
    char     error_msg[128];    // Error description

    // Statistics
    uint64_t cycles;            // Clock cycles
    uint64_t instructions;      // Instructions executed
} CPU;
```

### Fetch-Decode-Execute Cycle

```c
int cpu_step(CPU *cpu) {
    // 1. Fetch
    uint8_t opcode = cpu->memory[cpu->pc++];

    // 2. Decode
    switch (opcode >> 4) {  // Upper nibble = opcode
        case OP_ADD:
            // 3. Execute
            uint8_t operand = fetch_operand(cpu);
            cpu->a = cpu->a + operand;
            update_flags(cpu);
            break;
        // ...
    }

    return cycles_used;
}
```

---

## Data Flow

### Assembly to Execution

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  .asm file   │───▶│  Assembler   │───▶│  .bin file   │
│ (source code)│    │ (two-pass)   │    │   (binary)   │
└──────────────┘    └──────────────┘    └──────────────┘
                                               │
                                               ▼
                    ┌──────────────┐    ┌──────────────┐
                    │   Output     │◀───│   Emulator   │
                    │  (console)   │    │  (execute)   │
                    └──────────────┘    └──────────────┘
```

### HDL to Visualization

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ .m4hdl file  │───▶│   Parser     │───▶│Circuit Graph │
│(HDL source)  │    │  (lexer)     │    │  (in-memory) │
└──────────────┘    └──────────────┘    └──────────────┘
                                               │
                                               ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Visualizer  │◀───│  JSON Export │◀───│  Simulator   │
│   (Canvas)   │    │   (output)   │    │  (execute)   │
└──────────────┘    └──────────────┘    └──────────────┘
```

---

## CPU Evolution Architecture

### Micro4 (4-bit) - Intel 4004 Inspired

```
┌─────────────────────────────────────────────────┐
│                   MICRO4 CPU                     │
│                                                  │
│  ┌────────┐  ┌────────┐  ┌────────┐            │
│  │   PC   │  │   A    │  │   Z    │            │
│  │ 8-bit  │  │ 4-bit  │  │ flag   │            │
│  └────────┘  └────────┘  └────────┘            │
│       │           │           │                 │
│       ▼           ▼           ▼                 │
│  ┌─────────────────────────────────┐           │
│  │            ALU (4-bit)          │           │
│  └─────────────────────────────────┘           │
│                   │                             │
│                   ▼                             │
│  ┌─────────────────────────────────┐           │
│  │      Memory (256 nibbles)       │           │
│  └─────────────────────────────────┘           │
│                                                 │
│  • 16 instructions                              │
│  • Accumulator architecture                     │
│  • 8-bit addressing                             │
└─────────────────────────────────────────────────┘
```

### Micro8 (8-bit) - Intel 8080 Inspired

```
┌─────────────────────────────────────────────────┐
│                   MICRO8 CPU                     │
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │  R0  R1  R2  R3  R4  R5  R6  R7  SP  PC │   │
│  │  8-bit general purpose + stack + PC     │   │
│  └─────────────────────────────────────────┘   │
│       │                                         │
│       ▼                                         │
│  ┌────────┐  Register Pairs: BC, DE, HL        │
│  │ FLAGS  │  Z (zero), C (carry),              │
│  │ Z C S O│  S (sign), O (overflow)            │
│  └────────┘                                     │
│       │                                         │
│       ▼                                         │
│  ┌─────────────────────────────────┐           │
│  │          ALU (8-bit)            │           │
│  └─────────────────────────────────┘           │
│                   │                             │
│                   ▼                             │
│  ┌─────────────────────────────────┐           │
│  │       Memory (64KB)             │           │
│  │  0x0000-0x00FF Zero Page        │           │
│  │  0x0100-0x01FD Stack            │           │
│  │  0x01FE-0x01FF Interrupt Vector │           │
│  │  0x0200-0xFFFF General Purpose  │           │
│  └─────────────────────────────────┘           │
│                                                 │
│  • ~80 instructions                             │
│  • 8 addressing modes                           │
│  • Subroutine support (CALL/RET)               │
│  • Single-level interrupts                      │
└─────────────────────────────────────────────────┘
```

### Micro16 (16-bit) - Intel 8086 Inspired

```
┌─────────────────────────────────────────────────┐
│                  MICRO16 CPU                     │
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │  AX  BX  CX  DX  SI  DI  BP  R7        │   │
│  │  16-bit general purpose registers       │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │       CS   DS   SS   ES                 │   │
│  │       Segment Registers                  │   │
│  └─────────────────────────────────────────┘   │
│       │                                         │
│       ▼                                         │
│  ┌────────────────────────────────┐            │
│  │ FLAGS: Z C S O D I T P        │            │
│  │ Zero, Carry, Sign, Overflow,  │            │
│  │ Direction, Interrupt, Trap,   │            │
│  │ Parity                        │            │
│  └────────────────────────────────┘            │
│       │                                         │
│       ▼                                         │
│  ┌─────────────────────────────────┐           │
│  │    ALU (16-bit + MUL/DIV)      │           │
│  └─────────────────────────────────┘           │
│                   │                             │
│                   ▼                             │
│  ┌─────────────────────────────────┐           │
│  │ Memory (1MB via segmentation)   │           │
│  │ Physical = (Segment << 4) + Off │           │
│  │ 0x00000-0x003FF IVT (256×4)    │           │
│  │ 0x00400-0xEFFFF General        │           │
│  │ 0xF0000-0xFFFFF Memory-Mapped  │           │
│  └─────────────────────────────────┘           │
│                                                 │
│  • ~120 instructions                            │
│  • Hardware multiply/divide                     │
│  • String operations (MOVS, CMPS, etc.)        │
│  • Segment-based memory protection             │
└─────────────────────────────────────────────────┘
```

---

## HDL Architecture

### M4HDL Language Structure

```
┌────────────────────────────────────────────────┐
│                M4HDL Module                     │
├────────────────────────────────────────────────┤
│                                                │
│  module_name(inputs : outputs)                 │
│  {                                             │
│      wire declarations                         │
│      gate instantiations                       │
│      module instantiations                     │
│  }                                             │
│                                                │
└────────────────────────────────────────────────┘
```

### Gate Hierarchy

```
Level 0: Primitives
├── NOT, AND, OR, NAND, NOR, XOR

Level 1: Arithmetic
├── half_adder (AND, XOR)
├── full_adder (half_adder × 2, OR)
└── ripple_carry_adder (full_adder × N)

Level 2: Sequential
├── sr_latch (NOR × 2)
├── d_latch (NAND × 4)
└── d_flipflop (d_latch × 2)

Level 3: Functional Units
├── alu_4bit (adders, logic, mux)
├── register_file (d_flipflops)
└── decoder (AND gates)

Level 4: CPU
├── micro4_cpu (alu, register, decoder, control)
├── micro8_cpu (expanded)
└── micro16_cpu (expanded)
```

---

## Visualizer Architecture

### Component Structure

```
┌─────────────────────────────────────────────────┐
│                  Visualizer                      │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │              index.html                  │   │
│  │          (Main entry point)              │   │
│  └──────────────────┬──────────────────────┘   │
│                     │                           │
│          ┌──────────┴──────────┐               │
│          │                     │               │
│          ▼                     ▼               │
│  ┌───────────────┐    ┌───────────────┐       │
│  │    engine/    │    │   modules/    │       │
│  │               │    │               │       │
│  │ • types.js    │    │ • gate-view   │       │
│  │ • wire.js     │    │ • cpu-state   │       │
│  │ • gate.js     │    │ • debugger    │       │
│  │ • circuit.js  │    │               │       │
│  │ • io.js       │    └───────────────┘       │
│  │ • animation.js│                            │
│  │ • index.js    │                            │
│  └───────────────┘                            │
│                                                │
└─────────────────────────────────────────────────┘
```

### Rendering Pipeline

```
1. Load JSON circuit data
         │
         ▼
2. Parse gates and wires
         │
         ▼
3. Calculate layout
         │
         ▼
4. Render to Canvas
         │
         ▼
5. Animate signal propagation
         │
         ▼
6. Update on user interaction
```

---

## Platform Vision Architecture

Per `IMMERSIVE_PLATFORM_PLAN.md` and `digital_archaeology_lab_plan.md`:

### Learning Layers

```
Layer 5: System (Micro32-S)
├── Superscalar execution
├── Branch prediction
└── Out-of-order execution

Layer 4: CPU (Micro32)
├── Protected mode
├── Paging
└── Advanced interrupts

Layer 3: ICs (Micro16)
├── Segmentation
├── Hardware multiply
└── String operations

Layer 2: Gates (Micro8)
├── Registers
├── Stack
└── Subroutines

Layer 1: Fundamentals (Micro4)
├── Binary arithmetic
├── Basic gates
└── Accumulator model
```

### Persona-Based Learning

| Era | Persona | Challenge |
|-----|---------|-----------|
| 1837 | Ada Lovelace | First algorithm |
| 1940s | Alan Turing | Universal machine |
| 1940s | Konrad Zuse | Relay computers |
| 1970s | Federico Faggin | 4004 microprocessor |
| 1980s | Steve Wozniak | Personal computer |

---

## Integration Points

### Emulator ↔ Assembler

```c
// Assembler produces binary
int assemble_file(const char *filename, uint8_t *output, int max_size);

// Emulator loads binary
void cpu_load_program(CPU *cpu, uint8_t *program, int size);
```

### Emulator ↔ Debugger

```c
// Debugger controls execution
int cpu_step(CPU *cpu);              // Single instruction
int cpu_run(CPU *cpu);               // Until halt

// Debugger inspects state
void cpu_dump_state(const CPU *cpu);
void cpu_dump_memory(const CPU *cpu, uint16_t start, uint16_t end);
```

### HDL Simulator ↔ Visualizer

```json
// JSON export format
{
  "gates": [
    {"id": "g1", "type": "AND", "inputs": ["a", "b"], "output": "c"},
    ...
  ],
  "wires": [
    {"from": "g1.out", "to": "g2.in1"},
    ...
  ]
}
```

---

## Design Decisions

### Why Pure C?

1. **Educational transparency** - No hidden abstractions
2. **Portability** - Runs on any system with a C compiler
3. **No dependencies** - Zero external libraries
4. **Fast compilation** - Quick iteration cycles
5. **Historical accuracy** - CPUs were designed with similar constraints

### Why Vanilla JavaScript?

1. **No build step** - Open and run immediately
2. **Browser-native** - Works everywhere
3. **Framework-free** - All code is visible and understandable
4. **Educational** - Students can inspect and modify

### Why Custom HDL (M4HDL)?

1. **Simplicity** - Minimal syntax for educational clarity
2. **JSON export** - Easy visualization integration
3. **Incremental** - Build up from primitives
4. **Historical** - Mirrors how HDLs evolved
