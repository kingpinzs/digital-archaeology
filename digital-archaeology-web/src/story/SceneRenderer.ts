// src/story/SceneRenderer.ts
// Dynamic scene rendering for Story Mode
// Story 10.17: Wire Story Mode Integration
// Story 10.21: Historical Mindset Time-Travel (anachronism filtering)

import type { StoryScene, StoryChapter, StoryAct, BuilderChallengeData, SceneTransitionData } from './content-types';
import type { ChoiceData, DialogueData, CharacterData, TechnicalNoteData, PersonaData, TransitionData, HistoricalDecision, ChallengeContext } from './types';
import { ChapterHeader } from './ChapterHeader';
import { SceneSetting } from './SceneSetting';
import { CharacterCard } from './CharacterCard';
import { DialogueBlock } from './DialogueBlock';
import { ChoiceCard } from './ChoiceCard';
import { TechnicalNote } from './TechnicalNote';
import { EnterLabButton } from './EnterLabButton';
import { StoryActionsFooter } from './StoryActionsFooter';
import { PersonaCard } from './PersonaCard';
import { DecisionMakerScene } from './DecisionMakerScene';
import { BuilderModeScene } from './BuilderModeScene';
import { MindsetProvider } from './MindsetProvider';
import { createEraFilter } from './AnachronismFilter';
import { ChapterTransitionPanel } from './ChapterTransitionPanel';
import { PersonaTransitionPanel } from './PersonaTransitionPanel';
import { TimeTravelPortal } from './TimeTravelPortal';

/**
 * Scene render context containing act and chapter information.
 */
export interface SceneRenderContext {
  act: StoryAct;
  chapter: StoryChapter;
  scene: StoryScene;
  isFirstSceneInChapter: boolean;
  /** Story 26.9: Branch ID if this scene is on an alternate timeline */
  branchId?: string;
  /** Story 26.9: Branch label for display (e.g., "What if stack machines won?") */
  branchLabel?: string;
}

/**
 * Callbacks for scene interactions.
 */
export interface SceneRendererCallbacks {
  onChoiceSelect?: (choiceId: string) => void;
  onContinue?: () => void;
  onPrevious?: () => void;
  onEnterLab?: (context?: ChallengeContext) => void;
  /** Called when a historical decision is made (Story 10.22) */
  onDecisionMade?: (decisionId: string, optionId: string) => void;
  /** Called when builder challenge is complete (Story 10.22) */
  onBuilderComplete?: () => void;
  /** Called when a clickable collectible stat value is clicked */
  onCollectibleClick?: (id: string, type: 'location' | 'artifact') => void;
}

/**
 * SceneRenderer dynamically renders story scenes using existing UI components.
 * Maps scene data to appropriate components and manages their lifecycle.
 */
export class SceneRenderer {
  private container: HTMLElement | null = null;
  private callbacks: SceneRendererCallbacks = {};

  // Active component instances (for cleanup)
  private activeComponents: Array<{ destroy: () => void }> = [];

  // Reusable structural elements
  private sceneContainer: HTMLElement | null = null;
  private footer: StoryActionsFooter | null = null;

  // Current render context (for challenge context extraction)
  private currentContext: SceneRenderContext | null = null;

  // Story 10.21: Anachronism filtering
  private filteringEnabled = false;

  // Time travel portal for animated transitions
  private portal: TimeTravelPortal | null = null;

  // Story acts for persona lookup during transitions
  private storyActs: StoryAct[] = [];

  // Story 26.8: Replay mode flag
  private replayMode = false;
  private onExitReplay: (() => void) | null = null;

  /**
   * Enable or disable replay mode on the renderer.
   * When enabled, interactive elements are disabled and a replay badge is shown.
   * Story 26.8: Time-Travel Replay
   */
  setReplayMode(enabled: boolean, onExitReplay?: () => void): void {
    this.replayMode = enabled;
    this.onExitReplay = onExitReplay ?? null;
  }

  /**
   * Set callbacks for scene interactions.
   */
  setCallbacks(callbacks: SceneRendererCallbacks): void {
    this.callbacks = callbacks;
    // Update footer callbacks if already created
    if (this.footer) {
      this.wireFooterCallbacks();
    }
  }

  /**
   * Enable or disable anachronism filtering.
   * When enabled, text content is filtered using the current mindset context.
   * An era-specific filter is created per-render based on the current mindset.
   * Story 10.21: Historical Mindset Time-Travel
   */
  setAnachronismFiltering(enabled: boolean): void {
    this.filteringEnabled = enabled;
    // Note: The actual filter is created fresh in filterText() based on current mindset
    // This allows the filter to adapt as the mindset changes between scenes
  }

  /**
   * Provide the full list of story acts for persona lookup during transitions.
   */
  setStoryActs(acts: StoryAct[]): void {
    this.storyActs = acts;
  }

  /**
   * Look up the persona for the act following the given act number.
   * Returns null if the next act doesn't exist or has no persona defined.
   */
  private getNextActPersona(currentActNumber: number): PersonaData | null {
    // Acts are numbered sequentially; find the one after currentActNumber
    const nextAct = this.storyActs.find(a => a.number === currentActNumber + 1);
    return nextAct?.persona ?? null;
  }

  /**
   * Filter text for anachronisms using the current mindset.
   * Returns the original text if filtering is disabled or no mindset is set.
   * Creates an era-specific filter with pre-loaded anachronistic terms.
   * Story 10.21: Historical Mindset Time-Travel
   */
  private filterText(text: string): string {
    if (!this.filteringEnabled) {
      return text;
    }

    const mindset = MindsetProvider.getInstance().getCurrentMindset();
    if (!mindset) {
      return text;
    }

    // Create era-specific filter with pre-loaded common anachronistic terms
    // createEraFilter includes terms like smartphone->mobile phone, internet->ARPANET
    const eraFilter = createEraFilter(mindset.year);

    // Add terms from the mindset's unknownTechnology list that aren't already in filter
    // Note: We don't overwrite existing terms to preserve their replacements
    for (const tech of mindset.unknownTechnology) {
      // Only add if not already an anachronism (i.e., not already in the filter)
      // This check is done against the filter's internal year check
      const alreadyFiltered = eraFilter.isAnachronism(tech, mindset.year);
      if (!alreadyFiltered) {
        // Add with a year after the current mindset year to ensure filtering
        // These won't have replacements, so they'll just be flagged if no replacement exists
        eraFilter.addCustomTerm(tech, mindset.year + 1);
      }
    }

    const result = eraFilter.analyze(text, { mode: 'replace', year: mindset.year });
    return result.filtered;
  }

  /**
   * Render a scene to the container.
   * Clears existing content and renders new scene components.
   */
  renderScene(context: SceneRenderContext, container: HTMLElement): void {
    this.container = container;
    this.currentContext = context;

    // Clean up previous scene components
    this.cleanup();

    // Handle transition scenes (chapter/act bridges)
    if (context.scene.type === 'transition' && context.scene.transition) {
      this.renderTransitionScene(context);
      return;
    }

    // Create scene container
    this.sceneContainer = document.createElement('div');
    this.sceneContainer.className = 'da-scene-container';
    this.sceneContainer.setAttribute('role', 'article');
    this.sceneContainer.setAttribute('aria-label', 'Story scene');

    // Story 26.8: Add replay badge when in replay mode
    if (this.replayMode) {
      this.sceneContainer.classList.add('da-scene-container--replay');
      const replayBadge = document.createElement('div');
      replayBadge.className = 'da-scene-replay-badge';
      replayBadge.setAttribute('aria-label', 'Replaying past scene');
      replayBadge.textContent = '\u23F1 REPLAYING'; // ⏱ REPLAYING
      this.sceneContainer.appendChild(replayBadge);
    }

    // Story 26.9: Add branch badge when on an alternate timeline
    if (context.branchId) {
      this.sceneContainer.classList.add('da-scene-container--branch');
      const branchBadge = document.createElement('div');
      branchBadge.className = 'da-scene-branch-badge';
      branchBadge.setAttribute('aria-label', 'Alternate timeline');
      branchBadge.textContent = context.branchLabel ?? 'Alternate Timeline';
      this.sceneContainer.appendChild(branchBadge);
    }

    // Render chapter header if first scene in chapter
    if (context.isFirstSceneInChapter) {
      this.renderChapterHeader(context);
    }

    // Render persona card if persona scene (Story 10.18)
    if (context.scene.type === 'persona' && context.scene.persona) {
      this.renderPersonaCard(context.scene.persona);
    }

    // Render scene setting if present
    if (context.scene.setting) {
      this.renderSceneSetting(context.scene.setting);
    }

    // Render narrative paragraphs
    if (context.scene.narrative && context.scene.narrative.length > 0) {
      this.renderNarrative(context.scene.narrative);
    }

    // Render characters if present
    if (context.scene.characters && context.scene.characters.length > 0) {
      this.renderCharacters(context.scene.characters);
    }

    // Render dialogues if present
    if (context.scene.dialogues && context.scene.dialogues.length > 0) {
      this.renderDialogues(context.scene.dialogues);
    }

    // Render technical notes if present
    if (context.scene.technicalNotes && context.scene.technicalNotes.length > 0) {
      this.renderTechnicalNotes(context.scene.technicalNotes);
    }

    // Render choices if present (choice scene)
    if (context.scene.choices && context.scene.choices.length > 0) {
      this.renderChoices(context.scene.choices);
    }

    // Render challenge button if challenge scene
    if (context.scene.type === 'challenge' && context.scene.challenge) {
      this.renderEnterLabButton();
    }

    // Render decision scene (Story 10.22)
    // Story 26.8: Skip interactive decision/builder in replay mode
    if (context.scene.type === 'decision' && context.scene.decision && !this.replayMode) {
      this.renderDecisionScene(context.scene.decision);
    }

    // Render builder scene (Story 10.22)
    if (context.scene.type === 'builder' && context.scene.builderChallenge && !this.replayMode) {
      this.renderBuilderScene(context.scene.builderChallenge);
    }

    // Append scene container
    this.container.appendChild(this.sceneContainer);

    // Create footer
    this.renderFooter(context);
  }

  /**
   * Render chapter header component.
   */
  private renderChapterHeader(context: SceneRenderContext): void {
    const header = new ChapterHeader();
    const mount = document.createElement('div');
    mount.className = 'da-scene-chapter-header-mount';
    this.sceneContainer!.appendChild(mount);
    header.mount(mount);
    header.setChapterData({
      actNumber: context.act.number,
      year: context.chapter.year,
      title: context.chapter.title,
      subtitle: context.chapter.subtitle,
    });
    this.activeComponents.push(header);
  }

  /**
   * Render persona card for persona introduction scenes.
   * Story 10.18: Create Historical Personas System
   */
  private renderPersonaCard(persona: PersonaData): void {
    const personaCard = new PersonaCard();
    const mount = document.createElement('div');
    mount.className = 'da-scene-persona-mount';
    this.sceneContainer!.appendChild(mount);
    personaCard.mount(mount);
    personaCard.setPersonaData(persona);
    this.activeComponents.push(personaCard);
  }

  /**
   * Render scene setting component.
   * Applies anachronism filtering when enabled (Story 10.21).
   */
  private renderSceneSetting(setting: { text: string }): void {
    const sceneSetting = new SceneSetting();
    const mount = document.createElement('div');
    mount.className = 'da-scene-setting-mount';
    this.sceneContainer!.appendChild(mount);
    sceneSetting.mount(mount);
    // Story 10.21: Apply anachronism filtering
    sceneSetting.setSettingData({ text: this.filterText(setting.text) });
    this.activeComponents.push(sceneSetting);
  }

  /**
   * Render narrative paragraphs.
   * Applies anachronism filtering when enabled (Story 10.21).
   */
  private renderNarrative(paragraphs: string[]): void {
    const narrativeContainer = document.createElement('div');
    narrativeContainer.className = 'da-scene-narrative';

    for (const paragraph of paragraphs) {
      const p = document.createElement('p');
      p.className = 'da-scene-narrative-text';
      // Story 10.21: Apply anachronism filtering
      p.textContent = this.filterText(paragraph);
      narrativeContainer.appendChild(p);
    }

    this.sceneContainer!.appendChild(narrativeContainer);
  }

  /**
   * Render character cards.
   */
  private renderCharacters(characters: CharacterData[]): void {
    const charactersContainer = document.createElement('div');
    charactersContainer.className = 'da-scene-characters';

    for (const character of characters) {
      const card = new CharacterCard();
      const mount = document.createElement('div');
      mount.className = 'da-scene-character-mount';
      charactersContainer.appendChild(mount);
      card.mount(mount);
      card.setCharacterData(character);
      // Wire collectible stat click callback
      if (this.callbacks.onCollectibleClick) {
        card.setOnStatClick((id, type) => {
          this.callbacks.onCollectibleClick?.(id, type);
        });
      }
      this.activeComponents.push(card);
    }

    this.sceneContainer!.appendChild(charactersContainer);
  }

  /**
   * Render dialogue blocks.
   * Applies anachronism filtering to dialogue text (not speaker names) when enabled (Story 10.21).
   */
  private renderDialogues(dialogues: DialogueData[]): void {
    const dialogueContainer = document.createElement('div');
    dialogueContainer.className = 'da-scene-dialogues';

    for (const dialogue of dialogues) {
      const block = new DialogueBlock();
      const mount = document.createElement('div');
      mount.className = 'da-scene-dialogue-mount';
      dialogueContainer.appendChild(mount);
      block.mount(mount);
      // Story 10.21: Apply anachronism filtering to dialogue text (not speaker name)
      block.setDialogueData({
        speaker: dialogue.speaker,
        text: this.filterText(dialogue.text),
      });
      this.activeComponents.push(block);
    }

    this.sceneContainer!.appendChild(dialogueContainer);
  }

  /**
   * Render technical notes.
   * Applies anachronism filtering to note content (not code snippets) when enabled (Story 10.21).
   */
  private renderTechnicalNotes(notes: TechnicalNoteData[]): void {
    const notesContainer = document.createElement('div');
    notesContainer.className = 'da-scene-technical-notes';

    for (const note of notes) {
      const technicalNote = new TechnicalNote();
      const mount = document.createElement('div');
      mount.className = 'da-scene-technical-note-mount';
      notesContainer.appendChild(mount);
      technicalNote.mount(mount);
      // Story 10.21: Apply anachronism filtering to content (not code snippets)
      technicalNote.setNoteData({
        content: this.filterText(note.content),
        codeSnippet: note.codeSnippet,
      });
      this.activeComponents.push(technicalNote);
    }

    this.sceneContainer!.appendChild(notesContainer);
  }

  /**
   * Render choice cards.
   * Story 26.8: Choices are visually disabled during replay mode.
   */
  private renderChoices(choices: ChoiceData[]): void {
    const choicesContainer = document.createElement('div');
    choicesContainer.className = 'da-scene-choices';

    // Story 26.8: Mark choices container as disabled during replay
    if (this.replayMode) {
      choicesContainer.classList.add('da-scene-choices--disabled');
    }

    for (const choice of choices) {
      const card = new ChoiceCard();
      const mount = document.createElement('div');
      mount.className = 'da-scene-choice-mount';
      choicesContainer.appendChild(mount);
      card.mount(mount);
      card.setChoiceData(choice);
      // Story 26.8: Don't wire click handlers during replay
      if (!this.replayMode) {
        card.onSelect((choiceId) => {
          if (this.callbacks.onChoiceSelect) {
            this.callbacks.onChoiceSelect(choiceId);
          }
        });
      }
      this.activeComponents.push(card);
    }

    this.sceneContainer!.appendChild(choicesContainer);
  }

  /**
   * Render Enter Lab button for challenge scenes.
   * Story 26.8: Lab button is hidden during replay mode.
   */
  private renderEnterLabButton(): void {
    // Story 26.8: Don't render lab button during replay
    if (this.replayMode) return;

    const labButton = new EnterLabButton();
    const mount = document.createElement('div');
    mount.className = 'da-scene-enter-lab-mount';
    this.sceneContainer!.appendChild(mount);
    labButton.mount(mount);
    labButton.onEnterLab(() => {
      if (this.callbacks.onEnterLab) {
        // Build ChallengeContext if scene has challenge data with a simulatorId
        const scene = this.currentContext?.scene;
        const challenge = scene?.challenge;
        if (challenge?.simulatorId) {
          const context: ChallengeContext = {
            sceneId: scene!.id,
            challengeData: challenge,
            simulatorType: challenge.simulatorId,
            era: this.currentContext?.act.era,
            actTitle: this.currentContext?.act.title,
          };
          this.callbacks.onEnterLab(context);
        } else {
          this.callbacks.onEnterLab();
        }
      }
    });
    this.activeComponents.push(labButton);
  }

  /**
   * Render decision maker scene for decision scenes.
   * Story 10.22: Decision-Maker + Builder Mode
   */
  private renderDecisionScene(decision: HistoricalDecision): void {
    const decisionScene = new DecisionMakerScene();
    const mount = document.createElement('div');
    mount.className = 'da-scene-decision-mount';
    this.sceneContainer!.appendChild(mount);
    decisionScene.mount(mount);
    decisionScene.setDecision(decision);
    decisionScene.onBuildTransition((decisionId, optionId) => {
      if (this.callbacks.onDecisionMade) {
        this.callbacks.onDecisionMade(decisionId, optionId);
      }
    });
    this.activeComponents.push(decisionScene);
  }

  /**
   * Render builder mode scene for builder scenes.
   * Story 10.22: Decision-Maker + Builder Mode
   */
  private renderBuilderScene(challenge: BuilderChallengeData): void {
    const builderScene = new BuilderModeScene();
    const mount = document.createElement('div');
    mount.className = 'da-scene-builder-mount';
    this.sceneContainer!.appendChild(mount);
    builderScene.mount(mount);
    builderScene.setChallengeData(challenge);
    builderScene.onEnterLab(() => {
      if (this.callbacks.onEnterLab) {
        this.callbacks.onEnterLab();
      }
    });
    builderScene.onComplete(() => {
      if (this.callbacks.onBuilderComplete) {
        this.callbacks.onBuilderComplete();
      }
    });
    this.activeComponents.push(builderScene);
  }

  /**
   * Render a transition scene (chapter or act bridge).
   * Chapter transitions use ChapterTransitionPanel (lighter).
   * Act transitions use PersonaTransitionPanel (epic, with persona swap).
   */
  private renderTransitionScene(context: SceneRenderContext): void {
    const transitionData = context.scene.transition!;
    const mount = document.createElement('div');
    mount.className = 'da-scene-transition-mount';
    this.container!.appendChild(mount);

    // Create portal if not yet mounted
    if (!this.portal) {
      this.portal = new TimeTravelPortal();
      this.portal.mount(this.container!);
    }

    const mode = transitionData.actTransition ? 'persona' : 'chapter';

    // Play portal animation, then show panel (catch ensures panel shows even if animation fails)
    const showPanel = () => {
      if (transitionData.actTransition) {
        this.renderActTransition(context, transitionData, mount);
      } else {
        this.renderChapterTransition(transitionData, mount);
      }
    };
    this.portal.play(mode).then(showPanel).catch(showPanel);
  }

  /**
   * Render a chapter transition using ChapterTransitionPanel.
   */
  private renderChapterTransition(transitionData: SceneTransitionData, mount: HTMLElement): void {
    const panel = new ChapterTransitionPanel();
    panel.mount(mount);

    // Apply anachronism filtering to narrative text
    const filteredData: SceneTransitionData = {
      ...transitionData,
      narrative: transitionData.narrative.map(p => this.filterText(p)),
    };
    panel.setTransitionData(filteredData);
    panel.onContinue(() => {
      if (this.callbacks.onContinue) {
        this.callbacks.onContinue();
      }
    });
    panel.show();
    this.activeComponents.push(panel);
  }

  /**
   * Render an act transition using PersonaTransitionPanel.
   * Looks up outgoing/incoming persona data from the act.
   */
  private renderActTransition(
    context: SceneRenderContext,
    transitionData: SceneTransitionData,
    mount: HTMLElement
  ): void {
    const panel = new PersonaTransitionPanel();
    panel.mount(mount);

    // Build TransitionData for PersonaTransitionPanel from SceneTransitionData
    const personaTransition: TransitionData = {
      outgoingPersonaId: '',
      incomingPersonaId: '',
      yearsElapsed: transitionData.yearsElapsed,
      narrative: transitionData.narrative.map(p => this.filterText(p)),
      outgoingEra: transitionData.outgoingEra,
      incomingEra: transitionData.incomingEra,
    };

    // Get personas: outgoing = current act's persona, incoming = next act's persona
    const outgoingPersona = context.act.persona ?? this.createFallbackPersona(transitionData.outgoingEra);
    const incomingPersona = this.getNextActPersona(context.act.number) ?? this.createFallbackPersona(transitionData.incomingEra);

    panel.setTransitionData(personaTransition, outgoingPersona, incomingPersona);
    panel.onContinue(() => {
      if (this.callbacks.onContinue) {
        this.callbacks.onContinue();
      }
    });
    panel.show();
    this.activeComponents.push(panel);
  }

  /**
   * Create a minimal fallback persona when act persona data isn't available.
   */
  private createFallbackPersona(era: string): PersonaData {
    return {
      id: 'fallback',
      name: 'Unknown Pioneer',
      years: '',
      era,
      avatar: '\u{1F464}',
      quote: '',
      background: '',
      motivation: '',
      constraints: [],
      problem: '',
    };
  }

  /**
   * Render story actions footer.
   * Story 26.8: In replay mode, disables navigation and shows "Return to Present" button.
   */
  private renderFooter(context: SceneRenderContext): void {
    // Create footer container
    const footerMount = document.createElement('div');
    footerMount.className = 'da-scene-footer-mount';
    this.container!.appendChild(footerMount);

    // Story 26.8: In replay mode, render a simplified footer with "Return to Present"
    if (this.replayMode) {
      this.renderReplayFooter(footerMount);
      return;
    }

    this.footer = new StoryActionsFooter();
    this.footer.mount(footerMount);
    this.wireFooterCallbacks();

    // Configure footer state based on scene
    const hasNextScene = !!context.scene.nextScene;
    const hasChoices = context.scene.choices && context.scene.choices.length > 0;
    const isChallenge = context.scene.type === 'challenge';
    const isDecision = context.scene.type === 'decision';
    const isBuilder = context.scene.type === 'builder';

    // Disable continue if no next scene or if choices/challenge/decision/builder present
    // Story 26.2: challenge scenes MUST go through "Enter the Lab" — no skipping
    this.footer.setContinueEnabled(hasNextScene && !hasChoices && !isChallenge && !isDecision && !isBuilder);

    // Show Enter Lab button only for challenge scenes (builder has its own)
    this.footer.setEnterLabVisible(isChallenge);

    this.activeComponents.push(this.footer);
  }

  /**
   * Render a replay-mode footer with "Return to Present" button.
   * Story 26.8: Time-Travel Replay
   */
  private renderReplayFooter(mount: HTMLElement): void {
    const footer = document.createElement('footer');
    footer.className = 'da-story-actions-footer da-story-actions-footer--replay';
    footer.setAttribute('role', 'navigation');
    footer.setAttribute('aria-label', 'Replay navigation');

    const returnBtn = document.createElement('button');
    returnBtn.type = 'button';
    returnBtn.className = 'da-story-action-btn da-story-action-btn--return-to-present';
    returnBtn.setAttribute('aria-label', 'Return to present timeline');

    const textSpan = document.createElement('span');
    textSpan.className = 'da-story-action-btn-text';
    textSpan.textContent = 'Return to Present';

    const iconSpan = document.createElement('span');
    iconSpan.className = 'da-story-action-btn-icon';
    iconSpan.textContent = '\u2192'; // →
    iconSpan.setAttribute('aria-hidden', 'true');

    returnBtn.appendChild(textSpan);
    returnBtn.appendChild(iconSpan);
    returnBtn.addEventListener('click', () => {
      this.onExitReplay?.();
    });

    footer.appendChild(returnBtn);
    mount.appendChild(footer);
  }

  /**
   * Wire footer button callbacks.
   */
  private wireFooterCallbacks(): void {
    if (!this.footer) return;

    this.footer.onContinue(() => {
      if (this.callbacks.onContinue) {
        this.callbacks.onContinue();
      }
    });

    this.footer.onPrevious(() => {
      if (this.callbacks.onPrevious) {
        this.callbacks.onPrevious();
      }
    });

    this.footer.onEnterLab(() => {
      if (this.callbacks.onEnterLab) {
        const scene = this.currentContext?.scene;
        const challenge = scene?.challenge;
        if (challenge?.simulatorId) {
          const context: ChallengeContext = {
            sceneId: scene!.id,
            challengeData: challenge,
            simulatorType: challenge.simulatorId,
            era: this.currentContext?.act.era,
            actTitle: this.currentContext?.act.title,
          };
          this.callbacks.onEnterLab(context);
        } else {
          this.callbacks.onEnterLab();
        }
      }
    });
  }

  /**
   * Update footer state (e.g., after navigation).
   * Story 26.2: respects scene gating — Continue stays disabled on challenge/decision/builder scenes.
   */
  updateFooterState(hasPrevious: boolean, hasNext: boolean): void {
    if (this.footer) {
      this.footer.setPreviousEnabled(hasPrevious);
      const sceneType = this.currentContext?.scene.type;
      const isGated = sceneType === 'challenge' || sceneType === 'decision' || sceneType === 'builder';
      this.footer.setContinueEnabled(hasNext && !isGated);
    }
  }

  /**
   * Clean up all active components.
   */
  private cleanup(): void {
    for (const component of this.activeComponents) {
      component.destroy();
    }
    this.activeComponents = [];
    this.footer = null;

    // Clear container contents but preserve portal elements
    if (this.container) {
      const children = Array.from(this.container.childNodes);
      for (const child of children) {
        const el = child as Element;
        if (el.classList?.contains('da-portal-backdrop') || el.classList?.contains('da-portal-canvas')) {
          continue; // preserve portal
        }
        this.container.removeChild(child);
      }
    }
    this.sceneContainer = null;
  }

  /**
   * Destroy the renderer and clean up resources.
   */
  destroy(): void {
    this.cleanup();
    this.portal?.destroy();
    this.portal = null;
    this.container = null;
    this.callbacks = {};
  }
}
