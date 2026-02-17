# Story 18.1: Define Stage Constraints

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want constraint definitions per stage,
so that limitations are enforced.

## Acceptance Criteria

1. **Given** each CPU stage **When** constraints are defined **Then** Micro4 has 256-byte memory limit
2. **Given** each CPU stage **When** constraints are defined **Then** Micro8 has 64KB memory limit
3. **Given** each CPU stage **When** constraints are defined **Then** each stage has instruction set limits
4. **Given** each CPU stage **When** constraints are defined **Then** each stage has register count limits
5. **Given** each CPU stage **When** constraints are defined **Then** constraints are stored in configuration

## Tasks / Subtasks

- [x] Task 1: Create StageConstraints interface (AC: #1, #2, #3, #4, #5)
  - [x] 1.1: Define `StageConstraints` interface in `stageConfig.ts` with `memorySize`, `registerCount`, `instructionSetId`, `stackSupported`, `defaultPc`, `defaultSp`
  - [x] 1.2: Define `StageInstructionSet` type to describe available instruction categories per stage
  - [x] 1.3: Add `constraints` field to existing `StageConfig` interface
- [x] Task 2: Populate constraint data for all stages (AC: #1, #2, #3, #4, #5)
  - [x] 2.1: Add Micro4 constraints: memorySize=256, registerCount=0, 16 instructions (accumulator-only, no stack)
  - [x] 2.2: Add Micro8 constraints: memorySize=65536, registerCount=8, 80 instructions (stack, subroutines, interrupts)
  - [x] 2.3: Add Micro16 constraints: memorySize=1048576, registerCount=12 (8 general + 4 segment), 100 instructions (segmentation, multiply)
  - [x] 2.4: Add Micro32 constraints: memorySize=4294967296, registerCount=16, 200 instructions (protected mode, paging)
  - [x] 2.5: Add Micro32-P constraints: same as Micro32 (pipeline is microarchitecture, not ISA)
  - [x] 2.6: Add Micro32-S constraints: same as Micro32 (superscalar is microarchitecture, not ISA)
- [x] Task 3: Create accessor functions (AC: #5)
  - [x] 3.1: Add `getStageConstraints(stage): StageConstraints` function
  - [x] 3.2: Add `getStageMemorySize(stage): number` convenience function
- [x] Task 4: Resolve existing TODO — memorySize in App.ts (AC: #1, #2)
  - [x] 4.1: Replace hardcoded `256` in `handleStageChange()` with `getStageMemorySize(currentStage)`
  - [x] 4.2: Remove the `TODO(CR M-1)` comment
- [x] Task 5: Write comprehensive tests (AC: #1, #2, #3, #4, #5)
  - [x] 5.1: Add constraint tests to existing `stageConfig.test.ts` — verify each stage has correct constraints
  - [x] 5.2: Test `getStageConstraints()` returns valid constraints for every LabStage
  - [x] 5.3: Test `getStageMemorySize()` returns correct byte count per stage
  - [x] 5.4: Test Micro4 memory limit is exactly 256
  - [x] 5.5: Test Micro8 memory limit is exactly 65536
  - [x] 5.6: Test Micro16 memory limit is exactly 1048576
  - [x] 5.7: Test register counts match CPU headers (Micro4=0, Micro8=8, Micro16=12, Micro32+=16)
  - [x] 5.8: Test instruction set limits match STAGE_METADATA.instructionCount values
  - [x] 5.9: Test stackSupported: false for Micro4, true for Micro8+
  - [x] 5.10: Test App.ts uses getStageMemorySize() instead of hardcoded 256
- [x] Task 6: Update barrel exports (AC: #5)
  - [x] 6.1: Export `StageConstraints` and `StageInstructionSet` types from `stageConfig.ts`
  - [x] 6.2: Export `getStageConstraints` and `getStageMemorySize` functions from `stageConfig.ts`

## Dev Notes

### Architecture Context

**This is a pure configuration/data story.** No UI, no enforcement, no error messages. Those are Stories 18.2-18.5. Story 18.1 creates the typed constraint data that downstream stories consume.

**The existing `StageConfig` system** in `src/config/stageConfig.ts` is the natural home for constraints. It already holds per-stage metadata (WASM paths, circuit paths, syntax config). Adding a `constraints` field follows the established pattern perfectly.

**Existing TODO to resolve:** `App.ts:833` has `TODO(CR M-1)` noting that `256` is hardcoded as Micro4's memory size and "StageConfig should expose a memorySize field." This story resolves that.

### Constraint Data Sources (C Headers — Authoritative)

| Stage | MEM_SIZE | Registers | DEFAULT_PC | DEFAULT_SP | Stack? | Source |
|-------|----------|-----------|------------|------------|--------|--------|
| Micro4 | 256 | 0 (accumulator) | N/A | N/A | No | `src/micro4/cpu.h:18` |
| Micro8 | 65536 | 8 (R0-R7) | 0x0200 | 0xFFFF | Yes | `src/micro8/cpu.h:22,25,28` |
| Micro16 | 0x100000 (1MB) | 8 gen + 4 seg = 12 | 0x0100 | 0xFFFE | Yes | `src/micro16/cpu.h:27,42,39` |
| Micro32 | 4GB (0x100000000) | ~16 (TBD) | TBD | TBD | Yes | Not yet built |
| Micro32-P | Same as Micro32 | Same | Same | Same | Yes | Pipeline only |
| Micro32-S | Same as Micro32 | Same | Same | Same | Yes | Superscalar only |

**Instruction counts** come from `STAGE_METADATA` in `StageSelector.ts:27-32`:
- Micro4: 16, Micro8: 80, Micro16: 100, Micro32/P/S: 200

### Instruction Set Category Model

Rather than listing every opcode (which belongs to the assembler), define instruction *categories* available per stage. These categories map to what a user might try to use:

```typescript
type StageInstructionSet = {
  /** Number of distinct opcodes available */
  opcodeCount: number;
  /** Instruction categories available in this stage */
  categories: InstructionCategory[];
};

type InstructionCategory =
  | 'arithmetic'      // ADD, SUB, INC, DEC
  | 'logic'           // AND, OR, XOR, NOT, SHL, SHR
  | 'data-transfer'   // MOV, LDA, STA, PUSH, POP
  | 'control-flow'    // JMP, JZ, JNZ, CALL, RET
  | 'comparison'      // CMP
  | 'stack'           // PUSH, POP (distinct from data-transfer to mark stack support)
  | 'subroutine'      // CALL, RET, RETI
  | 'interrupt'       // INT, RETI, CLI, STI
  | 'io'              // IN, OUT
  | 'multiply'        // MUL, IMUL, DIV
  | 'segment'         // Segment register ops
  | 'protection'      // Protected mode instructions
  | 'paging';         // Page table instructions
```

### Stage → Category Mapping

| Category | Micro4 | Micro8 | Micro16 | Micro32+ |
|----------|--------|--------|---------|----------|
| arithmetic | Yes | Yes | Yes | Yes |
| logic | Yes | Yes | Yes | Yes |
| data-transfer | Yes | Yes | Yes | Yes |
| control-flow | Yes (JMP, JZ) | Yes | Yes | Yes |
| comparison | No | Yes (CMP) | Yes | Yes |
| stack | No | Yes | Yes | Yes |
| subroutine | No | Yes | Yes | Yes |
| interrupt | No | Yes | Yes | Yes |
| io | No | Yes | Yes | Yes |
| multiply | No | No | Yes | Yes |
| segment | No | No | Yes | Yes* |
| protection | No | No | No | Yes |
| paging | No | No | No | Yes |

\* Micro32 may use flat addressing (ISA TBD — Epic 14)

### StageConstraints Interface Design

```typescript
export interface StageConstraints {
  /** Memory size in bytes (e.g., 256, 65536, 1048576) */
  memorySize: number;
  /** Number of programmer-visible general-purpose registers (0 = accumulator-only) */
  registerCount: number;
  /** Instruction set capabilities for this stage */
  instructionSet: StageInstructionSet;
  /** Whether this stage has a hardware stack with PUSH/POP */
  stackSupported: boolean;
  /** Default program counter value on reset (null if stage uses 0) */
  defaultPc: number;
  /** Default stack pointer value on reset (null if no stack) */
  defaultSp: number | null;
}

export interface StageInstructionSet {
  /** Total number of distinct opcodes (matches STAGE_METADATA.instructionCount) */
  opcodeCount: number;
  /** Instruction categories available at this stage */
  categories: InstructionCategory[];
}

export type InstructionCategory =
  | 'arithmetic'
  | 'logic'
  | 'data-transfer'
  | 'control-flow'
  | 'comparison'
  | 'stack'
  | 'subroutine'
  | 'interrupt'
  | 'io'
  | 'multiply'
  | 'segment'
  | 'protection'
  | 'paging';
```

### How This Story Integrates into StageConfig

```typescript
// BEFORE (current):
export interface StageConfig {
  meta: StageInfo;
  ready: boolean;
  wasm: StageWasmConfig;
  circuit: StageCircuitConfig;
  hdl: StageHdlConfig;
  programs: StageProgramsConfig;
  syntax: StageSyntaxConfig;
}

// AFTER (this story):
export interface StageConfig {
  meta: StageInfo;
  ready: boolean;
  wasm: StageWasmConfig;
  circuit: StageCircuitConfig;
  hdl: StageHdlConfig;
  programs: StageProgramsConfig;
  syntax: StageSyntaxConfig;
  constraints: StageConstraints;  // ← NEW
}
```

### Existing Code Touchpoints

| File | What exists | What changes |
|------|------------|--------------|
| `src/config/stageConfig.ts` | StageConfig interface, STAGE_CONFIGS registry | Add StageConstraints interface, constraints field, data, accessor functions |
| `src/config/stageConfig.test.ts` | Tests for StageConfig fields and isStageReady | Add constraint-specific tests |
| `src/ui/StageSelector.ts` | STAGE_METADATA with addressSpace/instructionCount | No changes — STAGE_METADATA remains display-only metadata |
| `src/ui/App.ts` | TODO(CR M-1) on line 833 with hardcoded `256` | Replace with getStageMemorySize() |
| `src/emulator/types.ts` | AssemblerErrorType includes CONSTRAINT_ERROR | No changes — already has the error type for future use |
| `src/story/types.ts` | EraConstraint, PersonaConstraint for story mode | No changes — these are narrative constraints, not technical enforcement |

### Anti-Patterns to AVOID

- **DO NOT** create enforcement logic — that's Story 18.2 (memory) and 18.3 (instruction set)
- **DO NOT** create UI error messages — that's Story 18.4 (educational error messages)
- **DO NOT** create an experimentation mode toggle — that's Story 18.5
- **DO NOT** modify the emulator worker to read constraints — enforcement is downstream
- **DO NOT** modify the assembler to validate constraints — enforcement is downstream
- **DO NOT** duplicate data from STAGE_METADATA.instructionCount — reference it via `meta.instructionCount`
- **DO NOT** create a separate file for constraints — embed in `stageConfig.ts` where all stage config lives
- **DO NOT** add display logic for constraints — this is pure data
- **DO NOT** confuse `EraConstraint` (story/narrative) with `StageConstraints` (technical limits)
- **DO NOT** use default exports — named exports only (project convention)

### Micro32/32-P/32-S Constraint Data

Micro32 ISA is not yet defined (Epic 14). Use reasonable placeholder values:
- `memorySize: 4294967296` (4GB = 0x100000000) per STAGE_METADATA addressSpace "4 GB"
- `registerCount: 16` (typical 32-bit architecture)
- `defaultPc: 0` (placeholder)
- `defaultSp: 0xFFFFFFFE` (placeholder, typical for 32-bit)
- `instructionSet.opcodeCount: 200` per STAGE_METADATA.instructionCount

Micro32-P and Micro32-S share the same ISA as Micro32 (pipeline and superscalar are microarchitecture, not ISA). Their constraints should reference the same values.

### State Flow

```
stageConfig.ts defines StageConstraints data
  → Story 18.2: AssemblerBridge reads getStageMemorySize() to validate binary size
  → Story 18.3: AssemblerBridge reads getStageConstraints().instructionSet to validate opcodes
  → Story 18.4: Error messages reference constraint data for educational context
  → Story 18.5: Experimentation mode bypasses constraint checks
```

### App.ts TODO Resolution

```typescript
// BEFORE (App.ts:833):
// TODO(CR M-1): 256 is micro4's memory size. When additional stages ship,
// StageConfig should expose a memorySize field. Emulator's first STATE_UPDATE
// will correct the display, so this is a safe cosmetic default for now.
this.memoryView?.updateState({ memory: new Uint8Array(256), pc: 0 });

// AFTER:
this.memoryView?.updateState({
  memory: new Uint8Array(getStageMemorySize(this.currentStage)),
  pc: 0,
});
```

**Note:** For Micro16 (1MB) and Micro32 (4GB), creating a `new Uint8Array(memorySize)` for the default state would be wasteful. The developer MUST use `Math.min(memorySize, 65536)` or a separate `defaultMemoryViewSize` to cap the default empty buffer. The emulator's first STATE_UPDATE will replace this anyway — it's purely a cosmetic placeholder. A safe approach:

```typescript
// Cap default buffer at 64KB — emulator's first STATE_UPDATE replaces this
const defaultBufSize = Math.min(getStageMemorySize(this.currentStage), 65536);
this.memoryView?.updateState({ memory: new Uint8Array(defaultBufSize), pc: 0 });
```

### Project Structure Notes

- MODIFIED: `digital-archaeology-web/src/config/stageConfig.ts` (~60 lines added: interfaces, constraint data, accessor functions)
- MODIFIED: `digital-archaeology-web/src/config/stageConfig.test.ts` (~60 lines added: constraint tests)
- MODIFIED: `digital-archaeology-web/src/ui/App.ts` (1 line changed: replace hardcoded 256 with getStageMemorySize)

### Naming Conventions

- Interface: `StageConstraints` (PascalCase, matches `StageConfig` pattern)
- Type: `InstructionCategory` (PascalCase)
- Interface: `StageInstructionSet` (PascalCase)
- Function: `getStageConstraints(stage)` (camelCase, matches `getStageConfig()` pattern)
- Function: `getStageMemorySize(stage)` (camelCase, convenience accessor)
- Constants: None needed — constraint data is embedded in STAGE_CONFIGS object literal

### Testing Requirements

- **Framework:** Vitest with jsdom environment
- **Pattern:** RED-GREEN — write tests first, then implement
- **Coverage:** Add to existing `stageConfig.test.ts` (no new test file)
- **Minimum:** 15+ tests covering each AC:
  - AC #1: Micro4 memorySize === 256
  - AC #2: Micro8 memorySize === 65536
  - AC #3: Each stage has instructionSet with categories matching its capabilities
  - AC #4: Each stage has correct registerCount (0, 8, 12, 16)
  - AC #5: Constraints accessed via getStageConstraints(), getStageMemorySize()
- **Zero regressions:** All existing 4374 tests must continue passing
- **Integration:** Test App.ts uses getStageMemorySize() (can be verified in existing App.test.ts stage-change tests)

### Previous Story Intelligence (12-6 Visualize CALL/RET)

**Patterns established that MUST be followed:**
1. Named exports only (no default exports)
2. Add to existing files rather than creating new ones where possible
3. BEM CSS naming (not applicable to this config-only story)
4. Constants in `SCREAMING_SNAKE_CASE` if needed
5. `isMicro8CPUState()` type guard for stage-awareness
6. Comprehensive test coverage with explicit numeric assertions
7. Update helper functions at all state update sites when modifying App.ts

**Code review lessons from 12-5 and 12-6:**
- Hardcoded values flagged (e.g., CR M-1 in Story 12-5 flagged hardcoded 256)
- Duplicated constants: acceptable if cross-module coupling is worse
- JSDoc accuracy matters — verify comments describe actual behavior
- Test edge cases for optional/default values

### Git Intelligence

**Commit pattern:** `feat: implement Story 18-1 Define Stage Constraints with code review fixes`
**Files per story:** Usually component + test + imports + App.ts + sprint-status.yaml
**Recent test count:** 4374 (growing by ~15-50 per story)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-18, Story 18.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#Format-Patterns, CONSTRAINT_ERROR type]
- [Source: digital-archaeology-web/src/config/stageConfig.ts — StageConfig interface, STAGE_CONFIGS registry]
- [Source: digital-archaeology-web/src/config/stageConfig.test.ts — existing test patterns]
- [Source: digital-archaeology-web/src/ui/StageSelector.ts — STAGE_METADATA, instructionCount]
- [Source: digital-archaeology-web/src/ui/App.ts:833 — TODO(CR M-1) for memorySize]
- [Source: digital-archaeology-web/src/emulator/types.ts — AssemblerErrorType with CONSTRAINT_ERROR]
- [Source: digital-archaeology-web/src/emulator/emulator.worker.ts — hardcoded 256 and 65536]
- [Source: digital-archaeology-web/src/story/types.ts — EraConstraint/PersonaConstraint (story-mode, not technical)]
- [Source: src/micro4/cpu.h:18 — MEM_SIZE 256]
- [Source: src/micro8/cpu.h:22,25,28 — MEM_SIZE 65536, DEFAULT_SP 0xFFFF, DEFAULT_PC 0x0200]
- [Source: src/micro16/cpu.h:27,39,42 — MEM_SIZE 0x100000, DEFAULT_SP 0xFFFE, DEFAULT_PC 0x0100]
- [Source: _bmad-output/implementation-artifacts/12-6-visualize-call-ret-operations.md — Previous story patterns]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- Tests: 4404 total (106 files), 0 failures
- New tests: 30 constraint tests added to stageConfig.test.ts
- Previous count: 4374 (Story 12-6) → 4404 (Story 18-1), delta = +30

### Completion Notes List
- Task 1: Created `StageConstraints`, `StageInstructionSet`, and `InstructionCategory` types; added `constraints` field to `StageConfig` interface
- Task 2: Populated constraint data for all 6 stages from C headers (micro4/cpu.h, micro8/cpu.h, micro16/cpu.h) and STAGE_METADATA. Micro32/P/S use placeholder values per STAGE_METADATA
- Task 3: Added `getStageConstraints()` and `getStageMemorySize()` accessor functions following existing `getStageConfig()` pattern
- Task 4: Resolved TODO(CR M-1) in App.ts — replaced hardcoded `256` with `getStageMemorySize(this.currentStage)` capped at 64KB for default buffer
- Task 5: 30 new tests covering all 5 ACs — memory sizes, register counts, instruction set categories, stack support, default PC/SP, accessor functions
- Task 6: Types and functions exported directly from stageConfig.ts (no separate barrel file for config)

### File List
- MODIFIED: `digital-archaeology-web/src/config/stageConfig.ts` (~70 lines added: interfaces, constraint data, accessor functions)
- MODIFIED: `digital-archaeology-web/src/config/stageConfig.test.ts` (+30 tests in 3 describe blocks)
- MODIFIED: `digital-archaeology-web/src/ui/App.ts` (1 import added, 3 lines changed: getStageMemorySize replaces hardcoded 256)
- MODIFIED: `_bmad-output/implementation-artifacts/18-1-define-stage-constraints.md` (status + tasks + record)
- MODIFIED: `_bmad-output/implementation-artifacts/sprint-status.yaml` (status tracking)

## Review

### Review Findings (6 total: 1H, 2M, 3L)

| # | Severity | Finding | Status |
|---|----------|---------|--------|
| 1H | HIGH | Mutable shared config — no `readonly` on StageConstraints/StageInstructionSet fields | FIXED |
| 2M | MEDIUM | Tripled Micro32 constraint data — identical objects repeated for micro32/32p/32s | FIXED |
| 3M | MEDIUM | Remaining hardcoded Micro8 reset values in App.ts (0xFFFF, 65536) not migrated to constraint accessors | FIXED |
| 4L | LOW | Missing exact-length category assertions in tests — regression could add extra categories undetected | FIXED |
| 5L | LOW | Unused type imports (`StageConstraints`, `InstructionCategory`) in test file — imported but no type annotations | FIXED |
| 6L | LOW | StageConstraints JSDoc over-claims data sources — references C headers that don't exist for Micro32+ | FIXED |

### Fixes Applied
- **1H:** Added `readonly` to all `StageConstraints` and `StageInstructionSet` interface fields; `categories` is now `readonly InstructionCategory[]`
- **2M:** Extracted `MICRO32_CONSTRAINTS` shared constant; micro32/32p/32s reference it instead of repeating 15 lines each
- **3M:** Micro8 branch now uses `getStageConstraints('micro8')` for `defaultSp` and `memorySize`; else branch uses `sp: 0` (semantically correct for no-stack clear)
- **4L:** Added `expect(cats).toHaveLength(N)` to all 4 category tests (Micro4=4, Micro8=9, Micro16=11, Micro32+=13)
- **5L:** Added `StageConstraints` and `InstructionCategory` type annotations to test variables
- **6L:** Updated JSDoc to: "Data sources: src/micro{4,8,16}/cpu.h for implemented stages; Micro32+ use placeholder values pending Epic 14 ISA definition"

### Post-Fix Verification
- TypeScript compilation: clean (no new errors)
- Unit tests: 4404 passed (106 files), 0 failures, 0 regressions
- stageConfig.test.ts: 52 tests pass
