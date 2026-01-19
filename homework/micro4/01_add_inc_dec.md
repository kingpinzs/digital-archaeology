# Exercise 01: Add INC and DEC Instructions

**Difficulty:** Easy

**Estimated Time:** 30-60 minutes

---

## Goal

Add INC (increment) and DEC (decrement) instructions to the Micro4 CPU. These single-byte instructions modify the accumulator without requiring a memory operand.

---

## Prerequisites

- Understanding of Micro4's basic instruction set (LDA, STA, ADD, SUB, JMP, JZ, LDI, HLT)
- Familiarity with the HDL format used in `hdl/04_micro4_cpu.m4hdl`
- Knowledge of how the ALU performs ADD and SUB operations

---

## Current State

The Micro4 CPU currently has 8 instructions using opcodes 0x0-0x7:

| Opcode | Mnemonic | Operation |
|--------|----------|-----------|
| 0x0 | HLT | Halt execution |
| 0x1 | LDA addr | A = mem[addr] |
| 0x2 | STA addr | mem[addr] = A |
| 0x3 | ADD addr | A = A + mem[addr] |
| 0x4 | SUB addr | A = A - mem[addr] |
| 0x5 | JMP addr | PC = addr |
| 0x6 | JZ addr | if Z: PC = addr |
| 0x7 | LDI n | A = n (4-bit immediate) |

Opcodes 0x8-0xF are unused and available for new instructions.

To increment or decrement, programmers currently must:
```asm
; Increment A (currently requires 2 instructions + constant in memory)
ADD ONE          ; A = A + 1 (ONE is stored in memory as constant 1)

; Decrement A
SUB ONE          ; A = A - 1
```

This is wasteful because:
1. Requires a memory location to store the constant 1
2. Takes 5 cycles (2-byte instruction with memory access)
3. Uses extra program space

---

## What to Add

### New Instructions

| Opcode | Mnemonic | Operation | Cycles |
|--------|----------|-----------|--------|
| 0x8 | INC | A = A + 1 | 3 |
| 0x9 | DEC | A = A - 1 | 3 |

### Instruction Format

Both INC and DEC are single-byte instructions with no operand:
```
INC: 0x80 (opcode 0x8, operand nibble ignored)
DEC: 0x90 (opcode 0x9, operand nibble ignored)
```

### Implementation Changes

1. **Instruction Decoder:** Add decode logic for opcodes 0x8 and 0x9
2. **ALU Input Mux:** Route constant 0x1 to ALU input B when INC/DEC active
3. **Control Unit:** Add states for single-byte instruction execution
4. **ALU Operation:** INC uses ADD mode, DEC uses SUB mode

---

## Test Program

Create `programs/test_inc_dec.asm`:

```asm
; test_inc_dec.asm - Test INC and DEC instructions
; Expected results:
;   COUNT1 = 5 (start at 0, increment 5 times)
;   COUNT2 = 3 (start at 8, decrement 5 times)

        ORG 0x00

START:  LDI 0           ; A = 0
        INC             ; A = 1
        INC             ; A = 2
        INC             ; A = 3
        INC             ; A = 4
        INC             ; A = 5
        STA COUNT1      ; Store result (should be 5)

        LDI 8           ; A = 8
        DEC             ; A = 7
        DEC             ; A = 6
        DEC             ; A = 5
        DEC             ; A = 4
        DEC             ; A = 3
        STA COUNT2      ; Store result (should be 3)

        HLT

; Data section
        ORG 0x30
COUNT1: DB  0           ; Should be 5 after execution
COUNT2: DB  0           ; Should be 3 after execution

; Verify: Memory 0x30 = 0x5, Memory 0x31 = 0x3
```

---

## Hints

### Hint 1: Opcode Decoding
<details>
<summary>Click to reveal</summary>

The decoder already has logic for opcodes 0x0-0x7. For opcode 0x8 (INC):
- Bit pattern is 1000
- is_inc = op3 & !op2 & !op1 & !op0

For opcode 0x9 (DEC):
- Bit pattern is 1001
- is_dec = op3 & !op2 & !op1 & op0

</details>

### Hint 2: ALU Input B
<details>
<summary>Click to reveal</summary>

The ALU normally gets its B input from MDR (memory data). For INC/DEC, you need to:
1. Add a multiplexer before ALU input B
2. Select between MDR (for ADD/SUB) and constant 0001 (for INC/DEC)

```
wire alu_b_sel;  ; 0 = MDR, 1 = constant 1
or ALU_B_SEL (input: is_inc is_dec, output: alu_b_sel);

; Then use a 4-bit 2:1 mux for alu_b_in
```

</details>

### Hint 3: Single-Byte Execution
<details>
<summary>Click to reveal</summary>

INC/DEC don't need to fetch an address byte. The state machine can skip the FETCH_ADDR states:

```
S0: FETCH1    - Fetch opcode
S1: FETCH2    - IR loaded, PC++
S2: DECODE    - See INC or DEC
S3: EXECUTE   - A = A +/- 1 (skip address fetch!)
(back to S0)
```

This is why INC/DEC only take 3 cycles vs 5 for ADD/SUB.

</details>

### Hint 4: Control Signal Generation
<details>
<summary>Click to reveal</summary>

The control unit needs to generate:
- `acc_load = 1` during EXECUTE for INC/DEC
- `z_load = 1` to update zero flag
- `alu_op0 = is_dec` (0 for ADD/INC, 1 for SUB/DEC)
- `alu_b_sel = is_inc | is_dec` to select constant 1

</details>

### Hint 5: Complete Decoder Logic
<details>
<summary>Click to reveal</summary>

```hdl
# is_inc = op3 & !op2 & !op1 & !op0  (1000)
wire inc_t1, inc_t2;
and DEC_INC1 (input: opcode[3] op2n, output: inc_t1);
and DEC_INC2 (input: op1n op0n, output: inc_t2);
and DEC_INC3 (input: inc_t1 inc_t2, output: is_inc);

# is_dec = op3 & !op2 & !op1 & op0  (1001)
wire dec_t;
and DEC_DEC1 (input: op1n opcode[0], output: dec_t);
and DEC_DEC2 (input: inc_t1 dec_t, output: is_dec);
```

</details>

---

## Expected Outcome

After implementing INC and DEC:

1. **Test program passes:** COUNT1 = 5, COUNT2 = 3
2. **Cycle savings:** INC takes 3 cycles vs 5 for `ADD ONE`
3. **Code density:** No need to store constant 1 in memory
4. **Z flag works:** DEC from 1 should set Z flag

### Verification Checklist

- [ ] Opcode 0x8 is decoded as INC
- [ ] Opcode 0x9 is decoded as DEC
- [ ] ALU receives constant 1 for B input during INC/DEC
- [ ] ALU performs ADD for INC, SUB for DEC
- [ ] Result is stored back to accumulator
- [ ] Zero flag is updated correctly
- [ ] PC increments by 1 (single-byte instruction)
- [ ] Test program produces correct results

---

## Why This Matters

INC and DEC are among the most common operations in real programs:
- Loop counters
- Array indexing
- Pointer manipulation

Every CPU since the Intel 4004 has had dedicated increment/decrement instructions. You've just discovered why!

---

## Next Exercise

Once INC/DEC are working, proceed to **Exercise 02: Add Zero Flag for Branch on Zero** to add the JNZ instruction.
