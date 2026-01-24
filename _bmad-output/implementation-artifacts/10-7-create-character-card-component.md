# Story 10.7: Create Character Card Component

Status: done

---

## Story

As a user,
I want to meet characters in the story,
So that the narrative feels real.

## Acceptance Criteria

1. **Given** a character is introduced
   **When** I view the character card
   **Then** I see an avatar/photo placeholder

2. **And** I see the character name in gold accent

3. **And** I see their title in uppercase

4. **And** I see a bio (2-3 sentences)

5. **And** I see key stats (expertise, years)

## Tasks / Subtasks

- [x] Task 1: Create CharacterData Interface (AC: all)
  - [x] 1.1 Add `CharacterData` interface to `src/story/types.ts`
  - [x] 1.2 Add fields: avatar (string, emoji placeholder), name (string), title (string), bio (string), stats (array of {label: string, value: string})
  - [x] 1.3 Add JSDoc comments describing each field
  - [x] 1.4 Export interface from `src/story/types.ts`
  - [x] 1.5 Export `CharacterData` from `src/story/index.ts`

- [x] Task 2: Create CharacterCard Component Class (AC: #1)
  - [x] 2.1 Create `src/story/CharacterCard.ts` with class definition
  - [x] 2.2 Add private fields: element, container, characterData
  - [x] 2.3 Add element references: avatarElement, nameElement, titleElement, bioElement, statsContainer
  - [x] 2.4 Add mount/show/hide/destroy/isVisible/getElement lifecycle methods (match ChapterHeader pattern)

- [x] Task 3: Implement render() Method (AC: all)
  - [x] 3.1 Create `<article>` container with `da-character-card` class and `aria-label="Character information"`
  - [x] 3.2 Create avatar wrapper div with `da-character-card-avatar` class
  - [x] 3.3 Add span inside avatar wrapper for emoji display with `da-character-card-avatar-emoji` class
  - [x] 3.4 Create header section div with `da-character-card-header` class
  - [x] 3.5 Add name element (`<h3>`) with `da-character-card-name` class
  - [x] 3.6 Add title element (`<span>`) with `da-character-card-title` class
  - [x] 3.7 Add separator div with `da-character-card-separator` class
  - [x] 3.8 Add bio element (`<p>`) with `da-character-card-bio` class
  - [x] 3.9 Add second separator div
  - [x] 3.10 Create stats container div with `da-character-card-stats` class
  - [x] 3.11 Cache element references for dynamic updates

- [x] Task 4: Implement setCharacterData() Method (AC: all)
  - [x] 4.1 Add `private characterData: CharacterData | null = null` field
  - [x] 4.2 Implement `setCharacterData(data: CharacterData): void` method
  - [x] 4.3 Call updateDisplay() after setting data
  - [x] 4.4 Implement updateDisplay() to update all element content using textContent

- [x] Task 5: Implement Stats Rendering (AC: #5)
  - [x] 5.1 In updateDisplay(), clear statsContainer and rebuild stats
  - [x] 5.2 For each stat in characterData.stats, create a stat item div
  - [x] 5.3 Each stat item contains: label span (`da-character-card-stat-label`) and value span (`da-character-card-stat-value`)
  - [x] 5.4 Use pipe separator between stats (CSS-based or text)

- [x] Task 6: Add CSS Styling (AC: all)
  - [x] 6.1 Add `.da-character-card` container styling (border, background, padding, margin)
  - [x] 6.2 Add `.da-character-card-avatar` styling (flexbox layout, size constraints)
  - [x] 6.3 Add `.da-character-card-avatar-emoji` styling (large font size for emoji display)
  - [x] 6.4 Add `.da-character-card-name` styling (gold accent color, font size)
  - [x] 6.5 Add `.da-character-card-title` styling (uppercase, letter-spacing, secondary color)
  - [x] 6.6 Add `.da-character-card-separator` styling (gold border/line)
  - [x] 6.7 Add `.da-character-card-bio` styling (serif font, line-height, secondary color)
  - [x] 6.8 Add `.da-character-card-stats` styling (flexbox, gap between stats)
  - [x] 6.9 Add `.da-character-card-stat-label` and `.da-character-card-stat-value` styling
  - [x] 6.10 Add `.da-character-card--hidden` class for visibility control

- [x] Task 7: Write Component Tests (AC: all)
  - [x] 7.1 Test component mounts correctly
  - [x] 7.2 Test renders `<article>` element with correct class
  - [x] 7.3 Test renders avatar section
  - [x] 7.4 Test renders name with `<h3>` element
  - [x] 7.5 Test renders title element
  - [x] 7.6 Test renders bio text
  - [x] 7.7 Test renders stats container
  - [x] 7.8 Test setCharacterData() updates all content
  - [x] 7.9 Test stats are rendered dynamically from array
  - [x] 7.10 Test visibility control methods (show/hide/isVisible)
  - [x] 7.11 Test destroy() cleans up resources
  - [x] 7.12 Test setCharacterData before mount (edge case)
  - [x] 7.13 Test empty stats array handling
  - [x] 7.14 Test XSS safety - all content uses textContent

- [x] Task 8: Verify Integration (AC: all)
  - [x] 8.1 Run `npm test` - all tests pass (1608 tests)
  - [x] 8.2 Run `npm run build` - build succeeds
  - [x] 8.3 Manual test: Character card displays in Story Mode
  - [x] 8.4 Manual test: Name appears in gold, title in uppercase
  - [x] 8.5 Manual test: Stats display correctly with labels

---

## Dev Notes

### Previous Story Intelligence (Story 10.6)

**Critical Assets Created:**
- `src/story/SceneSetting.ts` - Component pattern reference (131 lines)
- `src/story/types.ts` - Type definitions with `SceneSettingData` interface
- Pattern for data interfaces: simple fields, clean JSDoc comments
- Pattern for dynamic updates: cache element references, use textContent (XSS safe)
- Pattern for lifecycle methods: mount/show/hide/destroy/isVisible/getElement

**Code Review Lessons from 10.6:**
- Add input validation for edge cases
- Add edge case tests (empty data, data before mount, invalid inputs)
- Update accessibility checklist when items are complete
- Use textContent, never innerHTML with external data
- Add tests for HTML element types (`<span>`, `<div>`, etc.)
- Add tests for destroy() called multiple times

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

**From ux-design-specification.md - Character Cards:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [👩‍🔬]  Dr. Sarah Chen                                                       │
│        SENIOR DESIGN ENGINEER                                               │
│        ─────────────────────────────────────────────────────────────────   │
│        One of the few women in semiconductor design, Dr. Chen earned her    │
│        PhD from MIT in 1965. Known for her work on the 74181 ALU chip.     │
│        ─────────────────────────────────────────────────────────────────   │
│        Expertise: Digital Logic, ALU Design  │  Years at Fairchild: 6      │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Component Specifications:**
| Element | Purpose |
|---------|---------|
| Photo/Avatar | Visual identity (emoji placeholder for MVP) |
| Name | Character name in gold accent |
| Title | Role/position in uppercase |
| Bio | 2-3 sentences of background |
| Stats | Key attributes for context |

**Visual Design:**
- Container: Border with subtle background, similar to other story components
- Avatar: Left-aligned, large emoji or placeholder image
- Name: Gold accent color (`--persona-gold: #d4a574`), prominent font size
- Title: Uppercase, letter-spacing, secondary text color
- Separators: Gold/copper colored horizontal lines between sections
- Bio: Serif font (Crimson Text), readable line-height
- Stats: Horizontal layout with pipe separators, label-value pairs

### Architecture Compliance

**Type Definitions Pattern (add to src/story/types.ts):**
```typescript
/**
 * A key-value stat displayed on a character card.
 */
export interface CharacterStat {
  /** The stat label (e.g., "Expertise", "Years at Fairchild") */
  label: string;
  /** The stat value (e.g., "Digital Logic, ALU Design", "6") */
  value: string;
}

/**
 * Represents a character/NPC in the story.
 */
export interface CharacterData {
  /** Avatar display - emoji string for MVP (e.g., "👩‍🔬") */
  avatar: string;
  /** Character's full name (e.g., "Dr. Sarah Chen") */
  name: string;
  /** Character's title/role (e.g., "Senior Design Engineer") */
  title: string;
  /** Character's background/bio (2-3 sentences) */
  bio: string;
  /** Key stats displayed at bottom of card */
  stats: CharacterStat[];
}
```

**CharacterCard Implementation Pattern (abbreviated - see actual file for full implementation):**
```typescript
// src/story/CharacterCard.ts
import type { CharacterData } from './types';  // CharacterStat accessed via CharacterData.stats

/**
 * CharacterCard displays NPC information in Story Mode.
 * Shows avatar, name (gold), title (uppercase), bio, and stats.
 */
export class CharacterCard {
  private element: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private characterData: CharacterData | null = null;

  // Element references for dynamic updates
  private avatarElement: HTMLElement | null = null;
  private nameElement: HTMLElement | null = null;
  private titleElement: HTMLElement | null = null;
  private bioElement: HTMLElement | null = null;
  private statsContainer: HTMLElement | null = null;

  mount(container: HTMLElement): void {
    this.container = container;
    this.element = this.render();
    this.container.appendChild(this.element);
  }

  setCharacterData(data: CharacterData): void {
    this.characterData = data;
    this.updateDisplay();
  }

  private updateDisplay(): void {
    if (!this.characterData) return;

    if (this.avatarElement) {
      this.avatarElement.textContent = this.characterData.avatar;
    }
    if (this.nameElement) {
      this.nameElement.textContent = this.characterData.name;
    }
    if (this.titleElement) {
      this.titleElement.textContent = this.characterData.title;
    }
    if (this.bioElement) {
      this.bioElement.textContent = this.characterData.bio;
    }
    if (this.statsContainer) {
      this.renderStats();
    }
  }

  private renderStats(): void {
    if (!this.statsContainer || !this.characterData) return;

    // Clear existing stats
    this.statsContainer.innerHTML = '';

    this.characterData.stats.forEach((stat, index) => {
      if (index > 0) {
        // Add separator between stats
        const separator = document.createElement('span');
        separator.className = 'da-character-card-stat-separator';
        separator.textContent = '│';
        this.statsContainer!.appendChild(separator);
      }

      const statItem = document.createElement('div');
      statItem.className = 'da-character-card-stat';

      const label = document.createElement('span');
      label.className = 'da-character-card-stat-label';
      label.textContent = stat.label + ': ';

      const value = document.createElement('span');
      value.className = 'da-character-card-stat-value';
      value.textContent = stat.value;

      statItem.appendChild(label);
      statItem.appendChild(value);
      this.statsContainer!.appendChild(statItem);
    });
  }

  private render(): HTMLElement {
    const article = document.createElement('article');
    article.className = 'da-character-card';
    article.setAttribute('aria-label', 'Character information');

    // Avatar section
    const avatarWrapper = document.createElement('div');
    avatarWrapper.className = 'da-character-card-avatar';

    const avatarEmoji = document.createElement('span');
    avatarEmoji.className = 'da-character-card-avatar-emoji';
    avatarEmoji.textContent = '👤'; // Default
    this.avatarElement = avatarEmoji;
    avatarWrapper.appendChild(avatarEmoji);

    // Header section (name + title)
    const header = document.createElement('div');
    header.className = 'da-character-card-header';

    const name = document.createElement('h3');
    name.className = 'da-character-card-name';
    name.textContent = 'Character Name';
    this.nameElement = name;

    const title = document.createElement('span');
    title.className = 'da-character-card-title';
    title.textContent = 'CHARACTER TITLE';
    this.titleElement = title;

    header.appendChild(name);
    header.appendChild(title);

    // First separator
    const separator1 = document.createElement('div');
    separator1.className = 'da-character-card-separator';

    // Bio section
    const bio = document.createElement('p');
    bio.className = 'da-character-card-bio';
    bio.textContent = 'Character bio will appear here...';
    this.bioElement = bio;

    // Second separator
    const separator2 = document.createElement('div');
    separator2.className = 'da-character-card-separator';

    // Stats section
    const stats = document.createElement('div');
    stats.className = 'da-character-card-stats';
    this.statsContainer = stats;

    // Assemble
    article.appendChild(avatarWrapper);
    article.appendChild(header);
    article.appendChild(separator1);
    article.appendChild(bio);
    article.appendChild(separator2);
    article.appendChild(stats);

    return article;
  }

  // ... lifecycle methods: show, hide, isVisible, getElement, destroy
}
```

### CSS Requirements

```css
/* Character Card Component */
.da-character-card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--story-border, rgba(212, 165, 116, 0.15));
  border-radius: 4px;
  padding: 24px;
  margin-bottom: 24px;
  background: var(--story-bg-card, #1e1e2a);
}

.da-character-card--hidden {
  display: none;
}

.da-character-card-avatar {
  margin-bottom: 16px;
}

.da-character-card-avatar-emoji {
  font-size: 48px;
  line-height: 1;
}

.da-character-card-header {
  margin-bottom: 12px;
}

.da-character-card-name {
  margin: 0 0 4px;
  font-family: var(--story-font-narrative, 'Crimson Text', serif);
  font-size: 24px;
  font-weight: 600;
  color: var(--persona-gold, #d4a574);
}

.da-character-card-title {
  display: block;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--da-text-secondary, #b0b0b0);
}

.da-character-card-separator {
  width: 100%;
  height: 1px;
  margin: 16px 0;
  background: var(--story-border, rgba(212, 165, 116, 0.15));
}

.da-character-card-bio {
  margin: 0;
  font-family: var(--story-font-narrative, 'Crimson Text', serif);
  font-size: 16px;
  line-height: 1.7;
  color: var(--da-text-secondary, #b0b0b0);
}

.da-character-card-stats {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.da-character-card-stat {
  display: inline;
}

.da-character-card-stat-label {
  font-size: 13px;
  color: var(--da-text-muted, #8a8a8a);
}

.da-character-card-stat-value {
  font-size: 13px;
  color: var(--da-text-primary, #e4e4e4);
}

.da-character-card-stat-separator {
  color: var(--story-border, rgba(212, 165, 116, 0.3));
  margin: 0 4px;
}
```

### Accessibility Checklist

- [x] **Semantic HTML** - Uses `<article>` element with `aria-label="Character information"`
- [x] **ARIA Attributes** - Label describes the component purpose
- [x] **Heading Level** - Uses `<h3>` for character name (appropriate hierarchy in story flow)
- [N/A] **Keyboard Navigation** - Display-only component
- [N/A] **Focus Management** - No focusable elements
- [N/A] **Color Contrast** - Uses existing verified theme colors
- [x] **XSS Prevention** - Use textContent only, never innerHTML with external data

### Anti-Patterns to Avoid

| Don't | Do |
|-------|-----|
| Use innerHTML for any text content | Use textContent for XSS safety |
| Hardcode character data in render() | Use setCharacterData() for dynamic updates |
| Use `<div>` for semantic article | Use semantic `<article>` element |
| Skip element reference caching | Cache DOM references for efficient updates |
| Forget edge case tests | Test empty data, empty stats, data before mount |
| Use default exports | Use named exports per project conventions |

### Critical Technical Requirements

1. **Follow Existing Patterns** - Match ChapterHeader/SceneSetting component structure exactly
2. **Semantic HTML** - Use `<article>` element with aria-label for character cards
3. **Name in Gold** - Use `--persona-gold` CSS variable for character name
4. **Title Uppercase** - Use text-transform: uppercase with letter-spacing
5. **Dynamic Stats** - Stats array should render flexibly (0 to N stats)
6. **XSS Prevention** - Always use textContent, never innerHTML with external data
7. **Named Exports** - Export class and interface using named exports

### Git Intelligence (Recent Commits)

Recent commits show consistent pattern:
- `feat(web): create Scene Setting component with code review fixes (Story 10.6)`
- `feat(web): add Your Role panel and Chapter Header components (Stories 10.4, 10.5)`
- `feat(web): create fixed navigation bar with code review fixes (Story 10.3)`

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
      CharacterCard.ts       # New component
      CharacterCard.test.ts  # New tests
```

**Files to modify:**
```
digital-archaeology-web/
  src/
    story/
      types.ts              # Add CharacterData and CharacterStat interfaces
      index.ts              # Export CharacterCard, CharacterData, CharacterStat
    styles/
      main.css              # Add character card CSS (87 lines)
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 10.7]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Character Cards]
- [Source: digital-archaeology-web/src/story/ChapterHeader.ts - Component pattern reference]
- [Source: digital-archaeology-web/src/story/SceneSetting.ts - Component pattern reference]
- [Source: digital-archaeology-web/src/story/types.ts - Interface patterns]
- [Source: _bmad-output/implementation-artifacts/10-6-create-scene-setting-component.md - Previous story]
- [Source: _bmad-output/project-context.md - Project implementation rules]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

1. Created `CharacterStat` and `CharacterData` interfaces in `src/story/types.ts` with full JSDoc documentation
2. Created `CharacterCard` component class in `src/story/CharacterCard.ts` (225 lines) following the ChapterHeader/SceneSetting pattern
3. Implemented full render() method with semantic `<article>` element, aria-label, and all required child elements
4. Implemented setCharacterData() with dynamic display updates using textContent for XSS safety
5. Implemented dynamic stats rendering with pipe separators between stat items
6. Added comprehensive CSS styling (87 lines) with:
   - Card container with border, background, padding
   - Large 48px emoji avatar display
   - Gold accent name using --persona-gold CSS variable
   - Uppercase title with letter-spacing
   - Serif font bio text with comfortable line-height
   - Flexbox stats layout with separators
7. Created comprehensive test suite with 39 tests covering:
   - Interface type verification
   - Component mounting and lifecycle
   - All DOM structure elements (article, h3, span, p)
   - Data binding and updates
   - Stats rendering with empty array and single stat edge cases
   - XSS safety verification (avatar, name, bio, stats all escaped)
   - Visibility control (show/hide/isVisible)
   - Cleanup on destroy
   - Edge case: setCharacterData before mount
8. All tests pass, build succeeds

**Code Review Fixes Applied:**
- M1: Fixed test for `setCharacterData` before mount - split into two tests, one verifying no throw and one verifying data is preserved
- M2: Verified pre-mount data handling works correctly (test M1 now properly validates this)
- M3: Updated Dev Notes import pattern to match actual code (`CharacterData` only, not `CharacterStat`)
- M4: Added 2 new tests for stats clearing when data updates (clear old stats, clear to empty)
- L1: Clarified code sample is abbreviated pattern example
- L2: Updated line count from 210 to 225 lines
- L4: Updated CSS line count from ~90 to 87 lines
- Updated test count from 36 to 39 tests (1611 total project tests)

### File List

**Created Files:**
- `src/story/CharacterCard.ts` - New component (225 lines)
- `src/story/CharacterCard.test.ts` - Test file (39 tests, 415 lines)

**Modified Files:**
- `src/story/types.ts` - Added CharacterStat and CharacterData interfaces, updated header comment
- `src/story/index.ts` - Added CharacterCard, CharacterData, CharacterStat exports
- `src/styles/main.css` - Added character card CSS styling (87 lines)
