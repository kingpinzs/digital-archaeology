# Story 1.10: Create Panel Header Components

Status: done

---

## Story

As a user,
I want each panel to have a header with title and close button,
So that I can identify panels and optionally hide them.

## Acceptance Criteria

1. **Given** the 3-panel layout is displayed
   **When** I view a panel
   **Then** I see a header with the panel title (CODE, CIRCUIT, STATE)
   **And** I see a close [×] button
   **And** clicking close hides the panel
   **And** the layout adjusts when a panel is hidden
   **And** there is a way to restore hidden panels (View menu)

## Tasks / Subtasks

- [x] Task 1: Create PanelHeader Component Structure (AC: #1)
  - [x] 1.1 Create `src/ui/PanelHeader.ts` as a new component
  - [x] 1.2 Define `PanelHeader` class with `mount(container: HTMLElement)` method
  - [x] 1.3 Accept configuration: `title: string`, `panelId: 'code' | 'circuit' | 'state'`, `onClose: () => void`
  - [x] 1.4 Implement `render()` method that returns header HTML with title and close button
  - [x] 1.5 Implement `destroy()` method for cleanup (remove event listeners)
  - [x] 1.6 Export `PanelHeader` class from `src/ui/index.ts`

- [x] Task 2: Style the Panel Header (AC: #1)
  - [x] 2.1 Use existing `.da-panel-header` class (32px height already defined)
  - [x] 2.2 Add `.da-panel-close-btn` for the close button styling
  - [x] 2.3 Close button shows × character, 20x20px hit target, hover highlight
  - [x] 2.4 Close button uses `--da-text-secondary` color, `--da-accent` on hover
  - [x] 2.5 Ensure title uses existing `.da-panel-title` styling (uppercase, 12px, semibold)

- [x] Task 3: Implement Panel Visibility State (AC: #1)
  - [x] 3.1 Add `panelVisibility` state to App.ts: `{ code: boolean, circuit: boolean, state: boolean }`
  - [x] 3.2 Default all panels to visible (true)
  - [x] 3.3 Create `setPanelVisibility(panelId: string, visible: boolean)` method
  - [x] 3.4 Create `getPanelVisibility()` method returning current state
  - [x] 3.5 Create `togglePanel(panelId: string)` method for convenience

- [x] Task 4: Wire Close Button to Hide Panel (AC: #1)
  - [x] 4.1 PanelHeader close button calls `onClose` callback when clicked
  - [x] 4.2 App.ts passes `setPanelVisibility(panelId, false)` as onClose callback
  - [x] 4.3 When visibility changes, update CSS class on panel: `.da-panel--hidden`
  - [x] 4.4 Hidden panels get `display: none` via CSS

- [x] Task 5: Adjust Layout When Panel Hidden (AC: #1)
  - [x] 5.1 Modify grid-template-columns to exclude hidden panels
  - [x] 5.2 When code panel hidden: remove code column from grid
  - [x] 5.3 When state panel hidden: remove state column from grid
  - [x] 5.4 When circuit panel hidden: keep placeholder or hide entirely (edge case)
  - [x] 5.5 Use CSS classes for layout adjustment

- [x] Task 6: Wire View Menu to Restore Panels (AC: #1)
  - [x] 6.1 MenuBar already has View menu with onViewCodePanel, onViewCircuitPanel, onViewStatePanel callbacks
  - [x] 6.2 Wire these callbacks to `togglePanel()` in App.ts
  - [x] 6.3 Update MenuBar state to show checkmark (✓) when panel is visible
  - [x] 6.4 Add `setPanelStates(states: { code: boolean, circuit: boolean, state: boolean })` to MenuBar
  - [x] 6.5 App.ts calls MenuBar.setPanelStates when visibility changes

- [x] Task 7: Integrate PanelHeader into Panels (AC: #1)
  - [x] 7.1 Replace static panel headers in App.ts render() with PanelHeader component mounting points
  - [x] 7.2 Create PanelHeader instances for code, circuit, and state panels
  - [x] 7.3 Store PanelHeader instances for lifecycle management
  - [x] 7.4 Destroy PanelHeader instances in App.destroy()

- [x] Task 8: Add Accessibility Attributes (AC: #1)
  - [x] 8.1 Close button has `aria-label="Close CODE panel"` (dynamic based on panel)
  - [x] 8.2 Close button is focusable with `tabindex="0"` (button elements are focusable by default)
  - [x] 8.3 Close button responds to Enter and Space key
  - [x] 8.4 When panel is hidden, it's removed from tab order (display: none)
  - [x] 8.5 Title attribute added for tooltip accessibility

- [x] Task 9: Write Unit Tests for PanelHeader (AC: #1)
  - [x] 9.1 Test PanelHeader renders title correctly
  - [x] 9.2 Test close button is rendered
  - [x] 9.3 Test close button click calls onClose callback
  - [x] 9.4 Test accessibility attributes are present
  - [x] 9.5 Test keyboard activation (Enter/Space) calls onClose
  - [x] 9.6 Test destroy removes event listeners

- [x] Task 10: Write Integration Tests for Panel Visibility (AC: #1)
  - [x] 10.1 Test clicking close button hides panel
  - [x] 10.2 Test hidden panel has `.da-panel--hidden` class
  - [x] 10.3 Test grid layout adjusts when panel hidden
  - [x] 10.4 Test View menu toggles panel visibility
  - [x] 10.5 Test panel can be restored after being hidden

- [x] Task 11: Validate Implementation (AC: #1)
  - [x] 11.1 Verify all three panels have headers with close buttons
  - [x] 11.2 Verify clicking close hides each panel correctly
  - [x] 11.3 Verify layout adjusts smoothly (no jarring jumps)
  - [x] 11.4 Verify View menu restores hidden panels
  - [x] 11.5 Run `npm run build` - must complete without errors
  - [x] 11.6 Run `npx tsc --noEmit` - must pass with no TypeScript errors

---

## Dev Notes

### Previous Story Intelligence (Story 1.9)

**Key Learnings from Story 1.9:**
- Components follow mount/destroy pattern with proper cleanup
- **CRITICAL: Store bound event handlers and remove them in destroy()** to prevent memory leaks
- CSS uses `--da-*` custom properties for theming
- Accessibility attributes (role, aria-label) required on interactive elements
- Tests use Vitest with jsdom for DOM testing
- All TypeScript strict mode - no `any`, use `null` not `undefined`
- Named exports only (no default exports except config files)
- No console.log in production code - use no-op placeholder comments

**Code Review Fixes from 1.9:**
- XSS Prevention: Use `escapeHtml()` or `textContent` for user data
- Deep clone objects in getState() to prevent mutation
- Test edge cases (null values, boundary conditions)
- Remove dead CSS that's no longer used

### Current Panel Header State

The panels already have static headers in App.ts render():
```html
<div class="da-panel-header">
  <span class="da-panel-title">CODE</span>
</div>
```

Existing CSS in main.css:
```css
.da-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 32px;
  padding: 0 12px;
  background-color: var(--da-panel-header);
  border-bottom: 1px solid var(--da-border);
  flex-shrink: 0;
}

.da-panel-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--da-text-secondary);
}
```

### MenuBar Integration

MenuBar already has View menu with these callbacks in MenuBarCallbacks interface:
- `onViewCodePanel: () => void`
- `onViewCircuitPanel: () => void`
- `onViewStatePanel: () => void`
- `onViewResetLayout: () => void`

These are currently no-ops in App.ts. Wire them to panel visibility.

### Grid Layout Adjustment Strategy

Current grid in main.css:
```css
.da-app-layout {
  grid-template-columns: var(--da-code-panel-width) 1fr var(--da-state-panel-width);
}
```

When panels are hidden, adjust with:
- Code hidden: `grid-template-columns: 0 1fr var(--da-state-panel-width)`
- State hidden: `grid-template-columns: var(--da-code-panel-width) 1fr 0`
- Both hidden: `grid-template-columns: 0 1fr 0`

Or use CSS classes:
```css
.da-app-layout--code-hidden { grid-template-columns: 0 1fr var(--da-state-panel-width); }
.da-app-layout--state-hidden { grid-template-columns: var(--da-code-panel-width) 1fr 0; }
```

### Component Interface

```typescript
// src/ui/PanelHeader.ts

export type PanelId = 'code' | 'circuit' | 'state';

export interface PanelHeaderOptions {
  title: string;
  panelId: PanelId;
  onClose: () => void;
}

export class PanelHeader {
  private element: HTMLElement | null = null;
  private options: PanelHeaderOptions;
  private boundHandleClick: () => void;
  private boundHandleKeydown: (e: KeyboardEvent) => void;

  constructor(options: PanelHeaderOptions) {
    this.options = options;
    this.boundHandleClick = this.handleClick.bind(this);
    this.boundHandleKeydown = this.handleKeydown.bind(this);
  }

  mount(container: HTMLElement): void {
    this.element = this.render();
    container.appendChild(this.element);
    this.attachEventListeners();
  }

  destroy(): void {
    this.removeEventListeners();
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }

  private render(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'da-panel-header';
    header.innerHTML = `
      <span class="da-panel-title">${this.options.title}</span>
      <button
        class="da-panel-close-btn"
        aria-label="Close ${this.options.title} panel"
        tabindex="0"
      >×</button>
    `;
    return header;
  }

  private handleClick(): void {
    this.options.onClose();
  }

  private handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.options.onClose();
    }
  }

  private attachEventListeners(): void {
    const btn = this.element?.querySelector('.da-panel-close-btn');
    btn?.addEventListener('click', this.boundHandleClick);
    btn?.addEventListener('keydown', this.boundHandleKeydown);
  }

  private removeEventListeners(): void {
    const btn = this.element?.querySelector('.da-panel-close-btn');
    btn?.removeEventListener('click', this.boundHandleClick);
    btn?.removeEventListener('keydown', this.boundHandleKeydown);
  }
}
```

### Panel Visibility State in App.ts

```typescript
// Add to App.ts

interface PanelVisibility {
  code: boolean;
  circuit: boolean;
  state: boolean;
}

private panelVisibility: PanelVisibility = {
  code: true,
  circuit: true,
  state: true,
};

setPanelVisibility(panelId: PanelId, visible: boolean): void {
  this.panelVisibility[panelId] = visible;
  this.updatePanelVisibility();
  this.menuBar?.setPanelStates(this.panelVisibility);
}

togglePanel(panelId: PanelId): void {
  this.setPanelVisibility(panelId, !this.panelVisibility[panelId]);
}

private updatePanelVisibility(): void {
  const layout = this.container?.querySelector('.da-app-layout');
  if (!layout) return;

  layout.classList.toggle('da-app-layout--code-hidden', !this.panelVisibility.code);
  layout.classList.toggle('da-app-layout--state-hidden', !this.panelVisibility.state);
  layout.classList.toggle('da-app-layout--circuit-hidden', !this.panelVisibility.circuit);

  // Also toggle panel visibility
  const codePanel = this.container?.querySelector('.da-code-panel');
  const statePanel = this.container?.querySelector('.da-state-panel');
  const circuitPanel = this.container?.querySelector('.da-circuit-panel');

  codePanel?.classList.toggle('da-panel--hidden', !this.panelVisibility.code);
  statePanel?.classList.toggle('da-panel--hidden', !this.panelVisibility.state);
  circuitPanel?.classList.toggle('da-panel--hidden', !this.panelVisibility.circuit);
}
```

### CSS for Hidden Panels

```css
/* Add to main.css */

.da-panel--hidden {
  display: none;
}

.da-panel-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--da-text-secondary);
  font-size: 14px;
  cursor: pointer;
  border-radius: 2px;
  transition: color 0.15s ease, background-color 0.15s ease;
}

.da-panel-close-btn:hover {
  color: var(--da-accent);
  background-color: var(--da-bg-tertiary);
}

.da-panel-close-btn:focus {
  outline: 2px solid var(--da-accent);
  outline-offset: -2px;
}

/* Layout adjustments for hidden panels */
.da-app-layout--code-hidden {
  grid-template-columns: 0 1fr var(--da-state-panel-width);
}

.da-app-layout--state-hidden {
  grid-template-columns: var(--da-code-panel-width) 1fr 0;
}

.da-app-layout--code-hidden.da-app-layout--state-hidden {
  grid-template-columns: 0 1fr 0;
}
```

### Files to Create

- `src/ui/PanelHeader.ts` - PanelHeader component
- `src/ui/PanelHeader.test.ts` - Unit tests

### Files to Modify

- `src/ui/App.ts` - Add panel visibility state, wire MenuBar callbacks, integrate PanelHeader
- `src/ui/App.test.ts` - Add panel visibility integration tests
- `src/ui/MenuBar.ts` - Add `setPanelStates()` method for checkmark display
- `src/ui/MenuBar.test.ts` - Test panel state display
- `src/ui/index.ts` - Export PanelHeader and types
- `src/styles/main.css` - Add close button and hidden panel CSS

### Testing Considerations

**Unit Tests (Vitest + jsdom):**
- Test PanelHeader renders title
- Test close button rendered with correct aria-label
- Test click on close button fires onClose callback
- Test keyboard (Enter/Space) fires onClose callback
- Test destroy removes element and event listeners

**Integration Tests:**
- Test App renders panels with PanelHeader components
- Test clicking close hides panel
- Test grid layout adjusts
- Test View menu restores panel
- Test multiple panels can be hidden/shown independently

### Edge Cases to Handle

1. **All panels hidden:** Rare but handle gracefully - circuit panel always visible?
2. **Rapid toggle:** Debounce not needed since it's direct state update
3. **Resize handle when panel hidden:** Hide resizer too or disable it
4. **Panel restoration:** Should animate or instant? (Instant for MVP)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.10]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Layout Foundation]
- [Source: _bmad-output/implementation-artifacts/1-9-create-status-bar-component.md]
- [Source: _bmad-output/project-context.md]
- [Source: digital-archaeology-web/src/ui/MenuBar.ts#MenuBarCallbacks]

---

## Dev Agent Record

### Agent Model Used

claude-opus-4-5-20251101

### Debug Log References

N/A

### Completion Notes List

- All 11 tasks completed successfully
- 288 tests pass (22 PanelHeader unit tests, 20+ integration tests in App.test.ts)
- TypeScript compilation passes with no errors (`npx tsc --noEmit`)
- Production build completes successfully (`npm run build`)
- Fixed unused variable in test file (closeBtn in destroy event listener test)
- PanelHeader component follows mount/destroy pattern with bound event handlers
- Panel visibility state integrated with MenuBar via setPanelStates()
- CSS grid layout adjusts when panels are hidden using CSS classes
- View menu callbacks wired to togglePanel() for panel restoration

### File List

**Created:**
- `src/ui/PanelHeader.ts` - PanelHeader component with DOM-safe rendering
- `src/ui/PanelHeader.test.ts` - Unit tests (22 tests)

**Modified:**
- `src/ui/App.ts` - Added panel visibility state, PanelHeader integration, View menu wiring, screen reader announcements
- `src/ui/App.test.ts` - Added 30+ integration tests for panel headers, visibility, and View menu
- `src/ui/MenuBar.ts` - Added setPanelStates() method for View menu checkmarks
- `src/ui/MenuBar.test.ts` - Added tests for setPanelStates and checkmark display
- `src/ui/index.ts` - Export PanelHeader, PanelStates and types
- `src/styles/main.css` - Added close button and hidden panel CSS
- `_bmad-output/implementation-artifacts/sprint-status.yaml` - Updated story status
