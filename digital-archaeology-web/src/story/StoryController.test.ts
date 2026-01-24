// src/story/StoryController.test.ts
// Tests for StoryController
// Story 10.17: Wire Story Mode Integration

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StoryController } from './StoryController';

// Mock data for story loading - index-based structure
const createMockStoryIndex = () => ({
  version: '1.0.0',
  metadata: {
    title: 'Test Story',
    author: 'Test Author',
    lastUpdated: '2026-01-01',
  },
  actIndex: [{ number: 1, file: 'act-1.json' }],
});

const createMockAct = () => ({
  id: 'act-1',
  number: 1,
  title: 'Test Act 1',
  description: 'Test description',
  era: '1971',
  cpuStage: 'micro4',
  chapters: [
    {
      id: 'chapter-1-1',
      number: 1,
      title: 'Test Chapter 1',
      subtitle: 'Test subtitle',
      year: '1971',
      scenes: [
        {
          id: 'scene-1-1-1',
          type: 'narrative',
          narrative: ['First scene'],
          nextScene: 'scene-1-1-2',
        },
        {
          id: 'scene-1-1-2',
          type: 'dialogue',
          dialogues: [{ speaker: 'Test', text: 'Hello' }],
          nextScene: 'scene-1-1-3',
        },
        {
          id: 'scene-1-1-3',
          type: 'choice',
          choices: [
            { id: 'choice-1', icon: '🔧', title: 'A', description: 'Do A' },
            { id: 'choice-2', icon: '⚙️', title: 'B', description: 'Do B' },
          ],
          nextScene: 'scene-1-1-4',
        },
        {
          id: 'scene-1-1-4',
          type: 'challenge',
          challenge: { title: 'Test Challenge', objectives: [] },
        },
      ],
    },
  ],
});

describe('StoryController', () => {
  let controller: StoryController;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    // Mock fetch - index-based loading: first call returns index, second returns act
    const mockIndex = createMockStoryIndex();
    const mockAct = createMockAct();
    let callCount = 0;

    vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // First call: return index
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockIndex),
        } as Response);
      } else {
        // Subsequent calls: return act
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAct),
        } as Response);
      }
    });

    // Clear localStorage
    localStorage.clear();

    controller = new StoryController();
  });

  afterEach(() => {
    controller.destroy();
    container.remove();
    vi.restoreAllMocks();
  });

  describe('Task 1: Initialization', () => {
    it('should initialize and load content', async () => {
      await controller.initialize();

      expect(controller.getCurrentScene()).not.toBeNull();
    });

    it('should start at first scene on new game', async () => {
      await controller.initialize();

      const scene = controller.getCurrentScene();
      expect(scene?.id).toBe('scene-1-1-1');
    });

    it('should fetch story content from JSON', async () => {
      await controller.initialize();

      expect(fetch).toHaveBeenCalledWith('/story/story-content.json');
    });

    it('should only initialize once', async () => {
      await controller.initialize();
      await controller.initialize();

      // 2 calls for first init (index + act), but no additional calls for second init
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Task 1: Progress Management', () => {
    it('should return current progress', async () => {
      await controller.initialize();

      const progress = controller.getProgress();
      expect(progress).not.toBeNull();
      expect(progress?.position.sceneId).toBe('scene-1-1-1');
    });

    it('should get era for act', async () => {
      await controller.initialize();

      const era = controller.getEraForAct(1);
      expect(era).toBe('1971');
    });

    it('should return Unknown for invalid act', async () => {
      await controller.initialize();

      const era = controller.getEraForAct(999);
      expect(era).toBe('Unknown');
    });
  });

  describe('Task 3: Navigation - Next Scene', () => {
    it('should navigate to next scene', async () => {
      await controller.initialize();

      expect(controller.getCurrentScene()?.id).toBe('scene-1-1-1');

      controller.nextScene();

      expect(controller.getCurrentScene()?.id).toBe('scene-1-1-2');
    });

    it('should hasNextScene return true when next scene exists', async () => {
      await controller.initialize();

      expect(controller.hasNextScene()).toBe(true);
    });

    it('should hasNextScene return false at end of content', async () => {
      await controller.initialize();

      // Navigate to last scene
      controller.nextScene(); // -> scene-1-1-2
      controller.nextScene(); // -> scene-1-1-3
      controller.nextScene(); // -> scene-1-1-4

      expect(controller.hasNextScene()).toBe(false);
    });
  });

  describe('Task 3: Navigation - Previous Scene', () => {
    it('should navigate to previous scene', async () => {
      await controller.initialize();

      controller.nextScene(); // -> scene-1-1-2
      expect(controller.getCurrentScene()?.id).toBe('scene-1-1-2');

      controller.previousScene();
      expect(controller.getCurrentScene()?.id).toBe('scene-1-1-1');
    });

    it('should hasPreviousScene return false at start', async () => {
      await controller.initialize();

      expect(controller.hasPreviousScene()).toBe(false);
    });

    it('should hasPreviousScene return true after navigation', async () => {
      await controller.initialize();

      controller.nextScene();

      expect(controller.hasPreviousScene()).toBe(true);
    });
  });

  describe('Task 5: Choice Selection', () => {
    it('should record choice and navigate', async () => {
      await controller.initialize();

      // Navigate to choice scene
      controller.nextScene(); // -> scene-1-1-2
      controller.nextScene(); // -> scene-1-1-3

      controller.selectChoice('choice-1');

      // Should have recorded choice and navigated
      const progress = controller.getProgress();
      expect(progress?.choices.length).toBe(1);
      expect(progress?.choices[0].choiceId).toBe('choice-1');
    });
  });

  describe('Task 6: Start New Game', () => {
    it('should reset progress on startNewGame', async () => {
      await controller.initialize();

      controller.nextScene();
      controller.nextScene();

      controller.startNewGame();

      expect(controller.getCurrentScene()?.id).toBe('scene-1-1-1');
    });
  });

  describe('Task 8: Role Data', () => {
    it('should return role data based on progress', async () => {
      await controller.initialize();

      // Wait for state to settle (engine starts new game which triggers state change)
      await new Promise(resolve => setTimeout(resolve, 10));

      const roleData = controller.getRoleData();

      expect(roleData).not.toBeNull();
      expect(roleData?.era).toBe('1971');
      expect(roleData?.experience).toBe('Novice');
    });

    it('should update experience based on progress', async () => {
      await controller.initialize();

      // Make some progress
      controller.nextScene();
      controller.nextScene();
      controller.selectChoice('choice-1');

      const roleData = controller.getRoleData();
      expect(roleData?.experience).toBeDefined();
    });
  });

  describe('Task 6: Render Container', () => {
    it('should set render container', async () => {
      await controller.initialize();
      controller.setRenderContainer(container);

      // Should render current scene
      const sceneContainer = container.querySelector('.da-scene-container');
      expect(sceneContainer).not.toBeNull();
    });

    it('should update render on navigation', async () => {
      await controller.initialize();
      controller.setRenderContainer(container);

      controller.nextScene();

      // Should have rendered new scene
      const dialogueBlock = container.querySelector('.da-dialogue-block');
      expect(dialogueBlock).not.toBeNull();
    });
  });

  describe('Callbacks', () => {
    it('should call onEnterLab callback', async () => {
      const onEnterLab = vi.fn();
      controller.setCallbacks({ onEnterLab });

      await controller.initialize();
      controller.setRenderContainer(container);

      // Navigate to challenge scene
      controller.nextScene(); // -> scene-1-1-2
      controller.nextScene(); // -> scene-1-1-3
      controller.nextScene(); // -> scene-1-1-4

      // Click Enter Lab button
      const enterLabButton = container.querySelector('.da-enter-lab-button') as HTMLButtonElement;
      enterLabButton?.click();

      expect(onEnterLab).toHaveBeenCalled();
    });

    it('should call onRoleUpdate callback on navigation', async () => {
      const onRoleUpdate = vi.fn();
      controller.setCallbacks({ onRoleUpdate });

      await controller.initialize();
      controller.setRenderContainer(container);

      controller.nextScene();

      expect(onRoleUpdate).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should clean up on destroy', async () => {
      await controller.initialize();
      controller.setRenderContainer(container);

      controller.destroy();

      expect(container.querySelector('.da-scene-container')).toBeNull();
    });

    it('should remove event listeners on destroy', async () => {
      await controller.initialize();

      // Capture the listener
      const addEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      controller.destroy();

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'story-state-changed',
        expect.any(Function)
      );
    });
  });
});
