# Story 7.5: Reload Visualizer After HDL Changes

Status: done

## Story

As a user,
I want to reload the circuit after HDL changes,
so that I see my modifications.

## Acceptance Criteria

1. **Given** I have edited and saved HDL, **When** I click "Reload Circuit", **Then** the HDL is re-parsed
2. **Given** valid HDL content, **When** circuit reloads, **Then** the circuit data is regenerated and visualizer displays updated circuit
3. **Given** invalid HDL content, **When** circuit reload fails, **Then** errors are displayed clearly
4. **Given** HDL validation passes, **When** I reload circuit, **Then** the reload uses the saved/validated content

## Tasks / Subtasks

- [x] Task 1: Add Reload Circuit Button to HdlViewerPanel (AC: #1)
  - [x] 1.1 Create "Reload Circuit" button in header (visible in edit mode)
  - [x] 1.2 Style with `da-hdl-viewer-reload` class
  - [x] 1.3 Add click handler calling `reloadCircuit()`
  - [x] 1.4 Add `onReloadCircuit?: (content: string) => Promise<void>` callback option
  - [x] 1.5 Disable button during reload (show loading state)

- [x] Task 2: Implement HDL-to-Circuit Reload Flow (AC: #1, #2)
  - [x] 2.1 Create `reloadCircuit()` method in HdlViewerPanel
  - [x] 2.2 Validate HDL content first (call `validateContent()`)
  - [x] 2.3 If validation fails, show errors and abort reload
  - [x] 2.4 If validation passes, call `onReloadCircuit` callback with content
  - [x] 2.5 Handle reload success/failure states

- [x] Task 3: Integrate Circuit Reload in App.ts (AC: #2)
  - [x] 3.1 Add `onReloadCircuit` callback to HdlViewerPanel initialization
  - [x] 3.2 Implement circuit regeneration logic in App.ts
  - [x] 3.3 Save HDL content to server/local storage (if applicable) - N/A for MVP (Option C)
  - [x] 3.4 Re-invoke `circuitRenderer.loadCircuit()` after HDL save
  - [x] 3.5 Handle circuit loading errors gracefully

- [x] Task 4: Display Reload Status and Errors (AC: #3)
  - [x] 4.1 Show "Reloading..." state in button
  - [x] 4.2 Show success message after successful reload
  - [x] 4.3 Show error message if reload fails (HDL invalid or circuit load error)
  - [x] 4.4 Announce reload result to screen readers

- [x] Task 5: Add CSS Styles (AC: #1)
  - [x] 5.1 Style `.da-hdl-viewer-reload` button
  - [x] 5.2 Style loading/disabled state
  - [x] 5.3 Style reload success/error feedback

- [x] Task 6: Create Unit Tests (AC: #1, #2, #3)
  - [x] 6.1 Test reload button is visible in edit mode
  - [x] 6.2 Test reload button is hidden in view mode
  - [x] 6.3 Test reloadCircuit validates content first
  - [x] 6.4 Test reloadCircuit calls onReloadCircuit callback on valid HDL
  - [x] 6.5 Test reloadCircuit shows errors on invalid HDL
  - [x] 6.6 Test reload button disabled during reload
  - [x] 6.7 Test successful reload announces to screen reader

---

## Dev Notes

### Previous Story Intelligence (Story 7.4)

**Critical Patterns Established:**
- HdlViewerPanel is at `src/hdl/HdlViewerPanel.ts` (900+ lines)
- Monaco editor with `m4hdlLanguageId` language
- Edit mode toggle with `toggleEditMode()` method
- Save functionality with `saveContent()` method and `onSave` callback
- Validation with `validateContent()` method and `onValidate` callback
- Screen reader announcements via `announce()` method
- Button styling patterns: `da-hdl-viewer-*` CSS classes
- Header button container: `.da-hdl-viewer-buttons`
- Validate button pattern: visible only in edit mode, disabled during operation

**Monaco Editor Integration:**
```typescript
// Get current content
const content = this.editor?.getValue() ?? '';

// Jump to line on error
this.editor.revealLineInCenter(lineNumber);
this.editor.setPosition({ lineNumber, column: 1 });
```

**Validation Flow (from Story 7.4):**
```typescript
validateContent(): void {
  if (this.isValidating) return;

  const content = this.editor?.getValue() ?? '';
  this.isValidating = true;

  // Update button to loading state
  if (this.validateButton) {
    this.validateButton.textContent = 'Validating...';
    this.validateButton.setAttribute('aria-disabled', 'true');
  }

  // Perform validation
  const result = this.validator.validate(content);

  // Update Monaco markers
  this.setValidationMarkers(result);

  // Display results
  this.displayValidationResults(result);

  // Restore button
  this.isValidating = false;

  // Announce result
  this.announce(result.valid
    ? 'HDL validation passed: no errors found'
    : `HDL validation failed: ${result.errors.length} error(s) found`);

  // Call callback
  this.options.onValidate?.(result);
}
```

### Architecture Compliance

**Circuit Visualization Architecture (from Story 6.x):**
- CircuitRenderer at `src/visualizer/CircuitRenderer.ts`
- CircuitLoader at `src/visualizer/CircuitLoader.ts` - loads JSON from path
- App.ts manages both `hdlViewerPanel` and `circuitRenderer` instances
- Circuit data loaded from `/circuits/micro4-circuit.json`

**App.ts Integration Points:**
```typescript
// Current HdlViewerPanel initialization (Story 7.1)
private initHdlViewerPanel(): void {
  this.hdlViewerPanel = new HdlViewerPanel({
    onClose: () => { /* handle close */ },
  });
  this.hdlViewerPanel.mount(document.body);
}

// CircuitRenderer (Story 6.1-6.13)
private circuitRenderer: CircuitRenderer | null = null;

// Load circuit
await this.circuitRenderer.loadCircuit('/circuits/micro4-circuit.json');
```

### Required Locations

- Modify: `src/hdl/HdlViewerPanel.ts` - Add reload button and reloadCircuit method
- Modify: `src/hdl/HdlViewerPanel.test.ts` - Add reload tests
- Modify: `src/ui/App.ts` - Add onReloadCircuit callback handling
- Modify: `src/ui/App.test.ts` - Add integration tests
- Modify: `src/styles/main.css` - Add reload button styles
- Modify: `src/hdl/index.ts` - Export any new types

### File Structure

```
src/hdl/
├── index.ts                 # (unchanged - exports already complete)
├── HdlLoader.ts             # (unchanged)
├── HdlValidator.ts          # (unchanged)
├── HdlViewerPanel.ts        # ADD: reload button, reloadCircuit method
├── HdlViewerPanel.test.ts   # ADD: reload tests
└── m4hdl-language.ts        # (unchanged)

src/ui/
├── App.ts                   # ADD: onReloadCircuit callback
└── App.test.ts              # ADD: integration tests

src/styles/
└── main.css                 # ADD: reload button styles
```

### UI Layout with Reload Button

```
+--------------------------------------------------------------+
| HDL Editor*        [Validate] [Reload Circuit] [Edit] [Save] [×] |
+--------------------------------------------------------------+
|                                                              |
|  Monaco Editor (with inline error markers)                   |
|                                                              |
+--------------------------------------------------------------+
| Validation Results / Reload Status                           |
+--------------------------------------------------------------+
```

### Implementation Notes

**Reload Flow:**
1. User clicks "Reload Circuit" button
2. HdlViewerPanel validates HDL content first
3. If invalid, show validation errors and abort
4. If valid, call `onReloadCircuit` callback with content
5. App.ts receives content, saves HDL file (or uses temp storage)
6. App.ts calls `circuitRenderer.loadCircuit()` to reload circuit
7. On success, circuit visualization updates
8. On failure, show error message

**HDL → Circuit Conversion:**
The current architecture loads pre-generated circuit JSON files. For full HDL editing support, one of these approaches is needed:
- **Option A (Simpler):** HDL file is saved to server, server regenerates circuit JSON
- **Option B:** HDL compiler runs client-side (WASM-compiled simulator)
- **Option C (MVP):** Just reload the existing circuit file after HDL save (user regenerates manually)

For MVP, use Option C - the reload button triggers a re-load of the circuit JSON file, assuming the HDL file was saved and the circuit will be regenerated externally.

### Testing Requirements

**HdlViewerPanel Tests:**
```typescript
describe('reload button', () => {
  it('should be hidden in view mode', () => {
    panel = new HdlViewerPanel();
    panel.mount(container);
    const reloadButton = container.querySelector('.da-hdl-viewer-reload');
    expect(reloadButton?.classList.contains('da-hdl-viewer-reload--hidden')).toBe(true);
  });

  it('should be visible in edit mode', () => {
    panel = new HdlViewerPanel();
    panel.mount(container);
    panel.toggleEditMode();
    const reloadButton = container.querySelector('.da-hdl-viewer-reload');
    expect(reloadButton?.classList.contains('da-hdl-viewer-reload--hidden')).toBe(false);
  });

  it('should validate before calling onReloadCircuit', async () => {
    // ...
  });

  it('should not call onReloadCircuit if validation fails', async () => {
    // ...
  });
});
```

### Accessibility Checklist

- [x] **Keyboard Navigation** - Reload button accessible via Tab
- [x] **ARIA Attributes**
  - [x] `aria-label` for reload button
  - [x] `aria-disabled="true"` when reloading
  - [x] `aria-live="polite"` for status announcements
- [x] **Focus Management** - Focus remains on reload button after completion
- [x] **Color Contrast** - Button states visible in dark theme
- [x] **XSS Prevention** - No user content in innerHTML
- [x] **Screen Reader Announcements** - Reload start/success/failure announced

### Project Structure Notes

- Follows existing HdlViewerPanel button patterns from Stories 7.3/7.4
- Integrates with App.ts circuit rendering from Epic 6
- Maintains separation: HdlViewerPanel handles UI, App.ts handles circuit loading

### References

- [Source: src/hdl/HdlViewerPanel.ts] - Button patterns, validation flow
- [Source: src/ui/App.ts:1494-1539] - HdlViewerPanel initialization
- [Source: src/ui/App.ts:1288-1293] - Circuit loading logic
- [Source: src/visualizer/CircuitRenderer.ts] - Circuit display

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None

### Completion Notes List

- Added "Reload Circuit" button to HdlViewerPanel header (visible only in edit mode)
- Implemented `reloadCircuit()` method that validates HDL content before calling callback
- Button displays "Reloading..." state during async operation
- Screen reader announcements for success/failure states
- Integrated with App.ts via `onReloadCircuit` callback
- App.ts `reloadCircuit()` method re-invokes `loadCircuitAndInitializeBridge()`
- MVP implementation uses Option C: reload existing circuit file (external regeneration)
- Added CSS styles for reload button with consistent hover/focus/disabled states
- 14 unit tests for HdlViewerPanel reload functionality
- 2 integration tests for App.ts HdlViewerPanel integration

### Code Review Fixes Applied

- **M1 Fixed:** Marked Accessibility Checklist items as complete (they were implemented)
- **M2 Fixed:** Added test for reload button click protection while already reloading
- **L1 Fixed:** Added comment explaining why `_content` parameter is unused in MVP
- **L2 Fixed:** Added focus return to reload button after completion for accessibility

### File List

- `src/hdl/HdlViewerPanel.ts` - MODIFIED: Added reload button, reloadCircuit method, forceClose/destroy cleanup, focus return
- `src/hdl/HdlViewerPanel.test.ts` - MODIFIED: Added 14 tests for reload functionality
- `src/ui/App.ts` - MODIFIED: Added onReloadCircuit callback and reloadCircuit method with documentation
- `src/ui/App.test.ts` - MODIFIED: Added 2 integration tests for HdlViewerPanel
- `src/styles/main.css` - MODIFIED: Added ~35 lines of reload button CSS styles
