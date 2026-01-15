# Task: Micro32 Assembler

## Goal
Create two-pass assembler for Micro32 ISA

## Context
- Micro16 assembler at src/micro16/assembler.c is template
- Micro32 has ~150 instructions
- Must support protected mode directives

## Requirements
1. Create src/micro32/assembler.c (standalone, single file)
2. Two-pass assembly:
   - Pass 1: Build symbol table, calculate addresses
   - Pass 2: Generate machine code
3. Support all Micro32 instructions from ISA spec
4. Directives:
   - .ORG address
   - .DB byte [, byte...]
   - .DW word [, word...]
   - .DD dword [, dword...]
   - .ALIGN n
   - .EQU symbol, value
   - .SECTION name
   - .GLOBAL symbol
   - .EXTERN symbol
5. Protected mode support:
   - GDT/LDT descriptor macros
   - IDT entry macros
   - Page table generation helpers
6. Addressing modes:
   - Register: EAX
   - Immediate: #0x12345678
   - Direct: [0x12345678]
   - Register indirect: [EAX]
   - Base+displacement: [EBP+8]
   - SIB: [EAX+EBX*4+16]

## Files to Read First
- src/micro16/assembler.c (template structure)
- docs/micro32_isa.md (instruction encoding)
- programs/micro16/*.asm (syntax examples)

## Output Formats
- Raw binary (.bin)
- Flat binary with header (.exe)
- Symbol file (.sym)
- Listing file (.lst)

## GDT/IDT Macros Example
```asm
; GDT descriptor macro
GDT_ENTRY base, limit, access, flags
  ; Generates 8-byte descriptor

; Usage:
gdt_code: GDT_ENTRY 0, 0xFFFFF, 0x9A, 0xC  ; Code, ring 0
gdt_data: GDT_ENTRY 0, 0xFFFFF, 0x92, 0xC  ; Data, ring 0
```

## Verification
- Assemble programs/micro32/*.asm
- Output matches expected binary
- All 150 instructions assemble correctly
- GDT setup program assembles
- Build: gcc -o micro32-asm assembler.c
