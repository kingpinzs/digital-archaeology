// src/debugger/CallRetVisualizer.test.ts
// Tests for CallRetVisualizer component (Story 12.6)

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CallRetVisualizer } from './CallRetVisualizer';

describe('CallRetVisualizer', () => {
  let container: HTMLDivElement;
  let visualizer: CallRetVisualizer;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    visualizer = new CallRetVisualizer();
  });

  afterEach(() => {
    visualizer.destroy();
    document.body.removeChild(container);
  });

  describe('mount (Task 1.1)', () => {
    it('should render container element with correct class', () => {
      visualizer.mount(container);
      expect(container.querySelector('.da-callret')).not.toBeNull();
    });

    it('should render title "CALL/RET Monitor" after Micro8 state is provided', () => {
      visualizer.mount(container);
      visualizer.updateState({ pc: 0, sp: 0xFFFF, memory: new Uint8Array(65536) });
      const title = container.querySelector('.da-callret__title');
      expect(title).not.toBeNull();
      expect(title?.textContent).toBe('CALL/RET Monitor');
    });

    it('should render nothing when memory is zero-length (Micro4 stage)', () => {
      visualizer.mount(container);
      // Default state has memory = Uint8Array(0)
      const title = container.querySelector('.da-callret__title');
      expect(title).toBeNull();
    });
  });

  describe('CALL detection (Task 1.2, AC #1, #2)', () => {
    it('should detect CALL when SP decreases by exactly 2', () => {
      visualizer.mount(container);
      const memory = new Uint8Array(65536);

      // Initial state: PC=0x0100, SP=0xFFFF
      visualizer.updateState({ pc: 0x0100, sp: 0xFFFF, memory });

      // After CALL: SP=0xFFFD (decreased by 2), PC=0x0300 (jump to subroutine)
      // Return address 0x0103 pushed: memory[0xFFFE]=0x03 (low), memory[0xFFFF]=0x01 (high)
      const memory2 = new Uint8Array(65536);
      memory2[0xFFFE] = 0x03; // low byte of return addr 0x0103
      memory2[0xFFFF] = 0x01; // high byte of return addr 0x0103
      visualizer.updateState({ pc: 0x0300, sp: 0xFFFD, memory: memory2 });

      const badge = container.querySelector('.da-callret__badge--call');
      expect(badge).not.toBeNull();
      expect(badge?.textContent).toBe('CALL');
    });

    it('should show return address pushed to stack (AC #1)', () => {
      visualizer.mount(container);
      const memory = new Uint8Array(65536);
      visualizer.updateState({ pc: 0x0100, sp: 0xFFFF, memory });

      const memory2 = new Uint8Array(65536);
      memory2[0xFFFE] = 0x03;
      memory2[0xFFFF] = 0x01;
      visualizer.updateState({ pc: 0x0300, sp: 0xFFFD, memory: memory2 });

      const stackInfo = container.querySelector('.da-callret__stack');
      expect(stackInfo).not.toBeNull();
      expect(stackInfo?.textContent).toContain('0103');
    });

    it('should show PC change to subroutine address (AC #2)', () => {
      visualizer.mount(container);
      const memory = new Uint8Array(65536);
      visualizer.updateState({ pc: 0x0100, sp: 0xFFFF, memory });

      const memory2 = new Uint8Array(65536);
      memory2[0xFFFE] = 0x03;
      memory2[0xFFFF] = 0x01;
      visualizer.updateState({ pc: 0x0300, sp: 0xFFFD, memory: memory2 });

      const pcInfo = container.querySelector('.da-callret__pc');
      expect(pcInfo).not.toBeNull();
      // Should show previous PC and current PC
      expect(pcInfo?.textContent).toContain('0100');
      expect(pcInfo?.textContent).toContain('0300');
    });

    it('should show SP change during CALL', () => {
      visualizer.mount(container);
      const memory = new Uint8Array(65536);
      visualizer.updateState({ pc: 0x0100, sp: 0xFFFF, memory });

      const memory2 = new Uint8Array(65536);
      memory2[0xFFFE] = 0x03;
      memory2[0xFFFF] = 0x01;
      visualizer.updateState({ pc: 0x0300, sp: 0xFFFD, memory: memory2 });

      const spInfo = container.querySelector('.da-callret__sp');
      expect(spInfo).not.toBeNull();
      expect(spInfo?.textContent).toContain('FFFF');
      expect(spInfo?.textContent).toContain('FFFD');
    });
  });

  describe('RET detection (Task 1.2, AC #3, #4)', () => {
    it('should detect RET when SP increases by exactly 2', () => {
      visualizer.mount(container);
      const memory = new Uint8Array(65536);

      // Simulate state after CALL: SP=0xFFFD, PC=0x0300
      visualizer.updateState({ pc: 0x0300, sp: 0xFFFD, memory });

      // After RET: SP=0xFFFF (increased by 2), PC=0x0103 (return address)
      visualizer.updateState({ pc: 0x0103, sp: 0xFFFF, memory });

      const badge = container.querySelector('.da-callret__badge--ret');
      expect(badge).not.toBeNull();
      expect(badge?.textContent).toBe('RET');
    });

    it('should show address popped from stack (AC #3)', () => {
      visualizer.mount(container);
      const memory = new Uint8Array(65536);
      visualizer.updateState({ pc: 0x0300, sp: 0xFFFD, memory });
      visualizer.updateState({ pc: 0x0103, sp: 0xFFFF, memory });

      const stackInfo = container.querySelector('.da-callret__stack');
      expect(stackInfo).not.toBeNull();
      // The popped address = new PC = 0x0103
      expect(stackInfo?.textContent).toContain('0103');
    });

    it('should show PC return to caller (AC #4)', () => {
      visualizer.mount(container);
      const memory = new Uint8Array(65536);
      visualizer.updateState({ pc: 0x0300, sp: 0xFFFD, memory });
      visualizer.updateState({ pc: 0x0103, sp: 0xFFFF, memory });

      const pcInfo = container.querySelector('.da-callret__pc');
      expect(pcInfo).not.toBeNull();
      expect(pcInfo?.textContent).toContain('0300');
      expect(pcInfo?.textContent).toContain('0103');
    });

    it('should show SP change during RET', () => {
      visualizer.mount(container);
      const memory = new Uint8Array(65536);
      visualizer.updateState({ pc: 0x0300, sp: 0xFFFD, memory });
      visualizer.updateState({ pc: 0x0103, sp: 0xFFFF, memory });

      const spInfo = container.querySelector('.da-callret__sp');
      expect(spInfo).not.toBeNull();
      expect(spInfo?.textContent).toContain('FFFD');
      expect(spInfo?.textContent).toContain('FFFF');
    });
  });

  describe('non-subroutine operations (Task 1.2)', () => {
    it('should show idle state when SP does not change', () => {
      visualizer.mount(container);
      const memory = new Uint8Array(65536);
      visualizer.updateState({ pc: 0x0100, sp: 0xFFFF, memory });
      // Normal instruction: PC increments, SP unchanged
      visualizer.updateState({ pc: 0x0101, sp: 0xFFFF, memory });

      const badge = container.querySelector('.da-callret__badge--idle');
      expect(badge).not.toBeNull();
    });

    it('should show idle state when SP changes by 1 (PUSH/POP single byte)', () => {
      visualizer.mount(container);
      const memory = new Uint8Array(65536);
      visualizer.updateState({ pc: 0x0100, sp: 0xFFFF, memory });
      // PUSH single byte: SP decreases by 1
      visualizer.updateState({ pc: 0x0101, sp: 0xFFFE, memory });

      const idle = container.querySelector('.da-callret__badge--idle');
      expect(idle).not.toBeNull();
      // Should NOT show CALL badge
      expect(container.querySelector('.da-callret__badge--call')).toBeNull();
    });

    it('should not show CALL/RET badges on first update', () => {
      visualizer.mount(container);
      const memory = new Uint8Array(65536);
      visualizer.updateState({ pc: 0x0100, sp: 0xFFFD, memory });

      expect(container.querySelector('.da-callret__badge--call')).toBeNull();
      expect(container.querySelector('.da-callret__badge--ret')).toBeNull();
    });
  });

  describe('nested CALL/RET (edge cases)', () => {
    it('should detect second CALL after first CALL', () => {
      visualizer.mount(container);
      const memory = new Uint8Array(65536);

      // First CALL: PC=0x0100→0x0300, SP=0xFFFF→0xFFFD
      visualizer.updateState({ pc: 0x0100, sp: 0xFFFF, memory });
      const memory2 = new Uint8Array(65536);
      memory2[0xFFFE] = 0x03;
      memory2[0xFFFF] = 0x01;
      visualizer.updateState({ pc: 0x0300, sp: 0xFFFD, memory: memory2 });

      // Execute some instructions in subroutine
      visualizer.updateState({ pc: 0x0301, sp: 0xFFFD, memory: memory2 });

      // Second CALL: PC=0x0302→0x0500, SP=0xFFFD→0xFFFB
      const memory3 = new Uint8Array(65536);
      memory3[0xFFFE] = 0x03;
      memory3[0xFFFF] = 0x01;
      memory3[0xFFFC] = 0x05; // low byte of return addr 0x0305
      memory3[0xFFFD] = 0x03; // high byte of return addr 0x0305
      visualizer.updateState({ pc: 0x0500, sp: 0xFFFB, memory: memory3 });

      const badge = container.querySelector('.da-callret__badge--call');
      expect(badge).not.toBeNull();
    });

    it('should detect RET after nested CALL', () => {
      visualizer.mount(container);
      const memory = new Uint8Array(65536);

      // Setup: in nested subroutine at SP=0xFFFB
      visualizer.updateState({ pc: 0x0500, sp: 0xFFFB, memory });

      // RET from inner: SP=0xFFFB→0xFFFD, PC=0x0305
      visualizer.updateState({ pc: 0x0305, sp: 0xFFFD, memory });

      const badge = container.querySelector('.da-callret__badge--ret');
      expect(badge).not.toBeNull();
    });
  });

  describe('stage-awareness (Task 2.4)', () => {
    it('should render nothing when memory is zero-length (Micro4)', () => {
      visualizer.mount(container);
      const title = container.querySelector('.da-callret__title');
      expect(title).toBeNull();
    });

    it('should render content when Micro8 state provided', () => {
      visualizer.mount(container);
      visualizer.updateState({ pc: 0, sp: 0xFFFF, memory: new Uint8Array(65536) });
      const title = container.querySelector('.da-callret__title');
      expect(title).not.toBeNull();
    });

    it('should hide when cleared with zero-length memory', () => {
      visualizer.mount(container);
      visualizer.updateState({ pc: 0, sp: 0xFFFF, memory: new Uint8Array(65536) });
      expect(container.querySelector('.da-callret__title')).not.toBeNull();

      // Switch to Micro4 (clear)
      visualizer.updateState({ pc: 0, sp: 0xFFFF, memory: new Uint8Array(0) });
      expect(container.querySelector('.da-callret__title')).toBeNull();
    });
  });

  describe('render output for CALL (Task 2.2)', () => {
    it('should show flow arrow from old PC to new PC', () => {
      visualizer.mount(container);
      const memory = new Uint8Array(65536);
      visualizer.updateState({ pc: 0x0100, sp: 0xFFFF, memory });

      const memory2 = new Uint8Array(65536);
      memory2[0xFFFE] = 0x03;
      memory2[0xFFFF] = 0x01;
      visualizer.updateState({ pc: 0x0300, sp: 0xFFFD, memory: memory2 });

      const arrow = container.querySelector('.da-callret__arrow');
      expect(arrow).not.toBeNull();
    });

    it('should display return address in hex', () => {
      visualizer.mount(container);
      const memory = new Uint8Array(65536);
      visualizer.updateState({ pc: 0x0100, sp: 0xFFFF, memory });

      const memory2 = new Uint8Array(65536);
      memory2[0xFFFE] = 0x03; // low byte
      memory2[0xFFFF] = 0x01; // high byte
      visualizer.updateState({ pc: 0x0300, sp: 0xFFFD, memory: memory2 });

      const stackText = container.querySelector('.da-callret__stack')?.textContent ?? '';
      expect(stackText).toContain('0103');
    });
  });

  describe('render output for RET (Task 2.3)', () => {
    it('should show flow arrow showing return', () => {
      visualizer.mount(container);
      const memory = new Uint8Array(65536);
      visualizer.updateState({ pc: 0x0300, sp: 0xFFFD, memory });
      visualizer.updateState({ pc: 0x0103, sp: 0xFFFF, memory });

      const arrow = container.querySelector('.da-callret__arrow');
      expect(arrow).not.toBeNull();
    });

    it('should display popped return address', () => {
      visualizer.mount(container);
      const memory = new Uint8Array(65536);
      visualizer.updateState({ pc: 0x0300, sp: 0xFFFD, memory });
      visualizer.updateState({ pc: 0x0103, sp: 0xFFFF, memory });

      const stackText = container.querySelector('.da-callret__stack')?.textContent ?? '';
      // Popped address = new PC = 0x0103
      expect(stackText).toContain('0103');
    });
  });

  describe('destroy (lifecycle)', () => {
    it('should remove from DOM cleanly', () => {
      visualizer.mount(container);
      visualizer.updateState({ pc: 0, sp: 0xFFFF, memory: new Uint8Array(65536) });
      expect(container.querySelector('.da-callret')).not.toBeNull();
      visualizer.destroy();
      expect(container.querySelector('.da-callret')).toBeNull();
    });

    it('should allow re-mounting after destroy', () => {
      visualizer.mount(container);
      visualizer.destroy();
      visualizer.mount(container);
      expect(container.querySelector('.da-callret')).not.toBeNull();
    });

    it('should reset state on destroy', () => {
      visualizer.mount(container);
      const memory = new Uint8Array(65536);
      visualizer.updateState({ pc: 0x0100, sp: 0xFFFF, memory });

      const memory2 = new Uint8Array(65536);
      memory2[0xFFFE] = 0x03;
      memory2[0xFFFF] = 0x01;
      visualizer.updateState({ pc: 0x0300, sp: 0xFFFD, memory: memory2 });

      visualizer.destroy();
      visualizer.mount(container);
      visualizer.updateState({ pc: 0x0300, sp: 0xFFFD, memory: memory2 });

      // After destroy + remount, first update should NOT show CALL (no previous state)
      expect(container.querySelector('.da-callret__badge--call')).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle SP wrapping near zero', () => {
      visualizer.mount(container);
      const memory = new Uint8Array(65536);
      visualizer.updateState({ pc: 0x0100, sp: 0x0001, memory });
      // SP going from 0x0001 to 0x0003 = RET (increase by 2)
      visualizer.updateState({ pc: 0x0050, sp: 0x0003, memory });

      const badge = container.querySelector('.da-callret__badge--ret');
      expect(badge).not.toBeNull();
    });

    it('should handle PC at address zero', () => {
      visualizer.mount(container);
      const memory = new Uint8Array(65536);
      visualizer.updateState({ pc: 0x0100, sp: 0xFFFF, memory });

      const memory2 = new Uint8Array(65536);
      memory2[0xFFFE] = 0x03;
      memory2[0xFFFF] = 0x01;
      visualizer.updateState({ pc: 0x0000, sp: 0xFFFD, memory: memory2 });

      const badge = container.querySelector('.da-callret__badge--call');
      expect(badge).not.toBeNull();
    });

    it('should not detect CALL when SP changes by more than 2', () => {
      visualizer.mount(container);
      const memory = new Uint8Array(65536);
      visualizer.updateState({ pc: 0x0100, sp: 0xFFFF, memory });
      // SP decreased by 4 - not a standard CALL
      visualizer.updateState({ pc: 0x0300, sp: 0xFFFB, memory });

      expect(container.querySelector('.da-callret__badge--call')).toBeNull();
    });
  });
});
