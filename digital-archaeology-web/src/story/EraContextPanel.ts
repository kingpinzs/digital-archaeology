// src/story/EraContextPanel.ts
// Panel displaying era context for historical mindset
// Story 10.21: Historical Mindset Time-Travel
//
// XSS Protection: All dynamic content is escaped via escapeHtml() before
// insertion. The template strings contain only escaped user content and
// hardcoded UI strings.

import type { MindsetContext, EraConstraint, EraProblem } from './types';

/**
 * Component that displays the historical era context.
 * Shows what the user "knows" and "doesn't know" in this time period.
 * Helps establish the "you are THERE" mindset.
 */
export class EraContextPanel {
  private element: HTMLElement | null = null;
  private mindsetContext: MindsetContext | null = null;
  private collapsedSections: Set<string> = new Set();

  // Bound event handlers for cleanup
  private boundHandleToggle: (e: Event) => void;

  constructor() {
    this.boundHandleToggle = this.handleToggle.bind(this);
  }

  /**
   * Mount the panel to the DOM.
   */
  mount(container: HTMLElement): void {
    this.element = document.createElement('div');
    this.element.className = 'da-era-context-panel';
    this.element.setAttribute('role', 'region');
    this.element.setAttribute('aria-labelledby', 'era-context-title');
    container.appendChild(this.element);
    this.render();
  }

  /**
   * Set the mindset context and re-render.
   */
  setMindset(context: MindsetContext): void {
    this.mindsetContext = context;
    this.render();
  }

  /**
   * Get the current mindset context.
   */
  getMindset(): MindsetContext | null {
    return this.mindsetContext;
  }

  /**
   * Toggle a section's collapsed state.
   */
  toggleSection(sectionId: string): void {
    if (this.collapsedSections.has(sectionId)) {
      this.collapsedSections.delete(sectionId);
    } else {
      this.collapsedSections.add(sectionId);
    }
    this.render();
  }

  /**
   * Render the panel content.
   * All dynamic content from mindsetContext is escaped via escapeHtml().
   */
  private render(): void {
    if (!this.element) return;

    if (!this.mindsetContext) {
      this.element.textContent = '';
      return;
    }

    const ctx = this.mindsetContext;

    // Build HTML with all dynamic content escaped
    const yearDisplay = this.formatYear(ctx.year);
    const perspective = this.escapeHtml(ctx.historicalPerspective.currentKnowledge);
    const futureBlind = this.escapeHtml(ctx.historicalPerspective.futureBlind);

    // Safe innerHTML: all dynamic content is escaped
    this.element.innerHTML = `
      <div class="da-era-context-header">
        <div class="da-era-year" id="era-context-title" aria-label="Current year: ${ctx.year}">
          ${yearDisplay}
        </div>
        <div class="da-era-perspective">${perspective}</div>
      </div>

      ${this.renderSection('known', 'WHAT YOU KNOW', this.renderKnownTechnology(ctx.knownTechnology))}
      ${this.renderSection('unknown', "WHAT DOESN'T EXIST YET", this.renderUnknownTechnology(ctx.unknownTechnology))}
      ${this.renderSection('problems', 'THE PROBLEM', this.renderProblems(ctx.activeProblems))}
      ${this.renderSection('constraints', 'YOUR CONSTRAINTS', this.renderConstraints(ctx.constraints))}
      ${ctx.impossibilities.length > 0 ? this.renderSection('impossible', "WHAT'S IMPOSSIBLE", this.renderImpossibilities(ctx.impossibilities)) : ''}

      <div class="da-era-context-footer">
        <div class="da-future-blind">${futureBlind}</div>
      </div>
    `;

    // Attach event listeners
    this.element.querySelectorAll('.da-era-section-toggle').forEach((toggle) => {
      toggle.addEventListener('click', this.boundHandleToggle);
    });
  }

  /**
   * Format a year for display, handling BC years.
   */
  private formatYear(year: number): string {
    if (year < 0) {
      return `${Math.abs(year)} BC`;
    }
    // For very old years, show "~" prefix
    if (year < 1000) {
      return `~${year} AD`;
    }
    return year.toString();
  }

  /**
   * Render a collapsible section.
   */
  private renderSection(id: string, title: string, content: string): string {
    const isCollapsed = this.collapsedSections.has(id);
    return `
      <div class="da-era-section ${isCollapsed ? 'da-era-section--collapsed' : ''}" data-section="${id}">
        <button
          class="da-era-section-toggle"
          data-section-id="${id}"
          aria-expanded="${!isCollapsed}"
          aria-controls="era-section-${id}-content"
        >
          <span class="da-era-section-title">${title}</span>
          <span class="da-era-section-icon">${isCollapsed ? '+' : '\u2212'}</span>
        </button>
        <div
          class="da-era-section-content"
          id="era-section-${id}-content"
          ${isCollapsed ? 'hidden' : ''}
        >
          ${content}
        </div>
      </div>
    `;
  }

  /**
   * Render known technologies list. All content escaped.
   */
  private renderKnownTechnology(technologies: string[]): string {
    if (technologies.length === 0) {
      return '<p class="da-era-empty">Limited technology available</p>';
    }
    return `
      <ul class="da-era-list">
        ${technologies.map((tech) => `<li>${this.escapeHtml(tech)}</li>`).join('')}
      </ul>
    `;
  }

  /**
   * Render unknown technologies list. All content escaped.
   */
  private renderUnknownTechnology(technologies: string[]): string {
    if (technologies.length === 0) {
      return '<p class="da-era-empty">Everything modern is available</p>';
    }
    return `
      <ul class="da-era-list da-era-list--unknown">
        ${technologies.map((tech) => `<li><span class="da-era-not-yet">\u2717</span> ${this.escapeHtml(tech)}</li>`).join('')}
      </ul>
    `;
  }

  /**
   * Render active problems. All content escaped.
   */
  private renderProblems(problems: EraProblem[]): string {
    if (problems.length === 0) {
      return '<p class="da-era-empty">No specific problems defined</p>';
    }
    return problems
      .map(
        (problem) => `
      <div class="da-era-problem">
        <p class="da-era-problem-statement">${this.escapeHtml(problem.statement)}</p>
        <p class="da-era-problem-motivation">${this.escapeHtml(problem.motivation)}</p>
        ${
          problem.currentApproaches && problem.currentApproaches.length > 0
            ? `
          <div class="da-era-approaches">
            <span class="da-era-approaches-label">Options being discussed:</span>
            <ul class="da-era-list">
              ${problem.currentApproaches.map((approach) => `<li>${this.escapeHtml(approach)}</li>`).join('')}
            </ul>
          </div>
        `
            : ''
        }
      </div>
    `
      )
      .join('');
  }

  /**
   * Render constraints with icons. All content escaped.
   */
  private renderConstraints(constraints: EraConstraint[]): string {
    if (constraints.length === 0) {
      return '<p class="da-era-empty">No specific constraints</p>';
    }

    const icons: Record<string, string> = {
      technical: '\uD83D\uDD27', // wrench
      economic: '\uD83D\uDCB0', // money bag
      knowledge: '\uD83D\uDCDA', // books
      material: '\uD83E\uDDF1', // brick
      political: '\uD83C\uDFDB\uFE0F', // classical building
    };

    return `
      <ul class="da-era-constraints">
        ${constraints
          .map(
            (c) => `
          <li class="da-era-constraint">
            <span class="da-era-constraint-icon">${icons[c.type] || '\u2022'}</span>
            <span class="da-era-constraint-text">${this.escapeHtml(c.description)}</span>
            ${c.limitation ? `<span class="da-era-constraint-limit">(${this.escapeHtml(c.limitation)})</span>` : ''}
          </li>
        `
          )
          .join('')}
      </ul>
    `;
  }

  /**
   * Render impossibilities list. All content escaped.
   */
  private renderImpossibilities(impossibilities: string[]): string {
    return `
      <ul class="da-era-list da-era-list--impossible">
        ${impossibilities.map((item) => `<li><span class="da-era-impossible">\u26A0</span> ${this.escapeHtml(item)}</li>`).join('')}
      </ul>
    `;
  }

  /**
   * Handle section toggle clicks.
   */
  private handleToggle(e: Event): void {
    const target = e.currentTarget as HTMLElement;
    const sectionId = target.dataset.sectionId;
    if (sectionId) {
      this.toggleSection(sectionId);
    }
  }

  /**
   * Escape HTML to prevent XSS.
   * Uses browser's built-in textContent encoding.
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Clean up the component.
   */
  destroy(): void {
    if (this.element) {
      this.element.querySelectorAll('.da-era-section-toggle').forEach((toggle) => {
        toggle.removeEventListener('click', this.boundHandleToggle);
      });
      this.element.remove();
    }
    this.element = null;
    this.mindsetContext = null;
    this.collapsedSections.clear();
  }
}
