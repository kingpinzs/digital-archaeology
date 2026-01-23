# Epic 3 Retrospective: Code Assembly & Error Handling

**Facilitated by:** Bob (Scrum Master)
**Date:** 2026-01-22
**Epic Status:** Done
**Stories Delivered:** 7/7 (100%)

---

## Epic Summary

Epic 3 delivered the complete assembly pipeline: WASM-compiled assembler running in a Web Worker, rich error display with auto-fix, binary output view, and syntax validation before execution. This was our first WASM integration and established patterns that will carry forward to Epic 4.

### Stories Completed

| Story | Title | Tests Added | Key Deliverable |
|-------|-------|-------------|-----------------|
| 3.1 | Compile Assembler to WASM | 33 | Emscripten build, 22KB WASM binary |
| 3.2 | Create Assembler Web Worker | ~40 | Worker + AssemblerBridge with Promise API |
| 3.3 | Implement Assemble Button | ~30 | Ctrl+Enter shortcut, status flow |
| 3.4 | Display Assembly Errors with Line Numbers | ~45 | ErrorPanel component, Monaco decorations |
| 3.5 | Implement Rich Error Display | ~50 | Type badges, code snippets, auto-fix |
| 3.6 | Show Binary Output View | 35 | BinaryOutputPanel with hex dump |
| 3.7 | Validate Syntax Before Execution | 13 | hasValidAssembly state tracking |

---

## What Went Well

### 1. WASM Integration Was Smooth (Stories 3.1-3.2)
First-time Emscripten usage succeeded without major issues:
- Installed emsdk v4.0.23
- Compiled Micro4 assembler to 22KB WASM (well under 100KB target)
- Web Worker pattern with AssemblerBridge provides clean Promise-based API
- No UI thread blocking during assembly

**Established pattern for Epic 4:**
```typescript
const bridge = new AssemblerBridge();
await bridge.init();
const result = await bridge.assemble(source);
```

### 2. Rich Error Display Exceeded Expectations (Story 3.5)
Delivered more than basic error display:
- Error type badges (SYNTAX_ERROR, VALUE_ERROR, CONSTRAINT_ERROR)
- Code snippets with context lines before/after
- One-click Fix button for typo corrections
- Proper semantic HTML and accessibility

### 3. Retrospective Process Is Driving Quality Improvement
Evidence that the feedback loop is working:
- **Accessibility checklist** - Added after Epic 1 retro, now in every story
- **Monaco decoration pattern** - Documented in Epic 2 retro, used smoothly in 3.4
- **Callback wiring through App.ts** - Established in Epic 2, applied consistently
- **WASM preparation** - Identified as risk in Epic 2 preview, prepared, executed cleanly
- **Stories 3.1-3.3 had zero code review issues** - patterns are being applied

### 4. Test Coverage Growth
| Metric | Value |
|--------|-------|
| Starting Tests | ~430 |
| Ending Tests | 745 |
| New Tests Added | ~315 |
| Average per Story | ~45 |

### 5. Code Review Catching Subtle Issues
The adversarial review process caught edge cases that would have caused bugs:
- `hasValidAssembly` not reset in catch block (would leave stale state after worker crash)
- `hasValidAssembly` not reset in destroy() (would cause issues on remount)
- Missing CSS variables in story-mode theme
- Hardcoded colors instead of theme variables

---

## What Didn't Go Well

### 1. Action Items Still Accumulating
Epic 2 had 8 action items, only 2 fully addressed:

| # | Action Item | Status |
|---|-------------|--------|
| 1 | Add accessibility checklist to story template | ✅ Done |
| 2 | Document escapeHtml() pattern | ❌ Not done |
| 3 | Document event listener cleanup pattern | ⚠️ Used but not formalized |
| 4 | Allocate time for process debt | ⚠️ Partially |
| 5 | Add WASM compilation to CI/CD | ❌ Not done |
| 6 | Create Web Worker messaging pattern guide | ❌ Not done |
| 7 | Document Monaco error marker integration | ✅ Done (via implementation) |
| 8 | Consolidate Monaco mock into shared utility | ❌ Not done |

**Improvement from Epic 2:** 2/8 vs 0/5 (better but still needs work)

### 2. State Management Complexity (Story 3.7)
The `hasValidAssembly` flag needed resets in 4 different places:
- `mount()` - for remounting
- `destroy()` - for cleanup
- `handleAssemble()` success path
- `handleAssemble()` catch block

Code review caught 2 missing resets. As the app grows, this manual state management becomes error-prone.

### 3. CI/CD Still Manual for WASM
Every assembler modification requires manual `./build.sh` execution. This should be automated.

---

## Key Discoveries

### Patterns Established

| Pattern | Story | Description |
|---------|-------|-------------|
| WASM + Web Worker | 3.1-3.2 | Compile C to WASM, load in worker, expose via Bridge class |
| Bridge class | 3.2 | Promise-based wrapper for worker postMessage/onmessage |
| Error type detection | 3.5 | Parse error messages to categorize (SYNTAX, VALUE, CONSTRAINT) |
| Code snippet generation | 3.5 | Extract error line + context for display |
| Auto-fix flow | 3.5 | onFix callback replaces text in editor at specific line/column |
| Hex dump formatting | 3.6 | 16 bytes per row, 4-digit addresses, proper padding |
| Assembly state tracking | 3.7 | Boolean flag invalidated on code change, validated on success |

### AssemblerBridge Design (Reusable for EmulatorBridge)
```typescript
class AssemblerBridge {
  private worker: Worker | null = null;
  private initPromise: Promise<void> | null = null;

  init(): Promise<void>           // Load WASM, wait for WORKER_READY
  assemble(source): Promise<Result>  // Send command, await response
  terminate(): void               // Clean up worker
}
```

---

## Code Review Issue Summary

| Story | HIGH | MEDIUM | LOW | Key Issues |
|-------|------|--------|-----|------------|
| 3.1 | 0 | 0 | 0 | Clean (enhanced with column/suggestion fields) |
| 3.2 | 0 | 0 | 0 | Clean |
| 3.3 | 0 | 0 | 0 | Clean |
| 3.4 | 0 | 2 | 2 | Decoration cleanup, test gaps |
| 3.5 | 0 | 3 | 3 | Hardcoded colors, semantic HTML, missing feedback |
| 3.6 | 0 | 2 | 3 | CSS variable, address format, cleanup |
| 3.7 | 2 | 2 | 4 | State reset in destroy/catch, file list gaps |

**Total:** 2 HIGH, 9 MEDIUM, 12 LOW

**Trend Analysis:**
- Stories 3.1-3.3: Zero issues (established patterns applied correctly)
- Stories 3.4-3.7: Issues concentrated in UI components with state management

**Common Patterns:**
1. State management edge cases - 2 stories
2. CSS variable usage - 2 stories
3. Accessibility/semantic HTML - 2 stories
4. Documentation gaps (File List) - 2 stories

---

## Action Items for Epic 4

### Carried Forward (Priority Order)

| # | Action Item | Priority | Notes |
|---|-------------|----------|-------|
| 1 | Add WASM compilation to CI/CD | HIGH | Manual builds are error-prone |
| 2 | Document Web Worker + Bridge pattern | MEDIUM | Pattern proven, needs documentation |
| 3 | Document event listener cleanup pattern | MEDIUM | Used but not formalized |
| 4 | Consolidate Monaco mock into shared utility | LOW | Reduce test duplication |

### New from Epic 3

| # | Action Item | Priority | Rationale |
|---|-------------|----------|-----------|
| 5 | Create state management guide | MEDIUM | Story 3.7 needed resets in 4 places |
| 6 | Document CSS variable usage policy | LOW | Multiple stories had hardcoded colors |
| 7 | Create EmulatorBridge mirroring AssemblerBridge | HIGH | Pattern proven, apply to Epic 4 |
| 8 | Add pre-commit hook for test count verification | LOW | Multiple stories had count mismatches |

---

## Epic 4 Preview

**Goal:** Users can run Micro4 programs with full execution control

**Stories:**
- 4.1: Compile Emulator to WASM
- 4.2: Create Emulator Web Worker
- 4.3: Implement EmulatorBridge Class
- 4.4: Implement Load Program
- 4.5: Implement Run Button
- 4.6: Implement Stop Button
- 4.7: Implement Reset Button
- 4.8: Implement Speed Control

**Key Risks:**
1. **Emulator state synchronization** - Multiple UI components react to CPU state
2. **Speed control implementation** - Throttle execution without blocking UI
3. **State machine complexity** - Running → Paused → Stopped transitions

**Preparation (Apply Epic 3 Learnings):**
- Reuse AssemblerBridge pattern for EmulatorBridge
- Plan all state reset points upfront (mount, destroy, success, error)
- Use CSS variables consistently from start
- Design pub/sub for CPU state → UI updates

---

## Retrospective Metrics

| Metric | Epic 2 | Epic 3 | Change |
|--------|--------|--------|--------|
| Stories | 6 | 7 | +1 |
| Completion Rate | 100% | 100% | = |
| New Tests | ~140 | ~315 | +175 |
| Final Test Count | ~430 | 745 | +315 |
| Code Review Issues | ~12 | ~23 | +11 |
| Clean Stories (0 issues) | 2 | 3 | +1 |
| Action Items Addressed | 0/5 | 2/8 | Improved |

---

## Team Feedback

### What to Keep Doing
- Adversarial code review process
- Accessibility checklist in every story
- AssemblerBridge/Worker pattern (reuse for Emulator)
- Retrospectives with action item tracking
- Researching framework capabilities before implementing

### What to Start Doing
- Automate WASM builds in CI/CD
- Plan state reset points upfront for new boolean flags
- Document patterns as they're established (not after)
- Use CSS variables from the first implementation

### What to Stop Doing
- Deferring documentation action items indefinitely
- Adding boolean state flags without considering all reset scenarios
- Hardcoding colors instead of using CSS variables

---

## Conclusion

Epic 3 successfully delivered the complete assembly pipeline with rich error handling and syntax validation. The WASM + Web Worker integration was smoother than anticipated, and the AssemblerBridge pattern provides a reusable template for Epic 4's EmulatorBridge.

The retrospective process is demonstrably working - Stories 3.1-3.3 had zero code review issues because the team applied patterns established in previous epics. The action item completion rate improved from 0/5 to 2/8, though documentation debt continues to accumulate.

Key focus for Epic 4: Apply the Bridge pattern to the emulator, plan state management upfront, and finally address the CI/CD automation for WASM builds.

---

*Generated: 2026-01-22*
*Agent: Claude Opus 4.5 (claude-opus-4-5-20251101)*
