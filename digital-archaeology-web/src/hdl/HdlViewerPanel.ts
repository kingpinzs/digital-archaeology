// src/hdl/HdlViewerPanel.ts
// HDL Viewer Panel component using Monaco Editor in read-only mode
// Story 7.1: Create HDL Viewer Panel

import * as monaco from 'monaco-editor';
import { HdlLoader, DEFAULT_HDL_PATH } from './HdlLoader';

/**
 * Configuration options for HdlViewerPanel.
 */
export interface HdlViewerPanelOptions {
  /** Path to the HDL file to load (defaults to Micro4 CPU) */
  hdlPath?: string;
  /** Callback when panel is closed */
  onClose?: () => void;
  /** Callback when HDL content is loaded */
  onLoad?: (content: string) => void;
  /** Callback when loading fails */
  onError?: (error: string) => void;
}

/**
 * Monaco theme colors for HDL viewer (matching Editor.ts da-dark theme).
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
 * Module-level flag to track if HDL theme has been registered.
 */
let hdlThemeRegistered = false;

/**
 * Reset theme registration state (for testing).
 * @internal
 */
export function resetHdlThemeRegistration(): void {
  hdlThemeRegistered = false;
}

/**
 * HDL Viewer Panel component.
 * Displays HDL file content in a Monaco editor with read-only mode.
 * Follows mount/destroy lifecycle pattern.
 */
export class HdlViewerPanel {
  private container: HTMLElement | null = null;
  private panelElement: HTMLElement | null = null;
  private editorContainer: HTMLElement | null = null;
  private editor: monaco.editor.IStandaloneCodeEditor | null = null;
  private options: HdlViewerPanelOptions;
  private loader: HdlLoader;
  private visible = false;
  private previouslyFocusedElement: HTMLElement | null = null;
  private boundKeydownHandler: ((e: KeyboardEvent) => void) | null = null;
  private announcerElement: HTMLElement | null = null;

  constructor(options: HdlViewerPanelOptions = {}) {
    this.options = options;
    this.loader = new HdlLoader(options.hdlPath ?? DEFAULT_HDL_PATH);
  }

  /**
   * Mount the panel to a container element.
   * @param container - The HTML element to mount to
   */
  mount(container: HTMLElement): void {
    this.container = container;
    this.registerTheme();
    this.createPanel();
    this.createEditor();
    this.setupKeyboardHandling();
    this.createAnnouncer();
  }

  /**
   * Create a screen reader announcer element for accessibility.
   */
  private createAnnouncer(): void {
    this.announcerElement = document.createElement('div');
    this.announcerElement.setAttribute('role', 'status');
    this.announcerElement.setAttribute('aria-live', 'polite');
    this.announcerElement.setAttribute('aria-atomic', 'true');
    this.announcerElement.className = 'da-sr-only';
    // Visually hidden but accessible to screen readers
    this.announcerElement.style.cssText =
      'position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;';
    document.body.appendChild(this.announcerElement);
  }

  /**
   * Announce a message to screen readers.
   */
  private announce(message: string): void {
    if (this.announcerElement) {
      // Clear and set to trigger announcement
      this.announcerElement.textContent = '';
      // Use setTimeout to ensure the change is detected
      setTimeout(() => {
        if (this.announcerElement) {
          this.announcerElement.textContent = message;
        }
      }, 50);
    }
  }

  /**
   * Register the HDL viewer theme if not already registered.
   */
  private registerTheme(): void {
    if (hdlThemeRegistered) return;

    monaco.editor.defineTheme('da-dark-hdl', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        // Comments (muted gray-blue)
        { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
      ],
      colors: { ...DA_DARK_THEME_COLORS },
    });

    hdlThemeRegistered = true;
  }

  /**
   * Create the panel DOM structure.
   */
  private createPanel(): void {
    if (!this.container) return;

    // Create panel wrapper
    this.panelElement = document.createElement('div');
    this.panelElement.className = 'da-hdl-viewer-panel da-hdl-viewer-panel--hidden';
    this.panelElement.setAttribute('role', 'dialog');
    this.panelElement.setAttribute('aria-modal', 'true');
    this.panelElement.setAttribute('aria-labelledby', 'da-hdl-viewer-title');

    // Create header
    const header = document.createElement('div');
    header.className = 'da-hdl-viewer-header';

    const title = document.createElement('h2');
    title.id = 'da-hdl-viewer-title';
    title.className = 'da-hdl-viewer-title';
    title.textContent = 'HDL Viewer';

    const closeButton = document.createElement('button');
    closeButton.className = 'da-hdl-viewer-close';
    closeButton.setAttribute('aria-label', 'Close HDL Viewer');
    closeButton.textContent = '\u00D7'; // × character
    closeButton.addEventListener('click', () => this.hide());

    header.appendChild(title);
    header.appendChild(closeButton);

    // Create editor container
    this.editorContainer = document.createElement('div');
    this.editorContainer.className = 'da-hdl-viewer-editor';

    // Create loading indicator
    const loading = document.createElement('div');
    loading.className = 'da-hdl-viewer-loading';
    loading.setAttribute('aria-live', 'polite');
    loading.textContent = 'Loading HDL file...';

    // Assemble panel
    this.panelElement.appendChild(header);
    this.panelElement.appendChild(this.editorContainer);
    this.panelElement.appendChild(loading);

    this.container.appendChild(this.panelElement);
  }

  /**
   * Create the Monaco editor instance.
   */
  private createEditor(): void {
    if (!this.editorContainer) return;

    this.editor = monaco.editor.create(this.editorContainer, {
      value: '',
      language: 'text', // Syntax highlighting in Story 7.2
      theme: 'da-dark-hdl',
      automaticLayout: true,
      minimap: { enabled: true, scale: 1 },
      lineNumbers: 'on',
      readOnly: true,
      scrollBeyondLastLine: false,
      fontSize: 13,
      fontFamily: "'SF Mono', 'Consolas', 'Monaco', 'Liberation Mono', monospace",
      fontLigatures: false,
      renderWhitespace: 'none',
      tabSize: 2,
      wordWrap: 'off',
      folding: true,
      glyphMargin: false,
      lineDecorationsWidth: 0,
      lineNumbersMinChars: 4,
      overviewRulerBorder: false,
      ariaLabel: 'HDL File Viewer (Read Only)',
      accessibilitySupport: 'auto',
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
   * Set up keyboard handling for Escape key.
   */
  private setupKeyboardHandling(): void {
    this.boundKeydownHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.visible) {
        this.hide();
      }
    };
    document.addEventListener('keydown', this.boundKeydownHandler);
  }

  /**
   * Load and display HDL content.
   */
  async loadContent(): Promise<void> {
    if (!this.panelElement) return;

    const loadingElement = this.panelElement.querySelector('.da-hdl-viewer-loading');
    if (loadingElement) {
      loadingElement.textContent = 'Loading HDL file...';
      loadingElement.classList.remove('da-hdl-viewer-loading--hidden');
      loadingElement.classList.remove('da-hdl-viewer-loading--error');
    }

    const result = await this.loader.load();

    if (loadingElement) {
      if (result.state === 'success' && result.content) {
        loadingElement.classList.add('da-hdl-viewer-loading--hidden');
        this.setContent(result.content);
        this.options.onLoad?.(result.content);
      } else if (result.state === 'error') {
        loadingElement.textContent = result.error ?? 'Failed to load HDL file';
        loadingElement.classList.add('da-hdl-viewer-loading--error');
        this.options.onError?.(result.error ?? 'Unknown error');
      }
    }
  }

  /**
   * Set the editor content.
   * @param content - The HDL content to display
   */
  setContent(content: string): void {
    this.editor?.setValue(content);
  }

  /**
   * Get the current editor content.
   */
  getContent(): string {
    return this.editor?.getValue() ?? '';
  }

  /**
   * Show the panel.
   */
  async show(): Promise<void> {
    if (!this.panelElement) return;

    // Store previously focused element for restoration
    this.previouslyFocusedElement = document.activeElement as HTMLElement;

    this.panelElement.classList.remove('da-hdl-viewer-panel--hidden');
    this.visible = true;

    // Announce to screen readers
    this.announce('HDL Viewer panel opened');

    // Load content if not already loaded
    if (this.loader.getState() === 'idle') {
      await this.loadContent();
    }

    // Focus the editor
    this.editor?.focus();
  }

  /**
   * Hide the panel.
   */
  hide(): void {
    if (!this.panelElement) return;

    this.panelElement.classList.add('da-hdl-viewer-panel--hidden');
    this.visible = false;

    // Announce to screen readers
    this.announce('HDL Viewer panel closed');

    // Restore focus to previously focused element
    if (this.previouslyFocusedElement) {
      this.previouslyFocusedElement.focus();
      this.previouslyFocusedElement = null;
    }

    this.options.onClose?.();
  }

  /**
   * Toggle panel visibility.
   */
  async toggle(): Promise<void> {
    if (this.visible) {
      this.hide();
    } else {
      await this.show();
    }
  }

  /**
   * Check if panel is visible.
   */
  isVisible(): boolean {
    return this.visible;
  }

  /**
   * Get the panel element.
   */
  getElement(): HTMLElement | null {
    return this.panelElement;
  }

  /**
   * Get the Monaco editor instance.
   */
  getEditor(): monaco.editor.IStandaloneCodeEditor | null {
    return this.editor;
  }

  /**
   * Destroy the panel and clean up resources.
   */
  destroy(): void {
    // Remove keyboard handler
    if (this.boundKeydownHandler) {
      document.removeEventListener('keydown', this.boundKeydownHandler);
      this.boundKeydownHandler = null;
    }

    // Dispose Monaco editor
    this.editor?.dispose();
    this.editor = null;

    // Remove DOM elements
    this.panelElement?.remove();
    this.panelElement = null;
    this.editorContainer = null;
    this.container = null;

    // Remove announcer element
    this.announcerElement?.remove();
    this.announcerElement = null;

    // Reset state
    this.visible = false;
    this.previouslyFocusedElement = null;
    this.loader.reset();
  }
}
