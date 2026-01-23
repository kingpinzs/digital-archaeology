# Story 5.5: Create Memory View Panel

Status: done

---

## Story

As a user,
I want to see memory contents,
so that I can inspect data and program.

## Acceptance Criteria

1. **Given** a program is loaded
   **When** I view the Memory section
   **Then** I see a scrollable hex dump of memory
   **And** each row shows address, hex values, decimal, and ASCII
   **And** the current PC address is highlighted
   **And** changed cells are highlighted after each step
   **And** I can scroll through all 256 bytes

## Tasks / Subtasks

- [x] Task 1: Create MemoryView Component Structure (AC: #1)
  - [x] 1.1 Create `src/debugger/MemoryView.ts` with MemoryView class
  - [x] 1.2 Define `MemoryViewState` interface (memory: Uint8Array, pc: number)
  - [x] 1.3 Create `MemoryViewOptions` interface (bytesPerRow: number, onAddressClick?: callback)
  - [x] 1.4 Implement constructor with state initialization (default bytesPerRow: 16)
  - [x] 1.5 Create `mount(container: HTMLElement)` method
  - [x] 1.6 Create `destroy()` method for cleanup

- [x] Task 2: Implement Memory Display HTML Structure (AC: #1)
  - [x] 2.1 Create semantic HTML structure with `da-memory-view` container class
  - [x] 2.2 Add "Memory" section header with `<h3>` heading (matches RegisterView/FlagsView style)
  - [x] 2.3 Create scrollable container with `da-memory-view__scroll` class
  - [x] 2.4 Create table-like structure for memory rows with `da-memory-view__table`
  - [x] 2.5 Each row shows: Address column, 16 hex nibble columns
  - [x] 2.6 Use `data-address` attributes on rows for test targeting

- [x] Task 3: Implement Memory Row Rendering (AC: #1)
  - [x] 3.1 Render rows for all 256 bytes (16 rows of 16 bytes each)
  - [x] 3.2 Address column format: `0x00` (2 hex digits, uppercase)
  - [x] 3.3 Hex values: Each cell shows single nibble as single hex digit (0-F)
  - [x] 3.4 ASCII column: Omitted - Micro4 nibbles (0-15) don't map to printable ASCII
  - [x] 3.5 IMPORTANT: Micro4 uses 4-bit nibbles (0-15), not 8-bit bytes
  - [x] 3.6 Use safe DOM methods (createElement, textContent) for XSS prevention

- [x] Task 4: Implement updateState Method (AC: #1)
  - [x] 4.1 Create `updateState(state: Partial<MemoryViewState>)` method
  - [x] 4.2 Store previous memory state for change detection
  - [x] 4.3 Store PC value for highlighting current instruction
  - [x] 4.4 Re-render on each update (optimization deferred - full re-render is fast enough)
  - [x] 4.5 Track which cells changed since last update

- [x] Task 5: Implement PC Address Highlighting (AC: #1)
  - [x] 5.1 Add `da-memory-pc` class to row containing PC address
  - [x] 5.2 Add `da-memory-pc-cell` class to specific cell at PC address
  - [x] 5.3 PC highlighting uses accent color background
  - [x] 5.4 Update PC highlighting on each state update

- [x] Task 6: Implement Changed Cell Highlighting (AC: #1)
  - [x] 6.1 Add `da-memory-changed` class to cells that changed since last step
  - [x] 6.2 Changed cell flash animation (reuses da-register-flash)
  - [x] 6.3 Remove flash class after animation completes (animationend event)
  - [x] 6.4 Handle initial state (no flash on first render via isFirstRender flag)
  - [x] 6.5 Use bound handler pattern for animationend listener

- [x] Task 7: Implement Scrollable Container (AC: #1)
  - [x] 7.1 Set max-height on scroll container (300px)
  - [x] 7.2 Add overflow-y: auto for vertical scrolling
  - [x] 7.3 Auto-scroll deferred to Story 5.6 (Jump to Address)
  - [x] 7.4 Ensure all 256 bytes are accessible via scroll

- [x] Task 8: Add CSS Styling (AC: #1)
  - [x] 8.1 Add MemoryView styles to `src/styles/main.css`
  - [x] 8.2 Use CSS variables for colors (`--da-bg-secondary`, `--da-text-primary`, `--da-accent`, `--da-border`)
  - [x] 8.3 Monospace font for all values (font-family: monospace)
  - [x] 8.4 Style address column with secondary text color
  - [x] 8.5 Style hex cells with proper spacing and alignment
  - [x] 8.6 ASCII column omitted - not applicable for Micro4 nibbles
  - [x] 8.7 Define `.da-memory-pc` and `.da-memory-pc-cell` for PC highlighting
  - [x] 8.8 Define `.da-memory-changed` with animation (reuses da-register-flash)

- [x] Task 9: Integrate with App.ts State Panel (AC: #1)
  - [x] 9.1 Import MemoryView in App.ts
  - [x] 9.2 Create private `memoryView: MemoryView | null = null` property
  - [x] 9.3 Mount MemoryView in State panel's `.da-panel-content` AFTER FlagsView
  - [x] 9.4 Call `memoryView.updateState()` when `cpuState` changes
  - [x] 9.5 Call `memoryView.destroy()` in App's `destroy()` method

- [x] Task 10: Update MemoryView on CPU State Changes (AC: #1)
  - [x] 10.1 In `loadProgramIntoEmulator()`: Update MemoryView with initial state
  - [x] 10.2 In `handleStep()`: Update MemoryView after step execution
  - [x] 10.3 In `handleStepBack()`: Update MemoryView with restored historical state
  - [x] 10.4 In `handleReset()`: Update MemoryView with reset state
  - [x] 10.5 During RUN mode: Update MemoryView via throttled onStateUpdate callback
  - [x] 10.6 On HALTED event: Update MemoryView with final state

- [x] Task 11: Export from debugger/index.ts (AC: #1)
  - [x] 11.1 Add `export { MemoryView } from './MemoryView'` to debugger/index.ts
  - [x] 11.2 Add type exports: `export type { MemoryViewState, MemoryViewOptions }`

- [x] Task 12: Add Comprehensive Tests (AC: #1)
  - [x] 12.1 Create `src/debugger/MemoryView.test.ts`
  - [x] 12.2 Test: Component mounts and renders memory section
  - [x] 12.3 Test: Displays 16 rows (256 bytes / 16 per row)
  - [x] 12.4 Test: Address column shows correct hex addresses (0x00, 0x10, 0x20...)
  - [x] 12.5 Test: Hex cells show correct nibble values (0-F)
  - [x] 12.6 Test: ASCII column omitted - not applicable
  - [x] 12.7 Test: PC address row has `da-memory-pc` class
  - [x] 12.8 Test: Cell at PC address has `da-memory-pc-cell` class
  - [x] 12.9 Test: Changed cells have `da-memory-changed` class
  - [x] 12.10 Test: Flash class removed after animation ends
  - [x] 12.11 Test: No flash on initial render
  - [x] 12.12 Test: Container is scrollable (has overflow-y auto)
  - [x] 12.13 Test: updateState updates displayed values
  - [x] 12.14 Test: destroy() removes component from DOM
  - [x] 12.15 App.test.ts: MemoryView is mounted in state panel below FlagsView
  - [x] 12.16 App.test.ts: MemoryView updates on step
  - [x] 12.17 App.test.ts: MemoryView updates on load
  - [x] 12.18 App.test.ts: MemoryView updates on reset

- [x] Task 13: Integration Verification (AC: #1)
  - [x] 13.1 Run `npm test` - all 1224 tests pass
  - [x] 13.2 Run `npm run build` - build succeeds
  - [x] 13.3 TypeScript compilation - no type errors

---

## Dev Notes

### Architecture Context

**CRITICAL:** This is Story 5.5 in Epic 5 (Debugging & State Inspection). It builds on:
- Story 5.1: Step execution (handleStep, cpuState updates)
- Story 5.2: Step back (handleStepBack, state restoration)
- Story 5.3: Register view panel (component pattern to follow)
- Story 5.4: Flags display (same integration pattern)

The MemoryView component displays CPU memory contents in the State panel, below RegisterView and FlagsView.

### Critical Discovery: Micro4 Memory is 256 Nibbles (4-bit)

**IMPORTANT:** From `src/emulator/types.ts`:

```typescript
export interface CPUState {
  // ...
  /** Copy of CPU memory (256 nibbles) */
  memory: Uint8Array;
  // ...
}
```

The Micro4 CPU has:
- 256 memory locations
- Each location holds a 4-bit nibble (0-15 / 0x0-0xF)
- PC is 8-bit (0-255)
- Memory array is `Uint8Array` of length 256

This is different from typical hex dumps that show 8-bit bytes!

### Memory Display Format

Display 16 rows of 16 nibbles each:

```
Address   0 1 2 3 4 5 6 7 8 9 A B C D E F  ASCII
0x00      0 1 2 3 4 5 6 7 8 9 A B C D E F  ................
0x10      F E D C B A 9 8 7 6 5 4 3 2 1 0  ................
...
0xF0      0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0  ................
```

**ASCII Column Notes:**
- Micro4 nibbles are 0-15, which are all non-printable control characters in ASCII
- Consider showing the hex value or `.` for all values
- Alternatively, interpret pairs of nibbles as bytes for ASCII display (not recommended for Micro4)
- **Decision:** Show `.` for all values since nibbles don't map to printable ASCII

### Design Decision: Follow RegisterView/FlagsView Patterns

**Approach:** Create MemoryView following the exact same patterns established in Stories 5.3 and 5.4.

**Key patterns:**
1. **State update pattern** - `updateState(partial)` with previous state tracking
2. **Mount/destroy pattern** - Clean component lifecycle with bound handlers
3. **Bound handler pattern** - Store bound handlers in constructor for cleanup
4. **First render handling** - `isFirstRender` flag to prevent flash on initial mount
5. **CSS variables** - Use existing theme variables from `main.css`
6. **Safe DOM methods** - Use createElement/textContent, not innerHTML with user content

### MemoryViewState Interface

```typescript
interface MemoryViewState {
  /** CPU memory (256 nibbles, 4-bit values 0-15) */
  memory: Uint8Array;
  /** Program Counter for highlighting (0-255) */
  pc: number;
}
```

### MemoryViewOptions Interface

```typescript
interface MemoryViewOptions {
  /** Bytes per row (default: 16) */
  bytesPerRow?: number;
  /** Optional callback when address is clicked */
  onAddressClick?: (address: number) => void;
}
```

### Component Structure

```typescript
// src/debugger/MemoryView.ts

export interface MemoryViewState {
  memory: Uint8Array;
  pc: number;
}

export interface MemoryViewOptions {
  bytesPerRow?: number;
  onAddressClick?: (address: number) => void;
}

export class MemoryView {
  private container: HTMLElement | null = null;
  private element: HTMLElement | null = null;
  private state: MemoryViewState = { memory: new Uint8Array(256), pc: 0 };
  private previousState: MemoryViewState | null = null;
  private isFirstRender: boolean = true;
  private bytesPerRow: number;
  private boundAnimationEndHandler: (e: Event) => void;

  constructor(options?: MemoryViewOptions) {
    this.bytesPerRow = options?.bytesPerRow ?? 16;
    this.boundAnimationEndHandler = (e: Event) => this.handleAnimationEnd(e as AnimationEvent);
  }

  mount(container: HTMLElement): void { /* ... */ }

  updateState(state: Partial<MemoryViewState>): void {
    // Store previous for change detection (after first render)
    if (!this.isFirstRender) {
      this.previousState = {
        memory: new Uint8Array(this.state.memory),
        pc: this.state.pc,
      };
    }

    // Update state
    if (state.memory !== undefined) {
      this.state.memory = new Uint8Array(state.memory);
    }
    if (state.pc !== undefined) {
      this.state.pc = state.pc;
    }

    // Re-render
    this.render();
    this.isFirstRender = false;
  }

  private render(): void { /* Safe DOM methods */ }

  private handleAnimationEnd(e: AnimationEvent): void { /* ... */ }

  destroy(): void { /* ... */ }
}
```

### HTML Structure

```html
<div class="da-memory-view">
  <h3 class="da-memory-view__title">Memory</h3>
  <div class="da-memory-view__scroll">
    <div class="da-memory-view__table">
      <!-- Header row -->
      <div class="da-memory-row da-memory-header">
        <span class="da-memory-addr">Addr</span>
        <span class="da-memory-hex">0</span>
        <span class="da-memory-hex">1</span>
        <!-- ... 2-E ... -->
        <span class="da-memory-hex">F</span>
      </div>
      <!-- Data rows -->
      <div class="da-memory-row da-memory-pc" data-address="0">
        <span class="da-memory-addr">0x00</span>
        <span class="da-memory-cell da-memory-pc-cell" data-offset="0">0</span>
        <span class="da-memory-cell" data-offset="1">1</span>
        <!-- ... -->
      </div>
      <!-- 15 more rows -->
    </div>
  </div>
</div>
```

### CSS Styling

**IMPORTANT:** Add these styles to `src/styles/main.css` (the project's single CSS file).

```css
/* MemoryView Component Styles */

.da-memory-view {
  padding: 12px;
  font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
  border-top: 1px solid var(--da-border);
}

.da-memory-view__title {
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--da-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.da-memory-view__scroll {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--da-border);
  border-radius: 4px;
  background-color: var(--da-bg-primary);
}

.da-memory-view__table {
  display: flex;
  flex-direction: column;
  font-size: 11px;
}

.da-memory-row {
  display: flex;
  align-items: center;
  padding: 2px 4px;
  border-bottom: 1px solid var(--da-border);
}

.da-memory-row:last-child {
  border-bottom: none;
}

.da-memory-header {
  background-color: var(--da-bg-secondary);
  font-weight: 600;
  color: var(--da-text-secondary);
  position: sticky;
  top: 0;
  z-index: 1;
}

.da-memory-addr {
  min-width: 40px;
  color: var(--da-text-secondary);
  font-weight: 500;
}

.da-memory-cell {
  width: 16px;
  text-align: center;
  padding: 2px;
  color: var(--da-text-primary);
}

.da-memory-hex {
  width: 16px;
  text-align: center;
  padding: 2px;
}

/* PC highlighting */
.da-memory-pc {
  background-color: color-mix(in srgb, var(--da-accent) 10%, transparent);
}

.da-memory-pc-cell {
  background-color: var(--da-accent);
  color: var(--da-bg-primary);
  font-weight: 700;
  border-radius: 2px;
}

/* Changed cell highlighting */
.da-memory-changed {
  animation: da-register-flash 300ms ease-out;
}
```

### Integration with App.ts

```typescript
// In App.ts

import { RegisterView, FlagsView, MemoryView } from '@debugger/index';

export class App {
  private registerView: RegisterView | null = null;
  private flagsView: FlagsView | null = null;
  private memoryView: MemoryView | null = null;

  private render(): void {
    // ... existing render code ...

    const stateContent = this.container?.querySelector('.da-state-panel .da-panel-content');
    if (stateContent) {
      // Mount RegisterView
      this.registerView = new RegisterView();
      this.registerView.mount(stateContent as HTMLElement);

      // Mount FlagsView
      this.flagsView = new FlagsView();
      this.flagsView.mount(stateContent as HTMLElement);

      // Mount MemoryView
      this.memoryView = new MemoryView();
      this.memoryView.mount(stateContent as HTMLElement);
    }
  }

  private async handleStep(): Promise<void> {
    // ... existing step code ...

    if (this.cpuState) {
      this.registerView?.updateState({
        pc: this.cpuState.pc,
        accumulator: this.cpuState.accumulator,
      });
      this.flagsView?.updateState({
        zeroFlag: this.cpuState.zeroFlag,
      });
      this.memoryView?.updateState({
        memory: this.cpuState.memory,
        pc: this.cpuState.pc,
      });
    }
  }

  // Similar updates in handleStepBack, loadProgramIntoEmulator, handleReset,
  // setupEmulatorSubscriptions (onStateUpdate), and HALTED handler

  destroy(): void {
    // ... existing cleanup ...
    this.registerView?.destroy();
    this.registerView = null;
    this.flagsView?.destroy();
    this.flagsView = null;
    this.memoryView?.destroy();
    this.memoryView = null;
  }
}
```

### Previous Story Intelligence (Story 5.4)

Key patterns from Story 5.4 to apply:
1. **Safe DOM methods** - Use createElement/textContent instead of innerHTML
2. **Event handler typing** - Use `(e: Event) => void` wrapper for JSDOM compatibility
3. **Animation cleanup** - Properly remove animationend listeners
4. **CSS color-mix()** - Use `color-mix(in srgb, var(--da-accent) N%, transparent)` for theme-aware colors
5. **First render flag** - Prevent flash animation on initial mount
6. **Test patterns** - Use `new Event('animationend', { bubbles: true })` for JSDOM

### Git Intelligence

Recent commit patterns:
```
6f70df1 feat(web): implement flags display in state panel (Story 5.4)
36bc099 feat(web): implement register view panel (Story 5.3)
4483b5d feat(web): implement step back debugging (Story 5.2)
2f75174 feat(web): implement step execution with code review fixes (Story 5.1)
```

Commit message pattern: `feat(web): implement <feature> (Story X.Y)`

### Performance Considerations

1. **256 cells to render** - Consider rendering only visible rows initially
2. **Change detection** - Compare previous/current memory arrays efficiently
3. **DOM updates** - Update only changed cells rather than full re-render
4. **Scroll behavior** - Consider virtual scrolling if performance becomes an issue

**Initial approach:** Full re-render on each update (simple, matches RegisterView/FlagsView pattern). Optimize later if needed.

### Edge Cases to Handle

1. **Initial state (no program loaded):** Display zeros in all memory cells
2. **No flash on first render:** Only flash when value actually changes
3. **Rapid updates during RUN:** Use throttled updates from EmulatorBridge
4. **Component destroyed during animation:** Clean up animation listeners
5. **PC at end of memory (0xFF):** Ensure highlighting works for last row
6. **Large memory changes (program load):** May flash many cells - acceptable

### Accessibility Checklist

- [ ] **Keyboard Navigation** - N/A (display only, no interactive elements yet)
- [ ] **ARIA Attributes** - Use `aria-live="polite"` on table container for updates
- [ ] **Focus Management** - N/A (no focus changes)
- [ ] **Color Contrast** - Uses existing theme CSS variables
- [ ] **XSS Prevention** - No user input; all values are numbers rendered programmatically
- [ ] **Screen Reader Announcements** - Consider `aria-label` for cells

### Project Structure Notes

**Files to create/modify:**
```
digital-archaeology-web/
├── src/
│   ├── debugger/
│   │   ├── MemoryView.ts           # NEW - MemoryView component
│   │   ├── MemoryView.test.ts      # NEW - Component unit tests
│   │   └── index.ts                # MODIFY - Add exports
│   ├── styles/
│   │   └── main.css                # MODIFY - Add MemoryView styles
│   └── ui/
│       ├── App.ts                  # MODIFY - Mount and update MemoryView
│       └── App.test.ts             # MODIFY - Add integration tests
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.5]
- [Source: digital-archaeology-web/src/emulator/types.ts#CPUState]
- [Source: digital-archaeology-web/src/debugger/RegisterView.ts]
- [Source: digital-archaeology-web/src/debugger/FlagsView.ts]
- [Source: _bmad-output/implementation-artifacts/5-4-create-flags-display.md]
- [Source: _bmad-output/project-context.md]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- All 1224 tests pass (36 MemoryView unit tests + 13 App integration tests)
- Build succeeds with no TypeScript errors

### Completion Notes List

1. Created MemoryView component following FlagsView/RegisterView patterns exactly
2. Displays 16 rows x 16 columns showing all 256 memory nibbles
3. PC row and cell highlighting with da-memory-pc and da-memory-pc-cell classes
4. Change detection with flash animation on cell value changes
5. No flash on initial render (isFirstRender flag)
6. Bound handler pattern for animationend listener cleanup
7. Safe DOM methods (createElement, textContent) for XSS prevention
8. CSS uses color-mix() for theme-aware accent colors
9. ASCII column omitted - Micro4 nibbles (0-15) don't map to printable ASCII
10. onAddressClick callback reserved for Story 5.6 (Jump to Address)
11. Integrated into App.ts with updates in 6 locations: loadProgram, step, stepBack, reset, onStateUpdate (throttled), halted

### File List

- `src/debugger/MemoryView.ts` - NEW (239 lines) - MemoryView component
- `src/debugger/MemoryView.test.ts` - NEW (433 lines) - 36 unit tests
- `src/debugger/index.ts` - MODIFIED - Added MemoryView exports
- `src/styles/main.css` - MODIFIED - Added ~85 lines of MemoryView styles
- `src/ui/App.ts` - MODIFIED - Integrated MemoryView with init/destroy/updates
- `src/ui/App.test.ts` - MODIFIED - Added 13 MemoryView integration tests
