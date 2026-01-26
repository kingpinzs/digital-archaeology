// src/hdl/HdlParser.test.ts
// Unit tests for HdlParser - HDL to AST parser
// Story 7.6: Implement HDL-to-Circuit Regeneration - Task 5

import { describe, it, expect, beforeEach } from 'vitest';
import { HdlParser } from './HdlParser';

describe('HdlParser', () => {
  let parser: HdlParser;

  beforeEach(() => {
    parser = new HdlParser();
  });

  describe('wire declarations', () => {
    it('should parse simple wire declaration', () => {
      const ast = parser.parse('wire clk');
      expect(ast.wires).toHaveLength(1);
      expect(ast.wires[0].name).toBe('clk');
      expect(ast.wires[0].width).toBe(1);
      expect(ast.wires[0].isInput).toBe(false);
      expect(ast.wires[0].isOutput).toBe(false);
    });

    it('should parse wire with single bit index', () => {
      const ast = parser.parse('wire data[4]');
      expect(ast.wires[0].name).toBe('data');
      expect(ast.wires[0].width).toBe(4);
    });

    it('should parse wire with bit-width range syntax', () => {
      const ast = parser.parse('wire data[7:0]');
      expect(ast.wires[0].name).toBe('data');
      expect(ast.wires[0].width).toBe(8);
    });

    it('should parse wire with bit-width range (3:0)', () => {
      const ast = parser.parse('wire pc[3:0]');
      expect(ast.wires[0].name).toBe('pc');
      expect(ast.wires[0].width).toBe(4);
    });

    it('should parse multiple wire declarations', () => {
      const ast = parser.parse(`
        wire a
        wire b
        wire c[4]
      `);
      expect(ast.wires).toHaveLength(3);
      expect(ast.wires[0].name).toBe('a');
      expect(ast.wires[1].name).toBe('b');
      expect(ast.wires[2].name).toBe('c');
      expect(ast.wires[2].width).toBe(4);
    });

    it('should handle wire names with underscores', () => {
      const ast = parser.parse('wire z_flag');
      expect(ast.wires[0].name).toBe('z_flag');
    });

    it('should handle wire names with numbers', () => {
      const ast = parser.parse('wire acc0');
      expect(ast.wires[0].name).toBe('acc0');
    });

    it('should handle large bit-width wires (32-bit)', () => {
      const ast = parser.parse('wire data[31:0]');
      expect(ast.wires[0].name).toBe('data');
      expect(ast.wires[0].width).toBe(32);
    });

    it('should handle inverted range syntax (low:high becomes negative width)', () => {
      // Note: [0:7] means high=0, low=7, width = 0 - 7 + 1 = -6
      // This is likely invalid HDL but parser doesn't validate ranges
      const ast = parser.parse('wire bad[0:7]');
      expect(ast.wires[0].width).toBe(-6);
    });

    it('should handle single-bit range [0:0]', () => {
      const ast = parser.parse('wire flag[0:0]');
      expect(ast.wires[0].width).toBe(1);
    });

    it('should handle direct width specification', () => {
      const ast = parser.parse('wire bus[16]');
      expect(ast.wires[0].width).toBe(16);
    });
  });

  describe('gate instantiations', () => {
    it('should parse AND gate instantiation', () => {
      const ast = parser.parse(`
        wire a
        wire b
        wire c
        and g1 (input: a, b; output: c)
      `);
      expect(ast.gates).toHaveLength(1);
      expect(ast.gates[0].type).toBe('and');
      expect(ast.gates[0].name).toBe('g1');
      expect(ast.gates[0].inputs).toHaveLength(2);
      expect(ast.gates[0].inputs[0]).toEqual({ wire: 'a', bit: 0 });
      expect(ast.gates[0].inputs[1]).toEqual({ wire: 'b', bit: 0 });
      expect(ast.gates[0].outputs).toHaveLength(1);
      expect(ast.gates[0].outputs[0]).toEqual({ wire: 'c', bit: 0 });
    });

    it('should parse OR gate instantiation', () => {
      const ast = parser.parse(`
        wire x
        wire y
        wire z
        or gate1 (input: x, y; output: z)
      `);
      expect(ast.gates[0].type).toBe('or');
      expect(ast.gates[0].name).toBe('gate1');
    });

    it('should parse XOR gate instantiation', () => {
      const ast = parser.parse(`
        wire a
        wire b
        wire out
        xor x1 (input: a, b; output: out)
      `);
      expect(ast.gates[0].type).toBe('xor');
    });

    it('should parse NOT gate instantiation', () => {
      const ast = parser.parse(`
        wire in
        wire out
        not inv1 (input: in; output: out)
      `);
      expect(ast.gates[0].type).toBe('not');
      expect(ast.gates[0].inputs).toHaveLength(1);
    });

    it('should parse BUF gate instantiation', () => {
      const ast = parser.parse(`
        wire in
        wire out
        buf b1 (input: in; output: out)
      `);
      expect(ast.gates[0].type).toBe('buf');
    });

    it('should parse DFF gate instantiation', () => {
      const ast = parser.parse(`
        wire d
        wire clk
        wire q
        dff ff1 (input: d, clk; output: q)
      `);
      expect(ast.gates[0].type).toBe('dff');
      expect(ast.gates[0].inputs).toHaveLength(2);
    });

    it('should parse NAND gate instantiation', () => {
      const ast = parser.parse(`
        wire a
        wire b
        wire out
        nand n1 (input: a, b; output: out)
      `);
      expect(ast.gates[0].type).toBe('nand');
    });

    it('should parse NOR gate instantiation', () => {
      const ast = parser.parse(`
        wire a
        wire b
        wire out
        nor n1 (input: a, b; output: out)
      `);
      expect(ast.gates[0].type).toBe('nor');
    });

    it('should parse MUX gate instantiation', () => {
      const ast = parser.parse(`
        wire sel
        wire a
        wire b
        wire out
        mux m1 (input: sel, a, b; output: out)
      `);
      expect(ast.gates[0].type).toBe('mux');
      expect(ast.gates[0].inputs).toHaveLength(3);
    });

    it('should parse LATCH gate instantiation', () => {
      const ast = parser.parse(`
        wire d
        wire en
        wire q
        latch l1 (input: d, en; output: q)
      `);
      expect(ast.gates[0].type).toBe('latch');
    });
  });

  describe('multi-input gates', () => {
    it('should parse 3-input AND gate', () => {
      const ast = parser.parse(`
        wire a
        wire b
        wire c
        wire out
        and a3 (input: a, b, c; output: out)
      `);
      expect(ast.gates[0].inputs).toHaveLength(3);
    });

    it('should parse 4-input OR gate', () => {
      const ast = parser.parse(`
        wire a
        wire b
        wire c
        wire d
        wire out
        or o4 (input: a, b, c, d; output: out)
      `);
      expect(ast.gates[0].inputs).toHaveLength(4);
    });
  });

  describe('bit-indexed wire references', () => {
    it('should parse bit-indexed input references', () => {
      const ast = parser.parse(`
        wire bus[8]
        wire out
        and g1 (input: bus[0], bus[1]; output: out)
      `);
      expect(ast.gates[0].inputs[0]).toEqual({ wire: 'bus', bit: 0 });
      expect(ast.gates[0].inputs[1]).toEqual({ wire: 'bus', bit: 1 });
    });

    it('should parse bit-indexed output references', () => {
      const ast = parser.parse(`
        wire a
        wire b
        wire out[4]
        and g1 (input: a, b; output: out[2])
      `);
      expect(ast.gates[0].outputs[0]).toEqual({ wire: 'out', bit: 2 });
    });

    it('should parse mixed plain and bit-indexed references', () => {
      const ast = parser.parse(`
        wire clk
        wire data[8]
        wire result
        and g1 (input: clk, data[3]; output: result)
      `);
      expect(ast.gates[0].inputs[0]).toEqual({ wire: 'clk', bit: 0 });
      expect(ast.gates[0].inputs[1]).toEqual({ wire: 'data', bit: 3 });
    });
  });

  describe('comments and whitespace', () => {
    it('should skip comment lines', () => {
      const ast = parser.parse(`
        # This is a comment
        wire clk
        # Another comment
        wire data
      `);
      expect(ast.wires).toHaveLength(2);
    });

    it('should handle empty lines', () => {
      const ast = parser.parse(`
        wire a

        wire b


        wire c
      `);
      expect(ast.wires).toHaveLength(3);
    });

    it('should handle leading/trailing whitespace on lines', () => {
      const ast = parser.parse('   wire clk   ');
      expect(ast.wires[0].name).toBe('clk');
    });
  });

  describe('complex HDL content', () => {
    it('should parse a complete simple circuit', () => {
      const hdl = `
        # Simple 2-input AND circuit
        wire in1
        wire in2
        wire out

        and main_gate (input: in1, in2; output: out)
      `;
      const ast = parser.parse(hdl);
      expect(ast.wires).toHaveLength(3);
      expect(ast.gates).toHaveLength(1);
    });

    it('should parse circuit with multiple gates', () => {
      const hdl = `
        wire a
        wire b
        wire c
        wire d
        wire temp
        wire out

        and g1 (input: a, b; output: temp)
        or g2 (input: temp, c; output: out)
      `;
      const ast = parser.parse(hdl);
      expect(ast.wires).toHaveLength(6);
      expect(ast.gates).toHaveLength(2);
    });

    it('should preserve wire declaration order', () => {
      const ast = parser.parse(`
        wire z
        wire a
        wire m
      `);
      expect(ast.wires[0].name).toBe('z');
      expect(ast.wires[1].name).toBe('a');
      expect(ast.wires[2].name).toBe('m');
    });

    it('should preserve gate declaration order', () => {
      const ast = parser.parse(`
        wire a
        wire b
        wire c
        wire d
        and first (input: a, b; output: c)
        or second (input: c, a; output: d)
      `);
      expect(ast.gates[0].name).toBe('first');
      expect(ast.gates[1].name).toBe('second');
    });
  });

  describe('error handling', () => {
    it('should return empty arrays for empty content', () => {
      const ast = parser.parse('');
      expect(ast.wires).toHaveLength(0);
      expect(ast.gates).toHaveLength(0);
      expect(ast.errors).toHaveLength(0);
    });

    it('should return empty arrays for comments-only content', () => {
      const ast = parser.parse(`
        # Comment 1
        # Comment 2
      `);
      expect(ast.wires).toHaveLength(0);
      expect(ast.gates).toHaveLength(0);
    });

    it('should collect parse errors for invalid syntax', () => {
      const ast = parser.parse('invalid line here');
      expect(ast.errors).toBeDefined();
      expect(ast.errors.length).toBeGreaterThan(0);
    });

    it('should continue parsing after encountering an error', () => {
      const ast = parser.parse(`
        wire valid1
        invalid garbage
        wire valid2
      `);
      // Should still parse the valid wires
      expect(ast.wires).toHaveLength(2);
      expect(ast.errors.length).toBeGreaterThan(0);
    });

    it('should report line numbers in parse errors', () => {
      const ast = parser.parse(`
        wire a
        bad syntax here
        wire b
      `);
      expect(ast.errors[0].line).toBe(3);
    });
  });

  describe('case insensitivity', () => {
    it('should parse WIRE keyword case-insensitively', () => {
      const ast = parser.parse('WIRE clk');
      expect(ast.wires).toHaveLength(1);
      expect(ast.wires[0].name).toBe('clk');
    });

    it('should parse Wire keyword case-insensitively', () => {
      const ast = parser.parse('Wire data');
      expect(ast.wires).toHaveLength(1);
    });

    it('should parse gate type case-insensitively', () => {
      const ast = parser.parse(`
        wire a
        wire b
        wire c
        AND g1 (input: a, b; output: c)
      `);
      expect(ast.gates[0].type).toBe('and');
    });
  });
});
