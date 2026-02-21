# Story 21.2: Implement Exercise Metadata

## Status: in-progress

## Story
As a developer,
I want exercise descriptions,
So that users understand goals.

## Acceptance Criteria
1. **Given** an exercise exists **When** I view its details **Then** I see title and description
2. **And** I see difficulty level
3. **And** I see concepts covered
4. **And** I see estimated time
5. **And** I see prerequisites

## Tasks
- [x] Exercise metadata model (types.ts, exerciseMetadata.ts) — done in 21-1
- [x] Basic card display (title, difficulty, description, time, concepts) — done in 21-1
- [ ] Add prerequisite display to exercise cards
- [ ] Add expanded exercise detail panel with full metadata
- [ ] Show prerequisite exercise titles (not just IDs)
- [ ] Tests for new detail panel and prerequisite display
- [ ] Code review fixes

## Dev Notes
- Metadata model already complete from Story 21-1
- Cards already show title, difficulty badge, description, time, and first 3 concepts
- Need to add: prerequisite display, full concepts list, expanded detail panel
- Follow existing card patterns in ExerciseBrowser.ts
