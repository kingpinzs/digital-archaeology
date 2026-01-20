# Task: Micro8 Progressive Hints

## Goal
Create progressive hint files for Micro8 HDL completion

## Context
- Students have completed Micro4 and are ready for 8-bit architecture
- Micro8 introduces: 8 registers, stack operations, more flags, addressing modes
- When stuck, they can reveal hints
- Hints progress from conceptual to specific

## Requirements
1. Create templates/micro8/hints/ directory with:
   - hint1_register_file.md
   - hint2_alu_expansion.md
   - hint3_stack_operations.md
   - hint4_addressing_modes.md
   - hint5_control_unit.md
   - hint6_flags_handling.md
   - hint7_integration.md

2. Each hint file structure:
   - What you're trying to achieve
   - Key insight or technique
   - Difference from Micro4 approach
   - Partial code or pseudocode (if later hint)
   - "Still stuck?" pointer to next hint

3. Hints should not give full answer until final hints

## Files to Read First
- src/micro8/cpu.h (register and flag definitions)
- src/micro8/cpu.c (instruction implementation reference)
- hdl/05_micro8_cpu.m8hdl (what the solution looks like, if it exists)
- templates/micro4/hints/ (hint style reference)
- docs/micro8_isa.md (ISA specification)

## Hint Content Guidelines

### hint1_register_file.md
- Explain 8-register architecture (R0-R7)
- Register pairs (BC, DE, HL) concept
- Difference from single accumulator
- Show register file block diagram (ASCII art)
- Don't show implementation code

### hint2_alu_expansion.md
- 8-bit ALU vs 4-bit ALU
- Additional operations (shifts, rotates)
- Multi-operand instructions
- Show operation selector expansion

### hint3_stack_operations.md
- PUSH/POP concept
- Stack pointer management
- SP increment/decrement timing
- Show stack operation state machine

### hint4_addressing_modes.md
- Immediate vs register vs memory modes
- HL indirect addressing
- Indexed addressing concept
- Show address selection MUX

### hint5_control_unit.md
- Multi-cycle instruction handling
- Microcode vs hardwired control
- T-state sequencing
- Show control state machine skeleton

### hint6_flags_handling.md
- Zero, Carry, Sign, Overflow flags
- Which instructions affect which flags
- Flag update timing
- Show flag computation circuits

### hint7_integration.md
- Connecting all modules
- Bus arbitration
- Clock domain handling
- Near-complete system diagram with gaps

## Verification
- Student can complete register file using hint 1
- Student can expand ALU using hint 2
- Student can implement stack using hint 3
- Student can handle addressing using hint 4
- Student can build control unit using hints 5-7
- No hint gives away complete solution
- Each hint builds on previous

## Progression from Micro4
Explicitly reference Micro4 concepts and show how they scale:
- "In Micro4 we had one accumulator, now we have 8 registers..."
- "The Micro4 ALU had 4 operations, Micro8 expands this to..."
- "Control was simple in Micro4 because all instructions were 1 cycle..."
