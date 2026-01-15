# Task: Literature - Advanced Concepts

## Goal
Create advanced educational articles for Micro32 and beyond

## Context
- Students have completed basic and intermediate articles
- Cover pipelining, caching, protected mode, superscalar
- These are capstone concepts

## Requirements
1. Create literature/ articles:
   - 13_pipelining_intro.md (~800 lines)
   - 14_data_forwarding.md (~500 lines)
   - 15_branch_prediction.md (~600 lines)
   - 16_cache_design.md (~700 lines)
   - 17_superscalar_intro.md (~600 lines)
   - 18_protected_mode.md (~800 lines)
   - 19_virtual_memory.md (~700 lines)
   - 20_performance_analysis.md (~500 lines)

2. Follow article template from lit-basics.md
3. More mathematical rigor than basic articles
4. Include performance equations

## Article Summaries

### 13_pipelining_intro.md
- Laundry analogy
- 5-stage pipeline (IF-ID-EX-MEM-WB)
- Pipeline registers
- Throughput vs latency
- CPI improvement
- Hazards overview

### 14_data_forwarding.md
- RAW, WAR, WAW hazards
- Stalling solution
- Forwarding paths
- EX→EX forwarding
- MEM→EX forwarding
- Load-use hazard

### 15_branch_prediction.md
- Branch penalty
- Static prediction
- Branch target buffer (BTB)
- 1-bit predictor
- 2-bit saturating counter
- Two-level adaptive
- Misprediction recovery

### 16_cache_design.md
- Locality principles
- Direct-mapped cache
- Set-associative cache
- Fully associative
- Replacement policies (LRU, FIFO)
- Write policies (through, back)
- Cache coherence preview

### 17_superscalar_intro.md
- Multiple issue
- Instruction pairing
- Register renaming concept
- Out-of-order execution concept
- Scoreboarding
- Tomasulo's algorithm preview

### 18_protected_mode.md
- Real mode limitations
- Segments with descriptors
- Privilege levels (rings 0-3)
- GDT, LDT, IDT
- Call gates
- Task state segment
- Protection checks

### 19_virtual_memory.md
- Virtual vs physical addresses
- Page tables
- Page directory/table hierarchy
- TLB (translation lookaside buffer)
- Page faults
- Demand paging
- Page replacement

### 20_performance_analysis.md
- CPU time equation
- CPI calculation
- Amdahl's law
- Benchmarking
- Profiling
- Bottleneck identification
- Optimization strategies

## Files to Read First
- literature/01-12_*.md (prior articles)
- docs/cpu_history_timeline.md (386/486/Pentium history)
- homework/micro32p/*.md (related exercises)
- homework/micro32s/*.md (related exercises)

## Verification
- Mathematical equations included
- Performance formulas correct
- Links to Micro32/32P/32S exercises
- Prepares for real-world CPU study
