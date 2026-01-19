# Exercise 02: Add JNZ (Jump if Not Zero) Instruction

**Difficulty:** Easy

**Estimated Time:** 30-45 minutes

---

## Goal

Add the JNZ (Jump if Not Zero) instruction, which branches when the zero flag is clear. This complements the existing JZ instruction and enables more natural loop constructs.

---

## Prerequisites

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

---

## What to Add

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

---

## Test Program

Create `programs/test_jnz.asm`:

```asm
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
        HLT

; Data section
        ORG 0x30
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
```

---

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

</details>

---

## Expected Outcome

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

---

## Why This Matters

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

---

## Next Exercise

Proceed to **Exercise 03: Add Carry Flag** to enable multi-precision arithmetic.
