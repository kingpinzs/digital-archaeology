# Digital Archaeology - CPU Development Project

## Quick Start

```bash
# Install recommended plugin for autonomous agents
claude plugin add ralph-wiggum

# Build current components
cd src/micro4 && make        # 4-bit CPU (complete)
cd src/micro8 && make        # 8-bit CPU (functional)
cd src/micro16 && make       # 16-bit CPU (functional)
cd src/simulator && make     # HDL simulator

# Run tests
cd src/micro8 && make test
cd src/micro16 && make test

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
| 2 | Micro8 | 8-bit | 64 KB | 8 registers, stack, 80 ops | ✅ Functional |
| 3 | Micro16 | 16-bit | 1 MB | Segmentation, multiply | ✅ Functional |
| 4 | Micro32 | 32-bit | 4 GB | Protected mode, paging | ❌ Not Started |
| 5 | Micro32-P | 32-bit | 4 GB | 5-stage pipeline, FPU | ❌ Not Started |
| 6 | Micro32-S | 32-bit | 4 GB | Superscalar, branch pred | ❌ Not Started |

**Full documentation:** `docs/PROJECT_STATUS.md`

---

## Current Status

### Completed Stages
- ✅ **Micro4** (4-bit): Complete toolchain - emulator, assembler, disassembler, debugger, 12 test programs
- ✅ **Micro8** (8-bit): Complete toolchain - cpu.c (924 lines), assembler.c (1,687 lines), disasm.c (1,258 lines), debugger.c (582 lines), 15 test programs
- ✅ **Micro16** (16-bit): Functional - cpu.c (1,611 lines), assembler.c (1,443 lines), 13 test programs

### Remaining Work - Parallelizable

See `.claude/parallel-plan.json` for full task list with dependencies.
See `.claude/prompts/*.md` for individual task prompts.

#### Sprint 1: Visualizer Core [P]
```
[P] visualizer/modules/core-engine.js      → Extract simulation logic, state management
[P] visualizer/modules/gate-view.js        → Gate-level animation module (depends: core-engine)
[P] visualizer/modules/cpu-state-view.js   → Register/memory/flags display (depends: core-engine)
[P] visualizer/modules/debugger-view.js    → Step/run/breakpoint controls (depends: core-engine)
```

#### Sprint 2: Micro4 Educational [P]
```
[P] templates/micro4/hdl/starter.m4hdl     → Minimal working ALU, rest as TODO
[P] templates/micro4/hints/*.md            → Progressive hint files (3-5)
[P] templates/micro4/expected/*.txt        → Expected test outputs
[P] homework/micro4/*.md                   → 5 optimization exercises
```

#### Sprint 3: Micro8 Educational [P]
```
[P] templates/micro8/hdl/starter.m8hdl     → Basic MOV only starter
[P] templates/micro8/hints/*.md            → Progressive hints
[P] homework/micro8/*.md                   → 8 optimization exercises
```

#### Sprint 4: Micro16 Completion [P]
```
[P] src/micro16/disasm.c                   → Standalone disassembler
[P] src/micro16/debugger.c                 → Interactive debugger
[P] templates/micro16/                     → Educational templates
[P] homework/micro16/*.md                  → 10 optimization exercises
```

#### Sprint 5: Micro32 New Stage [P]
```
[P] docs/micro32_isa.md                    → ISA specification (first!)
[P] src/micro32/cpu.c                      → CPU emulator (depends: ISA)
[P] src/micro32/cpu.h                      → CPU header (depends: ISA)
[P] src/micro32/assembler.c                → Assembler (depends: ISA)
[P] hdl/07_micro32_cpu.m4hdl               → HDL reference (depends: ISA)
[P] templates/micro32/                     → Educational templates
[P] homework/micro32/*.md                  → 12 optimization exercises
```

#### Sprint 6: Advanced Stages [P]
```
[P] src/micro32p/                          → Pipelined CPU implementation
[P] hdl/08_micro32p_cpu.m32hdl             → Pipelined HDL
[P] templates/micro32p/                    → Pipeline educational templates
[P] homework/micro32p/*.md                 → 10 pipeline exercises
[P] src/micro32s/                          → Superscalar CPU implementation
[P] hdl/09_micro32s_cpu.m32hdl             → Superscalar HDL
[P] templates/micro32s/                    → Superscalar educational templates
[P] homework/micro32s/*.md                 → 8 superscalar exercises
```

#### Sprint 7: Literature [P]
```
[P] literature/01-06_*.md                  → Basic concepts (binary, gates, ALU)
[P] literature/07-12_*.md                  → Intermediate (encoding, control, memory)
[P] literature/13-20_*.md                  → Advanced (pipeline, cache, superscalar)
```

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
| `src/micro8/` | 8-bit CPU emulator (C) | ✅ Functional |
| `src/micro16/` | 16-bit CPU emulator (C) | ✅ Functional |
| `src/micro32/` | 32-bit CPU emulator (C) | ❌ Not Started |
| `src/simulator/` | M4HDL circuit simulator (C) | ✅ Complete |
| `hdl/` | Hardware description files (.m4hdl) | ✅ Complete (7 files) |
| `hdl/history/` | Historical logic implementations | ✅ Complete |
| `programs/` | Assembly test programs (Micro4) | ✅ 12 programs |
| `programs/micro8/` | Assembly test programs (Micro8) | ✅ 15 programs |
| `programs/micro16/` | Assembly test programs (Micro16) | ✅ 13 programs |
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

