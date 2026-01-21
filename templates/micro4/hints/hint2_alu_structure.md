# Hint 2: ALU Structure

<<<<<<< HEAD
## Key Insight: One Adder, Multiple Uses

You don't need separate circuits for ADD and SUB. Here's the clever trick:

```
Subtraction is addition in disguise!

A - B = A + (-B) = A + (~B + 1)
```

In two's complement, `-B` equals `~B + 1` (invert all bits, add 1).

So your ALU really just needs:
1. A way to optionally invert B
2. A 4-bit adder
3. A carry-in that's 1 for subtraction (the "+1" part)

## Block Diagram

```
   A[3:0] ─────────────────────────┐
                                   │
                                   v
   B[3:0] ───┬──>[INVERTER]──┬──>[MUX]───> B_adj[3:0]
             │               │     ^
             │               │     │
             └───────────────┘     │
                                   │
              OP[0] ───────────────┘
              (0=pass B, 1=invert B)

                    A        B_adj
                    │          │
                    v          v
                 ┌─────────────────┐
   OP[0] ───────>│   4-BIT ADDER   │───> R[3:0]
   (carry in)    │                 │───> Cout (C flag)
                 └─────────────────┘
                         │
                         v
                    ┌─────────┐
                    │ IS ZERO?│───> Z flag
                    └─────────┘
```

## The Building Blocks You Need

### 1. Full Adder (1-bit addition)
A full adder takes 3 inputs (A, B, Carry-in) and produces 2 outputs (Sum, Carry-out):

```
Inputs:  A, B, Cin
Outputs: Sum = A XOR B XOR Cin
         Cout = (A AND B) OR (Cin AND (A XOR B))
```

### 2. Four Full Adders Chained
Chain the carry-out of each adder to the carry-in of the next:

```
      A[0] B_adj[0]    A[1] B_adj[1]    A[2] B_adj[2]    A[3] B_adj[3]
         │    │           │    │           │    │           │    │
         v    v           v    v           v    v           v    v
Cin ──>[FA0]────C0────>[FA1]────C1────>[FA2]────C2────>[FA3]──── Cout
         │                │                │                │
         v                v                v                v
       R[0]             R[1]             R[2]             R[3]
```

### 3. Zero Detection
The Z flag is 1 when ALL result bits are 0:

```
Z = NOT(R[0] OR R[1] OR R[2] OR R[3])
```

## What About PASS Operation?

For PASS (loading a value), you could:
- Set A = 0 and do 0 + B = B
- Or add a bypass mux around the adder

The simple approach: just use the adder with A=0.

## Try It Yourself

Before looking at the next hint:
1. Write out the truth table for a full adder
2. Trace through an example: 5 - 3 = 0101 + (~0011 + 1) = 0101 + 1101 = 0010

---

**Still stuck?** Open `hint3_alu_implementation.md` for skeleton code.
=======
## Block Diagram

Here's how to structure your 4-bit ALU:

```
                    OP (operation select: 0=ADD, 1=SUB)
                              |
                              v
     A[3:0]              +----+----+
        |                | B_INV   |  <-- Conditionally invert B
        |                |  MUX    |
        |                +----+----+
        |                     |
        |    B[3:0]           | B_MODIFIED
        |       |             |
        v       v             v
    +---+-------+-------------+---+
    |                             |
    |    4-BIT RIPPLE ADDER       |
    |                             |
    |  Cin = OP (1 for subtract)  |
    |                             |
    +---+-------+-------+-----+---+
        |       |       |     |
        v       v       v     v
    RESULT[3] [2]     [1]   [0]     Cout
        |       |       |     |       |
        +---+---+---+---+             |
            |                         |
            v                         v
    +-------+-------+          +------+------+
    |  ZERO DETECT  |          | CARRY FLAG  |
    | (4-input NOR) |          |  (optional) |
    +-------+-------+          +-------------+
            |
            v
         Z_FLAG
```

## The Adder/Subtractor Trick

The brilliant insight: **one circuit does both ADD and SUB!**

- **Addition**: A + B + 0 = A + B
- **Subtraction**: A + (~B) + 1 = A - B (two's complement!)

So your circuit needs:
1. **XOR gates** to conditionally invert B when OP=1
2. **Carry-in** connected to OP (adds 1 for subtraction)

```
    B[i] ----+---[XOR]----> B_MODIFIED[i]
             |     ^
    OP ------+-----+
```

When OP=0: B passes through unchanged (B XOR 0 = B)
When OP=1: B is inverted (B XOR 1 = ~B)

## Full Adder Review

Each bit position needs a full adder:

```
      A[i]   B_MOD[i]   Cin
        |       |        |
        v       v        v
    +---+-------+--------+---+
    |      FULL ADDER        |
    |                        |
    |   Sum = A XOR B XOR C  |
    |   Cout = AB + BC + AC  |
    +---+--------+-----------+
        |        |
        v        v
     SUM[i]    Cout --> Cin of next bit
```

## Zero Detection

Result is zero when ALL bits are 0.

```
    RESULT[3] --+
                |
    RESULT[2] --+--> [4-input NOR] --> Z_FLAG
                |
    RESULT[1] --+
                |
    RESULT[0] --+
```

NOR gate: outputs 1 only when ALL inputs are 0. Perfect!

(Alternative: OR all bits together, then invert)

## Exercise: Draw Your Own

Before proceeding to code:

1. Draw the full 4-bit adder with all gates labeled
2. Add the B-inversion XOR gates
3. Add the zero-detection circuit
4. Count your gates:
   - How many XOR gates?
   - How many AND gates?
   - How many OR gates?

## Naming Convention for HDL

When you write the HDL, use clear naming:

```
# For the adder bit 0:
FA0_XOR1 (...)     # First XOR in full adder 0
FA0_XOR2 (...)     # Second XOR in full adder 0
FA0_AND1 (...)     # First AND in full adder 0
...

# For B inversion:
B_INV0 (...)       # XOR for inverting B[0]
B_INV1 (...)       # XOR for inverting B[1]
...

# For zero detection:
ZERO_OR1 (...)     # First stage of zero detect
ZERO_NOR (...)     # Final NOR
```

---

**Still stuck?** See `hint3_alu_implementation.md` for skeleton code.
>>>>>>> e0a7015c6d758cbc4977678e4b8043c68e2e1700
