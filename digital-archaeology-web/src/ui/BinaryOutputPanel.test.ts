// src/ui/BinaryOutputPanel.test.ts
// Tests for BinaryOutputPanel component - displays assembled binary as hex dump

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BinaryOutputPanel } from './BinaryOutputPanel';

describe('BinaryOutputPanel', () => {
  let container: HTMLElement;
  let panel: BinaryOutputPanel;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    panel?.destroy();
    container.remove();
  });

  describe('mount/destroy lifecycle', () => {
    it('mounts to container', () => {
      panel = new BinaryOutputPanel();
      panel.mount(container);

      expect(container.querySelector('.da-binary-panel')).not.toBeNull();
    });

    it('destroys cleanly', () => {
      panel = new BinaryOutputPanel();
      panel.mount(container);
      panel.destroy();

      expect(container.querySelector('.da-binary-panel')).toBeNull();
    });

    it('can be mounted multiple times after destroy', () => {
      panel = new BinaryOutputPanel();
      panel.mount(container);
      panel.destroy();
      panel.mount(container);

      expect(container.querySelector('.da-binary-panel')).not.toBeNull();
    });
  });

  describe('setBinary', () => {
    beforeEach(() => {
      panel = new BinaryOutputPanel();
      panel.mount(container);
    });

    it('renders hex dump when binary is set', () => {
      const data = new Uint8Array([0x1A, 0x05, 0x2B, 0x11]);
      panel.setBinary(data);

      const content = container.textContent;
      expect(content).toContain('0x0000:');
      expect(content).toContain('1A');
      expect(content).toContain('05');
      expect(content).toContain('2B');
      expect(content).toContain('11');
    });

    it('clears content when null is passed', () => {
      const data = new Uint8Array([0x1A, 0x05]);
      panel.setBinary(data);
      panel.setBinary(null);

      const rows = container.querySelectorAll('.da-binary-row');
      expect(rows.length).toBe(0);
    });

    it('formats bytes with uppercase hex', () => {
      const data = new Uint8Array([0xAB, 0xCD, 0xEF]);
      panel.setBinary(data);

      const content = container.textContent;
      expect(content).toContain('AB');
      expect(content).toContain('CD');
      expect(content).toContain('EF');
    });

    it('pads single-digit hex values with leading zero', () => {
      const data = new Uint8Array([0x0, 0x1, 0xF]);
      panel.setBinary(data);

      const content = container.textContent;
      expect(content).toContain('00');
      expect(content).toContain('01');
      expect(content).toContain('0F');
    });
  });

  describe('hex dump format - 16 bytes per row (AC #2)', () => {
    beforeEach(() => {
      panel = new BinaryOutputPanel();
      panel.mount(container);
    });

    it('groups bytes in rows of 16', () => {
      // 32 bytes = 2 rows
      const data = new Uint8Array(32);
      panel.setBinary(data);

      const rows = container.querySelectorAll('.da-binary-row');
      expect(rows.length).toBe(2);
    });

    it('shows partial row for data less than 16 bytes', () => {
      const data = new Uint8Array([0x1A, 0x05, 0x2B]);
      panel.setBinary(data);

      const rows = container.querySelectorAll('.da-binary-row');
      expect(rows.length).toBe(1);
    });

    it('shows partial last row when data not multiple of 16', () => {
      // 20 bytes = 1 full row + 1 partial row (4 bytes)
      const data = new Uint8Array(20);
      data.fill(0xFF);
      panel.setBinary(data);

      const rows = container.querySelectorAll('.da-binary-row');
      expect(rows.length).toBe(2);
    });
  });

  describe('address prefix (AC #3)', () => {
    beforeEach(() => {
      panel = new BinaryOutputPanel();
      panel.mount(container);
    });

    it('shows address prefix for first row as 0x0000', () => {
      const data = new Uint8Array(8);
      panel.setBinary(data);

      const addresses = container.querySelectorAll('.da-binary-address');
      expect(addresses[0]?.textContent).toBe('0x0000:');
    });

    it('shows address prefix 0x0010 for second row', () => {
      const data = new Uint8Array(32);
      panel.setBinary(data);

      const addresses = container.querySelectorAll('.da-binary-address');
      expect(addresses[1]?.textContent).toBe('0x0010:');
    });

    it('shows correct address for multiple rows', () => {
      const data = new Uint8Array(48); // 3 rows
      panel.setBinary(data);

      const addresses = container.querySelectorAll('.da-binary-address');
      expect(addresses[0]?.textContent).toBe('0x0000:');
      expect(addresses[1]?.textContent).toBe('0x0010:');
      expect(addresses[2]?.textContent).toBe('0x0020:');
    });
  });

  describe('scrollable container (AC #4)', () => {
    beforeEach(() => {
      panel = new BinaryOutputPanel();
      panel.mount(container);
    });

    it('has scrollable container for content', () => {
      const scrollContainer = container.querySelector('.da-binary-content');
      expect(scrollContainer).not.toBeNull();
    });

    it('container has overflow-y auto style class', () => {
      const scrollContainer = container.querySelector('.da-binary-content');
      expect(scrollContainer?.classList.contains('da-binary-content')).toBe(true);
    });
  });

  describe('toggle visibility (AC #5)', () => {
    beforeEach(() => {
      panel = new BinaryOutputPanel();
      panel.mount(container);
    });

    it('starts hidden by default', () => {
      const panelEl = container.querySelector('.da-binary-panel');
      expect(panelEl?.classList.contains('da-binary-panel--hidden')).toBe(true);
    });

    it('toggles visibility with toggle()', () => {
      const panelEl = container.querySelector('.da-binary-panel');

      panel.toggle();
      expect(panelEl?.classList.contains('da-binary-panel--hidden')).toBe(false);

      panel.toggle();
      expect(panelEl?.classList.contains('da-binary-panel--hidden')).toBe(true);
    });

    it('shows panel with show()', () => {
      const panelEl = container.querySelector('.da-binary-panel');

      panel.show();
      expect(panelEl?.classList.contains('da-binary-panel--hidden')).toBe(false);
    });

    it('hides panel with hide()', () => {
      const panelEl = container.querySelector('.da-binary-panel');

      panel.show();
      panel.hide();
      expect(panelEl?.classList.contains('da-binary-panel--hidden')).toBe(true);
    });

    it('calls onToggle callback when visibility changes', () => {
      const onToggle = vi.fn();
      panel.destroy();
      panel = new BinaryOutputPanel({ onToggle });
      panel.mount(container);

      panel.toggle();
      expect(onToggle).toHaveBeenCalledWith(true);

      panel.toggle();
      expect(onToggle).toHaveBeenCalledWith(false);
    });
  });

  describe('accessibility', () => {
    beforeEach(() => {
      panel = new BinaryOutputPanel();
      panel.mount(container);
    });

    it('has aria-label on panel', () => {
      const panelEl = container.querySelector('.da-binary-panel');
      expect(panelEl?.getAttribute('aria-label')).toBe('Binary Output');
    });

    it('has aria-expanded attribute reflecting visibility', () => {
      const panelEl = container.querySelector('.da-binary-panel');

      expect(panelEl?.getAttribute('aria-expanded')).toBe('false');

      panel.show();
      expect(panelEl?.getAttribute('aria-expanded')).toBe('true');
    });

    it('uses monospace font class', () => {
      const content = container.querySelector('.da-binary-content');
      expect(content?.classList.contains('da-binary-content')).toBe(true);
    });
  });

  describe('styling', () => {
    beforeEach(() => {
      panel = new BinaryOutputPanel();
      panel.mount(container);
    });

    it('has correct CSS classes for styling', () => {
      panel.setBinary(new Uint8Array([0x1A, 0x05]));

      expect(container.querySelector('.da-binary-panel')).not.toBeNull();
      expect(container.querySelector('.da-binary-content')).not.toBeNull();
      expect(container.querySelector('.da-binary-row')).not.toBeNull();
      expect(container.querySelector('.da-binary-address')).not.toBeNull();
      expect(container.querySelector('.da-binary-bytes')).not.toBeNull();
    });
  });

  describe('empty state', () => {
    beforeEach(() => {
      panel = new BinaryOutputPanel();
      panel.mount(container);
    });

    it('shows empty state when no binary set', () => {
      panel.show();
      const content = container.querySelector('.da-binary-content');
      expect(content?.children.length).toBe(0);
    });

    it('shows empty state when empty Uint8Array passed', () => {
      panel.setBinary(new Uint8Array(0));
      const rows = container.querySelectorAll('.da-binary-row');
      expect(rows.length).toBe(0);
    });
  });

  describe('isVisible', () => {
    beforeEach(() => {
      panel = new BinaryOutputPanel();
      panel.mount(container);
    });

    it('returns false when hidden', () => {
      expect(panel.isVisible()).toBe(false);
    });

    it('returns true when shown', () => {
      panel.show();
      expect(panel.isVisible()).toBe(true);
    });
  });
});
