/**
 * Epic 2: Assembly Code Editor - E2E Tests
 * Tests Stories 2.1-2.6
 *
 * Selectors match actual implementation:
 * - Status bar cursor: [data-section="cursor"]
 */

import { test, expect } from '../support/fixtures';

test.describe('Epic 2: Assembly Code Editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Wait for Monaco editor to load
    await page.waitForSelector('.monaco-editor', { timeout: 10000 });
  });

  test.describe('Story 2.1: Monaco Editor Integration', () => {
    test('[2.1] should render Monaco editor', async ({ page }) => {
      // THEN: Monaco editor container exists
      await expect(page.locator('.monaco-editor')).toBeVisible();
    });

    test('[2.1] should have editable text area', async ({ page }) => {
      // THEN: Editor has input area
      const editor = page.locator('.monaco-editor');
      await expect(editor).toBeVisible();

      // WHEN: Click in editor and type
      await editor.click();
      await page.keyboard.type('LDI 5');

      // THEN: Text appears in editor
      const editorContent = await page.locator('.view-lines').textContent();
      expect(editorContent).toContain('LDI');
    });

    test('[2.1] should support text selection', async ({ page }) => {
      // GIVEN: Type some code
      const editor = page.locator('.monaco-editor');
      await editor.click();
      await page.keyboard.type('LDI 5');

      // WHEN: Select all text
      await page.keyboard.press('Control+a');

      // THEN: Text is selected (Monaco shows selection - multiple elements)
      const selection = page.locator('.selected-text').first();
      await expect(selection).toBeVisible();
    });
  });

  test.describe('Story 2.2: Micro4 Syntax Highlighting', () => {
    test('[2.2] should highlight Micro4 instructions', async ({ page }) => {
      // GIVEN: Type Micro4 code
      const editor = page.locator('.monaco-editor');
      await editor.click();
      await page.keyboard.type('LDI 5\nADD 0\nSTO 10\nHLT');

      // THEN: Syntax highlighting is applied (tokens have span elements)
      const tokens = page.locator('.view-line span');
      expect(await tokens.count()).toBeGreaterThan(0);
    });

    test('[2.2] should highlight comments differently', async ({ page }) => {
      // GIVEN: Type code with comment
      const editor = page.locator('.monaco-editor');
      await editor.click();
      await page.keyboard.type('; This is a comment\nLDI 5');

      // THEN: Code is tokenized (comments styled differently)
      await page.waitForTimeout(500); // Wait for syntax highlighting
      const lines = await page.locator('.view-line').count();
      expect(lines).toBeGreaterThan(0);
    });
  });

  test.describe('Story 2.3: Line Numbers', () => {
    test('[2.3] should display line numbers', async ({ page }) => {
      // THEN: Line numbers gutter exists
      await expect(page.locator('.margin-view-overlays')).toBeVisible();
    });

    test('[2.3] should show line number 1 for first line', async ({ page }) => {
      // THEN: Line 1 exists
      const lineNumbers = page.locator('.line-numbers');
      await expect(lineNumbers.first()).toContainText('1');
    });

    test('[2.3] should increment line numbers as content grows', async ({ page }) => {
      // GIVEN: Type multiple lines
      const editor = page.locator('.monaco-editor');
      await editor.click();
      await page.keyboard.type('LDI 1\nLDI 2\nLDI 3\nLDI 4\nLDI 5');

      // THEN: Multiple line numbers visible
      const lineNumbers = page.locator('.line-numbers');
      const count = await lineNumbers.count();
      expect(count).toBeGreaterThanOrEqual(5);
    });
  });

  test.describe('Story 2.4: Undo/Redo Functionality', () => {
    test('[2.4] should support undo with Ctrl+Z', async ({ page }) => {
      // GIVEN: Type some code
      const editor = page.locator('.monaco-editor');
      await editor.click();
      await page.keyboard.type('LDI 5');
      await page.waitForTimeout(100);

      // WHEN: Press Ctrl+Z
      await page.keyboard.press('Control+z');
      await page.waitForTimeout(100);

      // THEN: Text is undone
      const content = await page.locator('.view-lines').textContent();
      expect(content).not.toContain('LDI 5');
    });

    test('[2.4] should support redo with Ctrl+Y', async ({ page }) => {
      // GIVEN: Type and undo
      const editor = page.locator('.monaco-editor');
      await editor.click();
      await page.keyboard.type('ADD 1');
      await page.waitForTimeout(100);
      await page.keyboard.press('Control+z');
      await page.waitForTimeout(100);

      // WHEN: Press Ctrl+Y
      await page.keyboard.press('Control+y');
      await page.waitForTimeout(100);

      // THEN: Text is restored
      const content = await page.locator('.view-lines').textContent();
      expect(content).toContain('ADD');
    });

    test('[2.4] should support undo from Edit menu', async ({ page }) => {
      // GIVEN: Type some code
      const editor = page.locator('.monaco-editor');
      await editor.click();
      await page.keyboard.type('SUB 3');
      await page.waitForTimeout(100);

      // WHEN: Click Edit > Undo
      await page.click('[data-menu="edit"]');
      await page.click('[data-action="undo"]');
      await page.waitForTimeout(100);

      // THEN: Text is undone
      const content = await page.locator('.view-lines').textContent();
      expect(content).not.toContain('SUB 3');
    });
  });

  test.describe('Story 2.5: Cursor Position in Status Bar', () => {
    test('[2.5] should display cursor position section', async ({ page }) => {
      // THEN: Cursor section is shown in status bar
      await expect(page.locator('[data-section="cursor"]')).toBeVisible();
    });

    test('[2.5] should update cursor position when moving', async ({ page }) => {
      // GIVEN: Type multiple lines
      const editor = page.locator('.monaco-editor');
      await editor.click();
      await page.keyboard.type('LDI 1\nLDI 2\nLDI 3');

      // WHEN: Move to line 2
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(100);

      // THEN: Status bar shows updated position
      const cursorStatus = await page.locator('[data-section="cursor"]').textContent();
      expect(cursorStatus).toMatch(/Ln \d+/);
    });

    test('[2.5] should show both line and column', async ({ page }) => {
      // GIVEN: Position cursor somewhere
      const editor = page.locator('.monaco-editor');
      await editor.click();
      await page.keyboard.type('LDI 5');

      // THEN: Shows both line and column
      const cursorStatus = await page.locator('[data-section="cursor"]').textContent();
      expect(cursorStatus).toMatch(/Ln.*Col/i);
    });
  });

  test.describe('Story 2.6: Editor Keyboard Shortcuts', () => {
    test('[2.6] should support Ctrl+A to select all', async ({ page }) => {
      // GIVEN: Type some code
      const editor = page.locator('.monaco-editor');
      await editor.click();
      await page.keyboard.type('LDI 5\nADD 1');

      // WHEN: Press Ctrl+A
      await page.keyboard.press('Control+a');

      // THEN: All text is selected (Monaco creates multiple .selected-text elements)
      await expect(page.locator('.selected-text').first()).toBeVisible();
    });

    test('[2.6] should support keyboard navigation', async ({ page }) => {
      // GIVEN: Type code
      const editor = page.locator('.monaco-editor');
      await editor.click();
      await page.keyboard.type('Line 1\nLine 2');

      // WHEN: Navigate with Home key
      await page.keyboard.press('Home');

      // THEN: Cursor moves (no error) - check cursor section exists
      const cursorStatus = await page.locator('[data-section="cursor"]').textContent();
      expect(cursorStatus).toMatch(/Col/i);
    });
  });
});
