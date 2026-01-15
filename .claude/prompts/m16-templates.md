# Task: Micro16 Educational Templates

## Goal
Create starter HDL template and hints for 16-bit CPU

## Context
- Reference: hdl/06_micro16_cpu.m4hdl (2131 lines, complete)
- Students have completed Micro8
- Major new concepts: segmentation, multiply/divide, string ops

## Requirements
1. Create templates/micro16/hdl/starter.m16hdl
   - 16-bit registers (AX, BX, CX, DX, SI, DI, BP, SP)
   - Segment registers (CS, DS, SS, ES)
   - Basic MOV and arithmetic
   - TODO: Advanced features

2. Create templates/micro16/hints/ with:
   - hint1_segmentation.md
   - hint2_multiply_divide.md
   - hint3_string_operations.md
   - hint4_prefixes.md
   - hint5_protected_mode_prep.md

3. Create templates/micro16/expected/ with:
   - basic_mov.expected
   - segment_test.expected
   - multiply_test.expected

## Files to Read First
- hdl/06_micro16_cpu.m4hdl (reference implementation)
- docs/micro8_isa.md (16-bit ISA patterns)
- programs/micro16/*.asm (test programs)
- templates/micro8/ (prior stage structure)

## Template Provided Features
- All 8 general purpose registers
- All 4 segment registers
- 20-bit physical address calculation (seg*16 + offset)
- Basic MOV reg, reg
- Basic MOV reg, imm16
- Basic ADD, SUB, CMP

## Template TODO Features
- MUL, DIV instructions
- String operations (MOVS, CMPS, SCAS)
- REP prefix
- Segment override prefixes
- IN/OUT port instructions
- Interrupt handling

## Hint Guidelines
- hint1: Explain segmentation model, physical address calc
- hint2: Hardware multiplier design, result in DX:AX
- hint3: String ops use SI, DI, direction flag
- hint4: Prefix byte modifies following instruction
- hint5: Descriptor tables concept (prep for Micro32)

## Verification
- Template runs basic_mov.asm correctly
- Segmentation addressing works
- Students can add MUL using hints
