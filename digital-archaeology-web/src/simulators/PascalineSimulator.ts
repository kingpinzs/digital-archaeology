// src/simulators/PascalineSimulator.ts
// Pascal's mechanical calculator simulator (1645)
// 6 number wheels with automatic carry cascade via sautoir levers

import { BaseSimulator } from './BaseSimulator';

interface WheelState {
  value: number; // 0-9
  element: HTMLElement | null;
  digitDisplay: HTMLElement | null;
  sautoir: HTMLElement | null; // carry indicator between this and next wheel
}

/**
 * PascalineSimulator renders 6 number wheels (ones to hundred-thousands).
 * Rotating a wheel past 9→0 triggers an automatic carry cascade.
 */
export class PascalineSimulator extends BaseSimulator {
  private wheels: WheelState[] = [];
  private hasCarried = false;
  private hasCascaded = false;

  protected renderSimulator(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'da-sim-pascaline';

    // Title
    const title = document.createElement('h3');
    title.className = 'da-sim-display';
    title.textContent = "Pascal's Pascaline";
    wrapper.appendChild(title);

    // Phase hint
    const hint = document.createElement('div');
    hint.className = 'da-sim-phase-hint';
    hint.textContent = 'Use arrows to rotate wheels. When a wheel passes 9→0, the carry lever trips and advances the next wheel.';
    hint.setAttribute('aria-live', 'polite');
    wrapper.appendChild(hint);

    // Machine body
    const machine = document.createElement('div');
    machine.className = 'da-sim-pascaline-machine';
    machine.setAttribute('role', 'group');
    machine.setAttribute('aria-label', 'Pascaline with six number wheels');

    const labels = ['100K', '10K', '1K', '100', '10', '1'];

    this.wheels = labels.map((label, idx) => {
      const wheelCol = document.createElement('div');
      wheelCol.className = 'da-sim-pascaline-wheel-col';

      const wheelLabel = document.createElement('div');
      wheelLabel.className = 'da-sim-pascaline-label';
      wheelLabel.textContent = label;

      // Up button
      const upBtn = document.createElement('button');
      upBtn.type = 'button';
      upBtn.className = 'da-sim-pascaline-arrow da-sim-pascaline-arrow--up';
      upBtn.textContent = '\u25B2';
      upBtn.setAttribute('aria-label', `Increment ${label} wheel`);

      // Digit display
      const digitDisplay = document.createElement('div');
      digitDisplay.className = 'da-sim-wheel-digit';
      digitDisplay.textContent = '0';
      digitDisplay.setAttribute('aria-live', 'polite');
      digitDisplay.setAttribute('aria-label', `${label} digit: 0`);

      // Down button
      const downBtn = document.createElement('button');
      downBtn.type = 'button';
      downBtn.className = 'da-sim-pascaline-arrow da-sim-pascaline-arrow--down';
      downBtn.textContent = '\u25BC';
      downBtn.setAttribute('aria-label', `Decrement ${label} wheel`);

      wheelCol.appendChild(wheelLabel);
      wheelCol.appendChild(upBtn);
      wheelCol.appendChild(digitDisplay);
      wheelCol.appendChild(downBtn);

      // Sautoir indicator (between wheels, not on the last one)
      let sautoir: HTMLElement | null = null;
      if (idx < labels.length - 1) {
        sautoir = document.createElement('div');
        sautoir.className = 'da-sim-sautoir';
        sautoir.setAttribute('aria-hidden', 'true');
        sautoir.textContent = '\u2699'; // gear symbol
      }

      const container = document.createElement('div');
      container.className = 'da-sim-pascaline-slot';
      container.appendChild(wheelCol);
      if (sautoir) {
        container.appendChild(sautoir);
      }
      machine.appendChild(container);

      const state: WheelState = {
        value: 0,
        element: wheelCol,
        digitDisplay,
        sautoir,
      };

      upBtn.addEventListener('click', () => this.incrementWheel(idx));
      downBtn.addEventListener('click', () => this.decrementWheel(idx));

      return state;
    });

    wrapper.appendChild(machine);

    // Total display
    const totalRow = document.createElement('div');
    totalRow.className = 'da-sim-pascaline-total';
    totalRow.setAttribute('aria-live', 'polite');
    totalRow.textContent = 'Value: 000000';
    wrapper.appendChild(totalRow);

    return wrapper;
  }

  private incrementWheel(idx: number): void {
    const wheel = this.wheels[idx];
    const oldValue = wheel.value;
    wheel.value = (wheel.value + 1) % 10;
    this.updateWheelDisplay(idx);

    // Check for carry (9 → 0)
    if (oldValue === 9 && wheel.value === 0) {
      this.triggerCarry(idx);
    }

    this.updateTotal();
    this.checkObjectives();
  }

  private decrementWheel(idx: number): void {
    const wheel = this.wheels[idx];
    wheel.value = wheel.value === 0 ? 9 : wheel.value - 1;
    this.updateWheelDisplay(idx);
    this.updateTotal();
    this.checkObjectives();
  }

  private triggerCarry(fromIdx: number): void {
    // Carry propagates to the left (lower index = higher place value)
    const targetIdx = fromIdx - 1;
    if (targetIdx < 0) return;

    this.hasCarried = true;

    // Animate sautoir
    const sautoir = this.wheels[targetIdx].sautoir;
    if (sautoir) {
      sautoir.classList.add('da-sim-sautoir--active');
      setTimeout(() => {
        sautoir.classList.remove('da-sim-sautoir--active');
      }, 300);
    }

    // Increment target wheel
    const oldValue = this.wheels[targetIdx].value;
    this.wheels[targetIdx].value = (this.wheels[targetIdx].value + 1) % 10;
    this.updateWheelDisplay(targetIdx);

    // Cascading carry
    if (oldValue === 9 && this.wheels[targetIdx].value === 0) {
      this.hasCascaded = true;
      // Use setTimeout to create visible cascade animation
      setTimeout(() => {
        this.triggerCarry(targetIdx);
        this.updateTotal();
        this.checkObjectives();
      }, 150);
    }
  }

  private updateWheelDisplay(idx: number): void {
    const wheel = this.wheels[idx];
    if (wheel.digitDisplay) {
      wheel.digitDisplay.textContent = String(wheel.value);
      const labels = ['100K', '10K', '1K', '100', '10', '1'];
      wheel.digitDisplay.setAttribute('aria-label', `${labels[idx]} digit: ${wheel.value}`);
    }
  }

  private updateTotal(): void {
    const valueStr = this.wheels.map((w) => String(w.value)).join('');
    const totalEl = this.element?.querySelector('.da-sim-pascaline-total');
    if (totalEl) {
      totalEl.textContent = `Value: ${valueStr}`;
    }
  }

  private getDisplayValue(): string {
    return this.wheels.map((w) => String(w.value)).join('');
  }

  private checkObjectives(): void {
    // obj-1: Design number wheel — user rotates any wheel
    this.markObjectiveComplete('obj-1');

    // obj-2: Carry mechanism — a carry event occurs
    if (this.hasCarried) {
      this.markObjectiveComplete('obj-2');
    }

    // obj-3: Chain multiple wheels — cascading carry
    if (this.hasCascaded) {
      this.markObjectiveComplete('obj-3');
    }

    // obj-4: Test 00199 + 00001 = 00200
    if (this.getDisplayValue() === '000200') {
      this.markObjectiveComplete('obj-4');
    }
  }

  protected resetState(): void {
    this.hasCarried = false;
    this.hasCascaded = false;
    for (let i = 0; i < this.wheels.length; i++) {
      this.wheels[i].value = 0;
      this.updateWheelDisplay(i);
    }
    this.updateTotal();
  }

  protected destroySimulator(): void {
    this.wheels = [];
  }
}
