// src/simulators/analytical-engine/CardTypes.ts
// Instruction type definitions and DSL parser for the Analytical Engine

/**
 * Instruction opcodes for the Analytical Engine.
 */
export type Opcode =
  | 'LOAD' | 'ADD' | 'SUB' | 'MUL' | 'DIV'
  | 'MOV' | 'BRZ' | 'BRN' | 'JMP' | 'PRINT' | 'HLT';

/**
 * A single instruction (card) in the Analytical Engine.
 */
export interface Card {
  /** Unique ID for this card instance */
  id: string;
  /** The operation to perform */
  opcode: Opcode;
  /** Source column A (for arithmetic: left operand) */
  srcA?: string;
  /** Source column B or constant (for LOAD: the constant value) */
  srcB?: string;
  /** Destination column */
  dest?: string;
  /** Branch target label (for BRZ, BRN, JMP) */
  label?: string;
  /** Original text line for display */
  text: string;
}

/**
 * A label marker (not an instruction, just a branch target).
 */
export interface LabelCard {
  id: string;
  isLabel: true;
  name: string;
  text: string;
}

/** A program entry is either a card or a label. */
export type ProgramEntry = Card | LabelCard;

/** Check if entry is a label. */
export function isLabel(entry: ProgramEntry): entry is LabelCard {
  return 'isLabel' in entry && entry.isLabel;
}

let cardIdCounter = 0;
function nextCardId(): string {
  return `card-${++cardIdCounter}`;
}

/** Reset the card ID counter (for testing). */
export function resetCardIdCounter(): void {
  cardIdCounter = 0;
}

/**
 * Parse a single line of DSL text into a ProgramEntry.
 * Returns null for empty lines and comments.
 */
export function parseLine(line: string): ProgramEntry | null {
  // Strip comments (after semicolon)
  const commentIdx = line.indexOf(';');
  const clean = (commentIdx >= 0 ? line.substring(0, commentIdx) : line).trim();

  if (clean.length === 0) return null;

  // Label: starts with ':'
  if (clean.startsWith(':')) {
    const name = clean.substring(1).trim();
    return { id: nextCardId(), isLabel: true, name, text: clean };
  }

  const parts = clean.split(/\s+/);
  const opcode = parts[0].toUpperCase() as Opcode;

  switch (opcode) {
    case 'LOAD': {
      // LOAD v0 42
      const dest = parts[1];
      const value = parts[2];
      return { id: nextCardId(), opcode, dest, srcB: value, text: clean };
    }
    case 'ADD':
    case 'SUB':
    case 'MUL':
    case 'DIV': {
      // ADD v0 v1 -> v2
      const srcA = parts[1];
      const srcB = parts[2];
      // parts[3] should be '->'
      const dest = parts[4];
      return { id: nextCardId(), opcode, srcA, srcB, dest, text: clean };
    }
    case 'MOV': {
      // MOV v0 -> v1
      const srcA = parts[1];
      const dest = parts[3];
      return { id: nextCardId(), opcode, srcA, dest, text: clean };
    }
    case 'BRZ':
    case 'BRN': {
      // BRZ v0 :label
      const srcA = parts[1];
      const label = parts[2]?.startsWith(':') ? parts[2].substring(1) : parts[2];
      return { id: nextCardId(), opcode, srcA, label, text: clean };
    }
    case 'JMP': {
      // JMP :label
      const label = parts[1]?.startsWith(':') ? parts[1].substring(1) : parts[1];
      return { id: nextCardId(), opcode, label, text: clean };
    }
    case 'PRINT': {
      // PRINT v0
      const srcA = parts[1];
      return { id: nextCardId(), opcode, srcA, text: clean };
    }
    case 'HLT': {
      return { id: nextCardId(), opcode, text: clean };
    }
    default:
      // Unknown instruction — treat as a NOP comment
      return null;
  }
}

/**
 * Parse a full DSL program text into an array of ProgramEntries.
 */
export function parseProgram(text: string): ProgramEntry[] {
  const entries: ProgramEntry[] = [];
  for (const line of text.split('\n')) {
    const entry = parseLine(line);
    if (entry) entries.push(entry);
  }
  return entries;
}

/**
 * Convert a ProgramEntry back to DSL text.
 */
export function entryToText(entry: ProgramEntry): string {
  if (isLabel(entry)) return `:${entry.name}`;
  return entry.text;
}

/**
 * Convert entire program to DSL text.
 */
export function programToText(entries: ProgramEntry[]): string {
  return entries.map(entryToText).join('\n');
}
