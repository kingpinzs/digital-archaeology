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

  // Flag indicating program is currently running (Story 4.5)
  private isRunning: boolean = false;

  // Current execution speed in Hz (Story 4.5)
  private executionSpeed: number = 60;

  // Unsubscribe functions for emulator event callbacks (Story 4.5)
  private unsubscribeStateUpdate: (() => void) | null = null;
  private unsubscribeHalted: (() => void) | null = null;
  private unsubscribeError: (() => void) | null = null;

  // Throttling for high-speed UI updates (Story 4.5)
  private lastStateUpdateTime: number = 0;
  private readonly STATE_UPDATE_THROTTLE_MS = 16; // ~60fps max UI updates

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
        }
      },
      onAssemble: () => this.handleAssemble(),
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

    // Update status bar with speed
    this.statusBar?.updateState({
      speed: this.executionSpeed,
    });
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
  }

  /**
   * Handle execution error event (Story 4.5).
   * @param error - Error details from the emulator
   * @returns void
   */
  private handleExecutionError(error: { message: string; address?: number }): void {
    this.isRunning = false;
    this.cleanupEmulatorSubscriptions();

    // Update UI to show Run button
    this.toolbar?.updateState({
      isRunning: false,
      canRun: true,
      canPause: false,
      canStep: true,
    });

    // Display error in error panel
    // Use line 1 as fallback when address is unknown (line 0 is invalid for editor navigation)
    this.errorPanel?.setErrors([{
      line: error.address !== undefined ? error.address : 1,
      message: `Runtime error: ${error.message}`,
      type: 'RUNTIME_ERROR',
    }]);

    // Update status bar
    this.statusBar?.updateState({
      speed: null,
      loadStatus: 'Error',
    });

    console.error('Execution error:', error);
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
      onStepClick: () => { /* Epic 5: Debugging */ },
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
   * Handle global keyboard shortcuts (Story 10.1).
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
