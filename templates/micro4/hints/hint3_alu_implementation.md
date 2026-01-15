# Hint 3: ALU Implementation

## Skeleton Code

Here's a partial implementation. Fill in the `TODO` sections.

```hdl
# ============================================
# 4-Bit ALU - Add/Subtract with Zero Flag
# ============================================
#
# Inputs:
#   A[3:0]  - First operand (from accumulator)
#   B[3:0]  - Second operand (from MDR)
#   OP      - Operation: 0=ADD, 1=SUB
#
# Outputs:
#   R[3:0]  - Result
#   Z       - Zero flag (1 if result is 0000)
#   Cout    - Carry out (optional)

wire [3:0] a;      # Input A
wire [3:0] b;      # Input B
wire op;           # Operation select
wire [3:0] r;      # Result
wire z;            # Zero flag
wire cout;         # Carry out

# ----------------------------------------
# Step 1: B Inversion for Subtraction
# ----------------------------------------
# When OP=1, we need ~B (invert each bit)
# XOR with 1 inverts, XOR with 0 passes through

wire [3:0] b_mod;  # B modified (inverted if subtracting)

xor B_INV0 (input: b[0] op, output: b_mod[0]);
xor B_INV1 (input: b[1] op, output: b_mod[1]);
# TODO: Complete for bits 2 and 3
# xor B_INV2 (input: ???, output: ???);
# xor B_INV3 (input: ???, output: ???);

# ----------------------------------------
# Step 2: Full Adder Chain
# ----------------------------------------
# Ripple carry: each adder's Cout feeds next adder's Cin
# For subtract, initial Cin = 1 (comes from OP signal)

wire c0, c1, c2, c3;  # Carry chain

# Full Adder 0 (LSB)
# Cin = op (0 for add, 1 for subtract)
wire fa0_xor1, fa0_xor2, fa0_and1, fa0_and2, fa0_and3;

xor FA0_XOR1 (input: a[0] b_mod[0], output: fa0_xor1);
xor FA0_XOR2 (input: fa0_xor1 op, output: r[0]);        # Sum bit

# Carry out: (A AND B) OR (A AND Cin) OR (B AND Cin)
and FA0_AND1 (input: a[0] b_mod[0], output: fa0_and1);
and FA0_AND2 (input: a[0] op, output: fa0_and2);
and FA0_AND3 (input: b_mod[0] op, output: fa0_and3);

wire fa0_or1;
or FA0_OR1 (input: fa0_and1 fa0_and2, output: fa0_or1);
or FA0_OR2 (input: fa0_or1 fa0_and3, output: c0);

# Full Adder 1
wire fa1_xor1, fa1_and1, fa1_and2, fa1_and3, fa1_or1;

xor FA1_XOR1 (input: a[1] b_mod[1], output: fa1_xor1);
xor FA1_XOR2 (input: fa1_xor1 c0, output: r[1]);        # Sum bit

and FA1_AND1 (input: a[1] b_mod[1], output: fa1_and1);
and FA1_AND2 (input: a[1] c0, output: fa1_and2);
and FA1_AND3 (input: b_mod[1] c0, output: fa1_and3);
or FA1_OR1 (input: fa1_and1 fa1_and2, output: fa1_or1);
or FA1_OR2 (input: fa1_or1 fa1_and3, output: c1);

# TODO: Full Adder 2
# Follow the same pattern as FA0 and FA1
# Inputs: a[2], b_mod[2], c1
# Outputs: r[2], c2
#
# wire fa2_xor1, fa2_and1, fa2_and2, fa2_and3, fa2_or1;
# xor FA2_XOR1 (input: ???, output: fa2_xor1);
# xor FA2_XOR2 (input: ???, output: r[2]);
# ... continue the pattern ...

# TODO: Full Adder 3 (MSB)
# Inputs: a[3], b_mod[3], c2
# Outputs: r[3], c3 (which becomes cout)

# ----------------------------------------
# Step 3: Zero Flag Detection
# ----------------------------------------
# Z = 1 when r[3:0] = 0000
# NOR of all result bits, or: NOT(r[0] OR r[1] OR r[2] OR r[3])

wire z_or1, z_or2, z_or3;

# TODO: Implement zero detection
# or Z_OR1 (input: r[0] r[1], output: z_or1);
# or Z_OR2 (input: ???, output: z_or2);
# or Z_OR3 (input: ???, output: z_or3);
# not Z_NOT (input: z_or3, output: z);

# ----------------------------------------
# Step 4: Carry Out (Optional)
# ----------------------------------------
# The final carry out from bit 3
# buf CARRY_OUT (input: c3, output: cout);
```

## Your Tasks

### Task 1: Complete B Inversion
Add the XOR gates for bits 2 and 3. This should be straightforward - just follow the pattern.

### Task 2: Implement Full Adders 2 and 3
Each full adder needs:
- 2 XOR gates (for sum)
- 3 AND gates (for carry terms)
- 2 OR gates (to combine carry terms)

Total per adder: 7 gates

### Task 3: Implement Zero Detection
Options:
- Four-input NOR gate (if your HDL supports it)
- OR tree followed by NOT

### Task 4: Test Your ALU

Create test cases:
```
# Test ADD
A=0001, B=0010, OP=0 -> R=0011, Z=0
A=0111, B=0001, OP=0 -> R=1000, Z=0
A=1111, B=0001, OP=0 -> R=0000, Z=1, Cout=1

# Test SUB
A=0101, B=0010, OP=1 -> R=0011, Z=0
A=0011, B=0011, OP=1 -> R=0000, Z=1
A=0010, B=0101, OP=1 -> R=1101, Z=0 (negative in 2's complement)
```

## Common Mistakes

1. **Forgetting carry-in for subtract**: The initial carry must be 1 for subtraction
2. **Wrong carry logic**: Double-check (A AND B) OR (A AND C) OR (B AND C)
3. **Mixing up bit indices**: Be consistent with [0] being LSB
4. **Zero flag timing**: Make sure it uses the RESULT, not the inputs

## Gate Count Check

Your complete ALU should have approximately:
- 4 XOR gates for B inversion
- 28 gates for 4 full adders (7 each)
- ~4 gates for zero detection

**Total: ~36 gates** (not counting buffers)

---

**Ready for the Control Unit?** See `hint4_control_concept.md`
