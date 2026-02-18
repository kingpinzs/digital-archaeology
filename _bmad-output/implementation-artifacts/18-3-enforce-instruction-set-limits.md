# Story 18.3: Enforce Instruction Set Limits

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want only available instructions usable,
so that I discover why new instructions are needed.

## Acceptance Criteria

1. **Given** I am in an earlier stage **When** I try to use an instruction from a later stage **Then** assembly fails
2. **Given** assembly fails due to instruction set constraint **When** I view the error **Then** the error explains the instruction doesn't exist in this stage
3. **Given** assembly fails due to instruction set constraint **When** I view the error **Then** I'm prompted to "discover" or advance to the stage where the instruction becomes available

## Tasks / Subtasks

- [x] Task 1: Build instruction metadata registry in stageConfig.ts (AC: #1, #2, #3)
  - [x] 1.1: Define `STAGE_INSTRUCTIONS` constant mapping each `LabStage` to its set of valid instruction mnemonics (uppercase), derived from C assembler source code (`src/micro4/assembler.c`, `src/micro8/assembler.c`, `src/micro16/assembler.c`)
  - [x] 1.2: Micro4 mnemonics: Extract all 16 instruction names from `parse_instruction()` in `src/micro4/assembler.c` (LDA, STA, ADD, SUB, AND, OR, XOR, NOT, SHL, SHR, INC, DEC, JMP, JZ, LDI, HLT)
  - [x] 1.3: Micro8 mnemonics: Extract all 68 instruction names from `find_instruction()` lookup table in `src/micro8/assembler.c`
  - [x] 1.4: Micro16 mnemonics: Extract all 99 instruction names from `find_instruction()` lookup table + special-case parsing in `src/micro16/assembler.c`
  - [x] 1.5: Micro32/32-P/32-S: Use Micro16 set as base (Micro32 ISA not yet defined — Epic 14). Mark as placeholder with JSDoc comment
  - [x] 1.6: Create `getStageInstructions(stage: LabStage): ReadonlySet<string>` — returns Set of uppercase mnemonics available in stage
  - [x] 1.7: Create `isInstructionAvailable(stage: LabStage, mnemonic: string): boolean` — case-insensitive check
  - [x] 1.8: Create `findEarliestStageForInstruction(mnemonic: string): LabStage | null` — returns first stage where instruction appears, or null if truly unknown
- [x] Task 2: Enhance error detection in AssemblerBridge.ts (AC: #1, #2, #3)
  - [x] 2.1: Create `extractUnknownInstruction(errorMessage: string): string | null` — parses "Unknown instruction: MNEMONIC" pattern from C assembler error messages (also handles "Unknown instruction after REP/REPZ/REPNZ: MNEMONIC" variant from Micro16)
  - [x] 2.2: In the `ASSEMBLE_ERROR` handler, extract mnemonic and call `findEarliestStageForInstruction()`. If found in a later stage (by LAB_STAGES index comparison), short-circuit to `buildInstructionSetError()` returning `'CONSTRAINT_ERROR'`
  - [x] 2.3: Create `buildInstructionSetError(mnemonic: string, line: number, stage: LabStage, source: string): AssembleResult` — mirrors `buildMemoryConstraintError()` pattern. Message explains instruction doesn't exist in this stage; suggestion names the stage where it becomes available
  - [x] 2.4: In the `ASSEMBLE_ERROR` handler, before existing `detectErrorType()` call: check for unknown instruction pattern, extract mnemonic, compare earliest stage index with current stage index, short-circuit to CONSTRAINT_ERROR if instruction exists in a later stage
- [x] Task 3: Write comprehensive tests for stageConfig.ts additions (AC: #1)
  - [x] 3.1: Test `getStageInstructions('micro4')` returns exactly 16 instructions
  - [x] 3.2: Test `getStageInstructions('micro8')` returns exactly 68 instructions (from C source)
  - [x] 3.3: Test `getStageInstructions('micro16')` returns more instructions than micro8
  - [x] 3.4: Test `isInstructionAvailable('micro4', 'LDA')` returns true
  - [x] 3.5: Test `isInstructionAvailable('micro4', 'PUSH')` returns false
  - [x] 3.6: Test `isInstructionAvailable('micro8', 'PUSH')` returns true
  - [x] 3.7: Test `isInstructionAvailable('micro8', 'MUL')` returns false
  - [x] 3.8: Test `isInstructionAvailable('micro16', 'MUL')` returns true
  - [x] 3.9: Test case insensitivity: `isInstructionAvailable('micro4', 'lda')` returns true
  - [x] 3.10: Test `findEarliestStageForInstruction('PUSH')` returns `'micro8'`
  - [x] 3.11: Test `findEarliestStageForInstruction('MUL')` returns `'micro16'`
  - [x] 3.12: Test `findEarliestStageForInstruction('LDA')` returns `'micro4'`
  - [x] 3.13: Test `findEarliestStageForInstruction('TOTALLYINVALID')` returns null
  - [x] 3.14: Test non-cumulative ISAs — LDA exists in micro4 but NOT micro8 (replaces incorrect superset assumption)
  - [x] 3.15: Test micro32/32p/32s share same instruction set as micro16 (placeholder equality)
- [x] Task 4: Write comprehensive tests for AssemblerBridge.ts enforcement (AC: #1, #2, #3)
  - [x] 4.1: Test `extractUnknownInstruction('Unknown instruction: PUSH')` returns `'PUSH'`
  - [x] 4.2: Test `extractUnknownInstruction('Unknown instruction after REP: MOVSB')` returns `'MOVSB'`
  - [x] 4.3: Test `extractUnknownInstruction('Undefined label: foo')` returns null
  - [x] 4.4: Test: When Micro4 assembler returns "Unknown instruction: PUSH" and PUSH exists in Micro8, bridge returns CONSTRAINT_ERROR (not SYNTAX_ERROR)
  - [x] 4.5: Test: When Micro4 assembler returns "Unknown instruction: XYZZY" and XYZZY doesn't exist in any stage, bridge returns SYNTAX_ERROR (unchanged behavior)
  - [x] 4.6: Test: CONSTRAINT_ERROR message explains PUSH is not available in Micro4
  - [x] 4.7: Test: CONSTRAINT_ERROR suggestion mentions Micro8 as the stage where PUSH becomes available
  - [x] 4.8: Test: Error line number is preserved from original C assembler error
  - [x] 4.9: Test: Code snippet is generated for the error line
  - [x] 4.10: Test: error.fixable is false (can't auto-fix instruction unavailability)

## Dev Notes

### Architecture Context

**This story adds instruction-set-aware error detection** that intercepts C assembler "Unknown instruction" errors and determines whether the instruction exists in a *later* stage. If so, the error is upgraded from `SYNTAX_ERROR` to `CONSTRAINT_ERROR` with educational guidance about which stage introduces the instruction.

**The enforcement point is in `AssemblerBridge.ts`**, specifically in the `ASSEMBLE_ERROR` handler (~line 340). Unlike Story 18-2 (which intercepted `ASSEMBLE_SUCCESS`), this story intercepts `ASSEMBLE_ERROR` — the C assembler *already rejects* unknown instructions. Our job is to **enhance** the error message when the instruction is valid in a later stage.

**Why not enforce before assembly?** The C assemblers handle instruction parsing natively. Pre-filtering would require duplicating the assembler's mnemonic parsing in TypeScript. Instead, we let the C assembler reject the instruction, then check if it's a stage constraint issue.

### Assembly Error Flow — Where Enforcement Fits

```
User clicks Assemble
  → App.ts handleAssemble()
    → AssemblerBridge.assemble(source)
      → Worker: WASM assembler runs
      → Worker: Returns ASSEMBLE_ERROR with {message: "Unknown instruction: PUSH", line: 5}
      → Bridge: Receives error (line ~340)
      → Bridge: detectErrorType(message) called
      → ★ NEW: If "Unknown instruction" pattern detected:
        → Extract mnemonic ("PUSH")
        → findEarliestStageForInstruction("PUSH") → "micro8"
        → If found in later stage: return CONSTRAINT_ERROR
        → If not found in ANY stage: return SYNTAX_ERROR (existing behavior)
      → Bridge: buildInstructionSetError() creates enhanced error
      → Bridge: Returns AssembleResult with CONSTRAINT_ERROR
    → App.ts: result.success === false → error branch
      → ErrorPanel displays CONSTRAINT badge + educational suggestion
```

### Key Implementation Details

**1. Instruction Metadata Registry (`stageConfig.ts`):**

The metadata must be derived from the C assembler source code. Each C assembler defines its instructions via lookup tables or if-else chains:
- `src/micro4/assembler.c` — `parse_instruction()` function uses if-else chain for 16 mnemonics
- `src/micro8/assembler.c` — `find_instruction()` uses `instruction_t instructions[]` lookup table with ~80 entries
- `src/micro16/assembler.c` — `find_instruction()` uses `instruction_t instructions[]` lookup table with ~100 entries

**CRITICAL:** The TypeScript metadata MUST exactly match what the C assembler accepts. Any mismatch will cause false positives or false negatives. Derive the lists directly from the C source, and add JSDoc comments referencing the C source files.

```typescript
/** Instruction mnemonics per stage, derived from C assembler source code */
const STAGE_INSTRUCTIONS: Record<LabStage, readonly string[]> = {
  micro4: [
    // Source: src/micro4/assembler.c, parse_instruction()
    'LDA', 'STA', 'ADD', 'SUB', 'AND', 'OR', 'XOR', 'NOT',
    'SHL', 'SHR', 'INC', 'DEC', 'JMP', 'JZ', 'LDI', 'HLT',
  ],
  micro8: [
    // Source: src/micro8/assembler.c, instructions[] table
    // All micro4 instructions plus stack, subroutine, interrupt, I/O, comparison
    ...MICRO4_INSTRUCTIONS,
    'MOV', 'LD', 'ST', 'LDI', 'PUSH', 'POP',
    'CALL', 'RET', 'RETI', 'INT',
    'CMP', 'JNZ', 'JC', 'JNC', 'JN', 'JP',
    'IN', 'OUT', 'CLI', 'STI',
    // ... (full list from C source)
  ],
  // ... etc
};
```

**2. Case-Insensitive Matching:**

C assemblers use `strcasecmp()` for instruction matching. The TypeScript metadata stores uppercase mnemonics. `isInstructionAvailable()` must normalize input to uppercase before lookup.

**3. Extracting Mnemonic from Error Message:**

C assembler error format: `"Unknown instruction: MNEMONIC"`
Micro16 variant: `"Unknown instruction after REP: MNEMONIC"`

```typescript
function extractUnknownInstruction(message: string): string | null {
  const match = message.match(/Unknown instruction(?:\s+after\s+\w+)?:\s*(\S+)/i);
  return match ? match[1].toUpperCase() : null;
}
```

**4. Enhanced `detectErrorType()` Logic:**

```typescript
function detectErrorType(message: string): AssemblerErrorType {
  const lowerMessage = message.toLowerCase();

  // Check for instruction set constraint BEFORE falling through to SYNTAX_ERROR
  if (lowerMessage.includes('unknown instruction')) {
    const mnemonic = extractUnknownInstruction(message);
    if (mnemonic) {
      const earliestStage = findEarliestStageForInstruction(mnemonic);
      if (earliestStage !== null) {
        // Instruction exists in a later stage — this is a constraint, not syntax error
        return 'CONSTRAINT_ERROR';
      }
    }
    // Truly unknown instruction — remain as SYNTAX_ERROR
    return 'SYNTAX_ERROR';
  }
  // ... rest of existing detection logic
}
```

**IMPORTANT:** `detectErrorType()` does NOT have access to `this.stage` (it's a standalone function). The function needs the current stage passed as a parameter, OR the check must be: "does the instruction exist in ANY stage?" If yes, it's a CONSTRAINT_ERROR; if no, it's SYNTAX_ERROR. The caller (in `assemble()`) already knows the current stage and can determine whether the earliest stage is *after* the current one.

**Actually, the simpler approach:** `detectErrorType()` should return `CONSTRAINT_ERROR` only if the instruction exists in *some* stage. The `assemble()` handler can then determine which stage. But wait — if the user is on Micro8 and uses a Micro8 instruction, the assembler won't error. So if we get "Unknown instruction: X" on Micro4, and X exists in Micro8, it's always a constraint issue (since the user is necessarily on an earlier stage).

**Refined approach:** In `detectErrorType()`, if "unknown instruction" AND `findEarliestStageForInstruction()` returns non-null, return `CONSTRAINT_ERROR`. If null, return `SYNTAX_ERROR`. The current stage parameter is not needed in `detectErrorType()` because if an instruction exists in any stage and the assembler rejected it, the current stage must be earlier.

**5. `buildInstructionSetError()` Function:**

```typescript
function buildInstructionSetError(
  mnemonic: string,
  line: number,
  stage: LabStage,
  source: string,
): AssembleResult {
  const config = getStageConfig(stage);
  const earliestStage = findEarliestStageForInstruction(mnemonic);
  const earliestConfig = earliestStage ? getStageConfig(earliestStage) : null;

  let suggestion = `The ${mnemonic} instruction is not available in ${config.meta.label}`;
  if (earliestConfig) {
    suggestion += `. It becomes available in ${earliestConfig.meta.label}`;
  }

  return {
    success: false,
    binary: null,
    error: {
      line,
      message: `Instruction "${mnemonic}" does not exist in ${config.meta.label} (${config.constraints.instructionSet.opcodeCount} instructions available)`,
      type: 'CONSTRAINT_ERROR',
      suggestion,
      fixable: false,
      codeSnippet: generateCodeSnippet(source, line),
    },
  };
}
```

### ErrorPanel Already Handles CONSTRAINT_ERROR

The `ErrorPanel.ts` renders `CONSTRAINT_ERROR` type badges (established in Story 18-1/18-2). The `suggestion` field renders as a hint. No changes needed to ErrorPanel.

### Micro4 Instruction Set (16 instructions)

From `src/micro4/assembler.c`, `parse_instruction()`:
```
LDA  - Load accumulator from memory
STA  - Store accumulator to memory
ADD  - Add memory to accumulator
SUB  - Subtract memory from accumulator
AND  - Bitwise AND
OR   - Bitwise OR
XOR  - Bitwise XOR
NOT  - Bitwise NOT
SHL  - Shift left
SHR  - Shift right
INC  - Increment accumulator
DEC  - Decrement accumulator
JMP  - Unconditional jump
JZ   - Jump if zero
LDI  - Load immediate
HLT  - Halt
```

### Micro8 New Instructions (added beyond Micro4)

From `src/micro8/assembler.c`, `instructions[]` table. Key additions by category:
- **Data transfer:** MOV, LD, ST, LDI (reg), LDZ
- **Stack:** PUSH, POP
- **Subroutine:** CALL, RET, RETI
- **Comparison:** CMP
- **Extended jumps:** JNZ, JC, JNC, JN, JP, JS, JNS, JO, JNO
- **I/O:** IN, OUT
- **Interrupt:** INT, CLI, STI
- **Arithmetic extensions:** ADC, SBC, NEG

*(Developer must extract the COMPLETE list from the C source during implementation)*

### Micro16 New Instructions (added beyond Micro8)

From `src/micro16/assembler.c`, `instructions[]` table. Key additions:
- **Multiply/Divide:** MUL, IMUL, DIV, IDIV
- **Segment:** SEG (prefix)
- **String:** REP, REPZ, REPNZ (prefixes), MOVSB, CMPSB, etc.
- **Extended addressing modes** (same instructions, wider operands)

*(Developer must extract the COMPLETE list from the C source during implementation)*

### Existing Test Patterns

**AssemblerBridge.test.ts:** Uses `vi.fn()` to mock Worker. Pattern:
```typescript
const bridge = new AssemblerBridge();
const initPromise = bridge.init('micro4'); // stage parameter
worker.simulateMessage({ type: 'WORKER_READY' });
await initPromise;

// Simulate assembly error
const assemblePromise = bridge.assemble(source);
worker.simulateMessage({
  type: 'ASSEMBLE_ERROR',
  payload: { message: 'Unknown instruction: PUSH', line: 5 }
});
const result = await assemblePromise;
expect(result.success).toBe(false);
expect(result.error?.type).toBe('CONSTRAINT_ERROR');
```

**stageConfig.test.ts:** Direct function calls, no mocking needed:
```typescript
expect(isInstructionAvailable('micro4', 'LDA')).toBe(true);
expect(isInstructionAvailable('micro4', 'PUSH')).toBe(false);
expect(findEarliestStageForInstruction('PUSH')).toBe('micro8');
```

### Anti-Patterns to AVOID

- **DO NOT** modify the C assemblers (`src/micro4/assembler.c`, etc.) — enhancement is in the TS bridge
- **DO NOT** modify the worker (`assembler.worker.ts`) — enhancement is in the bridge
- **DO NOT** create educational error messages with historical context — that's Story 18.4
- **DO NOT** add experimentation mode bypass — that's Story 18.5
- **DO NOT** modify ErrorPanel — it already handles CONSTRAINT_ERROR type
- **DO NOT** pre-validate instructions before sending to WASM — let C assembler do the parsing
- **DO NOT** create a separate file for instruction metadata — add to existing `stageConfig.ts`
- **DO NOT** use default exports — named exports only (project convention)
- **DO NOT** hardcode instruction lists without JSDoc referencing C source files
- **DO NOT** attempt to parse the C assembler source at build time — manual extraction is fine, the instruction sets are stable
- **DO NOT** create `getAvailableInstructions()` returning `string[]` — return `ReadonlySet<string>` for O(1) lookup

### Boundary Conditions to Handle

1. **Instruction exists in current stage:** C assembler accepts it, no constraint check triggered (no error to intercept)
2. **Instruction exists in later stage:** C assembler rejects with "Unknown instruction: X", bridge detects X is in a later stage → CONSTRAINT_ERROR
3. **Instruction doesn't exist in any stage:** C assembler rejects with "Unknown instruction: X", bridge confirms X is truly unknown → SYNTAX_ERROR (existing behavior)
4. **Case insensitivity:** User types `push`, C assembler error says `Unknown instruction: push` → normalize to `PUSH` for lookup
5. **REP prefix variant (Micro16):** Error format `"Unknown instruction after REP: X"` → extract X, not REP
6. **Empty/whitespace mnemonic in error:** Return null from extractor, fall through to SYNTAX_ERROR
7. **Micro32/32-P/32-S (not yet implemented):** Use Micro16 instruction set as placeholder, with JSDoc noting this is provisional pending Epic 14
8. **Directive vs instruction:** Assembler directives (`.org`, `.db`, `.equ`) are NOT instructions — ensure they're not in the instruction metadata

### Project Structure Notes

- MODIFIED: `digital-archaeology-web/src/config/stageConfig.ts` (~80-100 lines: STAGE_INSTRUCTIONS constant, getStageInstructions(), isInstructionAvailable(), findEarliestStageForInstruction())
- MODIFIED: `digital-archaeology-web/src/config/stageConfig.test.ts` (~60 lines: instruction metadata tests)
- MODIFIED: `digital-archaeology-web/src/emulator/AssemblerBridge.ts` (~40 lines: extractUnknownInstruction(), enhanced detectErrorType(), buildInstructionSetError(), error handler enhancement)
- MODIFIED: `digital-archaeology-web/src/emulator/AssemblerBridge.test.ts` (~50 lines: instruction enforcement tests)

### Naming Conventions

- Constant: `STAGE_INSTRUCTIONS` (SCREAMING_SNAKE_CASE, module-private or exported)
- Function: `getStageInstructions(stage)` (camelCase, exported, follows `getStageConstraints()` pattern)
- Function: `isInstructionAvailable(stage, mnemonic)` (camelCase, exported)
- Function: `findEarliestStageForInstruction(mnemonic)` (camelCase, exported)
- Function: `extractUnknownInstruction(message)` (camelCase, module-private in AssemblerBridge.ts)
- Function: `buildInstructionSetError(mnemonic, line, stage, source)` (camelCase, module-private)

### Testing Requirements

- **Framework:** Vitest with jsdom environment
- **Pattern:** RED-GREEN — write tests first, then implement
- **Coverage:** Add to existing `stageConfig.test.ts` and `AssemblerBridge.test.ts`
- **Minimum:** 25+ tests covering each AC
- **Zero regressions:** All existing tests must continue passing (current count: ~4422+)
- **Mock pattern:** Follow existing Worker mock pattern in AssemblerBridge.test.ts
- **Instruction count verification:** Test exact counts match C assembler source

### Previous Story Intelligence (18-2 Enforce Memory Limits)

**Patterns established that MUST be followed:**
1. Named exports only (no default exports)
2. Add to existing files rather than creating new ones
3. `readonly` on interface fields and collection types
4. Mirror `buildMemoryConstraintError()` pattern for `buildInstructionSetError()`
5. Comprehensive test coverage with explicit assertions
6. Follow `getStageConfig()` / `getStageConstraints()` / `getStageMemorySize()` naming pattern
7. Reference C source files in JSDoc comments
8. Use `getNextStage()` for suggesting the next stage in error messages

**Code review lessons from 18-1 and 18-2:**
- Add `readonly` to any new types/interfaces (1H finding from 18-1)
- Don't duplicate data — share constants like `MICRO32_CONSTRAINTS` (2M finding from 18-1)
- Assert exact values in tests, not just truthiness (4L finding from 18-1)
- Error suggestion should name the specific stage where the capability appears
- Use `getStageConfig()` for display labels, not raw stage strings

### Git Intelligence

**Commit pattern:** `feat: implement Story 18-3 Enforce Instruction Set Limits with code review fixes`
**Files per story:** Usually component + test + config + sprint-status.yaml
**Recent test count:** 4422 (growing by ~10-50 per story)
**Previous story (18-2):** Added 18 tests. This story should add ~25+ tests.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-18, Story 18.3]
- [Source: _bmad-output/planning-artifacts/architecture.md#Format-Patterns, CONSTRAINT_ERROR type]
- [Source: digital-archaeology-web/src/emulator/AssemblerBridge.ts — assembly flow, error detection, buildMemoryConstraintError pattern]
- [Source: digital-archaeology-web/src/emulator/AssemblerBridge.test.ts — Worker mock patterns, enforcement test patterns]
- [Source: digital-archaeology-web/src/emulator/types.ts — AssemblerErrorType with CONSTRAINT_ERROR, AssembleResult, AssemblerError]
- [Source: digital-archaeology-web/src/config/stageConfig.ts — StageConstraints, InstructionCategory, getStageConstraints()]
- [Source: digital-archaeology-web/src/config/stageConfig.test.ts — existing constraint test patterns]
- [Source: digital-archaeology-web/src/ui/ErrorPanel.ts — CONSTRAINT_ERROR badge rendering, suggestion display]
- [Source: src/micro4/assembler.c — parse_instruction() with 16 mnemonics]
- [Source: src/micro8/assembler.c — instructions[] lookup table with ~80 mnemonics]
- [Source: src/micro16/assembler.c — instructions[] lookup table with ~100 mnemonics]
- [Source: _bmad-output/implementation-artifacts/18-1-define-stage-constraints.md — StageConstraints patterns, code review lessons]
- [Source: _bmad-output/implementation-artifacts/18-2-enforce-memory-limits.md — Memory enforcement patterns, buildMemoryConstraintError]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — clean implementation, no debugging required.

### Completion Notes List

- Task 1.3: Micro8 has 68 mnemonics (not ~80 as estimated in story — exact count from C source)
- Task 1.4: Micro16 has 99 mnemonics (58 lookup table + 41 special-case parsing)
- Task 2.2: Deviated from story's suggested approach of modifying `detectErrorType()`. Instead, added the constraint check directly in the ASSEMBLE_ERROR handler (before `detectErrorType()` call) because: (a) instruction sets are NOT cumulative supersets (LDA exists in micro4 but NOT micro8), so the current stage is needed for LAB_STAGES index comparison; (b) short-circuiting in the handler is cleaner and follows the Story 18-2 pattern
- Task 3.2: Updated test from "67" to "68" after verifying exact count from STAGE_INSTRUCTIONS data
- Task 3.14/3.15: Replaced incorrect superset assumption tests with: (3.14) non-cumulative ISA verification, (3.15) micro32/32p/32s placeholder equality test
- `extractUnknownInstruction()` exported for direct testing (other bridge helpers are module-private)
- Fixed pre-existing TS error in Story 18.2's `simulateSuccessWithSize` helper (missing `size` field in payload)
- Tests grew from 4422 → 4459 (+37: 19 stageConfig + 18 AssemblerBridge)
- TypeScript clean (only pre-existing Editor.test.ts error)
- Zero regressions across full test suite (4459 tests, 106 files)

#### Code Review Fixes (Opus 4.6 adversarial review)

- **[1M] JSDoc miscount**: Fixed stageConfig.ts JSDoc/comment saying "67 mnemonics" → "68 mnemonics" for micro8
- **[2M] Error message used opcodeCount**: Changed `buildInstructionSetError` to use `getStageInstructions(stage).size` (actual mnemonic count) instead of `config.constraints.instructionSet.opcodeCount` (opcode encoding count). Micro8 now correctly shows "68 instructions" not "80"
- **[3L] Missing micro16 exact count test**: Added `toBe(99)` assertion for micro16 instruction count
- **[4L] Redundant findEarliestStageForInstruction call**: Added `earliestStage: LabStage` parameter to `buildInstructionSetError()`, eliminating duplicate lookup
- **[5L] Weak placeholder equality test**: Strengthened to verify actual set content identity, not just `.size`
- **[6L] initBridge helper type restriction**: Widened from `'micro4' | 'micro8'` to `LabStage` (imported type)

### File List

- MODIFIED: `digital-archaeology-web/src/config/stageConfig.ts` — Added STAGE_INSTRUCTIONS constant (~80 lines), MICRO16_INSTRUCTIONS shared constant, cached stageInstructionSets Map, getStageInstructions(), isInstructionAvailable(), findEarliestStageForInstruction()
- MODIFIED: `digital-archaeology-web/src/config/stageConfig.test.ts` — Added 18 tests across 3 describe blocks (getStageInstructions, isInstructionAvailable, findEarliestStageForInstruction)
- MODIFIED: `digital-archaeology-web/src/emulator/AssemblerBridge.ts` — Added imports (findEarliestStageForInstruction, LAB_STAGES), extractUnknownInstruction() (~5 lines), buildInstructionSetError() (~25 lines), ASSEMBLE_ERROR handler enhancement (~8 lines)
- MODIFIED: `digital-archaeology-web/src/emulator/AssemblerBridge.test.ts` — Added 18 tests across 2 describe blocks (extractUnknownInstruction, instruction set enforcement), fixed pre-existing TS error in simulateSuccessWithSize
