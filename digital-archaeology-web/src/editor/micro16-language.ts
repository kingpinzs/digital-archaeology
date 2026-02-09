// src/editor/micro16-language.ts
// Micro16 assembly language definition for Monaco Editor (Story 11.4)

import * as monaco from 'monaco-editor';

/**
 * Language identifier for Micro16 assembly.
 */
export const micro16LanguageId = 'micro16';

/**
 * Module-level flag to track if language has been registered globally.
 * Monaco languages are global, so we only need to register once per application.
 */
let languageRegisteredGlobally = false;

/**
 * Reset the global language registration state.
 *
 * **WARNING: Internal testing utility only.**
 * Do not call in production code.
 *
 * @internal
 * @see registerMicro16Language
 */
export function resetLanguageRegistration(): void {
  languageRegisteredGlobally = false;
}

/**
 * Language configuration for bracket matching, comments, etc.
 */
export const micro16LanguageConfiguration: monaco.languages.LanguageConfiguration =
  {
    comments: {
      lineComment: ';',
    },
    brackets: [],
    autoClosingPairs: [],
    surroundingPairs: [],
  };

/**
 * Monarch tokenizer definition for Micro16 assembly.
 * Defines syntax highlighting rules for the 16-bit CPU stage.
 *
 * Micro16 has ~120+ instructions extending the Micro8 instruction set.
 * Key additions over Micro8:
 * - Hardware multiply/divide (MUL, IMUL, DIV, IDIV)
 * - Segment registers (CS, DS, SS, ES)
 * - String operations (MOVSB, CMPSB, STOSB, etc.)
 * - Loop instructions (LOOP, LOOPZ, LOOPNZ)
 * - Stack frame management (ENTER, LEAVE)
 * - Far calls/returns (RETF)
 * - Additional conditional jumps (JL, JG, JLE, JGE, JA, JBE, etc.)
 */
export const micro16MonarchLanguage: monaco.languages.IMonarchLanguage = {
  // Assembly is case-insensitive
  ignoreCase: true,

  // System/control keywords (pink - keyword.control)
  controlKeywords: [
    'HLT', 'NOP', 'WAIT', 'CLI', 'STI', 'CLC', 'STC', 'CMC', 'CLD', 'STD',
    'PUSHF', 'POPF', 'IRET', 'PUSHA', 'POPA',
  ],

  // Jump/branch keywords (pink - keyword.jump)
  jumpKeywords: [
    'JMP', 'JZ', 'JE', 'JNZ', 'JNE', 'JC', 'JB', 'JNC', 'JAE',
    'JS', 'JNS', 'JO', 'JNO',
    'JL', 'JGE', 'JLE', 'JG', 'JA', 'JBE',
    'JR', 'JP',
    'LOOP', 'LOOPZ', 'LOOPE', 'LOOPNZ', 'LOOPNE',
  ],

  // Memory/data movement keywords (cyan - keyword)
  memoryKeywords: [
    'MOV', 'LD', 'ST', 'LDB', 'STB', 'LEA', 'LDS', 'LES', 'XCHG',
  ],

  // Arithmetic keywords (cyan - keyword.arithmetic)
  arithmeticKeywords: [
    'ADD', 'ADC', 'SUB', 'SBC', 'CMP', 'NEG', 'INC', 'DEC',
    'MUL', 'IMUL', 'DIV', 'IDIV', 'TEST',
  ],

  // Logic/bitwise keywords (cyan - keyword.logic)
  logicKeywords: [
    'AND', 'OR', 'XOR', 'NOT',
    'SHL', 'SHR', 'SAR', 'ROL', 'ROR', 'RCL', 'RCR',
  ],

  // Stack/subroutine keywords (green - keyword.stack)
  stackKeywords: [
    'PUSH', 'POP', 'ENTER', 'LEAVE', 'RET', 'RETF', 'CALL',
  ],

  // String operation keywords (green - keyword.string)
  stringKeywords: [
    'MOVSB', 'MOVSW', 'CMPSB', 'CMPSW', 'STOSB', 'STOSW', 'LODSB', 'LODSW',
    'REP', 'REPZ', 'REPE', 'REPNZ', 'REPNE',
  ],

  // I/O keywords (orange - keyword.io)
  ioKeywords: ['IN', 'OUT', 'INB', 'OUTB', 'INT'],

  // Assembler directives (purple - directive)
  directives: ['ORG', 'SEGMENT', 'DB', 'DW', 'DD', 'DS', 'EQU'],

  // Register names (yellow - register)
  registers: [
    'R0', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7',
    'AX', 'BX', 'CX', 'DX', 'SI', 'DI', 'BP',
    'SP',
    'CS', 'DS', 'SS', 'ES',
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

      // Dot-prefixed directives (.BYTE, .WORD, .DWORD, .SPACE)
      [/\.[a-zA-Z]+/, 'directive'],

      // Hex numbers: 0x0000 - 0xFFFFFFFF
      [/0[xX][0-9a-fA-F]+/, 'number.hex'],

      // Binary numbers: 0b0000
      [/0[bB][01]+/, 'number.binary'],

      // Decimal numbers
      [/\d+/, 'number'],

      // Hash prefix for immediates (#42, #0xFF)
      [/#/, 'operator'],

      // Identifiers and keywords
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
            '@stringKeywords': 'keyword.string',
            '@ioKeywords': 'keyword.io',
            '@directives': 'directive',
            '@registers': 'register',
            '@default': 'identifier',
          },
        },
      ],

      // Square brackets for memory addressing [addr], [SI+offset]
      [/[[\]]/, 'delimiter.bracket'],

      // Plus/minus for offsets
      [/[+\-]/, 'operator'],

      // Comma separator
      [/,/, 'delimiter'],

      // Colon for segment override (DS:SI)
      [/:/, 'operator'],
    ],
  },
};

/**
 * Register the Micro16 language with Monaco Editor.
 * Safe to call multiple times - only registers once globally.
 */
export function registerMicro16Language(): void {
  if (languageRegisteredGlobally) return;

  // Register the language ID
  monaco.languages.register({ id: micro16LanguageId });

  // Register language configuration (comments, brackets, etc.)
  monaco.languages.setLanguageConfiguration(
    micro16LanguageId,
    micro16LanguageConfiguration
  );

  // Register the tokenizer for syntax highlighting
  monaco.languages.setMonarchTokensProvider(
    micro16LanguageId,
    micro16MonarchLanguage
  );

  languageRegisteredGlobally = true;
}
