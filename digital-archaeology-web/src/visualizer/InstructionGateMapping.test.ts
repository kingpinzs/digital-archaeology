// src/visualizer/InstructionGateMapping.test.ts
// Unit tests for instruction-to-gate mapping (Story 6.9)

import { describe, it, expect } from 'vitest';
import {
  getGatesForInstruction,
  getSignalPathForInstruction,
  getInstructionsForGate,
  OPCODE_GATE_MAP,
} from './InstructionGateMapping';

describe('InstructionGateMapping', () => {
  // Gate ID constants from circuit.json for verification
  const DECODER_INVERTERS = [4, 5, 6, 7]; // DEC_NOT0-3
  const ACCUMULATOR_GATES = [142, 143, 144, 145]; // ACC0-3
  const ALU_A_GATES = [27, 28, 29, 30]; // ALU_A0-3
  const ALU_B_GATES = [31, 32, 33, 34]; // ALU_B0-3
  const PC_GATES = [159, 160, 161, 162, 163, 164, 165, 166]; // PC0-7
  const ZERO_FLAG = 146; // ZFLAG
  const CTRL_HALT = 111;
  const CTRL_MW = 115; // Memory write
  const CTRL_ALU2ACC = 128;

  describe('getGatesForInstruction', () => {
    it('should return gate IDs for LDA instruction including decoder and accumulator', () => {
      const gates = getGatesForInstruction('LDA');
      expect(gates.length).toBeGreaterThan(0);
      // LDA uses decoder inverters
      DECODER_INVERTERS.forEach((id) => expect(gates).toContain(id));
      // LDA loads into accumulator
      ACCUMULATOR_GATES.forEach((id) => expect(gates).toContain(id));
    });

    it('should return gate IDs for STA instruction including decoder and memory write', () => {
      const gates = getGatesForInstruction('STA');
      expect(gates.length).toBeGreaterThan(0);
      // STA uses decoder inverters
      DECODER_INVERTERS.forEach((id) => expect(gates).toContain(id));
      // STA uses memory write control
      expect(gates).toContain(CTRL_MW);
    });

    it('should return gate IDs for ADD instruction including ALU and accumulator', () => {
      const gates = getGatesForInstruction('ADD');
      expect(gates.length).toBeGreaterThan(0);
      // ADD uses decoder inverters
      DECODER_INVERTERS.forEach((id) => expect(gates).toContain(id));
      // ADD uses ALU input gates
      ALU_A_GATES.forEach((id) => expect(gates).toContain(id));
      ALU_B_GATES.forEach((id) => expect(gates).toContain(id));
      // ADD stores result in accumulator
      ACCUMULATOR_GATES.forEach((id) => expect(gates).toContain(id));
      // ADD updates zero flag
      expect(gates).toContain(ZERO_FLAG);
      // ADD uses ALU to ACC control
      expect(gates).toContain(CTRL_ALU2ACC);
    });

    it('should return gate IDs for SUB instruction including ALU and zero flag', () => {
      const gates = getGatesForInstruction('SUB');
      expect(gates.length).toBeGreaterThan(0);
      // SUB uses ALU input gates
      ALU_A_GATES.forEach((id) => expect(gates).toContain(id));
      ALU_B_GATES.forEach((id) => expect(gates).toContain(id));
      // SUB updates zero flag
      expect(gates).toContain(ZERO_FLAG);
      expect(gates).toContain(CTRL_ALU2ACC);
    });

    it('should return gate IDs for JMP instruction including program counter', () => {
      const gates = getGatesForInstruction('JMP');
      expect(gates.length).toBeGreaterThan(0);
      // JMP uses decoder inverters
      DECODER_INVERTERS.forEach((id) => expect(gates).toContain(id));
      // JMP modifies program counter
      PC_GATES.forEach((id) => expect(gates).toContain(id));
    });

    it('should return gate IDs for JZ instruction including PC and zero flag', () => {
      const gates = getGatesForInstruction('JZ');
      expect(gates.length).toBeGreaterThan(0);
      // JZ uses decoder inverters
      DECODER_INVERTERS.forEach((id) => expect(gates).toContain(id));
      // JZ checks zero flag
      expect(gates).toContain(ZERO_FLAG);
      // JZ modifies program counter
      PC_GATES.forEach((id) => expect(gates).toContain(id));
    });

    it('should return gate IDs for LDI instruction including accumulator', () => {
      const gates = getGatesForInstruction('LDI');
      expect(gates.length).toBeGreaterThan(0);
      // LDI uses decoder inverters
      DECODER_INVERTERS.forEach((id) => expect(gates).toContain(id));
      // LDI loads into accumulator
      ACCUMULATOR_GATES.forEach((id) => expect(gates).toContain(id));
    });

    it('should return gate IDs for HLT instruction including halt control', () => {
      const gates = getGatesForInstruction('HLT');
      expect(gates.length).toBeGreaterThan(0);
      // HLT uses decoder inverters
      DECODER_INVERTERS.forEach((id) => expect(gates).toContain(id));
      // HLT uses halt control gate
      expect(gates).toContain(CTRL_HALT);
    });

    it('should return empty array for unknown opcode', () => {
      const gates = getGatesForInstruction('UNKNOWN');
      expect(gates).toEqual([]);
    });

    it('should handle lowercase opcodes', () => {
      const gates = getGatesForInstruction('lda');
      expect(gates.length).toBeGreaterThan(0);
      // Should return same gates as uppercase
      const upperGates = getGatesForInstruction('LDA');
      expect(gates).toEqual(upperGates);
    });

    it('should handle mixed case opcodes', () => {
      const gates = getGatesForInstruction('Lda');
      const upperGates = getGatesForInstruction('LDA');
      expect(gates).toEqual(upperGates);
    });

    // Test ALU operations with specific gate verification
    it('should return gate IDs for AND instruction including ALU gates', () => {
      const gates = getGatesForInstruction('AND');
      expect(gates.length).toBeGreaterThan(0);
      // AND uses ALU A input
      ALU_A_GATES.forEach((id) => expect(gates).toContain(id));
      // AND stores to accumulator
      ACCUMULATOR_GATES.forEach((id) => expect(gates).toContain(id));
      expect(gates).toContain(CTRL_ALU2ACC);
    });

    it('should return gate IDs for OR instruction including ALU gates', () => {
      const gates = getGatesForInstruction('OR');
      expect(gates.length).toBeGreaterThan(0);
      ALU_A_GATES.forEach((id) => expect(gates).toContain(id));
      ACCUMULATOR_GATES.forEach((id) => expect(gates).toContain(id));
    });

    it('should return gate IDs for XOR instruction including ALU gates', () => {
      const gates = getGatesForInstruction('XOR');
      expect(gates.length).toBeGreaterThan(0);
      ALU_A_GATES.forEach((id) => expect(gates).toContain(id));
      ACCUMULATOR_GATES.forEach((id) => expect(gates).toContain(id));
    });

    it('should return gate IDs for NOT instruction including ALU gates', () => {
      const gates = getGatesForInstruction('NOT');
      expect(gates.length).toBeGreaterThan(0);
      // NOT is unary, uses only ALU A input
      ALU_A_GATES.forEach((id) => expect(gates).toContain(id));
      ACCUMULATOR_GATES.forEach((id) => expect(gates).toContain(id));
    });

    it('should return gate IDs for SHL instruction including ALU gates', () => {
      const gates = getGatesForInstruction('SHL');
      expect(gates.length).toBeGreaterThan(0);
      ALU_A_GATES.forEach((id) => expect(gates).toContain(id));
      ACCUMULATOR_GATES.forEach((id) => expect(gates).toContain(id));
    });

    it('should return gate IDs for SHR instruction including ALU gates', () => {
      const gates = getGatesForInstruction('SHR');
      expect(gates.length).toBeGreaterThan(0);
      ALU_A_GATES.forEach((id) => expect(gates).toContain(id));
      ACCUMULATOR_GATES.forEach((id) => expect(gates).toContain(id));
    });

    it('should return gate IDs for INC instruction including ALU gates', () => {
      const gates = getGatesForInstruction('INC');
      expect(gates.length).toBeGreaterThan(0);
      ALU_A_GATES.forEach((id) => expect(gates).toContain(id));
      ACCUMULATOR_GATES.forEach((id) => expect(gates).toContain(id));
    });

    it('should return gate IDs for DEC instruction including ALU gates', () => {
      const gates = getGatesForInstruction('DEC');
      expect(gates.length).toBeGreaterThan(0);
      ALU_A_GATES.forEach((id) => expect(gates).toContain(id));
      ACCUMULATOR_GATES.forEach((id) => expect(gates).toContain(id));
    });
  });

  describe('getSignalPathForInstruction', () => {
    it('should return signal path for LDA instruction with opcode and acc wires', () => {
      const path = getSignalPathForInstruction('LDA');
      expect(Array.isArray(path)).toBe(true);
      expect(path.length).toBeGreaterThan(0);
      // Each path entry should be [wireId, bitIndex]
      path.forEach((segment) => {
        expect(Array.isArray(segment)).toBe(true);
        expect(segment.length).toBe(2);
        expect(typeof segment[0]).toBe('number');
        expect(typeof segment[1]).toBe('number');
      });
      // Should include opcode wire (21) bits
      expect(path.some(([wireId]) => wireId === 21)).toBe(true);
    });

    it('should return signal path for ADD instruction with ALU wires', () => {
      const path = getSignalPathForInstruction('ADD');
      expect(Array.isArray(path)).toBe(true);
      expect(path.length).toBeGreaterThan(0);
      // Should include opcode wire
      expect(path.some(([wireId]) => wireId === 21)).toBe(true);
      // Should include ALU result wire (48)
      expect(path.some(([wireId]) => wireId === 48)).toBe(true);
    });

    it('should return empty array for unknown opcode', () => {
      const path = getSignalPathForInstruction('UNKNOWN');
      expect(path).toEqual([]);
    });

    it('should return signal path for JMP with PC wire', () => {
      const path = getSignalPathForInstruction('JMP');
      expect(path.length).toBeGreaterThan(0);
      // Should include PC wire (2)
      expect(path.some(([wireId]) => wireId === 2)).toBe(true);
    });
  });

  describe('OPCODE_GATE_MAP', () => {
    it('should have entries for all basic opcodes', () => {
      const basicOpcodes = ['HLT', 'LDA', 'STA', 'ADD', 'SUB', 'JMP', 'JZ', 'LDI'];
      for (const opcode of basicOpcodes) {
        expect(OPCODE_GATE_MAP[opcode]).toBeDefined();
        expect(OPCODE_GATE_MAP[opcode].gates.length).toBeGreaterThan(0);
        expect(OPCODE_GATE_MAP[opcode].signalPath.length).toBeGreaterThan(0);
      }
    });

    it('should have entries for ALU opcodes', () => {
      const aluOpcodes = ['AND', 'OR', 'XOR', 'NOT', 'SHL', 'SHR', 'INC', 'DEC'];
      for (const opcode of aluOpcodes) {
        expect(OPCODE_GATE_MAP[opcode]).toBeDefined();
        expect(OPCODE_GATE_MAP[opcode].gates.length).toBeGreaterThan(0);
        expect(OPCODE_GATE_MAP[opcode].signalPath.length).toBeGreaterThan(0);
      }
    });

    it('should have exactly 16 opcodes (Micro4 full instruction set)', () => {
      const opcodes = Object.keys(OPCODE_GATE_MAP);
      expect(opcodes.length).toBe(16);
    });

    it('should have all gate IDs be non-negative integers', () => {
      for (const [, mapping] of Object.entries(OPCODE_GATE_MAP)) {
        for (const gateId of mapping.gates) {
          expect(Number.isInteger(gateId)).toBe(true);
          expect(gateId).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('should have all signal path entries be valid [wireId, bitIndex] pairs', () => {
      for (const [, mapping] of Object.entries(OPCODE_GATE_MAP)) {
        for (const segment of mapping.signalPath) {
          expect(Array.isArray(segment)).toBe(true);
          expect(segment.length).toBe(2);
          expect(Number.isInteger(segment[0])).toBe(true);
          expect(Number.isInteger(segment[1])).toBe(true);
          expect(segment[0]).toBeGreaterThanOrEqual(0);
          expect(segment[1]).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  describe('getInstructionsForGate (Story 6.10 - Circuit-to-Code)', () => {
    // Gate ID constants from circuit.json (documented for reference):
    // DECODER_INVERTERS: [4, 5, 6, 7] (DEC_NOT0-3) - used by all 16 instructions
    // ACCUMULATOR_GATES: [142, 143, 144, 145] (ACC0-3) - used by most instructions
    // ALU_A_GATES: [27, 28, 29, 30] (ALU_A0-3) - used by arithmetic/logic operations
    // PC_GATES: [159, 160, 161, 162, 163, 164, 165, 166] (PC0-7) - used by jumps
    // CTRL_HALT: 111 - used by HLT
    // ZERO_FLAG: 146 - used by operations that affect zero flag

    it('should return opcodes for decoder inverter gates (used by all instructions)', () => {
      // Decoder inverter gate 4 is used by all 16 instructions
      const opcodes = getInstructionsForGate(4);
      expect(opcodes.length).toBe(16);
      expect(opcodes).toContain('HLT');
      expect(opcodes).toContain('LDA');
      expect(opcodes).toContain('ADD');
      expect(opcodes).toContain('JMP');
    });

    it('should return opcodes for ALU A input gates (arithmetic/logic operations)', () => {
      // ALU_A0 (gate 27) is used by: ADD, SUB, AND, OR, XOR, NOT, SHL, SHR, INC, DEC
      const opcodes = getInstructionsForGate(27);
      expect(opcodes.length).toBeGreaterThan(0);
      expect(opcodes).toContain('ADD');
      expect(opcodes).toContain('SUB');
      expect(opcodes).toContain('AND');
      expect(opcodes).toContain('OR');
      expect(opcodes).toContain('XOR');
      expect(opcodes).toContain('NOT');
      expect(opcodes).toContain('SHL');
      expect(opcodes).toContain('SHR');
      expect(opcodes).toContain('INC');
      expect(opcodes).toContain('DEC');
      // Should NOT include non-ALU instructions
      expect(opcodes).not.toContain('LDA');
      expect(opcodes).not.toContain('STA');
      expect(opcodes).not.toContain('JMP');
    });

    it('should return opcodes for accumulator gates (load/store/ALU operations)', () => {
      // ACC0 (gate 142) is used by: LDA, ADD, SUB, LDI, AND, OR, XOR, NOT, SHL, SHR, INC, DEC
      const opcodes = getInstructionsForGate(142);
      expect(opcodes.length).toBeGreaterThan(0);
      expect(opcodes).toContain('LDA');
      expect(opcodes).toContain('ADD');
      expect(opcodes).toContain('LDI');
      // Should NOT include non-accumulator instructions
      expect(opcodes).not.toContain('STA');
      expect(opcodes).not.toContain('JMP');
      expect(opcodes).not.toContain('HLT');
    });

    it('should return opcodes for program counter gates (jump instructions)', () => {
      // PC0 (gate 159) is used by: JMP, JZ
      const opcodes = getInstructionsForGate(159);
      expect(opcodes.length).toBe(2);
      expect(opcodes).toContain('JMP');
      expect(opcodes).toContain('JZ');
    });

    it('should return opcodes for CTRL_HALT gate (only HLT)', () => {
      // CTRL_HALT (gate 111) is used only by HLT
      const opcodes = getInstructionsForGate(111);
      expect(opcodes.length).toBe(1);
      expect(opcodes).toContain('HLT');
    });

    it('should return opcodes for zero flag gate (conditional and ALU operations)', () => {
      // ZFLAG (gate 146) is used by: ADD, SUB, JZ
      const opcodes = getInstructionsForGate(146);
      expect(opcodes.length).toBeGreaterThan(0);
      expect(opcodes).toContain('ADD');
      expect(opcodes).toContain('SUB');
      expect(opcodes).toContain('JZ');
    });

    it('should return empty array for unknown gate ID', () => {
      const opcodes = getInstructionsForGate(99999);
      expect(opcodes).toEqual([]);
    });

    it('should return empty array for negative gate ID', () => {
      const opcodes = getInstructionsForGate(-1);
      expect(opcodes).toEqual([]);
    });

    it('should return consistent results on multiple calls (caching works)', () => {
      const first = getInstructionsForGate(4);
      const second = getInstructionsForGate(4);
      expect(first).toEqual(second);
      // Verify it's actually returning data
      expect(first.length).toBe(16);
    });

    it('should not have duplicate opcodes in result', () => {
      // All results should have unique opcodes
      for (const gateId of [4, 27, 142, 159]) {
        const opcodes = getInstructionsForGate(gateId);
        const unique = [...new Set(opcodes)];
        expect(opcodes.length).toBe(unique.length);
      }
    });
  });
});
