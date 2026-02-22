# Story 26-8: Time-Travel Replay

## Story
**As a** player who has progressed through the story,
**I want to** replay and revisit past scenes without losing my progress,
**So that** I can re-experience key moments, review choices I made, and explore the story at my own pace.

## Acceptance Criteria
1. Engine tracks replay state separately from progress — visiting past scenes doesn't overwrite current position
2. Replay panel shows a chronological list of visited scenes with context (act, chapter, scene type)
3. Clicking a scene in the replay list triggers the time-travel portal animation and loads that scene in read-only replay mode
4. Visual indicator distinguishes replay mode from live play (e.g., "Replaying" badge)
5. Player can exit replay mode and return to their current position
6. Scene renderer shows replay content but disables choice/progression controls
7. All tests pass (target: 28+ new tests)

## Technical Design

### Task 1: Replay State in StoryEngine
**Files:** `src/story/StoryEngine.ts`, `src/story/StoryState.ts`

Add replay tracking:
- `StoryEngineState.replaySceneId: string | null` — currently replaying scene (null = not replaying)
- `StoryEngine.enterReplayMode(sceneId: string): void` — enter replay for a past scene
- `StoryEngine.exitReplayMode(): void` — return to live play
- `StoryEngine.isInReplayMode(): boolean` — check replay state
- `StoryEngine.getReplayScene(): StoryScene | null` — get the scene being replayed
- `StoryEngine.getVisitedSceneTimeline(): TimelineEntry[]` — return ordered visited scenes with context

New type:
```typescript
interface TimelineEntry {
  sceneId: string;
  actNumber: number;
  chapterNumber: number;
  sceneType: string;
  actTitle: string;
  chapterTitle: string;
  visitedAt: number; // timestamp approximation from choice ordering
  choiceMade?: string; // choiceId if a choice was recorded at this scene
}
```

### Task 2: Replay Panel Component
**Files:** `src/story/ReplayPanel.ts` (NEW), `src/styles/main.css`

Modal component (similar to StoryBrowser/StoryJournal pattern):
- Shows chronological list of visited scenes grouped by act
- Each entry shows: scene type icon, act/chapter context, "choice made" indicator
- Current replay position highlighted
- "Return to Present" button at top
- Click a scene → calls `onReplayScene(sceneId)`

### Task 3: Replay Mode in SceneRenderer
**Files:** `src/story/SceneRenderer.ts`

When rendering in replay mode:
- Show "REPLAYING" badge overlay (top-right of content area)
- Disable choice cards (add `--disabled` class, prevent clicks)
- Disable "Enter the Lab" button
- Disable story actions footer forward/next buttons
- Show "Return to Present →" button in footer instead

### Task 4: Wire Replay Through StoryController & Container
**Files:** `src/story/StoryController.ts`, `src/story/StoryModeContainer.ts`, `src/story/StoryNav.ts`

- Add replay button to StoryNav (clock icon ⏱)
- StoryController methods: `startReplay(sceneId)`, `stopReplay()`, `openReplayPanel()`
- On replay scene select: play portal animation ('chapter' mode, fast), then render scene
- On "Return to Present": play portal animation, restore current progress scene
- Wire replay panel open/close through StoryModeContainer

## Implementation Order
1. Task 1: Engine replay state (foundation)
2. Task 2: Replay panel UI
3. Task 3: Replay mode rendering
4. Task 4: Wiring
