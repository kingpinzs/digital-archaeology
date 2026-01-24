// src/story/ChallengeObjectives.ts
// Challenge Objectives component for Lab Mode
// Story 10.13: Create Challenge Objectives in Lab Mode

import type { ChallengeData, ChallengeObjective } from './types';

/**
 * ChallengeObjectives displays story-driven objectives in Lab Mode.
 * Features gold border styling to connect with Story Mode visuals.
 *
 * Layout specification (from UX design):
 * - Container: Gold border (2px), card background
 * - Header: Lightbulb icon (💡) + "CHALLENGE:" + title
 * - Objectives: Checkbox indicators [✓] or [ ] with text
 * - Completed items: Muted text, green checkmark
 */
export class ChallengeObjectives {
  private element: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private challengeData: ChallengeData | null = null;
  private objectiveElements: Map<string, HTMLElement> = new Map();

  // Element references for dynamic updates
  private titleElement: HTMLElement | null = null;
  private listElement: HTMLElement | null = null;

  /**
   * Mount the challenge objectives to a DOM element.
   * @param container - The HTML element to mount to
   */
  mount(container: HTMLElement): void {
    this.container = container;
    this.element = this.render();
    this.container.appendChild(this.element);

    // Apply any data that was set before mount
    if (this.challengeData) {
      this.updateDisplay();
    }
  }

  /**
   * Set the challenge data and update the display.
   * @param data - The challenge data to display
   */
  setChallengeData(data: ChallengeData): void {
    this.challengeData = data;
    this.updateDisplay();
  }

  /**
   * Mark a specific objective as complete or incomplete.
   * @param id - The objective ID to update
   * @param completed - Whether the objective is completed
   */
  setObjectiveComplete(id: string, completed: boolean): void {
    if (!this.challengeData) return;

    const objective = this.challengeData.objectives.find((obj) => obj.id === id);
    if (!objective) return;

    // Only update if the state actually changes
    if (objective.completed === completed) return;

    objective.completed = completed;
    this.updateObjectiveDisplay(objective);
    this.dispatchProgressChanged();
  }

  /**
   * Get the current progress of the challenge.
   * @returns Object with completed count and total count
   */
  getProgress(): { completed: number; total: number } {
    if (!this.challengeData) {
      return { completed: 0, total: 0 };
    }

    const total = this.challengeData.objectives.length;
    const completed = this.challengeData.objectives.filter((obj) => obj.completed).length;
    return { completed, total };
  }

  /**
   * Dispatch a custom event when progress changes.
   */
  private dispatchProgressChanged(): void {
    if (this.element) {
      const event = new CustomEvent('challenge-progress-changed', {
        bubbles: true,
        detail: this.getProgress(),
      });
      this.element.dispatchEvent(event);
    }
  }

  /**
   * Update all displayed values based on current challengeData.
   */
  private updateDisplay(): void {
    if (!this.challengeData) return;

    // Update title
    if (this.titleElement) {
      this.titleElement.textContent = `CHALLENGE: ${this.challengeData.title}`;
    }

    // Clear and rebuild objectives list
    if (this.listElement) {
      this.listElement.innerHTML = '';
      this.objectiveElements.clear();

      for (const objective of this.challengeData.objectives) {
        const item = this.createObjectiveItem(objective);
        this.objectiveElements.set(objective.id, item);
        this.listElement.appendChild(item);
      }
    }
  }

  /**
   * Update a single objective's display.
   * @param objective - The objective to update
   */
  private updateObjectiveDisplay(objective: ChallengeObjective): void {
    const itemElement = this.objectiveElements.get(objective.id);
    if (!itemElement) return;

    // Update checkbox
    const checkbox = itemElement.querySelector('.da-challenge-objective-checkbox');
    if (checkbox) {
      checkbox.textContent = objective.completed ? '[✓]' : '[ ]';
    }

    // Update item styling
    itemElement.classList.toggle('da-challenge-objective-item--complete', objective.completed);

    // Update aria-checked
    itemElement.setAttribute('aria-checked', String(objective.completed));
  }

  /**
   * Create an objective list item element.
   * @param objective - The objective data
   * @returns The list item element
   */
  private createObjectiveItem(objective: ChallengeObjective): HTMLElement {
    const item = document.createElement('li');
    item.className = 'da-challenge-objective-item';
    if (objective.completed) {
      item.classList.add('da-challenge-objective-item--complete');
    }
    item.setAttribute('role', 'listitem');
    item.setAttribute('aria-checked', String(objective.completed));

    // Checkbox indicator
    const checkbox = document.createElement('span');
    checkbox.className = 'da-challenge-objective-checkbox';
    checkbox.textContent = objective.completed ? '[✓]' : '[ ]';
    checkbox.setAttribute('aria-hidden', 'true');

    // Objective text
    const text = document.createElement('span');
    text.className = 'da-challenge-objective-text';
    text.textContent = objective.text;

    item.appendChild(checkbox);
    item.appendChild(text);

    return item;
  }

  /**
   * Render the challenge objectives structure.
   * @returns The rendered section element
   */
  private render(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'da-challenge-objectives';
    section.setAttribute('role', 'region');
    section.setAttribute('aria-label', 'Challenge objectives');

    // Header
    const header = document.createElement('div');
    header.className = 'da-challenge-objectives-header';

    // Icon (decorative)
    const icon = document.createElement('span');
    icon.className = 'da-challenge-objectives-icon';
    icon.textContent = '💡';
    icon.setAttribute('aria-hidden', 'true');

    // Title
    const title = document.createElement('span');
    title.className = 'da-challenge-objectives-title';
    title.textContent = 'CHALLENGE:';
    this.titleElement = title;

    header.appendChild(icon);
    header.appendChild(title);

    // Objectives list
    const list = document.createElement('ul');
    list.className = 'da-challenge-objectives-list';
    list.setAttribute('role', 'list');
    this.listElement = list;

    // Assemble
    section.appendChild(header);
    section.appendChild(list);

    return section;
  }

  /**
   * Show the challenge objectives.
   */
  show(): void {
    this.element?.classList.remove('da-challenge-objectives--hidden');
  }

  /**
   * Hide the challenge objectives.
   */
  hide(): void {
    this.element?.classList.add('da-challenge-objectives--hidden');
  }

  /**
   * Check if the challenge objectives are currently visible.
   * @returns true if visible and mounted, false otherwise
   */
  isVisible(): boolean {
    if (!this.element) return false;
    return !this.element.classList.contains('da-challenge-objectives--hidden');
  }

  /**
   * Get the root element.
   * @returns The section element or null if not mounted
   */
  getElement(): HTMLElement | null {
    return this.element;
  }

  /**
   * Destroy the component and clean up resources.
   */
  destroy(): void {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    this.container = null;
    this.challengeData = null;
    this.objectiveElements.clear();
    this.titleElement = null;
    this.listElement = null;
  }
}
