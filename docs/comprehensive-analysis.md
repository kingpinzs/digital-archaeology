# Comprehensive Analysis

> Generated: 2026-01-20 | Scan Level: Exhaustive | Mode: Initial Scan

## Overview

This document provides a deep analysis of the Digital Archaeology codebase based on the project type (embedded/CLI) and documentation requirements.

---

## CPU Architecture Analysis

### Micro4 (4-bit CPU)

| Specification | Value |
|--------------|-------|
| Data Width | 4-bit (nibble) |
| Address Space | 8-bit (256 nibbles) |
| Registers | 1 accumulator |
| Flags | Zero only |
| Instructions | 16 opcodes |
| Architecture | Accumulator-based |

**Instruction Set:**

| Opcode | Mnemonic | Description |
|--------|----------|-------------|
| 0x0 | HLT | Halt execution |
| 0x1 | LDA | Load accumulator from memory |
| 0x2 | STA | Store accumulator to memory |
| 0x3 | ADD | Add memory to accumulator |
| 0x4 | SUB | Subtract memory from accumulator |
| 0x5 | JMP | Unconditional jump |
| 0x6 | JZ | Jump if zero flag set |
| 0x7 | LDI | Load immediate (4-bit value) |
| 0x8 | AND | Bitwise AND with memory |
| 0x9 | OR | Bitwise OR with memory |
| 0xA | XOR | Bitwise XOR with memory |
| 0xB | NOT | Complement accumulator |
| 0xC | SHL | Shift left |
| 0xD | SHR | Shift right |
| 0xE | INC | Increment accumulator |
| 0xF | DEC | Decrement accumulator |

**CPU State Structure:**
```c
typedef struct {
    uint8_t pc;         // Program Counter (8-bit)
    uint8_t a;          // Accumulator (4-bit)
    bool    z;          // Zero flag
    uint8_t ir;         // Instruction Register
    uint8_t mar;        // Memory Address Register
    uint8_t mdr;        // Memory Data Register
    uint8_t memory[256];// Memory (nibbles)
    bool    halted;     // Halt state
    uint64_t cycles;    // Statistics
    uint64_t instructions;
} Micro4CPU;
```

---

### Micro8 (8-bit CPU)

| Specification | Value |
|--------------|-------|
| Data Width | 8-bit |
| Address Space | 16-bit (64KB) |
| Registers | 8 GP (R0-R7) + SP + PC |
| Register Pairs | BC (R1:R2), DE (R3:R4), HL (R5:R6) |
| Flags | Zero, Carry, Sign, Overflow |
| Instructions | ~80 opcodes |
| Stack | Memory-based with SP |
| Interrupts | Single level with EI/DI |

**Memory Map:**
```
0x0000-0x00FF  Zero Page (fast access)
0x0100-0x01FD  Stack Area (grows downward)
0x01FE-0x01FF  Interrupt Vector
0x0200-0xFFFF  General Purpose RAM/ROM
```

**Addressing Modes (8):**
1. Implicit - `NOP`
2. Register - `INC R0`
3. Immediate - `LDI R0, #0x42`
4. Direct - `LD R0, [0x1234]`
5. Zero Page - `LDZ R0, [0x50]`
6. Indirect - `LD R0, [HL]`
7. Indexed - `LD R0, [HL+5]`
8. Relative - `JR loop`

**Instruction Categories:**

| Category | Count | Examples |
|----------|-------|----------|
| Data Movement | 18 | MOV, LD, ST, PUSH, POP, LDI16 |
| Arithmetic | 16 | ADD, ADC, SUB, SBC, INC, DEC, CMP, NEG |
| Logic | 12 | AND, OR, XOR, NOT, SHL, SHR, ROL, ROR |
| Control Flow | 18 | JMP, JR, Jcc, CALL, RET, RETI |
| Stack | 6 | PUSH, POP, PUSH16, POP16, PUSHF, POPF |
| System | 10 | NOP, HLT, EI, DI, IN, OUT, SWAP |

---

### Micro16 (16-bit CPU)

| Specification | Value |
|--------------|-------|
| Data Width | 16-bit |
| Address Space | 20-bit (1MB via segmentation) |
| Registers | 8 × 16-bit GP (AX, BX, CX, DX, SI, DI, BP, R7) |
| Segments | CS, DS, SS, ES |
| Flags | Zero, Carry, Sign, Overflow, Direction, Interrupt, Trap, Parity |
| Instructions | ~120 opcodes |
| Multiply/Divide | Hardware support |
| String Ops | MOVS, CMPS, SCAS, STOS |

**Segmentation:**
- Physical Address = (Segment << 4) + Offset
- Each segment can address 64KB
- Total addressable: 1MB

**Memory Map:**
```
0x00000-0x003FF  Interrupt Vector Table (256 × 4 bytes)
0x00400-0xEFFFF  General Purpose
0xF0000-0xFFFFF  Memory-Mapped I/O
```

---

## Hardware Description (HDL) Analysis

### M4HDL Language

The project uses a custom hardware description language (M4HDL) for educational gate-level design.

**Language Features:**
| Feature | Syntax |
|---------|--------|
| Module definition | `module name(inputs : outputs)` |
| Wire declaration | `wire [7:0] data;` (bus notation) |
| Gate instantiation | `and g1(a, b, out);` |
| Module instantiation | `full_adder fa0(a[0], b[0], cin, s[0], c0);` |

**HDL Library Hierarchy:**

| File | Purpose | Complexity |
|------|---------|------------|
| `00_primitives.m4hdl` | Basic gates (AND, OR, NOT) | Low |
| `01_adders.m4hdl` | Half adder, full adder, ripple-carry | Medium |
| `02_flipflops.m4hdl` | D flip-flop, SR latch | Medium |
| `03_alu.m4hdl` | 4-bit ALU | High |
| `04_micro4_cpu.m4hdl` | Complete Micro4 CPU | High |
| `05_micro8_cpu.m4hdl` | Complete Micro8 CPU | Very High |
| `06_micro16_cpu.m4hdl` | Complete Micro16 CPU | Very High |

**Micro4 HDL Block Diagram:**
```
+------------------------------------------------------------------+
|                         MICRO4 CPU                               |
|                                                                  |
|   +--------+    +--------+    +--------+                        |
|   |   PC   |    |   IR   |    |   A    |                        |
|   | 8-bit  |    | 8-bit  |    | 4-bit  |                        |
|   +---+----+    +---+----+    +---+----+                        |
|       |             |             |                              |
|       v             v             v                              |
|   +--------+    +--------+    +--------+                        |
|   |  MAR   |    | DECODE |    |  ALU   |                        |
|   | 8-bit  |    |        |    | 4-bit  |                        |
|   +---+----+    +---+----+    +---+----+                        |
|       |             |             |                              |
|       v             v             v                              |
|   +--------+    +--------+    +--------+                        |
|   |  MDR   |<-->|CONTROL |    |   Z    |                        |
|   | 4-bit  |    | UNIT   |    |  flag  |                        |
|   +--------+    +--------+    +--------+                        |
+------------------------------------------------------------------+
```

---

## Historical Implementations

The project includes gate-level implementations across different eras of computing:

| File | Era | Technology | Key Features |
|------|-----|------------|--------------|
| `00_relay_logic.m4hdl` | 1940s | Electromagnetic relays | SPDT switches, slow (10-50 ops/sec) |
| `01_rtl_gates.m4hdl` | 1950s | Resistor-Transistor Logic | Faster, but high power |
| `02_ttl_gates.m4hdl` | 1960s | TTL 7400 series | Standard digital logic |
| `03_mos_gates.m4hdl` | 1970s | CMOS gates | Low power, scalable |

---

## Test Program Analysis

### Assembly Language Syntax

**Micro4 Assembly:**
```asm
; Comment
label:  LDA address    ; Load accumulator
        ADD value      ; Arithmetic
        JZ  target     ; Conditional jump
        HLT            ; Halt
```

**Micro8 Assembly (more advanced):**
```asm
        .org 0x0200             ; Set origin
FIB_MAX .equ 13                 ; Define constant

START:  LDI16 SP, 0x01FD        ; Initialize stack
        LDI R0, 1               ; Immediate load
        CALL SUM_FIBS           ; Subroutine call
        RET                     ; Return
```

### Test Coverage

| Category | Micro4 | Micro8 | Micro16 |
|----------|--------|--------|---------|
| Basic Operations | add.asm | basic_mov.asm | basic_mov.asm |
| Arithmetic | multiply.asm | arithmetic.asm | arithmetic.asm |
| Control Flow | countdown.asm | jumps.asm | jumps.asm |
| Loops | fibonacci.asm | fibonacci.asm | - |
| Subroutines | - | calls.asm | calls.asm |
| Interrupts | - | interrupts.asm | interrupts.asm |
| Advanced | bubble_sort.asm | string_ops.asm | segments.asm |
| **Total** | 12 | 15 | 13 |

---

## Entry Points

| Component | Entry Point | Purpose |
|-----------|-------------|---------|
| Micro4 Emulator | `src/micro4/main.c:main()` | CLI entry, arg parsing |
| Micro4 Debugger | `src/micro4/debugger.c:debugger_run()` | Interactive debugging |
| Micro8 Emulator | `src/micro8/main.c:main()` | CLI entry, arg parsing |
| Micro8 Assembler | `src/micro8/asm_main.c:main()` | Assembly CLI |
| Micro16 Emulator | `src/micro16/main.c:main()` | CLI entry, arg parsing |
| HDL Simulator | `src/simulator/main.c:main()` | M4HDL simulation |
| Visualizer | `visualizer/index.html` | Web UI entry |

---

## Code Patterns

### Error Handling Pattern

All components use a consistent error handling pattern:

```c
typedef struct {
    // ...state...
    bool    error;          // Error occurred flag
    char    error_msg[128]; // Human-readable error
} CPU;

// Functions return error code or -1 on error
int cpu_step(CPU *cpu) {
    if (cpu->error) return -1;
    // ...execute...
    return cycles_used;
}
```

### Debugging Pattern

All CPUs expose internal state for debugging:

```c
void cpu_dump_state(const CPU *cpu);   // Print all registers
void cpu_dump_memory(const CPU *cpu, uint16_t start, uint16_t end);
const char* cpu_disassemble(uint8_t opcode, uint8_t operand);
```

---

## Integration Points

### Emulator → Assembler
- Assembler outputs binary format
- Emulator loads binary via `cpu_load_program()`

### Emulator → Debugger
- Debugger wraps CPU state
- Uses `cpu_step()` for single-stepping
- Accesses memory/registers directly

### HDL → Visualizer
- Simulator exports JSON circuit data
- Visualizer imports and renders gates
- Animation shows signal propagation

---

## Findings Summary

| Metric | Value |
|--------|-------|
| Total C Source Lines | ~12,160 |
| Total C Header Lines | ~1,200 |
| Total HDL Lines | ~2,500 |
| Total Assembly Programs | 40 |
| CPU Architectures | 3 (Micro4, Micro8, Micro16) |
| Instructions (Total) | ~216 (16+80+120) |
| Addressing Modes | 8 (Micro8) |
| Historical Implementations | 4 |
