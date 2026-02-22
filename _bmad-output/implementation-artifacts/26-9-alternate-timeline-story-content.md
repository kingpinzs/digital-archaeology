# Story 26-9: Alternate Timeline Story Content

Status: ready-for-dev

## Story

**As a** player exploring alternate timelines,
**I want** rich alternate history narratives when I branch off the golden path,
**So that** each path feels authentic, educational, and as complete as the main story.

## Acceptance Criteria

1. **Given** I branch to an alternate timeline **When** I read the story content **Then** the narrative reflects the alternate history authentically **And** characters, dialogue, and events match the "what if" scenario **And** technical content explains the alternate inventions

2. **Given** alternate timeline content is needed **When** creating new branch points **Then** both paths have complete story content **And** alternate labs have appropriate challenges **And** alternate inventions are historically plausible

3. **Given** I am on an alternate timeline **When** I look at the scene **Then** a visual indicator shows I'm on a branch (branch badge with label) **And** the scene renders identically to golden path scenes in all other respects

4. **Given** the engine loads story content **When** an act contains branch content **Then** branch scenes are indexed and navigable just like golden-path scenes **And** the engine tracks which branch a scene belongs to

## Technical Design

### Task 1: BranchContent Type and StoryAct Extension

**Files:** `src/story/content-types.ts`, `src/story/types.ts`

Add `BranchContent` — a self-contained alternate path embedded in an act:

```typescript
// content-types.ts
export interface BranchContent {
  /** Branch ID matching TimelineBranch.id (e.g., "branch-stack-machine") */
  id: string;
  /** Human-readable label (e.g., "What if stack machines won?") */
  label: string;
  /** Scene ID where the branch diverges from the golden path */
  divergeSceneId: string;
  /** Choice ID that triggers this branch */
  choiceId: string;
  /** Scenes that form this alternate timeline (ordered) */
  scenes: StoryScene[];
  /** Scene ID where this branch rejoins the golden path (optional) */
  rejoinsAtSceneId?: string;
}
```

Extend `StoryAct`:
```typescript
export interface StoryAct {
  // ... existing fields ...
  /** Alternate timeline branches available in this act (Story 26.9) */
  branches?: BranchContent[];
}
```

### Task 2: Branch Scene Indexing in StoryEngine

**Files:** `src/story/StoryEngine.ts`

Extend `initialize()` to index branch scenes alongside golden-path scenes:

```typescript
// In initialize(), after indexing regular scenes:
for (const act of acts) {
  if (act.branches) {
    for (const branch of act.branches) {
      for (const scene of branch.scenes) {
        sceneIndex.set(scene.id, {
          scene,
          actNumber: act.number,
          chapterNumber: 0, // branch scenes don't belong to a numbered chapter
          branchId: branch.id,
        });
      }
    }
  }
}
```

The scene index entry type gains an optional `branchId`:
```typescript
private content: {
  acts: StoryAct[];
  sceneIndex: Map<string, {
    scene: StoryScene;
    actNumber: number;
    chapterNumber: number;
    branchId?: string; // Story 26.9: null/undefined = golden path
  }>;
} | null = null;
```

Add helper method:
```typescript
/** Get the branch ID for a scene (null = golden path) */
getBranchForScene(sceneId: string): string | null {
  return this.content?.sceneIndex.get(sceneId)?.branchId ?? null;
}

/** Get all branches for an act */
getActBranches(actNumber: number): BranchContent[] {
  const act = this.content?.acts.find(a => a.number === actNumber);
  return act?.branches ?? [];
}
```

### Task 3: Branch Content Validation in StoryLoader

**Files:** `src/story/StoryLoader.ts`

Extend `isStoryAct` to validate optional `branches` field:

```typescript
// In isStoryAct, after existing validation:
if (obj.branches !== undefined) {
  if (!Array.isArray(obj.branches)) return false;
  for (const branch of obj.branches) {
    if (!isBranchContent(branch)) return false;
  }
}
```

Add new type guard:
```typescript
function isBranchContent(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.label === 'string' &&
    typeof obj.divergeSceneId === 'string' &&
    typeof obj.choiceId === 'string' &&
    Array.isArray(obj.scenes) &&
    obj.scenes.length > 0 &&
    obj.scenes.every((s: unknown) => isStoryScene(s))
  );
}
```

### Task 4: Branch Visual Indicator in SceneRenderer

**Files:** `src/story/SceneRenderer.ts`, `src/styles/main.css`

When rendering a scene that belongs to a branch, show a branch badge:

In `renderScene()`, after building the scene container:
```typescript
const branchId = this.engine?.getBranchForScene(context.scene.id);
if (branchId) {
  this.sceneContainer.classList.add('da-scene-container--branch');
  const branchBadge = document.createElement('div');
  branchBadge.className = 'da-scene-branch-badge';
  // Look up the branch label from act data
  const branchLabel = this.getBranchLabel(branchId, context.act.number);
  branchBadge.textContent = branchLabel ?? 'Alternate Timeline';
  this.sceneContainer.appendChild(branchBadge);
}
```

SceneRenderer needs access to the engine (or the branch lookup can be passed through context). The cleanest approach: add `branchId?: string` to `SceneRenderContext` and populate it in StoryController when building context.

CSS:
```css
.da-scene-container--branch {
  border-left: 3px solid var(--copper-accent, #b87333);
}
.da-scene-branch-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: var(--copper-accent, #b87333);
  color: var(--parchment, #f4e4c1);
  font-size: 0.7rem;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

### Task 5: SceneRenderContext Branch Awareness

**Files:** `src/story/SceneRenderer.ts` (types), `src/story/StoryController.ts`

Extend `SceneRenderContext` with optional branch fields:
```typescript
interface SceneRenderContext {
  // ... existing fields ...
  /** Story 26.9: Branch ID if this scene is on an alternate timeline */
  branchId?: string;
  /** Story 26.9: Branch label for display */
  branchLabel?: string;
}
```

In StoryController, when building scene context:
```typescript
const branchId = this.engine.getBranchForScene(scene.id);
let branchLabel: string | undefined;
if (branchId) {
  const branches = this.engine.getActBranches(actNumber);
  branchLabel = branches.find(b => b.id === branchId)?.label;
}
// Include in context
const context: SceneRenderContext = {
  // ... existing fields ...
  branchId,
  branchLabel,
};
```

## Implementation Order

1. Task 1: BranchContent type (foundation)
2. Task 2: Engine indexing (makes branch scenes navigable)
3. Task 3: Loader validation (safety net for content)
4. Task 4 + 5: Visual indicator + context wiring (UX)

Tasks 1-3 are sequential (each builds on the prior). Tasks 4+5 can be done together after 2.

## Dev Notes

### Current state

- Story 26-7 added `isBranchPoint`/`branchLabel` on ChoiceData, `TimelineBranch` type, and engine branch tracking (`currentBranchId`, `isOnAlternateBranch()`, `rejoinGoldenPath()`)
- No JSON content uses `isBranchPoint` yet — branch infrastructure is engine-only
- The `sceneIndex` only indexes scenes from the standard act→chapter→scene hierarchy
- Existing content uses short convergent choices (4a/4b/4c → 5) but no true alternate timelines
- ChoiceCard does not visually indicate branch points
- SceneRenderer has no branch awareness

### What this story adds

This story bridges the gap between the branch tracking infrastructure (26-7) and actual branch content. It:
1. Defines how branch scenes live in the content structure (`BranchContent` on `StoryAct`)
2. Indexes branch scenes so the engine can navigate to them
3. Validates branch content on load
4. Shows a visual badge when the player is on an alternate timeline

### What this story does NOT add

- Actual authored branch content in JSON files (that's content authoring work)
- Branch-specific ChoiceCard styling (that's 26-16: Brave Alternatives)
- Timeline visualization of branches (that's already done in 26-6/26-7 JourneyMap)

### References

- [Source: src/story/content-types.ts - StoryAct, StoryScene]
- [Source: src/story/types.ts - TimelineBranch, ChoiceData.isBranchPoint]
- [Source: src/story/StoryEngine.ts - initialize(), sceneIndex, branch tracking]
- [Source: src/story/StoryLoader.ts - isStoryAct validator]
- [Source: src/story/SceneRenderer.ts - renderScene()]
- [Source: src/story/StoryController.ts - SceneRenderContext]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6
