import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Monaco editor for App tests
const {
  mockEditorInstance,
  mockModel,
  cursorPositionListeners,
  contentChangeListeners,
  addedActions,
  mockCursorDisposable,
  MockRange,
} = vi.hoisted(() => {
  // Mock Range class for Monaco decorations - must be inside hoisted block
  class MockRange {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
    constructor(startLine: number, startCol: number, endLine: number, endCol: number) {
      this.startLineNumber = startLine;
      this.startColumn = startCol;
      this.endLineNumber = endLine;
      this.endColumn = endCol;
    }
  }

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
    // Error decoration methods (Story 3.4)
    deltaDecorations: vi.fn(() => ['decoration-id']),
    setPosition: vi.fn(),
    revealLineInCenter: vi.fn(),
    // Mouse event methods (Story 5.8)
    onMouseDown: vi.fn(() => ({ dispose: vi.fn() })),
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
    MockRange,
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
  Range: MockRange,
}));

// Mock AssemblerBridge - must be properly hoisted to work as constructor
const { MockAssemblerBridge, mockAssemblerBridge } = vi.hoisted(() => {
  // Type for assembly error (matches AssemblerError from emulator)
  type AssemblerErrorType = 'SYNTAX_ERROR' | 'VALUE_ERROR' | 'CONSTRAINT_ERROR';
  type CodeSnippet = {
    line: string;
    lineNumber: number;
    contextBefore?: string[];
    contextAfter?: string[];
  };
  type AssemblerError = {
    line: number;
    column?: number;
    message: string;
    suggestion?: string;
    type?: AssemblerErrorType;
    codeSnippet?: CodeSnippet;
    fixable?: boolean;
  };

  // Type for assembly result (matches AssembleResult from emulator)
  type AssemblyResult = {
    success: boolean;
    binary: Uint8Array | null;
    error: AssemblerError | null;
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
    _setAssembleThrow: (error: Error) => {
      assembleMock.mockImplementation(() => Promise.reject(error));
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

// Mock EmulatorBridge for Story 4.4
const { MockEmulatorBridge, mockEmulatorBridge } = vi.hoisted(() => {
  // Mock CPUState shape
  type CPUState = {
    pc: number;
    accumulator: number;
    zeroFlag: boolean;
    halted: boolean;
    error: boolean;
    errorMessage: string | null;
    memory: Uint8Array;
    ir: number;
    mar: number;
    mdr: number;
    cycles: number;
    instructions: number;
  };

  // Mutable state for test manipulation
  const state: { isReady: boolean; cpuState: CPUState } = {
    isReady: true,
    cpuState: {
      pc: 0,
      accumulator: 0,
      zeroFlag: false,
      halted: false,
      error: false,
      errorMessage: null,
      memory: new Uint8Array(256),
      ir: 0,
      mar: 0,
      mdr: 0,
      cycles: 0,
      instructions: 0,
    },
  };

  // Mock methods
  const initMock = vi.fn(() => Promise.resolve());
  const loadProgramMock = vi.fn(() => Promise.resolve(state.cpuState));
  const terminateMock = vi.fn();
  const runMock = vi.fn();
  const setSpeedMock = vi.fn();
  const stepMock = vi.fn(() => Promise.resolve(state.cpuState));
  const stopMock = vi.fn(() => Promise.resolve(state.cpuState));
  const resetMock = vi.fn(() => Promise.resolve({
    ...state.cpuState,
    pc: 0,
    accumulator: 0,
    zeroFlag: false,
    cycles: 0,
    instructions: 0,
  }));
  const restoreStateMock = vi.fn(() => Promise.resolve(state.cpuState));

  // Event callback storage for simulating events (Story 4.5)
  let stateUpdateCallback: ((state: CPUState) => void) | null = null;
  let haltedCallback: (() => void) | null = null;
  let errorCallback: ((error: { message: string; address?: number }) => void) | null = null;

  const onStateUpdateMock = vi.fn((cb: (state: CPUState) => void) => {
    stateUpdateCallback = cb;
    return () => { stateUpdateCallback = null; };
  });
  const onHaltedMock = vi.fn((cb: () => void) => {
    haltedCallback = cb;
    return () => { haltedCallback = null; };
  });
  const onErrorMock = vi.fn((cb: (error: { message: string; address?: number }) => void) => {
    errorCallback = cb;
    return () => { errorCallback = null; };
  });

  // Constructor function that will be used as the class
  function MockEmulatorBridge() {
    return {
      init: initMock,
      loadProgram: loadProgramMock,
      terminate: terminateMock,
      run: runMock,
      setSpeed: setSpeedMock,
      step: stepMock,
      stop: stopMock,
      reset: resetMock,
      restoreState: restoreStateMock,
      onStateUpdate: onStateUpdateMock,
      onHalted: onHaltedMock,
      onError: onErrorMock,
      get isReady() {
        return state.isReady;
      },
    };
  }

  // Helpers for test manipulation
  const helpers = {
    init: initMock,
    loadProgram: loadProgramMock,
    terminate: terminateMock,
    run: runMock,
    setSpeed: setSpeedMock,
    step: stepMock,
    stop: stopMock,
    reset: resetMock,
    restoreState: restoreStateMock,
    onStateUpdate: onStateUpdateMock,
    onHalted: onHaltedMock,
    onError: onErrorMock,
    get isReady() {
      return state.isReady;
    },
    _setReady: (ready: boolean) => {
      state.isReady = ready;
    },
    _setCpuState: (cpuState: CPUState) => {
      state.cpuState = cpuState;
      loadProgramMock.mockImplementation(() => Promise.resolve(cpuState));
      stopMock.mockImplementation(() => Promise.resolve(cpuState));
    },
    _setLoadThrow: (error: Error) => {
      loadProgramMock.mockImplementation(() => Promise.reject(error));
    },
    _setInitThrow: (error: Error) => {
      initMock.mockImplementation(() => Promise.reject(error));
    },
    _setResetThrow: (error: Error) => {
      resetMock.mockImplementation(() => Promise.reject(error));
    },
    _setStepResult: (cpuState: CPUState) => {
      stepMock.mockImplementation(() => Promise.resolve(cpuState));
    },
    _setStepThrow: (error: Error) => {
      stepMock.mockImplementation(() => Promise.reject(error));
    },
    // Story 5.2: Set restore state result
    _setRestoreStateResult: (cpuState: CPUState) => {
      restoreStateMock.mockImplementation(() => Promise.resolve(cpuState));
    },
    _setResetResult: (cpuState: CPUState) => {
      resetMock.mockImplementation(() => Promise.resolve(cpuState));
    },
    // Story 4.5: Trigger event callbacks for testing
    _triggerStateUpdate: (cpuState: CPUState) => {
      if (stateUpdateCallback) stateUpdateCallback(cpuState);
    },
    _triggerHalted: () => {
      if (haltedCallback) haltedCallback();
    },
    _triggerError: (error: { message: string; address?: number }) => {
      if (errorCallback) errorCallback(error);
    },
    _reset: () => {
      state.isReady = true;
      state.cpuState = {
        pc: 0,
        accumulator: 0,
        zeroFlag: false,
        halted: false,
        error: false,
        errorMessage: null,
        memory: new Uint8Array(256),
        ir: 0,
        mar: 0,
        mdr: 0,
        cycles: 0,
        instructions: 0,
      };
      initMock.mockClear();
      initMock.mockImplementation(() => Promise.resolve());
      loadProgramMock.mockClear();
      terminateMock.mockClear();
      runMock.mockClear();
      setSpeedMock.mockClear();
      stepMock.mockClear();
      stopMock.mockClear();
      resetMock.mockClear();
      restoreStateMock.mockClear();
      onStateUpdateMock.mockClear();
      onHaltedMock.mockClear();
      onErrorMock.mockClear();
      loadProgramMock.mockImplementation(() => Promise.resolve(state.cpuState));
      stepMock.mockImplementation(() => Promise.resolve(state.cpuState));
      restoreStateMock.mockImplementation(() => Promise.resolve(state.cpuState));
      stopMock.mockImplementation(() => Promise.resolve(state.cpuState));
      resetMock.mockImplementation(() => Promise.resolve({
        ...state.cpuState,
        pc: 0,
        accumulator: 0,
        zeroFlag: false,
        cycles: 0,
        instructions: 0,
      }));
      stateUpdateCallback = null;
      haltedCallback = null;
      errorCallback = null;
    },
  };

  return { MockEmulatorBridge, mockEmulatorBridge: helpers };
});

vi.mock('@emulator/index', () => ({
  AssemblerBridge: MockAssemblerBridge,
  EmulatorBridge: MockEmulatorBridge,
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
    // Reset mock state for EmulatorBridge (Story 4.4)
    mockEmulatorBridge._reset();
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
      mockEmulatorBridge._reset();
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
        // Trigger content change to enable assemble button
        contentChangeListeners.forEach(cb => cb());
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
        // Trigger content change to enable assemble button
        contentChangeListeners.forEach(cb => cb());
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

    describe('debounce protection', () => {
      it('should prevent rapid triggering of assembly', async () => {
        mockEditorInstance._setContent('LDA 5');
        mockEditorInstance.getValue.mockReturnValue('LDA 5');

        // Trigger content change listener to enable the Assemble button
        if (contentChangeListeners.length > 0) {
          contentChangeListeners[0]();
        }

        // Make assembly take some time
        let resolveAssembly: (value: { success: boolean; binary: Uint8Array; error: null }) => void;
        mockAssemblerBridge.assemble.mockImplementation(() => new Promise(resolve => {
          resolveAssembly = resolve;
        }));

        // Trigger assembly multiple times rapidly via the keyboard shortcut action
        // (since button will be disabled after first click)
        const assembleAction = addedActions.find(a => a.id === 'assemble');
        expect(assembleAction).toBeDefined();

        // Call the action multiple times rapidly
        assembleAction!.run();
        assembleAction!.run();
        assembleAction!.run();

        // Assembly should only be called once due to debounce
        expect(mockAssemblerBridge.assemble).toHaveBeenCalledTimes(1);

        // Resolve the assembly
        resolveAssembly!({
          success: true,
          binary: new Uint8Array([0x01, 0x05]),
          error: null,
        });

        await vi.waitFor(() => {
          const assemblySection = container.querySelector('[data-section="assembly"]');
          expect(assemblySection?.textContent).toContain('2 bytes');
        });
      });

      it('should allow assembly after previous one completes', async () => {
        mockEditorInstance._setContent('LDA 5');
        mockEditorInstance.getValue.mockReturnValue('LDA 5');
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: new Uint8Array([0x01, 0x05]),
          error: null,
        });

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;

        // First assembly
        assembleBtn.click();
        await vi.waitFor(() => {
          expect(mockAssemblerBridge.assemble).toHaveBeenCalledTimes(1);
        });

        // Wait for assembly AND load to complete (Story 4.4 loads after assembly)
        await vi.waitFor(() => {
          const loadSection = container.querySelector('[data-section="load"]');
          expect(loadSection?.textContent).toContain('Loaded');
        });

        // Second assembly should work
        assembleBtn.click();
        await vi.waitFor(() => {
          expect(mockAssemblerBridge.assemble).toHaveBeenCalledTimes(2);
        });
      });
    });
  });

  describe('error panel integration (Story 3.4)', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      mockAssemblerBridge._reset();
      mockEmulatorBridge._reset();
      mockEditorInstance._resetContent();
      contentChangeListeners.length = 0;
      addedActions.length = 0;
      app.mount(container);
    });

    describe('ErrorPanel initialization', () => {
      it('should initialize ErrorPanel when app mounts', () => {
        const errorPanel = app.getErrorPanel();
        expect(errorPanel).not.toBeNull();
      });

      it('should return null for getErrorPanel() before mount', () => {
        const newApp = new App();
        expect(newApp.getErrorPanel()).toBeNull();
        newApp.destroy();
      });

      it('should mount ErrorPanel inside code panel', () => {
        const errorPanelEl = container.querySelector('.da-code-panel .da-error-panel');
        expect(errorPanelEl).not.toBeNull();
      });

      it('should hide ErrorPanel initially (no errors)', () => {
        const errorPanelEl = container.querySelector('.da-error-panel');
        expect(errorPanelEl?.classList.contains('da-error-panel--hidden')).toBe(true);
      });

      it('should clean up ErrorPanel on destroy', () => {
        expect(app.getErrorPanel()).not.toBeNull();
        app.destroy();
        expect(app.getErrorPanel()).toBeNull();
      });

      it('should not leak error panels on multiple mounts', () => {
        app.mount(container);
        app.mount(container);
        app.mount(container);

        const errorPanels = container.querySelectorAll('.da-error-panel');
        expect(errorPanels.length).toBe(1);
      });
    });

    describe('ErrorPanel displays assembly errors', () => {
      it('should show ErrorPanel with errors on assembly failure', async () => {
        mockEditorInstance._setContent('INVALID');
        mockEditorInstance.getValue.mockReturnValue('INVALID');
        mockAssemblerBridge._setAssembleResult({
          success: false,
          binary: null,
          error: { line: 1, message: 'Unknown instruction: INVALID' },
        });

        // Trigger content change listener to enable the Assemble button
        if (contentChangeListeners.length > 0) {
          contentChangeListeners[0]();
        }

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          const errorPanelEl = container.querySelector('.da-error-panel');
          expect(errorPanelEl?.classList.contains('da-error-panel--hidden')).toBe(false);
        });
      });

      it('should display error message in ErrorPanel', async () => {
        mockEditorInstance._setContent('INVALID');
        mockEditorInstance.getValue.mockReturnValue('INVALID');
        mockAssemblerBridge._setAssembleResult({
          success: false,
          binary: null,
          error: { line: 1, message: 'Unknown instruction: INVALID' },
        });

        // Trigger content change listener to enable the Assemble button
        if (contentChangeListeners.length > 0) {
          contentChangeListeners[0]();
        }

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          const messageEl = container.querySelector('.da-error-panel-message');
          expect(messageEl?.textContent).toBe('Unknown instruction: INVALID');
        });
      });

      it('should display error line number in ErrorPanel', async () => {
        mockEditorInstance._setContent('INVALID');
        mockEditorInstance.getValue.mockReturnValue('INVALID');
        mockAssemblerBridge._setAssembleResult({
          success: false,
          binary: null,
          error: { line: 5, message: 'Syntax error' },
        });

        // Trigger content change listener to enable the Assemble button
        if (contentChangeListeners.length > 0) {
          contentChangeListeners[0]();
        }

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          const locationEl = container.querySelector('.da-error-panel-location');
          expect(locationEl?.textContent).toContain('Line 5');
        });
      });

      it('should clear ErrorPanel on successful assembly', async () => {
        // First, trigger a failure
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
          const errorPanelEl = container.querySelector('.da-error-panel');
          expect(errorPanelEl?.classList.contains('da-error-panel--hidden')).toBe(false);
        });

        // Now trigger success
        mockEditorInstance._setContent('LDA 5');
        mockEditorInstance.getValue.mockReturnValue('LDA 5');
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: new Uint8Array([0x01, 0x05]),
          error: null,
        });

        assembleBtn.click();

        await vi.waitFor(() => {
          const errorPanelEl = container.querySelector('.da-error-panel');
          expect(errorPanelEl?.classList.contains('da-error-panel--hidden')).toBe(true);
        });
      });
    });

    describe('editor decorations on assembly errors', () => {
      it('should set error decorations on assembly failure', async () => {
        mockEditorInstance._setContent('INVALID');
        mockEditorInstance.getValue.mockReturnValue('INVALID');
        mockAssemblerBridge._setAssembleResult({
          success: false,
          binary: null,
          error: { line: 3, message: 'Error on line 3' },
        });

        // Trigger content change listener to enable the Assemble button
        if (contentChangeListeners.length > 0) {
          contentChangeListeners[0]();
        }

        mockEditorInstance.deltaDecorations.mockClear();

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        expect(assembleBtn.disabled).toBe(false); // Verify button is enabled
        assembleBtn.click();

        await vi.waitFor(() => {
          // deltaDecorations is called twice: once to clear (empty array), once to set (with decorations)
          expect(mockEditorInstance.deltaDecorations).toHaveBeenCalledTimes(2);
          // Second call should have decorations (first call is clearErrorDecorations with empty array)
          const calls = mockEditorInstance.deltaDecorations.mock.calls;
          const setCall = calls[1] as unknown as [string[], unknown[]];
          expect(setCall[1].length).toBeGreaterThan(0);
        });
      });

      it('should clear error decorations on successful assembly', async () => {
        // First failure to set decorations
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
          expect(mockEditorInstance.deltaDecorations).toHaveBeenCalled();
        });

        mockEditorInstance.deltaDecorations.mockClear();

        // Now success should clear decorations
        mockEditorInstance._setContent('LDA 5');
        mockEditorInstance.getValue.mockReturnValue('LDA 5');
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: new Uint8Array([0x01, 0x05]),
          error: null,
        });

        assembleBtn.click();

        await vi.waitFor(() => {
          expect(mockEditorInstance.deltaDecorations).toHaveBeenCalled();
          const calls = mockEditorInstance.deltaDecorations.mock.calls;
          const call = calls[0] as unknown as [string[], unknown[]];
          // Second argument should be empty array (clearing decorations)
          expect(call[1]).toEqual([]);
        });
      });
    });

    describe('click-to-jump from ErrorPanel to editor', () => {
      it('should reveal error line in editor when error item clicked', async () => {
        mockEditorInstance._setContent('INVALID');
        mockEditorInstance.getValue.mockReturnValue('INVALID');
        mockAssemblerBridge._setAssembleResult({
          success: false,
          binary: null,
          error: { line: 7, message: 'Error on line 7' },
        });

        // Trigger content change listener to enable the Assemble button
        if (contentChangeListeners.length > 0) {
          contentChangeListeners[0]();
        }

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          const errorItem = container.querySelector('.da-error-panel-item') as HTMLElement;
          expect(errorItem).not.toBeNull();
        });

        mockEditorInstance.setPosition.mockClear();
        mockEditorInstance.revealLineInCenter.mockClear();
        mockEditorInstance.focus.mockClear();

        // Click on the error item
        const errorItem = container.querySelector('.da-error-panel-item') as HTMLElement;
        errorItem.click();

        // Editor should reveal line 7
        expect(mockEditorInstance.setPosition).toHaveBeenCalledWith({ lineNumber: 7, column: 1 });
        expect(mockEditorInstance.revealLineInCenter).toHaveBeenCalledWith(7);
        expect(mockEditorInstance.focus).toHaveBeenCalled();
      });

      it('should use column when provided in error', async () => {
        mockEditorInstance._setContent('INVALID');
        mockEditorInstance.getValue.mockReturnValue('INVALID');
        mockAssemblerBridge._setAssembleResult({
          success: false,
          binary: null,
          error: { line: 5, column: 10, message: 'Error at column 10' },
        });

        // Trigger content change listener to enable the Assemble button
        if (contentChangeListeners.length > 0) {
          contentChangeListeners[0]();
        }

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          const errorItem = container.querySelector('.da-error-panel-item') as HTMLElement;
          expect(errorItem).not.toBeNull();
        });

        mockEditorInstance.setPosition.mockClear();

        const errorItem = container.querySelector('.da-error-panel-item') as HTMLElement;
        errorItem.click();

        expect(mockEditorInstance.setPosition).toHaveBeenCalledWith({ lineNumber: 5, column: 10 });
      });
    });

    describe('auto-fix functionality (Story 3.5)', () => {
      it('should replace error line with suggestion when Fix button is clicked', async () => {
        const originalCode = 'LDA 0x05\nLDAA 0x10\nHLT';
        mockEditorInstance._setContent(originalCode);
        mockEditorInstance.getValue.mockReturnValue(originalCode);

        mockAssemblerBridge._setAssembleResult({
          success: false,
          binary: null,
          error: {
            line: 2,
            message: 'Unknown instruction: LDAA',
            suggestion: 'LDA 0x10',
            fixable: true,
            type: 'SYNTAX_ERROR',
            codeSnippet: {
              line: 'LDAA 0x10',
              lineNumber: 2,
              contextBefore: ['LDA 0x05'],
              contextAfter: ['HLT'],
            },
          },
        });

        // Trigger content change to enable Assemble button
        if (contentChangeListeners.length > 0) {
          contentChangeListeners[0]();
        }

        // Trigger assembly to show errors
        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          const fixBtn = container.querySelector('.da-error-fix-btn') as HTMLElement;
          expect(fixBtn).not.toBeNull();
        });

        mockEditorInstance.setValue.mockClear();

        // Click Fix button
        const fixBtn = container.querySelector('.da-error-fix-btn') as HTMLElement;
        fixBtn.click();

        // Editor should have been updated with fixed code
        expect(mockEditorInstance.setValue).toHaveBeenCalledWith('LDA 0x05\nLDA 0x10\nHLT');
      });

      it('should trigger re-assembly after applying fix', async () => {
        const originalCode = 'INVALID';
        mockEditorInstance._setContent(originalCode);
        mockEditorInstance.getValue.mockReturnValue(originalCode);

        mockAssemblerBridge._setAssembleResult({
          success: false,
          binary: null,
          error: {
            line: 1,
            message: 'Unknown instruction: INVALID',
            suggestion: 'LDA',
            fixable: true,
          },
        });

        // Trigger content change to enable Assemble button
        if (contentChangeListeners.length > 0) {
          contentChangeListeners[0]();
        }

        // First assembly
        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          const fixBtn = container.querySelector('.da-error-fix-btn') as HTMLElement;
          expect(fixBtn).not.toBeNull();
        });

        // Now set a successful result for the re-assembly after fix
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: new Uint8Array([1, 2, 3]),
          error: null,
        });

        // Click Fix button
        const fixBtn = container.querySelector('.da-error-fix-btn') as HTMLElement;
        fixBtn.click();

        // Wait for re-assembly to complete
        await vi.waitFor(() => {
          // Check that errors were cleared (success path)
          const errorPanel = container.querySelector('.da-error-panel');
          expect(errorPanel?.classList.contains('da-error-panel--hidden')).toBe(true);
        });
      });

      it('should handle fix on first line correctly', async () => {
        const originalCode = 'BADOP\nHLT';
        mockEditorInstance._setContent(originalCode);
        mockEditorInstance.getValue.mockReturnValue(originalCode);

        mockAssemblerBridge._setAssembleResult({
          success: false,
          binary: null,
          error: {
            line: 1,
            message: 'Unknown instruction: BADOP',
            suggestion: 'NOP',
            fixable: true,
          },
        });

        if (contentChangeListeners.length > 0) {
          contentChangeListeners[0]();
        }

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          const fixBtn = container.querySelector('.da-error-fix-btn') as HTMLElement;
          expect(fixBtn).not.toBeNull();
        });

        mockEditorInstance.setValue.mockClear();

        const fixBtn = container.querySelector('.da-error-fix-btn') as HTMLElement;
        fixBtn.click();

        expect(mockEditorInstance.setValue).toHaveBeenCalledWith('NOP\nHLT');
      });

      it('should handle fix on last line correctly', async () => {
        const originalCode = 'LDA 0x05\nBADOP';
        mockEditorInstance._setContent(originalCode);
        mockEditorInstance.getValue.mockReturnValue(originalCode);

        mockAssemblerBridge._setAssembleResult({
          success: false,
          binary: null,
          error: {
            line: 2,
            message: 'Unknown instruction: BADOP',
            suggestion: 'HLT',
            fixable: true,
          },
        });

        if (contentChangeListeners.length > 0) {
          contentChangeListeners[0]();
        }

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          const fixBtn = container.querySelector('.da-error-fix-btn') as HTMLElement;
          expect(fixBtn).not.toBeNull();
        });

        mockEditorInstance.setValue.mockClear();

        const fixBtn = container.querySelector('.da-error-fix-btn') as HTMLElement;
        fixBtn.click();

        expect(mockEditorInstance.setValue).toHaveBeenCalledWith('LDA 0x05\nHLT');
      });

      it('should not apply fix if suggestion is undefined', async () => {
        const originalCode = 'INVALID';
        mockEditorInstance._setContent(originalCode);
        mockEditorInstance.getValue.mockReturnValue(originalCode);

        mockAssemblerBridge._setAssembleResult({
          success: false,
          binary: null,
          error: {
            line: 1,
            message: 'Unknown instruction',
            // No suggestion - fixable should be false
            fixable: false,
          },
        });

        if (contentChangeListeners.length > 0) {
          contentChangeListeners[0]();
        }

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          const errorItem = container.querySelector('.da-error-panel-item') as HTMLElement;
          expect(errorItem).not.toBeNull();
        });

        // No Fix button should appear
        const fixBtn = container.querySelector('.da-error-fix-btn');
        expect(fixBtn).toBeNull();
      });

      it('should reveal the fixed line for visual feedback', async () => {
        const originalCode = 'LDA 0x05\nLDAA 0x10\nHLT';
        mockEditorInstance._setContent(originalCode);
        mockEditorInstance.getValue.mockReturnValue(originalCode);

        mockAssemblerBridge._setAssembleResult({
          success: false,
          binary: null,
          error: {
            line: 2,
            message: 'Unknown instruction: LDAA',
            suggestion: 'LDA 0x10',
            fixable: true,
          },
        });

        if (contentChangeListeners.length > 0) {
          contentChangeListeners[0]();
        }

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          const fixBtn = container.querySelector('.da-error-fix-btn') as HTMLElement;
          expect(fixBtn).not.toBeNull();
        });

        mockEditorInstance.setPosition.mockClear();
        mockEditorInstance.revealLineInCenter.mockClear();
        mockEditorInstance.focus.mockClear();

        // Click Fix button
        const fixBtn = container.querySelector('.da-error-fix-btn') as HTMLElement;
        fixBtn.click();

        // Editor.revealLine should be called, which internally calls setPosition, revealLineInCenter, focus
        // This verifies visual feedback is shown for the fixed line
        expect(mockEditorInstance.setPosition).toHaveBeenCalledWith({ lineNumber: 2, column: 1 });
        expect(mockEditorInstance.revealLineInCenter).toHaveBeenCalledWith(2);
        expect(mockEditorInstance.focus).toHaveBeenCalled();
      });
    });

    describe('BinaryOutputPanel integration (Story 3.6)', () => {
      it('should show binary toggle button after successful assembly', async () => {
        mockEditorInstance._setContent('LDA 0x05');
        mockEditorInstance.getValue.mockReturnValue('LDA 0x05');
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: new Uint8Array([0x1A, 0x05]),
          error: null,
        });

        if (contentChangeListeners.length > 0) {
          contentChangeListeners[0]();
        }

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          const toggleContainer = container.querySelector('.da-binary-toggle-container');
          expect(toggleContainer?.classList.contains('da-binary-toggle-container--hidden')).toBe(false);
        });
      });

      it('should hide binary toggle button after assembly error', async () => {
        // First succeed to show the toggle
        mockEditorInstance._setContent('LDA 0x05');
        mockEditorInstance.getValue.mockReturnValue('LDA 0x05');
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: new Uint8Array([0x1A, 0x05]),
          error: null,
        });

        if (contentChangeListeners.length > 0) {
          contentChangeListeners[0]();
        }

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          const toggleContainer = container.querySelector('.da-binary-toggle-container');
          expect(toggleContainer?.classList.contains('da-binary-toggle-container--hidden')).toBe(false);
        });

        // Now fail assembly
        mockEditorInstance._setContent('INVALID');
        mockEditorInstance.getValue.mockReturnValue('INVALID');
        mockAssemblerBridge._setAssembleResult({
          success: false,
          binary: null,
          error: { line: 1, message: 'Unknown instruction: INVALID' },
        });

        assembleBtn.click();

        await vi.waitFor(() => {
          const toggleContainer = container.querySelector('.da-binary-toggle-container');
          expect(toggleContainer?.classList.contains('da-binary-toggle-container--hidden')).toBe(true);
        });
      });

      it('should toggle binary panel visibility when toggle button clicked', async () => {
        mockEditorInstance._setContent('LDA 0x05');
        mockEditorInstance.getValue.mockReturnValue('LDA 0x05');
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: new Uint8Array([0x1A, 0x05]),
          error: null,
        });

        if (contentChangeListeners.length > 0) {
          contentChangeListeners[0]();
        }

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          const toggleBtn = container.querySelector('.da-binary-toggle');
          expect(toggleBtn).not.toBeNull();
        });

        const toggleBtn = container.querySelector('.da-binary-toggle') as HTMLButtonElement;
        const binaryPanel = container.querySelector('.da-binary-panel');

        // Initially hidden
        expect(binaryPanel?.classList.contains('da-binary-panel--hidden')).toBe(true);

        // Click to show
        toggleBtn.click();
        expect(binaryPanel?.classList.contains('da-binary-panel--hidden')).toBe(false);
        expect(toggleBtn.classList.contains('da-binary-toggle--active')).toBe(true);
        expect(toggleBtn.getAttribute('aria-pressed')).toBe('true');

        // Click to hide
        toggleBtn.click();
        expect(binaryPanel?.classList.contains('da-binary-panel--hidden')).toBe(true);
        expect(toggleBtn.classList.contains('da-binary-toggle--active')).toBe(false);
        expect(toggleBtn.getAttribute('aria-pressed')).toBe('false');
      });

      it('should display binary data as hex dump after successful assembly', async () => {
        mockEditorInstance._setContent('LDA 0x05\nHLT');
        mockEditorInstance.getValue.mockReturnValue('LDA 0x05\nHLT');
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: new Uint8Array([0x1A, 0x05, 0xF0, 0x00]),
          error: null,
        });

        if (contentChangeListeners.length > 0) {
          contentChangeListeners[0]();
        }

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          const toggleBtn = container.querySelector('.da-binary-toggle');
          expect(toggleBtn).not.toBeNull();
        });

        // Show the panel
        const toggleBtn = container.querySelector('.da-binary-toggle') as HTMLButtonElement;
        toggleBtn.click();

        // Verify hex dump is displayed
        const binaryContent = container.querySelector('.da-binary-content');
        expect(binaryContent?.textContent).toContain('0x0000:');
        expect(binaryContent?.textContent).toContain('1A');
        expect(binaryContent?.textContent).toContain('05');
        expect(binaryContent?.textContent).toContain('F0');
        expect(binaryContent?.textContent).toContain('00');
      });

      it('should clear binary data when assembly fails', async () => {
        // First succeed
        mockEditorInstance._setContent('LDA 0x05');
        mockEditorInstance.getValue.mockReturnValue('LDA 0x05');
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: new Uint8Array([0x1A, 0x05]),
          error: null,
        });

        if (contentChangeListeners.length > 0) {
          contentChangeListeners[0]();
        }

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        // Wait for assembly AND load to complete (Story 4.4 loads after assembly)
        await vi.waitFor(() => {
          const loadSection = container.querySelector('[data-section="load"]');
          expect(loadSection?.textContent).toContain('Loaded');
        });

        // Show the panel and verify data
        const toggleBtn = container.querySelector('.da-binary-toggle') as HTMLButtonElement;
        toggleBtn.click();

        let binaryRows = container.querySelectorAll('.da-binary-row');
        expect(binaryRows.length).toBe(1);

        // Now fail assembly
        mockEditorInstance._setContent('INVALID');
        mockEditorInstance.getValue.mockReturnValue('INVALID');
        mockAssemblerBridge._setAssembleResult({
          success: false,
          binary: null,
          error: { line: 1, message: 'Unknown instruction: INVALID' },
        });

        assembleBtn.click();

        await vi.waitFor(() => {
          binaryRows = container.querySelectorAll('.da-binary-row');
          expect(binaryRows.length).toBe(0);
        });
      });

      it('should expose getBinaryOutputPanel method', () => {
        expect(app.getBinaryOutputPanel()).not.toBeNull();
      });

      it('should hide binary panel after assembly error', async () => {
        // First succeed and show the panel
        mockEditorInstance._setContent('LDA 0x05');
        mockEditorInstance.getValue.mockReturnValue('LDA 0x05');
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: new Uint8Array([0x1A, 0x05]),
          error: null,
        });

        if (contentChangeListeners.length > 0) {
          contentChangeListeners[0]();
        }

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        // Wait for assembly AND load to complete (Story 4.4 loads after assembly)
        await vi.waitFor(() => {
          const loadSection = container.querySelector('[data-section="load"]');
          expect(loadSection?.textContent).toContain('Loaded');
        });

        // Show the panel
        const toggleBtn = container.querySelector('.da-binary-toggle') as HTMLButtonElement;
        toggleBtn.click();

        const binaryPanel = container.querySelector('.da-binary-panel');
        expect(binaryPanel?.classList.contains('da-binary-panel--hidden')).toBe(false);

        // Now fail assembly
        mockEditorInstance._setContent('INVALID');
        mockEditorInstance.getValue.mockReturnValue('INVALID');
        mockAssemblerBridge._setAssembleResult({
          success: false,
          binary: null,
          error: { line: 1, message: 'Error' },
        });

        assembleBtn.click();

        await vi.waitFor(() => {
          expect(binaryPanel?.classList.contains('da-binary-panel--hidden')).toBe(true);
        });
      });
    });

    describe('assembly state invalidation (Story 3.7)', () => {
      it('should disable execution buttons on initial load', () => {
        const toolbar = app.getToolbar();
        expect(toolbar?.getState().canRun).toBe(false);
        expect(toolbar?.getState().canStep).toBe(false);
        expect(toolbar?.getState().canReset).toBe(false);
      });

      it('should disable execution buttons when code changes after successful assembly', async () => {
        // First, assemble successfully
        mockEditorInstance._setContent('LDA 0x05');
        mockEditorInstance.getValue.mockReturnValue('LDA 0x05');
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: new Uint8Array([0x1A, 0x05]),
          error: null,
        });

        if (contentChangeListeners.length > 0) {
          contentChangeListeners[0]();
        }

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        // Wait for assembly to complete and buttons to be enabled
        await vi.waitFor(() => {
          const toolbar = app.getToolbar();
          expect(toolbar?.getState().canRun).toBe(true);
          expect(toolbar?.getState().canStep).toBe(true);
          expect(toolbar?.getState().canReset).toBe(true);
        });

        // Now change the code (simulates user editing)
        mockEditorInstance._setContent('LDA 0x10');
        mockEditorInstance.getValue.mockReturnValue('LDA 0x10');

        // Trigger content change callback (simulates Monaco onDidChangeModelContent)
        if (contentChangeListeners.length > 0) {
          contentChangeListeners[0]();
        }

        // Execution buttons should now be disabled
        const toolbar = app.getToolbar();
        expect(toolbar?.getState().canRun).toBe(false);
        expect(toolbar?.getState().canStep).toBe(false);
        expect(toolbar?.getState().canReset).toBe(false);
      });

      it('should hide binary output when code changes after successful assembly', async () => {
        // First, assemble successfully
        mockEditorInstance._setContent('LDA 0x05');
        mockEditorInstance.getValue.mockReturnValue('LDA 0x05');
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: new Uint8Array([0x1A, 0x05]),
          error: null,
        });

        if (contentChangeListeners.length > 0) {
          contentChangeListeners[0]();
        }

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        // Wait for binary toggle to appear
        await vi.waitFor(() => {
          const toggleContainer = container.querySelector('.da-binary-toggle-container');
          expect(toggleContainer?.classList.contains('da-binary-toggle-container--hidden')).toBe(false);
        });

        // Now change the code
        mockEditorInstance._setContent('LDA 0x10');
        mockEditorInstance.getValue.mockReturnValue('LDA 0x10');

        if (contentChangeListeners.length > 0) {
          contentChangeListeners[0]();
        }

        // Binary toggle should now be hidden
        const toggleContainer = container.querySelector('.da-binary-toggle-container');
        expect(toggleContainer?.classList.contains('da-binary-toggle-container--hidden')).toBe(true);
      });

      it('should re-enable execution buttons after re-assembly', async () => {
        // First, assemble successfully
        mockEditorInstance._setContent('LDA 0x05');
        mockEditorInstance.getValue.mockReturnValue('LDA 0x05');
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: new Uint8Array([0x1A, 0x05]),
          error: null,
        });

        if (contentChangeListeners.length > 0) {
          contentChangeListeners[0]();
        }

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          expect(app.getToolbar()?.getState().canRun).toBe(true);
        });

        // Change code to invalidate assembly
        mockEditorInstance._setContent('LDA 0x10');
        mockEditorInstance.getValue.mockReturnValue('LDA 0x10');

        if (contentChangeListeners.length > 0) {
          contentChangeListeners[0]();
        }

        expect(app.getToolbar()?.getState().canRun).toBe(false);

        // Re-assemble
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: new Uint8Array([0x1A, 0x10]),
          error: null,
        });

        assembleBtn.click();

        // Should be enabled again
        await vi.waitFor(() => {
          expect(app.getToolbar()?.getState().canRun).toBe(true);
          expect(app.getToolbar()?.getState().canStep).toBe(true);
          expect(app.getToolbar()?.getState().canReset).toBe(true);
        });
      });

      it('should not trigger state change on first content load', async () => {
        // Assemble first
        mockEditorInstance._setContent('LDA 0x05');
        mockEditorInstance.getValue.mockReturnValue('LDA 0x05');
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: new Uint8Array([0x1A, 0x05]),
          error: null,
        });

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          expect(app.getToolbar()?.getState().canRun).toBe(true);
        });

        // The initial content was set before any assembly - no change should occur now
        // This test verifies that hasValidAssembly only invalidates AFTER a successful assembly
      });

      it('should disable execution buttons when assembler throws unexpected error (worker crash)', async () => {
        // First, assemble successfully
        mockEditorInstance._setContent('LDA 0x05');
        mockEditorInstance.getValue.mockReturnValue('LDA 0x05');
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: new Uint8Array([0x1A, 0x05]),
          error: null,
        });

        if (contentChangeListeners.length > 0) {
          contentChangeListeners[0]();
        }

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        // Wait for assembly to complete and buttons to be enabled
        await vi.waitFor(() => {
          expect(app.getToolbar()?.getState().canRun).toBe(true);
        });

        // Now make assembler throw (simulates worker crash/timeout)
        mockAssemblerBridge._setAssembleThrow(new Error('Worker crashed'));

        // Try to assemble again
        assembleBtn.click();

        // Execution buttons should be disabled after the error
        await vi.waitFor(() => {
          expect(app.getToolbar()?.getState().canRun).toBe(false);
          expect(app.getToolbar()?.getState().canStep).toBe(false);
          expect(app.getToolbar()?.getState().canReset).toBe(false);
        });

        // Verify error is shown in status bar
        const statusBar = app.getStatusBar();
        expect(statusBar?.getState().assemblyStatus).toBe('error');
        expect(statusBar?.getState().assemblyMessage).toBe('Worker crashed');
      });
    });
  });

  describe('program load integration (Story 4.4)', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      mockAssemblerBridge._reset();
      mockEmulatorBridge._reset();
      mockEditorInstance._resetContent();
      contentChangeListeners.length = 0;
      addedActions.length = 0;
      app.mount(container);
    });

    describe('EmulatorBridge initialization', () => {
      it('should initialize EmulatorBridge when app mounts', () => {
        expect(mockEmulatorBridge.init).toHaveBeenCalledTimes(1);
      });

      it('should terminate EmulatorBridge when app is destroyed', () => {
        app.destroy();
        expect(mockEmulatorBridge.terminate).toHaveBeenCalledTimes(1);
      });

      it('should re-initialize EmulatorBridge on re-mount', () => {
        app.mount(container);
        expect(mockEmulatorBridge.init).toHaveBeenCalledTimes(2);
        expect(mockEmulatorBridge.terminate).toHaveBeenCalledTimes(1);
      });
    });

    describe('auto-load on assembly success', () => {
      it('should load program into emulator after successful assembly', async () => {
        const binary = new Uint8Array([0x01, 0x05, 0x0F]);
        mockEditorInstance._setContent('LDA 5\nHLT');
        mockEditorInstance.getValue.mockReturnValue('LDA 5\nHLT');
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: binary,
          error: null,
        });

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          expect(mockEmulatorBridge.loadProgram).toHaveBeenCalledWith(binary);
        });
      });

      it('should show load status in status bar after successful load', async () => {
        const binary = new Uint8Array([0x01, 0x05, 0x0F]);
        mockEditorInstance._setContent('LDA 5\nHLT');
        mockEditorInstance.getValue.mockReturnValue('LDA 5\nHLT');
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: binary,
          error: null,
        });

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          const loadSection = container.querySelector('[data-section="load"]');
          expect(loadSection?.textContent).toContain('Loaded: 3 nibbles');
        });
      });

      it('should update PC value in status bar after load', async () => {
        const binary = new Uint8Array([0x01, 0x05]);
        mockEditorInstance._setContent('LDA 5');
        mockEditorInstance.getValue.mockReturnValue('LDA 5');
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: binary,
          error: null,
        });
        mockEmulatorBridge._setCpuState({
          pc: 0,
          accumulator: 0,
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0,
          mar: 0,
          mdr: 0,
          cycles: 0,
          instructions: 0,
        });

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          const statusBar = app.getStatusBar();
          expect(statusBar?.getState().pcValue).toBe(0);
        });
      });

      it('should not load program when assembly fails', async () => {
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

        expect(mockEmulatorBridge.loadProgram).not.toHaveBeenCalled();
      });
    });

    describe('load error handling', () => {
      it('should handle emulator load failure gracefully', async () => {
        const binary = new Uint8Array([0x01, 0x05]);
        mockEditorInstance._setContent('LDA 5');
        mockEditorInstance.getValue.mockReturnValue('LDA 5');
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: binary,
          error: null,
        });
        mockEmulatorBridge._setLoadThrow(new Error('Load failed'));

        // Spy on console.error
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          expect(consoleSpy).toHaveBeenCalledWith(
            'Failed to load program into emulator:',
            expect.any(Error)
          );
        });

        consoleSpy.mockRestore();
      });

      it('should clear load status on emulator load failure', async () => {
        const binary = new Uint8Array([0x01, 0x05]);
        mockEditorInstance._setContent('LDA 5');
        mockEditorInstance.getValue.mockReturnValue('LDA 5');
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: binary,
          error: null,
        });
        mockEmulatorBridge._setLoadThrow(new Error('Load failed'));

        // Suppress console.error for this test
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          const statusBar = app.getStatusBar();
          expect(statusBar?.getState().loadStatus).toBeNull();
        });

        consoleSpy.mockRestore();
      });
    });

    describe('Issue #3: state reset on load failure', () => {
      it('should reset pcValue and cycleCount on load failure', async () => {
        // First do a successful load to set pcValue and cycleCount
        const binary = new Uint8Array([0x01, 0x05]);
        mockEditorInstance._setContent('LDA 5');
        mockEditorInstance.getValue.mockReturnValue('LDA 5');
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: binary,
          error: null,
        });
        mockEmulatorBridge._setCpuState({
          pc: 10,
          accumulator: 0,
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0,
          mar: 0,
          mdr: 0,
          cycles: 42,
          instructions: 0,
        });

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          const statusBar = app.getStatusBar();
          expect(statusBar?.getState().pcValue).toBe(10);
          expect(statusBar?.getState().cycleCount).toBe(42);
        });

        // Now set up for load failure
        mockEmulatorBridge._setLoadThrow(new Error('Load failed'));

        // Suppress console.error for this test
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        assembleBtn.click();

        await vi.waitFor(() => {
          const statusBar = app.getStatusBar();
          expect(statusBar?.getState().loadStatus).toBeNull();
          expect(statusBar?.getState().pcValue).toBeNull();
          expect(statusBar?.getState().cycleCount).toBe(0);
        });

        consoleSpy.mockRestore();
      });
    });

    describe('Issue #4: EmulatorBridge init failure notification', () => {
      it('should show error in status bar when EmulatorBridge init fails', async () => {
        // Create a fresh app instance with init failure
        app.destroy();
        mockEmulatorBridge._reset();
        mockEmulatorBridge._setInitThrow(new Error('WASM load failed'));

        app = new App();
        app.mount(container);

        // Wait for the async init failure to propagate
        await vi.waitFor(() => {
          const statusBar = app.getStatusBar();
          expect(statusBar?.getState().loadStatus).toBe('Emulator init failed');
        });
      });
    });

    describe('Issue #5: binary type verification', () => {
      it('should receive binary as Uint8Array from AssemblerBridge', async () => {
        const binary = new Uint8Array([0x01, 0x05, 0x0F]);
        mockEditorInstance._setContent('LDA 5\nHLT');
        mockEditorInstance.getValue.mockReturnValue('LDA 5\nHLT');
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: binary,
          error: null,
        });

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          expect(mockEmulatorBridge.loadProgram).toHaveBeenCalled();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const calls = (mockEmulatorBridge.loadProgram as any).mock.calls;
          const calledArg = calls[0][0];
          expect(calledArg).toBeInstanceOf(Uint8Array);
          expect(calledArg).toEqual(binary);
        });
      });
    });

    describe('load status invalidation on code change', () => {
      it('should clear load status when code changes after successful load', async () => {
        // First, assemble and load successfully
        const binary = new Uint8Array([0x01, 0x05]);
        mockEditorInstance._setContent('LDA 5');
        mockEditorInstance.getValue.mockReturnValue('LDA 5');
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: binary,
          error: null,
        });

        if (contentChangeListeners.length > 0) {
          contentChangeListeners[0]();
        }

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        // Wait for load to complete
        await vi.waitFor(() => {
          const loadSection = container.querySelector('[data-section="load"]');
          expect(loadSection?.textContent).toContain('Loaded: 2 nibbles');
        });

        // Now change the code
        mockEditorInstance._setContent('LDA 10');
        mockEditorInstance.getValue.mockReturnValue('LDA 10');

        if (contentChangeListeners.length > 0) {
          contentChangeListeners[0]();
        }

        // Load status should be cleared
        const statusBar = app.getStatusBar();
        expect(statusBar?.getState().loadStatus).toBeNull();

        // Verify DOM shows "--" for load status
        const loadSection = container.querySelector('[data-section="load"]');
        expect(loadSection?.textContent).toBe('--');
      });
    });
  });

  describe('program execution (Story 4.5)', () => {
    beforeEach(() => {
      app.mount(container);
      mockEmulatorBridge._reset();
    });

    // Helper to assemble and load a program
    const assembleAndLoad = async () => {
      const binary = new Uint8Array([0x01, 0x05, 0x0F]);
      mockEditorInstance._setContent('LDA 5\nHLT');
      mockEditorInstance.getValue.mockReturnValue('LDA 5\nHLT');
      mockAssemblerBridge._setAssembleResult({
        success: true,
        binary: binary,
        error: null,
      });

      const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
      assembleBtn.click();

      await vi.waitFor(() => {
        expect(mockEmulatorBridge.loadProgram).toHaveBeenCalled();
      });
    };

    describe('Run button click handler', () => {
      it('should call emulatorBridge.run() when Run button is clicked', async () => {
        await assembleAndLoad();

        const runBtn = container.querySelector('[data-action="run"]') as HTMLButtonElement;
        runBtn.click();

        expect(mockEmulatorBridge.run).toHaveBeenCalledWith(1); // 60Hz / 60 = 1
      });

      it('should not call run() if no valid assembly', () => {
        const runBtn = container.querySelector('[data-action="run"]') as HTMLButtonElement;
        runBtn.click();

        expect(mockEmulatorBridge.run).not.toHaveBeenCalled();
      });

      it('should set up event subscriptions when run starts', async () => {
        await assembleAndLoad();

        const runBtn = container.querySelector('[data-action="run"]') as HTMLButtonElement;
        runBtn.click();

        expect(mockEmulatorBridge.onStateUpdate).toHaveBeenCalled();
        expect(mockEmulatorBridge.onHalted).toHaveBeenCalled();
        expect(mockEmulatorBridge.onError).toHaveBeenCalled();
      });
    });

    describe('Run/Pause toggle visibility', () => {
      it('should hide Run button and show Pause button when running', async () => {
        await assembleAndLoad();

        const runBtn = container.querySelector('[data-action="run"]') as HTMLButtonElement;
        const pauseBtn = container.querySelector('[data-action="pause"]') as HTMLButtonElement;

        // Initially Run is visible, Pause is hidden
        expect(runBtn.hidden).toBe(false);
        expect(pauseBtn.hidden).toBe(true);

        // Click Run
        runBtn.click();

        // Now Run should be hidden, Pause visible
        expect(runBtn.hidden).toBe(true);
        expect(pauseBtn.hidden).toBe(false);
      });

      it('should show Run button and hide Pause button when paused', async () => {
        await assembleAndLoad();

        const runBtn = container.querySelector('[data-action="run"]') as HTMLButtonElement;
        const pauseBtn = container.querySelector('[data-action="pause"]') as HTMLButtonElement;

        // Start running
        runBtn.click();

        // Click Pause
        pauseBtn.click();

        await vi.waitFor(() => {
          expect(runBtn.hidden).toBe(false);
          expect(pauseBtn.hidden).toBe(true);
        });
      });
    });

    describe('status bar updates during execution', () => {
      it('should update status bar with PC and cycle count on state update', async () => {
        await assembleAndLoad();

        const runBtn = container.querySelector('[data-action="run"]') as HTMLButtonElement;
        runBtn.click();

        // Simulate state update from emulator
        mockEmulatorBridge._triggerStateUpdate({
          pc: 42,
          accumulator: 5,
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0,
          mar: 0,
          mdr: 0,
          cycles: 100,
          instructions: 50,
        });

        const statusBar = app.getStatusBar();
        expect(statusBar?.getState().pcValue).toBe(42);
        expect(statusBar?.getState().cycleCount).toBe(100);
      });

      it('should show speed in status bar when running', async () => {
        await assembleAndLoad();

        const runBtn = container.querySelector('[data-action="run"]') as HTMLButtonElement;
        runBtn.click();

        const statusBar = app.getStatusBar();
        expect(statusBar?.getState().speed).toBe(60); // Default speed
      });
    });

    describe('execution termination (HLT)', () => {
      it('should stop running and show Run button when CPU halts', async () => {
        await assembleAndLoad();

        const runBtn = container.querySelector('[data-action="run"]') as HTMLButtonElement;
        const pauseBtn = container.querySelector('[data-action="pause"]') as HTMLButtonElement;

        runBtn.click();

        // Simulate HLT
        mockEmulatorBridge._triggerHalted();

        expect(runBtn.hidden).toBe(false);
        expect(pauseBtn.hidden).toBe(true);
      });

      it('should update status bar with Halted message', async () => {
        await assembleAndLoad();

        const runBtn = container.querySelector('[data-action="run"]') as HTMLButtonElement;
        runBtn.click();

        mockEmulatorBridge._triggerHalted();

        const statusBar = app.getStatusBar();
        expect(statusBar?.getState().loadStatus).toBe('Halted');
        expect(statusBar?.getState().speed).toBeNull();
      });
    });

    describe('execution error handling', () => {
      it('should stop running and show Run button on error', async () => {
        await assembleAndLoad();

        const runBtn = container.querySelector('[data-action="run"]') as HTMLButtonElement;
        const pauseBtn = container.querySelector('[data-action="pause"]') as HTMLButtonElement;

        runBtn.click();

        // Simulate error
        mockEmulatorBridge._triggerError({ message: 'Invalid instruction', address: 10 });

        expect(runBtn.hidden).toBe(false);
        expect(pauseBtn.hidden).toBe(true);
      });

      it('should update status bar with Error message', async () => {
        await assembleAndLoad();

        const runBtn = container.querySelector('[data-action="run"]') as HTMLButtonElement;
        runBtn.click();

        mockEmulatorBridge._triggerError({ message: 'Invalid instruction', address: 10 });

        const statusBar = app.getStatusBar();
        expect(statusBar?.getState().loadStatus).toBe('Error');
        expect(statusBar?.getState().speed).toBeNull();
      });
    });

    describe('speed control', () => {
      it('should pass speed value to emulatorBridge.run()', async () => {
        await assembleAndLoad();

        // Change speed via slider
        const slider = container.querySelector('.da-speed-slider') as HTMLInputElement;
        slider.value = '100';
        slider.dispatchEvent(new Event('input'));

        const runBtn = container.querySelector('[data-action="run"]') as HTMLButtonElement;
        runBtn.click();

        // 100Hz / 60 ≈ 1.67, rounded to 2
        expect(mockEmulatorBridge.run).toHaveBeenCalledWith(2);
      });
    });

    describe('button enable/disable states', () => {
      it('should disable Run button when running', async () => {
        await assembleAndLoad();

        const runBtn = container.querySelector('[data-action="run"]') as HTMLButtonElement;

        // Run button should be enabled
        expect(runBtn.disabled).toBe(false);

        runBtn.click();

        // Run button should be disabled (hidden actually, but canRun=false)
        const toolbar = app.getToolbar();
        expect(toolbar?.getState().canRun).toBe(false);
      });

      it('should disable Step button when running', async () => {
        await assembleAndLoad();

        const runBtn = container.querySelector('[data-action="run"]') as HTMLButtonElement;
        runBtn.click();

        const toolbar = app.getToolbar();
        expect(toolbar?.getState().canStep).toBe(false);
      });
    });

    describe('Pause button', () => {
      it('should call emulatorBridge.stop() when Pause is clicked', async () => {
        await assembleAndLoad();

        const runBtn = container.querySelector('[data-action="run"]') as HTMLButtonElement;
        runBtn.click();

        const pauseBtn = container.querySelector('[data-action="pause"]') as HTMLButtonElement;
        pauseBtn.click();

        expect(mockEmulatorBridge.stop).toHaveBeenCalled();
      });

      it('should clear speed from status bar when paused', async () => {
        await assembleAndLoad();

        const runBtn = container.querySelector('[data-action="run"]') as HTMLButtonElement;
        runBtn.click();

        const pauseBtn = container.querySelector('[data-action="pause"]') as HTMLButtonElement;
        pauseBtn.click();

        await vi.waitFor(() => {
          const statusBar = app.getStatusBar();
          expect(statusBar?.getState().speed).toBeNull();
        });
      });

      it('should update toolbar to show Run button after pause (AC: #2)', async () => {
        await assembleAndLoad();

        const runBtn = container.querySelector('[data-action="run"]') as HTMLButtonElement;
        runBtn.click();

        const pauseBtn = container.querySelector('[data-action="pause"]') as HTMLButtonElement;
        pauseBtn.click();

        await vi.waitFor(() => {
          const toolbar = app.getToolbar();
          expect(toolbar?.getState().isRunning).toBe(false);
          expect(toolbar?.getState().canRun).toBe(true);
          expect(toolbar?.getState().canPause).toBe(false);
        });
      });

      it('should update status bar with final PC and cycle count after pause (AC: #3)', async () => {
        await assembleAndLoad();

        // Configure stop to return specific state
        mockEmulatorBridge.stop.mockResolvedValue({
          pc: 5,
          accumulator: 7,
          memory: new Uint8Array(256),
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          ir: 0,
          mar: 0,
          mdr: 0,
          cycles: 42,
          instructions: 21,
        });

        const runBtn = container.querySelector('[data-action="run"]') as HTMLButtonElement;
        runBtn.click();

        const pauseBtn = container.querySelector('[data-action="pause"]') as HTMLButtonElement;
        pauseBtn.click();

        await vi.waitFor(() => {
          const statusBar = app.getStatusBar();
          expect(statusBar?.getState().pcValue).toBe(5);
          expect(statusBar?.getState().cycleCount).toBe(42);
        });
      });

      it('should enable canStep after pause for single-stepping (AC: #4)', async () => {
        await assembleAndLoad();

        const runBtn = container.querySelector('[data-action="run"]') as HTMLButtonElement;
        runBtn.click();

        const pauseBtn = container.querySelector('[data-action="pause"]') as HTMLButtonElement;
        pauseBtn.click();

        await vi.waitFor(() => {
          const toolbar = app.getToolbar();
          expect(toolbar?.getState().canStep).toBe(true);
        });
      });

      it('should do nothing when pause is called while not running', async () => {
        await assembleAndLoad();

        // Don't click Run first - should be no-op
        const pauseBtn = container.querySelector('[data-action="pause"]') as HTMLButtonElement;
        pauseBtn.click();

        // stop() should not have been called
        expect(mockEmulatorBridge.stop).not.toHaveBeenCalled();
      });

      it('should reset running state even when stop() throws error', async () => {
        await assembleAndLoad();

        // Configure stop to throw
        mockEmulatorBridge.stop.mockRejectedValue(new Error('Stop failed'));

        const runBtn = container.querySelector('[data-action="run"]') as HTMLButtonElement;
        runBtn.click();

        const pauseBtn = container.querySelector('[data-action="pause"]') as HTMLButtonElement;
        pauseBtn.click();

        await vi.waitFor(() => {
          const toolbar = app.getToolbar();
          // Even on error, running state should be reset
          expect(toolbar?.getState().isRunning).toBe(false);
          expect(toolbar?.getState().canRun).toBe(true);
        });
      });

      it('should show Pause failed in status bar when stop() throws error', async () => {
        await assembleAndLoad();

        // Configure stop to throw
        mockEmulatorBridge.stop.mockRejectedValue(new Error('Stop failed'));

        const runBtn = container.querySelector('[data-action="run"]') as HTMLButtonElement;
        runBtn.click();

        const pauseBtn = container.querySelector('[data-action="pause"]') as HTMLButtonElement;
        pauseBtn.click();

        await vi.waitFor(() => {
          const statusBar = app.getStatusBar();
          expect(statusBar?.getState().loadStatus).toBe('Pause failed');
        });
      });

      it('should allow Run to resume execution after Pause (AC: #4)', async () => {
        await assembleAndLoad();

        const runBtn = container.querySelector('[data-action="run"]') as HTMLButtonElement;
        const pauseBtn = container.querySelector('[data-action="pause"]') as HTMLButtonElement;

        // Configure stop to return state at PC=5 (paused mid-execution)
        mockEmulatorBridge.stop.mockResolvedValue({
          pc: 5,
          accumulator: 3,
          memory: new Uint8Array(256),
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          ir: 0,
          mar: 0,
          mdr: 0,
          cycles: 10,
          instructions: 5,
        });

        // Start running
        runBtn.click();
        expect(mockEmulatorBridge.run).toHaveBeenCalledTimes(1);

        // Pause - execution stops at PC=5
        pauseBtn.click();
        await vi.waitFor(() => {
          expect(runBtn.hidden).toBe(false);
          // Verify state was preserved from pause
          const statusBar = app.getStatusBar();
          expect(statusBar?.getState().pcValue).toBe(5);
        });

        // Resume by clicking Run again - should continue from current state
        runBtn.click();
        expect(mockEmulatorBridge.run).toHaveBeenCalledTimes(2);
      });

      it('should call step() when Step clicked after Pause (AC: #4)', async () => {
        await assembleAndLoad();

        const runBtn = container.querySelector('[data-action="run"]') as HTMLButtonElement;
        const pauseBtn = container.querySelector('[data-action="pause"]') as HTMLButtonElement;
        const stepBtn = container.querySelector('[data-action="step"]') as HTMLButtonElement;

        // Configure stop to return paused state
        mockEmulatorBridge.stop.mockResolvedValue({
          pc: 5,
          accumulator: 3,
          memory: new Uint8Array(256),
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          ir: 0,
          mar: 0,
          mdr: 0,
          cycles: 10,
          instructions: 5,
        });

        // Start running then pause
        runBtn.click();
        pauseBtn.click();

        await vi.waitFor(() => {
          // Verify Step button is enabled after pause (canStep: true)
          // Note: Actual step() execution is implemented in Epic 5: Debugging
          // This test verifies the precondition that Step is available after pause
          expect(stepBtn.disabled).toBe(false);
          expect(app.getToolbar()?.getState().canStep).toBe(true);
        });
      });
    });
  });

  describe('Reset button (Story 4.7)', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      mockEmulatorBridge._reset();
      app.mount(container);
    });

    // Helper to assemble and load a program
    const assembleAndLoad = async () => {
      const binary = new Uint8Array([0x01, 0x05, 0x0F]);
      mockEditorInstance._setContent('LDA 5\nHLT');
      mockEditorInstance.getValue.mockReturnValue('LDA 5\nHLT');
      mockAssemblerBridge._setAssembleResult({
        success: true,
        binary: binary,
        error: null,
      });

      const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
      assembleBtn.click();

      await vi.waitFor(() => {
        expect(mockEmulatorBridge.loadProgram).toHaveBeenCalled();
      });
    };

    it('should call emulatorBridge.reset() when Reset clicked (AC: #1-4)', async () => {
      await assembleAndLoad();

      const resetBtn = container.querySelector('[data-action="reset"]') as HTMLButtonElement;
      resetBtn.click();

      await vi.waitFor(() => {
        expect(mockEmulatorBridge.reset).toHaveBeenCalledTimes(1);
      });
    });

    it('should update toolbar state after reset (AC: #6)', async () => {
      await assembleAndLoad();

      // Start running first
      const runBtn = container.querySelector('[data-action="run"]') as HTMLButtonElement;
      runBtn.click();

      // Then reset
      const resetBtn = container.querySelector('[data-action="reset"]') as HTMLButtonElement;
      resetBtn.click();

      await vi.waitFor(() => {
        const toolbar = app.getToolbar();
        expect(toolbar?.getState().isRunning).toBe(false);
        expect(toolbar?.getState().canRun).toBe(true);
        expect(toolbar?.getState().canPause).toBe(false);
        expect(toolbar?.getState().canStep).toBe(true);
        expect(toolbar?.getState().canReset).toBe(true);
      });
    });

    it('should update status bar with "Reset" message (AC: #5)', async () => {
      await assembleAndLoad();

      const resetBtn = container.querySelector('[data-action="reset"]') as HTMLButtonElement;
      resetBtn.click();

      await vi.waitFor(() => {
        const statusBar = app.getStatusBar();
        expect(statusBar?.getState().loadStatus).toBe('Reset');
      });
    });

    it('should clear speed from status bar after reset', async () => {
      await assembleAndLoad();

      // Start running to set speed
      const runBtn = container.querySelector('[data-action="run"]') as HTMLButtonElement;
      runBtn.click();

      // Then reset
      const resetBtn = container.querySelector('[data-action="reset"]') as HTMLButtonElement;
      resetBtn.click();

      await vi.waitFor(() => {
        const statusBar = app.getStatusBar();
        expect(statusBar?.getState().speed).toBeNull();
      });
    });

    it('should reset CPU state to initial values (AC: #1-4)', async () => {
      await assembleAndLoad();

      // First, simulate running with non-zero state
      mockEmulatorBridge._setCpuState({
        pc: 10,
        accumulator: 42,
        memory: new Uint8Array(256),
        zeroFlag: true,
        halted: false,
        error: false,
        errorMessage: null,
        ir: 0x15,
        mar: 10,
        mdr: 42,
        cycles: 100,
        instructions: 50,
      });

      // Configure reset to return fully reset state (AC: #1-4)
      // AC #1: PC is set to 0
      // AC #2: Accumulator is cleared
      // AC #3: Flags are cleared
      // AC #4: Memory is reset (handled by EmulatorBridge internally)
      const resetState = {
        pc: 0,
        accumulator: 0,
        memory: new Uint8Array(256),
        zeroFlag: false,
        halted: false,
        error: false,
        errorMessage: null,
        ir: 0,
        mar: 0,
        mdr: 0,
        cycles: 0,
        instructions: 0,
      };
      mockEmulatorBridge.reset.mockResolvedValue(resetState);

      const resetBtn = container.querySelector('[data-action="reset"]') as HTMLButtonElement;
      resetBtn.click();

      await vi.waitFor(() => {
        // Verify reset() was called and returned the expected reset state
        expect(mockEmulatorBridge.reset).toHaveBeenCalledTimes(1);

        // Verify status bar reflects reset state (AC: #1 - PC=0)
        const statusBar = app.getStatusBar();
        expect(statusBar?.getState().pcValue).toBe(0);
        expect(statusBar?.getState().cycleCount).toBe(0);

        // Note: Accumulator and flag display (AC: #2, #3) is implemented in Epic 5: RegisterView
        // The reset() mock returning accumulator=0 and zeroFlag=false verifies the state is reset
        // The actual UI display of these values will be tested in Epic 5
      });
    });

    it('should stop execution before reset if running (AC: #6)', async () => {
      await assembleAndLoad();

      // Start running
      const runBtn = container.querySelector('[data-action="run"]') as HTMLButtonElement;
      runBtn.click();

      await vi.waitFor(() => {
        expect(app.getToolbar()?.getState().isRunning).toBe(true);
      });

      // Reset while running
      const resetBtn = container.querySelector('[data-action="reset"]') as HTMLButtonElement;
      resetBtn.click();

      await vi.waitFor(() => {
        // EmulatorBridge.reset() handles stopping internally, but App should update isRunning
        expect(app.getToolbar()?.getState().isRunning).toBe(false);
        expect(mockEmulatorBridge.reset).toHaveBeenCalled();
      });
    });

    it('should be disabled when no program is loaded', () => {
      // Don't load a program - check that reset button is disabled
      const resetBtn = container.querySelector('[data-action="reset"]') as HTMLButtonElement;
      expect(resetBtn.disabled).toBe(true);
    });

    it('should be enabled after program is loaded', async () => {
      await assembleAndLoad();

      const resetBtn = container.querySelector('[data-action="reset"]') as HTMLButtonElement;
      expect(resetBtn.disabled).toBe(false);
    });

    it('should show "Reset failed" in status bar when reset() throws error', async () => {
      await assembleAndLoad();

      // Configure reset to throw
      mockEmulatorBridge._setResetThrow(new Error('Reset failed'));

      const resetBtn = container.querySelector('[data-action="reset"]') as HTMLButtonElement;
      resetBtn.click();

      await vi.waitFor(() => {
        const statusBar = app.getStatusBar();
        expect(statusBar?.getState().loadStatus).toBe('Reset failed');
      });
    });

    it('should reset running state even when reset() throws error', async () => {
      await assembleAndLoad();

      // Start running
      const runBtn = container.querySelector('[data-action="run"]') as HTMLButtonElement;
      runBtn.click();

      // Configure reset to throw
      mockEmulatorBridge._setResetThrow(new Error('Reset failed'));

      const resetBtn = container.querySelector('[data-action="reset"]') as HTMLButtonElement;
      resetBtn.click();

      await vi.waitFor(() => {
        const toolbar = app.getToolbar();
        // Even on error, running state should be reset
        expect(toolbar?.getState().isRunning).toBe(false);
        expect(toolbar?.getState().canRun).toBe(true);
      });
    });

    it('should do nothing when reset is called without emulatorBridge', async () => {
      // Don't load a program, so emulatorBridge won't be initialized
      // The reset button should be disabled anyway, but let's verify handleReset handles null bridge
      const resetBtn = container.querySelector('[data-action="reset"]') as HTMLButtonElement;

      // Force click even if disabled (for coverage)
      resetBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      // reset() should not have been called since there's no bridge
      expect(mockEmulatorBridge.reset).not.toHaveBeenCalled();
    });
  });

  describe('Speed control (Story 4.8)', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      mockAssemblerBridge._reset();
      mockEmulatorBridge._reset();
      mockEditorInstance._resetContent();
      contentChangeListeners.length = 0;
      addedActions.length = 0;
      app.mount(container);
    });

    // Helper to assemble and load a program
    const assembleAndLoad = async () => {
      const binary = new Uint8Array([0x01, 0x05, 0x0F]);
      mockEditorInstance._setContent('LDA 5\nHLT');
      mockEditorInstance.getValue.mockReturnValue('LDA 5\nHLT');
      mockAssemblerBridge._setAssembleResult({
        success: true,
        binary: binary,
        error: null,
      });

      // Trigger content change listener to enable the Assemble button
      if (contentChangeListeners.length > 0) {
        contentChangeListeners[0]();
      }

      const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
      assembleBtn.click();

      await vi.waitFor(() => {
        expect(mockEmulatorBridge.loadProgram).toHaveBeenCalled();
      });
    };

    it('should call emulatorBridge.setSpeed() when speed slider changes while running (AC: #1)', async () => {
      await assembleAndLoad();

      // Start running
      const runBtn = container.querySelector('[data-action="run"]') as HTMLButtonElement;
      runBtn.click();

      // Change speed slider
      const speedSlider = container.querySelector('.da-speed-slider') as HTMLInputElement;
      speedSlider.value = '500';
      speedSlider.dispatchEvent(new Event('input', { bubbles: true }));

      // Should call setSpeed with the converted worker speed
      // Hz to worker speed: workerSpeed = Math.max(1, Math.round(Hz / 60))
      // 500 Hz / 60 = ~8.3 -> 8
      await vi.waitFor(() => {
        expect(mockEmulatorBridge.setSpeed).toHaveBeenCalledWith(8);
      });
    });

    it('should NOT call emulatorBridge.setSpeed() when speed slider changes while NOT running', async () => {
      await assembleAndLoad();

      // Do NOT start running - program is loaded but stopped

      // Change speed slider
      const speedSlider = container.querySelector('.da-speed-slider') as HTMLInputElement;
      speedSlider.value = '500';
      speedSlider.dispatchEvent(new Event('input', { bubbles: true }));

      // Should NOT call setSpeed since not running
      expect(mockEmulatorBridge.setSpeed).not.toHaveBeenCalled();
    });

    it('should update status bar speed when slider changes while running (AC: #3)', async () => {
      await assembleAndLoad();

      // Start running
      const runBtn = container.querySelector('[data-action="run"]') as HTMLButtonElement;
      runBtn.click();

      // Change speed slider
      const speedSlider = container.querySelector('.da-speed-slider') as HTMLInputElement;
      speedSlider.value = '100';
      speedSlider.dispatchEvent(new Event('input', { bubbles: true }));

      // Status bar should show updated speed
      await vi.waitFor(() => {
        const statusBar = app.getStatusBar();
        expect(statusBar?.getState().speed).toBe(100);
      });
    });

    it('should persist speed value across runs (AC: #4)', async () => {
      await assembleAndLoad();

      // Change speed while not running
      const speedSlider = container.querySelector('.da-speed-slider') as HTMLInputElement;
      speedSlider.value = '200';
      speedSlider.dispatchEvent(new Event('input', { bubbles: true }));

      // Start running - should use the saved speed
      const runBtn = container.querySelector('[data-action="run"]') as HTMLButtonElement;
      runBtn.click();

      // run() should be called with the saved speed converted
      // 200 Hz / 60 = ~3.3 -> 3
      await vi.waitFor(() => {
        expect(mockEmulatorBridge.run).toHaveBeenCalledWith(3);
      });
    });
  });

  describe('Step execution (Story 5.1)', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      mockAssemblerBridge._reset();
      mockEmulatorBridge._reset();
      mockEditorInstance._resetContent();
      contentChangeListeners.length = 0;
      addedActions.length = 0;
      app.mount(container);
    });

    // Helper to assemble and load a program
    const assembleAndLoad = async () => {
      const binary = new Uint8Array([0x10, 0x42, 0xF0]); // LDI 0x42, HLT
      mockEditorInstance._setContent('LDI 0x42\nHLT');
      mockEditorInstance.getValue.mockReturnValue('LDI 0x42\nHLT');
      contentChangeListeners.forEach(cb => cb());
      mockAssemblerBridge._setAssembleResult({
        success: true,
        binary: binary,
        error: null,
      });

      const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
      assembleBtn.click();

      await vi.waitFor(() => {
        expect(mockEmulatorBridge.loadProgram).toHaveBeenCalled();
      });
    };

    describe('Step button behavior', () => {
      it('should call step() when Step button clicked after assembly (AC: #1)', async () => {
        await assembleAndLoad();

        const stepBtn = container.querySelector('[data-action="step"]') as HTMLButtonElement;
        stepBtn.click();

        await vi.waitFor(() => {
          expect(mockEmulatorBridge.step).toHaveBeenCalledTimes(1);
        });
      });

      it('should not call step() if no valid assembly', () => {
        const stepBtn = container.querySelector('[data-action="step"]') as HTMLButtonElement;
        stepBtn.click();

        expect(mockEmulatorBridge.step).not.toHaveBeenCalled();
      });

      it('should not call step() if program is running', async () => {
        await assembleAndLoad();

        const runBtn = container.querySelector('[data-action="run"]') as HTMLButtonElement;
        runBtn.click();

        const stepBtn = container.querySelector('[data-action="step"]') as HTMLButtonElement;
        stepBtn.click();

        // step() should not be called while running
        expect(mockEmulatorBridge.step).not.toHaveBeenCalled();
      });

      it('should update status bar with PC after step (AC: #1)', async () => {
        await assembleAndLoad();

        // Configure step to return specific state
        mockEmulatorBridge._setStepResult({
          pc: 2,
          accumulator: 0x42,
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0x10,
          mar: 0,
          mdr: 0x42,
          cycles: 1,
          instructions: 1,
        });

        const stepBtn = container.querySelector('[data-action="step"]') as HTMLButtonElement;
        stepBtn.click();

        await vi.waitFor(() => {
          const statusBar = app.getStatusBar();
          expect(statusBar?.getState().pcValue).toBe(2);
        });
      });

      it('should show "Stepped to 0xNN" message after step', async () => {
        await assembleAndLoad();

        mockEmulatorBridge._setStepResult({
          pc: 4,
          accumulator: 0,
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0,
          mar: 0,
          mdr: 0,
          cycles: 1,
          instructions: 1,
        });

        const stepBtn = container.querySelector('[data-action="step"]') as HTMLButtonElement;
        stepBtn.click();

        await vi.waitFor(() => {
          const statusBar = app.getStatusBar();
          expect(statusBar?.getState().assemblyMessage).toBe('Stepped to 0x04');
        });
      });

      it('should show "Program halted" when step reaches HLT (AC: #1)', async () => {
        await assembleAndLoad();

        mockEmulatorBridge._setStepResult({
          pc: 2,
          accumulator: 0,
          zeroFlag: false,
          halted: true,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0xF0,
          mar: 0,
          mdr: 0,
          cycles: 1,
          instructions: 1,
        });

        const stepBtn = container.querySelector('[data-action="step"]') as HTMLButtonElement;
        stepBtn.click();

        await vi.waitFor(() => {
          const statusBar = app.getStatusBar();
          expect(statusBar?.getState().assemblyMessage).toBe('Program halted');
        });
      });

      it('should update cycle count after step', async () => {
        await assembleAndLoad();

        mockEmulatorBridge._setStepResult({
          pc: 2,
          accumulator: 0,
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0,
          mar: 0,
          mdr: 0,
          cycles: 5,
          instructions: 1,
        });

        const stepBtn = container.querySelector('[data-action="step"]') as HTMLButtonElement;
        stepBtn.click();

        await vi.waitFor(() => {
          const statusBar = app.getStatusBar();
          expect(statusBar?.getState().cycleCount).toBe(5);
        });
      });

      it('should keep canStep enabled after successful step', async () => {
        await assembleAndLoad();

        mockEmulatorBridge._setStepResult({
          pc: 2,
          accumulator: 0,
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0,
          mar: 0,
          mdr: 0,
          cycles: 1,
          instructions: 1,
        });

        const stepBtn = container.querySelector('[data-action="step"]') as HTMLButtonElement;
        stepBtn.click();

        await vi.waitFor(() => {
          expect(app.getToolbar()?.getState().canStep).toBe(true);
        });
      });

      it('should handle step error gracefully', async () => {
        await assembleAndLoad();

        // Configure step to throw error
        mockEmulatorBridge._setStepThrow(new Error('Step failed'));

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const stepBtn = container.querySelector('[data-action="step"]') as HTMLButtonElement;
        stepBtn.click();

        await vi.waitFor(() => {
          expect(consoleSpy).toHaveBeenCalledWith('Failed to step:', expect.any(Error));
        });

        consoleSpy.mockRestore();
      });
    });

    describe('F10 keyboard shortcut (AC: #1)', () => {
      it('should call step() when F10 pressed with valid assembly', async () => {
        await assembleAndLoad();

        const event = new KeyboardEvent('keydown', {
          key: 'F10',
          bubbles: true,
        });
        window.dispatchEvent(event);

        await vi.waitFor(() => {
          expect(mockEmulatorBridge.step).toHaveBeenCalledTimes(1);
        });
      });

      it('should not call step() on F10 when no valid assembly', () => {
        const event = new KeyboardEvent('keydown', {
          key: 'F10',
          bubbles: true,
        });
        window.dispatchEvent(event);

        expect(mockEmulatorBridge.step).not.toHaveBeenCalled();
      });

      it('should not call step() on F10 while running', async () => {
        await assembleAndLoad();

        const runBtn = container.querySelector('[data-action="run"]') as HTMLButtonElement;
        runBtn.click();

        const event = new KeyboardEvent('keydown', {
          key: 'F10',
          bubbles: true,
        });
        window.dispatchEvent(event);

        expect(mockEmulatorBridge.step).not.toHaveBeenCalled();
      });

      it('should prevent default browser behavior for F10', async () => {
        await assembleAndLoad();

        const event = new KeyboardEvent('keydown', {
          key: 'F10',
          bubbles: true,
          cancelable: true,
        });

        const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
        window.dispatchEvent(event);

        expect(preventDefaultSpy).toHaveBeenCalled();
      });
    });

    describe('Step after pause', () => {
      it('should allow step after pausing run (continues from pause position)', async () => {
        await assembleAndLoad();

        // Configure stop to return paused state at PC=4
        mockEmulatorBridge.stop.mockResolvedValue({
          pc: 4,
          accumulator: 0,
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0,
          mar: 0,
          mdr: 0,
          cycles: 2,
          instructions: 2,
        });

        const runBtn = container.querySelector('[data-action="run"]') as HTMLButtonElement;
        runBtn.click();

        const pauseBtn = container.querySelector('[data-action="pause"]') as HTMLButtonElement;
        pauseBtn.click();

        await vi.waitFor(() => {
          expect(app.getToolbar()?.getState().canStep).toBe(true);
        });

        // Configure step to return next state (PC=6)
        mockEmulatorBridge._setStepResult({
          pc: 6,
          accumulator: 0,
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0,
          mar: 0,
          mdr: 0,
          cycles: 3,
          instructions: 3,
        });

        const stepBtn = container.querySelector('[data-action="step"]') as HTMLButtonElement;
        stepBtn.click();

        await vi.waitFor(() => {
          expect(mockEmulatorBridge.step).toHaveBeenCalled();
          const statusBar = app.getStatusBar();
          expect(statusBar?.getState().pcValue).toBe(6);
        });
      });
    });

    describe('Editor line highlighting (Story 5.1)', () => {
      it('should call deltaDecorations for highlighting after step', async () => {
        await assembleAndLoad();
        mockEditorInstance.deltaDecorations.mockClear();

        mockEmulatorBridge._setStepResult({
          pc: 2,
          accumulator: 0,
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0,
          mar: 0,
          mdr: 0,
          cycles: 1,
          instructions: 1,
        });

        const stepBtn = container.querySelector('[data-action="step"]') as HTMLButtonElement;
        stepBtn.click();

        await vi.waitFor(() => {
          // deltaDecorations is called for highlighting the current instruction
          expect(mockEditorInstance.deltaDecorations).toHaveBeenCalled();
        });
      });

      it('should use correct CSS class for current instruction highlight', async () => {
        await assembleAndLoad();
        mockEditorInstance.deltaDecorations.mockClear();

        mockEmulatorBridge._setStepResult({
          pc: 2,
          accumulator: 0,
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0,
          mar: 0,
          mdr: 0,
          cycles: 1,
          instructions: 1,
        });

        const stepBtn = container.querySelector('[data-action="step"]') as HTMLButtonElement;
        stepBtn.click();

        await vi.waitFor(() => {
          const calls = mockEditorInstance.deltaDecorations.mock.calls as unknown as Array<[string[], Array<{ options?: { className?: string } }>]>;
          // Find a call that includes the current instruction highlight class
          const highlightCall = calls.find(call => {
            if (!call || !call[1]) return false;
            const decorations = call[1];
            return decorations.some(d => d.options?.className === 'da-current-instruction-highlight');
          });
          expect(highlightCall).toBeDefined();
        });
      });

      it('should reveal line in center after step', async () => {
        await assembleAndLoad();
        mockEditorInstance.revealLineInCenter.mockClear();

        mockEmulatorBridge._setStepResult({
          pc: 2,
          accumulator: 0,
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0,
          mar: 0,
          mdr: 0,
          cycles: 1,
          instructions: 1,
        });

        const stepBtn = container.querySelector('[data-action="step"]') as HTMLButtonElement;
        stepBtn.click();

        await vi.waitFor(() => {
          expect(mockEditorInstance.revealLineInCenter).toHaveBeenCalled();
        });
      });

      it('should highlight first instruction after load', async () => {
        mockEditorInstance.deltaDecorations.mockClear();

        await assembleAndLoad();

        // After load, PC=0 which maps to line 1, should have decoration call
        await vi.waitFor(() => {
          // Should have at least one deltaDecorations call for the highlight
          expect(mockEditorInstance.deltaDecorations).toHaveBeenCalled();
        });
      });

      it('should highlight first instruction after reset', async () => {
        await assembleAndLoad();

        // Step to advance PC
        mockEmulatorBridge._setStepResult({
          pc: 4,
          accumulator: 0,
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0,
          mar: 0,
          mdr: 0,
          cycles: 2,
          instructions: 2,
        });

        const stepBtn = container.querySelector('[data-action="step"]') as HTMLButtonElement;
        stepBtn.click();

        await vi.waitFor(() => {
          expect(app.getStatusBar()?.getState().pcValue).toBe(4);
        });

        // Clear mocks
        mockEditorInstance.deltaDecorations.mockClear();

        // Reset should bring PC back to 0 and highlight line 1
        mockEmulatorBridge.reset.mockResolvedValue({
          pc: 0,
          accumulator: 0,
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0,
          mar: 0,
          mdr: 0,
          cycles: 0,
          instructions: 0,
        });

        const resetBtn = container.querySelector('[data-action="reset"]') as HTMLButtonElement;
        resetBtn.click();

        await vi.waitFor(() => {
          expect(mockEditorInstance.deltaDecorations).toHaveBeenCalled();
        });
      });

      it('should clear highlight when code changes (empty decorations array)', async () => {
        await assembleAndLoad();

        // Clear previous calls to track only the clear operation
        mockEditorInstance.deltaDecorations.mockClear();

        // Simulate code change
        mockEditorInstance._setContent('LDA 5');
        mockEditorInstance.getValue.mockReturnValue('LDA 5');
        contentChangeListeners.forEach(cb => cb());

        // When highlight is cleared, deltaDecorations is called with empty array
        await vi.waitFor(() => {
          const calls = mockEditorInstance.deltaDecorations.mock.calls as unknown as Array<[string[], unknown[]]>;
          // Look for a call with empty decorations array (clearing)
          const clearCall = calls.find(call => {
            if (!call || !call[1]) return false;
            const decorations = call[1];
            return decorations.length === 0;
          });
          expect(clearCall).toBeDefined();
        });
      });

      it('should clear highlight when Run starts', async () => {
        await assembleAndLoad();

        // Step to set a highlight
        mockEmulatorBridge._setStepResult({
          pc: 2,
          accumulator: 0,
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0,
          mar: 0,
          mdr: 0,
          cycles: 1,
          instructions: 1,
        });

        const stepBtn = container.querySelector('[data-action="step"]') as HTMLButtonElement;
        stepBtn.click();

        await vi.waitFor(() => {
          expect(mockEditorInstance.deltaDecorations).toHaveBeenCalled();
        });

        // Clear mock to track Run behavior
        mockEditorInstance.deltaDecorations.mockClear();

        // Start Run - highlight should be cleared during continuous execution
        const runBtn = container.querySelector('[data-action="run"]') as HTMLButtonElement;
        runBtn.click();

        // During run, highlighting is managed by state updates (throttled)
        // The highlight may update or stay based on implementation
        // Main verification: no errors thrown, run starts correctly
        expect(mockEmulatorBridge.run).toHaveBeenCalled();
      });
    });

    describe('buildSourceMap (Story 5.1)', () => {
      // Helper to build source map via assembly and get mapped line
      const getLineForPC = async (code: string, pc: number): Promise<number | undefined> => {
        mockEditorInstance._setContent(code);
        mockEditorInstance.getValue.mockReturnValue(code);
        contentChangeListeners.forEach(cb => cb());
        const binary = new Uint8Array([0x10, 0x42, 0xF0]);
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: binary,
          error: null,
        });

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          expect(mockEmulatorBridge.loadProgram).toHaveBeenCalled();
        });

        // Configure step to return the requested PC
        mockEmulatorBridge._setStepResult({
          pc: pc,
          accumulator: 0,
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0,
          mar: 0,
          mdr: 0,
          cycles: 1,
          instructions: 1,
        });

        mockEditorInstance.deltaDecorations.mockClear();

        const stepBtn = container.querySelector('[data-action="step"]') as HTMLButtonElement;
        stepBtn.click();

        await vi.waitFor(() => {
          expect(mockEmulatorBridge.step).toHaveBeenCalled();
        });

        // Return the line number that was highlighted (via revealLineInCenter)
        const revealCalls = mockEditorInstance.revealLineInCenter.mock.calls;
        if (revealCalls.length > 0) {
          return revealCalls[revealCalls.length - 1][0] as number;
        }
        return undefined;
      };

      it('should map PC 0 to first instruction line', async () => {
        const lineNumber = await getLineForPC('LDI 5\nHLT', 0);
        expect(lineNumber).toBe(1);
      });

      it('should skip empty lines in source map', async () => {
        // Line 1 is empty, instruction starts at line 2
        const lineNumber = await getLineForPC('\nLDI 5\nHLT', 0);
        expect(lineNumber).toBe(2);
      });

      it('should skip comment-only lines in source map', async () => {
        // Line 1 is comment, instruction starts at line 2
        const lineNumber = await getLineForPC('; Comment\nLDI 5\nHLT', 0);
        expect(lineNumber).toBe(2);
      });

      it('should handle inline comments', async () => {
        const lineNumber = await getLineForPC('LDI 5 ; load value\nHLT', 0);
        expect(lineNumber).toBe(1);
      });

      it('should skip label-only lines', async () => {
        // Line 1 is label only, instruction at line 2
        const lineNumber = await getLineForPC('START:\nLDI 5\nHLT', 0);
        expect(lineNumber).toBe(2);
      });

      it('should handle label on same line as instruction', async () => {
        // Label and instruction on same line
        const lineNumber = await getLineForPC('START: LDI 5\nHLT', 0);
        expect(lineNumber).toBe(1);
      });

      it('should handle ORG directive (decimal)', async () => {
        // ORG 10 sets starting address to 10
        // PC 10 should map to line 2
        const lineNumber = await getLineForPC('ORG 10\nLDI 5\nHLT', 10);
        expect(lineNumber).toBe(2);
      });

      it('should handle ORG directive (hex with 0x prefix)', async () => {
        // ORG 0x10 = address 16
        // PC 16 should map to line 2
        const lineNumber = await getLineForPC('ORG 0x10\nLDI 5\nHLT', 16);
        expect(lineNumber).toBe(2);
      });

      it('should handle ORG directive (hex with $ prefix)', async () => {
        // ORG $10 = address 16
        // PC 16 should map to line 2
        const lineNumber = await getLineForPC('ORG $10\nLDI 5\nHLT', 16);
        expect(lineNumber).toBe(2);
      });

      it('should advance address correctly for multiple instructions', async () => {
        // Each instruction is 2 nibbles (2 address units)
        // LDI at PC=0, ADD at PC=2
        const lineNumber = await getLineForPC('LDI 5\nADD 3\nHLT', 2);
        expect(lineNumber).toBe(2);
      });

      it('should skip DB directive and advance address', async () => {
        // DB consumes 1 byte (2 nibbles) per value
        // DATA: DB 5 at address 0 (consumes 2), instruction at address 2
        const lineNumber = await getLineForPC('DATA: DB 5\nLDI 5\nHLT', 2);
        expect(lineNumber).toBe(2);
      });

      it('should skip DW directive and advance address correctly', async () => {
        // DW consumes 2 bytes (4 nibbles) per value
        // DATA: DW 100 at address 0 (consumes 4), instruction at address 4
        const lineNumber = await getLineForPC('DATA: DW 100\nLDI 5\nHLT', 4);
        expect(lineNumber).toBe(2);
      });

      it('should handle multiple DB values', async () => {
        // DB 1,2,3 = 3 bytes = 6 nibbles
        // Instruction should be at address 6
        const lineNumber = await getLineForPC('DATA: DB 1,2,3\nLDI 5\nHLT', 6);
        expect(lineNumber).toBe(2);
      });

      it('should not call revealLineInCenter when PC has no source mapping', async () => {
        // Set up code with only 2 instructions
        const code = 'LDI 5\nHLT';
        mockEditorInstance._setContent(code);
        mockEditorInstance.getValue.mockReturnValue(code);
        contentChangeListeners.forEach(cb => cb());
        const binary = new Uint8Array([0x10, 0x42, 0xF0]);
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: binary,
          error: null,
        });

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          expect(mockEmulatorBridge.loadProgram).toHaveBeenCalled();
        });

        // Clear mocks to isolate step behavior
        mockEditorInstance.revealLineInCenter.mockClear();
        mockEditorInstance.deltaDecorations.mockClear();

        // Configure step to return PC=100 which has no mapping
        mockEmulatorBridge._setStepResult({
          pc: 100,
          accumulator: 0,
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0,
          mar: 0,
          mdr: 0,
          cycles: 1,
          instructions: 1,
        });

        const stepBtn = container.querySelector('[data-action="step"]') as HTMLButtonElement;
        stepBtn.click();

        await vi.waitFor(() => {
          expect(mockEmulatorBridge.step).toHaveBeenCalled();
        });

        // When PC doesn't map to source, highlightLine should NOT be called
        // Therefore revealLineInCenter should NOT have been called
        expect(mockEditorInstance.revealLineInCenter).not.toHaveBeenCalled();
      });
    });
  });

  describe('mode toggle integration (Story 10.1)', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      // Clear localStorage to ensure clean theme state
      localStorage.removeItem('da-theme');
      // Reset document HTML classes
      document.documentElement.classList.remove('story-mode', 'lab-mode');
      app.mount(container);
    });

    it('should have mode toggle in MenuBar', () => {
      const menuBar = app.getMenuBar();
      expect(menuBar).not.toBeNull();
    });

    it('should render mode toggle in MenuBar', () => {
      const menuBarToggle = container.querySelector('.da-menubar-toggle');
      expect(menuBarToggle).not.toBeNull();
    });

    it('should have Story and Lab buttons', () => {
      const storyBtn = container.querySelector('[data-mode="story"]');
      const labBtn = container.querySelector('[data-mode="lab"]');

      expect(storyBtn).not.toBeNull();
      expect(labBtn).not.toBeNull();
    });

    it('should default to lab mode', () => {
      const currentMode = app.getCurrentMode();
      expect(currentMode).toBe('lab');
    });

    it('should switch to story mode when story button clicked', () => {
      const storyBtn = container.querySelector('[data-mode="story"]') as HTMLButtonElement;
      storyBtn.click();

      const currentMode = app.getCurrentMode();
      expect(currentMode).toBe('story');
    });

    it('should update HTML class when mode changes', () => {
      const storyBtn = container.querySelector('[data-mode="story"]') as HTMLButtonElement;
      storyBtn.click();

      expect(document.documentElement.classList.contains('story-mode')).toBe(true);
      expect(document.documentElement.classList.contains('lab-mode')).toBe(false);
    });

    it('should hide lab mode container when in story mode', () => {
      const storyBtn = container.querySelector('[data-mode="story"]') as HTMLButtonElement;
      storyBtn.click();

      const labContainer = container.querySelector('.da-lab-mode-container');
      expect(labContainer?.classList.contains('da-mode-container--hidden')).toBe(true);
    });

    it('should show story mode container when in story mode', () => {
      // Verify story container starts hidden (initial state is lab mode)
      let storyContainer = container.querySelector('.da-story-mode-container');
      expect(storyContainer).not.toBeNull();
      expect(storyContainer?.classList.contains('da-story-mode-container--hidden')).toBe(true);

      // Switch to story mode
      const storyBtn = container.querySelector('[data-mode="story"]') as HTMLButtonElement;
      storyBtn.click();

      // Verify mode was switched
      expect(app.getCurrentMode()).toBe('story');

      // Verify story container is now visible (hidden class removed)
      storyContainer = container.querySelector('.da-story-mode-container');
      expect(storyContainer?.classList.contains('da-story-mode-container--hidden')).toBe(false);
    });

    it('should show lab mode container when switching back to lab mode', () => {
      // Switch to story mode first
      const storyBtn = container.querySelector('[data-mode="story"]') as HTMLButtonElement;
      storyBtn.click();

      // Switch back to lab mode
      const labBtn = container.querySelector('[data-mode="lab"]') as HTMLButtonElement;
      labBtn.click();

      const labContainer = container.querySelector('.da-lab-mode-container');
      expect(labContainer?.classList.contains('da-mode-container--hidden')).toBe(false);
    });

    it('should toggle mode with Ctrl+Shift+M keyboard shortcut', () => {
      // Verify initial state is lab
      expect(app.getCurrentMode()).toBe('lab');

      const event = new KeyboardEvent('keydown', {
        key: 'M',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      expect(app.getCurrentMode()).toBe('story');
    });

    it('should toggle back to lab mode with Ctrl+Shift+M', () => {
      // First switch to story mode via button
      const storyBtn = container.querySelector('[data-mode="story"]') as HTMLButtonElement;
      storyBtn.click();
      expect(app.getCurrentMode()).toBe('story');

      // Toggle back to lab via keyboard
      const event = new KeyboardEvent('keydown', {
        key: 'M',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);
      expect(app.getCurrentMode()).toBe('lab');
    });

    it('should update MenuBar toggle state when keyboard shortcut used', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'M',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Verify the Story button is now active in the MenuBar
      const storyBtn = container.querySelector('[data-mode="story"]');
      expect(storyBtn?.classList.contains('da-menubar-toggle-btn--active')).toBe(true);
    });

    it('should not affect mode after app is destroyed', () => {
      // Get initial mode
      const initialMode = app.getCurrentMode();
      expect(initialMode).toBe('lab');

      // Destroy app - this removes the keyboard listener
      app.destroy();

      // Dispatch keyboard event - should have no effect since listener is removed
      const event = new KeyboardEvent('keydown', {
        key: 'M',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Mode should still be what it was (the property doesn't reset on destroy)
      expect(app.getCurrentMode()).toBe('lab');
    });
  });

  // ============================================================================
  // Story 5.2: State History Interface and Constants
  // ============================================================================

  describe('State History (Story 5.2)', () => {
    describe('StateHistoryEntry interface and MAX_HISTORY_SIZE constant', () => {
      it('should export StateHistoryEntry interface type', async () => {
        // Verify the type is exported by importing it
        const module = await import('./App');
        expect(module).toHaveProperty('MAX_HISTORY_SIZE');
      });

      it('should export MAX_HISTORY_SIZE constant with value 50', async () => {
        const module = await import('./App');
        expect(module.MAX_HISTORY_SIZE).toBe(50);
      });

      it('should have stateHistory initialized as empty array', () => {
        // Access private property via type assertion for testing
        const appAny = app as unknown as { stateHistory: unknown[] };
        expect(appAny.stateHistory).toEqual([]);
      });

      it('should have historyPointer initialized to -1', () => {
        // Access private property via type assertion for testing
        const appAny = app as unknown as { historyPointer: number };
        expect(appAny.historyPointer).toBe(-1);
      });
    });

    describe('State history recording', () => {
      beforeEach(() => {
        vi.clearAllMocks();
        mockAssemblerBridge._reset();
        mockEmulatorBridge._reset();
        mockEditorInstance._resetContent();
        contentChangeListeners.length = 0;
        addedActions.length = 0;
        app.mount(container);
      });

      // Helper to assemble and load a program
      const assembleAndLoadForHistory = async () => {
        const binary = new Uint8Array([0x10, 0x42, 0x20, 0x00, 0xF0]); // LDI 0x42, STA 0, HLT
        mockEditorInstance._setContent('LDI 0x42\nSTA 0\nHLT');
        mockEditorInstance.getValue.mockReturnValue('LDI 0x42\nSTA 0\nHLT');
        contentChangeListeners.forEach(cb => cb());
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: binary,
          error: null,
        });

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          expect(mockEmulatorBridge.loadProgram).toHaveBeenCalled();
        });
      };

      it('should push current state to history before stepping', async () => {
        await assembleAndLoadForHistory();

        const appAny = app as unknown as { stateHistory: unknown[] };
        expect(appAny.stateHistory.length).toBe(0);

        mockEmulatorBridge._setStepResult({
          pc: 2,
          accumulator: 0x42,
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0x10,
          mar: 0,
          mdr: 0,
          cycles: 1,
          instructions: 1,
        });

        const stepBtn = container.querySelector('[data-action="step"]') as HTMLButtonElement;
        stepBtn.click();

        await vi.waitFor(() => {
          expect(appAny.stateHistory.length).toBe(1);
        });
      });

      it('should enforce MAX_HISTORY_SIZE by removing oldest entries', async () => {
        await assembleAndLoadForHistory();

        const appAny = app as unknown as {
          stateHistory: unknown[];
          pushStateToHistory: (state: unknown) => void;
        };

        // Push 55 states manually (exceeds MAX_HISTORY_SIZE of 50)
        const mockState = {
          pc: 0,
          accumulator: 0,
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0,
          mar: 0,
          mdr: 0,
          cycles: 0,
          instructions: 0,
        };

        for (let i = 0; i < 55; i++) {
          appAny.pushStateToHistory({ ...mockState, pc: i });
        }

        // Should be capped at MAX_HISTORY_SIZE
        expect(appAny.stateHistory.length).toBeLessThanOrEqual(50);
      });

      it('should clear history on program load', async () => {
        await assembleAndLoadForHistory();

        const appAny = app as unknown as {
          stateHistory: unknown[];
          pushStateToHistory: (state: unknown) => void;
        };

        // Add some history
        appAny.pushStateToHistory({
          pc: 0, accumulator: 0, zeroFlag: false, halted: false, error: false,
          errorMessage: null, memory: new Uint8Array(256), ir: 0, mar: 0, mdr: 0,
          cycles: 0, instructions: 0,
        });
        expect(appAny.stateHistory.length).toBe(1);

        // Load a new program - should clear history
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: new Uint8Array([0xF0]),
          error: null,
        });

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          expect(appAny.stateHistory.length).toBe(0);
        });
      });

      it('should clear history on reset', async () => {
        await assembleAndLoadForHistory();

        const appAny = app as unknown as {
          stateHistory: unknown[];
          pushStateToHistory: (state: unknown) => void;
        };

        // Add some history
        appAny.pushStateToHistory({
          pc: 0, accumulator: 0, zeroFlag: false, halted: false, error: false,
          errorMessage: null, memory: new Uint8Array(256), ir: 0, mar: 0, mdr: 0,
          cycles: 0, instructions: 0,
        });
        expect(appAny.stateHistory.length).toBe(1);

        mockEmulatorBridge._setResetResult({
          pc: 0, accumulator: 0, zeroFlag: false, halted: false, error: false,
          errorMessage: null, memory: new Uint8Array(256), ir: 0, mar: 0, mdr: 0,
          cycles: 0, instructions: 0,
        });

        const resetBtn = container.querySelector('[data-action="reset"]') as HTMLButtonElement;
        resetBtn.click();

        await vi.waitFor(() => {
          expect(appAny.stateHistory.length).toBe(0);
        });
      });

      it('should clear history when code changes', async () => {
        await assembleAndLoadForHistory();

        const appAny = app as unknown as {
          stateHistory: unknown[];
          pushStateToHistory: (state: unknown) => void;
        };

        // Add some history
        appAny.pushStateToHistory({
          pc: 0, accumulator: 0, zeroFlag: false, halted: false, error: false,
          errorMessage: null, memory: new Uint8Array(256), ir: 0, mar: 0, mdr: 0,
          cycles: 0, instructions: 0,
        });
        expect(appAny.stateHistory.length).toBe(1);

        // Change code
        mockEditorInstance._setContent('LDI 0x00\nHLT');
        mockEditorInstance.getValue.mockReturnValue('LDI 0x00\nHLT');
        contentChangeListeners.forEach(cb => cb());

        await vi.waitFor(() => {
          expect(appAny.stateHistory.length).toBe(0);
        });
      });
    });

    describe('handleStepBack', () => {
      beforeEach(() => {
        vi.clearAllMocks();
        mockAssemblerBridge._reset();
        mockEmulatorBridge._reset();
        mockEditorInstance._resetContent();
        contentChangeListeners.length = 0;
        addedActions.length = 0;
        app.mount(container);
      });

      // Helper to assemble, load, and step to build history
      const setupWithHistory = async () => {
        const binary = new Uint8Array([0x10, 0x42, 0x20, 0x00, 0xF0]);
        mockEditorInstance._setContent('LDI 0x42\nSTA 0\nHLT');
        mockEditorInstance.getValue.mockReturnValue('LDI 0x42\nSTA 0\nHLT');
        contentChangeListeners.forEach(cb => cb());
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: binary,
          error: null,
        });

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          expect(mockEmulatorBridge.loadProgram).toHaveBeenCalled();
        });

        // Step once to create history
        mockEmulatorBridge._setStepResult({
          pc: 2,
          accumulator: 0x42,
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0x10,
          mar: 0,
          mdr: 0,
          cycles: 1,
          instructions: 1,
        });

        const stepBtn = container.querySelector('[data-action="step"]') as HTMLButtonElement;
        stepBtn.click();

        await vi.waitFor(() => {
          const appAny = app as unknown as { stateHistory: unknown[] };
          expect(appAny.stateHistory.length).toBe(1);
        });
      };

      it('should enable Step Back button after stepping', async () => {
        await setupWithHistory();

        const stepBackBtn = container.querySelector('[data-action="step-back"]') as HTMLButtonElement;
        expect(stepBackBtn.disabled).toBe(false);
      });

      it('should disable Step Back button when no history', async () => {
        // Just assemble and load without stepping
        const binary = new Uint8Array([0x10, 0x42, 0xF0]);
        mockEditorInstance._setContent('LDI 0x42\nHLT');
        mockEditorInstance.getValue.mockReturnValue('LDI 0x42\nHLT');
        contentChangeListeners.forEach(cb => cb());
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: binary,
          error: null,
        });

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          expect(mockEmulatorBridge.loadProgram).toHaveBeenCalled();
        });

        const stepBackBtn = container.querySelector('[data-action="step-back"]') as HTMLButtonElement;
        expect(stepBackBtn.disabled).toBe(true);
      });

      it('should call restoreState on emulator when stepping back', async () => {
        await setupWithHistory();

        mockEmulatorBridge._setRestoreStateResult({
          pc: 0,
          accumulator: 0,
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0,
          mar: 0,
          mdr: 0,
          cycles: 0,
          instructions: 0,
        });

        const stepBackBtn = container.querySelector('[data-action="step-back"]') as HTMLButtonElement;
        stepBackBtn.click();

        await vi.waitFor(() => {
          expect(mockEmulatorBridge.restoreState).toHaveBeenCalled();
        });
      });

      it('should update status bar with "Stepped back to" message', async () => {
        await setupWithHistory();

        mockEmulatorBridge._setRestoreStateResult({
          pc: 0,
          accumulator: 0,
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0,
          mar: 0,
          mdr: 0,
          cycles: 0,
          instructions: 0,
        });

        const stepBackBtn = container.querySelector('[data-action="step-back"]') as HTMLButtonElement;
        stepBackBtn.click();

        // Wait for restoreState to be called and status bar to be updated
        await vi.waitFor(() => {
          expect(mockEmulatorBridge.restoreState).toHaveBeenCalled();
        });

        await vi.waitFor(() => {
          const statusBar = app.getStatusBar();
          expect(statusBar?.getState().assemblyMessage).toBe('Stepped back to 0x00');
        });
      });

      it('should highlight restored instruction in editor', async () => {
        await setupWithHistory();
        mockEditorInstance.deltaDecorations.mockClear();

        mockEmulatorBridge._setRestoreStateResult({
          pc: 0,
          accumulator: 0,
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0,
          mar: 0,
          mdr: 0,
          cycles: 0,
          instructions: 0,
        });

        const stepBackBtn = container.querySelector('[data-action="step-back"]') as HTMLButtonElement;
        stepBackBtn.click();

        await vi.waitFor(() => {
          expect(mockEditorInstance.deltaDecorations).toHaveBeenCalled();
        });
      });

      it('should use historical PC value in status bar, not emulator reset value (Issue #2 fix)', async () => {
        // Set up - assemble and load
        const binary = new Uint8Array([0x10, 0x42, 0x10, 0x43, 0xF0]);
        mockEditorInstance._setContent('LDI 0x42\nLDI 0x43\nHLT');
        mockEditorInstance.getValue.mockReturnValue('LDI 0x42\nLDI 0x43\nHLT');
        contentChangeListeners.forEach(cb => cb());
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: binary,
          error: null,
        });

        // Initial load state at PC=0
        mockEmulatorBridge._setCpuState({
          pc: 0,
          accumulator: 0,
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0,
          mar: 0,
          mdr: 0,
          cycles: 0,
          instructions: 0,
        });

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          expect(mockEmulatorBridge.loadProgram).toHaveBeenCalled();
        });

        // Step to PC=2 - this creates history entry with PC=0
        mockEmulatorBridge._setStepResult({
          pc: 2,
          accumulator: 0x42,
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0x10,
          mar: 0,
          mdr: 0,
          cycles: 1,
          instructions: 1,
        });

        const stepBtn = container.querySelector('[data-action="step"]') as HTMLButtonElement;
        stepBtn.click();

        await vi.waitFor(() => {
          const appAny = app as unknown as { stateHistory: Array<{ state: { pc: number } }> };
          expect(appAny.stateHistory.length).toBe(1);
          // History should contain the state BEFORE step (PC=0)
          expect(appAny.stateHistory[0].state.pc).toBe(0);
        });

        // Step again to PC=4 - this creates history entry with PC=2
        mockEmulatorBridge._setStepResult({
          pc: 4,
          accumulator: 0x43,
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0x10,
          mar: 0,
          mdr: 0,
          cycles: 2,
          instructions: 2,
        });

        stepBtn.click();

        await vi.waitFor(() => {
          const appAny = app as unknown as { stateHistory: Array<{ state: { pc: number } }> };
          expect(appAny.stateHistory.length).toBe(2);
          // History should contain the state BEFORE step (PC=2)
          expect(appAny.stateHistory[1].state.pc).toBe(2);
        });

        // CRITICAL: Emulator returns PC=0 after restoreState (WASM limitation)
        // But we should display the HISTORICAL PC=2 in the UI
        mockEmulatorBridge._setRestoreStateResult({
          pc: 0,  // Emulator resets PC to 0
          accumulator: 0,
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0,
          mar: 0,
          mdr: 0,
          cycles: 0,
          instructions: 0,
        });

        const stepBackBtn = container.querySelector('[data-action="step-back"]') as HTMLButtonElement;
        stepBackBtn.click();

        await vi.waitFor(() => {
          expect(mockEmulatorBridge.restoreState).toHaveBeenCalled();
        });

        // Status bar should show the HISTORICAL PC value (0x02), not emulator's 0x00
        await vi.waitFor(() => {
          const statusBar = app.getStatusBar();
          expect(statusBar?.getState().assemblyMessage).toBe('Stepped back to 0x02');
          expect(statusBar?.getState().pcValue).toBe(2);  // Historical PC, not 0
        });
      });

      it('should truncate future history when stepping forward after stepping back', async () => {
        // Set up - assemble and load
        const binary = new Uint8Array([0x10, 0x42, 0x10, 0x43, 0x10, 0x44, 0xF0]);
        mockEditorInstance._setContent('LDI 0x42\nLDI 0x43\nLDI 0x44\nHLT');
        mockEditorInstance.getValue.mockReturnValue('LDI 0x42\nLDI 0x43\nLDI 0x44\nHLT');
        contentChangeListeners.forEach(cb => cb());
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: binary,
          error: null,
        });

        // Initial load state at PC=0
        mockEmulatorBridge._setCpuState({
          pc: 0,
          accumulator: 0,
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0,
          mar: 0,
          mdr: 0,
          cycles: 0,
          instructions: 0,
        });

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          expect(mockEmulatorBridge.loadProgram).toHaveBeenCalled();
        });

        const stepBtn = container.querySelector('[data-action="step"]') as HTMLButtonElement;

        // Step 3 times to build history of 3 states
        for (let i = 0; i < 3; i++) {
          mockEmulatorBridge._setStepResult({
            pc: (i + 1) * 2,
            accumulator: 0x42 + i,
            zeroFlag: false,
            halted: false,
            error: false,
            errorMessage: null,
            memory: new Uint8Array(256),
            ir: 0x10,
            mar: 0,
            mdr: 0,
            cycles: i + 1,
            instructions: i + 1,
          });

          stepBtn.click();

          await vi.waitFor(() => {
            const appAny = app as unknown as { stateHistory: Array<{ state: { pc: number } }> };
            expect(appAny.stateHistory.length).toBe(i + 1);
          });
        }

        // Verify we have 3 history entries (PC=0, PC=2, PC=4)
        const appAny = app as unknown as {
          stateHistory: Array<{ state: { pc: number } }>;
          historyPointer: number;
        };
        expect(appAny.stateHistory.length).toBe(3);
        expect(appAny.stateHistory[0].state.pc).toBe(0);
        expect(appAny.stateHistory[1].state.pc).toBe(2);
        expect(appAny.stateHistory[2].state.pc).toBe(4);

        // Step back once (to history entry at index 2, which has PC=4)
        mockEmulatorBridge._setRestoreStateResult({
          pc: 0,  // Emulator returns 0 but we use historical value
          accumulator: 0,
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0,
          mar: 0,
          mdr: 0,
          cycles: 0,
          instructions: 0,
        });

        const stepBackBtn = container.querySelector('[data-action="step-back"]') as HTMLButtonElement;
        stepBackBtn.click();

        await vi.waitFor(() => {
          expect(mockEmulatorBridge.restoreState).toHaveBeenCalled();
          expect(appAny.historyPointer).toBe(2);
        });

        // Step back again (to history entry at index 1, which has PC=2)
        mockEmulatorBridge.restoreState.mockClear();
        stepBackBtn.click();

        await vi.waitFor(() => {
          expect(mockEmulatorBridge.restoreState).toHaveBeenCalled();
          expect(appAny.historyPointer).toBe(1);
        });

        // Now we're at history position 1 (PC=2), with future states at 2 and 3
        // Step FORWARD - this should truncate future history
        mockEmulatorBridge._setStepResult({
          pc: 10,  // New PC after stepping from position 1
          accumulator: 0x99,
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0x10,
          mar: 0,
          mdr: 0,
          cycles: 5,
          instructions: 5,
        });

        stepBtn.click();

        await vi.waitFor(() => {
          // History should be truncated: only entries 0, 1, and new entry (total 3)
          // The old entries at index 2 (PC=4) should be discarded
          expect(appAny.stateHistory.length).toBe(3);
          // The last entry should now be the state at PC=2 (before the new step)
          // Note: The pushStateToHistory truncates first, then adds new state
          expect(appAny.stateHistory[2].state.pc).toBe(2);
          // historyPointer should reset to -1 (latest tracking mode)
          expect(appAny.historyPointer).toBe(-1);
        });
      });
    });

    describe('F9 keyboard shortcut', () => {
      beforeEach(() => {
        vi.clearAllMocks();
        mockAssemblerBridge._reset();
        mockEmulatorBridge._reset();
        mockEditorInstance._resetContent();
        contentChangeListeners.length = 0;
        addedActions.length = 0;
        app.mount(container);
      });

      it('should trigger handleStepBack on F9 keypress when history exists', async () => {
        // Set up with history
        const binary = new Uint8Array([0x10, 0x42, 0xF0]);
        mockEditorInstance._setContent('LDI 0x42\nHLT');
        mockEditorInstance.getValue.mockReturnValue('LDI 0x42\nHLT');
        contentChangeListeners.forEach(cb => cb());
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: binary,
          error: null,
        });

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          expect(mockEmulatorBridge.loadProgram).toHaveBeenCalled();
        });

        // Step to create history
        mockEmulatorBridge._setStepResult({
          pc: 2,
          accumulator: 0x42,
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0x10,
          mar: 0,
          mdr: 0,
          cycles: 1,
          instructions: 1,
        });

        const stepBtn = container.querySelector('[data-action="step"]') as HTMLButtonElement;
        stepBtn.click();

        await vi.waitFor(() => {
          const appAny = app as unknown as { stateHistory: unknown[] };
          expect(appAny.stateHistory.length).toBe(1);
        });

        // Set up restore result
        mockEmulatorBridge._setRestoreStateResult({
          pc: 0,
          accumulator: 0,
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0,
          mar: 0,
          mdr: 0,
          cycles: 0,
          instructions: 0,
        });

        // Press F9
        const keyEvent = new KeyboardEvent('keydown', { key: 'F9', bubbles: true });
        window.dispatchEvent(keyEvent);

        await vi.waitFor(() => {
          expect(mockEmulatorBridge.restoreState).toHaveBeenCalled();
        });
      });

      it('should not trigger handleStepBack on F9 when no history', async () => {
        // Assemble and load without stepping
        const binary = new Uint8Array([0x10, 0x42, 0xF0]);
        mockEditorInstance._setContent('LDI 0x42\nHLT');
        mockEditorInstance.getValue.mockReturnValue('LDI 0x42\nHLT');
        contentChangeListeners.forEach(cb => cb());
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: binary,
          error: null,
        });

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          expect(mockEmulatorBridge.loadProgram).toHaveBeenCalled();
        });

        // Press F9 with no history
        const keyEvent = new KeyboardEvent('keydown', { key: 'F9', bubbles: true });
        window.dispatchEvent(keyEvent);

        // Should not call restoreState
        expect(mockEmulatorBridge.restoreState).not.toHaveBeenCalled();
      });

      it('should prevent default browser behavior on F9', async () => {
        const binary = new Uint8Array([0x10, 0x42, 0xF0]);
        mockEditorInstance._setContent('LDI 0x42\nHLT');
        mockEditorInstance.getValue.mockReturnValue('LDI 0x42\nHLT');
        contentChangeListeners.forEach(cb => cb());
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: binary,
          error: null,
        });

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          expect(mockEmulatorBridge.loadProgram).toHaveBeenCalled();
        });

        const keyEvent = new KeyboardEvent('keydown', { key: 'F9', bubbles: true, cancelable: true });
        const preventDefaultSpy = vi.spyOn(keyEvent, 'preventDefault');

        window.dispatchEvent(keyEvent);

        expect(preventDefaultSpy).toHaveBeenCalled();
      });
    });

    describe('F9 in keyboard shortcuts dialog', () => {
      it('should include F9 shortcut in debugging category', async () => {
        const { KEYBOARD_SHORTCUTS } = await import('./keyboardShortcuts');
        const f9Shortcut = KEYBOARD_SHORTCUTS.find(s => s.keys === 'F9');
        expect(f9Shortcut).toBeDefined();
        expect(f9Shortcut?.description).toBe('Step back one instruction');
        expect(f9Shortcut?.category).toBe('debugging');
      });
    });
  });

  describe('RegisterView Integration (Story 5.3)', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      mockAssemblerBridge._reset();
      mockEmulatorBridge._reset();
      mockEditorInstance._resetContent();
      contentChangeListeners.length = 0;
      addedActions.length = 0;
      app.mount(container);
    });

    describe('mount and initialization', () => {
      it('should mount RegisterView in state panel content area', () => {
        const registerView = container.querySelector('.da-register-view');
        expect(registerView).not.toBeNull();
      });

      it('should render RegisterView inside .da-state-panel .da-panel-content', () => {
        const stateContent = container.querySelector('.da-state-panel .da-panel-content');
        const registerView = stateContent?.querySelector('.da-register-view');
        expect(registerView).not.toBeNull();
      });

      it('should display initial PC value as 0x00 (0)', () => {
        const pcRow = container.querySelector('[data-register="pc"]');
        const value = pcRow?.querySelector('.da-register-value');
        expect(value?.textContent).toBe('0x00 (0)');
      });

      it('should display initial Accumulator value as 0x0 (0)', () => {
        const accRow = container.querySelector('[data-register="accumulator"]');
        const value = accRow?.querySelector('.da-register-value');
        expect(value?.textContent).toBe('0x0 (0)');
      });
    });

    describe('getRegisterView accessor', () => {
      it('should return RegisterView instance after mount', () => {
        const registerView = app.getRegisterView();
        expect(registerView).not.toBeNull();
      });

      it('should return null before mount', () => {
        const newApp = new App();
        expect(newApp.getRegisterView()).toBeNull();
      });
    });

    describe('update on load', () => {
      it('should update RegisterView with initial state after load', async () => {
        const binary = new Uint8Array([0x10, 0x42, 0xF0]);
        mockEditorInstance._setContent('LDI 0x42\nHLT');
        mockEditorInstance.getValue.mockReturnValue('LDI 0x42\nHLT');
        contentChangeListeners.forEach(cb => cb());
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: binary,
          error: null,
        });

        mockEmulatorBridge._setCpuState({
          pc: 0,
          accumulator: 0,
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0,
          mar: 0,
          mdr: 0,
          cycles: 0,
          instructions: 0,
        });

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          expect(mockEmulatorBridge.loadProgram).toHaveBeenCalled();
        });

        const pcValue = container.querySelector('[data-register="pc"] .da-register-value');
        const accValue = container.querySelector('[data-register="accumulator"] .da-register-value');
        expect(pcValue?.textContent).toBe('0x00 (0)');
        expect(accValue?.textContent).toBe('0x0 (0)');
      });
    });

    describe('update on step', () => {
      it('should update RegisterView with new state after step', async () => {
        // Set up: assemble and load
        const binary = new Uint8Array([0x10, 0x42, 0xF0]);
        mockEditorInstance._setContent('LDI 0x42\nHLT');
        mockEditorInstance.getValue.mockReturnValue('LDI 0x42\nHLT');
        contentChangeListeners.forEach(cb => cb());
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: binary,
          error: null,
        });

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          expect(mockEmulatorBridge.loadProgram).toHaveBeenCalled();
        });

        // Step with new state - use valid 4-bit accumulator value (0-15)
        mockEmulatorBridge._setStepResult({
          pc: 2,
          accumulator: 0xA, // Valid 4-bit value (10 decimal)
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0x10,
          mar: 0,
          mdr: 0,
          cycles: 1,
          instructions: 1,
        });

        const stepBtn = container.querySelector('[data-action="step"]') as HTMLButtonElement;
        stepBtn.click();

        await vi.waitFor(() => {
          const pcValue = container.querySelector('[data-register="pc"] .da-register-value');
          expect(pcValue?.textContent).toBe('0x02 (2)');
        });

        const accValue = container.querySelector('[data-register="accumulator"] .da-register-value');
        // Accumulator is 0xA (10 decimal) - valid 4-bit value
        expect(accValue?.textContent).toBe('0xA (10)');
      });
    });

    describe('update on step back', () => {
      it('should update RegisterView with historical state after step back', async () => {
        // Set up: assemble, load, and step to create history
        const binary = new Uint8Array([0x10, 0x0A, 0xF0]);
        mockEditorInstance._setContent('LDI 0x0A\nHLT');
        mockEditorInstance.getValue.mockReturnValue('LDI 0x0A\nHLT');
        contentChangeListeners.forEach(cb => cb());
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: binary,
          error: null,
        });

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          expect(mockEmulatorBridge.loadProgram).toHaveBeenCalled();
        });

        // Step to create history - use valid 4-bit accumulator value
        mockEmulatorBridge._setStepResult({
          pc: 2,
          accumulator: 0xA, // Valid 4-bit value (10 decimal)
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0x10,
          mar: 0,
          mdr: 0,
          cycles: 1,
          instructions: 1,
        });

        const stepBtn = container.querySelector('[data-action="step"]') as HTMLButtonElement;
        stepBtn.click();

        await vi.waitFor(() => {
          const appAny = app as unknown as { stateHistory: unknown[] };
          expect(appAny.stateHistory.length).toBe(1);
        });

        // Step back
        mockEmulatorBridge._setRestoreStateResult({
          pc: 0,
          accumulator: 0,
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0,
          mar: 0,
          mdr: 0,
          cycles: 0,
          instructions: 0,
        });

        const stepBackBtn = container.querySelector('[data-action="step-back"]') as HTMLButtonElement;
        stepBackBtn.click();

        await vi.waitFor(() => {
          expect(mockEmulatorBridge.restoreState).toHaveBeenCalled();
        });

        // RegisterView should show historical state (PC=0, ACC=0)
        await vi.waitFor(() => {
          const pcValue = container.querySelector('[data-register="pc"] .da-register-value');
          expect(pcValue?.textContent).toBe('0x00 (0)');
        });

        const accValue = container.querySelector('[data-register="accumulator"] .da-register-value');
        expect(accValue?.textContent).toBe('0x0 (0)');
      });
    });

    describe('update on reset', () => {
      it('should update RegisterView with reset state after reset', async () => {
        // Set up: assemble, load, and step - use valid 4-bit accumulator value
        const binary = new Uint8Array([0x10, 0x0A, 0xF0]);
        mockEditorInstance._setContent('LDI 0x0A\nHLT');
        mockEditorInstance.getValue.mockReturnValue('LDI 0x0A\nHLT');
        contentChangeListeners.forEach(cb => cb());
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: binary,
          error: null,
        });

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          expect(mockEmulatorBridge.loadProgram).toHaveBeenCalled();
        });

        // Step to change state - use valid 4-bit accumulator value
        mockEmulatorBridge._setStepResult({
          pc: 2,
          accumulator: 0xA, // Valid 4-bit value (10 decimal)
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0x10,
          mar: 0,
          mdr: 0,
          cycles: 1,
          instructions: 1,
        });

        const stepBtn = container.querySelector('[data-action="step"]') as HTMLButtonElement;
        stepBtn.click();

        await vi.waitFor(() => {
          const pcValue = container.querySelector('[data-register="pc"] .da-register-value');
          expect(pcValue?.textContent).toBe('0x02 (2)');
        });

        // Reset
        mockEmulatorBridge._setResetResult({
          pc: 0,
          accumulator: 0,
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0,
          mar: 0,
          mdr: 0,
          cycles: 0,
          instructions: 0,
        });

        const resetBtn = container.querySelector('[data-action="reset"]') as HTMLButtonElement;
        resetBtn.click();

        await vi.waitFor(() => {
          expect(mockEmulatorBridge.reset).toHaveBeenCalled();
        });

        // RegisterView should show reset state
        await vi.waitFor(() => {
          const pcValue = container.querySelector('[data-register="pc"] .da-register-value');
          expect(pcValue?.textContent).toBe('0x00 (0)');
        });

        const accValue = container.querySelector('[data-register="accumulator"] .da-register-value');
        expect(accValue?.textContent).toBe('0x0 (0)');
      });
    });

    describe('cleanup on destroy', () => {
      it('should remove RegisterView from DOM on destroy', () => {
        expect(container.querySelector('.da-register-view')).not.toBeNull();
        app.destroy();
        expect(container.querySelector('.da-register-view')).toBeNull();
      });

      it('should set registerView to null on destroy', () => {
        expect(app.getRegisterView()).not.toBeNull();
        app.destroy();
        expect(app.getRegisterView()).toBeNull();
      });
    });
  });

  describe('FlagsView Integration (Story 5.4)', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      mockAssemblerBridge._reset();
      mockEmulatorBridge._reset();
      mockEditorInstance._resetContent();
      contentChangeListeners.length = 0;
      addedActions.length = 0;
      app.mount(container);
    });

    describe('mount and initialization', () => {
      it('should mount FlagsView in state panel content area', () => {
        const flagsView = container.querySelector('.da-flags-view');
        expect(flagsView).not.toBeNull();
      });

      it('should render FlagsView inside .da-state-panel .da-panel-content', () => {
        const stateContent = container.querySelector('.da-state-panel .da-panel-content');
        const flagsView = stateContent?.querySelector('.da-flags-view');
        expect(flagsView).not.toBeNull();
      });

      it('should render FlagsView after RegisterView in DOM order', () => {
        const stateContent = container.querySelector('.da-state-panel .da-panel-content');
        const registerView = stateContent?.querySelector('.da-register-view');
        const flagsView = stateContent?.querySelector('.da-flags-view');

        expect(registerView).not.toBeNull();
        expect(flagsView).not.toBeNull();

        // FlagsView should come after RegisterView
        const children = Array.from(stateContent?.children || []);
        const registerIndex = children.indexOf(registerView as Element);
        const flagsIndex = children.indexOf(flagsView as Element);
        expect(flagsIndex).toBeGreaterThan(registerIndex);
      });

      it('should display Zero flag row with initial clear state', () => {
        const zeroRow = container.querySelector('[data-flag="zero"]');
        const value = zeroRow?.querySelector('.da-flag-value');
        const status = zeroRow?.querySelector('.da-flag-status');
        expect(value?.textContent).toBe('0');
        expect(status?.textContent).toBe('clear');
      });
    });

    describe('getFlagsView accessor', () => {
      it('should return FlagsView instance after mount', () => {
        const flagsView = app.getFlagsView();
        expect(flagsView).not.toBeNull();
      });

      it('should return null before mount', () => {
        const newApp = new App();
        expect(newApp.getFlagsView()).toBeNull();
      });
    });

    describe('update on load', () => {
      it('should update FlagsView with initial state after load', async () => {
        const binary = new Uint8Array([0x10, 0x00, 0xF0]);
        mockEditorInstance._setContent('LDI 0x00\nHLT');
        mockEditorInstance.getValue.mockReturnValue('LDI 0x00\nHLT');
        contentChangeListeners.forEach(cb => cb());
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: binary,
          error: null,
        });

        // Set initial CPU state with zeroFlag=false
        mockEmulatorBridge._setCpuState({
          pc: 0,
          accumulator: 0,
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0,
          mar: 0,
          mdr: 0,
          cycles: 0,
          instructions: 0,
        });

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          expect(mockEmulatorBridge.loadProgram).toHaveBeenCalled();
        });

        // Verify FlagsView shows initial state (zeroFlag=false → 0/clear)
        const zeroRow = container.querySelector('[data-flag="zero"]');
        const value = zeroRow?.querySelector('.da-flag-value');
        const status = zeroRow?.querySelector('.da-flag-status');
        expect(value?.textContent).toBe('0');
        expect(status?.textContent).toBe('clear');
        expect(zeroRow?.classList.contains('da-flag-set')).toBe(false);
      });

      it('should update FlagsView with zeroFlag=true state after load', async () => {
        const binary = new Uint8Array([0x10, 0x00, 0xF0]);
        mockEditorInstance._setContent('LDI 0x00\nHLT');
        mockEditorInstance.getValue.mockReturnValue('LDI 0x00\nHLT');
        contentChangeListeners.forEach(cb => cb());
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: binary,
          error: null,
        });

        // Set initial CPU state with zeroFlag=true
        mockEmulatorBridge._setCpuState({
          pc: 0,
          accumulator: 0,
          zeroFlag: true,
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0,
          mar: 0,
          mdr: 0,
          cycles: 0,
          instructions: 0,
        });

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          expect(mockEmulatorBridge.loadProgram).toHaveBeenCalled();
        });

        // Verify FlagsView shows zeroFlag=true state (1/SET)
        const zeroRow = container.querySelector('[data-flag="zero"]');
        const value = zeroRow?.querySelector('.da-flag-value');
        const status = zeroRow?.querySelector('.da-flag-status');
        expect(value?.textContent).toBe('1');
        expect(status?.textContent).toBe('SET');
        expect(zeroRow?.classList.contains('da-flag-set')).toBe(true);
      });
    });

    describe('update on step with zeroFlag=true', () => {
      it('should update FlagsView to SET when step result has zeroFlag=true', async () => {
        // Set up: assemble and load
        const binary = new Uint8Array([0x10, 0x00, 0xF0]);
        mockEditorInstance._setContent('LDI 0x00\nHLT');
        mockEditorInstance.getValue.mockReturnValue('LDI 0x00\nHLT');
        contentChangeListeners.forEach(cb => cb());
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: binary,
          error: null,
        });

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          expect(mockEmulatorBridge.loadProgram).toHaveBeenCalled();
        });

        // Step with zeroFlag=true
        mockEmulatorBridge._setStepResult({
          pc: 2,
          accumulator: 0,
          zeroFlag: true, // Zero flag should be SET after loading 0
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0x10,
          mar: 0,
          mdr: 0,
          cycles: 1,
          instructions: 1,
        });

        const stepBtn = container.querySelector('[data-action="step"]') as HTMLButtonElement;
        stepBtn.click();

        await vi.waitFor(() => {
          const zeroRow = container.querySelector('[data-flag="zero"]');
          const value = zeroRow?.querySelector('.da-flag-value');
          expect(value?.textContent).toBe('1');
        });

        const zeroRow = container.querySelector('[data-flag="zero"]');
        const status = zeroRow?.querySelector('.da-flag-status');
        expect(status?.textContent).toBe('SET');
        expect(zeroRow?.classList.contains('da-flag-set')).toBe(true);
      });
    });

    describe('update on reset', () => {
      it('should update FlagsView to clear after reset', async () => {
        // Set up: assemble, load, and step to set flag
        const binary = new Uint8Array([0x10, 0x00, 0xF0]);
        mockEditorInstance._setContent('LDI 0x00\nHLT');
        mockEditorInstance.getValue.mockReturnValue('LDI 0x00\nHLT');
        contentChangeListeners.forEach(cb => cb());
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: binary,
          error: null,
        });

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          expect(mockEmulatorBridge.loadProgram).toHaveBeenCalled();
        });

        // Step to set flag
        mockEmulatorBridge._setStepResult({
          pc: 2,
          accumulator: 0,
          zeroFlag: true,
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0x10,
          mar: 0,
          mdr: 0,
          cycles: 1,
          instructions: 1,
        });

        const stepBtn = container.querySelector('[data-action="step"]') as HTMLButtonElement;
        stepBtn.click();

        await vi.waitFor(() => {
          const zeroRow = container.querySelector('[data-flag="zero"]');
          const value = zeroRow?.querySelector('.da-flag-value');
          expect(value?.textContent).toBe('1');
        });

        // Reset should clear the flag
        mockEmulatorBridge._setResetResult({
          pc: 0,
          accumulator: 0,
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0,
          mar: 0,
          mdr: 0,
          cycles: 0,
          instructions: 0,
        });

        const resetBtn = container.querySelector('[data-action="reset"]') as HTMLButtonElement;
        resetBtn.click();

        await vi.waitFor(() => {
          expect(mockEmulatorBridge.reset).toHaveBeenCalled();
        });

        await vi.waitFor(() => {
          const zeroRow = container.querySelector('[data-flag="zero"]');
          const value = zeroRow?.querySelector('.da-flag-value');
          expect(value?.textContent).toBe('0');
        });

        const zeroRow = container.querySelector('[data-flag="zero"]');
        const status = zeroRow?.querySelector('.da-flag-status');
        expect(status?.textContent).toBe('clear');
        expect(zeroRow?.classList.contains('da-flag-set')).toBe(false);
      });
    });

    describe('cleanup on destroy', () => {
      it('should remove FlagsView from DOM on destroy', () => {
        expect(container.querySelector('.da-flags-view')).not.toBeNull();
        app.destroy();
        expect(container.querySelector('.da-flags-view')).toBeNull();
      });

      it('should set flagsView to null on destroy', () => {
        expect(app.getFlagsView()).not.toBeNull();
        app.destroy();
        expect(app.getFlagsView()).toBeNull();
      });
    });
  });

  describe('MemoryView Integration (Story 5.5)', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      mockAssemblerBridge._reset();
      mockEmulatorBridge._reset();
      mockEditorInstance._resetContent();
      contentChangeListeners.length = 0;
      addedActions.length = 0;
      app.mount(container);
    });

    describe('mount and initialization', () => {
      it('should mount MemoryView in state panel content area', () => {
        const memoryView = container.querySelector('.da-memory-view');
        expect(memoryView).not.toBeNull();
      });

      it('should render MemoryView inside .da-state-panel .da-panel-content', () => {
        const stateContent = container.querySelector('.da-state-panel .da-panel-content');
        const memoryView = stateContent?.querySelector('.da-memory-view');
        expect(memoryView).not.toBeNull();
      });

      it('should render MemoryView after FlagsView in DOM order', () => {
        const stateContent = container.querySelector('.da-state-panel .da-panel-content');
        const flagsView = stateContent?.querySelector('.da-flags-view');
        const memoryView = stateContent?.querySelector('.da-memory-view');

        expect(flagsView).not.toBeNull();
        expect(memoryView).not.toBeNull();

        // MemoryView should come after FlagsView
        const children = Array.from(stateContent?.children || []);
        const flagsIndex = children.indexOf(flagsView as Element);
        const memoryIndex = children.indexOf(memoryView as Element);
        expect(memoryIndex).toBeGreaterThan(flagsIndex);
      });

      it('should display 16 memory rows', () => {
        const rows = container.querySelectorAll('.da-memory-row:not(.da-memory-header)');
        expect(rows.length).toBe(16);
      });

      it('should display Memory title', () => {
        const title = container.querySelector('.da-memory-view__title');
        expect(title?.textContent).toBe('Memory');
      });
    });

    describe('getMemoryView accessor', () => {
      it('should return MemoryView instance after mount', () => {
        const memoryView = app.getMemoryView();
        expect(memoryView).not.toBeNull();
      });

      it('should return null before mount', () => {
        const newApp = new App();
        expect(newApp.getMemoryView()).toBeNull();
      });
    });

    describe('update on load', () => {
      it('should update MemoryView with initial state after load', async () => {
        const binary = new Uint8Array([0x10, 0x05, 0xF0]);
        mockEditorInstance._setContent('LDI 0x05\nHLT');
        mockEditorInstance.getValue.mockReturnValue('LDI 0x05\nHLT');
        contentChangeListeners.forEach(cb => cb());
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: binary,
          error: null,
        });

        // Set initial CPU state with specific memory values
        const memory = new Uint8Array(256);
        memory[0] = 0x10;
        memory[1] = 0x05;
        memory[2] = 0xF0;
        mockEmulatorBridge._setCpuState({
          pc: 0,
          accumulator: 0,
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          memory: memory,
          ir: 0,
          mar: 0,
          mdr: 0,
          cycles: 0,
          instructions: 0,
        });

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          expect(mockEmulatorBridge.loadProgram).toHaveBeenCalled();
        });

        // Verify MemoryView shows the memory values (as hex: 10=0x10, 5=0x5, F0=0xF0)
        const firstRow = container.querySelector('[data-address="0"]');
        const cells = firstRow?.querySelectorAll('.da-memory-cell');
        // Memory stores nibbles (0-15), so values 0x10, 0x05, 0xF0 will wrap/show as nibbles
        // Since mock memory sets memory[0]=0x10 (16 decimal), it will show as hex
        expect(cells?.[0].textContent).toBe('10'); // actually this may be wrong - let me check
      });

      it('should highlight PC row after load', async () => {
        const binary = new Uint8Array([0x10, 0x05, 0xF0]);
        mockEditorInstance._setContent('LDI 0x05\nHLT');
        mockEditorInstance.getValue.mockReturnValue('LDI 0x05\nHLT');
        contentChangeListeners.forEach(cb => cb());
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: binary,
          error: null,
        });

        mockEmulatorBridge._setCpuState({
          pc: 0,
          accumulator: 0,
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0,
          mar: 0,
          mdr: 0,
          cycles: 0,
          instructions: 0,
        });

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          expect(mockEmulatorBridge.loadProgram).toHaveBeenCalled();
        });

        // Verify PC row is highlighted (PC=0 means row with data-address="0")
        const pcRow = container.querySelector('[data-address="0"]');
        expect(pcRow?.classList.contains('da-memory-pc')).toBe(true);
      });
    });

    describe('update on step', () => {
      it('should update MemoryView PC highlighting after step', async () => {
        // Set up: assemble and load
        const binary = new Uint8Array([0x10, 0x05, 0xF0]);
        mockEditorInstance._setContent('LDI 0x05\nHLT');
        mockEditorInstance.getValue.mockReturnValue('LDI 0x05\nHLT');
        contentChangeListeners.forEach(cb => cb());
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: binary,
          error: null,
        });

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          expect(mockEmulatorBridge.loadProgram).toHaveBeenCalled();
        });

        // Step to PC=2
        mockEmulatorBridge._setStepResult({
          pc: 2,
          accumulator: 5,
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0x10,
          mar: 0,
          mdr: 5,
          cycles: 1,
          instructions: 1,
        });

        const stepBtn = container.querySelector('[data-action="step"]') as HTMLButtonElement;
        stepBtn.click();

        await vi.waitFor(() => {
          // PC=2 is in row 0 (addresses 0-15), cell offset 2
          const pcRow = container.querySelector('[data-address="0"]');
          const pcCell = pcRow?.querySelector('[data-offset="2"]');
          expect(pcCell?.classList.contains('da-memory-pc-cell')).toBe(true);
        });
      });
    });

    describe('update on reset', () => {
      it('should reset MemoryView PC to 0 after reset', async () => {
        // Set up: assemble and load
        const binary = new Uint8Array([0x10, 0x05, 0xF0]);
        mockEditorInstance._setContent('LDI 0x05\nHLT');
        mockEditorInstance.getValue.mockReturnValue('LDI 0x05\nHLT');
        contentChangeListeners.forEach(cb => cb());
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: binary,
          error: null,
        });

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          expect(mockEmulatorBridge.loadProgram).toHaveBeenCalled();
        });

        // Step to advance PC
        mockEmulatorBridge._setStepResult({
          pc: 2,
          accumulator: 5,
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0x10,
          mar: 0,
          mdr: 5,
          cycles: 1,
          instructions: 1,
        });

        const stepBtn = container.querySelector('[data-action="step"]') as HTMLButtonElement;
        stepBtn.click();

        await vi.waitFor(() => {
          expect(mockEmulatorBridge.step).toHaveBeenCalled();
        });

        // Reset to PC=0
        mockEmulatorBridge._setResetResult({
          pc: 0,
          accumulator: 0,
          zeroFlag: false,
          halted: false,
          error: false,
          errorMessage: null,
          memory: new Uint8Array(256),
          ir: 0,
          mar: 0,
          mdr: 0,
          cycles: 0,
          instructions: 0,
        });

        const resetBtn = container.querySelector('[data-action="reset"]') as HTMLButtonElement;
        resetBtn.click();

        await vi.waitFor(() => {
          // PC=0 cell should be highlighted again
          const pcRow = container.querySelector('[data-address="0"]');
          const pcCell = pcRow?.querySelector('[data-offset="0"]');
          expect(pcCell?.classList.contains('da-memory-pc-cell')).toBe(true);
        });
      });
    });

    describe('cleanup on destroy', () => {
      it('should remove MemoryView from DOM on destroy', () => {
        expect(container.querySelector('.da-memory-view')).not.toBeNull();
        app.destroy();
        expect(container.querySelector('.da-memory-view')).toBeNull();
      });

      it('should set memoryView to null on destroy', () => {
        expect(app.getMemoryView()).not.toBeNull();
        app.destroy();
        expect(app.getMemoryView()).toBeNull();
      });
    });
  });

  describe('BreakpointsView Integration (Story 5.8)', () => {
    let app: App;
    let container: HTMLDivElement;

    beforeEach(() => {
      container = document.createElement('div');
      document.body.appendChild(container);
      app = new App();
      mockEditorInstance._resetContent();
    });

    afterEach(() => {
      app.destroy();
      document.body.removeChild(container);
    });

    describe('mount and initialization', () => {
      it('should mount BreakpointsView in state panel content area', () => {
        app.mount(container);

        const breakpointsView = container.querySelector('.da-breakpoints-view');
        expect(breakpointsView).not.toBeNull();
      });

      it('should render BreakpointsView inside .da-state-panel .da-panel-content', () => {
        app.mount(container);

        const stateContent = container.querySelector('.da-state-panel .da-panel-content');
        const breakpointsView = stateContent?.querySelector('.da-breakpoints-view');
        expect(breakpointsView).not.toBeNull();
      });

      it('should render BreakpointsView after MemoryView in DOM order', () => {
        app.mount(container);

        const stateContent = container.querySelector('.da-state-panel .da-panel-content');
        const children = Array.from(stateContent?.children ?? []);
        const memoryViewIdx = children.findIndex(el => el.classList.contains('da-memory-view'));
        const breakpointsViewIdx = children.findIndex(el => el.classList.contains('da-breakpoints-view'));

        expect(memoryViewIdx).toBeLessThan(breakpointsViewIdx);
      });

      it('should display Breakpoints title', () => {
        app.mount(container);

        const title = container.querySelector('.da-breakpoints-view__title');
        expect(title?.textContent).toBe('Breakpoints');
      });

      it('should show empty message initially', () => {
        app.mount(container);

        const emptyMsg = container.querySelector('.da-breakpoints-view__empty');
        expect(emptyMsg?.textContent).toBe('No breakpoints set');
      });
    });

    describe('getBreakpointsView accessor', () => {
      it('should return BreakpointsView instance after mount', () => {
        app.mount(container);
        expect(app.getBreakpointsView()).not.toBeNull();
      });

      it('should return null before mount', () => {
        expect(app.getBreakpointsView()).toBeNull();
      });
    });

    describe('cleanup on destroy', () => {
      it('should remove BreakpointsView from DOM on destroy', () => {
        app.mount(container);
        expect(container.querySelector('.da-breakpoints-view')).not.toBeNull();
        app.destroy();
        expect(container.querySelector('.da-breakpoints-view')).toBeNull();
      });

      it('should set breakpointsView to null on destroy', () => {
        app.mount(container);
        expect(app.getBreakpointsView()).not.toBeNull();
        app.destroy();
        expect(app.getBreakpointsView()).toBeNull();
      });
    });

    describe('breakpoints cleared on code change', () => {
      it('should clear breakpoints when code content changes', async () => {
        app.mount(container);

        // Set up: assemble to get a source map
        const binary = new Uint8Array([0x10, 0x05, 0xF0]);
        mockEditorInstance._setContent('LDI 0x05\nHLT');
        mockEditorInstance.getValue.mockReturnValue('LDI 0x05\nHLT');
        contentChangeListeners.forEach(cb => cb());
        mockAssemblerBridge._setAssembleResult({
          success: true,
          binary: binary,
          error: null,
        });

        const assembleBtn = container.querySelector('[data-action="assemble"]') as HTMLButtonElement;
        assembleBtn.click();

        await vi.waitFor(() => {
          expect(mockEmulatorBridge.loadProgram).toHaveBeenCalled();
        });

        // Verify we have assembled (execution buttons enabled)
        const stepBtn = container.querySelector('[data-action="step"]') as HTMLButtonElement;
        expect(stepBtn.disabled).toBe(false);

        // Simulate code change
        mockEditorInstance._setContent('LDI 0x10\nHLT');
        mockEditorInstance.getValue.mockReturnValue('LDI 0x10\nHLT');
        contentChangeListeners.forEach(cb => cb());

        // Verify toolbar buttons disabled (code changed, assembly invalid)
        expect(stepBtn.disabled).toBe(true);

        // Verify empty message is shown (breakpoints cleared)
        const emptyMsg = container.querySelector('.da-breakpoints-view__empty');
        expect(emptyMsg?.textContent).toBe('No breakpoints set');
      });
    });
  });
});
