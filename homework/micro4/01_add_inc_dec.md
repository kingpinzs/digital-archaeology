# Exercise 01: Add INC and DEC Instructions

**Difficulty:** Easy

**Estimated Time:** 20-30 minutes

---

## Goal

Add two new instructions to the Micro4 CPU:
- **INC** - Increment the accumulator (A = A + 1)
- **DEC** - Decrement the accumulator (A = A - 1)

These instructions operate only on the accumulator and don't need a memory operand, making them faster than using `ADD` with a constant from memory.

---

## Prerequisites

- Basic understanding of the Micro4 architecture
- Familiarity with the existing instruction decoder in `hdl/04_micro4_cpu.m4hdl`
- No prior homework exercises required

---

## Current State (What Exists)

### Available Opcodes
The Micro4 CPU currently uses opcodes 0x0-0x7:

| Opcode | Instruction | Description |
|--------|-------------|-------------|
| 0x0 | HLT | Halt execution |
| 0x1 | LDA addr | Load A from memory |
| 0x2 | STA addr | Store A to memory |
| 0x3 | ADD addr | A = A + mem[addr] |
| 0x4 | SUB addr | A = A - mem[addr] |
| 0x5 | JMP addr | Jump to address |
| 0x6 | JZ addr | Jump if zero flag set |
| 0x7 | LDI imm | Load immediate value |
| 0x8-0xF | *unused* | **Available for new instructions** |

### Existing ALU
The ALU already supports addition and subtraction. Looking at `hdl/04_micro4_cpu.m4hdl`:

```
# ALU operation: SUB if is_sub, else ADD
buf ALU_OP (input: is_sub, output: alu_op0);
```

The ALU takes two 4-bit inputs (A and B from MDR) and produces a result.

### Key Insight
For INC and DEC, you need to add 1 or subtract 1 from the accumulator. The question is: how do you get the value "1" to the ALU's B input without reading from memory?

---

## What to Add

### 1. New Opcodes (Choose from 0x8-0xF)

Suggested assignment:
- **0xE** = INC (A = A + 1)
- **0xF** = DEC (A = A - 1)

### 2. Instruction Decoder Logic

Add decode logic similar to existing instructions:

```
# is_inc = op3 & op2 & op1 & !op0  (1110 = 0xE)
wire inc_t1, inc_t2;
and DEC_INC1 (input: opcode[3] opcode[2], output: inc_t1);
and DEC_INC2 (input: opcode[1] op0n, output: inc_t2);
and DEC_INC3 (input: inc_t1 inc_t2, output: is_inc);

# is_dec = op3 & op2 & op1 & op0  (1111 = 0xF)
wire dec_t;
and DEC_DEC1 (input: opcode[1] opcode[0], output: dec_t);
and DEC_DEC2 (input: inc_t1 dec_t, output: is_dec);
```

### 3. Constant "1" Source

You need a way to feed the constant value 1 (0001 in binary) to the ALU's B input. Options:

**Option A: Hardwired constant**
```
# Constant 1 for INC/DEC
wire const_one[3:0];
gnd CONST1_0 (output: const_one[0]);  # Wait, 1 needs bit 0 = 1!
vcc CONST1_BIT0 (output: const_one[0]);  # Bit 0 = 1
gnd CONST1_BIT1 (output: const_one[1]);  # Bit 1 = 0
gnd CONST1_BIT2 (output: const_one[2]);  # Bit 2 = 0
gnd CONST1_BIT3 (output: const_one[3]);  # Bit 3 = 0
```

**Option B: Multiplexer on ALU B input**
```
# Select between MDR and constant 1 for ALU B input
wire use_const_one;
or USE_CONST (input: is_inc is_dec, output: use_const_one);

# MUX: if use_const_one, B = 0001; else B = MDR
mux2 ALU_B_MUX0 (input: mdr[0] const_one[0] use_const_one, output: alu_b_in[0]);
mux2 ALU_B_MUX1 (input: mdr[1] const_one[1] use_const_one, output: alu_b_in[1]);
mux2 ALU_B_MUX2 (input: mdr[2] const_one[2] use_const_one, output: alu_b_in[2]);
mux2 ALU_B_MUX3 (input: mdr[3] const_one[3] use_const_one, output: alu_b_in[3]);
```

### 4. Control Unit Modifications

INC and DEC are single-byte instructions (no address operand), so they execute faster:

```
Cycle 1: Fetch opcode
Cycle 2: Decode, recognize INC or DEC
Cycle 3: A <- A +/- 1, update Z flag
(back to fetch)
```

The control unit needs to:
- Skip the address fetch cycles for INC/DEC
- Set `alu_op0` to 0 for INC (addition) or 1 for DEC (subtraction)
- Enable `acc_load` and `z_load` in the execute cycle

### 5. ALU Operation Selection

Modify the ALU operation signal:
```
# ALU does SUB if is_sub OR is_dec
wire alu_sub;
or ALU_SUB_SEL (input: is_sub is_dec, output: alu_sub);
buf ALU_OP (input: alu_sub, output: alu_op0);
```

---

## Test Program

Create `programs/test_inc_dec.asm`:

```asm
; test_inc_dec.asm - Test INC and DEC instructions
; Expected result: A = 5, RESULT = 5

        ORG 0x00

START:  LDI 3           ; A = 3
        INC             ; A = 4
        INC             ; A = 5
        INC             ; A = 6
        DEC             ; A = 5
        STA RESULT      ; Store result

        ; Test zero flag with DEC
        LDI 1           ; A = 1
        DEC             ; A = 0, Z flag should be set
        JZ  PASS        ; Should jump
        JMP FAIL

PASS:   LDA RESULT      ; A = 5 (our earlier result)
        HLT

FAIL:   LDI 0           ; A = 0 (failure indicator)
        STA RESULT
        HLT

; Data section
        ORG 0x30
RESULT: DB  0           ; Should contain 5 after execution
```

---

## Verification

After implementing INC and DEC:

1. Assemble and run the test program:
   ```bash
   cd src/micro4
   ./assembler ../../programs/test_inc_dec.asm -o test_inc_dec.bin
   ./emulator test_inc_dec.bin
   ```

2. Expected output:
   - Final A register value: 5 (0x5)
   - RESULT memory location (0x30): 5
   - Z flag: 0 (cleared by final LDA)

3. Verify wrap-around behavior:
   ```asm
   LDI 15          ; A = 0xF
   INC             ; A = 0x0 (wraps), Z flag set
   ```

---

## Hints

<details>
<summary>Hint 1: Where to start</summary>

Start with the instruction decoder. Add `is_inc` and `is_dec` signals following the pattern of existing instructions like `is_hlt` or `is_ldi`. The decoder is pure combinational logic - just AND gates matching the opcode bits.
</details>

<details>
<summary>Hint 2: The constant value</summary>

You need to provide the value 1 to the ALU. The simplest approach is a 4-bit multiplexer that selects between the MDR (for normal ADD/SUB) and a hardwired constant 0001 (for INC/DEC).

In hardware terms:
- VCC (logic 1) for bit 0
- GND (logic 0) for bits 1, 2, 3
</details>

<details>
<summary>Hint 3: Control unit state machine</summary>

INC and DEC skip the "fetch address" states. After decode, go directly to execute. Your state transition logic needs to check:

```
if (is_inc OR is_dec) then
    next_state = EXECUTE
else if (needs_address)
    next_state = FETCH_ADDR
```
</details>

<details>
<summary>Hint 4: ALU operation signal</summary>

The existing code uses `is_sub` to control ADD vs SUB. You need to extend this:
- ADD: when `is_add` OR `is_inc`
- SUB: when `is_sub` OR `is_dec`

Actually, since ADD is the default (alu_op0 = 0), you only need:
```
alu_op0 = is_sub OR is_dec
```
</details>

<details>
<summary>Hint 5: Complete solution outline</summary>

1. Add decoder outputs: `is_inc`, `is_dec`
2. Add constant 1 source: hardwired VCC/GND
3. Add MUX before ALU B input: selects MDR or constant 1
4. Modify ALU operation: `alu_op0 = is_sub OR is_dec`
5. Modify control unit: skip address fetch for INC/DEC
6. Ensure Z flag updates after INC/DEC
</details>

---

## Expected Outcome

After completing this exercise:

1. The Micro4 CPU supports two new instructions:
   - `INC` (opcode 0xE): Increment accumulator
   - `DEC` (opcode 0xF): Decrement accumulator

2. Both instructions:
   - Execute in 3 cycles (vs 5 for ADD/SUB with memory)
   - Update the Z flag based on the result
   - Handle wrap-around correctly (0xF + 1 = 0x0, 0x0 - 1 = 0xF)

3. The test program produces:
   ```
   A = 0x5
   Z = 0
   mem[0x30] = 0x5
   ```

---

## Why This Matters

INC and DEC are fundamental operations found in virtually every CPU:
- Loop counters (`for i = 0; i < 10; i++`)
- Pointer arithmetic
- Reference counting
- Stack pointer manipulation

By implementing them as dedicated instructions instead of `ADD mem` with a constant, you:
- Save memory (no need to store constant 1)
- Reduce cycles (no memory fetch)
- Use simpler addressing (implicit operand)

The Intel 4004 (1971) had INC instructions. The 8080 (1974) had both INC and DEC. Your Micro4 is joining a long lineage!

---

## Next Exercise

Continue to [Exercise 02: Add Zero Flag](02_add_zero_flag.md) to learn about status flags and conditional execution.
