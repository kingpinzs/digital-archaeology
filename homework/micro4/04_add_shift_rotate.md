# Exercise 04: Add Shift and Rotate Instructions

**Difficulty:** Hard

<<<<<<< HEAD
**Estimated Time:** 60-90 minutes
=======
**Estimated Time:** 2-3 hours
>>>>>>> e0a7015c6d758cbc4977678e4b8043c68e2e1700

---

## Goal

<<<<<<< HEAD
Add four bit-manipulation instructions to the Micro4 CPU:
- **SHL** (Shift Left): A = A << 1
- **SHR** (Shift Right): A = A >> 1
- **ROL** (Rotate Left through Carry)
- **ROR** (Rotate Right through Carry)

These instructions enable:
- Efficient multiplication/division by powers of 2
- Bit field extraction and manipulation
- Multi-word shift operations
- Serial data protocols
=======
Add shift and rotate instructions to the Micro4 CPU: SHL (shift left), SHR (shift right), ROL (rotate left through carry), and ROR (rotate right through carry). These are essential for bit manipulation, multiplication, division, and multi-precision shifts.
>>>>>>> e0a7015c6d758cbc4977678e4b8043c68e2e1700

---

## Prerequisites

<<<<<<< HEAD
- Understanding of the Micro4 ALU and control unit
- Exercise 03 (Carry Flag) strongly recommended for ROL/ROR
- You can implement SHL/SHR without the carry flag first

---

## Current State (What Exists)

### The ALU

The current ALU only supports ADD and SUB. There's no shifting logic.

Looking at `hdl/04_micro4_cpu.m4hdl`:
```
# ALU operation: SUB if is_sub, else ADD
buf ALU_OP (input: is_sub, output: alu_op0);
```

The ALU needs to be extended to support shifts, OR we add a separate shifter unit.

### Available Opcodes

Assuming you've used:
- 0x8 = JNZ (Exercise 02)
- 0x9 = ADC (Exercise 03)
- 0xA = JC (Exercise 03)
- 0xB = JNC (Exercise 03)

Available for shifts:
- 0xC = SHL
- 0xD = SHR
- 0xE = ROL (or INC if from Exercise 01)
- 0xF = ROR (or DEC if from Exercise 01)

If you did Exercise 01 (INC/DEC), consider using 0xC-0xD for shifts and finding other opcodes for ROL/ROR.
=======
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
>>>>>>> e0a7015c6d758cbc4977678e4b8043c68e2e1700

---

## What to Add

<<<<<<< HEAD
### 1. Understand Shift Operations

**Logical Shift Left (SHL):**
```
Before: A = 0101 (5)
After:  A = 1010 (10)

Bits move left, LSB gets 0, MSB falls off (or into carry)
[MSB][b2][b1][b0] -> [b2][b1][b0][0]
                      |
                      v
                   Carry (old MSB)
```

**Logical Shift Right (SHR):**
```
Before: A = 1010 (10)
After:  A = 0101 (5)

Bits move right, MSB gets 0, LSB falls off (or into carry)
[MSB][b2][b1][b0] -> [0][MSB][b2][b1]
                                   |
                                   v
                                Carry (old LSB)
```

**Rotate Left through Carry (ROL):**
```
Before: A = 0101, C = 1
After:  A = 1011, C = 0

Old MSB goes to Carry, old Carry goes to LSB
[C][MSB][b2][b1][b0] -> [MSB][b2][b1][b0][C]
```

**Rotate Right through Carry (ROR):**
```
Before: A = 0101, C = 1
After:  A = 1010, C = 1

Old LSB goes to Carry, old Carry goes to MSB
[MSB][b2][b1][b0][C] -> [C][MSB][b2][b1][b0]
```

### 2. Shift Logic Circuit

**SHL circuit (shift left):**
```
wire [3:0] shl_result;
buf SHL_B0 (input: gnd,    output: shl_result[0]);  # LSB = 0
buf SHL_B1 (input: acc[0], output: shl_result[1]);  # Each bit moves up
buf SHL_B2 (input: acc[1], output: shl_result[2]);
buf SHL_B3 (input: acc[2], output: shl_result[3]);
# Old MSB (acc[3]) goes to carry
```

**SHR circuit (shift right):**
```
wire [3:0] shr_result;
buf SHR_B0 (input: acc[1], output: shr_result[0]);  # Each bit moves down
buf SHR_B1 (input: acc[2], output: shr_result[1]);
buf SHR_B2 (input: acc[3], output: shr_result[2]);
buf SHR_B3 (input: gnd,    output: shr_result[3]);  # MSB = 0
# Old LSB (acc[0]) goes to carry
```

**ROL circuit (rotate left through carry):**
```
wire [3:0] rol_result;
buf ROL_B0 (input: c_flag, output: rol_result[0]);  # LSB = old Carry
buf ROL_B1 (input: acc[0], output: rol_result[1]);
buf ROL_B2 (input: acc[1], output: rol_result[2]);
buf ROL_B3 (input: acc[2], output: rol_result[3]);
# Old MSB (acc[3]) goes to new carry
```

**ROR circuit (rotate right through carry):**
```
wire [3:0] ror_result;
buf ROR_B0 (input: acc[1], output: ror_result[0]);
buf ROR_B1 (input: acc[2], output: ror_result[1]);
buf ROR_B2 (input: acc[3], output: ror_result[2]);
buf ROR_B3 (input: c_flag, output: ror_result[3]);  # MSB = old Carry
# Old LSB (acc[0]) goes to new carry
```

### 3. Result Multiplexer

You now have multiple possible results. Use a MUX to select:

```
wire [3:0] final_result;

# Determine which operation
wire is_shift_op;
or IS_SHIFT (input: is_shl is_shr is_rol is_ror, output: is_shift_op);

# 4-way MUX for shift results, or larger MUX including ALU
# Simplest: cascade 2:1 MUXes

wire [3:0] shift_result;
wire shift_lr;  # 0 = left (SHL/ROL), 1 = right (SHR/ROR)
or SHIFT_RIGHT (input: is_shr is_ror, output: shift_lr);

wire is_rotate;
or IS_ROTATE (input: is_rol is_ror, output: is_rotate);

# First choose left vs right
# Then choose shift vs rotate
# Then choose shift vs ALU result
```

### 4. Carry Flag Updates

For shift operations, the carry receives the bit that "falls off":

```
# Carry out from SHL: old MSB
# Carry out from SHR: old LSB
# Carry out from ROL: old MSB
# Carry out from ROR: old LSB

wire shift_carry_out;
wire shift_is_left;
or SHIFT_LEFT (input: is_shl is_rol, output: shift_is_left);

mux2 SHIFT_CARRY_MUX (
    input: acc[0] acc[3] shift_is_left,  # Right uses LSB, Left uses MSB
    output: shift_carry_out
);

# Update c_flag_next when shifting
mux2 C_FLAG_MUX (
    input: alu_carry shift_carry_out is_shift_op,
    output: c_flag_next
);
```

### 5. Instruction Decoder

```
# is_shl = 1100 (0xC)
wire shl_t1, shl_t2;
and DEC_SHL1 (input: opcode[3] opcode[2], output: shl_t1);
and DEC_SHL2 (input: op1n op0n, output: shl_t2);
and DEC_SHL3 (input: shl_t1 shl_t2, output: is_shl);

# is_shr = 1101 (0xD)
wire shr_t;
and DEC_SHR1 (input: op1n opcode[0], output: shr_t);
and DEC_SHR2 (input: shl_t1 shr_t, output: is_shr);

# is_rol = 1110 (0xE)
wire rol_t;
and DEC_ROL1 (input: opcode[1] op0n, output: rol_t);
and DEC_ROL2 (input: shl_t1 rol_t, output: is_rol);

# is_ror = 1111 (0xF)
wire ror_t;
and DEC_ROR1 (input: opcode[1] opcode[0], output: ror_t);
and DEC_ROR2 (input: shl_t1 ror_t, output: is_ror);
```

### 6. Control Unit Changes

Shift instructions are single-byte (no operand), like INC/DEC:

```
Cycle 1: Fetch opcode
Cycle 2: Decode, recognize shift
Cycle 3: A <- shifted value, update C and Z flags
(back to fetch)
=======
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
>>>>>>> e0a7015c6d758cbc4977678e4b8043c68e2e1700
```

---

## Test Program

Create `programs/test_shift.asm`:

```asm
; test_shift.asm - Test shift and rotate instructions
<<<<<<< HEAD
; Tests: SHL, SHR, ROL, ROR
=======
; Tests SHL, SHR, ROL, ROR
>>>>>>> e0a7015c6d758cbc4977678e4b8043c68e2e1700

        ORG 0x00

START:
<<<<<<< HEAD
        ; === Test SHL (shift left) ===
        ; 0x3 << 1 = 0x6 (0011 -> 0110)
        LDI 3           ; A = 0011
        SHL             ; A = 0110 (6), C = 0
        SUB SIX         ; Should be 0
        JZ  TEST_SHL2
        JMP FAIL

TEST_SHL2:
        ; Test SHL with carry out
        ; 0x9 << 1 = 0x2 (1001 -> 0010), C = 1
        LDI 9           ; A = 1001
        SHL             ; A = 0010 (2), C = 1
        JNC FAIL        ; Carry should be set
        SUB TWO         ; Should be 0
        JZ  TEST_SHR
        JMP FAIL

TEST_SHR:
        ; === Test SHR (shift right) ===
        ; 0x6 >> 1 = 0x3 (0110 -> 0011)
        LDI 6           ; A = 0110
        SHR             ; A = 0011 (3), C = 0
        SUB THREE       ; Should be 0
        JZ  TEST_SHR2
        JMP FAIL

TEST_SHR2:
        ; Test SHR with carry out
        ; 0x5 >> 1 = 0x2 (0101 -> 0010), C = 1
        LDI 5           ; A = 0101
        SHR             ; A = 0010 (2), C = 1
        JNC FAIL        ; Carry should be set
        SUB TWO
        JZ  TEST_MUL2
        JMP FAIL

TEST_MUL2:
        ; === Practical test: Multiply by 2 using SHL ===
        ; 5 * 2 = 10 (0x5 -> 0xA)
        LDI 5
        SHL             ; A = 10 (0xA)
        SUB TEN
        JZ  TEST_DIV2
        JMP FAIL

TEST_DIV2:
        ; === Practical test: Divide by 2 using SHR ===
        ; 10 / 2 = 5 (0xA -> 0x5)
        LDI 10
        SHR             ; A = 5
        SUB FIVE
        JZ  TEST_ROL
        JMP FAIL

TEST_ROL:
        ; === Test ROL (rotate left through carry) ===
        ; Setup: A = 0x5 (0101), C = 1
        ; After ROL: A = 0xB (1011), C = 0
        ; The 1 from carry goes to LSB, MSB (0) goes to carry
        LDI 0xF
        ADD ONE         ; Force C = 1 (F + 1 = 0 with carry)
        LDI 5           ; A = 0101 (don't change C!)
        ROL             ; A = 1011 (0xB), C = 0 (old MSB was 0)
        JC  FAIL        ; C should be 0
        SUB ELEVEN
        JZ  TEST_ROR
        JMP FAIL

TEST_ROR:
        ; === Test ROR (rotate right through carry) ===
        ; Setup: A = 0xA (1010), C = 1
        ; After ROR: A = 0xD (1101), C = 0
        LDI 0xF
        ADD ONE         ; Force C = 1
        LDI 0xA         ; A = 1010
        ROR             ; A = 1101 (0xD), C = 0 (old LSB was 0)
        JC  FAIL        ; C should be 0
        SUB THIRTEEN
        JZ  PASS
        JMP FAIL

PASS:
        LDI 1
        STA RESULT
        HLT

FAIL:
        LDI 0
        STA RESULT
        HLT

; Data section
        ORG 0x50
TWO:    DB  2
THREE:  DB  3
FIVE:   DB  5
SIX:    DB  6
TEN:    DB  10
ELEVEN: DB  11          ; 0xB
THIRTEEN: DB 13         ; 0xD
ONE:    DB  1
RESULT: DB  0xFF        ; 1 = pass, 0 = fail
```

Simpler test for just SHL/SHR:

```asm
; test_shift_simple.asm - Basic shift test

        ORG 0x00

        ; Multiply 3 by 4 using shifts (3 << 2 = 12)
        LDI 3           ; A = 3
        SHL             ; A = 6 (3 * 2)
        SHL             ; A = 12 (3 * 4)
        STA RESULT

        ; Divide 12 by 4 using shifts (12 >> 2 = 3)
        SHR             ; A = 6
        SHR             ; A = 3
        STA RESULT2

        HLT

        ORG 0x30
RESULT:  DB 0           ; Should be 12 (0xC)
RESULT2: DB 0           ; Should be 3
```

---

## Verification

After implementing shifts:

1. Run the simple test:
   ```bash
   ./assembler ../../programs/test_shift_simple.asm -o test.bin
   ./emulator test.bin
   ```
   Expected: RESULT = 12 (0xC), RESULT2 = 3

2. Run the comprehensive test:
   ```bash
   ./assembler ../../programs/test_shift.asm -o test.bin
   ./emulator test.bin
   ```
   Expected: RESULT = 1 (all tests passed)

3. Verify shift truth tables:

   **SHL:**
   | Input | Output | Carry |
   |-------|--------|-------|
   | 0001  | 0010   | 0     |
   | 0101  | 1010   | 0     |
   | 1000  | 0000   | 1     |
   | 1111  | 1110   | 1     |

   **SHR:**
   | Input | Output | Carry |
   |-------|--------|-------|
   | 0010  | 0001   | 0     |
   | 1010  | 0101   | 0     |
   | 0001  | 0000   | 1     |
   | 1111  | 0111   | 1     |

=======
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

>>>>>>> e0a7015c6d758cbc4977678e4b8043c68e2e1700
---

## Hints

<<<<<<< HEAD
<details>
<summary>Hint 1: Start with SHL only</summary>

Implement SHL first. It's the simplest:
- Result[0] = 0
- Result[1] = A[0]
- Result[2] = A[1]
- Result[3] = A[2]
- Carry_out = A[3]

This is just wiring! No gates needed for the shift itself.
</details>

<details>
<summary>Hint 2: MUX the result</summary>

After computing the shift result, you need to get it into the accumulator. You'll need a MUX to select between:
- ALU result (for ADD/SUB)
- Shift result (for SHL/SHR/ROL/ROR)
- Memory data (for LDA)
- Immediate data (for LDI)

A 4-way MUX with 2 select bits, or cascade of 2:1 MUXes.
</details>

<details>
<summary>Hint 3: ROL and ROR need the carry flag</summary>

For ROL:
- Bit 0 of result = current C flag
- New C flag = bit 3 of input

For ROR:
- Bit 3 of result = current C flag
- New C flag = bit 0 of input

Make sure you READ the old C before WRITING the new C!
</details>

<details>
<summary>Hint 4: Z flag for shifts</summary>

After any shift, the Z flag should reflect whether the result is zero:
- SHR of 0x1 gives 0x0, Z should be set
- SHL of 0x8 gives 0x0, Z should be set

Connect the shift result to the zero detector the same way ALU result is.
</details>

<details>
<summary>Hint 5: Barrel shifter alternative</summary>

For a 4-bit shifter, direct wiring works fine. For larger CPUs, you'd use a barrel shifter - a crossbar of MUXes that can shift by any amount in one cycle.

A 4-bit barrel shifter would let you do: SHL 1, SHL 2, SHL 3, etc. But for Micro4, single-bit shifts are sufficient.
=======
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

>>>>>>> e0a7015c6d758cbc4977678e4b8043c68e2e1700
</details>

---

## Expected Outcome

<<<<<<< HEAD
After completing this exercise:

1. Four new shift instructions work correctly:
   - **SHL** (0xC): Shift left, LSB=0, MSB->Carry
   - **SHR** (0xD): Shift right, MSB=0, LSB->Carry
   - **ROL** (0xE): Rotate left through Carry
   - **ROR** (0xF): Rotate right through Carry

2. All shifts:
   - Execute in 3 cycles (single-byte instruction)
   - Update Z flag based on result
   - Update C flag with the shifted-out bit

3. Test output:
   ```
   test_shift_simple: RESULT=0xC, RESULT2=0x3
   test_shift: RESULT=1 (all tests passed)
   ```
=======
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
>>>>>>> e0a7015c6d758cbc4977678e4b8043c68e2e1700

---

## Why This Matters

<<<<<<< HEAD
### Efficient Multiplication and Division

Shifting is MUCH faster than repeated addition:
```asm
; Multiply by 8 using shifts: 3 cycles
SHL             ; *2
SHL             ; *4
SHL             ; *8

; Multiply by 8 using addition: 24+ cycles
ADD VALUE
ADD VALUE
ADD VALUE
...
```

### Bit Manipulation

Shifts enable bit-level operations:
```asm
; Extract bit 2: (value >> 2) & 1
LDA VALUE
SHR
SHR
AND ONE         ; A = bit 2 of VALUE
```

### Multi-Word Operations

ROL/ROR through carry enable multi-word shifts:
```asm
; Shift 8-bit value left (in two 4-bit parts)
LDA LOW_NIBBLE
SHL             ; C = bit 3
STA LOW_NIBBLE
LDA HIGH_NIBBLE
ROL             ; Bit 0 = old C (bit 3 from low)
STA HIGH_NIBBLE
```

### Historical Context

Shift instructions appear in every CPU:
- **Intel 4004**: No dedicated shift, had to use rotate
- **Intel 8080**: RLC, RRC, RAL, RAR (rotate through carry)
- **6502**: ASL, LSR, ROL, ROR
- **x86**: SHL, SHR, SAL, SAR, ROL, ROR, RCL, RCR

Your Micro4 now has comparable bit manipulation capability!
=======
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
>>>>>>> e0a7015c6d758cbc4977678e4b8043c68e2e1700

---

## Next Exercise

<<<<<<< HEAD
Continue to [Exercise 05: Add Multiply](05_add_multiply.md) for the ultimate challenge - hardware multiplication.
=======
Proceed to **Exercise 05: Add Hardware Multiply** for the ultimate challenge!
>>>>>>> e0a7015c6d758cbc4977678e4b8043c68e2e1700
