# Task: Micro16 Optimization Homework

## Goal
Create 10 progressive optimization exercises for Micro16

## Context
- Students have completed Micro8 homework
- Micro16 introduces segmentation, hardware multiply, string ops
- This stage prepares for protected mode in Micro32

## Requirements
1. Create homework/micro16/ directory with 10 exercise files:
   - 01_segment_registers.md (⭐ Easy)
   - 02_hardware_multiply.md (⭐⭐ Medium)
   - 03_hardware_divide.md (⭐⭐ Medium)
   - 04_string_movs.md (⭐⭐ Medium)
   - 05_string_cmps.md (⭐⭐⭐ Hard)
   - 06_rep_prefix.md (⭐⭐⭐ Hard)
   - 07_instruction_prefetch.md (⭐⭐⭐⭐ Expert)
   - 08_microcode_control.md (⭐⭐⭐⭐ Expert)
   - 09_segment_limits.md (⭐⭐⭐⭐⭐ Master)
   - 10_interrupt_descriptor.md (⭐⭐⭐⭐⭐ Master)

2. Each exercise includes all standard fields

## Files to Read First
- docs/optimization_homework.md (format reference)
- hdl/06_micro16_cpu.m4hdl (reference implementation)
- homework/micro8/*.md (prior stage format)
- programs/micro16/*.asm (test programs)
- literature/addressing_modes_explained.md (if exists)

## Exercise Details

### 01_segment_registers.md
- Add segment:offset addressing
- Physical = segment * 16 + offset
- Test: Access different 64KB windows

### 02_hardware_multiply.md
- 16-bit × 16-bit → 32-bit result
- Result in DX:AX
- Test: 1000 * 1000 = 1000000

### 03_hardware_divide.md
- 32-bit ÷ 16-bit → 16-bit quotient, 16-bit remainder
- Dividend in DX:AX
- Test: 1000000 / 1000 = 1000

### 04_string_movs.md
- MOVSB: Move byte [DS:SI] to [ES:DI]
- Auto-increment SI, DI
- Test: Block memory copy

### 05_string_cmps.md
- CMPSB: Compare [DS:SI] with [ES:DI]
- Set flags based on comparison
- Test: String comparison

### 06_rep_prefix.md
- REP: Repeat while CX != 0
- REPZ, REPNZ variants
- Test: memset, strlen implementations

### 07_instruction_prefetch.md
- Add 4-byte prefetch queue
- Fetch during execute
- Test: Measure cycle improvement

### 08_microcode_control.md
- Replace FSM with microcode ROM
- Microinstruction format
- Test: Same behavior, easier to modify

### 09_segment_limits.md
- Add segment limit registers
- Check access against limits
- Test: Detect out-of-bounds access

### 10_interrupt_descriptor.md
- 256-entry interrupt table
- Each entry: segment:offset
- Test: Custom interrupt handler

## Verification
- Exercises build on each other
- Protected mode prep in exercises 9-10
- All tests verify completion
