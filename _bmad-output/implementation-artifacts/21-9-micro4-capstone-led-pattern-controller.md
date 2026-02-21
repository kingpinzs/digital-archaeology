# Story 21.9: Micro4 Capstone - LED Pattern Controller

## Status: done

## Story
As a user,
I want to build an LED pattern controller,
So that I experience hardware control with extreme memory constraints.

## Acceptance Criteria
1. **Given** I have completed Micro4 exercises **When** I start the LED Controller capstone **Then** I must control a simulated 7-segment display
2. **And** I must implement pattern sequences (copy lookup table to output buffer)
3. **And** I must fit within 256 nibbles
4. **And** the controller must display recognizable patterns

## Tasks
- [x] Add LED pattern capstone exercise metadata (id, starterCode, testCases, hints, solution)
- [x] Set difficulty to 'capstone'
- [x] Verify tests pass

## Dev Notes
- 4 display patterns (digits 0-3) stored in lookup table, copied to output buffer
- Tests verify OUT0-OUT3 match PAT0-PAT3 values
- Simple LDA/STA pairs demonstrate memory-mapped I/O concept
