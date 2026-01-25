// src/visualizer/signalFormatters.ts
// Signal value formatting utilities (Story 6.11)

import type { CircuitWire } from './types';

/**
 * Human-readable label mapping for wire names.
 */
const LABEL_MAP: Record<string, string> = {
  pc: 'PC',
  acc: 'ACC',
  mar: 'MAR',
  mdr: 'MDR',
  ir: 'IR',
  opcode: 'OP',
  z_flag: 'ZF',
  pc_load: 'PC_LD',
  pc_inc: 'PC_INC',
  acc_load: 'ACC_LD',
  z_load: 'Z_LD',
  ir_load: 'IR_LD',
  mar_load: 'MAR_LD',
  mdr_load: 'MDR_LD',
  is_hlt: 'HLT',
  is_lda: 'LDA',
  is_sta: 'STA',
};

/**
 * Format a signal label for human-readable display.
 * @param name - The wire name from circuit data
 * @returns Human-readable label (e.g., "pc" → "PC")
 */
export function formatSignalLabel(name: string): string {
  return LABEL_MAP[name] || name.toUpperCase();
}

/**
 * Convert a state array to binary string representation.
 * @param state - Array of bit values (0, 1, or 2 for undefined)
 * @returns Binary string with 'X' for undefined bits
 */
export function stateToBinary(state: number[]): string {
  return state.map(bit => (bit === 2 ? 'X' : String(bit))).join('');
}

/**
 * Convert a state array to decimal value.
 * Returns null if any bits are undefined.
 * @param state - Array of bit values (0, 1, or 2 for undefined)
 * @returns Decimal value or null if undefined bits present
 */
export function stateToDecimal(state: number[]): number | null {
  if (state.some(bit => bit === 2)) {
    return null;
  }
  // LSB is at index 0, so we need to reverse for standard binary interpretation
  return state.reduce((acc, bit, i) => acc + (bit << i), 0);
}

/**
 * Convert a decimal value to hex string with optional prefix.
 * @param value - Decimal value or null
 * @param width - Bit width for padding
 * @returns Hex string (e.g., "0x0A") or "?" for null
 */
export function decimalToHex(value: number | null, width: number): string {
  if (value === null) {
    return '?';
  }
  const hexDigits = Math.ceil(width / 4);
  return '0x' + value.toString(16).toUpperCase().padStart(hexDigits, '0');
}

/**
 * Format a wire's current value for display.
 * Single-bit wires show "0" or "1" or "X".
 * Multi-bit wires show "binary (hex)" format.
 * @param wire - The circuit wire with state array
 * @returns Formatted value string
 */
export function formatWireValue(wire: CircuitWire): string {
  const { state, width } = wire;

  // Single-bit wire: just show the value
  if (width === 1) {
    return state[0] === 2 ? 'X' : String(state[0]);
  }

  // Multi-bit wire: show binary and hex
  const binary = stateToBinary(state);
  const decimal = stateToDecimal(state);
  const hex = decimalToHex(decimal, width);

  return `${binary} (${hex})`;
}

/**
 * Check if two state arrays are equal.
 * @param state1 - First state array
 * @param state2 - Second state array
 * @returns True if arrays have same values
 */
export function statesEqual(state1: number[], state2: number[]): boolean {
  if (state1.length !== state2.length) return false;
  return state1.every((val, i) => val === state2[i]);
}
