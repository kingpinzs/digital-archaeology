# Story 1.8: Create Menu Bar Component

Status: done

---

## Story

As a user,
I want a menu bar with standard menus,
So that I can access all application functions.

## Acceptance Criteria

1. **Given** the application is loaded
   **When** I view the menu bar
   **Then** I see menus: File, Edit, View, Debug, Help
   **And** I see Story/Lab toggle buttons at the left
   **And** clicking a menu shows a dropdown (placeholder items for now)
   **And** menus close when clicking outside
   **And** menus are styled according to the design system

## Tasks / Subtasks

- [x] Task 1: Create MenuBar Component Structure (AC: #1)
  - [x] 1.1 Create `src/ui/MenuBar.ts` as a new component
  - [x] 1.2 Define `MenuBar` class with `mount(container: HTMLElement)` method
  - [x] 1.3 Implement `render()` method that returns menu bar HTML
  - [x] 1.4 Export `MenuBar` class from `src/ui/index.ts`

- [x] Task 2: Create Story/Lab Mode Toggle (AC: #1)
  - [x] 2.1 Create toggle button group at left of menu bar
  - [x] 2.2 Add Story button (📜 Story) with aria-pressed state
  - [x] 2.3 Add Lab button (⚡ Lab) with aria-pressed state
  - [x] 2.4 Implement visual active state for current mode
  - [x] 2.5 Wire up toggle callback to MenuBarCallbacks

- [x] Task 3: Create Menu Trigger Buttons (AC: #1)
  - [x] 3.1 Create File menu trigger button
  - [x] 3.2 Create Edit menu trigger button
  - [x] 3.3 Create View menu trigger button
  - [x] 3.4 Create Debug menu trigger button
  - [x] 3.5 Create Help menu trigger button
  - [x] 3.6 Add aria-haspopup and aria-expanded attributes

- [x] Task 4: Implement Dropdown Menu Component (AC: #1)
  - [x] 4.1 Create dropdown container with proper z-index (100)
  - [x] 4.2 Implement show/hide logic for dropdown
  - [x] 4.3 Position dropdown below trigger button
  - [x] 4.4 Add fade/slide animation for dropdown appearance
  - [x] 4.5 Style dropdown according to design system

- [x] Task 5: Create Placeholder Menu Items (AC: #1)
  - [x] 5.1 File menu: New, Open, Save, Save As, separator, Export, Import
  - [x] 5.2 Edit menu: Undo, Redo, separator, Cut, Copy, Paste
  - [x] 5.3 View menu: Show Code Panel, Show Circuit Panel, Show State Panel, separator, Reset Layout
  - [x] 5.4 Debug menu: Assemble, Run, Pause, Reset, Step, separator, Toggle Breakpoint
  - [x] 5.5 Help menu: Keyboard Shortcuts, Documentation, separator, About
  - [x] 5.6 Add keyboard shortcut hints in menu items (grayed, right-aligned)

- [x] Task 6: Implement Click Outside to Close (AC: #1)
  - [x] 6.1 Add document-level click listener when menu is open
  - [x] 6.2 Close menu when clicking outside dropdown
  - [x] 6.3 Close menu when clicking another menu trigger
  - [x] 6.4 Clean up document listener when menu closes
  - [x] 6.5 Handle Escape key to close menu

- [x] Task 7: Add CSS Classes for Menu Styling (AC: #1)
  - [x] 7.1 Add `.da-menubar` for menu bar container
  - [x] 7.2 Add `.da-menubar-toggle` for Story/Lab toggle group
  - [x] 7.3 Add `.da-menubar-toggle-btn` for toggle buttons
  - [x] 7.4 Add `.da-menubar-toggle-btn--active` for active toggle state
  - [x] 7.5 Add `.da-menu-trigger` for menu trigger buttons
  - [x] 7.6 Add `.da-menu-trigger--open` for open state
  - [x] 7.7 Add `.da-menu-dropdown` for dropdown container
  - [x] 7.8 Add `.da-menu-item` for menu items
  - [x] 7.9 Add `.da-menu-item:hover` hover state
  - [x] 7.10 Add `.da-menu-item--disabled` for disabled items
  - [x] 7.11 Add `.da-menu-separator` for divider lines
  - [x] 7.12 Add `.da-menu-shortcut` for keyboard hint text

- [x] Task 8: Implement MenuBar State and Callbacks (AC: #1)
  - [x] 8.1 Define `MenuBarState` interface with currentMode (story/lab), openMenu (string|null)
  - [x] 8.2 Define `MenuBarCallbacks` interface for all menu actions
  - [x] 8.3 Implement `updateState(state: Partial<MenuBarState>)` method
  - [x] 8.4 Wire up menu item clicks to appropriate callbacks
  - [x] 8.5 Expose `getState()` method for current state

- [x] Task 9: Integrate MenuBar into App.ts (AC: #1)
  - [x] 9.1 Decide integration approach: MenuBar separate from Toolbar OR combined
  - [x] 9.2 If separate: Add MenuBar container above Toolbar in layout
  - [x] 9.3 Import MenuBar component in App.ts
  - [x] 9.4 Pass callback stubs (console.log equivalent - no-ops for now)
  - [x] 9.5 Store MenuBar instance for state updates and cleanup
  - [x] 9.6 Call destroy() on MenuBar in App.destroy()

- [x] Task 10: Add Accessibility Attributes (AC: #1)
  - [x] 10.1 Add `role="menubar"` to menu bar container
  - [x] 10.2 Add `role="menu"` to dropdown containers
  - [x] 10.3 Add `role="menuitem"` to menu items
  - [x] 10.4 Add `aria-haspopup="true"` to menu triggers
  - [x] 10.5 Add `aria-expanded` (true/false) to menu triggers
  - [x] 10.6 Add `aria-label` to menu bar and toggles
  - [x] 10.7 Implement arrow key navigation within menus

- [x] Task 11: Write Unit Tests for MenuBar (AC: #1)
  - [x] 11.1 Test menu bar renders all menu triggers
  - [x] 11.2 Test Story/Lab toggle renders and switches
  - [x] 11.3 Test clicking menu trigger opens dropdown
  - [x] 11.4 Test clicking outside closes dropdown
  - [x] 11.5 Test Escape key closes dropdown
  - [x] 11.6 Test menu item click fires callback
  - [x] 11.7 Test clicking different trigger closes previous menu
  - [x] 11.8 Test accessibility attributes are present
  - [x] 11.9 Test updateState updates current mode
  - [x] 11.10 Test getState returns current state

- [x] Task 12: Validate MenuBar Implementation (AC: #1)
  - [x] 12.1 Verify all menu triggers render correctly
  - [x] 12.2 Verify dropdowns appear and position correctly
  - [x] 12.3 Verify hover states work on menu items
  - [x] 12.4 Verify Story/Lab toggle visual state
  - [x] 12.5 Run `npm run build` - must complete without errors
  - [x] 12.6 Run `npx tsc --noEmit` - must pass with no TypeScript errors

---

## Dev Notes

### Previous Story Intelligence (Story 1.7)

**Key Learnings from Story 1.7:**
- Components follow mount/destroy pattern with proper cleanup
- **CRITICAL: Store bound event handlers and remove them in destroy()** to prevent memory leaks
- CSS uses `--da-*` custom properties for theming
- Accessibility attributes (role, aria-label, aria-pressed) required on interactive elements
- Tests use Vitest with jsdom for DOM testing
- All TypeScript strict mode - no `any`, use `null` not `undefined`
- Named exports only (no default exports except config files)
- Keyboard navigation follows WAI-ARIA patterns (ArrowLeft/Right, Home/End)
- ARIA values (aria-valuenow/min/max) needed for sliders
- No console.log in production code - use no-op placeholder comments

**Toolbar Integration Pattern:**
The Toolbar component is currently mounted inside the `.da-toolbar` header element. The MenuBar needs to integrate alongside or above this.

**Current Toolbar in App.ts:**
```typescript
private initializeToolbar(): void {
  const toolbarContainer = this.container?.querySelector('.da-toolbar');
  if (!toolbarContainer) return;
  toolbarContainer.innerHTML = '';
  // ... creates Toolbar and mounts
}
```

### MenuBar Layout from UX Specification

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [📜 Story] [⚡ Lab]  [File] [Edit] [View] [Debug] [Help]           [⚙]      │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Component Groups:**
1. **Left Group:** Story/Lab toggle buttons
2. **Center Group:** Menu triggers (File, Edit, View, Debug, Help)
3. **Right Group:** Settings button (already in Toolbar - may coordinate)

### Architecture Decision: MenuBar vs Toolbar

**Option A: Separate MenuBar Component**
- MenuBar sits above Toolbar in a separate 32px row
- Total header area becomes 48px (Toolbar) + 32px (MenuBar) = 80px
- Pro: Clean separation of concerns
- Con: Takes more vertical space

**Option B: Integrate into Existing Toolbar**
- MenuBar elements added to the left of Toolbar
- Story/Lab toggle at far left, then menus, then execution controls
- Pro: Compact, single header row
- Con: Toolbar becomes more complex

**Recommendation:** Option B - Integrate into existing Toolbar container. The UX spec shows a single header row. The MenuBar component should be mountable as a child of the toolbar area, positioned to the left.

### Dropdown Menu Pattern

**Opening Logic:**
1. Click menu trigger → open that menu, close any other
2. While menu open, hover over different trigger → switch to that menu
3. Click outside → close menu
4. Escape key → close menu
5. Click menu item → execute action, close menu

**Positioning:**
- Dropdown appears directly below trigger button
- Left-aligned with trigger
- Use `position: absolute` relative to menu bar
- Z-index: 100 (per design tokens)

### CSS Class Structure

```css
/* Menu bar container */
.da-menubar {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 32px;
}

/* Story/Lab toggle group */
.da-menubar-toggle {
  display: flex;
  background: var(--da-bg-tertiary);
  border-radius: 4px;
  padding: 2px;
}

.da-menubar-toggle-btn {
  padding: 4px 12px;
  border: none;
  background: transparent;
  color: var(--da-text-secondary);
  border-radius: 3px;
  cursor: pointer;
}

.da-menubar-toggle-btn--active {
  background: var(--da-accent);
  color: var(--da-bg-primary);
}

/* Menu trigger buttons */
.da-menu-trigger {
  padding: 4px 12px;
  border: none;
  background: transparent;
  color: var(--da-text-primary);
  cursor: pointer;
}

.da-menu-trigger:hover,
.da-menu-trigger--open {
  background: var(--da-bg-tertiary);
}

/* Dropdown menu */
.da-menu-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 200px;
  background: var(--da-bg-secondary);
  border: 1px solid var(--da-border);
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 100;
  padding: 4px 0;
}

/* Menu items */
.da-menu-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 16px;
  color: var(--da-text-primary);
  cursor: pointer;
}

.da-menu-item:hover {
  background: var(--da-bg-tertiary);
}

.da-menu-item--disabled {
  color: var(--da-text-secondary);
  opacity: 0.5;
  cursor: not-allowed;
}

.da-menu-separator {
  height: 1px;
  background: var(--da-border);
  margin: 4px 0;
}

.da-menu-shortcut {
  color: var(--da-text-secondary);
  font-size: 12px;
}
```

### Component Interface

```typescript
// src/ui/MenuBar.ts

export type AppMode = 'story' | 'lab';

export interface MenuBarState {
  currentMode: AppMode;
  openMenu: string | null;
}

export interface MenuBarCallbacks {
  onModeChange: (mode: AppMode) => void;
  // File menu
  onFileNew: () => void;
  onFileOpen: () => void;
  onFileSave: () => void;
  onFileSaveAs: () => void;
  onFileExport: () => void;
  onFileImport: () => void;
  // Edit menu
  onEditUndo: () => void;
  onEditRedo: () => void;
  onEditCut: () => void;
  onEditCopy: () => void;
  onEditPaste: () => void;
  // View menu
  onViewCodePanel: () => void;
  onViewCircuitPanel: () => void;
  onViewStatePanel: () => void;
  onViewResetLayout: () => void;
  // Debug menu
  onDebugAssemble: () => void;
  onDebugRun: () => void;
  onDebugPause: () => void;
  onDebugReset: () => void;
  onDebugStep: () => void;
  onDebugToggleBreakpoint: () => void;
  // Help menu
  onHelpKeyboardShortcuts: () => void;
  onHelpDocumentation: () => void;
  onHelpAbout: () => void;
}

export class MenuBar {
  private element: HTMLElement | null = null;
  private state: MenuBarState;
  private callbacks: MenuBarCallbacks;

  // Store bound handlers for cleanup
  private boundDocumentClick: ((e: MouseEvent) => void) | null = null;
  private boundKeydown: ((e: KeyboardEvent) => void) | null = null;

  constructor(callbacks: MenuBarCallbacks) {
    this.callbacks = callbacks;
    this.state = {
      currentMode: 'lab',
      openMenu: null,
    };
  }

  mount(container: HTMLElement): void {
    this.element = this.render();
    container.appendChild(this.element);
    this.attachEventListeners();
  }

  updateState(newState: Partial<MenuBarState>): void {
    this.state = { ...this.state, ...newState };
    this.updateUI();
  }

  getState(): MenuBarState {
    return { ...this.state };
  }

  destroy(): void {
    // Remove document click listener
    if (this.boundDocumentClick) {
      document.removeEventListener('click', this.boundDocumentClick);
    }
    // Remove keydown listener
    if (this.boundKeydown) {
      document.removeEventListener('keydown', this.boundKeydown);
    }
    // Remove element
    this.element?.remove();
    this.element = null;
  }
}
```

### Menu Structure Definition

```typescript
interface MenuItem {
  id: string;
  label: string;
  shortcut?: string;
  disabled?: boolean;
  separator?: boolean;
}

const MENU_STRUCTURE: Record<string, MenuItem[]> = {
  file: [
    { id: 'new', label: 'New', shortcut: 'Ctrl+N' },
    { id: 'open', label: 'Open...', shortcut: 'Ctrl+O' },
    { id: 'save', label: 'Save', shortcut: 'Ctrl+S' },
    { id: 'saveAs', label: 'Save As...', shortcut: 'Ctrl+Shift+S' },
    { id: 'sep1', label: '', separator: true },
    { id: 'export', label: 'Export Binary...' },
    { id: 'import', label: 'Import Binary...' },
  ],
  edit: [
    { id: 'undo', label: 'Undo', shortcut: 'Ctrl+Z' },
    { id: 'redo', label: 'Redo', shortcut: 'Ctrl+Y' },
    { id: 'sep1', label: '', separator: true },
    { id: 'cut', label: 'Cut', shortcut: 'Ctrl+X' },
    { id: 'copy', label: 'Copy', shortcut: 'Ctrl+C' },
    { id: 'paste', label: 'Paste', shortcut: 'Ctrl+V' },
  ],
  view: [
    { id: 'codePanel', label: 'Show Code Panel' },
    { id: 'circuitPanel', label: 'Show Circuit Panel' },
    { id: 'statePanel', label: 'Show State Panel' },
    { id: 'sep1', label: '', separator: true },
    { id: 'resetLayout', label: 'Reset Layout' },
  ],
  debug: [
    { id: 'assemble', label: 'Assemble', shortcut: 'Ctrl+Enter' },
    { id: 'run', label: 'Run', shortcut: 'F5' },
    { id: 'pause', label: 'Pause', shortcut: 'F5' },
    { id: 'reset', label: 'Reset', shortcut: 'Shift+F5' },
    { id: 'step', label: 'Step', shortcut: 'F10' },
    { id: 'sep1', label: '', separator: true },
    { id: 'toggleBreakpoint', label: 'Toggle Breakpoint', shortcut: 'F9' },
  ],
  help: [
    { id: 'shortcuts', label: 'Keyboard Shortcuts', shortcut: 'Ctrl+?' },
    { id: 'docs', label: 'Documentation' },
    { id: 'sep1', label: '', separator: true },
    { id: 'about', label: 'About Digital Archaeology' },
  ],
};
```

### Testing Considerations

**Unit Tests (Vitest + jsdom):**
- Test menu bar renders all triggers
- Test toggle buttons render with correct initial state
- Test clicking toggle fires onModeChange callback
- Test clicking menu trigger opens dropdown
- Test clicking outside closes dropdown
- Test Escape key closes dropdown
- Test menu item click fires correct callback
- Test accessibility attributes

**Example Test:**
```typescript
it('should close dropdown when clicking outside', () => {
  const menuBar = new MenuBar(mockCallbacks);
  menuBar.mount(container);

  // Open file menu
  const fileTrigger = container.querySelector('[data-menu="file"]');
  fileTrigger?.click();

  // Dropdown should be visible
  let dropdown = container.querySelector('.da-menu-dropdown');
  expect(dropdown).not.toBeNull();

  // Click outside
  document.body.click();

  // Dropdown should be hidden
  dropdown = container.querySelector('.da-menu-dropdown');
  expect(dropdown).toBeNull();
});
```

### Files to Create

- `src/ui/MenuBar.ts` - MenuBar component
- `src/ui/MenuBar.test.ts` - Unit tests

### Files to Modify

- `src/ui/App.ts` - Import and mount MenuBar
- `src/ui/App.test.ts` - Update tests for MenuBar integration
- `src/ui/index.ts` - Export MenuBar and related types
- `src/styles/main.css` - Add menu bar CSS classes

### Integration Approach

The MenuBar should be rendered as part of the toolbar header area. The existing Toolbar component provides execution controls. The MenuBar should add mode toggle and menus to the left portion.

**Suggested Layout Update:**
```html
<header class="da-toolbar">
  <div class="da-menubar">
    <!-- Story/Lab toggle and menus rendered by MenuBar component -->
  </div>
  <div class="da-toolbar-content">
    <!-- Execution controls rendered by Toolbar component -->
  </div>
</header>
```

This may require updating App.ts to manage both components in the toolbar area.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.8]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Menu Bar]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Two-Mode Interface Architecture]
- [Source: _bmad-output/implementation-artifacts/1-7-create-toolbar-component.md]
- [Source: _bmad-output/project-context.md]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

1. **MenuBar Component Created** - Implemented `src/ui/MenuBar.ts` with full `MenuBarState` and `MenuBarCallbacks` interfaces, mount/destroy pattern, and proper event handler cleanup
2. **Story/Lab Toggle** - Toggle button group with 📜 Story and ⚡ Lab buttons, aria-pressed states, visual active state
3. **All Menu Triggers Implemented** - File, Edit, View, Debug, Help menus with aria-haspopup and aria-expanded attributes
4. **Dropdown Menus** - Dynamically created dropdowns with z-index 100, positioned below triggers, fade/slide animation via CSS keyframes
5. **All Menu Items** - Complete menu structure with separators and keyboard shortcut hints (grayed, right-aligned)
6. **Click Outside to Close** - Document-level click listener with proper cleanup, handles clicking outside and switching menus
7. **Escape Key Support** - Closes dropdown and returns focus to trigger
8. **Arrow Key Navigation** - ArrowUp/Down for menu items, ArrowLeft/Right for switching menus, wrapping navigation
9. **CSS Styling Added** - All `.da-menubar-*` and `.da-menu-*` classes per design system
10. **State Management** - `updateState()` and `getState()` methods for external control
11. **App.ts Integration** - MenuBar mounted in toolbar area alongside Toolbar, with proper initialization order and cleanup
12. **Comprehensive Tests** - 45 tests for MenuBar component + 8 App.ts integration tests
13. **Build Verification** - TypeScript compilation passes, production build succeeds in 656ms
14. **Total Tests** - 197 tests passing (up from 144)

### Code Review Fixes Applied

1. **HIGH: Memory Leak Fixed** - Menu item click listeners now tracked in `boundMenuItemClick` Map and cleaned up in `removeDropdown()` and `destroy()`
2. **MEDIUM: Escape Focus Bug Fixed** - Now saves `openMenu` before calling `closeMenu()` so focus correctly returns to trigger
3. **MEDIUM: MenuBar Integration Tests Added** - 8 new tests in App.test.ts for getMenuBar(), cleanup, wrapper element, and no component leaks
4. **MEDIUM: Keyboard Shortcut Fixed** - Changed `Ctrl+/` to `Ctrl+?` in Help menu to match story spec
5. **MEDIUM: Type Safety Fixed** - Removed unsafe type cast, properly typed `boundMenuTriggerClick` as `Map<string, (e: Event) => void>`
6. **LOW: CSS Performance** - Added `will-change: transform, opacity` to `.da-menu-dropdown` for GPU acceleration
7. **LOW: Focus Behavior Documented** - Added comment explaining design choice to auto-focus first menu item (matches VS Code)

### File List

**Created:**
- `src/ui/MenuBar.ts` - MenuBar component with keyboard nav & ARIA support (~550 lines)
- `src/ui/MenuBar.test.ts` - Unit tests (42 tests, ~450 lines)

**Modified:**
- `src/ui/App.ts` - Added MenuBar integration, `initializeMenuBar()`, `destroyMenuBar()`, `getMenuBar()`
- `src/ui/index.ts` - Added MenuBar and type exports
- `src/styles/main.css` - Added menu bar CSS classes (~150 lines)
