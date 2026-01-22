# Story 1.7: Create Toolbar Component

Status: done

---

## Story

As a user,
I want a toolbar with action buttons,
So that I can access primary actions like Assemble, Run, Step.

## Acceptance Criteria

1. **Given** the application is loaded
   **When** I view the toolbar
   **Then** I see a File dropdown menu trigger
   **And** I see Assemble, Run, Pause, Reset, Step buttons (disabled initially)
   **And** I see a speed control slider
   **And** I see Settings (⚙) and Help (?) buttons
   **And** buttons are styled according to the design system
   **And** hover states are visible

## Tasks / Subtasks

- [x] Task 1: Create Toolbar Component Structure (AC: #1)
  - [x] 1.1 Create `src/ui/Toolbar.ts` as a new component
  - [x] 1.2 Define `Toolbar` class with `mount(container: HTMLElement)` method
  - [x] 1.3 Implement `render()` method that returns toolbar HTML
  - [x] 1.4 Export `Toolbar` class from `src/ui/index.ts`

- [x] Task 2: Create Toolbar Button Components (AC: #1)
  - [x] 2.1 Create File dropdown trigger button (📁▾)
  - [x] 2.2 Create Assemble button (⚡ Assemble) - disabled initially
  - [x] 2.3 Create Run button (▶ Run) - disabled initially
  - [x] 2.4 Create Pause button (⏸) - hidden initially, shown when running
  - [x] 2.5 Create Reset button (⏹ Reset) - disabled initially
  - [x] 2.6 Create Step button (⏭ Step) - disabled initially
  - [x] 2.7 Create Settings button (⚙) - always enabled
  - [x] 2.8 Create Help button (?) - always enabled

- [x] Task 3: Implement Speed Control Slider (AC: #1)
  - [x] 3.1 Create speed slider input (range: 1-100, default: 50)
  - [x] 3.2 Add speed label showing current value
  - [x] 3.3 Style slider according to design system

- [x] Task 4: Add CSS Classes for Toolbar Styling (AC: #1)
  - [x] 4.1 Add `.da-toolbar-btn` base class for toolbar buttons
  - [x] 4.2 Add `.da-toolbar-btn--icon` for icon-only buttons (32x32)
  - [x] 4.3 Add `.da-toolbar-btn--primary` for primary action buttons
  - [x] 4.4 Add `.da-toolbar-btn:disabled` styles (opacity, no hover)
  - [x] 4.5 Add `.da-toolbar-btn:hover` styles (background change)
  - [x] 4.6 Add `.da-toolbar-divider` for visual separator between button groups
  - [x] 4.7 Add `.da-speed-slider` for speed control styling

- [x] Task 5: Implement Button State Management (AC: #1)
  - [x] 5.1 Define `ToolbarState` interface with button enabled/disabled states
  - [x] 5.2 Implement `updateState(state: Partial<ToolbarState>)` method
  - [x] 5.3 Initial state: only File, Settings, Help enabled; others disabled
  - [x] 5.4 Add `isRunning` state to toggle Run/Pause visibility

- [x] Task 6: Implement Button Event Callbacks (AC: #1)
  - [x] 6.1 Define `ToolbarCallbacks` interface for button click handlers
  - [x] 6.2 Accept callbacks in Toolbar constructor
  - [x] 6.3 Wire up click handlers to buttons
  - [x] 6.4 Wire up slider change handler

- [x] Task 7: Integrate Toolbar into App.ts (AC: #1)
  - [x] 7.1 Import Toolbar component in App.ts
  - [x] 7.2 Replace placeholder toolbar HTML with Toolbar component mount
  - [x] 7.3 Pass callback stubs (console.log for now)
  - [x] 7.4 Store Toolbar instance for state updates and cleanup

- [x] Task 8: Add Accessibility Attributes (AC: #1)
  - [x] 8.1 Add `role="toolbar"` to toolbar container
  - [x] 8.2 Add `aria-label` to toolbar ("Main toolbar")
  - [x] 8.3 Add `aria-label` to each button describing its action
  - [x] 8.4 Add `title` attributes for tooltips
  - [x] 8.5 Add `aria-pressed` for toggle buttons (Run/Pause)

- [x] Task 9: Write Unit Tests for Toolbar (AC: #1)
  - [x] 9.1 Test toolbar renders all buttons
  - [x] 9.2 Test initial button states (File, Settings, Help enabled)
  - [x] 9.3 Test updateState enables/disables buttons correctly
  - [x] 9.4 Test click handlers are called
  - [x] 9.5 Test slider value changes
  - [x] 9.6 Test Run/Pause visibility toggle
  - [x] 9.7 Test accessibility attributes are present

- [x] Task 10: Validate Toolbar Implementation (AC: #1)
  - [x] 10.1 Verify all buttons render correctly
  - [x] 10.2 Verify hover states work
  - [x] 10.3 Verify disabled buttons don't respond to clicks
  - [x] 10.4 Verify slider changes fire callback
  - [x] 10.5 Run `npm run build` - must complete without errors
  - [x] 10.6 Run `npx tsc --noEmit` - must pass with no TypeScript errors

---

## Dev Notes

### Previous Story Intelligence (Story 1.6)

**Key Learnings from Story 1.6:**
- Components follow mount/destroy pattern with proper cleanup
- CSS uses `--da-*` custom properties for theming
- Accessibility attributes (role, aria-label) required on interactive elements
- Tests use Vitest with jsdom for DOM testing
- All TypeScript strict mode - no `any`, use `null` not `undefined`

**Current Toolbar in App.ts:**
```html
<header class="da-toolbar">
  <span class="da-toolbar-text">Toolbar</span>
</header>
```

This placeholder will be replaced by the Toolbar component.

### Toolbar Layout from UX Specification

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [📁▾]  [⚡ Assemble]  [▶ Run] [⏸] [⏹ Reset] [⏭ Step]      │ [?] [⚙]      │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Button Groups:**
1. **Left Group:** File dropdown trigger
2. **Center Group:** Assemble, Run/Pause, Reset, Step (execution controls)
3. **Right Group:** Speed slider, Help, Settings

**Button States:**
| Button | Initial State | When Enabled |
|--------|---------------|--------------|
| File ▾ | Enabled | Always |
| Assemble | Disabled | When code exists (Epic 2) |
| Run | Disabled | After assemble |
| Pause | Hidden | Shown when running |
| Reset | Disabled | After assemble |
| Step | Disabled | After assemble |
| Help (?) | Enabled | Always |
| Settings (⚙) | Enabled | Always |

### Component Pattern

Follow the same pattern as PanelResizer:

```typescript
// src/ui/Toolbar.ts

export interface ToolbarState {
  canAssemble: boolean;
  canRun: boolean;
  canPause: boolean;
  canReset: boolean;
  canStep: boolean;
  isRunning: boolean;
  speed: number;
}

export interface ToolbarCallbacks {
  onFileClick: () => void;
  onAssembleClick: () => void;
  onRunClick: () => void;
  onPauseClick: () => void;
  onResetClick: () => void;
  onStepClick: () => void;
  onSpeedChange: (speed: number) => void;
  onHelpClick: () => void;
  onSettingsClick: () => void;
}

export class Toolbar {
  private element: HTMLElement | null = null;
  private state: ToolbarState;
  private callbacks: ToolbarCallbacks;

  constructor(callbacks: ToolbarCallbacks) {
    this.callbacks = callbacks;
    this.state = {
      canAssemble: false,
      canRun: false,
      canPause: false,
      canReset: false,
      canStep: false,
      isRunning: false,
      speed: 50,
    };
  }

  mount(container: HTMLElement): void {
    this.element = this.render();
    container.appendChild(this.element);
    this.attachEventListeners();
  }

  updateState(newState: Partial<ToolbarState>): void {
    this.state = { ...this.state, ...newState };
    this.updateButtonStates();
  }

  destroy(): void {
    // Remove element and event listeners
  }
}
```

### CSS Class Structure

```css
/* Toolbar button base */
.da-toolbar-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 12px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--da-text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.da-toolbar-btn:hover:not(:disabled) {
  background-color: var(--da-bg-tertiary);
}

.da-toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Icon-only variant */
.da-toolbar-btn--icon {
  width: 32px;
  padding: 0;
}

/* Primary action variant */
.da-toolbar-btn--primary {
  background-color: var(--da-accent);
  color: var(--da-bg-primary);
}

.da-toolbar-btn--primary:hover:not(:disabled) {
  background-color: var(--da-accent-hover);
}

/* Button group divider */
.da-toolbar-divider {
  width: 1px;
  height: 24px;
  background-color: var(--da-border);
  margin: 0 8px;
}

/* Speed slider */
.da-speed-slider {
  width: 100px;
  height: 4px;
  -webkit-appearance: none;
  background: var(--da-border);
  border-radius: 2px;
}

.da-speed-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  background: var(--da-accent);
  border-radius: 50%;
  cursor: pointer;
}
```

### Integration with App.ts

The Toolbar will be mounted inside the existing `<header class="da-toolbar">` element:

```typescript
// In App.ts
import { Toolbar, ToolbarCallbacks } from './Toolbar';

export class App {
  private toolbar: Toolbar | null = null;

  private initializeToolbar(): void {
    const toolbarContainer = this.container?.querySelector('.da-toolbar');
    if (!toolbarContainer) return;

    // Clear placeholder content
    toolbarContainer.innerHTML = '';

    const callbacks: ToolbarCallbacks = {
      onFileClick: () => console.log('File clicked'),
      onAssembleClick: () => console.log('Assemble clicked'),
      onRunClick: () => console.log('Run clicked'),
      onPauseClick: () => console.log('Pause clicked'),
      onResetClick: () => console.log('Reset clicked'),
      onStepClick: () => console.log('Step clicked'),
      onSpeedChange: (speed) => console.log('Speed:', speed),
      onHelpClick: () => console.log('Help clicked'),
      onSettingsClick: () => console.log('Settings clicked'),
    };

    this.toolbar = new Toolbar(callbacks);
    this.toolbar.mount(toolbarContainer as HTMLElement);
  }
}
```

### Unicode Icons to Use

| Button | Icon | Unicode |
|--------|------|---------|
| File | 📁 | U+1F4C1 |
| Assemble | ⚡ | U+26A1 |
| Run | ▶ | U+25B6 |
| Pause | ⏸ | U+23F8 |
| Reset | ⏹ | U+23F9 |
| Step | ⏭ | U+23ED |
| Help | ? | U+003F |
| Settings | ⚙ | U+2699 |
| Dropdown | ▾ | U+25BE |

Note: Use actual Unicode characters in the HTML, not emoji images, for consistent rendering.

### Testing Considerations

**Unit Tests (Vitest + jsdom):**
- Test button rendering and initial states
- Test state updates enable/disable buttons
- Test click handlers fire callbacks
- Test slider change fires callback
- Test accessibility attributes

**Example Test:**
```typescript
it('should disable execution buttons initially', () => {
  const toolbar = new Toolbar(mockCallbacks);
  toolbar.mount(container);

  const assembleBtn = container.querySelector('[data-action="assemble"]');
  const runBtn = container.querySelector('[data-action="run"]');

  expect(assembleBtn?.hasAttribute('disabled')).toBe(true);
  expect(runBtn?.hasAttribute('disabled')).toBe(true);
});
```

### Files to Create

- `src/ui/Toolbar.ts` - Toolbar component
- `src/ui/Toolbar.test.ts` - Unit tests

### Files to Modify

- `src/ui/App.ts` - Import and mount Toolbar, replace placeholder
- `src/ui/App.test.ts` - Update tests for Toolbar integration
- `src/ui/index.ts` - Export Toolbar
- `src/styles/main.css` - Add toolbar button CSS classes

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.7]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Toolbar]
- [Source: _bmad-output/implementation-artifacts/1-6-implement-resizable-panel-system.md]
- [Source: _bmad-output/project-context.md]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

1. **Toolbar Component Created** - Implemented `src/ui/Toolbar.ts` with full `ToolbarState` and `ToolbarCallbacks` interfaces, mount/destroy pattern, and button caching for efficient state updates
2. **All Buttons Implemented** - File (📁▾), Assemble (⚡), Run (▶), Pause (⏸), Reset (⏹), Step (⏭), Help (?), Settings (⚙)
3. **Speed Control Slider** - Range input 1-100 with default value 50, updates label on change
4. **Button State Management** - `updateState()` method enables/disables buttons, toggles Run/Pause visibility based on `isRunning`
5. **Event Callbacks Wired** - All button clicks dispatch to appropriate callbacks, slider change calls `onSpeedChange`
6. **CSS Styling Added** - `.da-toolbar-btn`, `.da-toolbar-btn--icon`, `.da-toolbar-btn--primary`, `.da-toolbar-divider`, `.da-speed-slider`, `.da-speed-label`
7. **Accessibility Complete** - `role="toolbar"`, `aria-label` on all buttons, `title` tooltips, `aria-pressed` on Run/Pause toggles
8. **App.ts Integration** - Toolbar mounted in `initializeToolbar()`, destroyed in `destroyToolbar()`, exposed via `getToolbar()`
9. **Comprehensive Tests** - 49 tests for Toolbar component + 4 new tests for App integration = 144 total tests passing
10. **Build Verification** - TypeScript compilation passes, production build succeeds in 556ms

### Code Review Fixes Applied (2026-01-21)

**Issues Fixed:**
1. **[HIGH-1] Event Listener Memory Leak** - Added proper cleanup in `destroy()` - stores bound handlers and removes them
2. **[MEDIUM-1] Keyboard Navigation** - Added WAI-ARIA toolbar pattern: ArrowLeft/Right, Home/End key support
3. **[MEDIUM-2] Missing getState() Test** - Added 2 tests for `getState()` method
4. **[MEDIUM-3] console.log Statements** - Replaced with no-op placeholder comments in App.ts
5. **[MEDIUM-4] Firefox Slider Styling** - Added `::-moz-range-track` styling
6. **[LOW-1] Pause Button Test** - Added test verifying pause button enabled state when `canPause=true`
7. **[LOW-2] Speed Slider ARIA Values** - Added `aria-valuenow/valuemin/valuemax` attributes and `updateSliderAriaValues()` method
8. **[LOW-3] Story Line Count** - Fixed to reflect actual line counts

### File List

**Created:**
- `src/ui/Toolbar.ts` - Toolbar component with keyboard nav & ARIA support (400 lines)
- `src/ui/Toolbar.test.ts` - Unit tests (49 tests, 686 lines)

**Modified:**
- `src/ui/App.ts` - Added toolbar integration, `initializeToolbar()`, `destroyToolbar()`, `getToolbar()`
- `src/ui/App.test.ts` - Added toolbar integration tests (4 new tests)
- `src/ui/index.ts` - Added Toolbar exports
- `src/styles/main.css` - Added toolbar button CSS classes with Firefox support (~125 lines)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` - Updated story status

---
