# Task: Micro4 Progressive Hints

## Goal
Create progressive hint files for Micro4 HDL completion

## Context
- Students start with starter.m4hdl template
- When stuck, they can reveal hints
- Hints progress from conceptual to specific

## Requirements
1. Create templates/micro4/hints/ directory with:
   - hint1_alu_concept.md
   - hint2_alu_structure.md
   - hint3_alu_implementation.md
   - hint4_control_concept.md
   - hint5_control_implementation.md

2. Each hint file structure:
   - What you're trying to achieve
   - Key insight or technique
   - Partial code or pseudocode (if later hint)
   - "Still stuck?" pointer to next hint

3. Hints should not give full answer until hint 3/5

## Files to Read First
- hdl/04_micro4_cpu.m4hdl (what the solution looks like)
- templates/micro4/hdl/starter.m4hdl (what students start with)
- docs/optimization_homework.md (hint style reference)

## Hint Content Guidelines

### hint1_alu_concept.md
- Explain what an ALU does
- Mention: inputs (A, B), output, operation selector
- Don't show any code

### hint2_alu_structure.md
- Explain multiplexer-based ALU design
- Show block diagram (ASCII art)
- Mention opcode bits select operation

### hint3_alu_implementation.md
- Show ALU skeleton code
- Leave operation implementations as exercise
- Explain how to add one operation

### hint4_control_concept.md
- Explain instruction decoding
- Fetch-decode-execute cycle
- Control signals concept

### hint5_control_implementation.md
- Show control unit structure
- Explain opcode to control signal mapping
- Near-complete but with gaps

## Verification
- Student can complete ALU using only hints 1-3
- Student can complete control using hints 4-5
- No hint gives away complete solution
- Each hint builds on previous
