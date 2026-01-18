# Exercise 06: Addressing Modes

**Difficulty:** ⭐⭐⭐ Hard
**Time:** ~60-90 minutes
**Prerequisites:** Exercise 01 (Register Pairs), Exercise 02 (Index Registers)

---

## Goal

Implement advanced addressing modes including indexed (HL+d) and indirect ((nn)) addressing. These modes enable efficient access to data structures, arrays, and pointer-based programming.

---

## Background

An **addressing mode** determines how an instruction calculates the effective memory address.

### Micro8 Addressing Modes

| Mode | Syntax | Effective Address | Use Case |
|------|--------|-------------------|----------|
| Immediate | `LDI R0, #5` | N/A (data in instruction) | Constants |
| Direct | `LD R0, [0x0500]` | 0x0500 | Global variables |
| Zero Page | `LDZ R0, [0x50]` | 0x0050 | Fast variable access |
| Register Indirect | `LD R0, [HL]` | H:L | Pointers |
| Indexed | `LD R0, [HL+d]` | H:L + d | Array elements, struct fields |
| Indirect | `LD R0, [[nn]]` | mem[nn] | Pointer dereference |

---

## Current State in HDL

From `hdl/05_micro8_cpu.m4hdl`:

```
# LD [HL+d]: 0x30 - Load with displacement
and DEC_LD_HLD (input: upper_0x3 ir3n ir2n ir1n ir0n, output: is_ld_hld);

# ST [HL+d]: 0x31 - Store with displacement
and DEC_ST_HLD (input: upper_0x3 ir3n ir2n ir1n ir[0], output: is_st_hld);
```

---

## What to Implement

### Step 1: Indexed Addressing [HL+d]

Access memory at an offset from the HL pointer:

```assembly
LDI16 HL, STRUCT_BASE
LD R0, [HL+0]           ; Load first field
LD R1, [HL+4]           ; Load fifth field
LD R2, [HL-2]           ; Load field before base (negative offset)
```

**Instruction format:**
- Byte 0: Opcode (0x30 for LD, 0x31 for ST)
- Byte 1: Signed 8-bit displacement (-128 to +127)
- Byte 2: Register specification (for LD: dest reg; for ST: source reg)

**Address calculation:**
```
effective_addr = HL + sign_extend(displacement)
```

**HDL execution:**
```
T0: Fetch opcode, decode as LD_HLD
T1: Fetch displacement byte → operand1
T2: Fetch register byte → operand2 (or encode in opcode)
T3: Compute effective address
    - Sign-extend operand1 to 16 bits
    - Add to HL: ea = HL + sext(operand1)
T4: MAR = ea
T5: Memory read
T6: Rd = MDR
```

### Step 2: Sign Extension

The displacement is signed, allowing negative offsets:

```
+5  = 0x05 → 0x0005
-5  = 0xFB → 0xFFFB (sign extended)
```

**HDL for sign extension:**
```
; Sign extend 8-bit value to 16-bit
wire [7:0] disp;
wire [15:0] sext_disp;

; Copy bit 7 (sign bit) to upper 8 bits
buf SEXT0 (input: disp[0], output: sext_disp[0]);
buf SEXT1 (input: disp[1], output: sext_disp[1]);
...
buf SEXT7 (input: disp[7], output: sext_disp[7]);
buf SEXT8 (input: disp[7], output: sext_disp[8]);
buf SEXT9 (input: disp[7], output: sext_disp[9]);
...
buf SEXT15 (input: disp[7], output: sext_disp[15]);
```

### Step 3: Indirect Addressing [[nn]]

Access memory through a pointer stored in memory:

```assembly
; Pointer stored at PTR_VAR points to actual data
LDI16 HL, PTR_VAR
LD R0, [HL]             ; R0 = low byte of pointer
INC16 HL
LD R1, [HL]             ; R1 = high byte of pointer
; Now R1:R0 contains the pointer, but we need to dereference it

; Better: true indirect addressing
LD R0, [[PTR_VAR]]      ; R0 = mem[mem[PTR_VAR]]
```

**Implementation approach:**
This requires double memory access:
1. Read pointer from memory
2. Use pointer to read actual data

**Simplified alternative:**
Use HL as intermediate:
```assembly
LD16 HL, [PTR_VAR]      ; Load pointer into HL
LD R0, [HL]             ; Load data via HL
```

### Step 4: Practical Applications

**Structure access with indexed mode:**

```assembly
; struct Person { byte age; byte height; byte weight; byte id; }
; persons is array of Person, each 4 bytes

PERSON_AGE    = 0
PERSON_HEIGHT = 1
PERSON_WEIGHT = 2
PERSON_ID     = 3
PERSON_SIZE   = 4

        LDI16 HL, PERSONS       ; Base of array
        ; Access person[0]
        LD R0, [HL+PERSON_AGE]  ; R0 = persons[0].age

        ; Move to person[1]
        LDI R1, PERSON_SIZE
        ADD16 HL, R1            ; HL += 4 (or use explicit add)

        ; Access person[1]
        LD R0, [HL+PERSON_AGE]  ; R0 = persons[1].age
```

**Linked list traversal:**

```assembly
; struct Node { byte data; word next; }  ; 3 bytes each
NODE_DATA = 0
NODE_NEXT = 1

        LDI16 HL, LIST_HEAD     ; HL = address of first node

TRAVERSE:
        LD R0, [HL+NODE_DATA]   ; R0 = current->data
        ST R0, [OUTPUT]         ; Process data

        ; Load next pointer
        LD R1, [HL+NODE_NEXT]   ; Low byte of next
        LD R2, [HL+NODE_NEXT+1] ; High byte of next

        ; Check for null
        MOV R5, R2              ; H = high
        MOV R6, R1              ; L = low
        ; If HL == 0, done
        OR R1, R2               ; R1 = R1 | R2
        JZ DONE

        ; HL now points to next node
        JMP TRAVERSE

DONE:
        HLT
```

---

## Test Program

Access a lookup table using indexed addressing:

```assembly
; lookup_table.asm - Demonstrate indexed addressing
; Looks up values in a table using offset

        .org 0x0200

START:
        ; Initialize
        LDI16 SP, 0x01FD

        ; ===== Test 1: Simple indexed load =====
        LDI16 HL, TABLE
        LD R0, [HL+0]           ; R0 = TABLE[0] = 0x10
        LD R1, [HL+1]           ; R1 = TABLE[1] = 0x20
        LD R2, [HL+2]           ; R2 = TABLE[2] = 0x30
        LD R3, [HL+7]           ; R3 = TABLE[7] = 0x80
        ST R0, [RESULT1]        ; Expected: 0x10
        ST R3, [RESULT2]        ; Expected: 0x80

        ; ===== Test 2: Negative offset =====
        LDI16 HL, TABLE+4       ; Point to middle of table
        LD R0, [HL-4]           ; R0 = TABLE[0] = 0x10
        LD R1, [HL-1]           ; R1 = TABLE[3] = 0x40
        LD R2, [HL+0]           ; R2 = TABLE[4] = 0x50
        LD R3, [HL+3]           ; R3 = TABLE[7] = 0x80
        ST R0, [RESULT3]        ; Expected: 0x10
        ST R1, [RESULT4]        ; Expected: 0x40

        ; ===== Test 3: Store with index =====
        LDI16 HL, OUTPUT_ARRAY
        LDI R0, 0xAA
        ST R0, [HL+0]
        LDI R0, 0xBB
        ST R0, [HL+1]
        LDI R0, 0xCC
        ST R0, [HL+2]
        LDI R0, 0xDD
        ST R0, [HL+3]

        ; Verify by loading back
        LD R0, [HL+0]           ; 0xAA
        LD R1, [HL+1]           ; 0xBB
        LD R2, [HL+2]           ; 0xCC
        LD R3, [HL+3]           ; 0xDD
        ST R0, [RESULT5]        ; Expected: 0xAA
        ST R3, [RESULT6]        ; Expected: 0xDD

        ; ===== Test 4: Function lookup table =====
        ; Use input value to index into table of pointers
        ; (Simplified: index into value table)
        LDI R0, 3               ; Index = 3
        LDI16 HL, SQUARES       ; Table of squares
        ; HL + R0 = address of squares[3]
        ; Need to add R0 to HL for true indexed
        ; Using loop for now:
        CMPI R0, 0
        JZ LOOKUP_DONE
LOOKUP_LOOP:
        INC16 HL
        DEC R0
        JRNZ LOOKUP_LOOP
LOOKUP_DONE:
        LD R0, [HL]             ; R0 = squares[3] = 9
        ST R0, [RESULT7]        ; Expected: 0x09

        LDI R0, 0x00            ; Success
        ST R0, [FINAL]

        HLT

; Data section
        .org 0x0500
TABLE:          .db 0x10, 0x20, 0x30, 0x40, 0x50, 0x60, 0x70, 0x80
OUTPUT_ARRAY:   .db 0, 0, 0, 0
SQUARES:        .db 0, 1, 4, 9, 16, 25, 36, 49, 64     ; 0^2 to 8^2

; Results
        .org 0x0550
RESULT1:        .db 0   ; Expected: 0x10
RESULT2:        .db 0   ; Expected: 0x80
RESULT3:        .db 0   ; Expected: 0x10
RESULT4:        .db 0   ; Expected: 0x40
RESULT5:        .db 0   ; Expected: 0xAA
RESULT6:        .db 0   ; Expected: 0xDD
RESULT7:        .db 0   ; Expected: 0x09
FINAL:          .db 0xFF ; Expected: 0x00
```

---

## Progressive Hints

<details>
<summary>Hint 1: Implementing Address Adder</summary>

The indexed mode needs an adder in the address path:

```
; For LD R0, [HL+d]:
; effective_address = HL + sign_extend(d)

wire [15:0] hl_value;      ; Concatenation of H and L
wire [15:0] sext_disp;     ; Sign-extended displacement
wire [15:0] effective_addr;

; 16-bit adder
adder16 ADDR_CALC (
    input_a: hl_value,
    input_b: sext_disp,
    carry_in: 0,
    output: effective_addr,
    carry_out: addr_carry    ; Usually ignored
);
```

This adder can be shared with other address calculations.
</details>

<details>
<summary>Hint 2: Displacement Range</summary>

An 8-bit signed displacement gives range -128 to +127:
- Positive: 0x00 to 0x7F (+0 to +127)
- Negative: 0x80 to 0xFF (-128 to -1)

This covers most struct sizes and small array accesses. For larger offsets, change the base pointer.
</details>

<details>
<summary>Hint 3: Alternative Indexed Implementation</summary>

If hardware adder is complex, use micro-code:

```
; LD R0, [HL+d] using temporary addition
T1: Fetch displacement
T2: Add disp to L (low byte)
    temp_carry = carry_out
T3: Add temp_carry to H (high byte)
T4: Use modified H:L as address
T5: Memory read
T6: Restore original H:L (if needed)
```

This is slower but simpler than a parallel adder.
</details>

<details>
<summary>Hint 4: Indexed vs Indirect</summary>

**Indexed [HL+d]:**
- Address = HL + displacement
- One memory access
- Used for: struct fields, local array elements

**Indirect [[addr]]:**
- Pointer = mem[addr]
- Address = pointer
- Two memory accesses
- Used for: pointer dereference, dynamic allocation

Many instructions combine both: `[[HL+d]]` = indirect indexed.
</details>

<details>
<summary>Hint 5: Testing Boundary Conditions</summary>

Test edge cases:
1. Offset = 0 (same as [HL])
2. Offset = 127 (max positive)
3. Offset = -128 (max negative)
4. HL near page boundary with offset crossing it (e.g., HL=0x00FE, d=+5)
5. HL = 0xFFFF with positive offset (wrap around)
</details>

---

## Literature References

- **Intel 8086 Programmer's Reference**: Base+displacement addressing
- **Motorola 68000 User's Manual**: Rich addressing mode set
- **Patterson & Hennessy**: Addressing mode comparison
- **"The Art of Assembly Language"**: Practical addressing mode usage

---

## Expected Outcome

When complete, you should be able to:

1. Access memory with displacement: `LD R0, [HL+d]`
2. Use negative displacements for backward access
3. Store with displacement: `ST R0, [HL+d]`
4. Implement structure and array access patterns
5. Understand the trade-offs of different addressing modes

---

## Verification Checklist

- [ ] `LD R0, [HL+0]` works (equivalent to `LD R0, [HL]`)
- [ ] `LD R0, [HL+5]` reads from HL+5
- [ ] `LD R0, [HL-5]` reads from HL-5 (negative offset)
- [ ] Sign extension correct: -1 (0xFF) becomes 0xFFFF
- [ ] `ST R0, [HL+d]` stores correctly
- [ ] Page boundary crossing works (0x00FE + 5 = 0x0103)
- [ ] Test program passes all indexed access tests

---

## Challenge Extensions

1. **Base+Index+Displacement**: `[HL+R0+d]` for 2D array access
2. **Auto-increment**: `LD R0, [HL+]` loads and increments HL
3. **Auto-decrement**: `LD R0, [-HL]` decrements HL then loads
4. **PC-relative**: `LD R0, [PC+d]` for position-independent code

---

## Next Steps

With addressing modes complete, explore:
- **Exercise 07**: 16-bit Arithmetic - operate on data you can now access
- **Exercise 08**: Critical Path - optimize address calculation timing
