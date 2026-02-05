# Story 9.6: Import Assembly Code

Status: done

## Story

As a user,
I want to import assembly files,
so that I can work on existing code.

## Acceptance Criteria

1. **Given** I click File > Import Assembly (.asm)
   **When** I select a .asm file from the file picker
   **Then** the file content loads into the editor

2. **And** the status bar shows "Imported: <filename>" with the actual filename

3. **Given** I have unsaved code in the editor
   **When** I click File > Import Assembly (.asm)
   **Then** a confirmation dialog warns me before replacing content

4. **Given** I click Import and then cancel the file picker
   **When** the file picker closes without selection
   **Then** nothing happens — editor content is preserved

5. **And** if a file read fails, the status bar shows "Import failed"

## Tasks / Subtasks

- [x] Task 1: Fix menu item label (AC: #1)
  - [x] 1.1: In `MENU_STRUCTURE.file`, change `{ id: 'import', label: 'Import Binary...' }` to `{ id: 'import', label: 'Import Assembly (.asm)' }`

- [x] Task 2: Create file import utility (AC: #1, #4, #5)
  - [x] 2.1: Create `src/state/fileImport.ts` with named export `readTextFile(accept?: string): Promise<{ content: string; filename: string } | null>`
  - [x] 2.2: Create hidden `<input type="file">` element, set `type='file'`, `accept` attribute, `style.display='none'`
  - [x] 2.3: Listen for `change` event: read file via `file.text()` (async), resolve `{ content, filename }`
  - [x] 2.4: Listen for `cancel` event: resolve `null` (user dismissed file picker)
  - [x] 2.5: Append input to `document.body`, call `input.click()` to open picker
  - [x] 2.6: Clean up: remove input from DOM in `change` handler's `finally` block and in `cancel` handler

- [x] Task 3: Implement import handler in App.ts (AC: #1, #2, #3, #4, #5)
  - [x] 3.1: Create `private async handleImportAssembly(): Promise<void>` method
  - [x] 3.2: Check editor content: if `currentContent.trim().length > 0`, show `window.confirm('Importing a file will replace your current code.\n\nAre you sure you want to continue?')`
  - [x] 3.3: If user declines confirm, return (preserve existing code)
  - [x] 3.4: Call `readTextFile('.asm,.txt')` to open file picker
  - [x] 3.5: If result is `null` (cancelled), return silently
  - [x] 3.6: Set editor content: `this.editor.setValue(result.content)`
  - [x] 3.7: Update status: `this.statusBar?.updateState({ loadStatus: \`Imported: ${result.filename}\` })`
  - [x] 3.8: Wrap in try/catch: on error, `this.statusBar?.updateState({ loadStatus: 'Import failed' })`
  - [x] 3.9: Update callback wiring: `onFileImport: () => this.handleImportAssembly()`

- [x] Task 4: Update barrel export (AC: all)
  - [x] 4.1: In `src/state/index.ts`, add `export { readTextFile } from './fileImport'`

- [x] Task 5: Write tests (AC: all)
  - [x] 5.1: `fileImport.test.ts` — Test creates file input with `type='file'` and correct `accept` attribute
  - [x] 5.2: `fileImport.test.ts` — Test returns `{ content, filename }` when file is selected
  - [x] 5.3: `fileImport.test.ts` — Test returns `null` when cancel event fires
  - [x] 5.4: `fileImport.test.ts` — Test removes input element from DOM after file selection
  - [x] 5.5: `fileImport.test.ts` — Test removes input element from DOM after cancel
  - [x] 5.6: `fileImport.test.ts` — Test rejects promise when file.text() throws
  - [x] 5.7: `MenuBar.test.ts` — Test menu item label is "Import Assembly (.asm)" (verify label update from "Import Binary...")
  - [x] 5.8: `App.test.ts` — Test successful import loads content into editor and shows "Imported: <filename>" in status bar
  - [x] 5.9: `App.test.ts` — Test confirmation dialog appears when editor has existing content
  - [x] 5.10: `App.test.ts` — Test import cancelled when user declines confirmation dialog
  - [x] 5.11: `App.test.ts` — Test no confirmation dialog when editor is empty
  - [x] 5.12: `App.test.ts` — Test import cancelled gracefully when file picker returns null
  - [x] 5.13: `App.test.ts` — Test status bar shows "Import failed" when readTextFile throws

## Dev Notes

### Architecture Context

**From architecture.md:** Tiered persistence strategy:
- Settings (small, frequent) → localStorage ✅ Done in Story 9.1
- Projects (larger, less frequent) → IndexedDB ✅ Done in Story 9.2
- Session restore → ✅ Done in Story 9.3
- Export files → File API (.asm text, .bin binary)
  - Assembly export ✅ Done in Story 9.4
  - Binary export ✅ Done in Story 9.5
  - **Assembly import → THIS STORY**

This story implements FR34 (User can import assembly code from file) and contributes to NFR17 (Exported files are valid and re-importable).

### What's Already Implemented (DO NOT DUPLICATE)

**File export utilities in `src/state/fileExport.ts`:**
- `downloadTextFile(content, filename)` — text export (Story 9.4)
- `downloadBinaryFile(data, filename)` — binary export (Story 9.5)
- Pattern: Blob → createObjectURL → hidden anchor → click → cleanup via try/finally

**The import utility goes in a NEW file `src/state/fileImport.ts`** — separate from exports because import uses `<input type="file">` (fundamentally different from Blob/anchor download pattern).

**Menu item already exists as placeholder:**
```
{ id: 'import', label: 'Import Binary...' }  // ← WRONG LABEL — change to 'Import Assembly (.asm)'
```

**Callback already wired as placeholder in App.ts:**
```typescript
onFileImport: () => { /* Epic 9: File Operations */ },  // line ~494
```

**handleFileMenuClick already has case:**
```typescript
case 'import':
  this.callbacks.onFileImport();
  break;
```

**Editor has setValue/getValue (used by handleExampleSelect):**
```typescript
this.editor.setValue(source);  // Sets editor content
this.editor?.getValue() ?? ''; // Gets current content
```

**Existing unsaved work confirmation pattern (from handleExampleSelect, line ~3044):**
```typescript
const currentContent = this.editor?.getValue() ?? '';
if (currentContent.trim().length > 0) {
  const confirmed = window.confirm(
    `Loading "${program.name}" will replace your current code.\n\nAre you sure you want to continue?`
  );
  if (!confirmed) {
    return;
  }
}
```
**Use this exact pattern for import confirmation.** Story 9.7 will implement the comprehensive unsaved work warning system — this story uses the minimal `window.confirm` approach already established.

**StatusBar renders `loadStatus` via `textContent` (line 359 of StatusBar.ts):**
- Inherently XSS-safe — no escaping needed for user filenames
- Display pattern: `Imported: <filename>` using template literal

**Barrel export in `src/state/index.ts`:**
```typescript
// File export utilities (Story 9.4, 9.5)
export { downloadTextFile, downloadBinaryFile } from './fileExport';
// ← ADD import utility here
```

### Critical Code Paths

#### File Import Utility (NEW — `src/state/fileImport.ts`)

```typescript
// src/state/fileImport.ts
/**
 * Open a file picker and read the selected text file.
 * Returns { content, filename } on success, null if user cancels.
 */
export function readTextFile(
  accept: string = '.asm,.txt'
): Promise<{ content: string; filename: string } | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.style.display = 'none';

    const cleanup = () => {
      document.body.removeChild(input);
    };

    input.addEventListener('change', async () => {
      try {
        const file = input.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        const content = await file.text();
        resolve({ content, filename: file.name });
      } catch (error) {
        reject(error);
      } finally {
        cleanup();
      }
    });

    input.addEventListener('cancel', () => {
      cleanup();
      resolve(null);
    });

    document.body.appendChild(input);
    input.click();
  });
}
```

**Why `<input type="file">`**: Standard File API pattern per architecture.md. No third-party libraries needed.

**Why `file.text()`**: Modern async API (supported in all target browsers). Returns a Promise<string> directly — cleaner than FileReader.

**Why `cancel` event**: Fires when user dismisses file picker without selecting a file (Chrome 103+, Firefox 91+, Safari 16.4+). Resolves Promise as `null` for clean caller handling.

**Why separate from fileExport.ts**: Import uses `<input type="file">` + event listeners + async file reading — fundamentally different from export's Blob/anchor/click pattern. Separate files = clearer responsibility.

#### Import Handler in App.ts

```typescript
private async handleImportAssembly(): Promise<void> {
  // Confirm replacement of existing content (same pattern as handleExampleSelect)
  const currentContent = this.editor?.getValue() ?? '';
  if (currentContent.trim().length > 0) {
    const confirmed = window.confirm(
      'Importing a file will replace your current code.\n\nAre you sure you want to continue?'
    );
    if (!confirmed) {
      return;
    }
  }

  try {
    const result = await readTextFile('.asm,.txt');
    if (!result) {
      return; // User cancelled file picker
    }

    if (this.editor) {
      this.editor.setValue(result.content);
      this.statusBar?.updateState({ loadStatus: `Imported: ${result.filename}` });
    }
  } catch {
    this.statusBar?.updateState({ loadStatus: 'Import failed' });
  }
}
```

#### Menu Item Label Fix

```typescript
// In MENU_STRUCTURE.file — CHANGE the label:
{ id: 'exportBinary', label: 'Export Binary (.bin)' },
{ id: 'import', label: 'Import Assembly (.asm)' },  // ← WAS "Import Binary..."
{ id: 'sep2', label: '', separator: true },
```

#### Callback Wiring Fix

```typescript
// In App.ts callback object — REPLACE the placeholder:
onFileImport: () => this.handleImportAssembly(),  // ← WAS { /* Epic 9: File Operations */ }
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
├── Export Binary (.bin)                      ← Story 9.5
├── Import Assembly (.asm)                    ← THIS STORY (was "Import Binary...")
├── ──────────────────
└── Examples...                 ►
```

### Edge Cases to Handle

1. **Empty editor**: No confirmation dialog — proceed directly to file picker
2. **User cancels confirmation**: Return immediately, preserve existing code
3. **User cancels file picker**: `readTextFile` returns `null` — return silently
4. **File read failure**: Catch error, show "Import failed" in status bar
5. **Large file**: `file.text()` handles arbitrarily large files; no size limit needed
6. **Non-UTF-8 file**: `file.text()` decodes as UTF-8 by default. Binary files will appear garbled but won't crash
7. **Re-importability (NFR17)**: An exported .asm file from Story 9.4 can be imported here — round-trip preservation
8. **File with no extension**: Accept filter is a hint, not enforced. Browsers may allow any file. Content is still loaded as text.
9. **Multiple imports**: Each import creates and removes its own input element; no state conflicts

### Testing Strategy

**`src/state/fileImport.test.ts`** (NEW FILE):
- Test input element creation with `type='file'` and `accept` attribute
- Test resolves `{ content, filename }` on file selection
- Test resolves `null` on cancel
- Test DOM cleanup in both paths
- Test rejects on file.text() failure
- Mock pattern: `document.createElement` spy (same narrowed pattern as fileExport tests), mock `File` objects with `text()` method

**`src/ui/MenuBar.test.ts`** (EXISTING — update):
- Verify "Import Assembly (.asm)" label renders in File menu (was "Import Binary...")
- Existing `onFileImport` mock is already present — no new mock needed

**`src/ui/App.test.ts`** (EXISTING — add tests):
- Mock `readTextFile` module via `vi.hoisted()` + `vi.mock()` pattern (same as `downloadTextFile`/`downloadBinaryFile`)
- Mock `window.confirm` for unsaved work dialog
- Test successful import: content in editor + status message
- Test confirm dialog appears with content, not with empty editor
- Test import cancelled on confirm decline
- Test import cancelled on null from readTextFile
- Test error handling on readTextFile throw

### Previous Story Learnings (from Stories 9.4 + 9.5)

**DO follow these patterns:**
- try/catch in App.ts handler for user error feedback via status bar
- `vi.hoisted()` for mock functions referenced in `vi.mock()` factory
- Narrow `document.createElement` mock to only intercept specific tag
- Always test error scenarios (catch branches)
- Status messages follow pattern: `'Imported: <filename>'`, `'Import failed'`

**DON'T repeat these mistakes:**
- Don't use overly broad `document.createElement` mock
- Don't skip error handling in handler
- Don't forget cleanup in finally blocks
- Don't cast to wrong types in tests (9.5 L2 fix)

### Accessibility Checklist

- [x] **Keyboard Navigation** — Menu item accessible via keyboard (existing MenuBar keyboard nav); file picker is native browser dialog (accessible by default)
- [x] **ARIA Attributes** — Menu item has `role="menuitem"` (existing MenuBar behavior); confirmation dialog is native `window.confirm` (accessible by default)
- [x] **Focus Management** — Native file picker manages its own focus; focus returns to page after picker closes
- [x] **Color Contrast** — N/A (no new UI elements; status message uses existing theme)
- [x] **XSS Prevention** — StatusBar uses `textContent` for `loadStatus` (inherently safe); filename from File API is not injected into HTML
- [x] **Screen Reader Announcements** — Status bar `loadStatus` update announces via existing `aria-live` region

### Project Structure Notes

**New File:**
- `src/state/fileImport.ts` — File import utility (readTextFile)
- `src/state/fileImport.test.ts` — Tests for file import utility

**Modified Files:**
- `src/state/index.ts` — Add `readTextFile` barrel export from `fileImport`
- `src/ui/MenuBar.ts` — Fix menu item label: "Import Binary..." → "Import Assembly (.asm)"
- `src/ui/App.ts` — Implement `handleImportAssembly()`, add `readTextFile` import, update callback wiring

**Test File Updates:**
- `src/state/fileImport.test.ts` — New file with 6 tests
- `src/ui/MenuBar.test.ts` — Update/add 1 test for label verification
- `src/ui/App.test.ts` — Add `mockReadTextFile` to `vi.hoisted` mock, add 6 import handler tests

### References

- [Source: architecture.md#Persistence] — File API for import/export: `.asm` (text), `.bin` (binary)
- [Source: prd.md#FR34] — User can import assembly code from file
- [Source: prd.md#NFR17] — Exported files are valid and re-importable
- [Source: epics.md#Epic-9] — Work Persistence: export/import .asm/.bin files
- [Source: App.ts:handleExampleSelect] — Existing unsaved work confirmation pattern (line ~3040)
- [Source: App.ts:onFileImport] — Existing placeholder callback (line ~494)
- [Source: MenuBar.ts:MENU_STRUCTURE] — Current "Import Binary..." label to fix
- [Source: MenuBar.ts:handleFileMenuClick] — Existing `case 'import'` dispatch
- [Source: StatusBar.ts:359] — `loadStatus` rendered via `textContent` (XSS-safe)
- [Source: Editor.ts:setValue] — Method to set editor content (line ~357)
- [Source: Editor.ts:getValue] — Method to get editor content (line ~349)
- [Source: fileExport.ts] — Export utilities pattern (NOT to duplicate — import is separate)
- [Source: Story 9.4/9.5 reviews] — try/catch for error handling, narrowed mocks, test error scenarios

## Code Review Record

### Review Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Issues Found: 6 (1 HIGH, 2 MEDIUM, 3 LOW)

| # | Severity | File | Issue | Fix |
|---|----------|------|-------|-----|
| L1 | HIGH | `MenuBar.test.ts` | Missing callback firing test for import menu item — inconsistent with export tests | Added `onFileImport` callback firing test (+1 test) |
| L2 | MEDIUM | `fileImport.test.ts` | Missing test for `!file` branch (change fires with empty files) | Added test for change event with empty FileList (+1 test) |
| L3 | MEDIUM | `fileImport.ts` | Cancel handler lacks try-finally — if cleanup throws, resolve(null) never fires | Wrapped cancel handler body in try-finally |
| L4 | LOW | `fileImport.test.ts` | `changeHandler` type `(() => void)` loses Promise — should be `(() => Promise<void>)` | Fixed type annotation and cast |
| L5 | LOW | `App.test.ts` | Test 5.12 (null cancel) missing negative assertion on status bar | Added `not.toContain('Imported:')` assertion |
| L6 | LOW | `App.test.ts` | Test 5.9 (confirm dialog) doesn't verify import proceeds after confirmation | Added setValue + status bar assertions after confirm |

### Post-Review Test Results

- 91 files, 3675 tests pass (was 3673 pre-review, +2 from L1 and L2)
- TypeScript compiles clean
- Zero regressions

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- fileImport.test.ts: JSDOM `File` object lacks `.text()` method — used mock objects with `text: vi.fn().mockResolvedValue(...)` instead of `new File()`

### Completion Notes List

- All 5 tasks completed with all subtasks
- 15 new tests total after review (7 fileImport, 2 MenuBar, 6 App)
- Full test suite: 91 files, 3675 tests pass, zero regressions
- TypeScript compiles clean (`npx tsc --noEmit` passes)
- Follows all patterns established in Stories 9.4/9.5: try/catch handler, `vi.hoisted()` mocks, narrowed createElement mock, cleanup via finally, error scenario tests
- Fixed incorrect menu item label "Import Binary..." → "Import Assembly (.asm)"

### Change Log

| File | Change |
|------|--------|
| `src/ui/MenuBar.ts` | Fixed menu item label: "Import Binary..." → "Import Assembly (.asm)" |
| `src/state/fileImport.ts` | Created `readTextFile(accept?)` utility using `<input type="file">` + `file.text()` + `cancel` event |
| `src/state/index.ts` | Added `readTextFile` barrel export from `fileImport` |
| `src/ui/App.ts` | Implemented `handleImportAssembly()` with confirm dialog, import from `readTextFile`, callback wiring |
| `src/state/fileImport.test.ts` | Created 6 tests: input creation, file selection, cancel, DOM cleanup (both paths), read failure |
| `src/ui/MenuBar.test.ts` | Added 1 test: "Import Assembly (.asm)" label verification |
| `src/ui/App.test.ts` | Added `mockReadTextFile` to `vi.hoisted` mock, added 6 import handler tests |

### File List

- `src/state/fileImport.ts` (NEW)
- `src/state/fileImport.test.ts` (NEW)
- `src/state/index.ts` (MODIFIED)
- `src/ui/MenuBar.ts` (MODIFIED)
- `src/ui/MenuBar.test.ts` (MODIFIED)
- `src/ui/App.ts` (MODIFIED)
- `src/ui/App.test.ts` (MODIFIED)
