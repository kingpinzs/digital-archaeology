---
project_name: 'Digital Archaeology'
user_name: 'Jeremy'
date: '2026-01-20'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'code_quality', 'workflow_rules', 'anti_patterns']
status: 'complete'
---

# Project Context for AI Agents

_Critical rules and patterns for implementing code in Digital Archaeology. Focus on unobvious details that agents might miss._

---

## Technology Stack & Versions

| Technology | Version | Notes |
|------------|---------|-------|
| Vite | 7.x | Build tool with vanilla-ts template |
| TypeScript | ES2022+ | esbuild transpilation, tsc for type-checking |
| Tailwind CSS | Latest | PostCSS pipeline, utility-first |
| Monaco Editor | Latest | VS Code's editor engine |
| Emscripten | Latest | C → WebAssembly compilation |
| Vitest | Latest | Vite-native testing (Jest-compatible) |

## Critical Implementation Rules

### TypeScript Rules

- **Strict mode required** - No `any` types without explicit justification
- **Explicit null** - Use `null` for missing values, never `undefined`
- **Type exports** - Export interfaces from module `types.ts` or central `types/index.ts`
- **No default exports** - Use named exports for better tree-shaking
  - *Exception:* Config files (vite.config.ts, tailwind.config.js, postcss.config.js) require default exports per tool conventions

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Class/Component files | PascalCase | `Editor.ts`, `CircuitRenderer.ts` |
| Utility files | camelCase | `store.ts`, `persistence.ts` |
| Test files | Co-located `.test.ts` | `Editor.test.ts` |
| Functions | camelCase | `getState()`, `handleStep()` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_MEMORY_SIZE` |
| CSS variables | `--da-` prefix | `--da-bg-primary` |
| Custom CSS classes | `da-` prefix, kebab-case | `da-panel` |

### WASM/Worker Integration Rules

- **All WASM runs in Web Worker** - Never load WASM on main thread
- **Commands use imperative verbs** - `LOAD_PROGRAM`, `STEP`, `RUN`
- **Events use past tense** - `STATE_UPDATE`, `HALTED`, `BREAKPOINT_HIT`
- **Message types are SCREAMING_SNAKE_CASE**
- **Payload keys are camelCase**

### State Management Rules

- **Max 2 levels of nesting** in state shape
- **Boolean prefixes** - `is` or `has` (e.g., `isRunning`, `hasUnsavedChanges`)
- **Collections use plural nouns** - `breakpoints`, `errors`
- **Always unsubscribe** - Store subscriptions must be cleaned up

### Canvas/Animation Rules

- **NEVER use setInterval** - Always use `requestAnimationFrame`
- **Coordinates** - Origin top-left, y increases downward
- **Gate IDs** - Format `g-{type}-{index}` (e.g., `g-and-017`)
- **Wire IDs** - Format `w-{source}-{target}`
- **Colors via CSS variables** - Never hardcode hex values

### Error Handling Rules

- **Assembly errors** - Include `line`, `column`, `message`, optional `suggestion`
- **Runtime errors** - Include `address`, `instruction`, `context`
- **UI errors** - Transform technical errors before display
- **Always include context** sufficient for debugging

### XSS Prevention Rules

- **ALWAYS escape user content** - Any string that could contain user input must be escaped before setting as HTML
- **Use `escapeHtml()` helper** - Standard pattern for escaping HTML special characters
- **Safe methods** - `textContent` is inherently safe; prefer it for simple text
- **Dangerous methods** - Setting HTML with template literals requires escaping

**The `escapeHtml()` Pattern:**
```typescript
/**
 * Escape HTML special characters to prevent XSS attacks.
 * Use this for ANY user-provided or external content rendered as HTML.
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;  // Browser handles encoding
  return div.outerHTML.slice(5, -6);  // Extract encoded content
}

// Usage: Always escape user-provided strings before HTML rendering
// Safe: element.textContent = userInput;  // No escaping needed
```

**When to Use:**
| Source | Escape Required? |
|--------|-----------------|
| User input (text fields, URL params) | YES |
| External API responses | YES |
| Assembler error messages | YES |
| Instruction text display | YES |
| Hardcoded UI strings | NO |
| Number values (toString) | NO |

### Testing Rules

- **Co-locate tests** with source files as `*.test.ts`
- **Use Vitest** - Jest-compatible API, Vite-native
- **Mock Worker** for emulator tests
- **Mock Canvas context** for visualizer tests

### Event Listener Cleanup Pattern

**CRITICAL:** All event listeners must be removed in `destroy()` to prevent memory leaks.

**The Bound Handler Pattern:**
```typescript
class MyComponent {
  private element: HTMLElement | null = null;

  // 1. Store bound handlers as class properties
  private boundHandleClick: (e: MouseEvent) => void;
  private boundHandleKeydown: (e: KeyboardEvent) => void;

  constructor() {
    // 2. Bind handlers in constructor (not in addEventListener)
    this.boundHandleClick = this.handleClick.bind(this);
    this.boundHandleKeydown = this.handleKeydown.bind(this);
  }

  mount(container: HTMLElement): void {
    this.element = document.createElement('div');
    // 3. Add listeners using bound references
    this.element.addEventListener('click', this.boundHandleClick);
    document.addEventListener('keydown', this.boundHandleKeydown);
    container.appendChild(this.element);
  }

  destroy(): void {
    // 4. Remove listeners using SAME bound references
    this.element?.removeEventListener('click', this.boundHandleClick);
    document.removeEventListener('keydown', this.boundHandleKeydown);
    this.element?.remove();
    this.element = null;
  }

  private handleClick(e: MouseEvent): void { /* ... */ }
  private handleKeydown(e: KeyboardEvent): void { /* ... */ }
}
```

**Key Rules:**
| Rule | Why |
|------|-----|
| Bind in constructor | Same reference for add/remove |
| Store as class property | Accessible in destroy() |
| Remove document listeners | They persist beyond element removal |
| Nullify element refs | Prevents stale references |

**Common Mistakes:**
```typescript
// ❌ WRONG: Creates new function each time, can't be removed
element.addEventListener('click', this.handleClick.bind(this));

// ❌ WRONG: Arrow in addEventListener, no reference to remove
element.addEventListener('click', (e) => this.handleClick(e));

// ✅ CORRECT: Use pre-bound reference
element.addEventListener('click', this.boundHandleClick);
```

### CSS/Theming Rules

- **Tailwind utilities first** - Custom classes only when insufficient
- **Theme via root class** - `<html class="lab-mode">` or `story-mode`
- **All colors as CSS variables** - Enables theme switching
- **Animation classes** use `da-anim-` prefix

### Keyboard Navigation Testing Guide

**Test keyboard accessibility for all interactive components.**

**Creating Keyboard Events:**
```typescript
// Basic key event
const event = new KeyboardEvent('keydown', {
  key: 'Enter',
  bubbles: true,  // Required for event to propagate
});
element.dispatchEvent(event);

// Key with modifiers
const ctrlEvent = new KeyboardEvent('keydown', {
  key: 'z',
  ctrlKey: true,
  bubbles: true,
});
```

**Standard Keys to Test:**

| Key | Common Use | Test Example |
|-----|------------|--------------|
| `Enter` | Activate button/link | `{ key: 'Enter', bubbles: true }` |
| `Space` | Activate button, toggle | `{ key: ' ', bubbles: true }` |
| `Escape` | Close modal/dropdown | `{ key: 'Escape', bubbles: true }` |
| `ArrowRight` | Next item, increase value | `{ key: 'ArrowRight', bubbles: true }` |
| `ArrowLeft` | Previous item, decrease value | `{ key: 'ArrowLeft', bubbles: true }` |
| `ArrowDown` | Next in list, open dropdown | `{ key: 'ArrowDown', bubbles: true }` |
| `ArrowUp` | Previous in list | `{ key: 'ArrowUp', bubbles: true }` |
| `Home` | First item | `{ key: 'Home', bubbles: true }` |
| `End` | Last item | `{ key: 'End', bubbles: true }` |
| `Tab` | Focus next element | Browser handles this |

**Test Pattern Example:**
```typescript
describe('keyboard navigation', () => {
  it('should move focus right on ArrowRight', () => {
    const buttons = container.querySelectorAll('button');
    (buttons[0] as HTMLElement).focus();

    const event = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
    });
    buttons[0].dispatchEvent(event);

    expect(document.activeElement).toBe(buttons[1]);
  });

  it('should close on Escape', () => {
    component.open();

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(event);

    expect(component.isOpen()).toBe(false);
  });

  it('should wrap focus from last to first', () => {
    const buttons = container.querySelectorAll('button');
    const lastButton = buttons[buttons.length - 1] as HTMLElement;
    lastButton.focus();

    const event = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
    });
    lastButton.dispatchEvent(event);

    expect(document.activeElement).toBe(buttons[0]);
  });
});
```

**Checklist for Keyboard Tests:**
- [ ] Enter/Space activates focused element
- [ ] Escape closes modals/dropdowns
- [ ] Arrow keys navigate within component
- [ ] Home/End jump to first/last
- [ ] Focus wraps at boundaries (if applicable)
- [ ] Focus is trapped in modals
- [ ] Focus returns to trigger after close

### Monaco Editor Bundle Optimization

**Current Status:** Monaco adds ~5MB to bundle (1.1MB gzipped). Includes unused language workers.

**Applied Optimizations:**
```typescript
// vite.config.ts
monacoEditorPlugin({
  languageWorkers: ['editorWorkerService'],  // Only base worker
})
```

**Recommended Future Optimizations (when bundle size matters):**

1. **Manual Chunks** - Split Monaco into separate lazy-loaded chunk:
```typescript
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        monaco: ['monaco-editor'],
      },
    },
  },
}
```

2. **Exclude Unused Languages** - Monaco includes 80+ language definitions:
```typescript
// In your editor initialization
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
// Instead of: import * as monaco from 'monaco-editor';
```

3. **Lazy Load Editor** - Only load Monaco when editor panel is visible:
```typescript
const Editor = lazy(() => import('./Editor'));
```

4. **CDN Option** - Load Monaco from CDN for caching:
```typescript
// Use @monaco-editor/loader for CDN loading
```

**Bundle Size Targets:**
| Stage | Target | Notes |
|-------|--------|-------|
| MVP | <2MB gzipped | Acceptable for development |
| Production | <500KB gzipped | Requires aggressive optimization |
| PWA | <200KB initial | Monaco lazy-loaded |

**Current Priority:** LOW - Defer until performance requirements demand it.

## Anti-Patterns to Avoid

| Don't | Do |
|-------|-----|
| `user_state` | `userState` |
| `stateUpdate` event | `STATE_UPDATE` |
| `state.cpu.alu.adder.carry` | `state.cpu.carryFlag` |
| `setInterval(render, 33)` | `requestAnimationFrame(render)` |
| `color: #00ff88` | `color: var(--da-signal-high)` |
| `undefined` for missing | `null` for missing |
| Default exports | Named exports |
| WASM on main thread | WASM in Web Worker |

## Project Structure (Key Paths)

```
src/
├── editor/         # Monaco wrapper, syntax highlighting
├── emulator/       # WASM worker, message protocol
├── visualizer/     # Canvas circuit rendering
├── debugger/       # Step controls, breakpoints
├── state/          # Store, persistence
├── story/          # Story mode components
├── ui/             # Shared UI components
├── types/          # Shared TypeScript types
└── utils/          # Utility functions

public/
├── wasm/           # Compiled WASM + glue code
├── programs/       # Example .asm files
└── circuits/       # Circuit layout JSON
```

## Quick Reference

**Message Protocol Types:**
```typescript
// Main → Worker
type EmulatorCommand =
  | { type: 'LOAD_PROGRAM', payload: Uint8Array }
  | { type: 'STEP' }
  | { type: 'RUN', payload: { speed: number } }
  | { type: 'STOP' }
  | { type: 'RESET' };

// Worker → Main
type EmulatorEvent =
  | { type: 'STATE_UPDATE', payload: CPUState }
  | { type: 'HALTED' }
  | { type: 'ERROR', payload: ErrorInfo };
```

**Store Pattern:**
```typescript
const store = createStore<AppState>(initialState);
const unsubscribe = store.subscribe(state => render(state));
// Always call unsubscribe() on cleanup
```

---

_Generated: 2026-01-20 | Source: architecture.md_
