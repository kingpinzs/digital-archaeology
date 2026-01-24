# Story 10.9: Create Choice Card Component

Status: done

---

## Story

As a user,
I want to make choices in the story,
So that I feel agency in my journey.

## Acceptance Criteria

1. **Given** a choice point is reached
   **When** I view the choices
   **Then** I see 2-4 choice cards

2. **And** each card has an icon and title

3. **And** each card has a description

4. **And** hovering shows gold border and slide effect

5. **And** clicking navigates to the chosen path

## Tasks / Subtasks

- [x] Task 1: Create ChoiceData Interface (AC: #1, #2, #3)
  - [x] 1.1 Add `ChoiceData` interface to `src/story/types.ts`
  - [x] 1.2 Add fields: id (string), icon (string), title (string), description (string)
  - [x] 1.3 Add JSDoc comments describing each field
  - [x] 1.4 Export interface from `src/story/types.ts`
  - [x] 1.5 Export `ChoiceData` from `src/story/index.ts`

- [x] Task 2: Create ChoiceCard Component Class (AC: #1)
  - [x] 2.1 Create `src/story/ChoiceCard.ts` with class definition
  - [x] 2.2 Add private fields: element, container, choiceData
  - [x] 2.3 Add element references: iconElement, titleElement, descriptionElement
  - [x] 2.4 Add mount/show/hide/destroy/isVisible/getElement lifecycle methods (match DialogueBlock pattern)
  - [x] 2.5 Add onSelect callback for click handling

- [x] Task 3: Implement render() Method (AC: #1, #2, #3)
  - [x] 3.1 Create `<button>` container with `da-choice-card` class and proper ARIA attributes
  - [x] 3.2 Create icon element (`<span>`) with `da-choice-card-icon` class
  - [x] 3.3 Create content wrapper (`<div>`) with `da-choice-card-content` class
  - [x] 3.4 Create title element (`<span>`) with `da-choice-card-title` class
  - [x] 3.5 Create description element (`<p>`) with `da-choice-card-description` class
  - [x] 3.6 Create arrow indicator (`<span>`) with `da-choice-card-arrow` class
  - [x] 3.7 Cache element references for dynamic updates
  - [x] 3.8 Assemble DOM structure (icon | content | arrow)

- [x] Task 4: Implement setChoiceData() Method (AC: #2, #3)
  - [x] 4.1 Add `private choiceData: ChoiceData | null = null` field
  - [x] 4.2 Implement `setChoiceData(data: ChoiceData): void` method
  - [x] 4.3 Call updateDisplay() after setting data
  - [x] 4.4 Implement updateDisplay() to update icon, title, description using textContent
  - [x] 4.5 Handle setChoiceData before mount (apply after mount)

- [x] Task 5: Implement Click Handling (AC: #5)
  - [x] 5.1 Add `private onSelectCallback: ((choiceId: string) => void) | null = null` field
  - [x] 5.2 Add `onSelect(callback: (choiceId: string) => void): void` method
  - [x] 5.3 Store bound click handler as class property for proper cleanup
  - [x] 5.4 Add click event listener in mount() using bound handler
  - [x] 5.5 Remove click event listener in destroy()
  - [x] 5.6 Call callback with choice id when clicked

- [x] Task 6: Add CSS Styling (AC: #4)
  - [x] 6.1 Add `.da-choice-card` container styling (flex, border, padding, cursor: pointer)
  - [x] 6.2 Add `.da-choice-card--hidden` class for visibility control
  - [x] 6.3 Add `.da-choice-card:hover` styling (gold border, transform: translateX, background tint)
  - [x] 6.4 Add `.da-choice-card:focus` styling for keyboard accessibility
  - [x] 6.5 Add `.da-choice-card-icon` styling (large font, gold color)
  - [x] 6.6 Add `.da-choice-card-title` styling (gold color, bold)
  - [x] 6.7 Add `.da-choice-card-description` styling (secondary text color)
  - [x] 6.8 Add `.da-choice-card-arrow` styling (gold color, positioned right)
  - [x] 6.9 Add transition for smooth hover effects

- [x] Task 7: Write Component Tests (AC: all)
  - [x] 7.1 Test component mounts correctly
  - [x] 7.2 Test renders `<button>` element with correct class
  - [x] 7.3 Test has aria-label for accessibility
  - [x] 7.4 Test renders icon element
  - [x] 7.5 Test renders title element
  - [x] 7.6 Test renders description element
  - [x] 7.7 Test renders arrow indicator
  - [x] 7.8 Test setChoiceData() updates icon content
  - [x] 7.9 Test setChoiceData() updates title content
  - [x] 7.10 Test setChoiceData() updates description content
  - [x] 7.11 Test visibility control methods (show/hide/isVisible)
  - [x] 7.12 Test isVisible() returns false before mount
  - [x] 7.13 Test destroy() cleans up resources
  - [x] 7.14 Test setChoiceData before mount (no throw)
  - [x] 7.15 Test data set before mount displays after mounting
  - [x] 7.16 Test destroy() called multiple times
  - [x] 7.17 Test XSS safety - icon uses textContent
  - [x] 7.18 Test XSS safety - title uses textContent
  - [x] 7.19 Test XSS safety - description uses textContent
  - [x] 7.20 Test data update preserves component state
  - [x] 7.21 Test click triggers onSelect callback with choice id
  - [x] 7.22 Test keyboard Enter triggers onSelect callback
  - [x] 7.23 Test keyboard Space triggers onSelect callback
  - [x] 7.24 Test click handler is removed on destroy

- [x] Task 8: Verify Integration (AC: all)
  - [x] 8.1 Run `npm test` - all tests pass (1665 tests)
  - [x] 8.2 Run `npm run build` - build succeeds
  - [x] 8.3 Manual test: Choice cards display correctly (component not yet integrated into UI - verified via unit tests)
  - [x] 8.4 Manual test: Hover shows gold border and slide effect (CSS verified, unit tests confirm structure)
  - [x] 8.5 Manual test: Click triggers callback (verified via unit tests)
  - [x] 8.6 Manual test: Keyboard navigation works (verified via unit tests - button element guarantees native support)

---

## Dev Notes

### Previous Story Intelligence (Story 10.8)

**Critical Assets Created:**
- `src/story/DialogueBlock.ts` - Component pattern reference (135 lines)
- `src/story/types.ts` - Type definitions with `DialogueData` interface
- Pattern for data interfaces: simple fields, clean JSDoc comments
- Pattern for dynamic updates: cache element references, use textContent (XSS safe)
- Pattern for lifecycle methods: mount/show/hide/destroy/isVisible/getElement
- Pattern for pre-mount data handling: store data, apply after mount in mount()
- Pattern for empty defaults in render() (empty strings, not placeholder text)

**Code Review Lessons from 10.8:**
- Add test for isVisible() returning false before mount
- Add test for data update preservation across multiple updates
- Use empty strings as defaults in render(), not placeholder text
- Always use textContent for XSS safety

**Current Component Structure Pattern (from DialogueBlock.ts):**
```typescript
export class ComponentName {
  private element: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private data: DataType | null = null;

  // Element references for dynamic updates
  private someElement: HTMLElement | null = null;

  mount(container: HTMLElement): void {
    this.container = container;
    this.element = this.render();
    this.container.appendChild(this.element);
    // Apply any data set before mount
    if (this.data) {
      this.updateDisplay();
    }
  }

  setData(data: DataType): void {
    this.data = data;
    this.updateDisplay();
  }

  private updateDisplay(): void {
    if (!this.data) return;
    if (this.someElement) {
      this.someElement.textContent = this.data.value;
    }
  }

  private render(): HTMLElement { /* ... */ }

  show(): void { this.element?.classList.remove('da-component--hidden'); }
  hide(): void { this.element?.classList.add('da-component--hidden'); }
  isVisible(): boolean {
    if (!this.element) return false;
    return !this.element.classList.contains('da-component--hidden');
  }
  getElement(): HTMLElement | null { return this.element; }
  destroy(): void {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    this.container = null;
    this.data = null;
    // Nullify all element refs
  }
}
```

### UX Design Reference

**From ux-design-specification.md - Choice Cards:**

```
Interactive story branching:

┌─────────────────────────────────────────────────────────────────────────────┐
│ [🔧]  Stick with Ripple-Carry                                          [→] │
│       Continue with the working design. It's slower, but reliable.         │
├─────────────────────────────────────────────────────────────────────────────┤
│ [💡]  Investigate Carry Look-Ahead                                     [→] │
│       There must be a way to predict carries. Time to experiment.          │
├─────────────────────────────────────────────────────────────────────────────┤
│ [🗣️]  Ask Dr. Chen for Guidance                                        [→] │
│       She clearly knows something. Ask for a more direct hint.             │
└─────────────────────────────────────────────────────────────────────────────┘

Interactions:
- Hover: Slide right, gold border, background tint
- Click: Navigate to next scene or transition to Lab
```

**Component Specifications:**
| Element | Purpose |
|---------|---------|
| Container | Full-width button, flex layout, hover effects |
| Icon | Emoji/icon on left side (~48px), gold accent |
| Title | Choice title in gold, bold |
| Description | Supporting text in secondary color |
| Arrow | Right arrow indicator (→), gold color |

**Color Variables:**
- `--persona-gold: #d4a574` - Icon, title, arrow, hover border
- `--da-text-secondary: #b0b0b0` - Description text
- `--da-bg-tertiary: rgba(212, 165, 116, 0.1)` - Hover background tint

### Architecture Compliance

**Type Definitions Pattern (add to src/story/types.ts):**
```typescript
/**
 * Represents a choice option in the story.
 */
export interface ChoiceData {
  /** Unique identifier for this choice */
  id: string;
  /** Emoji or icon character for the choice */
  icon: string;
  /** Short title for the choice (e.g., "Investigate Carry Look-Ahead") */
  title: string;
  /** Longer description explaining the choice */
  description: string;
}
```

**ChoiceCard Implementation Pattern:**
```typescript
// src/story/ChoiceCard.ts
import type { ChoiceData } from './types';

/**
 * ChoiceCard displays an interactive story choice in Story Mode.
 * Features hover effects with gold border and slide animation.
 *
 * Layout specification (from UX design):
 * - Container: Full-width button with flex layout
 * - Icon: Emoji on left (gold color)
 * - Content: Title (gold, bold) + Description (secondary)
 * - Arrow: Right arrow indicator
 * - Hover: translateX(8px), gold border, background tint
 */
export class ChoiceCard {
  private element: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private choiceData: ChoiceData | null = null;
  private onSelectCallback: ((choiceId: string) => void) | null = null;

  // Element references for dynamic updates
  private iconElement: HTMLElement | null = null;
  private titleElement: HTMLElement | null = null;
  private descriptionElement: HTMLElement | null = null;

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
    if (this.choiceData) {
      this.updateDisplay();
    }
  }

  onSelect(callback: (choiceId: string) => void): void {
    this.onSelectCallback = callback;
  }

  private handleClick(e: MouseEvent): void {
    if (this.choiceData && this.onSelectCallback) {
      this.onSelectCallback(this.choiceData.id);
    }
  }

  setChoiceData(data: ChoiceData): void {
    this.choiceData = data;
    this.updateDisplay();
  }

  private updateDisplay(): void {
    if (!this.choiceData) return;
    if (this.iconElement) {
      this.iconElement.textContent = this.choiceData.icon;
    }
    if (this.titleElement) {
      this.titleElement.textContent = this.choiceData.title;
    }
    if (this.descriptionElement) {
      this.descriptionElement.textContent = this.choiceData.description;
    }
    if (this.element) {
      this.element.setAttribute('aria-label', `Choice: ${this.choiceData.title}`);
    }
  }

  private render(): HTMLElement {
    const button = document.createElement('button');
    button.className = 'da-choice-card';
    button.setAttribute('type', 'button');
    button.setAttribute('aria-label', 'Story choice');

    // Icon
    const icon = document.createElement('span');
    icon.className = 'da-choice-card-icon';
    icon.textContent = '';
    this.iconElement = icon;

    // Content wrapper
    const content = document.createElement('div');
    content.className = 'da-choice-card-content';

    const title = document.createElement('span');
    title.className = 'da-choice-card-title';
    title.textContent = '';
    this.titleElement = title;

    const description = document.createElement('p');
    description.className = 'da-choice-card-description';
    description.textContent = '';
    this.descriptionElement = description;

    content.appendChild(title);
    content.appendChild(description);

    // Arrow indicator
    const arrow = document.createElement('span');
    arrow.className = 'da-choice-card-arrow';
    arrow.textContent = '→';
    arrow.setAttribute('aria-hidden', 'true');

    // Assemble
    button.appendChild(icon);
    button.appendChild(content);
    button.appendChild(arrow);

    return button;
  }

  show(): void { /* ... */ }
  hide(): void { /* ... */ }
  isVisible(): boolean { /* ... */ }
  getElement(): HTMLElement | null { /* ... */ }
  destroy(): void {
    if (this.element) {
      this.element.removeEventListener('click', this.boundHandleClick);
      this.element.remove();
      this.element = null;
    }
    this.container = null;
    this.choiceData = null;
    this.onSelectCallback = null;
    this.iconElement = null;
    this.titleElement = null;
    this.descriptionElement = null;
  }
}
```

### CSS Requirements

```css
/* Choice Card Component (Story 10.9) */

.da-choice-card {
  display: flex;
  align-items: center;
  width: 100%;
  margin: 0 0 12px;
  padding: 16px 20px;
  background: transparent;
  border: 1px solid var(--story-border, rgba(212, 165, 116, 0.3));
  border-radius: 4px;
  cursor: pointer;
  text-align: left;
  transition: transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
}

.da-choice-card--hidden {
  display: none;
}

.da-choice-card:hover {
  transform: translateX(8px);
  border-color: var(--persona-gold, #d4a574);
  background: rgba(212, 165, 116, 0.1);
}

.da-choice-card:focus {
  outline: 2px solid var(--persona-gold, #d4a574);
  outline-offset: 2px;
}

.da-choice-card-icon {
  flex-shrink: 0;
  font-size: 24px;
  margin-right: 16px;
  color: var(--persona-gold, #d4a574);
}

.da-choice-card-content {
  flex: 1;
  min-width: 0;
}

.da-choice-card-title {
  display: block;
  font-weight: 600;
  font-size: 16px;
  color: var(--persona-gold, #d4a574);
  margin-bottom: 4px;
}

.da-choice-card-description {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--da-text-secondary, #b0b0b0);
}

.da-choice-card-arrow {
  flex-shrink: 0;
  font-size: 20px;
  margin-left: 16px;
  color: var(--persona-gold, #d4a574);
  opacity: 0.5;
  transition: opacity 0.2s ease;
}

.da-choice-card:hover .da-choice-card-arrow {
  opacity: 1;
}
```

### Accessibility Checklist

- [ ] **Semantic HTML** - Uses `<button>` element for interactive card
- [ ] **ARIA Attributes** - `aria-label` describes the choice
- [ ] **Keyboard Navigation** - Button is focusable, Enter/Space activate
- [ ] **Focus Management** - Visible focus ring on `.da-choice-card:focus`
- [ ] **Color Contrast** - Gold on dark meets WCAG AA
- [ ] **XSS Prevention** - Use textContent only, never innerHTML with external data

### Anti-Patterns to Avoid

| Don't | Do |
|-------|-----|
| Use innerHTML for any text content | Use textContent for XSS safety |
| Use `<div>` for clickable elements | Use semantic `<button>` element |
| Skip element reference caching | Cache DOM references for efficient updates |
| Forget pre-mount data handling | Store data and apply after mount |
| Use default exports | Use named exports per project conventions |
| Hardcode gold color | Use `--persona-gold` CSS variable |
| Bind handlers inline | Store bound handlers as class properties |
| Forget to remove event listeners | Remove in destroy() using bound reference |

### Critical Technical Requirements

1. **Follow Existing Patterns** - Match DialogueBlock component structure exactly
2. **Semantic HTML** - Use `<button>` element for interactive card
3. **Event Cleanup** - Store bound click handler, remove in destroy()
4. **Gold Hover Effect** - translateX(8px), gold border, background tint
5. **Keyboard Accessible** - Button naturally supports Enter/Space
6. **XSS Prevention** - Always use textContent, never innerHTML with external data
7. **Named Exports** - Export class and interface using named exports

### Git Intelligence (Recent Commits)

Recent commits show consistent pattern:
- `feat(web): create Dialogue Block component with code review fixes (Story 10.8)`
- `feat(web): create Character Card component with code review fixes (Story 10.7)`

**Commit Pattern:** `feat(web): create [Component Name] with code review fixes (Story X.Y)`

**Files typically modified:**
- `src/story/[ComponentName].ts` - New component
- `src/story/[ComponentName].test.ts` - Tests
- `src/story/types.ts` - Add interface
- `src/story/index.ts` - Add exports
- `src/styles/main.css` - Add CSS

### Project Structure Notes

**Files to create:**
```
digital-archaeology-web/
  src/
    story/
      ChoiceCard.ts       # New component
      ChoiceCard.test.ts  # New tests
```

**Files to modify:**
```
digital-archaeology-web/
  src/
    story/
      types.ts              # Add ChoiceData interface
      index.ts              # Export ChoiceCard, ChoiceData
    styles/
      main.css              # Add choice card CSS (~60 lines)
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 10.9]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Choice Cards]
- [Source: digital-archaeology-web/src/story/DialogueBlock.ts - Component pattern reference]
- [Source: digital-archaeology-web/src/story/types.ts - Interface patterns]
- [Source: _bmad-output/implementation-artifacts/10-8-create-dialogue-block-component.md - Previous story]
- [Source: _bmad-output/project-context.md - Project implementation rules]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None required - clean implementation.

### Completion Notes List

- Implemented ChoiceCard component following DialogueBlock pattern
- Added ChoiceData interface to types.ts with JSDoc comments
- Created ChoiceCard.ts (193 lines) with full lifecycle methods and click handling
- Created ChoiceCard.test.ts (37 tests) covering all acceptance criteria
- Added CSS styling (~66 lines) with gold hover effects and transitions
- All 1665 tests pass, build succeeds
- Component uses textContent for XSS safety
- Uses semantic `<button>` element for accessibility
- Implements bound handler pattern for proper event listener cleanup
- Features gold border, translateX slide effect, and opacity transition on hover

### File List

- `src/story/ChoiceCard.ts` - New component (193 lines)
- `src/story/ChoiceCard.test.ts` - Tests (37 tests)
- `src/story/types.ts` - Added ChoiceData interface
- `src/story/index.ts` - Added exports for ChoiceCard and ChoiceData
- `src/styles/main.css` - Added choice card CSS (~66 lines)

