# Story 18.4: Create Educational Error Messages

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want errors that teach,
so that limitations become learning moments.

## Acceptance Criteria

1. **Given** I hit a memory constraint **When** I view the error **Then** the error explains WHY the memory limit exists for this stage (historical/architectural context)
2. **Given** I hit an instruction set constraint **When** I view the error **Then** the error explains WHY that instruction isn't available in this stage
3. **Given** any constraint error **When** I view the error **Then** the error connects the limitation to the CPU evolution journey (teases what the next stage unlocks)
4. **Given** any constraint error **When** I view the error **Then** the educational context renders as a visually distinct element from the technical error message and suggestion

## Tasks / Subtasks

- [x] Task 1: Define educational content data model in stageConfig.ts (AC: #1, #2, #3)
  - [x] 1.1: Create `StageEducationalContent` interface with readonly fields: `memoryContext` (string — why memory limit exists), `instructionContext` (string — why instruction set is limited), `journeyTeaser` (string — what advancing to the next stage unlocks)
  - [x] 1.2: Define `STAGE_EDUCATIONAL_CONTENT` constant of type `Record<LabStage, StageEducationalContent>`
  - [x] 1.3: Micro4 content: 4-bit architecture, 8-bit address bus → 256 bytes. Mirrors the Intel 4004 (1971). Accumulator-only, 16 instructions. Journey teaser: Micro8 introduces general-purpose registers, stack, and 64 KB of memory
  - [x] 1.4: Micro8 content: 8-bit data path, 16-bit address bus → 64 KB. Comparable to the Zilog Z80 / Intel 8080 era (1974-1976). 8 registers, stack support, subroutine calls. Journey teaser: Micro16 adds hardware multiply, segmentation, and 1 MB of memory
  - [x] 1.5: Micro16 content: 16-bit data path, 20-bit address bus → 1 MB. Comparable to the Intel 8086 (1978). Segmented memory model, string operations, hardware multiply/divide. Journey teaser: Micro32 adds protected mode, paging, and 4 GB of memory
  - [x] 1.6: Micro32/32-P/32-S placeholder content with appropriate "this is the current frontier" messaging
  - [x] 1.7: Create `getStageEducationalContent(stage: LabStage): StageEducationalContent` function (exported, follows existing `getStageConstraints()` pattern)
  - [x] 1.8: Export `StageEducationalContent` type and `getStageEducationalContent` function from stageConfig.ts
- [x] Task 2: Add `educationalContext` field to AssemblerError type (AC: #4)
  - [x] 2.1: Add `educationalContext?: string` readonly field to `AssemblerError` interface in `types.ts`
  - [x] 2.2: Verify the addition is backwards-compatible (optional field, no existing code breaks)
- [x] Task 3: Populate educational context in constraint error builders (AC: #1, #2, #3)
  - [x] 3.1: Import `getStageEducationalContent` in `AssemblerBridge.ts`
  - [x] 3.2: In `buildMemoryConstraintError()`: set `educationalContext` to the stage's `memoryContext` + `journeyTeaser` (concatenated with a sentence separator)
  - [x] 3.3: In `buildInstructionSetError()`: set `educationalContext` to a composed message using the stage's `instructionContext` plus specific info about the unavailable instruction's category/purpose, plus `journeyTeaser`
- [x] Task 4: Render educational context in ErrorPanel (AC: #4)
  - [x] 4.1: Add `createEducationalContext(educationalContext: string): HTMLElement` method to ErrorPanel — follows `createSuggestion()` pattern
  - [x] 4.2: In `createErrorItem()`, after suggestion rendering: if `error.educationalContext` exists, call `createEducationalContext()` and append to error item
  - [x] 4.3: Use `textContent` for safe text insertion (no escapeHtml needed — `textContent` is inherently XSS-safe per project-context.md)
  - [x] 4.4: Apply CSS class `da-error-educational-context` for visual distinction from suggestion
- [x] Task 5: Add CSS styles for educational context (AC: #4)
  - [x] 5.1: Add `.da-error-educational-context` styles to `main.css` — visually distinct "learn more" callout (different background, border-left accent, italic or different font weight)
  - [x] 5.2: Ensure styles work in both story-mode and lab-mode themes (use CSS variables)
  - [x] 5.3: Add appropriate spacing/margin between suggestion and educational context
- [x] Task 6: Write comprehensive tests (AC: #1, #2, #3, #4)
  - [x] 6.1: Test `getStageEducationalContent('micro4')` returns non-empty memoryContext, instructionContext, journeyTeaser
  - [x] 6.2: Test `getStageEducationalContent('micro8')` returns non-empty content
  - [x] 6.3: Test `getStageEducationalContent('micro16')` returns non-empty content
  - [x] 6.4: Test all stages return valid content (iterate LAB_STAGES)
  - [x] 6.5: Test `buildMemoryConstraintError` includes educationalContext field
  - [x] 6.6: Test educationalContext for memory error contains stage's memoryContext content
  - [x] 6.7: Test educationalContext for memory error contains journeyTeaser content
  - [x] 6.8: Test `buildInstructionSetError` includes educationalContext field
  - [x] 6.9: Test educationalContext for instruction error contains stage's instructionContext content
  - [x] 6.10: Test ErrorPanel renders educational context element when present
  - [x] 6.11: Test ErrorPanel does NOT render educational context element when absent (backwards-compatible)
  - [x] 6.12: Test educational context element has `da-error-educational-context` CSS class
  - [x] 6.13: Test educational context text is safely rendered (not HTML-injected)
  - [x] 6.14: Test that existing error rendering is unchanged (no regressions in SYNTAX_ERROR, VALUE_ERROR display)

## Dev Notes

### Architecture Context

**This story adds educational/historical context to constraint error messages** established in Stories 18-2 (memory limits) and 18-3 (instruction set limits). The existing error infrastructure handles technical error details; this story enriches errors with pedagogical content explaining WHY constraints exist.

**The key insight:** CONSTRAINT_ERROR errors already have `message` (technical description) and `suggestion` (actionable advice). This story adds `educationalContext` — a third layer that provides historical and architectural reasoning. These three layers give the user progressively deeper understanding:

1. **Message** (technical): "Instruction PUSH does not exist in Micro4 (16 instructions available)"
2. **Suggestion** (actionable): "The PUSH instruction is not available in Micro4. It becomes available in Micro8"
3. **Educational context** (pedagogical): "Micro4 uses a simple accumulator architecture with just 16 instructions — similar to the Intel 4004 from 1971. Without a hardware stack, you must manually manage data. Micro8 introduces a stack pointer, PUSH/POP instructions, and subroutine support."

### Constraint Error Flow — Where Educational Context Fits

```
CONSTRAINT_ERROR already created by Stories 18-2/18-3
  → buildMemoryConstraintError() or buildInstructionSetError()
  → Returns AssembleResult with {error: {message, suggestion, type, ...}}
  → ★ NEW: Also includes {educationalContext: "Why this limit exists..."}
  → ErrorPanel.createErrorItem()
    → Renders type badge (existing)
    → Renders message (existing)
    → Renders code snippet (existing, if present)
    → Renders suggestion (existing)
    → ★ NEW: Renders educational context as distinct visual element
```

### Key Implementation Details

**1. Educational Content Data Model (`stageConfig.ts`):**

```typescript
export interface StageEducationalContent {
  /** Why the memory limit exists — architectural/historical reasoning */
  readonly memoryContext: string;
  /** Why the instruction set is limited — what's missing and why */
  readonly instructionContext: string;
  /** What advancing to the next stage unlocks — teaser for the learning journey */
  readonly journeyTeaser: string;
}
```

Content should be:
- **Concise** — 1-3 sentences per field (not paragraphs)
- **Historically grounded** — reference real CPU architectures (Intel 4004, Z80, 8086)
- **Pedagogically framed** — explain the engineering reason, not just the historical fact
- **Journey-oriented** — the teaser should create curiosity about the next stage

**Content sources for accuracy:**
- `docs/cpu_history_timeline.md` — Historical timeline of real CPUs
- `docs/micro4_minimal_architecture.md` — Micro4 architecture rationale
- `docs/micro8_isa.md` — Micro8 ISA design decisions
- `literature/01_binary_and_number_systems.md` through `literature/06_datapath.md` — Educational articles

**2. AssemblerError Enhancement (`types.ts`):**

```typescript
export interface AssemblerError {
  line: number;
  column?: number;
  message: string;
  suggestion?: string;
  type?: AssemblerErrorType;
  codeSnippet?: CodeSnippet;
  fixable?: boolean;
  /** Educational context explaining WHY this constraint exists (Story 18.4) */
  educationalContext?: string;
}
```

This is a backwards-compatible, optional field addition. Existing errors without educational context will render exactly as before.

**3. Populating Educational Context (`AssemblerBridge.ts`):**

In `buildMemoryConstraintError()`:
```typescript
const edu = getStageEducationalContent(stage);
// Combine memory context + journey teaser
const educationalContext = `${edu.memoryContext} ${edu.journeyTeaser}`;
```

In `buildInstructionSetError()`:
```typescript
const edu = getStageEducationalContent(stage);
// Combine instruction context + journey teaser
const educationalContext = `${edu.instructionContext} ${edu.journeyTeaser}`;
```

**4. ErrorPanel Rendering:**

Follow the `createSuggestion()` pattern:
```typescript
private createEducationalContext(text: string): HTMLElement {
  const el = document.createElement('div');
  el.className = 'da-error-educational-context';
  el.textContent = text;  // textContent is inherently XSS-safe
  return el;
}
```

In `createErrorItem()`, after existing suggestion rendering:
```typescript
if (error.educationalContext) {
  item.appendChild(this.createEducationalContext(error.educationalContext));
}
```

**5. CSS Styling (`main.css`):**

```css
.da-error-educational-context {
  margin-top: var(--da-spacing-sm);
  padding: var(--da-spacing-sm) var(--da-spacing-md);
  border-left: 3px solid var(--da-accent-info);
  background: var(--da-bg-secondary);
  font-style: italic;
  font-size: 0.9em;
  color: var(--da-text-secondary);
  line-height: 1.4;
}
```

### ErrorPanel Already Handles CONSTRAINT_ERROR

The `ErrorPanel.ts` renders CONSTRAINT_ERROR type badges (Story 18-1), suggestions (Story 18-2/18-3), and code snippets (Story 18-3). This story adds one new visual element beneath the suggestion.

### Existing Patterns to Follow

**From `createSuggestion()` (~line 439-452 in ErrorPanel.ts):**
- Creates an HTMLElement
- Applies a CSS class
- Sets content via `textContent` (XSS-safe)
- Returns element for appending

**From `buildMemoryConstraintError()` and `buildInstructionSetError()` in AssemblerBridge.ts:**
- Import helper functions from stageConfig.ts
- Look up stage-specific data
- Compose human-readable strings
- Set fields on the `AssembleResult.error` object

### Anti-Patterns to AVOID

- **DO NOT** modify the existing `message` or `suggestion` fields — those are correct and established by Stories 18-2/18-3
- **DO NOT** create a separate file for educational content — add to existing `stageConfig.ts`
- **DO NOT** use `innerHTML` for educational context rendering — use `textContent` (XSS-safe)
- **DO NOT** make educational content too long — 1-3 sentences per field, not essays
- **DO NOT** create educational content that is factually inaccurate — cross-reference with docs/
- **DO NOT** use default exports — named exports only (project convention)
- **DO NOT** add educational context to non-constraint errors (SYNTAX_ERROR, VALUE_ERROR) — this story is about constraint errors only
- **DO NOT** hardcode CSS colors — use CSS variables for theme compatibility
- **DO NOT** make the educational context collapsible/expandable — that's over-engineering for this story. Just render it.

### Boundary Conditions to Handle

1. **Non-constraint errors:** SYNTAX_ERROR and VALUE_ERROR should NOT have educationalContext — ErrorPanel must gracefully skip rendering when the field is undefined
2. **Last stage (micro32s):** journeyTeaser should say something like "You've reached the most advanced stage" rather than referencing a next stage that doesn't exist
3. **Placeholder stages (micro32+):** Educational content should acknowledge these are placeholders pending future development
4. **Empty source code:** Memory constraint errors (line: 0, no code snippet) should still include educational context
5. **Very long educational text:** CSS should handle text wrapping gracefully without breaking the error panel layout

### Micro4 Educational Content Reference

**Memory context:** Micro4 uses a 4-bit data bus and 8-bit address bus, limiting memory to 256 bytes. This mirrors early 4-bit processors like the Intel 4004 (1971), where every byte of memory was precious and programmers had to carefully optimize their code to fit.

**Instruction context:** Micro4 has only 16 instructions — one for each possible 4-bit opcode. This is the fundamental trade-off of a 4-bit instruction encoding: simplicity and small program size, but very limited capabilities. There are no registers beyond the accumulator, no stack, and no subroutine support.

**Journey teaser:** When you advance to Micro8, you'll gain 8 general-purpose registers, a hardware stack with PUSH/POP, subroutine support via CALL/RET, and 64 KB of memory — the capabilities that enabled real software development.

### Micro8 Educational Content Reference

**Memory context:** Micro8 uses an 8-bit data bus and 16-bit address bus, providing 64 KB of memory. This is the same address space as classic 8-bit processors like the Zilog Z80 (1976) and Intel 8080 (1974), which powered the first generation of personal computers.

**Instruction context:** Micro8 has 68 instructions across arithmetic, logic, data transfer, control flow, stack, subroutine, interrupt, and I/O categories. However, it lacks hardware multiply/divide, segmented memory, and string operations — all of which require wider data paths and more complex control logic.

**Journey teaser:** Micro16 introduces hardware multiply/divide, a segmented memory model reaching 1 MB, and string operations — the features that enabled the IBM PC revolution.

### Micro16 Educational Content Reference

**Memory context:** Micro16 uses a 16-bit data bus and 20-bit address bus, providing 1 MB of memory through segment:offset addressing. This matches the Intel 8086 (1978) architecture, where the famous "640 KB ought to be enough" limit came from the segmented memory model.

**Instruction context:** Micro16 has 99 instructions including hardware multiply/divide, string operations (MOVSB, CMPSB, etc. with REP prefix), and segmented memory access. It lacks protected mode, paging, and the flat 32-bit address space that would come with 32-bit processors.

**Journey teaser:** Micro32 introduces protected mode, virtual memory with paging, and a flat 4 GB address space — the architecture that powers modern computing.

### Project Structure Notes

- MODIFIED: `digital-archaeology-web/src/config/stageConfig.ts` (~40-50 lines: StageEducationalContent interface, STAGE_EDUCATIONAL_CONTENT constant, getStageEducationalContent())
- MODIFIED: `digital-archaeology-web/src/config/stageConfig.test.ts` (~20-30 lines: educational content tests)
- MODIFIED: `digital-archaeology-web/src/emulator/types.ts` (~2 lines: educationalContext field on AssemblerError)
- MODIFIED: `digital-archaeology-web/src/emulator/AssemblerBridge.ts` (~10-15 lines: import + educationalContext population in two error builders)
- MODIFIED: `digital-archaeology-web/src/emulator/AssemblerBridge.test.ts` (~30-40 lines: educational context tests for both error builders)
- MODIFIED: `digital-archaeology-web/src/ui/ErrorPanel.ts` (~15-20 lines: createEducationalContext method + rendering in createErrorItem)
- MODIFIED: `digital-archaeology-web/src/ui/ErrorPanel.test.ts` (~20-30 lines: educational context rendering tests)
- MODIFIED: `digital-archaeology-web/src/styles/main.css` (~10 lines: da-error-educational-context styles)

### Naming Conventions

- Interface: `StageEducationalContent` (PascalCase, exported type)
- Constant: `STAGE_EDUCATIONAL_CONTENT` (SCREAMING_SNAKE_CASE, module-private)
- Function: `getStageEducationalContent(stage)` (camelCase, exported, follows `getStageConstraints()` pattern)
- Field: `educationalContext` (camelCase, optional field on AssemblerError)
- CSS class: `da-error-educational-context` (kebab-case with `da-` prefix)
- Method: `createEducationalContext(text)` (camelCase, private method on ErrorPanel)

### Testing Requirements

- **Framework:** Vitest with jsdom environment
- **Coverage:** Add to existing `stageConfig.test.ts`, `AssemblerBridge.test.ts`, `ErrorPanel.test.ts`
- **Minimum:** 14+ tests covering each AC
- **Zero regressions:** All existing tests must continue passing (current count: ~4459+)
- **Mock pattern:** Follow existing Worker mock pattern in AssemblerBridge.test.ts, DOM assertion pattern in ErrorPanel.test.ts
- **Backwards compatibility:** Verify existing errors without educationalContext render unchanged

### Previous Story Intelligence (18-3 Enforce Instruction Set Limits)

**Patterns established that MUST be followed:**
1. Named exports only (no default exports)
2. Add to existing files rather than creating new ones
3. `readonly` on interface fields and collection types
4. Follow `getStageConfig()` / `getStageConstraints()` / `getStageInstructions()` naming pattern
5. Reference source docs in JSDoc comments
6. Comprehensive test coverage with explicit assertions
7. Use `textContent` for safe text rendering in ErrorPanel

**Code review lessons from 18-1, 18-2, and 18-3:**
- Add `readonly` to any new interface fields (1H finding from 18-1)
- Don't duplicate data — share constants (2M finding from 18-1)
- Assert exact values in tests, not just truthiness (4L finding from 18-1)
- Use actual data counts in error messages, not config approximations (2M finding from 18-3)
- JSDoc must match actual data (1M finding from 18-3)

### Git Intelligence

**Commit pattern:** `feat: implement Story 18-4 Create Educational Error Messages with code review fixes`
**Files per story:** Usually 4-8 modified files + sprint-status.yaml
**Recent test count:** 4459 (growing by ~15-40 per story)
**Previous story (18-3):** Added 37 tests. This story should add ~14+ tests.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-18, Story 18.4]
- [Source: _bmad-output/planning-artifacts/architecture.md#Format-Patterns, CONSTRAINT_ERROR type]
- [Source: digital-archaeology-web/src/emulator/AssemblerBridge.ts — buildMemoryConstraintError, buildInstructionSetError]
- [Source: digital-archaeology-web/src/emulator/types.ts — AssemblerError interface, AssemblerErrorType]
- [Source: digital-archaeology-web/src/config/stageConfig.ts — StageConstraints, StageConfig, getStageConfig()]
- [Source: digital-archaeology-web/src/ui/ErrorPanel.ts — createErrorItem, createSuggestion, CONSTRAINT_ERROR rendering]
- [Source: digital-archaeology-web/src/styles/main.css — existing error panel styles]
- [Source: _bmad-output/implementation-artifacts/18-2-enforce-memory-limits.md — buildMemoryConstraintError patterns]
- [Source: _bmad-output/implementation-artifacts/18-3-enforce-instruction-set-limits.md — buildInstructionSetError patterns, code review lessons]
- [Source: _bmad-output/project-context.md — XSS prevention rules, naming conventions, testing standards]
- [Source: docs/cpu_history_timeline.md — Historical CPU context for educational content]
- [Source: docs/micro4_minimal_architecture.md — Micro4 architecture rationale]
- [Source: docs/micro8_isa.md — Micro8 ISA design decisions]

## Senior Developer Review

### Review Date: 2026-02-17

### Findings: 0H 2M 2L — All Fixed

| ID | Severity | Description | Fix |
|----|----------|-------------|-----|
| 1M | MEDIUM | `buildInstructionSetError` missing instruction-specific educational content — story task 3.3 requires "specific info about the unavailable instruction's category/purpose" but implementation only concatenated generic instructionContext + journeyTeaser | Added mnemonic name and earliest stage reference to educationalContext string: `The ${mnemonic} instruction requires capabilities introduced in ${earliestConfig.meta.label}.` |
| 2M | MEDIUM | CSS introduced 3 undefined CSS variables (`--da-accent-info`, `--da-spacing-sm`, `--da-spacing-md`) — phantom fallbacks, won't respond to theme changes | Replaced with hardcoded values (matching `.da-error-suggestion` pattern) and existing `--da-accent` variable |
| 3L | LOW | `initBridge` helper duplicated across 3 test describe blocks (memory limit, instruction set, educational context) | Hoisted all 3 shared helpers to parent `describe('AssemblerBridge')` scope |
| 4L | LOW | Inconsistent `readonly` on `AssemblerError.educationalContext` — only field with `readonly`, siblings are mutable | Removed `readonly` for consistency with sibling fields |

### Post-Review Test Results

- 4479 tests passing (4478 + 1 new mnemonic test), 0 failures
- TypeScript: clean (pre-existing Editor.test.ts error only)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- Initial test run: 5 failures in AssemblerBridge.test.ts due to helper function scoping — educational context describe block placed at outer scope, helpers defined in sibling scopes
- Fix: Added local helper function definitions (initBridge, simulateSuccessWithSize, simulateUnknownInstruction) inside the educational context describe block
- Final test run: 4478 passed, 0 failures across 106 test files
- Pre-existing TypeScript error in Editor.test.ts (unrelated to Story 18.4)

### Completion Notes List

- All 6 tasks completed with all subtasks checked
- 20 new tests added: 8 in stageConfig.test.ts, 7 in ErrorPanel.test.ts, 5 in AssemblerBridge.test.ts
- Total test count: 4478 (up from ~4459)
- Educational content covers all 6 stages with historically accurate references
- CSS uses variables for theme compatibility
- All text rendered via textContent (XSS-safe)
- Backwards-compatible: optional educationalContext field, existing errors unchanged

### File List

- MODIFIED: `digital-archaeology-web/src/config/stageConfig.ts` — StageEducationalContent interface, STAGE_EDUCATIONAL_CONTENT constant (all 6 stages), getStageEducationalContent() function
- MODIFIED: `digital-archaeology-web/src/config/stageConfig.test.ts` — 8 new tests for getStageEducationalContent
- MODIFIED: `digital-archaeology-web/src/emulator/types.ts` — Added readonly educationalContext?: string to AssemblerError interface
- MODIFIED: `digital-archaeology-web/src/emulator/AssemblerBridge.ts` — Import getStageEducationalContent, populate educationalContext in buildMemoryConstraintError() and buildInstructionSetError()
- MODIFIED: `digital-archaeology-web/src/emulator/AssemblerBridge.test.ts` — 5 new tests for educational context in constraint errors
- MODIFIED: `digital-archaeology-web/src/ui/ErrorPanel.ts` — createEducationalContext() method, rendering in createErrorItem()
- MODIFIED: `digital-archaeology-web/src/ui/ErrorPanel.test.ts` — 7 new tests for educational context rendering
- MODIFIED: `digital-archaeology-web/src/styles/main.css` — .da-error-educational-context styles
