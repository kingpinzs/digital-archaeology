// src/hdl/HdlViewerPanel.ts
// HDL Viewer Panel component using Monaco Editor in read-only mode
// Story 7.1: Create HDL Viewer Panel

import * as monaco from 'monaco-editor';
import { HdlLoader, DEFAULT_HDL_PATH } from './HdlLoader';
import { registerM4hdlLanguage, m4hdlLanguageId } from './m4hdl-language';
import { HdlValidator, HdlValidationResult } from './HdlValidator';
import { HdlParser } from './HdlParser';
import { HdlToCircuitGenerator } from './HdlToCircuitGenerator';
import { CircuitData } from '../visualizer/types';

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
  /** Callback when content is saved (Story 7.3) */
  onSave?: (content: string) => void;
  /** Callback when edit mode changes (Story 7.3) */
  onEditModeChange?: (editing: boolean) => void;
  /** Callback when HDL is validated (Story 7.4) */
  onValidate?: (result: HdlValidationResult) => void;
  /** Callback when circuit reload is requested (Story 7.5, updated 7.6) */
  onReloadCircuit?: (circuitData: CircuitData) => Promise<void>;
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
 * Displays HDL file content in a Monaco editor with read-only mode by default,
 * with optional edit mode for modifying HDL content (Story 7.3).
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

  // Story 7.3: Edit mode state
  private editMode = false;
  private originalContent = '';
  private editToggleButton: HTMLButtonElement | null = null;
  private saveButton: HTMLButtonElement | null = null;
  private dirtyIndicator: HTMLElement | null = null;
  private titleElement: HTMLElement | null = null;
  private contentChangeDisposable: monaco.IDisposable | null = null;

  // Story 7.4: Validation state
  private validateButton: HTMLButtonElement | null = null;
  private validationResultsContainer: HTMLElement | null = null;
  private validator: HdlValidator = new HdlValidator();
  private isValidating = false;
  private lastValidationResult: HdlValidationResult | null = null;

  // Story 7.6: HDL parsing and circuit generation
  private parser: HdlParser = new HdlParser();
  private circuitGenerator: HdlToCircuitGenerator = new HdlToCircuitGenerator();

  // Story 7.5: Reload circuit state
  private reloadButton: HTMLButtonElement | null = null;
  private isReloading = false;

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
    // Register M4HDL language before theme (Story 7.2)
    registerM4hdlLanguage();

    if (hdlThemeRegistered) return;

    monaco.editor.defineTheme('da-dark-hdl', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        // Comments (muted gray-blue)
        { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
        // Keywords (wire) - cyan
        { token: 'keyword', foreground: '8be9fd' },
        // Gate types (and, or, not) - pink/magenta
        { token: 'keyword.control', foreground: 'ff79c6' },
        // Directives (input:, output:, module) - orange
        { token: 'directive', foreground: 'ffb86c' },
        // Identifiers (wire names, gate names) - default foreground
        { token: 'identifier', foreground: 'f8f8f2' },
        // Numbers (bit-widths, hex, decimal) - purple
        { token: 'number', foreground: 'bd93f9' },
        { token: 'number.hex', foreground: 'bd93f9' },
        { token: 'number.binary', foreground: 'bd93f9' },
        // Delimiters - subtle gray
        { token: 'delimiter', foreground: 'a0a0b0' },
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

    // Title with dirty indicator (Story 7.3)
    const titleWrapper = document.createElement('div');
    titleWrapper.className = 'da-hdl-viewer-title-wrapper';

    this.titleElement = document.createElement('h2');
    this.titleElement.id = 'da-hdl-viewer-title';
    this.titleElement.className = 'da-hdl-viewer-title';
    this.titleElement.textContent = 'HDL Viewer';

    // Dirty indicator (Story 7.3)
    this.dirtyIndicator = document.createElement('span');
    this.dirtyIndicator.className = 'da-hdl-viewer-dirty da-hdl-viewer-dirty--hidden';
    this.dirtyIndicator.textContent = '*';
    this.dirtyIndicator.setAttribute('aria-label', 'Unsaved changes');

    titleWrapper.appendChild(this.titleElement);
    titleWrapper.appendChild(this.dirtyIndicator);

    // Button container for edit/save/close (Story 7.3)
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'da-hdl-viewer-buttons';

    // Validate button (Story 7.4) - only visible in edit mode
    this.validateButton = document.createElement('button');
    this.validateButton.className = 'da-hdl-viewer-validate da-hdl-viewer-validate--hidden';
    this.validateButton.textContent = 'Validate';
    this.validateButton.setAttribute('aria-label', 'Validate HDL syntax');
    this.validateButton.addEventListener('click', () => {
      // Only validate if not already validating (aria-disabled is just visual)
      if (!this.isValidating) {
        this.validateContent();
      }
    });

    // Reload Circuit button (Story 7.5) - only visible in edit mode
    this.reloadButton = document.createElement('button');
    this.reloadButton.className = 'da-hdl-viewer-reload da-hdl-viewer-reload--hidden';
    this.reloadButton.textContent = 'Reload Circuit';
    this.reloadButton.setAttribute('aria-label', 'Reload circuit visualization');
    this.reloadButton.setAttribute('aria-disabled', 'false');
    this.reloadButton.addEventListener('click', () => {
      // Only reload if not already reloading (aria-disabled is just visual)
      if (!this.isReloading) {
        this.reloadCircuit();
      }
    });

    // Edit toggle button (Story 7.3)
    this.editToggleButton = document.createElement('button');
    this.editToggleButton.className = 'da-hdl-viewer-edit-toggle';
    this.editToggleButton.textContent = 'Edit';
    this.editToggleButton.setAttribute('aria-pressed', 'false');
    this.editToggleButton.setAttribute('aria-label', 'Toggle edit mode');
    this.editToggleButton.addEventListener('click', () => this.toggleEditMode());

    // Save button (Story 7.3)
    this.saveButton = document.createElement('button');
    this.saveButton.className = 'da-hdl-viewer-save da-hdl-viewer-save--hidden';
    this.saveButton.textContent = 'Save';
    this.saveButton.setAttribute('aria-disabled', 'true');
    this.saveButton.setAttribute('aria-label', 'Save changes');
    this.saveButton.addEventListener('click', () => {
      // Only save if there are unsaved changes (aria-disabled is just visual)
      if (this.hasUnsavedChanges()) {
        this.saveContent();
      }
    });

    const closeButton = document.createElement('button');
    closeButton.className = 'da-hdl-viewer-close';
    closeButton.setAttribute('aria-label', 'Close HDL Viewer');
    closeButton.textContent = '\u00D7'; // × character
    closeButton.addEventListener('click', () => this.hide());

    buttonContainer.appendChild(this.validateButton);
    buttonContainer.appendChild(this.reloadButton);
    buttonContainer.appendChild(this.editToggleButton);
    buttonContainer.appendChild(this.saveButton);
    buttonContainer.appendChild(closeButton);

    header.appendChild(titleWrapper);
    header.appendChild(buttonContainer);

    // Create editor container
    this.editorContainer = document.createElement('div');
    this.editorContainer.className = 'da-hdl-viewer-editor';

    // Create loading indicator
    const loading = document.createElement('div');
    loading.className = 'da-hdl-viewer-loading';
    loading.setAttribute('aria-live', 'polite');
    loading.textContent = 'Loading HDL file...';

    // Story 7.4: Validation results container
    this.validationResultsContainer = document.createElement('div');
    this.validationResultsContainer.className = 'da-hdl-viewer-validation-results da-hdl-viewer-validation-results--hidden';
    this.validationResultsContainer.setAttribute('role', 'status');
    this.validationResultsContainer.setAttribute('aria-live', 'polite');

    // Assemble panel
    this.panelElement.appendChild(header);
    this.panelElement.appendChild(this.editorContainer);
    this.panelElement.appendChild(this.validationResultsContainer);
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
      language: m4hdlLanguageId, // Story 7.2: HDL syntax highlighting
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

    // Story 7.3: Listen for content changes
    this.contentChangeDisposable = this.editor.onDidChangeModelContent(() => {
      this.updateDirtyIndicator();
      // Story 7.4: Clear stale validation markers on content change
      this.clearValidationMarkers();
    });
  }

  /**
   * Set up keyboard handling for Escape key, Ctrl+S, and Ctrl+Shift+V.
   */
  private setupKeyboardHandling(): void {
    this.boundKeydownHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.visible) {
        this.hide();
      }
      // Story 7.3: Ctrl+S / Cmd+S to save in edit mode
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && this.visible && this.editMode) {
        e.preventDefault();
        this.saveContent();
      }
      // Story 7.4: Ctrl+Shift+V / Cmd+Shift+V to validate in edit mode
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'V' && this.visible && this.editMode) {
        e.preventDefault();
        this.validateContent();
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
    // Story 7.3: Track original content for dirty detection
    this.originalContent = content;
    this.updateDirtyIndicator();
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
   * Story 7.3: Prompts for confirmation if there are unsaved changes.
   */
  hide(): void {
    if (!this.panelElement) return;

    // Story 7.3: Check for unsaved changes
    if (this.hasUnsavedChanges()) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to close without saving?'
      );
      if (!confirmed) {
        return; // User cancelled, don't close
      }
    }

    this.forceClose();
  }

  /**
   * Force close the panel without prompting for unsaved changes.
   * Story 7.3: Use this when you want to close regardless of dirty state.
   * Resets edit mode state to ensure clean state on next show.
   */
  forceClose(): void {
    if (!this.panelElement) return;

    this.panelElement.classList.add('da-hdl-viewer-panel--hidden');
    this.visible = false;

    // Story 7.3: Reset edit mode state on close
    if (this.editMode) {
      this.editMode = false;
      this.editor?.updateOptions({ readOnly: true });
      if (this.editToggleButton) {
        this.editToggleButton.textContent = 'Edit';
        this.editToggleButton.setAttribute('aria-pressed', 'false');
      }
      if (this.titleElement) {
        this.titleElement.textContent = 'HDL Viewer';
      }
      if (this.saveButton) {
        this.saveButton.classList.add('da-hdl-viewer-save--hidden');
      }
      // Remove edit mode styling from header
      this.panelElement.classList.remove('da-hdl-viewer-panel--editing');

      // Story 7.4: Hide validate button when exiting edit mode on close
      if (this.validateButton) {
        this.validateButton.classList.add('da-hdl-viewer-validate--hidden');
      }

      // Story 7.5: Hide reload button when exiting edit mode on close
      if (this.reloadButton) {
        this.reloadButton.classList.add('da-hdl-viewer-reload--hidden');
      }
    }

    // Story 7.5: Reset reload state on close
    this.isReloading = false;
    if (this.reloadButton) {
      this.reloadButton.textContent = 'Reload Circuit';
      this.reloadButton.setAttribute('aria-disabled', 'false');
    }

    // Story 7.4: Hide validation results on close
    if (this.validationResultsContainer) {
      this.validationResultsContainer.classList.add('da-hdl-viewer-validation-results--hidden');
      this.validationResultsContainer.innerHTML = '';
    }
    this.lastValidationResult = null;

    // Story 7.4: Clear Monaco validation markers on close
    this.clearValidationMarkers();

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

  // ============================================
  // Story 7.3: Edit Mode Methods
  // ============================================

  /**
   * Check if panel is in edit mode.
   * Story 7.3: Edit mode allows modifying HDL content.
   */
  isEditMode(): boolean {
    return this.editMode;
  }

  /**
   * Check if there are unsaved changes.
   * Story 7.3: Compares current content with original loaded content.
   */
  hasUnsavedChanges(): boolean {
    const currentContent = this.editor?.getValue() ?? '';
    return currentContent !== this.originalContent;
  }

  /**
   * Toggle between edit mode and view mode.
   * Story 7.3: Switches Monaco editor readOnly state.
   */
  toggleEditMode(): void {
    this.editMode = !this.editMode;

    // Update Monaco editor readOnly option
    this.editor?.updateOptions({ readOnly: !this.editMode });

    // Update button text and aria state
    if (this.editToggleButton) {
      this.editToggleButton.textContent = this.editMode ? 'View' : 'Edit';
      this.editToggleButton.setAttribute('aria-pressed', String(this.editMode));
    }

    // Update title
    if (this.titleElement) {
      this.titleElement.textContent = this.editMode ? 'HDL Editor' : 'HDL Viewer';
    }

    // Update editor aria label
    if (this.editorContainer) {
      this.editorContainer.setAttribute(
        'aria-label',
        this.editMode ? 'HDL File Editor' : 'HDL File Viewer (Read Only)'
      );
    }

    // Show/hide save button
    if (this.saveButton) {
      if (this.editMode) {
        this.saveButton.classList.remove('da-hdl-viewer-save--hidden');
      } else {
        this.saveButton.classList.add('da-hdl-viewer-save--hidden');
      }
    }

    // Story 7.4: Show/hide validate button
    if (this.validateButton) {
      if (this.editMode) {
        this.validateButton.classList.remove('da-hdl-viewer-validate--hidden');
      } else {
        this.validateButton.classList.add('da-hdl-viewer-validate--hidden');
      }
    }

    // Story 7.5: Show/hide reload button
    if (this.reloadButton) {
      if (this.editMode) {
        this.reloadButton.classList.remove('da-hdl-viewer-reload--hidden');
      } else {
        this.reloadButton.classList.add('da-hdl-viewer-reload--hidden');
      }
    }

    // Story 7.3 Task 8.4: Toggle edit mode styling on panel (subtle header background change)
    if (this.panelElement) {
      if (this.editMode) {
        this.panelElement.classList.add('da-hdl-viewer-panel--editing');
      } else {
        this.panelElement.classList.remove('da-hdl-viewer-panel--editing');
      }
    }

    // Announce mode change
    this.announce(this.editMode ? 'Edit mode enabled' : 'View mode enabled');

    // Call callback
    this.options.onEditModeChange?.(this.editMode);
  }

  /**
   * Update the dirty indicator based on current content.
   * Story 7.3: Shows asterisk when content differs from original.
   */
  private updateDirtyIndicator(): void {
    const isDirty = this.hasUnsavedChanges();

    if (this.dirtyIndicator) {
      if (isDirty) {
        this.dirtyIndicator.classList.remove('da-hdl-viewer-dirty--hidden');
      } else {
        this.dirtyIndicator.classList.add('da-hdl-viewer-dirty--hidden');
      }
    }

    // Update save button disabled state
    if (this.saveButton) {
      this.saveButton.setAttribute('aria-disabled', String(!isDirty));
      if (isDirty) {
        this.saveButton.classList.remove('da-hdl-viewer-save--disabled');
      } else {
        this.saveButton.classList.add('da-hdl-viewer-save--disabled');
      }
    }
  }

  /**
   * Save the current content.
   * Story 7.3: Updates originalContent to match current content, clears the
   * dirty indicator, announces the save to screen readers, and calls the
   * onSave callback with the content. Safe to call even with no changes.
   * Story 7.4: Auto-validates on save.
   */
  saveContent(): void {
    const content = this.editor?.getValue() ?? '';

    // Update original content to match saved content
    this.originalContent = content;

    // Clear dirty indicator
    this.updateDirtyIndicator();

    // Story 7.4: Auto-validate on save
    this.validateContent();

    // Announce save
    this.announce('Changes saved');

    // Call callback
    this.options.onSave?.(content);
  }

  // ============================================
  // Story 7.4: Validation Methods
  // ============================================

  /**
   * Validate the current HDL content.
   * Story 7.4: Parses HDL, shows errors/warnings, sets Monaco markers.
   */
  validateContent(): void {
    if (this.isValidating) return;

    const content = this.editor?.getValue() ?? '';
    this.isValidating = true;

    // Update validate button to loading state
    if (this.validateButton) {
      this.validateButton.textContent = 'Validating...';
      this.validateButton.setAttribute('aria-disabled', 'true');
    }

    // Perform validation (synchronous for now, could be async later)
    const result = this.validator.validate(content);
    this.lastValidationResult = result;

    // Update Monaco markers
    this.setValidationMarkers(result);

    // Display results
    this.displayValidationResults(result);

    // Restore validate button
    if (this.validateButton) {
      this.validateButton.textContent = 'Validate';
      this.validateButton.setAttribute('aria-disabled', 'false');
    }

    this.isValidating = false;

    // Announce result
    if (result.valid) {
      this.announce('HDL validation passed: no errors found');
    } else {
      this.announce(`HDL validation failed: ${result.errors.length} error${result.errors.length === 1 ? '' : 's'} found`);
    }

    // Call callback
    this.options.onValidate?.(result);
  }

  /**
   * Get the last validation result.
   * Story 7.4: Returns null if no validation has been performed.
   */
  getLastValidationResult(): HdlValidationResult | null {
    return this.lastValidationResult;
  }

  /**
   * Set Monaco editor markers for validation errors.
   * Story 7.4: Highlights errors inline in the editor.
   */
  private setValidationMarkers(result: HdlValidationResult): void {
    if (!this.editor) return;

    const model = this.editor.getModel();
    if (!model) return;

    // Convert errors and warnings to Monaco markers
    const markers: monaco.editor.IMarkerData[] = [
      ...result.errors.map((error) => ({
        startLineNumber: error.line,
        startColumn: error.column,
        endLineNumber: error.line,
        endColumn: model.getLineMaxColumn(error.line),
        message: error.message,
        severity: monaco.MarkerSeverity.Error,
      })),
      ...result.warnings.map((warning) => ({
        startLineNumber: warning.line,
        startColumn: warning.column,
        endLineNumber: warning.line,
        endColumn: model.getLineMaxColumn(warning.line),
        message: warning.message,
        severity: monaco.MarkerSeverity.Warning,
      })),
    ];

    monaco.editor.setModelMarkers(model, 'hdl-validation', markers);
  }

  /**
   * Clear validation markers from the editor.
   * Story 7.4: Called when content changes to clear stale markers.
   */
  private clearValidationMarkers(): void {
    if (!this.editor) return;

    const model = this.editor.getModel();
    if (!model) return;

    monaco.editor.setModelMarkers(model, 'hdl-validation', []);
  }

  /**
   * Display validation results in the results container.
   * Story 7.4: Shows success or error list with clickable items.
   */
  private displayValidationResults(result: HdlValidationResult): void {
    if (!this.validationResultsContainer) return;

    // Clear previous results
    this.validationResultsContainer.innerHTML = '';
    this.validationResultsContainer.classList.remove('da-hdl-viewer-validation-results--hidden');

    if (result.valid && result.warnings.length === 0) {
      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'da-hdl-viewer-validation-success';
      successDiv.innerHTML = '<span class="da-hdl-viewer-validation-icon">✓</span> HDL is valid (no errors)';
      this.validationResultsContainer.appendChild(successDiv);
    } else {
      // Show error count header
      if (result.errors.length > 0) {
        const errorHeader = document.createElement('div');
        errorHeader.className = 'da-hdl-viewer-validation-header da-hdl-viewer-validation-error';
        errorHeader.innerHTML = `<span class="da-hdl-viewer-validation-icon">✗</span> ${result.errors.length} error${result.errors.length === 1 ? '' : 's'} found:`;
        this.validationResultsContainer.appendChild(errorHeader);

        // Show error list
        const errorList = document.createElement('ul');
        errorList.className = 'da-hdl-viewer-validation-list';
        for (const error of result.errors) {
          const errorItem = this.createValidationItem(error, 'error');
          errorList.appendChild(errorItem);
        }
        this.validationResultsContainer.appendChild(errorList);
      }

      // Show warnings if any
      if (result.warnings.length > 0) {
        const warningHeader = document.createElement('div');
        warningHeader.className = 'da-hdl-viewer-validation-header da-hdl-viewer-validation-warning';
        warningHeader.innerHTML = `<span class="da-hdl-viewer-validation-icon">⚠</span> ${result.warnings.length} warning${result.warnings.length === 1 ? '' : 's'}:`;
        this.validationResultsContainer.appendChild(warningHeader);

        const warningList = document.createElement('ul');
        warningList.className = 'da-hdl-viewer-validation-list';
        for (const warning of result.warnings) {
          const warningItem = this.createValidationItem(warning, 'warning');
          warningList.appendChild(warningItem);
        }
        this.validationResultsContainer.appendChild(warningList);
      }
    }
  }

  /**
   * Create a clickable validation item element.
   * Story 7.4: Clicking jumps to the error line in the editor.
   */
  private createValidationItem(
    item: { line: number; column: number; message: string },
    type: 'error' | 'warning'
  ): HTMLLIElement {
    const li = document.createElement('li');
    li.className = `da-hdl-viewer-validation-item da-hdl-viewer-validation-item--${type}`;
    li.setAttribute('role', 'button');
    li.setAttribute('tabindex', '0');
    li.setAttribute('aria-label', `Line ${item.line}: ${item.message}. Press Enter to jump to line.`);

    const lineSpan = document.createElement('span');
    lineSpan.className = 'da-hdl-viewer-validation-line';
    lineSpan.textContent = `Line ${item.line}:`;

    const messageSpan = document.createElement('span');
    messageSpan.className = 'da-hdl-viewer-validation-message';
    messageSpan.textContent = item.message;

    li.appendChild(lineSpan);
    li.appendChild(messageSpan);

    // Click to jump to line
    const jumpToLine = () => {
      this.jumpToLine(item.line, item.column);
    };

    li.addEventListener('click', jumpToLine);
    li.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        jumpToLine();
      }
    });

    return li;
  }

  /**
   * Jump to a specific line in the editor.
   * Story 7.4: Reveals line in center and sets cursor position.
   */
  jumpToLine(lineNumber: number, column: number = 1): void {
    if (!this.editor) return;

    this.editor.revealLineInCenter(lineNumber);
    this.editor.setPosition({ lineNumber, column });
    this.editor.focus();
  }

  /**
   * Reload the circuit with the current HDL content.
   * Story 7.5: Validates content first, then calls onReloadCircuit callback.
   * Story 7.6: Parses HDL and generates CircuitData before calling callback.
   */
  async reloadCircuit(): Promise<void> {
    // Don't reload if already reloading
    if (this.isReloading) return;

    const content = this.editor?.getValue() ?? '';

    // Validate content first
    const result = this.validator.validate(content);
    this.setValidationMarkers(result);
    this.displayValidationResults(result);
    this.lastValidationResult = result;

    // Announce and call validation callback
    this.announce(
      result.valid
        ? 'HDL validation passed: no errors found'
        : `HDL validation failed: ${result.errors.length} error(s) found`
    );
    this.options.onValidate?.(result);

    // Don't reload if validation failed
    if (!result.valid) {
      return;
    }

    // Set reloading state
    this.isReloading = true;

    // Update button to loading state
    if (this.reloadButton) {
      this.reloadButton.textContent = 'Reloading...';
      this.reloadButton.setAttribute('aria-disabled', 'true');
    }

    try {
      // Story 7.6: Parse HDL to AST
      const ast = this.parser.parse(content);

      // Check for parse errors (shouldn't happen if validation passed, but be safe)
      if (ast.errors.length > 0) {
        throw new Error(`HDL parsing failed: ${ast.errors[0].message}`);
      }

      // Story 7.6: Generate CircuitData from AST
      const circuitData = this.circuitGenerator.generate(ast);

      // Call the reload callback with generated circuit data
      await this.options.onReloadCircuit?.(circuitData);

      // Announce success
      this.announce('Circuit regenerated and reloaded successfully');
    } catch (error) {
      // Announce failure
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.announce(`Circuit regeneration failed: ${errorMessage}`);
      console.error('Circuit regeneration error:', error);
    } finally {
      // Restore button state
      this.isReloading = false;
      if (this.reloadButton) {
        this.reloadButton.textContent = 'Reload Circuit';
        this.reloadButton.setAttribute('aria-disabled', 'false');
        // Return focus to reload button for accessibility
        this.reloadButton.focus();
      }
    }
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

    // Story 7.3: Dispose content change listener
    this.contentChangeDisposable?.dispose();
    this.contentChangeDisposable = null;

    // Dispose Monaco editor
    this.editor?.dispose();
    this.editor = null;

    // Remove DOM elements
    this.panelElement?.remove();
    this.panelElement = null;
    this.editorContainer = null;
    this.container = null;

    // Story 7.3: Clean up edit mode elements
    this.editToggleButton = null;
    this.saveButton = null;
    this.dirtyIndicator = null;
    this.titleElement = null;

    // Story 7.4: Clean up validation elements
    this.validateButton = null;
    this.validationResultsContainer = null;
    this.lastValidationResult = null;
    this.isValidating = false;

    // Story 7.5: Clean up reload elements
    this.reloadButton = null;
    this.isReloading = false;

    // Remove announcer element
    this.announcerElement?.remove();
    this.announcerElement = null;

    // Reset state
    this.visible = false;
    this.editMode = false;
    this.originalContent = '';
    this.previouslyFocusedElement = null;
    this.loader.reset();
  }
}
