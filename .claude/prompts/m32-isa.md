# Task: Micro32 ISA Specification

## Goal
Write comprehensive ISA spec for 32-bit CPU with protected mode

## Context
- Micro16 ISA at docs/micro8_isa.md (1024 lines) is the template
- Micro32 adds: protected mode, paging, 32-bit addressing
- This is the foundation document - CPU, assembler, HDL all depend on it

## Requirements
1. Create docs/micro32_isa.md (~1500-2000 lines)
2. Define:
   - 32-bit registers: EAX, EBX, ECX, EDX, ESI, EDI, EBP, ESP
   - 16-bit subregisters: AX, BX, etc. (lower 16 bits)
   - 8-bit subregisters: AL, AH, BL, BH, etc.
   - Control registers: CR0-CR3
   - Segment registers: CS, DS, SS, ES, FS, GS
   - EFLAGS register (32-bit)
   - All instructions (~150+)
   - Addressing modes (direct, indirect, SIB, displacement)
   - Privilege levels (Ring 0-3)
   - Paging structures (PDE, PTE)
   - Descriptor tables (GDT, LDT, IDT)
3. Include encoding tables for all opcodes
4. Include example programs

## Files to Read First
- docs/micro8_isa.md (format template - follow same structure)
- docs/incremental_cpu_design.md (evolution rationale)
- docs/cpu_history_timeline.md (historical context - 386 era)
- docs/optimization_homework.md (features to support)

## Document Structure
```markdown
# Micro32 ISA Specification

## 1. Architecture Overview
## 2. Registers
## 3. Memory Model
## 4. Instruction Format
## 5. Addressing Modes
## 6. Instruction Set (grouped by category)
## 7. Protected Mode
## 8. Paging
## 9. Interrupts and Exceptions
## 10. Example Programs
## 11. Opcode Encoding Tables
```

## Verification
- Complete instruction encoding for all opcodes
- Clear examples for protected mode transitions
- Consistent with Micro16 where applicable
- Can be used as sole reference to implement assembler
