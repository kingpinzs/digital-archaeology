/**
 * Core Simulation Engine - Type Definitions
 *
 * Defines wire states and gate types matching the C simulator.
 * This module provides the foundational enums and constants used
 * throughout the simulation engine.
 */

// Wire states (4-state logic)
const WireState = Object.freeze({
    LOW: 0,      // Logic low (0)
    HIGH: 1,     // Logic high (1)
    UNKNOWN: 2,  // Unknown/uninitialized (X)
    HIGHZ: 3     // High impedance/tri-state (Z)
});

// String representations for debugging
const WireStateStr = Object.freeze({
    [WireState.LOW]: '0',
    [WireState.HIGH]: '1',
    [WireState.UNKNOWN]: 'X',
    [WireState.HIGHZ]: 'Z'
});

// Gate types (matching C simulator)
const GateType = Object.freeze({
    NOT: 'NOT',
    AND: 'AND',
    OR: 'OR',
    NAND: 'NAND',
    NOR: 'NOR',
    XOR: 'XOR',
    XNOR: 'XNOR',
    BUF: 'BUF',
    MUX2: 'MUX2',
    DFF: 'DFF',
    DLATCH: 'DLATCH',
    NMOS: 'NMOS',
    PMOS: 'PMOS',
    CONST: 'CONST',
    MODULE: 'MODULE'
});

// Component types for the visualizer
const ComponentType = Object.freeze({
    VDD: 'vdd',
    GND: 'gnd',
    SWITCH: 'switch',
    LED: 'led',
    ...GateType
});

// Maximum limits (matching C simulator)
const Limits = Object.freeze({
    MAX_WIRES: 1024,
    MAX_GATES: 2048,
    MAX_MODULES: 128,
    MAX_NAME_LEN: 64,
    MAX_INPUTS: 16,
    MAX_OUTPUTS: 8,
    MAX_PROPAGATION_ITERATIONS: 100
});

// Export for ES6 modules or global scope
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WireState, WireStateStr, GateType, ComponentType, Limits };
} else if (typeof window !== 'undefined') {
    window.SimEngine = window.SimEngine || {};
    window.SimEngine.WireState = WireState;
    window.SimEngine.WireStateStr = WireStateStr;
    window.SimEngine.GateType = GateType;
    window.SimEngine.ComponentType = ComponentType;
    window.SimEngine.Limits = Limits;
}
