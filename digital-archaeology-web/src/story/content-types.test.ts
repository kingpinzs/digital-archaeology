// src/story/content-types.test.ts
// Type tests for story content data structures
// Story 10.22: Decision-Maker + Builder Mode

import { describe, it, expect } from 'vitest';
import type { SceneType, StoryScene } from './content-types';
import type { BuilderChallengeData } from './content-types';
import type { HistoricalDecision, ChallengeObjective } from './types';

describe('content-types', () => {
  describe('SceneType', () => {
    it('should accept "decision" as a valid scene type', () => {
      const sceneType: SceneType = 'decision';
      expect(sceneType).toBe('decision');
    });

    it('should accept "builder" as a valid scene type', () => {
      const sceneType: SceneType = 'builder';
      expect(sceneType).toBe('builder');
    });

    it('should still accept existing scene types', () => {
      const types: SceneType[] = ['narrative', 'dialogue', 'choice', 'challenge', 'persona', 'transition', 'decision', 'builder'];
      expect(types).toHaveLength(8);
    });
  });

  describe('StoryScene', () => {
    it('should accept decision field with HistoricalDecision', () => {
      const decision: HistoricalDecision = {
        id: 'test-decision',
        question: 'What should we do?',
        context: 'We face a choice.',
        options: [],
        historicalChoice: 'option-a',
        historicalOutcome: 'It worked.',
        alternateOutcomes: [],
      };

      const scene: StoryScene = {
        id: 'scene-1',
        type: 'decision',
        decision,
      };

      expect(scene.decision).toBe(decision);
      expect(scene.type).toBe('decision');
    });

    it('should accept builderChallenge field with BuilderChallengeData', () => {
      const builderChallenge: BuilderChallengeData = {
        title: 'Build Segment Registers',
        description: 'Implement the addressing solution you chose.',
        objectives: [
          { id: 'obj-1', text: 'Create register structure', completed: false },
        ],
      };

      const scene: StoryScene = {
        id: 'scene-2',
        type: 'builder',
        builderChallenge,
      };

      expect(scene.builderChallenge).toBe(builderChallenge);
      expect(scene.type).toBe('builder');
    });

    it('should allow builderChallenge with optional decisionId', () => {
      const builderChallenge: BuilderChallengeData = {
        title: 'Build It',
        description: 'Build what you decided.',
        decisionId: 'memory-addressing-1978',
        objectives: [],
      };

      const scene: StoryScene = {
        id: 'scene-3',
        type: 'builder',
        builderChallenge,
      };

      expect(scene.builderChallenge!.decisionId).toBe('memory-addressing-1978');
    });

    it('should allow builderChallenge with optional labContext', () => {
      const builderChallenge: BuilderChallengeData = {
        title: 'Build It',
        description: 'Build what you decided.',
        labContext: 'segment-register-implementation',
        objectives: [],
      };

      const scene: StoryScene = {
        id: 'scene-4',
        type: 'builder',
        builderChallenge,
      };

      expect(scene.builderChallenge!.labContext).toBe('segment-register-implementation');
    });
  });

  describe('BuilderChallengeData', () => {
    it('should require title and description', () => {
      const challenge: BuilderChallengeData = {
        title: 'Test Challenge',
        description: 'A test.',
        objectives: [],
      };

      expect(challenge.title).toBe('Test Challenge');
      expect(challenge.description).toBe('A test.');
    });

    it('should accept ChallengeObjective array', () => {
      const objectives: ChallengeObjective[] = [
        { id: 'obj-1', text: 'Step 1', completed: false },
        { id: 'obj-2', text: 'Step 2', completed: true },
      ];

      const challenge: BuilderChallengeData = {
        title: 'Test',
        description: 'Test',
        objectives,
      };

      expect(challenge.objectives).toHaveLength(2);
      expect(challenge.objectives[1].completed).toBe(true);
    });
  });
});
