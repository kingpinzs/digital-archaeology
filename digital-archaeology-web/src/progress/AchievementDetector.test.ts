// src/progress/AchievementDetector.test.ts
// Tests for AchievementDetector milestone evaluation service
// Story 19.3: Create Milestone Achievements

import { describe, it, expect, beforeEach } from 'vitest';
import { AchievementDetector } from './AchievementDetector';
import { AchievementStorage } from './AchievementStorage';
import { DiscoveryStorage } from './DiscoveryStorage';
import { ActCompletionStorage } from './ActCompletionStorage';
import type { Discovery, ActCompletion } from './types';

/** Unique key counter to avoid localStorage collisions between tests */
let keyCounter = 0;
function uniqueKey(prefix: string): string {
  return `${prefix}-${++keyCounter}-${Date.now()}`;
}

/** Helper: create a discovery */
function makeDiscovery(type: Discovery['type'], stage: Discovery['stage'] = 'micro4'): Discovery {
  return { type, timestamp: Date.now(), stage, experimentationMode: false };
}

/** Helper: create an act completion */
function makeActCompletion(actNumber: number): ActCompletion {
  return {
    actNumber,
    actId: `act-${actNumber}` as ActCompletion['actId'],
    timestamp: Date.now(),
    actTitle: `Act ${actNumber}`,
    era: 'Test Era',
  };
}

describe('AchievementDetector', () => {
  let achievementStorage: AchievementStorage;
  let discoveryStorage: DiscoveryStorage;
  let actCompletionStorage: ActCompletionStorage;
  let detector: AchievementDetector;

  beforeEach(() => {
    localStorage.clear();
    achievementStorage = new AchievementStorage(uniqueKey('ach'));
    discoveryStorage = new DiscoveryStorage(uniqueKey('disc'));
    actCompletionStorage = new ActCompletionStorage(uniqueKey('act'));
    detector = new AchievementDetector(achievementStorage, discoveryStorage, actCompletionStorage);
  });

  describe('evaluate', () => {
    it('returns empty array when no progress exists', () => {
      expect(detector.evaluate()).toEqual([]);
    });

    // Discovery-count milestones
    it('triggers first-discovery with 1 discovery', () => {
      discoveryStorage.addDiscovery(makeDiscovery('first-assembly'));
      const results = detector.evaluate();
      const types = results.map(a => a.type);
      expect(types).toContain('first-discovery');
    });

    it('triggers discovery-collector with 3 discoveries', () => {
      discoveryStorage.addDiscovery(makeDiscovery('first-assembly'));
      discoveryStorage.addDiscovery(makeDiscovery('first-subroutine'));
      discoveryStorage.addDiscovery(makeDiscovery('first-interrupt'));
      const results = detector.evaluate();
      const types = results.map(a => a.type);
      expect(types).toContain('discovery-collector');
    });

    it('triggers discovery-master with all 7 discoveries', () => {
      discoveryStorage.addDiscovery(makeDiscovery('first-assembly'));
      discoveryStorage.addDiscovery(makeDiscovery('first-subroutine'));
      discoveryStorage.addDiscovery(makeDiscovery('first-interrupt'));
      discoveryStorage.addDiscovery(makeDiscovery('first-stack'));
      discoveryStorage.addDiscovery(makeDiscovery('first-stage-micro4'));
      discoveryStorage.addDiscovery(makeDiscovery('first-stage-micro8', 'micro8'));
      discoveryStorage.addDiscovery(makeDiscovery('first-stage-micro16', 'micro16'));
      const results = detector.evaluate();
      const types = results.map(a => a.type);
      expect(types).toContain('discovery-master');
    });

    // Act completion-count milestones
    it('triggers first-act-complete with 1 act', () => {
      actCompletionStorage.addCompletion(makeActCompletion(0));
      const results = detector.evaluate();
      const types = results.map(a => a.type);
      expect(types).toContain('first-act-complete');
    });

    it('triggers acts-explorer with 3 acts', () => {
      for (let i = 0; i < 3; i++) {
        actCompletionStorage.addCompletion(makeActCompletion(i));
      }
      const results = detector.evaluate();
      const types = results.map(a => a.type);
      expect(types).toContain('acts-explorer');
    });

    it('triggers halfway-there with 5 acts', () => {
      for (let i = 0; i < 5; i++) {
        actCompletionStorage.addCompletion(makeActCompletion(i));
      }
      const results = detector.evaluate();
      const types = results.map(a => a.type);
      expect(types).toContain('halfway-there');
    });

    it('triggers story-completionist with all 11 acts', () => {
      for (let i = 0; i <= 10; i++) {
        actCompletionStorage.addCompletion(makeActCompletion(i));
      }
      const results = detector.evaluate();
      const types = results.map(a => a.type);
      expect(types).toContain('story-completionist');
    });

    // Specific act milestones
    it('triggers micro4-graduate when act-4 is completed', () => {
      actCompletionStorage.addCompletion(makeActCompletion(4));
      const results = detector.evaluate();
      const types = results.map(a => a.type);
      expect(types).toContain('micro4-graduate');
    });

    it('triggers micro8-graduate when act-5 is completed', () => {
      actCompletionStorage.addCompletion(makeActCompletion(5));
      const results = detector.evaluate();
      const types = results.map(a => a.type);
      expect(types).toContain('micro8-graduate');
    });

    it('triggers micro16-graduate when act-6 is completed', () => {
      actCompletionStorage.addCompletion(makeActCompletion(6));
      const results = detector.evaluate();
      const types = results.map(a => a.type);
      expect(types).toContain('micro16-graduate');
    });

    // Discovery-type milestones
    it('triggers code-pioneer with first-assembly discovery', () => {
      discoveryStorage.addDiscovery(makeDiscovery('first-assembly'));
      const results = detector.evaluate();
      const types = results.map(a => a.type);
      expect(types).toContain('code-pioneer');
    });

    it('triggers subroutine-architect with first-subroutine discovery', () => {
      discoveryStorage.addDiscovery(makeDiscovery('first-subroutine'));
      const results = detector.evaluate();
      const types = results.map(a => a.type);
      expect(types).toContain('subroutine-architect');
    });

    it('triggers interrupt-expert with first-interrupt discovery', () => {
      discoveryStorage.addDiscovery(makeDiscovery('first-interrupt'));
      const results = detector.evaluate();
      const types = results.map(a => a.type);
      expect(types).toContain('interrupt-expert');
    });

    it('triggers stack-wizard with first-stack discovery', () => {
      discoveryStorage.addDiscovery(makeDiscovery('first-stack'));
      const results = detector.evaluate();
      const types = results.map(a => a.type);
      expect(types).toContain('stack-wizard');
    });

    // Stage-based milestones
    it('triggers multi-stage-explorer with 2 stage discoveries', () => {
      discoveryStorage.addDiscovery(makeDiscovery('first-stage-micro4'));
      discoveryStorage.addDiscovery(makeDiscovery('first-stage-micro8', 'micro8'));
      const results = detector.evaluate();
      const types = results.map(a => a.type);
      expect(types).toContain('multi-stage-explorer');
    });

    it('triggers all-stages-master with all 3 stage discoveries', () => {
      discoveryStorage.addDiscovery(makeDiscovery('first-stage-micro4'));
      discoveryStorage.addDiscovery(makeDiscovery('first-stage-micro8', 'micro8'));
      discoveryStorage.addDiscovery(makeDiscovery('first-stage-micro16', 'micro16'));
      const results = detector.evaluate();
      const types = results.map(a => a.type);
      expect(types).toContain('all-stages-master');
    });

    it('does not trigger multi-stage-explorer with only 1 stage discovery', () => {
      discoveryStorage.addDiscovery(makeDiscovery('first-stage-micro4'));
      const results = detector.evaluate();
      const types = results.map(a => a.type);
      expect(types).not.toContain('multi-stage-explorer');
    });

    // Already-earned achievements
    it('does not re-trigger already-earned achievements', () => {
      discoveryStorage.addDiscovery(makeDiscovery('first-assembly'));
      // Evaluate once — first-discovery and code-pioneer earned
      const first = detector.evaluate();
      expect(first.length).toBeGreaterThan(0);
      // Store them
      for (const ach of first) {
        achievementStorage.addAchievement(ach);
      }
      // Evaluate again — should return empty
      const second = detector.evaluate();
      expect(second).toEqual([]);
    });

    // Multiple achievements at once
    it('returns multiple new achievements simultaneously', () => {
      discoveryStorage.addDiscovery(makeDiscovery('first-assembly'));
      actCompletionStorage.addCompletion(makeActCompletion(0));
      const results = detector.evaluate();
      // Should have: first-discovery, code-pioneer, first-act-complete (at minimum)
      expect(results.length).toBeGreaterThanOrEqual(3);
      const types = results.map(a => a.type);
      expect(types).toContain('first-discovery');
      expect(types).toContain('code-pioneer');
      expect(types).toContain('first-act-complete');
    });

    // Achievement has correct tier from metadata
    it('sets correct tier from metadata', () => {
      discoveryStorage.addDiscovery(makeDiscovery('first-assembly'));
      const results = detector.evaluate();
      const firstDiscovery = results.find(a => a.type === 'first-discovery');
      expect(firstDiscovery).toBeDefined();
      expect(firstDiscovery!.tier).toBe('common');
    });

    it('sets legendary tier for story-completionist', () => {
      for (let i = 0; i <= 10; i++) {
        actCompletionStorage.addCompletion(makeActCompletion(i));
      }
      const results = detector.evaluate();
      const completionist = results.find(a => a.type === 'story-completionist');
      expect(completionist).toBeDefined();
      expect(completionist!.tier).toBe('legendary');
    });

    // Timestamp
    it('sets timestamp on new achievements', () => {
      discoveryStorage.addDiscovery(makeDiscovery('first-assembly'));
      const before = Date.now();
      const results = detector.evaluate();
      const after = Date.now();
      for (const ach of results) {
        expect(ach.timestamp).toBeGreaterThanOrEqual(before);
        expect(ach.timestamp).toBeLessThanOrEqual(after);
      }
    });
  });
});
