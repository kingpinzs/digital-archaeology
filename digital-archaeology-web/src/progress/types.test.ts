// src/progress/types.test.ts
// Tests for discovery, act completion, and achievement data model, type guards, and metadata
// Story 19.1: Track First-Time Discoveries
// Story 19.2: Track Act Completion
// Story 19.3: Create Milestone Achievements

import { describe, it, expect } from 'vitest';
import {
  isValidDiscovery,
  isValidDiscoveryProfile,
  DEFAULT_DISCOVERY_PROFILE,
  DISCOVERY_METADATA,
  isValidActCompletion,
  isValidActCompletionProfile,
  DEFAULT_ACT_COMPLETION_PROFILE,
  ACT_COMPLETION_METADATA,
  isValidAchievement,
  isValidAchievementProfile,
  DEFAULT_ACHIEVEMENT_PROFILE,
  ACHIEVEMENT_METADATA,
} from './types';
import type {
  Discovery,
  DiscoveryType,
  DiscoveryProfile,
  ActCompletion,
  ActCompletionType,
  ActCompletionProfile,
  Achievement,
  AchievementType,
  AchievementTier,
  AchievementProfile,
} from './types';

/** Helper: create a valid discovery for testing */
function createValidDiscovery(overrides: Partial<Discovery> = {}): Discovery {
  return {
    type: 'first-assembly',
    timestamp: 1700000000000,
    stage: 'micro4',
    experimentationMode: false,
    ...overrides,
  };
}

describe('isValidDiscovery', () => {
  it('accepts a valid discovery', () => {
    expect(isValidDiscovery(createValidDiscovery())).toBe(true);
  });

  it('accepts all valid discovery types', () => {
    const types: DiscoveryType[] = [
      'first-assembly',
      'first-subroutine',
      'first-interrupt',
      'first-stack',
      'first-stage-micro4',
      'first-stage-micro8',
      'first-stage-micro16',
    ];
    for (const type of types) {
      expect(isValidDiscovery(createValidDiscovery({ type }))).toBe(true);
    }
  });

  it('accepts discovery with experimentationMode true', () => {
    expect(isValidDiscovery(createValidDiscovery({ experimentationMode: true }))).toBe(true);
  });

  it('accepts discovery with different valid stages', () => {
    expect(isValidDiscovery(createValidDiscovery({ stage: 'micro8' }))).toBe(true);
    expect(isValidDiscovery(createValidDiscovery({ stage: 'micro16' }))).toBe(true);
  });

  it('rejects null', () => {
    expect(isValidDiscovery(null)).toBe(false);
  });

  it('rejects undefined', () => {
    expect(isValidDiscovery(undefined)).toBe(false);
  });

  it('rejects non-object', () => {
    expect(isValidDiscovery('string')).toBe(false);
    expect(isValidDiscovery(42)).toBe(false);
  });

  it('rejects invalid discovery type', () => {
    expect(isValidDiscovery({ ...createValidDiscovery(), type: 'invalid-type' })).toBe(false);
  });

  it('rejects missing type field', () => {
    const { type: _type, ...rest } = createValidDiscovery();
    expect(isValidDiscovery(rest)).toBe(false);
  });

  it('rejects non-number timestamp', () => {
    expect(isValidDiscovery({ ...createValidDiscovery(), timestamp: 'not-a-number' })).toBe(false);
  });

  it('rejects negative timestamp', () => {
    expect(isValidDiscovery({ ...createValidDiscovery(), timestamp: -1 })).toBe(false);
  });

  it('rejects invalid stage', () => {
    expect(isValidDiscovery({ ...createValidDiscovery(), stage: 'micro99' })).toBe(false);
  });

  it('rejects non-boolean experimentationMode', () => {
    expect(isValidDiscovery({ ...createValidDiscovery(), experimentationMode: 'yes' })).toBe(false);
  });
});

describe('isValidDiscoveryProfile', () => {
  it('accepts a valid empty profile', () => {
    const profile: DiscoveryProfile = { discoveries: [], version: 1 };
    expect(isValidDiscoveryProfile(profile)).toBe(true);
  });

  it('accepts a profile with discoveries', () => {
    const profile: DiscoveryProfile = {
      discoveries: [createValidDiscovery()],
      version: 1,
    };
    expect(isValidDiscoveryProfile(profile)).toBe(true);
  });

  it('accepts a profile with multiple discoveries', () => {
    const profile: DiscoveryProfile = {
      discoveries: [
        createValidDiscovery({ type: 'first-assembly' }),
        createValidDiscovery({ type: 'first-subroutine', stage: 'micro8' }),
      ],
      version: 1,
    };
    expect(isValidDiscoveryProfile(profile)).toBe(true);
  });

  it('rejects null', () => {
    expect(isValidDiscoveryProfile(null)).toBe(false);
  });

  it('rejects non-object', () => {
    expect(isValidDiscoveryProfile('string')).toBe(false);
  });

  it('rejects missing discoveries field', () => {
    expect(isValidDiscoveryProfile({ version: 1 })).toBe(false);
  });

  it('rejects non-array discoveries', () => {
    expect(isValidDiscoveryProfile({ discoveries: 'not-array', version: 1 })).toBe(false);
  });

  it('rejects profile with invalid discovery in array', () => {
    expect(isValidDiscoveryProfile({
      discoveries: [{ type: 'invalid', timestamp: 0, stage: 'micro4', experimentationMode: false }],
      version: 1,
    })).toBe(false);
  });

  it('rejects missing version', () => {
    expect(isValidDiscoveryProfile({ discoveries: [] })).toBe(false);
  });

  it('rejects non-number version', () => {
    expect(isValidDiscoveryProfile({ discoveries: [], version: '1' })).toBe(false);
  });

  it('rejects version 0', () => {
    expect(isValidDiscoveryProfile({ discoveries: [], version: 0 })).toBe(false);
  });

  it('rejects negative version', () => {
    expect(isValidDiscoveryProfile({ discoveries: [], version: -1 })).toBe(false);
  });

  it('rejects non-integer version', () => {
    expect(isValidDiscoveryProfile({ discoveries: [], version: 1.5 })).toBe(false);
  });

  it('rejects NaN version', () => {
    expect(isValidDiscoveryProfile({ discoveries: [], version: NaN })).toBe(false);
  });
});

describe('DEFAULT_DISCOVERY_PROFILE', () => {
  it('has empty discoveries array', () => {
    expect(DEFAULT_DISCOVERY_PROFILE.discoveries).toEqual([]);
  });

  it('has version 1', () => {
    expect(DEFAULT_DISCOVERY_PROFILE.version).toBe(1);
  });

  it('passes validation', () => {
    expect(isValidDiscoveryProfile(DEFAULT_DISCOVERY_PROFILE)).toBe(true);
  });
});

describe('DISCOVERY_METADATA', () => {
  const allTypes: DiscoveryType[] = [
    'first-assembly',
    'first-subroutine',
    'first-interrupt',
    'first-stack',
    'first-stage-micro4',
    'first-stage-micro8',
    'first-stage-micro16',
  ];

  it('has entries for every DiscoveryType', () => {
    for (const type of allTypes) {
      expect(DISCOVERY_METADATA[type]).toBeDefined();
    }
  });

  it('each entry has title, description, and icon', () => {
    for (const type of allTypes) {
      const entry = DISCOVERY_METADATA[type];
      expect(typeof entry.title).toBe('string');
      expect(entry.title.length).toBeGreaterThan(0);
      expect(typeof entry.description).toBe('string');
      expect(entry.description.length).toBeGreaterThan(0);
      expect(typeof entry.icon).toBe('string');
      expect(entry.icon.length).toBeGreaterThan(0);
    }
  });
});

// =============================================================================
// Act Completion Types (Story 19.2)
// =============================================================================

/** Helper: create a valid act completion for testing */
function createValidActCompletion(overrides: Partial<ActCompletion> = {}): ActCompletion {
  return {
    actNumber: 0,
    actId: 'act-0',
    timestamp: 1700000000000,
    actTitle: 'Pre-history',
    era: '3000 BC - 1840s',
    ...overrides,
  };
}

describe('isValidActCompletion', () => {
  it('accepts a valid act completion', () => {
    expect(isValidActCompletion(createValidActCompletion())).toBe(true);
  });

  it('accepts all valid act completion types', () => {
    const types: ActCompletionType[] = [
      'act-0', 'act-1', 'act-2', 'act-3', 'act-4',
      'act-5', 'act-6', 'act-7', 'act-8', 'act-9', 'act-10',
    ];
    for (let i = 0; i < types.length; i++) {
      expect(isValidActCompletion(createValidActCompletion({
        actNumber: i,
        actId: types[i],
      }))).toBe(true);
    }
  });

  it('rejects null', () => {
    expect(isValidActCompletion(null)).toBe(false);
  });

  it('rejects undefined', () => {
    expect(isValidActCompletion(undefined)).toBe(false);
  });

  it('rejects non-object', () => {
    expect(isValidActCompletion('string')).toBe(false);
    expect(isValidActCompletion(42)).toBe(false);
  });

  it('rejects invalid actId', () => {
    expect(isValidActCompletion({ ...createValidActCompletion(), actId: 'act-99' })).toBe(false);
  });

  it('rejects non-integer actNumber', () => {
    expect(isValidActCompletion({ ...createValidActCompletion(), actNumber: 1.5 })).toBe(false);
  });

  it('rejects negative actNumber', () => {
    expect(isValidActCompletion({ ...createValidActCompletion(), actNumber: -1 })).toBe(false);
  });

  it('rejects actNumber > 10', () => {
    expect(isValidActCompletion({ ...createValidActCompletion(), actNumber: 11 })).toBe(false);
  });

  it('rejects non-number timestamp', () => {
    expect(isValidActCompletion({ ...createValidActCompletion(), timestamp: 'abc' })).toBe(false);
  });

  it('rejects negative timestamp', () => {
    expect(isValidActCompletion({ ...createValidActCompletion(), timestamp: -1 })).toBe(false);
  });

  it('rejects non-string actTitle', () => {
    expect(isValidActCompletion({ ...createValidActCompletion(), actTitle: 42 })).toBe(false);
  });

  it('rejects non-string era', () => {
    expect(isValidActCompletion({ ...createValidActCompletion(), era: null })).toBe(false);
  });

  it('rejects missing fields', () => {
    expect(isValidActCompletion({ actNumber: 0 })).toBe(false);
    expect(isValidActCompletion({ actId: 'act-0' })).toBe(false);
  });

  it('rejects empty string actTitle', () => {
    expect(isValidActCompletion({ ...createValidActCompletion(), actTitle: '' })).toBe(false);
  });

  it('rejects empty string era', () => {
    expect(isValidActCompletion({ ...createValidActCompletion(), era: '' })).toBe(false);
  });

  it('rejects mismatched actId vs actNumber', () => {
    expect(isValidActCompletion({
      ...createValidActCompletion(),
      actNumber: 0,
      actId: 'act-5',
    })).toBe(false);
  });
});

describe('isValidActCompletionProfile', () => {
  it('accepts a valid empty profile', () => {
    const profile: ActCompletionProfile = { completions: [], version: 1 };
    expect(isValidActCompletionProfile(profile)).toBe(true);
  });

  it('accepts a profile with completions', () => {
    const profile: ActCompletionProfile = {
      completions: [createValidActCompletion()],
      version: 1,
    };
    expect(isValidActCompletionProfile(profile)).toBe(true);
  });

  it('rejects null', () => {
    expect(isValidActCompletionProfile(null)).toBe(false);
  });

  it('rejects non-object', () => {
    expect(isValidActCompletionProfile('string')).toBe(false);
  });

  it('rejects missing completions field', () => {
    expect(isValidActCompletionProfile({ version: 1 })).toBe(false);
  });

  it('rejects non-array completions', () => {
    expect(isValidActCompletionProfile({ completions: 'not-array', version: 1 })).toBe(false);
  });

  it('rejects profile with invalid completion in array', () => {
    expect(isValidActCompletionProfile({
      completions: [{ actNumber: 99, actId: 'invalid', timestamp: 0, actTitle: '', era: '' }],
      version: 1,
    })).toBe(false);
  });

  it('rejects missing version', () => {
    expect(isValidActCompletionProfile({ completions: [] })).toBe(false);
  });

  it('rejects non-number version', () => {
    expect(isValidActCompletionProfile({ completions: [], version: '1' })).toBe(false);
  });

  it('rejects version 0', () => {
    expect(isValidActCompletionProfile({ completions: [], version: 0 })).toBe(false);
  });

  it('rejects negative version', () => {
    expect(isValidActCompletionProfile({ completions: [], version: -1 })).toBe(false);
  });

  it('rejects non-integer version', () => {
    expect(isValidActCompletionProfile({ completions: [], version: 1.5 })).toBe(false);
  });

  it('rejects NaN version', () => {
    expect(isValidActCompletionProfile({ completions: [], version: NaN })).toBe(false);
  });
});

describe('DEFAULT_ACT_COMPLETION_PROFILE', () => {
  it('has empty completions array', () => {
    expect(DEFAULT_ACT_COMPLETION_PROFILE.completions).toEqual([]);
  });

  it('has version 1', () => {
    expect(DEFAULT_ACT_COMPLETION_PROFILE.version).toBe(1);
  });

  it('passes validation', () => {
    expect(isValidActCompletionProfile(DEFAULT_ACT_COMPLETION_PROFILE)).toBe(true);
  });
});

describe('ACT_COMPLETION_METADATA', () => {
  const allActTypes: ActCompletionType[] = [
    'act-0', 'act-1', 'act-2', 'act-3', 'act-4',
    'act-5', 'act-6', 'act-7', 'act-8', 'act-9', 'act-10',
  ];

  it('has entries for all 11 acts', () => {
    expect(Object.keys(ACT_COMPLETION_METADATA)).toHaveLength(11);
    for (const actType of allActTypes) {
      expect(ACT_COMPLETION_METADATA[actType]).toBeDefined();
    }
  });

  it('each entry has title, era, and icon', () => {
    for (const actType of allActTypes) {
      const entry = ACT_COMPLETION_METADATA[actType];
      expect(typeof entry.title).toBe('string');
      expect(entry.title.length).toBeGreaterThan(0);
      expect(typeof entry.era).toBe('string');
      expect(entry.era.length).toBeGreaterThan(0);
      expect(typeof entry.icon).toBe('string');
      expect(entry.icon.length).toBeGreaterThan(0);
    }
  });
});

// =============================================================================
// Achievement Types (Story 19.3)
// =============================================================================

/** Helper: create a valid achievement for testing */
function createValidAchievement(overrides: Partial<Achievement> = {}): Achievement {
  return {
    type: 'first-discovery',
    timestamp: 1700000000000,
    tier: 'common',
    ...overrides,
  };
}

describe('isValidAchievement', () => {
  it('accepts a valid achievement', () => {
    expect(isValidAchievement(createValidAchievement())).toBe(true);
  });

  it('accepts all valid achievement types', () => {
    const types: AchievementType[] = [
      'first-discovery',
      'discovery-collector',
      'discovery-master',
      'first-act-complete',
      'acts-explorer',
      'halfway-there',
      'story-completionist',
      'micro4-graduate',
      'micro8-graduate',
      'micro16-graduate',
      'code-pioneer',
      'subroutine-architect',
      'interrupt-expert',
      'stack-wizard',
      'multi-stage-explorer',
      'all-stages-master',
    ];
    for (const type of types) {
      const tier = ACHIEVEMENT_METADATA[type].tier;
      expect(isValidAchievement(createValidAchievement({ type, tier }))).toBe(true);
    }
  });

  it('accepts all valid tiers', () => {
    const tiers: AchievementTier[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    for (const tier of tiers) {
      expect(isValidAchievement(createValidAchievement({ tier }))).toBe(true);
    }
  });

  it('rejects null', () => {
    expect(isValidAchievement(null)).toBe(false);
  });

  it('rejects undefined', () => {
    expect(isValidAchievement(undefined)).toBe(false);
  });

  it('rejects non-object', () => {
    expect(isValidAchievement('string')).toBe(false);
    expect(isValidAchievement(42)).toBe(false);
  });

  it('rejects invalid achievement type', () => {
    expect(isValidAchievement({ ...createValidAchievement(), type: 'invalid-type' })).toBe(false);
  });

  it('rejects missing type field', () => {
    const { type: _type, ...rest } = createValidAchievement();
    expect(isValidAchievement(rest)).toBe(false);
  });

  it('rejects non-number timestamp', () => {
    expect(isValidAchievement({ ...createValidAchievement(), timestamp: 'not-a-number' })).toBe(false);
  });

  it('rejects negative timestamp', () => {
    expect(isValidAchievement({ ...createValidAchievement(), timestamp: -1 })).toBe(false);
  });

  it('rejects invalid tier', () => {
    expect(isValidAchievement({ ...createValidAchievement(), tier: 'mythic' })).toBe(false);
  });

  it('rejects missing tier', () => {
    const { tier: _tier, ...rest } = createValidAchievement();
    expect(isValidAchievement(rest)).toBe(false);
  });
});

describe('isValidAchievementProfile', () => {
  it('accepts a valid empty profile', () => {
    const profile: AchievementProfile = { completions: [], version: 1 };
    expect(isValidAchievementProfile(profile)).toBe(true);
  });

  it('accepts a profile with achievements', () => {
    const profile: AchievementProfile = {
      completions: [createValidAchievement()],
      version: 1,
    };
    expect(isValidAchievementProfile(profile)).toBe(true);
  });

  it('accepts a profile with multiple achievements', () => {
    const profile: AchievementProfile = {
      completions: [
        createValidAchievement({ type: 'first-discovery', tier: 'common' }),
        createValidAchievement({ type: 'code-pioneer', tier: 'common' }),
      ],
      version: 1,
    };
    expect(isValidAchievementProfile(profile)).toBe(true);
  });

  it('rejects null', () => {
    expect(isValidAchievementProfile(null)).toBe(false);
  });

  it('rejects non-object', () => {
    expect(isValidAchievementProfile('string')).toBe(false);
  });

  it('rejects missing completions field', () => {
    expect(isValidAchievementProfile({ version: 1 })).toBe(false);
  });

  it('rejects non-array completions', () => {
    expect(isValidAchievementProfile({ completions: 'not-array', version: 1 })).toBe(false);
  });

  it('rejects profile with invalid achievement in array', () => {
    expect(isValidAchievementProfile({
      completions: [{ type: 'invalid', timestamp: 0, tier: 'common' }],
      version: 1,
    })).toBe(false);
  });

  it('rejects missing version', () => {
    expect(isValidAchievementProfile({ completions: [] })).toBe(false);
  });

  it('rejects non-number version', () => {
    expect(isValidAchievementProfile({ completions: [], version: '1' })).toBe(false);
  });

  it('rejects version 0', () => {
    expect(isValidAchievementProfile({ completions: [], version: 0 })).toBe(false);
  });

  it('rejects negative version', () => {
    expect(isValidAchievementProfile({ completions: [], version: -1 })).toBe(false);
  });

  it('rejects non-integer version', () => {
    expect(isValidAchievementProfile({ completions: [], version: 1.5 })).toBe(false);
  });

  it('rejects NaN version', () => {
    expect(isValidAchievementProfile({ completions: [], version: NaN })).toBe(false);
  });
});

describe('DEFAULT_ACHIEVEMENT_PROFILE', () => {
  it('has empty completions array', () => {
    expect(DEFAULT_ACHIEVEMENT_PROFILE.completions).toEqual([]);
  });

  it('has version 1', () => {
    expect(DEFAULT_ACHIEVEMENT_PROFILE.version).toBe(1);
  });

  it('passes validation', () => {
    expect(isValidAchievementProfile(DEFAULT_ACHIEVEMENT_PROFILE)).toBe(true);
  });
});

describe('ACHIEVEMENT_METADATA', () => {
  const allAchievementTypes: AchievementType[] = [
    'first-discovery',
    'discovery-collector',
    'discovery-master',
    'first-act-complete',
    'acts-explorer',
    'halfway-there',
    'story-completionist',
    'micro4-graduate',
    'micro8-graduate',
    'micro16-graduate',
    'code-pioneer',
    'subroutine-architect',
    'interrupt-expert',
    'stack-wizard',
    'multi-stage-explorer',
    'all-stages-master',
  ];

  it('has entries for all 16 achievements', () => {
    expect(Object.keys(ACHIEVEMENT_METADATA)).toHaveLength(16);
    for (const type of allAchievementTypes) {
      expect(ACHIEVEMENT_METADATA[type]).toBeDefined();
    }
  });

  it('each entry has title, description, icon, and tier', () => {
    for (const type of allAchievementTypes) {
      const entry = ACHIEVEMENT_METADATA[type];
      expect(typeof entry.title).toBe('string');
      expect(entry.title.length).toBeGreaterThan(0);
      expect(typeof entry.description).toBe('string');
      expect(entry.description.length).toBeGreaterThan(0);
      expect(typeof entry.icon).toBe('string');
      expect(entry.icon.length).toBeGreaterThan(0);
      expect(['common', 'uncommon', 'rare', 'epic', 'legendary']).toContain(entry.tier);
    }
  });

  it('has correct tier distribution (3 common, 6 uncommon, 5 rare, 1 epic, 1 legendary)', () => {
    const tiers = Object.values(ACHIEVEMENT_METADATA).map(e => e.tier);
    expect(tiers.filter(t => t === 'common')).toHaveLength(3);
    expect(tiers.filter(t => t === 'uncommon')).toHaveLength(6);
    expect(tiers.filter(t => t === 'rare')).toHaveLength(5);
    expect(tiers.filter(t => t === 'epic')).toHaveLength(1);
    expect(tiers.filter(t => t === 'legendary')).toHaveLength(1);
  });
});
