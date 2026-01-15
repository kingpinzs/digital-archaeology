# Task: Micro4 Optimization Homework

## Goal
Create 5 progressive optimization exercises for Micro4

## Context
- docs/optimization_homework.md has general exercises
- Need Micro4-specific exercises with:
  - Clear goals
  - Starter state (what exists)
  - What to add
  - Verification method

## Requirements
1. Create homework/micro4/ directory with 5 exercise files:
   - 01_add_inc_dec.md (⭐ Easy)
   - 02_add_zero_flag.md (⭐ Easy)
   - 03_add_carry_flag.md (⭐⭐ Medium)
   - 04_add_shift_rotate.md (⭐⭐⭐ Hard)
   - 05_add_multiply.md (⭐⭐⭐⭐ Expert)

2. Each exercise includes:
   - Difficulty rating
   - Goal statement (what feature to add)
   - Prerequisites (prior exercises needed)
   - Current state in HDL (what exists)
   - What to add (specific gates, wires, control logic)
   - Test program to verify (.asm file)
   - Progressive hints (3-5 hints, increasing detail)
   - Literature references (link to literature/ articles)
   - Expected outcome (test output)

## Files to Read First
- docs/optimization_homework.md (format reference)
- hdl/04_micro4_cpu.m4hdl (current reference implementation)
- programs/*.asm (existing test programs)
- templates/micro4/hdl/starter.m4hdl (if exists, student starting point)

## Exercise Details

### 01_add_inc_dec.md
- Add INC (increment A) and DEC (decrement A) instructions
- Uses existing ALU, just add opcodes and control logic
- Test: countdown.asm should work

### 02_add_zero_flag.md
- Add zero flag that sets when ALU result is 0
- Requires: flag flip-flop, zero detector circuit
- Test: JZ instruction can branch on zero

### 03_add_carry_flag.md
- Add carry flag for multi-precision arithmetic
- Requires: carry-out from adder, flag storage
- Test: 16-bit addition using two 4-bit adds

### 04_add_shift_rotate.md
- Add SHL, SHR, ROL, ROR instructions
- Requires: barrel shifter or sequential shift
- Test: multiply by 2 using SHL

### 05_add_multiply.md
- Add MUL instruction (4x4 -> 8 bit result)
- Requires: multiplier circuit or microcode loop
- Test: 3 * 4 = 12

## Verification
- Student can complete exercise 1 in <30 min
- Each exercise builds on previous (except 01 and 02 can be parallel)
- All test programs pass after completion
