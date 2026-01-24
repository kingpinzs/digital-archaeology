# Story 10.10: Create Technical Note Component

Status: done

---

## Story

As a user,
I want technical concepts explained in story context,
So that I understand the relevance.

## Acceptance Criteria

1. **Given** a technical concept is introduced
   **When** I view the technical note
   **Then** I see a blue-accented box (matching Lab mode)

2. **And** the note is labeled "Technical Note"

3. **And** code elements use monospace font

4. **And** the note bridges narrative and technical content

## Tasks / Subtasks

- [x] Task 1: Create TechnicalNoteData Interface (AC: #1, #2, #4)
  - [x] 1.1 Add `TechnicalNoteData` interface to `src/story/types.ts`
  - [x] 1.2 Add fields: content (string) - the technical explanation text
  - [x] 1.3 Add optional field: codeSnippet (string) - optional inline code example
  - [x] 1.4 Add JSDoc comments describing each field
  - [x] 1.5 Export interface from `src/story/types.ts`
  - [x] 1.6 Export `TechnicalNoteData` from `src/story/index.ts`

- [x] Task 2: Create TechnicalNote Component Class (AC: #1)
  - [x] 2.1 Create `src/story/TechnicalNote.ts` with class definition
  - [x] 2.2 Add private fields: element, container, noteData
  - [x] 2.3 Add element references: contentElement, codeElement (labelElement omitted - static content needs no reference)
  - [x] 2.4 Add mount/show/hide/destroy/isVisible/getElement lifecycle methods (match DialogueBlock pattern)

- [x] Task 3: Implement render() Method (AC: #1, #2, #3)
  - [x] 3.1 Create `<aside>` container with `da-technical-note` class (semantic for supplementary content)
  - [x] 3.2 Add `role="note"` for accessibility
  - [x] 3.3 Create label element (`<span>`) with `da-technical-note-label` class, text "Technical Note"
  - [x] 3.4 Create content element (`<p>`) with `da-technical-note-content` class
  - [x] 3.5 Create optional code element (`<code>`) with `da-technical-note-code` class
  - [x] 3.6 Cache element references for dynamic updates
  - [x] 3.7 Assemble DOM structure (label | content | code if present)

- [x] Task 4: Implement setNoteData() Method (AC: #2, #4)
  - [x] 4.1 Add `private noteData: TechnicalNoteData | null = null` field
  - [x] 4.2 Implement `setNoteData(data: TechnicalNoteData): void` method
  - [x] 4.3 Call updateDisplay() after setting data
  - [x] 4.4 Implement updateDisplay() to update content and code using textContent
  - [x] 4.5 Show/hide code element based on codeSnippet presence
  - [x] 4.6 Handle setNoteData before mount (apply after mount)

- [x] Task 5: Add CSS Styling (AC: #1, #3)
  - [x] 5.1 Add `.da-technical-note` container styling (blue left border, padding, background)
  - [x] 5.2 Add `.da-technical-note--hidden` class for visibility control
  - [x] 5.3 Add `.da-technical-note-label` styling (uppercase, small font, blue color)
  - [x] 5.4 Add `.da-technical-note-content` styling (secondary text color, line-height)
  - [x] 5.5 Add `.da-technical-note-code` styling (monospace font, inline-block, darker bg)
  - [x] 5.6 Use Lab mode blue accent color: var(--da-accent-blue, #4a9eff)

- [x] Task 6: Write Component Tests (AC: all)
  - [x] 6.1 Test component mounts correctly
  - [x] 6.2 Test renders `<aside>` element with correct class
  - [x] 6.3 Test has role="note" for accessibility
  - [x] 6.4 Test renders label with "Technical Note" text
  - [x] 6.5 Test renders content element
  - [x] 6.6 Test renders code element when codeSnippet provided
  - [x] 6.7 Test hides code element when codeSnippet not provided
  - [x] 6.8 Test setNoteData() updates content
  - [x] 6.9 Test setNoteData() updates code when present
  - [x] 6.10 Test visibility control methods (show/hide/isVisible)
  - [x] 6.11 Test isVisible() returns false before mount
  - [x] 6.12 Test destroy() cleans up resources
  - [x] 6.13 Test setNoteData before mount (no throw)
  - [x] 6.14 Test data set before mount displays after mounting
  - [x] 6.15 Test destroy() called multiple times
  - [x] 6.16 Test XSS safety - content uses textContent
  - [x] 6.17 Test XSS safety - code uses textContent
  - [x] 6.18 Test data update preserves component state
  - [x] 6.19 Test semantic accessibility (aside element with role="note")

- [x] Task 7: Verify Integration (AC: all)
  - [x] 7.1 Run `npm test` - all tests pass (1696 tests)
  - [x] 7.2 Run `npm run build` - build succeeds

---

## Dev Notes

### Previous Story Intelligence (Story 10.9)

**Critical Assets Created:**
- `src/story/ChoiceCard.ts` - Component pattern reference (193 lines)
- `src/story/types.ts` - Type definitions with `ChoiceData` interface
- Pattern for data interfaces: simple fields, clean JSDoc comments
- Pattern for dynamic updates: cache element references, use textContent (XSS safe)
- Pattern for lifecycle methods: mount/show/hide/destroy/isVisible/getElement
- Pattern for pre-mount data handling: store data, apply after mount in mount()
- Pattern for empty defaults in render() (empty strings, not placeholder text)

**Code Review Lessons from 10.9:**
- Add tests for keyboard accessibility (button element provides native support)
- Add focus accessibility test
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

**From ux-design-specification.md - Technical Notes:**

```
Bridge between narrative and technical content:
- Blue accent styling (matches Lab mode)
- Monospace font for code elements
- Clear "Technical Note" label
```

**Visual Design:**
- Container: Blue left border (4px), subtle blue background tint
- Label: "TECHNICAL NOTE" in uppercase, blue accent color
- Content: Regular text in secondary color
- Code: Monospace font, darker background, inline-block

**Color Variables:**
- `--da-accent-blue: #4a9eff` - Blue accent (matches Lab mode)
- `--da-text-secondary: #b0b0b0` - Content text
- `--da-bg-tertiary: rgba(74, 158, 255, 0.1)` - Blue background tint

### Architecture Compliance

**Type Definitions Pattern (add to src/story/types.ts):**
```typescript
/**
 * Represents a technical note that bridges narrative and technical content.
 */
export interface TechnicalNoteData {
  /** The explanatory text content */
  content: string;
  /** Optional inline code snippet to display */
  codeSnippet?: string;
}
```

**TechnicalNote Implementation Pattern:**
```typescript
// src/story/TechnicalNote.ts
import type { TechnicalNoteData } from './types';

/**
 * TechnicalNote displays technical explanations in Story Mode.
 * Features blue accent styling matching Lab Mode.
 *
 * Layout specification (from UX design):
 * - Container: Blue left border, subtle background tint
 * - Label: "Technical Note" uppercase, blue color
 * - Content: Secondary color text
 * - Code: Monospace font, darker background (optional)
 */
export class TechnicalNote {
  private element: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private noteData: TechnicalNoteData | null = null;

  // Element references for dynamic updates
  private labelElement: HTMLElement | null = null;
  private contentElement: HTMLElement | null = null;
  private codeElement: HTMLElement | null = null;

  mount(container: HTMLElement): void {
    this.container = container;
    this.element = this.render();
    this.container.appendChild(this.element);
    if (this.noteData) {
      this.updateDisplay();
    }
  }

  setNoteData(data: TechnicalNoteData): void {
    this.noteData = data;
    this.updateDisplay();
  }

  private updateDisplay(): void {
    if (!this.noteData) return;
    if (this.contentElement) {
      this.contentElement.textContent = this.noteData.content;
    }
    if (this.codeElement) {
      if (this.noteData.codeSnippet) {
        this.codeElement.textContent = this.noteData.codeSnippet;
        this.codeElement.style.display = '';
      } else {
        this.codeElement.textContent = '';
        this.codeElement.style.display = 'none';
      }
    }
  }

  private render(): HTMLElement {
    const aside = document.createElement('aside');
    aside.className = 'da-technical-note';
    aside.setAttribute('role', 'note');
    aside.setAttribute('aria-label', 'Technical note');

    // Label
    const label = document.createElement('span');
    label.className = 'da-technical-note-label';
    label.textContent = 'Technical Note';
    this.labelElement = label;

    // Content
    const content = document.createElement('p');
    content.className = 'da-technical-note-content';
    content.textContent = '';
    this.contentElement = content;

    // Code (optional, hidden by default)
    const code = document.createElement('code');
    code.className = 'da-technical-note-code';
    code.textContent = '';
    code.style.display = 'none';
    this.codeElement = code;

    // Assemble
    aside.appendChild(label);
    aside.appendChild(content);
    aside.appendChild(code);

    return aside;
  }

  show(): void { /* ... */ }
  hide(): void { /* ... */ }
  isVisible(): boolean { /* ... */ }
  getElement(): HTMLElement | null { /* ... */ }
  destroy(): void {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    this.container = null;
    this.noteData = null;
    this.labelElement = null;
    this.contentElement = null;
    this.codeElement = null;
  }
}
```

### CSS Requirements

```css
/* Technical Note Component (Story 10.10) */

.da-technical-note {
  margin: 16px 0;
  padding: 16px 20px;
  background: rgba(74, 158, 255, 0.08);
  border-left: 4px solid var(--da-accent-blue, #4a9eff);
  border-radius: 0 4px 4px 0;
}

.da-technical-note--hidden {
  display: none;
}

.da-technical-note-label {
  display: block;
  margin-bottom: 8px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--da-accent-blue, #4a9eff);
}

.da-technical-note-content {
  margin: 0 0 12px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--da-text-secondary, #b0b0b0);
}

.da-technical-note-content:last-child {
  margin-bottom: 0;
}

.da-technical-note-code {
  display: inline-block;
  padding: 4px 8px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 13px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  color: var(--da-text-primary, #e0e0e0);
}
```

### Accessibility Checklist

- [ ] **Semantic HTML** - Uses `<aside>` element for supplementary content
- [ ] **ARIA Attributes** - `role="note"` and `aria-label` for screen readers
- [ ] **Keyboard Navigation** - Element is focusable via tabindex if interactive
- [ ] **Focus Management** - Not interactive, so no focus trap needed
- [ ] **Color Contrast** - Blue on dark meets WCAG AA
- [ ] **XSS Prevention** - Use textContent only, never innerHTML with external data

### Anti-Patterns to Avoid

| Don't | Do |
|-------|-----|
| Use innerHTML for any text content | Use textContent for XSS safety |
| Use `<div>` for semantic supplementary content | Use semantic `<aside>` element |
| Skip element reference caching | Cache DOM references for efficient updates |
| Forget pre-mount data handling | Store data and apply after mount |
| Use default exports | Use named exports per project conventions |
| Hardcode blue color | Use `--da-accent-blue` CSS variable |
| Show empty code element | Hide code element when no codeSnippet |

### Critical Technical Requirements

1. **Follow Existing Patterns** - Match DialogueBlock component structure exactly
2. **Semantic HTML** - Use `<aside>` element with `role="note"`
3. **Blue Accent** - Use Lab mode blue color for bridge between modes
4. **Conditional Code Display** - Show/hide code element based on data
5. **Monospace Code** - Use JetBrains Mono/Fira Code for code snippets
6. **XSS Prevention** - Always use textContent, never innerHTML with external data
7. **Named Exports** - Export class and interface using named exports

### Git Intelligence (Recent Commits)

Recent commits show consistent pattern:
- `fix(web): code review fixes for Choice Card component (Story 10.9)`
- `feat(web): create Choice Card component with code review fixes (Story 10.9)`
- `feat(web): create Dialogue Block component with code review fixes (Story 10.8)`

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
      TechnicalNote.ts       # New component
      TechnicalNote.test.ts  # New tests
```

**Files to modify:**
```
digital-archaeology-web/
  src/
    story/
      types.ts              # Add TechnicalNoteData interface
      index.ts              # Export TechnicalNote, TechnicalNoteData
    styles/
      main.css              # Add technical note CSS (~50 lines)
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 10.10]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Technical Notes]
- [Source: digital-archaeology-web/src/story/DialogueBlock.ts - Component pattern reference]
- [Source: digital-archaeology-web/src/story/types.ts - Interface patterns]
- [Source: _bmad-output/implementation-artifacts/10-9-create-choice-card-component.md - Previous story]
- [Source: _bmad-output/project-context.md - Project implementation rules]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None required - clean implementation.

### Completion Notes List

- Implemented TechnicalNote component following DialogueBlock pattern
- Added TechnicalNoteData interface to types.ts with JSDoc comments
- Created TechnicalNote.ts (151 lines) with full lifecycle methods
- Created TechnicalNote.test.ts (28 tests) covering all acceptance criteria
- Added CSS styling (~45 lines) with blue accent matching Lab Mode
- All 1696 tests pass, build succeeds
- Component uses textContent for XSS safety
- Uses semantic `<aside role="note">` element for accessibility
- Code element is conditionally shown/hidden based on codeSnippet presence
- Blue accent color (#4a9eff) bridges Story Mode and Lab Mode visually

### File List

- `src/story/TechnicalNote.ts` - New component (151 lines)
- `src/story/TechnicalNote.test.ts` - Tests (28 tests)
- `src/story/types.ts` - Added TechnicalNoteData interface
- `src/story/index.ts` - Added exports for TechnicalNote and TechnicalNoteData
- `src/styles/main.css` - Added technical note CSS (~45 lines)

