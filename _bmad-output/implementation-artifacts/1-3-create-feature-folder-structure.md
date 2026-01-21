# Story 1.3: Create Feature Folder Structure

Status: done

---

## Story

As a developer,
I want the project organized by feature folders,
So that code is modular and easy to navigate.

## Acceptance Criteria

1. **Given** the configured Vite project
   **When** I create the folder structure
   **Then** src/ contains folders: editor/, emulator/, visualizer/, debugger/, state/, story/, ui/, types/, utils/
   **And** each folder has an index.ts barrel export file
   **And** public/ contains folders: wasm/, programs/, circuits/, story/
   **And** src/styles/ contains main.css with Tailwind imports
   **And** TypeScript path aliases are configured in tsconfig.json

## Tasks / Subtasks

- [x] Task 1: Create Feature Folders in src/ (AC: #1)
  - [x] 1.1 Create `src/editor/` directory
  - [x] 1.2 Create `src/emulator/` directory
  - [x] 1.3 Create `src/visualizer/` directory
  - [x] 1.4 Create `src/debugger/` directory
  - [x] 1.5 Create `src/state/` directory
  - [x] 1.6 Create `src/story/` directory
  - [x] 1.7 Create `src/ui/` directory
  - [x] 1.8 Create `src/types/` directory
  - [x] 1.9 Create `src/utils/` directory

- [x] Task 2: Create Barrel Export Files (AC: #1)
  - [x] 2.1 Create `src/editor/index.ts` with empty export placeholder
  - [x] 2.2 Create `src/emulator/index.ts` with empty export placeholder
  - [x] 2.3 Create `src/visualizer/index.ts` with empty export placeholder
  - [x] 2.4 Create `src/debugger/index.ts` with empty export placeholder
  - [x] 2.5 Create `src/state/index.ts` with empty export placeholder
  - [x] 2.6 Create `src/story/index.ts` with empty export placeholder
  - [x] 2.7 Create `src/ui/index.ts` with empty export placeholder
  - [x] 2.8 Create `src/types/index.ts` with empty export placeholder
  - [x] 2.9 Create `src/utils/index.ts` with empty export placeholder

- [x] Task 3: Create Public Asset Folders (AC: #1)
  - [x] 3.1 Create `public/wasm/` directory (for compiled WASM + glue code)
  - [x] 3.2 Create `public/programs/` directory (for example .asm files)
  - [x] 3.3 Create `public/circuits/` directory (for circuit layout JSON)
  - [x] 3.4 Create `public/story/` directory (for story mode content JSON)
  - [x] 3.5 Add `.gitkeep` files to empty directories to ensure Git tracking

- [x] Task 4: Configure TypeScript Path Aliases (AC: #1)
  - [x] 4.1 Update tsconfig.json with baseUrl set to "."
  - [x] 4.2 Add path aliases for each feature folder (e.g., "@editor/*": ["src/editor/*"])
  - [x] 4.3 Update vite.config.ts with resolve.alias matching tsconfig paths
  - [x] 4.4 Verify TypeScript recognizes path aliases (no red squiggles in IDE)

- [x] Task 5: Clean Up Boilerplate (AC: #1)
  - [x] 5.1 Remove `src/counter.ts` demo file
  - [x] 5.2 Remove `src/typescript.svg` demo asset
  - [x] 5.3 Update `src/main.ts` to remove demo imports and content
  - [x] 5.4 Replace `src/main.ts` content with minimal application shell placeholder
  - [x] 5.5 Remove `public/vite.svg` demo asset

- [x] Task 6: Validate Structure (AC: #1)
  - [x] 6.1 Run `npm run build` and verify no errors
  - [x] 6.2 Run TypeScript check (`npx tsc --noEmit`) with no errors
  - [x] 6.3 Verify all feature folders have index.ts files
  - [x] 6.4 Verify path aliases work (test import in main.ts)

---

## Dev Notes

### Previous Story Intelligence (Story 1.1 + 1.2)

**Key Learnings from Story 1.1:**
- Project initialized at `digital-archaeology-web/` with Vite 7.2.4 + TypeScript 5.9.3
- Node.js 20.19+ required (enforced via `.nvmrc` and `engines` field)
- tsconfig.json has strict mode enabled per project-context.md requirements
- index.html title updated to "Digital Archaeology - CPU Development Environment"

**Key Learnings from Story 1.2:**
- Tailwind CSS v3.4.19 installed (architecture specifies v3 patterns, not v4)
- vite-plugin-wasm v3.5.0 and vite-plugin-top-level-await v1.6.0 installed
- monaco-editor v0.55.1 installed as regular dependency
- `src/styles/main.css` already exists with Tailwind directives
- tailwind.config.js has custom `da-*` color theme tokens configured
- vite.config.ts exists with WASM plugins configured
- **Orphaned `src/style.css` was deleted** - do NOT recreate it

**Files to Remove (Boilerplate):**
- `src/counter.ts` - Demo counter module
- `src/typescript.svg` - TypeScript logo asset
- `public/vite.svg` - Vite logo asset

**Current src/main.ts imports to remove:**
```typescript
import typescriptLogo from './typescript.svg'
import viteLogo from '/vite.svg'
import { setupCounter } from './counter.ts'
```

### Architecture Requirements

**From architecture.md - Module Architecture: Feature Folders:**

```
src/
├── editor/           # Monaco wrapper, syntax highlighting, assembly language
│   ├── Editor.ts
│   ├── micro4-language.ts
│   └── index.ts
├── emulator/         # WASM worker, message protocol, state bridge
│   ├── worker.ts
│   ├── EmulatorBridge.ts
│   └── index.ts
├── visualizer/       # Canvas circuit rendering, animation, interaction
│   ├── CircuitRenderer.ts
│   ├── GateView.ts
│   ├── AnimationLoop.ts
│   └── index.ts
├── debugger/         # Step controls, breakpoints, state inspection
│   ├── DebugControls.ts
│   ├── RegisterView.ts
│   ├── MemoryView.ts
│   └── index.ts
├── state/            # Store implementation, persistence layer
│   ├── store.ts
│   ├── persistence.ts
│   └── index.ts
├── story/            # Story mode: narrative, characters, choices
│   ├── StoryEngine.ts
│   ├── CharacterCard.ts
│   └── index.ts
├── ui/               # Shared UI: toolbar, panels, theming
│   ├── Toolbar.ts
│   ├── Panel.ts
│   ├── theme.ts
│   └── index.ts
├── types/            # Shared TypeScript types
│   └── index.ts
└── main.ts           # Application entry point
```

**From architecture.md - Public Directory Structure:**

```
public/
├── wasm/
│   ├── micro4-cpu.wasm           # Compiled emulator
│   ├── micro4-cpu.js             # Emscripten glue code
│   ├── micro4-asm.wasm           # Compiled assembler
│   └── micro4-asm.js             # Assembler glue code
├── programs/
│   ├── hello-world.asm           # Example programs
│   ├── add-two-numbers.asm
│   ├── countdown.asm
│   └── fibonacci.asm
├── circuits/
│   └── micro4-circuit.json       # Gate layout data
└── story/
    └── act1/
        ├── chapter1.json         # Story content
        └── characters.json       # NPC definitions
```

### TypeScript Path Alias Configuration

**tsconfig.json additions:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@editor/*": ["src/editor/*"],
      "@emulator/*": ["src/emulator/*"],
      "@visualizer/*": ["src/visualizer/*"],
      "@debugger/*": ["src/debugger/*"],
      "@state/*": ["src/state/*"],
      "@story/*": ["src/story/*"],
      "@ui/*": ["src/ui/*"],
      "@types/*": ["src/types/*"],
      "@utils/*": ["src/utils/*"]
    }
  }
}
```

**vite.config.ts additions:**
```typescript
import { resolve } from 'path';

export default defineConfig({
  // ... existing plugins
  resolve: {
    alias: {
      '@editor': resolve(__dirname, './src/editor'),
      '@emulator': resolve(__dirname, './src/emulator'),
      '@visualizer': resolve(__dirname, './src/visualizer'),
      '@debugger': resolve(__dirname, './src/debugger'),
      '@state': resolve(__dirname, './src/state'),
      '@story': resolve(__dirname, './src/story'),
      '@ui': resolve(__dirname, './src/ui'),
      '@types': resolve(__dirname, './src/types'),
      '@utils': resolve(__dirname, './src/utils'),
    }
  }
});
```

### Barrel Export File Pattern

**Each index.ts should follow this pattern:**
```typescript
// src/editor/index.ts
// Barrel export for editor module
// Exports will be added as components are created

export {};
```

The empty `export {}` ensures the file is a valid ES module without any actual exports yet. This prevents TypeScript errors while maintaining the module structure.

### Minimal main.ts Placeholder

**After cleanup, src/main.ts should contain:**
```typescript
import './styles/main.css';

// Digital Archaeology - CPU Development Environment
// Application shell will be implemented in Story 1.5

const app = document.querySelector<HTMLDivElement>('#app');
if (app) {
  app.innerHTML = `
    <div class="min-h-screen bg-da-bg-primary text-da-text-primary flex items-center justify-center">
      <p class="text-xl">Digital Archaeology - Loading...</p>
    </div>
  `;
}
```

**Note:** The Tailwind classes `bg-da-bg-primary` and `text-da-text-primary` rely on CSS variables that will be defined in Story 1.4. For now, fallback to raw Tailwind classes or test with temporary inline styles.

**Alternative safe placeholder (until Story 1.4):**
```typescript
import './styles/main.css';

// Digital Archaeology - CPU Development Environment
// Application shell will be implemented in Story 1.5

const app = document.querySelector<HTMLDivElement>('#app');
if (app) {
  app.innerHTML = `
    <div class="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <p class="text-xl">Digital Archaeology - Loading...</p>
    </div>
  `;
}
```

### Critical Implementation Rules

**TypeScript (from project-context.md):**
- Strict mode required - No `any` types without explicit justification
- Use `null` for missing values, never `undefined`
- Use named exports (no default exports) for better tree-shaking
- **Exception:** Config files (vite.config.ts, tailwind.config.js, postcss.config.js) require default exports per tool conventions

**Naming Conventions:**
| Element | Convention | Example |
|---------|------------|---------|
| Class/Component files | PascalCase | `Editor.ts`, `CircuitRenderer.ts` |
| Utility files | camelCase | `store.ts`, `persistence.ts` |
| Test files | Co-located `.test.ts` | `Editor.test.ts` |
| Functions | camelCase | `getState()`, `handleStep()` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_MEMORY_SIZE` |
| Directories | lowercase | `editor/`, `emulator/` |

**Barrel Export Rules:**
- Every feature folder MUST have an `index.ts` barrel file
- Barrel files re-export public API of the module
- Use named exports, not default exports
- Empty modules use `export {}` as placeholder

### Project Structure Notes

**Current State (after Story 1.2):**
```
digital-archaeology-web/
├── dist/                  # Build output
├── .gitignore
├── .nvmrc                 # Node v22.12.0
├── index.html
├── node_modules/
├── package.json           # vite ^7.2.4, typescript ~5.9.3
├── package-lock.json
├── postcss.config.js      # PostCSS with Tailwind
├── tailwind.config.js     # Tailwind with da-* tokens
├── vite.config.ts         # Vite with WASM plugins
├── public/
│   └── vite.svg           # TO BE REMOVED
├── src/
│   ├── counter.ts         # TO BE REMOVED
│   ├── main.ts            # TO BE UPDATED
│   ├── styles/
│   │   └── main.css       # Tailwind imports (KEEP)
│   └── typescript.svg     # TO BE REMOVED
└── tsconfig.json          # TO BE UPDATED (add paths)
```

**Target State (after this story):**
```
digital-archaeology-web/
├── dist/
├── .gitignore
├── .nvmrc
├── index.html
├── node_modules/
├── package.json
├── package-lock.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.ts         # UPDATED (add resolve.alias)
├── public/
│   ├── wasm/              # NEW (empty with .gitkeep)
│   ├── programs/          # NEW (empty with .gitkeep)
│   ├── circuits/          # NEW (empty with .gitkeep)
│   └── story/             # NEW (empty with .gitkeep)
├── src/
│   ├── editor/            # NEW
│   │   └── index.ts
│   ├── emulator/          # NEW
│   │   └── index.ts
│   ├── visualizer/        # NEW
│   │   └── index.ts
│   ├── debugger/          # NEW
│   │   └── index.ts
│   ├── state/             # NEW
│   │   └── index.ts
│   ├── story/             # NEW
│   │   └── index.ts
│   ├── ui/                # NEW
│   │   └── index.ts
│   ├── types/             # NEW
│   │   └── index.ts
│   ├── utils/             # NEW
│   │   └── index.ts
│   ├── main.ts            # UPDATED (minimal placeholder)
│   └── styles/
│       └── main.css       # UNCHANGED
└── tsconfig.json          # UPDATED (add baseUrl + paths)
```

### Potential Issues to Watch

1. **Path alias compatibility**: Ensure both tsconfig.json paths AND vite.config.ts resolve.alias are configured for path aliases to work in both TypeScript and Vite
2. **Empty barrel exports**: Use `export {}` pattern to avoid "file is not a module" errors
3. **Git tracking empty directories**: Git doesn't track empty directories - use `.gitkeep` files
4. **Non-null assertion in main.ts**: The `#app` element should exist per index.html; using `if` check is safer than `!` assertion

### Testing Requirements

- Run `npm run build` - must complete without errors
- Run `npx tsc --noEmit` - must pass with no TypeScript errors
- Verify all 9 feature folders exist under src/
- Verify all 9 index.ts barrel files exist
- Verify all 4 public asset folders exist
- Verify path aliases work (test import in main.ts if desired)
- Verify dev server starts: `npm run dev`

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Module Architecture: Feature Folders]
- [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- [Source: _bmad-output/project-context.md#Project Structure (Key Paths)]
- [Source: _bmad-output/project-context.md#TypeScript Rules]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3: Create Feature Folder Structure]
- [Source: _bmad-output/implementation-artifacts/1-1-initialize-vite-project-with-typescript.md]
- [Source: _bmad-output/implementation-artifacts/1-2-configure-build-dependencies.md]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- TypeScript check: `npx tsc --noEmit` - passed with no errors
- Production build: `npm run build` - completed in 581ms (Vite v7.3.1)
- Feature folders verified: 9 directories created in src/
- Barrel exports verified: 9 index.ts files created
- Public asset folders verified: 4 directories with .gitkeep files

### Completion Notes List

- Created all 9 feature folders under src/ (editor, emulator, visualizer, debugger, state, story, ui, types, utils)
- Created barrel export files for each module using `export {}` pattern
- Created 4 public asset folders (wasm, programs, circuits, story) with .gitkeep files
- Configured TypeScript path aliases in tsconfig.json (baseUrl + paths)
- Configured Vite resolve.alias in vite.config.ts to match TypeScript paths
- Removed boilerplate files: counter.ts, typescript.svg, vite.svg
- Updated main.ts with minimal placeholder using safe Tailwind classes (bg-gray-900)
- All builds and TypeScript checks pass successfully

### File List

- `digital-archaeology-web/src/editor/index.ts` - CREATED: Barrel export for editor module
- `digital-archaeology-web/src/emulator/index.ts` - CREATED: Barrel export for emulator module
- `digital-archaeology-web/src/visualizer/index.ts` - CREATED: Barrel export for visualizer module
- `digital-archaeology-web/src/debugger/index.ts` - CREATED: Barrel export for debugger module
- `digital-archaeology-web/src/state/index.ts` - CREATED: Barrel export for state module
- `digital-archaeology-web/src/story/index.ts` - CREATED: Barrel export for story module
- `digital-archaeology-web/src/ui/index.ts` - CREATED: Barrel export for ui module
- `digital-archaeology-web/src/types/index.ts` - CREATED: Barrel export for types module
- `digital-archaeology-web/src/utils/index.ts` - CREATED: Barrel export for utils module
- `digital-archaeology-web/public/wasm/.gitkeep` - CREATED: Git tracking placeholder
- `digital-archaeology-web/public/programs/.gitkeep` - CREATED: Git tracking placeholder
- `digital-archaeology-web/public/circuits/.gitkeep` - CREATED: Git tracking placeholder
- `digital-archaeology-web/public/story/.gitkeep` - CREATED: Git tracking placeholder
- `digital-archaeology-web/tsconfig.json` - MODIFIED: Added baseUrl and paths for path aliases
- `digital-archaeology-web/vite.config.ts` - MODIFIED: Added resolve.alias for path aliases
- `digital-archaeology-web/src/main.ts` - MODIFIED: Replaced boilerplate with minimal placeholder
- `digital-archaeology-web/src/counter.ts` - DELETED: Demo file removed
- `digital-archaeology-web/src/typescript.svg` - DELETED: Demo asset removed
- `digital-archaeology-web/public/vite.svg` - DELETED: Demo asset removed
- `digital-archaeology-web/index.html` - MODIFIED: Removed broken favicon reference, cleaned up duplicate Tailwind classes (code review fix)
- `_bmad-output/project-context.md` - MODIFIED: Added utils/ to project structure (code review fix)

### Change Log

- 2026-01-20: Story implementation complete
  - Created feature folder structure per architecture.md specifications
  - Configured TypeScript and Vite path aliases
  - Removed all boilerplate demo files
  - All acceptance criteria validated and passing
- 2026-01-20: Senior Developer Review - Issues Fixed
  - Fixed broken favicon reference in index.html (HIGH)
  - Added path alias verification import to main.ts (MEDIUM)
  - Updated project-context.md to include utils/ folder (MEDIUM)
  - Removed duplicate Tailwind classes from index.html body (MEDIUM)
  - Updated File List with all modified files (MEDIUM)

---

## Senior Developer Review (AI)

**Reviewer:** Claude Opus 4.5
**Date:** 2026-01-20
**Outcome:** APPROVED (after fixes)

### Issues Found & Resolution

| # | Severity | Issue | Resolution |
|---|----------|-------|------------|
| 1 | HIGH | Broken favicon reference `/vite.svg` in index.html | FIXED: Replaced with placeholder comment |
| 2 | MEDIUM | Task 6.4 path alias verification not evidenced | FIXED: Added `@state/index` import to main.ts |
| 3 | MEDIUM | Missing `utils/` in project-context.md | FIXED: Added to Project Structure section |
| 4 | MEDIUM | Duplicate Tailwind classes in index.html + main.ts | FIXED: Removed from index.html body |
| 5 | MEDIUM | File List incomplete (missing index.html) | FIXED: Added to File List |
| 6 | LOW | Barrel export comment inconsistency | NOTED: Minor, not blocking |
| 7 | LOW | `__dirname` usage in vite.config.ts | NOTED: Works now, consider migration later |

### Acceptance Criteria Validation

| AC | Requirement | Status |
|----|-------------|--------|
| 1.1 | src/ contains 9 feature folders | ✅ PASS |
| 1.2 | Each folder has index.ts barrel export | ✅ PASS |
| 1.3 | public/ contains 4 asset folders | ✅ PASS |
| 1.4 | src/styles/ contains main.css | ✅ PASS |
| 1.5 | TypeScript path aliases configured | ✅ PASS (verified via import) |

### Code Quality Assessment

- ✅ All ACs implemented and verified
- ✅ Build passes (`npm run build` - 488ms)
- ✅ TypeScript check passes (`npx tsc --noEmit`)
- ✅ Path aliases verified working via actual import
- ✅ File List matches git reality
- ⚠️ LOW issues noted but not blocking

### Recommendation

Story approved for completion. All HIGH and MEDIUM issues resolved.
