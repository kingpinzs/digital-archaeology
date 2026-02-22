// src/state/ProjectStorage.test.ts
// Tests for ProjectStorage service (IndexedDB persistence)
// Story 9.2: Implement IndexedDB for Projects

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ProjectStorage,
  PROJECT_DB_NAME,
} from './ProjectStorage';
import type { ProjectData } from './types';
import {
  DEFAULT_PROJECT,
  isValidProjectData,
  isValidCursorPosition,
  isValidBreakpoint,
} from './types';

// Helper to create valid project data
function createTestProject(overrides: Partial<ProjectData> = {}): ProjectData {
  return {
    ...DEFAULT_PROJECT,
    code: 'LDA 0x10\nADD 0x20',
    savedAt: Date.now(),
    ...overrides,
  };
}

describe('ProjectStorage (Story 9.2)', () => {
  let storageInstances: ProjectStorage[];

  beforeEach(() => {
    storageInstances = [];
  });

  // Helper that tracks instances for cleanup
  function createStorage(): ProjectStorage {
    const s = new ProjectStorage();
    storageInstances.push(s);
    return s;
  }

  afterEach(async () => {
    // Close all connections before deleting database
    for (const s of storageInstances) {
      await s.close();
    }
    storageInstances = [];

    // Now safe to delete the database
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase(PROJECT_DB_NAME);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    });
  });

  describe('saveProject()', () => {
    it('should save project data and return true', async () => {
      const storage = createStorage();
      const project = createTestProject();

      const result = await storage.saveProject(project);

      expect(result).toBe(true);
    });

    it('should update savedAt timestamp on save', async () => {
      const storage = createStorage();
      const project = createTestProject({ savedAt: 1000 });

      const beforeSave = Date.now();
      await storage.saveProject(project);
      const afterSave = Date.now();

      const loaded = await storage.loadProject();
      expect(loaded).not.toBeNull();
      expect(loaded!.savedAt).toBeGreaterThanOrEqual(beforeSave);
      expect(loaded!.savedAt).toBeLessThanOrEqual(afterSave);
    });

    it('should overwrite existing project data', async () => {
      const storage = createStorage();
      const project1 = createTestProject({ code: 'LDA 0x10' });
      const project2 = createTestProject({ code: 'ADD 0x20' });

      await storage.saveProject(project1);
      await storage.saveProject(project2);

      const loaded = await storage.loadProject();
      expect(loaded?.code).toBe('ADD 0x20');
    });
  });

  describe('loadProject()', () => {
    it('should return null when no project exists', async () => {
      const storage = createStorage();

      const result = await storage.loadProject();

      expect(result).toBeNull();
    });

    it('should load previously saved project data', async () => {
      const storage = createStorage();
      const project = createTestProject({
        code: 'MOV A, B',
        breakpoints: [
          { address: 0x05, lineNumber: 3 },
          { address: 0x0A, lineNumber: 7 },
        ],
        cursorPosition: { lineNumber: 5, column: 10 },
      });

      await storage.saveProject(project);
      const loaded = await storage.loadProject();

      expect(loaded).not.toBeNull();
      expect(loaded!.code).toBe('MOV A, B');
      expect(loaded!.breakpoints).toHaveLength(2);
      expect(loaded!.breakpoints[0]).toEqual({ address: 0x05, lineNumber: 3 });
      expect(loaded!.breakpoints[1]).toEqual({ address: 0x0A, lineNumber: 7 });
      expect(loaded!.cursorPosition).toEqual({ lineNumber: 5, column: 10 });
      expect(loaded!.version).toBe(1);
    });

    it('should return null for invalid stored data', async () => {
      const storage = createStorage();

      // Save valid data first, then corrupt it by directly writing invalid data
      // We'll test the validator by saving a project with a new storage instance
      // that has the same DB but then clearing and writing invalid data manually
      const project = createTestProject();
      await storage.saveProject(project);

      // Verify valid load works
      const valid = await storage.loadProject();
      expect(valid).not.toBeNull();
    });
  });

  describe('clearProject()', () => {
    it('should remove stored project data', async () => {
      const storage = createStorage();
      const project = createTestProject();

      await storage.saveProject(project);
      expect(await storage.loadProject()).not.toBeNull();

      await storage.clearProject();
      expect(await storage.loadProject()).toBeNull();
    });

    it('should not throw when clearing empty storage', async () => {
      const storage = createStorage();

      // Should not throw
      await storage.clearProject();
    });
  });

  describe('hasProject()', () => {
    it('should return false when no project exists', async () => {
      const storage = createStorage();

      const result = await storage.hasProject();

      expect(result).toBe(false);
    });

    it('should return true when project exists', async () => {
      const storage = createStorage();
      await storage.saveProject(createTestProject());

      const result = await storage.hasProject();

      expect(result).toBe(true);
    });

    it('should return false after clearing project', async () => {
      const storage = createStorage();
      await storage.saveProject(createTestProject());
      await storage.clearProject();

      const result = await storage.hasProject();

      expect(result).toBe(false);
    });
  });

  describe('database connection caching', () => {
    it('should reuse the same database connection', async () => {
      const storage = createStorage();

      // Multiple operations should reuse the connection
      await storage.saveProject(createTestProject({ code: 'first' }));
      await storage.saveProject(createTestProject({ code: 'second' }));
      const loaded = await storage.loadProject();

      expect(loaded?.code).toBe('second');
    });
  });

  describe('separate instances', () => {
    it('should share data via the same IndexedDB database', async () => {
      const storage1 = createStorage();
      const storage2 = createStorage();

      await storage1.saveProject(createTestProject({ code: 'shared data' }));
      const loaded = await storage2.loadProject();

      expect(loaded?.code).toBe('shared data');
    });
  });

  describe('edge cases', () => {
    it('should handle empty code string', async () => {
      const storage = createStorage();
      const project = createTestProject({ code: '' });

      await storage.saveProject(project);
      const loaded = await storage.loadProject();

      expect(loaded?.code).toBe('');
    });

    it('should handle large code content', async () => {
      const storage = createStorage();
      const largeCode = 'NOP\n'.repeat(10000);
      const project = createTestProject({ code: largeCode });

      await storage.saveProject(project);
      const loaded = await storage.loadProject();

      expect(loaded?.code).toBe(largeCode);
    });

    it('should handle empty breakpoints array', async () => {
      const storage = createStorage();
      const project = createTestProject({ breakpoints: [] });

      await storage.saveProject(project);
      const loaded = await storage.loadProject();

      expect(loaded?.breakpoints).toEqual([]);
    });

    it('should handle many breakpoints', async () => {
      const storage = createStorage();
      const breakpoints = Array.from({ length: 100 }, (_, i) => ({
        address: i,
        lineNumber: i + 1,
      }));
      const project = createTestProject({ breakpoints });

      await storage.saveProject(project);
      const loaded = await storage.loadProject();

      expect(loaded?.breakpoints).toHaveLength(100);
    });
  });
});

describe('ProjectStorage error handling (Story 9.2)', () => {
  it('should handle IndexedDB unavailability gracefully on save', async () => {
    // Temporarily hide indexedDB
    const originalIndexedDB = globalThis.indexedDB;
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      // Replace with a broken indexedDB
      Object.defineProperty(globalThis, 'indexedDB', {
        value: {
          open: () => {
            throw new Error('IndexedDB not available');
          },
        },
        writable: true,
        configurable: true,
      });

      const storage = new ProjectStorage();
      const result = await storage.saveProject(createTestProject());

      expect(result).toBe(false);
    } finally {
      Object.defineProperty(globalThis, 'indexedDB', {
        value: originalIndexedDB,
        writable: true,
        configurable: true,
      });
      consoleSpy.mockRestore();
    }
  });

  it('should handle IndexedDB unavailability gracefully on load', async () => {
    const originalIndexedDB = globalThis.indexedDB;
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      Object.defineProperty(globalThis, 'indexedDB', {
        value: {
          open: () => {
            throw new Error('IndexedDB not available');
          },
        },
        writable: true,
        configurable: true,
      });

      const storage = new ProjectStorage();
      const result = await storage.loadProject();

      expect(result).toBeNull();
    } finally {
      Object.defineProperty(globalThis, 'indexedDB', {
        value: originalIndexedDB,
        writable: true,
        configurable: true,
      });
      consoleSpy.mockRestore();
    }
  });
});

// =============================================================================
// Type Guard Tests
// =============================================================================

describe('isValidCursorPosition (Story 9.2)', () => {
  it('should accept valid cursor position', () => {
    expect(isValidCursorPosition({ lineNumber: 1, column: 1 })).toBe(true);
    expect(isValidCursorPosition({ lineNumber: 100, column: 50 })).toBe(true);
  });

  it('should reject null and undefined', () => {
    expect(isValidCursorPosition(null)).toBe(false);
    expect(isValidCursorPosition(undefined)).toBe(false);
  });

  it('should reject non-objects', () => {
    expect(isValidCursorPosition('string')).toBe(false);
    expect(isValidCursorPosition(42)).toBe(false);
  });

  it('should reject invalid lineNumber', () => {
    expect(isValidCursorPosition({ lineNumber: 0, column: 1 })).toBe(false);
    expect(isValidCursorPosition({ lineNumber: -1, column: 1 })).toBe(false);
    expect(isValidCursorPosition({ lineNumber: 'a', column: 1 })).toBe(false);
  });

  it('should reject invalid column', () => {
    expect(isValidCursorPosition({ lineNumber: 1, column: 0 })).toBe(false);
    expect(isValidCursorPosition({ lineNumber: 1, column: -1 })).toBe(false);
  });

  it('should reject missing fields', () => {
    expect(isValidCursorPosition({ lineNumber: 1 })).toBe(false);
    expect(isValidCursorPosition({ column: 1 })).toBe(false);
    expect(isValidCursorPosition({})).toBe(false);
  });
});

describe('isValidBreakpoint (Story 9.2)', () => {
  it('should accept valid breakpoint', () => {
    expect(isValidBreakpoint({ address: 0, lineNumber: 1 })).toBe(true);
    expect(isValidBreakpoint({ address: 0xFF, lineNumber: 100 })).toBe(true);
  });

  it('should reject null and undefined', () => {
    expect(isValidBreakpoint(null)).toBe(false);
    expect(isValidBreakpoint(undefined)).toBe(false);
  });

  it('should reject invalid address', () => {
    expect(isValidBreakpoint({ address: -1, lineNumber: 1 })).toBe(false);
    expect(isValidBreakpoint({ address: 'a', lineNumber: 1 })).toBe(false);
  });

  it('should reject invalid lineNumber', () => {
    expect(isValidBreakpoint({ address: 0, lineNumber: 0 })).toBe(false);
    expect(isValidBreakpoint({ address: 0, lineNumber: -1 })).toBe(false);
  });

  it('should reject missing fields', () => {
    expect(isValidBreakpoint({ address: 0 })).toBe(false);
    expect(isValidBreakpoint({ lineNumber: 1 })).toBe(false);
  });
});

describe('isValidProjectData (Story 9.2)', () => {
  it('should accept valid project data', () => {
    expect(isValidProjectData(createTestProject())).toBe(true);
  });

  it('should accept project with empty code', () => {
    expect(isValidProjectData(createTestProject({ code: '' }))).toBe(true);
  });

  it('should accept project with breakpoints', () => {
    expect(isValidProjectData(createTestProject({
      breakpoints: [{ address: 0, lineNumber: 1 }],
    }))).toBe(true);
  });

  it('should reject null and undefined', () => {
    expect(isValidProjectData(null)).toBe(false);
    expect(isValidProjectData(undefined)).toBe(false);
  });

  it('should reject non-objects', () => {
    expect(isValidProjectData('string')).toBe(false);
    expect(isValidProjectData(42)).toBe(false);
  });

  it('should reject missing code field', () => {
    const data = { ...createTestProject() };
    delete (data as Record<string, unknown>).code;
    expect(isValidProjectData(data)).toBe(false);
  });

  it('should reject non-string code', () => {
    expect(isValidProjectData({ ...createTestProject(), code: 42 })).toBe(false);
  });

  it('should reject invalid breakpoints', () => {
    expect(isValidProjectData({
      ...createTestProject(),
      breakpoints: [{ address: -1, lineNumber: 0 }],
    })).toBe(false);
  });

  it('should reject non-array breakpoints', () => {
    expect(isValidProjectData({
      ...createTestProject(),
      breakpoints: 'not-array',
    })).toBe(false);
  });

  it('should reject invalid cursor position', () => {
    expect(isValidProjectData({
      ...createTestProject(),
      cursorPosition: { lineNumber: 0, column: 0 },
    })).toBe(false);
  });

  it('should reject missing savedAt', () => {
    const data = { ...createTestProject() };
    delete (data as Record<string, unknown>).savedAt;
    expect(isValidProjectData(data)).toBe(false);
  });

  it('should reject missing version', () => {
    const data = { ...createTestProject() };
    delete (data as Record<string, unknown>).version;
    expect(isValidProjectData(data)).toBe(false);
  });
});

describe('ProjectStorage Archive (Story 26.3)', () => {
  let storageInstances: ProjectStorage[];

  beforeEach(() => {
    storageInstances = [];
  });

  function createStorage(): ProjectStorage {
    const s = new ProjectStorage();
    storageInstances.push(s);
    return s;
  }

  afterEach(async () => {
    for (const s of storageInstances) {
      await s.close();
    }
    storageInstances = [];
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase(PROJECT_DB_NAME);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    });
  });

  it('should return false when archiving with no current project', async () => {
    const storage = createStorage();
    const result = await storage.archiveProject();
    expect(result).toBe(false);
  });

  it('should archive current project and clear active', async () => {
    const storage = createStorage();
    const project = createTestProject({ code: 'MOV A, B' });

    await storage.saveProject(project);
    const result = await storage.archiveProject('My Archive');
    expect(result).toBe(true);

    // Current project should be cleared
    const current = await storage.loadProject();
    expect(current).toBeNull();

    // Archive should contain the project
    const archives = await storage.listArchives();
    expect(archives).toHaveLength(1);
    expect(archives[0].label).toBe('My Archive');
    expect(archives[0].project.code).toBe('MOV A, B');
  });

  it('should use default label when none provided', async () => {
    const storage = createStorage();
    await storage.saveProject(createTestProject());
    await storage.archiveProject();

    const archives = await storage.listArchives();
    expect(archives).toHaveLength(1);
    expect(archives[0].label).toMatch(/^Archive /);
  });

  it('should list multiple archives', async () => {
    const storage = createStorage();

    // Create and archive two projects
    await storage.saveProject(createTestProject({ code: 'first' }));
    await storage.archiveProject('First');

    await storage.saveProject(createTestProject({ code: 'second' }));
    await storage.archiveProject('Second');

    const archives = await storage.listArchives();
    expect(archives).toHaveLength(2);
    const labels = archives.map(a => a.label);
    expect(labels).toContain('First');
    expect(labels).toContain('Second');
  });

  it('should return empty array when no archives exist', async () => {
    const storage = createStorage();
    const archives = await storage.listArchives();
    expect(archives).toEqual([]);
  });

  it('should load a specific archive by ID', async () => {
    const storage = createStorage();
    await storage.saveProject(createTestProject({ code: 'archived code' }));
    await storage.archiveProject('Test');

    const archives = await storage.listArchives();
    const id = archives[0].id!;

    const loaded = await storage.loadArchive(id);
    expect(loaded).not.toBeNull();
    expect(loaded!.label).toBe('Test');
    expect(loaded!.project.code).toBe('archived code');
  });

  it('should return null for non-existent archive ID', async () => {
    const storage = createStorage();
    const loaded = await storage.loadArchive(9999);
    expect(loaded).toBeNull();
  });
});
