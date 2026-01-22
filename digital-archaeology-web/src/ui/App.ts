// src/ui/App.ts
// Root application component - renders the main 3-panel layout with resizable panels

import { PanelResizer, PANEL_CONSTRAINTS } from './PanelResizer';
import { Toolbar } from './Toolbar';
import type { ToolbarCallbacks } from './Toolbar';
import { MenuBar } from './MenuBar';
import type { MenuBarCallbacks } from './MenuBar';
import { StatusBar } from './StatusBar';
import { PanelHeader } from './PanelHeader';
import type { PanelId } from './PanelHeader';
import { Editor } from '@editor/index';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';
import { AssemblerBridge } from '@emulator/index';
import type { AssembleResult } from '@emulator/index';

/**
 * Delay in milliseconds before announcing visibility changes to screen readers.
 * This delay ensures the DOM change is detected by assistive technology.
 */
const SCREEN_READER_ANNOUNCE_DELAY_MS = 100;

/**
 * Panel visibility state.
 */
export interface PanelVisibility {
  code: boolean;
  circuit: boolean;
  state: boolean;
}

/**
 * Root application component that renders the main 3-panel layout.
 * Creates toolbar, menu bar, code panel, circuit panel, state panel, and status bar.
 * Panels are resizable via drag handles.
 */
export class App {
  private container: HTMLElement | null = null;
  private isMounted: boolean = false;
  private codeResizer: PanelResizer | null = null;
  private stateResizer: PanelResizer | null = null;
  private toolbar: Toolbar | null = null;
  private menuBar: MenuBar | null = null;
  private statusBar: StatusBar | null = null;
  private codePanelWidth: number = PANEL_CONSTRAINTS.CODE_DEFAULT;
  private statePanelWidth: number = PANEL_CONSTRAINTS.STATE_DEFAULT;
  private boundWindowResize: () => void;

  // Panel headers
  private codePanelHeader: PanelHeader | null = null;
  private circuitPanelHeader: PanelHeader | null = null;
  private statePanelHeader: PanelHeader | null = null;

  // Code editor (Monaco)
  private editor: Editor | null = null;

  // Keyboard shortcuts dialog
  private keyboardShortcutsDialog: KeyboardShortcutsDialog | null = null;

  // Assembler bridge for WASM worker communication
  private assemblerBridge: AssemblerBridge | null = null;

  // Last assembly result for use by execution controls (Epic 4)
  private lastAssembleResult: AssembleResult | null = null;

  // Flag to prevent rapid assembly triggering (debounce guard)
  private isAssembling: boolean = false;

  // Panel visibility state
  private panelVisibility: PanelVisibility = {
    code: true,
    circuit: true,
    state: true,
  };

  constructor() {
    this.boundWindowResize = this.handleWindowResize.bind(this);
  }

  /**
   * Mount the application to a DOM container.
   * Safe to call multiple times - will re-render if already mounted.
   */
  mount(container: HTMLElement): void {
    // Clean up existing components before re-mounting to prevent memory leaks
    this.destroyResizers();
    this.destroyToolbar();
    this.destroyMenuBar();
    this.destroyStatusBar();
    this.destroyPanelHeaders();
    this.destroyEditor();
    this.destroyAssemblerBridge();

    this.container = container;
    this.isMounted = true;
    this.render();
    this.initializeMenuBar();
    this.initializeToolbar();
    this.initializePanelHeaders();
    this.initializeStatusBar();
    this.initializeResizers();
    this.initializeEditor();
    this.updateGridColumns();
    this.updatePanelVisibility();

    // Add window resize listener
    window.addEventListener('resize', this.boundWindowResize);
  }

  /**
   * Render the application layout.
   * @returns void
   */
  private render(): void {
    if (!this.container) return;

    // Note: innerHTML with static template - no user input, safe from XSS
    this.container.innerHTML = `
      <div class="da-app-layout">
        <header class="da-toolbar">
          <!-- MenuBar and Toolbar components will be mounted here -->
        </header>

        <aside class="da-panel da-code-panel" aria-label="Code Editor Panel">
          <div class="da-panel-header-container">
            <!-- PanelHeader component will be mounted here -->
          </div>
          <div class="da-panel-content">
            <!-- Content: Epic 2 - Assembly Code Editor -->
          </div>
        </aside>

        <main class="da-circuit-panel" aria-label="Circuit Visualizer Panel">
          <div class="da-panel-header-container">
            <!-- PanelHeader component will be mounted here -->
          </div>
          <div class="da-panel-content">
            <!-- Content: Epic 6 - Circuit Visualization -->
          </div>
        </main>

        <aside class="da-panel da-state-panel" aria-label="CPU State Panel">
          <div class="da-panel-header-container">
            <!-- PanelHeader component will be mounted here -->
          </div>
          <div class="da-panel-content">
            <!-- Content: Epic 5 - Debugging & State Inspection -->
          </div>
        </aside>

        <footer class="da-statusbar" role="status" aria-live="polite" aria-label="Application status bar">
          <!-- StatusBar component will be mounted here -->
        </footer>

        <!-- Screen reader announcer for panel visibility changes -->
        <div
          class="da-sr-announcer"
          aria-live="polite"
          aria-atomic="true"
          style="position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;"
        ></div>
      </div>
    `;
  }

  /**
   * Initialize the menu bar component.
   * @returns void
   */
  private initializeMenuBar(): void {
    if (!this.container) return;

    const toolbarContainer = this.container.querySelector('.da-toolbar');
    if (!toolbarContainer) return;

    // Create menubar container
    const menuBarContainer = document.createElement('div');
    menuBarContainer.className = 'da-menubar-wrapper';
    toolbarContainer.appendChild(menuBarContainer);

    // Placeholder callbacks - will be wired to actual functionality in later epics
    const callbacks: MenuBarCallbacks = {
      onModeChange: () => { /* Epic 8: Story Mode */ },
      // File menu
      onFileNew: () => { /* Epic 9: File Operations */ },
      onFileOpen: () => { /* Epic 9: File Operations */ },
      onFileSave: () => { /* Epic 9: File Operations */ },
      onFileSaveAs: () => { /* Epic 9: File Operations */ },
      onFileExport: () => { /* Epic 9: File Operations */ },
      onFileImport: () => { /* Epic 9: File Operations */ },
      // Edit menu
      onEditUndo: () => this.handleUndo(),
      onEditRedo: () => this.handleRedo(),
      onEditCut: () => { /* Epic 2: Code Editor */ },
      onEditCopy: () => { /* Epic 2: Code Editor */ },
      onEditPaste: () => { /* Epic 2: Code Editor */ },
      // View menu - panel visibility toggles
      onViewCodePanel: () => this.togglePanel('code'),
      onViewCircuitPanel: () => this.togglePanel('circuit'),
      onViewStatePanel: () => this.togglePanel('state'),
      onViewResetLayout: () => this.resetLayout(),
      // Debug menu
      onDebugAssemble: () => this.handleAssemble(),
      onDebugRun: () => { /* Epic 4: Program Execution */ },
      onDebugPause: () => { /* Epic 4: Program Execution */ },
      onDebugReset: () => { /* Epic 4: Program Execution */ },
      onDebugStep: () => { /* Epic 5: Debugging */ },
      onDebugToggleBreakpoint: () => { /* Epic 5: Debugging */ },
      // Help menu
      onHelpKeyboardShortcuts: () => this.showKeyboardShortcuts(),
      onHelpDocumentation: () => { /* Epic 20: Educational Content */ },
      onHelpAbout: () => { /* Epic 20: Educational Content */ },
    };

    this.menuBar = new MenuBar(callbacks);
    this.menuBar.mount(menuBarContainer);
  }

  /**
   * Destroy the menu bar component.
   * @returns void
   */
  private destroyMenuBar(): void {
    if (this.menuBar) {
      this.menuBar.destroy();
      this.menuBar = null;
    }
  }

  /**
   * Get the menu bar instance for state updates.
   * @returns The menu bar instance or null if not initialized
   */
  getMenuBar(): MenuBar | null {
    return this.menuBar;
  }

  /**
   * Initialize the status bar component.
   * @returns void
   */
  private initializeStatusBar(): void {
    if (!this.container) return;

    const statusBarContainer = this.container.querySelector('.da-statusbar');
    if (!statusBarContainer) return;

    this.statusBar = new StatusBar();
    this.statusBar.mount(statusBarContainer as HTMLElement);
  }

  /**
   * Destroy the status bar component.
   * @returns void
   */
  private destroyStatusBar(): void {
    if (this.statusBar) {
      this.statusBar.destroy();
      this.statusBar = null;
    }
  }

  /**
   * Get the status bar instance for state updates.
   * @returns The status bar instance or null if not initialized
   */
  getStatusBar(): StatusBar | null {
    return this.statusBar;
  }

  /**
   * Initialize panel header components for all panels.
   * @returns void
   */
  private initializePanelHeaders(): void {
    if (!this.container) return;

    const codePanelHeaderContainer = this.container.querySelector('.da-code-panel .da-panel-header-container');
    const circuitPanelHeaderContainer = this.container.querySelector('.da-circuit-panel .da-panel-header-container');
    const statePanelHeaderContainer = this.container.querySelector('.da-state-panel .da-panel-header-container');

    if (codePanelHeaderContainer) {
      this.codePanelHeader = new PanelHeader({
        title: 'CODE',
        panelId: 'code',
        onClose: () => this.setPanelVisibility('code', false),
      });
      this.codePanelHeader.mount(codePanelHeaderContainer as HTMLElement);
    }

    if (circuitPanelHeaderContainer) {
      this.circuitPanelHeader = new PanelHeader({
        title: 'CIRCUIT',
        panelId: 'circuit',
        onClose: () => this.setPanelVisibility('circuit', false),
      });
      this.circuitPanelHeader.mount(circuitPanelHeaderContainer as HTMLElement);
    }

    if (statePanelHeaderContainer) {
      this.statePanelHeader = new PanelHeader({
        title: 'STATE',
        panelId: 'state',
        onClose: () => this.setPanelVisibility('state', false),
      });
      this.statePanelHeader.mount(statePanelHeaderContainer as HTMLElement);
    }
  }

  /**
   * Destroy all panel header components.
   * @returns void
   */
  private destroyPanelHeaders(): void {
    if (this.codePanelHeader) {
      this.codePanelHeader.destroy();
      this.codePanelHeader = null;
    }
    if (this.circuitPanelHeader) {
      this.circuitPanelHeader.destroy();
      this.circuitPanelHeader = null;
    }
    if (this.statePanelHeader) {
      this.statePanelHeader.destroy();
      this.statePanelHeader = null;
    }
  }

  /**
   * Initialize the Monaco editor in the code panel.
   * Wires cursor position events to update the status bar.
   * Also initializes the AssemblerBridge for code assembly.
   * @returns void
   */
  private initializeEditor(): void {
    if (!this.container) return;

    const codePanelContent = this.container.querySelector('.da-code-panel .da-panel-content');
    if (!codePanelContent) return;

    this.editor = new Editor({
      onCursorPositionChange: (position) => {
        this.statusBar?.updateState({
          cursorPosition: { line: position.line, column: position.column },
        });
      },
      onContentChange: (hasContent) => {
        this.toolbar?.updateState({ canAssemble: hasContent });
      },
      onAssemble: () => this.handleAssemble(),
    });
    this.editor.mount(codePanelContent as HTMLElement);

    // Initialize AssemblerBridge for code assembly
    this.initializeAssemblerBridge();
  }

  /**
   * Initialize the AssemblerBridge for WASM worker communication.
   * Runs asynchronously to avoid blocking UI during WASM loading.
   * @returns void
   */
  private initializeAssemblerBridge(): void {
    this.assemblerBridge = new AssemblerBridge();

    // Initialize asynchronously - don't block UI
    this.assemblerBridge.init().catch((error) => {
      console.error('Failed to initialize AssemblerBridge:', error);
      this.statusBar?.updateState({
        assemblyStatus: 'error',
        assemblyMessage: 'Assembler initialization failed',
      });
    });
  }

  /**
   * Destroy the AssemblerBridge and clean up resources.
   * @returns void
   */
  private destroyAssemblerBridge(): void {
    if (this.assemblerBridge) {
      this.assemblerBridge.terminate();
      this.assemblerBridge = null;
    }
    this.lastAssembleResult = null;
    this.isAssembling = false;
  }

  /**
   * Perform an undo on the current editor model if available.
   */
  private handleUndo(): void {
    const model = this.editor?.getModel();
    model?.undo();
    this.editor?.focus();
  }

  /**
   * Perform a redo on the current editor model if available.
   */
  private handleRedo(): void {
    const model = this.editor?.getModel();
    model?.redo();
    this.editor?.focus();
  }

  /**
   * Handle assembly of the current editor content.
   * Updates status bar during operation and enables execution buttons on success.
   * Includes debounce protection against rapid triggering.
   */
  private async handleAssemble(): Promise<void> {
    // Debounce guard - prevent rapid triggering from keyboard shortcut
    if (this.isAssembling) {
      return;
    }

    if (!this.assemblerBridge?.isReady) {
      this.statusBar?.updateState({
        assemblyStatus: 'error',
        assemblyMessage: 'Assembler not ready',
      });
      return;
    }

    const source = this.editor?.getValue() ?? '';
    if (!source.trim()) {
      this.statusBar?.updateState({
        assemblyStatus: 'error',
        assemblyMessage: 'No code to assemble',
      });
      return;
    }

    // Set assembling flag to prevent rapid triggering
    this.isAssembling = true;

    // Update status and disable Assemble button during operation
    this.statusBar?.updateState({
      assemblyStatus: 'assembling',
      assemblyMessage: null,
    });
    this.toolbar?.updateState({ canAssemble: false });

    try {
      const result = await this.assemblerBridge.assemble(source);
      this.lastAssembleResult = result;

      if (result.success) {
        const byteCount = result.binary?.length ?? 0;
        this.statusBar?.updateState({
          assemblyStatus: 'success',
          assemblyMessage: `${byteCount} bytes`,
        });
        // Enable execution buttons (Run, Step, Reset)
        this.toolbar?.updateState({
          canAssemble: true,
          canRun: true,
          canStep: true,
          canReset: true,
        });
      } else {
        // Display error message (basic - Story 3.4 handles rich errors)
        const errorMsg = result.error?.message ?? 'Assembly failed';
        this.statusBar?.updateState({
          assemblyStatus: 'error',
          assemblyMessage: errorMsg,
        });
        this.toolbar?.updateState({ canAssemble: true });
      }
    } catch (error) {
      // Handle unexpected errors (worker crash, timeout, etc.)
      const errorMsg = error instanceof Error ? error.message : 'Unexpected error';
      this.statusBar?.updateState({
        assemblyStatus: 'error',
        assemblyMessage: errorMsg,
      });
      this.toolbar?.updateState({ canAssemble: true });
    } finally {
      // Always clear the assembling flag
      this.isAssembling = false;
    }

    // Return focus to editor
    this.editor?.focus();
  }

  /**
   * Destroy the Monaco editor.
   * @returns void
   */
  private destroyEditor(): void {
    if (this.editor) {
      this.editor.destroy();
      this.editor = null;
    }
  }

  /**
   * Get the editor instance.
   * @returns The editor instance or null if not initialized
   */
  getEditor(): Editor | null {
    return this.editor;
  }

  /**
   * Get the last assembly result.
   * Used by execution controls (Epic 4) to load the binary into the emulator.
   * @returns The last assembly result or null if no assembly has been performed
   */
  getLastAssembleResult(): AssembleResult | null {
    return this.lastAssembleResult;
  }

  /**
   * Show the keyboard shortcuts dialog.
   */
  private showKeyboardShortcuts(): void {
    if (!this.keyboardShortcutsDialog) {
      this.keyboardShortcutsDialog = new KeyboardShortcutsDialog();
    }
    this.keyboardShortcutsDialog.show();
  }

  /**
   * Destroy the keyboard shortcuts dialog.
   * @returns void
   */
  private destroyKeyboardShortcutsDialog(): void {
    if (this.keyboardShortcutsDialog) {
      this.keyboardShortcutsDialog.destroy();
      this.keyboardShortcutsDialog = null;
    }
  }

  /**
   * Get the keyboard shortcuts dialog instance.
   * @returns The keyboard shortcuts dialog instance or null if not initialized
   */
  getKeyboardShortcutsDialog(): KeyboardShortcutsDialog | null {
    return this.keyboardShortcutsDialog;
  }

  /**
   * Set the visibility of a specific panel.
   * @param panelId - The panel to show/hide
   * @param visible - Whether the panel should be visible
   */
  setPanelVisibility(panelId: PanelId, visible: boolean): void {
    this.panelVisibility[panelId] = visible;
    this.updatePanelVisibility();
    this.menuBar?.setPanelStates(this.panelVisibility);

    // Refresh editor layout when code panel becomes visible
    // Monaco needs a layout refresh after visibility change
    if (panelId === 'code' && visible && this.editor) {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        this.editor?.layout();
      });
    }
  }

  /**
   * Toggle the visibility of a specific panel.
   * @param panelId - The panel to toggle
   */
  togglePanel(panelId: PanelId): void {
    this.setPanelVisibility(panelId, !this.panelVisibility[panelId]);
  }

  /**
   * Get current panel visibility state.
   * @returns Copy of panel visibility state
   */
  getPanelVisibility(): PanelVisibility {
    return { ...this.panelVisibility };
  }

  /**
   * Reset layout to default state (all panels visible, default widths).
   * @returns void
   */
  resetLayout(): void {
    // Show all panels
    this.panelVisibility = { code: true, circuit: true, state: true };
    this.updatePanelVisibility();
    this.menuBar?.setPanelStates(this.panelVisibility);

    // Reset panel widths to defaults
    this.codePanelWidth = PANEL_CONSTRAINTS.CODE_DEFAULT;
    this.statePanelWidth = PANEL_CONSTRAINTS.STATE_DEFAULT;
    this.updateGridColumns();

    // Refresh editor layout after layout reset
    if (this.editor) {
      requestAnimationFrame(() => {
        this.editor?.layout();
      });
    }
  }

  /**
   * Update DOM to reflect panel visibility state.
   * @returns void
   */
  private updatePanelVisibility(): void {
    if (!this.container) return;

    const layout = this.container.querySelector('.da-app-layout');
    const codePanel = this.container.querySelector('.da-code-panel');
    const circuitPanel = this.container.querySelector('.da-circuit-panel');
    const statePanel = this.container.querySelector('.da-state-panel');

    if (!layout) return;

    // Update layout classes for grid adjustment
    layout.classList.toggle('da-app-layout--code-hidden', !this.panelVisibility.code);
    layout.classList.toggle('da-app-layout--circuit-hidden', !this.panelVisibility.circuit);
    layout.classList.toggle('da-app-layout--state-hidden', !this.panelVisibility.state);

    // Update panel visibility classes
    codePanel?.classList.toggle('da-panel--hidden', !this.panelVisibility.code);
    circuitPanel?.classList.toggle('da-panel--hidden', !this.panelVisibility.circuit);
    statePanel?.classList.toggle('da-panel--hidden', !this.panelVisibility.state);

    // Announce visibility change for screen readers
    this.announceVisibilityChange();
  }

  /**
   * Announce panel visibility changes for screen readers.
   * Uses a visually hidden live region created during render.
   * @returns void
   */
  private announceVisibilityChange(): void {
    if (!this.container) return;

    // Find the announcement element created during render
    const announcer = this.container.querySelector('.da-sr-announcer') as HTMLElement;
    if (!announcer) return;

    // Build announcement message
    const hiddenPanels: string[] = [];
    const visiblePanels: string[] = [];

    if (this.panelVisibility.code) {
      visiblePanels.push('Code');
    } else {
      hiddenPanels.push('Code');
    }
    if (this.panelVisibility.circuit) {
      visiblePanels.push('Circuit');
    } else {
      hiddenPanels.push('Circuit');
    }
    if (this.panelVisibility.state) {
      visiblePanels.push('State');
    } else {
      hiddenPanels.push('State');
    }

    let message = '';
    if (hiddenPanels.length > 0) {
      message = `${hiddenPanels.join(', ')} panel${hiddenPanels.length > 1 ? 's' : ''} hidden.`;
    }
    if (visiblePanels.length === 3) {
      message = 'All panels visible.';
    }

    // Clear and set to trigger announcement
    announcer.textContent = '';
    // Use setTimeout to ensure the change is detected by screen readers
    setTimeout(() => {
      announcer.textContent = message;
    }, SCREEN_READER_ANNOUNCE_DELAY_MS);
  }

  /**
   * Initialize the toolbar component.
   * @returns void
   */
  private initializeToolbar(): void {
    if (!this.container) return;

    const toolbarContainer = this.container.querySelector('.da-toolbar');
    if (!toolbarContainer) return;

    // Placeholder callbacks - will be wired to actual functionality in later epics
    const callbacks: ToolbarCallbacks = {
      onFileClick: () => { /* Epic 9: File menu */ },
      onAssembleClick: () => this.handleAssemble(),
      onRunClick: () => { /* Epic 4: Program Execution */ },
      onPauseClick: () => { /* Epic 4: Program Execution */ },
      onResetClick: () => { /* Epic 4: Program Execution */ },
      onStepClick: () => { /* Epic 5: Debugging */ },
      onSpeedChange: () => { /* Epic 4: Speed Control */ },
      onHelpClick: () => { /* Epic 20: Educational Content */ },
      onSettingsClick: () => { /* Epic 9: Settings */ },
    };

    this.toolbar = new Toolbar(callbacks);
    this.toolbar.mount(toolbarContainer as HTMLElement);
  }

  /**
   * Destroy the toolbar component.
   * @returns void
   */
  private destroyToolbar(): void {
    if (this.toolbar) {
      this.toolbar.destroy();
      this.toolbar = null;
    }
  }

  /**
   * Get the toolbar instance for state updates.
   * @returns The toolbar instance or null if not initialized
   */
  getToolbar(): Toolbar | null {
    return this.toolbar;
  }

  /**
   * Initialize the panel resizers.
   * @returns void
   */
  private initializeResizers(): void {
    if (!this.container) return;

    const codePanel = this.container.querySelector('.da-code-panel');
    const statePanel = this.container.querySelector('.da-state-panel');

    if (codePanel) {
      this.codeResizer = new PanelResizer({
        panel: 'code',
        onResize: (width) => this.handleCodeResize(width),
        getCurrentWidth: () => this.codePanelWidth,
        getOtherPanelWidth: () => this.statePanelWidth,
      });
      this.codeResizer.mount(codePanel as HTMLElement);
    }

    if (statePanel) {
      this.stateResizer = new PanelResizer({
        panel: 'state',
        onResize: (width) => this.handleStateResize(width),
        getCurrentWidth: () => this.statePanelWidth,
        getOtherPanelWidth: () => this.codePanelWidth,
      });
      this.stateResizer.mount(statePanel as HTMLElement);
    }
  }

  /**
   * Handle code panel resize.
   * @param width - New width in pixels
   * @returns void
   */
  private handleCodeResize(width: number): void {
    this.codePanelWidth = width;
    this.updateGridColumns();
  }

  /**
   * Handle state panel resize.
   * @param width - New width in pixels
   * @returns void
   */
  private handleStateResize(width: number): void {
    this.statePanelWidth = width;
    this.updateGridColumns();
  }

  /**
   * Update CSS custom properties for grid column widths.
   * @returns void
   */
  private updateGridColumns(): void {
    document.documentElement.style.setProperty(
      '--da-code-panel-width',
      `${this.codePanelWidth}px`
    );
    document.documentElement.style.setProperty(
      '--da-state-panel-width',
      `${this.statePanelWidth}px`
    );
  }

  /**
   * Handle window resize to ensure panel constraints are maintained.
   * @returns void
   */
  private handleWindowResize(): void {
    const viewportWidth = window.innerWidth;
    const minTotalWidth = PANEL_CONSTRAINTS.CODE_MIN + PANEL_CONSTRAINTS.CIRCUIT_MIN + PANEL_CONSTRAINTS.STATE_MIN;

    // If viewport is too small, we can't maintain constraints - just clamp
    if (viewportWidth < minTotalWidth) {
      return;
    }

    // Recalculate max widths and constrain current values
    const maxCodeWidth = viewportWidth - PANEL_CONSTRAINTS.CIRCUIT_MIN - this.statePanelWidth;
    const maxStateWidth = viewportWidth - PANEL_CONSTRAINTS.CIRCUIT_MIN - this.codePanelWidth;

    // Clamp code panel width
    if (this.codePanelWidth > maxCodeWidth) {
      this.codePanelWidth = Math.max(PANEL_CONSTRAINTS.CODE_MIN, maxCodeWidth);
    }

    // Clamp state panel width
    if (this.statePanelWidth > maxStateWidth) {
      this.statePanelWidth = Math.max(PANEL_CONSTRAINTS.STATE_MIN, maxStateWidth);
    }

    this.updateGridColumns();
  }

  /**
   * Destroy resizers without clearing container.
   * @returns void
   */
  private destroyResizers(): void {
    if (this.codeResizer) {
      this.codeResizer.destroy();
      this.codeResizer = null;
    }
    if (this.stateResizer) {
      this.stateResizer.destroy();
      this.stateResizer = null;
    }
  }

  /**
   * Get current code panel width.
   * @returns Width in pixels
   */
  getCodePanelWidth(): number {
    return this.codePanelWidth;
  }

  /**
   * Get current state panel width.
   * @returns Width in pixels
   */
  getStatePanelWidth(): number {
    return this.statePanelWidth;
  }

  /**
   * Check if the application is currently mounted.
   * @returns true if mounted, false otherwise
   */
  isMountedTo(): boolean {
    return this.isMounted;
  }

  /**
   * Destroy and clean up.
   * @returns void
   */
  destroy(): void {
    // Remove window resize listener
    window.removeEventListener('resize', this.boundWindowResize);

    // Destroy menu bar
    this.destroyMenuBar();

    // Destroy toolbar
    this.destroyToolbar();

    // Destroy panel headers
    this.destroyPanelHeaders();

    // Destroy status bar
    this.destroyStatusBar();

    // Destroy editor
    this.destroyEditor();

    // Destroy assembler bridge
    this.destroyAssemblerBridge();

    // Destroy keyboard shortcuts dialog
    this.destroyKeyboardShortcutsDialog();

    // Destroy resizers
    this.destroyResizers();

    // Clear container
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }

    // Reset panel widths to defaults
    this.codePanelWidth = PANEL_CONSTRAINTS.CODE_DEFAULT;
    this.statePanelWidth = PANEL_CONSTRAINTS.STATE_DEFAULT;

    // Reset panel visibility to defaults
    this.panelVisibility = { code: true, circuit: true, state: true };

    // Clear CSS custom properties
    document.documentElement.style.removeProperty('--da-code-panel-width');
    document.documentElement.style.removeProperty('--da-state-panel-width');

    this.isMounted = false;
  }
}
