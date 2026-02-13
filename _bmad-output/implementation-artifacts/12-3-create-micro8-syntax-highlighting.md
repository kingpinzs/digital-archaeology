# Story 12.3: Create Micro8 Syntax Highlighting

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want Micro8 assembly highlighted,
So that I can read Micro8 code easily in the editor when working in the Micro8 stage.

## Acceptance Criteria

1. **Given** I am in Micro8 stage **When** I write Micro8 assembly **Then** all ~80 opcodes (68 unique mnemonics covering 8 semantic categories) are highlighted with the correct token colors
2. **Given** I am in Micro8 stage **When** I type register names (R0-R7, SP, PC, and aliases A-L, HL, BC, DE) **Then** they are highlighted as registers (yellow)
3. **Given** I am in Micro8 stage **When** I use stack operations (PUSH, POP, CALL, RET, RETI, PUSH16, POP16, PUSHF, POPF) **Then** they are highlighted as stack keywords (green)
4. **Given** I am in Micro8 stage **When** I use Micro8-specific directives (ORG, DB, DW, DS, EQU) **Then** they are highlighted as directives (purple)
5. **Given** the Micro8 language definition exists **When** all Micro8 mnemonics in `src/micro8/assembler.c` are cross-referenced **Then** zero mnemonics are missing from the syntax highlighting keyword lists
6. **Given** the existing test suite **When** all tests pass **Then** the implementation is verified complete

## Prior Art: Story 11-4 Already Implemented Micro8 Syntax Highlighting

**CRITICAL CONTEXT**: Story 11-4 (Implement Stage-Specific Syntax Highlighting) already created a complete Micro8 language definition. The following files already exist and are fully functional:

| File | Lines | Status |
|------|-------|--------|
| `src/editor/micro8-language.ts` | 193 | Complete — 8 keyword categories, 68 mnemonics, 19 registers, 5 directives |
| `src/editor/micro8-language.test.ts` | 499 | Complete — comprehensive Vitest suite with Monaco mocking |
| `src/editor/languageRegistry.ts` | 38 | Complete — `registerAllLanguages()` includes Micro8 |
| `src/editor/languageRegistry.test.ts` | 98 | Complete — stage-to-language mapping tests |
| `src/config/stageConfig.ts` | 154 | Complete — `micro8.syntax.languageId = 'micro8'` |
| `src/editor/Editor.ts` | 600+ | Complete — theme includes all Micro8 token types |
| `src/ui/App.ts` | 800+ | Complete — `performStageSwitch()` calls `setLanguage()` |

**This story is primarily a VERIFICATION and GAP-FILL story, NOT a greenfield implementation.**

## Tasks / Subtasks

- [x] Task 1: Cross-reference mnemonics against actual assembler (AC: #1, #5)
  - [x] 1.1 Read `src/micro8/assembler.c` and extract ALL unique instruction mnemonics parsed by the assembler
  - [x] 1.2 Compare extracted list against `micro8-language.ts` keyword arrays (controlKeywords, jumpKeywords, memoryKeywords, arithmeticKeywords, logicKeywords, stackKeywords, ioKeywords, flagKeywords)
  - [x] 1.3 If any mnemonics are missing from the language definition, add them to the correct semantic category
  - [x] 1.4 If any mnemonics in the language definition are NOT in the assembler, flag for review (may be valid aliases)

- [x] Task 2: Verify register list completeness (AC: #2)
  - [x] 2.1 Confirm R0-R7 are in registers array — expected: YES
  - [x] 2.2 Confirm SP is in registers array — expected: YES
  - [x] 2.3 Check if PC should be in registers array — Epic AC mentions "PC" but `parse_register()` in assembler.c does NOT accept PC as a valid operand. **Decision: Add PC to registers list for educational value** (users may type it; highlighting it yellow provides visual feedback even though it's not a valid operand)
  - [x] 2.4 Confirm named aliases A, B, C, D, E, H, L are present — expected: YES
  - [x] 2.5 Confirm register pairs HL, BC, DE are present — expected: YES

- [x] Task 3: Run existing test suite and verify all tests pass (AC: #6)
  - [x] 3.1 Run `npx vitest run src/editor/micro8-language.test.ts` — all tests must pass
  - [x] 3.2 Run `npx vitest run src/editor/languageRegistry.test.ts` — all tests must pass
  - [x] 3.3 Run `npx vitest run src/config/stageConfig.test.ts` — all tests must pass
  - [x] 3.4 If PC was added in Task 2.3, add a test asserting PC is in the registers array
  - [x] 3.5 Run full test suite `npx vitest run` — no regressions

- [x] Task 4: Verify end-to-end highlighting works in Micro8 stage (AC: #1, #3, #4)
  - [x] 4.1 Trace the registration flow: `App.mount()` → `registerAllLanguages()` → `registerMicro8Language()` → 3 Monaco API calls
  - [x] 4.2 Trace the stage-switch flow: `performStageSwitch('micro8')` → `getLanguageIdForStage('micro8')` returns `'micro8'` → `editor.setLanguage('micro8')`
  - [x] 4.3 Verify Editor.ts `registerTheme()` includes theme rules for ALL Micro8 token types (keyword.control, keyword.jump, keyword, keyword.arithmetic, keyword.logic, keyword.stack, keyword.io, keyword.flag, directive, register)

## Dev Notes

### Already-Complete Architecture (DO NOT RECREATE)

The syntax highlighting system is fully built. Do NOT:
- Create new language files (micro8-language.ts already exists)
- Modify the registration pattern (idempotent guard pattern is established)
- Change the theme (Editor.ts already has all token types)
- Modify App.ts (stage switching already calls setLanguage)
- Create a new test file (micro8-language.test.ts already exists with 499 lines)

### What MAY Need Changes

1. **Add PC to registers array** in `micro8-language.ts` line 106-110 (one-line addition)
2. **Add missing mnemonics** if gap analysis (Task 1) finds any
3. **Add test assertion for PC** in `micro8-language.test.ts` if PC is added

### Micro8 Token Category → Color Mapping

| Token Type | Color | Hex | Keywords |
|------------|-------|-----|----------|
| `keyword.control` | Pink | `#ff79c6` | HLT, NOP, EI, DI |
| `keyword.jump` | Pink | `#ff79c6` | JMP, JZ, JNZ, JC, JNC, JS, JNS, JO, JNO, JP, JR, JRZ, JRNZ, JRC, JRNC |
| `keyword` (memory) | Cyan | `#8be9fd` | LDI, LD, ST, LDZ, STZ, LDI16, MOV, MOV16 |
| `keyword.arithmetic` | Cyan | `#8be9fd` | ADD, ADC, SUB, SBC, ADDI, SUBI, INC, DEC, INC16, DEC16, ADD16, NEG, CMP, CMPI |
| `keyword.logic` | Cyan | `#8be9fd` | AND, OR, XOR, NOT, ANDI, ORI, XORI, SHL, SHR, SAR, ROL, ROR, SWAP |
| `keyword.stack` | Green | `#50fa7b` | PUSH, POP, PUSH16, POP16, PUSHF, POPF, CALL, RET, RETI |
| `keyword.io` | Orange | `#ffb86c` | IN, OUT |
| `keyword.flag` | Purple | `#bd93f9` | SCF, CCF, CMF |
| `directive` | Purple | `#bd93f9` | ORG, DB, DW, DS, EQU |
| `register` | Yellow | `#f1fa8c` | R0-R7, A-L, SP, HL, BC, DE (+ PC if added) |

### Existing File Paths (All in `digital-archaeology-web/`)

- `src/editor/micro8-language.ts` — Language definition (193 lines)
- `src/editor/micro8-language.test.ts` — Test suite (499 lines)
- `src/editor/languageRegistry.ts` — Central registry (38 lines)
- `src/editor/languageRegistry.test.ts` — Registry tests (98 lines)
- `src/editor/Editor.ts` — Editor wrapper with theme (600+ lines)
- `src/config/stageConfig.ts` — Stage config with language IDs (154 lines)
- `src/ui/App.ts` — App with stage switching (800+ lines)

### Previous Story Intelligence

**Story 11-4** (commit `219e23e`) created the entire syntax highlighting system:
- Created `micro8-language.ts`, `micro16-language.ts`, `languageRegistry.ts`
- Added `setLanguage()` to Editor.ts
- Added theme rules for all new token types
- Integrated language switching in App.ts `performStageSwitch()`
- All 8 semantic keyword categories for Micro8 were defined
- 499 lines of tests for micro8-language alone

**Story 12-2** (commit `6214f79`) confirmed the Micro8 assembler WASM pipeline is complete. The assembler handles all ~80 instructions (68 unique mnemonics).

### Project Structure Notes

- All editor files in `src/editor/` — do NOT create files elsewhere
- Test files co-located as `*.test.ts`
- Named exports only (no default exports)
- Constants in `SCREAMING_SNAKE_CASE`
- Monaco mocking pattern: `vi.hoisted()` → `vi.mock('monaco-editor', ...)`

### References

- [Source: _bmad-output/implementation-artifacts/11-4-implement-stage-specific-syntax-highlighting.md] — Complete implementation record
- [Source: src/micro8/assembler.c:327-350] — `parse_register()` function (defines valid register operands)
- [Source: digital-archaeology-web/src/editor/micro8-language.ts] — Current Micro8 language definition
- [Source: digital-archaeology-web/src/editor/Editor.ts:131-190] — Theme definition with token colors
- [Source: digital-archaeology-web/src/config/stageConfig.ts:95] — Micro8 syntax.languageId = 'micro8'

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- RED: Added PC assertion to `micro8-language.test.ts` → test failed as expected (PC not in registers)
- GREEN: Added 'PC' to registers array in `micro8-language.ts` → test passed (54/54)
- Gap analysis: Extracted 68 unique mnemonics from `assembler.c` `instructions[]` table, cross-referenced against 8 keyword arrays → 100% match, zero gaps
- Registry tests: 8/8 pass, config tests: 22/22 pass
- Full suite: 104 files, 4278 tests, all passing, zero regressions
- TypeScript: 1 pre-existing error in Editor.test.ts:1621 (unrelated)

### Completion Notes List

- Story 11-4 previously implemented Micro8 syntax highlighting with 68 mnemonics across 8 semantic categories, 19 registers, 5 directives, complete test suite, language registry, theme integration, and App stage-switch integration
- Gap analysis confirmed 100% mnemonic coverage: all 68 assembler mnemonics are present in `micro8-language.ts`
- Only code change needed: add 'PC' to registers array (epic AC mentions "register names R0-R7, SP, PC"). PC is not a valid assembly operand per `parse_register()` in assembler.c, but highlighting it as a register provides educational value
- Added test assertion for PC in registers array
- E2E flow verified: `registerAllLanguages()` → `registerMicro8Language()` → 3 Monaco API calls; `performStageSwitch('micro8')` → `getLanguageIdForStage('micro8')` → `editor.setLanguage('micro8')`; theme includes all 7 Micro8-specific token types

### Change Log

- 2026-02-13: Added 'PC' to registers array in `micro8-language.ts` (line 108). Added test assertion for PC in `micro8-language.test.ts` (line 144). Verified 100% mnemonic coverage against assembler.c. All 4278 tests passing.
- 2026-02-13: Code review fixes — updated file comment (L-1), added mnemonic completeness test (M-1), added PC tokenization test (L-2), added register count assertion (L-3), added PUSH16/POP16 stack keyword assertions (L-4). All 4280 tests passing.

### File List

- `digital-archaeology-web/src/editor/micro8-language.ts` — Modified: added 'PC' to registers array, updated file comment
- `digital-archaeology-web/src/editor/micro8-language.test.ts` — Modified: added PC assertion, mnemonic completeness test, PC tokenization test, register count assertion, PUSH16/POP16 assertions
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Modified: 12-3 status updated
- `_bmad-output/implementation-artifacts/12-3-create-micro8-syntax-highlighting.md` — Modified: task checkboxes, dev agent record, status
