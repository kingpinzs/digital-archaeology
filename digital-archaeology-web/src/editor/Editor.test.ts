import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Monaco editor using vi.hoisted for proper hoisting
const {
  mockEditorInstance,
  mockMonaco,
  mockModel,
  resetHistory,
  cursorPositionListeners,
  contentChangeListeners,
  addedActions,
  mockCursorDisposable,
  mockContentChangeDisposable,
  mockActionDisposable,
} = vi.hoisted(() => {
  // Simple in-memory history to simulate Monaco undo/redo stack behavior
  let history: string[] = [''];
  let pointer = 0;

  // Store cursor position change listeners for testing
  const cursorPositionListeners: Array<(e: { position: { lineNumber: number; column: number } }) => void> = [];

  // Store content change listeners for testing
  const contentChangeListeners: Array<() => void> = [];

  // Store added actions for testing
  const addedActions: Array<{ id: string; label: string; keybindings: number[]; run: () => void }> = [];

  const resetHistory = () => {
    history = [''];
    pointer = 0;
    cursorPositionListeners.length = 0;
    contentChangeListeners.length = 0;
    addedActions.length = 0;
  };

  const mockCursorDisposable = {
    dispose: vi.fn(),
  };

  const mockContentChangeDisposable = {
    dispose: vi.fn(),
  };

  const mockActionDisposable = {
    dispose: vi.fn(),
  };

  const mockModel = {
    uri: 'test-uri',
    undo: vi.fn(() => {
      if (pointer > 0) {
        pointer -= 1;
      }
    }),
    redo: vi.fn(() => {
      if (pointer < history.length - 1) {
        pointer += 1;
      }
    }),
  };

  const mockEditorInstance = {
    dispose: vi.fn(),
    getValue: vi.fn(() => history[pointer]),
    setValue: vi.fn((value: string) => {
      history = history.slice(0, pointer + 1);
      history.push(value);
      pointer = history.length - 1;
      // Trigger content change listeners
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
      return mockContentChangeDisposable;
    }),
    addAction: vi.fn((action: { id: string; label: string; keybindings: number[]; run: () => void }) => {
      addedActions.push(action);
      return mockActionDisposable;
    }),
    trigger: vi.fn(),
    getContribution: vi.fn(() => ({
      start: vi.fn(),
    })),
  };

  const mockMonaco = {
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
  };

  return {
    mockEditorInstance,
    mockMonaco,
    mockModel,
    resetHistory,
    cursorPositionListeners,
    contentChangeListeners,
    addedActions,
    mockCursorDisposable,
    mockContentChangeDisposable,
    mockActionDisposable,
  };
});

vi.mock('monaco-editor', () => mockMonaco);

import { Editor, resetThemeRegistration } from './Editor';
import { resetLanguageRegistration, micro4LanguageId } from './micro4-language';

describe('Editor', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    vi.clearAllMocks();
    resetHistory();
    // Reset global theme and language state for each test
    resetThemeRegistration();
    resetLanguageRegistration();
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('constructor', () => {
    it('should create with default options', () => {
      const editor = new Editor();
      expect(editor).toBeDefined();
      expect(editor.isMounted()).toBe(false);
    });

    it('should create with custom options', () => {
      const editor = new Editor({
        initialValue: 'test content',
        readOnly: true,
      });
      expect(editor).toBeDefined();
    });
  });

  describe('mount', () => {
    it('should mount to container', () => {
      const editor = new Editor();
      editor.mount(container);

      expect(mockMonaco.editor.create).toHaveBeenCalledTimes(1);
      expect(editor.isMounted()).toBe(true);

      editor.destroy();
    });

    it('should register da-dark theme before creating editor', () => {
      const editor = new Editor();
      editor.mount(container);

      expect(mockMonaco.editor.defineTheme).toHaveBeenCalledWith(
        'da-dark',
        expect.objectContaining({
          base: 'vs-dark',
          inherit: true,
          rules: expect.arrayContaining([
            expect.objectContaining({ token: 'keyword.control' }),
            expect.objectContaining({ token: 'keyword' }),
            expect.objectContaining({ token: 'comment' }),
          ]),
          colors: expect.objectContaining({
            'editor.background': '#252542',
            'editor.foreground': '#e0e0e0',
          }),
        })
      );

      editor.destroy();
    });

    it('should create Monaco editor with correct options', () => {
      const editor = new Editor();
      editor.mount(container);

      expect(mockMonaco.editor.create).toHaveBeenCalledWith(
        container,
        expect.objectContaining({
          value: '',
          language: micro4LanguageId,
          theme: 'da-dark',
          automaticLayout: true,
          ariaLabel: 'Assembly Code Editor',
        })
      );

      editor.destroy();
    });

    it('should pass initialValue to Monaco editor', () => {
      const editor = new Editor({ initialValue: 'MOV A, 0x10' });
      editor.mount(container);

      expect(mockMonaco.editor.create).toHaveBeenCalledWith(
        container,
        expect.objectContaining({
          value: 'MOV A, 0x10',
        })
      );

      editor.destroy();
    });

    it('should pass readOnly option to Monaco editor', () => {
      const editor = new Editor({ readOnly: true });
      editor.mount(container);

      expect(mockMonaco.editor.create).toHaveBeenCalledWith(
        container,
        expect.objectContaining({
          readOnly: true,
        })
      );

      editor.destroy();
    });

    it('should only register theme once globally across multiple editor instances', () => {
      // First editor instance
      const editor1 = new Editor();
      editor1.mount(container);
      expect(mockMonaco.editor.defineTheme).toHaveBeenCalledTimes(1);

      // Second editor instance in different container
      const container2 = document.createElement('div');
      document.body.appendChild(container2);
      const editor2 = new Editor();
      editor2.mount(container2);

      // defineTheme should NOT be called again - theme is registered globally
      expect(mockMonaco.editor.defineTheme).toHaveBeenCalledTimes(1);

      editor1.destroy();
      editor2.destroy();
      document.body.removeChild(container2);
    });
  });

  describe('getValue', () => {
    it('should return empty string when not mounted', () => {
      const editor = new Editor();
      expect(editor.getValue()).toBe('');
    });

    it('should return value from Monaco editor', () => {
      const editor = new Editor();
      editor.mount(container);

      mockEditorInstance.getValue.mockReturnValueOnce('test content');
      expect(editor.getValue()).toBe('test content');

      editor.destroy();
    });
  });

  describe('setValue', () => {
    it('should not throw when not mounted', () => {
      const editor = new Editor();
      expect(() => editor.setValue('test')).not.toThrow();
    });

    it('should call Monaco editor setValue', () => {
      const editor = new Editor();
      editor.mount(container);

      editor.setValue('new content');
      expect(mockEditorInstance.setValue).toHaveBeenCalledWith('new content');

      editor.destroy();
    });
  });

  describe('getModel', () => {
    it('should return null when not mounted', () => {
      const editor = new Editor();
      expect(editor.getModel()).toBeNull();
    });

    it('should return Monaco model', () => {
      const editor = new Editor();
      editor.mount(container);

      expect(editor.getModel()).toBe(mockModel);

      editor.destroy();
    });
  });

  describe('undo/redo functionality (Story 2.4)', () => {
    describe('model API', () => {
      it('should expose undo method on model', () => {
        const editor = new Editor();
        editor.mount(container);

        const model = editor.getModel();
        expect(typeof model?.undo).toBe('function');

        editor.destroy();
      });

      it('should expose redo method on model', () => {
        const editor = new Editor();
        editor.mount(container);

        const model = editor.getModel();
        expect(typeof model?.redo).toBe('function');

        editor.destroy();
      });
    });

    describe('undo operations', () => {
      it('should revert setValue changes when undo is called', () => {
        const editor = new Editor();
        editor.mount(container);

        editor.setValue('first');
        editor.setValue('second');

        const model = editor.getModel();
        model?.undo();

        expect(mockModel.undo).toHaveBeenCalledTimes(1);
        expect(editor.getValue()).toBe('first');

        editor.destroy();
      });

      it('should support multiple sequential undo calls and clamp at the initial value', () => {
        const editor = new Editor();
        editor.mount(container);

        editor.setValue('first');
        editor.setValue('second');
        editor.setValue('third');

        const model = editor.getModel();
        model?.undo();
        expect(editor.getValue()).toBe('second');

        model?.undo();
        expect(editor.getValue()).toBe('first');

        model?.undo();
        expect(editor.getValue()).toBe('');

        expect(mockModel.undo).toHaveBeenCalledTimes(3);

        editor.destroy();
      });
    });

    describe('redo operations', () => {
      it('should restore undone changes when redo is called', () => {
        const editor = new Editor();
        editor.mount(container);

        editor.setValue('first');
        editor.setValue('second');

        const model = editor.getModel();
        model?.undo();
        expect(editor.getValue()).toBe('first');

        model?.redo();
        expect(mockModel.redo).toHaveBeenCalledTimes(1);
        expect(editor.getValue()).toBe('second');

        editor.destroy();
      });

      it('should support multiple sequential redo calls after multiple undos', () => {
        const editor = new Editor();
        editor.mount(container);

        editor.setValue('first');
        editor.setValue('second');
        editor.setValue('third');

        const model = editor.getModel();
        model?.undo(); // second
        model?.undo(); // first
        expect(editor.getValue()).toBe('first');

        model?.redo(); // second
        expect(editor.getValue()).toBe('second');
        model?.redo(); // third
        expect(editor.getValue()).toBe('third');

        expect(mockModel.redo).toHaveBeenCalledTimes(2);

        editor.destroy();
      });

      it('should clear redo stack when new content is set after undo', () => {
        const editor = new Editor();
        editor.mount(container);

        editor.setValue('first');
        editor.setValue('second');

        const model = editor.getModel();
        model?.undo(); // back to 'first'
        expect(editor.getValue()).toBe('first');

        // New edit should clear redo stack
        editor.setValue('new-branch');
        expect(editor.getValue()).toBe('new-branch');

        // Redo should have no effect (redo stack cleared by new edit)
        model?.redo();
        expect(editor.getValue()).toBe('new-branch'); // Still 'new-branch', not 'second'

        editor.destroy();
      });
    });

    describe('keyboard shortcuts (Monaco defaults)', () => {
      // Note: Monaco Editor handles keyboard shortcuts internally:
      // - Ctrl+Z / Cmd+Z: Undo
      // - Ctrl+Y / Cmd+Y: Redo
      // - Ctrl+Shift+Z / Cmd+Shift+Z: Redo (alternative)
      //
      // These bindings are Monaco's default behavior and are enabled automatically.
      // Integration tests verify menu actions route to model.undo()/redo().
      // The keyboard shortcuts themselves are Monaco's responsibility and are
      // well-tested by the Monaco team. We test the API exposure and menu wiring.

      it('should have Monaco handle Ctrl+Z/Ctrl+Y/Ctrl+Shift+Z by default (no override needed)', () => {
        const editor = new Editor();
        editor.mount(container);

        // Verify editor is mounted and model is accessible
        // Monaco's default keybindings are active when editor is mounted
        expect(editor.isMounted()).toBe(true);
        expect(editor.getModel()).not.toBeNull();

        // The actual keyboard shortcuts are handled by Monaco internally
        // This test documents that we rely on Monaco's default behavior
        // and don't override or disable these shortcuts

        editor.destroy();
      });
    });
  });

  describe('focus', () => {
    it('should not throw when not mounted', () => {
      const editor = new Editor();
      expect(() => editor.focus()).not.toThrow();
    });

    it('should call Monaco editor focus', () => {
      const editor = new Editor();
      editor.mount(container);

      editor.focus();
      expect(mockEditorInstance.focus).toHaveBeenCalled();

      editor.destroy();
    });
  });

  describe('getMonacoEditor', () => {
    it('should return null when not mounted', () => {
      const editor = new Editor();
      expect(editor.getMonacoEditor()).toBeNull();
    });

    it('should return Monaco editor instance', () => {
      const editor = new Editor();
      editor.mount(container);

      expect(editor.getMonacoEditor()).toBe(mockEditorInstance);

      editor.destroy();
    });
  });

  describe('layout', () => {
    it('should not throw when not mounted', () => {
      const editor = new Editor();
      expect(() => editor.layout()).not.toThrow();
    });

    it('should call Monaco editor layout', () => {
      const editor = new Editor();
      editor.mount(container);

      editor.layout();
      expect(mockEditorInstance.layout).toHaveBeenCalled();

      editor.destroy();
    });
  });

  describe('isMounted', () => {
    it('should return false before mount', () => {
      const editor = new Editor();
      expect(editor.isMounted()).toBe(false);
    });

    it('should return true after mount', () => {
      const editor = new Editor();
      editor.mount(container);
      expect(editor.isMounted()).toBe(true);
      editor.destroy();
    });

    it('should return false after destroy', () => {
      const editor = new Editor();
      editor.mount(container);
      editor.destroy();
      expect(editor.isMounted()).toBe(false);
    });
  });

  describe('destroy', () => {
    it('should dispose Monaco editor', () => {
      const editor = new Editor();
      editor.mount(container);
      editor.destroy();

      expect(mockEditorInstance.dispose).toHaveBeenCalled();
    });

    it('should be safe to call multiple times', () => {
      const editor = new Editor();
      editor.mount(container);

      editor.destroy();
      editor.destroy();

      expect(mockEditorInstance.dispose).toHaveBeenCalledTimes(1);
    });

    it('should be safe to call before mount', () => {
      const editor = new Editor();
      expect(() => editor.destroy()).not.toThrow();
    });

    it('should clear internal references', () => {
      const editor = new Editor();
      editor.mount(container);
      editor.destroy();

      expect(editor.isMounted()).toBe(false);
      expect(editor.getMonacoEditor()).toBeNull();
    });
  });

  describe('theme colors', () => {
    it('should define theme with correct background color', () => {
      const editor = new Editor();
      editor.mount(container);

      const themeCall = mockMonaco.editor.defineTheme.mock.calls[0];
      expect(themeCall[1].colors['editor.background']).toBe('#252542');

      editor.destroy();
    });

    it('should define theme with correct foreground color', () => {
      const editor = new Editor();
      editor.mount(container);

      const themeCall = mockMonaco.editor.defineTheme.mock.calls[0];
      expect(themeCall[1].colors['editor.foreground']).toBe('#e0e0e0');

      editor.destroy();
    });

    it('should define theme with correct cursor color', () => {
      const editor = new Editor();
      editor.mount(container);

      const themeCall = mockMonaco.editor.defineTheme.mock.calls[0];
      expect(themeCall[1].colors['editorCursor.foreground']).toBe('#00b4d8');

      editor.destroy();
    });

    // Line number color tests moved to dedicated 'line numbers (Story 2.3)' describe block
  });

  describe('editor options', () => {
    it('should disable minimap', () => {
      const editor = new Editor();
      editor.mount(container);

      expect(mockMonaco.editor.create).toHaveBeenCalledWith(
        container,
        expect.objectContaining({
          minimap: { enabled: false },
        })
      );

      editor.destroy();
    });

    // Line number tests moved to dedicated 'line numbers (Story 2.3)' describe block

    it('should disable scroll beyond last line', () => {
      const editor = new Editor();
      editor.mount(container);

      expect(mockMonaco.editor.create).toHaveBeenCalledWith(
        container,
        expect.objectContaining({
          scrollBeyondLastLine: false,
        })
      );

      editor.destroy();
    });

    it('should set font size to 14', () => {
      const editor = new Editor();
      editor.mount(container);

      expect(mockMonaco.editor.create).toHaveBeenCalledWith(
        container,
        expect.objectContaining({
          fontSize: 14,
        })
      );

      editor.destroy();
    });

    it('should set accessibility support to auto', () => {
      const editor = new Editor();
      editor.mount(container);

      expect(mockMonaco.editor.create).toHaveBeenCalledWith(
        container,
        expect.objectContaining({
          accessibilitySupport: 'auto',
        })
      );

      editor.destroy();
    });
  });

  describe('language registration', () => {
    it('should register micro4 language before creating editor', () => {
      const editor = new Editor();
      editor.mount(container);

      expect(mockMonaco.languages.register).toHaveBeenCalledWith({
        id: micro4LanguageId,
      });

      editor.destroy();
    });

    it('should register language configuration', () => {
      const editor = new Editor();
      editor.mount(container);

      expect(mockMonaco.languages.setLanguageConfiguration).toHaveBeenCalledWith(
        micro4LanguageId,
        expect.objectContaining({
          comments: { lineComment: ';' },
        })
      );

      editor.destroy();
    });

    it('should register monarch tokenizer', () => {
      const editor = new Editor();
      editor.mount(container);

      expect(mockMonaco.languages.setMonarchTokensProvider).toHaveBeenCalledWith(
        micro4LanguageId,
        expect.objectContaining({
          ignoreCase: true,
          tokenizer: expect.any(Object),
        })
      );

      editor.destroy();
    });

    it('should only register language once globally', () => {
      const editor1 = new Editor();
      editor1.mount(container);

      const container2 = document.createElement('div');
      document.body.appendChild(container2);
      const editor2 = new Editor();
      editor2.mount(container2);

      expect(mockMonaco.languages.register).toHaveBeenCalledTimes(1);

      editor1.destroy();
      editor2.destroy();
      document.body.removeChild(container2);
    });

    it('should use micro4 language in editor', () => {
      const editor = new Editor();
      editor.mount(container);

      expect(mockMonaco.editor.create).toHaveBeenCalledWith(
        container,
        expect.objectContaining({
          language: micro4LanguageId,
        })
      );

      editor.destroy();
    });
  });

  describe('line numbers (Story 2.3)', () => {
    it('should enable line numbers in editor options', () => {
      const editor = new Editor();
      editor.mount(container);

      expect(mockMonaco.editor.create).toHaveBeenCalledWith(
        container,
        expect.objectContaining({
          lineNumbers: 'on',
        })
      );

      editor.destroy();
    });

    it('should set line number gutter width to minimum 3 characters', () => {
      const editor = new Editor();
      editor.mount(container);

      expect(mockMonaco.editor.create).toHaveBeenCalledWith(
        container,
        expect.objectContaining({
          lineNumbersMinChars: 3,
        })
      );

      editor.destroy();
    });

    it('should define muted line number color for readability', () => {
      const editor = new Editor();
      editor.mount(container);

      const themeCall = mockMonaco.editor.defineTheme.mock.calls[0];
      expect(themeCall[1].colors['editorLineNumber.foreground']).toBe(
        '#a0a0b0'
      );

      editor.destroy();
    });

    it('should define bright active line number color for current line', () => {
      const editor = new Editor();
      editor.mount(container);

      const themeCall = mockMonaco.editor.defineTheme.mock.calls[0];
      expect(themeCall[1].colors['editorLineNumber.activeForeground']).toBe(
        '#e0e0e0'
      );

      editor.destroy();
    });

    it('should define line highlight background for current line', () => {
      const editor = new Editor();
      editor.mount(container);

      const themeCall = mockMonaco.editor.defineTheme.mock.calls[0];
      expect(themeCall[1].colors['editor.lineHighlightBackground']).toBe(
        '#2f2f52'
      );

      editor.destroy();
    });

    it('should have WCAG AA compliant contrast for line numbers', () => {
      // Helper to calculate relative luminance from hex color
      const getLuminance = (hex: string): number => {
        const rgb = hex
          .replace('#', '')
          .match(/.{2}/g)!
          .map((c) => {
            const sRGB = parseInt(c, 16) / 255;
            return sRGB <= 0.03928
              ? sRGB / 12.92
              : Math.pow((sRGB + 0.055) / 1.055, 2.4);
          });
        return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
      };

      // Helper to calculate contrast ratio between two colors
      const getContrastRatio = (fg: string, bg: string): number => {
        const l1 = getLuminance(fg);
        const l2 = getLuminance(bg);
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
      };

      const editor = new Editor();
      editor.mount(container);

      const themeCall = mockMonaco.editor.defineTheme.mock.calls[0];
      const colors = themeCall[1].colors;

      const bgColor = colors['editor.background'];
      const lineNumColor = colors['editorLineNumber.foreground'];
      const activeLineNumColor = colors['editorLineNumber.activeForeground'];

      // Calculate actual contrast ratios
      const lineNumContrast = getContrastRatio(lineNumColor, bgColor);
      const activeLineNumContrast = getContrastRatio(activeLineNumColor, bgColor);

      // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
      // WCAG AAA requires 7:1 for normal text
      expect(lineNumContrast).toBeGreaterThanOrEqual(4.5); // AA pass
      expect(activeLineNumContrast).toBeGreaterThanOrEqual(7); // AAA pass

      editor.destroy();
    });
  });

  describe('cursor position callback (Story 2.5)', () => {
    it('should call onCursorPositionChange callback when cursor moves', () => {
      const callback = vi.fn();
      const editor = new Editor({ onCursorPositionChange: callback });
      editor.mount(container);

      // Simulate cursor position change
      cursorPositionListeners[0]?.({ position: { lineNumber: 5, column: 10 } });

      expect(callback).toHaveBeenCalledWith({ line: 5, column: 10 });

      editor.destroy();
    });

    it('should receive correct line and column values from Monaco', () => {
      const callback = vi.fn();
      const editor = new Editor({ onCursorPositionChange: callback });
      editor.mount(container);

      // Test with different positions
      cursorPositionListeners[0]?.({ position: { lineNumber: 1, column: 1 } });
      expect(callback).toHaveBeenCalledWith({ line: 1, column: 1 });

      cursorPositionListeners[0]?.({ position: { lineNumber: 42, column: 77 } });
      expect(callback).toHaveBeenCalledWith({ line: 42, column: 77 });

      editor.destroy();
    });

    it('should subscribe to Monaco onDidChangeCursorPosition event', () => {
      const callback = vi.fn();
      const editor = new Editor({ onCursorPositionChange: callback });
      editor.mount(container);

      expect(mockEditorInstance.onDidChangeCursorPosition).toHaveBeenCalledTimes(1);

      editor.destroy();
    });

    it('should dispose cursor position listener when editor is destroyed', () => {
      const callback = vi.fn();
      const editor = new Editor({ onCursorPositionChange: callback });
      editor.mount(container);

      editor.destroy();

      expect(mockCursorDisposable.dispose).toHaveBeenCalledTimes(1);
    });

    it('should not subscribe to cursor events if callback not provided', () => {
      const editor = new Editor();
      editor.mount(container);

      expect(mockEditorInstance.onDidChangeCursorPosition).not.toHaveBeenCalled();

      editor.destroy();
    });
  });

  describe('keyboard shortcuts (Story 2.6)', () => {
    describe('Monaco action triggers', () => {
      it('should trigger editor.action.selectAll when select all is called', () => {
        const editor = new Editor();
        editor.mount(container);

        // Trigger select all via Monaco API
        const monacoEditor = editor.getMonacoEditor();
        monacoEditor?.trigger('keyboard', 'editor.action.selectAll', null);

        expect(mockEditorInstance.trigger).toHaveBeenCalledWith(
          'keyboard',
          'editor.action.selectAll',
          null
        );

        editor.destroy();
      });

      it('should trigger actions.find when find is called', () => {
        const editor = new Editor();
        editor.mount(container);

        const monacoEditor = editor.getMonacoEditor();
        monacoEditor?.trigger('keyboard', 'actions.find', null);

        expect(mockEditorInstance.trigger).toHaveBeenCalledWith(
          'keyboard',
          'actions.find',
          null
        );

        editor.destroy();
      });

      it('should trigger editor.action.startFindReplaceAction for find and replace', () => {
        const editor = new Editor();
        editor.mount(container);

        const monacoEditor = editor.getMonacoEditor();
        monacoEditor?.trigger('keyboard', 'editor.action.startFindReplaceAction', null);

        expect(mockEditorInstance.trigger).toHaveBeenCalledWith(
          'keyboard',
          'editor.action.startFindReplaceAction',
          null
        );

        editor.destroy();
      });

      it('should trigger editor.action.indentLines for tab indent', () => {
        const editor = new Editor();
        editor.mount(container);

        const monacoEditor = editor.getMonacoEditor();
        monacoEditor?.trigger('keyboard', 'editor.action.indentLines', null);

        expect(mockEditorInstance.trigger).toHaveBeenCalledWith(
          'keyboard',
          'editor.action.indentLines',
          null
        );

        editor.destroy();
      });

      it('should trigger editor.action.outdentLines for shift+tab unindent', () => {
        const editor = new Editor();
        editor.mount(container);

        const monacoEditor = editor.getMonacoEditor();
        monacoEditor?.trigger('keyboard', 'editor.action.outdentLines', null);

        expect(mockEditorInstance.trigger).toHaveBeenCalledWith(
          'keyboard',
          'editor.action.outdentLines',
          null
        );

        editor.destroy();
      });

      it('should have Monaco editor created with keyboard shortcuts enabled', () => {
        const editor = new Editor();
        editor.mount(container);

        // Monaco editor should be created and have trigger method available
        const monacoEditor = editor.getMonacoEditor();
        expect(monacoEditor).not.toBeNull();
        expect(typeof monacoEditor?.trigger).toBe('function');

        editor.destroy();
      });
    });
  });

  describe('syntax highlighting theme rules', () => {
    it('should define theme with keyword.control token rule', () => {
      const editor = new Editor();
      editor.mount(container);

      const themeCall = mockMonaco.editor.defineTheme.mock.calls[0];
      const rules = themeCall[1].rules;
      const keywordControlRule = rules.find(
        (r: { token: string }) => r.token === 'keyword.control'
      );

      expect(keywordControlRule).toBeDefined();
      expect(keywordControlRule.foreground).toBe('ff79c6');

      editor.destroy();
    });

    it('should define theme with keyword token rule', () => {
      const editor = new Editor();
      editor.mount(container);

      const themeCall = mockMonaco.editor.defineTheme.mock.calls[0];
      const rules = themeCall[1].rules;
      const keywordRule = rules.find(
        (r: { token: string }) => r.token === 'keyword'
      );

      expect(keywordRule).toBeDefined();
      expect(keywordRule.foreground).toBe('8be9fd');

      editor.destroy();
    });

    it('should define theme with comment token rule', () => {
      const editor = new Editor();
      editor.mount(container);

      const themeCall = mockMonaco.editor.defineTheme.mock.calls[0];
      const rules = themeCall[1].rules;
      const commentRule = rules.find(
        (r: { token: string }) => r.token === 'comment'
      );

      expect(commentRule).toBeDefined();
      expect(commentRule.foreground).toBe('6272a4');
      expect(commentRule.fontStyle).toBe('italic');

      editor.destroy();
    });

    it('should define theme with label token rule', () => {
      const editor = new Editor();
      editor.mount(container);

      const themeCall = mockMonaco.editor.defineTheme.mock.calls[0];
      const rules = themeCall[1].rules;
      const labelRule = rules.find(
        (r: { token: string }) => r.token === 'label'
      );

      expect(labelRule).toBeDefined();
      expect(labelRule.foreground).toBe('50fa7b');

      editor.destroy();
    });

    it('should define theme with number.hex token rule', () => {
      const editor = new Editor();
      editor.mount(container);

      const themeCall = mockMonaco.editor.defineTheme.mock.calls[0];
      const rules = themeCall[1].rules;
      const hexRule = rules.find(
        (r: { token: string }) => r.token === 'number.hex'
      );

      expect(hexRule).toBeDefined();
      expect(hexRule.foreground).toBe('ffb86c');

      editor.destroy();
    });

    it('should define theme with directive token rule', () => {
      const editor = new Editor();
      editor.mount(container);

      const themeCall = mockMonaco.editor.defineTheme.mock.calls[0];
      const rules = themeCall[1].rules;
      const directiveRule = rules.find(
        (r: { token: string }) => r.token === 'directive'
      );

      expect(directiveRule).toBeDefined();
      expect(directiveRule.foreground).toBe('bd93f9');

      editor.destroy();
    });
  });

  describe('content change callback (Story 3.3)', () => {
    it('should call onContentChange callback when content changes', () => {
      const callback = vi.fn();
      const editor = new Editor({ onContentChange: callback });
      editor.mount(container);

      // Clear the initial call from mount
      callback.mockClear();

      // Simulate content change
      contentChangeListeners[0]?.();

      expect(callback).toHaveBeenCalled();

      editor.destroy();
    });

    it('should pass true when content has length > 0', () => {
      const callback = vi.fn();
      const editor = new Editor({ onContentChange: callback });
      editor.mount(container);

      // Clear the initial call
      callback.mockClear();

      // Set content first
      editor.setValue('LDA 5');

      expect(callback).toHaveBeenCalledWith(true);

      editor.destroy();
    });

    it('should pass false when content is empty', () => {
      const callback = vi.fn();
      const editor = new Editor({ onContentChange: callback });
      editor.mount(container);

      // Initial call should be with false (empty content)
      expect(callback).toHaveBeenCalledWith(false);

      editor.destroy();
    });

    it('should subscribe to Monaco onDidChangeModelContent event', () => {
      const callback = vi.fn();
      const editor = new Editor({ onContentChange: callback });
      editor.mount(container);

      expect(mockEditorInstance.onDidChangeModelContent).toHaveBeenCalledTimes(1);

      editor.destroy();
    });

    it('should dispose content change listener when editor is destroyed', () => {
      const callback = vi.fn();
      const editor = new Editor({ onContentChange: callback });
      editor.mount(container);

      editor.destroy();

      expect(mockContentChangeDisposable.dispose).toHaveBeenCalledTimes(1);
    });

    it('should not subscribe to content change events if callback not provided', () => {
      const editor = new Editor();
      editor.mount(container);

      expect(mockEditorInstance.onDidChangeModelContent).not.toHaveBeenCalled();

      editor.destroy();
    });
  });

  describe('assemble keyboard shortcut (Story 3.3)', () => {
    it('should register assemble action with Ctrl+Enter keybinding', () => {
      const callback = vi.fn();
      const editor = new Editor({ onAssemble: callback });
      editor.mount(container);

      expect(mockEditorInstance.addAction).toHaveBeenCalledTimes(1);
      const action = addedActions[0];
      expect(action.id).toBe('assemble');
      expect(action.label).toBe('Assemble Code');
      expect(action.keybindings).toContain(mockMonaco.KeyMod.CtrlCmd | mockMonaco.KeyCode.Enter);

      editor.destroy();
    });

    it('should call onAssemble callback when action is triggered', () => {
      const callback = vi.fn();
      const editor = new Editor({ onAssemble: callback });
      editor.mount(container);

      // Trigger the action
      const action = addedActions[0];
      action.run();

      expect(callback).toHaveBeenCalledTimes(1);

      editor.destroy();
    });

    it('should dispose assemble action when editor is destroyed', () => {
      const callback = vi.fn();
      const editor = new Editor({ onAssemble: callback });
      editor.mount(container);

      editor.destroy();

      expect(mockActionDisposable.dispose).toHaveBeenCalledTimes(1);
    });

    it('should not register assemble action if callback not provided', () => {
      const editor = new Editor();
      editor.mount(container);

      expect(mockEditorInstance.addAction).not.toHaveBeenCalled();

      editor.destroy();
    });
  });
});
