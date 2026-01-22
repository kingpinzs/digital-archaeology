import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Monaco editor using vi.hoisted for proper hoisting
const { mockEditorInstance, mockMonaco } = vi.hoisted(() => {
  // Define mock model type to avoid casting issues
  type MockModel = { uri: string } | null;

  const mockEditorInstance = {
    dispose: vi.fn(),
    getValue: vi.fn(() => ''),
    setValue: vi.fn(),
    getModel: vi.fn((): MockModel => null),
    focus: vi.fn(),
    layout: vi.fn(),
  };

  const mockMonaco = {
    editor: {
      create: vi.fn(() => mockEditorInstance),
      defineTheme: vi.fn(),
    },
  };

  return { mockEditorInstance, mockMonaco };
});

vi.mock('monaco-editor', () => mockMonaco);

import { Editor, resetThemeRegistration } from './Editor';

describe('Editor', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    vi.clearAllMocks();
    // Reset global theme state for each test
    resetThemeRegistration();
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
          rules: [],
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
          language: 'plaintext',
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
      const mockModel = { uri: 'test-uri' };
      mockEditorInstance.getModel.mockReturnValueOnce(mockModel);

      const editor = new Editor();
      editor.mount(container);

      expect(editor.getModel()).toBe(mockModel);

      editor.destroy();
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

    it('should define theme with correct line number color', () => {
      const editor = new Editor();
      editor.mount(container);

      const themeCall = mockMonaco.editor.defineTheme.mock.calls[0];
      expect(themeCall[1].colors['editorLineNumber.foreground']).toBe('#a0a0b0');

      editor.destroy();
    });
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

    it('should enable line numbers', () => {
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
});
