# Incremental CPU Design: From 4-bit to Modern

## Core Concept

Instead of cloning historical CPUs exactly, design a **modular CPU architecture** that can be incrementally improved. Start simple (4004-level) and add features in stages.

This approach has major advantages:
- Learn CPU design progressively
- Each stage is a working, testable CPU
- Avoid historical baggage/backwards compatibility hacks
- Design for modularity from the start

---

## Development Stages

### Stage 1: Micro4 (4004-equivalent)
**Goal:** Minimal working CPU

| Feature | Spec |
|---------|------|
| Data width | 4-bit |
| Address space | 12-bit (4KB) |
| Registers | 16 x 4-bit |
| Stack | Hardware, 4-level |
| Clock | Single-cycle instructions |

**Instructions (~45):**
- Arithmetic: ADD, SUB, INC, DEC
- Logic: AND, OR, XOR, NOT
- Control: JMP, JZ, JNZ, CALL, RET
- Memory: LOAD, STORE
- I/O: IN, OUT

**Modules:**
```
┌─────────────────────────────────────┐
│            Control Unit             │
├──────────┬──────────┬───────────────┤
│   ALU    │ Register │    Program    │
│  (4-bit) │   File   │    Counter    │
├──────────┴──────────┴───────────────┤
│           Memory Interface          │
└─────────────────────────────────────┘
```

---

### Stage 2: Micro8 (8080-equivalent)
**Goal:** Expand to 8-bit, add useful addressing modes

| Upgrade | Change |
|---------|--------|
| Data width | 4-bit → **8-bit** |
| Address space | 12-bit → **16-bit (64KB)** |
| Registers | 8 x 8-bit general purpose |
| Stack | Memory-based, SP register |
| Flags | Zero, Carry, Sign, Overflow |

**New Features:**
- Register pairs for 16-bit operations
- Multiple addressing modes (immediate, direct, indirect, indexed)
- Interrupt support (single level)
- Expanded instruction set (~80 instructions)

**New Modules:**
```
┌─────────────────────────────────────────┐
│             Control Unit                │
├──────────┬──────────┬───────────────────┤
│   ALU    │ Register │  Interrupt Logic  │
│  (8-bit) │   File   │                   │
├──────────┼──────────┼───────────────────┤
│   Stack  │ Address  │     Program       │
│  Pointer │   Unit   │     Counter       │
├──────────┴──────────┴───────────────────┤
│            Memory Interface             │
└─────────────────────────────────────────┘
```

---

### Stage 3: Micro16 (8086-equivalent)
**Goal:** 16-bit data, segmented memory

| Upgrade | Change |
|---------|--------|
| Data width | 8-bit → **16-bit** |
| Address space | 16-bit → **20-bit (1MB)** via segments |
| Registers | 8 x 16-bit GP + 4 segment registers |
| Interrupts | Vectored (256 vectors) |

**New Features:**
- Segmentation (Code, Data, Stack, Extra)
- String operations (MOVS, CMPS, etc.)
- Hardware multiply/divide
- Prefix instructions (REP, LOCK)

**New Modules:**
```
┌─────────────────────────────────────────────────┐
│               Control Unit                      │
│          (with microcode ROM)                   │
├──────────┬──────────┬──────────┬────────────────┤
│   ALU    │ Register │ Segment  │  Interrupt     │
│ (16-bit) │   File   │   Unit   │  Controller    │
├──────────┼──────────┴──────────┼────────────────┤
│ Multiply │   Address           │   Prefetch     │
│  Divide  │   Generation        │     Queue      │
├──────────┴─────────────────────┴────────────────┤
│              Bus Interface Unit                 │
└─────────────────────────────────────────────────┘
```

---

### Stage 4: Micro32 (386-equivalent)
**Goal:** Full 32-bit, protected mode, paging

| Upgrade | Change |
|---------|--------|
| Data width | 16-bit → **32-bit** |
| Address space | **32-bit (4GB)** flat or segmented |
| Modes | Real, Protected, Virtual 8086 |
| Memory Management | Paging (4KB pages) |

**New Features:**
- Protection rings (0-3)
- Paging unit (TLB)
- Debug registers
- Control registers (CR0-CR3)
- Task switching hardware

**New Modules:**
```
┌─────────────────────────────────────────────────────────┐
│                  Control Unit                           │
│            (expanded microcode)                         │
├──────────┬──────────┬──────────┬──────────┬─────────────┤
│   ALU    │ Register │ Segment  │  Paging  │  Protection │
│ (32-bit) │   File   │   Unit   │   Unit   │    Unit     │
├──────────┼──────────┴──────────┼──────────┴─────────────┤
│ Multiply │   Address           │         TLB           │
│  Divide  │   Generation        │     (32 entry)        │
├──────────┼─────────────────────┼───────────────────────┤
│  Barrel  │    Prefetch         │      Debug            │
│  Shifter │      Queue          │      Unit             │
├──────────┴─────────────────────┴───────────────────────┤
│                  Bus Interface Unit                     │
└─────────────────────────────────────────────────────────┘
```

---

### Stage 5: Micro32-P (486-equivalent)
**Goal:** Pipeline, integrated cache and FPU

| Upgrade | Change |
|---------|--------|
| Pipeline | **5-stage** (Fetch, Decode, Execute, Memory, Writeback) |
| Cache | **8KB L1** (unified or split I/D) |
| FPU | Integrated floating-point unit |

**New Features:**
- Instruction pipeline (most instructions = 1 cycle)
- Cache controller with MESI protocol hooks
- FPU with 8 x 80-bit stack
- RISC-like internal optimizations

---

### Stage 6: Micro32-S (Pentium-equivalent)
**Goal:** Superscalar execution

| Upgrade | Change |
|---------|--------|
| Pipelines | **Dual issue** (U-pipe, V-pipe) |
| Cache | **Separate I-cache and D-cache** (8KB each) |
| Branch Prediction | **BTB** (Branch Target Buffer) |

**New Features:**
- Two instructions per cycle (when possible)
- Branch prediction reduces pipeline stalls
- 64-bit data bus
- Performance counters

---

## Modular Design Principles

### 1. Clean Interfaces
Each module communicates through well-defined buses:
```
┌────────┐    ┌────────┐    ┌────────┐
│ Module │◄──►│  Bus   │◄──►│ Module │
│   A    │    │        │    │   B    │
└────────┘    └────────┘    └────────┘
```

### 2. Replaceable ALU
Design ALU as a pluggable component:
```verilog
// Stage 1: 4-bit ALU
module alu_4bit(input [3:0] a, b, output [3:0] result);

// Stage 2: 8-bit ALU (drop-in replacement)
module alu_8bit(input [7:0] a, b, output [7:0] result);
```

### 3. Expandable Register File
```verilog
// Parameterized register file
module register_file #(
    parameter WIDTH = 8,      // 4, 8, 16, 32
    parameter DEPTH = 8       // number of registers
)(
    input [WIDTH-1:0] data_in,
    output [WIDTH-1:0] data_out,
    ...
);
```

### 4. Optional Modules
Features like paging, FPU, cache can be conditionally included:
```verilog
`ifdef ENABLE_PAGING
    paging_unit paging(...);
`endif

`ifdef ENABLE_FPU
    fpu_unit fpu(...);
`endif
```

---

## Implementation Options

### Option A: HDL (Verilog/VHDL)
- Run on FPGA
- Real hardware
- Best for final product

### Option B: Software Emulator
- Write in C/Rust
- Faster iteration
- Better debugging

### Option C: Hybrid
- Design in HDL
- Use Verilator to generate C++ simulator
- Test in software, deploy to FPGA

---

## Recommended Development Flow

```
┌─────────────────────────────────────────────────┐
│  1. Define ISA for current stage                │
├─────────────────────────────────────────────────┤
│  2. Write assembler/disassembler                │
├─────────────────────────────────────────────────┤
│  3. Implement in HDL or software                │
├─────────────────────────────────────────────────┤
│  4. Write test programs                         │
├─────────────────────────────────────────────────┤
│  5. Verify all instructions work                │
├─────────────────────────────────────────────────┤
│  6. Port small OS/monitor program               │
├─────────────────────────────────────────────────┤
│  7. Document everything                         │
├─────────────────────────────────────────────────┤
│  8. Move to next stage                          │
└─────────────────────────────────────────────────┘
```

---

## Why This Approach Works

1. **Each stage is complete** - You always have a working CPU
2. **Progressive complexity** - Learn one concept at a time
3. **No dead ends** - Design choices propagate forward
4. **Modern tooling** - Can use current HDL tools, FPGAs
5. **Educational value** - Understand *why* features were added historically
6. **Flexibility** - Can diverge from x86 where it makes sense

---

## Next Steps

1. [ ] Define Micro4 ISA in detail
2. [ ] Choose implementation platform (FPGA, emulator, or hybrid)
3. [ ] Set up development environment
4. [ ] Implement Micro4 core
5. [ ] Write basic assembler
6. [ ] Test with simple programs
