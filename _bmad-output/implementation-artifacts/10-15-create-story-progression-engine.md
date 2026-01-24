# Story 10.15: Create Story Progression Engine

Status: done

---

## Story

As a developer,
I want a story engine to manage state,
So that user progress is tracked.

## Acceptance Criteria

1. **Given** the user makes choices and progresses
   **When** the story engine runs
   **Then** current position is tracked (act, chapter, scene)

2. **And** choices are recorded

3. **And** progress is persisted to storage

4. **And** the engine can resume from saved position

## Tasks / Subtasks

- [x] Task 1: Define Story State Types (AC: #1, #2)
  - [x] 1.1 Create `src/story/StoryState.ts` with state type definitions
  - [x] 1.2 Define `StoryPosition` interface: actNumber, chapterNumber, sceneId
  - [x] 1.3 Define `StoryChoice` interface: sceneId, choiceId, timestamp
  - [x] 1.4 Define `StoryProgress` interface: position, choices array, discoveredItems, startedAt, lastPlayedAt
  - [x] 1.5 Define `StoryEngineState` interface: progress, isLoading, error

- [x] Task 2: Implement Story Engine Class (AC: #1, #2)
  - [x] 2.1 Create `src/story/StoryEngine.ts` with engine class
  - [x] 2.2 Implement `getCurrentScene(): StoryScene | null` method
  - [x] 2.3 Implement `goToScene(sceneId: string): void` method
  - [x] 2.4 Implement `nextScene(): void` method using scene.nextScene property
  - [x] 2.5 Implement `previousScene(): void` method with history tracking
  - [x] 2.6 Implement `recordChoice(choiceId: string): void` method
  - [x] 2.7 Implement `getProgress(): StoryProgress` method
  - [x] 2.8 Add event dispatch for state changes (`story-state-changed`)

- [x] Task 3: Implement Storage Persistence (AC: #3, #4)
  - [x] 3.1 Create `src/story/StoryStorage.ts` with storage service
  - [x] 3.2 Implement `saveProgress(progress: StoryProgress): void` using localStorage
  - [x] 3.3 Implement `loadProgress(): StoryProgress | null` method
  - [x] 3.4 Implement `clearProgress(): void` method
  - [x] 3.5 Add storage key constant: `'digital-archaeology-story-progress'`
  - [x] 3.6 Add JSON serialization with error handling

- [x] Task 4: Integrate with StoryLoader (AC: #1, #4)
  - [x] 4.1 Add method `getSceneById(sceneId: string): StoryScene | null` to StoryLoader
  - [x] 4.2 Add method `getFirstScene(): StoryScene` to StoryLoader
  - [x] 4.3 Initialize StoryEngine with StoryLoader instance
  - [x] 4.4 Implement resume logic: load progress → navigate to saved position

- [x] Task 5: Write Comprehensive Tests (AC: all)
  - [x] 5.1 Test StoryPosition tracks act, chapter, scene correctly
  - [x] 5.2 Test goToScene updates current position
  - [x] 5.3 Test nextScene follows scene.nextScene property
  - [x] 5.4 Test recordChoice stores choice in choices array
  - [x] 5.5 Test saveProgress persists to localStorage
  - [x] 5.6 Test loadProgress restores from localStorage
  - [x] 5.7 Test resume navigates to saved position
  - [x] 5.8 Test event dispatch on state changes

- [x] Task 6: Export from index.ts (AC: all)
  - [x] 6.1 Export StoryEngine class from `src/story/index.ts`
  - [x] 6.2 Export StoryStorage class
  - [x] 6.3 Export state types: StoryPosition, StoryChoice, StoryProgress

- [x] Task 7: Verify Integration (AC: all)
  - [x] 7.1 Run `npm test` - all tests pass (1886 tests)
  - [x] 7.2 Run `npm run build` - build succeeds

---

## Dev Notes

### Previous Story Intelligence (Story 10.14)

**Critical Assets Created:**
- `src/story/content-types.ts` - Type definitions (146 lines)
  - `StoryContent`, `StoryAct`, `StoryChapter`, `StoryScene` interfaces
  - `CpuStage`, `SceneType` union types
  - `StoryLoadError`, `StoryValidationError` error classes
- `src/story/StoryLoader.ts` - Loader service with caching (286 lines)
  - `loadAct(actNumber)`, `loadAllActs()`, `clearCache()` methods
  - Type guards: `isStoryAct`, `isStoryChapter`, `isStoryScene`, `isStoryContent`
  - `validateStoryContent()` function with detailed error reporting
- `public/story/act-1.json` - Sample content with 5 scenes including `nextScene` property

**Code Review Lessons from 10.14:**
- Add union types for enums to match JSON Schema constraints
- Export all types needed by consumers from index.ts
- Use factory functions in tests to avoid mutation issues between tests
- Keep line counts consistent throughout story file documentation

**Key Pattern - Scene Navigation:**
Each `StoryScene` has optional `nextScene` property pointing to next scene ID:
```typescript
interface StoryScene {
  id: string;
  type: SceneType;
  nextScene?: string;  // <- Use this for linear progression
  // ...
}
```

### Existing Types to Reuse

**From content-types.ts:**
- `StoryContent` - Root container with acts array
- `StoryAct` - Act with chapters array
- `StoryChapter` - Chapter with scenes array
- `StoryScene` - Scene with nextScene for progression
- `CpuStage` - Union type for CPU stages

**From types.ts:**
- `ChoiceData` - Choice options (id, icon, title, description)

### UX Design Reference

**From ux-design-specification.md - Story Mode Architecture:**

Navigation flow:
- Story → Lab transition via "Enter the Lab" button
- Lab → Story transition via activity bar icon or toggle
- Scene progression via "Continue" button in footer
- Choice selection records decision and advances story

**Key UI Integration Points:**
- StoryNav component shows progress dots (Act 1 of 5)
- StoryActionsFooter has Previous/Continue buttons
- ChoiceCard records selection and advances

### Architecture Compliance

**From architecture.md:**
- Use TypeScript for type safety
- Use localStorage for client-side persistence (no backend)
- Custom events for component communication (`story-state-changed`)
- Services should be injectable for testing

**Storage Pattern:**
```typescript
const STORAGE_KEY = 'digital-archaeology-story-progress';

// Save
localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));

// Load
const data = localStorage.getItem(STORAGE_KEY);
if (data) return JSON.parse(data) as StoryProgress;
```

### State Management Design

**StoryPosition Interface:**
```typescript
interface StoryPosition {
  actNumber: number;      // 1-5
  chapterNumber: number;  // Within act
  sceneId: string;        // Current scene ID
}
```

**StoryChoice Interface:**
```typescript
interface StoryChoice {
  sceneId: string;    // Scene where choice was made
  choiceId: string;   // Selected choice ID
  timestamp: number;  // When choice was made
}
```

**StoryProgress Interface:**
```typescript
interface StoryProgress {
  position: StoryPosition;
  choices: StoryChoice[];
  discoveredItems: string[];  // IDs of discovered concepts
  startedAt: number;          // First play timestamp
  lastPlayedAt: number;       // Last activity timestamp
}
```

### Anti-Patterns to Avoid

| Don't | Do |
|-------|-----|
| Store entire content in state | Store only position and choices (content loaded separately) |
| Use `any` for stored data | Use type guards when loading from localStorage |
| Mutate state directly | Return new state objects, dispatch events |
| Couple to specific components | Engine is standalone, components subscribe to events |
| Skip error handling for storage | Handle JSON parse errors and missing data gracefully |

### Critical Technical Requirements

1. **Separation of Concerns** - Engine manages state, StoryLoader manages content
2. **Type Safety** - All state transitions typed, no `any` types
3. **Persistence** - Progress survives browser refresh
4. **Testability** - Engine can be tested without DOM/localStorage mocking
5. **Event-Driven** - Components react to `story-state-changed` events
6. **Resume Support** - User can close browser and return to same position

### Git Intelligence (Recent Commits)

Recent commits show consistent pattern:
- `feat(web): implement story content data structure with code review fixes (Story 10.14)`
- `feat(web): create Challenge Objectives component with code review fixes (Story 10.13)`

**Commit Pattern:** `feat(web): create [Feature Name] with code review fixes (Story X.Y)`

### Accessibility Checklist

- [N/A] **Keyboard Navigation** - Engine is state management, no UI
- [N/A] **ARIA Attributes** - Engine is state management, no UI
- [N/A] **Focus Management** - Engine is state management, no UI
- [N/A] **Color Contrast** - Engine is state management, no UI
- [N/A] **XSS Prevention** - Engine only manages state, no HTML rendering
- [N/A] **Screen Reader Announcements** - Engine is state management, no UI

### Project Structure Notes

**Files created:**
```
digital-archaeology-web/
  src/
    story/
      StoryState.ts         # State type definitions (85 lines)
      StoryEngine.ts        # Engine class with state management (328 lines)
      StoryEngine.test.ts   # Tests (43 tests, 474 lines)
      StoryStorage.ts       # localStorage persistence service (128 lines)
```

**Files modified:**
```
digital-archaeology-web/
  src/
    story/
      StoryLoader.ts        # Added getSceneById, getFirstScene, getCachedActs (352 lines)
      index.ts              # Added exports for new types and classes
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 10.15]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Story Mode Components]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- [Source: digital-archaeology-web/src/story/content-types.ts - Content type definitions]
- [Source: digital-archaeology-web/src/story/StoryLoader.ts - Content loader service]
- [Source: _bmad-output/implementation-artifacts/10-14-implement-story-content-data-structure.md - Previous story]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None required - clean implementation.

### Completion Notes List

- Created `StoryState.ts` with type definitions: StoryPosition, StoryChoice, StoryProgress, StoryEngineState
- Added helper functions: createDefaultProgress(), createDefaultEngineState()
- Implemented `StoryEngine` class with full navigation support:
  - Scene index for O(1) lookups by sceneId
  - goToScene(), nextScene(), previousScene() with history tracking
  - recordChoice() for storing user decisions
  - startNewGame(), resume(), clearProgress() lifecycle methods
  - addDiscoveredItem() for tracking discoveries
  - Event dispatch via 'story-state-changed' CustomEvent
- Implemented `StoryStorage` service:
  - localStorage persistence with STORY_STORAGE_KEY constant
  - Type guards for safe JSON deserialization
  - Error handling for localStorage failures
- Extended `StoryLoader` with getSceneById(), getFirstScene(), getCachedActs() methods
- 43 comprehensive tests covering all acceptance criteria (added getState and clearProgress event dispatch tests)
- 10 additional tests for new StoryLoader helper methods
- All 1886 tests pass, build succeeds

### Code Review Fixes Applied

1. **Fixed dispatchStateChanged to dispatch events when progress is null** - Components now receive notification when clearProgress() is called
2. **Updated StoryStateChangedEvent interface** - `progress` field now supports `StoryProgress | null` for clearProgress events
3. **Added missing tests for getState()** - Covers both empty and populated state
4. **Added missing tests for clearProgress event dispatch** - Verifies event is dispatched with null progress
5. **Added missing tests for StoryLoader methods** - getSceneById, getFirstScene, getCachedActs now have comprehensive test coverage

### File List

- `src/story/StoryState.ts` - State type definitions (85 lines)
- `src/story/StoryEngine.ts` - Engine class with navigation and state management (328 lines)
- `src/story/StoryStorage.ts` - localStorage persistence service (128 lines)
- `src/story/StoryEngine.test.ts` - Tests (43 tests, 474 lines)
- `src/story/StoryLoader.ts` - Added helper methods (352 lines, +66 lines)
- `src/story/StoryLoader.test.ts` - Added tests for new methods (559 lines, +124 lines)
- `src/story/index.ts` - Added exports for new types and classes
