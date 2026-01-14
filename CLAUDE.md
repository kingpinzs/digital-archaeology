# Digital Archaeology - CPU Development Project

## Quick Start

```bash
# Install recommended plugin for autonomous agents
claude plugin add ralph-wiggum

# Build current components
cd src/micro4 && make        # 4-bit CPU (complete)
cd src/micro8 && make        # 8-bit CPU (in progress)
cd src/simulator && make     # HDL simulator

# Run tests
cd src/micro4 && make test

# Parallel development commands
/cpt:init      # Initialize parallel development
/cpt:analyze   # Analyze parallelization opportunities
/cpt:quick     # Quickly spawn parallel agents for a goal
/cpt:list      # List active worktrees
/cpt:done      # Complete work, merge, cleanup
```

---

## Project Vision

Build CPUs incrementally from 4-bit to 32-bit superscalar, learning **why** each feature was invented through hands-on implementation.

### 6-Stage CPU Evolution

| Stage | Name | Data | Address | Key Features | Status |
|-------|------|------|---------|--------------|--------|
| 1 | Micro4 | 4-bit | 256 B | Accumulator, 16 ops | ✅ Complete |
| 2 | Micro8 | 8-bit | 64 KB | 8 registers, stack, 80 ops | ⚠️ In Progress |
| 3 | Micro16 | 16-bit | 1 MB | Segmentation, multiply | ❌ Not Started |
| 4 | Micro32 | 32-bit | 4 GB | Protected mode, paging | ❌ Not Started |
| 5 | Micro32-P | 32-bit | 4 GB | 5-stage pipeline, FPU | ❌ Not Started |
| 6 | Micro32-S | 32-bit | 4 GB | Superscalar, branch pred | ❌ Not Started |

**Full documentation:** `docs/PROJECT_STATUS.md`

---

## Current Focus: Micro8 Completion

### Already Done
- ✅ ISA specification (docs/micro8_isa.md - 1024 lines, 80 instructions)
- ✅ CPU emulator skeleton (~20/80 opcodes)
- ✅ Main CLI wrapper

### Missing - Parallelizable (no file overlap)
```
[P] src/micro8/assembler.c   → Two-pass assembler for Micro8 ISA
[P] src/micro8/disasm.c      → Standalone disassembler
[P] src/micro8/debugger.c    → Interactive debugger with breakpoints
[P] programs/micro8/*.asm    → Test programs (10-15 files)
[P] hdl/05_micro8_cpu.m4hdl  → HDL implementation
```

### Missing - Sequential (same file: cpu.c)
- Logic: AND, OR, XOR, NOT, SHL, SHR, SAR, ROL, ROR, SWAP
- Arithmetic: ADC, SBC, CMP, CMPI, NEG, INC, DEC
- 16-bit: INC16, DEC16, ADD16, LDI16
- Control: JR, JRZ, JRNZ, JRC, JRNC, JP HL, RETI
- System: EI, DI, IN, OUT, SCF, CCF, CMF
- Stack: PUSH16, POP16, PUSHF, POPF

---

## Parallel Development Protocol

When working on features that can be parallelized, I follow this protocol:

### Detection Triggers

Automatically consider parallel execution when:
- Feature has 3+ independent components
- User mentions: "parallelize", "spawn", "fork", "parallel", "concurrent"
- Task list contains items marked with `[P]` or `(P)`
- Multiple unrelated files need changes simultaneously

### Parallel Execution Steps

1. **Decompose** the feature into independent tasks
2. **Present** task breakdown to user for approval
3. **Create worktrees** for each parallel task:
   ```bash
   git worktree add ../$PROJECT-$TASK -b feature/$TASK main
   ```
4. **Spawn headless Claude** in each worktree:
   ```bash
   (cd ../$PROJECT-$TASK && claude -p "$PROMPT" --dangerously-skip-permissions > logs/$TASK.log 2>&1) &
   ```
5. **Report** spawned tasks with monitoring commands
6. **On completion**, offer to merge results

### Task Independence Rules

Tasks are independent if they:
- Touch different files/directories
- Have no shared state dependencies
- Can be tested in isolation
- Don't modify shared configuration

Tasks are sequential if they:
- Modify the same files
- Have explicit `[depends: X]` markers
- Share database migrations
- Require output from another task

### Monitoring Commands

After spawning, I provide:
```bash
# Watch all logs
tail -f logs/*.log

# Check running processes
ps aux | grep "claude -p"

# Check completion
for f in logs/*.log; do
  grep -q "completed\|error\|failed" "$f" && echo "$f: DONE" || echo "$f: RUNNING"
done
```

### Merge Protocol

1. Wait for all tasks to complete
2. Run tests in each worktree
3. Merge to main in dependency order:
   ```bash
   cd ../main
   git pull origin main
   for branch in feature/*; do
     git merge $branch --no-edit
   done
   ```
4. Run final integration tests
5. Clean up worktrees:
   ```bash
   git worktree list | grep -v main | awk '{print $1}' | xargs -I {} git worktree remove {}
   git worktree prune
   ```

### Safety Rules

- Never spawn more than 10 parallel agents
- Always create worktrees (never parallel in same directory)
- Capture all output to log files
- Ask before merging if conflicts detected
- Clean up worktrees after successful merge

---

## Project-Specific Notes

### Project Overview
Digital archaeology CPU development project. Building CPUs incrementally from a 4-bit Micro4 up through 32-bit superscalar designs.

**Current Focus:** Micro8 (8-bit CPU with ~80 instructions)

### Build Commands

```bash
# Build micro4 emulator
cd src/micro4 && make

# Build HDL simulator
cd src/simulator && make

# Run micro4 tests
cd src/micro4 && make test

# Run simulator tests
cd src/simulator && make test

# Install binaries to bin/
cd src/micro4 && make install
cd src/simulator && make install
```

### Directory Structure

| Directory | Purpose | Status |
|-----------|---------|--------|
| `src/micro4/` | 4-bit CPU emulator (C) | ✅ Complete |
| `src/micro8/` | 8-bit CPU emulator (C) | ⚠️ In Progress |
| `src/micro16/` | 16-bit CPU emulator (C) | ❌ Not Started |
| `src/micro32/` | 32-bit CPU emulator (C) | ❌ Not Started |
| `src/simulator/` | M4HDL circuit simulator (C) | ✅ Complete |
| `hdl/` | Hardware description files (.m4hdl) | ⚠️ Partial |
| `hdl/history/` | Historical logic implementations | ✅ Complete |
| `programs/` | Assembly test programs (Micro4) | ✅ 12 programs |
| `programs/micro8/` | Assembly test programs (Micro8) | ❌ Not Started |
| `docs/` | Architecture docs & tutorials | ✅ Comprehensive |
| `visualizer/` | Circuit visualization (HTML/JSON) | ✅ Complete |
| `bin/` | Compiled binaries | ✅ Complete |

### Parallel Development Patterns

**Independent components that can be parallelized:**

1. **CPU Stages** (completely independent)
   - Micro4 → Micro8 → Micro16 → Micro32 → Micro32-P → Micro32-S
   - Each stage can be developed in isolation

2. **Tool Development** (per CPU stage, independent)
   - Assembler
   - Disassembler
   - Emulator/Simulator
   - Test suite
   - Monitor/debugger

3. **Dual-track Development** (sync points required)
   - Software emulator (src/) ↔ HDL implementation (hdl/)
   - Run parallel, merge at instruction milestones

4. **Historical Implementations** (fully independent)
   - Relay logic
   - RTL gates
   - TTL gates
   - MOS gates

### Example Parallel Tasks

```
[P] Implement Micro8 assembler         -> src/micro8/assembler.c
[P] Implement Micro8 emulator          -> src/micro8/cpu.c
[P] Write Micro8 test programs         -> programs/micro8/
[P] Document Micro8 ISA                -> docs/micro8_isa.md
```

### Testing Requirements

Before merging any CPU feature:
1. `make test` passes in the component directory
2. All existing test programs still work
3. New features have at least one test program

### File Ownership (for conflict avoidance)

When parallelizing, ensure each agent owns distinct files:
- Agent working on emulator: `src/*/cpu.c`, `src/*/cpu.h`
- Agent working on assembler: `src/*/assembler.c`, `src/*/assembler.h`
- Agent working on tests: `programs/*.asm`
- Agent working on HDL: `hdl/*.m4hdl`
- Agent working on docs: `docs/*.md`

# Parallel Development Protocol

# Project Configuration

## Parallel Development Protocol

When working on features that can be parallelized, I follow this protocol:

### Detection Triggers

Automatically consider parallel execution when:
- Feature has 3+ independent components
- User mentions: "parallelize", "spawn", "fork", "parallel", "concurrent"
- Task list contains items marked with `[P]` or `(P)`
- Multiple unrelated files need changes simultaneously

### Parallel Execution Steps

1. **Decompose** the feature into independent tasks
2. **Present** task breakdown to user for approval
3. **Create worktrees** for each parallel task:
   ```bash
   git worktree add ../$PROJECT-$TASK -b feature/$TASK main
   ```
4. **Spawn headless Claude** in each worktree:
   ```bash
   (cd ../$PROJECT-$TASK && claude -p "$PROMPT" --dangerously-skip-permissions > ../logs/$TASK.log 2>&1) &
   ```
5. **Report** spawned tasks with monitoring commands
6. **On completion**, offer to merge results

### Task Independence Rules

Tasks are independent if they:
- Touch different files/directories
- Have no shared state dependencies
- Can be tested in isolation
- Don't modify shared configuration

Tasks are sequential if they:
- Modify the same files
- Have explicit `[depends: X]` markers
- Share database migrations
- Require output from another task

### Monitoring Commands

After spawning, I provide:
```bash
# Watch all logs
tail -f ../logs/*.log

# Check running processes
ps aux | grep "claude -p"

# Check completion
for f in ../logs/*.log; do
  grep -q "completed\|error\|failed" "$f" && echo "$f: DONE" || echo "$f: RUNNING"
done
```

### Merge Protocol

1. Wait for all tasks to complete
2. Run tests in each worktree
3. Merge to main in dependency order:
   ```bash
   cd ../main
   git pull origin main
   for branch in feature/*; do
     git merge $branch --no-edit
   done
   ```
4. Run final integration tests
5. Clean up worktrees:
   ```bash
   git worktree list | grep -v main | awk '{print $1}' | xargs -I {} git worktree remove {}
   git worktree prune
   ```

### Safety Rules

- Never spawn more than 10 parallel agents
- Always create worktrees (never parallel in same directory)
- Capture all output to log files
- Ask before merging if conflicts detected
- Clean up worktrees after successful merge

## Project-Specific Notes

<!-- Add your project-specific instructions here -->
