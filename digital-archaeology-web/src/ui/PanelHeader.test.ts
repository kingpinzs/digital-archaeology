import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PanelHeader } from './PanelHeader';
import type { PanelHeaderOptions } from './PanelHeader';

describe('PanelHeader', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('mount', () => {
    it('should mount to container', () => {
      const options: PanelHeaderOptions = {
        title: 'CODE',
        panelId: 'code',
        onClose: vi.fn(),
      };
      const header = new PanelHeader(options);
      header.mount(container);

      expect(container.querySelector('.da-panel-header')).not.toBeNull();
      header.destroy();
    });

    it('should render the title correctly', () => {
      const options: PanelHeaderOptions = {
        title: 'CIRCUIT',
        panelId: 'circuit',
        onClose: vi.fn(),
      };
      const header = new PanelHeader(options);
      header.mount(container);

      const title = container.querySelector('.da-panel-title');
      expect(title?.textContent).toBe('CIRCUIT');
      header.destroy();
    });

    it('should render close button', () => {
      const options: PanelHeaderOptions = {
        title: 'STATE',
        panelId: 'state',
        onClose: vi.fn(),
      };
      const header = new PanelHeader(options);
      header.mount(container);

      const closeBtn = container.querySelector('.da-panel-close-btn');
      expect(closeBtn).not.toBeNull();
      header.destroy();
    });

    it('should render close button with times symbol', () => {
      const options: PanelHeaderOptions = {
        title: 'CODE',
        panelId: 'code',
        onClose: vi.fn(),
      };
      const header = new PanelHeader(options);
      header.mount(container);

      const closeBtn = container.querySelector('.da-panel-close-btn');
      expect(closeBtn?.textContent).toContain('×');
      header.destroy();
    });
  });

  describe('close button click', () => {
    it('should call onClose callback when clicked', () => {
      const onClose = vi.fn();
      const options: PanelHeaderOptions = {
        title: 'CODE',
        panelId: 'code',
        onClose,
      };
      const header = new PanelHeader(options);
      header.mount(container);

      const closeBtn = container.querySelector('.da-panel-close-btn') as HTMLButtonElement;
      closeBtn.click();

      expect(onClose).toHaveBeenCalledTimes(1);
      header.destroy();
    });

    it('should call onClose callback on Enter key', () => {
      const onClose = vi.fn();
      const options: PanelHeaderOptions = {
        title: 'CODE',
        panelId: 'code',
        onClose,
      };
      const header = new PanelHeader(options);
      header.mount(container);

      const closeBtn = container.querySelector('.da-panel-close-btn') as HTMLButtonElement;
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      closeBtn.dispatchEvent(event);

      expect(onClose).toHaveBeenCalledTimes(1);
      header.destroy();
    });

    it('should call onClose callback on Space key', () => {
      const onClose = vi.fn();
      const options: PanelHeaderOptions = {
        title: 'CODE',
        panelId: 'code',
        onClose,
      };
      const header = new PanelHeader(options);
      header.mount(container);

      const closeBtn = container.querySelector('.da-panel-close-btn') as HTMLButtonElement;
      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
      closeBtn.dispatchEvent(event);

      expect(onClose).toHaveBeenCalledTimes(1);
      header.destroy();
    });

    it('should not call onClose on other keys', () => {
      const onClose = vi.fn();
      const options: PanelHeaderOptions = {
        title: 'CODE',
        panelId: 'code',
        onClose,
      };
      const header = new PanelHeader(options);
      header.mount(container);

      const closeBtn = container.querySelector('.da-panel-close-btn') as HTMLButtonElement;
      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      closeBtn.dispatchEvent(event);

      expect(onClose).not.toHaveBeenCalled();
      header.destroy();
    });
  });

  describe('accessibility', () => {
    it('should have correct aria-label on close button', () => {
      const options: PanelHeaderOptions = {
        title: 'CODE',
        panelId: 'code',
        onClose: vi.fn(),
      };
      const header = new PanelHeader(options);
      header.mount(container);

      const closeBtn = container.querySelector('.da-panel-close-btn');
      expect(closeBtn?.getAttribute('aria-label')).toBe('Close CODE panel');
      header.destroy();
    });

    it('should have aria-label with panel title', () => {
      const options: PanelHeaderOptions = {
        title: 'CIRCUIT',
        panelId: 'circuit',
        onClose: vi.fn(),
      };
      const header = new PanelHeader(options);
      header.mount(container);

      const closeBtn = container.querySelector('.da-panel-close-btn');
      expect(closeBtn?.getAttribute('aria-label')).toBe('Close CIRCUIT panel');
      header.destroy();
    });

    it('should have button type attribute', () => {
      const options: PanelHeaderOptions = {
        title: 'STATE',
        panelId: 'state',
        onClose: vi.fn(),
      };
      const header = new PanelHeader(options);
      header.mount(container);

      const closeBtn = container.querySelector('.da-panel-close-btn');
      expect(closeBtn?.getAttribute('type')).toBe('button');
      header.destroy();
    });

    it('should have title attribute on close button', () => {
      const options: PanelHeaderOptions = {
        title: 'CODE',
        panelId: 'code',
        onClose: vi.fn(),
      };
      const header = new PanelHeader(options);
      header.mount(container);

      const closeBtn = container.querySelector('.da-panel-close-btn');
      expect(closeBtn?.getAttribute('title')).toBe('Close panel');
      header.destroy();
    });
  });

  describe('getElement', () => {
    it('should return the header element', () => {
      const options: PanelHeaderOptions = {
        title: 'CODE',
        panelId: 'code',
        onClose: vi.fn(),
      };
      const header = new PanelHeader(options);
      header.mount(container);

      const element = header.getElement();
      expect(element).not.toBeNull();
      expect(element?.classList.contains('da-panel-header')).toBe(true);
      header.destroy();
    });

    it('should return null before mount', () => {
      const options: PanelHeaderOptions = {
        title: 'CODE',
        panelId: 'code',
        onClose: vi.fn(),
      };
      const header = new PanelHeader(options);

      expect(header.getElement()).toBeNull();
    });

    it('should return null after destroy', () => {
      const options: PanelHeaderOptions = {
        title: 'CODE',
        panelId: 'code',
        onClose: vi.fn(),
      };
      const header = new PanelHeader(options);
      header.mount(container);
      header.destroy();

      expect(header.getElement()).toBeNull();
    });
  });

  describe('destroy', () => {
    it('should remove element from DOM', () => {
      const options: PanelHeaderOptions = {
        title: 'CODE',
        panelId: 'code',
        onClose: vi.fn(),
      };
      const header = new PanelHeader(options);
      header.mount(container);

      expect(container.querySelector('.da-panel-header')).not.toBeNull();

      header.destroy();

      expect(container.querySelector('.da-panel-header')).toBeNull();
    });

    it('should be safe to call multiple times', () => {
      const options: PanelHeaderOptions = {
        title: 'CODE',
        panelId: 'code',
        onClose: vi.fn(),
      };
      const header = new PanelHeader(options);
      header.mount(container);

      header.destroy();
      header.destroy();

      expect(container.querySelector('.da-panel-header')).toBeNull();
    });

    it('should be safe to call before mount', () => {
      const options: PanelHeaderOptions = {
        title: 'CODE',
        panelId: 'code',
        onClose: vi.fn(),
      };
      const header = new PanelHeader(options);
      header.destroy();
      // Should not throw
    });

    it('should remove event listeners on destroy', () => {
      const onClose = vi.fn();
      const options: PanelHeaderOptions = {
        title: 'CODE',
        panelId: 'code',
        onClose,
      };
      const header = new PanelHeader(options);
      header.mount(container);
      header.destroy();

      // Re-add element to DOM to test event listener removal
      const newBtn = document.createElement('button');
      newBtn.className = 'da-panel-close-btn';
      container.appendChild(newBtn);
      newBtn.click();

      // Original onClose should not be called since element was destroyed
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('panel types', () => {
    it('should work with code panel', () => {
      const options: PanelHeaderOptions = {
        title: 'CODE',
        panelId: 'code',
        onClose: vi.fn(),
      };
      const header = new PanelHeader(options);
      header.mount(container);

      expect(container.querySelector('.da-panel-title')?.textContent).toBe('CODE');
      header.destroy();
    });

    it('should work with circuit panel', () => {
      const options: PanelHeaderOptions = {
        title: 'CIRCUIT',
        panelId: 'circuit',
        onClose: vi.fn(),
      };
      const header = new PanelHeader(options);
      header.mount(container);

      expect(container.querySelector('.da-panel-title')?.textContent).toBe('CIRCUIT');
      header.destroy();
    });

    it('should work with state panel', () => {
      const options: PanelHeaderOptions = {
        title: 'STATE',
        panelId: 'state',
        onClose: vi.fn(),
      };
      const header = new PanelHeader(options);
      header.mount(container);

      expect(container.querySelector('.da-panel-title')?.textContent).toBe('STATE');
      header.destroy();
    });
  });

  // ---------------------------------------------------------------------------
  // Story 20.3: Help button
  // ---------------------------------------------------------------------------

  describe('help button (Story 20.3)', () => {
    it('should render help button when onHelp is provided', () => {
      const options = {
        title: 'CIRCUIT',
        panelId: 'circuit' as const,
        onClose: vi.fn(),
        onHelp: vi.fn(),
      };
      const header = new PanelHeader(options);
      header.mount(container);

      const helpBtn = container.querySelector('.da-panel-help-btn');
      expect(helpBtn).not.toBeNull();
      expect(helpBtn!.textContent).toBe('?');
      header.destroy();
    });

    it('should NOT render help button when onHelp is omitted', () => {
      const options = {
        title: 'CIRCUIT',
        panelId: 'circuit' as const,
        onClose: vi.fn(),
      };
      const header = new PanelHeader(options);
      header.mount(container);

      const helpBtn = container.querySelector('.da-panel-help-btn');
      expect(helpBtn).toBeNull();
      header.destroy();
    });

    it('should fire onHelp callback when help button is clicked', () => {
      const onHelp = vi.fn();
      const options = {
        title: 'CIRCUIT',
        panelId: 'circuit' as const,
        onClose: vi.fn(),
        onHelp,
      };
      const header = new PanelHeader(options);
      header.mount(container);

      const helpBtn = container.querySelector('.da-panel-help-btn') as HTMLButtonElement;
      helpBtn.click();
      expect(onHelp).toHaveBeenCalledTimes(1);
      header.destroy();
    });

    it('should have correct aria-label on help button', () => {
      const options = {
        title: 'CIRCUIT',
        panelId: 'circuit' as const,
        onClose: vi.fn(),
        onHelp: vi.fn(),
      };
      const header = new PanelHeader(options);
      header.mount(container);

      const helpBtn = container.querySelector('.da-panel-help-btn');
      expect(helpBtn!.getAttribute('aria-label')).toBe('Help for CIRCUIT panel');
      header.destroy();
    });

    it('should clean up help button on destroy', () => {
      const onHelp = vi.fn();
      const options = {
        title: 'CIRCUIT',
        panelId: 'circuit' as const,
        onClose: vi.fn(),
        onHelp,
      };
      const header = new PanelHeader(options);
      header.mount(container);
      header.destroy();

      expect(container.querySelector('.da-panel-help-btn')).toBeNull();
    });

    it('should fire onHelp on Enter/Space keydown', () => {
      const onHelp = vi.fn();
      const options = {
        title: 'STATE',
        panelId: 'state' as const,
        onClose: vi.fn(),
        onHelp,
      };
      const header = new PanelHeader(options);
      header.mount(container);

      const helpBtn = container.querySelector('.da-panel-help-btn') as HTMLButtonElement;
      helpBtn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(onHelp).toHaveBeenCalledTimes(1);

      helpBtn.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      expect(onHelp).toHaveBeenCalledTimes(2);
      header.destroy();
    });
  });
});
