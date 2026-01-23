# Story 3.6: Show Binary Output View

Status: done

---

## Story

As a user,
I want to see the assembled binary,
So that I can understand the machine code.

## Acceptance Criteria

1. **Given** assembly succeeds
   **When** I view the binary output
   **Then** I see a hex dump of the assembled program

2. **And** bytes are grouped in rows of 16
   **When** viewing the binary output
   **Then** each row shows 16 bytes with address prefix

3. **And** addresses are shown on the left
   **When** viewing the binary output
   **Then** addresses are displayed in hexadecimal format (e.g., 0x00, 0x10, 0x20)

4. **And** the view is scrollable for larger programs
   **When** the program is larger than the visible area
   **Then** I can scroll to see all bytes

5. **And** the binary output can be toggled on/off
   **When** I click a toggle button
   **Then** the binary output view shows/hides

---

## Tasks / Subtasks

- [x] Task 1: Create BinaryOutputPanel Component (AC: #1, #2, #3, #4)
  - [x] 1.1 Create `src/ui/BinaryOutputPanel.ts` with mount/destroy lifecycle
  - [x] 1.2 Implement `setBinary(data: Uint8Array | null)` method
  - [x] 1.3 Render hex dump with 16 bytes per row
  - [x] 1.4 Render address prefix in hex format (0x00:, 0x10:, etc.)
  - [x] 1.5 Add scrollable container for large programs
  - [x] 1.6 Style with monospace font, proper spacing

- [x] Task 2: Create Toggle UI for Binary View (AC: #5)
  - [x] 2.1 Add "Binary" toggle button to toolbar or error panel area
  - [x] 2.2 Implement show/hide logic with CSS class toggle
  - [x] 2.3 Persist toggle state in component (not localStorage yet)
  - [x] 2.4 Add keyboard shortcut if appropriate (optional) - Skipped, not essential

- [x] Task 3: Integrate with Assembly Flow (AC: #1)
  - [x] 3.1 Store assembled binary in App state after successful assembly
  - [x] 3.2 Pass binary to BinaryOutputPanel when assembly succeeds
  - [x] 3.3 Clear binary output when assembly fails or code changes
  - [x] 3.4 Update UI to show binary only after successful assembly

- [x] Task 4: Add CSS Styles (AC: all)
  - [x] 4.1 Add `.da-binary-panel` container styles
  - [x] 4.2 Add `.da-binary-row` styles for each row
  - [x] 4.3 Add `.da-binary-address` styles for address column
  - [x] 4.4 Add `.da-binary-bytes` styles for byte values
  - [x] 4.5 Add `.da-binary-toggle` styles for toggle button
  - [x] 4.6 Ensure styles work with lab-mode and story-mode themes

- [x] Task 5: Write Comprehensive Tests (AC: all)
  - [x] 5.1 BinaryOutputPanel.test.ts: mount, setBinary, hex formatting
  - [x] 5.2 BinaryOutputPanel.test.ts: scrollable container, toggle visibility
  - [x] 5.3 App.test.ts: binary stored after assembly, cleared on error
  - [x] 5.4 Integration test: full assembly → binary display flow

- [x] Task 6: Verify Build and Tests
  - [x] 6.1 Run `npm test` - all tests pass (732 tests)
  - [x] 6.2 Run `npm run build` - no errors
  - [ ] 6.3 Manual verification with sample programs (deferred to QA)

---

## Dev Notes

### Previous Story Intelligence (Story 3.5)

**Critical Assets Created:**
- `src/ui/ErrorPanel.ts` - Error panel component with event delegation pattern (470 lines)
- `src/ui/App.ts` - Main app with handleAssemble, applyFix methods
- `src/emulator/types.ts` - AssembleResult with binary: Uint8Array | null
- `src/emulator/AssemblerBridge.ts` - Promise-based worker communication
- `src/styles/main.css` - Theme variables, panel styles

**AssembleResult Type (from types.ts:166-173):**
```typescript
export interface AssembleResult {
  /** Whether assembly succeeded */
  success: boolean;
  /** Assembled binary (nibbles) if successful, null otherwise */
  binary: Uint8Array | null;
  /** Error details if assembly failed, null otherwise */
  error: AssemblerError | null;
}
```

**Key Insight:** The binary data is ALREADY returned from the assembler worker! It's a Uint8Array containing nibble values (0-15 for Micro4's 4-bit architecture).

### Architecture Requirements

**From Architecture Document:**
- Feature folder structure: Create `src/ui/BinaryOutputPanel.ts`
- Naming conventions: PascalCase for components, camelCase for methods
- CSS tokens: Use `--da-*` variables for all colors
- Testing: Vitest with DOM testing utilities

**From UX Specification:**
- Monospace font for code/hex values (JetBrains Mono / Fira Code)
- Multiple number formats visible (hex + decimal optional)
- Collapsible/toggle panels pattern used elsewhere
- Memory view shows similar hex dump format

### Hex Dump Format

Per AC requirements, format should be (updated to 4-digit addresses for larger programs):
```
0x0000: 1A 05 2B 11 3C 12 F0 00 00 00 00 00 00 00 00 00
0x0010: 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
```

**Implementation Notes:**
- Address prefix: `0x${addr.toString(16).toUpperCase().padStart(4, '0')}:`
- Byte value: `value.toString(16).toUpperCase().padStart(2, '0')`
- Space separator between bytes
- Micro4 uses nibbles (4-bit), so values are 0x0-0xF

### Component Structure

```typescript
// src/ui/BinaryOutputPanel.ts
export interface BinaryOutputPanelOptions {
  onToggle?: (visible: boolean) => void;
}

export class BinaryOutputPanel {
  private element: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private visible: boolean = false;
  private binary: Uint8Array | null = null;

  constructor(options?: BinaryOutputPanelOptions);
  mount(container: HTMLElement): void;
  setBinary(data: Uint8Array | null): void;
  toggle(): void;
  show(): void;
  hide(): void;
  destroy(): void;
}
```

### Integration with App.ts

```typescript
// In App.ts handleAssemble result handling
if (result.success && result.binary) {
  this.binaryPanel?.setBinary(result.binary);
} else {
  this.binaryPanel?.setBinary(null);
}
```

### CSS Variables to Use

```css
/* From existing theme system */
--da-bg-secondary: #252542;      /* Panel background */
--da-text-primary: #e0e0e0;      /* Main text */
--da-text-secondary: #a0a0b0;    /* Address text */
--da-border: #3a3a52;            /* Panel borders */
--da-accent: #00b4d8;            /* Toggle active state */
```

### Placement Options

The binary output could appear:
1. **Below the ErrorPanel** - As a collapsible section (recommended for consistency)
2. **In the State Panel** - With registers/memory views
3. **As a separate modal** - Less discoverable

**Recommendation:** Place below the ErrorPanel area, sharing the same container. Toggle button in the ErrorPanel header or toolbar.

### Accessibility Requirements

- [x] **Keyboard Navigation** - Toggle button accessible via Tab/Enter
- [x] **ARIA Attributes** - `aria-pressed` on toggle, `aria-label` on button and panel
- [x] **Color Contrast** - WCAG AA minimum for hex values on dark background
- [x] **Screen Reader** - Panel announces when expanded/collapsed

### Project Structure Notes

**File Locations (per architecture.md):**
```
src/ui/
├── BinaryOutputPanel.ts         # NEW: Binary hex dump component
├── BinaryOutputPanel.test.ts    # NEW: Component tests
├── ErrorPanel.ts                # EXISTS: Error display (sibling component)
├── App.ts                       # MODIFY: Integrate BinaryOutputPanel
└── App.test.ts                  # MODIFY: Add binary integration tests
src/styles/
└── main.css                     # MODIFY: Add binary panel styles
```

### Anti-Patterns to Avoid

| Don't | Do |
|-------|-----|
| Format bytes as decimal | Use hex format (0x0F) |
| Create new state management | Use existing App pattern |
| Hard-code colors | Use CSS variables |
| Skip empty rows | Show all rows for consistency |
| Parse binary in component | Receive parsed Uint8Array |

### Testing Strategy

**BinaryOutputPanel Tests:**
```typescript
describe('BinaryOutputPanel', () => {
  it('renders hex dump with 16 bytes per row', () => {
    const data = new Uint8Array([0x1A, 0x05, 0x2B, 0x11]);
    panel.setBinary(data);
    expect(container.textContent).toContain('0x00:');
    expect(container.textContent).toContain('1A 05 2B 11');
  });

  it('shows address prefix for each row', () => {
    const data = new Uint8Array(32); // 2 rows
    panel.setBinary(data);
    expect(container.textContent).toContain('0x00:');
    expect(container.textContent).toContain('0x10:');
  });

  it('toggles visibility', () => {
    panel.toggle();
    expect(element.classList.contains('da-binary-panel--hidden')).toBe(false);
    panel.toggle();
    expect(element.classList.contains('da-binary-panel--hidden')).toBe(true);
  });
});
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.6]
- [Source: _bmad-output/planning-artifacts/architecture.md#File Structure]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Memory View]
- [Source: digital-archaeology-web/src/emulator/types.ts#AssembleResult]
- [Source: digital-archaeology-web/src/ui/ErrorPanel.ts]
- [Source: digital-archaeology-web/src/ui/App.ts#handleAssemble]
- [Source: Story 3.5 implementation - ErrorPanel patterns, CSS variables]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None - Implementation completed without issues.

### Completion Notes List

- Created BinaryOutputPanel component with mount/destroy lifecycle
- Implemented setBinary(data: Uint8Array | null) method to display hex dump
- Hex dump format: 16 bytes per row with address prefixes (0x0000:, 0x0010:, etc.)
- Added toggle visibility with show(), hide(), toggle(), isVisible() methods
- Added onToggle callback for toggle button state sync
- Integrated BinaryOutputPanel into App.ts with toggle button
- Toggle button shows/hides after successful assembly
- Binary data cleared on assembly error
- Added comprehensive CSS styles for binary panel and toggle button
- Added 28 unit tests for BinaryOutputPanel
- Added 7 integration tests in App.test.ts
- All 732 tests pass, build succeeds

### Code Review Fixes (Post-Implementation)

**Round 1:**
- Added missing `--da-bg-hover: #3a3a62` CSS variable to :root and .lab-mode
- Marked accessibility checklist items as complete (all implemented)
- Added event listener cleanup via `boundBinaryToggleHandler` in destroyBinaryOutputPanel
- Changed address padding from 2 to 4 digits (0x0000:) for programs larger than 256 bytes
- Removed unused `.da-binary-panel-header` CSS class
- Fixed task 6.3 checkbox inconsistency (unchecked since manual QA deferred)
- Updated tests and CSS min-width to reflect 4-digit address format

**Round 2:**
- Added missing `--da-bg-hover: #2a2a3a` CSS variable to .story-mode theme
- Removed unused `.da-binary-panel-title` CSS class
- Updated stale comments in BinaryOutputPanel.ts to reflect 4-digit address format

### File List

Created:
- `src/ui/BinaryOutputPanel.ts` - Binary hex dump component (185 lines)
- `src/ui/BinaryOutputPanel.test.ts` - Component tests (28 tests)

Modified:
- `src/ui/index.ts` - Added BinaryOutputPanel exports
- `src/ui/App.ts` - Integrated BinaryOutputPanel, toggle button, assembly flow updates
- `src/ui/App.test.ts` - Added 7 integration tests for binary panel
- `src/styles/main.css` - Added CSS styles for binary panel and toggle button

