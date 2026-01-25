// src/builder/ComponentPalette.ts
// UI component for the component palette in the Circuit Builder

import type { ComponentDefinition, Era } from './types';
import {
  BASE_COMPONENTS,
  UNLOCKABLE_GATES,
  getAvailableComponents,
  getUnlockRequirement,
} from './ComponentDefinitions';

/**
 * Callbacks for palette interactions.
 */
export interface ComponentPaletteCallbacks {
  /** Component was selected for placement */
  onComponentSelect?: (definition: ComponentDefinition) => void;
  /** Component drag started */
  onComponentDragStart?: (definition: ComponentDefinition) => void;
  /** Era tab changed */
  onEraChange?: (era: Era) => void;
  /** Info button clicked for a component */
  onComponentInfo?: (definition: ComponentDefinition) => void;
}

/**
 * Palette state.
 */
export interface ComponentPaletteState {
  /** Current era being displayed */
  currentEra: Era;
  /** IDs of unlocked components */
  unlockedComponents: string[];
  /** IDs of user-created gates */
  userGates: string[];
  /** Currently selected component (if any) */
  selectedComponent: string | null;
}

/**
 * ComponentPalette displays available components for the circuit builder.
 */
export class ComponentPalette {
  private container: HTMLElement | null = null;
  private callbacks: ComponentPaletteCallbacks;
  private state: ComponentPaletteState;

  constructor(callbacks: ComponentPaletteCallbacks = {}) {
    this.callbacks = callbacks;
    this.state = {
      currentEra: 'relay',
      unlockedComponents: [],
      userGates: [],
      selectedComponent: null,
    };
  }

  /**
   * Mount the palette to a container.
   */
  mount(container: HTMLElement): void {
    this.container = container;
    this.render();
  }

  /**
   * Destroy the palette.
   */
  destroy(): void {
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.container = null;
  }

  /**
   * Update palette state.
   */
  updateState(state: Partial<ComponentPaletteState>): void {
    Object.assign(this.state, state);
    this.render();
  }

  /**
   * Get current state.
   */
  getState(): Readonly<ComponentPaletteState> {
    return this.state;
  }

  /**
   * Render the palette.
   */
  private render(): void {
    if (!this.container) return;

    const { currentEra, unlockedComponents, userGates, selectedComponent } = this.state;

    // Get available components for current era
    const available = getAvailableComponents(currentEra, unlockedComponents);
    const locked = UNLOCKABLE_GATES.filter((c) => !unlockedComponents.includes(c.id));

    this.container.innerHTML = `
        <div class="da-palette-header">
          <h3 class="da-palette-title">Components</h3>
          <div class="da-era-badge" title="Current Era">
            ${this.getEraIcon(currentEra)} ${this.getEraLabel(currentEra)}
          </div>
        </div>

        <div class="da-palette-section">
          <h4 class="da-palette-section-title">Primitives</h4>
          <div class="da-palette-grid">
            ${BASE_COMPONENTS.map((comp) => this.renderComponentItem(comp, selectedComponent === comp.id)).join('')}
          </div>
        </div>

        ${
          available.length > BASE_COMPONENTS.length
            ? `
          <div class="da-palette-section">
            <h4 class="da-palette-section-title">Unlocked Gates</h4>
            <div class="da-palette-grid">
              ${available
                .filter((c) => !BASE_COMPONENTS.find((b) => b.id === c.id))
                .map((comp) => this.renderComponentItem(comp, selectedComponent === comp.id))
                .join('')}
            </div>
          </div>
        `
            : ''
        }

        ${
          locked.length > 0
            ? `
          <div class="da-palette-section">
            <h4 class="da-palette-section-title">
              Locked Gates
              <span class="da-palette-hint">Build to unlock!</span>
            </h4>
            <div class="da-palette-grid">
              ${locked.map((comp) => this.renderLockedItem(comp)).join('')}
            </div>
          </div>
        `
            : ''
        }

        ${
          userGates.length > 0
            ? `
          <div class="da-palette-section">
            <h4 class="da-palette-section-title">My Gates</h4>
            <div class="da-palette-grid">
              ${userGates.map((id) => this.renderUserGateItem(id)).join('')}
            </div>
          </div>
        `
            : ''
        }
    `;

    // Add event listeners
    this.attachEventListeners();
  }

  /**
   * Render a component item.
   */
  private renderComponentItem(comp: ComponentDefinition, isSelected: boolean): string {
    return `
      <div
        class="da-palette-item ${isSelected ? 'da-palette-item--selected' : ''}"
        data-component-id="${comp.id}"
        draggable="true"
        title="${comp.name}"
      >
        <div class="da-palette-item-icon">${this.getComponentIcon(comp)}</div>
        <div class="da-palette-item-label">${comp.name}</div>
      </div>
    `;
  }

  /**
   * Render a locked component item.
   */
  private renderLockedItem(comp: ComponentDefinition): string {
    const requirement = getUnlockRequirement(comp.id);
    return `
      <div
        class="da-palette-item da-palette-item--locked"
        data-component-id="${comp.id}"
        title="${requirement?.description ?? 'Build to unlock'}"
      >
        <div class="da-palette-item-icon da-palette-item-icon--locked">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a3 3 0 0 0-3 3v2H4a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-1V4a3 3 0 0 0-3-3zm-2 3a2 2 0 1 1 4 0v2H6V4zm2 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
          </svg>
        </div>
        <div class="da-palette-item-label">${comp.name}</div>
      </div>
    `;
  }

  /**
   * Render a user-created gate item.
   */
  private renderUserGateItem(id: string): string {
    return `
      <div
        class="da-palette-item da-palette-item--user"
        data-component-id="${id}"
        draggable="true"
        title="Custom gate: ${id}"
      >
        <div class="da-palette-item-icon">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="2" y="4" width="12" height="8" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/>
            <text x="8" y="10" text-anchor="middle" font-size="6">G</text>
          </svg>
        </div>
        <div class="da-palette-item-label">${id}</div>
      </div>
    `;
  }

  /**
   * Get icon for a component.
   */
  private getComponentIcon(comp: ComponentDefinition): string {
    switch (comp.type) {
      case 'relay_no':
        return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="4" y="6" width="8" height="12" rx="1"/>
          <line x1="12" y1="10" x2="20" y2="10"/>
          <line x1="12" y1="14" x2="18" y2="14" stroke-dasharray="2,2"/>
          <circle cx="18" cy="10" r="2" fill="currentColor"/>
        </svg>`;

      case 'relay_nc':
        return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="4" y="6" width="8" height="12" rx="1"/>
          <line x1="12" y1="10" x2="20" y2="10"/>
          <line x1="12" y1="14" x2="18" y2="14"/>
          <circle cx="18" cy="10" r="2"/>
        </svg>`;

      case 'power':
        return `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4 L8 12 L11 12 L11 20 L16 12 L13 12 L13 4 Z"/>
        </svg>`;

      case 'ground':
        return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="6" x2="12" y2="10"/>
          <line x1="6" y1="10" x2="18" y2="10"/>
          <line x1="8" y1="14" x2="16" y2="14"/>
          <line x1="10" y1="18" x2="14" y2="18"/>
        </svg>`;

      case 'input':
        return `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="4,12 12,6 12,10 20,10 20,14 12,14 12,18"/>
        </svg>`;

      case 'output':
        return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="6"/>
          <circle cx="12" cy="12" r="3" fill="currentColor"/>
        </svg>`;

      default:
        return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="4" y="6" width="16" height="12" rx="2"/>
        </svg>`;
    }
  }

  /**
   * Get era icon.
   */
  private getEraIcon(era: Era): string {
    switch (era) {
      case 'relay':
        return '&#9889;'; // Lightning bolt
      case 'transistor':
        return '&#9883;'; // Transistor-like
      case 'cmos':
        return '&#9619;'; // Block
      case 'gate':
        return '&#9632;'; // Square
      default:
        return '&#9679;'; // Circle
    }
  }

  /**
   * Get era label.
   */
  private getEraLabel(era: Era): string {
    switch (era) {
      case 'relay':
        return 'Relay';
      case 'transistor':
        return 'Transistor';
      case 'cmos':
        return 'CMOS';
      case 'gate':
        return 'Gate';
      default:
        return era;
    }
  }

  /**
   * Attach event listeners to palette items.
   */
  private attachEventListeners(): void {
    if (!this.container) return;

    // Click handlers for available components
    const items = this.container.querySelectorAll('.da-palette-item:not(.da-palette-item--locked)');
    items.forEach((item) => {
      const id = item.getAttribute('data-component-id');
      if (!id) return;

      // Click to select
      item.addEventListener('click', () => {
        const comp = this.findComponent(id);
        if (comp) {
          this.state.selectedComponent = id;
          this.render();
          this.callbacks.onComponentSelect?.(comp);
        }
      });

      // Drag to place
      item.addEventListener('dragstart', (e) => {
        const comp = this.findComponent(id);
        if (comp) {
          (e as DragEvent).dataTransfer?.setData('text/plain', id);
          this.callbacks.onComponentDragStart?.(comp);
        }
      });
    });

    // Click handlers for locked components (show info)
    const lockedItems = this.container.querySelectorAll('.da-palette-item--locked');
    lockedItems.forEach((item) => {
      const id = item.getAttribute('data-component-id');
      if (!id) return;

      item.addEventListener('click', () => {
        const comp = UNLOCKABLE_GATES.find((c) => c.id === id);
        if (comp) {
          this.callbacks.onComponentInfo?.(comp);
        }
      });
    });
  }

  /**
   * Find component definition by ID.
   */
  private findComponent(id: string): ComponentDefinition | undefined {
    return (
      BASE_COMPONENTS.find((c) => c.id === id) ??
      UNLOCKABLE_GATES.find((c) => c.id === id)
    );
  }
}
