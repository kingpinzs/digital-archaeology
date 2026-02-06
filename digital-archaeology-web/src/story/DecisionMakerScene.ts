// src/story/DecisionMakerScene.ts
// Decision scene that wraps HistoricalDecisionCard with era context
// Story 10.22: Decision-Maker + Builder Mode

import type { HistoricalDecision } from './types';
import { HistoricalDecisionCard } from './HistoricalDecisionCard';
import { MindsetProvider } from './MindsetProvider';

/**
 * DecisionMakerScene presents a historical decision within the current era context.
 * Wraps the existing HistoricalDecisionCard and adds:
 * - Era context summary from MindsetProvider
 * - "Now build your solution" CTA after decision is revealed
 * - Callback for transitioning to builder mode
 */
export class DecisionMakerScene {
  private container: HTMLElement | null = null;
  private element: HTMLElement | null = null;
  private decisionCard: HistoricalDecisionCard | null = null;
  private decision: HistoricalDecision | null = null;
  private buildTransitionCallback: ((decisionId: string, chosenOptionId: string) => void) | null = null;

  // Bound event handlers for cleanup
  private boundHandleRevealed: (e: Event) => void;
  private boundHandleBuildClick: (e: Event) => void;

  constructor() {
    this.boundHandleRevealed = this.handleRevealed.bind(this);
    this.boundHandleBuildClick = this.handleBuildClick.bind(this);
  }

  /**
   * Mount the component to a container.
   */
  mount(container: HTMLElement): void {
    this.container = container;
    this.element = document.createElement('div');
    this.element.className = 'da-decision-maker-scene';
    this.element.setAttribute('role', 'region');
    this.element.setAttribute('aria-label', 'Historical Decision');
    this.container.appendChild(this.element);
    this.render();
  }

  /**
   * Set the decision to present.
   */
  setDecision(decision: HistoricalDecision): void {
    this.decision = decision;
    this.render();
  }

  /**
   * Register callback for when user is ready to transition to builder mode.
   */
  onBuildTransition(callback: (decisionId: string, chosenOptionId: string) => void): void {
    this.buildTransitionCallback = callback;
  }

  /**
   * Get the underlying HistoricalDecisionCard.
   */
  getDecisionCard(): HistoricalDecisionCard | null {
    return this.decisionCard;
  }

  /**
   * Render the scene content.
   */
  private render(): void {
    if (!this.element) return;

    // Clean up previous card
    if (this.decisionCard) {
      this.element.removeEventListener('mindset-decision-revealed', this.boundHandleRevealed);
      this.decisionCard.destroy();
      this.decisionCard = null;
    }

    // Clear element
    while (this.element.firstChild) {
      this.element.removeChild(this.element.firstChild);
    }

    // Render era context summary
    this.renderEraContext();

    // Create and mount decision card
    if (this.decision) {
      const cardMount = document.createElement('div');
      cardMount.className = 'da-decision-maker-card-mount';
      this.element.appendChild(cardMount);

      this.decisionCard = new HistoricalDecisionCard();
      this.decisionCard.mount(cardMount);
      this.decisionCard.setDecision(this.decision);

      // Listen for reveal event (bubbles from HistoricalDecisionCard)
      this.element.addEventListener('mindset-decision-revealed', this.boundHandleRevealed);
    }
  }

  /**
   * Render era context from current mindset.
   */
  private renderEraContext(): void {
    if (!this.element) return;

    const mindset = MindsetProvider.getInstance().getCurrentMindset();
    if (!mindset) return;

    const contextSection = document.createElement('div');
    contextSection.className = 'da-decision-maker-era-context';

    const yearEl = document.createElement('div');
    yearEl.className = 'da-decision-maker-year';
    yearEl.textContent = String(mindset.year);
    yearEl.setAttribute('aria-label', `Current year: ${mindset.year}`);
    contextSection.appendChild(yearEl);

    if (mindset.historicalPerspective) {
      const perspectiveEl = document.createElement('p');
      perspectiveEl.className = 'da-decision-maker-perspective';
      perspectiveEl.textContent = mindset.historicalPerspective.currentKnowledge;
      contextSection.appendChild(perspectiveEl);
    }

    this.element.appendChild(contextSection);
  }

  /**
   * Handle the decision-revealed event from HistoricalDecisionCard.
   */
  private handleRevealed(_e: Event): void {
    if (!this.element || !this.decisionCard) return;

    // Show "Now build your solution" CTA
    const existingCta = this.element.querySelector('.da-decision-maker-build-cta');
    if (existingCta) return; // Already shown

    const ctaContainer = document.createElement('div');
    ctaContainer.className = 'da-decision-maker-build-cta';

    const ctaText = document.createElement('p');
    ctaText.className = 'da-decision-maker-build-text';
    ctaText.textContent = 'Now build your solution';

    const ctaButton = document.createElement('button');
    ctaButton.className = 'da-decision-maker-build-btn';
    ctaButton.type = 'button';
    ctaButton.textContent = 'Enter Builder Mode';
    ctaButton.setAttribute('aria-label', 'Enter Builder Mode to implement your decision');
    ctaButton.addEventListener('click', this.boundHandleBuildClick);

    ctaContainer.appendChild(ctaText);
    ctaContainer.appendChild(ctaButton);
    this.element.appendChild(ctaContainer);
  }

  /**
   * Handle build button click.
   */
  private handleBuildClick(_e: Event): void {
    if (!this.decision || !this.decisionCard) return;

    const chosenOptionId = this.decisionCard.getSelectedOption();
    if (!chosenOptionId) return;

    if (this.buildTransitionCallback) {
      this.buildTransitionCallback(this.decision.id, chosenOptionId);
    }
  }

  /**
   * Clean up the component.
   */
  destroy(): void {
    if (this.element) {
      this.element.removeEventListener('mindset-decision-revealed', this.boundHandleRevealed);
      const buildBtn = this.element.querySelector('.da-decision-maker-build-btn');
      if (buildBtn) {
        buildBtn.removeEventListener('click', this.boundHandleBuildClick);
      }
    }
    if (this.decisionCard) {
      this.decisionCard.destroy();
      this.decisionCard = null;
    }
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    this.container = null;
    this.decision = null;
    this.buildTransitionCallback = null;
  }
}
