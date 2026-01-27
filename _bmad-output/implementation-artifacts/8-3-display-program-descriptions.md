# Story 8.3: Display Program Descriptions

Status: done

## Story

As a user,
I want to see what each example does,
So that I can choose the right one.

## Acceptance Criteria

1. **Given** I hover over an example in the menu
   **When** the tooltip appears
   **Then** I see a description of the program

2. **And** I see what concepts it demonstrates

3. **And** I see estimated complexity/difficulty

## Tasks / Subtasks

- [x] Task 1: Extend ExampleProgram type with new fields (AC: #2, #3)
  - [x] 1.1: Add `concepts: string[]` field to ExampleProgram interface
  - [x] 1.2: Add `difficulty: 'beginner' | 'intermediate' | 'advanced'` field
  - [x] 1.3: Export `ExampleDifficulty` type from types.ts

- [x] Task 2: Update example metadata with concepts and difficulty (AC: #2, #3)
  - [x] 2.1: Add concepts array to each of the 12 programs in exampleMetadata.ts
  - [x] 2.2: Add difficulty rating to each program
  - [x] 2.3: Update tests for new required fields

- [x] Task 3: Create ExampleTooltip component (AC: #1, #2, #3)
  - [x] 3.1: Create `src/examples/ExampleTooltip.ts` component class
  - [x] 3.2: Render description, concepts list, and difficulty badge
  - [x] 3.3: Position tooltip near hovered item
  - [x] 3.4: Handle mouse enter/leave events
  - [x] 3.5: Add show/hide animation

- [x] Task 4: Integrate tooltip with ExampleBrowser (AC: #1)
  - [x] 4.1: Remove native `title` attribute from menu items
  - [x] 4.2: Add mouseenter/mouseleave handlers to show/hide tooltip
  - [x] 4.3: Track which item is hovered
  - [x] 4.4: Position tooltip relative to hovered item

- [x] Task 5: Add tooltip CSS styles
  - [x] 5.1: Create `.da-example-tooltip` styles in main.css
  - [x] 5.2: Style difficulty badges (beginner=green, intermediate=yellow, advanced=red)
  - [x] 5.3: Style concepts as tags/pills
  - [x] 5.4: Add fade-in/fade-out animation

- [x] Task 6: Write tests
  - [x] 6.1: Update `exampleMetadata.test.ts` for new fields
  - [x] 6.2: Create `ExampleTooltip.test.ts`
  - [x] 6.3: Test tooltip positioning
  - [x] 6.4: Test show/hide on hover
  - [x] 6.5: Update `ExampleBrowser.test.ts` for tooltip integration

## Dev Notes

### Extended ExampleProgram Type

```typescript
// src/examples/types.ts
export type ExampleDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface ExampleProgram {
  filename: string;
  name: string;
  category: ExampleCategory;
  description: string;
  /** Concepts this program demonstrates */
  concepts: string[];
  /** Difficulty level for learners */
  difficulty: ExampleDifficulty;
}

export const DIFFICULTY_LABELS: Record<ExampleDifficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export const DIFFICULTY_COLORS: Record<ExampleDifficulty, string> = {
  beginner: 'var(--da-success)',
  intermediate: 'var(--da-warning)',
  advanced: 'var(--da-error)',
};
```

### Example Metadata Updates

| Program | Concepts | Difficulty |
|---------|----------|------------|
| add.asm | LDA, ADD, STA, memory | beginner |
| countdown.asm | loops, JNZ, decrement | beginner |
| multiply.asm | loops, repeated addition, accumulator | intermediate |
| divide.asm | loops, subtraction, remainder | intermediate |
| negative.asm | two's complement, NOT, increment | intermediate |
| fibonacci.asm | sequences, multiple variables, loops | intermediate |
| max.asm | comparison, conditional jumps, branching | beginner |
| factorial.asm | recursion simulation, multiplication | advanced |
| bubble_sort.asm | arrays, nested loops, swapping | advanced |
| gcd.asm | Euclidean algorithm, modulo | advanced |
| bitwise_test.asm | AND, OR, XOR, NOT, bit manipulation | intermediate |
| all_instructions.asm | complete ISA reference | beginner |

### ExampleTooltip Component Design

```typescript
// src/examples/ExampleTooltip.ts
export class ExampleTooltip {
  private element: HTMLElement | null = null;
  private currentProgram: ExampleProgram | null = null;

  show(program: ExampleProgram, anchorElement: HTMLElement): void;
  hide(): void;
  destroy(): void;
}
```

**Tooltip HTML Structure:**
```html
<div class="da-example-tooltip">
  <div class="da-example-tooltip-header">
    <span class="da-example-tooltip-name">Add Two Numbers</span>
    <span class="da-example-tooltip-difficulty da-difficulty-beginner">Beginner</span>
  </div>
  <p class="da-example-tooltip-description">Add two numbers (5+3=8)</p>
  <div class="da-example-tooltip-concepts">
    <span class="da-example-concept-tag">LDA</span>
    <span class="da-example-concept-tag">ADD</span>
    <span class="da-example-concept-tag">STA</span>
    <span class="da-example-concept-tag">memory</span>
  </div>
</div>
```

### CSS Styling

```css
.da-example-tooltip {
  position: fixed;
  background: var(--da-bg-secondary);
  border: 1px solid var(--da-border);
  border-radius: 6px;
  padding: 12px;
  max-width: 280px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1001;
  opacity: 0;
  transition: opacity 0.15s ease-in-out;
}

.da-example-tooltip--visible {
  opacity: 1;
}

.da-difficulty-beginner { color: var(--da-success); }
.da-difficulty-intermediate { color: var(--da-warning); }
.da-difficulty-advanced { color: var(--da-error); }

.da-example-concept-tag {
  display: inline-block;
  padding: 2px 8px;
  background: var(--da-bg-tertiary);
  border-radius: 4px;
  font-size: 11px;
  margin: 2px;
}
```

### Positioning Logic

```typescript
private positionTooltip(anchorElement: HTMLElement): void {
  const rect = anchorElement.getBoundingClientRect();
  const tooltip = this.element!;

  // Position to the right of the anchor
  let left = rect.right + 8;
  let top = rect.top;

  // If would go off right edge, position to left
  if (left + tooltip.offsetWidth > window.innerWidth) {
    left = rect.left - tooltip.offsetWidth - 8;
  }

  // Keep within vertical bounds
  if (top + tooltip.offsetHeight > window.innerHeight) {
    top = window.innerHeight - tooltip.offsetHeight - 8;
  }

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}
```

### Integration with ExampleBrowser

```typescript
// In ExampleBrowser.ts
private tooltip: ExampleTooltip | null = null;
private hoverTimeout: number | null = null;

private handleItemMouseEnter(item: HTMLElement, program: ExampleProgram): void {
  // Delay tooltip show by 300ms to avoid flicker
  this.hoverTimeout = window.setTimeout(() => {
    if (!this.tooltip) {
      this.tooltip = new ExampleTooltip();
    }
    this.tooltip.show(program, item);
  }, 300);
}

private handleItemMouseLeave(): void {
  if (this.hoverTimeout) {
    clearTimeout(this.hoverTimeout);
    this.hoverTimeout = null;
  }
  this.tooltip?.hide();
}
```

### Accessibility Considerations

- Tooltip content should be accessible via `aria-describedby`
- Use `role="tooltip"` on tooltip element
- Ensure keyboard focus also shows tooltip (not just hover)

### References

- [Source: Story 8.1] - ExampleBrowser base implementation
- [Source: types.ts] - Existing ExampleProgram interface
- [Source: exampleMetadata.ts] - Program data to extend
- [Source: project-context.md#CSS-Theming] - CSS variable usage

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - Clean implementation with no debugging issues.

### Completion Notes List

- **Task 1**: Extended `types.ts` with `ExampleDifficulty` type, added `concepts: string[]` and `difficulty: ExampleDifficulty` fields to `ExampleProgram` interface. Added `DIFFICULTY_LABELS` and `DIFFICULTY_COLORS` constants.
- **Task 2**: Updated all 12 programs in `exampleMetadata.ts` with concepts and difficulty ratings (4 beginner, 5 intermediate, 3 advanced). Added 4 new tests validating concepts array and difficulty fields.
- **Task 3**: Created `ExampleTooltip.ts` component with `show()`, `hide()`, and `destroy()` methods. Renders program name, description, difficulty badge with color coding, and concepts as tags. Uses CSS transitions for fade-in/fade-out animation.
- **Task 4**: Integrated tooltip with `ExampleBrowser.ts`. Removed native `title` attribute, added mouseenter/mouseleave handlers with 300ms delay to avoid flicker. Added focus/blur handlers for keyboard accessibility. Added hover handler cleanup in `destroy()`.
- **Task 5**: Added comprehensive CSS styles in `main.css` including `.da-example-tooltip`, `.da-difficulty-*` color classes, and `.da-example-concept-tag` pill styles.
- **Task 6**: Created 19 tests in `ExampleTooltip.test.ts` covering show/hide, content rendering, difficulty levels, XSS prevention. Updated `exampleMetadata.test.ts` with 4 new tests. Updated `ExampleBrowser.test.ts` with 7 tooltip integration tests.

### Code Review Fixes Applied

- **[HIGH-1] Accessibility Fix**: Added `id="da-example-tooltip"` to tooltip element for proper `aria-describedby` reference
- **[MEDIUM-1] Accessibility Fix**: Toggle `aria-hidden` attribute when showing/hiding tooltip (was always "true")
- **[MEDIUM-2] Performance Fix**: Cached `getPrograms()` result before loop in `cacheAndSetupItems()` to avoid O(n²) complexity
- **[MEDIUM-3] Test Coverage Fix**: Added test for empty concepts array edge case
- **[MEDIUM-4] Test Coverage Fix**: Added XSS prevention test for description field
- **[LOW-1] Dead Code Fix**: Removed unused `hideTimeout` property from ExampleTooltip class

### File List

**New Files:**
- `digital-archaeology-web/src/examples/ExampleTooltip.ts` - Tooltip component class
- `digital-archaeology-web/src/examples/ExampleTooltip.test.ts` - 23 tests for tooltip (including code review additions)

**Modified Files:**
- `digital-archaeology-web/src/examples/types.ts` - Added ExampleDifficulty type, concepts/difficulty fields, DIFFICULTY_LABELS/COLORS constants
- `digital-archaeology-web/src/examples/exampleMetadata.ts` - Added concepts and difficulty to all 12 programs
- `digital-archaeology-web/src/examples/exampleMetadata.test.ts` - Added 4 tests for new fields
- `digital-archaeology-web/src/examples/ExampleBrowser.ts` - Integrated tooltip with hover handlers, performance fix for getPrograms() caching
- `digital-archaeology-web/src/examples/ExampleBrowser.test.ts` - Added 7 tooltip integration tests
- `digital-archaeology-web/src/examples/index.ts` - Added exports for new types and ExampleTooltip
- `digital-archaeology-web/src/styles/main.css` - Added tooltip CSS styles

