# Story 1.5: Create Basic App Shell with 3-Panel Layout

Status: done

---

## Story

As a user,
I want to see the main application layout,
So that I understand where the editor, circuit, and state panels will be.

## Acceptance Criteria

1. **Given** the application loads in the browser
   **When** I view the main interface
   **Then** I see a toolbar area at the top (48px height)
   **And** I see a status bar at the bottom (24px height)
   **And** I see three panels: left (code), center (circuit), right (state)
   **And** panels are arranged using CSS Grid
   **And** the layout fills the viewport height
   **And** panels have visible borders and background colors from theme

## Tasks / Subtasks

- [x] Task 1: Create App Shell Component (AC: #1)
  - [x] 1.1 Create `src/ui/App.ts` as the root application component
  - [x] 1.2 Define `App` class with `mount(container: HTMLElement)` method
  - [x] 1.3 Implement `render()` method that creates the 3-panel layout structure
  - [x] 1.4 Export `App` class from `src/ui/index.ts`

- [x] Task 2: Implement CSS Grid Layout (AC: #1)
  - [x] 2.1 Create CSS Grid structure with fixed header (toolbar) and footer (status bar)
  - [x] 2.2 Define grid areas: `toolbar`, `code-panel`, `circuit-panel`, `state-panel`, `statusbar`
  - [x] 2.3 Configure grid: `grid-template-rows: 48px 1fr 24px`
  - [x] 2.4 Configure 3-column layout for panels with `grid-template-columns`
  - [x] 2.5 Ensure layout fills 100vh (viewport height)

- [x] Task 3: Create Toolbar Placeholder (AC: #1)
  - [x] 3.1 Create toolbar container div with 48px fixed height
  - [x] 3.2 Apply `--da-bg-secondary` background color via Tailwind class
  - [x] 3.3 Add bottom border using `--da-border` color
  - [x] 3.4 Add placeholder text "Toolbar" centered (will be replaced in Story 1.7)

- [x] Task 4: Create Code Panel Placeholder (AC: #1)
  - [x] 4.1 Create left panel container with panel background
  - [x] 4.2 Apply `--da-bg-secondary` background
  - [x] 4.3 Add right border using `--da-border` color
  - [x] 4.4 Add placeholder header with "CODE" text
  - [x] 4.5 Use `da-panel` class pattern from architecture

- [x] Task 5: Create Circuit Panel Placeholder (AC: #1)
  - [x] 5.1 Create center panel container (fills remaining space)
  - [x] 5.2 Apply `--da-bg-primary` background (main canvas area)
  - [x] 5.3 Add placeholder header with "CIRCUIT" text
  - [x] 5.4 This panel will hold the canvas renderer in Epic 6

- [x] Task 6: Create State Panel Placeholder (AC: #1)
  - [x] 6.1 Create right panel container with panel background
  - [x] 6.2 Apply `--da-bg-secondary` background
  - [x] 6.3 Add left border using `--da-border` color
  - [x] 6.4 Add placeholder header with "STATE" text

- [x] Task 7: Create Status Bar Placeholder (AC: #1)
  - [x] 7.1 Create status bar container div with 24px fixed height
  - [x] 7.2 Apply `--da-panel-header` background color
  - [x] 7.3 Add top border using `--da-border` color
  - [x] 7.4 Add placeholder text "Ready" left-aligned
  - [x] 7.5 Use smaller text size (text-xs or text-sm)

- [x] Task 8: Update main.ts to Use App Component (AC: #1)
  - [x] 8.1 Import `App` from `@ui/index`
  - [x] 8.2 Create new `App` instance
  - [x] 8.3 Call `app.mount()` with the `#app` container
  - [x] 8.4 Remove the temporary placeholder from Story 1.4

- [x] Task 9: Add Panel CSS Classes to main.css (AC: #1)
  - [x] 9.1 Add `.da-panel` class with standard panel styling
  - [x] 9.2 Add `.da-panel-header` class for panel headers
  - [x] 9.3 Add `.da-toolbar` class for toolbar container
  - [x] 9.4 Add `.da-statusbar` class for status bar container
  - [x] 9.5 All classes use CSS variables for colors

- [x] Task 10: Validate Layout Implementation (AC: #1)
  - [x] 10.1 Verify layout fills entire viewport (no scrollbars)
  - [x] 10.2 Verify toolbar is exactly 48px height
  - [x] 10.3 Verify status bar is exactly 24px height
  - [x] 10.4 Verify three panels are visible with correct backgrounds
  - [x] 10.5 Verify borders are visible using theme colors
  - [x] 10.6 Run `npm run build` - must complete without errors
  - [x] 10.7 Run `npx tsc --noEmit` - must pass with no TypeScript errors
  - [x] 10.8 Test in both lab-mode and story-mode themes

---

## Dev Notes

### Previous Story Intelligence (Story 1.4)

**Key Learnings from Story 1.4:**
- Theme system is fully implemented with all CSS variables
- Theme switching works via `setTheme()`, `toggleTheme()`, `initTheme()` functions
- All colors must use CSS variables (`--da-*`) - never hardcode hex values
- Tailwind classes like `bg-da-bg-primary` work with CSS variables
- Current `main.ts` has placeholder content that needs to be replaced
- CSS variables for borders and panel headers were added: `--da-border`, `--da-panel-header`
- CSS was inlined into `main.css` due to PostCSS @import order issues

**Current State of Project:**
- 9 feature folders with barrel exports configured
- Path aliases work (`@ui`, `@state`, `@types`, etc.)
- Theme system complete with 18 CSS variables
- No UI components exist yet - only placeholder in main.ts
- `ui/theme.ts` and `ui/index.ts` exist

**CSS Variables Available (from main.css):**
```css
--da-bg-primary: #1a1a2e;      /* Main background */
--da-bg-secondary: #252542;    /* Panel backgrounds */
--da-bg-tertiary: #2f2f52;     /* Nested elements, hover */
--da-text-primary: #e0e0e0;    /* Main text */
--da-text-secondary: #a0a0b0;  /* Muted text */
--da-accent: #00b4d8;          /* Primary accent (Lab Mode) */
--da-border: #3a3a52;          /* Panel/element borders */
--da-panel-header: #202038;    /* Panel header background */
```

### Architecture Requirements

**From architecture.md - Module Architecture:**

```
src/ui/
├── App.ts          # Root application component
├── LabMode.ts      # Lab mode layout container (future)
├── StoryMode.ts    # Story mode layout container (future)
├── Toolbar.ts      # Main toolbar with controls (Story 1.7)
├── Panel.ts        # Resizable panel component (Story 1.6)
├── StatusBar.ts    # Bottom status bar (Story 1.9)
├── theme.ts        # Theme switching logic (done)
└── index.ts        # Barrel exports
```

**From architecture.md - Naming Conventions:**
| Element | Convention | Example |
|---------|------------|---------|
| Class/Component files | PascalCase | `App.ts`, `Panel.ts` |
| Functions | camelCase | `mount()`, `render()` |
| CSS variables | `--da-` prefix | `--da-bg-primary` |
| Custom CSS classes | `da-` prefix, kebab-case | `da-panel`, `da-toolbar` |

**From architecture.md - Implementation Patterns:**
- Use named exports, not default exports
- TypeScript strict mode (no `any`)
- Use `null` for missing values, not `undefined`
- Component pattern: Classes with `mount()` and `render()` methods

### Layout Specification

**From UX Design Specification:**

```
┌─────────────────────────────────────────────────────────────────┐
│ Toolbar (48px fixed height)                                      │
├─────────────────┬───────────────────────────┬───────────────────┤
│                 │                           │                   │
│ Code Editor     │  Circuit Visualizer       │  State Panel      │
│ (resizable)     │  (fills remaining)        │  (resizable)      │
│                 │                           │                   │
│ min: 250px      │  min: 400px               │  min: 200px       │
│ default: 350px  │                           │  default: 280px   │
│                 │                           │                   │
├─────────────────┴───────────────────────────┴───────────────────┤
│ Status Bar (24px fixed height)                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Panel Minimum Widths (for Story 1.6 reference):**
- Code panel: 250px minimum, 350px default
- Circuit panel: 400px minimum (fills remaining space)
- State panel: 200px minimum, 280px default

**Note:** This story creates the static layout. Resizing is implemented in Story 1.6.

### CSS Grid Implementation

**Recommended Grid Structure:**

```css
.da-app-layout {
  display: grid;
  grid-template-rows: 48px 1fr 24px;
  grid-template-columns: 350px 1fr 280px;
  grid-template-areas:
    "toolbar toolbar toolbar"
    "code circuit state"
    "statusbar statusbar statusbar";
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}
```

**Tailwind Approach (alternative):**
Can use Tailwind Grid utilities if preferred:
```html
<div class="grid grid-rows-[48px_1fr_24px] grid-cols-[350px_1fr_280px] h-screen">
```

### App.ts Implementation Pattern

**Recommended Structure:**

```typescript
// src/ui/App.ts

/** Root application component - renders the main 3-panel layout */
export class App {
  private container: HTMLElement | null = null;

  /**
   * Mount the application to a DOM container
   */
  mount(container: HTMLElement): void {
    this.container = container;
    this.render();
  }

  /**
   * Render the application layout
   */
  private render(): void {
    if (!this.container) return;

    // Note: innerHTML with static template - no user input, safe from XSS
    this.container.innerHTML = `
      <div class="da-app-layout">
        <header class="da-toolbar">Toolbar</header>
        <aside class="da-panel da-code-panel">CODE</aside>
        <main class="da-circuit-panel">CIRCUIT</main>
        <aside class="da-panel da-state-panel">STATE</aside>
        <footer class="da-statusbar">Ready</footer>
      </div>
    `;
  }

  /**
   * Destroy and clean up
   */
  destroy(): void {
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }
  }
}
```

### Panel Header Pattern

**From UX Design Specification - Panel Structure:**

```html
<aside class="da-panel">
  <div class="da-panel-header">
    <span class="panel-title">CODE</span>
    <!-- Close button added in Story 1.10 -->
  </div>
  <div class="da-panel-content">
    <!-- Content area -->
  </div>
</aside>
```

### Potential Issues to Watch

1. **Viewport Height:** Ensure `100vh` doesn't cause issues with mobile browsers (use `100dvh` if needed, but not required for desktop-only MVP)

2. **CSS Grid Support:** Firefox 100% supports CSS Grid - no compatibility issues expected

3. **Theme Integration:** All colors MUST use CSS variables via Tailwind classes (`bg-da-bg-primary`) or custom classes using `var(--da-*)`. Never hardcode colors.

4. **Overflow:** Set `overflow: hidden` on the main container to prevent scrollbars. Individual panels can have their own overflow if needed.

5. **Border Collapse:** When panels have borders, ensure they don't double up where panels meet

6. **Z-Index:** Keep z-index simple for now. Only needed if elements overlap.

### Testing Requirements

- [x] Run `npm run build` - must complete without errors
- [x] Run `npx tsc --noEmit` - must pass with no TypeScript errors
- [x] Verify in Firefox (primary browser)
- [x] Verify layout fills viewport exactly (no scrollbars on body)
- [x] Verify toolbar height is 48px (inspect element)
- [x] Verify status bar height is 24px (inspect element)
- [x] Verify three panels are visible with distinct backgrounds
- [x] Verify borders between panels are visible
- [x] Test theme toggle still works (colors change appropriately)
- [x] Test window resize - layout should stay stable

### Project Structure Notes

**Files to Create:**
- `src/ui/App.ts` - Root application component

**Files to Modify:**
- `src/ui/index.ts` - Add App export
- `src/main.ts` - Use App component instead of placeholder
- `src/styles/main.css` - Add panel/layout CSS classes

**Alignment with Architecture:**
- Follows feature folder organization
- Uses named exports pattern
- Uses class-based component pattern with mount/render
- All styling via CSS variables and Tailwind

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Module Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Styling Patterns]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Panel Structure]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Layout Foundation]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.5: Create Basic App Shell]
- [Source: _bmad-output/implementation-artifacts/1-4-implement-css-theme-system.md]
- [Source: _bmad-output/project-context.md]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- TypeScript check: `npx tsc --noEmit` - passed with no errors
- Production build: `npm run build` - completed in 519ms (Vite v7.3.1)
- Unit tests: `npx vitest run` - 44 tests passing (23 App tests + 21 existing)

### Completion Notes List

- Created `App.ts` root application component with `mount()`, `render()`, `destroy()`, and `isMountedTo()` methods
- Implemented CSS Grid layout with exact specifications:
  - Toolbar: 48px fixed height, spans all columns
  - Code panel: 350px default width, left position
  - Circuit panel: fills remaining space (1fr), center position
  - State panel: 280px default width, right position
  - Status bar: 24px fixed height, spans all columns
- All CSS uses CSS variables for colors (`--da-bg-primary`, `--da-border`, etc.)
- Panel headers with uppercase titles (CODE, CIRCUIT, STATE)
- Panel content areas ready for future epic implementations
- Status bar shows "Ready" text
- Updated `main.ts` to use the new App component
- Added 23 unit tests for App component covering mount, layout, accessibility, and destroy
- All 44 tests passing, build successful

**Code Review Fixes (2026-01-21):**
- Consolidated duplicate imports in `main.ts` to single import statement
- Added accessibility attributes: `aria-label` on all panels, `role="status"` and `aria-live="polite"` on statusbar
- Replaced Tailwind class `text-da-text-secondary` with CSS class `da-toolbar-text` for consistency
- Added `isMounted` state tracking and `isMountedTo()` method for edge case handling
- Standardized HTML comment format across all panel content placeholders
- Added JSDoc `@returns` annotations to all methods
- Added `.da-toolbar-text` CSS class with CSS variable color
- Added 12 new tests: mount edge cases (double mount, remount), accessibility attributes, semantic HTML verification

### File List

- `src/ui/App.ts` - CREATED: Root application component with accessibility support
- `src/ui/App.test.ts` - CREATED: Unit tests (23 tests including accessibility)
- `src/ui/index.ts` - MODIFIED: Added App export
- `src/main.ts` - MODIFIED: Use App component, consolidated imports
- `src/styles/main.css` - MODIFIED: Added layout CSS classes + `.da-toolbar-text`

### Change Log

- 2026-01-21: Story implementation complete
  - Created 3-panel app shell layout using CSS Grid
  - App component with toolbar, code panel, circuit panel, state panel, status bar
  - All CSS uses theme variables for proper Lab Mode / Story Mode support
  - 11 unit tests added, all 32 project tests passing

- 2026-01-21: Code review fixes applied
  - Fixed 5 MEDIUM issues: import consolidation, accessibility, CSS consistency, test coverage, Tailwind mixing
  - Fixed 3 LOW issues: comment formatting, JSDoc annotations
  - Added 12 new tests (44 total), all passing
  - Build verified: 519ms production build

---
