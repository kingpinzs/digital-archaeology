# Existing Documentation Inventory

> Generated: 2026-01-20 | Scan Level: Exhaustive

## Summary

| Category | Count |
|----------|-------|
| Core Documentation | 3 |
| Architecture & ISA | 4 |
| Educational Materials | 4 |
| Homework Exercises | 5 |
| Educational Templates | 5 |
| Vision Documents | 2 |
| **Total** | **23** |

---

## Vision Documents (CRITICAL)

These documents define the broader project vision and should inform all development decisions:

| File | Description |
|------|-------------|
| **IMMERSIVE_PLATFORM_PLAN.md** | Master vision: "Become the inventors who shaped computing history" - immersive web platform with persona-based learning |
| **docs/digital_archaeology_lab_plan.md** | Platform implementation plan: SPA architecture, lesson structure, hardware track |

### Key Vision Points

1. **Immersive Learning** - Students adopt historical personas (Ada Lovelace, Turing, Zuse, Faggin, Wozniak)
2. **Period-Accurate Constraints** - No modern hints, feel the 4-bit pain, tiny memory limits
3. **Discovery-Based** - Features invented through necessity, not taught mechanically
4. **Web Platform** - Single-page application with circuit visualization, code editor, debugger
5. **Build It Real** - Optional hardware track (relays, TTL, FPGA)

---

## Core Documentation

| File | Type | Description |
|------|------|-------------|
| `README.md` | readme | Quick start, 6-stage CPU evolution table, directory structure |
| `CLAUDE.md` | project-config | Parallel development protocol for AI agents, file ownership rules |
| `docs/PROJECT_STATUS.md` | status | Complete project status (479 lines) - all stages, implementations, test programs |

---

## Architecture & ISA Documentation

| File | Lines | Description |
|------|-------|-------------|
| `docs/development_plan.md` | - | High-level development roadmap |
| `docs/incremental_cpu_design.md` | - | CPU architecture evolution from 4-bit to superscalar |
| `docs/micro4_minimal_architecture.md` | - | Micro4 4-bit CPU specification (16 opcodes, 256 nibbles) |
| `docs/micro8_isa.md` | ~1,024 | Complete 8-bit ISA specification (~80 opcodes, 8 registers) |

---

## Educational Materials

| File | Description |
|------|-------------|
| `docs/optimization_homework.md` | 90 optimization exercises across 8 categories (ALU, registers, addressing, etc.) |
| `docs/historical_homework.md` | 80 historical computing exercises tracing 8 eras (Babbage → 8080) |
| `docs/cpu_history_timeline.md` | CPU evolution timeline 1971-2004 |
| `docs/tutorial_logic_block.md` | Logic block tutorial |

---

## Reference Documentation

| File | Description |
|------|-------------|
| `docs/hardware_description_format.md` | M4HDL syntax and semantics reference |

---

## Homework Exercises (`homework/`)

### Micro4 Homework (5 exercises)
| File | Focus |
|------|-------|
| `homework/micro4/01_add_inc_dec.md` | Add INC/DEC instructions to Micro4 |
| `homework/micro4/02_add_zero_flag.md` | Add zero flag and JNZ instruction |
| `homework/micro4/03_add_carry_flag.md` | Add carry flag for multi-precision math |
| `homework/micro4/04_add_shift_rotate.md` | Add shift and rotate instructions |
| `homework/micro4/05_add_multiply.md` | Add hardware multiply instruction |

### Other Stages (Empty directories awaiting content)
- `homework/micro8/` - 8 exercises planned
- `homework/micro16/` - 10 exercises planned
- `homework/micro32/` - 12 exercises planned
- `homework/micro32p/` - 10 pipeline exercises planned
- `homework/micro32s/` - 8 superscalar exercises planned

---

## Educational Templates (`templates/`)

### Micro4 Templates
| File | Description |
|------|-------------|
| `templates/micro4/hdl/starter.m4hdl` | Starter HDL file with TODOs for students |
| `templates/micro4/hints/hint1_alu_concept.md` | ALU conceptual guide |
| `templates/micro4/hints/hint2_alu_structure.md` | ALU structure guide |
| `templates/micro4/hints/hint3_alu_implementation.md` | ALU implementation guide |
| `templates/micro4/hints/hint4_control_concept.md` | Control unit concept |
| `templates/micro4/hints/hint5_control_implementation.md` | Control unit implementation |

### Other Stages (Empty directories awaiting content)
- `templates/micro8/` - Starter templates planned
- `templates/micro16/` - Templates planned
- `templates/micro32/` - Templates planned
- `templates/micro32p/` - Pipeline templates planned
- `templates/micro32s/` - Superscalar templates planned

---

## User-Provided Context

**Critical Focus Areas:**
1. `IMMERSIVE_PLATFORM_PLAN.md` - Defines the educational philosophy and web platform vision
2. `docs/digital_archaeology_lab_plan.md` - Defines the technical implementation plan

**User Note:** These documents are "extremely important to the overall idea" - the project is not just about CPU emulators but about creating an immersive educational experience where students become historical inventors.
