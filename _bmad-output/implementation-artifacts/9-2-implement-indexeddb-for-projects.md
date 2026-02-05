# Story 9.2: Implement IndexedDB for Projects

Status: done

## Story

As a user,
I want my code saved automatically,
So that I don't lose work.

## Acceptance Criteria

1. **Given** I write code in the editor
   **When** I pause typing for 2 seconds
   **Then** the code is auto-saved to IndexedDB

2. **And** a "Saved" indicator appears briefly (1-2 seconds)

3. **And** the save includes: code, breakpoints, cursor position

## Tasks / Subtasks

- [x] Task 1: Create ProjectStorage service class (AC: #1, #3)
  - [x] 1.1: Create `src/state/ProjectStorage.ts` with IndexedDB wrapper
  - [x] 1.2: Define `ProjectData` interface with code, breakpoints, cursorPosition
  - [x] 1.3: Implement `openDatabase()` with version migration support
  - [x] 1.4: Implement `saveProject()` async method
  - [x] 1.5: Implement `loadProject()` async method
  - [x] 1.6: Implement `clearProject()` async method
  - [x] 1.7: Add graceful fallback for IndexedDB unavailability

- [x] Task 2: Define project data schema (AC: #3)
  - [x] 2.1: Add to `src/state/types.ts`: `ProjectData`, `CursorPosition`, `Breakpoint` interfaces
  - [x] 2.2: Define `DEFAULT_PROJECT` constant with empty code and defaults
  - [x] 2.3: Add validation type guard `isValidProjectData()`
  - [x] 2.4: Define IndexedDB database name and object store constants

- [x] Task 3: Implement debounced auto-save (AC: #1)
  - [x] 3.1: Create `AutoSaveManager` class in `src/state/AutoSaveManager.ts`
  - [x] 3.2: Implement 2-second debounce using setTimeout/clearTimeout
  - [x] 3.3: Integrate with Editor onChange callback in App.ts
  - [x] 3.4: Track dirty state (hasUnsavedChanges)

- [x] Task 4: Implement save indicator (AC: #2)
  - [x] 4.1: Add "Saved" indicator to StatusBar component
  - [x] 4.2: Create `showSaveIndicator()` method that shows for 1.5 seconds
  - [x] 4.3: Use CSS animation for fade-in/fade-out
  - [x] 4.4: Style indicator to match existing status bar theme

- [x] Task 5: Integrate breakpoints with save (AC: #3)
  - [x] 5.1: Get current breakpoints from App.ts breakpoints Map
  - [x] 5.2: Serialize breakpoints as array of addresses in ProjectData
  - [x] 5.3: Ensure breakpoints are included in every auto-save

- [x] Task 6: Integrate cursor position with save (AC: #3)
  - [x] 6.1: Get cursor position from Monaco editor via `getPosition()`
  - [x] 6.2: Include lineNumber and column in ProjectData
  - [x] 6.3: Ensure cursor position is included in every auto-save

- [x] Task 7: Wire up auto-save in App.ts (AC: #1, #2, #3)
  - [x] 7.1: Initialize AutoSaveManager in App constructor
  - [x] 7.2: Connect editor onChange to AutoSaveManager
  - [x] 7.3: Collect code, breakpoints, cursor position on save trigger
  - [x] 7.4: Call ProjectStorage.saveProject() and show indicator on success

- [x] Task 8: Write tests
  - [x] 8.1: Create `src/state/ProjectStorage.test.ts` with IndexedDB mocking
  - [x] 8.2: Test save/load/clear functionality
  - [x] 8.3: Test data validation and error handling
  - [x] 8.4: Create `src/state/AutoSaveManager.test.ts`
  - [x] 8.5: Test debounce timing (2 second delay)
  - [x] 8.6: Test dirty state tracking

## Dev Notes

### Architecture Context

**From architecture.md:** Tiered persistence strategy:
- Settings (small, frequent) → localStorage ✅ Done in Story 9.1
- Projects (larger, less frequent) → IndexedDB ← **THIS STORY**
- Export files → File API (Story 9.4/9.5)

This follows the established pattern from Story 9.1 (SettingsStorage) but uses IndexedDB for async, scalable project data.

### Existing localStorage Usage (DO NOT BREAK)

From Story 9.1, these keys are already in use:
1. **Settings** (`digital-archaeology-settings`): SettingsStorage.ts
2. **Legacy Theme** (`da-theme`): theme.ts
3. **Story Progress** (`digital-archaeology-story-progress`): StoryStorage.ts

### IndexedDB Schema Design

```typescript
// Database name and version
export const PROJECT_DB_NAME = 'digital-archaeology-projects';
export const PROJECT_DB_VERSION = 1;
export const PROJECT_STORE_NAME = 'projects';
export const CURRENT_PROJECT_KEY = 'current'; // Single project key for MVP
```

### ProjectData Interface

```typescript
// src/state/types.ts (add to existing file)

export interface CursorPosition {
  lineNumber: number;
  column: number;
}

export interface Breakpoint {
  /** Memory address where breakpoint is set */
  address: number;
  /** Line number in editor (for restoration) */
  lineNumber: number;
}

export interface ProjectData {
  /** Assembly source code */
  code: string;

  /** Breakpoint addresses with line mappings */
  breakpoints: Breakpoint[];

  /** Editor cursor position */
  cursorPosition: CursorPosition;

  /** Timestamp of last save */
  savedAt: number;

  /** Schema version for future migrations */
  version: number;
}

export const DEFAULT_PROJECT: ProjectData = {
  code: '',
  breakpoints: [],
  cursorPosition: { lineNumber: 1, column: 1 },
  savedAt: 0,
  version: 1,
};
```

### ProjectStorage Service Pattern

Follow SettingsStorage.ts pattern but with IndexedDB:

```typescript
// src/state/ProjectStorage.ts

import type { ProjectData } from './types';
import { DEFAULT_PROJECT, isValidProjectData } from './types';

export const PROJECT_DB_NAME = 'digital-archaeology-projects';
export const PROJECT_DB_VERSION = 1;
export const PROJECT_STORE_NAME = 'projects';
export const CURRENT_PROJECT_KEY = 'current';

export class ProjectStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;

  /**
   * Open or create the IndexedDB database.
   * Handles version upgrades and creates object stores.
   */
  private async openDatabase(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(PROJECT_DB_NAME, PROJECT_DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(PROJECT_STORE_NAME)) {
          db.createObjectStore(PROJECT_STORE_NAME);
        }
      };
    });

    return this.dbPromise;
  }

  /**
   * Save project data to IndexedDB.
   * Returns true on success, false on failure.
   */
  async saveProject(project: ProjectData): Promise<boolean> {
    try {
      const db = await this.openDatabase();
      return new Promise<boolean>((resolve) => {
        const transaction = db.transaction(PROJECT_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(PROJECT_STORE_NAME);

        // Update timestamp
        const data: ProjectData = {
          ...project,
          savedAt: Date.now(),
        };

        const request = store.put(data, CURRENT_PROJECT_KEY);

        request.onsuccess = () => resolve(true);
        request.onerror = () => {
          console.error('Failed to save project:', request.error);
          resolve(false);
        };
      });
    } catch (error) {
      console.error('Failed to save project:', error);
      return false;
    }
  }

  /**
   * Load project data from IndexedDB.
   * Returns null if not found or invalid.
   */
  async loadProject(): Promise<ProjectData | null> {
    try {
      const db = await this.openDatabase();
      return new Promise<ProjectData | null>((resolve) => {
        const transaction = db.transaction(PROJECT_STORE_NAME, 'readonly');
        const store = transaction.objectStore(PROJECT_STORE_NAME);
        const request = store.get(CURRENT_PROJECT_KEY);

        request.onsuccess = () => {
          const data = request.result;
          if (data && isValidProjectData(data)) {
            resolve(data);
          } else {
            resolve(null);
          }
        };

        request.onerror = () => {
          console.error('Failed to load project:', request.error);
          resolve(null);
        };
      });
    } catch (error) {
      console.error('Failed to load project:', error);
      return null;
    }
  }

  /**
   * Clear project data from IndexedDB.
   */
  async clearProject(): Promise<void> {
    try {
      const db = await this.openDatabase();
      return new Promise<void>((resolve) => {
        const transaction = db.transaction(PROJECT_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(PROJECT_STORE_NAME);
        const request = store.delete(CURRENT_PROJECT_KEY);

        request.onsuccess = () => resolve();
        request.onerror = () => {
          console.error('Failed to clear project:', request.error);
          resolve();
        };
      });
    } catch (error) {
      console.error('Failed to clear project:', error);
    }
  }

  /**
   * Check if a project exists in storage.
   */
  async hasProject(): Promise<boolean> {
    const project = await this.loadProject();
    return project !== null;
  }
}
```

### AutoSaveManager Class

```typescript
// src/state/AutoSaveManager.ts

export type SaveCallback = () => Promise<void>;

export class AutoSaveManager {
  private debounceTimeout: number | null = null;
  private readonly debounceMs: number;
  private _isDirty: boolean = false;

  constructor(debounceMs: number = 2000) {
    this.debounceMs = debounceMs;
  }

  /**
   * Mark content as changed and schedule save after debounce period.
   */
  markDirty(onSave: SaveCallback): void {
    this._isDirty = true;

    // Clear existing timeout
    if (this.debounceTimeout !== null) {
      clearTimeout(this.debounceTimeout);
    }

    // Schedule new save
    this.debounceTimeout = window.setTimeout(async () => {
      await onSave();
      this._isDirty = false;
      this.debounceTimeout = null;
    }, this.debounceMs);
  }

  /**
   * Force immediate save (e.g., on page unload).
   */
  async saveNow(onSave: SaveCallback): Promise<void> {
    if (this.debounceTimeout !== null) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }

    if (this._isDirty) {
      await onSave();
      this._isDirty = false;
    }
  }

  /**
   * Cancel pending save.
   */
  cancel(): void {
    if (this.debounceTimeout !== null) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }
  }

  /**
   * Check if there are unsaved changes.
   */
  get isDirty(): boolean {
    return this._isDirty;
  }

  /**
   * Destroy the manager and cancel pending operations.
   */
  destroy(): void {
    this.cancel();
  }
}
```

### Save Indicator UI

Add to StatusBar.ts (or create new indicator component):

```typescript
// In StatusBar.ts or new SaveIndicator.ts
private showSaveIndicator(): void {
  const indicator = document.createElement('div');
  indicator.className = 'da-save-indicator';
  indicator.textContent = 'Saved';
  indicator.setAttribute('aria-live', 'polite');

  this.element.appendChild(indicator);

  // Remove after animation
  setTimeout(() => {
    indicator.remove();
  }, 1500);
}
```

CSS for indicator:
```css
/* In main.css */
.da-save-indicator {
  position: absolute;
  right: var(--da-spacing-md);
  padding: var(--da-spacing-xs) var(--da-spacing-sm);
  background: var(--da-success-bg);
  color: var(--da-success-text);
  border-radius: var(--da-border-radius);
  font-size: var(--da-font-size-sm);
  animation: da-save-indicator-fade 1.5s ease-out forwards;
}

@keyframes da-save-indicator-fade {
  0% { opacity: 1; }
  70% { opacity: 1; }
  100% { opacity: 0; }
}
```

### Integration in App.ts

```typescript
// In App.ts

import { ProjectStorage, AutoSaveManager } from '@state/index';
import type { ProjectData, CursorPosition, Breakpoint } from '@state/index';

class App {
  private projectStorage: ProjectStorage;
  private autoSaveManager: AutoSaveManager;

  constructor() {
    // ... existing code ...
    this.projectStorage = new ProjectStorage();
    this.autoSaveManager = new AutoSaveManager(2000); // 2 second debounce
  }

  private initEditor(): void {
    // ... existing editor init ...

    // Connect editor changes to auto-save
    this.editor.onDidChangeModelContent(() => {
      this.autoSaveManager.markDirty(() => this.performAutoSave());
    });
  }

  private async performAutoSave(): Promise<void> {
    const projectData: ProjectData = {
      code: this.editor.getValue(),
      breakpoints: this.getBreakpointsArray(),
      cursorPosition: this.getEditorCursorPosition(),
      savedAt: Date.now(),
      version: 1,
    };

    const success = await this.projectStorage.saveProject(projectData);
    if (success) {
      this.statusBar.showSaveIndicator();
    }
  }

  private getBreakpointsArray(): Breakpoint[] {
    const breakpoints: Breakpoint[] = [];
    this.breakpoints.forEach((lineNumber, address) => {
      breakpoints.push({ address, lineNumber });
    });
    return breakpoints;
  }

  private getEditorCursorPosition(): CursorPosition {
    const position = this.editor.getPosition();
    return {
      lineNumber: position?.lineNumber ?? 1,
      column: position?.column ?? 1,
    };
  }

  destroy(): void {
    // ... existing cleanup ...
    this.autoSaveManager.destroy();
  }
}
```

### Type Guard for Validation

```typescript
// Add to src/state/types.ts

export function isValidCursorPosition(value: unknown): value is CursorPosition {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.lineNumber === 'number' && obj.lineNumber >= 1 &&
    typeof obj.column === 'number' && obj.column >= 1
  );
}

export function isValidBreakpoint(value: unknown): value is Breakpoint {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.address === 'number' && obj.address >= 0 &&
    typeof obj.lineNumber === 'number' && obj.lineNumber >= 1
  );
}

export function isValidProjectData(value: unknown): value is ProjectData {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.code === 'string' &&
    Array.isArray(obj.breakpoints) &&
    obj.breakpoints.every(isValidBreakpoint) &&
    isValidCursorPosition(obj.cursorPosition) &&
    typeof obj.savedAt === 'number' &&
    typeof obj.version === 'number'
  );
}
```

### Accessibility Checklist

- [x] **Keyboard Navigation** - N/A (auto-save is automatic, no keyboard interaction)
- [x] **ARIA Attributes** - Save indicator uses `aria-live="polite"` for screen reader announcement
- [x] **Focus Management** - N/A (no focus changes)
- [x] **Color Contrast** - Save indicator uses theme colors that should already meet WCAG AA
- [x] **XSS Prevention** - N/A (no user content displayed as HTML)
- [x] **Screen Reader Announcements** - `aria-live="polite"` on save indicator announces "Saved"

### Project Structure Notes

**New Files:**
```
src/state/
├── types.ts              # Add ProjectData, CursorPosition, Breakpoint (UPDATE)
├── ProjectStorage.ts     # IndexedDB persistence service (NEW)
├── ProjectStorage.test.ts# Tests with fake-indexeddb (NEW)
├── AutoSaveManager.ts    # Debounced save manager (NEW)
├── AutoSaveManager.test.ts# Debounce timing tests (NEW)
└── index.ts              # Update barrel exports (UPDATE)
```

**Modified Files:**
- `src/ui/App.ts` - Initialize ProjectStorage, AutoSaveManager, connect to editor
- `src/ui/StatusBar.ts` - Add showSaveIndicator() method
- `src/ui/StatusBar.css` or `main.css` - Add save indicator styles

### Testing with fake-indexeddb

Use `fake-indexeddb` package for testing (already common in web testing):

```typescript
// src/state/ProjectStorage.test.ts
import 'fake-indexeddb/auto';
import { ProjectStorage, PROJECT_DB_NAME } from './ProjectStorage';

beforeEach(() => {
  // Clear IndexedDB between tests
  indexedDB.deleteDatabase(PROJECT_DB_NAME);
});

describe('ProjectStorage', () => {
  it('saves and loads project data', async () => {
    const storage = new ProjectStorage();
    const project = {
      code: 'LDA 0x10',
      breakpoints: [{ address: 0x05, lineNumber: 3 }],
      cursorPosition: { lineNumber: 5, column: 10 },
      savedAt: Date.now(),
      version: 1,
    };

    await storage.saveProject(project);
    const loaded = await storage.loadProject();

    expect(loaded?.code).toBe('LDA 0x10');
    expect(loaded?.breakpoints).toHaveLength(1);
  });
});
```

### References

- [Source: architecture.md#Persistence] - Tiered persistence: localStorage + IndexedDB
- [Source: Story 9.1] - SettingsStorage pattern to follow
- [Source: App.ts:breakpoints] - Map<number, number> for address → lineNumber
- [Source: Editor.ts] - Monaco editor `onDidChangeModelContent`, `getPosition()`, `getValue()`
- [Source: StatusBar.ts] - Status bar component for save indicator
- [Source: project-context.md#State-Management-Rules] - Max 2 levels nesting, async patterns

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - Implementation proceeded without blocking issues.

### Completion Notes List

- **Task 1 & 2**: Created `src/state/ProjectStorage.ts` with IndexedDB wrapper service including `openDatabase()`, `saveProject()`, `loadProject()`, `clearProject()`, `hasProject()`, and `close()` methods. Added `ProjectData`, `ProjectCursorPosition`, `Breakpoint` interfaces, `DEFAULT_PROJECT` constant, and `isValidProjectData()`, `isValidCursorPosition()`, `isValidBreakpoint()` type guards to `src/state/types.ts`. Named the cursor type `ProjectCursorPosition` to avoid collision with the editor's existing `CursorPosition` type.

- **Task 3**: Created `src/state/AutoSaveManager.ts` with 2-second debounce (configurable). Implements `markDirty()` with true debounce reset, `saveNow()` for immediate save, `cancel()`, and `destroy()` for cleanup. Error handling keeps dirty flag true on save failure so next change triggers retry.

- **Task 4**: Added `showSaveIndicator()` public method to `StatusBar.ts` with proper cleanup (removes previous indicator, clears timeout). Added CSS animation `da-save-fade` that shows "Saved" text for 1.5s with fade-out. Uses `aria-live="polite"` for screen reader announcement. Styled using existing `--da-success` CSS variable.

- **Task 5-6**: Implemented `getBreakpointsForSave()` to serialize App.ts breakpoints Map into `Breakpoint[]` array. Implemented `getEditorCursorPosition()` using `editor.getMonacoEditor()?.getPosition()` to get Monaco cursor position.

- **Task 7**: Wired auto-save in App.ts - `ProjectStorage` and `AutoSaveManager` initialized as private fields. Editor `onContentChange` callback triggers `autoSaveManager.markDirty()`. `performAutoSave()` collects code, breakpoints, and cursor position into `ProjectData` and calls `projectStorage.saveProject()`. `loadSavedProject()` async method restores code and cursor position on mount. Auto-save manager cleaned up in `destroy()`.

- **Task 8**: Created comprehensive test suites: `ProjectStorage.test.ts` (42 tests) covering save/load/clear, data validation, type guards, error handling, edge cases; `AutoSaveManager.test.ts` (17 tests) covering debounce timing, dirty state tracking, immediate save, cancel, destroy. Used `fake-indexeddb` package for IndexedDB testing with proper connection cleanup.

### Code Review Fixes Applied

**Dev-time fixes:**
- Named `ProjectCursorPosition` instead of `CursorPosition` to avoid naming collision with editor's `CursorPosition` type
- Added `close()` method to `ProjectStorage` for proper database connection cleanup in tests
- Removed unused `DEFAULT_SETTINGS` import from App.ts (pre-existing issue cleaned up)
- Used `afterEach` with proper connection close + `deleteDatabase` in tests to prevent timeout issues with `fake-indexeddb`

**Post-review fixes (adversarial code review):**
- **Fix #1 (MEDIUM)**: Fixed save-on-load loop — `setValue()` triggered `onContentChange` → `markDirty()` on every page load, causing a redundant save 2s after load. Added `autoSaveManager.cancel()` after `setValue()` in `loadSavedProject()`.
- **Fix #4 (LOW)**: Removed redundant `savedAt: Date.now()` from `performAutoSave()` — `saveProject()` already overwrites it with the actual save timestamp.
- **Fix #5 (LOW)**: Changed hardcoded `font-family: 'SF Mono', ...` in `.da-save-indicator` CSS to use `var(--da-font-mono)` project CSS variable.
- **Fix #7 (LOW)**: Replaced inline arrow function `() => this.performAutoSave()` created on every keystroke with pre-bound `boundPerformAutoSave` class property.

**Documented findings (not fixed, deferred):**
- **Issue #2 (MEDIUM)**: Breakpoints are saved to IndexedDB but not restored on load. Restoration requires a source map from assembly, which doesn't exist on load. Deferred to a future story that implements auto-assemble-on-load or post-assembly breakpoint restoration.
- **Issue #3 (MEDIUM)**: No `beforeunload`/`visibilitychange` handler for save-on-close. Closing the tab during the 2s debounce loses data. Deferred because reliable async IndexedDB writes during page unload are non-trivial and need proper design.

### File List

**New Files:**
- `digital-archaeology-web/src/state/ProjectStorage.ts` - IndexedDB persistence service
- `digital-archaeology-web/src/state/ProjectStorage.test.ts` - 42 tests for project storage
- `digital-archaeology-web/src/state/AutoSaveManager.ts` - Debounced auto-save manager
- `digital-archaeology-web/src/state/AutoSaveManager.test.ts` - 17 tests for auto-save

**Modified Files:**
- `digital-archaeology-web/src/state/types.ts` - Added ProjectData, ProjectCursorPosition, Breakpoint interfaces + type guards
- `digital-archaeology-web/src/state/index.ts` - Updated barrel exports for new modules
- `digital-archaeology-web/src/ui/App.ts` - Integrated ProjectStorage, AutoSaveManager, loadSavedProject
- `digital-archaeology-web/src/ui/StatusBar.ts` - Added showSaveIndicator() method
- `digital-archaeology-web/src/styles/main.css` - Added .da-save-indicator CSS + animation
- `digital-archaeology-web/package.json` - Added fake-indexeddb dev dependency

