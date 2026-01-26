// src/hdl/HdlToCircuitGenerator.ts
// HDL to Circuit Generator - Converts AST to CircuitData for visualization
// Story 7.6: Implement HDL-to-Circuit Regeneration - Task 2

import type { HdlAst, HdlWireNode, HdlGateNode, HdlWireRef } from './HdlParser';
import type { CircuitData, CircuitWire, CircuitGate, GatePort } from '../visualizer/types';

/**
 * Generates CircuitData from an HdlAst for circuit visualization.
 */
export class HdlToCircuitGenerator {
  /**
   * Generate CircuitData from a parsed HDL AST.
   * @param ast - The parsed HDL abstract syntax tree
   * @returns CircuitData ready for visualization
   */
  generate(ast: HdlAst): CircuitData {
    // Build wire name to ID mapping
    const wireNameToId = new Map<string, number>();
    const wires: CircuitWire[] = [];

    // Generate circuit wires
    for (let i = 0; i < ast.wires.length; i++) {
      const wireNode = ast.wires[i];
      wireNameToId.set(wireNode.name, i);
      wires.push(this.generateWire(wireNode, i));
    }

    // Generate circuit gates
    const gates: CircuitGate[] = ast.gates.map((gateNode, index) =>
      this.generateGate(gateNode, index, wireNameToId)
    );

    return {
      cycle: 0,
      stable: true,
      wires,
      gates,
    };
  }

  /**
   * Generate a CircuitWire from an HdlWireNode.
   */
  private generateWire(node: HdlWireNode, id: number): CircuitWire {
    // Initialize state array with zeros matching wire width
    const state = new Array(node.width).fill(0);

    return {
      id,
      name: node.name,
      width: node.width,
      is_input: node.isInput,
      is_output: node.isOutput,
      state,
    };
  }

  /**
   * Generate a CircuitGate from an HdlGateNode.
   */
  private generateGate(
    node: HdlGateNode,
    id: number,
    wireNameToId: Map<string, number>
  ): CircuitGate {
    const type = node.type.toUpperCase();

    // Convert input wire references to GatePorts
    const inputs: GatePort[] = node.inputs.map((ref) =>
      this.wireRefToGatePort(ref, wireNameToId)
    );

    // Convert output wire references to GatePorts
    const outputs: GatePort[] = node.outputs.map((ref) =>
      this.wireRefToGatePort(ref, wireNameToId)
    );

    const gate: CircuitGate = {
      id,
      name: node.name,
      type,
      inputs,
      outputs,
    };

    // Initialize stored value for DFF gates
    if (type === 'DFF') {
      gate.stored = 0;
    }

    return gate;
  }

  /**
   * Convert an HdlWireRef to a GatePort.
   * @throws Error if wire reference refers to an undefined wire
   */
  private wireRefToGatePort(ref: HdlWireRef, wireNameToId: Map<string, number>): GatePort {
    const wireId = wireNameToId.get(ref.wire);
    if (wireId === undefined) {
      // Throw error rather than returning invalid placeholder
      // This ensures circuit generation fails gracefully with a clear error message
      throw new Error(`Undefined wire reference: '${ref.wire}' - wire must be declared before use in gates`);
    }
    return { wire: wireId, bit: ref.bit };
  }
}
