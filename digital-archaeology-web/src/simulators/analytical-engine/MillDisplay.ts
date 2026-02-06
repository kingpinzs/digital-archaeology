// src/simulators/analytical-engine/MillDisplay.ts
// ALU visualization with gear animation for the Analytical Engine

import type { MillStatus } from './EngineCore';

/**
 * MillDisplay renders the Mill (ALU) with:
 * - Current operation name
 * - Input A/B values
 * - Result
 * - Spinning gear animation during computation
 * - Status indicator
 */
export class MillDisplay {
  private container: HTMLElement | null = null;
  private element: HTMLElement | null = null;
  private operationEl: HTMLElement | null = null;
  private inputAEl: HTMLElement | null = null;
  private inputBEl: HTMLElement | null = null;
  private resultEl: HTMLElement | null = null;
  private gearEl: HTMLElement | null = null;
  private statusEl: HTMLElement | null = null;

  mount(container: HTMLElement): void {
    this.container = container;
    this.element = this.render();
    this.container.appendChild(this.element);
  }

  /**
   * Show an arithmetic operation being performed.
   */
  setOperation(op: string, inputA: number, inputB: number, result: number): void {
    if (this.operationEl) this.operationEl.textContent = op;
    if (this.inputAEl) this.inputAEl.textContent = String(inputA);
    if (this.inputBEl) this.inputBEl.textContent = String(inputB);
    if (this.resultEl) this.resultEl.textContent = String(result);
  }

  /**
   * Update the Mill status and gear animation.
   */
  setStatus(status: MillStatus): void {
    if (this.statusEl) this.statusEl.textContent = status;

    if (status === 'COMPUTING') {
      this.gearEl?.classList.add('da-sim-ae-gear--spinning');
    } else {
      this.gearEl?.classList.remove('da-sim-ae-gear--spinning');
    }

    // Update status color class
    this.element?.classList.remove('da-sim-ae-mill--idle', 'da-sim-ae-mill--computing', 'da-sim-ae-mill--done', 'da-sim-ae-mill--error');
    this.element?.classList.add(`da-sim-ae-mill--${status.toLowerCase()}`);
  }

  /**
   * Reset the Mill display.
   */
  reset(): void {
    if (this.operationEl) this.operationEl.textContent = 'IDLE';
    if (this.inputAEl) this.inputAEl.textContent = '--';
    if (this.inputBEl) this.inputBEl.textContent = '--';
    if (this.resultEl) this.resultEl.textContent = '--';
    this.setStatus('IDLE');
  }

  destroy(): void {
    this.element?.remove();
    this.element = null;
    this.container = null;
  }

  private render(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'da-sim-ae-mill';

    const heading = document.createElement('h4');
    heading.className = 'da-sim-ae-section-heading';
    heading.textContent = 'Mill (ALU)';
    wrapper.appendChild(heading);

    // Operation display
    const opRow = this.createRow('Operation:', 'IDLE');
    this.operationEl = opRow.valueEl;
    wrapper.appendChild(opRow.row);

    const inputARow = this.createRow('Input A:', '--');
    this.inputAEl = inputARow.valueEl;
    wrapper.appendChild(inputARow.row);

    const inputBRow = this.createRow('Input B:', '--');
    this.inputBEl = inputBRow.valueEl;
    wrapper.appendChild(inputBRow.row);

    const resultRow = this.createRow('Result:', '--');
    this.resultEl = resultRow.valueEl;
    wrapper.appendChild(resultRow.row);

    // Gear animation
    this.gearEl = document.createElement('div');
    this.gearEl.className = 'da-sim-ae-gear';
    this.gearEl.setAttribute('aria-hidden', 'true');
    this.gearEl.textContent = '\u2699'; // gear unicode
    wrapper.appendChild(this.gearEl);

    // Status
    const statusRow = document.createElement('div');
    statusRow.className = 'da-sim-ae-mill-status-row';
    const statusLabel = document.createElement('span');
    statusLabel.textContent = 'Status: ';
    this.statusEl = document.createElement('span');
    this.statusEl.className = 'da-sim-ae-mill-status';
    this.statusEl.textContent = 'IDLE';
    this.statusEl.setAttribute('aria-live', 'polite');
    statusRow.appendChild(statusLabel);
    statusRow.appendChild(this.statusEl);
    wrapper.appendChild(statusRow);

    return wrapper;
  }

  private createRow(label: string, initial: string): { row: HTMLElement; valueEl: HTMLElement } {
    const row = document.createElement('div');
    row.className = 'da-sim-ae-mill-row';

    const labelEl = document.createElement('span');
    labelEl.className = 'da-sim-ae-mill-label';
    labelEl.textContent = label;

    const valueEl = document.createElement('span');
    valueEl.className = 'da-sim-ae-mill-value';
    valueEl.textContent = initial;

    row.appendChild(labelEl);
    row.appendChild(valueEl);
    return { row, valueEl };
  }
}
