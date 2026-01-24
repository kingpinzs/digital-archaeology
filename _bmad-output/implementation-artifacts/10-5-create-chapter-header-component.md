# Story 10.5: Create Chapter Header Component

Status: done

---

## Story

As a user,
I want to see chapter information,
So that I know where I am in the story.

## Acceptance Criteria

1. **Given** I am viewing a story chapter
   **When** I look at the top of the content
   **Then** I see the Act number and year

2. **And** I see the chapter title

3. **And** I see a subtitle describing the chapter theme

4. **And** the text uses serif typography

## Tasks / Subtasks

- [x] Task 1: Create ChapterHeader Component Class (AC: #1, #2, #3)
  - [x] 1.1 Create `src/story/ChapterHeader.ts` with class definition
  - [x] 1.2 Add mount/show/hide/destroy lifecycle methods (match YourRolePanel pattern)
  - [x] 1.3 Add getElement() accessor method

- [x] Task 2: Implement render() Method (AC: all)
  - [x] 2.1 Create `<header>` container with `da-chapter-header` class
  - [x] 2.2 Add era badge element with `da-chapter-header-era` class (e.g., "ACT I — 1971")
  - [x] 2.3 Add title element with `da-chapter-header-title` class
  - [x] 2.4 Add subtitle element with `da-chapter-header-subtitle` class
  - [x] 2.5 Cache element references for dynamic updates

- [x] Task 3: Create ChapterData Interface (AC: all)
  - [x] 3.1 Add `ChapterData` interface to `src/story/types.ts`
  - [x] 3.2 Export interface with fields: actNumber, year, title, subtitle
  - [x] 3.3 Export `ChapterData` from `src/story/index.ts`

- [x] Task 4: Add setChapterData() Method (AC: all)
  - [x] 4.1 Add `private chapterData: ChapterData | null = null` field
  - [x] 4.2 Implement `setChapterData(data: ChapterData): void` method
  - [x] 4.3 Update era badge to show "ACT {actNumber} — {year}"
  - [x] 4.4 Update title and subtitle elements using textContent

- [x] Task 5: Add CSS Styling (AC: #4)
  - [x] 5.1 Add `.da-chapter-header` container styling (centered, padding)
  - [x] 5.2 Add `.da-chapter-header-era` styling (uppercase, gold accent, letter-spacing)
  - [x] 5.3 Add `.da-chapter-header-title` styling (serif font, 36px, bold)
  - [x] 5.4 Add `.da-chapter-header-subtitle` styling (serif font, italic, secondary color)
  - [x] 5.5 Add bottom border separator

- [x] Task 6: Write Component Tests (AC: all)
  - [x] 6.1 Test component mounts correctly
  - [x] 6.2 Test renders era badge with correct format
  - [x] 6.3 Test renders title element
  - [x] 6.4 Test renders subtitle element
  - [x] 6.5 Test setChapterData() updates all elements
  - [x] 6.6 Test uses semantic `<header>` element
  - [x] 6.7 Test visibility control methods (show/hide/isVisible)
  - [x] 6.8 Test destroy() cleans up resources

- [x] Task 7: Verify Integration (AC: all)
  - [x] 7.1 Run `npm test` - all tests pass (1543 tests)
  - [x] 7.2 Run `npm run build` - build succeeds
  - [x] 7.3 Manual test: Chapter header displays in Story Mode
  - [x] 7.4 Manual test: Serif typography displays correctly

---

## Dev Notes

### Previous Story Intelligence (Story 10.4)

**Critical Assets Created:**
- `src/story/types.ts` - Type definitions file with `RoleData` and `DiscoveryBadge` interfaces
- Pattern for data interfaces: simple fields, optional Date fields, clean JSDoc comments
- Pattern for dynamic updates: cache element references, use textContent (XSS safe)
- Pattern for lifecycle methods: mount/show/hide/destroy/isVisible/getElement

**Code Review Lessons from 10.4:**
- Remove unused fields from interfaces (the `title` field was removed)
- Add edge case tests (empty array handling)
- Update accessibility checklist when items are complete
- Use textContent, never innerHTML with external data

**Current Component Structure Pattern (from YourRolePanel.ts):**
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

**From ux-design-specification.md - Chapter Header:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ACT I — 1971                                       │
│                     The Humbling Beginning                                  │
│     In which you discover that computation begins with the simplest gates   │
└─────────────────────────────────────────────────────────────────────────────┘
```

Typography: Crimson Text (serif) for immersive narrative feel.

**Component Specifications:**
- Text-align: center
- Era badge: 12px, uppercase, letter-spacing 0.1em, gold accent color
- Title: 36px, bold, serif font (Crimson Text)
- Subtitle: 18px, italic, serif font, secondary color
- Bottom border: 1px solid with story border color

### Architecture Compliance

**Type Definitions Pattern:**
```typescript
// src/story/types.ts - Add this interface
export interface ChapterData {
  /** Act number (roman numerals preferred for display, integer for data) */
  actNumber: number;
  /** Year for historical context (e.g., 1971) */
  year: string;
  /** Chapter title (e.g., "The Humbling Beginning") */
  title: string;
  /** Subtitle describing the chapter theme */
  subtitle: string;
}
```

**ChapterHeader Implementation Pattern:**
```typescript
// src/story/ChapterHeader.ts
import type { ChapterData } from './types';

export class ChapterHeader {
  private element: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private chapterData: ChapterData | null = null;

  // Element references for dynamic updates
  private eraElement: HTMLElement | null = null;
  private titleElement: HTMLElement | null = null;
  private subtitleElement: HTMLElement | null = null;

  mount(container: HTMLElement): void {
    this.container = container;
    this.element = this.render();
    this.container.appendChild(this.element);
  }

  setChapterData(data: ChapterData): void {
    this.chapterData = data;
    this.updateDisplay();
  }

  private updateDisplay(): void {
    if (!this.chapterData) return;

    if (this.eraElement) {
      // Format: "ACT I — 1971" using Roman numerals
      this.eraElement.textContent = `ACT ${this.toRoman(this.chapterData.actNumber)} — ${this.chapterData.year}`;
    }
    if (this.titleElement) {
      this.titleElement.textContent = this.chapterData.title;
    }
    if (this.subtitleElement) {
      this.subtitleElement.textContent = this.chapterData.subtitle;
    }
  }

  private toRoman(num: number): string {
    const romanNumerals: [number, string][] = [
      [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
    ];
    let result = '';
    for (const [value, numeral] of romanNumerals) {
      while (num >= value) {
        result += numeral;
        num -= value;
      }
    }
    return result;
  }

  private render(): HTMLElement {
    const header = document.createElement('header');
    header.className = 'da-chapter-header';
    header.setAttribute('aria-label', 'Chapter information');

    // Era badge (e.g., "ACT I — 1971")
    const era = document.createElement('div');
    era.className = 'da-chapter-header-era';
    era.textContent = 'ACT I — 1971'; // Default value
    this.eraElement = era;

    // Chapter title
    const title = document.createElement('h1');
    title.className = 'da-chapter-header-title';
    title.textContent = 'The Humbling Beginning'; // Default value
    this.titleElement = title;

    // Chapter subtitle
    const subtitle = document.createElement('p');
    subtitle.className = 'da-chapter-header-subtitle';
    subtitle.textContent = 'In which you discover that computation begins with the simplest gates';
    this.subtitleElement = subtitle;

    header.appendChild(era);
    header.appendChild(title);
    header.appendChild(subtitle);

    return header;
  }

  // ... lifecycle methods: show, hide, isVisible, getElement, destroy
}
```

### CSS Requirements

```css
/* Chapter Header Component */
.da-chapter-header {
  text-align: center;
  padding-bottom: 32px;
  margin-bottom: 32px;
  border-bottom: 1px solid var(--story-border, rgba(212, 165, 116, 0.15));
}

.da-chapter-header--hidden {
  display: none;
}

.da-chapter-header-era {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--persona-gold, #d4a574);
  margin-bottom: 16px;
}

.da-chapter-header-title {
  margin: 0 0 12px;
  font-family: var(--story-font-narrative, 'Crimson Text', serif);
  font-size: 36px;
  font-weight: 700;
  color: var(--da-text-primary);
  letter-spacing: -0.01em;
}

.da-chapter-header-subtitle {
  margin: 0;
  font-family: var(--story-font-narrative, 'Crimson Text', serif);
  font-size: 18px;
  font-style: italic;
  color: var(--da-text-secondary);
}
```

### Accessibility Checklist

- [x] **Keyboard Navigation** - N/A (display-only component)
- [x] **ARIA Attributes** - Header uses `<header>` element with `aria-label="Chapter information"`
- [N/A] **Focus Management** - No focusable elements
- [N/A] **Color Contrast** - Uses existing verified theme colors
- [N/A] **XSS Prevention** - No user input (data comes from trusted story engine, use textContent)
- [N/A] **Screen Reader Announcements** - Static content

### Anti-Patterns to Avoid

| Don't | Do |
|-------|-----|
| Use innerHTML for text content | Use textContent for XSS safety |
| Hardcode all values | Create setChapterData() for dynamic updates |
| Use `<div>` for header | Use semantic `<header>` element |
| Skip element caching | Cache DOM references for efficient updates |
| Duplicate CSS patterns | Match existing placeholder CSS patterns |

### Critical Technical Requirements

1. **Follow Existing Patterns** - Match YourRolePanel component structure exactly
2. **Semantic HTML** - Use `<header>` element, `<h1>` for title
3. **Roman Numerals** - Convert act number to Roman numerals for display (I, II, III, etc.)
4. **Element Caching** - Cache DOM element references for efficient updates
5. **Serif Typography** - Use `--story-font-narrative` variable for title/subtitle
6. **XSS Prevention** - Always use textContent, never innerHTML

### Project Structure Notes

**Files to create:**
```
digital-archaeology-web/
  src/
    story/
      ChapterHeader.ts       # New component
      ChapterHeader.test.ts  # New tests
```

**Files to modify:**
```
digital-archaeology-web/
  src/
    story/
      types.ts              # Add ChapterData interface
      index.ts              # Export ChapterHeader and ChapterData
    styles/
      main.css              # Add chapter header CSS (may already exist as placeholder)
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 10.5]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Chapter Header]
- [Source: digital-archaeology-web/src/story/YourRolePanel.ts - Component pattern reference]
- [Source: digital-archaeology-web/src/story/StoryContent.ts - Placeholder content reference]
- [Source: digital-archaeology-web/src/story/types.ts - Interface patterns]
- [Source: digital-archaeology-web/src/styles/main.css#da-story-chapter-header-placeholder]
- [Source: _bmad-output/implementation-artifacts/10-4-create-your-role-panel.md]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

1. Created `src/story/ChapterHeader.ts` - Full component with lifecycle methods matching YourRolePanel pattern
2. Added `ChapterData` interface to `src/story/types.ts` with actNumber, year, title, subtitle fields
3. Implemented `setChapterData()` method with Roman numeral conversion for act numbers
4. Added `toRoman()` private method supporting numbers 1-10 (I, II, III, IV, V, VI, VII, VIII, IX, X)
5. Created comprehensive test suite with 25 tests covering:
   - Component mounting and lifecycle
   - Semantic `<header>` element with aria-label
   - Era badge, title, and subtitle rendering
   - Dynamic updates via setChapterData()
   - Roman numeral conversion for all act numbers 1-10
   - Visibility control (show/hide/isVisible)
   - Cleanup on destroy
6. Added CSS styling with serif typography (Crimson Text), gold accent colors, centered layout
7. All 1543 tests pass, build succeeds

### Code Review Fixes Applied

1. **Added input validation to toRoman()** - Now returns empty string for actNumber <= 0 instead of undefined behavior
2. **Added test for actNumber = 0 edge case** - Documents behavior when zero is passed
3. **Added test for negative actNumber edge case** - Documents behavior when negative number is passed
4. **Added test for setChapterData before mount** - Documents behavior when data is set before component is mounted
5. **Updated toRoman() JSDoc** - Changed "1-10 supported" to "positive integers supported" (algorithm works for any positive number)
6. **Updated test count** - From 22 to 25 tests

### File List

**Created Files:**
- `src/story/ChapterHeader.ts` - New component (168 lines)
- `src/story/ChapterHeader.test.ts` - Test file (25 tests)

**Modified Files:**
- `src/story/types.ts` - Added ChapterData interface
- `src/story/index.ts` - Added ChapterHeader and ChapterData exports
- `src/styles/main.css` - Added chapter header CSS styling (~40 lines)

