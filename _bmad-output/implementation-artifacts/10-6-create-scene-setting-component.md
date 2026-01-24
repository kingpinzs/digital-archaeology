# Story 10.6: Create Scene Setting Component

Status: done

---

## Story

As a user,
I want to see scene descriptions,
So that I feel the atmosphere.

## Acceptance Criteria

1. **Given** a scene has a setting description
   **When** I view the scene
   **Then** I see a styled "Setting" box

2. **And** the box has a gold border accent

3. **And** the text is in italics

4. **And** the background has a subtle gradient

## Tasks / Subtasks

- [x] Task 1: Create SceneSetting Component Class (AC: #1)
  - [x] 1.1 Create `src/story/SceneSetting.ts` with class definition
  - [x] 1.2 Add mount/show/hide/destroy lifecycle methods (match ChapterHeader pattern)
  - [x] 1.3 Add getElement() accessor method

- [x] Task 2: Implement render() Method (AC: all)
  - [x] 2.1 Create `<section>` container with `da-scene-setting` class
  - [x] 2.2 Add floating label element with `da-scene-setting-label` class (text: "Setting")
  - [x] 2.3 Add content wrapper with `da-scene-setting-content` class
  - [x] 2.4 Add text element with `da-scene-setting-text` class
  - [x] 2.5 Cache element references for dynamic updates

- [x] Task 3: Create SceneSettingData Interface (AC: all)
  - [x] 3.1 Add `SceneSettingData` interface to `src/story/types.ts`
  - [x] 3.2 Export interface with field: text (setting description)
  - [x] 3.3 Export `SceneSettingData` from `src/story/index.ts`

- [x] Task 4: Add setSettingData() Method (AC: all)
  - [x] 4.1 Add `private settingData: SceneSettingData | null = null` field
  - [x] 4.2 Implement `setSettingData(data: SceneSettingData): void` method
  - [x] 4.3 Update text element using textContent

- [x] Task 5: Add CSS Styling (AC: #2, #3, #4)
  - [x] 5.1 Add `.da-scene-setting` container styling (position relative, padding, margin)
  - [x] 5.2 Add `.da-scene-setting-label` styling (positioned above border, uppercase, gold color)
  - [x] 5.3 Add `.da-scene-setting-content` styling (gold border, background gradient)
  - [x] 5.4 Add `.da-scene-setting-text` styling (italic, serif font, secondary text color)
  - [x] 5.5 Add hidden state class `.da-scene-setting--hidden`

- [x] Task 6: Write Component Tests (AC: all)
  - [x] 6.1 Test component mounts correctly
  - [x] 6.2 Test renders "Setting" label
  - [x] 6.3 Test renders text content area
  - [x] 6.4 Test setSettingData() updates text content
  - [x] 6.5 Test uses semantic `<section>` element
  - [x] 6.6 Test visibility control methods (show/hide/isVisible)
  - [x] 6.7 Test destroy() cleans up resources
  - [x] 6.8 Test setSettingData before mount (edge case)
  - [x] 6.9 Test empty text handling (edge case)

- [x] Task 7: Verify Integration (AC: all)
  - [x] 7.1 Run `npm test` - all tests pass (1567 tests)
  - [x] 7.2 Run `npm run build` - build succeeds
  - [x] 7.3 Manual test: Scene setting displays in Story Mode
  - [x] 7.4 Manual test: Gold border and gradient visible

---

## Dev Notes

### Previous Story Intelligence (Story 10.5)

**Critical Assets Created:**
- `src/story/ChapterHeader.ts` - Component pattern reference
- `src/story/types.ts` - Type definitions with `ChapterData` interface
- Pattern for data interfaces: simple fields, clean JSDoc comments
- Pattern for dynamic updates: cache element references, use textContent (XSS safe)
- Pattern for lifecycle methods: mount/show/hide/destroy/isVisible/getElement

**Code Review Lessons from 10.5:**
- Add input validation for edge cases
- Add edge case tests (empty data, data before mount, invalid inputs)
- Update accessibility checklist when items are complete
- Use textContent, never innerHTML with external data

**Current Component Structure Pattern (from ChapterHeader.ts):**
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

  show(): void { /* ... */ }
  hide(): void { /* ... */ }
  isVisible(): boolean { /* ... */ }
  getElement(): HTMLElement | null { /* ... */ }
  destroy(): void { /* ... */ }
}
```

### UX Design Reference

**From ux-design-specification.md - Scene Setting Box:**
```
Visual container establishing location and atmosphere:
- Label: "Setting" (positioned above border)
- Italic descriptive text
- Background gradient with gold border
```

**Visual Layout Example:**
```
              SETTING
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   The fluorescent lights hum overhead in the cramped office space of       │
│   Fairchild Semiconductor's Building 1. Through the window, you can        │
│   see the orchards that once covered this valley—before Silicon.           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Component Specifications:**
- Container: position relative for floating label
- Label: positioned above top border (absolute positioning with negative top), uppercase, gold color, small font
- Border: 1px solid with gold accent color (--persona-gold: #d4a574)
- Background: subtle gradient (darker at edges, slightly lighter center)
- Text: italic, serif font (Crimson Text), secondary text color
- Padding: comfortable reading space (24-32px)
- Margin: bottom margin for separation from next element

### Architecture Compliance

**Type Definitions Pattern:**
```typescript
// src/story/types.ts - Add this interface
/**
 * Data for a scene setting description.
 */
export interface SceneSettingData {
  /** The scene description text (atmospheric/setting details) */
  text: string;
}
```

**SceneSetting Implementation Pattern:**
```typescript
// src/story/SceneSetting.ts
import type { SceneSettingData } from './types';

/**
 * SceneSetting displays atmospheric scene descriptions.
 * Shows a styled box with "Setting" label, gold border,
 * and italic text with gradient background.
 */
export class SceneSetting {
  private element: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private settingData: SceneSettingData | null = null;

  // Element references for dynamic updates
  private textElement: HTMLElement | null = null;

  mount(container: HTMLElement): void {
    this.container = container;
    this.element = this.render();
    this.container.appendChild(this.element);
  }

  setSettingData(data: SceneSettingData): void {
    this.settingData = data;
    this.updateDisplay();
  }

  private updateDisplay(): void {
    if (!this.settingData) return;
    if (this.textElement) {
      this.textElement.textContent = this.settingData.text;
    }
  }

  private render(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'da-scene-setting';
    section.setAttribute('aria-label', 'Scene setting');

    // Floating label ("Setting")
    const label = document.createElement('span');
    label.className = 'da-scene-setting-label';
    label.textContent = 'Setting';

    // Content wrapper (has the border and gradient)
    const content = document.createElement('div');
    content.className = 'da-scene-setting-content';

    // Setting text (italic description)
    const text = document.createElement('p');
    text.className = 'da-scene-setting-text';
    text.textContent = 'The scene setting will appear here...'; // Default
    this.textElement = text;

    content.appendChild(text);
    section.appendChild(label);
    section.appendChild(content);

    return section;
  }

  // ... lifecycle methods: show, hide, isVisible, getElement, destroy
}
```

### CSS Requirements

```css
/* Scene Setting Component */
.da-scene-setting {
  position: relative;
  margin-bottom: 32px;
}

.da-scene-setting--hidden {
  display: none;
}

.da-scene-setting-label {
  position: absolute;
  top: -10px;
  left: 24px;
  padding: 0 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--persona-gold, #d4a574);
  background: var(--story-bg-deep, #0a0a12); /* Match page background to "cut out" */
  z-index: 1;
}

.da-scene-setting-content {
  border: 1px solid var(--persona-gold, #d4a574);
  border-radius: 4px;
  padding: 24px 32px;
  background: linear-gradient(
    135deg,
    rgba(212, 165, 116, 0.03) 0%,
    rgba(212, 165, 116, 0.08) 50%,
    rgba(212, 165, 116, 0.03) 100%
  );
}

.da-scene-setting-text {
  margin: 0;
  font-family: var(--story-font-narrative, 'Crimson Text', serif);
  font-size: 16px;
  font-style: italic;
  line-height: 1.7;
  color: var(--da-text-secondary, #b0b0b0);
}
```

### Accessibility Checklist

- [x] **Semantic HTML** - Uses `<section>` element with `aria-label="Scene setting"`
- [x] **ARIA Attributes** - Label describes the section purpose
- [N/A] **Keyboard Navigation** - Display-only component
- [N/A] **Focus Management** - No focusable elements
- [N/A] **Color Contrast** - Uses existing verified theme colors
- [x] **XSS Prevention** - Use textContent only, never innerHTML

### Anti-Patterns to Avoid

| Don't | Do |
|-------|-----|
| Use innerHTML for text content | Use textContent for XSS safety |
| Hardcode all values | Create setSettingData() for dynamic updates |
| Use `<div>` for semantic container | Use semantic `<section>` element |
| Skip element caching | Cache DOM references for efficient updates |
| Forget edge case tests | Test empty data, data before mount |

### Critical Technical Requirements

1. **Follow Existing Patterns** - Match ChapterHeader component structure exactly
2. **Semantic HTML** - Use `<section>` element with aria-label
3. **Floating Label** - Position "Setting" label above the border using absolute positioning
4. **Gold Border** - Use `--persona-gold` CSS variable
5. **Gradient Background** - Subtle gold-tinted gradient
6. **Italic Text** - Use font-style: italic with serif font
7. **XSS Prevention** - Always use textContent, never innerHTML

### Project Structure Notes

**Files to create:**
```
digital-archaeology-web/
  src/
    story/
      SceneSetting.ts       # New component
      SceneSetting.test.ts  # New tests
```

**Files to modify:**
```
digital-archaeology-web/
  src/
    story/
      types.ts              # Add SceneSettingData interface
      index.ts              # Export SceneSetting and SceneSettingData
    styles/
      main.css              # Add scene setting CSS
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 10.6]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Scene Setting Box]
- [Source: digital-archaeology-web/src/story/ChapterHeader.ts - Component pattern reference]
- [Source: digital-archaeology-web/src/story/types.ts - Interface patterns]
- [Source: _bmad-output/implementation-artifacts/10-5-create-chapter-header-component.md]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

1. Created `src/story/SceneSetting.ts` - Full component with lifecycle methods matching ChapterHeader pattern
2. Added `SceneSettingData` interface to `src/story/types.ts` with text field for scene descriptions
3. Implemented `setSettingData()` method with textContent for XSS-safe dynamic updates
4. Created comprehensive test suite with 26 tests covering:
   - Component mounting and lifecycle
   - Semantic `<section>` element with aria-label
   - "Setting" label, content wrapper, and text rendering
   - Dynamic updates via setSettingData()
   - Visibility control (show/hide/isVisible)
   - Cleanup on destroy
   - Edge cases: setSettingData before mount, empty text, whitespace preservation
5. Added CSS styling with:
   - Floating "Setting" label positioned above gold border
   - Gold border using --persona-gold CSS variable
   - Subtle gold-tinted gradient background (135deg)
   - Italic serif text (Crimson Text)
6. All 1572 tests pass, build succeeds

### Code Review Fixes Applied

1. **Added test for `<span>` label element verification** - Verifies label uses correct HTML element
2. **Updated types.ts header comment** - Added Story 10.6 to the file header
3. **Added test for `<div>` content wrapper verification** - Verifies content wrapper uses correct HTML element
4. **Added Task 3 describe block** - Organized interface tests in dedicated test block
5. **Added test for destroy() called multiple times** - Documents defensive behavior
6. **Added test for label uppercase CSS class** - Documents CSS styling expectation
7. **Updated test count** - From 21 to 26 tests

### File List

**Created Files:**
- `src/story/SceneSetting.ts` - New component (131 lines)
- `src/story/SceneSetting.test.ts` - Test file (26 tests)

**Modified Files:**
- `src/story/types.ts` - Added SceneSettingData interface, updated header comment
- `src/story/index.ts` - Added SceneSetting and SceneSettingData exports
- `src/styles/main.css` - Added scene setting CSS styling (~50 lines)
