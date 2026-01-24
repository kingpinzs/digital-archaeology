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
import { setTheme, initTheme } from './theme';
import type { ThemeMode } from './theme';
import { Editor } from '@editor/index';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';
import { ErrorPanel } from './ErrorPanel';
import { BinaryOutputPanel } from './BinaryOutputPanel';
import { AssemblerBridge, EmulatorBridge } from '@emulator/index';
import type { AssembleResult, AssemblerError, CPUState } from '@emulator/index';
import { StoryModeContainer } from '@story/index';
import { RegisterView, FlagsView, MemoryView, BreakpointsView, RuntimeErrorPanel } from '@debugger/index';
import type { BreakpointEntry, RuntimeErrorContext } from '@debugger/index';

/**
 * Source map for correlating PC addresses to source line numbers (Story 5.1).
 */
export interface SourceMap {
  /** Maps PC address to source line number (1-based) */
  addressToLine: Map<number, number>;
  /** Maps source line number to PC address */
  lineToAddress: Map<number, number>;
}

/**
 * State history entry for step-back functionality (Story 5.2).
 * Stores a complete CPU state snapshot for navigation.
 */
export interface StateHistoryEntry {
  /** Complete CPU state snapshot */
  state: CPUState;
  /** Timestamp for debugging/display (optional) */
  timestamp: number;
}

/**
 * Maximum number of CPU states to keep in history (Story 5.2).
 * Each CPUState is ~300 bytes (256 byte memory + flags/registers).
 * 50 entries = ~15KB - acceptable memory overhead.
 */
export const MAX_HISTORY_SIZE = 50;

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
  private currentMode: ThemeMode = 'lab';

  // Lab Mode container (the 3-panel layout, Story 10.1)
  private labModeContainer: HTMLElement | null = null;

  // Story Mode container (Story 10.1)
  private storyModeContainer: StoryModeContainer | null = null;

  private codePanelWidth: number = PANEL_CONSTRAINTS.CODE_DEFAULT;
  private statePanelWidth: number = PANEL_CONSTRAINTS.STATE_DEFAULT;
  private boundWindowResize: () => void;
  private boundKeydownHandler: ((e: KeyboardEvent) => void) | null = null;

  // Panel headers
  private codePanelHeader: PanelHeader | null = null;
  private circuitPanelHeader: PanelHeader | null = null;
  private statePanelHeader: PanelHeader | null = null;

  // Code editor (Monaco)
  private editor: Editor | null = null;

  // Keyboard shortcuts dialog
  private keyboardShortcutsDialog: KeyboardShortcutsDialog | null = null;

  // Error panel for displaying assembly errors
  private errorPanel: ErrorPanel | null = null;

  // Binary output panel for displaying assembled binary as hex dump
  private binaryOutputPanel: BinaryOutputPanel | null = null;

  // Toggle button for binary view
  private binaryToggleContainer: HTMLElement | null = null;
  private binaryToggleButton: HTMLButtonElement | null = null;
  private boundBinaryToggleHandler: (() => void) | null = null;

  // Assembler bridge for WASM worker communication
  private assemblerBridge: AssemblerBridge | null = null;

  // Emulator bridge for WASM worker communication (Story 4.4)
  private emulatorBridge: EmulatorBridge | null = null;

  // Current CPU state from the emulator (Story 4.4)
  private cpuState: CPUState | null = null;

  // Last assembly result for use by execution controls (Epic 4)
  private lastAssembleResult: AssembleResult | null = null;

  // Flag to prevent rapid assembly triggering (debounce guard)
  private isAssembling: boolean = false;

  // Flag indicating code has been successfully assembled and not modified since (Story 3.7)
  private hasValidAssembly: boolean = false;

  // Source map for PC-to-line correlation (Story 5.1)
  private sourceMap: SourceMap | null = null;

  // Flag indicating program is currently running (Story 4.5)
  private isRunning: boolean = false;

  // Current execution speed in Hz (Story 4.5)
  private executionSpeed: number = 60;

  // Unsubscribe functions for emulator event callbacks (Story 4.5)
  private unsubscribeStateUpdate: (() => void) | null = null;
  private unsubscribeHalted: (() => void) | null = null;
  private unsubscribeError: (() => void) | null = null;
  private unsubscribeBreakpointHit: (() => void) | null = null; // Story 5.9

  // Throttling for high-speed UI updates (Story 4.5)
  private lastStateUpdateTime: number = 0;
  private readonly STATE_UPDATE_THROTTLE_MS = 16; // ~60fps max UI updates

  // State history for step-back functionality (Story 5.2)
  private stateHistory: StateHistoryEntry[] = [];
  private historyPointer: number = -1; // -1 = at latest, tracking new states

  // RegisterView for displaying CPU registers (Story 5.3)
  private registerView: RegisterView | null = null;

  // FlagsView for displaying CPU flags (Story 5.4)
  private flagsView: FlagsView | null = null;

  // MemoryView for displaying CPU memory (Story 5.5)
  private memoryView: MemoryView | null = null;

  // BreakpointsView for displaying active breakpoints (Story 5.8)
  private breakpointsView: BreakpointsView | null = null;

  // RuntimeErrorPanel for displaying rich runtime errors (Story 5.10)
  private runtimeErrorPanel: RuntimeErrorPanel | null = null;

  // Breakpoints map: address → line number (Story 5.8)
  private breakpoints: Map<number, number> = new Map();

  // Panel visibility state
  private panelVisibility: PanelVisibility = {
    code: true,
    circuit: true,
    state: true,
  };

  constructor() {
    this.boundWindowResize = this.handleWindowResize.bind(this);
    this.boundKeydownHandler = this.handleGlobalKeydown.bind(this);
  }

  /**
   * Mount the application to a DOM container.
   * Safe to call multiple times - will re-render if already mounted.
   */
  mount(container: HTMLElement): void {
    // Clean up existing components before re-mounting to prevent memory leaks
    this.destroyResizers();
    this.destroyToolbar();
    this.destroyStoryModeContainer();
    this.destroyMenuBar();
    this.destroyStatusBar();
    this.destroyPanelHeaders();
    this.destroyEditor();
    this.destroyAssemblerBridge();
    this.destroyEmulatorBridge();
    this.destroyRegisterView();
    this.destroyFlagsView();
    this.destroyMemoryView();
    this.destroyBreakpointsView();
    this.destroyRuntimeErrorPanel();

    this.container = container;
    this.isMounted = true;
    // Reset assembly state on mount/remount (Story 3.7)
    this.hasValidAssembly = false;

    // Initialize theme from stored preference (Story 10.1)
    this.currentMode = initTheme();

    this.render();
    this.initializeMenuBar();
    // Sync menu bar with initial mode from localStorage (Story 10.1)
    if (this.menuBar) {
      this.menuBar.updateState({ currentMode: this.currentMode });
    }
    this.initializeToolbar();
    this.initializePanelHeaders();
    this.initializeStatusBar();
    this.initializeResizers();
    this.initializeEditor();
    this.initializeStoryModeContainer();
    this.initializeRegisterView();
    this.initializeFlagsView();
    this.initializeMemoryView();
    this.initializeBreakpointsView();
    this.initializeRuntimeErrorPanel();
    this.updateGridColumns();
    this.updatePanelVisibility();

    // Apply initial mode (show/hide appropriate containers, Story 10.1)
    this.applyModeVisibility();

    // Add window resize listener
    window.addEventListener('resize', this.boundWindowResize);

    // Add keyboard shortcut listener (Story 10.1)
    if (this.boundKeydownHandler) {
      window.addEventListener('keydown', this.boundKeydownHandler);
    }
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
          <!-- MenuBar (with mode toggle) and Toolbar components will be mounted here -->
        </header>

        <!-- Lab Mode Container (3-panel layout, Story 10.1) -->
        <div id="da-lab-mode-panel" class="da-lab-mode-container da-mode-container">
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
        </div>

        <!-- Story Mode Container mount point (Story 10.1) -->
        <div id="da-story-mode-panel" class="da-story-mode-mount"></div>

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

    // Cache reference to Lab Mode container (Story 10.1)
    this.labModeContainer = this.container.querySelector('.da-lab-mode-container');
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
      onModeChange: (mode) => this.handleModeChange(mode),
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
   * Handle mode change from MenuBar component (Story 10.1).
   * Updates theme via theme.ts and stores current mode.
   * @param mode - The new theme mode
   * @returns void
   */
  private handleModeChange(mode: ThemeMode): void {
    this.currentMode = mode;
    setTheme(mode);
    this.applyModeVisibility();
    this.announceModeChange(mode);
  }

  /**
   * Announce mode change to screen readers (Story 10.1 accessibility).
   * @param mode - The new theme mode
   * @returns void
   */
  private announceModeChange(mode: ThemeMode): void {
    if (!this.container) return;

    const announcer = this.container.querySelector('.da-sr-announcer') as HTMLElement;
    if (!announcer) return;

    const modeName = mode === 'lab' ? 'Lab' : 'Story';
    announcer.textContent = `Switched to ${modeName} Mode`;
  }

  /**
   * Initialize the Story Mode container (Story 10.1).
   * @returns void
   */
  private initializeStoryModeContainer(): void {
    if (!this.container) return;

    const storyMount = this.container.querySelector('.da-story-mode-mount');
    if (!storyMount) return;

    this.storyModeContainer = new StoryModeContainer();
    this.storyModeContainer.mount(storyMount as HTMLElement);
  }

  /**
   * Destroy the Story Mode container.
   * @returns void
   */
  private destroyStoryModeContainer(): void {
    if (this.storyModeContainer) {
      this.storyModeContainer.destroy();
      this.storyModeContainer = null;
    }
  }

  /**
   * Apply visibility based on current mode (Story 10.1).
   * Shows Lab UI and hides Story UI, or vice versa.
   * @returns void
   */
  private applyModeVisibility(): void {
    if (this.currentMode === 'lab') {
      this.switchToLabMode();
    } else {
      this.switchToStoryMode();
    }
  }

  /**
   * Switch to Lab Mode - shows Lab UI, hides Story UI (Story 10.1).
   * @returns void
   */
  private switchToLabMode(): void {
    // Check if lab container was hidden (switching from story mode)
    const wasHidden = this.labModeContainer?.classList.contains('da-mode-container--hidden');

    // Show Lab Mode container
    this.labModeContainer?.classList.remove('da-mode-container--hidden');

    // Hide Story Mode container
    this.storyModeContainer?.hide();

    // Refresh editor layout only if we're switching from story mode (container was hidden)
    if (wasHidden) {
      requestAnimationFrame(() => {
        this.editor?.layout();
      });
    }
  }

  /**
   * Switch to Story Mode - shows Story UI, hides Lab UI (Story 10.1).
   * @returns void
   */
  private switchToStoryMode(): void {
    // Hide Lab Mode container
    this.labModeContainer?.classList.add('da-mode-container--hidden');

    // Show Story Mode container
    this.storyModeContainer?.show();
  }

  /**
   * Get the current theme mode.
   * @returns The current theme mode
   */
  getCurrentMode(): ThemeMode {
    return this.currentMode;
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
   * Also initializes the AssemblerBridge for code assembly and ErrorPanel.
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
        // Invalidate assembly when code changes (Story 3.7)
        if (this.hasValidAssembly) {
          this.hasValidAssembly = false;
          // Story 5.2: Clear state history when code changes
          this.clearStateHistory();
          // Story 5.8: Clear breakpoints when code changes (source map invalidated)
          this.clearAllBreakpoints();
          this.toolbar?.updateState({
            canRun: false,
            canStep: false,
            canReset: false,
          });
          // Hide binary output since it's stale
          this.binaryOutputPanel?.setBinary(null);
          this.binaryToggleContainer?.classList.add('da-binary-toggle-container--hidden');
          // Clear load status since program is stale (Story 4.4)
          this.cpuState = null;
          this.statusBar?.updateState({ loadStatus: null });
          // Clear source map and editor highlight (Story 5.1)
          this.sourceMap = null;
          this.editor?.clearHighlight();
        }
      },
      onAssemble: () => this.handleAssemble(),
      onBreakpointToggle: (lineNumber) => this.handleBreakpointToggle(lineNumber),
    });
    this.editor.mount(codePanelContent as HTMLElement);

    // Initialize ErrorPanel for assembly errors (Story 3.4)
    this.initializeErrorPanel(codePanelContent as HTMLElement);

    // Initialize BinaryOutputPanel for hex dump display (Story 3.6)
    this.initializeBinaryOutputPanel(codePanelContent as HTMLElement);

    // Initialize AssemblerBridge for code assembly
    this.initializeAssemblerBridge();

    // Initialize EmulatorBridge for program execution (Story 4.4)
    this.initializeEmulatorBridge();
  }

  /**
   * Initialize the ErrorPanel below the editor.
   * @param codePanelContent - The code panel content container
   * @returns void
   */
  private initializeErrorPanel(codePanelContent: HTMLElement): void {
    // Create container for error panel
    const errorContainer = document.createElement('div');
    errorContainer.className = 'da-error-panel-container';
    codePanelContent.appendChild(errorContainer);

    this.errorPanel = new ErrorPanel({
      onErrorClick: (error) => this.handleErrorClick(error),
      onFix: (error) => this.applyFix(error),
    });
    this.errorPanel.mount(errorContainer);
  }

  /**
   * Handle click on an error in the ErrorPanel.
   * Jumps to the error location in the editor.
   * @param error - The error click info with line and optional column
   * @returns void
   */
  private handleErrorClick(error: { line: number; column?: number }): void {
    this.editor?.revealLine(error.line, error.column ?? 1);
  }

  /**
   * Apply auto-fix for an error by replacing the error line with the suggestion.
   * Triggers re-assembly after applying the fix.
   * @param error - The assembler error with a suggestion
   * @returns void
   */
  private applyFix(error: AssemblerError): void {
    if (!error.suggestion || !this.editor) return;

    const source = this.editor.getValue() ?? '';
    const lines = source.split('\n');

    // Replace the error line with the suggestion (line is 1-based)
    const lineIndex = error.line - 1;
    if (lineIndex >= 0 && lineIndex < lines.length) {
      lines[lineIndex] = error.suggestion;
      const fixedSource = lines.join('\n');
      this.editor.setValue(fixedSource);

      // Visual feedback: reveal and briefly highlight the fixed line
      this.editor.revealLine(error.line, 1);

      // Trigger re-assembly with the fixed code
      this.handleAssemble();
    }
  }

  /**
   * Destroy the ErrorPanel.
   * @returns void
   */
  private destroyErrorPanel(): void {
    if (this.errorPanel) {
      this.errorPanel.destroy();
      this.errorPanel = null;
    }
  }

  /**
   * Get the ErrorPanel instance for testing.
   * @returns The ErrorPanel instance or null if not initialized
   */
  getErrorPanel(): ErrorPanel | null {
    return this.errorPanel;
  }

  /**
   * Initialize the BinaryOutputPanel with toggle button below the error panel area.
   * @param codePanelContent - The code panel content container
   * @returns void
   */
  private initializeBinaryOutputPanel(codePanelContent: HTMLElement): void {
    // Create toggle button container (shown when assembly succeeds)
    this.binaryToggleContainer = document.createElement('div');
    this.binaryToggleContainer.className = 'da-binary-toggle-container da-binary-toggle-container--hidden';

    this.binaryToggleButton = document.createElement('button');
    this.binaryToggleButton.className = 'da-binary-toggle';
    this.binaryToggleButton.textContent = 'Binary';
    this.binaryToggleButton.type = 'button';
    this.binaryToggleButton.setAttribute('aria-label', 'Toggle binary output view');
    this.binaryToggleButton.setAttribute('aria-pressed', 'false');
    this.boundBinaryToggleHandler = () => this.handleBinaryToggle();
    this.binaryToggleButton.addEventListener('click', this.boundBinaryToggleHandler);

    this.binaryToggleContainer.appendChild(this.binaryToggleButton);
    codePanelContent.appendChild(this.binaryToggleContainer);

    // Create container for binary panel
    const binaryContainer = document.createElement('div');
    binaryContainer.className = 'da-binary-panel-container';
    codePanelContent.appendChild(binaryContainer);

    this.binaryOutputPanel = new BinaryOutputPanel({
      onToggle: (visible) => {
        // Update toggle button state
        this.binaryToggleButton?.classList.toggle('da-binary-toggle--active', visible);
        this.binaryToggleButton?.setAttribute('aria-pressed', String(visible));
      },
    });
    this.binaryOutputPanel.mount(binaryContainer);
  }

  /**
   * Handle binary toggle button click.
   */
  private handleBinaryToggle(): void {
    this.binaryOutputPanel?.toggle();
  }

  /**
   * Destroy the BinaryOutputPanel and toggle button.
   * @returns void
   */
  private destroyBinaryOutputPanel(): void {
    if (this.binaryOutputPanel) {
      this.binaryOutputPanel.destroy();
      this.binaryOutputPanel = null;
    }
    if (this.binaryToggleButton) {
      if (this.boundBinaryToggleHandler) {
        this.binaryToggleButton.removeEventListener('click', this.boundBinaryToggleHandler);
        this.boundBinaryToggleHandler = null;
      }
      this.binaryToggleButton.remove();
      this.binaryToggleButton = null;
    }
    if (this.binaryToggleContainer) {
      this.binaryToggleContainer.remove();
      this.binaryToggleContainer = null;
    }
  }

  /**
   * Get the BinaryOutputPanel instance for testing.
   * @returns The BinaryOutputPanel instance or null if not initialized
   */
  getBinaryOutputPanel(): BinaryOutputPanel | null {
    return this.binaryOutputPanel;
  }

  /**
   * Initialize the RegisterView in the State panel (Story 5.3).
   * @returns void
   */
  private initializeRegisterView(): void {
    if (!this.container) return;

    const stateContent = this.container.querySelector('.da-state-panel .da-panel-content');
    if (!stateContent) return;

    this.registerView = new RegisterView();
    this.registerView.mount(stateContent as HTMLElement);
  }

  /**
   * Destroy the RegisterView component (Story 5.3).
   * @returns void
   */
  private destroyRegisterView(): void {
    if (this.registerView) {
      this.registerView.destroy();
      this.registerView = null;
    }
  }

  /**
   * Get the RegisterView instance (Story 5.3).
   * Primarily used for testing and external state inspection.
   * @returns The RegisterView instance or null if not mounted
   */
  getRegisterView(): RegisterView | null {
    return this.registerView;
  }

  /**
   * Initialize the FlagsView in the State panel (Story 5.4).
   * Mounts after RegisterView in the panel content.
   * @returns void
   */
  private initializeFlagsView(): void {
    if (!this.container) return;

    const stateContent = this.container.querySelector('.da-state-panel .da-panel-content');
    if (!stateContent) return;

    this.flagsView = new FlagsView();
    this.flagsView.mount(stateContent as HTMLElement);
  }

  /**
   * Destroy the FlagsView component (Story 5.4).
   * @returns void
   */
  private destroyFlagsView(): void {
    if (this.flagsView) {
      this.flagsView.destroy();
      this.flagsView = null;
    }
  }

  /**
   * Get the FlagsView instance (Story 5.4).
   * Primarily used for testing and external state inspection.
   * @returns The FlagsView instance or null if not mounted
   */
  getFlagsView(): FlagsView | null {
    return this.flagsView;
  }

  /**
   * Initialize the MemoryView in the State panel (Story 5.5).
   * Mounts after FlagsView in the panel content.
   * @returns void
   */
  private initializeMemoryView(): void {
    if (!this.container) return;

    const stateContent = this.container.querySelector('.da-state-panel .da-panel-content');
    if (!stateContent) return;

    this.memoryView = new MemoryView();
    this.memoryView.mount(stateContent as HTMLElement);
  }

  /**
   * Destroy the MemoryView component (Story 5.5).
   * @returns void
   */
  private destroyMemoryView(): void {
    if (this.memoryView) {
      this.memoryView.destroy();
      this.memoryView = null;
    }
  }

  /**
   * Get the MemoryView instance (Story 5.5).
   * Primarily used for testing and external state inspection.
   * @returns The MemoryView instance or null if not mounted
   */
  getMemoryView(): MemoryView | null {
    return this.memoryView;
  }

  /**
   * Initialize the BreakpointsView in the State panel (Story 5.8).
   * Mounts after MemoryView in the panel content.
   * @returns void
   */
  private initializeBreakpointsView(): void {
    if (!this.container) return;

    const stateContent = this.container.querySelector('.da-state-panel .da-panel-content');
    if (!stateContent) return;

    this.breakpointsView = new BreakpointsView({
      onRemoveBreakpoint: (address) => this.handleRemoveBreakpoint(address),
    });
    this.breakpointsView.mount(stateContent as HTMLElement);
  }

  /**
   * Destroy the BreakpointsView component (Story 5.8).
   * @returns void
   */
  private destroyBreakpointsView(): void {
    if (this.breakpointsView) {
      this.breakpointsView.destroy();
      this.breakpointsView = null;
    }
    // Clear breakpoints map
    this.breakpoints.clear();
  }

  /**
   * Get the BreakpointsView instance (Story 5.8).
   * Primarily used for testing and external state inspection.
   * @returns The BreakpointsView instance or null if not mounted
   */
  getBreakpointsView(): BreakpointsView | null {
    return this.breakpointsView;
  }

  /**
   * Initialize the RuntimeErrorPanel in the State panel (Story 5.10).
   * Mounts after BreakpointsView in the panel content.
   * @returns void
   */
  private initializeRuntimeErrorPanel(): void {
    if (!this.container) return;

    const stateContent = this.container.querySelector('.da-state-panel .da-panel-content');
    if (!stateContent) return;

    this.runtimeErrorPanel = new RuntimeErrorPanel({
      onViewInCircuit: () => this.handleViewInCircuit(),
      onViewInCode: () => this.handleViewInCode(),
      onReset: () => this.handleRuntimeErrorReset(),
    });
    this.runtimeErrorPanel.mount(stateContent as HTMLElement);
  }

  /**
   * Destroy the RuntimeErrorPanel component (Story 5.10).
   * @returns void
   */
  private destroyRuntimeErrorPanel(): void {
    if (this.runtimeErrorPanel) {
      this.runtimeErrorPanel.destroy();
      this.runtimeErrorPanel = null;
    }
  }

  /**
   * Get the RuntimeErrorPanel instance (Story 5.10).
   * Primarily used for testing and external state inspection.
   * @returns The RuntimeErrorPanel instance or null if not mounted
   */
  getRuntimeErrorPanel(): RuntimeErrorPanel | null {
    return this.runtimeErrorPanel;
  }

  /**
   * Handle "View in Circuit" button click from RuntimeErrorPanel (Story 5.10).
   * Placeholder - circuit visualization is implemented in Epic 6.
   * Code Review Fix #8: Removed console.log noise.
   * @returns void
   */
  private handleViewInCircuit(): void {
    // Placeholder - circuit panel not yet implemented (Epic 6)
    // Button is disabled in RuntimeErrorPanel, so this is a no-op for now
  }

  /**
   * Handle "View in Code" button click from RuntimeErrorPanel (Story 5.10).
   * Highlights the error line in the editor.
   * Code Review Fix #2/#3: Access error context via getter instead of DOM parsing.
   * @returns void
   */
  private handleViewInCode(): void {
    // Get the current error PC from component state (not DOM)
    const errorContext = this.runtimeErrorPanel?.currentError;
    if (!errorContext) return;

    const pc = errorContext.pc;

    // Find the source line for this PC address
    if (!this.sourceMap) {
      // Code Review Fix #7: Provide feedback when source map unavailable
      this.statusBar?.updateState({
        loadStatus: 'Cannot navigate: no source map available',
      });
      return;
    }

    const line = this.sourceMap.addressToLine.get(pc);
    if (line !== undefined && this.editor) {
      // Scroll to and highlight the error line
      this.editor.highlightLine(line);
    }
  }

  /**
   * Handle "Reset" button click from RuntimeErrorPanel (Story 5.10).
   * Resets the emulator and clears the error panel.
   * @returns void
   */
  private handleRuntimeErrorReset(): void {
    // Reset emulator
    this.emulatorBridge?.reset().catch((err) => {
      console.error('Failed to reset emulator:', err);
    });

    // Clear the runtime error panel
    this.runtimeErrorPanel?.clearError();

    // Clear error panel (assembler errors)
    this.errorPanel?.clearErrors();

    // Update toolbar
    this.toolbar?.updateState({
      isRunning: false,
      canRun: this.hasValidAssembly,
      canPause: false,
      canStep: this.hasValidAssembly,
    });

    // Update status bar
    this.statusBar?.updateState({
      speed: null,
      loadStatus: this.hasValidAssembly ? 'Ready' : 'Not assembled',
    });
  }

  /**
   * Handle breakpoint toggle from editor gutter click (Story 5.8).
   * Toggles breakpoint at the given line number.
   * @param lineNumber - The 1-based line number clicked
   */
  private handleBreakpointToggle(lineNumber: number): void {
    // Need source map to convert line to address
    if (!this.sourceMap) {
      // No valid assembly - can't set breakpoints
      return;
    }

    // Convert line number to address
    const address = this.sourceMap.lineToAddress.get(lineNumber);
    if (address === undefined) {
      // Line doesn't map to an instruction address - ignore
      return;
    }

    // Check if breakpoint already exists at this address
    if (this.breakpoints.has(address)) {
      // Remove breakpoint
      this.breakpoints.delete(address);
      this.emulatorBridge?.clearBreakpoint(address);
    } else {
      // Add breakpoint
      this.breakpoints.set(address, lineNumber);
      this.emulatorBridge?.setBreakpoint(address);
    }

    // Update UI
    this.updateBreakpointDecorations();
    this.updateBreakpointsView();
  }

  /**
   * Handle remove breakpoint from BreakpointsView (Story 5.8).
   * Removes breakpoint at the given address.
   * @param address - The memory address of the breakpoint to remove
   */
  private handleRemoveBreakpoint(address: number): void {
    if (!this.breakpoints.has(address)) return;

    // Remove from map
    this.breakpoints.delete(address);

    // Notify emulator
    this.emulatorBridge?.clearBreakpoint(address);

    // Update UI
    this.updateBreakpointDecorations();
    this.updateBreakpointsView();
  }

  /**
   * Clear all breakpoints (Story 5.8).
   * Called when code changes (source map invalidated).
   */
  private clearAllBreakpoints(): void {
    // Clear from emulator
    for (const address of this.breakpoints.keys()) {
      this.emulatorBridge?.clearBreakpoint(address);
    }

    // Clear local map
    this.breakpoints.clear();

    // Update UI
    this.editor?.clearBreakpointDecorations();
    this.breakpointsView?.updateState({ breakpoints: [] });
  }

  /**
   * Update editor breakpoint decorations based on current breakpoints (Story 5.8).
   */
  private updateBreakpointDecorations(): void {
    const lines = Array.from(this.breakpoints.values());
    this.editor?.setBreakpointDecorations(lines);
  }

  /**
   * Update BreakpointsView with current breakpoints (Story 5.8).
   */
  private updateBreakpointsView(): void {
    const entries: BreakpointEntry[] = [];
    for (const [address, line] of this.breakpoints.entries()) {
      entries.push({ address, line });
    }
    // Sort by address for consistent display
    entries.sort((a, b) => a.address - b.address);
    this.breakpointsView?.updateState({ breakpoints: entries });
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
   * Initialize the EmulatorBridge for WASM worker communication.
   * Runs asynchronously to avoid blocking UI during WASM loading.
   * @returns void
   */
  private initializeEmulatorBridge(): void {
    this.emulatorBridge = new EmulatorBridge();

    // Initialize asynchronously - don't block UI
    this.emulatorBridge.init().catch((error) => {
      console.error('Failed to initialize EmulatorBridge:', error);
      // Show warning in status bar so user knows emulator won't work (Issue #4 fix)
      this.statusBar?.updateState({
        loadStatus: 'Emulator init failed',
      });
    });
  }

  /**
   * Destroy the EmulatorBridge and clean up resources.
   * @returns void
   */
  private destroyEmulatorBridge(): void {
    // Clean up subscriptions first (Story 4.5)
    this.cleanupEmulatorSubscriptions();
    this.isRunning = false;

    if (this.emulatorBridge) {
      this.emulatorBridge.terminate();
      this.emulatorBridge = null;
    }
    this.cpuState = null;
  }

  /**
   * Load a program into the emulator (Story 4.4).
   * Resets CPU to initial state and loads the binary into memory.
   * Updates status bar with load status.
   * @param binary - The assembled program bytes (nibbles)
   * @returns void
   */
  private async loadProgramIntoEmulator(binary: Uint8Array): Promise<void> {
    // Issue #1 fix: Explicit null guard before any operations
    if (!this.emulatorBridge) {
      console.error('EmulatorBridge not initialized');
      this.statusBar?.updateState({ loadStatus: null, pcValue: null, cycleCount: 0 });
      return;
    }

    // Check if emulator is ready
    if (!this.emulatorBridge.isReady) {
      // Emulator not ready yet - try to wait for init
      try {
        await this.emulatorBridge.init();
      } catch {
        console.error('EmulatorBridge not ready for program load');
        this.statusBar?.updateState({ loadStatus: null, pcValue: null, cycleCount: 0 });
        return;
      }
    }

    try {
      // Story 5.2: Clear state history on program load
      this.clearStateHistory();

      // loadProgram resets CPU and copies binary to memory
      // Issue #6 fix: No need for ! since we've already guarded for null above
      this.cpuState = await this.emulatorBridge.loadProgram(binary);

      // Update status bar with load status
      // Issue #2 fix: Use "nibbles" instead of "bytes" for Micro4 terminology
      this.statusBar?.updateState({
        loadStatus: `Loaded: ${binary.length} nibbles`,
        pcValue: this.cpuState.pc,
        cycleCount: this.cpuState.cycles,
      });

      // Highlight the first instruction after load (Story 5.1)
      this.highlightCurrentInstruction(this.cpuState.pc);

      // Update RegisterView with initial state (Story 5.3)
      this.registerView?.updateState({
        pc: this.cpuState.pc,
        accumulator: this.cpuState.accumulator,
      });

      // Update FlagsView with initial state (Story 5.4)
      this.flagsView?.updateState({
        zeroFlag: this.cpuState.zeroFlag,
      });

      // Update MemoryView with initial state (Story 5.5)
      this.memoryView?.updateState({
        memory: this.cpuState.memory,
        pc: this.cpuState.pc,
      });
    } catch (error) {
      // Handle load errors
      console.error('Failed to load program into emulator:', error);
      this.cpuState = null;
      // Issue #3 fix: Reset all emulator-related status bar fields
      this.statusBar?.updateState({ loadStatus: null, pcValue: null, cycleCount: 0 });
    }
  }

  /**
   * Handle Run button click (Story 4.5).
   * Starts continuous program execution at the configured speed.
   * @returns void
   */
  private handleRun(): void {
    // Guard: Can't run if no valid assembly or already running
    if (!this.hasValidAssembly || this.isRunning) return;

    // Guard: Can't run without emulator bridge
    if (!this.emulatorBridge?.isReady) {
      console.error('EmulatorBridge not ready for execution');
      return;
    }

    // Set up event subscriptions before starting
    this.setupEmulatorSubscriptions();

    // Start execution - convert Hz to speed parameter
    // speed = instructions per ~16ms tick = Hz / 60
    const speed = Math.max(1, Math.round(this.executionSpeed / 60));
    this.emulatorBridge.run(speed);

    // Update running state
    this.isRunning = true;

    // Update UI to show Pause button and disable other controls
    this.toolbar?.updateState({
      isRunning: true,
      canRun: false,
      canPause: true,
      canStep: false,
    });

    // Update status bar with speed, clear breakpoint hit message (Story 5.9)
    this.statusBar?.updateState({
      speed: this.executionSpeed,
      breakpointHitAddress: null,
    });

    // Story 5.10: Clear any previous runtime error when starting new run
    this.runtimeErrorPanel?.clearError();
  }

  /**
   * Handle Pause button click (Story 4.5).
   * Stops continuous program execution.
   * @returns void
   */
  private async handlePause(): Promise<void> {
    if (!this.isRunning || !this.emulatorBridge) return;

    try {
      // Stop execution and get final state
      this.cpuState = await this.emulatorBridge.stop();

      // Update running state
      this.isRunning = false;

      // Clean up subscriptions
      this.cleanupEmulatorSubscriptions();

      // Update UI to show Run button
      this.toolbar?.updateState({
        isRunning: false,
        canRun: true,
        canPause: false,
        canStep: true,
      });

      // Update status bar with final state
      this.statusBar?.updateState({
        pcValue: this.cpuState.pc,
        cycleCount: this.cpuState.cycles,
        speed: null,
      });
    } catch (error) {
      console.error('Failed to pause execution:', error);
      // Reset running state even on error
      this.isRunning = false;
      this.cleanupEmulatorSubscriptions();
      this.toolbar?.updateState({
        isRunning: false,
        canRun: this.hasValidAssembly,
        canPause: false,
        canStep: this.hasValidAssembly,
      });
      // Update status bar to indicate pause failed
      this.statusBar?.updateState({
        speed: null,
        loadStatus: 'Pause failed',
      });
    }
  }

  /**
   * Handle Reset button click (Story 4.7).
   * Resets the CPU to initial state (PC=0, Accumulator=0, Flags cleared, Memory restored).
   * Stops execution first if running.
   * @returns void
   */
  private async handleReset(): Promise<void> {
    if (!this.emulatorBridge) return;

    try {
      // Story 5.2: Clear state history on reset
      this.clearStateHistory();

      // Reset CPU state (stops if running automatically)
      this.cpuState = await this.emulatorBridge.reset();

      // Update running state
      this.isRunning = false;

      // Clean up any active subscriptions
      this.cleanupEmulatorSubscriptions();

      // Update UI to show Run button and enable controls
      this.toolbar?.updateState({
        isRunning: false,
        canRun: true,
        canPause: false,
        canStep: true,
        canReset: true,
      });

      // Update status bar with reset state
      this.statusBar?.updateState({
        pcValue: this.cpuState.pc,
        cycleCount: this.cpuState.cycles,
        speed: null,
        loadStatus: 'Reset',
      });

      // Highlight the first instruction after reset (Story 5.1)
      this.highlightCurrentInstruction(this.cpuState.pc);

      // Update RegisterView with reset state (Story 5.3)
      this.registerView?.updateState({
        pc: this.cpuState.pc,
        accumulator: this.cpuState.accumulator,
      });

      // Update FlagsView with reset state (Story 5.4)
      this.flagsView?.updateState({
        zeroFlag: this.cpuState.zeroFlag,
      });

      // Update MemoryView with reset state (Story 5.5)
      this.memoryView?.updateState({
        memory: this.cpuState.memory,
        pc: this.cpuState.pc,
      });
    } catch (error) {
      console.error('Failed to reset:', error);
      // Reset running state even on error
      this.isRunning = false;
      this.cleanupEmulatorSubscriptions();
      this.toolbar?.updateState({
        isRunning: false,
        canRun: this.hasValidAssembly,
        canPause: false,
        canStep: this.hasValidAssembly,
        canReset: this.hasValidAssembly,
      });
      // Update status bar to indicate reset failed
      this.statusBar?.updateState({
        speed: null,
        loadStatus: 'Reset failed',
      });
    }
  }

  /**
   * Handle speed slider change (Story 4.5, enhanced in Story 4.8).
   * Updates the execution speed and notifies the emulator if running.
   * @param speed - New execution speed in Hz (1-1000)
   */
  private handleSpeedChange(speed: number): void {
    this.executionSpeed = speed;
    // Update status bar if currently running
    if (this.isRunning) {
      this.statusBar?.updateState({ speed: this.executionSpeed });
      // Story 4.8: Update running emulator speed in real-time
      // Convert Hz to worker speed (instructions per ~16ms tick)
      const workerSpeed = Math.max(1, Math.round(this.executionSpeed / 60));
      this.emulatorBridge?.setSpeed(workerSpeed);
    }
  }

  /**
   * Handle Step button click (Story 5.1).
   * Executes exactly one instruction and updates UI with the result.
   * @returns void
   */
  private async handleStep(): Promise<void> {
    // Guard: Can't step if no valid assembly or already running
    if (!this.hasValidAssembly || this.isRunning) return;

    // Guard: Can't step without emulator bridge
    if (!this.emulatorBridge?.isReady) {
      console.error('EmulatorBridge not ready for step');
      return;
    }

    try {
      // Story 5.2: Push current state to history BEFORE stepping
      if (this.cpuState) {
        this.pushStateToHistory(this.cpuState);
      }

      // Execute one instruction and get the resulting state
      this.cpuState = await this.emulatorBridge.step();

      // Update status bar with new state, clear breakpoint hit message (Story 5.9)
      if (this.cpuState.halted) {
        this.statusBar?.updateState({
          assemblyMessage: 'Program halted',
          pcValue: this.cpuState.pc,
          cycleCount: this.cpuState.cycles,
          breakpointHitAddress: null,
        });
      } else {
        // Format PC as 2-digit hex with 0x prefix
        const pcHex = this.cpuState.pc.toString(16).toUpperCase().padStart(2, '0');
        this.statusBar?.updateState({
          assemblyMessage: `Stepped to 0x${pcHex}`,
          pcValue: this.cpuState.pc,
          cycleCount: this.cpuState.cycles,
          breakpointHitAddress: null,
        });
      }

      // Highlight current instruction line in editor (Story 5.1)
      this.highlightCurrentInstruction(this.cpuState.pc);

      // Update RegisterView with new state (Story 5.3)
      this.registerView?.updateState({
        pc: this.cpuState.pc,
        accumulator: this.cpuState.accumulator,
      });

      // Update FlagsView with new state (Story 5.4)
      this.flagsView?.updateState({
        zeroFlag: this.cpuState.zeroFlag,
      });

      // Update MemoryView with new state (Story 5.5)
      this.memoryView?.updateState({
        memory: this.cpuState.memory,
        pc: this.cpuState.pc,
      });

      // Story 5.2: Enable Step Back button if history exists
      this.toolbar?.updateState({ canStepBack: this.stateHistory.length > 0 });

      // Story 5.10: Clear any previous runtime error on successful step
      this.runtimeErrorPanel?.clearError();

    } catch (error) {
      console.error('Failed to step:', error);
      // Could update status bar to show error if needed
    }
  }

  /**
   * Handle step back button click - restores previous CPU state from history (Story 5.2).
   * @returns Promise that resolves when step back is complete
   */
  private async handleStepBack(): Promise<void> {
    // Guard: Can't step back if no history, running, or no valid assembly
    if (this.stateHistory.length === 0 || this.isRunning || !this.hasValidAssembly) return;

    // Guard: Can't step back without emulator bridge
    if (!this.emulatorBridge?.isReady) {
      console.error('EmulatorBridge not ready for step back');
      return;
    }

    // Calculate target history index
    let targetIndex: number;
    if (this.historyPointer === -1) {
      // First step back - go to most recent history entry
      targetIndex = this.stateHistory.length - 1;
    } else {
      // Subsequent step back - go to previous entry
      targetIndex = this.historyPointer - 1;
    }

    // Guard: Can't step back beyond beginning of history
    if (targetIndex < 0) return;

    try {
      // Get the state from history
      const historyEntry = this.stateHistory[targetIndex];
      const historicalState = historyEntry.state;

      // Restore state to emulator (memory only - WASM doesn't support register setters)
      // The emulator will reset PC to 0, but we use the historical values for UI
      await this.emulatorBridge.restoreState(historicalState);

      // Update cpuState with historical values for correct UI display
      // Note: Memory is correctly restored in emulator, but registers reset to 0
      // We track the historical state for UI purposes
      this.cpuState = historicalState;

      // Update history pointer
      this.historyPointer = targetIndex;

      // Update status bar using historical PC (not emulator's reset PC)
      const pcHex = historicalState.pc.toString(16).toUpperCase().padStart(2, '0');
      this.statusBar?.updateState({
        assemblyMessage: `Stepped back to 0x${pcHex}`,
        pcValue: historicalState.pc,
        cycleCount: historicalState.cycles,
      });

      // Highlight the instruction at historical PC (not emulator's reset PC)
      this.highlightCurrentInstruction(historicalState.pc);

      // Update RegisterView with historical state (Story 5.3)
      this.registerView?.updateState({
        pc: historicalState.pc,
        accumulator: historicalState.accumulator,
      });

      // Update FlagsView with historical state (Story 5.4)
      this.flagsView?.updateState({
        zeroFlag: historicalState.zeroFlag,
      });

      // Update MemoryView with historical state (Story 5.5)
      this.memoryView?.updateState({
        memory: historicalState.memory,
        pc: historicalState.pc,
      });

      // Update Step Back button state
      this.toolbar?.updateState({ canStepBack: targetIndex > 0 });

    } catch (error) {
      console.error('Failed to step back:', error);
    }
  }

  /**
   * Highlight the current instruction line in the editor based on PC value.
   * Uses the source map built during assembly to correlate PC to line number.
   * @param pc - The current program counter value
   */
  private highlightCurrentInstruction(pc: number): void {
    if (!this.editor || !this.sourceMap) return;

    const lineNumber = this.sourceMap.addressToLine.get(pc);
    if (lineNumber !== undefined) {
      this.editor.highlightLine(lineNumber);
    }
    // If PC doesn't map to a source line (e.g., in data section), don't change highlight
  }

  /**
   * Push current CPU state to history before stepping (Story 5.2).
   * If stepping from a history position, truncates future states.
   * Enforces MAX_HISTORY_SIZE by removing oldest entries.
   * @param state - The CPU state to record
   */
  private pushStateToHistory(state: CPUState): void {
    // If we're stepping from a history position, truncate future states
    if (this.historyPointer >= 0 && this.historyPointer < this.stateHistory.length - 1) {
      this.stateHistory = this.stateHistory.slice(0, this.historyPointer + 1);
    }

    // Push the current state
    this.stateHistory.push({
      state: { ...state, memory: new Uint8Array(state.memory) }, // Deep copy memory
      timestamp: Date.now(),
    });

    // Enforce MAX_HISTORY_SIZE by removing oldest entries
    while (this.stateHistory.length > MAX_HISTORY_SIZE) {
      this.stateHistory.shift();
    }

    // Reset pointer to latest (tracking mode)
    this.historyPointer = -1;
  }

  /**
   * Clear all state history and reset pointer (Story 5.2).
   * Called on program load, reset, or code change.
   */
  private clearStateHistory(): void {
    this.stateHistory = [];
    this.historyPointer = -1;
    // Update toolbar to disable Step Back button
    this.toolbar?.updateState({ canStepBack: false });
  }

  /**
   * Build a source map from assembly source code (Story 5.1).
   * Maps PC addresses to source line numbers for debugging.
   * @param source - The assembly source code
   * @returns SourceMap object with address-to-line and line-to-address mappings
   */
  private buildSourceMap(source: string): SourceMap {
    const lines = source.split('\n');
    const addressToLine = new Map<number, number>();
    const lineToAddress = new Map<number, number>();
    let address = 0;

    for (let lineNum = 1; lineNum <= lines.length; lineNum++) {
      const line = lines[lineNum - 1].trim();

      // Skip empty lines
      if (!line) continue;

      // Skip comment-only lines
      if (line.startsWith(';')) continue;

      // Strip inline comments for parsing
      const codePart = line.split(';')[0].trim();
      if (!codePart) continue;

      // Check for ORG directive (supports decimal, 0x hex, and $ hex prefix)
      const orgMatch = codePart.match(/^ORG\s+(?:0x|\$)?([0-9A-Fa-f]+)/i);
      if (orgMatch) {
        // Determine base: if original had 0x or $ prefix, or if contains a-f, use hex
        const hasHexPrefix = /^ORG\s+(?:0x|\$)/i.test(codePart);
        const hasHexDigits = /[A-Fa-f]/.test(orgMatch[1]);
        const base = (hasHexPrefix || hasHexDigits) ? 16 : 10;
        address = parseInt(orgMatch[1], base);
        continue;
      }

      // Skip label-only lines (ends with : and nothing else meaningful after)
      const labelMatch = codePart.match(/^([A-Za-z_][A-Za-z0-9_]*):(.*)$/);
      if (labelMatch) {
        const afterLabel = labelMatch[2].trim();
        if (!afterLabel) continue; // Label only, no instruction on this line
        // Otherwise, there's an instruction after the label on the same line
      }

      // Handle DB/DW directives (data, not executable instructions)
      // They consume address space but aren't "steppable" instructions
      const dbMatch = codePart.match(/^(?:[A-Za-z_][A-Za-z0-9_]*:\s*)?(DB)\s+(.+)/i);
      const dwMatch = codePart.match(/^(?:[A-Za-z_][A-Za-z0-9_]*:\s*)?(DW)\s+(.+)/i);
      if (dbMatch) {
        // DB consumes 1 byte (2 nibbles) per value
        const values = dbMatch[2].split(',').length;
        address += values * 2;
        continue;
      }
      if (dwMatch) {
        // DW consumes 2 bytes (4 nibbles) per value
        const values = dwMatch[2].split(',').length;
        address += values * 4;
        continue;
      }

      // This line has an instruction at current address
      addressToLine.set(address, lineNum);
      lineToAddress.set(lineNum, address);

      // Advance address by 2 nibbles (1 byte) for Micro4 instructions
      // Each instruction is 2 nibbles = 8 bits = 1 byte in memory
      address += 2;
    }

    return { addressToLine, lineToAddress };
  }

  /**
   * Set up emulator event subscriptions for Run mode (Story 4.5).
   * Must be called before starting execution.
   * @returns void
   */
  private setupEmulatorSubscriptions(): void {
    if (!this.emulatorBridge) return;

    // Clean up any existing subscriptions first
    this.cleanupEmulatorSubscriptions();

    // Subscribe to state updates with throttling for high-speed execution
    this.unsubscribeStateUpdate = this.emulatorBridge.onStateUpdate((state) => {
      this.cpuState = state;

      // Throttle UI updates to prevent performance issues at high speeds
      const now = performance.now();
      if (now - this.lastStateUpdateTime >= this.STATE_UPDATE_THROTTLE_MS) {
        this.lastStateUpdateTime = now;
        // Update status bar with current state
        this.statusBar?.updateState({
          pcValue: state.pc,
          cycleCount: state.cycles,
        });
        // Update RegisterView during RUN mode (Story 5.3)
        this.registerView?.updateState({
          pc: state.pc,
          accumulator: state.accumulator,
        });

        // Update FlagsView during RUN mode (Story 5.4)
        this.flagsView?.updateState({
          zeroFlag: state.zeroFlag,
        });

        // Update MemoryView during RUN mode (Story 5.5)
        this.memoryView?.updateState({
          memory: state.memory,
          pc: state.pc,
        });
      }
    });

    // Subscribe to halted events (HLT instruction)
    this.unsubscribeHalted = this.emulatorBridge.onHalted(() => {
      this.handleExecutionHalted();
    });

    // Subscribe to error events
    this.unsubscribeError = this.emulatorBridge.onError((error) => {
      this.handleExecutionError(error);
    });

    // Subscribe to breakpoint hit events (Story 5.9)
    this.unsubscribeBreakpointHit = this.emulatorBridge.onBreakpointHit((address) => {
      this.handleBreakpointHit(address);
    });
  }

  /**
   * Clean up emulator event subscriptions (Story 4.5).
   * @returns void
   */
  private cleanupEmulatorSubscriptions(): void {
    if (this.unsubscribeStateUpdate) {
      this.unsubscribeStateUpdate();
      this.unsubscribeStateUpdate = null;
    }
    if (this.unsubscribeHalted) {
      this.unsubscribeHalted();
      this.unsubscribeHalted = null;
    }
    if (this.unsubscribeError) {
      this.unsubscribeError();
      this.unsubscribeError = null;
    }
    if (this.unsubscribeBreakpointHit) {
      this.unsubscribeBreakpointHit();
      this.unsubscribeBreakpointHit = null;
    }
  }

  /**
   * Handle CPU halted event (HLT instruction) (Story 4.5).
   * @returns void
   */
  private handleExecutionHalted(): void {
    this.isRunning = false;
    this.cleanupEmulatorSubscriptions();

    // Update UI to show Run button
    this.toolbar?.updateState({
      isRunning: false,
      canRun: true,
      canPause: false,
      canStep: true,
    });

    // Update status bar with halted state
    this.statusBar?.updateState({
      speed: null,
      loadStatus: 'Halted',
    });

    // Update RegisterView with final halted state (Story 5.3)
    if (this.cpuState) {
      this.registerView?.updateState({
        pc: this.cpuState.pc,
        accumulator: this.cpuState.accumulator,
      });

      // Update FlagsView with final halted state (Story 5.4)
      this.flagsView?.updateState({
        zeroFlag: this.cpuState.zeroFlag,
      });

      // Update MemoryView with final halted state (Story 5.5)
      this.memoryView?.updateState({
        memory: this.cpuState.memory,
        pc: this.cpuState.pc,
      });
    }
  }

  /**
   * Handle execution error event (Story 4.5, enhanced in Story 5.10).
   * @param error - Error details from the emulator, including optional rich context (Story 5.10)
   * @returns void
   */
  private handleExecutionError(error: {
    message: string;
    address?: number;
    context?: RuntimeErrorContext;
  }): void {
    this.isRunning = false;
    this.cleanupEmulatorSubscriptions();

    // Update UI to show Run button
    this.toolbar?.updateState({
      isRunning: false,
      canRun: true,
      canPause: false,
      canStep: true,
    });

    // Display error in error panel (keep for backward compatibility)
    // Use line 1 as fallback when address is unknown (line 0 is invalid for editor navigation)
    this.errorPanel?.setErrors([{
      line: error.address !== undefined ? error.address : 1,
      message: `Runtime error: ${error.message}`,
      type: 'RUNTIME_ERROR',
    }]);

    // Display rich error in RuntimeErrorPanel (Story 5.10)
    if (error.context) {
      this.runtimeErrorPanel?.setError(error.context, error.message);
    }

    // Update status bar
    this.statusBar?.updateState({
      speed: null,
      loadStatus: 'Error',
    });

    console.error('Execution error:', error);
  }

  /**
   * Handle breakpoint hit event during execution (Story 5.9).
   * Pauses execution, updates UI, and highlights the breakpoint line.
   * @param address - Memory address where breakpoint was hit
   * @returns void
   */
  private handleBreakpointHit(address: number): void {
    // Stop execution state
    this.isRunning = false;
    this.cleanupEmulatorSubscriptions();

    // Update toolbar to allow continue (Run) or Step
    this.toolbar?.updateState({
      isRunning: false,
      canRun: true,   // Can continue running
      canPause: false,
      canStep: true,  // Can step from breakpoint
    });

    // Update status bar with breakpoint hit message
    this.statusBar?.updateState({
      speed: null,
      breakpointHitAddress: address,
    });

    // Highlight the breakpoint line in editor using source map
    if (this.sourceMap && this.editor) {
      const lineNumber = this.sourceMap.addressToLine.get(address);
      if (lineNumber !== undefined) {
        this.editor.highlightLine(lineNumber);
      }
    }

    // Update RegisterView with state at breakpoint (Story 5.3)
    if (this.cpuState) {
      this.registerView?.updateState({
        pc: this.cpuState.pc,
        accumulator: this.cpuState.accumulator,
      });

      // Update FlagsView with state at breakpoint (Story 5.4)
      this.flagsView?.updateState({
        zeroFlag: this.cpuState.zeroFlag,
      });

      // Update MemoryView with state at breakpoint (Story 5.5)
      this.memoryView?.updateState({
        memory: this.cpuState.memory,
        pc: this.cpuState.pc,
      });
    }

    // Update status bar with PC and cycle count
    if (this.cpuState) {
      this.statusBar?.updateState({
        pcValue: this.cpuState.pc,
        cycleCount: this.cpuState.cycles,
      });
    }
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
   * Also updates ErrorPanel and editor decorations for assembly errors (Story 3.4).
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

    // Clear previous errors before assembly
    this.errorPanel?.clearErrors();
    this.editor?.clearErrorDecorations();

    try {
      const result = await this.assemblerBridge.assemble(source);
      this.lastAssembleResult = result;

      if (result.success) {
        const byteCount = result.binary?.length ?? 0;
        this.statusBar?.updateState({
          assemblyStatus: 'success',
          assemblyMessage: `${byteCount} bytes`,
        });
        // Mark assembly as valid (Story 3.7)
        this.hasValidAssembly = true;

        // Build source map for PC-to-line correlation (Story 5.1)
        this.sourceMap = this.buildSourceMap(source);

        // Enable execution buttons (Run, Step, Reset)
        this.toolbar?.updateState({
          canAssemble: true,
          canRun: true,
          canStep: true,
          canReset: true,
        });

        // Show binary output toggle and set binary data (Story 3.6)
        this.binaryToggleContainer?.classList.remove('da-binary-toggle-container--hidden');
        this.binaryOutputPanel?.setBinary(result.binary);

        // Auto-load into emulator (Story 4.4)
        if (result.binary) {
          await this.loadProgramIntoEmulator(result.binary);
        }
      } else {
        // Mark assembly as invalid (Story 3.7)
        this.hasValidAssembly = false;
        // Display error message in status bar
        const errorMsg = result.error?.message ?? 'Assembly failed';
        this.statusBar?.updateState({
          assemblyStatus: 'error',
          assemblyMessage: errorMsg,
        });
        this.toolbar?.updateState({ canAssemble: true });

        // Display detailed errors in ErrorPanel and editor decorations (Story 3.4)
        if (result.error) {
          const errors = [result.error];
          this.errorPanel?.setErrors(errors);
          this.editor?.setErrorDecorations(errors);
        }

        // Hide binary toggle and clear binary data on error (Story 3.6)
        this.binaryToggleContainer?.classList.add('da-binary-toggle-container--hidden');
        this.binaryOutputPanel?.setBinary(null);
        this.binaryOutputPanel?.hide();
      }
    } catch (error) {
      // Handle unexpected errors (worker crash, timeout, etc.)
      // Mark assembly as invalid (Story 3.7)
      this.hasValidAssembly = false;
      const errorMsg = error instanceof Error ? error.message : 'Unexpected error';
      this.statusBar?.updateState({
        assemblyStatus: 'error',
        assemblyMessage: errorMsg,
      });
      // Re-enable Assemble but disable execution buttons (Story 3.7)
      this.toolbar?.updateState({
        canAssemble: true,
        canRun: false,
        canStep: false,
        canReset: false,
      });
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
      onRunClick: () => this.handleRun(),
      onPauseClick: () => this.handlePause(),
      onResetClick: () => this.handleReset(),
      onStepClick: () => this.handleStep(),
      onStepBackClick: () => this.handleStepBack(),
      onSpeedChange: (speed) => this.handleSpeedChange(speed),
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
   * Handle global keyboard shortcuts (Story 10.1, 5.1).
   * @param e - Keyboard event
   * @returns void
   */
  private handleGlobalKeydown(e: KeyboardEvent): void {
    // Ctrl+Shift+M: Toggle Story/Lab mode
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'm') {
      e.preventDefault();
      const newMode: ThemeMode = this.currentMode === 'lab' ? 'story' : 'lab';
      this.handleModeChange(newMode);
      // Sync menu bar toggle state
      this.menuBar?.updateState({ currentMode: newMode });
      return;
    }

    // F10: Step one instruction (Story 5.1)
    if (e.key === 'F10') {
      e.preventDefault();
      // Only step if we have valid assembly and not currently running
      if (this.hasValidAssembly && !this.isRunning) {
        this.handleStep();
      }
    }

    // F9: Step back one instruction (Story 5.2)
    if (e.key === 'F9') {
      e.preventDefault();
      // Only step back if we have history, valid assembly and not currently running
      if (this.stateHistory.length > 0 && this.hasValidAssembly && !this.isRunning) {
        this.handleStepBack();
      }
    }
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

    // Remove keyboard shortcut listener (Story 10.1)
    if (this.boundKeydownHandler) {
      window.removeEventListener('keydown', this.boundKeydownHandler);
    }

    // Destroy menu bar
    this.destroyMenuBar();

    // Destroy story mode container (Story 10.1)
    this.destroyStoryModeContainer();

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

    // Destroy emulator bridge (Story 4.4)
    this.destroyEmulatorBridge();

    // Destroy error panel
    this.destroyErrorPanel();

    // Destroy RegisterView (Story 5.3)
    this.destroyRegisterView();

    // Destroy FlagsView (Story 5.4)
    this.destroyFlagsView();

    // Destroy MemoryView (Story 5.5)
    this.destroyMemoryView();

    // Destroy BreakpointsView (Story 5.8)
    this.destroyBreakpointsView();

    // Destroy RuntimeErrorPanel (Story 5.10)
    this.destroyRuntimeErrorPanel();

    // Destroy binary output panel
    this.destroyBinaryOutputPanel();

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

    // Reset assembly state (Story 3.7)
    this.hasValidAssembly = false;

    // Clear CSS custom properties
    document.documentElement.style.removeProperty('--da-code-panel-width');
    document.documentElement.style.removeProperty('--da-state-panel-width');

    this.isMounted = false;
  }
}
