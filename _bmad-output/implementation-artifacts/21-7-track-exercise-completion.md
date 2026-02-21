# Story 21.7: Track Exercise Completion

## Status: done

## Story
As a user,
I want my exercise progress tracked,
So that I see my skill growth.

## Acceptance Criteria
1. **Given** I complete exercises **When** I view my progress **Then** I see completed exercises per stage
2. **And** I see my scores/times
3. **And** I see improvement over time
4. **And** completion unlocks achievements

## Tasks
- [x] Extend ExerciseProgressStorage with attempt tracking (exerciseId, timestamp, passed, solutionViewed)
- [x] Add attempt validation and sanitization for corrupt localStorage data
- [x] Add attempt eviction cap (500 max) to prevent unbounded growth
- [x] Create ExerciseProgressPanel UI component showing per-stage completion with progress bars
- [x] Show improvement indicators ("passed on attempt N") for exercises with multiple attempts
- [x] Add "View Progress" button to ExerciseBrowser header via onViewProgress callback
- [x] Wire progress panel into App.ts (recordAttempt in validateExercise, shared SolutionViewStorage)
- [x] Fix missing exerciseBrowser.destroy() in App teardown
- [x] Add CSS for progress panel and browser progress button
- [x] Tests for ExerciseProgressStorage attempt tracking (18 tests) and ExerciseProgressPanel (21 tests)
- [x] Code review fixes (5 issues fixed: attempt validation, eviction cap, excessive reads, browser destroy, improvement display)

## Dev Notes
- ExerciseProgressStorage already tracks completed IDs (Story 21-1)
- Extended with attempt history: { exerciseId, timestamp, passed, solutionViewed }
- Attempts array validated on load: malformed entries are filtered out
- getStageSummary refactored to load once instead of twice per call
- Show completion badges per stage in the exercise browser
- Progress panel accessible from exercise browser header via "View Progress" button
- Solution-viewed exercises noted differently from self-completed ones
- Achievement integration (AC4) deferred to achievement system stories
