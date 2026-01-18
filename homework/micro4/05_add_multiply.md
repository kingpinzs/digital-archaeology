# Exercise 05: Add Hardware Multiply Instruction

**Difficulty:** Expert

**Estimated Time:** 2-4 hours

---

## Goal

Implement a hardware **MUL** (Multiply) instruction for the Micro4 CPU:
- `MUL addr`: A = A * mem[addr]

This is the most complex exercise in the series, requiring:
- Understanding binary multiplication algorithms
- Building a multiplier circuit (combinational or sequential)
- Handling the expanded result size (4x4 = 8 bits)
- Modifying the datapath significantly

**Challenge:** 4-bit × 4-bit multiplication produces up to 8 bits. Where does the high nibble go?

---

## Prerequisites

- Complete understanding of Micro4 architecture
- Exercise 03 (Carry Flag) recommended - high nibble can go in C-extended register
- Exercise 04 (Shifts) helpful - multiplication uses shift-and-add
- Strong grasp of binary arithmetic

---

## Current State (What Exists)

### No Multiplication Hardware

The current ALU only supports ADD and SUB. Multiplication must be built from scratch.

### Memory-Based Multiplication

The existing `programs/multiply.asm` uses repeated addition:
```asm
; 3 * 4 = 12 using repeated addition
; ~20 cycles per iteration, 4 iterations = ~80 cycles
```

Hardware multiply could do the same in ~4-10 cycles.

---

## Understanding Binary Multiplication

### Pencil-and-Paper Method

Binary multiplication is like decimal, but simpler (only multiply by 0 or 1):

```
      1101  (13)
    × 0101  (5)
    ------
      1101  (13 × 1)
     0000   (13 × 0, shifted)
    1101    (13 × 1, shifted)
   0000     (13 × 0, shifted)
  --------
  01000001  (65)
```

Each bit of the multiplier either:
- Adds the multiplicand (shifted) if bit = 1
- Adds nothing if bit = 0

### 4-bit × 4-bit = 8-bit Result

Maximum values:
- 15 × 15 = 225 (0xE1)
- Requires 8 bits to store

**Design decision:** Where does the result go?
- Option A: Low 4 bits in A, high 4 bits in a new register (like 8086's AX = AH:AL)
- Option B: Low 4 bits in A, high 4 bits discarded (overflow lost)
- Option C: Low 4 bits in A, high 4 bits in memory at addr+1
- Option D: Result replaces two consecutive memory locations

We'll use **Option A** - introduce a result extension using memory or a new approach.

---

## What to Add

### Approach 1: Combinational Multiplier (Parallel)

Build a 4×4 array multiplier that computes the result in one cycle.

**Array Multiplier Structure:**
```
         B3  B2  B1  B0
       ×A3  A2  A1  A0
       ----------------
Partial products:
  P0 = A0×B3  A0×B2  A0×B1  A0×B0
  P1 = A1×B3  A1×B2  A1×B1  A1×B0  (shifted left 1)
  P2 = A2×B3  A2×B2  A2×B1  A2×B0  (shifted left 2)
  P3 = A3×B3  A3×B2  A3×B1  A3×B0  (shifted left 3)
```

Each partial product bit is just an AND gate:
```
wire pp_00;
and PP00 (input: a[0] b[0], output: pp_00);  # A0 AND B0
```

Then sum all partial products using full adders.

**Gate count:** ~40 AND gates + ~20 full adders = substantial but doable

### Approach 2: Sequential Multiplier (Shift-and-Add)

Use the existing ALU and shifter to multiply over multiple cycles:

```
Algorithm:
  Product = 0
  For i = 0 to 3:
    If B[i] == 1:
      Product = Product + (A << i)
  Return Product
```

This requires internal state and takes 4-8 cycles.

**Implementation with microcode:**
```
State MUL_0: Load multiplier bit 0, if 1: temp += A
State MUL_1: Shift A left, Load multiplier bit 1, if 1: temp += A
State MUL_2: Shift A left, Load multiplier bit 2, if 1: temp += A
State MUL_3: Shift A left, Load multiplier bit 3, if 1: temp += A
State MUL_DONE: Store result
```

### 1. Combinational Multiplier Circuit

Here's the full 4×4 combinational multiplier:

```
# Partial product terms (AND gates)
wire pp[3:0][3:0];  # pp[i][j] = A[i] AND B[j]

# Row 0: A AND B[0]
and PP_0_0 (input: acc[0] mdr[0], output: pp[0][0]);
and PP_0_1 (input: acc[1] mdr[0], output: pp[0][1]);
and PP_0_2 (input: acc[2] mdr[0], output: pp[0][2]);
and PP_0_3 (input: acc[3] mdr[0], output: pp[0][3]);

# Row 1: A AND B[1] (will be shifted left 1)
and PP_1_0 (input: acc[0] mdr[1], output: pp[1][0]);
and PP_1_1 (input: acc[1] mdr[1], output: pp[1][1]);
and PP_1_2 (input: acc[2] mdr[1], output: pp[1][2]);
and PP_1_3 (input: acc[3] mdr[1], output: pp[1][3]);

# Row 2: A AND B[2] (will be shifted left 2)
and PP_2_0 (input: acc[0] mdr[2], output: pp[2][0]);
and PP_2_1 (input: acc[1] mdr[2], output: pp[2][1]);
and PP_2_2 (input: acc[2] mdr[2], output: pp[2][2]);
and PP_2_3 (input: acc[3] mdr[2], output: pp[2][3]);

# Row 3: A AND B[3] (will be shifted left 3)
and PP_3_0 (input: acc[0] mdr[3], output: pp[3][0]);
and PP_3_1 (input: acc[1] mdr[3], output: pp[3][1]);
and PP_3_2 (input: acc[2] mdr[3], output: pp[3][2]);
and PP_3_3 (input: acc[3] mdr[3], output: pp[3][3]);

# Now sum with proper alignment:
#
# Bit 0: pp[0][0]
# Bit 1: pp[0][1] + pp[1][0]
# Bit 2: pp[0][2] + pp[1][1] + pp[2][0]
# Bit 3: pp[0][3] + pp[1][2] + pp[2][1] + pp[3][0]
# Bit 4: pp[1][3] + pp[2][2] + pp[3][1]
# Bit 5: pp[2][3] + pp[3][2]
# Bit 6: pp[3][3]
# Bit 7: carry out

wire [7:0] mul_result;
# Bit 0 is direct
buf MUL_R0 (input: pp[0][0], output: mul_result[0]);

# Bit 1: half adder
wire ha1_sum, ha1_carry;
xor HA1_SUM (input: pp[0][1] pp[1][0], output: ha1_sum);
and HA1_CARRY (input: pp[0][1] pp[1][0], output: ha1_carry);
buf MUL_R1 (input: ha1_sum, output: mul_result[1]);

# Continue with full adders for remaining bits...
# (This gets complex - see hints for simplification)
```

### 2. Result Handling

The multiply produces 8 bits. Options:

**Option A: Split result**
- Low nibble (bits 0-3) goes to accumulator A
- High nibble (bits 4-7) goes to a new register or memory

```
# Low nibble to accumulator
buf MUL_A0 (input: mul_result[0], output: acc_next[0]);
buf MUL_A1 (input: mul_result[1], output: acc_next[1]);
buf MUL_A2 (input: mul_result[2], output: acc_next[2]);
buf MUL_A3 (input: mul_result[3], output: acc_next[3]);

# High nibble to result_high register (new!)
wire [3:0] result_hi;
dff RH0 (input: mul_result[4] clk, output: result_hi[0]);
dff RH1 (input: mul_result[5] clk, output: result_hi[1]);
dff RH2 (input: mul_result[6] clk, output: result_hi[2]);
dff RH3 (input: mul_result[7] clk, output: result_hi[3]);
```

**Option B: Write high nibble to memory**
- MUL addr computes result
- Low nibble goes to A
- High nibble written to addr+1 automatically

### 3. Instruction Decoder

Since we've used 0x8-0xF, we need to either:
- Use opcode from 0x8-0xF if available
- Extend to 2-byte opcodes
- Repurpose an existing opcode

**Assuming 0x8 is available** (or use any free opcode):
```
# is_mul = 1000 (0x8) -- OR whatever opcode you choose
wire mul_t1, mul_t2;
and DEC_MUL1 (input: opcode[3] op2n, output: mul_t1);
and DEC_MUL2 (input: op1n op0n, output: mul_t2);
and DEC_MUL3 (input: mul_t1 mul_t2, output: is_mul);
```

### 4. Control Unit

MUL is a 2-byte instruction (like ADD):
```
Cycle 1: Fetch opcode
Cycle 2: Decode, recognize MUL
Cycle 3: Fetch address byte
Cycle 4: MAR <- address, read memory (get multiplier)
Cycle 5: Execute multiply, A <- low nibble
Cycle 6: (Optional) Store high nibble
(back to fetch)
```

---

## Test Program

Create `programs/test_multiply.asm`:

```asm
; test_multiply.asm - Test hardware MUL instruction
; Tests various multiplication cases

        ORG 0x00

START:
        ; Test 1: 3 * 4 = 12 (0xC)
        LDI 3           ; A = 3
        MUL FOUR        ; A = 12
        SUB TWELVE
        JZ  TEST2
        JMP FAIL

TEST2:
        ; Test 2: 2 * 2 = 4
        LDI 2
        MUL TWO
        SUB FOUR
        JZ  TEST3
        JMP FAIL

TEST3:
        ; Test 3: 5 * 0 = 0
        LDI 5
        MUL ZERO
        JZ  TEST4       ; Result should be 0
        JMP FAIL

TEST4:
        ; Test 4: 0 * 7 = 0
        LDI 0
        MUL SEVEN
        JZ  TEST5
        JMP FAIL

TEST5:
        ; Test 5: 1 * 15 = 15
        LDI 1
        MUL FIFTEEN
        SUB FIFTEEN
        JZ  TEST6
        JMP FAIL

TEST6:
        ; Test 6: 15 * 1 = 15
        LDI 15
        MUL ONE
        SUB FIFTEEN
        JZ  TEST_OVERFLOW
        JMP FAIL

TEST_OVERFLOW:
        ; Test 7: 4 * 4 = 16 (0x10)
        ; Low nibble = 0, high nibble = 1
        ; If only checking low nibble:
        LDI 4
        MUL FOUR        ; Result = 16 = 0x10
        ; Low nibble is 0, so A = 0
        JZ  TEST_BIG    ; Z flag should be set (low nibble is 0)
        JMP FAIL

TEST_BIG:
        ; Test 8: 15 * 15 = 225 (0xE1)
        ; Low nibble = 1, high nibble = E (14)
        LDI 15
        MUL FIFTEEN     ; A = 1 (low nibble of 225)
        SUB ONE
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
        ORG 0x40
ZERO:    DB  0
ONE:     DB  1
TWO:     DB  2
THREE:   DB  3
FOUR:    DB  4
SEVEN:   DB  7
TWELVE:  DB  12         ; 0xC
FIFTEEN: DB  15         ; 0xF
RESULT:  DB  0xFF       ; 1 = pass, 0 = fail
```

Simple multiplication test:

```asm
; test_mul_simple.asm - Basic multiplication test
; 3 * 4 = 12

        ORG 0x00

        LDI 3           ; A = 3
        MUL FOUR        ; A = 12 (0xC)
        STA RESULT
        HLT

        ORG 0x30
FOUR:   DB  4
RESULT: DB  0           ; Should be 12 (0xC)
```

---

## Verification

After implementing MUL:

1. Run the simple test:
   ```bash
   ./assembler ../../programs/test_mul_simple.asm -o test.bin
   ./emulator test.bin
   ```
   Expected: RESULT = 12 (0xC)

2. Run the comprehensive test:
   ```bash
   ./assembler ../../programs/test_multiply.asm -o test.bin
   ./emulator test.bin
   ```
   Expected: RESULT = 1 (all tests passed)

3. Verify multiplication table (low nibble only):
   | A | × | B | = | Full | Low Nibble |
   |---|---|---|---|------|------------|
   | 3 | × | 4 | = | 12   | 12 (0xC)   |
   | 4 | × | 4 | = | 16   | 0          |
   | 5 | × | 5 | = | 25   | 9          |
   | 15| × | 15| = | 225  | 1          |

---

## Hints

<details>
<summary>Hint 1: Start with 2×2 multiplication</summary>

Before building 4×4, try 2×2:
```
      B1  B0
    × A1  A0
    --------
  A0B1 A0B0        (row 0)
 A1B1 A1B0 0       (row 1, shifted)
-----------
  P3  P2  P1  P0

P0 = A0B0
P1 = A0B1 XOR A1B0
P2 = A1B1 XOR (A0B1 AND A1B0)  [carry from P1]
P3 = carry from P2
```

Scale this pattern to 4×4.
</details>

<details>
<summary>Hint 2: Use Wallace tree structure</summary>

Instead of adding partial products row by row, group them efficiently:

```
Bits to sum at each position:
P0: 1 bit  (pp00)
P1: 2 bits (pp01, pp10)
P2: 3 bits (pp02, pp11, pp20)
P3: 4 bits (pp03, pp12, pp21, pp30)
P4: 3 bits (pp13, pp22, pp31)
P5: 2 bits (pp23, pp32)
P6: 1 bit  (pp33)
P7: carries

Use full adders (3→2) and half adders (2→1) to reduce.
```
</details>

<details>
<summary>Hint 3: Sequential multiplier is easier</summary>

If the combinational multiplier seems too complex, implement a sequential version:

```
register [7:0] product = 0
register [3:0] multiplier_copy = B
register [3:0] multiplicand_copy = A

for 4 iterations:
    if multiplier_copy[0] == 1:
        product += (multiplicand_copy << iteration)
    multiplier_copy >>= 1

A = product[3:0]
# Store product[7:4] somewhere
```

This uses the existing ALU and shifter, just needs microcode sequencing.
</details>

<details>
<summary>Hint 4: Handling the 8-bit result</summary>

Simplest approach: just keep the low 4 bits and set overflow flag.

```
# MUL sets C flag if high nibble is non-zero (overflow)
wire mul_overflow;
or MUL_OVF (input: mul_result[4] mul_result[5] mul_result[6] mul_result[7],
            output: mul_overflow);

# When is_mul: c_flag_next = mul_overflow
```

This tells the programmer "result didn't fit in 4 bits."

More advanced: add a second register or use addr+1 for high nibble.
</details>

<details>
<summary>Hint 5: Full adder tree for 4×4</summary>

Here's the complete structure for bits 0-3 (low nibble):

```
Bit 0: pp[0][0] → direct output

Bit 1: pp[0][1] + pp[1][0]
       → Half Adder → sum1, carry1

Bit 2: pp[0][2] + pp[1][1] + pp[2][0] + carry1
       → Full Adder 1 (pp02, pp11, pp20) → sum_a, carry_a
       → Half Adder 2 (sum_a, carry1) → sum2, carry2

Bit 3: pp[0][3] + pp[1][2] + pp[2][1] + pp[3][0] + carry2 + carry_a
       → Use two full adders to combine 6 inputs to 2
       → Final half adder for bit 3
```

It gets messy. Consider drawing it out on paper first.
</details>

---

## Expected Outcome

After completing this exercise:

1. The Micro4 CPU has hardware multiplication:
   - **MUL addr**: A = (A × mem[addr]) mod 16
   - Sets overflow flag (C) if result > 15

2. Performance comparison:
   - Software multiply: ~80 cycles for 3×4
   - Hardware multiply: ~5-6 cycles for 3×4
   - **13× speedup!**

3. Test results:
   ```
   test_mul_simple: RESULT = 0xC (12)
   test_multiply: RESULT = 1 (all tests passed)
   ```

---

## Why This Matters

### Hardware vs Software Trade-offs

This exercise illustrates a fundamental CPU design trade-off:
- **More hardware** = faster operations, but more transistors, power, cost
- **Less hardware** = slower operations, but simpler, cheaper, lower power

Early CPUs (4004, 6502) had no multiply instruction. The 8086 added MUL in 1978. Modern CPUs have multiply-accumulate (MAC) units for DSP.

### Understanding Computer Arithmetic

Building a multiplier teaches:
- Partial products and their alignment
- Carry propagation in wide additions
- Trade-offs between combinational (fast, large) and sequential (slow, small)

### Real-World Multipliers

Production CPUs use sophisticated multipliers:
- **Booth encoding**: Reduces partial products
- **Wallace trees**: Parallel partial product reduction
- **Dadda trees**: Similar to Wallace, different structure
- **Pipelining**: Break multiply across cycles for throughput

Your 4×4 multiplier is a miniature version of these concepts!

### The Road to DSP

Digital Signal Processing relies heavily on multiply-accumulate:
```
sum += a[i] * b[i]  // Common in filters, FFT, neural networks
```

Modern CPUs include:
- SIMD multiply (SSE, AVX)
- Fused multiply-add (FMA)
- Matrix multiplication units (Tensor cores)

Your MUL instruction is the ancestor of all these!

---

## Bonus Challenges

If you complete MUL and want more:

### Challenge A: Add Division (DIV)
Division is even harder than multiplication. Implement:
- `DIV addr`: A = A / mem[addr], remainder in a register

### Challenge B: Signed Multiplication
Handle negative numbers in two's complement:
- `IMUL addr`: Signed multiply

### Challenge C: 8-bit Result Access
Add instructions to read the high nibble:
- `MHI`: Load high nibble of last multiply into A

### Challenge D: Multiply-Accumulate
Add MAC instruction:
- `MAC addr`: A = A + (temp × mem[addr])

---

## Congratulations!

If you've completed all five exercises, you've:
1. Added INC/DEC (basic implicit operands)
2. Enhanced flag handling (Z detection, JNZ)
3. Implemented carry arithmetic (C flag, ADC)
4. Built a shifter/rotator (SHL, SHR, ROL, ROR)
5. Created a hardware multiplier (MUL)

Your Micro4 is now significantly more capable than the minimal design. These same techniques scale to 8-bit, 16-bit, and modern 64-bit CPUs!

**Next steps:**
- Try the Micro8 homework exercises
- Explore the HDL simulator for gate-level verification
- Read the literature on CPU history
- Design your own instructions!
