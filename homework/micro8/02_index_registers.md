# Exercise 02: Index Registers

**Difficulty:** ⭐ Easy
**Time:** ~30-45 minutes
**Prerequisites:** Exercise 01 (Register Pairs)

---

## Goal

Use the HL register pair as an index register for efficient array traversal. This is fundamental to processing sequential data in memory.

---

## Background

In Exercise 01, you learned to combine H and L into a 16-bit address. Now we'll use HL as a **pointer** that traverses arrays:

```assembly
LDI16 HL, ARRAY     ; Point to start of array
LD R0, [HL]         ; Load first element
INC16 HL            ; Move to next element
LD R0, [HL]         ; Load second element
```

This pattern replaces inefficient direct addressing:

```assembly
; Inefficient - hard-coded addresses
LD R0, [ARRAY+0]
LD R0, [ARRAY+1]
LD R0, [ARRAY+2]
; Can't loop - addresses are literals!
```

---

## Current State in HDL

From `hdl/05_micro8_cpu.m4hdl`:

```
# LD [HL]: 0x2E - Load from address in HL
and DEC_LD_HL (input: upper_0x2 ir[3] ir[2] ir[1] ir0n, output: is_ld_hl);

# ST [HL]: 0x2F - Store to address in HL
and DEC_ST_HL (input: upper_0x2 ir[3] ir[2] ir[1] ir[0], output: is_st_hl);
```

The instructions exist - your task is to understand and use them effectively.

---

## What to Implement

### Step 1: Basic Array Read

Read elements from an array using HL:

```assembly
; Read 5 bytes from ARRAY into registers
        LDI16 HL, ARRAY
        LD R0, [HL]         ; R0 = ARRAY[0]
        INC16 HL
        LD R1, [HL]         ; R1 = ARRAY[1]
        INC16 HL
        LD R2, [HL]         ; R2 = ARRAY[2]
        INC16 HL
        LD R3, [HL]         ; R3 = ARRAY[3]
        INC16 HL
        LD R4, [HL]         ; R4 = ARRAY[4]
```

### Step 2: Array Write

Write values to an array:

```assembly
; Write R0-R4 to ARRAY
        LDI16 HL, ARRAY
        ST R0, [HL]
        INC16 HL
        ST R1, [HL]
        INC16 HL
        ST R2, [HL]
        ; ... etc
```

### Step 3: Loop-Based Traversal

Use a loop to process arrays of any size:

```assembly
; Sum all elements in ARRAY (length in COUNT)
        LDI16 HL, ARRAY         ; Pointer to array
        LD R2, [COUNT]          ; Loop counter
        LDI R0, 0               ; Accumulator = 0

SUM_LOOP:
        CMPI R2, 0              ; Check if counter = 0
        JZ SUM_DONE
        LD R1, [HL]             ; Load current element
        ADD R0, R1              ; Add to accumulator
        INC16 HL                ; Move to next element
        DEC R2                  ; Decrement counter
        JMP SUM_LOOP

SUM_DONE:
        ST R0, [RESULT]         ; Store sum
```

### Step 4: Indexed Offset Addressing

For random access within a structure, use offset addressing:

```assembly
; Access fields of a structure at HL
; Assuming: struct { byte a; byte b; byte c; byte d; }
        LDI16 HL, STRUCT_BASE
        LD R0, [HL+0]           ; R0 = struct.a
        LD R1, [HL+1]           ; R1 = struct.b
        LD R2, [HL+2]           ; R2 = struct.c
        LD R3, [HL+3]           ; R3 = struct.d
```

---

## Test Program

Write a program that traverses an array and finds the maximum value:

```assembly
; array_max.asm - Find maximum value in array
; Uses HL as index register for traversal

        .org 0x0200

START:
        ; Initialize
        LDI16 HL, ARRAY         ; Point to array
        LD R0, [HL]             ; R0 = max = first element
        LDI R2, 7               ; Counter = remaining elements (8-1)
        INC16 HL                ; Move to second element

FIND_MAX:
        CMPI R2, 0              ; Check if done
        JZ DONE

        LD R1, [HL]             ; R1 = current element
        CMP R1, R0              ; Compare current to max
        JC NOT_GREATER          ; If current < max, skip
        JZ NOT_GREATER          ; If current = max, skip
        MOV R0, R1              ; New max found

NOT_GREATER:
        INC16 HL                ; Move to next element
        DEC R2                  ; Decrement counter
        JMP FIND_MAX

DONE:
        ST R0, [RESULT]         ; Store maximum
        HLT

; Data section
        .org 0x0500
ARRAY:  .db 45, 12, 78, 34, 99, 23, 56, 67    ; Array of 8 values
RESULT: .db 0                   ; Expected: 99 (0x63)
```

**Expected Result:** RESULT = 99 (0x63)

---

## Progressive Hints

<details>
<summary>Hint 1: Understanding LD [HL]</summary>

The instruction `LD Rd, [HL]` does:
1. Form 16-bit address from H and L: `addr = (H << 8) | L`
2. Read byte from memory at that address
3. Store into destination register Rd

In HDL, the memory read cycle:
```
T1: Set MAR = {H, L}
T2: Trigger memory read
T3: Load MDR with memory data
T4: Copy MDR to destination register
```
</details>

<details>
<summary>Hint 2: Combining INC16 with LD</summary>

The pattern `LD R0, [HL]; INC16 HL` is so common that some CPUs combine them:
- 8080: `MOV A, M; INX H` (two instructions)
- Z80: `LDI` does load, increment, and decrement counter
- 6502: `LDA (ptr),Y; INY` (using Y as index)

For Micro8, you need both instructions. Consider adding a combined opcode if you want to optimize!
</details>

<details>
<summary>Hint 3: Finding Maximum - Compare Logic</summary>

To compare two unsigned values:
```assembly
CMP R1, R0              ; Compute R1 - R0, set flags

; After CMP:
; - If R1 < R0: Carry flag set (borrow occurred)
; - If R1 = R0: Zero flag set
; - If R1 > R0: Neither C nor Z set
```

So "R1 > R0" means "not carry AND not zero".
</details>

<details>
<summary>Hint 4: Offset Addressing Implementation</summary>

`LD R0, [HL+d]` needs to:
1. Read the offset byte `d` (signed 8-bit)
2. Sign-extend `d` to 16 bits
3. Add to HL: `effective_addr = HL + sign_extend(d)`
4. Read from effective_addr

This requires an adder in the address path, which is more complex than basic `[HL]`.
</details>

<details>
<summary>Hint 5: Boundary Conditions</summary>

Test these edge cases:
- Empty array (count = 0): Should handle gracefully
- Single element: Result should be that element
- All same values: Result should be that value
- Array spans page boundary: 0x00FD to 0x0102 (tests INC16 carry)
</details>

---

## Literature References

- **Intel 8080 Assembly Language Programming Manual**: Index register concepts
- **MOS 6502 Programming Manual**: Indirect indexed vs indexed indirect
- **Patterson & Hennessy**: Chapter on addressing modes

---

## Expected Outcome

When complete, you should be able to:

1. Initialize HL to point to an array
2. Read/write array elements via `LD`/`ST [HL]`
3. Traverse arrays using loops with `INC16 HL`
4. Access structure fields using `[HL+offset]`
5. Implement common array algorithms (sum, max, min, search)

---

## Verification Checklist

- [ ] `LD R0, [HL]` reads from address formed by H:L
- [ ] `ST R0, [HL]` writes to address formed by H:L
- [ ] Sequential `INC16 HL` correctly advances through array
- [ ] Loop with counter processes correct number of elements
- [ ] `[HL+d]` computes correct effective address
- [ ] Test program finds maximum value (99) in sample array

---

## Challenge Extensions

1. **Descending traversal**: Use `DEC16 HL` to traverse backwards
2. **String operations**: Implement `strlen` using HL traversal
3. **Memory copy**: Copy array from source to destination using two pointers
4. **Binary search**: Use offset addressing for random access

---

## Next Steps

Once array traversal works, move on to:
- **Exercise 03**: Stack Operations - another use for pointer + increment
- **Exercise 06**: Addressing Modes - more ways to compute addresses
