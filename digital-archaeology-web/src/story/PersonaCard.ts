// src/story/PersonaCard.ts
// Persona card component for Story Mode - displays the user's adopted persona
// Story 10.18: Create Historical Personas System

import type { PersonaData, PersonaConstraint } from './types';

/**
 * PersonaCard displays the historical persona the user adopts in Story Mode.
 * Uses second-person language ("You are...") to distinguish from NPC CharacterCards.
 *
 * Layout specification:
 * - Header: "YOU ARE" label with persona name in gold accent
 * - Era: Large, prominent year display (e.g., "It's 1970...")
 * - Background: Biography and motivation
 * - Constraints: Visual badges for technical, economic, political, knowledge
 * - Challenge: The problem statement
 * - Quote: Authentic quote in styled blockquote
 */
export class PersonaCard {
  private element: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private personaData: PersonaData | null = null;

  // Element references for dynamic updates
  private nameElement: HTMLElement | null = null;
  private yearsElement: HTMLElement | null = null;
  private eraElement: HTMLElement | null = null;
  private avatarElement: HTMLElement | null = null;
  private backgroundElement: HTMLElement | null = null;
  private motivationElement: HTMLElement | null = null;
  private constraintsContainer: HTMLElement | null = null;
  private problemElement: HTMLElement | null = null;
  private quoteElement: HTMLElement | null = null;

  /**
   * Mount the persona card to a DOM element.
   * @param container - The HTML element to mount to
   */
  mount(container: HTMLElement): void {
    this.container = container;
    this.element = this.render();
    this.container.appendChild(this.element);

    // Apply any data that was set before mount
    if (this.personaData) {
      this.updateDisplay();
    }
  }

  /**
   * Set the persona data and update the display.
   * @param data - The persona data to display
   */
  setPersonaData(data: PersonaData): void {
    this.personaData = data;
    this.updateDisplay();
  }

  /**
   * Get the current persona data.
   * @returns The persona data or null if not set
   */
  getPersonaData(): PersonaData | null {
    return this.personaData;
  }

  /**
   * Update all displayed values based on current personaData.
   */
  private updateDisplay(): void {
    if (!this.personaData) return;

    if (this.nameElement) {
      this.nameElement.textContent = this.personaData.name;
    }
    if (this.yearsElement) {
      this.yearsElement.textContent = `(${this.personaData.years})`;
    }
    if (this.eraElement) {
      this.eraElement.textContent = `It's ${this.personaData.era}...`;
    }
    if (this.avatarElement) {
      this.avatarElement.textContent = this.personaData.avatar;
    }
    if (this.backgroundElement) {
      this.backgroundElement.textContent = this.personaData.background;
    }
    if (this.motivationElement) {
      this.motivationElement.textContent = this.personaData.motivation;
    }
    if (this.constraintsContainer) {
      this.renderConstraints();
    }
    if (this.problemElement) {
      this.problemElement.textContent = this.personaData.problem;
    }
    if (this.quoteElement) {
      this.quoteElement.textContent = `"${this.personaData.quote}"`;
    }
  }

  /**
   * Render the constraints as visual badges.
   */
  private renderConstraints(): void {
    if (!this.constraintsContainer || !this.personaData) return;

    // Clear existing constraints using DOM methods (XSS safe)
    while (this.constraintsContainer.firstChild) {
      this.constraintsContainer.removeChild(this.constraintsContainer.firstChild);
    }

    for (const constraint of this.personaData.constraints) {
      const badge = this.createConstraintBadge(constraint);
      this.constraintsContainer.appendChild(badge);
    }
  }

  /**
   * Create a constraint badge element.
   * @param constraint - The constraint data
   * @returns The badge element
   */
  private createConstraintBadge(constraint: PersonaConstraint): HTMLElement {
    const badge = document.createElement('div');
    badge.className = `da-constraint-badge da-constraint-badge--${constraint.type}`;
    badge.setAttribute('aria-label', `${this.getConstraintLabel(constraint.type)} constraint: ${constraint.description}`);

    const icon = document.createElement('span');
    icon.className = 'da-constraint-badge-icon';
    icon.textContent = this.getConstraintIcon(constraint.type);
    icon.setAttribute('aria-hidden', 'true');

    const text = document.createElement('span');
    text.className = 'da-constraint-badge-text';
    text.textContent = constraint.description;

    badge.appendChild(icon);
    badge.appendChild(text);

    return badge;
  }

  /**
   * Get the icon for a constraint type.
   */
  private getConstraintIcon(type: PersonaConstraint['type']): string {
    switch (type) {
      case 'technical':
        return '⚙️';
      case 'economic':
        return '💰';
      case 'political':
        return '🏛️';
      case 'knowledge':
        return '📚';
      default:
        return '❓';
    }
  }

  /**
   * Get the label for a constraint type.
   */
  private getConstraintLabel(type: PersonaConstraint['type']): string {
    switch (type) {
      case 'technical':
        return 'Technical';
      case 'economic':
        return 'Economic';
      case 'political':
        return 'Political';
      case 'knowledge':
        return 'Knowledge';
      default:
        return 'Unknown';
    }
  }

  /**
   * Render the persona card structure.
   * @returns The rendered article element
   */
  private render(): HTMLElement {
    const article = document.createElement('article');
    article.className = 'da-persona-card';
    article.setAttribute('role', 'region');
    article.setAttribute('aria-label', 'Your persona');

    // Header section: "YOU ARE"
    const header = document.createElement('div');
    header.className = 'da-persona-card-header';

    const youAreLabel = document.createElement('span');
    youAreLabel.className = 'da-persona-card-label';
    youAreLabel.textContent = 'YOU ARE';

    const avatar = document.createElement('span');
    avatar.className = 'da-persona-card-avatar';
    avatar.textContent = '👤';
    avatar.setAttribute('role', 'img');
    avatar.setAttribute('aria-label', 'Persona avatar');
    this.avatarElement = avatar;

    const nameContainer = document.createElement('div');
    nameContainer.className = 'da-persona-card-name-container';

    const name = document.createElement('h2');
    name.className = 'da-persona-card-name';
    name.textContent = 'Historical Figure';
    this.nameElement = name;

    const years = document.createElement('span');
    years.className = 'da-persona-card-years';
    years.textContent = '(1900-)';
    this.yearsElement = years;

    nameContainer.appendChild(name);
    nameContainer.appendChild(years);

    header.appendChild(youAreLabel);
    header.appendChild(avatar);
    header.appendChild(nameContainer);

    // Era section
    const era = document.createElement('div');
    era.className = 'da-persona-card-era';
    era.textContent = "It's 1970...";
    this.eraElement = era;

    // Separator
    const separator1 = document.createElement('div');
    separator1.className = 'da-persona-card-separator';

    // Background section
    const backgroundSection = document.createElement('div');
    backgroundSection.className = 'da-persona-card-section';

    const backgroundLabel = document.createElement('h3');
    backgroundLabel.className = 'da-persona-card-section-label';
    backgroundLabel.textContent = 'Your Background';

    const background = document.createElement('p');
    background.className = 'da-persona-card-background';
    background.textContent = 'Background information will appear here...';
    this.backgroundElement = background;

    backgroundSection.appendChild(backgroundLabel);
    backgroundSection.appendChild(background);

    // Motivation section
    const motivationSection = document.createElement('div');
    motivationSection.className = 'da-persona-card-section';

    const motivationLabel = document.createElement('h3');
    motivationLabel.className = 'da-persona-card-section-label';
    motivationLabel.textContent = 'Your Motivation';

    const motivation = document.createElement('p');
    motivation.className = 'da-persona-card-motivation';
    motivation.textContent = 'Motivation will appear here...';
    this.motivationElement = motivation;

    motivationSection.appendChild(motivationLabel);
    motivationSection.appendChild(motivation);

    // Constraints section
    const constraintsSection = document.createElement('div');
    constraintsSection.className = 'da-persona-card-section';

    const constraintsLabel = document.createElement('h3');
    constraintsLabel.className = 'da-persona-card-section-label';
    constraintsLabel.textContent = 'Your Constraints';

    const constraints = document.createElement('div');
    constraints.className = 'da-persona-card-constraints';
    this.constraintsContainer = constraints;

    constraintsSection.appendChild(constraintsLabel);
    constraintsSection.appendChild(constraints);

    // Separator
    const separator2 = document.createElement('div');
    separator2.className = 'da-persona-card-separator';

    // Challenge section
    const challengeSection = document.createElement('div');
    challengeSection.className = 'da-persona-card-challenge';

    const challengeLabel = document.createElement('h3');
    challengeLabel.className = 'da-persona-card-challenge-label';
    challengeLabel.textContent = 'YOUR CHALLENGE';

    const problem = document.createElement('p');
    problem.className = 'da-persona-card-problem';
    problem.textContent = 'The problem will appear here...';
    this.problemElement = problem;

    challengeSection.appendChild(challengeLabel);
    challengeSection.appendChild(problem);

    // Quote section
    const quoteSection = document.createElement('blockquote');
    quoteSection.className = 'da-persona-card-quote';
    quoteSection.setAttribute('role', 'blockquote');

    const quote = document.createElement('p');
    quote.className = 'da-persona-card-quote-text';
    quote.textContent = '"Quote will appear here..."';
    this.quoteElement = quote;

    quoteSection.appendChild(quote);

    // Assemble
    article.appendChild(header);
    article.appendChild(era);
    article.appendChild(separator1);
    article.appendChild(backgroundSection);
    article.appendChild(motivationSection);
    article.appendChild(constraintsSection);
    article.appendChild(separator2);
    article.appendChild(challengeSection);
    article.appendChild(quoteSection);

    return article;
  }

  /**
   * Show the persona card.
   */
  show(): void {
    this.element?.classList.remove('da-persona-card--hidden');
  }

  /**
   * Hide the persona card.
   */
  hide(): void {
    this.element?.classList.add('da-persona-card--hidden');
  }

  /**
   * Check if the persona card is currently visible.
   * @returns true if visible and mounted, false otherwise
   */
  isVisible(): boolean {
    if (!this.element) return false;
    return !this.element.classList.contains('da-persona-card--hidden');
  }

  /**
   * Get the root element.
   * @returns The article element or null if not mounted
   */
  getElement(): HTMLElement | null {
    return this.element;
  }

  /**
   * Destroy the component and clean up resources.
   */
  destroy(): void {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    this.container = null;
    this.personaData = null;
    this.nameElement = null;
    this.yearsElement = null;
    this.eraElement = null;
    this.avatarElement = null;
    this.backgroundElement = null;
    this.motivationElement = null;
    this.constraintsContainer = null;
    this.problemElement = null;
    this.quoteElement = null;
  }
}
