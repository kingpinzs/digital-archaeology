# Exercise 03: Stack Operations

**Difficulty:** ⭐⭐ Medium
**Time:** ~45-60 minutes
**Prerequisites:** Exercise 01 (Register Pairs), Exercise 02 (Index Registers)

---

## Goal

Implement a hardware stack using the Stack Pointer (SP) register. The stack enables subroutine calls, local variables, and register preservation - essential for structured programming.

---

## Background

A **stack** is a Last-In-First-Out (LIFO) data structure. The CPU uses it to:
- Save return addresses for subroutine calls
- Preserve register values
- Store local variables
- Pass parameters to functions

The **Stack Pointer (SP)** is a 16-bit register pointing to the current top of stack.

### Stack Growth Direction

Stacks can grow up (toward higher addresses) or down (toward lower addresses). The Micro8 uses **downward growth** (like x86, ARM, and most modern CPUs):

```
Memory:
0x01FD: [empty - SP points here initially]
0x01FC: [first pushed value]
0x01FB: [second pushed value]
0x01FA: [third pushed value]
...
```

- **PUSH**: Decrement SP, then write
- **POP**: Read, then increment SP

---

## Current State in HDL

From `hdl/05_micro8_cpu.m4hdl`:

```
# Stack Pointer (16-bit)
wire [15:0] sp;
wire [15:0] sp_next;
wire sp_load;       # Load new value
wire sp_inc;        # Increment (POP)
wire sp_dec;        # Decrement (PUSH)

# Stack instructions
wire is_push;          # 0xD2-0xD9 - PUSH register
wire is_pop;           # 0xDA-0xE1 - POP register
wire is_push16_hl;     # 0xE2
wire is_pop16_hl;      # 0xE3
wire is_push16_bc;     # 0xE4
wire is_pop16_bc;      # 0xE5
wire is_pushf;         # 0xE6 - Push flags
wire is_popf;          # 0xE7 - Pop flags
```

---

## What to Implement

### Step 1: Initialize Stack Pointer

Before using the stack, SP must be initialized:

```assembly
LDI16 SP, 0x01FD    ; Point SP to top of stack area
```

**Design decision:** Where should the stack live?
- Common choice: High memory (0x01FD for 512-byte RAM)
- Must not overlap with program or data
- Stack grows downward, so start at highest usable address

### Step 2: PUSH Register

`PUSH Rd` saves a register to the stack:

```assembly
PUSH R0     ; Save R0 to stack
```

**Execution steps:**
1. Decrement SP (SP = SP - 1)
2. Write Rd to memory[SP]

**HDL sequence:**
```
T1: SP_DEC active (SP = SP - 1)
T2: MAR = SP
T3: Write Rd to memory at MAR
```

### Step 3: POP Register

`POP Rd` restores a register from the stack:

```assembly
POP R0      ; Restore R0 from stack
```

**Execution steps:**
1. Read memory[SP] into Rd
2. Increment SP (SP = SP + 1)

**HDL sequence:**
```
T1: MAR = SP
T2: Memory read, result in MDR
T3: Rd = MDR
T4: SP_INC active (SP = SP + 1)
```

### Step 4: PUSH/POP 16-bit Pairs

For efficiency, push/pop entire register pairs:

```assembly
PUSH16 HL   ; Push H first, then L
POP16 HL    ; Pop L first, then H (reverse order!)
```

**Order matters!** For HL = 0x1234:
- PUSH16 pushes H (0x12) first, then L (0x34)
- Memory: [... 0x34 0x12] (L at lower address)
- POP16 pops L first (0x34), then H (0x12)

### Step 5: PUSHF/POPF - Save and Restore Flags

Critical for interrupt handlers and nested operations:

```assembly
PUSHF       ; Save flags register to stack
; ... do work that affects flags ...
POPF        ; Restore flags to original state
```

---

## Test Program

Test LIFO ordering and nested operations:

```assembly
; stack_test.asm - Test stack operations
; Verifies LIFO order and register preservation

        .org 0x0200

START:
        ; Initialize stack pointer
        LDI16 SP, 0x01FD

        ; ===== Test 1: Basic PUSH/POP =====
        LDI R0, 0xAA
        PUSH R0                 ; Push 0xAA
        LDI R0, 0x00            ; Clear R0
        POP R0                  ; Should get 0xAA back
        ST R0, [TEST1]          ; Expected: 0xAA

        ; ===== Test 2: LIFO Order =====
        LDI R0, 0x11            ; First
        LDI R1, 0x22            ; Second
        LDI R2, 0x33            ; Third
        PUSH R0                 ; Push first
        PUSH R1                 ; Push second
        PUSH R2                 ; Push third

        POP R3                  ; Should be third (0x33)
        POP R4                  ; Should be second (0x22)
        POP R5                  ; Should be first (0x11)

        ST R3, [TEST2A]         ; Expected: 0x33
        ST R4, [TEST2B]         ; Expected: 0x22
        ST R5, [TEST2C]         ; Expected: 0x11

        ; ===== Test 3: 16-bit PUSH/POP =====
        LDI16 HL, 0x1234
        PUSH16 HL               ; Push HL
        LDI16 HL, 0x0000        ; Clear HL
        POP16 HL                ; Restore HL
        ST R5, [TEST3H]         ; Expected: 0x12 (H)
        ST R6, [TEST3L]         ; Expected: 0x34 (L)

        ; ===== Test 4: Mixed 8-bit and 16-bit =====
        LDI R0, 0x55
        PUSH R0                 ; 8-bit push
        LDI16 BC, 0xABCD
        PUSH16 BC               ; 16-bit push
        LDI R7, 0x77
        PUSH R7                 ; 8-bit push

        ; Pop in reverse order
        POP R0                  ; Should be 0x77
        POP16 BC                ; Should be 0xABCD
        POP R1                  ; Should be 0x55

        ST R0, [TEST4A]         ; Expected: 0x77
        ST R1, [TEST4B]         ; Expected: 0xAB (B)
        ST R2, [TEST4C]         ; Expected: 0xCD (C)

        ; ===== Test 5: PUSHF/POPF =====
        ; Create known flags: Z=1, C=1
        LDI R0, 0xFF
        LDI R1, 0x01
        ADD R0, R1              ; 0xFF + 0x01 = 0x00, Z=1, C=1
        PUSHF                   ; Save flags

        ; Change flags
        LDI R0, 0x01
        ADD R0, R1              ; 0x01 + 0x01 = 0x02, Z=0, C=0

        POPF                    ; Restore Z=1, C=1

        ; Test: if Z is restored, this should jump
        JZ FLAGS_OK
        LDI R0, 0xFF            ; Error marker
        JMP FLAGS_DONE
FLAGS_OK:
        LDI R0, 0x01            ; Success marker
FLAGS_DONE:
        ST R0, [TEST5]          ; Expected: 0x01

        HLT

; Data section
        .org 0x0500
TEST1:  .db 0                   ; Expected: 0xAA
TEST2A: .db 0                   ; Expected: 0x33
TEST2B: .db 0                   ; Expected: 0x22
TEST2C: .db 0                   ; Expected: 0x11
TEST3H: .db 0                   ; Expected: 0x12
TEST3L: .db 0                   ; Expected: 0x34
TEST4A: .db 0                   ; Expected: 0x77
TEST4B: .db 0                   ; Expected: 0xAB
TEST4C: .db 0                   ; Expected: 0xCD
TEST5:  .db 0                   ; Expected: 0x01
```

---

## Progressive Hints

<details>
<summary>Hint 1: SP Decrement/Increment Logic</summary>

SP is a 16-bit register, so increment/decrement needs carry handling:

```
; SP = SP - 1 (decrement for PUSH)
SP_low = SP[7:0] - 1
borrow = (SP[7:0] == 0x00)
SP_high = SP[15:8] - borrow

; SP = SP + 1 (increment for POP)
SP_low = SP[7:0] + 1
carry = (SP[7:0] == 0xFF)
SP_high = SP[15:8] + carry
```
</details>

<details>
<summary>Hint 2: PUSH Timing - Write Before Decrement?</summary>

The order matters! Standard convention (used by 8080, Z80, x86):

**Pre-decrement PUSH:**
1. Decrement SP
2. Write to memory[SP]

**Post-increment POP:**
1. Read from memory[SP]
2. Increment SP

This means SP always points to the **last pushed value** (not empty space).

Alternative convention (6502-style):
- SP points to next empty slot
- PUSH: Write to [SP], then decrement
- POP: Increment SP, then read

Either works, but be consistent!
</details>

<details>
<summary>Hint 3: 16-bit PUSH/POP Order</summary>

For `PUSH16 HL` with HL = 0x1234:

```
Initial: SP = 0x01FD

Step 1: Decrement SP (0x01FC), write H (0x12)
  Memory[0x01FC] = 0x12

Step 2: Decrement SP (0x01FB), write L (0x34)
  Memory[0x01FB] = 0x34

Final: SP = 0x01FB
```

Memory layout:
```
0x01FC: 0x12 (H - pushed first, higher address)
0x01FB: 0x34 (L - pushed second, lower address)
```

POP16 reverses: read L from 0x01FB, read H from 0x01FC.
</details>

<details>
<summary>Hint 4: Flags Register Format</summary>

Decide how flags are packed into a byte:

```
Bit 7: S (Sign)
Bit 6: Z (Zero)
Bit 5: (unused)
Bit 4: (unused)
Bit 3: (unused)
Bit 2: O (Overflow)
Bit 1: (unused)
Bit 0: C (Carry)
```

PUSHF saves this byte; POPF restores it.
</details>

<details>
<summary>Hint 5: Stack Overflow/Underflow</summary>

What happens if:
- Too many PUSHes: SP goes below stack area (collision with data)
- Too many POPs: SP goes above initial value (garbage reads)

Advanced: Add stack bounds checking
- Set stack base and limit registers
- Trap on overflow/underflow

For this exercise, trust the programmer to balance pushes/pops.
</details>

---

## Literature References

- **Intel 8085 User Manual**: Stack operations and conventions
- **Patterson & Hennessy**: Chapter on procedure calls and the stack
- **MIPS Calling Conventions**: Stack frame organization
- **x86-64 System V ABI**: Modern stack usage patterns

---

## Expected Outcome

When complete, you should be able to:

1. Initialize SP with `LDI16 SP, addr`
2. Push/pop 8-bit registers with `PUSH`/`POP`
3. Push/pop 16-bit pairs with `PUSH16`/`POP16`
4. Save/restore flags with `PUSHF`/`POPF`
5. Understand LIFO order and proper push/pop balance

---

## Verification Checklist

- [ ] `LDI16 SP, 0x01FD` initializes stack pointer
- [ ] `PUSH R0` decrements SP and writes R0
- [ ] `POP R0` reads into R0 and increments SP
- [ ] LIFO order verified: push A,B,C → pop C,B,A
- [ ] `PUSH16 HL` handles both bytes in correct order
- [ ] `POP16 HL` restores bytes in correct order
- [ ] `PUSHF`/`POPF` correctly save/restore all flags
- [ ] Test program passes all 5 tests

---

## Challenge Extensions

1. **Stack dump**: Write a routine that displays stack contents
2. **Stack depth counter**: Track maximum stack depth used
3. **Protected stack**: Add bounds checking with trap on overflow
4. **Alternate stack**: Support two stack pointers for user/kernel

---

## Next Steps

Once the stack works, move on to:
- **Exercise 04**: Subroutine Calls - use the stack for CALL/RET
- **Exercise 05**: Interrupt Handling - use the stack to save context
