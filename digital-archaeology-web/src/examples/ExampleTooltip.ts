// src/examples/ExampleTooltip.ts
// Tooltip component for displaying example program details on hover

import type { ExampleProgram } from './types';
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS } from './types';
import { escapeHtml } from '../utils/escapeHtml';

/**
 * Tooltip component that displays program details on hover.
 * Shows description, concepts, and difficulty level.
 */
export class ExampleTooltip {
  private element: HTMLElement | null = null;
  private currentProgram: ExampleProgram | null = null;

  /**
   * Show the tooltip for a program near the anchor element.
   */
  show(program: ExampleProgram, anchorElement: HTMLElement): void {
    // Update content if different program or first show
    if (!this.element || this.currentProgram !== program) {
      this.currentProgram = program;
      this.createOrUpdateElement(program);
    }

    // Position and show
    this.positionTooltip(anchorElement);
    this.element!.classList.add('da-example-tooltip--visible');
    this.element!.setAttribute('aria-hidden', 'false');
  }

  /**
   * Hide the tooltip with a fade-out animation.
   */
  hide(): void {
    if (this.element) {
      this.element.classList.remove('da-example-tooltip--visible');
      this.element.setAttribute('aria-hidden', 'true');
    }
  }

  /**
   * Clean up the tooltip element.
   */
  destroy(): void {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
    this.currentProgram = null;
  }

  /**
   * Create or update the tooltip element with program content.
   */
  private createOrUpdateElement(program: ExampleProgram): void {
    if (!this.element) {
      this.element = document.createElement('div');
      this.element.className = 'da-example-tooltip';
      this.element.id = 'da-example-tooltip';
      this.element.setAttribute('role', 'tooltip');
      this.element.setAttribute('aria-hidden', 'true');
      document.body.appendChild(this.element);
    }

    const difficultyClass = `da-difficulty-${program.difficulty}`;
    const difficultyLabel = DIFFICULTY_LABELS[program.difficulty];
    const difficultyColor = DIFFICULTY_COLORS[program.difficulty];

    // Build concepts HTML
    const conceptsHtml = program.concepts
      .map((concept) => `<span class="da-example-concept-tag">${escapeHtml(concept)}</span>`)
      .join('');

    this.element.innerHTML = `
      <div class="da-example-tooltip-header">
        <span class="da-example-tooltip-name">${escapeHtml(program.name)}</span>
        <span class="da-example-tooltip-difficulty ${difficultyClass}" style="color: ${difficultyColor}">${escapeHtml(difficultyLabel)}</span>
      </div>
      <p class="da-example-tooltip-description">${escapeHtml(program.description)}</p>
      <div class="da-example-tooltip-concepts">
        ${conceptsHtml}
      </div>
    `.trim();
  }

  /**
   * Position the tooltip near the anchor element.
   * Positions to the right by default, flips left if would overflow.
   */
  private positionTooltip(anchorElement: HTMLElement): void {
    if (!this.element) return;

    const rect = anchorElement.getBoundingClientRect();
    const tooltip = this.element;

    // Need to show briefly to get dimensions
    tooltip.style.visibility = 'hidden';
    tooltip.style.display = 'block';

    const tooltipWidth = tooltip.offsetWidth;
    const tooltipHeight = tooltip.offsetHeight;

    // Position to the right of the anchor
    let left = rect.right + 8;
    let top = rect.top;

    // If would go off right edge, position to left
    if (left + tooltipWidth > window.innerWidth - 8) {
      left = rect.left - tooltipWidth - 8;
    }

    // If would go off left edge, position below
    if (left < 8) {
      left = rect.left;
      top = rect.bottom + 8;
    }

    // Keep within vertical bounds
    if (top + tooltipHeight > window.innerHeight - 8) {
      top = window.innerHeight - tooltipHeight - 8;
    }

    // Keep above top edge
    if (top < 8) {
      top = 8;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    tooltip.style.visibility = 'visible';
  }
}
