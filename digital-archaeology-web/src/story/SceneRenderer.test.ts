// src/story/SceneRenderer.test.ts
// Tests for SceneRenderer component
// Story 10.17: Wire Story Mode Integration

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SceneRenderer } from './SceneRenderer';
import type { SceneRenderContext } from './SceneRenderer';
import type { StoryAct, StoryChapter, StoryScene } from './content-types';

describe('SceneRenderer', () => {
  let container: HTMLElement;
  let renderer: SceneRenderer;

  const createMockAct = (overrides?: Partial<StoryAct>): StoryAct => ({
    id: 'act-1',
    number: 1,
    title: 'Test Act',
    description: 'Test description',
    era: '1971',
    cpuStage: 'micro4',
    chapters: [],
    ...overrides,
  });

  const createMockChapter = (overrides?: Partial<StoryChapter>): StoryChapter => ({
    id: 'chapter-1-1',
    number: 1,
    title: 'Test Chapter',
    subtitle: 'Test subtitle',
    year: '1971',
    scenes: [],
    ...overrides,
  });

  const createMockScene = (overrides?: Partial<StoryScene>): StoryScene => ({
    id: 'scene-1-1-1',
    type: 'narrative',
    ...overrides,
  });

  const createContext = (overrides?: Partial<SceneRenderContext>): SceneRenderContext => ({
    act: createMockAct(),
    chapter: createMockChapter(),
    scene: createMockScene(),
    isFirstSceneInChapter: true,
    ...overrides,
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    renderer = new SceneRenderer();
  });

  afterEach(() => {
    renderer.destroy();
    container.remove();
  });

  describe('Task 2: Scene Rendering', () => {
    it('should create scene container with correct class', () => {
      const context = createContext();
      renderer.renderScene(context, container);

      const sceneContainer = container.querySelector('.da-scene-container');
      expect(sceneContainer).not.toBeNull();
    });

    it('should set aria attributes on scene container', () => {
      const context = createContext();
      renderer.renderScene(context, container);

      const sceneContainer = container.querySelector('.da-scene-container');
      expect(sceneContainer?.getAttribute('role')).toBe('article');
      expect(sceneContainer?.getAttribute('aria-label')).toBe('Story scene');
    });

    it('should render chapter header when isFirstSceneInChapter is true', () => {
      const context = createContext({ isFirstSceneInChapter: true });
      renderer.renderScene(context, container);

      const header = container.querySelector('.da-chapter-header');
      expect(header).not.toBeNull();
    });

    it('should not render chapter header when isFirstSceneInChapter is false', () => {
      const context = createContext({ isFirstSceneInChapter: false });
      renderer.renderScene(context, container);

      const header = container.querySelector('.da-chapter-header');
      expect(header).toBeNull();
    });
  });

  describe('Task 2: Scene Setting Rendering', () => {
    it('should render scene setting when present', () => {
      const context = createContext({
        scene: createMockScene({
          setting: { text: 'A mysterious laboratory...' },
        }),
      });
      renderer.renderScene(context, container);

      const setting = container.querySelector('.da-scene-setting');
      expect(setting).not.toBeNull();
    });

    it('should not render scene setting when absent', () => {
      const context = createContext({
        scene: createMockScene({ setting: undefined }),
      });
      renderer.renderScene(context, container);

      const setting = container.querySelector('.da-scene-setting');
      expect(setting).toBeNull();
    });
  });

  describe('Task 2: Narrative Rendering', () => {
    it('should render narrative paragraphs', () => {
      const context = createContext({
        scene: createMockScene({
          narrative: ['First paragraph.', 'Second paragraph.'],
        }),
      });
      renderer.renderScene(context, container);

      const paragraphs = container.querySelectorAll('.da-scene-narrative-text');
      expect(paragraphs.length).toBe(2);
      expect(paragraphs[0].textContent).toBe('First paragraph.');
      expect(paragraphs[1].textContent).toBe('Second paragraph.');
    });

    it('should not render narrative container when no narrative', () => {
      const context = createContext({
        scene: createMockScene({ narrative: undefined }),
      });
      renderer.renderScene(context, container);

      const narrativeContainer = container.querySelector('.da-scene-narrative');
      expect(narrativeContainer).toBeNull();
    });
  });

  describe('Task 2: Character Rendering', () => {
    it('should render character cards when present', () => {
      const context = createContext({
        scene: createMockScene({
          characters: [
            {
              avatar: '👨‍🔬',
              name: 'Dr. Smith',
              title: 'Lead Engineer',
              bio: 'A brilliant scientist.',
              stats: [],
            },
          ],
        }),
      });
      renderer.renderScene(context, container);

      const characterCard = container.querySelector('.da-character-card');
      expect(characterCard).not.toBeNull();
    });

    it('should render multiple characters', () => {
      const context = createContext({
        scene: createMockScene({
          characters: [
            { avatar: '👨‍🔬', name: 'Dr. Smith', title: 'Lead', bio: 'Bio 1', stats: [] },
            { avatar: '👩‍💻', name: 'Dr. Jones', title: 'Senior', bio: 'Bio 2', stats: [] },
          ],
        }),
      });
      renderer.renderScene(context, container);

      const characterCards = container.querySelectorAll('.da-character-card');
      expect(characterCards.length).toBe(2);
    });
  });

  describe('Task 2: Dialogue Rendering', () => {
    it('should render dialogue blocks when present', () => {
      const context = createContext({
        scene: createMockScene({
          dialogues: [
            { speaker: 'Dr. Smith', text: 'Welcome to the lab.' },
          ],
        }),
      });
      renderer.renderScene(context, container);

      const dialogueBlock = container.querySelector('.da-dialogue-block');
      expect(dialogueBlock).not.toBeNull();
    });

    it('should render multiple dialogues', () => {
      const context = createContext({
        scene: createMockScene({
          dialogues: [
            { speaker: 'Dr. Smith', text: 'Hello.' },
            { speaker: 'Dr. Jones', text: 'Hi there.' },
          ],
        }),
      });
      renderer.renderScene(context, container);

      const dialogueBlocks = container.querySelectorAll('.da-dialogue-block');
      expect(dialogueBlocks.length).toBe(2);
    });
  });

  describe('Task 2: Technical Notes Rendering', () => {
    it('should render technical notes when present', () => {
      const context = createContext({
        scene: createMockScene({
          technicalNotes: [
            { content: 'This is a technical explanation.' },
          ],
        }),
      });
      renderer.renderScene(context, container);

      const technicalNote = container.querySelector('.da-technical-note');
      expect(technicalNote).not.toBeNull();
    });
  });

  describe('Task 2: Choice Rendering', () => {
    it('should render choice cards when present', () => {
      const context = createContext({
        scene: createMockScene({
          type: 'choice',
          choices: [
            { id: 'choice-1', icon: '🔧', title: 'Option A', description: 'Do A' },
            { id: 'choice-2', icon: '⚙️', title: 'Option B', description: 'Do B' },
          ],
        }),
      });
      renderer.renderScene(context, container);

      const choiceCards = container.querySelectorAll('.da-choice-card');
      expect(choiceCards.length).toBe(2);
    });

    it('should call onChoiceSelect callback when choice clicked', () => {
      const onChoiceSelect = vi.fn();
      renderer.setCallbacks({ onChoiceSelect });

      const context = createContext({
        scene: createMockScene({
          type: 'choice',
          choices: [
            { id: 'choice-1', icon: '🔧', title: 'Option A', description: 'Do A' },
          ],
        }),
      });
      renderer.renderScene(context, container);

      const choiceCard = container.querySelector('.da-choice-card') as HTMLButtonElement;
      choiceCard?.click();

      expect(onChoiceSelect).toHaveBeenCalledWith('choice-1');
    });
  });

  describe('Task 2: Challenge Scene Rendering', () => {
    it('should render Enter Lab button for challenge scenes', () => {
      const context = createContext({
        scene: createMockScene({
          type: 'challenge',
          challenge: {
            title: 'Test Challenge',
            objectives: [],
          },
        }),
      });
      renderer.renderScene(context, container);

      const enterLabButton = container.querySelector('.da-enter-lab-button');
      expect(enterLabButton).not.toBeNull();
    });

    it('should not render Enter Lab button for non-challenge scenes', () => {
      const context = createContext({
        scene: createMockScene({ type: 'narrative' }),
      });
      renderer.renderScene(context, container);

      const enterLabButton = container.querySelector('.da-enter-lab-button');
      expect(enterLabButton).toBeNull();
    });
  });

  describe('Task 4: Footer Rendering', () => {
    it('should render story actions footer', () => {
      const context = createContext();
      renderer.renderScene(context, container);

      const footer = container.querySelector('.da-story-actions-footer');
      expect(footer).not.toBeNull();
    });

    it('should call onContinue when continue button clicked', () => {
      const onContinue = vi.fn();
      renderer.setCallbacks({ onContinue });

      const context = createContext({
        scene: createMockScene({ nextScene: 'scene-1-1-2' }),
      });
      renderer.renderScene(context, container);

      const continueButton = container.querySelector('.da-story-action-btn--primary') as HTMLButtonElement;
      continueButton?.click();

      expect(onContinue).toHaveBeenCalled();
    });

    it('should call onPrevious when previous button clicked', () => {
      const onPrevious = vi.fn();
      renderer.setCallbacks({ onPrevious });

      const context = createContext();
      renderer.renderScene(context, container);

      const previousButton = container.querySelector('.da-story-action-btn:not(.da-story-action-btn--primary):not(.da-story-action-btn--lab)') as HTMLButtonElement;
      previousButton?.click();

      expect(onPrevious).toHaveBeenCalled();
    });

    it('should disable continue when no nextScene and no choices', () => {
      const context = createContext({
        scene: createMockScene({ nextScene: undefined, choices: undefined }),
      });
      renderer.renderScene(context, container);

      const continueButton = container.querySelector('.da-story-action-btn--primary') as HTMLButtonElement;
      expect(continueButton?.disabled).toBe(true);
    });

    it('should disable continue when choices are present', () => {
      const context = createContext({
        scene: createMockScene({
          type: 'choice',
          nextScene: 'scene-1-1-2',
          choices: [{ id: 'c1', icon: '🔧', title: 'A', description: 'B' }],
        }),
      });
      renderer.renderScene(context, container);

      const continueButton = container.querySelector('.da-story-action-btn--primary') as HTMLButtonElement;
      expect(continueButton?.disabled).toBe(true);
    });
  });

  describe('Component Cleanup', () => {
    it('should clear container on destroy', () => {
      const context = createContext();
      renderer.renderScene(context, container);

      expect(container.children.length).toBeGreaterThan(0);

      renderer.destroy();

      expect(container.children.length).toBe(0);
    });

    it('should clear container between scene renders', () => {
      const context1 = createContext({
        scene: createMockScene({ narrative: ['Scene 1'] }),
      });
      renderer.renderScene(context1, container);

      const firstNarrative = container.querySelector('.da-scene-narrative-text');
      expect(firstNarrative?.textContent).toBe('Scene 1');

      const context2 = createContext({
        scene: createMockScene({ narrative: ['Scene 2'] }),
      });
      renderer.renderScene(context2, container);

      const allNarratives = container.querySelectorAll('.da-scene-narrative-text');
      expect(allNarratives.length).toBe(1);
      expect(allNarratives[0].textContent).toBe('Scene 2');
    });
  });
});
