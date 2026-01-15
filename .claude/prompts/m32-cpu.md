# Task: Micro32 CPU Emulator

## Goal
Create C emulator for 32-bit protected mode CPU

## Context
- Micro16 emulator at src/micro16/cpu.c (1611 lines) is template
- Micro32 adds: protected mode, paging, 32-bit registers
- This is first CPU with OS-capable features

## Requirements
1. Create src/micro32/cpu.h with:
   - 32-bit registers: EAX, EBX, ECX, EDX, ESI, EDI, EBP, ESP
   - 16-bit subregisters: AX, BX, etc. (lower 16)
   - 8-bit subregisters: AL, AH, BL, BH, etc.
   - Control registers: CR0-CR3
   - Segment registers with hidden parts (base, limit, access)
   - EFLAGS (32-bit)
   - Instruction pointer: EIP

2. Create src/micro32/cpu.c with:
   - All ~150 instructions from ISA spec
   - Protected mode transitions (PE bit in CR0)
   - Ring 0-3 privilege levels
   - Segment descriptor loading
   - Page table walking (when paging enabled)
   - Exception handling (GP fault, page fault)

3. Protected mode features:
   - GDT/LDT descriptor table support
   - IDT for interrupts
   - Privilege level checking
   - Segment limit checking

4. Paging features:
   - CR3 = page directory base
   - 4KB pages
   - Present, writable, user bits
   - TLB (optional, for performance)

## Files to Read First
- src/micro16/cpu.c (template for structure)
- src/micro16/cpu.h (register definitions)
- docs/micro32_isa.md (must be created first)
- docs/cpu_history_timeline.md (386 features)

## Implementation Order
1. Real mode first (like Micro16)
2. Add protected mode without paging
3. Add paging
4. Add exception handling
5. Add all remaining instructions

## Verification
- Real mode programs from Micro16 work
- Protected mode transition test
- Ring 3 to ring 0 transition via call gate
- Paging test with page fault handler
- Build: gcc -o micro32 cpu.c -Wall -Wextra
