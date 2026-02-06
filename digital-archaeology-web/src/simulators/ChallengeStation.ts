// src/simulators/ChallengeStation.ts
// Orchestrator: routes ChallengeContext to the right simulator + objectives sidebar

import type { ChallengeContext, SimulatorType } from '@story/types';
import { ChallengeObjectives } from '@story/ChallengeObjectives';
import type { Simulator, SimulatorCallbacks } from './types';
import { CountingBoardSimulator } from './CountingBoardSimulator';
import { SuanpanSimulator } from './SuanpanSimulator';
import { PascalineSimulator } from './PascalineSimulator';
import { AnalyticalEngineSimulator } from './analytical-engine/AnalyticalEngineSimulator';

/**
 * ChallengeStation is the orchestrator component for the Challenge lab station.
 * It creates a 2-column layout: simulator (left, wide) + sidebar (right, objectives).
 * Routes ChallengeContext to the appropriate simulator and wires objective callbacks.
 */
export class ChallengeStation {
  private container: HTMLElement | null = null;
  private element: HTMLElement | null = null;

  // Layout containers
  private simulatorContainer: HTMLElement | null = null;
  private sidebarContainer: HTMLElement | null = null;

  // Active simulator
  private currentSimulator: Simulator | null = null;

  // Objectives sidebar
  private challengeObjectives: ChallengeObjectives | null = null;

  // Return to story callback
  private onReturnToStory: (() => void) | null = null;

  // Return to story button
  private returnButton: HTMLButtonElement | null = null;

  /**
   * Mount the challenge station to a DOM element.
   */
  mount(container: HTMLElement): void {
    this.container = container;
    this.element = this.render();
    this.container.appendChild(this.element);
  }

  /**
   * Set the callback for returning to story mode.
   */
  setOnReturnToStory(callback: () => void): void {
    this.onReturnToStory = callback;
  }

  /**
   * Set a challenge context: creates the right simulator, wires callbacks.
   */
  setChallengeContext(context: ChallengeContext): void {
    // Tear down any existing simulator
    this.clearSimulator();

    if (!this.simulatorContainer || !this.sidebarContainer) return;

    // Set up objectives sidebar
    this.challengeObjectives = new ChallengeObjectives();
    const objectivesMount = document.createElement('div');
    objectivesMount.className = 'da-challenge-station-objectives-mount';
    this.sidebarContainer.appendChild(objectivesMount);
    this.challengeObjectives.mount(objectivesMount);
    this.challengeObjectives.setChallengeData(context.challengeData);

    // Add instructions
    const instructions = document.createElement('div');
    instructions.className = 'da-challenge-station-instructions';
    instructions.innerHTML = `<p>Complete all objectives to advance the story.</p>`;
    this.sidebarContainer.appendChild(instructions);

    // Add reset button
    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'da-sim-btn-reset';
    resetBtn.textContent = 'Reset Simulator';
    resetBtn.setAttribute('aria-label', 'Reset simulator to initial state');
    resetBtn.addEventListener('click', () => {
      this.currentSimulator?.reset();
      // Reset objective checkboxes
      if (this.challengeObjectives && context.challengeData) {
        for (const obj of context.challengeData.objectives) {
          this.challengeObjectives.setObjectiveComplete(obj.id, false);
        }
      }
    });
    this.sidebarContainer.appendChild(resetBtn);

    // Add "Return to Story" button (hidden until all objectives complete)
    this.returnButton = document.createElement('button');
    this.returnButton.type = 'button';
    this.returnButton.className = 'da-challenge-station-return-btn da-challenge-station-return-btn--hidden';
    this.returnButton.textContent = 'Return to Story';
    this.returnButton.setAttribute('aria-label', 'Return to story mode');
    this.returnButton.addEventListener('click', () => {
      this.onReturnToStory?.();
    });
    this.sidebarContainer.appendChild(this.returnButton);

    // Create the simulator
    const simulator = this.createSimulator(context.simulatorType);
    if (!simulator) return;

    this.currentSimulator = simulator;

    // Wire callbacks
    const callbacks: SimulatorCallbacks = {
      onObjectiveComplete: (objectiveId: string) => {
        this.challengeObjectives?.setObjectiveComplete(objectiveId, true);
      },
      onAllObjectivesComplete: () => {
        this.returnButton?.classList.remove('da-challenge-station-return-btn--hidden');
      },
    };
    simulator.setCallbacks(callbacks);
    simulator.setChallengeData(context.challengeData);
    simulator.mount(this.simulatorContainer);
  }

  /**
   * Show the challenge station.
   */
  show(): void {
    this.element?.classList.remove('da-challenge-station--hidden');
  }

  /**
   * Hide the challenge station.
   */
  hide(): void {
    this.element?.classList.add('da-challenge-station--hidden');
  }

  /**
   * Destroy the challenge station and clean up.
   */
  destroy(): void {
    this.clearSimulator();
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    this.container = null;
    this.simulatorContainer = null;
    this.sidebarContainer = null;
    this.onReturnToStory = null;
    this.returnButton = null;
  }

  /**
   * Create a simulator instance for the given type.
   */
  private createSimulator(type: SimulatorType): Simulator | null {
    switch (type) {
      case 'counting-board':
        return new CountingBoardSimulator();
      case 'suanpan':
        return new SuanpanSimulator();
      case 'pascaline':
        return new PascalineSimulator();
      case 'analytical-engine':
        return new AnalyticalEngineSimulator();
      default:
        console.warn(`Unknown simulator type: ${type as string}`);
        return null;
    }
  }

  /**
   * Clear the current simulator and sidebar content.
   */
  private clearSimulator(): void {
    this.currentSimulator?.destroy();
    this.currentSimulator = null;

    this.challengeObjectives?.destroy();
    this.challengeObjectives = null;
    this.returnButton = null;

    if (this.simulatorContainer) {
      this.simulatorContainer.innerHTML = '';
    }
    if (this.sidebarContainer) {
      this.sidebarContainer.innerHTML = '';
    }
  }

  /**
   * Render the 2-column layout.
   */
  private render(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'da-challenge-station';

    // Simulator area (left, wide)
    this.simulatorContainer = document.createElement('div');
    this.simulatorContainer.className = 'da-challenge-station-simulator';
    this.simulatorContainer.setAttribute('role', 'region');
    this.simulatorContainer.setAttribute('aria-label', 'Interactive simulator');

    // Sidebar (right, 300px)
    this.sidebarContainer = document.createElement('div');
    this.sidebarContainer.className = 'da-challenge-station-sidebar';
    this.sidebarContainer.setAttribute('role', 'complementary');
    this.sidebarContainer.setAttribute('aria-label', 'Challenge objectives');

    wrapper.appendChild(this.simulatorContainer);
    wrapper.appendChild(this.sidebarContainer);

    return wrapper;
  }
}
