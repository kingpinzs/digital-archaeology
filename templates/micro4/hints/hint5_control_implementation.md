# Hint 5: Control Unit Implementation

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

# ============================================
# Next State Logic
# ============================================

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
