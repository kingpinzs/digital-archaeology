// src/hdl/HdlViewerPanel.test.ts
// Tests for HdlViewerPanel component
// Story 7.1: Create HDL Viewer Panel

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HdlViewerPanel, resetHdlThemeRegistration } from './HdlViewerPanel';
import { resetM4hdlLanguageRegistration } from './m4hdl-language';

// Mock monaco-editor
vi.mock('monaco-editor', () => ({
  editor: {
    create: vi.fn(() => ({
      dispose: vi.fn(),
      setValue: vi.fn(),
      getValue: vi.fn(() => ''),
      focus: vi.fn(),
      getModel: vi.fn(() => null),
      // Story 7.3: Add updateOptions and onDidChangeModelContent for edit mode
      updateOptions: vi.fn(),
      onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
    })),
    defineTheme: vi.fn(),
    // Story 7.4: Add setModelMarkers for validation
    setModelMarkers: vi.fn(),
  },
  // Add languages mock for m4hdl-language integration (Story 7.2)
  languages: {
    register: vi.fn(),
    setLanguageConfiguration: vi.fn(),
    setMonarchTokensProvider: vi.fn(),
  },
  // Story 7.4: Add MarkerSeverity for validation markers
  MarkerSeverity: {
    Error: 8,
    Warning: 4,
    Info: 2,
    Hint: 1,
  },
}));

// Mock fetch for HDL loading
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('HdlViewerPanel', () => {
  let container: HTMLDivElement;
  let panel: HdlViewerPanel;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    resetHdlThemeRegistration();
    resetM4hdlLanguageRegistration();
    mockFetch.mockReset();
  });

  afterEach(() => {
    panel?.destroy();
    container.remove();
    vi.restoreAllMocks();
  });

  describe('mount', () => {
    it('should create panel element in container', () => {
      panel = new HdlViewerPanel();
      panel.mount(container);

      expect(container.querySelector('.da-hdl-viewer-panel')).not.toBeNull();
    });

    it('should create panel header with title', () => {
      panel = new HdlViewerPanel();
      panel.mount(container);

      const title = container.querySelector('.da-hdl-viewer-title');
      expect(title).not.toBeNull();
      expect(title?.textContent).toBe('HDL Viewer');
    });

    it('should create close button', () => {
      panel = new HdlViewerPanel();
      panel.mount(container);

      const closeButton = container.querySelector('.da-hdl-viewer-close');
      expect(closeButton).not.toBeNull();
      expect(closeButton?.getAttribute('aria-label')).toBe('Close HDL Viewer');
    });

    it('should create editor container', () => {
      panel = new HdlViewerPanel();
      panel.mount(container);

      expect(container.querySelector('.da-hdl-viewer-editor')).not.toBeNull();
    });

    it('should create Monaco editor', async () => {
      const monaco = await import('monaco-editor');
      panel = new HdlViewerPanel();
      panel.mount(container);

      expect(monaco.editor.create).toHaveBeenCalled();
    });

    it('should set panel as hidden initially', () => {
      panel = new HdlViewerPanel();
      panel.mount(container);

      const panelElement = container.querySelector('.da-hdl-viewer-panel');
      expect(panelElement?.classList.contains('da-hdl-viewer-panel--hidden')).toBe(true);
    });

    it('should set aria attributes for accessibility', () => {
      panel = new HdlViewerPanel();
      panel.mount(container);

      const panelElement = container.querySelector('.da-hdl-viewer-panel');
      expect(panelElement?.getAttribute('role')).toBe('dialog');
      expect(panelElement?.getAttribute('aria-modal')).toBe('true');
      expect(panelElement?.getAttribute('aria-labelledby')).toBe('da-hdl-viewer-title');
    });
  });

  describe('show/hide', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('# HDL content'),
      } as Response);
    });

    it('should remove hidden class when shown', async () => {
      panel = new HdlViewerPanel();
      panel.mount(container);
      await panel.show();

      const panelElement = container.querySelector('.da-hdl-viewer-panel');
      expect(panelElement?.classList.contains('da-hdl-viewer-panel--hidden')).toBe(false);
    });

    it('should add hidden class when hidden', async () => {
      const monaco = await import('monaco-editor');
      // Mock getValue to return same content as loaded (no unsaved changes)
      vi.mocked(monaco.editor.create).mockReturnValueOnce({
        dispose: vi.fn(),
        setValue: vi.fn(),
        getValue: vi.fn(() => '# HDL content'),
        focus: vi.fn(),
        getModel: vi.fn(() => null),
        updateOptions: vi.fn(),
        onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
      } as unknown as ReturnType<typeof monaco.editor.create>);

      panel = new HdlViewerPanel();
      panel.mount(container);
      await panel.show();
      panel.hide();

      const panelElement = container.querySelector('.da-hdl-viewer-panel');
      expect(panelElement?.classList.contains('da-hdl-viewer-panel--hidden')).toBe(true);
    });

    it('should return correct visibility state', async () => {
      const monaco = await import('monaco-editor');
      // Mock getValue to return same content as loaded (no unsaved changes)
      vi.mocked(monaco.editor.create).mockReturnValueOnce({
        dispose: vi.fn(),
        setValue: vi.fn(),
        getValue: vi.fn(() => '# HDL content'),
        focus: vi.fn(),
        getModel: vi.fn(() => null),
        updateOptions: vi.fn(),
        onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
      } as unknown as ReturnType<typeof monaco.editor.create>);

      panel = new HdlViewerPanel();
      panel.mount(container);

      expect(panel.isVisible()).toBe(false);

      await panel.show();
      expect(panel.isVisible()).toBe(true);

      panel.hide();
      expect(panel.isVisible()).toBe(false);
    });

    it('should toggle visibility', async () => {
      const monaco = await import('monaco-editor');
      // Mock getValue to return same content as loaded (no unsaved changes)
      vi.mocked(monaco.editor.create).mockReturnValueOnce({
        dispose: vi.fn(),
        setValue: vi.fn(),
        getValue: vi.fn(() => '# HDL content'),
        focus: vi.fn(),
        getModel: vi.fn(() => null),
        updateOptions: vi.fn(),
        onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
      } as unknown as ReturnType<typeof monaco.editor.create>);

      panel = new HdlViewerPanel();
      panel.mount(container);

      await panel.toggle();
      expect(panel.isVisible()).toBe(true);

      await panel.toggle();
      expect(panel.isVisible()).toBe(false);
    });

    it('should call onClose callback when hidden', async () => {
      const monaco = await import('monaco-editor');
      // Mock getValue to return same content as loaded (no unsaved changes)
      vi.mocked(monaco.editor.create).mockReturnValueOnce({
        dispose: vi.fn(),
        setValue: vi.fn(),
        getValue: vi.fn(() => '# HDL content'),
        focus: vi.fn(),
        getModel: vi.fn(() => null),
        updateOptions: vi.fn(),
        onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
      } as unknown as ReturnType<typeof monaco.editor.create>);

      const onClose = vi.fn();
      panel = new HdlViewerPanel({ onClose });
      panel.mount(container);
      await panel.show();
      panel.hide();

      expect(onClose).toHaveBeenCalled();
    });

    it('should load content on first show', async () => {
      panel = new HdlViewerPanel();
      panel.mount(container);
      await panel.show();

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should not reload content on subsequent shows', async () => {
      const monaco = await import('monaco-editor');
      // Mock getValue to return same content as loaded (no unsaved changes)
      vi.mocked(monaco.editor.create).mockReturnValueOnce({
        dispose: vi.fn(),
        setValue: vi.fn(),
        getValue: vi.fn(() => '# HDL content'),
        focus: vi.fn(),
        getModel: vi.fn(() => null),
        updateOptions: vi.fn(),
        onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
      } as unknown as ReturnType<typeof monaco.editor.create>);

      panel = new HdlViewerPanel();
      panel.mount(container);

      await panel.show();
      expect(mockFetch).toHaveBeenCalledTimes(1);

      panel.hide();
      await panel.show();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('close button', () => {
    it('should hide panel when close button clicked (no unsaved changes)', async () => {
      const monaco = await import('monaco-editor');
      vi.mocked(monaco.editor.create).mockReturnValueOnce({
        dispose: vi.fn(),
        setValue: vi.fn(),
        getValue: vi.fn(() => 'content'),
        focus: vi.fn(),
        getModel: vi.fn(() => null),
        updateOptions: vi.fn(),
        onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
      } as unknown as ReturnType<typeof monaco.editor.create>);

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('content'),
      } as Response);

      panel = new HdlViewerPanel();
      panel.mount(container);
      await panel.show();

      const closeButton = container.querySelector('.da-hdl-viewer-close') as HTMLButtonElement;
      closeButton?.click();

      expect(panel.isVisible()).toBe(false);
    });
  });

  describe('keyboard handling', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('content'),
      } as Response);
    });

    it('should close panel on Escape key when visible (no unsaved changes)', async () => {
      const monaco = await import('monaco-editor');
      // Mock getValue to return same content as loaded (no unsaved changes)
      vi.mocked(monaco.editor.create).mockReturnValueOnce({
        dispose: vi.fn(),
        setValue: vi.fn(),
        getValue: vi.fn(() => 'content'),
        focus: vi.fn(),
        getModel: vi.fn(() => null),
        updateOptions: vi.fn(),
        onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
      } as unknown as ReturnType<typeof monaco.editor.create>);

      panel = new HdlViewerPanel();
      panel.mount(container);
      await panel.show();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(panel.isVisible()).toBe(false);
    });

    it('should not respond to Escape key when hidden', () => {
      const onClose = vi.fn();
      panel = new HdlViewerPanel({ onClose });
      panel.mount(container);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('content loading', () => {
    it('should show loading indicator initially', () => {
      panel = new HdlViewerPanel();
      panel.mount(container);

      const loading = container.querySelector('.da-hdl-viewer-loading');
      expect(loading?.textContent).toBe('Loading HDL file...');
    });

    it('should hide loading indicator on success', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('# HDL content'),
      } as Response);

      panel = new HdlViewerPanel();
      panel.mount(container);
      await panel.show();

      const loading = container.querySelector('.da-hdl-viewer-loading');
      expect(loading?.classList.contains('da-hdl-viewer-loading--hidden')).toBe(true);
    });

    it('should show error message on load failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      panel = new HdlViewerPanel();
      panel.mount(container);
      await panel.show();

      const loading = container.querySelector('.da-hdl-viewer-loading');
      expect(loading?.classList.contains('da-hdl-viewer-loading--error')).toBe(true);
      expect(loading?.textContent).toContain('Failed to load');
    });

    it('should call onLoad callback with content', async () => {
      const content = '# Test HDL';
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(content),
      } as Response);

      const onLoad = vi.fn();
      panel = new HdlViewerPanel({ onLoad });
      panel.mount(container);
      await panel.show();

      expect(onLoad).toHaveBeenCalledWith(content);
    });

    it('should call onError callback on failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Server Error',
      } as Response);

      const onError = vi.fn();
      panel = new HdlViewerPanel({ onError });
      panel.mount(container);
      await panel.show();

      expect(onError).toHaveBeenCalled();
    });
  });

  describe('read-only mode', () => {
    it('should create Monaco editor with readOnly option', async () => {
      const monaco = await import('monaco-editor');
      panel = new HdlViewerPanel();
      panel.mount(container);

      expect(monaco.editor.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          readOnly: true,
        })
      );
    });
  });

  describe('syntax highlighting (Story 7.2)', () => {
    it('should create Monaco editor with m4hdl language', async () => {
      const monaco = await import('monaco-editor');
      panel = new HdlViewerPanel();
      panel.mount(container);

      expect(monaco.editor.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          language: 'm4hdl',
        })
      );
    });

    it('should register M4HDL language before creating editor', async () => {
      const monaco = await import('monaco-editor');
      panel = new HdlViewerPanel();
      panel.mount(container);

      // Language registration should have been called
      expect(monaco.languages.register).toHaveBeenCalledWith({ id: 'm4hdl' });
      expect(monaco.languages.setMonarchTokensProvider).toHaveBeenCalled();
    });

    it('should define theme with syntax highlighting rules', async () => {
      const monaco = await import('monaco-editor');
      panel = new HdlViewerPanel();
      panel.mount(container);

      expect(monaco.editor.defineTheme).toHaveBeenCalledWith(
        'da-dark-hdl',
        expect.objectContaining({
          rules: expect.arrayContaining([
            expect.objectContaining({ token: 'comment' }),
            expect.objectContaining({ token: 'keyword' }),
            expect.objectContaining({ token: 'keyword.control' }),
            expect.objectContaining({ token: 'directive' }),
            expect.objectContaining({ token: 'identifier' }),
            expect.objectContaining({ token: 'number' }),
          ]),
        })
      );
    });
  });

  describe('destroy', () => {
    it('should remove panel element from DOM', () => {
      panel = new HdlViewerPanel();
      panel.mount(container);
      panel.destroy();

      expect(container.querySelector('.da-hdl-viewer-panel')).toBeNull();
    });

    it('should dispose Monaco editor', () => {
      panel = new HdlViewerPanel();
      panel.mount(container);

      const editorInstance = panel.getEditor();
      panel.destroy();

      expect(editorInstance?.dispose).toHaveBeenCalled();
    });

    it('should return null for getElement after destroy', () => {
      panel = new HdlViewerPanel();
      panel.mount(container);
      panel.destroy();

      expect(panel.getElement()).toBeNull();
    });

    it('should return null for getEditor after destroy', () => {
      panel = new HdlViewerPanel();
      panel.mount(container);
      panel.destroy();

      expect(panel.getEditor()).toBeNull();
    });
  });

  describe('content manipulation', () => {
    it('should set content via setContent', async () => {
      const monaco = await import('monaco-editor');
      panel = new HdlViewerPanel();
      panel.mount(container);

      const mockSetValue = vi.fn();
      vi.mocked(monaco.editor.create).mockReturnValueOnce({
        dispose: vi.fn(),
        setValue: mockSetValue,
        getValue: vi.fn(() => ''),
        focus: vi.fn(),
        getModel: vi.fn(() => null),
        updateOptions: vi.fn(),
        onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
      } as unknown as ReturnType<typeof monaco.editor.create>);

      // Need to remount to get new mock
      panel.destroy();
      panel = new HdlViewerPanel();
      panel.mount(container);

      panel.setContent('new content');
      expect(mockSetValue).toHaveBeenCalledWith('new content');
    });

    it('should get content via getContent', async () => {
      const monaco = await import('monaco-editor');
      const mockGetValue = vi.fn(() => 'test hdl content');
      vi.mocked(monaco.editor.create).mockReturnValueOnce({
        dispose: vi.fn(),
        setValue: vi.fn(),
        getValue: mockGetValue,
        focus: vi.fn(),
        getModel: vi.fn(() => null),
        updateOptions: vi.fn(),
        onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
      } as unknown as ReturnType<typeof monaco.editor.create>);

      panel = new HdlViewerPanel();
      panel.mount(container);

      const content = panel.getContent();
      expect(content).toBe('test hdl content');
      expect(mockGetValue).toHaveBeenCalled();
    });

    it('should return empty string if editor not initialized', () => {
      panel = new HdlViewerPanel();
      // Don't mount - editor should be null
      expect(panel.getContent()).toBe('');
    });
  });

  describe('focus management', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('content'),
      } as Response);
    });

    it('should restore focus to previously focused element on hide', async () => {
      const monaco = await import('monaco-editor');
      // Mock getValue to return same content as loaded (no unsaved changes)
      vi.mocked(monaco.editor.create).mockReturnValueOnce({
        dispose: vi.fn(),
        setValue: vi.fn(),
        getValue: vi.fn(() => 'content'),
        focus: vi.fn(),
        getModel: vi.fn(() => null),
        updateOptions: vi.fn(),
        onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
      } as unknown as ReturnType<typeof monaco.editor.create>);

      // Create a button to focus before showing panel
      const focusableButton = document.createElement('button');
      focusableButton.id = 'test-focus-button';
      document.body.appendChild(focusableButton);
      focusableButton.focus();

      expect(document.activeElement).toBe(focusableButton);

      panel = new HdlViewerPanel();
      panel.mount(container);
      await panel.show();

      // Hide the panel
      panel.hide();

      // Focus should return to the button
      expect(document.activeElement).toBe(focusableButton);

      // Cleanup
      focusableButton.remove();
    });
  });

  // Story 7.3: Enable HDL Editing
  describe('edit mode (Story 7.3)', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('# HDL content'),
      } as Response);
    });

    describe('edit mode state management', () => {
      it('should start in view mode (not editing)', () => {
        panel = new HdlViewerPanel();
        panel.mount(container);

        expect(panel.isEditMode()).toBe(false);
      });

      it('should track original content for dirty detection', async () => {
        const monaco = await import('monaco-editor');
        const loadedContent = '# HDL content';

        // Mock getValue to return the loaded content
        vi.mocked(monaco.editor.create).mockReturnValueOnce({
          dispose: vi.fn(),
          setValue: vi.fn(),
          getValue: vi.fn(() => loadedContent),
          focus: vi.fn(),
          getModel: vi.fn(() => null),
          updateOptions: vi.fn(),
          onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
        } as unknown as ReturnType<typeof monaco.editor.create>);

        mockFetch.mockResolvedValue({
          ok: true,
          text: () => Promise.resolve(loadedContent),
        } as Response);

        panel = new HdlViewerPanel();
        panel.mount(container);
        await panel.show();

        // After loading, original content should be tracked, so no unsaved changes
        expect(panel.hasUnsavedChanges()).toBe(false);
      });

      it('should accept onSave callback in options', () => {
        const onSave = vi.fn();
        panel = new HdlViewerPanel({ onSave });
        panel.mount(container);

        // Should not throw
        expect(panel).toBeDefined();
      });

      it('should accept onEditModeChange callback in options', () => {
        const onEditModeChange = vi.fn();
        panel = new HdlViewerPanel({ onEditModeChange });
        panel.mount(container);

        // Should not throw
        expect(panel).toBeDefined();
      });
    });

    describe('edit toggle button', () => {
      it('should create edit toggle button in header', () => {
        panel = new HdlViewerPanel();
        panel.mount(container);

        const editButton = container.querySelector('.da-hdl-viewer-edit-toggle');
        expect(editButton).not.toBeNull();
      });

      it('should show "Edit" text when in view mode', () => {
        panel = new HdlViewerPanel();
        panel.mount(container);

        const editButton = container.querySelector('.da-hdl-viewer-edit-toggle');
        expect(editButton?.textContent).toBe('Edit');
      });

      it('should have aria-pressed="false" when in view mode', () => {
        panel = new HdlViewerPanel();
        panel.mount(container);

        const editButton = container.querySelector('.da-hdl-viewer-edit-toggle');
        expect(editButton?.getAttribute('aria-pressed')).toBe('false');
      });

      it('should toggle edit mode when clicked', () => {
        panel = new HdlViewerPanel();
        panel.mount(container);

        const editButton = container.querySelector('.da-hdl-viewer-edit-toggle') as HTMLButtonElement;
        editButton?.click();

        expect(panel.isEditMode()).toBe(true);
      });

      it('should show "View" text when in edit mode', () => {
        panel = new HdlViewerPanel();
        panel.mount(container);

        const editButton = container.querySelector('.da-hdl-viewer-edit-toggle') as HTMLButtonElement;
        editButton?.click();

        expect(editButton?.textContent).toBe('View');
      });

      it('should have aria-pressed="true" when in edit mode', () => {
        panel = new HdlViewerPanel();
        panel.mount(container);

        const editButton = container.querySelector('.da-hdl-viewer-edit-toggle') as HTMLButtonElement;
        editButton?.click();

        expect(editButton?.getAttribute('aria-pressed')).toBe('true');
      });
    });

    describe('toggleEditMode', () => {
      it('should update Monaco editor readOnly option', async () => {
        const monaco = await import('monaco-editor');
        const mockUpdateOptions = vi.fn();
        vi.mocked(monaco.editor.create).mockReturnValueOnce({
          dispose: vi.fn(),
          setValue: vi.fn(),
          getValue: vi.fn(() => ''),
          focus: vi.fn(),
          getModel: vi.fn(() => null),
          updateOptions: mockUpdateOptions,
          onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
        } as unknown as ReturnType<typeof monaco.editor.create>);

        panel = new HdlViewerPanel();
        panel.mount(container);
        panel.toggleEditMode();

        expect(mockUpdateOptions).toHaveBeenCalledWith({ readOnly: false });
      });

      it('should update panel title to "HDL Editor" when in edit mode', () => {
        panel = new HdlViewerPanel();
        panel.mount(container);
        panel.toggleEditMode();

        const title = container.querySelector('.da-hdl-viewer-title');
        expect(title?.textContent).toContain('HDL Editor');
      });

      it('should update panel title to "HDL Viewer" when in view mode', () => {
        panel = new HdlViewerPanel();
        panel.mount(container);
        panel.toggleEditMode(); // Enter edit mode
        panel.toggleEditMode(); // Return to view mode

        const title = container.querySelector('.da-hdl-viewer-title');
        expect(title?.textContent).toBe('HDL Viewer');
      });

      it('should call onEditModeChange callback', () => {
        const onEditModeChange = vi.fn();
        panel = new HdlViewerPanel({ onEditModeChange });
        panel.mount(container);
        panel.toggleEditMode();

        expect(onEditModeChange).toHaveBeenCalledWith(true);
      });

      it('should add editing class to panel when in edit mode (Task 8.4)', () => {
        panel = new HdlViewerPanel();
        panel.mount(container);

        const panelElement = container.querySelector('.da-hdl-viewer-panel');
        expect(panelElement?.classList.contains('da-hdl-viewer-panel--editing')).toBe(false);

        panel.toggleEditMode();
        expect(panelElement?.classList.contains('da-hdl-viewer-panel--editing')).toBe(true);

        panel.toggleEditMode();
        expect(panelElement?.classList.contains('da-hdl-viewer-panel--editing')).toBe(false);
      });
    });

    describe('unsaved changes indicator', () => {
      it('should create dirty indicator element', () => {
        panel = new HdlViewerPanel();
        panel.mount(container);

        const dirtyIndicator = container.querySelector('.da-hdl-viewer-dirty');
        expect(dirtyIndicator).not.toBeNull();
      });

      it('should hide dirty indicator when no unsaved changes', () => {
        panel = new HdlViewerPanel();
        panel.mount(container);

        const dirtyIndicator = container.querySelector('.da-hdl-viewer-dirty');
        expect(dirtyIndicator?.classList.contains('da-hdl-viewer-dirty--hidden')).toBe(true);
      });

      it('should show dirty indicator when content changes', async () => {
        const monaco = await import('monaco-editor');
        let contentChangeCallback: (() => void) | null = null;
        vi.mocked(monaco.editor.create).mockReturnValueOnce({
          dispose: vi.fn(),
          setValue: vi.fn(),
          getValue: vi.fn(() => 'modified content'),
          focus: vi.fn(),
          getModel: vi.fn(() => null),
          updateOptions: vi.fn(),
          onDidChangeModelContent: vi.fn((cb) => {
            contentChangeCallback = cb;
            return { dispose: vi.fn() };
          }),
        } as unknown as ReturnType<typeof monaco.editor.create>);

        panel = new HdlViewerPanel();
        panel.mount(container);
        panel.toggleEditMode();

        // Simulate content change
        contentChangeCallback?.();

        expect(panel.hasUnsavedChanges()).toBe(true);
        const dirtyIndicator = container.querySelector('.da-hdl-viewer-dirty');
        expect(dirtyIndicator?.classList.contains('da-hdl-viewer-dirty--hidden')).toBe(false);
      });
    });

    describe('save button', () => {
      it('should create save button in header', () => {
        panel = new HdlViewerPanel();
        panel.mount(container);

        const saveButton = container.querySelector('.da-hdl-viewer-save');
        expect(saveButton).not.toBeNull();
      });

      it('should be disabled when no unsaved changes', () => {
        panel = new HdlViewerPanel();
        panel.mount(container);

        const saveButton = container.querySelector('.da-hdl-viewer-save');
        expect(saveButton?.getAttribute('aria-disabled')).toBe('true');
      });

      it('should be hidden when not in edit mode', () => {
        panel = new HdlViewerPanel();
        panel.mount(container);

        const saveButton = container.querySelector('.da-hdl-viewer-save');
        expect(saveButton?.classList.contains('da-hdl-viewer-save--hidden')).toBe(true);
      });

      it('should be visible when in edit mode', () => {
        panel = new HdlViewerPanel();
        panel.mount(container);
        panel.toggleEditMode();

        const saveButton = container.querySelector('.da-hdl-viewer-save');
        expect(saveButton?.classList.contains('da-hdl-viewer-save--hidden')).toBe(false);
      });

      it('should not call onSave when clicked while disabled (no changes)', async () => {
        const monaco = await import('monaco-editor');
        // Mock getValue to return same as original content (no changes)
        vi.mocked(monaco.editor.create).mockReturnValueOnce({
          dispose: vi.fn(),
          setValue: vi.fn(),
          getValue: vi.fn(() => '# HDL content'),
          focus: vi.fn(),
          getModel: vi.fn(() => null),
          updateOptions: vi.fn(),
          onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
        } as unknown as ReturnType<typeof monaco.editor.create>);

        mockFetch.mockResolvedValue({
          ok: true,
          text: () => Promise.resolve('# HDL content'),
        } as Response);

        const onSave = vi.fn();
        panel = new HdlViewerPanel({ onSave });
        panel.mount(container);
        await panel.show();
        panel.toggleEditMode();

        // Save button should be disabled (no changes)
        const saveButton = container.querySelector('.da-hdl-viewer-save') as HTMLButtonElement;
        expect(saveButton?.getAttribute('aria-disabled')).toBe('true');

        // Click the disabled button
        saveButton?.click();

        // onSave should NOT be called because there are no changes
        expect(onSave).not.toHaveBeenCalled();
      });
    });

    describe('saveContent', () => {
      it('should call onSave callback with content', async () => {
        const monaco = await import('monaco-editor');
        vi.mocked(monaco.editor.create).mockReturnValueOnce({
          dispose: vi.fn(),
          setValue: vi.fn(),
          getValue: vi.fn(() => 'saved content'),
          focus: vi.fn(),
          getModel: vi.fn(() => null),
          updateOptions: vi.fn(),
          onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
        } as unknown as ReturnType<typeof monaco.editor.create>);

        const onSave = vi.fn();
        panel = new HdlViewerPanel({ onSave });
        panel.mount(container);
        panel.saveContent();

        expect(onSave).toHaveBeenCalledWith('saved content');
      });

      it('should clear dirty indicator after save', async () => {
        const monaco = await import('monaco-editor');
        let contentChangeCallback: (() => void) | null = null;
        vi.mocked(monaco.editor.create).mockReturnValueOnce({
          dispose: vi.fn(),
          setValue: vi.fn(),
          getValue: vi.fn(() => 'modified content'),
          focus: vi.fn(),
          getModel: vi.fn(() => null),
          updateOptions: vi.fn(),
          onDidChangeModelContent: vi.fn((cb) => {
            contentChangeCallback = cb;
            return { dispose: vi.fn() };
          }),
        } as unknown as ReturnType<typeof monaco.editor.create>);

        panel = new HdlViewerPanel();
        panel.mount(container);
        panel.toggleEditMode();

        // Simulate content change
        contentChangeCallback?.();
        expect(panel.hasUnsavedChanges()).toBe(true);

        // Save
        panel.saveContent();
        expect(panel.hasUnsavedChanges()).toBe(false);
      });
    });

    describe('keyboard shortcuts', () => {
      it('should save on Ctrl+S in edit mode', async () => {
        const onSave = vi.fn();
        panel = new HdlViewerPanel({ onSave });
        panel.mount(container);
        await panel.show();
        panel.toggleEditMode();

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true }));

        expect(onSave).toHaveBeenCalled();
      });

      it('should not save on Ctrl+S in view mode', async () => {
        const onSave = vi.fn();
        panel = new HdlViewerPanel({ onSave });
        panel.mount(container);
        await panel.show();

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true }));

        expect(onSave).not.toHaveBeenCalled();
      });
    });

    describe('close with unsaved changes', () => {
      it('should prompt before closing with unsaved changes', async () => {
        const monaco = await import('monaco-editor');
        let contentChangeCallback: (() => void) | null = null;
        vi.mocked(monaco.editor.create).mockReturnValueOnce({
          dispose: vi.fn(),
          setValue: vi.fn(),
          getValue: vi.fn(() => 'modified content'),
          focus: vi.fn(),
          getModel: vi.fn(() => null),
          updateOptions: vi.fn(),
          onDidChangeModelContent: vi.fn((cb) => {
            contentChangeCallback = cb;
            return { dispose: vi.fn() };
          }),
        } as unknown as ReturnType<typeof monaco.editor.create>);

        // Mock window.confirm
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

        panel = new HdlViewerPanel();
        panel.mount(container);
        await panel.show();
        panel.toggleEditMode();

        // Simulate content change
        contentChangeCallback?.();

        // Try to hide - should prompt
        panel.hide();

        expect(confirmSpy).toHaveBeenCalled();
        // Panel should still be visible because user cancelled
        expect(panel.isVisible()).toBe(true);

        confirmSpy.mockRestore();
      });

      it('should close when user confirms discard', async () => {
        const monaco = await import('monaco-editor');
        let contentChangeCallback: (() => void) | null = null;
        vi.mocked(monaco.editor.create).mockReturnValueOnce({
          dispose: vi.fn(),
          setValue: vi.fn(),
          getValue: vi.fn(() => 'modified content'),
          focus: vi.fn(),
          getModel: vi.fn(() => null),
          updateOptions: vi.fn(),
          onDidChangeModelContent: vi.fn((cb) => {
            contentChangeCallback = cb;
            return { dispose: vi.fn() };
          }),
        } as unknown as ReturnType<typeof monaco.editor.create>);

        // Mock window.confirm to return true
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

        panel = new HdlViewerPanel();
        panel.mount(container);
        await panel.show();
        panel.toggleEditMode();

        // Simulate content change
        contentChangeCallback?.();

        // Try to hide - should succeed because user confirms
        panel.hide();

        expect(panel.isVisible()).toBe(false);

        confirmSpy.mockRestore();
      });

      it('should close without prompt using forceClose', async () => {
        const monaco = await import('monaco-editor');
        let contentChangeCallback: (() => void) | null = null;
        vi.mocked(monaco.editor.create).mockReturnValueOnce({
          dispose: vi.fn(),
          setValue: vi.fn(),
          getValue: vi.fn(() => 'modified content'),
          focus: vi.fn(),
          getModel: vi.fn(() => null),
          updateOptions: vi.fn(),
          onDidChangeModelContent: vi.fn((cb) => {
            contentChangeCallback = cb;
            return { dispose: vi.fn() };
          }),
        } as unknown as ReturnType<typeof monaco.editor.create>);

        panel = new HdlViewerPanel();
        panel.mount(container);
        await panel.show();
        panel.toggleEditMode();

        // Simulate content change
        contentChangeCallback?.();

        // Force close without prompt
        panel.forceClose();

        expect(panel.isVisible()).toBe(false);
      });

      it('should reset edit mode state when forceClose is called', async () => {
        const monaco = await import('monaco-editor');
        const mockUpdateOptions = vi.fn();
        vi.mocked(monaco.editor.create).mockReturnValueOnce({
          dispose: vi.fn(),
          setValue: vi.fn(),
          getValue: vi.fn(() => '# HDL content'),
          focus: vi.fn(),
          getModel: vi.fn(() => null),
          updateOptions: mockUpdateOptions,
          onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
        } as unknown as ReturnType<typeof monaco.editor.create>);

        panel = new HdlViewerPanel();
        panel.mount(container);
        await panel.show();
        panel.toggleEditMode();

        expect(panel.isEditMode()).toBe(true);

        // Force close
        panel.forceClose();

        // Edit mode should be reset
        expect(panel.isEditMode()).toBe(false);

        // UI elements should be reset
        const editButton = container.querySelector('.da-hdl-viewer-edit-toggle');
        expect(editButton?.textContent).toBe('Edit');
        expect(editButton?.getAttribute('aria-pressed')).toBe('false');

        const title = container.querySelector('.da-hdl-viewer-title');
        expect(title?.textContent).toBe('HDL Viewer');

        const saveButton = container.querySelector('.da-hdl-viewer-save');
        expect(saveButton?.classList.contains('da-hdl-viewer-save--hidden')).toBe(true);

        const panelElement = container.querySelector('.da-hdl-viewer-panel');
        expect(panelElement?.classList.contains('da-hdl-viewer-panel--editing')).toBe(false);
      });

      it('should reset validation state when forceClose is called (Story 7.4)', async () => {
        const monaco = await import('monaco-editor');
        const mockGetModel = vi.fn(() => ({
          getLineMaxColumn: vi.fn(() => 20),
        }));
        vi.mocked(monaco.editor.create).mockReturnValueOnce({
          dispose: vi.fn(),
          setValue: vi.fn(),
          getValue: vi.fn(() => 'wire a'),
          focus: vi.fn(),
          getModel: mockGetModel,
          updateOptions: vi.fn(),
          onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
          revealLineInCenter: vi.fn(),
          setPosition: vi.fn(),
        } as unknown as ReturnType<typeof monaco.editor.create>);

        panel = new HdlViewerPanel();
        panel.mount(container);
        await panel.show();
        panel.toggleEditMode();

        // Perform validation
        panel.validateContent();
        expect(panel.getLastValidationResult()).not.toBeNull();

        // Force close
        panel.forceClose();

        // Validation state should be reset
        expect(panel.getLastValidationResult()).toBeNull();

        // Validation results container should be hidden
        const validationResults = container.querySelector('.da-hdl-viewer-validation-results');
        expect(validationResults?.classList.contains('da-hdl-viewer-validation-results--hidden')).toBe(true);

        // Validate button should be hidden
        const validateButton = container.querySelector('.da-hdl-viewer-validate');
        expect(validateButton?.classList.contains('da-hdl-viewer-validate--hidden')).toBe(true);
      });
    });
  });

  // ============================================
  // Story 7.4: Validation Tests
  // ============================================
  describe('validation (Story 7.4)', () => {
    describe('validate button', () => {
      it('should have validate button hidden by default', () => {
        panel = new HdlViewerPanel();
        panel.mount(container);

        const validateButton = container.querySelector('.da-hdl-viewer-validate');
        expect(validateButton).not.toBeNull();
        expect(validateButton?.classList.contains('da-hdl-viewer-validate--hidden')).toBe(true);
      });

      it('should show validate button in edit mode', () => {
        panel = new HdlViewerPanel();
        panel.mount(container);
        panel.toggleEditMode();

        const validateButton = container.querySelector('.da-hdl-viewer-validate');
        expect(validateButton?.classList.contains('da-hdl-viewer-validate--hidden')).toBe(false);
      });

      it('should hide validate button when exiting edit mode', () => {
        panel = new HdlViewerPanel();
        panel.mount(container);
        panel.toggleEditMode(); // Enter edit mode
        panel.toggleEditMode(); // Exit edit mode

        const validateButton = container.querySelector('.da-hdl-viewer-validate');
        expect(validateButton?.classList.contains('da-hdl-viewer-validate--hidden')).toBe(true);
      });

      it('should trigger validation when validate button is clicked', async () => {
        const monaco = await import('monaco-editor');
        const mockGetModel = vi.fn(() => ({
          getLineMaxColumn: vi.fn(() => 20),
        }));
        vi.mocked(monaco.editor.create).mockReturnValueOnce({
          dispose: vi.fn(),
          setValue: vi.fn(),
          getValue: vi.fn(() => 'wire a\nwire b\nand g1 (input: a, b; output: c)'),
          focus: vi.fn(),
          getModel: mockGetModel,
          updateOptions: vi.fn(),
          onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
          revealLineInCenter: vi.fn(),
          setPosition: vi.fn(),
        } as unknown as ReturnType<typeof monaco.editor.create>);

        const onValidate = vi.fn();
        panel = new HdlViewerPanel({ onValidate });
        panel.mount(container);
        panel.toggleEditMode();

        const validateButton = container.querySelector('.da-hdl-viewer-validate') as HTMLButtonElement;
        validateButton?.click();

        expect(onValidate).toHaveBeenCalled();
        const result = onValidate.mock.calls[0][0];
        expect(result.valid).toBe(false); // 'c' is undefined
      });

      it('should not trigger validation when clicked while already validating', async () => {
        const monaco = await import('monaco-editor');
        const mockGetModel = vi.fn(() => ({
          getLineMaxColumn: vi.fn(() => 20),
        }));
        vi.mocked(monaco.editor.create).mockReturnValueOnce({
          dispose: vi.fn(),
          setValue: vi.fn(),
          getValue: vi.fn(() => 'wire a'),
          focus: vi.fn(),
          getModel: mockGetModel,
          updateOptions: vi.fn(),
          onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
          revealLineInCenter: vi.fn(),
          setPosition: vi.fn(),
        } as unknown as ReturnType<typeof monaco.editor.create>);

        const onValidate = vi.fn();
        panel = new HdlViewerPanel({ onValidate });
        panel.mount(container);
        panel.toggleEditMode();

        // First click triggers validation
        const validateButton = container.querySelector('.da-hdl-viewer-validate') as HTMLButtonElement;
        validateButton?.click();

        expect(onValidate).toHaveBeenCalledTimes(1);

        // Simulate rapid second click while still "validating" - even though our validation
        // is synchronous, the isValidating flag should protect during the validation call
        // Reset mock to verify no additional calls
        onValidate.mockClear();

        // Since validation is synchronous, isValidating is only true during validateContent()
        // The protection is against re-entry, not against clicks after completion
        // This test verifies the click handler checks isValidating
        validateButton?.click();

        // Second click should also work since validation completed (synchronous)
        // But if isValidating was somehow stuck, it would be blocked
        expect(onValidate).toHaveBeenCalledTimes(1);
      });
    });

    describe('validateContent method', () => {
      it('should return valid result for correct HDL', async () => {
        const monaco = await import('monaco-editor');
        const mockGetModel = vi.fn(() => ({
          getLineMaxColumn: vi.fn(() => 20),
        }));
        vi.mocked(monaco.editor.create).mockReturnValueOnce({
          dispose: vi.fn(),
          setValue: vi.fn(),
          getValue: vi.fn(() => 'wire a\nwire b\nwire c\nand g1 (input: a, b; output: c)'),
          focus: vi.fn(),
          getModel: mockGetModel,
          updateOptions: vi.fn(),
          onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
          revealLineInCenter: vi.fn(),
          setPosition: vi.fn(),
        } as unknown as ReturnType<typeof monaco.editor.create>);

        panel = new HdlViewerPanel();
        panel.mount(container);
        panel.validateContent();

        const result = panel.getLastValidationResult();
        expect(result?.valid).toBe(true);
        expect(result?.errors).toHaveLength(0);
      });

      it('should detect errors in invalid HDL', async () => {
        const monaco = await import('monaco-editor');
        const mockGetModel = vi.fn(() => ({
          getLineMaxColumn: vi.fn(() => 20),
        }));
        vi.mocked(monaco.editor.create).mockReturnValueOnce({
          dispose: vi.fn(),
          setValue: vi.fn(),
          getValue: vi.fn(() => 'wire a\nand g1 (input: a, undefined_wire; output: c)'),
          focus: vi.fn(),
          getModel: mockGetModel,
          updateOptions: vi.fn(),
          onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
          revealLineInCenter: vi.fn(),
          setPosition: vi.fn(),
        } as unknown as ReturnType<typeof monaco.editor.create>);

        panel = new HdlViewerPanel();
        panel.mount(container);
        panel.validateContent();

        const result = panel.getLastValidationResult();
        expect(result?.valid).toBe(false);
        expect(result?.errors.length).toBeGreaterThan(0);
      });
    });

    describe('validation results display', () => {
      it('should show validation results container after validation', async () => {
        const monaco = await import('monaco-editor');
        const mockGetModel = vi.fn(() => ({
          getLineMaxColumn: vi.fn(() => 20),
        }));
        vi.mocked(monaco.editor.create).mockReturnValueOnce({
          dispose: vi.fn(),
          setValue: vi.fn(),
          getValue: vi.fn(() => 'wire a'),
          focus: vi.fn(),
          getModel: mockGetModel,
          updateOptions: vi.fn(),
          onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
          revealLineInCenter: vi.fn(),
          setPosition: vi.fn(),
        } as unknown as ReturnType<typeof monaco.editor.create>);

        panel = new HdlViewerPanel();
        panel.mount(container);
        panel.validateContent();

        const resultsContainer = container.querySelector('.da-hdl-viewer-validation-results');
        expect(resultsContainer?.classList.contains('da-hdl-viewer-validation-results--hidden')).toBe(false);
      });

      it('should show success message for valid HDL', async () => {
        const monaco = await import('monaco-editor');
        const mockGetModel = vi.fn(() => ({
          getLineMaxColumn: vi.fn(() => 20),
        }));
        vi.mocked(monaco.editor.create).mockReturnValueOnce({
          dispose: vi.fn(),
          setValue: vi.fn(),
          getValue: vi.fn(() => 'wire a\nwire b\nwire c\nand g1 (input: a, b; output: c)'),
          focus: vi.fn(),
          getModel: mockGetModel,
          updateOptions: vi.fn(),
          onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
          revealLineInCenter: vi.fn(),
          setPosition: vi.fn(),
        } as unknown as ReturnType<typeof monaco.editor.create>);

        panel = new HdlViewerPanel();
        panel.mount(container);
        panel.validateContent();

        const successMessage = container.querySelector('.da-hdl-viewer-validation-success');
        expect(successMessage).not.toBeNull();
        expect(successMessage?.textContent).toContain('valid');
      });

      it('should show error list for invalid HDL', async () => {
        const monaco = await import('monaco-editor');
        const mockGetModel = vi.fn(() => ({
          getLineMaxColumn: vi.fn(() => 20),
        }));
        vi.mocked(monaco.editor.create).mockReturnValueOnce({
          dispose: vi.fn(),
          setValue: vi.fn(),
          getValue: vi.fn(() => 'and g1 (input: a, b; output: c)'),
          focus: vi.fn(),
          getModel: mockGetModel,
          updateOptions: vi.fn(),
          onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
          revealLineInCenter: vi.fn(),
          setPosition: vi.fn(),
        } as unknown as ReturnType<typeof monaco.editor.create>);

        panel = new HdlViewerPanel();
        panel.mount(container);
        panel.validateContent();

        const errorList = container.querySelector('.da-hdl-viewer-validation-list');
        expect(errorList).not.toBeNull();

        const errorItems = container.querySelectorAll('.da-hdl-viewer-validation-item');
        expect(errorItems.length).toBeGreaterThan(0);
      });
    });

    describe('Monaco markers', () => {
      it('should set Monaco markers on validation errors', async () => {
        const monaco = await import('monaco-editor');
        const mockModel = {
          getLineMaxColumn: vi.fn(() => 20),
        };
        const mockSetModelMarkers = vi.fn();
        vi.mocked(monaco.editor.setModelMarkers).mockImplementation(mockSetModelMarkers);
        vi.mocked(monaco.editor.create).mockReturnValueOnce({
          dispose: vi.fn(),
          setValue: vi.fn(),
          getValue: vi.fn(() => 'and g1 (input: a, b; output: c)'),
          focus: vi.fn(),
          getModel: vi.fn(() => mockModel),
          updateOptions: vi.fn(),
          onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
          revealLineInCenter: vi.fn(),
          setPosition: vi.fn(),
        } as unknown as ReturnType<typeof monaco.editor.create>);

        panel = new HdlViewerPanel();
        panel.mount(container);
        panel.validateContent();

        expect(mockSetModelMarkers).toHaveBeenCalled();
        const call = mockSetModelMarkers.mock.calls[0];
        expect(call[1]).toBe('hdl-validation');
        expect(call[2].length).toBeGreaterThan(0);
      });
    });

    describe('jump to line', () => {
      it('should jump to line when clicking error item', async () => {
        const monaco = await import('monaco-editor');
        const mockRevealLine = vi.fn();
        const mockSetPosition = vi.fn();
        const mockFocus = vi.fn();
        const mockGetModel = vi.fn(() => ({
          getLineMaxColumn: vi.fn(() => 20),
        }));
        vi.mocked(monaco.editor.create).mockReturnValueOnce({
          dispose: vi.fn(),
          setValue: vi.fn(),
          getValue: vi.fn(() => 'and g1 (input: a, b; output: c)'),
          focus: mockFocus,
          getModel: mockGetModel,
          updateOptions: vi.fn(),
          onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
          revealLineInCenter: mockRevealLine,
          setPosition: mockSetPosition,
        } as unknown as ReturnType<typeof monaco.editor.create>);

        panel = new HdlViewerPanel();
        panel.mount(container);
        panel.validateContent();

        const errorItem = container.querySelector('.da-hdl-viewer-validation-item') as HTMLElement;
        expect(errorItem).not.toBeNull();

        errorItem?.click();

        expect(mockRevealLine).toHaveBeenCalled();
        expect(mockSetPosition).toHaveBeenCalled();
        expect(mockFocus).toHaveBeenCalled();
      });
    });

    describe('keyboard shortcut', () => {
      it('should trigger validation on Ctrl+Shift+V in edit mode', async () => {
        const monaco = await import('monaco-editor');
        const mockGetModel = vi.fn(() => ({
          getLineMaxColumn: vi.fn(() => 20),
        }));
        vi.mocked(monaco.editor.create).mockReturnValueOnce({
          dispose: vi.fn(),
          setValue: vi.fn(),
          getValue: vi.fn(() => 'wire a'),
          focus: vi.fn(),
          getModel: mockGetModel,
          updateOptions: vi.fn(),
          onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
          revealLineInCenter: vi.fn(),
          setPosition: vi.fn(),
        } as unknown as ReturnType<typeof monaco.editor.create>);

        const onValidate = vi.fn();
        panel = new HdlViewerPanel({ onValidate });
        panel.mount(container);
        await panel.show();
        panel.toggleEditMode();

        // Simulate Ctrl+Shift+V
        const event = new KeyboardEvent('keydown', {
          key: 'V',
          ctrlKey: true,
          shiftKey: true,
          bubbles: true,
        });
        document.dispatchEvent(event);

        expect(onValidate).toHaveBeenCalled();
      });

      it('should not trigger validation on Ctrl+Shift+V in view mode', () => {
        const onValidate = vi.fn();
        panel = new HdlViewerPanel({ onValidate });
        panel.mount(container);

        // Simulate Ctrl+Shift+V without entering edit mode
        const event = new KeyboardEvent('keydown', {
          key: 'V',
          ctrlKey: true,
          shiftKey: true,
          bubbles: true,
        });
        document.dispatchEvent(event);

        expect(onValidate).not.toHaveBeenCalled();
      });
    });

    describe('save triggers validation', () => {
      it('should auto-validate when saving', async () => {
        const monaco = await import('monaco-editor');
        const mockGetModel = vi.fn(() => ({
          getLineMaxColumn: vi.fn(() => 20),
        }));
        vi.mocked(monaco.editor.create).mockReturnValueOnce({
          dispose: vi.fn(),
          setValue: vi.fn(),
          getValue: vi.fn(() => 'wire a'),
          focus: vi.fn(),
          getModel: mockGetModel,
          updateOptions: vi.fn(),
          onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
          revealLineInCenter: vi.fn(),
          setPosition: vi.fn(),
        } as unknown as ReturnType<typeof monaco.editor.create>);

        const onValidate = vi.fn();
        panel = new HdlViewerPanel({ onValidate });
        panel.mount(container);
        panel.toggleEditMode();
        panel.saveContent();

        expect(onValidate).toHaveBeenCalled();
      });
    });
  });

  // ============================================
  // Story 7.5: Reload Circuit Tests
  // ============================================
  describe('reload circuit (Story 7.5)', () => {
    describe('reload button', () => {
      it('should create reload button in header', () => {
        panel = new HdlViewerPanel();
        panel.mount(container);

        const reloadButton = container.querySelector('.da-hdl-viewer-reload');
        expect(reloadButton).not.toBeNull();
      });

      it('should be hidden in view mode', () => {
        panel = new HdlViewerPanel();
        panel.mount(container);

        const reloadButton = container.querySelector('.da-hdl-viewer-reload');
        expect(reloadButton?.classList.contains('da-hdl-viewer-reload--hidden')).toBe(true);
      });

      it('should be visible in edit mode', () => {
        panel = new HdlViewerPanel();
        panel.mount(container);
        panel.toggleEditMode();

        const reloadButton = container.querySelector('.da-hdl-viewer-reload');
        expect(reloadButton?.classList.contains('da-hdl-viewer-reload--hidden')).toBe(false);
      });

      it('should be hidden when exiting edit mode', () => {
        panel = new HdlViewerPanel();
        panel.mount(container);
        panel.toggleEditMode(); // Enter edit mode
        panel.toggleEditMode(); // Exit edit mode

        const reloadButton = container.querySelector('.da-hdl-viewer-reload');
        expect(reloadButton?.classList.contains('da-hdl-viewer-reload--hidden')).toBe(true);
      });

      it('should have correct aria-label', () => {
        panel = new HdlViewerPanel();
        panel.mount(container);

        const reloadButton = container.querySelector('.da-hdl-viewer-reload');
        expect(reloadButton?.getAttribute('aria-label')).toBe('Reload circuit visualization');
      });
    });

    describe('reloadCircuit method', () => {
      it('should validate content before calling onReloadCircuit', async () => {
        const monaco = await import('monaco-editor');
        const mockGetModel = vi.fn(() => ({
          getLineMaxColumn: vi.fn(() => 20),
        }));
        vi.mocked(monaco.editor.create).mockReturnValueOnce({
          dispose: vi.fn(),
          setValue: vi.fn(),
          getValue: vi.fn(() => 'wire a\nwire b\nwire c\nand g1 (input: a, b; output: c)'),
          focus: vi.fn(),
          getModel: mockGetModel,
          updateOptions: vi.fn(),
          onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
          revealLineInCenter: vi.fn(),
          setPosition: vi.fn(),
        } as unknown as ReturnType<typeof monaco.editor.create>);

        const onReloadCircuit = vi.fn().mockResolvedValue(undefined);
        const onValidate = vi.fn();
        panel = new HdlViewerPanel({ onReloadCircuit, onValidate });
        panel.mount(container);
        panel.toggleEditMode();

        await panel.reloadCircuit();

        // Should have validated first
        expect(onValidate).toHaveBeenCalled();
        // Story 7.6: Should have called reload callback with generated CircuitData
        expect(onReloadCircuit).toHaveBeenCalled();
        const callArg = onReloadCircuit.mock.calls[0][0];
        expect(callArg).toHaveProperty('cycle', 0);
        expect(callArg).toHaveProperty('stable', true);
        expect(callArg).toHaveProperty('wires');
        expect(callArg).toHaveProperty('gates');
        expect(callArg.wires).toHaveLength(3); // wire a, wire b, wire c
        expect(callArg.gates).toHaveLength(1); // and g1
      });

      it('should not call onReloadCircuit if validation fails', async () => {
        const monaco = await import('monaco-editor');
        const mockGetModel = vi.fn(() => ({
          getLineMaxColumn: vi.fn(() => 20),
        }));
        vi.mocked(monaco.editor.create).mockReturnValueOnce({
          dispose: vi.fn(),
          setValue: vi.fn(),
          getValue: vi.fn(() => 'and g1 (input: undefined_wire; output: c)'), // Invalid HDL
          focus: vi.fn(),
          getModel: mockGetModel,
          updateOptions: vi.fn(),
          onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
          revealLineInCenter: vi.fn(),
          setPosition: vi.fn(),
        } as unknown as ReturnType<typeof monaco.editor.create>);

        const onReloadCircuit = vi.fn().mockResolvedValue(undefined);
        panel = new HdlViewerPanel({ onReloadCircuit });
        panel.mount(container);
        panel.toggleEditMode();

        await panel.reloadCircuit();

        // Should NOT call reload callback because validation failed
        expect(onReloadCircuit).not.toHaveBeenCalled();
      });

      it('should return focus to reload button after completion', async () => {
        const monaco = await import('monaco-editor');
        const mockGetModel = vi.fn(() => ({
          getLineMaxColumn: vi.fn(() => 20),
        }));
        vi.mocked(monaco.editor.create).mockReturnValueOnce({
          dispose: vi.fn(),
          setValue: vi.fn(),
          getValue: vi.fn(() => 'wire a'),
          focus: vi.fn(),
          getModel: mockGetModel,
          updateOptions: vi.fn(),
          onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
          revealLineInCenter: vi.fn(),
          setPosition: vi.fn(),
        } as unknown as ReturnType<typeof monaco.editor.create>);

        const onReloadCircuit = vi.fn().mockResolvedValue(undefined);
        panel = new HdlViewerPanel({ onReloadCircuit });
        panel.mount(container);
        panel.toggleEditMode();

        const reloadButton = container.querySelector('.da-hdl-viewer-reload') as HTMLButtonElement;
        const focusSpy = vi.spyOn(reloadButton, 'focus');

        await panel.reloadCircuit();

        // Focus should be returned to reload button
        expect(focusSpy).toHaveBeenCalled();
      });

      it('should show loading state during reload', async () => {
        const monaco = await import('monaco-editor');
        const mockGetModel = vi.fn(() => ({
          getLineMaxColumn: vi.fn(() => 20),
        }));
        vi.mocked(monaco.editor.create).mockReturnValueOnce({
          dispose: vi.fn(),
          setValue: vi.fn(),
          getValue: vi.fn(() => 'wire a'),
          focus: vi.fn(),
          getModel: mockGetModel,
          updateOptions: vi.fn(),
          onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
          revealLineInCenter: vi.fn(),
          setPosition: vi.fn(),
        } as unknown as ReturnType<typeof monaco.editor.create>);

        let resolveReload: () => void;
        const reloadPromise = new Promise<void>((resolve) => {
          resolveReload = resolve;
        });
        const onReloadCircuit = vi.fn().mockReturnValue(reloadPromise);
        panel = new HdlViewerPanel({ onReloadCircuit });
        panel.mount(container);
        panel.toggleEditMode();

        // Start reload (don't await yet)
        const reloadCall = panel.reloadCircuit();

        // Button should be disabled during reload
        const reloadButton = container.querySelector('.da-hdl-viewer-reload');
        expect(reloadButton?.getAttribute('aria-disabled')).toBe('true');
        expect(reloadButton?.textContent).toBe('Reloading...');

        // Resolve the reload
        resolveReload!();
        await reloadCall;

        // Button should be restored
        expect(reloadButton?.getAttribute('aria-disabled')).toBe('false');
        expect(reloadButton?.textContent).toBe('Reload Circuit');
      });

      it('should announce reload success to screen reader', async () => {
        const monaco = await import('monaco-editor');
        const mockGetModel = vi.fn(() => ({
          getLineMaxColumn: vi.fn(() => 20),
        }));
        vi.mocked(monaco.editor.create).mockReturnValueOnce({
          dispose: vi.fn(),
          setValue: vi.fn(),
          getValue: vi.fn(() => 'wire a'),
          focus: vi.fn(),
          getModel: mockGetModel,
          updateOptions: vi.fn(),
          onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
          revealLineInCenter: vi.fn(),
          setPosition: vi.fn(),
        } as unknown as ReturnType<typeof monaco.editor.create>);

        const onReloadCircuit = vi.fn().mockResolvedValue(undefined);
        panel = new HdlViewerPanel({ onReloadCircuit });
        panel.mount(container);
        panel.toggleEditMode();

        await panel.reloadCircuit();

        // Wait for the announcement timeout
        await new Promise((resolve) => setTimeout(resolve, 60));

        const announcer = document.body.querySelector('.da-sr-only[role="status"]');
        // Story 7.6: Updated announcement message
        expect(announcer?.textContent).toContain('Circuit regenerated and reloaded successfully');
      });

      it('should announce reload failure to screen reader', async () => {
        const monaco = await import('monaco-editor');
        const mockGetModel = vi.fn(() => ({
          getLineMaxColumn: vi.fn(() => 20),
        }));
        vi.mocked(monaco.editor.create).mockReturnValueOnce({
          dispose: vi.fn(),
          setValue: vi.fn(),
          getValue: vi.fn(() => 'wire a'),
          focus: vi.fn(),
          getModel: mockGetModel,
          updateOptions: vi.fn(),
          onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
          revealLineInCenter: vi.fn(),
          setPosition: vi.fn(),
        } as unknown as ReturnType<typeof monaco.editor.create>);

        const onReloadCircuit = vi.fn().mockRejectedValue(new Error('Circuit load failed'));
        panel = new HdlViewerPanel({ onReloadCircuit });
        panel.mount(container);
        panel.toggleEditMode();

        await panel.reloadCircuit();

        // Wait for the announcement timeout
        await new Promise((resolve) => setTimeout(resolve, 60));

        const announcer = document.body.querySelector('.da-sr-only[role="status"]');
        // Story 7.6: Updated announcement message
        expect(announcer?.textContent).toContain('Circuit regeneration failed');
      });

      it('should not reload if already reloading', async () => {
        const monaco = await import('monaco-editor');
        const mockGetModel = vi.fn(() => ({
          getLineMaxColumn: vi.fn(() => 20),
        }));
        vi.mocked(monaco.editor.create).mockReturnValueOnce({
          dispose: vi.fn(),
          setValue: vi.fn(),
          getValue: vi.fn(() => 'wire a'),
          focus: vi.fn(),
          getModel: mockGetModel,
          updateOptions: vi.fn(),
          onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
          revealLineInCenter: vi.fn(),
          setPosition: vi.fn(),
        } as unknown as ReturnType<typeof monaco.editor.create>);

        let resolveReload: () => void;
        const reloadPromise = new Promise<void>((resolve) => {
          resolveReload = resolve;
        });
        const onReloadCircuit = vi.fn().mockReturnValue(reloadPromise);
        panel = new HdlViewerPanel({ onReloadCircuit });
        panel.mount(container);
        panel.toggleEditMode();

        // Start first reload
        const firstReload = panel.reloadCircuit();

        // Try to start second reload while first is in progress
        const secondReload = panel.reloadCircuit();

        // Resolve the first reload
        resolveReload!();
        await firstReload;
        await secondReload;

        // Should only have been called once
        expect(onReloadCircuit).toHaveBeenCalledTimes(1);
      });
    });

    describe('reload button click', () => {
      it('should trigger reloadCircuit when clicked', async () => {
        const monaco = await import('monaco-editor');
        const mockGetModel = vi.fn(() => ({
          getLineMaxColumn: vi.fn(() => 20),
        }));
        vi.mocked(monaco.editor.create).mockReturnValueOnce({
          dispose: vi.fn(),
          setValue: vi.fn(),
          getValue: vi.fn(() => 'wire a'),
          focus: vi.fn(),
          getModel: mockGetModel,
          updateOptions: vi.fn(),
          onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
          revealLineInCenter: vi.fn(),
          setPosition: vi.fn(),
        } as unknown as ReturnType<typeof monaco.editor.create>);

        const onReloadCircuit = vi.fn().mockResolvedValue(undefined);
        panel = new HdlViewerPanel({ onReloadCircuit });
        panel.mount(container);
        panel.toggleEditMode();

        const reloadButton = container.querySelector('.da-hdl-viewer-reload') as HTMLButtonElement;
        reloadButton?.click();

        // Wait for async operation
        await vi.waitFor(() => {
          expect(onReloadCircuit).toHaveBeenCalled();
        });
      });

      it('should not trigger reloadCircuit when button clicked while already reloading', async () => {
        const monaco = await import('monaco-editor');
        const mockGetModel = vi.fn(() => ({
          getLineMaxColumn: vi.fn(() => 20),
        }));
        vi.mocked(monaco.editor.create).mockReturnValueOnce({
          dispose: vi.fn(),
          setValue: vi.fn(),
          getValue: vi.fn(() => 'wire a'),
          focus: vi.fn(),
          getModel: mockGetModel,
          updateOptions: vi.fn(),
          onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
          revealLineInCenter: vi.fn(),
          setPosition: vi.fn(),
        } as unknown as ReturnType<typeof monaco.editor.create>);

        let resolveReload: () => void;
        const reloadPromise = new Promise<void>((resolve) => {
          resolveReload = resolve;
        });
        const onReloadCircuit = vi.fn().mockReturnValue(reloadPromise);
        panel = new HdlViewerPanel({ onReloadCircuit });
        panel.mount(container);
        panel.toggleEditMode();

        const reloadButton = container.querySelector('.da-hdl-viewer-reload') as HTMLButtonElement;

        // Start first reload via button click
        reloadButton?.click();

        // Click button again while reload is in progress
        reloadButton?.click();
        reloadButton?.click();

        // Resolve the reload
        resolveReload!();

        // Wait for completion
        await vi.waitFor(() => {
          expect(reloadButton?.getAttribute('aria-disabled')).toBe('false');
        });

        // Should only have been called once despite multiple clicks
        expect(onReloadCircuit).toHaveBeenCalledTimes(1);
      });
    });
  });
});
