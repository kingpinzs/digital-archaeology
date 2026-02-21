// src/exercises/ExerciseResultsPanel.ts
// UI panel displaying exercise validation results (pass/fail per test case)
// Story 21.4: Implement Output Validation

import type { ExerciseValidationResult, ExerciseTestResult } from './types';

/** Callback when the user dismisses the results panel */
export interface ExerciseResultsPanelCallbacks {
  readonly onDismiss: () => void;
  readonly onMarkCompleted?: (exerciseId: string) => void;
}

/**
 * Displays exercise validation results in a collapsible panel below the editor.
 *
 * Shows:
 * - Overall pass/fail banner
 * - Per-test-case results with expected vs actual for failures
 * - "Mark Complete" button when all tests pass
 */
export class ExerciseResultsPanel {
  private panel: HTMLElement | null = null;
  private hostElement: HTMLElement | null = null;

  /**
   * Show the results panel with validation output.
   *
   * @param result - Validation result from ExerciseValidator
   * @param callbacks - Dismiss and completion callbacks
   * @param host - Parent element to append the panel into
   */
  show(
    result: ExerciseValidationResult,
    callbacks: ExerciseResultsPanelCallbacks,
    host: HTMLElement,
  ): void {
    // Remove any existing panel first
    this.dismiss();
    this.hostElement = host;

    const panel = document.createElement('div');
    panel.className = 'da-exercise-results';
    panel.setAttribute('role', 'status');
    panel.setAttribute('aria-live', 'polite');

    // Header banner
    const header = document.createElement('div');
    header.className = result.passed
      ? 'da-exercise-results__header da-exercise-results__header--pass'
      : 'da-exercise-results__header da-exercise-results__header--fail';

    const icon = document.createElement('span');
    icon.className = 'da-exercise-results__icon';
    icon.textContent = result.passed ? '\u2713' : '\u2717';
    icon.setAttribute('aria-hidden', 'true');
    header.appendChild(icon);

    const title = document.createElement('span');
    title.className = 'da-exercise-results__title';
    const passCount = result.results.filter((r) => r.passed).length;
    const totalCount = result.results.length;
    title.textContent = result.passed
      ? `All ${totalCount} test${totalCount === 1 ? '' : 's'} passed!`
      : `${passCount}/${totalCount} test${totalCount === 1 ? '' : 's'} passed`;
    header.appendChild(title);

    // Dismiss button (X)
    const dismissBtn = document.createElement('button');
    dismissBtn.className = 'da-exercise-results__dismiss';
    dismissBtn.textContent = '\u00d7';
    dismissBtn.setAttribute('aria-label', 'Dismiss results');
    dismissBtn.addEventListener('click', () => {
      this.dismiss();
      callbacks.onDismiss();
    });
    header.appendChild(dismissBtn);

    panel.appendChild(header);

    // Test case list
    if (result.results.length > 0) {
      const list = document.createElement('ul');
      list.className = 'da-exercise-results__list';

      for (const testResult of result.results) {
        list.appendChild(this.createTestCaseItem(testResult));
      }

      panel.appendChild(list);
    }

    // Error message (if any)
    if (result.error) {
      const errorEl = document.createElement('div');
      errorEl.className = 'da-exercise-results__error';
      errorEl.textContent = result.error;
      panel.appendChild(errorEl);
    }

    // Mark Complete button (only when all tests pass)
    if (result.passed && callbacks.onMarkCompleted) {
      const completeBtn = document.createElement('button');
      completeBtn.className = 'da-exercise-results__complete';
      completeBtn.textContent = 'Mark Exercise Complete';
      const exerciseId = result.exerciseId;
      const onMarkCompleted = callbacks.onMarkCompleted;
      completeBtn.addEventListener('click', () => {
        onMarkCompleted(exerciseId);
        this.dismiss();
        callbacks.onDismiss();
      });
      panel.appendChild(completeBtn);
    }

    this.panel = panel;
    host.appendChild(panel);
  }

  /**
   * Remove the results panel from the DOM.
   */
  dismiss(): void {
    if (this.panel && this.hostElement && this.hostElement.contains(this.panel)) {
      this.hostElement.removeChild(this.panel);
    }
    this.panel = null;
    this.hostElement = null;
  }

  /**
   * Whether the panel is currently visible.
   */
  isVisible(): boolean {
    return this.panel !== null;
  }

  /**
   * Clean up all references.
   */
  destroy(): void {
    this.dismiss();
  }

  /**
   * Create a list item for a single test case result.
   */
  private createTestCaseItem(result: ExerciseTestResult): HTMLLIElement {
    const item = document.createElement('li');
    item.className = result.passed
      ? 'da-exercise-results__item da-exercise-results__item--pass'
      : 'da-exercise-results__item da-exercise-results__item--fail';

    const statusIcon = document.createElement('span');
    statusIcon.className = 'da-exercise-results__item-icon';
    statusIcon.textContent = result.passed ? '\u2713' : '\u2717';
    statusIcon.setAttribute('aria-hidden', 'true');
    item.appendChild(statusIcon);

    const label = document.createElement('span');
    label.className = 'da-exercise-results__item-label';
    label.textContent = result.label;
    item.appendChild(label);

    if (!result.passed) {
      const detail = document.createElement('span');
      detail.className = 'da-exercise-results__item-detail';
      const actualHex = result.actual < 0
        ? 'out of bounds'
        : `0x${result.actual.toString(16).toUpperCase()}`;
      detail.textContent = `expected 0x${result.expected.toString(16).toUpperCase()}, got ${actualHex}`;
      item.appendChild(detail);
    }

    const address = document.createElement('span');
    address.className = 'da-exercise-results__item-address';
    address.textContent = `@0x${result.address.toString(16).toUpperCase()}`;
    item.appendChild(address);

    return item;
  }
}
