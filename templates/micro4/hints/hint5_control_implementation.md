# Hint 5: Control Unit Implementation

<<<<<<< HEAD
## Control Unit Structure

The control unit has two parts:
1. **State Register**: Holds current state (3 bits = 8 states)
2. **Control Logic**: Generates signals based on state + opcode

```m4hdl
# ============================================
# State Register (3-bit)
# ============================================
wire [2:0] state;
wire [2:0] state_next;

dff STATE0 (input: state_next[0] clk, output: state[0]);
dff STATE1 (input: state_next[1] clk, output: state[1]);
dff STATE2 (input: state_next[2] clk, output: state[2]);

# ============================================
# State Encoding
# ============================================
# S0 (000): FETCH1 - Set MAR = PC, start read
# S1 (001): FETCH2 - Load IR high nibble
# S2 (010): FETCH3 - Load IR low nibble or address, PC++
# S3 (011): DECODE - Branch based on opcode
# S4 (100): EXEC_MEM - Memory operation (LDA/STA/ADD/SUB)
# S5 (101): EXEC_ALU - ALU operation result to accumulator
# S6 (110): EXEC_DONE - Return to fetch
# S7 (111): HALTED - CPU stopped
```

## Instruction Decoder

First, decode the opcode into individual instruction signals:

```m4hdl
# ============================================
# Opcode Extraction
# ============================================
wire [3:0] opcode;
buf DEC_OP0 (input: ir[4], output: opcode[0]);
buf DEC_OP1 (input: ir[5], output: opcode[1]);
buf DEC_OP2 (input: ir[6], output: opcode[2]);
buf DEC_OP3 (input: ir[7], output: opcode[3]);

# ============================================
# Instruction Decode
# ============================================
wire op0n, op1n, op2n, op3n;
not DEC_NOT0 (input: opcode[0], output: op0n);
not DEC_NOT1 (input: opcode[1], output: op1n);
not DEC_NOT2 (input: opcode[2], output: op2n);
not DEC_NOT3 (input: opcode[3], output: op3n);

# Decode each instruction
# Pattern: is_XXX = 1 when opcode matches XXX

# HLT (0000): !op3 & !op2 & !op1 & !op0
wire is_hlt;
wire hlt_t1, hlt_t2;
and DEC_HLT1 (input: op3n op2n, output: hlt_t1);
and DEC_HLT2 (input: op1n op0n, output: hlt_t2);
and DEC_HLT3 (input: hlt_t1 hlt_t2, output: is_hlt);

# LDA (0001): !op3 & !op2 & !op1 & op0
wire is_lda;
# TODO: Implement (similar pattern to HLT)

# STA (0010): !op3 & !op2 & op1 & !op0
wire is_sta;
# TODO: Implement

# ADD (0011): !op3 & !op2 & op1 & op0
wire is_add;
# TODO: Implement

# SUB (0100): !op3 & op2 & !op1 & !op0
wire is_sub;
# TODO: Implement

# JMP (0101): !op3 & op2 & !op1 & op0
wire is_jmp;
# TODO: Implement

# JZ (0110): !op3 & op2 & op1 & !op0
wire is_jz;
# TODO: Implement

# LDI (0111): !op3 & op2 & op1 & op0
wire is_ldi;
# TODO: Implement
```

## State Transition Logic

The next state depends on current state and decoded instruction:

```m4hdl
# ============================================
# State Transitions
# ============================================

# Detect current state
wire in_s0, in_s1, in_s2, in_s3, in_s4, in_s5, in_s6, in_s7;
wire s0n, s1n, s2n;
not ST_NOT0 (input: state[0], output: s0n);
not ST_NOT1 (input: state[1], output: s1n);
not ST_NOT2 (input: state[2], output: s2n);

# in_s0 = state == 000
wire s0_t1, s0_t2;
and ST_S0_1 (input: s2n s1n, output: s0_t1);
and ST_S0_2 (input: s0_t1 s0n, output: in_s0);

# TODO: Decode other states (s1-s7) similarly
=======
## State Encoding

Let's define our states with a 3-bit state register:

```
State | Binary | Name
------|--------|------------------
  0   |  000   | S_FETCH1  - Load MAR with PC
  1   |  001   | S_FETCH2  - Read instruction byte 1
  2   |  010   | S_FETCH3  - Read instruction byte 2 (if needed)
  3   |  011   | S_DECODE  - Decode and branch
  4   |  100   | S_EXEC1   - Execute phase 1
  5   |  101   | S_EXEC2   - Execute phase 2
  6   |  110   | S_EXEC3   - Execute phase 3 (writeback)
  7   |  111   | S_HALT    - CPU halted
```

## Control Signal Truth Table

This is the heart of the control unit. Each row shows which signals are active in each state.

```
State    | pc_inc | mar_load | ir_load | acc_load | mem_rd | mem_wr | alu_en
---------|--------|----------|---------|----------|--------|--------|--------
S_FETCH1 |   0    |    1     |    0    |    0     |   0    |   0    |   0
S_FETCH2 |   1    |    0     |    1    |    0     |   1    |   0    |   0
S_FETCH3 |   1    |    0     |    1    |    0     |   1    |   0    |   0
S_DECODE |   0    |    *     |    0    |    0     |   0    |   0    |   0
S_EXEC1  |   *    |    *     |    0    |    *     |   *    |   *    |   *
S_EXEC2  |   0    |    0     |    0    |    *     |   *    |   0    |   *
S_EXEC3  |   0    |    0     |    0    |    *     |   0    |   0    |   0
S_HALT   |   0    |    0     |    0    |    0     |   0    |   0    |   0

* = depends on instruction (opcode)
```

## HDL Skeleton

```hdl
# ============================================
# Control Unit - Finite State Machine
# ============================================

wire [2:0] state;       # Current state
wire [2:0] next_state;  # Next state
wire clk;
wire rst;

# State register (3 D flip-flops)
dff STATE0 (input: next_state[0] clk, output: state[0]);
dff STATE1 (input: next_state[1] clk, output: state[1]);
dff STATE2 (input: next_state[2] clk, output: state[2]);

# Opcode from instruction register (bits 7:4)
wire [3:0] opcode;
# (Assume opcode is extracted from IR elsewhere)

# ============================================
# State Decoder
# ============================================
# Decode current state into one-hot signals

wire s_fetch1, s_fetch2, s_fetch3, s_decode;
wire s_exec1, s_exec2, s_exec3, s_halt;

wire s0n, s1n, s2n;
not STATE_INV0 (input: state[0], output: s0n);
not STATE_INV1 (input: state[1], output: s1n);
not STATE_INV2 (input: state[2], output: s2n);

# s_fetch1 = state == 000
wire sf1_t;
and SF1_1 (input: s2n s1n, output: sf1_t);
and SF1_2 (input: sf1_t s0n, output: s_fetch1);

# s_fetch2 = state == 001
wire sf2_t;
and SF2_1 (input: s2n s1n, output: sf2_t);
and SF2_2 (input: sf2_t state[0], output: s_fetch2);

# s_fetch3 = state == 010
wire sf3_t;
and SF3_1 (input: s2n state[1], output: sf3_t);
and SF3_2 (input: sf3_t s0n, output: s_fetch3);

# s_decode = state == 011
wire sd_t;
and SD_1 (input: s2n state[1], output: sd_t);
and SD_2 (input: sd_t state[0], output: s_decode);

# TODO: Decode remaining states (s_exec1, s_exec2, s_exec3, s_halt)
# s_exec1 = state == 100
# s_exec2 = state == 101
# s_exec3 = state == 110
# s_halt  = state == 111

# ============================================
# Instruction Decoder
# ============================================
# Decode opcode into instruction signals

wire is_hlt, is_lda, is_sta, is_add, is_sub, is_jmp, is_jz, is_ldi;

# Inverted opcode bits for decoding
wire op0n, op1n, op2n, op3n;
not OP_INV0 (input: opcode[0], output: op0n);
not OP_INV1 (input: opcode[1], output: op1n);
not OP_INV2 (input: opcode[2], output: op2n);
not OP_INV3 (input: opcode[3], output: op3n);

# is_hlt = opcode == 0000
wire hlt_t1, hlt_t2;
and HLT_1 (input: op3n op2n, output: hlt_t1);
and HLT_2 (input: op1n op0n, output: hlt_t2);
and HLT_3 (input: hlt_t1 hlt_t2, output: is_hlt);

# is_ldi = opcode == 0111
wire ldi_t1, ldi_t2;
and LDI_1 (input: op3n opcode[2], output: ldi_t1);
and LDI_2 (input: opcode[1] opcode[0], output: ldi_t2);
and LDI_3 (input: ldi_t1 ldi_t2, output: is_ldi);

# TODO: Complete instruction decoding for:
# is_lda = opcode == 0001
# is_sta = opcode == 0010
# is_add = opcode == 0011
# is_sub = opcode == 0100
# is_jmp = opcode == 0101
# is_jz  = opcode == 0110

# ============================================
# Control Signal Generation
# ============================================

wire pc_inc;
wire pc_load;
wire mar_load;
wire ir_load;
wire acc_load;
wire z_load;
wire mem_read;
wire mem_write;
wire halt;

# pc_inc: Active during FETCH2, FETCH3
or PC_INC_OR (input: s_fetch2 s_fetch3, output: pc_inc);

# mar_load: Active during FETCH1, and EXEC1 for memory instructions
wire mar_exec1;
# TODO: mar_exec1 = s_exec1 AND (is_lda OR is_sta OR is_add OR is_sub)
# ... implement this ...
or MAR_LOAD_OR (input: s_fetch1 mar_exec1, output: mar_load);

# ir_load: Active during FETCH2, FETCH3
or IR_LOAD_OR (input: s_fetch2 s_fetch3, output: ir_load);

# mem_read: Active during FETCH2, FETCH3, and EXEC1/EXEC2 for loads
wire mem_rd_exec;
# TODO: mem_rd_exec for load/add/sub instructions in exec states
or MEM_RD_OR (input: s_fetch2 s_fetch3 mem_rd_exec, output: mem_read);

# acc_load: Active when loading accumulator
# - LDI in EXEC1 (immediate to acc)
# - LDA in EXEC2 (memory to acc)
# - ADD/SUB in EXEC2 (ALU result to acc)
wire acc_ldi, acc_lda, acc_alu;
and ACC_LDI (input: s_exec1 is_ldi, output: acc_ldi);
# TODO: acc_lda = s_exec2 AND is_lda
# TODO: acc_alu = s_exec2 AND (is_add OR is_sub)
# or ACC_LOAD_OR (input: acc_ldi acc_lda acc_alu, output: acc_load);

# halt: Active when in HALT state
buf HALT_BUF (input: s_halt, output: halt);
>>>>>>> e0a7015c6d758cbc4977678e4b8043c68e2e1700

# ============================================
# Next State Logic
# ============================================

<<<<<<< HEAD
# From S0 -> S1 (always)
# From S1 -> S2 (always)
# From S2 -> S3 (always, decode)
# From S3 -> S7 if HLT
# From S3 -> S6 if LDI (immediate, no memory)
# From S3 -> S4 if LDA/STA/ADD/SUB (need memory)
# From S3 -> S0 if JMP (unconditional)
# From S3 -> S0 if JZ and Z=1, else stay for next instruction
# From S4 -> S5 if LDA/ADD/SUB (need ALU)
# From S4 -> S6 if STA (done)
# From S5 -> S6 (always)
# From S6 -> S0 (always)
# From S7 -> S7 (halted forever)

# Example: state_next[0] logic
# Goes to 1 when: S0->S1, S2->S3, S4->S5
# This is partial - you need full equations for all bits
```

## Control Signal Generation

Generate each control signal based on state:

```m4hdl
# ============================================
# Control Signal Generation
# ============================================

# pc_inc: Active in S1, S2 (after fetching bytes)
wire pc_inc;
# TODO: pc_inc = in_s1 OR in_s2

# pc_load: Active when executing JMP, or JZ with Z=1
wire pc_load;
# TODO: pc_load = (in_s3 AND is_jmp) OR (in_s3 AND is_jz AND z_flag)

# ir_load: Active in S1 (loading instruction)
wire ir_load;
# TODO: ir_load = in_s1

# mar_load: Active when setting up memory access
wire mar_load;
# TODO: mar_load = in_s0 OR in_s4

# acc_load: Active when storing result in accumulator
wire acc_load;
# TODO: acc_load = in_s5 (after ALU) OR (in_s3 AND is_ldi)

# mem_read: Active when reading memory
wire mem_read;
# TODO: mem_read = in_s0 OR in_s1 OR in_s4

# mem_write: Active for STA
wire mem_write;
# TODO: mem_write = in_s4 AND is_sta

# halt: Active when halted
wire halt;
buf CTRL_HALT (input: in_s7, output: halt);

# alu_op: Select ALU operation (0=ADD, 1=SUB)
wire alu_op;
# TODO: alu_op = is_sub
```

## Putting It All Together

The control unit connects to everything:

```
              +------------------+
  clk ------->|                  |-----> pc_inc
  rst ------->|                  |-----> pc_load
              |    CONTROL       |-----> ir_load
  opcode[3:0]>|      UNIT        |-----> mar_load
  z_flag ---->|                  |-----> acc_load
              |   (state machine)|-----> mem_read
              |                  |-----> mem_write
              +------------------+-----> halt
                                 \-----> alu_op
```

## Your Task

1. Complete the instruction decoder (all 8 instructions)
2. Implement state detection logic
3. Implement next-state logic for all transitions
4. Implement control signal generation

## Testing Your Control Unit

Trace through a simple program:

```asm
LDI 5       ; A = 5
ADD 0x10    ; A = A + mem[0x10]
STA 0x11    ; mem[0x11] = A
HLT
```

For each instruction, verify:
- Correct states are visited
- Correct control signals are generated
- Result is correct

## Common Bugs

1. **Wrong next state**: Check your boolean equations
2. **Missing control signal**: Some states need multiple signals
3. **JZ not working**: Make sure you're checking z_flag correctly
4. **PC not incrementing**: Should increment after each fetch byte

---

**Congratulations!** If you've completed both the ALU and control unit, you have a working CPU. Now test it with the provided programs.
=======
# Default progression: FETCH1 -> FETCH2 -> DECODE
# After decode, branch based on instruction

# For simple instructions (HLT, LDI): DECODE -> EXEC1 -> FETCH1
# For memory instructions: DECODE -> FETCH3 -> EXEC1 -> EXEC2 -> FETCH1
# For HLT: DECODE -> HALT (stays there)

wire goto_fetch1;
wire goto_fetch2;
wire goto_fetch3;
wire goto_decode;
wire goto_exec1;
wire goto_exec2;
wire goto_halt;

# goto_fetch2 = s_fetch1
buf GOTO_F2 (input: s_fetch1, output: goto_fetch2);

# goto_decode = s_fetch2 AND (is_hlt OR is_ldi)
#            OR s_fetch3 (for 2-byte instructions)
# TODO: Implement this logic

# goto_fetch3 = s_fetch2 AND needs_operand
# where needs_operand = is_lda OR is_sta OR is_add OR is_sub OR is_jmp OR is_jz
# TODO: Implement this logic

# goto_exec1 = s_decode OR s_fetch3
# TODO: Implement this logic

# goto_exec2 = s_exec1 AND needs_memory_access
# TODO: Implement this logic

# goto_halt = s_decode AND is_hlt
# TODO: Implement this logic

# goto_fetch1 = completed instruction
# - s_exec1 AND is_ldi
# - s_exec2 AND (is_lda OR is_add OR is_sub)
# - s_exec1 AND (is_jmp OR is_jz with condition met)
# TODO: Implement this logic

# Encode next_state from goto signals
# next_state[0] = goto_fetch2 OR goto_decode OR goto_exec2 OR goto_halt
# next_state[1] = goto_fetch3 OR goto_decode OR goto_exec3 OR goto_halt
# next_state[2] = goto_exec1 OR goto_exec2 OR goto_exec3 OR goto_halt
# TODO: Implement the encoding

# ============================================
# JZ Condition Check
# ============================================
# JZ jumps only if Z flag is set

wire jz_taken;
wire z_flag;  # Assume this comes from the ALU/flag register
and JZ_CHECK (input: is_jz z_flag, output: jz_taken);

# pc_load: Active for JMP, or JZ when taken
wire jmp_or_jz_taken;
or JMP_JZ (input: is_jmp jz_taken, output: jmp_or_jz_taken);
and PC_LOAD_AND (input: s_exec1 jmp_or_jz_taken, output: pc_load);
```

## Your Tasks

### Task 1: Complete State Decoding
Fill in the logic for s_exec1, s_exec2, s_exec3, and s_halt.

### Task 2: Complete Instruction Decoding
Add the AND gates to decode all 8 opcodes.

### Task 3: Complete Control Signal Generation
Wire up the remaining control signals based on state and instruction type.

### Task 4: Complete Next State Logic
This is the most complex part. Think carefully about:
- What state follows each state?
- When do you need to branch based on opcode?

### Task 5: Test Individual Instructions

Test each instruction type:
```
# Test HLT
Program: [0x00]  (HLT)
Expected: CPU enters HALT state after decode

# Test LDI
Program: [0x75]  (LDI 5)
Expected: Accumulator = 5, Z = 0

# Test LDA/STA
Program: [0x1F, 0x00, 0x2F, 0x01]  (LDA 0xF0, STA 0xF1)
Expected: Copies mem[0xF0] to mem[0xF1]

# Test ADD
Program: [0x72, 0x30, 0xF0]  (LDI 2, ADD [0xF0])
Expected: Accumulator = 2 + mem[0xF0]
```

## Common Mistakes

1. **Forgetting state transitions**: Every state must have a next state!
2. **Missing instruction cases**: All opcodes need handling in decode
3. **Wrong signal timing**: Control signals must be active in the RIGHT state
4. **JZ condition logic**: Only jump if BOTH is_jz AND z_flag

## Verification Checklist

- [ ] All 8 states properly decoded
- [ ] All 8 instructions properly decoded
- [ ] pc_inc active only during fetch
- [ ] pc_load active only for jumps
- [ ] acc_load active only when accumulator changes
- [ ] mem_read timed correctly with MAR
- [ ] State machine returns to FETCH after each instruction
- [ ] HLT properly stops execution

---

**Congratulations!** If you've completed all hints, you should have a working Micro4 CPU in HDL. Test it thoroughly, then try adding new instructions!
>>>>>>> e0a7015c6d758cbc4977678e4b8043c68e2e1700
