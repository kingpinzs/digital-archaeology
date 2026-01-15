# Logic Gates: The Building Blocks of Digital Circuits

## Prerequisites

- Binary number representation (see [01_binary_basics.md](01_binary_basics.md))
- Basic understanding of true/false logic

## Learning Objectives

After completing this chapter, you will be able to:

1. Describe the behavior of AND, OR, NOT, NAND, NOR, XOR, and XNOR gates
2. Read and write truth tables for any logic gate
3. Explain why NAND and NOR are called "universal gates"
4. Recognize standard gate symbols (ANSI and traditional)
5. Trace signal values through simple gate networks

---

## Introduction

In the previous chapter, we learned that computers work with binary—1s and 0s. But how does a computer actually *manipulate* these values? The answer is logic gates.

A logic gate is an electronic circuit that performs a logical operation on one or more inputs and produces a single output. Just as arithmetic has addition and multiplication, digital logic has AND, OR, and NOT. From these simple operations, we can build anything—from a simple calculator to a supercomputer.

---

## Core Concepts

### 1. What Is a Logic Gate?

A logic gate is a physical device (made of transistors) that implements a Boolean function. It takes binary inputs and produces a binary output based on a simple rule.

```
      ┌───────┐
 A ───┤       │
      │ GATE  ├─── Output
 B ───┤       │
      └───────┘
```

- **Inputs:** 1 or more binary signals (0 or 1)
- **Output:** A single binary signal (0 or 1)
- **Behavior:** Defined by a truth table

### 2. Truth Tables

A truth table lists all possible input combinations and the corresponding output. For n inputs, there are 2ⁿ rows.

**2-input gate: 4 rows (2² = 4)**

```
A | B | Output
--+---+-------
0 | 0 |   ?
0 | 1 |   ?
1 | 0 |   ?
1 | 1 |   ?
```

### 3. The NOT Gate (Inverter)

The simplest gate: one input, one output. It inverts (flips) the input.

**Truth Table:**

```
A | NOT A
--+------
0 |   1
1 |   0
```

**Symbols:**

```
ANSI (US):         Traditional:

    ┌───╲               ┌───┐
A ──┤    ╲──○── Y   A ──┤   ├──○── Y
    └───╱               └───┘

The circle (○) indicates inversion.
```

**ASCII Representation:**

```
       ╲
A ─────>○───── Y
       ╱
```

**In Plain Terms:** "If A is on, output is off. If A is off, output is on."

### 4. The AND Gate

Output is 1 only when ALL inputs are 1.

**Truth Table:**

```
A | B | A AND B
--+---+--------
0 | 0 |    0
0 | 1 |    0
1 | 0 |    0
1 | 1 |    1
```

**Symbol:**

```
      ┌────╲
A ────┤     ╲
      │      │───── Y
B ────┤     ╱
      └────╱
```

**In Plain Terms:** "Both A AND B must be on for output to be on."

**Analogy:** Two switches in series—both must be closed for current to flow.

```
    ┌─────┐    ┌─────┐
───○  A  ○────○  B  ○───→ Light
    └─────┘    └─────┘

Light on only if BOTH switches closed.
```

### 5. The OR Gate

Output is 1 when ANY input is 1.

**Truth Table:**

```
A | B | A OR B
--+---+-------
0 | 0 |   0
0 | 1 |   1
1 | 0 |   1
1 | 1 |   1
```

**Symbol:**

```
      ┌────╲
A ────┤     ╲
      │      >───── Y
B ────┤     ╱
      └────╱
```

**In Plain Terms:** "A OR B (or both) must be on for output to be on."

**Analogy:** Two switches in parallel—either can complete the circuit.

```
    ┌─────────────┐
    │   ┌─────┐   │
────┼───○  A  ○───┼────→ Light
    │   └─────┘   │
    │   ┌─────┐   │
    └───○  B  ○───┘
        └─────┘

Light on if EITHER switch closed.
```

### 6. The NAND Gate (NOT-AND)

NAND = AND followed by NOT. Output is 0 only when ALL inputs are 1.

**Truth Table:**

```
A | B | A NAND B
--+---+---------
0 | 0 |    1
0 | 1 |    1
1 | 0 |    1
1 | 1 |    0
```

**Symbol:** AND shape with inversion bubble

```
      ┌────╲
A ────┤     ╲
      │      │──○── Y
B ────┤     ╱
      └────╱
```

**In Plain Terms:** "NOT both on" — output is off only when both inputs are on.

### 7. The NOR Gate (NOT-OR)

NOR = OR followed by NOT. Output is 1 only when ALL inputs are 0.

**Truth Table:**

```
A | B | A NOR B
--+---+--------
0 | 0 |    1
0 | 1 |    0
1 | 0 |    0
1 | 1 |    0
```

**Symbol:** OR shape with inversion bubble

```
      ┌────╲
A ────┤     ╲
      │      >──○── Y
B ────┤     ╱
      └────╱
```

**In Plain Terms:** "Neither on" — output is on only when both inputs are off.

### 8. The XOR Gate (Exclusive OR)

Output is 1 when inputs are DIFFERENT.

**Truth Table:**

```
A | B | A XOR B
--+---+--------
0 | 0 |    0
0 | 1 |    1
1 | 0 |    1
1 | 1 |    0
```

**Symbol:** OR with extra curve

```
     ╱┌────╲
A ───╱┤     ╲
     ╲│      >───── Y
B ───╲┤     ╱
     ╱└────╱
```

**In Plain Terms:** "One or the other, but not both."

**XOR is crucial for:**
- Binary addition (sum bit)
- Parity checking
- Encryption (XOR is reversible: A ⊕ B ⊕ B = A)

### 9. The XNOR Gate (Exclusive NOR)

Output is 1 when inputs are the SAME.

**Truth Table:**

```
A | B | A XNOR B
--+---+---------
0 | 0 |    1
0 | 1 |    0
1 | 0 |    0
1 | 1 |    1
```

**Symbol:** XOR with inversion bubble

**In Plain Terms:** "Both same" — output is on when inputs match.

**XNOR is an equality detector.**

### 10. Universal Gates: NAND and NOR

**Amazing fact:** Any digital circuit can be built using ONLY NAND gates (or only NOR gates).

**Building NOT from NAND:**

```
Connect both inputs together:

A ────┬────┐
      │    │──○── NOT A
A ────┴────┘

NAND(A, A) = NOT(A AND A) = NOT(A)
```

**Building AND from NAND:**

```
A ────┬────┐      ┌────╲
      │    │──○───┤     │──○── A AND B
B ────┴────┘      └────╱

NAND(NAND(A,B), NAND(A,B)) = AND(A,B)
```

**Building OR from NAND:**

```
A ──┬──○──┐
    │     ├──○── A OR B
B ──┴──○──┘

NAND(NOT(A), NOT(B)) = OR(A,B)
```

**Why this matters:**
- Manufacturing can standardize on one gate type
- NAND/NOR are fastest in CMOS technology
- Historical note: Early computers used only NAND gates (Apollo Guidance Computer)

### 11. Multiple Input Gates

Gates can have more than 2 inputs.

**3-input AND:**

```
A | B | C | Output
--+---+---+-------
0 | 0 | 0 |   0
0 | 0 | 1 |   0
0 | 1 | 0 |   0
0 | 1 | 1 |   0
1 | 0 | 0 |   0
1 | 0 | 1 |   0
1 | 1 | 0 |   0
1 | 1 | 1 |   1
```

Only row where all inputs are 1 produces output 1.

**3-input OR:** Output is 1 if ANY input is 1.

**3-input XOR:** Output is 1 if ODD number of inputs are 1.

### 12. Gate Symbol Summary

```
┌──────────────────────────────────────────────────────────┐
│                    LOGIC GATE SYMBOLS                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  NOT (Inverter):          BUFFER:                       │
│       ╲                        ╲                        │
│  A ───>○─── Y             A ───>─── Y                   │
│       ╱                        ╱                        │
│                                                          │
│  AND:                     NAND:                         │
│      ┌───╲                    ┌───╲                     │
│  A ──┤    │                A ──┤    │                    │
│      │    ├── Y               │    ├─○── Y              │
│  B ──┤    │                B ──┤    │                    │
│      └───╱                    └───╱                     │
│                                                          │
│  OR:                      NOR:                          │
│      ┌────╲                   ┌────╲                    │
│  A ──┤     │               A ──┤     │                   │
│      │     >── Y              │     >─○── Y             │
│  B ──┤     │               B ──┤     │                   │
│      └────╱                   └────╱                    │
│                                                          │
│  XOR:                     XNOR:                         │
│     ╱┌────╲                  ╱┌────╲                    │
│  A ──┤     │              A ──┤     │                    │
│     ╲│     >── Y            ╲│     >─○── Y              │
│  B ──┤     │              B ──┤     │                    │
│     ╱└────╱                  ╱└────╱                    │
│                                                          │
│  ○ = Inversion bubble                                   │
└──────────────────────────────────────────────────────────┘
```

---

## Worked Example

**Problem:** Design a circuit that outputs 1 only when exactly one of two inputs is on.

**Analysis:**
- Output 1 when A=1, B=0
- Output 1 when A=0, B=1
- Output 0 when A=0, B=0
- Output 0 when A=1, B=1

**Solution:** This is exactly the XOR function!

**Implementation using basic gates:**

```
         ┌─────────────┐
A ───┬───┤             │
     │   │    AND   ───┤───┐
B ─┬─│─○─┤             │   │
   │ │   └─────────────┘   │   ┌──────────┐
   │ │                     ├───┤          │
   │ │   ┌─────────────┐   │   │   OR  ───┼─── Output
   │ │   │             │   │   │          │
   │ └─○─┤    AND   ───┼───┘   └──────────┘
   │     │             │
   └─────┤             │
         └─────────────┘

XOR = (A AND NOT B) OR (NOT A AND B)
```

**Trace for A=1, B=0:**

```
A = 1
B = 0
NOT B = 1
NOT A = 0
A AND NOT B = 1 AND 1 = 1
NOT A AND B = 0 AND 0 = 0
(1) OR (0) = 1 ✓
```

---

## Try It Yourself

### 1. Visualizer Practice

Open the Micro4 Circuit Builder (`visualizer/index.html`):

1. **AND Gate Demo:**
   - Drag a VDD, GND, two switches, an AND gate, and an LED onto the canvas
   - Connect VDD to both switch inputs
   - Connect switch outputs to AND gate logic inputs (A and B ports)
   - Connect VDD to AND gate power (top), GND to AND ground (bottom)
   - Connect AND output to LED, LED cathode to GND
   - Click "Simulate" and toggle switches to verify the truth table

2. **Build XOR from NAND:**
   - Using only NAND gates, implement XOR
   - Hint: You need 4 NAND gates

### 2. HDL Exploration

Examine `hdl/01_gates.m4hdl` and `hdl/02_gates_adv.m4hdl`:
- See how gates are defined at the transistor level
- Note how NAND is built from two transistors

---

## Common Mistakes

### 1. Confusing AND with OR

```
AND: All inputs must be 1  → "Strict"
OR:  Any input can be 1   → "Lenient"
```

Memory trick: AND is like multiplication (0 × anything = 0)

### 2. Forgetting the Inversion Bubble

NAND and NOR have inversion bubbles. Missing them changes everything:
- AND gives 1 only for (1,1)
- NAND gives 0 only for (1,1)

### 3. XOR Confusion with OR

```
OR(1,1)  = 1  (either or both)
XOR(1,1) = 0  (one or other, NOT both)
```

### 4. Ignoring Propagation Delay

Real gates take time (nanoseconds). For now, we treat them as instant, but in later chapters on pipelining, timing becomes crucial.

---

## Historical Context

### From Relays to Transistors

The evolution of logic gate technology:

**1830s - Electromechanical Relays:**
Charles Babbage considered using relays. Slow (milliseconds), noisy, wear out.

```
Relay as NOT gate:
    ┌──────────┐
    │ Coil     │
In ─┤    ╭─╮   │
    │    │ │   ├──── Out
    │    ╰─╯   │
    │ NC ○──○──│
    └──────────┘
When In=0, contact closed (Out=1)
When In=1, contact opens (Out=0)
```

**1940s - Vacuum Tubes:**
ENIAC used 18,000 vacuum tubes. Hot, unreliable, huge.

**1950s - Discrete Transistors:**
Bell Labs' transistor (1947) revolutionized computing. Smaller, faster, cooler.

**1960s - Integrated Circuits:**
Multiple transistors on one chip. The 7400 series TTL chips became the standard:
- 7400: Quad 2-input NAND
- 7402: Quad 2-input NOR
- 7404: Hex inverter
- 7408: Quad 2-input AND
- 7432: Quad 2-input OR

**1970s - CMOS:**
Complementary Metal-Oxide-Semiconductor. Lower power, higher density. Still used today.

**Today:**
Billions of transistors per chip. A modern CPU has more transistors than there are stars in the Milky Way.

### The Apollo Guidance Computer (1966)

The AGC used only NOR gates (about 5,600 of them) built from RTL (Resistor-Transistor Logic). It proved that a single gate type could build a complete computer—a remarkable engineering achievement that helped land humans on the Moon.

---

## Further Reading

### In This Project
- `hdl/01_gates.m4hdl` - Gate definitions in HDL
- `hdl/history/relay_logic.m4hdl` - How gates were built from relays
- `visualizer/index.html` - Interactive gate simulation

### External Resources
- *The Elements of Computing Systems* (Nand2Tetris) - Build a computer from NAND gates
- *Digital Design* by Morris Mano - Classic textbook
- Ben Eater's YouTube channel - Excellent visual explanations

---

## Summary

| Gate | Symbol | Output is 1 when... | Boolean |
|------|--------|---------------------|---------|
| NOT | `>○` | Input is 0 | Ā or !A |
| AND | `D` | ALL inputs are 1 | A · B |
| OR | `)` | ANY input is 1 | A + B |
| NAND | `D○` | NOT all inputs are 1 | (A · B)' |
| NOR | `)○` | NO input is 1 | (A + B)' |
| XOR | `))` | Inputs DIFFER | A ⊕ B |
| XNOR | `))○` | Inputs are SAME | (A ⊕ B)' |

**Key Insights:**
- NAND and NOR are universal—any circuit can be built from just one type
- Gates are the atoms of digital design; everything else is molecules
- Real gates have tiny delays, but at this level, we treat them as instant

**Next Chapter:** [Combinational Logic](03_combinational_logic.md) - Building useful circuits from gates
