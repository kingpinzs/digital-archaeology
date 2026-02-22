# Story 26-10: Seamless Story-Lab-Story Loop

Status: ready-for-dev

## Story

**As a** player experiencing the game,
**I want** smooth, contextual transitions between story and building,
**So that** it feels like one cohesive experience — not two disconnected modes.

## Acceptance Criteria

1. **Given** I complete the end-to-end loop **When** I play from Story -> Lab -> Story **Then** transitions are smooth and contextual **And** the story setup matches the Lab challenge **And** the story resolution acknowledges my Lab work **And** my emotional journey feels continuous

2. **Given** I complete Act 0 fully **When** I transition to Act 1 **Then** my Act 0 capabilities carry forward **And** the story references my previous accomplishments **And** the experience feels like one continuous game

3. **Given** a builder scene sends me to Lab **When** I click Enter Lab **Then** the correct challenge context is passed (simulator type, scene ID, era, act title) so the lab knows what to show

4. **Given** I return from a completed challenge **When** the story resumes **Then** the completion banner appears AND the story tracks which challenge I just completed so future scenes can reference it

## Technical Design

### Task 1: Track Completed Challenges in StoryProgress

**Files:** `src/story/StoryState.ts`, `src/story/StoryEngine.ts`

Add a `completedChallenges` array to StoryProgress so the story can remember what the player has built:

```typescript
// StoryState.ts — add to StoryProgress interface
/** Story 26.10: Scene IDs of completed lab challenges (for post-lab acknowledgment) */
completedChallenges?: string[];
```

StoryEngine gets two new methods:

```typescript
// StoryEngine.ts
/** Mark a challenge scene as completed. */
markChallengeCompleted(sceneId: string): void {
  if (!this.state.progress) return;
  const existing = this.state.progress.completedChallenges ?? [];
  if (existing.includes(sceneId)) return;
  this.state.progress = {
    ...this.state.progress,
    completedChallenges: [...existing, sceneId],
    lastPlayedAt: Date.now(),
  };
  this.saveProgress();
}

/** Check if a specific challenge was completed. */
isChallengeCompleted(sceneId: string): boolean {
  return this.state.progress?.completedChallenges?.includes(sceneId) ?? false;
}

/** Get all completed challenge scene IDs. */
getCompletedChallenges(): string[] {
  return this.state.progress?.completedChallenges ?? [];
}
```

### Task 2: Wire Challenge Completion Into Story Flow

**Files:** `src/story/StoryController.ts`, `src/story/StoryModeContainer.ts`

StoryController gets a new method that StoryModeContainer calls when the player returns from a completed challenge:

```typescript
// StoryController.ts
/**
 * Notify the engine that a challenge was completed, then advance.
 * Called by StoryModeContainer.advanceAfterChallenge() with the scene ID.
 * Story 26.10: Seamless Story-Lab-Story Loop
 */
completeChallengeAndAdvance(challengeSceneId: string): void {
  this.engine.markChallengeCompleted(challengeSceneId);
  this.nextScene();
}
```

StoryModeContainer.advanceAfterChallenge() needs to know the challenge scene ID so it can pass it through. The ChallengeStation already has `getCurrentSceneId()`. Wire it:

```typescript
// StoryModeContainer.ts — update advanceAfterChallenge signature
advanceAfterChallenge(challengeSceneId?: string): void {
  if (challengeSceneId) {
    this.storyController?.completeChallengeAndAdvance(challengeSceneId);
  } else {
    this.storyController?.nextScene();
  }
  this.showChallengeCompletionBanner();
}
```

App.ts already has `this.challengeStation.getCurrentSceneId()` — use it in the return callback:

```typescript
// App.ts — update onReturnToStory callback
this.challengeStation.setOnReturnToStory((completed: boolean) => {
  if (completed) {
    const sceneId = this.challengeStation?.getCurrentSceneId() ?? undefined;
    this.storyModeContainer?.advanceAfterChallenge(sceneId);
  }
  this.handleModeChange('story');
  challengeTab?.classList.add('da-lab-station-tab--hidden');
});
```

### Task 3: Builder Scene ChallengeContext Fix

**Files:** `src/story/SceneRenderer.ts`

The builder scene's `onEnterLab` callback currently passes NO context:

```typescript
// Current (broken) — SceneRenderer.ts line 520-524:
builderScene.onEnterLab(() => {
  if (this.callbacks.onEnterLab) {
    this.callbacks.onEnterLab(); // No context!
  }
});
```

Fix: build a ChallengeContext from the BuilderChallengeData, just like challenge scenes do:

```typescript
builderScene.onEnterLab(() => {
  if (this.callbacks.onEnterLab) {
    const scene = this.currentContext?.scene;
    const builder = scene?.builderChallenge;
    if (builder) {
      const context: ChallengeContext = {
        sceneId: scene!.id,
        challengeData: {
          title: builder.title,
          objectives: builder.objectives,
          // Use labContext to determine simulator, or fall back to undefined
          simulatorId: undefined,
        },
        simulatorType: 'counting-board', // fallback — builder challenges currently don't specify a simulator
        era: this.currentContext?.act.era,
        actTitle: this.currentContext?.act.title,
      };
      this.callbacks.onEnterLab(context);
    } else {
      this.callbacks.onEnterLab();
    }
  }
});
```

Note: This ensures the lab receives era/actTitle for its context banner, but builder challenges may not have a simulatorId. The ChallengeStation already handles undefined simulators gracefully (shows objectives without a simulator).

### Task 4: Completion-Aware Scene Rendering

**Files:** `src/story/SceneRenderer.ts`, `src/story/StoryController.ts`

Extend SceneRenderContext with an optional `lastCompletedChallenge` field so scenes rendered immediately after a lab return can acknowledge the accomplishment:

```typescript
// SceneRenderer.ts — extend SceneRenderContext
/** Story 26.10: Scene ID of the most recently completed challenge (set on post-lab scenes) */
lastCompletedChallenge?: string;
```

StoryController populates it in `getCurrentSceneContext()`:

```typescript
// In getCurrentSceneContext(), after building the context:
// Story 26.10: Attach last completed challenge for post-lab acknowledgment
const completedChallenges = this.engine.getCompletedChallenges();
const lastCompleted = completedChallenges.length > 0
  ? completedChallenges[completedChallenges.length - 1]
  : undefined;
```

SceneRenderer checks this field when rendering narrative text and can inject a contextual lead-in:

```typescript
// In renderScene(), after branch badge, before chapter header:
if (context.lastCompletedChallenge) {
  const acknowledgment = document.createElement('div');
  acknowledgment.className = 'da-scene-challenge-acknowledgment';
  acknowledgment.setAttribute('role', 'status');
  acknowledgment.textContent = 'Your work in the lab has been verified. The story continues...';
  this.sceneContainer!.appendChild(acknowledgment);
}
```

### Task 5: CSS for Challenge Acknowledgment

**Files:** `src/styles/main.css`

```css
/* Story 26.10: Post-challenge acknowledgment */
.da-scene-challenge-acknowledgment {
  padding: 0.5rem 1rem;
  margin-bottom: 0.75rem;
  background: rgba(76, 175, 80, 0.1);
  border-left: 3px solid var(--accent-green, #4caf50);
  border-radius: 4px;
  color: var(--accent-green, #4caf50);
  font-family: 'Crimson Text', Georgia, serif;
  font-size: 0.85rem;
  font-style: italic;
  letter-spacing: 0.02em;
}
```

## Implementation Order

1. Task 1: completedChallenges tracking (foundation)
2. Task 2: Wire completion into story flow (depends on Task 1)
3. Task 3: Builder scene ChallengeContext fix (independent)
4. Task 4: Completion-aware rendering (depends on Task 1)
5. Task 5: CSS styling (depends on Task 4)

## Verification

1. `npx vitest run` — all tests pass
2. `npm run build` — no errors
3. After completing a challenge in lab, the story advances AND tracks the completion
4. Builder scene "Enter Lab" now passes ChallengeContext (era banner visible in lab)
5. Post-challenge scenes show acknowledgment banner
6. Challenge completions persist across sessions (saved in StoryProgress)
