# Story 11.4: Implement Stage-Specific Syntax Highlighting

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want syntax highlighting rules loaded per CPU stage,
So that each stage's assembly instructions, registers, and directives are highlighted correctly in the editor.

## Acceptance Criteria

1. **Given** I switch to a different stage **When** I view the editor **Then** syntax highlighting matches the new stage's instruction set
2. **Given** I am on the Micro8 stage **When** I type assembly code **Then** Micro8 opcodes (MOV, PUSH, POP, CALL, RET, etc.) are highlighted correctly
3. **Given** I am on the Micro16 stage **When** I type assembly code **Then** Micro16 opcodes (MUL, IMUL, DIV, MOVSB, ENTER, LEAVE, etc.) are highlighted correctly
4. **Given** I switch stages **When** the new stage's language is registered **Then** the Monaco editor model language is updated dynamically (no page reload needed)
5. **Given** I switch stages **When** the highlighting definition is loaded **Then** it uses the same token categories as Micro4 (keyword.control, keyword, directive, register, comment, label, number, identifier) for theme consistency
6. **Given** I switch to a stage with `syntax.languageId === null` **When** the editor needs a language **Then** it falls back to Micro4 syntax gracefully (no crash, no blank editor)
7. **Given** I switch stages **When** syntax highlighting updates **Then** existing editor content is re-highlighted with the new rules immediately (Monaco handles this on language change)
8. **Given** the theme (`da-dark`) is applied **When** any stage's language is active **Then** all token types render with correct colors (control=pink, keyword=cyan, directive=purple, register=yellow, etc.)

## Tasks / Subtasks

- [x] Task 1: Create `micro8-language.ts` Monarch tokenizer (AC: #2, #5, #8)
  - [x] 1.1: Define `micro8LanguageId = 'micro8'` constant
  - [x] 1.2: Define `micro8LanguageConfiguration` (comments: `;`, no brackets)
  - [x] 1.3: Define `micro8MonarchLanguage` with token arrays:
    - `controlKeywords`: HLT, NOP, EI, DI
    - `jumpKeywords`: JMP, JZ, JNZ, JC, JNC, JS, JNS, JO, JNO, JP, JR, JRZ, JRNZ, JRC, JRNC
    - `memoryKeywords`: LDI, LD, ST, LDZ, STZ, LDI16, MOV, MOV16
    - `arithmeticKeywords`: ADD, ADC, SUB, SBC, ADDI, SUBI, INC, DEC, INC16, DEC16, ADD16, NEG, CMP, CMPI
    - `logicKeywords`: AND, OR, XOR, NOT, ANDI, ORI, XORI, SHL, SHR, SAR, ROL, ROR, SWAP
    - `stackKeywords`: PUSH, POP, PUSH16, POP16, PUSHF, POPF, CALL, RET, RETI
    - `ioKeywords`: IN, OUT
    - `flagKeywords`: SCF, CCF, CMF
    - `directives`: ORG, DB, DW, DS, EQU
    - `registers`: R0, R1, R2, R3, R4, R5, R6, R7, A, B, C, D, E, H, L, SP, HL, BC, DE
  - [x] 1.4: Tokenizer root rules (same order as micro4): whitespace, comments, labels, hex, binary (`0b`), decimal, hash-prefixed immediates (`#`), register/keyword resolution via `@cases`
  - [x] 1.5: Export `registerMicro8Language()` with idempotent guard
  - [x] 1.6: Export `resetLanguageRegistration()` for testing
  - [x] 1.7: Unit tests mirroring `micro4-language.test.ts` pattern (~30 tests)

- [x] Task 2: Create `micro16-language.ts` Monarch tokenizer (AC: #3, #5, #8)
  - [x] 2.1: Define `micro16LanguageId = 'micro16'` constant
  - [x] 2.2: Define `micro16LanguageConfiguration` (comments: `;`, no brackets)
  - [x] 2.3: Define `micro16MonarchLanguage` with token arrays (extends Micro8 set):
    - `controlKeywords`: HLT, NOP, WAIT, CLI, STI, CLC, STC, CMC, CLD, STD, PUSHF, POPF, IRET, PUSHA, POPA
    - `jumpKeywords`: JMP, JZ, JE, JNZ, JNE, JC, JB, JNC, JAE, JS, JNS, JO, JNO, JL, JGE, JLE, JG, JA, JBE, JR, JP, LOOP, LOOPZ, LOOPE, LOOPNZ, LOOPNE
    - `memoryKeywords`: MOV, LD, ST, LDB, STB, LEA, LDS, LES, XCHG
    - `arithmeticKeywords`: ADD, ADC, SUB, SBC, CMP, NEG, INC, DEC, MUL, IMUL, DIV, IDIV, TEST
    - `logicKeywords`: AND, OR, XOR, NOT, SHL, SHR, SAR, ROL, ROR, RCL, RCR
    - `stackKeywords`: PUSH, POP, ENTER, LEAVE, RET, RETF, CALL
    - `stringKeywords`: MOVSB, MOVSW, CMPSB, CMPSW, STOSB, STOSW, LODSB, LODSW, REP, REPZ, REPE, REPNZ, REPNE
    - `ioKeywords`: IN, OUT, INB, OUTB, INT
    - `directives`: ORG, SEGMENT, DB, DW, DD, DS, EQU
    - `registers`: R0, R1, R2, R3, R4, R5, R6, R7, AX, BX, CX, DX, SI, DI, BP, SP, CS, DS, SS, ES
  - [x] 2.4: Tokenizer root rules (same pattern as micro8)
  - [x] 2.5: Export `registerMicro16Language()` with idempotent guard
  - [x] 2.6: Export `resetLanguageRegistration()` for testing
  - [x] 2.7: Unit tests mirroring pattern (~30 tests)

- [x] Task 3: Create `languageRegistry.ts` centralized registration (AC: #4, #6)
  - [x] 3.1: Create `src/editor/languageRegistry.ts`
  - [x] 3.2: Import all `register*Language` functions from language files
  - [x] 3.3: Export `registerAllLanguages()` that calls all registration functions
  - [x] 3.4: Export `getLanguageIdForStage(stage: LabStage): string` that reads `getStageConfig(stage).syntax.languageId` and falls back to `'micro4'` when null
  - [x] 3.5: Unit tests for registry (fallback behavior, all stages return valid language ID)

- [x] Task 4: Add `setLanguage(languageId)` method to `Editor.ts` (AC: #4, #7)
  - [x] 4.1: Add public `setLanguage(languageId: string): void` method
  - [x] 4.2: Implementation: `const model = this.editor?.getModel(); if (model) monaco.editor.setModelLanguage(model, languageId);`
  - [x] 4.3: Guard: if editor not mounted or no model, no-op (no throw)
  - [x] 4.4: Unit tests for setLanguage (happy path, null guard, model language change)

- [x] Task 5: Update theme to include new token types (AC: #8)
  - [x] 5.1: In `Editor.ts` `registerTheme()`, add new theme rules for token types used by Micro8/Micro16:
    - `keyword.jump` → pink `ff79c6` (same as control — jumps are control flow)
    - `keyword.arithmetic` → cyan `8be9fd` (same as keyword — math operations)
    - `keyword.logic` → cyan `8be9fd` (same as keyword — logic operations)
    - `keyword.stack` → green `50fa7b` (stack operations)
    - `keyword.string` → green `50fa7b` (string operations)
    - `keyword.io` → orange `ffb86c` (I/O operations)
    - `keyword.flag` → purple `bd93f9` (flag manipulation)
    - `register` → yellow `f1fa8c` (register names)
  - [x] 5.2: Ensure existing Micro4 tokens still render identically (backward compatible)

- [x] Task 6: Integrate language switching in `App.ts` stage switch flow (AC: #1, #4, #7)
  - [x] 6.1: Import `registerAllLanguages` and `getLanguageIdForStage` from `languageRegistry.ts`
  - [x] 6.2: Call `registerAllLanguages()` in `App.init()` (alongside existing `registerMicro4Language()` — replace that call)
  - [x] 6.3: In `performStageSwitch()`, after bridge reinit and before state reset, call `this.editor?.setLanguage(getLanguageIdForStage(stage))`
  - [x] 6.4: Unit tests for language switch during stage change

- [x] Task 7: Update `stageConfig.ts` with language IDs (AC: #1, #2, #3)
  - [x] 7.1: Set `micro8.syntax.languageId = 'micro8'`
  - [x] 7.2: Set `micro16.syntax.languageId = 'micro16'`
  - [x] 7.3: micro32/micro32p/micro32s remain `null` (no languages yet)
  - [x] 7.4: Update stageConfig tests to verify new language IDs

- [x] Task 8: E2E tests for syntax highlighting (AC: #1-#8)
  - [x] 8.1: Add to `epic-11-stage-switching.spec.ts`: verify editor has language `micro4` on initial load
  - [x] 8.2: Test that clicking locked stage (Micro8) does NOT change editor language
  - [x] 8.3: Note: Full stage switch E2E (verify language changes to micro8) only testable when Micro8 stage becomes ready

## Dev Notes

### Architecture: Language-Per-Stage with Centralized Registry

The pattern mirrors the existing `micro4-language.ts` exactly. Each stage gets its own `*-language.ts` file following the established Monarch tokenizer pattern. A thin `languageRegistry.ts` centralizes registration and stage-to-language lookup.

```
Editor mount flow:
  Before: registerMicro4Language() → createEditor(language: 'micro4')
  After:  registerAllLanguages() → createEditor(language: 'micro4')

Stage switch flow:
  App.performStageSwitch(stage) → editor.setLanguage(getLanguageIdForStage(stage))
                                → Monaco.editor.setModelLanguage(model, languageId)
                                → Monaco re-tokenizes content automatically
```

### CRITICAL: What NOT to do

- **DO NOT** create a dynamic/generic tokenizer factory. Each language file is simple, explicit, and independently testable. The Monarch tokenizer format is declarative — abstracting it gains nothing.
- **DO NOT** modify `micro4-language.ts`. It's done, tested, and working. Create separate files for Micro8/Micro16.
- **DO NOT** use `innerHTML` anywhere — all DOM via `createElement` + `textContent`.
- **DO NOT** register languages inside the worker — Monaco is main-thread only.
- **DO NOT** re-create the editor on language switch. Use `monaco.editor.setModelLanguage()` on the existing model. This preserves undo history, cursor position, decorations, etc.
- **DO NOT** add register highlighting to Micro4. Micro4 has no named registers (accumulator-only architecture). Registers are a Micro8+ concept.

### Token Category Design

All stages use the same token category names so the single `da-dark` theme works across all languages:

| Token | Color | Used By | Example |
|-------|-------|---------|---------|
| `keyword.control` | Pink `#ff79c6` | All | HLT, NOP, EI, CLI |
| `keyword.jump` | Pink `#ff79c6` | Micro8+ | JMP, JZ, CALL, RET |
| `keyword` | Cyan `#8be9fd` | All | LDA, MOV, ADD, SUB |
| `keyword.arithmetic` | Cyan `#8be9fd` | Micro8+ | MUL, DIV, CMP |
| `keyword.logic` | Cyan `#8be9fd` | Micro8+ | AND, OR, XOR, SHL |
| `keyword.stack` | Green `#50fa7b` | Micro8+ | PUSH, POP, ENTER |
| `keyword.string` | Green `#50fa7b` | Micro16 | MOVSB, REP, STOSW |
| `keyword.io` | Orange `#ffb86c` | Micro8+ | IN, OUT, INT |
| `keyword.flag` | Purple `#bd93f9` | Micro8+ | SCF, CCF, CMF |
| `directive` | Purple `#bd93f9` | All | ORG, DB, DW, EQU |
| `register` | Yellow `#f1fa8c` | Micro8+ | R0, AX, SP, HL |
| `comment` | Gray `#6272a4` | All | ; comment |
| `label` | Green `#50fa7b` | All | START:, LOOP: |
| `number` | Orange `#ffb86c` | All | 42, 0xFF, 0b1010 |
| `identifier` | White `#f8f8f2` | All | LABEL_REF |

### Micro8 Tokenizer: Keyword Cases Pattern

```typescript
// Micro8 uses more @cases than Micro4 due to richer instruction set
[
  /[a-zA-Z_]\w*/,
  {
    cases: {
      '@controlKeywords': 'keyword.control',
      '@jumpKeywords': 'keyword.jump',
      '@memoryKeywords': 'keyword',
      '@arithmeticKeywords': 'keyword.arithmetic',
      '@logicKeywords': 'keyword.logic',
      '@stackKeywords': 'keyword.stack',
      '@ioKeywords': 'keyword.io',
      '@flagKeywords': 'keyword.flag',
      '@directives': 'directive',
      '@registers': 'register',
      '@default': 'identifier',
    },
  },
],
```

### Micro8 Additional Tokenizer Rules (vs Micro4)

Micro8 assembly supports features Micro4 doesn't:
- **Binary numbers**: `0b1010` → add rule: `[/0[bB][01]+/, 'number.binary']`
- **Hash-prefixed immediates**: `#42`, `#0xFF` → add rule: `[/#/, 'operator']` (the number rule matches what follows)
- **Register pairs in brackets**: `[HL]`, `[BC]` → brackets are identifiers, square brackets are just syntax. The register inside matches the `@registers` case.
- **Signed offsets**: `[HL+5]` → `+` and `-` as operators

### Editor.setLanguage() Implementation

```typescript
// In Editor.ts - new public method
setLanguage(languageId: string): void {
  if (!this.editor) return;
  const model = this.editor.getModel();
  if (!model) return;
  monaco.editor.setModelLanguage(model, languageId);
}
```

This is a 4-line method. Monaco handles all re-tokenization internally when the model language changes.

### Language Registry Pattern

```typescript
// src/editor/languageRegistry.ts
import { registerMicro4Language } from './micro4-language';
import { registerMicro8Language } from './micro8-language';
import { registerMicro16Language } from './micro16-language';
import { getStageConfig } from '../config/stageConfig';
import type { LabStage } from '../config/stageConfig';
import { micro4LanguageId } from './micro4-language';

const FALLBACK_LANGUAGE_ID = micro4LanguageId;

export function registerAllLanguages(): void {
  registerMicro4Language();
  registerMicro8Language();
  registerMicro16Language();
}

export function getLanguageIdForStage(stage: LabStage): string {
  return getStageConfig(stage).syntax.languageId ?? FALLBACK_LANGUAGE_ID;
}
```

### Integration Point in App.ts

**In `performStageSwitch()` (around line 715-720), add after bridge reinit:**
```typescript
// Switch editor language for new stage
const languageId = getLanguageIdForStage(stage);
this.editor?.setLanguage(languageId);
```

**In `init()`, replace `registerMicro4Language()` with `registerAllLanguages()`.**

### Micro8 Instruction Set Reference

Source: `src/micro8/assembler.c` — ~80 instructions

**System**: NOP, HLT, EI, DI
**Data Movement**: LDI (R0-R7), MOV, LD, ST, LDZ, STZ, LDI16, MOV16
**Arithmetic**: ADD, ADC, SUB, SBC, ADDI, SUBI, INC, DEC, INC16, DEC16, ADD16, NEG, CMP, CMPI
**Logic**: AND, OR, XOR, NOT, ANDI, ORI, XORI, SHL, SHR, SAR, ROL, ROR, SWAP
**Control Flow**: JMP, JZ, JNZ, JC, JNC, JS, JNS, JO, JNO, JP, JR, JRZ, JRNZ, JRC, JRNC, CALL, RET, RETI
**Stack**: PUSH, POP, PUSH16, POP16, PUSHF, POPF
**Flags**: SCF, CCF, CMF
**I/O**: IN, OUT
**Registers**: R0-R7 (aliases: A, B, C, D, E, H, L), SP, pairs: HL, BC, DE

### Micro16 Instruction Set Reference

Source: `src/micro16/assembler.c` — ~120+ instructions (extends Micro8)

**System**: NOP, HLT, WAIT, CLI, STI, CLC, STC, CMC, CLD, STD, PUSHF, POPF, IRET, PUSHA, POPA
**Data Movement**: MOV, LD, ST, LDB, STB, LEA, LDS, LES, XCHG
**Arithmetic**: ADD, ADC, SUB, SBC, CMP, NEG, INC, DEC, MUL, IMUL, DIV, IDIV, TEST
**Logic**: AND, OR, XOR, NOT, SHL, SHR, SAR, ROL, ROR, RCL, RCR
**Control Flow**: JMP, JZ, JE, JNZ, JNE, JC, JB, JNC, JAE, JS, JNS, JO, JNO, JL, JGE, JLE, JG, JA, JBE, JR, JP, LOOP, LOOPZ, LOOPE, LOOPNZ, LOOPNE, CALL, RETF
**Stack**: PUSH, POP, ENTER, LEAVE, RET
**String**: MOVSB, MOVSW, CMPSB, CMPSW, STOSB, STOSW, LODSB, LODSW, REP, REPZ, REPE, REPNZ, REPNE
**I/O**: IN, OUT, INB, OUTB, INT
**Directives**: ORG, SEGMENT, DB, DW, DD, DS, EQU (aliases: .BYTE, .WORD, .DWORD, .SPACE)
**Registers**: R0-R7 (aliases: AX, BX, CX, DX, SI, DI, BP), SP, segments: CS, DS, SS, ES

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/editor/micro8-language.ts` | Create | Micro8 Monarch tokenizer definition |
| `src/editor/micro8-language.test.ts` | Create | Unit tests for Micro8 language (~30 tests) |
| `src/editor/micro16-language.ts` | Create | Micro16 Monarch tokenizer definition |
| `src/editor/micro16-language.test.ts` | Create | Unit tests for Micro16 language (~30 tests) |
| `src/editor/languageRegistry.ts` | Create | Centralized language registration + stage lookup |
| `src/editor/languageRegistry.test.ts` | Create | Unit tests for registry (~8 tests) |
| `src/editor/Editor.ts` | Modify | Add `setLanguage()` method, update theme rules |
| `src/editor/Editor.test.ts` | Modify | Add setLanguage tests |
| `src/config/stageConfig.ts` | Modify | Set micro8/micro16 `syntax.languageId` |
| `src/config/stageConfig.test.ts` | Modify | Update tests for new language IDs |
| `src/ui/App.ts` | Modify | Replace `registerMicro4Language` with `registerAllLanguages`, add language switch in `performStageSwitch` |
| `src/ui/App.test.ts` | Modify | Add language switch test in stage change suite |
| `tests/e2e/epic-11-stage-switching.spec.ts` | Modify | Add editor language verification |

### Project Structure Notes

- New files in `src/editor/` (established feature folder for editor + language files)
- Follows existing `micro4-language.ts` naming convention
- Tests co-located as `*.test.ts` per project convention
- `languageRegistry.ts` follows utility naming (camelCase file)
- No new CSS needed — theme rules go in existing `Editor.ts` `registerTheme()`

### Performance Requirements

- Language registration: < 1ms per language (Monarch tokenizers are lightweight)
- Language switch: < 5ms (Monaco `setModelLanguage` is near-instant)
- No impact on WASM loading or bridge initialization
- All language registrations happen once on app init (not on each switch)

### Testing Strategy

**Unit Tests (Vitest):**
- Follow `micro4-language.test.ts` pattern exactly — same structure, same test categories
- Test keyword arrays contain expected instructions
- Test tokenizer rules match expected patterns
- Test registration is idempotent (global flag)
- Test `languageRegistry.getLanguageIdForStage()` returns correct ID per stage
- Test `languageRegistry.getLanguageIdForStage()` falls back to micro4 for null-language stages
- Test `Editor.setLanguage()` calls `monaco.editor.setModelLanguage()`
- Test theme includes rules for all token types

**E2E Tests (Playwright):**
- Verify initial editor language is micro4
- Verify locked stage click doesn't change language
- Note: Full switch E2E only possible when additional stages have `ready: true`

### Previous Story Intelligence

**From Story 11.3 (Stage-Specific WASM Loading):**
- `performStageSwitch()` is the integration point for all stage-switch actions (lines 684-794)
- State reset happens after bridge reinit, before `finally` block
- `editor?.clearHighlight()` already called at line 717 — add `setLanguage` nearby
- `isStageSwitching` guard prevents concurrent switches
- Error recovery reverts bridges and selector — language should also revert (or: language switch is non-failing, so revert not needed)
- Code review found toolbar reset, editor highlight, and circuit reload were missing — those are now fixed. Don't miss language switch in the same area.

**From Story 11.2 (Stage Configuration System):**
- `syntax.languageId` field already exists in `StageConfig` — created for this story
- Config pattern: `getStageConfig(stage).syntax.languageId` returns `string | null`
- Micro4 has `languageId: 'micro4'`, others have `null`
- DRY principle: never duplicate canonical constants, derive from source

**From Story 11.1 (Stage Selector UI):**
- Handler binding in constructor
- Settings migration already handles `currentStage` persistence
- Safe DOM: `createElement` + `textContent`

### Coding Standards Checklist

- [ ] Named exports only (no default exports)
- [ ] Handler binding in constructor where applicable
- [ ] Safe DOM: `createElement` + `textContent`, never `innerHTML`
- [ ] CSS variables: `--da-*` prefix only (N/A — no new CSS)
- [ ] `null` over `undefined` for nullable values
- [ ] `SCREAMING_SNAKE_CASE` for constants
- [ ] `camelCase` for functions and variables
- [ ] `PascalCase` for types and interfaces
- [ ] Tests co-located as `*.test.ts`
- [ ] All worker message types in `SCREAMING_SNAKE_CASE` (N/A — no new worker messages)

### References

- [Source: src/editor/micro4-language.ts] — Template pattern for new language files
- [Source: src/editor/micro4-language.test.ts] — Template pattern for language tests
- [Source: src/editor/Editor.ts:120-125] — Current `mount()` with `registerMicro4Language()` call
- [Source: src/editor/Editor.ts:131-164] — Theme definition (`registerTheme()`) — add new token rules here
- [Source: src/editor/Editor.ts:169-236] — `createEditor()` with hardcoded `language: micro4LanguageId`
- [Source: src/editor/Editor.ts:365-367] — `getModel()` returns Monaco model for `setModelLanguage()`
- [Source: src/config/stageConfig.ts:38-42] — `StageSyntaxConfig` with `languageId: string | null`
- [Source: src/config/stageConfig.ts:67-125] — `STAGE_CONFIGS` registry (micro4 = 'micro4', others = null)
- [Source: src/ui/App.ts:684-794] — `performStageSwitch()` — integration point for language switch
- [Source: src/micro8/assembler.c] — Micro8 instruction set (~80 ops)
- [Source: src/micro16/assembler.c] — Micro16 instruction set (~120+ ops)
- [Source: _bmad-output/implementation-artifacts/11-3-implement-stage-specific-wasm-loading.md] — Previous story learnings
- [Source: _bmad-output/implementation-artifacts/11-2-implement-stage-configuration-system.md] — Config system patterns
- [Source: _bmad-output/planning-artifacts/architecture.md] — Coding standards, testing framework

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
