// src/story/EraContextPanel.test.ts
// Tests for EraContextPanel component
// Story 10.21: Historical Mindset Time-Travel

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EraContextPanel } from './EraContextPanel';
import type { MindsetContext } from './types';

describe('EraContextPanel', () => {
  let panel: EraContextPanel;
  let container: HTMLElement;

  const mockMindset: MindsetContext = {
    year: 1971,
    knownTechnology: ['transistor', 'integrated circuit', 'calculator chip'],
    unknownTechnology: ['internet', 'smartphone', 'cloud computing'],
    activeProblems: [
      {
        statement: 'How to put a CPU on a single chip?',
        motivation: 'Reduce cost and power consumption',
        currentApproaches: ['MSI chips', 'Custom LSI', 'Bipolar technology'],
      },
    ],
    constraints: [
      {
        type: 'technical',
        description: 'Limited transistor count',
        limitation: '2300 transistors max',
      },
      {
        type: 'economic',
        description: 'Must compete with dedicated calculators',
      },
    ],
    impossibilities: ['1GB RAM', 'GHz clock speeds', 'multi-core processors'],
    historicalPerspective: {
      currentKnowledge: 'You are at Intel, working on project Busicom.',
      futureBlind: 'You do not know if this "microprocessor" idea will succeed.',
    },
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    panel = new EraContextPanel();
  });

  afterEach(() => {
    panel.destroy();
    container.remove();
  });

  describe('mount', () => {
    it('should create panel element in container', () => {
      panel.mount(container);
      expect(container.querySelector('.da-era-context-panel')).not.toBeNull();
    });

    it('should have region role for accessibility', () => {
      panel.mount(container);
      const element = container.querySelector('.da-era-context-panel');
      expect(element?.getAttribute('role')).toBe('region');
    });

    it('should have aria-labelledby for accessibility', () => {
      panel.mount(container);
      const element = container.querySelector('.da-era-context-panel');
      expect(element?.getAttribute('aria-labelledby')).toBe('era-context-title');
    });
  });

  describe('setMindset', () => {
    beforeEach(() => {
      panel.mount(container);
    });

    it('should display the year prominently', () => {
      panel.setMindset(mockMindset);
      const yearElement = container.querySelector('.da-era-year');
      expect(yearElement?.textContent?.trim()).toBe('1971');
    });

    it('should format BC years correctly', () => {
      panel.setMindset({ ...mockMindset, year: -500 });
      const yearElement = container.querySelector('.da-era-year');
      expect(yearElement?.textContent?.trim()).toBe('500 BC');
    });

    it('should format early AD years with tilde', () => {
      panel.setMindset({ ...mockMindset, year: 500 });
      const yearElement = container.querySelector('.da-era-year');
      expect(yearElement?.textContent?.trim()).toBe('~500 AD');
    });

    it('should display current knowledge perspective', () => {
      panel.setMindset(mockMindset);
      const perspective = container.querySelector('.da-era-perspective');
      expect(perspective?.textContent).toContain('You are at Intel');
    });

    it('should display future blind statement', () => {
      panel.setMindset(mockMindset);
      const futureBlind = container.querySelector('.da-future-blind');
      expect(futureBlind?.textContent).toContain('You do not know');
    });
  });

  describe('WHAT YOU KNOW section', () => {
    beforeEach(() => {
      panel.mount(container);
      panel.setMindset(mockMindset);
    });

    it('should list known technologies', () => {
      const knownSection = container.querySelector('[data-section="known"]');
      expect(knownSection).not.toBeNull();
      expect(knownSection?.textContent).toContain('transistor');
      expect(knownSection?.textContent).toContain('integrated circuit');
      expect(knownSection?.textContent).toContain('calculator chip');
    });

    it('should show empty message when no known technologies', () => {
      panel.setMindset({ ...mockMindset, knownTechnology: [] });
      const knownSection = container.querySelector('[data-section="known"]');
      expect(knownSection?.textContent).toContain('Limited technology available');
    });
  });

  describe("WHAT DOESN'T EXIST section", () => {
    beforeEach(() => {
      panel.mount(container);
      panel.setMindset(mockMindset);
    });

    it('should list unknown technologies', () => {
      const unknownSection = container.querySelector('[data-section="unknown"]');
      expect(unknownSection).not.toBeNull();
      expect(unknownSection?.textContent).toContain('internet');
      expect(unknownSection?.textContent).toContain('smartphone');
    });

    it('should show X markers for unknown items', () => {
      const markers = container.querySelectorAll('.da-era-not-yet');
      expect(markers.length).toBe(3);
    });
  });

  describe('THE PROBLEM section', () => {
    beforeEach(() => {
      panel.mount(container);
      panel.setMindset(mockMindset);
    });

    it('should display problem statement', () => {
      const problemSection = container.querySelector('[data-section="problems"]');
      expect(problemSection?.textContent).toContain('How to put a CPU on a single chip');
    });

    it('should display problem motivation', () => {
      const problemSection = container.querySelector('[data-section="problems"]');
      expect(problemSection?.textContent).toContain('Reduce cost');
    });

    it('should display current approaches', () => {
      const problemSection = container.querySelector('[data-section="problems"]');
      expect(problemSection?.textContent).toContain('MSI chips');
      expect(problemSection?.textContent).toContain('Custom LSI');
    });
  });

  describe('YOUR CONSTRAINTS section', () => {
    beforeEach(() => {
      panel.mount(container);
      panel.setMindset(mockMindset);
    });

    it('should display constraints', () => {
      const constraintSection = container.querySelector('[data-section="constraints"]');
      expect(constraintSection?.textContent).toContain('Limited transistor count');
      expect(constraintSection?.textContent).toContain('2300 transistors');
    });

    it('should display constraint icons', () => {
      const icons = container.querySelectorAll('.da-era-constraint-icon');
      expect(icons.length).toBe(2);
    });
  });

  describe("WHAT'S IMPOSSIBLE section", () => {
    beforeEach(() => {
      panel.mount(container);
      panel.setMindset(mockMindset);
    });

    it('should display impossibilities', () => {
      const impossibleSection = container.querySelector('[data-section="impossible"]');
      expect(impossibleSection?.textContent).toContain('1GB RAM');
      expect(impossibleSection?.textContent).toContain('GHz clock speeds');
    });

    it('should not render section when no impossibilities', () => {
      panel.setMindset({ ...mockMindset, impossibilities: [] });
      const impossibleSection = container.querySelector('[data-section="impossible"]');
      expect(impossibleSection).toBeNull();
    });
  });

  describe('collapsible sections', () => {
    beforeEach(() => {
      panel.mount(container);
      panel.setMindset(mockMindset);
    });

    it('should have toggle buttons for each section', () => {
      const toggles = container.querySelectorAll('.da-era-section-toggle');
      expect(toggles.length).toBeGreaterThanOrEqual(4);
    });

    it('should toggle section on click', () => {
      const knownToggle = container.querySelector(
        '[data-section-id="known"]'
      ) as HTMLButtonElement;
      expect(knownToggle?.getAttribute('aria-expanded')).toBe('true');

      knownToggle?.click();

      // Re-query after click since render() replaces DOM elements
      const updatedToggle = container.querySelector(
        '[data-section-id="known"]'
      ) as HTMLButtonElement;
      expect(updatedToggle?.getAttribute('aria-expanded')).toBe('false');
    });

    it('should show collapsed icon when section is collapsed', () => {
      panel.toggleSection('known');
      const icon = container.querySelector('[data-section="known"] .da-era-section-icon');
      expect(icon?.textContent).toBe('+');
    });

    it('should hide content when section is collapsed', () => {
      panel.toggleSection('known');
      const content = container.querySelector('#era-section-known-content');
      expect(content?.hasAttribute('hidden')).toBe(true);
    });
  });

  describe('XSS prevention', () => {
    beforeEach(() => {
      panel.mount(container);
    });

    it('should escape HTML in technology names', () => {
      panel.setMindset({
        ...mockMindset,
        knownTechnology: ['<script>alert("xss")</script>'],
      });
      expect(container.innerHTML).not.toContain('<script>');
      expect(container.innerHTML).toContain('&lt;script&gt;');
    });

    it('should escape HTML in problem statements', () => {
      panel.setMindset({
        ...mockMindset,
        activeProblems: [
          {
            statement: '<img onerror="alert(1)" src="x">',
            motivation: 'test',
          },
        ],
      });
      // The < and > should be escaped, preventing the img tag from being parsed as HTML
      // The text 'onerror=' appearing in escaped content is safe
      expect(container.innerHTML).toContain('&lt;img');
      expect(container.innerHTML).not.toContain('<img ');
    });

    it('should escape HTML in perspective text', () => {
      panel.setMindset({
        ...mockMindset,
        historicalPerspective: {
          currentKnowledge: '<b>bold</b>',
          futureBlind: '<i>italic</i>',
        },
      });
      expect(container.innerHTML).toContain('&lt;b&gt;');
      expect(container.innerHTML).toContain('&lt;i&gt;');
    });
  });

  describe('destroy', () => {
    it('should remove element from DOM', () => {
      panel.mount(container);
      panel.setMindset(mockMindset);
      expect(container.querySelector('.da-era-context-panel')).not.toBeNull();

      panel.destroy();

      expect(container.querySelector('.da-era-context-panel')).toBeNull();
    });

    it('should clear mindset reference', () => {
      panel.mount(container);
      panel.setMindset(mockMindset);
      expect(panel.getMindset()).not.toBeNull();

      panel.destroy();

      expect(panel.getMindset()).toBeNull();
    });
  });
});
