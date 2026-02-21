# Story 21.1: Create Exercise Browser

Status: in-progress

## Story

As a learner,
I want to browse exercises grouped by CPU stage,
so that I can practice skills at my current level.

## Acceptance Criteria

1. **Given** I access exercises (toolbar or menu), **When** the browser opens, **Then** I see exercises grouped by stage (Micro4, Micro8, Micro16)
2. **Given** I view a stage group, **When** I see exercises, **Then** each shows title, difficulty badge, and completion indicator
3. **Given** exercises exist for multiple stages, **When** I view the browser, **Then** each stage section shows its exercise count (e.g., "5 exercises")
4. **Given** I have completed some exercises, **When** I view the browser, **Then** completed exercises show a checkmark
5. **Given** I am viewing exercises, **When** I press Escape or click backdrop, **Then** the browser closes
6. **Given** I select an exercise, **When** I click its card, **Then** the onExerciseSelect callback fires with exercise metadata

## Tasks / Subtasks

- [ ] Task 1: Create exercise types and metadata (AC: 1-3)
- [ ] Task 2: Create ExerciseProgressStorage (AC: 4)
- [ ] Task 3: Build ExerciseBrowser component (AC: 1-6)
- [ ] Task 4: Wire into App.ts and toolbar/menu (AC: 1, 5)
- [ ] Task 5: Write tests (AC: 1-6)

## Dev Notes

### Architecture

```
exerciseMetadata.ts (data) + types.ts → ExerciseBrowser.ts (modal) + ExerciseProgressStorage.ts (persistence) → App.ts
```

Follows LiteratureBrowser modal pattern: mount/open/close/destroy lifecycle, double-invocation guard, focus trap, double rAF animation, Escape/backdrop dismiss.

Exercises grouped by stage with section headers. Stage filtering via chips. Difficulty badges (beginner/intermediate/advanced/capstone). Completion tracking via storage.

### Exercise Set

**Micro4 (5 exercises):**
- Hello Nibble (beginner) - Load value into accumulator
- Simple Addition (beginner) - Add two memory values
- Countdown Loop (intermediate) - Count down using loop
- Max of Two (intermediate) - Find larger of two values
- Bit Shift Multiply (advanced) - Multiply by 2 using shift

**Micro8 (5 exercises):**
- Register Swap (beginner) - Swap two register values
- Array Sum (beginner) - Sum array with loop
- String Length (intermediate) - Count chars in string
- Bubble Sort (intermediate) - Sort array in place
- Fibonacci Sequence (advanced) - Generate N Fibonacci numbers

**Micro16 (5 exercises):**
- Segment Basics (beginner) - Load/store across segments
- Hardware Multiply (beginner) - Use MUL instruction
- Memory Block Copy (intermediate) - Copy between segments
- String Reverse (intermediate) - Reverse string in place
- Linked List Traversal (advanced) - Walk linked list nodes

Capstone exercises (21-8 through 21-14) will be added in later stories.
