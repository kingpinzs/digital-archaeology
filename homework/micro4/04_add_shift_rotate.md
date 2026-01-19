# Exercise 04: Add Shift and Rotate Instructions

**Difficulty:** Hard

**Estimated Time:** 2-3 hours

---

## Goal

Add shift and rotate instructions to the Micro4 CPU: SHL (shift left), SHR (shift right), ROL (rotate left through carry), and ROR (rotate right through carry). These are essential for bit manipulation, multiplication, division, and multi-precision shifts.

---

## Prerequisites

- Understanding of binary representation and bit positions
- Completion of Exercise 03 (Carry Flag) - ROL/ROR require the carry flag
- Knowledge of the difference between shift and rotate operations
- Familiarity with ALU modifications

---

## Current State

The Micro4 ALU currently supports only ADD and SUB. There are no bit manipulation operations. To multiply by 2, programmers must use:

```asm
; Multiply A by 2 (shift left)
STA TEMP        ; Save A
ADD TEMP        ; A = A + A = A * 2
```

This is slow (10 cycles) and doesn't handle the carry-out properly. Real CPUs have dedicated shift hardware.

---

## Shift vs Rotate Operations

### Shift Operations
Bits move in one direction; empty positions filled with 0, shifted-out bit goes to carry:

```
SHL (Shift Left):
Before: C=0, A=0101
After:  C=0, A=1010
        ^         ^
        |         +-- 0 shifted in from right
        +-- old MSB (0) shifted into C

SHR (Shift Right):
Before: C=0, A=0101
After:  C=1, A=0010
            ^    ^
            |    +-- 0 shifted in from left
            +-- old LSB (1) shifted into C
```

### Rotate Operations
Bits rotate through the carry flag, preserving all bits:

```
ROL (Rotate Left through Carry):
Before: C=1, A=0101
After:  C=0, A=1011
        ^         ^
        |         +-- old C (1) rotated in from right
        +-- old MSB (0) rotated into C

ROR (Rotate Right through Carry):
Before: C=1, A=0101
After:  C=1, A=1010
        ^    ^
        |    +-- old C (1) rotated in from left
        +-- old LSB (1) rotated into C
```

---

## What to Add

### New Instructions

| Opcode | Mnemonic | Operation | Description |
|--------|----------|-----------|-------------|
| 0x8 | SHL | C,A = A << 1 | Shift left, MSB to C |
| 0x9 | SHR | A,C = A >> 1 | Shift right, LSB to C |
| 0xA | ROL | C,A = {A,C} << 1 | Rotate left through C |
| 0xB | ROR | A,C = {C,A} >> 1 | Rotate right through C |

**Note:** If you completed Exercises 01-02, you may need to reassign opcodes. One option:
- 0x8: INC
- 0x9: DEC
- 0xA: JNZ
- 0xB: ADC
- 0xC: SBC
- 0xD: JC
- 0xE: JNC
- 0xF: (reserved) or split into SHL/SHR/ROL/ROR

Alternative: Use sub-opcodes with a prefix byte, or use the operand nibble to select shift type:
- 0xF0: SHL
- 0xF1: SHR
- 0xF2: ROL
- 0xF3: ROR

### Instruction Format

All shift/rotate instructions are single-byte, operating only on the accumulator:
```
SHL: 0xF0 (using sub-opcode scheme)
SHR: 0xF1
ROL: 0xF2
ROR: 0xF3
```

---

## Test Program

Create `programs/test_shift.asm`:

```asm
; test_shift.asm - Test shift and rotate instructions
; Tests SHL, SHR, ROL, ROR

        ORG 0x00

START:
        ; Test SHL: 0101 << 1 = 1010, C=0
        LDI 0x5         ; A = 0101
        SHL             ; A = 1010, C = 0
        STA TEST_SHL    ; Should be 0xA

        ; Test SHL with carry out: 1001 << 1 = 0010, C=1
        LDI 0x9         ; A = 1001
        SHL             ; A = 0010, C = 1 (MSB shifted out)
        STA TEST_SHL2   ; Should be 0x2

        ; Verify carry was set
        JC  SHL_OK
        LDI 0xF         ; Error indicator
        STA TEST_SHL2
        JMP TEST_SHR
SHL_OK:

        ; Test SHR: 0101 >> 1 = 0010, C=1
TEST_SHR:
        LDI 0x5         ; A = 0101
        SHR             ; A = 0010, C = 1 (LSB shifted out)
        STA TEST_SHR1   ; Should be 0x2

        ; Verify carry was set
        JC  SHR_OK
        LDI 0xF
        STA TEST_SHR1
SHR_OK:

        ; Test ROL: with C=1, A=0101 -> A=1011, C=0
        LDI 0xF
        ADD ONE         ; Force C=1 (0xF + 1 = overflow)
        LDI 0x5         ; A = 0101, C still = 1
        ROL             ; A = 1011 (old C rotated in), new C = 0
        STA TEST_ROL    ; Should be 0xB

        ; Test ROR: with C=1, A=0101 -> A=1010, C=1
        LDI 0xF
        ADD ONE         ; Force C=1
        LDI 0x5         ; A = 0101, C = 1
        ROR             ; A = 1010 (C rotated into MSB), new C = 1
        STA TEST_ROR    ; Should be 0xA

        ; Test multi-bit shift (shift left by 2 = multiply by 4)
        LDI 0x3         ; A = 3
        SHL             ; A = 6
        SHL             ; A = 12 (0xC)
        STA TEST_MUL4   ; Should be 0xC

        HLT

; Data section
        ORG 0x40
TEST_SHL:  DB 0         ; Should be 0xA
TEST_SHL2: DB 0         ; Should be 0x2
TEST_SHR1: DB 0         ; Should be 0x2
TEST_ROL:  DB 0         ; Should be 0xB
TEST_ROR:  DB 0         ; Should be 0xA
TEST_MUL4: DB 0         ; Should be 0xC
ONE:       DB 1

; Expected results:
; 0x40 = 0xA (SHL test 1)
; 0x41 = 0x2 (SHL test 2)
; 0x42 = 0x2 (SHR test)
; 0x43 = 0xB (ROL test)
; 0x44 = 0xA (ROR test)
; 0x45 = 0xC (multiply by 4)
```

---

## Hints

### Hint 1: Shifter Hardware Structure
<details>
<summary>Click to reveal</summary>

A 4-bit shifter can be built from multiplexers. For shift left by 1:

```
Input:   A[3] A[2] A[1] A[0]
Output:  A[2] A[1] A[0]  0

Carry out = A[3]
```

In hardware:
```hdl
; SHL: shift left
wire shl_out[3:0];
wire shl_cout;

buf SHL_B0 (input: '0, output: shl_out[0]);      ; 0 enters from right
buf SHL_B1 (input: acc[0], output: shl_out[1]); ; A[0] -> position 1
buf SHL_B2 (input: acc[1], output: shl_out[2]); ; A[1] -> position 2
buf SHL_B3 (input: acc[2], output: shl_out[3]); ; A[2] -> position 3
buf SHL_C  (input: acc[3], output: shl_cout);   ; A[3] -> carry
```

</details>

### Hint 2: SHR Implementation
<details>
<summary>Click to reveal</summary>

Shift right is similar but opposite direction:

```
Input:   A[3] A[2] A[1] A[0]
Output:   0   A[3] A[2] A[1]

Carry out = A[0]
```

Hardware:
```hdl
wire shr_out[3:0];
wire shr_cout;

buf SHR_B3 (input: '0, output: shr_out[3]);      ; 0 enters from left
buf SHR_B2 (input: acc[3], output: shr_out[2]); ; A[3] -> position 2
buf SHR_B1 (input: acc[2], output: shr_out[1]); ; A[2] -> position 1
buf SHR_B0 (input: acc[1], output: shr_out[0]); ; A[1] -> position 0
buf SHR_C  (input: acc[0], output: shr_cout);   ; A[0] -> carry
```

</details>

### Hint 3: ROL/ROR with Carry
<details>
<summary>Click to reveal</summary>

ROL rotates bits left, with carry flag participating:

```
Before: C  A[3] A[2] A[1] A[0]
After:  A[3]  A[2] A[1] A[0] C

Result bits: A[2] A[1] A[0] old_C
New C = old A[3]
```

Hardware:
```hdl
wire rol_out[3:0];
wire rol_cout;

buf ROL_B0 (input: c_flag, output: rol_out[0]); ; Old C enters at LSB
buf ROL_B1 (input: acc[0], output: rol_out[1]);
buf ROL_B2 (input: acc[1], output: rol_out[2]);
buf ROL_B3 (input: acc[2], output: rol_out[3]);
buf ROL_C  (input: acc[3], output: rol_cout);   ; MSB -> new C
```

ROR is the mirror:
```hdl
wire ror_out[3:0];
wire ror_cout;

buf ROR_B3 (input: c_flag, output: ror_out[3]); ; Old C enters at MSB
buf ROR_B2 (input: acc[3], output: ror_out[2]);
buf ROR_B1 (input: acc[2], output: ror_out[1]);
buf ROR_B0 (input: acc[1], output: ror_out[0]);
buf ROR_C  (input: acc[0], output: ror_cout);   ; LSB -> new C
```

</details>

### Hint 4: ALU Modification
<details>
<summary>Click to reveal</summary>

You can either:
1. Add shift logic to the ALU, or
2. Create a separate shifter unit

Option 1 - Extended ALU operations:
```hdl
wire [1:0] alu_op;  ; 00=ADD, 01=SUB, 10=SHL, 11=SHR
; Plus additional signals for ROL/ROR

; Use a 4-way mux for result:
wire [3:0] add_result;
wire [3:0] sub_result;
wire [3:0] shl_result;
wire [3:0] shr_result;
wire [3:0] alu_result;

mux4 ALU_MUX (
    sel: alu_op,
    in0: add_result,
    in1: sub_result,
    in2: shl_result,
    in3: shr_result,
    out: alu_result
);
```

Option 2 - Separate shifter with mux to accumulator:
```hdl
; Separate shifter outputs
wire [3:0] shifter_result;
wire shifter_cout;

; Choose between ALU and shifter for acc input
wire use_shifter;
or USE_SH (input: is_shl is_shr is_rol is_ror, output: use_shifter);

mux2_4bit ACC_SRC (
    sel: use_shifter,
    in0: alu_result,
    in1: shifter_result,
    out: acc_next
);
```

</details>

### Hint 5: Shifter Result Selection
<details>
<summary>Click to reveal</summary>

With 4 shift operations, use a 4-way mux:

```hdl
; Encode shift type
wire [1:0] shift_type;
; 00 = SHL, 01 = SHR, 10 = ROL, 11 = ROR

; Build selection from instruction decode
or SHIFT_T0 (input: is_shr is_ror, output: shift_type[0]);
or SHIFT_T1 (input: is_rol is_ror, output: shift_type[1]);

; 4-way mux for shifter result
mux4 SHIFT_MUX (
    sel: shift_type,
    in0: shl_out,
    in1: shr_out,
    in2: rol_out,
    in3: ror_out,
    out: shifter_result
);

; 4-way mux for carry out
mux4 COUT_MUX (
    sel: shift_type,
    in0: shl_cout,
    in1: shr_cout,
    in2: rol_cout,
    in3: ror_cout,
    out: shifter_cout
);
```

</details>

---

## Expected Outcome

After implementing shift/rotate:

1. **SHL:** Left shift works, MSB goes to C, 0 enters LSB
2. **SHR:** Right shift works, LSB goes to C, 0 enters MSB
3. **ROL:** Rotate left through C works
4. **ROR:** Rotate right through C works
5. **Multiply by 2:** `SHL` = A * 2
6. **Divide by 2:** `SHR` = A / 2

### Verification Checklist

- [ ] SHL shifts bits left, putting MSB in C
- [ ] SHR shifts bits right, putting LSB in C
- [ ] ROL rotates left, old C enters LSB, old MSB goes to C
- [ ] ROR rotates right, old C enters MSB, old LSB goes to C
- [ ] Z flag updated if result is zero
- [ ] All test values match expected results
- [ ] Multi-bit shift (SHL twice) works correctly

---

## Why This Matters

Shift instructions are fundamental to computing:

### 1. Multiplication and Division
```asm
; A * 2
SHL         ; Equivalent to A = A * 2

; A * 4
SHL
SHL         ; Equivalent to A = A * 4

; A / 2
SHR         ; Equivalent to A = A / 2 (integer division)
```

### 2. Multi-Precision Shifts
To shift an 8-bit number stored in two nibbles:
```asm
; Shift 8-bit number left (HIGH:LOW)
LDA LOW
SHL             ; Shift low nibble, MSB -> C
STA LOW
LDA HIGH
ROL             ; Shift high nibble, old C enters as LSB
STA HIGH
```

### 3. Bit Testing
```asm
; Test if bit 3 is set
LDA VALUE
SHL             ; Bit 3 now in C
JC  BIT3_SET
```

### 4. Serial Communication
```asm
; Shift out bits one at a time (LSB first)
LOOP:   SHR             ; LSB -> C
        ; Output C to serial line
        JNZ LOOP        ; Continue until all bits shifted out
```

Every real CPU has shift and rotate instructions. The Intel 4004 had RAL (rotate accumulator left) and RAR (rotate right).

---

## Advanced Challenge

If you want extra challenge, implement:

1. **Arithmetic Shift Right (ASR):** Like SHR but preserves sign bit
   - `A[3]` stays the same, other bits shift right
   - Used for signed division

2. **Multi-bit shifts:** SHL n, SHR n (shift by n positions)
   - Requires operand to specify shift count
   - More efficient than multiple single-bit shifts

---

## Next Exercise

Proceed to **Exercise 05: Add Hardware Multiply** for the ultimate challenge!
