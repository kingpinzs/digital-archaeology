// src/story/MindsetIntroScene.test.ts
// Tests for MindsetIntroScene component
// Story 10.21: Historical Mindset Time-Travel

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MindsetIntroScene } from './MindsetIntroScene';
import { MindsetProvider } from './MindsetProvider';
import type { MindsetContext } from './types';

describe('MindsetIntroScene', () => {
  let scene: MindsetIntroScene;
  let container: HTMLElement;

  const mockMindset: MindsetContext = {
    year: 1971,
    knownTechnology: ['transistor', 'integrated circuit'],
    unknownTechnology: ['internet', 'smartphone'],
    activeProblems: [
      {
        statement: 'How to put a CPU on a single chip?',
        motivation: 'Reduce cost and power consumption',
      },
    ],
    constraints: [
      {
        type: 'technical',
        description: 'Limited transistor count',
        limitation: '2300 transistors max',
      },
    ],
    impossibilities: ['1GB RAM', 'GHz clock speeds'],
    historicalPerspective: {
      currentKnowledge: 'You are at Intel, working on the first microprocessor.',
      futureBlind: 'You do not know if this idea will succeed.',
    },
  };

  beforeEach(() => {
    MindsetProvider.resetInstance();
    container = document.createElement('div');
    document.body.appendChild(container);
    scene = new MindsetIntroScene({ skipAnimation: true });
  });

  afterEach(() => {
    scene.destroy();
    container.remove();
    MindsetProvider.resetInstance();
  });

  describe('mount', () => {
    it('should create intro element in container', () => {
      scene.mount(container);
      expect(container.querySelector('.da-mindset-intro')).not.toBeNull();
    });

    it('should have dialog role for accessibility', () => {
      scene.mount(container);
      const element = container.querySelector('.da-mindset-intro');
      expect(element?.getAttribute('role')).toBe('dialog');
    });

    it('should have aria-modal attribute', () => {
      scene.mount(container);
      const element = container.querySelector('.da-mindset-intro');
      expect(element?.getAttribute('aria-modal')).toBe('true');
    });

    it('should have aria-labelledby for accessibility', () => {
      scene.mount(container);
      const element = container.querySelector('.da-mindset-intro');
      expect(element?.getAttribute('aria-labelledby')).toBe('mindset-intro-title');
    });
  });

  describe('setMindset', () => {
    beforeEach(() => {
      scene.mount(container);
    });

    it('should display the year in title', () => {
      scene.setMindset(mockMindset);
      const title = container.querySelector('.da-mindset-intro-title');
      expect(title?.textContent).toContain('1971');
    });

    it('should display historical perspective', () => {
      scene.setMindset(mockMindset);
      const subtitle = container.querySelector('.da-mindset-intro-subtitle');
      expect(subtitle?.textContent).toContain('You are at Intel');
    });

    it('should display future blind statement', () => {
      scene.setMindset(mockMindset);
      const reminder = container.querySelector('.da-mindset-intro-reminder');
      expect(reminder?.textContent).toContain('You do not know');
    });

    it('should mount EraContextPanel', () => {
      scene.setMindset(mockMindset);
      const contextPanel = container.querySelector('.da-era-context-panel');
      expect(contextPanel).not.toBeNull();
    });

    it('should set mindset in provider', () => {
      scene.setMindset(mockMindset);
      const provider = MindsetProvider.getInstance();
      expect(provider.getCurrentMindset()).toEqual(mockMindset);
    });

    it('should dispatch mindset-intro-shown event', () => {
      const handler = vi.fn();
      container.addEventListener('mindset-intro-shown', handler);

      scene.setMindset(mockMindset);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].detail).toEqual({ mindset: mockMindset });

      container.removeEventListener('mindset-intro-shown', handler);
    });
  });

  describe('year formatting', () => {
    beforeEach(() => {
      scene.mount(container);
    });

    it('should format BC years correctly', () => {
      scene.setMindset({ ...mockMindset, year: -500 });
      const title = container.querySelector('.da-mindset-intro-title');
      expect(title?.textContent).toContain('500 BC');
    });

    it('should format early AD years with tilde', () => {
      scene.setMindset({ ...mockMindset, year: 300 });
      const title = container.querySelector('.da-mindset-intro-title');
      expect(title?.textContent).toContain('~300 AD');
    });

    it('should format modern years normally', () => {
      scene.setMindset({ ...mockMindset, year: 1978 });
      const title = container.querySelector('.da-mindset-intro-title');
      expect(title?.textContent).toContain('1978');
      expect(title?.textContent).not.toContain('~');
    });
  });

  describe('dismiss', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      scene.mount(container);
      scene.setMindset(mockMindset);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should dismiss on continue button click', () => {
      const handler = vi.fn();
      scene.onDismissed(handler);

      const continueBtn = container.querySelector('.da-mindset-intro-continue') as HTMLElement;
      continueBtn?.click();

      // With skipAnimation: true, callback fires immediately after 0ms setTimeout
      vi.runAllTimers();
      expect(handler).toHaveBeenCalled();
    });

    it('should dismiss on backdrop click', () => {
      const handler = vi.fn();
      scene.onDismissed(handler);

      const backdrop = container.querySelector('.da-mindset-intro-backdrop') as HTMLElement;
      backdrop?.click();

      vi.runAllTimers();
      expect(handler).toHaveBeenCalled();
    });

    it('should dismiss on Escape key', () => {
      const handler = vi.fn();
      container.addEventListener('mindset-intro-dismissed', handler);

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);

      vi.runAllTimers();
      expect(handler).toHaveBeenCalled();

      container.removeEventListener('mindset-intro-dismissed', handler);
    });

    it('should dismiss on Enter key', () => {
      const handler = vi.fn();
      container.addEventListener('mindset-intro-dismissed', handler);

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      document.dispatchEvent(event);

      vi.runAllTimers();
      expect(handler).toHaveBeenCalled();

      container.removeEventListener('mindset-intro-dismissed', handler);
    });

    it('should add dismissing class when dismissed', () => {
      scene.dismiss();
      const element = container.querySelector('.da-mindset-intro');
      expect(element?.classList.contains('da-mindset-intro--dismissing')).toBe(true);
    });
  });

  describe('autoDismiss', () => {
    it('should auto-dismiss after specified time', () => {
      vi.useFakeTimers();
      const autoScene = new MindsetIntroScene({ skipAnimation: true, autoDismissMs: 5000 });
      autoScene.mount(container);

      const handler = vi.fn();
      container.addEventListener('mindset-intro-dismissed', handler);

      autoScene.setMindset(mockMindset);

      expect(handler).not.toHaveBeenCalled();

      vi.advanceTimersByTime(5000);
      vi.advanceTimersByTime(300); // Animation time

      expect(handler).toHaveBeenCalled();

      container.removeEventListener('mindset-intro-dismissed', handler);
      autoScene.destroy();
      vi.useRealTimers();
    });

    it('should cancel auto-dismiss on manual dismiss', () => {
      vi.useFakeTimers();
      const autoScene = new MindsetIntroScene({ skipAnimation: true, autoDismissMs: 5000 });
      autoScene.mount(container);

      autoScene.setMindset(mockMindset);
      autoScene.dismiss();

      vi.advanceTimersByTime(5000);
      // Should not throw or cause issues

      autoScene.destroy();
      vi.useRealTimers();
    });
  });

  describe('XSS prevention', () => {
    beforeEach(() => {
      scene.mount(container);
    });

    it('should escape HTML in perspective text', () => {
      scene.setMindset({
        ...mockMindset,
        historicalPerspective: {
          currentKnowledge: '<script>alert("xss")</script>',
          futureBlind: '<img onerror="alert(1)">',
        },
      });
      expect(container.innerHTML).not.toContain('<script>');
      expect(container.innerHTML).toContain('&lt;script&gt;');
    });

    it('should escape HTML in future blind text', () => {
      scene.setMindset({
        ...mockMindset,
        historicalPerspective: {
          currentKnowledge: 'test',
          futureBlind: '<div onclick="evil()">click</div>',
        },
      });
      expect(container.innerHTML).toContain('&lt;div');
      expect(container.innerHTML).not.toContain('<div onclick');
    });
  });

  describe('getMindset', () => {
    beforeEach(() => {
      scene.mount(container);
    });

    it('should return null before mindset is set', () => {
      expect(scene.getMindset()).toBeNull();
    });

    it('should return current mindset after set', () => {
      scene.setMindset(mockMindset);
      expect(scene.getMindset()).toEqual(mockMindset);
    });

    it('should return null after destroy', () => {
      scene.setMindset(mockMindset);
      scene.destroy();
      expect(scene.getMindset()).toBeNull();
    });
  });

  describe('destroy', () => {
    it('should remove element from DOM', () => {
      scene.mount(container);
      scene.setMindset(mockMindset);
      expect(container.querySelector('.da-mindset-intro')).not.toBeNull();

      scene.destroy();

      expect(container.querySelector('.da-mindset-intro')).toBeNull();
    });

    it('should clean up EraContextPanel', () => {
      scene.mount(container);
      scene.setMindset(mockMindset);
      expect(container.querySelector('.da-era-context-panel')).not.toBeNull();

      scene.destroy();

      expect(container.querySelector('.da-era-context-panel')).toBeNull();
    });
  });
});
