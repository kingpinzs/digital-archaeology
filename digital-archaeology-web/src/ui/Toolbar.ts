// src/ui/Toolbar.ts
// Toolbar component with action buttons for the Digital Archaeology IDE

/**
 * Toolbar button state configuration.
 * Controls which buttons are enabled/disabled and visibility toggles.
 */
export interface ToolbarState {
  /** Can the Assemble button be clicked */
  canAssemble: boolean;
  /** Can the Run button be clicked */
  canRun: boolean;
  /** Can the Pause button be clicked */
  canPause: boolean;
  /** Can the Reset button be clicked */
  canReset: boolean;
  /** Can the Step button be clicked */
  canStep: boolean;
  /** Is execution currently running (toggles Run/Pause visibility) */
  isRunning: boolean;
  /** Current execution speed (1-100) */
  speed: number;
}

/**
 * Callback handlers for toolbar button actions.
 */
export interface ToolbarCallbacks {
  /** Called when File dropdown trigger is clicked */
  onFileClick: () => void;
  /** Called when Assemble button is clicked */
  onAssembleClick: () => void;
  /** Called when Run button is clicked */
  onRunClick: () => void;
  /** Called when Pause button is clicked */
  onPauseClick: () => void;
  /** Called when Reset button is clicked */
  onResetClick: () => void;
  /** Called when Step button is clicked */
  onStepClick: () => void;
  /** Called when speed slider value changes */
  onSpeedChange: (speed: number) => void;
  /** Called when Help button is clicked */
  onHelpClick: () => void;
  /** Called when Settings button is clicked */
  onSettingsClick: () => void;
}

/**
 * Toolbar component that provides action buttons for the IDE.
 * Manages button states and dispatches callbacks on user interaction.
 */
export class Toolbar {
  private element: HTMLElement | null = null;
  private state: ToolbarState;
  private callbacks: ToolbarCallbacks;

  // Cached button references for state updates
  private buttons: Map<string, HTMLButtonElement> = new Map();
  private speedSlider: HTMLInputElement | null = null;
  private speedLabel: HTMLElement | null = null;

  // Bound event handlers for proper cleanup
  private buttonClickHandlers: Map<string, () => void> = new Map();
  private boundSliderHandler: ((e: Event) => void) | null = null;
  private boundKeydownHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(callbacks: ToolbarCallbacks) {
    this.callbacks = callbacks;
    this.state = {
      canAssemble: false,
      canRun: false,
      canPause: false,
      canReset: false,
      canStep: false,
      isRunning: false,
      speed: 50,
    };
  }

  /**
   * Mount the toolbar to a container element.
   * @param container - The element to mount the toolbar into
   */
  mount(container: HTMLElement): void {
    this.element = this.render();
    container.appendChild(this.element);
    this.cacheElements();
    this.attachEventListeners();
    this.updateButtonStates();
    this.updateSliderAriaValues();
  }

  /**
   * Update the toolbar state.
   * @param newState - Partial state to merge with current state
   */
  updateState(newState: Partial<ToolbarState>): void {
    this.state = { ...this.state, ...newState };
    this.updateButtonStates();
  }

  /**
   * Get current toolbar state.
   * @returns Current state object
   */
  getState(): ToolbarState {
    return { ...this.state };
  }

  /**
   * Destroy the toolbar and clean up resources.
   */
  destroy(): void {
    // Remove button click handlers
    this.buttons.forEach((btn, action) => {
      const handler = this.buttonClickHandlers.get(action);
      if (handler) {
        btn.removeEventListener('click', handler);
      }
    });
    this.buttonClickHandlers.clear();

    // Remove slider handler
    if (this.speedSlider && this.boundSliderHandler) {
      this.speedSlider.removeEventListener('input', this.boundSliderHandler);
      this.boundSliderHandler = null;
    }

    // Remove keyboard handler
    if (this.element && this.boundKeydownHandler) {
      this.element.removeEventListener('keydown', this.boundKeydownHandler);
      this.boundKeydownHandler = null;
    }

    // Remove element from DOM
    if (this.element) {
      this.element.remove();
      this.element = null;
    }

    this.buttons.clear();
    this.speedSlider = null;
    this.speedLabel = null;
  }

  /**
   * Render the toolbar HTML structure.
   * @returns The toolbar element
   */
  private render(): HTMLElement {
    const toolbar = document.createElement('div');
    toolbar.className = 'da-toolbar-content';
    toolbar.setAttribute('role', 'toolbar');
    toolbar.setAttribute('aria-label', 'Main toolbar');

    toolbar.innerHTML = `
      <div class="da-toolbar-group da-toolbar-group--left">
        <button class="da-toolbar-btn" data-action="file" aria-label="Open file menu" title="File menu">
          <span class="da-toolbar-btn-icon">📁</span><span class="da-toolbar-btn-caret">▾</span>
        </button>
      </div>

      <div class="da-toolbar-group da-toolbar-group--center">
        <button class="da-toolbar-btn da-toolbar-btn--primary" data-action="assemble" aria-label="Assemble code" title="Assemble (Ctrl+Enter)" disabled>
          <span class="da-toolbar-btn-icon">⚡</span><span class="da-toolbar-btn-text">Assemble</span>
        </button>

        <div class="da-toolbar-divider"></div>

        <button class="da-toolbar-btn" data-action="run" aria-label="Run program" title="Run (F5)" aria-pressed="false" disabled>
          <span class="da-toolbar-btn-icon">▶</span><span class="da-toolbar-btn-text">Run</span>
        </button>
        <button class="da-toolbar-btn" data-action="pause" aria-label="Pause execution" title="Pause (F5)" aria-pressed="false" hidden disabled>
          <span class="da-toolbar-btn-icon">⏸</span>
        </button>
        <button class="da-toolbar-btn" data-action="reset" aria-label="Reset program" title="Reset (Shift+F5)" disabled>
          <span class="da-toolbar-btn-icon">⏹</span><span class="da-toolbar-btn-text">Reset</span>
        </button>
        <button class="da-toolbar-btn" data-action="step" aria-label="Step one instruction" title="Step (F10)" disabled>
          <span class="da-toolbar-btn-icon">⏭</span><span class="da-toolbar-btn-text">Step</span>
        </button>
      </div>

      <div class="da-toolbar-group da-toolbar-group--right">
        <div class="da-speed-control">
          <input
            type="range"
            class="da-speed-slider"
            min="1"
            max="100"
            value="50"
            aria-label="Execution speed"
            title="Execution speed"
          />
          <span class="da-speed-label">50</span>
        </div>

        <div class="da-toolbar-divider"></div>

        <button class="da-toolbar-btn da-toolbar-btn--icon" data-action="help" aria-label="Help" title="Help (F1)">
          <span class="da-toolbar-btn-icon">?</span>
        </button>
        <button class="da-toolbar-btn da-toolbar-btn--icon" data-action="settings" aria-label="Settings" title="Settings">
          <span class="da-toolbar-btn-icon">⚙</span>
        </button>
      </div>
    `;

    return toolbar;
  }

  /**
   * Cache element references for efficient state updates.
   */
  private cacheElements(): void {
    if (!this.element) return;

    // Cache all buttons by their action
    const buttonElements = this.element.querySelectorAll<HTMLButtonElement>('button[data-action]');
    buttonElements.forEach(btn => {
      const action = btn.getAttribute('data-action');
      if (action) {
        this.buttons.set(action, btn);
      }
    });

    // Cache speed slider and label
    this.speedSlider = this.element.querySelector('.da-speed-slider');
    this.speedLabel = this.element.querySelector('.da-speed-label');
  }

  /**
   * Attach event listeners to toolbar elements.
   */
  private attachEventListeners(): void {
    // Button click handlers - store bound handlers for cleanup
    this.buttons.forEach((btn, action) => {
      const handler = () => this.handleButtonClick(action);
      this.buttonClickHandlers.set(action, handler);
      btn.addEventListener('click', handler);
    });

    // Speed slider handler
    if (this.speedSlider) {
      this.boundSliderHandler = (e: Event) => {
        const value = parseInt((e.target as HTMLInputElement).value, 10);
        this.state.speed = value;
        if (this.speedLabel) {
          this.speedLabel.textContent = String(value);
        }
        this.updateSliderAriaValues();
        this.callbacks.onSpeedChange(value);
      };
      this.speedSlider.addEventListener('input', this.boundSliderHandler);
    }

    // Keyboard navigation handler for toolbar
    if (this.element) {
      this.boundKeydownHandler = (e: KeyboardEvent) => this.handleKeydown(e);
      this.element.addEventListener('keydown', this.boundKeydownHandler);
    }
  }

  /**
   * Handle keyboard navigation within toolbar.
   * Implements WAI-ARIA toolbar pattern with arrow key navigation.
   * @param e - Keyboard event
   */
  private handleKeydown(e: KeyboardEvent): void {
    const focusableButtons = Array.from(this.buttons.values()).filter(
      btn => !btn.hidden && !btn.disabled
    );

    if (focusableButtons.length === 0) return;

    const currentIndex = focusableButtons.findIndex(
      btn => btn === document.activeElement
    );

    let newIndex = currentIndex;

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        newIndex = currentIndex < focusableButtons.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'ArrowLeft':
        e.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : focusableButtons.length - 1;
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = focusableButtons.length - 1;
        break;
      default:
        return;
    }

    if (newIndex !== currentIndex && focusableButtons[newIndex]) {
      focusableButtons[newIndex].focus();
    }
  }

  /**
   * Handle button click events.
   * @param action - The button action identifier
   */
  private handleButtonClick(action: string): void {
    const btn = this.buttons.get(action);
    if (btn?.disabled) return;

    switch (action) {
      case 'file':
        this.callbacks.onFileClick();
        break;
      case 'assemble':
        this.callbacks.onAssembleClick();
        break;
      case 'run':
        this.callbacks.onRunClick();
        break;
      case 'pause':
        this.callbacks.onPauseClick();
        break;
      case 'reset':
        this.callbacks.onResetClick();
        break;
      case 'step':
        this.callbacks.onStepClick();
        break;
      case 'help':
        this.callbacks.onHelpClick();
        break;
      case 'settings':
        this.callbacks.onSettingsClick();
        break;
    }
  }

  /**
   * Update button states based on current state.
   */
  private updateButtonStates(): void {
    // Update disabled states
    this.setButtonDisabled('assemble', !this.state.canAssemble);
    this.setButtonDisabled('run', !this.state.canRun);
    this.setButtonDisabled('pause', !this.state.canPause);
    this.setButtonDisabled('reset', !this.state.canReset);
    this.setButtonDisabled('step', !this.state.canStep);

    // Toggle Run/Pause visibility based on isRunning
    const runBtn = this.buttons.get('run');
    const pauseBtn = this.buttons.get('pause');

    if (runBtn && pauseBtn) {
      runBtn.hidden = this.state.isRunning;
      pauseBtn.hidden = !this.state.isRunning;

      // Update aria-pressed for toggle state
      runBtn.setAttribute('aria-pressed', 'false');
      pauseBtn.setAttribute('aria-pressed', this.state.isRunning ? 'true' : 'false');
    }

    // Update speed slider and label
    if (this.speedSlider) {
      this.speedSlider.value = String(this.state.speed);
    }
    if (this.speedLabel) {
      this.speedLabel.textContent = String(this.state.speed);
    }
  }

  /**
   * Set a button's disabled state.
   * @param action - The button action identifier
   * @param disabled - Whether the button should be disabled
   */
  private setButtonDisabled(action: string, disabled: boolean): void {
    const btn = this.buttons.get(action);
    if (btn) {
      btn.disabled = disabled;
    }
  }

  /**
   * Update ARIA value attributes on the speed slider for screen readers.
   */
  private updateSliderAriaValues(): void {
    if (!this.speedSlider) return;

    this.speedSlider.setAttribute('aria-valuenow', String(this.state.speed));
    this.speedSlider.setAttribute('aria-valuemin', '1');
    this.speedSlider.setAttribute('aria-valuemax', '100');
  }
}
