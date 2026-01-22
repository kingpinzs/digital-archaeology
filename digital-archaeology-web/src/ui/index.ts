// Barrel export for ui module
// Shared UI: toolbar, panels, theming

// Theme system exports
export { setTheme, getTheme, toggleTheme, initTheme } from './theme';
export type { ThemeMode } from './theme';

// Application shell exports
export { App } from './App';

// Panel resizer exports
export { PanelResizer, PANEL_CONSTRAINTS } from './PanelResizer';
export type { PanelResizerOptions } from './PanelResizer';

// Toolbar exports
export { Toolbar } from './Toolbar';
export type { ToolbarState, ToolbarCallbacks } from './Toolbar';

// MenuBar exports
export { MenuBar } from './MenuBar';
export type { AppMode, MenuBarState, MenuBarCallbacks, PanelStates } from './MenuBar';

// StatusBar exports
export { StatusBar } from './StatusBar';
export type { AssemblyStatus, CursorPosition, StatusBarState } from './StatusBar';

// PanelHeader exports
export { PanelHeader } from './PanelHeader';
export type { PanelId, PanelHeaderOptions } from './PanelHeader';
