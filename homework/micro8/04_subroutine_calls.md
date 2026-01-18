# Exercise 04: Subroutine Calls

**Difficulty:** ⭐⭐ Medium
**Time:** ~45-60 minutes
**Prerequisites:** Exercise 03 (Stack Operations)

---

## Goal

Implement CALL and RET instructions that enable modular programming through subroutines. This is the foundation of structured programming and code reuse.

---

## Background

A **subroutine** (also called function, procedure, or routine) is a reusable block of code that:
1. Can be called from anywhere in the program
2. Returns to the caller when finished
3. May accept parameters and return values

Without subroutines, you'd need to copy code everywhere you need it. With subroutines:

```assembly
; Instead of duplicating code:
        ; calculate result 1
        LDI R0, 5
        ADD R0, R0          ; double it
        ST R0, [RESULT1]

        ; calculate result 2
        LDI R0, 10
        ADD R0, R0          ; double it (same code!)
        ST R0, [RESULT2]

; Use a subroutine:
        LDI R0, 5
        CALL DOUBLE
        ST R0, [RESULT1]

        LDI R0, 10
        CALL DOUBLE
        ST R0, [RESULT2]

DOUBLE:
        ADD R0, R0
        RET
```

---

## Current State in HDL

From `hdl/05_micro8_cpu.m4hdl`:

```
# CALL: 0xCF - Call subroutine
and DEC_CALL (input: upper_0xC ir[3] ir[2] ir[1] ir[0], output: is_call);

# RET: 0xD0 - Return from subroutine
and DEC_RET (input: upper_0xD ir3n ir2n ir1n ir0n, output: is_ret);
```

---

## What to Implement

### Step 1: CALL Instruction

`CALL addr` does two things:
1. Push the return address (address of instruction after CALL)
2. Jump to the subroutine address

```assembly
        CALL MYSUB      ; Push return address, jump to MYSUB
        ; ...           ; Execution continues here after RET
```

**CALL is a 3-byte instruction:**
- Byte 0: Opcode (0xCF)
- Byte 1: Low byte of target address
- Byte 2: High byte of target address

**HDL execution sequence:**
```
T0: Fetch opcode, recognize CALL
T1: Fetch address low byte → operand1
T2: Fetch address high byte → operand2
T3: Push PC high byte (return address high)
    - SP = SP - 1
    - memory[SP] = PC[15:8]
T4: Push PC low byte (return address low)
    - SP = SP - 1
    - memory[SP] = PC[7:0]
T5: Load PC with target address
    - PC = {operand2, operand1}
```

**Important:** The return address is the address of the instruction *after* CALL (PC has already been incremented past the 3-byte CALL instruction).

### Step 2: RET Instruction

`RET` returns to the caller:
1. Pop the return address from stack
2. Jump to that address

```assembly
MYSUB:
        ; do work
        RET             ; Return to caller
```

**RET is a 1-byte instruction.**

**HDL execution sequence:**
```
T0: Fetch opcode, recognize RET
T1: Pop low byte of return address
    - temp_low = memory[SP]
    - SP = SP + 1
T2: Pop high byte of return address
    - temp_high = memory[SP]
    - SP = SP + 1
T3: Load PC with return address
    - PC = {temp_high, temp_low}
```

### Step 3: Nested Calls

Subroutines can call other subroutines:

```assembly
MAIN:
        CALL SUB_A      ; Call A
        HLT

SUB_A:
        CALL SUB_B      ; A calls B
        RET

SUB_B:
        CALL SUB_C      ; B calls C
        RET

SUB_C:
        ; deepest level
        RET
```

Each CALL pushes a return address; each RET pops one. The stack keeps them in order.

### Step 4: Register Preservation

Caller-saved vs Callee-saved conventions:

```assembly
; Callee-saved: Subroutine preserves registers it uses
SAFE_SUB:
        PUSH R0         ; Save registers we'll modify
        PUSH R1
        ; ... do work with R0, R1 ...
        POP R1          ; Restore in reverse order!
        POP R0
        RET

; Caller-saved: Caller saves what it needs
MAIN:
        LDI R0, 0x42    ; R0 has important value
        PUSH R0         ; Save before call
        CALL UNSAFE_SUB ; May trash R0
        POP R0          ; Restore after call
```

### Step 5: Parameter Passing

Pass values to subroutines via registers or stack:

```assembly
; Via registers (simple, limited)
        LDI R0, 10      ; First parameter
        LDI R1, 20      ; Second parameter
        CALL ADD_NUMS   ; R0 = R0 + R1

; Via stack (flexible, unlimited)
        LDI R0, 10
        PUSH R0         ; First parameter
        LDI R0, 20
        PUSH R0         ; Second parameter
        CALL ADD_STACK  ; Result in R0
        ADDI SP, 2      ; Clean up parameters (add 2 to SP)
```

---

## Test Program

Implement recursive factorial:

```assembly
; factorial.asm - Recursive factorial calculation
; Calculates n! using recursive CALL/RET
; Input: R0 = n
; Output: R0 = n!

        .org 0x0200

START:
        LDI16 SP, 0x01FD        ; Initialize stack

        ; Test factorial(5) = 120 = 0x78
        LDI R0, 5
        CALL FACTORIAL
        ST R0, [RESULT]         ; Expected: 0x78 (120)

        HLT

; ========================================
; FACTORIAL: Compute n! recursively
; Input: R0 = n
; Output: R0 = n!
; Modifies: R0, R1
; ========================================
FACTORIAL:
        ; Base case: 0! = 1
        CMPI R0, 0
        JNZ NOT_ZERO
        LDI R0, 1               ; Return 1
        RET

NOT_ZERO:
        ; Recursive case: n! = n * (n-1)!
        PUSH R0                 ; Save n

        DEC R0                  ; R0 = n-1
        CALL FACTORIAL          ; R0 = (n-1)!

        ; Now R0 = (n-1)!, need to compute n * (n-1)!
        POP R1                  ; R1 = n (original)

        ; Multiply: R0 = R1 * R0
        ; Using repeated addition (simple multiply)
        PUSH R2                 ; Save R2
        MOV R2, R0              ; R2 = (n-1)! (multiplier)
        LDI R0, 0               ; R0 = 0 (accumulator)

MULT_LOOP:
        CMPI R1, 0
        JZ MULT_DONE
        ADD R0, R2              ; R0 += (n-1)!
        DEC R1                  ; count--
        JMP MULT_LOOP

MULT_DONE:
        POP R2                  ; Restore R2
        RET                     ; Return n!

; Data section
        .org 0x0500
RESULT: .db 0                   ; Expected: 0x78 (120)
```

**Expected Result:** RESULT = 0x78 (120)

---

## Progressive Hints

<details>
<summary>Hint 1: Return Address Calculation</summary>

When CALL executes, PC already points to the next instruction (after fetching all 3 bytes of CALL). So you push the current PC value directly - no adjustment needed.

```
Before CALL at 0x0200:
  0x0200: CF      ; CALL opcode
  0x0201: 00      ; addr low
  0x0202: 05      ; addr high (target = 0x0500)
  0x0203: xx      ; next instruction (return address)

After fetching CALL:
  PC = 0x0203     ; Already points to return address

So push PC (0x0203) to stack.
```
</details>

<details>
<summary>Hint 2: Stack Frame During Recursion</summary>

For factorial(3), the stack grows like this:

```
Call factorial(3):
  Stack: [return_to_main]

Call factorial(2) from factorial(3):
  Stack: [ret_main] [n=3] [ret_fact3]

Call factorial(1) from factorial(2):
  Stack: [ret_main] [n=3] [ret_fact3] [n=2] [ret_fact2]

Call factorial(0) from factorial(1):
  Stack: [ret_main] [n=3] [ret_fact3] [n=2] [ret_fact2] [n=1] [ret_fact1]

Base case returns, stack unwinds...
```

Each level needs its own saved `n` value!
</details>

<details>
<summary>Hint 3: Why PUSH Order Matters</summary>

In CALL, we push the 16-bit return address as two bytes. The order must match how RET pops:

CALL pushes: high byte first, then low byte
```
memory[SP-1] = PC_high
memory[SP-2] = PC_low
SP = SP - 2
```

RET pops: low byte first, then high byte
```
PC_low = memory[SP]
PC_high = memory[SP+1]
SP = SP + 2
```

This is consistent with little-endian: low byte at lower address.
</details>

<details>
<summary>Hint 4: Debugging Recursive Calls</summary>

Common bugs in recursive subroutines:
1. **Forgetting to save n**: Pop returns garbage
2. **Wrong pop order**: Registers mixed up
3. **Missing base case**: Infinite recursion (stack overflow)
4. **Off-by-one**: Check n=0, n=1 cases

Debug by single-stepping and watching:
- Stack contents
- SP value
- Register values at each CALL/RET
</details>

<details>
<summary>Hint 5: Multiply Without Hardware Multiplier</summary>

Since Micro8 doesn't have a MUL instruction in the basic set, use repeated addition:

```assembly
; R0 = R1 * R2 (R1 = multiplicand, R2 = multiplier)
MULTIPLY:
        PUSH R2
        LDI R0, 0               ; Result = 0
MULT_LOOP:
        CMPI R2, 0
        JZ MULT_END
        ADD R0, R1              ; Result += multiplicand
        DEC R2                  ; multiplier--
        JMP MULT_LOOP
MULT_END:
        POP R2
        RET
```

This is O(n) - works fine for small values but slow for large ones.
</details>

---

## Literature References

- **Patterson & Hennessy, "Computer Organization and Design"**: Procedure calling conventions
- **Intel 8085 Programming Manual**: CALL/RET instruction details
- **"The Art of Assembly Language"** by Randall Hyde: Chapter on procedures
- **"Structure and Interpretation of Computer Programs"**: Recursive processes

---

## Expected Outcome

When complete, you should be able to:

1. Call subroutines with `CALL addr`
2. Return from subroutines with `RET`
3. Write nested subroutine calls
4. Preserve registers across calls
5. Implement recursive algorithms

---

## Verification Checklist

- [ ] `CALL addr` pushes return address (2 bytes) and jumps
- [ ] `RET` pops return address and jumps back
- [ ] Nested calls work (A calls B calls C)
- [ ] Register preservation with PUSH/POP in subroutines
- [ ] Factorial(5) = 120 computed correctly
- [ ] Stack balanced after all calls return

---

## Challenge Extensions

1. **Tail recursion**: Optimize tail calls to avoid stack growth
2. **Stack frames**: Implement proper frame pointer (FP) usage
3. **Local variables**: Allocate stack space for locals
4. **Calling conventions**: Define and document your ABI

---

## Next Steps

Once CALL/RET work, move on to:
- **Exercise 05**: Interrupt Handling - similar to CALL but triggered by hardware
