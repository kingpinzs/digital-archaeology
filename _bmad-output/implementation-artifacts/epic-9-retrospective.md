# Epic 9 Retrospective: Work Persistence

**Date:** 2026-02-05
**Facilitator:** Bob (Scrum Master)
**Attendees:** Alice (Tech Lead), Charlie (Developer), Dana (Test Engineer), Elena (Product Manager), Jeremy (Product Owner)

---

## Epic Summary

**Goal:** Users can save work, resume sessions, and share files

**Stories Delivered:** 8 (9.1 - 9.8)
**Original Scope:** 8 stories
**Stories Added Mid-Epic:** 0

**NFRs Covered:** NFR15 (Unsaved Work Protection), NFR16 (Persistence), NFR17 (Valid Exports)
**FRs Covered:** FR27 (Save Projects), FR28 (Load Projects), FR31 (Unsaved Work Warning)

---

## Team Discussion

### Bob (Scrum Master)
"Alright team, we've completed all 8 stories in Epic 9! Before we celebrate, let's review what we learned. I've analyzed all the story records and code reviews - there's a lot of good material here. Alice, what stood out to you technically?"

### Alice (Tech Lead)
"Three major architectural wins in this epic:

**1. Tiered Storage Strategy:**
We correctly split storage concerns:
- `SettingsStorage` (Story 9.1) → localStorage for simple key-value settings (~100 bytes)
- `ProjectStorage` (Story 9.2) → IndexedDB for project data (~100KB potential)

This avoids localStorage's 5MB limit and gives us room to grow.

**2. AutoSaveManager Pattern (Story 9.3):**
```typescript
// Intelligent debouncing prevents excessive saves
class AutoSaveManager {
  private debounceMs = 5000;   // 5s after typing stops
  private idleTimeMs = 30000;  // 30s max without save
}
```
This balances responsiveness with performance - no more than one save per 5 seconds, guaranteed save within 30 seconds of any change.

**3. Centralized Dirty State (Story 9.7):**
```typescript
private originalContent: string = '';
public hasUnsavedChanges(): boolean {
  return this.editor?.getValue() !== this.originalContent;
}
```
One source of truth for dirty state, used by beforeunload, confirmation dialogs, and status bar indicators."

### Charlie (Developer)
"From an implementation perspective, I want to highlight the patterns that worked well:

**Bound Handler Pattern:** Every story that added event listeners followed the cleanup pattern from project-context.md:
```typescript
private boundBeforeUnload = (e: BeforeUnloadEvent) => this.handleBeforeUnload(e);

mount(): void {
  window.addEventListener('beforeunload', this.boundBeforeUnload);
}

destroy(): void {
  window.removeEventListener('beforeunload', this.boundBeforeUnload);
}
```

**File Operations Helpers (Stories 9.4-9.6):**
We created reusable utilities in `src/state/fileExport.ts` and `src/state/fileImport.ts`:
- `downloadFile(content, filename, mimeType)` - Blob creation, URL management, cleanup
- `readFileAsText(file)` / `readFileAsArrayBuffer(file)` - Promise wrappers for FileReader
- XSS-safe filename generation

**Error Handling:** Every async operation shows status in the status bar. Users never wonder 'did it work?'"

### Dana (Test Engineer)
"Test coverage was excellent this epic. Let me share the numbers:

| Story | New Tests | Key Testing Patterns |
|-------|-----------|---------------------|
| 9.1 | 24 | localStorage mocking |
| 9.2 | 26 | IndexedDB with fake-indexeddb |
| 9.3 | 18 | Timer mocking (vi.useFakeTimers) |
| 9.4 | 12 | Blob/URL spy verification |
| 9.5 | 14 | FileReader mocking |
| 9.6 | 12 | Binary data assertions |
| 9.7 | 22 | beforeunload event mocking |
| 9.8 | 25 | KeyboardEvent dispatching |
| **Total** | **153** | - |

**Critical pattern discovered:** `vi.hoisted()` for mock functions in `vi.mock()` factories:
```typescript
const mockLocalStorage = vi.hoisted(() => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}));

vi.mock('idb', () => ({
  openDB: vi.fn(() => mockDB),
}));
```

This ensures mocks are hoisted before module imports, fixing timing issues we hit in earlier epics."

### Elena (Product Manager)
"From a product perspective, this epic delivered significant user value:

**Before Epic 9:**
- User refreshes page → All code LOST
- User wants to share code → Copy/paste only
- User switches devices → Start over

**After Epic 9:**
- Auto-save every 30 seconds max
- Export/import .asm files
- Export binary for hardware upload
- Unsaved work warnings before destructive actions
- Full session restoration on return

**User feedback addressed:**
- 'I lost my work' → Never again with auto-save + beforeunload
- 'How do I share code?' → Export Assembly (Ctrl+Shift+E)
- 'Can I use this with real hardware?' → Export Binary

The File menu integration (Story 9.8) ties it all together with familiar shortcuts:
- Ctrl+N: New file
- Ctrl+O: Open (from IndexedDB)
- Ctrl+S: Save (to IndexedDB)
- Ctrl+Shift+S: Save As"

---

## What Went Well

### 1. Zero Story Overlap (Unlike Epic 8)
Epic 8 retrospective noted that 8.1 completed most of 8.2's work. We avoided this:
- Each story had distinct, non-overlapping functionality
- Export Assembly (9.4), Import Assembly (9.5), Export Binary (9.6) were clearly separate
- Settings (9.1) vs Project (9.2) storage split was clean

### 2. Code Review Effectiveness
Adversarial code reviews found real issues:

| Story | Issues Found | Issues Fixed | Impact |
|-------|-------------|--------------|--------|
| 9.4 | 6 | 6 | Export formatting, edge cases |
| 9.7 | 4 | 4 | Missing tests, outdated docs |
| 9.8 | 8 | 8 | Status bar messages, cursor restore |

**100% fix rate** - no deferred issues.

### 3. Consistent Architecture Patterns
Every story followed the same structure:
1. Create class/utility with clear interface
2. Wire into App.ts via callbacks
3. Update StatusBar for user feedback
4. Add comprehensive tests
5. Document in story Dev Notes

### 4. Test Infrastructure Improvements
Stories built on each other's test patterns:
- 9.1 established localStorage mocking
- 9.2 established IndexedDB mocking with fake-indexeddb
- 9.3 established timer mocking
- 9.7-9.8 established event mocking (beforeunload, keydown)

### 5. Proactive Memory Leak Prevention
Every event listener was paired with cleanup in destroy():
```typescript
// Story 9.7: beforeunload
// Story 9.8: keyboard shortcuts
// All properly removed in destroy()
```

---

## What Went Wrong

### 1. ProjectData Interface Documentation Drift
Story 9.8's Dev Notes documented:
```typescript
interface ProjectData {
  breakpoints: { line: number, address: number }[];  // WRONG
}
```
But actual interface was:
```typescript
interface Breakpoint {
  address: number;  // First!
  lineNumber: number;  // Not 'line'
}
```
**Fixed in code review** - but shows docs can drift from code.

### 2. File Path Inconsistency in Story Files
Story file lists used `src/ui/App.ts` instead of `digital-archaeology-web/src/ui/App.ts`. The web app lives in a subdirectory, not root.

**Lesson:** Always verify paths match actual project structure.

### 3. Minor: setTimeout Pattern for Monaco DOM Readiness
Story 9.8's handleFileOpen() uses setTimeout(0) for cursor restoration:
```typescript
if (project.cursorPosition) {
  setTimeout(() => {
    this.editor?.setPosition({
      lineNumber: project.cursorPosition!.lineNumber,
      column: project.cursorPosition!.column,
    });
  }, 0);
}
```
This works but is a code smell. Monaco may provide a better hook. Documented as known technical debt.

---

## Lessons Learned

### Planning
1. **Story granularity was right** - 8 stories for 8 distinct features, no overlap
2. **NFR stories (9.7 unsaved warning) need behavioral focus** - not just implementation

### Technical
3. **vi.hoisted() is essential** for module-level mocks in Vitest
4. **Tiered storage works** - localStorage for settings, IndexedDB for data
5. **AutoSaveManager debouncing prevents performance issues** - 5s/30s strategy is good
6. **originalContent tracking beats 'has content' checks** - proper dirty state

### Testing
7. **Test both success AND failure paths** - code reviews consistently found missing error tests
8. **Timer tests need vi.useFakeTimers() + vi.runAllTimersAsync()** for async setTimeout
9. **Keyboard shortcuts need proper key values** - 'S' (capital) for Shift+S

### Process
10. **Adversarial code review works** - 18 issues found across 3 stories, all fixed
11. **Update story files with actual paths** - not assumed paths

---

## Metrics

| Metric | Value |
|--------|-------|
| Stories completed | 8/8 (100%) |
| New tests added | 153 |
| Code review issues found | 18 |
| Code review issues fixed | 18 (100%) |
| Memory leak patterns | 0 (all properly handled) |
| XSS vulnerabilities | 0 (all user content escaped) |
| NFRs satisfied | NFR15, NFR16, NFR17 |

---

## Action Items from Epic 8 - Status

| Action | Status | Notes |
|--------|--------|-------|
| Review epics for story overlap | DONE | Epic 9 had zero overlap |
| Cross-reference against prior implementations | DONE | 9.7 built on 8.1's confirm pattern |
| Continue code review practice | ONGOING | Found 18 issues, fixed all |

---

## New Action Items

| Action | Owner | Priority | Status |
|--------|-------|----------|--------|
| Verify file paths in story File Lists match actual structure | Dev | Low | Process Update |
| Consider Monaco onDidMount hook instead of setTimeout for cursor | Alice | Low | Tech Debt |
| Document vi.hoisted() pattern in project-context.md | Dana | Medium | Documentation |

---

## Next Epic Preview

**Epic 10 was already completed** - the retrospective files show this epic exists.

Looking at remaining epics from planning:
- Epic 11: Visualizer Integration (if exists)
- Future work: Additional CPU stages (Micro32+)

**Recommendations:**
- Continue adversarial code review practice
- Apply vi.hoisted() pattern consistently
- Maintain zero-overlap story decomposition

---

## Retrospective Status

- [x] Epic identified and reviewed
- [x] All 8 story files analyzed
- [x] Previous retrospective (Epic 8) integrated
- [x] Team discussion documented
- [x] What went well captured
- [x] What went wrong identified
- [x] Root causes analyzed
- [x] Lessons learned documented
- [x] Metrics compiled
- [x] Action items assigned
- [x] Epic 8 action items reviewed
- [x] Process improvements identified
