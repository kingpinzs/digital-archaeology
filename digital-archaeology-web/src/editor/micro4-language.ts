// src/editor/micro4-language.ts
// Micro4 assembly language definition for Monaco Editor

import * as monaco from 'monaco-editor';

/**
 * Language identifier for Micro4 assembly.
 */
export const micro4LanguageId = 'micro4';

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
 * @see registerMicro4Language
 */
export function resetLanguageRegistration(): void {
  languageRegisteredGlobally = false;
}

/**
 * Language configuration for bracket matching, comments, etc.
 */
export const micro4LanguageConfiguration: monaco.languages.LanguageConfiguration =
  {
    comments: {
      lineComment: ';',
    },
    brackets: [],
    autoClosingPairs: [],
    surroundingPairs: [],
  };

/**
 * Monarch tokenizer definition for Micro4 assembly.
 * Defines syntax highlighting rules for the language.
 *
 * Token arrays (controlKeywords, memoryKeywords, directives) are used by
 * the tokenizer rules via @arrayName syntax for maintainability.
 */
export const micro4MonarchLanguage: monaco.languages.IMonarchLanguage = {
  // Assembly is case-insensitive
  ignoreCase: true,

  // Token classes used by @arrayName references in tokenizer rules
  // Adding new instructions? Just update the appropriate array below.
  controlKeywords: ['HLT', 'JMP', 'JZ'],
  memoryKeywords: ['LDA', 'STA', 'ADD', 'SUB', 'LDI'],
  directives: ['ORG', 'DB'],

  tokenizer: {
    root: [
      // Whitespace - skip
      [/\s+/, 'white'],

      // Comments: semicolon to end of line
      [/;.*$/, 'comment'],

      // Labels: identifier followed by colon (must come before identifier rule)
      [/[a-zA-Z_][a-zA-Z0-9_]*:/, 'label'],

      // Hex numbers: 0x00 - 0xFF (must come before decimal to match 0x prefix first)
      [/0[xX][0-9a-fA-F]+/, 'number.hex'],

      // Decimal numbers: 0-255
      [/\d+/, 'number'],

      // Identifiers and keywords - use @arrayName to reference token arrays
      [
        /[a-zA-Z_]\w*/,
        {
          cases: {
            '@controlKeywords': 'keyword.control',
            '@memoryKeywords': 'keyword',
            '@directives': 'directive',
            '@default': 'identifier',
          },
        },
      ],
    ],
  },
};

/**
 * Register the Micro4 language with Monaco Editor.
 * Safe to call multiple times - only registers once globally.
 */
export function registerMicro4Language(): void {
  if (languageRegisteredGlobally) return;

  // Register the language ID
  monaco.languages.register({ id: micro4LanguageId });

  // Register language configuration (comments, brackets, etc.)
  monaco.languages.setLanguageConfiguration(
    micro4LanguageId,
    micro4LanguageConfiguration
  );

  // Register the tokenizer for syntax highlighting
  monaco.languages.setMonarchTokensProvider(
    micro4LanguageId,
    micro4MonarchLanguage
  );

  languageRegisteredGlobally = true;
}
