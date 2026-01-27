// src/story/StoryEngine.test.ts
// Tests for StoryEngine and StoryStorage
// Story 10.15: Create Story Progression Engine
// Story 10.18: Create Historical Personas System

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StoryEngine } from './StoryEngine';
import { StoryStorage, STORY_STORAGE_KEY } from './StoryStorage';
import type { StoryAct } from './content-types';
import type { StoryProgress } from './StoryState';
import type { PersonaData } from './types';
import { createDefaultProgress } from './StoryState';

// Factory function for creating valid test acts
const createTestActs = (): StoryAct[] => [
  {
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
        title: 'Test Chapter',
        subtitle: 'Test Subtitle',
        year: '1971',
        scenes: [
          {
            id: 'scene-1-1-1',
            type: 'narrative',
            narrative: ['Test narrative'],
            nextScene: 'scene-1-1-2',
          },
          {
            id: 'scene-1-1-2',
            type: 'dialogue',
            nextScene: 'scene-1-1-3',
          },
          {
            id: 'scene-1-1-3',
            type: 'choice',
            // No nextScene - end of chapter
          },
        ],
      },
    ],
  },
];

const createTestProgress = (): StoryProgress => ({
  position: {
    actNumber: 1,
    chapterNumber: 1,
    sceneId: 'scene-1-1-1',
  },
  choices: [],
  discoveredItems: [],
  startedAt: Date.now(),
  lastPlayedAt: Date.now(),
});

describe('StoryEngine', () => {
  let engine: StoryEngine;
  let mockStorage: StoryStorage;

  beforeEach(() => {
    // Create mock storage
    mockStorage = {
      saveProgress: vi.fn(),
      loadProgress: vi.fn().mockReturnValue(null),
      clearProgress: vi.fn(),
      hasProgress: vi.fn().mockReturnValue(false),
    } as unknown as StoryStorage;

    engine = new StoryEngine(mockStorage);
    engine.initialize(createTestActs());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with acts and build scene index', () => {
      const scene = engine.getSceneById('scene-1-1-1');
      expect(scene).not.toBeNull();
      expect(scene?.id).toBe('scene-1-1-1');
    });

    it('should return null for non-existent scene', () => {
      const scene = engine.getSceneById('non-existent');
      expect(scene).toBeNull();
    });
  });

  describe('getCurrentScene', () => {
    it('should return null when no progress exists', () => {
      expect(engine.getCurrentScene()).toBeNull();
    });

    it('should return current scene after navigation', () => {
      engine.goToScene('scene-1-1-1');
      const scene = engine.getCurrentScene();
      expect(scene).not.toBeNull();
      expect(scene?.id).toBe('scene-1-1-1');
    });
  });

  describe('goToScene', () => {
    it('should update current position', () => {
      engine.goToScene('scene-1-1-2');
      const progress = engine.getProgress();

      expect(progress).not.toBeNull();
      expect(progress?.position.sceneId).toBe('scene-1-1-2');
      expect(progress?.position.actNumber).toBe(1);
      expect(progress?.position.chapterNumber).toBe(1);
    });

    it('should throw error for non-existent scene', () => {
      expect(() => engine.goToScene('non-existent')).toThrow('Scene not found');
    });

    it('should throw error when not initialized', () => {
      const uninitializedEngine = new StoryEngine(mockStorage);
      expect(() => uninitializedEngine.goToScene('scene-1-1-1')).toThrow('Engine not initialized');
    });

    it('should save progress after navigation', () => {
      engine.goToScene('scene-1-1-1');
      expect(mockStorage.saveProgress).toHaveBeenCalled();
    });
  });

  describe('nextScene', () => {
    it('should follow scene.nextScene property', () => {
      engine.goToScene('scene-1-1-1');
      engine.nextScene();

      const progress = engine.getProgress();
      expect(progress?.position.sceneId).toBe('scene-1-1-2');
    });

    it('should throw error when no nextScene defined', () => {
      engine.goToScene('scene-1-1-3');
      expect(() => engine.nextScene()).toThrow('No next scene defined');
    });

    it('should throw error when no current scene', () => {
      expect(() => engine.nextScene()).toThrow('No current scene');
    });
  });

  describe('previousScene', () => {
    it('should navigate to previous scene from history', () => {
      engine.goToScene('scene-1-1-1');
      engine.goToScene('scene-1-1-2');
      engine.previousScene();

      const progress = engine.getProgress();
      expect(progress?.position.sceneId).toBe('scene-1-1-1');
    });

    it('should throw error when no history', () => {
      engine.goToScene('scene-1-1-1');
      expect(() => engine.previousScene()).toThrow('No previous scene in history');
    });
  });

  describe('recordChoice', () => {
    it('should store choice in choices array', () => {
      engine.goToScene('scene-1-1-3');
      engine.recordChoice('choice-1');

      const progress = engine.getProgress();
      expect(progress?.choices).toHaveLength(1);
      expect(progress?.choices[0].choiceId).toBe('choice-1');
      expect(progress?.choices[0].sceneId).toBe('scene-1-1-3');
    });

    it('should throw error when no active progress', () => {
      expect(() => engine.recordChoice('choice-1')).toThrow('No active progress');
    });

    it('should save progress after recording choice', () => {
      engine.goToScene('scene-1-1-1');
      vi.mocked(mockStorage.saveProgress).mockClear();
      engine.recordChoice('choice-1');
      expect(mockStorage.saveProgress).toHaveBeenCalled();
    });
  });

  describe('getProgress', () => {
    it('should return null when no progress', () => {
      expect(engine.getProgress()).toBeNull();
    });

    it('should return current progress', () => {
      engine.goToScene('scene-1-1-1');
      const progress = engine.getProgress();

      expect(progress).not.toBeNull();
      expect(progress?.position.sceneId).toBe('scene-1-1-1');
    });
  });

  describe('startNewGame', () => {
    it('should start at first scene', () => {
      engine.startNewGame();
      const progress = engine.getProgress();

      expect(progress?.position.sceneId).toBe('scene-1-1-1');
      expect(progress?.position.actNumber).toBe(1);
      expect(progress?.position.chapterNumber).toBe(1);
    });

    it('should clear history', () => {
      engine.goToScene('scene-1-1-1');
      engine.goToScene('scene-1-1-2');
      engine.startNewGame();

      // Should have no history after startNewGame
      expect(() => engine.previousScene()).toThrow('No previous scene in history');
    });
  });

  describe('resume', () => {
    it('should restore saved progress', () => {
      const savedProgress = createTestProgress();
      savedProgress.position.sceneId = 'scene-1-1-2';
      vi.mocked(mockStorage.loadProgress).mockReturnValue(savedProgress);

      const resumed = engine.resume();

      expect(resumed).toBe(true);
      expect(engine.getProgress()?.position.sceneId).toBe('scene-1-1-2');
    });

    it('should start new game when no saved progress', () => {
      vi.mocked(mockStorage.loadProgress).mockReturnValue(null);

      const resumed = engine.resume();

      expect(resumed).toBe(false);
      expect(engine.getProgress()?.position.sceneId).toBe('scene-1-1-1');
    });

    it('should start new game when saved scene does not exist', () => {
      const savedProgress = createTestProgress();
      savedProgress.position.sceneId = 'deleted-scene';
      vi.mocked(mockStorage.loadProgress).mockReturnValue(savedProgress);

      const resumed = engine.resume();

      expect(resumed).toBe(false);
      expect(engine.getProgress()?.position.sceneId).toBe('scene-1-1-1');
    });
  });

  describe('clearProgress', () => {
    it('should clear progress and storage', () => {
      engine.goToScene('scene-1-1-1');
      engine.clearProgress();

      expect(engine.getProgress()).toBeNull();
      expect(mockStorage.clearProgress).toHaveBeenCalled();
    });
  });

  describe('addDiscoveredItem', () => {
    it('should add item to discovered items', () => {
      engine.goToScene('scene-1-1-1');
      engine.addDiscoveredItem('and-gate');

      const progress = engine.getProgress();
      expect(progress?.discoveredItems).toContain('and-gate');
    });

    it('should not add duplicate items', () => {
      engine.goToScene('scene-1-1-1');
      engine.addDiscoveredItem('and-gate');
      engine.addDiscoveredItem('and-gate');

      const progress = engine.getProgress();
      expect(progress?.discoveredItems.filter((i) => i === 'and-gate')).toHaveLength(1);
    });
  });

  describe('getFirstScene', () => {
    it('should return first scene', () => {
      const scene = engine.getFirstScene();
      expect(scene?.id).toBe('scene-1-1-1');
    });
  });

  describe('event dispatch', () => {
    it('should dispatch story-state-changed event on navigation', () => {
      const listener = vi.fn();
      window.addEventListener('story-state-changed', listener);

      engine.goToScene('scene-1-1-1');

      expect(listener).toHaveBeenCalled();
      const event = listener.mock.calls[0][0] as CustomEvent;
      expect(event.detail.progress.position.sceneId).toBe('scene-1-1-1');

      window.removeEventListener('story-state-changed', listener);
    });

    it('should include previousSceneId in event', () => {
      engine.goToScene('scene-1-1-1');

      const listener = vi.fn();
      window.addEventListener('story-state-changed', listener);

      engine.goToScene('scene-1-1-2');

      const event = listener.mock.calls[0][0] as CustomEvent;
      expect(event.detail.previousSceneId).toBe('scene-1-1-1');

      window.removeEventListener('story-state-changed', listener);
    });

    it('should dispatch event with null progress when clearProgress is called', () => {
      engine.goToScene('scene-1-1-1');

      const listener = vi.fn();
      window.addEventListener('story-state-changed', listener);

      engine.clearProgress();

      expect(listener).toHaveBeenCalled();
      const event = listener.mock.calls[0][0] as CustomEvent;
      expect(event.detail.progress).toBeNull();

      window.removeEventListener('story-state-changed', listener);
    });
  });

  describe('getState', () => {
    it('should return current engine state', () => {
      const state = engine.getState();

      expect(state).toHaveProperty('progress');
      expect(state).toHaveProperty('isLoading');
      expect(state).toHaveProperty('error');
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should return state with progress after navigation', () => {
      engine.goToScene('scene-1-1-1');
      const state = engine.getState();

      expect(state.progress).not.toBeNull();
      expect(state.progress?.position.sceneId).toBe('scene-1-1-1');
    });
  });
});

describe('StoryStorage', () => {
  let storage: StoryStorage;
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    mockLocalStorage = {};
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => mockLocalStorage[key] ?? null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      mockLocalStorage[key] = value;
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key) => {
      delete mockLocalStorage[key];
    });

    storage = new StoryStorage();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('saveProgress', () => {
    it('should persist to localStorage', () => {
      const progress = createTestProgress();
      storage.saveProgress(progress);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        STORY_STORAGE_KEY,
        JSON.stringify(progress)
      );
    });
  });

  describe('loadProgress', () => {
    it('should restore from localStorage', () => {
      const progress = createTestProgress();
      mockLocalStorage[STORY_STORAGE_KEY] = JSON.stringify(progress);

      const loaded = storage.loadProgress();

      expect(loaded).not.toBeNull();
      expect(loaded?.position.sceneId).toBe(progress.position.sceneId);
    });

    it('should return null when no data', () => {
      const loaded = storage.loadProgress();
      expect(loaded).toBeNull();
    });

    it('should return null for invalid data', () => {
      mockLocalStorage[STORY_STORAGE_KEY] = JSON.stringify({ invalid: 'data' });

      const loaded = storage.loadProgress();
      expect(loaded).toBeNull();
    });

    it('should return null for invalid JSON', () => {
      mockLocalStorage[STORY_STORAGE_KEY] = 'not valid json';

      const loaded = storage.loadProgress();
      expect(loaded).toBeNull();
    });
  });

  describe('clearProgress', () => {
    it('should remove from localStorage', () => {
      mockLocalStorage[STORY_STORAGE_KEY] = JSON.stringify(createTestProgress());
      storage.clearProgress();

      expect(localStorage.removeItem).toHaveBeenCalledWith(STORY_STORAGE_KEY);
    });
  });

  describe('hasProgress', () => {
    it('should return true when progress exists', () => {
      mockLocalStorage[STORY_STORAGE_KEY] = JSON.stringify(createTestProgress());
      expect(storage.hasProgress()).toBe(true);
    });

    it('should return false when no progress', () => {
      expect(storage.hasProgress()).toBe(false);
    });
  });
});

describe('StoryState', () => {
  describe('createDefaultProgress', () => {
    it('should create progress with correct scene ID', () => {
      const progress = createDefaultProgress('test-scene');

      expect(progress.position.sceneId).toBe('test-scene');
      expect(progress.position.actNumber).toBe(1);
      expect(progress.position.chapterNumber).toBe(1);
    });

    it('should initialize empty arrays', () => {
      const progress = createDefaultProgress('test-scene');

      expect(progress.choices).toHaveLength(0);
      expect(progress.discoveredItems).toHaveLength(0);
    });

    it('should set timestamps', () => {
      const before = Date.now();
      const progress = createDefaultProgress('test-scene');
      const after = Date.now();

      expect(progress.startedAt).toBeGreaterThanOrEqual(before);
      expect(progress.startedAt).toBeLessThanOrEqual(after);
      expect(progress.lastPlayedAt).toBe(progress.startedAt);
    });

    it('should set currentPersona when provided (Story 10.18)', () => {
      const persona: PersonaData = {
        id: 'test-persona',
        name: 'Test Persona',
        years: '1900-2000',
        era: '1950',
        avatar: '🧪',
        quote: 'Test quote',
        background: 'Test background',
        motivation: 'Test motivation',
        constraints: [],
        problem: 'Test problem',
      };
      const progress = createDefaultProgress('test-scene', persona);

      expect(progress.currentPersona).toEqual(persona);
    });

    it('should set currentPersona to null when not provided (Story 10.18)', () => {
      const progress = createDefaultProgress('test-scene');

      expect(progress.currentPersona).toBeNull();
    });
  });
});

// Story 10.18: Persona Integration Tests
describe('StoryEngine Persona Integration', () => {
  let engine: StoryEngine;

  const mockPersona: PersonaData = {
    id: 'faggin-1971',
    name: 'Federico Faggin',
    years: '1941-',
    era: '1970-1971',
    avatar: '👨‍🔬',
    quote: 'The microprocessor was not invented. It was discovered.',
    background: 'Test background',
    motivation: 'Test motivation',
    constraints: [
      { type: 'technical', description: 'Only 2,300 transistors' },
    ],
    problem: 'Can you fit an entire CPU into 2,300 transistors?',
  };

  const createActsWithPersonas = (): StoryAct[] => [
    {
      id: 'act-1',
      number: 1,
      title: 'Test Act 1',
      description: 'Test',
      era: '1970',
      cpuStage: 'micro4',
      persona: mockPersona,
      chapters: [
        {
          id: 'chapter-1-1',
          number: 1,
          title: 'Chapter 1',
          subtitle: 'Subtitle',
          year: '1970',
          scenes: [
            { id: 'scene-1-1-1', type: 'narrative', nextScene: 'scene-2-1-1' },
          ],
        },
      ],
    },
    {
      id: 'act-2',
      number: 2,
      title: 'Test Act 2',
      description: 'Test',
      era: '1980',
      cpuStage: 'micro8',
      persona: {
        ...mockPersona,
        id: 'different-persona',
        name: 'Different Persona',
        era: '1980',
      },
      chapters: [
        {
          id: 'chapter-2-1',
          number: 1,
          title: 'Chapter 1',
          subtitle: 'Subtitle',
          year: '1980',
          scenes: [
            { id: 'scene-2-1-1', type: 'narrative' },
          ],
        },
      ],
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    engine = new StoryEngine();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('getCurrentPersona', () => {
    it('should return null before starting game', () => {
      engine.initialize(createActsWithPersonas());
      expect(engine.getCurrentPersona()).toBeNull();
    });

    it('should return persona after starting game', () => {
      engine.initialize(createActsWithPersonas());
      engine.startNewGame();
      expect(engine.getCurrentPersona()).toEqual(mockPersona);
    });
  });

  describe('getActPersona', () => {
    it('should return persona for specified act', () => {
      engine.initialize(createActsWithPersonas());
      expect(engine.getActPersona(1)).toEqual(mockPersona);
    });

    it('should return null for act without persona', () => {
      const acts: StoryAct[] = [
        {
          id: 'act-1',
          number: 1,
          title: 'Test',
          description: 'Test',
          era: '1970',
          cpuStage: 'micro4',
          chapters: [
            {
              id: 'ch-1',
              number: 1,
              title: 'Ch',
              subtitle: 'Sub',
              year: '1970',
              scenes: [{ id: 's-1', type: 'narrative' }],
            },
          ],
        },
      ];
      engine.initialize(acts);
      expect(engine.getActPersona(1)).toBeNull();
    });

    it('should return null for non-existent act', () => {
      engine.initialize(createActsWithPersonas());
      expect(engine.getActPersona(99)).toBeNull();
    });
  });

  describe('setCurrentPersona', () => {
    it('should update current persona', () => {
      engine.initialize(createActsWithPersonas());
      engine.startNewGame();
      const newPersona = { ...mockPersona, id: 'new-persona', name: 'New' };
      engine.setCurrentPersona(newPersona);
      expect(engine.getCurrentPersona()).toEqual(newPersona);
    });

    it('should throw if no active progress', () => {
      engine.initialize(createActsWithPersonas());
      expect(() => engine.setCurrentPersona(mockPersona)).toThrow();
    });

    it('should dispatch persona-changed event', () => {
      engine.initialize(createActsWithPersonas());
      engine.startNewGame();

      const listener = vi.fn();
      window.addEventListener('persona-changed', listener);

      const newPersona = { ...mockPersona, id: 'new-persona', name: 'New' };
      engine.setCurrentPersona(newPersona);

      expect(listener).toHaveBeenCalled();
      const event = listener.mock.calls[0][0] as CustomEvent;
      expect(event.detail.persona).toEqual(newPersona);
      expect(event.detail.previousPersona).toEqual(mockPersona);

      window.removeEventListener('persona-changed', listener);
    });

    it('should not dispatch event if persona is the same', () => {
      engine.initialize(createActsWithPersonas());
      engine.startNewGame();

      const listener = vi.fn();
      window.addEventListener('persona-changed', listener);

      // Clear the listener from startNewGame dispatch
      listener.mockClear();

      // Set the same persona
      engine.setCurrentPersona(mockPersona);

      expect(listener).not.toHaveBeenCalled();

      window.removeEventListener('persona-changed', listener);
    });
  });

  describe('persona on act change', () => {
    it('should update persona when navigating to different act', () => {
      engine.initialize(createActsWithPersonas());
      engine.startNewGame();

      expect(engine.getCurrentPersona()?.id).toBe('faggin-1971');

      // Navigate to scene in act 2
      engine.goToScene('scene-2-1-1');

      expect(engine.getCurrentPersona()?.id).toBe('different-persona');
    });

    it('should dispatch persona-changed on act change', () => {
      engine.initialize(createActsWithPersonas());
      engine.startNewGame();

      const listener = vi.fn();
      window.addEventListener('persona-changed', listener);
      listener.mockClear();

      engine.goToScene('scene-2-1-1');

      expect(listener).toHaveBeenCalled();
      const event = listener.mock.calls[0][0] as CustomEvent;
      expect(event.detail.persona?.id).toBe('different-persona');
      expect(event.detail.previousPersona?.id).toBe('faggin-1971');

      window.removeEventListener('persona-changed', listener);
    });
  });

  describe('persona persistence', () => {
    it('should persist persona in progress', () => {
      engine.initialize(createActsWithPersonas());
      engine.startNewGame();

      const progress = engine.getProgress();
      expect(progress?.currentPersona).toEqual(mockPersona);
    });

    it('should restore persona on resume', () => {
      engine.initialize(createActsWithPersonas());
      engine.startNewGame();

      // Create new engine and resume
      const engine2 = new StoryEngine();
      engine2.initialize(createActsWithPersonas());
      engine2.resume();

      expect(engine2.getCurrentPersona()).toEqual(mockPersona);
    });
  });
});

// Story 10.21: Mindset Integration Tests
import { MindsetProvider } from './MindsetProvider';
import type { MindsetContext } from './types';

describe('StoryEngine Mindset Integration', () => {
  let engine: StoryEngine;

  const mockMindset: MindsetContext = {
    year: 1971,
    knownTechnology: ['transistor', 'integrated circuit'],
    unknownTechnology: ['internet', 'smartphone'],
    activeProblems: [
      {
        statement: 'How to put a CPU on a single chip?',
        motivation: 'Reduce cost and power consumption',
      },
    ],
    constraints: [
      {
        type: 'technical',
        description: 'Limited transistor count',
        limitation: '2300 transistors max',
      },
    ],
    impossibilities: ['1GB RAM', 'GHz clock speeds'],
    historicalPerspective: {
      currentKnowledge: 'You are at Intel, working on the first microprocessor.',
      futureBlind: 'You do not know if this idea will succeed.',
    },
  };

  const mockMindset2: MindsetContext = {
    year: 1980,
    knownTechnology: ['8-bit microprocessor', 'floppy disk'],
    unknownTechnology: ['internet', 'smartphone', 'SSD'],
    activeProblems: [
      {
        statement: 'How to make computers affordable for homes?',
        motivation: 'Expand the market beyond hobbyists',
      },
    ],
    constraints: [
      {
        type: 'technical',
        description: '64KB address space',
        limitation: 'Programs must fit in limited memory',
      },
    ],
    impossibilities: ['gigabyte storage', 'wireless networking'],
    historicalPerspective: {
      currentKnowledge: 'Personal computers are a new phenomenon.',
      futureBlind: 'You do not know if this is just a fad.',
    },
  };

  const createActsWithMindsets = (): StoryAct[] => [
    {
      id: 'act-1',
      number: 1,
      title: 'Test Act 1',
      description: 'Test',
      era: '1971',
      cpuStage: 'micro4',
      mindset: mockMindset,
      chapters: [
        {
          id: 'chapter-1-1',
          number: 1,
          title: 'Chapter 1',
          subtitle: 'Subtitle',
          year: '1971',
          scenes: [
            { id: 'scene-1-1-1', type: 'narrative', nextScene: 'scene-2-1-1' },
          ],
        },
      ],
    },
    {
      id: 'act-2',
      number: 2,
      title: 'Test Act 2',
      description: 'Test',
      era: '1980',
      cpuStage: 'micro8',
      mindset: mockMindset2,
      chapters: [
        {
          id: 'chapter-2-1',
          number: 1,
          title: 'Chapter 1',
          subtitle: 'Subtitle',
          year: '1980',
          scenes: [
            { id: 'scene-2-1-1', type: 'narrative' },
          ],
        },
      ],
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    MindsetProvider.resetInstance();
    engine = new StoryEngine();
  });

  afterEach(() => {
    localStorage.clear();
    MindsetProvider.resetInstance();
  });

  describe('getCurrentMindset', () => {
    it('should return null before starting game', () => {
      engine.initialize(createActsWithMindsets());
      expect(engine.getCurrentMindset()).toBeNull();
    });

    it('should return mindset after starting game', () => {
      engine.initialize(createActsWithMindsets());
      engine.startNewGame();
      expect(engine.getCurrentMindset()).toEqual(mockMindset);
    });
  });

  describe('getActMindset', () => {
    it('should return mindset for specified act', () => {
      engine.initialize(createActsWithMindsets());
      expect(engine.getActMindset(1)).toEqual(mockMindset);
    });

    it('should return null for act without mindset', () => {
      const acts: StoryAct[] = [
        {
          id: 'act-1',
          number: 1,
          title: 'Test',
          description: 'Test',
          era: '1970',
          cpuStage: 'micro4',
          chapters: [
            {
              id: 'ch-1',
              number: 1,
              title: 'Ch',
              subtitle: 'Sub',
              year: '1970',
              scenes: [{ id: 's-1', type: 'narrative' }],
            },
          ],
        },
      ];
      engine.initialize(acts);
      expect(engine.getActMindset(1)).toBeNull();
    });

    it('should return null for non-existent act', () => {
      engine.initialize(createActsWithMindsets());
      expect(engine.getActMindset(99)).toBeNull();
    });
  });

  describe('mindset on act change', () => {
    it('should update mindset when navigating to different act', () => {
      engine.initialize(createActsWithMindsets());
      engine.startNewGame();

      expect(engine.getCurrentMindset()?.year).toBe(1971);

      // Navigate to scene in act 2
      engine.goToScene('scene-2-1-1');

      expect(engine.getCurrentMindset()?.year).toBe(1980);
    });

    it('should dispatch mindset-changed on act change', () => {
      engine.initialize(createActsWithMindsets());
      engine.startNewGame();

      const listener = vi.fn();
      window.addEventListener('mindset-changed', listener);

      engine.goToScene('scene-2-1-1');

      expect(listener).toHaveBeenCalled();
      const event = listener.mock.calls[0][0] as CustomEvent;
      expect(event.detail.mindset?.year).toBe(1980);
      expect(event.detail.previousMindset?.year).toBe(1971);
      expect(event.detail.actNumber).toBe(2);

      window.removeEventListener('mindset-changed', listener);
    });

    it('should update MindsetProvider global state', () => {
      engine.initialize(createActsWithMindsets());
      engine.startNewGame();

      const provider = MindsetProvider.getInstance();
      expect(provider.getCurrentMindset()?.year).toBe(1971);

      engine.goToScene('scene-2-1-1');

      expect(provider.getCurrentMindset()?.year).toBe(1980);
    });
  });

  describe('startNewGame with mindset', () => {
    it('should initialize mindset from first act', () => {
      engine.initialize(createActsWithMindsets());
      engine.startNewGame();

      expect(engine.getCurrentMindset()).toEqual(mockMindset);
    });

    it('should dispatch mindset-changed event on start', () => {
      engine.initialize(createActsWithMindsets());

      const listener = vi.fn();
      window.addEventListener('mindset-changed', listener);

      engine.startNewGame();

      expect(listener).toHaveBeenCalled();
      const event = listener.mock.calls[0][0] as CustomEvent;
      expect(event.detail.mindset).toEqual(mockMindset);
      expect(event.detail.previousMindset).toBeNull();

      window.removeEventListener('mindset-changed', listener);
    });
  });

  describe('resume with mindset', () => {
    it('should initialize mindset from current act when resuming', () => {
      engine.initialize(createActsWithMindsets());
      engine.startNewGame();
      engine.goToScene('scene-2-1-1'); // Move to act 2

      // Simulate page refresh - new engine instance
      MindsetProvider.resetInstance();
      const engine2 = new StoryEngine();
      engine2.initialize(createActsWithMindsets());
      engine2.resume();

      expect(engine2.getCurrentMindset()?.year).toBe(1980);
    });

    it('should initialize mindset from first act when resuming at start', () => {
      engine.initialize(createActsWithMindsets());
      engine.startNewGame();

      // Simulate page refresh - new engine instance
      MindsetProvider.resetInstance();
      const engine2 = new StoryEngine();
      engine2.initialize(createActsWithMindsets());
      engine2.resume();

      expect(engine2.getCurrentMindset()?.year).toBe(1971);
    });
  });
});
