# Story 21.10: Micro8 Capstone - Number Guessing Game

## Status: done

## Story
As a user,
I want to build a number guessing game for Micro8,
So that I feel the "luxury" of having 8 registers and subroutines.

## Acceptance Criteria
1. **Given** I have completed Micro8 exercises **When** I start the Guessing Game capstone **Then** the logic compares a guess to a secret number
2. **And** the game responds with result code (0=correct, 1=too low, 2=too high)
3. **And** I must use subroutines (contrast with Micro4)

## Tasks
- [x] Add guessing game capstone exercise metadata
- [x] Set difficulty to 'capstone'
- [x] Verify tests pass

## Dev Notes
- Test case: SECRET=42, GUESS=57 → RESULT=2 (too high)
- Uses CMP, JZ, JC for flag-based comparison dispatching
- CALL/RET subroutine pattern demonstrates Micro8 modularity
