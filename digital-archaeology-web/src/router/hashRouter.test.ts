// src/router/hashRouter.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HashRouter, parseHash, buildHash } from './hashRouter';
import type { RouteState } from './hashRouter';

describe('hashRouter', () => {
  describe('parseHash', () => {
    it('should parse valid lab mode hash with stage', () => {
      expect(parseHash('#/lab/micro4')).toEqual({ mode: 'lab', stage: 'micro4' });
      expect(parseHash('#/lab/micro8')).toEqual({ mode: 'lab', stage: 'micro8' });
      expect(parseHash('#/lab/micro16')).toEqual({ mode: 'lab', stage: 'micro16' });
      expect(parseHash('#/lab/micro32')).toEqual({ mode: 'lab', stage: 'micro32' });
      expect(parseHash('#/lab/micro32p')).toEqual({ mode: 'lab', stage: 'micro32p' });
      expect(parseHash('#/lab/micro32s')).toEqual({ mode: 'lab', stage: 'micro32s' });
    });

    it('should parse story mode hash', () => {
      expect(parseHash('#/story')).toEqual({ mode: 'story', stage: 'micro4' });
    });

    it('should fallback to defaults for invalid stage', () => {
      expect(parseHash('#/lab/invalid')).toEqual({ mode: 'lab', stage: 'micro4' });
      expect(parseHash('#/lab/MICRO4')).toEqual({ mode: 'lab', stage: 'micro4' }); // case sensitive
      expect(parseHash('#/lab/foo')).toEqual({ mode: 'lab', stage: 'micro4' });
    });

    it('should fallback to defaults for invalid mode', () => {
      expect(parseHash('#/invalid')).toEqual({ mode: 'lab', stage: 'micro4' });
      expect(parseHash('#/LAB/micro4')).toEqual({ mode: 'lab', stage: 'micro4' }); // case sensitive
    });

    it('should handle empty or missing hash', () => {
      expect(parseHash('')).toEqual({ mode: 'lab', stage: 'micro4' });
      expect(parseHash('#')).toEqual({ mode: 'lab', stage: 'micro4' });
      expect(parseHash('#/')).toEqual({ mode: 'lab', stage: 'micro4' });
    });

    it('should handle lab mode without stage (defaults stage)', () => {
      expect(parseHash('#/lab')).toEqual({ mode: 'lab', stage: 'micro4' });
    });

    it('should handle story mode with extra path segments (ignores them)', () => {
      expect(parseHash('#/story/extra')).toEqual({ mode: 'story', stage: 'micro4' });
    });

    it('should handle lab mode with valid stage and extra segments (ignores extra)', () => {
      expect(parseHash('#/lab/micro8/extra')).toEqual({ mode: 'lab', stage: 'micro8' });
    });
  });

  describe('buildHash', () => {
    it('should build lab mode hash with stage', () => {
      expect(buildHash('lab', 'micro4')).toBe('#/lab/micro4');
      expect(buildHash('lab', 'micro8')).toBe('#/lab/micro8');
      expect(buildHash('lab', 'micro16')).toBe('#/lab/micro16');
    });

    it('should build story mode hash without stage', () => {
      expect(buildHash('story', 'micro4')).toBe('#/story');
      expect(buildHash('story', 'micro8')).toBe('#/story'); // stage ignored in story mode
    });
  });

  describe('HashRouter', () => {
    let router: HashRouter;

    beforeEach(() => {
      router = new HashRouter();
      // Reset hash
      window.location.hash = '';
    });

    afterEach(() => {
      router.stop();
      window.location.hash = '';
    });

    describe('navigate', () => {
      it('should update window.location.hash', () => {
        router.navigate('lab', 'micro8');
        expect(window.location.hash).toBe('#/lab/micro8');
      });

      it('should default stage to micro4 when not specified', () => {
        router.navigate('lab');
        expect(window.location.hash).toBe('#/lab/micro4');
      });

      it('should set story mode hash', () => {
        router.navigate('story');
        expect(window.location.hash).toBe('#/story');
      });
    });

    describe('replace', () => {
      it('should update hash without pushing history', () => {
        const historyLength = window.history.length;
        router.replace('lab', 'micro16');
        expect(window.location.hash).toBe('#/lab/micro16');
        // history.length should NOT increase (replaceState doesn't push)
        expect(window.history.length).toBe(historyLength);
      });
    });

    describe('getCurrentRoute', () => {
      it('should return current route from hash', () => {
        window.location.hash = '#/lab/micro8';
        const route = router.getCurrentRoute();
        expect(route).toEqual({ mode: 'lab', stage: 'micro8' });
      });

      it('should return defaults when no hash', () => {
        window.location.hash = '';
        const route = router.getCurrentRoute();
        expect(route).toEqual({ mode: 'lab', stage: 'micro4' });
      });
    });

    describe('start/stop', () => {
      it('should fire callback on hashchange after start', async () => {
        // Let any pending hashchange events from prior tests settle
        await new Promise((resolve) => setTimeout(resolve, 50));

        const callback = vi.fn();
        router.onRouteChange(callback);
        router.start();

        // Trigger hashchange
        window.location.hash = '#/lab/micro8';

        // hashchange is async, wait for it
        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith({ mode: 'lab', stage: 'micro8' });
      });

      it('should NOT fire callback after stop', async () => {
        const callback = vi.fn();
        router.onRouteChange(callback);
        router.start();
        router.stop();

        window.location.hash = '#/lab/micro16';
        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(callback).not.toHaveBeenCalled();
      });

      it('should handle start without callback registered', async () => {
        router.start();
        // Should not throw
        window.location.hash = '#/lab/micro8';
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      it('should handle stop without start (no-op)', () => {
        expect(() => router.stop()).not.toThrow();
      });

      it('should clean up existing listener on double start (CR H-3)', async () => {
        // Let any pending hashchange events from prior tests settle
        await new Promise((resolve) => setTimeout(resolve, 50));

        const callback = vi.fn();
        router.onRouteChange(callback);
        router.start();
        router.start(); // Double start — should NOT create duplicate listeners

        window.location.hash = '#/lab/micro8';
        await new Promise((resolve) => setTimeout(resolve, 50));

        // Should fire exactly once, not twice
        expect(callback).toHaveBeenCalledTimes(1);
      });

      it('should clear callback on stop (CR M-1)', () => {
        const callback = vi.fn();
        router.onRouteChange(callback);
        router.start();
        router.stop();

        // Callback should be cleared
        const routerAny = router as unknown as { callback: unknown };
        expect(routerAny.callback).toBeNull();
      });
    });

    describe('route change callback', () => {
      it('should fire callback with parsed route on hashchange', async () => {
        // Let any pending hashchange events from prior tests settle
        await new Promise((resolve) => setTimeout(resolve, 50));

        const routes: RouteState[] = [];
        router.onRouteChange((route) => routes.push(route));
        router.start();

        window.location.hash = '#/lab/micro8';
        await new Promise((resolve) => setTimeout(resolve, 50));

        window.location.hash = '#/story';
        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(routes).toHaveLength(2);
        expect(routes[0]).toEqual({ mode: 'lab', stage: 'micro8' });
        expect(routes[1]).toEqual({ mode: 'story', stage: 'micro4' });
      });

      it('should handle invalid hash in callback with fallback values', async () => {
        const callback = vi.fn();
        router.onRouteChange(callback);
        router.start();

        window.location.hash = '#/invalid/garbage';
        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(callback).toHaveBeenCalledWith({ mode: 'lab', stage: 'micro4' });
      });
    });
  });
});
