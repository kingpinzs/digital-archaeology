// src/examples/ExampleTooltip.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ExampleTooltip } from './ExampleTooltip';
import type { ExampleProgram } from './types';

describe('ExampleTooltip (Story 8.3)', () => {
  let tooltip: ExampleTooltip;
  let anchorElement: HTMLElement;
  const testProgram: ExampleProgram = {
    filename: 'test.asm',
    name: 'Test Program',
    category: 'arithmetic',
    description: 'A test program description',
    concepts: ['LDA', 'ADD', 'memory'],
    difficulty: 'beginner',
  };

  beforeEach(() => {
    tooltip = new ExampleTooltip();
    anchorElement = document.createElement('button');
    anchorElement.style.position = 'fixed';
    anchorElement.style.left = '100px';
    anchorElement.style.top = '100px';
    anchorElement.style.width = '100px';
    anchorElement.style.height = '30px';
    document.body.appendChild(anchorElement);
  });

  afterEach(() => {
    tooltip.destroy();
    anchorElement.remove();
    // Clean up any remaining tooltips
    document.querySelectorAll('.da-example-tooltip').forEach((el) => el.remove());
  });

  describe('show()', () => {
    it('should create a tooltip element in the DOM', () => {
      tooltip.show(testProgram, anchorElement);

      const tooltipEl = document.querySelector('.da-example-tooltip');
      expect(tooltipEl).not.toBeNull();
    });

    it('should display the program name', () => {
      tooltip.show(testProgram, anchorElement);

      const nameEl = document.querySelector('.da-example-tooltip-name');
      expect(nameEl?.textContent).toBe('Test Program');
    });

    it('should display the program description', () => {
      tooltip.show(testProgram, anchorElement);

      const descEl = document.querySelector('.da-example-tooltip-description');
      expect(descEl?.textContent).toBe('A test program description');
    });

    it('should display the difficulty badge with correct label', () => {
      tooltip.show(testProgram, anchorElement);

      const diffEl = document.querySelector('.da-example-tooltip-difficulty');
      expect(diffEl?.textContent).toBe('Beginner');
      expect(diffEl?.classList.contains('da-difficulty-beginner')).toBe(true);
    });

    it('should display all concepts as tags', () => {
      tooltip.show(testProgram, anchorElement);

      const conceptTags = document.querySelectorAll('.da-example-concept-tag');
      expect(conceptTags.length).toBe(3);
      expect(conceptTags[0].textContent).toBe('LDA');
      expect(conceptTags[1].textContent).toBe('ADD');
      expect(conceptTags[2].textContent).toBe('memory');
    });

    it('should add visible class for fade-in animation', () => {
      tooltip.show(testProgram, anchorElement);

      const tooltipEl = document.querySelector('.da-example-tooltip');
      expect(tooltipEl?.classList.contains('da-example-tooltip--visible')).toBe(true);
    });

    it('should have role="tooltip" for accessibility', () => {
      tooltip.show(testProgram, anchorElement);

      const tooltipEl = document.querySelector('.da-example-tooltip');
      expect(tooltipEl?.getAttribute('role')).toBe('tooltip');
    });
  });

  describe('difficulty levels', () => {
    it('should display intermediate difficulty correctly', () => {
      const intermediateProgram: ExampleProgram = {
        ...testProgram,
        difficulty: 'intermediate',
      };
      tooltip.show(intermediateProgram, anchorElement);

      const diffEl = document.querySelector('.da-example-tooltip-difficulty');
      expect(diffEl?.textContent).toBe('Intermediate');
      expect(diffEl?.classList.contains('da-difficulty-intermediate')).toBe(true);
    });

    it('should display advanced difficulty correctly', () => {
      const advancedProgram: ExampleProgram = {
        ...testProgram,
        difficulty: 'advanced',
      };
      tooltip.show(advancedProgram, anchorElement);

      const diffEl = document.querySelector('.da-example-tooltip-difficulty');
      expect(diffEl?.textContent).toBe('Advanced');
      expect(diffEl?.classList.contains('da-difficulty-advanced')).toBe(true);
    });
  });

  describe('hide()', () => {
    it('should remove visible class for fade-out animation', () => {
      tooltip.show(testProgram, anchorElement);
      tooltip.hide();

      const tooltipEl = document.querySelector('.da-example-tooltip');
      expect(tooltipEl?.classList.contains('da-example-tooltip--visible')).toBe(false);
    });

    it('should not throw if called before show', () => {
      expect(() => tooltip.hide()).not.toThrow();
    });
  });

  describe('destroy()', () => {
    it('should remove the tooltip element from DOM', () => {
      tooltip.show(testProgram, anchorElement);
      tooltip.destroy();

      const tooltipEl = document.querySelector('.da-example-tooltip');
      expect(tooltipEl).toBeNull();
    });

    it('should not throw if called multiple times', () => {
      tooltip.show(testProgram, anchorElement);
      tooltip.destroy();
      expect(() => tooltip.destroy()).not.toThrow();
    });

    it('should not throw if called before show', () => {
      expect(() => tooltip.destroy()).not.toThrow();
    });
  });

  describe('positioning', () => {
    it('should position tooltip near anchor element', () => {
      tooltip.show(testProgram, anchorElement);

      const tooltipEl = document.querySelector('.da-example-tooltip') as HTMLElement;
      expect(tooltipEl).not.toBeNull();
      // Tooltip should be positioned with fixed coordinates
      expect(tooltipEl.style.left).toMatch(/^\d+px$/);
      expect(tooltipEl.style.top).toMatch(/^\d+px$/);
    });

    it('should handle showing for different anchors without error', () => {
      // First anchor
      tooltip.show(testProgram, anchorElement);
      const tooltipEl = document.querySelector('.da-example-tooltip') as HTMLElement;
      expect(tooltipEl).not.toBeNull();
      expect(tooltipEl.style.left).toBeTruthy();

      // Second anchor
      const secondAnchor = document.createElement('button');
      secondAnchor.style.position = 'fixed';
      secondAnchor.style.left = '400px';
      secondAnchor.style.top = '100px';
      secondAnchor.style.width = '100px';
      secondAnchor.style.height = '30px';
      document.body.appendChild(secondAnchor);

      // Should update without throwing
      expect(() => tooltip.show(testProgram, secondAnchor)).not.toThrow();

      // Tooltip should still be visible
      expect(tooltipEl.classList.contains('da-example-tooltip--visible')).toBe(true);

      secondAnchor.remove();
    });
  });

  describe('content updates', () => {
    it('should update content when showing different program', () => {
      tooltip.show(testProgram, anchorElement);

      const differentProgram: ExampleProgram = {
        filename: 'other.asm',
        name: 'Other Program',
        category: 'algorithms',
        description: 'Different description',
        concepts: ['loops', 'branching'],
        difficulty: 'advanced',
      };
      tooltip.show(differentProgram, anchorElement);

      const nameEl = document.querySelector('.da-example-tooltip-name');
      expect(nameEl?.textContent).toBe('Other Program');

      const diffEl = document.querySelector('.da-example-tooltip-difficulty');
      expect(diffEl?.textContent).toBe('Advanced');

      const conceptTags = document.querySelectorAll('.da-example-concept-tag');
      expect(conceptTags.length).toBe(2);
    });
  });

  describe('XSS prevention', () => {
    it('should escape HTML in program name', () => {
      const xssProgram: ExampleProgram = {
        ...testProgram,
        name: '<script>alert("xss")</script>',
      };
      tooltip.show(xssProgram, anchorElement);

      const nameEl = document.querySelector('.da-example-tooltip-name');
      expect(nameEl?.textContent).toContain('<script>');
      expect(nameEl?.innerHTML).not.toContain('<script>');
    });

    it('should escape HTML in description (Code Review fix)', () => {
      const xssProgram: ExampleProgram = {
        ...testProgram,
        description: '<script>alert("xss")</script>',
      };
      tooltip.show(xssProgram, anchorElement);

      const descEl = document.querySelector('.da-example-tooltip-description');
      expect(descEl?.textContent).toContain('<script>');
      expect(descEl?.innerHTML).not.toContain('<script>');
    });

    it('should escape HTML in concepts', () => {
      const xssProgram: ExampleProgram = {
        ...testProgram,
        concepts: ['<img src=x onerror=alert(1)>'],
      };
      tooltip.show(xssProgram, anchorElement);

      const conceptTag = document.querySelector('.da-example-concept-tag');
      expect(conceptTag?.innerHTML).not.toContain('<img');
    });
  });

  describe('edge cases (Code Review fix)', () => {
    it('should handle empty concepts array gracefully', () => {
      const emptyConceptsProgram: ExampleProgram = {
        ...testProgram,
        concepts: [],
      };
      tooltip.show(emptyConceptsProgram, anchorElement);

      const conceptsDiv = document.querySelector('.da-example-tooltip-concepts');
      expect(conceptsDiv).not.toBeNull();
      const conceptTags = document.querySelectorAll('.da-example-concept-tag');
      expect(conceptTags.length).toBe(0);
    });
  });

  describe('accessibility (Code Review fix)', () => {
    it('should have id attribute for aria-describedby reference', () => {
      tooltip.show(testProgram, anchorElement);

      const tooltipEl = document.querySelector('.da-example-tooltip');
      expect(tooltipEl?.id).toBe('da-example-tooltip');
    });

    it('should toggle aria-hidden when showing and hiding', () => {
      tooltip.show(testProgram, anchorElement);

      const tooltipEl = document.querySelector('.da-example-tooltip');
      expect(tooltipEl?.getAttribute('aria-hidden')).toBe('false');

      tooltip.hide();
      expect(tooltipEl?.getAttribute('aria-hidden')).toBe('true');
    });
  });
});
