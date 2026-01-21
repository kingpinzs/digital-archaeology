<<<<<<< HEAD
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
=======
# Hint 4: Control Unit Concept

## The Fetch-Decode-Execute Cycle

Every instruction a CPU executes follows this fundamental pattern:

```
    +-------+     +--------+     +---------+
    | FETCH | --> | DECODE | --> | EXECUTE |
    +-------+     +--------+     +---------+
         ^                             |
         +-----------------------------+
                   (repeat)
```

### 1. FETCH

**Goal**: Get the next instruction from memory into the CPU.

Steps:
1. Put PC (Program Counter) value onto the address bus
2. Read from memory into IR (Instruction Register)
3. Increment PC to point to next instruction

### 2. DECODE

**Goal**: Figure out what instruction this is.

Steps:
1. Look at the opcode (upper bits of IR)
2. Activate the appropriate instruction decoder output
3. Determine if more data is needed (operand fetch)

### 3. EXECUTE

**Goal**: Actually DO the instruction.

This varies by instruction:
- **LDA**: Read memory, put in accumulator
- **STA**: Write accumulator to memory
- **ADD**: Read memory, add to accumulator, store result
- **JMP**: Load PC with new address
- etc.

## The State Machine Approach

The control unit is a **Finite State Machine (FSM)**. Each state generates specific control signals.

For Micro4, consider these states:

```
State 0: FETCH_ADDR
  - MAR <- PC         (send PC to memory address register)
  - mem_read = 1      (start memory read)

State 1: FETCH_DATA
  - IR <- mem_data    (load instruction into IR)
  - PC <- PC + 1      (point to next byte)

State 2: DECODE
  - Examine opcode
  - Branch to appropriate execute state

State 3+: EXECUTE_xxx
  - Different states for different instructions
  - May need multiple cycles (e.g., memory access)
```

## Control Signals

The control unit generates signals that tell other components what to do:

| Signal | Purpose |
|--------|---------|
| `pc_inc` | Increment the program counter |
| `pc_load` | Load PC from address (for jumps) |
| `ir_load` | Load instruction register from memory |
| `mar_load` | Load memory address register |
| `acc_load` | Load accumulator with new value |
| `z_load` | Update zero flag |
| `mem_read` | Initiate memory read |
| `mem_write` | Initiate memory write |
| `alu_to_acc` | ALU result goes to accumulator |
| `mdr_to_acc` | Memory data goes to accumulator |
| `halt` | Stop execution |

## Instruction-Specific Execution

### HLT (Halt)
```
State: EXECUTE_HLT
  - halt = 1
  - (CPU stops)
```

### LDI imm (Load Immediate)
```
State: EXECUTE_LDI
  - acc_load = 1
  - imm_to_acc = 1   (IR lower nibble -> accumulator)
  - z_load = 1
  - Return to FETCH
```

### LDA addr (Load from Address)
```
State: FETCH_OPERAND
  - MAR <- PC
  - mem_read = 1
  - PC++

State: EXECUTE_LDA_1
  - MAR <- operand_address
  - mem_read = 1

State: EXECUTE_LDA_2
  - acc <- mem_data
  - z_load = 1
  - Return to FETCH
```

### ADD addr (Add from Address)
```
State: FETCH_OPERAND
  - (same as LDA)

State: EXECUTE_ADD_1
  - MAR <- operand_address
  - mem_read = 1

State: EXECUTE_ADD_2
  - ALU computes acc + mem_data
  - alu_to_acc = 1
  - z_load = 1
  - Return to FETCH
```

## State Transition Diagram

```
                    +-----------+
                    |   FETCH   |
                    |   ADDR    |
                    +-----+-----+
                          |
                          v
                    +-----------+
                    |   FETCH   |
                    |   DATA    |
                    +-----+-----+
                          |
                          v
                    +-----------+
                    |  DECODE   |
                    +-----+-----+
                          |
          +-------+-------+-------+-------+
          |       |       |       |       |
          v       v       v       v       v
       +-----+ +-----+ +-----+ +-----+ +-----+
       | HLT | | LDI | | LDA | | ADD | | JMP |
       +-----+ +--+--+ +--+--+ +--+--+ +--+--+
          |       |       |       |       |
          |       v       v       v       v
        STOP   +-----+ +-----+ +-----+ +-----+
               |FETCH| |FETCH| |FETCH| |FETCH|
               +-----+ +-----+ +-----+ +-----+
```

## Key Questions to Answer

1. **How many states do you need?**
   - Count: FETCH states + DECODE + states per instruction type

2. **How many bits for state register?**
   - 8 states = 3 bits
   - 16 states = 4 bits

3. **What determines the next state?**
   - Current state
   - Opcode (for branching from DECODE)
   - Flags (for conditional jumps like JZ)

4. **How do you generate control signals?**
   - Combinational logic based on current state
   - Can be done with AND/OR gates
   - Or with a ROM/lookup table (microcode)

## Don't Implement Yet!

Before coding:
1. List all states you need
2. Create a state transition table
3. Create a control signal table (state vs. signals)
4. Then translate to gates or ROM

---

**Ready to implement?** See `hint5_control_implementation.md` for HDL structure.
>>>>>>> e0a7015c6d758cbc4977678e4b8043c68e2e1700
