# Story 26.2: Story-Driven Lab Entry

Status: done

## Story

As a player in Story Mode reading the narrative,
I want the story to lead me naturally to building,
so that I understand why I need to invent things.

## Acceptance Criteria

1. **Given** I am in Story Mode reading the narrative **When** the story presents a problem I cannot yet solve **Then** "Enter the Lab" is the ONLY way to progress the story **And** there is no "Continue" button that skips Lab work **And** the story makes clear what problem needs solving **And** I understand the context before entering Lab

2. **Given** I click "Enter the Lab" **When** Lab Mode loads **Then** I see the problem objectives from the story **And** my previous Lab work is loaded (cumulative state) **And** the era/context is visible

## Tasks / Subtasks

- [ ] Task 1: Disable Continue button on challenge scenes (AC: #1)
  - [ ] 1.1 In SceneRenderer.renderFooter(), add `!isChallenge` to setContinueEnabled check
  - [ ] 1.2 In StoryController.renderCurrentScene(), add challenge check to updateFooterState
  - [ ] 1.3 Write tests verifying Continue is disabled on challenge scenes
- [ ] Task 2: Add era/context to ChallengeContext (AC: #2)
  - [ ] 2.1 Extend ChallengeContext interface with optional era and actTitle fields
  - [ ] 2.2 Populate era/actTitle when building ChallengeContext in SceneRenderer
  - [ ] 2.3 Display era banner in ChallengeStation sidebar
  - [ ] 2.4 Write tests verifying era context appears in ChallengeStation
- [ ] Task 3: Verify existing objectives display (AC: #2)
  - [ ] 3.1 Confirm ChallengeObjectives already displays story objectives in lab
  - [ ] 3.2 Write/verify test that objectives from story appear in ChallengeStation

## Dev Notes

### Key finding: Continue is NOT disabled for challenge scenes

In `SceneRenderer.ts:606`, the Continue button disabling logic is:
```typescript
this.footer.setContinueEnabled(hasNextScene && !hasChoices && !isDecision && !isBuilder);
```
`isChallenge` is missing from this check, so users can skip challenges.

Additionally, `StoryController.ts:510-513` calls `updateFooterState(hasPrevious, hasNext && !hasChoices)` which also doesn't check for challenges, potentially re-enabling Continue after scene render.

### Era/context not shown in ChallengeStation

ChallengeStation sidebar shows objectives, instructions, reset, and return buttons. No era banner. ChallengeContext only has `sceneId`, `challengeData`, `simulatorType` — no era info. SceneRenderContext has `act.era` and `act.title` available at build time.

### What already works (don't change)

- EnterLabButton component exists with proper styling
- StoryActionsFooter has Enter Lab button (center, cyan)
- ChallengeContext flows from story → lab correctly
- ChallengeObjectives displays objectives in lab sidebar
- Simulator routing works (counting-board, suanpan, pascaline, analytical-engine)
- Return to story flow with story advancement

### Project Structure Notes

- All changes in `digital-archaeology-web/src/`
- Story types: `src/story/types.ts`, `src/story/content-types.ts`
- Scene rendering: `src/story/SceneRenderer.ts`
- Story navigation: `src/story/StoryController.ts`
- Lab challenge: `src/simulators/ChallengeStation.ts`

### References

- [Source: digital-archaeology-web/src/story/SceneRenderer.ts#renderFooter lines 598-611]
- [Source: digital-archaeology-web/src/story/StoryController.ts#renderCurrentScene lines 501-514]
- [Source: digital-archaeology-web/src/simulators/ChallengeStation.ts#setChallengeContext lines 69-140]
- [Source: digital-archaeology-web/src/story/types.ts#ChallengeContext lines 141-145]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### File List

- `src/story/SceneRenderer.ts` (modify)
- `src/story/StoryController.ts` (modify)
- `src/story/types.ts` (modify)
- `src/simulators/ChallengeStation.ts` (modify)
- `src/story/SceneRenderer.test.ts` (modify)
- `src/simulators/ChallengeStation.test.ts` (modify)
