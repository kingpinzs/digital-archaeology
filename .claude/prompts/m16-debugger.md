# Task: Micro16 Debugger

## Goal
Create interactive debugger for Micro16 CPU

## Context
- Micro8 has working debugger at src/micro8/debugger.c (582 lines)
- Micro16 adds segments, more registers, different memory model
- Need similar command interface but adapted for 16-bit

## Requirements
1. Create src/micro16/debugger.c
2. Commands:
   - `step` / `s` - Execute one instruction
   - `run` / `r` - Run until breakpoint or halt
   - `break <seg:off>` / `b` - Set breakpoint at address
   - `delete <n>` - Delete breakpoint
   - `watch <reg>` - Break when register changes
   - `mem <seg:off> [count]` - Dump memory
   - `regs` - Display all registers
   - `segs` - Display segment registers
   - `flags` - Display flags
   - `disasm [seg:off] [count]` - Disassemble at address
   - `quit` / `q` - Exit debugger
3. Show segment:offset for all addresses
4. Display all segment registers prominently
5. Support conditional breakpoints (e.g., `break 0000:0100 if AX==0x1234`)

## Files to Read First
- src/micro8/debugger.c (template to follow - copy structure)
- src/micro16/cpu.h (CPU state structure)
- src/micro16/cpu.c (execution functions, step logic)
- src/micro16/disasm.c (if created, for disassembly output)

## Implementation Details
- Use readline for command history if available
- Color output for registers (changed values in yellow)
- Show current instruction before prompt
- Memory dump in hex+ASCII format

## Verification
- Load programs/micro16/basic_mov.asm binary
- Step through, verify register changes
- Set breakpoint, run to it
- Inspect memory at various segments
- Build: `gcc -o micro16-dbg debugger.c cpu.c -lreadline`
