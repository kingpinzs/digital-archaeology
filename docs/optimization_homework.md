# CPU Optimization Homework

Starting from the Micro4-Minimal design, each section below is an optimization you can implement. They're organized from easiest to hardest within each category.

**Rules:**
1. Try to figure out each optimization yourself first
2. Think about: What changes? What stays the same? What breaks?
3. Consider the trade-offs (complexity vs. benefit)
4. Document your solution before implementing

---

## Category A: ALU Enhancements

### A1: Add Bitwise AND ⭐ (Easy)
**Current state:** ALU only does ADD and SUB
**Goal:** Add AND operation (A = A AND mem[addr])

**Questions to answer:**
- [ ] What opcode will you use?
- [ ] How do you modify the ALU to support AND?
- [ ] Does the Z flag still work correctly?

**Hint:** AND gate truth table: 0&0=0, 0&1=0, 1&0=0, 1&1=1

---

### A2: Add Bitwise OR ⭐ (Easy)
**Goal:** Add OR operation

**Questions to answer:**
- [ ] What's the OR truth table?
- [ ] Can you share circuitry with AND?

---

### A3: Add Bitwise XOR ⭐ (Easy)
**Goal:** Add XOR operation

**Bonus question:** Why is XOR useful for encryption?

---

### A4: Add NOT (Complement) ⭐ (Easy)
**Goal:** Add NOT operation (A = ~A, invert all bits)

**Questions to answer:**
- [ ] Does NOT need a memory operand?
- [ ] How do you invert 4 bits in hardware?

---

### A5: Add Increment ⭐ (Easy)
**Goal:** Add INC instruction (A = A + 1)

**Questions to answer:**
- [ ] Can you do this without accessing memory?
- [ ] How many cycles should it take?

---

### A6: Add Decrement ⭐ (Easy)
**Goal:** Add DEC instruction (A = A - 1)

---

### A7: Add Carry Flag ⭐⭐ (Medium)
**Current state:** Only Z flag exists
**Goal:** Add C (carry) flag that sets when addition overflows

**Questions to answer:**
- [ ] When does a 4-bit addition produce a carry?
- [ ] What if 0xF + 0x1? Result is 0x0, but we lost information!
- [ ] How does the carry flag preserve that information?
- [ ] Should SUB also affect carry? (Hint: borrow)

---

### A8: Add with Carry (ADC) ⭐⭐ (Medium)
**Prerequisite:** A7 (Carry Flag)
**Goal:** Add ADC instruction: A = A + mem[addr] + C

**Why this matters:** Allows multi-precision arithmetic!
```
; Add two 8-bit numbers using 4-bit CPU
LDA  NUM1_LO
ADD  NUM2_LO    ; Low nibbles, may set carry
STA  RESULT_LO
LDA  NUM1_HI
ADC  NUM2_HI    ; High nibbles + carry from low
STA  RESULT_HI
```

---

### A9: Subtract with Borrow (SBC) ⭐⭐ (Medium)
**Goal:** Add SBC instruction for multi-precision subtraction

---

### A10: Add Sign Flag ⭐⭐ (Medium)
**Goal:** Add S (sign) flag that copies the MSB of result

**Questions to answer:**
- [ ] What does the MSB represent in signed numbers?
- [ ] How does two's complement work?
- [ ] When is a result "negative"?

---

### A11: Add Overflow Flag ⭐⭐⭐ (Hard)
**Goal:** Add V (overflow) flag for signed arithmetic

**Questions to answer:**
- [ ] What's the difference between carry and overflow?
- [ ] When does signed overflow occur?
- [ ] The formula involves XOR of carries... figure it out!

---

### A12: Shift Right ⭐⭐ (Medium)
**Goal:** Add SHR instruction (shift A right by 1)

**Questions to answer:**
- [ ] What happens to bit 0? (It falls off)
- [ ] What goes into bit 3? (Zero? Or the old bit 3? Or carry?)
- [ ] What's the difference between logical and arithmetic shift?

---

### A13: Shift Left ⭐⭐ (Medium)
**Goal:** Add SHL instruction

---

### A14: Rotate Right through Carry ⭐⭐⭐ (Hard)
**Goal:** Add RRC instruction: bits rotate right, carry gets involved

```
Before: C=1, A=0101
After:  C=1, A=1010 (old C went to MSB, old LSB went to C)
```

**Why this matters:** Essential for multi-precision shifts!

---

### A15: Rotate Left through Carry ⭐⭐⭐ (Hard)
**Goal:** Add RLC instruction

---

### A16: Compare (CMP) ⭐⭐ (Medium)
**Goal:** Add CMP instruction: like SUB but doesn't store result

**Questions to answer:**
- [ ] What gets updated? (Just flags!)
- [ ] How do you test if A == mem[addr]?
- [ ] How do you test if A < mem[addr]?
- [ ] How do you test if A > mem[addr]?

---

### A17: Hardware Multiply ⭐⭐⭐⭐ (Very Hard)
**Goal:** Add MUL instruction: A = A * mem[addr]

**Questions to answer:**
- [ ] 4-bit × 4-bit = how many bits maximum?
- [ ] Where does the high nibble of result go?
- [ ] How do you build a multiplier? (Hint: shift and add)

---

### A18: Hardware Divide ⭐⭐⭐⭐⭐ (Expert)
**Goal:** Add DIV instruction

**Questions to answer:**
- [ ] What about the remainder?
- [ ] What happens on divide by zero?
- [ ] How do you build a divider? (Hint: shift and subtract)

---

## Category B: Register Enhancements

### B1: Add a Second Register (B) ⭐⭐ (Medium)
**Current state:** Only one accumulator
**Goal:** Add register B

**Questions to answer:**
- [ ] What new instructions do you need? (LDB, STB, etc.)
- [ ] How do you specify which register in the opcode?
- [ ] Can you do A = A + B without memory access?

---

### B2: Add Register-to-Register Operations ⭐⭐ (Medium)
**Prerequisite:** B1
**Goal:** ADD B (A = A + B), MOV A,B, MOV B,A, etc.

**Questions to answer:**
- [ ] How do you encode source and destination?
- [ ] How many new opcodes do you need?

---

### B3: Add More Registers (C, D) ⭐⭐⭐ (Hard)
**Goal:** Expand to 4 general-purpose registers

**Questions to answer:**
- [ ] 2 bits can select from 4 registers
- [ ] How do you fit source AND destination in the opcode?
- [ ] Maybe use register pairs for some operations?

---

### B4: Add an Index Register (X) ⭐⭐⭐ (Hard)
**Goal:** Add 8-bit register X for indexed addressing

**New addressing mode:** LDA addr,X means A = mem[addr + X]

**Why this matters:** Essential for array processing!

```asm
; Sum array of 5 elements
        LDI 0           ; Clear accumulator
        LDX 0           ; X = 0
LOOP:   ADD ARRAY,X     ; A = A + ARRAY[X]
        INX             ; X = X + 1
        CPX 5           ; Compare X to 5
        JNZ LOOP        ; If not equal, continue
```

---

### B5: Add Stack Pointer (SP) ⭐⭐⭐ (Hard)
**Goal:** Add 8-bit SP register pointing to stack in memory

**Questions to answer:**
- [ ] Does stack grow up or down?
- [ ] What instructions manipulate SP? (PUSH, POP)
- [ ] What about CALL and RET?

---

### B6: Register Pairs for 8-bit Operations ⭐⭐⭐ (Hard)
**Goal:** Combine two 4-bit registers into one 8-bit value

Example: BC = B:C (B is high nibble, C is low nibble)

**Why this matters:** Can do 8-bit math on a 4-bit CPU!

---

### B7: Shadow Registers ⭐⭐⭐⭐ (Very Hard)
**Goal:** Duplicate register set for fast context switching

**Questions to answer:**
- [ ] When would you switch register sets?
- [ ] How do you select which set is active?
- [ ] Z80 has this feature - research how it works!

---

## Category C: Addressing Mode Enhancements

### C1: Zero Page Addressing ⭐⭐ (Medium)
**Goal:** Single-byte instructions for addresses 0x00-0x0F

**Current:** LDA 0x05 takes 2 bytes (opcode + address)
**New:** LDA.Z 0x05 takes 1 byte (opcode encodes address in lower nibble)

**Why this matters:** Faster, smaller code for common variables!

---

### C2: Indirect Addressing ⭐⭐⭐ (Hard)
**Goal:** LDA (addr) means A = mem[mem[addr]]

The address in memory POINTS to the real data.

**Why this matters:** Enables pointers!

```asm
; ptr contains address of value
LDA (ptr)       ; Load value that ptr points to
```

---

### C3: Indexed Indirect ⭐⭐⭐⭐ (Very Hard)
**Goal:** LDA (addr,X) means A = mem[mem[addr + X]]

**Why this matters:** Tables of pointers!

---

### C4: Indirect Indexed ⭐⭐⭐⭐ (Very Hard)
**Goal:** LDA (addr),Y means A = mem[mem[addr] + Y]

**Why this matters:** Pointer + offset! Structure access!

**Note:** This is different from indexed indirect. Think about it!

---

### C5: PC-Relative Addressing ⭐⭐⭐ (Hard)
**Goal:** JMP +5 means PC = PC + 5 (not PC = 5)

**Why this matters:** Position-independent code!

**Questions to answer:**
- [ ] How do you encode negative offsets?
- [ ] What's the range of a 4-bit signed offset?

---

### C6: Immediate Addressing for All Instructions ⭐⭐ (Medium)
**Current:** Only LDI has immediate mode
**Goal:** ADD #5 means A = A + 5 (immediate value, not memory)

---

## Category D: Control Flow Enhancements

### D1: Jump if Not Zero (JNZ) ⭐ (Easy)
**Current:** Only JZ exists
**Goal:** Add JNZ (jump if Z flag is clear)

**Question:** Can you implement JNZ using JZ and JMP? Is hardware better?

---

### D2: Jump if Carry (JC) and Jump if No Carry (JNC) ⭐ (Easy)
**Prerequisite:** A7 (Carry Flag)

---

### D3: Jump if Negative/Positive (JS/JNS) ⭐ (Easy)
**Prerequisite:** A10 (Sign Flag)

---

### D4: Jump if Overflow (JO/JNO) ⭐⭐ (Medium)
**Prerequisite:** A11 (Overflow Flag)

---

### D5: Subroutine Support - CALL ⭐⭐⭐ (Hard)
**Goal:** CALL addr: Save PC to stack, jump to addr

**Questions to answer:**
- [ ] Where do you save the return address?
- [ ] Do you need a stack pointer?
- [ ] How many bytes is the return address?

---

### D6: Subroutine Support - RET ⭐⭐⭐ (Hard)
**Goal:** RET: Pop return address from stack, jump there

---

### D7: Hardware Stack (Push/Pop) ⭐⭐⭐ (Hard)
**Goal:** PUSH A and POP A instructions

**Questions to answer:**
- [ ] How deep should the stack be?
- [ ] Hardware stack (fixed size) or memory stack (flexible)?

---

### D8: Software Interrupt (SWI/TRAP) ⭐⭐⭐⭐ (Very Hard)
**Goal:** SWI instruction triggers interrupt-like behavior

**Why this matters:** System calls!

---

### D9: Hardware Interrupts ⭐⭐⭐⭐⭐ (Expert)
**Goal:** External signal can interrupt execution

**Questions to answer:**
- [ ] How do you save CPU state?
- [ ] Where's the interrupt handler address?
- [ ] How do you return from interrupt?
- [ ] What about interrupt priorities?
- [ ] What about disabling interrupts?

---

### D10: Multiple Interrupt Vectors ⭐⭐⭐⭐⭐ (Expert)
**Goal:** Different interrupt sources jump to different handlers

---

## Category E: Memory Enhancements

### E1: Expand Address Space to 12 bits ⭐⭐ (Medium)
**Current:** 8-bit addresses = 256 locations
**Goal:** 12-bit addresses = 4096 locations

**Questions to answer:**
- [ ] Instructions need 12-bit addresses now (2 bytes? 3 bytes?)
- [ ] How does this affect PC width?
- [ ] How does this affect SP, index registers?

---

### E2: Memory Banking ⭐⭐⭐ (Hard)
**Goal:** Bank register selects which 256-byte page is active

**Why this matters:** Access more memory without wider addresses!

```
Bank 0: addresses 0x000-0x0FF
Bank 1: addresses 0x100-0x1FF
...etc
```

---

### E3: Harvard Architecture ⭐⭐⭐ (Hard)
**Current:** Code and data share same memory (Von Neumann)
**Goal:** Separate instruction memory and data memory

**Questions to answer:**
- [ ] What are the advantages? (Can fetch and access data simultaneously!)
- [ ] What are the disadvantages? (Can't treat code as data)

---

### E4: Memory-Mapped I/O ⭐⭐ (Medium)
**Goal:** Certain addresses access I/O devices instead of RAM

```
0x00-0xEF: RAM
0xF0:      Keyboard input
0xF1:      Display output
0xF2-0xFF: Other I/O
```

---

### E5: Separate I/O Instructions ⭐⭐ (Medium)
**Alternative to E4:** IN and OUT instructions with port numbers

```asm
IN  0       ; Read from port 0 into A
OUT 1       ; Write A to port 1
```

**Question:** What are the tradeoffs vs memory-mapped I/O?

---

## Category F: Performance Enhancements

### F1: Reduce Cycle Count ⭐⭐ (Medium)
**Current:** LDA addr takes 5 cycles
**Goal:** Optimize state machine to reduce cycles

**Questions to answer:**
- [ ] Can you combine any states?
- [ ] Can you fetch the address byte WHILE decoding?

---

### F2: Instruction Prefetch ⭐⭐⭐ (Hard)
**Goal:** Fetch next instruction while executing current one

**Questions to answer:**
- [ ] What happens when you take a branch? (Prefetch is wrong!)
- [ ] How do you "flush" the prefetch?

---

### F3: Simple Pipeline (2-stage) ⭐⭐⭐⭐ (Very Hard)
**Goal:** Fetch and Execute overlap

```
Time:    T1      T2      T3      T4
Fetch:   Inst1   Inst2   Inst3   Inst4
Execute:         Inst1   Inst2   Inst3
```

**Questions to answer:**
- [ ] What's a pipeline hazard?
- [ ] What happens when Inst1 is a jump?
- [ ] What's a pipeline "bubble" or "stall"?

---

### F4: 5-Stage Pipeline ⭐⭐⭐⭐⭐ (Expert)
**Goal:** Fetch, Decode, Execute, Memory, Writeback

This is how real CPUs (like MIPS, ARM, 486) work!

---

### F5: Branch Prediction ⭐⭐⭐⭐⭐ (Expert)
**Goal:** Guess whether branches will be taken

**Questions to answer:**
- [ ] Static prediction: always predict taken? not taken?
- [ ] Dynamic prediction: remember previous branches
- [ ] What's a Branch Target Buffer (BTB)?

---

### F6: Instruction Cache ⭐⭐⭐⭐⭐ (Expert)
**Goal:** Small fast memory holds recently-used instructions

---

### F7: Data Cache ⭐⭐⭐⭐⭐ (Expert)
**Goal:** Small fast memory holds recently-used data

**Questions to answer:**
- [ ] What's a cache hit? Miss?
- [ ] What's a cache line?
- [ ] What's the replacement policy? (LRU, FIFO, random)
- [ ] What about write policy? (write-through, write-back)

---

## Category G: Instruction Encoding Enhancements

### G1: Variable-Length Instructions ⭐⭐⭐ (Hard)
**Current:** All instructions are 1 or 2 bytes
**Goal:** 1-byte, 2-byte, and 3-byte instructions

**Trade-offs:**
- More compact code
- More complex decoding
- Harder to pipeline

---

### G2: Instruction Prefixes ⭐⭐⭐ (Hard)
**Goal:** Prefix byte modifies following instruction

Example: REP prefix makes instruction repeat

```asm
REP MOVS    ; Move string (repeat until done)
```

---

### G3: Compressed Instruction Set ⭐⭐⭐⭐ (Very Hard)
**Goal:** Frequently-used instructions get shorter encodings

Research: ARM Thumb, RISC-V C extension

---

## Category H: System Enhancements

### H1: NOP Instruction ⭐ (Easy)
**Goal:** No Operation - does nothing, takes 1 cycle

**Question:** Why is NOP useful? (Timing, padding, debugging)

---

### H2: HALT with Interrupt Wake ⭐⭐⭐ (Hard)
**Current:** HLT stops forever
**Goal:** HLT stops until interrupt occurs

---

### H3: Reset Vector ⭐⭐ (Medium)
**Current:** PC starts at 0x00
**Goal:** PC starts at address stored in memory location (e.g., 0xFE:0xFF)

**Why this matters:** Flexibility in where code starts!

---

### H4: Illegal Instruction Trap ⭐⭐⭐ (Hard)
**Goal:** Undefined opcodes trigger trap/interrupt instead of undefined behavior

---

### H5: Supervisor/User Modes ⭐⭐⭐⭐ (Very Hard)
**Goal:** Two privilege levels

**Questions to answer:**
- [ ] What can user mode NOT do?
- [ ] How do you switch between modes?
- [ ] How does this enable operating systems?

---

### H6: Memory Protection ⭐⭐⭐⭐⭐ (Expert)
**Goal:** Prevent user programs from accessing certain memory

---

### H7: Virtual Memory / Paging ⭐⭐⭐⭐⭐ (Expert)
**Goal:** Memory addresses are "virtual" - translated to physical

This is how modern OSes work!

---

## Progress Tracker

Copy this to track your progress:

```
Category A: ALU
[ ] A1  AND
[ ] A2  OR
[ ] A3  XOR
[ ] A4  NOT
[ ] A5  INC
[ ] A6  DEC
[ ] A7  Carry flag
[ ] A8  ADC
[ ] A9  SBC
[ ] A10 Sign flag
[ ] A11 Overflow flag
[ ] A12 SHR
[ ] A13 SHL
[ ] A14 RRC
[ ] A15 RLC
[ ] A16 CMP
[ ] A17 MUL
[ ] A18 DIV

Category B: Registers
[ ] B1  Second register
[ ] B2  Reg-to-reg ops
[ ] B3  More registers
[ ] B4  Index register
[ ] B5  Stack pointer
[ ] B6  Register pairs
[ ] B7  Shadow registers

Category C: Addressing
[ ] C1  Zero page
[ ] C2  Indirect
[ ] C3  Indexed indirect
[ ] C4  Indirect indexed
[ ] C5  PC-relative
[ ] C6  Immediate everywhere

Category D: Control Flow
[ ] D1  JNZ
[ ] D2  JC/JNC
[ ] D3  JS/JNS
[ ] D4  JO/JNO
[ ] D5  CALL
[ ] D6  RET
[ ] D7  PUSH/POP
[ ] D8  SWI
[ ] D9  Hardware interrupts
[ ] D10 Multiple vectors

Category E: Memory
[ ] E1  12-bit address
[ ] E2  Banking
[ ] E3  Harvard arch
[ ] E4  Memory-mapped I/O
[ ] E5  IN/OUT instructions

Category F: Performance
[ ] F1  Reduce cycles
[ ] F2  Prefetch
[ ] F3  2-stage pipeline
[ ] F4  5-stage pipeline
[ ] F5  Branch prediction
[ ] F6  I-cache
[ ] F7  D-cache

Category G: Encoding
[ ] G1  Variable length
[ ] G2  Prefixes
[ ] G3  Compressed ISA

Category H: System
[ ] H1  NOP
[ ] H2  HALT with wake
[ ] H3  Reset vector
[ ] H4  Illegal inst trap
[ ] H5  Supervisor mode
[ ] H6  Memory protection
[ ] H7  Virtual memory
```

---

## Recommended Order

**Beginner path (start here):**
1. H1 (NOP) - Easiest possible
2. A1-A4 (Bitwise ops) - Simple ALU additions
3. A5-A6 (INC/DEC) - Simple, very useful
4. D1 (JNZ) - Simple, very useful
5. A7 (Carry flag) - Opens up multi-precision

**Intermediate path:**
6. C1 (Zero page) - Better code density
7. B1-B2 (Second register) - Fewer memory accesses
8. A8-A9 (ADC/SBC) - Multi-precision math
9. A12-A13 (Shifts) - Bit manipulation
10. A16 (CMP) - Better conditionals

**Advanced path:**
11. B4 (Index register) - Array processing
12. B5 (Stack pointer) - Enables subroutines
13. D5-D6 (CALL/RET) - Real programs!
14. C2 (Indirect) - Pointers!
15. F1-F2 (Performance) - Faster execution

**Expert path:**
16. D9 (Interrupts) - Real I/O
17. F3-F4 (Pipelining) - Modern CPUs
18. F6-F7 (Caches) - Memory hierarchy
19. H5-H7 (Protection) - Operating systems

---

## Final Challenge

When you've completed enough optimizations, try to:

1. **Run a real program** - Simple game? Calculator?
2. **Write a tiny OS** - Task switching, I/O handling
3. **Synthesize to FPGA** - Real hardware!
4. **Benchmark against 4004** - Are you faster?

Good luck!
