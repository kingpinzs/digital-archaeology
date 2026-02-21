/**
 * Unit tests for the story content validation script.
 * Tests pure validation functions with mock data — no file I/O.
 *
 * Story TD-3: Content Audit & Schema Enforcement
 */

import { describe, it, expect } from 'vitest';
import {
  validateSceneReferences,
  validatePersonaReferences,
  validateIndexCompleteness,
  validateChapterIntegrity,
  validateSchemaAlignment,
  validatePersonaFileStructure,
  collectAllSceneIds,
  VALID_SCENE_TYPES,
  VALID_CPU_STAGES,
  VALID_PERSONA_CONSTRAINT_TYPES,
  REQUIRED_PERSONA_FIELDS,
} from '../../scripts/validate-story-content';
import type {
  ActFile,
  PersonaIndex,
  StoryIndex,
} from '../../scripts/validate-story-content';
import type { SceneType, CpuStage } from '../../src/story/content-types';

// ─── Test Helpers ────────────────────────────────────────────────────────────

function createAct(overrides: Partial<ActFile> = {}): ActFile {
  return {
    id: 'act-0',
    number: 0,
    title: 'Test Act',
    cpuStage: 'mechanical',
    chapters: [
      {
        id: 'chapter-0-1',
        number: 1,
        title: 'Test Chapter',
        year: '1971',
        scenes: [
          { id: 'scene-0-1-1', type: 'narrative', nextScene: 'scene-0-1-2' },
          { id: 'scene-0-1-2', type: 'dialogue' },
        ],
      },
    ],
    ...overrides,
  };
}

function createActMap(acts: Array<[string, ActFile]>): Map<string, ActFile> {
  return new Map(acts);
}

// ─── validateSceneReferences ─────────────────────────────────────────────────

describe('validateSceneReferences', () => {
  it('should pass with valid scene references', () => {
    const actFiles = createActMap([['act-0.json', createAct()]]);
    const result = validateSceneReferences(actFiles);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect broken nextScene reference', () => {
    const act = createAct({
      chapters: [{
        id: 'chapter-0-1', number: 1, title: 'Test', year: '1971',
        scenes: [
          { id: 'scene-0-1-1', type: 'narrative', nextScene: 'scene-does-not-exist' },
        ],
      }],
    });
    const actFiles = createActMap([['act-0.json', act]]);
    const result = validateSceneReferences(actFiles);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('BROKEN_REF');
    expect(result.errors[0]).toContain('scene-does-not-exist');
  });

  it('should detect broken choice.nextScene reference', () => {
    const act = createAct({
      chapters: [{
        id: 'chapter-0-1', number: 1, title: 'Test', year: '1971',
        scenes: [
          {
            id: 'scene-0-1-1', type: 'choice',
            choices: [
              { id: 'choice-a', nextScene: 'scene-nonexistent' },
            ],
          },
        ],
      }],
    });
    const actFiles = createActMap([['act-0.json', act]]);
    const result = validateSceneReferences(actFiles);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('choice "choice-a"');
    expect(result.errors[0]).toContain('scene-nonexistent');
  });

  it('should pass when choice.nextScene points to valid scene', () => {
    const act = createAct({
      chapters: [{
        id: 'chapter-0-1', number: 1, title: 'Test', year: '1971',
        scenes: [
          {
            id: 'scene-0-1-1', type: 'choice',
            choices: [
              { id: 'choice-a', nextScene: 'scene-0-1-2' },
            ],
          },
          { id: 'scene-0-1-2', type: 'narrative' },
        ],
      }],
    });
    const actFiles = createActMap([['act-0.json', act]]);
    const result = validateSceneReferences(actFiles);
    expect(result.errors).toHaveLength(0);
  });

  it('should allow act transition scenes to reference scenes in another act', () => {
    const act0 = createAct({
      chapters: [{
        id: 'chapter-0-1', number: 1, title: 'Test', year: '1971',
        scenes: [
          { id: 'scene-0-1-1', type: 'narrative', nextScene: 'scene-0-act-transition' },
          {
            id: 'scene-0-act-transition',
            type: 'transition',
            transition: { actTransition: true },
            nextScene: 'scene-1-1-1', // Points to next act
          },
        ],
      }],
    });
    const act1 = createAct({
      id: 'act-1',
      chapters: [{
        id: 'chapter-1-1', number: 1, title: 'Act 1 Ch1', year: '1890',
        scenes: [
          { id: 'scene-1-1-1', type: 'narrative' },
        ],
      }],
    });
    const actFiles = createActMap([['act-0.json', act0], ['act-1.json', act1]]);
    const result = validateSceneReferences(actFiles);
    expect(result.errors).toHaveLength(0);
  });

  it('should error when act transition references a scene that does not exist in any act', () => {
    const act = createAct({
      chapters: [{
        id: 'chapter-0-1', number: 1, title: 'Test', year: '1971',
        scenes: [
          {
            id: 'scene-0-act-transition',
            type: 'transition',
            transition: { actTransition: true },
            nextScene: 'scene-nonexistent-act',
          },
        ],
      }],
    });
    const actFiles = createActMap([['act-0.json', act]]);
    const result = validateSceneReferences(actFiles);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('BROKEN_REF');
    expect(result.errors[0]).toContain('does not exist in any act');
  });

  it('should allow scenes without nextScene', () => {
    const act = createAct({
      chapters: [{
        id: 'chapter-0-1', number: 1, title: 'Test', year: '1971',
        scenes: [
          { id: 'scene-0-1-1', type: 'narrative' }, // No nextScene — terminal scene
        ],
      }],
    });
    const actFiles = createActMap([['act-0.json', act]]);
    const result = validateSceneReferences(actFiles);
    expect(result.errors).toHaveLength(0);
  });
});

// ─── validatePersonaReferences ───────────────────────────────────────────────

describe('validatePersonaReferences', () => {
  it('should pass with valid persona references', () => {
    const act = createAct({ persona: { id: 'test-persona' } });
    const actFiles = createActMap([['act-0.json', act]]);
    const personaIndex: PersonaIndex = {
      personas: [{ id: 'test-persona', file: 'test-persona.json' }],
    };
    const filesOnDisk = ['test-persona.json'];
    const result = validatePersonaReferences(actFiles, personaIndex, filesOnDisk);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect missing persona file', () => {
    const actFiles = createActMap([['act-0.json', createAct()]]);
    const personaIndex: PersonaIndex = {
      personas: [{ id: 'missing', file: 'missing.json' }],
    };
    const filesOnDisk: string[] = []; // No files on disk
    const result = validatePersonaReferences(actFiles, personaIndex, filesOnDisk);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('MISSING_FILE');
    expect(result.errors[0]).toContain('missing.json');
  });

  it('should detect orphan persona file as warning', () => {
    const actFiles = createActMap([['act-0.json', createAct()]]);
    const personaIndex: PersonaIndex = { personas: [] };
    const filesOnDisk = ['orphan.json'];
    const result = validatePersonaReferences(actFiles, personaIndex, filesOnDisk);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('ORPHAN_FILE');
    expect(result.warnings[0]).toContain('orphan.json');
  });

  it('should detect missing act-level persona file', () => {
    const act = createAct({ persona: { id: 'no-file-persona' } });
    const actFiles = createActMap([['act-0.json', act]]);
    const personaIndex: PersonaIndex = { personas: [] };
    const filesOnDisk: string[] = [];
    const result = validatePersonaReferences(actFiles, personaIndex, filesOnDisk);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('MISSING_PERSONA');
    expect(result.errors[0]).toContain('no-file-persona');
  });

  it('should detect missing scene-level persona file', () => {
    const act = createAct({
      chapters: [{
        id: 'chapter-0-1', number: 1, title: 'Test', year: '1971',
        scenes: [
          { id: 'scene-0-1-1', type: 'persona', persona: { id: 'scene-persona' } },
        ],
      }],
    });
    const actFiles = createActMap([['act-0.json', act]]);
    const personaIndex: PersonaIndex = { personas: [] };
    const filesOnDisk: string[] = [];
    const result = validatePersonaReferences(actFiles, personaIndex, filesOnDisk);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('scene-persona');
  });
});

// ─── validateIndexCompleteness ───────────────────────────────────────────────

describe('validateIndexCompleteness', () => {
  it('should pass when index and files match', () => {
    const actFileNames = new Set(['act-0.json', 'act-1.json']);
    const storyIndex: StoryIndex = {
      actIndex: [
        { number: 0, id: 'act-0', title: 'Act 0', era: '3000 BC', file: 'act-0.json', cpuStage: 'mechanical', summary: 'Test' },
        { number: 1, id: 'act-1', title: 'Act 1', era: '1890s', file: 'act-1.json', cpuStage: 'relay', summary: 'Test' },
      ],
    };
    const result = validateIndexCompleteness(actFileNames, storyIndex);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect missing act file referenced by index', () => {
    const actFileNames = new Set<string>(); // No files
    const storyIndex: StoryIndex = {
      actIndex: [
        { number: 0, id: 'act-0', title: 'Act 0', era: '3000 BC', file: 'act-0.json', cpuStage: 'mechanical', summary: 'Test' },
      ],
    };
    const result = validateIndexCompleteness(actFileNames, storyIndex);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('MISSING_ACT');
  });

  it('should detect unindexed act file', () => {
    const actFileNames = new Set(['act-0.json', 'act-extra.json']);
    const storyIndex: StoryIndex = {
      actIndex: [
        { number: 0, id: 'act-0', title: 'Act 0', era: '3000 BC', file: 'act-0.json', cpuStage: 'mechanical', summary: 'Test' },
      ],
    };
    const result = validateIndexCompleteness(actFileNames, storyIndex);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('UNINDEXED_ACT');
    expect(result.errors[0]).toContain('act-extra.json');
  });
});

// ─── validateChapterIntegrity ────────────────────────────────────────────────

describe('validateChapterIntegrity', () => {
  it('should pass with sequential integer chapter numbers', () => {
    const act = createAct({
      chapters: [
        { id: 'ch-1', number: 1, title: 'Ch1', year: '1971', scenes: [{ id: 's1', type: 'narrative' }] },
        { id: 'ch-2', number: 2, title: 'Ch2', year: '1972', scenes: [{ id: 's2', type: 'narrative' }] },
        { id: 'ch-3', number: 3, title: 'Ch3', year: '1973', scenes: [{ id: 's3', type: 'narrative' }] },
      ],
    });
    const actFiles = createActMap([['act-0.json', act]]);
    const result = validateChapterIntegrity(actFiles);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('should detect float chapter number', () => {
    const act = createAct({
      chapters: [
        { id: 'ch-1', number: 1, title: 'Ch1', year: '1971', scenes: [{ id: 's1', type: 'narrative' }] },
        { id: 'ch-1b', number: 1.5, title: 'Ch1b', year: '1971', scenes: [{ id: 's2', type: 'narrative' }] },
      ],
    });
    const actFiles = createActMap([['act-0.json', act]]);
    const result = validateChapterIntegrity(actFiles);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('FLOAT_CHAPTER');
    expect(result.errors[0]).toContain('1.5');
  });

  it('should detect duplicate chapter number', () => {
    const act = createAct({
      chapters: [
        { id: 'ch-1', number: 1, title: 'Ch1', year: '1971', scenes: [{ id: 's1', type: 'narrative' }] },
        { id: 'ch-2', number: 1, title: 'Ch2', year: '1972', scenes: [{ id: 's2', type: 'narrative' }] },
      ],
    });
    const actFiles = createActMap([['act-0.json', act]]);
    const result = validateChapterIntegrity(actFiles);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('DUPLICATE_CHAPTER');
  });

  it('should warn about chapter number gaps', () => {
    const act = createAct({
      chapters: [
        { id: 'ch-1', number: 1, title: 'Ch1', year: '1971', scenes: [{ id: 's1', type: 'narrative' }] },
        { id: 'ch-3', number: 3, title: 'Ch3', year: '1973', scenes: [{ id: 's2', type: 'narrative' }] },
      ],
    });
    const actFiles = createActMap([['act-0.json', act]]);
    const result = validateChapterIntegrity(actFiles);
    expect(result.errors).toHaveLength(0); // Gaps are warnings, not errors
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('CHAPTER_GAP');
  });
});

// ─── validateSchemaAlignment ─────────────────────────────────────────────────

describe('validateSchemaAlignment', () => {
  it('should pass with valid scene types and cpuStage', () => {
    const act = createAct({
      cpuStage: 'micro4',
      chapters: [{
        id: 'ch-1', number: 1, title: 'Ch1', year: '1971',
        scenes: [
          { id: 's1', type: 'narrative' },
          { id: 's2', type: 'choice' },
          { id: 's3', type: 'persona' },
        ],
      }],
    });
    const actFiles = createActMap([['act-0.json', act]]);
    const result = validateSchemaAlignment(actFiles);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect invalid scene type', () => {
    const act = createAct({
      chapters: [{
        id: 'ch-1', number: 1, title: 'Ch1', year: '1971',
        scenes: [
          { id: 's1', type: 'unknown_type' },
        ],
      }],
    });
    const actFiles = createActMap([['act-0.json', act]]);
    const result = validateSchemaAlignment(actFiles);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('INVALID_SCENE_TYPE');
    expect(result.errors[0]).toContain('unknown_type');
  });

  it('should detect invalid cpuStage', () => {
    const act = createAct({ cpuStage: 'nonexistent_stage' });
    const actFiles = createActMap([['act-0.json', act]]);
    const result = validateSchemaAlignment(actFiles);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('INVALID_CPU_STAGE');
    expect(result.errors[0]).toContain('nonexistent_stage');
  });

  it('should accept all valid scene types', () => {
    const scenes = VALID_SCENE_TYPES.map((type, i) => ({
      id: `s${i}`, type,
    }));
    const act = createAct({
      chapters: [{
        id: 'ch-1', number: 1, title: 'Ch1', year: '1971',
        scenes,
      }],
    });
    const actFiles = createActMap([['act-0.json', act]]);
    const result = validateSchemaAlignment(actFiles);
    expect(result.errors).toHaveLength(0);
  });

  it('should accept all valid cpuStage values', () => {
    for (const stage of VALID_CPU_STAGES) {
      const act = createAct({ cpuStage: stage });
      const actFiles = createActMap([['act-0.json', act]]);
      const result = validateSchemaAlignment(actFiles);
      expect(result.errors).toHaveLength(0);
    }
  });
});

// ─── collectAllSceneIds ──────────────────────────────────────────────────────

describe('collectAllSceneIds', () => {
  it('should collect scene IDs across chapters', () => {
    const act = createAct({
      chapters: [
        {
          id: 'ch-1', number: 1, title: 'Ch1', year: '1971',
          scenes: [{ id: 'scene-a', type: 'narrative' }, { id: 'scene-b', type: 'dialogue' }],
        },
        {
          id: 'ch-2', number: 2, title: 'Ch2', year: '1972',
          scenes: [{ id: 'scene-c', type: 'choice' }],
        },
      ],
    });
    const ids = collectAllSceneIds(act);
    expect(ids.size).toBe(3);
    expect(ids.has('scene-a')).toBe(true);
    expect(ids.has('scene-b')).toBe(true);
    expect(ids.has('scene-c')).toBe(true);
  });
});

// ─── Type Sync Guards ───────────────────────────────────────────────────────

describe('type sync guards', () => {
  it('VALID_SCENE_TYPES should contain exactly the right number of scene types', () => {
    // SceneType has 8 members — if this breaks, a type was added/removed
    expect(VALID_SCENE_TYPES).toHaveLength(8);
  });

  it('VALID_CPU_STAGES should contain exactly the right number of cpu stages', () => {
    // CpuStage has 11 members — if this breaks, a stage was added/removed
    expect(VALID_CPU_STAGES).toHaveLength(11);
  });

  it('VALID_SCENE_TYPES should be assignable to SceneType[]', () => {
    // Compile-time check: if VALID_SCENE_TYPES contains invalid values, this won't compile
    const check: readonly SceneType[] = VALID_SCENE_TYPES;
    expect(check).toBe(VALID_SCENE_TYPES);
  });

  it('VALID_CPU_STAGES should be assignable to CpuStage[]', () => {
    // Compile-time check: if VALID_CPU_STAGES contains invalid values, this won't compile
    const check: readonly CpuStage[] = VALID_CPU_STAGES;
    expect(check).toBe(VALID_CPU_STAGES);
  });
});

// ─── validatePersonaFileStructure ───────────────────────────────────────────

describe('validatePersonaFileStructure', () => {
  function createValidPersona(): Record<string, unknown> {
    return {
      id: 'test-persona',
      name: 'Test Person',
      years: '1900-2000',
      era: '1950s',
      avatar: 'T',
      quote: 'Test quote',
      background: 'Test background',
      motivation: 'Test motivation',
      constraints: [
        { type: 'technical', description: 'Test constraint' },
      ],
      problem: 'Test problem',
    };
  }

  it('should pass with valid persona file', () => {
    const personaFiles = new Map([['test.json', createValidPersona()]]);
    const result = validatePersonaFileStructure(personaFiles);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect missing required field', () => {
    const persona = createValidPersona();
    delete persona.name;
    const personaFiles = new Map([['test.json', persona]]);
    const result = validatePersonaFileStructure(personaFiles);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('MISSING_FIELD');
    expect(result.errors[0]).toContain('"name"');
  });

  it('should detect multiple missing fields', () => {
    const persona = createValidPersona();
    delete persona.name;
    delete persona.avatar;
    delete persona.quote;
    const personaFiles = new Map([['test.json', persona]]);
    const result = validatePersonaFileStructure(personaFiles);
    expect(result.errors).toHaveLength(3);
  });

  it('should detect invalid constraint type', () => {
    const persona = createValidPersona();
    persona.constraints = [
      { type: 'invalid_type', description: 'Bad constraint' },
    ];
    const personaFiles = new Map([['test.json', persona]]);
    const result = validatePersonaFileStructure(personaFiles);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('INVALID_CONSTRAINT_TYPE');
    expect(result.errors[0]).toContain('invalid_type');
  });

  it('should accept all valid constraint types', () => {
    const persona = createValidPersona();
    persona.constraints = VALID_PERSONA_CONSTRAINT_TYPES.map((type) => ({
      type,
      description: `${type} constraint`,
    }));
    const personaFiles = new Map([['test.json', persona]]);
    const result = validatePersonaFileStructure(personaFiles);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate all required persona fields exist', () => {
    const emptyPersona: Record<string, unknown> = {};
    const personaFiles = new Map([['empty.json', emptyPersona]]);
    const result = validatePersonaFileStructure(personaFiles);
    expect(result.errors).toHaveLength(REQUIRED_PERSONA_FIELDS.length);
    for (const field of REQUIRED_PERSONA_FIELDS) {
      expect(result.errors.some((e) => e.includes(`"${field}"`))).toBe(true);
    }
  });

  it('should validate multiple persona files independently', () => {
    const good = createValidPersona();
    const bad = createValidPersona();
    delete bad.id;
    const personaFiles = new Map([
      ['good.json', good],
      ['bad.json', bad],
    ]);
    const result = validatePersonaFileStructure(personaFiles);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('bad.json');
  });
});
