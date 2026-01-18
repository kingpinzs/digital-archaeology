# Hint 4: Control Unit Concepts

## What You're Trying to Achieve

The control unit is the "conductor" of your CPU. It:
1. Fetches instructions from memory
2. Decodes what operation to perform
3. Orchestrates all the parts to execute the instruction

Without the control unit, your ALU and registers are just idle hardware.

## Key Insight: The Fetch-Decode-Execute Cycle

Every instruction goes through these phases:

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐       │
│   │  FETCH  │───>│ DECODE  │───>│ EXECUTE │       │
│   └─────────┘    └─────────┘    └─────────┘       │
│        ^                              │            │
│        │                              │            │
│        └──────────────────────────────┘            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### FETCH Phase
- Put PC (program counter) value onto address bus
- Read instruction byte from memory
- Store it in IR (instruction register)
- Increment PC

### DECODE Phase
- Look at opcode bits in IR
- Determine which instruction this is
- Set up for execution

### EXECUTE Phase
- Perform the actual operation
- Update registers/memory/flags as needed
- Some instructions need multiple cycles here

## The Micro4 Instruction Format

```
  7  6  5  4  3  2  1  0
┌──┴──┴──┴──┬──┴──┴──┴──┐
│  OPCODE   │  OPERAND  │
│  (4 bits) │  (4 bits) │
└───────────┴───────────┘
```

For 2-byte instructions, the second byte is the full 8-bit address.

## Opcodes to Decode

| Opcode | Binary | Instruction | What it Does |
|--------|--------|-------------|--------------|
| 0      | 0000   | HLT         | Stop the CPU |
| 1      | 0001   | LDA addr    | Load A from memory |
| 2      | 0010   | STA addr    | Store A to memory |
| 3      | 0011   | ADD addr    | A = A + mem[addr] |
| 4      | 0100   | SUB addr    | A = A - mem[addr] |
| 5      | 0101   | JMP addr    | Jump to address |
| 6      | 0110   | JZ addr     | Jump if zero flag set |
| 7      | 0111   | LDI imm     | Load immediate into A |

## Control Signals

The control unit generates signals that tell each part what to do:

| Signal    | When Active | Effect |
|-----------|-------------|--------|
| pc_inc    | After fetch | PC = PC + 1 |
| pc_load   | JMP/JZ taken| PC = address from instruction |
| ir_load   | During fetch| IR = data from memory |
| mar_load  | Before memory access | MAR = address to access |
| acc_load  | LDA, LDI, ADD, SUB | Accumulator gets new value |
| mem_read  | LDA, ADD, SUB, fetch | Read from memory |
| mem_write | STA | Write to memory |
| alu_op    | ADD, SUB | Select ALU operation |
| halt      | HLT | Stop the clock |

## State Machine Approach

The control unit is a state machine. Each state does one thing:

```
State 0: FETCH_HI
  - MAR = PC
  - Read memory
  - IR[7:4] = data
  - PC++

State 1: FETCH_LO (for 2-byte instructions)
  - MAR = PC
  - Read memory
  - IR[3:0] or address reg = data
  - PC++

State 2: DECODE
  - Look at opcode
  - Branch to appropriate execute state

State 3+: EXECUTE (varies by instruction)
  - Do the work
  - Return to FETCH
```

## Questions to Think About

1. How many states do you need minimum?
2. Which instructions can share execute states?
3. How do you decide the next state? (Hint: combinational logic based on current state + opcode)

---

**Still stuck?** Open `hint5_control_implementation.md` for near-complete code.
