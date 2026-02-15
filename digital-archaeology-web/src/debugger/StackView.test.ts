// src/debugger/StackView.test.ts
// Tests for StackView component (Story 12.5)

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StackView } from './StackView';

describe('StackView', () => {
  let container: HTMLDivElement;
  let stackView: StackView;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    stackView = new StackView();
  });

  afterEach(() => {
    stackView.destroy();
    document.body.removeChild(container);
  });

  describe('mount (Task 5.2)', () => {
    it('should render stack section with container class', () => {
      stackView.mount(container);
      expect(container.querySelector('.da-stack-view')).not.toBeNull();
    });

    it('should render "Stack" title after Micro8 state is provided', () => {
      stackView.mount(container);
      stackView.updateState({ sp: 0xFFFF, memory: new Uint8Array(65536) });
      const title = container.querySelector('.da-stack-view__title');
      expect(title).not.toBeNull();
      expect(title?.textContent).toBe('Stack');
    });
  });

  describe('empty stack (Task 5.3)', () => {
    it('should show "Stack Empty" when SP = 0xFFFF', () => {
      stackView.mount(container);
      stackView.updateState({ sp: 0xFFFF, memory: new Uint8Array(65536) });
      const emptyMsg = container.querySelector('.da-stack-view__empty');
      expect(emptyMsg).not.toBeNull();
      expect(emptyMsg?.textContent).toBe('Stack Empty');
    });

    it('should not show stack rows when empty', () => {
      stackView.mount(container);
      stackView.updateState({ sp: 0xFFFF, memory: new Uint8Array(65536) });
      const rows = container.querySelectorAll('.da-stack-row');
      expect(rows.length).toBe(0);
    });

    it('should not show info bar when empty', () => {
      stackView.mount(container);
      stackView.updateState({ sp: 0xFFFF, memory: new Uint8Array(65536) });
      const info = container.querySelector('.da-stack-view__info');
      expect(info).toBeNull();
    });
  });

  describe('stack with data (Task 5.4)', () => {
    it('should display pushed values with correct hex formatting', () => {
      stackView.mount(container);
      const memory = new Uint8Array(65536);
      // push_byte writes to memory[SP] then SP--
      // Push 0x42: memory[0xFFFF] = 0x42, SP becomes 0xFFFE
      // Push 0xAA: memory[0xFFFE] = 0xAA, SP becomes 0xFFFD
      memory[0xFFFF] = 0x42;
      memory[0xFFFE] = 0xAA;
      stackView.updateState({ sp: 0xFFFD, memory });

      const rows = container.querySelectorAll('.da-stack-row');
      expect(rows.length).toBe(2);

      // SP+1 = 0xFFFE → most recent push (displayed first)
      const firstValue = rows[0].querySelector('.da-stack-value');
      expect(firstValue?.textContent).toBe('0xAA (170)');
      const firstAddr = rows[0].querySelector('.da-stack-addr');
      expect(firstAddr?.textContent).toBe('FFFE');

      // SP+2 = 0xFFFF → first push (displayed second)
      const secondValue = rows[1].querySelector('.da-stack-value');
      expect(secondValue?.textContent).toBe('0x42 (66)');
      const secondAddr = rows[1].querySelector('.da-stack-addr');
      expect(secondAddr?.textContent).toBe('FFFF');
    });

    it('should show address as 4 hex digits', () => {
      stackView.mount(container);
      const memory = new Uint8Array(65536);
      memory[0xFFFF] = 0x10;
      stackView.updateState({ sp: 0xFFFE, memory });

      const addr = container.querySelector('.da-stack-addr');
      expect(addr?.textContent).toBe('FFFF');
    });

    it('should show value as 2 hex digits with decimal', () => {
      stackView.mount(container);
      const memory = new Uint8Array(65536);
      memory[0xFFFF] = 0x0F;
      stackView.updateState({ sp: 0xFFFE, memory });

      const value = container.querySelector('.da-stack-value');
      expect(value?.textContent).toBe('0x0F (15)');
    });

    it('should pad single-digit hex values with zero', () => {
      stackView.mount(container);
      const memory = new Uint8Array(65536);
      memory[0xFFFF] = 0x05;
      stackView.updateState({ sp: 0xFFFE, memory });

      const value = container.querySelector('.da-stack-value');
      expect(value?.textContent).toBe('0x05 (5)');
    });

    it('should show up to 16 entries maximum', () => {
      stackView.mount(container);
      const memory = new Uint8Array(65536);
      for (let i = 0; i < 20; i++) {
        memory[0xFFFF - i] = i;
      }
      // SP = 0xFFFF - 20 = 0xFFEB, depth = 20
      stackView.updateState({ sp: 0xFFFF - 20, memory });

      const rows = container.querySelectorAll('.da-stack-row');
      expect(rows.length).toBe(16);
    });

    it('should highlight first row (SP+1) with SP modifier class', () => {
      stackView.mount(container);
      const memory = new Uint8Array(65536);
      memory[0xFFFF] = 0x42;
      memory[0xFFFE] = 0xAA;
      stackView.updateState({ sp: 0xFFFD, memory });

      const rows = container.querySelectorAll('.da-stack-row');
      expect(rows[0].classList.contains('da-stack-row--sp')).toBe(true);
      expect(rows[1].classList.contains('da-stack-row--sp')).toBe(false);
    });

    it('should set data-addr attribute on rows', () => {
      stackView.mount(container);
      const memory = new Uint8Array(65536);
      memory[0xFFFF] = 0x42;
      stackView.updateState({ sp: 0xFFFE, memory });

      const row = container.querySelector('.da-stack-row');
      expect(row?.getAttribute('data-addr')).toBe('0xFFFF');
    });
  });

  describe('stack depth (Task 5.5)', () => {
    it('should show correct byte count', () => {
      stackView.mount(container);
      const memory = new Uint8Array(65536);
      memory[0xFFFF] = 0x42;
      memory[0xFFFE] = 0xAA;
      memory[0xFFFD] = 0x55;
      stackView.updateState({ sp: 0xFFFC, memory });

      const info = container.querySelector('.da-stack-view__info');
      expect(info?.textContent).toContain('Depth: 3 bytes');
    });

    it('should show singular "byte" for depth 1', () => {
      stackView.mount(container);
      const memory = new Uint8Array(65536);
      memory[0xFFFF] = 0x42;
      stackView.updateState({ sp: 0xFFFE, memory });

      const info = container.querySelector('.da-stack-view__info');
      expect(info?.textContent).toContain('Depth: 1 byte');
    });

    it('should show SP in hex in info bar', () => {
      stackView.mount(container);
      const memory = new Uint8Array(65536);
      memory[0xFFFF] = 0x42;
      stackView.updateState({ sp: 0xFFFE, memory });

      const info = container.querySelector('.da-stack-view__info');
      expect(info?.textContent).toContain('SP: 0xFFFE');
    });

    it('should show depth of 5 for SP = 0xFFFA', () => {
      stackView.mount(container);
      const memory = new Uint8Array(65536);
      for (let i = 0; i < 5; i++) {
        memory[0xFFFF - i] = i + 1;
      }
      stackView.updateState({ sp: 0xFFFA, memory });

      const info = container.querySelector('.da-stack-view__info');
      expect(info?.textContent).toContain('Depth: 5 bytes');
    });
  });

  describe('change detection (Task 5.6)', () => {
    it('should not flash on first update', () => {
      stackView.mount(container);
      const memory = new Uint8Array(65536);
      memory[0xFFFF] = 0x42;
      memory[0xFFFE] = 0xAA;
      stackView.updateState({ sp: 0xFFFD, memory });

      const changedRows = container.querySelectorAll('.da-stack-changed');
      expect(changedRows.length).toBe(0);
    });

    it('should flash only changed entries on subsequent update', () => {
      stackView.mount(container);
      const memory1 = new Uint8Array(65536);
      memory1[0xFFFF] = 0x42;
      memory1[0xFFFE] = 0xAA;
      stackView.updateState({ sp: 0xFFFD, memory: memory1 });

      // Second update: change value at 0xFFFE, keep 0xFFFF same
      const memory2 = new Uint8Array(65536);
      memory2[0xFFFF] = 0x42; // unchanged
      memory2[0xFFFE] = 0xBB; // changed
      stackView.updateState({ sp: 0xFFFD, memory: memory2 });

      const changedRows = container.querySelectorAll('.da-stack-changed');
      expect(changedRows.length).toBe(1);
      expect(changedRows[0].getAttribute('data-addr')).toBe('0xFFFE');
    });

    it('should flash new entries when stack grows', () => {
      stackView.mount(container);
      const memory1 = new Uint8Array(65536);
      memory1[0xFFFF] = 0x42;
      stackView.updateState({ sp: 0xFFFE, memory: memory1 });

      // Push another value (SP decrements, new entry at 0xFFFE)
      const memory2 = new Uint8Array(65536);
      memory2[0xFFFF] = 0x42;
      memory2[0xFFFE] = 0xAA;
      stackView.updateState({ sp: 0xFFFD, memory: memory2 });

      const changedRows = container.querySelectorAll('.da-stack-changed');
      // The new entry at 0xFFFE should flash
      expect(changedRows.length).toBeGreaterThanOrEqual(1);
      const addrs = Array.from(changedRows).map(r => r.getAttribute('data-addr'));
      expect(addrs).toContain('0xFFFE');
    });

    it('should remove da-stack-changed class on animationend', () => {
      stackView.mount(container);
      const memory1 = new Uint8Array(65536);
      memory1[0xFFFF] = 0x42;
      stackView.updateState({ sp: 0xFFFE, memory: memory1 });

      const memory2 = new Uint8Array(65536);
      memory2[0xFFFF] = 0xBB;
      stackView.updateState({ sp: 0xFFFE, memory: memory2 });

      const changedRow = container.querySelector('.da-stack-changed');
      expect(changedRow).not.toBeNull();

      // Simulate animationend event
      const event = new Event('animationend', { bubbles: true });
      changedRow!.dispatchEvent(event);

      expect(changedRow!.classList.contains('da-stack-changed')).toBe(false);
    });
  });

  describe('return address detection (Task 3)', () => {
    it('should mark return address pairs with modifier class', () => {
      stackView.mount(container);
      const memory = new Uint8Array(65536);
      // Simulate CALL pushing return address 0x0010:
      // push_word pushes high byte first, then low byte
      // memory[0xFFFF] = 0x00 (high byte), memory[0xFFFE] = 0x10 (low byte)
      memory[0xFFFF] = 0x00; // high byte
      memory[0xFFFE] = 0x10; // low byte
      stackView.updateState({ sp: 0xFFFD, memory });

      const rows = container.querySelectorAll('.da-stack-row');
      // Both entries in the pair should have the return-addr modifier
      expect(rows[0].classList.contains('da-stack-row--return-addr')).toBe(true);
      expect(rows[1].classList.contains('da-stack-row--return-addr')).toBe(true);
    });

    it('should not mark non-return-address values', () => {
      stackView.mount(container);
      const memory = new Uint8Array(65536);
      // Regular data pushes (high values unlikely to be code addresses)
      memory[0xFFFF] = 0xFF;
      memory[0xFFFE] = 0xAA;
      stackView.updateState({ sp: 0xFFFD, memory });

      const rows = container.querySelectorAll('.da-stack-row--return-addr');
      expect(rows.length).toBe(0);
    });
  });

  describe('uninitialized / Micro4 stage (CR H-1, AC #5)', () => {
    it('should render nothing when memory is zero-length (uninitialized)', () => {
      stackView.mount(container);
      // Initial state has memory = Uint8Array(0) — should render empty container
      const title = container.querySelector('.da-stack-view__title');
      const emptyMsg = container.querySelector('.da-stack-view__empty');
      expect(title).toBeNull();
      expect(emptyMsg).toBeNull();
    });

    it('should render nothing after being cleared with zero-length memory', () => {
      stackView.mount(container);
      // First: show Micro8 data
      const memory = new Uint8Array(65536);
      memory[0xFFFF] = 0x42;
      stackView.updateState({ sp: 0xFFFE, memory });
      expect(container.querySelectorAll('.da-stack-row').length).toBe(1);

      // Then: clear by switching to non-Micro8 (zero-length memory)
      stackView.updateState({ sp: 0xFFFF, memory: new Uint8Array(0) });
      const title = container.querySelector('.da-stack-view__title');
      const rows = container.querySelectorAll('.da-stack-row');
      expect(title).toBeNull();
      expect(rows.length).toBe(0);
    });
  });

  describe('stackBaseAddr override (CR M-3)', () => {
    it('should use custom stack base for depth calculation', () => {
      stackView.mount(container);
      const memory = new Uint8Array(65536);
      // Custom stack base at 0x00FF (256-byte stack region)
      // Push 3 bytes: SP goes from 0x00FF to 0x00FC
      memory[0x00FF] = 0x11;
      memory[0x00FE] = 0x22;
      memory[0x00FD] = 0x33;
      stackView.updateState({ sp: 0x00FC, memory, stackBaseAddr: 0x00FF });

      const info = container.querySelector('.da-stack-view__info');
      expect(info?.textContent).toContain('Depth: 3 bytes');
      const rows = container.querySelectorAll('.da-stack-row');
      expect(rows.length).toBe(3);
    });

    it('should show empty when SP equals custom stack base', () => {
      stackView.mount(container);
      const memory = new Uint8Array(65536);
      stackView.updateState({ sp: 0x00FF, memory, stackBaseAddr: 0x00FF });

      const emptyMsg = container.querySelector('.da-stack-view__empty');
      expect(emptyMsg?.textContent).toBe('Stack Empty');
    });
  });

  describe('destroy (Task 5.7)', () => {
    it('should remove from DOM cleanly', () => {
      stackView.mount(container);
      expect(container.querySelector('.da-stack-view')).not.toBeNull();
      stackView.destroy();
      expect(container.querySelector('.da-stack-view')).toBeNull();
    });

    it('should allow re-mounting after destroy', () => {
      stackView.mount(container);
      stackView.destroy();
      stackView.mount(container);
      expect(container.querySelector('.da-stack-view')).not.toBeNull();
    });
  });
});
