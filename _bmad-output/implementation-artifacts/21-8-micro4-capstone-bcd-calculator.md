# Story 21.8: Micro4 Capstone - BCD Calculator

## Status: done

## Story
As a user,
I want to build a working BCD calculator as my Micro4 graduation project,
So that I experience the authentic constraint that launched the microprocessor.

## Acceptance Criteria
1. **Given** I have completed Micro4 exercises **When** I start the BCD Calculator capstone **Then** I receive the challenge specification
2. **And** I must implement BCD addition of two single-digit values (5+7)
3. **And** I must handle BCD correction (subtract 10 when sum > 9)
4. **And** I must store the result and carry flag at known memory addresses
5. **And** the calculator must pass validation tests

## Tasks
- [x] Add capstone exercise metadata to exerciseMetadata.ts (id, starterCode, testCases, hints, solution)
- [x] Set difficulty to 'capstone' (not 'advanced') per type system
- [x] Verify TypeScript compiles
- [x] Verify all tests pass (existing metadata tests cover new exercise)
- [x] Code review fixes (6 issues: difficulty, concepts, hints, 4-bit limitation warning, historical dates, solution explanation)

## Dev Notes
- Micro4 ISA: LDA, STA, ADD, SUB, JMP, JZ, LDI, AND, OR, XOR, NOT, SHL, SHR, INC, DEC, HLT
- Only 4-bit data (0-15), accumulator-only architecture, only JZ for conditional branching
- BCD correction for fixed test data (5+7=12): subtract 10 and set carry
- 4-bit limitation: sums > 15 overflow silently; documented in description and starter code
- Real 4004 had DAA (Decimal Adjust Accumulator) instruction for general BCD; noted in explanation
- Test cases: DIGIT_A=5, DIGIT_B=7 → RESULT=2 (at 0xF2), CARRY=1 (at 0xF3)
- difficulty: 'capstone', prerequisites: all existing micro4 exercises
