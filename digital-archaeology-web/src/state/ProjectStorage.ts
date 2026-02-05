// src/state/ProjectStorage.ts
// IndexedDB persistence service for project data (code, breakpoints, cursor)
// Story 9.2: Implement IndexedDB for Projects

import type { ProjectData } from './types';
import { isValidProjectData } from './types';

/** IndexedDB database name */
export const PROJECT_DB_NAME = 'digital-archaeology-projects';

/** IndexedDB database version */
export const PROJECT_DB_VERSION = 1;

/** Object store name within the database */
export const PROJECT_STORE_NAME = 'projects';

/** Key for the current (single) project - MVP uses single project */
export const CURRENT_PROJECT_KEY = 'current';

/**
 * Service for persisting project data to IndexedDB.
 * Follows the SettingsStorage.ts pattern with async operations.
 * Handles database creation, upgrades, and graceful error handling.
 */
export class ProjectStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;

  /**
   * Open or create the IndexedDB database.
   * Caches the database connection for reuse.
   * Handles version upgrades and creates object stores.
   */
  private async openDatabase(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      try {
        const request = indexedDB.open(PROJECT_DB_NAME, PROJECT_DB_VERSION);

        request.onerror = () => {
          this.dbPromise = null;
          console.error('Failed to open IndexedDB:', request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          const db = request.result;

          // Handle database connection closing unexpectedly
          db.onclose = () => {
            this.dbPromise = null;
          };

          resolve(db);
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          // Create object store if it doesn't exist
          if (!db.objectStoreNames.contains(PROJECT_STORE_NAME)) {
            db.createObjectStore(PROJECT_STORE_NAME);
          }
        };
      } catch (error) {
        this.dbPromise = null;
        reject(error);
      }
    });

    return this.dbPromise;
  }

  /**
   * Save project data to IndexedDB.
   * Automatically updates the savedAt timestamp.
   * Returns true on success, false on failure.
   */
  async saveProject(project: ProjectData): Promise<boolean> {
    try {
      const db = await this.openDatabase();
      return new Promise<boolean>((resolve) => {
        const transaction = db.transaction(PROJECT_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(PROJECT_STORE_NAME);

        // Update timestamp on save
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
          } else if (data) {
            console.warn('Invalid project data in IndexedDB, ignoring...');
            resolve(null);
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

  /**
   * Close the database connection.
   * Useful for cleanup in tests or before database deletion.
   */
  async close(): Promise<void> {
    if (this.dbPromise) {
      try {
        const db = await this.dbPromise;
        db.close();
      } catch {
        // Connection may already be closed
      }
      this.dbPromise = null;
    }
  }
}
