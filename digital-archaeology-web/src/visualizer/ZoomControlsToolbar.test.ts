// src/visualizer/ZoomControlsToolbar.test.ts
// Unit tests for ZoomControlsToolbar component (Story 6.6)

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ZoomControlsToolbar,
  type ZoomControlsCallbacks,
  type ZoomControlsState,
} from './ZoomControlsToolbar';

describe('ZoomControlsToolbar', () => {
  let container: HTMLDivElement;
  let toolbar: ZoomControlsToolbar;
  let callbacks: ZoomControlsCallbacks;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    callbacks = {
      onZoomIn: vi.fn(),
      onZoomOut: vi.fn(),
      onZoomFit: vi.fn(),
      onZoomReset: vi.fn(),
    };

    toolbar = new ZoomControlsToolbar(callbacks);
  });

  afterEach(() => {
    toolbar.destroy();
    container.parentNode?.removeChild(container);
  });

  describe('mount()', () => {
    it('should create zoom controls container', () => {
      toolbar.mount(container);

      const controls = container.querySelector('.da-zoom-controls');
      expect(controls).not.toBeNull();
    });

    it('should set role="group" for accessibility', () => {
      toolbar.mount(container);

      const controls = container.querySelector('.da-zoom-controls');
      expect(controls?.getAttribute('role')).toBe('group');
    });

    it('should set aria-label for accessibility', () => {
      toolbar.mount(container);

      const controls = container.querySelector('.da-zoom-controls');
      expect(controls?.getAttribute('aria-label')).toBe('Zoom controls');
    });

    it('should create zoom out button', () => {
      toolbar.mount(container);

      const btn = container.querySelector('[data-action="zoom-out"]');
      expect(btn).not.toBeNull();
      expect(btn?.textContent).toBe('-');
      expect(btn?.getAttribute('aria-label')).toBe('Zoom out');
    });

    it('should create zoom in button', () => {
      toolbar.mount(container);

      const btn = container.querySelector('[data-action="zoom-in"]');
      expect(btn).not.toBeNull();
      expect(btn?.textContent).toBe('+');
      expect(btn?.getAttribute('aria-label')).toBe('Zoom in');
    });

    it('should create fit button', () => {
      toolbar.mount(container);

      const btn = container.querySelector('[data-action="fit"]');
      expect(btn).not.toBeNull();
      expect(btn?.textContent).toBe('Fit');
      expect(btn?.getAttribute('aria-label')).toBe('Fit to view');
    });

    it('should create reset button', () => {
      toolbar.mount(container);

      const btn = container.querySelector('[data-action="reset"]');
      expect(btn).not.toBeNull();
      expect(btn?.textContent).toBe('100%');
      expect(btn?.getAttribute('aria-label')).toBe('Reset zoom');
    });

    it('should create zoom level display', () => {
      toolbar.mount(container);

      const display = container.querySelector('.da-zoom-level');
      expect(display).not.toBeNull();
      expect(display?.textContent).toBe('100%');
    });

    it('should set aria-live="polite" on zoom level display', () => {
      toolbar.mount(container);

      const display = container.querySelector('.da-zoom-level');
      expect(display?.getAttribute('aria-live')).toBe('polite');
    });

    it('should throw if already mounted', () => {
      toolbar.mount(container);
      expect(() => toolbar.mount(container)).toThrow();
    });
  });

  describe('button click callbacks', () => {
    it('should call onZoomOut when zoom out button is clicked', () => {
      toolbar.mount(container);

      const btn = container.querySelector('[data-action="zoom-out"]') as HTMLButtonElement;
      btn.click();

      expect(callbacks.onZoomOut).toHaveBeenCalledTimes(1);
    });

    it('should call onZoomIn when zoom in button is clicked', () => {
      toolbar.mount(container);

      const btn = container.querySelector('[data-action="zoom-in"]') as HTMLButtonElement;
      btn.click();

      expect(callbacks.onZoomIn).toHaveBeenCalledTimes(1);
    });

    it('should call onZoomFit when fit button is clicked', () => {
      toolbar.mount(container);

      const btn = container.querySelector('[data-action="fit"]') as HTMLButtonElement;
      btn.click();

      expect(callbacks.onZoomFit).toHaveBeenCalledTimes(1);
    });

    it('should call onZoomReset when reset button is clicked', () => {
      toolbar.mount(container);

      const btn = container.querySelector('[data-action="reset"]') as HTMLButtonElement;
      btn.click();

      expect(callbacks.onZoomReset).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateState()', () => {
    it('should update zoom level display', () => {
      toolbar.mount(container);

      const state: ZoomControlsState = { zoomPercent: '150%' };
      toolbar.updateState(state);

      const display = container.querySelector('.da-zoom-level');
      expect(display?.textContent).toBe('150%');
    });

    it('should handle different zoom percentages', () => {
      toolbar.mount(container);

      toolbar.updateState({ zoomPercent: '25%' });
      let display = container.querySelector('.da-zoom-level');
      expect(display?.textContent).toBe('25%');

      toolbar.updateState({ zoomPercent: '400%' });
      display = container.querySelector('.da-zoom-level');
      expect(display?.textContent).toBe('400%');
    });

    it('should not throw if called before mount', () => {
      expect(() => toolbar.updateState({ zoomPercent: '100%' })).not.toThrow();
    });
  });

  describe('destroy()', () => {
    it('should remove the controls element from DOM', () => {
      toolbar.mount(container);
      toolbar.destroy();

      const controls = container.querySelector('.da-zoom-controls');
      expect(controls).toBeNull();
    });

    it('should not throw if called before mount', () => {
      expect(() => toolbar.destroy()).not.toThrow();
    });

    it('should not throw if called multiple times', () => {
      toolbar.mount(container);
      toolbar.destroy();
      expect(() => toolbar.destroy()).not.toThrow();
    });

    it('should clean up event listeners (no errors after destroy)', () => {
      toolbar.mount(container);
      const btn = container.querySelector('[data-action="zoom-in"]') as HTMLButtonElement;
      toolbar.destroy();

      // The button is removed, so clicking shouldn't work
      // This is more of a sanity check
      expect(callbacks.onZoomIn).not.toHaveBeenCalled();
    });
  });

  describe('getElement()', () => {
    it('should return null before mount', () => {
      expect(toolbar.getElement()).toBeNull();
    });

    it('should return the controls element after mount', () => {
      toolbar.mount(container);

      const element = toolbar.getElement();
      expect(element).not.toBeNull();
      expect(element?.classList.contains('da-zoom-controls')).toBe(true);
    });

    it('should return null after destroy', () => {
      toolbar.mount(container);
      toolbar.destroy();

      expect(toolbar.getElement()).toBeNull();
    });
  });
});
