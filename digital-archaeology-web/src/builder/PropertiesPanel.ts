// src/builder/PropertiesPanel.ts
// UI component for showing/editing properties of selected components

import type { ComponentInstance, ComponentState, SignalValue, Era } from './types';
import { getComponentDefinition } from './ComponentDefinitions';

/**
 * Callbacks for properties panel interactions.
 */
export interface PropertiesPanelCallbacks {
  /** Label was changed */
  onLabelChange?: (componentId: string, label: string) => void;
  /** Rotation was changed */
  onRotationChange?: (componentId: string, rotation: 0 | 90 | 180 | 270) => void;
  /** Input value was toggled */
  onInputToggle?: (componentId: string) => void;
  /** Delete button was clicked */
  onDelete?: (componentId: string) => void;
  /** Duplicate button was clicked */
  onDuplicate?: (componentId: string) => void;
  /** Test circuit button was clicked */
  onTestCircuit?: () => void;
  /** Save as gate button was clicked */
  onSaveAsGate?: () => void;
}

/**
 * Properties panel state.
 */
export interface PropertiesPanelState {
  /** Selected component (or null if none) */
  selectedComponent: ComponentInstance | null;
  /** Component state from simulation */
  componentState: ComponentState | null;
  /** Current era */
  era: Era;
  /** Whether simulation is running */
  simulationRunning: boolean;
  /** Number of selected items */
  selectionCount: number;
}

/**
 * PropertiesPanel shows and allows editing of selected component properties.
 */
export class PropertiesPanel {
  private container: HTMLElement | null = null;
  private callbacks: PropertiesPanelCallbacks;
  private state: PropertiesPanelState;

  constructor(callbacks: PropertiesPanelCallbacks = {}) {
    this.callbacks = callbacks;
    this.state = {
      selectedComponent: null,
      componentState: null,
      era: 'relay',
      simulationRunning: false,
      selectionCount: 0,
    };
  }

  /**
   * Mount the panel to a container.
   */
  mount(container: HTMLElement): void {
    this.container = container;
    this.render();
  }

  /**
   * Destroy the panel.
   */
  destroy(): void {
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.container = null;
  }

  /**
   * Update panel state.
   */
  updateState(state: Partial<PropertiesPanelState>): void {
    Object.assign(this.state, state);
    this.render();
  }

  /**
   * Get current state.
   */
  getState(): Readonly<PropertiesPanelState> {
    return this.state;
  }

  /**
   * Render the panel.
   */
  private render(): void {
    if (!this.container) return;

    const { selectedComponent, componentState, selectionCount, simulationRunning } = this.state;

    if (!selectedComponent) {
      this.renderNoSelection();
      return;
    }

    const definition = getComponentDefinition(selectedComponent.definitionId);
    if (!definition) {
      this.renderNoSelection();
      return;
    }

    this.container.innerHTML = `
      <div class="da-properties-panel">
        <div class="da-properties-header">
          <h3 class="da-properties-title">Properties</h3>
          ${
            selectionCount > 1
              ? `<span class="da-properties-count">${selectionCount} selected</span>`
              : ''
          }
        </div>

        <div class="da-properties-content">
          <!-- Component Info -->
          <div class="da-properties-section">
            <div class="da-properties-row">
              <span class="da-properties-label">Type</span>
              <span class="da-properties-value">${definition.name}</span>
            </div>
            <div class="da-properties-row">
              <span class="da-properties-label">ID</span>
              <span class="da-properties-value da-properties-value--mono">${selectedComponent.id.slice(0, 8)}...</span>
            </div>
          </div>

          <!-- Label -->
          <div class="da-properties-section">
            <div class="da-properties-row">
              <label class="da-properties-label" for="prop-label">Label</label>
              <input
                type="text"
                id="prop-label"
                class="da-properties-input"
                value="${selectedComponent.label ?? ''}"
                placeholder="Optional label"
              />
            </div>
          </div>

          <!-- Position & Rotation -->
          <div class="da-properties-section">
            <div class="da-properties-row">
              <span class="da-properties-label">Position</span>
              <span class="da-properties-value da-properties-value--mono">
                (${Math.round(selectedComponent.position.x)}, ${Math.round(selectedComponent.position.y)})
              </span>
            </div>
            <div class="da-properties-row">
              <span class="da-properties-label">Rotation</span>
              <div class="da-properties-rotation">
                ${[0, 90, 180, 270]
                  .map(
                    (r) => `
                  <button
                    class="da-rotation-btn ${selectedComponent.rotation === r ? 'da-rotation-btn--active' : ''}"
                    data-rotation="${r}"
                    title="Rotate ${r}°"
                  >
                    ${r}°
                  </button>
                `
                  )
                  .join('')}
              </div>
            </div>
          </div>

          <!-- State (from simulation) -->
          ${
            componentState
              ? `
            <div class="da-properties-section">
              <h4 class="da-properties-section-title">Simulation State</h4>
              ${this.renderComponentState(definition.type, componentState)}
            </div>
          `
              : ''
          }

          <!-- Input Toggle (for input components) -->
          ${
            definition.type === 'input'
              ? `
            <div class="da-properties-section">
              <button class="da-properties-btn da-properties-btn--primary" id="toggle-input">
                ${componentState?.portValues?.get('out') === 1 ? 'Set LOW' : 'Set HIGH'}
              </button>
            </div>
          `
              : ''
          }

          <!-- Actions -->
          <div class="da-properties-section da-properties-actions">
            <button class="da-properties-btn" id="duplicate-btn" title="Duplicate component">
              Duplicate
            </button>
            <button class="da-properties-btn da-properties-btn--danger" id="delete-btn" title="Delete component">
              Delete
            </button>
          </div>
        </div>

        <!-- Circuit Actions -->
        <div class="da-properties-footer">
          <button
            class="da-properties-btn da-properties-btn--wide"
            id="test-circuit-btn"
            ${simulationRunning ? 'disabled' : ''}
          >
            ${simulationRunning ? 'Simulating...' : 'Test Circuit'}
          </button>
          <button class="da-properties-btn da-properties-btn--wide da-properties-btn--success" id="save-gate-btn">
            Save as Gate
          </button>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  /**
   * Render the no-selection state.
   */
  private renderNoSelection(): void {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="da-properties-panel da-properties-panel--empty">
        <div class="da-properties-header">
          <h3 class="da-properties-title">Properties</h3>
        </div>
        <div class="da-properties-empty">
          <p>Select a component to view its properties</p>
        </div>

        <!-- Circuit Actions (always visible) -->
        <div class="da-properties-footer">
          <button
            class="da-properties-btn da-properties-btn--wide"
            id="test-circuit-btn"
            ${this.state.simulationRunning ? 'disabled' : ''}
          >
            ${this.state.simulationRunning ? 'Simulating...' : 'Test Circuit'}
          </button>
          <button class="da-properties-btn da-properties-btn--wide da-properties-btn--success" id="save-gate-btn">
            Save as Gate
          </button>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  /**
   * Render component state based on type.
   */
  private renderComponentState(type: string, state: ComponentState): string {
    const rows: string[] = [];

    if (type === 'relay_no' || type === 'relay_nc') {
      rows.push(`
        <div class="da-properties-row">
          <span class="da-properties-label">Coil</span>
          <span class="da-properties-value da-properties-value--signal ${state.coilEnergized ? 'da-signal-high' : 'da-signal-low'}">
            ${state.coilEnergized ? 'Energized' : 'Off'}
          </span>
        </div>
        <div class="da-properties-row">
          <span class="da-properties-label">Switch</span>
          <span class="da-properties-value da-properties-value--signal ${state.switchClosed ? 'da-signal-high' : 'da-signal-low'}">
            ${state.switchClosed ? 'Closed' : 'Open'}
          </span>
        </div>
      `);
    }

    // Port values
    if (state.portValues && state.portValues.size > 0) {
      rows.push('<div class="da-properties-row"><span class="da-properties-label">Ports</span></div>');
      for (const [portId, value] of state.portValues) {
        rows.push(`
          <div class="da-properties-row da-properties-row--indent">
            <span class="da-properties-label">${portId}</span>
            <span class="da-properties-value da-properties-value--signal ${this.getSignalClass(value)}">
              ${this.formatSignalValue(value)}
            </span>
          </div>
        `);
      }
    }

    return rows.join('');
  }

  /**
   * Get CSS class for signal value.
   */
  private getSignalClass(value: SignalValue): string {
    switch (value) {
      case 1:
        return 'da-signal-high';
      case 0:
        return 'da-signal-low';
      default:
        return 'da-signal-unknown';
    }
  }

  /**
   * Format signal value for display.
   */
  private formatSignalValue(value: SignalValue): string {
    switch (value) {
      case 1:
        return 'HIGH (1)';
      case 0:
        return 'LOW (0)';
      default:
        return 'Unknown (X)';
    }
  }

  /**
   * Attach event listeners.
   */
  private attachEventListeners(): void {
    if (!this.container) return;

    const { selectedComponent } = this.state;

    // Label input
    const labelInput = this.container.querySelector('#prop-label') as HTMLInputElement;
    if (labelInput && selectedComponent) {
      labelInput.addEventListener('change', () => {
        this.callbacks.onLabelChange?.(selectedComponent.id, labelInput.value);
      });
    }

    // Rotation buttons
    const rotationBtns = this.container.querySelectorAll('.da-rotation-btn');
    rotationBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!selectedComponent) return;
        const rotation = parseInt(btn.getAttribute('data-rotation') ?? '0', 10) as 0 | 90 | 180 | 270;
        this.callbacks.onRotationChange?.(selectedComponent.id, rotation);
      });
    });

    // Toggle input button
    const toggleBtn = this.container.querySelector('#toggle-input');
    if (toggleBtn && selectedComponent) {
      toggleBtn.addEventListener('click', () => {
        this.callbacks.onInputToggle?.(selectedComponent.id);
      });
    }

    // Delete button
    const deleteBtn = this.container.querySelector('#delete-btn');
    if (deleteBtn && selectedComponent) {
      deleteBtn.addEventListener('click', () => {
        this.callbacks.onDelete?.(selectedComponent.id);
      });
    }

    // Duplicate button
    const duplicateBtn = this.container.querySelector('#duplicate-btn');
    if (duplicateBtn && selectedComponent) {
      duplicateBtn.addEventListener('click', () => {
        this.callbacks.onDuplicate?.(selectedComponent.id);
      });
    }

    // Test circuit button
    const testBtn = this.container.querySelector('#test-circuit-btn');
    if (testBtn) {
      testBtn.addEventListener('click', () => {
        this.callbacks.onTestCircuit?.();
      });
    }

    // Save as gate button
    const saveBtn = this.container.querySelector('#save-gate-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.callbacks.onSaveAsGate?.();
      });
    }
  }
}
