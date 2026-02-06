/**
 * Epic 9: Work Persistence - E2E Tests
 * Tests Stories 9.1-9.8
 *
 * Covers the critical persistence gap identified in Epic 9 retrospective:
 * - Auto-save with IndexedDB round-trip (E2E-007)
 * - File export/import round-trip (E2E-008)
 * - Unsaved work warning (E2E-009)
 * - Auto-save debounce timing
 * - File menu keyboard shortcuts
 *
 * Selectors match actual implementation:
 * - File menu trigger: [data-menu="file"]
 * - Menu items: [data-action="new"], [data-action="save"], [data-action="exportAssembly"], [data-action="import"]
 * - Save indicator: .da-save-indicator
 * - Editor: .monaco-editor
 */

import { test, expect } from '../support/fixtures';

test.describe('Epic 9: Work Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.monaco-editor', { timeout: 10000 });
  });

  // Helper to type code into the Monaco editor
  async function typeInEditor(page: import('@playwright/test').Page, code: string) {
    const editor = page.locator('.monaco-editor');
    await editor.click();
    // Select all existing content first to replace it
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.type(code);
  }

  // Helper to open File menu
  async function openFileMenu(page: import('@playwright/test').Page) {
    await page.locator('[data-menu="file"]').click();
    await page.waitForSelector('.da-menu-dropdown', { timeout: 2000 });
  }

  test.describe('Story 9.1-9.3: Save and Restore Session (E2E-007)', () => {
    test('[9.3] should save code and restore after page reload', async ({ page }) => {
      // GIVEN: Type code in the editor
      const testCode = 'LDI 7\nADD 3\nSTA 0xF\nHLT';
      await typeInEditor(page, testCode);

      // WHEN: Wait for auto-save debounce (2s) plus buffer
      await page.waitForTimeout(3000);

      // Verify save indicator appeared
      const saveIndicator = page.locator('.da-save-indicator');
      // Indicator may have already disappeared, so just check save happened by reloading

      // WHEN: Reload the page
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('.monaco-editor', { timeout: 10000 });

      // THEN: Code should be restored
      // Wait for session restore indicator
      await page.waitForTimeout(1000);
      const editorContent = await page.locator('.view-lines').textContent();
      expect(editorContent).toContain('LDI');
      expect(editorContent).toContain('HLT');
    });

    test('[9.3] should show session restored indicator after reload', async ({ page }) => {
      // GIVEN: Type code and wait for auto-save
      await typeInEditor(page, 'LDI 1\nHLT');
      await page.waitForTimeout(3000);

      // WHEN: Reload the page
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('.monaco-editor', { timeout: 10000 });

      // THEN: Session restored indicator should appear
      const indicator = page.locator('.da-save-indicator');
      await expect(indicator).toBeVisible({ timeout: 3000 });
      await expect(indicator).toHaveText('Session restored');
    });
  });

  test.describe('Story 9.4-9.6: Export and Import (E2E-008)', () => {
    test('[9.4] should export assembly file via File menu', async ({ page }) => {
      // GIVEN: Type code in editor
      await typeInEditor(page, 'LDI 5\nADD 3\nHLT');
      await page.waitForTimeout(500);

      // WHEN: Export via File menu
      const downloadPromise = page.waitForEvent('download');
      await openFileMenu(page);
      await page.locator('.da-menu-dropdown [data-action="exportAssembly"]').click();
      const download = await downloadPromise;

      // THEN: File should download with .asm extension
      expect(download.suggestedFilename()).toMatch(/\.asm$/);
    });

    test('[9.6] should import assembly file and display content', async ({ page }) => {
      // GIVEN: Create a file to import using fileChooser
      const fileContent = 'LDI 9\nSUB 2\nHLT';

      // Handle any confirmation dialog (unsaved changes) - must register BEFORE click
      page.on('dialog', dialog => dialog.accept());

      // WHEN: Trigger import via File menu
      const fileChooserPromise = page.waitForEvent('filechooser');
      await openFileMenu(page);
      await page.locator('.da-menu-dropdown [data-action="import"]').click();

      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles({
        name: 'test-program.asm',
        mimeType: 'text/plain',
        buffer: Buffer.from(fileContent),
      });

      // THEN: Editor should contain the imported code
      await page.waitForTimeout(500);
      const editorContent = await page.locator('.view-lines').textContent();
      expect(editorContent).toContain('LDI');
      expect(editorContent).toContain('SUB');
    });
  });

  test.describe('Story 9.7: Unsaved Work Warning (E2E-009)', () => {
    test('[9.7] should show confirmation when creating new file with unsaved changes', async ({ page }) => {
      // GIVEN: Type code (creates unsaved changes)
      await typeInEditor(page, 'LDI 42\nHLT');
      await page.waitForTimeout(500);

      // WHEN: Attempt to create new file via File menu
      let dialogMessage = '';
      page.on('dialog', async dialog => {
        dialogMessage = dialog.message();
        await dialog.dismiss(); // Cancel to keep current content
      });

      await openFileMenu(page);
      await page.locator('.da-menu-dropdown [data-action="new"]').click();
      await page.waitForTimeout(500);

      // THEN: Confirmation dialog should have appeared
      expect(dialogMessage).toContain('Creating a new file');
      expect(dialogMessage).toContain('Are you sure');
    });

    test('[9.7] should warn on beforeunload with unsaved changes', async ({ page }) => {
      // GIVEN: Type code (creates unsaved changes)
      await typeInEditor(page, 'LDI 99\nHLT');
      await page.waitForTimeout(200);

      // WHEN: Check if beforeunload handler is registered
      const hasBeforeUnload = await page.evaluate(() => {
        // Trigger a synthetic beforeunload to check if it's handled
        const event = new Event('beforeunload', { cancelable: true });
        const result = window.dispatchEvent(event);
        // If preventDefault was called, dispatchEvent returns false
        return !result || event.defaultPrevented;
      });

      // THEN: beforeunload handler should have called preventDefault
      expect(hasBeforeUnload).toBe(true);
    });
  });

  test.describe('Story 9.1: Auto-save Debounce', () => {
    test('[9.1] should show save indicator after auto-save completes', async ({ page }) => {
      // GIVEN: Type code
      await typeInEditor(page, 'LDI 3\nHLT');

      // WHEN: Wait for auto-save debounce (2s) plus render time
      await page.waitForTimeout(2500);

      // THEN: Save indicator should appear (or have appeared)
      const indicator = page.locator('.da-save-indicator');
      // The indicator shows briefly then fades - check it appeared
      await expect(indicator).toBeVisible({ timeout: 2000 });
    });
  });

  test.describe('Story 9.8: File Menu Keyboard Shortcuts', () => {
    test('[9.8] should trigger save on Ctrl+S', async ({ page }) => {
      // GIVEN: Type code
      await typeInEditor(page, 'LDI 5\nHLT');
      await page.waitForTimeout(200);

      // WHEN: Press Ctrl+S
      await page.keyboard.press('ControlOrMeta+s');
      await page.waitForTimeout(500);

      // THEN: Save indicator should appear
      const indicator = page.locator('.da-save-indicator');
      await expect(indicator).toBeVisible({ timeout: 2000 });
    });

    test('[9.8] should trigger new file on Ctrl+N with confirmation', async ({ page }) => {
      // GIVEN: Type code (unsaved changes)
      await typeInEditor(page, 'LDI 42\nHLT');
      await page.waitForTimeout(200);

      // Set up dialog handler before keyboard shortcut
      let dialogShown = false;
      page.on('dialog', async dialog => {
        dialogShown = true;
        await dialog.dismiss(); // Cancel to keep content
      });

      // WHEN: Press Ctrl+N
      await page.keyboard.press('ControlOrMeta+n');
      await page.waitForTimeout(500);

      // THEN: Should show unsaved changes dialog
      expect(dialogShown).toBe(true);
    });

    test('[9.8] should trigger open/load on Ctrl+O', async ({ page }) => {
      // GIVEN: Type code and save it first so there's a project to load
      await typeInEditor(page, 'LDI 77\nHLT');
      await page.keyboard.press('ControlOrMeta+s');
      await page.waitForTimeout(1000);

      // Clear editor to verify load works
      await typeInEditor(page, '');
      await page.waitForTimeout(200);

      // WHEN: Press Ctrl+O (loads saved project from IndexedDB, not a file chooser)
      page.on('dialog', async dialog => {
        await dialog.accept();
      });
      await page.keyboard.press('ControlOrMeta+o');
      await page.waitForTimeout(1000);

      // THEN: Saved code should be restored from IndexedDB
      const editorContent = await page.locator('.view-lines').textContent();
      expect(editorContent).toContain('LDI');
    });
  });
});
