// Barrel export for editor module
// Monaco wrapper, syntax highlighting, assembly language

export { Editor, resetThemeRegistration } from './Editor';
export type { EditorOptions, EditorSettings, CursorPosition } from './Editor';
export {
  registerMicro4Language,
  resetLanguageRegistration,
  micro4LanguageId,
} from './micro4-language';

// Story 6.9: Line content parser for code-to-circuit linking
export { parseInstruction } from './parseInstruction';

// Story 6.10: Find lines with specific opcodes for circuit-to-code linking
export { findLinesWithOpcodes } from './parseInstruction';
