# Task: Gate-Level Animation Module

## Goal
Create gate-view.js module for animated gate-level circuit visualization

## Context
- Current visualizer/index.html has gate rendering in ~2000 lines
- Need to extract into modular component
- Must integrate with core-engine.js event system

## Requirements
1. Create visualizer/modules/gate-view.js
2. Extract from index.html:
   - Gate rendering (AND, OR, NOT, XOR, NAND, NOR, XNOR)
   - Wire drawing with signal propagation animation
   - Particle effects for signal flow
   - X-Ray mode (CMOS transistor view)
3. Add features:
   - Highlight active gates
   - Show gate delays in timing mode
   - Color-code signals (high=green, low=gray, undefined=red)
4. Subscribe to core-engine simulation events
5. Support zoom/pan for large circuits

## Files to Read First
- visualizer/index.html (lines 500-1500 for rendering logic)
- visualizer/circuit.json (circuit format)
- hdl/04_micro4_cpu.m4hdl (example circuit to visualize)

## Implementation Details
- Use canvas 2D context for rendering
- Maintain gate positions from JSON layout
- Animation frame rate: 60fps
- Signal propagation delay visualization

## Verification
- Load Micro4 circuit, see all gates rendered
- Step simulation, signals animate through wires
- X-Ray mode shows transistor structure
- Zoom/pan works smoothly
