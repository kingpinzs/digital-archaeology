// src/story/HistoricalDecisionCard.test.ts
// Tests for HistoricalDecisionCard component
// Story 10.21: Historical Mindset Time-Travel

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HistoricalDecisionCard } from './HistoricalDecisionCard';
import type { HistoricalDecision } from './types';

describe('HistoricalDecisionCard', () => {
  let card: HistoricalDecisionCard;
  let container: HTMLElement;

  const mockDecision: HistoricalDecision = {
    id: 'memory-addressing-1978',
    question: 'How should we handle memory beyond 64KB?',
    context: 'The 8086 uses 16-bit registers but we need more than 64KB addressable memory.',
    options: [
      {
        id: 'bank-switching',
        description: 'Use bank switching like existing systems',
        visiblePros: ['Proven technology', 'Simple to implement'],
        visibleCons: ['Slow context switches', 'Complex programming model'],
        isHistorical: false,
      },
      {
        id: 'segment-registers',
        description: 'Add segment registers for 20-bit addressing',
        visiblePros: ['Up to 1MB addressable', 'Backward compatible with 8080 code'],
        visibleCons: ['Complex addressing modes', 'Segment boundaries'],
        isHistorical: true,
      },
      {
        id: 'full-32bit',
        description: 'Design a full 32-bit processor',
        visiblePros: ['Clean architecture', 'Plenty of address space'],
        visibleCons: ['Requires new toolchain', 'Higher transistor count'],
        isHistorical: false,
      },
    ],
    historicalChoice: 'segment-registers',
    historicalOutcome:
      'Intel chose segment registers. The 8086 became the foundation of the PC industry, but segments caused endless programmer frustration for decades.',
    alternateOutcomes: [
      {
        optionId: 'bank-switching',
        speculation:
          'Bank switching would have been simpler but limited. The PC might have evolved differently.',
      },
      {
        optionId: 'full-32bit',
        speculation:
          'A 32-bit CPU in 1978 would have been ahead of its time. Memory was expensive and software was scarce.',
      },
    ],
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    card = new HistoricalDecisionCard();
  });

  afterEach(() => {
    card.destroy();
    container.remove();
  });

  describe('mount', () => {
    it('should create card element in container', () => {
      card.mount(container);
      expect(container.querySelector('.da-decision-card')).not.toBeNull();
    });

    it('should have article role for accessibility', () => {
      card.mount(container);
      const element = container.querySelector('.da-decision-card');
      expect(element?.getAttribute('role')).toBe('article');
    });

    it('should have aria-labelledby for accessibility', () => {
      card.mount(container);
      const element = container.querySelector('.da-decision-card');
      expect(element?.getAttribute('aria-labelledby')).toBe('decision-question');
    });
  });

  describe('setDecision', () => {
    beforeEach(() => {
      card.mount(container);
    });

    it('should display the decision question', () => {
      card.setDecision(mockDecision);
      const question = container.querySelector('.da-decision-question');
      expect(question?.textContent?.trim()).toBe('How should we handle memory beyond 64KB?');
    });

    it('should display the decision context', () => {
      card.setDecision(mockDecision);
      const context = container.querySelector('.da-decision-context');
      expect(context?.textContent).toContain('8086 uses 16-bit registers');
    });

    it('should display all options', () => {
      card.setDecision(mockDecision);
      const options = container.querySelectorAll('.da-decision-option');
      expect(options.length).toBe(3);
    });

    it('should display option descriptions', () => {
      card.setDecision(mockDecision);
      const descriptions = container.querySelectorAll('.da-decision-option-description');
      expect(descriptions[0]?.textContent).toContain('bank switching');
      expect(descriptions[1]?.textContent).toContain('segment registers');
      expect(descriptions[2]?.textContent).toContain('32-bit processor');
    });

    it('should display pros and cons', () => {
      card.setDecision(mockDecision);
      const pros = container.querySelectorAll('.da-decision-pros');
      const cons = container.querySelectorAll('.da-decision-cons');
      expect(pros.length).toBe(3);
      expect(cons.length).toBe(3);
    });

    it('should show prompt before selection', () => {
      card.setDecision(mockDecision);
      const prompt = container.querySelector('.da-decision-prompt');
      expect(prompt?.textContent).toContain('Make your choice');
    });

    it('should reset state when setting new decision', () => {
      card.setDecision(mockDecision);
      const option = container.querySelector('[data-option-id="bank-switching"]') as HTMLElement;
      option?.click();
      expect(card.hasChosen()).toBe(true);

      card.setDecision({ ...mockDecision, id: 'new-decision' });
      expect(card.hasChosen()).toBe(false);
      expect(card.isRevealed()).toBe(false);
    });
  });

  describe('option selection', () => {
    beforeEach(() => {
      card.mount(container);
      card.setDecision(mockDecision);
    });

    it('should select option on click', () => {
      const option = container.querySelector('[data-option-id="segment-registers"]') as HTMLElement;
      option?.click();
      expect(card.getSelectedOption()).toBe('segment-registers');
    });

    it('should mark selected option visually', () => {
      const option = container.querySelector('[data-option-id="segment-registers"]') as HTMLElement;
      option?.click();

      const selected = container.querySelector('.da-decision-option--selected');
      expect(selected?.getAttribute('data-option-id')).toBe('segment-registers');
    });

    it('should show reveal button after selection', () => {
      const option = container.querySelector('[data-option-id="bank-switching"]') as HTMLElement;
      option?.click();

      const revealBtn = container.querySelector('.da-decision-reveal-btn');
      expect(revealBtn).not.toBeNull();
    });

    it('should call onChoice callback when option selected', () => {
      const callback = vi.fn();
      card.onChoice(callback);

      const option = container.querySelector('[data-option-id="full-32bit"]') as HTMLElement;
      option?.click();

      expect(callback).toHaveBeenCalledWith('full-32bit');
    });

    it('should dispatch mindset-decision-choice-made event', () => {
      const handler = vi.fn();
      container.addEventListener('mindset-decision-choice-made', handler);

      const option = container.querySelector('[data-option-id="segment-registers"]') as HTMLElement;
      option?.click();

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].detail).toEqual({
        decisionId: 'memory-addressing-1978',
        optionId: 'segment-registers',
      });

      container.removeEventListener('mindset-decision-choice-made', handler);
    });

    it('should allow changing selection before reveal', () => {
      const option1 = container.querySelector('[data-option-id="bank-switching"]') as HTMLElement;
      option1?.click();
      expect(card.getSelectedOption()).toBe('bank-switching');

      const option2 = container.querySelector('[data-option-id="full-32bit"]') as HTMLElement;
      option2?.click();
      expect(card.getSelectedOption()).toBe('full-32bit');
    });
  });

  describe('reveal', () => {
    beforeEach(() => {
      card.mount(container);
      card.setDecision(mockDecision);
    });

    it('should reveal historical outcome when button clicked', () => {
      const option = container.querySelector('[data-option-id="segment-registers"]') as HTMLElement;
      option?.click();

      const revealBtn = container.querySelector('.da-decision-reveal-btn') as HTMLElement;
      revealBtn?.click();

      expect(card.isRevealed()).toBe(true);
      const reveal = container.querySelector('.da-decision-reveal');
      expect(reveal).not.toBeNull();
    });

    it('should show correct message when user chose historical option', () => {
      const option = container.querySelector('[data-option-id="segment-registers"]') as HTMLElement;
      option?.click();

      const revealBtn = container.querySelector('.da-decision-reveal-btn') as HTMLElement;
      revealBtn?.click();

      const title = container.querySelector('.da-decision-reveal-title');
      expect(title?.textContent).toContain('You chose what history chose');
    });

    it('should show alternate path message when user chose differently', () => {
      const option = container.querySelector('[data-option-id="full-32bit"]') as HTMLElement;
      option?.click();

      const revealBtn = container.querySelector('.da-decision-reveal-btn') as HTMLElement;
      revealBtn?.click();

      const title = container.querySelector('.da-decision-reveal-title');
      expect(title?.textContent).toContain('History took a different path');
    });

    it('should display historical outcome text', () => {
      const option = container.querySelector('[data-option-id="segment-registers"]') as HTMLElement;
      option?.click();

      const revealBtn = container.querySelector('.da-decision-reveal-btn') as HTMLElement;
      revealBtn?.click();

      const outcome = container.querySelector('.da-decision-historical-outcome');
      expect(outcome?.textContent).toContain('Intel chose segment registers');
    });

    it('should display alternate speculation when user chose differently', () => {
      const option = container.querySelector('[data-option-id="bank-switching"]') as HTMLElement;
      option?.click();

      const revealBtn = container.querySelector('.da-decision-reveal-btn') as HTMLElement;
      revealBtn?.click();

      const alternate = container.querySelector('.da-decision-alternate-outcome');
      expect(alternate?.textContent).toContain('simpler but limited');
    });

    it('should mark historical option with badge', () => {
      const option = container.querySelector('[data-option-id="segment-registers"]') as HTMLElement;
      option?.click();

      const revealBtn = container.querySelector('.da-decision-reveal-btn') as HTMLElement;
      revealBtn?.click();

      const badge = container.querySelector('.da-decision-historical-badge');
      expect(badge).not.toBeNull();
      expect(badge?.textContent).toContain('HISTORICAL CHOICE');
    });

    it('should dispatch mindset-decision-revealed event', () => {
      const handler = vi.fn();
      container.addEventListener('mindset-decision-revealed', handler);

      const option = container.querySelector('[data-option-id="segment-registers"]') as HTMLElement;
      option?.click();

      const revealBtn = container.querySelector('.da-decision-reveal-btn') as HTMLElement;
      revealBtn?.click();

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].detail).toEqual({
        decisionId: 'memory-addressing-1978',
        selectedOptionId: 'segment-registers',
        wasHistorical: true,
      });

      container.removeEventListener('mindset-decision-revealed', handler);
    });

    it('should prevent selection changes after reveal', () => {
      const option1 = container.querySelector('[data-option-id="segment-registers"]') as HTMLElement;
      option1?.click();

      const revealBtn = container.querySelector('.da-decision-reveal-btn') as HTMLElement;
      revealBtn?.click();

      // Try to click a different option
      const option2 = container.querySelector('[data-option-id="bank-switching"]') as HTMLElement;
      option2?.click();

      expect(card.getSelectedOption()).toBe('segment-registers');
    });
  });

  describe('XSS prevention', () => {
    beforeEach(() => {
      card.mount(container);
    });

    it('should escape HTML in question', () => {
      card.setDecision({
        ...mockDecision,
        question: '<script>alert("xss")</script>',
      });
      expect(container.innerHTML).not.toContain('<script>');
      expect(container.innerHTML).toContain('&lt;script&gt;');
    });

    it('should escape HTML in context', () => {
      card.setDecision({
        ...mockDecision,
        context: '<img src="x" onerror="alert(1)">',
      });
      expect(container.innerHTML).toContain('&lt;img');
      expect(container.innerHTML).not.toContain('<img ');
    });

    it('should escape HTML in option descriptions', () => {
      card.setDecision({
        ...mockDecision,
        options: [
          {
            ...mockDecision.options[0],
            description: '<div onclick="evil()">click me</div>',
          },
        ],
      });
      expect(container.innerHTML).toContain('&lt;div');
      expect(container.innerHTML).not.toContain('<div onclick');
    });

    it('should escape HTML in pros and cons', () => {
      card.setDecision({
        ...mockDecision,
        options: [
          {
            ...mockDecision.options[0],
            visiblePros: ['<b>bold</b>'],
            visibleCons: ['<i>italic</i>'],
          },
        ],
      });
      expect(container.innerHTML).toContain('&lt;b&gt;');
      expect(container.innerHTML).toContain('&lt;i&gt;');
    });

    it('should escape HTML in historical outcome', () => {
      card.setDecision({
        ...mockDecision,
        historicalOutcome: '<script>steal(document.cookie)</script>',
      });
      const option = container.querySelector('[data-option-id="segment-registers"]') as HTMLElement;
      option?.click();

      const revealBtn = container.querySelector('.da-decision-reveal-btn') as HTMLElement;
      revealBtn?.click();

      expect(container.innerHTML).not.toContain('<script>');
    });
  });

  describe('state methods', () => {
    beforeEach(() => {
      card.mount(container);
      card.setDecision(mockDecision);
    });

    it('should report hasChosen correctly', () => {
      expect(card.hasChosen()).toBe(false);

      const option = container.querySelector('[data-option-id="bank-switching"]') as HTMLElement;
      option?.click();

      expect(card.hasChosen()).toBe(true);
    });

    it('should report isRevealed correctly', () => {
      expect(card.isRevealed()).toBe(false);

      const option = container.querySelector('[data-option-id="bank-switching"]') as HTMLElement;
      option?.click();

      expect(card.isRevealed()).toBe(false);

      const revealBtn = container.querySelector('.da-decision-reveal-btn') as HTMLElement;
      revealBtn?.click();

      expect(card.isRevealed()).toBe(true);
    });

    it('should return current decision via getDecision', () => {
      expect(card.getDecision()).toEqual(mockDecision);
    });

    it('should return null decision after destroy', () => {
      card.destroy();
      expect(card.getDecision()).toBeNull();
    });
  });

  describe('destroy', () => {
    it('should remove element from DOM', () => {
      card.mount(container);
      card.setDecision(mockDecision);
      expect(container.querySelector('.da-decision-card')).not.toBeNull();

      card.destroy();

      expect(container.querySelector('.da-decision-card')).toBeNull();
    });

    it('should clear state', () => {
      card.mount(container);
      card.setDecision(mockDecision);

      const option = container.querySelector('[data-option-id="bank-switching"]') as HTMLElement;
      option?.click();

      card.destroy();

      expect(card.getDecision()).toBeNull();
      expect(card.hasChosen()).toBe(false);
      expect(card.isRevealed()).toBe(false);
    });
  });
});
