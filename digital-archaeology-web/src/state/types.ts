// src/state/types.ts
// Settings type definitions and defaults for application persistence
// Story 9.1: Implement Local Storage for Settings

import type { ThemeMode } from '../ui/theme';

/**
 * Panel width settings in pixels.
 */
export interface PanelWidths {
  /** Code panel width (minimum 250px) */
  code: number;
  /** State panel width (minimum 200px) */
  state: number;
}

/**
 * Monaco editor preferences to persist.
 */
export interface EditorOptions {
  /** Font size in pixels (8-32) */
  fontSize: number;
  /** Tab size in spaces (1-8) */
  tabSize: number;
  /** Word wrap mode */
  wordWrap: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
  /** Whether minimap is visible */
  minimap: boolean;
}

/**
 * Complete application settings structure.
 * Max 2 levels of nesting per project-context.md rules.
 */
export interface AppSettings {
  /** Theme mode: lab or story */
  theme: ThemeMode;
  /** Execution speed in Hz (1-1000) */
  speed: number;
  /** Panel widths in pixels */
  panelWidths: PanelWidths;
  /** Monaco editor preferences */
  editorOptions: EditorOptions;
  /** Version for migration support */
  version: number;
}

/**
 * Default settings used for first-run and fallback.
 */
export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'lab',
  speed: 60,
  panelWidths: {
    code: 350,
    state: 280,
  },
  editorOptions: {
    fontSize: 14,
    tabSize: 2,
    wordWrap: 'off', // Matches Editor.ts default
    minimap: false, // Matches Editor.ts: minimap disabled for panel space
  },
  version: 1,
};

/**
 * Panel width constraints in pixels.
 * Matches PANEL_CONSTRAINTS in PanelResizer.ts.
 */
export const PANEL_WIDTH_CONSTRAINTS = {
  CODE_MIN: 250,
  STATE_MIN: 200,
} as const;

/**
 * Editor options constraints.
 */
export const EDITOR_OPTIONS_CONSTRAINTS = {
  FONT_SIZE_MIN: 8,
  FONT_SIZE_MAX: 32,
  TAB_SIZE_MIN: 1,
  TAB_SIZE_MAX: 8,
  VALID_WORD_WRAP: ['on', 'off', 'wordWrapColumn', 'bounded'] as const,
} as const;

/**
 * Type guard for PanelWidths.
 * Validates structure and constraints.
 */
export function isValidPanelWidths(value: unknown): value is PanelWidths {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.code === 'number' &&
    obj.code >= PANEL_WIDTH_CONSTRAINTS.CODE_MIN &&
    typeof obj.state === 'number' &&
    obj.state >= PANEL_WIDTH_CONSTRAINTS.STATE_MIN
  );
}

/**
 * Type guard for EditorOptions.
 * Validates structure and constraints.
 */
export function isValidEditorOptions(value: unknown): value is EditorOptions {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.fontSize === 'number' &&
    obj.fontSize >= EDITOR_OPTIONS_CONSTRAINTS.FONT_SIZE_MIN &&
    obj.fontSize <= EDITOR_OPTIONS_CONSTRAINTS.FONT_SIZE_MAX &&
    typeof obj.tabSize === 'number' &&
    obj.tabSize >= EDITOR_OPTIONS_CONSTRAINTS.TAB_SIZE_MIN &&
    obj.tabSize <= EDITOR_OPTIONS_CONSTRAINTS.TAB_SIZE_MAX &&
    typeof obj.wordWrap === 'string' &&
    EDITOR_OPTIONS_CONSTRAINTS.VALID_WORD_WRAP.includes(
      obj.wordWrap as (typeof EDITOR_OPTIONS_CONSTRAINTS.VALID_WORD_WRAP)[number]
    ) &&
    typeof obj.minimap === 'boolean'
  );
}

/**
 * Type guard for AppSettings.
 * Validates complete settings structure and all nested values.
 */
export function isValidSettings(value: unknown): value is AppSettings {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    (obj.theme === 'lab' || obj.theme === 'story') &&
    typeof obj.speed === 'number' &&
    obj.speed >= 1 &&
    obj.speed <= 1000 &&
    isValidPanelWidths(obj.panelWidths) &&
    isValidEditorOptions(obj.editorOptions) &&
    typeof obj.version === 'number'
  );
}
