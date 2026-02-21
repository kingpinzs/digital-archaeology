# Story 21.6: Implement Solution Reveal

## Status: done

## Story
As a user,
I want to see the solution after trying,
So that I can learn from it.

## Acceptance Criteria
1. **Given** I've attempted an exercise **When** I click "Show Solution" **Then** a solution is shown
2. **And** the solution is explained
3. **And** I can compare to my attempt
4. **And** solution viewing is noted in stats

## Tasks
- [x] Add solution and solutionExplanation fields to ExerciseMetadata in types.ts
- [x] Add solutions and explanations to all 15 exercises in exerciseMetadata.ts
- [x] Create ExerciseSolutionPanel UI component (with SolutionViewStorage)
- [x] Wire solution panel into exercise flow in App.ts (button-triggered, not auto-show)
- [x] Track solution viewing via SolutionViewStorage (separate from ExerciseProgressStorage for SRP)
- [x] Tests for solution panel and metadata
- [x] Code review fixes (button-triggered reveal, role="alert" on warning, helper cleanup)

## Dev Notes
- solution: string (complete working assembly code)
- solutionExplanation: string (explanation of the approach)
- "Show Solution" button appears alongside hints/results after user has attempted
- Panel shows solution code, explanation, and side-by-side diff concept
- Track whether user viewed solution per exercise in ExerciseProgressStorage
