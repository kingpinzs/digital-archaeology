// src/hdl/HdlToCircuitGenerator.test.ts
// Unit tests for HdlToCircuitGenerator - AST to CircuitData generator
// Story 7.6: Implement HDL-to-Circuit Regeneration - Task 6

import { describe, it, expect, beforeEach } from 'vitest';
import { HdlToCircuitGenerator } from './HdlToCircuitGenerator';
import { HdlAst, HdlWireNode, HdlGateNode } from './HdlParser';
import { CircuitData, CircuitWire, CircuitGate } from '../visualizer/types';

describe('HdlToCircuitGenerator', () => {
  let generator: HdlToCircuitGenerator;

  beforeEach(() => {
    generator = new HdlToCircuitGenerator();
  });

  describe('wire generation', () => {
    it('should generate CircuitWire from simple HdlWireNode', () => {
      const ast: HdlAst = {
        wires: [{ name: 'clk', width: 1, isInput: false, isOutput: false }],
        gates: [],
        errors: [],
      };
      const circuit = generator.generate(ast);

      expect(circuit.wires).toHaveLength(1);
      expect(circuit.wires[0]).toMatchObject({
        name: 'clk',
        width: 1,
        is_input: false,
        is_output: false,
      });
    });

    it('should assign sequential numeric IDs to wires', () => {
      const ast: HdlAst = {
        wires: [
          { name: 'a', width: 1, isInput: false, isOutput: false },
          { name: 'b', width: 1, isInput: false, isOutput: false },
          { name: 'c', width: 1, isInput: false, isOutput: false },
        ],
        gates: [],
        errors: [],
      };
      const circuit = generator.generate(ast);

      expect(circuit.wires[0].id).toBe(0);
      expect(circuit.wires[1].id).toBe(1);
      expect(circuit.wires[2].id).toBe(2);
    });

    it('should initialize wire state array with zeros matching width', () => {
      const ast: HdlAst = {
        wires: [{ name: 'data', width: 4, isInput: false, isOutput: false }],
        gates: [],
        errors: [],
      };
      const circuit = generator.generate(ast);

      expect(circuit.wires[0].state).toEqual([0, 0, 0, 0]);
    });

    it('should handle 8-bit wire state', () => {
      const ast: HdlAst = {
        wires: [{ name: 'byte', width: 8, isInput: false, isOutput: false }],
        gates: [],
        errors: [],
      };
      const circuit = generator.generate(ast);

      expect(circuit.wires[0].state).toHaveLength(8);
      expect(circuit.wires[0].state.every((v) => v === 0)).toBe(true);
    });

    it('should preserve input/output flags', () => {
      const ast: HdlAst = {
        wires: [
          { name: 'in', width: 1, isInput: true, isOutput: false },
          { name: 'out', width: 1, isInput: false, isOutput: true },
        ],
        gates: [],
        errors: [],
      };
      const circuit = generator.generate(ast);

      expect(circuit.wires[0].is_input).toBe(true);
      expect(circuit.wires[0].is_output).toBe(false);
      expect(circuit.wires[1].is_input).toBe(false);
      expect(circuit.wires[1].is_output).toBe(true);
    });
  });

  describe('gate generation', () => {
    it('should generate CircuitGate from HdlGateNode', () => {
      const ast: HdlAst = {
        wires: [
          { name: 'a', width: 1, isInput: false, isOutput: false },
          { name: 'b', width: 1, isInput: false, isOutput: false },
          { name: 'c', width: 1, isInput: false, isOutput: false },
        ],
        gates: [
          {
            type: 'and',
            name: 'g1',
            inputs: [
              { wire: 'a', bit: 0 },
              { wire: 'b', bit: 0 },
            ],
            outputs: [{ wire: 'c', bit: 0 }],
          },
        ],
        errors: [],
      };
      const circuit = generator.generate(ast);

      expect(circuit.gates).toHaveLength(1);
      expect(circuit.gates[0].name).toBe('g1');
      expect(circuit.gates[0].type).toBe('AND');
    });

    it('should assign sequential numeric IDs to gates', () => {
      const ast: HdlAst = {
        wires: [
          { name: 'a', width: 1, isInput: false, isOutput: false },
          { name: 'b', width: 1, isInput: false, isOutput: false },
          { name: 'c', width: 1, isInput: false, isOutput: false },
          { name: 'd', width: 1, isInput: false, isOutput: false },
        ],
        gates: [
          {
            type: 'and',
            name: 'g1',
            inputs: [{ wire: 'a', bit: 0 }, { wire: 'b', bit: 0 }],
            outputs: [{ wire: 'c', bit: 0 }],
          },
          {
            type: 'or',
            name: 'g2',
            inputs: [{ wire: 'c', bit: 0 }, { wire: 'a', bit: 0 }],
            outputs: [{ wire: 'd', bit: 0 }],
          },
        ],
        errors: [],
      };
      const circuit = generator.generate(ast);

      expect(circuit.gates[0].id).toBe(0);
      expect(circuit.gates[1].id).toBe(1);
    });

    it('should convert gate type to uppercase', () => {
      const ast: HdlAst = {
        wires: [
          { name: 'a', width: 1, isInput: false, isOutput: false },
          { name: 'b', width: 1, isInput: false, isOutput: false },
        ],
        gates: [
          {
            type: 'xor',
            name: 'x1',
            inputs: [{ wire: 'a', bit: 0 }],
            outputs: [{ wire: 'b', bit: 0 }],
          },
        ],
        errors: [],
      };
      const circuit = generator.generate(ast);

      expect(circuit.gates[0].type).toBe('XOR');
    });

    it('should wire gate inputs to correct wire IDs', () => {
      const ast: HdlAst = {
        wires: [
          { name: 'alpha', width: 1, isInput: false, isOutput: false },
          { name: 'beta', width: 1, isInput: false, isOutput: false },
          { name: 'gamma', width: 1, isInput: false, isOutput: false },
        ],
        gates: [
          {
            type: 'and',
            name: 'g1',
            inputs: [
              { wire: 'alpha', bit: 0 },
              { wire: 'beta', bit: 0 },
            ],
            outputs: [{ wire: 'gamma', bit: 0 }],
          },
        ],
        errors: [],
      };
      const circuit = generator.generate(ast);

      // alpha is wire 0, beta is wire 1
      expect(circuit.gates[0].inputs[0]).toEqual({ wire: 0, bit: 0 });
      expect(circuit.gates[0].inputs[1]).toEqual({ wire: 1, bit: 0 });
    });

    it('should wire gate outputs to correct wire IDs', () => {
      const ast: HdlAst = {
        wires: [
          { name: 'a', width: 1, isInput: false, isOutput: false },
          { name: 'b', width: 1, isInput: false, isOutput: false },
          { name: 'result', width: 1, isInput: false, isOutput: false },
        ],
        gates: [
          {
            type: 'or',
            name: 'g1',
            inputs: [{ wire: 'a', bit: 0 }, { wire: 'b', bit: 0 }],
            outputs: [{ wire: 'result', bit: 0 }],
          },
        ],
        errors: [],
      };
      const circuit = generator.generate(ast);

      // result is wire 2
      expect(circuit.gates[0].outputs[0]).toEqual({ wire: 2, bit: 0 });
    });

    it('should handle bit-indexed wire references in gates', () => {
      const ast: HdlAst = {
        wires: [
          { name: 'bus', width: 4, isInput: false, isOutput: false },
          { name: 'out', width: 1, isInput: false, isOutput: false },
        ],
        gates: [
          {
            type: 'and',
            name: 'g1',
            inputs: [
              { wire: 'bus', bit: 0 },
              { wire: 'bus', bit: 1 },
            ],
            outputs: [{ wire: 'out', bit: 0 }],
          },
        ],
        errors: [],
      };
      const circuit = generator.generate(ast);

      expect(circuit.gates[0].inputs[0]).toEqual({ wire: 0, bit: 0 });
      expect(circuit.gates[0].inputs[1]).toEqual({ wire: 0, bit: 1 });
    });
  });

  describe('gate type mapping', () => {
    const gateTypes = ['and', 'or', 'xor', 'not', 'buf', 'dff', 'nand', 'nor', 'mux', 'latch'];

    gateTypes.forEach((gateType) => {
      it(`should convert ${gateType} to uppercase ${gateType.toUpperCase()}`, () => {
        const ast: HdlAst = {
          wires: [
            { name: 'a', width: 1, isInput: false, isOutput: false },
            { name: 'b', width: 1, isInput: false, isOutput: false },
          ],
          gates: [
            {
              type: gateType,
              name: 'g1',
              inputs: [{ wire: 'a', bit: 0 }],
              outputs: [{ wire: 'b', bit: 0 }],
            },
          ],
          errors: [],
        };
        const circuit = generator.generate(ast);

        expect(circuit.gates[0].type).toBe(gateType.toUpperCase());
      });
    });
  });

  describe('DFF gates', () => {
    it('should initialize stored value for DFF gates', () => {
      const ast: HdlAst = {
        wires: [
          { name: 'd', width: 1, isInput: false, isOutput: false },
          { name: 'clk', width: 1, isInput: false, isOutput: false },
          { name: 'q', width: 1, isInput: false, isOutput: false },
        ],
        gates: [
          {
            type: 'dff',
            name: 'ff1',
            inputs: [
              { wire: 'd', bit: 0 },
              { wire: 'clk', bit: 0 },
            ],
            outputs: [{ wire: 'q', bit: 0 }],
          },
        ],
        errors: [],
      };
      const circuit = generator.generate(ast);

      expect(circuit.gates[0].stored).toBe(0);
    });

    it('should not set stored for non-DFF gates', () => {
      const ast: HdlAst = {
        wires: [
          { name: 'a', width: 1, isInput: false, isOutput: false },
          { name: 'b', width: 1, isInput: false, isOutput: false },
        ],
        gates: [
          {
            type: 'and',
            name: 'g1',
            inputs: [{ wire: 'a', bit: 0 }],
            outputs: [{ wire: 'b', bit: 0 }],
          },
        ],
        errors: [],
      };
      const circuit = generator.generate(ast);

      expect(circuit.gates[0].stored).toBeUndefined();
    });
  });

  describe('CircuitData structure', () => {
    it('should set cycle to 0 for new circuits', () => {
      const ast: HdlAst = { wires: [], gates: [], errors: [] };
      const circuit = generator.generate(ast);

      expect(circuit.cycle).toBe(0);
    });

    it('should set stable to true for new circuits', () => {
      const ast: HdlAst = { wires: [], gates: [], errors: [] };
      const circuit = generator.generate(ast);

      expect(circuit.stable).toBe(true);
    });

    it('should produce valid CircuitData structure', () => {
      const ast: HdlAst = {
        wires: [
          { name: 'in1', width: 1, isInput: true, isOutput: false },
          { name: 'in2', width: 1, isInput: true, isOutput: false },
          { name: 'out', width: 1, isInput: false, isOutput: true },
        ],
        gates: [
          {
            type: 'and',
            name: 'main',
            inputs: [
              { wire: 'in1', bit: 0 },
              { wire: 'in2', bit: 0 },
            ],
            outputs: [{ wire: 'out', bit: 0 }],
          },
        ],
        errors: [],
      };
      const circuit = generator.generate(ast);

      // Verify structure matches CircuitData type
      expect(typeof circuit.cycle).toBe('number');
      expect(typeof circuit.stable).toBe('boolean');
      expect(Array.isArray(circuit.wires)).toBe(true);
      expect(Array.isArray(circuit.gates)).toBe(true);

      // Verify wire structure
      const wire = circuit.wires[0];
      expect(typeof wire.id).toBe('number');
      expect(typeof wire.name).toBe('string');
      expect(typeof wire.width).toBe('number');
      expect(typeof wire.is_input).toBe('boolean');
      expect(typeof wire.is_output).toBe('boolean');
      expect(Array.isArray(wire.state)).toBe(true);

      // Verify gate structure
      const gate = circuit.gates[0];
      expect(typeof gate.id).toBe('number');
      expect(typeof gate.name).toBe('string');
      expect(typeof gate.type).toBe('string');
      expect(Array.isArray(gate.inputs)).toBe(true);
      expect(Array.isArray(gate.outputs)).toBe(true);
    });
  });

  describe('empty AST', () => {
    it('should handle empty AST gracefully', () => {
      const ast: HdlAst = { wires: [], gates: [], errors: [] };
      const circuit = generator.generate(ast);

      expect(circuit.wires).toHaveLength(0);
      expect(circuit.gates).toHaveLength(0);
      expect(circuit.cycle).toBe(0);
      expect(circuit.stable).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should throw error when gate references undefined wire', () => {
      const ast: HdlAst = {
        wires: [
          { name: 'a', width: 1, isInput: false, isOutput: false },
        ],
        gates: [
          {
            type: 'and',
            name: 'g1',
            inputs: [
              { wire: 'a', bit: 0 },
              { wire: 'undefined_wire', bit: 0 }, // This wire doesn't exist
            ],
            outputs: [{ wire: 'a', bit: 0 }],
          },
        ],
        errors: [],
      };

      expect(() => generator.generate(ast)).toThrow('Undefined wire reference');
      expect(() => generator.generate(ast)).toThrow('undefined_wire');
    });

    it('should throw error when gate output references undefined wire', () => {
      const ast: HdlAst = {
        wires: [
          { name: 'a', width: 1, isInput: false, isOutput: false },
          { name: 'b', width: 1, isInput: false, isOutput: false },
        ],
        gates: [
          {
            type: 'and',
            name: 'g1',
            inputs: [
              { wire: 'a', bit: 0 },
              { wire: 'b', bit: 0 },
            ],
            outputs: [{ wire: 'nonexistent', bit: 0 }], // Output wire doesn't exist
          },
        ],
        errors: [],
      };

      expect(() => generator.generate(ast)).toThrow('Undefined wire reference');
      expect(() => generator.generate(ast)).toThrow('nonexistent');
    });
  });

  describe('complex circuits', () => {
    it('should generate a complete simple circuit', () => {
      const ast: HdlAst = {
        wires: [
          { name: 'a', width: 1, isInput: true, isOutput: false },
          { name: 'b', width: 1, isInput: true, isOutput: false },
          { name: 'c', width: 1, isInput: true, isOutput: false },
          { name: 'temp', width: 1, isInput: false, isOutput: false },
          { name: 'result', width: 1, isInput: false, isOutput: true },
        ],
        gates: [
          {
            type: 'and',
            name: 'g1',
            inputs: [
              { wire: 'a', bit: 0 },
              { wire: 'b', bit: 0 },
            ],
            outputs: [{ wire: 'temp', bit: 0 }],
          },
          {
            type: 'or',
            name: 'g2',
            inputs: [
              { wire: 'temp', bit: 0 },
              { wire: 'c', bit: 0 },
            ],
            outputs: [{ wire: 'result', bit: 0 }],
          },
        ],
        errors: [],
      };
      const circuit = generator.generate(ast);

      expect(circuit.wires).toHaveLength(5);
      expect(circuit.gates).toHaveLength(2);

      // Verify wiring is correct
      // g1 inputs: a (wire 0), b (wire 1)
      expect(circuit.gates[0].inputs[0].wire).toBe(0);
      expect(circuit.gates[0].inputs[1].wire).toBe(1);
      // g1 output: temp (wire 3)
      expect(circuit.gates[0].outputs[0].wire).toBe(3);

      // g2 inputs: temp (wire 3), c (wire 2)
      expect(circuit.gates[1].inputs[0].wire).toBe(3);
      expect(circuit.gates[1].inputs[1].wire).toBe(2);
      // g2 output: result (wire 4)
      expect(circuit.gates[1].outputs[0].wire).toBe(4);
    });
  });
});
