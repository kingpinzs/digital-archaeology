// src/story/EnterLabButton.ts
// Enter the Lab button component for Story Mode
// Story 10.11: Create "Enter the Lab" Button

/**
 * EnterLabButton provides the transition from Story Mode to Lab Mode.
 * Features prominent styling with lightning bolt icon.
 *
 * Layout specification (from UX design):
 * - Container: Prominent button with gold accent
 * - Icon: Lightning bolt (⚡) indicating action
 * - Text: "Enter the Lab"
 * - Hover: Scale, glow effect
 */
export class EnterLabButton {
  private element: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private onClickCallback: (() => void) | null = null;

  // Bound handler for proper cleanup
  private boundHandleClick: (e: MouseEvent) => void;

  constructor() {
    this.boundHandleClick = this.handleClick.bind(this);
  }

  /**
   * Mount the button to a DOM element.
   * @param container - The HTML element to mount to
   */
  mount(container: HTMLElement): void {
    this.container = container;
    this.element = this.render();
    this.element.addEventListener('click', this.boundHandleClick);
    this.container.appendChild(this.element);
  }

  /**
   * Register a callback for when the button is clicked.
   * @param callback - Function called when button is clicked
   */
  onClick(callback: () => void): void {
    this.onClickCallback = callback;
  }

  /**
   * Handle click events on the button.
   */
  private handleClick(_e: MouseEvent): void {
    if (this.onClickCallback) {
      this.onClickCallback();
    }
  }

  /**
   * Render the button structure.
   * @returns The rendered button element
   */
  private render(): HTMLElement {
    const button = document.createElement('button');
    button.className = 'da-enter-lab-button';
    button.setAttribute('type', 'button');
    button.setAttribute('aria-label', 'Enter the Lab - switch to Lab Mode');

    // Icon (decorative, hidden from screen readers)
    const icon = document.createElement('span');
    icon.className = 'da-enter-lab-button-icon';
    icon.textContent = '⚡';
    icon.setAttribute('aria-hidden', 'true');

    // Text
    const text = document.createElement('span');
    text.className = 'da-enter-lab-button-text';
    text.textContent = 'Enter the Lab';

    button.appendChild(icon);
    button.appendChild(text);

    return button;
  }

  /**
   * Show the button.
   */
  show(): void {
    this.element?.classList.remove('da-enter-lab-button--hidden');
  }

  /**
   * Hide the button.
   */
  hide(): void {
    this.element?.classList.add('da-enter-lab-button--hidden');
  }

  /**
   * Check if the button is currently visible.
   * @returns true if visible and mounted, false otherwise
   */
  isVisible(): boolean {
    if (!this.element) return false;
    return !this.element.classList.contains('da-enter-lab-button--hidden');
  }

  /**
   * Get the root element.
   * @returns The button element or null if not mounted
   */
  getElement(): HTMLElement | null {
    return this.element;
  }

  /**
   * Destroy the component and clean up resources.
   */
  destroy(): void {
    if (this.element) {
      this.element.removeEventListener('click', this.boundHandleClick);
      this.element.remove();
      this.element = null;
    }
    this.container = null;
    this.onClickCallback = null;
  }
}
