# Story 3.3: Implement Assemble Button

Status: done

---

## Story

As a user,
I want to assemble my code with one click,
So that I can quickly test my programs.

## Acceptance Criteria

1. **Given** I have code in the editor
   **When** I click the Assemble button
   **Then** the code is sent to the assembler worker

2. **And** a loading indicator appears briefly
   **When** assembly is in progress
   **Then** the status bar shows "Assembling..."

3. **And** on success, the status bar shows "✓ Assembled: X bytes"
   **And** the Run, Step, and Reset buttons become enabled

4. **And** Ctrl+Enter also triggers assembly
   **When** I press Ctrl+Enter in the editor
   **Then** the same assembly flow is triggered

## Tasks / Subtasks

- [x] Task 1: Wire Assemble Button to AssemblerBridge (AC: #1)
  - [x] 1.1 Import `AssemblerBridge` from `@emulator/index` in `App.ts`
  - [x] 1.2 Create `AssemblerBridge` instance as class member
  - [x] 1.3 Call `assemblerBridge.init()` during `initializeEditor()` (after editor ready)
  - [x] 1.4 Implement `handleAssemble()` method that gets editor content and calls `assemblerBridge.assemble()`
  - [x] 1.5 Wire `onAssembleClick` callback in `initializeToolbar()` to `handleAssemble()`
  - [x] 1.6 Wire `onDebugAssemble` callback in `initializeMenuBar()` to same handler

- [x] Task 2: Implement Assembly Status Flow (AC: #2, #3)
  - [x] 2.1 Before calling `assemble()`: Update status bar to `assembling` state
  - [x] 2.2 Before calling `assemble()`: Disable Assemble button (prevent double-click)
  - [x] 2.3 On success: Update status bar to `success` with byte count message
  - [x] 2.4 On success: Store binary result for later use (new `lastAssembleResult` member)
  - [x] 2.5 On success: Enable Run, Step, Reset buttons via `toolbar.updateState()`
  - [x] 2.6 On error: Update status bar to `error` with error message (basic - Story 3.4 handles rich errors)
  - [x] 2.7 Always: Re-enable Assemble button after operation completes

- [x] Task 3: Enable Assemble Button on Editor Content (AC: #1)
  - [x] 3.1 Add `onContentChange` callback to Editor component
  - [x] 3.2 Wire callback to enable/disable Assemble button based on content
  - [x] 3.3 Enable Assemble button when editor has content (`canAssemble: true`)
  - [x] 3.4 Disable Assemble button when editor is empty

- [x] Task 4: Implement Ctrl+Enter Keyboard Shortcut (AC: #4)
  - [x] 4.1 Add Monaco editor action for Ctrl+Enter with `'assemble'` command ID
  - [x] 4.2 Register keybinding: `monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter`
  - [x] 4.3 Action handler calls same `handleAssemble()` method via App callback
  - [x] 4.4 Add to keyboard shortcuts dialog (if not already listed)

- [x] Task 5: Write Comprehensive Tests (AC: all)
  - [x] 5.1 Test clicking Assemble button triggers assembly flow
  - [x] 5.2 Test status bar shows "Assembling..." during operation
  - [x] 5.3 Test successful assembly shows "✓ Assembled: X bytes"
  - [x] 5.4 Test successful assembly enables Run/Step/Reset buttons
  - [x] 5.5 Test error assembly shows error message
  - [x] 5.6 Test Ctrl+Enter triggers assembly
  - [x] 5.7 Test Assemble button disabled during assembly
  - [x] 5.8 Test Assemble button disabled when editor empty

- [x] Task 6: Verify Build and Tests (AC: all)
  - [x] 6.1 Run `npm test` - all tests pass (583 tests)
  - [x] 6.2 Run `npm run build` - no errors
  - [x] 6.3 Manual verification in browser

---

## Dev Notes

### Previous Story Intelligence (Story 3.2)

**Critical Assets Created:**
- `src/emulator/AssemblerBridge.ts` (215 lines) - Promise-based worker API
- `src/emulator/assembler.worker.ts` (201 lines) - Web Worker with WASM loading
- `src/emulator/types.ts` - All TypeScript interfaces

**AssemblerBridge API (USE THIS - DO NOT RECREATE):**
```typescript
import { AssemblerBridge } from '@emulator/index';
import type { AssembleResult, AssemblerError } from '@emulator/index';

// Create and initialize bridge (once at app startup)
const bridge = new AssemblerBridge();
await bridge.init();  // Awaits WORKER_READY, throws on timeout (30s)

// Check if ready
bridge.isReady;  // boolean

// Assemble source code (returns Promise)
const result: AssembleResult = await bridge.assemble(source);
// result.success: boolean
// result.binary: Uint8Array | null
// result.error: AssemblerError | null (has line, message, column?, suggestion?)

// Cleanup
bridge.terminate();
```

**AssembleResult Type:**
```typescript
interface AssembleResult {
  success: boolean;
  binary: Uint8Array | null;  // Nibble values if success
  error: AssemblerError | null;  // { line, message, column?, suggestion? }
}
```

**Key Implementation Notes from Story 3.2:**
- Worker has 30s init timeout, 10s assembly timeout (configurable)
- `assemble()` returns Promise that resolves (never rejects for assembly errors)
- Assembly errors are returned in `result.error`, not thrown
- Worker errors (crash, timeout) DO throw/reject

### Architecture Requirements

**File Locations (per architecture.md):**
```
src/ui/
├── App.ts              # MODIFY: Add AssemblerBridge integration
├── Toolbar.ts          # EXISTS: Already has onAssembleClick callback
└── StatusBar.ts        # EXISTS: Already has assemblyStatus state
src/editor/
├── Editor.ts           # MODIFY: Add onContentChange callback, Ctrl+Enter action
└── Editor.test.ts      # MODIFY: Add new tests
src/emulator/
├── AssemblerBridge.ts  # EXISTS: Use as-is
├── types.ts            # EXISTS: Import types
└── index.ts            # EXISTS: Has exports
```

**Existing Infrastructure (USE - DO NOT RECREATE):**

1. **Toolbar** already has:
   - `canAssemble` state property
   - `onAssembleClick` callback
   - Button disabled state handling
   - `updateState()` method

2. **StatusBar** already has:
   - `assemblyStatus: 'none' | 'assembling' | 'success' | 'error'`
   - `assemblyMessage: string | null`
   - Status display with checkmark/X icons
   - `updateState()` method

3. **App.ts** already has:
   - `getToolbar()` getter
   - `getStatusBar()` getter
   - `getEditor()` getter
   - Placeholder comment for Epic 3 in `onAssembleClick`

### Data Flow for Assembly

```
User clicks Assemble → App.handleAssemble()
                              │
                              ├─► StatusBar.updateState({ assemblyStatus: 'assembling' })
                              ├─► Toolbar.updateState({ canAssemble: false })
                              │
                              ▼
                       Editor.getValue()
                              │
                              ▼
                    AssemblerBridge.assemble(source)
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
              result.success      result.error
                    │                   │
                    ▼                   ▼
          StatusBar.updateState   StatusBar.updateState
          ({ assemblyStatus:      ({ assemblyStatus: 'error',
             'success',              assemblyMessage: error.message })
             assemblyMessage:
             `${size} bytes` })
                    │
                    ▼
          Toolbar.updateState
          ({ canAssemble: true,
             canRun: true,
             canStep: true,
             canReset: true })
```

### Monaco Editor Integration

**Getting Editor Content:**
```typescript
// In Editor class - already have this via getModel()
const model = this.editor?.getModel();
const source = model?.getValue() ?? '';
```

**Adding Keyboard Action:**
```typescript
// In Editor.mount() after Monaco is initialized
this.editor?.addAction({
  id: 'assemble',
  label: 'Assemble Code',
  keybindings: [
    monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter
  ],
  run: () => {
    // Call the provided callback
    this.callbacks.onAssemble?.();
  },
});
```

**Adding Content Change Listener:**
```typescript
// In Editor constructor/mount
this.editor?.onDidChangeModelContent(() => {
  const hasContent = (this.editor?.getValue()?.length ?? 0) > 0;
  this.callbacks.onContentChange?.(hasContent);
});
```

### Accessibility Checklist

- [x] **Keyboard Navigation** - Ctrl+Enter accessible from editor (via Monaco addAction)
- [x] **ARIA Attributes** - Assemble button already has `aria-label="Assemble code"`
- [x] **Focus Management** - Focus returns to editor after assembly
- [x] **Color Contrast** - Status bar success/error colors already WCAG compliant
- [x] **XSS Prevention** - Assembly message goes through `escapeHtml()` in StatusBar
- [x] **Screen Reader Announcements** - Status bar has `aria-live="polite"`

### Project Structure Notes

**Files to modify:**
```
digital-archaeology-web/
└── src/
    ├── ui/
    │   └── App.ts            # Add AssemblerBridge, wire callbacks
    └── editor/
        ├── Editor.ts         # Add onContentChange, Ctrl+Enter action
        └── Editor.test.ts    # Add tests
```

**No new files needed** - This story wires existing components together.

### Testing Strategy

**App.ts Tests:**
```typescript
describe('App assembly integration', () => {
  it('clicking Assemble triggers assembly flow', async () => {
    // Mock AssemblerBridge
    // Click button
    // Verify status updates
  });

  it('shows assembling status during operation', async () => {
    // Use delayed mock
    // Check intermediate state
  });

  it('enables execution buttons on success', async () => {
    // Mock successful assembly
    // Check toolbar state
  });
});
```

**Editor.ts Tests:**
```typescript
describe('Editor assembly integration', () => {
  it('Ctrl+Enter triggers onAssemble callback', () => {
    // Simulate keyboard event
    // Verify callback called
  });

  it('content change callback fires on edit', () => {
    // Edit content
    // Verify callback with hasContent
  });
});
```

### Anti-Patterns to Avoid

| Don't | Do |
|-------|-----|
| Create new state management | Use existing Toolbar/StatusBar updateState() |
| Re-implement worker communication | Use AssemblerBridge.assemble() |
| Block UI during assembly | Assembly is already async in worker |
| Throw on assembly errors | Check result.success, display result.error |
| Create new CSS classes | Use existing da-statusbar-status--* classes |
| Add new dependencies | Use existing Monaco, AssemblerBridge APIs |

### Critical Technical Requirements

1. **Error Handling:** Never let bridge errors crash the app - catch and display
2. **State Sync:** Always update both Toolbar AND StatusBar on assembly complete
3. **Cleanup:** No bridge.terminate() yet - keep alive for future assemblies
4. **Memory:** Store binary result for later use by Run button (Epic 4)
5. **Timing:** Disable Assemble button during operation to prevent race conditions

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.3]
- [Source: _bmad-output/planning-artifacts/architecture.md#WASM Integration]
- [Source: _bmad-output/planning-artifacts/architecture.md#Module Communication Rules]
- [Source: _bmad-output/implementation-artifacts/3-2-create-assembler-web-worker.md#Dev Notes]
- [Source: digital-archaeology-web/src/emulator/AssemblerBridge.ts]
- [Source: digital-archaeology-web/src/ui/Toolbar.ts]
- [Source: digital-archaeology-web/src/ui/StatusBar.ts]
- [Source: digital-archaeology-web/src/ui/App.ts]
- [Source: digital-archaeology-web/src/editor/Editor.ts]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

N/A

### Completion Notes List

1. **AssemblerBridge Integration**: Successfully integrated the AssemblerBridge created in Story 3.2 into App.ts. The bridge is initialized during editor setup and provides async assembly capabilities.

2. **Assembly Status Flow**: Implemented complete status flow with StatusBar updates showing "Assembling...", success messages with byte count, and error messages. Execution buttons (Run, Step, Reset) are enabled after successful assembly.

3. **Editor Content Callback**: Added `onContentChange` callback to Editor component that fires on model content changes, enabling/disabling the Assemble button based on whether editor has content.

4. **Ctrl+Enter Shortcut**: Implemented using Monaco's `addAction` API with keybinding `KeyMod.CtrlCmd | KeyCode.Enter`, triggering the same handleAssemble flow.

5. **Test Coverage**: Added comprehensive tests covering:
   - Assembly trigger from Assemble button click
   - Assembly trigger from Debug menu
   - Assembly trigger from Ctrl+Enter
   - Status bar state transitions
   - Button state management
   - Error handling
   - getLastAssembleResult() API

6. **Mock Pattern**: Used `vi.hoisted()` pattern for proper mock hoisting with AssemblerBridge constructor mock that maintains mutable state for test control.

### File List

**Modified:**
- `src/ui/App.ts` - Added AssemblerBridge integration, handleAssemble() method, onContentChange callback wiring, debounce protection
- `src/editor/Editor.ts` - Added onContentChange callback, onAssemble callback, Ctrl+Enter keyboard action
- `src/editor/Editor.test.ts` - Added tests for content change callback and assemble keyboard shortcut
- `src/ui/App.test.ts` - Added comprehensive assembly integration test suite including debounce tests
- `src/ui/keyboardShortcuts.ts` - Added 'assembly' category with Ctrl+Enter shortcut for Help dialog discoverability
- `src/ui/KeyboardShortcutsDialog.test.ts` - Added tests for assembly category and Ctrl+Enter shortcut

**No New Files Created** - This story wires existing components together as specified.
