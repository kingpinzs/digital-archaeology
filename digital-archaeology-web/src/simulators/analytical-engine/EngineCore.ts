// src/simulators/analytical-engine/EngineCore.ts
// Execution engine: Store (memory), Mill (ALU), card pointer, branching

import type { Card, ProgramEntry } from './CardTypes';
import { isLabel } from './CardTypes';

/** Status of the Mill (ALU) */
export type MillStatus = 'IDLE' | 'COMPUTING' | 'DONE' | 'ERROR';

/** Callback events from the engine */
export interface EngineCoreCallbacks {
  onStoreRead?: (column: string, value: number) => void;
  onStoreWrite?: (column: string, value: number) => void;
  onMillOperation?: (op: string, inputA: number, inputB: number, result: number) => void;
  onMillStatusChange?: (status: MillStatus) => void;
  onCardPointerChange?: (index: number) => void;
  onPrint?: (value: number) => void;
  onHalt?: () => void;
  onError?: (message: string) => void;
  onBranch?: (taken: boolean) => void;
}

/**
 * EngineCore executes Analytical Engine programs.
 * 16 store columns (v0-v15), a mill (ALU), and a card pointer.
 */
export class EngineCore {
  /** Store: 16 columns, each an integer */
  private store: number[] = new Array(16).fill(0);
  /** Program: flat list of entries (cards + labels) */
  private program: ProgramEntry[] = [];
  /** Card pointer: index into program */
  private cardPointer = 0;
  /** Label map: label name → program index */
  private labelMap: Map<string, number> = new Map();
  /** Mill status */
  private millStatus: MillStatus = 'IDLE';
  /** Whether the engine has halted */
  private halted = false;

  private callbacks: EngineCoreCallbacks = {};

  /** Printer output values */
  private output: number[] = [];

  setCallbacks(callbacks: EngineCoreCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Load a program into the engine.
   */
  loadProgram(entries: ProgramEntry[]): void {
    this.program = entries;
    this.buildLabelMap();
    this.reset();
  }

  /**
   * Reset engine state (store, pointer) but keep the loaded program.
   */
  reset(): void {
    this.store.fill(0);
    this.cardPointer = 0;
    this.halted = false;
    this.output = [];
    this.setMillStatus('IDLE');
    this.callbacks.onCardPointerChange?.(0);
  }

  /**
   * Get all store values.
   */
  getStore(): number[] {
    return [...this.store];
  }

  /**
   * Get a store column value by name (e.g., "v0").
   */
  getColumn(name: string): number {
    const idx = this.columnIndex(name);
    return idx >= 0 ? this.store[idx] : 0;
  }

  /**
   * Get the current card pointer index.
   */
  getCardPointer(): number {
    return this.cardPointer;
  }

  /**
   * Get the mill status.
   */
  getMillStatus(): MillStatus {
    return this.millStatus;
  }

  /**
   * Check if the engine has halted.
   */
  isHalted(): boolean {
    return this.halted;
  }

  /**
   * Get all printed output values.
   */
  getOutput(): number[] {
    return [...this.output];
  }

  /**
   * Execute one step (the card at the current pointer).
   * Returns true if execution can continue, false if halted or at end.
   */
  step(): boolean {
    if (this.halted || this.cardPointer >= this.program.length) {
      return false;
    }

    const entry = this.program[this.cardPointer];

    // Skip labels
    if (isLabel(entry)) {
      this.cardPointer++;
      this.callbacks.onCardPointerChange?.(this.cardPointer);
      return this.cardPointer < this.program.length && !this.halted;
    }

    const card = entry as Card;
    this.executeCard(card);

    return !this.halted && this.cardPointer < this.program.length;
  }

  /**
   * Execute a single card instruction.
   */
  private executeCard(card: Card): void {
    switch (card.opcode) {
      case 'LOAD':
        this.execLoad(card);
        break;
      case 'ADD':
        this.execArithmetic(card, (a, b) => a + b, 'ADD');
        break;
      case 'SUB':
        this.execArithmetic(card, (a, b) => a - b, 'SUBTRACT');
        break;
      case 'MUL':
        this.execArithmetic(card, (a, b) => a * b, 'MULTIPLY');
        break;
      case 'DIV':
        this.execDiv(card);
        break;
      case 'MOV':
        this.execMov(card);
        break;
      case 'BRZ':
        this.execBranch(card, (v) => v === 0);
        return; // execBranch sets pointer directly
      case 'BRN':
        this.execBranch(card, (v) => v < 0);
        return; // execBranch sets pointer directly
      case 'JMP':
        this.execJmp(card);
        return; // execJmp sets pointer directly
      case 'PRINT':
        this.execPrint(card);
        break;
      case 'HLT':
        this.halted = true;
        this.setMillStatus('IDLE');
        this.callbacks.onHalt?.();
        this.cardPointer++;
        this.callbacks.onCardPointerChange?.(this.cardPointer);
        return;
    }

    // Advance pointer for non-branching instructions
    this.cardPointer++;
    this.callbacks.onCardPointerChange?.(this.cardPointer);
  }

  private execLoad(card: Card): void {
    const dest = card.dest!;
    const value = parseInt(card.srcB!, 10);
    this.writeStore(dest, value);
    this.setMillStatus('DONE');
  }

  private execArithmetic(card: Card, op: (a: number, b: number) => number, opName: string): void {
    const a = this.readStore(card.srcA!);
    const b = this.readStore(card.srcB!);
    this.setMillStatus('COMPUTING');
    const result = op(a, b);
    this.writeStore(card.dest!, result);
    this.callbacks.onMillOperation?.(opName, a, b, result);
    this.setMillStatus('DONE');
  }

  private execDiv(card: Card): void {
    const a = this.readStore(card.srcA!);
    const b = this.readStore(card.srcB!);
    if (b === 0) {
      this.setMillStatus('ERROR');
      this.callbacks.onError?.('Division by zero');
      this.halted = true;
      return;
    }
    this.setMillStatus('COMPUTING');
    const result = Math.trunc(a / b);
    this.writeStore(card.dest!, result);
    this.callbacks.onMillOperation?.('DIVIDE', a, b, result);
    this.setMillStatus('DONE');
  }

  private execMov(card: Card): void {
    const value = this.readStore(card.srcA!);
    this.writeStore(card.dest!, value);
    this.setMillStatus('DONE');
  }

  private execBranch(card: Card, condition: (v: number) => boolean): void {
    const value = this.readStore(card.srcA!);
    const taken = condition(value);
    this.callbacks.onBranch?.(taken);

    if (taken && card.label) {
      const target = this.labelMap.get(card.label);
      if (target !== undefined) {
        this.cardPointer = target;
        this.callbacks.onCardPointerChange?.(this.cardPointer);
        return;
      }
    }
    this.cardPointer++;
    this.callbacks.onCardPointerChange?.(this.cardPointer);
  }

  private execJmp(card: Card): void {
    if (card.label) {
      const target = this.labelMap.get(card.label);
      if (target !== undefined) {
        this.cardPointer = target;
        this.callbacks.onCardPointerChange?.(this.cardPointer);
        return;
      }
    }
    // Fallthrough: just advance
    this.cardPointer++;
    this.callbacks.onCardPointerChange?.(this.cardPointer);
  }

  private execPrint(card: Card): void {
    const value = this.readStore(card.srcA!);
    this.output.push(value);
    this.callbacks.onPrint?.(value);
  }

  private readStore(name: string): number {
    const idx = this.columnIndex(name);
    if (idx < 0) return 0;
    const value = this.store[idx];
    this.callbacks.onStoreRead?.(name, value);
    return value;
  }

  private writeStore(name: string, value: number): void {
    const idx = this.columnIndex(name);
    if (idx < 0) return;
    this.store[idx] = value;
    this.callbacks.onStoreWrite?.(name, value);
  }

  private columnIndex(name: string): number {
    if (name.startsWith('v')) {
      const idx = parseInt(name.substring(1), 10);
      if (idx >= 0 && idx < 16) return idx;
    }
    return -1;
  }

  private setMillStatus(status: MillStatus): void {
    this.millStatus = status;
    this.callbacks.onMillStatusChange?.(status);
  }

  /**
   * Build label map from program entries.
   */
  private buildLabelMap(): void {
    this.labelMap.clear();
    for (let i = 0; i < this.program.length; i++) {
      const entry = this.program[i];
      if (isLabel(entry)) {
        this.labelMap.set(entry.name, i);
      }
    }
  }
}
