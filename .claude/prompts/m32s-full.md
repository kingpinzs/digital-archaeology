# Task: Micro32-S Superscalar CPU (Full Implementation)

## Goal
Create complete superscalar (dual-issue) version of Micro32 CPU

## Context
- Micro32-P (pipelined) must be complete first
- This adds dual-issue and advanced branch prediction
- Peak 2 IPC (instructions per cycle)

## Requirements

### 1. Documentation
Create docs/micro32s_architecture.md covering:
- Dual-issue pipeline (U-pipe, V-pipe)
- Instruction pairing rules
- Branch target buffer (BTB)
- Advanced branch prediction
- Separate I/D caches
- Performance counters

### 2. HDL Implementation
Create hdl/09_micro32s_cpu.m32hdl with:
- Dual instruction fetch
- Pairing logic (which instructions can dual-issue)
- Dual ALU (U-pipe and V-pipe)
- Shared register file (4 read, 2 write ports)
- Branch target buffer (256 entries)
- 2-bit saturating counters
- Separate I-cache (8KB) and D-cache (8KB)
- Performance counters

### 3. CPU Emulator
Create src/micro32s/cpu.c with:
- Cycle-accurate dual-issue simulation
- Pairing statistics
- BTB hit/miss tracking
- Performance counter access

### 4. Templates and Homework
Create templates/micro32s/ with:
- hdl/starter.m32hdl (single-issue pipeline as base)
- hints/ (progressive hints)
- expected/ (test outputs)

Create homework/micro32s/ with 8 exercises:
- 01_dual_fetch.md (⭐⭐ Medium)
- 02_pairing_rules.md (⭐⭐ Medium)
- 03_dual_alu.md (⭐⭐⭐ Hard)
- 04_register_ports.md (⭐⭐⭐ Hard)
- 05_btb.md (⭐⭐⭐⭐ Expert)
- 06_branch_predictor.md (⭐⭐⭐⭐ Expert)
- 07_speculative_exec.md (⭐⭐⭐⭐⭐ Master)
- 08_performance_counters.md (⭐⭐⭐⭐⭐ Master)

## Files to Read First
- hdl/08_micro32p_cpu.m32hdl (pipelined base)
- src/micro32p/cpu.c (behavioral reference)
- docs/cpu_history_timeline.md (Pentium architecture)
- literature/17_superscalar_intro.md (concepts)

## Pairing Rules (Pentium-style)
Instructions can pair if:
1. Neither is a prefix
2. First can go in U-pipe, second in V-pipe
3. No data dependency between them
4. No resource conflict

U-pipe: All instructions
V-pipe: Simple ALU, MOV, JMP/Jcc, PUSH/POP

## Branch Target Buffer
- 256 entries
- Tag: bits [15:8] of address
- Target: predicted branch destination
- History: 2-bit saturating counter

## Performance Counters
- CYCLES: Total cycles
- INSTRUCTIONS: Instructions retired
- PAIRS: Instructions paired
- ICACHE_MISS: I-cache misses
- DCACHE_MISS: D-cache misses
- BRANCHES: Branch instructions
- MISPREDICTS: Branch mispredictions

## Verification
- All Micro32-P programs run correctly
- Pairing improves IPC toward 2.0
- BTB reduces branch penalties
- Performance counters accurate
