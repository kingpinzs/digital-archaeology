<<<<<<< HEAD
# Exercise 03: Add Carry Flag and Multi-Precision Arithmetic

**Difficulty:** Medium

**Estimated Time:** 45-60 minutes
=======
# Exercise 03: Add Carry Flag and ADC/SBC Instructions

**Difficulty:** Medium

**Estimated Time:** 1-2 hours
>>>>>>> e0a7015c6d758cbc4977678e4b8043c68e2e1700

---

## Goal

<<<<<<< HEAD
Add a **Carry Flag (C)** to the Micro4 CPU and implement:
- **ADC** (Add with Carry) instruction
- **JC** (Jump if Carry) instruction
- **JNC** (Jump if No Carry) instruction

The carry flag enables multi-precision arithmetic - the ability to add numbers larger than 4 bits using multiple 4-bit additions.
=======
Add a Carry (C) flag to the Micro4 CPU along with ADC (Add with Carry) and SBC (Subtract with Borrow) instructions. This enables multi-precision arithmetic - the ability to work with numbers larger than 4 bits!
>>>>>>> e0a7015c6d758cbc4977678e4b8043c68e2e1700

---

## Prerequisites

<<<<<<< HEAD
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
=======
- Understanding of binary addition and the concept of carry
- Knowledge of how the ALU performs ADD and SUB
- Familiarity with the existing Z flag implementation
- Completion of Exercises 01-02 recommended

---

## Current State

The Micro4 has a 4-bit accumulator, meaning it can only represent values 0-15 (0x0-0xF). When adding two numbers that exceed this range, information is lost:

```asm
; Current problem: What is 0xF + 0x3?
LDI 0xF         ; A = 15
ADD THREE       ; A = 15 + 3 = 18, but only lower 4 bits kept!
                ; Result: A = 0x2 (18 mod 16)
                ; The "1" that should have carried is LOST!
```

**Registers currently:**
- PC (8-bit): Program counter
- A (4-bit): Accumulator
- Z (1-bit): Zero flag

**Missing:** Carry flag to capture overflow from addition

---

## The Carry Concept

When adding two 4-bit numbers, the result can be 5 bits:
```
    1111  (15)
  + 0011  (3)
  ------
   10010  (18 = 0x12)
   ^
   |_ This bit is the CARRY OUT - it doesn't fit in 4 bits!
```

The carry flag captures this 5th bit:
- **C = 1**: Addition overflowed (result >= 16)
- **C = 0**: No overflow (result < 16)

For subtraction, the carry flag represents **borrow**:
- **C = 0**: Subtraction borrowed (A < B)
- **C = 1**: No borrow needed (A >= B)
>>>>>>> e0a7015c6d758cbc4977678e4b8043c68e2e1700

---

## What to Add

<<<<<<< HEAD
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
=======
### New Register

Add a 1-bit Carry flag register:
```hdl
wire c_flag;        ; Carry flag
wire c_flag_next;   ; Next carry value
wire c_load;        ; Load enable for carry
```

### New Instructions

| Opcode | Mnemonic | Operation | Description |
|--------|----------|-----------|-------------|
| 0xB | ADC addr | A = A + mem[addr] + C | Add with carry |
| 0xC | SBC addr | A = A - mem[addr] - !C | Subtract with borrow |
| 0xD | JC addr | if C: PC = addr | Jump if carry set |
| 0xE | JNC addr | if !C: PC = addr | Jump if carry clear |

### Modified Instructions

ADD and SUB should now update the carry flag:
- ADD: C = carry out of addition
- SUB: C = NOT borrow (1 if A >= B)
>>>>>>> e0a7015c6d758cbc4977678e4b8043c68e2e1700

---

## Test Program

Create `programs/test_carry.asm`:

```asm
<<<<<<< HEAD
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
=======
; test_carry.asm - Test carry flag and ADC/SBC
; Calculate: 0x1F + 0x25 = 0x44 (31 + 37 = 68)
; This is 8-bit math on a 4-bit CPU!
>>>>>>> e0a7015c6d758cbc4977678e4b8043c68e2e1700

        ORG 0x00

START:
<<<<<<< HEAD
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

=======
        ; Add low nibbles: 0xF + 0x5 = 0x14 (carry!)
        LDA NUM1_LO     ; A = 0xF
        ADD NUM2_LO     ; A = 0x4, C = 1
        STA RESULT_LO   ; Store low nibble

        ; Add high nibbles with carry: 0x1 + 0x2 + 1 = 0x4
        LDA NUM1_HI     ; A = 0x1
        ADC NUM2_HI     ; A = 0x1 + 0x2 + 1 = 0x4, C = 0
        STA RESULT_HI   ; Store high nibble

        ; Test JC/JNC
        LDI 0xF
        ADD ONE         ; 15 + 1 = 16, C = 1
        JC  CARRY_SET   ; Should branch

        ; This should NOT execute
        LDI 0xE
        STA TEST1
        JMP DONE

CARRY_SET:
        LDI 0xA
        STA TEST1       ; TEST1 = 0xA (indicates JC worked)

        ; Test JNC
        LDI 0x1
        ADD ONE         ; 1 + 1 = 2, C = 0
        JNC NO_CARRY    ; Should branch

        ; This should NOT execute
        LDI 0xE
        STA TEST2
        JMP DONE

NO_CARRY:
        LDI 0xB
        STA TEST2       ; TEST2 = 0xB (indicates JNC worked)

DONE:   HLT

; Data section
        ORG 0x40
NUM1_LO:   DB 0xF       ; Low nibble of 0x1F
NUM1_HI:   DB 0x1       ; High nibble of 0x1F
NUM2_LO:   DB 0x5       ; Low nibble of 0x25
NUM2_HI:   DB 0x2       ; High nibble of 0x25
RESULT_LO: DB 0         ; Should be 0x4 after execution
RESULT_HI: DB 0         ; Should be 0x4 after execution
TEST1:     DB 0         ; Should be 0xA (JC test)
TEST2:     DB 0         ; Should be 0xB (JNC test)
ONE:       DB 1

; Expected results:
; RESULT_LO (0x44) = 0x4
; RESULT_HI (0x45) = 0x4
; TEST1 (0x46) = 0xA
; TEST2 (0x47) = 0xB
```

>>>>>>> e0a7015c6d758cbc4977678e4b8043c68e2e1700
---

## Hints

<<<<<<< HEAD
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
=======
### Hint 1: ALU Carry Output
<details>
<summary>Click to reveal</summary>

A 4-bit adder produces a 5th bit - the carry out. If you're using a ripple-carry adder:

```hdl
; Full adder for bit 3 (MSB) produces carry_out
wire carry_out;  ; This becomes c_flag_next for ADD

; For the complete 4-bit adder:
;   bit 0: a[0] + b[0] + cin  -> sum[0], c0
;   bit 1: a[1] + b[1] + c0   -> sum[1], c1
;   bit 2: a[2] + b[2] + c1   -> sum[2], c2
;   bit 3: a[3] + b[3] + c2   -> sum[3], carry_out  <- This is C flag!
```

</details>

### Hint 2: ADC Implementation
<details>
<summary>Click to reveal</summary>

ADC is ADD with the carry flag as an additional input:
```
ADC: A = A + mem[addr] + C
```

The ALU needs a carry input (cin):
- For ADD: cin = 0
- For ADC: cin = c_flag

```hdl
wire alu_cin;
wire is_adc_or_sbc;
or ADC_SBC (input: is_adc is_sbc, output: is_adc_or_sbc);

; cin = c_flag when ADC, else 0
and CIN_MUX (input: is_adc c_flag, output: alu_cin);
```

</details>

### Hint 3: SBC and Borrow
<details>
<summary>Click to reveal</summary>

Subtraction with borrow is tricky. In most CPUs:
```
SBC: A = A - mem[addr] - !C
     (equivalent to: A = A - mem[addr] - 1 + C)
```

Why `!C`? Because after SUB:
- C = 1 means no borrow was needed (A >= B)
- C = 0 means borrow occurred (A < B)

So for SBC, if C=0 (previous borrow), we subtract one more.

Implementation using two's complement:
```
A - B - !C = A + (~B) + 1 - !C
           = A + (~B) + C
```

So for SBC: negate B, use C as carry-in!

</details>

### Hint 4: Carry Flag Register
<details>
<summary>Click to reveal</summary>

Similar to the Z flag, add a D flip-flop for C:

```hdl
wire c_flag;
wire c_flag_next;
wire c_load;

dff C_FLAG (input: c_flag_next clk, output: c_flag);

; c_flag_next comes from ALU carry_out
; c_load is active during ADD, SUB, ADC, SBC execute
```

When should C be updated?
- ADD: C = carry_out
- SUB: C = NOT borrow (usually implemented as carry_out of A + ~B + 1)
- ADC: C = carry_out
- SBC: C = carry_out

</details>

### Hint 5: Complete Decoder and Control
<details>
<summary>Click to reveal</summary>

Decoder additions:
```hdl
# is_adc = 1011
wire adc_t1, adc_t2;
and DEC_ADC1 (input: opcode[3] op2n, output: adc_t1);
and DEC_ADC2 (input: opcode[1] opcode[0], output: adc_t2);
and DEC_ADC3 (input: adc_t1 adc_t2, output: is_adc);

# is_sbc = 1100
wire sbc_t1, sbc_t2;
and DEC_SBC1 (input: opcode[3] opcode[2], output: sbc_t1);
and DEC_SBC2 (input: op1n op0n, output: sbc_t2);
and DEC_SBC3 (input: sbc_t1 sbc_t2, output: is_sbc);

# is_jc = 1101
and DEC_JC (input: sbc_t1 jmp_t, output: is_jc);  ; where jmp_t = !op1 & op0

# is_jnc = 1110
wire jnc_t;
and DEC_JNC1 (input: opcode[1] op0n, output: jnc_t);
and DEC_JNC2 (input: sbc_t1 jnc_t, output: is_jnc);
```

Control signals:
```hdl
; C flag load during arithmetic operations
wire arith_op;
or ARITH1 (input: is_add is_sub, output: arith_t);
or ARITH2 (input: is_adc is_sbc, output: arith_c);
or ARITH3 (input: arith_t arith_c, output: arith_op);
and C_LOAD (input: arith_op in_execute, output: c_load);

; JC/JNC branch logic
wire jc_taken, jnc_taken;
and JC_TAKE (input: is_jc c_flag, output: jc_taken);
not C_INV (input: c_flag, output: c_flag_n);
and JNC_TAKE (input: is_jnc c_flag_n, output: jnc_taken);
```

>>>>>>> e0a7015c6d758cbc4977678e4b8043c68e2e1700
</details>

---

## Expected Outcome

<<<<<<< HEAD
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
=======
After implementing the carry flag:

1. **8-bit math works:** 0x1F + 0x25 = 0x44 using ADC
2. **Carry flag updates:** ADD/SUB set C appropriately
3. **Branch on carry:** JC and JNC work correctly

### Verification Checklist

- [ ] C flag register added (1-bit DFF)
- [ ] ADD updates C flag with carry out
- [ ] SUB updates C flag (C=1 if no borrow)
- [ ] ADC adds with carry input
- [ ] SBC subtracts with borrow input
- [ ] JC branches when C=1
- [ ] JNC branches when C=0
- [ ] 8-bit addition test passes
>>>>>>> e0a7015c6d758cbc4977678e4b8043c68e2e1700

---

## Why This Matters

<<<<<<< HEAD
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
=======
The carry flag is **essential** for real computing:

1. **Multi-precision arithmetic:** Work with any size numbers
2. **Comparison:** After `SUB`, C indicates which was larger
3. **Shift operations:** Carry holds shifted-out bits
4. **BCD arithmetic:** Decimal adjustment needs carry

Example: 32-bit addition on a 4-bit CPU:
```asm
; Add two 32-bit numbers (8 nibbles each)
; NUM1 at 0x40-0x47, NUM2 at 0x48-0x4F, RESULT at 0x50-0x57

        LDA NUM1+0
        ADD NUM2+0      ; First nibble (sets carry)
        STA RESULT+0

        LDA NUM1+1
        ADC NUM2+1      ; Include carry from previous
        STA RESULT+1

        ; ... repeat for all 8 nibbles ...
```

The Intel 4004 had a carry flag for exactly this reason!
>>>>>>> e0a7015c6d758cbc4977678e4b8043c68e2e1700

---

## Next Exercise

<<<<<<< HEAD
Continue to [Exercise 04: Add Shift and Rotate](04_add_shift_rotate.md) to implement bit manipulation instructions.
=======
Proceed to **Exercise 04: Add Shift and Rotate Instructions** to enable bit manipulation.
>>>>>>> e0a7015c6d758cbc4977678e4b8043c68e2e1700
