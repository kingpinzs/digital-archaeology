# Story 1.2: Configure Build Dependencies

Status: done

---

## Story

As a developer,
I want all required dependencies installed and configured,
So that I can use WASM, Tailwind, and Monaco in my application.

## Acceptance Criteria

1. **Given** the initialized Vite project
   **When** I install and configure dependencies
   **Then** tailwindcss, postcss, and autoprefixer are installed
   **And** vite-plugin-wasm and vite-plugin-top-level-await are installed
   **And** monaco-editor is installed
   **And** vite.config.ts includes WASM plugins
   **And** tailwind.config.js is created with custom theme tokens
   **And** postcss.config.js is configured
   **And** the build completes without errors

## Tasks / Subtasks

- [x] Task 1: Install Tailwind CSS Dependencies (AC: #1)
  - [x] 1.1 Install tailwindcss, postcss, autoprefixer as dev dependencies
  - [x] 1.2 Run `npx tailwindcss init -p` to generate configs
  - [x] 1.3 Verify postcss.config.js was created with tailwindcss plugin

- [x] Task 2: Configure Tailwind with Custom Theme Tokens (AC: #1)
  - [x] 2.1 Update tailwind.config.js with content paths for `./index.html` and `./src/**/*.{ts,tsx,js,jsx}`
  - [x] 2.2 Add custom theme tokens extending default theme (colors for --da-* CSS variables)
  - [x] 2.3 Create `src/styles/main.css` with Tailwind directives (@tailwind base, components, utilities)
  - [x] 2.4 Import `main.css` in `src/main.ts`

- [x] Task 3: Install WASM Plugins (AC: #1)
  - [x] 3.1 Install vite-plugin-wasm as dev dependency
  - [x] 3.2 Install vite-plugin-top-level-await as dev dependency

- [x] Task 4: Create and Configure vite.config.ts (AC: #1)
  - [x] 4.1 Create vite.config.ts file (does not exist yet)
  - [x] 4.2 Import and configure wasm plugin from vite-plugin-wasm
  - [x] 4.3 Import and configure topLevelAwait plugin from vite-plugin-top-level-await
  - [x] 4.4 Configure plugins array with both WASM plugins

- [x] Task 5: Install Monaco Editor (AC: #1)
  - [x] 5.1 Install monaco-editor as regular dependency
  - [x] 5.2 Verify monaco-editor is listed in package.json dependencies

- [x] Task 6: Validate Build and Configuration (AC: #1)
  - [x] 6.1 Run `npm run build` and verify no errors
  - [x] 6.2 Run `npm run dev` and verify dev server starts
  - [x] 6.3 Verify Tailwind CSS is processing (test with a Tailwind class)

---

## Dev Notes

### Previous Story Intelligence (Story 1.1)

**Key Learnings:**
- Project initialized at `digital-archaeology-web/` with Vite 7.2.4 + TypeScript 5.9.3
- Node.js 20.19+ required (enforced via `.nvmrc` and `engines` field)
- tsconfig.json has strict mode enabled (per project-context.md requirements)
- Current package.json is minimal with only vite and typescript as devDependencies
- The `vite.config.ts` file does NOT exist yet - must be created

**Files Created in Story 1.1:**
- `digital-archaeology-web/package.json` - Base Vite config
- `digital-archaeology-web/tsconfig.json` - TypeScript strict mode
- `digital-archaeology-web/.nvmrc` - Node v22.12.0 requirement
- `digital-archaeology-web/index.html` - Entry point
- `digital-archaeology-web/src/main.ts` - Main entry (boilerplate)

### Architecture Requirements

**From architecture.md - Selected Dependencies:**
```bash
npm install -D tailwindcss postcss autoprefixer
npm install -D vite-plugin-wasm vite-plugin-top-level-await
npm install monaco-editor
npx tailwindcss init -p
```

**From architecture.md - vite.config.ts Pattern:**
The vite.config.ts must include:
- vite-plugin-wasm for WebAssembly support
- vite-plugin-top-level-await for async WASM loading

**CSS/Theming Rules (from project-context.md):**
- CSS variables use `--da-` prefix (e.g., `--da-bg-primary`)
- Custom CSS classes use `da-` prefix, kebab-case (e.g., `da-panel`)
- Theme switching via class on `<html>` element: `lab-mode` or `story-mode`
- All colors as CSS variables for theme switching support
- Tailwind utilities first - custom classes only when insufficient

### Tailwind Configuration Requirements

**Content Paths:**
```javascript
content: [
  "./index.html",
  "./src/**/*.{ts,tsx,js,jsx}"
]
```

**Theme Token Extensions (from architecture.md):**
```javascript
theme: {
  extend: {
    colors: {
      'da-bg-primary': 'var(--da-bg-primary)',
      'da-accent': 'var(--da-accent)',
      'da-signal-high': 'var(--da-signal-high)',
    }
  }
}
```

### Vite Config Pattern

**Required vite.config.ts structure:**
```typescript
import { defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
  plugins: [
    wasm(),
    topLevelAwait()
  ]
});
```

### CSS Structure

**src/styles/main.css should contain:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* CSS custom properties will be added in Story 1.4 */
```

### Project Structure Notes

**Current State (after Story 1.1):**
```
digital-archaeology-web/
├── dist/                  # Build output (from test build)
├── .gitignore
├── .nvmrc                 # Node v22.12.0
├── index.html
├── node_modules/
├── package.json           # vite ^7.2.4, typescript ~5.9.3
├── package-lock.json
├── public/
│   └── vite.svg
├── src/
│   ├── counter.ts         # Demo (will be replaced)
│   ├── main.ts            # Entry point
│   ├── style.css          # Demo styles (will be replaced)
│   └── typescript.svg
└── tsconfig.json
```

**After This Story:**
```
digital-archaeology-web/
├── ...existing files...
├── postcss.config.js      # NEW - PostCSS with Tailwind
├── tailwind.config.js     # NEW - Tailwind configuration
├── vite.config.ts         # NEW - Vite plugins for WASM
└── src/
    └── styles/
        └── main.css       # NEW - Tailwind imports
```

### Critical Implementation Rules

**TypeScript (from project-context.md):**
- Strict mode required - No `any` types without explicit justification
- Use `null` for missing values, never `undefined`
- Use named exports (no default exports) for better tree-shaking

**Naming Conventions:**
- Config files: lowercase (e.g., `tailwind.config.js`, `vite.config.ts`)
- Utility files: camelCase (e.g., `store.ts`)
- Directories: lowercase, kebab-case if needed

### Testing Requirements

- Run `npm run build` - must complete without errors
- Run `npm run dev` - must start dev server
- Verify Tailwind is processing CSS (add a test class to index.html)
- Verify vite.config.ts is being loaded (check dev server output)

### Dependency Versions

Use latest compatible versions. As of story creation:
- tailwindcss: ^3.x (latest stable)
- postcss: ^8.x
- autoprefixer: ^10.x
- vite-plugin-wasm: latest
- vite-plugin-top-level-await: latest
- monaco-editor: latest

### Potential Issues to Watch

1. **vite-plugin-wasm compatibility**: Verify it works with Vite 7.x
2. **monaco-editor bundle size**: Monaco is large; may need worker configuration later
3. **PostCSS processing order**: Ensure tailwindcss is first plugin in postcss.config.js

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Selected Starter: Vite vanilla-ts]
- [Source: _bmad-output/planning-artifacts/architecture.md#Post-Initialization Setup]
- [Source: _bmad-output/planning-artifacts/architecture.md#CSS & Theming]
- [Source: _bmad-output/project-context.md#Technology Stack & Versions]
- [Source: _bmad-output/project-context.md#CSS/Theming Rules]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2: Configure Build Dependencies]
- [Source: _bmad-output/implementation-artifacts/1-1-initialize-vite-project-with-typescript.md]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Tailwind v4 initially installed, downgraded to v3 for architecture compatibility
- `npm run build` - passed with no errors (459ms build time)
- `npm run dev` - Vite v7.3.1 started in 248ms on http://localhost:5173/
- Tailwind CSS verified processing utility classes (min-h-screen, bg-gray-900, text-white)

### Completion Notes List

- Installed Tailwind CSS v3.4.19 (architecture specifies v3 patterns, not v4)
- Installed PostCSS v8.5.6 and Autoprefixer v10.4.23
- Installed vite-plugin-wasm v3.5.0 and vite-plugin-top-level-await v1.6.0
- Installed monaco-editor v0.55.1 as regular dependency
- Created vite.config.ts with WASM plugins configured
- Created tailwind.config.js with custom da-* color theme tokens
- Created postcss.config.js with tailwindcss and autoprefixer plugins
- Created src/styles/main.css with Tailwind directives
- Updated src/main.ts to import new Tailwind CSS file
- Added Tailwind test classes to index.html body element
- Build and dev server verified working

### File List

- `digital-archaeology-web/package.json` - MODIFIED: Added dependencies (tailwindcss, postcss, autoprefixer, vite-plugin-wasm, vite-plugin-top-level-await, monaco-editor)
- `digital-archaeology-web/package-lock.json` - MODIFIED: Updated with new dependency tree
- `digital-archaeology-web/vite.config.ts` - CREATED: Vite configuration with WASM plugins
- `digital-archaeology-web/tailwind.config.js` - CREATED: Tailwind configuration with content paths and custom theme tokens
- `digital-archaeology-web/postcss.config.js` - CREATED: PostCSS configuration with tailwindcss and autoprefixer
- `digital-archaeology-web/src/styles/main.css` - CREATED: Tailwind CSS entry point with directives
- `digital-archaeology-web/src/main.ts` - MODIFIED: Changed CSS import from ./style.css to ./styles/main.css
- `digital-archaeology-web/index.html` - MODIFIED: Added Tailwind utility classes to body element
- `digital-archaeology-web/src/style.css` - DELETED: Removed orphaned file with hardcoded colors (code review fix)
- `_bmad-output/project-context.md` - MODIFIED: Updated Vite version 6.x → 7.x, added config file default export exception

### Change Log

- 2026-01-21: Story implementation complete
  - Installed all required dependencies (Tailwind, PostCSS, WASM plugins, Monaco)
  - Created configuration files (vite.config.ts, tailwind.config.js, postcss.config.js)
  - Set up Tailwind CSS with custom theme tokens for da-* variables
  - Verified build and dev server functionality
  - All acceptance criteria met
- 2026-01-21: Senior Developer Review (AI) - Issues Fixed
  - Deleted orphaned src/style.css with hardcoded colors (HIGH)
  - Updated project-context.md Vite version 6.x → 7.x (MEDIUM)
  - Documented config file default export exception in project-context.md (MEDIUM)
  - LOW issues noted: hardcoded test classes in index.html (acceptable for now)

---

## Senior Developer Review (AI)

**Reviewer:** Claude Opus 4.5
**Date:** 2026-01-21
**Outcome:** APPROVED (after fixes)

### Issues Found & Resolution

| # | Severity | Issue | Resolution |
|---|----------|-------|------------|
| 1 | HIGH | Orphaned style.css with hardcoded colors | FIXED: Deleted file |
| 2 | MEDIUM | Default exports in config files | DOCUMENTED: Added exception to project-context.md |
| 3 | MEDIUM | Vite version mismatch (6.x vs 7.x) | FIXED: Updated project-context.md |
| 4 | LOW | Hardcoded test classes in index.html | NOTED: Acceptable for testing, will use da-* tokens after Story 1.4 |
| 5 | LOW | No barrel export for styles dir | NOTED: Not needed for CSS-only directory |

### Acceptance Criteria Validation

| AC | Requirement | Status |
|----|-------------|--------|
| 1.1 | tailwindcss, postcss, autoprefixer installed | ✅ PASS |
| 1.2 | vite-plugin-wasm installed | ✅ PASS |
| 1.3 | vite-plugin-top-level-await installed | ✅ PASS |
| 1.4 | monaco-editor installed | ✅ PASS |
| 1.5 | vite.config.ts includes WASM plugins | ✅ PASS |
| 1.6 | tailwind.config.js with custom theme tokens | ✅ PASS |
| 1.7 | postcss.config.js configured | ✅ PASS |
| 1.8 | Build completes without errors | ✅ PASS |

### Code Quality Assessment

- ✅ All ACs implemented and verified
- ✅ Architecture patterns followed (with documented exceptions)
- ✅ File List matches git reality
- ✅ No orphaned files remaining
- ⚠️ Test classes use hardcoded colors (acceptable pre-Story 1.4)

### Recommendation

Story approved for completion. All HIGH and MEDIUM issues resolved.

