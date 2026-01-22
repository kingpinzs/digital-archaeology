// Barrel export for editor module
// Monaco wrapper, syntax highlighting, assembly language

export { Editor, resetThemeRegistration } from './Editor';
export type { EditorOptions } from './Editor';
export {
  registerMicro4Language,
  resetLanguageRegistration,
  micro4LanguageId,
} from './micro4-language';
