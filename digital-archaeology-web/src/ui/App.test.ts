import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Monaco editor for App tests
const {
  mockEditorInstance,
  mockModel,
  cursorPositionListeners,
  contentChangeListeners,
  addedActions,
  mockCursorDisposable,
} = vi.hoisted(() => {
  const mockModel = {
    undo: vi.fn(),
    redo: vi.fn(),
  };

  // Track cursor position listeners for testing
  const cursorPositionListeners: Array<(e: { position: { lineNumber: number; column: number } }) => void> = [];
  const mockCursorDisposable = { dispose: vi.fn() };

  // Track content change listeners for testing
  const contentChangeListeners: Array<() => void> = [];

  // Track added actions for testing
  const addedActions: Array<{ id: string; label: string; keybindings: number[]; run: () => void }> = [];

  // Track editor content
  let editorContent = '';

  const mockEditorInstance = {
    dispose: vi.fn(),
    getValue: vi.fn(() => editorContent),
    setValue: vi.fn((value: string) => {
      editorContent = value;
      contentChangeListeners.forEach(cb => cb());
    }),
    getModel: vi.fn(() => mockModel),
    focus: vi.fn(),
    layout: vi.fn(),
    onDidChangeCursorPosition: vi.fn((callback: (e: { position: { lineNumber: number; column: number } }) => void) => {
      cursorPositionListeners.push(callback);
      return mockCursorDisposable;
    }),
    onDidChangeModelContent: vi.fn((callback: () => void) => {
      contentChangeListeners.push(callback);
      return { dispose: vi.fn() };
    }),
    addAction: vi.fn((action: { id: string; label: string; keybindings: number[]; run: () => void }) => {
      addedActions.push(action);
      return { dispose: vi.fn() };
    }),
    // Helper to reset content for tests
    _setContent: (content: string) => {
      editorContent = content;
    },
    _resetContent: () => {
      editorContent = '';
    },
  };

  return {
    mockEditorInstance,
    mockModel,
    cursorPositionListeners,
    contentChangeListeners,
    addedActions,
    mockCursorDisposable,
  };
});

vi.mock('monaco-editor', () => ({
  editor: {
    create: vi.fn(() => mockEditorInstance),
    defineTheme: vi.fn(),
  },
  languages: {
    register: vi.fn(),
    setLanguageConfiguration: vi.fn(),
    setMonarchTokensProvider: vi.fn(),
  },
  KeyMod: {
    CtrlCmd: 2048,
  },
  KeyCode: {
    Enter: 3,
  },
}));

// Mock AssemblerBridge - must be properly hoisted to work as constructor
const { MockAssemblerBridge, mockAssemblerBridge } = vi.hoisted(() => {
  // Type for assembly result
  type AssemblyResult = {
    success: boolean;
    binary: Uint8Array | null;
    error: { line: number; message: string } | null;
  };

  // Mutable state for test manipulation
  const state: { isReady: boolean; assembleResult: AssemblyResult } = {
    isReady: true,
    assembleResult: {
      success: true,
      binary: new Uint8Array([0x01, 0x05, 0x0F]),
      error: null,
    },
  };

  // Mock methods
  const initMock = vi.fn(() => Promise.resolve());
  const assembleMock = vi.fn(() => Promise.resolve(state.assembleResult));
  const terminateMock = vi.fn();

  // Constructor function that will be used as the class
  function MockAssemblerBridge() {
    return {
      init: initMock,
      assemble: assembleMock,
      terminate: terminateMock,
      get isReady() {
        return state.isReady;
      },
    };
  }

  // Helpers for test manipulation
  const helpers = {
    init: initMock,
    assemble: assembleMock,
    terminate: terminateMock,
    get isReady() {
      return state.isReady;
    },
    _setReady: (ready: boolean) => {
      state.isReady = ready;
    },
    _setAssembleResult: (result: AssemblyResult) => {
      state.assembleResult = result;
      assembleMock.mockImplementation(() => Promise.resolve(result));
    },
    _reset: () => {
      state.isReady = true;
      state.assembleResult = {
        success: true,
        binary: new Uint8Array([0x01, 0x05, 0x0F]),
        error: null,
      };
      initMock.mockClear();
      assembleMock.mockClear();
      terminateMock.mockClear();
      assembleMock.mockImplementation(() => Promise.resolve(state.assembleResult));
    },
  };

  return { MockAssemblerBridge, mockAssemblerBridge: helpers };
});

vi.mock('@emulator/index', () => ({
  AssemblerBridge: MockAssemblerBridge,
}));

import { App } from './App';
import { resetThemeRegistration, resetLanguageRegistration } from '@editor/index';
import { PANEL_CONSTRAINTS } from './PanelResizer';

describe('App', () => {
  let container: HTMLDivElement;
  let app: App;

  beforeEach(() => {
    vi.clearAllMocks();
    container = document.createElement('div');
    container.id = 'app';
    document.body.appendChild(container);
    app = new App();
    // Reset global theme and language state for each test
    resetThemeRegistration();
    resetLanguageRegistration();
  });

  afterEach(() => {
    app.destroy();
    document.body.removeChild(container);
  });

  describe('edit menu actions', () => {
    beforeEach(() => {
      app.mount(container);
    });

    it('should invoke editor undo and refocus when Undo menu item is clicked', () => {
      const editTrigger = container.querySelector('[data-menu="edit"]') as HTMLButtonElement;
      editTrigger.click();

      const undoItem = container.querySelector('[data-action="undo"]') as HTMLButtonElement;
      undoItem.click();

      expect(mockModel.undo).toHaveBeenCalledTimes(1);
      expect(mockEditorInstance.focus).toHaveBeenCalled();
    });

    it('should invoke editor redo and refocus when Redo menu item is clicked', () => {
      const editTrigger = container.querySelector('[data-menu="edit"]') as HTMLButtonElement;
      editTrigger.click();

      const redoItem = container.querySelector('[data-action="redo"]') as HTMLButtonElement;
      redoItem.click();

      expect(mockModel.redo).toHaveBeenCalledTimes(1);
      expect(mockEditorInstance.focus).toHaveBeenCalled();
    });
  });

  describe('mount', () => {
    it('should mount the application to a container', () => {
      app.mount(container);
      expect(container.innerHTML).not.toBe('');
    });

    it('should create the app layout structure', () => {
      app.mount(container);
      const layout = container.querySelector('.da-app-layout');
      expect(layout).not.toBeNull();
    });

    it('should set isMountedTo() to true after mount', () => {
      expect(app.isMountedTo()).toBe(false);
      app.mount(container);
      expect(app.isMountedTo()).toBe(true);
    });

    it('should be safe to call mount multiple times (re-renders)', () => {
      app.mount(container);
      const firstLayout = container.querySelector('.da-app-layout');
      expect(firstLayout).not.toBeNull();

      // Mount again - should re-render without error
      app.mount(container);
      const secondLayout = container.querySelector('.da-app-layout');
      expect(secondLayout).not.toBeNull();
      expect(app.isMountedTo()).toBe(true);
    });

    it('should allow mounting to a different container', () => {
      const container2 = document.createElement('div');
      document.body.appendChild(container2);

      app.mount(container);
      expect(container.innerHTML).not.toBe('');

      app.mount(container2);
      expect(container2.innerHTML).not.toBe('');

      document.body.removeChild(container2);
    });
  });

  describe('layout structure', () => {
    beforeEach(() => {
      app.mount(container);
    });

    it('should create a toolbar', () => {
      const toolbar = container.querySelector('.da-toolbar');
      expect(toolbar).not.toBeNull();
    });

    it('should mount Toolbar component inside toolbar container', () => {
      const toolbarContent = container.querySelector('.da-toolbar .da-toolbar-content');
      expect(toolbarContent).not.toBeNull();
    });

    it('should have toolbar with role="toolbar"', () => {
      const toolbarContent = container.querySelector('.da-toolbar-content');
      expect(toolbarContent?.getAttribute('role')).toBe('toolbar');
    });

    it('should create three panels', () => {
      const codePanel = container.querySelector('.da-code-panel');
      const circuitPanel = container.querySelector('.da-circuit-panel');
      const statePanel = container.querySelector('.da-state-panel');

      expect(codePanel).not.toBeNull();
      expect(circuitPanel).not.toBeNull();
      expect(statePanel).not.toBeNull();
    });

    it('should create a status bar', () => {
      const statusbar = container.querySelector('.da-statusbar');
      expect(statusbar).not.toBeNull();
    });

    it('should have panel headers with correct titles', () => {
      const codePanelTitle = container.querySelector('.da-code-panel .da-panel-title');
      const circuitPanelTitle = container.querySelector('.da-circuit-panel .da-panel-title');
      const statePanelTitle = container.querySelector('.da-state-panel .da-panel-title');

      expect(codePanelTitle?.textContent).toBe('CODE');
      expect(circuitPanelTitle?.textContent).toBe('CIRCUIT');
      expect(statePanelTitle?.textContent).toBe('STATE');
    });

    it('should have status bar showing Ready in assembly section', () => {
      const assemblySection = container.querySelector('[data-section="assembly"]');
      expect(assemblySection?.textContent).toContain('Ready');
    });

    it('should create panel content areas', () => {
      const codePanelContent = container.querySelector('.da-code-panel .da-panel-content');
      const circuitPanelContent = container.querySelector('.da-circuit-panel .da-panel-content');
      const statePanelContent = container.querySelector('.da-state-panel .da-panel-content');

      expect(codePanelContent).not.toBeNull();
      expect(circuitPanelContent).not.toBeNull();
      expect(statePanelContent).not.toBeNull();
    });
  });

  describe('accessibility', () => {
    beforeEach(() => {
      app.mount(container);
    });

    it('should have aria-label on code panel', () => {
      const codePanel = container.querySelector('.da-code-panel');
      expect(codePanel?.getAttribute('aria-label')).toBe('Code Editor Panel');
    });

    it('should have aria-label on circuit panel', () => {
      const circuitPanel = container.querySelector('.da-circuit-panel');
      expect(circuitPanel?.getAttribute('aria-label')).toBe('Circuit Visualizer Panel');
    });

    it('should have aria-label on state panel', () => {
      const statePanel = container.querySelector('.da-state-panel');
      expect(statePanel?.getAttribute('aria-label')).toBe('CPU State Panel');
    });

    it('should have role="status" on statusbar for screen readers', () => {
      const statusbar = container.querySelector('.da-statusbar');
      expect(statusbar?.getAttribute('role')).toBe('status');
    });

    it('should have aria-live="polite" on statusbar for announcements', () => {
      const statusbar = container.querySelector('.da-statusbar');
      expect(statusbar?.getAttribute('aria-live')).toBe('polite');
    });

    it('should use semantic HTML elements', () => {
      const header = container.querySelector('header.da-toolbar');
      const main = container.querySelector('main.da-circuit-panel');
      const footer = container.querySelector('footer.da-statusbar');
      const asides = container.querySelectorAll('aside.da-panel');

      expect(header).not.toBeNull();
      expect(main).not.toBeNull();
      expect(footer).not.toBeNull();
      expect(asides.length).toBe(2); // code and state panels
    });
  });

  describe('destroy', () => {
    it('should clear the container when destroyed', () => {
      app.mount(container);
      expect(container.innerHTML).not.toBe('');

      app.destroy();
      expect(container.innerHTML).toBe('');
    });

    it('should set isMountedTo() to false after destroy', () => {
      app.mount(container);
      expect(app.isMountedTo()).toBe(true);

      app.destroy();
      expect(app.isMountedTo()).toBe(false);
    });

    it('should be safe to call destroy multiple times', () => {
      app.mount(container);
      app.destroy();
      app.destroy(); // Should not throw
      expect(container.innerHTML).toBe('');
      expect(app.isMountedTo()).toBe(false);
    });

    it('should be safe to call destroy before mount', () => {
      // App created in beforeEach but not mounted
      expect(app.isMountedTo()).toBe(false);
      app.destroy(); // Should not throw
      expect(app.isMountedTo()).toBe(false);
    });

    it('should allow remounting after destroy', () => {
      app.mount(container);
      app.destroy();
      expect(container.innerHTML).toBe('');

      app.mount(container);
      expect(container.innerHTML).not.toBe('');
      expect(app.isMountedTo()).toBe(true);
    });

    it('should clean up CSS custom properties on destroy', () => {
      app.mount(container);
      expect(document.documentElement.style.getPropertyValue('--da-code-panel-width')).not.toBe('');

      app.destroy();
      expect(document.documentElement.style.getPropertyValue('--da-code-panel-width')).toBe('');
      expect(document.documentElement.style.getPropertyValue('--da-state-panel-width')).toBe('');
    });
  });

  describe('resizable panels', () => {
    beforeEach(() => {
      app.mount(container);
    });

    it('should create resize handles for code and state panels', () => {
      const codeResizer = container.querySelector('.da-code-panel .da-resizer');
      const stateResizer = container.querySelector('.da-state-panel .da-resizer');

      expect(codeResizer).not.toBeNull();
      expect(stateResizer).not.toBeNull();
    });

    it('should position code resizer on right edge', () => {
      const codeResizer = container.querySelector('.da-code-panel .da-resizer--right');
      expect(codeResizer).not.toBeNull();
    });

    it('should position state resizer on left edge', () => {
      const stateResizer = container.querySelector('.da-state-panel .da-resizer--left');
      expect(stateResizer).not.toBeNull();
    });

    it('should initialize panel widths to defaults', () => {
      expect(app.getCodePanelWidth()).toBe(PANEL_CONSTRAINTS.CODE_DEFAULT);
      expect(app.getStatePanelWidth()).toBe(PANEL_CONSTRAINTS.STATE_DEFAULT);
    });

    it('should set CSS custom properties on mount', () => {
      const codeWidth = document.documentElement.style.getPropertyValue('--da-code-panel-width');
      const stateWidth = document.documentElement.style.getPropertyValue('--da-state-panel-width');

      expect(codeWidth).toBe(`${PANEL_CONSTRAINTS.CODE_DEFAULT}px`);
      expect(stateWidth).toBe(`${PANEL_CONSTRAINTS.STATE_DEFAULT}px`);
    });

    it('should have resizers with accessibility attributes', () => {
      const codeResizer = container.querySelector('.da-code-panel .da-resizer');
      const stateResizer = container.querySelector('.da-state-panel .da-resizer');

      expect(codeResizer?.getAttribute('role')).toBe('separator');
      expect(codeResizer?.getAttribute('aria-orientation')).toBe('vertical');
      expect(stateResizer?.getAttribute('role')).toBe('separator');
      expect(stateResizer?.getAttribute('aria-orientation')).toBe('vertical');
    });

    it('should clean up old resizers on re-mount', () => {
      // Start a drag on code resizer
      const codeResizer = container.querySelector('.da-code-panel .da-resizer') as HTMLElement;
      const mouseDown = new MouseEvent('mousedown', {
        clientX: 350,
        bubbles: true,
      });
      codeResizer.dispatchEvent(mouseDown);

      expect(document.body.classList.contains('da-resizing')).toBe(true);

      // Re-mount should clean up the active drag
      app.mount(container);

      expect(document.body.classList.contains('da-resizing')).toBe(false);
    });

    it('should not leak resizers on multiple mounts', () => {
      // Mount multiple times
      app.mount(container);
      app.mount(container);
      app.mount(container);

      // Should only have one resizer per panel
      const codeResizers = container.querySelectorAll('.da-code-panel .da-resizer');
      const stateResizers = container.querySelectorAll('.da-state-panel .da-resizer');

      expect(codeResizers.length).toBe(1);
      expect(stateResizers.length).toBe(1);
    });
  });

  describe('toolbar integration', () => {
    beforeEach(() => {
      app.mount(container);
    });

    it('should provide access to toolbar via getToolbar()', () => {
      const toolbar = app.getToolbar();
      expect(toolbar).not.toBeNull();
    });

    it('should return null for getToolbar() before mount', () => {
      const newApp = new App();
      expect(newApp.getToolbar()).toBeNull();
      newApp.destroy();
    });

    it('should clean up toolbar on destroy', () => {
      expect(app.getToolbar()).not.toBeNull();
      app.destroy();
      expect(app.getToolbar()).toBeNull();
    });

    it('should not leak toolbar components on multiple mounts', () => {
      app.mount(container);
      app.mount(container);
      app.mount(container);

      const toolbarContents = container.querySelectorAll('.da-toolbar-content');
      expect(toolbarContents.length).toBe(1);
    });
  });

  describe('menubar integration', () => {
    beforeEach(() => {
      app.mount(container);
    });

    it('should provide access to menubar via getMenuBar()', () => {
      const menuBar = app.getMenuBar();
      expect(menuBar).not.toBeNull();
    });

    it('should return null for getMenuBar() before mount', () => {
      const newApp = new App();
      expect(newApp.getMenuBar()).toBeNull();
      newApp.destroy();
    });

    it('should clean up menubar on destroy', () => {
      expect(app.getMenuBar()).not.toBeNull();
      app.destroy();
      expect(app.getMenuBar()).toBeNull();
    });

    it('should create menubar wrapper element', () => {
      const menuBarWrapper = container.querySelector('.da-menubar-wrapper');
      expect(menuBarWrapper).not.toBeNull();
    });

    it('should render menubar inside toolbar', () => {
      const menuBar = container.querySelector('.da-toolbar .da-menubar');
      expect(menuBar).not.toBeNull();
    });

    it('should not leak menubar components on multiple mounts', () => {
      app.mount(container);
      app.mount(container);
      app.mount(container);

      const menuBars = container.querySelectorAll('.da-menubar');
      expect(menuBars.length).toBe(1);
    });

    it('should render Story/Lab toggle buttons', () => {
      const storyBtn = container.querySelector('[data-mode="story"]');
      const labBtn = container.querySelector('[data-mode="lab"]');

      expect(storyBtn).not.toBeNull();
      expect(labBtn).not.toBeNull();
    });

    it('should render all menu triggers', () => {
      const fileMenu = container.querySelector('[data-menu="file"]');
      const editMenu = container.querySelector('[data-menu="edit"]');
      const viewMenu = container.querySelector('[data-menu="view"]');
      const debugMenu = container.querySelector('[data-menu="debug"]');
      const helpMenu = container.querySelector('[data-menu="help"]');

      expect(fileMenu).not.toBeNull();
      expect(editMenu).not.toBeNull();
      expect(viewMenu).not.toBeNull();
      expect(debugMenu).not.toBeNull();
      expect(helpMenu).not.toBeNull();
    });
  });

  describe('statusbar integration', () => {
    beforeEach(() => {
      app.mount(container);
    });

    it('should provide access to statusbar via getStatusBar()', () => {
      const statusBar = app.getStatusBar();
      expect(statusBar).not.toBeNull();
    });

    it('should return null for getStatusBar() before mount', () => {
      const newApp = new App();
      expect(newApp.getStatusBar()).toBeNull();
      newApp.destroy();
    });

    it('should clean up statusbar on destroy', () => {
      expect(app.getStatusBar()).not.toBeNull();
      app.destroy();
      expect(app.getStatusBar()).toBeNull();
    });

    it('should render statusbar content inside footer', () => {
      const statusBarContent = container.querySelector('.da-statusbar .da-statusbar-content');
      expect(statusBarContent).not.toBeNull();
    });

    it('should render all status bar sections', () => {
      const assemblySection = container.querySelector('[data-section="assembly"]');
      const pcSection = container.querySelector('[data-section="pc"]');
      const instructionSection = container.querySelector('[data-section="instruction"]');
      const cycleSection = container.querySelector('[data-section="cycle"]');
      const speedSection = container.querySelector('[data-section="speed"]');

      expect(assemblySection).not.toBeNull();
      expect(pcSection).not.toBeNull();
      expect(instructionSection).not.toBeNull();
      expect(cycleSection).not.toBeNull();
      expect(speedSection).not.toBeNull();
    });

    it('should not leak statusbar components on multiple mounts', () => {
      app.mount(container);
      app.mount(container);
      app.mount(container);

      const statusBarContents = container.querySelectorAll('.da-statusbar-content');
      expect(statusBarContents.length).toBe(1);
    });

    it('should show Ready as initial assembly status', () => {
      const assemblySection = container.querySelector('[data-section="assembly"]');
      expect(assemblySection?.textContent).toContain('Ready');
    });
  });

  describe('window resize handling', () => {
    beforeEach(() => {
      vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1200);
      app.mount(container);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should add window resize listener on mount', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const newApp = new App();
      newApp.mount(container);

      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));

      newApp.destroy();
    });

    it('should remove window resize listener on destroy', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      app.destroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });
  });

  describe('panel header integration', () => {
    beforeEach(() => {
      app.mount(container);
    });

    it('should render panel headers with close buttons', () => {
      const closeButtons = container.querySelectorAll('.da-panel-close-btn');
      expect(closeButtons.length).toBe(3); // code, circuit, state
    });

    it('should render code panel header with correct title', () => {
      const codePanel = container.querySelector('.da-code-panel');
      const title = codePanel?.querySelector('.da-panel-title');
      expect(title?.textContent).toBe('CODE');
    });

    it('should render circuit panel header with correct title', () => {
      const circuitPanel = container.querySelector('.da-circuit-panel');
      const title = circuitPanel?.querySelector('.da-panel-title');
      expect(title?.textContent).toBe('CIRCUIT');
    });

    it('should render state panel header with correct title', () => {
      const statePanel = container.querySelector('.da-state-panel');
      const title = statePanel?.querySelector('.da-panel-title');
      expect(title?.textContent).toBe('STATE');
    });

    it('should not leak panel headers on multiple mounts', () => {
      app.mount(container);
      app.mount(container);
      app.mount(container);

      const closeButtons = container.querySelectorAll('.da-panel-close-btn');
      expect(closeButtons.length).toBe(3);
    });
  });

  describe('panel visibility', () => {
    beforeEach(() => {
      app.mount(container);
    });

    it('should have all panels visible by default', () => {
      const visibility = app.getPanelVisibility();
      expect(visibility.code).toBe(true);
      expect(visibility.circuit).toBe(true);
      expect(visibility.state).toBe(true);
    });

    it('should hide code panel when close button clicked', () => {
      const codePanel = container.querySelector('.da-code-panel');
      const closeBtn = codePanel?.querySelector('.da-panel-close-btn') as HTMLButtonElement;

      closeBtn.click();

      const visibility = app.getPanelVisibility();
      expect(visibility.code).toBe(false);
      expect(codePanel?.classList.contains('da-panel--hidden')).toBe(true);
    });

    it('should hide circuit panel when close button clicked', () => {
      const circuitPanel = container.querySelector('.da-circuit-panel');
      const closeBtn = circuitPanel?.querySelector('.da-panel-close-btn') as HTMLButtonElement;

      closeBtn.click();

      const visibility = app.getPanelVisibility();
      expect(visibility.circuit).toBe(false);
      expect(circuitPanel?.classList.contains('da-panel--hidden')).toBe(true);
    });

    it('should hide state panel when close button clicked', () => {
      const statePanel = container.querySelector('.da-state-panel');
      const closeBtn = statePanel?.querySelector('.da-panel-close-btn') as HTMLButtonElement;

      closeBtn.click();

      const visibility = app.getPanelVisibility();
      expect(visibility.state).toBe(false);
      expect(statePanel?.classList.contains('da-panel--hidden')).toBe(true);
    });

    it('should add layout class when code panel hidden', () => {
      app.setPanelVisibility('code', false);

      const layout = container.querySelector('.da-app-layout');
      expect(layout?.classList.contains('da-app-layout--code-hidden')).toBe(true);
    });

    it('should add layout class when state panel hidden', () => {
      app.setPanelVisibility('state', false);

      const layout = container.querySelector('.da-app-layout');
      expect(layout?.classList.contains('da-app-layout--state-hidden')).toBe(true);
    });

    it('should toggle panel visibility', () => {
      app.togglePanel('code');
      expect(app.getPanelVisibility().code).toBe(false);

      app.togglePanel('code');
      expect(app.getPanelVisibility().code).toBe(true);
    });

    it('should restore panel when setPanelVisibility called with true', () => {
      app.setPanelVisibility('code', false);
      expect(app.getPanelVisibility().code).toBe(false);

      app.setPanelVisibility('code', true);
      expect(app.getPanelVisibility().code).toBe(true);

      const codePanel = container.querySelector('.da-code-panel');
      expect(codePanel?.classList.contains('da-panel--hidden')).toBe(false);
    });

    it('should reset layout to show all panels and default widths', () => {
      app.setPanelVisibility('code', false);
      app.setPanelVisibility('state', false);

      app.resetLayout();

      const visibility = app.getPanelVisibility();
      expect(visibility.code).toBe(true);
      expect(visibility.circuit).toBe(true);
      expect(visibility.state).toBe(true);
    });

    it('should hide multiple panels independently', () => {
      app.setPanelVisibility('code', false);
      app.setPanelVisibility('state', false);

      const visibility = app.getPanelVisibility();
      expect(visibility.code).toBe(false);
      expect(visibility.circuit).toBe(true);
      expect(visibility.state).toBe(false);

      const layout = container.querySelector('.da-app-layout');
      expect(layout?.classList.contains('da-app-layout--code-hidden')).toBe(true);
      expect(layout?.classList.contains('da-app-layout--state-hidden')).toBe(true);
    });

    it('should reset visibility state on destroy', () => {
      app.setPanelVisibility('code', false);
      app.destroy();

      // Re-mount and check visibility is reset
      app.mount(container);
      const visibility = app.getPanelVisibility();
      expect(visibility.code).toBe(true);
    });

    it('should add layout class when circuit panel hidden', () => {
      app.setPanelVisibility('circuit', false);

      const layout = container.querySelector('.da-app-layout');
      expect(layout?.classList.contains('da-app-layout--circuit-hidden')).toBe(true);
    });

    it('should sync panel states to MenuBar when visibility changes', () => {
      const menuBar = app.getMenuBar();
      expect(menuBar).not.toBeNull();

      app.setPanelVisibility('code', false);

      const menuBarState = menuBar?.getState();
      expect(menuBarState?.panelStates.code).toBe(false);
      expect(menuBarState?.panelStates.circuit).toBe(true);
      expect(menuBarState?.panelStates.state).toBe(true);
    });

    it('should sync panel states to MenuBar on resetLayout', () => {
      const menuBar = app.getMenuBar();

      app.setPanelVisibility('code', false);
      app.setPanelVisibility('state', false);
      app.resetLayout();

      const menuBarState = menuBar?.getState();
      expect(menuBarState?.panelStates.code).toBe(true);
      expect(menuBarState?.panelStates.circuit).toBe(true);
      expect(menuBarState?.panelStates.state).toBe(true);
    });
  });

  describe('View menu integration', () => {
    beforeEach(() => {
      app.mount(container);
    });

    it('should toggle code panel when View menu Code Panel clicked', () => {
      // Open View menu
      const viewTrigger = container.querySelector('[data-menu="view"]') as HTMLButtonElement;
      viewTrigger.click();

      // Click Code Panel item
      const codePanelItem = container.querySelector('[data-action="codePanel"]') as HTMLButtonElement;
      codePanelItem.click();

      // Code panel should now be hidden
      expect(app.getPanelVisibility().code).toBe(false);
    });

    it('should toggle circuit panel when View menu Circuit Panel clicked', () => {
      const viewTrigger = container.querySelector('[data-menu="view"]') as HTMLButtonElement;
      viewTrigger.click();

      const circuitPanelItem = container.querySelector('[data-action="circuitPanel"]') as HTMLButtonElement;
      circuitPanelItem.click();

      expect(app.getPanelVisibility().circuit).toBe(false);
    });

    it('should toggle state panel when View menu State Panel clicked', () => {
      const viewTrigger = container.querySelector('[data-menu="view"]') as HTMLButtonElement;
      viewTrigger.click();

      const statePanelItem = container.querySelector('[data-action="statePanel"]') as HTMLButtonElement;
      statePanelItem.click();

      expect(app.getPanelVisibility().state).toBe(false);
    });

    it('should reset layout when View menu Reset Layout clicked', () => {
      // First hide some panels
      app.setPanelVisibility('code', false);
      app.setPanelVisibility('state', false);

      // Open View menu and click Reset Layout
      const viewTrigger = container.querySelector('[data-menu="view"]') as HTMLButtonElement;
      viewTrigger.click();

      const resetLayoutItem = container.querySelector('[data-action="resetLayout"]') as HTMLButtonElement;
      resetLayoutItem.click();

      // All panels should be visible
      const visibility = app.getPanelVisibility();
      expect(visibility.code).toBe(true);
      expect(visibility.circuit).toBe(true);
      expect(visibility.state).toBe(true);
    });

    it('should show checkmark in View menu for visible panels', () => {
      const viewTrigger = container.querySelector('[data-menu="view"]') as HTMLButtonElement;
      viewTrigger.click();

      const codePanelItem = container.querySelector('[data-action="codePanel"]') as HTMLButtonElement;
      expect(codePanelItem.textContent).toContain('✓');
      expect(codePanelItem.getAttribute('aria-checked')).toBe('true');
    });

    it('should not show checkmark in View menu for hidden panels', () => {
      app.setPanelVisibility('code', false);

      const viewTrigger = container.querySelector('[data-menu="view"]') as HTMLButtonElement;
      viewTrigger.click();

      const codePanelItem = container.querySelector('[data-action="codePanel"]') as HTMLButtonElement;
      expect(codePanelItem.textContent).not.toContain('✓');
      expect(codePanelItem.getAttribute('aria-checked')).toBe('false');
    });
  });

  describe('editor integration', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      app.mount(container);
    });

    it('should initialize Editor in code panel', () => {
      const editor = app.getEditor();
      expect(editor).not.toBeNull();
    });

    it('should return null for getEditor() before mount', () => {
      const newApp = new App();
      expect(newApp.getEditor()).toBeNull();
      newApp.destroy();
    });

    it('should mount Editor instance', () => {
      const editor = app.getEditor();
      expect(editor?.isMounted()).toBe(true);
    });

    it('should clean up editor on destroy', () => {
      expect(app.getEditor()).not.toBeNull();
      expect(mockEditorInstance.dispose).not.toHaveBeenCalled();

      app.destroy();

      expect(app.getEditor()).toBeNull();
      expect(mockEditorInstance.dispose).toHaveBeenCalled();
    });

    it('should not leak editor on multiple mounts', () => {
      // Clear dispose mock before testing
      mockEditorInstance.dispose.mockClear();

      app.mount(container);
      expect(mockEditorInstance.dispose).toHaveBeenCalledTimes(1);

      app.mount(container);
      expect(mockEditorInstance.dispose).toHaveBeenCalledTimes(2);

      // Only one editor should exist
      const editor = app.getEditor();
      expect(editor).not.toBeNull();
    });

    it('should refresh editor layout when code panel becomes visible', async () => {
      // Hide code panel
      app.setPanelVisibility('code', false);
      mockEditorInstance.layout.mockClear();

      // Show code panel
      app.setPanelVisibility('code', true);

      // Wait for requestAnimationFrame
      await new Promise(resolve => requestAnimationFrame(resolve));

      expect(mockEditorInstance.layout).toHaveBeenCalled();
    });

    it('should refresh editor layout on resetLayout', async () => {
      app.setPanelVisibility('code', false);
      mockEditorInstance.layout.mockClear();

      app.resetLayout();

      // Wait for requestAnimationFrame
      await new Promise(resolve => requestAnimationFrame(resolve));

      expect(mockEditorInstance.layout).toHaveBeenCalled();
    });

    it('should not refresh layout when non-code panel visibility changes', async () => {
      mockEditorInstance.layout.mockClear();

      app.setPanelVisibility('state', false);
      app.setPanelVisibility('state', true);

      await new Promise(resolve => requestAnimationFrame(resolve));

      // layout should not be called for state panel visibility changes
      expect(mockEditorInstance.layout).not.toHaveBeenCalled();
    });

    it('should persist editor across panel visibility toggle', () => {
      const editorBefore = app.getEditor();

      // Hide and show code panel
      app.setPanelVisibility('code', false);
      app.setPanelVisibility('code', true);

      const editorAfter = app.getEditor();

      // Same editor instance should persist
      expect(editorAfter).toBe(editorBefore);
    });

    it('should always initialize editor when mounted to valid container', () => {
      // App.render() creates its own complete DOM structure,
      // so editor should always be initialized after mount
      const newContainer = document.createElement('div');
      document.body.appendChild(newContainer);

      const newApp = new App();
      newApp.mount(newContainer);

      // Editor should always be initialized since App creates its own structure
      expect(newApp.getEditor()).not.toBeNull();
      expect(newApp.getEditor()?.isMounted()).toBe(true);

      newApp.destroy();
      document.body.removeChild(newContainer);
    });
  });

  describe('cursor position to status bar wiring (Story 2.5)', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      cursorPositionListeners.length = 0; // Clear listeners array
      app.mount(container);
    });

    it('should subscribe to editor cursor position changes', () => {
      expect(mockEditorInstance.onDidChangeCursorPosition).toHaveBeenCalled();
    });

    it('should update status bar when cursor position changes', () => {
      // Simulate cursor position change
      if (cursorPositionListeners.length > 0) {
        cursorPositionListeners[0]({ position: { lineNumber: 5, column: 10 } });
      }

      const cursorSection = container.querySelector('[data-section="cursor"]');
      expect(cursorSection?.textContent).toContain('Ln 5');
      expect(cursorSection?.textContent).toContain('Col 10');
    });

    it('should display cursor position in "Ln X, Col Y" format', () => {
      if (cursorPositionListeners.length > 0) {
        cursorPositionListeners[0]({ position: { lineNumber: 1, column: 1 } });
      }

      const cursorSection = container.querySelector('[data-section="cursor"]');
      expect(cursorSection?.textContent).toBe('Ln 1, Col 1');
    });

    it('should update status bar with each cursor movement', () => {
      const cursorSection = container.querySelector('[data-section="cursor"]');

      // First movement
      if (cursorPositionListeners.length > 0) {
        cursorPositionListeners[0]({ position: { lineNumber: 1, column: 1 } });
      }
      expect(cursorSection?.textContent).toBe('Ln 1, Col 1');

      // Second movement
      if (cursorPositionListeners.length > 0) {
        cursorPositionListeners[0]({ position: { lineNumber: 10, column: 25 } });
      }
      expect(cursorSection?.textContent).toBe('Ln 10, Col 25');
    });

    it('should show placeholder when cursor position is null initially', () => {
      // Create a fresh app to test initial state before any cursor events
      const testContainer = document.createElement('div');
      document.body.appendChild(testContainer);
      const testApp = new App();

      // Clear listeners before mounting
      cursorPositionListeners.length = 0;
      testApp.mount(testContainer);

      // StatusBar should show placeholder before any cursor events
      const statusBar = testApp.getStatusBar();
      const state = statusBar?.getState();
      expect(state?.cursorPosition).toBeNull();

      testApp.destroy();
      document.body.removeChild(testContainer);
    });

    it('should clean up cursor listener when app is destroyed', () => {
      expect(mockCursorDisposable.dispose).not.toHaveBeenCalled();

      app.destroy();

      expect(mockCursorDisposable.dispose).toHaveBeenCalled();
    });
  });

  describe('keyboard shortcuts dialog (Story 2.6)', () => {
    beforeEach(() => {
      app.mount(container);
    });

    afterEach(() => {
      // Clean up any dialogs that might be left in the DOM
      document.querySelectorAll('.da-shortcuts-backdrop').forEach((el) => el.remove());
    });

    it('should show keyboard shortcuts dialog when Help > Keyboard Shortcuts is clicked', () => {
      // Open Help menu
      const helpTrigger = container.querySelector('[data-menu="help"]') as HTMLButtonElement;
      helpTrigger.click();

      // Click Keyboard Shortcuts item
      const shortcutsItem = container.querySelector('[data-action="shortcuts"]') as HTMLButtonElement;
      shortcutsItem.click();

      // Dialog should be visible
      const dialog = document.querySelector('.da-shortcuts-dialog');
      expect(dialog).not.toBeNull();
    });

    it('should display dialog title', () => {
      // Open Help menu and click Keyboard Shortcuts
      const helpTrigger = container.querySelector('[data-menu="help"]') as HTMLButtonElement;
      helpTrigger.click();
      const shortcutsItem = container.querySelector('[data-action="shortcuts"]') as HTMLButtonElement;
      shortcutsItem.click();

      const title = document.querySelector('#da-shortcuts-title');
      expect(title?.textContent).toBe('Keyboard Shortcuts');
    });

    it('should close dialog when Escape key is pressed', () => {
      // Open dialog
      const helpTrigger = container.querySelector('[data-menu="help"]') as HTMLButtonElement;
      helpTrigger.click();
      const shortcutsItem = container.querySelector('[data-action="shortcuts"]') as HTMLButtonElement;
      shortcutsItem.click();

      // Press Escape
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);

      // Dialog should be gone
      const dialog = document.querySelector('.da-shortcuts-dialog');
      expect(dialog).toBeNull();
    });

    it('should close dialog when close button is clicked', () => {
      // Open dialog
      const helpTrigger = container.querySelector('[data-menu="help"]') as HTMLButtonElement;
      helpTrigger.click();
      const shortcutsItem = container.querySelector('[data-action="shortcuts"]') as HTMLButtonElement;
      shortcutsItem.click();

      // Click close button
      const closeBtn = document.querySelector('.da-shortcuts-close') as HTMLButtonElement;
      closeBtn.click();

      // Dialog should be gone
      const dialog = document.querySelector('.da-shortcuts-dialog');
      expect(dialog).toBeNull();
    });

    it('should return KeyboardShortcutsDialog instance after showing', () => {
      // Open dialog
      const helpTrigger = container.querySelector('[data-menu="help"]') as HTMLButtonElement;
      helpTrigger.click();
      const shortcutsItem = container.querySelector('[data-action="shortcuts"]') as HTMLButtonElement;
      shortcutsItem.click();

      const dialog = app.getKeyboardShortcutsDialog();
      expect(dialog).not.toBeNull();
      expect(dialog?.isVisible()).toBe(true);
    });

    it('should clean up dialog when app is destroyed', () => {
      // Open dialog
      const helpTrigger = container.querySelector('[data-menu="help"]') as HTMLButtonElement;
      helpTrigger.click();
      const shortcutsItem = container.querySelector('[data-action="shortcuts"]') as HTMLButtonElement;
      shortcutsItem.click();

      // Destroy app
      app.destroy();

      // Dialog should be removed
      const dialog = document.querySelector('.da-shortcuts-dialog');
      expect(dialog).toBeNull();
    });
  });

  describe('assembly integration (Story 3.3)', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      mockAssemblerBridge._reset();
      mockEditorInstance._resetContent();
      contentChangeListeners.length = 0;
      addedActions.length = 0;
      app.mount(container);
    });

    describe('AssemblerBridge initialization', () => {
      it('should initialize AssemblerBridge when app mounts', () => {
        expect(mockAssemblerBridge.init).toHaveBeenCalledTimes(1);
      });

      it('should terminate AssemblerBridge when app is destroyed', () => {
        app.destroy();
        expect(mockAssemblerBridge.terminate).toHaveBeenCalledTimes(1);
      });
    });

    describe('Assemble button click', () => {
      it('should trigger assembly when Assemble button is clicked', async () => {
        // Set editor content and trigger content change to enable button
        mockEditorInstance._setContent('LDA 5\nHLT');
        mockEditorInstance.getValue.mockReturnValue('LDA 5\nHLT');

        // Trigger content change listener to enable the Assemble button
        if (contentChangeListeners.length > 0) {
          contentChangeListeners[0]();
        }

        // Click Assemble button
        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        expect(assembleBtn.disabled).toBe(false);
        assembleBtn.click();

        // Wait for async operations
        await vi.waitFor(() => {
          expect(mockAssemblerBridge.assemble).toHaveBeenCalledWith('LDA 5\nHLT');
        });
      });

      it('should show assembling status during operation', async () => {
        mockEditorInstance._setContent('LDA 5');
        mockEditorInstance.getValue.mockReturnValue('LDA 5');

        // Make assemble take some time
        mockAssemblerBridge.assemble.mockImplementation(() => new Promise(resolve => {
          setTimeout(() => resolve({
            success: true,
            binary: new Uint8Array([0x01, 0x05]),
            error: null,
          }), 10);
        }));

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        // Check immediate status
        const assemblySection = container.querySelector('[data-section="assembly"]');
        expect(assemblySection?.textContent).toContain('Assembling');
      });

      it('should show success message with byte count after successful assembly', async () => {
        mockEditorInstance._setContent('LDA 5');
        mockEditorInstance.getValue.mockReturnValue('LDA 5');
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: new Uint8Array([0x01, 0x05]),
          error: null,
        });

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          const assemblySection = container.querySelector('[data-section="assembly"]');
          expect(assemblySection?.textContent).toContain('2 bytes');
        });
      });

      it('should show error message on assembly failure', async () => {
        mockEditorInstance._setContent('INVALID');
        mockEditorInstance.getValue.mockReturnValue('INVALID');
        mockAssemblerBridge._setAssembleResult({
          success: false,
          binary: null,
          error: { line: 1, message: 'Unknown instruction' },
        });

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          const assemblySection = container.querySelector('[data-section="assembly"]');
          expect(assemblySection?.textContent).toContain('Unknown instruction');
        });
      });
    });

    describe('Debug menu Assemble action', () => {
      it('should trigger assembly when Debug > Assemble is clicked', async () => {
        mockEditorInstance._setContent('LDA 5');
        mockEditorInstance.getValue.mockReturnValue('LDA 5');

        // Open Debug menu
        const debugTrigger = container.querySelector('[data-menu="debug"]') as HTMLButtonElement;
        debugTrigger.click();

        // Click Assemble item (note: data-action is "assemble", not "debug-assemble")
        const assembleItem = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleItem.click();

        await vi.waitFor(() => {
          expect(mockAssemblerBridge.assemble).toHaveBeenCalledWith('LDA 5');
        });
      });
    });

    describe('Ctrl+Enter keyboard shortcut', () => {
      it('should register assemble action with editor', () => {
        expect(addedActions.length).toBeGreaterThan(0);
        const assembleAction = addedActions.find(a => a.id === 'assemble');
        expect(assembleAction).toBeDefined();
      });

      it('should trigger assembly when Ctrl+Enter action is invoked', async () => {
        mockEditorInstance._setContent('LDA 5');
        mockEditorInstance.getValue.mockReturnValue('LDA 5');

        // Find and invoke the assemble action
        const assembleAction = addedActions.find(a => a.id === 'assemble');
        assembleAction?.run();

        await vi.waitFor(() => {
          expect(mockAssemblerBridge.assemble).toHaveBeenCalledWith('LDA 5');
        });
      });
    });

    describe('Assemble button enabled state', () => {
      it('should have content change listener registered', () => {
        expect(contentChangeListeners.length).toBeGreaterThan(0);
      });

      it('should disable Assemble button when editor is empty', () => {
        // Trigger content change with empty content
        mockEditorInstance.getValue.mockReturnValue('');
        contentChangeListeners[0]?.();

        // Check toolbar state
        const toolbar = app.getToolbar();
        expect(toolbar?.getState().canAssemble).toBe(false);
      });

      it('should enable Assemble button when editor has content', () => {
        // Trigger content change with content
        mockEditorInstance.getValue.mockReturnValue('LDA 5');
        contentChangeListeners[0]?.();

        // Check toolbar state
        const toolbar = app.getToolbar();
        expect(toolbar?.getState().canAssemble).toBe(true);
      });
    });

    describe('execution buttons state after assembly', () => {
      it('should enable Run, Step, Reset buttons after successful assembly', async () => {
        mockEditorInstance._setContent('LDA 5');
        mockEditorInstance.getValue.mockReturnValue('LDA 5');
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: new Uint8Array([0x01, 0x05]),
          error: null,
        });

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          const toolbar = app.getToolbar();
          expect(toolbar?.getState().canRun).toBe(true);
          expect(toolbar?.getState().canStep).toBe(true);
          expect(toolbar?.getState().canReset).toBe(true);
        });
      });

      it('should not enable execution buttons after failed assembly', async () => {
        mockEditorInstance._setContent('INVALID');
        mockEditorInstance.getValue.mockReturnValue('INVALID');
        mockAssemblerBridge._setAssembleResult({
          success: false,
          binary: null,
          error: { line: 1, message: 'Error' },
        });

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          const toolbar = app.getToolbar();
          expect(toolbar?.getState().canRun).toBe(false);
          expect(toolbar?.getState().canStep).toBe(false);
          expect(toolbar?.getState().canReset).toBe(false);
        });
      });
    });

    describe('getLastAssembleResult', () => {
      it('should return null before any assembly', () => {
        expect(app.getLastAssembleResult()).toBeNull();
      });

      it('should return assembly result after successful assembly', async () => {
        mockEditorInstance._setContent('LDA 5');
        mockEditorInstance.getValue.mockReturnValue('LDA 5');
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: new Uint8Array([0x01, 0x05]),
          error: null,
        });

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          const result = app.getLastAssembleResult();
          expect(result).not.toBeNull();
          expect(result?.success).toBe(true);
          expect(result?.binary?.length).toBe(2);
        });
      });
    });

    describe('error handling', () => {
      it('should show error when assembler not ready', async () => {
        mockAssemblerBridge._setReady(false);
        mockEditorInstance._setContent('LDA 5');
        mockEditorInstance.getValue.mockReturnValue('LDA 5');

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          const assemblySection = container.querySelector('[data-section="assembly"]');
          expect(assemblySection?.textContent).toContain('not ready');
        });
      });

      it('should show error when editor content is empty', async () => {
        mockEditorInstance.getValue.mockReturnValue('');

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          const assemblySection = container.querySelector('[data-section="assembly"]');
          expect(assemblySection?.textContent).toContain('No code');
        });
      });
    });
  });
});
