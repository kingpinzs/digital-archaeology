// src/simulators/analytical-engine/PrinterDisplay.ts
// Output tape component for the Analytical Engine

/**
 * PrinterDisplay renders the output "printer tape" where
 * PRINT instructions append values.
 */
export class PrinterDisplay {
  private container: HTMLElement | null = null;
  private element: HTMLElement | null = null;
  private tapeEl: HTMLElement | null = null;

  mount(container: HTMLElement): void {
    this.container = container;
    this.element = this.render();
    this.container.appendChild(this.element);
  }

  /**
   * Append a value to the printer tape.
   */
  printValue(value: number): void {
    if (!this.tapeEl) return;

    const line = document.createElement('div');
    line.className = 'da-sim-ae-printer-line';
    line.textContent = String(value);
    this.tapeEl.appendChild(line);

    // Auto-scroll to bottom
    this.tapeEl.scrollTop = this.tapeEl.scrollHeight;
  }

  /**
   * Get the printed output as a comma-separated string.
   */
  getOutputText(): string {
    if (!this.tapeEl) return '';
    const lines = this.tapeEl.querySelectorAll('.da-sim-ae-printer-line');
    return Array.from(lines).map((l) => l.textContent ?? '').join(', ');
  }

  /**
   * Clear the printer tape.
   */
  clear(): void {
    if (this.tapeEl) {
      this.tapeEl.innerHTML = '';
    }
  }

  destroy(): void {
    this.element?.remove();
    this.element = null;
    this.container = null;
    this.tapeEl = null;
  }

  private render(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'da-sim-ae-printer';

    const heading = document.createElement('div');
    heading.className = 'da-sim-ae-printer-heading';

    const title = document.createElement('h4');
    title.className = 'da-sim-ae-section-heading';
    title.textContent = 'Printer Tape';

    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'da-sim-ae-printer-clear';
    clearBtn.textContent = 'Clear';
    clearBtn.setAttribute('aria-label', 'Clear printer tape');
    clearBtn.addEventListener('click', () => this.clear());

    heading.appendChild(title);
    heading.appendChild(clearBtn);
    wrapper.appendChild(heading);

    this.tapeEl = document.createElement('div');
    this.tapeEl.className = 'da-sim-ae-printer-tape';
    this.tapeEl.setAttribute('role', 'log');
    this.tapeEl.setAttribute('aria-label', 'Printer output');
    this.tapeEl.setAttribute('aria-live', 'polite');
    wrapper.appendChild(this.tapeEl);

    return wrapper;
  }
}
