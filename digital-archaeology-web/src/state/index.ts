// Barrel export for state module
// Store implementation, persistence layer
// Story 9.1: Implement Local Storage for Settings
// Story 9.2: Implement IndexedDB for Projects

// Settings types and defaults
export type { AppSettings, PanelWidths, EditorOptions } from './types';
export {
  DEFAULT_SETTINGS,
  PANEL_WIDTH_CONSTRAINTS,
  EDITOR_OPTIONS_CONSTRAINTS,
  isValidSettings,
  isValidPanelWidths,
  isValidEditorOptions,
} from './types';

// Project types and defaults (Story 9.2)
export type { ProjectData, ProjectCursorPosition, Breakpoint } from './types';
export {
  DEFAULT_PROJECT,
  isValidProjectData,
  isValidCursorPosition,
  isValidBreakpoint,
} from './types';

// Settings storage service
export { SettingsStorage, SETTINGS_STORAGE_KEY, LEGACY_THEME_KEY } from './SettingsStorage';

// Project storage service (Story 9.2)
export {
  ProjectStorage,
  PROJECT_DB_NAME,
  PROJECT_DB_VERSION,
  PROJECT_STORE_NAME,
  CURRENT_PROJECT_KEY,
} from './ProjectStorage';

// Auto-save manager (Story 9.2)
export { AutoSaveManager } from './AutoSaveManager';
export type { SaveCallback } from './AutoSaveManager';
