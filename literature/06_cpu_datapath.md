# CPU Datapath: Putting It All Together

## Prerequisites

- Binary basics (see [01_binary_basics.md](01_binary_basics.md))
- Logic gates (see [02_logic_gates.md](02_logic_gates.md))
- Combinational logic (see [03_combinational_logic.md](03_combinational_logic.md))
- Sequential logic (see [04_sequential_logic.md](04_sequential_logic.md))
- ALU design (see [05_alu_design.md](05_alu_design.md))

## Learning Objectives

After completing this chapter, you will be able to:

1. Explain the major components of a CPU datapath
2. Describe how data flows between registers, ALU, and memory
3. Trace instruction execution through the datapath
4. Understand the fetch-decode-execute cycle
5. Design control signals for different instruction types
6. Build a complete single-cycle CPU datapath

---

## Introduction

We've learned about binary numbers, logic gates, adders, flip-flops, and ALUs. Now it's time to connect them into a working CPU.

The **datapath** is the collection of functional units (registers, ALU, memory) and the connections between them. It's the "plumbing" that moves data through the CPU. The **control unit** directs this flow by generating the right signals at the right time.

In this chapter, we'll design the datapath for the Micro4, our 4-bit CPU, and understand how each instruction flows through the hardware.

---

## Core Concepts

### 1. The Von Neumann Architecture

Almost all modern computers follow the Von Neumann model (1945):

```
┌─────────────────────────────────────────────────────────────┐
│                          CPU                                 │
│  ┌──────────────────┐    ┌──────────────────┐              │
│  │   Control Unit   │◄──►│     Datapath      │              │
│  │                  │    │  (ALU, Registers) │              │
│  └──────────────────┘    └──────────────────┘              │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               │ (Address Bus, Data Bus)
                               │
                               ▼
                 ┌─────────────────────────────┐
                 │           Memory            │
                 │  (Instructions and Data)    │
                 └─────────────────────────────┘
```

**Key characteristics:**
- Programs stored in memory (not hardwired)
- Instructions fetched sequentially (usually)
- CPU executes one instruction at a time
- Memory holds both instructions and data

### 2. CPU Registers

Registers are small, fast storage locations inside the CPU. They hold:
- Current instruction
- Data being processed
- Addresses being accessed
- Status flags

**Micro4 Registers:**

| Register | Bits | Purpose |
|----------|------|---------|
| PC | 8 | Program Counter—address of next instruction |
| IR | 8 | Instruction Register—current instruction |
| A | 4 | Accumulator—working register for calculations |
| MAR | 8 | Memory Address Register—address for memory access |
| MDR | 4 | Memory Data Register—data to/from memory |
| Z | 1 | Zero Flag—set when result is zero |

```
┌─────────────────────────────────────────────────────────┐
│                    Micro4 CPU                            │
│                                                          │
│  ┌────────┐  ┌────────┐  ┌────────┐                     │
│  │   PC   │  │   IR   │  │   A    │                     │
│  │ 8-bit  │  │ 8-bit  │  │ 4-bit  │                     │
│  └────────┘  └────────┘  └────────┘                     │
│                                                          │
│  ┌────────┐  ┌────────┐  ┌────────┐                     │
│  │  MAR   │  │  MDR   │  │   Z    │                     │
│  │ 8-bit  │  │ 4-bit  │  │ 1-bit  │                     │
│  └────────┘  └────────┘  └────────┘                     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 3. Buses

**Buses** are shared sets of wires that connect components. This reduces wiring complexity.

```
                    Data Bus (4 bits)
         ┌────────────┬─────────────┬────────────┐
         │            │             │            │
         ▼            ▼             ▼            ▼
    ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐
    │   A    │   │  MDR   │   │  ALU   │   │ Memory │
    └────────┘   └────────┘   └────────┘   └────────┘
```

**Types of buses:**
- **Address bus:** Carries memory addresses (8 bits in Micro4)
- **Data bus:** Carries data values (4 bits in Micro4)
- **Control bus:** Carries control signals (read/write, enable)

**Bus conflicts:** Only one component can *drive* a bus at a time. Multiple components can *read* from it.

### 4. The Fetch-Decode-Execute Cycle

Every instruction goes through this cycle:

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│    ┌─────────┐      ┌─────────┐      ┌─────────┐            │
│    │  FETCH  │ ───► │ DECODE  │ ───► │ EXECUTE │            │
│    └─────────┘      └─────────┘      └─────────┘            │
│                                             │                │
│         ▲                                   │                │
│         │                                   │                │
│         └───────────────────────────────────┘                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**FETCH:** Read the next instruction from memory
1. MAR ← PC (send PC to memory)
2. MDR ← Memory[MAR] (read instruction)
3. IR ← MDR (store in instruction register)
4. PC ← PC + instruction_length

**DECODE:** Interpret the instruction
1. Extract opcode from IR
2. Determine what operation to perform
3. Extract operand address (if any)

**EXECUTE:** Perform the operation
1. Read operands (from registers or memory)
2. Perform computation (in ALU)
3. Write result (to register or memory)
4. Update flags

### 5. Micro4 Instruction Format

The Micro4 uses simple 8-bit instructions:

```
┌───────────────────────────────────────────────┐
│  7   6   5   4  │  3   2   1   0              │
├────────────────┼────────────────────────────┤
│    Opcode      │    Operand Address          │
│   (4 bits)     │       (4 bits)              │
└───────────────────────────────────────────────┘

Note: Some instructions use a second byte for the full 8-bit address.
```

**Micro4 Instructions:**

| Opcode | Mnemonic | Description |
|--------|----------|-------------|
| 0000 | HLT | Halt execution |
| 0001 | LDA addr | Load A from memory |
| 0010 | STA addr | Store A to memory |
| 0011 | ADD addr | A = A + memory[addr] |
| 0100 | SUB addr | A = A - memory[addr] |
| 0101 | JMP addr | Jump to address |
| 0110 | JZ addr | Jump if Z flag set |
| 0111 | LDI imm | Load immediate value |

### 6. Micro4 Datapath

Here's the complete datapath:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           MICRO4 DATAPATH                                 │
│                                                                          │
│   ┌────────────────────────────────────────────────────────────────┐    │
│   │                        Control Unit                             │    │
│   │   (generates all control signals based on IR and state)         │    │
│   └───────────────────────────────────┬────────────────────────────┘    │
│                                       │ Control Signals                  │
│            ┌──────────────────────────┼──────────────────────┐          │
│            ▼                          ▼                      ▼          │
│                                                                          │
│   ┌─────────┐                    ┌─────────┐                            │
│   │   PC    │───────────────────►│   MAR   │───────────────────►[MEMORY]│
│   │ 8-bit   │◄───────────────────│ 8-bit   │                            │
│   └────┬────┘                    └─────────┘                            │
│        │                                                                 │
│        │ PC+1 or Jump addr       ┌─────────┐                            │
│        │                         │   MDR   │◄──────────────────[MEMORY] │
│        ▼                         │ 4-bit   │                            │
│   ┌─────────┐                    └────┬────┘                            │
│   │Addr Mux │                         │                                 │
│   └─────────┘                         ▼                                 │
│                                  ┌─────────┐                            │
│                            ┌────►│   IR    │                            │
│                            │     │ 8-bit   │                            │
│                            │     └────┬────┘                            │
│   ┌─────────┐              │          │ Opcode                          │
│   │    A    │◄─────────────┤          └───────────►[DECODE]             │
│   │ 4-bit   │──────────────┤                                            │
│   └────┬────┘              │     ┌─────────┐                            │
│        │                   │     │   ALU   │                            │
│        └──────────────────►├────►│ 4-bit   │                            │
│                            │     └────┬────┘                            │
│                            │          │                                 │
│        ┌───────────────────┴──────────┤                                 │
│        │                              ▼                                 │
│        │                         ┌─────────┐                            │
│        │                         │    Z    │                            │
│        │                         │ 1-bit   │                            │
│        │                         └─────────┘                            │
│        │                                                                 │
│        └───────────────────────────────────────────────────►[DATA OUT]  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 7. Control Signals

The control unit generates these signals to direct data flow:

| Signal | Effect When Active |
|--------|-------------------|
| PC_inc | Increment PC by 1 (or 2) |
| PC_load | Load PC from address bus (for jumps) |
| IR_load | Load IR from MDR |
| A_load | Load A from data mux output |
| MAR_load | Load MAR from address mux |
| MDR_load | Load MDR from memory |
| Mem_read | Read from memory at MAR address |
| Mem_write | Write MDR to memory at MAR address |
| ALU_op[1:0] | Select ALU operation |
| A_src | Select A input source (ALU result or MDR) |

### 8. Single-Cycle Execution

In a single-cycle design, each instruction completes in one clock cycle.

**Advantages:** Simple control logic
**Disadvantages:** Clock speed limited by slowest instruction

```
CLK: ____╱¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯╲____╱¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯╲____
          │◄───── Instruction 1 ─────►│◄───── Instruction 2 ─────►│
          │                           │                           │
          Fetch,Decode,Execute        Fetch,Decode,Execute
```

The Micro4 uses a **multi-cycle** design where each instruction takes multiple clock cycles, allowing simpler circuitry (shared resources).

### 9. Multi-Cycle Execution

In a multi-cycle design, each phase (fetch, decode, execute) takes one or more clock cycles.

**State Machine:**

```
┌───────┐     ┌───────┐     ┌───────┐     ┌───────┐
│ FETCH │────►│DECODE │────►│EXECUTE│────►│WRITEB │───┐
│  S0   │     │  S1   │     │  S2   │     │  S3   │   │
└───────┘     └───────┘     └───────┘     └───────┘   │
     ▲                                                 │
     └─────────────────────────────────────────────────┘
```

**Micro4 State Machine (simplified):**

```
S0 (FETCH1):  MAR ← PC, initiate memory read
S1 (FETCH2):  IR ← MDR, PC ← PC + 1
S2 (DECODE):  Decode opcode, set up operand fetch
S3 (FETCH_OP): MAR ← operand address, read memory
S4 (EXECUTE): Perform operation, update A and flags
S5 (WRITEBACK): Store result if needed
```

### 10. Tracing Instruction Execution

Let's trace through specific instructions:

#### LDA addr (Load Accumulator)

Load the value at memory address `addr` into register A.

```
Instruction: LDA 0x0F  (opcode: 0001, address: 0x0F)
Before: A=?, Memory[0x0F]=7

S0: MAR ← PC          ; MAR points to instruction
    Read Memory       ; Fetch instruction byte
S1: IR ← MDR          ; IR = 0x1F (0001 1111)
    PC ← PC + 1       ; Move to next instruction
S2: Decode IR         ; Opcode = 0001 = LDA
    ; Need full address, fetch second byte
S3: MAR ← PC          ; MAR points to address byte
    Read Memory
S4: IR[7:0] ← IR + MDR ; Complete address
    PC ← PC + 1
S5: MAR ← IR[operand] ; MAR = 0x0F
    Read Memory       ; Fetch data at address
S6: A ← MDR           ; A = 7
    Update Z flag     ; Z = 0 (result not zero)

After: A=7, Z=0
```

#### ADD addr (Add to Accumulator)

Add the value at memory address `addr` to register A.

```
Instruction: ADD 0x10  (opcode: 0011, address: 0x10)
Before: A=7, Memory[0x10]=3

S0-S4: Fetch instruction (similar to LDA)

S5: MAR ← operand address ; MAR = 0x10
    Read Memory            ; Fetch operand
S6: MDR ← Memory[0x10]    ; MDR = 3
S7: ALU_op ← ADD          ; Select addition
    A ← A + MDR           ; A = 7 + 3 = 10 = 0xA
    Update Z flag         ; Z = 0 (result not zero)

After: A=10 (0xA), Z=0
```

#### JZ addr (Jump if Zero)

Jump to address if Z flag is set.

```
Instruction: JZ 0x20  (opcode: 0110, address: 0x20)
Before: PC=0x05, Z=1

S0-S4: Fetch instruction

S5: Check Z flag
    If Z=1: PC ← 0x20    ; Take the jump
    If Z=0: (no change)  ; Don't jump, PC already incremented

After (Z=1): PC=0x20
After (Z=0): PC=0x06
```

### 11. The Control Unit

The control unit is a state machine that generates control signals based on:
- Current state
- Instruction opcode
- Status flags

**Implementation approaches:**

1. **Hardwired control:** Logic gates implement the state machine
   - Fast
   - Complex for many instructions
   - Difficult to modify

2. **Microprogrammed control:** A ROM stores control signals for each state
   - Flexible
   - Easier to debug and modify
   - Slightly slower

**Micro4 uses hardwired control** due to its simplicity.

**Control Signal Truth Table (partial):**

```
State | Opcode | Z | PC_inc | PC_load | IR_load | A_load | MAR_load | ...
------+--------+---+--------+---------+---------+--------+----------+----
S0    |  XXX   | X |   0    |    0    |    0    |   0    |    1     | ...
S1    |  XXX   | X |   1    |    0    |    1    |   0    |    0     | ...
S2    |  001   | X |   0    |    0    |    0    |   1    |    1     | ... (LDA)
S2    |  011   | X |   0    |    0    |    0    |   1    |    1     | ... (ADD)
S2    |  110   | 0 |   0    |    0    |    0    |   0    |    0     | ... (JZ, not taken)
S2    |  110   | 1 |   0    |    1    |    0    |   0    |    0     | ... (JZ, taken)
...
```

### 12. Memory Interface

The CPU communicates with memory through:

```
┌─────────────────┐          ┌─────────────────┐
│                 │          │                 │
│      CPU        │          │     MEMORY      │
│                 │          │                 │
│  MAR [8 bits] ──┼─────────►│ Address         │
│                 │          │                 │
│  MDR [4 bits] ◄─┼─────────►│ Data            │
│                 │          │                 │
│  Mem_read ──────┼─────────►│ Read Enable     │
│                 │          │                 │
│  Mem_write ─────┼─────────►│ Write Enable    │
│                 │          │                 │
└─────────────────┘          └─────────────────┘
```

**Memory timing:**
1. CPU places address on MAR
2. CPU asserts Mem_read (or Mem_write)
3. Memory responds with data (on read) or stores data (on write)
4. Next clock cycle: data is stable in MDR

---

## Worked Example

**Problem:** Execute the following program on the Micro4:

```asm
        LDI 5       ; A = 5
        ADD 0x10    ; A = A + Memory[0x10]
        STA 0x11    ; Memory[0x11] = A
        HLT         ; Stop

; Data
0x10:   .byte 3    ; Value 3 stored at address 0x10
0x11:   .byte 0    ; Result will be stored here
```

**Initial State:**

```
PC = 0x00
A = 0x0
Memory[0x10] = 3
Memory[0x11] = 0
```

**Execution Trace:**

**Instruction 1: LDI 5 (at 0x00)**

```
Cycle 1: Fetch LDI instruction
  MAR ← 0x00
  MDR ← Memory[0x00] = 0x75 (0111 0101 = LDI 5)
  IR ← 0x75
  PC ← 0x01

Cycle 2: Execute LDI
  A ← IR[3:0] = 5
  Z ← 0

After: A=5, PC=0x01
```

**Instruction 2: ADD 0x10 (at 0x01)**

```
Cycle 1: Fetch ADD instruction
  MAR ← 0x01
  MDR ← Memory[0x01] = 0x30 (0011 0000 = ADD, low nibble)
  IR ← 0x30
  PC ← 0x02

Cycle 2: Fetch operand address
  MAR ← 0x02
  MDR ← Memory[0x02] = 0x10
  Operand address = 0x10
  PC ← 0x03

Cycle 3: Fetch operand value
  MAR ← 0x10
  MDR ← Memory[0x10] = 3

Cycle 4: Execute ADD
  ALU: A + MDR = 5 + 3 = 8
  A ← 8
  Z ← 0 (8 ≠ 0)

After: A=8, PC=0x03
```

**Instruction 3: STA 0x11 (at 0x03)**

```
Cycle 1: Fetch STA instruction
  MAR ← 0x03
  MDR ← Memory[0x03] = 0x20 (0010 0000 = STA)
  IR ← 0x20
  PC ← 0x04

Cycle 2: Fetch operand address
  MAR ← 0x04
  MDR ← Memory[0x04] = 0x11
  PC ← 0x05

Cycle 3: Execute STA
  MAR ← 0x11
  MDR ← A = 8
  Memory[0x11] ← 8

After: Memory[0x11]=8, PC=0x05
```

**Instruction 4: HLT (at 0x05)**

```
Cycle 1: Fetch HLT
  MAR ← 0x05
  MDR ← Memory[0x05] = 0x00 (HLT)
  IR ← 0x00
  PC ← 0x06

Cycle 2: Execute HLT
  HALT ← 1
  (CPU stops)
```

**Final State:**

```
PC = 0x06
A = 8
Memory[0x11] = 8
HALTED
```

---

## Try It Yourself

### 1. Emulator Practice

Use the Micro4 emulator:

```bash
cd src/micro4
./micro4 programs/math_test.asm
```

Watch the registers change as each instruction executes.

### 2. HDL Exploration

Examine `hdl/04_micro4_cpu.m4hdl`:
- Find the PC register and its update logic
- Trace how IR is loaded
- Identify the ALU connections
- Follow data from memory to registers

### 3. Visualizer Practice

Open `visualizer/index.html`:
- Build a simple register (group of flip-flops)
- Connect it to switches (input) and LEDs (output)
- Simulate loading and holding a value

### 4. Homework Exercises

From `docs/optimization_homework.md`:
- **B1-B3:** Adding more registers
- **B4:** Adding an index register
- **B5:** Adding a stack pointer
- **D5-D6:** Adding CALL/RET (requires datapath changes)

---

## Common Mistakes

### 1. Forgetting Register Enable Signals

Registers only update when their load/enable signal is active:

```
Wrong: A always gets ALU output
Right: A ← ALU output only when A_load=1
```

### 2. Bus Contention

Multiple drivers on the same bus cause conflicts:

```
Wrong: Both MDR and ALU driving the data bus simultaneously
Right: Use multiplexers or tri-state buffers to select one driver
```

### 3. Forgetting to Increment PC

After fetching, PC must point to the next instruction:

```
Wrong: PC stays at current instruction forever
Right: PC ← PC + instruction_length after fetch
```

### 4. Jump Timing

For conditional jumps, check the flag *before* updating PC:

```
Wrong: Update PC, then check if we should have jumped
Right: Check condition first, then either jump or increment PC
```

### 5. Memory Write Timing

Data must be stable *before* asserting write:

```
Wrong: Assert write, then put data on bus
Right: Put data on bus, wait, then assert write, wait, deassert write
```

---

## Historical Context

### The First Stored-Program Computers

**EDSAC (1949):** Cambridge University's Electronic Delay Storage Automatic Calculator was one of the first practical stored-program computers. Its datapath included:
- Accumulator (main register)
- Mercury delay line memory
- Hardwired control

**EDVAC (1951):** Based on von Neumann's design, it introduced:
- Binary representation (earlier machines often used decimal)
- Serial processing (one bit at a time)
- Single memory for both instructions and data

### The Microprocessor Revolution

**Intel 4004 (1971):** The first commercial microprocessor
- 4-bit datapath
- 2,300 transistors
- 46 instructions
- ~740 kHz clock
- Similar in scope to our Micro4!

```
4004 Architecture (simplified):
┌───────────────────────────────────┐
│  Accumulator (4-bit)              │
│  Index Registers (16 x 4-bit)     │
│  Program Counter (12-bit)         │
│  Stack (3-level internal)         │
│  ALU (4-bit)                      │
└───────────────────────────────────┘
```

**Intel 8086 (1978):** 16-bit CPU that defined the x86 architecture
- 29,000 transistors
- 16-bit datapath
- Still backward-compatible today (in 64-bit mode with extensions)

### Modern CPUs

Today's processors have:
- Multiple execution units (several ALUs)
- Deep pipelines (20+ stages)
- Superscalar execution (multiple instructions per cycle)
- Out-of-order execution
- Speculative execution
- Multiple cores

But at their heart, they still use the same principles: registers, ALU, memory, control unit.

---

## Further Reading

### In This Project
- `hdl/04_micro4_cpu.m4hdl` - Complete Micro4 HDL implementation
- `src/micro4/cpu.c` - Emulator source code
- `docs/micro4_isa.md` - Instruction set documentation
- `programs/*.asm` - Example programs

### External Resources
- *Computer Organization and Design* by Patterson & Hennessy - The classic textbook
- *The Elements of Computing Systems* (Nand2Tetris) - Build a computer from scratch
- Ben Eater's 8-bit computer - YouTube series building a CPU from chips

---

## Summary

| Component | Purpose |
|-----------|---------|
| Registers | Fast storage within CPU (PC, IR, A, MAR, MDR, flags) |
| ALU | Performs arithmetic and logic operations |
| Buses | Connect components (address bus, data bus, control bus) |
| Control Unit | Generates control signals based on instruction and state |
| Memory | Stores instructions and data |

**Fetch-Decode-Execute Cycle:**

1. **Fetch:** Read instruction from memory at PC, store in IR
2. **Decode:** Determine operation from opcode
3. **Execute:** Perform operation, update registers and flags

**Key Insights:**
- The datapath is the "plumbing"—it determines what data can flow where
- The control unit is the "brain"—it determines when data flows
- Multiplexers select data sources; buses share connections
- Multi-cycle designs share hardware; single-cycle designs are simpler but slower
- Modern CPUs are complex but built from these same fundamental blocks

---

## Conclusion: From Gates to CPUs

Congratulations! You've journeyed from binary numbers through logic gates, combinational and sequential circuits, ALU design, and now the complete CPU datapath.

**What you've learned:**
1. Binary is the language of computers—1s and 0s, nothing more
2. Logic gates compute simple Boolean functions
3. Combinational circuits compute complex functions without memory
4. Sequential circuits add memory using feedback
5. ALUs combine arithmetic and logic into a computation engine
6. The datapath connects all components into a working CPU

**Where to go next:**
- Build the Micro4 CPU using the HDL simulator
- Explore the Micro8 (8-bit) and Micro16 (16-bit) architectures
- Study pipelining to understand modern high-performance CPUs
- Learn about caches, virtual memory, and multiprocessing

The journey from a single transistor to a modern billion-transistor CPU is long, but every step builds on what came before. You now have the foundation to understand it all.

**Happy computing!**
