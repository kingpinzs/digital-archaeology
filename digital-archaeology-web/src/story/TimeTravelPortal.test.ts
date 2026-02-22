// src/story/TimeTravelPortal.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TimeTravelPortal } from './TimeTravelPortal';

describe('TimeTravelPortal', () => {
  let container: HTMLElement;
  let portal: TimeTravelPortal;

  // Cache mock contexts so the same canvas element always returns the same mock
  const ctxCache = new WeakMap<HTMLCanvasElement, CanvasRenderingContext2D>();

  // Mock canvas gradient object
  const mockGradient = {
    addColorStop: vi.fn(),
  };

  function createMockCtx(): CanvasRenderingContext2D {
    return {
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      beginPath: vi.fn(),
      ellipse: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      setTransform: vi.fn(),
      scale: vi.fn(),
      createRadialGradient: vi.fn().mockReturnValue(mockGradient),
      canvas: { width: 800, height: 600 },
      lineCap: 'butt' as CanvasLineCap,
      shadowBlur: 0,
      shadowColor: '',
    } as unknown as CanvasRenderingContext2D;
  }

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    // Mock window.matchMedia (jsdom doesn't implement it)
    if (!window.matchMedia) {
      window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as any;
    }

    // Mock HTMLCanvasElement.prototype.getContext to return a cached mock 2D context
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      function (this: HTMLCanvasElement, contextId: string) {
        if (contextId === '2d') {
          let ctx = ctxCache.get(this);
          if (!ctx) {
            ctx = createMockCtx();
            ctxCache.set(this, ctx);
          }
          return ctx;
        }
        return null;
      }
    );
  });

  afterEach(() => {
    portal?.destroy();
    container.remove();
    vi.restoreAllMocks();
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

  describe('play()', () => {
    it('should return a Promise that resolves', async () => {
      portal = new TimeTravelPortal();
      portal.mount(container);
      const result = portal.play('chapter');
      expect(result).toBeInstanceOf(Promise);
      await result;
    });

    it('should show backdrop during animation', async () => {
      portal = new TimeTravelPortal();
      portal.mount(container);
      const playPromise = portal.play('chapter');
      const backdrop = container.querySelector('.da-portal-backdrop');
      expect(backdrop?.classList.contains('da-portal-backdrop--visible')).toBe(true);
      await playPromise;
    });

    it('should hide backdrop after animation completes', async () => {
      portal = new TimeTravelPortal();
      portal.mount(container);
      await portal.play('chapter');
      const backdrop = container.querySelector('.da-portal-backdrop');
      expect(backdrop?.classList.contains('da-portal-backdrop--visible')).toBe(false);
    });

    it('should accept persona mode', async () => {
      portal = new TimeTravelPortal();
      portal.mount(container);
      await portal.play('persona');
    }, 10000);

    it('should resolve immediately if prefers-reduced-motion', async () => {
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as any;
      portal = new TimeTravelPortal();
      portal.mount(container);
      const start = performance.now();
      await portal.play('chapter');
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100);
      window.matchMedia = originalMatchMedia;
    });

    it('should cancel animation on destroy mid-play', async () => {
      portal = new TimeTravelPortal();
      portal.mount(container);
      const playPromise = portal.play('chapter');
      portal.destroy();
      await playPromise;
    });
  });

  describe('Ring rendering', () => {
    it('should call canvas ellipse during chapter animation', async () => {
      portal = new TimeTravelPortal();
      portal.mount(container);
      const canvas = container.querySelector('canvas')!;
      const ctx = canvas.getContext('2d')!;
      const ellipseSpy = vi.spyOn(ctx, 'ellipse');
      const playPromise = portal.play('chapter');
      await new Promise((r) => requestAnimationFrame(r));
      expect(ellipseSpy).toHaveBeenCalled();
      portal.destroy();
      await playPromise;
    });
  });

  describe('Particle rendering', () => {
    it('should draw particles during animation', async () => {
      portal = new TimeTravelPortal();
      portal.mount(container);
      const canvas = container.querySelector('canvas')!;
      const ctx = canvas.getContext('2d')!;
      const fillRectSpy = vi.spyOn(ctx, 'fillRect');
      const playPromise = portal.play('chapter');
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));
      // Background fill + particle dots = many calls
      expect(fillRectSpy.mock.calls.length).toBeGreaterThan(5);
      portal.destroy();
      await playPromise;
    });
  });

  describe('Center glow', () => {
    it('should create radial gradient during animation', async () => {
      portal = new TimeTravelPortal();
      portal.mount(container);
      const canvas = container.querySelector('canvas')!;
      const ctx = canvas.getContext('2d')!;
      const gradientSpy = vi.spyOn(ctx, 'createRadialGradient');
      const playPromise = portal.play('chapter');
      for (let i = 0; i < 5; i++) {
        await new Promise((r) => requestAnimationFrame(r));
      }
      expect(gradientSpy).toHaveBeenCalled();
      portal.destroy();
      await playPromise;
    });
  });
});
