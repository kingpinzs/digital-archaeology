// src/visualizer/SignalValuesPanel.ts
// Signal values display panel component (Story 6.11)

import type { CircuitModel } from './CircuitModel';
import { formatSignalLabel, formatWireValue, statesEqual } from './signalFormatters';

/**
 * Signal definition for display configuration.
 */
export interface SignalDefinition {
  /** Wire name in circuit data */
  name: string;
  /** Optional custom label override */
  label?: string;
}

/**
 * Options for SignalValuesPanel configuration.
 */
export interface SignalValuesPanelOptions {
  /** Custom list of signals to display (overrides default) */
  signals?: SignalDefinition[];
  /** Whether to show control signals section (default: true) */
  showControlSignals?: boolean;
  /** Whether control signals section starts collapsed (default: true) */
  controlSignalsCollapsed?: boolean;
}

/**
 * Default register signals to display.
 */
const DEFAULT_REGISTER_SIGNALS: SignalDefinition[] = [
  { name: 'pc' },
  { name: 'acc' },
  { name: 'mar' },
  { name: 'mdr' },
  { name: 'ir' },
  { name: 'opcode' },
  { name: 'z_flag' },
];

/**
 * Default control signals to display.
 */
const DEFAULT_CONTROL_SIGNALS: SignalDefinition[] = [
  { name: 'pc_load' },
  { name: 'pc_inc' },
  { name: 'acc_load' },
  { name: 'z_load' },
  { name: 'ir_load' },
  { name: 'mar_load' },
  { name: 'mdr_load' },
];

/**
 * Timeout for clearing change highlights (ms).
 */
const CHANGE_HIGHLIGHT_DURATION = 500;

/**
 * Panel component for displaying circuit signal values.
 * Shows registers and control signals with change highlighting.
 */
export class SignalValuesPanel {
  private container: HTMLElement | null = null;
  private options: SignalValuesPanelOptions;
  private previousStates: Map<string, number[]> = new Map();
  private highlightTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private controlSignalsCollapsed: boolean;
  private controlSection: HTMLElement | null = null;
  private controlHeader: HTMLElement | null = null;
  private boundClickHandler: (() => void) | null = null;
  private boundKeydownHandler: ((e: Event) => void) | null = null;

  constructor(options: SignalValuesPanelOptions = {}) {
    this.options = options;
    this.controlSignalsCollapsed = options.controlSignalsCollapsed ?? true;
  }

  /**
   * Mount the panel into a container element.
   * @param container - The DOM element to mount into
   */
  mount(container: HTMLElement): void {
    this.container = container;
    this.render();
  }

  /**
   * Destroy the panel and clean up resources.
   */
  destroy(): void {
    // Clear all highlight timeouts
    for (const timeout of this.highlightTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.highlightTimeouts.clear();

    // Remove event listeners to prevent memory leaks
    if (this.controlHeader) {
      if (this.boundClickHandler) {
        this.controlHeader.removeEventListener('click', this.boundClickHandler);
      }
      if (this.boundKeydownHandler) {
        this.controlHeader.removeEventListener('keydown', this.boundKeydownHandler);
      }
    }
    this.boundClickHandler = null;
    this.boundKeydownHandler = null;
    this.controlHeader = null;

    // Remove DOM content
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.container = null;
    this.controlSection = null;
    this.previousStates.clear();
  }

  /**
   * Update the panel with new circuit state.
   * @param model - The circuit model with current wire states
   */
  update(model: CircuitModel): void {
    if (!this.container) return;

    const registerSignals = this.options.signals ?? DEFAULT_REGISTER_SIGNALS;
    const showControl = this.options.showControlSignals ?? true;

    // Update register signals
    for (const signal of registerSignals) {
      this.updateSignalRow(model, signal.name);
    }

    // Update control signals if shown
    if (showControl) {
      for (const signal of DEFAULT_CONTROL_SIGNALS) {
        this.updateSignalRow(model, signal.name);
      }
    }
  }

  /**
   * Update a single signal row with new value.
   * @param model - Circuit model
   * @param wireName - Name of the wire
   */
  private updateSignalRow(model: CircuitModel, wireName: string): void {
    if (!this.container) return;

    const wire = model.getWireByName(wireName);
    if (!wire) return;

    const valueElement = this.container.querySelector(
      `[data-signal="${wireName}"] .da-signal-value`
    );
    if (!valueElement) return;

    const newValue = formatWireValue(wire);
    valueElement.textContent = newValue;

    // Check for changes and highlight
    const prevState = this.previousStates.get(wireName);
    if (prevState && !statesEqual(prevState, wire.state)) {
      this.highlightChange(wireName, valueElement as HTMLElement);
    }

    // Store current state for next comparison
    this.previousStates.set(wireName, [...wire.state]);
  }

  /**
   * Apply change highlight to a signal value element.
   * @param wireName - Wire name for timeout tracking
   * @param element - DOM element to highlight
   */
  private highlightChange(wireName: string, element: HTMLElement): void {
    // Clear any existing timeout for this wire
    const existingTimeout = this.highlightTimeouts.get(wireName);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Add highlight class
    element.classList.add('da-signal-changed');

    // Remove highlight after delay
    const timeout = setTimeout(() => {
      element.classList.remove('da-signal-changed');
      this.highlightTimeouts.delete(wireName);
    }, CHANGE_HIGHLIGHT_DURATION);

    this.highlightTimeouts.set(wireName, timeout);
  }

  /**
   * Render the panel structure.
   */
  private render(): void {
    if (!this.container) return;

    const registerSignals = this.options.signals ?? DEFAULT_REGISTER_SIGNALS;
    const showControl = this.options.showControlSignals ?? true;

    let html = '<div class="da-signal-values-panel">';

    // Registers section
    html += '<div class="da-signal-section da-signal-registers">';
    html += '<div class="da-signal-section-header">Registers</div>';
    html += '<div class="da-signal-section-content">';
    for (const signal of registerSignals) {
      html += this.renderSignalRow(signal.name, signal.label);
    }
    html += '</div></div>';

    // Control signals section (collapsible)
    if (showControl) {
      const collapsedClass = this.controlSignalsCollapsed ? ' collapsed' : '';
      html += `<div class="da-signal-section da-signal-controls${collapsedClass}">`;
      html += '<div class="da-signal-section-header" tabindex="0" role="button" aria-expanded="' +
              (!this.controlSignalsCollapsed) + '" aria-controls="da-signal-controls-content">Control</div>';
      html += '<div id="da-signal-controls-content" class="da-signal-section-content">';
      for (const signal of DEFAULT_CONTROL_SIGNALS) {
        html += this.renderSignalRow(signal.name, signal.label);
      }
      html += '</div></div>';
    }

    html += '</div>';
    this.container.innerHTML = html;

    // Set up collapse toggle event listener
    if (showControl) {
      this.controlSection = this.container.querySelector('.da-signal-controls');
      this.controlHeader = this.container.querySelector('.da-signal-controls .da-signal-section-header');
      if (this.controlHeader) {
        this.boundClickHandler = () => this.toggleControlSection();
        this.boundKeydownHandler = (e: Event) => {
          const keyEvent = e as KeyboardEvent;
          if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
            e.preventDefault();
            this.toggleControlSection();
          }
        };
        this.controlHeader.addEventListener('click', this.boundClickHandler);
        this.controlHeader.addEventListener('keydown', this.boundKeydownHandler);
      }
    }
  }

  /**
   * Render a single signal row.
   * @param wireName - Name of the wire
   * @param customLabel - Optional custom label
   * @returns HTML string for the row
   */
  private renderSignalRow(wireName: string, customLabel?: string): string {
    const label = customLabel ?? formatSignalLabel(wireName);
    return `<div class="da-signal-row" data-signal="${wireName}">
      <span class="da-signal-label">${label}</span>
      <span class="da-signal-value">---</span>
    </div>`;
  }

  /**
   * Toggle the control signals section collapsed state.
   */
  private toggleControlSection(): void {
    if (!this.controlSection) return;

    this.controlSignalsCollapsed = !this.controlSignalsCollapsed;
    this.controlSection.classList.toggle('collapsed', this.controlSignalsCollapsed);

    const header = this.controlSection.querySelector('.da-signal-section-header');
    if (header) {
      header.setAttribute('aria-expanded', String(!this.controlSignalsCollapsed));
    }
  }

  /**
   * Check if the control signals section is collapsed.
   * @returns True if collapsed
   */
  isControlSectionCollapsed(): boolean {
    return this.controlSignalsCollapsed;
  }

  /**
   * Set the control signals section collapsed state.
   * @param collapsed - Whether to collapse
   */
  setControlSectionCollapsed(collapsed: boolean): void {
    if (this.controlSignalsCollapsed !== collapsed) {
      this.toggleControlSection();
    }
  }
}
