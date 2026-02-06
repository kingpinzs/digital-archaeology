// src/story/DiscovererExperience.ts
// Orchestrator component for the first-time discoverer experience
// Story 10.23: First Discoverer's Mind Experience

import type { HistoricalDecision, MindsetContext, PersonaData, ChallengeObjective } from './types';
import type { BuilderChallengeData } from './content-types';
import { DecisionMakerScene } from './DecisionMakerScene';
import { BuilderModeScene } from './BuilderModeScene';
import { ConsequenceRevealPanel } from './ConsequenceRevealPanel';
import { MindsetProvider } from './MindsetProvider';

/** Phase state machine for the discoverer experience */
export type DiscovererPhase = 'intro' | 'constraint' | 'decision' | 'build' | 'consequence' | 'celebration';

/** Data loaded from discoverer-intro.json */
interface DiscovererIntroData {
  welcome: { headline: string; subtext: string };
  era: { year: number; location: string; framing: string };
  persona: PersonaData & { quote: string };
  constraint: { headline: string; resources: string[]; challenge: string };
  decision: HistoricalDecision;
  builder: BuilderChallengeData & { objectives: ChallengeObjective[] };
  celebration: { headline: string; lines: string[]; journeyButton: string; labButton: string };
  mindset: MindsetContext;
}

/**
 * Type guard to validate discoverer intro data loaded from JSON.
 */
function isDiscovererIntroData(value: unknown): value is DiscovererIntroData {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;

  // Validate top-level structure
  if (!obj.welcome || typeof obj.welcome !== 'object') return false;
  if (!obj.era || typeof obj.era !== 'object') return false;
  if (!obj.persona || typeof obj.persona !== 'object') return false;
  if (!obj.constraint || typeof obj.constraint !== 'object') return false;
  if (!obj.decision || typeof obj.decision !== 'object') return false;
  if (!obj.builder || typeof obj.builder !== 'object') return false;
  if (!obj.celebration || typeof obj.celebration !== 'object') return false;
  if (!obj.mindset || typeof obj.mindset !== 'object') return false;

  // Validate welcome
  const welcome = obj.welcome as Record<string, unknown>;
  if (typeof welcome.headline !== 'string' || typeof welcome.subtext !== 'string') return false;

  // Validate decision has options array
  const decision = obj.decision as Record<string, unknown>;
  if (!Array.isArray(decision.options)) return false;

  // Validate builder has objectives array
  const builder = obj.builder as Record<string, unknown>;
  if (!Array.isArray(builder.objectives)) return false;

  // Validate celebration
  const celebration = obj.celebration as Record<string, unknown>;
  if (typeof celebration.headline !== 'string') return false;
  if (!Array.isArray(celebration.lines)) return false;

  return true;
}

/**
 * DiscovererExperience orchestrates a self-contained 5-10 minute onboarding flow
 * for first-time users. It composes existing story components (DecisionMakerScene,
 * BuilderModeScene, ConsequenceRevealPanel) into a tight intro → constraint →
 * decision → build → consequence → celebration cycle.
 */
export class DiscovererExperience {
  private container: HTMLElement | null = null;
  private element: HTMLElement | null = null;
  private phaseContainer: HTMLElement | null = null;
  private data: DiscovererIntroData | null = null;

  private currentPhase: DiscovererPhase = 'intro';
  private chosenOptionId: string | null = null;

  // Sub-components
  private decisionScene: DecisionMakerScene | null = null;
  private builderScene: BuilderModeScene | null = null;
  private consequencePanel: ConsequenceRevealPanel | null = null;

  // Timer handles for auto-progress cleanup
  private autoProgressTimers: ReturnType<typeof setTimeout>[] = [];

  // Bound handlers for DOM event listeners
  private boundBeginHandler: (() => void) | null = null;
  private boundSkipHandler: (() => void) | null = null;
  private boundContinueHandler: (() => void) | null = null;
  private boundJourneyHandler: (() => void) | null = null;
  private boundLabHandler: (() => void) | null = null;

  // Callbacks
  private completeCallback: ((choice: 'journey' | 'lab') => void) | null = null;
  private skipCallback: (() => void) | null = null;

  /**
   * Mount the discoverer experience to a container.
   * Fetches content data and renders the intro phase.
   */
  async mount(container: HTMLElement): Promise<void> {
    // Guard against double-mounting
    if (this.element) return;

    this.container = container;

    // Create wrapper element
    this.element = document.createElement('div');
    this.element.className = 'da-discoverer-experience';
    this.element.setAttribute('role', 'region');
    this.element.setAttribute('aria-label', 'First Discovery Experience');

    // Phase container with aria-live for screen readers
    this.phaseContainer = document.createElement('div');
    this.phaseContainer.className = 'da-discoverer-phase';
    this.phaseContainer.setAttribute('aria-live', 'polite');
    this.element.appendChild(this.phaseContainer);

    this.container.appendChild(this.element);

    // Load data
    await this.loadData();

    // Set up mindset
    if (this.data) {
      MindsetProvider.getInstance().setMindset(this.data.mindset);
    }

    // Render intro phase
    this.renderPhase();
  }

  /**
   * Register callback for when the experience completes.
   * @param callback - Called with 'journey' or 'lab' depending on user's choice
   */
  onComplete(callback: (choice: 'journey' | 'lab') => void): void {
    this.completeCallback = callback;
  }

  /**
   * Register callback for when the user skips the intro.
   */
  onSkip(callback: () => void): void {
    this.skipCallback = callback;
  }

  /**
   * Get the current phase.
   */
  getCurrentPhase(): DiscovererPhase {
    return this.currentPhase;
  }

  /**
   * Advance to a specific phase. Intended for testing and programmatic control.
   * Note: Jumping out of order (e.g., to 'build' without a prior decision) will
   * use fallback values for missing state like chosenOptionId.
   */
  goToPhase(phase: DiscovererPhase): void {
    this.currentPhase = phase;
    this.renderPhase();
  }

  /**
   * Clean up the component and all sub-components.
   */
  destroy(): void {
    this.clearAutoProgressTimers();
    this.clearBoundHandlers();
    this.destroySubComponents();
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    this.phaseContainer = null;
    this.container = null;
    this.data = null;
    this.completeCallback = null;
    this.skipCallback = null;
    this.chosenOptionId = null;
  }

  /**
   * Load intro data from JSON with validation.
   */
  private async loadData(): Promise<void> {
    const response = await fetch('/story/data/discoverer-intro.json');
    if (!response.ok) {
      throw new Error('Failed to load discoverer experience data');
    }
    const parsed: unknown = await response.json();
    if (!isDiscovererIntroData(parsed)) {
      throw new Error('Invalid discoverer experience data format');
    }
    this.data = parsed;
  }

  /**
   * Render the current phase.
   */
  private renderPhase(): void {
    if (!this.phaseContainer || !this.data) return;

    // Clean up previous phase
    this.clearAutoProgressTimers();
    this.clearBoundHandlers();
    this.destroySubComponents();
    while (this.phaseContainer.firstChild) {
      this.phaseContainer.removeChild(this.phaseContainer.firstChild);
    }

    switch (this.currentPhase) {
      case 'intro':
        this.renderIntro();
        break;
      case 'constraint':
        this.renderConstraint();
        break;
      case 'decision':
        this.renderDecision();
        break;
      case 'build':
        this.renderBuild();
        break;
      case 'consequence':
        this.renderConsequence();
        break;
      case 'celebration':
        this.renderCelebration();
        break;
    }
  }

  /**
   * Render the intro phase.
   */
  private renderIntro(): void {
    if (!this.phaseContainer || !this.data) return;

    const intro = document.createElement('div');
    intro.className = 'da-discoverer-intro';

    // Welcome headline
    const headline = document.createElement('h1');
    headline.className = 'da-discoverer-headline';
    headline.textContent = this.data.welcome.headline;
    intro.appendChild(headline);

    // Subtext
    const subtext = document.createElement('p');
    subtext.className = 'da-discoverer-subtext';
    subtext.textContent = this.data.welcome.subtext;
    intro.appendChild(subtext);

    // Era framing
    const framing = document.createElement('p');
    framing.className = 'da-discoverer-era-framing';
    framing.textContent = this.data.era.framing;
    intro.appendChild(framing);

    // Persona summary
    const personaSummary = document.createElement('div');
    personaSummary.className = 'da-discoverer-persona-summary';
    const avatar = document.createElement('span');
    avatar.className = 'da-discoverer-persona-avatar';
    avatar.textContent = this.data.persona.avatar;
    avatar.setAttribute('aria-hidden', 'true');
    const personaName = document.createElement('span');
    personaName.className = 'da-discoverer-persona-name';
    personaName.textContent = this.data.persona.name;
    personaSummary.appendChild(avatar);
    personaSummary.appendChild(personaName);
    intro.appendChild(personaSummary);

    // Problem statement
    const problem = document.createElement('p');
    problem.className = 'da-discoverer-problem';
    problem.textContent = this.data.persona.problem;
    intro.appendChild(problem);

    // Begin button
    const beginBtn = document.createElement('button');
    beginBtn.className = 'da-discoverer-begin-btn';
    beginBtn.type = 'button';
    beginBtn.textContent = 'Begin';
    this.boundBeginHandler = () => {
      this.currentPhase = 'constraint';
      this.renderPhase();
    };
    beginBtn.addEventListener('click', this.boundBeginHandler);
    intro.appendChild(beginBtn);

    // Skip link
    const skipLink = document.createElement('button');
    skipLink.className = 'da-discoverer-skip-link';
    skipLink.type = 'button';
    skipLink.textContent = 'Skip Intro';
    this.boundSkipHandler = () => {
      if (this.skipCallback) {
        this.skipCallback();
      }
    };
    skipLink.addEventListener('click', this.boundSkipHandler);
    intro.appendChild(skipLink);

    this.phaseContainer.appendChild(intro);
  }

  /**
   * Render the constraint phase.
   */
  private renderConstraint(): void {
    if (!this.phaseContainer || !this.data) return;

    const constraintEl = document.createElement('div');
    constraintEl.className = 'da-discoverer-constraint';

    // Constraint headline
    const headline = document.createElement('h2');
    headline.className = 'da-discoverer-constraint-headline';
    headline.textContent = this.data.constraint.headline;
    constraintEl.appendChild(headline);

    // Resources list
    const resourcesLabel = document.createElement('p');
    resourcesLabel.className = 'da-discoverer-resources-label';
    resourcesLabel.textContent = 'What you have:';
    constraintEl.appendChild(resourcesLabel);

    const resourcesList = document.createElement('ul');
    resourcesList.className = 'da-discoverer-resources-list';
    for (const resource of this.data.constraint.resources) {
      const li = document.createElement('li');
      li.className = 'da-discoverer-resource-item';
      li.textContent = resource;
      resourcesList.appendChild(li);
    }
    constraintEl.appendChild(resourcesList);

    // Visual 4-bit register diagram (CSS-only)
    const registerDiagram = document.createElement('div');
    registerDiagram.className = 'da-discoverer-register-diagram';
    registerDiagram.setAttribute('aria-label', '4-bit register: bits 0, 1, 0, 1');
    for (const bit of ['0', '1', '0', '1']) {
      const cell = document.createElement('div');
      cell.className = 'da-discoverer-register-cell';
      if (bit === '1') {
        cell.classList.add('da-discoverer-register-cell--active');
      }
      cell.textContent = bit;
      cell.setAttribute('aria-hidden', 'true');
      registerDiagram.appendChild(cell);
    }
    constraintEl.appendChild(registerDiagram);

    // Challenge text
    const challengeLabel = document.createElement('p');
    challengeLabel.className = 'da-discoverer-challenge-label';
    challengeLabel.textContent = 'What you need to do:';
    constraintEl.appendChild(challengeLabel);

    const challenge = document.createElement('p');
    challenge.className = 'da-discoverer-challenge-text';
    challenge.textContent = this.data.constraint.challenge;
    constraintEl.appendChild(challenge);

    // Continue button
    const continueBtn = document.createElement('button');
    continueBtn.className = 'da-discoverer-continue-btn';
    continueBtn.type = 'button';
    continueBtn.textContent = 'Continue';
    this.boundContinueHandler = () => {
      this.currentPhase = 'decision';
      this.renderPhase();
    };
    continueBtn.addEventListener('click', this.boundContinueHandler);
    constraintEl.appendChild(continueBtn);

    this.phaseContainer.appendChild(constraintEl);
  }

  /**
   * Render the decision phase using DecisionMakerScene.
   */
  private renderDecision(): void {
    if (!this.phaseContainer || !this.data) return;

    const decisionContainer = document.createElement('div');
    decisionContainer.className = 'da-discoverer-decision';
    this.phaseContainer.appendChild(decisionContainer);

    this.decisionScene = new DecisionMakerScene();
    this.decisionScene.mount(decisionContainer);
    this.decisionScene.setDecision(this.data.decision);
    this.decisionScene.onBuildTransition((_decisionId: string, optionId: string) => {
      this.chosenOptionId = optionId;
      this.currentPhase = 'build';
      this.renderPhase();
    });
  }

  /**
   * Render the build phase using BuilderModeScene.
   */
  private renderBuild(): void {
    if (!this.phaseContainer || !this.data) return;

    const buildContainer = document.createElement('div');
    buildContainer.className = 'da-discoverer-build';
    this.phaseContainer.appendChild(buildContainer);

    const choiceDesc = this.chosenOptionId
      ? this.data.decision.options.find(o => o.id === this.chosenOptionId)?.description ?? 'your approach'
      : 'your approach';

    this.builderScene = new BuilderModeScene();
    this.builderScene.mount(buildContainer);
    this.builderScene.setDecisionContext(`You decided to use ${choiceDesc}. Now build it.`);
    this.builderScene.setChallengeData(this.data.builder);

    // Auto-progress objectives with guided delays for the intro experience
    this.autoProgressObjectives();

    this.builderScene.onComplete(() => {
      this.currentPhase = 'consequence';
      this.renderPhase();
    });

    // Don't wire onEnterLab for the intro — no actual lab mode
  }

  /**
   * Auto-progress builder objectives for the simplified intro experience.
   * Each objective completes after a brief interaction delay.
   */
  private autoProgressObjectives(): void {
    if (!this.builderScene || !this.data) return;

    const objectives = this.data.builder.objectives;
    let index = 0;

    const progressNext = (): void => {
      if (!this.builderScene || index >= objectives.length) return;
      this.builderScene.setObjectiveComplete(objectives[index].id, true);
      index++;

      if (index < objectives.length) {
        const timerId = setTimeout(progressNext, 1500);
        this.autoProgressTimers.push(timerId);
      }
    };

    // Start after a brief initial delay
    const initialTimer = setTimeout(progressNext, 1000);
    this.autoProgressTimers.push(initialTimer);
  }

  /**
   * Render the consequence phase using ConsequenceRevealPanel.
   */
  private renderConsequence(): void {
    if (!this.phaseContainer || !this.data) return;

    const consequenceContainer = document.createElement('div');
    consequenceContainer.className = 'da-discoverer-consequence';
    this.phaseContainer.appendChild(consequenceContainer);

    this.consequencePanel = new ConsequenceRevealPanel();
    this.consequencePanel.mount(consequenceContainer);
    this.consequencePanel.setDecisionResult(this.data.decision, this.chosenOptionId ?? this.data.decision.historicalChoice);

    this.consequencePanel.onContinue(() => {
      this.currentPhase = 'celebration';
      this.renderPhase();
    });
  }

  /**
   * Render the celebration phase.
   */
  private renderCelebration(): void {
    if (!this.phaseContainer || !this.data) return;

    const celebrationEl = document.createElement('div');
    celebrationEl.className = 'da-discoverer-celebration';

    // Headline
    const headline = document.createElement('h1');
    headline.className = 'da-discoverer-celebration-headline';
    headline.textContent = this.data.celebration.headline;
    celebrationEl.appendChild(headline);

    // Lines
    for (const line of this.data.celebration.lines) {
      const p = document.createElement('p');
      p.className = 'da-discoverer-celebration-line';
      p.textContent = line;
      celebrationEl.appendChild(p);
    }

    // Journey button
    const journeyBtn = document.createElement('button');
    journeyBtn.className = 'da-discoverer-journey-btn';
    journeyBtn.type = 'button';
    journeyBtn.textContent = this.data.celebration.journeyButton;
    this.boundJourneyHandler = () => {
      if (this.completeCallback) {
        this.completeCallback('journey');
      }
    };
    journeyBtn.addEventListener('click', this.boundJourneyHandler);
    celebrationEl.appendChild(journeyBtn);

    // Lab button
    const labBtn = document.createElement('button');
    labBtn.className = 'da-discoverer-lab-btn';
    labBtn.type = 'button';
    labBtn.textContent = this.data.celebration.labButton;
    this.boundLabHandler = () => {
      if (this.completeCallback) {
        this.completeCallback('lab');
      }
    };
    labBtn.addEventListener('click', this.boundLabHandler);
    celebrationEl.appendChild(labBtn);

    this.phaseContainer.appendChild(celebrationEl);

    // Move focus to the primary action button for keyboard/screen reader users
    journeyBtn.focus();
  }

  /**
   * Clear all auto-progress timers.
   */
  private clearAutoProgressTimers(): void {
    for (const timerId of this.autoProgressTimers) {
      clearTimeout(timerId);
    }
    this.autoProgressTimers = [];
  }

  /**
   * Clear all bound handler references.
   */
  private clearBoundHandlers(): void {
    this.boundBeginHandler = null;
    this.boundSkipHandler = null;
    this.boundContinueHandler = null;
    this.boundJourneyHandler = null;
    this.boundLabHandler = null;
  }

  /**
   * Destroy all active sub-components.
   */
  private destroySubComponents(): void {
    if (this.decisionScene) {
      this.decisionScene.destroy();
      this.decisionScene = null;
    }
    if (this.builderScene) {
      this.builderScene.destroy();
      this.builderScene = null;
    }
    if (this.consequencePanel) {
      this.consequencePanel.destroy();
      this.consequencePanel = null;
    }
  }
}
