// src/hdl/m4hdl-language.ts
// M4HDL hardware description language definition for Monaco Editor
// Story 7.2: Implement HDL Syntax Highlighting

import * as monaco from 'monaco-editor';

/**
 * Language identifier for M4HDL hardware description language.
 */
export const m4hdlLanguageId = 'm4hdl';

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
 * @see registerM4hdlLanguage
 */
export function resetM4hdlLanguageRegistration(): void {
  languageRegisteredGlobally = false;
}

/**
 * Language configuration for bracket matching, comments, etc.
 */
export const m4hdlLanguageConfiguration: monaco.languages.LanguageConfiguration =
  {
    comments: {
      lineComment: '#',
    },
    brackets: [
      ['(', ')'],
      ['[', ']'],
    ],
    autoClosingPairs: [
      { open: '(', close: ')' },
      { open: '[', close: ']' },
    ],
    surroundingPairs: [
      { open: '(', close: ')' },
      { open: '[', close: ']' },
    ],
  };

/**
 * Monarch tokenizer definition for M4HDL.
 * Defines syntax highlighting rules for the language.
 *
 * Token arrays (keywords, gateTypes, portLabels) are used by
 * the tokenizer rules via @arrayName syntax for maintainability.
 */
export const m4hdlMonarchLanguage: monaco.languages.IMonarchLanguage = {
  // HDL is case-insensitive for gate types
  ignoreCase: true,

  // Token classes used by @arrayName references in tokenizer rules
  // Keywords for wire declarations
  keywords: ['wire'],

  // Gate types for circuit elements
  gateTypes: ['and', 'or', 'xor', 'not', 'buf', 'nand', 'nor', 'mux', 'dff', 'latch'],

  // Port labels inside gate instantiations
  // NOTE: Unlike keywords/gateTypes/directives, portLabels are matched via
  // explicit regex pattern (with colon suffix) rather than @portLabels reference.
  // This array is kept for documentation and potential future tooling use.
  portLabels: ['input', 'output'],

  // Reserved for future MODULE/CHIP definitions
  directives: ['module', 'chip', 'endmodule'],

  tokenizer: {
    root: [
      // Whitespace - skip
      [/\s+/, 'white'],

      // Comments: # to end of line
      [/#.*$/, 'comment'],

      // Bit-width syntax: [7:0] or [3:0] or [N]
      [/\[\d+:\d+\]/, 'number'],
      [/\[\d+\]/, 'number'],

      // Hex numbers: 0x00 - 0xFF
      [/0[xX][0-9a-fA-F]+/, 'number.hex'],

      // Binary numbers: 0b1010
      [/0[bB][01]+/, 'number.binary'],

      // Decimal numbers
      [/\d+/, 'number'],

      // Port labels with colon: input: output:
      [
        /\b(input|output):/,
        'directive',
      ],

      // Identifiers and keywords - use @arrayName to reference token arrays
      [
        /[a-zA-Z_][a-zA-Z0-9_]*/,
        {
          cases: {
            '@keywords': 'keyword',
            '@gateTypes': 'keyword.control',
            '@directives': 'directive',
            '@default': 'identifier',
          },
        },
      ],

      // Operators and delimiters
      [/[;,()]/, 'delimiter'],
    ],
  },
};

/**
 * Register the M4HDL language with Monaco Editor.
 * Safe to call multiple times - only registers once globally.
 */
export function registerM4hdlLanguage(): void {
  if (languageRegisteredGlobally) return;

  // Register the language ID
  monaco.languages.register({ id: m4hdlLanguageId });

  // Register language configuration (comments, brackets, etc.)
  monaco.languages.setLanguageConfiguration(
    m4hdlLanguageId,
    m4hdlLanguageConfiguration
  );

  // Register the tokenizer for syntax highlighting
  monaco.languages.setMonarchTokensProvider(
    m4hdlLanguageId,
    m4hdlMonarchLanguage
  );

  languageRegisteredGlobally = true;
}
