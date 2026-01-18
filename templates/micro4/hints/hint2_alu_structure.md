# Hint 2: ALU Structure

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
