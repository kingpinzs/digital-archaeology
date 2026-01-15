# Exercise 03: Add Carry Flag and Multi-Precision Arithmetic

**Difficulty:** Medium

**Estimated Time:** 45-60 minutes

---

## Goal

Add a **Carry Flag (C)** to the Micro4 CPU and implement:
- **ADC** (Add with Carry) instruction
- **JC** (Jump if Carry) instruction
- **JNC** (Jump if No Carry) instruction

The carry flag enables multi-precision arithmetic - the ability to add numbers larger than 4 bits using multiple 4-bit additions.

---

## Prerequisites

- Understanding of the Micro4 ALU and instruction decoder
- Familiarity with binary addition and overflow
- Exercise 02 recommended (understanding of flags) but not required

---

## Current State (What Exists)

### The ALU

The ALU performs 4-bit addition: `Result = A + B`

But what happens when the sum exceeds 4 bits?

```
  1111 (15)
+ 0001 (1)
------
 10000 (16) -- but we only store 0000!
```

The result wraps around to 0, and we lose the "1" that carried out. This is the **carry out** bit.

### Looking at the HDL

In `hdl/04_micro4_cpu.m4hdl`:

```
wire [3:0] alu_result;
wire alu_zero;
wire alu_carry;  # Declared but not connected!
```

The `alu_carry` signal exists but isn't implemented.

---

## What to Add

### 1. Carry Flag Storage

Add a flip-flop to store the carry flag:

```
# Carry Flag
wire c_flag;
wire c_flag_next;
wire c_load;

dff CARRY_FF (input: c_flag_next clk, output: c_flag);
```

### 2. Carry Out Detection

A 4-bit adder produces a 5-bit result. The 5th bit is the carry out:

```
Full addition: A[3:0] + B[3:0] + Cin = Sum[3:0], Cout

For a ripple-carry adder, the carry propagates through each bit:
  C0 = Cin (or 0 for ADD, 1 for SUB's two's complement)
  C1 = G0 + P0*C0  where G=A*B (generate), P=A XOR B (propagate)
  C2 = G1 + P1*C1
  C3 = G2 + P2*C2
  Cout = G3 + P3*C3
```

If you have a simple ripple adder, the final full adder's carry-out IS the carry flag:

```
# Assuming last full adder stage outputs carry
buf CARRY_OUT (input: fa3_cout, output: alu_carry);

# Connect to flag input (with MUX for SUB's borrow inversion if needed)
buf CARRY_TO_FLAG (input: alu_carry, output: c_flag_next);
```

### 3. ADC Instruction (Add with Carry)

**Suggested opcode:** 0x9

ADC performs: `A = A + mem[addr] + C`

This is like ADD, but includes the carry flag as an additional input:

```
# Decoder for ADC
# is_adc = op3 & !op2 & !op1 & op0  (1001 = 0x9)
wire adc_t;
and DEC_ADC1 (input: opcode[3] op2n, output: adc_t_1);
and DEC_ADC2 (input: op1n opcode[0], output: adc_t_2);
and DEC_ADC3 (input: adc_t_1 adc_t_2, output: is_adc);
```

For the ALU, you need to include the carry flag as a carry-in:

```
# Carry-in for ADC: use existing C flag
# For ADD: carry-in = 0
# For ADC: carry-in = c_flag
wire alu_cin;
and ADC_CIN (input: is_adc c_flag, output: alu_cin);
```

### 4. JC and JNC Instructions

**Suggested opcodes:**
- 0xA = JC (Jump if Carry set)
- 0xB = JNC (Jump if Carry clear)

Decoder:
```
# is_jc = op3 & !op2 & op1 & !op0  (1010 = 0xA)
# is_jnc = op3 & !op2 & op1 & op0  (1011 = 0xB)
```

Control logic:
```
# JC condition: is_jc AND c_flag
wire jc_condition;
and JC_COND (input: is_jc c_flag, output: jc_condition);

# JNC condition: is_jnc AND NOT c_flag
wire c_flag_n, jnc_condition;
not C_INVERT (input: c_flag, output: c_flag_n);
and JNC_COND (input: is_jnc c_flag_n, output: jnc_condition);

# Update take_jump
or JUMP_COND (input: is_jmp jz_cond jnz_cond jc_condition jnc_condition, output: take_jump);
```

### 5. C Flag Update Rules

The carry flag should be updated by:
- **ADD**: Set to carry-out of addition
- **SUB**: Set to borrow (inverted carry-out, or use SUB's carry semantics)
- **ADC**: Set to carry-out of addition with carry

**Important subtraction note:** There are two conventions:
1. **C = borrow**: C=1 means subtraction borrowed (A < B)
2. **C = NOT borrow**: C=0 means subtraction borrowed (6502 style)

For simplicity, we'll use: `C = carry_out` for both ADD and SUB.

---

## Test Program

Create `programs/test_carry.asm`:

```asm
; test_carry.asm - Test carry flag and ADC instruction
; Demonstrates 8-bit addition using two 4-bit operations
;
; Calculate: 0x2B + 0x1E = 0x49 (43 + 30 = 73)
;
; Low nibbles:  0xB + 0xE = 0x19 (carry out! 11 + 14 = 25 = 0x19)
;               Result: 0x9, Carry = 1
; High nibbles: 0x2 + 0x1 + Carry(1) = 0x4
;               Result: 0x4, Carry = 0
;
; Final: 0x49

        ORG 0x00

START:
        ; First: Add low nibbles
        LDA NUM1_LO     ; A = 0xB (low nibble of 0x2B)
        ADD NUM2_LO     ; A = 0xB + 0xE = 0x9, C = 1 (carry!)
        STA RESULT_LO   ; Store low result

        ; Second: Add high nibbles WITH carry
        LDA NUM1_HI     ; A = 0x2 (high nibble of 0x2B)
        ADC NUM2_HI     ; A = 0x2 + 0x1 + 1 = 0x4, C = 0
        STA RESULT_HI   ; Store high result

        ; Verify by checking carry was used
        JC  FAIL        ; C should be 0 after second add
        JMP CHECK

FAIL:   LDI 0
        STA RESULT_HI   ; Mark as failed
        HLT

CHECK:
        ; Final verification: load and display results
        LDA RESULT_HI
        HLT

; Data section
        ORG 0x30
NUM1_LO:   DB  0xB      ; Low nibble of 0x2B (43)
NUM1_HI:   DB  0x2      ; High nibble of 0x2B
NUM2_LO:   DB  0xE      ; Low nibble of 0x1E (30)
NUM2_HI:   DB  0x1      ; High nibble of 0x1E
RESULT_LO: DB  0        ; Should be 0x9
RESULT_HI: DB  0        ; Should be 0x4 (giving 0x49 = 73)
```

Simple carry flag test:

```asm
; test_carry_simple.asm - Basic carry flag verification

        ORG 0x00

        ; Test 1: Addition without carry
        LDI 5           ; A = 5
        ADD THREE       ; A = 5 + 3 = 8, no carry
        JC  FAIL        ; Should NOT jump

        ; Test 2: Addition WITH carry
        LDI 0xF         ; A = 15 (0xF)
        ADD ONE         ; A = 15 + 1 = 0 (wrapped), C = 1
        JNC FAIL        ; Should NOT jump (carry IS set)
        JZ  PASS        ; Result is 0, so Z should be set too

FAIL:   LDI 0
        STA RESULT
        HLT

PASS:   LDI 1
        STA RESULT
        HLT

; Data
        ORG 0x30
ONE:    DB  1
THREE:  DB  3
RESULT: DB  0xFF        ; 1 = pass, 0 = fail
```

---

## Verification

After implementing the carry flag:

1. Test the simple carry test:
   ```bash
   ./assembler ../../programs/test_carry_simple.asm -o test.bin
   ./emulator test.bin
   ```
   Expected: RESULT = 1

2. Test 8-bit addition:
   ```bash
   ./assembler ../../programs/test_carry.asm -o test.bin
   ./emulator test.bin
   ```
   Expected: RESULT_LO = 0x9, RESULT_HI = 0x4 (representing 0x49 = 73)

3. Verify carry truth table:
   | A | + | B | = | Result | Carry |
   |---|---|---|---|--------|-------|
   | 7 | + | 3 | = | 10 (A) | 0 |
   | 8 | + | 8 | = | 0 | 1 |
   | F | + | 1 | = | 0 | 1 |
   | F | + | F | = | E | 1 |

---

## Hints

<details>
<summary>Hint 1: Extracting carry from adder</summary>

If you're using a ripple-carry adder with full adders, the carry-out comes from the last (MSB) full adder:

```
Full Adder 3 (bit 3):
  Inputs: A[3], B[3], C_in from FA2
  Outputs: Sum[3], C_out  <-- THIS is your carry flag!
```

If you built the ALU differently, trace through to find where the 5th bit of the sum would be.
</details>

<details>
<summary>Hint 2: Carry-in for ADC</summary>

ADC needs to add three things: A + B + Carry

The carry input to your adder should be:
- 0 for regular ADD
- c_flag for ADC

```
wire alu_cin;
mux2 CIN_SELECT (input: gnd c_flag is_adc, output: alu_cin);
```

Then use alu_cin as the carry-in to your first full adder.
</details>

<details>
<summary>Hint 3: SUB and the carry flag</summary>

Subtraction A - B is typically implemented as A + (~B) + 1 (two's complement).

For SUB without borrow: carry-in = 1, carry-out indicates NO borrow
For SBC (subtract with carry): carry-in = c_flag

The relationship between carry and borrow can be confusing. A simple approach:
- After ADD/ADC: C = overflow occurred (result > 15)
- After SUB: C = no borrow needed (A >= B)
</details>

<details>
<summary>Hint 4: When to update C flag</summary>

Update c_flag when:
- is_add is active
- is_adc is active
- is_sub is active (if you want SUB to affect carry)

Do NOT update C for:
- LDI, LDA, STA (loads/stores)
- JMP, JZ, JNZ, JC, JNC (jumps)
- HLT

```
wire c_update;
or C_UPDATE (input: is_add is_adc is_sub, output: c_update);
```
</details>

<details>
<summary>Hint 5: Complete implementation checklist</summary>

1. [ ] Add c_flag flip-flop
2. [ ] Connect carry-out from ALU to c_flag_next
3. [ ] Add carry-in MUX (0 for ADD, c_flag for ADC)
4. [ ] Implement ADC decoder (opcode 0x9)
5. [ ] Implement JC decoder (opcode 0xA)
6. [ ] Implement JNC decoder (opcode 0xB)
7. [ ] Add JC/JNC to jump condition logic
8. [ ] Add c_load control signal
9. [ ] Test with simple carry test
10. [ ] Test with 8-bit addition
</details>

---

## Expected Outcome

After completing this exercise:

1. The Micro4 CPU has a Carry flag (C) stored in a flip-flop
2. New instructions work correctly:
   - **ADC addr** (0x9): A = A + mem[addr] + C
   - **JC addr** (0xA): Jump if C = 1
   - **JNC addr** (0xB): Jump if C = 0
3. ADD and SUB update the carry flag based on overflow/borrow

Test output for 8-bit addition (43 + 30 = 73):
```
RESULT_LO = 0x9
RESULT_HI = 0x4
Combined = 0x49 = 73 decimal
```

---

## Why This Matters

### Multi-Precision Arithmetic

A 4-bit CPU can only represent 0-15. But with the carry flag, you can chain operations:

```asm
; 16-bit addition: [B:A] + [D:C] = [F:E]
        LDA A_LO
        ADD C_LO        ; Low bytes, may set carry
        STA E_LO
        LDA A_HI
        ADC C_HI        ; High bytes, includes carry
        STA E_HI
```

This technique scales: 32-bit, 64-bit, arbitrary precision!

### Historical Context

- **Intel 4004** (1971): Had carry flag, enabled 8-bit math on a 4-bit ALU
- **6502** (1975): C flag used for both carry and borrow
- **Z80** (1976): CY (carry) flag with ADC and SBC instructions

The carry flag was essential for early computers to perform useful arithmetic despite small word sizes.

### Beyond Addition

The carry flag also enables:
- Multi-precision subtraction (SBC)
- Rotation through carry (for multi-word shifts)
- Comparison (CMP sets carry based on A >= B)
- Unsigned conditional branching

---

## Next Exercise

Continue to [Exercise 04: Add Shift and Rotate](04_add_shift_rotate.md) to implement bit manipulation instructions.
