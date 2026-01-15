# Exercise 03: Add Carry Flag and ADC/SBC Instructions

**Difficulty:** Medium

**Estimated Time:** 1-2 hours

---

## Goal

Add a Carry (C) flag to the Micro4 CPU along with ADC (Add with Carry) and SBC (Subtract with Borrow) instructions. This enables multi-precision arithmetic - the ability to work with numbers larger than 4 bits!

---

## Prerequisites

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

---

## What to Add

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

---

## Test Program

Create `programs/test_carry.asm`:

```asm
; test_carry.asm - Test carry flag and ADC/SBC
; Calculate: 0x1F + 0x25 = 0x44 (31 + 37 = 68)
; This is 8-bit math on a 4-bit CPU!

        ORG 0x00

START:
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

---

## Hints

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

</details>

---

## Expected Outcome

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

---

## Why This Matters

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

---

## Next Exercise

Proceed to **Exercise 04: Add Shift and Rotate Instructions** to enable bit manipulation.
