// src/story/PersonaTransitionPanel.ts
// Transition narrative panel between historical eras/personas
// Story 10.20: Create Persona Transition Narratives

import type { TransitionData, PersonaData } from './types';

/** Counter for generating unique IDs across all PersonaTransitionPanel instances */
let panelIdCounter = 0;

/**
 * Configuration options for PersonaTransitionPanel.
 */
export interface PersonaTransitionPanelOptions {
  /** Whether to allow Escape key to close the panel (default: false - transitions are mandatory) */
  allowEscapeClose?: boolean;
}

/**
 * PersonaTransitionPanel displays a narrative bridge between historical eras.
 * Shows the outgoing persona's legacy, time passage, and introduces the next era.
 *
 * Layout specification:
 * - Full-page modal overlay with backdrop
 * - Outgoing persona section (avatar, name, contribution, legacy quote)
 * - Visual timeline showing years elapsed and era labels
 * - Narrative bridge paragraphs
 * - Incoming persona teaser (avatar, name, era, introductory quote)
 * - Continue Your Journey button
 */
export class PersonaTransitionPanel {
  private element: HTMLElement | null = null;
  private backdropElement: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private transitionData: TransitionData | null = null;
  private outgoingPersona: PersonaData | null = null;
  private incomingPersona: PersonaData | null = null;
  private options: PersonaTransitionPanelOptions;

  // Element references for dynamic updates
  private outgoingAvatarElement: HTMLElement | null = null;
  private outgoingNameElement: HTMLElement | null = null;
  private outgoingContributionElement: HTMLElement | null = null;
  private outgoingQuoteElement: HTMLElement | null = null;
  private yearsElapsedElement: HTMLElement | null = null;
  private outgoingEraElement: HTMLElement | null = null;
  private incomingEraElement: HTMLElement | null = null;
  private narrativeContainer: HTMLElement | null = null;
  private incomingAvatarElement: HTMLElement | null = null;
  private incomingNameElement: HTMLElement | null = null;
  private incomingEraValueElement: HTMLElement | null = null;
  private incomingQuoteElement: HTMLElement | null = null;
  private continueButton: HTMLElement | null = null;
  private liveRegion: HTMLElement | null = null;

  // Callback for continue button
  private onContinueCallback: (() => void) | null = null;

  // Bound event handlers for cleanup
  private boundHandleKeydown: (e: KeyboardEvent) => void;
  private boundHandleContinueClick: (e: MouseEvent) => void;

  constructor(options: PersonaTransitionPanelOptions = {}) {
    this.options = {
      allowEscapeClose: false,
      ...options,
    };
    this.boundHandleKeydown = this.handleKeydown.bind(this);
    this.boundHandleContinueClick = this.handleContinueClick.bind(this);
  }

  /**
   * Mount the panel to a DOM element.
   * @param container - The HTML element to mount to
   */
  mount(container: HTMLElement): void {
    this.container = container;

    // Create backdrop
    this.backdropElement = document.createElement('div');
    this.backdropElement.className = 'da-persona-transition-backdrop da-hidden';
    this.container.appendChild(this.backdropElement);

    // Create panel
    this.element = this.render();
    this.container.appendChild(this.element);

    // Add global keydown listener
    document.addEventListener('keydown', this.boundHandleKeydown);

    // Create aria-live region for screen reader announcements
    this.liveRegion = document.createElement('div');
    this.liveRegion.className = 'da-sr-only';
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.container.appendChild(this.liveRegion);

    // Apply any data set before mount
    if (this.transitionData && this.outgoingPersona && this.incomingPersona) {
      this.updateDisplay();
    }
  }

  /**
   * Set the transition data and personas.
   * @param data - The transition data
   * @param outgoing - The outgoing persona data
   * @param incoming - The incoming persona data
   */
  setTransitionData(
    data: TransitionData,
    outgoing: PersonaData,
    incoming: PersonaData
  ): void {
    this.transitionData = data;
    this.outgoingPersona = outgoing;
    this.incomingPersona = incoming;
    this.updateDisplay();
  }

  /**
   * Set callback for when Continue button is clicked.
   * @param callback - The callback function
   */
  onContinue(callback: () => void): void {
    this.onContinueCallback = callback;
  }

  /**
   * Show the panel.
   */
  show(): void {
    this.element?.classList.remove('da-hidden');
    this.backdropElement?.classList.remove('da-hidden');

    // Add visible classes for CSS animations (Issue 5 fix: focus after visible class applied)
    requestAnimationFrame(() => {
      this.element?.classList.add('da-persona-transition-panel--visible');
      this.backdropElement?.classList.add('da-persona-transition-backdrop--visible');
      // Focus continue button for accessibility after element is visible
      this.continueButton?.focus();
    });

    // Announce to screen readers
    this.announceToScreenReader('Era transition opened');

    // Dispatch event
    window.dispatchEvent(new CustomEvent('transition-panel-opened', {
      detail: { transition: this.transitionData },
    }));
  }

  /**
   * Hide the panel.
   */
  hide(): void {
    if (!this.element || !this.backdropElement) return;

    // Remove visible classes first for animation
    this.element.classList.remove('da-persona-transition-panel--visible');
    this.backdropElement.classList.remove('da-persona-transition-backdrop--visible');

    // Wait for CSS transition to complete before hiding (Issue 2 fix: prevents race condition)
    const transitionDuration = 400; // Match CSS transition duration
    setTimeout(() => {
      this.element?.classList.add('da-hidden');
      this.backdropElement?.classList.add('da-hidden');
    }, transitionDuration);

    // Announce to screen readers
    this.announceToScreenReader('Era transition closed');

    // Dispatch event
    window.dispatchEvent(new CustomEvent('transition-panel-closed', {
      detail: { transition: this.transitionData },
    }));
  }

  /**
   * Check if the panel is currently visible.
   * Checks for --visible class since hide() uses a delayed timeout for da-hidden.
   */
  isVisible(): boolean {
    if (!this.element) return false;
    return this.element.classList.contains('da-persona-transition-panel--visible');
  }

  /**
   * Announce a message to screen readers via aria-live region.
   */
  private announceToScreenReader(message: string): void {
    if (this.liveRegion) {
      this.liveRegion.textContent = message;
    }
  }

  /**
   * Handle keydown events.
   */
  private handleKeydown(e: KeyboardEvent): void {
    if (!this.isVisible()) return;

    if (e.key === 'Escape' && this.options.allowEscapeClose) {
      this.hide();
    } else if (e.key === 'Tab') {
      // Focus trap - keep focus on continue button
      this.handleFocusTrap(e);
    }
  }

  /**
   * Trap focus inside the modal when open.
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
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  }

  /**
   * Handle continue button click.
   */
  private handleContinueClick(): void {
    if (this.onContinueCallback) {
      this.onContinueCallback();
    }
    this.hide();
  }

  /**
   * Update all displayed values based on current data.
   */
  private updateDisplay(): void {
    if (!this.transitionData || !this.outgoingPersona || !this.incomingPersona) return;

    // Outgoing persona
    if (this.outgoingAvatarElement) {
      this.outgoingAvatarElement.textContent = this.outgoingPersona.avatar;
    }
    if (this.outgoingNameElement) {
      this.outgoingNameElement.textContent = this.outgoingPersona.name;
    }
    if (this.outgoingContributionElement) {
      this.outgoingContributionElement.textContent = this.outgoingPersona.keyContribution || '';
    }
    if (this.outgoingQuoteElement) {
      if (this.transitionData.outgoingQuote) {
        this.outgoingQuoteElement.textContent = `"${this.transitionData.outgoingQuote}"`;
        this.outgoingQuoteElement.classList.remove('da-hidden');
      } else {
        this.outgoingQuoteElement.textContent = '';
        this.outgoingQuoteElement.classList.add('da-hidden');
      }
    }

    // Timeline
    if (this.yearsElapsedElement) {
      this.yearsElapsedElement.textContent = `${this.transitionData.yearsElapsed} YEARS`;
    }
    if (this.outgoingEraElement) {
      this.outgoingEraElement.textContent = this.transitionData.outgoingEra;
    }
    if (this.incomingEraElement) {
      this.incomingEraElement.textContent = this.transitionData.incomingEra;
    }

    // Narrative (Issue 3 fix: use DocumentFragment to batch DOM insertions)
    if (this.narrativeContainer) {
      while (this.narrativeContainer.firstChild) {
        this.narrativeContainer.removeChild(this.narrativeContainer.firstChild);
      }
      const fragment = document.createDocumentFragment();
      for (const paragraph of this.transitionData.narrative) {
        const p = document.createElement('p');
        p.textContent = paragraph;
        fragment.appendChild(p);
      }
      this.narrativeContainer.appendChild(fragment);
    }

    // Incoming persona
    if (this.incomingAvatarElement) {
      this.incomingAvatarElement.textContent = this.incomingPersona.avatar;
    }
    if (this.incomingNameElement) {
      this.incomingNameElement.textContent = this.incomingPersona.name;
    }
    if (this.incomingEraValueElement) {
      this.incomingEraValueElement.textContent = `Era: ${this.incomingPersona.era}`;
    }
    if (this.incomingQuoteElement) {
      if (this.transitionData.incomingQuote) {
        this.incomingQuoteElement.textContent = `"${this.transitionData.incomingQuote}"`;
        this.incomingQuoteElement.classList.remove('da-hidden');
      } else {
        this.incomingQuoteElement.textContent = '';
        this.incomingQuoteElement.classList.add('da-hidden');
      }
    }
  }

  /**
   * Render the panel structure.
   */
  private render(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'da-persona-transition-panel da-hidden';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');

    // Generate unique ID for heading using counter (Issue 1 fix: avoids duplicate IDs)
    const headingId = `transition-heading-${++panelIdCounter}`;
    panel.setAttribute('aria-labelledby', headingId);

    // Heading
    const heading = document.createElement('h2');
    heading.className = 'da-transition-heading da-sr-only';
    heading.id = headingId;
    heading.textContent = 'Era Transition';

    // Outgoing persona section
    const outgoingSection = this.renderOutgoingSection();

    // Timeline section
    const timelineSection = this.renderTimelineSection();

    // Narrative section
    const narrativeSection = document.createElement('div');
    narrativeSection.className = 'da-transition-narrative';
    this.narrativeContainer = narrativeSection;

    // Incoming persona section
    const incomingSection = this.renderIncomingSection();

    // Continue button
    const continueButton = document.createElement('button');
    continueButton.className = 'da-transition-continue';
    continueButton.textContent = 'Continue Your Journey →';
    continueButton.setAttribute('aria-label', 'Continue to next era');
    continueButton.addEventListener('click', this.boundHandleContinueClick);
    this.continueButton = continueButton;

    // Assemble panel
    panel.appendChild(heading);
    panel.appendChild(outgoingSection);
    panel.appendChild(timelineSection);
    panel.appendChild(narrativeSection);
    panel.appendChild(incomingSection);
    panel.appendChild(continueButton);

    return panel;
  }

  /**
   * Render the outgoing persona section.
   */
  private renderOutgoingSection(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'da-transition-outgoing';

    const avatar = document.createElement('div');
    avatar.className = 'da-transition-outgoing-avatar';
    avatar.textContent = '👤';
    avatar.setAttribute('role', 'img');
    avatar.setAttribute('aria-label', 'Outgoing persona avatar');
    this.outgoingAvatarElement = avatar;

    const info = document.createElement('div');
    info.className = 'da-transition-outgoing-info';

    const name = document.createElement('h3');
    name.className = 'da-transition-outgoing-name';
    name.textContent = 'Outgoing Persona';
    this.outgoingNameElement = name;

    const contribution = document.createElement('p');
    contribution.className = 'da-transition-outgoing-contribution';
    this.outgoingContributionElement = contribution;

    const quote = document.createElement('blockquote');
    quote.className = 'da-transition-outgoing-quote';
    this.outgoingQuoteElement = quote;

    info.appendChild(name);
    info.appendChild(contribution);
    info.appendChild(quote);

    section.appendChild(avatar);
    section.appendChild(info);

    return section;
  }

  /**
   * Render the timeline section.
   */
  private renderTimelineSection(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'da-transition-timeline';
    section.setAttribute('aria-label', 'Timeline showing years elapsed between eras');

    const outgoingEra = document.createElement('span');
    outgoingEra.className = 'da-transition-era-outgoing';
    outgoingEra.textContent = 'Outgoing Era';
    this.outgoingEraElement = outgoingEra;

    const connector = document.createElement('div');
    connector.className = 'da-transition-timeline-connector';

    const yearsElapsed = document.createElement('span');
    yearsElapsed.className = 'da-transition-years-elapsed';
    yearsElapsed.textContent = '0 YEARS';
    this.yearsElapsedElement = yearsElapsed;

    connector.appendChild(yearsElapsed);

    const incomingEra = document.createElement('span');
    incomingEra.className = 'da-transition-era-incoming';
    incomingEra.textContent = 'Incoming Era';
    this.incomingEraElement = incomingEra;

    section.appendChild(outgoingEra);
    section.appendChild(connector);
    section.appendChild(incomingEra);

    return section;
  }

  /**
   * Render the incoming persona section.
   */
  private renderIncomingSection(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'da-transition-incoming';

    const avatar = document.createElement('div');
    avatar.className = 'da-transition-incoming-avatar';
    avatar.textContent = '👤';
    avatar.setAttribute('role', 'img');
    avatar.setAttribute('aria-label', 'Incoming persona avatar');
    this.incomingAvatarElement = avatar;

    const info = document.createElement('div');
    info.className = 'da-transition-incoming-info';

    const name = document.createElement('h3');
    name.className = 'da-transition-incoming-name';
    name.textContent = 'Incoming Persona';
    this.incomingNameElement = name;

    const era = document.createElement('span');
    era.className = 'da-transition-incoming-era';
    era.textContent = 'Era: Unknown';
    this.incomingEraValueElement = era;

    const quote = document.createElement('blockquote');
    quote.className = 'da-transition-incoming-quote';
    this.incomingQuoteElement = quote;

    info.appendChild(name);
    info.appendChild(era);
    info.appendChild(quote);

    section.appendChild(avatar);
    section.appendChild(info);

    return section;
  }

  /**
   * Destroy the component and clean up resources.
   */
  destroy(): void {
    // Remove event listeners
    document.removeEventListener('keydown', this.boundHandleKeydown);

    if (this.continueButton) {
      this.continueButton.removeEventListener('click', this.boundHandleContinueClick);
      this.continueButton = null;
    }

    if (this.backdropElement) {
      this.backdropElement.remove();
      this.backdropElement = null;
    }

    if (this.element) {
      this.element.remove();
      this.element = null;
    }

    if (this.liveRegion) {
      this.liveRegion.remove();
      this.liveRegion = null;
    }

    this.container = null;
    this.transitionData = null;
    this.outgoingPersona = null;
    this.incomingPersona = null;
    this.onContinueCallback = null;

    // Clear element references
    this.outgoingAvatarElement = null;
    this.outgoingNameElement = null;
    this.outgoingContributionElement = null;
    this.outgoingQuoteElement = null;
    this.yearsElapsedElement = null;
    this.outgoingEraElement = null;
    this.incomingEraElement = null;
    this.narrativeContainer = null;
    this.incomingAvatarElement = null;
    this.incomingNameElement = null;
    this.incomingEraValueElement = null;
    this.incomingQuoteElement = null;
  }
}
