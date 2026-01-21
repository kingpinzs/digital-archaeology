# Development Guide

> Generated: 2026-01-20 | Scan Level: Exhaustive | Mode: Initial Scan

## Quick Start

```bash
# Prerequisites
# - GCC (any recent version)
# - GNU Make

# Build all components
cd src/micro4 && make        # 4-bit CPU (complete)
cd src/micro8 && make        # 8-bit CPU (functional)
cd src/micro16 && make       # 16-bit CPU (functional)
cd src/simulator && make     # HDL simulator

# Run tests
cd src/micro8 && make test
cd src/micro16 && make test

# Install binaries to bin/
cd src/micro8 && make install
```

---

## Build System

### Compiler Configuration

| Setting | Value | Purpose |
|---------|-------|---------|
| Compiler | GCC | System default |
| Standard | `-std=c99` | Modern C with mixed declarations |
| Warnings | `-Wall -Wextra` | Strict warning levels |
| Debug | `-g` | Debug symbols for GDB |
| Optimization | `-O2` | Balanced optimization |
| Link | (none) | No external libraries |

### Build Targets by Component

#### Micro4 (`src/micro4/`)

```bash
make              # Build all (micro4, disasm, micro4-dbg)
make micro4       # Build emulator only
make disasm       # Build disassembler only
make micro4-dbg   # Build debugger only
make test         # Run sanity test
make install      # Install to bin/
make clean        # Remove build artifacts
```

**Outputs:**
- `micro4` - Main emulator with integrated debugger
- `disasm` - Standalone disassembler
- `micro4-dbg` - Standalone debugger

#### Micro8 (`src/micro8/`)

```bash
make              # Build all tools
make micro8       # Build emulator only
make micro8-asm   # Build assembler only
make micro8-disasm # Build disassembler only
make micro8-dbg   # Build standalone debugger only
make test         # Run basic sanity test
make test-all     # Build and run all test programs
make disasm FILE=x # Disassemble a binary file
make debug FILE=x  # Debug a binary file
make install      # Install to bin/
make clean        # Remove build artifacts
```

**Outputs:**
- `micro8` - Main emulator with integrated debugger
- `micro8-asm` - Standalone assembler
- `micro8-disasm` - Standalone disassembler
- `micro8-dbg` - Standalone debugger

#### Micro16 (`src/micro16/`)

```bash
make              # Build all (micro16, micro16-asm)
make micro16      # Build emulator only
make micro16-asm  # Build assembler only
make test         # Run tests
make install      # Install to bin/
make clean        # Remove build artifacts
```

**Outputs:**
- `micro16` - Main emulator
- `micro16-asm` - Standalone assembler
- (Disassembler and debugger not yet implemented)

#### HDL Simulator (`src/simulator/`)

```bash
make              # Build m4sim
make test         # Run simulator tests
make install      # Install to bin/
make clean        # Remove build artifacts
```

**Outputs:**
- `m4sim` - HDL circuit simulator

---

## Testing

### Test Categories

| Component | Command | Test Programs |
|-----------|---------|---------------|
| Micro4 | `make test` | 12 programs |
| Micro8 | `make test` | Basic sanity test |
| Micro8 | `make test-all` | All 15 programs |
| Micro16 | `make test` | 13 programs |
| Simulator | `make test` | HDL unit tests |

### Running Individual Programs

```bash
# Micro4
cd src/micro4
./micro4 run ../../programs/add.asm

# Micro8
cd src/micro8
./micro8-asm ../../programs/micro8/fibonacci.asm -o /tmp/fib.bin
./micro8 run /tmp/fib.bin

# Micro16
cd src/micro16
./micro16-asm ../../programs/micro16/arithmetic.asm -o /tmp/arith.bin
./micro16 run /tmp/arith.bin
```

### Debugging

```bash
# Micro4
./micro4 debug program.asm

# Micro8
./micro8 debug program.bin
# Or standalone:
./micro8-dbg program.bin

# Micro16 (no debugger yet)
```

### Test Requirements

Before merging any CPU feature:
1. `make test` passes in the component directory
2. All existing test programs still work
3. New features have at least one test program

---

## Code Style

### C Code Conventions

**Naming:**
- Functions: `snake_case` (e.g., `cpu_step`, `cpu_dump_state`)
- Types: `PascalCase` with suffix (e.g., `Micro4CPU`, `Micro8CPU`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `OP_ADD`, `FLAG_ZERO`)
- Local variables: `snake_case`

**Structure:**
```c
// Header files
#ifndef CPU_H
#define CPU_H

#include <stdint.h>
#include <stdbool.h>

// Type definitions
typedef struct {
    uint8_t pc;
    uint8_t a;
    // ...
} Micro4CPU;

// Function declarations
void cpu_init(Micro4CPU *cpu);
int cpu_step(Micro4CPU *cpu);

#endif // CPU_H
```

**Error Handling Pattern:**
```c
typedef struct {
    // ...state...
    bool    error;          // Error occurred flag
    char    error_msg[128]; // Human-readable error
} CPU;

int cpu_step(CPU *cpu) {
    if (cpu->error) return -1;
    // ...execute...
    return cycles_used;
}
```

### Assembly Code Conventions

**Micro4:**
```asm
; Comment
label:  LDA address    ; Load accumulator
        ADD value      ; Arithmetic
        JZ  target     ; Conditional jump
        HLT            ; Halt
```

**Micro8:**
```asm
        .org 0x0200             ; Set origin
FIB_MAX .equ 13                 ; Define constant

START:  LDI16 SP, 0x01FD        ; Initialize stack
        LDI R0, 1               ; Immediate load
        CALL SUM_FIBS           ; Subroutine call
        RET                     ; Return
```

**Micro16:**
```asm
        .segment CODE
        .org 0x0000

START:  MOV AX, 0x1234          ; Load immediate
        MOV DS, AX              ; Set data segment
        MOV [0x0000], BX        ; Store to memory
```

---

## Directory Ownership

When working in parallel, each agent should own distinct files to avoid conflicts:

| Agent Role | Owned Files |
|------------|-------------|
| Emulator | `src/*/cpu.c`, `src/*/cpu.h` |
| Assembler | `src/*/assembler.c`, `src/*/assembler.h` |
| Tests | `programs/*.asm` |
| HDL | `hdl/*.m4hdl` |
| Docs | `docs/*.md` |
| Visualizer | `visualizer/**/*.js` |

---

## Parallel Development

### When to Parallelize

- Feature has 3+ independent components
- Multiple unrelated files need changes
- Task list contains items marked with `[P]`

### Workflow

1. **Decompose** feature into independent tasks
2. **Create worktrees** for each task:
   ```bash
   git worktree add ../cpu_ideas-$TASK -b feature/$TASK main
   ```
3. **Spawn agents** in each worktree:
   ```bash
   (cd ../cpu_ideas-$TASK && claude -p "$PROMPT" > logs/$TASK.log 2>&1) &
   ```
4. **Monitor** progress:
   ```bash
   tail -f logs/*.log
   ```
5. **Merge** when complete:
   ```bash
   git merge feature/$TASK --no-edit
   ```
6. **Cleanup** worktrees:
   ```bash
   git worktree remove ../cpu_ideas-$TASK
   git worktree prune
   ```

### Sprint Plan

| Sprint | Focus | Tasks |
|--------|-------|-------|
| 1 | Visualizer Core | core-engine.js, gate-view.js, cpu-state-view.js, debugger-view.js |
| 2 | Micro4 Educational | starter.m4hdl, hints/*.md, expected/*.txt, homework/*.md |
| 3 | Micro8 Educational | starter.m8hdl, hints/*.md, homework/*.md |
| 4 | Micro16 Completion | disasm.c, debugger.c, templates/, homework/*.md |
| 5 | Micro32 New Stage | ISA spec, cpu.c, assembler.c, HDL, templates/ |
| 6 | Advanced Stages | Micro32-P (pipelined), Micro32-S (superscalar) |
| 7 | Literature | 20 educational articles (binary → superscalar) |

---

## Git Workflow

### Branching Strategy

```
main
 ├── feature/micro4-homework
 ├── feature/micro8-debugger
 ├── feature/visualizer-refactor
 └── feature/micro32-isa
```

### Commit Message Format

```
feat(component): short description

Longer description if needed.

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Prefixes:**
- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code restructuring
- `docs` - Documentation only
- `test` - Test additions/changes
- `chore` - Build/config changes

### Recent Commits

```
b8ad817 track prompt files
fdebed7 chore: update .gitignore to exclude compiled binaries
8711cd7 feat(micro16): extend assembler with memory operations and segment support
9968380 feat(simulator): add timing analysis and JSON export for visualizer
3a605bc feat(hdl): expand Micro4 CPU with full 16-instruction decoder and state machine
```

---

## Environment Setup

### Prerequisites

| Requirement | Purpose | Check |
|-------------|---------|-------|
| GCC | C compilation | `gcc --version` |
| GNU Make | Build automation | `make --version` |
| Modern browser | Visualizer | Chrome/Firefox/Safari |
| Python 3 (optional) | Local web server | `python3 --version` |
| GDB (optional) | C debugging | `gdb --version` |

### Recommended IDE Setup

**VS Code:**
- C/C++ Extension (ms-vscode.cpptools)
- Project has `.vscode/` configuration

**Vim:**
- Use provided Makefiles
- GDB for debugging

### Running the Visualizer

```bash
# Option 1: Python server
cd visualizer
python3 -m http.server 8000
# Open http://localhost:8000

# Option 2: Open directly
# Some browsers support file:// URLs
open visualizer/index.html
```

---

## Debugging Tips

### GDB Workflow

```bash
# Build with debug symbols (default)
cd src/micro8 && make

# Start GDB
gdb ./micro8

# Common commands
(gdb) break cpu_step
(gdb) run debug /tmp/program.bin
(gdb) print cpu->pc
(gdb) next
(gdb) step
(gdb) continue
```

### CPU Emulator Debugging

```bash
# Interactive debugger
./micro8 debug program.bin

# Debugger commands:
# s/step     - Single step
# r/run      - Run until halt
# b/break N  - Set breakpoint at address N
# d/dump     - Dump CPU state
# m/mem A N  - Dump N bytes at address A
# q/quit     - Exit
```

### HDL Simulator Debugging

```bash
# Verbose output
./m4sim -v hdl/03_alu.m4hdl

# JSON export for visualizer
./m4sim -j output.json hdl/03_alu.m4hdl
```

---

## Common Issues

### Build Errors

**Issue:** `undefined reference to 'main'`
**Fix:** Check you're building the right target (e.g., `make micro8`, not `make cpu.o`)

**Issue:** Warning about unused variables
**Fix:** Use `-Wall -Wextra` flags (default) and fix warnings

### Runtime Errors

**Issue:** Program halts immediately
**Fix:** Check program origin (`.org`) matches CPU expectations

**Issue:** Incorrect assembly output
**Fix:** Verify assembler version matches CPU version (micro8-asm for Micro8)

### Test Failures

**Issue:** Test program produces unexpected output
**Fix:** Compare with reference implementation in `reference/` directory
