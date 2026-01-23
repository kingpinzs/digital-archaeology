# Story 5.6: Implement Jump to Address

Status: done

---

## Story

As a user,
I want to jump to a specific memory address,
so that I can quickly find data.

## Acceptance Criteria

1. **Given** the memory view is displayed
   **When** I enter an address in the "Jump to" field
   **Then** the memory view scrolls to show that address
   **And** hex values (0x10) and decimal (16) are accepted
   **And** invalid addresses show an error
   **And** Enter key triggers the jump

## Tasks / Subtasks

- [x] Task 1: Add Jump Input UI to MemoryView (AC: #1)
  - [x] 1.1 Add input container div below title with class `da-memory-jump`
  - [x] 1.2 Add label "Jump to:" with `da-memory-jump__label` class
  - [x] 1.3 Add text input with `da-memory-jump__input` class and placeholder "0x00 or 0"
  - [x] 1.4 Add jump button with `da-memory-jump__button` class (magnifying glass icon or "Go")
  - [x] 1.5 Add error message span with `da-memory-jump__error` class (hidden by default)
  - [x] 1.6 Use safe DOM methods (createElement, textContent) for XSS prevention

- [x] Task 2: Implement Address Parsing Logic (AC: #1)
  - [x] 2.1 Create `parseAddress(input: string): number | null` method
  - [x] 2.2 Support hex format: `0x00` to `0xFF` (case-insensitive)
  - [x] 2.3 Support decimal format: `0` to `255`
  - [x] 2.4 Trim whitespace from input before parsing
  - [x] 2.5 Return `null` for invalid inputs (non-numeric, out of range, empty)
  - [x] 2.6 Valid range: 0-255 (Micro4 memory size)

- [x] Task 3: Implement Jump Functionality (AC: #1)
  - [x] 3.1 Create `jumpToAddress(address: number): void` method
  - [x] 3.2 Calculate row index: `Math.floor(address / bytesPerRow)`
  - [x] 3.3 Find row element by `data-address` attribute
  - [x] 3.4 Scroll row into view: `element.scrollIntoView({ behavior: 'smooth', block: 'center' })`
  - [x] 3.5 Optionally highlight target row briefly with `da-memory-jump-target` class
  - [x] 3.6 Clear any previous jump highlighting after animation

- [x] Task 4: Implement Error Display (AC: #1)
  - [x] 4.1 Show error message for invalid addresses
  - [x] 4.2 Error messages: "Invalid address" for non-numeric, "Address out of range (0-255)" for overflow
  - [x] 4.3 Clear error when valid address entered
  - [x] 4.4 Style error with `color: var(--da-error-color)` or similar
  - [x] 4.5 Add `aria-live="polite"` on error element for accessibility

- [x] Task 5: Implement Event Handlers (AC: #1)
  - [x] 5.1 Handle click on jump button
  - [x] 5.2 Handle Enter key press in input field
  - [x] 5.3 Handle input change to clear error (optional)
  - [x] 5.4 Use bound handler pattern for cleanup
  - [x] 5.5 Remove event listeners in destroy() method

- [x] Task 6: Add CSS Styling (AC: #1)
  - [x] 6.1 Add `.da-memory-jump` container styles (flex row, gap, margin-bottom)
  - [x] 6.2 Add `.da-memory-jump__label` styles (secondary text color, font-size)
  - [x] 6.3 Add `.da-memory-jump__input` styles (monospace font, border, padding, width ~60px)
  - [x] 6.4 Add `.da-memory-jump__button` styles (accent background, hover state)
  - [x] 6.5 Add `.da-memory-jump__error` styles (error color, font-size, hidden when empty)
  - [x] 6.6 Add `.da-memory-jump-target` styles (highlight animation for target row)
  - [x] 6.7 Use CSS variables for theme consistency

- [x] Task 7: Add Public API for External Jump (AC: #1)
  - [x] 7.1 Export `scrollToAddress(address: number): boolean` method
  - [x] 7.2 Return true if jump successful, false if address invalid
  - [x] 7.3 This allows App.ts or other components to trigger jumps programmatically
  - [x] 7.4 Use same parseAddress and jumpToAddress logic

- [x] Task 8: Add Comprehensive Unit Tests (AC: #1)
  - [x] 8.1 Test: Jump input renders with label, input, button
  - [x] 8.2 Test: parseAddress handles hex format (0x10 → 16)
  - [x] 8.3 Test: parseAddress handles decimal format (16 → 16)
  - [x] 8.4 Test: parseAddress returns null for invalid input
  - [x] 8.5 Test: parseAddress returns null for out-of-range (256, -1)
  - [x] 8.6 Test: Jump button scrolls to correct row
  - [x] 8.7 Test: Enter key triggers jump
  - [x] 8.8 Test: Invalid address shows error message
  - [x] 8.9 Test: Valid address clears error message
  - [x] 8.10 Test: scrollToAddress public method works
  - [x] 8.11 Test: Event listeners cleaned up on destroy

- [x] Task 9: Add App.test.ts Integration Tests (AC: #1)
  - [x] 9.1 Test: MemoryView has jump input after mount (covered in MemoryView.test.ts)
  - [x] 9.2 Test: Jump to address scrolls memory view (covered in MemoryView.test.ts)
  - [x] 9.3 Test: Invalid address shows error in memory view (covered in MemoryView.test.ts)

- [x] Task 10: Integration Verification (AC: #1)
  - [x] 10.1 Run `npm test` - all 1249 tests pass
  - [x] 10.2 Run `npm run build` - build succeeds
  - [x] 10.3 TypeScript compilation - no type errors

---

## Dev Notes

### Architecture Context

**CRITICAL:** This is Story 5.6 in Epic 5 (Debugging & State Inspection). It builds directly on:
- Story 5.5: Memory view panel (MemoryView component this story extends)
- Story 5.1-5.4: Step execution, state updates, debugger patterns

This story adds a "Jump to Address" feature to the existing MemoryView component. The MemoryView already has:
- Scrollable container with `da-memory-view__scroll` class
- Rows with `data-address` attributes
- 16 rows of 16 nibbles (256 total)

### Previous Story Intelligence (Story 5.5)

Key patterns and learnings from Story 5.5:
1. MemoryView uses safe DOM methods (createElement, textContent)
2. Bound handler pattern for event listener cleanup
3. CSS uses `color-mix()` for theme-aware accent colors
4. `onAddressClick` callback was reserved for Story 5.6 - can be used if needed
5. Scroll container is `da-memory-view__scroll` with `overflow-y: auto`

### MemoryView Component Structure

```typescript
// Current structure from src/debugger/MemoryView.ts:
export class MemoryView {
  private container: HTMLElement | null = null;
  private element: HTMLElement | null = null;
  private state: MemoryViewState = { memory: new Uint8Array(256), pc: 0 };
  private bytesPerRow: number = 16;
  private boundAnimationEndHandler: (e: Event) => void;

  mount(container: HTMLElement): void { /* ... */ }
  updateState(state: Partial<MemoryViewState>): void { /* ... */ }
  private render(): void { /* ... */ }
  destroy(): void { /* ... */ }
}
```

### HTML Structure to Add

Add below the title `<h3>` element:

```html
<div class="da-memory-jump">
  <label class="da-memory-jump__label">Jump to:</label>
  <input class="da-memory-jump__input"
         type="text"
         placeholder="0x00 or 0"
         aria-label="Memory address to jump to" />
  <button class="da-memory-jump__button"
          type="button"
          aria-label="Jump to address">Go</button>
  <span class="da-memory-jump__error"
        role="alert"
        aria-live="polite"></span>
</div>
```

### Address Parsing Logic

```typescript
/**
 * Parse address input string to number.
 * Supports hex (0x10, 0X10) and decimal (16) formats.
 * @param input - User input string
 * @returns Parsed address 0-255, or null if invalid
 */
private parseAddress(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let value: number;

  // Hex format: 0x00 to 0xFF
  if (trimmed.toLowerCase().startsWith('0x')) {
    value = parseInt(trimmed.slice(2), 16);
  } else {
    value = parseInt(trimmed, 10);
  }

  // Validate range
  if (!Number.isFinite(value) || value < 0 || value > 255) {
    return null;
  }

  return Math.floor(value);
}
```

### Jump Implementation

```typescript
/**
 * Scroll the memory view to show the specified address.
 * @param address - Memory address (0-255)
 */
private jumpToAddress(address: number): void {
  const rowAddress = Math.floor(address / this.bytesPerRow) * this.bytesPerRow;
  const scroll = this.element?.querySelector('.da-memory-view__scroll');
  const row = this.element?.querySelector(`[data-address="${rowAddress}"]`);

  if (row && scroll) {
    row.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Optional: Highlight target row briefly
    row.classList.add('da-memory-jump-target');
    setTimeout(() => row.classList.remove('da-memory-jump-target'), 1000);
  }
}
```

### CSS Styling to Add

```css
/* Jump to Address UI */
.da-memory-jump {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 11px;
}

.da-memory-jump__label {
  color: var(--da-text-secondary);
}

.da-memory-jump__input {
  width: 60px;
  padding: 4px 6px;
  border: 1px solid var(--da-border);
  border-radius: 4px;
  background-color: var(--da-bg-primary);
  color: var(--da-text-primary);
  font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
  font-size: 11px;
}

.da-memory-jump__input:focus {
  outline: 2px solid var(--da-accent);
  outline-offset: -2px;
}

.da-memory-jump__button {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  background-color: var(--da-accent);
  color: var(--da-bg-primary);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}

.da-memory-jump__button:hover {
  filter: brightness(1.1);
}

.da-memory-jump__error {
  color: var(--da-error-color, #ef4444);
  font-size: 10px;
}

.da-memory-jump__error:empty {
  display: none;
}

/* Jump target highlight animation */
.da-memory-jump-target {
  animation: da-jump-highlight 1s ease-out;
}

@keyframes da-jump-highlight {
  0% {
    background-color: color-mix(in srgb, var(--da-accent) 40%, transparent);
  }
  100% {
    background-color: transparent;
  }
}
```

### Event Handler Pattern

Follow the bound handler pattern from Story 5.5:

```typescript
// In constructor
this.boundJumpHandler = () => this.handleJump();
this.boundKeydownHandler = (e: Event) => this.handleKeydown(e as KeyboardEvent);

// In mount
this.jumpButton?.addEventListener('click', this.boundJumpHandler);
this.jumpInput?.addEventListener('keydown', this.boundKeydownHandler);

// In destroy
this.jumpButton?.removeEventListener('click', this.boundJumpHandler);
this.jumpInput?.removeEventListener('keydown', this.boundKeydownHandler);
```

### Test Pattern from Story 5.5

Use JSDOM-compatible patterns:
```typescript
// Trigger keydown
const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
inputElement.dispatchEvent(event);

// Check scroll behavior (mock or check visibility)
// Note: scrollIntoView may not work in JSDOM, test class additions instead
```

### Git Commit Pattern

Recent commits follow: `feat(web): implement <feature> (Story X.Y)`

Example: `feat(web): implement jump to address in memory view (Story 5.6)`

### Edge Cases to Handle

1. **Empty input:** Show "Invalid address" error
2. **Non-numeric input:** Show "Invalid address" error
3. **Hex without 0x prefix:** Treat as decimal (e.g., "FF" → 255)
4. **Out of range:** Show "Address out of range (0-255)" error
5. **Whitespace:** Trim before parsing
6. **Rapid jumps:** Ensure smooth behavior (debounce not strictly needed for 256 addresses)

### Accessibility Checklist

- [x] **Keyboard Navigation** - Enter key triggers jump, Tab navigates between input and button
- [x] **ARIA Attributes** - `aria-label` on input and button, `aria-live="polite"` on error
- [x] **Focus Management** - Focus stays on input after jump
- [x] **Color Contrast** - Uses existing theme CSS variables
- [x] **XSS Prevention** - Use safe DOM methods for all user input display
- [x] **Screen Reader Announcements** - Error messages announced via aria-live

### Project Structure Notes

**Files to modify:**
```
digital-archaeology-web/
├── src/
│   ├── debugger/
│   │   ├── MemoryView.ts           # MODIFY - Add jump UI and logic
│   │   └── MemoryView.test.ts      # MODIFY - Add jump tests
│   └── styles/
│       └── main.css                # MODIFY - Add jump UI styles
```

No new files needed - this extends the existing MemoryView component.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.6]
- [Source: digital-archaeology-web/src/debugger/MemoryView.ts]
- [Source: _bmad-output/implementation-artifacts/5-5-create-memory-view-panel.md]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Initial implementation caused JSDOM error: `scrollIntoView is not a function`
- Fixed by adding check: `if (typeof row.scrollIntoView === 'function')`

### Completion Notes List

1. Added jump-to-address UI to MemoryView component
2. Implemented parseAddress() supporting hex (0x10) and decimal (16) formats
3. Implemented jumpToAddress() with smooth scroll and highlight animation
4. Added error display with "Invalid address" and "Address out of range (0-255)" messages
5. Added public scrollToAddress() API for external components
6. Added 25 new unit tests covering all functionality
7. All 1249 tests pass, build succeeds

### File List

- `src/debugger/MemoryView.ts` - Added jump UI, parsing, jump logic, public API
- `src/debugger/MemoryView.test.ts` - Added 25+ new tests for jump functionality
- `src/styles/main.css` - Added CSS for jump UI components
- `_bmad-output/implementation-artifacts/sprint-status.yaml` - Updated story status to done

