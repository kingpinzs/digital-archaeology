# Task: Micro16 Disassembler

## Goal
Create standalone disassembler for Micro16 binaries

## Context
- Micro8 has working disassembler at src/micro8/disasm.c (1258 lines)
- Micro16 ISA is 16-bit with segmentation
- ~120 instructions to decode
- Instruction encoding uses variable-length format

## Requirements
1. Create src/micro16/disasm.c (standalone, single file)
2. Decode all Micro16 opcodes correctly
3. Show segment:offset addresses (e.g., 0000:0100)
4. Handle prefixes (REP, LOCK, segment overrides)
5. Output format matching Micro8 style:
   ```
   0000:0100  B8 34 12     MOV AX, #0x1234
   0000:0103  89 C3        MOV BX, AX
   ```
6. Support both file input and stdin

## Files to Read First
- src/micro8/disasm.c (template to follow - copy structure)
- src/micro16/cpu.h (opcode definitions, instruction formats)
- src/micro16/assembler.c (instruction encoding logic)
- hdl/06_micro16_cpu.m4hdl (instruction decoder logic)

## Implementation Details
- Main function: `disasm_instruction(uint8_t *bytes, int max_len, char *output)`
- Return number of bytes consumed
- Handle ModR/M byte for register/memory operands
- Support displacement bytes for memory addressing
- Include symbol table for labels if available

## Verification
- Disassemble programs/micro16/*.bin files
- Output should match original .asm source (modulo formatting)
- All 120+ opcodes handled without "UNKNOWN" output
- Build: `gcc -o micro16-disasm disasm.c`
