// src/editor/Editor.ts
// Monaco Editor wrapper component for the code panel

import * as monaco from 'monaco-editor';

/**
 * Configuration options for the Editor component.
 */
export interface EditorOptions {
  /** Initial content to display in the editor */
  initialValue?: string;
  /** Whether the editor is read-only */
  readOnly?: boolean;
}

/**
 * Digital Archaeology dark theme colors matching CSS variables.
 * Monaco themes cannot use CSS variables directly, so we use the actual values.
 */
const DA_DARK_THEME_COLORS = {
  'editor.background': '#252542',
  'editor.foreground': '#e0e0e0',
  'editorLineNumber.foreground': '#a0a0b0',
  'editorLineNumber.activeForeground': '#e0e0e0',
  'editorCursor.foreground': '#00b4d8',
  'editor.selectionBackground': '#2f2f5280',
  'editor.lineHighlightBackground': '#2f2f52',
  'editor.inactiveSelectionBackground': '#2f2f5240',
  'editorIndentGuide.background': '#2f2f52',
  'editorIndentGuide.activeBackground': '#404060',
  'editorWidget.background': '#1a1a30',
  'editorWidget.border': '#404060',
  'input.background': '#1a1a30',
  'input.border': '#404060',
  'input.foreground': '#e0e0e0',
  'scrollbarSlider.background': '#40406080',
  'scrollbarSlider.hoverBackground': '#505070',
  'scrollbarSlider.activeBackground': '#606080',
} as const;

/**
 * Module-level flag to track if theme has been registered globally.
 * Monaco themes are global, so we only need to register once per application.
 */
let themeRegisteredGlobally = false;

/**
 * Reset the global theme registration state.
 * Only used for testing - allows tests to verify theme registration behavior.
 * @internal
 */
export function resetThemeRegistration(): void {
  themeRegisteredGlobally = false;
}

/**
 * Monaco Editor wrapper component.
 * Follows the mount/destroy pattern established in Epic 1.
 */
export class Editor {
  private container: HTMLElement | null = null;
  private editor: monaco.editor.IStandaloneCodeEditor | null = null;
  private options: EditorOptions;

  constructor(options?: EditorOptions) {
    this.options = options ?? {};
  }

  /**
   * Mount the editor to a container element.
   * @param container - The HTML element to mount the editor to
   */
  mount(container: HTMLElement): void {
    this.container = container;
    this.registerTheme();
    this.createEditor();
  }

  /**
   * Register the custom dark theme if not already registered globally.
   * Uses module-level flag since Monaco themes are global state.
   */
  private registerTheme(): void {
    if (themeRegisteredGlobally) return;

    monaco.editor.defineTheme('da-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: { ...DA_DARK_THEME_COLORS },
    });

    themeRegisteredGlobally = true;
  }

  /**
   * Create the Monaco editor instance.
   */
  private createEditor(): void {
    if (!this.container) return;

    this.editor = monaco.editor.create(this.container, {
      value: this.options.initialValue ?? '',
      language: 'plaintext', // Will be 'micro4' after Story 2.2
      theme: 'da-dark',
      automaticLayout: true, // Handle panel resize automatically
      minimap: { enabled: false }, // Disable minimap for panel space
      lineNumbers: 'on',
      readOnly: this.options.readOnly ?? false,
      scrollBeyondLastLine: false,
      fontSize: 14,
      fontFamily: "'SF Mono', 'Consolas', 'Monaco', 'Liberation Mono', monospace",
      fontLigatures: false,
      renderWhitespace: 'selection',
      tabSize: 2,
      insertSpaces: true,
      wordWrap: 'off',
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      smoothScrolling: true,
      ariaLabel: 'Assembly Code Editor',
      // Accessibility
      accessibilitySupport: 'auto',
      // Performance
      renderValidationDecorations: 'on',
      // Remove extra chrome
      folding: false,
      glyphMargin: false,
      lineDecorationsWidth: 0,
      lineNumbersMinChars: 3,
      overviewRulerBorder: false,
      overviewRulerLanes: 0,
      hideCursorInOverviewRuler: true,
      scrollbar: {
        useShadows: false,
        verticalHasArrows: false,
        horizontalHasArrows: false,
        vertical: 'auto',
        horizontal: 'auto',
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10,
      },
    });
  }

  /**
   * Get the current editor content.
   * @returns The editor content as a string
   */
  getValue(): string {
    return this.editor?.getValue() ?? '';
  }

  /**
   * Set the editor content.
   * @param content - The content to set
   */
  setValue(content: string): void {
    this.editor?.setValue(content);
  }

  /**
   * Get the text model for advanced operations.
   * @returns The Monaco text model or null if not available
   */
  getModel(): monaco.editor.ITextModel | null {
    return this.editor?.getModel() ?? null;
  }

  /**
   * Focus the editor.
   */
  focus(): void {
    this.editor?.focus();
  }

  /**
   * Get the raw Monaco editor instance.
   * @returns The Monaco editor instance or null if not mounted
   */
  getMonacoEditor(): monaco.editor.IStandaloneCodeEditor | null {
    return this.editor;
  }

  /**
   * Force a layout update. Useful when container size changes
   * and automaticLayout doesn't catch it.
   */
  layout(): void {
    this.editor?.layout();
  }

  /**
   * Check if the editor is mounted.
   * @returns true if mounted, false otherwise
   */
  isMounted(): boolean {
    return this.editor !== null;
  }

  /**
   * Destroy the editor and clean up resources.
   */
  destroy(): void {
    if (this.editor) {
      this.editor.dispose();
      this.editor = null;
    }
    this.container = null;
  }
}
