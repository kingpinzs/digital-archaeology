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
