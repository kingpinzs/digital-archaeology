# Story 1.4: Implement CSS Theme System

Status: done

---

## Story

As a developer,
I want a theme system using CSS custom properties,
So that colors and styles are consistent and themeable.

## Acceptance Criteria

1. **Given** the project with Tailwind configured
   **When** I implement the theme system
   **Then** main.css defines all --da-* CSS variables (bg, text, signal, gate colors)
   **And** Lab Mode specific overrides are defined (inlined in main.css or separate file)
   **And** Story Mode specific overrides are defined (warm gold theme, inlined in main.css or separate file)
   **And** theme.ts in ui/ provides theme switching logic
   **And** the HTML element can have class "lab-mode" or "story-mode"
   **And** colors change appropriately when theme class changes

## Tasks / Subtasks

- [x] Task 1: Define CSS Custom Properties in main.css (AC: #1)
  - [x] 1.1 Add `:root` block with all `--da-*` color variables for Lab Mode defaults
  - [x] 1.2 Define background colors: `--da-bg-primary`, `--da-bg-secondary`, `--da-bg-tertiary`
  - [x] 1.3 Define text colors: `--da-text-primary`, `--da-text-secondary`
  - [x] 1.4 Define accent colors: `--da-accent`, `--da-accent-hover`
  - [x] 1.5 Define signal colors: `--da-signal-high` (#00ff88), `--da-signal-low` (#3a3a3a)
  - [x] 1.6 Define gate type colors: `--da-gate-and`, `--da-gate-or`, `--da-gate-xor`, `--da-gate-not`
  - [x] 1.7 Define semantic colors: `--da-error`, `--da-warning`, `--da-success`
  - [x] 1.8 Define panel/border colors: `--da-border`, `--da-panel-header`

- [x] Task 2: Create lab-mode.css (AC: #1)
  - [x] 2.1 Create `src/styles/lab-mode.css` (Note: Inlined into main.css to avoid @import order issues)
  - [x] 2.2 Define `.lab-mode` selector with cool blue professional theme
  - [x] 2.3 Lab Mode accent color: #00b4d8 (cyan blue)
  - [x] 2.4 Lab Mode background: #1a1a2e (dark blue-tinted)
  - [x] 2.5 Import lab-mode.css in main.css (Inlined directly due to CSS @import order constraints)

- [x] Task 3: Create story-mode.css (AC: #1)
  - [x] 3.1 Create `src/styles/story-mode.css` (Note: Inlined into main.css to avoid @import order issues)
  - [x] 3.2 Define `.story-mode` selector with warm gold/copper theme
  - [x] 3.3 Story Mode accent color: #d4a574 (warm gold)
  - [x] 3.4 Story Mode background: #0a0a12 (darker, warmer tint)
  - [x] 3.5 Import story-mode.css in main.css (Inlined directly due to CSS @import order constraints)

- [x] Task 4: Create theme.ts in ui/ (AC: #1)
  - [x] 4.1 Create `src/ui/theme.ts` with theme type definitions
  - [x] 4.2 Define `ThemeMode` type as `'lab' | 'story'`
  - [x] 4.3 Implement `setTheme(mode: ThemeMode)` function to toggle HTML class
  - [x] 4.4 Implement `getTheme(): ThemeMode` to read current theme
  - [x] 4.5 Implement `toggleTheme()` convenience function
  - [x] 4.6 Export functions from `src/ui/index.ts`

- [x] Task 5: Update main.ts to Initialize Theme (AC: #1)
  - [x] 5.1 Import theme functions from `@ui/theme`
  - [x] 5.2 Set default theme to 'lab' on app initialization
  - [x] 5.3 Update placeholder to use theme-aware Tailwind classes

- [x] Task 6: Validate Theme System (AC: #1)
  - [x] 6.1 Verify theme classes toggle correctly on `<html>` element
  - [x] 6.2 Verify CSS variables change when theme changes
  - [x] 6.3 Verify Tailwind `bg-da-*` classes reflect CSS variable values
  - [x] 6.4 Run `npm run build` - must complete without errors
  - [x] 6.5 Run `npx tsc --noEmit` - must pass with no TypeScript errors

---

## Dev Notes

### Previous Story Intelligence (Stories 1.1, 1.2, 1.3)

**Key Learnings from Story 1.3:**
- Project structure is fully set up with 9 feature folders and barrel exports
- Path aliases are configured (@ui, @state, @types, etc.) in both tsconfig.json and vite.config.ts
- Current `main.css` has Tailwind imports but NO CSS variables yet - comment placeholder exists
- `tailwind.config.js` already references CSS variables via `var(--da-*)` - but variables don't exist yet!
- Current `main.ts` uses `bg-gray-900` as temporary fallback because theme system wasn't implemented

**Current State of main.css:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* CSS custom properties will be added in Story 1.4 (Implement CSS Theme System) */
```

**Current Tailwind Config Already Expects These Variables:**
```javascript
colors: {
  'da-bg-primary': 'var(--da-bg-primary)',
  'da-bg-secondary': 'var(--da-bg-secondary)',
  'da-bg-tertiary': 'var(--da-bg-tertiary)',
  'da-text-primary': 'var(--da-text-primary)',
  'da-text-secondary': 'var(--da-text-secondary)',
  'da-accent': 'var(--da-accent)',
  'da-accent-hover': 'var(--da-accent-hover)',
  'da-signal-high': 'var(--da-signal-high)',
  'da-signal-low': 'var(--da-signal-low)',
  'da-gate-and': 'var(--da-gate-and)',
  'da-gate-or': 'var(--da-gate-or)',
  'da-gate-xor': 'var(--da-gate-xor)',
  'da-gate-not': 'var(--da-gate-not)',
  'da-error': 'var(--da-error)',
  'da-warning': 'var(--da-warning)',
  'da-success': 'var(--da-success)',
}
```

### Architecture Requirements

**From architecture.md - Styling Patterns:**

```css
:root, .lab-mode {
  --da-bg-primary: #1a1a2e;
  --da-accent: #00b4d8;
  --da-signal-high: #00ff88;
}

.story-mode {
  --da-bg-primary: #0a0a12;
  --da-accent: #d4a574;
}
```

**From architecture.md - CSS & Theming Conventions:**

| Element | Convention | Example |
|---------|------------|---------|
| Custom classes | `da-` prefix, kebab-case | `da-panel`, `da-toolbar` |
| CSS variables | `--da-` prefix | `--da-bg-primary` |
| Theme switching | Class on `<html>` | `lab-mode` or `story-mode` |
| Animations | `da-anim-` prefix | `da-anim-signal-pulse` |

**Rules:**
- Tailwind utilities first
- CSS variables for colors (enables theming)
- Custom classes only when Tailwind insufficient

**From UX Design Specification:**

**Lab Mode Theme (Dense Professional):**
- Background: Dark blue-gray (#1a1a2e)
- Accent: Cool blue (#00b4d8)
- Text: Light gray (#e0e0e0)
- Purpose: Technical workspace, high information density

**Story Mode Theme (Warm Narrative):**
- Background: Very dark, warm tint (#0a0a12)
- Accent: Warm gold/copper (#d4a574)
- Text: Warm white (#f0e6d6)
- Purpose: Immersive storytelling, character focus
- Typography: Crimson Text for headers (to be implemented later)

### Complete CSS Variable Specification

**Required Variables (from Tailwind config + architecture):**

```css
/* Background colors */
--da-bg-primary      /* Main app background */
--da-bg-secondary    /* Panel backgrounds */
--da-bg-tertiary     /* Nested elements, hover states */

/* Text colors */
--da-text-primary    /* Main text */
--da-text-secondary  /* Muted/secondary text */

/* Accent colors */
--da-accent          /* Primary action color */
--da-accent-hover    /* Hover state for accents */

/* Signal colors (circuit visualization) */
--da-signal-high     /* High signal (1) - #00ff88 green */
--da-signal-low      /* Low signal (0) - #3a3a3a dark gray */

/* Gate type colors (circuit visualization) */
--da-gate-and        /* AND gates */
--da-gate-or         /* OR gates */
--da-gate-xor        /* XOR gates */
--da-gate-not        /* NOT gates (inverters) */

/* Semantic colors */
--da-error           /* Error states */
--da-warning         /* Warning states */
--da-success         /* Success states */
```

### theme.ts Implementation Pattern

**From architecture.md - Module Patterns:**
- Use named exports, not default exports
- Use TypeScript strict mode (no `any`)
- Use `null` for missing values, not `undefined`
- camelCase for function names

**Recommended Implementation:**

```typescript
// src/ui/theme.ts

/** Available theme modes */
export type ThemeMode = 'lab' | 'story';

/** CSS class names for each theme */
const THEME_CLASSES: Record<ThemeMode, string> = {
  lab: 'lab-mode',
  story: 'story-mode',
};

/**
 * Set the application theme by updating the HTML element class
 */
export function setTheme(mode: ThemeMode): void {
  const html = document.documentElement;

  // Remove all theme classes
  Object.values(THEME_CLASSES).forEach(cls => {
    html.classList.remove(cls);
  });

  // Add the selected theme class
  html.classList.add(THEME_CLASSES[mode]);

  // Store preference
  localStorage.setItem('da-theme', mode);
}

/**
 * Get the current theme from HTML class or localStorage
 */
export function getTheme(): ThemeMode {
  const stored = localStorage.getItem('da-theme') as ThemeMode | null;
  if (stored && (stored === 'lab' || stored === 'story')) {
    return stored;
  }

  // Check current class
  const html = document.documentElement;
  if (html.classList.contains('story-mode')) {
    return 'story';
  }

  return 'lab'; // default
}

/**
 * Toggle between lab and story modes
 */
export function toggleTheme(): ThemeMode {
  const current = getTheme();
  const next: ThemeMode = current === 'lab' ? 'story' : 'lab';
  setTheme(next);
  return next;
}

/**
 * Initialize theme from stored preference or default
 */
export function initTheme(): ThemeMode {
  const theme = getTheme();
  setTheme(theme);
  return theme;
}
```

### Lab Mode Color Palette

```css
.lab-mode, :root {
  /* Backgrounds - cool blue-gray tints */
  --da-bg-primary: #1a1a2e;
  --da-bg-secondary: #252542;
  --da-bg-tertiary: #2f2f52;

  /* Text - high contrast light gray */
  --da-text-primary: #e0e0e0;
  --da-text-secondary: #a0a0b0;

  /* Accent - cool cyan blue */
  --da-accent: #00b4d8;
  --da-accent-hover: #48cae4;

  /* Signals - universal (same in both themes) */
  --da-signal-high: #00ff88;
  --da-signal-low: #3a3a3a;

  /* Gate colors - distinct for visualization */
  --da-gate-and: #4ecdc4;
  --da-gate-or: #ff6b6b;
  --da-gate-xor: #ffe66d;
  --da-gate-not: #c792ea;

  /* Semantic colors */
  --da-error: #ff4444;
  --da-warning: #ffaa00;
  --da-success: #00ff88;

  /* UI elements */
  --da-border: #3a3a52;
  --da-panel-header: #202038;
}
```

### Story Mode Color Palette

```css
.story-mode {
  /* Backgrounds - warm dark tints */
  --da-bg-primary: #0a0a12;
  --da-bg-secondary: #141420;
  --da-bg-tertiary: #1e1e2a;

  /* Text - warm white */
  --da-text-primary: #f0e6d6;
  --da-text-secondary: #b0a898;

  /* Accent - warm gold/copper */
  --da-accent: #d4a574;
  --da-accent-hover: #e8c090;

  /* Signals - same as lab mode (universal) */
  --da-signal-high: #00ff88;
  --da-signal-low: #3a3a3a;

  /* Gate colors - same as lab mode (universal) */
  --da-gate-and: #4ecdc4;
  --da-gate-or: #ff6b6b;
  --da-gate-xor: #ffe66d;
  --da-gate-not: #c792ea;

  /* Semantic colors - slightly warmer */
  --da-error: #ff5555;
  --da-warning: #ffbb33;
  --da-success: #44ff88;

  /* UI elements */
  --da-border: #2a2a38;
  --da-panel-header: #12121a;
}
```

### File Structure After Implementation

```
digital-archaeology-web/src/
├── styles/
│   ├── main.css          # MODIFY: Add :root CSS variables
│   ├── lab-mode.css      # CREATE: Lab mode overrides (optional, can be in main.css)
│   └── story-mode.css    # CREATE: Story mode overrides (optional, can be in main.css)
├── ui/
│   ├── theme.ts          # CREATE: Theme switching logic
│   └── index.ts          # MODIFY: Export theme functions
└── main.ts               # MODIFY: Initialize theme, use theme-aware classes
```

**Alternative: All CSS in main.css**
You may choose to keep all CSS in main.css instead of separate files. The architecture allows either approach. If using separate files, import them at the end of main.css:

```css
@import './lab-mode.css';
@import './story-mode.css';
```

### Critical Implementation Rules

**TypeScript (from project-context.md):**
- Strict mode required - No `any` types
- Use `null` for missing values, never `undefined`
- Use named exports (no default exports)
- Functions: camelCase

**CSS (from architecture.md):**
- All color values MUST use CSS variables
- Never hardcode colors directly in components
- CSS variable names: `--da-` prefix, kebab-case
- Theme class goes on `<html>` element

**Testing (from acceptance criteria):**
- Verify theme toggle works on `<html>` element
- Verify CSS variables change when theme class changes
- Verify Tailwind classes work with variables
- Verify build passes

### Potential Issues to Watch

1. **CSS Import Order**: Ensure theme-specific CSS is imported AFTER base CSS variables
2. **Tailwind Purge**: Make sure theme class names (`lab-mode`, `story-mode`) aren't purged - they may not appear in templates
3. **localStorage**: May not be available in SSR or certain testing environments - add fallback
4. **Initial Flash**: Consider setting default theme class in index.html to prevent flash of unstyled content
5. **Variable Inheritance**: CSS variables defined in `:root` are inherited; theme-specific selectors override them

### Testing Requirements

- [x] Run `npm run build` - must complete without errors
- [x] Run `npx tsc --noEmit` - must pass with no TypeScript errors
- [x] Verify theme toggle in browser DevTools (add/remove class on html)
- [x] Verify `bg-da-bg-primary` class renders correct color
- [x] Verify color changes when toggling between lab-mode and story-mode
- [x] Verify theme persists after page reload (localStorage)

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Styling Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#CSS & Theming]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Visual Foundation]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4: Implement CSS Theme System]
- [Source: digital-archaeology-web/tailwind.config.js]
- [Source: digital-archaeology-web/src/styles/main.css]
- [Source: _bmad-output/implementation-artifacts/1-3-create-feature-folder-structure.md]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- TypeScript check: `npx tsc --noEmit` - passed with no errors
- Production build: `npm run build` - completed in 243ms (Vite v7.3.1)
- CSS variables defined: 18 variables in :root, .lab-mode, .story-mode selectors

### Completion Notes List

- Created complete CSS theme system with all 18 CSS custom properties
- Implemented theme switching via `setTheme()`, `getTheme()`, `toggleTheme()`, `initTheme()` functions
- Theme classes applied to `<html>` element for proper CSS variable cascading
- Lab Mode: Cool blue (#00b4d8 accent) on dark blue-gray (#1a1a2e) background
- Story Mode: Warm gold (#d4a574 accent) on darker warm (#0a0a12) background
- Theme preference persisted to localStorage with fallback for unsupported environments
- Updated main.ts with working theme toggle button for testing
- Inlined lab-mode and story-mode CSS directly into main.css to avoid PostCSS @import order warnings
- All Tailwind `bg-da-*`, `text-da-*` classes now work correctly with CSS variables

### Implementation Notes

**CSS @import Issue Resolution:**
Initially attempted to use separate `lab-mode.css` and `story-mode.css` files with `@import`. However, PostCSS/Tailwind requires `@import` statements to precede all other rules, and `@tailwind` directives expand to rules before @import is processed. Solution: Inlined all theme CSS directly into main.css.

**Theme Variable Design:**
- Signal colors and gate colors are universal (identical in both themes) for consistency in circuit visualization
- Semantic colors have slightly warmer variants in Story Mode to match the warm aesthetic
- Background colors create depth hierarchy: primary → secondary → tertiary

### File List

- `digital-archaeology-web/src/styles/main.css` - MODIFIED: Added all CSS custom properties for themes
- `digital-archaeology-web/src/ui/theme.ts` - CREATED: Theme switching logic with localStorage persistence
- `digital-archaeology-web/src/ui/theme.test.ts` - CREATED: Unit tests for theme system (18 tests)
- `digital-archaeology-web/src/ui/index.ts` - MODIFIED: Added theme exports to barrel file
- `digital-archaeology-web/src/main.ts` - MODIFIED: Initialize theme and use theme-aware Tailwind classes
- `digital-archaeology-web/index.html` - MODIFIED: Added default lab-mode class to prevent FOUC
- `digital-archaeology-web/tailwind.config.js` - MODIFIED: Added da-border and da-panel-header colors
- `digital-archaeology-web/package-lock.json` - MODIFIED: Dependency lock file updated

### Change Log

- 2026-01-21: Story implementation complete
  - Implemented complete CSS theme system with Lab Mode and Story Mode
  - Created theme.ts with setTheme, getTheme, toggleTheme, initTheme functions
  - Updated main.ts with theme initialization and test toggle button
  - All builds and TypeScript checks pass successfully
- 2026-01-21: Senior Developer Review - APPROVED with fixes applied
  - Fixed: Added missing da-border and da-panel-header to tailwind.config.js
  - Fixed: Created 18 unit tests for theme.ts (100% function coverage)
  - Fixed: Added default lab-mode class to index.html to prevent FOUC
  - Fixed: Updated File List to document all changed files
  - Fixed: Simplified redundant JSDoc comments
  - All 21 tests passing, build successful

---

## Senior Developer Review (AI)

**Reviewer:** Claude Opus 4.5
**Date:** 2026-01-21
**Outcome:** ✅ APPROVED (after fixes)

### Issues Found & Fixed

| Severity | Issue | Resolution |
|----------|-------|------------|
| HIGH | Missing Tailwind colors (da-border, da-panel-header) | Added to tailwind.config.js |
| MEDIUM | No unit tests for theme.ts | Created theme.test.ts with 18 tests |
| MEDIUM | FOUC risk - no default theme in HTML | Added class="lab-mode" to index.html |
| MEDIUM | package-lock.json not in File List | Updated File List |
| LOW | AC wording mentioned separate CSS files | Updated AC to allow inlined CSS |
| LOW | Redundant JSDoc @param | Simplified comment |

### Verification

- ✅ `npm run build` - Passes (238ms)
- ✅ `npx tsc --noEmit` - No TypeScript errors
- ✅ `npx vitest run` - 21 tests passing (18 theme + 3 existing)
- ✅ All Acceptance Criteria implemented
- ✅ All Tasks marked [x] verified complete

### Code Quality Assessment

- **Security:** No issues - localStorage access is wrapped in try/catch
- **Performance:** Good - minimal DOM operations, efficient class toggling
- **Maintainability:** Good - well-documented, single responsibility functions
- **Test Coverage:** Excellent - all public functions tested including error cases
