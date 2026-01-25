// src/visualizer/signalFormatters.test.ts
// Unit tests for signal formatting utilities (Story 6.11)

import { describe, it, expect } from 'vitest';
import {
  formatSignalLabel,
  stateToBinary,
  stateToDecimal,
  decimalToHex,
  formatWireValue,
  statesEqual,
} from './signalFormatters';
import type { CircuitWire } from './types';

describe('signalFormatters (Story 6.11)', () => {
  describe('formatSignalLabel', () => {
    it('should map pc to PC', () => {
      expect(formatSignalLabel('pc')).toBe('PC');
    });

    it('should map acc to ACC', () => {
      expect(formatSignalLabel('acc')).toBe('ACC');
    });

    it('should map mar to MAR', () => {
      expect(formatSignalLabel('mar')).toBe('MAR');
    });

    it('should map mdr to MDR', () => {
      expect(formatSignalLabel('mdr')).toBe('MDR');
    });

    it('should map ir to IR', () => {
      expect(formatSignalLabel('ir')).toBe('IR');
    });

    it('should map opcode to OP', () => {
      expect(formatSignalLabel('opcode')).toBe('OP');
    });

    it('should map z_flag to ZF', () => {
      expect(formatSignalLabel('z_flag')).toBe('ZF');
    });

    it('should map control signals correctly', () => {
      expect(formatSignalLabel('pc_load')).toBe('PC_LD');
      expect(formatSignalLabel('acc_load')).toBe('ACC_LD');
      expect(formatSignalLabel('ir_load')).toBe('IR_LD');
    });

    it('should uppercase unknown wire names', () => {
      expect(formatSignalLabel('custom_signal')).toBe('CUSTOM_SIGNAL');
      expect(formatSignalLabel('test')).toBe('TEST');
    });
  });

  describe('stateToBinary', () => {
    it('should convert single bit 0 to "0"', () => {
      expect(stateToBinary([0])).toBe('0');
    });

    it('should convert single bit 1 to "1"', () => {
      expect(stateToBinary([1])).toBe('1');
    });

    it('should convert undefined bit (2) to "X"', () => {
      expect(stateToBinary([2])).toBe('X');
    });

    it('should convert 4-bit state array', () => {
      expect(stateToBinary([1, 0, 1, 0])).toBe('1010');
      expect(stateToBinary([0, 0, 0, 0])).toBe('0000');
      expect(stateToBinary([1, 1, 1, 1])).toBe('1111');
    });

    it('should convert 8-bit state array', () => {
      expect(stateToBinary([0, 0, 0, 0, 0, 0, 1, 0])).toBe('00000010');
      expect(stateToBinary([1, 1, 1, 1, 1, 1, 1, 1])).toBe('11111111');
    });

    it('should handle mixed undefined bits', () => {
      expect(stateToBinary([2, 0, 1, 0])).toBe('X010');
      expect(stateToBinary([2, 2, 2, 2])).toBe('XXXX');
    });
  });

  describe('stateToDecimal', () => {
    it('should convert single bit 0 to 0', () => {
      expect(stateToDecimal([0])).toBe(0);
    });

    it('should convert single bit 1 to 1', () => {
      expect(stateToDecimal([1])).toBe(1);
    });

    it('should return null for undefined bit', () => {
      expect(stateToDecimal([2])).toBeNull();
    });

    it('should convert 4-bit binary to decimal (LSB first)', () => {
      // [1,0,1,0] = bit0=1, bit1=0, bit2=1, bit3=0 = 1 + 0 + 4 + 0 = 5
      expect(stateToDecimal([1, 0, 1, 0])).toBe(5);
      // [0,0,0,0] = 0
      expect(stateToDecimal([0, 0, 0, 0])).toBe(0);
      // [1,1,1,1] = 1 + 2 + 4 + 8 = 15
      expect(stateToDecimal([1, 1, 1, 1])).toBe(15);
    });

    it('should convert 8-bit binary to decimal (LSB first)', () => {
      // [0,1,0,0,0,0,0,0] = bit1=1 = 2
      expect(stateToDecimal([0, 1, 0, 0, 0, 0, 0, 0])).toBe(2);
      // [1,1,1,1,1,1,1,1] = 255
      expect(stateToDecimal([1, 1, 1, 1, 1, 1, 1, 1])).toBe(255);
    });

    it('should return null if any bit is undefined', () => {
      expect(stateToDecimal([2, 0, 1, 0])).toBeNull();
      expect(stateToDecimal([0, 0, 2, 0])).toBeNull();
    });
  });

  describe('decimalToHex', () => {
    it('should convert 0 to 0x0 for 4-bit', () => {
      expect(decimalToHex(0, 4)).toBe('0x0');
    });

    it('should convert 15 to 0xF for 4-bit', () => {
      expect(decimalToHex(15, 4)).toBe('0xF');
    });

    it('should convert 10 to 0xA for 4-bit', () => {
      expect(decimalToHex(10, 4)).toBe('0xA');
    });

    it('should convert 0 to 0x00 for 8-bit', () => {
      expect(decimalToHex(0, 8)).toBe('0x00');
    });

    it('should convert 255 to 0xFF for 8-bit', () => {
      expect(decimalToHex(255, 8)).toBe('0xFF');
    });

    it('should convert 16 to 0x10 for 8-bit', () => {
      expect(decimalToHex(16, 8)).toBe('0x10');
    });

    it('should return ? for null value', () => {
      expect(decimalToHex(null, 4)).toBe('?');
      expect(decimalToHex(null, 8)).toBe('?');
    });
  });

  describe('formatWireValue', () => {
    function makeWire(state: number[], width: number): CircuitWire {
      return {
        id: 1,
        name: 'test',
        width,
        is_input: false,
        is_output: false,
        state,
      };
    }

    it('should format single bit 0 as "0"', () => {
      expect(formatWireValue(makeWire([0], 1))).toBe('0');
    });

    it('should format single bit 1 as "1"', () => {
      expect(formatWireValue(makeWire([1], 1))).toBe('1');
    });

    it('should format single bit undefined as "X"', () => {
      expect(formatWireValue(makeWire([2], 1))).toBe('X');
    });

    it('should format 4-bit wire with binary and hex', () => {
      // [1,0,1,0] = binary 1010, decimal 5, hex 0x5
      expect(formatWireValue(makeWire([1, 0, 1, 0], 4))).toBe('1010 (0x5)');
    });

    it('should format 4-bit wire with all zeros', () => {
      expect(formatWireValue(makeWire([0, 0, 0, 0], 4))).toBe('0000 (0x0)');
    });

    it('should format 8-bit wire with binary and hex', () => {
      // [0,1,0,0,0,0,0,0] = binary 01000000, decimal 2, hex 0x02
      expect(formatWireValue(makeWire([0, 1, 0, 0, 0, 0, 0, 0], 8))).toBe('01000000 (0x02)');
    });

    it('should format multi-bit wire with undefined as X and ?', () => {
      expect(formatWireValue(makeWire([2, 0, 1, 0], 4))).toBe('X010 (?)');
    });

    it('should format all-undefined multi-bit wire', () => {
      expect(formatWireValue(makeWire([2, 2, 2, 2], 4))).toBe('XXXX (?)');
    });
  });

  describe('statesEqual', () => {
    it('should return true for equal single-bit states', () => {
      expect(statesEqual([0], [0])).toBe(true);
      expect(statesEqual([1], [1])).toBe(true);
    });

    it('should return false for different single-bit states', () => {
      expect(statesEqual([0], [1])).toBe(false);
    });

    it('should return true for equal multi-bit states', () => {
      expect(statesEqual([0, 1, 0, 1], [0, 1, 0, 1])).toBe(true);
    });

    it('should return false for different multi-bit states', () => {
      expect(statesEqual([0, 1, 0, 1], [0, 1, 1, 1])).toBe(false);
    });

    it('should return false for different length states', () => {
      expect(statesEqual([0, 1], [0, 1, 0])).toBe(false);
    });

    it('should handle undefined bits', () => {
      expect(statesEqual([2], [2])).toBe(true);
      expect(statesEqual([2], [0])).toBe(false);
    });
  });
});
