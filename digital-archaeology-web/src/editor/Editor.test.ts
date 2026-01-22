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
    languages: {
      register: vi.fn(),
      setLanguageConfiguration: vi.fn(),
      setMonarchTokensProvider: vi.fn(),
    },
  };

  return { mockEditorInstance, mockMonaco };
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
});
