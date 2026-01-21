<<<<<<< HEAD
# Exercise 02: Enhance Zero Flag Detection

**Difficulty:** Easy

**Estimated Time:** 20-30 minutes
=======
# Exercise 02: Add JNZ (Jump if Not Zero) Instruction

**Difficulty:** Easy

**Estimated Time:** 30-45 minutes
>>>>>>> e0a7015c6d758cbc4977678e4b8043c68e2e1700

---

## Goal

<<<<<<< HEAD
The Micro4 CPU already has a zero flag (Z), but in this exercise you'll understand exactly how it works and potentially enhance it. You will:

1. Understand the zero detection circuit
2. Add the **JNZ** (Jump if Not Zero) instruction
3. Ensure all ALU operations properly update the Z flag

This exercise focuses on status flags and conditional branching - fundamental concepts in CPU design.
=======
Add the JNZ (Jump if Not Zero) instruction, which branches when the zero flag is clear. This complements the existing JZ instruction and enables more natural loop constructs.
>>>>>>> e0a7015c6d758cbc4977678e4b8043c68e2e1700

---

## Prerequisites

<<<<<<< HEAD
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
=======
- Understanding of the existing JZ instruction
- Knowledge of how the Z flag is set by ALU operations
- Completion of Exercise 01 (INC/DEC) recommended but not required

---

## Current State

The Micro4 CPU has a Z (zero) flag that is set when an ALU operation produces a result of 0. Currently, only one conditional branch exists:

| Opcode | Mnemonic | Operation | Description |
|--------|----------|-----------|-------------|
| 0x6 | JZ addr | if Z: PC = addr | Jump if zero |

To jump when NOT zero, programmers must use an awkward workaround:

```asm
; Current way to "jump if not zero"
LOOP:   SUB ONE         ; Decrement counter
        JZ  DONE        ; Skip jump if zero
        JMP LOOP        ; Otherwise loop
DONE:   ...             ; Fall through when done
```

This requires TWO branch instructions where one should suffice!
>>>>>>> e0a7015c6d758cbc4977678e4b8043c68e2e1700

---

## What to Add

<<<<<<< HEAD
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
=======
### New Instruction

| Opcode | Mnemonic | Operation | Cycles |
|--------|----------|-----------|--------|
| 0xA | JNZ addr | if !Z: PC = addr | 4-5 |

### Instruction Format

JNZ is a two-byte instruction like JZ:
```
Byte 1: 0xA0 (opcode 0xA, operand nibble ignored)
Byte 2: target address (8-bit)
```

### Implementation Changes

1. **Instruction Decoder:** Add decode logic for opcode 0xA
2. **Control Unit:** Modify branch condition check
3. **PC Load Logic:** JNZ loads PC when Z=0, JZ loads when Z=1
>>>>>>> e0a7015c6d758cbc4977678e4b8043c68e2e1700

---

## Test Program

Create `programs/test_jnz.asm`:

```asm
<<<<<<< HEAD
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
=======
; test_jnz.asm - Test JNZ instruction
; Count from 0 to 5 using JNZ
; Expected: COUNT = 5

        ORG 0x00

START:  LDI 0           ; A = 0 (counter)
LOOP:   STA COUNT       ; Store current value
        ADD ONE         ; Increment
        SUB SIX         ; Compare with 6 (A = A - 6)
        JZ  DONE        ; If A == 6, we're done
        ADD SIX         ; Restore A (undo the subtraction)
        JNZ LOOP        ; Not done, keep looping

        ; This should never execute
        LDI 0xF
        STA COUNT
        HLT

DONE:   LDA COUNT       ; Load final count
>>>>>>> e0a7015c6d758cbc4977678e4b8043c68e2e1700
        HLT

; Data section
        ORG 0x30
<<<<<<< HEAD
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
=======
COUNT:  DB  0           ; Final count (should be 5)
ONE:    DB  1           ; Constant 1
SIX:    DB  6           ; Constant 6 for comparison

; Alternative simpler test:
; After execution, COUNT should be 5
```

### Simpler Test

```asm
; test_jnz_simple.asm - Simple JNZ test
; Countdown from 5 to 0 using JNZ

        ORG 0x00

START:  LDI 5           ; A = 5
LOOP:   STA COUNT       ; Store current count
        DEC             ; A = A - 1 (requires Exercise 01)
                        ; Or: SUB ONE
        JNZ LOOP        ; Loop until A == 0
        STA COUNT       ; Store final 0
        HLT

; Data section
        ORG 0x30
COUNT:  DB  0           ; Should be 0 after execution
ONE:    DB  1           ; Constant 1 (if not using DEC)

; Trace:
; A=5 -> store -> A=4 -> JNZ(taken)
; A=4 -> store -> A=3 -> JNZ(taken)
; A=3 -> store -> A=2 -> JNZ(taken)
; A=2 -> store -> A=1 -> JNZ(taken)
; A=1 -> store -> A=0 -> JNZ(not taken, Z=1)
; A=0 -> store -> HLT
; COUNT visits: 5, 4, 3, 2, 1, 0
>>>>>>> e0a7015c6d758cbc4977678e4b8043c68e2e1700
```

---

<<<<<<< HEAD
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
=======
## Hints

### Hint 1: Opcode Decoding
<details>
<summary>Click to reveal</summary>

Opcode 0xA is binary 1010:
```hdl
# is_jnz = op3 & !op2 & op1 & !op0  (1010)
wire jnz_t1, jnz_t2;
and DEC_JNZ1 (input: opcode[3] op2n, output: jnz_t1);
and DEC_JNZ2 (input: opcode[1] op0n, output: jnz_t2);
and DEC_JNZ3 (input: jnz_t1 jnz_t2, output: is_jnz);
```

</details>

### Hint 2: Reusing JZ Logic
<details>
<summary>Click to reveal</summary>

JZ and JNZ are almost identical! The only difference is the condition:
- JZ: branch if Z == 1
- JNZ: branch if Z == 0 (which is !Z)

You can share most of the control logic:
```hdl
wire is_conditional_jump;
or IS_COND (input: is_jz is_jnz, output: is_conditional_jump);

; Branch taken condition:
wire jz_taken, jnz_taken, branch_taken;
and JZ_TAKE (input: is_jz z_flag, output: jz_taken);
not Z_NOT (input: z_flag, output: z_flag_n);
and JNZ_TAKE (input: is_jnz z_flag_n, output: jnz_taken);
or BR_TAKE (input: jz_taken jnz_taken, output: branch_taken);
```

</details>

### Hint 3: State Machine
<details>
<summary>Click to reveal</summary>

JNZ follows the same execution pattern as JZ:

```
S0: FETCH1    - MAR = PC, read memory
S1: FETCH2    - IR = opcode, PC++
S2: DECODE    - Recognize JNZ
S3: FETCH_ADDR- MAR = PC, read memory (get target address)
S4: ADDR_DONE - PC++
S5: EXECUTE   - Check Z flag
    if (!Z) PC = address  ; Branch taken
    else continue         ; Branch not taken
```

The control unit already handles JZ. Just add JNZ to the same path with inverted condition.

</details>

### Hint 4: PC Load Control
<details>
<summary>Click to reveal</summary>

The PC load signal needs to account for both JZ and JNZ:

```hdl
; PC load on branch taken
wire jz_load_pc, jnz_load_pc, cond_load_pc;

; JZ: load PC if is_jz AND z_flag AND in_execute_state
and JZ_PC1 (input: is_jz z_flag, output: jz_load_pc);

; JNZ: load PC if is_jnz AND !z_flag AND in_execute_state
wire z_flag_n;
not Z_INV (input: z_flag, output: z_flag_n);
and JNZ_PC1 (input: is_jnz z_flag_n, output: jnz_load_pc);

; Either one triggers PC load
or COND_PC (input: jz_load_pc jnz_load_pc, output: cond_load_pc);
```

</details>

### Hint 5: Complete Integration
<details>
<summary>Click to reveal</summary>

Summary of changes needed:

1. **Decoder** - Add `is_jnz` signal for opcode 0xA
2. **Control Unit** - Add `is_jnz` to conditional branch handling
3. **PC Load Logic** - `pc_load = is_jmp | (is_jz & z_flag) | (is_jnz & !z_flag)`

The state transitions remain the same as JZ - only the branch condition differs.

>>>>>>> e0a7015c6d758cbc4977678e4b8043c68e2e1700
</details>

---

## Expected Outcome

<<<<<<< HEAD
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

=======
After implementing JNZ:

1. **Test programs pass:** Loops using JNZ work correctly
2. **Simpler code:** Countdown loops use single branch instead of JZ+JMP
3. **Correct semantics:** JNZ branches when Z=0, falls through when Z=1

### Verification Checklist

- [ ] Opcode 0xA is decoded as JNZ
- [ ] JNZ fetches the target address correctly
- [ ] JNZ branches when Z flag is clear (0)
- [ ] JNZ falls through when Z flag is set (1)
- [ ] PC increments correctly on fall-through
- [ ] Test countdown loop terminates at zero

---

## Design Insight

Notice that JZ and JNZ are **complementary**:
- JZ tests for equality (result == 0)
- JNZ tests for inequality (result != 0)

With ADD/SUB setting the Z flag, you can implement comparisons:
```asm
; Compare A with VALUE
LDA A
SUB VALUE       ; Z=1 if A==VALUE
JZ  EQUAL       ; Branch if equal
; Or...
JNZ NOT_EQUAL   ; Branch if not equal
```

This pattern is so useful that most CPUs have a dedicated CMP (compare) instruction that sets flags without storing the result.

>>>>>>> e0a7015c6d758cbc4977678e4b8043c68e2e1700
---

## Why This Matters

<<<<<<< HEAD
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
=======
JNZ is fundamental to loop construction:

```asm
; Natural loop structure with JNZ
        LDI 10          ; Counter = 10
LOOP:   ; ... loop body ...
        DEC             ; Counter--
        JNZ LOOP        ; Repeat until counter == 0
```

Without JNZ, you need awkward workarounds:

```asm
; Awkward loop without JNZ
        LDI 10
LOOP:   ; ... loop body ...
        DEC
        JZ  DONE        ; Exit if zero
        JMP LOOP        ; Otherwise continue
DONE:
```

Every real CPU has both JZ and JNZ (or equivalents).
>>>>>>> e0a7015c6d758cbc4977678e4b8043c68e2e1700

---

## Next Exercise

<<<<<<< HEAD
Continue to [Exercise 03: Add Carry Flag](03_add_carry_flag.md) to enable multi-precision arithmetic.
=======
Proceed to **Exercise 03: Add Carry Flag** to enable multi-precision arithmetic.
>>>>>>> e0a7015c6d758cbc4977678e4b8043c68e2e1700
