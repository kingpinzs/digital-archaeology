// src/hdl/HdlViewerPanel.test.ts
// Tests for HdlViewerPanel component
// Story 7.1: Create HDL Viewer Panel

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HdlViewerPanel, resetHdlThemeRegistration } from './HdlViewerPanel';

// Mock monaco-editor
vi.mock('monaco-editor', () => ({
  editor: {
    create: vi.fn(() => ({
      dispose: vi.fn(),
      setValue: vi.fn(),
      getValue: vi.fn(() => ''),
      focus: vi.fn(),
      getModel: vi.fn(() => null),
    })),
    defineTheme: vi.fn(),
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
      panel = new HdlViewerPanel();
      panel.mount(container);
      await panel.show();
      panel.hide();

      const panelElement = container.querySelector('.da-hdl-viewer-panel');
      expect(panelElement?.classList.contains('da-hdl-viewer-panel--hidden')).toBe(true);
    });

    it('should return correct visibility state', async () => {
      panel = new HdlViewerPanel();
      panel.mount(container);

      expect(panel.isVisible()).toBe(false);

      await panel.show();
      expect(panel.isVisible()).toBe(true);

      panel.hide();
      expect(panel.isVisible()).toBe(false);
    });

    it('should toggle visibility', async () => {
      panel = new HdlViewerPanel();
      panel.mount(container);

      await panel.toggle();
      expect(panel.isVisible()).toBe(true);

      await panel.toggle();
      expect(panel.isVisible()).toBe(false);
    });

    it('should call onClose callback when hidden', async () => {
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
    it('should hide panel when close button clicked', async () => {
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

    it('should close panel on Escape key when visible', async () => {
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
});
