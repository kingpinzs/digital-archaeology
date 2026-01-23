// src/debugger/MemoryView.test.ts
// Unit tests for MemoryView component (Story 5.5, 5.6)

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

  // =========================================================================
  // Story 5.6: Jump to Address Tests
  // =========================================================================

  describe('jump to address UI', () => {
    it('should render jump input with label, input, and button', () => {
      memoryView.mount(container);

      expect(container.querySelector('.da-memory-jump')).not.toBeNull();
      expect(container.querySelector('.da-memory-jump__label')?.textContent).toBe('Jump to:');
      expect(container.querySelector('.da-memory-jump__input')).not.toBeNull();
      expect(container.querySelector('.da-memory-jump__button')).not.toBeNull();
    });

    it('should have correct placeholder on input', () => {
      memoryView.mount(container);

      const input = container.querySelector('.da-memory-jump__input') as HTMLInputElement;
      expect(input.placeholder).toBe('0x00 or 0');
    });

    it('should have accessibility attributes', () => {
      memoryView.mount(container);

      const input = container.querySelector('.da-memory-jump__input');
      const button = container.querySelector('.da-memory-jump__button');
      const error = container.querySelector('.da-memory-jump__error');

      expect(input?.getAttribute('aria-label')).toBe('Memory address to jump to');
      expect(button?.getAttribute('aria-label')).toBe('Jump to address');
      expect(error?.getAttribute('aria-live')).toBe('polite');
      expect(error?.getAttribute('role')).toBe('alert');
    });
  });

  describe('parseAddress', () => {
    it('should parse hex format (0x10 → 16)', () => {
      memoryView.mount(container);
      expect(memoryView.parseAddress('0x10')).toBe(16);
    });

    it('should parse hex format case-insensitive (0XFF → 255)', () => {
      memoryView.mount(container);
      expect(memoryView.parseAddress('0XFF')).toBe(255);
      expect(memoryView.parseAddress('0xff')).toBe(255);
    });

    it('should parse decimal format (16 → 16)', () => {
      memoryView.mount(container);
      expect(memoryView.parseAddress('16')).toBe(16);
    });

    it('should parse decimal format (255 → 255)', () => {
      memoryView.mount(container);
      expect(memoryView.parseAddress('255')).toBe(255);
    });

    it('should return null for empty input', () => {
      memoryView.mount(container);
      expect(memoryView.parseAddress('')).toBeNull();
    });

    it('should return null for whitespace-only input', () => {
      memoryView.mount(container);
      expect(memoryView.parseAddress('   ')).toBeNull();
    });

    it('should return null for invalid input (non-numeric)', () => {
      memoryView.mount(container);
      expect(memoryView.parseAddress('abc')).toBeNull();
      expect(memoryView.parseAddress('hello')).toBeNull();
    });

    it('should return null for out-of-range values (256, -1)', () => {
      memoryView.mount(container);
      expect(memoryView.parseAddress('256')).toBeNull();
      expect(memoryView.parseAddress('-1')).toBeNull();
      expect(memoryView.parseAddress('0x100')).toBeNull();
    });

    it('should trim whitespace before parsing', () => {
      memoryView.mount(container);
      expect(memoryView.parseAddress('  16  ')).toBe(16);
      expect(memoryView.parseAddress('  0x10  ')).toBe(16);
    });

    it('should parse edge cases (0 and 255)', () => {
      memoryView.mount(container);
      expect(memoryView.parseAddress('0')).toBe(0);
      expect(memoryView.parseAddress('0x00')).toBe(0);
      expect(memoryView.parseAddress('255')).toBe(255);
      expect(memoryView.parseAddress('0xFF')).toBe(255);
    });
  });

  describe('jump button click', () => {
    it('should scroll to correct row on valid address', () => {
      memoryView.mount(container);

      const input = container.querySelector('.da-memory-jump__input') as HTMLInputElement;
      const button = container.querySelector('.da-memory-jump__button') as HTMLButtonElement;

      input.value = '32';
      button.click();

      // Check that target row gets highlight class
      const targetRow = container.querySelector('[data-address="32"]');
      expect(targetRow?.classList.contains('da-memory-jump-target')).toBe(true);
    });

    it('should highlight correct row for hex address', () => {
      memoryView.mount(container);

      const input = container.querySelector('.da-memory-jump__input') as HTMLInputElement;
      const button = container.querySelector('.da-memory-jump__button') as HTMLButtonElement;

      input.value = '0x30'; // 48 decimal, row at address 48
      button.click();

      const targetRow = container.querySelector('[data-address="48"]');
      expect(targetRow?.classList.contains('da-memory-jump-target')).toBe(true);
    });

    it('should show error for invalid address', () => {
      memoryView.mount(container);

      const input = container.querySelector('.da-memory-jump__input') as HTMLInputElement;
      const button = container.querySelector('.da-memory-jump__button') as HTMLButtonElement;
      const error = container.querySelector('.da-memory-jump__error');

      input.value = 'invalid';
      button.click();

      expect(error?.textContent).toBe('Invalid address');
    });

    it('should show error for empty input', () => {
      memoryView.mount(container);

      const input = container.querySelector('.da-memory-jump__input') as HTMLInputElement;
      const button = container.querySelector('.da-memory-jump__button') as HTMLButtonElement;
      const error = container.querySelector('.da-memory-jump__error');

      input.value = '';
      button.click();

      expect(error?.textContent).toBe('Invalid address');
    });

    it('should show error for out-of-range address', () => {
      memoryView.mount(container);

      const input = container.querySelector('.da-memory-jump__input') as HTMLInputElement;
      const button = container.querySelector('.da-memory-jump__button') as HTMLButtonElement;
      const error = container.querySelector('.da-memory-jump__error');

      input.value = '300';
      button.click();

      expect(error?.textContent).toBe('Address out of range (0-255)');
    });

    it('should clear error on valid address', () => {
      memoryView.mount(container);

      const input = container.querySelector('.da-memory-jump__input') as HTMLInputElement;
      const button = container.querySelector('.da-memory-jump__button') as HTMLButtonElement;
      const error = container.querySelector('.da-memory-jump__error');

      // First, trigger error
      input.value = 'invalid';
      button.click();
      expect(error?.textContent).toBe('Invalid address');

      // Then, enter valid address
      input.value = '16';
      button.click();
      expect(error?.textContent).toBe('');
    });
  });

  describe('input change clears error', () => {
    it('should clear error when user starts typing', () => {
      memoryView.mount(container);

      const input = container.querySelector('.da-memory-jump__input') as HTMLInputElement;
      const button = container.querySelector('.da-memory-jump__button') as HTMLButtonElement;
      const error = container.querySelector('.da-memory-jump__error');

      // First, trigger error
      input.value = 'invalid';
      button.click();
      expect(error?.textContent).toBe('Invalid address');

      // Then, start typing (trigger input event)
      input.value = '1';
      const inputEvent = new Event('input', { bubbles: true });
      input.dispatchEvent(inputEvent);

      expect(error?.textContent).toBe('');
    });

    it('should clear error on any input change', () => {
      memoryView.mount(container);

      const input = container.querySelector('.da-memory-jump__input') as HTMLInputElement;
      const button = container.querySelector('.da-memory-jump__button') as HTMLButtonElement;
      const error = container.querySelector('.da-memory-jump__error');

      // Trigger out-of-range error
      input.value = '300';
      button.click();
      expect(error?.textContent).toBe('Address out of range (0-255)');

      // Clear by typing
      const inputEvent = new Event('input', { bubbles: true });
      input.dispatchEvent(inputEvent);

      expect(error?.textContent).toBe('');
    });
  });

  describe('Enter key triggers jump', () => {
    it('should trigger jump on Enter key press in input', () => {
      memoryView.mount(container);

      const input = container.querySelector('.da-memory-jump__input') as HTMLInputElement;

      input.value = '48';
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      input.dispatchEvent(event);

      const targetRow = container.querySelector('[data-address="48"]');
      expect(targetRow?.classList.contains('da-memory-jump-target')).toBe(true);
    });

    it('should NOT trigger jump on other key presses', () => {
      memoryView.mount(container);

      const input = container.querySelector('.da-memory-jump__input') as HTMLInputElement;

      input.value = '48';
      const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      input.dispatchEvent(event);

      const targetRow = container.querySelector('[data-address="48"]');
      expect(targetRow?.classList.contains('da-memory-jump-target')).toBe(false);
    });
  });

  describe('scrollToAddress public API', () => {
    it('should return true for valid address (number)', () => {
      memoryView.mount(container);
      expect(memoryView.scrollToAddress(16)).toBe(true);
    });

    it('should return true for valid address (string)', () => {
      memoryView.mount(container);
      expect(memoryView.scrollToAddress('0x20')).toBe(true);
    });

    it('should return false for invalid address', () => {
      memoryView.mount(container);
      expect(memoryView.scrollToAddress('invalid')).toBe(false);
      expect(memoryView.scrollToAddress(300)).toBe(false);
      expect(memoryView.scrollToAddress(-5)).toBe(false);
    });

    it('should scroll to correct row when called externally', () => {
      memoryView.mount(container);

      memoryView.scrollToAddress(64);

      const targetRow = container.querySelector('[data-address="64"]');
      expect(targetRow?.classList.contains('da-memory-jump-target')).toBe(true);
    });
  });

  describe('jump event listener cleanup', () => {
    it('should remove event listeners on destroy', () => {
      memoryView.mount(container);

      const button = container.querySelector('.da-memory-jump__button') as HTMLButtonElement;
      const input = container.querySelector('.da-memory-jump__input') as HTMLInputElement;

      const buttonRemoveSpy = vi.spyOn(button, 'removeEventListener');
      const inputRemoveSpy = vi.spyOn(input, 'removeEventListener');

      memoryView.destroy();

      expect(buttonRemoveSpy).toHaveBeenCalledWith('click', expect.any(Function));
      expect(inputRemoveSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(inputRemoveSpy).toHaveBeenCalledWith('input', expect.any(Function));
    });
  });
});
