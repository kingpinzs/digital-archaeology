/**
 * Static content validation script for Digital Archaeology story JSON files.
 *
 * Validates:
 * - Scene reference integrity (nextScene IDs exist within the same act)
 * - Choice reference integrity (choice.nextScene IDs exist within the same act)
 * - Persona file references (persona IDs have corresponding JSON files)
 * - Index completeness (story-content.json matches actual act files)
 * - Chapter integrity (no floats, no duplicates, sequential numbering)
 * - Schema alignment (scene types and cpuStage values match TypeScript types)
 *
 * Run: npx tsx scripts/validate-story-content.ts
 * Or:  npm run validate:content
 *
 * Exit 0 = all checks pass, Exit 1 = validation errors found.
 *
 * Story TD-3: Content Audit & Schema Enforcement
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { SceneType, CpuStage } from '../src/story/content-types';

// ─── Constants (typed against content-types.ts for compile-time safety) ──────

export const VALID_SCENE_TYPES: readonly SceneType[] = [
  'narrative', 'dialogue', 'choice', 'challenge',
  'persona', 'transition', 'decision', 'builder',
] as const;

export const VALID_CPU_STAGES: readonly CpuStage[] = [
  'mechanical', 'relay', 'vacuum', 'transistor',
  'micro4', 'micro8', 'micro16', 'micro32',
  'micro32p', 'micro32s', 'future',
] as const;

export const VALID_PERSONA_CONSTRAINT_TYPES = [
  'technical', 'economic', 'political', 'knowledge', 'material',
] as const;

export const REQUIRED_PERSONA_FIELDS = [
  'id', 'name', 'years', 'era', 'avatar', 'quote',
  'background', 'motivation', 'constraints', 'problem',
] as const;

// ─── Types for JSON structures ───────────────────────────────────────────────

export interface ActFile {
  id: string;
  number: number;
  title: string;
  cpuStage: string;
  persona?: { id: string };
  chapters: ChapterData[];
}

export interface ChapterData {
  id: string;
  number: number;
  title: string;
  year: string;
  scenes: SceneData[];
}

export interface SceneData {
  id: string;
  type: string;
  nextScene?: string;
  choices?: ChoiceData[];
  persona?: { id: string };
}

export interface ChoiceData {
  id: string;
  nextScene?: string;
}

interface ActFileWrapper {
  version: string;
  metadata: { title: string; author: string; lastUpdated: string };
  acts: ActFile[];
}

export interface StoryIndex {
  version?: string;
  metadata?: { title: string; author: string; lastUpdated: string };
  actIndex: ActIndexEntry[];
  roadsNotTaken?: Array<{ id: string; visionary: string; year: number; idea: string; barrier: string; linkedAct: number }>;
}

export interface ActIndexEntry {
  number: number;
  id: string;
  title: string;
  era: string;
  file: string;
  cpuStage: string;
  summary: string;
}

export interface PersonaIndex {
  personas: PersonaIndexEntry[];
}

export interface PersonaIndexEntry {
  id: string;
  file: string;
}

export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

// ─── Pure Validators (testable, no I/O) ─────────────────────────────────────

export function collectAllSceneIds(act: ActFile): Set<string> {
  const ids = new Set<string>();
  for (const chapter of act.chapters) {
    for (const scene of chapter.scenes) {
      ids.add(scene.id);
    }
  }
  return ids;
}

export function validateSceneReferences(
  actFiles: Map<string, ActFile>,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const [fileName, act] of actFiles) {
    const allSceneIds = collectAllSceneIds(act);

    for (const chapter of act.chapters) {
      for (const scene of chapter.scenes) {
        if (scene.nextScene && !allSceneIds.has(scene.nextScene)) {
          errors.push(
            `BROKEN_REF: ${fileName} > scene "${scene.id}" references nextScene "${scene.nextScene}" which does not exist in this act`,
          );
        }

        if (scene.choices) {
          for (const choice of scene.choices) {
            if (choice.nextScene && !allSceneIds.has(choice.nextScene)) {
              errors.push(
                `BROKEN_REF: ${fileName} > scene "${scene.id}" > choice "${choice.id}" references nextScene "${choice.nextScene}" which does not exist in this act`,
              );
            }
          }
        }
      }
    }
  }

  return { errors, warnings };
}

export function validatePersonaReferences(
  actFiles: Map<string, ActFile>,
  personaIndex: PersonaIndex,
  personaFilesOnDisk: string[],
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const onDiskSet = new Set(personaFilesOnDisk);

  // Every persona in index has a file on disk
  for (const entry of personaIndex.personas) {
    if (!onDiskSet.has(entry.file)) {
      errors.push(
        `MISSING_FILE: personas/index.json references "${entry.file}" but file does not exist`,
      );
    }
  }

  // Every file on disk is in the index
  const indexedFiles = new Set(personaIndex.personas.map((p) => p.file));
  for (const file of personaFilesOnDisk) {
    if (!indexedFiles.has(file)) {
      warnings.push(
        `ORPHAN_FILE: personas/${file} exists on disk but is not referenced in personas/index.json`,
      );
    }
  }

  // Act-level persona IDs have corresponding files
  for (const [fileName, act] of actFiles) {
    if (act.persona?.id) {
      const expectedFile = `${act.persona.id}.json`;
      if (!onDiskSet.has(expectedFile)) {
        errors.push(
          `MISSING_PERSONA: ${fileName} references act-level persona "${act.persona.id}" but personas/${expectedFile} does not exist`,
        );
      }
    }

    for (const chapter of act.chapters) {
      for (const scene of chapter.scenes) {
        if (scene.type === 'persona' && scene.persona?.id) {
          const expectedFile = `${scene.persona.id}.json`;
          if (!onDiskSet.has(expectedFile)) {
            errors.push(
              `MISSING_PERSONA: ${fileName} > scene "${scene.id}" references persona "${scene.persona.id}" but personas/${expectedFile} does not exist`,
            );
          }
        }
      }
    }
  }

  return { errors, warnings };
}

export function validateIndexCompleteness(
  actFileNames: Set<string>,
  storyIndex: StoryIndex,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const indexedFiles = new Set(storyIndex.actIndex.map((a) => a.file));

  for (const entry of storyIndex.actIndex) {
    if (!actFileNames.has(entry.file)) {
      errors.push(
        `MISSING_ACT: story-content.json references "${entry.file}" but file does not exist`,
      );
    }
  }

  for (const file of actFileNames) {
    if (!indexedFiles.has(file)) {
      errors.push(
        `UNINDEXED_ACT: "${file}" exists but is not referenced in story-content.json`,
      );
    }
  }

  return { errors, warnings };
}

export function validateChapterIntegrity(
  actFiles: Map<string, ActFile>,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const [fileName, act] of actFiles) {
    const chapterNumbers: number[] = [];

    for (const chapter of act.chapters) {
      if (!Number.isInteger(chapter.number)) {
        errors.push(
          `FLOAT_CHAPTER: ${fileName} > chapter "${chapter.id}" has non-integer number ${chapter.number}`,
        );
      }

      if (chapterNumbers.includes(chapter.number)) {
        errors.push(
          `DUPLICATE_CHAPTER: ${fileName} > chapter "${chapter.id}" has duplicate number ${chapter.number}`,
        );
      }

      chapterNumbers.push(chapter.number);
    }

    const sorted = [...chapterNumbers].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      const gap = sorted[i] - sorted[i - 1];
      if (gap > 1) {
        warnings.push(
          `CHAPTER_GAP: ${fileName} has gap in chapter numbers: ${sorted[i - 1]} → ${sorted[i]}`,
        );
      }
    }
  }

  return { errors, warnings };
}

export function validateSchemaAlignment(
  actFiles: Map<string, ActFile>,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const validSceneTypes = new Set<string>(VALID_SCENE_TYPES);
  const validCpuStages = new Set<string>(VALID_CPU_STAGES);

  for (const [fileName, act] of actFiles) {
    if (!validCpuStages.has(act.cpuStage)) {
      errors.push(
        `INVALID_CPU_STAGE: ${fileName} has cpuStage "${act.cpuStage}" which is not in the valid set: [${VALID_CPU_STAGES.join(', ')}]`,
      );
    }

    for (const chapter of act.chapters) {
      for (const scene of chapter.scenes) {
        if (!validSceneTypes.has(scene.type)) {
          errors.push(
            `INVALID_SCENE_TYPE: ${fileName} > scene "${scene.id}" has type "${scene.type}" which is not in the valid set: [${VALID_SCENE_TYPES.join(', ')}]`,
          );
        }
      }
    }
  }

  return { errors, warnings };
}

export function validatePersonaFileStructure(
  personaFiles: Map<string, Record<string, unknown>>,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const validConstraintTypes = new Set<string>(VALID_PERSONA_CONSTRAINT_TYPES);

  for (const [fileName, persona] of personaFiles) {
    // Check required fields
    for (const field of REQUIRED_PERSONA_FIELDS) {
      if (!(field in persona) || persona[field] === undefined || persona[field] === null) {
        errors.push(
          `MISSING_FIELD: personas/${fileName} is missing required field "${field}"`,
        );
      }
    }

    // Check constraint types
    if (Array.isArray(persona.constraints)) {
      for (const constraint of persona.constraints) {
        if (constraint && typeof constraint === 'object' && 'type' in constraint) {
          const cType = (constraint as Record<string, unknown>).type;
          if (typeof cType === 'string' && !validConstraintTypes.has(cType)) {
            errors.push(
              `INVALID_CONSTRAINT_TYPE: personas/${fileName} has constraint type "${cType}" which is not in the valid set: [${VALID_PERSONA_CONSTRAINT_TYPES.join(', ')}]`,
            );
          }
        }
      }
    }
  }

  return { errors, warnings };
}

// ─── I/O Layer (used only when run as script) ────────────────────────────────

function loadJson<T>(filePath: string): T {
  const raw = readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as T;
}

function loadAllActFiles(storyDir: string): { actFiles: Map<string, ActFile>; loadErrors: string[] } {
  const actFiles = new Map<string, ActFile>();
  const loadErrors: string[] = [];
  const files = readdirSync(storyDir).filter(
    (f) => f.startsWith('act-') && f.endsWith('.json'),
  );
  for (const file of files) {
    try {
      const fullPath = join(storyDir, file);
      const wrapper = loadJson<ActFileWrapper>(fullPath);
      if (!wrapper.acts || wrapper.acts.length === 0) {
        loadErrors.push(`EMPTY_ACT: ${file} contains no acts`);
        continue;
      }
      actFiles.set(file, wrapper.acts[0]);
    } catch (err) {
      loadErrors.push(`PARSE_ERROR: ${file} failed to parse: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return { actFiles, loadErrors };
}

function loadStoryIndex(storyDir: string): StoryIndex {
  return loadJson<StoryIndex>(join(storyDir, 'story-content.json'));
}

function loadPersonaIndex(storyDir: string): { index: PersonaIndex; filesOnDisk: string[] } {
  const personaDir = join(storyDir, 'personas');
  const indexPath = join(personaDir, 'index.json');

  const index = existsSync(indexPath)
    ? loadJson<PersonaIndex>(indexPath)
    : { personas: [] };

  const filesOnDisk = existsSync(personaDir)
    ? readdirSync(personaDir).filter((f) => f.endsWith('.json') && f !== 'index.json')
    : [];

  return { index, filesOnDisk };
}

function loadPersonaFiles(
  storyDir: string,
  filenames: string[],
): { personaFiles: Map<string, Record<string, unknown>>; loadErrors: string[] } {
  const personaDir = join(storyDir, 'personas');
  const personaFiles = new Map<string, Record<string, unknown>>();
  const loadErrors: string[] = [];

  for (const file of filenames) {
    try {
      const data = loadJson<Record<string, unknown>>(join(personaDir, file));
      personaFiles.set(file, data);
    } catch (err) {
      loadErrors.push(`PARSE_ERROR: personas/${file} failed to parse: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { personaFiles, loadErrors };
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main(): void {
  const storyDir = resolve(
    import.meta.dirname ?? '.',
    '../public/story',
  );

  console.log('Validating story content...\n');

  const { actFiles, loadErrors } = loadAllActFiles(storyDir);
  const storyIndex = loadStoryIndex(storyDir);
  const { index: personaIndex, filesOnDisk: personaFiles } = loadPersonaIndex(storyDir);
  const { personaFiles: personaFileContents, loadErrors: personaLoadErrors } = loadPersonaFiles(storyDir, personaFiles);

  console.log(`  Found ${actFiles.size} act files`);
  console.log(`  Found ${storyIndex.actIndex.length} acts in index`);
  console.log(`  Found ${personaIndex.personas.length} personas in index`);
  console.log(`  Found ${personaFileContents.size} persona files loaded\n`);

  // Collect all results
  const allErrors: string[] = [...loadErrors, ...personaLoadErrors];
  const allWarnings: string[] = [];

  const results = [
    validateSceneReferences(actFiles),
    validatePersonaReferences(actFiles, personaIndex, personaFiles),
    validateIndexCompleteness(new Set(actFiles.keys()), storyIndex),
    validateChapterIntegrity(actFiles),
    validateSchemaAlignment(actFiles),
    validatePersonaFileStructure(personaFileContents),
  ];

  for (const result of results) {
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
  }

  // Report
  if (allWarnings.length > 0) {
    console.log(`Warnings (${allWarnings.length}):`);
    for (const w of allWarnings) {
      console.log(`  ⚠ ${w}`);
    }
    console.log('');
  }

  if (allErrors.length > 0) {
    console.log(`ERRORS (${allErrors.length}):`);
    for (const e of allErrors) {
      console.log(`  ✗ ${e}`);
    }
    console.log(`\nValidation FAILED with ${allErrors.length} error(s).`);
    process.exit(1);
  }

  console.log('All content validation checks passed.');
  process.exit(0);
}

// Only run main when executed as a script (not when imported for testing)
const isDirectRun = import.meta.url === `file://${process.argv[1]}`;
if (isDirectRun) {
  main();
}
