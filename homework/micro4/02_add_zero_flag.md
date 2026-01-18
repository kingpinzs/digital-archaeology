# Exercise 02: Enhance Zero Flag Detection

**Difficulty:** Easy

**Estimated Time:** 20-30 minutes

---

## Goal

The Micro4 CPU already has a zero flag (Z), but in this exercise you'll understand exactly how it works and potentially enhance it. You will:

1. Understand the zero detection circuit
2. Add the **JNZ** (Jump if Not Zero) instruction
3. Ensure all ALU operations properly update the Z flag

This exercise focuses on status flags and conditional branching - fundamental concepts in CPU design.

---

## Prerequisites

- Basic understanding of the Micro4 architecture
- Familiarity with the existing ALU and instruction decoder
- Exercise 01 is NOT required (can be done in parallel)

---

## Current State (What Exists)

### The Zero Flag

Looking at `hdl/04_micro4_cpu.m4hdl`, the zero flag is declared:

```
# Zero Flag
wire z_flag;
wire z_flag_next;
wire z_load;
```

The flag is stored in a flip-flop and updated when `z_load` is asserted.

### Existing Conditional Jump

The CPU has JZ (Jump if Zero):
- Opcode 0x6
- Jumps to address if Z flag is set (Z = 1)

### What's Missing?

1. **JNZ** - The complementary instruction (Jump if NOT Zero)
2. The zero detection logic itself (needs implementation)
3. Proper Z flag updates for all ALU operations

---

## What to Add

### 1. Zero Detection Circuit

A 4-bit result is zero when ALL bits are 0. This requires a NOR gate tree:

```
Zero detection: Z = NOT(R3 OR R2 OR R1 OR R0)

In gates:
  temp1 = R3 OR R2
  temp2 = R1 OR R0
  temp3 = temp1 OR temp2
  z_flag_next = NOT temp3
```

HDL implementation:
```
# Zero detector for ALU result
wire z_temp1, z_temp2, z_temp3;
or ZERO_OR1 (input: alu_result[3] alu_result[2], output: z_temp1);
or ZERO_OR2 (input: alu_result[1] alu_result[0], output: z_temp2);
or ZERO_OR3 (input: z_temp1 z_temp2, output: z_temp3);
not ZERO_NOT (input: z_temp3, output: alu_zero);
```

Alternative using NOR (more direct):
```
# 4-input NOR: output is 1 only if all inputs are 0
nor4 ZERO_DETECT (input: alu_result[3] alu_result[2] alu_result[1] alu_result[0],
                  output: alu_zero);
```

### 2. Add JNZ Instruction (Jump if Not Zero)

**Suggested opcode:** 0x8

Add decoder logic:
```
# is_jnz = op3 & !op2 & !op1 & !op0  (1000 = 0x8)
wire jnz_t1, jnz_t2;
and DEC_JNZ1 (input: opcode[3] op2n, output: jnz_t1);
and DEC_JNZ2 (input: op1n op0n, output: jnz_t2);
and DEC_JNZ3 (input: jnz_t1 jnz_t2, output: is_jnz);
```

### 3. Control Unit for JNZ

JNZ execution is similar to JZ but with inverted condition:

```
JZ:  if (Z == 1) then PC <- address
JNZ: if (Z == 0) then PC <- address
```

In hardware:
```
# Jump condition
wire jz_condition, jnz_condition, take_jump;
and JZ_COND (input: is_jz z_flag, output: jz_condition);

# For JNZ, we need NOT z_flag
wire z_flag_n;
not Z_INVERT (input: z_flag, output: z_flag_n);
and JNZ_COND (input: is_jnz z_flag_n, output: jnz_condition);

# Take jump if either condition is met
or JUMP_COND (input: jz_condition jnz_condition is_jmp, output: take_jump);
```

### 4. Z Flag Update Rules

The Z flag should be updated by:
- ADD (0x3) - set if result is zero
- SUB (0x4) - set if result is zero
- INC (0xE) - set if result is zero (if you did Exercise 01)
- DEC (0xF) - set if result is zero (if you did Exercise 01)
- LDI (0x7) - set if loaded value is zero
- LDA (0x1) - set if loaded value is zero

**Important:** JMP, JZ, JNZ, STA, and HLT should NOT modify the Z flag.

Control signal to update Z:
```
# Update Z flag for ALU operations and loads
wire z_update;
or Z_UPDATE1 (input: is_add is_sub, output: z_update_alu);
or Z_UPDATE2 (input: is_ldi is_lda, output: z_update_load);
or Z_UPDATE (input: z_update_alu z_update_load, output: z_update);
# Add is_inc and is_dec if you did Exercise 01
```

---

## Test Program

Create `programs/test_jnz.asm`:

```asm
; test_jnz.asm - Test JNZ (Jump if Not Zero) instruction
; Expected result: A = 0, RESULT = 5 (countdown completed)

        ORG 0x00

START:  LDI 5           ; A = 5, Z = 0
        STA COUNT       ; Store initial count

LOOP:   LDA COUNT       ; Load current count
        JZ  DONE        ; If zero, we're done
        SUB ONE         ; Decrement
        STA COUNT       ; Store new count
        JNZ LOOP        ; If not zero, continue (test JNZ!)
        ; Fall through when zero (shouldn't happen due to JZ above)

DONE:   LDA COUNT       ; Load final count (should be 0)
        STA RESULT      ; Store result
        HLT

; Data section
        ORG 0x30
COUNT:  DB  0           ; Loop counter
ONE:    DB  1           ; Constant 1
RESULT: DB  0xFF        ; Result (0xFF = not reached, 0 = success)
```

Alternative test focusing specifically on JNZ:

```asm
; test_jnz_specific.asm - Specifically test JNZ behavior

        ORG 0x00

        ; Test 1: JNZ should NOT jump when Z=1
        LDI 0           ; A = 0, Z = 1 (zero!)
        JNZ FAIL        ; Should NOT jump (Z is set)

        ; Test 2: JNZ SHOULD jump when Z=0
        LDI 5           ; A = 5, Z = 0 (not zero)
        JNZ PASS        ; SHOULD jump
        JMP FAIL        ; Should not reach here

PASS:   LDI 1           ; Success indicator
        STA RESULT
        HLT

FAIL:   LDI 0           ; Failure indicator
        STA RESULT
        HLT

; Data
        ORG 0x30
RESULT: DB  0xFF        ; 1 = pass, 0 = fail, 0xFF = not reached
```

---

## Verification

After implementing the zero detection and JNZ:

1. Assemble and run the test program:
   ```bash
   cd src/micro4
   ./assembler ../../programs/test_jnz.asm -o test_jnz.bin
   ./emulator test_jnz.bin
   ```

2. Expected behavior for test_jnz_specific.asm:
   - First JNZ should NOT jump (Z is set)
   - Second JNZ SHOULD jump (Z is clear)
   - Final RESULT = 1

3. Verify Z flag truth table:
   | ALU Result | Z Flag |
   |------------|--------|
   | 0000       | 1      |
   | 0001       | 0      |
   | 0010       | 0      |
   | ...        | 0      |
   | 1111       | 0      |

---

## Hints

<details>
<summary>Hint 1: Understanding the zero detector</summary>

The zero detector answers: "Are ALL bits zero?"

In Boolean logic:
- Z = 1 when (R3=0 AND R2=0 AND R1=0 AND R0=0)

Using De Morgan's theorem:
- Z = NOT(R3 OR R2 OR R1 OR R0)

A 4-input NOR gate does this directly. If you don't have a 4-input NOR, build it from 2-input gates.
</details>

<details>
<summary>Hint 2: JNZ is just inverted JZ</summary>

JZ and JNZ share almost all the same logic:
- Same fetch/decode cycles
- Same address handling
- Only the jump condition differs

```
JZ:  take_branch = Z
JNZ: take_branch = NOT Z
```

You can reuse the JZ execution path, just invert the condition check.
</details>

<details>
<summary>Hint 3: When to update Z</summary>

The Z flag should reflect the result of the LAST operation that affects it. Be careful:

- LDA 0x30 then JZ: Z flag should reflect what was loaded
- ADD then JMP: JMP should NOT change Z
- SUB resulting in 0: Z should be 1

The control unit determines when z_load is asserted.
</details>

<details>
<summary>Hint 4: Testing edge cases</summary>

Test these scenarios:
1. LDI 0 - Should set Z
2. LDI 15, SUB with value 15 - Result 0, should set Z
3. LDI 1, DEC - Result 0, should set Z
4. LDI 0, INC - Result 1, should clear Z

Also test that JMP and STA don't affect Z:
```asm
LDI 0       ; Z = 1
JMP NEXT    ; Z should still be 1
NEXT: JZ OK ; Should jump
```
</details>

<details>
<summary>Hint 5: Complete implementation checklist</summary>

1. [ ] Zero detector circuit (NOR of all result bits)
2. [ ] JNZ decoder (opcode 0x8)
3. [ ] JNZ condition check (is_jnz AND NOT z_flag)
4. [ ] Update take_jump signal to include JNZ
5. [ ] Verify z_load control for all instructions
6. [ ] Test both JZ and JNZ work correctly
</details>

---

## Expected Outcome

After completing this exercise:

1. The Micro4 CPU has a fully functional zero detection circuit
2. JNZ instruction (opcode 0x8) works correctly:
   - Jumps when Z flag is clear (result was NOT zero)
   - Does NOT jump when Z flag is set (result WAS zero)
3. The Z flag is properly updated by all ALU operations

Test output:
```
Running test_jnz_specific...
RESULT = 0x01 (pass)
A = 0x01
Z = 0
```

---

## Why This Matters

### Conditional Execution

The zero flag enables conditional logic in programs:

```asm
; if (A == 5) then goto EQUAL
SUB FIVE        ; A = A - 5
JZ  EQUAL       ; Jump if result was zero (A was 5)

; if (A != 0) then goto NONZERO
LDA VALUE
JNZ NONZERO     ; Jump if not zero
```

### Status Flags in Real CPUs

Every CPU has status flags:
- **Intel 4004** (1971): Carry flag only
- **Intel 8080** (1974): Z, S, P, C, AC flags
- **6502** (1975): N, V, B, D, I, Z, C flags
- **x86**: EFLAGS register with 16+ flags
- **ARM**: NZCV flags

Zero (Z) and Carry (C) are universal. Sign (N/S) and Overflow (V) are common.

### Loop Constructs

JNZ is essential for loops:

```asm
; C-style: for (i = 10; i > 0; i--)
        LDI 10
LOOP:   ; ... do something ...
        DEC
        JNZ LOOP    ; Continue while i != 0
```

Without JNZ, you'd need an extra comparison instruction.

---

## Next Exercise

Continue to [Exercise 03: Add Carry Flag](03_add_carry_flag.md) to enable multi-precision arithmetic.
