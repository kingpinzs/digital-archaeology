# Story 21.13: Micro16 Capstone - Terminal/REPL

## Status: done

## Story
As a user,
I want to build an interactive terminal command parser,
So that I understand why we needed 16-bit address space.

## Acceptance Criteria
1. **Given** I have completed Micro16 exercises **When** I start the Terminal capstone **Then** I parse command strings to determine command IDs
2. **And** I dispatch commands via first-character matching (H=HELP, E=ECHO, M=MEM)
3. **And** I handle unknown commands gracefully

## Tasks
- [x] Add terminal command parser capstone exercise metadata
- [x] Set difficulty to 'capstone'
- [x] Verify tests pass

## Dev Notes
- Command buffer contains "MEM" (0x4D, 0x45, 0x4D, 0x00)
- Test case: first char 'M' (0x4D) → CMD_ID = 3
- Little-endian word read requires AND mask to isolate first byte
- If-else-if chain pattern mirrors CP/M and early DOS command dispatch
