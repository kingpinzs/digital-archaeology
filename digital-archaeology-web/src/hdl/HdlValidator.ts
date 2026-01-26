// src/hdl/HdlValidator.ts
// HDL Validator for M4HDL hardware description language
// Story 7.4: Implement HDL Validation

/**
 * Severity level for validation messages.
 */
export type HdlValidationSeverity = 'error' | 'warning';

/**
 * Represents a validation error or warning with location information.
 */
export interface HdlValidationError {
  /** Line number (1-indexed) */
  line: number;
  /** Column number (1-indexed) */
  column: number;
  /** Human-readable error message */
  message: string;
  /** Severity level */
  severity: HdlValidationSeverity;
}

/**
 * Result of HDL validation.
 */
export interface HdlValidationResult {
  /** True if HDL is valid (no errors) */
  valid: boolean;
  /** List of errors found */
  errors: HdlValidationError[];
  /** List of warnings found */
  warnings: HdlValidationError[];
}

/**
 * Gate type definitions with expected port counts.
 */
interface GateDefinition {
  minInputs: number;
  maxInputs: number;
  outputs: number;
}

const GATE_DEFINITIONS: Record<string, GateDefinition> = {
  and: { minInputs: 2, maxInputs: Infinity, outputs: 1 },
  or: { minInputs: 2, maxInputs: Infinity, outputs: 1 },
  xor: { minInputs: 2, maxInputs: Infinity, outputs: 1 },
  not: { minInputs: 1, maxInputs: 1, outputs: 1 },
  buf: { minInputs: 1, maxInputs: 1, outputs: 1 },
  nand: { minInputs: 2, maxInputs: Infinity, outputs: 1 },
  nor: { minInputs: 2, maxInputs: Infinity, outputs: 1 },
  mux: { minInputs: 3, maxInputs: 3, outputs: 1 },
  dff: { minInputs: 2, maxInputs: 2, outputs: 1 },
  latch: { minInputs: 2, maxInputs: 2, outputs: 1 },
};

/**
 * HDL Validator for M4HDL hardware description language.
 * Validates syntax and semantic correctness of HDL content.
 */
export class HdlValidator {
  /**
   * Validate HDL content.
   * @param content - The HDL source code to validate
   * @returns Validation result with errors and warnings
   */
  validate(content: string): HdlValidationResult {
    const errors: HdlValidationError[] = [];
    const warnings: HdlValidationError[] = [];

    // Track declared wires and gates
    const declaredWires = new Map<string, number>(); // wire name -> line number
    const declaredGates = new Map<string, number>(); // gate name -> line number
    const usedWires = new Set<string>();

    const lines = content.split('\n');

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const lineNumber = lineIndex + 1;
      const line = lines[lineIndex];
      const trimmedLine = line.trim();

      // Skip empty lines and comments
      if (trimmedLine === '' || trimmedLine.startsWith('#')) {
        continue;
      }

      // Check for unmatched brackets in wire declarations
      const openBrackets = (trimmedLine.match(/\[/g) || []).length;
      const closeBrackets = (trimmedLine.match(/\]/g) || []).length;
      if (openBrackets !== closeBrackets) {
        errors.push({
          line: lineNumber,
          column: 1,
          message: `Unmatched bracket in line: expected ${openBrackets} closing brackets, found ${closeBrackets}`,
          severity: 'error',
        });
        continue;
      }

      // Check for unmatched parentheses
      const openParens = (trimmedLine.match(/\(/g) || []).length;
      const closeParens = (trimmedLine.match(/\)/g) || []).length;
      if (openParens !== closeParens) {
        errors.push({
          line: lineNumber,
          column: 1,
          message: `Unmatched parenthesis in line: expected ${openParens} closing parentheses, found ${closeParens}`,
          severity: 'error',
        });
        continue;
      }

      // Parse wire declaration: wire name or wire name[bits]
      const wireMatch = trimmedLine.match(/^wire\s+([a-zA-Z_][a-zA-Z0-9_]*)(\[\d+(:\d+)?\])?$/i);
      if (wireMatch) {
        const wireName = wireMatch[1];
        if (declaredWires.has(wireName)) {
          errors.push({
            line: lineNumber,
            column: 1,
            message: `Duplicate wire declaration: '${wireName}' was already declared on line ${declaredWires.get(wireName)}`,
            severity: 'error',
          });
        } else {
          declaredWires.set(wireName, lineNumber);
        }
        continue;
      }

      // Parse gate instantiation: gatetype name (input: wire1, wire2; output: wire3)
      const gateMatch = trimmedLine.match(
        /^([a-zA-Z_][a-zA-Z0-9_]*)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(\s*input:\s*([^;]+);\s*output:\s*([^)]+)\s*\)$/i
      );
      if (gateMatch) {
        const gateType = gateMatch[1].toLowerCase();
        const gateName = gateMatch[2];
        const inputsStr = gateMatch[3];
        const outputsStr = gateMatch[4];

        // Check if gate type is valid
        if (!GATE_DEFINITIONS[gateType]) {
          errors.push({
            line: lineNumber,
            column: 1,
            message: `Unknown gate type: '${gateType}'`,
            severity: 'error',
          });
          continue;
        }

        // Check for duplicate gate names
        if (declaredGates.has(gateName)) {
          errors.push({
            line: lineNumber,
            column: 1,
            message: `Duplicate gate name: '${gateName}' was already declared on line ${declaredGates.get(gateName)}`,
            severity: 'error',
          });
        } else {
          declaredGates.set(gateName, lineNumber);
        }

        // Parse input wires
        const inputWires = inputsStr.split(',').map((w) => w.trim()).filter((w) => w);
        const outputWires = outputsStr.split(',').map((w) => w.trim()).filter((w) => w);

        // Validate input count
        const gateDef = GATE_DEFINITIONS[gateType];
        if (inputWires.length < gateDef.minInputs) {
          errors.push({
            line: lineNumber,
            column: 1,
            message: `Gate '${gateName}' (${gateType}) requires at least ${gateDef.minInputs} inputs, but got ${inputWires.length}`,
            severity: 'error',
          });
        }
        if (inputWires.length > gateDef.maxInputs) {
          errors.push({
            line: lineNumber,
            column: 1,
            message: `Gate '${gateName}' (${gateType}) accepts at most ${gateDef.maxInputs} inputs, but got ${inputWires.length}`,
            severity: 'error',
          });
        }

        // Check that all input wires are declared
        for (const wire of inputWires) {
          // Handle bit-indexed wires like bus[0]
          const baseName = wire.replace(/\[\d+(:\d+)?\]$/, '');
          if (!declaredWires.has(baseName)) {
            errors.push({
              line: lineNumber,
              column: 1,
              message: `Undefined wire '${wire}' used as input to gate '${gateName}'`,
              severity: 'error',
            });
          } else {
            usedWires.add(baseName);
          }
        }

        // Check that all output wires are declared
        for (const wire of outputWires) {
          const baseName = wire.replace(/\[\d+(:\d+)?\]$/, '');
          if (!declaredWires.has(baseName)) {
            errors.push({
              line: lineNumber,
              column: 1,
              message: `Undefined wire '${wire}' used as output of gate '${gateName}'`,
              severity: 'error',
            });
          } else {
            usedWires.add(baseName);
          }
        }

        continue;
      }

      // If we get here, the line doesn't match any known pattern
      // Check if it looks like a wire or gate but has syntax errors
      if (trimmedLine.toLowerCase().startsWith('wire ')) {
        errors.push({
          line: lineNumber,
          column: 1,
          message: `Invalid wire declaration syntax: '${trimmedLine}'`,
          severity: 'error',
        });
      } else if (/^[a-zA-Z_][a-zA-Z0-9_]*\s+[a-zA-Z_][a-zA-Z0-9_]*/.test(trimmedLine)) {
        // Looks like a gate instantiation but doesn't match the pattern
        errors.push({
          line: lineNumber,
          column: 1,
          message: `Invalid gate instantiation syntax: '${trimmedLine}'`,
          severity: 'error',
        });
      } else {
        errors.push({
          line: lineNumber,
          column: 1,
          message: `Unrecognized statement: '${trimmedLine}'`,
          severity: 'error',
        });
      }
    }

    // Check for unused wires (warnings)
    for (const [wireName, lineNum] of declaredWires) {
      if (!usedWires.has(wireName)) {
        warnings.push({
          line: lineNum,
          column: 1,
          message: `Wire '${wireName}' is declared but never used`,
          severity: 'warning',
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
