// src/hdl/HdlParser.ts
// HDL Parser - Parses M4HDL content into an Abstract Syntax Tree
// Story 7.6: Implement HDL-to-Circuit Regeneration - Task 1

/**
 * Represents a wire reference with optional bit index.
 */
export interface HdlWireRef {
  /** Wire name */
  wire: string;
  /** Bit index (0 if not specified) */
  bit: number;
}

/**
 * Represents a wire declaration in the AST.
 */
export interface HdlWireNode {
  /** Wire name */
  name: string;
  /** Bit width (1 for single-bit wires) */
  width: number;
  /** Whether this is an external input */
  isInput: boolean;
  /** Whether this is an external output */
  isOutput: boolean;
}

/**
 * Represents a gate instantiation in the AST.
 */
export interface HdlGateNode {
  /** Gate type (and, or, not, xor, buf, dff, nand, nor, mux, latch) */
  type: string;
  /** Gate instance name */
  name: string;
  /** Input wire references */
  inputs: HdlWireRef[];
  /** Output wire references */
  outputs: HdlWireRef[];
}

/**
 * Represents a parse error with location information.
 */
export interface HdlParseError {
  /** Line number (1-indexed) */
  line: number;
  /** Column number (1-indexed) */
  column: number;
  /** Error message */
  message: string;
}

/**
 * Abstract Syntax Tree representation of HDL content.
 */
export interface HdlAst {
  /** List of wire declarations */
  wires: HdlWireNode[];
  /** List of gate instantiations */
  gates: HdlGateNode[];
  /** List of parse errors (non-fatal) */
  errors: HdlParseError[];
}

/**
 * Parses M4HDL content into an Abstract Syntax Tree.
 * Reuses parsing patterns from HdlValidator for consistency.
 */
export class HdlParser {
  /**
   * Parse HDL content into an AST.
   * @param content - The HDL source code to parse
   * @returns The parsed AST with wires, gates, and any errors
   */
  parse(content: string): HdlAst {
    const wires: HdlWireNode[] = [];
    const gates: HdlGateNode[] = [];
    const errors: HdlParseError[] = [];

    const lines = content.split('\n');

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const lineNumber = lineIndex + 1;
      const line = lines[lineIndex];
      const trimmedLine = line.trim();

      // Skip empty lines and comments
      if (trimmedLine === '' || trimmedLine.startsWith('#')) {
        continue;
      }

      // Try to parse wire declaration
      const wireNode = this.parseWireDeclaration(trimmedLine);
      if (wireNode) {
        wires.push(wireNode);
        continue;
      }

      // Try to parse gate instantiation
      const gateNode = this.parseGateInstantiation(trimmedLine);
      if (gateNode) {
        gates.push(gateNode);
        continue;
      }

      // Line doesn't match any known pattern - record error
      errors.push({
        line: lineNumber,
        column: 1,
        message: `Unrecognized statement: '${trimmedLine}'`,
      });
    }

    return { wires, gates, errors };
  }

  /**
   * Parse a wire declaration line.
   * Formats:
   *   - wire name
   *   - wire name[width]
   *   - wire name[high:low]
   */
  private parseWireDeclaration(line: string): HdlWireNode | null {
    // Match: wire name or wire name[bits] or wire name[high:low]
    const match = line.match(/^wire\s+([a-zA-Z_][a-zA-Z0-9_]*)(\[(\d+)(:\d+)?\])?$/i);
    if (!match) {
      return null;
    }

    const name = match[1];
    let width = 1;

    if (match[2]) {
      // Has bit specification
      const bitSpec = match[3];
      const rangeSpec = match[4];

      if (rangeSpec) {
        // Format: [high:low] - width is high - low + 1
        const high = parseInt(bitSpec, 10);
        const low = parseInt(rangeSpec.substring(1), 10);
        width = high - low + 1;
      } else {
        // Format: [width] - direct width specification
        width = parseInt(bitSpec, 10);
      }
    }

    return {
      name,
      width,
      isInput: false,
      isOutput: false,
    };
  }

  /**
   * Parse a gate instantiation line.
   * Format: gatetype name (input: wire1, wire2; output: wire3)
   */
  private parseGateInstantiation(line: string): HdlGateNode | null {
    // Match: gatetype name (input: ...; output: ...)
    const match = line.match(
      /^([a-zA-Z_][a-zA-Z0-9_]*)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(\s*input:\s*([^;]+);\s*output:\s*([^)]+)\s*\)$/i
    );
    if (!match) {
      return null;
    }

    const type = match[1].toLowerCase();
    const name = match[2];
    const inputsStr = match[3];
    const outputsStr = match[4];

    // Parse input wire references
    const inputs = this.parseWireRefs(inputsStr);

    // Parse output wire references
    const outputs = this.parseWireRefs(outputsStr);

    return {
      type,
      name,
      inputs,
      outputs,
    };
  }

  /**
   * Parse a comma-separated list of wire references.
   * Handles both plain names and bit-indexed references.
   */
  private parseWireRefs(str: string): HdlWireRef[] {
    const refs: HdlWireRef[] = [];
    const parts = str.split(',').map((p) => p.trim()).filter((p) => p);

    for (const part of parts) {
      const ref = this.parseWireRef(part);
      if (ref) {
        refs.push(ref);
      }
    }

    return refs;
  }

  /**
   * Parse a single wire reference.
   * Formats:
   *   - wireName (bit defaults to 0)
   *   - wireName[bitIndex]
   */
  private parseWireRef(str: string): HdlWireRef | null {
    // Match: name or name[bit]
    const match = str.match(/^([a-zA-Z_][a-zA-Z0-9_]*)(\[(\d+)\])?$/);
    if (!match) {
      return null;
    }

    const wire = match[1];
    const bit = match[3] ? parseInt(match[3], 10) : 0;

    return { wire, bit };
  }
}
