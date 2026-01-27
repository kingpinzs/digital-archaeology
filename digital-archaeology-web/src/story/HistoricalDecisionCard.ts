// src/story/HistoricalDecisionCard.ts
// Card component for historical decisions without hindsight
// Story 10.21: Historical Mindset Time-Travel
//
// XSS Protection: This file uses innerHTML ONLY with content that has been
// sanitized through escapeHtml() which uses the browser's built-in
// textContent encoding to convert special characters to HTML entities.
// All dynamic content from decision objects passes through escapeHtml()
// before being inserted into the DOM.

import type { HistoricalDecision, HistoricalOption } from './types';

/**
 * Component that presents historical decisions WITHOUT revealing
 * what history actually chose. Only after the user makes their
 * choice do we reveal the historical outcome.
 */
export class HistoricalDecisionCard {
  private element: HTMLElement | null = null;
  private decision: HistoricalDecision | null = null;
  private selectedOptionId: string | null = null;
  private revealed: boolean = false;
  private onChoiceMade: ((optionId: string) => void) | null = null;

  // Bound event handlers for cleanup
  private boundHandleOptionClick: (e: Event) => void;
  private boundHandleReveal: (e: Event) => void;

  constructor() {
    this.boundHandleOptionClick = this.handleOptionClick.bind(this);
    this.boundHandleReveal = this.handleReveal.bind(this);
  }

  /**
   * Mount the component to the DOM.
   */
  mount(container: HTMLElement): void {
    this.element = document.createElement('div');
    this.element.className = 'da-decision-card';
    this.element.setAttribute('role', 'article');
    this.element.setAttribute('aria-labelledby', 'decision-question');
    container.appendChild(this.element);
    this.render();
  }

  /**
   * Set the decision to display.
   */
  setDecision(decision: HistoricalDecision): void {
    this.decision = decision;
    this.selectedOptionId = null;
    this.revealed = false;
    this.render();
  }

  /**
   * Set the callback for when a choice is made.
   */
  onChoice(callback: (optionId: string) => void): void {
    this.onChoiceMade = callback;
  }

  /**
   * Get the current decision.
   */
  getDecision(): HistoricalDecision | null {
    return this.decision;
  }

  /**
   * Check if a choice has been made.
   */
  hasChosen(): boolean {
    return this.selectedOptionId !== null;
  }

  /**
   * Check if the historical outcome has been revealed.
   */
  isRevealed(): boolean {
    return this.revealed;
  }

  /**
   * Get the selected option ID.
   */
  getSelectedOption(): string | null {
    return this.selectedOptionId;
  }

  /**
   * Render the component.
   * All dynamic content from decision is escaped via escapeHtml().
   */
  private render(): void {
    if (!this.element) return;

    if (!this.decision) {
      this.element.textContent = '';
      return;
    }

    const d = this.decision;

    // Safe: all dynamic content is escaped via escapeHtml()
    this.element.innerHTML = `
      <div class="da-decision-header">
        <h3 class="da-decision-question" id="decision-question">${this.escapeHtml(d.question)}</h3>
        <p class="da-decision-context">${this.escapeHtml(d.context)}</p>
      </div>

      <div class="da-decision-options" role="radiogroup" aria-label="Decision options">
        ${d.options.map((opt) => this.renderOption(opt)).join('')}
      </div>

      ${this.renderRevealSection()}
    `;

    // Attach event listeners
    this.element.querySelectorAll('.da-decision-option').forEach((opt) => {
      opt.addEventListener('click', this.boundHandleOptionClick);
    });

    const revealButton = this.element.querySelector('.da-decision-reveal-btn');
    if (revealButton) {
      revealButton.addEventListener('click', this.boundHandleReveal);
    }
  }

  /**
   * Render a single option. All content escaped.
   */
  private renderOption(option: HistoricalOption): string {
    const isSelected = this.selectedOptionId === option.id;
    const showHistorical = this.revealed && option.isHistorical;

    return `
      <div
        class="da-decision-option ${isSelected ? 'da-decision-option--selected' : ''} ${showHistorical ? 'da-decision-option--historical' : ''}"
        data-option-id="${this.escapeHtml(option.id)}"
        role="radio"
        aria-checked="${isSelected}"
        tabindex="0"
      >
        <div class="da-decision-option-header">
          <span class="da-decision-option-indicator">${isSelected ? '●' : '○'}</span>
          <span class="da-decision-option-description">${this.escapeHtml(option.description)}</span>
          ${showHistorical ? '<span class="da-decision-historical-badge">HISTORICAL CHOICE</span>' : ''}
        </div>

        ${this.renderProsAndCons(option)}
      </div>
    `;
  }

  /**
   * Render pros and cons for an option. All content escaped.
   */
  private renderProsAndCons(option: HistoricalOption): string {
    if (option.visiblePros.length === 0 && option.visibleCons.length === 0) {
      return '';
    }

    return `
      <div class="da-decision-option-details">
        ${
          option.visiblePros.length > 0
            ? `
          <div class="da-decision-pros">
            <span class="da-decision-label">Pros (as seen then):</span>
            <ul>
              ${option.visiblePros.map((pro) => `<li>${this.escapeHtml(pro)}</li>`).join('')}
            </ul>
          </div>
        `
            : ''
        }
        ${
          option.visibleCons.length > 0
            ? `
          <div class="da-decision-cons">
            <span class="da-decision-label">Cons (as seen then):</span>
            <ul>
              ${option.visibleCons.map((con) => `<li>${this.escapeHtml(con)}</li>`).join('')}
            </ul>
          </div>
        `
            : ''
        }
      </div>
    `;
  }

  /**
   * Render the reveal section (shown after choice is made).
   */
  private renderRevealSection(): string {
    if (!this.decision) return '';

    if (!this.selectedOptionId) {
      return `
        <div class="da-decision-footer">
          <p class="da-decision-prompt">Make your choice to see what history decided...</p>
        </div>
      `;
    }

    if (!this.revealed) {
      return `
        <div class="da-decision-footer">
          <button class="da-decision-reveal-btn" type="button">
            Reveal What History Chose
          </button>
        </div>
      `;
    }

    // Show the historical outcome
    const selectedOption = this.decision.options.find((o) => o.id === this.selectedOptionId);
    const isCorrect = selectedOption?.isHistorical === true;
    const alternateOutcome = this.decision.alternateOutcomes.find(
      (ao) => ao.optionId === this.selectedOptionId
    );

    return `
      <div class="da-decision-reveal ${isCorrect ? 'da-decision-reveal--correct' : 'da-decision-reveal--alternate'}">
        <h4 class="da-decision-reveal-title">
          ${isCorrect ? '✓ You chose what history chose!' : '↪ History took a different path...'}
        </h4>
        <div class="da-decision-outcome">
          <p class="da-decision-historical-outcome">
            <strong>What happened:</strong> ${this.escapeHtml(this.decision.historicalOutcome)}
          </p>
          ${
            !isCorrect && alternateOutcome
              ? `
            <p class="da-decision-alternate-outcome">
              <strong>If history had chosen your path:</strong> ${this.escapeHtml(alternateOutcome.speculation)}
            </p>
          `
              : ''
          }
        </div>
      </div>
    `;
  }

  /**
   * Handle option click.
   */
  private handleOptionClick(e: Event): void {
    if (this.revealed) return; // Can't change after reveal

    const target = (e.currentTarget as HTMLElement);
    const optionId = target.dataset.optionId;
    if (optionId && optionId !== this.selectedOptionId) {
      this.selectedOptionId = optionId;
      this.render();

      if (this.onChoiceMade) {
        this.onChoiceMade(optionId);
      }

      // Dispatch event
      this.dispatchEvent('decision-choice-made', {
        decisionId: this.decision?.id,
        optionId,
      });
    }
  }

  /**
   * Handle reveal button click.
   */
  private handleReveal(e: Event): void {
    e.preventDefault();
    if (!this.selectedOptionId || this.revealed) return;

    this.revealed = true;
    this.render();

    // Dispatch reveal event
    const selectedOption = this.decision?.options.find((o) => o.id === this.selectedOptionId);
    this.dispatchEvent('decision-revealed', {
      decisionId: this.decision?.id,
      selectedOptionId: this.selectedOptionId,
      wasHistorical: selectedOption?.isHistorical === true,
    });
  }

  /**
   * Dispatch a custom event on the element.
   */
  private dispatchEvent(eventName: string, detail: unknown): void {
    if (!this.element) return;
    const event = new CustomEvent(`mindset-${eventName}`, {
      detail,
      bubbles: true,
    });
    this.element.dispatchEvent(event);
  }

  /**
   * Escape HTML to prevent XSS.
   * Uses browser's built-in textContent encoding.
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Clean up the component.
   */
  destroy(): void {
    if (this.element) {
      this.element.querySelectorAll('.da-decision-option').forEach((opt) => {
        opt.removeEventListener('click', this.boundHandleOptionClick);
      });
      const revealButton = this.element.querySelector('.da-decision-reveal-btn');
      if (revealButton) {
        revealButton.removeEventListener('click', this.boundHandleReveal);
      }
      this.element.remove();
    }
    this.element = null;
    this.decision = null;
    this.selectedOptionId = null;
    this.revealed = false;
    this.onChoiceMade = null;
  }
}
