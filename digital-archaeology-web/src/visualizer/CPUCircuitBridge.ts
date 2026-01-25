// src/visualizer/CPUCircuitBridge.ts
// Bridge between CPU emulator state and circuit visualization (Story 6.13)

import type { CPUState } from '@emulator/types';
import type { CircuitModel } from './CircuitModel';
import type { CircuitData, CircuitWire } from './types';

/**
 * Wire name mapping from CPUState fields to circuit wire names.
 * Based on micro4-circuit.json wire definitions.
 */
const WIRE_NAMES = {
  // Registers
  PC: 'pc',
  ACC: 'acc',
  IR: 'ir',
  MAR: 'mar',
  MDR: 'mdr',

  // Flags
  Z_FLAG: 'z_flag',

  // Opcode and decoded signals
  OPCODE: 'opcode',

  // Instruction decode signals
  IS_HLT: 'is_hlt',
  IS_LDA: 'is_lda',
  IS_STA: 'is_sta',
  IS_ADD: 'is_add',
  IS_SUB: 'is_sub',
  IS_JMP: 'is_jmp',
  IS_JZ: 'is_jz',
  IS_LDI: 'is_ldi',

  // Control signals
  PC_LOAD: 'pc_load',
  PC_INC: 'pc_inc',
  ACC_LOAD: 'acc_load',
  Z_LOAD: 'z_load',
  IR_LOAD: 'ir_load',
  MAR_LOAD: 'mar_load',
  MDR_LOAD: 'mdr_load',
  HALT: 'halt',
} as const;

/**
 * Micro4 opcodes for instruction decoding.
 */
const OPCODES = {
  HLT: 0x0,  // 0000 - Halt
  LDA: 0x1,  // 0001 - Load accumulator from memory
  STA: 0x2,  // 0010 - Store accumulator to memory
  ADD: 0x3,  // 0011 - Add memory to accumulator
  SUB: 0x4,  // 0100 - Subtract memory from accumulator
  JMP: 0x5,  // 0101 - Unconditional jump
  JZ: 0x6,   // 0110 - Jump if zero
  LDI: 0x7,  // 0111 - Load immediate to accumulator
  AND: 0x8,  // 1000 - Bitwise AND
  OR: 0x9,   // 1001 - Bitwise OR
  XOR: 0xA,  // 1010 - Bitwise XOR
  NOT: 0xB,  // 1011 - Bitwise NOT
  SHL: 0xC,  // 1100 - Shift left
  SHR: 0xD,  // 1101 - Shift right
  INC: 0xE,  // 1110 - Increment
  DEC: 0xF,  // 1111 - Decrement
} as const;

/**
 * Convert a number to a bit array (LSB first).
 * @param value - The numeric value to convert
 * @param width - The number of bits
 * @returns Array of bit values (0 or 1)
 */
export function numberToBitArray(value: number, width: number): number[] {
  return Array.from({ length: width }, (_, i) => (value >> i) & 1);
}

/**
 * Bridge class that maps CPU emulator state to circuit wire states.
 *
 * This class translates CPUState (from the emulator) into CircuitData
 * (for the visualizer), enabling the circuit diagram to reflect the
 * actual CPU state during execution.
 */
export class CPUCircuitBridge {
  /** Cache of wire name to ID mappings for performance */
  private wireNameToId: Map<string, number> = new Map();

  /**
   * Maps CPUState to CircuitData wire states.
   *
   * @param cpuState - Current emulator state
   * @param circuitModel - Circuit model to base the output on
   * @returns Updated CircuitData with new wire states reflecting CPU state
   */
  mapStateToCircuit(cpuState: CPUState, circuitModel: CircuitModel): CircuitData {
    // Build wire name cache if not already done
    if (this.wireNameToId.size === 0) {
      this.buildWireNameCache(circuitModel);
    }

    // Clone the circuit data to avoid mutating the original
    const circuitData = this.cloneCircuitData(circuitModel);

    // Map register values
    this.setWireState(circuitData, WIRE_NAMES.PC, numberToBitArray(cpuState.pc, 8));
    this.setWireState(circuitData, WIRE_NAMES.ACC, numberToBitArray(cpuState.accumulator, 4));
    this.setWireState(circuitData, WIRE_NAMES.IR, numberToBitArray(cpuState.ir, 8));
    this.setWireState(circuitData, WIRE_NAMES.MAR, numberToBitArray(cpuState.mar, 8));
    this.setWireState(circuitData, WIRE_NAMES.MDR, numberToBitArray(cpuState.mdr, 4));

    // Map flags
    this.setWireState(circuitData, WIRE_NAMES.Z_FLAG, [cpuState.zeroFlag ? 1 : 0]);
    this.setWireState(circuitData, WIRE_NAMES.HALT, [cpuState.halted ? 1 : 0]);

    // Extract and map opcode from IR
    const opcode = (cpuState.ir >> 4) & 0xF;
    this.setWireState(circuitData, WIRE_NAMES.OPCODE, numberToBitArray(opcode, 4));

    // Map instruction decode signals
    this.mapInstructionDecodeSignals(circuitData, opcode);

    // Map control signals (derived from instruction and state)
    this.mapControlSignals(circuitData, opcode, cpuState);

    return circuitData;
  }

  /**
   * Build a cache mapping wire names to wire IDs for fast lookup.
   * @param circuitModel - The circuit model to cache
   */
  private buildWireNameCache(circuitModel: CircuitModel): void {
    this.wireNameToId.clear();
    for (const wire of circuitModel.wires.values()) {
      this.wireNameToId.set(wire.name, wire.id);
    }
  }

  /**
   * Clear the wire name cache.
   * Call this when switching to a different circuit.
   */
  clearCache(): void {
    this.wireNameToId.clear();
  }

  /**
   * Clone circuit data from the model for modification.
   * @param circuitModel - The circuit model to clone
   * @returns A new CircuitData object with cloned wire states
   */
  private cloneCircuitData(circuitModel: CircuitModel): CircuitData {
    const wires: CircuitWire[] = [];

    for (const wire of circuitModel.wires.values()) {
      wires.push({
        id: wire.id,
        name: wire.name,
        width: wire.width,
        is_input: wire.is_input,
        is_output: wire.is_output,
        state: [...wire.state], // Clone the state array
      });
    }

    // Gates don't change, we can reference them directly
    const gates = Array.from(circuitModel.gates.values());

    return {
      cycle: 0,
      stable: true,
      wires,
      gates,
    };
  }

  /**
   * Set the state of a wire by name.
   * @param circuitData - The circuit data to modify
   * @param wireName - The name of the wire
   * @param state - The new state (bit array)
   */
  private setWireState(circuitData: CircuitData, wireName: string, state: number[]): void {
    const wireId = this.wireNameToId.get(wireName);
    if (wireId === undefined) return;

    const wire = circuitData.wires.find(w => w.id === wireId);
    if (wire && wire.state.length === state.length) {
      wire.state = state;
    }
  }

  /**
   * Map instruction decode signals based on the opcode.
   * Sets is_hlt, is_lda, is_sta, etc. to 1 or 0.
   * @param circuitData - The circuit data to modify
   * @param opcode - The current opcode (0-15)
   */
  private mapInstructionDecodeSignals(circuitData: CircuitData, opcode: number): void {
    this.setWireState(circuitData, WIRE_NAMES.IS_HLT, [opcode === OPCODES.HLT ? 1 : 0]);
    this.setWireState(circuitData, WIRE_NAMES.IS_LDA, [opcode === OPCODES.LDA ? 1 : 0]);
    this.setWireState(circuitData, WIRE_NAMES.IS_STA, [opcode === OPCODES.STA ? 1 : 0]);
    this.setWireState(circuitData, WIRE_NAMES.IS_ADD, [opcode === OPCODES.ADD ? 1 : 0]);
    this.setWireState(circuitData, WIRE_NAMES.IS_SUB, [opcode === OPCODES.SUB ? 1 : 0]);
    this.setWireState(circuitData, WIRE_NAMES.IS_JMP, [opcode === OPCODES.JMP ? 1 : 0]);
    this.setWireState(circuitData, WIRE_NAMES.IS_JZ, [opcode === OPCODES.JZ ? 1 : 0]);
    this.setWireState(circuitData, WIRE_NAMES.IS_LDI, [opcode === OPCODES.LDI ? 1 : 0]);
  }

  /**
   * Map control signals based on the instruction and CPU state.
   * These signals control register loads, memory access, etc.
   * @param circuitData - The circuit data to modify
   * @param opcode - The current opcode
   * @param cpuState - The current CPU state
   */
  private mapControlSignals(circuitData: CircuitData, opcode: number, cpuState: CPUState): void {
    // PC control signals
    // PC_LOAD is active for JMP, or JZ when zero flag is set
    const pcLoad = opcode === OPCODES.JMP || (opcode === OPCODES.JZ && cpuState.zeroFlag);
    this.setWireState(circuitData, WIRE_NAMES.PC_LOAD, [pcLoad ? 1 : 0]);

    // PC_INC is active when not halted and not loading PC
    const pcInc = !cpuState.halted && !pcLoad;
    this.setWireState(circuitData, WIRE_NAMES.PC_INC, [pcInc ? 1 : 0]);

    // ACC_LOAD is active for LDA, LDI, and ALU operations
    const accLoadOpcodes: number[] = [
      OPCODES.LDA, OPCODES.LDI, OPCODES.ADD, OPCODES.SUB,
      OPCODES.AND, OPCODES.OR, OPCODES.XOR, OPCODES.NOT,
      OPCODES.SHL, OPCODES.SHR, OPCODES.INC, OPCODES.DEC
    ];
    const accLoad = accLoadOpcodes.includes(opcode);
    this.setWireState(circuitData, WIRE_NAMES.ACC_LOAD, [accLoad ? 1 : 0]);

    // Z_LOAD follows ACC_LOAD (zero flag updated when accumulator changes)
    this.setWireState(circuitData, WIRE_NAMES.Z_LOAD, [accLoad ? 1 : 0]);

    // IR_LOAD - active during fetch cycle (simplified: always active for visualization)
    this.setWireState(circuitData, WIRE_NAMES.IR_LOAD, [1]);

    // MAR_LOAD - active when accessing memory
    const marLoadOpcodes: number[] = [
      OPCODES.LDA, OPCODES.STA, OPCODES.ADD, OPCODES.SUB,
      OPCODES.AND, OPCODES.OR, OPCODES.XOR
    ];
    const marLoad = marLoadOpcodes.includes(opcode);
    this.setWireState(circuitData, WIRE_NAMES.MAR_LOAD, [marLoad ? 1 : 0]);

    // MDR_LOAD - active during memory read operations
    const mdrLoadOpcodes: number[] = [
      OPCODES.LDA, OPCODES.ADD, OPCODES.SUB,
      OPCODES.AND, OPCODES.OR, OPCODES.XOR
    ];
    const mdrLoad = mdrLoadOpcodes.includes(opcode);
    this.setWireState(circuitData, WIRE_NAMES.MDR_LOAD, [mdrLoad ? 1 : 0]);
  }
}
