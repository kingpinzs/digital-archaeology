// src/story/ChapterTransitionPanel.ts
// Lighter transition panel for between-chapter time-travel bridges
// Displays era shift, narrative bridge, chapter summary, and "Travel Forward in Time" button

import type { SceneTransitionData } from './content-types';

/** Counter for generating unique IDs across all ChapterTransitionPanel instances */
let panelIdCounter = 0;

/**
 * ChapterTransitionPanel displays a lighter narrative bridge between chapters.
 * Shows a "time passing" narrative, chapter completion summary, visual time
 * indicator, and a "Travel Forward in Time" button.
 *
 * Design mirrors PersonaTransitionPanel's accessibility approach:
 * dialog role, aria-modal, focus trap on continue button.
 */
export class ChapterTransitionPanel {
  private element: HTMLElement | null = null;
  private backdropElement: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private transitionData: SceneTransitionData | null = null;

  // Element references for dynamic updates
  private outgoingEraElement: HTMLElement | null = null;
  private incomingEraElement: HTMLElement | null = null;
  private yearsElapsedElement: HTMLElement | null = null;
  private narrativeContainer: HTMLElement | null = null;
  private summaryContainer: HTMLElement | null = null;
  private summaryTitleElement: HTMLElement | null = null;
  private summaryConceptsElement: HTMLElement | null = null;
  private continueButton: HTMLElement | null = null;
  private liveRegion: HTMLElement | null = null;

  // Callback for continue button
  private onContinueCallback: (() => void) | null = null;

  // Bound event handlers for cleanup
  private boundHandleKeydown: (e: KeyboardEvent) => void;
  private boundHandleContinueClick: (e: MouseEvent) => void;

  constructor() {
    this.boundHandleKeydown = this.handleKeydown.bind(this);
    this.boundHandleContinueClick = this.handleContinueClick.bind(this);
  }

  /**
   * Mount the panel to a DOM element.
   */
  mount(container: HTMLElement): void {
    this.container = container;

    // Create backdrop
    this.backdropElement = document.createElement('div');
    this.backdropElement.className = 'da-chapter-transition-backdrop';
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
    if (this.transitionData) {
      this.updateDisplay();
    }
  }

  /**
   * Set the transition data.
   */
  setTransitionData(data: SceneTransitionData): void {
    this.transitionData = data;
    this.updateDisplay();
  }

  /**
   * Set callback for when Continue button is clicked.
   */
  onContinue(callback: () => void): void {
    this.onContinueCallback = callback;
  }

  /**
   * Show the panel.
   */
  show(): void {
    this.element?.classList.add('da-chapter-transition-panel--visible');
    this.backdropElement?.classList.add('da-chapter-transition-backdrop--visible');

    // Focus continue button for accessibility
    requestAnimationFrame(() => {
      this.continueButton?.focus();
    });

    // Announce to screen readers
    if (this.liveRegion) {
      this.liveRegion.textContent = 'Chapter transition opened';
    }
  }

  /**
   * Hide the panel.
   */
  hide(): void {
    this.element?.classList.remove('da-chapter-transition-panel--visible');
    this.backdropElement?.classList.remove('da-chapter-transition-backdrop--visible');

    if (this.liveRegion) {
      this.liveRegion.textContent = 'Chapter transition closed';
    }
  }

  /**
   * Check if the panel is currently visible.
   */
  isVisible(): boolean {
    if (!this.element) return false;
    return this.element.classList.contains('da-chapter-transition-panel--visible');
  }

  /**
   * Handle keydown events - focus trap only (no escape close, transitions are mandatory).
   */
  private handleKeydown(e: KeyboardEvent): void {
    if (!this.isVisible()) return;

    if (e.key === 'Tab') {
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
    if (!this.transitionData) return;

    if (this.outgoingEraElement) {
      this.outgoingEraElement.textContent = this.transitionData.outgoingEra;
    }
    if (this.incomingEraElement) {
      this.incomingEraElement.textContent = this.transitionData.incomingEra;
    }
    if (this.yearsElapsedElement) {
      const years = this.transitionData.yearsElapsed;
      this.yearsElapsedElement.textContent = years >= 1000
        ? `${(years / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}k years pass...`
        : `${years.toLocaleString()} years pass...`;
    }

    // Narrative paragraphs
    if (this.narrativeContainer) {
      while (this.narrativeContainer.firstChild) {
        this.narrativeContainer.removeChild(this.narrativeContainer.firstChild);
      }
      const fragment = document.createDocumentFragment();
      for (const paragraph of this.transitionData.narrative) {
        const p = document.createElement('p');
        p.className = 'da-chapter-transition-narrative-text';
        p.textContent = paragraph;
        fragment.appendChild(p);
      }
      this.narrativeContainer.appendChild(fragment);
    }

    // Summary section
    if (this.summaryContainer && this.transitionData.summary) {
      this.summaryContainer.classList.remove('da-hidden');
      if (this.summaryTitleElement) {
        this.summaryTitleElement.textContent = this.transitionData.summary.chapterTitle;
      }
      if (this.summaryConceptsElement) {
        while (this.summaryConceptsElement.firstChild) {
          this.summaryConceptsElement.removeChild(this.summaryConceptsElement.firstChild);
        }
        for (const concept of this.transitionData.summary.concepts) {
          const li = document.createElement('li');
          li.className = 'da-chapter-transition-concept';
          li.textContent = concept;
          this.summaryConceptsElement.appendChild(li);
        }
      }
    } else if (this.summaryContainer) {
      this.summaryContainer.classList.add('da-hidden');
    }
  }

  /**
   * Render the panel structure.
   */
  private render(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'da-chapter-transition-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');

    const headingId = `chapter-transition-heading-${++panelIdCounter}`;
    panel.setAttribute('aria-labelledby', headingId);

    // Heading (screen-reader only)
    const heading = document.createElement('h2');
    heading.className = 'da-chapter-transition-heading da-sr-only';
    heading.id = headingId;
    heading.textContent = 'Chapter Transition';

    // Timeline section
    const timeline = this.renderTimeline();

    // Narrative section
    const narrativeSection = document.createElement('div');
    narrativeSection.className = 'da-chapter-transition-narrative';
    this.narrativeContainer = narrativeSection;

    // Summary section
    const summarySection = this.renderSummary();

    // Continue button
    const continueButton = document.createElement('button');
    continueButton.className = 'da-chapter-transition-continue';
    continueButton.textContent = 'Travel Forward in Time \u2192';
    continueButton.setAttribute('aria-label', 'Travel forward in time to next chapter');
    continueButton.addEventListener('click', this.boundHandleContinueClick);
    this.continueButton = continueButton;

    // Assemble panel
    panel.appendChild(heading);
    panel.appendChild(timeline);
    panel.appendChild(narrativeSection);
    panel.appendChild(summarySection);
    panel.appendChild(continueButton);

    return panel;
  }

  /**
   * Render the timeline section showing era shift and years elapsed.
   */
  private renderTimeline(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'da-chapter-transition-timeline';
    section.setAttribute('aria-label', 'Timeline showing passage between eras');

    const outgoingEra = document.createElement('span');
    outgoingEra.className = 'da-chapter-transition-era-outgoing';
    outgoingEra.textContent = '';
    this.outgoingEraElement = outgoingEra;

    const connector = document.createElement('div');
    connector.className = 'da-chapter-transition-connector';

    const yearsElapsed = document.createElement('span');
    yearsElapsed.className = 'da-chapter-transition-years';
    yearsElapsed.textContent = '';
    this.yearsElapsedElement = yearsElapsed;

    connector.appendChild(yearsElapsed);

    const incomingEra = document.createElement('span');
    incomingEra.className = 'da-chapter-transition-era-incoming';
    incomingEra.textContent = '';
    this.incomingEraElement = incomingEra;

    section.appendChild(outgoingEra);
    section.appendChild(connector);
    section.appendChild(incomingEra);

    return section;
  }

  /**
   * Render the chapter summary section.
   */
  private renderSummary(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'da-chapter-transition-summary da-hidden';
    this.summaryContainer = section;

    const label = document.createElement('span');
    label.className = 'da-chapter-transition-summary-label';
    label.textContent = 'Chapter Complete:';

    const title = document.createElement('span');
    title.className = 'da-chapter-transition-summary-title';
    this.summaryTitleElement = title;

    const concepts = document.createElement('ul');
    concepts.className = 'da-chapter-transition-concepts';
    this.summaryConceptsElement = concepts;

    section.appendChild(label);
    section.appendChild(title);
    section.appendChild(concepts);

    return section;
  }

  /**
   * Destroy the component and clean up resources.
   */
  destroy(): void {
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
    this.onContinueCallback = null;
    this.outgoingEraElement = null;
    this.incomingEraElement = null;
    this.yearsElapsedElement = null;
    this.narrativeContainer = null;
    this.summaryContainer = null;
    this.summaryTitleElement = null;
    this.summaryConceptsElement = null;
  }
}
