# Hint 2: ALU Structure

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
