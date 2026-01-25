// src/visualizer/GateTooltip.test.ts
// Unit tests for GateTooltip component (Story 6.8)

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  GateTooltip,
  formatGateType,
  formatGateOutput,
  DEFAULT_TOOLTIP_CONFIG,
} from './GateTooltip';
import type { CircuitGate } from './types';

describe('GateTooltip', () => {
  let container: HTMLDivElement;
  let tooltip: GateTooltip;

  // Sample gates for testing
  const andGate: CircuitGate = {
    id: 1,
    name: 'AND1',
    type: 'AND',
    inputs: [
      { wire: 1, bit: 0 },
      { wire: 2, bit: 0 },
    ],
    outputs: [{ wire: 3, bit: 0 }],
  };

  const dffGate: CircuitGate = {
    id: 2,
    name: 'DFF1',
    type: 'DFF',
    inputs: [{ wire: 1, bit: 0 }],
    outputs: [{ wire: 2, bit: 0 }],
    stored: 1,
  };

  beforeEach(() => {
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    container.style.position = 'relative';
    document.body.appendChild(container);

    // Mock getBoundingClientRect for container
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    // Mock window.innerWidth/innerHeight
    vi.stubGlobal('innerWidth', 1024);
    vi.stubGlobal('innerHeight', 768);

    tooltip = new GateTooltip();
  });

  afterEach(() => {
    tooltip.destroy();
    container.remove();
    vi.restoreAllMocks();
  });

  describe('formatGateType()', () => {
    it('should uppercase the gate type', () => {
      expect(formatGateType('and')).toBe('AND');
      expect(formatGateType('or')).toBe('OR');
      expect(formatGateType('xor')).toBe('XOR');
    });

    it('should handle already uppercase types', () => {
      expect(formatGateType('AND')).toBe('AND');
    });

    it('should handle mixed case', () => {
      expect(formatGateType('Dff')).toBe('DFF');
    });
  });

  describe('formatGateOutput()', () => {
    it('should return dash when no outputs', () => {
      const gate: CircuitGate = {
        id: 1,
        name: 'Test',
        type: 'BUF',
        inputs: [],
        outputs: [],
      };
      expect(formatGateOutput(gate)).toBe('Output: -');
    });

    it('should return dash when no wire states provided', () => {
      expect(formatGateOutput(andGate)).toBe('Output: -');
    });

    it('should return dash when wire not in states', () => {
      const wireStates = new Map<number, number[]>();
      wireStates.set(99, [1]);
      expect(formatGateOutput(andGate, wireStates)).toBe('Output: -');
    });

    it('should format output as 0', () => {
      const wireStates = new Map<number, number[]>();
      wireStates.set(3, [0]);
      expect(formatGateOutput(andGate, wireStates)).toBe('Output: 0');
    });

    it('should format output as 1', () => {
      const wireStates = new Map<number, number[]>();
      wireStates.set(3, [1]);
      expect(formatGateOutput(andGate, wireStates)).toBe('Output: 1');
    });

    it('should format unknown output as X', () => {
      const wireStates = new Map<number, number[]>();
      wireStates.set(3, [2]); // Unknown state
      expect(formatGateOutput(andGate, wireStates)).toBe('Output: X');
    });
  });

  describe('DEFAULT_TOOLTIP_CONFIG', () => {
    it('should have default offset values', () => {
      expect(DEFAULT_TOOLTIP_CONFIG.offsetX).toBe(12);
      expect(DEFAULT_TOOLTIP_CONFIG.offsetY).toBe(12);
    });

    it('should have default edge padding', () => {
      expect(DEFAULT_TOOLTIP_CONFIG.edgePadding).toBe(8);
    });
  });

  describe('mount()', () => {
    it('should create tooltip element in container', () => {
      tooltip.mount(container);

      const element = container.querySelector('.da-gate-tooltip');
      expect(element).not.toBeNull();
    });

    it('should set initial display to none', () => {
      tooltip.mount(container);

      const element = tooltip.getElement();
      expect(element?.style.display).toBe('none');
    });

    it('should set position to absolute', () => {
      tooltip.mount(container);

      const element = tooltip.getElement();
      expect(element?.style.position).toBe('absolute');
    });

    it('should disable pointer events', () => {
      tooltip.mount(container);

      const element = tooltip.getElement();
      expect(element?.style.pointerEvents).toBe('none');
    });

    it('should set accessibility role', () => {
      tooltip.mount(container);

      const element = tooltip.getElement();
      expect(element?.getAttribute('role')).toBe('tooltip');
    });

    it('should set aria-hidden to true initially', () => {
      tooltip.mount(container);

      const element = tooltip.getElement();
      expect(element?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('show()', () => {
    beforeEach(() => {
      tooltip.mount(container);
    });

    it('should display the tooltip', () => {
      tooltip.show(100, 100, andGate);

      const element = tooltip.getElement();
      expect(element?.style.display).toBe('block');
    });

    it('should set aria-hidden to false when shown', () => {
      tooltip.show(100, 100, andGate);

      const element = tooltip.getElement();
      expect(element?.getAttribute('aria-hidden')).toBe('false');
    });

    it('should display gate type', () => {
      tooltip.show(100, 100, andGate);

      const element = tooltip.getElement();
      expect(element?.textContent).toContain('AND');
    });

    it('should display gate name', () => {
      tooltip.show(100, 100, andGate);

      const element = tooltip.getElement();
      expect(element?.textContent).toContain('AND1');
    });

    it('should display output value when wire states provided', () => {
      const wireStates = new Map<number, number[]>();
      wireStates.set(3, [1]);

      tooltip.show(100, 100, andGate, wireStates);

      const element = tooltip.getElement();
      expect(element?.textContent).toContain('Output: 1');
    });

    it('should display stored value for DFF gates', () => {
      tooltip.show(100, 100, dffGate);

      const element = tooltip.getElement();
      expect(element?.textContent).toContain('Stored: 1');
    });

    it('should escape HTML in gate names (XSS prevention)', () => {
      const maliciousGate: CircuitGate = {
        id: 1,
        name: '<script>alert("xss")</script>',
        type: 'AND',
        inputs: [],
        outputs: [{ wire: 1, bit: 0 }],
      };

      tooltip.show(100, 100, maliciousGate);

      const element = tooltip.getElement();
      // Should be escaped, not executed
      expect(element?.innerHTML).toContain('&lt;script&gt;');
      expect(element?.innerHTML).not.toContain('<script>');
    });

    it('should do nothing if not mounted', () => {
      const unmounted = new GateTooltip();
      // Should not throw
      unmounted.show(100, 100, andGate);
      expect(unmounted.getElement()).toBeNull();
    });

    it('should position tooltip near cursor', () => {
      // Mock tooltip getBoundingClientRect for positioning
      tooltip.show(100, 100, andGate);
      const element = tooltip.getElement()!;
      vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        right: 100,
        bottom: 50,
        width: 100,
        height: 50,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      // Re-show to trigger positioning
      tooltip.show(200, 150, andGate);

      // Should be offset from cursor position
      expect(element.style.left).toBe('212px'); // 200 + 12 offset
      expect(element.style.top).toBe('162px'); // 150 + 12 offset
    });
  });

  describe('hide()', () => {
    beforeEach(() => {
      tooltip.mount(container);
    });

    it('should hide the tooltip', () => {
      tooltip.show(100, 100, andGate);
      tooltip.hide();

      const element = tooltip.getElement();
      expect(element?.style.display).toBe('none');
    });

    it('should set aria-hidden to true', () => {
      tooltip.show(100, 100, andGate);
      tooltip.hide();

      const element = tooltip.getElement();
      expect(element?.getAttribute('aria-hidden')).toBe('true');
    });

    it('should do nothing if not mounted', () => {
      const unmounted = new GateTooltip();
      // Should not throw
      unmounted.hide();
    });
  });

  describe('isVisible()', () => {
    beforeEach(() => {
      tooltip.mount(container);
    });

    it('should return false initially', () => {
      expect(tooltip.isVisible()).toBe(false);
    });

    it('should return true after show', () => {
      tooltip.show(100, 100, andGate);
      expect(tooltip.isVisible()).toBe(true);
    });

    it('should return false after hide', () => {
      tooltip.show(100, 100, andGate);
      tooltip.hide();
      expect(tooltip.isVisible()).toBe(false);
    });

    it('should return false if not mounted', () => {
      const unmounted = new GateTooltip();
      expect(unmounted.isVisible()).toBe(false);
    });
  });

  describe('destroy()', () => {
    it('should remove tooltip element from DOM', () => {
      tooltip.mount(container);
      tooltip.destroy();

      const element = container.querySelector('.da-gate-tooltip');
      expect(element).toBeNull();
    });

    it('should clear element reference', () => {
      tooltip.mount(container);
      tooltip.destroy();

      expect(tooltip.getElement()).toBeNull();
    });

    it('should handle not being mounted', () => {
      // Should not throw
      tooltip.destroy();
    });
  });

  describe('getElement()', () => {
    it('should return null before mount', () => {
      expect(tooltip.getElement()).toBeNull();
    });

    it('should return element after mount', () => {
      tooltip.mount(container);
      expect(tooltip.getElement()).not.toBeNull();
    });

    it('should return null after destroy', () => {
      tooltip.mount(container);
      tooltip.destroy();
      expect(tooltip.getElement()).toBeNull();
    });
  });

  describe('custom configuration', () => {
    it('should accept custom offset values', () => {
      const customTooltip = new GateTooltip({
        offsetX: 20,
        offsetY: 30,
      });
      customTooltip.mount(container);

      // Show tooltip and check positioning
      customTooltip.show(100, 100, andGate);
      const element = customTooltip.getElement()!;
      vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        right: 100,
        bottom: 50,
        width: 100,
        height: 50,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      // Re-show to trigger positioning with mock
      customTooltip.show(100, 100, andGate);

      expect(element.style.left).toBe('120px'); // 100 + 20 custom offset
      expect(element.style.top).toBe('130px'); // 100 + 30 custom offset

      customTooltip.destroy();
    });
  });

  describe('edge detection', () => {
    beforeEach(() => {
      tooltip.mount(container);
    });

    it('should flip tooltip to left of cursor when near right edge', () => {
      const element = tooltip.getElement()!;
      vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        right: 100,
        bottom: 50,
        width: 100,
        height: 50,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      // Position near right edge (1024 - 50 = 974, tooltip width 100)
      tooltip.show(980, 100, andGate);

      // Should flip to left side: 980 - 100 - 12 = 868
      expect(element.style.left).toBe('868px');
    });

    it('should flip tooltip above cursor when near bottom edge', () => {
      const element = tooltip.getElement()!;
      vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        right: 100,
        bottom: 50,
        width: 100,
        height: 50,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      // Position near bottom edge (768 - 50 = 718)
      tooltip.show(100, 750, andGate);

      // Should flip above: 750 - 50 - 12 = 688
      expect(element.style.top).toBe('688px');
    });

    it('should enforce minimum position (edge padding)', () => {
      const element = tooltip.getElement()!;
      vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        right: 200,
        bottom: 100,
        width: 200,
        height: 100,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      // Position near right edge to trigger flip, with small clientX
      // After flip: 50 - 200 (width) - 12 (offset) = -162
      // Should clamp to edge padding (8)
      tooltip.show(50, 50, andGate);

      // Should be clamped to edge padding (since 50 + 12 + 200 > 1024 - 8 = 1016)
      // But actually 50 + 12 + 200 = 262 < 1016, so no flip needed
      // Let's position near the right edge to force a flip
      vi.stubGlobal('innerWidth', 200); // Narrow window
      tooltip.show(150, 50, andGate);
      // 150 + 12 + 200 = 362 > 200 - 8 = 192, so flip left
      // After flip: 150 - 200 - 12 = -62, clamped to 8
      expect(element.style.left).toBe('8px');
    });
  });
});
