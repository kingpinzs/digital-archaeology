// src/simulators/SuanpanSimulator.ts
// Chinese abacus (suanpan) simulator (~1000 BC)
// Bamboo frame with heaven (5-value) and earth (1-value) beads

import { BaseSimulator } from './BaseSimulator';

/** Rod state: 2 heaven beads (each worth 5) and 5 earth beads (each worth 1) */
interface RodState {
  label: string;
  /** Number of active heaven beads (0-2) */
  heavenActive: number;
  /** Number of active earth beads (0-5) */
  earthActive: number;
  element: HTMLElement | null;
  heavenBeads: HTMLElement[];
  earthBeads: HTMLElement[];
  valueDisplay: HTMLElement | null;
}

/**
 * SuanpanSimulator renders a 2/5 Chinese abacus with 4 rods (thousands to ones).
 * Users click beads to toggle them active/inactive.
 */
export class SuanpanSimulator extends BaseSimulator {
  private rods: RodState[] = [];
  private hasActivatedHeaven = false;
  private hasActivatedEarth = false;

  protected renderSimulator(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'da-sim-suanpan';

    // Title
    const title = document.createElement('h3');
    title.className = 'da-sim-display';
    title.textContent = 'Suanpan (Chinese Abacus)';
    wrapper.appendChild(title);

    // Phase hint
    const hint = document.createElement('div');
    hint.className = 'da-sim-phase-hint';
    hint.textContent = 'Click beads to move them toward the bar. Upper beads = 5, lower beads = 1.';
    hint.setAttribute('aria-live', 'polite');
    wrapper.appendChild(hint);

    // Frame
    const frame = document.createElement('div');
    frame.className = 'da-sim-suanpan-frame';
    frame.setAttribute('role', 'group');
    frame.setAttribute('aria-label', 'Suanpan with four rods');

    const rodDefs = [
      { label: 'Thousands', multiplier: 1000 },
      { label: 'Hundreds', multiplier: 100 },
      { label: 'Tens', multiplier: 10 },
      { label: 'Ones', multiplier: 1 },
    ];

    this.rods = rodDefs.map((def) => {
      const rod = document.createElement('div');
      rod.className = 'da-sim-suanpan-rod';

      const label = document.createElement('div');
      label.className = 'da-sim-suanpan-rod-label';
      label.textContent = def.label;

      // Heaven section (2 beads, each worth 5)
      const heavenSection = document.createElement('div');
      heavenSection.className = 'da-sim-suanpan-heaven';

      const heavenBeads: HTMLElement[] = [];
      for (let i = 0; i < 2; i++) {
        const bead = document.createElement('button');
        bead.type = 'button';
        bead.className = 'da-sim-bead da-sim-bead--heaven';
        bead.setAttribute('aria-label', `${def.label} heaven bead ${i + 1} (worth 5) - inactive`);
        bead.setAttribute('aria-pressed', 'false');
        heavenBeads.push(bead);
        heavenSection.appendChild(bead);
      }

      // Dividing bar
      const bar = document.createElement('div');
      bar.className = 'da-sim-suanpan-bar';

      // Earth section (5 beads, each worth 1)
      const earthSection = document.createElement('div');
      earthSection.className = 'da-sim-suanpan-earth';

      const earthBeads: HTMLElement[] = [];
      for (let i = 0; i < 5; i++) {
        const bead = document.createElement('button');
        bead.type = 'button';
        bead.className = 'da-sim-bead da-sim-bead--earth';
        bead.setAttribute('aria-label', `${def.label} earth bead ${i + 1} (worth 1) - inactive`);
        bead.setAttribute('aria-pressed', 'false');
        earthBeads.push(bead);
        earthSection.appendChild(bead);
      }

      // Value display
      const valueDisplay = document.createElement('div');
      valueDisplay.className = 'da-sim-suanpan-value';
      valueDisplay.textContent = '0';
      valueDisplay.setAttribute('aria-live', 'polite');

      rod.appendChild(label);
      rod.appendChild(heavenSection);
      rod.appendChild(bar);
      rod.appendChild(earthSection);
      rod.appendChild(valueDisplay);
      frame.appendChild(rod);

      const state: RodState = {
        label: def.label,
        heavenActive: 0,
        earthActive: 0,
        element: rod,
        heavenBeads,
        earthBeads,
        valueDisplay,
      };

      // Wire bead click handlers
      heavenBeads.forEach((bead, idx) => {
        bead.addEventListener('click', () => this.toggleHeavenBead(state, idx));
      });
      earthBeads.forEach((bead, idx) => {
        bead.addEventListener('click', () => this.toggleEarthBead(state, idx));
      });

      return state;
    });

    wrapper.appendChild(frame);

    // Total display
    const totalRow = document.createElement('div');
    totalRow.className = 'da-sim-suanpan-total';
    totalRow.setAttribute('aria-live', 'polite');
    totalRow.textContent = 'Total: 0';
    wrapper.appendChild(totalRow);

    return wrapper;
  }

  private toggleHeavenBead(rod: RodState, idx: number): void {
    // Toggle: activating bead idx means all beads from idx down are active
    // (beads pushed toward bar)
    const isCurrentlyActive = rod.heavenBeads[idx].classList.contains('da-sim-bead--active');

    if (isCurrentlyActive) {
      // Deactivate this and any below (further from bar)
      for (let i = idx; i < rod.heavenBeads.length; i++) {
        rod.heavenBeads[i].classList.remove('da-sim-bead--active');
        rod.heavenBeads[i].setAttribute('aria-pressed', 'false');
        rod.heavenBeads[i].setAttribute('aria-label',
          rod.heavenBeads[i].getAttribute('aria-label')!.replace('active', 'inactive'));
      }
      rod.heavenActive = idx;
    } else {
      // Activate this and all above (closer to bar means lower index)
      for (let i = 0; i <= idx; i++) {
        rod.heavenBeads[i].classList.add('da-sim-bead--active');
        rod.heavenBeads[i].setAttribute('aria-pressed', 'true');
        rod.heavenBeads[i].setAttribute('aria-label',
          rod.heavenBeads[i].getAttribute('aria-label')!.replace('inactive', 'active'));
      }
      rod.heavenActive = idx + 1;
      this.hasActivatedHeaven = true;
    }

    this.updateRodDisplay(rod);
    this.updateTotal();
    this.checkObjectives();
  }

  private toggleEarthBead(rod: RodState, idx: number): void {
    const isCurrentlyActive = rod.earthBeads[idx].classList.contains('da-sim-bead--active');

    if (isCurrentlyActive) {
      // Deactivate this and any above (further from bar)
      for (let i = idx; i >= 0; i--) {
        rod.earthBeads[i].classList.remove('da-sim-bead--active');
        rod.earthBeads[i].setAttribute('aria-pressed', 'false');
      }
      rod.earthActive = idx > 0 ? idx : 0;
      // Recalculate: count remaining active beads
      rod.earthActive = 0;
      for (const bead of rod.earthBeads) {
        if (bead.classList.contains('da-sim-bead--active')) rod.earthActive++;
      }
    } else {
      // Activate this and all below (closer to bar means higher index)
      for (let i = rod.earthBeads.length - 1; i >= idx; i--) {
        rod.earthBeads[i].classList.add('da-sim-bead--active');
        rod.earthBeads[i].setAttribute('aria-pressed', 'true');
      }
      rod.earthActive = rod.earthBeads.length - idx;
      this.hasActivatedEarth = true;
    }

    this.updateRodDisplay(rod);
    this.updateTotal();
    this.checkObjectives();
  }

  private getRodValue(rod: RodState): number {
    return rod.heavenActive * 5 + rod.earthActive;
  }

  private updateRodDisplay(rod: RodState): void {
    if (rod.valueDisplay) {
      rod.valueDisplay.textContent = String(this.getRodValue(rod));
    }
  }

  private updateTotal(): void {
    const multipliers = [1000, 100, 10, 1];
    let total = 0;
    this.rods.forEach((rod, i) => {
      total += this.getRodValue(rod) * multipliers[i];
    });
    const totalEl = this.element?.querySelector('.da-sim-suanpan-total');
    if (totalEl) {
      totalEl.textContent = `Total: ${total}`;
    }
  }

  private getRodValues(): number[] {
    return this.rods.map((r) => this.getRodValue(r));
  }

  private checkObjectives(): void {
    const values = this.getRodValues();

    // obj-1: Understand 2/5 system — user activates both a heaven and earth bead
    if (this.hasActivatedHeaven && this.hasActivatedEarth) {
      this.markObjectiveComplete('obj-1');
    }

    // obj-2: Represent 3,456
    if (values[0] === 3 && values[1] === 4 && values[2] === 5 && values[3] === 6) {
      this.markObjectiveComplete('obj-2');
    }

    // obj-3: Add 2,789 → result should be 6,245
    if (values[0] === 6 && values[1] === 2 && values[2] === 4 && values[3] === 5) {
      this.markObjectiveComplete('obj-3');
    }

    // obj-4/obj-5: Subtract 4,123 → result should be 2,122
    if (values[0] === 2 && values[1] === 1 && values[2] === 2 && values[3] === 2) {
      this.markObjectiveComplete('obj-4');
      this.markObjectiveComplete('obj-5');
    }
  }

  protected resetState(): void {
    this.hasActivatedHeaven = false;
    this.hasActivatedEarth = false;
    for (const rod of this.rods) {
      rod.heavenActive = 0;
      rod.earthActive = 0;
      for (const bead of rod.heavenBeads) {
        bead.classList.remove('da-sim-bead--active');
        bead.setAttribute('aria-pressed', 'false');
      }
      for (const bead of rod.earthBeads) {
        bead.classList.remove('da-sim-bead--active');
        bead.setAttribute('aria-pressed', 'false');
      }
      this.updateRodDisplay(rod);
    }
    this.updateTotal();
  }

  protected destroySimulator(): void {
    this.rods = [];
  }
}
