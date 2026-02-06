// src/simulators/CountingBoardSimulator.ts
// Mesopotamian counting board simulator (~3000 BC)
// Clay surface with pebbles on positional lines

import { BaseSimulator } from './BaseSimulator';

/** Column state: number of pebbles (0-9) */
interface ColumnState {
  label: string;
  value: number;
  element: HTMLElement | null;
  valueDisplay: HTMLElement | null;
  pebbleContainer: HTMLElement | null;
}

/**
 * CountingBoardSimulator renders a Mesopotamian counting board with 3 columns
 * (hundreds, tens, ones). Users add/remove pebbles and borrow across columns.
 */
export class CountingBoardSimulator extends BaseSimulator {
  private columns: ColumnState[] = [];
  private hasBorrowed = false;
  private hasRemovedPebble = false;

  protected renderSimulator(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'da-sim-counting-board';

    // Title
    const title = document.createElement('h3');
    title.className = 'da-sim-display';
    title.textContent = 'Mesopotamian Counting Board';
    wrapper.appendChild(title);

    // Phase hint
    const hint = document.createElement('div');
    hint.className = 'da-sim-phase-hint';
    hint.textContent = 'Place pebbles on lines to represent numbers. Each column is 10x the one to its right.';
    hint.setAttribute('aria-live', 'polite');
    wrapper.appendChild(hint);

    // Board surface
    const board = document.createElement('div');
    board.className = 'da-sim-counting-board-surface';
    board.setAttribute('role', 'group');
    board.setAttribute('aria-label', 'Counting board with three columns');

    const columnDefs = [
      { label: 'Hundreds', value: 0 },
      { label: 'Tens', value: 0 },
      { label: 'Ones', value: 0 },
    ];

    this.columns = columnDefs.map((def) => {
      const col = document.createElement('div');
      col.className = 'da-sim-counting-board-column';

      const label = document.createElement('div');
      label.className = 'da-sim-counting-board-label';
      label.textContent = def.label;

      const pebbleContainer = document.createElement('div');
      pebbleContainer.className = 'da-sim-counting-board-pebbles';
      pebbleContainer.setAttribute('aria-label', `${def.label} column pebbles`);

      const valueDisplay = document.createElement('div');
      valueDisplay.className = 'da-sim-counting-board-value';
      valueDisplay.textContent = '0';
      valueDisplay.setAttribute('aria-live', 'polite');

      // Buttons
      const btnRow = document.createElement('div');
      btnRow.className = 'da-sim-counting-board-btns';

      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'da-sim-counting-board-btn';
      addBtn.textContent = '+ Pebble';
      addBtn.setAttribute('aria-label', `Add pebble to ${def.label}`);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'da-sim-counting-board-btn';
      removeBtn.textContent = '- Pebble';
      removeBtn.setAttribute('aria-label', `Remove pebble from ${def.label}`);

      btnRow.appendChild(addBtn);
      btnRow.appendChild(removeBtn);

      col.appendChild(label);
      col.appendChild(pebbleContainer);
      col.appendChild(valueDisplay);
      col.appendChild(btnRow);
      board.appendChild(col);

      const state: ColumnState = {
        label: def.label,
        value: 0,
        element: col,
        valueDisplay,
        pebbleContainer,
      };

      addBtn.addEventListener('click', () => this.addPebble(state));
      removeBtn.addEventListener('click', () => this.removePebble(state));

      return state;
    });

    wrapper.appendChild(board);

    // Borrow button
    const borrowRow = document.createElement('div');
    borrowRow.className = 'da-sim-counting-board-borrow-row';

    const borrowBtn = document.createElement('button');
    borrowBtn.type = 'button';
    borrowBtn.className = 'da-sim-counting-board-btn da-sim-counting-board-btn--borrow';
    borrowBtn.textContent = 'Borrow (from higher column)';
    borrowBtn.setAttribute('aria-label', 'Borrow: take 1 from a higher column and add 10 to a lower column');
    borrowBtn.addEventListener('click', () => this.handleBorrow());
    borrowRow.appendChild(borrowBtn);
    wrapper.appendChild(borrowRow);

    // Total display
    const totalRow = document.createElement('div');
    totalRow.className = 'da-sim-counting-board-total';
    totalRow.setAttribute('aria-live', 'polite');
    totalRow.textContent = 'Total: 0';
    wrapper.appendChild(totalRow);

    return wrapper;
  }

  private addPebble(col: ColumnState): void {
    if (col.value >= 9) return;
    col.value++;
    this.updateColumnDisplay(col);
    this.updateTotal();
    this.checkObjectives();
  }

  private removePebble(col: ColumnState): void {
    if (col.value <= 0) return;
    col.value--;
    this.hasRemovedPebble = true;
    this.updateColumnDisplay(col);
    this.updateTotal();
    this.checkObjectives();
  }

  private handleBorrow(): void {
    // Find the rightmost column that is empty or needs borrowing, and the nearest higher column with value
    // Simple approach: borrow from first non-zero higher column into the next lower column
    for (let i = 0; i < this.columns.length - 1; i++) {
      if (this.columns[i].value > 0) {
        // Borrow from column i into column i+1
        this.columns[i].value--;
        this.columns[i + 1].value = Math.min(this.columns[i + 1].value + 10, 19);
        this.hasBorrowed = true;
        this.updateColumnDisplay(this.columns[i]);
        this.updateColumnDisplay(this.columns[i + 1]);
        this.updateTotal();
        this.checkObjectives();
        return;
      }
    }
  }

  private updateColumnDisplay(col: ColumnState): void {
    if (!col.valueDisplay || !col.pebbleContainer) return;
    col.valueDisplay.textContent = String(col.value);

    // Render pebbles
    col.pebbleContainer.innerHTML = '';
    for (let i = 0; i < col.value; i++) {
      const pebble = document.createElement('div');
      pebble.className = 'da-sim-pebble';
      pebble.setAttribute('aria-hidden', 'true');
      col.pebbleContainer.appendChild(pebble);
    }
  }

  private updateTotal(): void {
    const total = this.columns[0].value * 100 + this.columns[1].value * 10 + this.columns[2].value;
    const totalEl = this.element?.querySelector('.da-sim-counting-board-total');
    if (totalEl) {
      totalEl.textContent = `Total: ${total}`;
    }
  }

  private getColumnValues(): [number, number, number] {
    return [this.columns[0].value, this.columns[1].value, this.columns[2].value];
  }

  private checkObjectives(): void {
    const [h, t, o] = this.getColumnValues();

    // obj-1: Understand positional lines — add a pebble to any column
    if (h > 0 || t > 0 || o > 0) {
      this.markObjectiveComplete('obj-1');
    }

    // obj-2: Represent 147
    if (h === 1 && t === 4 && o === 7) {
      this.markObjectiveComplete('obj-2');
    }

    // obj-3: Perform subtraction — user removed a pebble
    if (this.hasRemovedPebble) {
      this.markObjectiveComplete('obj-3');
    }

    // obj-4: Handle borrowing
    if (this.hasBorrowed) {
      this.markObjectiveComplete('obj-4');
    }

    // obj-5: Calculate 147 - 89 = 58
    if (h === 0 && t === 5 && o === 8) {
      this.markObjectiveComplete('obj-5');
    }
  }

  protected resetState(): void {
    this.hasBorrowed = false;
    this.hasRemovedPebble = false;
    for (const col of this.columns) {
      col.value = 0;
      this.updateColumnDisplay(col);
    }
    this.updateTotal();
  }

  protected destroySimulator(): void {
    this.columns = [];
  }
}
