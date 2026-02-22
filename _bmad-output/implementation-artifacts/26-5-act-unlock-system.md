# Story 26.5: Act Unlock System

Status: ready-for-dev

## Story

As a player progressing through the game,
I want a clear sense of advancement,
So that I feel accomplishment and see what's ahead.

## Acceptance Criteria

1. **Given** I complete 100% of the current act's goals **When** the act ends **Then** the next act unlocks **And** I receive clear feedback of progression **And** all previous acts remain accessible for replay

2. **Given** I have not completed the current act **When** I try to access a future act **Then** it is locked **And** I see what I need to complete to unlock it

## Tasks / Subtasks

- [ ] Task 1: Add act accessibility to StoryBrowser (AC: #1, #2)
  - [ ] 1.1 Accept `completedActNumbers` set in StoryBrowserData
  - [ ] 1.2 Lock acts beyond the player's current act (not expandable, not navigable)
  - [ ] 1.3 Show lock icon and "Complete Act N to unlock" text on locked acts
  - [ ] 1.4 Ensure completed and current acts remain fully navigable
  - [ ] 1.5 Add locked act CSS styling
  - [ ] 1.6 Write tests for locked/unlocked act behavior
- [ ] Task 2: Wire completion data into StoryBrowser from StoryModeContainer (AC: #1)
  - [ ] 2.1 Pass ActCompletionStorage data through openStoryBrowser()

## Dev Notes

### Current state

- ActCompletionStorage tracks completed act numbers in localStorage
- ActCompletionDetector records completions when user advances past an act
- ActCelebration shows overlay on act completion
- StageUnlockManager computes unlocked CPU stages from completion data
- JourneyMap already treats future acts as "locked" nodes (not clickable)
- StoryBrowser currently shows ALL acts with NO access restrictions

### What needs to change

StoryBrowser must respect act accessibility. Acts beyond the player's current act should be visually locked (collapsed, no expand, lock icon, requirement text). All previous and current acts remain fully navigable.

### References

- [Source: src/story/StoryBrowser.ts#createActSection]
- [Source: src/story/StoryModeContainer.ts#openStoryBrowser]
- [Source: src/progress/ActCompletionStorage.ts]
- [Source: src/progress/JourneyMapBuilder.ts - locked/upcoming node model]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6
