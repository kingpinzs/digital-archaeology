# Story 8.1: Create Example Browser

Status: done

## Story

As a user,
I want to browse example programs,
So that I can find programs to learn from.

## Acceptance Criteria

1. **Given** I click File > Examples
   **When** the submenu opens
   **Then** I see a list of example programs

2. **And** each shows the program name

3. **And** programs are categorized (arithmetic, loops, etc.)

4. **And** clicking a program loads it

## Tasks / Subtasks

- [x] Task 1: Create ExampleProgram type and example metadata (AC: #1, #2, #3)
  - [x] 1.1: Create `src/examples/types.ts` with `ExampleProgram` interface
  - [x] 1.2: Create `src/examples/exampleMetadata.ts` with program list and categories
  - [x] 1.3: Define categories based on existing programs (arithmetic, loops, algorithms, bitwise)

- [x] Task 2: Create ExampleBrowser component (AC: #1, #2, #3)
  - [x] 2.1: Create `src/examples/ExampleBrowser.ts` component class
  - [x] 2.2: Implement categorized submenu structure with program names
  - [x] 2.3: Add keyboard navigation (arrow keys, Enter, Escape)
  - [x] 2.4: Implement proper ARIA attributes for accessibility

- [x] Task 3: Integrate with MenuBar (AC: #1, #4)
  - [x] 3.1: Add "Examples" menu item to File menu in `MENU_STRUCTURE`
  - [x] 3.2: Add `onFileExamples` callback to `MenuBarCallbacks` interface
  - [x] 3.3: Wire up callback in MenuBar click handlers
  - [x] 3.4: Implement submenu positioning and display

- [x] Task 4: Implement program loading (AC: #4)
  - [x] 4.1: Create `src/examples/ExampleLoader.ts` to fetch .asm files
  - [x] 4.2: Wire ExampleBrowser selection to Editor content update
  - [x] 4.3: Handle unsaved work confirmation before loading (use existing pattern)

- [x] Task 5: Write tests
  - [x] 5.1: Create `src/examples/ExampleBrowser.test.ts`
  - [x] 5.2: Test category grouping and program listing
  - [x] 5.3: Test keyboard navigation
  - [x] 5.4: Test program selection callback
  - [x] 5.5: Create `src/examples/ExampleLoader.test.ts`

## Dev Notes

### Existing Example Programs (12 files in `/programs/`)

| File | Category | Description |
|------|----------|-------------|
| `add.asm` | arithmetic | Add two numbers (5+3=8) |
| `countdown.asm` | loops | Count down from N to 0 |
| `fibonacci.asm` | algorithms | Generate Fibonacci sequence |
| `max.asm` | algorithms | Find maximum of two numbers |
| `multiply.asm` | arithmetic | Multiply via repeated addition |
| `bitwise_test.asm` | bitwise | Test AND, OR, XOR, NOT |
| `factorial.asm` | algorithms | Calculate factorial |
| `bubble_sort.asm` | algorithms | Sort array using bubble sort |
| `gcd.asm` | algorithms | Greatest common divisor |
| `divide.asm` | arithmetic | Integer division |
| `negative.asm` | arithmetic | Two's complement negation |
| `all_instructions.asm` | reference | All Micro4 instructions demo |

### Category Structure

```typescript
type ExampleCategory = 'arithmetic' | 'loops' | 'algorithms' | 'bitwise' | 'reference';
```

### Architecture Compliance

**File Structure** (per architecture.md):
```
src/
  examples/
    types.ts           # ExampleProgram, ExampleCategory types
    exampleMetadata.ts # Static program metadata array
    ExampleBrowser.ts  # Submenu component (PascalCase)
    ExampleLoader.ts   # Async file loader (PascalCase)
    index.ts           # Module exports
    ExampleBrowser.test.ts
    ExampleLoader.test.ts
```

**Naming Conventions**:
- Component files: PascalCase (`ExampleBrowser.ts`)
- Type files: camelCase (`types.ts`)
- Constants: SCREAMING_SNAKE_CASE (`EXAMPLE_CATEGORIES`)
- CSS classes: `da-` prefix, kebab-case (`da-example-submenu`)

### MenuBar Integration Pattern

Reference: `src/ui/MenuBar.ts`

**Add to MENU_STRUCTURE.file array:**
```typescript
{ id: 'examples', label: 'Examples', hasSubmenu: true },
```

**Add to MenuBarCallbacks interface:**
```typescript
onFileExamples: () => void;
```

**Submenu Pattern:**
- Follows existing dropdown pattern but with nested categories
- Each category is a section header (not clickable)
- Programs listed under categories with click handlers

### Type Definitions

```typescript
// src/examples/types.ts
export type ExampleCategory = 'arithmetic' | 'loops' | 'algorithms' | 'bitwise' | 'reference';

export interface ExampleProgram {
  /** Filename without path (e.g., "add.asm") */
  filename: string;
  /** Display name (e.g., "Add Two Numbers") */
  name: string;
  /** Category for grouping */
  category: ExampleCategory;
  /** Brief description shown in tooltip */
  description: string;
}

export interface ExampleBrowserCallbacks {
  onSelect: (program: ExampleProgram) => void;
  onClose: () => void;
}
```

### ExampleLoader Implementation

```typescript
// src/examples/ExampleLoader.ts
const PROGRAMS_PATH = '/programs/';

export async function loadExampleProgram(filename: string): Promise<string> {
  const response = await fetch(`${PROGRAMS_PATH}${filename}`);
  if (!response.ok) {
    throw new Error(`Failed to load example: ${filename}`);
  }
  return response.text();
}
```

### Keyboard Navigation Requirements

| Key | Action |
|-----|--------|
| `ArrowDown` | Next item |
| `ArrowUp` | Previous item |
| `Home` | Jump to first item |
| `End` | Jump to last item |
| `Enter` / `Space` | Select program |
| `Escape` | Close submenu |

> **Note:** ArrowLeft/ArrowRight are not implemented as the menu uses a flat list design with sticky category headers, not a nested hierarchy.

### CSS Variables (from theme.ts)

Use existing theme variables:
- `--da-bg-secondary` for submenu background
- `--da-text-primary` for program names
- `--da-text-secondary` for category headers
- `--da-accent` for hover state
- `--da-border` for separators

### XSS Prevention

Program names from metadata are hardcoded strings, but if displaying any dynamic content:
```typescript
import { escapeHtml } from '../utils/escapeHtml';
```

### Testing Patterns

Use existing test utilities from `src/test-utils/`:
```typescript
import { createTestContainer } from '../test-utils';
```

Mock fetch for ExampleLoader tests:
```typescript
vi.stubGlobal('fetch', vi.fn());
```

### Accessibility Checklist

- [x] **Keyboard Navigation** - ArrowUp/Down, Home/End, Enter/Space, Escape supported
- [x] **ARIA Attributes**
  - [x] `role="menu"` on submenu container
  - [x] `role="menuitem"` on program items
  - [x] `aria-haspopup="true"` on Examples menu item
  - [ ] `aria-expanded` - N/A (browser is separate component, not true submenu)
- [x] **Focus Management** - Focus first item on open, return focus on close
- [ ] N/A **Color Contrast** - Using existing theme variables
- [ ] N/A **XSS Prevention** - Static hardcoded strings only

### Project Structure Notes

- New `src/examples/` feature folder follows architecture pattern
- Integrates with existing `src/ui/MenuBar.ts` callbacks pattern
- Uses existing CSS variable system for theming
- Follows established test co-location pattern

### References

- [Source: architecture.md#Module-Architecture] - Feature folder pattern
- [Source: architecture.md#Implementation-Patterns] - Naming conventions
- [Source: project-context.md#Naming-Conventions] - CSS class naming
- [Source: project-context.md#Event-Listener-Cleanup] - Bound handler pattern
- [Source: MenuBar.ts:82-124] - MENU_STRUCTURE pattern
- [Source: MenuBar.ts:33-66] - MenuBarCallbacks interface
- [Source: MenuBar.ts:591-654] - createDropdown pattern for submenu reference

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - Clean implementation with no debugging issues.

### Completion Notes List

- **Task 1**: Created `src/examples/types.ts` with `ExampleCategory`, `ExampleProgram`, `ExampleBrowserCallbacks` types and `CATEGORY_LABELS`/`CATEGORY_ORDER` constants. Created `src/examples/exampleMetadata.ts` with all 12 programs categorized (4 arithmetic, 1 loops, 5 algorithms, 1 bitwise, 1 reference).
- **Task 2**: Created `ExampleBrowser.ts` component with categorized submenu, keyboard navigation (ArrowDown/Up, Home/End, Enter/Space, Escape), and full ARIA accessibility (`role="menu"`, `role="menuitem"`, `aria-label`).
- **Task 3**: Added "Examples..." menu item to File menu in MenuBar.ts MENU_STRUCTURE with `hasSubmenu: true` for `aria-haspopup`, added `onFileExamples` callback to MenuBarCallbacks interface, wired click handler.
- **Task 4**: Created `ExampleLoader.ts` with `loadExampleProgram()` and `checkProgramExists()` functions. Integrated into App.ts with `showExampleBrowser()`, `hideExampleBrowser()`, `handleExampleSelect()` methods. Added unsaved work confirmation dialog.
- **Task 5**: Created comprehensive tests - 10 tests for exampleMetadata, 27 tests for ExampleBrowser (including document click and focus management), 7 tests for ExampleLoader. All 44 tests pass.

### Code Review Fixes Applied

- **[HIGH] Task 4.3 Fix**: Added unsaved work confirmation dialog in `handleExampleSelect()` - shows `window.confirm()` when editor has content
- **[HIGH] Accessibility Fix**: Added `aria-haspopup="true"` to Examples menu item via new `hasSubmenu` property on MenuItem interface
- **[HIGH] Keyboard Nav Fix**: Updated story to reflect actual design (flat list, not nested hierarchy) - Home/End supported, ArrowLeft/Right not applicable
- **[MEDIUM] Memory Leak Fix**: Added `itemClickHandlers` Map to track and clean up click handlers in `destroy()`
- **[MEDIUM] Focus Management Fix**: Added `previousActiveElement` tracking to restore focus on browser close
- **[MEDIUM] Test Coverage Fix**: Added 4 new tests for document click close behavior and focus restoration
- **[LOW] CSS Fix**: Moved inline positioning styles to `.da-example-browser-container` class in main.css

### File List

**New Files:**
- `digital-archaeology-web/src/examples/types.ts`
- `digital-archaeology-web/src/examples/exampleMetadata.ts`
- `digital-archaeology-web/src/examples/exampleMetadata.test.ts`
- `digital-archaeology-web/src/examples/ExampleBrowser.ts`
- `digital-archaeology-web/src/examples/ExampleBrowser.test.ts`
- `digital-archaeology-web/src/examples/ExampleLoader.ts`
- `digital-archaeology-web/src/examples/ExampleLoader.test.ts`
- `digital-archaeology-web/src/examples/index.ts`

**Modified Files:**
- `digital-archaeology-web/src/ui/MenuBar.ts` - Added Examples menu item and callback
- `digital-archaeology-web/src/ui/MenuBar.test.ts` - Added onFileExamples mock
- `digital-archaeology-web/src/ui/App.ts` - Added ExampleBrowser integration
- `digital-archaeology-web/src/styles/main.css` - Added example browser CSS
- `digital-archaeology-web/tsconfig.json` - Added @examples path alias
- `digital-archaeology-web/vite.aliases.ts` - Added @examples alias

