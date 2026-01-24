# Story 10.17: Wire Story Mode Integration

Status: done

---

## Story

As a user,
I want Story Mode to load and display actual story content,
So that I can experience an interactive narrative journey.

## Acceptance Criteria

1. **Given** I enter Story Mode
   **When** the view loads
   **Then** story content is loaded from JSON files

2. **And** the current scene is rendered using the appropriate components (ChapterHeader, SceneSetting, CharacterCard, DialogueBlock, ChoiceCard, TechnicalNote)

3. **And** clicking "Continue" advances to the next scene

4. **And** clicking a ChoiceCard records my choice and advances the story

5. **And** my progress is saved automatically

6. **And** returning to Story Mode resumes from my saved position

## Tasks / Subtasks

- [x] Task 1: Create StoryController Class (AC: #1, #2)
  - [x] 1.1 Create `src/story/StoryController.ts` as the integration orchestrator
  - [x] 1.2 Initialize StoryLoader and StoryEngine in constructor
  - [x] 1.3 Implement `initialize(): Promise<void>` to load story content and resume progress
  - [x] 1.4 Implement `getCurrentSceneData(): SceneRenderData` to get scene components to render
  - [x] 1.5 Dispatch `story-scene-render` event when scene changes

- [x] Task 2: Create Scene Renderer (AC: #2)
  - [x] 2.1 Create `src/story/SceneRenderer.ts` to render scene content dynamically
  - [x] 2.2 Implement `renderScene(scene: StoryScene, container: HTMLElement): void`
  - [x] 2.3 Map scene.type to appropriate component (narrative → SceneSetting, dialogue → DialogueBlock, etc.)
  - [x] 2.4 Render ChapterHeader when act/chapter changes
  - [x] 2.5 Render scene elements in order: setting, characters, narrative, dialogue, choices, technical notes
  - [x] 2.6 Clear and replace container content on each render

- [x] Task 3: Update StoryContent Component (AC: #2)
  - [x] 3.1 Remove hardcoded placeholder content from `StoryContent.ts`
  - [x] 3.2 Add mount point for SceneRenderer
  - [x] 3.3 Subscribe to `story-scene-render` event
  - [x] 3.4 Call SceneRenderer.renderScene() when event fires

- [x] Task 4: Wire StoryActionsFooter (AC: #3)
  - [x] 4.1 Pass StoryEngine reference to StoryActionsFooter
  - [x] 4.2 Wire "Continue" button to call `storyEngine.nextScene()`
  - [x] 4.3 Wire "Previous" button to call `storyEngine.previousScene()`
  - [x] 4.4 Disable "Previous" when no history exists
  - [x] 4.5 Disable "Continue" when no nextScene defined (end of content)

- [x] Task 5: Wire ChoiceCard Interactions (AC: #4)
  - [x] 5.1 Pass onChoice callback to ChoiceCard when rendering
  - [x] 5.2 ChoiceCard calls `storyEngine.recordChoice(choiceId)`
  - [x] 5.3 Navigate to choice.nextScene after recording
  - [x] 5.4 Dispatch `story-choice-made` event for analytics/UI updates

- [x] Task 6: Update StoryModeContainer (AC: #1, #6)
  - [x] 6.1 Create StoryController instance in StoryModeContainer
  - [x] 6.2 Call `storyController.initialize()` in mount()
  - [x] 6.3 Pass StoryController/StoryEngine to child components
  - [x] 6.4 Handle resume logic: check for saved progress, navigate to saved scene

- [x] Task 7: Wire Era and Progress Updates (AC: #1)
  - [x] 7.1 Pass `getEraForAct` callback to StoryNav that reads from StoryLoader
  - [x] 7.2 Load acts metadata to map actNumber → era string
  - [x] 7.3 Verify era badge updates when navigating between acts

- [x] Task 8: Wire YourRolePanel (AC: #2)
  - [x] 8.1 Subscribe YourRolePanel to story state changes
  - [x] 8.2 Update role data based on current act/chapter
  - [x] 8.3 Update discoveries when `addDiscoveredItem()` is called

- [x] Task 9: Verify Story JSON Files Exist (AC: #1)
  - [x] 9.1 Verify `public/story/act-*.json` files exist and are valid
  - [x] 9.2 Fixed JSON syntax errors in act-1-relay.json, act-8-micro32p.json, act-9-micro32s.json

- [x] Task 10: Write Integration Tests (AC: all)
  - [x] 10.1 Test StoryController initializes and loads content
  - [x] 10.2 Test SceneRenderer renders correct components for each scene type
  - [x] 10.3 Test Continue button advances scene
  - [x] 10.4 Test ChoiceCard records choice and navigates
  - [x] 10.5 Test progress is saved to localStorage
  - [x] 10.6 Test resume loads saved position

- [x] Task 11: Export and Verify (AC: all)
  - [x] 11.1 Export StoryController from `src/story/index.ts`
  - [x] 11.2 Run `npm test` - all tests pass (1995 tests)
  - [x] 11.3 Run `npm run build` - build succeeds
  - [x] 11.4 Manual test: Load app, enter Story Mode, verify content displays

---

## Dev Notes

### Previous Story Intelligence (Story 10.14, 10.15, 10.16)

**Critical Assets Available:**

From Story 10.14 - StoryLoader:
```typescript
// Load story content
const loader = new StoryLoader();
const act = await loader.loadAct(1);  // Returns StoryAct
const scene = loader.getSceneById('scene-1-1-1');  // O(1) lookup
const firstScene = loader.getFirstScene();
```

From Story 10.15 - StoryEngine:
```typescript
// Create engine with storage
const storage = new StoryStorage();
const engine = new StoryEngine(storage);
engine.initialize(acts);  // Build scene index

// Navigation
engine.startNewGame();  // Start at first scene
engine.resume();  // Load from localStorage
engine.goToScene('scene-id');
engine.nextScene();  // Follow scene.nextScene
engine.previousScene();  // Pop from history
engine.recordChoice('choice-id');

// Events
window.addEventListener('story-state-changed', (e) => {
  const { progress, previousSceneId } = e.detail;
});
```

From Story 10.16 - Era/Progress:
- StoryNav already subscribes to `story-state-changed`
- EraBadge and ProgressDots update automatically
- Need to pass `getEraForAct` callback to look up era from StoryLoader

### Existing UI Components

All these components exist and are tested:
- `ChapterHeader` - Renders act/chapter title
- `SceneSetting` - Renders scene atmosphere text
- `CharacterCard` - Renders character introduction
- `DialogueBlock` - Renders character speech
- `ChoiceCard` - Renders clickable choice options
- `TechnicalNote` - Renders technical explanations
- `EnterLabButton` - Switches to Lab mode
- `StoryActionsFooter` - Previous/Continue buttons

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    StoryModeContainer                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  StoryController                         │   │
│  │  ┌──────────────┐    ┌──────────────┐                   │   │
│  │  │ StoryLoader  │    │ StoryEngine  │                   │   │
│  │  │ (load JSON)  │───▶│ (state mgmt) │                   │   │
│  │  └──────────────┘    └──────────────┘                   │   │
│  │         │                   │                            │   │
│  │         │          'story-state-changed'                 │   │
│  │         │                   │                            │   │
│  │         ▼                   ▼                            │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │              SceneRenderer                        │   │   │
│  │  │  Maps StoryScene → UI Components                  │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────┐  ┌─────────────────┐  ┌──────────────────┐   │
│  │  StoryNav   │  │  StoryContent   │  │  YourRolePanel   │   │
│  │ (era/dots)  │  │ (scene display) │  │  (role/badges)   │   │
│  └─────────────┘  └─────────────────┘  └──────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│                    StoryActionsFooter                           │
│                   (Continue/Previous)                           │
└─────────────────────────────────────────────────────────────────┘
```

### Scene Type to Component Mapping

| scene.type | Primary Component | Additional Components |
|------------|-------------------|----------------------|
| `narrative` | SceneSetting | - |
| `dialogue` | DialogueBlock | CharacterCard (if new character) |
| `choice` | ChoiceCard (multiple) | - |
| `technical` | TechnicalNote | - |
| `challenge` | EnterLabButton | ChallengeObjectives setup |

### StoryScene Structure (from content-types.ts)

```typescript
interface StoryScene {
  id: string;
  type: SceneType;  // 'narrative' | 'dialogue' | 'choice' | 'technical' | 'challenge'
  setting?: SceneSettingData;
  narrative?: string[];
  characters?: CharacterData[];
  dialogue?: DialogueData[];
  choices?: ChoiceData[];
  technicalNote?: TechnicalNoteData;
  challenge?: ChallengeData;
  nextScene?: string;  // ID of next scene
}
```

### Anti-Patterns to Avoid

| Don't | Do |
|-------|-----|
| Create new component instances on every render | Reuse component instances, call update methods |
| Load story JSON on every scene change | Cache loaded acts in StoryLoader |
| Hardcode scene IDs | Use StoryEngine's scene index |
| Skip error handling for missing scenes | Graceful fallback with user message |
| Forget to clean up event listeners | Unsubscribe in destroy() |

### Git Intelligence (Recent Commits)

```
feat(web): create Era Badge and Progress Dots components (Story 10.16)
feat(web): create Story Progression Engine with code review fixes (Story 10.15)
feat(web): implement story content data structure with code review fixes (Story 10.14)
```

**Commit Pattern:** `feat(web): wire Story Mode integration (Story 10.17)`

### Accessibility Checklist

- [ ] **Keyboard Navigation** - Ensure Continue/Previous buttons are focusable
- [ ] **ARIA Attributes** - Scene container has aria-live for screen reader announcements
- [ ] **Focus Management** - Focus moves to new content after scene change
- [ ] **XSS Prevention** - All story content rendered via textContent, not innerHTML

### Project Structure Notes

**Files to create:**
```
digital-archaeology-web/
  src/
    story/
      StoryController.ts       # Integration orchestrator
      StoryController.test.ts  # Tests
      SceneRenderer.ts         # Dynamic scene rendering
      SceneRenderer.test.ts    # Tests
```

**Files to modify:**
```
digital-archaeology-web/
  src/
    story/
      StoryContent.ts          # Remove placeholder, add renderer mount
      StoryModeContainer.ts    # Add StoryController
      StoryActionsFooter.ts    # Wire button callbacks
      YourRolePanel.ts         # Subscribe to state changes
      index.ts                 # Export new classes
  public/
    story/
      act-1.json               # Verify/create minimal content
```

### References

- [Source: digital-archaeology-web/src/story/StoryLoader.ts - Content loading]
- [Source: digital-archaeology-web/src/story/StoryEngine.ts - State management]
- [Source: digital-archaeology-web/src/story/StoryModeContainer.ts - Container to update]
- [Source: digital-archaeology-web/src/story/StoryContent.ts - Placeholder to replace]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md - Story Mode UX]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None - Implementation was already complete but story was incorrectly marked done.

### Completion Notes List

1. **Story was incorrectly marked done** - Story file showed "ready-for-dev" with unchecked tasks, but sprint-status.yaml showed "done". This was caught during Epic 10 retrospective.

2. **JSON syntax errors fixed** - Three act files (act-1-relay.json, act-8-micro32p.json, act-9-micro32s.json) had duplicate "narrative": [ lines and extra trailing commas that prevented loading.

3. **CSS scrolling fixed** - Story content area had incorrect positioning that prevented scrolling. Fixed with proper fixed positioning and overflow-y: auto.

4. **Implementation was complete** - StoryController.ts (392 lines), SceneRenderer.ts (364 lines) were fully implemented with proper wiring to StoryModeContainer.

5. **All 1995 tests pass** - npm test succeeds

6. **Build succeeds** - npm run build completes without errors

### File List

| File | Action | Description |
|------|--------|-------------|
| `src/story/StoryController.ts` | EXISTING | Integration orchestrator (392 lines) |
| `src/story/SceneRenderer.ts` | EXISTING | Dynamic scene rendering (364 lines) |
| `src/story/StoryModeContainer.ts` | EXISTING | Container with controller wiring (310 lines) |
| `src/story/StoryContent.ts` | EXISTING | Content area with scene mount (108 lines) |
| `src/story/index.ts` | EXISTING | Exports all integration components |
| `public/story/act-1-relay.json` | FIXED | Removed JSON syntax errors |
| `public/story/act-8-micro32p.json` | FIXED | Removed JSON syntax errors |
| `public/story/act-9-micro32s.json` | FIXED | Removed JSON syntax errors |
| `src/styles/main.css` | FIXED | Fixed story content scrolling CSS |

