import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StatusBar } from './StatusBar';
import type { StatusBarState } from './StatusBar';

describe('StatusBar', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('mount', () => {
    it('should mount to container', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      expect(container.querySelector('.da-statusbar-content')).not.toBeNull();
      statusBar.destroy();
    });

    it('should render all sections', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      expect(container.querySelector('[data-section="assembly"]')).not.toBeNull();
      expect(container.querySelector('[data-section="load"]')).not.toBeNull();
      expect(container.querySelector('[data-section="pc"]')).not.toBeNull();
      expect(container.querySelector('[data-section="instruction"]')).not.toBeNull();
      expect(container.querySelector('[data-section="cycle"]')).not.toBeNull();
      expect(container.querySelector('[data-section="speed"]')).not.toBeNull();

      statusBar.destroy();
    });

    it('should render separators between sections', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      const separators = container.querySelectorAll('.da-statusbar-separator');
      expect(separators.length).toBe(6); // 7 sections = 6 separators

      statusBar.destroy();
    });
  });

  describe('initial state', () => {
    it('should show "Ready" for assembly status', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      const assemblySection = container.querySelector('[data-section="assembly"]');
      expect(assemblySection?.textContent).toContain('Ready');

      statusBar.destroy();
    });

    it('should show "--" for PC value when null', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      const pcSection = container.querySelector('[data-section="pc"]');
      expect(pcSection?.textContent).toContain('--');

      statusBar.destroy();
    });

    it('should show "--" for next instruction when null', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      const instructionSection = container.querySelector('[data-section="instruction"]');
      expect(instructionSection?.textContent).toContain('--');

      statusBar.destroy();
    });

    it('should show 0 for cycle count', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      const cycleSection = container.querySelector('[data-section="cycle"]');
      expect(cycleSection?.textContent).toContain('0');

      statusBar.destroy();
    });

    it('should show "--" for speed when null', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      const speedSection = container.querySelector('[data-section="speed"]');
      expect(speedSection?.textContent).toContain('--');

      statusBar.destroy();
    });

    it('should show "--" for load status when null (Story 4.4)', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      const loadSection = container.querySelector('[data-section="load"]');
      expect(loadSection?.textContent).toBe('--');

      statusBar.destroy();
    });
  });

  describe('updateState', () => {
    it('should update assembly status to success', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      statusBar.updateState({ assemblyStatus: 'success', assemblyMessage: '12 bytes' });

      const assemblySection = container.querySelector('[data-section="assembly"]');
      expect(assemblySection?.textContent).toContain('✓');
      expect(assemblySection?.textContent).toContain('Assembled');
      expect(assemblySection?.textContent).toContain('12 bytes');

      statusBar.destroy();
    });

    it('should update assembly status to error', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      statusBar.updateState({ assemblyStatus: 'error', assemblyMessage: '2 errors' });

      const assemblySection = container.querySelector('[data-section="assembly"]');
      expect(assemblySection?.textContent).toContain('✗');
      expect(assemblySection?.textContent).toContain('2 errors');

      statusBar.destroy();
    });

    it('should update assembly status to assembling', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      statusBar.updateState({ assemblyStatus: 'assembling' });

      const assemblySection = container.querySelector('[data-section="assembly"]');
      expect(assemblySection?.textContent).toContain('Assembling...');

      statusBar.destroy();
    });

    it('should display PC value in hex format', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      statusBar.updateState({ pcValue: 4 });

      const pcSection = container.querySelector('[data-section="pc"]');
      expect(pcSection?.textContent).toContain('0x04');

      statusBar.destroy();
    });

    it('should display PC value with uppercase hex', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      statusBar.updateState({ pcValue: 255 });

      const pcSection = container.querySelector('[data-section="pc"]');
      expect(pcSection?.textContent).toContain('0xFF');

      statusBar.destroy();
    });

    it('should update next instruction', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      statusBar.updateState({ nextInstruction: 'ADD 0x11' });

      const instructionSection = container.querySelector('[data-section="instruction"]');
      expect(instructionSection?.textContent).toContain('ADD 0x11');

      statusBar.destroy();
    });

    it('should update cycle count', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      statusBar.updateState({ cycleCount: 42 });

      const cycleSection = container.querySelector('[data-section="cycle"]');
      expect(cycleSection?.textContent).toContain('42');

      statusBar.destroy();
    });

    it('should update speed with Hz suffix', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      statusBar.updateState({ speed: 10 });

      const speedSection = container.querySelector('[data-section="speed"]');
      expect(speedSection?.textContent).toContain('10Hz');

      statusBar.destroy();
    });

    it('should show "--" for speed when set to null', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      statusBar.updateState({ speed: 10 });
      statusBar.updateState({ speed: null });

      const speedSection = container.querySelector('[data-section="speed"]');
      expect(speedSection?.textContent).toContain('--');

      statusBar.destroy();
    });

    it('should update load status (Story 4.4)', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      statusBar.updateState({ loadStatus: 'Loaded: 12 nibbles' });

      const loadSection = container.querySelector('[data-section="load"]');
      expect(loadSection?.textContent).toContain('Loaded: 12 nibbles');

      statusBar.destroy();
    });

    it('should show "--" for load status when set to null (Story 4.4)', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      statusBar.updateState({ loadStatus: 'Loaded: 12 nibbles' });
      statusBar.updateState({ loadStatus: null });

      const loadSection = container.querySelector('[data-section="load"]');
      expect(loadSection?.textContent).toBe('--');

      statusBar.destroy();
    });

    it('should escape HTML in load status to prevent XSS (Story 4.4)', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      statusBar.updateState({ loadStatus: '<script>alert("xss")</script>' });

      const loadSection = container.querySelector('[data-section="load"]');
      expect(loadSection?.innerHTML).not.toContain('<script>');
      expect(loadSection?.textContent).toContain('<script>');

      statusBar.destroy();
    });

    it('should preserve other state values on partial update', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      statusBar.updateState({ cycleCount: 100 });
      statusBar.updateState({ pcValue: 16 });

      const state = statusBar.getState();
      expect(state.cycleCount).toBe(100);
      expect(state.pcValue).toBe(16);

      statusBar.destroy();
    });

    it('should display PC value of 0 correctly', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      statusBar.updateState({ pcValue: 0 });

      const pcSection = container.querySelector('[data-section="pc"]');
      expect(pcSection?.textContent).toContain('0x00');

      statusBar.destroy();
    });

    it('should handle large PC values (16-bit)', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      statusBar.updateState({ pcValue: 0x1000 });

      const pcSection = container.querySelector('[data-section="pc"]');
      expect(pcSection?.textContent).toContain('0x1000');

      statusBar.destroy();
    });

    it('should handle large PC values (32-bit)', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      statusBar.updateState({ pcValue: 0xDEADBEEF });

      const pcSection = container.querySelector('[data-section="pc"]');
      expect(pcSection?.textContent).toContain('0xDEADBEEF');

      statusBar.destroy();
    });

    it('should handle negative PC values by converting to unsigned', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      // -1 should be converted to 0xFFFFFFFF (unsigned 32-bit)
      statusBar.updateState({ pcValue: -1 });

      const pcSection = container.querySelector('[data-section="pc"]');
      expect(pcSection?.textContent).toContain('0xFFFFFFFF');

      statusBar.destroy();
    });
  });

  describe('getState', () => {
    it('should return current state', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      const state = statusBar.getState();

      expect(state.assemblyStatus).toBe('none');
      expect(state.assemblyMessage).toBeNull();
      expect(state.loadStatus).toBeNull();
      expect(state.pcValue).toBeNull();
      expect(state.nextInstruction).toBeNull();
      expect(state.cycleCount).toBe(0);
      expect(state.speed).toBeNull();
      expect(state.cursorPosition).toBeNull();

      statusBar.destroy();
    });

    it('should return updated state after updateState', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      const newState: Partial<StatusBarState> = {
        assemblyStatus: 'success',
        assemblyMessage: '24 bytes',
        pcValue: 8,
        nextInstruction: 'LDA 0x10',
        cycleCount: 5,
        speed: 1,
      };

      statusBar.updateState(newState);
      const state = statusBar.getState();

      expect(state.assemblyStatus).toBe('success');
      expect(state.assemblyMessage).toBe('24 bytes');
      expect(state.pcValue).toBe(8);
      expect(state.nextInstruction).toBe('LDA 0x10');
      expect(state.cycleCount).toBe(5);
      expect(state.speed).toBe(1);

      statusBar.destroy();
    });

    it('should return a copy of state (not reference)', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      const state1 = statusBar.getState();
      state1.cycleCount = 999;

      const state2 = statusBar.getState();
      expect(state2.cycleCount).toBe(0);

      statusBar.destroy();
    });

    it('should deep clone cursorPosition (not share reference)', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      statusBar.updateState({ cursorPosition: { line: 10, column: 5 } });

      const state1 = statusBar.getState();
      if (state1.cursorPosition) {
        state1.cursorPosition.line = 999;
      }

      const state2 = statusBar.getState();
      expect(state2.cursorPosition?.line).toBe(10);
      expect(state2.cursorPosition?.column).toBe(5);

      statusBar.destroy();
    });
  });

  describe('accessibility', () => {
    it('should have aria-label on assembly section', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      const section = container.querySelector('[data-section="assembly"]');
      expect(section?.getAttribute('aria-label')).toBe('Assembly status');

      statusBar.destroy();
    });

    it('should have aria-label on PC section', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      const section = container.querySelector('[data-section="pc"]');
      expect(section?.getAttribute('aria-label')).toBe('Program counter');

      statusBar.destroy();
    });

    it('should have aria-label on instruction section', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      const section = container.querySelector('[data-section="instruction"]');
      expect(section?.getAttribute('aria-label')).toBe('Next instruction');

      statusBar.destroy();
    });

    it('should have aria-label on cycle section', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      const section = container.querySelector('[data-section="cycle"]');
      expect(section?.getAttribute('aria-label')).toBe('Cycle count');

      statusBar.destroy();
    });

    it('should have aria-label on speed section', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      const section = container.querySelector('[data-section="speed"]');
      expect(section?.getAttribute('aria-label')).toBe('Execution speed');

      statusBar.destroy();
    });

    it('should hide separators from screen readers', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      const separators = container.querySelectorAll('.da-statusbar-separator');
      separators.forEach(sep => {
        expect(sep.getAttribute('aria-hidden')).toBe('true');
      });

      statusBar.destroy();
    });

    it('should have role="status" for screen reader live region (Story 5.1)', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      const content = container.querySelector('.da-statusbar-content');
      expect(content?.getAttribute('role')).toBe('status');

      statusBar.destroy();
    });

    it('should have aria-live="polite" for non-urgent announcements (Story 5.1)', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      const content = container.querySelector('.da-statusbar-content');
      expect(content?.getAttribute('aria-live')).toBe('polite');

      statusBar.destroy();
    });

    it('should have aria-atomic="false" to announce only changed parts (Story 5.1)', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      const content = container.querySelector('.da-statusbar-content');
      expect(content?.getAttribute('aria-atomic')).toBe('false');

      statusBar.destroy();
    });
  });

  describe('XSS prevention', () => {
    it('should escape HTML in assemblyMessage', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      statusBar.updateState({
        assemblyStatus: 'error',
        assemblyMessage: '<script>alert("xss")</script>',
      });

      const assemblySection = container.querySelector('[data-section="assembly"]');
      // Should not contain unescaped script tag
      expect(assemblySection?.innerHTML).not.toContain('<script>');
      // Should contain escaped version
      expect(assemblySection?.textContent).toContain('<script>');

      statusBar.destroy();
    });

    it('should escape HTML in nextInstruction', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      statusBar.updateState({
        nextInstruction: '<img src=x onerror=alert(1)>',
      });

      const instructionSection = container.querySelector('[data-section="instruction"]');
      // Should not contain unescaped img tag
      expect(instructionSection?.innerHTML).not.toContain('<img');
      // Should contain escaped version in text
      expect(instructionSection?.textContent).toContain('<img');

      statusBar.destroy();
    });
  });

  describe('styling', () => {
    it('should apply success class for successful assembly', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      statusBar.updateState({ assemblyStatus: 'success', assemblyMessage: '12 bytes' });

      const value = container.querySelector('[data-section="assembly"] .da-statusbar-value');
      expect(value?.classList.contains('da-statusbar-status--success')).toBe(true);

      statusBar.destroy();
    });

    it('should apply error class for failed assembly', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      statusBar.updateState({ assemblyStatus: 'error', assemblyMessage: '3 errors' });

      const value = container.querySelector('[data-section="assembly"] .da-statusbar-value');
      expect(value?.classList.contains('da-statusbar-status--error')).toBe(true);

      statusBar.destroy();
    });

    it('should apply assembling class when assembling', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      statusBar.updateState({ assemblyStatus: 'assembling' });

      const value = container.querySelector('[data-section="assembly"] .da-statusbar-value');
      expect(value?.classList.contains('da-statusbar-status--assembling')).toBe(true);

      statusBar.destroy();
    });

    it('should apply none class for ready state', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      const value = container.querySelector('[data-section="assembly"] .da-statusbar-value');
      expect(value?.classList.contains('da-statusbar-status--none')).toBe(true);

      statusBar.destroy();
    });

    it('should apply monospace font class to values', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      statusBar.updateState({ pcValue: 10 });

      const pcValue = container.querySelector('[data-section="pc"] .da-statusbar-value');
      expect(pcValue?.classList.contains('da-statusbar-value')).toBe(true);

      statusBar.destroy();
    });
  });

  describe('destroy', () => {
    it('should remove element from DOM', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      expect(container.querySelector('.da-statusbar-content')).not.toBeNull();

      statusBar.destroy();

      expect(container.querySelector('.da-statusbar-content')).toBeNull();
    });

    it('should be safe to call multiple times', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      statusBar.destroy();
      statusBar.destroy();

      expect(container.querySelector('.da-statusbar-content')).toBeNull();
    });

    it('should be safe to call before mount', () => {
      const statusBar = new StatusBar();
      statusBar.destroy();
      // Should not throw
    });
  });

  describe('cursor position (Story 2.5)', () => {
    it('should render cursor section', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      expect(container.querySelector('[data-section="cursor"]')).not.toBeNull();

      statusBar.destroy();
    });

    it('should display "Ln 1, Col 1" format when cursor position is set', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      statusBar.updateState({ cursorPosition: { line: 1, column: 1 } });

      const cursorSection = container.querySelector('[data-section="cursor"]');
      expect(cursorSection?.textContent).toContain('Ln 1, Col 1');

      statusBar.destroy();
    });

    it('should display "--" when cursorPosition is null', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      const cursorSection = container.querySelector('[data-section="cursor"]');
      expect(cursorSection?.textContent).toContain('--');

      statusBar.destroy();
    });

    it('should update cursor position in real-time', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      statusBar.updateState({ cursorPosition: { line: 5, column: 10 } });
      let cursorSection = container.querySelector('[data-section="cursor"]');
      expect(cursorSection?.textContent).toContain('Ln 5, Col 10');

      statusBar.updateState({ cursorPosition: { line: 42, column: 77 } });
      cursorSection = container.querySelector('[data-section="cursor"]');
      expect(cursorSection?.textContent).toContain('Ln 42, Col 77');

      statusBar.destroy();
    });

    it('should use monospace font class for cursor value', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      statusBar.updateState({ cursorPosition: { line: 1, column: 1 } });

      const cursorValue = container.querySelector('[data-section="cursor"] .da-statusbar-value');
      expect(cursorValue?.classList.contains('da-statusbar-value')).toBe(true);

      statusBar.destroy();
    });

    it('should have aria-label on cursor section', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      const section = container.querySelector('[data-section="cursor"]');
      expect(section?.getAttribute('aria-label')).toBe('Cursor position');

      statusBar.destroy();
    });

    it('should add separator before cursor section', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      // There should now be 6 separators (7 sections = 6 separators)
      const separators = container.querySelectorAll('.da-statusbar-separator');
      expect(separators.length).toBe(6);

      statusBar.destroy();
    });
  });

  describe('labels', () => {
    it('should show PC label', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      const pcSection = container.querySelector('[data-section="pc"]');
      expect(pcSection?.textContent).toContain('PC:');

      statusBar.destroy();
    });

    it('should show Next label for instruction', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      const instructionSection = container.querySelector('[data-section="instruction"]');
      expect(instructionSection?.textContent).toContain('Next:');

      statusBar.destroy();
    });

    it('should show Cycle label', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      const cycleSection = container.querySelector('[data-section="cycle"]');
      expect(cycleSection?.textContent).toContain('Cycle:');

      statusBar.destroy();
    });

    it('should show Speed label', () => {
      const statusBar = new StatusBar();
      statusBar.mount(container);

      const speedSection = container.querySelector('[data-section="speed"]');
      expect(speedSection?.textContent).toContain('Speed:');

      statusBar.destroy();
    });
  });
});
