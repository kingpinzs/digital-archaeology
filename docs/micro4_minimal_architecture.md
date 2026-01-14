# Micro4 Minimal: The Most Basic Possible 4-bit CPU

## Design Philosophy

**GOAL:** Strip away EVERYTHING that isn't absolutely necessary. What's the minimum hardware needed for a working, useful CPU?

---

## The Absolute Minimum CPU

### What MUST a CPU have?

1. **Program Counter (PC)** - Where is the next instruction?
2. **Instruction Register (IR)** - What instruction are we doing?
3. **At least one data register** - Where do we do work?
4. **ALU** - How do we compute?
5. **Control Logic** - What happens when?
6. **Memory Interface** - Where's our code and data?

That's it. Everything else is an optimization.

---

## Micro4-Minimal Specification

### Data Widths
```
Data bus:     4 bits   (one nibble)
Address bus:  8 bits   (256 memory locations)
Instructions: 8 bits   (4-bit opcode + 4-bit operand)
```

### Registers (Absolute Minimum)
```
┌─────────────────────────────────────────┐
│  PC  [7:0]   Program Counter (8-bit)    │
│  A   [3:0]   Accumulator (4-bit)        │
│  Z   [0]     Zero Flag (1-bit)          │
└─────────────────────────────────────────┘
```

That's it. THREE registers total.

### Memory Map
```
Address Range   Contents
0x00 - 0xEF     General purpose (code + data)
0xF0 - 0xFF     I/O ports (optional, can be GP memory)
```

Total: 256 nibbles = 128 bytes = 1/8 KB

### Instruction Format
```
┌───────────────┬───────────────┐
│  Opcode [7:4] │  Operand [3:0]│
│    4 bits     │    4 bits     │
└───────────────┴───────────────┘
```

For instructions needing an 8-bit address, the next byte is the address:
```
Byte 1: [OPCODE] [0000]
Byte 2: [ADDRESS 7:0]
```

---

## Instruction Set (8 Instructions Only!)

This is the MINIMUM useful instruction set:

| Opcode | Mnemonic | Operation | Description |
|--------|----------|-----------|-------------|
| 0x0 | `HLT` | halt | Stop execution |
| 0x1 | `LDA addr` | A ← mem[addr] | Load accumulator from memory |
| 0x2 | `STA addr` | mem[addr] ← A | Store accumulator to memory |
| 0x3 | `ADD addr` | A ← A + mem[addr] | Add memory to accumulator |
| 0x4 | `SUB addr` | A ← A - mem[addr] | Subtract memory from accumulator |
| 0x5 | `JMP addr` | PC ← addr | Unconditional jump |
| 0x6 | `JZ addr` | if Z: PC ← addr | Jump if zero flag set |
| 0x7 | `LDI n` | A ← n | Load immediate (4-bit value) |

**Note:** Opcodes 0x8-0xF are UNUSED. This is intentional - leaves room for homework!

---

## Hardware Architecture

### Block Diagram
```
                    ┌─────────────┐
                    │   MEMORY    │
                    │ 256 x 4-bit │
                    └──────┬──────┘
                           │ Data Bus (4-bit)
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  │
   ┌─────────┐       ┌──────────┐            │
   │   MAR   │◄──────│   MDR    │            │
   │ (8-bit) │       │ (4-bit)  │            │
   └────┬────┘       └────┬─────┘            │
        │                 │                  │
        │ Address Bus     │                  │
        │ (8-bit)         │                  │
        │                 ▼                  │
        │           ┌──────────┐             │
        │           │    IR    │             │
        │           │ (8-bit)  │             │
        │           └────┬─────┘             │
        │                │                   │
        │                ▼                   │
        │      ┌──────────────────┐          │
        │      │  CONTROL UNIT    │          │
        │      │  (State Machine) │          │
        │      └────────┬─────────┘          │
        │               │ Control Signals    │
        │               ▼                    │
        │    ┌─────────────────────┐         │
        │    │         ALU         │         │
        │    │  ┌───┐     ┌───┐   │         │
        │    │  │ A │ OP  │ B │   │         │
        │    │  └─┬─┘     └─┬─┘   │         │
        │    │    │  ┌───┐  │     │         │
        │    │    └─►│ + │◄─┘     │         │
        │    │       │ - │        │         │
        │    │       └─┬─┘        │         │
        │    │         ▼          │         │
        │    │    ┌─────────┐     │         │
        │    │    │ Result  │─────┼─────────┘
        │    │    └─────────┘     │
        │    │         │          │
        │    │         ▼          │
        │    │    ┌─────────┐     │
        │    │    │ Z Flag  │     │
        │    │    └─────────┘     │
        │    └────────────────────┘
        │
        │    ┌─────────────────────┐
        └───►│        PC           │
             │      (8-bit)        │
             └─────────────────────┘
```

### Component Details

#### Program Counter (PC)
```
Width: 8 bits
Operations:
  - Reset to 0x00
  - Increment by 1 (after fetch)
  - Increment by 2 (after 2-byte instruction fetch)
  - Load new value (for jumps)
```

#### Accumulator (A)
```
Width: 4 bits
Operations:
  - Load from memory
  - Load immediate value
  - Store to memory
  - Receive ALU result
```

#### ALU
```
Inputs:  A (4-bit), B (4-bit from memory)
Outputs: Result (4-bit), Zero flag (1-bit)
Operations:
  - ADD: Result = A + B
  - SUB: Result = A - B
  - PASS: Result = B (for loads)

Zero flag: Set when Result == 0000
```

#### Control Unit (State Machine)
```
States:
  S0: FETCH1    - MAR ← PC, Read memory
  S1: FETCH2    - IR ← MDR, PC ← PC + 1
  S2: DECODE    - Determine instruction type
  S3: FETCH_ADDR- MAR ← PC, Read memory (get address byte)
  S4: ADDR_DONE - PC ← PC + 1
  S5: EXECUTE   - Do the operation
  S6: WRITEBACK - Store result if needed
  (back to S0)
```

---

## Instruction Execution Cycles

### HLT (1 byte, 3 cycles)
```
Cycle 1: Fetch opcode
Cycle 2: Decode, see HLT
Cycle 3: Stop clock
```

### LDI n (1 byte, 3 cycles)
```
Cycle 1: Fetch opcode+operand
Cycle 2: Decode, extract immediate
Cycle 3: A ← operand[3:0]
```

### LDA addr (2 bytes, 5 cycles)
```
Cycle 1: Fetch opcode
Cycle 2: Decode
Cycle 3: Fetch address byte
Cycle 4: MAR ← address, read memory
Cycle 5: A ← MDR
```

### STA addr (2 bytes, 5 cycles)
```
Cycle 1: Fetch opcode
Cycle 2: Decode
Cycle 3: Fetch address byte
Cycle 4: MAR ← address, MDR ← A
Cycle 5: Write memory
```

### ADD addr (2 bytes, 5 cycles)
```
Cycle 1: Fetch opcode
Cycle 2: Decode
Cycle 3: Fetch address byte
Cycle 4: MAR ← address, read memory
Cycle 5: A ← A + MDR, update Z flag
```

### SUB addr (2 bytes, 5 cycles)
```
Same as ADD but A ← A - MDR
```

### JMP addr (2 bytes, 4 cycles)
```
Cycle 1: Fetch opcode
Cycle 2: Decode
Cycle 3: Fetch address byte
Cycle 4: PC ← address
```

### JZ addr (2 bytes, 4-5 cycles)
```
Cycle 1: Fetch opcode
Cycle 2: Decode
Cycle 3: Fetch address byte
Cycle 4: Check Z flag
Cycle 5: If Z=1: PC ← address, else continue
```

---

## Example Program: Add Two Numbers

```asm
; Add values at addresses 0x20 and 0x21
; Store result at 0x22

        ORG 0x00        ; Start at address 0

START:  LDA 0x20        ; A = mem[0x20]
        ADD 0x21        ; A = A + mem[0x21]
        STA 0x22        ; mem[0x22] = A
        HLT             ; Stop

; Data section
        ORG 0x20
        DB  5           ; First number
        DB  3           ; Second number
        DB  0           ; Result goes here
```

Machine code:
```
Address  Hex    Assembly
0x00     0x10   LDA
0x01     0x20   addr=0x20
0x02     0x30   ADD
0x03     0x21   addr=0x21
0x04     0x20   STA
0x05     0x22   addr=0x22
0x06     0x00   HLT
...
0x20     0x05   data: 5
0x21     0x03   data: 3
0x22     0x00   data: result
```

---

## Example Program: Count Down

```asm
; Count down from 5 to 0

        ORG 0x00

START:  LDI 5           ; A = 5
LOOP:   STA 0x30        ; Store current count
        SUB 0x31        ; A = A - 1 (0x31 contains 1)
        JZ  DONE        ; If zero, we're done
        JMP LOOP        ; Otherwise continue
DONE:   STA 0x30        ; Store final 0
        HLT

; Data
        ORG 0x30
COUNT:  DB  0           ; Current count stored here
ONE:    DB  1           ; Constant 1 for decrementing
```

---

## What This CPU CANNOT Do

Understanding limitations is crucial:

1. **No subroutines** - No CALL/RET, no stack
2. **No indirect addressing** - Can't use pointers
3. **No indexing** - Can't iterate through arrays easily
4. **No bitwise operations** - No AND, OR, XOR, shifts
5. **No carry flag** - Can't do multi-precision math
6. **No input/output** - No way to communicate (yet)
7. **No interrupts** - Can't respond to external events
8. **Very limited memory** - Only 256 nibbles

Each of these limitations is a HOMEWORK ASSIGNMENT!

---

## Implementation Complexity

### Gate Count Estimate (very rough)
```
PC (8-bit register + incrementer):     ~100 gates
A (4-bit register):                    ~20 gates
Z flag (1-bit register):               ~5 gates
IR (8-bit register):                   ~40 gates
MAR (8-bit register):                  ~40 gates
MDR (4-bit register):                  ~20 gates
ALU (4-bit add/sub):                   ~50 gates
Control Unit (state machine):          ~100 gates
Glue logic:                            ~50 gates
─────────────────────────────────────────────────
TOTAL:                                 ~425 gates
```

The Intel 4004 had ~2300 transistors. This minimal design could be under 1000 transistors.

---

## Next Document: Optimization Homework

See `optimization_homework.md` for exercises to improve this basic CPU.
