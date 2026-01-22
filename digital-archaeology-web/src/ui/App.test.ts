import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { App } from './App';
import { PANEL_CONSTRAINTS } from './PanelResizer';

describe('App', () => {
  let container: HTMLDivElement;
  let app: App;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'app';
    document.body.appendChild(container);
    app = new App();
  });

  afterEach(() => {
    app.destroy();
    document.body.removeChild(container);
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

    it('should create toolbar text with correct class', () => {
      const toolbarText = container.querySelector('.da-toolbar-text');
      expect(toolbarText).not.toBeNull();
      expect(toolbarText?.textContent).toBe('Toolbar');
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

    it('should have status bar text showing Ready', () => {
      const statusText = container.querySelector('.da-statusbar-text');
      expect(statusText?.textContent).toBe('Ready');
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
});
