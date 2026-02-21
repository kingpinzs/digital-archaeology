# Story 21.14: Micro16 Capstone - Simple Graphics

## Status: done

## Story
As a user,
I want to build a simple graphics program,
So that I understand why more address space enabled visual computing.

## Acceptance Criteria
1. **Given** I have completed Micro16 exercises **When** I start the Graphics capstone **Then** I draw a horizontal line on a simulated framebuffer
2. **And** I compute pixel addresses from X, Y coordinates (Y*32 + X*2 + FB_BASE)
3. **And** I fill consecutive word addresses with pixel values

## Tasks
- [x] Add simple graphics capstone exercise metadata
- [x] Set difficulty to 'capstone'
- [x] Fix starterCode comment formula (was Y*16+X, correct: Y*32+X*2)
- [x] Fix hint 1 formula
- [x] Fix test case addresses (0x22C, 0x22E, 0x230, 0x232)
- [x] Verify tests pass

## Dev Notes
- 16-pixel-wide framebuffer, each pixel is a 16-bit word (2 bytes)
- Row stride = 16 * 2 = 32 bytes; column offset also * 2
- Test: line from (2,1) length 4, pixel value 0xFF → addresses 0x22C-0x232
- Solution uses 5x ADD AX,AX for *32 multiplication
