// src/visualizer/CPUCircuitBridge.test.ts
// Unit tests for CPUCircuitBridge (Story 6.13)

import { describe, it, expect, beforeEach } from 'vitest';
import { CPUCircuitBridge, numberToBitArray } from './CPUCircuitBridge';
import { CircuitModel } from './CircuitModel';
import type { CPUState } from '@emulator/types';
import type { CircuitData } from './types';

/**
 * Create a minimal circuit data structure for testing.
 * Includes the key wires that CPUCircuitBridge maps to.
 */
function createTestCircuitData(): CircuitData {
  return {
    cycle: 0,
    stable: true,
    wires: [
      { id: 0, name: 'pc', width: 8, is_input: false, is_output: false, state: [0, 0, 0, 0, 0, 0, 0, 0] },
      { id: 1, name: 'acc', width: 4, is_input: false, is_output: false, state: [0, 0, 0, 0] },
      { id: 2, name: 'ir', width: 8, is_input: false, is_output: false, state: [0, 0, 0, 0, 0, 0, 0, 0] },
      { id: 3, name: 'mar', width: 8, is_input: false, is_output: false, state: [0, 0, 0, 0, 0, 0, 0, 0] },
      { id: 4, name: 'mdr', width: 4, is_input: false, is_output: false, state: [0, 0, 0, 0] },
      { id: 5, name: 'z_flag', width: 1, is_input: false, is_output: false, state: [0] },
      { id: 6, name: 'halt', width: 1, is_input: false, is_output: false, state: [0] },
      { id: 7, name: 'opcode', width: 4, is_input: false, is_output: false, state: [0, 0, 0, 0] },
      { id: 8, name: 'is_hlt', width: 1, is_input: false, is_output: false, state: [0] },
      { id: 9, name: 'is_lda', width: 1, is_input: false, is_output: false, state: [0] },
      { id: 10, name: 'is_sta', width: 1, is_input: false, is_output: false, state: [0] },
      { id: 11, name: 'is_add', width: 1, is_input: false, is_output: false, state: [0] },
      { id: 12, name: 'is_sub', width: 1, is_input: false, is_output: false, state: [0] },
      { id: 13, name: 'is_jmp', width: 1, is_input: false, is_output: false, state: [0] },
      { id: 14, name: 'is_jz', width: 1, is_input: false, is_output: false, state: [0] },
      { id: 15, name: 'is_ldi', width: 1, is_input: false, is_output: false, state: [0] },
      { id: 16, name: 'pc_load', width: 1, is_input: false, is_output: false, state: [0] },
      { id: 17, name: 'pc_inc', width: 1, is_input: false, is_output: false, state: [0] },
      { id: 18, name: 'acc_load', width: 1, is_input: false, is_output: false, state: [0] },
      { id: 19, name: 'z_load', width: 1, is_input: false, is_output: false, state: [0] },
      { id: 20, name: 'ir_load', width: 1, is_input: false, is_output: false, state: [0] },
      { id: 21, name: 'mar_load', width: 1, is_input: false, is_output: false, state: [0] },
      { id: 22, name: 'mdr_load', width: 1, is_input: false, is_output: false, state: [0] },
    ],
    gates: [],
  };
}

/**
 * Create a test CPU state with configurable values.
 */
function createTestCPUState(overrides: Partial<CPUState> = {}): CPUState {
  return {
    pc: 0,
    accumulator: 0,
    zeroFlag: false,
    halted: false,
    error: false,
    errorMessage: null,
    memory: new Uint8Array(256),
    ir: 0,
    mar: 0,
    mdr: 0,
    cycles: 0,
    instructions: 0,
    ...overrides,
  };
}

/**
 * Find a wire by name in circuit data and return its state.
 */
function getWireState(circuitData: CircuitData, name: string): number[] | undefined {
  const wire = circuitData.wires.find(w => w.name === name);
  return wire?.state;
}

describe('numberToBitArray', () => {
  it('converts 0 to all zeros', () => {
    expect(numberToBitArray(0, 4)).toEqual([0, 0, 0, 0]);
    expect(numberToBitArray(0, 8)).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('converts single bit values correctly', () => {
    // LSB first order
    expect(numberToBitArray(1, 4)).toEqual([1, 0, 0, 0]);
    expect(numberToBitArray(2, 4)).toEqual([0, 1, 0, 0]);
    expect(numberToBitArray(4, 4)).toEqual([0, 0, 1, 0]);
    expect(numberToBitArray(8, 4)).toEqual([0, 0, 0, 1]);
  });

  it('converts multi-bit values correctly', () => {
    // 5 = 0101 binary, LSB first = [1, 0, 1, 0]
    expect(numberToBitArray(5, 4)).toEqual([1, 0, 1, 0]);
    // 10 = 1010 binary, LSB first = [0, 1, 0, 1]
    expect(numberToBitArray(10, 4)).toEqual([0, 1, 0, 1]);
    // 15 = 1111 binary
    expect(numberToBitArray(15, 4)).toEqual([1, 1, 1, 1]);
  });

  it('handles 8-bit values', () => {
    // 255 = 11111111
    expect(numberToBitArray(255, 8)).toEqual([1, 1, 1, 1, 1, 1, 1, 1]);
    // 128 = 10000000, LSB first = [0,0,0,0,0,0,0,1]
    expect(numberToBitArray(128, 8)).toEqual([0, 0, 0, 0, 0, 0, 0, 1]);
    // 170 = 10101010, LSB first = [0,1,0,1,0,1,0,1]
    expect(numberToBitArray(170, 8)).toEqual([0, 1, 0, 1, 0, 1, 0, 1]);
  });

  it('handles 1-bit values', () => {
    expect(numberToBitArray(0, 1)).toEqual([0]);
    expect(numberToBitArray(1, 1)).toEqual([1]);
  });
});

describe('CPUCircuitBridge', () => {
  let bridge: CPUCircuitBridge;
  let circuitModel: CircuitModel;

  beforeEach(() => {
    bridge = new CPUCircuitBridge();
    circuitModel = new CircuitModel(createTestCircuitData());
  });

  describe('mapStateToCircuit', () => {
    it('maps PC value correctly', () => {
      const cpuState = createTestCPUState({ pc: 42 });
      const result = bridge.mapStateToCircuit(cpuState, circuitModel);

      // 42 = 00101010 binary, LSB first = [0,1,0,1,0,1,0,0]
      expect(getWireState(result, 'pc')).toEqual([0, 1, 0, 1, 0, 1, 0, 0]);
    });

    it('maps ACC value correctly', () => {
      const cpuState = createTestCPUState({ accumulator: 11 });
      const result = bridge.mapStateToCircuit(cpuState, circuitModel);

      // 11 = 1011 binary, LSB first = [1,1,0,1]
      expect(getWireState(result, 'acc')).toEqual([1, 1, 0, 1]);
    });

    it('maps IR value correctly', () => {
      const cpuState = createTestCPUState({ ir: 0x15 }); // LDA 0x05
      const result = bridge.mapStateToCircuit(cpuState, circuitModel);

      // 0x15 = 00010101 binary, LSB first
      expect(getWireState(result, 'ir')).toEqual([1, 0, 1, 0, 1, 0, 0, 0]);
    });

    it('maps MAR value correctly', () => {
      const cpuState = createTestCPUState({ mar: 0xFF });
      const result = bridge.mapStateToCircuit(cpuState, circuitModel);

      expect(getWireState(result, 'mar')).toEqual([1, 1, 1, 1, 1, 1, 1, 1]);
    });

    it('maps MDR value correctly', () => {
      const cpuState = createTestCPUState({ mdr: 7 });
      const result = bridge.mapStateToCircuit(cpuState, circuitModel);

      // 7 = 0111 binary, LSB first = [1,1,1,0]
      expect(getWireState(result, 'mdr')).toEqual([1, 1, 1, 0]);
    });

    it('maps zero flag correctly', () => {
      const cpuState1 = createTestCPUState({ zeroFlag: false });
      const result1 = bridge.mapStateToCircuit(cpuState1, circuitModel);
      expect(getWireState(result1, 'z_flag')).toEqual([0]);

      const cpuState2 = createTestCPUState({ zeroFlag: true });
      const result2 = bridge.mapStateToCircuit(cpuState2, circuitModel);
      expect(getWireState(result2, 'z_flag')).toEqual([1]);
    });

    it('maps halted flag correctly', () => {
      const cpuState1 = createTestCPUState({ halted: false });
      const result1 = bridge.mapStateToCircuit(cpuState1, circuitModel);
      expect(getWireState(result1, 'halt')).toEqual([0]);

      const cpuState2 = createTestCPUState({ halted: true });
      const result2 = bridge.mapStateToCircuit(cpuState2, circuitModel);
      expect(getWireState(result2, 'halt')).toEqual([1]);
    });
  });

  describe('opcode extraction', () => {
    it('extracts opcode from IR correctly', () => {
      // IR = 0x10 means opcode 1 (LDA), operand 0
      const cpuState = createTestCPUState({ ir: 0x10 });
      const result = bridge.mapStateToCircuit(cpuState, circuitModel);

      // Opcode 1 = 0001 binary, LSB first = [1,0,0,0]
      expect(getWireState(result, 'opcode')).toEqual([1, 0, 0, 0]);
    });

    it('handles all opcodes', () => {
      // Test HLT (opcode 0)
      let result = bridge.mapStateToCircuit(createTestCPUState({ ir: 0x00 }), circuitModel);
      expect(getWireState(result, 'opcode')).toEqual([0, 0, 0, 0]);

      // Test LDI (opcode 7)
      result = bridge.mapStateToCircuit(createTestCPUState({ ir: 0x70 }), circuitModel);
      expect(getWireState(result, 'opcode')).toEqual([1, 1, 1, 0]); // 7 LSB first

      // Test DEC (opcode 15)
      result = bridge.mapStateToCircuit(createTestCPUState({ ir: 0xF0 }), circuitModel);
      expect(getWireState(result, 'opcode')).toEqual([1, 1, 1, 1]); // 15 LSB first
    });
  });

  describe('instruction decode signals', () => {
    it('sets is_hlt for HLT instruction', () => {
      const cpuState = createTestCPUState({ ir: 0x00 }); // HLT
      const result = bridge.mapStateToCircuit(cpuState, circuitModel);

      expect(getWireState(result, 'is_hlt')).toEqual([1]);
      expect(getWireState(result, 'is_lda')).toEqual([0]);
    });

    it('sets is_lda for LDA instruction', () => {
      const cpuState = createTestCPUState({ ir: 0x10 }); // LDA
      const result = bridge.mapStateToCircuit(cpuState, circuitModel);

      expect(getWireState(result, 'is_lda')).toEqual([1]);
      expect(getWireState(result, 'is_hlt')).toEqual([0]);
    });

    it('sets is_sta for STA instruction', () => {
      const cpuState = createTestCPUState({ ir: 0x20 }); // STA
      const result = bridge.mapStateToCircuit(cpuState, circuitModel);

      expect(getWireState(result, 'is_sta')).toEqual([1]);
    });

    it('sets is_add for ADD instruction', () => {
      const cpuState = createTestCPUState({ ir: 0x30 }); // ADD
      const result = bridge.mapStateToCircuit(cpuState, circuitModel);

      expect(getWireState(result, 'is_add')).toEqual([1]);
    });

    it('sets is_jmp for JMP instruction', () => {
      const cpuState = createTestCPUState({ ir: 0x50 }); // JMP
      const result = bridge.mapStateToCircuit(cpuState, circuitModel);

      expect(getWireState(result, 'is_jmp')).toEqual([1]);
    });

    it('sets is_jz for JZ instruction', () => {
      const cpuState = createTestCPUState({ ir: 0x60 }); // JZ
      const result = bridge.mapStateToCircuit(cpuState, circuitModel);

      expect(getWireState(result, 'is_jz')).toEqual([1]);
    });

    it('sets is_ldi for LDI instruction', () => {
      const cpuState = createTestCPUState({ ir: 0x75 }); // LDI 5
      const result = bridge.mapStateToCircuit(cpuState, circuitModel);

      expect(getWireState(result, 'is_ldi')).toEqual([1]);
    });
  });

  describe('control signals', () => {
    it('sets pc_load for JMP', () => {
      const cpuState = createTestCPUState({ ir: 0x50 }); // JMP
      const result = bridge.mapStateToCircuit(cpuState, circuitModel);

      expect(getWireState(result, 'pc_load')).toEqual([1]);
      expect(getWireState(result, 'pc_inc')).toEqual([0]); // Not incrementing when loading
    });

    it('sets pc_load for JZ when zero flag is set', () => {
      const cpuState = createTestCPUState({ ir: 0x60, zeroFlag: true }); // JZ with Z=1
      const result = bridge.mapStateToCircuit(cpuState, circuitModel);

      expect(getWireState(result, 'pc_load')).toEqual([1]);
    });

    it('does not set pc_load for JZ when zero flag is clear', () => {
      const cpuState = createTestCPUState({ ir: 0x60, zeroFlag: false }); // JZ with Z=0
      const result = bridge.mapStateToCircuit(cpuState, circuitModel);

      expect(getWireState(result, 'pc_load')).toEqual([0]);
    });

    it('sets pc_inc when not halted and not loading PC', () => {
      const cpuState = createTestCPUState({ ir: 0x10, halted: false }); // LDA
      const result = bridge.mapStateToCircuit(cpuState, circuitModel);

      expect(getWireState(result, 'pc_inc')).toEqual([1]);
    });

    it('clears pc_inc when halted', () => {
      const cpuState = createTestCPUState({ ir: 0x00, halted: true }); // HLT, halted
      const result = bridge.mapStateToCircuit(cpuState, circuitModel);

      expect(getWireState(result, 'pc_inc')).toEqual([0]);
    });

    it('sets acc_load for LDA', () => {
      const cpuState = createTestCPUState({ ir: 0x10 }); // LDA
      const result = bridge.mapStateToCircuit(cpuState, circuitModel);

      expect(getWireState(result, 'acc_load')).toEqual([1]);
    });

    it('sets acc_load for LDI', () => {
      const cpuState = createTestCPUState({ ir: 0x75 }); // LDI 5
      const result = bridge.mapStateToCircuit(cpuState, circuitModel);

      expect(getWireState(result, 'acc_load')).toEqual([1]);
    });

    it('sets acc_load for ALU operations', () => {
      // ADD
      let result = bridge.mapStateToCircuit(createTestCPUState({ ir: 0x30 }), circuitModel);
      expect(getWireState(result, 'acc_load')).toEqual([1]);

      // SUB
      result = bridge.mapStateToCircuit(createTestCPUState({ ir: 0x40 }), circuitModel);
      expect(getWireState(result, 'acc_load')).toEqual([1]);
    });

    it('does not set acc_load for JMP', () => {
      const cpuState = createTestCPUState({ ir: 0x50 }); // JMP
      const result = bridge.mapStateToCircuit(cpuState, circuitModel);

      expect(getWireState(result, 'acc_load')).toEqual([0]);
    });

    it('sets mar_load for memory operations', () => {
      // LDA
      let result = bridge.mapStateToCircuit(createTestCPUState({ ir: 0x10 }), circuitModel);
      expect(getWireState(result, 'mar_load')).toEqual([1]);

      // STA
      result = bridge.mapStateToCircuit(createTestCPUState({ ir: 0x20 }), circuitModel);
      expect(getWireState(result, 'mar_load')).toEqual([1]);
    });

    it('does not set mar_load for LDI', () => {
      const cpuState = createTestCPUState({ ir: 0x75 }); // LDI
      const result = bridge.mapStateToCircuit(cpuState, circuitModel);

      expect(getWireState(result, 'mar_load')).toEqual([0]);
    });
  });

  describe('clearCache', () => {
    it('allows re-caching after clear', () => {
      // First mapping builds cache
      const cpuState1 = createTestCPUState({ pc: 10 });
      bridge.mapStateToCircuit(cpuState1, circuitModel);

      // Clear cache
      bridge.clearCache();

      // Second mapping should still work
      const cpuState2 = createTestCPUState({ pc: 20 });
      const result = bridge.mapStateToCircuit(cpuState2, circuitModel);

      expect(getWireState(result, 'pc')).toEqual(numberToBitArray(20, 8));
    });
  });

  describe('does not mutate original model', () => {
    it('returns a new CircuitData object', () => {
      const cpuState = createTestCPUState({ pc: 42 });
      const result = bridge.mapStateToCircuit(cpuState, circuitModel);

      // Result should be a different object
      expect(result).not.toBe(createTestCircuitData());

      // Original model should be unchanged
      const originalWire = circuitModel.getWire(0); // PC wire
      expect(originalWire?.state).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    });
  });
});
