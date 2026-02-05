# Story 9.5: Export Binary File

Status: done

## Story

As a user,
I want to export the assembled binary,
so that I can use it elsewhere.

## Acceptance Criteria

1. **Given** I have assembled code (assembly succeeded)
   **When** I click File > Export Binary (.bin)
   **Then** a file download is triggered

2. **And** the downloaded file contains the assembled binary data exactly

3. **And** the filename defaults to "program.bin"

4. **Given** no assembly has been performed yet (or the last assembly failed)
   **When** I click File > Export Binary (.bin)
   **Then** the status bar shows "No binary to export — assemble first" instead of downloading

5. **And** the exported binary matches the data shown in the Binary Output panel (NFR17)

## Tasks / Subtasks

- [x] Task 1: Add binary export menu item and callback (AC: #1)
  - [x] 1.1: In `MENU_STRUCTURE.file`, add `{ id: 'exportBinary', label: 'Export Binary (.bin)' }` after the `exportAssembly` item
  - [x] 1.2: In `MenuBarCallbacks` interface, add `onFileExportBinary: () => void`
  - [x] 1.3: In `handleFileMenuClick`, add case `'exportBinary'` dispatching `this.callbacks.onFileExportBinary()`
  - [x] 1.4: In App.ts, add callback wiring: `onFileExportBinary: () => this.handleExportBinary()`

- [x] Task 2: Create binary download utility (AC: #1, #2, #3, #5)
  - [x] 2.1: In `src/state/fileExport.ts`, add named export `downloadBinaryFile(data: Uint8Array, filename: string): void`
  - [x] 2.2: Create `Blob` with MIME type `application/octet-stream`
  - [x] 2.3: Create object URL via `URL.createObjectURL(blob)`
  - [x] 2.4: Create temporary `<a>` element, set `href` to object URL, set `download` to `filename`
  - [x] 2.5: Append to `document.body`, trigger `click()` inside try/finally, then remove and call `URL.revokeObjectURL(url)`

- [x] Task 3: Implement export handler in App.ts (AC: #1, #2, #3, #4)
  - [x] 3.1: Create `private handleExportBinary(): void` method
  - [x] 3.2: Get last assembly result via `this.lastAssembleResult`
  - [x] 3.3: Guard: if `!this.lastAssembleResult?.success || !this.lastAssembleResult?.binary`, call `this.statusBar?.updateState({ loadStatus: 'No binary to export — assemble first' })` and return
  - [x] 3.4: Call `downloadBinaryFile(this.lastAssembleResult.binary, 'program.bin')` inside try/catch
  - [x] 3.5: On success: `this.statusBar?.updateState({ loadStatus: 'Exported: program.bin' })`
  - [x] 3.6: On catch: `this.statusBar?.updateState({ loadStatus: 'Export failed' })`

- [x] Task 4: Update barrel export (AC: all)
  - [x] 4.1: In `src/state/index.ts`, add `downloadBinaryFile` to the fileExport barrel export

- [x] Task 5: Write tests (AC: all)
  - [x] 5.1: `fileExport.test.ts` — Test `downloadBinaryFile` creates Blob with correct content and MIME type `application/octet-stream`
  - [x] 5.2: `fileExport.test.ts` — Test anchor element `download` attribute set to given filename
  - [x] 5.3: `fileExport.test.ts` — Test `URL.revokeObjectURL` called after click
  - [x] 5.4: `fileExport.test.ts` — Test cleanup still happens if click() throws (try/finally)
  - [x] 5.5: `fileExport.test.ts` — Test binary content is preserved exactly (verify Uint8Array bytes in Blob)
  - [x] 5.6: `MenuBar.test.ts` — Test "Export Binary (.bin)" menu item renders with correct label
  - [x] 5.7: `MenuBar.test.ts` — Test clicking export binary item triggers `onFileExportBinary` callback
  - [x] 5.8: `App.test.ts` — Test `handleExportBinary` calls `downloadBinaryFile` with binary data and "program.bin"
  - [x] 5.9: `App.test.ts` — Test no assembly result shows "No binary to export — assemble first" in status bar
  - [x] 5.10: `App.test.ts` — Test failed assembly shows "No binary to export — assemble first"
  - [x] 5.11: `App.test.ts` — Test status bar shows "Exported: program.bin" after successful export

## Dev Notes

### Architecture Context

**From architecture.md:** Tiered persistence strategy:
- Settings (small, frequent) → localStorage ✅ Done in Story 9.1
- Projects (larger, less frequent) → IndexedDB ✅ Done in Story 9.2
- Session restore → ✅ Done in Story 9.3
- Export files → File API (.asm text, .bin binary)
  - Assembly export ✅ Done in Story 9.4
  - **Binary export → THIS STORY**

This story implements FR34 (User can export assembled binary as file) and contributes to NFR17 (Exported files are valid and re-importable).

### What's Already Implemented (DO NOT DUPLICATE)

**Story 9.4 established the export pattern:**
- `downloadTextFile(content, filename)` in `src/state/fileExport.ts` — text export utility
- `handleExportAssembly()` in App.ts — assembly export handler with try/catch
- `onFileExportAssembly` callback in MenuBarCallbacks interface
- Menu item `exportAssembly` with label "Export Assembly (.asm)" and shortcut Ctrl+Shift+E
- Barrel export in `src/state/index.ts`
- Comprehensive test patterns in `fileExport.test.ts` and `App.test.ts`

**Binary data is already available in App.ts:**
- `private lastAssembleResult: AssembleResult | null = null;` (App.ts:150)
- Populated after successful assembly: `this.lastAssembleResult = result;` (App.ts:2808)
- Public getter: `getLastAssembleResult(): AssembleResult | null` (App.ts:2931)
- Type: `AssembleResult.binary` is `Uint8Array | null` (from `src/emulator/types.ts`)

**BinaryOutputPanel already displays the binary:**
- `setBinary(data: Uint8Array | null)` receives binary after assembly
- Displays as hex dump, 16 bytes per row
- The export should produce the same bytes shown in this panel (AC #5)

**MenuBar current File menu structure (after 9.4):**
```
File
├── New                         Ctrl+N
├── Open...                     Ctrl+O
├── Save                        Ctrl+S
├── Save As...                  Ctrl+Shift+S
├── ──────────────────
├── Export Assembly (.asm)      Ctrl+Shift+E  ← Story 9.4
├── Import Binary...                          ← Placeholder (Story 9.6)
├── ──────────────────
└── Examples...                 ►
```

### Critical Code Paths

#### Binary Download Utility (New — parallel to text download)

```typescript
// src/state/fileExport.ts — ADD alongside existing downloadTextFile
export function downloadBinaryFile(data: Uint8Array, filename: string): void {
  const blob = new Blob([data], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  try {
    a.click();
  } finally {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
```

**Why `application/octet-stream`**: Standard MIME type for binary data. Prevents browser from interpreting the content (unlike `text/plain`).

**Why `Uint8Array` directly into Blob**: `new Blob([uint8Array])` creates a blob from the raw bytes. No encoding issues — the bytes are preserved exactly.

#### Export Handler in App.ts

```typescript
private handleExportBinary(): void {
  const result = this.lastAssembleResult;
  if (!result?.success || !result?.binary) {
    this.statusBar?.updateState({ loadStatus: 'No binary to export — assemble first' });
    return;
  }
  try {
    downloadBinaryFile(result.binary, 'program.bin');
    this.statusBar?.updateState({ loadStatus: 'Exported: program.bin' });
  } catch {
    this.statusBar?.updateState({ loadStatus: 'Export failed' });
  }
}
```

#### Menu Item Addition

```typescript
// In MENU_STRUCTURE.file, add after exportAssembly:
{ id: 'exportAssembly', label: 'Export Assembly (.asm)', shortcut: 'Ctrl+Shift+E' },
{ id: 'exportBinary', label: 'Export Binary (.bin)' },  // ← ADD THIS
{ id: 'import', label: 'Import Binary...' },
```

#### Callback Interface Addition

```typescript
// In MenuBarCallbacks interface:
onFileExportAssembly: () => void;
onFileExportBinary: () => void;  // ← ADD THIS
```

#### handleFileMenuClick Addition

```typescript
// In handleFileMenuClick switch:
case 'exportAssembly':
  this.callbacks.onFileExportAssembly();
  break;
case 'exportBinary':                        // ← ADD THIS
  this.callbacks.onFileExportBinary();      // ← ADD THIS
  break;                                    // ← ADD THIS
```

### Menu Structure After This Story

```
File
├── New                         Ctrl+N
├── Open...                     Ctrl+O
├── Save                        Ctrl+S
├── Save As...                  Ctrl+Shift+S
├── ──────────────────
├── Export Assembly (.asm)      Ctrl+Shift+E  ← Story 9.4
├── Export Binary (.bin)                      ← THIS STORY
├── Import Binary...                          ← Placeholder (Story 9.6)
├── ──────────────────
└── Examples...                 ►
```

### Edge Cases to Handle

1. **No assembly performed**: Show "No binary to export — assemble first" status message; don't trigger download
2. **Last assembly failed**: `lastAssembleResult.success` is false or `binary` is null — same guard as #1
3. **Empty binary (0 bytes)**: Theoretically possible if assembler produces no output — treat as valid, export 0-byte .bin file
4. **Large binary**: Blob handles arbitrarily large `Uint8Array` content; no size limit needed
5. **Multiple rapid exports**: Each export creates and revokes its own URL; no state conflicts
6. **Re-importability (NFR17)**: Binary is exported byte-for-byte identical to assembler output. Re-importing with `LOAD_PROGRAM` should produce identical execution.
7. **Export after re-assembly**: If user changes code and re-assembles, `lastAssembleResult` is updated automatically. Export always uses the latest assembly result.

### Testing Strategy

**`src/state/fileExport.test.ts`** (EXISTING — add new describe block):
- Add `describe('downloadBinaryFile', ...)` alongside existing `describe('downloadTextFile', ...)`
- Test Blob creation with `application/octet-stream` MIME type
- Test `Uint8Array` content preserved in Blob
- Test filename set correctly
- Test try/finally cleanup on error
- Reuse the same mock setup patterns from `downloadTextFile` tests

**`src/ui/MenuBar.test.ts`** (EXISTING — add tests):
- Verify "Export Binary (.bin)" label renders in File menu
- Verify click dispatches `onFileExportBinary` callback

**`src/ui/App.test.ts`** (EXISTING — add tests):
- Mock `downloadBinaryFile` module (add to existing `vi.hoisted` + `vi.mock` block)
- Set `lastAssembleResult` via the existing mock assembler
- Test successful binary export with correct data and filename
- Test "No binary to export — assemble first" when no assembly result
- Test "No binary to export — assemble first" when assembly failed
- Test status bar shows "Exported: program.bin" on success

### Previous Story Learnings (from Story 9.4 review)

**DO follow these patterns established in 9.4 and improved in review:**
- Use try/finally in download utility for cleanup safety
- Use try/catch in App.ts handler for user error feedback
- In tests: narrow `document.createElement` mock to only intercept `'a'` tag
- In tests: intercept Blob constructor to verify content directly
- In tests: add error scenario test (click throws → cleanup happens)
- Use `vi.hoisted()` for mock functions referenced in `vi.mock()` factory

**DON'T repeat these mistakes from 9.4 (already fixed in review):**
- ❌ Don't use overly broad `document.createElement` mock
- ❌ Don't skip error handling in download utility or handler
- ❌ Don't rely only on `blob.size` for content verification

### Accessibility Checklist

- [x] **Keyboard Navigation** — Menu item accessible via keyboard (already handled by MenuBar keyboard nav)
- [x] **ARIA Attributes** — Menu item has `role="menuitem"` (existing MenuBar behavior)
- [x] **Focus Management** — N/A (download doesn't change focus)
- [x] **Color Contrast** — N/A (no new UI elements; status message uses existing theme)
- [x] **XSS Prevention** — N/A (filename "program.bin" is hardcoded; no user content in HTML)
- [x] **Screen Reader Announcements** — Status bar `loadStatus` update announces via existing `aria-live` region

### Project Structure Notes

**Modified Files:**
- `src/state/fileExport.ts` — Add `downloadBinaryFile` alongside existing `downloadTextFile`
- `src/state/index.ts` — Add `downloadBinaryFile` to barrel export
- `src/ui/MenuBar.ts` — Add `exportBinary` menu item + `onFileExportBinary` callback + switch case
- `src/ui/App.ts` — Implement `handleExportBinary()`, add callback wiring, add `downloadBinaryFile` import

**Test File Updates:**
- `src/state/fileExport.test.ts` — Add `describe('downloadBinaryFile', ...)` test block
- `src/ui/MenuBar.test.ts` — Add 2 export binary menu tests, add `onFileExportBinary` mock
- `src/ui/App.test.ts` — Add `mockDownloadBinaryFile` to `vi.hoisted` mock, add 4 export binary handler tests

### References

- [Source: architecture.md#Persistence] — File API for export files: `.asm` (text), `.bin` (binary)
- [Source: prd.md#FR34] — User can export assembled binary as file
- [Source: prd.md#NFR17] — Exported files are valid and re-importable
- [Source: epics.md#Epic-9] — Work Persistence: export/import .asm/.bin files
- [Source: emulator/types.ts:AssembleResult] — `binary: Uint8Array | null` type definition
- [Source: App.ts:lastAssembleResult] — Binary data storage (line ~150)
- [Source: App.ts:getLastAssembleResult] — Public getter for assembly result (line ~2931)
- [Source: BinaryOutputPanel.ts:setBinary] — How binary is displayed in hex dump view
- [Source: fileExport.ts:downloadTextFile] — Existing text export pattern to parallel
- [Source: MenuBar.ts:MENU_STRUCTURE] — Current File menu items with exportAssembly
- [Source: MenuBar.ts:MenuBarCallbacks] — Current callback interface with onFileExportAssembly
- [Source: MenuBar.ts:handleFileMenuClick] — Menu action dispatch switch statement
- [Source: Story 9.4 review] — try/finally for cleanup, try/catch for error handling, improved test patterns

## Code Review Record

### Review Model
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Issues Found: 5 (1 HIGH, 1 MEDIUM, 3 LOW)

| # | Severity | File | Issue | Fix |
|---|----------|------|-------|-----|
| L1 | HIGH | App.test.ts | Missing test for `handleExportBinary` catch branch (`'Export failed'` status bar message) — parallel `handleExportAssembly` tests had this but binary export didn't | Added async test that mocks `mockDownloadBinaryFile` to throw, verifies status bar shows "Export failed" |
| L2 | MEDIUM | fileExport.test.ts:245 | Misleading `as ArrayBuffer` type assertion — `blobData` is `Uint8Array`, not `ArrayBuffer`. Cast works by accident but is type-incorrect | Changed to `blobData as Uint8Array` to match actual type |
| L3 | LOW | fileExport.test.ts | ~30 lines of duplicate mock setup between `downloadTextFile` and `downloadBinaryFile` describe blocks | Won't fix — consistent with established pattern, blocks have minor differences in Blob capture |
| L4 | LOW | fileExport.ts | DRY opportunity: `downloadBinaryFile` and `downloadTextFile` share identical structure, could use shared internal helper | Won't fix — simplicity > DRY for 2 small functions |
| L5 | LOW | App.test.ts | No `toHaveBeenCalledTimes(1)` assertion in test 5.8 — test would pass even if called multiple times | Won't fix — consistent with existing 9.4 pattern |

### Post-Review Test Results
- 90 files, 3660 tests pass (+1 from L1 fix), zero regressions
- TypeScript compiles clean (`npx tsc --noEmit` passes)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- fileExport.ts: Fixed TS 5.7+ `Uint8Array<ArrayBufferLike>` not assignable to `BlobPart` — used `as Uint8Array<ArrayBuffer>` cast

### Completion Notes List

- All 5 tasks completed with all subtasks
- 15 new tests total (8 fileExport, 2 MenuBar, 5 App) — +1 from code review L1 fix
- Full test suite: 90 files, 3660 tests pass, zero regressions
- TypeScript compiles clean (`npx tsc --noEmit` passes)
- Follows all patterns established in Story 9.4 and improved in its code review: try/finally cleanup, try/catch error handling, narrowed createElement mock, Blob constructor interception, error scenario tests

### Change Log

| File | Change |
|------|--------|
| `src/state/fileExport.ts` | Added `downloadBinaryFile(data, filename)` utility using Blob with `application/octet-stream` MIME type |
| `src/state/index.ts` | Added `downloadBinaryFile` to barrel export |
| `src/ui/MenuBar.ts` | Added `exportBinary` menu item, `onFileExportBinary` callback, `handleFileMenuClick` case |
| `src/ui/App.ts` | Implemented `handleExportBinary()` method, added callback wiring, added `downloadBinaryFile` import |
| `src/state/fileExport.test.ts` | Added `describe('downloadBinaryFile', ...)` with 8 tests |
| `src/ui/MenuBar.test.ts` | Added `onFileExportBinary` mock, added 2 export binary menu tests |
| `src/ui/App.test.ts` | Added `mockDownloadBinaryFile` to `vi.hoisted` mock, added 5 export binary handler tests (4 dev + 1 review L1 fix) |

### File List

- `src/state/fileExport.ts` (MODIFIED)
- `src/state/fileExport.test.ts` (MODIFIED)
- `src/state/index.ts` (MODIFIED)
- `src/ui/MenuBar.ts` (MODIFIED)
- `src/ui/MenuBar.test.ts` (MODIFIED)
- `src/ui/App.ts` (MODIFIED)
- `src/ui/App.test.ts` (MODIFIED)
