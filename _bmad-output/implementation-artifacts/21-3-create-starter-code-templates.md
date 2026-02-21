# Story 21.3: Create Starter Code Templates

## Status: in-progress

## Story
As a user,
I want starter code for exercises,
So that I have a starting point.

## Acceptance Criteria
1. **Given** I start an exercise **When** the exercise loads **Then** starter code appears in the editor
2. **And** the code has TODO comments
3. **And** the code has the basic structure
4. **And** I know what to implement

## Tasks
- [ ] Add starterCode field to ExerciseMetadata type
- [ ] Create starter code templates for all 15 exercises
- [ ] Wire onExerciseSelect in App.ts to load starter code into editor
- [ ] Add unsaved work confirmation before loading
- [ ] Update status bar with exercise name
- [ ] Close exercise browser after selection
- [ ] Tests for starter code templates and loading
- [ ] Code review fixes

## Dev Notes
- Follow handleExampleSelect pattern: confirmUnsavedChanges → setValue → update status → track original
- Starter code stored as inline strings in exerciseMetadata.ts (not separate files)
- Each template has TODO comments explaining what to implement
- Templates use stage-appropriate assembly syntax
