# Story 7.1: Create HDL Viewer Panel

Status: done

---

## Story

As a user,
I want to view HDL files,
So that I can understand circuit definitions.

## Acceptance Criteria

1. **Given** I select View > HDL Viewer
   **When** the panel opens
   **Then** I see the Micro4 HDL file content
   **And** the viewer uses Monaco with read-only mode
   **And** the viewer can be closed
   **And** the HDL file loads from hdl/ directory

## Tasks / Subtasks

- [x] Task 1: Create HdlViewerPanel Component (AC: #1)
  - [x] 1.1 Create `src/hdl/HdlViewerPanel.ts` following SignalValuesPanel pattern
  - [x] 1.2 Implement mount/destroy lifecycle methods
  - [x] 1.3 Create panel container with header (title + close button)
  - [x] 1.4 Add Monaco editor instance in read-only mode
  - [x] 1.5 Implement show/hide methods for panel visibility

- [x] Task 2: Load HDL File Content (AC: #1)
  - [x] 2.1 Create `src/hdl/HdlLoader.ts` for fetching HDL files
  - [x] 2.2 Fetch from `/hdl/04_micro4_cpu.m4hdl` (use BASE_URL)
  - [x] 2.3 Handle loading states (loading, error, success)
  - [x] 2.4 Display error message if file fails to load

- [x] Task 3: Configure Monaco for HDL (AC: #1)
  - [x] 3.1 Create Monaco editor options matching Editor.ts pattern
  - [x] 3.2 Set `readOnly: true`
  - [x] 3.3 Apply 'da-dark' theme (reuse from Editor.ts)
  - [x] 3.4 Set language to 'text' (syntax highlighting in Story 7.2)
  - [x] 3.5 Configure minimap, line numbers, scrollBeyondLastLine

- [x] Task 4: Add View Menu Integration (AC: #1)
  - [x] 4.1 Add "HDL Viewer" menu item to View menu in MenuBar
  - [x] 4.2 Update MenuBarCallbacks interface with `onViewHdlViewer`
  - [x] 4.3 Wire callback in App.ts to toggle panel visibility
  - [x] 4.4 Add keyboard shortcut (Ctrl+Shift+H suggested)

- [x] Task 5: Implement Panel Close Functionality (AC: #1)
  - [x] 5.1 Add close button (×) in panel header
  - [x] 5.2 Implement onClose callback in options
  - [x] 5.3 Close via Escape key when panel has focus
  - [x] 5.4 Focus returns to previous element on close

- [x] Task 6: Add CSS Styling (AC: #1)
  - [x] 6.1 Add `.da-hdl-viewer-panel` styles to main.css
  - [x] 6.2 Panel should overlay or dock (consider modal vs side panel)
  - [x] 6.3 Style panel header with title and close button
  - [x] 6.4 Match existing panel styling patterns

- [x] Task 7: Create Unit Tests (AC: #1)
  - [x] 7.1 Create `src/hdl/HdlViewerPanel.test.ts`
  - [x] 7.2 Test mount creates container and Monaco editor
  - [x] 7.3 Test destroy cleans up resources
  - [x] 7.4 Test show/hide toggle visibility
  - [x] 7.5 Test close button triggers callback
  - [x] 7.6 Test read-only mode is enforced

- [x] Task 8: Create Index and Export (AC: #1)
  - [x] 8.1 Create `src/hdl/index.ts` barrel export
  - [x] 8.2 Export HdlViewerPanel and HdlLoader
  - [x] 8.3 Add path alias `@hdl` to tsconfig.json

---

## Dev Notes

### Previous Story Intelligence (Epic 6)

**Critical Patterns Established:**
- Monaco Editor wrapper pattern in `src/editor/Editor.ts:80-175`
- Theme registration: `themeRegisteredGlobally` flag prevents duplicate registration
- Mount/destroy lifecycle with proper disposal tracking
- CSS theme colors defined in `DA_DARK_THEME_COLORS`

**Panel Component Pattern (SignalValuesPanel):**
```typescript
export class HdlViewerPanel {
  private container: HTMLElement | null = null;
  private options: HdlViewerPanelOptions;

  constructor(options: HdlViewerPanelOptions = {}) {
    this.options = options;
  }

  mount(container: HTMLElement): void { ... }
  destroy(): void { ... }
  show(): void { ... }
  hide(): void { ... }
}
```

### Architecture Compliance

**Required Locations:**
- Component: `src/hdl/HdlViewerPanel.ts`
- Loader: `src/hdl/HdlLoader.ts`
- Tests: `src/hdl/HdlViewerPanel.test.ts`, `src/hdl/HdlLoader.test.ts`
- Export: `src/hdl/index.ts`
- Styles: `src/styles/main.css` (add HDL viewer section)

**HDL File Location:**
- Source: `/home/jeremyking/workspace/digital-archaeology/hdl/04_micro4_cpu.m4hdl`
- The web app needs to serve this file via Vite public folder or import
- Consider: Copy to `public/hdl/` or use raw import

### Library/Framework Requirements

**Monaco Editor:**
- Already installed and configured
- Reuse `registerMicro4Language` pattern for future HDL language (Story 7.2)
- Reuse `DA_DARK_THEME_COLORS` and theme registration logic

**Menu Integration:**
- MenuBar callbacks in `src/ui/MenuBar.ts`
- View menu pattern: `onViewCodePanel`, `onViewCircuitPanel`, `onViewStatePanel`
- Add: `onViewHdlViewer?: () => void`

### File Structure Requirements

```
src/
├── hdl/
│   ├── index.ts                 # Barrel export
│   ├── HdlViewerPanel.ts        # Main panel component
│   ├── HdlViewerPanel.test.ts   # Unit tests
│   ├── HdlLoader.ts             # File loading utility
│   └── HdlLoader.test.ts        # Loader tests
```

### Testing Requirements

**Unit Test Coverage:**
- HdlViewerPanel: mount/destroy lifecycle, show/hide, read-only mode
- HdlLoader: fetch success, fetch error, loading state

**Test Pattern (from Editor.test.ts):**
```typescript
describe('HdlViewerPanel', () => {
  let container: HTMLDivElement;
  let panel: HdlViewerPanel;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    panel = new HdlViewerPanel();
  });

  afterEach(() => {
    panel.destroy();
    container.remove();
  });

  it('should mount Monaco editor in read-only mode', () => { ... });
});
```

### Accessibility Checklist

- [x] **Keyboard Navigation** - Close via Escape key, Tab through controls
- [ ] **ARIA Attributes**
  - [ ] `aria-label` for close button: "Close HDL Viewer"
  - [ ] `role="dialog"` if modal, `role="region"` if docked panel
  - [ ] `aria-labelledby` pointing to panel title
- [ ] **Focus Management** - Focus Monaco editor on open, return focus on close
- [ ] **Color Contrast** - Uses existing da-dark theme (verified AA compliant)
- [x] **XSS Prevention** - Monaco handles content securely
- [ ] **Screen Reader Announcements** - Announce when panel opens/closes

### Project Structure Notes

- New `src/hdl/` feature folder follows Architecture pattern
- Aligns with `editor/`, `visualizer/`, `debugger/` folder structure
- Path alias `@hdl` to be added to `tsconfig.json` paths section

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 7] - Story requirements
- [Source: _bmad-output/planning-artifacts/architecture.md#FR25-28] - HDL Management requirements
- [Source: src/editor/Editor.ts] - Monaco Editor pattern
- [Source: src/visualizer/SignalValuesPanel.ts] - Panel component pattern
- [Source: src/ui/MenuBar.ts] - Menu integration pattern

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- All 2991 tests pass (41 new HDL module tests)

### Completion Notes List

- Created new `src/hdl/` feature folder following established patterns
- HdlViewerPanel uses Monaco Editor with read-only mode and 'da-dark-hdl' theme
- HdlLoader utility provides fetch-based file loading with proper error handling
- HDL file copied to `public/hdl/04_micro4_cpu.m4hdl` for serving via Vite
- Menu integration via optional `onViewHdlViewer` callback in MenuBarCallbacks
- Escape key closes panel, focus management implemented
- Panel displays as centered modal overlay matching existing dialog patterns

**Code Review Fixes Applied:**
- Fixed TypeScript error: removed unused `monaco` import in test file
- Added test coverage for `getContent()` method (2 new tests)
- Added test for focus restoration on hide (1 new test)
- Removed unused CSS `.da-hdl-viewer-backdrop` classes
- Added screen reader announcements via aria-live region for panel open/close
- Added JSDoc documentation to barrel exports in index.ts

### File List

**New Files:**
- `src/hdl/HdlLoader.ts` - HDL file loading utility
- `src/hdl/HdlLoader.test.ts` - 13 tests for loader
- `src/hdl/HdlViewerPanel.ts` - Monaco-based viewer panel component
- `src/hdl/HdlViewerPanel.test.ts` - 28 tests for panel
- `src/hdl/index.ts` - Barrel export
- `public/hdl/04_micro4_cpu.m4hdl` - HDL file for serving

**Modified Files:**
- `tsconfig.json` - Added `@hdl/*` path alias
- `vite.aliases.ts` - Added `@hdl` alias
- `src/styles/main.css` - Added HDL viewer panel styles (~100 lines)
- `src/ui/MenuBar.ts` - Added HDL Viewer menu item and callback
- `src/ui/App.ts` - Added HdlViewerPanel integration

