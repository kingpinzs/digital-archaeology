# ALU Design: The Heart of Computation

## Prerequisites

- Binary arithmetic (see [01_binary_basics.md](01_binary_basics.md))
- Logic gates (see [02_logic_gates.md](02_logic_gates.md))
- Combinational logic (see [03_combinational_logic.md](03_combinational_logic.md))

## Learning Objectives

After completing this chapter, you will be able to:

1. Explain the purpose and structure of an ALU
2. Design an ALU that performs multiple operations
3. Implement flag generation (Zero, Carry, Sign, Overflow)
4. Use multiplexers for operation selection
5. Trace through ALU operations step by step
6. Understand the trade-offs in ALU design

---

## Introduction

The Arithmetic Logic Unit (ALU) is the computational engine of every CPU. It's the circuit that actually performs arithmetic (add, subtract, multiply) and logic operations (AND, OR, XOR, NOT).

In this chapter, we'll design an ALU step by step, starting from simple building blocks and ending with a fully functional 4-bit ALU suitable for our Micro4 CPU.

---

## Core Concepts

### 1. What Is an ALU?

An ALU is a combinational circuit that:
- Takes two data inputs (A and B)
- Takes operation select inputs (choosing what operation to perform)
- Produces a result output
- Produces status flags (information about the result)

```
                    ┌───────────────────────────┐
                    │                           │
     n-bit input ──►│ A                         │
                    │                           │
                    │          ALU              ├──► n-bit Result
                    │                           │
     n-bit input ──►│ B                         │
                    │                           │
                    │                           ├──► Flags (Z, C, S, V)
    Operation ─────►│ Op                        │
    Select          │                           │
                    └───────────────────────────┘
```

### 2. Common ALU Operations

| Category | Operations | Description |
|----------|------------|-------------|
| Arithmetic | ADD, SUB, INC, DEC | Numerical computation |
| Logic | AND, OR, XOR, NOT | Bitwise operations |
| Shift | SHL, SHR, ROL, ROR | Bit movement |
| Compare | CMP | Subtract without storing result |
| Pass-through | PASS A, PASS B | Route input to output unchanged |

### 3. ALU Architecture Overview

The key insight: use multiplexers to select which operation's result reaches the output.

```
                    ┌───────────────────────────────────────┐
                    │              ALU                       │
                    │                                        │
A ─────────────┬────┼──►┌───────┐                           │
               │    │   │  ADD  ├──►┐                       │
               │    │   └───────┘   │                       │
               │    │               │   ┌─────────┐         │
               │    │   ┌───────┐   ├──►│         │         │
               ├────┼──►│  SUB  ├──►┤   │   MUX   ├─────────┼──► Result
               │    │   └───────┘   │   │         │         │
               │    │               │   │         │         │
               │    │   ┌───────┐   ├──►│         │         │
               ├────┼──►│  AND  ├──►┤   │         │         │
               │    │   └───────┘   │   │         │         │
               │    │               │   │         │         │
               │    │   ┌───────┐   ├──►│         │         │
               └────┼──►│  OR   ├──►┘   └────┬────┘         │
                    │   └───────┘            │              │
B ─────────────┴────┤                        │              │
                    │                        │              │
Op ─────────────────┼────────────────────────┘              │
                    │                                        │
                    └───────────────────────────────────────┘
```

All operations compute in parallel; the mux selects which result to output.

### 4. Building the Adder/Subtractor

We can use the same circuit for both ADD and SUB by using two's complement.

**Key insight:** A - B = A + (-B) = A + (NOT B) + 1

**Adder/Subtractor Circuit:**

```
                         ┌─────────────────────────┐
                         │   Ripple Carry Adder    │
                         │                         │
A ───────────────────────┤ A                   Sum ├───► Result
                         │                         │
                         │                    Cout ├───► Carry Out
                ┌────────┤ B                       │
                │        │                         │
                │        │                    Cin  │◄── Sub
                │        └────────────┬────────────┘
                │                     │
     ┌──────────┤                     │
     │          │                     │
B ───┤   ┌──────▼──────┐              │
     │   │             │              │
     │   │  XOR array  │◄─────────────┘
     │   │  (per bit)  │
     │   │             │
     │   └─────────────┘
     │          │
     └──────────┘

When Sub=0: B XOR 0 = B, Cin=0  → A + B
When Sub=1: B XOR 1 = NOT B, Cin=1 → A + NOT B + 1 = A - B
```

**4-bit Implementation:**

```
Sub ─────┬─────┬─────┬─────┬──────────────────────────────────┐
         │     │     │     │                                   │
B3 ──────⊕─┐   │     │     │                                   │
           │   │     │     │                                   │
B2 ────────│───⊕─┐   │     │                                   │
           │     │   │     │                                   │
B1 ────────│─────│───⊕─┐   │                                   │
           │     │     │   │                                   │
B0 ────────│─────│─────│───⊕─┐                                 │
           │     │     │     │                                 │
           ▼     ▼     ▼     ▼                                 │
         ┌───┐ ┌───┐ ┌───┐ ┌───┐                               │
A3 ─────►│FA │◄│FA │◄│FA │◄│FA │◄──────────────────────────────┘
         │ 3 │ │ 2 │ │ 1 │ │ 0 │
         └─┬─┘ └─┬─┘ └─┬─┘ └─┬─┘
           │     │     │     │
           S3    S2    S1    S0

⊕ = XOR gate
FA = Full Adder
```

### 5. Adding Logic Operations

AND, OR, XOR are simple: just wire the inputs to the appropriate gates.

```
           ┌─────┐
A ─────────┤     │
           │ AND ├───► A AND B
B ─────────┤     │
           └─────┘

           ┌─────┐
A ─────────┤     │
           │ OR  ├───► A OR B
B ─────────┤     │
           └─────┘

           ┌─────┐
A ─────────┤     │
           │ XOR ├───► A XOR B
B ─────────┤     │
           └─────┘

           ┌─────┐
A ─────────┤ NOT ├───► NOT A
           └─────┘
```

For a 4-bit ALU, we need 4 of each gate (one per bit).

### 6. The Complete 4-bit ALU

Let's design an ALU with 8 operations:

| Op[2:0] | Operation | Description |
|---------|-----------|-------------|
| 000 | ADD | A + B |
| 001 | SUB | A - B |
| 010 | AND | A AND B |
| 011 | OR | A OR B |
| 100 | XOR | A XOR B |
| 101 | NOT | NOT A |
| 110 | INC | A + 1 |
| 111 | DEC | A - 1 |

**Architecture:**

```
                    ┌────────────────────────────────────────────────┐
                    │                    ALU                          │
                    │                                                 │
                    │  ┌─────────┐                                   │
                    │  │         │                                   │
A ──────────────────┼─►│ ADD/SUB ├───────────────────┐               │
                    │  │         │                   │               │
B ──────────────────┼─►│         │                   │               │
                    │  └─────────┘                   │               │
                    │                                │               │
                    │  ┌─────────┐                   │   ┌───────┐   │
                    │  │         │                   ├──►│       │   │
A ──────────────────┼─►│   AND   ├───────────────────┤   │       │   │
B ──────────────────┼─►│         │                   │   │  8:1  │   │
                    │  └─────────┘                   ├──►│       │   │
                    │                                │   │  MUX  ├───┼──► Result
                    │  ┌─────────┐                   ├──►│       │   │
A ──────────────────┼─►│   OR    ├───────────────────┤   │       │   │
B ──────────────────┼─►│         │                   │   │       │   │
                    │  └─────────┘                   ├──►│       │   │
                    │                                │   │       │   │
                    │  ┌─────────┐                   ├──►│       │   │
A ──────────────────┼─►│   XOR   ├───────────────────┤   │       │   │
B ──────────────────┼─►│         │                   │   │       │   │
                    │  └─────────┘                   ├──►│       │   │
                    │                                │   │       │   │
                    │  ┌─────────┐                   │   │       │   │
A ──────────────────┼─►│   NOT   ├───────────────────┘   └───┬───┘   │
                    │  └─────────┘                           │       │
                    │                                        │       │
Op[2:0] ────────────┼────────────────────────────────────────┘       │
                    │                                                 │
                    └─────────────────────────────────────────────────┘
```

**Note:** INC and DEC can share the ADD/SUB unit:
- INC: A + B where B=0001, Sub=0
- DEC: A + B where B=0001, Sub=1 (A - 1)

### 7. Status Flags

Flags provide additional information about ALU results. They're crucial for conditional branching.

#### Zero Flag (Z)

Set when the result is zero.

```
Z = NOR(R3, R2, R1, R0)  // Z=1 when all result bits are 0

     ┌─────┐
R3 ──┤     │
R2 ──┤ NOR ├──► Z
R1 ──┤     │
R0 ──┤     │
     └─────┘

Actually, typically done as:

Z = NOT(R3 OR R2 OR R1 OR R0)
```

**Micro4 Example:** The JZ instruction jumps if Z=1.

#### Carry Flag (C)

For addition: Set when there's a carry out of the MSB.
For subtraction: Set when there's a borrow (no carry out).

```
In the adder/subtractor:
- ADD: C = Cout (carry out of final adder)
- SUB: C = NOT Cout (borrow occurs when no carry)
```

**Why it matters:** Enables multi-precision arithmetic.

```asm
; 8-bit addition on a 4-bit CPU
LDA  NUM1_LO
ADD  NUM2_LO     ; Low nibbles, may set C
STA  RESULT_LO
LDA  NUM1_HI
ADC  NUM2_HI     ; Add high nibbles + carry
STA  RESULT_HI
```

#### Sign Flag (S)

Copy of the MSB (most significant bit) of the result.

```
S = R[n-1]  // For 4-bit: S = R3

R3 ──────────────► S
```

In two's complement, the MSB indicates sign: 0=positive, 1=negative.

#### Overflow Flag (V)

Indicates signed arithmetic overflow—when the result doesn't fit in the available bits.

**When does signed overflow occur?**
- Adding two positives, getting a negative
- Adding two negatives, getting a positive

**Detection:** Overflow = (carry into MSB) XOR (carry out of MSB)

```
         ┌─────┐
Cin3 ────┤     │
         │ XOR ├──► V (Overflow)
Cout ────┤     │
         └─────┘
```

**Examples (4-bit signed):**

```
  0111  (+7)          1000  (-8)
+ 0001  (+1)        + 1111  (-1)
------              ------
  1000  (-8) ❌      10111 → 0111 (+7) ❌

7 + 1 ≠ -8! Overflow!    -8 + (-1) ≠ +7! Overflow!

Cin3=1, Cout=0 → V=1    Cin3=0, Cout=1 → V=1
```

### 8. Complete ALU with Flags

```
                    ┌────────────────────────────────────────────────┐
                    │                    ALU                          │
                    │                                                 │
                    │  ┌──────────────────────────────────────────┐   │
A[3:0] ─────────────┼─►│                                          │   │
                    │  │            Arithmetic Unit               │   │
B[3:0] ─────────────┼─►│           (Adder/Subtractor)             │   │
                    │  │                                          │   │
Op ─────────────────┼─►│                                          │   │
                    │  └──────────┬──────────────────────┬────────┘   │
                    │             │                      │            │
                    │            Cout                  Cin3           │
                    │             │                      │            │
                    │             ▼                      ▼            │
                    │         ┌───────────────────────────┐           │
                    │         │       Flag Generator      │           │
Result[3:0] ◄───────┼─────────┤                           │           │
                    │         │  Z = NOR(R3,R2,R1,R0)     │           │
                    │         │  C = function(Cout, Op)   ├───────────┼─► Z
                    │         │  S = R3                   ├───────────┼─► C
                    │         │  V = Cin3 XOR Cout        ├───────────┼─► S
                    │         │                           ├───────────┼─► V
                    │         └───────────────────────────┘           │
                    │                                                 │
                    └─────────────────────────────────────────────────┘
```

### 9. ALU Control

The CPU's control unit generates the ALU operation select signals.

**Micro4 Instruction → ALU Operation:**

| Instruction | Op[2:0] | ALU Action |
|-------------|---------|------------|
| ADD addr | 000 | A + mem[addr] |
| SUB addr | 001 | A - mem[addr] |
| LDA addr | 000 | 0 + mem[addr] (pass B) |
| STA addr | — | (no ALU operation) |

**In the Micro4:**
- The instruction decoder extracts the opcode
- Control logic generates ALU operation select
- ALU computes; result goes to accumulator

### 10. Optimizations and Trade-offs

#### Speed vs. Complexity

**Ripple Carry Adder:**
- Simple: n full adders in a chain
- Slow: O(n) gate delays for n-bit addition

**Carry Lookahead Adder:**
- Complex: Additional logic to compute carries in parallel
- Fast: O(log n) gate delays

**For Micro4:** Ripple carry is fine. For high-performance CPUs, carry lookahead is essential.

#### Area vs. Flexibility

**Single-function units:** Smallest, but can only do one operation.

**Multi-function ALU:** Larger, but supports many operations.

**The 74181:** A famous 4-bit ALU chip (1970) that performs 16 arithmetic and 16 logic functions. It was a building block for many minicomputers.

---

## Worked Example

**Problem:** Trace through the Micro4 ALU for ADD instruction with A=5 (0101) and B=3 (0011).

**Step 1: Operation Decode**
```
ADD → Op = 000 (select adder output)
ADD → Sub = 0 (not subtraction)
```

**Step 2: B Inversion (None for ADD)**
```
Sub = 0
B XOR 0 = B
B' = 0011
```

**Step 3: Ripple Carry Addition**
```
   Cin=0 (from Sub=0)

   A:    0 1 0 1
   B':   0 0 1 1
   ------------------
         │ │ │ │
         ▼ ▼ ▼ ▼
   ┌────────────────────┐
   │                    │
Bit 0:  FA(1, 1, 0) = Sum=0, Cout=1
Bit 1:  FA(0, 1, 1) = Sum=0, Cout=1
Bit 2:  FA(1, 0, 1) = Sum=0, Cout=1
Bit 3:  FA(0, 0, 1) = Sum=1, Cout=0
   │                    │
   └────────────────────┘

Result: 1000 = 8
Cout = 0
```

**Step 4: Flag Generation**
```
Result = 1000

Z = NOR(1,0,0,0) = 0  (result not zero)
C = Cout = 0           (no carry out)
S = R3 = 1            (sign bit set)
V = Cin3 XOR Cout = 1 XOR 0 = 1  (overflow!)
```

**Analysis:**
- 5 + 3 = 8 ✓ (unsigned)
- But in 4-bit signed, +5 + +3 = -8 ✗ (overflow!)
- The V flag correctly indicates signed overflow

---

## Try It Yourself

### 1. Visualizer Practice

Open `visualizer/index.html`:

1. **Build a 1-bit ALU:**
   - Create AND, OR, XOR gates for logic operations
   - Create a full adder for arithmetic
   - Use a multiplexer to select the operation
   - Add switches for A, B, and operation select

2. **Test All Operations:**
   - Try different A and B values
   - Verify each operation produces the correct result

### 2. HDL Exploration

Examine `hdl/03_alu.m4hdl`:
- See how the ALU is structured
- Note the flag generation logic
- Trace through an operation

### 3. Homework Exercises

From `docs/optimization_homework.md`:
- **A1-A4:** Adding bitwise operations (AND, OR, XOR, NOT)
- **A7-A11:** Adding carry, sign, and overflow flags
- **A12-A13:** Adding shift operations
- **A16:** Adding compare (CMP)

---

## Common Mistakes

### 1. Forgetting the Carry-In for Subtraction

For A - B using two's complement:
```
Result = A + NOT(B) + 1
                     ↑
              Don't forget this!
```

The carry-in must be 1 for subtraction:
```
Sub signal connects to:
- XOR gates (invert B)
- Carry-in of LSB adder (add 1)
```

### 2. Incorrect Overflow Detection

Overflow ≠ Carry!

```
Unsigned: 15 + 1 = 16  → Carry=1, Overflow=0 (unsigned correct if we ignore carry)
Signed:   7 + 1 = -8   → Carry=0, Overflow=1 (signed incorrect!)
```

### 3. Flag Update Timing

Flags should update only for operations that logically affect them:
- Z, S usually update for all arithmetic/logic operations
- C updates for add/subtract/shift
- V updates only for add/subtract

The Micro4 keeps it simple: flags update for ADD and SUB.

### 4. Forgetting to Handle NOT

NOT only uses input A:
```
NOT: Result = NOT(A), ignore B
```

The B input should be don't care, but make sure your mux handles this correctly.

---

## Historical Context

### From Human Computers to Electronic ALUs

**1800s-1940s:** "Computer" was a job title. Humans performed calculations by hand.

**ENIAC (1945):** The first general-purpose electronic computer. Its "arithmetic unit" used vacuum tubes to add in 200 microseconds.

**IBM 701 (1952):** One of the first commercial computers. Addition took 60 microseconds.

**74181 (1970):** Texas Instruments released the 74181, a 4-bit ALU on a single chip. It could perform 32 different operations and became the building block for many minicomputers.

```
74181 Pinout:
┌───────────────────┐
│  74181            │
│  4-bit ALU        │
│                   │
│  A0-A3: Input A   │
│  B0-B3: Input B   │
│  F0-F3: Output    │
│  S0-S3: Select    │
│  M: Mode          │
│  Cn: Carry in     │
│  Cn+4: Carry out  │
│  G, P: Lookahead  │
│  A=B: Equality    │
└───────────────────┘
```

**Today:** Modern CPUs have multiple ALUs operating in parallel, each capable of billions of operations per second.

### The DEC PDP-8 (1965)

The PDP-8, one of the first minicomputers, had a 12-bit ALU that could:
- Add/subtract
- AND
- Complement
- Rotate

Its simplicity made it affordable ($18,000—about $150,000 today). Our Micro4 is even simpler, but the principles are the same.

---

## Further Reading

### In This Project
- `hdl/03_alu.m4hdl` - Complete ALU implementation
- `src/micro4/cpu.c` - ALU operations in the emulator
- `docs/optimization_homework.md` - ALU enhancement exercises

### External Resources
- *Computer Organization and Design* by Patterson & Hennessy - Chapter on datapath
- 74181 datasheet - See how a real ALU chip was designed
- Ben Eater's 8-bit computer series - Building an ALU from 74LS chips

---

## Summary

| Component | Function |
|-----------|----------|
| Adder | A + B |
| Subtractor | A + NOT(B) + 1 |
| Logic unit | AND, OR, XOR, NOT |
| Multiplexer | Selects operation result |
| Flag generator | Z, C, S, V |

**Flag Summary:**

| Flag | Name | Set When |
|------|------|----------|
| Z | Zero | Result = 0 |
| C | Carry | Unsigned overflow (carry out) |
| S | Sign | MSB of result = 1 |
| V | Overflow | Signed overflow (Cin XOR Cout of MSB) |

**Key Insights:**
- All operations compute in parallel; a mux selects the result
- Subtraction is addition of the two's complement
- Flags provide crucial information for conditional branching
- The same hardware handles both signed and unsigned numbers
- ALU complexity vs. speed is a fundamental trade-off

**Next Chapter:** [CPU Datapath](06_cpu_datapath.md) - Connecting ALU, registers, and memory
