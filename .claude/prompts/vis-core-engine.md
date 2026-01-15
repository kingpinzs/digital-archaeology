# Task: Visualizer Core Engine

## Goal
Extract simulation logic from visualizer/index.html into a modular core-engine.js

## Context
- Current visualizer is ~2000 lines in single HTML file
- Has working simulation logic for gates
- Needs to become modular for CPU state view, debugger integration

## Requirements
1. Create visualizer/modules/core-engine.js
2. Extract: simulation state, gate evaluation, signal propagation
3. Add: state management (load, save, reset, step)
4. Add: event system for module communication
5. Keep backward compatible with existing index.html

## Files to Read First
- visualizer/index.html (lines 1-500 for simulation logic)
- visualizer/circuit.json (input format)

## Implementation Details
- Use ES6 module syntax (export/import)
- Create SimulationEngine class with:
  - `load(circuitJson)` - Load circuit definition
  - `step()` - Execute one simulation cycle
  - `run()` - Continuous simulation
  - `pause()` - Pause simulation
  - `reset()` - Reset to initial state
  - `getState()` - Return current wire/gate states
  - `on(event, callback)` - Event subscription
- Events to emit:
  - 'step' - After each simulation step
  - 'stateChange' - When any signal changes
  - 'loaded' - Circuit loaded
  - 'error' - Simulation error

## Verification
- Load existing circuit.json
- Step through simulation
- Signals propagate correctly
- Events fire appropriately
