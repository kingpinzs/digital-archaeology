# Story 5.3: Create Register View Panel

Status: ready-for-dev

---

## Story

As a user,
I want to see register values,
so that I can understand CPU state.

## Acceptance Criteria

1. **Given** a program is loaded
   **When** I view the State panel
   **Then** I see a Registers section
   **And** PC is displayed in hex and decimal
   **And** Accumulator is displayed in hex and decimal
   **And** changed values flash briefly with accent color
   **And** values update after each step

## Tasks / Subtasks

- [ ] Task 1: Create RegisterView Component Structure (AC: #1)
  - [ ] 1.1 Create `src/debugger/RegisterView.ts` with RegisterView class
  - [ ] 1.2 Define `RegisterViewState` interface (pc, accumulator, zeroFlag, halted, previousPc, previousAccumulator)
  - [ ] 1.3 Create `RegisterViewOptions` interface (onMount callbacks if needed)
  - [ ] 1.4 Implement constructor with state initialization
  - [ ] 1.5 Create `mount(container: HTMLElement)` method
  - [ ] 1.6 Create `destroy()` method for cleanup

- [ ] Task 2: Implement Register Display HTML Structure (AC: #1)
  - [ ] 2.1 Create semantic HTML structure with `da-register-view` container class
  - [ ] 2.2 Add "Registers" section header with `<h3>` or appropriate heading
  - [ ] 2.3 Create PC row with label, hex value (`0x00`), and decimal value (`(0)`)
  - [ ] 2.4 Create Accumulator row with label, hex value (`0x0`), and decimal value (`(0)`)
  - [ ] 2.5 Add `data-register` attributes for test targeting (pc, accumulator)
  - [ ] 2.6 Use `aria-live="polite"` on value containers for screen reader updates

- [ ] Task 3: Implement updateState Method (AC: #1)
  - [ ] 3.1 Create `updateState(state: Partial<RegisterViewState>)` method
  - [ ] 3.2 Store previous values before updating for change detection
  - [ ] 3.3 Format PC as hex (2 digits, uppercase) and decimal: `0x${hex} (${dec})`
  - [ ] 3.4 Format Accumulator as hex (1 digit, uppercase) and decimal: `0x${hex} (${dec})`
  - [ ] 3.5 Update DOM elements with new formatted values

- [ ] Task 4: Implement Change Flash Animation (AC: #1)
  - [ ] 4.1 Add `da-register-changed` CSS class to register row when value changes
  - [ ] 4.2 CSS animation: brief accent color background flash (~300ms)
  - [ ] 4.3 Remove class after animation completes (use `animationend` event)
  - [ ] 4.4 Compare current vs previous value to detect changes
  - [ ] 4.5 Handle initial state (no flash on first render)

- [ ] Task 5: Add CSS Styling (AC: #1)
  - [ ] 5.1 Add RegisterView styles to `src/styles/main.css` (all project CSS is in this single file)
  - [ ] 5.2 Use CSS variables for colors (`--da-bg-secondary`, `--da-text-primary`, `--da-accent`, `--da-border`)
  - [ ] 5.3 Style register rows with proper spacing and alignment (use Tailwind spacing or define variables)
  - [ ] 5.4 Ensure monospace font for hex values (use `font-family: monospace` or Tailwind `font-mono`)
  - [ ] 5.5 Define `@keyframes da-register-flash` animation
  - [ ] 5.6 Style `.da-register-changed` with animation

- [ ] Task 6: Integrate with App.ts State Panel (AC: #1)
  - [ ] 6.1 Import RegisterView in App.ts
  - [ ] 6.2 Create private `registerView: RegisterView | null = null` property
  - [ ] 6.3 Mount RegisterView in State panel's `.da-panel-content` during `render()`
  - [ ] 6.4 Call `registerView.updateState()` when `cpuState` changes (after step, load, reset, step-back)
  - [ ] 6.5 Call `registerView.destroy()` in App's `destroy()` method

- [ ] Task 7: Update RegisterView on CPU State Changes (AC: #1)
  - [ ] 7.1 In `handleLoad()`: Update RegisterView with initial state
  - [ ] 7.2 In `handleStep()`: Update RegisterView after step execution
  - [ ] 7.3 In `handleStepBack()`: Update RegisterView with restored state
  - [ ] 7.4 In `handleReset()`: Update RegisterView with reset state
  - [ ] 7.5 During RUN mode: Update RegisterView via onStateUpdate callback (use existing throttle pattern: `STATE_UPDATE_THROTTLE_MS = 16`)
  - [ ] 7.6 On HALTED event: Update RegisterView (state already current)

- [ ] Task 8: Export from debugger/index.ts (AC: #1)
  - [ ] 8.1 Add `export { RegisterView } from './RegisterView'` to debugger/index.ts
  - [ ] 8.2 Add type exports: `export type { RegisterViewState, RegisterViewOptions }`

- [ ] Task 9: Add Comprehensive Tests (AC: #1)
  - [ ] 9.1 Create `src/debugger/RegisterView.test.ts`
  - [ ] 9.2 Test: Component mounts and renders register section
  - [ ] 9.3 Test: PC displays in hex and decimal format
  - [ ] 9.4 Test: Accumulator displays in hex and decimal format
  - [ ] 9.5 Test: updateState updates displayed values
  - [ ] 9.6 Test: Changed values receive `da-register-changed` class
  - [ ] 9.7 Test: Flash class is removed after animation
  - [ ] 9.8 Test: No flash on initial render
  - [ ] 9.9 Test: destroy() removes component from DOM
  - [ ] 9.10 App.test.ts: RegisterView is mounted in state panel
  - [ ] 9.11 App.test.ts: RegisterView updates on step
  - [ ] 9.12 App.test.ts: RegisterView updates on load
  - [ ] 9.13 App.test.ts: RegisterView updates on reset

- [ ] Task 10: Integration Verification (AC: #1)
  - [ ] 10.1 Run `npm test` - all tests pass
  - [ ] 10.2 Run `npm run build` - build succeeds
  - [ ] 10.3 TypeScript compilation - no type errors
  - [ ] 10.4 Manual verification: Load program, step, observe register updates

---

## Dev Notes

### Architecture Context

**CRITICAL:** This is Story 5.3 in Epic 5 (Debugging & State Inspection). It builds on:
- Story 5.1: Step execution (handleStep, cpuState updates)
- Story 5.2: Step back (handleStepBack, state restoration)

The RegisterView component displays CPU register values (PC, Accumulator) in the State panel on the right side of the 3-panel layout.

### Design Decision: Standalone Component in debugger/

**Approach:** Create RegisterView as a standalone component in `src/debugger/` following architecture spec.

**Rationale:**
1. Architecture specifies `debugger/RegisterView.ts` location
2. Keeps debugging UI separate from core App.ts
3. Reusable across different debug scenarios
4. Clean separation of concerns

### CPUState Fields to Display

From `src/emulator/types.ts`:
```typescript
interface CPUState {
  pc: number;           // Program Counter (0-255) - 8-bit
  accumulator: number;  // Accumulator (0-15) - 4-bit
  zeroFlag: boolean;    // Zero flag (display in Story 5.4)
  halted: boolean;      // CPU halted state
  // ... other fields for memory view (Story 5.5)
}
```

### Display Format Requirements

| Register | Hex Format | Decimal Format | Example |
|----------|------------|----------------|---------|
| PC | `0x` + 2 uppercase hex digits | `(0-255)` | `0x2A (42)` |
| Accumulator | `0x` + 1 uppercase hex digit | `(0-15)` | `0xF (15)` |

### RegisterView State Interface

```typescript
interface RegisterViewState {
  pc: number;
  accumulator: number;
  // Track previous values for change detection
  previousPc: number | null;
  previousAccumulator: number | null;
}
```

### Component Structure

```typescript
// src/debugger/RegisterView.ts

export interface RegisterViewState {
  pc: number;
  accumulator: number;
}

export interface RegisterViewOptions {
  // Future: callbacks for register click events
}

export class RegisterView {
  private container: HTMLElement | null = null;
  private element: HTMLElement | null = null;
  private state: RegisterViewState = { pc: 0, accumulator: 0 };
  private previousState: RegisterViewState | null = null;

  constructor(options?: RegisterViewOptions) { /* ... */ }

  mount(container: HTMLElement): void { /* ... */ }

  updateState(state: Partial<RegisterViewState>): void {
    // Store previous for change detection
    this.previousState = { ...this.state };

    // Update state
    if (state.pc !== undefined) this.state.pc = state.pc;
    if (state.accumulator !== undefined) this.state.accumulator = state.accumulator;

    // Re-render
    this.render();
  }

  private render(): void { /* ... */ }

  destroy(): void { /* ... */ }
}
```

### HTML Structure

```html
<div class="da-register-view">
  <h3 class="da-register-view__title">Registers</h3>
  <div class="da-register-view__list">
    <div class="da-register-row" data-register="pc">
      <span class="da-register-label">PC</span>
      <span class="da-register-value" aria-live="polite">0x00 (0)</span>
    </div>
    <div class="da-register-row" data-register="accumulator">
      <span class="da-register-label">ACC</span>
      <span class="da-register-value" aria-live="polite">0x0 (0)</span>
    </div>
  </div>
</div>
```

### CSS Animation for Value Changes

**IMPORTANT:** Add these styles to `src/styles/main.css` (the project's single CSS file).

```css
/* Add to src/styles/main.css - RegisterView Component Styles */

.da-register-view {
  padding: 12px; /* Use fixed values or define --da-spacing-md in :root if needed */
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}

.da-register-view__title {
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--da-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.da-register-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px solid var(--da-border); /* Correct variable name */
}

.da-register-row:last-child {
  border-bottom: none;
}

.da-register-label {
  font-weight: 500;
  color: var(--da-text-secondary);
}

.da-register-value {
  color: var(--da-text-primary);
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}

/* Flash animation for changed values */
@keyframes da-register-flash {
  0% { background-color: var(--da-accent); }
  100% { background-color: transparent; }
}

.da-register-changed {
  animation: da-register-flash 300ms ease-out;
}
```

### Integration with App.ts

```typescript
// In App.ts

import { RegisterView } from '@debugger/index';

export class App {
  private registerView: RegisterView | null = null;

  private render(): void {
    // ... existing render code ...

    // Mount RegisterView in state panel (add after existing render content)
    const stateContent = this.container?.querySelector('.da-state-panel .da-panel-content');
    if (stateContent) {
      this.registerView = new RegisterView();
      this.registerView.mount(stateContent as HTMLElement);
    }
  }

  private async handleStep(): Promise<void> {
    // ... existing step code ...

    // Update RegisterView with new state
    if (this.cpuState) {
      this.registerView?.updateState({
        pc: this.cpuState.pc,
        accumulator: this.cpuState.accumulator,
      });
    }
  }

  private async handleStepBack(): Promise<void> {
    // ... existing step-back code ...
    // IMPORTANT: Use historicalState values (not emulator state which resets PC to 0)
    this.registerView?.updateState({
      pc: historicalState.pc,
      accumulator: historicalState.accumulator,
    });
  }

  private async loadProgramIntoEmulator(binary: Uint8Array): Promise<void> {
    // ... existing load code ...
    // Update RegisterView with initial state
    if (this.cpuState) {
      this.registerView?.updateState({
        pc: this.cpuState.pc,
        accumulator: this.cpuState.accumulator,
      });
    }
  }

  private async handleReset(): Promise<void> {
    // ... existing reset code ...
    // Update RegisterView with reset state
    if (this.cpuState) {
      this.registerView?.updateState({
        pc: this.cpuState.pc,
        accumulator: this.cpuState.accumulator,
      });
    }
  }

  private setupEmulatorSubscriptions(): void {
    // ... existing subscription setup ...
    // Add RegisterView update to throttled state callback
    this.unsubscribeStateUpdate = this.emulatorBridge.onStateUpdate((state) => {
      this.cpuState = state;
      const now = performance.now();
      if (now - this.lastStateUpdateTime >= this.STATE_UPDATE_THROTTLE_MS) {
        this.lastStateUpdateTime = now;
        this.statusBar?.updateState({ ... });
        // ADD: Update RegisterView during RUN mode
        this.registerView?.updateState({
          pc: state.pc,
          accumulator: state.accumulator,
        });
      }
    });
  }

  destroy(): void {
    // ... existing cleanup ...
    this.registerView?.destroy();
    this.registerView = null;
  }
}
```

### Test Patterns (from Story 5.2)

```typescript
// src/debugger/RegisterView.test.ts

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RegisterView } from './RegisterView';

describe('RegisterView', () => {
  let container: HTMLDivElement;
  let registerView: RegisterView;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    registerView = new RegisterView();
  });

  afterEach(() => {
    registerView.destroy();
    document.body.removeChild(container);
  });

  describe('mount', () => {
    it('should render register section with title', () => {
      registerView.mount(container);
      expect(container.querySelector('.da-register-view')).not.toBeNull();
      expect(container.querySelector('.da-register-view__title')?.textContent).toBe('Registers');
    });

    it('should display PC in hex and decimal', () => {
      registerView.mount(container);
      registerView.updateState({ pc: 42 });
      const pcValue = container.querySelector('[data-register="pc"] .da-register-value');
      expect(pcValue?.textContent).toBe('0x2A (42)');
    });

    // ... more tests
  });
});
```

### Accessibility Checklist

- [ ] **Keyboard Navigation** - N/A (display only, no interactive elements yet)
- [ ] **ARIA Attributes** - `aria-live="polite"` on value containers for screen reader updates
- [ ] **Focus Management** - N/A (no focus changes)
- [x] **Color Contrast** - Uses existing theme CSS variables
- [x] **XSS Prevention** - No user input displayed; values are numbers formatted programmatically
- [x] **Screen Reader Announcements** - `aria-live="polite"` announces value changes

### Project Structure Notes

**Files to create/modify:**
```
digital-archaeology-web/
├── src/
│   ├── debugger/
│   │   ├── RegisterView.ts         # NEW - RegisterView component
│   │   ├── RegisterView.test.ts    # NEW - Component unit tests
│   │   └── index.ts                # MODIFY - Add exports
│   ├── styles/
│   │   └── main.css                # MODIFY - Add RegisterView styles (all CSS is here)
│   └── ui/
│       ├── App.ts                  # MODIFY - Mount and update RegisterView
│       └── App.test.ts             # MODIFY - Add minimal integration tests (3-4 tests)
```

**Note:** Keep App.test.ts integration tests minimal (mount verification, basic update flow). Comprehensive tests belong in RegisterView.test.ts.

### Previous Story Intelligence (Story 5.2)

Key patterns from Story 5.2 to apply:
1. **State update pattern** - `updateState(partial)` with previous state tracking
2. **Mount/destroy pattern** - Clean component lifecycle
3. **Test patterns** - Mock emulatorBridge, verify DOM updates
4. **CSS variables** - Use existing theme variables from `main.css` (`--da-bg-secondary`, `--da-text-primary`, `--da-accent`, `--da-border`)
5. **Bound handler pattern** - Store bound handlers for proper cleanup
6. **Step-back state fix** - In `handleStepBack()`, use `historicalState` for UI updates (emulator resets PC to 0, but we track correct values via `this.cpuState = historicalState`)

### Edge Cases to Handle

1. **Initial state (no program loaded):** Display `0x00 (0)` for PC, `0x0 (0)` for ACC
2. **No flash on first render:** Only flash when value actually changes
3. **Rapid updates during RUN:** Ensure flash animation doesn't stack/conflict (use existing `STATE_UPDATE_THROTTLE_MS = 16` pattern in setupEmulatorSubscriptions)
4. **Component destroyed during animation:** Clean up animation listeners via `animationend` handler
5. **Step-back state consistency:** In `handleStepBack()`, use `historicalState` values (not emulator state which resets to PC=0). The correct pattern is already in App.ts: `this.cpuState = historicalState`

### RUN Mode Update Pattern

During continuous execution, RegisterView updates are handled by the existing `onStateUpdate` subscription in `setupEmulatorSubscriptions()`. The updates are throttled to ~60fps:

```typescript
// Existing pattern in App.ts - follow this for RegisterView updates
this.unsubscribeStateUpdate = this.emulatorBridge.onStateUpdate((state) => {
  this.cpuState = state;
  const now = performance.now();
  if (now - this.lastStateUpdateTime >= this.STATE_UPDATE_THROTTLE_MS) {
    this.lastStateUpdateTime = now;
    // Add RegisterView update here:
    this.registerView?.updateState({
      pc: state.pc,
      accumulator: state.accumulator,
    });
  }
});
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.3]
- [Source: _bmad-output/planning-artifacts/architecture.md#debugger]
- [Source: digital-archaeology-web/src/emulator/types.ts#CPUState]
- [Source: digital-archaeology-web/src/ui/App.ts#render]
- [Source: _bmad-output/implementation-artifacts/5-2-implement-step-back.md]
- [Source: _bmad-output/project-context.md]

---

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

