# Story 10.8: Create Dialogue Block Component

Status: done

---

## Story

As a user,
I want to see character dialogue,
So that the story comes alive.

## Acceptance Criteria

1. **Given** a character speaks
   **When** I view the dialogue
   **Then** I see a left border in copper accent

2. **And** I see the speaker name in uppercase

3. **And** I see the dialogue in serif font

4. **And** dialogue is visually distinct from narration

## Tasks / Subtasks

- [x] Task 1: Create DialogueData Interface (AC: all)
  - [x] 1.1 Add `DialogueData` interface to `src/story/types.ts`
  - [x] 1.2 Add fields: speaker (string), text (string)
  - [x] 1.3 Add JSDoc comments describing each field
  - [x] 1.4 Export interface from `src/story/types.ts`
  - [x] 1.5 Export `DialogueData` from `src/story/index.ts`

- [x] Task 2: Create DialogueBlock Component Class (AC: #1)
  - [x] 2.1 Create `src/story/DialogueBlock.ts` with class definition
  - [x] 2.2 Add private fields: element, container, dialogueData
  - [x] 2.3 Add element references: speakerElement, textElement
  - [x] 2.4 Add mount/show/hide/destroy/isVisible/getElement lifecycle methods (match CharacterCard pattern)

- [x] Task 3: Implement render() Method (AC: all)
  - [x] 3.1 Create `<blockquote>` container with `da-dialogue-block` class and `aria-label="Character dialogue"`
  - [x] 3.2 Create speaker name element (`<cite>`) with `da-dialogue-block-speaker` class
  - [x] 3.3 Create dialogue text element (`<p>`) with `da-dialogue-block-text` class
  - [x] 3.4 Cache element references for dynamic updates
  - [x] 3.5 Assemble DOM structure (speaker above text)

- [x] Task 4: Implement setDialogueData() Method (AC: all)
  - [x] 4.1 Add `private dialogueData: DialogueData | null = null` field
  - [x] 4.2 Implement `setDialogueData(data: DialogueData): void` method
  - [x] 4.3 Call updateDisplay() after setting data
  - [x] 4.4 Implement updateDisplay() to update speaker and text using textContent
  - [x] 4.5 Handle setDialogueData before mount (apply after mount)

- [x] Task 5: Add CSS Styling (AC: all)
  - [x] 5.1 Add `.da-dialogue-block` container styling (left border in copper accent, padding-left)
  - [x] 5.2 Add `.da-dialogue-block--hidden` class for visibility control
  - [x] 5.3 Add `.da-dialogue-block-speaker` styling (uppercase, letter-spacing, copper color, small font)
  - [x] 5.4 Add `.da-dialogue-block-text` styling (serif font, secondary color, line-height 1.7)
  - [x] 5.5 Add margin-bottom for spacing between dialogue blocks

- [x] Task 6: Write Component Tests (AC: all)
  - [x] 6.1 Test component mounts correctly
  - [x] 6.2 Test renders `<blockquote>` element with correct class
  - [x] 6.3 Test has aria-label for accessibility
  - [x] 6.4 Test renders speaker with `<cite>` element
  - [x] 6.5 Test renders text with `<p>` element
  - [x] 6.6 Test setDialogueData() updates speaker content
  - [x] 6.7 Test setDialogueData() updates text content
  - [x] 6.8 Test visibility control methods (show/hide/isVisible)
  - [x] 6.9 Test destroy() cleans up resources
  - [x] 6.10 Test setDialogueData before mount (edge case)
  - [x] 6.11 Test destroy() called multiple times
  - [x] 6.12 Test XSS safety - speaker uses textContent
  - [x] 6.13 Test XSS safety - text uses textContent
  - [x] 6.14 Test data update preserves component after remounting data

- [x] Task 7: Verify Integration (AC: all)
  - [x] 7.1 Run `npm test` - all tests pass
  - [x] 7.2 Run `npm run build` - build succeeds
  - [ ] 7.3 Manual test: Dialogue block displays in Story Mode
  - [ ] 7.4 Manual test: Left border appears in copper color
  - [ ] 7.5 Manual test: Speaker name is uppercase
  - [ ] 7.6 Manual test: Dialogue text is in serif font

---

## Dev Notes

### Previous Story Intelligence (Story 10.7)

**Critical Assets Created:**
- `src/story/CharacterCard.ts` - Component pattern reference (225 lines)
- `src/story/types.ts` - Type definitions with `CharacterData`, `CharacterStat` interfaces
- Pattern for data interfaces: simple fields, clean JSDoc comments
- Pattern for dynamic updates: cache element references, use textContent (XSS safe)
- Pattern for lifecycle methods: mount/show/hide/destroy/isVisible/getElement
- Pattern for pre-mount data handling: store data, apply after mount in mount()

**Code Review Lessons from 10.7:**
- Split pre-mount tests into two: one for no-throw, one for data preservation
- Add tests for clearing old data when updating
- Keep documentation line counts accurate
- Always use textContent for XSS safety

**Current Component Structure Pattern (from CharacterCard.ts):**
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

**From ux-design-specification.md - Dialogue Blocks:**

```
Character speech with visual distinction:
- Left border in copper accent color
- Speaker name in uppercase
- Dialogue text in serif font
```

**Visual Design:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ▌ DR. CHEN                                                                  │
│ ▌ "Welcome to Fairchild. I see you've been assigned to my team. The        │
│ ▌  74181 project is behind schedule, and we need fresh perspective."       │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Component Specifications:**
| Element | Purpose |
|---------|---------|
| Left Border | 3-4px solid copper accent (`--persona-copper: #b87333`) |
| Speaker Name | Character name in uppercase, smaller font, copper color |
| Dialogue Text | Serif font, secondary text color, readable line-height |

**Color Variables:**
- `--persona-copper: #b87333` - Dialogue border and speaker name
- `--da-text-secondary: #b0b0b0` - Dialogue text color
- `--story-font-narrative: 'Crimson Text', serif` - Dialogue text font

### Architecture Compliance

**Type Definitions Pattern (add to src/story/types.ts):**
```typescript
/**
 * Represents a line of dialogue from a character.
 */
export interface DialogueData {
  /** The name of the speaker (e.g., "Dr. Chen") */
  speaker: string;
  /** The dialogue text spoken by the character */
  text: string;
}
```

**DialogueBlock Implementation Pattern:**
```typescript
// src/story/DialogueBlock.ts
import type { DialogueData } from './types';

/**
 * DialogueBlock displays character dialogue in Story Mode.
 * Features a copper left border, uppercase speaker name, and serif dialogue text.
 *
 * Layout specification (from UX design):
 * - Container: Left border in copper accent (3-4px)
 * - Speaker: Uppercase, small font, copper color
 * - Text: Serif font, secondary color, line-height 1.7
 */
export class DialogueBlock {
  private element: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private dialogueData: DialogueData | null = null;

  // Element references for dynamic updates
  private speakerElement: HTMLElement | null = null;
  private textElement: HTMLElement | null = null;

  mount(container: HTMLElement): void {
    this.container = container;
    this.element = this.render();
    this.container.appendChild(this.element);
    if (this.dialogueData) {
      this.updateDisplay();
    }
  }

  setDialogueData(data: DialogueData): void {
    this.dialogueData = data;
    this.updateDisplay();
  }

  private updateDisplay(): void {
    if (!this.dialogueData) return;
    if (this.speakerElement) {
      this.speakerElement.textContent = this.dialogueData.speaker;
    }
    if (this.textElement) {
      this.textElement.textContent = this.dialogueData.text;
    }
  }

  private render(): HTMLElement {
    const blockquote = document.createElement('blockquote');
    blockquote.className = 'da-dialogue-block';
    blockquote.setAttribute('aria-label', 'Character dialogue');

    const speaker = document.createElement('cite');
    speaker.className = 'da-dialogue-block-speaker';
    speaker.textContent = 'Speaker Name';
    this.speakerElement = speaker;

    const text = document.createElement('p');
    text.className = 'da-dialogue-block-text';
    text.textContent = 'Dialogue text will appear here...';
    this.textElement = text;

    blockquote.appendChild(speaker);
    blockquote.appendChild(text);

    return blockquote;
  }

  show(): void { /* ... */ }
  hide(): void { /* ... */ }
  isVisible(): boolean { /* ... */ }
  getElement(): HTMLElement | null { /* ... */ }
  destroy(): void { /* ... */ }
}
```

### CSS Requirements

```css
/* Dialogue Block Component (Story 10.8) */

.da-dialogue-block {
  position: relative;
  margin: 0 0 24px;
  padding: 0 0 0 20px;
  border-left: 4px solid var(--persona-copper, #b87333);
  quotes: none;
}

.da-dialogue-block--hidden {
  display: none;
}

.da-dialogue-block-speaker {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 600;
  font-style: normal;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--persona-copper, #b87333);
}

.da-dialogue-block-text {
  margin: 0;
  font-family: var(--story-font-narrative, 'Crimson Text', serif);
  font-size: 16px;
  line-height: 1.7;
  color: var(--da-text-secondary, #b0b0b0);
}
```

### Accessibility Checklist

- [ ] **Semantic HTML** - Uses `<blockquote>` element with `aria-label="Character dialogue"`
- [ ] **ARIA Attributes** - Label describes the component purpose
- [ ] **Speaker Element** - Uses `<cite>` for speaker attribution (semantic for quotation attribution)
- [N/A] **Keyboard Navigation** - Display-only component
- [N/A] **Focus Management** - No focusable elements
- [N/A] **Color Contrast** - Uses existing verified theme colors
- [ ] **XSS Prevention** - Use textContent only, never innerHTML with external data

### Anti-Patterns to Avoid

| Don't | Do |
|-------|-----|
| Use innerHTML for any text content | Use textContent for XSS safety |
| Use `<div>` for dialogue | Use semantic `<blockquote>` element |
| Skip element reference caching | Cache DOM references for efficient updates |
| Forget pre-mount data handling | Store data and apply after mount |
| Use default exports | Use named exports per project conventions |
| Hardcode copper color | Use `--persona-copper` CSS variable |

### Critical Technical Requirements

1. **Follow Existing Patterns** - Match CharacterCard component structure exactly
2. **Semantic HTML** - Use `<blockquote>` element for dialogue, `<cite>` for speaker
3. **Copper Left Border** - Use `--persona-copper` CSS variable for left border
4. **Uppercase Speaker** - Use text-transform: uppercase with letter-spacing
5. **Serif Dialogue Text** - Use `--story-font-narrative` CSS variable
6. **XSS Prevention** - Always use textContent, never innerHTML with external data
7. **Named Exports** - Export class and interface using named exports

### Git Intelligence (Recent Commits)

Recent commits show consistent pattern:
- `feat(web): create Character Card component with code review fixes (Story 10.7)`
- `feat(web): create Scene Setting component with code review fixes (Story 10.6)`

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
      DialogueBlock.ts       # New component
      DialogueBlock.test.ts  # New tests
```

**Files to modify:**
```
digital-archaeology-web/
  src/
    story/
      types.ts              # Add DialogueData interface
      index.ts              # Export DialogueBlock, DialogueData
    styles/
      main.css              # Add dialogue block CSS (~30 lines)
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 10.8]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Dialogue Blocks]
- [Source: digital-archaeology-web/src/story/CharacterCard.ts - Component pattern reference]
- [Source: digital-archaeology-web/src/story/types.ts - Interface patterns]
- [Source: _bmad-output/implementation-artifacts/10-7-create-character-card-component.md - Previous story]
- [Source: _bmad-output/project-context.md - Project implementation rules]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None required - clean implementation.

### Completion Notes List

- Implemented DialogueBlock component following CharacterCard pattern
- Added DialogueData interface to types.ts with JSDoc comments
- Created DialogueBlock.ts (135 lines) with full lifecycle methods
- Created DialogueBlock.test.ts (21 tests) covering all acceptance criteria
- Added CSS styling (~34 lines) with copper accent border and serif font
- All tests pass, build succeeds
- Component uses textContent for XSS safety
- Uses semantic HTML: `<blockquote>` for dialogue, `<cite>` for speaker attribution
- Code review fixes: added isVisible() edge case test, data update preservation test, empty defaults

### File List

- `src/story/DialogueBlock.ts` - New component (135 lines)
- `src/story/DialogueBlock.test.ts` - Tests (21 tests)
- `src/story/types.ts` - Added DialogueData interface
- `src/story/index.ts` - Added exports for DialogueBlock and DialogueData
- `src/styles/main.css` - Added dialogue block CSS (~34 lines)
