// src/visualizer/SignalValuesPanel.test.ts
// Unit tests for SignalValuesPanel component (Story 6.11)

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SignalValuesPanel } from './SignalValuesPanel';
import { CircuitModel } from './CircuitModel';
import type { CircuitData } from './types';

describe('SignalValuesPanel (Story 6.11)', () => {
  let container: HTMLElement;

  // Factory function to create fresh mock circuit data
  function createMockCircuitData(): CircuitData {
    return {
      cycle: 0,
      stable: true,
      wires: [
        { id: 0, name: 'pc', width: 8, is_input: false, is_output: false, state: [0, 0, 0, 0, 0, 0, 0, 0] },
        { id: 1, name: 'acc', width: 4, is_input: false, is_output: false, state: [0, 0, 0, 0] },
        { id: 2, name: 'mar', width: 8, is_input: false, is_output: false, state: [0, 0, 0, 0, 0, 0, 0, 0] },
        { id: 3, name: 'mdr', width: 4, is_input: false, is_output: false, state: [0, 0, 0, 0] },
        { id: 4, name: 'ir', width: 8, is_input: false, is_output: false, state: [0, 0, 0, 0, 0, 0, 0, 0] },
        { id: 5, name: 'opcode', width: 4, is_input: false, is_output: false, state: [0, 0, 0, 0] },
        { id: 6, name: 'z_flag', width: 1, is_input: false, is_output: false, state: [0] },
        { id: 7, name: 'pc_load', width: 1, is_input: false, is_output: false, state: [0] },
        { id: 8, name: 'pc_inc', width: 1, is_input: false, is_output: false, state: [1] },
        { id: 9, name: 'acc_load', width: 1, is_input: false, is_output: false, state: [0] },
        { id: 10, name: 'z_load', width: 1, is_input: false, is_output: false, state: [0] },
        { id: 11, name: 'ir_load', width: 1, is_input: false, is_output: false, state: [1] },
        { id: 12, name: 'mar_load', width: 1, is_input: false, is_output: false, state: [1] },
        { id: 13, name: 'mdr_load', width: 1, is_input: false, is_output: false, state: [0] },
      ],
      gates: [],
    };
  }

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    vi.useFakeTimers();
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.useRealTimers();
  });

  describe('mount()', () => {
    it('should create panel structure in container', () => {
      const panel = new SignalValuesPanel();
      panel.mount(container);

      expect(container.querySelector('.da-signal-values-panel')).not.toBeNull();
      panel.destroy();
    });

    it('should create registers section', () => {
      const panel = new SignalValuesPanel();
      panel.mount(container);

      expect(container.querySelector('.da-signal-registers')).not.toBeNull();
      panel.destroy();
    });

    it('should create control signals section by default', () => {
      const panel = new SignalValuesPanel();
      panel.mount(container);

      expect(container.querySelector('.da-signal-controls')).not.toBeNull();
      panel.destroy();
    });

    it('should hide control signals section when showControlSignals is false', () => {
      const panel = new SignalValuesPanel({ showControlSignals: false });
      panel.mount(container);

      expect(container.querySelector('.da-signal-controls')).toBeNull();
      panel.destroy();
    });

    it('should create signal rows for default registers', () => {
      const panel = new SignalValuesPanel();
      panel.mount(container);

      expect(container.querySelector('[data-signal="pc"]')).not.toBeNull();
      expect(container.querySelector('[data-signal="acc"]')).not.toBeNull();
      expect(container.querySelector('[data-signal="mar"]')).not.toBeNull();
      expect(container.querySelector('[data-signal="mdr"]')).not.toBeNull();
      expect(container.querySelector('[data-signal="ir"]')).not.toBeNull();
      expect(container.querySelector('[data-signal="opcode"]')).not.toBeNull();
      expect(container.querySelector('[data-signal="z_flag"]')).not.toBeNull();

      panel.destroy();
    });

    it('should create signal rows for control signals', () => {
      const panel = new SignalValuesPanel();
      panel.mount(container);

      expect(container.querySelector('[data-signal="pc_load"]')).not.toBeNull();
      expect(container.querySelector('[data-signal="acc_load"]')).not.toBeNull();
      expect(container.querySelector('[data-signal="ir_load"]')).not.toBeNull();

      panel.destroy();
    });

    it('should show proper labels for signals', () => {
      const panel = new SignalValuesPanel();
      panel.mount(container);

      const pcLabel = container.querySelector('[data-signal="pc"] .da-signal-label');
      expect(pcLabel?.textContent).toBe('PC');

      const accLabel = container.querySelector('[data-signal="acc"] .da-signal-label');
      expect(accLabel?.textContent).toBe('ACC');

      panel.destroy();
    });

    it('should use custom signals when provided', () => {
      const panel = new SignalValuesPanel({
        signals: [{ name: 'pc' }, { name: 'acc', label: 'ACCUM' }],
      });
      panel.mount(container);

      const registersSection = container.querySelector('.da-signal-registers .da-signal-section-content');
      const rows = registersSection?.querySelectorAll('.da-signal-row');
      expect(rows?.length).toBe(2);

      const accumLabel = container.querySelector('[data-signal="acc"] .da-signal-label');
      expect(accumLabel?.textContent).toBe('ACCUM');

      panel.destroy();
    });
  });

  describe('destroy()', () => {
    it('should clear container content', () => {
      const panel = new SignalValuesPanel();
      panel.mount(container);
      panel.destroy();

      expect(container.innerHTML).toBe('');
    });

    it('should clear highlight timeouts', () => {
      const panel = new SignalValuesPanel();
      panel.mount(container);

      const model = new CircuitModel(createMockCircuitData());
      panel.update(model);

      // Change a value to trigger highlight
      createMockCircuitData().wires[1].state = [1, 0, 0, 0];
      const model2 = new CircuitModel(createMockCircuitData());
      panel.update(model2);

      // Destroy before timeout expires
      panel.destroy();

      // Advance timers - should not throw
      vi.advanceTimersByTime(1000);
    });
  });

  describe('update()', () => {
    it('should update signal values from model', () => {
      const panel = new SignalValuesPanel();
      panel.mount(container);

      const model = new CircuitModel(createMockCircuitData());
      panel.update(model);

      const pcValue = container.querySelector('[data-signal="pc"] .da-signal-value');
      expect(pcValue?.textContent).toBe('00000000 (0x00)');

      panel.destroy();
    });

    it('should update single-bit signal values', () => {
      const panel = new SignalValuesPanel();
      panel.mount(container);

      const model = new CircuitModel(createMockCircuitData());
      panel.update(model);

      const zfValue = container.querySelector('[data-signal="z_flag"] .da-signal-value');
      expect(zfValue?.textContent).toBe('0');

      panel.destroy();
    });

    it('should update control signal values', () => {
      const panel = new SignalValuesPanel();
      panel.mount(container);

      const model = new CircuitModel(createMockCircuitData());
      panel.update(model);

      const pcIncValue = container.querySelector('[data-signal="pc_inc"] .da-signal-value');
      expect(pcIncValue?.textContent).toBe('1');

      panel.destroy();
    });

    it('should add highlight class when value changes', () => {
      const panel = new SignalValuesPanel();
      panel.mount(container);

      // Initial update with zeros
      const initialData = createMockCircuitData();
      const model1 = new CircuitModel(initialData);
      panel.update(model1);

      // Change accumulator value (wire index 1) from [0,0,0,0] to [1,0,0,0]
      const changedData = createMockCircuitData();
      changedData.wires[1].state = [1, 0, 0, 0];
      const model2 = new CircuitModel(changedData);
      panel.update(model2);

      const accValue = container.querySelector('[data-signal="acc"] .da-signal-value');
      expect(accValue?.classList.contains('da-signal-changed')).toBe(true);

      panel.destroy();
    });

    it('should remove highlight class after timeout', () => {
      const panel = new SignalValuesPanel();
      panel.mount(container);

      // Initial update
      const model1 = new CircuitModel(createMockCircuitData());
      panel.update(model1);

      // Change accumulator value
      const changedData = { ...createMockCircuitData() };
      changedData.wires = createMockCircuitData().wires.map((w, i) =>
        i === 1 ? { ...w, state: [1, 0, 0, 0] } : w
      );
      const model2 = new CircuitModel(changedData);
      panel.update(model2);

      // Advance timers past highlight duration
      vi.advanceTimersByTime(600);

      const accValue = container.querySelector('[data-signal="acc"] .da-signal-value');
      expect(accValue?.classList.contains('da-signal-changed')).toBe(false);

      panel.destroy();
    });

    it('should not highlight on first update (no previous state)', () => {
      const panel = new SignalValuesPanel();
      panel.mount(container);

      const model = new CircuitModel(createMockCircuitData());
      panel.update(model);

      const accValue = container.querySelector('[data-signal="acc"] .da-signal-value');
      expect(accValue?.classList.contains('da-signal-changed')).toBe(false);

      panel.destroy();
    });
  });

  describe('control section collapse', () => {
    it('should start collapsed by default', () => {
      const panel = new SignalValuesPanel();
      panel.mount(container);

      expect(panel.isControlSectionCollapsed()).toBe(true);
      expect(container.querySelector('.da-signal-controls')?.classList.contains('collapsed')).toBe(true);

      panel.destroy();
    });

    it('should start expanded when controlSignalsCollapsed is false', () => {
      const panel = new SignalValuesPanel({ controlSignalsCollapsed: false });
      panel.mount(container);

      expect(panel.isControlSectionCollapsed()).toBe(false);
      expect(container.querySelector('.da-signal-controls')?.classList.contains('collapsed')).toBe(false);

      panel.destroy();
    });

    it('should toggle collapse on header click', () => {
      const panel = new SignalValuesPanel();
      panel.mount(container);

      const header = container.querySelector('.da-signal-controls .da-signal-section-header');
      header?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(panel.isControlSectionCollapsed()).toBe(false);
      expect(container.querySelector('.da-signal-controls')?.classList.contains('collapsed')).toBe(false);

      panel.destroy();
    });

    it('should toggle collapse on Enter key', () => {
      const panel = new SignalValuesPanel();
      panel.mount(container);

      const header = container.querySelector('.da-signal-controls .da-signal-section-header');
      header?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

      expect(panel.isControlSectionCollapsed()).toBe(false);

      panel.destroy();
    });

    it('should toggle collapse on Space key', () => {
      const panel = new SignalValuesPanel();
      panel.mount(container);

      const header = container.querySelector('.da-signal-controls .da-signal-section-header');
      header?.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));

      expect(panel.isControlSectionCollapsed()).toBe(false);

      panel.destroy();
    });

    it('should update aria-expanded on toggle', () => {
      const panel = new SignalValuesPanel();
      panel.mount(container);

      const header = container.querySelector('.da-signal-controls .da-signal-section-header');
      expect(header?.getAttribute('aria-expanded')).toBe('false');

      header?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(header?.getAttribute('aria-expanded')).toBe('true');

      panel.destroy();
    });

    it('should have role="button" on section header', () => {
      const panel = new SignalValuesPanel();
      panel.mount(container);

      const header = container.querySelector('.da-signal-controls .da-signal-section-header');
      expect(header?.getAttribute('role')).toBe('button');

      panel.destroy();
    });

    it('should have tabindex on section header', () => {
      const panel = new SignalValuesPanel();
      panel.mount(container);

      const header = container.querySelector('.da-signal-controls .da-signal-section-header');
      expect(header?.getAttribute('tabindex')).toBe('0');

      panel.destroy();
    });

    it('setControlSectionCollapsed should update state', () => {
      const panel = new SignalValuesPanel();
      panel.mount(container);

      expect(panel.isControlSectionCollapsed()).toBe(true);

      panel.setControlSectionCollapsed(false);
      expect(panel.isControlSectionCollapsed()).toBe(false);

      panel.setControlSectionCollapsed(true);
      expect(panel.isControlSectionCollapsed()).toBe(true);

      panel.destroy();
    });
  });
});
