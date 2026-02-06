// src/simulators/analytical-engine/StoreDisplay.ts
// Memory column visualization for the Analytical Engine

/**
 * StoreDisplay renders the 16 store columns (v0-v15)
 * with read/write pulse animations and value transitions.
 */
export class StoreDisplay {
  private container: HTMLElement | null = null;
  private element: HTMLElement | null = null;
  private columnElements: HTMLElement[] = [];
  private valueElements: HTMLElement[] = [];

  mount(container: HTMLElement): void {
    this.container = container;
    this.element = this.render();
    this.container.appendChild(this.element);
  }

  /**
   * Update all column values.
   */
  setValues(values: number[]): void {
    for (let i = 0; i < 16 && i < values.length; i++) {
      if (this.valueElements[i]) {
        this.valueElements[i].textContent = String(values[i]);
      }
    }
  }

  /**
   * Flash a read pulse on a column.
   */
  pulseRead(column: string): void {
    const idx = this.columnIdx(column);
    if (idx < 0 || !this.columnElements[idx]) return;
    const el = this.columnElements[idx];
    el.classList.add('da-sim-ae-column--read-pulse');
    setTimeout(() => el.classList.remove('da-sim-ae-column--read-pulse'), 150);
  }

  /**
   * Flash a write pulse on a column and update its value.
   */
  pulseWrite(column: string, value: number): void {
    const idx = this.columnIdx(column);
    if (idx < 0) return;
    if (this.valueElements[idx]) {
      this.valueElements[idx].textContent = String(value);
    }
    if (this.columnElements[idx]) {
      const el = this.columnElements[idx];
      el.classList.add('da-sim-ae-column--write-pulse');
      setTimeout(() => el.classList.remove('da-sim-ae-column--write-pulse'), 150);
    }
  }

  /**
   * Reset all values to 0.
   */
  reset(): void {
    for (const el of this.valueElements) {
      el.textContent = '0';
    }
  }

  destroy(): void {
    this.element?.remove();
    this.element = null;
    this.container = null;
    this.columnElements = [];
    this.valueElements = [];
  }

  private render(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'da-sim-ae-store';

    const heading = document.createElement('h4');
    heading.className = 'da-sim-ae-section-heading';
    heading.textContent = 'Store (Memory)';
    wrapper.appendChild(heading);

    const grid = document.createElement('div');
    grid.className = 'da-sim-ae-store-grid';
    grid.setAttribute('role', 'group');
    grid.setAttribute('aria-label', 'Store columns v0 through v15');

    for (let i = 0; i < 16; i++) {
      const col = document.createElement('div');
      col.className = 'da-sim-ae-column';

      const label = document.createElement('div');
      label.className = 'da-sim-ae-column-label';
      label.textContent = `v${i}`;

      const value = document.createElement('div');
      value.className = 'da-sim-ae-column-value';
      value.textContent = '0';
      value.setAttribute('aria-live', 'polite');

      col.appendChild(label);
      col.appendChild(value);
      grid.appendChild(col);

      this.columnElements.push(col);
      this.valueElements.push(value);
    }

    wrapper.appendChild(grid);
    return wrapper;
  }

  private columnIdx(name: string): number {
    if (name.startsWith('v')) {
      const idx = parseInt(name.substring(1), 10);
      if (idx >= 0 && idx < 16) return idx;
    }
    return -1;
  }
}
