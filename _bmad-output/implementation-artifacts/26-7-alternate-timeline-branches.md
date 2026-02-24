# Story 26.7: Alternate Timeline Branches

Status: done

## Story

As a player at a choice point,
I want to explore "what if" scenarios,
So that I can experience alternate computing history.

## Acceptance Criteria

1. **Given** I reach a branch point in the story **When** I choose an alternate path instead of the golden path **Then** I enter an alternate timeline with its own unique story content **And** this timeline reflects "what if history went this way" **And** the story content is authentic to that alternate path

2. **Given** I am on an alternate timeline **When** I complete challenges **Then** I unlock different inventions than the golden path **And** these different inventions give me different Lab capabilities **And** my tools reflect my timeline's history

3. **Given** I am on an alternate timeline **When** I reach certain points **Then** I may rejoin the golden path (if the tech converges) **Or** I may continue on a permanent alternate timeline **And** the timeline visualization shows this clearly

## Tasks / Subtasks

- [ ] Task 1: Add branch data model types (AC: #1, #3)
  - [ ] 1.1 Add TimelineBranch interface (branchId, label, parentBranch, divergeSceneId, rejoinsAt)
  - [ ] 1.2 Add isBranchPoint flag to ChoiceData type
  - [ ] 1.3 Add branchId + timelineLabel to ChoiceData for branch-creating choices
  - [ ] 1.4 Add currentBranchId to StoryProgress for tracking active branch
  - [ ] 1.5 Write unit tests for new types (construction, defaults)
- [ ] Task 2: Track branch state in StoryEngine (AC: #1, #3)
  - [ ] 2.1 Add currentBranchId field to StoryEngine state
  - [ ] 2.2 On recordChoice, detect if choice creates a branch (isBranchPoint)
  - [ ] 2.3 Set currentBranchId when entering a branch
  - [ ] 2.4 Clear/reset currentBranchId when rejoining golden path
  - [ ] 2.5 Persist currentBranchId in localStorage
  - [ ] 2.6 Write tests for branch detection + state tracking
- [ ] Task 3: Branch visualization in JourneyMap timeline (AC: #3)
  - [ ] 3.1 Extend JourneyNode with branchPoints field (list of branch labels at that act)
  - [ ] 3.2 Render branch indicators on act nodes that contain branch points
  - [ ] 3.3 Show active branch label in timeline header when on alternate timeline
  - [ ] 3.4 Add CSS for branch indicators and active branch badge
  - [ ] 3.5 Write tests for branch visualization
- [ ] Task 4: Branch-aware scene preview in JourneyMap (AC: #1, #3)
  - [ ] 4.1 Mark choice scenes with branch icon in preview tooltip
  - [ ] 4.2 Show branch label for branch-creating choices
  - [ ] 4.3 Show "Rejoin" indicator when branch converges back
  - [ ] 4.4 Write tests for branch-aware preview

## Dev Notes

### Current state

- StoryEngine records choices as (sceneId, choiceId, timestamp) — no branching logic
- Choices navigate to nextScene but don't track "which timeline"
- JourneyMap shows linear timeline only — no branch visualization
- Story content has choice scenes but they function linearly
- No concept of "golden path" vs "alternate path" in data model

### What needs to change

Add branch infrastructure: types, engine state tracking, and visualization. This story builds the RAILS for branches — actual alternate story content authoring is a follow-on concern. The data model must support: identifying branch points, tracking which branch the player is on, and visualizing branches in the timeline.

### References

- [Source: src/story/content-types.ts - ChoiceData interface]
- [Source: src/story/StoryEngine.ts - recordChoice method]
- [Source: src/story/StoryState.ts - StoryProgress type]
- [Source: src/progress/JourneyMap.ts - timeline rendering]
- [Source: src/progress/types.ts - JourneyNode type]
- [Source: src/progress/JourneyMapBuilder.ts - node building]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6
