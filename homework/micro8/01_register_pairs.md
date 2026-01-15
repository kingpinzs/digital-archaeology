# Exercise 01: Register Pairs

**Difficulty:** ⭐ Easy
**Time:** ~30-45 minutes
**Prerequisites:** Completed Micro4 homework, understanding of 8-bit registers

---

## Goal

Implement 16-bit register pairs by combining individual 8-bit registers. This allows 16-bit operations on an 8-bit CPU - essential for addressing 64KB of memory.

---

## Background

The Micro8 has 8 general-purpose 8-bit registers (R0-R7). By convention, certain pairs work together as 16-bit values:

| Pair | High Byte | Low Byte | Primary Use |
|------|-----------|----------|-------------|
| BC   | R1 (B)    | R2 (C)   | Counter     |
| DE   | R3 (D)    | R4 (E)   | Data pointer |
| HL   | R5 (H)    | R6 (L)   | Address pointer |

When combined:
- BC = (R1 << 8) | R2
- HL value 0x1234 means H=0x12, L=0x34

---

## Current State in HDL

The reference implementation (`hdl/05_micro8_cpu.m4hdl`) already defines the register file:

```
wire [7:0] r0;      # R0 / Accumulator
wire [7:0] r1;      # R1 / B
wire [7:0] r2;      # R2 / C
wire [7:0] r3;      # R3 / D
wire [7:0] r4;      # R4 / E
wire [7:0] r5;      # R5 / H
wire [7:0] r6;      # R6 / L
wire [7:0] r7;      # R7
```

---

## What to Implement

### Step 1: Understand Pair Formation

Register pairs are logical constructs - the hardware just sees two 8-bit registers. The "pair" is how software interprets them.

**Questions to answer:**
- [ ] If HL = 0xABCD, what is H? What is L?
- [ ] If B = 0x12 and C = 0x34, what is BC as a 16-bit value?
- [ ] Why is the "high" byte named H and stored in R5, while "low" is L in R6?

### Step 2: Load Immediate 16-bit (LDI16)

Implement loading a 16-bit immediate value into a register pair:

```assembly
LDI16 HL, 0x1234    ; H = 0x12, L = 0x34
LDI16 BC, 0xABCD    ; B = 0xAB, C = 0xCD
LDI16 DE, 0x5678    ; D = 0x56, E = 0x78
```

**HDL Considerations:**
- This is a 3-byte instruction: opcode + low byte + high byte
- Requires two memory fetches after opcode
- Which byte comes first in memory? (Little-endian: low byte first)

### Step 3: Use HL as Memory Pointer

The HL pair's main purpose is memory addressing:

```assembly
LDI16 HL, 0x0500    ; Point HL to address 0x0500
LD R0, [HL]         ; Load byte from address in HL into R0
ST R0, [HL]         ; Store R0 to address in HL
```

**HDL Considerations:**
- When executing `LD R0, [HL]`, how do you form the 16-bit address from H and L?
- The address bus is 16-bit: `address = {H, L}` (concatenation)

### Step 4: Increment/Decrement Pairs

For array traversal, you need to increment the pointer:

```assembly
INC16 HL            ; HL = HL + 1 (16-bit increment)
DEC16 HL            ; HL = HL - 1 (16-bit decrement)
```

**Key challenge:** Carry propagation from L to H.

```
If L = 0xFF and we INC16 HL:
  L becomes 0x00 (with carry)
  H becomes H + 1 (the carry)
```

---

## Test Program

Create a program that uses a 16-bit counter in HL to count from 0 to 255:

```assembly
; 16bit_counter.asm - Test register pairs
; Counts from 0 to 255 using HL as counter
; Stores final H:L at RESULT_H:RESULT_L

        .org 0x0200

START:
        LDI16 HL, 0x0000        ; Initialize counter to 0

COUNT_LOOP:
        ; Check if L has reached 0xFF
        MOV R0, R6              ; R0 = L
        CMPI R0, 0xFF           ; Compare L to 255
        JZ DONE                 ; If L == 255, we're done

        INC16 HL                ; HL = HL + 1
        JMP COUNT_LOOP

DONE:
        ; Store final value
        ST R5, [RESULT_H]       ; Store H
        ST R6, [RESULT_L]       ; Store L
        HLT

; Data section
        .org 0x0500
RESULT_H:       .db 0           ; Expected: 0x00
RESULT_L:       .db 0           ; Expected: 0xFF
```

**Expected Results:**
- RESULT_H = 0x00 (no overflow to H since we stop at 255)
- RESULT_L = 0xFF

---

## Progressive Hints

<details>
<summary>Hint 1: LDI16 Instruction Encoding</summary>

A 3-byte instruction format:
```
Byte 0: Opcode (which pair: HL=0x32, BC=0x33, DE=0x34)
Byte 1: Low byte of immediate
Byte 2: High byte of immediate
```

Fetch sequence:
1. T0: Fetch opcode, decode pair
2. T1: Fetch low byte, store in operand1
3. T2: Fetch high byte, store in operand2
4. T3: Load operand1 into low register (L, C, or E)
5. T4: Load operand2 into high register (H, B, or D)
</details>

<details>
<summary>Hint 2: Forming Address from HL</summary>

In HDL, concatenate H and L to form the 16-bit address:

```
wire [15:0] hl_addr;
buf HL_ADDR_H7 (input: r5[7], output: hl_addr[15]);
buf HL_ADDR_H6 (input: r5[6], output: hl_addr[14]);
... (etc for all bits)
buf HL_ADDR_L0 (input: r6[0], output: hl_addr[0]);
```

Or use a bus assignment if your HDL supports it.
</details>

<details>
<summary>Hint 3: INC16 Carry Logic</summary>

16-bit increment needs carry from L to H:

```
L_next = L + 1
L_carry = (L == 0xFF)  ; L was 255, so it wrapped

H_next = H + L_carry   ; Add carry to H
```

In HDL, this is an 8-bit adder for L, then another for H with carry-in:

```
; L = L + 1
adder8 L_INC (input_a: r6, input_b: 0x01, carry_in: 0,
              output: r6_next, carry_out: l_carry);

; H = H + carry
adder8 H_INC (input_a: r5, input_b: 0x00, carry_in: l_carry,
              output: r5_next, carry_out: h_carry);
```
</details>

<details>
<summary>Hint 4: DEC16 Borrow Logic</summary>

16-bit decrement needs borrow from H to L:

```
L_next = L - 1
L_borrow = (L == 0x00)  ; L was 0, so it wrapped to 0xFF

H_next = H - L_borrow   ; Subtract borrow from H
```
</details>

<details>
<summary>Hint 5: Testing Pair Operations</summary>

Test edge cases:
- INC16 at 0x00FF → should become 0x0100
- INC16 at 0xFFFF → should wrap to 0x0000
- DEC16 at 0x0100 → should become 0x00FF
- DEC16 at 0x0000 → should wrap to 0xFFFF

Write test code for each case and verify H and L values.
</details>

---

## Literature References

- **Patterson & Hennessy, "Computer Organization and Design"**: Chapter on register files and data paths
- **Intel 8080/8085 Programmer's Manual**: Original register pair concept (BC, DE, HL)
- **Z80 CPU User Manual**: Extended register pair operations

---

## Expected Outcome

When complete, you should be able to:

1. Load 16-bit values into register pairs with `LDI16`
2. Use HL as a memory pointer with `LD R0, [HL]` and `ST R0, [HL]`
3. Increment/decrement pairs with `INC16` and `DEC16`
4. Understand how 16-bit operations work on an 8-bit data path

---

## Verification Checklist

- [ ] `LDI16 HL, 0x1234` results in H=0x12, L=0x34
- [ ] `LDI16 BC, 0xABCD` results in B=0xAB, C=0xCD
- [ ] `LD R0, [HL]` reads from address (H<<8)|L
- [ ] `ST R0, [HL]` writes to address (H<<8)|L
- [ ] `INC16 HL` at 0x00FF becomes 0x0100 (carry propagates)
- [ ] `DEC16 HL` at 0x0100 becomes 0x00FF (borrow propagates)
- [ ] Test program counts correctly from 0 to 255

---

## Next Steps

Once register pairs work, move on to:
- **Exercise 02**: Index Registers - use HL for array traversal
- **Exercise 07**: 16-bit Arithmetic - add register pairs together
