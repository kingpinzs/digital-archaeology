# Story 2.1: Integrate Monaco Editor

Status: done

---

## Story

As a user,
I want a professional code editor in the code panel,
So that I have a familiar editing experience.

## Acceptance Criteria

1. **Given** the application is loaded
   **When** I view the code panel
   **Then** I see a Monaco editor instance filling the panel
   **And** the editor has a dark theme matching the application
   **And** I can type text in the editor
   **And** the editor resizes when the panel resizes

## Tasks / Subtasks

- [x] Task 1: Install and Configure Monaco Editor Dependencies (AC: #1)
  - [x] 1.1 Monaco editor is already installed (`monaco-editor` in package.json from Story 1.2)
  - [x] 1.2 Install `vite-plugin-monaco-editor` for worker configuration
  - [x] 1.3 Update `vite.config.ts` to include Monaco editor plugin with worker configuration
  - [x] 1.4 Verify build completes with Monaco plugin

- [x] Task 2: Create Editor Component Structure (AC: #1)
  - [x] 2.1 Create `src/editor/Editor.ts` as the Monaco wrapper component
  - [x] 2.2 Define `Editor` class with `mount(container: HTMLElement)` method
  - [x] 2.3 Define `EditorOptions` interface for configuration
  - [x] 2.4 Implement `destroy()` method for cleanup (dispose Monaco instance)
  - [x] 2.5 Export `Editor` class from `src/editor/index.ts`

- [x] Task 3: Initialize Monaco Editor Instance (AC: #1)
  - [x] 3.1 Import `monaco` namespace from `monaco-editor`
  - [x] 3.2 Call `monaco.editor.create()` with container element
  - [x] 3.3 Set initial configuration: language 'plaintext' (syntax highlighting in Story 2.2)
  - [x] 3.4 Set `automaticLayout: true` to handle panel resize automatically
  - [x] 3.5 Store editor instance reference for later access

- [x] Task 4: Configure Dark Theme Matching Application (AC: #1)
  - [x] 4.1 Define custom Monaco theme using `monaco.editor.defineTheme()`
  - [x] 4.2 Theme name: `da-dark` (digital archaeology dark)
  - [x] 4.3 Base theme: `vs-dark`
  - [x] 4.4 Map CSS variables to Monaco theme colors:
    - `editor.background` → `--da-bg-secondary` (#252542)
    - `editor.foreground` → `--da-text-primary` (#e0e0e0)
    - `editorLineNumber.foreground` → `--da-text-secondary` (#a0a0b0)
    - `editorCursor.foreground` → `--da-accent` (#00b4d8)
    - `editor.selectionBackground` → `--da-bg-tertiary` with alpha
  - [x] 4.5 Apply theme via `theme: 'da-dark'` option in `monaco.editor.create()`
  - [x] 4.6 Ensure theme matches both lab-mode and story-mode (use lab-mode colors as base)

- [x] Task 5: Implement Editor API Methods (AC: #1)
  - [x] 5.1 `getValue(): string` - Get current editor content
  - [x] 5.2 `setValue(content: string): void` - Set editor content
  - [x] 5.3 `getModel(): monaco.editor.ITextModel | null` - Get text model for advanced operations
  - [x] 5.4 `focus(): void` - Focus the editor
  - [x] 5.5 `getMonacoEditor(): monaco.editor.IStandaloneCodeEditor | null` - Access raw Monaco instance

- [x] Task 6: Integrate Editor into App.ts Code Panel (AC: #1)
  - [x] 6.1 Import Editor component in App.ts
  - [x] 6.2 Add private `editor: Editor | null = null` field
  - [x] 6.3 Create `initializeEditor()` method
  - [x] 6.4 Mount Editor in `.da-code-panel .da-panel-content` container
  - [x] 6.5 Create `destroyEditor()` method
  - [x] 6.6 Add `getEditor()` method to expose instance
  - [x] 6.7 Call `initializeEditor()` in `mount()` and `destroyEditor()` in `destroy()`

- [x] Task 7: Handle Panel Resize (AC: #1)
  - [x] 7.1 Verify `automaticLayout: true` handles resize automatically
  - [x] 7.2 Test editor resizes when code panel is resized via PanelResizer
  - [x] 7.3 Test editor handles panel visibility toggle (hidden → visible)
  - [x] 7.4 If needed, call `editor.layout()` manually on visibility change

- [x] Task 8: Add Accessibility Attributes (AC: #1)
  - [x] 8.1 Monaco has built-in accessibility - verify ARIA attributes present
  - [x] 8.2 Set `ariaLabel: 'Assembly Code Editor'` in editor options
  - [x] 8.3 Verify keyboard navigation works (Tab, arrow keys)
  - [x] 8.4 Test with screen reader announcement

- [x] Task 9: Write Unit Tests for Editor Component (AC: #1)
  - [x] 9.1 Test Editor mounts to container
  - [x] 9.2 Test Editor creates Monaco instance
  - [x] 9.3 Test getValue/setValue work correctly
  - [x] 9.4 Test destroy disposes Monaco instance
  - [x] 9.5 Test theme is applied
  - [x] 9.6 Test focus() method
  - [x] 9.7 Mock Monaco editor for Vitest (monaco-editor provides types)

- [x] Task 10: Write Integration Tests in App.test.ts (AC: #1)
  - [x] 10.1 Test App initializes Editor in code panel
  - [x] 10.2 Test getEditor() returns Editor instance
  - [x] 10.3 Test Editor is destroyed when App is destroyed
  - [x] 10.4 Test Editor persists across panel visibility toggle

- [x] Task 11: Validate Implementation (AC: #1)
  - [x] 11.1 Verify Monaco editor renders in code panel
  - [x] 11.2 Verify dark theme matches application design
  - [x] 11.3 Verify typing in editor works
  - [x] 11.4 Verify editor resizes with panel
  - [x] 11.5 Run `npm run build` - must complete without errors
  - [x] 11.6 Run `npx tsc --noEmit` - must pass with no TypeScript errors

---

## Dev Notes

### Previous Story Intelligence (Story 1.10)

**Key Learnings from Epic 1:**
- Components follow mount/destroy pattern with proper cleanup
- **CRITICAL: Store bound event handlers and remove them in destroy()** to prevent memory leaks
- CSS uses `--da-*` custom properties for theming
- Accessibility attributes (role, aria-label) required on interactive elements
- Tests use Vitest with jsdom for DOM testing
- All TypeScript strict mode - no `any`, use `null` not `undefined`
- Named exports only (no default exports except config files)
- No console.log in production code - use no-op placeholder comments

**Code Review Fixes from Epic 1:**
- XSS Prevention: Use `escapeHtml()` or `textContent` for user data
- Deep clone objects in getState() to prevent mutation
- Test edge cases (null values, boundary conditions)
- Remove dead CSS that's no longer used
- Add keyboard navigation for interactive components
- Include ARIA attributes from the start

### Current Code Panel Structure

The code panel already has a content container in App.ts render():
```html
<aside class="da-panel da-code-panel" aria-label="Code Editor Panel">
  <div class="da-panel-header-container">
    <!-- PanelHeader component mounted here -->
  </div>
  <div class="da-panel-content">
    <!-- Epic 2: Assembly Code Editor - Monaco goes HERE -->
  </div>
</aside>
```

The `.da-panel-content` container is where the Editor should be mounted.

### Monaco Editor Integration Approach

**From web research (2026):**
- Use `vite-plugin-monaco-editor` for proper worker configuration
- Monaco requires web workers for language features (editorWorkerService is required)
- Theme can be defined using `monaco.editor.defineTheme()` with `vs-dark` base
- `automaticLayout: true` handles resize automatically (preferred over manual resize)

**Vite Plugin Configuration:**
```typescript
// vite.config.ts
import monacoEditorPlugin from 'vite-plugin-monaco-editor';

export default defineConfig({
  plugins: [
    // ... existing plugins
    monacoEditorPlugin({
      languageWorkers: ['editorWorkerService'],
      // Only need base worker for now - syntax highlighting in Story 2.2
    }),
  ],
});
```

### Component Interface

```typescript
// src/editor/Editor.ts

import * as monaco from 'monaco-editor';

export interface EditorOptions {
  /** Initial content */
  initialValue?: string;
  /** Read-only mode */
  readOnly?: boolean;
}

export class Editor {
  private container: HTMLElement | null = null;
  private editor: monaco.editor.IStandaloneCodeEditor | null = null;

  constructor(options?: EditorOptions) {
    this.options = options ?? {};
  }

  mount(container: HTMLElement): void {
    this.container = container;
    this.defineTheme();
    this.editor = monaco.editor.create(container, {
      value: this.options.initialValue ?? '',
      language: 'plaintext', // Will be 'micro4' after Story 2.2
      theme: 'da-dark',
      automaticLayout: true,
      minimap: { enabled: false }, // Disable minimap for small panel
      lineNumbers: 'on', // Story 2.3 will refine this
      readOnly: this.options.readOnly ?? false,
      scrollBeyondLastLine: false,
      fontSize: 14,
      fontFamily: "'SF Mono', 'Consolas', 'Monaco', monospace",
      ariaLabel: 'Assembly Code Editor',
    });
  }

  private defineTheme(): void {
    monaco.editor.defineTheme('da-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#252542',
        'editor.foreground': '#e0e0e0',
        'editorLineNumber.foreground': '#a0a0b0',
        'editorCursor.foreground': '#00b4d8',
        'editor.selectionBackground': '#2f2f5280',
        'editor.lineHighlightBackground': '#2f2f52',
      },
    });
  }

  getValue(): string {
    return this.editor?.getValue() ?? '';
  }

  setValue(content: string): void {
    this.editor?.setValue(content);
  }

  getModel(): monaco.editor.ITextModel | null {
    return this.editor?.getModel() ?? null;
  }

  focus(): void {
    this.editor?.focus();
  }

  getEditor(): monaco.editor.IStandaloneCodeEditor | null {
    return this.editor;
  }

  destroy(): void {
    if (this.editor) {
      this.editor.dispose();
      this.editor = null;
    }
    this.container = null;
  }
}
```

### Theme Color Mapping

Map CSS variables to Monaco theme colors:

| Monaco Token | CSS Variable | Lab Mode Value | Purpose |
|--------------|--------------|----------------|---------|
| editor.background | --da-bg-secondary | #252542 | Editor background |
| editor.foreground | --da-text-primary | #e0e0e0 | Default text |
| editorLineNumber.foreground | --da-text-secondary | #a0a0b0 | Line numbers |
| editorCursor.foreground | --da-accent | #00b4d8 | Cursor |
| editor.selectionBackground | --da-bg-tertiary + alpha | #2f2f5280 | Selection highlight |
| editor.lineHighlightBackground | --da-bg-tertiary | #2f2f52 | Current line highlight |

**Note:** Monaco themes are defined at initialization and cannot dynamically use CSS variables. Use the lab-mode values directly in the theme definition. Story mode will use the same editor theme for consistency.

### CSS for Editor Container

The `.da-panel-content` needs to fill available space:

```css
/* Already exists or add to main.css */
.da-panel-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}
```

Monaco editor will fill this container due to `automaticLayout: true`.

### Testing Considerations

**Mocking Monaco for Vitest:**
Monaco editor requires DOM and workers which don't exist in jsdom. Create a mock:

```typescript
// src/editor/__mocks__/monaco-editor.ts
export const editor = {
  create: vi.fn(() => ({
    dispose: vi.fn(),
    getValue: vi.fn(() => ''),
    setValue: vi.fn(),
    getModel: vi.fn(() => null),
    focus: vi.fn(),
    layout: vi.fn(),
  })),
  defineTheme: vi.fn(),
  setTheme: vi.fn(),
};
```

Or use `vi.mock('monaco-editor')` with factory function.

### Bundle Size Consideration

Monaco editor is large (~2MB). For this story, we accept the bundle size. Future optimization options:
- Lazy load Monaco only when code panel is visible
- Use Monaco's `getWorkerUrl` for CDN-hosted workers
- Tree-shake unused language features

These optimizations are out of scope for Story 2.1.

### Files to Create

- `src/editor/Editor.ts` - Monaco wrapper component
- `src/editor/Editor.test.ts` - Unit tests

### Files to Modify

- `vite.config.ts` - Add Monaco editor plugin
- `src/editor/index.ts` - Export Editor and types
- `src/ui/App.ts` - Integrate Editor component
- `src/ui/App.test.ts` - Add Editor integration tests
- `src/styles/main.css` - Add/verify `.da-panel-content` styles (if needed)

### Project Structure Notes

- Editor component goes in `src/editor/` per architecture.md feature folder structure
- Monaco wrapper follows same mount/destroy pattern as other components
- Use path alias `@editor/` for imports

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1: Integrate Monaco Editor]
- [Source: _bmad-output/planning-artifacts/architecture.md#Module Architecture: Feature Folders]
- [Source: _bmad-output/planning-artifacts/architecture.md#Selected Starter: Vite vanilla-ts]
- [Source: _bmad-output/project-context.md#Technology Stack]
- [Source: _bmad-output/implementation-artifacts/1-10-create-panel-header-components.md]
- [Source: digital-archaeology-web/src/ui/App.ts]
- [Web: vite-plugin-monaco-editor](https://github.com/vdesjs/vite-plugin-monaco-editor)
- [Web: Monaco Editor Custom Themes](https://pheralb.dev/post/monaco-custom-theme)

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Fixed Monaco plugin ESM/CJS compatibility issue by using wrapper pattern in vite.config.ts
- Added path aliases to vitest.config.ts for test resolution

### Completion Notes List

- Monaco editor successfully integrated with custom `da-dark` theme matching CSS variables
- Editor uses `automaticLayout: true` for automatic resize handling
- Manual `layout()` call added for panel visibility toggle via `requestAnimationFrame`
- 36 unit tests for Editor component, 10 integration tests for App/Editor
- Build produces expected chunk sizes (Monaco is ~5MB, known large dependency)
- Accessibility: ariaLabel set to "Assembly Code Editor", accessibilitySupport: "auto"

**Code Review Fixes Applied:**
- M2: Fixed theme registration to use module-level global flag instead of instance variable
- M3: Extracted shared path aliases to vite.aliases.ts (DRY principle)
- L1: Updated Task 5.5 to reflect actual method name `getMonacoEditor()`
- L2: Updated Task 4.5 to reflect theme applied via create() option
- L3: Fixed test mock typing for getModel() to avoid casting hacks
- Added `resetThemeRegistration()` export for test isolation

### File List

**Created:**
- `digital-archaeology-web/src/editor/Editor.ts` - Monaco wrapper component with global theme registration
- `digital-archaeology-web/src/editor/Editor.test.ts` - Unit tests (36 tests)
- `digital-archaeology-web/vite.aliases.ts` - Shared path aliases for DRY config

**Modified:**
- `digital-archaeology-web/package.json` - Added vite-plugin-monaco-editor dependency
- `digital-archaeology-web/package-lock.json` - Updated lockfile for new dependency
- `digital-archaeology-web/vite.config.ts` - Added Monaco editor plugin, uses shared aliases
- `digital-archaeology-web/vitest.config.ts` - Uses shared aliases from vite.aliases.ts
- `digital-archaeology-web/src/editor/index.ts` - Added Editor and resetThemeRegistration exports
- `digital-archaeology-web/src/ui/App.ts` - Integrated Editor component with lifecycle
- `digital-archaeology-web/src/ui/App.test.ts` - Added Monaco mock and editor integration tests (89 tests)

