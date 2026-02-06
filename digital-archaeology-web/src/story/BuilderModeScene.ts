// src/story/BuilderModeScene.ts
// Builder scene for implementing decisions in Lab Mode
// Story 10.22: Decision-Maker + Builder Mode

import type { BuilderChallengeData } from './content-types';
import type { ChallengeObjective } from './types';
import { EnterLabButton } from './EnterLabButton';

/**
 * BuilderModeScene presents a building challenge linked to a prior decision.
 * Shows the decision context, challenge objectives, and an Enter Lab button.
 * Tracks objective completion and fires callbacks on completion.
 */
export class BuilderModeScene {
  private container: HTMLElement | null = null;
  private element: HTMLElement | null = null;
  private challengeData: BuilderChallengeData | null = null;
  private decisionContext: string | null = null;
  private labButton: EnterLabButton | null = null;
  private objectiveElements: Map<string, HTMLElement> = new Map();

  private completeCallback: (() => void) | null = null;
  private enterLabCallback: (() => void) | null = null;
  private boundContinueHandler: (() => void) | null = null;

  /**
   * Mount the component to a container.
   */
  mount(container: HTMLElement): void {
    this.container = container;
    this.element = document.createElement('div');
    this.element.className = 'da-builder-mode-scene';
    this.element.setAttribute('role', 'region');
    this.element.setAttribute('aria-label', 'Builder Challenge');
    this.container.appendChild(this.element);
    this.render();
  }

  /**
   * Set the builder challenge data.
   */
  setChallengeData(data: BuilderChallengeData): void {
    this.challengeData = data;
    this.render();
  }

  /**
   * Set the decision context text (e.g., "You decided to use segment registers. Now build it.").
   */
  setDecisionContext(context: string): void {
    this.decisionContext = context;
    this.render();
  }

  /**
   * Mark a specific objective as complete or incomplete.
   */
  setObjectiveComplete(id: string, completed: boolean): void {
    if (!this.challengeData) return;

    const objective = this.challengeData.objectives.find((obj) => obj.id === id);
    if (!objective) return;
    if (objective.completed === completed) return;

    objective.completed = completed;
    this.updateObjectiveDisplay(objective);
    this.checkCompletion();
  }

  /**
   * Get the current progress.
   */
  getProgress(): { completed: number; total: number } {
    if (!this.challengeData) return { completed: 0, total: 0 };
    const total = this.challengeData.objectives.length;
    const completed = this.challengeData.objectives.filter((obj) => obj.completed).length;
    return { completed, total };
  }

  /**
   * Check if all objectives are complete.
   */
  isComplete(): boolean {
    if (!this.challengeData || this.challengeData.objectives.length === 0) return false;
    return this.challengeData.objectives.every((obj) => obj.completed);
  }

  /**
   * Register callback for when all objectives are complete.
   */
  onComplete(callback: () => void): void {
    this.completeCallback = callback;
  }

  /**
   * Register callback for when Enter Lab is clicked.
   */
  onEnterLab(callback: () => void): void {
    this.enterLabCallback = callback;
  }

  /**
   * Render the scene content.
   */
  private render(): void {
    if (!this.element) return;

    // Clean up
    if (this.labButton) {
      this.labButton.destroy();
      this.labButton = null;
    }
    this.objectiveElements.clear();
    while (this.element.firstChild) {
      this.element.removeChild(this.element.firstChild);
    }

    // Decision context
    if (this.decisionContext) {
      const contextEl = document.createElement('div');
      contextEl.className = 'da-builder-decision-context';
      const contextText = document.createElement('p');
      contextText.className = 'da-builder-decision-context-text';
      contextText.textContent = this.decisionContext;
      contextEl.appendChild(contextText);
      this.element.appendChild(contextEl);
    }

    if (!this.challengeData) return;

    // Challenge header
    const header = document.createElement('div');
    header.className = 'da-builder-challenge-header';
    const icon = document.createElement('span');
    icon.className = 'da-builder-challenge-icon';
    icon.textContent = '🔧';
    icon.setAttribute('aria-hidden', 'true');
    const title = document.createElement('span');
    title.className = 'da-builder-challenge-title';
    title.textContent = `BUILD: ${this.challengeData.title}`;
    header.appendChild(icon);
    header.appendChild(title);
    this.element.appendChild(header);

    // Description
    const desc = document.createElement('p');
    desc.className = 'da-builder-challenge-description';
    desc.textContent = this.challengeData.description;
    this.element.appendChild(desc);

    // Objectives list
    if (this.challengeData.objectives.length > 0) {
      const list = document.createElement('ul');
      list.className = 'da-builder-objectives-list';
      list.setAttribute('role', 'list');

      for (const obj of this.challengeData.objectives) {
        const item = this.createObjectiveItem(obj);
        this.objectiveElements.set(obj.id, item);
        list.appendChild(item);
      }

      this.element.appendChild(list);
    }

    // Enter Lab button
    const labMount = document.createElement('div');
    labMount.className = 'da-builder-lab-mount';
    this.element.appendChild(labMount);
    this.labButton = new EnterLabButton();
    this.labButton.mount(labMount);
    this.labButton.onEnterLab(() => {
      if (this.enterLabCallback) {
        this.enterLabCallback();
      }
    });

    // Completion message (hidden initially)
    const completionEl = document.createElement('div');
    completionEl.className = 'da-builder-complete';
    completionEl.classList.add('da-builder-complete--hidden');
    const completionText = document.createElement('p');
    completionText.className = 'da-builder-complete-text';
    completionText.textContent = 'You built it!';
    const continueBtn = document.createElement('button');
    continueBtn.className = 'da-builder-complete-btn';
    continueBtn.type = 'button';
    continueBtn.textContent = 'Continue';
    this.boundContinueHandler = () => {
      if (this.completeCallback) {
        this.completeCallback();
      }
    };
    continueBtn.addEventListener('click', this.boundContinueHandler);
    completionEl.appendChild(completionText);
    completionEl.appendChild(continueBtn);
    this.element.appendChild(completionEl);
  }

  /**
   * Create an objective list item.
   */
  private createObjectiveItem(objective: ChallengeObjective): HTMLElement {
    const item = document.createElement('li');
    item.className = 'da-builder-objective-item';
    if (objective.completed) {
      item.classList.add('da-builder-objective-item--complete');
    }
    item.setAttribute('aria-checked', String(objective.completed));

    const checkbox = document.createElement('span');
    checkbox.className = 'da-builder-objective-checkbox';
    checkbox.textContent = objective.completed ? '[✓]' : '[ ]';
    checkbox.setAttribute('aria-hidden', 'true');

    const text = document.createElement('span');
    text.className = 'da-builder-objective-text';
    text.textContent = objective.text;

    item.appendChild(checkbox);
    item.appendChild(text);
    return item;
  }

  /**
   * Update a single objective's display.
   */
  private updateObjectiveDisplay(objective: ChallengeObjective): void {
    const itemElement = this.objectiveElements.get(objective.id);
    if (!itemElement) return;

    const checkbox = itemElement.querySelector('.da-builder-objective-checkbox');
    if (checkbox) {
      checkbox.textContent = objective.completed ? '[✓]' : '[ ]';
    }
    itemElement.classList.toggle('da-builder-objective-item--complete', objective.completed);
    itemElement.setAttribute('aria-checked', String(objective.completed));
  }

  /**
   * Check if all objectives are complete and show celebration.
   */
  private checkCompletion(): void {
    if (!this.element) return;

    if (this.isComplete()) {
      const completionEl = this.element.querySelector('.da-builder-complete');
      if (completionEl) {
        completionEl.classList.remove('da-builder-complete--hidden');
      }

      // Dispatch event
      if (this.element) {
        const event = new CustomEvent('builder-challenge-complete', {
          bubbles: true,
          detail: {
            decisionId: this.challengeData?.decisionId,
            progress: this.getProgress(),
          },
        });
        this.element.dispatchEvent(event);
      }
    }
  }

  /**
   * Clean up the component.
   */
  destroy(): void {
    if (this.labButton) {
      this.labButton.destroy();
      this.labButton = null;
    }
    this.objectiveElements.clear();
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    this.container = null;
    this.challengeData = null;
    this.decisionContext = null;
    this.completeCallback = null;
    this.enterLabCallback = null;
    this.boundContinueHandler = null;
  }
}
