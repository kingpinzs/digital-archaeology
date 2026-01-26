// src/hdl/HdlValidator.test.ts
// Unit tests for HDL Validator
// Story 7.4: Implement HDL Validation

import { describe, it, expect } from 'vitest';
import {
  HdlValidator,
  HdlValidationResult,
  HdlValidationError,
  HdlValidationSeverity,
} from './HdlValidator';

describe('HdlValidator', () => {
  describe('interface types', () => {
    it('should export HdlValidationResult interface', () => {
      const result: HdlValidationResult = {
        valid: true,
        errors: [],
        warnings: [],
      };
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should export HdlValidationError interface', () => {
      const error: HdlValidationError = {
        line: 1,
        column: 5,
        message: 'Test error',
        severity: 'error',
      };
      expect(error.line).toBe(1);
      expect(error.column).toBe(5);
      expect(error.message).toBe('Test error');
      expect(error.severity).toBe('error');
    });

    it('should export HdlValidationSeverity type', () => {
      const errorSeverity: HdlValidationSeverity = 'error';
      const warningSeverity: HdlValidationSeverity = 'warning';
      expect(errorSeverity).toBe('error');
      expect(warningSeverity).toBe('warning');
    });
  });

  describe('validate method', () => {
    it('should return valid for empty content', () => {
      const validator = new HdlValidator();
      const result = validator.validate('');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return valid for comments only', () => {
      const validator = new HdlValidator();
      const result = validator.validate('# This is a comment\n# Another comment');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return valid for correct wire declaration', () => {
      const validator = new HdlValidator();
      const result = validator.validate('wire a');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return valid for wire with bit width', () => {
      const validator = new HdlValidator();
      const result = validator.validate('wire databus[7:0]');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return valid for correct gate instantiation', () => {
      const validator = new HdlValidator();
      const hdl = `wire a
wire b
wire c
and myGate (input: a, b; output: c)`;
      const result = validator.validate(hdl);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return valid for NOT gate with single input', () => {
      const validator = new HdlValidator();
      const hdl = `wire in1
wire out1
not inverter (input: in1; output: out1)`;
      const result = validator.validate(hdl);
      expect(result.valid).toBe(true);
    });

    it('should return valid for MUX gate with correct inputs', () => {
      const validator = new HdlValidator();
      const hdl = `wire sel
wire a
wire b
wire result
mux myMux (input: sel, a, b; output: result)`;
      const result = validator.validate(hdl);
      expect(result.valid).toBe(true);
    });
  });

  describe('error detection - undefined wires', () => {
    it('should detect undefined wire in gate input', () => {
      const validator = new HdlValidator();
      const hdl = `wire a
and g1 (input: a, undefined_wire; output: c)`;
      const result = validator.validate(hdl);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.message.includes('undefined_wire'))).toBe(true);
    });

    it('should detect undefined wire in gate output', () => {
      const validator = new HdlValidator();
      const hdl = `wire a
wire b
and g1 (input: a, b; output: undefined_output)`;
      const result = validator.validate(hdl);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('undefined_output'))).toBe(true);
    });

    it('should include line number for undefined wire error', () => {
      const validator = new HdlValidator();
      const hdl = `wire a
and g1 (input: a, bad; output: c)`;
      const result = validator.validate(hdl);
      expect(result.errors[0].line).toBe(2);
    });
  });

  describe('error detection - duplicate names', () => {
    it('should detect duplicate wire names', () => {
      const validator = new HdlValidator();
      const hdl = `wire a
wire a`;
      const result = validator.validate(hdl);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.toLowerCase().includes('duplicate'))).toBe(true);
    });

    it('should detect duplicate gate names', () => {
      const validator = new HdlValidator();
      const hdl = `wire a
wire b
wire c
wire d
and myGate (input: a, b; output: c)
or myGate (input: a, b; output: d)`;
      const result = validator.validate(hdl);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('myGate'))).toBe(true);
    });
  });

  describe('error detection - gate port counts', () => {
    it('should detect NOT gate with too many inputs', () => {
      const validator = new HdlValidator();
      const hdl = `wire a
wire b
wire c
not badNot (input: a, b; output: c)`;
      const result = validator.validate(hdl);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.toLowerCase().includes('input'))).toBe(true);
    });

    it('should detect AND gate with only one input', () => {
      const validator = new HdlValidator();
      const hdl = `wire a
wire c
and badAnd (input: a; output: c)`;
      const result = validator.validate(hdl);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.toLowerCase().includes('input'))).toBe(true);
    });

    it('should detect MUX with wrong number of inputs', () => {
      const validator = new HdlValidator();
      const hdl = `wire a
wire b
wire c
mux badMux (input: a, b; output: c)`;
      const result = validator.validate(hdl);
      expect(result.valid).toBe(false);
    });
  });

  describe('error detection - syntax errors', () => {
    it('should detect unmatched parentheses', () => {
      const validator = new HdlValidator();
      const hdl = `wire a
wire b
wire c
and g1 (input: a, b; output: c`;
      const result = validator.validate(hdl);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e =>
        e.message.toLowerCase().includes('parenthes') ||
        e.message.toLowerCase().includes('unmatched')
      )).toBe(true);
    });

    it('should detect unmatched brackets', () => {
      const validator = new HdlValidator();
      const hdl = `wire bus[7:0`;
      const result = validator.validate(hdl);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e =>
        e.message.toLowerCase().includes('bracket') ||
        e.message.toLowerCase().includes('unmatched')
      )).toBe(true);
    });

    it('should detect invalid gate type', () => {
      const validator = new HdlValidator();
      const hdl = `wire a
wire b
wire c
invalidgate g1 (input: a, b; output: c)`;
      const result = validator.validate(hdl);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.toLowerCase().includes('unknown') || e.message.toLowerCase().includes('invalid'))).toBe(true);
    });
  });

  describe('warnings', () => {
    it('should warn about unused wires', () => {
      const validator = new HdlValidator();
      const hdl = `wire a
wire unused_wire
wire c
not g1 (input: a; output: c)`;
      const result = validator.validate(hdl);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.message.includes('unused_wire'))).toBe(true);
    });
  });

  describe('line and column tracking', () => {
    it('should report correct line number for errors', () => {
      const validator = new HdlValidator();
      const hdl = `wire a
wire b
wire c
badgate g1 (input: a, b; output: c)`;
      const result = validator.validate(hdl);
      expect(result.errors[0].line).toBe(4);
    });

    it('should report column 1 for line-level errors', () => {
      const validator = new HdlValidator();
      const hdl = `badgate g1 (input: a; output: b)`;
      const result = validator.validate(hdl);
      expect(result.errors[0].column).toBeGreaterThanOrEqual(1);
    });
  });

  describe('complex HDL files', () => {
    it('should validate a complete small circuit', () => {
      const validator = new HdlValidator();
      const hdl = `# Half Adder Circuit
wire a
wire b
wire sum
wire carry

xor xor1 (input: a, b; output: sum)
and and1 (input: a, b; output: carry)`;
      const result = validator.validate(hdl);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate circuit with multiple gates of same type', () => {
      const validator = new HdlValidator();
      const hdl = `wire a
wire b
wire c
wire d
wire out1
wire out2

and gate1 (input: a, b; output: out1)
and gate2 (input: c, d; output: out2)`;
      const result = validator.validate(hdl);
      expect(result.valid).toBe(true);
    });
  });
});
