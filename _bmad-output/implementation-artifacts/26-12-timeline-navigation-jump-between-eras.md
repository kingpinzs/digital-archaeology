# Story 26-12: Timeline Navigation — Jump Between Eras

Status: done

## Story

**As a** player experiencing the game,
**I want** to jump between timelines and eras freely,
**So that** I can follow my curiosity and always return.

## Acceptance Criteria

1. **Given** I am anywhere in the experience **When** I want to explore a different era **Then** I can jump to any era on the golden path
2. **Given** I have explored alternate timelines **When** I open the timeline **Then** I can jump to any explored branch
3. **Given** I jump to a different era **When** I want to return **Then** I can return to where I was (bookmark)
4. **Given** navigation is non-linear **Then** I never lose progress when exploring

## Current State Analysis

### Already Working
- JourneyMap onNavigate callback jumps to first scene of any completed/current act
- Scene-level navigation via preview panel (Story 26.6)
- Branch indicators on timeline nodes (Story 26.7)
- StoryEngine.goToScene() handles act transitions, persona changes, mindset updates
- StoryEngine tracks sceneHistory for backwards navigation

### Gaps to Fill
1. **No "return to where I was" mechanism** — once you jump, the only way back is re-navigating
2. **Branch destinations not navigable** — branch points show indicators but can't jump to branch content
3. **No visual "time travel" feedback** — jumping between eras feels like a page load, not time travel
4. **Locked nodes block exploration** — upcoming/locked acts can't be visited (appropriate for gameplay)

## Technical Design

### Task 1: Add Bookmark/Return Mechanism to StoryEngine

**Files:** `src/story/StoryState.ts`, `src/story/StoryEngine.ts`

Add a `navigationBookmark` field to StoryProgress that saves the "home" position before a jump:

```typescript
// StoryState.ts — add to StoryProgress
/** Story 26.12: Saved position before timeline jump (for "return" navigation) */
navigationBookmark?: StoryPosition;
```

Add `setNavigationBookmark()`, `getNavigationBookmark()`, `clearNavigationBookmark()`, and `returnToBookmark()` to StoryEngine.

### Task 2: Wire Bookmark into Journey Map Navigation

**Files:** `src/story/StoryModeContainer.ts`

Before calling `navigateToAct()` or `navigateToScene()` from the journey map, save the current position as a bookmark. Show a "Return to [era name]" button in the StoryNav when a bookmark is active.

### Task 3: Return Button in StoryNav

**Files:** `src/story/StoryNav.ts`, `src/styles/main.css`

Add a "Return" button (visible only when a navigation bookmark exists) that navigates back to the bookmarked position and clears the bookmark.

### Task 4: Branch Navigation from Timeline

**Files:** `src/progress/JourneyMap.ts`

In the era detail view (Story 26.11), when branch points are listed under "Alternate Timelines", make them clickable — clicking navigates to the branch scene (the choice scene where the branch occurred).

### Task 5: Time-Travel Navigation Indicator

**Files:** `src/story/SceneRenderer.ts`, `src/styles/main.css`

When the StoryEngine detects an act-jump (navigating more than 1 act forward or backward), show a brief "time travel" indicator — a subtle era-transition banner at the top of the scene indicating "Traveling to [Era Name]..." that fades after 2 seconds.

## Testing Plan

### Unit Tests (StoryEngine)
- `setNavigationBookmark()` saves current position
- `getNavigationBookmark()` returns saved position
- `clearNavigationBookmark()` clears bookmark
- `returnToBookmark()` navigates to saved position and clears it
- Bookmark persists across save/load
- No bookmark by default

### Unit Tests (StoryModeContainer)
- Journey map navigate sets bookmark before jumping
- Return button visible when bookmark exists
- Return button hidden when no bookmark
- Return button click navigates to bookmark and clears it

### Unit Tests (JourneyMap)
- Branch points in era detail are clickable
- Clicking branch point calls onSceneNavigate

## Implementation Order

1. Task 1: Bookmark mechanism (foundation)
2. Task 2: Wire into journey map navigation
3. Task 3: Return button in StoryNav
4. Task 4: Branch navigation from timeline
5. Task 5: Time-travel indicator (polish)
