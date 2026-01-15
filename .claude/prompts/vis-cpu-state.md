# Task: CPU State Viewer Module

## Goal
Create cpu-state-view.js module showing registers, memory, flags

## Context
- Visualizer shows gates but not CPU internal state
- Different CPUs have different registers:
  - Micro4: 1 accumulator (A), PC, zero flag
  - Micro8: R0-R7, flags Z/C/S/O, PC, SP
  - Micro16: AX-DX, SI, DI, BP, segment registers (CS, DS, SS, ES)
  - Micro32: EAX-EDX, ESI, EDI, EBP, ESP, control registers

## Requirements
1. Create visualizer/modules/cpu-state-view.js
2. Panel showing:
   - Registers (adapts to CPU type loaded)
   - Flags with visual indicators (green=set, gray=clear)
   - PC and SP with hex values
   - Current instruction decoded
   - Memory hex dump (scrollable, 16 bytes per row)
3. Auto-update on simulation step (subscribe to core-engine events)
4. Click register/memory to set watchpoint
5. Highlight changed values in yellow briefly

## Files to Read First
- src/micro4/cpu.h (Micro4 register definitions)
- src/micro8/cpu.h (Micro8 register definitions)
- src/micro16/cpu.h (Micro16 register definitions)
- visualizer/index.html (UI patterns and styling)

## Implementation Details
- Detect CPU type from loaded circuit metadata
- Use CSS grid for register layout
- Memory viewer with address input for jumping
- Format values as hex with 0x prefix

## Verification
- Load Micro8 HDL, see R0-R7 + flags displayed
- Step simulation, values update in real-time
- Changed values highlight briefly
- Click register shows watchpoint dialog
