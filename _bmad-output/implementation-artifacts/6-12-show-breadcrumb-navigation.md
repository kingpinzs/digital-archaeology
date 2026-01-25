# Story 6.12: Show Breadcrumb Navigation

Status: complete

## Story

As a user,
I want to see my navigation path,
So that I know what level I'm viewing.

## Acceptance Criteria

1. **Given** the circuit is displayed **When** I view the circuit panel header **Then** I see a breadcrumb path (e.g., "CPU > ALU > Adder")
2. **And** clicking a breadcrumb zooms to that level
3. **And** the path updates when I navigate into components

## Tasks / Subtasks

### Task 1: Create BreadcrumbNav Component (AC: #1)

Create a new component to display the navigation breadcrumb path.

- [x] 1.1 Create `src/visualizer/BreadcrumbNav.ts`:
  - Create `BreadcrumbNav` class with `mount()`, `destroy()`, `setPath()` methods
  - Define `BreadcrumbItem` interface: `{ id: string; label: string; level: number }`
  - Accept callback `onItemClick(item: BreadcrumbItem)` for navigation
- [x] 1.2 Create `BreadcrumbNavOptions` interface with configurable separator
- [x] 1.3 Export from `src/visualizer/index.ts`

### Task 2: Implement Breadcrumb Rendering (AC: #1)

Render the breadcrumb items with proper styling.

- [x] 2.1 Render breadcrumb structure using DOM methods (not innerHTML for XSS safety):
  ```html
  <nav class="da-breadcrumb-nav" aria-label="Circuit navigation">
    <ol class="da-breadcrumb-list">
      <li class="da-breadcrumb-item">
        <button class="da-breadcrumb-link" data-id="cpu">CPU</button>
      </li>
      <li class="da-breadcrumb-item da-breadcrumb-separator" aria-hidden="true">></li>
      <li class="da-breadcrumb-item da-breadcrumb-current" aria-current="location">
        <span>ALU</span>
      </li>
    </ol>
  </nav>
  ```
- [x] 2.2 Use `<button>` for clickable items (not `<a>`) since they trigger JS actions
- [x] 2.3 Mark current location with `aria-current="location"`
- [x] 2.4 Hide separator from screen readers with `aria-hidden="true"`

### Task 3: Add CSS Styles (AC: #1)

Style the breadcrumb navigation to fit circuit panel header.

- [x] 3.1 Add CSS in `src/styles/main.css`:
  - Use flexbox for horizontal layout
  - Style separator with `>` character and muted color
  - Style clickable items with hover/focus states
  - Style current item as non-clickable text
  - Match theme variables (`--da-text-primary`, `--da-text-secondary`, `--da-accent`)
- [x] 3.2 Ensure compact size to fit in panel header alongside zoom controls
- [x] 3.3 Add keyboard focus styles for accessibility

### Task 4: Integrate with Circuit Panel Header (AC: #1)

Mount the breadcrumb component in the circuit panel header.

- [x] 4.1 In `App.ts`, add `breadcrumbNav` property and initialize in `initializeBreadcrumbNav()`
- [x] 4.2 Position breadcrumb between panel title and zoom controls in header:
  ```
  [CIRCUIT] [CPU > ALU] [- 100% + Reset Fit]
  ```
- [x] 4.3 Wire up `onItemClick` callback to circuit navigation (resets zoom for flat circuit)
- [x] 4.4 Add `destroyBreadcrumbNav()` and call in `destroy()`

### Task 5: Implement Path Updates (AC: #3)

Update breadcrumb when user navigates into components.

- [x] 5.1 Add `setPath(items: BreadcrumbItem[])` method to BreadcrumbNav
- [x] 5.2 For Micro4 flat circuit, show single "CPU" item (no hierarchy yet)
- [x] 5.3 Future: When circuit supports hierarchy (e.g., click into ALU), push new item
- [x] 5.4 Re-render breadcrumb list when path changes

### Task 6: Implement Click Navigation (AC: #2)

Handle breadcrumb clicks to navigate/zoom to that level.

- [x] 6.1 When breadcrumb item is clicked, invoke callback with item data
- [x] 6.2 In App.ts, callback should:
  - Pop items from path up to clicked level
  - Reset zoom to fit the selected component bounds
  - For flat circuit: reset to full circuit view
- [x] 6.3 Add keyboard support (Enter/Space on buttons)

### Task 7: Write Unit Tests

- [x] 7.1 Test BreadcrumbNav:
  - Mount creates proper DOM structure
  - `setPath()` updates rendered items
  - Click on item triggers callback with correct data
  - Current item is not clickable
  - Destroy cleans up DOM and listeners
- [x] 7.2 Test accessibility:
  - `aria-label` on nav element
  - `aria-current` on current item
  - `aria-hidden` on separators
  - Keyboard navigation works
- [x] 7.3 Test App.ts integration:
  - Breadcrumb appears in circuit panel header
  - Shows "CPU" by default for flat circuit

## Dev Notes

### Architecture Patterns

- Follow existing component pattern from `SignalValuesPanel`, `PanelHeader`, `ZoomControlsToolbar`
- Use `mount()`, `destroy()` lifecycle methods
- Use bound event handlers for cleanup (prevent memory leaks)
- Use DOM methods (createElement, textContent) instead of innerHTML for XSS safety

### Current Circuit Structure

The current circuit.json is **flat** - all gates are at the same level with no parent-child hierarchy:
- `CircuitGate` has `id`, `name`, `type`, `inputs`, `outputs` - no `parent` or `children`
- `CircuitData` has `wires[]` and `gates[]` arrays

**For this story**: Show "CPU" as the single breadcrumb item. Future stories can add hierarchy support when circuit data includes component groupings.

### Panel Header Integration

The circuit panel header structure (from App.ts line 287-292):
```html
<main class="da-circuit-panel">
  <div class="da-panel-header-container">
    <!-- PanelHeader mounts here -->
    <!-- ZoomControlsToolbar inserted after panel title -->
  </div>
  <div class="da-panel-content">...</div>
</main>
```

Current header layout (from Story 6.6):
- `PanelHeader` creates: `<div class="da-panel-header"><span class="da-panel-title">CIRCUIT</span><button>×</button></div>`
- `ZoomControlsToolbar` inserted between title and close button

Breadcrumb should be inserted between title span and zoom controls.

### Files from Previous Stories

From Story 6.11 (SignalValuesPanel):
- Component pattern: `src/visualizer/SignalValuesPanel.ts`
- CSS pattern: `.da-signal-*` classes in `src/styles/main.css`
- Integration: `App.ts` - `initializeSignalValuesPanel()`, `destroySignalValuesPanel()`

From Story 6.6 (ZoomControls):
- Toolbar pattern: `src/visualizer/ZoomControlsToolbar.ts`
- Header integration: inserting elements into panel header

### Accessibility Checklist

- [x] **Keyboard Navigation** - Buttons accessible via Tab, activate with Enter/Space
- [x] **ARIA Attributes** - `aria-label` on nav, `aria-current="location"` on current item
- [x] **Focus Management** - Focus visible on breadcrumb buttons
- [x] **Color Contrast** - Use theme variables for sufficient contrast
- [x] **XSS Prevention** - Use DOM methods (textContent, createElement) not innerHTML
- [x] **Screen Reader Announcements** - Hidden separators, labeled navigation

### Project Structure Notes

| Directory | Pattern |
|-----------|---------|
| `src/visualizer/` | Circuit visualization components |
| `src/visualizer/index.ts` | Barrel exports |
| `src/ui/` | App-level UI components |
| `src/styles/main.css` | All CSS styles |

### References

- [Source: epics.md#Story-6.12] - Original story requirements
- [Source: src/visualizer/SignalValuesPanel.ts] - Component pattern reference
- [Source: src/visualizer/ZoomControlsToolbar.ts] - Header integration pattern
- [Source: src/ui/PanelHeader.ts] - Panel header structure
- [Source: src/ui/App.ts:287-292] - Circuit panel HTML structure
- [Source: src/visualizer/types.ts] - CircuitGate interface (no hierarchy)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Initial implementation completed in a single session

### Completion Notes List

- Created BreadcrumbNav component with mount/destroy/setPath/getPath lifecycle methods
- Implemented BreadcrumbItem and BreadcrumbNavOptions interfaces
- DOM structure follows spec: nav > ol > li structure with buttons and spans
- Full accessibility support: aria-label, aria-current, aria-hidden, keyboard navigation (Enter/Space)
- CSS styling with theme variables, flexbox layout, hover/focus states
- Integrated with App.ts - breadcrumb positioned between panel title and zoom controls
- Click callback resets zoom for flat circuit (future: component-level navigation)
- All tests pass (26 unit tests + 8 integration tests)

### Code Review Fixes Applied

- **[MEDIUM]** Added sprint-status.yaml to File List (missing from documentation)
- **[MEDIUM]** Fixed container cleanup - destroyBreadcrumbNav() now removes the breadcrumb container element from DOM
- **[MEDIUM]** Added integration test for breadcrumb click callback (AC #2 coverage)
- **[LOW]** Removed redundant nullish coalescing for separator (already has default)
- **[LOW]** Consolidated duplicate type import lines in App.ts
- **[LOW]** Added test for container cleanup on destroy

### File List

| Action | File |
|--------|------|
| ADD | `src/visualizer/BreadcrumbNav.ts` |
| ADD | `src/visualizer/BreadcrumbNav.test.ts` |
| MODIFY | `src/visualizer/index.ts` |
| MODIFY | `src/styles/main.css` |
| MODIFY | `src/ui/App.ts` |
| MODIFY | `src/ui/App.test.ts` |
| MODIFY | `_bmad-output/implementation-artifacts/sprint-status.yaml` |
