// src/visualizer/InstructionGateMapping.ts
// Instruction-to-gate mapping for code-to-circuit linking (Story 6.9)

/**
 * Mapping from an opcode to the gates it activates and the signal path.
 */
export interface InstructionMapping {
  /** Gate IDs that should be highlighted for this instruction */
  gates: number[];
  /** Wire segment IDs forming the signal path: [[wireId, bitIndex], ...] */
  signalPath: number[][];
}

/**
 * Full mapping from opcode string to gate and signal path information.
 * Gate IDs correspond to the circuit.json gate indices.
 *
 * Gate naming convention in circuit.json:
 * - DEC_* : Instruction decoder gates (0-26)
 * - ALU_* : ALU input/output gates (27-35)
 * - STATE* : State machine gates (36-38)
 * - MEM_* : Memory address/data gates (39-50)
 * - CAT_* : Category detection gates (51-86)
 * - CTRL_* : Control signal gates (111-131)
 * - ACC* : Accumulator register (142-145)
 * - ZFLAG : Zero flag register (146)
 * - IR* : Instruction register (147-150)
 * - MAR* : Memory address register (151-158)
 * - PC* : Program counter (159-166)
 */
export const OPCODE_GATE_MAP: Record<string, InstructionMapping> = {
  // HLT (0x0) - Halt execution
  HLT: {
    gates: [
      // Decoder gates for HLT
      4, 5, 6, 7, // DEC_NOT0-3 (inverters for opcode bits)
      8, 9, 10,   // DEC_HLT1-3 (AND gates detecting 0000)
      // Control output
      111,        // CTRL_HALT
      // Category detection
      67,         // CAT_SB1 (single-byte category)
    ],
    signalPath: [
      [21, 0], [21, 1], [21, 2], [21, 3], // opcode wire bits
      [22, 0], // is_hlt wire
      [53, 0], // halt wire
    ],
  },

  // LDA (0x1) - Load accumulator from memory
  LDA: {
    gates: [
      // Decoder gates for LDA
      4, 5, 6, 7, // DEC_NOT0-3
      11, 12,     // DEC_LDA1-2
      // Memory read control
      112, 113, 114, // CTRL_MR1-3
      // Accumulator load
      124, 125, 126, // CTRL_ACCLD1-3
      129,           // CTRL_MDR2ACC
      // Accumulator register
      142, 143, 144, 145, // ACC0-3
      // Memory address
      39, 40, 41, 42, 43, 44, 45, 46, // MEM_ADDR0-7
      // MAR register
      151, 152, 153, 154, 155, 156, 157, 158, // MAR0-7
    ],
    signalPath: [
      [21, 0], [21, 1], [21, 2], [21, 3], // opcode
      [23, 0], // is_lda
      [57, 0], // mdr_to_acc
      [9, 0], [9, 1], [9, 2], [9, 3], // acc
    ],
  },

  // STA (0x2) - Store accumulator to memory
  STA: {
    gates: [
      // Decoder gates for STA
      4, 5, 6, 7, // DEC_NOT0-3
      13, 14, 15, // DEC_STA1-3
      // Memory write control
      115,        // CTRL_MW
      // Memory data output (from accumulator)
      47, 48, 49, 50, // MEM_DOUT0-3
      // MAR register
      151, 152, 153, 154, 155, 156, 157, 158, // MAR0-7
      // Memory address
      39, 40, 41, 42, 43, 44, 45, 46, // MEM_ADDR0-7
    ],
    signalPath: [
      [21, 0], [21, 1], [21, 2], [21, 3], // opcode
      [24, 0], // is_sta
      [55, 0], // mem_write
      [9, 0], [9, 1], [9, 2], [9, 3], // acc (source)
      [61, 0], [61, 1], [61, 2], [61, 3], // mem_data_out
    ],
  },

  // ADD (0x3) - Add memory to accumulator
  ADD: {
    gates: [
      // Decoder gates for ADD
      4, 5, 6, 7, // DEC_NOT0-3
      16, 17,     // DEC_ADD1-2
      // ALU input gates
      27, 28, 29, 30, // ALU_A0-3 (accumulator input)
      31, 32, 33, 34, // ALU_B0-3 (memory data input)
      35,             // ALU_OP
      // ALU category
      78, 83, 84, 85, 86, // CAT_ALU gates
      // Control
      128,           // CTRL_ALU2ACC
      // Accumulator
      142, 143, 144, 145, // ACC0-3
      // Zero flag
      127, 146,      // CTRL_ZLD, ZFLAG
    ],
    signalPath: [
      [21, 0], [21, 1], [21, 2], [21, 3], // opcode
      [25, 0], // is_add
      [45, 0], [45, 1], [45, 2], [45, 3], // alu_a_in
      [46, 0], [46, 1], [46, 2], [46, 3], // alu_b_in
      [48, 0], [48, 1], [48, 2], [48, 3], // alu_result
      [56, 0], // alu_to_acc
      [9, 0], [9, 1], [9, 2], [9, 3], // acc
    ],
  },

  // SUB (0x4) - Subtract memory from accumulator
  SUB: {
    gates: [
      // Decoder gates for SUB
      4, 5, 6, 7, // DEC_NOT0-3
      18, 19, 20, // DEC_SUB1-3
      // ALU gates
      27, 28, 29, 30, // ALU_A0-3
      31, 32, 33, 34, // ALU_B0-3
      35,             // ALU_OP
      // ALU category
      78, 83, 84, 85, 86, // CAT_ALU gates
      // Control
      128,           // CTRL_ALU2ACC
      // Accumulator
      142, 143, 144, 145, // ACC0-3
      // Zero flag
      127, 146,      // CTRL_ZLD, ZFLAG
    ],
    signalPath: [
      [21, 0], [21, 1], [21, 2], [21, 3], // opcode
      [26, 0], // is_sub
      [45, 0], [45, 1], [45, 2], [45, 3], // alu_a_in
      [46, 0], [46, 1], [46, 2], [46, 3], // alu_b_in
      [48, 0], [48, 1], [48, 2], [48, 3], // alu_result
      [56, 0], // alu_to_acc
      [9, 0], [9, 1], [9, 2], [9, 3], // acc
    ],
  },

  // JMP (0x5) - Unconditional jump
  JMP: {
    gates: [
      // Decoder gates for JMP
      4, 5, 6, 7, // DEC_NOT0-3
      21, 22,     // DEC_JMP1-2
      // Jump category
      87,         // CAT_JMP
      // PC load control
      117, 120,   // CTRL_PCLD1, CTRL_PCLD4
      // Program counter
      159, 160, 161, 162, 163, 164, 165, 166, // PC0-7
    ],
    signalPath: [
      [21, 0], [21, 1], [21, 2], [21, 3], // opcode
      [27, 0], // is_jmp
      [4, 0],  // pc_load
      [2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5], [2, 6], [2, 7], // pc
    ],
  },

  // JZ (0x6) - Jump if zero
  JZ: {
    gates: [
      // Decoder gates for JZ
      4, 5, 6, 7, // DEC_NOT0-3
      23, 24,     // DEC_JZ1-2
      // Jump category
      87,         // CAT_JMP
      // PC load control (conditional)
      118, 119, 120, // CTRL_PCLD2, CTRL_PCLD3, CTRL_PCLD4
      // Zero flag
      146,        // ZFLAG
      // Program counter
      159, 160, 161, 162, 163, 164, 165, 166, // PC0-7
    ],
    signalPath: [
      [21, 0], [21, 1], [21, 2], [21, 3], // opcode
      [28, 0], // is_jz
      [12, 0], // z_flag
      [4, 0],  // pc_load
      [2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5], [2, 6], [2, 7], // pc
    ],
  },

  // LDI (0x7) - Load immediate
  LDI: {
    gates: [
      // Decoder gates for LDI
      4, 5, 6, 7, // DEC_NOT0-3
      25, 26,     // DEC_LDI1-2
      // Immediate to accumulator
      130,        // CTRL_IMM2ACC
      // Accumulator load
      124, 125, 126, // CTRL_ACCLD1-3
      // Accumulator
      142, 143, 144, 145, // ACC0-3
      // Single byte category
      67,         // CAT_SB1
    ],
    signalPath: [
      [21, 0], [21, 1], [21, 2], [21, 3], // opcode
      [29, 0], // is_ldi
      [58, 0], // imm_to_acc
      [9, 0], [9, 1], [9, 2], [9, 3], // acc
    ],
  },

  // AND (0x8) - Bitwise AND with memory
  AND: {
    gates: [
      // Decoder gates for AND
      4, 5, 6, 7, // DEC_NOT0-3
      51, 52,     // DEC_AND1-2
      // ALU gates
      27, 28, 29, 30, // ALU_A0-3
      31, 32, 33, 34, // ALU_B0-3
      // ALU category
      78, 79, 83, 84, 85, 86, // CAT_ALU gates
      // Control
      128,           // CTRL_ALU2ACC
      // Accumulator
      142, 143, 144, 145, // ACC0-3
      // ALU op
      136, 137, 138, // ALUOP1_1-3
    ],
    signalPath: [
      [21, 0], [21, 1], [21, 2], [21, 3], // opcode
      [63, 0], // is_and
      [45, 0], [45, 1], [45, 2], [45, 3], // alu_a_in
      [48, 0], [48, 1], [48, 2], [48, 3], // alu_result
      [56, 0], // alu_to_acc
    ],
  },

  // OR (0x9) - Bitwise OR with memory
  OR: {
    gates: [
      // Decoder gates for OR
      4, 5, 6, 7, // DEC_NOT0-3
      53, 54,     // DEC_OR1-2
      // ALU gates
      27, 28, 29, 30, // ALU_A0-3
      31, 32, 33, 34, // ALU_B0-3
      // ALU category
      78, 79, 83, 84, 85, 86, // CAT_ALU gates
      // Control
      128,           // CTRL_ALU2ACC
      // Accumulator
      142, 143, 144, 145, // ACC0-3
      // ALU op
      136, 137, 138, // ALUOP1_1-3
    ],
    signalPath: [
      [21, 0], [21, 1], [21, 2], [21, 3], // opcode
      [64, 0], // is_or
      [45, 0], [45, 1], [45, 2], [45, 3], // alu_a_in
      [48, 0], [48, 1], [48, 2], [48, 3], // alu_result
      [56, 0], // alu_to_acc
    ],
  },

  // XOR (0xA) - Bitwise XOR with memory
  XOR: {
    gates: [
      // Decoder gates for XOR
      4, 5, 6, 7, // DEC_NOT0-3
      55, 56,     // DEC_XOR1-2
      // ALU gates
      27, 28, 29, 30, // ALU_A0-3
      31, 32, 33, 34, // ALU_B0-3
      // ALU category
      78, 79, 80, 83, 84, 85, 86, // CAT_ALU gates
      // Control
      128,           // CTRL_ALU2ACC
      // Accumulator
      142, 143, 144, 145, // ACC0-3
      // ALU op
      139, 140,     // ALUOP2_1-2
    ],
    signalPath: [
      [21, 0], [21, 1], [21, 2], [21, 3], // opcode
      [66, 0], // is_xor
      [45, 0], [45, 1], [45, 2], [45, 3], // alu_a_in
      [48, 0], [48, 1], [48, 2], [48, 3], // alu_result
      [56, 0], // alu_to_acc
    ],
  },

  // NOT (0xB) - Bitwise NOT of accumulator
  NOT: {
    gates: [
      // Decoder gates for NOT
      4, 5, 6, 7, // DEC_NOT0-3
      57, 58,     // DEC_NOT2-3 (NOT instruction decoder, not inverters)
      // ALU gates (unary operation)
      27, 28, 29, 30, // ALU_A0-3
      // ALU category
      78, 79, 80, 83, 84, 85, 86, // CAT_ALU gates
      // Control
      128,           // CTRL_ALU2ACC
      // Accumulator
      142, 143, 144, 145, // ACC0-3
      // Single byte category
      68,            // CAT_SB2
      // ALU op
      139, 140,     // ALUOP2_1-2
    ],
    signalPath: [
      [21, 0], [21, 1], [21, 2], [21, 3], // opcode
      [68, 0], // is_not
      [45, 0], [45, 1], [45, 2], [45, 3], // alu_a_in
      [48, 0], [48, 1], [48, 2], [48, 3], // alu_result
      [56, 0], // alu_to_acc
    ],
  },

  // SHL (0xC) - Shift left
  SHL: {
    gates: [
      // Decoder gates for SHL
      4, 5, 6, 7, // DEC_NOT0-3
      59, 60,     // DEC_SHL1-2
      // ALU gates
      27, 28, 29, 30, // ALU_A0-3
      // ALU category
      78, 80, 81, 83, 84, 85, 86, // CAT_ALU gates
      // Control
      128,           // CTRL_ALU2ACC
      // Accumulator
      142, 143, 144, 145, // ACC0-3
      // Single byte category
      68,            // CAT_SB2
    ],
    signalPath: [
      [21, 0], [21, 1], [21, 2], [21, 3], // opcode
      [70, 0], // is_shl
      [45, 0], [45, 1], [45, 2], [45, 3], // alu_a_in
      [48, 0], [48, 1], [48, 2], [48, 3], // alu_result
      [56, 0], // alu_to_acc
    ],
  },

  // SHR (0xD) - Shift right
  SHR: {
    gates: [
      // Decoder gates for SHR
      4, 5, 6, 7, // DEC_NOT0-3
      61, 62,     // DEC_SHR1-2
      // ALU gates
      27, 28, 29, 30, // ALU_A0-3
      // ALU category
      78, 80, 81, 83, 84, 85, 86, // CAT_ALU gates
      // Control
      128,           // CTRL_ALU2ACC
      // Accumulator
      142, 143, 144, 145, // ACC0-3
      // Single byte category
      69,            // CAT_SB3
    ],
    signalPath: [
      [21, 0], [21, 1], [21, 2], [21, 3], // opcode
      [72, 0], // is_shr
      [45, 0], [45, 1], [45, 2], [45, 3], // alu_a_in
      [48, 0], [48, 1], [48, 2], [48, 3], // alu_result
      [56, 0], // alu_to_acc
    ],
  },

  // INC (0xE) - Increment accumulator
  INC: {
    gates: [
      // Decoder gates for INC
      4, 5, 6, 7, // DEC_NOT0-3
      63, 64,     // DEC_INC1-2
      // ALU gates
      27, 28, 29, 30, // ALU_A0-3
      // ALU category
      78, 82, 83, 84, 85, 86, // CAT_ALU gates
      // Control
      128,           // CTRL_ALU2ACC
      // Accumulator
      142, 143, 144, 145, // ACC0-3
      // Single byte category
      69,            // CAT_SB3
      // ALU op
      141,          // ALUOP3
    ],
    signalPath: [
      [21, 0], [21, 1], [21, 2], [21, 3], // opcode
      [74, 0], // is_inc
      [45, 0], [45, 1], [45, 2], [45, 3], // alu_a_in
      [48, 0], [48, 1], [48, 2], [48, 3], // alu_result
      [56, 0], // alu_to_acc
    ],
  },

  // DEC (0xF) - Decrement accumulator
  DEC: {
    gates: [
      // Decoder gates for DEC
      4, 5, 6, 7, // DEC_NOT0-3
      65, 66,     // DEC_DEC1-2
      // ALU gates
      27, 28, 29, 30, // ALU_A0-3
      // ALU category
      78, 82, 83, 84, 85, 86, // CAT_ALU gates
      // Control
      128,           // CTRL_ALU2ACC
      // Accumulator
      142, 143, 144, 145, // ACC0-3
      // Single byte category
      71,            // CAT_SB5
      // ALU op
      141,          // ALUOP3
    ],
    signalPath: [
      [21, 0], [21, 1], [21, 2], [21, 3], // opcode
      [76, 0], // is_dec
      [45, 0], [45, 1], [45, 2], [45, 3], // alu_a_in
      [48, 0], [48, 1], [48, 2], [48, 3], // alu_result
      [56, 0], // alu_to_acc
    ],
  },
};

/**
 * Get gate IDs that should be highlighted for a given instruction opcode.
 * @param opcode - The instruction opcode (case-insensitive)
 * @returns Array of gate IDs, or empty array if opcode not found
 */
export function getGatesForInstruction(opcode: string): number[] {
  const normalized = opcode.toUpperCase();
  const mapping = OPCODE_GATE_MAP[normalized];
  return mapping ? mapping.gates : [];
}

/**
 * Get wire segment IDs forming the signal path for an instruction.
 * @param opcode - The instruction opcode (case-insensitive)
 * @returns Array of [wireId, bitIndex] pairs, or empty array if opcode not found
 */
export function getSignalPathForInstruction(opcode: string): number[][] {
  const normalized = opcode.toUpperCase();
  const mapping = OPCODE_GATE_MAP[normalized];
  return mapping ? mapping.signalPath : [];
}
