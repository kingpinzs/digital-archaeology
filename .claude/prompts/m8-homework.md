# Task: Micro8 Optimization Homework

## Goal
Create 8 progressive optimization exercises for Micro8

## Context
- docs/optimization_homework.md has general exercises
- Students have completed Micro4 homework
- Micro8 has more features to optimize

## Requirements
1. Create homework/micro8/ directory with 8 exercise files:
   - 01_register_pairs.md (⭐ Easy)
   - 02_index_registers.md (⭐ Easy)
   - 03_stack_operations.md (⭐⭐ Medium)
   - 04_subroutine_calls.md (⭐⭐ Medium)
   - 05_interrupt_handling.md (⭐⭐⭐ Hard)
   - 06_addressing_modes.md (⭐⭐⭐ Hard)
   - 07_16bit_arithmetic.md (⭐⭐⭐⭐ Expert)
   - 08_critical_path.md (⭐⭐⭐⭐ Expert)

2. Each exercise includes:
   - Difficulty rating
   - Goal statement
   - Prerequisites (prior exercises needed)
   - Current state in HDL
   - What to add
   - Test program (.asm file)
   - Progressive hints (3-5)
   - Literature references
   - Expected outcome

## Files to Read First
- docs/optimization_homework.md (format reference)
- hdl/05_micro8_cpu.m4hdl (reference implementation)
- homework/micro4/*.md (exercise format from prior stage)
- programs/micro8/*.asm (existing test programs)

## Exercise Details

### 01_register_pairs.md
- Combine R0-R1 as BC, R2-R3 as DE, R4-R5 as HL
- 16-bit operations on pairs
- Test: 16-bit counter using HL

### 02_index_registers.md
- Use HL as memory pointer
- Add LD A, (HL) and LD (HL), A
- Test: Array traversal

### 03_stack_operations.md
- Add PUSH reg, POP reg
- Stack pointer management
- Test: Nested subroutine calls

### 04_subroutine_calls.md
- Add CALL addr, RET
- Push/pop return address
- Test: Recursive factorial

### 05_interrupt_handling.md
- Add interrupt vector table
- EI/DI instructions
- RETI instruction
- Test: Timer interrupt handler

### 06_addressing_modes.md
- Add indexed: LD A, (HL+d)
- Add indirect: LD A, ((nn))
- Test: Lookup table access

### 07_16bit_arithmetic.md
- Add ADD HL, BC
- Add 16-bit INC/DEC
- Test: 32-bit addition

### 08_critical_path.md
- Analyze timing
- Optimize slowest path
- Test: Measure cycles per instruction

## Verification
- Exercise 1 completable in <45 min
- Dependencies are clear
- All test programs verify completion
