// Barrel export for state module
// Store implementation, persistence layer
// Story 9.1: Implement Local Storage for Settings

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

// Settings storage service
export { SettingsStorage, SETTINGS_STORAGE_KEY, LEGACY_THEME_KEY } from './SettingsStorage';
