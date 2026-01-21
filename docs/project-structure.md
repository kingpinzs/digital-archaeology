# Project Structure - Digital Archaeology

> Generated: 2026-01-20 | Scan Level: Exhaustive | Mode: Initial Scan

## Repository Overview

| Attribute | Value |
|-----------|-------|
| **Project Name** | Digital Archaeology |
| **Repository Type** | Monolith |
| **Primary Language** | C |
| **Build System** | Make |
| **Project Type** | Embedded/CLI (Educational CPU Emulators) |

## Purpose

Build CPUs incrementally from 4-bit to 32-bit superscalar, learning **why** each feature was invented through hands-on implementation. This educational project traces the evolution from Intel 4004-like architectures through 8080, 8086, 386, 486, and Pentium-like designs.

## Project Evolution Stages

| Stage | Name | Data Width | Architecture Inspiration | Status |
|-------|------|------------|-------------------------|--------|
| 1 | Micro4 | 4-bit | Intel 4004 | ✅ Complete |
| 2 | Micro8 | 8-bit | Intel 8080 | ✅ Functional |
| 3 | Micro16 | 16-bit | Intel 8086 | ✅ Functional |
| 4 | Micro32 | 32-bit | Intel 386 | ❌ Not Started |
| 5 | Micro32-P | 32-bit | Intel 486 (pipelined) | ❌ Not Started |
| 6 | Micro32-S | 32-bit | Pentium (superscalar) | ❌ Not Started |

## Logical Parts

### 1. CPU Emulators (`src/`)

Each CPU stage has its own directory with a complete toolchain:

| Part | Directory | Components | LOC | Status |
|------|-----------|------------|-----|--------|
| Micro4 | `src/micro4/` | cpu, assembler, disasm, debugger, main | ~1,900 | ✅ Complete |
| Micro8 | `src/micro8/` | cpu, assembler, disasm, debugger, main | ~4,500 | ✅ Functional |
| Micro16 | `src/micro16/` | cpu, assembler, main | ~3,800 | 🔄 Missing disasm/debugger |
| Simulator | `src/simulator/` | circuit, parser, main | ~1,960 | ✅ Complete |

### 2. Hardware Descriptions (`hdl/`)

M4HDL files for gate-level simulation:

| File | Description |
|------|-------------|
| `00_primitives.m4hdl` | Basic gates (AND, OR, NOT, etc.) |
| `01_adders.m4hdl` | Half/full adder, ripple-carry |
| `02_flipflops.m4hdl` | D flip-flop, SR latch |
| `03_alu.m4hdl` | 4-bit ALU |
| `04_micro4_cpu.m4hdl` | Micro4 CPU design |
| `05_micro8_cpu.m4hdl` | Micro8 CPU design |
| `06_micro16_cpu.m4hdl` | Micro16 CPU design |

### 3. Historical Implementations (`hdl/history/`)

| File | Era | Technology |
|------|-----|------------|
| `00_relay_logic.m4hdl` | 1940s | Electromagnetic relays |
| `01_rtl_gates.m4hdl` | 1950s | Resistor-Transistor Logic |
| `02_ttl_gates.m4hdl` | 1960s | TTL 7400 series |
| `03_mos_gates.m4hdl` | 1970s | CMOS gates |

### 4. Test Programs (`programs/`)

Assembly programs for each CPU stage:

| Directory | Count | Purpose |
|-----------|-------|---------|
| `programs/` (root) | 12 | Micro4 test programs |
| `programs/micro8/` | 15 | Micro8 test programs |
| `programs/micro16/` | 13 | Micro16 test programs |

### 5. Educational Materials

| Directory | Purpose | Status |
|-----------|---------|--------|
| `docs/` | Architecture documentation | ✅ Comprehensive |
| `homework/` | Optimization exercises (90 planned) | 🔄 Partial |
| `templates/` | Educational starter HDL templates | 🔄 Partial |
| `literature/` | Historical literature (planned) | ❌ Not Started |

### 6. Visualizer (`visualizer/`)

Circuit visualization system (HTML/JSON):

| Directory | Purpose |
|-----------|---------|
| `visualizer/engine/` | Core visualization engine |
| `visualizer/modules/` | UI modules (gate-view, cpu-state, debugger) |
| `visualizer/themes/` | Visual themes |

### 7. Reference Materials (`reference/`)

Reference implementations for each CPU stage (micro4, micro8, micro16, micro32, micro32p, micro32s).

## File Statistics

| Category | Count | Lines |
|----------|-------|-------|
| C Source Files | 18 | ~12,160 |
| C Header Files | 9 | ~1,200 |
| HDL Files | 11 | ~2,500 |
| Assembly Programs | 40 | ~2,000 |
| Documentation (MD) | 9+ | ~4,500 |
| **Total** | **~90** | **~22,000** |

## Build Artifacts

| Directory | Purpose |
|-----------|---------|
| `bin/` | Compiled executables |
| `logs/` | Parallel development logs |

## Configuration & Tooling

| Directory | Purpose |
|-----------|---------|
| `.claude/` | Claude Code commands, prompts, skills |
| `_bmad/` | BMad workflow system |
| `.vscode/` | VS Code settings |
| `.serena/` | Serena project config |
