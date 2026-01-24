# Epic 5 Retrospective: Debugging & State Inspection

**Date:** 2026-01-23
**Facilitator:** Bob (Scrum Master)
**Participants:** Jeremy (User), Alice (Product Owner)

---

## Epic Summary

**Goal:** Users can debug their programs with step execution, state inspection, breakpoints, and rich error information.

**FRs Covered:** FR14, FR15, FR16, FR17, FR18, FR19

| Story | Title | Status | Tests Added |
|-------|-------|--------|-------------|
| 5.1 | Implement Step Execution | ✅ Done | ~40 |
| 5.2 | Implement Step Back | ✅ Done | ~30 |
| 5.3 | Create Register View Panel | ✅ Done | ~46 |
| 5.4 | Create Flags Display | ✅ Done | ~33 |
| 5.5 | Create Memory View Panel | ✅ Done | ~49 |
| 5.6 | Implement Jump to Address | ✅ Done | ~25 |
| 5.7 | Highlight Current Instruction | ✅ Done | (in 5.1) |
| 5.8 | Implement Breakpoint Toggle | ✅ Done | ~66 |
| 5.9 | Implement Run to Breakpoint | ✅ Done | ~29 |
| 5.10 | Display Rich Runtime Errors | ✅ Done | ~37 |

**Completion Rate:** 100% (10/10 stories)

---

## What Went Well

### 1. Code Quality & Architecture
- **Consistent component pattern**: RegisterView, FlagsView, MemoryView, BreakpointsView, RuntimeErrorPanel all follow the same mount/updateState/destroy lifecycle
- **Safe DOM methods**: Every component uses createElement/textContent instead of innerHTML for XSS prevention
- **Comprehensive test coverage**: Test count grew from ~1092 to ~1413 tests
- **Adversarial code review**: Every story included code review that caught 50+ issues across the epic

### 2. Design Decisions
- **Client-side state history** (Story 5.2): Kept worker stateless, made step-back straightforward, ~15KB memory footprint for 50 states
- **Micro4 nibble handling** (Story 5.5): Correctly identified 4-bit memory (not 8-bit bytes) and omitted ASCII column
- **Error type classification** (Story 5.10): Pattern matching to categorize runtime errors (MEMORY_ERROR, ARITHMETIC_WARNING, etc.)

### 3. Story Dependency Management
- Story 5.7 was correctly identified as already implemented in Story 5.1 (avoiding duplicate work)
- Stories built on each other incrementally without blocking issues
- Placeholder patterns used for Epic 6 integration points

---

## Challenges & Lessons Learned

### 1. WASM Limitations (Story 5.2)
**Issue:** Step-back couldn't fully restore CPU state because the C emulator only had getter functions, not setters.

**Workaround:** UI uses historical state values for display even though emulator's internal state differs.

**Lesson Learned:** When planning WASM-dependent features, audit existing exports early in the planning phase.

**Future Action:** Add setter functions to `cpu.c` if full state restoration is needed:
```c
void cpu_set_pc_instance(int pc);
void cpu_set_accumulator_instance(int acc);
void cpu_set_zero_flag_instance(int flag);
// etc.
```

### 2. Story Scope Overlap (Story 5.7)
**Issue:** Story 5.7 (Highlight Current Instruction) was already implemented as part of Story 5.1.

**Root Cause:** The step execution feature naturally required line highlighting for visual feedback - they're tightly coupled.

**Lesson Learned:** During sprint planning, identify stories that may be subsumed by others due to natural dependencies.

**Recommendation:** Add a "likely combined with" field to story definitions for tightly coupled features.

### 3. Technical Complexity
- **Monaco Editor integration**: Required learning the decorations API, MouseTargetType enum for gutter clicks
- **Worker communication patterns**: Breakpoint commands needed new command/event types and bidirectional sync
- **JSDOM limitations**: `scrollIntoView` doesn't work in JSDOM tests (fixed with existence check)

**Lesson Learned:** Add helper methods to mock objects for common test scenarios (e.g., `_triggerBreakpointHit`).

---

## Forward-Looking Notes

### Placeholders Created for Epic 6 (Circuit Visualization)
1. **View in Circuit button** (Story 5.10): Currently shows placeholder status; will link to circuit component when Epic 6 implements visualization
2. **Signal values section** (Story 5.10): RuntimeErrorPanel has UI section ready for signal display
3. **onAddressClick callback** (Story 5.5): MemoryView reserved this callback for potential circuit linking

### No Blockers for Epic 6
Epic 5 wraps up cleanly. The placeholders above are enhancement opportunities, not dependencies.

---

## Metrics

| Metric | Value |
|--------|-------|
| Stories Completed | 10/10 (100%) |
| Tests Added | ~321 new tests |
| Final Test Count | 1413 tests passing |
| Code Review Issues Fixed | 50+ across all stories |
| Files Created | ~15 new files |
| Files Modified | ~30 files |
| Component Pattern Reuse | 5 debugger components follow same pattern |

---

## Key Components Created

### Debugger Module (`src/debugger/`)
- `RegisterView.ts` - PC and Accumulator display with change flash
- `FlagsView.ts` - Zero flag display with SET/clear visual distinction
- `MemoryView.ts` - 256-nibble hex dump with PC highlighting
- `BreakpointsView.ts` - Breakpoint list with remove functionality
- `RuntimeErrorPanel.ts` - Rich error display with type badges and action buttons

### Editor Enhancements (`src/editor/`)
- Line highlighting for current instruction (cyan arrow in gutter)
- Breakpoint decorations (red dots in gutter)
- F9 keyboard shortcut for breakpoint toggle
- F10 keyboard shortcut for step

### Emulator Enhancements (`src/emulator/`)
- State history and restoration commands
- Breakpoint set/clear/get commands
- BREAKPOINT_HIT event for run-to-breakpoint
- Rich error context with type classification

---

## Action Items

| Item | Owner | Priority | Target |
|------|-------|----------|--------|
| Add WASM setter functions for full state restoration | Dev Team | Low | Future if needed |
| Review tightly-coupled stories during planning | Scrum Master | Medium | Epic 6 planning |
| Document component patterns in project README | Tech Writer | Low | After Epic 6 |

---

## Acknowledgments

Epic 5 successfully delivered a comprehensive debugging experience for the Micro4 CPU. The consistent component architecture, thorough testing, and adversarial code reviews resulted in high-quality, maintainable code.

**Agent Model Used:** Claude Opus 4.5 (claude-opus-4-5-20251101)
