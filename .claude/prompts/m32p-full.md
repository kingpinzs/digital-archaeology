# Task: Micro32-P Pipelined CPU (Full Implementation)

## Goal
Create complete pipelined version of Micro32 CPU

## Context
- Micro32 (non-pipelined) must be complete first
- This adds 5-stage pipeline and cache
- Major performance improvement

## Requirements

### 1. Documentation
Create docs/micro32p_architecture.md covering:
- 5-stage pipeline: IF-ID-EX-MEM-WB
- Hazard types: data, control, structural
- Forwarding paths
- Stall conditions
- Cache architecture

### 2. HDL Implementation
Create hdl/08_micro32p_cpu.m32hdl with:
- Pipeline registers between stages
- Hazard detection unit
- Forwarding unit
- Branch prediction (static or 2-bit)
- L1 instruction cache (4KB)
- L1 data cache (4KB)

### 3. CPU Emulator
Create src/micro32p/cpu.c with:
- Cycle-accurate pipeline simulation
- Hazard statistics
- Cache hit/miss tracking
- CPI calculation

### 4. Templates and Homework
Create templates/micro32p/ with:
- hdl/starter.m32hdl (basic pipeline, no forwarding)
- hints/ (progressive hints)
- expected/ (test outputs)

Create homework/micro32p/ with 10 exercises:
- 01_pipeline_stages.md (⭐ Easy)
- 02_data_hazard_stall.md (⭐⭐ Medium)
- 03_forwarding_ex_ex.md (⭐⭐ Medium)
- 04_forwarding_mem_ex.md (⭐⭐⭐ Hard)
- 05_control_hazard.md (⭐⭐⭐ Hard)
- 06_branch_prediction.md (⭐⭐⭐⭐ Expert)
- 07_cache_direct.md (⭐⭐⭐ Hard)
- 08_cache_associative.md (⭐⭐⭐⭐ Expert)
- 09_fpu_pipeline.md (⭐⭐⭐⭐⭐ Master)
- 10_full_integration.md (⭐⭐⭐⭐⭐ Master)

## Files to Read First
- hdl/07_micro32_cpu.m32hdl (non-pipelined base)
- src/micro32/cpu.c (behavioral reference)
- docs/cpu_history_timeline.md (486 architecture)
- literature/13_pipelining_intro.md (concepts)

## Pipeline Stages

### IF (Instruction Fetch)
- PC → I-Cache → Instruction
- Branch prediction

### ID (Instruction Decode)
- Register file read
- Hazard detection
- Immediate generation

### EX (Execute)
- ALU operation
- Address calculation
- Branch resolution

### MEM (Memory)
- D-Cache access
- Data read/write

### WB (Write Back)
- Register file write

## Verification
- All Micro32 programs run correctly (with pipeline)
- Hazards detected and handled
- Cache improves performance
- CPI measured for benchmark programs
