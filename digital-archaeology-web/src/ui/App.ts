// src/ui/App.ts
// Root application component - renders the main 3-panel layout with resizable panels

import { PanelResizer, PANEL_CONSTRAINTS } from './PanelResizer';

/**
 * Root application component that renders the main 3-panel layout.
 * Creates toolbar, code panel, circuit panel, state panel, and status bar.
 * Panels are resizable via drag handles.
 */
export class App {
  private container: HTMLElement | null = null;
  private isMounted: boolean = false;
  private codeResizer: PanelResizer | null = null;
  private stateResizer: PanelResizer | null = null;
  private codePanelWidth: number = PANEL_CONSTRAINTS.CODE_DEFAULT;
  private statePanelWidth: number = PANEL_CONSTRAINTS.STATE_DEFAULT;
  private boundWindowResize: () => void;

  constructor() {
    this.boundWindowResize = this.handleWindowResize.bind(this);
  }

  /**
   * Mount the application to a DOM container.
   * Safe to call multiple times - will re-render if already mounted.
   */
  mount(container: HTMLElement): void {
    // Clean up existing resizers before re-mounting to prevent memory leaks
    this.destroyResizers();

    this.container = container;
    this.isMounted = true;
    this.render();
    this.initializeResizers();
    this.updateGridColumns();

    // Add window resize listener
    window.addEventListener('resize', this.boundWindowResize);
  }

  /**
   * Render the application layout.
   * @returns void
   */
  private render(): void {
    if (!this.container) return;

    // Note: innerHTML with static template - no user input, safe from XSS
    this.container.innerHTML = `
      <div class="da-app-layout">
        <header class="da-toolbar">
          <span class="da-toolbar-text">Toolbar</span>
        </header>

        <aside class="da-panel da-code-panel" aria-label="Code Editor Panel">
          <div class="da-panel-header">
            <span class="da-panel-title">CODE</span>
          </div>
          <div class="da-panel-content">
            <!-- Content: Epic 2 - Assembly Code Editor -->
          </div>
        </aside>

        <main class="da-circuit-panel" aria-label="Circuit Visualizer Panel">
          <div class="da-panel-header">
            <span class="da-panel-title">CIRCUIT</span>
          </div>
          <div class="da-panel-content">
            <!-- Content: Epic 6 - Circuit Visualization -->
          </div>
        </main>

        <aside class="da-panel da-state-panel" aria-label="CPU State Panel">
          <div class="da-panel-header">
            <span class="da-panel-title">STATE</span>
          </div>
          <div class="da-panel-content">
            <!-- Content: Epic 5 - Debugging & State Inspection -->
          </div>
        </aside>

        <footer class="da-statusbar" role="status" aria-live="polite">
          <span class="da-statusbar-text">Ready</span>
        </footer>
      </div>
    `;
  }

  /**
   * Initialize the panel resizers.
   * @returns void
   */
  private initializeResizers(): void {
    if (!this.container) return;

    const codePanel = this.container.querySelector('.da-code-panel');
    const statePanel = this.container.querySelector('.da-state-panel');

    if (codePanel) {
      this.codeResizer = new PanelResizer({
        panel: 'code',
        onResize: (width) => this.handleCodeResize(width),
        getCurrentWidth: () => this.codePanelWidth,
        getOtherPanelWidth: () => this.statePanelWidth,
      });
      this.codeResizer.mount(codePanel as HTMLElement);
    }

    if (statePanel) {
      this.stateResizer = new PanelResizer({
        panel: 'state',
        onResize: (width) => this.handleStateResize(width),
        getCurrentWidth: () => this.statePanelWidth,
        getOtherPanelWidth: () => this.codePanelWidth,
      });
      this.stateResizer.mount(statePanel as HTMLElement);
    }
  }

  /**
   * Handle code panel resize.
   * @param width - New width in pixels
   * @returns void
   */
  private handleCodeResize(width: number): void {
    this.codePanelWidth = width;
    this.updateGridColumns();
  }

  /**
   * Handle state panel resize.
   * @param width - New width in pixels
   * @returns void
   */
  private handleStateResize(width: number): void {
    this.statePanelWidth = width;
    this.updateGridColumns();
  }

  /**
   * Update CSS custom properties for grid column widths.
   * @returns void
   */
  private updateGridColumns(): void {
    document.documentElement.style.setProperty(
      '--da-code-panel-width',
      `${this.codePanelWidth}px`
    );
    document.documentElement.style.setProperty(
      '--da-state-panel-width',
      `${this.statePanelWidth}px`
    );
  }

  /**
   * Handle window resize to ensure panel constraints are maintained.
   * @returns void
   */
  private handleWindowResize(): void {
    const viewportWidth = window.innerWidth;
    const minTotalWidth = PANEL_CONSTRAINTS.CODE_MIN + PANEL_CONSTRAINTS.CIRCUIT_MIN + PANEL_CONSTRAINTS.STATE_MIN;

    // If viewport is too small, we can't maintain constraints - just clamp
    if (viewportWidth < minTotalWidth) {
      return;
    }

    // Recalculate max widths and constrain current values
    const maxCodeWidth = viewportWidth - PANEL_CONSTRAINTS.CIRCUIT_MIN - this.statePanelWidth;
    const maxStateWidth = viewportWidth - PANEL_CONSTRAINTS.CIRCUIT_MIN - this.codePanelWidth;

    // Clamp code panel width
    if (this.codePanelWidth > maxCodeWidth) {
      this.codePanelWidth = Math.max(PANEL_CONSTRAINTS.CODE_MIN, maxCodeWidth);
    }

    // Clamp state panel width
    if (this.statePanelWidth > maxStateWidth) {
      this.statePanelWidth = Math.max(PANEL_CONSTRAINTS.STATE_MIN, maxStateWidth);
    }

    this.updateGridColumns();
  }

  /**
   * Destroy resizers without clearing container.
   * @returns void
   */
  private destroyResizers(): void {
    if (this.codeResizer) {
      this.codeResizer.destroy();
      this.codeResizer = null;
    }
    if (this.stateResizer) {
      this.stateResizer.destroy();
      this.stateResizer = null;
    }
  }

  /**
   * Get current code panel width.
   * @returns Width in pixels
   */
  getCodePanelWidth(): number {
    return this.codePanelWidth;
  }

  /**
   * Get current state panel width.
   * @returns Width in pixels
   */
  getStatePanelWidth(): number {
    return this.statePanelWidth;
  }

  /**
   * Check if the application is currently mounted.
   * @returns true if mounted, false otherwise
   */
  isMountedTo(): boolean {
    return this.isMounted;
  }

  /**
   * Destroy and clean up.
   * @returns void
   */
  destroy(): void {
    // Remove window resize listener
    window.removeEventListener('resize', this.boundWindowResize);

    // Destroy resizers
    this.destroyResizers();

    // Clear container
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }

    // Reset panel widths to defaults
    this.codePanelWidth = PANEL_CONSTRAINTS.CODE_DEFAULT;
    this.statePanelWidth = PANEL_CONSTRAINTS.STATE_DEFAULT;

    // Clear CSS custom properties
    document.documentElement.style.removeProperty('--da-code-panel-width');
    document.documentElement.style.removeProperty('--da-state-panel-width');

    this.isMounted = false;
  }
}
