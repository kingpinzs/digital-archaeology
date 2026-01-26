// src/story/PersonaProfilePanel.ts
// Detailed persona profile panel for Story Mode - modal view of current persona
// Story 10.19: Implement Persona Profile Cards

import type { PersonaData, PersonaConstraint } from './types';

/**
 * PersonaProfilePanel displays a detailed view of the historical persona.
 * Opens as a modal panel with full profile information, quotes carousel,
 * and discoveries made during the current era.
 *
 * Layout specification:
 * - Modal overlay with backdrop
 * - Header: Avatar, name, years, era
 * - Key Contribution section (highlighted)
 * - Background and Motivation sections
 * - Constraints badges (reused from PersonaCard)
 * - Your Challenge section
 * - Discoveries Made section (dynamic)
 * - Quotes carousel with navigation
 * - Close button and Escape key handling
 */
export class PersonaProfilePanel {
  private element: HTMLElement | null = null;
  private backdropElement: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private personaData: PersonaData | null = null;

  // Quote carousel state
  private currentQuoteIndex = 0;
  private allQuotes: string[] = [];

  // Element references for dynamic updates
  private nameElement: HTMLElement | null = null;
  private yearsElement: HTMLElement | null = null;
  private eraElement: HTMLElement | null = null;
  private avatarElement: HTMLElement | null = null;
  private contributionElement: HTMLElement | null = null;
  private backgroundElement: HTMLElement | null = null;
  private motivationElement: HTMLElement | null = null;
  private constraintsContainer: HTMLElement | null = null;
  private challengeElement: HTMLElement | null = null;
  private discoveriesContainer: HTMLElement | null = null;
  private quoteTextElement: HTMLElement | null = null;
  private quoteCounterElement: HTMLElement | null = null;
  private closeButton: HTMLElement | null = null;
  // Accessibility: aria-live region for announcements (Code Review Fix: M2)
  private liveRegion: HTMLElement | null = null;

  // Bound event handlers for cleanup
  private boundHandleKeydown: (e: KeyboardEvent) => void;
  private boundHandleBackdropClick: (e: MouseEvent) => void;
  private boundHandleCloseClick: (e: MouseEvent) => void;
  private boundHandlePrevQuote: (e: MouseEvent) => void;
  private boundHandleNextQuote: (e: MouseEvent) => void;
  // Story 10.19: Task 7 - Event subscriptions
  private boundHandleViewPersonaRequested: (e: Event) => void;
  private boundHandlePersonaChanged: (e: Event) => void;

  constructor() {
    this.boundHandleKeydown = this.handleKeydown.bind(this);
    this.boundHandleBackdropClick = this.handleBackdropClick.bind(this);
    this.boundHandleCloseClick = this.handleCloseClick.bind(this);
    this.boundHandlePrevQuote = this.handlePrevQuote.bind(this);
    this.boundHandleNextQuote = this.handleNextQuote.bind(this);
    // Story 10.19: Task 7 - Bind event handlers
    this.boundHandleViewPersonaRequested = this.handleViewPersonaRequested.bind(this);
    this.boundHandlePersonaChanged = this.handlePersonaChanged.bind(this);
  }

  /**
   * Mount the panel to a DOM element.
   * @param container - The HTML element to mount to
   */
  mount(container: HTMLElement): void {
    this.container = container;

    // Create backdrop
    this.backdropElement = document.createElement('div');
    this.backdropElement.className = 'da-persona-profile-backdrop da-hidden';
    this.backdropElement.addEventListener('click', this.boundHandleBackdropClick);
    this.container.appendChild(this.backdropElement);

    // Create panel
    this.element = this.render();
    this.container.appendChild(this.element);

    // Add global keydown listener
    document.addEventListener('keydown', this.boundHandleKeydown);

    // Story 10.19: Task 7 - Subscribe to events
    window.addEventListener('view-persona-requested', this.boundHandleViewPersonaRequested);
    window.addEventListener('persona-changed', this.boundHandlePersonaChanged);

    // Create aria-live region for screen reader announcements (Code Review Fix: M2)
    this.liveRegion = document.createElement('div');
    this.liveRegion.className = 'da-sr-only';
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.container.appendChild(this.liveRegion);

    // Apply any data set before mount
    if (this.personaData) {
      this.updateDisplay();
    }
  }

  /**
   * Announce a message to screen readers via aria-live region.
   * Code Review Fix: M2
   */
  private announceToScreenReader(message: string): void {
    if (this.liveRegion) {
      this.liveRegion.textContent = message;
    }
  }

  /**
   * Set the persona data and update the display.
   * @param data - The persona data to display
   */
  setPersonaData(data: PersonaData): void {
    this.personaData = data;
    this.buildQuotesList();
    this.currentQuoteIndex = 0;
    this.updateDisplay();
  }

  /**
   * Get the current persona data.
   */
  getPersonaData(): PersonaData | null {
    return this.personaData;
  }

  /**
   * Build the combined list of all quotes.
   */
  private buildQuotesList(): void {
    this.allQuotes = [];
    if (this.personaData?.quote) {
      this.allQuotes.push(this.personaData.quote);
    }
    if (this.personaData?.additionalQuotes) {
      this.allQuotes.push(...this.personaData.additionalQuotes);
    }
  }

  /**
   * Show the panel.
   */
  show(): void {
    this.element?.classList.remove('da-hidden');
    this.backdropElement?.classList.remove('da-hidden');

    // Add visible classes for CSS animations (Code Review Fix: H1)
    // Use requestAnimationFrame to ensure transition triggers after display change
    requestAnimationFrame(() => {
      this.element?.classList.add('da-persona-profile-panel--visible');
      this.backdropElement?.classList.add('da-persona-profile-backdrop--visible');
    });

    // Focus close button for accessibility
    this.closeButton?.focus();

    // Announce to screen readers (Code Review Fix: M2)
    this.announceToScreenReader('Persona profile opened');

    // Dispatch event
    window.dispatchEvent(new CustomEvent('persona-profile-opened', {
      detail: { persona: this.personaData },
    }));
  }

  /**
   * Hide the panel.
   */
  hide(): void {
    // Remove visible classes first for animation
    this.element?.classList.remove('da-persona-profile-panel--visible');
    this.backdropElement?.classList.remove('da-persona-profile-backdrop--visible');

    // Hide immediately (CSS handles opacity transition)
    this.element?.classList.add('da-hidden');
    this.backdropElement?.classList.add('da-hidden');

    // Announce to screen readers (Code Review Fix: M2)
    this.announceToScreenReader('Persona profile closed');

    // Dispatch event
    window.dispatchEvent(new CustomEvent('persona-profile-closed', {
      detail: { persona: this.personaData },
    }));
  }

  /**
   * Check if the panel is currently visible.
   */
  isVisible(): boolean {
    if (!this.element) return false;
    return !this.element.classList.contains('da-hidden');
  }

  /**
   * Handle keydown events.
   */
  private handleKeydown(e: KeyboardEvent): void {
    if (!this.isVisible()) return;

    if (e.key === 'Escape') {
      this.hide();
    } else if (e.key === 'ArrowLeft') {
      this.prevQuote();
    } else if (e.key === 'ArrowRight') {
      this.nextQuote();
    } else if (e.key === 'Tab') {
      // Focus trap implementation (Code Review Fix: M1)
      this.handleFocusTrap(e);
    }
  }

  /**
   * Trap focus inside the modal when open.
   * Code Review Fix: M1
   */
  private handleFocusTrap(e: KeyboardEvent): void {
    if (!this.element) return;

    const focusableElements = this.element.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      // Shift+Tab: wrap to last element
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      // Tab: wrap to first element
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  }

  /**
   * Handle backdrop click.
   */
  private handleBackdropClick(e: MouseEvent): void {
    if (e.target === this.backdropElement) {
      this.hide();
    }
  }

  /**
   * Handle close button click.
   */
  private handleCloseClick(): void {
    this.hide();
  }

  /**
   * Handle view-persona-requested event.
   * Story 10.19: Task 7 - Opens panel when button clicked or P key pressed
   */
  private handleViewPersonaRequested(event: Event): void {
    const customEvent = event as CustomEvent<{ persona: PersonaData }>;
    if (customEvent.detail?.persona) {
      this.setPersonaData(customEvent.detail.persona);
      this.show();
    }
  }

  /**
   * Handle persona-changed event.
   * Story 10.19: Task 7 - Updates panel data when persona changes
   */
  private handlePersonaChanged(event: Event): void {
    const customEvent = event as CustomEvent<{ persona: PersonaData | null }>;
    if (customEvent.detail?.persona) {
      this.setPersonaData(customEvent.detail.persona);
    }
  }

  /**
   * Handle previous quote button click.
   */
  private handlePrevQuote(): void {
    this.prevQuote();
  }

  /**
   * Handle next quote button click.
   */
  private handleNextQuote(): void {
    this.nextQuote();
  }

  /**
   * Go to previous quote.
   */
  private prevQuote(): void {
    if (this.allQuotes.length === 0) return;
    this.currentQuoteIndex = (this.currentQuoteIndex - 1 + this.allQuotes.length) % this.allQuotes.length;
    this.updateQuoteDisplay();
  }

  /**
   * Go to next quote.
   */
  private nextQuote(): void {
    if (this.allQuotes.length === 0) return;
    this.currentQuoteIndex = (this.currentQuoteIndex + 1) % this.allQuotes.length;
    this.updateQuoteDisplay();
  }

  /**
   * Update the quote display.
   */
  private updateQuoteDisplay(): void {
    if (!this.quoteTextElement || this.allQuotes.length === 0) return;

    this.quoteTextElement.textContent = `"${this.allQuotes[this.currentQuoteIndex]}"`;

    if (this.quoteCounterElement) {
      this.quoteCounterElement.textContent = `${this.currentQuoteIndex + 1}/${this.allQuotes.length}`;
    }
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
      this.eraElement.textContent = `Era: ${this.personaData.era}`;
    }
    if (this.avatarElement) {
      this.avatarElement.textContent = this.personaData.avatar;
    }

    // Key contribution section
    if (this.contributionElement) {
      if (this.personaData.keyContribution) {
        this.contributionElement.textContent = this.personaData.keyContribution;
        this.contributionElement.classList.remove('da-hidden');
      } else {
        this.contributionElement.textContent = '';
        this.contributionElement.classList.add('da-hidden');
      }
    }

    if (this.backgroundElement) {
      this.backgroundElement.textContent = this.personaData.background;
    }
    if (this.motivationElement) {
      this.motivationElement.textContent = this.personaData.motivation;
    }

    this.renderConstraints();
    this.renderDiscoveries();

    if (this.challengeElement) {
      this.challengeElement.textContent = this.personaData.problem;
    }

    this.updateQuoteDisplay();
  }

  /**
   * Render constraint badges.
   */
  private renderConstraints(): void {
    if (!this.constraintsContainer || !this.personaData) return;

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
   * Render discoveries section.
   */
  private renderDiscoveries(): void {
    if (!this.discoveriesContainer || !this.personaData) return;

    while (this.discoveriesContainer.firstChild) {
      this.discoveriesContainer.removeChild(this.discoveriesContainer.firstChild);
    }

    const discoveries = this.personaData.discoveriesUnlocked || [];

    if (discoveries.length === 0) {
      const placeholder = document.createElement('p');
      placeholder.className = 'da-persona-profile-no-discoveries';
      placeholder.textContent = 'No discoveries yet';
      this.discoveriesContainer.appendChild(placeholder);
    } else {
      for (const discoveryId of discoveries) {
        const badge = document.createElement('span');
        badge.className = 'da-persona-profile-discovery-badge';
        badge.textContent = '✅';
        badge.setAttribute('title', this.formatDiscoveryName(discoveryId));
        badge.setAttribute('aria-label', `Discovery: ${this.formatDiscoveryName(discoveryId)}`);

        const label = document.createElement('span');
        label.className = 'da-persona-profile-discovery-label';
        label.textContent = this.formatDiscoveryName(discoveryId);

        const item = document.createElement('div');
        item.className = 'da-persona-profile-discovery-item';
        item.appendChild(badge);
        item.appendChild(label);

        this.discoveriesContainer.appendChild(item);
      }
    }
  }

  /**
   * Format discovery ID to display name.
   */
  private formatDiscoveryName(id: string): string {
    return id
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Render the panel structure.
   */
  private render(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'da-persona-profile-panel da-hidden';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');

    // Generate unique ID for name element
    const nameId = `persona-profile-name-${Date.now()}`;
    panel.setAttribute('aria-labelledby', nameId);

    // Close button
    const closeButton = document.createElement('button');
    closeButton.className = 'da-persona-profile-close';
    closeButton.setAttribute('aria-label', 'Close persona profile');
    closeButton.textContent = '×';
    closeButton.addEventListener('click', this.boundHandleCloseClick);
    this.closeButton = closeButton;

    // Header section
    const header = document.createElement('div');
    header.className = 'da-persona-profile-header';

    const avatar = document.createElement('div');
    avatar.className = 'da-persona-profile-avatar';
    avatar.textContent = '👤';
    avatar.setAttribute('role', 'img');
    avatar.setAttribute('aria-label', 'Persona avatar');
    this.avatarElement = avatar;

    const nameContainer = document.createElement('div');
    nameContainer.className = 'da-persona-profile-name-container';

    const name = document.createElement('h2');
    name.className = 'da-persona-profile-name';
    name.id = nameId;
    name.textContent = 'Historical Figure';
    this.nameElement = name;

    const years = document.createElement('span');
    years.className = 'da-persona-profile-years';
    years.textContent = '(1900-)';
    this.yearsElement = years;

    const era = document.createElement('span');
    era.className = 'da-persona-profile-era';
    era.textContent = 'Era: 1970-1971';
    this.eraElement = era;

    nameContainer.appendChild(name);
    nameContainer.appendChild(years);
    nameContainer.appendChild(era);

    header.appendChild(avatar);
    header.appendChild(nameContainer);

    // Key Contribution section
    const contributionSection = document.createElement('div');
    contributionSection.className = 'da-persona-profile-section';

    const contributionLabel = document.createElement('h3');
    contributionLabel.className = 'da-persona-profile-section-label';
    contributionLabel.textContent = 'KEY CONTRIBUTION';

    const contribution = document.createElement('p');
    contribution.className = 'da-persona-profile-contribution da-hidden';
    this.contributionElement = contribution;

    contributionSection.appendChild(contributionLabel);
    contributionSection.appendChild(contribution);

    // Background section
    const backgroundSection = document.createElement('div');
    backgroundSection.className = 'da-persona-profile-section';

    const backgroundLabel = document.createElement('h3');
    backgroundLabel.className = 'da-persona-profile-section-label';
    backgroundLabel.textContent = 'YOUR BACKGROUND';

    const background = document.createElement('p');
    background.className = 'da-persona-profile-background';
    background.textContent = 'Background will appear here...';
    this.backgroundElement = background;

    backgroundSection.appendChild(backgroundLabel);
    backgroundSection.appendChild(background);

    // Motivation section
    const motivationSection = document.createElement('div');
    motivationSection.className = 'da-persona-profile-section';

    const motivationLabel = document.createElement('h3');
    motivationLabel.className = 'da-persona-profile-section-label';
    motivationLabel.textContent = 'YOUR MOTIVATION';

    const motivation = document.createElement('p');
    motivation.className = 'da-persona-profile-motivation';
    motivation.textContent = 'Motivation will appear here...';
    this.motivationElement = motivation;

    motivationSection.appendChild(motivationLabel);
    motivationSection.appendChild(motivation);

    // Constraints section
    const constraintsSection = document.createElement('div');
    constraintsSection.className = 'da-persona-profile-section';

    const constraintsLabel = document.createElement('h3');
    constraintsLabel.className = 'da-persona-profile-section-label';
    constraintsLabel.textContent = 'YOUR CONSTRAINTS';

    const constraints = document.createElement('div');
    constraints.className = 'da-persona-profile-constraints';
    this.constraintsContainer = constraints;

    constraintsSection.appendChild(constraintsLabel);
    constraintsSection.appendChild(constraints);

    // Challenge section
    const challengeSection = document.createElement('div');
    challengeSection.className = 'da-persona-profile-section da-persona-profile-challenge-section';

    const challengeLabel = document.createElement('h3');
    challengeLabel.className = 'da-persona-profile-section-label';
    challengeLabel.textContent = 'YOUR CHALLENGE';

    const challenge = document.createElement('p');
    challenge.className = 'da-persona-profile-challenge';
    challenge.textContent = 'Challenge will appear here...';
    this.challengeElement = challenge;

    challengeSection.appendChild(challengeLabel);
    challengeSection.appendChild(challenge);

    // Discoveries section
    const discoveriesSection = document.createElement('div');
    discoveriesSection.className = 'da-persona-profile-section';

    const discoveriesLabel = document.createElement('h3');
    discoveriesLabel.className = 'da-persona-profile-section-label';
    discoveriesLabel.textContent = 'DISCOVERIES MADE THIS ERA';

    const discoveries = document.createElement('div');
    discoveries.className = 'da-persona-profile-discoveries';
    this.discoveriesContainer = discoveries;

    discoveriesSection.appendChild(discoveriesLabel);
    discoveriesSection.appendChild(discoveries);

    // Quotes section
    const quotesSection = document.createElement('div');
    quotesSection.className = 'da-persona-profile-quotes';

    const quotesLabel = document.createElement('h3');
    quotesLabel.className = 'da-persona-profile-section-label';
    quotesLabel.textContent = 'IN THEIR WORDS';

    const quoteText = document.createElement('p');
    quoteText.className = 'da-persona-profile-quote-text';
    quoteText.textContent = '"Quote will appear here..."';
    this.quoteTextElement = quoteText;

    const quoteNav = document.createElement('div');
    quoteNav.className = 'da-persona-profile-quote-nav';

    const prevButton = document.createElement('button');
    prevButton.className = 'da-persona-profile-quote-prev';
    prevButton.textContent = '◀';
    prevButton.setAttribute('aria-label', 'Previous quote');
    prevButton.addEventListener('click', this.boundHandlePrevQuote);

    const quoteCounter = document.createElement('span');
    quoteCounter.className = 'da-persona-profile-quote-counter';
    quoteCounter.textContent = '1/1';
    this.quoteCounterElement = quoteCounter;

    const nextButton = document.createElement('button');
    nextButton.className = 'da-persona-profile-quote-next';
    nextButton.textContent = '▶';
    nextButton.setAttribute('aria-label', 'Next quote');
    nextButton.addEventListener('click', this.boundHandleNextQuote);

    quoteNav.appendChild(prevButton);
    quoteNav.appendChild(quoteCounter);
    quoteNav.appendChild(nextButton);

    quotesSection.appendChild(quotesLabel);
    quotesSection.appendChild(quoteText);
    quotesSection.appendChild(quoteNav);

    // Assemble panel
    panel.appendChild(closeButton);
    panel.appendChild(header);
    panel.appendChild(contributionSection);
    panel.appendChild(backgroundSection);
    panel.appendChild(motivationSection);
    panel.appendChild(constraintsSection);
    panel.appendChild(challengeSection);
    panel.appendChild(discoveriesSection);
    panel.appendChild(quotesSection);

    return panel;
  }

  /**
   * Destroy the component and clean up resources.
   */
  destroy(): void {
    // Remove event listeners
    document.removeEventListener('keydown', this.boundHandleKeydown);

    // Story 10.19: Task 7 - Remove event subscriptions
    window.removeEventListener('view-persona-requested', this.boundHandleViewPersonaRequested);
    window.removeEventListener('persona-changed', this.boundHandlePersonaChanged);

    if (this.backdropElement) {
      this.backdropElement.removeEventListener('click', this.boundHandleBackdropClick);
      this.backdropElement.remove();
      this.backdropElement = null;
    }

    if (this.closeButton) {
      this.closeButton.removeEventListener('click', this.boundHandleCloseClick);
      this.closeButton = null;
    }

    if (this.element) {
      this.element.remove();
      this.element = null;
    }

    this.container = null;
    this.personaData = null;
    this.allQuotes = [];
    this.currentQuoteIndex = 0;

    // Clear element references
    this.nameElement = null;
    this.yearsElement = null;
    this.eraElement = null;
    this.avatarElement = null;
    this.contributionElement = null;
    this.backgroundElement = null;
    this.motivationElement = null;
    this.constraintsContainer = null;
    this.challengeElement = null;
    this.discoveriesContainer = null;
    this.quoteTextElement = null;
    this.quoteCounterElement = null;

    // Clean up aria-live region (Code Review Fix: M2)
    if (this.liveRegion) {
      this.liveRegion.remove();
      this.liveRegion = null;
    }
  }
}
