// src/story/DecisionMakerScene.test.ts
// Tests for DecisionMakerScene component
// Story 10.22: Decision-Maker + Builder Mode
// Story 26.16: Brave Alternatives — What If Someone Dared?

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DecisionMakerScene } from './DecisionMakerScene';
import { MindsetProvider } from './MindsetProvider';
import type { HistoricalDecision, MindsetContext, BraveAlternative } from './types';

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

  describe('Story 26.16: Brave Alternatives', () => {
    const mockBraveAlternative: BraveAlternative = {
      braveAction: 'Use a flat 32-bit address space from the start',
      safeChoice: 'Add segment registers for backward-compatible 20-bit addressing',
      constraintType: 'economics',
      whySafe: 'Backward compatibility with existing 8-bit software was critical for market adoption.',
      whatIfNarrative: 'If Intel had gone with flat 32-bit addressing in 1978, programmers would never have dealt with segment:offset headaches.',
      insight: 'The constraint was economics, not physics — a clean design would have worked but risked the installed base.',
      reflectionPrompt: 'When is backward compatibility worth the technical debt?',
    };

    const mockDecisionWithBrave: HistoricalDecision = {
      ...mockDecision,
      braveAlternative: mockBraveAlternative,
    };

    /** Helper: mount, set decision, choose option, click reveal */
    function revealDecision(dec: HistoricalDecision): void {
      scene.mount(container);
      scene.setDecision(dec);
      const optionEl = container.querySelector('[data-option-id="segment-registers"]') as HTMLElement;
      optionEl.click();
      const revealBtn = container.querySelector('.da-decision-reveal-btn') as HTMLElement;
      revealBtn.click();
    }

    it('should render brave alternative panel after reveal', () => {
      revealDecision(mockDecisionWithBrave);
      expect(container.querySelector('.da-brave-alternative')).not.toBeNull();
    });

    it('should have note role and aria-labelledby pointing to header', () => {
      revealDecision(mockDecisionWithBrave);
      const panel = container.querySelector('.da-brave-alternative');
      expect(panel?.getAttribute('role')).toBe('note');
      const headerId = panel?.getAttribute('aria-labelledby');
      expect(headerId).toBeTruthy();
      const header = container.querySelector(`#${headerId}`);
      expect(header?.textContent).toBe('What if someone had been brave?');
    });

    it('should render header as h4 with correct text', () => {
      revealDecision(mockDecisionWithBrave);
      const header = container.querySelector('.da-brave-alternative__header');
      expect(header?.tagName).toBe('H4');
      expect(header?.textContent).toBe('What if someone had been brave?');
    });

    it('should render brave path card', () => {
      revealDecision(mockDecisionWithBrave);
      const braveCard = container.querySelector('.da-brave-alternative__card--brave');
      expect(braveCard).not.toBeNull();
      const label = braveCard?.querySelector('.da-brave-alternative__card-label');
      expect(label?.textContent).toBe('The Brave Path');
      const text = braveCard?.querySelector('.da-brave-alternative__card-text');
      expect(text?.textContent).toBe(mockBraveAlternative.braveAction);
    });

    it('should render safe choice card', () => {
      revealDecision(mockDecisionWithBrave);
      const safeCard = container.querySelector('.da-brave-alternative__card--safe');
      expect(safeCard).not.toBeNull();
      const label = safeCard?.querySelector('.da-brave-alternative__card-label');
      expect(label?.textContent).toBe('The Safe Choice');
      const text = safeCard?.querySelector('.da-brave-alternative__card-text');
      expect(text?.textContent).toBe(mockBraveAlternative.safeChoice);
    });

    it('should render constraint badge with correct type', () => {
      revealDecision(mockDecisionWithBrave);
      const badge = container.querySelector('.da-brave-alternative__constraint');
      expect(badge).not.toBeNull();
      expect(badge?.classList.contains('da-brave-alternative__constraint--economics')).toBe(true);
      expect(badge?.textContent).toBe('Held back by: Economics');
    });

    it('should render constraint badge for each constraint type', () => {
      const constraintLabels: Record<string, string> = {
        fear: 'Held back by: Fear',
        economics: 'Held back by: Economics',
        politics: 'Held back by: Politics',
        physics: 'Constrained by: Physics',
        knowledge: 'Constrained by: Knowledge',
      };

      for (const [type, expectedLabel] of Object.entries(constraintLabels)) {
        // Use local scene/container to avoid mutating shared fixtures
        const localContainer = document.createElement('div');
        document.body.appendChild(localContainer);
        const localScene = new DecisionMakerScene();
        MindsetProvider.getInstance().setMindset(mockMindset);

        const dec: HistoricalDecision = {
          ...mockDecision,
          braveAlternative: {
            ...mockBraveAlternative,
            constraintType: type as BraveAlternative['constraintType'],
          },
        };

        localScene.mount(localContainer);
        localScene.setDecision(dec);
        const optionEl = localContainer.querySelector('[data-option-id="segment-registers"]') as HTMLElement;
        optionEl.click();
        const revealBtn = localContainer.querySelector('.da-decision-reveal-btn') as HTMLElement;
        revealBtn.click();

        const badge = localContainer.querySelector('.da-brave-alternative__constraint');
        expect(badge?.textContent).toBe(expectedLabel);
        expect(badge?.classList.contains(`da-brave-alternative__constraint--${type}`)).toBe(true);

        localScene.destroy();
        localContainer.remove();
      }
    });

    it('should render why-safe explanation', () => {
      revealDecision(mockDecisionWithBrave);
      const whySafe = container.querySelector('.da-brave-alternative__why-safe');
      expect(whySafe?.textContent).toBe(mockBraveAlternative.whySafe);
    });

    it('should render what-if narrative', () => {
      revealDecision(mockDecisionWithBrave);
      const whatIfLabel = container.querySelector('.da-brave-alternative__what-if-label');
      expect(whatIfLabel?.textContent).toBe('If someone had dared\u2026');
      const whatIfText = container.querySelector('.da-brave-alternative__what-if-text');
      expect(whatIfText?.textContent).toBe(mockBraveAlternative.whatIfNarrative);
    });

    it('should render key insight', () => {
      revealDecision(mockDecisionWithBrave);
      const insight = container.querySelector('.da-brave-alternative__insight');
      expect(insight?.textContent).toBe(mockBraveAlternative.insight);
    });

    it('should render reflection prompt', () => {
      revealDecision(mockDecisionWithBrave);
      const reflection = container.querySelector('.da-brave-alternative__reflection');
      expect(reflection?.textContent).toBe(mockBraveAlternative.reflectionPrompt);
    });

    it('should NOT render brave alternative panel when braveAlternative is absent', () => {
      revealDecision(mockDecision); // mockDecision has no braveAlternative
      expect(container.querySelector('.da-brave-alternative')).toBeNull();
    });

    it('should render brave alternative below the build CTA', () => {
      revealDecision(mockDecisionWithBrave);
      const sceneEl = container.querySelector('.da-decision-maker-scene')!;
      const children = Array.from(sceneEl.children);
      const ctaIndex = children.findIndex(el => el.classList.contains('da-decision-maker-build-cta'));
      const braveIndex = children.findIndex(el => el.classList.contains('da-brave-alternative'));
      expect(ctaIndex).toBeGreaterThan(-1);
      expect(braveIndex).toBeGreaterThan(ctaIndex);
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
