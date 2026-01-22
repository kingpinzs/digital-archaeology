// src/ui/App.ts
// Root application component - renders the main 3-panel layout

/**
 * Root application component that renders the main 3-panel layout.
 * Creates toolbar, code panel, circuit panel, state panel, and status bar.
 */
export class App {
  private container: HTMLElement | null = null;
  private isMounted: boolean = false;

  /**
   * Mount the application to a DOM container.
   * Safe to call multiple times - will re-render if already mounted.
   */
  mount(container: HTMLElement): void {
    this.container = container;
    this.isMounted = true;
    this.render();
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
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }
    this.isMounted = false;
  }
}
