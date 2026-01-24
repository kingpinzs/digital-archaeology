# Story 10.14: Implement Story Content Data Structure

Status: done

---

## Story

As a developer,
I want story content in JSON format,
So that the story engine can render it.

## Acceptance Criteria

1. **Given** story content files exist
   **When** the application loads
   **Then** story JSON is loaded from public/story/

2. **And** the structure includes acts, chapters, scenes

3. **And** scenes include narrative, characters, choices

4. **And** the content is validated against a schema

## Tasks / Subtasks

- [x] Task 1: Define Story Content TypeScript Interfaces (AC: #2, #3, #4)
  - [x] 1.1 Create `src/story/content-types.ts` with hierarchical type definitions
  - [x] 1.2 Define `StoryAct` interface: id, number, title, description, chapters array
  - [x] 1.3 Define `StoryChapter` interface: id, number, title, subtitle, year, scenes array
  - [x] 1.4 Define `StoryScene` interface: id, setting, narrative, characters, dialogues, choices, technicalNotes, challenge
  - [x] 1.5 Define `StoryContent` interface: version, acts array, metadata
  - [x] 1.6 Define `StoryMetadata` interface: title, author, lastUpdated

- [x] Task 2: Create JSON Schema for Validation (AC: #4)
  - [x] 2.1 Create `public/story/schema/story-schema.json` with JSON Schema draft-07
  - [x] 2.2 Define required fields and types matching TypeScript interfaces
  - [x] 2.3 Add validation constraints (minLength, enum values, etc.)
  - [x] 2.4 Document schema with descriptions

- [x] Task 3: Create Sample Story Content File (AC: #1, #2, #3)
  - [x] 3.1 Create `public/story/act-1.json` with sample Act 1 content
  - [x] 3.2 Include at least one complete chapter with multiple scenes
  - [x] 3.3 Include sample character, dialogue, choice, and technical note content
  - [x] 3.4 Include sample challenge data for Lab Mode integration

- [x] Task 4: Implement StoryLoader Service (AC: #1, #4)
  - [x] 4.1 Create `src/story/StoryLoader.ts` with loader class
  - [x] 4.2 Implement `loadAct(actNumber: number): Promise<StoryAct>` method
  - [x] 4.3 Implement `loadAllActs(): Promise<StoryContent>` method
  - [x] 4.4 Implement `validateContent(content: unknown): StoryContent` method with type guards
  - [x] 4.5 Add error handling for missing/invalid files
  - [x] 4.6 Add caching to prevent redundant fetches

- [x] Task 5: Create Type Guards and Validators (AC: #4)
  - [x] 5.1 Create type guard functions: `isStoryAct`, `isStoryChapter`, `isStoryScene`
  - [x] 5.2 Create `validateStoryContent(data: unknown): ValidationResult` function
  - [x] 5.3 Return detailed error messages for validation failures
  - [x] 5.4 Use Ajv library for JSON Schema validation (optional - prefer runtime type checks)

- [x] Task 6: Write Comprehensive Tests (AC: all)
  - [x] 6.1 Test TypeScript interfaces compile correctly with sample data
  - [x] 6.2 Test StoryLoader loads JSON from public/story/
  - [x] 6.3 Test validateContent rejects invalid structures
  - [x] 6.4 Test validateContent accepts valid structures
  - [x] 6.5 Test error handling for missing files
  - [x] 6.6 Test caching behavior (second load returns cached data)
  - [x] 6.7 Test type guards correctly identify valid/invalid data

- [x] Task 7: Export from index.ts (AC: #1)
  - [x] 7.1 Export all content types from `src/story/index.ts`
  - [x] 7.2 Export StoryLoader class
  - [x] 7.3 Export type guard functions

- [x] Task 8: Verify Integration (AC: all)
  - [x] 8.1 Run `npm test` - all tests pass (1833 tests)
  - [x] 8.2 Run `npm run build` - build succeeds
  - [x] 8.3 Verify sample JSON validates against schema

---

## Dev Notes

### Previous Story Intelligence (Story 10.13)

**Critical Assets Created:**
- `src/story/ChallengeObjectives.ts` - Challenge objectives component (260 lines)
- Map-based element tracking pattern for efficient DOM updates
- Custom event dispatch pattern (`challenge-progress-changed`)
- Types: `ChallengeData`, `ChallengeObjective` in types.ts

**Code Review Lessons from 10.13:**
- Fix line counts in documentation to match actual
- Keep all metrics consistent throughout story file
- Use factory functions in tests to avoid mutation issues between tests

**Existing Types in types.ts:**
- `RoleData` - Player's role/character
- `ChapterData` - Chapter header info (actNumber, year, title, subtitle)
- `SceneSettingData` - Scene setting text
- `CharacterData` - NPC info (avatar, name, title, bio, stats)
- `DialogueData` - Dialogue (speaker, text)
- `ChoiceData` - Choice options (id, icon, title, description)
- `TechnicalNoteData` - Technical notes (content, codeSnippet)
- `ChallengeData` - Challenge objectives for Lab Mode

### UX Design Reference

**From ux-design-specification.md - Story Mode Architecture:**

Story content structure should support:
- Acts with Roman numeral numbering (I, II, III, IV, V)
- Chapters within acts with year context (1971, 1974, etc.)
- Scenes with:
  - Setting descriptions (atmospheric text)
  - Narrative text
  - Character appearances with cards
  - Dialogue blocks
  - Player choices
  - Technical notes bridging narrative and technical content
  - Challenge objectives for Lab Mode

**Era Progression:**
| Act | Era | CPU Stage |
|-----|-----|-----------|
| Act I | 1971 | Micro4 (4-bit) |
| Act II | 1974 | Micro8 (8-bit) |
| Act III | 1978 | Micro16 (16-bit) |
| Act IV | 1985 | Micro32 (32-bit) |
| Act V | 1995 | Micro32-P/S (Pipelined/Superscalar) |

### Architecture Compliance

**From architecture.md:**
- Use TypeScript for type safety
- JSON files in public/ folder for static content
- Fetch API for loading JSON files
- Simple validation without heavy dependencies (prefer runtime type guards over Ajv if simple)

### Content Type Structure (Implemented)

See `src/story/content-types.ts` (146 lines) for full implementation featuring:
- Hierarchical types: StoryContent → StoryAct → StoryChapter → StoryScene
- Reuses existing types from types.ts for component data
- Custom error classes: StoryLoadError, StoryValidationError
- ValidationResult interface for detailed error reporting

### Accessibility Checklist

- [N/A] **Keyboard Navigation** - Data structure, no UI
- [N/A] **ARIA Attributes** - Data structure, no UI
- [N/A] **Focus Management** - Data structure, no UI
- [N/A] **Color Contrast** - Data structure, no UI
- [N/A] **XSS Prevention** - JSON data will be rendered via textContent (components handle this)
- [N/A] **Screen Reader Announcements** - Data structure, no UI

### Anti-Patterns to Avoid

| Don't | Do |
|-------|-----|
| Put JSON in src/ directory | Put JSON in public/ for static asset loading |
| Use `any` type for loaded content | Use type guards to validate and narrow types |
| Fetch without error handling | Always handle network errors gracefully |
| Parse JSON without validation | Validate structure before use |
| Create circular dependencies | Keep content-types.ts separate from component types |
| Duplicate existing types | Import and reuse types from types.ts |

### Critical Technical Requirements

1. **Type Safety** - All content must be typed, no `any` types
2. **Validation** - Runtime validation before use (type guards or JSON Schema)
3. **Separation** - Content types separate from component types (content-types.ts vs types.ts)
4. **Caching** - Avoid redundant network requests for same content
5. **Error Handling** - Graceful degradation if content fails to load
6. **Reuse** - Reference existing types for component data

### Git Intelligence (Recent Commits)

Recent commits show consistent pattern:
- `feat(web): create Challenge Objectives component with code review fixes (Story 10.13)`
- `feat(web): create Story Actions Footer with code review fixes (Story 10.12)`
- `feat(web): create Enter the Lab button with code review fixes (Story 10.11)`

**Commit Pattern:** `feat(web): implement [Feature Name] with code review fixes (Story X.Y)`

### Project Structure Notes

**Files created:**
```
digital-archaeology-web/
  public/
    story/
      schema/
        story-schema.json     # JSON Schema (341 lines)
      act-1.json              # Sample content (163 lines)
  src/
    story/
      content-types.ts        # Type definitions (146 lines)
      StoryLoader.ts          # Loader service (286 lines)
      StoryLoader.test.ts     # Tests (41 tests, 434 lines)
```

**Files modified:**
```
digital-archaeology-web/
  src/
    story/
      index.ts                # Added exports for new types and loader
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 10.14]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Story Mode Components]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- [Source: digital-archaeology-web/src/story/types.ts - Existing component types]
- [Source: _bmad-output/implementation-artifacts/10-13-create-challenge-objectives-in-lab-mode.md - Previous story]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None required - clean implementation.

### Completion Notes List

- Created hierarchical TypeScript interfaces for story content (StoryContent, StoryAct, StoryChapter, StoryScene)
- Created JSON Schema (draft-07) for content validation with all type definitions
- Created sample Act 1 content with 5 scenes including narrative, dialogue, choice, and challenge types
- Implemented StoryLoader service with caching and error handling
- Created type guards: isStoryAct, isStoryChapter, isStoryScene, isStoryContent
- Created validateStoryContent function with detailed error reporting
- Custom error classes: StoryLoadError, StoryValidationError
- Reused existing types from types.ts (CharacterData, DialogueData, ChoiceData, etc.)
- 41 comprehensive unit tests covering all acceptance criteria (7 added for isStoryContent)
- All 1833 tests pass, build succeeds

### Code Review Fixes

- Added `CpuStage` union type to match JSON Schema enum constraints (type safety improvement)
- Removed misleading `@internal` JSDoc comment from exported `isStoryContent` function
- Added 7 tests for `isStoryContent` type guard (null, undefined, missing fields, invalid acts)
- Exported `CpuStage` type from index.ts for consumer usage
- Updated line counts in documentation to match actual file sizes

### Deep Audit Fixes

- Added `SceneType` union type for consistency with `CpuStage` pattern
- Exported `SceneType` type from index.ts for consumer usage
- Fixed test factory inconsistency: added `narrative` array to `createValidStoryAct()` and `createValidStoryChapter()` scenes
- Updated Task 8.1 test count from 1826 to 1833
- Added comments to validation arrays noting they must match corresponding types

### File List

- `public/story/schema/story-schema.json` - JSON Schema for validation (341 lines)
- `public/story/act-1.json` - Sample Act 1 content (163 lines)
- `src/story/content-types.ts` - TypeScript type definitions (146 lines)
- `src/story/StoryLoader.ts` - Loader service with caching (286 lines)
- `src/story/StoryLoader.test.ts` - Tests (41 tests, 434 lines)
- `src/story/index.ts` - Added exports for new types and loader
