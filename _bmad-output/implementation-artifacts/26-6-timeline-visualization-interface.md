# Story 26.6: Timeline Visualization Interface

Status: done

## Story

As a player navigating through time,
I want to see my journey visually,
So that I understand where I am and where I can go.

## Acceptance Criteria

1. **Given** I want to see my progression **When** I open the Timeline interface **Then** I see a visual timeline of my complete journey **And** I see my current position clearly marked **And** the golden path is visually distinct

2. **Given** I want to explore a different time **When** I hover over a point on the timeline **Then** I can peek into what's there (preview) **And** I can click to jump to that point

3. **Given** the timeline interface **When** I interact with it **Then** it is expandable/collapsible **And** granularity allows navigation to any accessible point

## Tasks / Subtasks

- [ ] Task 1: Add hover preview tooltip to JourneyMap act nodes (AC: #2)
  - [ ] 1.1 Extend JourneyMapShowOptions to accept StoryAct data
  - [ ] 1.2 On hover over completed/current act node, show tooltip with chapters+scenes
  - [ ] 1.3 Each scene in preview shows type icon and visited state
  - [ ] 1.4 Clicking a scene in preview navigates to it and dismisses the map
  - [ ] 1.5 Add preview tooltip CSS
  - [ ] 1.6 Write tests for hover preview rendering and scene click
- [ ] Task 2: Add "Golden Path" label to timeline (AC: #1)
  - [ ] 2.1 Add a "Golden Path" header above the timeline nodes
  - [ ] 2.2 Mark choice scenes as potential branch points in preview
  - [ ] 2.3 Write tests for golden path label
- [ ] Task 3: Wire StoryAct data into JourneyMap from StoryModeContainer (AC: #3)
  - [ ] 3.1 Pass acts and visitedScenes through openJourneyMap()

## Dev Notes

### Current state

- JourneyMap Timeline tab shows 11 act-level nodes: completed/current/upcoming/locked
- Completed+current nodes are clickable (navigates to act's first scene)
- No hover preview — no way to see scenes within an act
- No "golden path" concept in the UI
- No branch visualization (branches not yet in data model — Story 26.7)

### What needs to change

Enhance Timeline tab with hover preview for scene-level detail and navigation. Add golden path visual identity. Prepare branch point markers for Story 26.7.

### References

- [Source: src/progress/JourneyMap.ts#renderTimelineTab - act node rendering]
- [Source: src/progress/JourneyMapBuilder.ts - timeline data construction]
- [Source: src/progress/types.ts - JourneyMapData, JourneyNode]
- [Source: src/story/StoryModeContainer.ts#openJourneyMap]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6
