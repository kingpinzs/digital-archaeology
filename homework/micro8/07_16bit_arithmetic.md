# Exercise 07: 16-bit Arithmetic

**Difficulty:** ⭐⭐⭐⭐ Expert
**Time:** ~90-120 minutes
**Prerequisites:** Exercise 01 (Register Pairs), Exercise 06 (Addressing Modes)

---

## Goal

Implement 16-bit arithmetic operations on an 8-bit CPU. This enables working with values larger than 255 and addresses across the full 64KB memory space.

---

## Background

The Micro8 has an 8-bit ALU but needs to work with 16-bit values:
- Addresses (PC, SP, HL) are 16-bit
- Counters and accumulators may exceed 255
- Multi-precision math (32-bit, 64-bit) builds on 16-bit

The key insight: **cascade 8-bit operations using carry**.

### 16-bit Addition Example

Adding 0x1234 + 0x0567:

```
  0x1234
+ 0x0567
--------
  0x179B
```

Break into two 8-bit additions:

```
Step 1: Add low bytes (with no carry in)
  0x34 + 0x67 = 0x9B (carry out = 0)

Step 2: Add high bytes (with carry from step 1)
  0x12 + 0x05 + 0 = 0x17

Result: 0x179B
```

---

## Current State in HDL

From `hdl/05_micro8_cpu.m4hdl`:

```
# 16-bit Operations (0x90-0x96)
wire is_inc16_hl;      # 0x90 - INC16 HL
wire is_dec16_hl;      # 0x91 - DEC16 HL
wire is_inc16_bc;      # 0x92 - INC16 BC
wire is_dec16_bc;      # 0x93 - DEC16 BC
wire is_add16_hl_bc;   # 0x94 - ADD16 HL, BC
wire is_add16_hl_de;   # 0x95 - ADD16 HL, DE
wire is_neg;           # 0x96 - NEG R0 (two's complement)
```

---

## What to Implement

### Step 1: ADD16 HL, BC

Add the 16-bit BC register pair to HL:

```assembly
LDI16 HL, 0x1000
LDI16 BC, 0x0234
ADD16 HL, BC            ; HL = 0x1234
```

**Algorithm:**
```
L = L + C               ; 8-bit add, get carry
carry = (L + C > 0xFF)
H = H + B + carry       ; 8-bit add with carry
```

**HDL execution sequence:**
```
T1: ALU_A = L (R6), ALU_B = C (R2), ALU_OP = ADD
T2: L = ALU_RESULT, save ALU_CARRY to temp_carry
T3: ALU_A = H (R5), ALU_B = B (R1), ALU_CIN = temp_carry, ALU_OP = ADC
T4: H = ALU_RESULT
    Set flags based on final result
```

### Step 2: INC16 HL / DEC16 HL

Increment or decrement a 16-bit register pair:

```assembly
LDI16 HL, 0x00FF
INC16 HL                ; HL = 0x0100 (carry propagates)

LDI16 HL, 0x0100
DEC16 HL                ; HL = 0x00FF (borrow propagates)
```

**INC16 is ADD16 with value 1:**
```
L = L + 1
H = H + carry
```

**DEC16 is SUB16 with value 1:**
```
L = L - 1
borrow = (L was 0)
H = H - borrow
```

### Step 3: 16-bit Compare

Compare two 16-bit values for conditional branching:

```assembly
; Compare HL to BC
; No direct CMP16, but can do:
        PUSH R0
        MOV R0, R6      ; R0 = L
        CMP R0, R2      ; Compare L to C
        JNZ NOT_EQUAL   ; Low bytes differ
        MOV R0, R5      ; R0 = H
        CMP R0, R1      ; Compare H to B
        JNZ NOT_EQUAL   ; High bytes differ
        ; They're equal!
        POP R0
```

Alternative: Implement a 16-bit subtract that sets flags.

### Step 4: 32-bit Addition

Using 16-bit operations, add two 32-bit numbers:

```assembly
; 32-bit: NUM1 (4 bytes) + NUM2 (4 bytes) = RESULT (4 bytes)
; Little-endian: byte 0 is least significant

        ; Add bytes 0-1 (low word)
        LD16 HL, [NUM1+0]       ; Load low word of NUM1
        LD16 BC, [NUM2+0]       ; Load low word of NUM2
        ADD16 HL, BC            ; HL = low result
        ST16 HL, [RESULT+0]     ; Store low result
        ; Save carry for high word

        ; Add bytes 2-3 (high word) with carry
        LD16 HL, [NUM1+2]       ; Load high word of NUM1
        LD16 BC, [NUM2+2]       ; Load high word of NUM2
        ADC16 HL, BC            ; HL = high result + carry
        ST16 HL, [RESULT+2]     ; Store high result
```

**Note:** This requires `ADC16` (add with carry) which is ADD16 plus the carry from the previous addition.

### Step 5: Multiplication (16-bit × 8-bit)

Multiply 16-bit HL by 8-bit R0:

```assembly
; HL = HL * R0
; Result in DE:HL (32-bit, or truncated to HL)

MULT16:
        PUSH R1
        PUSH R2
        LDI16 DE, 0             ; DE = accumulator
        MOV R1, R0              ; R1 = multiplier counter

MULT_LOOP:
        CMPI R1, 0
        JZ MULT_DONE
        ADD16 DE, HL            ; DE += HL
        DEC R1
        JMP MULT_LOOP

MULT_DONE:
        MOV16 HL, DE            ; Result in HL (or leave in DE)
        POP R2
        POP R1
        RET
```

This is O(n) in the multiplier. For efficiency, use shift-and-add.

---

## Test Program

Test 32-bit addition:

```assembly
; 32bit_add.asm - Add two 32-bit numbers
; Tests carry propagation across 4 bytes

        .org 0x0200

START:
        LDI16 SP, 0x01FD

        ; ===== Test 1: Simple 16-bit add =====
        LDI16 HL, 0x1234
        LDI16 BC, 0x4321
        ADD16 HL, BC            ; HL = 0x5555
        ST R5, [RESULT1_H]      ; Expected: 0x55
        ST R6, [RESULT1_L]      ; Expected: 0x55

        ; ===== Test 2: 16-bit add with carry =====
        LDI16 HL, 0xFF00
        LDI16 BC, 0x0200
        ADD16 HL, BC            ; HL = 0x0100 (wraps, C=1)
        ST R5, [RESULT2_H]      ; Expected: 0x01
        ST R6, [RESULT2_L]      ; Expected: 0x00

        ; ===== Test 3: INC16 across boundary =====
        LDI16 HL, 0x00FF
        INC16 HL                ; HL = 0x0100
        ST R5, [RESULT3_H]      ; Expected: 0x01
        ST R6, [RESULT3_L]      ; Expected: 0x00

        ; ===== Test 4: DEC16 across boundary =====
        LDI16 HL, 0x0100
        DEC16 HL                ; HL = 0x00FF
        ST R5, [RESULT4_H]      ; Expected: 0x00
        ST R6, [RESULT4_L]      ; Expected: 0xFF

        ; ===== Test 5: Full 32-bit add =====
        ; 0x00012345 + 0x0000EDCB = 0x0002110F + 1 carry
        ; Actually: 0x00012345 + 0x0000EDCB = 0x00021110

        ; Load first number low word (0x2345) into HL
        LD R6, [NUM1+0]         ; L = 0x45
        LD R5, [NUM1+1]         ; H = 0x23
        ; Load second number low word (0xEDCB)
        LD R2, [NUM2+0]         ; C = 0xCB
        LD R1, [NUM2+1]         ; B = 0xED
        ; Add low words
        ADD16 HL, BC            ; HL = 0x2345 + 0xEDCB = 0x1110, C=1
        ST R6, [RESULT5+0]      ; Store low result low
        ST R5, [RESULT5+1]      ; Store low result high
        ; Save carry by checking if result < addend
        ; (Simplified: use ADC for high word)

        ; Load first number high word (0x0001)
        LD R6, [NUM1+2]         ; L = 0x01
        LD R5, [NUM1+3]         ; H = 0x00
        ; Load second number high word (0x0000)
        LD R2, [NUM2+2]         ; C = 0x00
        LD R1, [NUM2+3]         ; B = 0x00
        ; Add high words with carry
        ; Since we don't have ADC16, manually add carry:
        JNC NO_CARRY_IN
        INC16 HL                ; Add the carry
NO_CARRY_IN:
        ADD16 HL, BC            ; HL = 0x0001 + 0x0000 + 1 = 0x0002
        ST R6, [RESULT5+2]      ; Store high result low
        ST R5, [RESULT5+3]      ; Store high result high

        ; Verify: RESULT5 should be 0x00021110
        LD R0, [RESULT5+3]
        CMPI R0, 0x00
        JNZ FAIL
        LD R0, [RESULT5+2]
        CMPI R0, 0x02
        JNZ FAIL
        LD R0, [RESULT5+1]
        CMPI R0, 0x11
        JNZ FAIL
        LD R0, [RESULT5+0]
        CMPI R0, 0x10
        JNZ FAIL

        LDI R0, 0x00            ; Success
        ST R0, [FINAL]
        JMP DONE

FAIL:
        LDI R0, 0xFF
        ST R0, [FINAL]

DONE:
        HLT

; Data section
        .org 0x0500
; First 32-bit number: 0x00012345 (little-endian)
NUM1:   .db 0x45, 0x23, 0x01, 0x00

; Second 32-bit number: 0x0000EDCB (little-endian)
NUM2:   .db 0xCB, 0xED, 0x00, 0x00

; Results
        .org 0x0520
RESULT1_H:      .db 0   ; Expected: 0x55
RESULT1_L:      .db 0   ; Expected: 0x55
RESULT2_H:      .db 0   ; Expected: 0x01
RESULT2_L:      .db 0   ; Expected: 0x00
RESULT3_H:      .db 0   ; Expected: 0x01
RESULT3_L:      .db 0   ; Expected: 0x00
RESULT4_H:      .db 0   ; Expected: 0x00
RESULT4_L:      .db 0   ; Expected: 0xFF
RESULT5:        .db 0, 0, 0, 0  ; Expected: 0x10, 0x11, 0x02, 0x00
FINAL:          .db 0xFF ; Expected: 0x00
```

---

## Progressive Hints

<details>
<summary>Hint 1: ADD16 State Machine</summary>

Break ADD16 into two ALU operations:

```
state ADD16_LOW:
    ; L = L + C
    alu_a_sel = R6              ; L register
    alu_b_sel = R2              ; C register
    alu_op = ADD
    r6_next = alu_result
    r6_load = 1
    save carry to temp_c
    next_state = ADD16_HIGH

state ADD16_HIGH:
    ; H = H + B + carry
    alu_a_sel = R5              ; H register
    alu_b_sel = R1              ; B register
    alu_cin = temp_c
    alu_op = ADC
    r5_next = alu_result
    r5_load = 1
    ; Update flags from this operation
    flags_load = 1
    next_state = FETCH
```
</details>

<details>
<summary>Hint 2: Carry Preservation</summary>

The carry from the low-byte add must survive until the high-byte add:

Option 1: Temporary register
```
wire temp_carry;
; Set in ADD16_LOW, use in ADD16_HIGH
```

Option 2: Use the C flag
```
; After low add, C flag has carry
; ADC uses C flag as carry-in
; This is automatic if ALU is designed right
```

Option 2 is cleaner but requires careful ALU design.
</details>

<details>
<summary>Hint 3: Flags After 16-bit Operations</summary>

Which flags should ADD16 set?

- **Z flag**: Set if full 16-bit result is zero
  - Z = (H == 0) AND (L == 0)
- **C flag**: Carry out of the high byte
  - Set by the high-byte addition
- **S flag**: Sign of 16-bit result (bit 15)
  - S = H[7]
- **O flag**: Signed overflow
  - Complex: depends on operand signs and result sign

For simplicity, update flags from the high-byte operation only.
</details>

<details>
<summary>Hint 4: Subtraction (SUB16)</summary>

Subtraction uses the same pattern with borrow:

```
; SUB16 HL, BC: HL = HL - BC
L = L - C               ; Sets borrow if L < C
borrow = (L < C)
H = H - B - borrow      ; SBC
```

Two's complement alternative:
```
; Negate BC, then add
; -BC = ~BC + 1
; HL - BC = HL + (-BC) = HL + ~BC + 1
```
</details>

<details>
<summary>Hint 5: Efficient Multiplication</summary>

Shift-and-add multiplication (for 8×8 = 16-bit result):

```
; R0 * R1 = DE (16-bit result)
MULT:
        LDI16 DE, 0             ; Result = 0
        LDI R2, 8               ; 8 bits to process

MULT_LOOP:
        ; Shift result left
        SHL R4                  ; E << 1
        ROL R3                  ; D << 1 with carry from E

        ; Shift multiplier left, check high bit
        SHL R1                  ; Multiplier << 1, MSB to carry
        JNC MULT_SKIP           ; If MSB was 0, skip add
        ; Add multiplicand to result
        ADD R4, R0              ; E += multiplicand
        ADC R3, 0               ; D += carry

MULT_SKIP:
        DEC R2
        JRNZ MULT_LOOP
        RET
```

This is O(log n) - 8 iterations for 8-bit multiplier.
</details>

---

## Literature References

- **Patterson & Hennessy**: Multi-precision arithmetic
- **"Hacker's Delight"** by Henry S. Warren: Division and multiplication algorithms
- **Intel 8080/8085 Programming**: 16-bit operations on 8-bit CPU
- **Donald Knuth, "The Art of Computer Programming"**: Volume 2, Seminumerical Algorithms

---

## Expected Outcome

When complete, you should be able to:

1. Add 16-bit values with `ADD16`
2. Increment/decrement 16-bit pairs with `INC16`/`DEC16`
3. Handle carry propagation correctly
4. Extend to 32-bit and beyond
5. Implement multiplication using shifts and adds

---

## Verification Checklist

- [ ] `ADD16 HL, BC` adds correctly without carry (0x1234 + 0x4321 = 0x5555)
- [ ] `ADD16 HL, BC` handles carry (0xFF00 + 0x0200 = 0x0100, C=1)
- [ ] `INC16 HL` at 0x00FF becomes 0x0100
- [ ] `DEC16 HL` at 0x0100 becomes 0x00FF
- [ ] 32-bit addition works (0x00012345 + 0x0000EDCB = 0x00021110)
- [ ] Carry flag correctly set after 16-bit overflow

---

## Challenge Extensions

1. **SUB16**: 16-bit subtraction with borrow
2. **ADC16**: 16-bit add with carry input (for chaining)
3. **MUL16**: 16×16 = 32-bit multiplication
4. **DIV16**: 16/8 = 8-bit quotient and remainder
5. **Signed operations**: Handle sign extension and overflow

---

## Next Steps

With 16-bit arithmetic complete:
- **Exercise 08**: Critical Path - optimize the multi-cycle 16-bit operations
