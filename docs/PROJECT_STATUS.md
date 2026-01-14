# Digital Archaeology - Complete Project Status

## Quick Start

```bash
# Install recommended plugin for autonomous agents
claude plugin add ralph-wiggum

# Build current components
cd src/micro4 && make        # 4-bit CPU emulator
cd src/micro8 && make        # 8-bit CPU emulator (partial)
cd src/simulator && make     # HDL circuit simulator

# Run tests
cd src/micro4 && make test

# Use parallel development
/cpt:quick "Complete Micro8 toolchain"
```

---

## Project Vision

Build CPUs incrementally from 4-bit to 32-bit superscalar, learning **why** each feature was invented through hands-on implementation.

```
Stage 1: Micro4    (4-bit)   ──► Stage 2: Micro8    (8-bit)
         4004-like                        8080-like
         ✅ COMPLETE                      ⚠️ IN PROGRESS

Stage 3: Micro16   (16-bit)  ──► Stage 4: Micro32   (32-bit)
         8086-like                        386-like
         ❌ NOT STARTED                   ❌ NOT STARTED

Stage 5: Micro32-P (32-bit)  ──► Stage 6: Micro32-S (32-bit)
         486-like (pipelined)             Pentium-like (superscalar)
         ❌ NOT STARTED                   ❌ NOT STARTED
```

---

## Stage 1: Micro4 (4-bit) - ✅ COMPLETE

### Specifications
| Feature | Value |
|---------|-------|
| Data width | 4-bit |
| Address space | 8-bit (256 nibbles) |
| Registers | 1 accumulator |
| Stack | None (minimal) |
| Flags | Zero only |
| Instructions | 16 opcodes |
| Gate count | ~425 (minimal) |

### Instruction Set
```
0x0 HLT  - Halt execution
0x1 LDA  - Load accumulator from memory
0x2 STA  - Store accumulator to memory
0x3 ADD  - Add memory to accumulator
0x4 SUB  - Subtract memory from accumulator
0x5 JMP  - Unconditional jump
0x6 JZ   - Jump if zero
0x7 LDI  - Load immediate (4-bit)
0x8 AND  - Bitwise AND with memory
0x9 OR   - Bitwise OR with memory
0xA XOR  - Bitwise XOR with memory
0xB NOT  - Complement accumulator
0xC SHL  - Shift left
0xD SHR  - Shift right
0xE INC  - Increment accumulator
0xF DEC  - Decrement accumulator
```

### Implementation Status
| Component | File | Lines | Status |
|-----------|------|-------|--------|
| CPU Emulator | src/micro4/cpu.c | 383 | ✅ Complete |
| CPU Header | src/micro4/cpu.h | 84 | ✅ Complete |
| Assembler | src/micro4/assembler.c | 461 | ✅ Complete |
| Disassembler | src/micro4/disasm.c | 419 | ✅ Complete |
| Debugger | src/micro4/debugger.c | 395 | ✅ Complete |
| Main CLI | src/micro4/main.c | 252 | ✅ Complete |
| HDL Design | hdl/04_micro4_cpu.m4hdl | 312 | ⚠️ Partial |

### Test Programs (12)
```
programs/add.asm              - Basic addition
programs/all_instructions.asm - All 16 opcodes
programs/bitwise_test.asm     - AND, OR, XOR, NOT
programs/bubble_sort.asm      - Sorting algorithm
programs/countdown.asm        - Loop with DEC/JZ
programs/divide.asm           - Division via subtraction
programs/factorial.asm        - Factorial calculation
programs/fibonacci.asm        - Fibonacci sequence
programs/gcd.asm              - Greatest common divisor
programs/max.asm              - Find maximum
programs/multiply.asm         - Multiplication via addition
programs/negative.asm         - Signed number handling
```

---

## Stage 2: Micro8 (8-bit) - ⚠️ IN PROGRESS

### Specifications
| Feature | Value |
|---------|-------|
| Data width | 8-bit |
| Address space | 16-bit (64KB) |
| Registers | 8 general purpose (R0-R7) |
| Register pairs | BC, DE, HL |
| Stack | Memory-based with SP |
| Flags | Zero, Carry, Sign, Overflow |
| Instructions | ~80 opcodes |
| Interrupts | Single level |
| Gate count | ~2,500 |

### Memory Map
```
0x0000-0x00FF  Zero Page (fast access, single-byte addressing)
0x0100-0x01FD  Stack Area (grows downward)
0x01FE-0x01FF  Interrupt Vector
0x0200-0xFFFF  General Purpose RAM/ROM
```

### Addressing Modes (8)
1. Implicit - `NOP`
2. Register - `INC R0`
3. Immediate - `LDI R0, #0x42`
4. Direct - `LD R0, [0x1234]`
5. Zero Page - `LDZ R0, [0x50]`
6. Indirect - `LD R0, [HL]`
7. Indexed - `LD R0, [HL+5]`
8. Relative - `JR loop`

### Instruction Categories (~80 total)
| Category | Count | Examples |
|----------|-------|----------|
| Data Movement | 18 | MOV, LD, ST, PUSH, POP, LDI16 |
| Arithmetic | 16 | ADD, ADC, SUB, SBC, INC, DEC, CMP, NEG |
| Logic | 12 | AND, OR, XOR, NOT, SHL, SHR, ROL, ROR |
| Control Flow | 18 | JMP, JR, Jcc, CALL, RET, RETI |
| Stack | 6 | PUSH, POP, PUSH16, POP16, PUSHF, POPF |
| System | 10 | NOP, HLT, EI, DI, IN, OUT, SWAP |

### Implementation Status
| Component | File | Lines | Status |
|-----------|------|-------|--------|
| ISA Spec | docs/micro8_isa.md | 1024 | ✅ Complete |
| CPU Emulator | src/micro8/cpu.c | 618 | ⚠️ ~25% (20/80 opcodes) |
| CPU Header | src/micro8/cpu.h | 118 | ✅ Complete |
| Main CLI | src/micro8/main.c | 237 | ✅ Complete |
| Assembler | src/micro8/assembler.c | - | ❌ Missing |
| Disassembler | src/micro8/disasm.c | - | ❌ Missing |
| Debugger | src/micro8/debugger.c | - | ❌ Missing |
| Test Programs | programs/micro8/ | - | ❌ Missing |
| HDL Design | hdl/05_micro8_cpu.m4hdl | - | ❌ Missing |

### Currently Implemented Opcodes
```
✅ NOP, HLT
✅ MOV_RR, MOV_RI, MOV_RM, MOV_MR
✅ ADD_RR, ADD_RI, SUB_RR, SUB_RI
✅ PUSH, POP
✅ JMP, JZ, JNZ, JC, JNC, CALL, RET
```

### Missing Opcodes (to implement)
```
❌ LDZ, STZ (zero page)
❌ LD [HL], ST [HL], LD [HL+d], ST [HL+d]
❌ LDI16 (16-bit immediate)
❌ ADC, SBC (with carry)
❌ INC, DEC (8-bit)
❌ INC16, DEC16, ADD16 (16-bit)
❌ CMP, CMPI
❌ NEG
❌ AND, OR, XOR, NOT
❌ ANDI, ORI, XORI
❌ SHL, SHR, SAR, ROL, ROR
❌ JS, JNS, JO, JNO (sign/overflow jumps)
❌ JR, JRZ, JRNZ, JRC, JRNC (relative jumps)
❌ JP HL (indirect jump)
❌ PUSH16, POP16, PUSHF, POPF
❌ RETI
❌ EI, DI
❌ SCF, CCF, CMF
❌ IN, OUT
❌ SWAP
```

---

## Stage 3: Micro16 (16-bit) - ❌ NOT STARTED

### Planned Specifications
| Feature | Value |
|---------|-------|
| Data width | 16-bit |
| Address space | 20-bit (1MB) via segmentation |
| Registers | 8 × 16-bit GP + 4 segment registers |
| Segments | CS, DS, SS, ES |
| Interrupts | Vectored (256 vectors) |
| Instructions | ~150 |

### New Concepts to Implement
- Memory segmentation (segment:offset addressing)
- Hardware multiply/divide
- String operations (MOVS, CMPS, SCAS, STOS)
- Instruction prefixes (REP, LOCK)
- Microcode-based control unit
- Instruction prefetch queue

### Required Components
- [ ] ISA specification (docs/micro16_isa.md)
- [ ] CPU emulator (src/micro16/cpu.c)
- [ ] Assembler (src/micro16/assembler.c)
- [ ] Disassembler (src/micro16/disasm.c)
- [ ] Debugger (src/micro16/debugger.c)
- [ ] Test programs (programs/micro16/)
- [ ] HDL design (hdl/06_micro16_cpu.m4hdl)

---

## Stage 4: Micro32 (32-bit) - ❌ NOT STARTED

### Planned Specifications
| Feature | Value |
|---------|-------|
| Data width | 32-bit |
| Address space | 32-bit (4GB) flat addressing |
| Modes | Real, Protected, Virtual 8086 |
| Protection | Rings 0-3 |
| Memory | Paging with TLB (4KB pages) |
| Instructions | ~300 |

### New Concepts to Implement
- Protected mode with privilege rings
- Paging unit with TLB
- Control registers (CR0-CR3)
- Debug registers (DR0-DR7)
- Descriptor tables (GDT, LDT, IDT)
- Task state segments
- Gate descriptors

---

## Stage 5: Micro32-P (Pipelined) - ❌ NOT STARTED

### Planned Specifications
| Feature | Value |
|---------|-------|
| Pipeline | 5-stage (Fetch-Decode-Execute-Memory-Writeback) |
| Cache | 8KB L1 (unified or split I/D) |
| FPU | Integrated floating-point |
| Performance | Most instructions = 1 CPI |

### New Concepts to Implement
- Pipeline hazard detection
- Data forwarding
- Pipeline stalls/bubbles
- Cache controller (MESI protocol)
- Floating-point operations (80-bit stack)

---

## Stage 6: Micro32-S (Superscalar) - ❌ NOT STARTED

### Planned Specifications
| Feature | Value |
|---------|-------|
| Pipelines | Dual-issue (U-pipe, V-pipe) |
| Cache | Separate 8KB I-cache and D-cache |
| Branch Prediction | BTB (Branch Target Buffer) |
| Data bus | 64-bit |
| Performance | 2 instructions per cycle (when pairable) |

### New Concepts to Implement
- Superscalar execution
- Instruction pairing rules
- Branch prediction
- Speculative execution hooks
- Performance counters

---

## HDL Simulator

### M4HDL Components
```
hdl/00_primitives.m4hdl   - Basic gates (AND, OR, NOT, etc.)
hdl/01_adders.m4hdl       - Half/full adder, ripple-carry
hdl/02_flipflops.m4hdl    - D flip-flop, SR latch
hdl/03_alu.m4hdl          - 4-bit ALU
hdl/04_micro4_cpu.m4hdl   - Micro4 CPU design
```

### Historical Logic Implementations
```
hdl/history/00_relay_logic.m4hdl  - Electromagnetic relays (1940s)
hdl/history/01_rtl_gates.m4hdl    - Resistor-Transistor Logic (1950s)
hdl/history/02_ttl_gates.m4hdl    - TTL 7400 series (1960s)
hdl/history/03_mos_gates.m4hdl    - CMOS gates (1970s)
```

### Simulator Features
- Gate-level simulation
- Module hierarchy support
- Bus notation: `wire [7:0] data;`
- Step-by-step execution
- JSON export for visualization

---

## Educational Materials

### Optimization Homework (90 exercises)
See `docs/optimization_homework.md`

| Category | Topic | Count |
|----------|-------|-------|
| A | ALU Enhancements | 18 |
| B | Register Enhancements | 7 |
| C | Addressing Modes | 6 |
| D | Control Flow | 10 |
| E | Memory Enhancements | 5 |
| F | Performance | 7 |
| G | Instruction Encoding | 3 |
| H | System Features | 7 |

Difficulty ranges from ⭐ (Easy) to ⭐⭐⭐⭐⭐ (Expert)

### Historical Homework (80 exercises)
See `docs/historical_homework.md`

Traces computing evolution through 8 eras:
- Era 0-1: Mechanical/Relay (Babbage, Zuse Z3)
- Era 2: Vacuum tubes (ENIAC)
- Era 3: Transistors (TRADIC)
- Era 4: Integrated circuits (7400 TTL)
- Era 5: MOS technology (PMOS/NMOS/CMOS)
- Era 6: Calculator wars (Busicom → 4004)
- Era 7: Intel 4004
- Era 8: Evolution to 8008, 8080

---

## Parallel Development Protocol

### Detection Triggers
Automatically parallelize when:
- Feature has 3+ independent components
- User mentions: "parallelize", "spawn", "fork", "parallel"
- Task list contains `[P]` markers

### File Ownership (No Overlaps)
```
Agent 1: src/*/cpu.c, src/*/cpu.h        (emulator)
Agent 2: src/*/assembler.c, assembler.h  (assembler)
Agent 3: src/*/disasm.c                  (disassembler)
Agent 4: src/*/debugger.c, debugger.h    (debugger)
Agent 5: programs/*/*.asm                (test programs)
Agent 6: hdl/*.m4hdl                     (HDL designs)
Agent 7: docs/*.md                       (documentation)
```

### Commands
```
/cpt:init      - Initialize parallel development
/cpt:analyze   - Analyze codebase for parallel opportunities
/cpt:quick     - Quickly spawn parallel agents for a goal
/cpt:spawn     - Create worktree and spawn single agent
/cpt:list      - List active worktrees
/cpt:done      - Complete work, merge, cleanup
/cpt:parallel  - Spawn multiple agents from task list
```

### Monitoring
```bash
# Watch all agent logs
tail -f ../logs/*.log

# Check running processes
ps aux | grep "claude -p"

# Check completion status
for f in ../logs/*.log; do
  grep -q "completed\|error\|failed" "$f" && echo "$f: DONE" || echo "$f: RUNNING"
done
```

---

## Lines of Code Summary

### Current
| Directory | Lines | Status |
|-----------|-------|--------|
| src/micro4/ | 1,906 | ✅ Complete |
| src/micro8/ | 854 | ⚠️ 25% |
| src/simulator/ | 1,958 | ✅ Complete |
| **Total C** | **4,718** | |
| docs/ | ~4,500 | ✅ Comprehensive |
| hdl/ | ~1,500 | ⚠️ Partial |
| programs/ | ~300 | ✅ 12 programs |

### Estimated to Complete Micro8
| Component | Est. Lines |
|-----------|------------|
| Finish CPU (~60 opcodes) | ~400 |
| Assembler | ~600 |
| Disassembler | ~500 |
| Debugger | ~500 |
| Test programs (10-15) | ~400 |
| HDL implementation | ~1,000 |
| **Total** | **~3,400** |

---

## Next Steps

### 1. Install Plugin
```bash
claude plugin add ralph-wiggum
```

### 2. Complete Micro8 (Parallel)
```
/cpt:quick "Complete Micro8: assembler, disassembler, debugger, test programs"
```

This spawns 4 parallel agents:
- Agent 1: `src/micro8/assembler.c`
- Agent 2: `src/micro8/disasm.c`
- Agent 3: `src/micro8/debugger.c`
- Agent 4: `programs/micro8/*.asm`

### 3. Complete Micro8 CPU (Sequential)
Extend `src/micro8/cpu.c` to implement all 80 opcodes.

### 4. Future Stages
After Micro8 is complete:
1. Write Micro16 ISA specification
2. Implement Micro16 toolchain
3. Continue to Micro32, Micro32-P, Micro32-S

---

## Reference Documents

| Document | Path | Description |
|----------|------|-------------|
| Development Plan | docs/development_plan.md | High-level roadmap |
| Incremental Design | docs/incremental_cpu_design.md | Architecture evolution |
| Micro4 Architecture | docs/micro4_minimal_architecture.md | 4-bit CPU spec |
| Micro8 ISA | docs/micro8_isa.md | Complete 8-bit ISA (1024 lines) |
| Optimization HW | docs/optimization_homework.md | 90 enhancement exercises |
| Historical HW | docs/historical_homework.md | 80 history exercises |
| HDL Format | docs/hardware_description_format.md | M4HDL reference |
| CPU History | docs/cpu_history_timeline.md | 1971-2004 timeline |

---

*Last updated: 2026-01-14*
