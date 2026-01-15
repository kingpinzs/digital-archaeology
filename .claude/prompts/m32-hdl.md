# Task: Micro32 HDL Reference Implementation

## Goal
Create complete HDL implementation of 32-bit protected mode CPU

## Context
- Micro16 HDL at hdl/06_micro16_cpu.m4hdl (2131 lines)
- Micro32 is significantly more complex
- Expected: 4000-6000 lines

## Requirements
1. Create hdl/07_micro32_cpu.m32hdl
2. Implement all Micro32 ISA instructions
3. Core features:
   - 32-bit datapath
   - 8 general purpose registers
   - 6 segment registers with descriptor cache
   - Control registers (CR0-CR3)
   - 32-bit ALU with all operations
   - Hardware multiply (32×32→64)
   - Hardware divide (64÷32→32,32)

4. Protected mode:
   - GDT/LDT table lookup
   - Segment descriptor loading
   - Privilege level checking
   - Limit checking

5. Paging unit:
   - CR3 page directory base
   - Two-level page table walk
   - TLB (16 entries minimum)
   - Page fault exception

6. Exception handling:
   - IDT lookup
   - Exception frame push
   - Ring transition on interrupt

## Files to Read First
- hdl/06_micro16_cpu.m4hdl (template structure)
- docs/micro32_isa.md (instruction encoding)
- src/micro32/cpu.c (behavioral reference)
- docs/cpu_history_timeline.md (386 architecture)

## HDL Structure
```m32hdl
// ===== MICRO32 REFERENCE CPU =====

// ----- SECTION 1: Registers -----
// 32-bit GPRs, segment regs, control regs

// ----- SECTION 2: ALU -----
// 32-bit operations, multiply, divide

// ----- SECTION 3: Memory Unit -----
// Address translation, TLB

// ----- SECTION 4: Segment Unit -----
// Descriptor loading, privilege check

// ----- SECTION 5: Paging Unit -----
// Page table walk, fault detection

// ----- SECTION 6: Exception Unit -----
// IDT lookup, stack switch

// ----- SECTION 7: Instruction Decoder -----
// Complex decoding with prefixes

// ----- SECTION 8: Control Unit -----
// Microcode or FSM
```

## Verification
- All Micro32 test programs run correctly
- Protected mode transition works
- Paging test passes
- Exception handling verified
- Runs in HDL simulator
