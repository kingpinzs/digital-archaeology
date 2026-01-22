import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { PanelResizer, PANEL_CONSTRAINTS } from './PanelResizer';

describe('PanelResizer', () => {
  let container: HTMLDivElement;
  let resizer: PanelResizer;
  let onResizeMock: Mock<(newWidth: number) => void>;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.width = '350px';
    document.body.appendChild(container);

    onResizeMock = vi.fn();

    // Mock window.innerWidth
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1200);
  });

  afterEach(() => {
    resizer?.destroy();
    document.body.removeChild(container);
    vi.restoreAllMocks();
  });

  describe('PANEL_CONSTRAINTS', () => {
    it('should have correct minimum widths', () => {
      expect(PANEL_CONSTRAINTS.CODE_MIN).toBe(250);
      expect(PANEL_CONSTRAINTS.CIRCUIT_MIN).toBe(400);
      expect(PANEL_CONSTRAINTS.STATE_MIN).toBe(200);
    });

    it('should have correct default widths', () => {
      expect(PANEL_CONSTRAINTS.CODE_DEFAULT).toBe(350);
      expect(PANEL_CONSTRAINTS.STATE_DEFAULT).toBe(280);
    });
  });

  describe('mount', () => {
    it('should create a resize handle element', () => {
      resizer = new PanelResizer({
        panel: 'code',
        onResize: onResizeMock,
        getCurrentWidth: () => 350,
        getOtherPanelWidth: () => 280,
      });

      resizer.mount(container);

      const handle = container.querySelector('.da-resizer');
      expect(handle).not.toBeNull();
    });

    it('should add correct class for code panel resizer', () => {
      resizer = new PanelResizer({
        panel: 'code',
        onResize: onResizeMock,
        getCurrentWidth: () => 350,
        getOtherPanelWidth: () => 280,
      });

      resizer.mount(container);

      const handle = container.querySelector('.da-resizer--right');
      expect(handle).not.toBeNull();
    });

    it('should add correct class for state panel resizer', () => {
      resizer = new PanelResizer({
        panel: 'state',
        onResize: onResizeMock,
        getCurrentWidth: () => 280,
        getOtherPanelWidth: () => 350,
      });

      resizer.mount(container);

      const handle = container.querySelector('.da-resizer--left');
      expect(handle).not.toBeNull();
    });

    it('should set accessibility attributes', () => {
      resizer = new PanelResizer({
        panel: 'code',
        onResize: onResizeMock,
        getCurrentWidth: () => 350,
        getOtherPanelWidth: () => 280,
      });

      resizer.mount(container);

      const handle = container.querySelector('.da-resizer');
      expect(handle?.getAttribute('role')).toBe('separator');
      expect(handle?.getAttribute('aria-orientation')).toBe('vertical');
      expect(handle?.getAttribute('aria-label')).toBe('Resize code panel');
      expect(handle?.getAttribute('tabindex')).toBe('0');
    });
  });

  describe('mouse events', () => {
    beforeEach(() => {
      resizer = new PanelResizer({
        panel: 'code',
        onResize: onResizeMock,
        getCurrentWidth: () => 350,
        getOtherPanelWidth: () => 280,
      });
      resizer.mount(container);
    });

    it('should start drag on mousedown', () => {
      const handle = container.querySelector('.da-resizer') as HTMLElement;

      const mouseDown = new MouseEvent('mousedown', {
        clientX: 350,
        bubbles: true,
      });
      handle.dispatchEvent(mouseDown);

      expect(resizer.isDraggingActive()).toBe(true);
    });

    it('should add da-resizing class to body on mousedown', () => {
      const handle = container.querySelector('.da-resizer') as HTMLElement;

      const mouseDown = new MouseEvent('mousedown', {
        clientX: 350,
        bubbles: true,
      });
      handle.dispatchEvent(mouseDown);

      expect(document.body.classList.contains('da-resizing')).toBe(true);
    });

    it('should add da-resizer--active class on mousedown', () => {
      const handle = container.querySelector('.da-resizer') as HTMLElement;

      const mouseDown = new MouseEvent('mousedown', {
        clientX: 350,
        bubbles: true,
      });
      handle.dispatchEvent(mouseDown);

      expect(handle.classList.contains('da-resizer--active')).toBe(true);
    });

    it('should call onResize during mousemove', () => {
      const handle = container.querySelector('.da-resizer') as HTMLElement;

      // Start drag
      const mouseDown = new MouseEvent('mousedown', {
        clientX: 350,
        bubbles: true,
      });
      handle.dispatchEvent(mouseDown);

      // Move mouse
      const mouseMove = new MouseEvent('mousemove', {
        clientX: 400,
        bubbles: true,
      });
      document.dispatchEvent(mouseMove);

      expect(onResizeMock).toHaveBeenCalled();
    });

    it('should calculate correct delta for code panel (increasing width)', () => {
      const handle = container.querySelector('.da-resizer') as HTMLElement;

      // Start drag at x=350
      const mouseDown = new MouseEvent('mousedown', {
        clientX: 350,
        bubbles: true,
      });
      handle.dispatchEvent(mouseDown);

      // Move mouse to x=400 (delta = +50)
      const mouseMove = new MouseEvent('mousemove', {
        clientX: 400,
        bubbles: true,
      });
      document.dispatchEvent(mouseMove);

      // New width should be 350 + 50 = 400
      expect(onResizeMock).toHaveBeenCalledWith(400);
    });

    it('should end drag on mouseup', () => {
      const handle = container.querySelector('.da-resizer') as HTMLElement;

      // Start drag
      const mouseDown = new MouseEvent('mousedown', {
        clientX: 350,
        bubbles: true,
      });
      handle.dispatchEvent(mouseDown);

      // End drag
      const mouseUp = new MouseEvent('mouseup', { bubbles: true });
      document.dispatchEvent(mouseUp);

      expect(resizer.isDraggingActive()).toBe(false);
    });

    it('should remove da-resizing class from body on mouseup', () => {
      const handle = container.querySelector('.da-resizer') as HTMLElement;

      // Start drag
      const mouseDown = new MouseEvent('mousedown', {
        clientX: 350,
        bubbles: true,
      });
      handle.dispatchEvent(mouseDown);

      // End drag
      const mouseUp = new MouseEvent('mouseup', { bubbles: true });
      document.dispatchEvent(mouseUp);

      expect(document.body.classList.contains('da-resizing')).toBe(false);
    });

    it('should remove da-resizer--active class on mouseup', () => {
      const handle = container.querySelector('.da-resizer') as HTMLElement;

      // Start drag
      const mouseDown = new MouseEvent('mousedown', {
        clientX: 350,
        bubbles: true,
      });
      handle.dispatchEvent(mouseDown);

      // End drag
      const mouseUp = new MouseEvent('mouseup', { bubbles: true });
      document.dispatchEvent(mouseUp);

      expect(handle.classList.contains('da-resizer--active')).toBe(false);
    });
  });

  describe('state panel resize', () => {
    it('should calculate correct delta for state panel (inverted)', () => {
      resizer = new PanelResizer({
        panel: 'state',
        onResize: onResizeMock,
        getCurrentWidth: () => 280,
        getOtherPanelWidth: () => 350,
      });
      resizer.mount(container);

      const handle = container.querySelector('.da-resizer') as HTMLElement;

      // Start drag at x=920 (viewport - stateWidth)
      const mouseDown = new MouseEvent('mousedown', {
        clientX: 920,
        bubbles: true,
      });
      handle.dispatchEvent(mouseDown);

      // Move mouse left to x=870 (delta = -50, but state width increases)
      const mouseMove = new MouseEvent('mousemove', {
        clientX: 870,
        bubbles: true,
      });
      document.dispatchEvent(mouseMove);

      // New width should be 280 - (-50) = 330
      expect(onResizeMock).toHaveBeenCalledWith(330);
    });
  });

  describe('width constraints', () => {
    beforeEach(() => {
      resizer = new PanelResizer({
        panel: 'code',
        onResize: onResizeMock,
        getCurrentWidth: () => 350,
        getOtherPanelWidth: () => 280,
      });
      resizer.mount(container);
    });

    it('should enforce minimum width', () => {
      const handle = container.querySelector('.da-resizer') as HTMLElement;

      // Start drag at x=350
      const mouseDown = new MouseEvent('mousedown', {
        clientX: 350,
        bubbles: true,
      });
      handle.dispatchEvent(mouseDown);

      // Try to drag to x=100 (would make width 100px, below minimum)
      const mouseMove = new MouseEvent('mousemove', {
        clientX: 100,
        bubbles: true,
      });
      document.dispatchEvent(mouseMove);

      // Should be constrained to minimum (250px)
      expect(onResizeMock).toHaveBeenCalledWith(PANEL_CONSTRAINTS.CODE_MIN);
    });

    it('should enforce maximum width (leaving room for circuit panel)', () => {
      const handle = container.querySelector('.da-resizer') as HTMLElement;

      // Start drag at x=350
      const mouseDown = new MouseEvent('mousedown', {
        clientX: 350,
        bubbles: true,
      });
      handle.dispatchEvent(mouseDown);

      // Try to drag to x=800 (would exceed available space)
      const mouseMove = new MouseEvent('mousemove', {
        clientX: 800,
        bubbles: true,
      });
      document.dispatchEvent(mouseMove);

      // Max = 1200 - 400 (circuit min) - 280 (state) = 520
      expect(onResizeMock).toHaveBeenCalledWith(520);
    });
  });

  describe('destroy', () => {
    it('should remove the resize handle element', () => {
      resizer = new PanelResizer({
        panel: 'code',
        onResize: onResizeMock,
        getCurrentWidth: () => 350,
        getOtherPanelWidth: () => 280,
      });
      resizer.mount(container);

      resizer.destroy();

      const handle = container.querySelector('.da-resizer');
      expect(handle).toBeNull();
    });

    it('should end any active drag on destroy', () => {
      resizer = new PanelResizer({
        panel: 'code',
        onResize: onResizeMock,
        getCurrentWidth: () => 350,
        getOtherPanelWidth: () => 280,
      });
      resizer.mount(container);

      // Start drag
      const handle = container.querySelector('.da-resizer') as HTMLElement;
      const mouseDown = new MouseEvent('mousedown', {
        clientX: 350,
        bubbles: true,
      });
      handle.dispatchEvent(mouseDown);

      // Destroy while dragging
      resizer.destroy();

      expect(document.body.classList.contains('da-resizing')).toBe(false);
    });

    it('should be safe to call destroy multiple times', () => {
      resizer = new PanelResizer({
        panel: 'code',
        onResize: onResizeMock,
        getCurrentWidth: () => 350,
        getOtherPanelWidth: () => 280,
      });
      resizer.mount(container);

      resizer.destroy();
      resizer.destroy(); // Should not throw

      expect(container.querySelector('.da-resizer')).toBeNull();
    });
  });

  describe('getElement', () => {
    it('should return the resize handle element after mount', () => {
      resizer = new PanelResizer({
        panel: 'code',
        onResize: onResizeMock,
        getCurrentWidth: () => 350,
        getOtherPanelWidth: () => 280,
      });
      resizer.mount(container);

      expect(resizer.getElement()).not.toBeNull();
      expect(resizer.getElement()?.classList.contains('da-resizer')).toBe(true);
    });

    it('should return null before mount', () => {
      resizer = new PanelResizer({
        panel: 'code',
        onResize: onResizeMock,
        getCurrentWidth: () => 350,
        getOtherPanelWidth: () => 280,
      });

      expect(resizer.getElement()).toBeNull();
    });
  });

  describe('keyboard accessibility', () => {
    let currentWidth: number;

    beforeEach(() => {
      currentWidth = 350;
      resizer = new PanelResizer({
        panel: 'code',
        onResize: (width) => {
          currentWidth = width;
          onResizeMock(width);
        },
        getCurrentWidth: () => currentWidth,
        getOtherPanelWidth: () => 280,
      });
      resizer.mount(container);
    });

    it('should increase code panel width on ArrowRight', () => {
      const handle = container.querySelector('.da-resizer') as HTMLElement;

      const keyDown = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
      });
      handle.dispatchEvent(keyDown);

      // Default step is 10px
      expect(onResizeMock).toHaveBeenCalledWith(360);
    });

    it('should decrease code panel width on ArrowLeft', () => {
      const handle = container.querySelector('.da-resizer') as HTMLElement;

      const keyDown = new KeyboardEvent('keydown', {
        key: 'ArrowLeft',
        bubbles: true,
      });
      handle.dispatchEvent(keyDown);

      // Default step is 10px
      expect(onResizeMock).toHaveBeenCalledWith(340);
    });

    it('should use larger step with Shift key', () => {
      const handle = container.querySelector('.da-resizer') as HTMLElement;

      const keyDown = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        shiftKey: true,
        bubbles: true,
      });
      handle.dispatchEvent(keyDown);

      // Large step is 50px
      expect(onResizeMock).toHaveBeenCalledWith(400);
    });

    it('should set minimum width on Home key', () => {
      const handle = container.querySelector('.da-resizer') as HTMLElement;

      const keyDown = new KeyboardEvent('keydown', {
        key: 'Home',
        bubbles: true,
      });
      handle.dispatchEvent(keyDown);

      expect(onResizeMock).toHaveBeenCalledWith(PANEL_CONSTRAINTS.CODE_MIN);
    });

    it('should set maximum width on End key', () => {
      const handle = container.querySelector('.da-resizer') as HTMLElement;

      const keyDown = new KeyboardEvent('keydown', {
        key: 'End',
        bubbles: true,
      });
      handle.dispatchEvent(keyDown);

      // Max = 1200 - 400 (circuit min) - 280 (state) = 520
      expect(onResizeMock).toHaveBeenCalledWith(520);
    });

    it('should enforce minimum width on keyboard resize', () => {
      currentWidth = 260; // Just above minimum
      const handle = container.querySelector('.da-resizer') as HTMLElement;

      const keyDown = new KeyboardEvent('keydown', {
        key: 'ArrowLeft',
        shiftKey: true, // -50px would go below minimum
        bubbles: true,
      });
      handle.dispatchEvent(keyDown);

      // Should be constrained to minimum
      expect(onResizeMock).toHaveBeenCalledWith(PANEL_CONSTRAINTS.CODE_MIN);
    });

    it('should not call onResize for unhandled keys', () => {
      const handle = container.querySelector('.da-resizer') as HTMLElement;

      const keyDown = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
      });
      handle.dispatchEvent(keyDown);

      expect(onResizeMock).not.toHaveBeenCalled();
    });
  });

  describe('ARIA attributes', () => {
    it('should set aria-valuenow on mount', () => {
      resizer = new PanelResizer({
        panel: 'code',
        onResize: onResizeMock,
        getCurrentWidth: () => 350,
        getOtherPanelWidth: () => 280,
      });
      resizer.mount(container);

      const handle = container.querySelector('.da-resizer');
      expect(handle?.getAttribute('aria-valuenow')).toBe('350');
    });

    it('should set aria-valuemin on mount', () => {
      resizer = new PanelResizer({
        panel: 'code',
        onResize: onResizeMock,
        getCurrentWidth: () => 350,
        getOtherPanelWidth: () => 280,
      });
      resizer.mount(container);

      const handle = container.querySelector('.da-resizer');
      expect(handle?.getAttribute('aria-valuemin')).toBe('250');
    });

    it('should set aria-valuemax on mount', () => {
      resizer = new PanelResizer({
        panel: 'code',
        onResize: onResizeMock,
        getCurrentWidth: () => 350,
        getOtherPanelWidth: () => 280,
      });
      resizer.mount(container);

      const handle = container.querySelector('.da-resizer');
      // Max = 1200 - 400 (circuit min) - 280 (state) = 520
      expect(handle?.getAttribute('aria-valuemax')).toBe('520');
    });

    it('should use STATE_MIN for state panel aria-valuemin', () => {
      resizer = new PanelResizer({
        panel: 'state',
        onResize: onResizeMock,
        getCurrentWidth: () => 280,
        getOtherPanelWidth: () => 350,
      });
      resizer.mount(container);

      const handle = container.querySelector('.da-resizer');
      expect(handle?.getAttribute('aria-valuemin')).toBe('200');
    });
  });

  describe('state panel keyboard', () => {
    let currentWidth: number;

    beforeEach(() => {
      currentWidth = 280;
      resizer = new PanelResizer({
        panel: 'state',
        onResize: (width) => {
          currentWidth = width;
          onResizeMock(width);
        },
        getCurrentWidth: () => currentWidth,
        getOtherPanelWidth: () => 350,
      });
      resizer.mount(container);
    });

    it('should increase state panel width on ArrowLeft (inverted)', () => {
      const handle = container.querySelector('.da-resizer') as HTMLElement;

      const keyDown = new KeyboardEvent('keydown', {
        key: 'ArrowLeft',
        bubbles: true,
      });
      handle.dispatchEvent(keyDown);

      // ArrowLeft increases state panel width
      expect(onResizeMock).toHaveBeenCalledWith(290);
    });

    it('should decrease state panel width on ArrowRight (inverted)', () => {
      const handle = container.querySelector('.da-resizer') as HTMLElement;

      const keyDown = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
      });
      handle.dispatchEvent(keyDown);

      // ArrowRight decreases state panel width
      expect(onResizeMock).toHaveBeenCalledWith(270);
    });
  });
});
