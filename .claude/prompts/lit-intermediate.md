# Task: Literature - Intermediate Concepts

## Goal
Create intermediate educational articles for Micro8/Micro16 concepts

## Context
- Students have completed basic articles
- Cover instruction encoding, control, memory, interrupts
- Prepare for Micro16 segmentation and Micro32 protected mode

## Requirements
1. Create literature/ articles:
   - 07_instruction_encoding.md (~600 lines)
   - 08_control_unit.md (~700 lines)
   - 09_memory_hierarchy.md (~500 lines)
   - 10_stack_operations.md (~400 lines)
   - 11_interrupts.md (~600 lines)
   - 12_addressing_modes.md (~500 lines)

2. Follow article template from lit-basics.md

## Article Summaries

### 07_instruction_encoding.md
- Opcode fields
- Operand encoding
- Fixed vs variable length
- Instruction formats (R-type, I-type, etc.)
- Decoding logic
- Example: Micro8 instruction format

### 08_control_unit.md
- Hardwired vs microprogrammed
- Finite state machine approach
- Microinstruction format
- Microcode ROM
- Control signal generation
- Timing diagrams

### 09_memory_hierarchy.md
- Memory technologies (SRAM, DRAM)
- Memory map
- Address decoding
- RAM vs ROM
- Cache concept (preview)
- Memory timing

### 10_stack_operations.md
- Stack concept (LIFO)
- Stack pointer register
- PUSH operation
- POP operation
- Stack frame for subroutines
- Stack overflow

### 11_interrupts.md
- Polling vs interrupts
- Interrupt request (IRQ)
- Interrupt acknowledge
- Interrupt vector table
- Saving/restoring context
- Nested interrupts
- Non-maskable interrupt (NMI)

### 12_addressing_modes.md
- Immediate: ADD R0, #5
- Register: ADD R0, R1
- Direct: LOAD R0, [0x1234]
- Register indirect: LOAD R0, [R1]
- Indexed: LOAD R0, [R1+4]
- Base+index: LOAD R0, [R1+R2]
- Why different modes exist

## Files to Read First
- literature/01-06_*.md (prior articles)
- docs/micro8_isa.md (instruction formats)
- hdl/05_micro8_cpu.m4hdl (implementation examples)
- homework/micro8/*.md (related exercises)

## Verification
- Build on basic article knowledge
- Prepare for protected mode concepts
- Links to Micro8/Micro16 exercises
