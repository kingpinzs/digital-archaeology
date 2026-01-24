// src/story/StoryActionsFooter.ts
// Story Actions Footer component for Story Mode navigation
// Story 10.12: Create Story Actions Footer

/**
 * StoryActionsFooter provides navigation controls at the bottom of story content.
 * Contains Previous Scene, Enter Lab, and Continue buttons.
 *
 * Layout specification (from UX design):
 * - Container: Footer with border-top separator
 * - Layout: Flexbox with space-between
 * - Previous: Left, secondary style, can be disabled
 * - Enter Lab: Center, lab style (blue/cyan), can be hidden
 * - Continue: Right, primary style (gold), can be disabled
 */
export class StoryActionsFooter {
  private element: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private previousButton: HTMLButtonElement | null = null;
  private enterLabButton: HTMLButtonElement | null = null;
  private continueButton: HTMLButtonElement | null = null;

  private onPreviousCallback: (() => void) | null = null;
  private onContinueCallback: (() => void) | null = null;
  private onEnterLabCallback: (() => void) | null = null;

  private previousEnabled: boolean = true;
  private continueEnabled: boolean = true;

  // Bound handlers for proper cleanup
  private boundHandlePrevious: (e: MouseEvent) => void;
  private boundHandleContinue: (e: MouseEvent) => void;
  private boundHandleEnterLab: (e: MouseEvent) => void;

  constructor() {
    this.boundHandlePrevious = this.handlePrevious.bind(this);
    this.boundHandleContinue = this.handleContinue.bind(this);
    this.boundHandleEnterLab = this.handleEnterLab.bind(this);
  }

  /**
   * Mount the footer to a DOM element.
   * @param container - The HTML element to mount to
   */
  mount(container: HTMLElement): void {
    this.container = container;
    this.element = this.render();
    this.attachEventListeners();
    this.container.appendChild(this.element);
  }

  /**
   * Attach click event listeners to all buttons.
   */
  private attachEventListeners(): void {
    this.previousButton?.addEventListener('click', this.boundHandlePrevious);
    this.continueButton?.addEventListener('click', this.boundHandleContinue);
    this.enterLabButton?.addEventListener('click', this.boundHandleEnterLab);
  }

  /**
   * Register a callback for when Previous button is clicked.
   * @param callback - Function called when button is clicked (if enabled)
   */
  onPrevious(callback: () => void): void {
    this.onPreviousCallback = callback;
  }

  /**
   * Register a callback for when Continue button is clicked.
   * @param callback - Function called when button is clicked (if enabled)
   */
  onContinue(callback: () => void): void {
    this.onContinueCallback = callback;
  }

  /**
   * Register a callback for when Enter Lab button is clicked.
   * @param callback - Function called when button is clicked
   */
  onEnterLab(callback: () => void): void {
    this.onEnterLabCallback = callback;
  }

  /**
   * Handle Previous button click.
   */
  private handlePrevious(_e: MouseEvent): void {
    if (this.previousEnabled && this.onPreviousCallback) {
      this.onPreviousCallback();
    }
  }

  /**
   * Handle Continue button click.
   */
  private handleContinue(_e: MouseEvent): void {
    if (this.continueEnabled && this.onContinueCallback) {
      this.onContinueCallback();
    }
  }

  /**
   * Handle Enter Lab button click.
   */
  private handleEnterLab(_e: MouseEvent): void {
    if (this.onEnterLabCallback) {
      this.onEnterLabCallback();
    }
  }

  /**
   * Enable or disable the Previous button.
   * @param enabled - Whether the button should be enabled
   */
  setPreviousEnabled(enabled: boolean): void {
    this.previousEnabled = enabled;
    if (this.previousButton) {
      this.previousButton.disabled = !enabled;
      this.previousButton.setAttribute('aria-disabled', String(!enabled));
      this.previousButton.classList.toggle('da-story-action-btn--disabled', !enabled);
    }
  }

  /**
   * Enable or disable the Continue button.
   * @param enabled - Whether the button should be enabled
   */
  setContinueEnabled(enabled: boolean): void {
    this.continueEnabled = enabled;
    if (this.continueButton) {
      this.continueButton.disabled = !enabled;
      this.continueButton.setAttribute('aria-disabled', String(!enabled));
      this.continueButton.classList.toggle('da-story-action-btn--disabled', !enabled);
    }
  }

  /**
   * Show or hide the Enter Lab button.
   * @param visible - Whether the button should be visible
   */
  setEnterLabVisible(visible: boolean): void {
    if (this.enterLabButton) {
      this.enterLabButton.classList.toggle('da-story-action-btn--hidden', !visible);
    }
  }

  /**
   * Render the footer structure.
   * @returns The rendered footer element
   */
  private render(): HTMLElement {
    const footer = document.createElement('footer');
    footer.className = 'da-story-actions-footer';
    footer.setAttribute('role', 'navigation');
    footer.setAttribute('aria-label', 'Story navigation');

    // Previous Scene button
    this.previousButton = this.createButton(
      '←',
      'Previous Scene',
      'da-story-action-btn',
      'Go to previous scene'
    );

    // Enter Lab button
    this.enterLabButton = this.createButton(
      '⚡',
      'Enter the Lab',
      'da-story-action-btn da-story-action-btn--lab',
      'Enter the Lab - switch to Lab Mode'
    );

    // Continue button
    this.continueButton = this.createButton(
      '→',
      'Continue',
      'da-story-action-btn da-story-action-btn--primary',
      'Continue to next scene',
      true // Icon after text
    );

    footer.appendChild(this.previousButton);
    footer.appendChild(this.enterLabButton);
    footer.appendChild(this.continueButton);

    return footer;
  }

  /**
   * Create a button element with icon and text.
   * @param icon - The icon character
   * @param text - The button text
   * @param className - CSS class names
   * @param ariaLabel - Accessibility label
   * @param iconAfter - Whether icon comes after text (default: before)
   * @returns The created button element
   */
  private createButton(
    icon: string,
    text: string,
    className: string,
    ariaLabel: string,
    iconAfter: boolean = false
  ): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = className;
    button.setAttribute('type', 'button');
    button.setAttribute('aria-label', ariaLabel);

    // Icon element (decorative)
    const iconSpan = document.createElement('span');
    iconSpan.className = 'da-story-action-btn-icon';
    iconSpan.textContent = icon;
    iconSpan.setAttribute('aria-hidden', 'true');

    // Text element
    const textSpan = document.createElement('span');
    textSpan.className = 'da-story-action-btn-text';
    textSpan.textContent = text;

    if (iconAfter) {
      button.appendChild(textSpan);
      button.appendChild(iconSpan);
    } else {
      button.appendChild(iconSpan);
      button.appendChild(textSpan);
    }

    return button;
  }

  /**
   * Show the footer.
   */
  show(): void {
    this.element?.classList.remove('da-story-actions-footer--hidden');
  }

  /**
   * Hide the footer.
   */
  hide(): void {
    this.element?.classList.add('da-story-actions-footer--hidden');
  }

  /**
   * Check if the footer is currently visible.
   * @returns true if visible and mounted, false otherwise
   */
  isVisible(): boolean {
    if (!this.element) return false;
    return !this.element.classList.contains('da-story-actions-footer--hidden');
  }

  /**
   * Get the root element.
   * @returns The footer element or null if not mounted
   */
  getElement(): HTMLElement | null {
    return this.element;
  }

  /**
   * Destroy the component and clean up resources.
   */
  destroy(): void {
    if (this.previousButton) {
      this.previousButton.removeEventListener('click', this.boundHandlePrevious);
    }
    if (this.continueButton) {
      this.continueButton.removeEventListener('click', this.boundHandleContinue);
    }
    if (this.enterLabButton) {
      this.enterLabButton.removeEventListener('click', this.boundHandleEnterLab);
    }
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    this.previousButton = null;
    this.enterLabButton = null;
    this.continueButton = null;
    this.container = null;
    this.onPreviousCallback = null;
    this.onContinueCallback = null;
    this.onEnterLabCallback = null;
  }
}
