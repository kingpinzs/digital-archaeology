# Story 10.3: Create Fixed Navigation Bar

Status: done

---

## Story

As a user,
I want a navigation bar that stays visible,
So that I can always access controls.

## Acceptance Criteria

1. **Given** I am in Story Mode
   **When** I scroll the content
   **Then** the navigation bar stays fixed at the top

2. **And** the bar shows: logo, Story/Lab toggle, progress dots, era badge

3. **And** the bar shows Save and Journal buttons

4. **And** the bar is styled with the story theme

5. **And** I can click the Story/Lab toggle to switch modes

6. **And** keyboard navigation works on the toggle (Arrow keys, Enter, Space)

## Tasks / Subtasks

- [x] Task 1: Integrate ModeToggle into StoryNav (AC: #2, #5, #6)
  - [x] 1.1 Import ModeToggle from `@ui/ModeToggle`
  - [x] 1.2 Accept `currentMode` and `onModeChange` as constructor options
  - [x] 1.3 Replace placeholder toggle area with actual ModeToggle mount point
  - [x] 1.4 Mount ModeToggle instance in the toggle area
  - [x] 1.5 Add `setMode(mode)` method to update ModeToggle state
  - [x] 1.6 Update destroy() to cleanup ModeToggle

- [x] Task 2: Add Journal Button (AC: #3)
  - [x] 2.1 Create Journal button element with `type="button"`
  - [x] 2.2 Add `da-story-nav-action` class (same styling as Save)
  - [x] 2.3 Add `aria-label="Open journal"` for accessibility
  - [x] 2.4 Position between era badge and Save button

- [x] Task 3: Wire Up Mode Toggle to App (AC: #5)
  - [x] 3.1 Update StoryModeContainer to pass currentMode and onModeChange
  - [x] 3.2 Update App.ts to provide mode callbacks to StoryModeContainer
  - [x] 3.3 Ensure clicking toggle calls App's handleModeChange

- [x] Task 4: Add CSS for Toggle in Nav (AC: #4)
  - [x] 4.1 Style ModeToggle within StoryNav context (`.da-story-nav .da-mode-toggle`)
  - [x] 4.2 Ensure gold theme colors apply to toggle buttons
  - [x] 4.3 Verify toggle is vertically centered in 48px nav bar

- [x] Task 5: Update Tests (AC: all)
  - [x] 5.1 Test StoryNav accepts currentMode and onModeChange options
  - [x] 5.2 Test ModeToggle is mounted and renders
  - [x] 5.3 Test clicking toggle calls onModeChange callback
  - [x] 5.4 Test keyboard navigation (Arrow keys switch modes)
  - [x] 5.5 Test Journal button renders with correct attributes
  - [x] 5.6 Test setMode() updates ModeToggle state

- [x] Task 6: Verify Integration (AC: all)
  - [x] 6.1 Run `npm test` - all tests pass (1497 tests)
  - [x] 6.2 Run `npm run build` - build succeeds
  - [x] 6.3 Manual test: Story/Lab toggle switches modes
  - [x] 6.4 Manual test: Arrow keys navigate between toggle buttons
  - [x] 6.5 Manual test: Nav bar stays fixed when scrolling

---

## Dev Notes

### Previous Story Intelligence (Story 10.2)

**Critical Assets Already Created:**
- `StoryNav.ts` exists with placeholder toggle area (empty div with `da-story-nav-toggle-area` class)
- Layout structure: logo left, progress center, era badge and Save right
- CSS complete for 48px fixed nav bar with story theme styling
- All visibility/lifecycle methods implemented: mount/show/hide/destroy/isVisible/getElement

**Code Review Fixes Applied in 10.2:**
- Removed redundant ARIA roles (semantic HTML has implicit roles)
- Fixed `isVisible()` to return `false` when not mounted
- Added `type="button"` to all button elements
- Fixed CSS margin comment accuracy

**Current StoryNav Structure (from Story 10.2):**
```typescript
// src/story/StoryNav.ts - Current placeholder
const toggleArea = document.createElement('div');
toggleArea.className = 'da-story-nav-toggle-area';
toggleArea.setAttribute('aria-label', 'Mode toggle placeholder');
left.appendChild(toggleArea);
// ^ This needs to be replaced with actual ModeToggle mount
```

### ModeToggle Component Reference

**The ModeToggle component already exists at `src/ui/ModeToggle.ts`:**
```typescript
import { ModeToggle, ModeToggleOptions } from '@ui/ModeToggle';

interface ModeToggleOptions {
  currentMode: ThemeMode;  // 'story' | 'lab'
  onModeChange: (mode: ThemeMode) => void;
}

// Usage:
const toggle = new ModeToggle({
  currentMode: 'story',
  onModeChange: (mode) => this.onModeChange(mode)
});
toggle.mount(toggleArea);
toggle.setMode(newMode);  // Update state
toggle.destroy();  // Cleanup
```

**ModeToggle Features:**
- Renders `[📜 Story] [⚡ Lab]` buttons with icons
- ARIA tablist pattern with keyboard navigation (Arrow keys, Home, End)
- Bound event handlers with proper cleanup
- Updates aria-selected and tabindex on mode change

### Architecture Compliance

**StoryNav Options Pattern:**
```typescript
// New interface for StoryNav options
export interface StoryNavOptions {
  currentMode: ThemeMode;
  onModeChange: (mode: ThemeMode) => void;
}

export class StoryNav {
  private modeToggle: ModeToggle | null = null;

  constructor(options: StoryNavOptions) {
    this.currentMode = options.currentMode;
    this.onModeChange = options.onModeChange;
  }

  mount(container: HTMLElement): void {
    // ... existing mount code ...
    this.mountModeToggle();
  }

  private mountModeToggle(): void {
    const toggleArea = this.element?.querySelector('.da-story-nav-toggle-area');
    if (toggleArea) {
      this.modeToggle = new ModeToggle({
        currentMode: this.currentMode,
        onModeChange: this.onModeChange
      });
      this.modeToggle.mount(toggleArea as HTMLElement);
    }
  }

  setMode(mode: ThemeMode): void {
    this.currentMode = mode;
    this.modeToggle?.setMode(mode);
  }

  destroy(): void {
    this.modeToggle?.destroy();
    this.modeToggle = null;
    // ... existing destroy code ...
  }
}
```

### Integration with StoryModeContainer

**StoryModeContainer needs to pass options:**
```typescript
// src/story/StoryModeContainer.ts
export interface StoryModeContainerOptions {
  currentMode: ThemeMode;
  onModeChange: (mode: ThemeMode) => void;
}

export class StoryModeContainer {
  private options: StoryModeContainerOptions;

  constructor(options: StoryModeContainerOptions) {
    this.options = options;
  }

  private mountChildren(): void {
    if (navMount) {
      this.storyNav = new StoryNav({
        currentMode: this.options.currentMode,
        onModeChange: this.options.onModeChange
      });
      this.storyNav.mount(navMount as HTMLElement);
    }
    // ... rest unchanged ...
  }

  setMode(mode: ThemeMode): void {
    this.storyNav?.setMode(mode);
  }
}
```

### App.ts Integration Point

**Current App.ts pattern (from Story 10.1):**
```typescript
// src/ui/App.ts - handleModeChange already exists
private handleModeChange(mode: ThemeMode): void {
  setTheme(mode);
  if (mode === 'lab') {
    this.switchToLabMode();
  } else {
    this.switchToStoryMode();
  }
}

// Update StoryModeContainer initialization:
this.storyModeContainer = new StoryModeContainer({
  currentMode: getTheme(),
  onModeChange: (mode) => this.handleModeChange(mode)
});
```

### UX Design Reference

**From ux-design-specification.md - Navigation Bar:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Digital Archaeology  [📜 Story] [⚡ Lab]  Act: ● ○ ○ ○ ○  │ 1971  │ [Save] │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Element | Description |
|---------|-------------|
| App logo | "Digital Archaeology" in gold accent |
| View toggle | Story/Lab flip buttons |
| Progress dots | Current act indicator (1 of 5) |
| Era badge | Historical context (e.g., "1971") |
| Actions | Journal, Save buttons |

### CSS Requirements

**ModeToggle in StoryNav context:**
```css
/* Ensure ModeToggle inherits Story Mode styling */
.da-story-nav .da-mode-toggle {
  /* Already styled by main ModeToggle CSS */
  /* May need minor adjustments for 48px nav height */
}

/* Story Mode active state uses persona-gold */
.story-mode .da-mode-toggle-btn--active[data-mode="story"] {
  background-color: var(--persona-gold, #d4a574);
}
```

### Accessibility Checklist

- [x] **Keyboard Navigation** - ModeToggle already has Arrow key navigation
- [x] **ARIA Attributes** - ModeToggle uses tablist/tab pattern
  - [x] `role="tablist"` on container
  - [x] `role="tab"` on each button
  - [x] `aria-selected` tracks active state
  - [x] `tabindex` managed for roving focus
- [ ] **Focus Management** - Verify focus visible on toggle buttons
- [N/A] **Color Contrast** - Uses existing verified theme colors
- [N/A] **XSS Prevention** - No user input
- [ ] **Screen Reader Announcements** - Mode change should be announced

### Anti-Patterns to Avoid

| Don't | Do |
|-------|-----|
| Create new toggle in StoryNav | Reuse existing ModeToggle component |
| Pass callbacks through multiple layers | Use options pattern at each level |
| Forget to cleanup ModeToggle | Call modeToggle.destroy() in destroy() |
| Use innerHTML for buttons | Use programmatic DOM (existing pattern) |
| Skip keyboard accessibility | ModeToggle already handles this |

### Critical Technical Requirements

1. **Reuse ModeToggle** - DO NOT recreate toggle logic, import from `@ui/ModeToggle`
2. **Options Pattern** - Pass currentMode and onModeChange through component hierarchy
3. **Bound Handlers** - ModeToggle already manages its own event handlers
4. **Cleanup Chain** - StoryNav.destroy() → ModeToggle.destroy()
5. **State Sync** - setMode() should update ModeToggle's internal state

### Project Structure Notes

**Files to modify:**
```
digital-archaeology-web/
└── src/
    ├── story/
    │   ├── StoryNav.ts                 # Add ModeToggle integration + Journal
    │   ├── StoryNav.test.ts            # Update tests for new features
    │   ├── StoryModeContainer.ts       # Accept options and pass to StoryNav
    │   └── StoryModeContainer.test.ts  # Update tests for options
    ├── ui/
    │   └── App.ts                      # Pass options to StoryModeContainer
    └── styles/
        └── main.css                    # Minor toggle styling in nav context
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 10.3]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Fixed Navigation Bar]
- [Source: digital-archaeology-web/src/ui/ModeToggle.ts]
- [Source: digital-archaeology-web/src/story/StoryNav.ts]
- [Source: digital-archaeology-web/src/ui/App.ts#handleModeChange]
- [Source: _bmad-output/implementation-artifacts/10-2-create-story-mode-layout.md]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

1. Integrated ModeToggle component into StoryNav using options pattern
2. StoryNav now accepts StoryNavOptions with currentMode and onModeChange
3. StoryModeContainer accepts StoryModeContainerOptions and passes to StoryNav
4. App.ts updated to provide mode callbacks when initializing StoryModeContainer
5. handleModeChange in App.ts now syncs StoryNav's toggle via setMode()
6. Journal button added between era badge and Save button with proper accessibility
7. All 1497 tests pass, build succeeds
8. ModeToggle CSS already works in StoryNav context (no additional CSS needed)
9. Keyboard navigation (Arrow keys) works via existing ModeToggle implementation

### Code Review Fixes Applied

1. **Added Enter/Space keyboard handling to ModeToggle** - AC6 requires Enter and Space key activation. Added explicit handlers in `handleKeydown()` to ensure JSDOM compatibility and explicit behavior.
2. **Added Enter/Space tests to ModeToggle.test.ts** - 2 new tests for Enter and Space key activation.
3. **Added Enter/Space tests to StoryNav.test.ts** - 2 new tests for keyboard activation within StoryNav context.
4. All 1501 tests pass (4 new tests added), build succeeds.

### File List

**Modified Files:**
- `src/story/StoryNav.ts` - Added ModeToggle integration, Journal button, options pattern
- `src/story/StoryNav.test.ts` - Added 19 tests for ModeToggle, Journal button, and Enter/Space keys
- `src/story/StoryModeContainer.ts` - Added options pattern, setMode() method
- `src/story/StoryModeContainer.test.ts` - Added 4 new tests for options pattern
- `src/story/index.ts` - Added type exports for StoryNavOptions and StoryModeContainerOptions
- `src/ui/App.ts` - Updated initializeStoryModeContainer and handleModeChange
- `src/ui/ModeToggle.ts` - Added Enter/Space key handling in handleKeydown()
- `src/ui/ModeToggle.test.ts` - Added 2 tests for Enter/Space key activation

