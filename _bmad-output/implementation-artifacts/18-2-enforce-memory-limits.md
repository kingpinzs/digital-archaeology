# Story 18.2: Enforce Memory Limits

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want memory limits enforced,
so that I experience authentic constraints.

## Acceptance Criteria

1. **Given** I am using a stage **When** I exceed memory limits **Then** assembly fails with constraint error
2. **Given** assembly fails with constraint error **When** I view the error **Then** the error explains the limit
3. **Given** assembly fails with constraint error **When** I view the error **Then** the error suggests solutions
4. **Given** assembly fails with constraint error **When** I view the error **Then** the error mentions advancing to next stage

## Tasks / Subtasks

- [x] Task 1: Add memory limit validation to AssemblerBridge (AC: #1)
  - [x] 1.1: After `ASSEMBLE_SUCCESS` in `AssemblerBridge.assemble()`, check `binary.length > getStageMemorySize(currentStage)`
  - [x] 1.2: When limit exceeded, return `AssembleResult` with `success: false` and a `CONSTRAINT_ERROR` type `AssemblerError`
  - [x] 1.3: Store the `currentStage` in AssemblerBridge (set during `init()` / `reinit()`) so `assemble()` can access it — NOTE: `this.stage` field already existed
- [x] Task 2: Create constraint error message builder (AC: #2, #3, #4)
  - [x] 2.1: Create `buildMemoryConstraintError(binarySize, memoryLimit, stageName, nextStageName): AssemblerError` in AssemblerBridge.ts
  - [x] 2.2: Error message format: `"Program size ({binarySize} bytes) exceeds {stageName} memory limit ({memoryLimit} bytes)"`
  - [x] 2.3: Suggestion format: `"Reduce program size to fit in {memoryLimit} bytes, or advance to {nextStageName} ({nextMemoryLimit} memory)"`
  - [x] 2.4: Set `type: 'CONSTRAINT_ERROR'`, `fixable: false`, `line: 0` (program-level error, not line-specific)
- [x] Task 3: Add next-stage lookup helper (AC: #4)
  - [x] 3.1: Create `getNextStage(stage: LabStage): LabStage | null` in stageConfig.ts — returns the next stage in LAB_STAGES order, or null for last stage
  - [x] 3.2: Export function from stageConfig.ts
  - [x] 3.3: Use in error message to reference next stage's label and memory size
- [x] Task 4: Write comprehensive tests (AC: #1, #2, #3, #4)
  - [x] 4.1: Test AssemblerBridge rejects binary that exceeds stage memory limit
  - [x] 4.2: Test AssemblerBridge accepts binary that fits within memory limit
  - [x] 4.3: Test AssemblerBridge accepts binary at exact memory limit boundary
  - [x] 4.4: Test error message contains program size and memory limit
  - [x] 4.5: Test error suggestion mentions next stage name and memory size
  - [x] 4.6: Test error type is CONSTRAINT_ERROR
  - [x] 4.7: Test error.fixable is false (can't auto-fix memory overflow)
  - [x] 4.8: Test getNextStage() returns correct next stage for each stage
  - [x] 4.9: Test getNextStage() returns null for last stage (micro32s)
  - [x] 4.10: Test memory limit enforcement works for each active stage (micro4, micro8)

## Dev Notes

### Architecture Context

**This story adds enforcement logic** that intercepts successful WASM assembly results and validates the binary size against the stage's memory constraint. It bridges Story 18.1 (constraint data) with the existing assembly pipeline.

**The enforcement point is in `AssemblerBridge.assemble()`**, not in the WASM assembler itself. The C assemblers don't know about stage constraints — they assemble valid syntax into binary. The TypeScript bridge layer applies the constraint check *after* successful assembly, before returning the result to the UI.

**Why not enforce in the C assembler?** The C assemblers (micro4/assembler.c, micro8/assembler.c) are compiled to WASM and are shared across the web and native builds. Adding constraint logic there would couple them to the web app's stage system. The bridge is the right abstraction layer.

### Assembly Flow — Where Enforcement Fits

```
User clicks Assemble
  → App.ts handleAssemble() line 3416
    → AssemblerBridge.assemble(source) line 255
      → Worker: WASM assembler runs
      → Worker: Returns ASSEMBLE_SUCCESS with binary
      → Bridge: Receives binary (line 281-287)
      → ★ NEW: Check binary.length vs getStageMemorySize(currentStage) ★
      → Bridge: If over limit → return CONSTRAINT_ERROR result
      → Bridge: If within limit → return success result (existing behavior)
    → App.ts: result.success === false → error branch (line 3468)
      → ErrorPanel.setErrors() (line 3482) — displays CONSTRAINT badge
      → StatusBar shows error message (line 3473-3476)
```

### Key Implementation Details

**1. AssemblerBridge needs `currentStage`:**
The bridge already imports `getStageConfig` and receives `stage` in `init(stage)` and `reinit(stage)`. It needs to store `this.currentStage` as a class field so `assemble()` can access it.

Check `init()` at line 167 and `reinit()` at line 346 — both receive a `stage: LabStage` parameter. Add:
```typescript
private currentStage: LabStage | null = null;
```
Set it in `init()` and `reinit()`.

**2. Enforcement code in `assemble()` — lines 281-287:**
After the `ASSEMBLE_SUCCESS` handler creates the `Uint8Array`, insert the check:
```typescript
if (data.type === 'ASSEMBLE_SUCCESS') {
  cleanup();
  const binary = new Uint8Array(data.payload.binary);

  // ★ Story 18.2: Enforce memory limit
  if (this.currentStage) {
    const memoryLimit = getStageMemorySize(this.currentStage);
    if (binary.length > memoryLimit) {
      resolve(buildMemoryConstraintError(binary.length, memoryLimit, this.currentStage));
      return;
    }
  }

  resolve({ success: true, binary, error: null });
}
```

**3. Error message builder function:**
Create a pure function (not a class method) in AssemblerBridge.ts:
```typescript
function buildMemoryConstraintError(
  binarySize: number,
  memoryLimit: number,
  stage: LabStage,
): AssembleResult {
  const config = getStageConfig(stage);
  const nextStage = getNextStage(stage);
  const nextConfig = nextStage ? getStageConfig(nextStage) : null;

  let suggestion = `Reduce program size to fit in ${memoryLimit} bytes`;
  if (nextConfig) {
    suggestion += `, or advance to ${nextConfig.meta.label} (${nextConfig.meta.addressSpace} memory)`;
  }

  return {
    success: false,
    binary: null,
    error: {
      line: 0,
      message: `Program size (${binarySize} bytes) exceeds ${config.meta.label} memory limit (${memoryLimit} bytes)`,
      type: 'CONSTRAINT_ERROR',
      suggestion,
      fixable: false,
    },
  };
}
```

**4. getNextStage() helper in stageConfig.ts:**
```typescript
export function getNextStage(stage: LabStage): LabStage | null {
  const index = LAB_STAGES.indexOf(stage);
  if (index === -1 || index === LAB_STAGES.length - 1) return null;
  return LAB_STAGES[index + 1];
}
```

### ErrorPanel Already Handles CONSTRAINT_ERROR

The `ErrorPanel.ts` already renders `CONSTRAINT_ERROR` type badges (line 343-364 in ErrorPanel.ts). The `suggestion` field is rendered as a "Did you mean:" hint (lines 439-452). So the error will display correctly with zero changes to ErrorPanel.

### What About line: 0 (Program-Level Error)?

Memory overflow is a whole-program error, not tied to a specific line. Setting `line: 0` means:
- ErrorPanel will show `"Line 0"` or skip the line indicator
- Editor decoration won't highlight a specific line
- This is correct behavior — the program as a whole is too large

**Check ErrorPanel rendering for `line: 0`:** If it shows "Line 0" visually, that's fine for now. Story 18.4 will refine the educational error messages.

### Existing Test Patterns (AssemblerBridge.test.ts)

The test file uses `vi.fn()` to mock the Worker and simulates message events. Pattern:
```typescript
const bridge = new AssemblerBridge();
const initPromise = bridge.init();
// Simulate WORKER_READY
const worker = (bridge as any).worker;
worker.simulateMessage({ type: 'WORKER_READY' });
await initPromise;
// Now test assemble()
const assemblePromise = bridge.assemble(source);
worker.simulateMessage({ type: 'ASSEMBLE_SUCCESS', payload: { binary: [...] } });
const result = await assemblePromise;
```

The tests mock `getStageConfig` via `vi.mock('../config/stageConfig')`. Follow this pattern.

### Stage Progression Order

`LAB_STAGES` is: `['micro4', 'micro8', 'micro16', 'micro32', 'micro32p', 'micro32s']`

Next-stage mapping:
- micro4 → micro8 (256B → 64KB)
- micro8 → micro16 (64KB → 1MB)
- micro16 → micro32 (1MB → 4GB)
- micro32 → micro32p (same memory)
- micro32p → micro32s (same memory)
- micro32s → null (last stage)

### Anti-Patterns to AVOID

- **DO NOT** modify the C assemblers (src/micro4/assembler.c, etc.) — enforcement is in the TS bridge
- **DO NOT** modify the worker (assembler.worker.ts) — enforcement is in the bridge, not the worker
- **DO NOT** create educational error messages with historical context — that's Story 18.4
- **DO NOT** add experimentation mode bypass — that's Story 18.5
- **DO NOT** modify ErrorPanel — it already handles CONSTRAINT_ERROR type
- **DO NOT** modify App.ts handleAssemble() — the error flows through the existing error branch automatically
- **DO NOT** enforce instruction set limits — that's Story 18.3
- **DO NOT** create a separate file for the enforcement — add to existing AssemblerBridge.ts
- **DO NOT** use default exports — named exports only (project convention)

### Boundary Conditions to Handle

1. **Binary exactly at limit:** `binary.length === memoryLimit` → PASS (allow it)
2. **Binary one byte over:** `binary.length === memoryLimit + 1` → FAIL with CONSTRAINT_ERROR
3. **Empty binary (0 bytes):** → PASS (trivially within limit)
4. **Stage with no WASM (micro16+):** Bridge won't have a current stage with ready WASM, so enforcement won't trigger. This is fine — enforcement only matters for stages that can actually assemble.
5. **currentStage is null:** Edge case if assemble() called before init(). Already throws "not initialized" error.

### Project Structure Notes

- MODIFIED: `digital-archaeology-web/src/emulator/AssemblerBridge.ts` (~30 lines: stage field, enforcement check, error builder)
- MODIFIED: `digital-archaeology-web/src/emulator/AssemblerBridge.test.ts` (~60 lines: enforcement tests)
- MODIFIED: `digital-archaeology-web/src/config/stageConfig.ts` (~5 lines: getNextStage function)
- MODIFIED: `digital-archaeology-web/src/config/stageConfig.test.ts` (~10 lines: getNextStage tests)

### Naming Conventions

- Function: `buildMemoryConstraintError(binarySize, memoryLimit, stage)` (camelCase, private to module)
- Function: `getNextStage(stage)` (camelCase, exported, follows `getStageConfig()` pattern)
- Field: `private currentStage: LabStage | null` (camelCase, private class field)

### Testing Requirements

- **Framework:** Vitest with jsdom environment
- **Pattern:** RED-GREEN — write tests first, then implement
- **Coverage:** Add to existing `AssemblerBridge.test.ts` and `stageConfig.test.ts`
- **Minimum:** 10+ tests covering each AC
- **Zero regressions:** All existing 4404 tests must continue passing
- **Mock pattern:** Follow existing Worker mock pattern in AssemblerBridge.test.ts

### Previous Story Intelligence (18-1 Define Stage Constraints)

**Patterns established that MUST be followed:**
1. Named exports only (no default exports)
2. Add to existing files rather than creating new ones
3. `readonly` on interface fields for immutable config
4. Comprehensive test coverage with explicit numeric assertions
5. Follow `getStageConfig()` / `getStageConstraints()` naming pattern
6. Reference C headers in JSDoc comments for authoritative values
7. Use `MICRO32_CONSTRAINTS` shared constant (don't duplicate)

**Code review lessons from 18-1:**
- Add `readonly` to any new interfaces (1H finding)
- Don't duplicate data — share constants (2M finding)
- Migrate hardcoded values to constraint accessors (3M finding)
- Assert exact values in tests, not just truthiness (4L finding)

### Git Intelligence

**Commit pattern:** `feat: implement Story 18-2 Enforce Memory Limits with code review fixes`
**Files per story:** Usually component + test + config + sprint-status.yaml
**Recent test count:** 4404 (growing by ~10-50 per story)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-18, Story 18.2]
- [Source: _bmad-output/planning-artifacts/architecture.md#Format-Patterns, CONSTRAINT_ERROR type]
- [Source: digital-archaeology-web/src/emulator/AssemblerBridge.ts — assembly flow, error detection, init/reinit]
- [Source: digital-archaeology-web/src/emulator/AssemblerBridge.test.ts — Worker mock patterns]
- [Source: digital-archaeology-web/src/emulator/types.ts — AssemblerErrorType, AssembleResult, AssemblerError]
- [Source: digital-archaeology-web/src/ui/ErrorPanel.ts — CONSTRAINT_ERROR badge rendering, suggestion display]
- [Source: digital-archaeology-web/src/ui/App.ts:3415-3514 — handleAssemble() flow]
- [Source: digital-archaeology-web/src/config/stageConfig.ts — getStageMemorySize(), getStageConfig(), LAB_STAGES]
- [Source: _bmad-output/implementation-artifacts/18-1-define-stage-constraints.md — Previous story patterns and review lessons]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — clean implementation, no debugging required.

### Completion Notes List

- Task 1.3: `this.stage` field already existed in AssemblerBridge (set in `init()`), no need to add `currentStage`
- RED-GREEN-REFACTOR: Task 3 implemented first (dependency for Tasks 1-2), then Tasks 1-2 together, then Task 4
- Tests grew from 4404 → 4422 (+18: 7 getNextStage + 11 enforcement)
- TypeScript clean (only pre-existing Editor.test.ts error)
- Zero regressions across full test suite

### File List

- MODIFIED: `digital-archaeology-web/src/config/stageConfig.ts` — Added `getNextStage()` function (~5 lines)
- MODIFIED: `digital-archaeology-web/src/config/stageConfig.test.ts` — Added 7 getNextStage tests
- MODIFIED: `digital-archaeology-web/src/emulator/AssemblerBridge.ts` — Added imports (`getStageMemorySize`, `getNextStage`), `buildMemoryConstraintError()` function (~30 lines), enforcement check in `assemble()` (~7 lines)
- MODIFIED: `digital-archaeology-web/src/emulator/AssemblerBridge.test.ts` — Added 11 memory enforcement tests
