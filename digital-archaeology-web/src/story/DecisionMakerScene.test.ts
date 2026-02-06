// src/story/DecisionMakerScene.test.ts
// Tests for DecisionMakerScene component
// Story 10.22: Decision-Maker + Builder Mode

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DecisionMakerScene } from './DecisionMakerScene';
import { MindsetProvider } from './MindsetProvider';
import type { HistoricalDecision, MindsetContext } from './types';

describe('DecisionMakerScene', () => {
  let scene: DecisionMakerScene;
  let container: HTMLElement;

  const mockDecision: HistoricalDecision = {
    id: 'memory-addressing-1978',
    question: 'How should we handle memory beyond 64KB?',
    context: 'The 8086 uses 16-bit registers but we need more than 64KB addressable memory.',
    options: [
      {
        id: 'bank-switching',
        description: 'Use bank switching like existing systems',
        visiblePros: ['Proven technology'],
        visibleCons: ['Slow context switches'],
        isHistorical: false,
      },
      {
        id: 'segment-registers',
        description: 'Add segment registers for 20-bit addressing',
        visiblePros: ['Up to 1MB addressable'],
        visibleCons: ['Complex addressing modes'],
        isHistorical: true,
      },
    ],
    historicalChoice: 'segment-registers',
    historicalOutcome: 'Intel chose segment registers.',
    alternateOutcomes: [
      { optionId: 'bank-switching', speculation: 'Would have been simpler but limited.' },
    ],
  };

  const mockMindset: MindsetContext = {
    year: 1978,
    knownTechnology: ['8-bit microprocessors', 'DRAM'],
    unknownTechnology: ['32-bit processors'],
    activeProblems: [{ statement: 'Memory limit', motivation: 'Growing demand', currentApproaches: ['bank switching'] }],
    constraints: [{ type: 'technical', description: '40-pin DIP limit' }],
    impossibilities: ['1GB RAM'],
    historicalPerspective: {
      currentKnowledge: 'You are an Intel engineer in 1978.',
      futureBlind: 'You do not know what comes next.',
    },
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    scene = new DecisionMakerScene();
    // Set up mindset
    MindsetProvider.getInstance().setMindset(mockMindset);
  });

  afterEach(() => {
    scene.destroy();
    container.remove();
    MindsetProvider.getInstance().destroy();
  });

  describe('mount', () => {
    it('should create scene element in container', () => {
      scene.mount(container);
      expect(container.querySelector('.da-decision-maker-scene')).not.toBeNull();
    });

    it('should have region role for accessibility', () => {
      scene.mount(container);
      const element = container.querySelector('.da-decision-maker-scene');
      expect(element?.getAttribute('role')).toBe('region');
    });

    it('should have aria-label for accessibility', () => {
      scene.mount(container);
      const element = container.querySelector('.da-decision-maker-scene');
      expect(element?.getAttribute('aria-label')).toBe('Historical Decision');
    });
  });

  describe('setDecision', () => {
    it('should render HistoricalDecisionCard when decision is set', () => {
      scene.mount(container);
      scene.setDecision(mockDecision);
      expect(container.querySelector('.da-decision-card')).not.toBeNull();
    });

    it('should render era context from MindsetProvider', () => {
      scene.mount(container);
      scene.setDecision(mockDecision);
      const yearEl = container.querySelector('.da-decision-maker-year');
      expect(yearEl?.textContent).toBe('1978');
    });

    it('should render historical perspective text', () => {
      scene.mount(container);
      scene.setDecision(mockDecision);
      const perspectiveEl = container.querySelector('.da-decision-maker-perspective');
      expect(perspectiveEl?.textContent).toBe('You are an Intel engineer in 1978.');
    });

    it('should render decision question through the card', () => {
      scene.mount(container);
      scene.setDecision(mockDecision);
      const question = container.querySelector('.da-decision-question');
      expect(question?.textContent).toContain('How should we handle memory beyond 64KB?');
    });

    it('should render decision options', () => {
      scene.mount(container);
      scene.setDecision(mockDecision);
      const options = container.querySelectorAll('.da-decision-option');
      expect(options.length).toBe(2);
    });

    it('should not render era context when no mindset is set', () => {
      MindsetProvider.getInstance().destroy();
      scene.mount(container);
      scene.setDecision(mockDecision);
      const yearEl = container.querySelector('.da-decision-maker-year');
      expect(yearEl).toBeNull();
    });
  });

  describe('getDecisionCard', () => {
    it('should return null before mount', () => {
      expect(scene.getDecisionCard()).toBeNull();
    });

    it('should return the card after setting decision', () => {
      scene.mount(container);
      scene.setDecision(mockDecision);
      expect(scene.getDecisionCard()).not.toBeNull();
    });
  });

  describe('build transition', () => {
    it('should not show build CTA before reveal', () => {
      scene.mount(container);
      scene.setDecision(mockDecision);
      expect(container.querySelector('.da-decision-maker-build-cta')).toBeNull();
    });

    it('should show build CTA after decision is revealed', () => {
      scene.mount(container);
      scene.setDecision(mockDecision);

      // Simulate choice + reveal
      const optionEl = container.querySelector('[data-option-id="segment-registers"]') as HTMLElement;
      optionEl.click();
      const revealBtn = container.querySelector('.da-decision-reveal-btn') as HTMLElement;
      revealBtn.click();

      expect(container.querySelector('.da-decision-maker-build-cta')).not.toBeNull();
    });

    it('should show "Now build your solution" text after reveal', () => {
      scene.mount(container);
      scene.setDecision(mockDecision);

      const optionEl = container.querySelector('[data-option-id="bank-switching"]') as HTMLElement;
      optionEl.click();
      const revealBtn = container.querySelector('.da-decision-reveal-btn') as HTMLElement;
      revealBtn.click();

      const ctaText = container.querySelector('.da-decision-maker-build-text');
      expect(ctaText?.textContent).toBe('Now build your solution');
    });

    it('should show "Enter Builder Mode" button after reveal', () => {
      scene.mount(container);
      scene.setDecision(mockDecision);

      const optionEl = container.querySelector('[data-option-id="segment-registers"]') as HTMLElement;
      optionEl.click();
      const revealBtn = container.querySelector('.da-decision-reveal-btn') as HTMLElement;
      revealBtn.click();

      const buildBtn = container.querySelector('.da-decision-maker-build-btn');
      expect(buildBtn?.textContent).toBe('Enter Builder Mode');
    });

    it('should fire onBuildTransition callback when build button is clicked', () => {
      const callback = vi.fn();
      scene.mount(container);
      scene.setDecision(mockDecision);
      scene.onBuildTransition(callback);

      // Choose and reveal
      const optionEl = container.querySelector('[data-option-id="segment-registers"]') as HTMLElement;
      optionEl.click();
      const revealBtn = container.querySelector('.da-decision-reveal-btn') as HTMLElement;
      revealBtn.click();

      // Click build button
      const buildBtn = container.querySelector('.da-decision-maker-build-btn') as HTMLElement;
      buildBtn.click();

      expect(callback).toHaveBeenCalledWith('memory-addressing-1978', 'segment-registers');
    });

    it('should pass correct optionId when non-historical choice is made', () => {
      const callback = vi.fn();
      scene.mount(container);
      scene.setDecision(mockDecision);
      scene.onBuildTransition(callback);

      const optionEl = container.querySelector('[data-option-id="bank-switching"]') as HTMLElement;
      optionEl.click();
      const revealBtn = container.querySelector('.da-decision-reveal-btn') as HTMLElement;
      revealBtn.click();

      const buildBtn = container.querySelector('.da-decision-maker-build-btn') as HTMLElement;
      buildBtn.click();

      expect(callback).toHaveBeenCalledWith('memory-addressing-1978', 'bank-switching');
    });

    it('should not show duplicate CTA on repeated reveal events', () => {
      scene.mount(container);
      scene.setDecision(mockDecision);

      const optionEl = container.querySelector('[data-option-id="segment-registers"]') as HTMLElement;
      optionEl.click();
      const revealBtn = container.querySelector('.da-decision-reveal-btn') as HTMLElement;
      revealBtn.click();

      // Manually dispatch a second reveal event
      const sceneEl = container.querySelector('.da-decision-maker-scene')!;
      sceneEl.dispatchEvent(new CustomEvent('mindset-decision-revealed', { bubbles: true, detail: {} }));

      const ctas = container.querySelectorAll('.da-decision-maker-build-cta');
      expect(ctas.length).toBe(1);
    });
  });

  describe('destroy', () => {
    it('should remove element from DOM', () => {
      scene.mount(container);
      scene.setDecision(mockDecision);
      scene.destroy();
      expect(container.querySelector('.da-decision-maker-scene')).toBeNull();
    });

    it('should clean up decision card', () => {
      scene.mount(container);
      scene.setDecision(mockDecision);
      scene.destroy();
      expect(container.querySelector('.da-decision-card')).toBeNull();
    });

    it('should return null from getDecisionCard after destroy', () => {
      scene.mount(container);
      scene.setDecision(mockDecision);
      scene.destroy();
      expect(scene.getDecisionCard()).toBeNull();
    });

    it('should handle destroy before mount gracefully', () => {
      expect(() => scene.destroy()).not.toThrow();
    });

    it('should handle destroy without decision gracefully', () => {
      scene.mount(container);
      expect(() => scene.destroy()).not.toThrow();
    });
  });
});
