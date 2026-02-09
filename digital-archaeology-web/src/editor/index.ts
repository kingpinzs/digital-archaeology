// Barrel export for editor module
// Monaco wrapper, syntax highlighting, assembly language

export { Editor, resetThemeRegistration } from './Editor';
export type { EditorOptions, EditorSettings, CursorPosition } from './Editor';
export {
  registerMicro4Language,
  resetLanguageRegistration,
  micro4LanguageId,
} from './micro4-language';

// Story 11.4: Centralized language registration and stage-to-language lookup
export { registerAllLanguages, getLanguageIdForStage } from './languageRegistry';
export { micro8LanguageId, resetLanguageRegistration as resetMicro8LanguageRegistration } from './micro8-language';
export { micro16LanguageId, resetLanguageRegistration as resetMicro16LanguageRegistration } from './micro16-language';

// Story 6.9: Line content parser for code-to-circuit linking
export { parseInstruction } from './parseInstruction';

// Story 6.10: Find lines with specific opcodes for circuit-to-code linking
export { findLinesWithOpcodes } from './parseInstruction';
