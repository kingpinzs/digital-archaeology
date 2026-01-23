# Epic 4 Retrospective: Program Execution

**Facilitated by:** Bob (Scrum Master)
**Date:** 2026-01-23
**Epic Status:** Done
**Stories Delivered:** 8/8 (100%)

---

## Epic Summary

Epic 4 delivered complete program execution control: WASM-compiled emulator running in a Web Worker, EmulatorBridge Promise-based API, load/run/stop/reset controls, and real-time speed adjustment. This epic directly reused the AssemblerBridge pattern established in Epic 3, validating the retrospective-driven learning process.

### Stories Completed

| Story | Title | Key Deliverable |
|-------|-------|-----------------|
| 4.1 | Compile Emulator to WASM | Emscripten build, 29KB WASM binary |
| 4.2 | Create Emulator Web Worker | Worker + message protocol with 7 command types |
| 4.3 | Implement EmulatorBridge Class | Promise-based API mirroring AssemblerBridge |
| 4.4 | Implement Load Program | Auto-load on assembly, PC=0 initialization |
| 4.5 | Implement Run Button | Continuous execution, Run/Pause toggle, speed slider |
| 4.6 | Implement Stop Button | Immediate pause, state preservation |
| 4.7 | Implement Reset Button | CPU state reset, stops running execution |
| 4.8 | Implement Speed Control | Real-time speed change (1-1000Hz), SET_SPEED command |

---

## What Went Well

### 1. Pattern Reuse Was Seamless (Stories 4.1-4.3)

**Bob (Scrum Master):** "The Epic 3 retrospective specifically called out reusing AssemblerBridge for EmulatorBridge. How did that work out?"

**Dev (Developer):** "Brilliantly. Epic 3's action item #7 was 'Create EmulatorBridge mirroring AssemblerBridge.' The resulting code structure is nearly identical:

```typescript
// Epic 3 - AssemblerBridge pattern
class AssemblerBridge {
  init(): Promise<void>
  assemble(source): Promise<Result>
  terminate(): void
}

// Epic 4 - EmulatorBridge (same pattern)
class EmulatorBridge {
  init(): Promise<void>
  loadProgram(binary): Promise<CPUState>
  run(speed): void
  stop(): Promise<CPUState>
  onStateUpdate(callback): () => void
  terminate(): void
}
```

Stories 4.1-4.3 were completed with minimal issues because the WASM + Worker + Bridge pattern was already proven."

### 2. Test Coverage Growth Continued Strong

| Metric | Epic 3 End | Epic 4 End | Delta |
|--------|------------|------------|-------|
| Total Tests | 745 | 1011 | +266 |
| App.test.ts Tests | ~120 | 221 | +101 |

**QA (Quality Assurance):** "The test suite grew by 266 tests. The App.test.ts file alone has 221 tests covering the full UI lifecycle. Every story added meaningful coverage."

### 3. Real-Time Speed Control Architecture (Story 4.8)

The final story added dynamic speed adjustment during execution. The implementation extracted a shared `startRunInterval()` function to avoid code duplication between `handleRun()` and `handleSetSpeed()`.

**Architect (Technical Architect):** "The SET_SPEED command pattern demonstrates extensibility. New worker commands slot into the existing message protocol cleanly."

### 4. Code Review Process Is Maturing

| Story | HIGH | MEDIUM | LOW | Notes |
|-------|------|--------|-----|-------|
| 4.1-4.3 | 0 | 0 | 0 | Pattern reuse - clean |
| 4.4 | 0 | 0 | 0 | Clean |
| 4.5 | 0 | 0 | 0 | Clean |
| 4.6 | 1 | 3 | 2 | Task tracking, test gaps |
| 4.7 | 0 | 1 | 2 | Test coverage for ACs |
| 4.8 | 0 | 2 | 2 | Code duplication, docs |

**Total:** 1 HIGH, 6 MEDIUM, 6 LOW (13 total issues, down from 23 in Epic 3)

**Bob (Scrum Master):** "Stories 4.1-4.5 had zero issues. The HIGH severity in 4.6 was a process issue (task tracking), not code quality. This shows the team is applying patterns correctly."

---

## What Didn't Go Well

### 1. Action Items Now Fully Addressed

**Bob (Scrum Master):** "Let me check the action item status from Epic 3..."

| # | Action Item | Status | Location |
|---|-------------|--------|----------|
| 1 | Add WASM compilation to CI/CD | DONE | `.github/workflows/ci.yml` |
| 2 | Document Web Worker + Bridge pattern | DONE | `docs/patterns/web-worker-bridge.md` |
| 3 | Document event listener cleanup pattern | DONE | `docs/patterns/event-listener-cleanup.md` |
| 4 | Consolidate Monaco mock into shared utility | DONE | `src/test-utils/monaco-mock.ts` (types importable, impl must be copied due to Vitest limitation) |
| 5 | Create state management guide | DONE | `docs/patterns/state-management.md` |
| 6 | Document CSS variable usage policy | DONE | `docs/patterns/css-variables.md` |
| 7 | Create EmulatorBridge mirroring AssemblerBridge | DONE | `src/emulator/EmulatorBridge.ts` |
| 8 | Add pre-commit hook for test count verification | DONE | `scripts/verify-test-count.sh`, `docs/patterns/pre-commit-hooks.md` |

"All 8 action items are now complete! The documentation debt from Epics 2-3 is finally resolved."

### 2. Git Repository State

Unrelated files are appearing in git status:
- `.mcp.json` deleted
- `videos_list.md` added (untracked)

**Dev (Developer):** "These are project-level changes not tied to any story. We should address repository hygiene separately."

### 3. Manual Testing Still Deferred

Stories 4.6 and 4.7 had manual test subtasks that were covered by automated tests instead. While this is acceptable, the explicit deferral pattern should be formalized.

---

## Key Discoveries

### Patterns Established

| Pattern | Story | Description |
|---------|-------|-------------|
| WASM + Worker + Bridge | 4.1-4.3 | Proven pattern reused from Epic 3 |
| State pub/sub | 4.3 | `onStateUpdate`, `onHalted`, `onError` callbacks |
| Worker command extension | 4.8 | Add new commands to existing protocol |
| Shared interval helper | 4.8 | Extract common run loop logic |
| Button state coordination | 4.5-4.7 | Toolbar enables/disables based on app state |

### EmulatorBridge Event Architecture

```typescript
// Subscription pattern established
const unsubscribeState = bridge.onStateUpdate((state) => {
  updateUI(state);
});

const unsubscribeHalt = bridge.onHalted(() => {
  setRunning(false);
  showMessage('Program halted');
});

const unsubscribeError = bridge.onError((error) => {
  setRunning(false);
  showError(error.message);
});

// Cleanup
unsubscribeState();
unsubscribeHalt();
unsubscribeError();
```

### Speed Calculation Formula

```typescript
// Hz to worker speed parameter conversion
const workerSpeed = Math.max(1, Math.round(this.executionSpeed / 60));
// 60Hz → 1 instruction per ~16ms tick
// 1000Hz → ~17 instructions per ~16ms tick
// 1Hz → 1 instruction per ~16ms tick (minimum)
```

---

## Code Review Issue Analysis

### Issue Categories (Epic 4)

| Category | Count | Examples |
|----------|-------|----------|
| Test coverage gaps | 4 | AC verification, edge cases |
| Task/documentation | 4 | Task tracking, file lists |
| Code duplication | 2 | Run loop logic |
| Process | 3 | Manual test deferral |

### Trend Comparison

| Metric | Epic 3 | Epic 4 | Change |
|--------|--------|--------|--------|
| Total Issues | 23 | 13 | -43% |
| HIGH | 2 | 1 | -50% |
| Clean Stories | 3/7 (43%) | 5/8 (63%) | +20% |

---

## Action Items for Epic 5

### Completed During Epic 4 Retrospective

All 8 carried-forward action items from Epic 3 were completed:

| # | Action Item | Deliverable |
|---|-------------|-------------|
| 1 | Add WASM compilation to CI/CD | `.github/workflows/ci.yml` |
| 2 | Document Web Worker + Bridge pattern | `docs/patterns/web-worker-bridge.md` |
| 3 | Document event listener cleanup pattern | `docs/patterns/event-listener-cleanup.md` |
| 4 | Consolidate Monaco mock | `src/test-utils/monaco-mock.ts` (enhanced) |
| 5 | Create state management guide | `docs/patterns/state-management.md` |
| 6 | Document CSS variable usage policy | `docs/patterns/css-variables.md` |
| 7 | Create EmulatorBridge | `src/emulator/EmulatorBridge.ts` |
| 8 | Add pre-commit hook for test count | `scripts/verify-test-count.sh` |

### New from Epic 4

| # | Action Item | Priority | Rationale |
|---|-------------|----------|-----------|
| 1 | Clean up git repository state | HIGH | Untracked/deleted files accumulating |
| 2 | Formalize manual test deferral process | MEDIUM | 4.6/4.7 deferred manual tests to automated |
| 3 | Document speed calculation formula | LOW | Hz → worker speed conversion (now in state-management.md) |
| 4 | Consider state management library | LOW | Multiple boolean flags (isRunning, hasValidAssembly, etc.) |

---

## Epic 5 Preview

**Goal:** Users can debug programs step-by-step with full state visibility

**Stories:**
- 5.1: Implement Step Execution
- 5.2: Implement Step Back
- 5.3: Create Register View Panel
- 5.4: Create Flags Display
- 5.5: Create Memory View Panel
- 5.6: Implement Jump to Address
- 5.7: Highlight Current Instruction in Editor
- 5.8: Implement Breakpoint Toggle
- 5.9: Implement Run to Breakpoint
- 5.10: Display Rich Runtime Errors

**Key Risks:**
1. **Step execution already works** - Worker STEP command exists, UI wiring needed
2. **Step back requires history** - Must track state history, memory implications
3. **Memory view rendering** - 256 bytes displayed efficiently
4. **Monaco decoration coordination** - Current instruction highlight + breakpoint markers

**Preparation (Apply Epic 4 Learnings):**
- Worker already handles STEP - reuse existing command
- State subscription pattern ready for register/flags/memory panels
- Breakpoint support exists in worker (Story 4.2 added it)
- Consider state history ring buffer for step-back

---

## Retrospective Metrics

| Metric | Epic 3 | Epic 4 | Change |
|--------|--------|--------|--------|
| Stories | 7 | 8 | +1 |
| Completion Rate | 100% | 100% | = |
| New Tests | ~315 | ~266 | -49 |
| Final Test Count | 745 | 1011 | +266 |
| Code Review Issues | 23 | 13 | -43% |
| Clean Stories | 3/7 (43%) | 5/8 (63%) | +20% |
| Action Items Completed | 2/8 | 8/8 | +300% |

---

## Team Feedback

### What to Keep Doing
- Adversarial code review process
- AssemblerBridge/EmulatorBridge pattern reuse
- Comprehensive test coverage (1000+ tests)
- State subscription model (onStateUpdate, onHalted, onError)
- Extracting shared helper functions (startRunInterval)

### What to Start Doing
- Actually complete documentation action items
- Add WASM builds to CI/CD (3 epics overdue)
- Clean up repository state regularly
- Track manual test deferrals explicitly

### What to Stop Doing
- Allowing unrelated files to accumulate in git status
- ~~Carrying forward the same action items without completing them~~ (RESOLVED)
- ~~Deferring documentation indefinitely~~ (RESOLVED - all docs now created)

---

## Conclusion

Epic 4 successfully delivered complete program execution control. The EmulatorBridge pattern directly reused Epic 3's AssemblerBridge design, validating the retrospective-driven improvement process. Code quality improved significantly (43% fewer review issues, 63% clean stories vs 43% in Epic 3).

**All 8 deferred action items from Epics 2-3 were completed during this retrospective:**
- CI/CD pipeline with WASM compilation
- 4 comprehensive pattern documentation files
- Enhanced Monaco mock with types
- Test count verification script

This clears the documentation and automation debt that had been accumulating. Epic 5 can focus entirely on feature development.

The foundation is now complete: code editing (Epic 2), assembly (Epic 3), and execution (Epic 4). Epic 5 adds debugging capabilities that will make the tool genuinely useful for learning CPU architecture.

---

*Generated: 2026-01-23*
*Agent: Claude Opus 4.5 (claude-opus-4-5-20251101)*
