# Task: Micro4 Starter HDL Template

## Goal
Create minimal but functional HDL template for students to complete

## Context
- Reference: hdl/04_micro4_cpu.m4hdl (311 lines, complete)
- Students should build the ALU themselves
- Template provides: registers, memory interface, basic structure
- Students add: ALU operations, control logic

## Requirements
1. Create templates/micro4/hdl/starter.m4hdl
2. Include (working):
   - 4-bit program counter
   - 4-bit accumulator register
   - Memory interface (read/write)
   - Clock and reset handling
   - Instruction fetch logic
3. Mark as TODO (students complete):
   - ALU (currently just passes through)
   - ADD operation
   - SUB operation
   - AND/OR/XOR operations
   - Conditional jumps
4. Add helpful comments explaining each section
5. Template should compile and run (just with limited ops)

## Files to Read First
- hdl/04_micro4_cpu.m4hdl (reference implementation)
- docs/micro4_isa.md (if exists, for instruction set)
- programs/add.asm (test program)

## Template Structure
```m4hdl
// ===== MICRO4 STARTER TEMPLATE =====
// Complete the TODO sections to build your CPU

// ----- PROVIDED: Registers -----
// (working code here)

// ----- TODO: ALU -----
// Your task: implement arithmetic and logic operations
// Currently just passes A through unchanged

// ----- TODO: Control Logic -----
// Your task: decode instructions and set control signals
```

## Verification
- Template compiles without errors
- Runs in simulator (limited functionality)
- NOP instruction works
- MOV A, imm works
- ADD marked as TODO, doesn't work until completed
