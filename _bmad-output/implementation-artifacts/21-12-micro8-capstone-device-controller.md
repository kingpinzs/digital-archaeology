# Story 21.12: Micro8 Capstone - Device Controller

## Status: done

## Story
As a user,
I want to build a simulated device controller,
So that I understand how computers interface with hardware.

## Acceptance Criteria
1. **Given** I have completed Micro8 exercises **When** I start the Device Controller capstone **Then** I read keypad input and drive display output
2. **And** I look up 7-segment display patterns from a table
3. **And** the controller correctly maps key codes to display patterns

## Tasks
- [x] Add device controller capstone exercise metadata
- [x] Set difficulty to 'capstone'
- [x] Add carry limitation caveat to ADD L, R0 solution comment
- [x] Verify tests pass

## Dev Notes
- Keypad input (0-9) maps to 7-segment display patterns via lookup table
- Test case: key 5 → pattern 0x6D
- Poll-lookup-output cycle is the fundamental embedded controller pattern
