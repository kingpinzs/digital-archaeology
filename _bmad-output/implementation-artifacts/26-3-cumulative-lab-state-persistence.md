# Story 26.3: Cumulative Lab State Persistence

Status: ready-for-dev

## Story

As a player returning to the Lab,
I want to continue where I left off,
so that my work builds on itself like real history.

## Acceptance Criteria

1. **Given** I have previous Lab work saved **When** I enter the Lab for a new challenge **Then** I see my last working state (code, circuits, designs) **And** my progress builds on what I've already created **And** new challenges extend previous work (not restart)

2. **Given** I want to clear old work **When** I archive my current work **Then** it moves to the archive library **And** my active Lab state is cleared **And** archived work is accessible but not active

## Tasks / Subtasks

- [ ] Task 1: Create ChallengeProgressStorage (AC: #1)
  - [ ] 1.1 Create localStorage-based storage for completed objectives per sceneId
  - [ ] 1.2 Write tests for save/load/clear operations
- [ ] Task 2: Wire ChallengeStation to restore objective state (AC: #1)
  - [ ] 2.1 Inject ChallengeProgressStorage into ChallengeStation
  - [ ] 2.2 On setChallengeContext, restore completed objectives from storage
  - [ ] 2.3 On objective complete, save to storage
  - [ ] 2.4 Write tests verifying restoration and persistence
- [ ] Task 3: Add archive support to ProjectStorage (AC: #2)
  - [ ] 3.1 Add 'archives' object store to IndexedDB
  - [ ] 3.2 Add archiveProject() method (moves current to archives with timestamp)
  - [ ] 3.3 Add listArchives() and loadArchive() methods
  - [ ] 3.4 Write tests for archive operations

## Dev Notes

### Current state

- Code editor: auto-persisted to IndexedDB (ProjectStorage) every 2s — already cumulative
- Simulator state: NOT persisted — each challenge starts fresh
- Challenge objectives: tracked in-memory only, lost on page reload
- No archive concept exists

### Architecture decisions

- ChallengeProgressStorage uses localStorage (small data: just objective IDs per scene)
- ProjectStorage archives use IndexedDB (large data: code snapshots)
- Objective restoration works with existing ChallengeObjectives component
- DB version bumps from 1 to 2 to add archives store

### References

- [Source: src/simulators/ChallengeStation.ts — challenge orchestrator]
- [Source: src/state/ProjectStorage.ts — IndexedDB code persistence]
- [Source: src/story/StoryStorage.ts — pattern for localStorage services]
- [Source: src/simulators/types.ts — Simulator interface]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6
