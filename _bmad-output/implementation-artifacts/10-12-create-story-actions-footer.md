# Story 10.12: Create Story Actions Footer

Status: done

---

## Story

As a user,
I want navigation controls at the bottom,
So that I can move through the story.

## Acceptance Criteria

1. **Given** I am viewing story content
   **When** I scroll to the bottom
   **Then** I see Previous Scene, Enter Lab, Continue buttons

2. **And** buttons are styled according to their action

3. **And** Previous is disabled on first scene

4. **And** Continue advances to next scene

## Tasks / Subtasks

- [x] Task 1: Create StoryActionsFooter Component Class (AC: #1, #2)
  - [x] 1.1 Create `src/story/StoryActionsFooter.ts` with class definition
  - [x] 1.2 Add private fields: element, container, previousButton, enterLabButton, continueButton
  - [x] 1.3 Add bound handlers for all three button clicks (boundHandlePrevious, boundHandleContinue, boundHandleEnterLab)
  - [x] 1.4 Add mount/show/hide/destroy/isVisible/getElement lifecycle methods

- [x] Task 2: Implement render() Method (AC: #1, #2)
  - [x] 2.1 Create container `<footer>` element with `da-story-actions-footer` class
  - [x] 2.2 Add `role="navigation"` and `aria-label="Story navigation"` for accessibility
  - [x] 2.3 Create Previous Scene button with left arrow (←) and `da-story-action-btn` class
  - [x] 2.4 Create Enter Lab button (reuse EnterLabButton styling or embed) with `da-story-action-btn--lab` class
  - [x] 2.5 Create Continue button with right arrow (→) and `da-story-action-btn--primary` class
  - [x] 2.6 All buttons have `type="button"` attribute

- [x] Task 3: Implement Button State Management (AC: #3)
  - [x] 3.1 Add `setPreviousEnabled(enabled: boolean): void` method
  - [x] 3.2 Add `setContinueEnabled(enabled: boolean): void` method
  - [x] 3.3 Add `setEnterLabVisible(visible: boolean): void` method
  - [x] 3.4 Disabled buttons have `disabled` attribute and `da-story-action-btn--disabled` class
  - [x] 3.5 Add `aria-disabled="true"` when disabled

- [x] Task 4: Implement Click Handling (AC: #1, #4)
  - [x] 4.1 Add `onPrevious(callback: () => void): void` method to register callback
  - [x] 4.2 Add `onContinue(callback: () => void): void` method to register callback
  - [x] 4.3 Add `onEnterLab(callback: () => void): void` method to register callback
  - [x] 4.4 Implement `handlePrevious()` method that calls callback if enabled
  - [x] 4.5 Implement `handleContinue()` method that calls callback if enabled
  - [x] 4.6 Implement `handleEnterLab()` method that calls callback
  - [x] 4.7 Add click event listeners in mount() using bound handlers
  - [x] 4.8 Remove event listeners in destroy()
  - [x] 4.9 Handle click without callback (no throw)
  - [x] 4.10 Disabled buttons should not trigger callbacks

- [x] Task 5: Add CSS Styling (AC: #2)
  - [x] 5.1 Add `.da-story-actions-footer` container styling (flex, space-between, border-top)
  - [x] 5.2 Add `.da-story-actions-footer--hidden` class for visibility control
  - [x] 5.3 Add `.da-story-action-btn` base button styling (transparent bg, border, padding)
  - [x] 5.4 Add `.da-story-action-btn--primary` styling (gold background, dark text)
  - [x] 5.5 Add `.da-story-action-btn--lab` styling (blue gradient, cyan text)
  - [x] 5.6 Add `.da-story-action-btn--disabled` styling (reduced opacity, no pointer-events)
  - [x] 5.7 Add hover effects for each button type
  - [x] 5.8 Add focus outline for accessibility
  - [x] 5.9 Add `.da-story-action-btn-icon` for arrow/icon styling

- [x] Task 6: Write Component Tests (AC: all)
  - [x] 6.1 Test component mounts correctly
  - [x] 6.2 Test renders `<footer>` element with correct class
  - [x] 6.3 Test has role="navigation" and aria-label
  - [x] 6.4 Test renders three buttons: Previous, Enter Lab, Continue
  - [x] 6.5 Test Previous button has left arrow (←) icon
  - [x] 6.6 Test Continue button has right arrow (→) icon
  - [x] 6.7 Test Enter Lab button has lightning bolt (⚡) icon
  - [x] 6.8 Test all buttons have type="button" attribute
  - [x] 6.9 Test onPrevious callback is triggered when clicked
  - [x] 6.10 Test onContinue callback is triggered when clicked
  - [x] 6.11 Test onEnterLab callback is triggered when clicked
  - [x] 6.12 Test click without callback does not throw
  - [x] 6.13 Test setPreviousEnabled(false) disables button
  - [x] 6.14 Test setPreviousEnabled(true) enables button
  - [x] 6.15 Test disabled Previous button does not trigger callback
  - [x] 6.16 Test setContinueEnabled(false) disables button
  - [x] 6.17 Test disabled Continue button does not trigger callback
  - [x] 6.18 Test setEnterLabVisible(false) hides Enter Lab button
  - [x] 6.19 Test setEnterLabVisible(true) shows Enter Lab button
  - [x] 6.20 Test visibility control methods (show/hide/isVisible)
  - [x] 6.21 Test isVisible() returns false before mount
  - [x] 6.22 Test destroy() cleans up resources and removes event listeners
  - [x] 6.23 Test destroy() called multiple times
  - [x] 6.24 Test keyboard accessibility (buttons are focusable)

- [x] Task 7: Export from index.ts (AC: #1)
  - [x] 7.1 Add `export { StoryActionsFooter } from './StoryActionsFooter';` to index.ts

- [x] Task 8: Verify Integration (AC: all)
  - [x] 8.1 Run `npm test` - all tests pass (1757 tests)
  - [x] 8.2 Run `npm run build` - build succeeds

---

## Dev Notes

### Previous Story Intelligence (Story 10.11)

**Critical Assets Created:**
- `src/story/EnterLabButton.ts` - Button with callback pattern (125 lines)
- Bound handler pattern for event listener cleanup: `private boundHandleClick: (e: MouseEvent) => void`
- Constructor initializes bound handler: `this.boundHandleClick = this.handleClick.bind(this)`
- Pattern: onClick callback with null check before invocation

**Code Review Lesson from 10.11:**
- Fix line counts in documentation (was 115, actual 125)
- Mark accessibility checklist items when complete
- Remove dead CSS rules from templates

**From Story 10.10 (TechnicalNote):**
- Pattern for lifecycle methods: mount/show/hide/destroy/isVisible/getElement
- Semantic HTML elements (aside, footer, etc.)

### UX Design Reference

**From ux-design-specification.md - Story Actions Footer:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [← Previous Scene]              [⚡ Enter the Lab]           [Continue →]   │
└─────────────────────────────────────────────────────────────────────────────┘
```

**From mockup option-b8-story-mode.html:**

```css
.story-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
}

.action-btn {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-secondary);
  padding: 14px 28px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 15px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 10px;
}

.action-btn.primary {
  background: var(--accent-gold);
  border-color: var(--accent-gold);
  color: #000;
  font-weight: 600;
}

.action-btn.lab {
  background: linear-gradient(135deg, #0f3460, #16213e);
  border-color: var(--accent-cyan);
  color: var(--accent-cyan);
}
```

**Button Layout:**
- Previous Scene: Left-aligned, secondary style (transparent bg, border)
- Enter the Lab: Center, lab style (blue gradient, cyan accent)
- Continue: Right-aligned, primary style (gold bg, dark text)

### Architecture Compliance

**Implementation uses icon+text structure with createButton helper.**

See `src/story/StoryActionsFooter.ts` (289 lines) for full implementation featuring:
- Three bound handlers for event listener cleanup
- createButton helper with iconAfter parameter for icon positioning
- Icon spans with `aria-hidden="true"` for accessibility
- Text spans with `.da-story-action-btn-text` class

### CSS Requirements

See `src/styles/main.css` lines 2928-3005 (~78 lines) for full CSS implementation.

### Accessibility Checklist

- [x] **Semantic HTML** - Uses native `<footer>` and `<button>` elements
- [x] **ARIA Attributes** - `role="navigation"`, `aria-label` on footer and buttons, `aria-disabled` on disabled
- [x] **Keyboard Navigation** - Native button supports Enter/Space, all buttons focusable
- [x] **Focus Management** - Focus outline on focus state
- [x] **Color Contrast** - Dark text on gold background meets WCAG AA
- [x] **Disabled State** - Visual indication (opacity) and aria-disabled for screen readers

### Anti-Patterns to Avoid

| Don't | Do |
|-------|-----|
| Use `<div>` for buttons | Use semantic `<button>` element |
| Skip event listener cleanup | Remove listeners in destroy() using bound handlers |
| Hardcode colors | Use CSS variables with fallbacks |
| Forget disabled state handling | Check enabled flag before calling callbacks |
| Skip aria-disabled | Set both disabled attribute AND aria-disabled |

### Critical Technical Requirements

1. **Semantic HTML** - Use `<footer>` container, native `<button>` elements
2. **Three Bound Handlers** - One for each button, stored as class properties
3. **Disabled State Management** - setPreviousEnabled, setContinueEnabled methods
4. **Enter Lab Visibility** - setEnterLabVisible method (not all scenes have lab)
5. **Callback Safety** - Check enabled state before invoking callbacks
6. **Named Exports** - Export class using named export

### Note on AC #4 (Continue advances to next scene)

The actual scene advancement logic will be implemented in Story 10.15 (Story Progression Engine). This story creates the button and provides the callback mechanism. The callback will be wired up to scene navigation when the progression engine is built.

### Git Intelligence (Recent Commits)

Recent commits show consistent pattern:
- `feat(web): create Enter the Lab button with code review fixes (Story 10.11)`
- `feat(web): create Technical Note component with code review fixes (Story 10.10)`

**Commit Pattern:** `feat(web): create [Component Name] with code review fixes (Story X.Y)`

**Files typically modified:**
- `src/story/[ComponentName].ts` - New component
- `src/story/[ComponentName].test.ts` - Tests
- `src/story/index.ts` - Add exports
- `src/styles/main.css` - Add CSS

### Project Structure Notes

**Files to create:**
```
digital-archaeology-web/
  src/
    story/
      StoryActionsFooter.ts       # New component
      StoryActionsFooter.test.ts  # New tests
```

**Files to modify:**
```
digital-archaeology-web/
  src/
    story/
      index.ts              # Add export
    styles/
      main.css              # Add footer CSS (~78 lines)
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 10.12]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Story Actions Footer]
- [Source: _bmad-output/planning-artifacts/mockups/option-b8-story-mode.html - CSS styling]
- [Source: digital-archaeology-web/src/story/EnterLabButton.ts - Button pattern]
- [Source: _bmad-output/implementation-artifacts/10-11-create-enter-the-lab-button.md - Previous story]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None required - clean implementation.

### Completion Notes List

- Implemented StoryActionsFooter component with three navigation buttons
- Created Previous Scene (←), Enter the Lab (⚡), and Continue (→) buttons
- Button state management: setPreviousEnabled, setContinueEnabled, setEnterLabVisible
- Three bound handlers for proper event listener cleanup
- Semantic HTML: `<footer role="navigation">` with native `<button>` elements
- Added 40 comprehensive unit tests covering all acceptance criteria
- CSS includes three button styles: secondary, lab (blue gradient), primary (gold)
- All 1757 tests pass, build succeeds

### File List

- `src/story/StoryActionsFooter.ts` - New component (289 lines)
- `src/story/StoryActionsFooter.test.ts` - Tests (40 tests, 380 lines)
- `src/story/index.ts` - Added export for StoryActionsFooter
- `src/styles/main.css` - Added footer CSS (~78 lines)

