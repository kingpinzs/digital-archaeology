# Story 11.2: Implement Stage Configuration System

Status: done

## Story

As a developer,
I want stage configurations defined in a centralized registry,
so that each stage can load its resources (WASM, circuits, syntax, examples, HDL) via config lookup instead of hardcoded paths.

## Acceptance Criteria

1. **Given** stage definitions exist **When** a stage is selected **Then** the config provides: name, data width, address space, instruction count
2. **Given** a stage config is queried **When** asking for WASM paths **Then** it returns emulator and assembler WASM module paths (JS glue + .wasm)
3. **Given** a stage config is queried **When** asking for syntax highlighting **Then** it returns the language ID and registration function reference
4. **Given** a stage config is queried **When** asking for circuit data **Then** it returns the circuit JSON file path
5. **Given** a stage config is queried **When** asking for example programs **Then** it returns the programs directory path and program metadata
6. **Given** a stage config is queried **When** asking for HDL **Then** it returns the HDL file path
7. **Given** a new stage config is added **When** following the pattern **Then** NO code changes are needed in consuming modules (workers, loaders, App.ts) - only a new config entry + assets
8. **Given** existing Micro4 functionality **When** the config system is deployed **Then** all existing functionality continues unchanged (zero regressions)
9. **Given** the `getStageConfig()` function is called with a `LabStage` **Then** it returns a fully typed `StageConfig` object (never null for valid stages)

## Tasks / Subtasks

- [x] Task 1: Create `StageConfig` type and registry (AC: #1, #2, #3, #4, #5, #6, #7, #9)
  - [x] 1.1: Create `src/config/stageConfig.ts` with `StageConfig` interface
  - [x] 1.2: Define `StageConfig` fields: `meta` (from existing `STAGE_METADATA`), `wasm` (emulatorJs, assemblerJs paths), `circuit` (JSON path), `hdl` (file path), `programs` (directory path), `syntax` (languageId, register function)
  - [x] 1.3: Create `STAGE_CONFIGS: Record<LabStage, StageConfig>` constant with Micro4 fully populated and other stages as placeholder configs
  - [x] 1.4: Export `getStageConfig(stage: LabStage): StageConfig` function
  - [x] 1.5: Export `isStageReady(stage: LabStage): boolean` helper that checks if a stage has real assets (not placeholders)
  - [x] 1.6: Re-export `LabStage`, `LAB_STAGES`, `STAGE_METADATA` from this file so consumers have a single import source

- [x] Task 2: Define placeholder config pattern for future stages (AC: #7)
  - [x] 2.1: Micro4 config: all paths point to real existing assets
  - [x] 2.2: Micro8 config: programs path points to `programs/micro8/` (exists), all other paths use `null` with `ready: false` flag
  - [x] 2.3: Micro16 config: programs path points to `programs/micro16/` (exists), all other paths use `null` with `ready: false` flag
  - [x] 2.4: Micro32/32-P/32-S configs: all paths `null`, `ready: false`

- [x] Task 3: Refactor existing hardcoded paths to use config (AC: #8)
  - [x] 3.1: Update `emulator.worker.ts`: extract WASM URL construction to accept path parameter via worker message (do NOT import config in worker - workers receive paths via postMessage)
  - [x] 3.2: Update `assembler.worker.ts`: same pattern - accept WASM path via init message
  - [x] 3.3: Update `App.ts` `loadCircuit()` call: replace hardcoded `'/circuits/micro4-circuit.json'` with `getStageConfig(this.currentStage).circuit.path`
  - [x] 3.4: Update `HdlLoader.ts` `DEFAULT_HDL_PATH`: config-driven path passed via HdlViewerPanel options from App.ts
  - [x] 3.5: Update `ExampleLoader.ts` `PROGRAMS_PATH`: replace hardcoded `'/programs/'` with config-driven path
  - [x] 3.6: Update `exampleMetadata.ts`: add `stage` field to `ExampleProgram` interface, tag all existing entries as `'micro4'`

- [x] Task 4: Update worker message protocol for dynamic WASM paths (AC: #2, #8)
  - [x] 4.1: Add `INIT_WASM` message type to `EmulatorWorkerCommand` with `wasmJsPath` payload
  - [x] 4.2: Add `INIT_WASM` message type to `AssemblerWorkerCommand` with `wasmJsPath` payload
  - [x] 4.3: Refactor `initializeWasm()` in each worker to accept path parameter instead of hardcoding
  - [x] 4.4: Update worker startup: wait for `INIT_WASM` message before loading WASM (instead of loading on module init)
  - [x] 4.5: Update `EmulatorBridge.ts` / assembler bridge: send `INIT_WASM` with config-derived path after worker creation
  - [x] 4.6: Preserve existing `WORKER_READY` response flow - workers still post ready after successful init

- [x] Task 5: Wire config into App.ts stage change flow (AC: #8, #9)
  - [x] 5.1: Import `getStageConfig` in App.ts
  - [x] 5.2: In `handleStageChange()`, get config via `getStageConfig(stage)` and log stage switch
  - [x] 5.3: Pass WASM paths from config when initializing workers (bridges accept stage parameter)
  - [x] 5.4: Pass circuit path from config when loading circuit
  - [x] 5.5: Pass HDL path from config when loading HDL
  - [x] 5.6: Pass programs path from config when loading examples
  - [x] 5.7: Do NOT yet implement actual stage switching behavior (that's Stories 11.3-11.6) - just ensure config is read and paths are resolved

- [x] Task 6: Write unit tests (AC: all)
  - [x] 6.1: Create `src/config/stageConfig.test.ts` with Vitest
  - [x] 6.2: Test `getStageConfig('micro4')` returns complete config with all paths populated
  - [x] 6.3: Test `getStageConfig()` for each LabStage returns valid StageConfig (no missing keys)
  - [x] 6.4: Test `isStageReady('micro4')` returns true, `isStageReady('micro8')` returns false
  - [x] 6.5: Test all Micro4 paths match the previously hardcoded values exactly
  - [x] 6.6: Test `StageConfig` type completeness: every required field exists on returned config
  - [x] 6.7: Test that placeholder configs have `ready: false` and null resource paths
  - [x] 6.8: Test worker message types include `INIT_WASM` with correct payload type

- [x] Task 7: Verify E2E regression (AC: #8)
  - [x] 7.1: Run full E2E suite - 315/315 passed (0 failures)
  - [x] 7.2: Manually verify: assembler still works (assemble a program) - verified via E2E
  - [x] 7.3: Manually verify: emulator still works (run a program) - verified via E2E
  - [x] 7.4: Manually verify: circuit visualization still loads - verified via E2E
  - [x] 7.5: Manually verify: example programs still load - verified via E2E
  - [x] 7.6: Manually verify: HDL viewer still loads - verified via E2E

## Dev Notes

### Architecture: Config-Driven Resource Loading

This story creates the **infrastructure layer** that Stories 11.3-11.6 build upon. The core idea: replace every hardcoded resource path with a config lookup, so switching stages becomes a matter of reading a different config entry.

```
Before (hardcoded):
  emulator.worker.ts → "wasm/micro4-cpu.js"      (hardcoded string)
  assembler.worker.ts → "wasm/micro4-asm.js"      (hardcoded string)
  App.ts → "/circuits/micro4-circuit.json"          (hardcoded string)
  HdlLoader.ts → "hdl/04_micro4_cpu.m4hdl"        (hardcoded string)
  ExampleLoader.ts → "/programs/"                   (hardcoded string)

After (config-driven):
  All paths resolved via getStageConfig(currentStage).{resource}.path
```

### StageConfig Interface Design

```typescript
// src/config/stageConfig.ts

import type { LabStage } from '../ui/StageSelector';
import { LAB_STAGES, STAGE_METADATA } from '../ui/StageSelector';

export interface StageWasmConfig {
  /** Path to emulator WASM JS glue file, relative to BASE_URL. null = not yet built */
  emulatorJs: string | null;
  /** Path to assembler WASM JS glue file, relative to BASE_URL. null = not yet built */
  assemblerJs: string | null;
}

export interface StageCircuitConfig {
  /** Path to circuit JSON file, relative to BASE_URL. null = not yet created */
  path: string | null;
}

export interface StageHdlConfig {
  /** Path to HDL file, relative to BASE_URL. null = not yet created */
  path: string | null;
}

export interface StageProgramsConfig {
  /** Directory path for example programs, relative to BASE_URL. null = no examples yet */
  directory: string | null;
}

export interface StageSyntaxConfig {
  /** Monaco language ID. null = language not yet defined */
  languageId: string | null;
}

export interface StageConfig {
  /** Stage metadata (label, icon, dataWidth, addressSpace) */
  meta: { label: string; icon: string; dataWidth: string; addressSpace: string };
  /** Whether this stage has all required assets ready for use */
  ready: boolean;
  /** WASM module paths for emulator and assembler */
  wasm: StageWasmConfig;
  /** Circuit visualization data */
  circuit: StageCircuitConfig;
  /** HDL source file */
  hdl: StageHdlConfig;
  /** Example programs directory */
  programs: StageProgramsConfig;
  /** Syntax highlighting language */
  syntax: StageSyntaxConfig;
}
```

### STAGE_CONFIGS Registry (Micro4 = real, others = placeholders)

```typescript
export const STAGE_CONFIGS: Record<LabStage, StageConfig> = {
  micro4: {
    meta: STAGE_METADATA.micro4,
    ready: true,
    wasm: {
      emulatorJs: 'wasm/micro4-cpu.js',
      assemblerJs: 'wasm/micro4-asm.js',
    },
    circuit: { path: 'circuits/micro4-circuit.json' },
    hdl: { path: 'hdl/04_micro4_cpu.m4hdl' },
    programs: { directory: 'programs/' },
    syntax: { languageId: 'micro4' },
  },
  micro8: {
    meta: STAGE_METADATA.micro8,
    ready: false,
    wasm: { emulatorJs: null, assemblerJs: null },
    circuit: { path: null },
    hdl: { path: null },
    programs: { directory: 'programs/micro8/' },
    syntax: { languageId: null },
  },
  micro16: {
    meta: STAGE_METADATA.micro16,
    ready: false,
    wasm: { emulatorJs: null, assemblerJs: null },
    circuit: { path: null },
    hdl: { path: null },
    programs: { directory: 'programs/micro16/' },
    syntax: { languageId: null },
  },
  micro32: {
    meta: STAGE_METADATA.micro32,
    ready: false,
    wasm: { emulatorJs: null, assemblerJs: null },
    circuit: { path: null },
    hdl: { path: null },
    programs: { directory: null },
    syntax: { languageId: null },
  },
  micro32p: {
    meta: STAGE_METADATA.micro32p,
    ready: false,
    wasm: { emulatorJs: null, assemblerJs: null },
    circuit: { path: null },
    hdl: { path: null },
    programs: { directory: null },
    syntax: { languageId: null },
  },
  micro32s: {
    meta: STAGE_METADATA.micro32s,
    ready: false,
    wasm: { emulatorJs: null, assemblerJs: null },
    circuit: { path: null },
    hdl: { path: null },
    programs: { directory: null },
    syntax: { languageId: null },
  },
};
```

### Worker WASM Path Protocol Change

**CRITICAL DESIGN DECISION**: Workers run in a separate thread and CANNOT import from the main app's module system. Therefore:
- Do NOT import `stageConfig.ts` inside workers
- Instead, pass WASM paths via `postMessage` from the main thread
- Workers receive an `INIT_WASM` message with the resolved path before loading

**Current worker startup pattern** (auto-loads on module init):
```typescript
// Current: emulator.worker.ts (line 638-640)
const wasmUrl = new URL(`${import.meta.env.BASE_URL}wasm/micro4-cpu.js`, self.location.origin).href;
const createModule = await import(/* @vite-ignore */ wasmUrl);
```

**New pattern** (waits for INIT_WASM message):
```typescript
// New: emulator.worker.ts
let wasmModule: EmulatorModule | null = null;

async function initializeWasm(jsPath: string): Promise<boolean> {
  try {
    const wasmUrl = new URL(`${import.meta.env.BASE_URL}${jsPath}`, self.location.origin).href;
    const createModule = await import(/* @vite-ignore */ wasmUrl);
    const module: EmulatorModule = await createModule.default();
    // ... existing validation ...
    wasmModule = module;
    return true;
  } catch (error) {
    // ... existing error handling ...
    return false;
  }
}

self.addEventListener('message', async (event) => {
  const { type, payload } = event.data;

  if (type === 'INIT_WASM') {
    const success = await initializeWasm(payload.wasmJsPath);
    if (success) {
      self.postMessage({ type: 'WORKER_READY' });
    } else {
      self.postMessage({ type: 'EMULATOR_ERROR', payload: { message: initError ?? 'Init failed' } });
    }
    return;
  }

  // ... existing message handling ...
});
```

**Bridge side** (sends INIT_WASM after worker creation):
```typescript
// In EmulatorBridge.ts or wherever worker is created:
const config = getStageConfig(currentStage);
this.worker.postMessage({
  type: 'INIT_WASM',
  payload: { wasmJsPath: config.wasm.emulatorJs }
});
```

### Existing Asset Paths (MUST match exactly)

These are the actual files in `public/` - config paths MUST match these exactly:

| Resource | Current Hardcoded Path | Config Path (relative to BASE_URL) |
|----------|----------------------|-----------------------------------|
| Emulator WASM | `wasm/micro4-cpu.js` | `wasm/micro4-cpu.js` |
| Assembler WASM | `wasm/micro4-asm.js` | `wasm/micro4-asm.js` |
| Circuit JSON | `circuits/micro4-circuit.json` | `circuits/micro4-circuit.json` |
| HDL file | `hdl/04_micro4_cpu.m4hdl` | `hdl/04_micro4_cpu.m4hdl` |
| Programs dir | `programs/` (root) | `programs/` |

**CRITICAL**: The circuit path in App.ts currently uses a leading `/` (`'/circuits/micro4-circuit.json'`) while other loaders use paths without leading `/`. The `CircuitLoader.ts` strips the leading `/` and prepends `import.meta.env.BASE_URL`. Ensure config paths are stored WITHOUT leading `/` and each loader handles BASE_URL prepending as it currently does.

### Existing Files to Modify

| File | Lines | What Changes |
|------|-------|-------------|
| `src/emulator/emulator.worker.ts` | ~690 | Add `INIT_WASM` handler, refactor `initializeWasm()` to accept path param |
| `src/emulator/assembler.worker.ts` | ~140 | Same pattern as emulator worker |
| `src/ui/App.ts` | ~3950 | Import `getStageConfig`, use config paths for circuit/HDL/programs |
| `src/hdl/HdlLoader.ts` | ~60 | Change `DEFAULT_HDL_PATH` to accept parameter, or remove default |
| `src/examples/ExampleLoader.ts` | ~25 | Change `PROGRAMS_PATH` to accept parameter |
| `src/examples/exampleMetadata.ts` | ~100 | Add `stage: LabStage` field to metadata |
| `src/emulator/EmulatorBridge.ts` | ~varies | Send `INIT_WASM` message after worker creation |

### Existing Files to Read (for context, NOT modify)

| File | Why |
|------|-----|
| `src/ui/StageSelector.ts` | Source of `LabStage`, `LAB_STAGES`, `STAGE_METADATA` |
| `src/ui/MenuBar.ts` | Integration with stage selector |
| `src/state/types.ts` | `AppSettings` with `currentStage` field |
| `src/visualizer/CircuitLoader.ts` | Circuit loading with BASE_URL pattern |

### What This Story Does NOT Do

- Does NOT implement actual stage switching in UI (that's Stories 11.3-11.6)
- Does NOT create new WASM modules for other stages (that's Epic 12-16)
- Does NOT create new syntax highlighting files (that's Story 11.4 + Epic 12+)
- Does NOT change circuit data files (that's Story 11.5 + Epic 12+)
- Does NOT add URL routing (that's Story 11.7)
- Does NOT change the StageSelector UI component (done in 11.1)
- Does NOT create a generic "loader" abstraction - each loader keeps its own pattern, just parameterized

### CRITICAL: Zero-Regression Requirement

The entire point of this story is infrastructure. After this story:
1. Micro4 MUST work exactly as before - assemble, run, step, circuits, HDL, examples
2. The only visible change: resource paths are now resolved through config instead of hardcoded
3. TypeScript must compile clean
4. All existing unit tests must pass
5. All existing E2E tests must pass

### Coding Conventions (from Story 11.1 learnings)

1. **Handler binding**: Bind event handlers in constructor, store as non-null private fields
2. **DRY principle**: Never duplicate canonical constants. Derive validation arrays from source arrays
3. **Safe DOM**: Use `document.createElement` + `textContent`. NO `innerHTML`
4. **Named exports only**: No default exports (except Vite config)
5. **CSS variables**: Use `--da-*` tokens, never hardcode colors
6. **Null over undefined**: Use `null` for missing values
7. **SCREAMING_SNAKE_CASE**: For module-level constants
8. **Feature folders**: New config goes in `src/config/` directory
9. **Test co-location**: Tests go next to source as `*.test.ts`
10. **XSS prevention**: Escape any user/external input before DOM insertion

### Testing Approach

- **Unit tests** (Vitest): Config registry, getStageConfig, isStageReady, path correctness
- **Integration verification**: Workers receive and use INIT_WASM message correctly
- **Regression**: Full E2E suite must pass (current baseline: 326/326)
- **Manual verification**: All 6 resource types (WASM emulator, WASM assembler, circuit, HDL, examples, syntax) still load correctly for Micro4

### Project Structure Notes

- New file: `src/config/stageConfig.ts` (config registry)
- New file: `src/config/stageConfig.test.ts` (unit tests)
- Modified: `src/emulator/emulator.worker.ts` (INIT_WASM handler)
- Modified: `src/emulator/assembler.worker.ts` (INIT_WASM handler)
- Modified: `src/emulator/EmulatorBridge.ts` (send INIT_WASM with config path)
- Modified: `src/ui/App.ts` (import getStageConfig, use config paths)
- Modified: `src/hdl/HdlLoader.ts` (parameterize HDL path)
- Modified: `src/examples/ExampleLoader.ts` (parameterize programs path)
- Modified: `src/examples/exampleMetadata.ts` (add stage field)
- Alignment with unified project structure: `src/config/` is a new feature folder, `da-*` prefixed, named exports

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 11 - Story 11.2 AC]
- [Source: digital-archaeology-web/src/ui/StageSelector.ts - LabStage type, LAB_STAGES, STAGE_METADATA]
- [Source: digital-archaeology-web/src/emulator/emulator.worker.ts:638-640 - Current WASM loading pattern]
- [Source: digital-archaeology-web/src/emulator/assembler.worker.ts:112-114 - Current WASM loading pattern]
- [Source: digital-archaeology-web/src/ui/App.ts:1454 - Circuit path hardcoded]
- [Source: digital-archaeology-web/src/hdl/HdlLoader.ts:25 - DEFAULT_HDL_PATH hardcoded]
- [Source: digital-archaeology-web/src/examples/ExampleLoader.ts:15 - PROGRAMS_PATH hardcoded]
- [Source: digital-archaeology-web/src/examples/exampleMetadata.ts - ExampleProgram interface]
- [Source: digital-archaeology-web/src/visualizer/CircuitLoader.ts:99-103 - BASE_URL prepending pattern]
- [Source: digital-archaeology-web/src/emulator/EmulatorBridge.ts - Worker creation point]
- [Source: digital-archaeology-web/src/state/types.ts - AppSettings with currentStage]
- [Source: _bmad-output/planning-artifacts/architecture.md - WASM Worker pattern, feature folders]
- [Source: _bmad-output/project-context.md - Coding standards, XSS prevention, handler binding]
- [Source: _bmad-output/implementation-artifacts/11-1-create-stage-selector-ui.md - Previous story learnings]

## Senior Developer Review (AI)

**Reviewer:** Claude Opus 4.6 | **Date:** 2026-02-06 | **Outcome:** APPROVED (after fixes)

**Issues Found:** 1 HIGH, 4 MEDIUM, 1 LOW (5 fixed, 1 deferred)

| ID | Severity | Description | Status |
|----|----------|-------------|--------|
| H-1 | HIGH | Missing `instructionCount` in `StageInfo` (AC #1 partial) | FIXED |
| M-1 | MEDIUM | No `.catch()` on INIT_WASM promise chains in workers | FIXED |
| M-2 | MEDIUM | Missing payload validation for INIT_WASM in workers | FIXED |
| M-3 | MEDIUM | Type guards don't include INIT_WASM; misleading exhaustiveness comments | FIXED |
| M-4 | MEDIUM | `initPromise` not cleared on rejection (prevents retry) | FIXED |
| L-1 | LOW | `console.log` in handleStageChange (production noise) | DEFERRED |

**Verification:** 4005 unit tests pass, TypeScript clean after all fixes.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- Story created by BMAD create-story workflow
- All 4 research agents completed: epics, architecture, codebase analysis, previous story analysis
- Comprehensive gap analysis: identified 7 hardcoded path locations across 5 files
- Worker INIT_WASM protocol designed to avoid cross-thread module import issues
- Placeholder config pattern with `ready: boolean` flag for future stages
- Zero-regression requirement: Micro4 must work identically after refactoring
- Story 11.1 learnings incorporated: DRY, handler binding, testing patterns

### Change Log

- 2026-02-06: Story 11.2 context engine complete - comprehensive developer guide created
- 2026-02-06: Implementation complete - all 7 tasks done, 4005 unit tests pass, 315 E2E tests pass, TypeScript clean
- 2026-02-06: Code review complete - 1 HIGH, 4 MEDIUM issues found and fixed:
  - H-1: Added `instructionCount` to `StageInfo` interface (AC #1 compliance)
  - M-1: Added `.catch()` to INIT_WASM promise chains in both workers
  - M-2: Added payload validation for INIT_WASM in both workers
  - M-3: Fixed type guards (`isEmulatorCommand`, `isAssemblerCommand`) to include INIT_WASM
  - M-4: Clear `initPromise` on rejection in both bridges for retry support

### File List

**New files:**
- `src/config/stageConfig.ts` - Central stage configuration registry with typed interfaces
- `src/config/stageConfig.test.ts` - 19 unit tests for stageConfig module

**Modified files:**
- `src/ui/StageSelector.ts` - Added `instructionCount` to `StageInfo` interface and all `STAGE_METADATA` entries (review fix H-1)
- `src/emulator/types.ts` - Added `InitWasmCommand`, `InitAssemblerWasmCommand` types
- `src/emulator/emulator.worker.ts` - INIT_WASM handler with payload validation and `.catch()`, updated `isEmulatorCommand` type guard
- `src/emulator/assembler.worker.ts` - INIT_WASM handler with payload validation and `.catch()`, updated `isAssemblerCommand` type guard
- `src/emulator/EmulatorBridge.ts` - Accepts `stage` parameter, sends INIT_WASM, clears `initPromise` on rejection
- `src/emulator/AssemblerBridge.ts` - Accepts `stage` parameter, sends INIT_WASM, clears `initPromise` on rejection
- `src/examples/ExampleLoader.ts` - Parameterized `programsPath` argument
- `src/examples/types.ts` - Added optional `stage?: string` field to `ExampleProgram`
- `src/examples/exampleMetadata.ts` - Added `stage: 'micro4'` to all 12 entries
- `src/ui/App.ts` - Config-driven paths for circuit, HDL, programs, WASM; stage logging in handleStageChange
