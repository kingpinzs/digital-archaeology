// src/debugger/MemoryView.test.ts
// Unit tests for MemoryView component (Story 5.5)

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MemoryView } from './MemoryView';

describe('MemoryView', () => {
  let container: HTMLDivElement;
  let memoryView: MemoryView;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    memoryView = new MemoryView();
  });

  afterEach(() => {
    memoryView.destroy();
    document.body.removeChild(container);
  });

  describe('mount', () => {
    it('should render memory section with title', () => {
      memoryView.mount(container);
      expect(container.querySelector('.da-memory-view')).not.toBeNull();
      expect(container.querySelector('.da-memory-view__title')?.textContent).toBe('Memory');
    });

    it('should render scrollable container', () => {
      memoryView.mount(container);
      const scroll = container.querySelector('.da-memory-view__scroll');
      expect(scroll).not.toBeNull();
    });

    it('should render table with header row', () => {
      memoryView.mount(container);
      const header = container.querySelector('.da-memory-header');
      expect(header).not.toBeNull();
      expect(header?.querySelector('.da-memory-addr')?.textContent).toBe('Addr');
    });

    it('should render column headers 0-F', () => {
      memoryView.mount(container);
      const header = container.querySelector('.da-memory-header');
      const hexHeaders = header?.querySelectorAll('.da-memory-hex');
      expect(hexHeaders?.length).toBe(16);
      expect(hexHeaders?.[0].textContent).toBe('0');
      expect(hexHeaders?.[15].textContent).toBe('F');
    });

    it('should display 16 data rows (256 bytes / 16 per row)', () => {
      memoryView.mount(container);
      const rows = container.querySelectorAll('.da-memory-row:not(.da-memory-header)');
      expect(rows.length).toBe(16);
    });

    it('should have data-address attributes on rows', () => {
      memoryView.mount(container);
      const firstRow = container.querySelector('[data-address="0"]');
      const secondRow = container.querySelector('[data-address="16"]');
      const lastRow = container.querySelector('[data-address="240"]');
      expect(firstRow).not.toBeNull();
      expect(secondRow).not.toBeNull();
      expect(lastRow).not.toBeNull();
    });

    it('should have aria-live on table for accessibility', () => {
      memoryView.mount(container);
      const table = container.querySelector('.da-memory-view__table');
      expect(table?.getAttribute('aria-live')).toBe('polite');
    });
  });

  describe('address column', () => {
    it('should show correct hex addresses for each row', () => {
      memoryView.mount(container);
      const rows = container.querySelectorAll('.da-memory-row:not(.da-memory-header)');

      expect(rows[0].querySelector('.da-memory-addr')?.textContent).toBe('0x00');
      expect(rows[1].querySelector('.da-memory-addr')?.textContent).toBe('0x10');
      expect(rows[2].querySelector('.da-memory-addr')?.textContent).toBe('0x20');
      expect(rows[15].querySelector('.da-memory-addr')?.textContent).toBe('0xF0');
    });
  });

  describe('memory cells', () => {
    it('should show initial zero values as 0', () => {
      memoryView.mount(container);
      const firstRow = container.querySelector('[data-address="0"]');
      const cells = firstRow?.querySelectorAll('.da-memory-cell');
      expect(cells?.[0].textContent).toBe('0');
    });

    it('should show nibble values as hex (0-F)', () => {
      memoryView.mount(container);

      // Create memory with values 0-15
      const memory = new Uint8Array(256);
      for (let i = 0; i < 16; i++) {
        memory[i] = i;
      }

      memoryView.updateState({ memory });

      const firstRow = container.querySelector('[data-address="0"]');
      const cells = firstRow?.querySelectorAll('.da-memory-cell');
      expect(cells?.[0].textContent).toBe('0');
      expect(cells?.[9].textContent).toBe('9');
      expect(cells?.[10].textContent).toBe('A');
      expect(cells?.[15].textContent).toBe('F');
    });

    it('should have data-offset attributes on cells', () => {
      memoryView.mount(container);
      const firstRow = container.querySelector('[data-address="0"]');
      const cells = firstRow?.querySelectorAll('.da-memory-cell');
      expect(cells?.[0].getAttribute('data-offset')).toBe('0');
      expect(cells?.[15].getAttribute('data-offset')).toBe('15');
    });
  });

  describe('PC highlighting', () => {
    it('should highlight row containing PC with da-memory-pc class', () => {
      memoryView.mount(container);
      memoryView.updateState({ pc: 0 });

      const row = container.querySelector('[data-address="0"]');
      expect(row?.classList.contains('da-memory-pc')).toBe(true);
    });

    it('should highlight cell at PC address with da-memory-pc-cell class', () => {
      memoryView.mount(container);
      memoryView.updateState({ pc: 0 });

      const row = container.querySelector('[data-address="0"]');
      const cell = row?.querySelector('[data-offset="0"]');
      expect(cell?.classList.contains('da-memory-pc-cell')).toBe(true);
    });

    it('should highlight correct row when PC is in middle of memory', () => {
      memoryView.mount(container);
      memoryView.updateState({ pc: 33 }); // Row 2 (0x20), offset 1

      const row = container.querySelector('[data-address="32"]');
      expect(row?.classList.contains('da-memory-pc')).toBe(true);

      const cell = row?.querySelector('[data-offset="1"]');
      expect(cell?.classList.contains('da-memory-pc-cell')).toBe(true);
    });

    it('should highlight correct row when PC is at end of memory', () => {
      memoryView.mount(container);
      memoryView.updateState({ pc: 255 }); // Last row, last cell

      const row = container.querySelector('[data-address="240"]');
      expect(row?.classList.contains('da-memory-pc')).toBe(true);

      const cell = row?.querySelector('[data-offset="15"]');
      expect(cell?.classList.contains('da-memory-pc-cell')).toBe(true);
    });

    it('should move PC highlighting when PC changes', () => {
      memoryView.mount(container);
      memoryView.updateState({ pc: 0 });
      memoryView.updateState({ pc: 16 }); // Move to next row

      // Old row should not have highlight
      const oldRow = container.querySelector('[data-address="0"]');
      expect(oldRow?.classList.contains('da-memory-pc')).toBe(false);

      // New row should have highlight
      const newRow = container.querySelector('[data-address="16"]');
      expect(newRow?.classList.contains('da-memory-pc')).toBe(true);
    });
  });

  describe('change detection', () => {
    it('should NOT have da-memory-changed class on initial render', () => {
      memoryView.mount(container);
      const cells = container.querySelectorAll('.da-memory-changed');
      expect(cells.length).toBe(0);
    });

    it('should NOT have da-memory-changed class on first updateState', () => {
      memoryView.mount(container);
      const memory = new Uint8Array(256);
      memory[0] = 5;
      memoryView.updateState({ memory });

      const cells = container.querySelectorAll('.da-memory-changed');
      expect(cells.length).toBe(0);
    });

    it('should add da-memory-changed class when value changes after first update', () => {
      memoryView.mount(container);

      // First update establishes previous state
      const memory1 = new Uint8Array(256);
      memory1[0] = 0;
      memoryView.updateState({ memory: memory1 });

      // Second update should detect change
      const memory2 = new Uint8Array(256);
      memory2[0] = 5;
      memoryView.updateState({ memory: memory2 });

      const firstRow = container.querySelector('[data-address="0"]');
      const firstCell = firstRow?.querySelector('[data-offset="0"]');
      expect(firstCell?.classList.contains('da-memory-changed')).toBe(true);
    });

    it('should NOT add da-memory-changed class when value stays the same', () => {
      memoryView.mount(container);

      const memory = new Uint8Array(256);
      memory[0] = 5;
      memoryView.updateState({ memory });
      memoryView.updateState({ memory: new Uint8Array(memory) }); // Same values

      const firstRow = container.querySelector('[data-address="0"]');
      const firstCell = firstRow?.querySelector('[data-offset="0"]');
      expect(firstCell?.classList.contains('da-memory-changed')).toBe(false);
    });

    it('should highlight multiple changed cells', () => {
      memoryView.mount(container);

      // First update
      const memory1 = new Uint8Array(256);
      memoryView.updateState({ memory: memory1 });

      // Second update changes multiple cells
      const memory2 = new Uint8Array(256);
      memory2[0] = 1;
      memory2[1] = 2;
      memory2[16] = 3;
      memoryView.updateState({ memory: memory2 });

      const changedCells = container.querySelectorAll('.da-memory-changed');
      expect(changedCells.length).toBe(3);
    });

    it('should remove da-memory-changed class after animation ends', () => {
      memoryView.mount(container);

      const memory1 = new Uint8Array(256);
      memoryView.updateState({ memory: memory1 });

      const memory2 = new Uint8Array(256);
      memory2[0] = 5;
      memoryView.updateState({ memory: memory2 });

      const firstRow = container.querySelector('[data-address="0"]');
      const firstCell = firstRow?.querySelector('[data-offset="0"]') as HTMLElement;
      expect(firstCell.classList.contains('da-memory-changed')).toBe(true);

      // Simulate animation end event (use Event for JSDOM compatibility)
      const event = new Event('animationend', { bubbles: true });
      firstCell.dispatchEvent(event);

      expect(firstCell.classList.contains('da-memory-changed')).toBe(false);
    });
  });

  describe('updateState', () => {
    it('should update displayed memory values', () => {
      memoryView.mount(container);

      const memory = new Uint8Array(256);
      memory[0] = 10; // 'A'
      memory[1] = 11; // 'B'
      memoryView.updateState({ memory });

      const firstRow = container.querySelector('[data-address="0"]');
      const cells = firstRow?.querySelectorAll('.da-memory-cell');
      expect(cells?.[0].textContent).toBe('A');
      expect(cells?.[1].textContent).toBe('B');
    });

    it('should update PC highlighting', () => {
      memoryView.mount(container);
      memoryView.updateState({ pc: 32 });

      const row = container.querySelector('[data-address="32"]');
      expect(row?.classList.contains('da-memory-pc')).toBe(true);
    });

    it('should handle partial updates (memory only)', () => {
      memoryView.mount(container);
      memoryView.updateState({ pc: 10 });

      const memory = new Uint8Array(256);
      memory[0] = 15;
      memoryView.updateState({ memory });

      // PC should still be highlighted at position 10
      const pcRow = container.querySelector('[data-address="0"]');
      const pcCell = pcRow?.querySelector('[data-offset="10"]');
      expect(pcCell?.classList.contains('da-memory-pc-cell')).toBe(true);

      // Memory should be updated
      const firstCell = pcRow?.querySelector('[data-offset="0"]');
      expect(firstCell?.textContent).toBe('F');
    });

    it('should handle partial updates (PC only)', () => {
      memoryView.mount(container);

      const memory = new Uint8Array(256);
      memory[5] = 9;
      memoryView.updateState({ memory });
      memoryView.updateState({ pc: 5 });

      const firstRow = container.querySelector('[data-address="0"]');
      const cell = firstRow?.querySelector('[data-offset="5"]');
      expect(cell?.textContent).toBe('9');
      expect(cell?.classList.contains('da-memory-pc-cell')).toBe(true);
    });

    it('should clamp PC to valid range (0-255)', () => {
      memoryView.mount(container);

      // PC above max
      memoryView.updateState({ pc: 300 });
      let lastRow = container.querySelector('[data-address="240"]');
      let lastCell = lastRow?.querySelector('[data-offset="15"]');
      expect(lastCell?.classList.contains('da-memory-pc-cell')).toBe(true);

      // PC below min (negative)
      memoryView.updateState({ pc: -5 });
      const firstRow = container.querySelector('[data-address="0"]');
      const firstCell = firstRow?.querySelector('[data-offset="0"]');
      expect(firstCell?.classList.contains('da-memory-pc-cell')).toBe(true);
    });
  });

  describe('scrollable container', () => {
    it('should have overflow-y auto style class', () => {
      memoryView.mount(container);
      const scroll = container.querySelector('.da-memory-view__scroll');
      expect(scroll).not.toBeNull();
      // The class exists which defines overflow-y: auto in CSS
    });

    it('should allow access to all 256 bytes', () => {
      memoryView.mount(container);

      // All rows should be present
      const rows = container.querySelectorAll('.da-memory-row:not(.da-memory-header)');
      expect(rows.length).toBe(16);

      // Total cells should be 256
      const cells = container.querySelectorAll('.da-memory-cell');
      expect(cells.length).toBe(256);
    });
  });

  describe('destroy', () => {
    it('should remove component from DOM', () => {
      memoryView.mount(container);
      expect(container.querySelector('.da-memory-view')).not.toBeNull();

      memoryView.destroy();
      expect(container.querySelector('.da-memory-view')).toBeNull();
    });

    it('should not throw when destroyed twice', () => {
      memoryView.mount(container);
      memoryView.destroy();
      expect(() => memoryView.destroy()).not.toThrow();
    });

    it('should not throw when destroyed without mounting', () => {
      const newMemoryView = new MemoryView();
      expect(() => newMemoryView.destroy()).not.toThrow();
    });

    it('should remove animationend event listener on destroy', () => {
      memoryView.mount(container);

      const element = container.querySelector('.da-memory-view') as HTMLElement;
      const removeEventListenerSpy = vi.spyOn(element, 'removeEventListener');

      memoryView.destroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'animationend',
        expect.any(Function)
      );
    });
  });

  describe('options', () => {
    it('should use default bytesPerRow of 16', () => {
      memoryView.mount(container);
      const rows = container.querySelectorAll('.da-memory-row:not(.da-memory-header)');
      expect(rows.length).toBe(16); // 256 / 16
    });

    it('should accept custom bytesPerRow option', () => {
      const customView = new MemoryView({ bytesPerRow: 8 });
      customView.mount(container);

      const rows = container.querySelectorAll('.da-memory-row:not(.da-memory-header)');
      expect(rows.length).toBe(32); // 256 / 8

      customView.destroy();
    });
  });

  describe('rapid updates', () => {
    it('should handle rapid state changes correctly', () => {
      memoryView.mount(container);

      // Rapid updates
      for (let i = 0; i < 10; i++) {
        const memory = new Uint8Array(256);
        memory[0] = i % 16;
        memoryView.updateState({ memory, pc: i * 10 });
      }

      // Final state should be correct
      const firstRow = container.querySelector('[data-address="0"]');
      const firstCell = firstRow?.querySelector('[data-offset="0"]');
      expect(firstCell?.textContent).toBe('9'); // 9 % 16 = 9

      // PC should be at 90 (row 5, offset 10)
      const pcRow = container.querySelector('[data-address="80"]');
      expect(pcRow?.classList.contains('da-memory-pc')).toBe(true);
    });
  });
});
