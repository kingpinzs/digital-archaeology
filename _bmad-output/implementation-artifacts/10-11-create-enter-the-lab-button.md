# Story 10.11: Create "Enter the Lab" Button

Status: done

---

## Story

As a user,
I want to transition from Story to Lab for challenges,
So that I can apply what I've learned.

## Acceptance Criteria

1. **Given** I reach a hands-on challenge in the story
   **When** I see the "Enter the Lab" button
   **Then** clicking switches to Lab Mode

2. **And** the button is prominently styled

3. **And** the Lab loads with the relevant challenge context

4. **And** I can return to Story via the activity bar

## Tasks / Subtasks

- [x] Task 1: Create EnterLabButton Component Class (AC: #1, #2)
  - [x] 1.1 Create `src/story/EnterLabButton.ts` with class definition
  - [x] 1.2 Add private fields: element, container, onClickCallback
  - [x] 1.3 Add bound handler for click event cleanup (boundHandleClick pattern)
  - [x] 1.4 Add mount/show/hide/destroy/isVisible/getElement lifecycle methods

- [x] Task 2: Implement render() Method (AC: #2)
  - [x] 2.1 Create `<button>` element with `da-enter-lab-button` class
  - [x] 2.2 Add `type="button"` attribute
  - [x] 2.3 Add icon element (lightning bolt: ⚡) with `da-enter-lab-button-icon` class
  - [x] 2.4 Add text element with "Enter the Lab" text
  - [x] 2.5 Add aria-label for accessibility: "Enter the Lab - switch to Lab Mode"
  - [x] 2.6 Use prominent styling (gold/accent colors, larger size)

- [x] Task 3: Implement Click Handling (AC: #1, #3)
  - [x] 3.1 Add `onClick(callback: () => void): void` method to register callback
  - [x] 3.2 Implement `handleClick()` method that calls the callback
  - [x] 3.3 Add click event listener in mount() using boundHandleClick
  - [x] 3.4 Remove event listener in destroy()
  - [x] 3.5 Handle click without callback (no throw)

- [x] Task 4: Add CSS Styling (AC: #2)
  - [x] 4.1 Add `.da-enter-lab-button` container styling (prominent, centered, gold accent)
  - [x] 4.2 Add `.da-enter-lab-button--hidden` class for visibility control
  - [x] 4.3 Add `.da-enter-lab-button-icon` styling (lightning bolt icon)
  - [x] 4.4 Add hover effects (scale, glow, background tint)
  - [x] 4.5 Add focus outline for accessibility
  - [x] 4.6 Add active/pressed state

- [x] Task 5: Write Component Tests (AC: all)
  - [x] 5.1 Test component mounts correctly
  - [x] 5.2 Test renders `<button>` element with correct class
  - [x] 5.3 Test has type="button" attribute
  - [x] 5.4 Test renders icon element with lightning bolt
  - [x] 5.5 Test renders "Enter the Lab" text
  - [x] 5.6 Test has aria-label for accessibility
  - [x] 5.7 Test onClick callback is triggered when clicked
  - [x] 5.8 Test click without callback does not throw
  - [x] 5.9 Test visibility control methods (show/hide/isVisible)
  - [x] 5.10 Test isVisible() returns false before mount
  - [x] 5.11 Test destroy() cleans up resources and removes event listener
  - [x] 5.12 Test destroy() called multiple times
  - [x] 5.13 Test keyboard accessibility (button native Enter/Space support)
  - [x] 5.14 Test focus accessibility (element is focusable)

- [x] Task 6: Export from index.ts (AC: #1)
  - [x] 6.1 Add `export { EnterLabButton } from './EnterLabButton';` to index.ts

- [x] Task 7: Verify Integration (AC: all)
  - [x] 7.1 Run `npm test` - all tests pass (1717 tests)
  - [x] 7.2 Run `npm run build` - build succeeds

---

## Dev Notes

### Previous Story Intelligence (Story 10.10)

**Critical Assets Created:**
- `src/story/TechnicalNote.ts` - Component pattern reference (151 lines)
- `src/story/types.ts` - Type definitions
- Pattern for lifecycle methods: mount/show/hide/destroy/isVisible/getElement
- Pattern for static content (no element reference needed for unchanging text)
- Code review lesson: Remove dead CSS rules, fix line counts in documentation

**From Story 10.9 (ChoiceCard):**
- Bound handler pattern for event listener cleanup: `private boundHandleClick: (e: MouseEvent) => void`
- Constructor initializes bound handler: `this.boundHandleClick = this.handleClick.bind(this)`
- Click handler pattern with callback

### UX Design Reference

**From ux-design-specification.md - Story Actions Footer:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [← Previous Scene]              [⚡ Enter the Lab]           [Continue →]   │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Visual Design:**
- Prominent button in story footer
- Lightning bolt icon (⚡) for Lab association
- Gold/accent coloring for prominence
- Centered or prominent positioning
- Larger than regular buttons

**Transition Points:**
- "Enter the Lab" button in story footer
- Choice cards that lead to lab challenges
- Switches from Story Mode to Lab Mode

### Architecture Compliance

**EnterLabButton Implementation Pattern:**
```typescript
// src/story/EnterLabButton.ts
/**
 * EnterLabButton provides the transition from Story Mode to Lab Mode.
 * Features prominent styling with lightning bolt icon.
 *
 * Layout specification (from UX design):
 * - Container: Prominent button with gold accent
 * - Icon: Lightning bolt (⚡) indicating action
 * - Text: "Enter the Lab"
 * - Hover: Scale, glow effect
 */
export class EnterLabButton {
  private element: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private onClickCallback: (() => void) | null = null;

  // Bound handler for proper cleanup
  private boundHandleClick: (e: MouseEvent) => void;

  constructor() {
    this.boundHandleClick = this.handleClick.bind(this);
  }

  mount(container: HTMLElement): void {
    this.container = container;
    this.element = this.render();
    this.element.addEventListener('click', this.boundHandleClick);
    this.container.appendChild(this.element);
  }

  onClick(callback: () => void): void {
    this.onClickCallback = callback;
  }

  private handleClick(_e: MouseEvent): void {
    if (this.onClickCallback) {
      this.onClickCallback();
    }
  }

  private render(): HTMLElement {
    const button = document.createElement('button');
    button.className = 'da-enter-lab-button';
    button.setAttribute('type', 'button');
    button.setAttribute('aria-label', 'Enter the Lab - switch to Lab Mode');

    // Icon
    const icon = document.createElement('span');
    icon.className = 'da-enter-lab-button-icon';
    icon.textContent = '⚡';
    icon.setAttribute('aria-hidden', 'true');

    // Text
    const text = document.createElement('span');
    text.className = 'da-enter-lab-button-text';
    text.textContent = 'Enter the Lab';

    button.appendChild(icon);
    button.appendChild(text);
    return button;
  }

  show(): void { this.element?.classList.remove('da-enter-lab-button--hidden'); }
  hide(): void { this.element?.classList.add('da-enter-lab-button--hidden'); }
  isVisible(): boolean {
    if (!this.element) return false;
    return !this.element.classList.contains('da-enter-lab-button--hidden');
  }
  getElement(): HTMLElement | null { return this.element; }

  destroy(): void {
    if (this.element) {
      this.element.removeEventListener('click', this.boundHandleClick);
      this.element.remove();
      this.element = null;
    }
    this.container = null;
    this.onClickCallback = null;
  }
}
```

### CSS Requirements

```css
/* Enter the Lab Button Component (Story 10.11) */

.da-enter-lab-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 32px;
  font-family: inherit;
  font-size: 16px;
  font-weight: 600;
  color: var(--da-bg-primary, #1a1a2e);
  background: linear-gradient(135deg, var(--persona-gold, #d4a574), #e8c090);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.da-enter-lab-button--hidden {
  display: none;
}

.da-enter-lab-button:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 20px rgba(212, 165, 116, 0.4);
}

.da-enter-lab-button:focus {
  outline: 2px solid var(--persona-gold, #d4a574);
  outline-offset: 2px;
}

.da-enter-lab-button:active {
  transform: scale(0.98);
}

.da-enter-lab-button-icon {
  font-size: 20px;
}
```

### Accessibility Checklist

- [x] **Semantic HTML** - Uses native `<button>` element
- [x] **ARIA Attributes** - `aria-label` describes action and destination
- [x] **Keyboard Navigation** - Native button supports Enter/Space
- [x] **Focus Management** - Focus outline on focus state
- [x] **Color Contrast** - Dark text on gold background meets WCAG AA
- [x] **Icon Accessibility** - Icon has `aria-hidden="true"` (decorative)

### Anti-Patterns to Avoid

| Don't | Do |
|-------|-----|
| Use `<div>` or `<a>` for button | Use semantic `<button>` element |
| Skip event listener cleanup | Remove listener in destroy() using bound handler |
| Hardcode colors | Use CSS variables with fallbacks |
| Forget focus styles | Add visible focus outline |
| Skip aria-label | Provide descriptive aria-label |

### Critical Technical Requirements

1. **Semantic HTML** - Use native `<button>` element for accessibility
2. **Bound Handler Pattern** - Store bound click handler for cleanup
3. **Prominent Styling** - Gold gradient, larger padding, hover effects
4. **Event Cleanup** - Remove click listener in destroy()
5. **Named Exports** - Export class using named export

### Note on AC #3 and AC #4

**AC #3 (Lab loads with relevant challenge context):** This will be fully implemented in Story 10.13 (Challenge Objectives) and 10.14 (Story Content Data Structure). This story creates the button and click mechanism; the callback will be wired up to mode switching logic.

**AC #4 (Return to Story via activity bar):** Already implemented in Story 10.1 (Story/Lab Mode Toggle). The activity bar has a Story icon that returns to Story Mode.

### Git Intelligence (Recent Commits)

Recent commits show consistent pattern:
- `feat(web): create Technical Note component with code review fixes (Story 10.10)`
- `fix(web): code review fixes for Choice Card component (Story 10.9)`
- `feat(web): create Choice Card component with code review fixes (Story 10.9)`

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
      EnterLabButton.ts       # New component
      EnterLabButton.test.ts  # New tests
```

**Files to modify:**
```
digital-archaeology-web/
  src/
    story/
      index.ts              # Add export
    styles/
      main.css              # Add button CSS (~40 lines)
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 10.11]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Story Actions Footer]
- [Source: digital-archaeology-web/src/story/ChoiceCard.ts - Click handler pattern]
- [Source: _bmad-output/implementation-artifacts/10-10-create-technical-note-component.md - Previous story]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None required - clean implementation.

### Completion Notes List

- Implemented EnterLabButton component with prominent gold styling
- Created component with bound handler pattern for event cleanup
- Added lightning bolt icon (⚡) with aria-hidden for accessibility
- Button uses native `<button>` element for keyboard support
- Added 21 comprehensive unit tests
- CSS includes hover scale, glow effect, focus outline, active state
- All 1717 tests pass, build succeeds

### File List

- `src/story/EnterLabButton.ts` - New component (125 lines)
- `src/story/EnterLabButton.test.ts` - Tests (21 tests)
- `src/story/index.ts` - Added export for EnterLabButton
- `src/styles/main.css` - Added button CSS (~40 lines)

