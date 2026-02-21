# Story 21.11: Micro8 Capstone - Text Adventure

## Status: done

## Story
As a user,
I want to build a simple text adventure game engine,
So that I experience table-driven navigation with limited memory.

## Acceptance Criteria
1. **Given** I have completed Micro8 exercises **When** I start the Text Adventure capstone **Then** I navigate rooms using a connection table
2. **And** I compute room offsets via index arithmetic (room * 4 + direction)
3. **And** the engine looks up the next room from the table

## Tasks
- [x] Add text adventure engine capstone exercise metadata
- [x] Set difficulty to 'capstone'
- [x] Add carry limitation caveat to ADD L, R0 solution comment
- [x] Verify tests pass

## Dev Notes
- 4 rooms with N/S/E/W connections in a lookup table
- Test case: room 0, direction East → room 2
- Computed indexing: multiply by 4 using two ADD self operations
