// src/story/DecisionMakerScene.ts
// Decision scene that wraps HistoricalDecisionCard with era context
// Story 10.22: Decision-Maker + Builder Mode

import type { HistoricalDecision, BraveAlternative } from './types';
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

    // Story 26.16: Show "What if someone had been brave?" panel
    if (this.decision?.braveAlternative) {
      this.renderBraveAlternative(this.decision.braveAlternative);
    }
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
   * Story 26.16: Render the "What if someone had been brave?" panel.
   * Appears after the decision reveal, showing the brave vs safe analysis.
   */
  private renderBraveAlternative(brave: BraveAlternative): void {
    if (!this.element) return;

    const panel = document.createElement('div');
    panel.className = 'da-brave-alternative';
    panel.setAttribute('role', 'note');

    // Header
    const headerId = `da-brave-alternative-header-${this.decision?.id ?? 'default'}`;
    const header = document.createElement('h4');
    header.id = headerId;
    header.className = 'da-brave-alternative__header';
    header.textContent = 'What if someone had been brave?';
    panel.setAttribute('aria-labelledby', headerId);
    panel.appendChild(header);

    // Brave vs Safe comparison
    const comparison = document.createElement('div');
    comparison.className = 'da-brave-alternative__comparison';

    const braveCard = document.createElement('div');
    braveCard.className = 'da-brave-alternative__card da-brave-alternative__card--brave';
    const braveLabel = document.createElement('div');
    braveLabel.className = 'da-brave-alternative__card-label';
    braveLabel.textContent = 'The Brave Path';
    const braveText = document.createElement('p');
    braveText.className = 'da-brave-alternative__card-text';
    braveText.textContent = brave.braveAction;
    braveCard.appendChild(braveLabel);
    braveCard.appendChild(braveText);

    const safeCard = document.createElement('div');
    safeCard.className = 'da-brave-alternative__card da-brave-alternative__card--safe';
    const safeLabel = document.createElement('div');
    safeLabel.className = 'da-brave-alternative__card-label';
    safeLabel.textContent = 'The Safe Choice';
    const safeText = document.createElement('p');
    safeText.className = 'da-brave-alternative__card-text';
    safeText.textContent = brave.safeChoice;
    safeCard.appendChild(safeLabel);
    safeCard.appendChild(safeText);

    comparison.appendChild(braveCard);
    comparison.appendChild(safeCard);
    panel.appendChild(comparison);

    // Constraint badge — what held people back?
    const constraintBadge = document.createElement('div');
    constraintBadge.className = `da-brave-alternative__constraint da-brave-alternative__constraint--${brave.constraintType}`;
    const constraintLabels: Record<string, string> = {
      fear: 'Held back by: Fear',
      economics: 'Held back by: Economics',
      politics: 'Held back by: Politics',
      physics: 'Constrained by: Physics',
      knowledge: 'Constrained by: Knowledge',
    };
    constraintBadge.textContent = constraintLabels[brave.constraintType] ?? `Constraint: ${brave.constraintType}`;
    panel.appendChild(constraintBadge);

    // Why the safe choice was made
    const whySafe = document.createElement('p');
    whySafe.className = 'da-brave-alternative__why-safe';
    whySafe.textContent = brave.whySafe;
    panel.appendChild(whySafe);

    // What-if narrative
    const whatIf = document.createElement('div');
    whatIf.className = 'da-brave-alternative__what-if';
    const whatIfLabel = document.createElement('div');
    whatIfLabel.className = 'da-brave-alternative__what-if-label';
    whatIfLabel.textContent = 'If someone had dared\u2026';
    const whatIfText = document.createElement('p');
    whatIfText.className = 'da-brave-alternative__what-if-text';
    whatIfText.textContent = brave.whatIfNarrative;
    whatIf.appendChild(whatIfLabel);
    whatIf.appendChild(whatIfText);
    panel.appendChild(whatIf);

    // Key insight
    const insight = document.createElement('div');
    insight.className = 'da-brave-alternative__insight';
    insight.textContent = brave.insight;
    panel.appendChild(insight);

    // Reflection prompt
    const reflection = document.createElement('div');
    reflection.className = 'da-brave-alternative__reflection';
    reflection.textContent = brave.reflectionPrompt;
    panel.appendChild(reflection);

    this.element.appendChild(panel);
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
