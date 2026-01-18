# Hint 3: ALU Implementation

## Skeleton Code

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
