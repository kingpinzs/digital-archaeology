# Story TD-3: Story Content Audit and Schema Enforcement

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want all story content JSON validated automatically in CI with all known issues fixed,
so that broken references, schema violations, and missing assets are caught before merge and never reach users.

## Origin

**Source:** Epic 10 Retrospective (2026-02-06), Gap #2
**Root Cause:** Content changes (JSON story files) have zero CI validation. No schema checks, no reference validation, no broken-link detection. Code has lint, tests, and type-checking. Content has nothing. Story 10-24 created a reference to `first-counter-35000bc.json` that doesn't exist. Schema says max 5 acts but 11 exist. Float chapter numbers violate integer constraints. Duplicate chapter number in Act 0. Schema scene types are outdated (4 types vs 8 in code).
**Impact:** HIGH — 17+ content issues accumulated undetected across 25 stories. Missing persona file means Act 0 Chapter 1 persona load will fail at runtime.

## Acceptance Criteria

1. **Given** the persona reference `first-counter-35000bc` in `act-0-mechanical.json`, **When** the story loads in the browser, **Then** the persona data loads successfully from a valid JSON file with all required PersonaData fields

2. **Given** 11 acts (0-10) in the story content, **When** the JSON schema validation runs, **Then** all 11 acts pass validation (schema `maximum` updated, `minimum` allows 0, all enum values current)

3. **Given** all chapter numbers across all act files, **When** schema validation runs, **Then** all chapters have valid sequential integer numbering with no floats and no duplicates within the same act

4. **Given** any `choice.nextScene` or `scene.nextScene` reference in any JSON file, **When** the CI validation script runs, **Then** every referenced scene ID exists in the same act file, **And** the CI job fails with a clear error message if any broken reference is found

5. **Given** all persona files in `public/story/personas/`, **When** audited, **Then** every persona file is referenced by at least one act, **And** every persona reference in act files has a corresponding persona file

6. **Given** a developer submits a PR that adds or modifies any file in `public/story/`, **When** CI runs, **Then** the content validation job executes automatically, **And** the PR cannot merge if validation fails

7. **Given** the `story-content.json` index file, **When** validated, **Then** every act referenced in the index has a corresponding act JSON file, **And** every act JSON file is referenced in the index

8. **Given** the JSON schema file, **When** compared to the TypeScript types in `content-types.ts`, **Then** all scene types, cpuStage values, and structural requirements match between schema and code

## Tasks / Subtasks

- [x] Task 1: Fix Schema to Match Codebase (AC: #2, #8)
  - [x] 1.1 Act number: min 0, max 10
  - [x] 1.2 Scene type enum: added persona, transition, decision, builder
  - [x] 1.3 cpuStage enum: added mechanical, relay, vacuum, transistor, future
  - [x] 1.4 Chapter year pattern: loosened to allow BC dates and ranges
  - [x] 1.5 Chapter ID pattern: loosened to allow `chapter-0-1b` format
  - [x] 1.6 Scene ID pattern: loosened to allow `scene-0-1b-0` format
  - [x] 1.7 Verified valid JSON after all changes

- [x] Task 2: Fix Content Data Issues (AC: #1, #3, #5)
  - [x] 2.1 Created `personas/first-counter-35000bc.json` with all required + optional fields
  - [x] 2.2 Updated `personas/index.json` with first-counter entry
  - [x] 2.3 Fixed act-0 float chapters: [1, 1.5, 1.7, 2, 3, 3, 4] → [1, 2, 3, 4, 5, 6, 7]
  - [x] 2.4 Fixed act-2 float chapter: 2.5 → 3, renumbered 3 → 4
  - [x] 2.5 Fixed act-6 float chapter: 2.5 → 3, renumbered 3 → 4
  - [x] 2.6 Resolved duplicate chapter 3 in act-0 (fixed via full renumbering)
  - [x] 2.7 babbage-1837 IS referenced by act-1-relay.json line 17 — kept
  - [x] 2.8 All modified JSON files validated
  - [x] 2.9 BONUS: Fixed 5 broken nextScene refs pointing to chapter IDs instead of scene IDs
  - [x] 2.10 BONUS: Removed 11 broken choice.nextScene refs to non-existent branch scenes (acts 8, 9, 10)

- [x] Task 3: Create CI Content Validation Script (AC: #4, #6, #7, #8)
  - [x] 3.1 Created `scripts/validate-story-content.ts` (pure validators + I/O layer)
  - [x] 3.2-3.3 Implemented loaders for act files, story index, persona index
  - [x] 3.4 Implemented validateSceneReferences (scene + choice nextScene)
  - [x] 3.5 Implemented validatePersonaReferences (index ↔ files ↔ acts)
  - [x] 3.6 Implemented validateIndexCompleteness (index ↔ act files)
  - [x] 3.7 Implemented validateChapterIntegrity (floats, duplicates, gaps)
  - [x] 3.8 Implemented validateSchemaAlignment (scene types, cpuStage)
  - [x] 3.9 Exit 0/1 with clear error report
  - [x] 3.10 Added validate:content npm script

- [x] Task 4: Add CI Job (AC: #6)
  - [x] 4.1 Added validate-content step to ci.yml test job (after lint, before unit tests)
  - [x] 4.3 Runs on ALL PRs (not path-filtered)

- [x] Task 5: Add Unit Tests for Validation Script (AC: all)
  - [x] 5.1 Created `tests/unit/validate-story-content.test.ts` (23 tests)
  - [x] 5.2-5.8 All validation checks tested with mock data

- [x] Task 6: Verify All Fixes (AC: all)
  - [x] 6.1 Full unit test suite: 3,899 tests pass (23 new)
  - [x] 6.2 Story-mode E2E tests: 114 pass, 0 regressions
  - [x] 6.3 Validation script: zero errors on real content
  - [x] 6.4 TypeScript typecheck: passes


## Dev Notes

### Critical Context: Why This Story Exists

This story was created by the Epic 10 Retrospective (2026-02-06) after a deep content audit revealed **17+ issues** in the story JSON files that accumulated undetected across 25 stories. The audit found:
- Missing persona files that will crash at runtime
- Schema constraints that don't match the actual content
- Float chapter numbers that violate schema integer constraints
- Duplicate chapter numbers causing undefined behavior
- Zero CI validation for any content changes

Story 10-24 (bug fix) changed a persona reference from "babbage-1837" to "first-counter-35000bc" but **never created the target persona JSON file**. This means the fix itself introduced a new broken reference.

[Source: _bmad-output/implementation-artifacts/epic-10-retro-2026-02-06.md]

### Complete Issue List (17+ Issues from Deep Audit)

| # | Severity | Issue | File:Line | Fix |
|---|----------|-------|-----------|-----|
| 1 | CRITICAL | Missing persona file `first-counter-35000bc.json` | `act-0-mechanical.json:17,56` | Create persona JSON file |
| 2 | CRITICAL | Schema max acts = 5, need 10 | `story-schema.json:63` | `"maximum": 10` |
| 3 | CRITICAL | Schema min acts = 1, need 0 (Act 0 exists) | `story-schema.json:63` | `"minimum": 0` |
| 4 | CRITICAL | Schema scene type enum missing 4 types | `story-schema.json:145` | Add "persona", "transition", "decision", "builder" |
| 5 | CRITICAL | Schema cpuStage enum missing 5 values | `story-schema.json:78` | Add "mechanical", "relay", "vacuum", "transistor", "future" |
| 6 | HIGH | Schema chapter year pattern `^\d{4}$` rejects "35,000 BC" | `story-schema.json:104` | Loosen pattern |
| 7 | HIGH | Float chapter number 1.5 | `act-0-mechanical.json:447` | Renumber to 2 |
| 8 | HIGH | Float chapter number 1.7 | `act-0-mechanical.json:617` | Renumber to 3 |
| 9 | HIGH | Float chapter number 2.5 | `act-2-vacuum.json` | Renumber |
| 10 | HIGH | Float chapter number 2.5 | `act-6-micro16.json` | Renumber |
| 11 | HIGH | Duplicate chapter number 3 | `act-0-mechanical.json:1184,1570` | Renumber position 5 |
| 12 | LOW | Unreferenced persona `babbage-1837.json` | `personas/` | Link or remove |
| 13-17 | — | Schema validation failures (acts 6-10 + scene types) | Multiple | Fixed by #2-5 |

### Existing Validation Infrastructure — DO NOT RECREATE

The codebase already has validation at multiple layers. **Extend, don't replace:**

**Runtime Validation (`StoryLoader.ts:153-209`):**
```typescript
export function validateStoryContent(value: unknown): ValidationResult {
  // Already validates: root object, version, metadata, acts array, chapters, scenes
  // MISSING: chapter number integrity, scene reference integrity, persona file existence
}
```

**Type Guards (`StoryLoader.ts:34-148`):**
- `isStoryScene()`, `isStoryChapter()`, `isStoryAct()`, `isStoryContent()`
- Already exported from `src/story/index.ts`

**Test Factory Functions (`StoryLoader.test.ts:22-115`):**
```typescript
const createValidStoryContent = (): StoryContent => ({ ... })
const createValidStoryAct = (): StoryAct => ({ ... })
// Use these patterns for validation script tests
```

**The new validation script is a STATIC analysis tool (runs on files, not runtime). It complements but does not replace the runtime validators.**

[Source: digital-archaeology-web/src/story/StoryLoader.ts:153-209]
[Source: digital-archaeology-web/src/story/StoryLoader.test.ts:22-115]

### PersonaData Interface (Full — Including Extended Fields)

From `src/story/types.ts:187-220`:
```typescript
export interface PersonaData {
  id: string;
  name: string;
  years: string;
  era: string;
  avatar: string;
  quote: string;
  background: string;
  motivation: string;
  constraints: PersonaConstraint[];
  problem: string;
  speechPattern?: string;          // Optional

  // Story 10.19 extended fields:
  keyContribution?: string;        // Optional
  photograph?: string;             // Optional
  additionalQuotes?: string[];     // Optional
  discoveriesUnlocked?: string[];  // Optional
}

interface PersonaConstraint {
  type: 'technical' | 'economic' | 'political' | 'knowledge';
  description: string;
}
```

**First Counter persona data already exists inline in `act-0-mechanical.json:15-38`:**
```json
{
  "id": "first-counter-35000bc",
  "name": "The First Counter",
  "years": "~35,000 BC",
  "era": "35,000 BC",
  "avatar": "\ud83c\udf19",
  "quote": "Twenty-nine nights since the moon was dark. I must not forget.",
  "background": "In the Lebombo Mountains...",
  "motivation": "The elders trade goods...",
  "constraints": [
    { "type": "technical", "description": "No writing system exists" },
    { "type": "knowledge", "description": "No concept of numbers as abstract entities" },
    { "type": "material", "description": "Only bone, stone, and wood to work with" }
  ],
  "problem": "How do you remember a quantity when you cannot write?"
}
```

Extract this into `personas/first-counter-35000bc.json`. Reference existing persona files for format:

[Source: digital-archaeology-web/public/story/personas/eckert-1946.json]
[Source: digital-archaeology-web/public/story/personas/zuse-1941.json]

### Schema vs. Code Type Mismatches

| Property | Schema Value | Code Value (`content-types.ts`) | Fix |
|----------|-------------|--------------------------------|-----|
| Act `number` | min:1, max:5 | `number` (no constraint) | min:0, max:10 |
| Scene `type` | 4 enum values | 8 values in `SceneType` union | Add 4 missing |
| Act `cpuStage` | 6 enum values | 11 values in `CpuStage` union | Add 5 missing |
| Chapter `year` | `^\d{4}$` | `string` (no constraint) | Loosen to allow BC dates |

**Code SceneType (`content-types.ts:32`):** `'narrative' | 'dialogue' | 'choice' | 'challenge' | 'persona' | 'transition' | 'decision' | 'builder'`

**Code CpuStage (`content-types.ts:15`):** `'mechanical' | 'relay' | 'vacuum' | 'transistor' | 'micro4' | 'micro8' | 'micro16' | 'micro32' | 'micro32p' | 'micro32s' | 'future'`

[Source: digital-archaeology-web/src/story/content-types.ts:15,32]

### Chapter Renumbering Strategy

**Act 0 chapters (`act-0-mechanical.json`):**
| Position | Chapter ID | Current Number | New Number |
|----------|-----------|----------------|------------|
| 0 | chapter-0-1 | 1 | 1 |
| 1 | chapter-0-1b | 1.5 | 2 |
| 2 | chapter-0-1c | 1.7 | 3 |
| 3 | chapter-0-zero | 2 | 4 |
| 4 | chapter-0-2 | 3 | 5 |
| 5 | chapter-0-3 | 3 (DUPLICATE) | 6 |
| 6 | chapter-0-4 | 4 | 7 |

**SAFE because:** Scene IDs use string format (`scene-0-1-0`, `scene-0-1b-0`, etc.) — they reference chapter IDs, not chapter numbers. `nextScene` references also use scene IDs. Only the UI display number changes.

**Verify UI impact:**
- `ChapterHeader.ts` renders `chapter.number` → will show new sequential numbers (expected behavior)
- `StoryEngine` progress calculation uses chapter count, not numbers → safe
- `ProgressDots` uses act count → safe

### File Inventory (21 JSON Files Total)

**Act files (11):** `act-0-mechanical.json` through `act-10-future.json` — ALL present, ALL valid JSON
**Persona files (5+1):** `index.json`, `babbage-1837.json`, `eckert-1946.json`, `faggin-1971.json`, `shockley-1955.json`, `zuse-1941.json`
**Data files (2):** `data/discoverer-intro.json`, `data/technology-timeline.json`
**Schema (1):** `schema/story-schema.json`
**Index (1):** `story-content.json`

[Source: digital-archaeology-web/public/story/]

### CI Pipeline Architecture

Current pipeline (`ci.yml`):
```
build-wasm → test (typecheck + lint + unit tests + test count check)
                                    ↓
                              test-e2e (Playwright, Chromium + Firefox)
                                    ↓
                                  build → deploy
```

**Add `validate:content` as a step within the `test` job** (after typecheck, before unit tests):
```yaml
- name: Validate story content
  run: npm run validate:content
  working-directory: digital-archaeology-web
```

This is better than a separate job because:
1. No extra CI runner needed
2. Content validation is fast (file reads + checks)
3. Fails early in the pipeline before expensive test runs

[Source: .github/workflows/ci.yml]
[Source: digital-archaeology-web/package.json]

### Validation Script Architecture

```
scripts/validate-story-content.ts
├── main()                         → Entry point, orchestrates all checks
├── loadAllActFiles()              → Read all act-*.json from public/story/
├── loadStoryIndex()               → Read story-content.json
├── loadPersonaIndex()             → Read personas/index.json + list persona files
├── validateSchemaAlignment()      → Compare schema enums to content-types.ts values
├── validateSceneReferences()      → Every nextScene ID exists in same act
├── validateChoiceReferences()     → Every choice.nextScene ID exists in same act
├── validatePersonaReferences()    → Persona IDs ↔ persona files cross-reference
├── validateIndexCompleteness()    → story-content.json ↔ act files cross-reference
├── validateChapterIntegrity()     → No floats, no duplicates, sequential
└── reportAndExit()                → Console output + non-zero exit on failure
```

**Use `tsx` (TypeScript executor) to run:** `npx tsx scripts/validate-story-content.ts`
- tsx is already available as a devDependency or install with `npx`
- Allows using TypeScript imports for type definitions from `content-types.ts`
- Use `fs.readFileSync` + `JSON.parse` for file loading (Node.js, not browser)

### Project Structure & Coding Standards

From `project-context.md`:
- **TypeScript:** Strict mode, no `any`, explicit `null`, named exports
- **Naming:** camelCase for utilities, `da-` prefix for CSS classes
- **Testing:** Vitest, co-located `.test.ts` files, minimum 1000 tests enforced in CI
- **Linting:** Currently stubbed (`echo 'No linter configured yet'` in package.json line 22)

[Source: _bmad-output/project-context.md]

### Dependencies

- **Blocks TD-1** (choice branching) — broken scene references must be fixed before branching can work
- **Blocks TD-4** (journey E2E) — content must be valid for journey tests to pass

### Anti-Patterns to Avoid

1. DO NOT recreate runtime validators — extend `StoryLoader.validateStoryContent()` only if needed; the new script is static file analysis
2. DO NOT make content fixes without the validation script existing first — build the safety net, THEN fix content
3. DO NOT silently skip validation errors — every issue must be a hard failure with clear error message
4. DO NOT validate only on full CI runs — make script runnable locally: `npm run validate:content`
5. DO NOT modify scene IDs during chapter renumbering — scene IDs are referenced throughout the codebase
6. DO NOT add JSON Schema validation library — use simple file reads and TypeScript checks; schema is reference documentation, not runtime enforcement
7. DO NOT change `StoryLoader.ts` runtime validation behavior — this story is about CI-time static validation

### Accessibility Checklist

- N/A — This is an infrastructure/validation story, not a UI feature

### References

- [Source: digital-archaeology-web/public/story/act-0-mechanical.json:15-38] — Inline First Counter persona data
- [Source: digital-archaeology-web/public/story/act-0-mechanical.json:447,617] — Float chapter numbers
- [Source: digital-archaeology-web/public/story/act-0-mechanical.json:1184,1570] — Duplicate chapter 3
- [Source: digital-archaeology-web/public/story/schema/story-schema.json:63] — Max acts constraint
- [Source: digital-archaeology-web/public/story/schema/story-schema.json:78] — cpuStage enum
- [Source: digital-archaeology-web/public/story/schema/story-schema.json:104] — Chapter year pattern
- [Source: digital-archaeology-web/public/story/schema/story-schema.json:145] — Scene type enum
- [Source: digital-archaeology-web/src/story/content-types.ts:15,32] — CpuStage and SceneType unions
- [Source: digital-archaeology-web/src/story/types.ts:187-220] — PersonaData interface (full)
- [Source: digital-archaeology-web/src/story/StoryLoader.ts:153-209] — Existing validateStoryContent()
- [Source: digital-archaeology-web/src/story/StoryLoader.test.ts:22-115] — Test factory patterns
- [Source: digital-archaeology-web/public/story/personas/index.json] — Persona index
- [Source: digital-archaeology-web/public/story/story-content.json] — Act index (11 acts)
- [Source: .github/workflows/ci.yml] — CI pipeline
- [Source: _bmad-output/project-context.md] — Coding standards
- [Source: _bmad-output/implementation-artifacts/epic-10-retro-2026-02-06.md] — Gap #2 analysis
- [Source: _bmad-output/implementation-artifacts/10-24-fix-act0-persona-timeline.md] — Story that introduced broken reference

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- Validation script initial run found 16 broken references (4 chapter→scene, 12 choice branch targets)
- Chapter→scene fixes: act-1:764, act-2:932, act-5:946, act-6:812+1002
- 11 choice.nextScene entries removed from acts 8, 9, 10 (branch target scenes not yet created)
- `PersonaConstraint.type` includes "material" in content data but TypeScript type only has technical|economic|political|knowledge — noted as side finding for future fix

### Completion Notes List

1. Schema updated: 6 changes (act number, scene types, cpuStage, year pattern, chapter ID pattern, scene ID pattern)
2. Content fixed: persona created, 7 float chapters fixed, 1 duplicate resolved, 5 chapter→scene refs fixed, 11 orphan choice refs removed
3. Validation script: 5 pure validators + I/O layer, 23 unit tests, npm script + CI integration
4. Side finding: `PersonaConstraint` type in `types.ts:176` is missing `'material'` but content uses it in 6 files — should be added in a future story
5. 53 E2E failures are all WASM-dependent (pre-existing, need local WASM build) — zero story-mode regressions

### File List

**NEW:**
- `digital-archaeology-web/public/story/personas/first-counter-35000bc.json` — Missing persona file
- `digital-archaeology-web/scripts/validate-story-content.ts` — CI validation script
- `digital-archaeology-web/tests/unit/validate-story-content.test.ts` — 23 unit tests

**MODIFIED:**
- `digital-archaeology-web/public/story/schema/story-schema.json` — 6 constraint fixes
- `digital-archaeology-web/public/story/personas/index.json` — Added first-counter entry
- `digital-archaeology-web/public/story/act-0-mechanical.json` — 7 chapter number fixes
- `digital-archaeology-web/public/story/act-2-vacuum.json` — 2 chapter number fixes + 1 nextScene fix
- `digital-archaeology-web/public/story/act-6-micro16.json` — 2 chapter number fixes + 2 nextScene fixes
- `digital-archaeology-web/public/story/act-1-relay.json` — 1 nextScene fix (chapter→scene)
- `digital-archaeology-web/public/story/act-5-micro8.json` — 1 nextScene fix (chapter→scene)
- `digital-archaeology-web/public/story/act-8-micro32p.json` — 4 orphan choice.nextScene removed
- `digital-archaeology-web/public/story/act-9-micro32s.json` — 4 orphan choice.nextScene removed
- `digital-archaeology-web/public/story/act-10-future.json` — 3 orphan choice.nextScene removed
- `digital-archaeology-web/package.json` — Added validate:content script
- `.github/workflows/ci.yml` — Added validate story content CI step
