// src/progress/StatisticsDashboard.ts
// Statistics dashboard modal UI component
// Story 19.6: Create Statistics Dashboard

import type { DashboardData } from './types';
import type { AchievementTier } from './types';
import { LAB_STAGES, STAGE_METADATA } from '../config/stageConfig';

/** Exit animation duration in milliseconds */
const EXIT_DURATION_MS = 300;

/** Tier display labels */
const TIER_LABELS: Record<AchievementTier, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

/**
 * Format milliseconds as a human-readable duration.
 * Under 1 hour: "Xm", 1+ hours: "Xh Ym"
 */
function formatDuration(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Statistics dashboard modal component.
 * Displays a full-screen modal with summary cards, progress section, and time section.
 * Follows AchievementGallery modal pattern exactly.
 */
export class StatisticsDashboard {
  private container: HTMLElement | null = null;
  private overlay: HTMLElement | null = null;
  private exitTimeout: ReturnType<typeof setTimeout> | null = null;
  private previouslyFocusedElement: Element | null = null;

  // Bound handlers for cleanup
  private boundHandleKeydown: (e: KeyboardEvent) => void;

  constructor() {
    this.boundHandleKeydown = this.handleKeydown.bind(this);
  }

  /**
   * Mount the dashboard component to a parent element.
   * Safe to call multiple times — destroys previous instance first.
   */
  mount(parent: HTMLElement): void {
    if (this.container) {
      this.destroy();
    }
    this.container = parent;
  }

  /**
   * Show the dashboard modal with collected statistics data.
   */
  show(data: DashboardData): void {
    if (!this.container) return;

    // Save currently focused element for restoration after close
    this.previouslyFocusedElement = document.activeElement;

    // Clean up any existing overlay
    this.removeOverlay();

    this.overlay = document.createElement('div');
    this.overlay.className = 'da-statistics da-statistics--entering';
    this.overlay.setAttribute('role', 'dialog');
    this.overlay.setAttribute('aria-modal', 'true');

    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'da-statistics__backdrop';
    backdrop.addEventListener('click', () => {
      this.hide();
    });

    // Content area
    const content = document.createElement('div');
    content.className = 'da-statistics__content';

    // Header
    const header = this.buildHeader();
    content.appendChild(header);

    // Summary cards
    const summary = this.buildSummaryCards(data);
    content.appendChild(summary);

    // Progress section
    const progress = this.buildProgressSection(data);
    content.appendChild(progress);

    // Time section
    const time = this.buildTimeSection(data);
    content.appendChild(time);

    this.overlay.appendChild(backdrop);
    this.overlay.appendChild(content);
    this.container.appendChild(this.overlay);

    // Add keyboard listener
    document.addEventListener('keydown', this.boundHandleKeydown);

    // Focus the close button
    const closeBtn = this.overlay.querySelector('.da-statistics__close') as HTMLElement | null;
    requestAnimationFrame(() => {
      closeBtn?.focus();
    });

    // Remove entering class after animation triggers (double rAF — 19.5 F1 lesson)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (this.overlay) {
          this.overlay.classList.remove('da-statistics--entering');
        }
      });
    });

    // Scroll to top
    content.scrollTop = 0;
  }

  /**
   * Dismiss the dashboard with exit animation.
   */
  hide(): void {
    if (!this.overlay) return;

    // Guard against double-invocation race (19.2 F2 lesson)
    if (this.exitTimeout !== null) return;

    this.overlay.classList.add('da-statistics--exiting');

    this.exitTimeout = setTimeout(() => {
      this.removeOverlay();
      this.restoreFocus();
    }, EXIT_DURATION_MS);
  }

  /**
   * Clean up all resources: pending timeouts, DOM elements, event listeners.
   */
  destroy(): void {
    if (this.exitTimeout !== null) {
      clearTimeout(this.exitTimeout);
      this.exitTimeout = null;
    }
    this.removeOverlay();
    document.removeEventListener('keydown', this.boundHandleKeydown);
    this.container = null;
  }

  private buildHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'da-statistics__header';

    const titleEl = document.createElement('h2');
    titleEl.className = 'da-statistics__title';
    titleEl.id = 'da-statistics-title';
    titleEl.textContent = 'Statistics';

    if (this.overlay) {
      this.overlay.setAttribute('aria-labelledby', titleEl.id);
    }

    const closeBtn = document.createElement('button');
    closeBtn.className = 'da-statistics__close';
    closeBtn.textContent = '\u{2715}';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close statistics dashboard');
    closeBtn.addEventListener('click', () => {
      this.hide();
    });

    header.appendChild(titleEl);
    header.appendChild(closeBtn);

    return header;
  }

  private buildSummaryCards(data: DashboardData): HTMLElement {
    const section = document.createElement('div');
    section.className = 'da-statistics__summary-cards';

    const cards: Array<{ icon: string; count: number; label: string }> = [
      { icon: '\u{1F4BB}', count: data.programsAssembled, label: 'Programs Assembled' },
      { icon: '\u{2699}', count: data.instructionsExecuted, label: 'Instructions Executed' },
      { icon: '\u{26A0}', count: data.errorsEncountered, label: 'Errors Encountered' },
    ];

    for (const { icon, count, label } of cards) {
      const card = document.createElement('div');
      card.className = 'da-statistics__card';

      const iconEl = document.createElement('div');
      iconEl.className = 'da-statistics__card-icon';
      iconEl.textContent = icon;

      const numberEl = document.createElement('div');
      numberEl.className = 'da-statistics__card-number';
      numberEl.textContent = count.toLocaleString();

      const labelEl = document.createElement('div');
      labelEl.className = 'da-statistics__card-label';
      labelEl.textContent = label;

      card.appendChild(iconEl);
      card.appendChild(numberEl);
      card.appendChild(labelEl);
      section.appendChild(card);
    }

    return section;
  }

  private buildProgressSection(data: DashboardData): HTMLElement {
    const section = document.createElement('div');
    section.className = 'da-statistics__progress';

    const title = document.createElement('h3');
    title.className = 'da-statistics__section-title';
    title.textContent = 'Progress';
    section.appendChild(title);

    // Discoveries
    section.appendChild(this.buildProgressItem(
      'Discoveries',
      data.discoveriesEarned,
      data.discoveriesTotal,
    ));

    // Acts
    section.appendChild(this.buildProgressItem(
      'Acts Completed',
      data.actsCompleted,
      data.actsTotal,
    ));

    // Achievements (with tier breakdown)
    const achievementItem = this.buildProgressItem(
      'Achievements',
      data.achievementsEarned,
      data.achievementsTotal,
    );

    // Tier breakdown chips
    const chips = document.createElement('div');
    chips.className = 'da-statistics__tier-chips';
    for (const tier of (['common', 'uncommon', 'rare', 'epic', 'legendary'] as const)) {
      const tierData = data.achievementsByTier[tier];
      const chip = document.createElement('span');
      chip.className = `da-statistics__tier-chip da-statistics__tier-chip--${tier}`;
      chip.textContent = `${TIER_LABELS[tier]}: ${tierData.earned}/${tierData.total}`;
      chips.appendChild(chip);
    }
    achievementItem.appendChild(chips);
    section.appendChild(achievementItem);

    // Stages
    section.appendChild(this.buildProgressItem(
      'Stages Unlocked',
      data.stagesUnlocked,
      data.stagesTotal,
    ));

    return section;
  }

  private buildProgressItem(label: string, current: number, total: number): HTMLElement {
    const item = document.createElement('div');
    item.className = 'da-statistics__progress-item';

    const header = document.createElement('div');
    header.className = 'da-statistics__progress-header';

    const labelEl = document.createElement('span');
    labelEl.className = 'da-statistics__progress-label';
    labelEl.textContent = label;

    const countEl = document.createElement('span');
    countEl.className = 'da-statistics__progress-count';
    countEl.textContent = `${current} / ${total}`;

    header.appendChild(labelEl);
    header.appendChild(countEl);

    const bar = document.createElement('div');
    bar.className = 'da-statistics__progress-bar';

    const fill = document.createElement('div');
    fill.className = 'da-statistics__progress-fill';
    const pct = total > 0 ? (current / total) * 100 : 0;
    fill.style.width = `${pct}%`;

    bar.appendChild(fill);

    item.appendChild(header);
    item.appendChild(bar);

    return item;
  }

  private buildTimeSection(data: DashboardData): HTMLElement {
    const section = document.createElement('div');
    section.className = 'da-statistics__time';

    const title = document.createElement('h3');
    title.className = 'da-statistics__section-title';
    title.textContent = 'Time';
    section.appendChild(title);

    // Total time
    const totalTime = document.createElement('div');
    totalTime.className = 'da-statistics__total-time';
    totalTime.textContent = `Total: ${formatDuration(data.totalSessionTime)}`;
    section.appendChild(totalTime);

    // Per-stage time bars
    const maxStageTime = Math.max(1, ...LAB_STAGES.map(s => data.timePerStage[s]));

    for (const stage of LAB_STAGES) {
      const ms = data.timePerStage[stage];
      const meta = STAGE_METADATA[stage];

      const row = document.createElement('div');
      row.className = 'da-statistics__time-row';

      const labelEl = document.createElement('span');
      labelEl.className = 'da-statistics__time-label';
      labelEl.textContent = meta.label;

      const barContainer = document.createElement('div');
      barContainer.className = 'da-statistics__time-bar';

      const fill = document.createElement('div');
      fill.className = 'da-statistics__time-fill';
      fill.style.width = `${(ms / maxStageTime) * 100}%`;

      const timeLabel = document.createElement('span');
      timeLabel.className = 'da-statistics__time-value';
      timeLabel.textContent = formatDuration(ms);

      barContainer.appendChild(fill);

      row.appendChild(labelEl);
      row.appendChild(barContainer);
      row.appendChild(timeLabel);
      section.appendChild(row);
    }

    return section;
  }

  private restoreFocus(): void {
    if (
      this.previouslyFocusedElement &&
      this.previouslyFocusedElement instanceof HTMLElement
    ) {
      this.previouslyFocusedElement.focus();
    }
    this.previouslyFocusedElement = null;
  }

  private removeOverlay(): void {
    document.removeEventListener('keydown', this.boundHandleKeydown);
    if (this.exitTimeout !== null) {
      clearTimeout(this.exitTimeout);
      this.exitTimeout = null;
    }
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }

  private handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      this.hide();
    } else if (e.key === 'Tab' && this.overlay) {
      // Focus trap: keep focus within the dashboard
      const closeBtn = this.overlay.querySelector('.da-statistics__close') as HTMLElement | null;
      if (closeBtn) {
        e.preventDefault();
        closeBtn.focus();
      }
    }
  }
}
