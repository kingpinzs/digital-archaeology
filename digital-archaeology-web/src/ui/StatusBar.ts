// src/ui/StatusBar.ts
// Status bar component showing assembly status, PC, instruction, cycle count, and speed

/**
 * Assembly status type for the status bar.
 */
export type AssemblyStatus = 'none' | 'assembling' | 'success' | 'error';

/**
 * Cursor position for editor integration.
 * @remarks This field is included in StatusBarState for Story 2.5 (Display Cursor Position in Status Bar).
 * The UI section for cursor position will be added in that story.
 */
export interface CursorPosition {
  line: number;
  column: number;
}

/**
 * State interface for the StatusBar component.
 */
export interface StatusBarState {
  assemblyStatus: AssemblyStatus;
  assemblyMessage: string | null;
  pcValue: number | null;
  nextInstruction: string | null;
  cycleCount: number;
  speed: number | null;
  cursorPosition: CursorPosition | null;
}

/**
 * Escape HTML special characters to prevent XSS attacks.
 * @param text - The text to escape
 * @returns The escaped text safe for use in HTML
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * StatusBar component displays current application state.
 * Shows assembly status, PC value, next instruction, cycle count, and execution speed.
 */
export class StatusBar {
  private element: HTMLElement | null = null;
  private state: StatusBarState;

  // Section element references for efficient updates
  private assemblySection: HTMLElement | null = null;
  private pcSection: HTMLElement | null = null;
  private instructionSection: HTMLElement | null = null;
  private cycleSection: HTMLElement | null = null;
  private speedSection: HTMLElement | null = null;

  constructor() {
    this.state = {
      assemblyStatus: 'none',
      assemblyMessage: null,
      pcValue: null,
      nextInstruction: null,
      cycleCount: 0,
      speed: null,
      cursorPosition: null,
    };
  }

  /**
   * Mount the status bar to a container element.
   */
  mount(container: HTMLElement): void {
    this.element = this.render();
    container.appendChild(this.element);
    this.cacheElements();
    this.updateUI();
  }

  /**
   * Update the status bar state and refresh the UI.
   */
  updateState(newState: Partial<StatusBarState>): void {
    this.state = { ...this.state, ...newState };
    this.updateUI();
  }

  /**
   * Get a deep copy of the current state.
   */
  getState(): StatusBarState {
    return {
      ...this.state,
      cursorPosition: this.state.cursorPosition
        ? { ...this.state.cursorPosition }
        : null,
    };
  }

  /**
   * Destroy the component and clean up resources.
   */
  destroy(): void {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    this.assemblySection = null;
    this.pcSection = null;
    this.instructionSection = null;
    this.cycleSection = null;
    this.speedSection = null;
  }

  /**
   * Render the status bar HTML structure.
   */
  private render(): HTMLElement {
    const statusBar = document.createElement('div');
    statusBar.className = 'da-statusbar-content';

    // Assembly status section
    const assemblySection = this.createSection('assembly', 'Assembly status');
    statusBar.appendChild(assemblySection);

    // Separator
    statusBar.appendChild(this.createSeparator());

    // PC value section
    const pcSection = this.createSection('pc', 'Program counter');
    statusBar.appendChild(pcSection);

    // Separator
    statusBar.appendChild(this.createSeparator());

    // Next instruction section
    const instructionSection = this.createSection('instruction', 'Next instruction');
    statusBar.appendChild(instructionSection);

    // Separator
    statusBar.appendChild(this.createSeparator());

    // Cycle count section
    const cycleSection = this.createSection('cycle', 'Cycle count');
    statusBar.appendChild(cycleSection);

    // Separator
    statusBar.appendChild(this.createSeparator());

    // Speed section
    const speedSection = this.createSection('speed', 'Execution speed');
    statusBar.appendChild(speedSection);

    return statusBar;
  }

  /**
   * Create a section element with the given data-section attribute.
   */
  private createSection(name: string, ariaLabel: string): HTMLElement {
    const section = document.createElement('span');
    section.className = 'da-statusbar-section';
    section.setAttribute('data-section', name);
    section.setAttribute('aria-label', ariaLabel);
    return section;
  }

  /**
   * Create a separator element.
   */
  private createSeparator(): HTMLElement {
    const separator = document.createElement('span');
    separator.className = 'da-statusbar-separator';
    separator.setAttribute('aria-hidden', 'true');
    separator.textContent = '│';
    return separator;
  }

  /**
   * Cache element references for efficient updates.
   */
  private cacheElements(): void {
    if (!this.element) return;

    this.assemblySection = this.element.querySelector('[data-section="assembly"]');
    this.pcSection = this.element.querySelector('[data-section="pc"]');
    this.instructionSection = this.element.querySelector('[data-section="instruction"]');
    this.cycleSection = this.element.querySelector('[data-section="cycle"]');
    this.speedSection = this.element.querySelector('[data-section="speed"]');
  }

  /**
   * Update the UI based on current state.
   */
  private updateUI(): void {
    this.updateAssemblySection();
    this.updatePCSection();
    this.updateInstructionSection();
    this.updateCycleSection();
    this.updateSpeedSection();
  }

  /**
   * Update the assembly status section.
   */
  private updateAssemblySection(): void {
    if (!this.assemblySection) return;

    const { assemblyStatus, assemblyMessage } = this.state;
    let text: string;
    let statusClass: string;

    // Escape assemblyMessage to prevent XSS attacks
    const safeMessage = assemblyMessage ? escapeHtml(assemblyMessage) : '';

    switch (assemblyStatus) {
      case 'none':
        text = 'Ready';
        statusClass = 'da-statusbar-status--none';
        break;
      case 'assembling':
        text = 'Assembling...';
        statusClass = 'da-statusbar-status--assembling';
        break;
      case 'success':
        text = `✓ Assembled: ${safeMessage}`;
        statusClass = 'da-statusbar-status--success';
        break;
      case 'error':
        text = `✗ ${safeMessage || 'Error'}`;
        statusClass = 'da-statusbar-status--error';
        break;
    }

    this.assemblySection.innerHTML = `<span class="da-statusbar-value ${statusClass}">${text}</span>`;
  }

  /**
   * Update the PC value section.
   */
  private updatePCSection(): void {
    if (!this.pcSection) return;

    const { pcValue } = this.state;
    if (pcValue === null) {
      this.pcSection.innerHTML = '<span class="da-statusbar-label">PC:</span> <span class="da-statusbar-value">--</span>';
    } else {
      // Convert to unsigned 32-bit integer to handle negative values correctly
      // Use dynamic padding based on value magnitude (minimum 2 digits for readability)
      const unsignedValue = pcValue >>> 0;
      const hexString = unsignedValue.toString(16).toUpperCase();
      // Pad to at least 2 digits, but allow larger values to display fully
      const paddedHex = hexString.length < 2 ? hexString.padStart(2, '0') : hexString;
      const hexValue = `0x${paddedHex}`;
      this.pcSection.innerHTML = `<span class="da-statusbar-label">PC:</span> <span class="da-statusbar-value">${hexValue}</span>`;
    }
  }

  /**
   * Update the next instruction section.
   */
  private updateInstructionSection(): void {
    if (!this.instructionSection) return;

    const { nextInstruction } = this.state;
    // Escape instruction text to prevent XSS attacks
    const value = nextInstruction ? escapeHtml(nextInstruction) : '--';
    this.instructionSection.innerHTML = `<span class="da-statusbar-label">Next:</span> <span class="da-statusbar-value">${value}</span>`;
  }

  /**
   * Update the cycle count section.
   */
  private updateCycleSection(): void {
    if (!this.cycleSection) return;

    const { cycleCount } = this.state;
    this.cycleSection.innerHTML = `<span class="da-statusbar-label">Cycle:</span> <span class="da-statusbar-value">${cycleCount}</span>`;
  }

  /**
   * Update the speed section.
   */
  private updateSpeedSection(): void {
    if (!this.speedSection) return;

    const { speed } = this.state;
    if (speed === null) {
      this.speedSection.innerHTML = '<span class="da-statusbar-label">Speed:</span> <span class="da-statusbar-value">--</span>';
    } else {
      this.speedSection.innerHTML = `<span class="da-statusbar-label">Speed:</span> <span class="da-statusbar-value">${speed}Hz</span>`;
    }
  }
}
