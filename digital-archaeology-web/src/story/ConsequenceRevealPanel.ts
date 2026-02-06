// src/story/ConsequenceRevealPanel.ts
// Post-builder reflection panel showing decision consequences
// Story 10.22: Decision-Maker + Builder Mode

import type { HistoricalDecision } from './types';

/**
 * ConsequenceRevealPanel displays after a builder challenge completes.
 * Shows the user's decision vs. history's decision, what they built,
 * and alternate timeline speculation.
 */
export class ConsequenceRevealPanel {
  private container: HTMLElement | null = null;
  private element: HTMLElement | null = null;
  private decision: HistoricalDecision | null = null;
  private chosenOptionId: string | null = null;
  private continueCallback: (() => void) | null = null;

  // Bound handler for cleanup
  private boundHandleContinue: (e: Event) => void;

  constructor() {
    this.boundHandleContinue = this.handleContinue.bind(this);
  }

  /**
   * Mount the component to a container.
   */
  mount(container: HTMLElement): void {
    this.container = container;
    this.element = document.createElement('div');
    this.element.className = 'da-consequence-reveal';
    this.element.setAttribute('role', 'dialog');
    this.element.setAttribute('aria-label', 'Decision Consequences');
    this.container.appendChild(this.element);
    this.render();
  }

  /**
   * Set the decision and the user's chosen option.
   */
  setDecisionResult(decision: HistoricalDecision, chosenOptionId: string): void {
    this.decision = decision;
    this.chosenOptionId = chosenOptionId;
    this.render();
  }

  /**
   * Register callback for continue button.
   */
  onContinue(callback: () => void): void {
    this.continueCallback = callback;
  }

  /**
   * Check if the user chose the historical path.
   */
  choseHistorical(): boolean {
    if (!this.decision || !this.chosenOptionId) return false;
    const chosen = this.decision.options.find((o) => o.id === this.chosenOptionId);
    return chosen?.isHistorical === true;
  }

  /**
   * Render the panel content.
   */
  private render(): void {
    if (!this.element) return;

    // Remove old continue button listener
    const oldBtn = this.element.querySelector('.da-consequence-continue-btn');
    if (oldBtn) {
      oldBtn.removeEventListener('click', this.boundHandleContinue);
    }

    while (this.element.firstChild) {
      this.element.removeChild(this.element.firstChild);
    }

    if (!this.decision || !this.chosenOptionId) return;

    const isHistorical = this.choseHistorical();
    const chosenOption = this.decision.options.find((o) => o.id === this.chosenOptionId);
    const historicalOption = this.decision.options.find((o) => o.isHistorical);

    // Title
    const titleEl = document.createElement('h3');
    titleEl.className = 'da-consequence-title';
    if (isHistorical) {
      titleEl.textContent = `You made the same choice as history!`;
    } else {
      titleEl.textContent = 'You took a different path from history.';
    }
    this.element.appendChild(titleEl);

    // Comparison section
    const comparison = document.createElement('div');
    comparison.className = 'da-consequence-comparison';

    // User's choice
    const userSection = document.createElement('div');
    userSection.className = 'da-consequence-user-choice';
    const userLabel = document.createElement('h4');
    userLabel.className = 'da-consequence-label';
    userLabel.textContent = 'Your Choice:';
    const userDesc = document.createElement('p');
    userDesc.className = 'da-consequence-user-description';
    userDesc.textContent = chosenOption?.description ?? '';
    userSection.appendChild(userLabel);
    userSection.appendChild(userDesc);
    comparison.appendChild(userSection);

    // History's choice (only show if different)
    if (!isHistorical && historicalOption) {
      const historySection = document.createElement('div');
      historySection.className = 'da-consequence-history-choice';
      const histLabel = document.createElement('h4');
      histLabel.className = 'da-consequence-label';
      histLabel.textContent = "History's Choice:";
      const histDesc = document.createElement('p');
      histDesc.className = 'da-consequence-history-description';
      histDesc.textContent = historicalOption.description;
      historySection.appendChild(histLabel);
      historySection.appendChild(histDesc);
      comparison.appendChild(historySection);
    }

    this.element.appendChild(comparison);

    // Historical outcome
    const outcomeEl = document.createElement('div');
    outcomeEl.className = 'da-consequence-outcome';
    const outcomeLabel = document.createElement('h4');
    outcomeLabel.className = 'da-consequence-label';
    outcomeLabel.textContent = 'What happened:';
    const outcomeText = document.createElement('p');
    outcomeText.className = 'da-consequence-outcome-text';
    outcomeText.textContent = this.decision.historicalOutcome;
    outcomeEl.appendChild(outcomeLabel);
    outcomeEl.appendChild(outcomeText);
    this.element.appendChild(outcomeEl);

    // Alternate timeline (only if user chose differently)
    if (!isHistorical) {
      const alternate = this.decision.alternateOutcomes.find((ao) => ao.optionId === this.chosenOptionId);
      if (alternate) {
        const altEl = document.createElement('div');
        altEl.className = 'da-consequence-alternate';
        const altLabel = document.createElement('h4');
        altLabel.className = 'da-consequence-label';
        altLabel.textContent = 'If history had chosen your path:';
        const altText = document.createElement('p');
        altText.className = 'da-consequence-alternate-text';
        altText.textContent = alternate.speculation;
        altEl.appendChild(altLabel);
        altEl.appendChild(altText);
        this.element.appendChild(altEl);
      }
    }

    // Continue button
    const continueBtn = document.createElement('button');
    continueBtn.className = 'da-consequence-continue-btn';
    continueBtn.type = 'button';
    continueBtn.textContent = 'Continue Journey';
    continueBtn.addEventListener('click', this.boundHandleContinue);
    this.element.appendChild(continueBtn);
  }

  /**
   * Handle continue button click.
   */
  private handleContinue(_e: Event): void {
    // Dispatch cycle-complete event
    if (this.element && this.decision && this.chosenOptionId) {
      const event = new CustomEvent('decision-cycle-complete', {
        bubbles: true,
        detail: {
          decisionId: this.decision.id,
          chosenOptionId: this.chosenOptionId,
          builtSolution: true,
        },
      });
      this.element.dispatchEvent(event);
    }

    if (this.continueCallback) {
      this.continueCallback();
    }
  }

  /**
   * Clean up the component.
   */
  destroy(): void {
    if (this.element) {
      const continueBtn = this.element.querySelector('.da-consequence-continue-btn');
      if (continueBtn) {
        continueBtn.removeEventListener('click', this.boundHandleContinue);
      }
      this.element.remove();
      this.element = null;
    }
    this.container = null;
    this.decision = null;
    this.chosenOptionId = null;
    this.continueCallback = null;
  }
}
