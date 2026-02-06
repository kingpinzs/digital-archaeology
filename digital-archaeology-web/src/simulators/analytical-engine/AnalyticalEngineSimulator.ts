// src/simulators/analytical-engine/AnalyticalEngineSimulator.ts
// Main Analytical Engine simulator - orchestrates Store, Mill, CardEditor, Printer

import { BaseSimulator } from '../BaseSimulator';
import { EngineCore } from './EngineCore';
import type { EngineCoreCallbacks } from './EngineCore';
import { StoreDisplay } from './StoreDisplay';
import { MillDisplay } from './MillDisplay';
import { PrinterDisplay } from './PrinterDisplay';
import { CardEditor } from './CardEditor';
import type { ProgramEntry } from './CardTypes';
import { SAMPLE_PROGRAMS } from './SamplePrograms';

/**
 * AnalyticalEngineSimulator is the fully programmable simulator for Act 0.
 * Layout: Store (left) | Mill + Printer (center) | Card Editor (right)
 * With execution controls (Step, Run, Pause, Reset, Speed).
 */
export class AnalyticalEngineSimulator extends BaseSimulator {
  private engine: EngineCore = new EngineCore();
  private storeDisplay: StoreDisplay | null = null;
  private millDisplay: MillDisplay | null = null;
  private printerDisplay: PrinterDisplay | null = null;
  private cardEditor: CardEditor | null = null;

  // Execution state
  private runInterval: ReturnType<typeof setInterval> | null = null;
  private speedMs = 500;
  private isRunning = false;

  // Objective tracking
  private hasLoadedValue = false;
  private hasExecutedArithmetic = false;
  private hasBranched = false;
  private programCardCount = 0;

  protected renderSimulator(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'da-sim-analytical-engine';

    // Title
    const title = document.createElement('h3');
    title.className = 'da-sim-display';
    title.textContent = "Babbage's Analytical Engine";
    wrapper.appendChild(title);

    // 3-column layout
    const layout = document.createElement('div');
    layout.className = 'da-sim-ae-layout';

    // Left: Store
    const storeMount = document.createElement('div');
    storeMount.className = 'da-sim-ae-store-mount';
    this.storeDisplay = new StoreDisplay();
    this.storeDisplay.mount(storeMount);

    // Center: Mill + Printer
    const centerCol = document.createElement('div');
    centerCol.className = 'da-sim-ae-center';

    const millMount = document.createElement('div');
    millMount.className = 'da-sim-ae-mill-mount';
    this.millDisplay = new MillDisplay();
    this.millDisplay.mount(millMount);

    const printerMount = document.createElement('div');
    printerMount.className = 'da-sim-ae-printer-mount';
    this.printerDisplay = new PrinterDisplay();
    this.printerDisplay.mount(printerMount);

    centerCol.appendChild(millMount);
    centerCol.appendChild(printerMount);

    // Right: Card Editor
    const cardsMount = document.createElement('div');
    cardsMount.className = 'da-sim-ae-cards-mount';
    this.cardEditor = new CardEditor();
    this.cardEditor.mount(cardsMount);
    this.cardEditor.setOnProgramChange((entries) => this.handleProgramChange(entries));

    layout.appendChild(storeMount);
    layout.appendChild(centerCol);
    layout.appendChild(cardsMount);
    wrapper.appendChild(layout);

    // Controls
    const controls = this.renderControls();
    wrapper.appendChild(controls);

    // Wire engine callbacks
    this.wireEngineCallbacks();

    return wrapper;
  }

  private renderControls(): HTMLElement {
    const controls = document.createElement('div');
    controls.className = 'da-sim-ae-controls';
    controls.setAttribute('role', 'toolbar');
    controls.setAttribute('aria-label', 'Execution controls');

    const stepBtn = this.createButton('Step', 'Execute one instruction', () => this.handleStep());
    const runBtn = this.createButton('Run', 'Run program continuously', () => this.handleRun());
    const pauseBtn = this.createButton('Pause', 'Pause execution', () => this.handlePause());
    const resetBtn = this.createButton('Reset', 'Reset engine state', () => this.handleReset());

    controls.appendChild(stepBtn);
    controls.appendChild(runBtn);
    controls.appendChild(pauseBtn);
    controls.appendChild(resetBtn);

    // Speed slider
    const speedGroup = document.createElement('div');
    speedGroup.className = 'da-sim-ae-speed-group';

    const speedLabel = document.createElement('label');
    speedLabel.className = 'da-sim-ae-speed-label';
    speedLabel.textContent = 'Speed:';

    const speedSlider = document.createElement('input');
    speedSlider.type = 'range';
    speedSlider.className = 'da-sim-ae-speed-slider';
    speedSlider.min = '100';
    speedSlider.max = '2000';
    speedSlider.value = '500';
    speedSlider.setAttribute('aria-label', 'Execution speed (ms per step)');
    speedSlider.addEventListener('input', () => {
      this.speedMs = parseInt(speedSlider.value, 10);
      if (this.isRunning) {
        this.handlePause();
        this.handleRun();
      }
    });

    speedLabel.htmlFor = 'ae-speed';
    speedSlider.id = 'ae-speed';

    speedGroup.appendChild(speedLabel);
    speedGroup.appendChild(speedSlider);
    controls.appendChild(speedGroup);

    return controls;
  }

  private createButton(text: string, ariaLabel: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'da-sim-ae-control-btn';
    btn.textContent = text;
    btn.setAttribute('aria-label', ariaLabel);
    btn.addEventListener('click', onClick);
    return btn;
  }

  private wireEngineCallbacks(): void {
    const callbacks: EngineCoreCallbacks = {
      onStoreRead: (col) => {
        this.storeDisplay?.pulseRead(col);
      },
      onStoreWrite: (col, value) => {
        this.storeDisplay?.pulseWrite(col, value);
        this.hasLoadedValue = true;
        this.checkObjectives();
      },
      onMillOperation: (op, a, b, result) => {
        this.millDisplay?.setOperation(op, a, b, result);
        this.hasExecutedArithmetic = true;
        this.checkObjectives();
      },
      onMillStatusChange: (status) => {
        this.millDisplay?.setStatus(status);
      },
      onCardPointerChange: (idx) => {
        this.cardEditor?.setCurrentCard(idx);
      },
      onPrint: (value) => {
        this.printerDisplay?.printValue(value);
      },
      onHalt: () => {
        this.handlePause();
        this.checkObjectives();
      },
      onError: (msg) => {
        this.handlePause();
        console.warn('Analytical Engine error:', msg);
      },
      onBranch: () => {
        this.hasBranched = true;
        this.checkObjectives();
      },
    };
    this.engine.setCallbacks(callbacks);
  }

  private handleProgramChange(entries: ProgramEntry[]): void {
    this.programCardCount = entries.length;
    this.engine.loadProgram(entries);
    this.storeDisplay?.reset();
    this.millDisplay?.reset();
    this.printerDisplay?.clear();
    this.checkObjectives();
  }

  private handleStep(): void {
    this.engine.step();
  }

  private handleRun(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.runInterval = setInterval(() => {
      const canContinue = this.engine.step();
      if (!canContinue) {
        this.handlePause();
      }
    }, this.speedMs);
  }

  private handlePause(): void {
    this.isRunning = false;
    if (this.runInterval !== null) {
      clearInterval(this.runInterval);
      this.runInterval = null;
    }
  }

  private handleReset(): void {
    this.handlePause();
    this.engine.reset();
    this.storeDisplay?.reset();
    this.millDisplay?.reset();
    this.printerDisplay?.clear();
    this.cardEditor?.setCurrentCard(0);
  }

  private checkObjectives(): void {
    // obj-1: Design the Store — user loads a value into any column
    if (this.hasLoadedValue) {
      this.markObjectiveComplete('obj-1');
    }

    // obj-2: Design the Mill — an arithmetic operation executes
    if (this.hasExecutedArithmetic) {
      this.markObjectiveComplete('obj-2');
    }

    // obj-3: Card-based instruction input — program has 3+ cards
    if (this.programCardCount >= 3) {
      this.markObjectiveComplete('obj-3');
    }

    // obj-4: Conditional branching — a BRZ or BRN executes
    if (this.hasBranched) {
      this.markObjectiveComplete('obj-4');
    }

    // obj-5: Execute Ada's Bernoulli algorithm
    // Check if the last sample (Bernoulli) was loaded and ran to completion
    if (this.engine.isHalted()) {
      const output = this.engine.getOutput();
      const bernoulli = SAMPLE_PROGRAMS[3];
      if (bernoulli) {
        const expected = bernoulli.expectedOutput.split(', ').map(Number);
        if (output.length === expected.length &&
            output.every((v, i) => v === expected[i])) {
          this.markObjectiveComplete('obj-5');
        }
      }
    }
  }

  protected resetState(): void {
    this.handlePause();
    this.hasLoadedValue = false;
    this.hasExecutedArithmetic = false;
    this.hasBranched = false;
    this.programCardCount = 0;
    this.engine.reset();
    this.storeDisplay?.reset();
    this.millDisplay?.reset();
    this.printerDisplay?.clear();
    this.cardEditor?.reset();
  }

  protected destroySimulator(): void {
    this.handlePause();
    this.storeDisplay?.destroy();
    this.millDisplay?.destroy();
    this.printerDisplay?.destroy();
    this.cardEditor?.destroy();
    this.storeDisplay = null;
    this.millDisplay = null;
    this.printerDisplay = null;
    this.cardEditor = null;
  }
}
