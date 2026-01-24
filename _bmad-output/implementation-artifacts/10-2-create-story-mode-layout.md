# Story 10.2: Create Story Mode Layout

Status: done

---

## Story

As a user,
I want a distinct Story Mode interface,
So that I feel immersed in the narrative.

## Acceptance Criteria

1. **Given** I am in Story Mode
   **When** I view the interface
   **Then** I see a warm gold/copper color theme

2. **And** I see a fixed navigation bar at top (48px height)

3. **And** I see the main story content area (scrollable)

4. **And** I see the "Your Role" panel on the left (desktop ≥1200px)

5. **And** the layout uses Crimson Text serif font for narrative elements

6. **And** the "Your Role" panel hides on screens <1200px

## Tasks / Subtasks

- [x] Task 1: Create Story Mode Layout Structure (AC: #1, #2, #3)
  - [x] 1.1 Refactor `StoryModeContainer.ts` to create proper layout structure
  - [x] 1.2 Create `story-nav` fixed navigation bar container (48px height)
  - [x] 1.3 Create `story-main` scrollable content area with padding-top for fixed nav
  - [x] 1.4 Add ARIA landmarks: `role="banner"` for nav, `role="main"` for content
  - [x] 1.5 Use semantic HTML: `<header>`, `<main>`, `<aside>`

- [x] Task 2: Create StoryNav Component Stub (AC: #2)
  - [x] 2.1 Create `src/story/StoryNav.ts` component
  - [x] 2.2 Render placeholder with logo, toggle area, progress area, era badge
  - [x] 2.3 Style with `position: fixed; top: 0; height: 48px; width: 100%`
  - [x] 2.4 Apply warm gold theme styling (`--da-accent: #d4a574`)
  - [x] 2.5 Add `z-index: 100` to stay above content
  - [x] 2.6 Export from `src/story/index.ts`

- [x] Task 3: Create YourRolePanel Component Stub (AC: #4, #6)
  - [x] 3.1 Create `src/story/YourRolePanel.ts` component
  - [x] 3.2 Render placeholder: title "YOUR ROLE", avatar placeholder, role name
  - [x] 3.3 Style with `position: fixed; left: 24px; top: 72px; width: 220px`
  - [x] 3.4 Apply warm gold border and glass-like background
  - [x] 3.5 Use media query to hide at `max-width: 1199px`
  - [x] 3.6 Add ARIA: `role="complementary"`, `aria-label="Your character role"`
  - [x] 3.7 Export from `src/story/index.ts`

- [x] Task 4: Create StoryContent Component Stub (AC: #3)
  - [x] 4.1 Create `src/story/StoryContent.ts` component
  - [x] 4.2 Render placeholder for story content area
  - [x] 4.3 Style with proper margins: `padding-top: 72px` (nav + gap), `margin-left: 280px` on desktop
  - [x] 4.4 Use media query to remove left margin at `max-width: 1199px`
  - [x] 4.5 Max-width content area (800px) centered for readability
  - [x] 4.6 Export from `src/story/index.ts`

- [x] Task 5: Add Story Mode CSS Styles (AC: #1, #5)
  - [x] 5.1 Add Crimson Text font import to `index.html` (Google Fonts)
  - [x] 5.2 Add `.story-mode` CSS variables in `main.css`:
    - `--story-font-narrative: 'Crimson Text', serif`
    - `--story-bg-deep: #0a0a12`
    - `--story-bg: #12121a`
    - `--story-bg-card: #1e1e2a`
    - `--story-border: rgba(212,165,116,0.15)`
    - `--persona-gold: #d4a574`
    - `--persona-warm: #c9956e`
    - `--persona-copper: #b87333`
  - [x] 5.3 Add layout CSS for story containers in `main.css`
  - [x] 5.4 Add responsive media queries for <1200px breakpoint

- [x] Task 6: Integrate Layout Components in StoryModeContainer (AC: all)
  - [x] 6.1 Import and mount StoryNav in StoryModeContainer
  - [x] 6.2 Import and mount YourRolePanel in StoryModeContainer
  - [x] 6.3 Import and mount StoryContent in StoryModeContainer
  - [x] 6.4 Update render() to compose all child components
  - [x] 6.5 Ensure show()/hide() propagates to child components

- [x] Task 7: Write Tests (AC: all)
  - [x] 7.1 Test StoryModeContainer renders with layout structure
  - [x] 7.2 Test StoryNav renders with placeholder content
  - [x] 7.3 Test YourRolePanel renders and has correct ARIA
  - [x] 7.4 Test StoryContent renders with proper structure
  - [x] 7.5 Test responsive hiding of YourRolePanel (mock window width)
  - [x] 7.6 Test Crimson Text font is applied to narrative elements
  - [x] 7.7 Test story-mode CSS variables are present

- [x] Task 8: Verify Integration (AC: all)
  - [x] 8.1 Run `npm test` - all tests pass
  - [x] 8.2 Run `npm run build` - build succeeds
  - [x] 8.3 Manual test: Switch to Story Mode, verify layout renders
  - [x] 8.4 Manual test: Verify fixed nav stays at top when scrolling
  - [x] 8.5 Manual test: Verify "Your Role" panel shows on wide screens
  - [x] 8.6 Manual test: Resize window <1200px, verify panel hides
  - [x] 8.7 Manual test: Verify warm gold color theme applied

---

## Dev Notes

### Previous Story Intelligence (Story 10.1)

**Critical Assets Created:**
- `StoryModeContainer.ts` exists with mount/show/hide/destroy lifecycle
- Mode switching works via `theme.ts` with `setTheme('story')` / `setTheme('lab')`
- CSS transitions: `.da-mode-transition-enter`, `.da-mode-transition-leave`
- App.ts already integrates StoryModeContainer via `switchToStoryMode()`

**Current StoryModeContainer (stub to replace):**
```typescript
// src/story/StoryModeContainer.ts
export class StoryModeContainer {
  private element: HTMLElement | null = null;
  private container: HTMLElement | null = null;

  mount(container: HTMLElement): void { ... }
  private render(): HTMLElement { /* placeholder */ }
  show(): void { ... }
  hide(): void { ... }
  destroy(): void { ... }
}
```

### Architecture Compliance

**From architecture.md - Story folder structure:**
```
├── story/            # Story mode: narrative, characters, choices
│   ├── StoryEngine.ts
│   ├── CharacterCard.ts
│   └── index.ts
```

**Component Hierarchy for This Story:**
```
StoryModeContainer
├── StoryNav           (fixed 48px header)
├── YourRolePanel      (fixed 220px left panel, desktop only)
└── StoryContent       (main scrollable content area)
```

### UX Design Reference

**From ux-design-specification.md - Story Mode Layout:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Digital Archaeology  [📜 Story] [⚡ Lab]  Act: ● ○ ○ ○ ○  │ 1971  │ [Save] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  "Your Role"     │  Chapter Title, Setting, Narrative,                     │
│   Floating       │  Character Cards, Dialogue, Choices                     │
│   Panel          │                                                          │
│                  │  [Enter the Lab] button                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Layout Dimensions:**
- Navigation bar: 48px height, position: fixed, z-index: 100
- Your Role panel: 220px width, position: fixed, left: 24px, top: 72px (48 + 24 gap)
- Content area: max-width 800px, centered, padding-top: 72px

**Responsive Breakpoints:**
- ≥1200px: Your Role panel visible
- <1200px: Your Role panel hidden, content full width
- <768px: Not supported (show message)

### CSS Variables to Use

**Story Mode Theme (from UX spec):**
```css
.story-mode {
  /* Backgrounds */
  --story-bg-deep: #0a0a12;
  --story-bg: #12121a;
  --story-bg-card: #1e1e2a;
  --story-border: rgba(212,165,116,0.15);

  /* Accents */
  --persona-gold: #d4a574;
  --persona-warm: #c9956e;
  --persona-copper: #b87333;

  /* Typography */
  --story-font-narrative: 'Crimson Text', serif;
}
```

**Existing Variables (from main.css):**
```css
.story-mode {
  --da-bg-primary: #0a0a12;
  --da-bg-secondary: #141420;
  --da-accent: #d4a574;
  --da-text-primary: #f0e6d6;
}
```

### Font Integration

**Crimson Text Import (add to index.html):**
```html
<link href="https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
```

**Usage:**
- Narrative text: `font-family: var(--story-font-narrative);`
- UI elements: System sans-serif (existing)
- Technical notes: Source Code Pro (existing)

### Project Structure Notes

**New files to create:**
```
digital-archaeology-web/
└── src/
    └── story/
        ├── index.ts                    # Update exports
        ├── StoryModeContainer.ts       # REFACTOR (add layout)
        ├── StoryModeContainer.test.ts  # UPDATE tests
        ├── StoryNav.ts                 # NEW component
        ├── StoryNav.test.ts            # NEW tests
        ├── YourRolePanel.ts            # NEW component
        ├── YourRolePanel.test.ts       # NEW tests
        ├── StoryContent.ts             # NEW component
        └── StoryContent.test.ts        # NEW tests
```

### Accessibility Checklist

- [ ] **Keyboard Navigation** - Tab through nav elements (future story)
- [x] **ARIA Attributes** - Proper landmark roles
  - [x] `role="banner"` on navigation
  - [x] `role="main"` on content area
  - [x] `role="complementary"` on Your Role panel
  - [x] `aria-label` on panels without visible headings
- [N/A] **Focus Management** - No interactive elements yet (stub components)
- [N/A] **Color Contrast** - Uses existing theme colors (verified)
- [N/A] **XSS Prevention** - No user input in this story
- [N/A] **Screen Reader Announcements** - Future story (navigation)

### Anti-Patterns to Avoid

| Don't | Do |
|-------|-----|
| Create inline styles | Use CSS classes with theme variables |
| Hard-code colors | Use `--persona-*` and `--story-*` variables |
| Use absolute positioning for content | Use fixed for nav/panel, relative for content |
| Forget responsive hiding | Use media query at 1199px breakpoint |
| Skip semantic HTML | Use `<header>`, `<main>`, `<aside>` |
| Duplicate font imports | Add Crimson Text to index.html once |

### Critical Technical Requirements

1. **Preserve Component Lifecycle** - Keep existing mount/show/hide/destroy pattern
2. **Semantic HTML** - Use proper landmarks (`<header>`, `<main>`, `<aside>`)
3. **Fixed + Scrollable** - Nav fixed, content scrollable with proper padding
4. **Responsive Design** - Your Role panel hides <1200px via media query
5. **Theme Variables** - All colors via CSS custom properties
6. **Font Loading** - Crimson Text via Google Fonts CDN

### Canonical Mockup Reference

**File:** `_bmad-output/planning-artifacts/mockups/option-b10-flip-views.html`

Key CSS classes from mockup:
```css
.story-nav { position: fixed; top: 0; height: 48px; }
.your-role-panel { position: fixed; left: 24px; top: 72px; width: 220px; }
.story-container { padding-top: 72px; margin-left: 280px; }

@media (max-width: 1199px) {
  .your-role-panel { display: none; }
  .story-container { margin-left: 0; }
}
```

### Test Considerations

**Key test scenarios:**
1. **Layout structure** - Container has nav, panel, and content areas
2. **Fixed positioning** - Nav stays at top (verify CSS class)
3. **Responsive behavior** - Panel hidden at narrow widths
4. **ARIA landmarks** - Correct roles on semantic elements
5. **Theme variables** - Story-mode specific variables present
6. **Font applied** - Crimson Text on narrative elements

**Component test pattern (from existing tests):**
```typescript
describe('StoryNav', () => {
  let container: HTMLElement;
  let storyNav: StoryNav;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    storyNav?.destroy();
    container.remove();
  });

  it('renders with fixed positioning class', () => {
    storyNav = new StoryNav();
    storyNav.mount(container);
    expect(container.querySelector('.da-story-nav')).toBeTruthy();
  });
});
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 10.2]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Story Mode Components]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Color Systems]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Typography]
- [Source: _bmad-output/planning-artifacts/mockups/option-b10-flip-views.html]
- [Source: digital-archaeology-web/src/story/StoryModeContainer.ts]
- [Source: digital-archaeology-web/src/styles/main.css]
- [Source: _bmad-output/implementation-artifacts/10-1-implement-story-lab-mode-toggle.md]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

1. All three new components (StoryNav, YourRolePanel, StoryContent) created with programmatic DOM building to avoid innerHTML XSS security concerns
2. Components follow existing lifecycle pattern: mount/show/hide/destroy with getElement() accessor
3. StoryModeContainer refactored to compose and manage all child components
4. CSS uses all specified theme variables (--persona-gold, --story-bg-deep, etc.)
5. Responsive design implemented: YourRolePanel hidden via CSS media query at <1200px
6. Semantic HTML elements used (<header>, <aside>, <main>) with implicit ARIA landmarks - no redundant role attributes
7. Crimson Text font loaded via Google Fonts CDN in index.html
8. All 1480 tests pass, build succeeds

### Code Review Fixes Applied

1. **[ACCESSIBILITY]** Removed redundant ARIA role attributes from semantic HTML elements - `<header>`, `<aside>`, `<main>` have implicit roles per ARIA spec
2. **[LOGIC BUG]** Fixed `isVisible()` to return `false` when component is not mounted (was incorrectly returning `true`)
3. **[DOCUMENTATION]** Fixed CSS comment for margin-left calculation (24px + 220px + 36px = 280px)
4. **[DEFENSIVE CODING]** Added `type="button"` to all button elements to prevent accidental form submissions
5. **[TESTS]** Updated tests to verify semantic element types instead of explicit role attributes
6. **[TESTS]** Added 3 new tests for `isVisible()` returning false when not mounted

### File List

**New Files:**
- `src/story/StoryNav.ts` - Fixed 48px navigation bar component
- `src/story/StoryNav.test.ts` - Comprehensive tests for StoryNav
- `src/story/YourRolePanel.ts` - Fixed 220px left panel component
- `src/story/YourRolePanel.test.ts` - Comprehensive tests for YourRolePanel
- `src/story/StoryContent.ts` - Main scrollable content area component
- `src/story/StoryContent.test.ts` - Comprehensive tests for StoryContent

**Modified Files:**
- `src/story/StoryModeContainer.ts` - Refactored to compose child components
- `src/story/StoryModeContainer.test.ts` - Updated tests for new layout structure
- `src/story/index.ts` - Added exports for new components
- `index.html` - Added Crimson Text font import
- `src/styles/main.css` - Added Story Mode layout CSS (~200 lines)

