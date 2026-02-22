// src/story/TimeTravelPortal.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TimeTravelPortal } from './TimeTravelPortal';

describe('TimeTravelPortal', () => {
  let container: HTMLElement;
  let portal: TimeTravelPortal;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    portal?.destroy();
    container.remove();
  });

  describe('Lifecycle', () => {
    it('should create canvas element on mount', () => {
      portal = new TimeTravelPortal();
      portal.mount(container);
      const canvas = container.querySelector('canvas');
      expect(canvas).not.toBeNull();
    });

    it('should set canvas to aria-hidden for accessibility', () => {
      portal = new TimeTravelPortal();
      portal.mount(container);
      const canvas = container.querySelector('canvas');
      expect(canvas?.getAttribute('aria-hidden')).toBe('true');
    });

    it('should create backdrop element on mount', () => {
      portal = new TimeTravelPortal();
      portal.mount(container);
      const backdrop = container.querySelector('.da-portal-backdrop');
      expect(backdrop).not.toBeNull();
    });

    it('should remove all elements on destroy', () => {
      portal = new TimeTravelPortal();
      portal.mount(container);
      portal.destroy();
      expect(container.querySelector('canvas')).toBeNull();
      expect(container.querySelector('.da-portal-backdrop')).toBeNull();
    });

    it('should handle destroy before mount gracefully', () => {
      portal = new TimeTravelPortal();
      expect(() => portal.destroy()).not.toThrow();
    });
  });
});
