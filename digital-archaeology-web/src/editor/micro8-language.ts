// src/editor/micro8-language.ts
// Micro8 assembly language definition for Monaco Editor (Stories 11.4, 12.3)

import * as monaco from 'monaco-editor';

/**
 * Language identifier for Micro8 assembly.
 */
export const micro8LanguageId = 'micro8';

/**
 * Module-level flag to track if language has been registered globally.
 * Monaco languages are global, so we only need to register once per application.
 */
let languageRegisteredGlobally = false;

/**
 * Reset the global language registration state.
 *
 * **WARNING: Internal testing utility only.**
 * Do not call in production code. This function exists solely to allow
 * unit tests to verify language registration behavior by resetting the
 * module-level state between test cases.
 *
 * @internal
 * @see registerMicro8Language
 */
export function resetLanguageRegistration(): void {
  languageRegisteredGlobally = false;
}

/**
 * Language configuration for bracket matching, comments, etc.
 */
export const micro8LanguageConfiguration: monaco.languages.LanguageConfiguration =
  {
    comments: {
      lineComment: ';',
    },
    brackets: [],
    autoClosingPairs: [],
    surroundingPairs: [],
  };

/**
 * Monarch tokenizer definition for Micro8 assembly.
 * Defines syntax highlighting rules for the 8-bit CPU stage.
 *
 * Micro8 has ~80 instructions organized into semantic categories:
 * - System/control flow
 * - Data movement (register, memory, immediate)
 * - Arithmetic and comparison
 * - Logic and bitwise operations
 * - Stack and subroutine operations
 * - I/O and flag manipulation
 *
 * Token arrays are used by the tokenizer rules via @arrayName syntax.
 */
export const micro8MonarchLanguage: monaco.languages.IMonarchLanguage = {
  // Assembly is case-insensitive
  ignoreCase: true,

  // System/control keywords (pink - keyword.control)
  controlKeywords: ['HLT', 'NOP', 'EI', 'DI'],

  // Jump/branch keywords (pink - keyword.jump)
  jumpKeywords: [
    'JMP', 'JZ', 'JNZ', 'JC', 'JNC', 'JS', 'JNS', 'JO', 'JNO', 'JP',
    'JR', 'JRZ', 'JRNZ', 'JRC', 'JRNC',
  ],

  // Memory/data movement keywords (cyan - keyword)
  memoryKeywords: [
    'LDI', 'LD', 'ST', 'LDZ', 'STZ', 'LDI16', 'MOV', 'MOV16',
  ],

  // Arithmetic keywords (cyan - keyword.arithmetic)
  arithmeticKeywords: [
    'ADD', 'ADC', 'SUB', 'SBC', 'ADDI', 'SUBI',
    'INC', 'DEC', 'INC16', 'DEC16', 'ADD16',
    'NEG', 'CMP', 'CMPI',
  ],

  // Logic/bitwise keywords (cyan - keyword.logic)
  logicKeywords: [
    'AND', 'OR', 'XOR', 'NOT', 'ANDI', 'ORI', 'XORI',
    'SHL', 'SHR', 'SAR', 'ROL', 'ROR', 'SWAP',
  ],

  // Stack/subroutine keywords (green - keyword.stack)
  stackKeywords: [
    'PUSH', 'POP', 'PUSH16', 'POP16', 'PUSHF', 'POPF',
    'CALL', 'RET', 'RETI',
  ],

  // I/O keywords (orange - keyword.io)
  ioKeywords: ['IN', 'OUT'],

  // Flag manipulation keywords (purple - keyword.flag)
  flagKeywords: ['SCF', 'CCF', 'CMF'],

  // Assembler directives (purple - directive)
  directives: ['ORG', 'DB', 'DW', 'DS', 'EQU'],

  // Register names (yellow - register)
  registers: [
    'R0', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7',
    'A', 'B', 'C', 'D', 'E', 'H', 'L',
    'SP', 'PC', 'HL', 'BC', 'DE',
  ],

  tokenizer: {
    root: [
      // Whitespace - skip
      [/\s+/, 'white'],

      // Comments: semicolon to end of line
      [/;.*$/, 'comment'],

      // Labels: identifier followed by colon
      // IMPORTANT: Must come BEFORE the identifier rule below, otherwise the identifier
      // pattern would consume "LOOP" from "LOOP:" and the colon would tokenize separately.
      [/[a-zA-Z_][a-zA-Z0-9_]*:/, 'label'],

      // Hex numbers: 0x00 - 0xFFFF (must come before decimal to match 0x prefix first)
      [/0[xX][0-9a-fA-F]+/, 'number.hex'],

      // Binary numbers: 0b0000 - 0b11111111
      [/0[bB][01]+/, 'number.binary'],

      // Decimal numbers
      [/\d+/, 'number'],

      // Hash prefix for immediates (#42, #0xFF)
      [/#/, 'operator'],

      // Identifiers and keywords - use @arrayName to reference token arrays
      [
        /[a-zA-Z_]\w*/,
        {
          cases: {
            '@controlKeywords': 'keyword.control',
            '@jumpKeywords': 'keyword.jump',
            '@memoryKeywords': 'keyword',
            '@arithmeticKeywords': 'keyword.arithmetic',
            '@logicKeywords': 'keyword.logic',
            '@stackKeywords': 'keyword.stack',
            '@ioKeywords': 'keyword.io',
            '@flagKeywords': 'keyword.flag',
            '@directives': 'directive',
            '@registers': 'register',
            '@default': 'identifier',
          },
        },
      ],

      // Square brackets for indirect addressing [HL], [addr]
      [/[[\]]/, 'delimiter.bracket'],

      // Plus/minus for offsets [HL+5]
      [/[+\-]/, 'operator'],

      // Comma separator
      [/,/, 'delimiter'],
    ],
  },
};

/**
 * Register the Micro8 language with Monaco Editor.
 * Safe to call multiple times - only registers once globally.
 */
export function registerMicro8Language(): void {
  if (languageRegisteredGlobally) return;

  // Register the language ID
  monaco.languages.register({ id: micro8LanguageId });

  // Register language configuration (comments, brackets, etc.)
  monaco.languages.setLanguageConfiguration(
    micro8LanguageId,
    micro8LanguageConfiguration
  );

  // Register the tokenizer for syntax highlighting
  monaco.languages.setMonarchTokensProvider(
    micro8LanguageId,
    micro8MonarchLanguage
  );

  languageRegisteredGlobally = true;
}
