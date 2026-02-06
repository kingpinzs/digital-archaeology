// src/simulators/analytical-engine/CardEditor.ts
// Visual card builder + text DSL toggle for the Analytical Engine

import type { ProgramEntry, Opcode } from './CardTypes';
import { isLabel, parseProgram, programToText, parseLine, resetCardIdCounter } from './CardTypes';
import { SAMPLE_PROGRAMS } from './SamplePrograms';

/** Callback when program changes */
export type OnProgramChange = (entries: ProgramEntry[]) => void;

/**
 * CardEditor provides dual-mode program editing:
 * - Visual mode: card list with add/delete/reorder
 * - Text mode: textarea with DSL syntax
 */
export class CardEditor {
  private container: HTMLElement | null = null;
  private element: HTMLElement | null = null;
  private entries: ProgramEntry[] = [];
  private mode: 'visual' | 'text' = 'visual';
  private onProgramChange: OnProgramChange | null = null;
  private currentCardIndex = -1;

  // DOM refs
  private cardListEl: HTMLElement | null = null;
  private textAreaEl: HTMLTextAreaElement | null = null;
  private visualPanel: HTMLElement | null = null;
  private textPanel: HTMLElement | null = null;

  mount(container: HTMLElement): void {
    this.container = container;
    this.element = this.render();
    this.container.appendChild(this.element);
  }

  setOnProgramChange(callback: OnProgramChange): void {
    this.onProgramChange = callback;
  }

  /**
   * Get the current program entries.
   */
  getEntries(): ProgramEntry[] {
    return [...this.entries];
  }

  /**
   * Load entries and display them.
   */
  setEntries(entries: ProgramEntry[]): void {
    this.entries = entries;
    this.syncToCurrentMode();
  }

  /**
   * Highlight the current card pointer.
   */
  setCurrentCard(index: number): void {
    this.currentCardIndex = index;
    if (this.mode === 'visual') {
      this.updateCardHighlight();
    }
  }

  /**
   * Reset to empty state.
   */
  reset(): void {
    this.entries = [];
    this.currentCardIndex = -1;
    this.syncToCurrentMode();
  }

  destroy(): void {
    this.element?.remove();
    this.element = null;
    this.container = null;
    this.cardListEl = null;
    this.textAreaEl = null;
    this.visualPanel = null;
    this.textPanel = null;
    this.onProgramChange = null;
  }

  private render(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'da-sim-ae-cards';

    // Mode toggle
    const toggleRow = document.createElement('div');
    toggleRow.className = 'da-sim-ae-cards-toggle';

    const visualBtn = document.createElement('button');
    visualBtn.type = 'button';
    visualBtn.className = 'da-sim-ae-cards-toggle-btn da-sim-ae-cards-toggle-btn--active';
    visualBtn.textContent = 'Visual';
    visualBtn.setAttribute('aria-pressed', 'true');

    const textBtn = document.createElement('button');
    textBtn.type = 'button';
    textBtn.className = 'da-sim-ae-cards-toggle-btn';
    textBtn.textContent = 'Text';
    textBtn.setAttribute('aria-pressed', 'false');

    visualBtn.addEventListener('click', () => this.switchMode('visual', visualBtn, textBtn));
    textBtn.addEventListener('click', () => this.switchMode('text', visualBtn, textBtn));

    toggleRow.appendChild(visualBtn);
    toggleRow.appendChild(textBtn);
    wrapper.appendChild(toggleRow);

    // Visual panel
    this.visualPanel = document.createElement('div');
    this.visualPanel.className = 'da-sim-ae-cards-visual';

    this.cardListEl = document.createElement('div');
    this.cardListEl.className = 'da-sim-ae-card-list';
    this.cardListEl.setAttribute('role', 'list');
    this.visualPanel.appendChild(this.cardListEl);

    // Add card button
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'da-sim-ae-card-add';
    addBtn.textContent = '+ Add Card';
    addBtn.setAttribute('aria-label', 'Add a new instruction card');
    addBtn.addEventListener('click', () => this.showAddCardForm());
    this.visualPanel.appendChild(addBtn);

    wrapper.appendChild(this.visualPanel);

    // Text panel (hidden by default)
    this.textPanel = document.createElement('div');
    this.textPanel.className = 'da-sim-ae-cards-text da-sim-ae-cards-text--hidden';

    this.textAreaEl = document.createElement('textarea');
    this.textAreaEl.className = 'da-sim-ae-text-editor';
    this.textAreaEl.setAttribute('aria-label', 'Program source code in DSL format');
    this.textAreaEl.spellcheck = false;
    this.textAreaEl.placeholder = 'Enter program...\nOne instruction per line.\nLabels start with :\nComments start with ;';

    const parseBtn = document.createElement('button');
    parseBtn.type = 'button';
    parseBtn.className = 'da-sim-ae-text-parse';
    parseBtn.textContent = 'Apply';
    parseBtn.setAttribute('aria-label', 'Parse text and update visual cards');
    parseBtn.addEventListener('click', () => this.parseTextMode());

    this.textPanel.appendChild(this.textAreaEl);
    this.textPanel.appendChild(parseBtn);
    wrapper.appendChild(this.textPanel);

    // Load sample dropdown
    const sampleRow = document.createElement('div');
    sampleRow.className = 'da-sim-ae-sample-row';

    const sampleSelect = document.createElement('select');
    sampleSelect.className = 'da-sim-ae-sample-select';
    sampleSelect.setAttribute('aria-label', 'Load a sample program');

    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = 'Load Sample...';
    sampleSelect.appendChild(defaultOpt);

    SAMPLE_PROGRAMS.forEach((prog, i) => {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = prog.name;
      sampleSelect.appendChild(opt);
    });

    sampleSelect.addEventListener('change', () => {
      const idx = parseInt(sampleSelect.value, 10);
      if (!isNaN(idx) && idx >= 0 && idx < SAMPLE_PROGRAMS.length) {
        this.loadSample(idx);
        sampleSelect.value = '';
      }
    });

    sampleRow.appendChild(sampleSelect);
    wrapper.appendChild(sampleRow);

    return wrapper;
  }

  private switchMode(mode: 'visual' | 'text', visualBtn: HTMLElement, textBtn: HTMLElement): void {
    if (mode === this.mode) return;

    // Sync content before switching
    if (this.mode === 'text') {
      this.parseTextMode();
    } else {
      this.syncTextFromVisual();
    }

    this.mode = mode;

    if (mode === 'visual') {
      this.visualPanel?.classList.remove('da-sim-ae-cards-visual--hidden');
      this.textPanel?.classList.add('da-sim-ae-cards-text--hidden');
      visualBtn.classList.add('da-sim-ae-cards-toggle-btn--active');
      visualBtn.setAttribute('aria-pressed', 'true');
      textBtn.classList.remove('da-sim-ae-cards-toggle-btn--active');
      textBtn.setAttribute('aria-pressed', 'false');
      this.renderVisualCards();
    } else {
      this.textPanel?.classList.remove('da-sim-ae-cards-text--hidden');
      this.visualPanel?.classList.add('da-sim-ae-cards-visual--hidden');
      textBtn.classList.add('da-sim-ae-cards-toggle-btn--active');
      textBtn.setAttribute('aria-pressed', 'true');
      visualBtn.classList.remove('da-sim-ae-cards-toggle-btn--active');
      visualBtn.setAttribute('aria-pressed', 'false');
      this.syncTextFromVisual();
    }
  }

  private renderVisualCards(): void {
    if (!this.cardListEl) return;
    this.cardListEl.innerHTML = '';

    this.entries.forEach((entry, idx) => {
      const card = document.createElement('div');
      card.setAttribute('role', 'listitem');

      if (isLabel(entry)) {
        card.className = 'da-sim-ae-card da-sim-ae-card--label';
        card.textContent = `:${entry.name}`;
      } else {
        card.className = 'da-sim-ae-card';
        if (idx === this.currentCardIndex) {
          card.classList.add('da-sim-ae-card--current');
        }

        const pointer = document.createElement('span');
        pointer.className = 'da-sim-ae-card-pointer';
        pointer.textContent = idx === this.currentCardIndex ? '\u25B6 ' : '  ';

        const text = document.createElement('span');
        text.className = 'da-sim-ae-card-text';
        text.textContent = entry.text;

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'da-sim-ae-card-delete';
        deleteBtn.textContent = '\u00D7';
        deleteBtn.setAttribute('aria-label', `Delete card: ${entry.text}`);
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.deleteCard(idx);
        });

        card.appendChild(pointer);
        card.appendChild(text);
        card.appendChild(deleteBtn);
      }

      this.cardListEl!.appendChild(card);
    });
  }

  private updateCardHighlight(): void {
    if (!this.cardListEl) return;
    const cards = this.cardListEl.querySelectorAll('.da-sim-ae-card');
    cards.forEach((card, idx) => {
      card.classList.toggle('da-sim-ae-card--current', idx === this.currentCardIndex);
      const pointer = card.querySelector('.da-sim-ae-card-pointer');
      if (pointer) {
        pointer.textContent = idx === this.currentCardIndex ? '\u25B6 ' : '  ';
      }
    });
  }

  private deleteCard(idx: number): void {
    this.entries.splice(idx, 1);
    this.renderVisualCards();
    this.notifyChange();
  }

  private showAddCardForm(): void {
    if (!this.visualPanel) return;

    // Remove existing form if any
    const existing = this.visualPanel.querySelector('.da-sim-ae-card-form');
    if (existing) {
      existing.remove();
      return;
    }

    const form = document.createElement('div');
    form.className = 'da-sim-ae-card-form';

    const opcodeSelect = document.createElement('select');
    opcodeSelect.setAttribute('aria-label', 'Instruction type');
    const opcodes: Opcode[] = ['LOAD', 'ADD', 'SUB', 'MUL', 'DIV', 'MOV', 'BRZ', 'BRN', 'JMP', 'PRINT', 'HLT'];
    opcodes.forEach((op) => {
      const opt = document.createElement('option');
      opt.value = op;
      opt.textContent = op;
      opcodeSelect.appendChild(opt);
    });

    const argsInput = document.createElement('input');
    argsInput.type = 'text';
    argsInput.placeholder = 'v0 42 (args)';
    argsInput.setAttribute('aria-label', 'Instruction arguments');

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.textContent = 'Add';
    addBtn.setAttribute('aria-label', 'Add this instruction');
    addBtn.addEventListener('click', () => {
      const line = `${opcodeSelect.value} ${argsInput.value}`.trim();
      const entry = parseLine(line);
      if (entry) {
        this.entries.push(entry);
        this.renderVisualCards();
        this.notifyChange();
        form.remove();
      }
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => form.remove());

    form.appendChild(opcodeSelect);
    form.appendChild(argsInput);
    form.appendChild(addBtn);
    form.appendChild(cancelBtn);
    this.visualPanel.appendChild(form);
  }

  private syncTextFromVisual(): void {
    if (this.textAreaEl) {
      this.textAreaEl.value = programToText(this.entries);
    }
  }

  private parseTextMode(): void {
    if (!this.textAreaEl) return;
    resetCardIdCounter();
    this.entries = parseProgram(this.textAreaEl.value);
    if (this.mode === 'visual') {
      this.renderVisualCards();
    }
    this.notifyChange();
  }

  private loadSample(idx: number): void {
    const sample = SAMPLE_PROGRAMS[idx];
    if (!sample) return;
    resetCardIdCounter();
    this.entries = parseProgram(sample.code);
    this.syncToCurrentMode();
    this.notifyChange();
  }

  private syncToCurrentMode(): void {
    if (this.mode === 'visual') {
      this.renderVisualCards();
    } else {
      this.syncTextFromVisual();
    }
  }

  private notifyChange(): void {
    this.onProgramChange?.([...this.entries]);
  }
}
