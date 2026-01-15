# Combinational Logic: Building Useful Circuits

## Prerequisites

- Binary arithmetic (see [01_binary_basics.md](01_binary_basics.md))
- Logic gates (see [02_logic_gates.md](02_logic_gates.md))

## Learning Objectives

After completing this chapter, you will be able to:

1. Design and implement half adders and full adders
2. Construct ripple-carry adders for multi-bit addition
3. Build multiplexers (2:1, 4:1, 8:1) for data selection
4. Create decoders and encoders for address/data conversion
5. Design comparators for number comparison
6. Trace signals through combinational circuits

---

## Introduction

In the previous chapter, we learned about individual logic gates. Now we'll combine them into useful circuits called **combinational logic**. These circuits have a special property: the output depends *only* on the current inputs, with no memory of past inputs.

Think of combinational logic as a pure function in programming: same inputs always produce same outputs, with no side effects or state.

In this chapter, we'll build the essential building blocks that make up a CPU's arithmetic and logic unit (ALU) and control logic.

---

## Core Concepts

### 1. What Is Combinational Logic?

**Combinational circuits:**
- Output determined solely by current inputs
- No memory or feedback
- Respond instantly (ignoring propagation delay)

```
Inputs ──┬──┬──┐
         │  │  │    ┌─────────────┐
         │  │  └───►│             │
         │  └──────►│ Combinational├───► Output
         └─────────►│   Circuit   │
                    └─────────────┘
```

**Contrast with sequential logic (next chapter):**
- Sequential circuits have memory (state)
- Output depends on inputs AND previous state

### 2. The Half Adder

The simplest addition circuit: adds two single bits.

**Inputs:** A, B (two 1-bit numbers)
**Outputs:** Sum, Carry

**Truth Table:**

```
A | B | Sum | Carry
--+---+-----+------
0 | 0 |  0  |   0
0 | 1 |  1  |   0
1 | 0 |  1  |   0
1 | 1 |  0  |   1
```

**Observation:**
- Sum = A XOR B (1 when inputs differ)
- Carry = A AND B (1 when both inputs are 1)

**Circuit Diagram:**

```
        ┌─────┐
A ──┬───┤     │
    │   │ XOR ├──────── Sum
B ─┬┼───┤     │
   ││   └─────┘
   ││
   ││   ┌─────┐
   │└───┤     │
   │    │ AND ├──────── Carry
   └────┤     │
        └─────┘
```

**Why "half"?** Because it can't handle a carry *in* from a previous bit position.

### 3. The Full Adder

Adds three bits: A, B, and Carry-in (Cin). This is what we need for multi-bit addition.

**Inputs:** A, B, Cin
**Outputs:** Sum, Cout

**Truth Table:**

```
A | B | Cin | Sum | Cout
--+---+-----+-----+-----
0 | 0 |  0  |  0  |  0
0 | 0 |  1  |  1  |  0
0 | 1 |  0  |  1  |  0
0 | 1 |  1  |  0  |  1
1 | 0 |  0  |  1  |  0
1 | 0 |  1  |  0  |  1
1 | 1 |  0  |  0  |  1
1 | 1 |  1  |  1  |  1
```

**Logic Equations:**
- Sum = A XOR B XOR Cin
- Cout = (A AND B) OR (Cin AND (A XOR B))

**Circuit (using two half adders):**

```
                ┌──────────────┐
                │  Half Adder  │
A ──────────────┤A           S ├───────┐
                │              │       │  ┌──────────────┐
B ──────────────┤B           C ├───┐   └──┤A           S ├─── Sum
                └──────────────┘   │      │  Half Adder  │
                                   │      │              │
Cin ───────────────────────────────┼──────┤B           C ├──┐
                                   │      └──────────────┘  │
                                   │                        │
                                   │   ┌────┐               │
                                   └───┤    │               │
                                       │ OR ├───────────────┴─── Cout
                                   ┌───┤    │
                                   │   └────┘
                                   │
                                   └────────────────────────────
```

**Simplified Diagram:**

```
          ┌───────────────────────────────┐
          │         Full Adder            │
          │                               │
A ────────┤A                           Sum├──── Sum
          │                               │
B ────────┤B                          Cout├──── Cout
          │                               │
Cin ──────┤Cin                            │
          └───────────────────────────────┘
```

### 4. Ripple Carry Adder

To add multi-bit numbers, we chain full adders together. The carry "ripples" from right to left.

**4-bit Ripple Carry Adder:**

```
      A3 B3      A2 B2      A1 B1      A0 B0
       │  │       │  │       │  │       │  │
       ▼  ▼       ▼  ▼       ▼  ▼       ▼  ▼
      ┌────┐     ┌────┐     ┌────┐     ┌────┐
Cout◄─┤ FA │◄────┤ FA │◄────┤ FA │◄────┤ FA │◄── 0 (Cin)
      └──┬─┘     └──┬─┘     └──┬─┘     └──┬─┘
         │          │          │          │
         ▼          ▼          ▼          ▼
        S3         S2         S1         S0
```

**Example: 0111 + 0011 (7 + 3 = 10)**

```
                C3=1  C2=1  C1=1  C0=0
                  ↓     ↓     ↓     ↓
A:                0     1     1     1
B:                0     0     1     1
                  │     │     │     │
                  ▼     ▼     ▼     ▼
Sum:        C=1   0     1     0     0

Result: 1010₂ = 10₁₀ ✓
```

**Trade-off:**
- Simple design
- Slow for wide numbers (carry must propagate through all bits)
- 32-bit addition: 32 gate delays worst case

**Faster alternatives:**
- Carry-lookahead adder (complex, but constant delay)
- Carry-select adder (parallel speculation)

### 5. Multiplexers (MUX)

A multiplexer selects one of several inputs based on select signals.

**Analogy:** A rotary switch that connects one of many sources to an output.

#### 2:1 Multiplexer

Selects between two inputs based on one select line.

```
         ┌─────────┐
D0 ──────┤0        │
         │   MUX   ├──── Y
D1 ──────┤1        │
         └────┬────┘
              │
Sel ──────────┘

When Sel=0, Y=D0
When Sel=1, Y=D1
```

**Truth Table:**

```
Sel | D0 | D1 | Y
----+----+----+---
 0  |  0 |  X | 0
 0  |  1 |  X | 1
 1  |  X |  0 | 0
 1  |  X |  1 | 1
```

**Logic Equation:** Y = (NOT Sel AND D0) OR (Sel AND D1)

**Gate Implementation:**

```
            ┌─────┐
Sel ────┬───┤ NOT ├───┐
        │   └─────┘   │
        │             │   ┌─────┐
        │         ┌───┴───┤     │
        │         │       │ AND ├───┐
D0 ─────┼─────────┴───────┤     │   │
        │                 └─────┘   │   ┌─────┐
        │                           ├───┤     │
        │   ┌─────┐                 │   │ OR  ├─── Y
        │   │     │                 │   │     │
        └───┤ AND ├─────────────────┘   └─────┘
            │     │
D1 ─────────┤     │
            └─────┘
```

#### 4:1 Multiplexer

Selects one of four inputs using two select lines.

```
         ┌─────────┐
D0 ──────┤00       │
D1 ──────┤01       │
         │   MUX   ├──── Y
D2 ──────┤10       │
D3 ──────┤11       │
         └────┬────┘
              │
S1 S0 ────────┘
```

**Selection:**
- S1=0, S0=0 → Y=D0
- S1=0, S0=1 → Y=D1
- S1=1, S0=0 → Y=D2
- S1=1, S0=1 → Y=D3

**Building 4:1 from 2:1 MUXes:**

```
         ┌───────┐
D0 ──────┤0      │
         │ 2:1   ├──────┐
D1 ──────┤1   MUX│      │
         └───┬───┘      │    ┌───────┐
             │          └────┤0      │
S0 ──────────┴───────────────┤       ├──── Y
                             │ 2:1   │
         ┌───────┐      ┌────┤1   MUX│
D2 ──────┤0      │      │    └───┬───┘
         │ 2:1   ├──────┘        │
D3 ──────┤1   MUX│               │
         └───┬───┘               │
             │                   │
S0 ──────────┘                   │
                                 │
S1 ──────────────────────────────┘
```

#### 8:1 Multiplexer

Three select lines choose one of eight inputs.

**In CPUs:** Multiplexers route data between registers, memory, and the ALU. The control unit generates select signals.

### 6. Decoders

A decoder converts a binary number into a "one-hot" output (exactly one output is 1).

**Analogy:** A mail sorter that routes a letter to exactly one mailbox based on the address.

#### 2:4 Decoder

Two inputs select one of four outputs.

```
         ┌─────────┐
         │         ├──── Y0
A0 ──────┤         ├──── Y1
         │  2:4    │
A1 ──────┤ Decoder ├──── Y2
         │         ├──── Y3
         └─────────┘
```

**Truth Table:**

```
A1 | A0 | Y3 | Y2 | Y1 | Y0
---+----+----+----+----+----
 0 |  0 |  0 |  0 |  0 |  1
 0 |  1 |  0 |  0 |  1 |  0
 1 |  0 |  0 |  1 |  0 |  0
 1 |  1 |  1 |  0 |  0 |  0
```

**Logic Equations:**
- Y0 = NOT A1 AND NOT A0
- Y1 = NOT A1 AND A0
- Y2 = A1 AND NOT A0
- Y3 = A1 AND A0

**Gate Implementation:**

```
         ┌─────┐
A0 ──┬───┤ NOT ├─── A0'
     │   └─────┘
     │   ┌─────┐
A1 ──┼───┤ NOT ├─── A1'
     │   └─────┘
     │
     │      ┌─────┐
A0'──┴──────┤     │
            │ AND ├──── Y0 (when A1A0 = 00)
A1'─────────┤     │
            └─────┘
            ┌─────┐
A0 ─────────┤     │
            │ AND ├──── Y1 (when A1A0 = 01)
A1'─────────┤     │
            └─────┘
            ┌─────┐
A0'─────────┤     │
            │ AND ├──── Y2 (when A1A0 = 10)
A1 ─────────┤     │
            └─────┘
            ┌─────┐
A0 ─────────┤     │
            │ AND ├──── Y3 (when A1A0 = 11)
A1 ─────────┤     │
            └─────┘
```

#### 3:8 Decoder

Three inputs select one of eight outputs. Used extensively in memory addressing.

**In CPUs:** Decoders convert opcodes into control signals. The Micro4's instruction decoder uses this pattern.

### 7. Encoders

An encoder is the reverse of a decoder: converts one-hot input to binary.

#### 4:2 Encoder

```
         ┌─────────┐
I0 ──────┤         │
I1 ──────┤  4:2    ├──── A0
I2 ──────┤ Encoder ├──── A1
I3 ──────┤         │
         └─────────┘
```

**Truth Table (assuming only one input is active):**

```
I3 | I2 | I1 | I0 | A1 | A0
---+----+----+----+----+----
 0 |  0 |  0 |  1 |  0 |  0
 0 |  0 |  1 |  0 |  0 |  1
 0 |  1 |  0 |  0 |  1 |  0
 1 |  0 |  0 |  0 |  1 |  1
```

**Logic Equations:**
- A0 = I1 OR I3
- A1 = I2 OR I3

### 8. Priority Encoder

What if multiple inputs are active? A priority encoder outputs the highest-priority input.

```
         ┌─────────────┐
I0 ──────┤             │
I1 ──────┤  Priority   ├──── A0
I2 ──────┤  Encoder    ├──── A1
I3 ──────┤             ├──── Valid
         └─────────────┘
```

**Truth Table:**

```
I3 | I2 | I1 | I0 | A1 | A0 | Valid
---+----+----+----+----+----+------
 0 |  0 |  0 |  0 |  X |  X |   0    (no input)
 0 |  0 |  0 |  1 |  0 |  0 |   1    (I0 active)
 0 |  0 |  1 |  X |  0 |  1 |   1    (I1 highest)
 0 |  1 |  X |  X |  1 |  0 |   1    (I2 highest)
 1 |  X |  X |  X |  1 |  1 |   1    (I3 highest)
```

X means "don't care" — the value doesn't affect the output.

**In CPUs:** Priority encoders handle interrupt priorities.

### 9. Comparators

Compare two numbers and determine their relationship.

#### 1-bit Comparator

```
         ┌─────────────┐
A ───────┤             ├──── A > B
         │  1-bit      │
B ───────┤ Comparator  ├──── A = B
         │             │
         └─────────────┴──── A < B
```

**Truth Table:**

```
A | B | A>B | A=B | A<B
--+---+-----+-----+----
0 | 0 |  0  |  1  |  0
0 | 1 |  0  |  0  |  1
1 | 0 |  1  |  0  |  0
1 | 1 |  0  |  1  |  0
```

**Logic Equations:**
- A > B = A AND NOT B
- A = B = A XNOR B = NOT (A XOR B)
- A < B = NOT A AND B

#### 4-bit Comparator

Compare two 4-bit numbers by chaining 1-bit comparators with cascade inputs.

```
Compare A3A2A1A0 with B3B2B1B0:

Start from most significant bit (A3, B3):
1. If A3 > B3, then A > B (done)
2. If A3 < B3, then A < B (done)
3. If A3 = B3, check A2 and B2
4. Continue until difference found or all bits equal
```

**Cascaded Comparator Structure:**

```
     A3 B3          A2 B2          A1 B1          A0 B0
       │  │           │  │           │  │           │  │
       ▼  ▼           ▼  ▼           ▼  ▼           ▼  ▼
    ┌──────┐       ┌──────┐       ┌──────┐       ┌──────┐
    │1-bit │       │1-bit │       │1-bit │       │1-bit │
    │ Comp │       │ Comp │       │ Comp │       │ Comp │
    └──┬───┘       └──┬───┘       └──┬───┘       └──┬───┘
       │              │              │              │
    GT EQ LT       GT EQ LT       GT EQ LT       GT EQ LT
       │  │  │        │  │  │        │  │  │        │  │  │
       ▼  ▼  ▼        ▼  ▼  ▼        ▼  ▼  ▼        ▼  ▼  ▼
    ┌─────────────────────────────────────────────────────┐
    │                   Cascade Logic                      │
    └─────────────────────────────────────────────────────┘
                           │  │  │
                          A>B A=B A<B
```

---

## Worked Example

**Problem:** Design a circuit that outputs the maximum of two 2-bit unsigned numbers.

**Approach:**
1. Compare the two numbers
2. Use the comparison result to select the larger one via a multiplexer

**Solution:**

```
A1 A0 ─────────┬──────────────────────────┐
               │                          │
               │     ┌─────────────┐      │
               └─────┤             │      │
                     │  2-bit      │      │   ┌─────────┐
B1 B0 ─────────┬─────┤ Comparator  ├──────┼───┤         │
               │     │             │      │   │ 2:1 MUX │
               │     └─────────────┘      └───┤ (2-bit) ├─── Max
               │          A>B                 │         │
               │                          ┌───┤         │
               └──────────────────────────┘   └─────────┘
```

**Logic:**
- Compare A and B
- If A > B, output A (Sel=1)
- If A ≤ B, output B (Sel=0)

**Using 2:1 MUX for each bit:**

```
When A>B = 1: Select A
When A>B = 0: Select B
```

---

## Try It Yourself

### 1. Visualizer Practice

Open `visualizer/index.html`:

1. **Build a Half Adder:**
   - Use one XOR gate and one AND gate
   - Click "Adder Example" to see a working half adder
   - Toggle inputs and verify the truth table

2. **Extend to Full Adder:**
   - Add another XOR and AND gate
   - Add an OR gate for carry-out
   - Test all 8 input combinations

### 2. HDL Exploration

Examine the HDL files:

- `hdl/03_alu.m4hdl` - See how adders are built
- `hdl/04_micro4_cpu.m4hdl` - See multiplexers in the datapath

### 3. Homework Exercises

From `docs/optimization_homework.md`:
- **A1-A6:** Adding ALU operations uses combinational logic
- **C1:** Zero page addressing needs a decoder

---

## Common Mistakes

### 1. Forgetting Carry Propagation

In multi-bit adders, each bit depends on the carry from the previous bit. Don't forget to connect the carry chain!

```
Wrong: Independent full adders (no carry connection)
Right: Chain Cout → Cin for adjacent bits
```

### 2. Multiplexer Select Confusion

Select lines are binary encoded:
- S=00 selects input 0
- S=01 selects input 1
- S=10 selects input 2
- S=11 selects input 3

Not one-hot!

### 3. Decoder vs. Demultiplexer

- **Decoder:** Binary input → One-hot output (data flows through)
- **Demultiplexer:** One input + select → One of many outputs

A decoder with an enable input acts as a demultiplexer.

### 4. Priority Encoder Edge Cases

What if no inputs are active? Add a "valid" output:

```
Valid = I0 OR I1 OR I2 OR I3
```

---

## Historical Context

### The Arithmetic Revolution

**Mechanical Calculators (1600s-1900s):**
Pascal's Pascaline (1642) used gear wheels for addition. Carry propagation required complex mechanical linkages.

**Relay Computers (1930s-1940s):**
Konrad Zuse's Z3 (1941) used electromechanical relays for binary arithmetic. Addition took about 1 second.

**Electronic Computers (1940s):**
ENIAC could add in 200 microseconds—5,000x faster than Z3.

**Integrated Circuits (1960s):**
The 74181 ALU chip (1970) put a complete 4-bit ALU on one chip. Revolutionary for its time.

**Modern CPUs:**
Today's processors perform billions of additions per second using specialized adder circuits.

### The Carry-Lookahead Breakthrough

The ripple-carry adder is simple but slow. In 1958, engineers at IBM developed the carry-lookahead adder for the IBM 7090. Instead of waiting for carries to propagate, it calculates all carries simultaneously using additional logic:

```
G = A AND B  (Generate: produces carry regardless of input carry)
P = A XOR B  (Propagate: passes input carry through)

C1 = G0 OR (P0 AND C0)
C2 = G1 OR (P1 AND G0) OR (P1 AND P0 AND C0)
C3 = G2 OR (P2 AND G1) OR (P2 AND P1 AND G0) OR (P2 AND P1 AND P0 AND C0)
...
```

This reduces 32-bit addition from 32 gate delays to about 4.

---

## Further Reading

### In This Project
- `hdl/03_alu.m4hdl` - ALU with adder/subtractor
- `docs/micro4_isa.md` - How the CPU uses these circuits
- `docs/optimization_homework.md` - Exercises A7-A9 on carry/borrow

### External Resources
- *Digital Design and Computer Architecture* by Harris & Harris - Modern approach
- *Computer Arithmetic: Algorithms and Hardware Designs* by Parhami - Deep dive

---

## Summary

| Circuit | Function | Key Uses |
|---------|----------|----------|
| Half Adder | A + B → Sum, Carry | LSB addition |
| Full Adder | A + B + Cin → Sum, Cout | Multi-bit addition |
| Ripple Carry Adder | n-bit addition | ALU arithmetic |
| Multiplexer | Select 1 of n inputs | Data routing |
| Decoder | Binary → One-hot | Address decoding, instruction decode |
| Encoder | One-hot → Binary | Priority interrupt handling |
| Comparator | A vs B → GT, EQ, LT | Conditional operations |

**Key Insights:**
- Combinational circuits have no memory—output depends only on current inputs
- Complex functions are built by combining simple gates
- Trade-offs exist between speed (carry-lookahead) and simplicity (ripple-carry)
- Multiplexers are the "switches" of digital design—they route data

**Next Chapter:** [Sequential Logic](04_sequential_logic.md) - Adding memory with flip-flops
