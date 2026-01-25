// src/builder/BuilderStorage.ts
// Persistence layer for circuits and user progress
// Uses IndexedDB for circuits and localStorage for progress

import type { BuilderCircuit, UserProgress } from './types';

/**
 * Storage keys for localStorage.
 */
const STORAGE_KEYS = {
  PROGRESS: 'da-builder-progress',
  RECENT_CIRCUITS: 'da-builder-recent',
  SETTINGS: 'da-builder-settings',
} as const;

/**
 * IndexedDB configuration.
 */
const DB_NAME = 'digital-archaeology-builder';
const DB_VERSION = 1;
const CIRCUITS_STORE = 'circuits';
const USER_GATES_STORE = 'userGates';

/**
 * Circuit metadata for listing.
 */
export interface CircuitMetadata {
  id: string;
  name: string;
  era: string;
  createdAt: number;
  modifiedAt: number;
  componentCount: number;
  wireCount: number;
}

/**
 * Builder settings.
 */
export interface BuilderSettings {
  gridSize: number;
  snapToGrid: boolean;
  autoSimulate: boolean;
  animationEnabled: boolean;
  showPortLabels: boolean;
}

/**
 * Default settings.
 */
const DEFAULT_SETTINGS: BuilderSettings = {
  gridSize: 20,
  snapToGrid: true,
  autoSimulate: true,
  animationEnabled: true,
  showPortLabels: false,
};

/**
 * BuilderStorage handles persistence for circuits and progress.
 */
export class BuilderStorage {
  private db: IDBDatabase | null = null;
  private dbReady: Promise<void>;
  private resolveDbReady!: () => void;
  private rejectDbReady!: (error: Error) => void;

  constructor() {
    this.dbReady = new Promise((resolve, reject) => {
      this.resolveDbReady = resolve;
      this.rejectDbReady = reject;
    });
  }

  /**
   * Initialize storage (open IndexedDB).
   */
  async initialize(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        const error = new Error('Failed to open IndexedDB');
        this.rejectDbReady(error);
        reject(error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.resolveDbReady();
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create circuits store
        if (!db.objectStoreNames.contains(CIRCUITS_STORE)) {
          const circuitsStore = db.createObjectStore(CIRCUITS_STORE, { keyPath: 'id' });
          circuitsStore.createIndex('name', 'name', { unique: false });
          circuitsStore.createIndex('modifiedAt', 'modifiedAt', { unique: false });
          circuitsStore.createIndex('era', 'era', { unique: false });
        }

        // Create user gates store
        if (!db.objectStoreNames.contains(USER_GATES_STORE)) {
          const gatesStore = db.createObjectStore(USER_GATES_STORE, { keyPath: 'id' });
          gatesStore.createIndex('name', 'name', { unique: false });
        }
      };
    });
  }

  /**
   * Wait for database to be ready.
   */
  private async waitForDb(): Promise<IDBDatabase> {
    await this.dbReady;
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  // ============================================================================
  // Circuit Storage (IndexedDB)
  // ============================================================================

  /**
   * Save a circuit.
   */
  async saveCircuit(circuit: BuilderCircuit): Promise<void> {
    const db = await this.waitForDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CIRCUITS_STORE], 'readwrite');
      const store = transaction.objectStore(CIRCUITS_STORE);

      // Ensure modifiedAt is updated
      circuit.modifiedAt = Date.now();

      const request = store.put(circuit);

      request.onerror = () => reject(new Error('Failed to save circuit'));
      request.onsuccess = () => {
        this.addToRecentCircuits(circuit.id);
        resolve();
      };
    });
  }

  /**
   * Load a circuit by ID.
   */
  async loadCircuit(id: string): Promise<BuilderCircuit | null> {
    const db = await this.waitForDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CIRCUITS_STORE], 'readonly');
      const store = transaction.objectStore(CIRCUITS_STORE);
      const request = store.get(id);

      request.onerror = () => reject(new Error('Failed to load circuit'));
      request.onsuccess = () => {
        const circuit = request.result as BuilderCircuit | undefined;
        resolve(circuit ?? null);
      };
    });
  }

  /**
   * Delete a circuit.
   */
  async deleteCircuit(id: string): Promise<void> {
    const db = await this.waitForDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CIRCUITS_STORE], 'readwrite');
      const store = transaction.objectStore(CIRCUITS_STORE);
      const request = store.delete(id);

      request.onerror = () => reject(new Error('Failed to delete circuit'));
      request.onsuccess = () => {
        this.removeFromRecentCircuits(id);
        resolve();
      };
    });
  }

  /**
   * List all circuits.
   */
  async listCircuits(): Promise<CircuitMetadata[]> {
    const db = await this.waitForDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CIRCUITS_STORE], 'readonly');
      const store = transaction.objectStore(CIRCUITS_STORE);
      const index = store.index('modifiedAt');
      const request = index.openCursor(null, 'prev'); // Most recent first

      const circuits: CircuitMetadata[] = [];

      request.onerror = () => reject(new Error('Failed to list circuits'));

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const circuit = cursor.value as BuilderCircuit;
          circuits.push({
            id: circuit.id,
            name: circuit.name,
            era: circuit.era,
            createdAt: circuit.createdAt ?? 0,
            modifiedAt: circuit.modifiedAt ?? 0,
            componentCount: circuit.components.length,
            wireCount: circuit.wires.length,
          });
          cursor.continue();
        } else {
          resolve(circuits);
        }
      };
    });
  }

  /**
   * Search circuits by name.
   */
  async searchCircuits(query: string): Promise<CircuitMetadata[]> {
    const all = await this.listCircuits();
    const lowerQuery = query.toLowerCase();
    return all.filter((c) => c.name.toLowerCase().includes(lowerQuery));
  }

  // ============================================================================
  // User Gates (IndexedDB)
  // ============================================================================

  /**
   * Save a user-created gate.
   */
  async saveUserGate(circuit: BuilderCircuit): Promise<void> {
    const db = await this.waitForDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([USER_GATES_STORE], 'readwrite');
      const store = transaction.objectStore(USER_GATES_STORE);
      const request = store.put(circuit);

      request.onerror = () => reject(new Error('Failed to save user gate'));
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Load a user gate by ID.
   */
  async loadUserGate(id: string): Promise<BuilderCircuit | null> {
    const db = await this.waitForDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([USER_GATES_STORE], 'readonly');
      const store = transaction.objectStore(USER_GATES_STORE);
      const request = store.get(id);

      request.onerror = () => reject(new Error('Failed to load user gate'));
      request.onsuccess = () => {
        const gate = request.result as BuilderCircuit | undefined;
        resolve(gate ?? null);
      };
    });
  }

  /**
   * Delete a user gate.
   */
  async deleteUserGate(id: string): Promise<void> {
    const db = await this.waitForDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([USER_GATES_STORE], 'readwrite');
      const store = transaction.objectStore(USER_GATES_STORE);
      const request = store.delete(id);

      request.onerror = () => reject(new Error('Failed to delete user gate'));
      request.onsuccess = () => resolve();
    });
  }

  /**
   * List all user gates.
   */
  async listUserGates(): Promise<CircuitMetadata[]> {
    const db = await this.waitForDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([USER_GATES_STORE], 'readonly');
      const store = transaction.objectStore(USER_GATES_STORE);
      const request = store.getAll();

      request.onerror = () => reject(new Error('Failed to list user gates'));
      request.onsuccess = () => {
        const gates = (request.result as BuilderCircuit[]).map((circuit) => ({
          id: circuit.id,
          name: circuit.name,
          era: circuit.era,
          createdAt: circuit.createdAt ?? 0,
          modifiedAt: circuit.modifiedAt ?? 0,
          componentCount: circuit.components.length,
          wireCount: circuit.wires.length,
        }));
        resolve(gates);
      };
    });
  }

  // ============================================================================
  // Progress (localStorage)
  // ============================================================================

  /**
   * Save user progress.
   */
  saveProgress(progress: UserProgress): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }

  /**
   * Load user progress.
   */
  loadProgress(): UserProgress | null {
    try {
      const json = localStorage.getItem(STORAGE_KEYS.PROGRESS);
      if (json) {
        return JSON.parse(json) as UserProgress;
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
    return null;
  }

  /**
   * Clear user progress.
   */
  clearProgress(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.PROGRESS);
    } catch (error) {
      console.error('Failed to clear progress:', error);
    }
  }

  // ============================================================================
  // Recent Circuits (localStorage)
  // ============================================================================

  /**
   * Get recent circuit IDs.
   */
  getRecentCircuits(): string[] {
    try {
      const json = localStorage.getItem(STORAGE_KEYS.RECENT_CIRCUITS);
      if (json) {
        return JSON.parse(json) as string[];
      }
    } catch (error) {
      console.error('Failed to get recent circuits:', error);
    }
    return [];
  }

  /**
   * Add a circuit to recents.
   */
  private addToRecentCircuits(id: string): void {
    try {
      let recent = this.getRecentCircuits();
      // Remove if already exists
      recent = recent.filter((r) => r !== id);
      // Add to front
      recent.unshift(id);
      // Limit to 10
      recent = recent.slice(0, 10);
      localStorage.setItem(STORAGE_KEYS.RECENT_CIRCUITS, JSON.stringify(recent));
    } catch (error) {
      console.error('Failed to update recent circuits:', error);
    }
  }

  /**
   * Remove a circuit from recents.
   */
  private removeFromRecentCircuits(id: string): void {
    try {
      let recent = this.getRecentCircuits();
      recent = recent.filter((r) => r !== id);
      localStorage.setItem(STORAGE_KEYS.RECENT_CIRCUITS, JSON.stringify(recent));
    } catch (error) {
      console.error('Failed to remove from recent circuits:', error);
    }
  }

  // ============================================================================
  // Settings (localStorage)
  // ============================================================================

  /**
   * Save settings.
   */
  saveSettings(settings: BuilderSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  /**
   * Load settings.
   */
  loadSettings(): BuilderSettings {
    try {
      const json = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (json) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(json) };
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
    return { ...DEFAULT_SETTINGS };
  }

  /**
   * Reset settings to defaults.
   */
  resetSettings(): void {
    this.saveSettings(DEFAULT_SETTINGS);
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  /**
   * Close the database connection.
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Clear all data (for testing/reset).
   */
  async clearAll(): Promise<void> {
    // Clear localStorage
    localStorage.removeItem(STORAGE_KEYS.PROGRESS);
    localStorage.removeItem(STORAGE_KEYS.RECENT_CIRCUITS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);

    // Clear IndexedDB
    const db = await this.waitForDb();

    await Promise.all([
      new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([CIRCUITS_STORE], 'readwrite');
        const request = transaction.objectStore(CIRCUITS_STORE).clear();
        request.onerror = () => reject(new Error('Failed to clear circuits'));
        request.onsuccess = () => resolve();
      }),
      new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([USER_GATES_STORE], 'readwrite');
        const request = transaction.objectStore(USER_GATES_STORE).clear();
        request.onerror = () => reject(new Error('Failed to clear user gates'));
        request.onsuccess = () => resolve();
      }),
    ]);
  }
}
