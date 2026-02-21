# Story 21.5: Implement Progressive Hints

## Status: done

## Story
As a user,
I want progressive hints when I'm stuck on an exercise,
So that I can get unstuck without seeing the full solution.

## Acceptance Criteria
1. **Given** I'm stuck on an exercise **When** I request hints **Then** I get 3-5 progressive hints
2. **And** each hint reveals more
3. **And** hints don't give the full solution
4. **And** hint usage is tracked

## Tasks
- [x] Add hints field to ExerciseMetadata in types.ts
- [x] Add hints to all 15 exercises in exerciseMetadata.ts
- [x] Create ExerciseHintsPanel UI component (with ExerciseHintStorage for localStorage persistence)
- [x] Wire hints panel into exercise flow in App.ts
- [x] Hint usage tracking via ExerciseHintStorage (separate from ExerciseProgressStorage for SRP)
- [x] Tests for hints panel and metadata
- [x] Code review fixes

## Dev Notes
- hints: readonly string[] (3-5 progressive hints per exercise)
- Each hint should reveal a bit more without giving away the full solution
- Hints panel appears alongside or within the results panel area
- Track which hints user has revealed per exercise in localStorage
