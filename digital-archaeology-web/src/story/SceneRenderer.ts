// src/story/SceneRenderer.ts
// Dynamic scene rendering for Story Mode
// Story 10.17: Wire Story Mode Integration
// Story 10.21: Historical Mindset Time-Travel (anachronism filtering)

import type { StoryScene, StoryChapter, StoryAct } from './content-types';
import type { ChoiceData, DialogueData, CharacterData, TechnicalNoteData, PersonaData } from './types';
import { ChapterHeader } from './ChapterHeader';
import { SceneSetting } from './SceneSetting';
import { CharacterCard } from './CharacterCard';
import { DialogueBlock } from './DialogueBlock';
import { ChoiceCard } from './ChoiceCard';
import { TechnicalNote } from './TechnicalNote';
import { EnterLabButton } from './EnterLabButton';
import { StoryActionsFooter } from './StoryActionsFooter';
import { PersonaCard } from './PersonaCard';
import { MindsetProvider } from './MindsetProvider';
import { createEraFilter } from './AnachronismFilter';

/**
 * Scene render context containing act and chapter information.
 */
export interface SceneRenderContext {
  act: StoryAct;
  chapter: StoryChapter;
  scene: StoryScene;
  isFirstSceneInChapter: boolean;
}

/**
 * Callbacks for scene interactions.
 */
export interface SceneRendererCallbacks {
  onChoiceSelect?: (choiceId: string) => void;
  onContinue?: () => void;
  onPrevious?: () => void;
  onEnterLab?: () => void;
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

  // Story 10.21: Anachronism filtering
  private filteringEnabled = false;

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

    // Clean up previous scene components
    this.cleanup();

    // Create scene container
    this.sceneContainer = document.createElement('div');
    this.sceneContainer.className = 'da-scene-container';
    this.sceneContainer.setAttribute('role', 'article');
    this.sceneContainer.setAttribute('aria-label', 'Story scene');

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
   */
  private renderChoices(choices: ChoiceData[]): void {
    const choicesContainer = document.createElement('div');
    choicesContainer.className = 'da-scene-choices';

    for (const choice of choices) {
      const card = new ChoiceCard();
      const mount = document.createElement('div');
      mount.className = 'da-scene-choice-mount';
      choicesContainer.appendChild(mount);
      card.mount(mount);
      card.setChoiceData(choice);
      card.onSelect((choiceId) => {
        if (this.callbacks.onChoiceSelect) {
          this.callbacks.onChoiceSelect(choiceId);
        }
      });
      this.activeComponents.push(card);
    }

    this.sceneContainer!.appendChild(choicesContainer);
  }

  /**
   * Render Enter Lab button for challenge scenes.
   */
  private renderEnterLabButton(): void {
    const labButton = new EnterLabButton();
    const mount = document.createElement('div');
    mount.className = 'da-scene-enter-lab-mount';
    this.sceneContainer!.appendChild(mount);
    labButton.mount(mount);
    labButton.onEnterLab(() => {
      if (this.callbacks.onEnterLab) {
        this.callbacks.onEnterLab();
      }
    });
    this.activeComponents.push(labButton);
  }

  /**
   * Render story actions footer.
   */
  private renderFooter(context: SceneRenderContext): void {
    // Create footer container
    const footerMount = document.createElement('div');
    footerMount.className = 'da-scene-footer-mount';
    this.container!.appendChild(footerMount);

    this.footer = new StoryActionsFooter();
    this.footer.mount(footerMount);
    this.wireFooterCallbacks();

    // Configure footer state based on scene
    const hasNextScene = !!context.scene.nextScene;
    const hasChoices = context.scene.choices && context.scene.choices.length > 0;
    const isChallenge = context.scene.type === 'challenge';

    // Disable continue if no next scene or if choices/challenge present
    this.footer.setContinueEnabled(hasNextScene && !hasChoices);

    // Show Enter Lab button only for challenge scenes
    this.footer.setEnterLabVisible(isChallenge);

    this.activeComponents.push(this.footer);
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
        this.callbacks.onEnterLab();
      }
    });
  }

  /**
   * Update footer state (e.g., after navigation).
   */
  updateFooterState(hasPrevious: boolean, hasNext: boolean): void {
    if (this.footer) {
      this.footer.setPreviousEnabled(hasPrevious);
      this.footer.setContinueEnabled(hasNext);
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

    // Clear container contents
    if (this.container) {
      while (this.container.firstChild) {
        this.container.removeChild(this.container.firstChild);
      }
    }
    this.sceneContainer = null;
  }

  /**
   * Destroy the renderer and clean up resources.
   */
  destroy(): void {
    this.cleanup();
    this.container = null;
    this.callbacks = {};
  }
}
