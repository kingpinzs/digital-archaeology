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

### Testing Rules

- **Co-locate tests** with source files as `*.test.ts`
- **Use Vitest** - Jest-compatible API, Vite-native
- **Mock Worker** for emulator tests
- **Mock Canvas context** for visualizer tests

### CSS/Theming Rules

- **Tailwind utilities first** - Custom classes only when insufficient
- **Theme via root class** - `<html class="lab-mode">` or `story-mode`
- **All colors as CSS variables** - Enables theme switching
- **Animation classes** use `da-anim-` prefix

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
