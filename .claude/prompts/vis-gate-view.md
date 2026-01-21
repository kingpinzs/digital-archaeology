# Task: Gate-Level Animation Module

## Goal
Create gate-view.js module for animated gate-level circuit visualization

## Context
- Current visualizer/index.html has gate rendering embedded in ~2000 lines
- Need to extract into modular component matching existing pattern
- Core engine already exists in visualizer/engine/ (SimEngine v1.1.0)
- Sister modules exist: cpu-state-view.js (1241 lines), debugger-view.js (1189 lines)

## Requirements
1. Create visualizer/modules/gate-view.js
2. Extract from index.html:
   - Gate rendering (AND, OR, NOT, XOR, NAND, NOR, XNOR, DFF)
   - Wire drawing with signal propagation animation
   - Particle effects for signal flow
   - X-Ray mode (CMOS transistor view)
3. Add features:
   - Highlight active gates during evaluation
   - Show gate delays in timing mode
   - Color-code signals (high=green, low=gray, undefined=red)
4. Subscribe to SimEngine simulation events
5. Support zoom/pan for large circuits

## Files to Read First
- visualizer/index.html (lines 200-end for rendering logic, canvas handling)
- visualizer/engine/index.js (SimEngine API)
- visualizer/engine/circuit.js (Circuit class, wire/gate access)
- visualizer/engine/types.js (WireState enum, GateType enum)
- visualizer/modules/cpu-state-view.js (pattern for module structure)
- visualizer/modules/debugger-view.js (pattern for event integration)
- visualizer/circuit.json (circuit format)

## Implementation Details
- Use canvas 2D context for rendering (match index.html approach)
- Follow module pattern from cpu-state-view.js (IIFE with exports)
- Maintain gate positions from JSON layout
- Animation frame rate: 60fps via requestAnimationFrame
- Signal propagation delay visualization
- Safe DOM methods (no innerHTML)
- Export GateView class

## Integration Points
- SimEngine.Circuit - get wire states via circuit.getWire(wireIndex, bit)
- SimEngine.WireState - HIGH, LOW, UNKNOWN for color coding
- SimEngine.GateType - AND, OR, NOT, XOR, NAND, NOR, XNOR, DFF
- Event system - subscribe to circuit step events

## Class API (recommended)
```javascript
class GateView {
    constructor(canvasElement, options = {})
    loadCircuit(circuit)           // Load SimEngine Circuit
    render()                       // Full redraw
    update()                       // Update after simulation step
    setZoom(level)                 // 0.1 to 10
    pan(dx, dy)                    // Pan viewport
    enableXRay(enabled)            // Toggle transistor view
    highlightGate(gateIndex)       // Highlight specific gate
    on(event, callback)            // Event subscription
    dispose()                      // Cleanup
}
```

## Color Scheme (match existing UI)
- HIGH signal: #00ff00 (green)
- LOW signal: #0077cc (blue) or #888 (gray)
- UNKNOWN signal: #e94560 (red/pink)
- Gate body: #1a1a2e (dark blue)
- Gate border: #0f3460 (navy)
- Active gate highlight: #ffaa00 (orange)
- Wire: gradient based on signal value
- Background: #0d0d1a (very dark blue)

## Verification
- Load circuit.json, see all gates rendered correctly
- Step simulation via debugger, signals animate through wires
- X-Ray mode shows CMOS transistor structure
- Zoom/pan works smoothly (mouse wheel + drag)
- Create gate-animation-demo.html to test standalone

## Demo Page
Create visualizer/modules-demo/gate-view-demo.html that:
- Loads the GateView module
- Creates a simple circuit (half adder)
- Shows controls for zoom, pan, X-ray toggle
- Demonstrates signal animation on step
