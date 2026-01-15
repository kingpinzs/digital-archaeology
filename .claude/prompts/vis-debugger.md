# Task: Step Debugger Module

## Goal
Create debugger-view.js module with step/run/breakpoint controls

## Context
- Visualizer currently lacks interactive debugging
- Need controls: Step, Run, Pause, Reset
- Need breakpoint management

## Requirements
1. Create visualizer/modules/debugger-view.js
2. Control panel with:
   - Step button (execute one cycle)
   - Run button (continuous execution)
   - Pause button (stop execution)
   - Reset button (reload circuit state)
   - Speed slider (cycles per second: 1-1000)
3. Breakpoint management:
   - Address breakpoints (PC = 0x1234)
   - Value breakpoints (R0 == 0xFF)
   - Condition breakpoints (Z flag set)
   - Breakpoint list with enable/disable
4. Execution history:
   - Last 100 instructions
   - Click to jump to state
5. Integrate with core-engine.js

## Files to Read First
- visualizer/index.html (existing controls if any)
- src/micro8/debugger.c (CLI debugger for reference)
- src/micro4/cpu.c (execution model)

## Implementation Details
- Keyboard shortcuts: Space=step, R=run, P=pause
- Breakpoint markers in address column
- History scrollable with timestamp
- Speed: requestAnimationFrame for smooth animation

## Verification
- Step through Micro4 program
- Set breakpoint, run, verify it stops
- Speed slider changes execution rate
- History shows correct instruction sequence
