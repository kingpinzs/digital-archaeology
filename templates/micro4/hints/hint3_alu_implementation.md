# Hint 3: ALU Implementation

## Skeleton Code

<<<<<<< HEAD
Here's the structure of your ALU in M4HDL. The core logic is left for you to complete.

```m4hdl
# ============================================
# 4-Bit ALU Implementation
# ============================================

# --- Input/Output Declarations ---
wire [3:0] alu_a;      # First operand
wire [3:0] alu_b;      # Second operand
wire [1:0] alu_op;     # Operation: 00=ADD, 01=SUB, 10=PASS
wire [3:0] alu_r;      # Result
wire alu_z;            # Zero flag
wire alu_c;            # Carry flag

# --- Internal Wires ---
wire [3:0] alu_b_inv;  # Inverted B (for subtraction)
wire [3:0] alu_b_adj;  # B or ~B depending on operation
wire alu_cin;          # Carry-in (1 for SUB)

# ============================================
# Step 1: B Inverter
# ============================================
# Invert each bit of B (needed for subtraction)
not ALU_INV0 (input: alu_b[0], output: alu_b_inv[0]);
not ALU_INV1 (input: alu_b[1], output: alu_b_inv[1]);
not ALU_INV2 (input: alu_b[2], output: alu_b_inv[2]);
not ALU_INV3 (input: alu_b[3], output: alu_b_inv[3]);

# ============================================
# Step 2: B Selector Mux
# ============================================
# Select between B (for ADD) and ~B (for SUB)
# alu_b_adj[i] = alu_op[0] ? alu_b_inv[i] : alu_b[i]
#
# Implement using: (B AND NOT op[0]) OR (B_inv AND op[0])

wire alu_op0n;
not ALU_OP0N (input: alu_op[0], output: alu_op0n);

# TODO: For each bit (0-3), implement the mux:
#   wire alu_b_sel_X_0;  # B[X] AND NOT op[0]
#   wire alu_b_sel_X_1;  # B_inv[X] AND op[0]
#   and ALU_BSELX_0 (input: alu_b[X] alu_op0n, output: alu_b_sel_X_0);
#   and ALU_BSELX_1 (input: alu_b_inv[X] alu_op[0], output: alu_b_sel_X_1);
#   or  ALU_BADJX (input: alu_b_sel_X_0 alu_b_sel_X_1, output: alu_b_adj[X]);

# ============================================
# Step 3: Carry-In
# ============================================
# For SUB, carry-in must be 1 (completes the two's complement)
# For ADD, carry-in is 0
buf ALU_CIN (input: alu_op[0], output: alu_cin);

# ============================================
# Step 4: 4-Bit Ripple-Carry Adder
# ============================================
# Chain four full adders together.
#
# Full Adder equations:
#   Sum  = A XOR B XOR Cin
#   Cout = (A AND B) OR (Cin AND (A XOR B))
#
# Carry chain: Cin -> FA0 -> c0 -> FA1 -> c1 -> FA2 -> c2 -> FA3 -> alu_c

wire alu_c0, alu_c1, alu_c2;  # Internal carries

# TODO: Implement Full Adder 0
# Inputs: alu_a[0], alu_b_adj[0], alu_cin
# Outputs: alu_r[0], alu_c0

# Example for FA0:
#   wire alu_s0_t;   # A XOR B (intermediate)
#   wire alu_c0_t1;  # A AND B
#   wire alu_c0_t2;  # (A XOR B) AND Cin
#   xor ALU_FA0_X1 (input: alu_a[0] alu_b_adj[0], output: alu_s0_t);
#   and ALU_FA0_A1 (input: alu_a[0] alu_b_adj[0], output: alu_c0_t1);
#   xor ALU_FA0_X2 (input: alu_s0_t alu_cin, output: alu_r[0]);
#   and ALU_FA0_A2 (input: alu_s0_t alu_cin, output: alu_c0_t2);
#   or  ALU_FA0_O1 (input: alu_c0_t1 alu_c0_t2, output: alu_c0);

# TODO: Implement Full Adders 1, 2, 3 (same pattern)
# Remember: each FA's carry-in is the previous FA's carry-out
# FA3's carry-out becomes alu_c (the carry flag)

# ============================================
# Step 5: Zero Flag
# ============================================
# Z = 1 when result is 0000
# Z = NOT(R[0] OR R[1] OR R[2] OR R[3])

# TODO: Implement zero detection
#   wire alu_z_t1, alu_z_t2, alu_z_t3;
#   or ALU_Z1 (input: alu_r[0] alu_r[1], output: alu_z_t1);
#   or ALU_Z2 (input: alu_r[2] alu_r[3], output: alu_z_t2);
#   or ALU_Z3 (input: alu_z_t1 alu_z_t2, output: alu_z_t3);
#   not ALU_Z4 (input: alu_z_t3, output: alu_z);
```

## How to Add a Single Operation

Let's walk through implementing one full adder (FA0) step by step:

```m4hdl
# Full Adder 0: adds bit 0 of A and B_adj with carry-in
# Inputs: alu_a[0], alu_b_adj[0], alu_cin
# Outputs: alu_r[0] (sum), alu_c0 (carry-out)

# Intermediate wires
wire alu_s0_t;    # Holds A[0] XOR B_adj[0]
wire alu_c0_t1;   # Holds A[0] AND B_adj[0]
wire alu_c0_t2;   # Holds (A XOR B) AND Cin

# Sum = A XOR B XOR Cin (two XOR gates)
xor ALU_FA0_X1 (input: alu_a[0] alu_b_adj[0], output: alu_s0_t);
xor ALU_FA0_X2 (input: alu_s0_t alu_cin, output: alu_r[0]);

# Carry = (A AND B) OR ((A XOR B) AND Cin)
and ALU_FA0_A1 (input: alu_a[0] alu_b_adj[0], output: alu_c0_t1);
and ALU_FA0_A2 (input: alu_s0_t alu_cin, output: alu_c0_t2);
or  ALU_FA0_O1 (input: alu_c0_t1 alu_c0_t2, output: alu_c0);
```

## Your Task

1. Copy the skeleton code into your starter file
2. Complete the B selector mux (Step 2) for all 4 bits
3. Implement all 4 full adders (Step 4)
4. Implement zero detection (Step 5)

## Verification

Test your ALU with these examples:

| A    | B    | OP | Expected R | Expected Z | Expected C |
|------|------|----|------------|------------|------------|
| 0011 | 0010 | ADD| 0101       | 0          | 0          |
| 0101 | 0011 | SUB| 0010       | 0          | 1          |
| 0011 | 0011 | SUB| 0000       | 1          | 1          |
| 1111 | 0001 | ADD| 0000       | 1          | 1          |

Note: For SUB, carry=1 means "no borrow" (A >= B).

---

**ALU complete?** Move on to `hint4_control_concept.md` for the control unit.
=======
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
>>>>>>> e0a7015c6d758cbc4977678e4b8043c68e2e1700
