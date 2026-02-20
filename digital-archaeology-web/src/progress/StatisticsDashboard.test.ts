// src/progress/StatisticsDashboard.test.ts
// Tests for StatisticsDashboard modal UI component
// Story 19.6: Create Statistics Dashboard

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StatisticsDashboard } from './StatisticsDashboard';
import type { DashboardData } from './types';

function createTestData(overrides: Partial<DashboardData> = {}): DashboardData {
  return {
    programsAssembled: 10,
    instructionsExecuted: 5000,
    errorsEncountered: 3,
    discoveriesEarned: 4,
    discoveriesTotal: 7,
    actsCompleted: 5,
    actsTotal: 11,
    achievementsEarned: 8,
    achievementsTotal: 16,
    achievementsByTier: {
      common: { earned: 3, total: 3 },
      uncommon: { earned: 3, total: 5 },
      rare: { earned: 2, total: 5 },
      epic: { earned: 0, total: 1 },
      legendary: { earned: 0, total: 2 },
    },
    stagesUnlocked: 3,
    stagesTotal: 6,
    timePerStage: {
      micro4: 1800000,
      micro8: 900000,
      micro16: 300000,
      micro32: 0,
      micro32p: 0,
      micro32s: 0,
    },
    totalSessionTime: 3600000,
    ...overrides,
  };
}

describe('StatisticsDashboard', () => {
  let dashboard: StatisticsDashboard;
  let parent: HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers();
    parent = document.createElement('div');
    document.body.appendChild(parent);
    dashboard = new StatisticsDashboard();
    dashboard.mount(parent);
  });

  afterEach(() => {
    dashboard.destroy();
    parent.remove();
    vi.useRealTimers();
  });

  // Task 11.1: mount() creates overlay with dialog ARIA attributes
  it('should create overlay with dialog ARIA attributes on show', () => {
    dashboard.show(createTestData());

    const overlay = parent.querySelector('.da-statistics');
    expect(overlay).not.toBeNull();
    expect(overlay?.getAttribute('role')).toBe('dialog');
    expect(overlay?.getAttribute('aria-modal')).toBe('true');
    expect(overlay?.getAttribute('aria-labelledby')).toBe('da-statistics-title');
  });

  // Task 11.2: show() renders summary cards with correct counts
  it('should render summary cards with correct counts', () => {
    dashboard.show(createTestData());

    const cards = parent.querySelectorAll('.da-statistics__card');
    expect(cards).toHaveLength(3);

    const numbers = parent.querySelectorAll('.da-statistics__card-number');
    expect(numbers[0]?.textContent).toBe('10');
    expect(numbers[1]?.textContent).toBe('5,000');
    expect(numbers[2]?.textContent).toBe('3');

    const labels = parent.querySelectorAll('.da-statistics__card-label');
    expect(labels[0]?.textContent).toBe('Programs Assembled');
    expect(labels[1]?.textContent).toBe('Instructions Executed');
    expect(labels[2]?.textContent).toBe('Errors Encountered');
  });

  // Task 11.3: show() renders progress section with correct fractions
  it('should render progress section with correct fractions', () => {
    dashboard.show(createTestData());

    const counts = parent.querySelectorAll('.da-statistics__progress-count');
    expect(counts[0]?.textContent).toBe('4 / 7'); // Discoveries
    expect(counts[1]?.textContent).toBe('5 / 11'); // Acts
    expect(counts[2]?.textContent).toBe('8 / 16'); // Achievements
    expect(counts[3]?.textContent).toBe('3 / 6'); // Stages
  });

  it('should render tier breakdown chips for achievements', () => {
    dashboard.show(createTestData());

    const chips = parent.querySelectorAll('.da-statistics__tier-chip');
    expect(chips).toHaveLength(5);
    expect(chips[0]?.textContent).toBe('Common: 3/3');
    expect(chips[1]?.textContent).toBe('Uncommon: 3/5');
    expect(chips[2]?.textContent).toBe('Rare: 2/5');
    expect(chips[3]?.textContent).toBe('Epic: 0/1');
    expect(chips[4]?.textContent).toBe('Legendary: 0/2');
  });

  // Task 11.4: show() renders time section with formatted durations
  it('should render time section with formatted durations', () => {
    dashboard.show(createTestData());

    const totalTime = parent.querySelector('.da-statistics__total-time');
    expect(totalTime?.textContent).toBe('Total: 1h 0m');

    const timeValues = parent.querySelectorAll('.da-statistics__time-value');
    expect(timeValues[0]?.textContent).toBe('30m'); // micro4: 1800000ms = 30m
    expect(timeValues[1]?.textContent).toBe('15m'); // micro8: 900000ms = 15m
    expect(timeValues[2]?.textContent).toBe('5m');  // micro16: 300000ms = 5m
  });

  it('should format multi-hour durations correctly', () => {
    dashboard.show(createTestData({ totalSessionTime: 7500000 })); // 2h 5m
    const totalTime = parent.querySelector('.da-statistics__total-time');
    expect(totalTime?.textContent).toBe('Total: 2h 5m');
  });

  // Task 11.5: Escape key closes modal
  it('should close on Escape key', () => {
    dashboard.show(createTestData());
    expect(parent.querySelector('.da-statistics')).not.toBeNull();

    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    document.dispatchEvent(event);

    // Should have exiting class
    expect(parent.querySelector('.da-statistics--exiting')).not.toBeNull();

    vi.advanceTimersByTime(300);
    expect(parent.querySelector('.da-statistics')).toBeNull();
  });

  // Task 11.6: backdrop click closes modal
  it('should close on backdrop click', () => {
    dashboard.show(createTestData());

    const backdrop = parent.querySelector('.da-statistics__backdrop') as HTMLElement;
    backdrop.click();

    expect(parent.querySelector('.da-statistics--exiting')).not.toBeNull();

    vi.advanceTimersByTime(300);
    expect(parent.querySelector('.da-statistics')).toBeNull();
  });

  // Task 11.7: close button click closes modal
  it('should close on close button click', () => {
    dashboard.show(createTestData());

    const closeBtn = parent.querySelector('.da-statistics__close') as HTMLElement;
    closeBtn.click();

    expect(parent.querySelector('.da-statistics--exiting')).not.toBeNull();

    vi.advanceTimersByTime(300);
    expect(parent.querySelector('.da-statistics')).toBeNull();
  });

  // Task 11.8: enter/exit animation classes (including requestAnimationFrame removal)
  it('should have --entering class initially', () => {
    dashboard.show(createTestData());
    const overlay = parent.querySelector('.da-statistics');
    expect(overlay?.classList.contains('da-statistics--entering')).toBe(true);
  });

  it('should remove --entering class after requestAnimationFrame cycle', () => {
    const rAFCallbacks: FrameRequestCallback[] = [];
    const originalRAF = globalThis.requestAnimationFrame;
    globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => {
      rAFCallbacks.push(cb);
      return rAFCallbacks.length;
    };

    dashboard.show(createTestData());

    const overlay = parent.querySelector('.da-statistics');
    expect(overlay?.classList.contains('da-statistics--entering')).toBe(true);

    // Execute all rAF callbacks
    while (rAFCallbacks.length > 0) {
      rAFCallbacks.shift()!(0);
    }

    expect(overlay?.classList.contains('da-statistics--entering')).toBe(false);

    globalThis.requestAnimationFrame = originalRAF;
  });

  it('should add --exiting class before removal', () => {
    dashboard.show(createTestData());
    dashboard.hide();

    const overlay = parent.querySelector('.da-statistics');
    expect(overlay?.classList.contains('da-statistics--exiting')).toBe(true);
  });

  // Task 11.9: focus trap (Tab cycles through interactive elements)
  it('should trap focus within the dashboard on Tab', () => {
    dashboard.show(createTestData());

    const closeBtn = parent.querySelector('.da-statistics__close') as HTMLElement;
    closeBtn.focus();

    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    document.dispatchEvent(event);

    expect(document.activeElement).toBe(closeBtn);
  });

  // Task 11.10: focus restoration after close
  it('should restore focus after close', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();

    dashboard.show(createTestData());
    dashboard.hide();
    vi.advanceTimersByTime(300);

    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  // Task 11.11: destroy() cleans up all event listeners and DOM
  it('should clean up on destroy()', () => {
    dashboard.show(createTestData());
    expect(parent.querySelector('.da-statistics')).not.toBeNull();

    dashboard.destroy();
    expect(parent.querySelector('.da-statistics')).toBeNull();

    // Escape should not cause errors after destroy
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    document.dispatchEvent(event);
  });

  it('should guard against double hide()', () => {
    dashboard.show(createTestData());
    dashboard.hide();
    dashboard.hide(); // Should not throw
    vi.advanceTimersByTime(300);
    expect(parent.querySelector('.da-statistics')).toBeNull();
  });

  it('should silently ignore show() before mount()', () => {
    const unmounted = new StatisticsDashboard();
    unmounted.show(createTestData()); // Should not throw
  });

  it('should render title element', () => {
    dashboard.show(createTestData());
    const title = parent.querySelector('.da-statistics__title');
    expect(title?.textContent).toBe('Statistics');
  });
});
