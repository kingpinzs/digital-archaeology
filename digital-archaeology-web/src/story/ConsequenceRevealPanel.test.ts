// src/story/ConsequenceRevealPanel.test.ts
// Tests for ConsequenceRevealPanel component
// Story 10.22: Decision-Maker + Builder Mode

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConsequenceRevealPanel } from './ConsequenceRevealPanel';
import type { HistoricalDecision } from './types';

describe('ConsequenceRevealPanel', () => {
  let panel: ConsequenceRevealPanel;
  let container: HTMLElement;

  const mockDecision: HistoricalDecision = {
    id: 'memory-addressing-1978',
    question: 'How should we handle memory beyond 64KB?',
    context: 'The 8086 uses 16-bit registers.',
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
    historicalOutcome: 'Intel chose segment registers. It became the foundation of the PC industry.',
    alternateOutcomes: [
      { optionId: 'bank-switching', speculation: 'Bank switching would have been simpler but limited.' },
    ],
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    panel = new ConsequenceRevealPanel();
  });

  afterEach(() => {
    panel.destroy();
    container.remove();
  });

  describe('mount', () => {
    it('should create panel element in container', () => {
      panel.mount(container);
      expect(container.querySelector('.da-consequence-reveal')).not.toBeNull();
    });

    it('should have dialog role', () => {
      panel.mount(container);
      const el = container.querySelector('.da-consequence-reveal');
      expect(el?.getAttribute('role')).toBe('dialog');
    });

    it('should have aria-label', () => {
      panel.mount(container);
      const el = container.querySelector('.da-consequence-reveal');
      expect(el?.getAttribute('aria-label')).toBe('Decision Consequences');
    });
  });

  describe('same-as-history case', () => {
    beforeEach(() => {
      panel.mount(container);
      panel.setDecisionResult(mockDecision, 'segment-registers');
    });

    it('should show "same choice as history" title', () => {
      const title = container.querySelector('.da-consequence-title');
      expect(title?.textContent).toContain('same choice as history');
    });

    it('should show user choice description', () => {
      const userDesc = container.querySelector('.da-consequence-user-description');
      expect(userDesc?.textContent).toBe('Add segment registers for 20-bit addressing');
    });

    it('should NOT show history choice section (they match)', () => {
      const historyChoice = container.querySelector('.da-consequence-history-choice');
      expect(historyChoice).toBeNull();
    });

    it('should show historical outcome', () => {
      const outcome = container.querySelector('.da-consequence-outcome-text');
      expect(outcome?.textContent).toContain('Intel chose segment registers');
    });

    it('should NOT show alternate timeline', () => {
      const alternate = container.querySelector('.da-consequence-alternate');
      expect(alternate).toBeNull();
    });

    it('should return true from choseHistorical()', () => {
      expect(panel.choseHistorical()).toBe(true);
    });
  });

  describe('different-from-history case', () => {
    beforeEach(() => {
      panel.mount(container);
      panel.setDecisionResult(mockDecision, 'bank-switching');
    });

    it('should show "different path" title', () => {
      const title = container.querySelector('.da-consequence-title');
      expect(title?.textContent).toContain('different path');
    });

    it('should show user choice description', () => {
      const userDesc = container.querySelector('.da-consequence-user-description');
      expect(userDesc?.textContent).toBe('Use bank switching like existing systems');
    });

    it('should show history choice section', () => {
      const historyChoice = container.querySelector('.da-consequence-history-choice');
      expect(historyChoice).not.toBeNull();
    });

    it('should show history choice description', () => {
      const histDesc = container.querySelector('.da-consequence-history-description');
      expect(histDesc?.textContent).toBe('Add segment registers for 20-bit addressing');
    });

    it('should show alternate timeline speculation', () => {
      const altText = container.querySelector('.da-consequence-alternate-text');
      expect(altText?.textContent).toBe('Bank switching would have been simpler but limited.');
    });

    it('should return false from choseHistorical()', () => {
      expect(panel.choseHistorical()).toBe(false);
    });
  });

  describe('continue button', () => {
    it('should render continue button', () => {
      panel.mount(container);
      panel.setDecisionResult(mockDecision, 'segment-registers');
      const btn = container.querySelector('.da-consequence-continue-btn');
      expect(btn?.textContent).toBe('Continue Journey');
    });

    it('should fire onContinue callback when clicked', () => {
      const callback = vi.fn();
      panel.mount(container);
      panel.setDecisionResult(mockDecision, 'segment-registers');
      panel.onContinue(callback);
      const btn = container.querySelector('.da-consequence-continue-btn') as HTMLElement;
      btn.click();
      expect(callback).toHaveBeenCalled();
    });

    it('should dispatch decision-cycle-complete event', () => {
      const handler = vi.fn();
      panel.mount(container);
      panel.setDecisionResult(mockDecision, 'bank-switching');
      container.addEventListener('decision-cycle-complete', handler);
      const btn = container.querySelector('.da-consequence-continue-btn') as HTMLElement;
      btn.click();
      expect(handler).toHaveBeenCalled();
      const detail = (handler.mock.calls[0][0] as CustomEvent).detail;
      expect(detail.decisionId).toBe('memory-addressing-1978');
      expect(detail.chosenOptionId).toBe('bank-switching');
      expect(detail.builtSolution).toBe(true);
      container.removeEventListener('decision-cycle-complete', handler);
    });
  });

  describe('destroy', () => {
    it('should remove element from DOM', () => {
      panel.mount(container);
      panel.setDecisionResult(mockDecision, 'segment-registers');
      panel.destroy();
      expect(container.querySelector('.da-consequence-reveal')).toBeNull();
    });

    it('should handle destroy before mount', () => {
      expect(() => panel.destroy()).not.toThrow();
    });

    it('should handle destroy without decision result', () => {
      panel.mount(container);
      expect(() => panel.destroy()).not.toThrow();
    });

    it('should return false from choseHistorical after destroy', () => {
      panel.mount(container);
      panel.setDecisionResult(mockDecision, 'segment-registers');
      panel.destroy();
      expect(panel.choseHistorical()).toBe(false);
    });
  });
});
