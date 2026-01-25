// src/editor/parseInstruction.ts
// Line content parser utility for code-to-circuit linking (Story 6.9)

/**
 * Directives that are not executable instructions.
 * These should return null from parseInstruction.
 *
 * Micro4 assembler supports: ORG, DB
 * Additional directives (DW, EQU, INCLUDE) are included for:
 * - Forward compatibility with Micro8/Micro16 stages
 * - Common assembler conventions users might try
 */
const DIRECTIVES = new Set(['ORG', 'DB', 'DW', 'EQU', 'INCLUDE']);

/**
 * Parse an assembly line to extract the opcode.
 * Handles labels, comments, and directives.
 *
 * @param lineContent - The raw line content from the editor
 * @returns The opcode (uppercase) or null if line is not an instruction
 *
 * @example
 * parseInstruction('LDA 5')            // 'LDA'
 * parseInstruction('START: LDA 5')     // 'LDA'
 * parseInstruction('; comment')        // null
 * parseInstruction('ADD ; add value')  // 'ADD'
 * parseInstruction('ORG $10')          // null
 * parseInstruction('')                 // null
 */
export function parseInstruction(lineContent: string): string | null {
  // Handle empty or whitespace-only lines
  if (!lineContent || lineContent.trim() === '') {
    return null;
  }

  let content = lineContent;

  // Strip comments (everything after semicolon)
  const commentIndex = content.indexOf(';');
  if (commentIndex !== -1) {
    content = content.substring(0, commentIndex);
  }

  // Trim whitespace after comment removal
  content = content.trim();
  if (content === '') {
    return null;
  }

  // Strip label definitions (anything before and including colon)
  const colonIndex = content.indexOf(':');
  if (colonIndex !== -1) {
    content = content.substring(colonIndex + 1).trim();
    // Check if line is label-only
    if (content === '') {
      return null;
    }
  }

  // Extract first word as potential opcode
  const words = content.split(/\s+/);
  const firstWord = words[0];

  if (!firstWord || firstWord === '') {
    return null;
  }

  // Normalize to uppercase
  const opcode = firstWord.toUpperCase();

  // Return null for directives (not executable instructions)
  if (DIRECTIVES.has(opcode)) {
    return null;
  }

  return opcode;
}
