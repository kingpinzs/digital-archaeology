# Story 21.4: Implement Output Validation

## Status: in-progress

## Story
As a user,
I want my solution validated,
So that I know if I succeeded.

## Acceptance Criteria
1. **Given** I complete an exercise **When** I submit/test my solution **Then** the output is compared to expected
2. **And** I see pass/fail result
3. **And** I see which test cases pass/fail
4. **And** I can see expected vs actual for failures

## Tasks
- [ ] Add ExerciseTestCase type to types.ts
- [ ] Add testCases field to ExerciseMetadata
- [ ] Add testCases to all 15 exercises in exerciseMetadata.ts
- [ ] Create ExerciseValidator class to run and check tests
- [ ] Create ExerciseResultsPanel UI to display pass/fail results
- [ ] Wire validation into exercise flow in App.ts
- [ ] Tests for validator and results panel
- [ ] Code review fixes

## Dev Notes
- Assembler doesn't export symbol table, so test cases use hardcoded addresses
- ExerciseTestCase: { label: string, address: number, expected: number }
- Validator reads CPUState.memory[address] after HLT
- Results panel shows green/red per test case with expected vs actual
- Multiple test cases per exercise possible
