# Exercise 05: Add Hardware Multiply Instruction

**Difficulty:** Expert

**Estimated Time:** 4-6 hours

---

## Goal

Add a hardware MUL (multiply) instruction to the Micro4 CPU. This instruction multiplies the 4-bit accumulator by a 4-bit memory operand, producing an 8-bit result. This is a significant hardware addition that teaches core digital design concepts.

---

## Prerequisites

- Completion of Exercises 01-04 (especially Carry Flag and Shifts)
- Understanding of binary multiplication algorithm (shift-and-add)
- Knowledge of combinational vs sequential circuit design
- Familiarity with array multiplier or sequential multiplier concepts

---

## Current State

Without hardware multiply, multiplication requires a software loop:

```asm
; Software multiply: A * B using repeated addition
; Takes ~40-100 cycles depending on B value!

        LDA MULTIPLICAND
        STA TEMP
        LDA MULTIPLIER
        STA COUNTER
        LDI 0
        STA RESULT

LOOP:   LDA COUNTER
        JZ  DONE
        DEC
        STA COUNTER
        LDA RESULT
        ADD TEMP
        STA RESULT
        JMP LOOP

DONE:   LDA RESULT
        HLT
```

This is slow (O(n) where n is the multiplier value) and uses lots of memory.

---

## The Problem: Result Width

When multiplying two 4-bit numbers:
- Maximum input values: 15 × 15 = 225
- 225 in binary: 11100001 (8 bits!)

**4-bit × 4-bit = 8-bit result**

Where do we put the 8-bit result when we only have a 4-bit accumulator?

### Common Solutions

1. **Split result:** Low nibble in A, high nibble in a new register or memory
2. **Register pair:** Use two registers (e.g., H:L for high:low)
3. **Memory result:** Write result directly to two memory locations
4. **Truncated result:** Only keep low 4 bits (loses information!)

For Micro4, we'll use option 1: result low nibble in A, high nibble in a dedicated result register.

---

## What to Add

### New Register

Add a MUL High register to hold the upper 4 bits:
```hdl
wire [3:0] mul_hi;      ; High nibble of multiply result
wire mul_hi_load;
```

### New Instructions

| Opcode | Mnemonic | Operation | Description |
|--------|----------|-----------|-------------|
| 0xF | MUL addr | A,MH = A × mem[addr] | Multiply |
| - | LMH | A = MH | Load MUL high into A (optional) |

### Instruction Details

```
MUL addr:
  - Reads memory at addr
  - Multiplies A × mem[addr]
  - Low 4 bits → A
  - High 4 bits → MH (multiply high register)
  - Sets Z flag if full 8-bit result is zero
  - Sets C flag if result > 15 (overflow into MH)
```

---

## Binary Multiplication Algorithm

### Pencil-and-Paper Method
```
       1101  (13)
     × 0101  (5)
     ------
       1101  (13 × 1, shift 0)
      0000   (13 × 0, shift 1)
     1101    (13 × 1, shift 2)
    0000     (13 × 0, shift 3)
    -------
   1000001   (65)
```

### Shift-and-Add Algorithm
```
For each bit i in multiplier (LSB to MSB):
    If bit i is 1:
        Add (multiplicand << i) to result
```

This can be implemented as:
1. **Combinational:** Array multiplier (fast, lots of gates)
2. **Sequential:** Shift-and-add state machine (slower, fewer gates)

---

## Test Program

Create `programs/test_multiply.asm`:

```asm
; test_multiply.asm - Test hardware multiply instruction
; Tests various multiplication cases

        ORG 0x00

START:
        ; Test 1: 3 × 4 = 12 (fits in 4 bits)
        LDI 3
        MUL FOUR        ; A = 12 (0xC), MH = 0
        STA TEST1_LO    ; Should be 0xC
        LMH
        STA TEST1_HI    ; Should be 0x0

        ; Test 2: 5 × 5 = 25 (0x19, needs 5 bits)
        LDI 5
        MUL FIVE        ; A = 9 (0x9), MH = 1 (0x1)
        STA TEST2_LO    ; Should be 0x9
        LMH
        STA TEST2_HI    ; Should be 0x1

        ; Test 3: 15 × 15 = 225 (0xE1, full 8 bits)
        LDI 0xF
        MUL FIFTEEN     ; A = 1 (0x1), MH = 14 (0xE)
        STA TEST3_LO    ; Should be 0x1
        LMH
        STA TEST3_HI    ; Should be 0xE

        ; Test 4: Multiply by 0 = 0
        LDI 7
        MUL ZERO        ; A = 0, MH = 0
        STA TEST4_LO    ; Should be 0x0

        ; Test 5: Multiply by 1 = same
        LDI 9
        MUL ONE         ; A = 9, MH = 0
        STA TEST5_LO    ; Should be 0x9

        ; Test 6: 2 × 8 = 16 (0x10, exactly 5 bits)
        LDI 2
        MUL EIGHT       ; A = 0, MH = 1
        STA TEST6_LO    ; Should be 0x0
        LMH
        STA TEST6_HI    ; Should be 0x1

        HLT

; Data section
        ORG 0x50
ZERO:    DB 0
ONE:     DB 1
FOUR:    DB 4
FIVE:    DB 5
EIGHT:   DB 8
FIFTEEN: DB 15

TEST1_LO: DB 0          ; 3×4=12: low=0xC
TEST1_HI: DB 0          ;         high=0x0
TEST2_LO: DB 0          ; 5×5=25: low=0x9
TEST2_HI: DB 0          ;         high=0x1
TEST3_LO: DB 0          ; 15×15=225: low=0x1
TEST3_HI: DB 0          ;            high=0xE
TEST4_LO: DB 0          ; 7×0=0: low=0x0
TEST5_LO: DB 0          ; 9×1=9: low=0x9
TEST6_LO: DB 0          ; 2×8=16: low=0x0
TEST6_HI: DB 0          ;         high=0x1

; Expected results (verify at addresses 0x56-0x5F):
; TEST1: 0xC, 0x0 (12)
; TEST2: 0x9, 0x1 (25 = 0x19)
; TEST3: 0x1, 0xE (225 = 0xE1)
; TEST4: 0x0 (0)
; TEST5: 0x9 (9)
; TEST6: 0x0, 0x1 (16 = 0x10)
```

---

## Hints

### Hint 1: Array Multiplier Structure
<details>
<summary>Click to reveal</summary>

A 4×4 array multiplier uses a grid of AND gates and adders:

```
                    B3  B2  B1  B0
                  ×  A3  A2  A1  A0
                  ----------------
Row 0:              A0B3 A0B2 A0B1 A0B0  (A0 × B, shift 0)
Row 1:         A1B3 A1B2 A1B1 A1B0       (A1 × B, shift 1)
Row 2:    A2B3 A2B2 A2B1 A2B0            (A2 × B, shift 2)
Row 3: A3B3 A3B2 A3B1 A3B0               (A3 × B, shift 3)
```

Each term AiBj is just an AND gate:
```hdl
wire pp[3:0][3:0];  ; Partial products

; Generate all partial products (16 AND gates)
and PP00 (input: acc[0] mdr[0], output: pp[0][0]);
and PP01 (input: acc[0] mdr[1], output: pp[0][1]);
; ... etc for all 16 combinations
```

</details>

### Hint 2: Adding Partial Products
<details>
<summary>Click to reveal</summary>

After generating partial products, add them with carry propagation:

```
       pp03 pp02 pp01 pp00          ; Row 0
  pp13 pp12 pp11 pp10               ; Row 1 (shifted)
 +
  ----------------------
       r3   r2   r1   r0  c0        ; Intermediate result
  pp23 pp22 pp21 pp20               ; Row 2 (shifted)
 +
  ----------------------
       s3   s2   s1   s0  c1        ; Another intermediate
  pp33 pp32 pp31 pp30               ; Row 3 (shifted)
 +
  ----------------------
  P7   P6   P5   P4   P3  P2  P1  P0   ; Final 8-bit product
```

You need multiple full adders arranged in a tree or array structure.

</details>

### Hint 3: Simplified 4x4 Multiplier
<details>
<summary>Click to reveal</summary>

Here's a more structured approach:

```hdl
; First, generate all partial products
wire p00, p01, p02, p03;  ; A[0] × B[3:0]
wire p10, p11, p12, p13;  ; A[1] × B[3:0]
wire p20, p21, p22, p23;  ; A[2] × B[3:0]
wire p30, p31, p32, p33;  ; A[3] × B[3:0]

; Result bit 0: just p00
buf R0 (input: p00, output: result[0]);

; Result bit 1: p01 + p10
; Use half adder
half_adder HA1 (a: p01, b: p10, sum: result[1], carry: c1);

; Result bit 2: p02 + p11 + p20 + c1
; Need full adder chain
full_adder FA2a (a: p02, b: p11, cin: p20, sum: t2, cout: c2a);
full_adder FA2b (a: t2, b: c1, cin: 0, sum: result[2], cout: c2b);

; ... continue for bits 3-7
```

This requires about:
- 16 AND gates (partial products)
- ~12 full adders
- ~100-150 gates total

</details>

### Hint 4: Sequential Multiplier (Alternative)
<details>
<summary>Click to reveal</summary>

If gate count is a concern, use a sequential multiplier that takes multiple cycles:

```
; Registers needed:
; - Multiplicand (4-bit) - holds B
; - Multiplier (4-bit) - holds A, shifts right each cycle
; - Accumulator (8-bit) - accumulates partial products

; Algorithm (4 cycles):
Cycle 1: If multiplier[0]=1, add multiplicand to accumulator
         Shift multiplier right
         Shift multiplicand left (or shift accumulator right)
Cycle 2: Repeat
Cycle 3: Repeat
Cycle 4: Repeat, done!
```

State machine:
```
S0: Load multiplicand, multiplier
S1: If mult[0], acc += mcand; shift mult right, mcand left
S2: Repeat
S3: Repeat
S4: Repeat, result ready
```

This uses fewer gates but takes more cycles (4-5 instead of 1).

</details>

### Hint 5: Control Unit Integration
<details>
<summary>Click to reveal</summary>

For a combinational multiplier:

```hdl
; Instruction decode
# is_mul = 1111
wire mul_t1, mul_t2;
and DEC_MUL1 (input: opcode[3] opcode[2], output: mul_t1);
and DEC_MUL2 (input: opcode[1] opcode[0], output: mul_t2);
and DEC_MUL3 (input: mul_t1 mul_t2, output: is_mul);

; Execute state for MUL:
; - Multiplier inputs: acc (A) and mdr (B)
; - Outputs: product[7:0]
; - A gets product[3:0]
; - MH register gets product[7:4]

wire [7:0] mul_product;
wire mul_hi_load;
wire mul_acc_load;

; Load signals in execute state
and MH_LD (input: is_mul in_execute, output: mul_hi_load);
and MUL_ACC (input: is_mul in_execute, output: mul_acc_load);

; MH register
dff MH0 (input: mul_product[4] clk, output: mul_hi[0]);
dff MH1 (input: mul_product[5] clk, output: mul_hi[1]);
dff MH2 (input: mul_product[6] clk, output: mul_hi[2]);
dff MH3 (input: mul_product[7] clk, output: mul_hi[3]);

; Accumulator source mux
wire [3:0] acc_src;
mux2_4bit ACC_MUX (
    sel: is_mul,
    in0: alu_result,
    in1: mul_product[3:0],
    out: acc_src
);
```

For the LMH instruction (load MH into A):
```hdl
# is_lmh = some unused opcode
; In execute: acc_next = mul_hi
```

</details>

---

## Expected Outcome

After implementing hardware multiply:

1. **Basic cases work:** 3×4=12, 5×5=25, etc.
2. **Full range:** 15×15=225 produces correct 8-bit result
3. **Edge cases:** ×0=0, ×1=identity
4. **Performance:** Single instruction vs ~50-cycle loop

### Verification Checklist

- [ ] MUL instruction decoded correctly
- [ ] Partial products generated (16 AND gates)
- [ ] Partial products summed correctly
- [ ] Low nibble stored in accumulator
- [ ] High nibble stored in MH register
- [ ] LMH instruction works (optional)
- [ ] Z flag set when result is 0
- [ ] C flag set when result > 15 (optional)
- [ ] All test cases pass

---

## Gate Count Analysis

### Combinational Array Multiplier
```
Partial products: 16 AND gates      = ~64 transistors
Adder tree:       ~12 full adders   = ~336 transistors
Routing/muxes:    ~20 gates         = ~80 transistors
MH register:      4 DFFs            = ~160 transistors
Total addition:                     = ~640 transistors
```

This nearly **doubles** the CPU's transistor count! Now you understand why early CPUs (4004, 8008) did NOT have hardware multiply - it was done in software.

### Sequential Multiplier (Alternative)
```
Shift registers:  8 DFFs            = ~320 transistors
Adder:           4-bit adder        = ~112 transistors
Control logic:   ~10 gates          = ~40 transistors
Total addition:                     = ~472 transistors
```

Less hardware, but takes 4-5 cycles instead of 1.

---

## Why This Matters

Hardware multiply was a **premium feature** in early CPUs:

| CPU | Year | Hardware Multiply? |
|-----|------|-------------------|
| Intel 4004 | 1971 | No |
| Intel 8008 | 1972 | No |
| Intel 8080 | 1974 | No |
| Motorola 6800 | 1974 | No |
| Intel 8086 | 1978 | Yes! (MUL/IMUL) |
| Motorola 68000 | 1979 | Yes (MULU/MULS) |

The transition from software to hardware multiply was a major milestone in CPU evolution. By implementing it, you've just done what Intel engineers did between 1974 and 1978!

---

## Advanced Challenges

If you complete the basic multiplier, try these enhancements:

### 1. Signed Multiply (IMUL)
Handle two's complement signed numbers:
- Need to track sign of inputs
- Possibly negate result
- More complex algorithm

### 2. Multiply-Accumulate (MAC)
Used in DSP applications:
```
MAC addr:  Result = Result + (A × mem[addr])
```

### 3. Hardware Divide (DIV)
The inverse operation - even more complex!
```
DIV addr:  A = A / mem[addr], MH = A % mem[addr] (remainder)
```

---

## Congratulations!

By completing all 5 exercises, you've transformed the Micro4 from a minimal toy into a reasonably capable microprocessor with:

- **INC/DEC:** Efficient loop counting
- **JNZ:** Natural loop constructs
- **Carry flag + ADC/SBC:** Multi-precision arithmetic
- **Shift/Rotate:** Bit manipulation and fast ×2/÷2
- **Hardware Multiply:** Fast multiplication

You now understand why these features exist in every real CPU - you've discovered them through necessity, just like the engineers who invented them!

---

## What's Next?

Consider implementing more features from `docs/optimization_homework.md`:
- Subroutines (CALL/RET) - requires a stack
- Indirect addressing - enables pointers
- Index registers - enables arrays
- Interrupts - enables I/O
- Pipeline - increases throughput

Or move on to **Micro8**, which has more registers, more addressing modes, and ~80 instructions to explore!
