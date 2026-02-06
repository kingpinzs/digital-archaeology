// src/story/StoryController.test.ts
// Tests for StoryController
// Story 10.17: Wire Story Mode Integration

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StoryController } from './StoryController';
import { DISCOVERER_COMPLETE_KEY } from './StoryStorage';

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

// TD-1: Mock act with branching choice data
const createMockBranchingAct = () => ({
  id: 'act-1',
  number: 1,
  title: 'Branching Act',
  description: 'Act with branching choices',
  era: '1971',
  cpuStage: 'micro4',
  chapters: [
    {
      id: 'chapter-1-1',
      number: 1,
      title: 'Branching Chapter',
      subtitle: 'Branch test',
      year: '1971',
      scenes: [
        {
          id: 'scene-1-1-1',
          type: 'narrative',
          narrative: ['Start scene'],
          nextScene: 'scene-1-1-2',
        },
        {
          id: 'scene-1-1-2',
          type: 'choice',
          choices: [
            { id: 'choice-a', icon: '🔧', title: 'Path A', description: 'Go to branch A', nextScene: 'scene-1-1-3a' },
            { id: 'choice-b', icon: '⚙️', title: 'Path B', description: 'Go to branch B', nextScene: 'scene-1-1-3b' },
            { id: 'choice-no-branch', icon: '📦', title: 'Fallback', description: 'No nextScene' },
          ],
          nextScene: 'scene-1-1-fallback',
        },
        {
          id: 'scene-1-1-3a',
          type: 'narrative',
          narrative: ['Branch A content'],
          nextScene: 'scene-1-1-4',
        },
        {
          id: 'scene-1-1-3b',
          type: 'narrative',
          narrative: ['Branch B content'],
          nextScene: 'scene-1-1-4',
        },
        {
          id: 'scene-1-1-fallback',
          type: 'narrative',
          narrative: ['Fallback scene'],
          nextScene: 'scene-1-1-4',
        },
        {
          id: 'scene-1-1-4',
          type: 'narrative',
          narrative: ['Convergence scene — both branches lead here'],
        },
      ],
    },
  ],
});

const createMockDiscovererData = () => ({
  welcome: { headline: 'Test headline', subtext: 'Test subtext' },
  era: { year: 1971, location: 'Test', framing: 'Test framing' },
  persona: { id: 'test', name: 'Test', years: '1941', era: '1971', avatar: '🔬', background: 'Test', motivation: 'Test', problem: 'Test problem', quote: 'Test', constraints: [] },
  constraint: { headline: 'Test constraint', resources: ['a', 'b'], challenge: 'Test challenge' },
  decision: { id: 'test-dec', question: 'Test?', context: 'Test', options: [{ id: 'opt1', description: 'Opt 1', visiblePros: ['Pro'], visibleCons: ['Con'], isHistorical: true }], historicalChoice: 'opt1', historicalOutcome: 'Test', alternateOutcomes: [] },
  builder: { title: 'Test', description: 'Test', decisionId: 'test-dec', objectives: [{ id: 'obj1', text: 'Test obj', completed: false }] },
  celebration: { headline: 'IT WORKS!', lines: ['Line 1'], journeyButton: 'Journey', labButton: 'Lab' },
  mindset: { year: 1971, knownTechnology: [], unknownTechnology: [], activeProblems: [], constraints: [], impossibilities: [], historicalPerspective: { currentKnowledge: 'Test', futureBlind: 'Test' } },
});

function setupDiscovererFetchMock(mockDiscovererData: ReturnType<typeof createMockDiscovererData>): void {
  const mockIndex = createMockStoryIndex();
  const mockAct = createMockAct();
  let callCount = 0;
  vi.restoreAllMocks();
  vi.spyOn(globalThis, 'fetch').mockImplementation((url: string | URL | Request) => {
    const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.href : url.url;
    if (urlStr.includes('discoverer-intro')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockDiscovererData) } as Response);
    }
    callCount++;
    if (callCount === 1) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockIndex) } as Response);
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve(mockAct) } as Response);
  });
}

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

    // Mark discoverer intro as complete for existing tests (returning user).
    // The 10.23 describe block manages this flag explicitly.
    localStorage.setItem(DISCOVERER_COMPLETE_KEY, 'true');

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

  describe('TD-1: Choice Branching', () => {
    let branchController: StoryController;

    beforeEach(() => {
      // Override fetch mock with branching act data
      const mockIndex = createMockStoryIndex();
      const mockBranchAct = createMockBranchingAct();
      let callCount = 0;

      vi.restoreAllMocks();
      vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(mockIndex) } as Response);
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockBranchAct) } as Response);
      });

      localStorage.clear();
      localStorage.setItem(DISCOVERER_COMPLETE_KEY, 'true');
      branchController = new StoryController();
    });

    afterEach(() => {
      branchController.destroy();
      vi.restoreAllMocks();
    });

    it('should navigate to choice.nextScene when choice has nextScene (5.1)', async () => {
      await branchController.initialize();
      branchController.nextScene(); // -> scene-1-1-2 (choice scene)

      branchController.selectChoice('choice-a');

      expect(branchController.getCurrentScene()?.id).toBe('scene-1-1-3a');
    });

    it('should navigate to different scene when different choice selected (5.2)', async () => {
      await branchController.initialize();
      branchController.nextScene(); // -> scene-1-1-2 (choice scene)

      branchController.selectChoice('choice-b');

      expect(branchController.getCurrentScene()?.id).toBe('scene-1-1-3b');
    });

    it('should fall back to scene.nextScene when choice has no nextScene (5.3)', async () => {
      await branchController.initialize();
      branchController.nextScene(); // -> scene-1-1-2 (choice scene)

      branchController.selectChoice('choice-no-branch');

      expect(branchController.getCurrentScene()?.id).toBe('scene-1-1-fallback');
    });

    it('should warn and return early when invalid choiceId is selected (5.4)', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      await branchController.initialize();
      branchController.nextScene(); // -> scene-1-1-2 (choice scene)

      branchController.selectChoice('choice-nonexistent');

      // Should warn about missing choice and stay on current scene
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('choice-nonexistent')
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('not found')
      );
      // Should stay on choice scene (early return, no navigation)
      expect(branchController.getCurrentScene()?.id).toBe('scene-1-1-2');
      warnSpy.mockRestore();
    });

    it('should support back navigation after branching (5.5)', async () => {
      await branchController.initialize();
      branchController.nextScene(); // -> scene-1-1-2 (choice scene)

      branchController.selectChoice('choice-a'); // -> scene-1-1-3a
      expect(branchController.getCurrentScene()?.id).toBe('scene-1-1-3a');

      branchController.previousScene(); // <- back to scene-1-1-2
      expect(branchController.getCurrentScene()?.id).toBe('scene-1-1-2');
    });

    it('should support branch convergence — both branches lead to same scene (5.6)', async () => {
      await branchController.initialize();
      branchController.nextScene(); // -> scene-1-1-2 (choice scene)

      // Branch A path to convergence
      branchController.selectChoice('choice-a'); // -> scene-1-1-3a
      expect(branchController.getCurrentScene()?.id).toBe('scene-1-1-3a');
      branchController.nextScene(); // -> scene-1-1-4 (convergence)
      const convergenceA = branchController.getCurrentScene()?.id;
      expect(convergenceA).toBe('scene-1-1-4');

      // Back-navigate to choice scene and take Branch B
      branchController.previousScene(); // <- scene-1-1-3a
      branchController.previousScene(); // <- scene-1-1-2 (choice scene)
      expect(branchController.getCurrentScene()?.id).toBe('scene-1-1-2');

      branchController.selectChoice('choice-b'); // -> scene-1-1-3b
      expect(branchController.getCurrentScene()?.id).toBe('scene-1-1-3b');
      branchController.nextScene(); // -> scene-1-1-4 (same convergence)
      const convergenceB = branchController.getCurrentScene()?.id;

      // Both branches converge to same scene
      expect(convergenceB).toBe(convergenceA);
    });

    it('should preserve recordChoice data correctly (5.7)', async () => {
      await branchController.initialize();
      branchController.nextScene(); // -> scene-1-1-2 (choice scene)

      branchController.selectChoice('choice-a');

      const progress = branchController.getProgress();
      expect(progress?.choices.length).toBe(1);
      expect(progress?.choices[0].choiceId).toBe('choice-a');
      expect(progress?.choices[0].sceneId).toBe('scene-1-1-2');
    });

    it('should handle choice.nextScene referencing non-existent scene gracefully', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      await branchController.initialize();
      branchController.nextScene(); // -> scene-1-1-2 (choice scene)

      // Manually inject a bad nextScene into the choice data at runtime
      const scene = branchController.getCurrentScene();
      const badChoice = scene?.choices?.find(c => c.id === 'choice-a');
      if (badChoice) {
        (badChoice as { nextScene?: string }).nextScene = 'scene-does-not-exist';
      }

      branchController.selectChoice('choice-a');

      // goToScene throws "Scene not found", caught by outer catch
      expect(warnSpy).toHaveBeenCalledWith(
        'Cannot process choice:',
        expect.any(Error)
      );
      warnSpy.mockRestore();
    });

    it('should fall back silently when choice without nextScene is selected (no console noise)', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      await branchController.initialize();
      branchController.nextScene(); // -> scene-1-1-2 (choice scene)

      // choice-no-branch exists but has no nextScene — should fall back without warning
      branchController.selectChoice('choice-no-branch');

      expect(branchController.getCurrentScene()?.id).toBe('scene-1-1-fallback');
      // Should NOT have logged a warning (silent fallback for known choices)
      const relevantCalls = warnSpy.mock.calls.filter(
        call => typeof call[0] === 'string' && call[0].includes('choice-no-branch')
      );
      expect(relevantCalls.length).toBe(0);
      warnSpy.mockRestore();
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

  describe('Story 10.23: Discoverer Experience Integration', () => {
    // These tests need first-time user state (no discoverer flag)
    beforeEach(() => {
      localStorage.removeItem(DISCOVERER_COMPLETE_KEY);
    });

    it('should detect first-time user when no progress and no completion flag', async () => {
      await controller.initialize();
      expect(controller.isFirstTimeUser()).toBe(true);
    });

    it('should not detect first-time user when discoverer is complete', async () => {
      localStorage.setItem(DISCOVERER_COMPLETE_KEY, 'true');
      await controller.initialize();
      expect(controller.isFirstTimeUser()).toBe(false);
    });

    it('should not detect first-time user when progress exists', async () => {
      // Mark discoverer complete so skipDiscovererIntro flow works
      localStorage.setItem(DISCOVERER_COMPLETE_KEY, 'true');
      await controller.initialize();
      // Navigate to create progress
      controller.nextScene();
      // Create a new controller to test
      controller.destroy();
      // Clear discoverer flag but keep progress
      localStorage.removeItem(DISCOVERER_COMPLETE_KEY);
      controller = new StoryController();
      // Re-mock fetch for new controller
      const mockIndex = createMockStoryIndex();
      const mockAct = createMockAct();
      let callCount = 0;
      vi.restoreAllMocks();
      vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(mockIndex) } as Response);
        } else {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(mockAct) } as Response);
        }
      });
      await controller.initialize();
      expect(controller.isFirstTimeUser()).toBe(false);
    });

    it('should not start story engine for first-time user on initialize', async () => {
      await controller.initialize();
      // First-time user: engine initialized but not started, no current scene
      expect(controller.isFirstTimeUser()).toBe(true);
      // getCurrentScene returns null because engine hasn't started yet
      expect(controller.getCurrentScene()).toBeNull();
    });

    it('should show discoverer experience for first-time user', async () => {
      const mockDiscovererData = createMockDiscovererData();
      setupDiscovererFetchMock(mockDiscovererData);

      await controller.initialize();
      expect(controller.isFirstTimeUser()).toBe(true);
      await controller.showDiscovererExperience(container);
      expect(controller.isDiscovererActive()).toBe(true);
      expect(container.querySelector('.da-discoverer-experience')).not.toBeNull();
    });

    it('should mark discoverer complete and start story on skipDiscovererIntro', async () => {
      await controller.initialize();
      controller.skipDiscovererIntro();
      expect(localStorage.getItem(DISCOVERER_COMPLETE_KEY)).toBe('true');
      expect(controller.isDiscovererActive()).toBe(false);
      expect(controller.getCurrentScene()).not.toBeNull();
    });

    it('should clean up discoverer experience on destroy', async () => {
      const mockDiscovererData = createMockDiscovererData();

      setupDiscovererFetchMock(mockDiscovererData);

      await controller.initialize();
      await controller.showDiscovererExperience(container);
      expect(controller.isDiscovererActive()).toBe(true);
      controller.destroy();
      expect(controller.isDiscovererActive()).toBe(false);
    });

    it('should recover from discoverer mount failure and start normal story', async () => {
      // Mock fetch to fail on discoverer-intro.json but succeed on story data
      const mockIndex = createMockStoryIndex();
      const mockAct = createMockAct();
      let callCount = 0;
      vi.restoreAllMocks();
      vi.spyOn(globalThis, 'fetch').mockImplementation((url: string | URL | Request) => {
        const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.href : url.url;
        if (urlStr.includes('discoverer-intro')) {
          return Promise.resolve({ ok: false, status: 500, statusText: 'Internal Server Error' } as Response);
        }
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(mockIndex) } as Response);
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockAct) } as Response);
      });

      await controller.initialize();
      expect(controller.isFirstTimeUser()).toBe(true);
      await controller.showDiscovererExperience(container);
      // Should have cleaned up and fallen through to normal story
      expect(controller.isDiscovererActive()).toBe(false);
      expect(controller.getCurrentScene()).not.toBeNull();
    });

    it('should start story for returning user on initialize', async () => {
      localStorage.setItem(DISCOVERER_COMPLETE_KEY, 'true');
      await controller.initialize();
      expect(controller.isFirstTimeUser()).toBe(false);
      expect(controller.getCurrentScene()).not.toBeNull();
    });
  });
});
