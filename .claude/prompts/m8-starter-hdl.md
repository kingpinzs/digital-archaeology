# Task: Micro8 Starter HDL Template

## Goal
Create minimal but functional HDL template for 8-bit CPU

## Context
- Reference: hdl/05_micro8_cpu.m4hdl (1549 lines, complete)
- Students have completed Micro4
- Template provides: registers, stack pointer, basic MOV
- Students add: ALU, control, stack operations, jumps

## Requirements
1. Create templates/micro8/hdl/starter.m8hdl
2. Include (working):
   - 8 general registers (R0-R7)
   - 16-bit program counter
   - 16-bit stack pointer
   - Memory interface (64KB address space)
   - Basic MOV Rd, Rs instruction
   - HALT instruction
3. Mark as TODO:
   - Full ALU (ADD, SUB, AND, OR, XOR, etc.)
   - Flags (Z, C, S, O)
   - All addressing modes
   - PUSH/POP operations
   - CALL/RET
   - Conditional jumps
   - Interrupt handling
4. Extensive comments explaining 8-bit vs 4-bit differences

## Files to Read First
- hdl/05_micro8_cpu.m4hdl (reference implementation)
- docs/micro8_isa.md (instruction set specification)
- programs/micro8/*.asm (test programs)
- hdl/04_micro4_cpu.m4hdl (what students already know)

## Template Structure
```m8hdl
// ===== MICRO8 STARTER TEMPLATE =====
// Building on Micro4, you'll add:
// - 8 registers instead of 1 accumulator
// - 16-bit addressing (64KB memory)
// - Stack operations
// - Flags and conditional execution

// ----- PROVIDED: Register File -----
// 8x 8-bit registers, dual read ports

// ----- PROVIDED: Basic MOV -----
// MOV Rd, Rs already works

// ----- TODO: Full ALU with Flags -----
// Add arithmetic, logic, and flag generation

// ----- TODO: Stack Operations -----
// PUSH, POP using stack pointer

// ----- TODO: Control Flow -----
// Jumps, calls, returns
```

## Verification
- Template compiles without errors
- MOV R0, R1 works correctly
- HALT stops execution
- Test program with only MOV and HALT runs
